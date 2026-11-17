/* ===== v72: Resmi tatiller + akıllı vardiya sistemi ===== */
{const st=document.createElement('style'); st.textContent=`
.vd-gr{display:grid;gap:3px;min-width:max-content;align-items:center}
.vd-gr .nm{font:600 13px system-ui;position:sticky;left:0;background:#fff;padding-right:8px;z-index:1;white-space:nowrap}
.vd-gr .dh{font:600 11px system-ui;color:var(--ink-2);text-align:center;line-height:1.2}.vd-gr .dh small{display:block;font-weight:500;color:#9AA7BA}.vd-gr .dh.we{color:#B3BCC9}.vd-gr .dh.td{color:#fff;background:var(--cini);border-radius:8px}.vd-gr .dh.td small{color:#DCE8FA}.vd-gr .dh.hl{color:#C0392B}.vd-gr .dh.hl small{color:#C0392B;font-weight:700}
.vd-gr .vc{height:32px;min-width:32px;border:0;border-radius:8px;color:#fff;font:700 11px system-ui;cursor:pointer;padding:0;transition:transform .12s}.vd-gr .vc:hover{transform:scale(1.12)}
.vd-gr .vc.e{background:#F2F5FA;color:#B3BCC9}.vd-gr .vc.o{background:#E4E9F2;color:#7A8799}.vd-gr .vc.l{background:#CFE1FA;color:#2B67C4}.vd-gr .vc.h{background:repeating-linear-gradient(45deg,#E6E9EF 0 4px,#F5F6F9 4px 8px);color:#8B95A5;cursor:default}.vd-gr .vc.t{box-shadow:0 0 0 2px var(--cini) inset}
.vd-gr .cv{font:700 12px system-ui;text-align:center;color:#2F9E5F}.vd-gr .cv.b{color:#D9534F}
.vd-tb{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 12px}.vd-tb .btn{min-height:40px;border-radius:12px;font-size:13.5px}
.vd-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);margin-top:10px}.vd-lg i{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:5px;vertical-align:-2px}
.vd-ins{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;scrollbar-width:thin}
.vd-in{display:flex;gap:10px;align-items:flex-start;border-radius:14px;padding:10px 12px;font-size:13.5px;background:#F2F6FC}.vd-in.bad{background:#FDECEA;color:#9A2F2A}.vd-in.warn{background:#FDF1DC;color:#8F5A00}.vd-in.ok{background:#E8F6EE;color:#1F6B42}
.vd-hs{padding:14px 16px}.vd-hh{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.vd-hh h2{margin:0;font-size:16px}.vd-cl{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-2)}.vd-hcs{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.vd-hc{background:#FBE3E0;color:#8E2D26;border-radius:99px;padding:5px 12px;font-size:12.5px}.vd-hc b{margin-right:6px}.vd-hc.hf{background:#FDF1DC;color:#8F5A00}.iz-gr .c.hh{background:#FDF1DC}
.vd-hl{display:flex;flex-direction:column;gap:6px;margin:8px 0}.vd-hl div{display:flex;justify-content:space-between;gap:10px;font-size:14px;padding:7px 0;border-top:1px solid #EDF1F7}.vd-hl div:first-child{border-top:0}.vd-hl span{color:var(--ink-2);font-size:12.5px}
.vd-tp{display:grid;grid-template-columns:1fr 90px 90px 40px;gap:8px;align-items:center;margin-bottom:8px}.vd-tp input{min-height:42px;border:1px solid #D8E1EE;border-radius:12px;padding:0 10px;font:inherit;width:100%;box-sizing:border-box}.vd-tp button{height:40px;border:1px solid #E1E8F2;border-radius:12px;background:#fff}
.vd-ch{display:grid;gap:8px;margin:10px 0}.vd-ch button{display:flex;align-items:center;gap:10px;border:1px solid #E1E8F2;background:#fff;border-radius:14px;padding:12px;font:600 14px inherit;font-family:inherit;color:var(--ink);text-align:left}.vd-ch button i{width:14px;height:14px;border-radius:5px;flex:none}.vd-ch button[aria-pressed=true]{border-color:var(--cini);box-shadow:0 0 0 2px #CFE0F7}.vd-ch button span{margin-left:auto;font-weight:500;color:var(--ink-2);font-size:13px}
.vd-em{border-radius:18px;padding:14px;background:linear-gradient(135deg,#EAF2FE,#F6F9FF);border:1px solid #D7E6FB}.vd-em h3{margin:0 0 2px;font-size:16px}.vd-em .big{font-size:22px;font-weight:800;margin:6px 0}.vd-em .ls{display:flex;gap:8px;overflow-x:auto;padding:6px 0 4px;scrollbar-width:thin}.vd-em .ls div{flex:none;min-width:84px;background:#fff;border-radius:12px;padding:8px 10px;font-size:12px;color:var(--ink-2);text-align:center;border:1px solid #E1E8F2}.vd-em .ls div b{display:block;color:var(--ink);font-size:13.5px;margin-top:2px}
.iz-gr .dh.hl,.iz-gr .dh.hl{color:#C0392B}.iz-gr .c.hd{background:#FBE3E0}.iz-gr .c.hc{background:repeating-linear-gradient(45deg,#E6E9EF 0 4px,#F5F6F9 4px 8px)}
`; document.head.appendChild(st);}
const VD_MON = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const VD_DAY = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
const vdP = (n) => String(n).padStart(2, '0');
const vdYmd = (y, m, d) => y + '-' + vdP(m + 1) + '-' + vdP(d);
const vdYm = (y, m) => y + '-' + vdP(m + 1);
const VD_T = [{ id: 't1', n: 'Sabah', s: '08:00', e: '16:00', c: '#E99A2B' }, { id: 't2', n: 'Gün', s: '10:00', e: '18:00', c: '#3F86DD' }, { id: 't3', n: 'Akşam', s: '16:00', e: '00:00', c: '#7C5CCF' }];
const VD_F = {}, VD_M = {}, VD_SENT = {}, VD_LOC = {};
P_ARR.push(['VD_T', () => VD_T]); P_OBJ.push(['VD_F', () => VD_F], ['VD_M', () => VD_M], ['VD_SENT', () => VD_SENT]); ['VD_T', 'VD_F', 'VD_M', 'VD_SENT'].forEach((k) => { P_SCOPE[k] = 'ekip'; });
const vdSave = () => { try { pSched(); } catch (e) {} };
/* resmi tatiller */
const VD_HC = {};
function vdHolMap(y) {
  if (VD_HC[y]) return VD_HC[y]; const M = {}; const add = (m, d, n, half, est) => { M[vdP(m) + '-' + vdP(d)] = { n, half: !!half, est: !!est }; };
  add(1, 1, 'Yılbaşı'); add(4, 23, 'Ulusal Egemenlik ve Çocuk Bayramı'); add(5, 1, 'Emek ve Dayanışma Günü'); add(5, 19, "Atatürk'ü Anma, Gençlik ve Spor Bayramı"); add(7, 15, 'Demokrasi ve Milli Birlik Günü'); add(8, 30, 'Zafer Bayramı'); add(10, 28, 'Cumhuriyet Bayramı arifesi', 1); add(10, 29, 'Cumhuriyet Bayramı');
  const R = { 2026: { r: [3, 20], ra: [3, 19], k: [5, 27], ka: [5, 26], e: 0 }, 2027: { r: [3, 9], ra: [3, 8], k: [5, 16], ka: [5, 15], e: 1 } }[y];
  if (R) { add(R.ra[0], R.ra[1], 'Ramazan Bayramı arifesi', 1, R.e); for (let i = 0; i < 3; i++) add(R.r[0], R.r[1] + i, 'Ramazan Bayramı ' + (i + 1) + '. gün', 0, R.e); add(R.ka[0], R.ka[1], 'Kurban Bayramı arifesi', 1, R.e); for (let i = 0; i < 4; i++) add(R.k[0], R.k[1] + i, 'Kurban Bayramı ' + (i + 1) + '. gün', 0, R.e); }
  VD_HC[y] = M; return M;
}
const vdHol = (y, m, d) => vdHolMap(y)[vdP(m + 1) + '-' + vdP(d)] || null;
const vdHolMonth = (y, m) => { const o = []; for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) { const h = vdHol(y, m, d); if (h) o.push(Object.assign({ d }, h)); } return o; };
const vdHolFull = (y, m, d) => { const h = vdHol(y, m, d); return h && !h.half ? h : null; };
function vdHolCard(y, m) {
  const L = vdHolMonth(y, m); const cl = !!S.settings.holClosed; const G = [];
  L.forEach((h) => { const k = h.n.replace(/ \d+\. gün$/, ''); const g = G[G.length - 1]; if (g && g.k === k && g.e + 1 === h.d && !h.half) { g.e = h.d; } else G.push({ k, s: h.d, e: h.d, half: h.half, est: h.est }); });
  const chips = G.map((g) => `<span class="vd-hc${g.half ? ' hf' : ''}"><b>${g.s === g.e ? g.s : g.s + '–' + g.e} ${VD_MON[m]}</b>${esc(g.k)}${g.half ? ' · yarım gün' : ''}${g.est ? ' · tahmini' : ''}</span>`).join('');
  const yr = !vdHolMap(y)['03-20'] && !vdHolMap(y)['05-27'] && y !== 2026 && y !== 2027;
  return `<section class="mg-card vd-hs"><div class="vd-hh"><h2>${VD_MON[m]} resmi tatilleri</h2><label class="vd-cl"><span>İş yerim tatillerde kapalı</span><button class="sw" role="switch" aria-checked="${cl}" aria-label="Resmi tatilde kapalı" data-a="toggle" data-k="holClosed"></button></label></div>${L.length ? `<div class="vd-hcs">${chips}</div>` : '<p class="muted small" style="margin:6px 0 0">Bu ay resmi tatil yok.</p>'}<p class="small muted" style="margin:8px 0 0">${cl ? 'Kapalıyken tatil günlerinde herkes otomatik izinli sayılır, uyarı çıkmaz.' : 'Açıkken tatil gününe izin verirsen Kais uyarır.'}${yr ? ' Bu yılın dini bayram tarihleri henüz eklenmedi.' : ''}</p></section>`;
}
/* resmi tatile izin uyarısı */
function vdHolWarn(txt) {
  if (S.settings.holClosed) return ''; let q = null; try { q = izOrd(txt); } catch (e) {} if (!q) return ''; const y = new Date().getFullYear(); const hs = [];
  for (let o = q[0]; o <= q[1] && o - q[0] < 60; o++) { const m = Math.floor(o / 40), d = o % 40; if (d < 1 || d > 31 || m > 11) continue; const h = vdHolFull(y, m, d); if (h) hs.push(d + ' ' + VD_MON[m] + ' (' + h.n + ')'); }
  return hs.length ? `<b>${hs.slice(0, 3).join(', ')}</b> resmi tatile denk geliyor. Resmi tatillerde müşteri yoğunluğu artabilir. Bu günlerde izin vermek istediğine emin misin? ` : '';
}
{const _lv = H.lvok; H.lvok = (el) => { const g = (i) => document.getElementById(i); const txt = ((g('lv-txt') || {}).value || '').trim(); const w = vdLeaveWarn(el.dataset.id, txt);
  if (w && S.holAck !== txt) { S.holAck = txt; const e = g('lv-err'); if (e) { e.innerHTML = w; e.style.color = '#B26B00'; } if (el && el.textContent) el.textContent = 'Yine de onayla'; return; }
  S.holAck = null; const e = g('lv-err'); if (e) e.style.color = ''; return _lv(el); };
 const _lf = H.lrfinal; H.lrfinal = (el) => { const r = S.modal && LVREQ.find((x) => x.id === S.modal.id); const txt = r ? lrEff(r).txt : ''; const w = vdLeaveWarn(r ? r.uid : '', txt); const g = (i) => document.getElementById(i);
  if (w && S.holAck !== txt) { S.holAck = txt; const e = g('la-err'); if (e) { e.innerHTML = w; e.style.color = '#B26B00'; } if (el && el.textContent) el.textContent = 'Yine de onayla'; return; }
  S.holAck = null; const e = g('la-err'); if (e) e.style.color = ''; return _lf(el); };}
/* vardiya çekirdeği */
const vdNeed = () => { const n = new Date(); const c = vdPub(n.getFullYear(), n.getMonth()); const nm = new Date(n.getFullYear(), n.getMonth() + 1, 1); return !c || (n.getDate() >= 20 && !vdPub(nm.getFullYear(), nm.getMonth())); };
const vdTpl = (id) => VD_T.find((t) => t.id === id);
const vdHours = (t) => { const a = t.s.split(':').map(Number), b = t.e.split(':').map(Number); let m = b[0] * 60 + b[1] - (a[0] * 60 + a[1]); if (m <= 0) m += 1440; return m / 60; };
const vdEnd = (t) => (t.e === '00:00' ? '24:00' : t.e);
const vdAsg = (ds, uid) => (VD_F[ds] || {})[uid] || '';
function vdSet(ds, uid, v) { if (!v) { if (VD_F[ds]) { delete VD_F[ds][uid]; if (!Object.keys(VD_F[ds]).length) delete VD_F[ds]; } } else { (VD_F[ds] = VD_F[ds] || {})[uid] = v; } }
function vdOnLeave(uid, m, d) { const o = m * 40 + d; return ekLeaves(uid).some((x) => { if (x.st !== 'onayli') return false; const q = ekRange(x); return q && q[0] <= o && o <= q[1]; }); }
function vdState(y, m, d, uid) {
  if (S.settings.holClosed && vdHolFull(y, m, d)) return { k: 'hol' };
  if (vdOnLeave(uid, m, d)) return { k: 'leave' };
  const v = vdAsg(vdYmd(y, m, d), uid); const t = vdTpl(v); if (t) return { k: 'shift', t }; if (v === 'off') return { k: 'off' }; return { k: 'none' };
}
const vdMon0 = (y, m) => (new Date(y, m, 1).getDay() + 6) % 7;
function vdAuto(y, m) {
  const n = EMP_IDS.length, dim = new Date(y, m + 1, 0).getDate(), T = VD_T; if (!T.length || !n) return 0; const off0 = vdMon0(y, m);
  for (let d = 1; d <= dim; d++) { const ds = vdYmd(y, m, d); delete VD_F[ds]; }
  const maxH = Math.max(...T.map(vdHours)); const two = maxH * 6 > 45;
  EMP_IDS.forEach((id, i) => { const offDow = Math.floor(i * 7 / n) % 7, offDow2 = (offDow + 3) % 7;
    for (let d = 1; d <= dim; d++) { const dow = (new Date(y, m, d).getDay() + 6) % 7, wi = Math.floor((d + off0 - 1) / 7);
      if (dow === offDow || (two && dow === offDow2)) vdSet(vdYmd(y, m, d), id, 'off'); else vdSet(vdYmd(y, m, d), id, T[(i + wi) % T.length].id); } });
  return dim;
}
function vdInsights(y, m) {
  const dim = new Date(y, m + 1, 0).getDate(), out = [], min = Number(S.settings.shMin) || 1, off0 = vdMon0(y, m); const gaps = []; let any = false;
  for (let d = 1; d <= dim; d++) { if (VD_F[vdYmd(y, m, d)]) any = true; if (S.settings.holClosed && vdHolFull(y, m, d)) continue; const c = EMP_IDS.filter((id) => vdState(y, m, d, id).k === 'shift').length; if (any && c < min) gaps.push(d); }
  if (!any) return [{ t: 'warn', x: `${VD_MON[m]} için plan yok. "Kais planlasın" ile ekibe göre adil bir plan çıkarabilirsin.` }];
  if (gaps.length) out.push({ t: 'bad', x: `${gaps.slice(0, 6).join(', ')}${gaps.length > 6 ? ' +' + (gaps.length - 6) : ''} ${VD_MON[m]} günlerinde en az ${min} kişi gerekirken kadro yetersiz.` });
  EMP_IDS.forEach((id) => { const W = {}; for (let d = 1; d <= dim; d++) { const s = vdState(y, m, d, id); if (s.k === 'shift') { const w = Math.floor((d + off0 - 1) / 7); W[w] = (W[w] || 0) + vdHours(s.t); } } const bad = Object.keys(W).filter((w) => W[w] > 45); if (bad.length) out.push({ t: 'warn', x: `${byId(id).name}: ${bad.map((w) => Number(w) + 1).join(', ')}. haftalar ${Math.max(...bad.map((w) => W[w]))} saate çıkıyor. Yasal haftalık sınır 45 saat, fazlası %50 zamlı ödenir.` }); });
  vdHolMonth(y, m).filter((h) => !h.half).forEach((h) => { if (S.settings.holClosed) return; const c = EMP_IDS.filter((id) => vdState(y, m, h.d, id).k === 'shift').length; out.push({ t: c ? 'info' : 'warn', x: `${h.d} ${VD_MON[m]} ${h.n}: ${c ? c + ' kişi çalışıyor. Yoğun gün olabilir.' : 'kimse çalışmıyor. İş yerin açıksa kadro koy.'}` }); });
  if (!out.length) out.push({ t: 'ok', x: 'Plan dengeli. Kadro, haftalık saat ve izinler uyumlu.' });
  return out;
}
S.vdM = S.vdM || 0; H.vdm = (el) => { S.vdM = (S.vdM || 0) + Number(el.dataset.v); render(); }; H.vdm0 = () => { S.vdM = 0; render(); };
const vdBase = () => { const n = new Date(); const b = new Date(n.getFullYear(), n.getMonth() + (S.vdM || 0), 1); return [b.getFullYear(), b.getMonth()]; };
function vdView(segH) {
  const [y, m] = vdBase(); const dim = new Date(y, m + 1, 0).getDate(), now = new Date(), today = now.getFullYear() === y && now.getMonth() === m ? now.getDate() : -1; const ym = vdYm(y, m), meta = VD_M[ym], pub = !!(meta && meta.pub);
  const heads = Array.from({ length: dim }, (_, i) => { const d = i + 1, dw = new Date(y, m, d).getDay(), h = vdHolFull(y, m, d); return `<div class="dh${[0, 6].includes(dw) ? ' we' : ''}${d === today ? ' td' : ''}${h ? ' hl' : ''}" title="${h ? esc(h.n) : ''}">${d}<small>${VD_DAY[dw]}</small></div>`; }).join('');
  const rows = EMP_IDS.map((id) => `<div class="nm">${esc(byId(id).name)}</div>${Array.from({ length: dim }, (_, i) => { const d = i + 1, s = vdState(y, m, d, id), t = d === today ? ' t' : ''; const ds = vdYmd(y, m, d);
    if (s.k === 'hol') return `<div class="vc h${t}" title="${esc(vdHolFull(y, m, d).n)}: iş yeri kapalı">T</div>`;
    if (s.k === 'leave') return `<button class="vc l${t}" data-a="vdcell" data-id="${id}" data-d="${ds}" title="İzinli">İ</button>`;
    if (s.k === 'shift') return `<button class="vc${t}" style="background:${s.t.c}" data-a="vdcell" data-id="${id}" data-d="${ds}" title="${esc(s.t.n + ' ' + s.t.s + '–' + vdEnd(s.t))}">${esc(s.t.n[0])}</button>`;
    if (s.k === 'off') return `<button class="vc o${t}" data-a="vdcell" data-id="${id}" data-d="${ds}" title="Haftalık izin">H</button>`;
    return `<button class="vc e${t}" data-a="vdcell" data-id="${id}" data-d="${ds}" title="Boş">+</button>`; }).join('')}`).join('');
  const min = Number(S.settings.shMin) || 1; const cov = Array.from({ length: dim }, (_, i) => { const d = i + 1; if (S.settings.holClosed && vdHolFull(y, m, d)) return '<div class="cv">–</div>'; const c = EMP_IDS.filter((id) => vdState(y, m, d, id).k === 'shift').length; return `<div class="cv${c < min ? ' b' : ''}">${c}</div>`; }).join('');
  const ins = vdInsights(y, m); const nAs = Array.from({ length: dim }, (_, i) => VD_F[vdYmd(y, m, i + 1)]).filter(Boolean).length;
  const tw2 = (k, t, sub) => { const on = S.settings[k] !== false; return `<div class="toggle"><div><b style="font-weight:600">${t}</b><div class="small muted">${sub}</div></div><button class="sw" role="switch" aria-checked="${on}" aria-label="${t}" data-a="vdtog" data-k="${k}"></button></div>`; };
  const bar = `<div class="vd-tb"><button class="btn" data-a="vdauto">${ic('sparkle', 16)} Kais planlasın</button><button class="btn sec" data-a="vdcopy">Önceki dört haftayı kopyala</button><button class="btn sec" data-a="vdtpl">Vardiya türleri</button>${nAs ? '<button class="btn sec" data-a="vdclear">Temizle</button>' : ''}<button class="btn ${pub ? 'sec' : ''}" data-a="vdpub" ${nAs ? '' : 'disabled'}>${pub ? 'Yeniden bildir' : 'Yayınla ve çalışanlara bildir'}</button></div>`;
  return `<div class="stack-lg">${segH}<div class="ek"><div class="ek-main"><section class="mg-card"><div class="iz-nv"><button type="button" data-a="vdm" data-v="-1" aria-label="Önceki ay">${ic('back', 18)}</button><div style="text-align:center"><h2>${VD_MON[m]} ${y} vardiya planı</h2><span class="pill ${pub ? 'p-ok' : 'p-warn'}">${pub ? 'Yayında' : nAs ? 'Taslak' : 'Plan yok'}</span>${(S.vdM || 0) !== 0 ? ' <button type="button" class="mg-lnk" data-a="vdm0" style="border:0;width:auto;height:auto">Bu aya dön</button>' : ''}</div><button type="button" data-a="vdm" data-v="1" aria-label="Sonraki ay" style="transform:scaleX(-1)">${ic('back', 18)}</button></div>${bar}<p class="small muted vd-hint">Yana kaydırarak tüm günleri gör.</p><div class="iz-sc"><div class="vd-gr" style="grid-template-columns:${(typeof innerWidth !== 'undefined' && innerWidth < 600) ? 104 : 130}px repeat(${dim},minmax(32px,1fr))"><div></div>${heads}${rows}<div class="nm" style="color:var(--ink-2)">Çalışan sayısı</div>${cov}</div></div><div class="vd-lg">${VD_T.map((t) => `<span><i style="background:${t.c}"></i>${esc(t.n)} ${t.s}–${vdEnd(t)}</span>`).join('')}<span><i style="background:#E4E9F2"></i>Haftalık izin</span><span><i style="background:#CFE1FA"></i>Onaylı izin</span><span><i style="background:repeating-linear-gradient(45deg,#E6E9EF 0 3px,#F5F6F9 3px 6px)"></i>Resmi tatil, kapalı</span></div></section></div>
  <div class="ek-side"><section class="mg-card"><div class="ek-h"><h2>Kais'in kontrolü</h2></div><div class="vd-ins">${ins.map((x) => `<div class="vd-in ${x.t}">${ic(x.t === 'ok' ? 'check' : 'alert', 16)}<span>${esc(x.x)}</span></div>`).join('')}</div></section>
  ${vdHolCard(y, m)}
  <section class="mg-card"><div class="ek-h"><h2>Otomatik hatırlatma</h2></div>${tw2('shRem24', '24 saat önce haber ver', 'Yarınki vardiyanız şu saatte başlıyor diye nazik bir bildirim gider.')}${tw2('shRem10', '10 dakika kala haber ver', 'Vardiyanın başlamasına 10 dakika kaldı diye bildirim gider.')}${tw2('shAuto', 'Her ay taslağı kendisi hazırlasın', 'Ayın 20\'sinden sonra sonraki ayın taslağını Kais hazırlar. Yayınlamayı sen yaparsın.')}<b style="font-size:14px;display:block;margin-top:10px">Günde en az kaç kişi çalışsın?</b><div class="mb-o">${[1, 2, 3].map((v) => `<button type="button" data-a="vdmin" data-v="${v}" aria-pressed="${min === v}">${v} kişi</button>`).join('')}<label class="vd-mn">veya<input id="vd-min" type="number" inputmode="numeric" min="1" max="${Math.max(1, EMP_IDS.length)}" value="${min}" aria-label="Günlük en az çalışan sayısı">kişi</label></div><p class="small muted">Bildirimler, uygulama yönetici cihazında açıkken gönderilir.</p></section></div></div></div>`;
}
H.vdtog = (el) => { S.settings[el.dataset.k] = S.settings[el.dataset.k] === false; vdSave(); render(); };
H.vdmin = (el) => { S.settings.shMin = Number(el.dataset.v); vdSave(); render(); };
H.vdauto = () => { const [y, m] = vdBase(); const ym = vdYm(y, m); const has = Array.from({ length: 31 }, (_, i) => VD_F[vdYmd(y, m, i + 1)]).some(Boolean);
  if (has && S.vdAsk !== ym) { S.vdAsk = ym; toast('Bu ay için plan var. Üzerine yazmak için tekrar dokun.', 'warn'); return; } S.vdAsk = null;
  const n = vdAuto(y, m); VD_M[ym] = { pub: false, auto: true }; vdSave(); render(); toast(`${VD_MON[m]} planı hazır. Kontrol edip yayınla.`, 'ok'); };
