/* ---- Toplu giriş ---- */
function parseBulk(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean); const out = { rows: [], errors: [] }; if (!lines.length) return out;
  const del = [';', '\t', ','].find((d) => lines[0].includes(d)) || ';'; let c = { n: 0, u: 1, q: 2, m: 3, c: 4, cat: 5, loc: 6, code: 7 }; let start = 0;
  const h = lines[0].split(del).map((x) => x.trim().toLocaleLowerCase('tr-TR'));
  if (h.some((x) => /ürün|urun|ad$|^ad|birim|miktar/.test(x))) { start = 1; const f = (re) => h.findIndex((x) => re.test(x)); const m = { n: f(/ürün|urun|^ad/), u: f(/birim/), q: f(/miktar|adet|stok/), m: f(/en az|min/), c: f(/maliyet|fiyat/), cat: f(/kategori/), loc: f(/yer|depo|raf/), code: f(/barkod|kod/) }; if (m.n >= 0 && m.q >= 0) c = m; }
  for (let i = start; i < lines.length; i++) {
    const x = lines[i].split(del).map((s) => s.trim().replace(/^"|"$/g, '')); const g = (k) => (c[k] >= 0 ? x[c[k]] : undefined); const name = g('n'); const q = trNum(g('q'));
    if (!name || !(q >= 0)) { out.errors.push('Satır ' + (i + 1) + ' okunamadı: ' + lines[i].slice(0, 40)); continue; }
    const mn = trNum(g('m')); const cs = trNum(g('c')); out.rows.push({ name, unit: g('u') || '', qty: q, min: isNaN(mn) ? null : mn, cost: isNaN(cs) ? null : cs, cat: g('cat') || '', loc: g('loc') || '', code: g('code') || '' });
  }
  return out;
}
const bulkMatch = (r) => (r.code && STOCK.find((s) => s.code && String(s.code) === r.code)) || STOCK.find((s) => prodKey(s.name) === prodKey(r.name));
H.stkbulk = () => { S.modal = { type: 'stkbulk', text: '' }; renderModal(); };
NEWM.stkbulk = (m) => { const p = parseBulk(m.text); const nw = p.rows.filter((r) => !bulkMatch(r)).length; const up = p.rows.length - nw;
  return sheet('Stok içe aktar', `<p class="muted small">Excel'de listeni hazırla, <b>Farklı kaydet → CSV</b> yap. Dosyayı seç ya da satırları yapıştır. Sütunlar: Ürün; Birim; Miktar; En az; Maliyet; Kategori; Yer; Barkod. Aynı adlı ürün güncellenir, yenisi eklenir.</p>
  <div class="row wrap" style="gap:8px;margin:8px 0"><input type="file" id="bk-file" accept=".csv,.txt,.xlsx,text/csv,text/plain" data-ch="bulkfile" aria-label="CSV ya da Excel dosyası"><button class="btn sm sec" data-a="bulktpl">Şablon indir</button></div>
  <div class="field"><label for="bk-txt">Satırlar</label><textarea id="bk-txt" rows="6" data-ch="bulktxt" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;font:inherit" placeholder="Ürün;Birim;Miktar;En az;Maliyet;Kategori;Yer;Barkod">${esc(m.text)}</textarea></div>
  ${p.rows.length ? `<div class="callout">${ic('info')}<div>${nw} yeni ürün, ${up} güncellenecek.${p.errors.length ? ' ' + p.errors.length + ' satır okunamadı.' : ''}</div></div>${p.errors.slice(0, 3).map((e) => `<p class="small muted">${esc(e)}</p>`).join('')}<button class="btn" data-a="bulkgo">İçe aktar</button>` : '<p class="small muted">Önizleme için satır ekle.</p>'}`); };
H.bulktpl = async () => {
  const csv = '﻿Ürün;Birim;Miktar;En az;Maliyet;Kategori;Yer;Barkod\nSüt (1 L);adet;36;40;38;Süt ürünleri;Soğuk oda;8690000000011\nUn (50 kg çuval);çuval;8;5;640;Kuru gıda;Depo;\n';
  if (typeof DL === 'undefined' || !DL) { toast('Bu ekranda indirme kullanılamıyor.', 'warn'); return; }
  try { await DL.save({ filename: 'stok-sablonu.csv', data: new Blob([csv], { type: 'text/csv;charset=utf-8' }) }); } catch (e) {}
};
H.bulkgo = () => {
  const m = S.modal; if (!m || m.type !== 'stkbulk') return; const p = parseBulk(m.text); let nw = 0; let up = 0;
  p.rows.forEach((r) => {
    let st = bulkMatch(r);
    if (st) { const d = r3(r.qty - st.qty); if (d !== 0) mv(st, d, 'giris', 'Toplu içe aktarma'); st.qty = r.qty; up++; }
    else { st = { id: 's' + (++seq), name: r.name, unit: r.unit || 'adet', qty: r.qty, min: r.min != null ? r.min : 0, cost: r.cost != null ? r.cost : 0, use: 0, sup: null }; STOCK.push(st); mv(st, r.qty, 'giris', 'Toplu içe aktarma'); nw++; }
    if (r.unit && st.unit !== r.unit && !bulkMatch === false) st.unit = st.unit || r.unit;
    if (r.min != null) st.min = r.min; if (r.cost != null) st.cost = r.cost; if (r.cat) st.cat = r.cat; if (r.loc) st.loc = r.loc; if (r.code) st.code = r.code;
  });
  auditAdd({ type: 'ord', text: 'Stok içe aktarıldı: ' + nw + ' yeni, ' + up + ' güncellenen' }); S.modal = null; render(); toast(nw + ' yeni, ' + up + ' güncellenen ürün.', 'ok');
};
const _och16 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'scode') { const st = stById(el.dataset.id); if (st) { const v = el.value.trim(); const dup = v && STOCK.find((s) => s.id !== st.id && s.code === v); if (dup) { toast('Bu barkod ' + dup.name + ' ürününde kayıtlı.', 'warn'); render(); return; } st.code = v; render(); } return; }
  if (ch === 'bcin') { if (el.value.trim()) bcHandle(el.value); return; }
  if (ch === 'bulktxt' && S.modal && S.modal.type === 'stkbulk') { S.modal.text = el.value; renderModal(); return; }
  if (ch === 'bulkfile' && S.modal && S.modal.type === 'stkbulk') { const f = el.files && el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { if (S.modal && S.modal.type === 'stkbulk') { S.modal.text = String(rd.result || '').replace(/^﻿/, ''); renderModal(); } }; rd.readAsText(f, 'utf-8'); return; }
  return _och16(e);
};

/* v17: bulut eşitleme (Supabase app_state) */
const CL = { on: false, ver: 0, timer: null, busy: false, err: '', at: '' };
const clTime = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
async function cloudConflict() {
  const c = sbClient(); const r = await c.from('app_state').select('state,version').eq('business_id', SBS.biz.id).limit(1);
  if (r.error || !r.data || !r.data[0]) throw (r.error || new Error('Bulut kaydı okunamadı.'));
  CL.ver = r.data[0].version; PS.remote = r.data[0].state; PS.state = 'saved';
  toast('Başka cihazda değişiklik olmuş, güncellendi. Son işlemini kontrol et.', 'warn'); setTimeout(() => { render(); }, 60);
}
async function cloudSet(d) {
  const c = sbClient(); const bid = SBS.biz.id;
  if (CL.ver === 0) {
    const i = await c.from('app_state').insert({ business_id: bid, state: d.s, version: 1, updated_by: SBS.user.id });
    if (i.error) { if (/duplicate|23505/i.test(String(i.error.message) + String(i.error.code))) return cloudConflict(); throw i.error; }
    CL.ver = 1; CL.at = clTime(); return;
  }
  const u = await c.from('app_state').update({ state: d.s, version: CL.ver + 1, updated_at: new Date().toISOString(), updated_by: SBS.user.id }).eq('business_id', bid).eq('version', CL.ver).select('version');
  if (u.error) throw u.error; if (!u.data || !u.data.length) return cloudConflict();
  CL.ver += 1; CL.at = clTime();
}
async function cloudPoll() {
  if (!CL.on || PS.busy || CL.busy || !SBS.biz) return; CL.busy = true;
  try {
    const c = sbClient(); const v = await c.from('app_state').select('version').eq('business_id', SBS.biz.id).limit(1);
    if (!v.error && v.data && v.data[0] && v.data[0].version > CL.ver) {
      const r = await c.from('app_state').select('state,version').eq('business_id', SBS.biz.id).limit(1);
      if (!r.error && r.data && r.data[0]) { CL.ver = r.data[0].version; CL.at = clTime(); if (r.data[0].state !== PS.last) { PS.remote = r.data[0].state; render(); } }
    }
  } catch (e) {} CL.busy = false;
}
async function cloudAttach() {
  const c = sbClient(); if (!c || !SBS.biz || CL.on) return;
  const r = await c.from('app_state').select('state,version').eq('business_id', SBS.biz.id).limit(1);
  if (r.error) { CL.err = /app_state/.test(r.error.message || '') ? 'Bulut tablosu kurulmamış. Supabase SQL Editor\'de app_state SQL\'ini çalıştır.' : sbMsg(r.error); return; }
  CL.err = ''; const row = r.data && r.data[0];
  if (!PS.localDb) PS.localDb = PS.db; PS.cloudOn = true; CL.on = true;
  PS.db = { doc: () => ({ set: cloudSet, onSnapshot() {} }) }; PS.canWrite = true; PS.loaded = true;
  if (row) { CL.ver = row.version; CL.at = clTime(); if (pApply(row.state)) PS.last = pSnap(); PS.state = 'saved'; toast('Bulut verisi yüklendi.', 'ok'); }
  else { CL.ver = 0; PS.last = ''; PS.state = 'saving'; pSched(); }
  clearInterval(CL.timer); CL.timer = setInterval(cloudPoll, 8000);
}
function cloudOff() { clearInterval(CL.timer); CL.on = false; CL.ver = 0; PS.cloudOn = false; PS.db = PS.localDb || null; PS.state = 'local'; }
async function cloudTry() { try { await cloudAttach(); } catch (e) { CL.err = sbMsg(e); } }
const sbBootV16 = sbBoot;
sbBoot = async function () { await sbBootV16(); await cloudTry(); render(); };
H.sbin = async () => { await sbAuth(false); await cloudTry(); render(); };
H.sbup = async () => { await sbAuth(true); await cloudTry(); render(); };
const _sbout17 = H.sbout; H.sbout = async () => { cloudOff(); await _sbout17(); };
H.cloudsync = async () => { if (!CL.on) { await cloudTry(); render(); return; } await cloudPoll(); await pFlush(); render(); toast('Eşitlendi.', 'ok'); };
const paintStatusV16 = paintStatus;
paintStatus = function () { const e = document.getElementById('ps-chip'); if (e) e.textContent = (CL.on ? 'Bulut · ' : '') + (PS_TXT[PS.state] || ''); };
function cloudCard() {
  if (!sbOK() || !SBS.user) return '';
  return `<div class="card stack"><div class="row between wrap"><div><h3>Ortak veri (bulut)</h3><p class="muted small" style="margin-top:2px">${CL.on ? 'Bu cihazdaki değişiklikler aynı hesapla bağlanan diğer cihazlara birkaç saniyede geçer.' : 'Veri şu an yalnızca bu cihazda duruyor.'}</p></div><span class="pill ${CL.on ? 'p-ok' : 'p-warn'}">${CL.on ? 'Açık' : 'Kapalı'}</span></div>
  ${CL.on ? `<p class="small muted">Son eşitleme: ${esc(CL.at || '-')}. Sürüm ${CL.ver}.</p>` : ''}${CL.err ? `<div class="callout warn">${ic('alert')}<div>${esc(CL.err)}</div></div>` : ''}
  <div class="row wrap"><button class="btn sm sec" data-a="cloudsync">${CL.on ? 'Şimdi eşitle' : 'Tekrar dene'}</button></div></div>`;
}
const sbCardV16 = sbCard; sbCard = function () { return sbCardV16() + cloudCard(); };
/* v18: gerçek hesaplar, işletme üyeliği, davet kodu, üçlü giriş */
const NAMES = {}; P_OBJ.push(['NAMES', () => NAMES]);
const ID = { mems: [], active: null, team: null, teamBusy: false, pref: null, busy: false };
function applyNames() { Object.keys(NAMES).forEach((uid) => { const u = byId(uid); if (u && NAMES[uid]) { if (NAMES[uid].name) u.name = NAMES[uid].name; if (NAMES[uid].title) u.title = NAMES[uid].title; } }); }
const pApplyV17 = pApply; pApply = function (s) { const ok = pApplyV17(s); if (ok) applyNames(); return ok; };
const idMsg = (e) => { const m = String((e && e.message) || e || ''); return /relation .*(members|invites)|claim_invite.*(exist|find)|schema cache/i.test(m) ? 'Giriş tabloları kurulmamış. kaispilot_giris.sql dosyasını Supabase\'de çalıştır.' : /too_many_attempts/.test(m) ? 'Çok fazla yanlış deneme. 15 dakika sonra tekrar dene.' : /invalid_code/.test(m) ? 'Davet kodu geçersiz ya da süresi dolmuş.' : /already_member/.test(m) ? 'Bu hesap zaten bu işletmede.' : /plan_limit_members/.test(m) ? 'İşletmenin planındaki üye sınırına ulaşıldı. Planı yükseltmek için bizimle iletişime geç.' : /seat_taken/.test(m) ? 'Bu davetin yeri daha önce doldurulmuş. İşverenden yeni kod iste.' : /duplicate key/.test(m) ? 'Bu kayıt zaten var.' : sbMsg(e); };
const canSup = () => !ID.active || ['patron', 'mudur'].includes(ID.active.role);
sbLoadBiz = async function () {
  const c = sbClient(); if (!c || !SBS.user) return;
  const r = await c.from('members').select('business_id,role,app_uid,display_name,businesses(id,name,owner_id)').eq('user_id', SBS.user.id); if (r.error) throw r.error;
  ID.mems = (r.data || []).filter((m) => m.businesses); ID.active = null; SBS.biz = null;
  const pick = ID.mems.find((m) => m.business_id === ID.pref) || (ID.mems.length === 1 ? ID.mems[0] : null);
  if (pick) { ID.active = pick; SBS.biz = pick.businesses; if (canSup()) await sbSyncSups(); }
};
const sbPullV17 = sbPull; sbPull = async function () { return canSup() ? sbPullV17() : false; };
async function idEnter() {
  if (!SBS.user || !ID.active) { render(); return; }
  await cloudTry(); BIZ = ID.active.businesses.name; applyNames();
  const u = byId(ID.active.app_uid); if (!u) { S.loginErr = 'Bu hesabın yeri bulunamadı. İşverenle konuş.'; render(); return; }
  if (ID.active.display_name && !NAMES[u.id]) u.name = ID.active.display_name;
  u.role = ID.active.role; ID.team = null; S.demoMode = false; loginAs(u);
}
const _sbin18 = H.sbin; H.sbin = async () => { await _sbin18(); if (ID.active && (!S.user || S.demoMode)) await idEnter(); };
const _sbup18 = H.sbup; H.sbup = async () => { await _sbup18(); if (ID.active && (!S.user || S.demoMode)) await idEnter(); };
const sbBootV17 = sbBoot; sbBoot = async function () { await sbBootV17(); await idEnter(); };
async function idAuth(kind, mode) {
  const g = (id) => ((document.getElementById(id) || {}).value || '').trim(); const em = g('id-em'); const pw = (document.getElementById('id-pw') || {}).value || ''; const code = g('id-code').toUpperCase(); const bn = g('id-biz'); const nm = g('id-name');
  const fail = (t) => { S.loginErr = t; const e = document.getElementById('id-err'); if (e) e.textContent = t; ID.busy = false; };
  if (!em || pw.length < 8) return fail('E-posta ve en az 8 karakterlik şifre yaz.');
  if (kind === 'emp' && mode === 'new' && !code) return fail('Davet kodunu yaz.');
  if (kind === 'own' && mode === 'new' && !bn) return fail('İşletme adını yaz.');
  const c = sbClient(); if (!c) return fail('Bulut bağlantısı kullanılamıyor.'); ID.busy = true; S.loginErr = '';
  try {
    let r;
    if (mode === 'new') { r = await c.auth.signUp({ email: em, password: pw }); if (r.error && /already registered/i.test(r.error.message || '')) r = await c.auth.signInWithPassword({ email: em, password: pw }); }
    else r = await c.auth.signInWithPassword({ email: em, password: pw });
    if (r.error) throw r.error;
    if (!r.data.session) return fail('Hesap açıldı. E-postana gelen onay bağlantısına tıkla, sonra aynı bilgilerle tekrar dene.');
    SBS.user = r.data.session.user; await sbLoadBiz();
    if (code) { const x = await c.rpc('claim_invite', { p_code: code }); if (x.error) throw x.error; if (x.data && x.data.error) throw new Error(x.data.error); await sbLoadBiz(); }
    if (!ID.mems.length) {
      if (kind === 'emp') return fail('Bu hesap henüz bir işletmeye katılmamış. "Davet koduyla katıl"a basıp kodunu gir.');
      if (!bn) return fail('Bu hesapta işletme yok. İşletme adını yazıp İşletmemi oluştur\'a bas.');
      const i = await c.from('businesses').insert({ name: bn, owner_id: SBS.user.id }); if (i.error) throw i.error;
      NAMES.u1 = { name: nm || 'Patron', title: 'Patron' }; BIZ = bn; wipeData(); PEND.tur = (document.getElementById('id-tur') || {}).value || ''; applyNames(); await sbLoadBiz();
    }
    ID.busy = false; if (ID.mems.length > 1 && !ID.active) { render(); return; } await idEnter();
  } catch (e) { fail(idMsg(e)); }
}
H.lgtab = (el) => { S.lgTab = el.dataset.v; render(); };
H.idin = () => { idAuth(S.lgTab || 'own', 'in'); };
H.idnew = () => { idAuth(S.lgTab || 'own', 'new'); };
H.idpick = async (el) => { ID.pref = el.dataset.id; await sbLoadBiz(); await idEnter(); };
H.idout = async () => { await idSignOut(); };
async function idSignOut() {
  try { clearTimeout(PS.timer); if (CL.on) await pFlush(); } catch (e) {}
  cloudOff(); try { await sbClient().auth.signOut(); } catch (e) {}
  SBS.user = null; SBS.biz = null; SBS.sups = []; ID.mems = []; ID.active = null; ID.team = null; ID.pref = null; S.user = null; S.modal = null;
  if (typeof location !== 'undefined' && location.reload && !global_noreload()) location.reload(); else render();
}
const global_noreload = () => typeof window !== 'undefined' && window.__noReload === true;
const _logout18 = H.logout; H.logout = () => { if (ID.active) { idSignOut(); return; } _logout18(); };
const sbCardV17 = sbCard; sbCard = function () { const h = sbCardV17(); return ID.active ? h.replace('<button class="btn sm sec" data-a="sbout">Bağlantıyı kes</button>', '') : h; };
/* giriş ekranı */
const loginHTMLV17 = loginHTML;
loginHTML = function () {
  const h = loginHTMLV17(); if (!sbOK()) return h; const tab = S.lgTab || 'own';
  const demo = USERS.filter((u) => ['u1', 'u2', 'u3', 'u4'].includes(u.id));
  const tabs = `<div class="seg" role="group" aria-label="Giriş türü">${[['own', 'Patron'], ['emp', 'Çalışan'], ['sup', 'Toptancı']].map((x) => `<button type="button" data-a="lgtab" data-v="${x[0]}" aria-pressed="${tab === x[0]}">${x[1]}</button>`).join('')}</div>`;
  const cred = `<div class="field"><label for="id-em">E-posta</label><input id="id-em" type="email" autocomplete="username" placeholder="ad@sirket.com"></div><div class="field"><label for="id-pw">Şifre (en az 8 karakter)</label><input id="id-pw" type="password" autocomplete="current-password"></div>`;
  const err = `<div class="err" id="id-err" role="alert">${esc(S.loginErr)}</div>`;
  let inner;
  if (SBS.user && ID.mems.length > 1 && !ID.active) inner = `<div class="stack"><p class="lbl">Hangi işletmeye girmek istiyorsun?</p>${ID.mems.map((m) => `<button type="button" class="btn sec block" data-a="idpick" data-id="${m.business_id}">${esc(m.businesses.name)} · ${esc(ROLE_LABEL[m.role])}</button>`).join('')}<button type="button" class="btn sm sec" data-a="idout">Çıkış yap</button></div>`;
  else if (tab === 'sup') inner = `<div class="stack"><p class="muted">Tedarikçiysen teklif ve siparişlerini kendi panelinden yönetirsin. İşletme seni e-postanla davet eder.</p><a class="btn block" href="/tedarikci">Tedarikçi paneline git</a></div>`;
  else if (tab === 'emp') inner = `<div class="stack">${cred}${err}<button type="button" class="btn block" data-a="idin">Giriş yap</button>
    <details class="stack"><summary class="small" style="cursor:pointer">İlk kez mi giriyorsun? Davet kodum var</summary><p class="small muted" style="margin:8px 0">İşvereninin verdiği kodu yaz. Yukarıya e-postanı ve kendi belirlediğin şifreni yaz.</p><div class="field"><label for="id-code">Davet kodu</label><input id="id-code" type="text" autocapitalize="characters" placeholder="Örn. K7M2QX" style="text-transform:uppercase"></div><button type="button" class="btn sec block" data-a="idnew">Hesap oluştur ve katıl</button></details></div>`;
  else inner = `<div class="stack">${cred}${err}<button type="button" class="btn block" data-a="idin">Giriş yap</button>
    <details class="stack"><summary class="small" style="cursor:pointer">İlk kez mi? İşletmeni oluştur</summary><p class="small muted" style="margin:8px 0">Yukarıya e-postanı ve şifreni yaz, aşağıya işletmeni. Yeni işletme boş başlar.</p><div class="field"><label for="id-biz">İşletme adı</label><input id="id-biz" type="text"></div><div class="field"><label for="id-name">Adın soyadın</label><input id="id-name" type="text" autocomplete="name"></div><button type="button" class="btn sec block" data-a="idnew">İşletmemi oluştur</button></details></div>`;
  const note = SBS.user && !ID.active && ID.mems.length === 0 ? `<div class="callout warn">${ic('alert')}<div>${esc(SBS.user.email || 'Bu hesap')} giriş yapmış ama bir işletmeye bağlı değil. <button type="button" class="btn sm sec" data-a="idout">Çıkış yap</button></div></div>` : '';
  const demoBox = AUTH.demo === false ? '' : `<details class="stack"><summary class="small muted" style="cursor:pointer">Demo ile dene (örnek veri, sadece bu cihazda)</summary><div class="demo" style="margin-top:8px">${demo.map((u) => `<button type="button" data-a="demo" data-id="${u.id}"><b>${esc(ROLE_LABEL[u.role])}</b><span>${esc(u.name)}</span></button>`).join('')}</div></details>`;
  const sec = `<section class="login-form"><div class="inner"><div><h1 style="font-size:28px">Giriş yap</h1><p class="muted" style="margin-top:6px">Rolünü seç, hesabınla gir.</p></div>${tabs}${note}${inner}${demoBox}</div></section>`;
  return h.replace(/<section class="login-form">[\s\S]*?<\/section>/, sec);
};
/* demo girişi bulutu açmaz */
const _demo18 = H.demo; H.demo = (el) => { S.demoMode = true; _demo18(el); };
/* ekip: hesap bağlantıları */
async function teamLoad() {
  const c = sbClient(); if (!c || !ID.active || ID.teamBusy) return; ID.teamBusy = true; const b = ID.active.business_id;
  try { const m = await c.from('members').select('id,user_id,role,app_uid,display_name,email').eq('business_id', b); const i = await c.from('invites').select('id,code,app_uid,expires_at,used_at').eq('business_id', b);
    ID.team = { members: m.data || [], invites: (i.data || []).filter((x) => !x.used_at && new Date(x.expires_at) > new Date()), err: m.error ? idMsg(m.error) : '' };
  } catch (e) { ID.team = { members: [], invites: [], err: idMsg(e) }; }
  ID.teamBusy = false;
}
function teamCard() {
  if (!ID.active || ID.active.role !== 'patron') return '';
  if (!ID.team) { if (!ID.teamBusy) teamLoad().then(() => render()); return `<div class="card"><p class="small muted">Hesap bağlantıları yükleniyor…</p></div>`; }
  const rows = USERS.filter((u) => u.id !== 'u1').map((u) => {
    const m = ID.team.members.find((x) => x.app_uid === u.id); const inv = ID.team.invites.find((x) => x.app_uid === u.id);
    const right = m ? `<span class="pill p-ok">Bağlı</span><button class="btn sm sec" data-a="memrm" data-id="${m.id}">${S.rmArm === m.id ? 'Emin misin?' : 'Çıkar'}</button>`
      : inv ? `<span class="pill p-warn">Kod ${esc(inv.code)} · ${invLeft(inv)}</span><button class="btn sm sec" data-a="invshow" data-id="${u.id}">Göster</button><button class="btn sm sec" data-a="invrm" data-id="${inv.id}">İptal</button>`
      : `<button class="btn sm" data-a="invnew" data-id="${u.id}">Davet et</button>`;
    return `<div class="logline"><span>${esc(u.name)}<span class="small muted" style="display:block">${esc(ROLE_LABEL[u.role])}${u.title && u.role === 'calisan' ? ' · ' + esc(u.title) : ''}${m && m.email ? ' · ' + esc(m.email) : ''}</span></span><span class="row" style="gap:6px">${right}</span></div>`;
  }).join('');
  return `<div class="card stack"><div class="row between wrap"><div><h3>Hesap bağlantıları</h3><p class="muted small" style="margin-top:2px">Kişiyi davet et, kodu ona gönder. Kod 24 saat (1 gün) geçerli ve tek kullanımlık.</p></div><button class="btn sm sec" data-a="teamref">Yenile</button></div>${ID.team.err ? `<div class="callout warn">${ic('alert')}<div>${esc(ID.team.err)}</div></div>` : ''}${rows}</div>`;
}
const viewEkipV17 = viewEkip; viewEkip = function () { const h = viewEkipV17(); return S.sub.ekip === 'bugun' ? h + teamCard() : h; };
H.teamref = async () => { ID.team = null; ID.teamBusy = false; await teamLoad(); render(); };
H.invnew = (el) => { const u = byId(el.dataset.id); S.modal = { type: 'invnew', uid: u.id }; renderModal(); };
NEWM.invnew = (m) => { const u = byId(m.uid); return sheet('Davet et', `<p class="muted small">${esc(ROLE_LABEL[u.role])} olarak katılacak. Adını ve görevini yaz.</p><div class="field"><label for="iv-name">Ad soyad</label><input type="text" id="iv-name" value="${esc(u.name)}"></div><div class="field"><label for="iv-title">Görev</label><input type="text" id="iv-title" value="${esc(u.title || '')}"></div><div class="err" id="iv-err" role="alert"></div><button class="btn block" data-a="invmake" data-id="${u.id}">Kod üret</button>`); };
const mkCode = () => { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; const b = new Uint8Array(6); try { crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256); } for (let i = 0; i < 6; i++) s += A[b[i] % A.length]; return s; };
H.invmake = async (el) => {
  const u = byId(el.dataset.id); const name = (document.getElementById('iv-name').value || '').trim(); const title = (document.getElementById('iv-title').value || '').trim();
  const err = (t) => { const e = document.getElementById('iv-err'); if (e) e.textContent = t; }; if (!name) return err('Adı yaz.');
  const c = sbClient(); if (!c || !ID.active) return err('Bağlantı yok.');
  try {
    await c.from('invites').delete().eq('business_id', ID.active.business_id).eq('app_uid', u.id).is('used_at', null);
    const code = mkCode(); const i = await c.from('invites').insert({ business_id: ID.active.business_id, code, role: u.role, app_uid: u.id, name, expires_at: new Date(Date.now() + 864e5).toISOString() }); if (i.error) throw i.error;
    NAMES[u.id] = { name, title: title || u.title }; applyNames(); ID.team = null; ID.teamBusy = false; await teamLoad();
    S.modal = { type: 'invcode', uid: u.id, code }; render(); renderModal();
  } catch (e) { err(idMsg(e)); }
};
H.invshow = (el) => { const inv = ID.team && ID.team.invites.find((x) => x.app_uid === el.dataset.id); if (!inv) return; S.modal = { type: 'invcode', uid: el.dataset.id, code: inv.code }; renderModal(); };
function invLeft(inv) { const ms = new Date(inv.expires_at) - Date.now(); if (!(ms > 0)) return 'süresi doldu'; const h = Math.floor(ms / 36e5); return h >= 1 ? h + ' sa kaldı' : Math.max(1, Math.round(ms / 6e4)) + ' dk kaldı'; }
const invText = (code) => BIZ + ' sana KaisPilot daveti gönderdi.\nAdres: ' + (typeof location !== 'undefined' && location.origin ? location.origin : '') + '\nGiriş ekranında Çalışan sekmesini aç, Davet kodu kısmına şu kodu yaz: ' + code + '\n(Kod 24 saat geçerli.)';
NEWM.invcode = (m) => { const u = byId(m.uid); return sheet('Davet kodu hazır', `<p class="muted small">${esc(u.name)} için tek kullanımlık kod:</p><p style="font-size:32px;font-weight:700;letter-spacing:4px;text-align:center;margin:12px 0" id="iv-code">${esc(m.code)}</p><pre class="small" style="white-space:pre-wrap;background:var(--bg2,#f4f6f9);padding:10px;border-radius:8px">${esc(invText(m.code))}</pre><button class="btn block" data-a="invcopy">Mesajı kopyala</button>`); };
H.invcopy = () => { if (S.modal && S.modal.code) cpy(invText(S.modal.code), 'Mesaj kopyalandı. WhatsApp\'tan gönder.'); };
H.invrm = async (el) => { const c = sbClient(); try { await c.from('invites').delete().eq('id', el.dataset.id); } catch (e) {} ID.team = null; ID.teamBusy = false; await teamLoad(); render(); toast('Davet iptal edildi.'); };
H.memrm = async (el) => {
  if (S.rmArm !== el.dataset.id) { S.rmArm = el.dataset.id; render(); return; } S.rmArm = null; const c = sbClient();
  try { const d = await c.from('members').delete().eq('id', el.dataset.id); if (d.error) throw d.error; toast('Erişim kapatıldı.', 'ok'); } catch (e) { toast(idMsg(e), 'warn'); }
  ID.team = null; ID.teamBusy = false; await teamLoad(); render();
};

