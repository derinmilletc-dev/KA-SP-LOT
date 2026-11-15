// Kais zamanlayıcı: her 5 dakikada çalışır.
// 1) Müşteriye rezervasyon onayı ve hatırlatma e-postası (Resend)
// 2) Geç kalan çalışan ve sabah özeti için yöneticilere push
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { TZ, nowIn, planMails, planLate, planDaily, planAlerts, planAlerts2, planWeekly, lateTxt, validEmail } from './logic.ts';

const URL_ = Deno.env.get('SUPABASE_URL')!; const SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(URL_, SRV, { auth: { persistSession: false } });
const RESEND = Deno.env.get('RESEND_API_KEY') || ''; const FROM = Deno.env.get('RESEND_FROM') || '';
const VPUB = Deno.env.get('VAPID_PUBLIC_KEY') || ''; const VPRIV = Deno.env.get('VAPID_PRIVATE_KEY') || ''; const VSUB = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';
if (VPUB && VPRIV) webpush.setVapidDetails(VSUB, VPUB, VPRIV);

async function claim(bid: string, key: string, kind: string) {
  const r = await sb.from('mail_log').insert({ business_id: bid, key, kind });
  if (r.error) { if (/duplicate|23505/i.test((r.error.message || '') + (r.error.code || ''))) return false; throw r.error; }
  return true;
}
async function unclaim(bid: string, key: string) { await sb.from('mail_log').delete().eq('business_id', bid).eq('key', key); }

async function sendMail(to: string, subject: string, html: string, text: string, reply: string) {
  const body: Record<string, unknown> = { from: FROM, to: [to], subject, html, text };
  if (validEmail(reply)) body.reply_to = reply;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Resend ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

async function pushManagers(bid: string, title: string, body: string, tag: string) {
  if (!VPUB || !VPRIV) return 0;
  const m = await sb.from('members').select('app_uid').eq('business_id', bid).in('role', ['patron', 'mudur']);
  const ids = (m.data || []).map((x: any) => x.app_uid).filter(Boolean); if (!ids.length) return 0;
  const s = await sb.from('push_subs').select('endpoint,p256dh,auth').eq('business_id', bid).in('app_uid', ids); let n = 0;
  for (const x of s.data || []) {
    try { await webpush.sendNotification({ endpoint: x.endpoint, keys: { p256dh: x.p256dh, auth: x.auth } }, JSON.stringify({ title, body, tag, url: '/' })); n++; }
    catch (e) { const c = (e as any).statusCode; if (c === 404 || c === 410) await sb.from('push_subs').delete().eq('endpoint', x.endpoint); }
  }
  return n;
}


// İlan ve teslimat bildirimleri (SQL tarafında üretilir: market_outbox_pull)
async function pushMarket(): Promise<number> {
  if (!VPUB || !VPRIV) return 0;
  const r = await sb.rpc('market_outbox_pull'); if (r.error) { if (/market_outbox_pull|function/i.test(r.error.message)) return 0; throw r.error; }
  let n = 0;
  const send = async (table: string, sub: any, msg: any) => {
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(msg)); n++; }
    catch (e) { const c = (e as any).statusCode; if (c === 404 || c === 410) await sb.from(table).delete().eq('endpoint', sub.endpoint); }
  };
  for (const m of (r.data || []) as any[]) {
    const msg = { title: m.title, body: m.body, tag: m.tag, url: m.url || '/' };
    if (m.to_user) { const s = await sb.from('supplier_push').select('endpoint,p256dh,auth').eq('user_id', m.to_user); for (const x of s.data || []) await send('supplier_push', x, msg); }
    if (m.to_biz) {
      const mm = await sb.from('members').select('app_uid').eq('business_id', m.to_biz).in('role', m.to_roles || ['patron', 'mudur']);
      const ids = (mm.data || []).map((x: any) => x.app_uid).filter(Boolean); if (!ids.length) continue;
      const s = await sb.from('push_subs').select('endpoint,p256dh,auth').eq('business_id', m.to_biz).in('app_uid', ids); for (const x of s.data || []) await send('push_subs', x, msg);
    }
  }
  return n;
}

