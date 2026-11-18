/* ===== v111: QR masa kartı + maaş hesaplayıcı ===== */
function qrSvg(text, px) { const q = KQR(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); let d = ''; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 8} ${n + 8}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="Rezervasyon QR kodu"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0f1b2d"/></svg>`; }
NEWM.rbqr = () => {
  const l = rbLink(); const nm = (SBS.biz && SBS.biz.name) || 'İşletme';
  return sheet('Rezervasyon QR kodu', `<div class="stack" style="align-items:center;text-align:center"><div class="etk-wrap" style="padding:14px;border-radius:16px">${qrSvg(l, 220)}</div><div><b>${esc(nm)}</b><p class="muted small" style="margin-top:2px">Telefon kamerasıyla okutan müşteri rezervasyon formunu açar.</p></div><div class="small muted" style="word-break:break-all">${esc(l)}</div><div class="row wrap" style="gap:8px;justify-content:center"><button class="btn" data-a="rbqrprint">${ic('file')} Masa kartı yazdır</button><button class="btn sec" data-a="bkcopy">Linki kopyala</button></div></div>`);
};
H.rbqr = () => { if (!rbLink()) return; S.modal = { type: 'rbqr' }; renderModal(); };
H.rbqrprint = () => {
  const nm = (SBS.biz && SBS.biz.name) || ''; let root = document.getElementById('kp-print'); if (!root) { root = document.createElement('div'); root.id = 'kp-print'; document.body.appendChild(root); }
  root.innerHTML = `<div style="width:100%;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;font-family:Inter,Arial,sans-serif;color:#0f1b2d"><div style="font-size:30px;font-weight:700">${esc(nm)}</div><div style="font-size:20px">Masa ayırtmak için okutun</div>${qrSvg(rbLink(), 360)}<div style="font-size:13px;color:#555">${esc(rbLink())}</div></div>`;
  document.body.classList.add('kp-printing'); const done = () => { document.body.classList.remove('kp-printing'); root.innerHTML = ''; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 150);
};
{
  const _c = rbCard;
  rbCard = function () { let h = _c.apply(this, arguments); return h.replace('<button class="btn sec" data-a="bkcopy">Linki kopyala</button>', '<button class="btn sec" data-a="rbqr">QR kod</button><button class="btn sec" data-a="bkcopy">Linki kopyala</button>'); };
}

/* Maaş hesaplayıcı: brüt/net, 12 aylık seyir, işveren maliyeti */
const IVR = { sgk: 0.2375, tes: 0.05 };
function mhCalc(m) {
  const a = Math.max(0, trNum(m.amt) || 0); const rate = IVR.sgk - (m.tes ? IVR.tes : 0);
  const mo = (i) => (m.mode === 'net' ? netToBrut(a, i) : payroll(a, i));
  const rows = []; for (let i = 1; i <= 12; i++) { const p = mo(i); rows.push(Object.assign({ m: i, cost: p.brut * (1 + rate) }, p)); }
  const sum = (k) => rows.reduce((t, r) => t + r[k], 0);
  return { a, rows, cur: rows[Math.min(11, Math.max(0, (REF.m || 1) - 1))], rate, yNet: sum('net'), yCost: sum('cost'), yBrut: sum('brut') };
}
const MH_AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
NEWM.mhes = (m) => {
  const r = mhCalc(m); const c = r.cur; const low = r.a > 0 && c.net < T26.asgNet - 0.5 && m.mode === 'net';
  const row = (a, b, s) => `<div class="logline"><span>${a}${s ? `<span class="small muted" style="display:block">${s}</span>` : ''}</span><b class="num">${b}</b></div>`;
  const mx = Math.max(1, ...r.rows.map((x) => x.net)); const mn = Math.min(...r.rows.map((x) => x.net));
  const bars = r.a ? `<div class="mh-bars" role="img" aria-label="Aylara göre net maaş">${r.rows.map((x) => `<div class="mh-b${x.m === (REF.m || 1) ? ' on' : ''}" title="${MH_AY[x.m - 1]}: ${esc(fmt0(x.net))}"><i style="height:${(mx - mn < 1 ? 60 : Math.round(30 + 70 * (x.net - mn) / (mx - mn)))}%"></i><span>${MH_AY[x.m - 1][0]}</span></div>`).join('')}</div>` : '';
  const dif = r.rows[11].net - r.rows[0].net;
  return sheet('Maaş hesapla', `<div class="stack">
  <div class="seg" role="group" aria-label="Tutar türü"><button data-a="mhmode" data-v="net" aria-pressed="${m.mode === 'net'}">Net biliyorum</button><button data-a="mhmode" data-v="brut" aria-pressed="${m.mode === 'brut'}">Brüt biliyorum</button></div>
  <div class="field"><label for="mh-a">${m.mode === 'net' ? 'Çalışanın eline geçecek net maaş' : 'Brüt maaş'}</label><input type="text" id="mh-a" inputmode="decimal" value="${esc(m.amt)}" placeholder="Örn. 40.000" data-ch="mhf" data-k="amt"></div>
  <label class="toggle" style="gap:10px"><div><b style="font-weight:600">5 puanlık SGK teşviki</b><div class="small muted">Şartları sağlayan işyerleri işveren primini 5 puan düşük öder.</div></div><button class="sw" role="switch" aria-checked="${m.tes}" aria-label="SGK teşviki" data-a="mhtes"></button></label>
  ${r.a ? `${low ? `<div class="callout bad">${ic('alert')}<div>Bu net tutar ${REF.m}. ayda asgari ücretin (${fmt(T26.asgNet)}) altında kalıyor.</div></div>` : ''}
  <div class="mh-hero"><div><small>Brüt</small><b>${fmt0(c.brut)}</b></div><div><small>Net</small><b>${fmt0(c.net)}</b></div><div class="mh-cost"><small>İşverene maliyet</small><b>${fmt0(c.cost)}</b></div></div>
  <div>${row('SGK işçi payı (%14)', fmt(-c.sgk))}${row('İşsizlik sigortası (%1)', fmt(-c.isz))}${row('Gelir vergisi', fmt(-c.gv), 'Asgari ücret istisnası düşüldü')}${row('Damga vergisi', fmt(-c.damga))}${row('İşveren primleri (%' + (r.rate * 100).toFixed(2).replace('.', ',').replace(/,?0+$/, '') + ')', fmt(c.brut * r.rate), 'SGK işveren payı ve işsizlik')}</div>
  <div><p class="lbl">Yıl boyu net maaş</p>${bars}<p class="small muted" style="margin-top:6px">${Math.abs(dif) < 1 ? 'Yıl boyu aynı net kalır.' : 'Vergi dilimi yükseldikçe net maaş ' + (dif < 0 ? 'azalır' : 'artar') + ': Ocak ' + fmt0(r.rows[0].net) + ', Aralık ' + fmt0(r.rows[11].net) + '.'}</p></div>
  <div class="mh-yr"><div><small>Yıllık net</small><b>${fmt0(r.yNet)}</b></div><div><small>Yıllık işveren maliyeti</small><b>${fmt0(r.yCost)}</b></div></div>` : `<div class="empty">Bir tutar yaz, kesintiler ve işveren maliyeti hemen görünsün.</div>`}
  <p class="small muted">2026 oranlarıyla tahmindir; her ay aynı brüt ödendiği varsayılır. Prim, yemek ve yol yardımı, asgari ücret desteği ve ek ödemeler sonucu değiştirir. Resmî bordro değildir, muhasebeciyle doğrula.</p></div>`);
};
H.mhopen = (el) => { S.modal = { type: 'mhes', mode: (el && el.dataset && el.dataset.v) || 'net', amt: '', tes: true }; renderModal(); };
H.mhmode = (el) => { const m = S.modal; if (!m || m.type !== 'mhes') return; m.mode = el.dataset.v; renderModal(); };
H.mhtes = () => { const m = S.modal; if (!m || m.type !== 'mhes') return; m.tes = !m.tes; renderModal(); };
{
  document.addEventListener('input', (e) => { const el = e.target; if (el && el.dataset && el.dataset.ch === 'mhf' && S.modal && S.modal.type === 'mhes') { S.modal.amt = el.value; const p = el.selectionStart; renderModal(); const n = document.getElementById('mh-a'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} } } });
  const _vh2 = viewHTML;
  viewHTML = function () { let h = _vh2.apply(this, arguments); const u = S.user; if (u && u.role === 'patron' && S.view === 'ekip' && !h.includes('mh-bar')) h = `<div class="row between wrap mh-bar" style="gap:8px;margin-bottom:10px"><span class="muted small">Yeni maaş teklifinin maliyetini gör</span><button class="btn sec" data-a="mhopen">Maaş hesapla</button></div>` + h; return h; };
  const _cv = viewCalisanlar;
  viewCalisanlar = function () { let h = _cv.apply(this, arguments); const u = S.user; if (u && ['patron', 'muhasebeci'].includes(u.role) && h.includes('<section class="cs-h">')) h = h.replace('<section class="cs-h">', `<div class="row between wrap mh-bar" style="gap:8px"><span class="muted small">Yeni maaş teklifinin maliyetini gör</span><button class="btn sec" data-a="mhopen">Maaş hesapla</button></div><section class="cs-h">`); return h; };
}
(function () { try { const st = document.createElement('style'); st.textContent = '.mh-hero{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mh-hero>div{background:var(--canvas,#f3f6fb);border-radius:14px;padding:12px 10px;min-width:0}.mh-hero small,.mh-yr small{display:block;color:var(--muted,#64748b);font-size:11.5px}.mh-hero b{display:block;font-size:17px;letter-spacing:-.02em;margin-top:2px;overflow:hidden;text-overflow:ellipsis}.mh-hero .mh-cost{background:var(--cini);color:#fff}.mh-hero .mh-cost small{color:rgba(255,255,255,.75)}.mh-yr{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mh-yr>div{border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:12px}.mh-yr b{font-size:16px}.mh-bars{display:flex;align-items:flex-end;gap:4px;height:84px}.mh-b{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;font-size:10px;color:var(--muted,#64748b)}.mh-b i{display:block;width:100%;border-radius:5px 5px 2px 2px;background:#c7d7ee}.mh-b.on i{background:var(--cini)}.mh-bar{padding:0 2px}'; document.head.appendChild(st); } catch (e) {} })();
{
  const _k2 = kaIntent;
  kaIntent = function (text) {
    const f = kaFold(text);
    if (f.length < 90 && /(maas|ucret)/.test(f) && /(isverene|maliyet|brut|net)/.test(f) && /\d/.test(f) && /(hesap|ne olur|kac|maliyet|brut|net)/.test(f)) {
      if (!['patron', 'muhasebeci'].includes(S.user.role)) return kaDeny('Maaş hesabı yalnızca patron ve muhasebeci için.');
      const mt = f.match(/(\d[\d.,]*)\s*(bin|k)?/); let a = mt ? trNum(mt[1]) : NaN; if (!(a > 0)) return _k2(text); if (mt[2]) a *= 1000; else if (a < 1000) a *= 1000;
      const mode = /brut/.test(f) && !/net/.test(f) ? 'brut' : 'net'; const r = mhCalc({ mode, amt: String(a), tes: true }); const c = r.cur;
      return { content: `${fmt0(a)} ${mode === 'net' ? 'net' : 'brüt'} maaş için (${REF.m}. ay, 2026 oranları):\n• Brüt: ${fmt0(c.brut)}\n• Net: ${fmt0(c.net)}\n• İşverene maliyet: ${fmt0(c.cost)} (5 puan SGK teşviki varsayıldı)\n• Yıllık işveren maliyeti: ${fmt0(r.yCost)}\nTahmindir, resmî bordro değildir.`, src: 'Maaş hesaplayıcı, 2026 vergi ve prim oranları' };
    }
    return _k2(text);
  };
}