/* v19: temiz başlangıç (boş işletme) */
function wipeData() {
  [LEDGER, RECEIPTS, PAYS, LEAVES, LVREQ, DEBTS, DRAFTS, AUDIT, MSGS, STOCK, STOCKLOG, RECV, ROWS, SALES, SALEIMP, CLOCK, LOTS, WASTE, COUNTLOG, SUPPLIERS, ORDERS, RFQS].forEach((a) => { a.length = 0; });
  Object.keys(RECIPES).forEach((k) => { delete RECIPES[k]; }); Object.keys(NOTES).forEach((k) => { delete NOTES[k]; });
  EMP_IDS.forEach((id) => {
    ATT[id] = { state: 'none', inAt: null, breakMin: 0, late: 0, log: [] };
    EMPDATA[id] = { late: 0, over: 0, miss: 0, task: 100, prot: '', itiraz: null };
    HOURS[id] = (HOURS[id] || []).map((w) => w.map(() => 0));
    const p = PROFILES[id]; p.hire = REF_ISO; p.salary = 0; p.contract = false; p.cAt = '';
  });
  Object.keys(EDOC).forEach((k) => { EDOC[k] = ''; }); EDOC.unvan = BIZ; EDOC.muk = 'bilmiyorum';
  NAMES.u2 = { name: 'Müdür', title: 'Müdür' }; NAMES.u3 = { name: 'Muhasebeci', title: 'Muhasebeci' };
  EMP_IDS.forEach((id, i) => { NAMES[id] = { name: 'Çalışan ' + (i + 1), title: 'Çalışan' }; });
  applyNames();
}

/* v20: veri bölümleri (stok / ekip / muh / maas_*), rol bazlı erişim, dinamik çalışan yeri */
const SEATS = []; P_ARR.push(['SEATS', () => SEATS]);
const SEAT_COLORS = ['#0E7C86', '#9A4DB0', '#B07A12', '#3B6FB6', '#A33E5B', '#4C8A3F', '#7A5C3A', '#2F6F8F'];
function addSeatLocal(id, name, title) {
  if (byId(id)) return byId(id);
  const u = { id, name, role: 'calisan', title: title || 'Çalışan', email: id + '@isletme.example', color: SEAT_COLORS[EMP_IDS.length % SEAT_COLORS.length] };
  USERS.push(u); EMP_IDS.push(id);
  const p = PROFILES[id] = { hire: REF_ISO, salary: 0, stype: 'net', hours: 45, trial: 2, payday: 30, contract: false, cAt: '' };
  ATT[id] = { state: 'none', inAt: null, breakMin: 0, late: 0, log: [] };
  EMPDATA[id] = { late: 0, over: 0, miss: 0, task: 100, prot: '', itiraz: null };
  HOURS[id] = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
  Object.defineProperty(p, 'otMonth', { get: () => otFromLog(id).hours, enumerable: true, configurable: true });
  Object.defineProperty(p, 'otYear', { get: () => otFromLog(id).hours, enumerable: true, configurable: true });
  return u;
}
function ensureSeats(list) { (list || []).forEach((x) => { if (x && x.id && !byId(x.id)) addSeatLocal(x.id, x.name || 'Çalışan', x.title); }); }
const pApplyV18 = pApply; pApply = function (s) { try { const o = JSON.parse(s); if (o && Array.isArray(o.SEATS)) ensureSeats(o.SEATS); } catch (e) {} return pApplyV18(s); };
H.seatadd = () => {
  if (!ID.active || ID.active.role !== 'patron') return;
  let n = 8; while (byId('u' + n)) n++; const id = 'u' + n; const nm = 'Çalışan ' + (EMP_IDS.length + 1);
  addSeatLocal(id, nm, 'Çalışan'); SEATS.push({ id, name: nm, title: 'Çalışan' }); NAMES[id] = { name: nm, title: 'Çalışan' }; render(); toast('Yeni çalışan yeri eklendi. Davet edebilirsin.', 'ok');
};
const teamCardV18 = teamCard;
teamCard = function () { const h = teamCardV18(); return h.includes('data-a="teamref">Yenile</button></div>') && ID.active && ID.active.role === 'patron' ? h.replace(/<\/div>$/, `<div class="row wrap"><button class="btn sm sec" data-a="seatadd">Yeni çalışan yeri ekle</button></div></div>`) : h; };
/* bölümler */
const P_SCOPE = {};
['STOCK', 'STOCKLOG', 'RECV', 'SALES', 'SALEIMP', 'RECIPES', 'SUPPLIERS', 'ORDERS', 'RFQS', 'LOTS', 'WASTE', 'COUNTLOG'].forEach((k) => { P_SCOPE[k] = 'stok'; });
['ATT', 'EMPDATA', 'HOURS', 'LEAVES', 'LVREQ', 'MSGS', 'CLOCK', 'NAMES', 'SETTINGS', 'RECEIPTS', 'SEATS'].forEach((k) => { P_SCOPE[k] = 'ekip'; });
['LEDGER', 'PAYS', 'DEBTS', 'DRAFTS', 'ROWS', 'EDOC', 'NOTES', 'AUDIT', 'MAIL'].forEach((k) => { P_SCOPE[k] = 'muh'; });
const SAL_F = ['salary', 'stype', 'payday'];
function splitSnap(s) {
  const o = JSON.parse(s); const out = { stok: {}, ekip: {}, muh: {} };
  Object.keys(o).forEach((k) => { if (['AUTH', 'seq', 'PROFILES', 'ROLES'].includes(k)) return; out[P_SCOPE[k] || 'muh'][k] = o[k]; });
  out.ekip.seq = o.seq; out.ekip.ROLES = o.ROLES; out.ekip.PROFILES = {};
  Object.keys(o.PROFILES || {}).forEach((id) => { const p = o.PROFILES[id]; const pub = {}; const sal = {}; Object.keys(p).forEach((f) => { (SAL_F.includes(f) ? sal : pub)[f] = p[f]; }); out.ekip.PROFILES[id] = pub; out['maas_' + id] = { PROFILES: { [id]: sal } }; });
  return out;
}
function mergeP(list) {
  const m = {}; list.forEach((p) => Object.keys(p).forEach((k) => { if (k === 'PROFILES') { m.PROFILES = m.PROFILES || {}; Object.keys(p.PROFILES).forEach((id) => { m.PROFILES[id] = Object.assign(m.PROFILES[id] || {}, p.PROFILES[id]); }); } else m[k] = p[k]; })); return JSON.stringify(m);
}
const roleOf = () => ID.active && ID.active.role; const uidOf = () => ID.active && ID.active.app_uid;
function canR(sc) { const r = roleOf(); if (r === 'patron') return true; if (sc.startsWith('maas_')) return (r === 'muhasebeci' && !CL.rule) || (r === 'calisan' && sc === 'maas_' + uidOf()); if (r === 'mudur') return sc === 'stok' || sc === 'ekip'; if (r === 'muhasebeci') return sc === 'muh' || sc === 'ekip'; if (r === 'calisan') return sc === 'stok' || sc === 'ekip'; return false; }
function canW(sc) { const r = roleOf(); if (r === 'patron') return true; if (sc.startsWith('maas_')) return false; if (r === 'calisan' && sc === 'stok') return false; return canR(sc); }
function hideUnreadable() {
  const keys = P_ARR.map((x) => x[0]);
  ['stok', 'muh'].forEach((sc) => { if (canR(sc)) return; keys.forEach((k) => { if ((P_SCOPE[k] || 'muh') === sc) { const a = P_ARR.find((x) => x[0] === k)[1](); a.length = 0; } }); if (sc === 'stok') Object.keys(RECIPES).forEach((k) => { delete RECIPES[k]; }); else { Object.keys(NOTES).forEach((k) => { delete NOTES[k]; }); Object.keys(EDOC).forEach((k) => { EDOC[k] = ''; }); EDOC.unvan = BIZ; } });
  EMP_IDS.forEach((id) => { if (!canR('maas_' + id)) PROFILES[id].salary = 0; });
}
CL.vers = {}; CL.sent = {};
const isDup = (e) => /duplicate|23505/i.test(String((e && e.message) || '') + String((e && e.code) || ''));
/* Şube kısıtlı muhasebeci: 'muh' ve 'ekip' paketleri sunucuda süzülür (st_get / st_put). Fonksiyonlar yoksa (SQL uygulanmamış) eski yol. */
CL.rule = null; CL.ruleKnown = false;
async function stRule(c) {
  CL.rule = null; CL.ruleKnown = false; if (roleOf() !== 'muhasebeci') return;
  const r = await c.rpc('br_rule', { bid: SBS.biz.id });
  if (!r.error) { CL.ruleKnown = true; CL.rule = r.data || null; }
}
const stRows = (c, bid) => (CL.rule ? c.rpc('st_get', { bid }) : c.from('app_state').select('scope,state,version').eq('business_id', bid));
cloudConflict = async function (sc) {
  const c = sbClient(); const r = CL.rule ? await c.rpc('st_get', { bid: SBS.biz.id }) : await c.from('app_state').select('scope,state,version').eq('business_id', SBS.biz.id).eq('scope', sc).limit(1);
  if (CL.rule && r.data) r.data = r.data.filter((x) => x.scope === sc);
  if (r.error || !r.data || !r.data[0]) throw (r.error || new Error('Bulut kaydı okunamadı.'));
  CL.vers[sc] = r.data[0].version; const prev = PS.remote ? [JSON.parse(PS.remote)] : []; PS.remote = mergeP(prev.concat([JSON.parse(r.data[0].state)])); PS.state = 'saved';
  toast('Başka cihazda değişiklik olmuş, güncellendi. Son işlemini kontrol et.', 'warn'); setTimeout(() => { render(); }, 60);
};
cloudSet = async function (d) {
  const c = sbClient(); const bid = SBS.biz.id; const sp = splitSnap(d.s);
  for (const sc of Object.keys(sp)) {
    if (!canW(sc)) continue; const str = JSON.stringify(sp[sc]); if (CL.sent[sc] === str) continue; const v = CL.vers[sc] || 0;
    if (v === 0 && roleOf() !== 'patron') continue;
    if (CL.rule && (sc === 'muh' || sc === 'ekip')) {
      const u = await c.rpc('st_put', { bid, sc, st: str, ver: v }); if (u.error) throw u.error;
      if (u.data == null) { await cloudConflict(sc); continue; } CL.vers[sc] = u.data; CL.sent[sc] = str; continue;
    }
    if (v === 0) { const i = await c.from('app_state').insert({ business_id: bid, scope: sc, state: str, version: 1, updated_by: SBS.user.id }); if (i.error) { if (isDup(i.error)) { await cloudConflict(sc); continue; } throw i.error; } CL.vers[sc] = 1; CL.sent[sc] = str; continue; }
    const u = await c.from('app_state').update({ state: str, version: v + 1, updated_at: new Date().toISOString(), updated_by: SBS.user.id }).eq('business_id', bid).eq('scope', sc).eq('version', v).select('version');
    if (u.error) throw u.error; if (!u.data || !u.data.length) { await cloudConflict(sc); continue; }
    CL.vers[sc] = v + 1; CL.sent[sc] = str;
  }
  CL.at = clTime();
};
cloudPoll = async function () {
  if (!CL.on || PS.busy || CL.busy || !SBS.biz) return; CL.busy = true;
  try {
    const c = sbClient(); const bid = SBS.biz.id; const v = CL.rule ? await c.rpc('st_versions', { bid }) : await c.from('app_state').select('scope,version').eq('business_id', bid); if (v.error || !v.data) { CL.busy = false; return; }
    const ch = v.data.filter((x) => x.scope !== 'all' && x.version > (CL.vers[x.scope] || 0));
    if (ch.length) {
      let res; if (CL.rule) { const all = await c.rpc('st_get', { bid }); const rows = all.data || []; res = ch.map((x) => ({ data: rows.filter((y) => y.scope === x.scope).slice(0, 1) })); }
      else res = await Promise.all(ch.map((x) => c.from('app_state').select('scope,state,version').eq('business_id', bid).eq('scope', x.scope).limit(1))); const pl = PS.remote ? [JSON.parse(PS.remote)] : []; let any = false;
      res.forEach((r) => { const row = r.data && r.data[0]; if (row) { CL.vers[row.scope] = row.version; pl.push(JSON.parse(row.state)); any = true; } });
      if (any) { CL.at = clTime(); PS.remote = mergeP(pl); render(); }
    }
  } catch (e) {} CL.busy = false;
};
cloudAttach = async function () {
  const c = sbClient(); if (!c || !SBS.biz || CL.on) return;
  await stRule(c);
  const r = await stRows(c, SBS.biz.id);
  if (r.error) { CL.err = /scope|app_state/.test(r.error.message || '') ? 'Bulut tablosu güncel değil. kaispilot_roller.sql dosyasını Supabase\'de çalıştır.' : sbMsg(r.error); return; }
  CL.err = ''; const rows = r.data || []; const legacy = rows.find((x) => x.scope === 'all'); const scoped = rows.filter((x) => x.scope !== 'all'); const bid = SBS.biz.id;
  if (!PS.localDb) PS.localDb = PS.db; PS.cloudOn = true; CL.on = true; CL.vers = {}; CL.sent = {}; CL.base = {}; CL.pend = {};
  PS.db = { doc: () => ({ set: cloudSet, onSnapshot() {} }) }; PS.canWrite = true; PS.loaded = true;
  if (legacy && roleOf() === 'patron') pApply(legacy.state);
  scoped.forEach((x) => { pApply(x.state); CL.vers[x.scope] = x.version; CL.base[x.scope] = x.state; });
  if (legacy && roleOf() === 'patron') {
    const sp = splitSnap(pSnap());
    for (const sc of Object.keys(sp)) { if (CL.vers[sc]) continue; const str = JSON.stringify(sp[sc]); const i = await c.from('app_state').insert({ business_id: bid, scope: sc, state: str, version: 1, updated_by: SBS.user.id }); if (i.error && !isDup(i.error)) throw i.error; if (!i.error) { CL.vers[sc] = 1; CL.sent[sc] = str; CL.base[sc] = str; } }
    await c.from('app_state').delete().eq('business_id', bid).eq('scope', 'all'); toast('Veriler bölümlere ayrıldı.', 'ok');
  }
  hideUnreadable();
  if (!scoped.length && !legacy && roleOf() !== 'patron') toast('İşveren verileri henüz hazırlamamış. Biraz sonra tekrar dene.', 'warn');
  const sp0 = splitSnap(pSnap()); Object.keys(sp0).forEach((sc) => { if (CL.vers[sc] && !CL.sent[sc]) CL.sent[sc] = JSON.stringify(sp0[sc]); });
  PS.last = pSnap(); CL.at = clTime(); PS.state = 'saved';
  if (!scoped.length && !legacy && roleOf() === 'patron') { PS.last = ''; PS.state = 'saving'; pSched(); }
  clearInterval(CL.timer); CL.timer = setInterval(cloudPoll, 8000);
};
cloudOff = function () { clearInterval(CL.timer); CL.on = false; CL.rule = null; CL.ruleKnown = false; CL.vers = {}; CL.sent = {}; PS.cloudOn = false; PS.db = PS.localDb || null; PS.state = 'local'; };

/* v21: muhasebeci müşteri listesi (birden çok işletme) */
const prefGet = () => { try { return localStorage.getItem('kp_biz'); } catch (e) { return null; } };
const prefSet = (v) => { try { if (v) localStorage.setItem('kp_biz', v); else localStorage.removeItem('kp_biz'); } catch (e) {} };
const sbLoadBizV20 = sbLoadBiz; sbLoadBiz = async function () { if (!ID.pref) ID.pref = prefGet(); return sbLoadBizV20(); };
const _idpick21 = H.idpick; H.idpick = async (el) => { prefSet(el.dataset.id); return _idpick21(el); };
const idSignOutV20 = idSignOut; idSignOut = async function () { prefSet(null); return idSignOutV20(); };

function clientsCard() {
  if (!ID.active || ID.active.role !== 'muhasebeci') return '';
  if (!ID.cinfo && !ID.cinfoBusy) cinfoLoad();
  const rows = ID.mems.map((m) => { const cur = m.business_id === ID.active.business_id; const up = ID.cinfo && ID.cinfo[m.business_id]; const dt = up ? new Date(up).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '';
    return `<div class="logline"><span>${esc(m.businesses.name)}<span class="small muted" style="display:block">${dt ? 'Son güncelleme ' + esc(dt) : 'Henüz veri yok'}</span></span>${cur ? '<span class="pill p-ok">Şu an burada</span>' : `<button class="btn sm" data-a="bizgo" data-id="${m.business_id}">Geç</button>`}</div>`; }).join('');
  return `<div class="card stack"><div><h3>Müşterilerin</h3><p class="muted small" style="margin-top:2px">${ID.mems.length} işletme. Birine geçince ekran o işletmenin verisiyle yenilenir.</p></div>${rows}
  <details class="stack"><summary class="small" style="cursor:pointer">Yeni müşteri ekle</summary><p class="small muted" style="margin:8px 0">İşletme sahibi seni muhasebeci olarak davet eder, sana bir kod verir. Kodu buraya yaz.</p><div class="row wrap" style="gap:8px"><input type="text" id="mc-code" class="grow" style="min-width:140px;text-transform:uppercase" placeholder="Davet kodu" aria-label="Davet kodu"><button class="btn" data-a="mclaim">Ekle</button></div><div class="err" id="mc-err" role="alert"></div></details></div>`;
}
const viewHTMLV20 = viewHTML;
viewHTML = function () { const h = viewHTMLV20(); return S.user && S.user.role === 'muhasebeci' && S.view === 'donem' && ID.active && h.includes('<div class="stack-lg">') ? h.replace('<div class="stack-lg">', '<div class="stack-lg">' + clientsCard()) : h; };
H.bizgo = async (el) => {
  try { clearTimeout(PS.timer); if (CL.on) await pFlush(); } catch (e) {}
  prefSet(el.dataset.id); ID.pref = el.dataset.id;
  if (typeof location !== 'undefined' && location.reload && !global_noreload()) { location.reload(); return; }
  cloudOff(); ID.active = null; await sbLoadBiz(); await idEnter();
};
H.mclaim = async () => {
  const code = ((document.getElementById('mc-code') || {}).value || '').trim().toUpperCase(); const err = (t) => { const e = document.getElementById('mc-err'); if (e) e.textContent = t; };
  if (!code) return err('Kodu yaz.');
  try { const x = await sbClient().rpc('claim_invite', { p_code: code }); if (x.error) throw x.error; if (x.data && x.data.error) throw new Error(x.data.error); const keep = ID.active && ID.active.business_id; ID.pref = keep; await sbLoadBiz(); ID.cinfo = null; render(); toast('Müşteri eklendi.', 'ok'); }
  catch (e) { err(idMsg(e)); }
};