H.vdcopy = () => { const [y, m] = vdBase(); const dim = new Date(y, m + 1, 0).getDate(); let c = 0;
  for (let d = 1; d <= dim; d++) { const src = new Date(y, m, d - 28); const ss = vdYmd(src.getFullYear(), src.getMonth(), src.getDate()); const tgt = vdYmd(y, m, d); if (VD_F[ss]) { VD_F[tgt] = Object.assign({}, VD_F[ss]); c++; } }
  if (!c) { toast('Kopyalanacak önceki plan yok.', 'warn'); return; } VD_M[vdYm(y, m)] = { pub: false }; vdSave(); render(); toast('Önceki dört haftanın düzeni kopyalandı.', 'ok'); };
H.vdclear = () => { const [y, m] = vdBase(); const ym = vdYm(y, m); if (S.vdClr !== ym) { S.vdClr = ym; toast('Tüm ay silinecek. Onaylamak için tekrar dokun.', 'warn'); return; } S.vdClr = null; for (let d = 1; d <= 31; d++) delete VD_F[vdYmd(y, m, d)]; delete VD_M[ym]; vdSave(); render(); toast('Plan temizlendi.', 'ok'); };
H.vdpub = () => { const [y, m] = vdBase(); const ym = vdYm(y, m); VD_M[ym] = { pub: true, at: Date.now() }; vdSave(); render();
  pushSend(EMP_IDS.slice(), 'Vardiya programın hazır', `${VD_MON[m]} ayı vardiya programın yayınlandı. Kais iyi çalışmalar diler.`); toast('Yayınlandı. Çalışanlara bildirim gitti.', 'ok'); };
