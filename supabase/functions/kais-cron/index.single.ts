// Kais zamanlayıcı: her 5 dakikada çalışır.
// 1) Müşteriye rezervasyon onayı ve hatırlatma e-postası (Resend)
// 2) Geç kalan çalışan ve sabah özeti için yöneticilere push
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
// Kais zamanlayıcı: saf mantık (test edilebilir). Dışarıya erişmez.
const TZ = 'Europe/Istanbul';

function nowIn(tz: string, d: Date = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p: Record<string, string> = {};
  f.formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return { date: p.year + '-' + p.month + '-' + p.day, min: Number(p.hour) * 60 + Number(p.minute) };
}
const toMin = (t: string) => { const a = String(t || '0:0').split(':').map(Number); return (a[0] || 0) * 60 + (a[1] || 0); };
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const dayName = (iso: string) => { const a = iso.split('-').map(Number); const dow = new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay(); return DAYS[dow] + ' ' + a[2] + ' ' + MONTHS[a[1] - 1]; };
const validEmail = (e: unknown) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const digits = (p: string) => String(p || '').replace(/\D/g, '').slice(-10);
const first = (n: string) => String(n || '').trim().split(/\s+/)[0] || '';

function kCfg(rcfg: any) {
  const k = (rcfg && rcfg.k) || {};
  return { on: k.on !== false, conf: k.conf !== false, rem: k.rem !== false, auto: k.auto !== false, hrs: Number(k.hrs) > 0 ? Number(k.hrs) : 3, reply: k.reply || '' };
}

function history(resv: any[], r: any) {
  const d = digits(r.phone); const em = String(r.email || '').toLowerCase();
  const l = resv.filter((x) => x.id !== r.id && ((d && digits(x.phone) === d) || (em && String(x.email || '').toLowerCase() === em)));
  return { n: l.filter((x) => ['geldi', 'bitti'].includes(x.st)).length, miss: l.filter((x) => x.st === 'gelmedi').length };
}

function confText(r: any, biz: string, tables: string, h: { n: number; miss: number }) {
  const n = String(r.note || '').toLowerCase();
  let s = 'Merhaba ' + first(r.name) + ', ' + biz + ' olarak rezervasyonunuzu aldık.\n\n' + dayName(r.date) + ' · ' + r.time + '\n' + r.n + ' kişi' + (tables ? '\nMasa ' + tables : '') + '\n';
  if (/doğum|dogum/.test(n)) s += '\nDoğum gününüz için hazırlık yapacağız, şimdiden kutlu olsun!\n';
  else if (/yıl dönümü|evlilik|nişan|kutlama/.test(n)) s += '\nÖzel gününüz için elimizden geleni yapacağız.\n';
  else if (r.note) s += '\nNotunuz: ' + r.note + '. Not aldık.\n';
  if (r.n >= 6) s += '\nBüyük grup olduğunuz için masaları sizin için hazırlıyoruz.\n';
  if (h.n >= 2) s += '\nBizi yeniden tercih ettiğiniz için teşekkür ederiz.';
  s += h.miss ? '\nPlanınız değişirse lütfen önceden haber verin, yerinizi başka misafire verebiliriz.' : '\nDeğişiklik ya da iptal için bu e-postayı yanıtlayabilirsiniz.';
  return s + '\n\nGörüşmek üzere,\n' + biz;
}
function remText(r: any, biz: string, leftMin: number, h: { n: number; miss: number }) {
  const hrs = Math.max(1, Math.round(leftMin / 60));
  return 'Merhaba ' + first(r.name) + ', bugün saat ' + r.time + ' için ' + r.n + ' kişilik rezervasyonunuza yaklaşık ' + hrs + ' saat kaldı. ' + biz + ' olarak sizi bekliyoruz.\n\n' + (h.miss ? 'Geleceğinizi teyit etmek için bu e-postayı EVET yazarak yanıtlayabilir misiniz? ' : '') + 'Gelemeyecekseniz lütfen haber verin, yerinizi başka misafire verebiliriz.\n\n' + biz;
}
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function mailHtml(biz: string, title: string, text: string) {
  const body = esc(text).split('\n\n').map((p) => '<p style="margin:0 0 14px;line-height:1.55">' + p.replace(/\n/g, '<br>') + '</p>').join('');
  return '<!doctype html><html><body style="margin:0;background:#F1F5FA;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#10213A"><div style="max-width:520px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border-radius:18px;padding:26px 24px;border:1px solid #E1E8F2"><div style="font-size:13px;font-weight:700;color:#0E4B97;margin-bottom:6px">' + esc(biz) + '</div><h1 style="font-size:20px;margin:0 0 16px">' + esc(title) + '</h1>' + body + '</div><p style="text-align:center;font-size:12px;color:#7A889C;margin-top:14px">Bu e-posta rezervasyonunuz nedeniyle gönderildi.</p></div></body></html>';
}

