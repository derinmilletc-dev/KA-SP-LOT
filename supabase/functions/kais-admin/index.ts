// Kais admin paneli sunucusu. Yalnızca admin_users tablosundaki, 2FA (aal2) ile girmiş kişiler kullanabilir.
// Gerekli: Supabase'in kendi sırları (URL, ANON, SERVICE_ROLE). Yükleme: supabase functions deploy kais-admin   (JWT doğrulaması AÇIK)
// İşletmelerin muhasebe, çalışan ve fiş gibi kişisel verisi bu fonksiyondan GEÇMEZ; yalnızca sayı ve durum görülür.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ERR = (m: string, status = 400) => J({ ok: false, error: m }, status);

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SB_SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// Tahmini dolar maliyeti (kaba): sohbet Sonnet, okuma Haiku
const USD = { chat: 0.015, read: 0.0005 };
export const PERMS = ['businesses', 'ai', 'errors', 'events', 'feedback', 'limits', 'audit', 'kais'] as const;
const NLC = String.fromCharCode(10);
const AKEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const AMODEL = Deno.env.get('KAIS_ADMIN_MODEL') || 'claude-sonnet-5-5';
type Perm = typeof PERMS[number];

const dayIso = (d: number) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
const tsIso = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
const cleanPerms = (p: any) => { const o: Record<string, boolean> = {}; PERMS.forEach((k) => { if (p && p[k] === true) o[k] = true; }); return o; };
const intOrNull = (v: any) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 && n < 100000 ? n : null; };