/* hücre düzenleme */
H.vdcell = (el) => { S.modal = { type: 'vdcell', id: el.dataset.id, d: el.dataset.d }; renderModal(); };
H.vdset = (el) => { const m = S.modal; if (!m) return; const v = el.dataset.v; const was = vdAsg(m.d, m.id); vdSet(m.d, m.id, v); const ym = m.d.slice(0, 7); if (!VD_M[ym]) VD_M[ym] = { pub: false };
  if (VD_M[ym].pub && v !== was && m.d >= vdYmd(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) { const t = vdTpl(v); const dd = Number(m.d.slice(8)), mm = Number(m.d.slice(5, 7)) - 1; pushSend([m.id], 'Vardiyan güncellendi', `${dd} ${VD_MON[mm]} için ${t ? t.n + ' vardiyası ' + t.s + '–' + vdEnd(t) : v === 'off' ? 'izinli gün' : 'vardiya kaldırıldı'}. Kais iyi çalışmalar diler.`); }
  S.modal = null; vdSave(); render(); };
function vdCellSheet() {
  const m = S.modal, u = byId(m.id), y = Number(m.d.slice(0, 4)), mo = Number(m.d.slice(5, 7)) - 1, d = Number(m.d.slice(8)), cur = vdAsg(m.d, m.id), h = vdHolFull(y, mo, d);
  const opts = VD_T.map((t) => `<button type="button" data-a="vdset" data-v="${t.id}" aria-pressed="${cur === t.id}"><i style="background:${t.c}"></i>${esc(t.n)}<span>${t.s}–${vdEnd(t)} · ${vdHours(t)} sa</span></button>`).join('');
  return sheet(`${u.name} · ${d} ${VD_MON[mo]} ${VD_DAY[new Date(y, mo, d).getDay()]}`, `${h ? `<div class="callout warn">${ic('alert')}<div><b>${esc(h.n)}</b><p style="margin-top:2px">Resmi tatil. Müşteri yoğunluğu artabilir.</p></div></div>` : ''}${vdOnLeave(m.id, mo, d) ? '<div class="callout info">' + ic('info') + '<div><b>Onaylı izni var</b><p style="margin-top:2px">Bu güne vardiya yazılsa da izin geçerli sayılır.</p></div></div>' : ''}<div class="vd-ch">${opts}<button type="button" data-a="vdset" data-v="off" aria-pressed="${cur === 'off'}"><i style="background:#C9D2E0"></i>Haftalık izin<span>Çalışmıyor</span></button><button type="button" data-a="vdset" data-v="" aria-pressed="${!cur}"><i style="background:#F2F5FA;border:1px solid #D8E1EE"></i>Boş bırak</button></div>`);
}
/* vardiya türleri */
H.vdtpl = () => { S.modal = { type: 'vdtpl' }; renderModal(); };
function vdTplRead() { VD_T.forEach((t, i) => { const g = (k) => document.getElementById(k + i); if (g('vn')) { t.n = (g('vn').value || t.n).trim().slice(0, 14) || t.n; if (/^\d{2}:\d{2}$/.test(g('vs').value)) t.s = g('vs').value; if (/^\d{2}:\d{2}$/.test(g('ve').value)) t.e = g('ve').value; } }); }
H.vdtadd = () => { vdTplRead(); if (VD_T.length >= 6) { toast('En fazla 6 vardiya türü.', 'warn'); return; } const C = ['#E99A2B', '#3F86DD', '#7C5CCF', '#2F9E5F', '#D9534F', '#14A3B8']; VD_T.push({ id: 't' + Date.now().toString(36), n: 'Yeni', s: '09:00', e: '17:00', c: C[VD_T.length % C.length] }); renderModal(); };
H.vdtdel = (el) => { vdTplRead(); if (VD_T.length <= 1) { toast('En az bir vardiya türü olmalı.', 'warn'); return; } const t = VD_T[Number(el.dataset.i)]; VD_T.splice(Number(el.dataset.i), 1); Object.keys(VD_F).forEach((ds) => { Object.keys(VD_F[ds]).forEach((u) => { if (VD_F[ds][u] === t.id) delete VD_F[ds][u]; }); }); renderModal(); };
H.vdtsave = () => { vdTplRead(); vdSave(); S.modal = null; render(); toast('Vardiya türleri kaydedildi.', 'ok'); };
const vdTplSheet = () => sheet('Vardiya türleri', `<p class="small muted">Saatler 24 saatlik yazılır. Gece yarısına sarkan vardiya için bitişe 00:00 yaz.</p>${VD_T.map((t, i) => `<div class="vd-tp"><input id="vn${i}" value="${esc(t.n)}" maxlength="14" aria-label="Ad"><input id="vs${i}" type="time" value="${t.s}" aria-label="Başlangıç"><input id="ve${i}" type="time" value="${t.e}" aria-label="Bitiş"><button type="button" data-a="vdtdel" data-i="${i}" aria-label="Sil">${ic('x', 16)}</button></div>`).join('')}<div class="dr-a"><button class="btn sec" data-a="vdtadd">${ic('plus', 16)} Yeni vardiya</button><button class="btn" data-a="vdtsave">Kaydet</button></div>`);
{const _r = renderModal; renderModal = function () { const t = S.modal && S.modal.type; if (t === 'vdcell' || t === 'vdtpl' || t === 'vdmine') { const root = $('#modal-root'); if (!root) return; try { root.innerHTML = t === 'vdcell' ? vdCellSheet() : t === 'vdtpl' ? vdTplSheet() : vdMineSheet(); } catch (e) { root.innerHTML = ''; S.modal = null; } return; } return _r.apply(this, arguments); };}
/* çalışan tarafı */
const vdPub = (y, m) => !!(VD_M[vdYm(y, m)] && VD_M[vdYm(y, m)].pub);
const vdStart = (ds, t) => { const [h, mi] = t.s.split(':').map(Number); return new Date(Number(ds.slice(0, 4)), Number(ds.slice(5, 7)) - 1, Number(ds.slice(8)), h, mi); };
function vdMyDay(uid, dt) { const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate(); if (!vdPub(y, m)) return { k: 'none' }; return vdState(y, m, d, uid); }
function vdEmpCard(uid) {
  const now = new Date(); const days = []; for (let i = 0; i < 7; i++) days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  if (!days.some((d) => vdPub(d.getFullYear(), d.getMonth()))) return '';
  const td = vdMyDay(uid, days[0]); let big = 'Bugün vardiyan yok', sub = '';
  if (td.k === 'shift') { const st = vdStart(vdYmd(now.getFullYear(), now.getMonth(), now.getDate()), td.t), df = Math.round((st - now) / 60000); big = `${td.t.n} vardiyası ${td.t.s}–${vdEnd(td.t)}`; sub = df > 0 ? `Başlamasına ${df >= 60 ? Math.floor(df / 60) + ' sa ' : ''}${df % 60} dk var.` : 'Vardiyan başladı. İyi çalışmalar.'; }
  else if (td.k === 'leave') big = 'Bugün izinlisin'; else if (td.k === 'off') big = 'Bugün haftalık izin günün'; else if (td.k === 'hol') big = 'Bugün resmi tatil, iş yeri kapalı';
  const h = vdHolFull(now.getFullYear(), now.getMonth(), now.getDate()); if (h && td.k === 'shift') sub += ' Bugün resmi tatil, yoğun gün olabilir.';
  const ls = days.slice(1).map((d) => { const s = vdMyDay(uid, d); const tx = s.k === 'shift' ? s.t.s + '–' + vdEnd(s.t) : s.k === 'leave' ? 'İzinli' : s.k === 'off' ? 'İzin' : s.k === 'hol' ? 'Tatil' : '—'; return `<div>${VD_DAY[d.getDay()]} ${d.getDate()}<b>${tx}</b></div>`; }).join('');
  return `<section class="vd-em"><h3>Vardiyam</h3><div class="big">${esc(big)}</div>${sub ? `<p class="small muted" style="margin:0 0 4px">${esc(sub.trim())}</p>` : ''}<div class="ls">${ls}</div><button class="btn sec sm" data-a="vdmine" style="margin-top:6px">Tüm ayı gör</button></section>`;
}
H.vdmine = () => { S.modal = { type: 'vdmine' }; renderModal(); };
function vdMineSheet() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), uid = S.user.id, dim = new Date(y, m + 1, 0).getDate(); let rows = '';
  for (let d = 1; d <= dim; d++) { const s = vdState(y, m, d, uid), dw = new Date(y, m, d).getDay(); const tx = s.k === 'shift' ? `<b style="color:${s.t.c}">${esc(s.t.n)}</b> ${s.t.s}–${vdEnd(s.t)}` : s.k === 'leave' ? 'İzinli' : s.k === 'off' ? 'Haftalık izin' : s.k === 'hol' ? 'Resmi tatil' : '—'; rows += `<div class="dr-r"><span style="${d === now.getDate() ? 'color:var(--cini);font-weight:700' : ''}">${d} ${VD_MON[m]} ${VD_DAY[dw]}</span><span style="color:var(--ink)">${tx}</span></div>`; }
  return sheet(VD_MON[m] + ' vardiya programım', vdPub(y, m) ? `<div class="dr-s" style="max-height:60vh;overflow-y:auto">${rows}</div>` : '<p class="muted">Bu ayın programı henüz yayınlanmadı.</p>');
}
/* otomatik bildirim + otomatik taslak */
function vdTick() {
  if (!S.user || typeof SBS === 'undefined' || !SBS.biz) return; const now = new Date(); const role = S.user.role;
  const tds = [0, 1].map((i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  if (role === 'calisan') { const s = vdMyDay(S.user.id, tds[0]); if (s.k === 'shift') { const df = (vdStart(vdYmd(tds[0].getFullYear(), tds[0].getMonth(), tds[0].getDate()), s.t) - now) / 60000; const k = vdYmd(tds[0].getFullYear(), tds[0].getMonth(), tds[0].getDate()); if (df > 0 && df <= 10 && !VD_LOC[k]) { VD_LOC[k] = 1; toast(`Vardiyanın başlamasına ${Math.ceil(df)} dakika kaldı. Kais iyi çalışmalar diler.`, 'ok'); } } return; }
  if (!['patron', 'mudur'].includes(role)) return; let dirty = false;
  tds.forEach((dt) => { const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate(); if (!vdPub(y, m)) return; const ds = vdYmd(y, m, d);
    EMP_IDS.forEach((id) => { const s = vdState(y, m, d, id); if (s.k !== 'shift') return; const df = (vdStart(ds, s.t) - now) / 60000; if (df <= 0) return; const same = d === now.getDate() && m === now.getMonth();
      if (S.settings.shRem10 !== false && df <= 10 && !VD_SENT[ds + '|' + id + '|10']) { VD_SENT[ds + '|' + id + '|10'] = 1; VD_SENT[ds + '|' + id + '|24'] = 1; dirty = true; pushSend([id], 'Vardiya hatırlatması', `Vardiyanın başlamasına ${Math.ceil(df)} dakika kaldı. Kais iyi çalışmalar diler.`); }
      else if (S.settings.shRem24 !== false && df <= 1440 && df > 30 && !VD_SENT[ds + '|' + id + '|24']) { VD_SENT[ds + '|' + id + '|24'] = 1; dirty = true; pushSend([id], 'Vardiya hatırlatması', `${same ? 'Bugünkü' : 'Yarınki'} vardiyan ${s.t.s}'da başlıyor. Küçük bir hatırlatma yapmak istedik. Kais iyi günler diler.`); } }); });
  const lim = vdYmd(now.getFullYear(), now.getMonth(), now.getDate() - 2); Object.keys(VD_SENT).forEach((k) => { if (k.slice(0, 10) < lim) { delete VD_SENT[k]; dirty = true; } });
  if (S.settings.shAuto !== false && now.getDate() >= 20) { const nm = new Date(now.getFullYear(), now.getMonth() + 1, 1), ym = vdYm(nm.getFullYear(), nm.getMonth()); if (!VD_M[ym] && now.getHours() >= 0) { vdAuto(nm.getFullYear(), nm.getMonth()); VD_M[ym] = { pub: false, auto: true }; dirty = true; toast(`Kais ${VD_MON[nm.getMonth()]} vardiya taslağını hazırladı. Ekip > Vardiya'dan kontrol edip yayınla.`, 'ok'); } }
  if (dirty) vdSave();
}
if (!window.__vdT) { window.__vdT = setInterval(() => { try { vdTick(); } catch (e) {} }, 60000); setTimeout(() => { try { vdTick(); } catch (e) {} }, 4000); }
/* ===== v73: Akıllı izin takvimi (çakışmasız haftalık izin, kadro kontrolü) ===== */
{const st=document.createElement('style'); st.textContent=`
.iz-t{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.iz-t div{background:#fff;border:1px solid #E1E8F2;border-radius:16px;padding:12px 14px}.iz-t span{display:block;font-size:12.5px;color:var(--ink-2)}.iz-t b{display:block;font-size:24px;margin-top:2px}.iz-t b small{font-size:13px;font-weight:600;color:var(--ink-2);margin-left:4px}.iz-t .bad b{color:#D9534F}.iz-t .ok b{color:#2F9E5F}
.iz-kp{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;border-radius:20px;padding:16px 18px;background:linear-gradient(135deg,#EAF2FE,#F4F8FF);border:1px solid #D7E6FB}.iz-kp>div:first-child{flex:1 1 280px;min-width:0;text-align:left}.iz-kp h3{margin:0 0 3px;font-size:16px;display:flex;align-items:center;gap:8px}.iz-kp p{margin:0;font-size:13.5px;color:var(--ink-2);max-width:560px}.iz-kp .btn{min-height:44px;border-radius:14px}
.iz-gr .c.wo{background:#fff;border:1.5px dashed #8FA3C0;box-sizing:border-box}.iz-gr .cv{font:700 12px system-ui;text-align:center;color:#2F9E5F}.iz-gr .cv.b{color:#D9534F}
.iz-rq{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #EDF1F7}.iz-rq:first-of-type{border-top:0}.iz-rq .grow{min-width:0}.iz-rq b{font-size:14.5px;display:block}.iz-rq span.s{font-size:12.5px;color:var(--ink-2);display:block}.iz-rq .v{font-size:12.5px;margin-top:4px;display:inline-block;border-radius:99px;padding:3px 10px}.iz-rq .v.ok{background:#E8F6EE;color:#1F6B42}.iz-rq .v.w{background:#FDF1DC;color:#8F5A00}.iz-rq .btn{flex:none;min-height:38px;border-radius:12px}
`; document.head.appendChild(st);}
const vdPlanned = (y) => Object.keys(VD_F).some((k) => k.startsWith(y + '-'));
function vdAvail(y, m, d, skip) { const plan = vdPlanned(y); return EMP_IDS.filter((id) => { if (id === skip) return false; const s = vdState(y, m, d, id); return plan ? s.k === 'shift' : s.k !== 'leave' && s.k !== 'hol'; }).length; }
function vdCoverWarn(uid, txt) {
  let q = null; try { q = izOrd(txt); } catch (e) {} if (!q) return ''; const y = new Date().getFullYear(), min = Number(S.settings.shMin) || 1, bad = [];
  for (let o = q[0]; o <= q[1] && o - q[0] < 60; o++) { const m = Math.floor(o / 40), d = o % 40; if (d < 1 || d > 31 || m > 11) continue; if (S.settings.holClosed && vdHolFull(y, m, d)) continue; if (vdAvail(y, m, d, uid) < min) bad.push(d + ' ' + VD_MON[m]); }
  return bad.length ? `<b>${bad.slice(0, 3).join(', ')}</b> günlerinde bu izinle çalışan sayısı ${min} kişinin altına düşer.` : '';
}
const vdLeaveWarn = (uid, txt) => { const a = [vdHolWarn(txt), vdCoverWarn(uid, txt)].filter(Boolean); return a.length ? a.join('<br>') + '<br>Yine de onaylamak için tekrar dokun.' : ''; };
/* çakışmasız haftalık izin planı */
vdAuto = function (y, m) {
  const n = EMP_IDS.length, dim = new Date(y, m + 1, 0).getDate(), T = VD_T; if (!T.length || !n) return 0; const off0 = vdMon0(y, m);
  for (let d = 1; d <= dim; d++) delete VD_F[vdYmd(y, m, d)];
  const need = Number(S.settings.wkOff) === 2 ? 2 : 1; const offCnt = {}; const weeks = {};
  for (let d = 1; d <= dim; d++) { const wi = Math.floor((d + off0 - 1) / 7); (weeks[wi] = weeks[wi] || []).push(d); }
  let total = 0;
  EMP_IDS.forEach((id, i) => { Object.keys(weeks).forEach((w) => { const days = weeks[w], wi = Number(w);
    const free = days.filter((d) => !vdOnLeave(id, m, d) && !(S.settings.holClosed && vdHolFull(y, m, d)));
    let k = Math.round(need * days.length / 7) - (days.length - free.length); if (k < 0) k = 0; k = Math.min(k, free.length);
    const pick = free.slice().sort((a, b) => ((offCnt[a] || 0) * 10 + ((a + i * 2 + wi) % 7) / 10) - ((offCnt[b] || 0) * 10 + ((b + i * 2 + wi) % 7) / 10)).slice(0, k);
    pick.forEach((d) => { offCnt[d] = (offCnt[d] || 0) + 1; vdSet(vdYmd(y, m, d), id, 'off'); total++; });
    free.forEach((d) => { if (!pick.includes(d)) vdSet(vdYmd(y, m, d), id, T[(i + wi) % T.length].id); }); }); });
  return total;
};
S.izM = S.izM || 0;
H.izoff = (el) => { S.settings.wkOff = Number(el.dataset.v); vdSave(); render(); };
H.izweek = () => { const now = new Date(); const b = new Date(now.getFullYear(), now.getMonth() + (S.izM || 0), 1), y = b.getFullYear(), m = b.getMonth(), ym = vdYm(y, m);
  const has = Array.from({ length: 31 }, (_, i) => VD_F[vdYmd(y, m, i + 1)]).some(Boolean);
  if (has && S.izAsk !== ym) { S.izAsk = ym; toast('Bu ayın vardiya planı yeniden düzenlenecek. Onaylamak için tekrar dokun.', 'warn'); return; } S.izAsk = null;
  const n = vdAuto(y, m); const pub = VD_M[ym] && VD_M[ym].pub; VD_M[ym] = { pub: !!pub, auto: true }; vdSave(); render();
  if (pub) pushSend(EMP_IDS.slice(), 'Vardiya programın güncellendi', `${VD_MON[m]} ayı haftalık izin günlerin düzenlendi. Kais iyi çalışmalar diler.`);
  toast(`${n} haftalık izin günü dağıtıldı. Herkese haftada bir gün, çakışma yok.`, 'ok'); };
izinTakvim = function () {
  const now = new Date(); const base = new Date(now.getFullYear(), now.getMonth() + (S.izM || 0), 1); const y = base.getFullYear(), mo = base.getMonth(), dim = new Date(y, mo + 1, 0).getDate(), todayD = (S.izM || 0) === 0 ? now.getDate() : -1, min = Number(S.settings.shMin) || 1;
  const A = ekLeaves(); const cls = { yillik: 'y', rapor: 'r', ucretsiz: 'u', mazeret: 'm' }; const plan = vdPlanned(y) && Array.from({ length: dim }, (_, i) => VD_F[vdYmd(y, mo, i + 1)]).some(Boolean);
  const hitOf = (id, d) => { const o = mo * 40 + d; return A.filter((x) => x.uid === id).find((x) => { const q = ekRange(x); return q && q[0] <= o && o <= q[1]; }); };
  let leaveDays = 0;
  const cell = (id, d) => { const hit = hitOf(id, d); const hl = vdHolFull(y, mo, d), we = [0, 6].includes(new Date(y, mo, d).getDay()); const wo = plan && vdAsg(vdYmd(y, mo, d), id) === 'off'; if (hit && hit.st === 'onayli') leaveDays++;
    const c = hit ? (hit.st === 'onayli' ? cls[hit.type] || 'y' : 'p') : hl ? (S.settings.holClosed ? 'hc' : 'hd') : vdHol(y, mo, d) ? 'hh' : wo ? 'wo' : we ? 'we' : '';
    const tt = hit ? byId(id).name + ': ' + (LV_KIND[hit.type] || hit.type) + ' ' + hit.txt + (hit.st === 'onayli' ? '' : ' (bekliyor)') : wo ? byId(id).name + ': haftalık izin' : hl ? hl.n : vdHol(y, mo, d) ? vdHol(y, mo, d).n + ' (yarım gün)' : '';
    return `<div class="c ${c}${d === todayD ? ' t' : ''}" title="${esc(tt)}"></div>`; };
  const heads = Array.from({ length: dim }, (_, i) => { const d = i + 1, we = [0, 6].includes(new Date(y, mo, d).getDay()), hl = vdHolFull(y, mo, d); return `<div class="dh${we ? ' we' : ''}${d === todayD ? ' td' : ''}${hl ? ' hl' : ''}" title="${hl ? esc(hl.n) : ''}">${d}</div>`; }).join('');
  const rows = EMP_IDS.map((id) => `<div class="nm" data-a="empdrw" data-id="${id}" style="cursor:pointer">${esc(byId(id).name)}</div>${Array.from({ length: dim }, (_, i) => cell(id, i + 1)).join('')}`).join('');
  let risky = 0; const cov = Array.from({ length: dim }, (_, i) => { const d = i + 1; if (S.settings.holClosed && vdHolFull(y, mo, d)) return '<div class="cv">–</div>'; const c = vdAvail(y, mo, d, ''); if (c < min) risky++; return `<div class="cv${c < min ? ' b' : ''}" title="Çalışabilecek kişi">${c}</div>`; }).join('');
  const nowOn = EMP_IDS.filter((id) => ekOnLeave(id)).length; const pend = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status));
  const tiles = `<div class="iz-t"><div><span>Şu an izinde</span><b>${nowOn}<small>kişi</small></b></div><div><span>${VD_MON[mo]} izin günü</span><b>${leaveDays}<small>gün</small></b></div><div class="${pend.length ? '' : 'ok'}"><span>Bekleyen talep</span><b>${pend.length}</b></div><div class="${risky ? 'bad' : 'ok'}"><span>Kadro durumu</span><b>${risky ? risky + '<small>riskli gün</small>' : 'Tam'}</b></div></div>`;
  const kais = `<div class="iz-kp"><div><h3>${ic('sparkle', 18)} Haftalık izinleri Kais ayarlasın</h3><p>Herkese haftada seçtiğin kadar gün izin verir. Onaylı izinlerle, resmi tatillerle ve vardiyalarla çakışmaz. Her gün en az ${min} kişi çalışacak şekilde dengeler.</p></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><div class="mb-o" style="margin:0"><button type="button" data-a="izoff" data-v="1" aria-pressed="${Number(S.settings.wkOff) !== 2}">Haftada 1 gün</button><button type="button" data-a="izoff" data-v="2" aria-pressed="${Number(S.settings.wkOff) === 2}">Haftada 2 gün</button></div><button class="btn" data-a="izweek">${VD_MON[mo]} için ayarla</button></div></div>`;
  const o = ekNow(); const rq = pend.map((r) => { const e = lrEff(r); const w = [vdHolWarn(e.txt), vdCoverWarn(r.uid, e.txt)].filter(Boolean).length; return `<div class="iz-rq">${avatar(byId(r.uid), 38)}<div class="grow"><b>${esc(byId(r.uid).name)}</b><span class="s">${esc(e.txt)} · ${e.days} gün · ${LV_KIND[r.type] || r.type}</span><span class="v ${w ? 'w' : 'ok'}">${w ? 'Kais: dikkat, çakışma var' : 'Kais: çakışma yok, onaya uygun'}</span></div><button class="btn sm sec" data-a="lrok" data-id="${r.id}">İncele</button></div>`; }).join('');
  const UP = A.filter((x) => x.st === 'onayli').map((x) => ({ x, q: ekRange(x) })).filter((v) => v.q && v.q[1] >= o).sort((a, b) => a.q[0] - b.q[0]);
  const list = UP.length ? UP.map(({ x, q }) => `<div class="row2">${avatar(byId(x.uid), 34)}<div class="grow"><b>${esc(byId(x.uid).name)}</b><span>${esc(x.txt)} · ${x.days} gün · ${LV_KIND[x.type] || x.type}</span></div><span class="pill ${q[0] <= o ? 'p-ok' : 'p-info'}">${q[0] <= o ? 'İzinde' : 'Onaylı'}</span></div>`).join('') : '<p class="muted" style="padding:6px 0 12px">Onaylı yaklaşan izin yok.</p>';
  const bal = EMP_IDS.map((id) => { const b = ekBal(id); const pct = b.ent ? Math.min(100, Math.round(b.used / b.ent * 100)) : 0; return `<div class="it" data-a="empdrw" data-id="${id}" style="cursor:pointer"><div class="row" style="gap:10px">${avatar(byId(id), 34)}<div class="grow"><b>${esc(byId(id).name)}</b><div class="small muted">${b.ent ? b.used + ' / ' + b.ent + ' gün kullanıldı' : 'Hak henüz doğmadı'}</div></div><b>${b.ent ? b.left + ' gün' : '—'}</b></div><div class="dr-bar"><i style="width:${pct}%"></i></div></div>`; }).join('');
  return `${tiles}${kais}<section class="mg-card"><div class="iz-nv"><button type="button" data-a="izm" data-v="-1" aria-label="Önceki ay">${ic('back', 18)}</button><div style="text-align:center"><h2>${base.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>${(S.izM || 0) !== 0 ? '<button type="button" class="mg-lnk" data-a="izm0" style="border:0;width:auto;height:auto">Bu aya dön</button>' : ''}</div><button type="button" data-a="izm" data-v="1" aria-label="Sonraki ay" style="transform:scaleX(-1)">${ic('back', 18)}</button></div><div class="iz-sc"><div class="iz-gr" style="grid-template-columns:130px repeat(${dim},minmax(24px,1fr))"><div></div>${heads}${rows}<div class="nm" style="color:var(--ink-2)">Çalışan sayısı</div>${cov}</div></div><div class="iz-lg"><span><i style="background:#5E9AEA"></i>Yıllık izin</span><span><i style="background:#E8A93C"></i>Rapor</span><span><i style="background:#9AA7BA"></i>Ücretsiz</span><span><i style="background:#9B7BD8"></i>Mazeret</span><span><i style="background:repeating-linear-gradient(45deg,#BCD3F2 0 3px,#E6EEFA 3px 6px);outline:1px dashed #5E9AEA"></i>Onay bekliyor</span><span><i style="background:#fff;border:1.5px dashed #CBD5E4"></i>Haftalık izin</span><span><i style="background:#FBE3E0"></i>Resmi tatil</span><span><i style="background:#FDF1DC"></i>Yarım gün</span></div></section>
  <div class="ek"><div class="ek-main">${pend.length ? `<section class="mg-card"><div class="ek-h"><h2>Bekleyen talepler</h2><span>Kais çakışma kontrolü yaptı</span></div>${rq}</section>` : ''}<section class="mg-card ek-up"><div class="ek-h"><h2>Onaylı ve yaklaşan izinler</h2></div>${list}</section></div><div class="ek-side">${vdHolCard(y, mo)}<section class="mg-card"><div class="ek-h"><h2>Yıllık izin bakiyeleri</h2></div><div class="iz-bal" style="grid-template-columns:1fr">${bal}</div></section></div></div>`;
};
/* ===== v74: resmi tatil kuralları, tatil çalışma ücreti, sade Kais kartı ===== */
{const st=document.createElement('style'); st.textContent=`
.iz-kp{display:flex;align-items:center;gap:14px;flex-wrap:wrap;align-content:center;height:fit-content;flex:0 0 auto;padding:12px 16px;border-radius:18px;background:#fff;border:1px solid #E1E8F2;box-shadow:0 3px 10px rgba(13,40,80,.04)}
.iz-kp .ico{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#3F86DD,#1B4FA8);flex:none}
.iz-kp .tx{flex:1 1 220px;min-width:0}.iz-kp .tx b{display:block;font-size:15px}.iz-kp .tx small{display:block;font-size:12.5px;color:var(--ink-2);margin-top:1px}
.iz-kp .sg{display:flex;background:#EEF3FA;border-radius:12px;padding:3px}.iz-kp .sg button{border:0;background:transparent;border-radius:9px;padding:7px 12px;font:600 13px inherit;font-family:inherit;color:var(--ink-2)}.iz-kp .sg button[aria-pressed=true]{background:#fff;color:var(--cini);box-shadow:0 1px 4px rgba(13,40,80,.14)}
.iz-kp .btn{min-height:40px;border-radius:12px;padding:0 16px;font-size:13.5px}
.hp-r{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #EDF1F7}.hp-r:first-of-type{border-top:0}.hp-r .grow{min-width:0}.hp-r b{display:block;font-size:14px}.hp-r span.s{font-size:12.5px;color:var(--ink-2)}.hp-r .btn{flex:none;min-height:36px;border-radius:11px;font-size:13px}
.hp-bk{display:flex;gap:8px;align-items:center;background:#F5F8FD;border-radius:14px;padding:10px 12px;margin:10px 0}.hp-bk input{flex:1;min-width:0}
.hp-in{width:110px;min-height:40px;border:1px solid #D8E1EE;border-radius:11px;padding:0 10px;font:inherit;text-align:right;box-sizing:border-box}
.hp-e{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #F0F3F8}.hp-e:first-of-type{border-top:0}.hp-e .grow{min-width:0}.hp-e small{display:block;color:var(--ink-2);font-size:12px}.hp-e.dim{opacity:.55}
`; document.head.appendChild(st);}
const VD_HP = {};
P_OBJ.push(['VD_HP', () => VD_HP]);
const vdHolBlock = (txt) => { if (S.settings.holClosed) return ''; let q = null; try { q = izOrd(txt); } catch (e) {} if (!q) return ''; const y = new Date().getFullYear(), hs = [];
  for (let o = q[0]; o <= q[1] && o - q[0] < 60; o++) { const m = Math.floor(o / 40), d = o % 40; if (d < 1 || d > 31 || m > 11) continue; const h = vdHolFull(y, m, d); if (h) hs.push(d + ' ' + VD_MON[m] + ' ' + h.n); }
  return hs.length ? `${hs.slice(0, 2).join(', ')} resmi tatil ve iş yeri açık. Bu günlere izin verilemez. Tarihleri değiştir.` : ''; };
vdHolWarn = () => '';
{const _lv = H.lvok; H.lvok = (el) => { const g = (i) => document.getElementById(i); const txt = ((g('lv-txt') || {}).value || '').trim(); const b = vdHolBlock(txt); if (b) { const e = g('lv-err'); if (e) { e.textContent = b; e.style.color = ''; } return; } return _lv(el); };
 const _lf = H.lrfinal; H.lrfinal = (el) => { const r = S.modal && LVREQ.find((x) => x.id === S.modal.id); const b = r ? vdHolBlock(lrEff(r).txt) : ''; if (b) { const e = document.getElementById('la-err'); if (e) { e.textContent = b; e.style.color = ''; } return; } return _lf(el); };
 const _ls = H.lrsend; H.lrsend = () => { const g = (i) => document.getElementById(i); const b = vdHolBlock(((g('lq-txt') || {}).value || '').trim()); if (b) { const e = g('lq-err'); if (e) e.textContent = b; return; } return _ls(); };}