type MailJob = { key: string; kind: 'conf' | 'rem'; id: string; to: string; subject: string; text: string; html: string };

function planMails(ekip: any, biz: string, now: { date: string; min: number }): MailJob[] {
  const cfg = kCfg(ekip.RCFG); const out: MailJob[] = [];
  if (!cfg.on || !cfg.auto) return out;
  const resv: any[] = Array.isArray(ekip.RESV) ? ekip.RESV : []; const tables: any[] = Array.isArray(ekip.TABLES) ? ekip.TABLES : [];
  resv.forEach((r) => {
    if (!r || !validEmail(r.email) || !['bekliyor', 'onay'].includes(r.st) || !r.date || r.date < now.date) return;
    const h = history(resv, r); const tn = (r.tids || []).map((id: string) => { const t = tables.find((x) => x.id === id); return t ? String(t.name).replace('Masa ', '') : ''; }).filter(Boolean).join(', ');
    if (cfg.conf && !r.cs) out.push({ key: 'conf:' + r.id + ':' + r.date + ':' + r.time, kind: 'conf', id: r.id, to: r.email.trim(), subject: biz + ' · Rezervasyonunuz alındı', text: confText(r, biz, tn, h), html: mailHtml(biz, 'Rezervasyonunuz alındı', confText(r, biz, tn, h)) });
    if (cfg.rem && !r.rs && r.st === 'onay' && r.date === now.date) {
      const left = toMin(r.time) - now.min;
      if (left > 0 && left <= cfg.hrs * 60) out.push({ key: 'rem:' + r.id + ':' + r.date + ':' + r.time, kind: 'rem', id: r.id, to: r.email.trim(), subject: biz + ' · Rezervasyon hatırlatma', text: remText(r, biz, left, h), html: mailHtml(biz, 'Rezervasyon hatırlatma', remText(r, biz, left, h)) });
    }
  });
  return out;
}

// Geç kalan çalışan: bugün vardiyası var, başlangıçtan 10+ dk geçti, bugün CLOCK kaydı yok.
const MON = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function leaveRange(txt: string) {
  const mi = (s: string) => (s ? MON.findIndex((x) => s.toLocaleLowerCase('tr').startsWith(x.toLocaleLowerCase('tr'))) : -1);
  const W = '([A-Za-zÇĞİÖŞÜçğıöşü]{3,})?';
  let m = String(txt || '').match(new RegExp('(\\d{1,2})\\s*' + W + '\\s*[–-]\\s*(\\d{1,2})\\s*' + W));
  if (m) { const m2 = mi(m[4]); const m1 = mi(m[2]) >= 0 ? mi(m[2]) : m2; if (m2 < 0 && m1 < 0) return null; return [(m1 < 0 ? m2 : m1) * 40 + Number(m[1]), (m2 < 0 ? m1 : m2) * 40 + Number(m[3])]; }
  m = String(txt || '').match(new RegExp('(\\d{1,2})\\s*([A-Za-zÇĞİÖŞÜçğıöşü]{3,})'));
  if (m && mi(m[2]) >= 0) { const o = mi(m[2]) * 40 + Number(m[1]); return [o, o]; }
  return null;
}
type Late = { uid: string; min: number; key: string };
function planLate(ekip: any, vd: any, now: { date: string; min: number }): Late[] {
  const F = (vd && vd.VD_F) || {}; const T: any[] = (vd && vd.VD_T) || []; const day = F[now.date] || {}; const out: Late[] = [];
  const mo = Number(now.date.slice(5, 7)) - 1; const dd = Number(now.date.slice(8)); const o = mo * 40 + dd;
  const leaves: any[] = (Array.isArray(ekip.LEAVES) ? ekip.LEAVES : []).concat((Array.isArray(ekip.LVREQ) ? ekip.LVREQ : []).filter((r: any) => r.status === 'onayli').map((r: any) => (r.counter && r.resp === 'kabul' ? { uid: r.uid, txt: r.counter.txt } : { uid: r.uid, txt: r.txt })));
  const clock: any[] = Array.isArray(ekip.CLOCK) ? ekip.CLOCK : [];
  Object.keys(day).forEach((uid) => {
    const t = T.find((x) => x.id === day[uid]); if (!t) return;
    const start = toMin(t.s); const end = toMin(t.e) || 1440; const late = now.min - start;
    if (late < 10 || now.min >= end) return;
    if (clock.some((c) => c.uid === uid && c.date === now.date)) return;
    if (leaves.some((l) => { if (l.uid !== uid) return false; const q = leaveRange(l.txt); return !!q && q[0] <= o && o <= q[1]; })) return;
    out.push({ uid, min: late, key: 'late:' + now.date + ':' + uid });
  });
  return out;
}
const lateTxt = (min: number) => (min < 180 ? min + ' dk geç kaldı' : 'bugün henüz gelmedi');