// Gönderildi bayraklarını uygulamanın verisine yaz (sürüm kontrollü; çakışırsa mail_log zaten tekrarı engeller).
async function flag(bid: string, marks: { id: string; f: 'cs' | 'rs' }[]) {
  for (let i = 0; i < 3; i++) {
    const r = await sb.from('app_state').select('state,version').eq('business_id', bid).eq('scope', 'ekip').limit(1);
    const row = r.data && r.data[0]; if (!row) return;
    const st = JSON.parse(row.state); const list = Array.isArray(st.RESV) ? st.RESV : [];
    marks.forEach((m) => { const x = list.find((q: any) => q.id === m.id); if (x) x[m.f] = { t: Date.now(), ch: 'mail', auto: true }; });
    const u = await sb.from('app_state').update({ state: JSON.stringify(st), version: row.version + 1, updated_at: new Date().toISOString() }).eq('business_id', bid).eq('scope', 'ekip').eq('version', row.version).select('version');
    if (!u.error && u.data && u.data.length) return;
  }
}

Deno.serve(async (req) => {
  if (!Deno.env.get('CRON_SECRET') || req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });
  const out = { business: 0, mails: 0, pushes: 0, errors: [] as string[] };
  const rows = await sb.from('app_state').select('business_id,state').eq('scope', 'ekip');
  const now = nowIn(TZ);
  for (const row of rows.data || []) {
    const bid = row.business_id as string; out.business++;
    try {
      const ekip = JSON.parse(row.state);
      const b = await sb.from('businesses').select('name').eq('id', bid).limit(1); const biz = (b.data && b.data[0] && b.data[0].name) || 'İşletme';
      // 1) müşteri e-postaları
      if (RESEND && FROM) {
        const reply = (ekip.RCFG && ekip.RCFG.k && ekip.RCFG.k.reply) || ''; const marks: { id: string; f: 'cs' | 'rs' }[] = [];
        for (const j of planMails(ekip, biz, now)) {
          if (!(await claim(bid, j.key, j.kind))) continue;
          try { await sendMail(j.to, j.subject, j.html, j.text, reply); out.mails++; marks.push({ id: j.id, f: j.kind === 'conf' ? 'cs' : 'rs' }); }
          catch (e) { await unclaim(bid, j.key); out.errors.push(String((e as Error).message)); }
        }
        if (marks.length) await flag(bid, marks);
      }
      // 2) geç kalanlar ve sabah özeti (yöneticilere push)
      const vdRows = await sb.from('app_state').select('state').eq('business_id', bid).in('scope', ['ekip', 'muh', 'stok']); const vd: any = {}; const stok: any = {}; const led: any = {};
      (vdRows.data || []).forEach((x: any) => { try { const s = JSON.parse(x.state); if (s.VD_F) vd.VD_F = s.VD_F; if (s.VD_T) vd.VD_T = s.VD_T; if (s.STOCK) stok.STOCK = s.STOCK; if (s.SALES) stok.SALES = s.SALES; if (s.LOTS) stok.LOTS = s.LOTS; if (s.ORDERS) stok.ORDERS = s.ORDERS; if (s.LEDGER) led.LEDGER = s.LEDGER; } catch (_) { /* yoksay */ } });
      const names = ekip.NAMES || {};
      for (const l of planLate(ekip, vd, now)) {
        if (!(await claim(bid, l.key, 'late'))) continue;
        out.pushes += await pushManagers(bid, 'Geç kalan çalışan', ((names[l.uid] && names[l.uid].name) || 'Bir çalışan') + ' ' + lateTxt(l.min) + '.', l.key);
      }
      for (const a of planAlerts(stok, now).concat(planAlerts2(stok, now))) { if (await claim(bid, a.key, 'alert')) out.pushes += await pushManagers(bid, a.title, a.body, a.key); }
      const wk = planWeekly(stok, led, now); if (wk && (await claim(bid, wk.key, 'weekly'))) out.pushes += await pushManagers(bid, wk.title, wk.body, wk.key);
      const d = planDaily(ekip, now);
      if (d && (await claim(bid, d.key, 'daily'))) out.pushes += await pushManagers(bid, d.title, d.body, d.key);
    } catch (e) { out.errors.push(bid + ': ' + String((e as Error).message)); }
  }
  try { out.pushes += await pushMarket(); } catch (e) { out.errors.push('market: ' + String((e as Error).message)); }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
});