/* haftalık izin: açık işyerinde tatil günü çalışılır */
{const _auto = vdAuto; vdAuto = function (y, m) { const r = _auto.call(this, y, m); if (!S.settings.holClosed) { for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) { if (!vdHolFull(y, m, d)) continue; const ds = vdYmd(y, m, d); EMP_IDS.forEach((id, i) => { if (VD_F[ds] && VD_F[ds][id] === 'off') { const alt = [d + 1, d - 1, d + 2, d - 2].find((x) => x >= 1 && x <= new Date(y, m + 1, 0).getDate() && !vdHolFull(y, m, x) && vdAsg(vdYmd(y, m, x), id) && vdAsg(vdYmd(y, m, x), id) !== 'off'); if (alt) { const keep = vdAsg(vdYmd(y, m, alt), id); vdSet(vdYmd(y, m, alt), id, 'off'); vdSet(ds, id, keep); } else vdSet(ds, id, VD_T[i % VD_T.length].id); } }); } } return r; }; }
/* tatil çalışma ücreti */
const vdHPSum = (uid, ds) => Number((VD_HP[ds] || {})[uid]) || 0;
function vdHPList(uid) { const per = REF.y + '-' + String(REF.m).padStart(2, '0'); return Object.keys(VD_HP).filter((ds) => ds.slice(0, 7) === per && vdHPSum(uid, ds) > 0).sort().map((ds) => { const h = vdHol(Number(ds.slice(0, 4)), Number(ds.slice(5, 7)) - 1, Number(ds.slice(8))); return { ds, n: h ? h.n : 'Resmi tatil', amt: vdHPSum(uid, ds), d: Number(ds.slice(8)), m: Number(ds.slice(5, 7)) - 1 }; }); }
{const _du = dueOf; dueOf = function (uid) { const r = _du.apply(this, arguments); const L = vdHPList(uid); const hol = L.reduce((a, x) => a + x.amt, 0); r.hol = hol; r.holL = L; r.total += hol; r.left += hol; return r; };}
function vdWorkers(ds) { const y = Number(ds.slice(0, 4)), m = Number(ds.slice(5, 7)) - 1, d = Number(ds.slice(8)); const plan = Object.keys(VD_F).some((k) => k.startsWith(ds.slice(0, 7))); return EMP_IDS.map((id) => ({ id, on: plan ? vdState(y, m, d, id).k === 'shift' : vdState(y, m, d, id).k !== 'leave' })); }
const vdHPTotal = (ds) => Object.keys(VD_HP[ds] || {}).reduce((a, u) => a + (Number(VD_HP[ds][u]) || 0), 0);
function vdHPRows(days) {
  return days.map((x) => { const ds = vdYmd(x.y, x.m, x.d); const n = Object.keys(VD_HP[ds] || {}).filter((u) => Number(VD_HP[ds][u]) > 0).length; return `<div class="hp-r"><div class="grow"><b>${x.d} ${VD_MON[x.m]} ${VD_DAY[new Date(x.y, x.m, x.d).getDay()]} · ${esc(x.n)}</b><span class="s">${n ? n + ' kişiye toplam ' + fmt0(vdHPTotal(ds)) + ', maaşa eklenir' : 'Çalışacaklar için ücret belirlenmedi'}</span></div><button class="btn sm ${n ? 'sec' : ''}" data-a="vdhp" data-d="${ds}">${n ? 'Düzenle' : 'Ücret belirle'}</button></div>`; }).join('');
}
function vdHolPayCard(y, m) {
  if (S.settings.holClosed || !['patron', 'mudur'].includes(S.user.role)) return ''; const L = vdHolMonth(y, m).filter((h) => !h.half).map((h) => ({ y, m, d: h.d, n: h.n })); if (!L.length) return '';
  return `<section class="mg-card"><div class="ek-h"><h2>Tatil çalışma ücreti</h2></div><p class="small muted" style="margin:0 0 4px">Resmi tatilde çalışan için ek ücret yaz. Çalışanın aylık maaşına otomatik eklenir ve maaş detayında görünür.</p>${vdHPRows(L)}</section>`;
}
function vdHolSoon() { if (S.settings.holClosed || !S.user || !['patron', 'mudur'].includes(S.user.role)) return []; const n = new Date(), out = []; for (let i = -3; i <= 7; i++) { const dt = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i); const h = vdHolFull(dt.getFullYear(), dt.getMonth(), dt.getDate()); if (h) out.push({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), n: h.n, i }); } return out; }
const vdHolSoonCard = () => { const L = vdHolSoon(); if (!L.length) return ''; return `<section class="mg-card"><div class="ek-h"><h2>Resmi tatil yaklaşıyor</h2></div><p class="small muted" style="margin:0 0 4px">İş yerin açık. Çalışacak ekip için tatil ücretini belirle.</p>${vdHPRows(L)}</section>`; };
H.vdhp = (el) => { S.modal = { type: 'vdhp', d: el.dataset.d }; renderModal(); };
function vdHPSheet() {
  const ds = S.modal.d, y = Number(ds.slice(0, 4)), m = Number(ds.slice(5, 7)) - 1, d = Number(ds.slice(8)), h = vdHol(y, m, d) || { n: 'Resmi tatil' }; const W = vdWorkers(ds).sort((a, b) => b.on - a.on);
  const rows = W.map((w) => { const u = byId(w.id), v = vdHPSum(w.id, ds); return `<div class="hp-e${w.on ? '' : ' dim'}">${avatar(u, 34)}<div class="grow"><b style="font-size:14px">${esc(u.name)}</b><small>${w.on ? 'Çalışıyor' : 'Çalışmıyor'}</small></div><input class="hp-in" id="hp-${w.id}" type="number" inputmode="decimal" min="0" placeholder="0" value="${v || ''}" aria-label="${esc(u.name)} ücret"></div>`; }).join('');
  return sheet(`${d} ${VD_MON[m]} ${h.n}`, `<p class="small muted" style="margin:0">Tatilde çalışan herkese aynı tutarı yazabilir ya da kişiye göre ayrı ayrı belirleyebilirsin. Tutar bu ayın maaşına eklenir.</p><div class="hp-bk"><input class="hp-in" id="hp-all" type="number" inputmode="decimal" min="0" placeholder="Herkese tutar" style="width:auto;text-align:left" aria-label="Çalışanların hepsine tutar"><button class="btn sec sm" data-a="vdhpall">Çalışanlara yaz</button></div>${rows}<div class="dr-a"><button class="btn" data-a="vdhpsave">Kaydet</button></div>`);
}
H.vdhpall = () => { const v = (document.getElementById('hp-all') || {}).value; if (v === '' || v == null) return; const W = vdWorkers(S.modal.d); W.forEach((w) => { const i = document.getElementById('hp-' + w.id); if (i && w.on) i.value = v; }); };
H.vdhpsave = () => { const ds = S.modal.d; const old = Object.assign({}, VD_HP[ds] || {}); const nw = {}; const ch = [];
  EMP_IDS.forEach((id) => { const i = document.getElementById('hp-' + id); const v = i ? Math.max(0, Math.round(Number(i.value) || 0)) : 0; if (v > 0) nw[id] = v; if ((old[id] || 0) !== v && v > 0) ch.push([id, v]); });
  if (Object.keys(nw).length) VD_HP[ds] = nw; else delete VD_HP[ds]; vdSave(); S.modal = null; render();
  const m = Number(ds.slice(5, 7)) - 1, d = Number(ds.slice(8)); ch.forEach(([id, v]) => pushSend([id], 'Resmi tatil ücretin', `${d} ${VD_MON[m]} resmi tatil çalışma ücretin ${fmt0(v)}, maaşına eklendi. Kais iyi çalışmalar diler.`));
  toast(Object.keys(nw).length ? 'Tatil ücretleri kaydedildi ve maaşlara eklendi.' : 'Tatil ücreti kaldırıldı.', 'ok'); };
{const _r = renderModal; renderModal = function () { if (S.modal && S.modal.type === 'vdhp') { const root = $('#modal-root'); if (!root) return; try { root.innerHTML = vdHPSheet(); } catch (e) { root.innerHTML = ''; S.modal = null; } return; } return _r.apply(this, arguments); };}
/* maaş dökümüne satır */
{const _hc = vdHolCard; vdHolCard = function (y, m) { return _hc.apply(this, arguments); };}
/* tatil bildirimi: patron, müdür, muhasebeci */
{const _tk = vdTick; vdTick = function () { _tk.apply(this, arguments); try { if (!S.user || !['patron', 'mudur'].includes(S.user.role) || S.settings.holClosed) return; const n = new Date(); let dirty = false;
  [0, 1].forEach((i) => { const dt = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i); const h = vdHolFull(dt.getFullYear(), dt.getMonth(), dt.getDate()); if (!h) return; const ds = vdYmd(dt.getFullYear(), dt.getMonth(), dt.getDate()); if (VD_SENT[ds + '|hol']) return; VD_SENT[ds + '|hol'] = 1; dirty = true;
    const to = USERS.filter((u) => ['patron', 'mudur', 'muhasebeci'].includes(u.role)).map((u) => u.id);
    pushSend(to, 'Resmi tatil hatırlatması', `${i ? 'Yarın' : 'Bugün'} resmi tatil: ${h.n}. İş yerin açık, çalışan ekip için tatil ücretini belirlemeyi unutma. Kais iyi çalışmalar diler.`);
    toast(`${i ? 'Yarın' : 'Bugün'} resmi tatil: ${h.n}. Çalışanlar için tatil ücreti belirle.`, 'warn'); });
  if (dirty) vdSave(); } catch (e) {} }; }
/* sade Kais kartı */
{const _it = izinTakvim; izinTakvim = function () { let h = _it.apply(this, arguments); const i = h.indexOf('<div class="iz-kp">'); if (i < 0) return h; const j = h.indexOf('<section class="mg-card"><div class="iz-nv">'); const now = new Date(); const b = new Date(now.getFullYear(), now.getMonth() + (S.izM || 0), 1); const min = Number(S.settings.shMin) || 1;
  const nk = `<div class="iz-kp"><span class="ico">${ic('sparkle', 20)}</span><div class="tx"><b>Haftalık izin planı</b><small>Çakışmasız ve dengeli dağıtır. Her gün en az ${min} kişi çalışır.</small></div><div class="sg" role="group" aria-label="Haftalık izin günü"><button type="button" data-a="izoff" data-v="1" aria-pressed="${Number(S.settings.wkOff) !== 2}">1 gün</button><button type="button" data-a="izoff" data-v="2" aria-pressed="${Number(S.settings.wkOff) === 2}">2 gün</button></div><button class="btn" data-a="izweek">${VD_MON[b.getMonth()]} için ayarla</button></div>`;
  h = h.slice(0, i) + nk + h.slice(j); return h.replace(/(<div class="ek-side">)/, '$1' + vdHolPayCard(b.getFullYear(), b.getMonth())); }; }
/* Ekip Bugün: yaklaşan resmi tatil kartı + maaş dökümü */
{const _ve = viewEkip; viewEkip = function () { let h = _ve.apply(this, arguments); try { if (S.user && ['patron', 'mudur'].includes(S.user.role) && (S.sub.ekip || 'bugun') === 'bugun') { const c = vdHolSoonCard(); if (c) h = h.replace('<div class="ek-side">', '<div class="ek-side">' + c); } } catch (e) {} return h; }; }
/* ===== v75: Yıllık izin takibi ===== */
{const st=document.createElement('style'); st.textContent=`
.yz-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px}
.yz-c{background:#fff;border:1px solid #E1E8F2;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 3px 10px rgba(13,40,80,.04)}
.yz-t{display:flex;align-items:center;gap:11px}.yz-t b{display:block;font-size:15px}.yz-t span{font-size:12.5px;color:var(--ink-2)}.yz-t .big{margin-left:auto;text-align:right}.yz-t .big b{font-size:22px;line-height:1}.yz-t .big span{display:block;margin-top:2px}
.yz-b{height:10px;border-radius:9px;background:#E8EEF7;overflow:hidden;display:flex}.yz-b i{display:block;height:100%}.yz-b .u{background:linear-gradient(90deg,#3F86DD,#6AA6EE)}.yz-b .c{background:repeating-linear-gradient(45deg,#BCD3F2 0 4px,#DCE8FA 4px 8px)}
.yz-m{display:flex;flex-wrap:wrap;gap:6px}.yz-m span{background:#F2F5FA;border-radius:99px;padding:4px 10px;font-size:12px;color:var(--ink-2)}.yz-m span.w{background:#FDF1DC;color:#8F5A00}.yz-m span.g{background:#E8F6EE;color:#1F6B42}
.yz-c .act{display:flex;gap:8px}.yz-c .act .btn{flex:1;min-height:38px;border-radius:12px;font-size:13px}
.yz-in{display:flex;flex-direction:column;gap:8px}.yz-i{display:flex;gap:10px;align-items:flex-start;border-radius:14px;padding:10px 12px;font-size:13.5px;background:#F2F6FC}.yz-i.w{background:#FDF1DC;color:#8F5A00}.yz-i.ok{background:#E8F6EE;color:#1F6B42}
.yz-lg{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #F0F3F8}.yz-lg:first-of-type{border-top:0}.yz-lg .grow{min-width:0}.yz-lg b{display:block;font-size:14px}.yz-lg small{color:var(--ink-2);font-size:12px}.yz-lg button{flex:none;border:1px solid #E1E8F2;background:#fff;border-radius:10px;width:36px;height:36px;display:grid;place-items:center;color:#8A96A8}
.yz-f{display:grid;gap:10px;margin:10px 0}.yz-f label{font-size:13px;color:var(--ink-2);display:grid;gap:4px}.yz-f input{min-height:44px;border:1px solid #D8E1EE;border-radius:12px;padding:0 12px;font:inherit;box-sizing:border-box;width:100%}
`; document.head.appendChild(st);}
const YZ_CARRY = {}; P_OBJ.push(['YZ_CARRY', () => YZ_CARRY]);
function yizCarry(uid) { return Math.max(0, Number(YZ_CARRY[uid]) || 0); }
function yizInfo(uid) {
  const p = PROFILES[uid] || {}; const mm = p.hire ? monthsBetween(p.hire) : 0; const ent = leaveDays(mm, uid), carry = yizCarry(uid), tot = ent + carry;
  const L = LEAVES.filter((x) => x.uid === uid && x.type === 'yillik'); const used = L.reduce((a, x) => a + x.days, 0); const left = tot - used;
  let next = null, nextDays = 0;
  if (p.hire) { const a = p.hire.split('-').map(Number); let ny = REF.y; if (REF.m > a[1] || (REF.m === a[1] && REF.d >= a[2])) ny++; if (mm < 12) ny = a[0] + 1; const iso = ny + '-' + String(a[1]).padStart(2, '0') + '-' + String(a[2]).padStart(2, '0'); const days = Math.round((new Date(iso) - new Date(REF.y, REF.m - 1, REF.d)) / 86400000); next = { iso, days }; nextDays = leaveDays((Math.floor(mm / 12) + 1) * 12, uid); }
  const pend = LVREQ.filter((r) => r.uid === uid && r.type === 'yillik' && ['bekliyor', 'yanit'].includes(r.status)).reduce((a, r) => a + lrEff(r).days, 0);
  return { p, mm, ent, carry, tot, used, left, L, next, nextDays, pend };
}
function yizCard(id) {
  const u = byId(id), i = yizInfo(id); const pc = (n) => (i.tot ? Math.min(100, Math.round(n / i.tot * 100)) : 0);
  const chips = [];
  if (i.mm < 12) chips.push(`<span class="g">İlk hak: ${isoTxt(i.next.iso)}</span>`); else if (i.next) chips.push(`<span>Yeni hak ${isoTxt(i.next.iso)}, +${i.nextDays} gün</span>`);
  if (i.carry) chips.push(`<span>Devreden ${i.carry} gün</span>`); if (i.pend) chips.push(`<span class="w">${i.pend} gün talep bekliyor</span>`); if (i.left >= 10 && i.mm >= 12) chips.push('<span class="w">Birikmiş izin</span>'); if (i.left < 0) chips.push('<span class="w">Hakkı aşmış</span>');
  const last = i.L.length ? i.L[i.L.length - 1].txt : '';
  return `<div class="yz-c"><div class="yz-t">${avatar(u, 42)}<div><b>${esc(u.name)}</b><span>Kıdem ${i.mm ? tenureTxt(i.mm) : '1 aydan az'}</span></div><div class="big"><b>${i.tot ? i.left : '—'}</b><span>${i.tot ? 'gün kaldı' : 'hak yok'}</span></div></div>${i.tot ? `<div class="yz-b" title="Kullanılan ${i.used}, kalan ${Math.max(0, i.left)}"><i class="u" style="width:${pc(i.used)}%"></i></div><div class="small muted" style="display:flex;justify-content:space-between"><span>${i.used} gün kullanıldı</span><span>Toplam hak ${i.tot} gün</span></div>` : ''}<div class="yz-m">${chips.join('') || '<span>Kayıtlı kullanım yok</span>'}${last ? `<span>Son: ${esc(last)}</span>` : ''}</div><div class="act"><button class="btn sec" data-a="yizd" data-id="${id}">Ayrıntı</button><button class="btn" data-a="yizadd" data-id="${id}">${ic('plus', 15)} İzin kaydet</button></div></div>`;
}
function yizView(segH) {
  const I = EMP_IDS.map((id) => ({ id, i: yizInfo(id) })); const tot = I.reduce((a, x) => a + x.i.tot, 0), used = I.reduce((a, x) => a + x.i.used, 0), left = tot - used; const soon = I.filter((x) => x.i.mm < 12 && x.i.next && x.i.next.days <= 120).length;
  const ins = []; I.forEach(({ id, i }) => { const n = byId(id).name;
    if (i.mm >= 12 && i.left >= 10) ins.push({ t: 'w', x: `${n}: ${i.left} gün kullanılmamış izin var. Planlamasını öner.` });
    if (i.left < 0) ins.push({ t: 'w', x: `${n}: hakkından ${-i.left} gün fazla izin kullanmış görünüyor. Kaydı kontrol et.` });
    if (i.mm < 12 && i.next) ins.push({ t: '', x: `${n}: ${isoTxt(i.next.iso)} tarihinde ilk yıllık izin hakkını kazanacak (${leaveDays(12, id)} gün).` });
    else if (i.next && i.next.days <= 60 && i.nextDays > i.ent) ins.push({ t: '', x: `${n}: ${isoTxt(i.next.iso)} tarihinde izin hakkı ${i.ent} günden ${i.nextDays} güne çıkacak.` }); });
  if (!ins.length) ins.push({ t: 'ok', x: 'Herkesin izin durumu düzenli. Biriken veya aşan izin yok.' });
  return `<div class="stack-lg">${segH}<div class="iz-t"><div><span>Toplam hak</span><b>${tot}<small>gün</small></b></div><div><span>Kullanılan</span><b>${used}<small>gün</small></b></div><div class="${left < 0 ? 'bad' : ''}"><span>Kalan</span><b>${left}<small>gün</small></b></div><div><span>Yakında hak kazanan</span><b>${soon}<small>kişi</small></b></div></div>
  <div class="ek"><div class="ek-main"><section class="mg-card"><div class="ek-h"><h2>Yıllık izin durumu</h2><span>${EMP_IDS.length} kişi</span></div><div class="yz-g">${EMP_IDS.map(yizCard).join('')}</div></section></div><div class="ek-side"><section class="mg-card"><div class="ek-h"><h2>Kais'in notları</h2></div><div class="yz-in">${ins.slice(0, 8).map((x) => `<div class="yz-i ${x.t}">${ic(x.t === 'ok' ? 'check' : 'info', 16)}<span>${esc(x.x)}</span></div>`).join('')}</div></section><section class="mg-card"><div class="ek-h"><h2>Nasıl hesaplanır?</h2></div><p class="small muted" style="margin:0">İş Kanunu'na göre 1 yılı dolduran çalışan, kıdemine göre yıllık izin kazanır: 1–5 yıl 14, 5–15 yıl 20, 15 yıl ve üstü 26 gün. Geçmiş yıllardan kalan günleri "Ayrıntı" bölümünde devreden olarak girebilirsin.</p></section></div></div></div>`;
}
H.yizd = (el) => { S.modal = { type: 'yizd', id: el.dataset.id }; renderModal(); };
H.yizadd = (el) => { S.modal = { type: 'yizadd', id: el.dataset.id }; renderModal(); };
function yizDetail() {
  const id = S.modal.id, u = byId(id), i = yizInfo(id); const oth = LEAVES.filter((x) => x.uid === id && x.type !== 'yillik'); const R = (k, v, sub) => `<div class="dr-r"><span>${k}${sub ? `<small>${sub}</small>` : ''}</span><b>${v}</b></div>`;
  const hist = i.L.length ? i.L.map((x) => `<div class="yz-lg"><div class="grow"><b>${esc(x.txt)}</b><small>${x.days} gün${x.note ? ' · ' + esc(x.note) : ''}</small></div><button data-a="yizdel" data-i="${x.id}" aria-label="Kaydı sil" title="${S.yizDel === x.id ? 'Silmek için tekrar dokun' : 'Sil'}" style="${S.yizDel === x.id ? 'background:#FDECEA;color:#D9534F;border-color:#F3C9C5' : ''}">${ic('trash', 16)}</button></div>`).join('') : '<p class="muted small" style="margin:0">Kayıtlı yıllık izin kullanımı yok.</p>';
  return sheet(u.name + ' · yıllık izin', `<div class="dr-k"><div><span>Toplam hak</span><b>${i.tot} gün</b></div><div><span>Kullanılan</span><b>${i.used} gün</b></div><div><span>Kalan</span><b>${i.left} gün</b></div></div><div class="dr-bar"><i style="width:${i.tot ? Math.min(100, Math.round(i.used / i.tot * 100)) : 0}%"></i></div>
  <div class="dr-s"><h4>Hak bilgisi</h4>${R('İşe giriş', i.p.hire ? esc(isoTxt(i.p.hire)) : '—', 'Kıdem ' + (i.mm ? tenureTxt(i.mm) : '1 aydan az'))}${R('Bu yılın hakkı', i.ent ? i.ent + ' gün' : 'Henüz doğmadı')}${R('Devreden', i.carry + ' gün', 'Geçmiş yıllardan kalan')}${i.next ? R(i.mm < 12 ? 'İlk hak tarihi' : 'Sonraki yenileme', esc(isoTxt(i.next.iso)), i.next.days + ' gün sonra, +' + i.nextDays + ' gün') : ''}${i.pend ? R('Bekleyen talep', i.pend + ' gün') : ''}</div>
  <div class="yz-f"><label>Devreden gün sayısı<input id="yz-carry" type="number" min="0" inputmode="numeric" value="${i.carry || ''}" placeholder="0"></label><button class="btn sec" data-a="yizcarry">Devreden günü kaydet</button></div>
  <div class="dr-s"><h4>Kullanım geçmişi</h4>${hist}</div>${oth.length ? `<div class="dr-s"><h4>Diğer izinler</h4>${oth.map((x) => R(`<span class="pill ${LV_PILL[x.type] || 'p-mute'}">${LV_KIND[x.type] || x.type}</span> ${esc(x.txt)}`, x.days + ' gün')).join('')}</div>` : ''}<div class="dr-a"><button class="btn" data-a="yizadd" data-id="${id}">${ic('plus', 16)} İzin kaydet</button></div>`).replace('class="sheet"', 'class="sheet empw"');
}
H.yizcarry = () => { const id = S.modal.id; const v = Math.max(0, Math.round(Number((document.getElementById('yz-carry') || {}).value) || 0)); if (v) YZ_CARRY[id] = v; else delete YZ_CARRY[id]; vdSave(); renderModal(); render(); toast('Devreden izin kaydedildi.', 'ok'); };
H.yizdel = (el) => { const id = el.dataset.i; if (S.yizDel !== id) { S.yizDel = id; renderModal(); return; } S.yizDel = null; const k = LEAVES.findIndex((x) => x.id === id); if (k >= 0) LEAVES.splice(k, 1); vdSave(); renderModal(); render(); toast('Kayıt silindi.', 'ok'); };
function yizAddSheet() { const id = S.modal.id, u = byId(id), i = yizInfo(id);
  return sheet(u.name + ' · izin kaydet', `<p class="small muted" style="margin:0">Kalan yıllık izin: <b>${i.left} gün</b>. Geçmişte kullandığı izni de buradan kaydedebilirsin.</p><div class="yz-f"><label>Tarih<input id="yz-txt" placeholder="Örnek: 18–22 Ağu" autocomplete="off"></label><label>Gün sayısı<input id="yz-days" type="number" min="1" inputmode="numeric" placeholder="5"></label><label>Not (isteğe bağlı)<input id="yz-note" placeholder="Örnek: Tatil" autocomplete="off"></label></div><p id="yz-err" class="small" style="color:#D9534F;min-height:18px;margin:0"></p><div class="dr-a"><button class="btn" data-a="yizsave">Kaydet</button></div>`); }