// Sabah özeti: yöneticilere günde bir kez.
function planDaily(ekip: any, now: { date: string; min: number }): { key: string; title: string; body: string } | null {
  if (now.min < 9 * 60 || now.min >= 10 * 60) return null;
  const dleft = (iso: string) => { const a = iso.split('-').map(Number); const b = now.date.split('-').map(Number); return Math.round((Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(b[0], b[1] - 1, b[2])) / 864e5); };
  const maint: any[] = Array.isArray(ekip.MAINT) ? ekip.MAINT : []; const reqs: any[] = Array.isArray(ekip.REQS) ? ekip.REQS : []; const plan: any[] = Array.isArray(ekip.MPLAN) ? ekip.MPLAN : [];
  const lv: any[] = Array.isArray(ekip.LVREQ) ? ekip.LVREQ : []; const resv: any[] = Array.isArray(ekip.RESV) ? ekip.RESV : [];
  const open = maint.filter((m) => m.st !== 'bitti').length; const acil = maint.filter((m) => m.st !== 'bitti' && m.pri === 'acil').length;
  const pend = reqs.filter((r) => r.st === 'bekliyor').length + lv.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length;
  const late = plan.filter((p) => Number(p.every) + dleft(p.last || now.date) < 0).length;
  const rz = resv.filter((r) => r.date === now.date && ['bekliyor', 'onay'].includes(r.st));
  const ppl = rz.reduce((a, r) => a + (Number(r.n) || 0), 0);
  const parts: string[] = [];
  if (rz.length) parts.push(rz.length + ' rezervasyon (' + ppl + ' kişi)');
  if (open) parts.push(open + ' açık arıza' + (acil ? ' (' + acil + ' acil)' : ''));
  if (pend) parts.push(pend + ' bekleyen talep');
  if (late) parts.push(late + ' gecikmiş bakım');
  if (!parts.length) return null;
  return { key: 'daily:' + now.date, title: 'Günaydın, bugünün özeti', body: parts.join(', ') + '.' };
}