/* v22: Rezervasyon (masa planı, otomatik masa atama, doluluk, mesaj, gelmedi takibi) */
ICONS.calendar = '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/>';
const RCFG = { open: 8, close: 22, dur: 90, seeded: false }; const TABLES = [];
const RESV = [
  { id: 'r1', name: 'Selin Kaya', phone: '0532 111 22 33', n: 2, date: REF_ISO, time: '12:30', dur: 60, tids: [], src: 'Telefon', note: 'Pencere kenarı olursa sevinir', st: 'onay' },
  { id: 'r2', name: 'Demir Ailesi', phone: '0533 444 55 66', n: 5, date: REF_ISO, time: '19:30', dur: 120, tids: [], src: 'WhatsApp', note: 'Doğum günü, pasta getirecekler', st: 'onay' },
  { id: 'r3', name: 'Mavi Ofis', phone: '0542 777 88 99', n: 8, date: REF_ISO, time: '13:00', dur: 90, tids: [], src: 'Telefon', note: '', st: 'onay' },
  { id: 'r4', name: 'Murat Yılmaz', phone: '0505 222 33 44', n: 4, date: addDays(REF_ISO, 1), time: '20:00', dur: 90, tids: [], src: 'Yüz yüze', note: '', st: 'onay' },
  { id: 'r5', name: 'Demir Ailesi', phone: '0533 444 55 66', n: 4, date: addDays(REF_ISO, -7), time: '19:00', dur: 90, tids: ['t4'], src: 'WhatsApp', note: '', st: 'gelmedi' },
  { id: 'r6', name: 'Selin Kaya', phone: '0532 111 22 33', n: 2, date: addDays(REF_ISO, -10), time: '18:00', dur: 60, tids: ['t1'], src: 'Telefon', note: '', st: 'bitti' },
];
P_ARR.push(['RESV', () => RESV], ['TABLES', () => TABLES]); P_OBJ.push(['RCFG', () => RCFG]);
P_SCOPE.RESV = 'ekip'; P_SCOPE.TABLES = 'ekip'; P_SCOPE.RCFG = 'ekip';
NAV.patron.splice(5, 0, ['rezerv', 'Rezervasyon', 'calendar', 'more']); NAV.mudur.push(['rezerv', 'Rezervasyon', 'calendar']); NAV.calisan.push(['rezerv', 'Rezervasyon', 'calendar', 'more']); TITLES.rezerv = 'Rezervasyon';
const toMin = (t) => { const a = String(t || '0:0').split(':').map(Number); return (a[0] || 0) * 60 + (a[1] || 0); };
const fromMin = (x) => String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
const RZ_ST = { bekliyor: ['p-warn', 'Onay bekliyor'], onay: ['p-info', 'Bekleniyor'], geldi: ['p-ok', 'Masada'], bitti: ['p-mute', 'Tamamlandı'], gelmedi: ['p-bad', 'Gelmedi'], iptal: ['p-mute', 'İptal'] };
const rzActive = (r) => ['bekliyor', 'onay', 'geldi'].includes(r.st);
const rzDigits = (p) => String(p || '').replace(/\D/g, '').slice(-10);
function seedTables() { if (TABLES.length || RCFG.seeded) return; [['1', 2, 'İç'], ['2', 2, 'İç'], ['3', 4, 'İç'], ['4', 4, 'İç'], ['5', 4, 'Bahçe'], ['6', 6, 'İç'], ['7', 6, 'Bahçe'], ['8', 8, 'İç']].forEach((x) => TABLES.push({ id: 't' + x[0], name: 'Masa ' + x[0], cap: x[1], zone: x[2] })); RCFG.seeded = true; }
function rzSeat() { RESV.forEach((r) => { if (r.st === 'bekliyor') r.st = 'onay'; if ((!r.tids || !r.tids.length) && rzActive(r)) { const a = rzAssign(r.date, r.time, r.dur, r.n, r.id); if (a) r.tids = a; } }); }
function rzBusy(date, s, e, ignore) { const m = {}; RESV.filter((r) => r.date === date && rzActive(r) && r.id !== ignore).forEach((r) => { const rs = toMin(r.time); if (rs < e && s < rs + r.dur) r.tids.forEach((t) => { m[t] = r; }); }); return m; }
function rzAssign(date, time, dur, n, ignore) {
  const s = toMin(time); const busy = rzBusy(date, s, s + dur, ignore); const free = TABLES.filter((t) => !busy[t.id]);
  const one = free.filter((t) => t.cap >= n).sort((a, b) => a.cap - b.cap)[0]; if (one) return [one.id];
  let best = null; for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) { const a = free[i]; const b = free[j]; if (a.zone !== b.zone) continue; const sum = a.cap + b.cap; if (sum >= n && (!best || sum < best.sum)) best = { sum, ids: [a.id, b.id] }; }
  return best ? best.ids : null;
}
function rzAlt(date, time, dur, n, ignore) { const base = toMin(time); const out = []; for (let d = 30; d <= 240 && out.length < 4; d += 30) for (const g of [-1, 1]) { const x = base + g * d; if (x < RCFG.open * 60 || x > RCFG.close * 60 - 60) continue; const t = fromMin(x); if (rzAssign(date, t, dur, n, ignore)) out.push(t); } return out.sort().slice(0, 4); }
const rzNames = (tids) => tids.map((id) => { const t = TABLES.find((x) => x.id === id); return t ? t.name.replace('Masa ', '') : '?'; }).join(' + ');
const rzSlots = () => { const o = []; for (let x = RCFG.open * 60; x <= RCFG.close * 60 - 60; x += 30) o.push(fromMin(x)); return o; };
function rzHeat(date) {
  const tot = TABLES.reduce((a, t) => a + t.cap, 0) || 1; const out = [];
  for (let x = RCFG.open * 60; x < RCFG.close * 60; x += 30) { const used = new Set(); RESV.filter((r) => r.date === date && rzActive(r)).forEach((r) => { const rs = toMin(r.time); if (rs <= x && x < rs + r.dur) r.tids.forEach((t) => used.add(t)); }); out.push({ t: fromMin(x), p: TABLES.filter((t) => used.has(t.id)).reduce((a, t) => a + t.cap, 0) / tot }); }
  return out;
}
function rzHist(phone, ignore) { const d = rzDigits(phone); if (!d) return { n: 0, miss: 0, canc: 0 }; const l = RESV.filter((r) => r.id !== ignore && rzDigits(r.phone) === d); return { n: l.filter((r) => ['geldi', 'bitti'].includes(r.st)).length, miss: l.filter((r) => r.st === 'gelmedi').length, canc: l.filter((r) => r.st === 'iptal').length }; }
const rzDayLabel = (d, i) => i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : DOWN[dowOf(d)].slice(0, 3) + ' ' + d.slice(8);
const rzDayName = (d) => DOWN[dowOf(d)] + ' ' + parseInt(d.slice(8), 10) + ' ' + ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][parseInt(d.slice(5, 7), 10) - 1];
function rzMsg(r, kind) {
  const t = rzNames(r.tids); const base = `Merhaba ${r.name.split(' ')[0]}, ${BIZ} için ${rzDayName(r.date)} saat ${r.time}, ${r.n} kişilik rezervasyonunuz ${kind === 'hat' ? 'yaklaşıyor' : 'alınmıştır'}${t ? ' (Masa ' + t + ')' : ''}.`;
  return base + (kind === 'hat' ? ' Gelemeyecekseniz lütfen haber verir misiniz? Yerinizi başka misafire verebiliriz.' : ' Gelemeyecekseniz lütfen bize haber verin. Görüşmek üzere!');
}
function rzWa(r, text) { let d = String(r.phone || '').replace(/\D/g, ''); if (!d) return ''; if (d.startsWith('0')) d = '90' + d.slice(1); else if (d.length === 10) d = '90' + d; return 'https://wa.me/' + d + '?text=' + encodeURIComponent(text); }
function rzInsights(date) {
  const L = RESV.filter((r) => r.date === date && rzActive(r)); const out = []; const nowMin = new Date().getHours() * 60 + new Date().getMinutes(); const today = date === REF_ISO;
  if (today) { const late = L.filter((r) => r.st === 'onay' && nowMin - toMin(r.time) >= 20); if (late.length) out.push(['bad', late.map((r) => r.name.split(' ')[0]).join(', ') + ' 20 dakikadan fazla gecikti. Aramayı düşün.']); }
  const risky = L.filter((r) => rzHist(r.phone, r.id).miss > 0); if (risky.length) out.push(['warn', risky.map((r) => r.name.split(' ')[0]).join(', ') + ' daha önce gelmemiş. Hatırlatma mesajı gönder.']);
  const heat = rzHeat(date); const pk = heat.reduce((a, b) => (b.p > a.p ? b : a), { p: 0, t: '' }); if (pk.p >= 0.7) out.push(['info', pk.t + ' civarı %' + Math.round(pk.p * 100) + ' dolu. Son masaları dikkatli ver.']);
  const big = L.filter((r) => r.n >= 6); if (big.length) out.push(['info', big.length + ' büyük grup var (' + big.map((r) => r.n + ' kişi ' + r.time).join(', ') + '). Masaları birleştirmeyi unutma.']);
  return out.slice(0, 4);
}
S.rzDate = REF_ISO; S.rzTab = 'liste';
function rzCard(r) {
  const h = rzHist(r.phone, r.id); const st = RZ_ST[r.st]; const act = [];
  if (r.st === 'onay') act.push(`<button class="btn sm" data-a="rzst" data-id="${r.id}" data-s="geldi">Geldi</button>`);
  if (r.st === 'geldi') act.push(`<button class="btn sm" data-a="rzst" data-id="${r.id}" data-s="bitti">Masa boşaldı</button>`);
  if (r.st === 'onay') act.push(`<button class="btn sm sec" data-a="rzst" data-id="${r.id}" data-s="gelmedi">Gelmedi</button><button class="btn sm sec" data-a="rzst" data-id="${r.id}" data-s="iptal">İptal</button>`);
  if (['gelmedi', 'iptal'].includes(r.st)) act.push(`<button class="btn sm sec" data-a="rzst" data-id="${r.id}" data-s="onay">Geri al</button>`);
  const wa = r.phone && rzActive(r) ? rzWa(r, rzMsg(r, 'hat')) : '';
  return `<div class="card stack" style="gap:8px"><div class="row between" style="align-items:flex-start;gap:10px"><div class="row" style="gap:12px;align-items:flex-start"><div style="min-width:54px;text-align:center"><b class="num" style="font-size:20px;display:block">${esc(r.time)}</b><span class="small muted">${r.dur} dk</span></div><div><b style="font-weight:600">${esc(r.name)}</b><span class="small muted" style="display:block">${r.n} kişi${r.tids.length ? ' · Masa ' + esc(rzNames(r.tids)) : ' · masa yok'}${r.src ? ' · ' + esc(r.src) : ''}</span></div></div><span class="pill ${st[0]}">${st[1]}</span></div>
  ${r.note ? `<p class="small" style="margin:0">${ic('info', 14)} ${esc(r.note)}</p>` : ''}
  ${h.miss ? `<span class="pill p-bad" style="align-self:flex-start">${h.miss} kez gelmedi</span>` : h.n >= 2 ? `<span class="pill p-ok" style="align-self:flex-start">${h.n} kez geldi</span>` : ''}
  <div class="row wrap" style="gap:6px">${act.join('')}${wa ? `<a class="btn sm sec" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${r.phone ? `<button class="btn sm sec" data-a="rzcopy" data-id="${r.id}">Mesajı kopyala</button>` : ''}<button class="btn sm sec" data-a="rzedit" data-id="${r.id}">Düzenle</button></div></div>`;
}
function rzTop() {
  const d = S.rzDate; const L = RESV.filter((r) => r.date === d && rzActive(r)); const ppl = L.reduce((a, r) => a + r.n, 0); const came = L.filter((r) => r.st === 'geldi').length;
  const strip = Array.from({ length: 14 }, (_, i) => addDays(REF_ISO, i)).map((x, i) => { const c = RESV.filter((r) => r.date === x && rzActive(r)).length; return `<button class="chip" data-a="rzday" data-d="${x}" aria-pressed="${S.rzDate === x}" style="flex:0 0 auto">${esc(rzDayLabel(x, i))}${c ? ` <b style="margin-left:4px">${c}</b>` : ''}</button>`; }).join('');
  return `<div class="row between wrap" style="gap:10px"><div><h2 style="margin:0">Rezervasyon</h2><p class="muted small" style="margin-top:2px">${esc(rzDayName(d))}</p></div><div class="row wrap" style="gap:8px"><button class="btn sec" data-a="rztables">Masalar</button><button class="btn" data-a="rznew">${ic('plus')} Yeni rezervasyon</button></div></div>
  <div class="row" style="gap:8px;overflow-x:auto;padding:2px 0 6px;-webkit-overflow-scrolling:touch">${strip}</div>
  <div class="kpis">${kpi('Rezervasyon', L.length)}${kpi('Kişi', ppl)}${kpi('Gelen', came + ' / ' + L.length)}</div>`;
}
function rzListe() {
  const d = S.rzDate; const L = RESV.filter((r) => r.date === d).sort((a, b) => (a.time < b.time ? -1 : 1)); const act = L.filter(rzActive); const rest = L.filter((r) => !rzActive(r)); const ins = rzInsights(d); const heat = rzHeat(d);
  const bars = `<div class="card stack"><div class="row between"><h3>Doluluk</h3><span class="small muted">Masa kapasitesine göre</span></div><div class="row" style="gap:3px;align-items:flex-end;height:64px">${heat.map((h) => `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%" title="${h.t} %${Math.round(h.p * 100)}"><div style="height:${Math.max(3, Math.round(Math.sqrt(h.p) * 58))}px;border-radius:3px;background:${h.p >= 0.8 ? 'var(--nar)' : h.p >= 0.5 ? 'var(--safran)' : 'var(--cini)'};opacity:${h.p ? 1 : 0.25}"></div></div>`).join('')}</div><div class="row between small muted"><span>${esc(heat[0] ? heat[0].t : '')}</span><span>${esc(heat.length ? fromMin(RCFG.close * 60) : '')}</span></div></div>`;
  return `${ins.length ? `<div class="card stack"><h3>Akıllı notlar</h3>${ins.map((x) => `<div class="callout${x[0] === 'info' ? '' : ' warn'}" style="margin:0">${ic(x[0] === 'info' ? 'info' : 'alert')}<div>${esc(x[1])}</div></div>`).join('')}</div>` : ''}${bars}
  ${act.length ? act.map(rzCard).join('') : `<div class="card empty">${ic('calendar', 28)}<p style="margin-top:8px">Bu gün için rezervasyon yok.</p><button class="btn" data-a="rznew" style="margin-top:8px">Rezervasyon ekle</button></div>`}
  ${rest.length ? `<p class="lbl">Kapanan</p>${rest.map(rzCard).join('')}` : ''}`;
}
function rzMasa() {
  const d = S.rzDate; const today = d === REF_ISO; const now = new Date().getHours() * 60 + new Date().getMinutes();
  const cards = TABLES.map((t) => {
    const L = RESV.filter((r) => r.date === d && rzActive(r) && r.tids.includes(t.id)).sort((a, b) => (a.time < b.time ? -1 : 1));
    const cur = today ? L.find((r) => r.st === 'geldi' || (toMin(r.time) <= now && now < toMin(r.time) + r.dur && r.st === 'onay')) : null; const next = L.find((r) => toMin(r.time) > (today ? now : -1) && r !== cur);
    const state = cur ? (cur.st === 'geldi' ? ['p-bad', 'Dolu'] : ['p-warn', 'Bekleniyor']) : next && today && toMin(next.time) - now <= 60 ? ['p-warn', 'Yakında'] : ['p-ok', 'Boş'];
    return `<div class="card stack" style="gap:6px;padding:14px"><div class="row between"><b>${esc(t.name)}</b><span class="pill ${state[0]}">${state[1]}</span></div><div class="row" style="gap:3px;flex-wrap:wrap">${Array.from({ length: t.cap }, () => '<span style="width:10px;height:10px;border-radius:50%;background:var(--cini);opacity:.55;display:inline-block"></span>').join('')}<span class="small muted" style="margin-left:6px">${t.cap} kişilik · ${esc(t.zone || '')}</span></div>
    ${L.length ? L.map((r) => `<button class="small" data-a="rzedit" data-id="${r.id}" style="text-align:left;background:var(--cini-wash);border:0;border-radius:8px;padding:6px 8px;color:var(--ink)"><b>${esc(r.time)}</b> ${esc(r.name)} · ${r.n}</button>`).join('') : '<span class="small muted">Bu gün rezervasyon yok</span>'}</div>`;
  }).join('');
  const un = RESV.filter((r) => r.date === d && rzActive(r) && !r.tids.length);
  return `${un.length ? `<div class="callout warn">${ic('alert')}<div>${un.length} rezervasyona masa atanamadı: ${esc(un.map((r) => r.name).join(', '))}. Düzenleyip saati ya da masayı değiştir.</div></div>` : ''}<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px">${cards || '<div class="card empty">Henüz masa yok. Masalar düğmesinden ekle.</div>'}</div>`;
}
function rzRapor() {
  const all = RESV; const fin = all.filter((r) => ['geldi', 'bitti', 'gelmedi'].includes(r.st)); const miss = all.filter((r) => r.st === 'gelmedi').length; const canc = all.filter((r) => r.st === 'iptal').length; const ok = all.filter((r) => ['geldi', 'bitti'].includes(r.st)).length;
  const avg = all.length ? all.reduce((a, r) => a + r.n, 0) / all.length : 0; const dow = [0, 0, 0, 0, 0, 0, 0]; const hr = {}; const src = {};
  all.filter((r) => r.st !== 'iptal').forEach((r) => { dow[dowOf(r.date)]++; const h = r.time.slice(0, 2) + ':00'; hr[h] = (hr[h] || 0) + 1; src[r.src || 'Diğer'] = (src[r.src || 'Diğer'] || 0) + 1; });
  const topH = Object.entries(hr).sort((a, b) => b[1] - a[1])[0]; const mx = Math.max(...dow, 1); const reg = {};
  all.filter((r) => ['geldi', 'bitti'].includes(r.st)).forEach((r) => { const k = rzDigits(r.phone) || r.name; (reg[k] = reg[k] || { name: r.name, c: 0 }).c++; }); const regs = Object.values(reg).filter((x) => x.c >= 2).sort((a, b) => b.c - a.c).slice(0, 5);
  return `<div class="kpis">${kpi('Toplam', all.length)}${kpi('Gelmedi', fin.length ? '%' + Math.round((miss / fin.length) * 100) : '-')}${kpi('İptal', all.length ? '%' + Math.round((canc / all.length) * 100) : '-')}${kpi('Ort. grup', q1(avg))}</div>
  <div class="card stack"><h3>Hangi gün yoğun</h3><div class="row" style="gap:6px;align-items:flex-end;height:80px">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div style="flex:1;text-align:center"><div style="height:${Math.max(4, Math.round((dow[d] / mx) * 56))}px;background:var(--cini);border-radius:4px"></div><span class="small muted">${DOWN[d].slice(0, 3)}</span></div>`).join('')}</div>${topH ? `<p class="small muted">En yoğun saat: ${esc(topH[0])} (${topH[1]} rezervasyon)</p>` : ''}</div>
  <div class="card stack"><h3>Nereden geliyor</h3>${Object.keys(src).length ? Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="logline"><span>${esc(k)}</span><b class="num">${v}</b></div>`).join('') : '<p class="small muted">Veri yok.</p>'}</div>
  <div class="card stack"><h3>Sık gelen misafirler</h3>${regs.length ? regs.map((x) => `<div class="logline"><span>${esc(x.name)}</span><b class="num">${x.c} kez</b></div>`).join('') : '<p class="small muted">Henüz iki kez gelen misafir yok.</p>'}${ok ? '' : ''}</div>`;
}
function viewRezerv() {
  seedTables(); rzSeat(); const tab = S.rzTab; const tabs = [['liste', 'Liste'], ['masa', 'Masa planı']].concat(S.user.role === 'calisan' ? [] : [['rapor', 'Rapor']]);
  const body = tab === 'masa' ? rzMasa() : tab === 'rapor' && S.user.role !== 'calisan' ? rzRapor() : rzListe();
  return `<div class="stack-lg">${rzTop()}<div class="seg" role="group" aria-label="Rezervasyon bölümleri">${tabs.map((x) => `<button data-a="rztab" data-v="${x[0]}" aria-pressed="${tab === x[0] || (tab === 'rapor' && S.user.role === 'calisan' && x[0] === 'liste')}">${x[1]}</button>`).join('')}</div>${body}</div>`;
}
const viewHTMLV21 = viewHTML; viewHTML = function () { if (S.view === 'rezerv' && S.user && ['patron', 'mudur', 'calisan'].includes(S.user.role)) return viewRezerv(); return viewHTMLV21(); };
H.rzday = (el) => { S.rzDate = el.dataset.d; render(); };
H.rztab = (el) => { S.rzTab = el.dataset.v; render(); };
H.rzst = (el) => {
  const r = RESV.find((x) => x.id === el.dataset.id); if (!r) return; const s = el.dataset.s;
  if (['gelmedi', 'iptal'].includes(r.st) && s === 'onay') { const a = rzAssign(r.date, r.time, r.dur, r.n, r.id); if (!a) { toast('O saatte masa dolmuş. Düzenleyip saati değiştir.', 'warn'); return; } r.tids = a; }
  r.st = s; if (s === 'geldi') r.arr = new Date().toTimeString().slice(0, 5); render(); toast({ onay: 'Onaylandı.', geldi: 'Misafir masaya alındı.', bitti: 'Masa boşaldı.', gelmedi: 'Gelmedi olarak işaretlendi.', iptal: 'İptal edildi.' }[s] || 'Güncellendi.', 'ok');
};
H.rzcopy = (el) => { const r = RESV.find((x) => x.id === el.dataset.id); if (r) cpy(rzMsg(r, 'hat'), 'Mesaj kopyalandı.'); };
H.rznew = () => { S.modal = { type: 'rznew', id: null, name: '', phone: '', n: 2, date: S.rzDate, time: '19:00', dur: RCFG.dur, src: 'Telefon', note: '', tid: 'auto' }; renderModal(); };
H.rzedit = (el) => { const r = RESV.find((x) => x.id === el.dataset.id); if (!r) return; S.modal = { type: 'rznew', id: r.id, name: r.name, phone: r.phone, n: r.n, date: r.date, time: r.time, dur: r.dur, src: r.src, note: r.note, tid: r.tids.length === 1 ? r.tids[0] : 'auto' }; renderModal(); };
function rzCheck(m) {
  const s = toMin(m.time); let res = null; let msg = ''; let alt = [];
  if (m.tid === 'auto') { res = rzAssign(m.date, m.time, m.dur, m.n, m.id); if (!res) alt = rzAlt(m.date, m.time, m.dur, m.n, m.id); }
  else { const t = TABLES.find((x) => x.id === m.tid); const busy = rzBusy(m.date, s, s + m.dur, m.id); if (!t) msg = 'Masa bulunamadı.'; else if (busy[t.id]) { msg = t.name + ' bu saatte ' + busy[t.id].name + ' için ayrılmış.'; alt = rzAlt(m.date, m.time, m.dur, m.n, m.id); } else if (t.cap < m.n) msg = t.name + ' ' + t.cap + ' kişilik, ' + m.n + ' kişi sığmaz.'; else res = [t.id]; }
  return { res, msg, alt };
}
NEWM.rznew = (m) => {
  const c = rzCheck(m); const sl = rzSlots(); if (!sl.includes(m.time)) sl.push(m.time); sl.sort(); const h = m.phone ? rzHist(m.phone, m.id) : { n: 0, miss: 0 };
  const box = c.res ? `<div class="callout">${ic('check')}<div>Masa <b>${esc(rzNames(c.res))}</b> uygun${c.res.length > 1 ? ' (iki masa birleştirilir)' : ''}.</div></div>` : `<div class="callout warn">${ic('alert')}<div>${esc(c.msg || 'Bu saatte uygun masa yok.')}${c.alt.length ? `<div class="row wrap" style="gap:6px;margin-top:8px">${c.alt.map((t) => `<button class="chip" data-a="rzslot" data-t="${t}">${t}</button>`).join('')}</div>` : ''}</div></div>`;
  const F = (k, extra) => `data-ch="rzf" data-k="${k}"${extra || ''}`;
  return sheet(m.id ? 'Rezervasyonu düzenle' : 'Yeni rezervasyon', `<div class="stack">
  <div class="field"><label for="rz-name">Ad soyad</label><input type="text" id="rz-name" value="${esc(m.name)}" ${F('name')}></div>
  <div class="field"><label for="rz-phone">Telefon</label><input type="text" id="rz-phone" inputmode="tel" value="${esc(m.phone)}" placeholder="05xx xxx xx xx" ${F('phone')}><span class="small" id="rz-hist" style="color:var(--nar)">${h.miss ? h.miss + ' kez gelmemiş bir misafir.' : ''}</span></div>
  <div class="row" style="gap:10px"><div class="field grow"><label for="rz-n">Kişi</label><input type="number" id="rz-n" min="1" max="40" inputmode="numeric" value="${m.n}" ${F('n')}></div><div class="field grow"><label for="rz-dur">Süre</label><select id="rz-dur" ${F('dur')}>${[60, 90, 120, 150, 180].map((d) => `<option value="${d}"${m.dur === d ? ' selected' : ''}>${d} dk</option>`).join('')}</select></div></div>
  <div class="row" style="gap:10px"><div class="field grow"><label for="rz-date">Tarih</label><input type="date" id="rz-date" style="width:100%;min-height:44px;border:1px solid #C7D0DD;border-radius:10px;padding:10px 12px;font:inherit;background:#fff;color:var(--ink)" value="${m.date}" min="${REF_ISO}" ${F('date')}></div><div class="field grow"><label for="rz-time">Saat</label><select id="rz-time" ${F('time')}>${sl.map((t) => `<option${m.time === t ? ' selected' : ''}>${t}</option>`).join('')}</select></div></div>
  <div class="field"><label for="rz-tid">Masa</label><select id="rz-tid" ${F('tid')}><option value="auto"${m.tid === 'auto' ? ' selected' : ''}>Otomatik seç</option>${TABLES.map((t) => `<option value="${t.id}"${m.tid === t.id ? ' selected' : ''}>${esc(t.name)} (${t.cap} kişilik)</option>`).join('')}</select></div>
  ${box}
  <div class="field"><label for="rz-src">Nereden geldi</label><select id="rz-src" ${F('src')}>${['Telefon', 'WhatsApp', 'Yüz yüze', 'Instagram', 'Diğer'].map((s) => `<option${m.src === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
  <div class="field"><label for="rz-note">Not</label><input type="text" id="rz-note" value="${esc(m.note)}" placeholder="Doğum günü, bebek sandalyesi, alerji…" ${F('note')}></div>
  <div class="err" id="rz-err" role="alert"></div><button class="btn block" data-a="rzsave">${m.id ? 'Kaydet' : 'Rezervasyonu ekle'}</button></div>`);
};
H.rzslot = (el) => { if (S.modal && S.modal.type === 'rznew') { S.modal.time = el.dataset.t; renderModal(); } };
H.rzsave = () => {
  const m = S.modal; if (!m || m.type !== 'rznew') return; const g = (id) => (document.getElementById(id) || {}).value; m.name = (g('rz-name') || m.name || '').trim(); m.phone = (g('rz-phone') || m.phone || '').trim(); m.note = (g('rz-note') != null ? g('rz-note') : m.note) || '';
  const err = (t) => { const e = document.getElementById('rz-err'); if (e) e.textContent = t; };
  if (!m.name) return err('Misafirin adını yaz.'); if (!(m.n >= 1)) return err('Kişi sayısını yaz.'); if (!m.date || m.date < REF_ISO) return err('Geçmiş bir tarih seçilemez.');
  const c = rzCheck(m); if (!c.res) return err(c.msg || 'Bu saatte uygun masa yok. Başka saat ya da masa seç.');
  if (m.id) { const r = RESV.find((x) => x.id === m.id); if (r) Object.assign(r, { name: m.name, phone: m.phone, n: m.n, date: m.date, time: m.time, dur: m.dur, src: m.src, note: m.note, tids: c.res }); }
  else RESV.push({ id: 'r' + (++seq), name: m.name, phone: m.phone, n: m.n, date: m.date, time: m.time, dur: m.dur, tids: c.res, src: m.src, note: m.note, st: 'onay', by: S.user ? S.user.id : '' });
  S.rzDate = m.date; S.modal = null; render(); toast('Rezervasyon kaydedildi.', 'ok');
};
/* masalar */
H.rztables = () => { S.modal = { type: 'rztables' }; renderModal(); };
NEWM.rztables = () => sheet('Masalar', `<p class="muted small">Kapasiteyi değiştir, masa ekle ya da kaldır. Birleştirme aynı bölgedeki iki masa arasında otomatik yapılır.</p><div class="stack">${TABLES.map((t) => `<div class="row between" style="gap:8px"><span style="min-width:70px"><b>${esc(t.name)}</b><span class="small muted" style="display:block">${esc(t.zone || '')}</span></span><span class="row" style="gap:6px"><input type="number" min="1" max="30" value="${t.cap}" data-ch="rzcap" data-id="${t.id}" style="width:72px" aria-label="${esc(t.name)} kapasite"><span class="small muted">kişi</span><button class="btn sm sec" data-a="rztdel" data-id="${t.id}">Kaldır</button></span></div>`).join('')}</div>
  <div class="card stack" style="margin-top:12px"><b>Yeni masa</b><div class="row wrap" style="gap:8px"><input type="text" id="tn-name" placeholder="Ad (örn. Masa 9)" class="grow" style="min-width:120px"><input type="number" id="tn-cap" min="1" max="30" value="4" style="width:72px" aria-label="Kapasite"><select id="tn-zone"><option>İç</option><option>Bahçe</option></select><button class="btn" data-a="rztadd">Ekle</button></div></div>`);
H.rztadd = () => { const g = (id) => (document.getElementById(id) || {}).value; const name = (g('tn-name') || '').trim() || 'Masa ' + (TABLES.length + 1); const cap = Math.max(1, Math.min(30, parseInt(g('tn-cap'), 10) || 4)); TABLES.push({ id: 't' + (++seq), name, cap, zone: g('tn-zone') || 'İç' }); renderModal(); render(); };
H.rztdel = (el) => { const id = el.dataset.id; const used = RESV.filter((r) => rzActive(r) && r.date >= REF_ISO && r.tids.includes(id)); if (used.length) { toast('Bu masada ' + used.length + ' aktif rezervasyon var. Önce onları taşı.', 'warn'); return; } const i = TABLES.findIndex((t) => t.id === id); if (i >= 0) TABLES.splice(i, 1); renderModal(); render(); };
const _och22 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'rzcap') { const t = TABLES.find((x) => x.id === el.dataset.id); if (t) t.cap = Math.max(1, Math.min(30, parseInt(el.value, 10) || t.cap)); render(); return; }
  if (ch === 'rzf' && S.modal && S.modal.type === 'rznew') {
    const m = S.modal; const k = el.dataset.k; m[k] = (k === 'n' || k === 'dur') ? Number(el.value) : el.value;
    if (['n', 'date', 'time', 'dur', 'tid'].includes(k)) { if (k === 'date' && m.date < REF_ISO) m.date = REF_ISO; renderModal(); }
    else if (k === 'phone') { const h = rzHist(m.phone, m.id); const x = document.getElementById('rz-hist'); if (x) x.textContent = h.miss ? h.miss + ' kez gelmemiş bir misafir.' : ''; }
    return;
  }
  return _och22(e);
};
const wipeV21 = wipeData; wipeData = function () { wipeV21(); RESV.length = 0; TABLES.length = 0; RCFG.seeded = false; };

/* v23: reçete maliyeti ve kâr marjı, tedarikçi performansı */
const MCFG = { kdv: 10, hedef: 60 }; P_OBJ.push(['MCFG', () => MCFG]); P_SCOPE.MCFG = 'stok';
function recipeCost(k, useAvg) {
  const rc = RECIPES[k]; let c = 0; const miss = []; const parts = [];
  Object.entries(rc.items).forEach(([sid, q]) => { const st = stById(sid); if (!st) { miss.push(sid); return; } let p = st.cost || 0; if (useAvg) { const pi = priceInfo(st); if (pi.avg > 0) p = pi.avg; } if (!(p > 0)) miss.push(st.name); parts.push({ name: st.name.split(' (')[0], v: q * p }); c += q * p; });
  return { c, miss, parts: parts.sort((a, b) => b.v - a.v) };
}
function salePriceOf(k) { let q = 0; let t = 0; SALES.forEach((s) => { if (prodKey(s.prod) === k) { q += s.qty; t += s.total; } }); return q > 0 ? { price: t / q, qty: q } : null; }
function costRows() {
  return Object.keys(RECIPES).map((k) => {
    const rc = RECIPES[k]; const now = recipeCost(k, false); const old = recipeCost(k, true); const sp = salePriceOf(k);
    const net = sp ? sp.price / (1 + MCFG.kdv / 100) : 0; const profit = sp ? net - now.c : 0; const margin = sp && net > 0 ? profit / net : null;
    const need = MCFG.hedef < 100 && now.c > 0 ? Math.ceil((now.c / (1 - MCFG.hedef / 100)) * (1 + MCFG.kdv / 100) * 2) / 2 : 0;
    let drift = old.c > 0 ? (now.c / old.c - 1) * 100 : 0; if (drift < -40 || drift > 100) drift = 0;
    return { k, name: rc.name, cost: now.c, parts: now.parts, miss: now.miss, sp, margin, profit, need, drift };
  }).sort((a, b) => (a.margin == null ? 2 : a.margin) - (b.margin == null ? 2 : b.margin));
}
function stokMaliyet() {
  const rows = costRows(); const low = rows.filter((r) => r.margin != null && r.margin * 100 < MCFG.hedef); const wm = rows.filter((r) => r.margin != null);
  const avgM = wm.length ? wm.reduce((a, r) => a + r.margin, 0) / wm.length : null;
  const drift = rows.filter((r) => r.drift >= 3);
  return `${stokHead('Ürünün malzeme maliyeti ve kâr marjı.')}
  <div class="kpis">${kpi('Reçeteli ürün', rows.length)}${kpi('Ort. kâr marjı', avgM == null ? '-' : '%' + Math.round(avgM * 100))}${kpi('Hedefin altında', low.length)}</div>
  ${drift.length ? `<div class="callout warn">${ic('alert')}<div><b>Malzeme zammı:</b> ${esc(drift.map((r) => r.name + ' maliyeti %' + Math.round(r.drift)).join(', '))} arttı (son alış, önceki alışların ortalamasına göre).</div></div>` : ''}
  <div class="card stack"><div class="row between wrap"><div><h3>Hesap ayarı</h3><p class="muted small" style="margin-top:2px">Satış fiyatı KDV dahil kabul edilir.</p></div><div class="row wrap" style="gap:8px"><label class="small muted">KDV <select data-ch="mkdv" aria-label="KDV oranı">${[1, 10, 20].map((x) => `<option value="${x}"${MCFG.kdv === x ? ' selected' : ''}>%${x}</option>`).join('')}</select></label><label class="small muted">Hedef marj <select data-ch="mhedef" aria-label="Hedef marj">${[40, 50, 60, 65, 70, 75].map((x) => `<option value="${x}"${MCFG.hedef === x ? ' selected' : ''}>%${x}</option>`).join('')}</select></label></div></div></div>
  ${rows.length ? rows.map((r) => { const m = r.margin == null ? null : Math.round(r.margin * 100); const tone = m == null ? 'p-mute' : m < MCFG.hedef - 10 ? 'p-bad' : m < MCFG.hedef ? 'p-warn' : 'p-ok';
    return `<div class="card stack" style="gap:8px"><div class="row between" style="align-items:flex-start"><div><b style="font-weight:600">${esc(r.name)}</b><span class="small muted" style="display:block">Maliyet ${fmt(r.cost)}${r.sp ? ' · satış ' + fmt(r.sp.price) : ' · satış verisi yok'}</span></div><span class="pill ${tone}">${m == null ? 'Marj yok' : 'Marj %' + m}</span></div>
    ${r.parts.length ? `<div class="row" style="height:10px;border-radius:5px;overflow:hidden;gap:2px">${r.parts.map((p, i) => `<div title="${esc(p.name)} ${fmt(p.v)}" style="flex:${Math.max(p.v, 0.001)};background:${['var(--cini)', 'var(--turq)', 'var(--safran)', 'var(--nar)'][i % 4]}"></div>`).join('')}</div><div class="small muted">${r.parts.slice(0, 3).map((p) => esc(p.name) + ' ' + fmt(p.v)).join(' · ')}</div>` : ''}
    ${r.sp && m != null ? `<div class="small">Kâr ${fmt(r.profit)} (KDV hariç).${m < MCFG.hedef && r.need ? ` Hedef %${MCFG.hedef} için fiyat <b>${fmt(r.need)}</b> olmalı.` : ''}</div>` : r.need ? `<div class="small muted">Hedef %${MCFG.hedef} için satış fiyatı en az ${fmt(r.need)} olmalı.</div>` : ''}
    ${r.drift >= 3 ? `<span class="pill p-warn" style="align-self:flex-start">Maliyet %${Math.round(r.drift)} arttı</span>` : ''}${r.miss.length ? `<span class="small" style="color:var(--nar)">Fiyatı olmayan malzeme: ${esc(r.miss.map((x) => String(x).split(' (')[0]).join(', '))}</span>` : ''}</div>`; }).join('') : `<div class="card empty">Henüz reçete yok. Satışlar sayfasından reçete ekle.</div>`}
  <p class="small muted">Maliyet, stoktaki birim fiyatlardan hesaplanır. Satış fiyatı, yüklenen satış dosyasındaki ortalama fiyattır.</p>`;
}
const _och23 = onChange;
onChange = function (e) { const el = e.target; const ch = el.dataset && el.dataset.ch; if (ch === 'mkdv') { MCFG.kdv = Number(el.value); render(); return; } if (ch === 'mhedef') { MCFG.hedef = Number(el.value); render(); return; } return _och23(e); };
/* tedarikçi performansı */
const dayDiff = (a, b) => { const x = a.split('-').map(Number); const y = b.split('-').map(Number); return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5); };
const _ordcreate23 = H.ordcreate; H.ordcreate = (el) => { const n = ORDERS.length; _ordcreate23(el); if (ORDERS.length > n && !ORDERS[0].iso) ORDERS[0].iso = REF_ISO; };
const _ordrecv23 = H.ordrecv; H.ordrecv = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); const was = o && o.status; _ordrecv23(el); if (o && was === 'gonderildi' && o.status === 'teslim') { o.recvIso = REF_ISO; if (!o.iso) delete o.recvIso; } };
function supPerf() {
  return SUPPLIERS.map((sp) => {
    const os = ORDERS.filter((o) => o.supId === sp.id); const done = os.filter((o) => o.status === 'teslim'); const timed = done.filter((o) => o.iso && o.recvIso);
    const leads = timed.map((o) => dayDiff(o.iso, o.recvIso)); const late = timed.filter((o) => dayDiff(o.iso, o.recvIso) > (sp.lead || 0)); const ontime = timed.length ? 1 - late.length / timed.length : null;
    const avgLead = leads.length ? leads.reduce((a, b) => a + b, 0) / leads.length : null; const spend = done.reduce((a, o) => a + o.total, 0); const conf = os.length ? os.filter((o) => o.conf || o.status === 'teslim').length / os.length : null;
    const ch = []; STOCK.forEach((st) => { const pts = pricePoints(st.id).filter((p) => p.who === sp.name); if (pts.length >= 2) ch.push((pts[pts.length - 1].price / pts[0].price - 1) * 100); });
    const price = ch.length ? ch.reduce((a, b) => a + b, 0) / ch.length : null;
    let score = null; if (ontime != null) { score = ontime * 60 + (price == null ? 25 : Math.max(0, 40 - Math.max(0, price) * 4)) * (40 / 40); score = Math.round(Math.min(100, score)); }
    return { sp, n: os.length, done: done.length, ontime, avgLead, late: late.length, spend, price, score };
  }).filter((x) => x.n > 0).sort((a, b) => (b.score == null ? -1 : b.score) - (a.score == null ? -1 : a.score));
}
function supPerfCard() {
  const L = supPerf(); if (!L.length) return `<div class="card stack"><div><h3>Tedarikçi performansı</h3><p class="muted small" style="margin-top:2px">Sipariş verip teslim aldıkça, kimin geç getirdiği ve fiyatının nasıl değiştiği burada görünür.</p></div></div>`;
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Tedarikçi performansı</h3><p class="muted small" style="margin-top:2px">Teslim süresi sözden uzunsa geç sayılır. Fiyat değişimi ilk ve son alış arasındadır.</p></div>
  ${L.map((x) => { const tone = x.score == null ? 'p-mute' : x.score >= 80 ? 'p-ok' : x.score >= 60 ? 'p-warn' : 'p-bad'; const lbl = x.score == null ? 'Veri az' : x.score >= 80 ? 'Güvenilir' : x.score >= 60 ? 'Dikkat' : 'Zayıf';
    return `<div class="rrow"><div><b style="font-weight:600">${esc(x.sp.name)}</b><div class="small muted">${x.done} teslim${x.avgLead != null ? ' · ort. ' + q1(x.avgLead) + ' gün (söz ' + (x.sp.lead || 0) + ')' : ''}${x.ontime != null ? ' · zamanında %' + Math.round(x.ontime * 100) : ''}${x.price != null ? ' · fiyat ' + (x.price >= 0 ? '+' : '') + q1(x.price) + '%' : ''}</div></div><b class="num">${fmt0(x.spend)}</b><div class="rfoot"><span class="pill ${tone}">${lbl}${x.score != null ? ' ' + x.score : ''}</span>${x.late ? `<span class="pill p-warn">${x.late} geç teslim</span>` : ''}</div></div>`; }).join('')}</div>`;
}
const saSupsCardV23 = saSupsCard; saSupsCard = function () { return supPerfCard() + saSupsCardV23(); };
/* örnek teslim geçmişi (denemek için) */
[['t3', '2026-10-20', '2026-10-21', 's2', 60, 35, true], ['t3', '2026-10-30', '2026-11-01', 's2', 60, 36, true], ['t3', '2026-11-08', '2026-11-09', 's2', 60, 38, true], ['t4', '2026-10-22', '2026-10-22', 's1', 2, 1500, false], ['t4', '2026-11-02', '2026-11-04', 's1', 2, 1520, false], ['t1', '2026-10-18', '2026-10-21', 's1', 3, 1430, true], ['t1', '2026-11-05', '2026-11-08', 's1', 3, 1450, true], ['t2', '2026-10-25', '2026-10-30', 's5', 200, 3.1, false], ['t2', '2026-11-04', '2026-11-08', 's5', 200, 3.2, true]].forEach((x, i) => {
  const st = STOCK.find((s) => s.id === x[3]); if (!st) return; ORDERS.push({ id: 'oh' + i, supId: x[0], date: isoShort(x[1]), iso: x[1], recvIso: x[2], lines: [{ sid: x[3], name: st.name, unit: st.unit, qty: x[4], price: x[5] }], total: Math.round(x[4] * x[5] * 100) / 100, status: 'teslim', conf: x[6], msg: '' });
});
const wipeV23 = wipeData; wipeData = function () { wipeV23(); MCFG.kdv = 10; MCFG.hedef = 60; };

/* v24: bildirim merkezi (zil, okundu, tarayıcı bildirimi) */
ICONS.bell = '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 21h4"/>';
const NF = { seen: null, notified: new Set(), first: true, timer: null };
const nfStoreKey = () => 'kp_seen_' + (S.user ? S.user.id : 'x');
function nfLoad() { if (NF.seen) return NF.seen; try { NF.seen = new Set(JSON.parse(localStorage.getItem(nfStoreKey()) || '[]')); } catch (e) { NF.seen = new Set(); } return NF.seen; }
function nfSave() { try { localStorage.setItem(nfStoreKey(), JSON.stringify([...NF.seen].slice(-300))); } catch (e) {} }
function notifList() {
  if (!S.user) return []; const r = S.user.role; const out = []; const add = (key, sev, text, view, tab) => out.push({ key: key + '|' + REF_ISO, sev, text, view, tab });
  const stokR = ['patron', 'mudur', 'calisan'].includes(r); const mgr = ['patron', 'mudur'].includes(r);
  if (stokR) {
    try { stockPlan().filter((p) => p.lvl === 'acil').slice(0, 5).forEach((p) => add('acil' + p.st.id, 'bad', p.st.name.split(' (')[0] + ' acil: ' + q1(p.st.qty) + ' ' + p.st.unit + ' kaldı' + (p.transit > 0 ? ' (yolda ' + q1(p.transit) + ')' : '') + '.', 'stok', 'liste')); } catch (e) {}
    sktSoon(3).slice(0, 5).forEach((l) => { const st = stById(l.sid); if (st) add('skt' + l.id, dleft(l.exp) <= 0 ? 'bad' : 'warn', st.name.split(' (')[0] + ' ' + q1(l.qty) + ' ' + st.unit + ' ' + sktTxt(dleft(l.exp)) + (dleft(l.exp) <= 0 ? '' : ' bozulacak') + '.', 'stok', 'rapor'); });
  }
  if (mgr) {
    ORDERS.filter((o) => o.status === 'gonderildi' && o.iso).forEach((o) => { const sp = supById(o.supId); const d = dayDiff(o.iso, REF_ISO); if (sp && d > (sp.lead || 0) + 0) add('gec' + o.id, 'warn', (sp.name) + ' siparişi ' + d + ' gündür gelmedi (söz ' + (sp.lead || 0) + ' gün).', 'satinalma', null); });
    try { anomalies().forEach((t, i) => add('an' + i + t.slice(0, 12), 'warn', t, 'stok', 'fire')); } catch (e) {}
    try { const pa = priceAlerts(); if (pa.length) add('fiyat' + pa.map((x) => x.st.id).join(''), 'warn', pa.length + ' üründe fiyat zammı: ' + pa.slice(0, 3).map((x) => x.st.name.split(' (')[0]).join(', ') + '.', 'satinalma', null); } catch (e) {}
    const lv = LVREQ.filter((x) => ['bekliyor', 'yanit'].includes(x.status)).length; if (lv) add('izin' + lv, 'info', lv + ' izin talebi seni bekliyor.', 'ekip', 'talep');
  }
  if (stokR) {
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    RESV.filter((x) => x.date === REF_ISO && x.st === 'onay').forEach((x) => { const d = now - toMin(x.time); if (d >= 20) add('rl' + x.id, 'bad', x.name + ' (' + x.time + ', ' + x.n + ' kişi) ' + d + ' dakikadır gelmedi.', 'rezerv', 'liste'); else if (d > -60 && d <= 0) add('ry' + x.id, 'info', x.name + ' ' + (-d) + ' dakikaya gelecek (' + x.n + ' kişi' + (x.tids.length ? ', masa ' + rzNames(x.tids) : '') + ').', 'rezerv', 'liste'); });
  }
  if (r === 'patron' || r === 'muhasebeci') {
    try { debtSoon().slice(0, 4).forEach((d) => add('borc' + d.id, 'warn', d.who + ' ödemesi yaklaşıyor: ' + fmt0(d.amt) + '.', r === 'patron' ? 'muhasebe' : 'borc', null)); } catch (e) {}
  }
  if (r === 'muhasebeci') { try { const m = countStatus('eksik'); if (m) add('eksik' + m, 'warn', m + ' işlemin belgesi eksik.', 'belgeler', 'ekstre'); } catch (e) {} }
  const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]);
}
const nfUnread = () => { const s = nfLoad(); return notifList().filter((x) => !s.has(x.key)); };
const shellHTMLV23 = shellHTML;
shellHTML = function () {
  const h = shellHTMLV23(); const n = nfUnread().length;
  const btn = `<button class="xbtn sm" data-a="bell" aria-label="Bildirimler${n ? ', ' + n + ' yeni' : ''}" style="position:relative;margin-left:6px">${ic('bell', 18)}${n ? `<span style="position:absolute;top:-4px;right:-4px;background:var(--nar);color:#fff;border-radius:999px;min-width:18px;height:18px;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 4px">${n > 9 ? '9+' : n}</span>` : ''}</button>`;
  return h.replace(/(<span class="pill p-mute" id="ps-chip"[^>]*>[^<]*<\/span>)/, '$1' + btn);
};
H.bell = () => { S.modal = { type: 'bell' }; renderModal(); };
NEWM.bell = () => {
  const L = notifList(); const seen = nfLoad(); const perm = typeof Notification !== 'undefined' ? Notification.permission : 'yok';
  const tone = { bad: 'p-bad', warn: 'p-warn', info: 'p-info' }; const lbl = { bad: 'Acil', warn: 'Dikkat', info: 'Bilgi' };
  return sheet('Bildirimler', `${L.length ? L.map((x, i) => `<button class="logline" data-a="nfgo" data-i="${i}" style="width:100%;text-align:left;background:${seen.has(x.key) ? 'transparent' : 'var(--cini-wash)'};border:0;border-radius:10px;padding:10px;gap:10px"><span class="small">${esc(x.text)}</span><span class="pill ${tone[x.sev]}">${lbl[x.sev]}</span></button>`).join('') + `<button class="btn sm sec" data-a="nfread" style="margin-top:8px">Hepsini okundu yap</button>` : `<div class="card empty">${ic('check', 28)}<p style="margin-top:8px">Her şey yolunda, bekleyen bildirim yok.</p></div>`}
  <div class="card stack" style="margin-top:12px"><b>Tarayıcı bildirimi</b><p class="small muted">${perm === 'granted' ? 'Açık. Uygulama arka planda açıkken acil durumlarda bildirim gelir.' : perm === 'denied' ? 'Tarayıcı bildirimi engellenmiş. Adres çubuğundaki kilit simgesinden izin ver.' : perm === 'yok' ? 'Bu tarayıcı bildirimi desteklemiyor.' : 'Uygulama arka planda açıkken acil durumlarda bildirim gösterilsin mi?'}</p>${perm === 'default' ? '<button class="btn sm" data-a="nfperm">Bildirime izin ver</button>' : ''}<p class="small muted"></p></div>`);
};
H.nfgo = (el) => { const x = notifList()[Number(el.dataset.i)]; if (!x) return; nfLoad().add(x.key); nfSave(); S.modal = null; S.view = x.view; if (x.view === 'stok' && x.tab) S.stTab = x.tab; if (x.view === 'ekip' && x.tab) S.sub.ekip = x.tab; if (x.view === 'rezerv') S.rzTab = 'liste'; if (x.view === 'satinalma') S.saTab = 'siparis'; render(); };
H.nfread = () => { const s = nfLoad(); notifList().forEach((x) => s.add(x.key)); nfSave(); render(); renderModal(); };
H.nfperm = async () => { try { await Notification.requestPermission(); } catch (e) {} renderModal(); };
function nfCheck() {
  if (!S.user) return; const s = nfLoad(); const fresh = notifList().filter((x) => !s.has(x.key) && !NF.notified.has(x.key));
  if (NF.first) { fresh.forEach((x) => NF.notified.add(x.key)); NF.first = false; return; }
  fresh.filter((x) => x.sev !== 'info' || x.key.startsWith('ry')).slice(0, 3).forEach((x) => {
    NF.notified.add(x.key);
    if (typeof document !== 'undefined' && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') { try { new Notification(BIZ, { body: x.text, tag: x.key }); } catch (e) {} }
    else if (typeof document !== 'undefined' && !document.hidden) toast(x.text, x.sev === 'bad' ? 'warn' : undefined);
  });
  const n = fresh.length; if (n) render();
}
if (typeof setInterval === 'function') { clearInterval(NF.timer); NF.timer = setInterval(nfCheck, 60000); }
const _logout24 = H.logout; H.logout = () => { NF.seen = null; NF.notified = new Set(); NF.first = true; return _logout24(); };

/* v25: barkod ve raf etiketi yazdırma (EAN-13, EAN-8, Code 39) */
const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const EAN_P = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
const C39 = { '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000', '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101', '8': '100100100', '9': '001100100', A: '100001001', B: '001001001', C: '101001000', D: '000011001', E: '100011000', F: '001011000', G: '000001101', H: '100001100', I: '001001100', J: '000011100', K: '100000011', L: '001000011', M: '101000010', N: '000010011', O: '100010010', P: '001010010', Q: '000000111', R: '100000110', S: '001000110', T: '000010110', U: '110000001', V: '011000001', W: '111000000', X: '010010001', Y: '110010000', Z: '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100' };
function eanCheck(d) { let s = 0; for (let i = 0; i < d.length; i++) s += Number(d[d.length - 1 - i]) * (i % 2 === 0 ? 3 : 1); return (10 - (s % 10)) % 10; }
const eanOk = (c) => /^\d{8}$|^\d{13}$/.test(c) && Number(c[c.length - 1]) === eanCheck(c.slice(0, -1));
function ean13Bits(c) { const d = c.split('').map(Number); const p = EAN_P[d[0]]; let b = '101'; for (let i = 1; i <= 6; i++) b += (p[i - 1] === 'L' ? EAN_L : EAN_G)[d[i]]; b += '01010'; for (let i = 7; i <= 12; i++) b += EAN_R[d[i]]; return b + '101'; }
function ean8Bits(c) { const d = c.split('').map(Number); let b = '101'; for (let i = 0; i < 4; i++) b += EAN_L[d[i]]; b += '01010'; for (let i = 4; i < 8; i++) b += EAN_R[d[i]]; return b + '101'; }
function code39Bits(t) {
  const s = '*' + String(t).toUpperCase().replace(/[^0-9A-Z\-. ]/g, '') + '*'; let b = '';
  s.split('').forEach((ch, ci) => { const p = C39[ch]; for (let i = 0; i < 9; i++) { const wide = p[i] === '1'; b += (i % 2 === 0 ? '1' : '0').repeat(wide ? 3 : 1); } if (ci < s.length - 1) b += '0'; });
  return b;
}
function barBits(code) { const c = String(code || '').trim(); if (/^\d{13}$/.test(c) && eanOk(c)) return ean13Bits(c); if (/^\d{8}$/.test(c) && eanOk(c)) return ean8Bits(c); return code39Bits(c); }
function barcodeSVG(code, h) {
  const b = barBits(code); const q = 10; const W = b.length + q * 2; let x = 0; let r = '';
  while (x < b.length) { if (b[x] === '1') { let y = x; while (y < b.length && b[y] === '1') y++; r += `<rect x="${q + x}" y="0" width="${y - x}" height="${h || 50}" />`; x = y; } else x++; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h || 50}" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="Barkod ${esc(code)}"><rect width="${W}" height="${h || 50}" fill="#fff"/><g fill="#000">${r}</g></svg>`;
}
function genCode() { let n = 0; STOCK.forEach((s) => { const c = String(s.code || ''); if (/^20\d{11}$/.test(c)) n = Math.max(n, Number(c.slice(2, 12))); }); n++; const d = '20' + String(n).padStart(10, '0'); return d + eanCheck(d); }
H.etkcodes = () => { let k = 0; STOCK.forEach((s) => { if (!s.code) { s.code = genCode(); k++; } }); renderModal(); render(); toast(k + ' ürüne barkod verildi.', 'ok'); };
H.etkopen = () => { S.modal = { type: 'etiket', sel: STOCK.map((s) => s.id), size: 'm', copies: 1 }; renderModal(); };
const ETK_SZ = { s: ['40 × 25 mm', 40, 25, 10], m: ['58 × 35 mm', 58, 35, 12], l: ['80 × 50 mm', 80, 50, 14] };
function labelHTML(st, sz, nameFs) {
  return `<div class="etk" style="width:${sz[1]}mm;height:${sz[2]}mm"><div class="etk-n" style="font-size:${sz[3] - 2}px">${esc(st.name)}</div><div class="etk-m">${esc([st.unit, st.cat, st.loc].filter(Boolean).join(' · '))}</div><div class="etk-b">${barcodeSVG(st.code, 50)}</div><div class="etk-c">${esc(st.code)}</div></div>`;
}
NEWM.etiket = (m) => {
  const miss = STOCK.filter((s) => !s.code).length; const sz = ETK_SZ[m.size]; const chosen = STOCK.filter((s) => m.sel.includes(s.id) && s.code);
  return sheet('Etiket yazdır', `<p class="muted small">Seçtiğin ürünler için raf etiketi hazırlanır. Barkodu sayım ekranındaki barkod okutma ile okutabilirsin.</p>
  ${miss ? `<div class="callout warn">${ic('alert')}<div>${miss} ürünün barkodu yok. <button class="btn sm" data-a="etkcodes" style="margin-left:6px">Otomatik barkod ver</button></div></div>` : ''}
  <div class="row wrap" style="gap:10px;margin:8px 0"><label class="small muted">Boyut <select data-ch="etksize" aria-label="Etiket boyutu">${Object.keys(ETK_SZ).map((k) => `<option value="${k}"${m.size === k ? ' selected' : ''}>${ETK_SZ[k][0]}</option>`).join('')}</select></label><label class="small muted">Adet <input type="number" min="1" max="10" value="${m.copies}" data-ch="etkcopies" style="width:64px" aria-label="Her üründen kaç etiket"></label>
  <button class="btn sm sec" data-a="etkall">${m.sel.length === STOCK.length ? 'Hiçbirini seçme' : 'Hepsini seç'}</button></div>
  <div class="stack" style="max-height:200px;overflow:auto;gap:2px">${STOCK.map((s) => `<label class="small" style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" data-ch="etksel" data-id="${s.id}"${m.sel.includes(s.id) ? ' checked' : ''}> ${esc(s.name)}${s.code ? '' : ' <span class="muted">(barkod yok)</span>'}</label>`).join('')}</div>
  ${chosen.length ? `<p class="lbl" style="margin-top:10px">Önizleme</p><div class="etk-wrap">${labelHTML(chosen[0], sz)}</div>` : ''}
  <button class="btn block" data-a="etkprint"${chosen.length ? '' : ' disabled'} style="margin-top:12px">${ic('file')} ${chosen.length * m.copies} etiketi yazdır</button><p class="small muted">Yazıcı penceresinde kenar boşluğunu "Yok" seç.</p>`);
};
H.etkall = () => { const m = S.modal; m.sel = m.sel.length === STOCK.length ? [] : STOCK.map((s) => s.id); renderModal(); };
H.etkprint = () => {
  const m = S.modal; const sz = ETK_SZ[m.size]; const list = STOCK.filter((s) => m.sel.includes(s.id) && s.code); if (!list.length) return;
  let root = document.getElementById('kp-print'); if (!root) { root = document.createElement('div'); root.id = 'kp-print'; document.body.appendChild(root); }
  let html = ''; list.forEach((s) => { for (let i = 0; i < m.copies; i++) html += labelHTML(s, sz); }); root.innerHTML = html; document.body.classList.add('kp-printing');
  const done = () => { document.body.classList.remove('kp-printing'); root.innerHTML = ''; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 50);
};
(function () { if (typeof document === 'undefined' || !document.createElement) return; try { const st = document.createElement('style'); st.textContent = '.etk{box-sizing:border-box;border:1px dashed #bbb;border-radius:4px;padding:2mm;display:flex;flex-direction:column;justify-content:space-between;background:#fff;color:#000;overflow:hidden;font-family:Inter,Arial,sans-serif}.etk-n{font-weight:700;line-height:1.1;max-height:2.3em;overflow:hidden}.etk-m{font-size:8px;color:#444}.etk-b{height:34%;min-height:8mm}.etk-b svg{width:100%;height:100%;display:block}.etk-c{font-size:8px;text-align:center;letter-spacing:1px}.etk-wrap{display:flex;justify-content:center;padding:8px;background:var(--canvas);border-radius:10px}#kp-print{display:none}@media print{body.kp-printing>*:not(#kp-print){display:none!important}body.kp-printing #kp-print{display:flex!important;flex-wrap:wrap;gap:2mm}.etk{border:1px solid #999!important;break-inside:avoid}@page{margin:6mm}}'; document.head.appendChild(st); } catch (e) {} })();
const _och25 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch; const m = S.modal;
  if (m && m.type === 'etiket') {
    if (ch === 'etksize') { m.size = el.value; renderModal(); return; } if (ch === 'etkcopies') { m.copies = Math.max(1, Math.min(10, parseInt(el.value, 10) || 1)); renderModal(); return; }
    if (ch === 'etksel') { const id = el.dataset.id; m.sel = m.sel.includes(id) ? m.sel.filter((x) => x !== id) : m.sel.concat([id]); renderModal(); return; }
  }
  return _och25(e);
};
const stokHeadV25 = stokHead;
stokHead = function (sub) { const h = stokHeadV25(sub); return h.replace('<button class="btn sec" data-a="stkbulk">', '<button class="btn sec" data-a="etkopen">Etiket</button><button class="btn sec" data-a="stkbulk">'); };

/* v26: fişi fotoğraftan okuma (tarayıcıda OCR, deneysel) */
function ocrParse(text, conf) {
  const raw = String(text || ''); const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const toNum = (m) => Number(m.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  const amts = (l) => [...l.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)[,.]\d{2}(?!\d)/g)].map((m) => toNum(m[0])).filter((x) => x > 0 && x < 1e7);
  let total = null;
  const tl = lines.filter((l) => /toplam/i.test(l) && !/kdv|kdy|vergi/i.test(l)); const cand = [].concat(...tl.map(amts)); if (cand.length) total = Math.max(...cand);
  if (total == null) { const t2 = [].concat(...lines.filter((l) => /tutar|ödenecek|odenecek|total/i.test(l) && !/kdv|kdy|vergi/i.test(l)).map(amts)); if (t2.length) total = Math.max(...t2); }
  if (total == null) { const t3 = [].concat(...lines.filter((l) => !/kdv|kdy|vergi|nakit|kredi|para\s*[üu]st|indirim/i.test(l)).map(amts)); if (t3.length) total = Math.max(...t3); }
  let date = null; const dm = raw.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})/); if (dm) { const d = Number(dm[1]); const mo = Number(dm[2]); if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) date = String(d).padStart(2, '0') + ' ' + MON[mo - 1]; }
  const stop = /fi[şs]|tarih|saat|vkn|vergi|tel|adres|kasa|fatura|no\s*:|mersis|belge|sicil|sat[ıi]ş/i; let seller = '';
  for (const l of lines.slice(0, 8)) { if (stop.test(l)) { if (seller) break; continue; } const letters = (l.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || []).length; if (letters >= 3 && letters / l.length > 0.55) { seller = seller ? seller + ' ' + l : l; if (seller.length >= 14) break; } }
  seller = seller.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9 .&'-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (seller && seller === seller.toLocaleUpperCase('tr-TR')) seller = seller.toLocaleLowerCase('tr-TR').replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toLocaleUpperCase('tr-TR'));
  const rc = {}; lines.filter((l) => /kdv|kdy/i.test(l)).forEach((l) => { [...l.matchAll(/%\s*(\d{1,2})|[*xX]\s*(\d{1,2})(?!\d)|(?:^|[\s"“”'*])(1|8|10|18|20)(?=\s+\d{1,3}(?:\.\d{3})*[,.]\d{2})/g)].forEach((m) => { const v = Number(m[1] || m[2] || m[3]); if ([1, 8, 10, 18, 20].includes(v)) rc[v] = (rc[v] || 0) + 1; }); });
  const rk = Object.keys(rc).sort((a, b) => rc[b] - rc[a])[0]; const rate = rk ? Number(rk) : 20;
  let cat = null; const lo = seller.toLocaleLowerCase('tr-TR'); const rule = RULES.find((r) => lo.includes(String(r.k).toLocaleLowerCase('tr-TR')));
  if (rule) cat = rule.v; else if (/akaryak|petrol|opet|shell|bp\b|total\b|aygaz|lpg/.test(lo + ' ' + raw.toLowerCase().slice(0, 300))) cat = 'Akaryakıt'; else if (/turkcell|vodafone|telekom|superonline/.test(lo)) cat = 'Telefon / internet'; else if (/enerji|elektrik|edaş|enerjisa/.test(lo)) cat = 'Elektrik'; else if (/su\s*idare|iski|aski/.test(lo)) cat = 'Su';
  const found = (total != null ? 1 : 0) + (date ? 1 : 0) + (seller ? 1 : 0); const c0 = Number(conf) > 0 ? Number(conf) / 100 : 0.6;
  const bank = total != null ? (ROWS.find((r) => r.kind === 'gider' && Math.abs(Math.abs(r.amt) - total) < 0.01) || {}).id || null : null;
  return { seller: seller || 'Satıcı okunamadı', date: date || String(new Date().getDate()).padStart(2, '0') + ' ' + MON[new Date().getMonth()], total, rate, cat, bank, conf: Math.max(0.3, Math.min(0.97, c0 * (0.55 + 0.15 * found))), ocr: true, rateGuess: !rk, dateGuess: !date };
}
const TJS_URL = 'vendor/tesseract/tesseract.min.js';
const TJS_DIR = () => new URL('vendor/tesseract/', document.baseURI).href;
function loadTJS() { return new Promise((res, rej) => { if (typeof window !== 'undefined' && window.Tesseract) return res(window.Tesseract); const s = document.createElement('script'); s.src = TJS_URL; s.onload = () => (window.Tesseract ? res(window.Tesseract) : rej(new Error('ocr_load'))); s.onerror = () => rej(new Error('ocr_load')); document.head.appendChild(s); }); }
async function prepImage(file) {
  const img = await new Promise((res, rej) => { const u = URL.createObjectURL(file); const i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => rej(new Error('img')); i.src = u; });
  const k = Math.min(1, 1800 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.35)'; x.drawImage(img, 0, 0, c.width, c.height); return new Promise((res) => c.toBlob((b) => res(b || file), 'image/png'));
}
async function ocrFile(file, onProg) { const T = await loadTJS(); let blob = file; try { blob = await prepImage(file); } catch (e) {} const r = await T.recognize(blob, 'tur', { workerPath: TJS_DIR() + 'worker.min.js', corePath: TJS_DIR(), langPath: TJS_DIR(), logger: (m) => { if (m && m.status === 'recognizing text' && onProg) onProg(m.progress); } }); return { text: r.data.text, conf: r.data.confidence }; }
const _och26 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'ocf' && S.modal && S.modal.type === 'upload' && S.modal.sample) { const sp = S.modal.sample; const k = el.dataset.k; if (k === 'total') { const v = trNum(el.value); if (v > 0) sp.total = v; } else if (k === 'rate') sp.rate = Number(el.value); else sp[k] = el.value; return; }
  if (ch === 'file' && S.modal && S.modal.type === 'upload' && S.modal.step === 'pick') {
    const f = el.files && el.files[0]; if (!f) return;
    if (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name)) { toast('PDF okunamıyor. Fişin fotoğrafını (JPG ya da PNG) yükle.', 'warn'); return; }
    const m0 = { type: 'upload', step: 'reading', ocr: true }; S.modal = m0; renderModal();
    (async () => {
      try {
        const r = await ocrFile(f, (p) => { const x = document.getElementById('oc-prog'); if (x) x.textContent = 'Okunuyor %' + Math.round(p * 100); });
        const p = ocrParse(r.text, r.conf); if (S.modal !== m0) return; if (p.total == null) throw new Error('no_total');
        S.modal = { type: 'upload', step: p.cat ? 'result' : 'ask', sample: p, cat: p.cat };
      } catch (err) { if (S.modal !== m0) return; S.modal = { type: 'upload', step: 'pick', err: err && err.message === 'ocr_load' ? 'Okuma motoru yüklenemedi. İnternet bağlantını kontrol et.' : 'Fişten toplam tutar okunamadı. Daha aydınlık ve düz bir fotoğraf çekmeyi dene.' }; }
      renderModal();
    })();
    return;
  }
  return _och26(e);
};
const renderModalV25 = renderModal;
renderModal = function () {
  renderModalV25(); const m = S.modal; const root = $('#modal-root'); if (!m || m.type !== 'upload' || !root || typeof root.innerHTML !== 'string') return; let h = root.innerHTML;
  if (m.step === 'pick') { h = h.replace('Prototipte okuma sonucu örnektir. Gerçek sürümde fişi yapay zekâ okur.', 'Fotoğraftan okunur (deneysel). Okunan bilgileri kaydetmeden önce kontrol et. Örnek fiş sadece denemek içindir.'); if (m.err) h = h.replace(/(<\/label>)/, '$1<div class="callout warn" style="margin:8px 0">' + ic('alert') + '<div>' + esc(m.err) + '</div></div>'); root.innerHTML = h; }
  else if (m.step === 'reading' && m.ocr) { root.innerHTML = h.replace('Satıcı, tarih, KDV ve toplam çıkarılıyor.', '<span id="oc-prog">Okuma motoru hazırlanıyor</span>. Satıcı, tarih, KDV ve toplam çıkarılıyor.'); }
  else if (m.step === 'result' && m.sample && m.sample.ocr) {
    const s = m.sample; const re = /<dt>Satıcı<\/dt><dd>[\s\S]*?<\/dd><dt>Tarih<\/dt><dd>[\s\S]*?<\/dd><dt>KDV<\/dt><dd[^>]*>[\s\S]*?<\/dd><dt>Toplam<\/dt><dd[^>]*>[\s\S]*?<\/dd>/;
    const fld = `<dt><label for="oc-seller">Satıcı</label></dt><dd><input type="text" id="oc-seller" value="${esc(s.seller)}" data-ch="ocf" data-k="seller"></dd><dt><label for="oc-date">Tarih</label></dt><dd><input type="text" id="oc-date" value="${esc(s.date)}" data-ch="ocf" data-k="date" placeholder="14 Kas">${s.dateGuess ? '<span class="small" style="color:var(--nar)">Tarih okunamadı, kontrol et.</span>' : ''}</dd><dt><label for="oc-rate">KDV</label></dt><dd><select id="oc-rate" data-ch="ocf" data-k="rate">${[0, 1, 8, 10, 20].map((x) => `<option value="${x}"${s.rate === x ? ' selected' : ''}>%${x}</option>`).join('')}</select>${s.rateGuess ? '<span class="small" style="color:var(--nar)">Oran okunamadı, tahmin.</span>' : ''}</dd><dt><label for="oc-total">Toplam (₺)</label></dt><dd><input type="text" inputmode="decimal" id="oc-total" value="${String(s.total).replace('.', ',')}" data-ch="ocf" data-k="total"></dd>`;
    if (re.test(h)) root.innerHTML = h.replace(re, fld);
  }
};
const _save26 = H.savereceipt;
H.savereceipt = () => { const m = S.modal; if (m && m.sample && m.sample.ocr) { const g = (id) => (document.getElementById(id) || {}).value; const sp = m.sample; if (g('oc-seller')) sp.seller = g('oc-seller').trim() || sp.seller; if (g('oc-date')) sp.date = g('oc-date').trim() || sp.date; if (g('oc-rate') != null && g('oc-rate') !== '') sp.rate = Number(g('oc-rate')); const t = trNum(g('oc-total')); if (t > 0) sp.total = t; } return _save26(); };

/* v27: Kasa/POS satış gelen kutusu */
const POS = { token: '', n: 0, err: '', busy: false, at: '', last: 0 };
const posMsg = (e) => { const m = String((e && e.message) || e || ''); return /pos_tokens|sales_inbox|schema cache|relation/i.test(m) ? 'POS tabloları kurulmamış. kaispilot_pos.sql dosyasını Supabase\'de çalıştır.' : m; };
const posCan = () => sbOK() && SBS.user && SBS.biz && canSup();
function posRow(p) {
  if (!p || typeof p !== 'object') return null;
  const g = (...k) => { for (const x of k) if (p[x] != null && p[x] !== '') return p[x]; return null; };
  const prod = String(g('urun', 'product', 'name', 'prod', 'item') || '').trim();
  const qty = Number(String(g('adet', 'qty', 'quantity', 'miktar') == null ? 1 : g('adet', 'qty', 'quantity', 'miktar')).replace(',', '.'));
  const total = Number(String(g('tutar', 'total', 'amount', 'fiyat', 'price') == null ? NaN : g('tutar', 'total', 'amount', 'fiyat', 'price')).replace(',', '.'));
  let d = String(g('tarih', 'date', 'time') || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { const m = d.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/); d = m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : REF_ISO; }
  if (!prod || !(qty > 0) || !isFinite(total) || total < 0) return null;
  return { date: d, prod, qty, total };
}
async function posNewToken() {
  const c = sbClient(); const b = SBS.biz.id; const tk = 'kp_' + Array.from(crypto.getRandomValues(new Uint8Array(18))).map((x) => x.toString(16).padStart(2, '0')).join('');
  const r = await c.from('pos_tokens').upsert({ business_id: b, token: tk }, { onConflict: 'business_id' }); if (r.error) throw r.error; POS.token = tk;
}
async function posPoll(manual) {
  if (!posCan() || POS.busy) return 0; POS.busy = true; let added = 0;
  try {
    const c = sbClient(); const b = SBS.biz.id;
    const t = await c.from('pos_tokens').select('token').eq('business_id', b).maybeSingle(); if (t.error) throw t.error; POS.token = (t.data && t.data.token) || '';
    if (!POS.token) { POS.err = ''; return 0; }
    const r = await c.from('sales_inbox').select('id,payload').eq('business_id', b).eq('imported', false).order('id').limit(500); if (r.error) throw r.error;
    const rows = []; const ids = (r.data || []).map((x) => x.id); (r.data || []).forEach((x) => { const o = posRow(x.payload); if (o) rows.push(o); });
    if (ids.length) {
      if (rows.length) { const imp = importSales(rows, 'Kasa (otomatik)'); added = imp.n; }
      const u = await c.from('sales_inbox').update({ imported: true }).in('id', ids); if (u.error) throw u.error;
      POS.n += ids.length; POS.last = ids.length;
      if (added && !manual) toast('Kasadan ' + added + ' satış geldi.', 'ok');
    }
    POS.err = ''; POS.at = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { POS.err = posMsg(e); } finally { POS.busy = false; }
  if (added && typeof pFlush === 'function') pFlush(); if (manual || added) render(); return added;
}
function posCard() {
  if (!sbOK() || !SBS.user) return `<div class="card stack"><div><h3>Kasa bağlantısı</h3><p class="muted small" style="margin-top:2px">Kasa programından satışların otomatik gelmesi için önce bulut hesabına giriş yapmalısın (Ayarlar).</p></div></div>`;
  if (!posCan()) return '';
  const url = SB_URL + '/rest/v1/rpc/pos_push';
  return `<div class="card stack"><div><h3>Kasa bağlantısı</h3><p class="muted small" style="margin-top:2px">Kasan ya da bir otomasyon aracı (Zapier, Make, n8n) satış gönderince burada otomatik görünür, stok düşer. Hazır bir kasa markası bağlayıcısı yok; kasanın "web kancası" ya da dışa aktarma seçeneği varsa bu adres kullanılır.</p></div>
  ${POS.err ? `<div class="callout warn">${ic('alert')}<div>${esc(POS.err)}</div></div>` : ''}
  ${POS.token ? `<div class="field"><label>Kasa anahtarı</label><input readonly value="${esc(POS.token)}" onclick="this.select()"></div>
  <details><summary class="small" style="cursor:pointer">Gönderme örneği (teknik)</summary><pre class="small" style="white-space:pre-wrap;word-break:break-all;margin-top:8px">POST ${esc(url)}
apikey: ${esc(SB_KEY)}
Content-Type: application/json

{"p_token":"${esc(POS.token)}","p_rows":[{"tarih":"2026-11-14","urun":"Latte","adet":2,"tutar":180}]}</pre></details>
  <p class="small muted">${POS.n ? POS.n + ' satır alındı. ' : ''}${POS.at ? 'Son kontrol ' + esc(POS.at) + '.' : ''} Anahtarı bilen herkes satış ekleyebilir; sızarsa yenile.</p>
  <div class="row wrap"><button class="btn sm sec" data-a="pospoll">Şimdi kontrol et</button><button class="btn sm sec" data-a="posnew">Anahtarı yenile</button></div>` : `<button class="btn" data-a="posnew">Kasa bağlantısı oluştur</button>`}</div>`;
}
H.posnew = async () => { try { await posNewToken(); POS.err = ''; toast('Kasa anahtarı hazır.', 'ok'); } catch (e) { POS.err = posMsg(e); } render(); };
H.pospoll = () => { posPoll(true); };
const viewSatisV27 = viewSatis; viewSatis = function () { const h = viewSatisV27(); const i = h.indexOf('<div class="card stack"><div><h3>Satış dosyası yükle'); return i < 0 ? h : h.slice(0, i) + posCard() + h.slice(i); };
if (typeof setInterval === 'function' && typeof window !== 'undefined' && !window.__noPosTimer) setInterval(() => { if (posCan() && POS.token) posPoll(false); }, 30000);
const sbLoadBizV27 = sbLoadBiz; sbLoadBiz = async function () { await sbLoadBizV27(); POS.token = ''; if (posCan()) posPoll(false); };
/* v28: Kais AI sohbet (Claude, Supabase Edge Function üzerinden) */
const AIC = { msgs: [], busy: false, err: '', draft: '' };
const AI_ROLES = ['patron', 'mudur', 'muhasebeci'];
function aiContext() {
  const r = S.user.role; const mgr = ['patron', 'mudur'].includes(r); const stokR = ['patron', 'mudur', 'calisan'].includes(r); const money = ['patron', 'muhasebeci'].includes(r);
  const c = { isletme: BIZ, tarih: REF_ISO, rol: r }; const t = (f) => { try { return f(); } catch (e) { return undefined; } };
  if (stokR) {
    c.stok = STOCK.slice(0, 60).map((x) => ({ id: x.id, ad: x.name, miktar: x.qty, birim: x.unit, min: x.min, tedarikci: (supById(x.sup) || {}).name || null, birim_maliyet: x.cost || null }));
    c.uyarilar = t(() => notifList().slice(0, 12).map((n) => n.text));
    c.skt_yakin = t(() => sktSoon(5).slice(0, 8).map((l) => { const st = stById(l.sid); return st ? st.name + ' ' + l.qty + ' ' + st.unit + ', ' + l.exp : ''; }).filter(Boolean));
    c.rezervasyon_bugun = RESV.filter((x) => x.date === REF_ISO && x.st !== 'iptal').map((x) => ({ saat: x.time, kisi: x.n }));
  }
  if (mgr || money) {
    c.satis = t(() => { const st = salesStats(); return { ciro_kdv_dahil: Math.round(st.t.total), maliyet: Math.round(st.t.cost), brut_kar: Math.round(st.kar), urunler: st.list.slice(0, 10).map((o) => ({ ad: o.name, adet: o.qty, net_ciro: Math.round(o.net), maliyet: o.rc ? Math.round(o.cost) : null })) }; });
    c.recete_marji = t(() => costRows().slice(0, 15).map((o) => ({ urun: o.name, maliyet: Math.round(o.cost * 100) / 100, marj_yuzde: o.margin == null ? null : Math.round(o.margin * 100), fiyat_zammi_yuzde: Math.round(o.drift) })));
  }
  if (mgr) c.siparisler = t(() => ORDERS.slice(0, 15).map((o) => ({ durum: o.status, tedarikci: (supById(o.supId) || {}).name })));
  if (money) c.defter = t(() => ({ kayit_sayisi: LEDGER.length, toplam: Math.round(LEDGER.reduce((a, x) => a + (x.total || 0), 0)), son: LEDGER.slice(-25).map((x) => ({ tarih: x.date, aciklama: x.desc, hesap: x.acc, tutar: x.total })) }));
  return c;
}

const AI_Q = { patron: ['Bu hafta neye dikkat etmeliyim?', 'Kârlılığı en düşük ürünler hangileri?', 'Bugün hangi stokları sipariş etmeliyim?'], mudur: ['Bugün hangi stokları sipariş etmeliyim?', 'Yakında bozulacak ürün var mı?', 'Bugünkü rezervasyonları özetle'], muhasebeci: ['Son kayıtlarda dikkat çeken bir şey var mı?', 'Gider dağılımını özetle', 'Bu ayki brüt kâr nasıl?'], calisan: ['Hangi ürünler azaldı?', 'Bugün rezervasyon var mı?', 'Yakında bozulacak ürün var mı?'] };
function viewKaisAI() {
  const r = S.user.role; const ok = sbOK() && SBS.user && SBS.biz;
  return `<div class="stack-lg"><div><h2>Kais AI</h2><p class="muted small" style="margin-top:4px">İşletmenin stok, satış ve kayıtlarına bakarak soruları yanıtlar. Rolünün göremediği veriyi görmez.</p></div>
  ${AIC.mode === 'sayim' ? `<div class="callout info">${ic('camera')}<div><b>Fotoğrafla sayım</b><p style="margin-top:2px">Aşağıdan rafın fotoğrafını ekleyip gönder. Net göremediği ürünü saymaz.</p></div></div>` : ''}
  ${!ok ? `<div class="callout warn">${ic('alert')}<div>Kais AI için bulut hesabıyla giriş yapmış olman gerekir.</div></div>` : ''}
  <div class="stack">${AIC.msgs.length ? AIC.msgs.map((m, i) => `<div class="card" style="${m.role === 'user' ? 'margin-left:32px' : 'margin-right:32px'}"><div class="small muted">${m.role === 'user' ? 'Sen' : 'Kais AI'}</div><div style="white-space:pre-wrap;margin-top:4px">${esc(m.content).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/^#{1,4}\s+/gm, '')}</div>${m.att && m.att.length ? `<div class="small muted" style="margin-top:6px">Ek: ${m.att.map(esc).join(', ')}</div>` : ''}</div>${m.acts && m.acts.length ? m.acts.map((a, j) => aiActCard(a, i, j)).join('') : ''}`).join('') : `<div class="stack">${(AI_Q[r] || AI_Q.calisan).map((q) => `<button class="btn sec" style="justify-content:flex-start;text-align:left" data-a="aiq" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`}
  ${AIC.busy ? `<div class="card muted small">Kais AI düşünüyor…</div>` : ''}${AIC.err ? `<div class="callout warn">${ic('alert')}<div>${esc(AIC.err)}</div></div>` : ''}<span id="ai-end"></span></div>
  ${aiAttachBar()}<div class="field"><label for="ai-q">Sorun</label><textarea id="ai-q" style="min-height:70px" placeholder="Örnek: Bu ay en çok hangi üründen kazandım?">${esc(AIC.draft)}</textarea></div>
  <div class="row wrap"><button class="btn grow" data-a="aisend" ${ok && !AIC.busy ? '' : 'disabled'}>Gönder</button>${AIC.msgs.length ? '<button class="btn sec" data-a="aiclear">Yeni sohbet</button>' : ''}</div>
  <p class="small muted">Yanıtlar yalnızca uygulamadaki veriye dayanır ve hata içerebilir. Vergi ve hukuk konularında muhasebecine danış.</p></div>`;
}
H.aisend = () => { const el = document.getElementById('ai-q'); const t = ((el && el.value) || '').trim(); if (!t || AIC.busy) return; AIC.draft = ''; aiAsk(t); };
H.aiq = (el) => { if (!AIC.busy) aiAsk(el.dataset.q); };
H.aiclear = () => { AIC.msgs = []; AIC.err = ''; AIC.draft = ''; render(); };
const viewHTMLV28 = viewHTML; viewHTML = function () { if (S.view === 'kaisai' && S.user && AI_ROLES.includes(S.user.role)) return viewKaisAI(); return viewHTMLV28(); };
TITLES.kaisai = 'Kais AI'; ICONS.sparkle = ICONS.sparkle || '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>';
AI_ROLES.forEach((r) => { if (NAV[r] && !NAV[r].some((x) => x[0] === 'kaisai')) NAV[r].push(['kaisai', 'Kais AI', 'sparkle', 'more']); });
/* v29: Kais AI dosya okuma + onaylı işlemler (fatura kaydet, Excel indir) */
AIC.files = [];
const aiB64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.onerror = () => rej(new Error('read')); fr.readAsDataURL(blob); });
async function aiPrepFile(f) {
  const isPdf = /pdf/i.test(f.type) || /\.pdf$/i.test(f.name);
  if (isPdf) { if (f.size > 4.5e6) throw new Error('PDF en fazla 4,5 MB olabilir.'); return { name: f.name, type: 'pdf', media_type: 'application/pdf', data: await aiB64(f) }; }
  if (!/^image\//.test(f.type)) throw new Error('Yalnızca fotoğraf (JPG, PNG) ya da PDF yükleyebilirsin.');
  const img = await new Promise((res, rej) => { const u = URL.createObjectURL(f); const i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => rej(new Error('Fotoğraf açılamadı.')); i.src = u; });
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const b = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85)); return { name: f.name, type: 'image', media_type: 'image/jpeg', data: await aiB64(b) };
}
const _och29 = onChange;
onChange = function (e) {
  const el = e.target; if (el && el.dataset && el.dataset.ch === 'kfile') {
    const fl = Array.from(el.files || []).slice(0, 3 - AIC.files.length); if (!fl.length) return;
    Promise.all(fl.map(aiPrepFile)).then((r) => { AIC.files = AIC.files.concat(r).slice(0, 3); AIC.err = ''; render(); }, (er) => { AIC.err = er.message || 'Dosya okunamadı.'; render(); });
    try { el.value = ''; } catch (x) {} return;
  }
  return _och29(e);
};
async function aiAsk(text) {
  const mode = AIC.mode; AIC.mode = null; const c = sbClient(); AIC.err = ''; const atts = AIC.files.slice(); AIC.files = [];
  AIC.msgs.push({ role: 'user', content: text, att: atts.map((a) => a.name) }); AIC.busy = true; render();
  try {
    if (!c || !SBS.user || !SBS.biz) throw new Error('Kais AI için bulut hesabına giriş yapmalısın.');
    const r = await c.functions.invoke('kais-ai', { body: { business_id: SBS.biz.id, mode: mode || undefined, messages: AIC.msgs.slice(-12).map((m) => ({ role: m.role, content: m.content })), context: aiContext(), attachments: atts.map((a) => ({ type: a.type, media_type: a.media_type, data: a.data })) } });
    if (r.error) { let m = ''; try { m = (await r.error.context.json()).error; } catch (e) {} throw new Error(m || (/not found|404|FunctionsFetch/i.test(String(r.error.message)) ? 'Kais AI sunucusu kurulmamış. Kurulum adımlarını uygula.' : 'Kais AI şu an yanıt vermedi.')); }
    if (r.data && r.data.error) throw new Error(r.data.error);
    const acts = ((r.data && r.data.actions) || []).filter((a) => a && ['fatura_kaydet', 'excel_indir', 'siparis_olustur', 'stok_guncelle'].includes(a.type)).map((a) => ({ type: a.type, args: a.args || {}, st: 'open' }));
    AIC.msgs.push({ role: 'assistant', content: (r.data && r.data.reply) || 'Yanıt gelmedi.', acts });
  } catch (e) { AIC.err = e.message || 'Hata'; AIC.msgs.pop(); AIC.draft = text; AIC.files = atts; AIC.mode = mode || null; }
  AIC.busy = false; render(); const el = document.getElementById('ai-end'); if (el && el.scrollIntoView) el.scrollIntoView();
}
function aiAttachBar() {
  return `<div class="field"><label>Fatura ya da belge ekle</label><div class="row wrap">${AIC.files.map((f, k) => `<span class="chip">${esc(f.name)} <button class="btn sm sec" data-a="aifrm" data-k="${k}" style="padding:0 6px">×</button></span>`).join('')}${AIC.files.length < 3 ? `<label class="btn sm sec" for="ai-file" style="cursor:pointer">${ic('camera', 16)} Fotoğraf / PDF seç</label><input id="ai-file" type="file" accept="image/*,application/pdf" multiple data-ch="kfile" style="position:absolute;opacity:0;width:1px;height:1px">` : ''}</div></div>`;
}
const aiStock = (x) => STOCK.find((t) => t.id === x.stok_id) || STOCK.find((t) => t.name.toLowerCase() === String(x.stok_ad || x.ad || '').toLowerCase());
function aiOrderLines(args) {
  const plan = stockPlan();
  return (Array.isArray(args.urunler) ? args.urunler : []).slice(0, 30).map((x) => {
    const st = aiStock(x); const qty = Number(x.miktar); if (!st || !(qty > 0)) return { ok: false, name: String(x.stok_id || x.ad || '?') };
    const p = plan.find((y) => y.st.id === st.id); const sup = p && p.pick ? p.pick : supById(st.sup); const price = p && p.pick ? p.price : st.cost || 0;
    return sup ? { ok: true, st, sup, qty, price } : { ok: false, name: st.name + ' (tedarikçi yok)' };
  });
}
function aiStockOps(args) {
  return (Array.isArray(args.islemler) ? args.islemler : []).slice(0, 30).map((x) => {
    const st = aiStock(x); const m = Number(x.miktar); if (!st || !isFinite(m) || m < 0) return { ok: false, name: String(x.stok_id || x.ad || '?') };
    const tur = x.tur === 'say' ? 'say' : x.tur === 'dus' ? 'dus' : 'ekle'; const to = r3(Math.max(0, tur === 'say' ? m : tur === 'dus' ? st.qty - m : st.qty + m));
    return { ok: true, st, to, why: (tur === 'say' ? 'Sayım: ' : tur === 'dus' ? 'Düş: ' : 'Ekle: ') + (x.neden || 'Kais AI'), neden: x.neden || 'Kais AI', tur };
  });
}
function aiActCard(a, i, j) {
  if (a.st === 'done') return `<div class="callout info">${ic('info')}<div>${esc(a.msg || 'Tamamlandı.')}</div></div>`;
  if (a.st === 'skip') return `<div class="small muted">Vazgeçildi.</div>`;
  if (a.type === 'excel_indir') return `<div class="card stack"><div><b>Excel dosyası</b><div class="small muted">Giderler, gelirler, bordro girdisi ve diğer sayfalar.</div></div><div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">İndir</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
  if (a.type === 'siparis_olustur') {
    const rs = aiOrderLines(a.args); const bad = rs.filter((x) => !x.ok);
    if (!rs.some((x) => x.ok)) return `<div class="callout warn">${ic('alert')}<div>Sipariş için eşleşen ürün ya da tedarikçi bulunamadı.</div></div>`;
    const groups = {}; rs.forEach((x, k) => { if (x.ok) (groups[x.sup.id] = groups[x.sup.id] || { sup: x.sup, rows: [] }).rows.push([x, k]); });
    return `<div class="card stack"><div><b>Sipariş önerisi</b><div class="small muted">Miktarları düzeltebilirsin. Onaylayınca sipariş kaydedilir ve tedarikçiye gidecek mesaj kopyalanır.</div></div>
    ${Object.values(groups).map((gr) => `<div><b style="font-weight:600">${esc(gr.sup.name)}</b>${gr.rows.map(([x, k]) => `<div class="logline" style="padding:8px 0"><span>${esc(x.st.name)}<span class="small muted" style="display:block">${fq(x.price)} ₺ / ${esc(x.st.unit)}</span></span><span class="row" style="gap:6px"><input id="aa-${i}-${j}-q${k}" type="text" inputmode="decimal" style="width:70px;text-align:right" value="${esc(String(x.qty).replace('.', ','))}"><span class="small muted">${esc(x.st.unit)}</span></span></div>`).join('')}</div>`).join('')}
    ${bad.length ? `<div class="small muted">Eşleşmeyen: ${bad.map((x) => esc(x.name)).join(', ')}</div>` : ''}
    <div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Siparişi kaydet</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
  }
  if (a.type === 'stok_guncelle') {
    const rs = aiStockOps(a.args); if (!rs.some((x) => x.ok)) return `<div class="callout warn">${ic('alert')}<div>Güncellenecek ürün bulunamadı.</div></div>`;
    return `<div class="card stack"><div><b>Stok güncelleme önerisi</b><div class="small muted">Yeni miktarı kontrol et, sonra uygula.</div></div>
    ${rs.map((x, k) => x.ok ? `<div class="logline" style="padding:8px 0"><span>${esc(x.st.name)}<span class="small muted" style="display:block">${esc(x.why)} · şu an ${q1(x.st.qty)} ${esc(x.st.unit)}</span></span><span class="row" style="gap:6px"><span class="small muted">→</span><input id="aa-${i}-${j}-n${k}" type="text" inputmode="decimal" style="width:70px;text-align:right" value="${esc(String(x.to).replace('.', ','))}"><span class="small muted">${esc(x.st.unit)}</span></span></div>` : `<div class="small muted">Eşleşmedi: ${esc(x.name)}</div>`).join('')}
    <div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Uygula</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
  }
  const g = a.args; const id = (k) => `aa-${i}-${j}-${k}`;
  return `<div class="card stack"><div><b>Gider kaydı önerisi</b><div class="small muted">Kontrol et, gerekirse düzelt, sonra kaydet.</div></div>
  <div class="field"><label for="${id('s')}">Satıcı</label><input id="${id('s')}" type="text" value="${esc(g.satici || '')}"></div>
  <div class="row wrap"><div class="field grow"><label for="${id('d')}">Tarih (GG.AA.YYYY)</label><input id="${id('d')}" type="text" value="${esc(g.tarih ? g.tarih.slice(8, 10) + '.' + g.tarih.slice(5, 7) + '.' + g.tarih.slice(0, 4) : '')}"></div>
  <div class="field grow"><label for="${id('t')}">Toplam (KDV dahil)</label><input id="${id('t')}" type="text" inputmode="decimal" value="${esc(String(g.toplam == null ? '' : g.toplam).replace('.', ','))}"></div></div>
  <div class="row wrap"><div class="field grow"><label for="${id('r')}">KDV %</label><select id="${id('r')}">${[0, 1, 10, 20].map((x) => `<option value="${x}" ${Number(g.kdv_orani) === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="field grow"><label for="${id('c')}">Kategori</label><select id="${id('c')}">${CATS.map((x) => `<option ${g.kategori === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div></div>
  ${a.dup ? `<div class="callout warn">${ic('alert')}<div>Aynı satıcı ve tutarda bir kayıt zaten var. Yine de eklemek için tekrar Kaydet'e bas.</div></div>` : ''}
  <div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Kaydet</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
}
function saveBlob(name, blob) {
  if (DL) return DL.save({ filename: name, data: blob });
  const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return Promise.resolve();
}
H.aiskip = (el) => { const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (a) { a.st = 'skip'; render(); } };
H.aiact = async (el) => {
  const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (!a || a.st !== 'open') return;
  if (a.type === 'excel_indir') {
    if (!['patron', 'muhasebeci'].includes(S.user.role)) { toast('Excel indirme yetkin yok.', 'warn'); return; }
    try { await saveBlob('kaispilot-muhasebe-' + REF_ISO.slice(0, 7) + '.xlsx', new Blob(buildXlsx(), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.st = 'done'; a.msg = 'Excel dosyası hazırlandı.'; } catch (e) { toast('Excel indirilemedi.', 'warn'); } render(); return;
  }
  if (a.type === 'siparis_olustur') {
    if (!['patron', 'mudur'].includes(S.user.role)) { toast('Sipariş oluşturma yetkin yok.', 'warn'); return; }
    if (locked()) return;
    const rs = aiOrderLines(a.args); const groups = {};
    for (let k = 0; k < rs.length; k++) { const x = rs[k]; if (!x.ok) continue; const q = trNum((document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-q${k}`) || {}).value); if (!(q > 0)) continue; (groups[x.sup.id] = groups[x.sup.id] || { sup: x.sup, lines: [] }).lines.push({ sid: x.st.id, name: x.st.name, unit: x.st.unit, qty: q, price: x.price }); }
    const gl = Object.values(groups); if (!gl.length) { toast('Miktarları kontrol et.', 'warn'); return; }
    const msgs = []; gl.forEach((gr) => { const total = Math.round(gr.lines.reduce((t, l) => t + l.qty * l.price, 0) * 100) / 100; const ord = { id: 'o' + (++seq), supId: gr.sup.id, date: isoShort(REF_ISO), iso: REF_ISO, lines: gr.lines, total, status: 'gonderildi', msg: orderMsg(gr.sup, gr.lines) }; ORDERS.unshift(ord); auditAdd({ type: 'ord', text: 'Sipariş kaydedildi (Kais AI): ' + gr.sup.name + ', ' + fmt(total) }); msgs.push(ord.msg); });
    a.st = 'done'; a.msg = gl.length + ' sipariş kaydedildi (' + gl.map((g) => g.sup.name).join(', ') + '). Mesajlar Satın alma sayfasından kopyalanıp tedarikçiye gönderilebilir.';
    render(); cpy(msgs.join('\n\n---\n\n'), 'Sipariş kaydedildi, mesaj kopyalandı.'); return;
  }
  if (a.type === 'stok_guncelle') {
    if (!['patron', 'mudur', 'calisan'].includes(S.user.role)) { toast('Stok güncelleme yetkin yok.', 'warn'); return; }
    if (locked()) return;
    const rs = aiStockOps(a.args); let n = 0;
    rs.forEach((x, k) => { if (!x.ok) return; const raw = (document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-n${k}`) || {}).value; if (String(raw == null ? '' : raw).trim() === '') return; const v = trNum(raw); if (!(v >= 0) || v === x.st.qty) return; const d = r3(v - x.st.qty); x.st.qty = r3(v); mv(x.st, d, 'elle', 'Kais AI: ' + x.neden); n++; });
    if (!n) { toast('Değişen miktar yok.', 'warn'); return; }
    a.st = 'done'; a.msg = n + ' üründe stok güncellendi.'; render(); toast('Stok güncellendi.', 'ok'); return;
  }
  if (locked()) return;
  const gv = (k) => (document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-${k}`) || {}).value;
  const seller = (gv('s') || '').trim(); const total = trNum(gv('t')); const rate = Number(gv('r')); const cat = gv('c') || 'Diğer';
  const dm = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec((gv('d') || '').trim());
  if (!seller || !(total > 0) || !dm) { toast('Satıcı, tarih (GG.AA.YYYY) ve toplam tutarı kontrol et.', 'warn'); return; }
  const dateT = String(parseInt(dm[1], 10)).padStart(2, '0') + ' ' + MON[parseInt(dm[2], 10) - 1];
  if (!MON[parseInt(dm[2], 10) - 1]) { toast('Tarihteki ay geçersiz.', 'warn'); return; }
  if (!a.dup && RECEIPTS.some((f) => f.seller === seller && Math.abs(f.total - total) < 0.01 && f.date === dateT)) { a.dup = true; render(); return; }
  const isEmp = S.user.role === 'calisan';
  RECEIPTS.push({ id: 'f' + ++seq, seller, date: dateT, total, rate, cat, status: isEmp ? 'bekliyor' : 'musavirde', by: S.user.id, bank: null, at: hhmm(new Date()), items: [], src: 'Kais AI' });
  a.st = 'done'; a.msg = isEmp ? seller + ' faturası işverene onay için gönderildi.' : seller + ' faturası gider olarak kaydedildi ve muhasebeciye gitti.';
  render(); toast('Gider kaydedildi.', 'ok');
};
H.aifrm = (el) => { AIC.files.splice(+el.dataset.k, 1); render(); };
H.aisend = () => { const el = document.getElementById('ai-q'); let t = ((el && el.value) || '').trim(); if (AIC.busy) return; if (AIC.mode === 'sayim' && !AIC.files.length) { toast('Önce raf fotoğrafı ekle.', 'warn'); return; } if (!t && AIC.files.length) t = AIC.mode === 'sayim' ? 'Bu fotoğraftaki ürünleri say ve sayım olarak güncelle.' : 'Bu belgeyi incele ve gider olarak kaydet.'; if (!t) return; AIC.draft = ''; aiAsk(t); };
/* v30: Claude ile fiş okuma, fotoğrafla sayım, sözleşme okuma, belge bilgisi ayıklama */
const aiReady = () => !S.noAI && !!(sbOK() && SBS.user && SBS.biz);
async function aiCall(mode, text, atts, ctx) {
  const c = sbClient(); if (!c || !SBS.user || !SBS.biz) throw new Error('nocloud');
  const r = await c.functions.invoke('kais-ai', { body: { business_id: SBS.biz.id, mode, messages: [{ role: 'user', content: text }], context: ctx || {}, attachments: (atts || []).map((a) => ({ type: a.type, media_type: a.media_type, data: a.data })) } });
  if (r.error) { let m = ''; try { m = (await r.error.context.json()).error; } catch (e) {} const x = new Error(m || 'ai_fail'); x.kind = m ? 'user' : (/not found|404|FunctionsFetch/i.test(String(r.error.message)) ? 'nofn' : 'fail'); throw x; }
  if (r.data && r.data.error) { const x = new Error(r.data.error); x.kind = 'user'; throw x; }
  return (r.data && (r.data.data || r.data)) || {};
}
const _och30 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'file' && S.modal && S.modal.type === 'upload' && S.modal.step === 'pick' && aiReady()) {
    const f = el.files && el.files[0]; if (!f) return;
    const m0 = { type: 'upload', step: 'reading', ocr: true, claude: true }; S.modal = m0; renderModal();
    (async () => {
      try {
        const a = await aiPrepFile(f); const d = await aiCall('fis', 'Bu belgeyi oku.', [a]); if (S.modal !== m0) return;
        const total = Number(d.toplam); if (!(total > 0)) { const x = new Error('Belgeden toplam tutar okunamadı. Daha net bir fotoğraf dene.'); x.kind = 'user'; throw x; }
        const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d.tarih || ''));
        const date = dm ? dm[3] + ' ' + MON[parseInt(dm[2], 10) - 1] : String(new Date().getDate()).padStart(2, '0') + ' ' + MON[new Date().getMonth()];
        const bank = (ROWS.find((r) => r.kind === 'gider' && Math.abs(Math.abs(r.amt) - total) < 0.01) || {}).id || null;
        const cat = CATS.includes(d.kategori) ? d.kategori : 'Diğer'; const rate = [0, 1, 10, 20].includes(Number(d.kdv_orani)) ? Number(d.kdv_orani) : 10;
        const sample = { seller: String(d.satici || 'Satıcı okunamadı'), date, total, rate, cat, bank, conf: d.guven === 'yuksek' ? 0.95 : d.guven === 'dusuk' ? 0.55 : 0.8, ocr: true, rateGuess: false, dateGuess: !dm, ai: true };
        S.modal = { type: 'upload', step: 'result', sample, cat };
      } catch (err) {
        if (S.modal !== m0) return;
        const img = !/pdf/i.test(f.type) && !/\.pdf$/i.test(f.name);
        if (img && err && err.kind !== 'user') { toast('Yapay zekâ okuyamadı, yedek okuma deneniyor.', 'warn'); S.modal = { type: 'upload', step: 'pick' }; S.noAI = true; try { onChange({ target: { dataset: { ch: 'file' }, files: [f] } }); } finally { S.noAI = false; } return; }
        S.modal = { type: 'upload', step: 'pick', err: err && err.kind === 'user' ? err.message : 'Belge okunamadı. Daha net bir fotoğraf ya da PDF dene.' };
      }
      renderModal();
    })();
    return;
  }
  if (ch === 'aifile' && S.modal && S.modal.type === 'ai' && aiReady()) {
    const f = el.files && el.files[0]; const m0 = S.modal; const r = _och30(e);
    if (f) aiPrepFile(f).then((a) => { if (S.modal === m0) m0.att = a; }, (er) => { toast(er.message || 'Dosya okunamadı.', 'warn'); });
    return r;
  }
  return _och30(e);
};
const renderModalV30 = renderModal;
renderModal = function () {
  renderModalV30(); const m = S.modal; const root = $('#modal-root'); if (!m || !root || typeof root.innerHTML !== 'string') return;
  if (m.type === 'upload' && m.step === 'pick' && aiReady()) root.innerHTML = root.innerHTML.replace('Fotoğraftan okunur (deneysel). Okunan bilgileri kaydetmeden önce kontrol et. Örnek fiş sadece denemek içindir.', 'Fiş ya da fatura yapay zekâ ile okunur (fotoğraf veya PDF). Kaydetmeden önce bilgileri kontrol et.');
  if (m.type === 'upload' && m.step === 'reading' && m.claude) root.innerHTML = root.innerHTML.replace('<span id="oc-prog">Okuma motoru hazırlanıyor</span>.', 'Kais AI okuyor.');
  if (m.type === 'ai') root.innerHTML = root.innerHTML.replace('Prototipte okuma sonucu örnektir. Gerçek sürümde sözleşme görüntüsünden okunur ve her alanı sen onaylarsın.', aiReady() ? 'Sözleşme yapay zekâ ile okunur. Kaydetmeden önce her alanı kontrol et.' : 'Bulut hesabıyla giriş yapınca sözleşme gerçekten okunur. Şimdilik örnek sonuç gösterilir.').replace('Prototipte okuma sonucu örnektir. Hukuki değerleri iş hukukçusu ya da muhasebeciyle teyit et.', 'Hukuki değerleri iş hukukçusu ya da muhasebeciyle teyit et.');
};
const aiExtractV29 = aiExtract;
aiExtract = function (m) { const x = aiExtractV29(m); const a = m.ai; if (!a) return x; if (a.maas > 0) x.salary = a.maas; if (/^\d{4}-\d{2}-\d{2}$/.test(a.ise_giris || '')) x.hire = a.ise_giris; if (a.haftalik_saat > 0) x.hours = a.haftalik_saat; if (a.deneme_ay != null && a.deneme_ay !== '' && Number(a.deneme_ay) >= 0) x.trial = Number(a.deneme_ay); if (a.gorev) x.pos = a.gorev; return x; };
const _aigo30 = H.aigo;
H.aigo = () => {
  aiSnap(); const m = S.modal;
  if (!aiReady() || !m.file || !m.att) return _aigo30();
  const t = ' ' + norm(m.text) + ' '; const m0 = m; m.step = 'reading'; renderModal();
  aiCall('sozlesme', m.text || 'Bu iş sözleşmesini oku.', [m.att]).then((d) => {
    if (S.modal !== m0) return; m0.ai = d;
    m0.stype = d.maas_turu === 'net' ? 'net' : d.maas_turu === 'brut' ? 'brut' : (/ brüt | brut /.test(t) ? 'brut' : / net /.test(t) ? 'net' : null);
    const who = aiWho(d.calisan_adi || '') || aiWho(m0.text) || m0.uid;
    if (!who) { m0.step = 'who'; renderModal(); return; }
    m0.uid = who; m0.step = m0.stype ? 'result' : 'ask'; renderModal();
  }, (er) => { if (S.modal !== m0) return; m0.step = 'input'; m0.att = null; m0.file = false; toast(er && er.kind === 'nofn' ? 'Kais AI sunucusu güncel değil. Fonksiyonu güncelle.' : (er && er.kind === 'user' ? er.message : 'Sözleşme okunamadı. Daha net bir fotoğraf dene.'), 'warn'); renderModal(); });
};
const _aiwho30 = H.aiwho;
H.aiwho = (el) => { const m = S.modal; if (m && m.ai) { m.uid = el.dataset.id; m.step = m.stype ? 'result' : 'ask'; renderModal(); return; } return _aiwho30(el); };
const _aisave30 = H.aisave;
H.aisave = () => {
  const m = S.modal; const a = m && m.ai;
  if (a && m.uid && PROFILES[m.uid]) { const p = PROFILES[m.uid]; const y = aiExtract(m); p.salary = y.salary; p.hire = y.hire; p.hours = y.hours; p.trial = y.trial; }
  return _aisave30();
};
const _dfgo30 = H.dfgo;
H.dfgo = () => {
  const kind = (document.getElementById('df-kind') || {}).value; const text = ((document.getElementById('df-text') || {}).value || '').trim();
  if (kind !== 'is' || !aiReady() || text.length < 4) return _dfgo30();
  const fail = (e) => { S.modal = { type: 'df', step: 'input', text, err: e }; renderModal(); };
  const done = (d) => { if (!d.name) return fail('Çalışanın adını yaz.'); S.modal = { type: 'df', step: 'result', kind, name: d.name, warn: d.warn, body: contractText(d) }; renderModal(); };
  S.modal = { type: 'df', step: 'wait', text }; renderModal();
  aiCall('belge', text, []).then((x) => {
    const warn = []; const name = String(x.ad_soyad || '').trim();
    const pos = String(x.gorev || '').trim(); const hire = /^\d{4}-\d{2}-\d{2}$/.test(x.baslangic || '') ? x.baslangic : ''; const salary = Number(x.maas) > 0 ? Number(x.maas) : 0;
    const stype = x.maas_turu === 'brut' ? 'brut' : 'net'; const hours = Number(x.haftalik_saat) > 0 ? Number(x.haftalik_saat) : 45; const trial = x.deneme_ay != null && x.deneme_ay !== '' && Number(x.deneme_ay) >= 0 ? Number(x.deneme_ay) : 2;
    if (!pos) warn.push('Görev yazılmamış, boş bıraktım.'); if (!hire) warn.push('Başlangıç tarihi yazılmamış, boş bıraktım.');
    if (!salary) warn.push('Maaş yazılmamış, boş bıraktım.'); else if (x.maas_turu !== 'net' && x.maas_turu !== 'brut') warn.push('Maaşın net mi brüt mü olduğu yazılmamış, net varsaydım. Kontrol et.');
    if (!(Number(x.haftalik_saat) > 0)) warn.push('Haftalık saat yazılmamış, 45 saat yazdım.'); if (x.deneme_ay == null || x.deneme_ay === '') warn.push('Deneme süresi yazılmamış, 2 ay yazdım.');
    done({ name, pos, hire, salary, stype, hours, trial, payday: 30, warn });
  }, (er) => { if (er && er.kind === 'user') return fail(er.message); done(dfParse(text)); });
};
const dfModalV30 = dfModal; dfModal = function (m) { return m.step === 'wait' ? sheet('Taslak hazırlanıyor', '<div class="spin" role="status" aria-label="Hazırlanıyor"></div><p class="muted" style="text-align:center">Kais AI bilgileri okuyor.</p>') : dfModalV30(m); };
const stokSayimV30 = stokSayim;
stokSayim = function () {
  const h = stokSayimV30(); if (!['patron', 'mudur', 'calisan'].includes(S.user.role) || !aiReady()) return h;
  const card = `<div class="card stack"><div><h3>Fotoğrafla say</h3><p class="muted small" style="margin-top:2px">Rafın ya da deponun fotoğrafını çek. Kais AI gördüğü ürünleri sayıp sana onay kartı çıkarır. Emin olmadıklarını eklemez.</p></div><button class="btn sec" data-a="cntphoto">${ic('camera', 18)} Fotoğraf ekle</button></div>`;
  const i = h.indexOf('<div class="card stack">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i);
};
H.cntphoto = () => { AIC.mode = 'sayim'; AIC.draft = ''; AIC.err = ''; S.view = 'kaisai'; render(); };
/* v31: yedekleme / geri yükleme, xlsx içe aktarma */
const BK = { list: [], busy: false, err: '', conf: null, fileSnap: '', at: '' };
const bkCan = () => !!(sbOK() && SBS.user && SBS.biz && ID.active && ID.active.role === 'patron');
const bkMsg = (e) => { const m = String((e && e.message) || e || ''); return /backups|schema cache|relation/i.test(m) ? 'Yedek tablosu kurulmamış. kaispilot_yedek.sql dosyasını Supabase\'de çalıştır.' : m || 'Yedekleme hatası.'; };
const bkDay = (iso) => { try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(iso || ''); } };
async function bkLoad() {
  if (!bkCan()) return; const c = sbClient();
  const r = await c.from('backups').select('id,created_at,kind,by_name,size').eq('business_id', SBS.biz.id).order('created_at', { ascending: false }).limit(30);
  if (r.error) throw r.error; BK.list = r.data || [];
}
async function bkMake(kind) {
  const c = sbClient(); const snap = pSnap();
  const r = await c.from('backups').insert({ business_id: SBS.biz.id, kind, by_name: (S.user && S.user.name) || '', size: snap.length, snap }); if (r.error) throw r.error;
  await bkLoad();
  const old = BK.list.slice(20).map((x) => x.id); if (old.length) await c.from('backups').delete().in('id', old);
  if (old.length) BK.list = BK.list.slice(0, 20);
}
async function bkAuto() {
  if (!bkCan() || BK.busy) return; BK.busy = true;
  try { await bkLoad(); const today = new Date().toDateString(); const last = BK.list.find((x) => x.kind === 'gunluk'); if (!last || new Date(last.created_at).toDateString() !== today) { await bkMake('gunluk'); BK.at = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); } BK.err = ''; }
  catch (e) { BK.err = bkMsg(e); } finally { BK.busy = false; }
}
function bkApply(snap) {
  const ok = pApply(snap); if (!ok) return false;
  if (typeof pFlush === 'function') pFlush(); return true;
}
function bkCard() {
  if (!bkCan()) return '';
  const kn = { gunluk: 'Günlük', manuel: 'Elle alındı', 'geri-yukleme-oncesi': 'Geri yüklemeden önce' };
  return `<div class="card stack"><div><h3>Yedekleme</h3><p class="muted small" style="margin-top:2px">Verin günde bir kez otomatik yedeklenir. Yanlışlıkla sildiysen ya da bozulduysa bir yedeği geri yükleyebilirsin. Son 20 yedek tutulur.</p></div>
  ${BK.err ? `<div class="callout warn">${ic('alert')}<div>${esc(BK.err)}</div></div>` : ''}
  ${BK.conf ? `<div class="callout warn">${ic('alert')}<div><b>Emin misin?</b><p style="margin-top:2px">Şu anki veri ${BK.conf === 'file' ? 'dosyadaki' : 'seçtiğin yedekteki'} veriyle değiştirilecek. Önce şimdiki halin ayrıca yedeklenir.</p></div></div>
  <div class="row wrap"><button class="btn sm" data-a="bkyes">Evet, geri yükle</button><button class="btn sm sec" data-a="bkno">Vazgeç</button></div>` : ''}
  ${BK.list.length ? `<div class="card flush">${BK.list.slice(0, 8).map((b) => `<div class="logline" style="padding:10px 14px"><span>${esc(bkDay(b.created_at))}<span class="small muted" style="display:block">${esc(kn[b.kind] || b.kind)}${b.by_name ? ' · ' + esc(b.by_name) : ''}${b.size ? ' · ' + Math.round(b.size / 1024) + ' KB' : ''}</span></span><button class="btn sm sec" data-a="bkrestore" data-id="${b.id}">Geri yükle</button></div>`).join('')}</div>` : '<p class="small muted">Henüz yedek yok.</p>'}
  <div class="row wrap"><button class="btn sm" data-a="bkmake" ${BK.busy ? 'disabled' : ''}>Şimdi yedekle</button><button class="btn sm sec" data-a="bkexp">Bilgisayara indir</button><label class="btn sm sec" for="bk-up" style="cursor:pointer">Dosyadan yükle</label><input id="bk-up" type="file" accept=".json,application/json" data-ch="bkfile" style="position:absolute;opacity:0;width:1px;height:1px"></div></div>`;
}
const viewAyarlarV31 = viewAyarlar; viewAyarlar = function () { const h = viewAyarlarV31(); const c = bkCard(); const i = h.lastIndexOf('</div>'); return c && i > 0 ? h.slice(0, i) + c + h.slice(i) : h; };
H.bkmake = async () => { BK.busy = true; BK.err = ''; render(); try { await bkMake('manuel'); toast('Yedek alındı.', 'ok'); } catch (e) { BK.err = bkMsg(e); } BK.busy = false; render(); };
H.bkrestore = (el) => { BK.conf = String(el.dataset.id); BK.fileSnap = ''; render(); };
H.bkno = () => { BK.conf = null; BK.fileSnap = ''; render(); };
H.bkyes = async () => {
  if (!BK.conf || !bkCan()) return; const id = BK.conf; BK.busy = true; BK.err = ''; render();
  try {
    let snap = BK.fileSnap;
    if (id !== 'file') { const r = await sbClient().from('backups').select('snap').eq('id', id).eq('business_id', SBS.biz.id).maybeSingle(); if (r.error) throw r.error; if (!r.data) throw new Error('Yedek bulunamadı.'); snap = r.data.snap; }
    await bkMake('geri-yukleme-oncesi');
    if (!bkApply(snap)) throw new Error('Yedek okunamadı, veri değişmedi.');
    BK.conf = null; BK.fileSnap = ''; toast('Yedek geri yüklendi.', 'ok');
  } catch (e) { BK.err = bkMsg(e); BK.conf = null; }
  BK.busy = false; render();
};
H.bkexp = async () => { try { await saveBlob('kaispilot-yedek-' + new Date().toISOString().slice(0, 10) + '.json', new Blob([pSnap()], { type: 'application/json' })); toast('Yedek dosyası hazır.', 'ok'); } catch (e) { toast('İndirilemedi.', 'warn'); } };
const _och31 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'bkfile') {
    const f = el.files && el.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { const t = String(rd.result || ''); const o = JSON.parse(t); if (!o || typeof o !== 'object' || !Array.isArray(o.STOCK) && !Array.isArray(o.LEDGER)) throw new Error('x'); BK.fileSnap = t; BK.conf = 'file'; BK.err = ''; } catch (er) { BK.err = 'Bu dosya bir KaisPilot yedeği değil.'; } render(); };
    rd.readAsText(f); try { el.value = ''; } catch (x) {} return;
  }
  if ((ch === 'bulkfile' || ch === 'salefile') && el.files && el.files[0] && /\.xlsx$/i.test(el.files[0].name)) {
    const f = el.files[0];
    xlsxToText(f).then((t) => { if (ch === 'bulkfile') { if (S.modal && S.modal.type === 'stkbulk') { S.modal.text = t; renderModal(); } } else { S.saleText = t; S.saleName = f.name; S.salePrev = previewOf(t, f.name); render(); } }, () => toast('Excel dosyası okunamadı. CSV olarak kaydetmeyi dene.', 'warn'));
    return;
  }
  return _och31(e);
};
/* xlsx -> ';' ayraçlı metin (ilk sayfa) */
async function xlsxToText(file) {
  const buf = new Uint8Array(await file.arrayBuffer()); const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); const td = new TextDecoder();
  let e = buf.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) throw new Error('zip');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
  for (let i = 0; i < n; i++) { if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip'); const nl = dv.getUint16(p + 28, true); const name = td.decode(buf.subarray(p + 46, p + 46 + nl)); files[name] = { m: dv.getUint16(p + 10, true), cs: dv.getUint32(p + 20, true), lho: dv.getUint32(p + 42, true) }; p += 46 + nl + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true); }
  const rd = async (name) => { const f = files[name]; if (!f) return null; const st = f.lho + 30 + dv.getUint16(f.lho + 26, true) + dv.getUint16(f.lho + 28, true); const d = buf.slice(st, st + f.cs); if (f.m === 0) return td.decode(d); if (f.m !== 8 || typeof DecompressionStream === 'undefined') throw new Error('zip'); return td.decode(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); };
  const un = (x) => String(x).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const ss = []; const sx = await rd('xl/sharedStrings.xml'); if (sx) (sx.match(/<si>[\s\S]*?<\/si>/g) || []).forEach((si) => ss.push(un((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join(''))));
  const sheetName = Object.keys(files).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10))[0]; if (!sheetName) throw new Error('zip');
  const sh = await rd(sheetName); const col = (r) => { let c = 0; String(r).replace(/[A-Z]/g, (ch2) => { c = c * 26 + ch2.charCodeAt(0) - 64; return ''; }); return c - 1; };
  const rows = []; (sh.match(/<row[\s\S]*?<\/row>/g) || []).forEach((rw) => { const cells = []; (rw.match(/<c\s[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []).forEach((cx) => { const ref = (cx.match(/\sr="([A-Z]+)\d+"/) || [])[1]; const t = (cx.match(/\st="(\w+)"/) || [])[1]; const v = (cx.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; const is = (cx.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/) || [])[1]; let val = ''; if (t === 's' && v != null) val = ss[+v] || ''; else if (t === 'inlineStr' || is != null) val = un(is || ''); else if (v != null) val = t === 'str' ? un(v) : v; if (ref) cells[col(ref)] = { v: val, num: !t || t === 'n' }; }); rows.push(cells); });
  const hdr = (rows[0] || []).map((c) => (c ? String(c.v).toLocaleLowerCase('tr-TR') : ''));
  const lines = rows.map((cells, ri) => { const out = []; for (let i = 0; i < cells.length; i++) { const c = cells[i]; let v = c ? String(c.v) : ''; if (c && c.num && v !== '') { const x = Number(v); if (ri > 0 && /tarih|date/.test(hdr[i] || '') && x > 30000 && x < 80000) v = new Date(Math.round((x - 25569) * 86400000)).toISOString().slice(0, 10); else v = v.replace('.', ','); } out.push(v.replace(/[;\r\n]+/g, ' ').trim()); } return out.join(';'); }).filter((l) => l.replace(/;/g, '').trim());
  return lines.join('\n');
}
const _bkSb31 = sbLoadBiz; sbLoadBiz = async function () { await _bkSb31(); if (bkCan()) setTimeout(() => { bkAuto().then(() => { if (typeof render === 'function') render(); }); }, 4000); };
if (typeof setInterval === 'function' && typeof window !== 'undefined' && !window.__noPosTimer) setInterval(() => { bkAuto(); }, 3 * 3600 * 1000);
/* v32: muhasebeci müşteri özet ekranı */
function cstat(ekip, muh) {
  const o = { pend: 0, fix: 0, wait: 0, gelir: 0, gider: 0, per: '', n: 0 };
  try { const r = (JSON.parse(ekip || '{}').RECEIPTS) || []; r.forEach((f) => { if (f.status === 'musavirde') o.pend++; else if (f.status === 'duzeltme') o.fix++; else if (f.status === 'bekliyor') o.wait++; }); } catch (e) {}
  try {
    const L = (JSON.parse(muh || '{}').LEDGER) || []; o.n = L.length; const mi = (r) => MON.indexOf(String(r.date || '').split(' ')[1]); let top = -1; L.forEach((r) => { top = Math.max(top, mi(r)); });
    if (top >= 0) { o.per = MON[top]; L.forEach((r) => { if (mi(r) !== top) return; const t = Number(r.total) || 0; if ((r.dir || 'gider') === 'gelir') o.gelir += t; else o.gider += t; }); }
  } catch (e) {}
  return o;
}
async function cinfoLoad() {
  const c = sbClient(); if (!c || ID.cinfoBusy) return; ID.cinfoBusy = true; ID.cinfo = {}; ID.csum = {};
  try {
    const r = await c.from('app_state').select('business_id,scope,state,updated_at').in('scope', ['muh', 'ekip']); const by = {};
    (r.data || []).forEach((x) => { const b = by[x.business_id] || (by[x.business_id] = {}); b[x.scope] = x.state; if (x.scope === 'muh') ID.cinfo[x.business_id] = x.updated_at; else if (!ID.cinfo[x.business_id]) ID.cinfo[x.business_id] = x.updated_at; });
    Object.keys(by).forEach((b) => { ID.csum[b] = cstat(by[b].ekip, by[b].muh); });
  } catch (e) {}
  ID.cinfoBusy = false; render();
}
const clientsCardV32 = clientsCard;
clientsCard = function () {
  const orig = clientsCardV32(); if (!orig || !ID.active || ID.active.role !== 'muhasebeci') return orig;
  const tail = orig.indexOf('<details'); const det = tail >= 0 ? orig.slice(tail, orig.lastIndexOf('</div>')) : '';
  const sum = ID.csum || {}; const list = ID.mems.slice().sort((a, b) => ((sum[b.business_id] || {}).pend || 0) - ((sum[a.business_id] || {}).pend || 0));
  const totP = list.reduce((a, m) => a + ((sum[m.business_id] || {}).pend || 0), 0);
  const rows = list.map((m) => {
    const cur = m.business_id === ID.active.business_id; const s = sum[m.business_id]; const up = ID.cinfo && ID.cinfo[m.business_id]; const dt = up ? new Date(up).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '';
    const pill = !s ? (ID.cinfoBusy ? '<span class="pill p-mute">Yükleniyor</span>' : '<span class="pill p-mute">Veri yok</span>') : s.pend ? `<span class="pill p-warn">${s.pend} fiş bekliyor</span>` : '<span class="pill p-ok">Bekleyen yok</span>';
    const sub = s ? [s.per && (s.gelir || s.gider) ? esc(s.per) + ': gelir ' + fmt0(s.gelir) + ' · gider ' + fmt0(s.gider) : 'Henüz kayıt yok', s.fix ? s.fix + ' belge düzeltmede' : '', s.wait ? s.wait + ' fiş işverende' : '', dt ? 'Son güncelleme ' + esc(dt) : ''].filter(Boolean).join(' · ') : (dt ? 'Son güncelleme ' + esc(dt) : 'Henüz veri yok');
    return `<div class="card stack" style="gap:8px"><div class="row between wrap"><b style="font-weight:600">${esc(m.businesses.name)}</b>${pill}</div><div class="small muted">${sub}</div>${cur ? '<span class="pill p-ok" style="align-self:flex-start">Şu an burada</span>' : `<button class="btn sm" style="align-self:flex-start" data-a="bizgo" data-id="${m.business_id}">Geç ve incele</button>`}</div>`;
  }).join('');
  return `<div class="card stack"><div><h3>Müşterilerin</h3><p class="muted small" style="margin-top:2px">${ID.mems.length} işletme${totP ? ', toplam ' + totP + ' fiş senin onayını bekliyor' : ', bekleyen fiş yok'}. Birine geçince ekran o işletmenin verisiyle yenilenir.</p></div>${rows}${det}</div>`;
};
/* v33: günlük sabah özeti */
const BR = { text: '', busy: false, err: '', key: '', tried: '' };
const brKey = () => 'kp_brief_' + (SBS.biz ? SBS.biz.id : 'x') + '_' + (S.user ? S.user.id : 'x') + '_' + new Date().toISOString().slice(0, 10);
const brStore = (v) => { try { if (v == null) return localStorage.getItem(brKey()); localStorage.setItem(brKey(), v); } catch (e) {} return null; };

function brCard() {
  if (!S.user || !['patron', 'mudur'].includes(S.user.role) || !aiReady()) return '';
  const k = brKey(); if (BR.key !== k) { const c = brStore(); if (c) { BR.text = c; BR.key = k; } else { BR.text = ''; } }
  if (!BR.text && !BR.busy && !BR.err && BR.tried !== k) { BR.tried = k; setTimeout(() => brLoad(), 50); }
  const body = BR.busy && !BR.text ? '<p class="muted small">Kais AI bugünün özetini hazırlıyor…</p>' : BR.text ? `<div style="white-space:pre-wrap">${esc(BR.text).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')}</div>` : BR.err ? `<div class="callout warn">${ic('alert')}<div>${esc(BR.err)}</div></div>` : '';
  return `<div class="card stack aicard"><div class="row"><span class="aib">${ic('sparkle', 20)}</span><div class="grow"><h3>Günün özeti</h3><p class="muted small" style="margin-top:2px">Kais AI bugün için dikkat edilecekleri sıraladı.</p></div></div>${body}<div class="row wrap"><button class="btn sm sec" data-a="brrefresh" ${BR.busy ? 'disabled' : ''}>Yenile</button><button class="btn sm sec" data-a="brask">Kais AI'a sor</button></div></div>`;
}
H.brrefresh = () => { BR.text = ''; BR.key = ''; BR.tried = brKey(); brLoad(true); };
H.brask = () => { S.view = 'kaisai'; render(); };
const viewHTMLV33 = viewHTML;
viewHTML = function () { const h = viewHTMLV33(); if (S.view !== 'bugun' || !S.user || !['patron', 'mudur'].includes(S.user.role)) return h; const c = brCard(); if (!c) return h; const t = '<div class="stack-lg">'; const i = h.indexOf(t); return i < 0 ? c + h : h.slice(0, i + t.length) + c + h.slice(i + t.length); };
/* v34: telefon: kaydırmalı sekmelerde kenar solması, seçili sekmeyi görünür tut */
function segMark(s) { const o = s.scrollWidth > s.clientWidth + 2; s.classList.toggle('ovr', o && s.scrollLeft + s.clientWidth < s.scrollWidth - 2); s.classList.toggle('ovl', o && s.scrollLeft > 2); }
function segFix() {
  if (typeof document === 'undefined' || !document.querySelectorAll) return;
  document.querySelectorAll('.seg').forEach((s) => {
    if (s.addEventListener) s.addEventListener('scroll', () => segMark(s), { passive: true });
    const p = s.querySelector && s.querySelector('[aria-pressed=true]'); if (p && s.scrollWidth > s.clientWidth + 2) s.scrollLeft = Math.max(0, p.offsetLeft - 24);
    segMark(s);
  });
}
const renderV34 = render; render = function () { renderV34(); try { segFix(); } catch (e) {} };
/* v35: giriş ekranı yeni tasarım */
const LXI = (() => { const w = (b, s) => `<svg width="${s || 22}" height="${s || 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`; return {
  mail: w('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 6 8-6"/>'),
  lock: w('<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>'),
  eye: w('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  arrow: w('<path d="M4 12h15M13 6l6 6-6 6"/>', 24),
  plus: w('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>', 24),
  play: w('<path d="M7 4.5l12 7.5-12 7.5z"/>', 24),
  store: w('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>', 28),
  users: w('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M17 13.8c2.3.2 4 1.8 4 4.2"/>', 28),
  truck: w('<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>', 28) }; })();
const lxMark = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.6" aria-hidden="true"><circle cx="20" cy="20" r="11"/><circle cx="20" cy="20" r="4.4" fill="#fff" stroke="none"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle cx="${(20 + 16.5 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(20 + 16.5 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="2.3" fill="#fff" stroke="none"/>`).join('')}</svg>`;
const lxArt = () => { const ic = (cx, cy, d) => `<g transform="translate(${cx - 11} ${cy - 11}) scale(1.1)" fill="none" stroke="#9BEFEA" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</g>`; return `<svg class="lx-art" viewBox="0 0 300 200" aria-hidden="true"><defs><radialGradient id="lxr" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5BE3E0" stop-opacity=".25"/><stop offset="1" stop-color="#5BE3E0" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="150" cy="100" rx="150" ry="100" fill="url(#lxr)"/>
  <ellipse cx="150" cy="100" rx="138" ry="84" fill="none" stroke="#fff" stroke-opacity=".16" stroke-dasharray="2 6" stroke-linecap="round"/>
  <rect x="62" y="36" width="176" height="108" rx="11" fill="#0C2D52" stroke="#D5E4F4" stroke-width="3"/>
  <g fill="#fff" opacity=".7"><rect x="78" y="52" width="40" height="5" rx="2.5"/><rect x="78" y="65" width="26" height="5" rx="2.5"/></g>
  <g fill="#2ED39A"><rect x="146" y="106" width="16" height="22" rx="3" opacity=".6"/><rect x="170" y="92" width="16" height="36" rx="3" opacity=".8"/><rect x="194" y="70" width="16" height="58" rx="3"/></g>
  <path d="M44 152h212l-12 13H56z" fill="#DCE8F5"/>
  ${ic(30, 58, '<path d="M4 2h12v16l-2.5-1.5L11 18l-2.5-1.5L6 18 4 16.5z"/><path d="M7 7h6M7 11h6"/>')}${ic(270, 58, '<circle cx="8" cy="7" r="3"/><path d="M2 17c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="15.5" cy="8" r="2"/>')}${ic(30, 142, '<path d="M10 2l7 3.5v8L10 17l-7-3.5v-8z"/><path d="M3 5.5L10 9l7-3.5M10 9v8"/>')}${ic(270, 142, '<path d="M2 3h3l2 10h9l2-7H6"/><circle cx="8" cy="17" r="1.4"/><circle cx="15" cy="17" r="1.4"/>')}</svg>`; };
function lxLogin() {
  const cloud = sbOK(); const tab = cloud ? (S.lgTab || 'own') : 'own'; const em = esc(S.lgEm || ''); const create = !!S.lgCreate && cloud;
  const tabs = cloud ? `<div class="lx-tabs" role="group" aria-label="Giriş türü">${[['own', 'Patron', 'İşletmeni yönet', LXI.store], ['emp', 'Çalışan', 'Görevlerine eriş', LXI.users], ['sup', 'Tedarikçi', 'Siparişlerini yönet', LXI.truck]].filter((x) => MARKET_ON || x[0] !== 'sup').map((x) => `<button type="button" data-a="lgtab" data-v="${x[0]}" aria-pressed="${tab === x[0]}">${x[3]}<b>${x[1]}</b></button>`).join('')}</div>` : '';
  const eid = cloud ? 'id-em' : 'em', pid = cloud ? 'id-pw' : 'pw', errId = cloud ? 'id-err' : 'lerr';
  const fields = `<div class="lx-f"><label for="${eid}">E-posta</label><div class="lx-in">${LXI.mail}<input id="${eid}" type="email" autocomplete="username" inputmode="email" autocapitalize="none" placeholder="e-posta@firma.com" value="${em}"></div></div>
   <div class="lx-f"><div class="lx-lr"><label for="${pid}">Şifre</label>${cloud ? '<button type="button" class="lx-link" data-a="idforgot">Şifremi unuttum?</button>' : ''}</div><div class="lx-in">${LXI.lock}<input id="${pid}" type="password" autocomplete="${create ? 'new-password' : 'current-password'}" placeholder="Şifre"><button type="button" class="lx-eye" data-a="pwtog" aria-label="Şifreyi göster veya gizle">${LXI.eye}</button></div></div>`;
  const err = `<div class="err" id="${errId}" role="alert">${esc(S.loginErr)}</div>`;
  const forgot = '';
  const go = `<button class="lx-go" type="${cloud ? 'button' : 'submit'}" ${cloud ? 'data-a="idin"' : ''}><span>Giriş yap</span>${LXI.arrow}</button>`;
  const demoBox = AUTH.demo === false ? '' : `<button type="button" class="lx-demo" data-a="demo" data-id="u1">${LXI.play}<b>Demo hesabını dene</b><span>Örnek verilerle sistemi keşfedin</span></button><details class="lx-more"><summary>Diğer roller <span aria-hidden="true">▾</span></summary><div class="lx-roles">${[['u2', 'Müdür'], ['u3', 'Muhasebeci'], ['u4', 'Çalışan']].map((x) => `<button type="button" data-a="demo" data-id="${x[0]}">${x[1]}</button>`).join('') + (MARKET_ON ? '<button type="button" data-a="lgrole" data-v="sup">Tedarikçi</button>' : '')}</div></details>`;
  let body;
  if (cloud && SBS.user && ID.mems.length > 1 && !ID.active) body = `<div class="stack"><p class="lbl">Hangi işletmeye girmek istiyorsun?</p>${ID.mems.map((m) => `<button type="button" class="btn sec block" data-a="idpick" data-id="${m.business_id}">${esc(m.businesses.name)} · ${esc(ROLE_LABEL[m.role])}</button>`).join('')}<button type="button" class="btn sm sec" data-a="idout">Çıkış yap</button></div>`;
  else if (tab === 'sup') {
    if (cloud && SBS.user) body = `<p class="lx-note">${esc(SBS.user.email || 'Hesabın')} olarak giriş yapıldı.</p><a class="lx-go" href="/tedarikci/"><span>Tedarikçi paneline git</span>${LXI.arrow}</a><button type="button" class="lx-alt lx-out" data-a="idout"><b>Çıkış yap</b></button>${demoBox}`;
    else {
      const goS = `<button class="lx-go" type="button" data-a="supin"><span>Giriş yap</span>${LXI.arrow}</button>`;
      const ex = `<div class="lx-or"><span>veya</span></div><button type="button" class="lx-alt" data-a="supnew">${LXI.plus}<b>Yeni hesap oluştur</b></button><p class="lx-hint">Yukarıya e-postanı ve en az 8 karakterlik şifreni yaz, sonra bu düğmeye bas. Hesabı açınca işletmenin verdiği davet koduyla bağlanırsın.</p>`;
      body = `${fields}${err}${goS}${ex}${demoBox}`;
    }
  }
  else if (cloud && tab === 'emp' && !(SBS.user && !ID.active && ID.mems.length === 0)) body = lxEmp(fields, err, go) + demoBox;
  else {
    const note = cloud && SBS.user && !ID.active && ID.mems.length === 0 ? `<div class="callout warn">${ic('alert')}<div>${esc(SBS.user.email || 'Bu hesap')} giriş yapmış ama bir işletmeye bağlı değil. <button type="button" class="btn sm sec" data-a="idout">Çıkış yap</button></div></div>` : '';
    let extra = '';
    if (cloud) {
      const emp = tab === 'emp';
      extra = `<div class="lx-or"><span>veya</span></div><button type="button" class="lx-alt" data-a="lgcreate" aria-expanded="${create}">${LXI.plus}<b>${emp ? 'Davet kodum var' : 'İşletme oluştur'}</b><span>${emp ? 'Hesabını davet koduyla aç' : 'İşletmenizi dakikalar içinde kurun'}</span></button>`;
      if (create) extra += emp
        ? `<div class="lx-box"><p class="small muted">İşvereninin verdiği kodu yaz. Yukarıya e-postanı ve kendi belirlediğin en az 8 karakterlik şifreni yaz.</p><div class="lx-f"><label for="id-code">Davet kodu</label><div class="lx-in"><input id="id-code" type="text" autocapitalize="characters" placeholder="Örn. K7M2QX" style="text-transform:uppercase"></div></div><button type="button" class="btn block" data-a="idnew">Hesap oluştur ve katıl</button></div>`
        : `<div class="lx-box"><p class="small muted">Yukarıya e-postanı ve en az 8 karakterlik şifreni yaz, buraya işletmeni. Yeni işletme boş başlar.</p><div class="lx-f"><label for="id-biz">İşletme adı</label><div class="lx-in"><input id="id-biz" type="text" autocomplete="organization"></div></div><div class="lx-f"><label>İşletme türü <span class="lx-opt">isteğe bağlı</span></label><div class="pf-cs lx-tur" data-grp="tur"><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Kafe">Kafe</button><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Restoran">Restoran</button><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Fırın / pastane">Fırın / pastane</button><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Market">Market</button><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Kuaför / berber">Kuaför / berber</button><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Mağaza">Mağaza</button><button type="button" class="pf-c" data-a="pfchip" data-g="tur" data-v="Diğer">Diğer</button></div></div><div class="lx-f"><label for="id-name">Adın soyadın</label><div class="lx-in"><input id="id-name" type="text" autocomplete="name"></div></div><button type="button" class="btn block" data-a="idnew">İşletmemi oluştur</button></div>`;
    }
    body = `${note}${fields}${err}${forgot}${go}${extra}${demoBox}`;
  }
  const inner = (cloud && (tab !== 'sup' || !SBS.user) && !(SBS.user && ID.mems.length > 1 && !ID.active)) ? `<form id="${create ? 'idform' : 'idform'}" class="lx-form" novalidate>${body}</form>` : (cloud ? `<div class="lx-form">${body}</div>` : `<form id="login" class="lx-form" novalidate>${body}</form>`);
  return `<div class="login lx"><section class="lx-hero"><div class="lx-brand">${lxMark(40)}<span>KaisPilot</span></div><div class="lx-copy"><h2>İşletmenizi tek yerden yönetin.</h2><p>Fiş, ekip, stok ve tedarik süreçlerinizi tek ekrandan kontrol edin.</p></div>${lxArt()}</section>
  <section class="lx-card"><div class="lx-cin"><h1>Giriş yap</h1><p class="lx-sub">${{ own: 'İşletmeni yönet', emp: 'Görevlerine eriş', sup: 'Teklif ve siparişlerini yönet' }[tab] || 'Hesabınıza devam edin'}</p>${tabs}${inner}</div></section></div>`;
}
loginHTML = lxLogin;
const _lgtab35 = H.lgtab; H.lgtab = (el) => { S.lgEm = (document.getElementById('id-em') || {}).value || S.lgEm || ''; S.lgCreate = false; S.loginErr = ''; _lgtab35(el); };
H.lgcreate = () => { S.lgEm = (document.getElementById('id-em') || {}).value || S.lgEm || ''; S.lgCreate = !S.lgCreate; render(); setTimeout(() => { const n = document.getElementById(S.lgCreate ? (S.lgTab === 'emp' ? 'id-code' : 'id-biz') : 'id-em'); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); };
H.pwtog = (el) => { const i = el.closest('.lx-in').querySelector('input'); if (!i) return; i.type = i.type === 'password' ? 'text' : 'password'; };
const RECOV = typeof location !== 'undefined' && /type=recovery/.test(location.hash || '');
H.idforgot = async () => {
  const em = ((document.getElementById('id-em') || {}).value || '').trim(); const e = document.getElementById('id-err');
  const say = (t) => { S.loginErr = t; if (e) e.textContent = t; };
  if (!em) return say('Önce e-posta adresini yaz, sonra "Şifremi unuttum?"a bas.');
  const c = sbClient(); if (!c) return say('Bulut bağlantısı kullanılamıyor.');
  try { const r = await c.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname }); if (r.error) throw r.error; say(''); toast('Şifre sıfırlama bağlantısı e-postana gönderildi.', 'ok'); } catch (x) { say(idMsg(x)); }
};
NEWM.newpw = () => sheet('Yeni şifre belirle', `<div class="stack"><p class="muted small">Hesabın için en az 8 karakterlik yeni bir şifre yaz.</p><div class="field"><label for="np-pw">Yeni şifre</label><input id="np-pw" type="password" autocomplete="new-password"></div><div class="err" id="np-err" role="alert"></div><button class="btn block" data-a="pwsave">Şifreyi kaydet</button></div>`);
H.pwsave = async () => { const v = (document.getElementById('np-pw') || {}).value || ''; const e = document.getElementById('np-err'); if (v.length < 8) { if (e) e.textContent = 'En az 8 karakter yaz.'; return; } try { const r = await sbClient().auth.updateUser({ password: v }); if (r.error) throw r.error; S.modal = null; render(); toast('Şifren güncellendi.', 'ok'); } catch (x) { if (e) e.textContent = idMsg(x); } };
const _idEnter35 = idEnter; idEnter = async function () { await _idEnter35(); if (RECOV && S.user && !S._recDone) { S._recDone = true; S.modal = { type: 'newpw' }; renderModal(); } };
if (typeof document !== 'undefined') document.addEventListener('submit', (e) => { if (e.target && e.target.id === 'idform') { e.preventDefault(); (S.lgTab === 'emp' ? (S.empMode !== 'join' ? H.idin : H.idnew) : (S.lgCreate ? H.idnew : H.idin))(); } });
/* v41: tedarikçi davet kodu (e-posta şartı yok) */
sbSyncSups = async function () {
  const c = sbClient(); if (!c || !SBS.biz) return;
  const load = async () => { const q = await c.from('suppliers').select('*').eq('business_id', SBS.biz.id); if (q.error) throw q.error; SBS.sups = q.data || []; };
  await load();
  for (const t of SUPPLIERS) {
    const em = (t.email || '').toLowerCase(); const nm = (t.name || '').trim().toLowerCase();
    let row = SBS.sups.find((x) => x.id === t.sbid) || (em && SBS.sups.find((x) => (x.invite_email || '').toLowerCase() === em)) || SBS.sups.find((x) => (x.name || '').trim().toLowerCase() === nm);
    if (!row) { const i = await c.from('suppliers').insert({ business_id: SBS.biz.id, name: t.name, phone: t.phone || null, lead_days: t.lead || 0, min_amount: t.minAmt || 0, invite_email: em || null }); if (i.error) throw i.error; await load(); row = SBS.sups.find((x) => (x.name || '').trim().toLowerCase() === nm); }
    if (row) t.sbid = row.id;
  }
};
const supRow = (t) => t && SBS.sups.find((x) => x.id === t.sbid);
supTag = (sid) => { const t = supById(sid); if (!t || !SBS.biz) return ''; const row = supRow(t); if (row && row.user_id) return ' · panelde'; if (row && row.invite_code) return ' · davet kodu ' + row.invite_code; return ' · davet bekliyor'; };
function supCodeBox(t) {
  if (!t || !SBS.biz) return '';
  const row = supRow(t); if (!row) return '';
  if (row.user_id) return `<div class="callout">${ic('check')}<div>Bu tedarikçi panele bağlı. Teklif istekleri ona otomatik gider.</div></div>`;
  if (!row.invite_code) return '';
  const url = (typeof location !== 'undefined' && /^http/.test(location.origin || '')) ? location.origin + '/tedarikci' : 'kaistrade.vercel.app/tedarikci';
  const msg = `Merhaba, ${BIZ} olarak teklif ve siparişleri KaisPilot Tedarik üzerinden gönderiyoruz. ${url} adresinden istediğin e-postayla hesap aç, sonra şu davet kodunu gir: ${row.invite_code}`;
  const wa = 'https://wa.me/' + (t.phone ? String(t.phone).replace(/\D/g, '').replace(/^0/, '90') : '') + '?text=' + encodeURIComponent(msg);
  return `<div class="callout">${ic('mail')}<div><b>Davet kodu: <span style="font-size:18px;letter-spacing:2px">${esc(row.invite_code)}</span></b><p class="small muted" style="margin:4px 0 8px">Tedarikçi ${esc(url)} adresinden istediği e-postayla hesap açıp bu kodu girince panele bağlanır.</p><div class="row wrap" style="gap:6px"><button class="btn sm sec" data-a="supcopy" data-v="${esc(msg)}">Mesajı kopyala</button><a class="btn sm sec" href="${wa}" target="_blank" rel="noopener">WhatsApp ile gönder</a></div></div></div>`;
}
const _nmSup41 = NEWM.sup;
NEWM.sup = (m) => { let h = _nmSup41(m); h = h.replace('E-posta (tedarikçi paneline davet için)', 'E-posta (isteğe bağlı)').replace('Boş bırakırsan teklifleri elle girersin', 'Boş bırakabilirsin'); const box = m.id ? supCodeBox(supById(m.id)) : ''; return box ? h.replace('<div class="field"><label for="sp-name">', box + '<div class="field"><label for="sp-name">') : h; };
H.supcopy = async (el) => { const v = el.dataset.v || ''; try { await navigator.clipboard.writeText(v); toast('Davet mesajı kopyalandı.', 'ok'); } catch (e) { toast('Kopyalanamadı. Kodu elle gönder.', 'warn'); } };
/* v42: çalışan davet koduyla katılır + şartlar ve sözleşmeler (karşılama ekranı) */
const ONB_DEF = () => ({
  fields: [
    { id: 'ad', label: 'Ad soyad', type: 'text', req: true },
    { id: 'tc', label: 'T.C. kimlik no', type: 'tc', req: true },
    { id: 'dogum', label: 'Doğum tarihi', type: 'date', req: true },
    { id: 'tel', label: 'Telefon', type: 'tel', req: true },
    { id: 'adres', label: 'Adres', type: 'textarea', req: true },
    { id: 'iban', label: 'IBAN (maaş ödemesi için)', type: 'iban', req: true },
    { id: 'acil', label: 'Acil durumda aranacak kişi ve telefonu', type: 'text', req: false }
  ],
  docs: [
    { id: 'kimlik', label: 'Kimlik kartı (ön ve arka yüz)', req: true },
    { id: 'ikamet', label: 'İkametgâh belgesi', req: false },
    { id: 'saglik', label: 'Sağlık raporu', req: false },
    { id: 'diploma', label: 'Diploma', req: false }
  ],
  consents: [
    { id: 'kvkk', text: 'Kişisel verilerimin işlenmesine ilişkin aydınlatma metnini okudum.', req: true },
    { id: 'kural', text: 'İşyeri kurallarını okudum ve uyacağımı kabul ediyorum.', req: true }
  ],
  contract: {
    title: 'İş sözleşmesi',
    text: 'İŞ SÖZLEŞMESİ\n\nİşveren: {isletme}\nÇalışan: {ad}\nT.C. kimlik no: {tc}\nGörev: {gorev}\nBaşlangıç tarihi: {tarih}\n\n1. Konu\nBu sözleşme, çalışanın işverenin işyerinde yukarıda yazılı görevle çalışmasına ilişkin şartları düzenler.\n\n2. Çalışma süresi\nHaftalık çalışma süresi 45 saattir. Günlük çalışma saatleri ve mola süreleri işveren tarafından belirlenir ve çalışana bildirilir.\n\n3. Ücret\nÜcret, her ay bordroya göre çalışanın bildirdiği banka hesabına ödenir.\n\n4. Deneme süresi\nDeneme süresi 2 aydır. Bu süre içinde taraflar sözleşmeyi bildirim süresine gerek olmadan ve tazminatsız sona erdirebilir.\n\n5. Gizlilik\nÇalışan, işyerine ait ticari bilgileri ve müşteri bilgilerini çalışırken ve ayrıldıktan sonra üçüncü kişilerle paylaşmaz.\n\n6. Diğer hükümler\nBu sözleşmede yer almayan konularda 4857 sayılı İş Kanunu ve ilgili mevzuat hükümleri uygulanır.'
  }
});
const ONB = { cfg: null, ver: 0, loaded: false, missing: false, block: false, step: 1, sub: null, docs: {}, d: { answers: {}, consents: {}, sig: '' }, err: '', busy: false, cd: null, list: null, listBusy: false, upl: '' };
const onbCloud = () => !!(sbClient() && SBS.user && ID.active);
const onbBid = () => ID.active && ID.active.business_id;
const onbNeeds = () => !!(S.user && ID.active && ['calisan', 'mudur'].includes(ID.active.role));
const onbLocalKey = () => 'kp_onb_cfg_' + (BIZ || 'demo');
async function onbLoadCfg() {
  ONB.missing = false;
  if (!onbCloud()) { try { const v = JSON.parse(localStorage.getItem(onbLocalKey()) || 'null'); ONB.cfg = v ? v.cfg : null; ONB.ver = v ? v.ver : 0; } catch (e) { ONB.cfg = null; ONB.ver = 0; } ONB.loaded = true; return; }
  const r = await sbClient().from('onboard_config').select('config,version').eq('business_id', onbBid()).limit(1);
  if (r.error) { if (/onboard_config|schema cache|does not exist/i.test(r.error.message || '')) { ONB.missing = true; ONB.cfg = null; ONB.ver = 0; ONB.loaded = true; return; } throw r.error; }
  const row = r.data && r.data[0]; ONB.cfg = row ? row.config : null; ONB.ver = row ? row.version : 0; ONB.loaded = true;
}
async function onbLoadMine() {
  const c = sbClient(); const bid = onbBid(); const uid = SBS.user.id;
  const s = await c.from('onboard_sub').select('*').eq('business_id', bid).eq('user_id', uid).limit(1); if (s.error) throw s.error;
  ONB.sub = s.data && s.data[0] || null;
  const d = await c.from('onboard_docs').select('doc_id,name').eq('business_id', bid).eq('user_id', uid); if (d.error) throw d.error;
  ONB.docs = {}; (d.data || []).forEach((x) => { ONB.docs[x.doc_id] = { name: x.name }; });
  ONB.d = { answers: Object.assign({}, ONB.sub && ONB.sub.answers), consents: {}, sig: '' };
  if (!ONB.d.answers.ad && S.user) ONB.d.answers.ad = S.user.name;
}
const onbFieldsOk = (cfg, a) => (cfg.fields || []).filter((f) => f.req).every((f) => String(a[f.id] || '').trim());
const onbDocsOk = (cfg) => (cfg.docs || []).filter((f) => f.req).every((f) => ONB.docs[f.id]);
function onbDecide() {
  const cfg = ONB.cfg; if (!cfg || !ONB.ver) return false;
  const a = (ONB.sub && ONB.sub.answers) || {}; const fOk = onbFieldsOk(cfg, a); const dOk = onbDocsOk(cfg); const cOk = ONB.sub && ONB.sub.contract_version >= ONB.ver && ONB.sub.accepted_at;
  if (fOk && dOk && cOk) return false;
  ONB.step = !fOk ? 1 : !dOk ? 2 : 3; ONB.reaccept = fOk && dOk && ONB.sub && ONB.sub.accepted_at && !cOk; return true;
}
async function onbGate() {
  if (!onbNeeds() || !onbCloud()) { ONB.block = false; return; }
  ONB.block = 'loading'; render();
  try { await onbLoadCfg(); if (ONB.missing || !ONB.cfg) { ONB.block = false; render(); return; } await onbLoadMine(); ONB.block = onbDecide(); }
  catch (e) { ONB.block = false; toast('Karşılama bilgileri yüklenemedi: ' + idMsg(e), 'warn'); }
  render();
}
const _idEnter42 = idEnter; idEnter = async function () { ONB.loaded = false; ONB.list = null; ONB.cd = null; ONB.cfg = null; ONB.ver = 0; await _idEnter42(); if (S.user && ID.active) await onbGate(); };
const onbFill = (txt) => { const a = Object.assign({}, (ONB.sub && ONB.sub.answers) || {}, ONB.d.answers); const u = S.user || {}; const map = { ad: a.ad || u.name || '', tc: a.tc || '', isletme: BIZ || '', tarih: new Date().toLocaleDateString('tr-TR'), gorev: u.title || ROLE_LABEL[u.role] || '' }; return String(txt || '').replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : (a[k] != null ? a[k] : m))); };
function onbInput(f, v) {
  const id = 'onb-f-' + f.id; const val = esc(v || ''); const req = f.req ? ' <span class="small" style="color:var(--nar)">*</span>' : '';
  let inp;
  if (f.type === 'textarea') inp = `<textarea id="${id}" rows="3" data-onbf="${esc(f.id)}">${val}</textarea>`;
  else if (f.type === 'date') inp = `<input type="date" id="${id}" value="${val}" data-onbf="${esc(f.id)}">`;
  else inp = `<input type="text" id="${id}" value="${val}" data-onbf="${esc(f.id)}"${f.type === 'tel' ? ' inputmode="tel" autocomplete="tel"' : f.type === 'tc' ? ' inputmode="numeric" maxlength="11"' : f.type === 'iban' ? ' autocapitalize="characters" placeholder="TR00 0000 0000 0000 0000 0000 00"' : ''}>`;
  return `<div class="field"><label for="${id}">${esc(f.label)}${req}</label>${inp}</div>`;
}
function onbPage() {
  if (ONB.block === 'loading') return `<div class="onb"><div class="onb-in"><p class="muted" style="text-align:center;padding:60px 0">Hazırlanıyor…</p></div></div>`;
  const cfg = ONB.cfg; const u = S.user; const st = ONB.step;
  const steps = [['Bilgiler', 1], ['Evraklar', 2], ['Sözleşme', 3]].map((x) => `<div class="onb-st${st === x[1] ? ' on' : st > x[1] ? ' ok' : ''}"><span>${st > x[1] ? ic('check', 14) : x[1]}</span>${x[0]}</div>`).join('<i></i>');
  let body;
  if (st === 1) body = `<h2>Bilgilerin</h2><p class="muted small">${esc(BIZ)} senden şu bilgileri istiyor. Yıldızlı alanlar zorunlu.</p><div class="stack" style="margin-top:12px">${(cfg.fields || []).map((f) => onbInput(f, ONB.d.answers[f.id])).join('')}</div>`;
  else if (st === 2) body = `<h2>Evrakların</h2><p class="muted small">Fotoğrafını çekebilir ya da dosya (PDF) yükleyebilirsin. Yıldızlı evraklar zorunlu.</p><div class="stack" style="margin-top:12px">${(cfg.docs || []).map((d) => { const has = ONB.docs[d.id]; const busy = ONB.upl === d.id; return `<div class="onb-doc${has ? ' ok' : ''}"><div class="grow"><b>${esc(d.label)}${d.req ? ' <span style="color:var(--nar)">*</span>' : ''}</b><span class="small muted">${busy ? 'Yükleniyor…' : has ? 'Yüklendi · ' + esc(has.name || '') : d.req ? 'Zorunlu' : 'İsteğe bağlı'}</span></div>${has ? `<button class="btn sm sec" data-a="onbdocrm" data-id="${esc(d.id)}">Kaldır</button>` : `<label class="btn sm">${ic('camera', 16)} Yükle<input type="file" accept="image/*,application/pdf" data-ch="onbdoc" data-id="${esc(d.id)}" hidden></label>`}</div>`; }).join('') || '<p class="muted small">İstenen evrak yok.</p>'}</div>`;
  else body = `<h2>${esc((cfg.contract && cfg.contract.title) || 'Sözleşme')}</h2>${ONB.reaccept ? `<div class="callout warn" style="margin-top:8px">${ic('alert')}<div>Sözleşme güncellendi. Devam etmek için yeni hâlini onaylaman gerekiyor.</div></div>` : '<p class="muted small">Lütfen dikkatlice oku. Onayladığında bir kopyası işletmeye ve muhasebeciye iletilir.</p>'}
    <div class="onb-ct" tabindex="0">${esc(onbFill(cfg.contract && cfg.contract.text)).replace(/\n/g, '<br>')}</div>
    <div class="stack" style="margin-top:12px">${(cfg.consents || []).map((c) => `<label class="onb-cs"><input type="checkbox" data-onbc="${esc(c.id)}"${ONB.d.consents[c.id] ? ' checked' : ''}><span>${esc(c.text)}${c.req ? ' <b style="color:var(--nar)">*</b>' : ''}</span></label>`).join('')}
    <div class="field"><label for="onb-sig">İmza yerine adını soyadını yaz</label><input type="text" id="onb-sig" autocomplete="name" value="${esc(ONB.d.sig || '')}" placeholder="${esc(ONB.d.answers.ad || u.name)}"></div></div>`;
  const nextLbl = st === 3 ? 'Okudum, onaylıyorum' : 'Devam et';
  return `<div class="onb"><div class="onb-in">
  <div class="onb-top"><div class="brand">${mark(26)}<span>KaisPilot</span></div><button class="btn sm sec" data-a="logout">Çıkış</button></div>
  <div class="onb-hi"><h1>Hoş geldin, ${esc((u.name || '').split(' ')[0])}</h1><p class="muted">${esc(BIZ)} ekibine katıldın. Başlamadan önce birkaç adımı tamamla.</p></div>
  <div class="onb-steps">${steps}</div>
  <div class="card onb-card">${body}<div class="err" id="onb-err" role="alert">${esc(ONB.err)}</div>
  <div class="row" style="gap:8px;margin-top:6px">${st > 1 && !ONB.reaccept ? '<button class="btn sec" data-a="onbback">Geri</button>' : ''}<button class="btn grow" data-a="onbnext"${ONB.busy ? ' disabled' : ''}>${ONB.busy ? 'Kaydediliyor…' : nextLbl}</button></div></div>
  <p class="small muted" style="text-align:center;margin:14px 0 24px">Bilgilerin yalnızca işletme sahibi ve muhasebeci tarafından görülür.</p>
  </div></div>`;
}
const _shell42 = shellHTML; shellHTML = function () { return ONB.block ? onbPage() : _shell42(); };
function onbCollect() {
  document.querySelectorAll('[data-onbf]').forEach((el) => { ONB.d.answers[el.dataset.onbf] = el.value; });
  document.querySelectorAll('[data-onbc]').forEach((el) => { ONB.d.consents[el.dataset.onbc] = el.checked; });
  const s = document.getElementById('onb-sig'); if (s) ONB.d.sig = s.value;
}
const onbErr = (t) => { ONB.err = t; const e = document.getElementById('onb-err'); if (e) e.textContent = t; return false; };
function onbValidate1() {
  const a = ONB.d.answers; for (const f of ONB.cfg.fields || []) {
    const v = String(a[f.id] || '').trim();
    if (f.req && !v) return onbErr(f.label + ' alanını doldur.');
    if (v && f.type === 'tc' && !/^[1-9]\d{10}$/.test(v)) return onbErr('T.C. kimlik no 11 haneli olmalı.');
    if (v && f.type === 'iban') { const x = v.replace(/\s/g, '').toUpperCase(); if (!/^TR\d{24}$/.test(x)) return onbErr('IBAN TR ile başlayıp 26 karakter olmalı.'); a[f.id] = x; }
    if (v && f.type === 'tel' && v.replace(/\D/g, '').length < 10) return onbErr('Telefon numarasını kontrol et.');
  }
  return true;
}
async function onbSaveSub(extra) {
  const row = Object.assign({ business_id: onbBid(), user_id: SBS.user.id, app_uid: ID.active.app_uid, answers: ONB.d.answers, updated_at: new Date().toISOString() }, extra || {});
  const r = await sbClient().from('onboard_sub').upsert(row, { onConflict: 'business_id,user_id' }).select('*'); if (r.error) throw r.error;
  ONB.sub = r.data && r.data[0] || Object.assign({}, ONB.sub, row);
}
H.onbback = () => { onbCollect(); ONB.err = ''; ONB.step = Math.max(1, ONB.step - 1); render(); };
H.onbnext = async () => {
  if (ONB.busy) return; onbCollect(); ONB.err = ''; const cfg = ONB.cfg;
  try {
    if (ONB.step === 1) { if (!onbValidate1()) return; ONB.busy = true; render(); await onbSaveSub(); ONB.busy = false; ONB.step = 2; render(); window.scrollTo && window.scrollTo(0, 0); return; }
    if (ONB.step === 2) { const miss = (cfg.docs || []).find((d) => d.req && !ONB.docs[d.id]); if (miss) return onbErr(miss.label + ' yüklenmeli.'); ONB.step = 3; render(); window.scrollTo && window.scrollTo(0, 0); return; }
    const mc = (cfg.consents || []).find((c) => c.req && !ONB.d.consents[c.id]); if (mc) return onbErr('Onay kutularının hepsini işaretle.');
    if (String(ONB.d.sig || '').trim().length < 3) return onbErr('İmza için adını soyadını yaz.');
    ONB.busy = true; render();
    await onbSaveSub({ consents: ONB.d.consents, signature: ONB.d.sig.trim(), contract_version: ONB.ver, contract_snapshot: onbFill(cfg.contract && cfg.contract.text), accepted_at: new Date().toISOString() });
    try { const p = PROFILES[S.user.id]; if (p && canW('ekip')) { p.contract = true; p.cAt = new Date().toISOString().slice(0, 10); } } catch (e) {}
    ONB.busy = false; ONB.block = false; ONB.reaccept = false; render(); toast('Teşekkürler, her şey tamam. Hoş geldin!', 'ok');
  } catch (e) { ONB.busy = false; render(); onbErr('Kaydedilemedi: ' + idMsg(e)); }
};
function onbReadFile(file) {
  return new Promise((res, rej) => {
    if (/^image\//.test(file.type)) {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => { const k = Math.min(1, 1600 / Math.max(im.width, im.height)); const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res({ data: cv.toDataURL('image/jpeg', 0.75), mime: 'image/jpeg' }); };
      im.onerror = () => rej(new Error('Fotoğraf okunamadı.')); im.src = url; return;
    }
    if (file.size > 3 * 1024 * 1024) return rej(new Error('Dosya 3 MB\'tan büyük. Fotoğrafını çekerek yükle.'));
    const fr = new FileReader(); fr.onload = () => res({ data: fr.result, mime: file.type || 'application/pdf' }); fr.onerror = () => rej(new Error('Dosya okunamadı.')); fr.readAsDataURL(file);
  });
}
H.onbdocrm = async (el) => { const id = el.dataset.id; try { const r = await sbClient().from('onboard_docs').delete().eq('business_id', onbBid()).eq('user_id', SBS.user.id).eq('doc_id', id); if (r.error) throw r.error; delete ONB.docs[id]; render(); } catch (e) { toast('Kaldırılamadı: ' + idMsg(e), 'warn'); } };
/* muhasebeci: şartlar ve sözleşmeler */
const onbClone = (o) => JSON.parse(JSON.stringify(o));
async function onbLoadList() {
  if (!onbCloud() || ONB.listBusy) return; ONB.listBusy = true;
  try {
    const c = sbClient(); const bid = onbBid();
    const m = await c.from('members').select('user_id,role,app_uid,display_name,email').eq('business_id', bid); if (m.error) throw m.error;
    const s = await c.from('onboard_sub').select('user_id,app_uid,answers,consents,signature,contract_version,accepted_at,updated_at,contract_snapshot').eq('business_id', bid); if (s.error) throw s.error;
    const d = await c.from('onboard_docs').select('user_id,doc_id,name,mime').eq('business_id', bid); if (d.error) throw d.error;
    ONB.list = (m.data || []).filter((x) => ['calisan', 'mudur'].includes(x.role)).map((x) => ({ m: x, s: (s.data || []).find((y) => y.user_id === x.user_id) || null, d: (d.data || []).filter((y) => y.user_id === x.user_id) }));
  } catch (e) { ONB.list = { err: idMsg(e) }; }
  ONB.listBusy = false;
}
function onbStatus(x) {
  const cfg = ONB.cfg; if (!cfg || !ONB.ver) return ['p-mute', 'Yayında değil'];
  const s = x.s; if (!s || !s.accepted_at) { const docs = {}; x.d.forEach((y) => { docs[y.doc_id] = 1; }); return s ? ['p-warn', 'Yarım kaldı'] : ['p-mute', 'Başlamadı']; }
  if (s.contract_version < ONB.ver) return ['p-warn', 'Yeni sözleşmeyi onaylamadı'];
  const docOk = (cfg.docs || []).filter((d) => d.req).every((d) => x.d.some((y) => y.doc_id === d.id));
  if (!onbFieldsOk(cfg, s.answers || {}) || !docOk) return ['p-warn', 'Eksik var'];
  return ['p-ok', 'Tamamlandı'];
}
function viewSartlar() {
  if (!ONB.loaded && !ONB.cfgBusy) { ONB.cfgBusy = true; onbLoadCfg().catch(() => {}).then(() => { ONB.cfgBusy = false; ONB.cd = null; render(); }); return `<p class="muted">Yükleniyor…</p>`; }
  if (!ONB.cd) ONB.cd = onbClone(ONB.cfg || ONB_DEF());
  const cd = ONB.cd; const cloud = onbCloud();
  if (cloud && ONB.list === null && !ONB.listBusy) onbLoadList().then(() => render());
  const head = ONB.missing ? `<div class="callout warn">${ic('alert')}<div>Bu bölümün tabloları kurulmamış. <b>kaispilot_sozlesme.sql</b> dosyasını Supabase'de bir kez çalıştır.</div></div>`
    : !cloud ? `<div class="callout">${ic('info')}<div>Demo modundasın. Ayarlar bu cihaza kaydedilir, gerçek çalışanlara gitmez.</div></div>`
    : ONB.ver ? `<div class="callout">${ic('check')}<div>Yayında, sürüm ${ONB.ver}. Yeni katılan çalışan ve müdürler ilk girişte bu adımları tamamlar.</div></div>`
    : `<div class="callout warn">${ic('alert')}<div>Henüz yayınlanmadı. Aşağıyı düzenleyip <b>Kaydet ve yayınla</b>'ya basınca çalışanların karşısına çıkar.</div></div>`;
  const tsel = (i, t) => `<select data-ch="onbcf" data-k="fields" data-i="${i}" data-p="type" aria-label="Tür">${[['text', 'Yazı'], ['textarea', 'Uzun yazı'], ['date', 'Tarih'], ['tel', 'Telefon'], ['tc', 'T.C. kimlik'], ['iban', 'IBAN']].map((x) => `<option value="${x[0]}"${t === x[0] ? ' selected' : ''}>${x[1]}</option>`).join('')}</select>`;
  const reqT = (k, i, v) => `<label class="small onb-req"><input type="checkbox" data-ch="onbcf" data-k="${k}" data-i="${i}" data-p="req"${v ? ' checked' : ''}> Zorunlu</label>`;
  const del = (k, i) => `<button class="xbtn sm" data-a="onbdel" data-k="${k}" data-i="${i}" aria-label="Sil">${ic('x', 16)}</button>`;
  const fields = cd.fields.map((f, i) => `<div class="onb-row"><input type="text" value="${esc(f.label)}" data-ch="onbcf" data-k="fields" data-i="${i}" data-p="label" aria-label="Alan adı">${tsel(i, f.type)}${reqT('fields', i, f.req)}${del('fields', i)}</div>`).join('');
  const docs = cd.docs.map((f, i) => `<div class="onb-row"><input type="text" value="${esc(f.label)}" data-ch="onbcf" data-k="docs" data-i="${i}" data-p="label" aria-label="Evrak adı">${reqT('docs', i, f.req)}${del('docs', i)}</div>`).join('');
  const cons = cd.consents.map((f, i) => `<div class="onb-row"><input type="text" value="${esc(f.text)}" data-ch="onbcf" data-k="consents" data-i="${i}" data-p="text" aria-label="Onay metni">${reqT('consents', i, f.req)}${del('consents', i)}</div>`).join('');
  let list = '';
  if (cloud && !ONB.missing) {
    if (ONB.list === null || ONB.listBusy) list = '<p class="small muted">Yükleniyor…</p>';
    else if (ONB.list.err) list = `<p class="small" style="color:var(--nar)">${esc(ONB.list.err)}</p>`;
    else if (!ONB.list.length) list = '<p class="small muted">Henüz davetle katılan çalışan yok.</p>';
    else list = ONB.list.map((x, i) => { const st = onbStatus(x); const nm = (x.s && x.s.answers && x.s.answers.ad) || x.m.display_name || x.m.email; return `<button class="emp go" data-a="onbsee" data-i="${i}"><div class="grow"><b style="font-weight:600">${esc(nm)}</b><div class="small muted">${esc(ROLE_LABEL[x.m.role] || '')}${x.s && x.s.accepted_at ? ' · onay ' + new Date(x.s.accepted_at).toLocaleDateString('tr-TR') : ''} · ${x.d.length} evrak</div></div><span class="pill ${st[0]}">${st[1]}</span></button>`; }).join('');
  }
  return `<div class="stack-lg">${head}
  ${cloud && !ONB.missing ? `<div class="card flush"><div style="padding:16px 16px 4px"><h3>Çalışanların durumu</h3><p class="muted small">Davet koduyla katılanlar ve karşılama adımları.</p></div>${list}<div style="padding:8px 16px 14px"><button class="btn sm sec" data-a="onbref">Yenile</button></div></div>` : ''}
  <div class="card stack"><div><h3>Doldurulacak bilgiler</h3><p class="muted small">Çalışan ilk girişte bu alanları doldurur.</p></div>${fields}<button class="btn sm sec" data-a="onbadd" data-k="fields">${ic('plus', 16)} Bilgi ekle</button></div>
  <div class="card stack"><div><h3>İstenen evraklar</h3><p class="muted small">Fotoğraf ya da PDF olarak yüklenir.</p></div>${docs}<button class="btn sm sec" data-a="onbadd" data-k="docs">${ic('plus', 16)} Evrak ekle</button></div>
  <div class="card stack"><div><h3>Onay maddeleri</h3><p class="muted small">Sözleşmenin altında işaretlenecek kutular.</p></div>${cons}<button class="btn sm sec" data-a="onbadd" data-k="consents">${ic('plus', 16)} Madde ekle</button></div>
  <div class="card stack"><div><h3>Sözleşme</h3><p class="muted small">Şunlar otomatik doldurulur: {ad} {tc} {isletme} {gorev} {tarih}. Örnek metni kullanmadan önce kendi şartlarına göre düzenle ve gerekirse bir hukukçuya kontrol ettir.</p></div>
   <div class="field"><label for="onb-ctt">Başlık</label><input type="text" id="onb-ctt" value="${esc(cd.contract.title)}" data-ch="onbcf" data-k="contract" data-p="title"></div>
   <div class="field"><label for="onb-ctx">Metin</label><textarea id="onb-ctx" rows="14" data-ch="onbcf" data-k="contract" data-p="text" style="font-size:14px;line-height:1.5">${esc(cd.contract.text)}</textarea></div>
   ${ONB.ver ? `<label class="small" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="onb-bump"${ONB.bump ? ' checked' : ''} data-ch="onbbump"> <span>Sözleşmeyi değiştirdim, mevcut çalışanlar da tekrar onaylasın</span></label>` : ''}
   <div class="row wrap" style="gap:8px"><button class="btn sec" data-a="onbprev">Önizle</button><button class="btn grow" data-a="onbpub"${ONB.missing ? ' disabled' : ''}>${ONB.ver ? 'Kaydet' : 'Kaydet ve yayınla'}</button></div>
   ${ONB.ver ? '<button class="btn sm sec" data-a="onbreset" style="align-self:flex-start">Örnek ayarlara dön</button>' : ''}</div>
  </div>`;
}
const _och42 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'onbcf' && ONB.cd) { const k = el.dataset.k; const p = el.dataset.p; const v = el.type === 'checkbox' ? el.checked : el.value; if (k === 'contract') ONB.cd.contract[p] = v; else { const it = ONB.cd[k][Number(el.dataset.i)]; if (it) it[p] = v; } return; }
  if (ch === 'onbbump') { ONB.bump = el.checked; return; }
  if (ch === 'onbdoc') {
    const f = el.files && el.files[0]; const id = el.dataset.id; if (!f) return;
    ONB.upl = id; render();
    onbReadFile(f).then(async (r) => {
      const row = { business_id: onbBid(), user_id: SBS.user.id, doc_id: id, name: f.name || id, mime: r.mime, data: r.data };
      const q = await sbClient().from('onboard_docs').upsert(row, { onConflict: 'business_id,user_id,doc_id' }); if (q.error) throw q.error;
      ONB.docs[id] = { name: row.name }; ONB.upl = ''; ONB.err = ''; render();
    }).catch((x) => { ONB.upl = ''; render(); onbErr('Yüklenemedi: ' + (x.message || idMsg(x))); });
    return;
  }
  return _och42(e);
};
H.onbadd = (el) => { const k = el.dataset.k; const n = 'x' + Date.now().toString(36); if (k === 'fields') ONB.cd.fields.push({ id: n, label: 'Yeni bilgi', type: 'text', req: false }); else if (k === 'docs') ONB.cd.docs.push({ id: n, label: 'Yeni evrak', req: false }); else ONB.cd.consents.push({ id: n, text: 'Yeni onay maddesi', req: true }); render(); };
H.onbdel = (el) => { ONB.cd[el.dataset.k].splice(Number(el.dataset.i), 1); render(); };
H.onbref = () => { ONB.list = null; ONB.loaded = false; ONB.cd = null; render(); };
H.onbreset = () => { ONB.cd = ONB_DEF(); render(); toast('Örnek ayarlar yüklendi. Kaydedersen geçerli olur.'); };
H.onbprev = () => { S.modal = { type: 'onbprev' }; renderModal(); };
NEWM.onbprev = () => { const cd = ONB.cd || ONB_DEF(); return sheet('Çalışanın göreceği sözleşme', `<p class="small muted">Örnek isimle dolduruldu.</p><h3 style="margin-top:8px">${esc(cd.contract.title)}</h3><div class="onb-ct">${esc(String(cd.contract.text).replace(/\{(\w+)\}/g, (m, k) => ({ ad: 'Ayşe Yılmaz', tc: '12345678901', isletme: BIZ, gorev: 'Garson', tarih: new Date().toLocaleDateString('tr-TR') })[k] || m)).replace(/\n/g, '<br>')}</div><div class="stack" style="margin-top:10px">${cd.consents.map((c) => `<label class="onb-cs"><input type="checkbox" disabled><span>${esc(c.text)}</span></label>`).join('')}</div>`); };
H.onbpub = async () => {
  const cd = ONB.cd; if (!cd) return;
  if (cd.fields.some((f) => !String(f.label).trim()) || cd.docs.some((f) => !String(f.label).trim()) || cd.consents.some((f) => !String(f.text).trim())) { toast('Boş bırakılan satırları doldur ya da sil.', 'warn'); return; }
  if (!String(cd.contract.text).trim()) { toast('Sözleşme metni boş olamaz.', 'warn'); return; }
  const prevText = ONB.cfg && ONB.cfg.contract ? ONB.cfg.contract.title + '\n' + ONB.cfg.contract.text : '';
  const changed = prevText !== cd.contract.title + '\n' + cd.contract.text;
  const ver = !ONB.ver ? 1 : (ONB.bump ? ONB.ver + 1 : ONB.ver);
  if (!onbCloud()) { try { localStorage.setItem(onbLocalKey(), JSON.stringify({ cfg: cd, ver })); } catch (e) {} ONB.cfg = onbClone(cd); ONB.ver = ver; ONB.bump = false; render(); toast('Kaydedildi (bu cihazda).', 'ok'); return; }
  try {
    const r = await sbClient().from('onboard_config').upsert({ business_id: onbBid(), config: cd, version: ver, updated_at: new Date().toISOString(), updated_by: SBS.user.id }, { onConflict: 'business_id' }); if (r.error) throw r.error;
    const was = ONB.ver; ONB.cfg = onbClone(cd); ONB.ver = ver; ONB.bump = false; render();
    toast(!was ? 'Yayınlandı. Çalışanlar ilk girişte bu adımları görecek.' : ver > was ? 'Kaydedildi. Herkesten yeni sözleşme onayı istenecek.' : changed ? 'Kaydedildi. Mevcut onaylar geçerli kaldı.' : 'Kaydedildi.', 'ok');
  } catch (e) { toast('Kaydedilemedi: ' + idMsg(e), 'warn'); }
};
H.onbsee = (el) => { S.modal = { type: 'onbsee', i: Number(el.dataset.i) }; renderModal(); };
NEWM.onbsee = (m) => {
  const x = ONB.list && ONB.list[m.i]; if (!x) return sheet('Çalışan', '<p class="muted">Bulunamadı.</p>');
  const s = x.s || {}; const a = s.answers || {}; const cfg = ONB.cfg || ONB_DEF(); const st = onbStatus(x);
  const known = (cfg.fields || []).map((f) => [f.label, a[f.id]]); Object.keys(a).forEach((k) => { if (!(cfg.fields || []).some((f) => f.id === k)) known.push([k, a[k]]); });
  const docs = (cfg.docs || []).map((d) => { const y = x.d.find((z) => z.doc_id === d.id); return `<div class="row between" style="gap:8px;padding:6px 0;border-top:1px solid var(--line)"><span>${esc(d.label)}${d.req ? ' *' : ''}</span>${y ? `<button class="btn sm sec" data-a="onbopen" data-u="${esc(x.m.user_id)}" data-d="${esc(d.id)}">Aç</button>` : '<span class="small muted">Yok</span>'}</div>`; }).join('');
  return sheet((a.ad || x.m.display_name || x.m.email || 'Çalışan'), `<div class="stack"><span class="pill ${st[0]}" style="align-self:flex-start">${st[1]}</span>
  <div><p class="lbl">Bilgiler</p>${known.map((r) => `<div class="row between" style="gap:10px;padding:6px 0;border-top:1px solid var(--line)"><span class="small muted">${esc(r[0])}</span><span style="text-align:right;word-break:break-word">${esc(r[1] || '—')}</span></div>`).join('')}</div>
  <div><p class="lbl">Evraklar</p>${docs || '<p class="small muted">İstenen evrak yok.</p>'}</div>
  <div><p class="lbl">Sözleşme</p>${s.accepted_at ? `<p class="small">Sürüm ${s.contract_version} · ${new Date(s.accepted_at).toLocaleString('tr-TR')} · imza: <b>${esc(s.signature || '')}</b></p><p class="small muted">${Object.keys(s.consents || {}).filter((k) => s.consents[k]).length} onay kutusu işaretli</p><details><summary class="small" style="cursor:pointer">Onaylanan metni göster</summary><div class="onb-ct">${esc(s.contract_snapshot || '').replace(/\n/g, '<br>')}</div></details>` : '<p class="small muted">Henüz onaylamadı.</p>'}</div></div>`);
};
H.onbopen = async (el) => {
  try { const r = await sbClient().from('onboard_docs').select('name,mime,data').eq('business_id', onbBid()).eq('user_id', el.dataset.u).eq('doc_id', el.dataset.d).limit(1); if (r.error) throw r.error; const d = r.data && r.data[0]; if (!d) throw new Error('Evrak bulunamadı.');
    const b64 = d.data.split(',')[1] || ''; const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const blob = new Blob([u8], { type: d.mime || 'application/octet-stream' }); const ext = /pdf/.test(d.mime) ? '.pdf' : '.jpg'; saveBlob((d.name || el.dataset.d).replace(/\.[a-z0-9]+$/i, '') + ext, blob);
  } catch (e) { toast('Açılamadı: ' + idMsg(e), 'warn'); }
};
NAV.muhasebeci.push(['sartlar', 'Şartlar ve sözleşmeler', 'file', 'more']); NAV.patron.push(['sartlar', 'Şartlar ve sözleşmeler', 'file', 'more']);
TITLES.sartlar = 'Şartlar ve sözleşmeler';
const viewHTMLV42 = viewHTML;
viewHTML = function () { const r = S.user && S.user.role; if ((r === 'patron' || r === 'muhasebeci') && S.view === 'sartlar') return viewSartlar(); return viewHTMLV42(); };
/* giriş: çalışan sekmesi davet koduyla */
function lxEmp(fields, err, go) {
  const join = S.empMode === 'join';
  const arrow = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;
  if (!join) return `${fields}${err}${go}<div class="lx-sep"></div><p class="lx-have">İlk kez mi giriyorsun? <button type="button" class="lx-link" data-a="empmode" data-v="join">Davet koduyla katıl ${arrow}</button></p>`;
  const f2 = fields.replace(/<button type="button" class="lx-link" data-a="idforgot">[^<]*<\/button>/, '').replace('autocomplete="current-password"', 'autocomplete="new-password"').replace('placeholder="Şifre"', 'placeholder="En az 8 karakter"');
  const scan = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M7 12h10"/></svg>`;
  return `<div class="lx-f"><label for="id-code">Davet kodu</label><div class="lx-in">${LXI.lock}<input id="id-code" type="text" autocapitalize="characters" autocomplete="one-time-code" maxlength="8" placeholder="Örn. K7M2QX" style="text-transform:uppercase;letter-spacing:.5px"><button type="button" class="lx-eye" data-a="codepaste" aria-label="Kodu panodan yapıştır">${scan}</button></div><p class="lx-hint">İşvereninizin gönderdiği davet kodunu girin.</p></div>${f2}${err}<button class="lx-go" type="button" data-a="idnew"><span>Davet koduyla katıl</span>${LXI.arrow}</button><div class="lx-info">${ic('info', 22)}<span>Davet kodunu işvereninizden alın. Kod, sizi ilgili işletmeye otomatik olarak bağlar.</span></div><div class="lx-sep"></div><p class="lx-have">Zaten hesabın var mı? <button type="button" class="lx-link" data-a="empmode" data-v="login">Giriş yap ${arrow}</button></p>`;
}
H.codepaste = async () => { const i = document.getElementById('id-code'); try { const t = await navigator.clipboard.readText(); const m = String(t || '').toUpperCase().match(/[A-Z0-9]{6,8}/); if (m && i) { i.value = m[0]; i.focus(); } else toast('Panoda davet kodu bulunamadı.', 'warn'); } catch (e) { toast('Kodu elle yaz ya da yapıştır.', 'warn'); if (i) i.focus(); } };
const _lgHTML43 = loginHTML; loginHTML = function () { const h = _lgHTML43(); return sbOK() && (S.lgTab || 'own') === 'emp' ? h.replace('<div class="login lx">', '<div class="login lx lx-emp">') : h; };
if (typeof Image !== 'undefined') { try { new Image().src = '/login-hero-emp.jpg'; } catch (e) {} }
if (typeof document !== 'undefined') document.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const t = e.target; if (!t || t.tagName !== 'INPUT' || t.type === 'checkbox' || !t.closest || !t.closest('#idform')) return; e.preventDefault(); const fn = S.lgTab === 'emp' ? (S.empMode !== 'join' ? H.idin : H.idnew) : (S.lgCreate ? H.idnew : H.idin); fn(); });
H.empmode = (el) => { S.lgEm = (document.getElementById('id-em') || {}).value || S.lgEm || ''; S.empMode = el.dataset.v; S.loginErr = ''; render(); };
const _logout42 = H.logout; H.logout = () => { ONB.block = false; ONB.loaded = false; ONB.cfg = null; ONB.list = null; ONB.cd = null; _logout42(); };
/* v44: tedarikçi sekmesi doğrudan tedarikçi girişine */
const _lgtab44 = H.lgtab; H.lgtab = (el) => { if (el.dataset.v === 'sup' && sbOK() && typeof location !== 'undefined' && /^http/.test(location.protocol)) { el.setAttribute('aria-pressed', 'true'); location.href = '/tedarikci'; return; } _lgtab44(el); };