H.yizsave = () => { const g = (k) => document.getElementById(k), id = S.modal.id, i = yizInfo(id); const txt = (g('yz-txt').value || '').trim(), days = Number(g('yz-days').value), note = (g('yz-note').value || '').trim(); const er = (t) => { g('yz-err').textContent = t; };
  if (!txt) return er('Tarihi yaz.'); if (!(days >= 1)) return er('Gün sayısını yaz.'); if (days > i.left) return er(i.tot ? `Kalan yıllık izin ${Math.max(0, i.left)} gün. Daha fazlası kaydedilemez.` : 'Yıllık izin hakkı henüz doğmadı.');
  const o = { id: 'lv' + ++seq, uid: id, type: 'yillik', txt, days }; if (note) o.note = note; LEAVES.push(o); vdSave(); S.modal = { type: 'yizd', id }; renderModal(); render(); toast('İzin kaydedildi.', 'ok'); };
{const _r = renderModal; renderModal = function () { const t = S.modal && S.modal.type; if (t === 'yizd' || t === 'yizadd') { const root = $('#modal-root'); if (!root) return; try { root.innerHTML = t === 'yizd' ? yizDetail() : yizAddSheet(); } catch (e) { root.innerHTML = ''; S.modal = null; } return; } return _r.apply(this, arguments); };}
/* mevcut ekranlara devreden izin */
{const _eb = ekBal; ekBal = function (id) { const r = _eb.apply(this, arguments); const c = yizCarry(id); if (c) { r.ent += c; r.left = Math.max(0, r.ent - r.used); } return r; };}
/* ===== v76: Vardiya sayfası alt kartları (gün çizelgesi, çalışan özeti, 7 gün) ===== */
{const st=document.createElement('style'); st.textContent=`
.tl-ds{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}.tl-ds::-webkit-scrollbar{height:6px}.tl-ds::-webkit-scrollbar-thumb{background:#C9D5E6;border-radius:9px}
.tl-ds button{flex:none;border:1px solid #E1E8F2;background:#fff;border-radius:12px;padding:6px 10px;font:600 13px inherit;font-family:inherit;color:var(--ink);text-align:center;min-width:46px}.tl-ds button small{display:block;font-weight:500;color:var(--ink-2);font-size:11px}.tl-ds button[aria-pressed=true]{background:var(--cini);border-color:var(--cini);color:#fff}.tl-ds button[aria-pressed=true] small{color:#DCE8FA}.tl-ds button.h{border-color:#F3C9C5}
.tl-w{position:relative;display:grid;grid-template-columns:104px 1fr;gap:6px 8px;align-items:center;margin-top:6px}
.tl-ax{display:flex;justify-content:space-between;font-size:11px;color:#9AA7BA}.tl-n{font:600 13px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-t{position:relative;height:30px;border-radius:9px;background:repeating-linear-gradient(90deg,#F2F5FA 0 1px,#F8FAFD 1px 4.1666%);overflow:hidden}
.tl-b{position:absolute;top:3px;bottom:3px;border-radius:7px;color:#fff;font:700 11px system-ui;display:flex;align-items:center;padding:0 8px;white-space:nowrap;overflow:hidden}
.tl-o{position:absolute;inset:0;display:flex;align-items:center;padding:0 10px;font-size:12px;color:#7A8799}
.tl-now{position:absolute;top:22px;bottom:0;width:2px;background:#D9534F;border-radius:2px;pointer-events:none}.tl-now::before{content:'Şimdi';position:absolute;top:-17px;left:50%;transform:translateX(-50%);font:700 10px system-ui;color:#D9534F}
.vs-t{width:100%;border-collapse:collapse;min-width:620px}.vs-t th{font:600 12px system-ui;color:var(--ink-2);text-align:left;padding:6px 8px}.vs-t td{padding:9px 8px;border-top:1px solid #EDF1F7;font-size:13.5px;white-space:nowrap}.vs-t td b{font-weight:700}
.vs-t .tc{display:inline-flex;align-items:center;gap:4px;margin-right:8px;font-size:12.5px}.vs-t .tc i{width:10px;height:10px;border-radius:3px;display:inline-block}
.vs-t .wk{display:inline-block;min-width:34px;text-align:center;border-radius:8px;padding:3px 6px;background:#E8F6EE;color:#1F6B42;font-weight:600;font-size:12.5px;margin-right:4px}.vs-t .wk.o{background:#FDF1DC;color:#8F5A00}
.vs-sc{overflow-x:auto;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}
.nx-r{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #EDF1F7}.nx-r:first-of-type{border-top:0}.nx-r .d{width:62px;flex:none}.nx-r .d b{display:block;font-size:14px}.nx-r .d span{font-size:12px;color:var(--ink-2)}.nx-r .ch{display:flex;gap:5px;flex-wrap:wrap;flex:1;min-width:0}.nx-r .ch span{border-radius:99px;padding:3px 10px;font-size:12px;color:#fff}.nx-r .cn{font:700 13px system-ui;color:#2F9E5F}.nx-r .cn.b{color:#D9534F}
`; document.head.appendChild(st);}
const vdHr = (s) => { const [h, m] = s.split(':').map(Number); return h + m / 60; };
function vdExtra(y, m) {
  const dim = new Date(y, m + 1, 0).getDate(), now = new Date(), isCur = now.getFullYear() === y && now.getMonth() === m; let sd = Number(S.vdDay) || (isCur ? now.getDate() : 1); if (sd > dim || sd < 1) sd = isCur ? now.getDate() : 1;
  const dsel = Array.from({ length: dim }, (_, i) => { const d = i + 1; return `<button type="button" data-a="vdday" data-v="${d}" aria-pressed="${d === sd}" class="${vdHolFull(y, m, d) ? 'h' : ''}">${d}<small>${VD_DAY[new Date(y, m, d).getDay()]}</small></button>`; }).join('');
  const lo = Math.min(6, ...VD_T.map((t) => Math.floor(vdHr(t.s)))), hi = 24; const pc = (x) => ((x - lo) / (hi - lo) * 100);
  const rows = EMP_IDS.map((id) => { const s = vdState(y, m, sd, id); let inner = '';
    if (s.k === 'shift') { const a = vdHr(s.t.s); let e = vdHr(s.t.e); if (e <= a) e = 24; if (e > 24) e = 24; inner = `<div class="tl-b" style="left:${pc(a)}%;width:${pc(e) - pc(a)}%;background:${s.t.c}">${esc(s.t.n)} ${s.t.s}–${vdEnd(s.t)}</div>`; }
    else inner = `<div class="tl-o">${s.k === 'leave' ? 'İzinli' : s.k === 'off' ? 'Haftalık izin' : s.k === 'hol' ? 'Resmi tatil, kapalı' : 'Vardiya yok'}</div>`;
    return `<div class="tl-n">${esc(byId(id).name)}</div><div class="tl-t">${inner}</div>`; }).join('');
  const ticks = []; for (let h = lo; h <= hi; h += 3) ticks.push(`<span>${vdP(h % 24)}:00</span>`);
  const nowP = isCur && sd === now.getDate() ? pc(now.getHours() + now.getMinutes() / 60) : -1; const hs = vdHolFull(y, m, sd);
  const onN = EMP_IDS.filter((id) => vdState(y, m, sd, id).k === 'shift').length;
  const tl = `<section class="mg-card"><div class="ek-h"><h2>Günün çizelgesi</h2><span>${sd} ${VD_MON[m]} · ${onN} kişi çalışıyor${hs ? ' · ' + esc(hs.n) : ''}</span></div><div class="tl-ds">${dsel}</div><div class="tl-w"><div></div><div class="tl-ax">${ticks.join('')}</div>${rows}${nowP >= 0 && nowP <= 100 ? `<div class="tl-now" style="left:calc(112px + (100% - 112px) * ${nowP / 100})"></div>` : ''}</div></section>`;
  /* çalışan özeti */
  const off0 = vdMon0(y, m); const nW = Math.floor((dim + off0 - 1) / 7) + 1;
  const trs = EMP_IDS.map((id) => { const cnt = {}; let we = 0, offN = 0, lvN = 0, hrs = 0; const W = {};
    for (let d = 1; d <= dim; d++) { const s = vdState(y, m, d, id); if (s.k === 'shift') { cnt[s.t.id] = (cnt[s.t.id] || 0) + 1; const h = vdHours(s.t); hrs += h; const w = Math.floor((d + off0 - 1) / 7); W[w] = (W[w] || 0) + h; if ([0, 6].includes(new Date(y, m, d).getDay())) we++; } else if (s.k === 'off') offN++; else if (s.k === 'leave') lvN++; }
    const wk = Array.from({ length: nW }, (_, w) => W[w] ? `<span class="wk${W[w] > 45 ? ' o' : ''}" title="${w + 1}. hafta">${W[w]}</span>` : '').join('');
    return `<tr><td><b>${esc(byId(id).name)}</b></td><td>${VD_T.map((t) => `<span class="tc"><i style="background:${t.c}"></i>${cnt[t.id] || 0}</span>`).join('')}</td><td>${we}</td><td>${offN}${lvN ? ' + ' + lvN + ' izin' : ''}</td><td><b>${hrs}</b> sa</td><td>${wk || '—'}</td></tr>`; }).join('');
  const sum = `<section class="mg-card"><div class="ek-h"><h2>Çalışan özeti</h2><span>${VD_MON[m]} · haftalık saatler, 45 üstü turuncu</span></div><div class="vs-sc"><table class="vs-t"><thead><tr><th>Çalışan</th><th>Vardiya sayısı</th><th>Hafta sonu</th><th>İzin günü</th><th>Toplam</th><th>Haftalık saat</th></tr></thead><tbody>${trs}</tbody></table></div></section>`;
  /* sonraki 7 gün */
  const st0 = isCur ? now.getDate() : 1; const nx = []; for (let i = 0; i < 7; i++) { const dt = new Date(y, m, st0 + i); const yy = dt.getFullYear(), mm = dt.getMonth(), dd = dt.getDate(); const W = EMP_IDS.map((id) => ({ id, s: vdState(yy, mm, dd, id) })).filter((x) => x.s.k === 'shift'); const h = vdHolFull(yy, mm, dd); const min = Number(S.settings.shMin) || 1;
    nx.push(`<div class="nx-r"><div class="d"><b>${dd} ${VD_MON[mm].slice(0, 3)}</b><span>${VD_DAY[dt.getDay()]}${h ? ' · tatil' : ''}</span></div><div class="ch">${W.length ? W.map((x) => `<span style="background:${x.s.t.c}" title="${esc(x.s.t.n + ' ' + x.s.t.s + '–' + vdEnd(x.s.t))}">${esc(byId(x.id).name.split(' ')[0])} ${x.s.t.s}</span>`).join('') : '<span style="background:#B3BCC9">Vardiya yok</span>'}</div><span class="cn${W.length < min && !(S.settings.holClosed && h) ? ' b' : ''}">${W.length}</span></div>`); }
  const nxt = `<section class="mg-card"><div class="ek-h"><h2>Önümüzdeki 7 gün</h2><span>Kim hangi saatte</span></div>${nx.join('')}</section>`;
  return tl + nxt + sum;
}
document.addEventListener('change', (e) => { const t = e.target; if (t && t.id === 'vd-min') { const v = Math.max(1, Math.min(Math.max(1, EMP_IDS.length), Math.round(Number(t.value) || 1))); S.settings.shMin = v; vdSave(); render(); toast('Günlük en az ' + v + ' kişi olarak ayarlandı.', 'ok'); } });
H.vdday = (el) => { S.vdDay = Number(el.dataset.v); render(); };
{const _v = vdView; vdView = function (segH) { let h = _v.apply(this, arguments); try { const [y, m] = vdBase(); const i = h.indexOf('<div class="ek-side">'); if (i > 0) { const j = h.lastIndexOf('</div>', i); h = h.slice(0, j) + vdExtra(y, m) + h.slice(j); } } catch (e) {} return h; }; }
/* ===== v77: Yıllık izin sayfası yenilendi (halka, ay şeridi, filtre, Kais plan önerisi) ===== */
{const st=document.createElement('style'); st.textContent=`
.yq-h{display:flex;align-items:center;gap:20px;flex-wrap:wrap;background:linear-gradient(135deg,#F4F8FF,#fff);border:1px solid #D7E6FB;border-radius:22px;padding:18px 20px}
.yq-r{position:relative;width:104px;height:104px;flex:none}.yq-r svg{width:104px;height:104px;transform:rotate(-90deg)}.yq-r b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;line-height:1.1}.yq-r b small{display:block;font-size:11px;font-weight:500;color:var(--ink-2);text-align:center;margin:2px 0 0}
.yq-hx{flex:1 1 220px;min-width:0}.yq-hx h2{margin:0 0 3px;font-size:19px}.yq-hx p{margin:0;font-size:13.5px;color:var(--ink-2)}
.yq-s{display:grid;grid-template-columns:repeat(4,minmax(86px,1fr));gap:10px;flex:2 1 360px}.yq-s div{background:#fff;border:1px solid #E1E8F2;border-radius:14px;padding:10px 12px}.yq-s span{display:block;font-size:12px;color:var(--ink-2)}.yq-s b{font-size:20px}.yq-s b small{font-size:12px;font-weight:600;color:var(--ink-2);margin-left:3px}.yq-s .bad b{color:#D9534F}
@media(max-width:560px){.yq-s{grid-template-columns:repeat(2,1fr)}}
.yq-f{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;align-items:center;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}.yq-f button{flex:none;border:1px solid #E1E8F2;background:#fff;border-radius:99px;padding:7px 13px;font:600 13px inherit;font-family:inherit;color:var(--ink);white-space:nowrap}.yq-f button b{margin-left:4px;color:var(--ink-2)}.yq-f button[aria-pressed=true]{background:var(--cini);border-color:var(--cini);color:#fff}.yq-f button[aria-pressed=true] b{color:#fff}.yq-f .sp{flex:1}.yq-f select{border:1px solid #E1E8F2;background:#fff;border-radius:12px;padding:7px 10px;font:600 13px inherit;font-family:inherit;color:var(--ink)}
.yq-c{background:#fff;border:1px solid #E1E8F2;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 3px 10px rgba(13,40,80,.04);transition:box-shadow .15s,transform .15s}.yq-c:hover{transform:translateY(-2px);box-shadow:0 14px 26px -16px rgba(13,40,80,.3)}
.yq-b{display:flex;height:12px;border-radius:9px;overflow:hidden;background:#E8EEF7;gap:2px}.yq-b i{display:block;height:100%}.yq-b .u{background:linear-gradient(90deg,#3F86DD,#6AA6EE)}.yq-b .p{background:repeating-linear-gradient(45deg,#BCD3F2 0 4px,#E6EEFA 4px 8px)}.yq-b .k{background:#CFE5D8}
.yq-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink-2)}.yq-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.yq-m{display:grid;grid-template-columns:repeat(12,1fr);gap:3px}.yq-m div{height:30px;border-radius:7px;background:#F2F5FA;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:#9AA7BA;line-height:1.1}.yq-m div b{font-size:11px;color:#fff}.yq-m div.u{background:#5E9AEA;color:#DCE8FA}.yq-m div.now{box-shadow:0 0 0 2px var(--cini) inset}
.yq-c .act{display:flex;gap:6px}.yq-c .act .btn{flex:1;min-height:38px;border-radius:12px;font-size:13px;padding:0 8px;white-space:nowrap}.yq-c{align-self:start}.yq-f select{height:36px;padding:0 10px;width:128px;flex:none}.yz-g{max-height:760px}
.yq-sg{border:1px solid #D7E6FB;background:#F4F8FF;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}.yq-sg+.yq-sg{margin-top:8px}.yq-sg .t{display:flex;align-items:center;gap:10px}.yq-sg b{font-size:14px}.yq-sg p{margin:0;font-size:12.5px;color:var(--ink-2)}.yq-sg .btn{min-height:36px;border-radius:11px;font-size:13px}
`; document.head.appendChild(st);}
const YQ_M = ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];
function yizMonths(uid) { const A = Array(12).fill(0); LEAVES.filter((x) => x.uid === uid && x.type === 'yillik').forEach((x) => { let q = null; try { q = izOrd(x.txt); } catch (e) {} if (!q) return; for (let o = q[0]; o <= q[1] && o - q[0] < 40; o++) { const m = Math.floor(o / 40), d = o % 40; if (d >= 1 && d <= 31 && m <= 11) A[m]++; } }); return A; }
function yizSuggest(uid) {
  const i = yizInfo(uid); if (i.left < 3) return null; const n = Math.min(5, i.left); const now = new Date(); const min = Number(S.settings.shMin) || 1; let best = null;
  for (let w = 1; w <= 10; w++) { const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((8 - now.getDay()) % 7 || 7) + (w - 1) * 7); let sc = w * 0.3, hol = 0, others = 0, thin = 0;
    for (let k = 0; k < n; k++) { const dt = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + k), y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
      if (vdHolFull(y, m, d) && !S.settings.holClosed) hol++; EMP_IDS.forEach((id) => { if (id !== uid && vdOnLeave(id, m, d)) others++; }); if (vdAvail(y, m, d, uid) < min) thin++; }
    if (hol) continue; sc += others * 3 + thin * 10; const e = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + n - 1);
    const txt = mon.getMonth() === e.getMonth() ? `${mon.getDate()}–${e.getDate()} ${VD_MON[mon.getMonth()]}` : `${mon.getDate()} ${VD_MON[mon.getMonth()]}–${e.getDate()} ${VD_MON[e.getMonth()]}`;
    if (!best || sc < best.sc) best = { sc, txt, days: n, others, thin }; }
  if (!best) return null; best.why = best.others ? `${best.others} kişi-gün başka izin var ama kadro yeterli` : 'O hafta kimse izinli değil, kadro tam'; return best;
}
H.yzf = (el) => { S.yzf = el.dataset.v; render(); };
H.yzs = (el) => { S.yzs = el.value; render(); };
document.addEventListener('change', (e) => { if (e.target && e.target.id === 'yq-sort') { S.yzs = e.target.value; render(); } });
H.yizsug = (el) => { const id = el.dataset.id, s = yizSuggest(id); if (!s) return; pushSend([id], 'İzin planı önerisi', `Kais senin için ${s.txt} tarihlerini önerdi (${s.days} gün). Uygunsa izin talebi gönderebilirsin. Kais iyi günler diler.`); toast('Öneri çalışana gönderildi.', 'ok'); };
yizCard = function (id) {
  const u = byId(id), i = yizInfo(id), mo = yizMonths(id), nowM = new Date().getMonth(); const tot = Math.max(1, i.tot); const w = (n) => Math.max(0, Math.min(100, n / tot * 100)); const rest = Math.max(0, i.left - i.pend);
  const chips = []; if (i.mm < 12) chips.push(`<span class="g">İlk hak ${isoTxt(i.next.iso)}</span>`); else if (i.next) chips.push(`<span>Yeni hak ${isoTxt(i.next.iso)}, +${i.nextDays} gün</span>`);
  if (i.carry) chips.push(`<span>Devreden ${i.carry} gün</span>`); if (i.left >= 10 && i.mm >= 12) chips.push('<span class="w">Birikmiş izin</span>'); if (i.left < 0) chips.push('<span class="w">Hakkı aşmış</span>');
  const sug = yizSuggest(id);
  return `<div class="yq-c"><div class="yz-t">${avatar(u, 42)}<div><b>${esc(u.name)}</b><span>Kıdem ${i.mm ? tenureTxt(i.mm) : '1 aydan az'}</span></div><div class="big"><b>${i.tot ? i.left : '—'}</b><span>${i.tot ? 'gün kaldı' : 'hak yok'}</span></div></div>
  ${i.tot ? `<div class="yq-b" title="Kullanılan ${i.used}, bekleyen ${i.pend}, kalan ${rest}"><i class="u" style="width:${w(i.used)}%"></i><i class="p" style="width:${w(Math.min(i.pend, i.left))}%"></i><i class="k" style="width:${w(rest)}%"></i></div><div class="yq-lg"><span><i style="background:#5E9AEA"></i>Kullanılan ${i.used}</span>${i.pend ? `<span><i style="background:#BCD3F2"></i>Bekleyen ${Math.min(i.pend, i.left)}</span>` : ''}<span><i style="background:#CFE5D8"></i>Kalan ${rest}</span><span style="margin-left:auto">Hak ${i.tot}</span></div>` : ''}
  <div class="yq-m" title="Aylara göre kullanılan yıllık izin">${mo.map((n, k) => `<div class="${n ? 'u' : ''}${k === nowM ? ' now' : ''}">${n ? `<b>${n}</b>` : ''}${YQ_M[k]}</div>`).join('')}</div>
  <div class="yz-m">${chips.join('') || '<span>Kayıtlı kullanım yok</span>'}</div><div class="act"><button class="btn sec" data-a="yizd" data-id="${id}">Ayrıntı</button>${sug ? `<button class="btn sec" data-a="yizsug" data-id="${id}" title="${esc(sug.txt + ': ' + sug.why)}">Kais önerisi</button>` : ''}<button class="btn" data-a="yizadd" data-id="${id}">${ic('plus', 15)} Kaydet</button></div></div>`;
};
yizView = function (segH) {
  const I = EMP_IDS.map((id) => ({ id, i: yizInfo(id) })); const tot = I.reduce((a, x) => a + x.i.tot, 0), used = I.reduce((a, x) => a + x.i.used, 0), left = tot - used, pend = I.reduce((a, x) => a + x.i.pend, 0); const pct = tot ? Math.min(100, Math.round(used / tot * 100)) : 0;
  const soon = I.filter((x) => x.i.mm < 12 && x.i.next && x.i.next.days <= 120).length; const R = 44, C = 2 * Math.PI * R; const fil = (k) => ({ '': () => true, bir: (x) => x.i.left >= 10 && x.i.mm >= 12, yeni: (x) => x.i.mm < 12 || (x.i.next && x.i.next.days <= 90), talep: (x) => x.i.pend > 0, as: (x) => x.i.left < 0 }[k] || (() => true));
  const F = [['', 'Hepsi'], ['bir', 'Birikmiş'], ['yeni', 'Yeni hak'], ['talep', 'Talep bekleyen'], ['as', 'Hakkı aşan']].map(([k, n]) => [k, n, I.filter(fil(k)).length]).filter((x) => x[0] === '' || x[2] > 0 || S.yzf === x[0]);
  let L = I.filter(fil(S.yzf || '')); const so = S.yzs || 'kalan'; L = L.slice().sort((a, b) => so === 'ad' ? byId(a.id).name.localeCompare(byId(b.id).name, 'tr') : so === 'kidem' ? b.i.mm - a.i.mm : b.i.left - a.i.left);
  const ins = []; I.forEach(({ id, i }) => { const n = byId(id).name;
    if (i.mm >= 12 && i.left >= 10) ins.push({ t: 'w', x: `${n}: ${i.left} gün kullanılmamış izin var.` }); if (i.left < 0) ins.push({ t: 'w', x: `${n}: hakkından ${-i.left} gün fazla izin kullanmış görünüyor.` });
    if (i.mm < 12 && i.next) ins.push({ t: '', x: `${n}: ${isoTxt(i.next.iso)} tarihinde ilk izin hakkını kazanacak (${leaveDays(12, id)} gün).` }); else if (i.next && i.next.days <= 60 && i.nextDays > i.ent) ins.push({ t: '', x: `${n}: ${isoTxt(i.next.iso)} tarihinde hakkı ${i.ent} günden ${i.nextDays} güne çıkacak.` }); });
  const ye = new Date(REF.y, 11, 31); const wk = Math.max(0, Math.round((ye - new Date(REF.y, REF.m - 1, REF.d)) / 604800000)); if (left > 0 && wk) ins.push({ t: '', x: `Yıl sonuna ${wk} hafta var. Ekipte toplam ${left} gün izin kalıyor.` });
  if (!ins.length) ins.push({ t: 'ok', x: 'Herkesin izin durumu düzenli.' });
  const sg = I.filter((x) => x.i.left >= 3).sort((a, b) => b.i.left - a.i.left).slice(0, 3).map((x) => ({ id: x.id, s: yizSuggest(x.id) })).filter((x) => x.s);
  const sgH = sg.length ? sg.map((x) => `<div class="yq-sg"><div class="t">${avatar(byId(x.id), 32)}<div class="grow"><b>${esc(byId(x.id).name)}</b><p>${esc(x.s.txt)} · ${x.s.days} gün</p></div></div><p>${esc(x.s.why)}</p><button class="btn sm" data-a="yizsug" data-id="${x.id}">Çalışana öner</button></div>`).join('') : '<p class="muted small" style="margin:0">Şu an önerilecek bir plan yok.</p>';
  return `<div class="stack-lg">${segH}<div class="yq-h"><div class="yq-r"><svg viewBox="0 0 104 104"><circle cx="52" cy="52" r="${R}" fill="none" stroke="#E3ECF8" stroke-width="10"/><circle cx="52" cy="52" r="${R}" fill="none" stroke="#3F86DD" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}"/></svg><b>%${pct}<small>kullanıldı</small></b></div><div class="yq-hx"><h2>Yıllık izin</h2><p>${left < 0 ? 'Ekip hakkını aşmış.' : `Ekipte ${left} gün izin hakkı duruyor.`}${pend ? ` ${pend} gün talep karar bekliyor.` : ''}</p></div><div class="yq-s"><div><span>Toplam hak</span><b>${tot}<small>gün</small></b></div><div><span>Kullanılan</span><b>${used}<small>gün</small></b></div><div class="${left < 0 ? 'bad' : ''}"><span>Kalan</span><b>${left}<small>gün</small></b></div><div><span>Yakında hak</span><b>${soon}<small>kişi</small></b></div></div></div>
  <div class="ek"><div class="ek-main"><section class="mg-card"><div class="ek-h"><h2>Çalışanlar</h2><span>${L.length} kişi</span></div><div class="yq-f">${F.map((x) => `<button type="button" data-a="yzf" data-v="${x[0]}" aria-pressed="${(S.yzf || '') === x[0]}">${x[1]}<b>${x[2]}</b></button>`).join('')}<span class="sp"></span><select id="yq-sort" aria-label="Sırala"><option value="kalan"${so === 'kalan' ? ' selected' : ''}>Kalan gün</option><option value="kidem"${so === 'kidem' ? ' selected' : ''}>Kıdem</option><option value="ad"${so === 'ad' ? ' selected' : ''}>Ad</option></select></div><div class="yz-g">${L.length ? L.map((x) => yizCard(x.id)).join('') : '<p class="muted" style="padding:14px">Bu filtrede kimse yok.</p>'}</div></section></div>
  <div class="ek-side"><section class="mg-card"><div class="ek-h"><h2>Kais'in plan önerileri</h2></div><p class="small muted" style="margin:0 0 10px">En az kişinin etkilendiği, resmi tatile denk gelmeyen haftalar.</p>${sgH}</section><section class="mg-card"><div class="ek-h"><h2>Notlar</h2></div><div class="yz-in">${ins.slice(0, 8).map((x) => `<div class="yz-i ${x.t}">${ic(x.t === 'ok' ? 'check' : 'info', 16)}<span>${esc(x.x)}</span></div>`).join('')}</div></section><section class="mg-card"><div class="ek-h"><h2>Nasıl hesaplanır?</h2></div><p class="small muted" style="margin:0">1 yılı dolduran çalışan kıdemine göre yıllık izin kazanır: 1–5 yıl 14, 5–15 yıl 20, 15 yıl ve üstü 26 gün. Geçmiş yıllardan kalan günleri Ayrıntı'dan devreden olarak girebilirsin.</p></section></div></div></div>`;
};
/* ===== v78: Kais mola yönetimi (sihirbaz, 3 taslak, düzenleme, bildirim) ===== */
{const st=document.createElement('style'); st.textContent=`
.br-k{display:flex;align-items:center;gap:14px;flex-wrap:wrap;border-radius:20px;padding:16px 18px;background:linear-gradient(135deg,#EAF2FE,#F8FBFF);border:1px solid #D7E6FB;height:fit-content}
.br-k .ico{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#3F86DD,#1B4FA8);flex:none}.br-k .tx{flex:1 1 240px;min-width:0}.br-k .tx b{display:block;font-size:16px}.br-k .tx p{margin:3px 0 0;font-size:13px;color:var(--ink-2)}.br-k .btn{min-height:42px;border-radius:13px}
.br-e{text-align:center;padding:26px 16px}.br-e b{display:block;font-size:17px;margin:8px 0 4px}.br-e p{margin:0 auto 14px;max-width:420px;color:var(--ink-2);font-size:13.5px}
.tl-k{position:absolute;top:2px;bottom:2px;border-radius:6px;background:#1E3A6B;color:#fff;font:700 10px system-ui;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap}
.tl-b.sh{opacity:.28}
.vs-t td .br-in,.br-rl .mb-o{gap:6px}.br-rl .mb-o button{padding:8px 12px;font-size:13px}.br-rl .vd-mn input{width:64px;min-height:38px}
.br-in{display:inline-block;height:36px;border:1px solid #D8E1EE;border-radius:10px;padding:0 6px;font:600 13px inherit;font-family:inherit;box-sizing:border-box;width:128px;vertical-align:middle}.vs-t td .br-in.m,.br-in.m{width:58px}
.br-pk{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}.br-pk .ch{flex:1 1 190px;border:1px solid #D7E6FB;background:#F8FBFF;border-radius:14px;padding:10px 12px}.br-pk .ch span{display:block;font-size:12px;color:var(--ink-2)}.br-pk .ch b{font-size:17px}.br-pk .ch.w{background:#FDF1DC;border-color:#F0D9A6}
.bw-q{margin:12px 0}.bw-q b{display:block;font-size:14.5px}.bw-q p{margin:2px 0 6px;font-size:12.5px;color:var(--ink-2)}
.bw-o{border:1px solid #E1E8F2;border-radius:18px;padding:14px;margin-bottom:10px;background:#fff}.bw-o.s{border-color:var(--cini);box-shadow:0 0 0 2px #CFE0F7}.bw-o h4{margin:0 0 2px;font-size:15.5px}.bw-o p{margin:0 0 8px;font-size:13px;color:var(--ink-2)}.bw-o .st{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}.bw-o .st span{background:#F2F5FA;border-radius:99px;padding:4px 10px;font-size:12px}.bw-o .st span.g{background:#E8F6EE;color:#1F6B42}.bw-o .st span.w{background:#FDF1DC;color:#8F5A00}
.bw-o .ls{max-height:96px;overflow-y:auto;font-size:12.5px;color:var(--ink-2);display:grid;gap:3px;margin-bottom:10px}
`; document.head.appendChild(st);}
const MB = { cfg: null, tp: {}, ov: {}, pub: false };
P_OBJ.push(['MB', () => MB]);
const brMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const brTxt = (x) => { x = ((Math.round(x) % 1440) + 1440) % 1440; return vdP(Math.floor(x / 60)) + ':' + vdP(x % 60); };
function brMakeTp(t, variant, cfg) {
  const c = cfg || MB.cfg || { count: 2, mins: 15, simul: 2 }; const H = vdHours(t) * 60, st = brMin(t.s); const simul = variant === 'tek' ? 1 : Math.max(1, c.simul), gap = variant === 'tek' ? 0 : 5; const o = [];
  for (let k = 1; k <= c.count; k++) o.push(Math.round(H * k / (c.count + 1) / 5) * 5);
  if (variant === 'yogun') { const span = 30; o.forEach((x, i) => { let a = st + x; [[720, 840], [1080, 1200]].forEach(([w0, w1]) => { if (a + span > w0 && a < w1) a = w1; }); o[i] = Math.min(H - c.mins - 10, a - st); }); }
  return { o, gap, simul, m: c.mins, v: variant || 'dengeli' };
}
function brSlots(uid, y, m, d, tpOv) {
  const s = vdState(y, m, d, uid); if (s.k !== 'shift' || !MB.cfg) return []; const t = s.t, st = brMin(t.s); const ov = MB.ov && MB.ov[uid + '|' + t.id]; if (ov && !tpOv) return ov.map((x) => ({ a: st + x.o, m: x.m }));
  const W = EMP_IDS.filter((id) => { const q = vdState(y, m, d, id); return q.k === 'shift' && q.t.id === t.id; }); const idx = W.indexOf(uid); const tp = (tpOv && tpOv[t.id]) || (MB.tp && MB.tp[t.id]) || brMakeTp(t, 'dengeli'); const G = Math.max(1, Math.ceil(W.length / tp.simul)), g = idx % G;
  return tp.o.map((o) => ({ a: st + o + g * (tp.m + tp.gap), m: tp.m }));
}
function brLoad(y, m, d, tpOv) { const peak = { n: 0, at: 0 }; let minStaff = 99; const min = Number(S.settings.shMin) || 1;
  for (let x = 360; x < 1440; x += 5) { let work = 0, br = 0; EMP_IDS.forEach((id) => { const s = vdState(y, m, d, id); if (s.k !== 'shift') return; const a = brMin(s.t.s); let e = brMin(s.t.e); if (e <= a) e += 1440; if (x >= a && x < e) { work++; if (brSlots(id, y, m, d, tpOv).some((k) => x >= k.a && x < k.a + k.m)) br++; } }); if (br > peak.n) { peak.n = br; peak.at = x; } if (work > 0) minStaff = Math.min(minStaff, work - br); }
  return { peak, minStaff: minStaff === 99 ? 0 : minStaff, bad: minStaff !== 99 && minStaff < min }; }