// Biten/azalan ürün ve satış düşüşü: yöneticilere günde bir kez (09:00-20:00 arası).
function planAlerts(stok: any, now: { date: string; min: number }): { key: string; title: string; body: string }[] {
  const out: { key: string; title: string; body: string }[] = [];
  if (now.min < 9 * 60 || now.min >= 20 * 60 || !stok || typeof stok !== 'object') return out;
  const items: any[] = Array.isArray(stok.STOCK) ? stok.STOCK : [];
  const low = items.filter((x) => Number(x.min) > 0 && Number(x.qty) <= Number(x.min));
  if (low.length) {
    const zero = low.filter((x) => Number(x.qty) <= 0).length; const names = low.slice(0, 3).map((x) => String(x.name).replace(/\s*\(.*\)\s*$/, '')).join(', ');
    out.push({ key: 'stock:' + now.date, title: zero ? 'Biten ürün var' : 'Stok azalıyor', body: low.length + ' ürün alt sınırda: ' + names + (low.length > 3 ? ' ve ' + (low.length - 3) + ' ürün daha' : '') + '. Kais sipariş hazırlayabilir.' });
  }
  const sales: any[] = Array.isArray(stok.SALES) ? stok.SALES : [];
  if (sales.length) {
    const by: Record<string, number> = {}; sales.forEach((s) => { const d = String(s.date || '').slice(0, 10); if (d) by[d] = (by[d] || 0) + (Number(s.total) || 0); });
    const dow = (iso: string) => { const a = iso.split('-').map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay(); };
    const diff = (a: string, b: string) => { const x = a.split('-').map(Number); const y = b.split('-').map(Number); return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5); };
    const yd = (() => { const a = now.date.split('-').map(Number); const d = new Date(Date.UTC(a[0], a[1] - 1, a[2] - 1)); return d.toISOString().slice(0, 10); })();
    const same = Object.keys(by).filter((d) => d < yd && diff(d, yd) <= 56 && dow(d) === dow(yd));
    if (by[yd] != null && same.length >= 3) {
      const avg = same.reduce((a, d) => a + by[d], 0) / same.length;
      if (avg > 0 && by[yd] < avg * 0.75) { const pct = Math.round((1 - by[yd] / avg) * 100); out.push({ key: 'salesdrop:' + yd, title: 'Dün satışlar düşük', body: 'Dün ciro, aynı günlerin ortalamasının yaklaşık %' + pct + ' altında kaldı.' }); }
    }
  }
  return out;
}

const addDaysIso = (iso: string, n: number) => { const a = iso.split('-').map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2] + n)).toISOString().slice(0, 10); };
const tl = (n: number) => Math.round(n).toLocaleString('tr-TR') + ' ₺';

// SKT yaklaşan ürünler ve belirgin fiyat artışı (stok verisinden).
function planAlerts2(stok: any, now: { date: string; min: number }): { key: string; title: string; body: string }[] {
  const out: { key: string; title: string; body: string }[] = [];
  if (now.min < 9 * 60 || now.min >= 20 * 60 || !stok || typeof stok !== 'object') return out;
  const items: any[] = Array.isArray(stok.STOCK) ? stok.STOCK : []; const nm = (id: string) => { const s = items.find((x) => x.id === id); return s ? String(s.name).replace(/\s*\(.*\)\s*$/, '') : ''; };
  const lots: any[] = Array.isArray(stok.LOTS) ? stok.LOTS : [];
  const soon = lots.filter((l) => Number(l.qty) > 0 && l.exp && l.exp >= now.date && l.exp <= addDaysIso(now.date, 2));
  const gone = lots.filter((l) => Number(l.qty) > 0 && l.exp && l.exp < now.date && l.exp >= addDaysIso(now.date, -3));
  if (soon.length || gone.length) {
    const names = Array.from(new Set(soon.concat(gone).map((l) => nm(l.sid)).filter(Boolean))).slice(0, 3).join(', ');
    out.push({ key: 'skt:' + now.date, title: gone.length ? 'SKT geçen ürün var' : 'SKT yaklaşıyor', body: (soon.length + gone.length) + ' partinin SKT durumu dikkat istiyor: ' + names + '. Önce bunları kullan ya da fireye ayır.' });
  }
  const ords: any[] = Array.isArray(stok.ORDERS) ? stok.ORDERS : []; const last: Record<string, { p: number; d: string }[]> = {};
  ords.filter((o) => o.status !== 'iptal' && o.iso).sort((a, b) => String(b.iso).localeCompare(String(a.iso))).forEach((o) => (o.lines || []).forEach((l: any) => { const k = String(l.name || '').toLowerCase(); if (!k || !(Number(l.price) > 0)) return; (last[k] = last[k] || []).push({ p: Number(l.price), d: o.iso }); }));
  const ups: string[] = [];
  Object.keys(last).forEach((k) => { const h = last[k]; if (h.length >= 2 && h[0].d >= addDaysIso(now.date, -3) && h[0].p >= h[1].p * 1.1) ups.push(String(k).replace(/\s*\(.*\)\s*$/, '') + ' %' + Math.round((h[0].p / h[1].p - 1) * 100)); });
  if (ups.length) out.push({ key: 'price:' + now.date, title: 'Alış fiyatı arttı', body: ups.slice(0, 3).join(', ') + ' son siparişte öncekinden pahalı. Tedarikçileri kıyaslamak ister misin?' });
  return out;
}

