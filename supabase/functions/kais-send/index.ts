// kais-send: müşteriye e-posta gönderme (Resend). Tek dosya, Supabase panelinden yapıştırılabilir.
// İşlemler (POST, giriş gerekir): status, remind (tek alacak hatırlatması), campaign (izinli müşterilere toplu), optouts
// Abonelikten çıkış: POST ?u=<imzalı bağlantı> (e-postadaki tek tık başlığı ve kaispilot.com/cikis sayfası kullanır)
//
// Gerekli sırlar: RESEND_API_KEY, RESEND_FROM (kais-cron ile aynı). İsteğe bağlı: APP_URL, MAIL_DAY (günlük sınır, varsayılan 50)
// Güvenlik: alıcı adresi ve izin bilgisi istemciden alınmaz, kayıtlı işletme verisinden sunucu okur.

const env = (k: string): string => { try { return (globalThis as any).Deno?.env?.get(k) || ''; } catch { return ''; } };

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ERR = (m: string, status = 400) => J({ error: m }, status);

// ---------- saf yardımcılar ----------
export const validEmail = (e: unknown): boolean => typeof e === 'string' && e.length <= 160 && /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(e.trim());
export const escH = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
export const clean = (s: unknown, max: number): string => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, max);
// Gönderen adındaki tehlikeli karakterleri at (başlık enjeksiyonu ve adres karışıklığı olmasın)
export const safeName = (s: unknown): string => String(s ?? '').replace(/[\r\n"<>@,;:\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
export function fromWithName(from: string, name: string): string {
  const m = /<([^>]+)>/.exec(from); const addr = (m ? m[1] : from).trim();
  if (!validEmail(addr)) return from;
  const n = safeName(name); return n ? n + ' <' + addr + '>' : addr;
}
export const personalize = (t: string, name: string): string => t.replace(/\{ad\}/gi, (String(name || '').trim().split(/\s+/)[0]) || 'Müşterimiz');
export const textToHtml = (t: string): string => escH(t).replace(/\n/g, '<br>');
export const today = (d = new Date()): string => d.toISOString().slice(0, 10);
const fmtMoney = (n: number): string => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export { fmtMoney };

// ---------- imzalı çıkış bağlantısı (süresiz, sunucuda saklı anahtarla) ----------
const te = new TextEncoder();
const b64u = (u: Uint8Array): string => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string): Uint8Array => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
async function hmacKey(secret: string) { return crypto.subtle.importKey('raw', te.encode('kais-send-unsub:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
export async function signUnsub(b: string, e: string, secret: string): Promise<string> {
  const p = b64u(te.encode(JSON.stringify({ b, e: e.toLowerCase() })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), te.encode(p)));
  return p + '.' + b64u(sig);
}
export async function verifyUnsub(tok: string, secret: string): Promise<{ b: string; e: string } | null> {
  try {
    const [p, s] = String(tok || '').split('.'); if (!p || !s) return null;
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(s), te.encode(p)); if (!ok) return null;
    const o = JSON.parse(new TextDecoder().decode(unb64u(p)));
    return o && typeof o.b === 'string' && typeof o.e === 'string' ? o : null;
  } catch { return null; }
}
const secretKey = (): string => env('SUPABASE_SERVICE_ROLE_KEY');
const appUrl = (): string => (env('APP_URL') || 'https://www.kaispilot.com').replace(/\/+$/, '');
const dayLimit = (): number => { const n = Number(env('MAIL_DAY')); return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 500) : 50; };

// ---------- e-posta içeriği ----------
function shell(bizName: string, innerHtml: string, footHtml: string): string {
  return '<!doctype html><html lang="tr"><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1c2430"><div style="max-width:560px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border-radius:12px;padding:24px;font-size:15px;line-height:1.55">' + innerHtml + '</div><p style="font-size:12px;color:#6b7684;margin:14px 4px 0;line-height:1.5">' + footHtml + '</p></div></body></html>';
}
export function buildRemind(biz: string, name: string, amount: number, text: string) {
  const body = personalize(text, name);
  const html = shell(biz, textToHtml(body), 'Bu mesaj ' + escH(biz) + ' tarafından gönderildi. Yanıtlarsan doğrudan işletmeye ulaşır.');
  return { subject: 'Ödeme hatırlatması · ' + safeName(biz), html, text: body + '\n\n— ' + biz };
}
export function buildCampaign(biz: string, name: string, subject: string, text: string, unsubUrl: string) {
  const body = personalize(text, name);
  const foot = 'Bu iletiyi ' + escH(biz) + ' ile iletişim izniniz olduğu için aldınız. Almak istemiyorsanız <a href="' + escH(unsubUrl) + '" style="color:#6b7684">buradan listeden çıkabilirsiniz</a>.';
  return { subject: clean(subject, 150).replace(/\n/g, ' '), html: shell(biz, textToHtml(body), foot), text: body + '\n\n—\n' + biz + '\nListeden çıkmak için: ' + unsubUrl };
}

// ---------- Resend ----------
async function resendSend(payload: Record<string, unknown>): Promise<{ ok: boolean; err?: string }> {
  for (let i = 0; i < 2; i++) {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY'), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) return { ok: true };
    if (r.status === 429 && i === 0) { await new Promise((res) => setTimeout(res, 1200)); continue; }
    const t = (await r.text().catch(() => '')).slice(0, 160);
    return { ok: false, err: r.status + ' ' + t };
  }
  return { ok: false, err: 'sınır' };
}

// ---------- veritabanı ve yetki ----------
async function srvClient() {
  const { createClient } = await import('jsr:@supabase/supabase-js@2');
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}
async function who(srv: any, req: Request, bid: string) {
  const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tok) return { err: ERR('Giriş yapman gerekiyor.', 401) };
  const u = await srv.auth.getUser(tok); const uid = u?.data?.user?.id;
  if (!uid) return { err: ERR('Oturumun geçersiz. Yeniden giriş yap.', 401) };
  if (!/^[0-9a-f-]{36}$/i.test(bid)) return { err: ERR('İşletme belirtilmemiş.') };
  const b = await srv.from('businesses').select('id,owner_id,name').eq('id', bid).maybeSingle();
  if (b.error || !b.data) return { err: ERR('Bu işletmeye erişimin yok.', 403) };
  let role = 'calisan'; const isOwner = b.data.owner_id === uid;
  if (isOwner) role = 'patron'; else { const m = await srv.from('members').select('role').eq('business_id', bid).eq('user_id', uid).maybeSingle(); if (m.data?.role) role = String(m.data.role); }
  if (!['patron', 'mudur', 'muhasebeci'].includes(role)) return { err: ERR('Müşteriye e-posta göndermek için patron, müdür ya da muhasebeci olmalısın.', 403) };
  const email = String(u.data.user.email || '');
  return { uid, role, biz: String(b.data.name || 'İşletme'), email: validEmail(email) ? email : '' };
}
async function loadState(srv: any, bid: string, key: string): Promise<any[]> {
  const r = await srv.from('app_state').select('state').eq('business_id', bid).in('scope', ['stok', 'muh', 'ekip']);
  for (const row of r.data || []) { try { const s = JSON.parse(row.state); if (Array.isArray(s[key])) return s[key]; } catch { /* yoksay */ } }
  return [];
}
async function sentToday(srv: any, bid: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const r = await srv.from('mail_sends').select('key', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', since);
  return Number(r.count || 0);
}
async function claim(srv: any, bid: string, key: string, kind: string, to: string): Promise<boolean> {
  const r = await srv.from('mail_sends').insert({ business_id: bid, key, kind, to_email: to.toLowerCase() });
  if (r.error) { if (/duplicate|23505/i.test(String(r.error.message || '') + String(r.error.code || ''))) return false; throw r.error; }
  return true;
}
const unclaim = (srv: any, bid: string, key: string) => srv.from('mail_sends').delete().eq('business_id', bid).eq('key', key);
const configured = (): boolean => !!(env('RESEND_API_KEY') && env('RESEND_FROM'));

// ---------- işlemler ----------
async function actStatus(srv: any, req: Request, body: any) {
  const w: any = await who(srv, req, String(body.business_id || '')); if (w.err) return w.err;
  const used = await sentToday(srv, String(body.business_id)); const lim = dayLimit();
  return J({ ok: true, configured: configured(), dayLimit: lim, dayLeft: Math.max(0, lim - used) });
}
async function actOptouts(srv: any, req: Request, body: any) {
  const bid = String(body.business_id || ''); const w: any = await who(srv, req, bid); if (w.err) return w.err;
  const r = await srv.from('mail_optout').select('email').eq('business_id', bid).limit(5000);
  return J({ ok: true, emails: (r.data || []).map((x: any) => String(x.email)) });
}
async function actRemind(srv: any, req: Request, body: any) {
  if (!configured()) return ERR('E-posta servisi kurulmamış (RESEND_API_KEY ve RESEND_FROM yok).', 503);
  const bid = String(body.business_id || ''); const w: any = await who(srv, req, bid); if (w.err) return w.err;
  const rid = String(body.rid || '').slice(0, 60);
  const recv = (await loadState(srv, bid, 'RECV')).find((x: any) => x && String(x.id) === rid);
  if (!recv) return ERR('Bu alacak kayıtlı değil. Birkaç saniye bekleyip tekrar dene.', 404);
  if (recv.paid) return ERR('Bu alacak tahsil edilmiş görünüyor.', 409);
  const to = String(recv.email || '').trim();
  if (!validEmail(to)) return ERR('Bu kişinin e-posta adresi yok ya da hatalı.', 422);
  const text = clean(body.text, 3000); if (text.length < 5) return ERR('Mesaj boş.', 422);
  const amount = Number(recv.amt) || 0;
  const used = await sentToday(srv, bid); if (used >= dayLimit()) return ERR('Bugünlük gönderim sınırına ulaştın. Yarın tekrar dene.', 429);
  const key = 'remind:' + rid + ':' + today();
  if (!(await claim(srv, bid, key, 'remind', to))) return ERR('Bu alacak için bugün zaten hatırlatma gönderildi.', 409);
  const m = buildRemind(w.biz, String(recv.name || ''), amount, text);
  const payload: Record<string, unknown> = { from: fromWithName(env('RESEND_FROM'), w.biz), to: [to], subject: m.subject, html: m.html, text: m.text };
  if (w.email) payload.reply_to = w.email;
  const s = await resendSend(payload);
  if (!s.ok) { await unclaim(srv, bid, key); console.error('kais-send remind', s.err); return ERR('E-posta gönderilemedi. Adresi ve gönderen ayarını kontrol et.', 502); }
  return J({ ok: true, sent: 1 });
}
async function actCampaign(srv: any, req: Request, body: any) {
  if (!configured()) return ERR('E-posta servisi kurulmamış (RESEND_API_KEY ve RESEND_FROM yok).', 503);
  const bid = String(body.business_id || ''); const w: any = await who(srv, req, bid); if (w.err) return w.err;
  const subject = clean(body.subject, 150).replace(/\n/g, ' '); const text = clean(body.text, 5000);
  if (!subject || text.length < 5) return ERR('Konu ve mesaj gerekli.', 422);
  const cid = String(body.cid || '').replace(/[^\w-]/g, '').slice(0, 40); if (!cid) return ERR('Kampanya kimliği eksik.');
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map((x: unknown) => String(x).slice(0, 60)).slice(0, 200) : [];
  if (!ids.length) return ERR('Alıcı seçilmemiş.', 422);
  const custs = await loadState(srv, bid, 'CUSTOMERS');
  const optR = await srv.from('mail_optout').select('email').eq('business_id', bid).limit(5000);
  const opt = new Set((optR.data || []).map((x: any) => String(x.email).toLowerCase()));
  const skipped = { izinYok: 0, listedenCikti: 0, adresHatali: 0, bulunamadi: 0, tekrar: 0 };
  const list: { id: string; name: string; email: string }[] = []; const seen = new Set<string>(); const optIds: string[] = [];
  for (const id of ids) {
    const c = custs.find((x: any) => x && String(x.id) === id);
    if (!c) { skipped.bulunamadi++; continue; }
    const em = String(c.email || '').trim().toLowerCase();
    if (!validEmail(em)) { skipped.adresHatali++; continue; }
    if (opt.has(em)) { skipped.listedenCikti++; optIds.push(id); continue; }
    if (c.iys !== 'onayli') { skipped.izinYok++; continue; }
    if (seen.has(em)) { skipped.tekrar++; continue; }
    seen.add(em); list.push({ id, name: String(c.name || ''), email: em });
  }
  const left = Math.max(0, dayLimit() - (await sentToday(srv, bid)));
  let sent = 0, failed = 0, dup = 0; const limited = list.length > left;
  const from = fromWithName(env('RESEND_FROM'), w.biz); const fnUrl = env('SUPABASE_URL') + '/functions/v1/kais-send';
  for (const c of list.slice(0, left)) {
    const key = 'camp:' + cid + ':' + c.email;
    if (!(await claim(srv, bid, key, 'campaign', c.email))) { dup++; continue; }
    const tok = await signUnsub(bid, c.email, secretKey());
    const page = appUrl() + '/cikis/?u=' + encodeURIComponent(tok);
    const m = buildCampaign(w.biz, c.name, subject, text, page);
    const payload: Record<string, unknown> = {
      from, to: [c.email], subject: m.subject, html: m.html, text: m.text,
      headers: { 'List-Unsubscribe': '<' + fnUrl + '?u=' + encodeURIComponent(tok) + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    };
    if (w.email) payload.reply_to = w.email;
    const s = await resendSend(payload);
    if (s.ok) sent++; else { failed++; await unclaim(srv, bid, key); console.error('kais-send campaign', s.err); }
    await new Promise((res) => setTimeout(res, 550)); // Resend saniyede 2 istek sınırı
  }
  return J({ ok: true, sent, failed, dup, limited, dayLeft: Math.max(0, left - sent), skipped, optIds });
}
async function actUnsub(srv: any, tok: string) {
  const o = await verifyUnsub(tok, secretKey());
  if (!o || !validEmail(o.e)) return ERR('Bağlantı geçersiz.', 400);
  const r = await srv.from('mail_optout').upsert({ business_id: o.b, email: o.e.toLowerCase() }, { onConflict: 'business_id,email' });
  if (r.error) return ERR('Kaydedilemedi, biraz sonra tekrar dene.', 500);
  return J({ ok: true });
}

export async function handle(req: Request, srvOverride?: any): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  try {
    const srv = srvOverride || await srvClient();
    if (req.method === 'GET') return J({ ok: true, service: 'kais-send', configured: configured() });
    if (req.method !== 'POST') return ERR('Yalnızca POST.', 405);
    if (url.searchParams.has('u')) return await actUnsub(srv, url.searchParams.get('u') || '');
    let body: any; try { body = await req.json(); } catch { return ERR('İstek okunamadı.'); }
    switch (String(body?.action || '')) {
      case 'status': return await actStatus(srv, req, body);
      case 'remind': return await actRemind(srv, req, body);
      case 'campaign': return await actCampaign(srv, req, body);
      case 'optouts': return await actOptouts(srv, req, body);
      case 'unsub': return await actUnsub(srv, String(body.u || ''));
      default: return ERR('Bilinmeyen işlem.');
    }
  } catch (e) {
    console.error('kais-send', String((e as Error)?.message || e).slice(0, 160));
    return ERR('E-posta hizmeti şu an yanıt veremedi.', 500);
  }
}

const D = (globalThis as any).Deno;
if (D && typeof D.serve === 'function') D.serve((req: Request) => handle(req));