function brRefDay() { const now = new Date(); const y = now.getFullYear(), m = now.getMonth(); for (let i = 0; i < 31; i++) { const dt = new Date(y, m, now.getDate() + i); if (EMP_IDS.some((id) => vdState(dt.getFullYear(), dt.getMonth(), dt.getDate(), id).k === 'shift')) return [dt.getFullYear(), dt.getMonth(), dt.getDate()]; } return null; }
/* sihirbaz */
const bwAutoSimul = () => Math.max(1, Math.round(EMP_IDS.length / 3));
H.brwiz = () => { S.brw = { step: 1, count: MB.cfg ? MB.cfg.count : 2, mins: MB.cfg ? MB.cfg.mins : 15, simul: MB.cfg ? MB.cfg.simul : 0, opts: null }; S.modal = { type: 'brwiz' }; renderModal(); };
H.bwset = (el) => { S.brw[el.dataset.k] = Number(el.dataset.v); renderModal(); };
document.addEventListener('change', (e) => { const t = e.target; if (t && S.modal && S.modal.type === 'brwiz' && /^bw-/.test(t.id || '')) { const k = t.id.slice(3); const v = Math.max(k === 'simul' ? 0 : 1, Math.min(k === 'mins' ? 90 : 10, Math.round(Number(t.value) || 1))); S.brw[k] = v; renderModal(); } });
const bwCfg = () => ({ count: S.brw.count, mins: S.brw.mins, simul: S.brw.simul || bwAutoSimul() });
H.bwgo = () => { const r = brRefDay(); if (!r) { toast('Önce vardiya planı oluştur.', 'warn'); return; } const cfg = bwCfg(); const old = { cfg: MB.cfg, tp: MB.tp, ov: MB.ov }; MB.cfg = cfg; MB.ov = {};
  const V = [['dengeli', 'Dengeli dağılım', 'Molalar vardiyaya eşit yayılır, küçük gruplar halinde çıkılır.'], ['tek', 'Tek tek (en güvenli)', 'Aynı anda sadece bir kişi molada. Kadro hep tam kalır.'], ['yogun', 'Yoğun saatleri koru', 'Öğle (12–14) ve akşam (18–20) yoğunluğunda mola verilmez.']];
  S.brw.opts = V.map(([v, n, d]) => { const tp = {}; VD_T.forEach((t) => { tp[t.id] = brMakeTp(t, v, cfg); }); const ld = brLoad(r[0], r[1], r[2], tp); MB.tp = tp; const rows = EMP_IDS.map((id) => ({ id, k: brSlots(id, r[0], r[1], r[2], tp) })).filter((x) => x.k.length); return { v, n, d, tp, ld, rows }; });
  MB.cfg = old.cfg; MB.tp = old.tp; MB.ov = old.ov; S.brw.step = 2; S.brw.ref = r; renderModal(); };
H.bwpick = (el) => { const o = S.brw.opts.find((x) => x.v === el.dataset.v); if (!o) return; MB.cfg = bwCfg(); MB.tp = o.tp; MB.ov = {}; MB.pub = false; S.settings.brkPlan = MB.cfg.mins; S.settings.brkMax = Math.max(Number(S.settings.brkMax) || 0, MB.cfg.count * MB.cfg.mins + 15); vdSave(); S.modal = null; render(); toast('Taslak hazır. Üzerinde düzenleyip onayla.', 'ok'); };
function bwSheet() {
  const b = S.brw; const n = EMP_IDS.length; const chip = (k, vals, cur, suf) => `<div class="mb-o" style="margin:6px 0 0">${vals.map((v) => `<button type="button" data-a="bwset" data-k="${k}" data-v="${v}" aria-pressed="${cur === v}">${v}${suf}</button>`).join('')}<label class="vd-mn"><input id="bw-${k}" type="number" inputmode="numeric" min="${k === 'simul' ? 0 : 1}" value="${cur || ''}" ${k === 'simul' ? 'placeholder="Oto"' : ''} aria-label="Elle gir"></label></div>`;
  if (b.step === 1) { const hasPlan = !!brRefDay(); return sheet('Kais molaları yönetsin', `<p class="small muted" style="margin:0">Üç soruya cevap ver, Kais vardiyalara göre çakışmayan üç mola taslağı hazırlasın.</p>${hasPlan ? '' : '<div class="callout warn">' + ic('alert') + '<div><b>Vardiya planı yok</b><p style="margin-top:2px">Mola planı vardiyalara bağlıdır. Önce Vardiya sekmesinde plan oluştur.</p></div></div>'}
  <div class="bw-q"><b>Günde kaç mola olsun?</b><p>Her vardiya için</p>${chip('count', [1, 2, 3], b.count, '')}</div><div class="bw-q"><b>Her mola kaç dakika olsun?</b>${chip('mins', [10, 15, 20, 30], b.mins, ' dk')}</div><div class="bw-q"><b>Aynı anda en fazla kaç kişi molada olsun?</b><p>${n} çalışan var. Boş bırakırsan Kais ${bwAutoSimul()} kişi seçer.</p>${chip('simul', [1, 2, 3], b.simul, '')}</div><div class="dr-a"><button class="btn" data-a="bwgo" ${hasPlan ? '' : 'disabled'}>${ic('sparkle', 16)} Taslakları hazırla</button></div>`); }
  const r = b.ref; const day = `${r[2]} ${VD_MON[r[1]]}`;
  return sheet('Mola taslağını seç', `<p class="small muted" style="margin:0">${b.count} mola, ${b.mins} dk, aynı anda en fazla ${b.simul || bwAutoSimul()} kişi. Örnek gün: ${day}. Seçince üzerinde düzenleme yapabilirsin.</p>${b.opts.map((o) => `<div class="bw-o"><h4>${o.n}</h4><p>${o.d}</p><div class="st"><span class="${o.ld.peak.n > (b.simul || bwAutoSimul()) ? 'w' : ''}">Aynı anda en fazla ${o.ld.peak.n} kişi molada</span><span class="${o.ld.bad ? 'w' : 'g'}">${o.ld.bad ? 'Kadro ' + o.ld.minStaff + ' kişiye düşer' : 'Kadro en az ' + o.ld.minStaff + ' kişi'}</span></div><div class="ls">${o.rows.map((x) => `<div><b style="color:var(--ink)">${esc(byId(x.id).name)}</b> ${x.k.map((k) => brTxt(k.a) + '–' + brTxt(k.a + k.m)).join(', ')}</div>`).join('')}</div><button class="btn" data-a="bwpick" data-v="${o.v}">Bu taslağı seç</button></div>`).join('')}<div class="dr-a"><button class="btn sec" data-a="brwiz">Cevapları değiştir</button></div>`).replace('class="sheet"', 'class="sheet empw"');
}
{const _r = renderModal; renderModal = function () { if (S.modal && S.modal.type === 'brwiz') { const root = $('#modal-root'); if (!root) return; try { root.innerHTML = bwSheet(); } catch (e) { root.innerHTML = ''; S.modal = null; } return; } return _r.apply(this, arguments); }; }
/* düzenleme */
document.addEventListener('change', (e) => { const t = e.target; if (!t || (t.id !== 'br-plan' && t.id !== 'br-max')) return; const plan = t.id === 'br-plan'; const v = Math.max(plan ? 1 : 10, Math.min(plan ? 120 : 480, Math.round(Number(t.value) || (plan ? 15 : 60)))); S.settings[plan ? 'brkPlan' : 'brkMax'] = v; vdSave(); render(); toast((plan ? 'Planlanan mola ' : 'Günlük mola sınırı ') + v + ' dk olarak ayarlandı.', 'ok'); });
H.brday = (el) => { S.brDay = Number(el.dataset.v); render(); };
H.brpub = () => { MB.pub = true; MB.at = Date.now(); vdSave(); render(); pushSend(EMP_IDS.slice(), 'Mola planın hazır', 'Günlük mola saatlerin yayınlandı, Vardiyam bölümünden bakabilirsin. Kais iyi çalışmalar diler.'); toast('Mola planı yayınlandı. Çalışanlara bildirim gitti.', 'ok'); };
H.brdel = () => { if (S.brDel !== 1) { S.brDel = 1; toast('Mola planı silinecek. Onaylamak için tekrar dokun.', 'warn'); return; } S.brDel = 0; MB.cfg = null; MB.tp = {}; MB.ov = {}; MB.pub = false; vdSave(); render(); toast('Mola planı silindi.', 'ok'); };
H.brreset = (el) => { delete MB.ov[el.dataset.k]; vdSave(); render(); };
H.brnoti = () => { S.settings.brNotify = S.settings.brNotify === false; vdSave(); render(); };
document.addEventListener('change', (e) => { const t = e.target; if (!t || !t.classList || !t.classList.contains('br-in')) return; const uid = t.dataset.u, k = Number(t.dataset.k), f = t.dataset.f; const [y, m, d] = brDaySel(); const s = vdState(y, m, d, uid); if (s.k !== 'shift') return; const st = brMin(s.t.s); let en = brMin(s.t.e); if (en <= st) en += 1440;
  const cur = brSlots(uid, y, m, d).map((x) => ({ o: x.a - st, m: x.m })); if (!cur[k]) return; const nx = cur.map((x) => Object.assign({}, x));
  if (f === 't') { let a = brMin(t.value || '00:00'); if (a < st) a += 1440; nx[k].o = a - st; } else nx[k].m = Math.max(5, Math.min(90, Math.round(Number(t.value) || 15)));
  if (nx[k].o < 0 || st + nx[k].o + nx[k].m > en) { toast('Mola vardiya saatleri içinde olmalı.', 'warn'); render(); return; }
  MB.ov[uid + '|' + s.t.id] = nx; MB.pub = MB.pub; vdSave(); render(); toast('Mola güncellendi.', 'ok'); });