// Pazartesi sabahı haftalık özet.
function planWeekly(stok: any, led: any, now: { date: string; min: number }): { key: string; title: string; body: string } | null {
  const a = now.date.split('-').map(Number); if (new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay() !== 1) return null;
  if (now.min < 9 * 60 || now.min >= 11 * 60) return null;
  const sales: any[] = stok && Array.isArray(stok.SALES) ? stok.SALES : []; const rows: any[] = led && Array.isArray(led.LEDGER) ? led.LEDGER : [];
  const s = (x: string, y: string) => sales.filter((r) => r.date >= x && r.date <= y).reduce((t, r) => t + (Number(r.total) || 0), 0);
  const g = (x: string, y: string) => rows.filter((r) => r.iso && r.iso >= x && r.iso <= y && (r.dir || 'gider') === 'gider').reduce((t, r) => t + (Number(r.total) || 0), 0);
  const e1 = addDaysIso(now.date, -1), s1 = addDaysIso(now.date, -7), e0 = addDaysIso(now.date, -8), s0 = addDaysIso(now.date, -14);
  const cur = s(s1, e1), prev = s(s0, e0), gid = g(s1, e1); if (!cur && !gid) return null;
  const pc = prev > 0 ? ' (' + (cur >= prev ? '+' : '') + Math.round((cur / prev - 1) * 100) + '%)' : '';
  return { key: 'weekly:' + now.date, title: 'Geçen haftanın özeti', body: 'Ciro ' + tl(cur) + pc + (gid ? ', gider ' + tl(gid) : '') + (cur && gid ? ', fark ' + tl(cur - gid) : '') + '.' };
}

// Günlük kapanış: akşam 21:00-22:00 arası, yöneticilere günde bir kez.
type CloseFacts = { ciro: number; gider: number; ort7: number; dun: number; top: { prod: string; total: number }[]; giderTop: { acc: string; total: number }[] };
function closeFacts(stok: any, led: any, now: { date: string; min: number }): CloseFacts {
  const sales: any[] = stok && Array.isArray(stok.SALES) ? stok.SALES : []; const rows: any[] = led && Array.isArray(led.LEDGER) ? led.LEDGER : [];
  const dayMs = 864e5; const t0 = new Date(now.date + 'T00:00:00Z').getTime();
  const iso = (k: number) => new Date(t0 - k * dayMs).toISOString().slice(0, 10);
  const sum = (d: string) => sales.filter((r) => r.date === d).reduce((t, r) => t + (Number(r.total) || 0), 0);
  const ciro = sum(now.date); let tot7 = 0; let n7 = 0;
  for (let k = 1; k <= 7; k++) { const v = sum(iso(k)); if (v > 0) { tot7 += v; n7++; } }
  const gRows = rows.filter((r) => r.iso === now.date && (r.dir || 'gider') === 'gider');
  const gider = gRows.reduce((t, r) => t + (Number(r.total) || 0), 0);
  const pm: Record<string, number> = {}; sales.filter((r) => r.date === now.date).forEach((r) => { const k = String(r.prod || '?'); pm[k] = (pm[k] || 0) + (Number(r.total) || 0); });
  const gm: Record<string, number> = {}; gRows.forEach((r) => { const k = String(r.acc || 'Diğer'); gm[k] = (gm[k] || 0) + (Number(r.total) || 0); });
  const top = Object.keys(pm).map((k) => ({ prod: k, total: pm[k] })).sort((a, b) => b.total - a.total).slice(0, 3);
  const giderTop = Object.keys(gm).map((k) => ({ acc: k, total: gm[k] })).sort((a, b) => b.total - a.total).slice(0, 3);
  return { ciro, gider, ort7: n7 ? tot7 / n7 : 0, dun: sum(iso(1)), top, giderTop };
}
function planClose(stok: any, led: any, now: { date: string; min: number }): { key: string; title: string; body: string; facts: CloseFacts } | null {
  if (now.min < 21 * 60 || now.min >= 22 * 60) return null;
  const f = closeFacts(stok, led, now); const ciro = f.ciro; const gider = f.gider;
  if (!ciro && !gider) return null;
  return { key: 'close:' + now.date, title: 'Günün kapanışı', body: 'Bugün ciro ' + tl(ciro) + (gider ? ', gider ' + tl(gider) : '') + (ciro && gider ? ', fark ' + tl(ciro - gider) : '') + '.', facts: f };
}