function jwtAal(tok: string): string { try { const p = tok.split('.')[1]; return String(JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))).aal || ''); } catch { return ''; } }

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return ERR('Yalnızca POST.', 405);
  if (!SB_SRV) return ERR('Sunucu yapılandırılmamış.', 503);
  const auth = req.headers.get('Authorization') || '';
  const tok = auth.replace(/^Bearer\s+/i, '');
  if (!tok) return ERR('Giriş yapman gerekiyor.', 401);
  const user = createClient(SB_URL, SB_ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const u = await user.auth.getUser(tok);
  const me = u?.data?.user; if (!me) return ERR('Oturum geçersiz.', 401);
  const srv = createClient(SB_URL, SB_SRV, { auth: { persistSession: false } });
  const ar = await srv.from('admin_users').select('*').eq('user_id', me.id).maybeSingle();
  if (ar.error) return ERR('Admin tabloları kurulu değil. admin.sql çalıştırılmalı.', 503);
  const adm: any = ar.data; if (!adm || !adm.active) return ERR('Bu hesap admin değil.', 403);
  if (jwtAal(tok) !== 'aal2') return ERR('mfa_required', 401);
  let b: any; try { b = await req.json(); } catch { return ERR('İstek okunamadı.'); }
  const action = String(b?.action || '');
  const isSuper = adm.role === 'super';
  const can = (p: Perm) => isSuper || adm.perms?.[p] === true;
  const need = (p: Perm) => (can(p) ? null : ERR('Bu işlem için yetkin yok.', 403));
  const audit = async (a: string, target?: string, meta?: unknown) => { try { await srv.from('admin_audit').insert({ admin_id: me.id, email: adm.email, action: a, target: target || null, meta: meta || null }); } catch { /* yoksay */ } };

  // ortak veri
  const bizRows = async () => {
    let r: any = await srv.from('businesses').select('id,name,owner_id,created_at,suspended_at,suspended_note');
    if (r.error) r = await srv.from('businesses').select('id,name,owner_id,created_at');
    return (r.data || []) as any[];
  };
  const emails = async () => { const m: Record<string, string> = {}; try { const r = await srv.auth.admin.listUsers({ perPage: 1000 }); (r.data?.users || []).forEach((x: any) => { m[x.id] = x.email || ''; }); } catch { /* yoksay */ } return m; };
  const quota = async (days: number) => ((await srv.from('ai_quota').select('business_id,day,kind,n').gte('day', dayIso(days))).data || []) as any[];

  try {
    if (action === 'me') {
      await audit('giris');
      return J({ ok: true, admin: { email: adm.email, role: adm.role, perms: isSuper ? Object.fromEntries(PERMS.map((p) => [p, true])) : cleanPerms(adm.perms) } });
    }

    if (action === 'overview') {
      const out: any = { ok: true };
      if (can('businesses')) {
        const bz = await bizRows(); const mem = ((await srv.from('members').select('business_id,user_id')).data || []) as any[];
        const ev = ((await srv.from('app_events').select('business_id,created_at').gte('created_at', tsIso(7)).limit(20000)).data || []) as any[];
        const act = new Set(ev.map((x) => x.business_id).filter(Boolean));
        const series: Record<string, number> = {}; for (let i = 13; i >= 0; i--) series[dayIso(i)] = 0;
        bz.forEach((x) => { const d = String(x.created_at || '').slice(0, 10); if (d in series) series[d]++; });
        out.businesses = { total: bz.length, new7: bz.filter((x) => x.created_at >= tsIso(7)).length, new30: bz.filter((x) => x.created_at >= tsIso(30)).length, active7: act.size, suspended: bz.filter((x) => x.suspended_at).length, users: new Set(mem.map((m) => m.user_id)).size, signups: series };
      }
      if (can('ai')) {
        const q = await quota(31); const today = dayIso(0); const mo = today.slice(0, 7); const t = { chat: 0, read: 0 }, m = { chat: 0, read: 0 };
        const series: Record<string, number> = {}; for (let i = 13; i >= 0; i--) series[dayIso(i)] = 0;
        q.forEach((x) => { const k = x.kind as 'chat' | 'read'; if (!(k in t)) return; if (x.day === today) t[k] += x.n; if (String(x.day).slice(0, 7) === mo) m[k] += x.n; if (x.day in series) series[x.day] += x.n * USD[k]; });
        out.ai = { today: t, month: m, usdToday: t.chat * USD.chat + t.read * USD.read, usdMonth: m.chat * USD.chat + m.read * USD.read, series };
      }
      if (can('errors')) {
        const er = ((await srv.from('app_errors').select('created_at,msg').gte('created_at', tsIso(7)).limit(5000)).data || []) as any[];
        out.errors = { last24: er.filter((x) => x.created_at >= tsIso(1)).length, last7: er.length };
      }
      return J(out);
    }

    if (action === 'businesses') {
      const d = need('businesses'); if (d) return d;
      const [bz, em, mem, q, ev, er] = await Promise.all([bizRows(), emails(), srv.from('members').select('business_id,role'), can('ai') ? quota(31) : Promise.resolve([] as any[]),
        srv.from('app_events').select('business_id,created_at').gte('created_at', tsIso(30)).order('created_at', { ascending: false }).limit(20000),
        can('errors') ? srv.from('app_errors').select('business_id').gte('created_at', tsIso(7)).limit(5000) : Promise.resolve({ data: [] as any[] })]);
      const mo = dayIso(0).slice(0, 7); const search = String(b.q || '').toLowerCase().trim();
      const rows = bz.map((x) => {
        const ms = (mem.data || []).filter((m: any) => m.business_id === x.id);
        const last = ((ev.data || []) as any[]).find((e) => e.business_id === x.id)?.created_at || null;
        const qs = q.filter((y) => y.business_id === x.id && String(y.day).slice(0, 7) === mo);
        const chat = qs.filter((y) => y.kind === 'chat').reduce((a, y) => a + y.n, 0), read = qs.filter((y) => y.kind === 'read').reduce((a, y) => a + y.n, 0);
        const o: any = { id: x.id, name: x.name, created_at: x.created_at, owner: em[x.owner_id] || '', members: ms.length, last_seen: last, suspended: !!x.suspended_at };
        if (can('ai')) { o.ai = { chat, read, usd: chat * USD.chat + read * USD.read }; }
        if (can('errors')) o.errors7 = ((er.data || []) as any[]).filter((e) => e.business_id === x.id).length;
        return o;
      }).filter((x) => !search || String(x.name).toLowerCase().includes(search) || String(x.owner).toLowerCase().includes(search));
      rows.sort((a, c) => String(c.created_at).localeCompare(String(a.created_at)));
      return J({ ok: true, rows });
    }

    if (action === 'business') {
      const d = need('businesses'); if (d) return d;
      const id = String(b.id || ''); if (!/^[0-9a-f-]{36}$/i.test(id)) return ERR('İşletme yok.');
      const x = (await bizRows()).find((r) => r.id === id); if (!x) return ERR('İşletme bulunamadı.', 404);
      const em = await emails(); const mem = ((await srv.from('members').select('role,created_at,user_id').eq('business_id', id)).data || []) as any[];
      const roles: Record<string, number> = {}; mem.forEach((m) => { roles[m.role] = (roles[m.role] || 0) + 1; });
      const out: any = { ok: true, business: { id, name: x.name, created_at: x.created_at, owner: em[x.owner_id] || '', roles, suspended_at: x.suspended_at || null, suspended_note: x.suspended_note || '' } };
      out.members = mem.map((m) => ({ email: em[m.user_id] || '', role: m.role, since: m.created_at })).sort((p1, p2) => String(p1.since).localeCompare(String(p2.since)));
      const full = await srv.from('businesses').select('*').eq('id', id).maybeSingle();
      const fr: any = full.data || {}; const info: Record<string, any> = {};
      ['lat', 'lng', 'city', 'il', 'ilce', 'district', 'address', 'adres', 'phone', 'telefon', 'sector', 'sektor'].forEach((k) => { if (fr[k] !== undefined && fr[k] !== null && fr[k] !== '') info[k] = fr[k]; });
      out.info = info;
      const cnt = async (t: string) => { try { const r = await srv.from(t).select('*', { count: 'exact', head: true }).eq('business_id', id); return r.error ? null : (r.count || 0); } catch (e0) { return null; } };
      const lastOf = async (t: string, col: string) => { try { const r = await srv.from(t).select(col).eq('business_id', id).order(col, { ascending: false }).limit(1); return r.error ? null : ((r.data as any[])?.[0]?.[col] || null); } catch (e0) { return null; } };
      out.usage = { cihaz_bildirim: await cnt('push_subs'), yedek_sayisi: await cnt('backups'), son_yedek: await lastOf('backups', 'created_at'), bekleyen_davet: await cnt('invites'), son_veri_guncelleme: await lastOf('app_state', 'updated_at') };
      try {
        const ea = ((await srv.from('app_events').select('created_at,n').eq('business_id', id).order('created_at', { ascending: true }).limit(5000)).data || []) as any[];
        const days = new Set(ea.map((e) => String(e.created_at).slice(0, 10)));
        out.activity = { ilk: ea[0]?.created_at || null, son: ea.length ? ea[ea.length - 1].created_at : null, aktif_gun: days.size, toplam_olay: ea.reduce((t, e) => t + (e.n || 1), 0) };
      } catch (e0) { /* yoksay */ }
      if (can('ai')) {
        const q = await quota(31);
        const mine = q.filter((y) => y.business_id === id);
        const series: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) series[dayIso(i)] = 0;
        mine.forEach((y) => { if (y.day in series) series[y.day] += y.n; });
        out.ai = { series };
        const lm = await srv.from('ai_limits').select('*').eq('business_id', id).maybeSingle();
        out.limits = lm.data || null;
      }
      if (can('errors')) out.errors = ((await srv.from('app_errors').select('created_at,view,msg,ver').eq('business_id', id).order('created_at', { ascending: false }).limit(10)).data || []);
      if (can('events')) {
        const ev = ((await srv.from('app_events').select('ev,n').eq('business_id', id).gte('created_at', tsIso(30)).limit(5000)).data || []) as any[];
        const m: Record<string, number> = {};
        ev.forEach((e) => { m[e.ev] = (m[e.ev] || 0) + e.n; });
        out.events = Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 8);
      }
      return J(out);
    }

    if (action === 'ai') {
      const d = need('ai'); if (d) return d;
      const q = await quota(31); const bz = await bizRows(); const name: Record<string, string> = {}; bz.forEach((x) => { name[x.id] = x.name; });
      const lm = ((await srv.from('ai_limits').select('*')).data || []) as any[];
      const mo = dayIso(0).slice(0, 7); const per: Record<string, any> = {};
      q.forEach((y) => { if (String(y.day).slice(0, 7) !== mo) return; const o = per[y.business_id] || (per[y.business_id] = { id: y.business_id, name: name[y.business_id] || '—', chat: 0, read: 0 }); o[y.kind] += y.n; });
      const rows = Object.values(per).map((o: any) => ({ ...o, usd: o.chat * USD.chat + o.read * USD.read, custom: lm.some((l) => l.business_id === o.id) })).sort((a: any, c: any) => c.usd - a.usd);
      const series: Record<string, number> = {}; for (let i = 29; i >= 0; i--) series[dayIso(i)] = 0; q.forEach((y) => { if (y.day in series) series[y.day] += y.n * (USD as any)[y.kind]; });
      return J({ ok: true, rows, series, usd: USD });
    }

    if (action === 'set_limit') {
      const d = need('limits'); if (d) return d;
      const id = String(b.business_id || ''); if (!/^[0-9a-f-]{36}$/i.test(id)) return ERR('İşletme yok.');
      const v = { business_id: id, chat_day: intOrNull(b.chat_day), chat_month: intOrNull(b.chat_month), read_day: intOrNull(b.read_day), read_month: intOrNull(b.read_month), note: String(b.note || '').slice(0, 200) || null, updated_at: new Date().toISOString(), updated_by: adm.email };
      if (b.clear === true) { await srv.from('ai_limits').delete().eq('business_id', id); await audit('limit_sifirla', id); return J({ ok: true }); }
      const r = await srv.from('ai_limits').upsert(v); if (r.error) return ERR('Kaydedilemedi.', 500);
      await audit('limit_degistir', id, v); return J({ ok: true });
    }

    if (action === 'errors') {
      const d = need('errors'); if (d) return d;
      const er = ((await srv.from('app_errors').select('created_at,business_id,role,view,msg,ver').gte('created_at', tsIso(14)).order('created_at', { ascending: false }).limit(3000)).data || []) as any[];
      const g: Record<string, any> = {};
      er.forEach((x) => { const o = g[x.msg] || (g[x.msg] = { msg: x.msg, n: 0, last: x.created_at, views: {}, vers: {}, biz: new Set() }); o.n++; if (x.view) o.views[x.view] = 1; if (x.ver) o.vers[x.ver] = 1; if (x.business_id) o.biz.add(x.business_id); });
      const groups = Object.values(g).map((o: any) => ({ msg: o.msg, n: o.n, last: o.last, views: Object.keys(o.views), vers: Object.keys(o.vers), biz: o.biz.size })).sort((a: any, c: any) => c.n - a.n).slice(0, 60);
      return J({ ok: true, groups, total: er.length });
    }

    if (action === 'events') {
      const d = need('events'); if (d) return d;
      const days = b.days === 30 ? 30 : 7;
      const ev = ((await srv.from('app_events').select('ev,n,created_at').gte('created_at', tsIso(days)).limit(30000)).data || []) as any[];
      const m: Record<string, number> = {}; const series: Record<string, number> = {}; for (let i = days - 1; i >= 0; i--) series[dayIso(i)] = 0;
      ev.forEach((e) => { m[e.ev] = (m[e.ev] || 0) + e.n; const k = String(e.created_at).slice(0, 10); if (k in series) series[k] += e.n; });
      const rows = Object.entries(m).map(([ev, n]) => ({ ev, n })).sort((a, c) => c.n - a.n).slice(0, 40);
      return J({ ok: true, rows, series, days });
    }

    if (action === 'feedback') {
      const d = need('feedback'); if (d) return d;
      const r = await srv.from('account_feedback').select('created_at,reason,note,role,was_owner').order('created_at', { ascending: false }).limit(200);
      const rows = (r.data || []) as any[]; const cnt: Record<string, number> = {}; rows.forEach((x) => { const k = x.reason || 'Belirtilmemiş'; cnt[k] = (cnt[k] || 0) + 1; });
      return J({ ok: true, rows, counts: Object.entries(cnt).sort((a, c) => c[1] - a[1]) });
    }


    if (action === 'kais') {
      const d = need('kais'); if (d) return d;
      if (!AKEY) return ERR('Kais AI kurulmamış (ANTHROPIC_API_KEY yok).', 503);
      const snap: any = { tarih: dayIso(0), saat_dilimi: 'Europe/Istanbul' };
      if (can('businesses')) {
        const bz = await bizRows(); const em = await emails();
        const ev7 = ((await srv.from('app_events').select('business_id,created_at').gte('created_at', tsIso(7)).limit(20000)).data || []) as any[];
        const act = new Set(ev7.map((x) => x.business_id).filter(Boolean));
        snap.isletmeler = { toplam: bz.length, son7gun_yeni: bz.filter((x) => x.created_at >= tsIso(7)).length, son30gun_yeni: bz.filter((x) => x.created_at >= tsIso(30)).length, son7gun_aktif: act.size, askida: bz.filter((x) => x.suspended_at).map((x) => x.name),
          yeniler: bz.slice().sort((a, c) => String(c.created_at).localeCompare(String(a.created_at))).slice(0, 6).map((x) => ({ ad: x.name, sahip: em[x.owner_id] || '', tarih: String(x.created_at).slice(0, 10) })),
          pasif_14gun: bz.filter((x) => !ev7.some((e) => e.business_id === x.id)).slice(0, 10).map((x) => x.name) };
      }
      if (can('ai')) {
        const q = await quota(31); const bz = await bizRows(); const nm: Record<string, string> = {}; bz.forEach((x) => { nm[x.id] = x.name; });
        const today = dayIso(0); const mo = today.slice(0, 7); const per: Record<string, any> = {}; let tc = 0, tr = 0, mc = 0, mr = 0;
        q.forEach((y) => { const k = y.kind as 'chat' | 'read'; if (y.day === today) { if (k === 'chat') tc += y.n; else tr += y.n; } if (String(y.day).slice(0, 7) === mo) { if (k === 'chat') mc += y.n; else mr += y.n; const o = per[y.business_id] || (per[y.business_id] = { ad: nm[y.business_id] || '-', sohbet: 0, okuma: 0 }); o[k === 'chat' ? 'sohbet' : 'okuma'] += y.n; } });
        snap.ai = { bugun: { sohbet: tc, okuma: tr, tahmini_usd: +(tc * USD.chat + tr * USD.read).toFixed(2) }, bu_ay: { sohbet: mc, okuma: mr, tahmini_usd: +(mc * USD.chat + mr * USD.read).toFixed(2) }, en_cok_kullanan: Object.values(per).sort((a: any, c: any) => (c.sohbet * USD.chat + c.okuma * USD.read) - (a.sohbet * USD.chat + a.okuma * USD.read)).slice(0, 6) };
      }
      if (can('errors')) {
        const er = ((await srv.from('app_errors').select('created_at,msg,view,ver').gte('created_at', tsIso(7)).limit(3000)).data || []) as any[]; const g: Record<string, any> = {};
        er.forEach((x) => { const o = g[x.msg] || (g[x.msg] = { mesaj: String(x.msg).slice(0, 160), adet: 0, ekran: x.view || '', surum: x.ver || '' }); o.adet++; });
        snap.hatalar = { son24saat: er.filter((x) => x.created_at >= tsIso(1)).length, son7gun: er.length, en_sik: Object.values(g).sort((a: any, c: any) => c.adet - a.adet).slice(0, 8) };
      }
      if (can('events')) {
        const ev = ((await srv.from('app_events').select('ev,n').gte('created_at', tsIso(7)).limit(20000)).data || []) as any[]; const m: Record<string, number> = {};
        ev.forEach((e) => { m[e.ev] = (m[e.ev] || 0) + e.n; });
        snap.kullanim_7gun = Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 14).map(([k, n]) => ({ olay: k, adet: n }));
      }
      if (can('feedback')) {
        const r = ((await srv.from('account_feedback').select('created_at,reason,note').order('created_at', { ascending: false }).limit(30)).data || []) as any[]; const cnt: Record<string, number> = {};
        r.forEach((x) => { const k = x.reason || 'Belirtilmemiş'; cnt[k] = (cnt[k] || 0) + 1; });
        snap.ayrilma_geri_bildirimi = { nedenler: cnt, son_notlar: r.filter((x) => x.note).slice(0, 5).map((x) => String(x.note).slice(0, 200)) };
      }
      const brief = b.brief === true;
      const hist = (Array.isArray(b.messages) ? b.messages : []).slice(-12).map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 3000) })).filter((m: any) => m.content);
      if (brief) hist.length = 0;
      if (brief) hist.push({ role: 'user', content: 'Günlük özet hazırla.' });
      if (!hist.length || hist[hist.length - 1].role !== 'user') return ERR('Mesaj yok.');
      const sys = [
        "Sen KaisPilot platformunun yönetici asistanı Kais AI'sın. Yalnızca"+' '+' platformun sahibine ve yetkili yöneticilerine hizmet edersin.',
        'KaisPilot işletmeler için muhasebe, ekip, stok ve fatura uygulamasıdır. Aşağıdaki JSON, platformun şu anki özet verisidir. Yalnızca buna dayan, veride olmayan şeyi uydurma; yoksa "bu veride yok" de.',
        'İşletmelerin muhasebe, çalışan veya fiş içeriklerini görmezsin; yalnızca sayılar ve durumlar vardır.',
        'Türkçe, kısa ve net yaz. Telefon ekranı için kısa paragraflar kullan. Rakamları yuvarla, dolar tutarları tahmindir.',
        brief ? 'Görev: günlük özet. Yapı: 1) Bir cümlelik genel durum. 2) Dikkat edilecekler (en fazla 3 madde: hatalar, maliyet, pasif işletme). 3) Fırsatlar veya önerilen 1-2 aksiyon. Toplam 120 kelimeyi geçme.' : 'Soruya veriden cevap ver, gerekirse 1-2 somut öneri ekle.',
        'VERİ: ' + JSON.stringify(snap),
      ].join(NLC);
      const rr = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': AKEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: AMODEL, max_tokens: 900, system: sys, messages: hist }) });
      if (!rr.ok) return ERR('Kais AI şu an cevap veremedi.', 502);
      const jj: any = await rr.json(); const text = (jj.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join(NLC).trim();
      await audit(brief ? 'kais_ozet' : 'kais_soru');
      return J({ ok: true, text: text || 'Cevap boş geldi.' });
    }

    if (action === 'suspend' || action === 'unsuspend') {
      if (!isSuper) return ERR('Bu işlemi yalnızca ana admin yapabilir.', 403);
      const id = String(b.business_id || ''); if (!/^[0-9a-f-]{36}$/i.test(id)) return ERR('İşletme yok.');
      const on = action === 'suspend'; const note = String(b.note || '').slice(0, 200);
      const r = await srv.from('businesses').update({ suspended_at: on ? new Date().toISOString() : null, suspended_note: on ? note : null }).eq('id', id);
      if (r.error) return ERR('Güncellenemedi. admin.sql çalıştırıldı mı?', 500);
      await audit(on ? 'askiya_al' : 'askidan_cikar', id, { note }); return J({ ok: true });
    }

    if (action === 'mods_list') {
      if (!isSuper) return ERR('Bu işlemi yalnızca ana admin yapabilir.', 403);
      const r = await srv.from('admin_users').select('user_id,email,role,perms,active,created_at').order('created_at');
      return J({ ok: true, rows: r.data || [], perms: PERMS });
    }
    if (action === 'mod_add') {
      if (!isSuper) return ERR('Bu işlemi yalnızca ana admin yapabilir.', 403);
      const email = String(b.email || '').trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return ERR('Geçerli bir e-posta yaz.');
      const em = await emails(); const uid = Object.keys(em).find((k) => em[k].toLowerCase() === email);
      if (!uid) return ERR('Bu e-postayla kayıtlı hesap yok. Moderatör önce admin giriş sayfasından hesap oluşturmalı.');
      const r = await srv.from('admin_users').upsert({ user_id: uid, email, role: 'mod', perms: cleanPerms(b.perms), active: true, created_by: adm.email });
      if (r.error) return ERR('Eklenemedi.', 500); await audit('mod_ekle', email, cleanPerms(b.perms)); return J({ ok: true });
    }
    if (action === 'mod_update') {
      if (!isSuper) return ERR('Bu işlemi yalnızca ana admin yapabilir.', 403);
      const id = String(b.user_id || ''); const t = await srv.from('admin_users').select('*').eq('user_id', id).maybeSingle(); if (!t.data) return ERR('Bulunamadı.', 404);
      if ((t.data as any).role === 'super') return ERR('Ana admin değiştirilemez.', 403);
      const patch: any = {}; if (b.perms) patch.perms = cleanPerms(b.perms); if (typeof b.active === 'boolean') patch.active = b.active;
      const r = await srv.from('admin_users').update(patch).eq('user_id', id); if (r.error) return ERR('Güncellenemedi.', 500);
      await audit('mod_guncelle', (t.data as any).email, patch); return J({ ok: true });
    }
    if (action === 'mod_remove') {
      if (!isSuper) return ERR('Bu işlemi yalnızca ana admin yapabilir.', 403);
      const id = String(b.user_id || ''); const t = await srv.from('admin_users').select('*').eq('user_id', id).maybeSingle(); if (!t.data) return ERR('Bulunamadı.', 404);
      if ((t.data as any).role === 'super') return ERR('Ana admin silinemez.', 403);
      await srv.from('admin_users').delete().eq('user_id', id); await audit('mod_sil', (t.data as any).email); return J({ ok: true });
    }

    if (action === 'audit') {
      const d = need('audit'); if (d) return d;
      const r = await srv.from('admin_audit').select('at,email,action,target,meta').order('at', { ascending: false }).limit(200);
      return J({ ok: true, rows: r.data || [] });
    }
    return ERR('Bilinmeyen işlem.');
  } catch (e) {
    console.error('kais-admin', String((e as Error)?.message || e));
    return ERR('Sunucu hatası.', 500);
  }
}

Deno.serve(handle);