function brDaySel() { const now = new Date(); let d = Number(S.brDay) || now.getDate(); const y = now.getFullYear(), m = now.getMonth(); const dim = new Date(y, m + 1, 0).getDate(); if (d > dim) d = now.getDate(); return [y, m, d]; }
molaAyar = function () {
  const c = brkCfg(); const [y, m, d] = brDaySel(); const act = !!MB.cfg; const n = EMP_IDS.length; const sim = MB.cfg ? MB.cfg.simul : 0;
  const dsel = Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => { const x = i + 1; return `<button type="button" data-a="brday" data-v="${x}" aria-pressed="${x === d}">${x}<small>${VD_DAY[new Date(y, m, x).getDay()]}</small></button>`; }).join('');
  const head = `<div class="br-k"><span class="ico">${ic('sparkle', 22)}</span><div class="tx"><b>Kais mola yönetimi</b><p>${act ? `Günde ${MB.cfg.count} mola, ${MB.cfg.mins} dk, aynı anda en fazla ${MB.cfg.simul} kişi. ` : 'Kaç mola, kaç dakika ve aynı anda kaç kişi diye sorar, vardiyalara göre çakışmayan taslaklar hazırlar. '}<span class="pill ${act ? (MB.pub ? 'p-ok' : 'p-warn') : 'p-mute'}">${act ? (MB.pub ? 'Yayında' : 'Taslak') : 'Plan yok'}</span></p></div><button class="btn" data-a="brwiz">${act ? 'Yeniden planla' : 'Kais yönetsin'}</button></div>`;
  let plan = '';
  if (!act) plan = `<section class="mg-card br-e">${ic('clock', 34)}<b>Henüz mola planı yok</b><p>"Kais yönetsin"e bas. Günde kaç mola ve kaç dakika olacağını söyle. Kais üç taslak hazırlasın, birini seçip üzerinde değişiklik yapabilirsin.</p></section>`;
  else {
    const lo = Math.min(6, ...VD_T.map((t) => Math.floor(brMin(t.s) / 60))), hi = 24; const pc = (x) => (x / 60 - lo) / (hi - lo) * 100;
    const rows = EMP_IDS.map((id) => { const s = vdState(y, m, d, id); let inner = ''; if (s.k === 'shift') { const a = brMin(s.t.s); let e = brMin(s.t.e); if (e <= a) e = 1440; e = Math.min(e, 1440); inner = `<div class="tl-b sh" style="left:${pc(a)}%;width:${pc(e) - pc(a)}%;background:${s.t.c}"></div>` + brSlots(id, y, m, d).map((k) => `<div class="tl-k" style="left:${pc(k.a)}%;width:${Math.max(2.4, k.m / 60 / (hi - lo) * 100)}%" title="${brTxt(k.a)}–${brTxt(k.a + k.m)}"></div>`).join(''); } else inner = `<div class="tl-o">${s.k === 'leave' ? 'İzinli' : s.k === 'off' ? 'Haftalık izin' : s.k === 'hol' ? 'Resmi tatil' : 'Vardiya yok'}</div>`;
      return `<div class="tl-n">${esc(byId(id).name)}</div><div class="tl-t">${inner}</div>`; }).join('');
    const ticks = []; for (let h = lo; h <= hi; h += 3) ticks.push(`<span>${vdP(h % 24)}:00</span>`); const ld = brLoad(y, m, d);
    const body = EMP_IDS.map((id) => { const s = vdState(y, m, d, id); if (s.k !== 'shift') return ''; const sl = brSlots(id, y, m, d); const key = id + '|' + s.t.id; const ed = !!MB.ov[key];
      return `<tr><td><b>${esc(byId(id).name)}</b>${ed ? ' <span class="pill p-info" style="font-size:11px">Düzenlendi</span>' : ''}</td><td>${esc(s.t.n)} ${s.t.s}–${vdEnd(s.t)}</td>${sl.map((k, i) => `<td><input class="br-in" type="time" step="300" value="${brTxt(k.a)}" data-u="${id}" data-k="${i}" data-f="t" aria-label="Mola ${i + 1} başlangıç"> <input class="br-in m" type="number" min="5" max="90" value="${k.m}" data-u="${id}" data-k="${i}" data-f="m" aria-label="Süre"> dk</td>`).join('')}<td>${ed ? `<button class="btn sec sm" data-a="brreset" data-k="${key}">Sıfırla</button>` : ''}</td></tr>`; }).join('');
    plan = `<section class="mg-card"><div class="ek-h"><h2>Mola planı</h2><span>${d} ${VD_MON[m]}</span></div><div class="tl-ds">${dsel}</div><div class="tl-w"><div></div><div class="tl-ax">${ticks.join('')}</div>${rows}</div>
    <div class="br-pk"><div class="ch"><span>Aynı anda en fazla</span><b>${ld.peak.n} kişi molada</b>${ld.peak.n ? `<span>${brTxt(ld.peak.at)} civarı</span>` : ''}</div><div class="ch ${ld.bad ? 'w' : ''}"><span>En az çalışan</span><b>${ld.minStaff} kişi</b><span>${ld.bad ? 'Alt sınırın altında' : 'Kadro yeterli'}</span></div></div>
    <div class="ek-h" style="margin-top:6px"><h2 style="font-size:15px">Saatleri düzenle</h2><span>Değişiklik hemen kaydolur</span></div><div class="vs-sc"><table class="vs-t" style="min-width:700px"><thead><tr><th>Çalışan</th><th>Vardiya</th>${Array.from({ length: MB.cfg.count }, (_, i) => `<th>Mola ${i + 1}</th>`).join('')}<th></th></tr></thead><tbody>${body || '<tr><td colspan="6" class="muted">Bu gün vardiya yok.</td></tr>'}</tbody></table></div>
    <div class="dr-a" style="margin-top:12px">${MB.pub ? '<button class="btn sec" data-a="brpub">Yeniden bildir</button>' : '<button class="btn" data-a="brpub">Onayla ve yayınla</button>'}<button class="btn sec" data-a="brdel">${S.brDel === 1 ? 'Silmek için tekrar dokun' : 'Planı sil'}</button></div></section>`;
  }
  const notiOn = S.settings.brNotify !== false;
  const rules = `<section class="mg-card br-rl"><div class="ek-h"><h2>Kurallar</h2></div><b style="font-size:14px">Planlanan mola süresi</b><div class="mb-o">${[10, 15, 20, 30, 45].map((v) => `<button type="button" data-a="brkp" data-v="${v}" aria-pressed="${c.plan === v}">${v} dk</button>`).join('')}<label class="vd-mn"><input id="br-plan" type="number" inputmode="numeric" min="1" max="120" value="${c.plan}" aria-label="Planlanan mola süresi, dakika">dk</label></div><b style="font-size:14px">Günlük toplam sınır</b><div class="mb-o">${[30, 45, 60, 90, 120].map((v) => `<button type="button" data-a="brkm" data-v="${v}" aria-pressed="${c.max === v}">${v} dk</button>`).join('')}<label class="vd-mn"><input id="br-max" type="number" inputmode="numeric" min="10" max="480" value="${c.max}" aria-label="Günlük toplam mola sınırı, dakika">dk</label></div><div class="toggle"><div><b style="font-weight:600">Mola başlangıç bildirimi</b><div class="small muted">Çalışana "${c.plan} dakika molanız başlamıştır" bildirimi gider.</div></div><button class="sw" role="switch" aria-checked="${notiOn}" aria-label="Mola bildirimi" data-a="brnoti"></button></div><div class="toggle"><div><b style="font-weight:600">Süre dolmadan hatırlat</b><div class="small muted">Bitmeden 2 dk önce ve bitişte.</div></div><button class="sw" role="switch" aria-checked="${S.settings.reminders}" aria-label="Mola hatırlatmaları" data-a="toggle" data-k="reminders"></button></div></section>`;
  const over = EMP_IDS.filter((id) => (ATT[id] && ATT[id].breakMin || 0) > c.max);
  const live = EMP_IDS.map((id) => { const a = ATT[id] || { breakMin: 0 }, mm = a.breakMin || 0, pct = Math.min(100, Math.round(mm / c.max * 100)); return `<div class="dr-r" style="align-items:center"><span style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">${avatar(byId(id), 30)}<span style="color:var(--ink)">${esc(byId(id).name)}<small>${mm} / ${c.max} dk${mm > c.max ? ' · sınır aşıldı' : ''}</small></span></span><div style="width:40%;min-width:90px"><div class="dr-bar" style="margin:0"><i style="width:${pct}%;${mm > c.max ? 'background:#D9534F' : ''}"></i></div></div></div>`; }).join('');
  return `<div class="ek"><div class="ek-main">${head}${plan}</div><div class="ek-side">${rules}<section class="mg-card"><div class="ek-h"><h2>Bugünkü mola durumu</h2><span>${over.length ? over.length + ' kişi sınırı aştı' : 'Sınır aşan yok'}</span></div><div style="max-height:300px;overflow-y:auto">${live}</div></section></div></div>`;
};
/* çalışana plan satırı + mola bildirimi */
{const _ec = vdEmpCard; vdEmpCard = function (uid) { let h = _ec.apply(this, arguments); try { if (MB.cfg && MB.pub && h) { const n = new Date(); const sl = brSlots(uid, n.getFullYear(), n.getMonth(), n.getDate()); if (sl.length) h = h.replace('<div class="ls">', `<p class="small" style="margin:0 0 4px"><b>Mola planın:</b> ${sl.map((k) => brTxt(k.a) + '–' + brTxt(k.a + k.m)).join(', ')}</p><div class="ls">`); } } catch (e) {} return h; }; }
{const _tk = vdTick; vdTick = function () { _tk.apply(this, arguments); try { if (!S.user || !MB.cfg || !MB.pub || S.settings.brNotify === false) return; const n = new Date(), y = n.getFullYear(), m = n.getMonth(), d = n.getDate(), ds = vdYmd(y, m, d), now = n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60; let dirty = false;
  if (['patron', 'mudur'].includes(S.user.role)) { EMP_IDS.forEach((id) => brSlots(id, y, m, d).forEach((k, i) => { const key = ds + '|' + id + '|br' + i; if (now >= k.a && now < k.a + 4 && !VD_SENT[key]) { VD_SENT[key] = 1; dirty = true; pushSend([id], 'Mola zamanı', `${k.m} dakika molanız başlamıştır. Kais iyi dinlenmeler diler.`); } })); if (dirty) vdSave(); }
  else if (S.user.role === 'calisan') { brSlots(S.user.id, y, m, d).forEach((k, i) => { const key = 'br' + ds + i; if (now >= k.a && now < k.a + 4 && !VD_LOC[key]) { VD_LOC[key] = 1; toast(`${k.m} dakika molanız başlamıştır. Kais iyi dinlenmeler diler.`, 'ok'); } }); } } catch (e) {} }; }