// Hata alarmı: son 15 dakikadaki istemci hatalarını imzaya göre grupla; eşik aşılınca platform yöneticilerine push.
type ErrRow = { msg: string; view?: string; ver?: string; user_id?: string; business_id?: string; created_at?: string };
const errSig = (m: string) => String(m || '').replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 90);
const errHash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(16); };
function planErrors(rows: ErrRow[], now: Date = new Date()): { key: string; title: string; body: string }[] {
  const g: Record<string, { n: number; users: Set<string>; view: string; ver: string; msg: string }> = {};
  (rows || []).forEach((r) => {
    const s = errSig(r.msg); if (!s) return;
    const x = g[s] || (g[s] = { n: 0, users: new Set<string>(), view: '', ver: '', msg: String(r.msg || '').slice(0, 80) });
    x.n++; if (r.user_id) x.users.add(r.user_id); if (r.view) x.view = r.view; if (r.ver) x.ver = r.ver;
  });
  const hour = now.toISOString().slice(0, 13); const out: { key: string; title: string; body: string }[] = [];
  Object.keys(g).sort((a, b) => g[b].n - g[a].n).forEach((s) => {
    const x = g[s]; if (x.n < 5 && x.users.size < 2) return;
    out.push({ key: 'err:' + errHash(s) + ':' + hour, title: 'Hata alarmı', body: x.msg + ' · ' + x.n + ' kez, ' + (x.users.size || 1) + ' kişi · ' + (x.view || '?') + ' · ' + (x.ver || '?') });
  });
  const total = (rows || []).length;
  if (!out.length && total >= 10) out.push({ key: 'errs:' + hour, title: 'Hata alarmı', body: 'Son 15 dakikada ' + total + ' hata geldi (' + Object.keys(g).length + ' farklı türde).' });
  return out.slice(0, 3);
}

// Tekrarlayan kayıtlar: ayın günü gelince bir kez, sabit kimlikle (istemci mxRecRun ile aynı kimlik, çift kayıt olmaz).
function planRec(settings: any, ledger: any[], now: { date: string; min: number }): any[] {
  const recs: any[] = settings && Array.isArray(settings.rec) ? settings.rec : []; if (!recs.length) return [];
  const have = new Set((Array.isArray(ledger) ? ledger : []).map((x: any) => x && x.id));
  const mk = now.date.slice(0, 7); const dd = parseInt(now.date.slice(8), 10); const out: any[] = [];
  const dim = new Date(Date.UTC(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)), 0)).getUTCDate();
  recs.forEach((r) => {
    const total = Number(r.total) || 0;
    if (r.off || !total || dd < Math.min(r.day || 1, dim) || (r.from && mk < r.from)) return;
    const id = 'gr_' + r.id + '_' + mk; if (have.has(id)) return;
    const iso = mk + '-' + String(Math.min(r.day || 1, dd)).padStart(2, '0');
    const row: any = { id, date: parseInt(iso.slice(8), 10) + ' ' + MONTHS[parseInt(iso.slice(5, 7), 10) - 1], iso, desc: r.desc, acc: r.acc || 'Diğer', doc: r.dir === 'gelir' ? 'Fatura' : '—', rate: Number(r.rate) || 0, total, dir: r.dir === 'gelir' ? 'gelir' : 'gider', src: 'Tekrarlayan', rk: r.id + '|' + mk };
    if (r.br) row.br = r.br;
    out.push(row);
  });
  return out;
}