/* ===== v112: çok şube (patron birden fazla işletmeyi tek hesapla yönetir) ===== */
const SBR = { sum: null, busy: false, t: 0, name: '' };
const sbrOwn = () => (ID.mems || []).filter((m) => m.role === 'patron' && m.businesses);
const sbrOn = () => S.user && S.user.role === 'patron' && ID.active && ID.active.role === 'patron';
async function sbrLoad() {
  if (!sbrOn() || SBR.busy) return; SBR.busy = true; const own = sbrOwn(); const out = {};
  try {
    const c = sbClient(); const r = await c.from('app_state').select('business_id,state,updated_at').eq('scope', 'muh').in('business_id', own.map((m) => m.business_id)); if (r.error) throw r.error;
    (r.data || []).forEach((x) => {
      let S2 = []; try { S2 = JSON.parse(x.state).SALES || []; } catch (e) {} const by = {}; S2.forEach((s) => { by[s.date] = (by[s.date] || 0) + (Number(s.total) || 0); });
      const sum = (a, b) => Object.keys(by).filter((d) => d >= a && d <= b).reduce((t, d) => t + by[d], 0);
      out[x.business_id] = { today: by[REF_ISO] || 0, w: sum(addDays(REF_ISO, -6), REF_ISO), pw: sum(addDays(REF_ISO, -13), addDays(REF_ISO, -7)), at: x.updated_at };
    });
  } catch (e) {}
  SBR.sum = out; SBR.busy = false; SBR.t = Date.now(); if (['ayarlar', 'bugun'].includes(S.view) && !S.modal) render();
}
const sbrCur = (m) => ID.active && m.business_id === ID.active.business_id;
function sbrRows() {
  const own = sbrOwn(); const sm = SBR.sum || {}; const mx = Math.max(1, ...own.map((m) => (sm[m.business_id] || {}).w || 0));
  return own.map((m) => { const s = sm[m.business_id]; const d = s && s.pw > 0 ? Math.round((s.w - s.pw) / s.pw * 100) : null;
    return `<div class="sbr-r"><div class="sbr-h"><b>${esc(m.businesses.name)}</b>${sbrCur(m) ? '<span class="pill p-ok">Buradasın</span>' : `<button class="btn sm sec" data-a="bizgo" data-id="${m.business_id}">Geç</button>`}</div>
    ${s ? `<div class="sbr-n"><span>Bugün <b>${esc(fmt0(s.today))}</b></span><span>7 gün <b>${esc(fmt0(s.w))}</b>${d == null ? '' : ` <em class="${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '+' : ''}${d}%</em>`}</span></div><div class="sbr-bar"><i style="width:${Math.round(s.w / mx * 100)}%"></i></div>` : `<div class="small muted">${SBR.sum ? 'Henüz satış verisi yok.' : 'Yükleniyor…'}</div>`}</div>`; }).join('');
}
function sbrCard() {
  const own = sbrOwn(); const tot = own.reduce((t, m) => t + (((SBR.sum || {})[m.business_id] || {}).w || 0), 0);
  return `<div class="card kp-card sbr-card"><div class="row between wrap" style="gap:8px"><div><h3 style="margin:0">Şubeler</h3><p class="muted small" style="margin-top:2px">Her şubenin verisi, ekibi ve yetkileri ayrı tutulur. Tek hesapla hepsini yönetirsin.</p></div><span class="pill p-info">${own.length} şube</span></div>
  ${own.length > 1 && SBR.sum ? `<div class="mh-yr" style="margin-top:12px"><div><small>Tüm şubeler, 7 gün</small><b>${esc(fmt0(tot))}</b></div><div><small>Bugün</small><b>${esc(fmt0(own.reduce((t, m) => t + (((SBR.sum || {})[m.business_id] || {}).today || 0), 0)))}</b></div></div>` : ''}
  <div class="sbr-l">${sbrRows()}</div>
  <div class="field" style="margin-top:12px"><label for="sbr-name">Yeni şube</label><div class="row" style="gap:8px"><input type="text" id="sbr-name" maxlength="60" placeholder="Örn. Kadıköy şubesi" style="flex:1"><button class="btn" data-a="sbradd">Ekle</button></div><p class="small muted" style="margin-top:6px">Yeni şube boş başlar. Müdür ve ekibi şubeye ayrıca davet edersin.</p></div></div>`;
}
function sbrStrip() {
  const own = sbrOwn(); if (own.length < 2) return '';
  const sm = SBR.sum || {}; return `<div class="card sbr-strip" style="margin-bottom:12px"><div class="row between" style="gap:8px"><b style="font-weight:600">Şubeler · bugün</b><button class="btn sm sec" data-a="nav" data-v="ayarlar">Tümü</button></div><div class="sbr-chips">${own.map((m) => `<button class="sbr-c${sbrCur(m) ? ' on' : ''}" ${sbrCur(m) ? '' : `data-a="bizgo" data-id="${m.business_id}"`}><small>${esc(m.businesses.name)}</small><b>${sm[m.business_id] ? esc(fmt0(sm[m.business_id].today)) : '—'}</b></button>`).join('')}</div></div>`;
}
H.sbradd = async () => {
  if (!sbrOn()) return; const n = ((document.getElementById('sbr-name') || {}).value || '').trim(); if (n.length < 2) { toast('Şube adını yaz.', 'warn'); return; }
  if (sbrOwn().length >= 10) { toast('En fazla 10 şube ekleyebilirsin.', 'warn'); return; }
  try {
    const c = sbClient(); const i = await c.from('businesses').insert({ name: n, owner_id: SBS.user.id }).select('id').single(); if (i.error) throw i.error;
    const id = i.data.id; await sbLoadBiz(); if (!ID.mems.some((m) => m.business_id === id)) { toast('Şube oluştu ama erişim eklenemedi. Yenileyip tekrar dene.', 'bad'); return; }
    try { localStorage.setItem('kp_newbiz', id); } catch (e) {} try { auditAdd({ type: 'kais', text: 'Yeni şube eklendi: ' + n }); } catch (e) {}
    await H.bizgo({ dataset: { id } });
  } catch (e) { toast('Şube eklenemedi. ' + idMsg(e), 'bad'); }
};
{
  const _ie = idEnter;
  idEnter = async function () {
    try { const f = localStorage.getItem('kp_newbiz'); if (f && ID.active && ID.active.business_id === f && ID.active.role === 'patron') { localStorage.removeItem('kp_newbiz'); freshBiz(ID.active.businesses.name, (NAMES.u1 && NAMES.u1.name) || 'Patron'); } } catch (e) {}
    return _ie.apply(this, arguments);
  };
  const _vs = viewHTML;
  viewHTML = function () {
    let h = _vs.apply(this, arguments);
    if (sbrOn()) {
      if (!SBR.sum && !SBR.busy) sbrLoad(); else if (Date.now() - SBR.t > 90000 && !SBR.busy && ['ayarlar', 'bugun'].includes(S.view)) sbrLoad();
      if (S.view === 'ayarlar' && !h.includes('sbr-card')) { const i = h.indexOf('<div class="card"><h3>Diğer ayarlar</h3>'); if (i >= 0) h = h.slice(0, i) + sbrCard() + h.slice(i); }
      if (S.view === 'bugun' && !h.includes('sbr-strip')) h = sbrStrip() + h;
    }
    return h;
  };
}
(function () { try { const st = document.createElement('style'); st.textContent = '.sbr-l{margin-top:12px;display:flex;flex-direction:column;gap:10px}.sbr-r{border:1px solid var(--line);border-radius:14px;padding:12px}.sbr-h{display:flex;align-items:center;justify-content:space-between;gap:8px}.sbr-n{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin-top:6px}.sbr-n b{color:var(--ink);font-weight:600}.sbr-n em{font-style:normal;font-size:12px;font-weight:600}.sbr-n .up{color:#16803c}.sbr-n .dn{color:var(--nar)}.sbr-bar{height:6px;border-radius:4px;background:var(--canvas);margin-top:8px;overflow:hidden}.sbr-bar i{display:block;height:100%;background:var(--cini);border-radius:4px}.sbr-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 0 2px;-webkit-overflow-scrolling:touch}.sbr-c{flex:0 0 auto;min-width:112px;text-align:left;border:1px solid var(--line);background:#fff;border-radius:14px;padding:10px 12px;font:inherit;cursor:pointer}.sbr-c small{display:block;color:var(--muted);font-size:11.5px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis}.sbr-c b{display:block;font-size:15px;margin-top:2px}.sbr-c.on{border-color:var(--cini);background:var(--cini-wash);cursor:default}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v113: çalışan Vardiyam yeniden tasarım ===== */
const vwMin = (t) => { const a = t.split(':').map(Number); return a[0] * 60 + a[1]; };
const vwDur = (m) => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), k = m % 60; return h ? h + ' sa' + (k ? ' ' + k + ' dk' : '') : k + ' dk'; };
function vwWeek(me) {
  const n = new Date(); const out = [];
  for (let k = 0; k < 7; k++) { const dt = new Date(n.getFullYear(), n.getMonth(), n.getDate() + k); const ym = dt.getFullYear() + '-' + vdP(dt.getMonth() + 1); const pub = !!(VD_M[ym] && VD_M[ym].pub); out.push({ k, dt, pub, s: pub ? vdState(dt.getFullYear(), dt.getMonth(), dt.getDate(), me) : { k: 'none' } }); }
  return out;
}
function vwHero(me, wk) {
  const n = new Date(); const nm = n.getHours() * 60 + n.getMinutes(); const t0 = wk[0]; const att = ATT[me] || { state: 'none' };
  const nxt = wk.find((x) => x.k > 0 && x.s.k === 'shift'); const lbl = (x) => (x.k === 0 ? 'Bugün' : x.k === 1 ? 'Yarın' : DOWN[x.dt.getDay()]);
  const card = (cls, tag, big, sub, extra, btn) => `<section class="vw-h ${cls}"><span class="vw-tag">${tag}</span><div class="vw-big">${big}</div><p>${sub}</p>${extra || ''}${btn || ''}</section>`;
  if (!t0.pub && !wk.some((x) => x.pub)) return card('mute', 'Plan yok', 'Plan henüz yayınlanmadı', 'Müdür bu ayın vardiya planını yayınlayınca burada görünür.');
  if (t0.s.k === 'shift') {
    const s = vwMin(t0.s.t.s); let e = vwMin(t0.s.t.e); if (e <= s) e += 1440; const rng = `${esc(t0.s.t.s)} – ${esc(t0.s.t.e)}`;
    if (nm < s - 0) return card('pri', 'Bugün vardiyan var', rng, `Başlamasına ${vwDur(s - nm)} var · ${esc(t0.s.t.n)} vardiyası`, '', att.state === 'none' ? `<button class="vw-b" data-a="clockin">${ic('clock', 18)} Mesaiye gir</button>` : '');
    if (nm < e) { const pr = Math.min(100, Math.round((nm - s) / (e - s) * 100)); return card('ok', 'Vardiyadasın', rng, `Bitmesine ${vwDur(e - nm)} kaldı`, `<div class="vw-pr"><i style="width:${pr}%"></i></div>`, att.state === 'none' ? `<button class="vw-b" data-a="clockin">${ic('clock', 18)} Mesaiye gir</button>` : ''); }
    if (nxt) return card('mute', 'Bugünkü vardiya bitti', esc(lbl(nxt)) + ' ' + esc(nxt.s.t.s), `${esc(nxt.s.t.s)} – ${esc(nxt.s.t.e)} · ${esc(nxt.s.t.n)} vardiyası`);
    return card('mute', 'Bugünkü vardiya bitti', 'İyi dinlenmeler', 'Önümüzdeki günlerde vardiya görünmüyor.');
  }
  const why = t0.s.k === 'leave' ? 'İzinlisin' : t0.s.k === 'hol' ? 'Bugün tatil' : t0.s.k === 'off' ? 'Bugün izin günün' : 'Bugün vardiyan yok';
  return card('mute', why, nxt ? 'Sıradaki: ' + esc(lbl(nxt)) + ' ' + esc(nxt.s.t.s) : 'Vardiya görünmüyor', nxt ? `${esc(nxt.s.t.s)} – ${esc(nxt.s.t.e)} · ${esc(nxt.s.t.n)} vardiyası` : 'Önümüzdeki 7 günde planlı vardiya yok.');
}
function viewVardiyam() {
  const me = S.user.id; const wk = vwWeek(me); const n = new Date();
  const b = new Date(n.getFullYear(), n.getMonth() + (S.vmO || 0), 1); const y = b.getFullYear(), m = b.getMonth(); const dim = new Date(y, m + 1, 0).getDate(); const ym = y + '-' + vdP(m + 1);
  const pub = !!(VD_M[ym] && VD_M[ym].pub); const off0 = vdMon0(y, m); const isCur = (S.vmO || 0) === 0;
  const cells = []; for (let i = 0; i < off0; i++) cells.push('<div class="vm-c e"></div>'); let hrs = 0, days = 0;
  for (let d = 1; d <= dim; d++) { const s = pub ? vdState(y, m, d, me) : { k: 'none' }; const today = isCur && d === n.getDate(); let inner = '';
    if (s.k === 'shift') { hrs += vdHours(s.t); days++; inner = `<i style="background:${s.t.c || '#3F86DD'}"></i><b>${esc(s.t.s)}</b><small>${esc(s.t.e)}</small>`; } else if (s.k === 'off') inner = '<small>İzin</small>'; else if (s.k === 'leave') inner = '<small class="l">İzinli</small>'; else if (s.k === 'hol') inner = '<small>Tatil</small>';
    cells.push(`<div class="vm-c${today ? ' t' : ''}${s.k === 'shift' ? ' s' : ''}"><span>${d}</span>${inner}</div>`); }
  const shifts = wk.filter((x) => x.s.k === 'shift'); const wkH = shifts.reduce((t, x) => t + vdHours(x.s.t), 0); const nOff = wk.filter((x) => x.pub && ['off', 'leave', 'hol'].includes(x.s.k)).length;
  const nextOff = wk.find((x) => x.k > 0 && ['off', 'leave'].includes(x.s.k));
  const myTk = REQS.filter((r) => r.uid === me && r.kind === 'takas' && r.st === 'bekliyor'); const myIz = LVREQ.filter((r) => r.uid === me && ['bekliyor', 'yanit', 'karsi'].includes(r.status));
  const ins = [];
  if (wkH > 45) ins.push(['w', `Önümüzdeki 7 gün ${Math.round(wkH * 10) / 10} saat planlı. Haftalık 45 saati aşıyor, fazla mesai konusunu müdürle konuş.`]);
  if (nextOff) ins.push(['i', `Sıradaki ${nextOff.s.k === 'leave' ? 'izinli' : 'izin'} günün ${DOWN[nextOff.dt.getDay()]}${nextOff.k === 1 ? ' (yarın)' : ''}.`]);
  if (myTk.length) ins.push(['i', `Vardiya değişimi talebin onay bekliyor${myTk[0].date ? ' (' + esc(isoShort(myTk[0].date)) + ')' : ''}.`]);
  if (myIz.length) ins.push([myIz[0].status === 'karsi' ? 'w' : 'i', myIz[0].status === 'karsi' ? 'İzin talebine karşı teklif geldi, cevabını bekliyor.' : 'İzin talebin onay bekliyor.']);
  const day = (x) => { const s = x.s; const t = s.k === 'shift' ? `<b>${esc(s.t.s)}</b><small>${esc(s.t.e)}</small>` : s.k === 'off' ? '<small>İzin</small>' : s.k === 'leave' ? '<small class="l">İzinli</small>' : s.k === 'hol' ? '<small>Tatil</small>' : '<small>—</small>'; return `<div class="vw-d${x.k === 0 ? ' t' : ''}${s.k === 'shift' ? ' s' : ''}"><span>${x.k === 0 ? 'Bugün' : ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][x.dt.getDay()]}</span><em>${x.dt.getDate()}</em>${s.k === 'shift' ? `<i style="background:${s.t.c || '#3F86DD'}"></i>` : ''}${t}</div>`; };
  const hdr = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => `<div class="vm-h">${x}</div>`).join('');
  return `<div class="stack-lg vw"><div><h2>Vardiyam</h2><p class="muted" style="margin-top:4px">${esc(DOWN[n.getDay()])}, ${n.getDate()} ${VD_MON[n.getMonth()]}</p></div>
  ${vwHero(me, wk)}
  <section class="op-c"><div class="op-ch"><div><h3>Önümüzdeki 7 gün</h3><span>${shifts.length} vardiya · ${Math.round(wkH * 10) / 10} saat${nOff ? ' · ' + nOff + ' gün izin' : ''}</span></div></div><div class="vw-wk">${wk.map(day).join('')}</div></section>
  ${ins.length ? `<div class="vw-in">${ins.map((x) => `<div class="vw-i ${x[0]}">${ic(x[0] === 'w' ? 'alert' : 'info', 16)}<span>${x[1]}</span></div>`).join('')}</div>` : ''}
  <div class="vw-ac"><button class="btn sec" data-a="rqnew" data-k="takas">${ic('users', 16)} Vardiya değişimi</button><button class="btn sec" data-a="rqnew" data-k="izin">${ic('clock', 16)} İzin iste</button></div>
  <details class="op-c vw-m"${typeof window !== 'undefined' && window.innerWidth >= 900 ? ' open' : ''}><summary><span><b>${VD_MON[m]} takvimi</b><small>${pub ? days + ' gün · ' + Math.round(hrs) + ' saat' : 'Plan yayınlanmadı'}</small></span></summary>
  <div class="iz-nv" style="margin-top:12px"><button type="button" data-a="vmo" data-v="-1" aria-label="Önceki ay">${ic('back', 18)}</button><div style="text-align:center"><h3 style="margin:0">${VD_MON[m]} ${y}</h3></div><button type="button" data-a="vmo" data-v="1" aria-label="Sonraki ay">${ic('chevron', 18)}</button></div>
  ${pub ? `<div class="vm-g">${hdr}${cells.join('')}</div>` : '<p class="op-em" style="padding:14px 0">Bu ay için vardiya planı henüz yayınlanmadı. Müdür yayınlayınca burada görünür.</p>'}</details></div>`;
}
(function () { try { const st = document.createElement('style'); st.textContent = '.vw-h{border-radius:22px;padding:20px;color:#fff;display:flex;flex-direction:column;gap:6px;background:linear-gradient(135deg,#2f62b5,#173068);box-shadow:0 10px 28px rgba(23,48,104,.22)}.vw-h.ok{background:linear-gradient(135deg,#1f8f6a,#0f5a46)}.vw-h.mute{background:#fff;color:var(--ink);box-shadow:none;border:1px solid var(--line)}.vw-tag{align-self:flex-start;font-size:12px;font-weight:600;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.18)}.vw-h.mute .vw-tag{background:var(--canvas);color:var(--ink-2)}.vw-big{font-size:30px;font-weight:700;letter-spacing:-.02em;line-height:1.15}.vw-h p{margin:0;opacity:.85;font-size:14px}.vw-pr{height:6px;border-radius:4px;background:rgba(255,255,255,.25);margin-top:8px;overflow:hidden}.vw-pr i{display:block;height:100%;background:#fff;border-radius:4px}.vw-b{margin-top:12px;border:0;border-radius:14px;padding:13px;background:#fff;color:#173068;font:inherit;font-weight:600;display:flex;gap:8px;align-items:center;justify-content:center;cursor:pointer}.vw-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:12px}.vw-d{border:1px solid var(--line);border-radius:12px;padding:8px 2px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1px;min-height:92px;position:relative}.vw-d span{font-size:10.5px;color:var(--muted)}.vw-d em{font-style:normal;font-weight:700;font-size:15px}.vw-d b{font-size:12px}.vw-d small{font-size:10.5px;color:var(--muted)}.vw-d small.l{color:var(--safran)}.vw-d i{width:18px;height:3px;border-radius:2px;margin:3px 0 1px}.vw-d.s{background:var(--cini-wash);border-color:transparent}.vw-d.t{outline:2px solid var(--cini);outline-offset:-1px}.vw-in{display:flex;flex-direction:column;gap:8px}.vw-i{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;background:var(--cini-wash);color:var(--ink-2);font-size:13.5px}.vw-i svg{flex:0 0 auto;margin-top:2px}.vw-i.w{background:var(--safran-wash);color:var(--safran)}.vw-ac{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vw-m summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between}.vw-m summary::-webkit-details-marker{display:none}.vw-m summary small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}.vw-m summary:after{content:"›";font-size:20px;color:var(--muted);transform:rotate(90deg)}.vw-m[open] summary:after{transform:rotate(-90deg)}@media(min-width:900px){.vw{max-width:760px}}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v114: izin talebi yeniden tasarım (ücretli mazeret izni, tarih aralığı, akıllı özet) ===== */
const LQ_T = [['yillik', 'Yıllık izin', 'Ücretli, hakkından düşer', 'clock'], ['mazeret', 'Ücretli mazeret', 'Evlilik, yakın kaybı, babalık', 'heart'], ['ucretsiz', 'Ücretsiz izin', 'Maaştan kesilebilir', 'wallet']];
const LQ_S = [['Evlilik', 3, 'Evlilik'], ['Yakın kaybı', 3, 'Yakınımı kaybettim'], ['Babalık izni', 5, 'Bebeğimiz doğdu'], ['Diğer', 1, '']];
const LQ_W = { yillik: ['Tatil', 'Dinlenmek istiyorum', 'Ailevi bir işim var'], ucretsiz: ['Ailevi bir işim var', 'Şehir dışına gitmem gerekiyor', 'Kişisel bir işim var'] };
const lqIso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function lqRange(m) {
  const a = m.d1, b = m.d2 && m.d2 >= m.d1 ? m.d2 : m.d1; if (!a) return null; const out = []; const s = new Date(a + 'T00:00:00'); const e = new Date(b + 'T00:00:00');
  for (let d = new Date(s), i = 0; d <= e && i < 60; d.setDate(d.getDate() + 1), i++) out.push(new Date(d)); return out;
}
function lqCalc(m) {
  const me = S.user.id; const r = lqRange(m); if (!r) return null; let work = 0, off = 0; const clash = {};
  r.forEach((d) => { const y = d.getFullYear(), mo = d.getMonth(), dd = d.getDate(); const ym = y + '-' + vdP(mo + 1); const pub = !!(VD_M[ym] && VD_M[ym].pub); const s = pub ? vdState(y, mo, dd, me) : { k: 'shift' };
    if (s.k === 'shift') work++; else off++;
    EMP_IDS.forEach((id) => { if (id !== me && vdOnLeave(id, mo, dd)) clash[id] = 1; }); });
  const cal = r.length; return { cal, work, off, clash: Object.keys(clash).length, txt: m.d1 === (m.d2 || m.d1) || !m.d2 || m.d2 < m.d1 ? isoShort(m.d1) : isoShort(m.d1) + '–' + isoShort(m.d2) };
}
function lqEnt() { const p = PROFILES[S.user.id]; const ent = leaveDays(monthsBetween(p.hire), S.user.id) + yizCarry(S.user.id); const used = LEAVES.filter((x) => x.uid === S.user.id && x.type === 'yillik').reduce((a, x) => a + x.days, 0); return { ent, used, left: Math.max(0, ent - used) }; }
function lvreqModal() {
  const m = S.modal; if (!m.kind) { m.kind = 'yillik'; m.sub = 0; m.d1 = ''; m.d2 = ''; m.why = ''; m.days = null; }
  const e = lqEnt(); const c = lqCalc(m); const days = m.days != null ? m.days : (c ? Math.max(c.work, c ? (c.work ? c.work : 1) : 1) : 1);
  const mz = m.kind === 'mazeret';
  const types = `<div class="lq-t">${LQ_T.map((t) => `<button type="button" class="lq-tt" data-a="lqkind" data-v="${t[0]}" aria-pressed="${m.kind === t[0]}"><span>${ic(t[3] === 'heart' ? 'users' : t[3], 18)}</span><b>${t[1]}</b><small>${t[0] === 'yillik' ? e.left + ' gün kaldı' : t[2]}</small></button>`).join('')}</div>`;
  const subs = mz ? `<div class="field"><label>Hangi durum için?</label><div class="chips">${LQ_S.map((s, i) => `<button type="button" class="chip" data-a="lqsub" data-v="${i}" aria-pressed="${m.sub === i}">${s[0]}${s[1] > 1 ? ' · ' + s[1] + ' gün' : ''}</button>`).join('')}</div></div>` : '';
  const sug = (LQ_W[m.kind] || []).length ? `<div class="chips lq-sg">${LQ_W[m.kind].map((t) => `<button type="button" class="chip" data-a="lqwhy" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : '';
  let info = '';
  if (c) {
    const lines = [];
    lines.push(`<b>${esc(c.txt)}</b> · ${c.cal} takvim günü${c.off ? `, bunun ${c.off} günü zaten izin veya tatil` : ''}`);
    if (m.kind === 'yillik') { const after = e.left - days; lines.push(after >= 0 ? `Onaylanırsa ${after} gün yıllık iznin kalır.` : `Yıllık hakkın ${e.left} gün, ${-after} gün fazla. Ücretsiz izne çevirmeyi düşün.`); }
    else if (mz) lines.push('Ücretli mazeret izninde maaştan kesinti yapılmaz. Süreyi işyerinin kuralı ve yönetici belirler.');
    else lines.push('Ücretsiz izinde yönetici maaştan kesinti yapıp yapmayacağını seçer.');
    if (c.clash) lines.push(`Aynı günlerde ${c.clash} arkadaşın da izinli. Yönetici yoğunluğa bakabilir.`);
    if (!c.work && m.d1) lines.push('Bu günlerde zaten vardiyan görünmüyor.');
    info = `<div class="lq-i${(m.kind === 'yillik' && e.left - days < 0) || c.clash ? ' w' : ''}">${lines.map((x) => `<p>${x}</p>`).join('')}</div>`;
  }
  return sheet('İzin talebi', `<div class="stack">${types}${subs}
  <div class="row"><div class="field grow"><label for="lq-d1">Başlangıç</label><input id="lq-d1" type="date" min="${REF_ISO}" value="${esc(m.d1)}" data-ch="lqf" data-k="d1"></div><div class="field grow"><label for="lq-d2">Bitiş</label><input id="lq-d2" type="date" min="${esc(m.d1 || REF_ISO)}" value="${esc(m.d2)}" data-ch="lqf" data-k="d2"></div></div>
  ${c ? `<div class="lq-n"><span>Gün sayısı</span><div><button type="button" data-a="lqd" data-v="-1" aria-label="Azalt">−</button><b>${days}</b><button type="button" data-a="lqd" data-v="1" aria-label="Artır">+</button></div></div>` : ''}${info}
  <div class="field"><label for="lq-why">${mz ? 'Açıklama' : 'Neden izin istiyorsun?'}</label><textarea id="lq-why" rows="2" placeholder="Örnek: Kardeşimin düğünü var." data-ch="lqf" data-k="why">${esc(m.why)}</textarea>${sug}</div>
  <div class="err" id="lq-err" role="alert"></div><button class="btn block" data-a="lrsend">${ic('send')} Yöneticiye gönder</button><p class="small muted">Talep patrona ve müdüre gider. Onaylanınca izin kaydedilir.</p></div>`);
}
H.lqkind = (el) => { const m = S.modal; if (!m || m.type !== 'lvreq') return; m.kind = el.dataset.v; if (m.kind === 'mazeret') { m.sub = 0; m.days = LQ_S[0][1]; if (!m.why) m.why = LQ_S[0][2]; } else m.days = null; renderModal(); };
H.lqsub = (el) => { const m = S.modal; const i = Number(el.dataset.v); const prev = LQ_S[m.sub]; m.sub = i; m.days = LQ_S[i][1]; if (!m.why || (prev && m.why === prev[2])) m.why = LQ_S[i][2]; renderModal(); };
H.lqwhy = (el) => { const m = S.modal; m.why = el.dataset.t; renderModal(); };
H.lqd = (el) => { const m = S.modal; const c = lqCalc(m); const cur = m.days != null ? m.days : Math.max(1, c ? c.work : 1); m.days = Math.max(1, Math.min(60, cur + Number(el.dataset.v))); renderModal(); };
document.addEventListener('input', (e) => { const el = e.target; if (!el || !el.dataset || el.dataset.ch !== 'lqf' || !S.modal || S.modal.type !== 'lvreq') return; const m = S.modal; m[el.dataset.k] = el.value; });
document.addEventListener('change', (e) => { const el = e.target; if (!el || !el.dataset || el.dataset.ch !== 'lqf' || !S.modal || S.modal.type !== 'lvreq') return; const m = S.modal; m[el.dataset.k] = el.value; if (el.dataset.k === 'd1' && (!m.d2 || m.d2 < m.d1)) m.d2 = m.d1; if (['d1', 'd2'].includes(el.dataset.k)) { m.days = null; renderModal(); } });
H.lrsend = () => {
  const m = S.modal; if (!m || m.type !== 'lvreq') return; const er = (t) => { const x = document.getElementById('lq-err'); if (x) x.textContent = t; };
  const c = lqCalc(m); if (!c) return er('Tarihleri seç.'); const days = m.days != null ? m.days : Math.max(1, c.work); const why = (m.why || '').trim();
  if (why.length < 5) return er('Nedenini yaz. Nedensiz talep gönderilemez.');
  if (m.kind === 'yillik') { const e = lqEnt(); if (days > e.left) return er(e.ent ? `Kalan yıllık iznin ${e.left} gün. Daha fazlası için ücretsiz izin seç.` : 'Yıllık izin hakkın henüz doğmadı. Ücretsiz izin isteyebilirsin.'); }
  const r = { id: 'r' + ++seq, uid: S.user.id, type: m.kind, txt: c.txt, days, status: 'bekliyor', thread: [{ by: S.user.id, text: (m.kind === 'mazeret' ? LQ_S[m.sub][0] + ': ' : '') + why, time: nowT() }] }; if (m.kind === 'mazeret') r.sub = LQ_S[m.sub][0];
  LVREQ.push(r); S.modal = null; render(); toast('Talebin patrona ve müdüre gitti.', 'ok');
};
{
  const _lc = lrCard;
  lrCard = function (r, who) { let h = _lc.apply(this, arguments); if (r.type === 'mazeret') h = h.replace('Ücretli yıllık izin ister', 'Ücretli mazeret izni ister' + (r.sub ? ' · ' + esc(r.sub) : '')); return h; };
}
(function () { try { const st = document.createElement('style'); st.textContent = '.lq-t{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lq-tt{border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:10px 8px;text-align:left;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:2px;min-width:0}.lq-tt span{color:var(--cini)}.lq-tt b{font-size:13px;font-weight:600}.lq-tt small{font-size:11px;color:var(--muted);line-height:1.25}.lq-tt[aria-pressed=true]{border-color:var(--cini);background:var(--cini-wash)}.lq-n{display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:14px;padding:8px 12px;font-size:14px}.lq-n div{display:flex;align-items:center;gap:12px}.lq-n button{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:#fff;font-size:18px;cursor:pointer}.lq-n b{min-width:22px;text-align:center;font-size:17px}.lq-i{background:var(--cini-wash);border-radius:14px;padding:12px 14px;font-size:13.5px;color:var(--ink-2)}.lq-i p{margin:0 0 4px}.lq-i p:last-child{margin:0}.lq-i.w{background:var(--safran-wash);color:var(--safran)}.lq-sg{margin-top:8px}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v115: izin talepleri kartı yeniden tasarım ===== */
function lcOverlap(r) {
  const e = lrEff(r); let q = null; try { q = izOrd(e.txt); } catch (x) {} if (!q) return [];
  return EMP_IDS.filter((id) => id !== r.uid && ekLeaves(id).some((x) => { const w = ekRange(x); return w && w[0] <= q[1] && q[0] <= w[1]; })).map((id) => (byId(id).name || '').split(' ')[0]);
}
function lcLeft(uid) { const p = PROFILES[uid]; if (!p) return null; const ent = leaveDays(monthsBetween(p.hire), uid) + yizCarry(uid); const used = LEAVES.filter((x) => x.uid === uid && x.type === 'yillik').reduce((a, x) => a + x.days, 0); return Math.max(0, ent - used); }
lrCard = function (r, who) {
  const u = byId(r.uid); const admin = who === 'admin'; const e = lrEff(r); const open = ['bekliyor', 'yanit', 'karsi'].includes(r.status);
  const cur = r.status === 'bekliyor' ? 1 : r.status === 'karsi' ? 1 : r.status === 'yanit' ? 2 : 3; const bad = r.status === 'reddedildi';
  const lab = [['Gönderildi'], [r.status === 'karsi' ? 'Karşı teklif' : 'Yönetici'], [r.status === 'yanit' ? 'Onay bekliyor' : bad ? 'Reddedildi' : 'Karar']];
  const steps = `<div class="lc-s">${lab.map((l, i) => `<div class="${i < cur || (!open && i <= cur && !bad) ? 'd' : i === cur && open ? 'n' : ''}${bad && i === 2 ? ' x' : ''}"><i></i><span>${l[0]}</span></div>`).join('')}</div>`;
  let act = '';
  if (admin && ['bekliyor', 'yanit'].includes(r.status)) act = `<button class="btn" data-a="lrok" data-id="${r.id}">Onayla</button><button class="btn sec" data-a="lrctr" data-id="${r.id}">Karşı teklif</button><button class="btn sec lc-no" data-a="lrrej" data-id="${r.id}">Reddet</button>`;
  if (!admin && r.status === 'karsi') act = `<button class="btn" data-a="lrresp" data-id="${r.id}" data-v="kabul">Kabul ediyorum</button><button class="btn sec" data-a="lrresp" data-id="${r.id}" data-v="red">Kabul etmiyorum</button>`;
  const ctr = r.counter ? `<div class="lc-c"><div><small>İstenen</small><b>${esc(r.txt)}</b></div><span>${ic('chevron', 16)}</span><div class="on"><small>Önerilen</small><b>${esc(r.counter.txt)}</b></div></div>` : '';
  const ctx = []; const names = open ? lcOverlap(r) : []; const left = r.type === 'yillik' ? lcLeft(r.uid) : null;
  if (open && names.length) ctx.push(['w', 'Aynı günlerde izinli: ' + names.slice(0, 3).join(', ') + (names.length > 3 ? ' +' + (names.length - 3) : '')]);
  if (open && left != null) ctx.push(['i', admin ? `${esc((u.name || '').split(' ')[0])} için yıllık izin: ${left} gün kalmış, onaylarsan ${left - e.days >= 0 ? left - e.days : 0} gün kalır${left - e.days < 0 ? ' (hakkı aşıyor)' : ''}` : `Yıllık iznin ${left} gün, bu talep onaylanırsa ${Math.max(0, left - e.days)} gün kalır.`]);
  if (!admin && r.status === 'karsi') ctx.push(['i', 'Kabul etmezsen nedenini yazarsın, yönetici tekrar bakar.']);
  const fin = r.fin ? `<div class="lc-f">${ic('check', 14)}<span>${LV_KIND[r.fin.type]}${r.fin.type === 'ucretsiz' ? (r.fin.ded ? ', maaştan ' + fmt(r.fin.ded) + ' kesilecek (günlük ' + fmt(r.fin.perDay) + ')' : ', maaştan kesinti yok') : ', maaştan kesinti yok'}</span></div>` : '';
  const th = r.thread || []; const last = th[th.length - 1];
  const tv = th.length ? `<details class="lc-t"><summary><span>Yazışma · ${th.length} mesaj</span><em>${last ? esc((byId(last.by).name || '').split(' ')[0]) + ': ' + esc(String(last.text).slice(0, 60)) + (String(last.text).length > 60 ? '…' : '') : ''}</em></summary>${thread(th)}</details>` : '';
  const kind = (LV_KIND[r.type] || 'İzin') + (r.sub ? ' · ' + r.sub : '');
  return `<article class="lc${bad ? ' bad' : ''}${r.status === 'onayli' ? ' ok' : ''}"><header><span class="lc-ic ${r.type}">${ic(r.type === 'ucretsiz' ? 'wallet' : r.type === 'mazeret' ? 'users' : 'clock', 18)}</span><div class="lc-h"><b>${admin ? esc(u.name) : esc(kind)}</b><small>${admin ? esc(kind) + ' · ' : ''}${e.days} gün</small></div><div class="lc-p">${lrPill(r, who)}${!admin && r.unreadEmp ? '<span class="pill p-bad">Yeni</span>' : ''}</div></header>
  <div class="lc-d">${esc(e.txt)}</div>${steps}${ctr}${ctx.map((x) => `<div class="lc-x ${x[0]}">${ic(x[0] === 'w' ? 'alert' : 'info', 15)}<span>${x[1]}</span></div>`).join('')}${tv}${fin}${act ? `<div class="lc-a">${act}</div>` : ''}</article>`;
};
lrSection = function (uid, mine) {
  const list = LVREQ.filter((r) => r.uid === uid).slice().reverse(); const open = list.filter((r) => ['bekliyor', 'yanit', 'karsi'].includes(r.status)); const left = mine ? lcLeft(uid) : null;
  return `<div class="card lc-sec"><div class="row between wrap" style="gap:10px"><div><h3 style="margin:0">İzin talepleri</h3><p class="muted small" style="margin-top:2px">${list.length ? (open.length ? open.length + ' talep karar bekliyor' : 'Bekleyen talep yok') : mine ? 'Henüz talep göndermedin' : 'Henüz talep yok'}${left != null ? ' · ' + left + ' gün yıllık izin kaldı' : ''}</p></div>${mine ? `<button class="btn sm" data-a="lrnew">${ic('plus', 16)} İzin iste</button>` : ''}</div>
  <div class="lc-l">${list.length ? list.map((r) => lrCard(r, mine ? 'emp' : 'admin')).join('') : `<div class="empty">${mine ? 'İzin istemek için "İzin iste"ye bas. Yönetici cevap verince burada görürsün.' : 'Henüz talep yok.'}</div>`}</div></div>`;
};
(function () { try { const st = document.createElement('style'); st.textContent = '.lc-sec{padding:16px}.lc-l{display:flex;flex-direction:column;gap:12px;margin-top:14px}.lc{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:10px}.lc.ok{border-color:#bfe3cc}.lc.bad{background:#fcf7f8}.lc header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.lc-ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--cini-wash);color:var(--cini);flex:0 0 auto}.lc-ic.mazeret{background:#e6f5f4;color:var(--turq)}.lc-ic.ucretsiz{background:var(--safran-wash);color:var(--safran)}.lc-h{flex:1;min-width:0}.lc-p{flex-basis:100%;display:flex;gap:6px;flex-wrap:wrap}.lc-h b{display:block;font-weight:600}.lc-h small{color:var(--muted);font-size:12.5px}.lc-d{font-size:22px;font-weight:700;letter-spacing:-.02em}.lc-s{display:flex;gap:6px}.lc-s>div{flex:1;display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--muted)}.lc-s i{display:block;height:4px;border-radius:3px;background:var(--line)}.lc-s .d i{background:var(--cini)}.lc-s .n i{background:linear-gradient(90deg,var(--cini) 50%,var(--line) 50%)}.lc-s .n{color:var(--ink);font-weight:600}.lc-s .d{color:var(--ink-2)}.lc-s .x i{background:var(--nar)}.lc-s .x{color:var(--nar);font-weight:600}.lc-c{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}.lc-c>div{border:1px solid var(--line);border-radius:12px;padding:10px;min-width:0}.lc-c>div.on{background:var(--cini-wash);border-color:transparent}.lc-c small{display:block;color:var(--muted);font-size:11px}.lc-c b{font-size:14px}.lc-c>span{color:var(--muted)}.lc-x{display:flex;gap:8px;align-items:flex-start;font-size:13px;padding:9px 12px;border-radius:12px;background:var(--canvas);color:var(--ink-2)}.lc-x svg{flex:0 0 auto;margin-top:2px}.lc-x.w{background:var(--safran-wash);color:var(--safran)}.lc-f{display:flex;gap:8px;align-items:center;font-size:13px;color:#16803c}.lc-t summary{cursor:pointer;list-style:none;display:flex;flex-direction:column;gap:2px;font-size:13px;font-weight:600}.lc-t summary::-webkit-details-marker{display:none}.lc-t summary em{font-style:normal;font-weight:400;color:var(--muted);font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lc-t[open] summary em{display:none}.lc-t .thread{margin-top:8px}.lc-a{display:flex;gap:8px;flex-wrap:wrap}.lc-a .btn{flex:1 1 auto}.lc-no{color:var(--nar)}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v116: Operasyon yeniden düzen ===== */
S.opL = S.opL || null;
H.opl = (el) => { S.opL = el.dataset.v; render(); };
function opListsCard() {
  const rowOf = (w, t) => { const s = chkStat(w); const pct = s.n ? Math.round(s.d / s.n * 100) : 0; const done = s.n && s.d === s.n; return `<button type="button" class="opz-l${done ? ' ok' : ''}" data-a="opgo" data-t="liste"><div class="opz-lh"><b>${t}</b><span>${s.d}/${s.n}${done ? ' · bitti' : ''}</span></div><div class="op-bar"><i style="width:${pct}%"></i></div></button>`; };
  return `<section class="op-c"><div class="op-ch"><div><h3>Günlük listeler</h3><span>Dokununca maddeleri açılır</span></div></div><div class="opz-ls">${rowOf('ac', 'Açılış')}${rowOf('ka', 'Kapanış')}</div></section>`;
}
opOzet = function () {
  const st = opStatus(); const tips = opTips(); const t = ksToday(); const plan = MPLAN.filter((p) => mpLeft(p) <= 7).sort((a, b) => mpLeft(a) - mpLeft(b));
  const late = opLate().map((l) => l.id); const cnt = (k) => st.filter((x) => x.a.state === k).length;
  const nw = cnt('working'), nb = cnt('break'), nl = st.filter((x) => x.a.state === 'none' && late.includes(x.id)).length, no = st.filter((x) => x.a.state === 'out').length;
  const pr = (n) => (st.length ? Math.round(n / st.length * 100) : 0); const hasPlan = st.some((x) => x.k === 'shift');
  const rows = st.map((x) => { const isLate = x.a.state === 'none' && late.includes(x.id); const sh = x.k === 'none' ? '' : x.sh; const sub = [sh, x.a.inAt ? 'giriş ' + x.a.inAt : ''].filter(Boolean).join(' · ');
    return `<div class="op-er"><span class="op-dot ${isLate ? 'late' : x.a.state}"></span><div><b>${esc(opN(x.id))}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div><span class="pill ${x.a.state === 'working' ? 'p-ok' : isLate ? 'p-bad' : x.a.state === 'break' ? 'p-warn' : 'p-mute'}">${esc(isLate ? 'Gelmedi' : x.lab)}</span></div>`; }).join('');
  const team = `<section class="op-c"><div class="op-ch"><div><h3>Ekip şu an</h3><span>${nw + nb} kişi mesaide${nl ? ' · ' + nl + ' geç kaldı' : ''}${no ? ' · ' + no + ' çıktı' : ''}</span></div></div>${st.length ? `<div class="opz-sb" aria-hidden="true"><i class="w" style="width:${pr(nw)}%"></i><i class="b" style="width:${pr(nb)}%"></i><i class="l" style="width:${pr(nl)}%"></i><i class="o" style="width:${pr(no)}%"></i></div>` : ''}<div class="op-ls op-hs">${rows || '<p class="op-em">Ekip yok.</p>'}</div>${hasPlan ? '' : '<p class="small muted" style="margin-top:8px">Bu ay için vardiya planı yayınlanmadı, bu yüzden planlı saat görünmüyor.</p>'}</section>`;
  const kasa = `<section class="op-c opz-k"><div class="op-ch" style="margin:0"><div><h3>Kasa</h3><span>${t ? 'Bugün kapandı · ciro ' + esc(opTl(ksSales(t))) : 'Bugün henüz kapanmadı'}</span></div>${t ? ksChip(t.diff) : '<button class="btn sm" data-a="opgo" data-t="kasa">Kasayı kapat</button>'}</div></section>`;
  const bak = plan.length ? `<section class="op-c"><div class="op-ch"><div><h3>Yaklaşan bakımlar</h3></div></div><div class="op-ls">${plan.map((p) => `<div class="op-mp"><div><b>${esc(p.n)}</b><span class="${mpLeft(p) < 0 ? 'bad' : 'warn'}">${mpLeft(p) < 0 ? Math.abs(mpLeft(p)) + ' gün gecikti' : mpLeft(p) === 0 ? 'Bugün' : mpLeft(p) + ' gün sonra'}</span></div></div>`).join('')}</div></section>` : '';
  const kais = `<section class="op-c op-kais"><div class="op-ch"><div class="op-kt">${ic('sparkle', 18)}<h3>Kais fark etti</h3></div><span>${tips.length ? tips.length + ' konu' : 'Her şey yolunda'}</span></div><div class="op-ls">${tips.length ? tips.slice(0, 6).map(opTip).join('') : '<p class="op-em">Şu an dikkat gerektiren bir şey görmüyorum. Geç kalan, açık arıza ya da bekleyen talep olursa buraya yazarım.</p>'}</div></section>`;
  return `<div class="op-two"><div class="op-l">${opTiles()}${kais}${team}</div><div class="op-r">${opListsCard()}${kasa}${bak}</div></div>`;
};
function opListe() {
  const wide = typeof window !== 'undefined' && window.innerWidth >= 900; if (wide) return `<div class="op-g2">${chkCard('ac', true)}${chkCard('ka', true)}</div>`;
  const cur = S.opL || (opMin() < 16 * 60 ? 'ac' : 'ka'); const a = chkStat('ac'), k = chkStat('ka');
  const tab = (w, t, s) => `<button data-a="opl" data-v="${w}" aria-pressed="${cur === w}">${t} <small>${s.d}/${s.n}</small></button>`;
  return `<div class="stack-lg"><div class="seg" role="group" aria-label="Liste">${tab('ac', 'Açılış', a)}${tab('ka', 'Kapanış', k)}</div>${chkCard(cur, true)}</div>`;
}
{
  const _v = viewOps;
  viewOps = function () {
    let h = _v.apply(this, arguments); if (opTab() === 'liste') { const i = h.indexOf('<div class="op-g2">'); if (i >= 0) { const head = h.slice(0, i); h = head + opListe() + '</div>'; } } return h;
  };
}
(function () { try { const st = document.createElement('style'); st.textContent = '.op,.op>*{min-width:0;max-width:100%;box-sizing:border-box}.op{width:100%;gap:16px}.op-two{display:flex;flex-direction:column;gap:16px;width:100%}.op-l,.op-r{display:flex;flex-direction:column;gap:16px;width:100%;min-width:0}.op-c{width:100%;padding:18px}@media(min-width:1101px){.op-two{display:grid;grid-template-columns:minmax(0,1fr) 380px;align-items:start}}.op .dz-sts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}@media(min-width:1101px){.op .dz-sts{grid-template-columns:repeat(4,minmax(0,1fr))}}.op .seg-b{max-width:100%;overflow-x:auto;scrollbar-width:none}.op .seg-b::-webkit-scrollbar{display:none}.op-ch{margin-bottom:12px}.op-ch h3{margin:0}.op-ch span{display:block;margin-top:2px}.opz-ls{display:flex;flex-direction:column;gap:10px}.opz-l{display:block;width:100%;text-align:left;font:inherit;border:1px solid var(--line);background:#fff;border-radius:14px;padding:12px 14px;cursor:pointer}.opz-l.ok{background:#f1faf4;border-color:#cfe9d8}.opz-lh{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px}.opz-lh span{color:var(--muted)}.opz-k .op-ch{align-items:center}.opz-sb{display:flex;height:8px;border-radius:5px;overflow:hidden;background:var(--canvas);margin-bottom:12px}.opz-sb i{display:block;height:100%}.opz-sb .w{background:#3a9d62}.opz-sb .b{background:#e0a03a}.opz-sb .l{background:var(--nar)}.opz-sb .o{background:#a9b4c6}.op-dot.late{background:var(--nar)}.op-kais .op-ls{gap:14px}.sa2-ti .btn{margin-top:8px}.op-er{padding:10px 0;border-top:1px solid var(--line)}.op-er:first-child{border-top:0}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v117: Düzenli raporlar kartı yeniden tasarım ===== */
function rpNext() {
  const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth(), n.getDate()); const w = new Date(d); w.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); if (n.getDay() === 1 && n.getHours() < 8) { w.setTime(d.getTime()); }
  const e = new Date(n.getFullYear(), n.getMonth() + 1, 0); const f = (x) => x.getDate() + ' ' + VD_MON[x.getMonth()];
  return { w: f(w), m: f(e) };
}
function rpSum(kind) { try { const R = KP.bizReport(rpData(kind)); return { label: R.sub || '', sum: R.summary || '' }; } catch (e) { return { label: '', sum: '' }; } }
reportCard = function () {
  const u = S.user; if (!u || !['patron', 'muhasebeci'].includes(u.role)) return '';
  const nx = rpNext(); const w = rpSum('w'), m = rpSum('m');
  const sw = (k, t, d) => `<div class="rp-r"><div><b>${t}</b><span>${d}</span></div><button class="sw" data-a="rptog" data-v="${k}" role="switch" aria-checked="${rpOn(k)}" aria-label="${t}"></button></div>`;
  const tile = (k, t, s) => `<div class="rp-t"><div class="rp-th"><b>${t}</b>${s.label ? `<small>${esc(s.label)}</small>` : ''}</div>${s.sum ? `<p>${esc(s.sum)}</p>` : '<p class="muted">Henüz yeterli kayıt yok.</p>'}<div class="rp-ta"><button class="btn sm" data-a="rptpdf" data-v="${k}">${ic('file', 15)} PDF indir</button><button class="btn sm sec" data-a="rptmail" data-v="${k}">${ic('send', 15)} E-postama gönder</button></div></div>`;
  return `<div class="card rp-card"><div class="rp-h"><span class="rp-ic">${ic('file', 20)}</span><div><h3>Raporlar</h3><p class="muted small">${u.role === 'muhasebeci' ? 'KDV, belgesiz kayıt ve borç vadelerini öne çıkaran' : 'Gelir, gider, borç ve stok durumunu özetleyen'} PDF raporlar</p></div></div>
  <div class="rp-g">${tile('w', 'Geçen hafta', w)}${tile('m', 'Bu ay', m)}</div>
  <div class="rp-sec"><p class="lbl">Otomatik gönderim</p>${sw('w', 'Haftalık rapor', rpOn('w') ? 'Sıradaki: ' + nx.w + ' Pazartesi sabahı' : 'Kapalı')}${sw('m', 'Aylık rapor', rpOn('m') ? 'Sıradaki: ' + nx.m + ' akşamı' : 'Kapalı')}</div>
  <div class="rp-sec"><p class="lbl">Nasıl gelsin</p>${sw('push', 'Bildirim', 'Rapor hazır olunca telefona haber verir')}${sw('mail', 'E-posta eki', 'Kayıtlı e-posta adresine PDF olarak')}</div></div>`;
};
(function () { try { const st = document.createElement('style'); st.textContent = '.rp-card{padding:18px;display:flex;flex-direction:column;gap:16px}.rp-h{display:flex;gap:12px;align-items:flex-start}.rp-h h3{margin:0}.rp-h p{margin:2px 0 0}.rp-ic{width:40px;height:40px;border-radius:12px;background:var(--cini-wash);color:var(--cini);display:grid;place-items:center;flex:0 0 auto}.rp-g{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:700px){.rp-g{grid-template-columns:1fr 1fr}}.rp-t{border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--canvas)}.rp-th{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.rp-th small{color:var(--muted);font-size:12px}.rp-t p{margin:0;font-size:13.5px;line-height:1.5;color:var(--ink-2)}.rp-ta{display:flex;gap:8px;flex-wrap:wrap}.rp-ta .btn{flex:1 1 auto;display:inline-flex;gap:6px;align-items:center;justify-content:center}.rp-sec .lbl{margin:0 0 4px}.rp-r{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-top:1px solid var(--line)}.rp-r:first-of-type{border-top:0}.rp-r b{font-weight:600;display:block}.rp-r span{display:block;color:var(--muted);font-size:13px;margin-top:2px}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v118: Borç ve alacak yeniden tasarım ===== */
function bzDebt(d) {
  const n = daysTo(d.due); const late = n < 0; const near = !d.paid && d.on && n <= d.rem; const tone = d.paid ? 'ok' : late || n === 0 ? 'bad' : near || n <= 7 ? 'wn' : '';
  const when = d.paid ? 'Ödendi' : late ? `${-n} gün gecikmiş` : n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : `${n} gün kaldı`;
  return `<div class="bz-c ${tone}"><div class="bz-t"><div class="bz-n"><b>${esc(d.who)}</b><small>${esc(d.note)}</small></div><div class="bz-a"><b>${fmt(d.amt)}</b><span class="bz-w ${tone}">${when}</span></div></div>
  <div class="bz-m">${ic('clock', 14)}<span>Vade ${esc(isoTxt(d.due))}</span>${d.auto ? '<em>otomatik</em>' : ''}</div>
  ${d.paid ? '' : `<div class="bz-f"><button class="bz-bell ${d.on ? 'on' : ''}" data-a="debtrem" data-id="${d.id}" aria-pressed="${!!d.on}" aria-label="Hatırlatma">${ic('bell', 15)}<span>${d.on ? 'Hatırlat' : 'Kapalı'}</span></button>${d.on ? `<select class="bz-s" data-ch="drem" data-id="${d.id}" aria-label="${esc(d.who)} hatırlatma günü">${[1, 3, 5, 7].map((x) => `<option value="${x}" ${x === d.rem ? 'selected' : ''}>${x} gün önce</option>`).join('')}</select>` : ''}<button class="btn sm bz-ok" data-a="debtpaid" data-id="${d.id}">${ic('check', 15)} Ödendi</button></div>`}</div>`;
}
function bzRecv(a) {
  const late = a.days > 0; const tone = late ? 'bad' : 'wn';
  const when = late ? `${a.days} gün gecikmiş` : a.days === 0 ? 'Vadesi bugün' : `${-a.days === 1 ? 'Yarın' : -a.days + ' gün sonra'}`;
  return `<div class="bz-c ${tone}"><div class="bz-t"><div class="bz-n"><b>${esc(a.name)}</b><small>${esc(a.note)}</small></div><div class="bz-a"><b>${fmt(a.amt)}</b><span class="bz-w ${tone}">${when}</span></div></div>
  <div class="bz-m">${ic('mail', 14)}<span>${esc(a.email)}</span>${a.reminded ? `<em>Hatırlatıldı ${esc(a.reminded)}</em>` : ''}</div>
  <div class="bz-f"><button class="btn sm bz-ok" data-a="remind" data-id="${a.id}">${ic('send', 15)} ${a.reminded ? 'Tekrar hatırlat' : 'Hatırlat'}</button><button class="btn sm sec" data-a="paid" data-id="${a.id}">${ic('check', 15)} Tahsil edildi</button></div></div>`;
}
function bzGroup(title, arr, fn) { return arr.length ? `<div class="bz-g"><p class="bz-gt">${title} <span>${arr.length}</span></p>${arr.map(fn).join('')}</div>` : ''; }
borcAlacakHTML = function (role) {
  const ds = allDebts(); const open = ds.filter((d) => !d.paid); const paid = ds.filter((d) => d.paid);
  const totD = open.reduce((a, d) => a + d.amt, 0); const rl = RECV.filter((a) => !a.paid); const alac = rl.reduce((a, x) => a + x.amt, 0);
  const fark = alac - totD; const w7 = open.filter((d) => daysTo(d.due) <= 7); const w7s = w7.reduce((a, d) => a + d.amt, 0);
  const lateR = rl.filter((a) => a.days > 0); const lateS = lateR.reduce((a, x) => a + x.amt, 0); const lateD = open.filter((d) => daysTo(d.due) < 0);
  const f = S.bf || 'hepsi'; const shown = open.filter((d) => f === 'hepsi' || (f === 'yakin' && daysTo(d.due) <= 14) || (f === 'oto' && d.auto)).sort((a, b) => daysTo(a.due) - daysTo(b.due));
  const tot = totD + alac; const pD = tot ? Math.round(totD / tot * 100) : 50;
  const sm = [];
  if (lateD.length) sm.push(['bad', `${lateD.length} borcun vadesi geçti (${fmt0(lateD.reduce((a, d) => a + d.amt, 0))}).`]);
  if (lateS) sm.push(['bad', `${lateR.length} kişiden ${fmt0(lateS)} vadesi geçmiş alacak var. Hatırlatma göndererek tahsil edebilirsin.`]);
  if (w7s) sm.push(['wn', `Önümüzdeki 7 günde ${fmt0(w7s)} ödeme var: ${w7.slice(0, 3).map((d) => esc(d.who)).join(', ')}${w7.length > 3 ? ' ve ' + (w7.length - 3) + ' diğer' : ''}.`]);
  if (lateS && w7s) sm.push([lateS >= w7s ? 'ok' : 'wn', lateS >= w7s ? 'Vadesi geçen alacakları toplarsan bu haftaki ödemeleri karşılarsın.' : `Vadesi geçen alacaklar bu haftaki ödemelerin ${fmt0(w7s - lateS)} altında kalıyor.`]);
  const mail = mailReady() ? '' : `<div class="bz-in">${ic('mail', 16)}<span>${role === 'patron' ? 'Hatırlatmayı işyeri adresinden göndermek için e-postanı bağla.' : 'Hatırlatma e-postası için patronun işletme e-postasını bağlaması gerekir.'}</span></div>`;
  const dG = f === 'hepsi' ? bzGroup('Gecikenler', shown.filter((d) => daysTo(d.due) < 0), bzDebt) + bzGroup('Bu hafta', shown.filter((d) => { const n = daysTo(d.due); return n >= 0 && n <= 7; }), bzDebt) + bzGroup('Sonra', shown.filter((d) => daysTo(d.due) > 7), bzDebt) : shown.map(bzDebt).join('');
  return `<div class="stack-lg bz">
  <section class="bz-h"><div class="bz-hr"><div><small>Ödenecek</small><b>${fmt0(totD)}</b></div><div><small>Tahsil edilecek</small><b>${fmt0(alac)}</b></div></div><div class="bz-bar" aria-hidden="true"><i style="width:${pD}%"></i></div><div class="bz-net ${fark < 0 ? 'neg' : ''}"><span>Net durum</span><b>${fark < 0 ? '−' : '+'}${fmt0(Math.abs(fark))}</b></div></section>
  ${sm.length ? `<section class="bz-sm">${sm.map((x) => `<div class="bz-in ${x[0]}">${ic(x[0] === 'ok' ? 'check' : x[0] === 'bad' ? 'alert' : 'clock', 16)}<span>${x[1]}</span></div>`).join('')}</section>` : ''}
  <section class="bz-s2"><div class="bz-sh"><div><h3>Ödenecekler</h3><p>${open.length} açık borç · maaş ve KDV otomatik</p></div><button class="btn sm" data-a="debtadd">${ic('plus', 16)} Borç ekle</button></div>
  <div class="chips">${[['hepsi', 'Tümü'], ['yakin', '14 gün içinde'], ['oto', 'Otomatik']].map((x) => `<button class="chip" data-a="bf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join('')}</div>
  ${shown.length ? dG : `<div class="bz-e0">${ic('check', 26)}<b>${open.length ? 'Bu filtrede borç yok' : 'Ödenecek borç yok'}</b></div>`}
  ${paid.length ? `<details class="bz-pd"><summary>Ödenenler (${paid.length})</summary>${paid.map(bzDebt).join('')}</details>` : ''}</section>
  <section class="bz-s2"><div class="bz-sh"><div><h3>Tahsil edilecekler</h3><p>${rl.length} kişi · vadesi geçen ${fmt0(lateS)}</p></div></div>
  ${rl.length ? rl.slice().sort((a, b) => b.days - a.days).map(bzRecv).join('') : `<div class="bz-e0">${ic('check', 26)}<b>Açık alacak yok</b></div>`}${mail}</section></div>`;
};
(function () { try { const st = document.createElement('style'); st.textContent = '.bz,.bz>*{min-width:0;box-sizing:border-box}.bz-h{background:linear-gradient(145deg,#1F66BD,#0B2F6B);color:#fff;border-radius:22px;padding:18px;display:flex;flex-direction:column;gap:14px}.bz-hr{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bz-hr small{display:block;opacity:.8;font-size:13px}.bz-hr b{display:block;font-size:22px;margin-top:2px;letter-spacing:-.01em}.bz-bar{height:8px;border-radius:5px;background:#5fd08a;overflow:hidden}.bz-bar i{display:block;height:100%;background:#f0a3a3}.bz-net{display:flex;justify-content:space-between;align-items:center;font-size:14px;padding-top:2px}.bz-net b{font-size:18px;color:#bdf2d0}.bz-net.neg b{color:#ffd0d0}.bz-sm{display:flex;flex-direction:column;gap:8px}.bz-in{display:flex;gap:10px;align-items:flex-start;border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.45;background:#EAF2FE;color:#18407a;width:100%}.bz-in svg{flex:0 0 auto;margin-top:2px}.bz-in.bad{background:#FBECEE;color:#8a2230}.bz-in.wn{background:#FDF3DC;color:#7a5412}.bz-in.ok{background:#E8F6EE;color:#1d6b40}.bz-s2{display:flex;flex-direction:column;gap:12px}.bz-sh{display:flex;justify-content:space-between;align-items:center;gap:10px}.bz-sh h3{margin:0}.bz-sh p{margin:2px 0 0;font-size:13px;color:var(--muted)}.bz-g{display:flex;flex-direction:column;gap:10px}.bz-gt{margin:6px 0 0;font-size:12.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}.bz-gt span{background:var(--canvas);border-radius:999px;padding:1px 8px;margin-left:4px}.bz-c{background:#fff;border:1px solid #E1E8F2;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden}.bz-c:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#C9D5E5}.bz-c.bad:before{background:#C8525F}.bz-c.wn:before{background:#E0A03A}.bz-t{display:flex;justify-content:space-between;gap:12px}.bz-n{min-width:0}.bz-n b{display:block;font-size:15.5px}.bz-n small{display:block;font-size:13px;color:var(--muted);margin-top:2px}.bz-a{text-align:right;flex:0 0 auto}.bz-a b{display:block;font-size:16px}.bz-w{display:inline-block;margin-top:4px;font-size:12px;font-weight:600;border-radius:999px;padding:2px 10px;background:#EEF2F8;color:var(--ink-2)}.bz-w.bad{background:#FBECEE;color:#8a2230}.bz-w.wn{background:#FDF3DC;color:#7a5412}.bz-w.ok{background:#E8F6EE;color:#1d6b40}.bz-m{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-2);flex-wrap:wrap}.bz-m em{font-style:normal;font-weight:600;color:var(--cini);background:#EAF2FE;border-radius:999px;padding:1px 8px;font-size:12px}.bz-f{display:flex;gap:8px;align-items:center;border-top:1px solid var(--line);padding-top:10px}.bz-ok{margin-left:auto}.bz-bell{display:inline-flex;align-items:center;gap:5px;font:inherit;font-size:13px;border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:999px;height:36px;padding:0 12px;cursor:pointer}.bz-bell.on{background:#EAF2FE;border-color:#cfe0f7;color:var(--cini)}.bz-s{height:36px;border:1px solid var(--line);border-radius:10px;padding:0 6px;font:inherit;font-size:13px;background:#fff}.bz-e0{display:flex;flex-direction:column;align-items:center;gap:4px;padding:22px;background:#fff;border:1px dashed #C9D5E5;border-radius:16px;color:#1E9E5A}.bz-pd{background:#fff;border:1px solid #E1E8F2;border-radius:16px;padding:10px 12px}.bz-pd summary{font-size:14px;color:var(--ink-2);padding:4px 0}.bz-pd .bz-c{margin-top:10px}@media(max-width:380px){.bz-f{flex-wrap:wrap}.bz-ok{margin-left:0;flex:1 1 100%}}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v119: Üretici ağı: satıcı türü, doğrulama rozeti, puan ===== */
const SG_KIND = { uretici: 'Doğrudan üretici', toptanci: 'Yerel toptancı', dagitici: 'Distribütör', seyyar: 'Seyyar satıcı', sevkiyat: 'Sevkiyatçı' };
{
  const _pg = sgPull;
  sgPull = async function () {
    const ch = await _pg.apply(this, arguments); let c2 = false;
    try {
      const c = sbClient(); const ids = SUPPLIERS.filter((t) => t.sbid).map((t) => t.sbid); if (!c || !ids.length) return ch;
      const [pf, st] = await Promise.all([c.from('supplier_profiles').select('supplier_id,kind,origin,verify').in('supplier_id', ids), c.rpc('supplier_stats', { ids })]);
      SUPPLIERS.forEach((t) => {
        if (!t.sbid) return; const p = !pf.error && (pf.data || []).find((x) => x.supplier_id === t.sbid); const r = !st.error && (st.data || []).find((x) => x.supplier_id === t.sbid);
        const k = JSON.stringify([t.kind, t.origin, t.verify, t.rate]);
        t.kind = p ? p.kind || null : t.kind; t.origin = p ? p.origin || null : t.origin; t.verify = p ? p.verify || 'yok' : t.verify;
        t.rate = r ? { n: Number(r.n) || 0, stars: Number(r.stars) || 0, ot: Number(r.on_time) || 0, full: Number(r.complete) || 0 } : t.rate;
        if (k !== JSON.stringify([t.kind, t.origin, t.verify, t.rate])) c2 = true;
      });
    } catch (e) {}
    return ch || c2;
  };
}
{
  const _sc = sgScore;
  sgScore = function (t) {
    const sc = _sc(t); let v = sc.v; const tags = sc.tags.slice(); const why = sc.why.slice();
    if (t.kind === 'uretici') { tags.unshift('Doğrudan üretici'); why.push('aracısız, doğrudan üretici' + (t.origin ? ' (' + t.origin + ')' : '')); }
    else if (t.kind && SG_KIND[t.kind]) tags.unshift(SG_KIND[t.kind]);
    if (t.verify === 'uretici') { v += 5; tags.unshift('✓ Doğrulanmış üretici'); why.push('üretici doğrulaması yapılmış'); }
    else if (t.verify === 'kimlik') { v += 3; tags.unshift('✓ Kimliği doğrulanmış'); why.push('kimliği doğrulanmış'); }
    const r = t.rate;
    if (r && r.n >= 3) {
      v += Math.max(-9, Math.min(9, (r.stars - 3.5) * 6)); if (r.ot && r.ot < 70) v -= 4;
      tags.push(r.stars.toFixed(1) + ' ★ (' + r.n + ')'); why.push(r.n + ' değerlendirme, ort. ' + r.stars.toFixed(1) + ', %' + r.ot + ' zamanında');
    } else if (t.sbid) tags.push('Yeni satıcı');
    return { v: Math.max(0, Math.min(100, Math.round(v))), tags, why };
  };
}

/* ===== v120: İlan yayını (üreticiden doğrudan alım) ===== */
const MK = { ok: false, busy: false, needs: [], offers: {}, err: '', setup: false };
const mkOn = () => { const r = S.user && S.user.role; return !!(MARKET_ON && sbClient() && SBS.biz && ['patron', 'mudur'].includes(r)); };
async function mkLoad(force) {
  if (MK.busy) return; if (MK.ok && !force) return; MK.busy = true; await new Promise((r) => setTimeout(r, 0));
  try {
    const c = sbClient(); const q = await c.from('market_needs').select('*').eq('business_id', SBS.biz.id).order('created_at', { ascending: false }).limit(30);
    if (q.error) { MK.setup = /market_needs|relation|schema cache/i.test(q.error.message); throw q.error; }
    MK.needs = q.data || []; MK.offers = {}; MK.setup = false; MK.err = '';
    await Promise.all(MK.needs.filter((n) => n.status !== 'kapali').map(async (n) => { const r = await c.rpc('market_offers_for', { p_need: n.id }); MK.offers[n.id] = r.error ? [] : (r.data || []); }));
  } catch (e) { MK.err = MK.setup ? '' : sbMsg(e); }
  MK.ok = true; MK.busy = false; if (S.saTab === 'ilan') render();
}
function mkScore(o, n, all) {
  const min = Math.min(...all.map((x) => Number(x.price))); let v = 30 + Math.max(0, 35 - ((Number(o.price) / min - 1) * 140));
  const why = []; if (Number(o.price) <= min) why.push('en düşük fiyat'); else why.push('en düşük fiyattan %' + Math.round((Number(o.price) / min - 1) * 100) + ' yüksek');
  if (o.km != null) { v += Math.max(0, 12 - Number(o.km) * 0.15); why.push(Number(o.km).toFixed(0) + ' km'); }
  if (o.n >= 3 && o.stars) { v += (Number(o.stars) - 3.5) * 6; why.push(Number(o.stars).toFixed(1) + ' ★ (' + o.n + ' değerlendirme)'); }
  if (o.verify === 'uretici') { v += 8; why.push('doğrulanmış üretici'); } else if (o.verify === 'kimlik') { v += 4; why.push('kimliği doğrulanmış'); }
  if (n.deliver_by && o.deliver_date) { if (o.deliver_date <= n.deliver_by) { v += 5; why.push('süresinde teslim'); } else { v -= 8; why.push('istenen tarihten geç'); } }
  if (Number(o.qty) < Number(n.qty)) { v -= 10; why.push('miktarın sadece ' + Number(o.qty) + ' ' + n.unit + '’ini verebilir'); }
  return { v: Math.max(0, Math.min(100, Math.round(v))), why };
}
function mkOffer(o, n, sc, top) {
  const tags = []; if (o.kind === 'uretici') tags.push('Doğrudan üretici'); else if (o.kind && SG_KIND[o.kind]) tags.push(SG_KIND[o.kind]);
  if (o.verify === 'uretici') tags.push('✓ Doğrulanmış'); else if (o.verify === 'kimlik') tags.push('✓ Kimlik doğrulandı');
  if (o.n >= 3 && o.stars) tags.push(Number(o.stars).toFixed(1) + ' ★ (' + o.n + ')'); else tags.push('Yeni satıcı');
  const total = Math.round(Number(o.price) * Math.min(Number(o.qty), Number(n.qty)) * 100) / 100;
  return `<div class="mk-o${top ? ' top' : ''}${o.status === 'kabul' ? ' ok' : ''}">${top && o.status === 'bekliyor' ? `<div class="mk-tp">${ic('sparkle', 14)} Kais önerisi</div>` : ''}
  <div class="mk-oh"><div><b>${esc(o.supplier_name)}</b><small>${esc(o.origin || '')}${o.km != null ? (o.origin ? ' · ' : '') + Number(o.km).toFixed(0) + ' km' : ''}</small></div><span class="sg-sc ${sc.v >= 70 ? 'hi' : sc.v >= 50 ? 'mid' : 'lo'}">${sc.v}</span></div>
  <div class="mk-pr"><b>${fmt(Number(o.price))}</b><span>/ ${esc(n.unit)} · toplam ${fmt(total)}</span></div>
  <div class="sg-tags">${tags.map((x) => `<span class="sg-t">${esc(x)}</span>`).join('')}${o.deliver_date ? `<span class="sg-t">${esc(isoShort(o.deliver_date))} teslim</span>` : ''}</div>
  ${o.note ? `<p class="mk-nt">${esc(o.note)}</p>` : ''}<p class="mk-w">${esc(sc.why.join(' · '))}</p>
  ${o.status === 'kabul' ? `<div class="mk-ac">${ic('check', 16)}<span>Kabul edildi.${o.phone ? ' Üreticiyi ara: <b>' + esc(o.phone) + '</b>.' : ''} Malı teslim al, ödemeyi teslimden sonra havaleyle yap.</span></div>` : o.status === 'bekliyor' && n.status === 'acik' ? `<button class="btn sm" data-a="mkacc" data-id="${o.offer_id}">${ic('check', 15)} Kabul et</button>` : ''}</div>`;
}
function mkNeed(n) {
  const all = (MK.offers[n.id] || []).filter((o) => o.status !== 'red'); const sc = all.map((o) => ({ o, s: mkScore(o, n, all) })).sort((a, b) => (b.o.status === 'kabul') - (a.o.status === 'kabul') || b.s.v - a.s.v);
  const stt = { acik: ['Açık', 'p-info'], verildi: ['Teklif seçildi', 'p-ok'], kapali: ['Kapatıldı', 'p-mute'] }[n.status] || ['', ''];
  return `<section class="op-c mk-n"><div class="op-ch"><div><h3>${esc(n.product)} · ${esc(String(n.qty).replace('.', ','))} ${esc(n.unit)}</h3><span>${n.deliver_by ? 'En geç ' + esc(isoShort(n.deliver_by)) + ' · ' : ''}${all.length} teklif</span></div><span class="pill ${stt[1]}">${stt[0]}</span></div>
  ${sc.length ? sc.map((x, i) => mkOffer(x.o, n, x.s, i === 0 && all.length > 1)).join('') : '<p class="op-em">Henüz teklif gelmedi. Yakındaki üreticiler ilanı görünce teklif verir.</p>'}
  ${n.status === 'acik' ? `<button class="btn sm sec" data-a="mkclose" data-id="${n.id}">İlanı kapat</button>` : ''}</section>`;
}
function mkView() {
  const r = S.user && S.user.role; if (!['patron', 'mudur'].includes(r)) return `<div class="callout">${ic('info')}<div>İlan açmayı patron ya da müdür yapabilir.</div></div>`;
  if (!mkOn()) return `<div class="callout">${ic('info')}<div><b>Önce hesabına bağlan</b><p style="margin-top:2px">İlan yayını için Tedarikçi ekranından hesabına bağlanman gerekir.</p></div></div>`;
  if (!MK.ok) { mkLoad(); return `<div class="iz-e">${ic('sparkle', 30)}<b>İlanlar yükleniyor</b></div>`; }
  if (MK.setup) return `<div class="callout warn">${ic('alert')}<div><b>İlan sistemi kurulmamış</b><p style="margin-top:2px">tenant_market.sql dosyasını Supabase SQL Editor'da çalıştır.</p></div></div>`;
  return `<section class="op-c mk-h"><div class="op-kt">${ic('sparkle', 18)}<h3>Üreticiden doğrudan al</h3></div><p class="muted" style="margin:6px 0 12px">İhtiyacını yaz. Yakındaki üreticiler teklif versin, Kais fiyat, mesafe, puan ve doğrulamaya göre sıralasın.</p><div class="row wrap" style="gap:8px"><button class="btn" data-a="mknew">${ic('plus', 16)} Yeni ilan</button><button class="btn sec" data-a="mkreload">Yenile</button></div></section>
  ${MK.err ? `<p class="err">${esc(MK.err)}</p>` : ''}${MK.needs.length ? MK.needs.map(mkNeed).join('') : `<div class="iz-e">${ic('box', 30)}<b>Henüz ilan açmadın</b><p>Örneğin "500 kg soğan" yaz, teklifler gelsin.</p></div>`}`;
}
{
  const _v = viewSatinAlma;
  viewSatinAlma = function () {
    let h = _v.apply(this, arguments); if (!MARKET_ON) return h; const k = '<div class="tq-sg sa2-tb" role="group" aria-label="Satın alma bölümleri">'; const i = h.indexOf(k); if (i < 0) return h;
    const j = h.indexOf('</div>', i); const nO = Object.values(MK.offers).reduce((a, l) => a + l.filter((o) => o.status === 'bekliyor').length, 0);
    const btn = `<button data-a="satab" data-v="ilan" aria-pressed="${S.saTab === 'ilan'}">İlan${nO ? ' (' + nO + ')' : ''}</button>`;
    if (S.saTab !== 'ilan') return h.slice(0, j) + btn + h.slice(j);
    return h.slice(0, j) + btn + h.slice(j, j + 6) + mkView() + '</div>';
  };
}
H.mkreload = () => { MK.ok = false; render(); };
H.mknew = () => { S.modal = { type: 'mknew' }; renderModal(); };
NEWM.mknew = () => { const sh = gShopOK(); return sheet('Yeni ilan', `<div class="field"><label for="mk-p">Ne lazım?</label><input id="mk-p" maxlength="80" placeholder="Örn: Kuru soğan" list="mk-dl"><datalist id="mk-dl">${STOCK.map((s) => `<option value="${esc(s.name.split(' (')[0])}">`).join('')}</datalist></div>
  <div class="row" style="gap:10px"><div class="field grow"><label for="mk-q">Miktar</label><input id="mk-q" inputmode="decimal" placeholder="500"></div><div class="field" style="width:110px"><label for="mk-u">Birim</label><select id="mk-u">${['kg', 'adet', 'L', 'koli', 'çuval'].map((u) => `<option>${u}</option>`).join('')}</select></div></div>
  <div class="field"><label for="mk-d">En geç teslim tarihi</label><input type="date" id="mk-d"></div>
  <div class="field"><label for="mk-c">Üreticinin arayacağı telefon</label><input id="mk-c" inputmode="tel" maxlength="40" placeholder="05xx xxx xx xx"></div>
  <div class="field"><label for="mk-n">Not</label><input id="mk-n" maxlength="300" placeholder="Kalite, ambalaj, teslim saati…"></div>
  ${sh ? '' : `<div class="callout warn" style="margin-bottom:10px">${ic('alert')}<div>Dükkân konumun kayıtlı değil. İlan mesafe olmadan gider. Ayarlar'dan konumu kaydedersen yakındaki üreticilere gösterilir.</div></div>`}
  <div class="err" id="mk-e" role="alert"></div><button class="btn block" data-a="mkok">İlanı yayınla</button><p class="small muted" style="margin-top:8px">Telefon sadece teklifini kabul ettiğin üreticiye görünür.</p>`); };
H.mkok = async () => {
  const v = (id) => ((document.getElementById(id) || {}).value || '').trim(); const e = document.getElementById('mk-e'); const q = Number(v('mk-q').replace(',', '.'));
  if (v('mk-p').length < 2) { e.textContent = 'Ne lazım olduğunu yaz.'; return; } if (!(q > 0)) { e.textContent = 'Miktarı yaz.'; return; }
  if (MK.busy) return; MK.busy = true; const sh = gShopOK() ? S.settings.shop : {};
  const r = await sbClient().from('market_needs').insert({ business_id: SBS.biz.id, product: v('mk-p'), qty: q, unit: v('mk-u') || 'kg', deliver_by: v('mk-d') || null, contact: v('mk-c') || null, note: v('mk-n') || null, lat: sh.lat != null ? sh.lat : null, lng: sh.lng != null ? sh.lng : null });
  MK.busy = false; if (r.error) { e.textContent = sbMsg(r.error); return; } S.modal = null; MK.ok = false; toast('İlan yayınlandı.', 'ok'); render();
};
H.mkacc = async (el) => { if (MK.busy) return; MK.busy = true; const r = await sbClient().rpc('market_accept', { p_offer: el.dataset.id }); MK.busy = false; if (r.error) { toast(r.error.message, 'warn'); return; } toast('Teklif kabul edildi.', 'ok'); MK.ok = false; render(); };
H.mkclose = async (el) => { const r = await sbClient().from('market_needs').update({ status: 'kapali' }).eq('id', el.dataset.id); if (r.error) { toast(sbMsg(r.error), 'warn'); return; } MK.ok = false; render(); };
(function () { try { const st = document.createElement('style'); st.textContent = '.mk-h p{font-size:14px}.mk-n{gap:12px}.mk-o{border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;background:#fff}.mk-o.top{border-color:#bcd3f3;background:#f6faff}.mk-o.ok{border-color:#bfe3cc;background:#f1faf4}.mk-tp{display:flex;gap:6px;align-items:center;font-size:12.5px;font-weight:700;color:var(--cini)}.mk-oh{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.mk-oh b{display:block}.mk-oh small{display:block;color:var(--muted);font-size:13px;margin-top:2px}.mk-pr b{font-size:20px}.mk-pr span{color:var(--muted);font-size:13px;margin-left:6px}.mk-nt{margin:0;font-size:14px}.mk-w{margin:0;font-size:12.5px;color:var(--muted)}.mk-ac{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;background:#E8F6EE;color:#1d6b40;border-radius:12px;padding:10px 12px}.mk-n>.btn,.mk-o .btn{align-self:flex-start}.mk-n,.mk-o,.mk-h{text-align:left;align-items:stretch}.sa2-tb{grid-template-columns:repeat(auto-fit,minmax(104px,1fr))!important}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v121: Teslimat akışı (teslim onayı, ödeme bildirimi, puan, sorun) ===== */
MK.ord = []; MK.ordOk = false; MK.ordBusy = false;
const MK_ST = { onaylandi: ['Teslimat bekleniyor', 'p-info'], teslim_edildi: ['Üretici teslim etti', 'p-warn'], alindi: ['Ödeme bekleniyor', 'p-warn'], odendi: ['Ödendi', 'p-ok'], tamam: ['Tamamlandı', 'p-ok'], sorun: ['Sorun var', 'p-bad'] };
const mkRoleOK = () => !!(MARKET_ON && S.user && ['patron', 'mudur', 'muhasebeci'].includes(S.user.role) && sbClient() && SBS.biz);
async function mkOrdLoad(force) {
  if (!mkRoleOK() || MK.ordBusy || (MK.ordOk && !force)) return; MK.ordBusy = true; await new Promise((r) => setTimeout(r, 0));
  try { const r = await sbClient().rpc('market_orders_biz', { p_biz: SBS.biz.id }); MK.ord = r.error ? [] : (r.data || []); } catch (e) { MK.ord = []; }
  MK.ordOk = true; MK.ordBusy = false; if (S.saTab === 'ilan' || S.view === 'borc') render();
}
const mkStep = (st) => { const i = { onaylandi: 0, teslim_edildi: 1, alindi: 2, odendi: 3, tamam: 4, sorun: -1 }[st]; return `<div class="mk-sp" aria-hidden="true">${['Onay', 'Teslim', 'Ödeme', 'Tamam'].map((x, k) => `<span class="${i > k || (i === 4) ? 'd' : i === k ? 'c' : ''}"><i></i>${x}</span>`).join('')}</div>`; };
function mkOrd(o, canAll) {
  const st = MK_ST[o.status] || ['', '']; const p = [];
  if (canAll && ['onaylandi', 'teslim_edildi'].includes(o.status)) p.push(`<button class="btn sm" data-a="mkrecv" data-id="${o.id}">${ic('check', 15)} Teslim aldım</button>`);
  if (o.status === 'alindi') p.push(`<button class="btn sm" data-a="mkpay" data-id="${o.id}">${ic('wallet', 15)} Ödemeyi bildir</button>`);
  if (canAll && ['alindi', 'odendi', 'tamam'].includes(o.status) && !o.rated) p.push(`<button class="btn sm sec" data-a="mkrate" data-id="${o.id}">★ Puan ver</button>`);
  if (canAll && o.status === 'sorun' && o.issue_by === 'isletme') p.push(`<button class="btn sm sec" data-a="mkres" data-id="${o.id}">Sorun çözüldü</button>`);
  if (canAll && !['tamam', 'sorun'].includes(o.status)) p.push(`<button class="btn sm sec" data-a="mkiss" data-id="${o.id}">Sorun bildir</button>`);
  return `<div class="mk-o${o.status === 'sorun' ? ' bad' : o.status === 'tamam' ? ' ok' : ''}"><div class="mk-oh"><div><b>${esc(o.product)} · ${esc(String(o.received_qty || o.qty).replace('.', ','))} ${esc(o.unit)}</b><small>${esc(o.supplier_name)} · ${fmt(Number(o.total))}</small></div><span class="pill ${st[1]}">${st[0]}</span></div>${o.status === 'sorun' ? '' : mkStep(o.status)}
  ${o.phone && !['tamam'].includes(o.status) ? `<p class="mk-w">Üretici: ${esc(o.phone)}</p>` : ''}${o.status === 'sorun' ? `<p class="mk-nt"><b>${o.issue_by === 'uretici' ? 'Üretici' : 'İşletme'} bildirdi:</b> ${esc(o.issue || '')}</p>` : ''}
  ${o.pay_ref || o.doc_path ? `<p class="mk-w">Ödeme: ${esc(o.pay_date ? isoShort(o.pay_date) : '')}${o.pay_ref ? ' · ref ' + esc(o.pay_ref) : ''}${o.doc_path ? ` · <button class="mk-lk" data-a="mkdoc" data-p="${esc(o.doc_path)}">Dekontu aç</button>` : ''}</p>` : ''}
  ${p.length ? `<div class="row wrap" style="gap:8px">${p.join('')}</div>` : ''}</div>`;
}
const mkOrdSec = () => MK.ord.length ? `<section class="op-c mk-n"><div class="op-ch"><div><h3>Teslimatlar ve ödemeler</h3><span>Mal teslim alınmadan ödeme yapılmaz</span></div></div>${MK.ord.map((o) => mkOrd(o, ['patron', 'mudur'].includes(S.user.role))).join('')}</section>` : '';
{
  const _mv = mkView;
  mkView = function () { const h = _mv.apply(this, arguments); if (!mkOn()) return h; if (!MK.ordOk) mkOrdLoad(); const i = h.indexOf('<section class="op-c mk-n">'); const s = mkOrdSec(); return i < 0 ? h + s : h.slice(0, i) + s + h.slice(i); };
}
{
  const _hd = H.mkacc; H.mkacc = async function (el) { await _hd.call(this, el); MK.ordOk = false; };
  const _vb = borcAlacakHTML;
  borcAlacakHTML = function (role) {
    let h = _vb.apply(this, arguments); if (!mkRoleOK()) return h; if (!MK.ordOk) { mkOrdLoad(); return h; }
    const L = MK.ord.filter((o) => o.status === 'alindi'); if (!L.length) return h;
    const card = `<section class="bz-s2"><div class="bz-sh"><div><h3>Üretici ödemeleri</h3><p>${L.length} teslim alınmış sipariş ödeme bekliyor</p></div></div>${L.map((o) => `<div class="bz-c wn"><div class="bz-t"><div class="bz-n"><b>${esc(o.supplier_name)}</b><small>${esc(o.product)} · ${esc(String(o.received_qty || o.qty).replace('.', ','))} ${esc(o.unit)}</small></div><div class="bz-a"><b>${fmt(Number(o.total))}</b><span class="bz-w wn">Teslim alındı</span></div></div><div class="bz-f"><button class="btn sm bz-ok" data-a="mkpay" data-id="${o.id}">${ic('wallet', 15)} Ödemeyi bildir</button></div></div>`).join('')}</section>`;
    const i = h.lastIndexOf('</div>'); return h.slice(0, i) + card + h.slice(i);
  };
}
async function mkDo(id, act, a) { const r = await sbClient().rpc('market_order_act', Object.assign({ p_order: id, p_act: act }, a || {})); if (r.error) { const e = document.getElementById('mk-e'); if (e) e.textContent = r.error.message; else toast(r.error.message, 'warn'); return false; } S.modal = null; MK.ordOk = false; render(); return true; }
const mkOrdOf = (id) => MK.ord.find((x) => x.id === id) || {};
H.mkrecv = (el) => { S.modal = { type: 'mkrecv', id: el.dataset.id }; renderModal(); };
NEWM.mkrecv = (m) => { const o = mkOrdOf(m.id); return sheet('Teslim aldım', `<p class="muted">${esc(o.product)} · ${esc(o.supplier_name)}. Gelen miktar farklıysa düzelt, tutar buna göre hesaplanır.</p><div class="field"><label for="mk-rq">Teslim alınan miktar (${esc(o.unit)})</label><input id="mk-rq" inputmode="decimal" value="${esc(String(o.qty || ''))}"></div><div class="err" id="mk-e" role="alert"></div><button class="btn block" data-a="mkrecvok" data-id="${m.id}">Teslim aldığımı onayla</button>`); };
H.mkrecvok = (el) => { const q = Number(((document.getElementById('mk-rq') || {}).value || '').replace(',', '.')); if (!(q > 0)) { document.getElementById('mk-e').textContent = 'Miktarı yaz.'; return; } return mkDo(el.dataset.id, 'received', { p_qty: q }); };
H.mkpay = (el) => { S.modal = { type: 'mkpay', id: el.dataset.id }; renderModal(); };
NEWM.mkpay = (m) => { const o = mkOrdOf(m.id); return sheet('Ödemeyi bildir', `<p class="muted">${esc(o.supplier_name)} için havaleyi yaptıktan sonra bilgisini gir. Üretici ödemeyi görünce onaylar.</p><div class="field"><label for="mk-pa">Havale tutarı (₺)</label><input id="mk-pa" inputmode="decimal" value="${esc(String(o.total || ''))}"></div><div class="field"><label for="mk-pd">Havale tarihi</label><input type="date" id="mk-pd" value="${REF_ISO}"></div><div class="field"><label for="mk-pr">Dekont / referans no</label><input id="mk-pr" maxlength="60"></div><div class="field"><label for="mk-pf">Dekont fotoğrafı (isteğe bağlı)</label><input type="file" id="mk-pf" accept="image/*"></div><div class="err" id="mk-e" role="alert"></div><button class="btn block" data-a="mkpayok" data-id="${m.id}">Ödendi olarak kaydet</button>`); };
function mkResize(file) { return new Promise((ok, no) => { const fr = new FileReader(); fr.onerror = () => no(new Error('Dosya okunamadı.')); fr.onload = () => { const im = new Image(); im.onerror = () => no(new Error('Görsel açılamadı.')); im.onload = () => { const k = Math.min(1, 1400 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); c.toBlob((b) => (b ? ok(b) : no(new Error('Görsel işlenemedi.'))), 'image/jpeg', 0.75); }; im.src = fr.result; }; fr.readAsDataURL(file); }); }
H.mkpayok = async (el) => {
  if (MK.busy) return; const v = (id) => ((document.getElementById(id) || {}).value || '').trim(); const e = document.getElementById('mk-e'); const amt = trNum(v('mk-pa')); if (!(amt > 0)) { e.textContent = 'Tutarı yaz.'; return; }
  MK.busy = true; let path = null; const f = (document.getElementById('mk-pf') || {}).files; 
  if (f && f[0]) { try { const b = await mkResize(f[0]); path = el.dataset.id + '/' + Date.now() + '.jpg'; const u = await sbClient().storage.from('market-docs').upload(path, b, { contentType: 'image/jpeg' }); if (u.error) { path = null; toast('Dekont fotoğrafı yüklenemedi, ödeme bilgisi yine de kaydedilecek.', 'warn'); } } catch (x) { path = null; } }
  MK.busy = false; return mkDo(el.dataset.id, 'paid', { p_amount: amt, p_date: v('mk-pd') || null, p_text: v('mk-pr') || null, p_doc: path });
};
H.mkdoc = async (el) => { try { const r = await sbClient().storage.from('market-docs').createSignedUrl(el.dataset.p, 300); if (r.error) throw r.error; window.open(r.data.signedUrl, '_blank', 'noopener'); } catch (e) { toast('Dekont açılamadı.', 'warn'); } };
H.mkiss = (el) => { S.modal = { type: 'mkiss', id: el.dataset.id }; renderModal(); };
NEWM.mkiss = (m) => sheet('Sorun bildir', `<p class="muted">Kalite, eksik miktar, gecikme gibi. Karşı taraf görür, çözülünce sorunu kapatırsın.</p><div class="field"><label for="mk-it">Ne oldu?</label><input id="mk-it" maxlength="300" placeholder="Örn: 50 kg eksik geldi"></div><div class="err" id="mk-e" role="alert"></div><button class="btn block" data-a="mkissok" data-id="${m.id}">Bildir</button>`);
H.mkissok = (el) => mkDo(el.dataset.id, 'issue', { p_text: ((document.getElementById('mk-it') || {}).value || '').trim() });
H.mkres = (el) => mkDo(el.dataset.id, 'resolve');
H.mkrate = (el) => { S.modal = { type: 'mkrate', id: el.dataset.id, stars: 5 }; renderModal(); };
NEWM.mkrate = (m) => { const o = mkOrdOf(m.id); return sheet('Üreticiyi puanla', `<p class="muted">${esc(o.supplier_name)} · ${esc(o.product)}</p><div class="mk-st" role="group" aria-label="Yıldız">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-a="mkstar" data-v="${i}" aria-pressed="${m.stars >= i}">★</button>`).join('')}</div>
  <label class="mk-ck"><input type="checkbox" id="mk-ot" checked> Zamanında teslim etti</label><label class="mk-ck"><input type="checkbox" id="mk-fu" checked> Miktar ve kalite eksiksizdi</label><div class="field"><label for="mk-nt">Not (isteğe bağlı)</label><input id="mk-nt" maxlength="300"></div><div class="err" id="mk-e" role="alert"></div><button class="btn block" data-a="mkrateok" data-id="${m.id}">Puanı gönder</button>`); };
H.mkstar = (el) => { S.modal.stars = Number(el.dataset.v); document.querySelectorAll('.mk-st button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.v) <= S.modal.stars)); };
H.mkrateok = async (el) => { const r = await sbClient().rpc('market_rate', { p_order: el.dataset.id, p_stars: S.modal.stars || 5, p_on_time: !!document.getElementById('mk-ot').checked, p_complete: !!document.getElementById('mk-fu').checked, p_note: ((document.getElementById('mk-nt') || {}).value || '').trim() || null }); if (r.error) { document.getElementById('mk-e').textContent = r.error.message; return; } S.modal = null; MK.ordOk = false; toast('Puanın kaydedildi.', 'ok'); render(); };
(function () { try { const st = document.createElement('style'); st.textContent = '.mk-o.bad{border-color:#f0c2c8;background:#fdf4f5}.mk-sp{display:flex;gap:4px}.mk-sp span{flex:1;font-size:11.5px;color:var(--muted);display:flex;flex-direction:column;gap:4px}.mk-sp i{height:5px;border-radius:3px;background:#E1E8F2;display:block}.mk-sp .d i{background:#3a9d62}.mk-sp .c i{background:#E0A03A}.mk-sp .d,.mk-sp .c{color:var(--ink-2)}.mk-lk{border:0;background:none;color:var(--cini);font:inherit;text-decoration:underline;padding:0;cursor:pointer}.mk-st{display:flex;gap:6px;margin:6px 0 12px}.mk-st button{font-size:30px;line-height:1;border:0;background:none;color:#cfd7e3;cursor:pointer;padding:2px}.mk-st button[aria-pressed=true]{color:#e0a03a}.mk-ck{display:flex;gap:8px;align-items:center;margin:8px 0;font-size:15px}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v123: Kais, azalan üründen tek dokunuşla ilan açar ===== */
MK.pre = null;
const mkBase = (n) => String(n || '').split(' (')[0].trim();
function mkPreList() {
  try { return stockPlan().filter((p) => p.status === 'now' || (p.status === 'soon' && p.daily > 0 && p.left / p.daily <= 3)).sort((a, b) => (a.status === 'now' ? 0 : 1) - (b.status === 'now' ? 0 : 1)); } catch (e) { return []; }
}
{
  const _t = sa2Tips;
  sa2Tips = function (props) {
    const T = _t.apply(this, arguments); const r = S.user && S.user.role; if (!['patron', 'mudur'].includes(r)) return T;
    if (!MARKET_ON) return rfqTips(T);
    const L = mkPreList().slice(0, 2).map((p) => { const d = p.daily > 0 ? Math.max(0, Math.round(p.left / p.daily)) : null;
      return [p.status === 'now' ? 'r' : 'a', mkBase(p.st.name) + (d == null ? ' azaldı' : d < 1 ? ' bugün bitebilir' : ' yaklaşık ' + d + ' güne yeter'), 'Doğrudan üreticilerden teklif toplayıp en iyisini seçebilirsin. İlanı senin yerine hazırlarım.', 'mkpre', p.st.id, 'İlan aç']; });
    const ok = T.length === 1 && T[0][1] === 'Her şey yolunda'; return (ok ? [] : T).concat(L).slice(0, 8);
  };
}
H.mkpre = (el) => {
  const p = mkPreList().concat(stockPlan()).find((x) => x.st.id === el.dataset.id); if (!p) return;
  if (!mkOn()) { toast('İlan için önce Tedarikçi ekranından hesabına bağlan.', 'warn'); return; }
  const q = p.qty > 0 ? p.qty : Math.max(1, Math.round((p.daily || 1) * 7));
  MK.pre = { product: mkBase(p.st.name), qty: q, unit: p.st.unit || 'kg', note: p.st.name };
  S.saTab = 'ilan'; if (S.view !== 'satinalma') S.view = 'satinalma'; S.modal = { type: 'mknew' }; render();
};
{
  const _n = NEWM.mknew; const _h = H.mknew; const _ok = H.mkok;
  H.mknew = function () { MK.pre = null; return _h.apply(this, arguments); };
  H.mkok = async function () { const r = await _ok.apply(this, arguments); if (!S.modal) MK.pre = null; return r; };
  NEWM.mknew = function () {
    let h = _n.apply(this, arguments); const p = MK.pre; if (!p) return h;
    h = h.replace('id="mk-p" maxlength="80"', 'id="mk-p" maxlength="80" value="' + esc(p.product) + '"').replace('id="mk-q" inputmode="decimal"', 'id="mk-q" inputmode="decimal" value="' + esc(String(p.qty).replace('.', ',')) + '"').replace('id="mk-n" maxlength="300"', 'id="mk-n" maxlength="300" value="' + esc(p.note) + '"');
    if (!['kg', 'adet', 'L', 'koli', 'çuval'].includes(p.unit)) h = h.replace('</select></div></div>', '<option>' + esc(p.unit) + '</option></select></div></div>');
    return h.replace('<option>' + esc(p.unit) + '</option>', '<option selected>' + esc(p.unit) + '</option>');
  };
}

/* ===== v124: sade, tek tasarımlı giriş (tedarikçi aynı ekranda) ===== */
{
  const st = document.createElement('style'); st.textContent = `
.login.lx.lx2{display:flex!important;flex-direction:column;align-items:center;min-height:100%;padding:28px 16px 36px;background:linear-gradient(180deg,#E3ECF7 0,#F3F6FB 260px,#F3F6FB 100%)!important}
.lx2 .lx-hero{position:static!important;aspect-ratio:auto!important;background:none!important;min-height:0!important;height:auto!important;padding:0 0 18px!important;overflow:visible!important;display:block!important;width:100%;max-width:440px}
.lx2 .lx-hero::before,.lx2 .lx-hero::after{display:none!important;content:none!important}
.lx2 .lx-hero>*{position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:normal!important}
.lx2 .lx-copy,.lx2 .lx-art{display:none!important}
.lx2 .lx-brand{display:flex!important;align-items:center;gap:11px;color:#0E2B4D;font-size:21px;font-weight:700;letter-spacing:-.3px}
.lx2 .lx-brand svg{width:40px!important;height:40px!important;padding:8px;border-radius:12px;background:linear-gradient(160deg,#1363B8,#0A3F7A);box-shadow:0 6px 14px rgba(10,63,122,.25)}
.lx2 .lx-card{width:100%;max-width:440px;margin:0!important;padding:24px 20px 22px!important;border-radius:24px!important;background:#fff!important;border:1px solid #E3EAF3;box-shadow:0 12px 36px rgba(14,43,77,.08)!important;display:block!important}
.lx2 .lx-card h1{font-size:26px!important;letter-spacing:-.4px}
.lx2 .lx-sub{margin-top:4px!important;font-size:14.5px!important;color:var(--muted)}
.lx2 .lx-tabs{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(0,1fr));grid-auto-flow:column;gap:4px!important;margin:18px 0 18px!important;padding:4px;border-radius:15px;background:#EEF2F8}
.lx2 .lx-tabs button{flex-direction:row!important;justify-content:center;gap:6px!important;min-height:42px!important;padding:0 4px!important;border:0!important;border-radius:11px!important;background:transparent!important;box-shadow:none!important;color:var(--muted)}
.lx2 .lx-tabs button svg{width:18px!important;height:18px!important;margin:0!important;color:currentColor}
.lx2 .lx-tabs button b{font-size:13.5px!important;font-weight:600;color:currentColor!important}
.lx2 .lx-tabs button[aria-pressed=true]{background:#fff!important;color:var(--cini)!important;box-shadow:0 1px 4px rgba(14,43,77,.14)!important}
.lx2 .lx-in{min-height:50px;border-radius:14px}
.lx2 .lx-go{min-height:52px!important;border-radius:14px!important;font-size:17px!important;background:var(--cini)!important;box-shadow:0 6px 16px rgba(13,86,166,.28)!important}
.lx2 .lx-or{margin:0 8px!important;font-size:13px}
.lx2 .lx-alt,.lx2 .lx-demo{min-height:48px!important;padding:6px 12px!important;border-radius:14px!important;gap:8px!important}
.lx2 .lx-alt b,.lx2 .lx-demo b{font-size:15px!important}
.lx2 .lx-alt span,.lx2 .lx-demo span{display:none!important}
.lx2 .lx-alt{border:1.5px solid #CBD7E6!important;background:#fff!important}
.lx2 .lx-alt b{color:var(--cini)!important}
.lx2 .lx-alt svg,.lx2 .lx-demo svg{width:20px;height:20px}
.lx2 .lx-demo{background:#EEF2F8!important}
.lx2 .lx-more summary{font-size:13.5px;color:var(--muted);padding:6px 0;cursor:pointer;text-align:center;list-style:none}
.lx2 .lx-more summary::-webkit-details-marker{display:none}
.lx2 .lx-roles{margin-top:2px!important;gap:6px!important}
.lx2 .lx-roles button{border:1px solid #D5DEEA!important;border-radius:999px!important;background:#fff!important;padding:6px 14px!important;min-height:34px!important}
.lx2 .lx-out{margin-top:8px}
@media(min-width:900px){.login.lx.lx2{justify-content:center;padding:40px 16px}}
`; document.head.appendChild(st);
}
const _lg124 = loginHTML;
loginHTML = function () {
  let h = _lg124(); h = h.replace('<div class="login lx', '<div class="login lx lx2');
  h = h.replace(/<a class="lx-supq"[\s\S]*?<\/a>/, '').replace(/<div class="lx-rq">[\s\S]*?<\/div><\/div>/, ''); return h;
};
const lgSay = (t) => { S.loginErr = t; const e = document.getElementById('id-err'); if (e) e.textContent = t; };
const lgRem = () => { try { const e = (document.getElementById('id-em') || {}).value; if (e) localStorage.setItem('kp_lgem', e.trim()); } catch (x) {} };
H.lgtab = (el) => { S.lgEm = (document.getElementById('id-em') || {}).value || S.lgEm || ''; S.lgCreate = false; S.loginErr = ''; S.lgTab = el.dataset.v; try { localStorage.setItem('kp_lgtab', S.lgTab); } catch (x) {} render(); };
{ const _i = H.idin; H.idin = function () { lgRem(); return _i.apply(this, arguments); }; }
const supAuth = async (mode) => {
  const em = ((document.getElementById('id-em') || {}).value || '').trim(); const pw = (document.getElementById('id-pw') || {}).value || '';
  if (!/^\S+@\S+\.\S+$/.test(em)) return lgSay('Geçerli bir e-posta adresi yaz.');
  if (mode === 'new' && pw.length < 8) return lgSay('Şifre en az 8 karakter olmalı.');
  if (!pw) return lgSay('Şifreni yaz.');
  const c = sbClient(); if (!c) return lgSay('Bulut bağlantısı kullanılamıyor.'); lgSay(''); lgRem();
  try {
    if (mode === 'in') { const r = await c.auth.signInWithPassword({ email: em, password: pw }); if (r.error) throw r.error; location.href = '/tedarikci/'; return; }
    const r = await c.auth.signUp({ email: em, password: pw }); if (r.error) throw r.error;
    if (r.data && r.data.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length === 0) return lgSay('Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.');
    if (r.data && r.data.session) { location.href = '/tedarikci/'; return; }
    lgSay(em + ' adresine bir onay bağlantısı gönderdik. Tıkladıktan sonra buradan giriş yap. Gelmediyse spam klasörüne bak.');
  } catch (x) { const m = String((x && x.message) || x || ''); lgSay(/invalid login/i.test(m) ? 'E-posta ya da şifre yanlış.' : /not confirmed/i.test(m) ? 'E-postanı henüz onaylamadın. Gelen kutundaki bağlantıya tıkla.' : /already/i.test(m) ? 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.' : /rate limit|too many/i.test(m) ? 'Kısa sürede çok fazla deneme yapıldı. Birkaç dakika bekle.' : idMsg(x)); }
};
H.supin = () => supAuth('in'); H.supnew = () => supAuth('new');
if (typeof document !== 'undefined') {
  document.addEventListener('submit', (e) => { if (e.target && e.target.id === 'idform' && S.lgTab === 'sup') { e.preventDefault(); e.stopImmediatePropagation(); (S.lgCreate ? H.supnew : H.supin)(); } }, true);
  document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || S.lgTab !== 'sup') return; const t = e.target; if (!t || t.tagName !== 'INPUT' || !t.closest || !t.closest('#idform')) return; e.preventDefault(); e.stopImmediatePropagation(); (S.lgCreate ? H.supnew : H.supin)(); }, true);
}
try {
  const q = new URLSearchParams(location.search).get('t'); const last = localStorage.getItem('kp_lgtab'); const t = q === 'sup' ? 'sup' : last;
  if (['own', 'emp', 'sup'].includes(t) && (MARKET_ON || t !== 'sup')) S.lgTab = t;
  if (!S.lgEm) S.lgEm = localStorage.getItem('kp_lgem') || '';
  if (!S.user && sbOK()) render();
} catch (x) {}

/* ===== v125: Müdür Bugün sayfasında kompakt Operasyon kartı ===== */
{
  const st = document.createElement('style'); st.textContent = `
.opm{background:#fff;border:1px solid #E6ECF4;border-radius:20px;padding:14px 14px 6px;display:flex;flex-direction:column;gap:12px}
.opm-h{display:flex;align-items:center;gap:8px}.opm-h .ic{color:var(--cini)}
.opm-h h3{margin:0;font-size:16px;color:var(--ink)}.opm-h>span{margin-left:auto;font-size:12.5px;color:var(--muted)}
.opm-h button{border:0;background:#EEF3FA;color:var(--cini);font-weight:600;font-size:13px;border-radius:999px;padding:6px 12px;min-height:32px}
.opm-t{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.opm-k{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:9px 10px;border:1px solid #E6ECF4;border-radius:14px;background:#F8FAFD;text-align:left;font-family:inherit}
.opm-k b{font-size:19px;line-height:1.1;color:var(--ink);font-variant-numeric:tabular-nums}
.opm-k small{font-size:11px;line-height:1.2;color:var(--muted)}
.opm-k.w{background:#FFF8E6;border-color:#F6E2AE}.opm-k.w b{color:#8A5200}.opm-k.g b{color:#14804A}
.opm-l{display:flex;flex-direction:column}
.opm-r{display:flex;align-items:center;gap:10px;padding:10px 2px;border-top:1px solid #EEF2F7;text-align:left;background:none;border-left:0;border-right:0;border-bottom:0;font-family:inherit;width:100%}
.opm-r i{flex:none;width:8px;height:8px;border-radius:50%;background:#E09A12}.opm-r.r i{background:#D0443A}.opm-r.g i{background:#1E9E5A}.opm-r.i i{background:var(--cini)}
.opm-r div{flex:1;min-width:0}.opm-r b{display:block;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.opm-r span{display:block;font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.opm-r svg{flex:none;color:#9AA7BA}
.opm-m{border:0;background:none;color:var(--cini);font-weight:600;font-size:13px;padding:8px 2px 10px;text-align:left;font-family:inherit}
.opm-ok{margin:0;padding:2px 0 10px;font-size:13px;color:var(--muted)}
`; document.head.appendChild(st);
}
opMini = function () {
  const tips = opTips(); const stt = opStatus(); const on = stt.filter((x) => ['working', 'break', 'pending'].includes(x.a.state)).length; const ac = chkStat('ac');
  const nP = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length + REQS.filter((r) => r.st === 'bekliyor').length; const nA = mtOpen().length;
  const K = (cls, v, l, t) => `<button type="button" class="opm-k ${cls}" data-a="opgo" data-t="${t}"><b>${v}</b><small>${l}</small></button>`;
  const chev = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const row = (t) => { const inner = `<i></i><div><b>${esc(t[1])}</b><span>${esc(t[2])}</span></div>${t[3] ? chev : ''}`; return t[3] ? `<button type="button" class="opm-r ${t[0]}" data-a="${t[3]}" data-t="${t[4]}">${inner}</button>` : `<div class="opm-r ${t[0]}">${inner}</div>`; };
  return `<section class="opm"><div class="opm-h">${ic('sparkle', 18)}<h3>Operasyon</h3><span>${tips.length ? tips.length + ' konu' : 'Her şey yolunda'}</span><button type="button" data-a="opgo" data-t="ozet">Aç</button></div>
  <div class="opm-t">${K('', on + '/' + stt.length, 'Çalışıyor', 'ozet')}${K(ac.n && ac.d === ac.n ? 'g' : 'w', ac.d + '/' + ac.n, 'Açılış', 'liste')}${K(nA ? 'w' : 'g', nA, 'Arıza', 'ariza')}${K(nP ? 'w' : 'g', nP, 'Talep', 'talep')}</div>
  ${tips.length ? `<div class="opm-l">${tips.slice(0, 3).map(row).join('')}</div>${tips.length > 3 ? `<button type="button" class="opm-m" data-a="opgo" data-t="ozet">+${tips.length - 3} konu daha</button>` : '<div style="height:4px"></div>'}` : '<p class="opm-ok">Geç kalan, açık arıza ya da bekleyen talep yok.</p>'}</section>`;
};

/* ===== v126: Pazar yeri kapalı başlangıç: elle tedarikçi, Kais ile fiyat yükleme, tedarikçi karşılaştırma ===== */
if (!MARKET_ON) {
  const _sbc = sbCard; sbCard = function () { return ''; };
  const _nsup = NEWM.sup; NEWM.sup = function () { return _nsup.apply(this, arguments).replace('E-posta (tedarikçi paneline davet için)', 'E-posta (isteğe bağlı)').replace('Boş bırakırsan teklifleri elle girersin', 'Mesajlarda kullanılır'); };
}
function rfqTips(T) {
  const L = mkPreList().slice(0, 2).map((p) => { const d = p.daily > 0 ? Math.max(0, Math.round(p.left / p.daily)) : null;
    return [p.status === 'now' ? 'r' : 'a', mkBase(p.st.name) + (d == null ? ' azaldı' : d < 1 ? ' bugün bitebilir' : ' yaklaşık ' + d + ' güne yeter'), 'Kayıtlı tedarikçilerden teklif iste. Mesajı senin yerine hazırlarım, gelen fiyatlarda en ucuzu gösteririm.', 'rfqpre', p.st.id, 'Teklif iste']; });
  const ok = T.length === 1 && T[0][1] === 'Her şey yolunda'; return (ok ? [] : T).concat(L).slice(0, 8);
}
H.rfqpre = (el) => {
  const p = stockPlan().find((x) => x.st.id === el.dataset.id); if (!p) return;
  if (!SUPPLIERS.length) { S.view = 'satinalma'; S.saTab = 'tedarikci'; render(); toast('Önce bir tedarikçi ekle, sonra teklif isteyebilirsin.', 'warn'); return; }
  const sid = p.st.id; const open = RFQS.find((r) => r.status === 'acik' && r.lines.some((l) => l.sid === sid));
  S.view = 'satinalma'; S.saTab = 'teklif';
  if (open) { render(); toast('Bu ürün için açık bir teklif isteğin var. Gelen fiyatları gir.', 'ok'); return; }
  let sups = SUPPLIERS.filter((t) => t.items[sid] > 0).map((t) => t.id); if (!sups.length) sups = SUPPLIERS.map((t) => t.id);
  const qty = p.qty > 0 ? p.qty : Math.max(1, Math.ceil((p.st.min || 1) * 2 - p.st.qty));
  const r = { id: 'r' + (++seq), date: isoShort(REF_ISO), lines: [{ sid, name: p.st.name, unit: p.st.unit, qty }], sups, quotes: {}, status: 'acik' }; r.msg = rfqMsg(r); RFQS.unshift(r);
  auditAdd({ type: 'ord', text: 'Teklif istendi: ' + mkBase(p.st.name) + ', ' + sups.length + ' tedarikçi' }); render(); cpy(r.msg, 'Teklif mesajı kopyalandı. Tedarikçilere gönder.');
};
/* --- fiyat listesi yükleme --- */
const PL = { sup: '', nw: '', text: '', files: [], rows: [], err: '' };
const plN = (s) => String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(.*?\)/g, ' ').replace(/\b\d+([.,]\d+)?\s*(kg|gr|g|lt|l|ml|adet|cuval|koli)\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function plMatch(name) {
  const n = plN(name); if (!n) return null; const nt = new Set(n.split(' ').filter((x) => x.length > 1)); let best = null, bs = 0;
  STOCK.forEach((s) => { const m = plN(s.name); if (!m) return; let sc = 0;
    if (m === n) sc = 1; else if (Math.min(m.length, n.length) >= 3 && (m.includes(n) || n.includes(m))) sc = 0.85;
    else { const mt = new Set(m.split(' ').filter((x) => x.length > 1)); let c = 0; nt.forEach((x) => { if (mt.has(x)) c++; }); const u = new Set([...nt, ...mt]).size; sc = u ? c / u : 0; }
    if (sc > bs) { bs = sc; best = s; } });
  return bs >= 0.5 ? best : null;
}
function plParse(text) {
  const rows = []; String(text || '').split(/\n+/).forEach((ln) => {
    const t = ln.replace(/[•*·\u2022]/g, ' ').replace(/\s+/g, ' ').trim(); if (t.length < 3) return;
    const m = /^(.*?[^\d\s])[\s:\-–—=]*?((?:\d{1,3}(?:\.\d{3})+|\d{1,6})(?:[.,]\d{1,2})?)\s*(?:₺|tl|TL|lira)?\s*(?:\/\s*[a-zA-Zçğıöşü]+)?\s*$/.exec(t); if (!m) return;
    const raw = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(m[2]) ? m[2].replace(/\./g, '') : m[2]; const price = Number(raw.replace(',', '.')); const name = m[1].replace(/[\s:\-–—=]+$/, '').trim(); if (!(price > 0) || name.length < 2) return; rows.push({ ad: name, fiyat: price });
  }); return rows;
}
function plJson(txt) { const a = String(txt || '').indexOf('{'), b = String(txt || '').lastIndexOf('}'); if (a < 0 || b < a) return null; try { return JSON.parse(String(txt).slice(a, b + 1)); } catch (e) { return null; } }
async function plExtract(text, files) {
  if (!files.length) { const r = plParse(text); if (r.length >= 2) return r; }
  if (!aiReady()) { if (files.length) throw new Error('Fotoğraf ve PDF okumak için KaisPilot hesabınla giriş yapmalısın. Fiyatları metin olarak yapıştırabilirsin.'); throw new Error('Satır bulamadım. Her satıra ürün adı ve fiyat yaz, örnek: Süt 1L 42,50'); }
  const atts = await Promise.all(files.map(aiPrepFile)); const c = sbClient();
  const prompt = 'Bu tedarikçi fiyat listesinden (fotoğraf, PDF veya metin) ürünleri ve birim fiyatlarını çıkar. Yalnızca geçerli JSON döndür, başka bir şey yazma: {"urunler":[{"ad":"","birim":"","fiyat":0}]}. Fiyat sayı olsun (TL). Okunamayan satırı atla.' + (text ? '\n\nMetin:\n' + text : '');
  const r = await c.functions.invoke('kais-ai', { body: { business_id: SBS.biz.id, messages: [{ role: 'user', content: prompt }], context: {}, attachments: atts.map((a) => ({ type: a.type, media_type: a.media_type, data: a.data })) } });
  if (r.error || (r.data && r.data.error)) { const f = plParse(text); if (f.length) return f; throw new Error('Kais şu an okuyamadı. Fiyatları metin olarak yapıştırmayı dene.'); }
  const j = plJson(r.data && r.data.reply); const L = j && Array.isArray(j.urunler) ? j.urunler.map((x) => ({ ad: String(x.ad || ''), fiyat: Number(String(x.fiyat).replace(',', '.')) })).filter((x) => x.ad && x.fiyat > 0) : [];
  if (!L.length) throw new Error('Listede ürün ve fiyat bulamadım. Daha net bir fotoğraf dene ya da metin olarak yapıştır.'); return L;
}
function plKeep() { const g = (i) => document.getElementById(i); if (g('pl-sup')) { PL.sup = g('pl-sup').value; PL.nw = g('pl-new').value; PL.text = g('pl-text').value; } }
H.plopen = (el) => { PL.sup = (el && el.dataset && el.dataset.id) || (SUPPLIERS[0] ? SUPPLIERS[0].id : ''); PL.nw = ''; PL.text = ''; PL.files = []; PL.rows = []; PL.err = ''; S.modal = { type: 'pl', step: 'in' }; renderModal(); };
NEWM.pl = (m) => {
  if (m.step === 'busy') return sheet('Fiyat listesi', `<div class="iz-e">${ic('sparkle', 30)}<b>Kais okuyor</b><p>Birkaç saniye sürer.</p></div>`);
  if (m.step === 'res') {
    const opts = (sel) => '<option value="">Atla</option>' + STOCK.map((s) => `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${esc(sa2Short(s.name))}</option>`).join('');
    const n = PL.rows.filter((r) => r.sid).length;
    return sheet('Okunan fiyatlar', `<p class="muted small">${PL.rows.length} satır okudum, ${n} tanesini stoktaki ürünlerle eşledim. Kontrol et, yanlış olanı düzelt.</p><div class="pl-l">${PL.rows.map((r, i) => `<div class="pl-r"><div class="pl-n"><b>${esc(r.ad)}</b></div><select id="pl-m${i}" aria-label="Eşleşen ürün">${opts(r.sid)}</select><input id="pl-p${i}" inputmode="decimal" value="${String(r.fiyat).replace('.', ',')}" aria-label="Fiyat"></div>`).join('')}</div><div class="err" id="pl-err" role="alert"></div><button class="btn" data-a="plsave">Fiyatları kaydet</button>`);
  }
  return sheet('Fiyat listesi yükle', `<p class="muted small">Tedarikçinin fiyat listesinin fotoğrafını, PDF'ini ya da WhatsApp mesajını ver. Kais ürünleri ve fiyatları çıkarır, sen onaylarsın.</p>
  <div class="field"><label for="pl-sup">Hangi tedarikçi?</label><select id="pl-sup">${SUPPLIERS.map((t) => `<option value="${t.id}"${t.id === PL.sup ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}<option value="">Yeni tedarikçi</option></select></div>
  <div class="field"><label for="pl-new">Yeni tedarikçi adı</label><input id="pl-new" maxlength="60" value="${esc(PL.nw)}" placeholder="Sadece listede yoksa yaz"></div>
  <div class="field"><label>Fotoğraf ya da PDF</label><div class="row wrap">${PL.files.map((f, k) => `<span class="chip">${esc(f.name)} <button class="btn sm sec" data-a="plfrm" data-k="${k}" style="padding:0 6px">×</button></span>`).join('')}${PL.files.length < 3 ? `<label class="btn sm sec" for="pl-file" style="cursor:pointer">${ic('camera', 16)} Seç</label><input id="pl-file" type="file" accept="image/*,application/pdf" multiple data-ch="plfile" style="position:absolute;opacity:0;width:1px;height:1px">` : ''}</div></div>
  <div class="field"><label for="pl-text">Ya da mesajı yapıştır</label><textarea id="pl-text" rows="5" placeholder="Süt 1L 42,50&#10;Domates 38&#10;Un 50kg 1250">${esc(PL.text)}</textarea></div>
  <div class="err" id="pl-err" role="alert">${esc(PL.err)}</div><button class="btn" data-a="plread">Kais okusun</button>`);
};
H.plfrm = (el) => { plKeep(); PL.files.splice(+el.dataset.k, 1); renderModal(); };
{ const _oc = onChange; onChange = function (e) { const el = e.target; if (el && el.dataset && el.dataset.ch === 'plfile') { plKeep(); PL.files = PL.files.concat(Array.from(el.files || []).map((f) => ({ name: f.name, f }))).slice(0, 3); try { el.value = ''; } catch (x) {} renderModal(); return; } return _oc(e); }; }
H.plread = async () => {
  plKeep(); const err = (t) => { PL.err = t; const e = document.getElementById('pl-err'); if (e) e.textContent = t; };
  if (!PL.sup && !PL.nw.trim()) return err('Tedarikçiyi seç ya da yeni tedarikçinin adını yaz.');
  if (!PL.files.length && !PL.text.trim()) return err('Fotoğraf, PDF ya da yapıştırılmış mesaj ekle.');
  const m = { type: 'pl', step: 'busy' }; S.modal = m; renderModal();
  try {
    const rows = await plExtract(PL.text, PL.files.map((x) => x.f));
    PL.rows = rows.slice(0, 80).map((r) => { const s = plMatch(r.ad); return { ad: r.ad, fiyat: r.fiyat, sid: s ? s.id : '' }; }); PL.err = '';
    if (S.modal === m) { S.modal = { type: 'pl', step: 'res' }; renderModal(); }
  } catch (e) { PL.err = e.message || 'Okunamadı.'; if (S.modal === m) { S.modal = { type: 'pl', step: 'in' }; renderModal(); } }
};
H.plsave = () => {
  const g = (i) => document.getElementById(i); const items = {}; let n = 0;
  PL.rows.forEach((r, i) => { const sid = g('pl-m' + i).value; const v = trNum(g('pl-p' + i).value); if (sid && v > 0) { items[sid] = v; n++; } });
  if (!n) { g('pl-err').textContent = 'Eşleşen ürün yok. En az bir satırı bir ürünle eşle.'; return; }
  let sup = SUPPLIERS.find((t) => t.id === PL.sup);
  if (PL.nw.trim()) { sup = { id: 't' + (++seq), name: PL.nw.trim(), phone: '', email: '', lead: 2, minAmt: 0, items: {} }; SUPPLIERS.push(sup); }
  if (!sup) { g('pl-err').textContent = 'Tedarikçi seçilmedi.'; return; }
  Object.assign(sup.items, items); auditAdd({ type: 'ord', text: 'Fiyat listesi güncellendi: ' + sup.name + ', ' + n + ' ürün' });
  S.modal = null; S.view = 'satinalma'; S.saTab = 'kars'; render(); toast(sup.name + ': ' + n + ' ürünün fiyatı kaydedildi.', 'ok');
};
{ const _st = sa2Tedarikci; sa2Tedarikci = function () { return _st.apply(this, arguments).replace(`<button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button>`, `<span class="row" style="gap:6px"><button class="btn sm sec" data-a="plopen">${ic('sparkle', 16)} Fiyat yükle</button><button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button></span>`); }; }
/* --- karşılaştırma --- */
function karsRows() {
  let plan = []; try { plan = stockPlan(); } catch (e) {}
  return STOCK.map((st) => { const offs = offersOf(st.id).slice().sort((a, b) => a.items[st.id] - b.items[st.id]); const p = plan.find((x) => x.st.id === st.id); const pi = priceInfo(st); const last = (pi.last && pi.last.price) || st.cost || 0;
    const qty = p && p.qty > 0 ? p.qty : Math.max(0, Math.ceil((st.min || 0) * 2 - st.qty)); const best = offs[0] ? offs[0].items[st.id] : 0; const save = last > 0 && best > 0 && best < last ? (last - best) * qty : 0;
    return { st, offs, last, qty, best, save }; }).filter((r) => r.offs.length).sort((a, b) => (b.offs.length > 1) - (a.offs.length > 1) || b.save - a.save);
}
function karsView() {
  const R = karsRows(); const tot = R.reduce((a, r) => a + r.save, 0); const nCheap = R.filter((r) => r.save > 0).length;
  const head = `<section class="kr-hd"><div class="kr-t">${ic('sparkle', 18)}<div><b>Fiyat karşılaştırma</b><span>Tedarikçi fiyatlarını ürün ürün yan yana görürsün.</span></div></div><button class="btn sm" data-a="plopen">${ic('plus', 16)} Fiyat yükle</button></section>`;
  if (!R.length) return `<div class="stack-lg">${head}<div class="iz-e">${ic('tag', 30)}<b>Henüz fiyat yok</b><p>Tedarikçinin fiyat listesinin fotoğrafını ya da mesajını yükle, Kais ürünleri ve fiyatları çıkarsın.</p><button class="btn" data-a="plopen">Fiyat yükle</button></div></div>`;
  const sum = tot > 0 ? `<div class="callout">${ic('sparkle')}<div><b>${nCheap} üründe son alıştan daha ucuz seçenek var</b><p style="margin-top:2px">Alınacak miktarlarla olası tasarruf yaklaşık <b>${fmt0(tot)}</b>.</p></div></div>` : '';
  return `<div class="stack-lg">${head}${sum}${R.map((r) => {
    const rows = r.offs.map((t, i) => { const pr = t.items[r.st.id]; const pc = r.best > 0 ? Math.round((pr / r.best - 1) * 100) : 0; return `<div class="kr-o${i === 0 && r.offs.length > 1 ? ' best' : ''}"><div><b>${esc(t.name)}</b><small>${t.lead} gün teslim${t.minAmt ? ' · en az ' + fmt0(t.minAmt) : ''}</small></div><div class="kr-p"><b>${fmt(pr)}</b><small>${r.offs.length < 2 ? '' : i === 0 ? 'En ucuz' : '%' + pc + ' pahalı'}</small></div></div>`; }).join('');
    const note = r.save > 0 ? `<p class="kr-n">${ic('check', 14)} Son alıştan %${Math.round((1 - r.best / r.last) * 100)} ucuz${r.qty > 0 ? '. ' + fq(r.qty) + ' ' + esc(r.st.unit) + ' alırsan yaklaşık ' + fmt0(r.save) + ' tasarruf.' : '.'}</p>` : (r.offs.length < 2 ? `<p class="kr-n mute">Karşılaştırmak için ikinci bir tedarikçiden fiyat ekle.</p>` : '');
    return `<section class="kr-c"><div class="kr-h"><b>${esc(sa2Short(r.st.name))}</b><span>${r.last > 0 ? 'Son alış ' + fmt(r.last) + ' · ' : ''}${esc(r.st.unit)}</span></div>${rows}${note}<div class="kr-f"><button class="btn sm sec" data-a="rfqpre" data-id="${r.st.id}">Teklif iste</button></div></section>`; }).join('')}</div>`;
}
{
  const _v = viewSatinAlma;
  viewSatinAlma = function () {
    if (!MARKET_ON && S.saTab === 'ilan') S.saTab = 'siparis';
    let h = _v.apply(this, arguments); const k = '<div class="tq-sg sa2-tb" role="group" aria-label="Satın alma bölümleri">'; const i = h.indexOf(k); if (i < 0) return h;
    const j = h.indexOf('</div>', i); const btn = `<button data-a="satab" data-v="kars" aria-pressed="${S.saTab === 'kars'}">Karşılaştır</button>`;
    if (S.saTab !== 'kars') return h.slice(0, j) + btn + h.slice(j);
    return h.slice(0, i) + h.slice(i, j).replace(/aria-pressed="true"/g, 'aria-pressed="false"') + btn + '</div>' + karsView() + '</div>';
  };
}
(function () { try { const st = document.createElement('style'); st.textContent = '.kr-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.kr-t{display:flex;gap:10px;align-items:flex-start}.kr-t svg{color:var(--cini,#1d5fa8);margin-top:2px}.kr-t b{display:block;font-size:17px}.kr-t span{display:block;font-size:13px;color:var(--muted,#6b7480);margin-top:2px}.kr-c{background:var(--card,#fff);border:1px solid var(--line,#e6e9ee);border-radius:16px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:8px}.kr-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.kr-h b{font-size:16px}.kr-h span{font-size:12.5px;color:var(--muted,#6b7480)}.kr-o{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--bg2,#f4f6f9)}.kr-o.best{background:#e7f6ee;box-shadow:inset 0 0 0 1.5px #5fc08a}.kr-o b{font-size:14.5px}.kr-o small{display:block;font-size:12px;color:var(--muted,#6b7480);margin-top:1px}.kr-p{text-align:right}.kr-p b{font-size:16px;font-variant-numeric:tabular-nums}.kr-n{display:flex;gap:6px;align-items:center;font-size:13px;color:#1a7f4b;margin:0}.kr-n.mute{color:var(--muted,#6b7480)}.kr-f{display:flex;justify-content:flex-end}.pl-l{display:flex;flex-direction:column;gap:8px;margin:10px 0;max-height:46vh;overflow:auto}.pl-r{display:grid;grid-template-columns:1fr;gap:6px;padding:10px;border-radius:12px;background:var(--bg2,#f4f6f9)}.pl-r select,.pl-r input{width:100%;box-sizing:border-box;border:1px solid var(--line,#d9dfe8);border-radius:12px;padding:11px 12px;font:inherit;background:#fff;min-height:44px}.pl-n b{font-size:14px}@media(min-width:700px){.pl-r{grid-template-columns:1.2fr 1.2fr 110px;align-items:center}}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v127: Giriş ekranı: modern görünüm, açık demo rolleri, akıllı alanlar ===== */
{
  const st = document.createElement('style'); st.textContent = `
.login.lx.lx2{background:radial-gradient(520px 320px at 12% -4%,rgba(37,110,200,.16),transparent 70%),radial-gradient(460px 300px at 100% 8%,rgba(91,227,224,.16),transparent 70%),linear-gradient(180deg,#EAF1FA 0,#F4F7FC 320px,#F4F7FC 100%)!important}
.lx2 .lx-hero{padding-bottom:20px!important}
.lx2 .lx-brand{font-size:22px}
.lx2 .lx2-tag{margin:10px 0 0 51px;font-size:13.5px;color:#4A5C78;line-height:1.35}
.lx2 .lx-card{border:1px solid rgba(214,224,238,.9);box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 22px 50px rgba(14,43,77,.10)!important;animation:lx2up .5s cubic-bezier(.16,1,.3,1) both}
.lx2.lx2-shake .lx-card{animation:lx2sh .4s cubic-bezier(.36,.07,.19,.97) both}
@keyframes lx2up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes lx2sh{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}
.lx2 .lx-card h1{font-size:28px!important}
.lx2 .lx-tabs{padding:4px;background:#E9EFF7;box-shadow:inset 0 1px 2px rgba(14,43,77,.06)}
.lx2 .lx-tabs button{transition:background .2s,color .2s,box-shadow .2s;min-height:44px!important}
.lx2 .lx-tabs button[aria-pressed=true]{box-shadow:0 2px 8px rgba(14,43,77,.12)!important}
.lx2 .lx-f>label,.lx2 .lx-lr label{font-size:13.5px;font-weight:650;color:#23344F}
.lx2 .lx-in{min-height:54px;border-radius:15px;border:1.5px solid #D3DDEA;transition:border-color .15s,box-shadow .15s,background .15s}
.lx2 .lx-in:focus-within{border-color:#1D6FD0;box-shadow:0 0 0 4px rgba(29,111,208,.14)}
.lx2 .lx-in.ok{border-color:#3FB37F}
.lx2 .lx-in.ok::after{content:'';flex:none;width:20px;height:20px;border-radius:50%;background:#3FB37F url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E") center/14px no-repeat}
.lx2 .lx-go{background:linear-gradient(180deg,#1A6FCF 0,#0A4A93 100%)!important;box-shadow:0 10px 22px rgba(10,74,147,.32)!important;transition:transform .12s,box-shadow .2s,filter .2s;position:relative;overflow:hidden}
.lx2 .lx-go:hover{filter:brightness(1.05)}.lx2 .lx-go:active{transform:scale(.985)}
.lx2 .lx-go.lx2-busy{pointer-events:none;filter:saturate(.8)}
.lx2 .lx-go.lx2-busy>*{opacity:0}
.lx2 .lx-go.lx2-busy::after{content:'';position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:lx2spin .7s linear infinite}
@keyframes lx2spin{to{transform:rotate(360deg)}}
.lx2 .lx2-caps{display:flex;align-items:center;gap:6px;margin:6px 2px 0;font-size:12.5px;color:#9A5B00;font-weight:600}
.lx2 .lx2-sug{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0}
.lx2 .lx2-sug button{border:1px solid #CBD7E6;background:#F5F8FC;color:#27405F;border-radius:999px;padding:7px 12px;font-size:13.5px;font-weight:600;cursor:pointer;min-height:34px}
.lx2 .lx-alt{transition:background .15s,border-color .15s}.lx2 .lx-alt:hover{background:#F4F8FE!important;border-color:#9DB8DA!important}
.lx2 .lx-demo{display:flex!important;align-items:center;justify-content:flex-start!important;gap:12px!important;text-align:left;background:linear-gradient(135deg,#EEF4FC,#E6F6F5)!important;border:1px solid #D4E3F3!important;min-height:60px!important;padding:8px 14px!important}
.lx2 .lx-demo svg{flex:none;width:34px!important;height:34px!important;padding:8px;border-radius:50%;background:#fff;color:#1A6FCF;box-shadow:0 2px 8px rgba(14,43,77,.1)}
.lx2 .lx-demo div>b{display:block;font-size:15.5px!important;color:#14304F}
.lx2 .lx-demo div>span{display:block!important;font-size:12.5px;color:#58708E;font-weight:500;margin-top:1px}
.lx2 .lx-more2{margin-top:12px;text-align:center}
.lx2 .lx-more2>small{display:block;font-size:12.5px;color:#7A8AA2;margin-bottom:8px}
.lx2 .lx-more2 .lx-roles{display:flex;flex-wrap:wrap;justify-content:center;gap:8px!important}
.lx2 .lx-more2 .lx-roles button{border:1px solid #D3DDEA!important;background:#fff!important;color:#27405F!important;border-radius:999px!important;padding:8px 14px!important;font-size:13.5px!important;font-weight:600;min-height:38px;transition:background .15s,border-color .15s}
.lx2 .lx-more2 .lx-roles button:hover{background:#F0F6FD!important;border-color:#9DB8DA!important}
.lx2 .lg-yasal{margin-top:18px;font-size:12.5px;gap:2px 8px}.lx2 .lg-yasal a{text-decoration:none;color:#6F819B}.lx2 .lg-yasal a:hover{color:#1A6FCF}
`; document.head.appendChild(st);
}
{
  const _l = loginHTML;
  loginHTML = function () {
    let h = _l.apply(this, arguments); if (h.indexOf('lx2') < 0) return h;
    h = h.replace(/<details class="lx-more"><summary>[\s\S]*?<\/summary>/, '<div class="lx-more2"><small>Ya da bir rol seç</small>').replace('<div class="lx-roles"><button type="button" data-a="demo" data-id="u2">','<div class="lx-roles"><button type="button" data-a="demo" data-id="u1">Patron</button><button type="button" data-a="demo" data-id="u2">').replace('</details>', '</div>');
    h = h.replace('<span>Örnek verilerle sistemi keşfedin</span>', '<span>Kayıt gerekmez, 1 dakikada keşfet</span>');
    h = h.replace(/(<b>Demo hesabını dene<\/b>)(<span>[^<]*<\/span>)/, '<div style="flex:1;min-width:0">$1$2</div>');
    h = h.replace('<span>KaisPilot</span></div>', '<span>KaisPilot</span></div><p class="lx2-tag">İşletmeni tek yerden yönet.</p>');
    return h;
  };
}
if (typeof document !== 'undefined') {
  const DOMS = ['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'yahoo.com'];
  const q = (s) => document.querySelector(s);
  const sugClear = () => { const o = q('.lx2-sug'); if (o) o.remove(); };
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t || !t.closest || !t.closest('.lx2')) return;
    if (t.id === 'id-em' || t.id === 'em') {
      const v = t.value.trim(); const box = t.closest('.lx-in'); if (box) box.classList.toggle('ok', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      sugClear(); const m = /^([^\s@]+)@([^\s@.]*)$/.exec(v);
      if (m) { const L = DOMS.filter((d) => d.startsWith(m[2].toLowerCase())).slice(0, 4); if (L.length && !(L.length === 1 && L[0] === m[2].toLowerCase())) { const d = document.createElement('div'); d.className = 'lx2-sug'; d.innerHTML = L.map((x) => `<button type="button" data-dom="${x}">${m[1]}@${x}</button>`).join(''); const f = t.closest('.lx-f'); if (f) f.appendChild(d); } }
    }
  });
  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest('.lx2-sug button'); if (b) { const i = q('#id-em') || q('#em'); if (i) { i.value = b.textContent; i.dispatchEvent(new Event('input', { bubbles: true })); sugClear(); const p = q('#id-pw') || q('#pw'); if (p) p.focus(); } return; }
    const g = e.target && e.target.closest && e.target.closest('.lx2 .lx-go[data-a]'); if (!g || g.classList.contains('lx2-busy')) return;
    g.classList.add('lx2-busy'); const root = q('.lx2'); let n = 0;
    const iv = setInterval(() => { n++; const er = q('#id-err'); const msg = er && er.textContent.trim();
      if (!document.body.contains(g) || msg || n > 40) { clearInterval(iv); g.classList.remove('lx2-busy'); if (msg && root) { root.classList.remove('lx2-shake'); void root.offsetWidth; root.classList.add('lx2-shake'); } } }, 150);
  }, true);
  const capsChk = (e) => { const t = e.target; if (!t || t.type !== 'password' || !t.closest || !t.closest('.lx2') || !e.getModifierState) return; const on = e.getModifierState('CapsLock'); const f = t.closest('.lx-f'); if (!f) return; let w = f.querySelector('.lx2-caps'); if (on && !w) { w = document.createElement('div'); w.className = 'lx2-caps'; w.textContent = 'Caps Lock açık'; f.appendChild(w); } else if (!on && w) w.remove(); };
  document.addEventListener('keydown', capsChk); document.addEventListener('keyup', capsChk);
  try { new MutationObserver(() => { const r = q('.lx2'); if (!r || r.dataset.v127) return; r.dataset.v127 = '1';
    const em = q('#id-em') || q('#em'); if (em && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) { const b = em.closest('.lx-in'); if (b) b.classList.add('ok'); }
    if (window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches) { const p = q('#id-pw') || q('#pw'); const t = em && em.value.trim() ? p : em; if (t && !document.activeElement.matches('input')) t.focus(); } }).observe(document.body, { childList: true, subtree: true }); } catch (x) {}
}

/* ===== v128: Vardiya tablosu yana kaydırırken sütunlar karışmıyor ===== */
(function () { try { const st = document.createElement('style'); st.textContent = '.vd-gr .nm{align-self:stretch;display:flex;align-items:center;background:#fff;z-index:3;overflow:hidden;text-overflow:ellipsis;margin-right:-3px;padding-right:8px;box-shadow:7px 0 7px -7px rgba(20,50,100,.22)}.vd-gr>div:first-child{position:sticky;left:0;top:0;z-index:5;background:#fff;align-self:stretch;min-height:34px;margin-right:-3px}.vd-gr .dh{z-index:2}.vd-gr .dh.td{position:sticky;top:0}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v129: Patron ana sayfası: para özeti, onay kutusu, Kais uyarıları, haftalık özet, kısayollar ===== */
const PPW = { on: true, last: '' }; P_OBJ.push(['PPW', () => PPW]); P_SCOPE.PPW = 'ekip';
(function () { try { const st = document.createElement('style'); st.textContent = `
.pp-hero{position:relative;overflow:hidden;border-radius:22px;padding:18px 18px 16px;color:#fff;background:radial-gradient(120% 90% at 85% -10%,#3A86E0 0,transparent 55%),linear-gradient(160deg,#0F4C9A,#0A2F63);box-shadow:0 14px 30px -14px rgba(10,47,99,.55)}
.pp-hero small{display:block;font:600 12px system-ui;color:#BFD6F5;letter-spacing:.02em}.pp-net{font:800 34px/1.1 system-ui;letter-spacing:-.02em;margin:6px 0 2px;font-variant-numeric:tabular-nums}.pp-net.neg{color:#FFC9C4}
.pp-bar{display:flex;height:8px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.18);margin:12px 0 10px}.pp-bar i{display:block;background:#7FE0B0;transition:width .6s cubic-bezier(.2,.8,.2,1)}.pp-bar i+i{background:#FFB4AB}
.pp-io{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pp-io div{background:rgba(255,255,255,.1);border-radius:14px;padding:9px 12px}.pp-io span{display:block;font:600 11px system-ui;color:#BFD6F5}.pp-io b{font:700 16px system-ui;font-variant-numeric:tabular-nums}
.pp-q{display:flex;gap:8px;margin:2px 0 4px;overflow-x:auto;scrollbar-width:none;padding:2px 0}.pp-q::-webkit-scrollbar{display:none}.pp-q button{flex:0 0 auto;display:flex;align-items:center;gap:7px;border:1px solid #DDE5F1;background:#fff;border-radius:99px;padding:9px 14px;font:600 13px system-ui;color:#0E2B4D;cursor:pointer;transition:transform .12s,box-shadow .12s}.pp-q button:active{transform:scale(.96)}.pp-q button:hover{box-shadow:0 6px 14px -8px rgba(15,76,154,.5)}
.pp-box{margin-bottom:10px;border:1px solid #E1E8F3;background:#fff;border-radius:20px;padding:14px 14px 10px}.pp-h{display:flex;align-items:center;gap:9px;margin-bottom:8px}.pp-h h3{margin:0;font:700 16px system-ui;flex:1}.pp-n{background:#E8F1FD;color:#1B5FB8;border-radius:99px;font:700 12px system-ui;padding:3px 9px}
.pp-r{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #EEF2F8;width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;font:inherit;color:inherit}.pp-box>.pp-r:first-of-type{border-top:0}.pp-r .grow{min-width:0}.pp-r b{display:block;font:600 14px system-ui;color:#0E2B4D}.pp-r small{display:block;font:500 12px system-ui;color:#6B7A90;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pp-r .pp-ic{flex:0 0 34px;height:34px;border-radius:11px;display:grid;place-items:center;background:#EEF3FB;color:#1B5FB8}.pp-r .pp-ic.warn{background:#FFF3DC;color:#B26A00}.pp-r .pp-ic.bad{background:#FDE7E5;color:#C0392B}
.pp-b{display:flex;gap:6px}.pp-b button{border:0;border-radius:10px;padding:8px 12px;font:700 12px system-ui;cursor:pointer;background:#EEF3FB;color:#1B5FB8}.pp-b button.ok{background:#1B5FB8;color:#fff}
.pp-all{width:100%;margin-top:6px;border:0;border-radius:12px;padding:11px;background:#1B5FB8;color:#fff;font:700 14px system-ui;cursor:pointer}
.pp-wk{display:flex;align-items:center;gap:12px;border:1px solid #E1E8F3;background:linear-gradient(135deg,#F4F8FE,#fff);border-radius:20px;padding:14px}.pp-wk .grow{flex:1;min-width:0}.pp-wk b{display:block;font:700 14px system-ui;color:#0E2B4D}.pp-wk small{font:500 12px system-ui;color:#6B7A90}
.pp-sw{flex:0 0 46px;height:28px;border-radius:99px;border:0;background:#CBD5E4;position:relative;cursor:pointer;transition:background .2s}.pp-sw::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.25);transition:transform .2s}.pp-sw[aria-pressed=true]{background:#1B5FB8}.pp-sw[aria-pressed=true]::after{transform:translateX(18px)}
.pp-sh{border:0;background:#EEF3FB;color:#1B5FB8;border-radius:10px;padding:8px 11px;font:700 12px system-ui;cursor:pointer}
.pp-fade{animation:ppIn .5s cubic-bezier(.2,.8,.2,1) both}@keyframes ppIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
`; document.head.appendChild(st); } catch (e) {} })();
const ppHello = () => { const u = S.user || {}; const n = String(u.name || '').split(' ')[0]; const g = kaHello(); return (!n || /^(?:[iİ][şs]veren|patron)$/i.test(n)) ? g : g + ', ' + n; };
function ppAlerts() {
  const o = [];
  try { const al = priceAlerts(); if (al.length) o.push({ i: 'trend', t: 'bad', x: al.length + ' üründe fiyat artışı', s: 'Tedarikçi fiyatlarını karşılaştır', v: 'satinalma' }); } catch (e) {}
  try { const sk = sktSoon(3); if (sk.length) o.push({ i: 'clock', t: 'warn', x: sk.length + ' ürünün son kullanma tarihi yaklaştı', s: 'Önce bunları kullan ya da fiyatını düşür', v: 'stok' }); } catch (e) {}
  try { const t = totals(); if (t.out > t.in && t.out > 0) o.push({ i: 'alert', t: 'bad', x: 'Bu dönem giderin gelirini aştı', s: 'Net ' + fmt0(t.in - t.out) + ' · gider kalemlerine bak', v: 'muhasebe' }); } catch (e) {}
  return o;
}
function ppWeekText() {
  const t = totals(); const pr = pendingReceipts().length; const lv = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length; const al = ppAlerts();
  return 'KaisPilot haftalık özet\n' + PERIOD + '\nGelen: ' + fmt0(t.in) + '\nGiden: ' + fmt0(t.out) + '\nNet: ' + fmt0(t.in - t.out) + '\nOnay bekleyen: ' + (pr + lv) + (al.length ? '\nDikkat: ' + al.map((a) => a.x).join('; ') : '\nDikkat gerektiren bir şey yok.');
}
function ppHome() {
  const t = totals(); const net = t.in - t.out; const tot = (t.in + t.out) || 1; const empty = !t.in && !t.out;
  const hero = `<section class="pp-hero pp-fade"><small>${esc(ppHello())} · ${esc(PERIOD)}</small><div class="pp-net ${net < 0 ? 'neg' : ''}">${empty ? '₺0' : (net < 0 ? '−' : '') + fmt0(Math.abs(net))}</div><small>${empty ? 'Fiş ya da ekstre ekledikçe burada net durumun görünür' : 'Net durum'}</small>${empty ? '' : `<div class="pp-bar"><i style="width:${Math.round(t.in / tot * 100)}%"></i><i style="width:${Math.round(t.out / tot * 100)}%"></i></div><div class="pp-io"><div><span>Gelen</span><b>${fmt0(t.in)}</b></div><div><span>Giden</span><b>${fmt0(t.out)}</b></div></div>`}</section>`;
  const q = `<div class="pp-q pp-fade"><button type="button" data-a="nav" data-v="muhasebe">${ic('receipt', 16)}Fiş ekle</button>${ppAccChip()}<button type="button" data-a="nav" data-v="satinalma">${ic('box', 16)}Satın alma</button><button type="button" data-a="nav" data-v="kaisai">${ic('sparkle', 16)}Kais'e sor</button></div>`;
  const pr = pendingReceipts(); const lv = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)); const pa = (typeof pendingAtt === 'function') ? pendingAtt() : [];
  const n = pr.length + lv.length + pa.length;
  const recRow = (f) => `<div class="pp-r"><span class="pp-ic">${ic('receipt', 17)}</span><div class="grow"><b>${esc(f.seller)}</b><small>${esc(f.cat)} · ${fmt0(f.total)} · ${esc(f.date)}</small></div><div class="pp-b"><button type="button" data-a="reject" data-id="${f.id}">Reddet</button><button type="button" class="ok" data-a="approve" data-id="${f.id}">Onayla</button></div></div>`;
  const goRow = (ico, x, sv, v, sb) => `<button type="button" class="pp-r" data-a="nav" data-v="${v}" data-s="${sb}"><span class="pp-ic warn">${ic(ico, 17)}</span><div class="grow"><b>${esc(x)}</b><small>${esc(sv)}</small></div>${ic('chevron', 16)}</button>`;
  const box = n ? `<section class="pp-box pp-fade"><div class="pp-h"><h3>Onayını bekleyenler</h3><span class="pp-n">${n}</span></div>${pr.slice(0, 3).map(recRow).join('')}${pr.length > 3 ? goRow('receipt', (pr.length - 3) + ' fiş daha', 'Muhasebede gör', 'muhasebe', '') : ''}${lv.length ? goRow('clock', lv.length + ' izin talebi', byId(lv[0].uid).name + ': ' + lv[0].txt, 'ekip', 'talep') : ''}${pa.length ? goRow('clock', pa.length + ' mola dönüşü', 'Onayını bekliyor', 'ekip', 'bugun') : ''}${pr.length > 1 ? `<button type="button" class="pp-all" data-a="ppappall">${pr.length} fişi birden onayla</button>` : ''}</section>` : '';
  const al = ppAlerts();
  const albox = al.length ? `<section class="pp-box pp-fade"><div class="pp-h"><h3>Kais dikkat çekiyor</h3><span class="pp-n">${al.length}</span></div>${al.map((a) => `<button type="button" class="pp-r" data-a="nav" data-v="${a.v}"><span class="pp-ic ${a.t}">${ic(a.i, 17)}</span><div class="grow"><b>${esc(a.x)}</b><small>${esc(a.s)}</small></div>${ic('chevron', 16)}</button>`).join('')}</section>` : '';
  const wk = `<section class="pp-wk pp-fade"><span class="pp-ic" style="flex:0 0 38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#E8F1FD;color:#1B5FB8">${ic('mail', 18)}</span><div class="grow"><b>Haftalık özet</b><small>${PPW.on ? 'Pazartesi sabahı bildirim gelir' : 'Kapalı'}</small></div><button type="button" class="pp-sh" data-a="ppshare">Paylaş</button><button type="button" class="pp-sw" data-a="ppwk" aria-pressed="${PPW.on}" aria-label="Haftalık özet"></button></section>`;
  return hero + q + box + albox + wk;
}
H.ppwk = () => { PPW.on = !PPW.on; try { pSched(); } catch (e) {} render(); toast(PPW.on ? 'Haftalık özet açıldı.' : 'Haftalık özet kapatıldı.', 'ok'); };
H.ppshare = async () => { const tx = ppWeekText(); try { if (navigator.share) { await navigator.share({ text: tx }); return; } await navigator.clipboard.writeText(tx); toast('Özet kopyalandı.', 'ok'); } catch (e) {} };
H.ppappall = () => { if (typeof locked === 'function' && locked()) return; const l = pendingReceipts(); l.forEach((f) => { f.status = 'onayli'; }); render(); toast(l.length + ' fiş onaylandı.', 'ok'); };
function ppAccChip() {
  try { const T = typeof ID !== 'undefined' && ID.team; if (T && !T.err) { const m = T.members.find((x) => x.app_uid === 'u3'); if (m) return ''; const i = T.invites.find((x) => x.app_uid === 'u3'); if (i) return `<button type="button" data-a="ppinv">${ic('users', 16)}Muhasebeci daveti bekliyor</button>`; } } catch (e) {}
  return `<button type="button" data-a="ppinv">${ic('users', 16)}Muhasebeci davet et</button>`;
}
H.ppinv = () => { if (ID.active) { S.view = 'ekip'; S.sub.ekip = 'hesap'; render(); } else toast('Muhasebeci daveti işletme hesabıyla çalışır. Giriş yapınca buradan davet edebilirsin.'); };
const bugunPatronV129 = bugunPatron;
bugunPatron = function () { const h = bugunPatronV129(); const add = ppHome(); const m = h.match(/^\s*<div class="stack-lg dash">/); return m ? h.replace(m[0], m[0] + add) : h.replace(/<div class="stack-lg dash">/, '<div class="stack-lg dash">' + add); };
const kaCardV129 = kaCard;
kaCard = function () { const h = kaCardV129(); return h.replace(/(<h3>(?:İyi geceler|Günaydın|İyi günler|İyi akşamlar)) (?:İşveren|Patron)<\/h3>/, '$1</h3>'); };
(function () { const n = NAV.patron; const f = (id, more) => { const x = n.find((y) => y[0] === id); if (x) { if (more) x[3] = 'more'; else x.length = 3; } }; f('musteri', true); f('kaisai', false); const i = n.findIndex((y) => y[0] === 'kaisai'); if (i > 3) n.splice(3, 0, n.splice(i, 1)[0]); })();

const kbTidyV129 = kbTidy;
kbTidy = function () { const r = kbTidyV129.apply(this, arguments); try { const m = document.querySelector('main'); if (m && S.user && S.user.role === 'patron' && S.view === 'bugun') { const f = m.firstElementChild; Array.from(m.querySelectorAll('.dash>.pp-hero,.dash>.pp-q,.dash>.pp-box')).forEach((e) => m.insertBefore(e, f)); } } catch (e) {} return r; };