/* ===== v79: İzin talepleri, minimal ve akıllı ===== */
function tqHints(r) {
  const h = []; const e = lrEff(r); const p = PROFILES[r.uid];
  if (r.type === 'yillik') {
    const l = izLeft(r.uid);
    if (l) h.push(l.ent === 0 ? ['w', 'Yıllık hak henüz doğmadı'] : e.days > l.left ? ['w', `Hak yetmiyor: ${l.left} gün kaldı`] : ['o', `Kalan hak ${l.left} gün, sonra ${l.left - e.days}`]);
  } else if (p && p.salary) h.push(['i', `Kesinti en fazla ${fmt(Math.round(p.salary / 30 * e.days))}`]);
  const o = izOrd(e.txt);
  if (o) {
    const same = LVREQ.filter((x) => x.id !== r.id && x.uid !== r.uid && x.status !== 'reddedildi').filter((x) => { const q = izOrd(lrEff(x).txt); return q && q[0] <= o[1] && o[0] <= q[1]; });
    if (same.length) h.push(['w', `${same.map((x) => byId(x.uid).name).join(', ')} de aynı günlerde izin istiyor`]);
    else h.push(['o', 'Aynı günlerde başka talep yok']);
  }
  try { const hw = vdHolWarn ? vdHolWarn(e.txt) : ''; if (hw) h.push(['w', 'Resmi tatile denk geliyor']); } catch (x) {}
  try { const cw = vdCoverWarn(r.uid, e.txt); if (cw) h.push(['w', 'Kadro minimumun altına düşer']); else if (o) h.push(['o', 'Vardiya kadrosu yeterli']); } catch (x) {}
  return h;
}
function tqNote(r) {
  const e = lrEff(r); const o = izOrd(e.txt); if (!o) return '';
  const out = []; const y = new Date().getFullYear();
  const ov = (txt) => { const q = izOrd(txt); return q && q[0] <= o[1] && o[0] <= q[1]; };
  LVREQ.filter((x) => x.id !== r.id && x.uid !== r.uid && x.status !== 'reddedildi' && ov(lrEff(x).txt)).forEach((x) => out.push(`${byId(x.uid).name} ${x.status === 'onayli' ? 'izinli' : 'izin istiyor'} (${lrEff(x).txt})`));
  LEAVES.filter((x) => x.uid !== r.uid && ov(x.txt)).forEach((x) => out.push(`${byId(x.uid).name} izinli (${x.txt})`));
  const hs = []; for (let k = o[0]; k <= o[1] && k - o[0] < 60; k++) { const m = Math.floor(k / 40), d = k % 40; if (d < 1 || d > 31 || m > 11) continue; const h = vdHol(y, m, d); if (h) hs.push(`${d} ${VD_MON[m]} ${h.n}${h.half ? ' (yarım gün)' : ''}`); }
  const a = [];
  a.push(out.length ? 'Aynı günlerde: ' + out.join(', ') + '.' : 'Bu günlerde başka izinli ya da izin isteyen yok.');
  if (hs.length) a.push('Resmi tatil: ' + hs.join(', ') + '.');
  return `<div class="tq-n">${ic('sparkle', 16)}<span><b>Kais:</b> ${esc(a.join(' '))}</span></div>`;
}
function tqCard(r) {
  const u = byId(r.uid); const e = lrEff(r); const th = r.thread || []; const last = th[th.length - 1];
  const kind = r.type === 'ucretsiz' ? 'Ücretsiz izin' : r.type === 'mazeret' ? 'Mazeret izni' : 'Yıllık izin';
  const decided = ['onayli', 'reddedildi'].includes(r.status);
  const st = { bekliyor: ['Yeni', 'w'], yanit: ['Çalışan cevapladı', 'w'], karsi: ['Cevap bekleniyor', 'i'], onayli: ['Onaylandı', 'g'], reddedildi: ['Reddedildi', 'm'] }[r.status] || ['', 'm'];
  const open = S.izOpen && S.izOpen[r.id];
  const hints = decided ? '' : `<div class="tq-h">${tqHints(r).map((x) => `<span class="tq-p ${x[0]}"><i></i>${esc(x[1])}</span>`).join('')}</div>`;
  const msg = last && !decided ? `<div class="tq-m"><b>${esc(byId(last.by).name.split(' ')[0])}:</b> ${esc(last.text)}</div>` : '';
  const tg = th.length > 1 && !decided ? `<button class="tq-tg" data-a="izth" data-id="${r.id}">${open ? 'Yazışmayı gizle' : 'Yazışma (' + th.length + ')'}</button>${open ? thread(th) : ''}` : '';
  const ct = r.counter && r.status === 'karsi' ? `<div class="tq-ct">${ic('clock', 16)}<span>Karşı teklif: <b>${esc(r.counter.txt)} · ${r.counter.days} gün</b></span></div>` : '';
  const fin = r.fin ? `<div class="tq-fin">${esc(LV_KIND[r.fin.type])}${r.fin.type === 'ucretsiz' && r.fin.ded ? ' · maaştan ' + fmt(r.fin.ded) + ' kesildi' : ' · maaştan kesinti yok'}</div>` : '';
  const act = ['bekliyor', 'yanit'].includes(r.status) ? `<div class="tq-a"><button class="btn sm" data-a="lrok" data-id="${r.id}">${ic('check', 16)} Onayla</button><button class="btn sm sec" data-a="lrctr" data-id="${r.id}">Karşı teklif</button><button class="btn sm sec tq-no" data-a="lrrej" data-id="${r.id}">Reddet</button></div>` : '';
  return `<article class="tq-c tq-${st[1]}"><div class="tq-t">${avatar(u, 36)}<div class="tq-w"><b>${esc(u.name)}</b><span>${kind}</span></div><span class="tq-s">${st[0]}</span></div>
  <div class="tq-d">${ic('calendar', 18)}<b>${esc(e.txt)}</b><em>${e.days} gün</em></div>${ct}${hints}${decided ? '' : tqNote(r)}${msg}${tg}${fin}${act}</article>`;
}
function tqHTML() {
  const A = (a) => LVREQ.filter((r) => a.includes(r.status)).slice().reverse();
  const bek = A(['bekliyor', 'yanit']).concat(A(['karsi'])); const ver = A(['onayli', 'reddedildi']);
  const t = S.tqt === 'ver' ? 'ver' : 'bek'; const arr = t === 'ver' ? ver : bek;
  const warn = bek.filter((r) => tqHints(r).some((x) => x[0] === 'w')).length;
  const seg = (k, l, n) => `<button data-a="tqt" data-v="${k}" aria-pressed="${t === k}">${l}<em>${n}</em></button>`;
  const kais = t === 'bek' && bek.length ? `<div class="tq-k">${ic('sparkle', 18)}<span>${warn ? `<b>${warn} talepte dikkat edilecek nokta var.</b> Kartlardaki işaretlere bak.` : '<b>Tüm talepler uygun görünüyor.</b> Çakışma ya da kadro sorunu yok.'}</span></div>` : '';
  const emptyTxt = t === 'bek' ? ['check', 'Bekleyen talep yok', 'Yeni izin talepleri burada görünür.'] : ['calendar', 'Henüz karar verilen talep yok', 'Onayladığın ve reddettiğin talepler burada birikir.'];
  return `<div class="stack-lg tq"><div class="tq-sg">${seg('bek', 'Karar bekleyenler', bek.length)}${seg('ver', 'Karar verilenler', ver.length)}</div>${kais}
  ${arr.length ? `<div class="tq-l">${arr.map(tqCard).join('')}</div>` : `<div class="iz-e">${ic(emptyTxt[0], 30)}<b>${emptyTxt[1]}</b><p>${emptyTxt[2]}</p></div>`}</div>`;
}
H.tqt = (el) => { S.tqt = el.dataset.v; render(); };
/* Ayarlar: tüm verileri sıfırla */
const viewAyarlarV66 = viewAyarlar;
viewAyarlar = function () {
  const h = viewAyarlarV66(); if (!S.user || S.user.role !== 'patron') return h;
  const arm = !!S.wipeArm;
  const card = `<section class="rz-card" style="margin-top:14px"><div class="rz-ch"><b>Verileri sıfırla</b></div><p class="small muted" style="margin:0">Stok, fiş, ekip kayıtları, müşteri ve rezervasyon gibi tüm işletme verilerini siler ve temiz başlatır. Geri alınamaz.</p><button type="button" class="btn ${arm ? '' : 'sec'}" style="${arm ? 'background:var(--nar);border-color:var(--nar)' : ''}" data-a="wipeall">${arm ? 'Emin misin? Silmek için tekrar dokun' : 'Tüm verileri sil ve temiz başlat'}</button></section>`;
  return h.replace(/<\/div>\s*$/, card + '</div>');
};
H.wipeall = () => { if (!S.wipeArm) { S.wipeArm = true; render(); setTimeout(() => { S.wipeArm = false; try { render(); } catch (e) {} }, 6000); return; } S.wipeArm = false; wipeData(); try { pSched && pSched(); } catch (e) {} render(); toast('Tüm veriler silindi. Temiz başlangıç.', 'ok'); };
/* ===== v67: İzin talepleri, modern ve akıllı ===== */
const izOrd = (t) => {
  const mi = (s) => (s ? MONTH_ABBR.findIndex((x) => s.toLocaleLowerCase('tr').startsWith(x.toLocaleLowerCase('tr').slice(0, 3))) : -1);
  const W = '([A-Za-zÇĞİÖŞÜçğıöşü]{3,})?';
  let m = String(t || '').match(new RegExp('(\\d{1,2})\\s*' + W + '\\s*[–-]\\s*(\\d{1,2})\\s*' + W));
  if (m) { const m2 = mi(m[4]); const m1 = mi(m[2]) >= 0 ? mi(m[2]) : m2; if (m2 < 0 && m1 < 0) return null; return [(m1 < 0 ? m2 : m1) * 40 + Number(m[1]), (m2 < 0 ? m1 : m2) * 40 + Number(m[3])]; }
  m = String(t || '').match(new RegExp('(\\d{1,2})\\s*([A-Za-zÇĞİÖŞÜçğıöşü]{3,})'));
  if (m && mi(m[2]) >= 0) { const o = mi(m[2]) * 40 + Number(m[1]); return [o, o]; }
  return null;
};
const izLeft = (uid) => { const p = PROFILES[uid]; if (!p || !p.hire) return null; const ent = leaveDays(monthsBetween(p.hire), uid) + yizCarry(uid); const used = LEAVES.filter((x) => x.uid === uid && x.type === 'yillik').reduce((a, x) => a + x.days, 0); return { ent, used, left: Math.max(0, ent - used) }; };
function izHints(r) {
  const h = []; const e = lrEff(r); const p = PROFILES[r.uid];
  if (['onayli', 'reddedildi'].includes(r.status)) return '';
  if (r.type === 'yillik') {
    const l = izLeft(r.uid);
    if (l) h.push(l.ent === 0 ? ['warn', 'Yıllık izin hakkı henüz doğmadı'] : e.days > l.left ? ['warn', `Kalan yıllık izin ${l.left} gün, talep ${e.days} gün`] : ['ok', `Kalan yıllık izin ${l.left} gün, onaylarsan ${l.left - e.days} gün kalır`]);
  } else if (p && p.salary) h.push(['info', `Ücretsiz izin: günlük kesinti en fazla ${fmt(Math.round(p.salary / 30))}, ${e.days} gün için ${fmt(Math.round(p.salary / 30 * e.days))}`]);
  const o = izOrd(e.txt);
  if (o) {
    const same = LVREQ.filter((x) => x.id !== r.id && x.uid !== r.uid && x.status !== 'reddedildi').filter((x) => { const q = izOrd(lrEff(x).txt); return q && q[0] <= o[1] && o[0] <= q[1]; });
    if (same.length) h.push(['warn', `Aynı günlerde ${same.map((x) => byId(x.uid).name).join(', ')} da izin istiyor`]);
    else h.push(['ok', 'Bu tarihlerde başka izin talebi yok']);
  }
  return h.length ? `<ul class="iz-ht">${h.map((x) => `<li class="${x[0]}">${ic(x[0] === 'warn' ? 'alert' : x[0] === 'ok' ? 'check' : 'info', 16)}<span>${esc(x[1])}</span></li>`).join('')}</ul>` : '';
}
function izCard(r) {
  const u = byId(r.uid); const e = lrEff(r); const th = r.thread || []; const last = th[th.length - 1];
  const st = { bekliyor: ['Karar bekliyor', 'w'], yanit: ['Çalışan cevapladı', 'w'], karsi: ['Cevap bekleniyor', 'i'], onayli: ['Onaylandı', 'g'], reddedildi: ['Reddedildi', 'm'] }[r.status] || ['', 'm'];
  const open = S.izOpen && S.izOpen[r.id];
  let act = '';
  if (['bekliyor', 'yanit'].includes(r.status)) act = `<div class="iz-act"><button class="btn sm" data-a="lrok" data-id="${r.id}">${ic('check', 16)} Onayla</button><button class="btn sm sec" data-a="lrctr" data-id="${r.id}">Karşı teklif</button><button class="btn sm sec iz-no" data-a="lrrej" data-id="${r.id}">Reddet</button></div>`;
  const fin = r.fin ? `<div class="iz-fin">${esc(LV_KIND[r.fin.type])}${r.fin.type === 'ucretsiz' ? (r.fin.ded ? ', maaştan ' + fmt(r.fin.ded) + ' kesilecek' : ', maaştan kesinti yok') : ', maaştan kesinti yok'}</div>` : '';
  const msg = last ? `<div class="iz-m"><div class="iz-mh"><b>${esc(byId(last.by).name.split(' ')[0])}</b><span>${esc(last.time)}</span></div><p>${esc(last.text)}</p></div>` : '';
  return `<article class="iz-c iz-${st[1]}">
  <div class="iz-top">${avatar(u, 40)}<div class="iz-who"><b>${esc(u.name)}</b><span>${r.type === 'ucretsiz' ? 'Ücretsiz izin' : r.type === 'mazeret' ? 'Ücretli mazeret izni' + (r.sub ? ' · ' + esc(r.sub) : '') : 'Ücretli yıllık izin'}</span></div><span class="iz-st">${st[0]}</span></div>
  <div class="iz-dt"><div class="iz-rg">${ic('calendar', 20)}<b>${esc(e.txt)}</b></div><span class="iz-dn">${e.days} gün</span></div>
  ${r.counter ? `<div class="iz-ct">${ic('clock', 18)}<div><small>Karşı teklifin</small><b>${esc(r.counter.txt)} · ${r.counter.days} gün</b></div></div>` : ''}
  ${izHints(r)}
  ${msg}
  ${th.length > 1 ? `<button class="iz-tg" data-a="izth" data-id="${r.id}" aria-expanded="${!!open}">${open ? 'Yazışmayı gizle' : 'Yazışmanın tamamı (' + th.length + ')'}</button>${open ? thread(th) : ''}` : ''}
  ${fin}${act}</article>`;
}
talepHTML = function () {
  const A = (a) => LVREQ.filter((r) => a.includes(r.status)).slice().reverse();
  const wait = A(['bekliyor', 'yanit']); const ctr = A(['karsi']); const done = A(['onayli', 'reddedildi']).slice(0, 6);
  const f = S.izf || 'hepsi'; const okN = LVREQ.filter((r) => r.status === 'onayli').length;
  const kpi = (n, l, c, v) => `<button class="iz-k ${c}" data-a="izf" data-v="${v}" aria-pressed="${f === v}"><b>${n}</b><span>${l}</span></button>`;
  const sec = (t, sub, arr, key) => (arr.length && (f === 'hepsi' || f === key) ? `<section class="iz-s"><div class="iz-sh"><div><h3>${t}</h3><p>${sub}</p></div><span class="iz-cnt">${arr.length}</span></div>${arr.map(izCard).join('')}</section>` : '');
  const body = sec('Karar bekleyenler', 'Onayla, karşı teklif ver ya da reddet', wait, 'karar') + sec('Çalışanın cevabı bekleniyor', 'Karşı teklif gönderdiklerin', ctr, 'cevap') + sec('Son kararlar', 'Onaylanan ve reddedilenler', done, 'bitti');
  const empty = !LVREQ.length ? `<div class="iz-e">${ic('calendar', 30)}<b>Henüz izin talebi yok</b><p>Çalışanlar uygulamadan izin isteyince burada görünür. Onayladığın izinler otomatik kaydedilir.</p></div>` : (!body ? `<div class="iz-e">${ic('check', 30)}<b>Bu listede talep yok</b><p>Başka bir sekmeye bak.</p></div>` : '');
  return `<div class="stack-lg iz"><div class="iz-ks">${kpi(wait.length, 'Karar bekliyor', wait.length ? 'w' : '', 'karar')}${kpi(ctr.length, 'Cevap bekleniyor', ctr.length ? 'i' : '', 'cevap')}${kpi(okN, 'Onaylanan', okN ? 'g' : '', 'bitti')}</div>
  ${f !== 'hepsi' ? `<button class="iz-all" data-a="izf" data-v="hepsi">Tümünü göster</button>` : ''}${body}${empty}
  <p class="iz-tip">${ic('info', 16)}<span>Onaylayınca izin kaydedilir. Ücretsiz izinde maaştan kesintiyi sen seçersin.</span></p></div>`;
};
H.izf = (el) => { S.izf = S.izf === el.dataset.v ? 'hepsi' : el.dataset.v; render(); };
H.izth = (el) => { S.izOpen = S.izOpen || {}; S.izOpen[el.dataset.id] = !S.izOpen[el.dataset.id]; render(); };
/* ===== v68: Duyuru ve mesai teklifi, modern ve akıllı ===== */
const DY_TPL = {
  duyuru: [['Stok sayımı var', 'Kapanıştan sonra depo sayımı yapacağız. Raf düzenini bir gün önce tamamlayalım.'], ['Vardiya değişti', 'Bu haftaki vardiya planı değişti. Güncel saatlerine Ekip ekranından bak.'], ['Toplantı', 'Yarın açılıştan önce kısa bir ekip toplantısı yapacağız. Zamanında gelelim.'], ['Kapalıyız', 'Yarın işletme kapalı olacak. Yeni çalışma saatini ayrıca bildireceğim.']],
  mesai: [['Bugün 1 saat uzatıyoruz', 'Akşam rezervasyonu nedeniyle kapanış 1 saat uzayacak.'], ['Hafta sonu çalışma', 'Bu hafta sonu ek çalışma gerekiyor. Uygunsan teklifi kabul et.'], ['Yoğunluk var', 'Yarın yoğun bir gün bekliyoruz. Kapanıştan sonra ek mesai teklif ediyorum.']]
};
const dyAgo = (t) => esc(t);
function dyCard(m, fresh, asEmp) {
  const first = (id) => esc(byId(id).name);
  const mesai = m.type === 'mesai'; const uid = S.user.id;
  const rd = m.reads.filter((id) => m.to.includes(id)); const unread = m.to.filter((id) => !m.reads.includes(id));
  const kabul = m.to.filter((id) => m.res[id] === 'kabul'); const red = m.to.filter((id) => m.res[id] === 'red'); const bek = m.to.filter((id) => !m.res[id]);
  const n = m.to.length || 1;
  let foot = '';
  if (asEmp && mesai) {
    const r = m.res[uid];
    foot = r ? `<div class="dy-me ${r}">${ic(r === 'kabul' ? 'check' : 'x', 18)}<span>${r === 'kabul' ? 'Teklifi kabul ettin' : 'Teklifi reddettin'}</span></div>${r === 'red' && m.why && m.why[uid] ? `<p class="dy-why">Mazeretin: ${esc(m.why[uid].text)}</p>` : ''}`
      : `<div class="dy-act"><button class="btn sm" data-a="respond" data-id="${m.id}" data-v="kabul">${ic('check', 16)} Kabul ediyorum</button><button class="btn sm sec" data-a="respond" data-id="${m.id}" data-v="red">Reddet</button></div><p class="dy-note">Cevabın işverenle paylaşılır ve kayda geçer.</p>`;
  } else if (!asEmp) {
    foot = `<div class="dy-rd"><div class="dy-rt"><span>${ic('check', 15)} Okundu ${rd.length}/${m.to.length}</span>${unread.length ? `<em>Okumayan: ${unread.map(first).join(', ')}</em>` : '<em class="ok">Herkes okudu</em>'}</div><div class="dy-bar"><i style="width:${Math.round(rd.length / n * 100)}%"></i></div></div>`;
    if (mesai) foot += `<div class="dy-rs"><div class="dy-bar3"><i class="g" style="width:${kabul.length / n * 100}%"></i><i class="a" style="width:${bek.length / n * 100}%"></i><i class="m" style="width:${red.length / n * 100}%"></i></div><div class="dy-chips"><span class="g">Kabul ${kabul.length}</span><span class="a">Bekliyor ${bek.length}</span><span class="m">Red ${red.length}</span></div></div>`
      + red.map((id) => (m.why && m.why[id] ? `<div class="dy-red">${ic('chat', 18)}<div><b>${first(id)} reddetti</b><p>${esc(m.why[id].text)}</p></div></div>` : '')).join('');
  }
  return `<article class="dy-c ${mesai ? 'ms' : 'dn'}"><div class="dy-h"><span class="dy-ic">${ic(mesai ? 'clock' : 'megaphone', 20)}</span><div class="dy-t"><b>${esc(m.title)}</b><span>${mesai ? 'Mesai teklifi' : 'Duyuru'} · ${esc(m.time)}</span></div>${fresh ? '<span class="dy-new">Yeni</span>' : ''}</div>
  <p class="dy-b">${esc(m.body)}</p>
  ${mesai ? `<div class="dy-pay"><div><small>Ek çalışma</small><b>${esc(m.hours)} saat</b></div><div><small>Ek ücret</small><b>${fmt(Number(m.pay))}</b></div></div>` : ''}
  ${foot}${!asEmp ? `<div class="dy-to">${ic('users', 15)} ${m.to.length === EMP_IDS.length ? 'Herkese gitti' : m.to.map(first).join(', ')}</div>` : ''}</article>`;
}
viewDuyuru = function () {
  const u = S.user;
  if (u.role === 'calisan') {
    const mine = MSGS.filter((m) => m.to.includes(u.id)).slice().reverse();
    const fresh = mine.filter((m) => !m.reads.includes(u.id)).map((m) => m.id);
    mine.forEach((m) => { if (!m.reads.includes(u.id)) m.reads.push(u.id); });
    const open = mine.filter((m) => m.type === 'mesai' && !m.res[u.id]).length;
    return `<div class="stack-lg dy"><div class="dy-hd"><h2>Duyurular</h2><p>İşvereninden gelen mesajlar ve teklifler.</p></div>
    ${open ? `<div class="dy-alert">${ic('clock', 20)}<div><b>${open} mesai teklifi cevap bekliyor</b><span>Kabul ya da reddet, cevabın kayda geçer.</span></div></div>` : ''}
    ${mine.length ? mine.map((m) => dyCard(m, fresh.includes(m.id), true)).join('') : `<div class="dy-e">${ic('megaphone', 30)}<b>Henüz duyuru yok</b><p>İşvereninin gönderdiği mesajlar burada görünür.</p></div>`}</div>`;
  }
  const d = S.draft; const mesai = d.type === 'mesai'; const f = S.dyf || 'hepsi';
  const nTo = d.aud === 'all' ? EMP_IDS.length : d.sel.length;
  const tp = DY_TPL[d.type] || [];
  const list = MSGS.slice().reverse().filter((m) => f === 'hepsi' || m.type === f);
  const waiting = MSGS.reduce((a, m) => a + (m.type === 'mesai' ? m.to.filter((id) => !m.res[id]).length : 0), 0);
  const tile = (v, ico, t, s) => `<button class="dy-tl" data-a="sub" data-g="msgtype" data-v="${v}" aria-pressed="${d.type === v}">${ic(ico, 22)}<b>${t}</b><span>${s}</span></button>`;
  return `<div class="stack-lg dy"><div class="dy-hd"><h2>Duyurular</h2><p>Ekibine mesaj ya da mesai teklifi gönder.</p></div>
  <section class="dy-cm"><div class="dy-tls">${tile('duyuru', 'megaphone', 'Duyuru', 'Bilgi ver')}${tile('mesai', 'clock', 'Mesai teklifi', 'Kabul ya da red al')}</div>
    <div class="field"><span class="lbl">Kime</span><div class="chips"><button class="chip" data-a="aud" data-v="all" aria-pressed="${d.aud === 'all'}">Herkes (${EMP_IDS.length})</button><button class="chip" data-a="aud" data-v="sel" aria-pressed="${d.aud === 'sel'}">Seçtiklerim</button></div></div>
    ${d.aud === 'sel' ? `<div class="dy-pk">${EMP_IDS.map((id) => `<label class="${d.sel.includes(id) ? 'on' : ''}"><input type="checkbox" name="rcp" value="${id}" ${d.sel.includes(id) ? 'checked' : ''} data-a="dypick">${avatar(byId(id), 28)}<span>${esc(byId(id).name)}</span></label>`).join('')}</div>` : ''}
    <div class="field"><span class="lbl">Hazır şablon</span><div class="dy-tp">${tp.map((t, i) => `<button data-a="dytpl" data-i="${i}">${esc(t[0])}</button>`).join('')}</div></div>
    <div class="field"><label for="d-title">Başlık</label><input id="d-title" type="text" value="${esc(d.title)}" placeholder="${mesai ? 'Bugün 1 saat uzatıyoruz' : 'Cuma günü stok sayımı var'}"></div>
    ${mesai ? `<div class="field"><span class="lbl">Ek süre</span><div class="dy-hr">${['1', '2', '3', '4'].map((h) => `<button data-a="dyh" data-v="${h}" aria-pressed="${String(d.hours) === h}">${h} saat</button>`).join('')}</div></div>
    <div class="row wrap"><div class="field grow"><label for="d-hours">Başka süre (saat)</label><input id="d-hours" type="number" min="0.5" step="0.5" value="${esc(d.hours)}"></div><div class="field grow"><label for="d-pay">Kişi başı ek ücret (₺)</label><input id="d-pay" type="number" min="0" step="50" inputmode="decimal" value="${esc(d.pay)}"></div></div>
    <div class="dy-sum">${ic('wallet', 18)}<span>${nTo} kişi × ${fmt(Number(d.pay) || 0)} = <b>${fmt((Number(d.pay) || 0) * nTo)}</b> toplam ek maliyet</span></div>
    <div class="dy-wn">${ic('alert', 18)}<span>Çalışan teklifi kabul ya da reddeder, cevabı kayda geçer. Fazla mesainin yasal koşulları ve zam oranı muhasebeci ya da iş hukukçusuyla doğrulanmalı.</span></div>` : ''}
    <div class="field"><label for="d-body">Mesaj</label><textarea id="d-body" placeholder="Çalışanların okuyacağı metin">${esc(d.body)}</textarea></div>
    <button class="btn block dy-go" data-a="sendmsg">${ic('send')} ${mesai ? 'Teklifi gönder' : 'Duyuruyu gönder'}${nTo ? ' · ' + nTo + ' kişi' : ''}</button></section>
  <section class="dy-ls"><div class="dy-lh"><div><h3>Gönderilenler</h3><p>${MSGS.length ? MSGS.length + ' mesaj' + (waiting ? ', ' + waiting + ' cevap bekliyor' : '') : 'Henüz bir şey göndermedin'}</p></div></div>
    ${MSGS.length ? `<div class="chips">${[['hepsi', 'Tümü'], ['duyuru', 'Duyuru'], ['mesai', 'Mesai teklifi']].map((x) => `<button class="chip" data-a="dyf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join('')}</div>` : ''}
    ${list.length ? list.map((m) => dyCard(m, false, false)).join('') : `<div class="dy-e">${ic('megaphone', 30)}<b>${MSGS.length ? 'Bu türde mesaj yok' : 'İlk mesajını gönder'}</b><p>${MSGS.length ? 'Başka bir filtre seç.' : 'Gönderdiğin duyuru ve teklifler, kimin okuduğuyla birlikte burada görünür.'}</p></div>`}</section></div>`;
};
H.dyf = (el) => { S.dyf = el.dataset.v; render(); };
H.dyh = (el) => { snap(); S.draft.hours = el.dataset.v; render(); };
H.dytpl = (el) => { snap(); const t = (DY_TPL[S.draft.type] || [])[Number(el.dataset.i)]; if (t) { S.draft.title = t[0]; S.draft.body = t[1]; } render(); };
H.dypick = () => { snap(); render(); };