// Faturada kalan tutar (kısmi tahsilat dahil).
function invOpen(v: any): number {
  if (!v || v.st === 'odendi') return 0; const tot = Number(v.tot) || 0;
  const paid = Math.min(tot, (Array.isArray(v.pays) ? v.pays : []).reduce((t: number, p: any) => t + (Number(p.amt) || 0), 0));
  return Math.max(0, Math.round((tot - paid) * 100) / 100);
}

// Vadesi geçmiş faturalar: yöneticilere günde bir kez (10:00-12:00 arası).
function planOverdue(inv: any[], now: { date: string; min: number }): { key: string; title: string; body: string } | null {
  if (now.min < 10 * 60 || now.min >= 12 * 60 || !Array.isArray(inv)) return null;
  const late = inv.filter((v) => v && v.due && v.due < now.date && invOpen(v) > 0.005); if (!late.length) return null;
  const sum = late.reduce((t, v) => t + invOpen(v), 0);
  const top = late.slice().sort((a, b) => invOpen(b) - invOpen(a))[0];
  const tl = (n: number) => Math.round(n).toLocaleString('tr-TR') + ' ₺';
  return { key: 'overdue:' + now.date, title: 'Vadesi geçen alacak', body: late.length + ' fatura, toplam ' + tl(sum) + ' tahsilat bekliyor. En büyüğü: ' + (top.cust || '—') + ' ' + tl(invOpen(top)) + '.' };
}

const URL_ = Deno.env.get('SUPABASE_URL')!; const SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AKEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const AMODEL = Deno.env.get('KAIS_CRON_MODEL') || 'claude-haiku-5-5';
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



