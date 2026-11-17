// Kais push: ekip üyelerine telefon bildirimi gönderir.
// Gerekli sırlar: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (kais-cron'dakilerle aynı).
// Yükleme: supabase functions deploy kais-push   (JWT doğrulaması AÇIK kalsın)
// Not: action "order_notify" ve "report_now" bu sürümde kapalı; uygulama bunlar için hata gösterir.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SB_SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const VPUB = (Deno.env.get('VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC') || '');
const VPRIV = (Deno.env.get('VAPID_PRIVATE_KEY') || Deno.env.get('VAPID_PRIVATE') || '');
const VSUB = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';
if (VPUB && VPRIV) webpush.setVapidDetails(VSUB, VPUB, VPRIV);

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return J({ ok: false, error: 'Yalnızca POST.' }, 405);
  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/.test(auth)) return J({ ok: false, error: 'Giriş yapman gerekiyor.' }, 401);
  let b: any; try { b = await req.json(); } catch { return J({ ok: false, error: 'İstek okunamadı.' }, 400); }

  if (b?.action !== 'send') return J({ ok: false, error: 'not_ready' }, 501);
  if (!VPUB || !VPRIV) return J({ ok: false, error: 'push_not_configured' }, 503);

  const user = createClient(SB_URL, SB_ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const u = await user.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  const uid = u?.data?.user?.id; if (!uid) return J({ ok: false, error: 'Oturum geçersiz.' }, 401);
  const bid = String(b.business_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(bid)) return J({ ok: false, error: 'İşletme yok.' }, 400);
  // yalnızca işletmenin üyesi bildirim gönderebilir (RLS üyesi olmadığın işletmeyi göstermez)
  const biz = await user.from('businesses').select('id').eq('id', bid).maybeSingle();
  if (biz.error || !biz.data) return J({ ok: false, error: 'Bu işletmeye erişimin yok.' }, 403);

  const to: string[] = (Array.isArray(b.to) ? b.to : []).map((x: unknown) => String(x)).slice(0, 100);
  if (!to.length) return J({ ok: true, sent: 0 });
  const title = String(b.title || 'KaisPilot').slice(0, 80);
  const body = String(b.body || '').slice(0, 220);

  const srv = createClient(SB_URL, SB_SRV, { auth: { persistSession: false } });
  const subs = await srv.from('push_subs').select('endpoint,p256dh,auth').eq('business_id', bid).in('app_uid', to);
  if (subs.error) return J({ ok: false, error: 'Abonelikler okunamadı.' }, 500);

  let sent = 0; const dead: string[] = [];
  await Promise.all((subs.data || []).map(async (x: any) => {
    try {
      await webpush.sendNotification({ endpoint: x.endpoint, keys: { p256dh: x.p256dh, auth: x.auth } }, JSON.stringify({ title, body, tag: 'kp-' + bid.slice(0, 8), url: '/' }));
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) dead.push(x.endpoint);
    }
  }));
  if (dead.length) await srv.from('push_subs').delete().in('endpoint', dead);
  return J({ ok: true, sent });
}

Deno.serve(handle);