// Akşam özetine Kais yorumu: kısa, samimi, 1 öneri. Hata olursa düz özet gider.
async function kaisNote(biz: string, f: any, base: string): Promise<string> {
  if (!AKEY || Deno.env.get('KAIS_EVE_AI') === '0') return base;
  try {
    const NL = String.fromCharCode(10);
    const veri = JSON.stringify({ isletme: biz, bugun_ciro: f.ciro, bugun_gider: f.gider, son7gun_ort_ciro: Math.round(f.ort7), dun_ciro: f.dun, en_cok_satan: f.top, en_cok_gider: f.giderTop });
    const sys = ["Sen KaisPilot asistanı Kais'sin. Bir işletme sahibine akşam kapanış mesajı yazıyorsun.", 'Yalnızca verilen veriye dayan, rakam uydurma.', 'En fazla 2 kısa cümle yaz. Önce günün durumunu (ortalamaya göre iyi mi kötü mü), sonra tek bir somut öneri ver.', 'Samimi, sade Türkçe. Emoji ve tırnak kullanma. Toplam 200 karakteri geçme.'].join(NL);
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': AKEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: AMODEL, max_tokens: 120, system: sys, messages: [{ role: 'user', content: veri }] }) });
    if (!r.ok) return base;
    const j: any = await r.json(); const t = ((j.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ') || '').trim();
    if (!t) return base; return base + ' ' + t.slice(0, 220);
  } catch (e0) { return base; }
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

// Tekrarlayan kayıtlar: muh bölümüne sürüm kontrollü yazar (istemciyle çakışırsa yeniden dener).
async function runRec(bid: string, ekip: any, now: { date: string; min: number }) {
  if (!ekip.SETTINGS || !Array.isArray(ekip.SETTINGS.rec) || !ekip.SETTINGS.rec.length) return;
  for (let i = 0; i < 3; i++) {
    const r = await sb.from('app_state').select('state,version').eq('business_id', bid).eq('scope', 'muh').limit(1);
    const row = r.data && r.data[0]; if (!row) return;
    const st = JSON.parse(row.state); if (!Array.isArray(st.LEDGER)) st.LEDGER = [];
    const add = planRec(ekip.SETTINGS, st.LEDGER, now); if (!add.length) return;
    st.LEDGER.push(...add);
    const u = await sb.from('app_state').update({ state: JSON.stringify(st), version: row.version + 1, updated_at: new Date().toISOString() }).eq('business_id', bid).eq('scope', 'muh').eq('version', row.version).select('version');
    if (!u.error && u.data && u.data.length) return;
  }
}

// Hata alarmı: son 15 dakikadaki istemci hataları eşiği aşarsa platform yöneticilerine push (aynı hata saatte bir kez).
const NIL = '00000000-0000-0000-0000-000000000000';
async function alarmErrors(): Promise<number> {
  if (!VPUB || !VPRIV) return 0;
  const since = new Date(Date.now() - 15 * 60000).toISOString();
  const r = await sb.from('app_errors').select('msg,view,ver,user_id,business_id,created_at').gte('created_at', since).limit(500);
  if (r.error) { if (/app_errors|schema cache|does not exist/i.test(r.error.message || '')) return 0; throw r.error; }
  const plans = planErrors((r.data || []) as any[]); if (!plans.length) return 0;
  const adm = await sb.from('admin_users').select('user_id').eq('active', true);
  const ids = (adm.data || []).map((x: any) => x.user_id).filter(Boolean); if (!ids.length) return 0;
  const s = await sb.from('push_subs').select('endpoint,p256dh,auth').in('user_id', ids); const subs = s.data || []; if (!subs.length) return 0;
  let n = 0;
  for (const p of plans) {
    if (!(await claim(NIL, p.key, 'errs'))) continue;
    for (const x of subs) {
      try { await webpush.sendNotification({ endpoint: x.endpoint, keys: { p256dh: x.p256dh, auth: x.auth } }, JSON.stringify({ title: p.title, body: p.body, tag: 'kp-err', url: '/admin' })); n++; }
      catch (e) { const c = (e as any).statusCode; if (c === 404 || c === 410) await sb.from('push_subs').delete().eq('endpoint', x.endpoint); }
    }
  }
  return n;
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
      (vdRows.data || []).forEach((x: any) => { try { const s = JSON.parse(x.state); if (s.VD_F) vd.VD_F = s.VD_F; if (s.VD_T) vd.VD_T = s.VD_T; if (s.STOCK) stok.STOCK = s.STOCK; if (s.SALES) stok.SALES = s.SALES; if (s.LOTS) stok.LOTS = s.LOTS; if (s.ORDERS) stok.ORDERS = s.ORDERS; if (s.LEDGER) led.LEDGER = s.LEDGER; if (s.INV) led.INV = s.INV; } catch (_) { /* yoksay */ } });
      try { await runRec(bid, ekip, now); } catch (e) { out.errors.push('rec ' + bid + ': ' + String((e as Error).message)); }
      const od = planOverdue(led.INV || [], now); if (od && (await claim(bid, od.key, 'overdue'))) out.pushes += await pushManagers(bid, od.title, od.body, od.key);
      const names = ekip.NAMES || {};
      for (const l of planLate(ekip, vd, now)) {
        if (!(await claim(bid, l.key, 'late'))) continue;
        out.pushes += await pushManagers(bid, 'Geç kalan çalışan', ((names[l.uid] && names[l.uid].name) || 'Bir çalışan') + ' ' + lateTxt(l.min) + '.', l.key);
      }
      for (const a of planAlerts(stok, now).concat(planAlerts2(stok, now))) { if (await claim(bid, a.key, 'alert')) out.pushes += await pushManagers(bid, a.title, a.body, a.key); }
      const wk = planWeekly(stok, led, now); if (wk && (await claim(bid, wk.key, 'weekly'))) out.pushes += await pushManagers(bid, wk.title, wk.body, wk.key);
      const cl = planClose(stok, led, now);
      if (cl && !(ekip.SETTINGS && ekip.SETTINGS.kaisEve === false) && (await claim(bid, cl.key, 'close'))) {
        const msg = await kaisNote(biz, cl.facts, cl.body); out.pushes += await pushManagers(bid, cl.title, msg, cl.key);
      }
      const d = planDaily(ekip, now);
      if (d && (await claim(bid, d.key, 'daily'))) out.pushes += await pushManagers(bid, d.title, d.body, d.key);
    } catch (e) { out.errors.push(bid + ': ' + String((e as Error).message)); }
  }
  try { out.pushes += await pushMarket(); } catch (e) { out.errors.push('market: ' + String((e as Error).message)); }
  try { out.pushes += await alarmErrors(); } catch (e) { out.errors.push('alarm: ' + String((e as Error).message)); }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
});
