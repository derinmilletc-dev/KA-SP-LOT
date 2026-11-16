/* ===== v148: akşam özeti anahtarı, şube yetkisi, tahsilat merkezi, hoş geldin turu, yedek doğrulama ===== */
const sha256hex = async (str) => { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return ''; } };
const k8Sw = (on, act, extra) => `<button class="sw" role="switch" aria-checked="${on}" data-a="${act}"${extra || ''}></button>`;

/* --- 1) Akşam özeti (Kais yorumlu bildirim) --- */
H.kaiseve = () => { if (!S.user || S.user.role !== 'patron') return; S.settings.kaisEve = S.settings.kaisEve === false; try { pSched(); } catch (e) {} render(); toast(S.settings.kaisEve === false ? 'Akşam özeti kapandı.' : 'Akşam özeti açıldı.', 'ok'); };
function k8EveCard() {
  if (!S.user || S.user.role !== 'patron') return '';
  const on = S.settings.kaisEve !== false;
  return `<div class="card stack" style="margin-bottom:12px"><div class="toggle"><div><b style="font-weight:600">Akşam özeti</b><div class="small muted">Her akşam 21:00 sularında bugünün cirosu, gideri ve Kais'in kısa yorumu telefonuna gelir. Yalnızca o gün kayıt varsa gönderilir.</div></div>${k8Sw(on, 'kaiseve')}</div></div>`;
}

/* --- 2) Şube bazlı yetki (muhasebeci kendi şubelerini görür) --- */
function brRule() {
  const u = S.user; if (!u || u.role !== 'muhasebeci' || (!BRANCHES.length && !(CL.ruleKnown && CL.rule))) return null;
  const m = CL.ruleKnown ? CL.rule : (S.settings.brs || {})[u.id]; if (!m || (!(m.b || []).length && !m.none)) return null;
  const set = new Set((m.b || []).filter((id) => BRANCHES.some((b) => b.id === id)));
  if (!set.size && !m.none) return null;
  return { set, none: !!m.none, ok: (br) => (br ? set.has(br) : !!m.none) };
}
function brScope(fn) {
  const rule = brRule(); if (!rule) return fn();
  const LD = LEDGER, BR = BRANCHES, IV = INV, RC = RECEIPTS; const L0 = LD.slice(), B0 = BR.slice(), I0 = IV.slice(), R0 = RC.slice();
  const hiddenRc = new Set(L0.filter((r) => r.rc && !rule.ok(rxBr(r))).map((r) => r.rc));
  const L1 = L0.filter((r) => rule.ok(rxBr(r))), B1 = B0.filter((b) => rule.set.has(b.id)), I1 = I0.filter((v) => rule.ok(v.br && BR.some((b) => b.id === v.br) ? v.br : '')), R1 = R0.filter((f) => !hiddenRc.has(f.id));
  LD.splice(0, LD.length, ...L1); BR.splice(0, BR.length, ...B1); IV.splice(0, IV.length, ...I1); RC.splice(0, RC.length, ...R1);
  const back = (arr, shown, full, keep) => { const cur = arr.slice(); if (cur.length === shown.length && cur.every((x, i) => x === shown[i])) arr.splice(0, arr.length, ...full); else arr.splice(0, arr.length, ...cur.concat(full.filter((x) => !keep(x)))); };
  try { return fn(); } finally {
    back(LD, L1, L0, (r) => rule.ok(rxBr(r))); back(BR, B1, B0, (b) => rule.set.has(b.id)); back(IV, I1, I0, (v) => I1.indexOf(v) >= 0); back(RC, R1, R0, (f) => !hiddenRc.has(f.id));
  }
}
{ const _v = viewHTML; viewHTML = function () { const a = arguments, t = this; return brScope(() => _v.apply(t, a)); }; }
{ const _m = renderModal; renderModal = function () { const a = arguments, t = this; return brScope(() => _m.apply(t, a)); }; }
['xlsx', 'rxcsv', 'rxpdf', 'kdvcsv', 'tkwa', 'tkcopy', 'tkpaid', 'tktone'].forEach((n) => { const f = H[n]; if (typeof f !== 'function') return; H[n] = function () { const a = arguments, t = this; return brScope(() => f.apply(t, a)); }; });
['bkdl', 'bkexp', 'aisend'].forEach((n) => { const f = H[n]; if (typeof f !== 'function') return; H[n] = function () { if (brRule()) return toast('Bu işlem şube kısıtlı hesapta kapalı.', 'warn'); return f.apply(this, arguments); }; });
H.brperm = (el) => {
  if (!S.user || S.user.role !== 'patron') return; const m = S.settings.brs || (S.settings.brs = {}); const u = el.dataset.u; const e = m[u] || (m[u] = { b: [], none: false });
  if (el.dataset.b === '_none') e.none = !e.none; else { const i = e.b.indexOf(el.dataset.b); if (i >= 0) e.b.splice(i, 1); else e.b.push(el.dataset.b); }
  if (!e.b.length && !e.none) delete m[u]; try { pSched(); } catch (x) {} try { auditAdd({ type: 'yetki', text: 'Şube yetkisi güncellendi' }); } catch (x) {} brEnsure(); render();
};
/* Aynı anda başka cihaz kaydederse değişiklik kaybolabilir; yetki listesini kaydedilene kadar yeniden uygula */
let BRX = { want: '', n: 0, t: null };
function brEnsure() {
  BRX.want = JSON.stringify(S.settings.brs || {}); BRX.n = 0; clearTimeout(BRX.t);
  const step = () => { if (!S.user || S.user.role !== 'patron') return; if (JSON.stringify(S.settings.brs || {}) !== BRX.want) { S.settings.brs = JSON.parse(BRX.want); try { pSched(); } catch (x) {} render(); } if (++BRX.n < 4) BRX.t = setTimeout(step, 4000); };
  BRX.t = setTimeout(step, 4000);
}
function k8BrCard() {
  if (!S.user || S.user.role !== 'patron' || !BRANCHES.length) return '';
  const acc = USERS.filter((u) => u.role === 'muhasebeci'); if (!acc.length) return '';
  const m = S.settings.brs || {};
  return `<div class="card stack"><div><h3>Şube yetkisi</h3><p class="muted small" style="margin-top:2px">Muhasebeciler hangi şubelerin kayıtlarını görsün? Hiçbiri seçili değilse tüm şubeleri görür. Seçince diğer şubelerin satır, fatura ve belgeleri onun ekranında gizlenir.</p></div>
  ${acc.map((u) => { const e = m[u.id] || { b: [], none: false }; const all = !e.b.length && !e.none; return `<div class="stack" style="gap:8px"><div class="row between"><b style="font-weight:600">${esc(u.name)}</b><span class="pill ${all ? 'p-info' : 'p-warn'}">${all ? 'Tüm şubeler' : (e.b.length + (e.none ? 1 : 0)) + ' alan'}</span></div><div class="cb-chips" style="margin:0">${BRANCHES.map((b) => `<button type="button" class="${e.b.indexOf(b.id) >= 0 ? 'on' : ''}" data-a="brperm" data-u="${esc(u.id)}" data-b="${esc(b.id)}">${esc(b.name)}</button>`).join('')}<button type="button" class="${e.none ? 'on' : ''}" data-a="brperm" data-u="${esc(u.id)}" data-b="_none">Şubesiz kayıtlar</button></div></div>`; }).join('')}
  <p class="muted small" style="margin:0">Kısıt sunucuda uygulanır: kısıtlı muhasebeci diğer şubelerin verisini hiç almaz. Borç, taslak, not gibi şubesiz kayıtlar da ona gösterilmez. Kısıtlı hesapta Kais AI ve tüm veri yedeği kapalıdır.</p></div>`;
}
{ const _v = viewRaporX; viewRaporX = function () { const h = _v.apply(this, arguments); const c = k8BrCard(); if (!c) return h; const i = h.lastIndexOf('</div>'); return i > 0 ? h.slice(0, i) + c + h.slice(i) : h + c; }; }
{ const _v = viewAyarlar; viewAyarlar = function () { const h = _v.apply(this, arguments); const c = k8EveCard() + k8TourCard(); return c ? c + h : h; }; }

/* Uzak veri uygulanınca PS.last yerel durumu "kaydedildi" sayıyordu; gönderilmemiş yerel değişiklik
   (ör. şube yetkisi) buluta hiç yazılmıyordu. Bulutta kapsam bazında gönderilen ile yerel farklıysa yeniden yaz. */
function clDirty() {
  try {
    if (!CL.on || !SBS.biz) return false; const sp = splitSnap(pSnap());
    return Object.keys(sp).some((sc) => canW(sc) && CL.sent[sc] !== undefined && CL.sent[sc] !== JSON.stringify(sp[sc]));
  } catch (e) { return false; }
}
pFlush = async function () {
  if (PS.busy) { pSched(); return; }
  const s = pSnap(); if (s === PS.last && !clDirty()) return;
  PS.busy = true; PS.state = 'saving'; paintStatus();
  try { await PS.db.doc('kais/state').set({ s, at: Date.now() }); PS.last = s; PS.state = 'saved'; }
  catch (e) { PS.state = e && e.code === 'invalid_argument' ? 'readonly' : 'error'; if (PS.state === 'readonly') PS.canWrite = false; }
  PS.busy = false; paintStatus();
  if (PS.state === 'saved' && (pSnap() !== PS.last || clDirty())) pSched();
};

/* =====================================================================
   v149 Akıllı muhasebe: nakit akışı tahmini, yaşlandırma, banka ekstresi eşleştirme,
   tekrarlayan kayıtlar, ay sonu kontrol listesi ve mükellef takvimi.
   ===================================================================== */
const MX = { txt: '', flip: false, res: null, sel: {}, fn: '', start: '' };
const mxDiff = (a, b) => Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 864e5);
const mxDM = (iso) => parseInt(iso.slice(8), 10) + ' ' + MON[parseInt(iso.slice(5, 7), 10) - 1];
const mxN = (v) => Number(v) || 0;
const mxRestricted = () => { try { return !!brRule(); } catch (e) { return false; } };
const mxCan = () => !!S.user && ['patron', 'muhasebeci'].includes(S.user.role) && typeof fiOk === 'function' && fiOk();
function mxRecs() { if (!S.settings) S.settings = {}; if (!Array.isArray(S.settings.rec)) S.settings.rec = []; return S.settings.rec; }

/* --- tekrarlayan kayıtlar: ayın günü gelince bir kez, sabit kimlikle (iki cihazda çift olmaz) --- */
function mxRecRun() {
  try {
    if (!mxCan() || mxRestricted() || !S.settings || !Array.isArray(S.settings.rec) || !S.settings.rec.length) return;
    const today = fiIso(); const mk = today.slice(0, 7); const dd = parseInt(today.slice(8), 10); let n = 0;
    S.settings.rec.forEach((r) => {
      if (r.off || !mxN(r.total) || dd < Math.min(r.day || 1, new Date(+mk.slice(0, 4), +mk.slice(5, 7), 0).getDate()) || (r.from && mk < r.from)) return;
      const id = 'gr_' + r.id + '_' + mk; if (LEDGER.some((x) => x.id === id)) return;
      const day = String(Math.min(r.day || 1, dd)).padStart(2, '0'); const iso = mk + '-' + day;
      LEDGER.push({ id, date: mxDM(iso), iso, desc: r.desc, acc: r.acc || 'Diğer', doc: r.dir === 'gelir' ? 'Fatura' : '—', rate: mxN(r.rate), total: mxN(r.total), dir: r.dir === 'gelir' ? 'gelir' : 'gider', src: 'Tekrarlayan', rk: r.id + '|' + mk });
      n++;
    });
    if (n) { try { pSched(); } catch (e) {} toast(n + ' tekrarlayan kayıt eklendi.', 'ok'); }
  } catch (e) {}
}
{ const _r = render; render = function () { const x = _r.apply(this, arguments); try { if (!S.modal && !PS.busy && !(typeof DEMO !== 'undefined' && DEMO) && !mxRecRun.busy) { mxRecRun.busy = true; const n = LEDGER.length; mxRecRun(); mxRecRun.busy = false; if (LEDGER.length !== n) setTimeout(() => render(), 30); } } catch (e) { mxRecRun.busy = false; } return x; }; }

/* --- nakit akışı --- */
function mxForecast(days) {
  const today = fiIso(); const end = addDays(today, days); const ev = [];
  INV.filter((v) => v.st !== 'odendi' && v.due).forEach((v) => {
    const late = mxDiff(today, v.due); let d = v.due, p = 1, tag = 'fatura';
    if (late > 0) { d = addDays(today, late > 30 ? 14 : 7); p = late > 30 ? 0.5 : 1; tag = 'gecikmiş fatura'; }
    ev.push({ d, amt: ivOpen(v) * p, who: v.cust, tag, full: ivOpen(v) });
  });
  allDebts().filter((x) => !x.paid && x.due).forEach((x) => { const d = x.due < today ? addDays(today, 1) : x.due; ev.push({ d, amt: -mxN(x.amt), who: x.who, tag: 'borç', full: mxN(x.amt) }); });
  mxRecs().filter((r) => !r.off && mxN(r.total)).forEach((r) => {
    for (let k = 0; k < 4; k++) { const mk = addDays(today.slice(0, 7) + '-01', 31 * k).slice(0, 7); const day = String(Math.min(r.day || 1, 28)).padStart(2, '0'); const d = mk + '-' + day; if (d <= today || d > end) continue; if (r.from && mk < r.from) continue; ev.push({ d, amt: (r.dir === 'gelir' ? 1 : -1) * mxN(r.total), who: r.desc, tag: 'tekrarlayan', full: mxN(r.total) }); }
  });
  const f = ev.filter((e) => e.d <= end).sort((a, b) => (a.d < b.d ? -1 : 1)); const start = mxN(S.settings && S.settings.cashStart);
  let cum = start, min = start, minD = today; const pts = [{ d: today, v: start }]; const by = {}; f.forEach((e) => { by[e.d] = (by[e.d] || 0) + e.amt; });
  for (let i = 1; i <= days; i++) { const d = addDays(today, i); cum += by[d] || 0; pts.push({ d, v: cum }); if (cum < min) { min = cum; minD = d; } }
  const at = (n) => (pts[Math.min(n, days)] || pts[pts.length - 1]).v - start;
  const inn = f.filter((e) => e.amt > 0).reduce((t, e) => t + e.amt, 0); const out = f.filter((e) => e.amt < 0).reduce((t, e) => t - e.amt, 0);
  const l90 = addDays(today, -90); const rows = LEDGER.filter((r) => r.iso && r.iso >= l90 && r.iso <= today); const avg = rows.reduce((t, r) => t + (dirOf(r) === 'gelir' ? 1 : -1) * mxN(r.total), 0) / 90;
  return { pts, ev: f, start, min, minD, d30: at(30), d60: at(60), d90: at(90), inn, out, avg, today, neg: start !== 0 || true ? min < 0 : false };
}
function mxChart(F) {
  const W = 320, H = 130, pl = 6, pr = 6, pt = 10, pb = 18; const vs = F.pts.map((p) => p.v); let lo = Math.min.apply(null, vs.concat([0])), hi = Math.max.apply(null, vs.concat([0])); if (hi === lo) { hi += 1; lo -= 1; }
  const x = (i) => pl + (W - pl - pr) * i / (F.pts.length - 1); const y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  const d = F.pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(''); const z = y(0);
  const ar = d + 'L' + x(F.pts.length - 1).toFixed(1) + ' ' + z.toFixed(1) + 'L' + x(0).toFixed(1) + ' ' + z.toFixed(1) + 'Z';
  const mi = F.pts.findIndex((p) => p.d === F.minD); const neg = F.min < 0;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Önümüzdeki günlerde tahmini nakit"><path d="${ar}" fill="${neg ? '#E5484D' : '#2D6BC4'}" opacity=".12"/><line x1="${pl}" x2="${W - pr}" y1="${z.toFixed(1)}" y2="${z.toFixed(1)}" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 3"/><path d="${d}" fill="none" stroke="${neg ? '#E5484D' : '#2D6BC4'}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${neg ? `<circle cx="${x(mi).toFixed(1)}" cy="${y(F.min).toFixed(1)}" r="4" fill="#E5484D" stroke="#fff" stroke-width="2"/>` : ''}<text x="${pl}" y="${H - 4}" font-size="10" fill="currentColor" opacity=".6">Bugün</text><text x="${W - pr}" y="${H - 4}" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">${F.pts.length - 1} gün</text></svg>`;
}
const mxSign = (n) => (n >= 0 ? '+' : '−') + fmt0(Math.abs(n));
NEWM.mxnakit = () => {
  const F = mxForecast(90); const cs = S.settings && S.settings.cashStart; const neg = F.min < 0;
  const next = F.ev.slice(0, 6).map((e) => `<div class="row between" style="padding:7px 0;border-top:1px solid var(--line,#e5e8ee);gap:8px"><div style="min-width:0"><b style="font-weight:600">${esc(e.who || '—')}</b><div class="small muted">${mxDM(e.d)} · ${esc(e.tag)}${e.amt !== 0 && Math.abs(e.amt) < e.full ? ' · %' + Math.round(Math.abs(e.amt) / e.full * 100) + ' ihtimal' : ''}</div></div><b class="num" style="color:${e.amt >= 0 ? '#15803d' : '#b42318'}">${mxSign(e.amt)}</b></div>`).join('');
  return sheet('Nakit akışı', `<div class="kpis"><div class="kpi"><div class="l">30 gün</div><div class="v num">${mxSign(F.d30)}</div></div><div class="kpi"><div class="l">60 gün</div><div class="v num">${mxSign(F.d60)}</div></div><div class="kpi"><div class="l">90 gün</div><div class="v num">${mxSign(F.d90)}</div></div></div>
  <div class="callout ${neg ? 'warn' : ''}" style="margin-top:10px">${ic(neg ? 'alert' : 'sparkle')}<div><b>Kais yorumu</b><p style="margin-top:2px">${neg ? `Kasa ${mxDM(F.minD)} civarı ${fmt0(F.min)} seviyesine inebilir. Önce o güne kadar tahsil edilecek faturaları hızlandır, ertelenebilir ödemeleri kaydır.` : cs ? 'Bilinen giriş ve çıkışlarla önümüzdeki 90 günde kasa eksiye düşmüyor.' : 'Bilinen giriş ve çıkışlara göre 90 gün boyunca net akış pozitif görünüyor. Kasa bakiyeni girersen eksiye düşme tarihini de söyleyebilirim.'}</p></div></div>
  <div class="card" style="margin-top:10px;padding:12px">${mxChart(F)}<div class="small muted" style="margin-top:4px">Bilinen faturalar, borçlar ve tekrarlayan kayıtlarla ${cs ? 'kasa bakiyesinden başlayarak ' : ''}birikimli net.</div></div>
  <div class="field" style="margin-top:10px"><label for="mx-cash">Bugünkü kasa/banka bakiyesi (isteğe bağlı)</label><input id="mx-cash" type="text" inputmode="decimal" value="${cs ? esc(String(cs).replace('.', ',')) : ''}" placeholder="Örn. 85000" style="width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit"></div>
  <div class="row wrap" style="margin-top:8px"><span class="pill p-ok">Giriş ${fmt0(F.inn)}</span><span class="pill p-bad">Çıkış ${fmt0(F.out)}</span><span class="pill p-info">Son 90 gün ort. ${mxSign(F.avg)}/gün</span></div>
  <h3 style="margin-top:14px">Sıradaki hareketler</h3>${next || '<p class="muted small">Planlı giriş ya da çıkış yok. Fatura, borç ya da tekrarlayan kayıt ekleyince burada görünür.</p>'}`);
};
H.mxnakit = () => { S.modal = { type: 'mxnakit' }; renderModal(); };
document.addEventListener('change', (e) => { const t = e.target; if (!t || t.id !== 'mx-cash') return; const v = parseFloat(String(t.value).replace(/\./g, '').replace(',', '.')); if (!S.settings) S.settings = {}; if (isFinite(v)) S.settings.cashStart = v; else delete S.settings.cashStart; try { pSched(); } catch (x) {} renderModal(); });

/* --- yaşlandırma --- */
const MX_B = [['Vadesi gelmedi', -1e9, 0], ['1-30 gün', 1, 30], ['31-60 gün', 31, 60], ['61-90 gün', 61, 90], ['90+ gün', 91, 1e9]];
function mxAge(items) {
  const today = fiIso(); const b = MX_B.map((x) => ({ n: x[0], lo: x[1], hi: x[2], t: 0, c: 0, who: {} }));
  items.forEach((it) => { const d = it.due ? mxDiff(today, it.due) : 0; const k = b.find((x) => (x.lo === -1e9 ? d <= 0 : d >= x.lo && d <= x.hi)); if (!k) return; k.t += it.amt; k.c++; k.who[it.who] = (k.who[it.who] || 0) + it.amt; });
  return b;
}
function mxAgeBlock(title, rows, tone) {
  const tot = rows.reduce((t, r) => t + r.t, 0); const mx = Math.max.apply(null, rows.map((r) => r.t).concat([1]));
  const cols = ['#2D6BC4', '#E0A526', '#E58A2B', '#D9534F', '#B42318'];
  return `<div class="card stack" style="margin-top:10px"><div class="row between"><h3>${title}</h3><b class="num">${fmt0(tot)}</b></div>${rows.map((r, i) => { const top = Object.keys(r.who).sort((a, b) => r.who[b] - r.who[a]).slice(0, 2).join(', '); return `<div><div class="row between small"><span>${r.n} <span class="muted">· ${r.c}</span></span><b class="num">${fmt0(r.t)}</b></div><div style="height:8px;border-radius:5px;background:var(--bg2,#eef1f5);margin-top:3px;overflow:hidden"><div style="height:100%;width:${(r.t / mx * 100).toFixed(1)}%;background:${cols[i]};border-radius:5px"></div></div>${top && i > 1 ? `<div class="small muted" style="margin-top:2px">${esc(top)}</div>` : ''}</div>`; }).join('')}</div>`;
}
NEWM.mxyas = () => {
  const al = mxAge(INV.filter((v) => v.st !== 'odendi').map((v) => ({ amt: ivOpen(v), due: v.due, who: v.cust || '—' }))); const bo = mxAge(allDebts().filter((d) => !d.paid).map((d) => ({ amt: mxN(d.amt), due: d.due, who: d.who })));
  const over = al.slice(1).reduce((t, r) => t + r.t, 0); const old = al[3].t + al[4].t;
  return sheet('Alacak ve borç yaşlandırma', `<div class="callout ${old > 0 ? 'warn' : ''}">${ic(old > 0 ? 'alert' : 'check')}<div><b>Kais yorumu</b><p style="margin-top:2px">${over ? `Vadesi geçen alacağın ${fmt0(over)}.${old > 0 ? ` Bunun ${fmt0(old)} kadarı 60 günü aşmış, tahsili zorlaşıyor. Önce onlara dön.` : ' Hepsi 60 günün altında, hatırlatmayla toparlanır.'}` : 'Vadesi geçmiş alacak yok.'}</p></div></div>${mxAgeBlock('Alacaklar', al)}${mxAgeBlock('Borçlar', bo)}${over ? '<button class="btn block" style="margin-top:12px" data-a="tahsilat">Hatırlatma mesajlarına geç</button>' : ''}`);
};
H.mxyas = () => { S.modal = { type: 'mxyas' }; renderModal(); };

/* --- mükellef takvimi + ay sonu kontrol --- */
function mxDeadline(y, m, day) { let d = new Date(Date.UTC(y, m, day)); while ([0, 6].includes(d.getUTCDay())) d = new Date(d.getTime() + 864e5); return d.toISOString().slice(0, 10); }
function mxCal() {
  const t = fiIso(); const y = +t.slice(0, 4), m = +t.slice(5, 7) - 1; const out = [];
  for (let k = 0; k < 3; k++) { const yy = y + Math.floor((m + k) / 12), mm = (m + k) % 12; const prev = MONTH_LONG ? MONTH_LONG[(mm + 11) % 12] : ''; out.push({ d: mxDeadline(yy, mm, 26), n: 'Muhtasar ve SGK bildirimi', p: prev }, { d: mxDeadline(yy, mm, 28), n: 'KDV beyannamesi', p: prev }); }
  return out.filter((x) => x.d >= t).sort((a, b) => (a.d < b.d ? -1 : 1)).slice(0, 4).map((x) => Object.assign(x, { left: mxDiff(x.d, t) }));
}
function mxClose() {
  const mk = fiIso().slice(0, 7); const it = [];
  const pend = RECEIPTS.filter((f) => f.status === 'musavirde').length; it.push({ ok: !pend, t: pend ? pend + ' belge onay bekliyor' : 'Bekleyen belge yok', h: pend ? 'Belgeler sekmesinden onayla ya da reddet.' : '' });
  const late = INV.filter((v) => fiLate(v)); it.push({ ok: !late.length, t: late.length ? late.length + ' fatura vadesi geçmiş' : 'Vadesi geçmiş fatura yok', h: late.length ? fmt0(late.reduce((a, v) => a + mxN(v.tot), 0)) + ' tahsilat bekliyor.' : '', a: late.length ? 'tahsilat' : '' });
  const mrows = LEDGER.filter((r) => r.iso && r.iso.slice(0, 7) === mk); const nodoc = mrows.filter((r) => !r.doc || r.doc === '—').length; it.push({ ok: !nodoc, t: nodoc ? nodoc + ' kayıtta belge türü yok' : 'Tüm kayıtların belgesi tamam', h: nodoc ? 'Belgesiz giderler indirilecek KDV olarak sayılmayabilir.' : '' });
  const zero = LEDGER.filter((r) => !mxN(r.total)).length; it.push({ ok: !zero, t: zero ? zero + ' satırın tutarı boş' : 'Boş tutarlı satır yok', h: zero ? 'Tabloda 0 tutarlı satırları doldur ya da sil.' : '' });
  const soon = allDebts().filter((d) => !d.paid && d.due && mxDiff(d.due, fiIso()) <= 7 && mxDiff(d.due, fiIso()) >= -30); it.push({ ok: !soon.length, t: soon.length ? soon.length + ' ödeme 7 gün içinde' : 'Yaklaşan ödeme yok', h: soon.length ? soon.slice(0, 2).map((d) => d.who).join(', ') : '', a: soon.length ? 'mxnakit' : '' });
  let hes = 0, ind = 0; mrows.forEach((r) => { const k = mxN(r.total) * mxN(r.rate) / (100 + mxN(r.rate)); if (dirOf(r) === 'gelir') hes += k; else ind += k; });
  return { it, ok: it.filter((x) => x.ok).length, hes, ind, net: hes - ind };
}
NEWM.mxkapanis = () => {
  const C = mxClose(); const cal = mxCal();
  return sheet('Ay sonu kontrolü', `<div class="kpis"><div class="kpi"><div class="l">Tamam</div><div class="v num">${C.ok}/${C.it.length}</div></div><div class="kpi"><div class="l">Hesaplanan KDV</div><div class="v num">${fmt0(C.hes)}</div></div><div class="kpi"><div class="l">${C.net >= 0 ? 'Ödenecek KDV' : 'Devreden KDV'}</div><div class="v num">${fmt0(Math.abs(C.net))}</div></div></div>
  <div class="card flush" style="margin-top:10px">${C.it.map((x) => `<div class="row" style="padding:12px 14px;gap:10px;align-items:flex-start;border-top:1px solid var(--line,#e5e8ee)"><span style="flex:none;margin-top:1px">${x.ok ? GZ.ok : GZ.warn}</span><div class="grow"><b style="font-weight:600">${esc(x.t)}</b>${x.h ? `<div class="small muted">${esc(x.h)}</div>` : ''}</div>${x.a ? `<button class="btn sm sec" data-a="${x.a}">Aç</button>` : ''}</div>`).join('')}</div>
  <h3 style="margin-top:14px">Yaklaşan beyannameler</h3>${cal.map((c) => `<div class="row between" style="padding:9px 0;border-top:1px solid var(--line,#e5e8ee)"><div><b style="font-weight:600">${esc(c.n)}</b><div class="small muted">${esc(c.p)} dönemi · ${mxDM(c.d)}</div></div><span class="pill ${c.left <= 3 ? 'p-bad' : c.left <= 7 ? 'p-warn' : 'p-info'}">${c.left === 0 ? 'Bugün' : c.left + ' gün'}</span></div>`).join('')}
  <p class="small muted" style="margin-top:8px">Tarihler genel takvime göredir. Mali müşavirinle kontrol et, resmî tatilde değişebilir.</p>`);
};
H.mxkapanis = () => { S.modal = { type: 'mxkapanis' }; renderModal(); };

/* --- tekrarlayan kayıtlar --- */
NEWM.mxrec = () => {
  const R = mxRecs(); const accs = Array.from(new Set(['Kira', 'Maaş', 'Abonelik', 'Elektrik', 'Su', 'İnternet', 'Diğer'].concat(LEDGER.map((r) => r.acc).filter(Boolean)))).slice(0, 40);
  const inp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
  return sheet('Tekrarlayan kayıtlar', `<p class="muted small">Kira, abonelik gibi her ay aynı gelen kayıtlar ayın seçtiğin gününde kendiliğinden eklenir. Nakit akışı tahminine de girer.</p>
  ${R.length ? R.map((r) => `<div class="row between" style="padding:10px 0;border-top:1px solid var(--line,#e5e8ee);gap:8px"><div style="min-width:0"><b style="font-weight:600">${esc(r.desc)}</b><div class="small muted">Her ayın ${r.day}. günü · ${esc(r.acc)} · ${r.dir === 'gelir' ? 'Gelir' : 'Gider'}${r.off ? ' · durdu' : ''}</div></div><b class="num">${fmt0(r.total)}</b><div class="row"><button class="btn sm sec" data-a="mxrectog" data-id="${esc(r.id)}">${r.off ? 'Başlat' : 'Durdur'}</button><button class="btn sm sec" data-a="mxrecdel" data-id="${esc(r.id)}" aria-label="Sil">${ic('x', 16)}</button></div></div>`).join('') : '<p class="muted small" style="margin-top:8px">Henüz tekrarlayan kayıt yok.</p>'}
  <h3 style="margin-top:14px">Yeni ekle</h3><div class="stack"><div class="field" style="margin:0"><label for="mr-d">Açıklama</label><input id="mr-d" style="${inp}" placeholder="Örn. Dükkan kirası"></div>
  <div class="row" style="gap:8px"><div class="field" style="margin:0;flex:1"><label for="mr-t">Tutar (₺)</label><input id="mr-t" inputmode="decimal" style="${inp}" placeholder="25000"></div><div class="field" style="margin:0;flex:1"><label for="mr-g">Ayın günü</label><input id="mr-g" inputmode="numeric" style="${inp}" value="1"></div></div>
  <div class="row" style="gap:8px"><div class="field" style="margin:0;flex:1"><label for="mr-k">Tür</label><select id="mr-k" style="${inp}"><option value="gider">Gider</option><option value="gelir">Gelir</option></select></div><div class="field" style="margin:0;flex:1"><label for="mr-r">KDV %</label><select id="mr-r" style="${inp}"><option>0</option><option>1</option><option>10</option><option selected>20</option></select></div></div>
  <div class="field" style="margin:0"><label for="mr-a">Hesap</label><select id="mr-a" style="${inp}">${accs.map((a) => `<option>${esc(a)}</option>`).join('')}</select></div><button class="btn block" data-a="mxrecadd">Ekle</button></div>`);
};
H.mxrec = () => { S.modal = { type: 'mxrec' }; renderModal(); };
H.mxrecadd = () => {
  if (mxRestricted()) return toast('Şube kısıtlı hesapta bu işlem kapalı.', 'warn');
  const g = (id) => ($('#' + id) || {}).value || ''; const desc = g('mr-d').trim(); const tot = parseFloat(g('mr-t').replace(/\./g, '').replace(',', '.')); const day = Math.min(28, Math.max(1, parseInt(g('mr-g'), 10) || 1));
  if (desc.length < 2 || !(tot > 0)) return toast('Açıklama ve tutarı yaz.', 'warn');
  mxRecs().push({ id: 'rc' + (++seq) + Date.now().toString(36), desc, total: tot, day, dir: g('mr-k') === 'gelir' ? 'gelir' : 'gider', rate: parseInt(g('mr-r'), 10) || 0, acc: g('mr-a') || 'Diğer', from: fiIso().slice(0, 7) });
  try { pSched(); } catch (e) {} toast('Eklendi. Bu ay günü geldiyse kayıt hemen oluşur.', 'ok'); S.modal = null; mxRecRun(); render(); S.modal = { type: 'mxrec' }; renderModal();
};
H.mxrectog = (el) => { const r = mxRecs().find((x) => x.id === el.dataset.id); if (r) r.off = !r.off; try { pSched(); } catch (e) {} renderModal(); };
H.mxrecdel = (el) => { const R = mxRecs(); const i = R.findIndex((x) => x.id === el.dataset.id); if (i >= 0) R.splice(i, 1); try { pSched(); } catch (e) {} renderModal(); };

/* --- banka ekstresi eşleştirme --- */
function mxNum(s) {
  s = String(s == null ? '' : s).trim().replace(/[₺\sTLtl]/g, ''); if (!s || !/\d/.test(s)) return null; let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); } if (/-$/.test(s)) { neg = true; s = s.slice(0, -1); } if (/^-/.test(s)) { neg = true; s = s.slice(1); } s = s.replace(/^\+/, '');
  if (!/^[\d.,]+$/.test(s)) return null; const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc >= 0 && ld >= 0) { s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); } else if (lc >= 0) { s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); } else if (ld >= 0) { s = /\.\d{1,2}$/.test(s) && (s.match(/\./g) || []).length === 1 ? s : s.replace(/\./g, ''); }
  const v = parseFloat(s); return isFinite(v) ? (neg ? -v : v) : null;
}
function mxDate(s) {
  s = String(s == null ? '' : s).trim(); let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
}
function mxCsv(txt) {
  const lines = String(txt).replace(/\r/g, '').split('\n').filter((l) => l.trim()); if (!lines.length) return [];
  const c = (ch) => (lines[0].split(ch).length - 1); const sep = c(';') >= c('\t') && c(';') > 0 ? ';' : c('\t') > 0 ? '\t' : ',';
  return lines.map((l) => { const o = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { o.push(cur); cur = ''; } else cur += ch; } o.push(cur); return o; });
}
function mxParse(rows, flip) {
  const out = []; let ci = -1, co = -1;
  rows.slice(0, 6).forEach((r) => r.forEach((c, i) => { const t = String(c).toLocaleLowerCase('tr'); if (/(alacak|giren|gelen)/.test(t)) ci = i; if (/(borç|borc|çıkan|giden)/.test(t)) co = i; }));
  rows.forEach((r) => {
    let di = -1; for (let i = 0; i < r.length; i++) { if (mxDate(r[i])) { di = i; break; } } if (di < 0) return; const iso = mxDate(r[di]); let amt = null;
    if (ci >= 0 && co >= 0 && ci !== co) { const a = mxNum(r[ci]), b = mxNum(r[co]); if (a || b) amt = Math.abs(a || 0) - Math.abs(b || 0); }
    if (amt == null) { const nums = []; r.forEach((c, i) => { if (i === di) return; const n = mxNum(c); if (n !== null && String(c).replace(/\D/g, '').length <= 12) nums.push({ i, n }); }); const cand = nums.filter((x) => !/^\d{6,}$/.test(String(r[x.i]).trim())); if (!cand.length) return; amt = cand[0].n; }
    if (!amt) return; if (flip) amt = -amt;
    const desc = r.filter((c, i) => i !== di && mxNum(c) === null && String(c).trim().length > 2).join(' ').replace(/\s+/g, ' ').trim().slice(0, 90) || 'Banka hareketi';
    out.push({ iso, amt: Math.round(amt * 100) / 100, desc, key: iso + '|' + amt.toFixed(2) + '|' + desc.slice(0, 24) });
  });
  return out;
}
const mxWords = (s) => String(s || '').toLocaleLowerCase('tr').split(/[^a-zçğıöşü0-9]+/).filter((w) => w.length > 3);
function mxMatch(txs) {
  const used = new Set(); const todayDup = new Set(LEDGER.filter((r) => r.bk).map((r) => r.bk));
  return txs.map((t) => {
    const a = Math.abs(t.amt); const w = mxWords(t.desc); const r = { t, kind: 'new', ref: null };
    if (todayDup.has(t.key)) { r.kind = 'dup'; return r; }
    const score = (name) => mxWords(name).filter((x) => w.some((y) => y.includes(x) || x.includes(y))).length;
    if (t.amt > 0) {
      const c = INV.filter((v) => v.st !== 'odendi' && Math.abs(ivOpen(v) - a) < 0.015 && !used.has('i' + v.id)).sort((x, y) => score(y.cust) - score(x.cust) || Math.abs(mxDiff(x.due || t.iso, t.iso)) - Math.abs(mxDiff(y.due || t.iso, t.iso)))[0];
      if (c) { used.add('i' + c.id); r.kind = 'inv'; r.ref = c; return r; }
    } else {
      const c = DEBTS.filter((d) => !d.paid && Math.abs(dbOpen(d) - a) < 0.015 && !used.has('d' + d.id)).sort((x, y) => score(y.who) - score(x.who))[0];
      if (c) { used.add('d' + c.id); r.kind = 'debt'; r.ref = c; return r; }
    }
    const dir = t.amt > 0 ? 'gelir' : 'gider';
    const l = LEDGER.find((x) => dirOf(x) === dir && Math.abs(mxN(x.total) - a) < 0.015 && x.iso && Math.abs(mxDiff(x.iso, t.iso)) <= 7 && !used.has('l' + x.id));
    if (l) { used.add('l' + l.id); r.kind = 'led'; r.ref = l; return r; }
    const sim = LEDGER.find((x) => dirOf(x) === dir && x.desc && w.length && mxWords(x.desc).some((y) => w.some((z) => z.includes(y) || y.includes(z)))); r.guess = sim ? { acc: sim.acc, rate: sim.rate } : null; return r;
  });
}
const mxKind = { inv: ['Fatura tahsilatı', 'p-ok'], debt: ['Borç ödemesi', 'p-info'], led: ['Zaten kayıtlı', 'p-info'], dup: ['Daha önce işlendi', 'p-info'], new: ['Yeni kayıt', 'p-warn'] };
NEWM.mxekstre = () => {
  const inp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
  const head = `<p class="muted small">Bankadan indirdiğin ekstreyi (Excel, CSV ya da kopyala-yapıştır) yükle. Kais hareketleri açık faturalar, borçlar ve kayıtlarınla eşler. Dosya cihazından çıkmaz.</p>
  <div class="row wrap" style="gap:8px"><label class="btn sec" style="cursor:pointer">${ic('file', 16)} Dosya seç<input id="mx-file" type="file" accept=".csv,.txt,.xlsx,.xls" style="display:none"></label>${MX.fn ? `<span class="small muted">${esc(MX.fn)}</span>` : ''}</div>
  <div class="field" style="margin:8px 0 0"><label for="mx-txt">Ya da buraya yapıştır</label><textarea id="mx-txt" rows="4" style="${inp}" placeholder="16.11.2026;Havale ABC Ltd;12.500,00;98.200,00">${esc(MX.txt)}</textarea></div>
  <label class="row" style="gap:8px;margin:8px 0;align-items:center"><input id="mx-flip" type="checkbox" ${MX.flip ? 'checked' : ''} style="width:20px;height:20px"><span class="small">Giden para artı görünüyorsa işareti ters çevir</span></label><button class="btn block" data-a="mxmatch">Eşleştir</button>`;
  if (!MX.res) return sheet('Banka ekstresi', head);
  const R = MX.res; const sel = (i) => MX.sel[i] !== false && R[i].kind !== 'dup' && !(mxOptK(R[i].kind) && MX.sel[i] !== true); const n = R.filter((_, i) => sel(i)).length;
  const sum = (k) => R.filter((r) => r.kind === k).length;
  const list = R.map((r, i) => { const t = r.t; const k = mxKind[r.kind]; const who = r.alloc ? r.alloc[0].v.cust + ' · ' + r.alloc.map((x) => x.v.no + ' ' + fmt0(x.amt)).join(', ') : r.kind === 'inv' ? r.ref.cust + ' · ' + r.ref.no : r.kind === 'debt' ? r.ref.who : r.kind === 'led' ? r.ref.desc : t.desc;
    return `<label class="row" style="gap:10px;padding:10px 0;border-top:1px solid var(--line,#e5e8ee);align-items:flex-start"><input type="checkbox" data-mxsel="${i}" ${sel(i) ? 'checked' : ''} ${r.kind === 'dup' ? 'disabled' : ''} style="width:20px;height:20px;margin-top:2px;flex:none"><div class="grow" style="min-width:0"><b style="font-weight:600">${esc(who)}</b><div class="small muted">${mxDM(t.iso)} · ${esc(t.desc)}</div><span class="pill ${k[1]}" style="margin-top:4px">${k[0]}</span></div><b class="num" style="color:${t.amt >= 0 ? '#15803d' : '#b42318'};flex:none">${mxSign(t.amt)}</b></label>`; }).join('');
  return sheet('Banka ekstresi', `<div class="kpis"><div class="kpi"><div class="l">Eşleşen</div><div class="v num">${sum('inv') + sum('debt')}</div></div><div class="kpi"><div class="l">Yeni kayıt</div><div class="v num">${sum('new')}</div></div><div class="kpi"><div class="l">Zaten var</div><div class="v num">${sum('led') + sum('dup')}</div></div></div>
  <div class="callout" style="margin-top:10px">${ic('sparkle')}<div><p>Fatura ve borç eşleşmeleri ödendi olarak işaretlenir. Yeni kayıtlar tabloya eklenir, hesabı benzer kayıtlardan tahmin ederim. Seçimi değiştirebilirsin.</p></div></div>
  <div style="margin-top:6px">${list}</div><div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn grow" data-a="mxapply" ${n ? '' : 'disabled'}>${n} hareketi işle</button><button class="btn sec" data-a="mxreset">Yeni dosya</button></div>`);
};
H.mxekstre = () => { MX.res = null; MX.sel = {}; S.modal = { type: 'mxekstre' }; renderModal(); };
H.mxreset = () => { MX.res = null; MX.sel = {}; MX.txt = ''; MX.fn = ''; renderModal(); };
document.addEventListener('input', (e) => { if (e.target && e.target.id === 'mx-txt') MX.txt = e.target.value; });
document.addEventListener('change', async (e) => {
  const t = e.target; if (!t) return;
  if (t.id === 'mx-flip') { MX.flip = t.checked; return; }
  if (t.dataset && t.dataset.mxsel != null) { MX.sel[t.dataset.mxsel] = t.checked; renderModal(); return; }
  if (t.id !== 'mx-file' || !t.files || !t.files[0]) return; const f = t.files[0]; MX.fn = f.name;
  try {
    if (/\.xlsx?$/i.test(f.name)) { const X = await xlLoad(); const wb = new X.Workbook(); await wb.xlsx.load(await f.arrayBuffer()); const ws = wb.worksheets[0]; const rows = []; ws.eachRow((r) => { const a = []; r.eachCell({ includeEmpty: true }, (c, i) => { let v = c.value; if (v && typeof v === 'object' && v.result !== undefined) v = v.result; if (v instanceof Date) v = v.toISOString().slice(0, 10); a[i - 1] = v == null ? '' : String(v); }); rows.push(a); }); MX.txt = rows.map((r) => r.join(';')).join('\n'); }
    else { MX.txt = await f.text(); }
    MX.res = null; renderModal();
  } catch (x) { toast('Dosya okunamadı. CSV olarak kaydedip dene.', 'warn'); }
});
H.mxmatch = () => {
  const ta = $('#mx-txt'); if (ta) MX.txt = ta.value; const fl = $('#mx-flip'); if (fl) MX.flip = fl.checked;
  const tx = mxParse(mxCsv(MX.txt), MX.flip);
  if (!tx.length) return toast('Tarih ve tutar içeren satır bulamadım. Sütunları kontrol et.', 'warn');
  MX.res = mxMatch(tx.slice(0, 500)); MX.sel = {}; renderModal();
};
H.mxapply = () => {
  if (mxRestricted()) return toast('Şube kısıtlı hesapta bu işlem kapalı.', 'warn'); if (locked()) return; if (!MX.res) return;
  let a = 0, b = 0, c = 0;
  MX.res.forEach((r, i) => {
    if (MX.sel[i] === false || r.kind === 'dup' || (mxOptK(r.kind) && MX.sel[i] !== true)) return; const t = r.t;
    if (r.alloc) { r.alloc.forEach((x) => ivPay(x.v, x.amt, t.iso, 'Banka', t.desc)); a++; return; }
    if (r.kind === 'inv') { ivPay(r.ref, ivOpen(r.ref), t.iso, 'Banka', t.desc); r.ref.st = 'odendi'; r.ref.paidAt = t.iso; a++; return; }
    if (r.kind === 'debt') { r.ref.paid = true; r.ref.paidAt = t.iso; b++; return; }
    if (r.kind === 'led') { r.ref.bk = t.key; c++; return; }
    const dir = t.amt > 0 ? 'gelir' : 'gider'; const g = r.guess;
    LEDGER.push({ id: 'g' + ++seq, date: mxDM(t.iso), iso: t.iso, desc: t.desc, acc: g ? g.acc : dir === 'gelir' ? INCATS[2] : 'Diğer', doc: 'Banka', rate: g ? mxN(g.rate) : dir === 'gelir' ? 0 : 20, total: Math.abs(t.amt), dir, src: 'Banka', bk: t.key }); c++;
  });
  try { pSched(); } catch (e) {} MX.res = null; MX.sel = {}; MX.txt = ''; MX.fn = ''; S.modal = null; render();
  toast(a + ' fatura tahsil, ' + b + ' borç ödendi, ' + c + ' kayıt işlendi.', 'ok');
};

/* --- giriş kartı --- */
function mxCard() {
  if (!mxCan()) return '';
  let F, A, C; try { F = mxForecast(30); A = mxAge(INV.filter((v) => v.st !== 'odendi').map((v) => ({ amt: ivOpen(v), due: v.due, who: v.cust }))); C = mxClose(); } catch (e) { return ''; }
  const old = A.slice(2).reduce((t, r) => t + r.t, 0); const nr = mxRecs().filter((r) => !r.off).length;
  const tile = (a, i, t, s, w) => `<button class="btn sec" data-a="${a}" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:12px;height:auto;min-height:74px;border-radius:14px;${w ? 'border-color:#E5484D;' : ''}"><span style="display:flex;gap:6px;align-items:center;font-weight:600">${ic(i, 17)} ${t}</span><span class="small muted" style="font-weight:400">${s}</span></button>`;
  return `<div class="card stack" style="margin-bottom:12px"><div class="row between"><div><h3>Akıllı muhasebe</h3><p class="muted small" style="margin-top:2px">Tahmin, eşleştirme ve kontroller</p></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${tile('mxnakit', 'trend', 'Nakit akışı', F.min < 0 ? 'Kasa eksiye inebilir' : '30 gün ' + mxSign(F.d30), F.min < 0)}${tile('mxyas', 'clock', 'Yaşlandırma', old ? fmt0(old) + ' 30 günü aştı' : 'Gecikme yok', old > 0)}${tile('mxekstre', 'file', 'Banka ekstresi', 'Otomatik eşleştir')}${tile('mxkapanis', 'check', 'Ay sonu kontrolü', C.ok + '/' + C.it.length + ' tamam', C.ok < C.it.length - 2)}${tile('mxkdv', 'table', 'KDV hazırlığı', 'Oran bazlı özet, Excel')}${tile('mxpaket', 'send', 'Excel dönem dosyası', 'Tek dosyada özet, defter, KDV')}${tile('ivdagit', 'wallet', 'Ödeme dağıt', 'Bir ödemeyi birden çok faturaya')}${tile('mxfis', 'camera', 'Fişten kayıt', 'Fotoğraf çek, kaydolsun')}${tile('mxcari', 'list', 'Cari ekstre', 'Mutabakat gönder')}${tile('mximp', 'file', 'Excel\'den aktar', 'Mevcut takibini taşı')}${tile('mxrec', 'plus', 'Tekrarlayan', nr ? nr + ' kayıt aktif' : 'Kira, abonelik')}</div></div>`;
}
{ const _v = viewHTML; viewHTML = function () { const h = _v.apply(this, arguments); const u = S.user; if (!u || S.modal) return h; if (!((u.role === 'patron' && S.view === 'muhasebe') || (u.role === 'muhasebeci' && S.view === 'borc'))) return h; const c = mxCard(); if (!c) return h; return /^<div[^>]*>/.test(h) ? h.replace(/^(<div[^>]*>)/, (m) => m + c) : c + h; }; }

/* =====================================================================
   v150: fişten hızlı kayıt (fotoğraf, OCR, onaysız doğrudan deftere) ve cari ekstre / mutabakat
   ===================================================================== */
const MXF = { step: 'pick', p: null, err: '', n: 0 };
const mxInp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
function mxFisDate(text) {
  const m = String(text || '').match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})/); const t = fiIso();
  if (m) { const d = +m[1], mo = +m[2]; let y = +m[3]; if (y < 100) y += 2000; if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && y >= 2000 && y <= +t.slice(0, 4)) { const iso = y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0'); if (iso <= addDays(t, 1)) return { iso, guess: false }; } }
  return { iso: t, guess: true };
}
const mxAccs = () => Array.from(new Set(['Akaryakıt', 'Telefon / internet', 'Elektrik', 'Su', 'Kira', 'Yemek', 'Malzeme', 'Diğer'].concat(LEDGER.filter((r) => dirOf(r) === 'gider').map((r) => r.acc).filter(Boolean)))).slice(0, 40);
function mxFisDup(p) { return LEDGER.find((r) => dirOf(r) === 'gider' && Math.abs(mxN(r.total) - mxN(p.total)) < 0.015 && r.iso && Math.abs(mxDiff(r.iso, p.iso)) <= 1); }
NEWM.mxfis = () => {
  if (MXF.step === 'reading') return sheet('Fişten kayıt', '<div class="callout">' + ic('clock') + '<div><b>Fiş okunuyor</b><p id="oc-prog" style="margin-top:2px">Birkaç saniye sürer…</p></div></div>');
  if (MXF.step === 'form' && MXF.p) {
    const p = MXF.p; const dup = mxFisDup(p); const accs = mxAccs(); if (p.acc && accs.indexOf(p.acc) < 0) accs.unshift(p.acc);
    const kdv = mxN(p.total) * p.rate / (100 + p.rate);
    return sheet('Fişi kontrol et', `${p.guess ? `<div class="callout warn" style="margin-bottom:10px">${ic('alert')}<div><p>Fişten bazı bilgiler net okunamadı (${p.guess}). Kontrol edip düzelt.</p></div></div>` : `<div class="callout" style="margin-bottom:10px">${ic('sparkle')}<div><p>Bilgiler fişten okundu. Kontrol et, uygunsa kaydet.</p></div></div>`}
    ${dup ? `<div class="callout warn" style="margin-bottom:10px">${ic('alert')}<div><b>Benzer kayıt var</b><p style="margin-top:2px">${esc(dup.desc)} · ${fmt0(dup.total)} · ${mxDM(dup.iso)}. Aynı fişse kaydetme.</p></div></div>` : ''}
    <div class="stack"><div class="field" style="margin:0"><label for="mf-d">Satıcı</label><input id="mf-d" style="${mxInp}" value="${esc(p.desc)}"></div>
    <div class="row" style="gap:8px"><div class="field" style="margin:0;flex:1"><label for="mf-t">Tutar (₺)</label><input id="mf-t" inputmode="decimal" style="${mxInp}" value="${esc(String(p.total).replace('.', ','))}"></div><div class="field" style="margin:0;flex:1"><label for="mf-i">Tarih</label><input id="mf-i" type="date" style="${mxInp}" value="${esc(p.iso)}"></div></div>
    <div class="row" style="gap:8px"><div class="field" style="margin:0;flex:1"><label for="mf-r">KDV %</label><select id="mf-r" style="${mxInp}">${[0, 1, 8, 10, 20].map((x) => `<option ${x === p.rate ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field" style="margin:0;flex:1"><label for="mf-a">Hesap</label><select id="mf-a" style="${mxInp}">${accs.map((a) => `<option ${a === p.acc ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select></div></div>
    ${BRANCHES.length ? `<div class="field" style="margin:0"><label for="mf-b">Şube</label><select id="mf-b" style="${mxInp}"><option value="">Belirtme</option>${BRANCHES.map((b) => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}</select></div>` : ''}
    <p class="small muted">KDV tutarı yaklaşık ${fmt(kdv)}. Kayıt doğrudan tabloya girer, ayrıca onay beklemez.</p>
    <div class="row wrap" style="gap:8px"><button class="btn grow" data-a="mxfsave">Kaydet</button><button class="btn sec" data-a="mxfnew">Vazgeç</button></div></div>`);
  }
  return sheet('Fişten kayıt', `<p class="muted small">Fişin fotoğrafını çek ya da galeriden seç. Kais satıcıyı, tutarı, tarihi ve KDV oranını okur. Sen kontrol edip kaydedince doğrudan tabloya girer.</p>${MXF.err ? `<div class="callout warn" style="margin:8px 0">${ic('alert')}<div><p>${esc(MXF.err)}</p></div></div>` : ''}
  <label class="btn block" style="cursor:pointer;margin-top:10px">${ic('camera', 18)} Fiş fotoğrafı seç<input id="mxf-file" type="file" accept="image/*" capture="environment" style="display:none"></label><p class="small muted" style="margin-top:10px">İpucu: fişi düz bir zemine koy, aydınlık bir yerde çek. ${MXF.n ? '<br><b>' + MXF.n + ' fiş</b> kaydedildi.' : ''}</p>`);
};
H.mxfis = () => { MXF.step = 'pick'; MXF.p = null; MXF.err = ''; S.modal = { type: 'mxfis' }; renderModal(); };
H.mxfnew = () => { MXF.step = 'pick'; MXF.p = null; MXF.err = ''; renderModal(); };
document.addEventListener('change', (e) => {
  const t = e.target; if (!t || t.id !== 'mxf-file' || !t.files || !t.files[0]) return; const f = t.files[0];
  MXF.step = 'reading'; MXF.err = ''; renderModal(); const m0 = S.modal;
  (async () => {
    try {
      const r = await ocrFile(f, (p) => { const x = document.getElementById('oc-prog'); if (x) x.textContent = 'Okunuyor %' + Math.round(p * 100); });
      const p = ocrParse(r.text, r.conf); if (S.modal !== m0) return; if (p.total == null) throw new Error('no_total');
      const dt = mxFisDate(r.text); const miss = []; if (dt.guess) miss.push('tarih bugün olarak alındı'); if (/okunamad/.test(p.seller)) miss.push('satıcı okunamadı'); if (p.rateGuess) miss.push('KDV oranı tahmin');
      const sim = LEDGER.find((x) => x.desc && p.seller && x.desc.toLocaleLowerCase('tr').indexOf(p.seller.toLocaleLowerCase('tr').split(' ')[0]) >= 0);
      MXF.p = { desc: /okunamad/.test(p.seller) ? '' : p.seller, total: p.total, iso: dt.iso, rate: p.rate, acc: p.cat || (sim && sim.acc) || 'Diğer', guess: miss.join(', ') }; MXF.step = 'form';
    } catch (err) { if (S.modal !== m0) return; MXF.step = 'pick'; MXF.err = err && err.message === 'ocr_load' ? 'Okuma motoru yüklenemedi. İnternet bağlantını kontrol et.' : 'Fişten toplam tutar okunamadı. Daha aydınlık ve düz bir fotoğraf dene.'; }
    renderModal();
  })();
});
H.mxfsave = () => {
  if (mxRestricted()) return toast('Şube kısıtlı hesapta bu işlem kapalı.', 'warn'); if (locked()) return;
  const g = (id) => ($('#' + id) || {}).value || ''; const total = trNum(g('mf-t')); const iso = g('mf-i') || fiIso(); const desc = g('mf-d').trim();
  if (!(total > 0)) return toast('Tutarı yaz.', 'warn'); if (desc.length < 2) return toast('Satıcıyı yaz.', 'warn');
  const row = { id: 'g' + ++seq, date: mxDM(iso), iso, desc, acc: g('mf-a') || 'Diğer', doc: 'Fiş', rate: parseInt(g('mf-r'), 10) || 0, total, dir: 'gider', src: 'Fiş' }; const b = g('mf-b'); if (b) row.br = b;
  LEDGER.push(row); try { pSched(); } catch (e) {} MXF.n++; MXF.step = 'pick'; MXF.p = null; toast('Fiş kaydedildi.', 'ok'); render(); S.modal = { type: 'mxfis' }; renderModal();
};

/* --- cari ekstre ve mutabakat --- */
const MXC = { kind: 'musteri', name: '' };
const mxKey = (s) => String(s || '').trim().toLocaleLowerCase('tr');
function mxCariNames(kind) {
  const m = {}; if (kind === 'musteri') { INV.forEach((v) => { if (v.cust) m[mxKey(v.cust)] = v.cust; }); } else { DEBTS.forEach((d) => { if (d.who) m[mxKey(d.who)] = d.who; }); }
  return Object.values(m).sort((a, b) => a.localeCompare(b, 'tr'));
}
function mxCariRows(kind, name) {
  const k = mxKey(name); const today = fiIso();
  if (kind === 'musteri') return INV.filter((v) => mxKey(v.cust) === k).map((v) => { const open = v.st !== 'odendi'; const late = open && v.due && v.due < today ? mxDiff(today, v.due) : 0; return { iso: v.iso || '', no: v.no, tot: mxN(v.tot), due: v.due || '', open, late, note: '' }; }).sort((a, b) => (a.iso < b.iso ? 1 : -1)).slice(0, 80);
  return DEBTS.filter((d) => mxKey(d.who) === k).map((d) => { const open = !d.paid; const late = open && d.due && d.due < today ? mxDiff(today, d.due) : 0; return { iso: d.due || '', no: d.note || 'Borç', tot: mxN(d.amt), due: d.due || '', open, late, note: '' }; }).sort((a, b) => (a.iso < b.iso ? 1 : -1)).slice(0, 80);
}
const mxDmy = (iso) => (iso ? iso.split('-').reverse().join('.') : '—');
function mxCariText(kind, name, rows) {
  const bal = rows.filter((r) => r.open).reduce((t, r) => t + r.tot, 0); const iban = (typeof EDOC !== 'undefined' && EDOC && EDOC.iban) || ''; const op = rows.filter((r) => r.open);
  const ad = String(name).split(/\s+/)[0]; const NL = String.fromCharCode(10);
  if (kind === 'musteri') return ['Merhaba ' + ad + ',', BIZ + ' olarak ' + mxDmy(fiIso()) + ' tarihi itibarıyla cari hesap özetiniz:', ...(op.length ? op.slice(0, 15).map((r) => '• ' + r.no + ' · ' + fmt0(r.tot) + ' · vade ' + mxDmy(r.due) + (r.late ? ' (' + r.late + ' gün gecikmiş)' : '')) : ['Açık bakiyeniz bulunmuyor.']), 'Toplam açık bakiye: ' + fmt0(bal), 'Kayıtlarınızla uyuşuyorsa onaylamanız, farklıysa bildirmeniz yeterli.' + (iban && bal > 0 ? NL + 'Ödeme için IBAN: ' + iban : ''), 'Teşekkürler.'].join(NL);
  return ['Merhaba ' + ad + ',', BIZ + ' olarak ' + mxDmy(fiIso()) + ' tarihi itibarıyla kayıtlarımızda size ödenecek bakiye:', ...(op.length ? op.slice(0, 15).map((r) => '• ' + r.no + ' · ' + fmt0(r.tot) + ' · vade ' + mxDmy(r.due)) : ['Açık bakiye görünmüyor.']), 'Toplam: ' + fmt0(bal), 'Sizin kayıtlarınızla uyuşuyor mu? Farklıysa lütfen bildirin.', 'Teşekkürler.'].join(NL);
}
NEWM.mxcari = () => {
  const names = mxCariNames(MXC.kind); if (MXC.name && !names.some((n) => mxKey(n) === mxKey(MXC.name))) MXC.name = '';
  const rows = MXC.name ? mxCariRows(MXC.kind, MXC.name) : []; const bal = rows.filter((r) => r.open).reduce((t, r) => t + r.tot, 0); const tot = rows.reduce((t, r) => t + r.tot, 0);
  const ph = MXC.name ? ((FCUST.find((x) => mxKey(x.name) === mxKey(MXC.name)) || {}).tel || '') : '';
  const seg = (k, l) => `<button type="button" class="${MXC.kind === k ? 'on' : ''}" data-a="mxckind" data-k="${k}">${l}</button>`;
  return sheet('Cari ekstre', `<div class="cb-chips" style="margin:0 0 10px">${seg('musteri', 'Müşteri')}${seg('tedarik', 'Tedarikçi')}</div>
  <div class="field" style="margin:0"><label for="mc-n">${MXC.kind === 'musteri' ? 'Müşteri' : 'Tedarikçi'}</label><select id="mc-n" style="${mxInp}"><option value="">Seç</option>${names.map((n) => `<option ${mxKey(n) === mxKey(MXC.name) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
  ${!names.length ? '<p class="muted small" style="margin-top:10px">Henüz kayıt yok. Fatura ya da borç ekleyince burada listelenir.</p>' : ''}
  ${MXC.name ? `<div class="kpis" style="margin-top:10px"><div class="kpi"><div class="l">Açık bakiye</div><div class="v num">${fmt0(bal)}</div></div><div class="kpi"><div class="l">Toplam</div><div class="v num">${fmt0(tot)}</div></div><div class="kpi"><div class="l">Belge</div><div class="v num">${rows.length}</div></div></div>
  <div class="card flush" style="margin-top:10px">${rows.slice(0, 20).map((r) => `<div class="row between" style="padding:10px 14px;gap:8px;border-top:1px solid var(--line,#e5e8ee)"><div style="min-width:0"><b style="font-weight:600">${esc(r.no)}</b><div class="small muted">${mxDmy(r.iso)} · vade ${mxDmy(r.due)}</div></div><div style="text-align:right"><b class="num">${fmt0(r.tot)}</b><div><span class="pill ${r.open ? (r.late ? 'p-bad' : 'p-warn') : 'p-ok'}">${r.open ? (r.late ? r.late + ' gün gecikmiş' : 'Açık') : 'Ödendi'}</span></div></div></div>`).join('') || '<div class="empty">Kayıt yok.</div>'}</div>
  <div class="field" style="margin:10px 0 0"><label for="mc-p">Telefon (WhatsApp)</label><input id="mc-p" type="tel" inputmode="tel" value="${esc(ph)}" placeholder="05xx xxx xx xx" style="${mxInp}"></div>
  <div class="row wrap" style="margin-top:10px;gap:8px"><button class="btn grow" data-a="mxcwa">WhatsApp ile gönder</button><button class="btn sec" data-a="mxccopy">Kopyala</button><button class="btn sec" data-a="mxcpdf">PDF</button></div>` : ''}`);
};
H.mxcari = () => { S.modal = { type: 'mxcari' }; renderModal(); };
H.mxckind = (el) => { MXC.kind = el.dataset.k; MXC.name = ''; renderModal(); };
document.addEventListener('change', (e) => { const t = e.target; if (!t) return; if (t.id === 'mc-n') { MXC.name = t.value; renderModal(); } else if (t.id === 'mc-p' && MXC.name && MXC.kind === 'musteri') { let f = FCUST.find((x) => mxKey(x.name) === mxKey(MXC.name)); if (!f) { f = { id: 'fc' + (++seq), name: MXC.name, vkn: '', adr: '', eposta: '' }; FCUST.push(f); } f.tel = t.value.trim(); try { pSched(); } catch (x) {} } });
const mxCText = () => mxCariText(MXC.kind, MXC.name, mxCariRows(MXC.kind, MXC.name));
H.mxcwa = () => { if (!MXC.name) return; const ph = ($('#mc-p') || {}).value || ''; if (!waPhone(ph)) toast('Telefon yaz, mesaj numaraya açılsın.', 'warn'); window.open(waLink(ph, mxCText()), '_blank', 'noopener'); };
H.mxccopy = async () => { if (!MXC.name) return; try { await navigator.clipboard.writeText(mxCText()); toast('Mesaj kopyalandı.', 'ok'); } catch (e) { toast('Kopyalanamadı.', 'warn'); } };
H.mxcpdf = () => {
  if (!MXC.name) return; const rows = mxCariRows(MXC.kind, MXC.name); const bal = rows.filter((r) => r.open).reduce((t, r) => t + r.tot, 0); const e = esc;
  const tr = rows.map((r) => `<tr><td>${mxDmy(r.iso)}</td><td>${e(r.no)}</td><td>${mxDmy(r.due)}</td><td>${r.open ? (r.late ? r.late + ' gün gecikmiş' : 'Açık') : 'Ödendi'}</td><td style="text-align:right">${fmt(r.tot)}</td></tr>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>Cari ekstre</title><style>body{font:14px system-ui;padding:28px;color:#111}table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border-bottom:1px solid #ddd;padding:7px 4px;text-align:left}h2{margin:0}.s{margin-top:28px;display:flex;gap:40px}.s div{flex:1;border-top:1px solid #999;padding-top:6px;font-size:12px;color:#555}</style><h2>Cari hesap ekstresi</h2><p>${e(BIZ)}<br>${e(MXC.name)} · ${mxDmy(fiIso())} tarihi itibarıyla</p><table><tr><th>Tarih</th><th>Belge</th><th>Vade</th><th>Durum</th><th>Tutar</th></tr>${tr}</table><p style="margin-top:14px;font-size:16px">Açık bakiye: <b>${fmt(bal)}</b></p><div class="s"><div>${e(BIZ)} kaşe / imza</div><div>${e(MXC.name)} mutabıkız, kaşe / imza</div></div><script>setTimeout(function(){window.print()},300)<\/script>`;
  try { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); return; } } catch (x) {}
  saveBlob('cari-ekstre.html', new Blob([html], { type: 'text/html;charset=utf-8' })); toast('Dosya indirildi. Açıp yazdır.', 'ok');
};

/* =====================================================================
   v151: mevcut Excel / CSV takip dosyasını Kais'e aktarma (akıllı sütun eşleme, önizleme, geri alma)
   ===================================================================== */
const MXI = { step: 'pick', sheets: [], si: 0, type: 'defter', map: {}, defDir: 'gider', defRate: 20, fn: '', err: '', done: null };
const IX_F = {
  defter: [['date', 'Tarih', /tarih|date|^gün$/, 1], ['desc', 'Açıklama', /açıklama|aciklama|detay|ürün|urun|hizmet|konu|isim|ad[ıi]|ünvan|unvan|başlık|baslik|not/, 0], ['total', 'Tutar', /tutar|toplam|miktar|bedel|fiyat|amount|genel/, 1], ['gelir', 'Gelir sütunu', /^gelir|giren|tahsilat|alacak|satış|satis/, 0], ['gider', 'Gider sütunu', /^gider|çıkan|cikan|ödeme|odeme|alış|alis|borç|borc/, 0], ['dir', 'Tür (gelir/gider)', /tür|tur|tip|yön|yon|işlem|islem/, 0], ['rate', 'KDV oranı', /kdv|oran|vergi/, 0], ['acc', 'Hesap / kategori', /hesap|kategori|grup|kalem|cins/, 0], ['doc', 'Belge türü', /belge|fatura|fiş|fis/, 0]],
  fatura: [['cust', 'Müşteri', /müşteri|musteri|cari|ünvan|unvan|firma|alıcı|alici|ad[ıi]|isim/, 1], ['no', 'Fatura no', /fatura\s*n|belge\s*n|^no$|numara|seri/, 0], ['date', 'Fatura tarihi', /tarih|date/, 0], ['due', 'Vade', /vade|son\s*öde|son\s*ode/, 0], ['tot', 'Tutar', /tutar|toplam|bakiye|alacak|bedel|genel/, 1], ['st', 'Durum (ödendi mi)', /durum|öden|oden|tahsil|kapan/, 0]],
  borc: [['who', 'Tedarikçi / kime', /tedarik|kime|alacaklı|alacakli|firma|cari|ünvan|unvan|ad[ıi]|isim/, 1], ['note', 'Açıklama', /açıklama|aciklama|not|detay|konu/, 0], ['amt', 'Tutar', /tutar|toplam|borç|borc|bakiye|bedel|genel/, 1], ['due', 'Vade', /vade|son\s*öde|son\s*ode|tarih/, 0], ['st', 'Durum (ödendi mi)', /durum|öden|oden|kapan/, 0]],
};
const IX_T = { defter: 'Gelir gider hareketleri', fatura: 'Faturalar, alacaklar', borc: 'Borçlar, ödenecekler' };
const ixN = (v) => (typeof v === 'number' ? v : mxNum(v));
const ixTxt = (v) => String(v == null ? '' : v).trim();
const ixNorm = (s) => ixTxt(s).toLocaleLowerCase('tr').replace(/\s+/g, ' ');
const IX_MON = { oca: 1, şub: 2, sub: 2, mar: 3, nis: 4, may: 5, haz: 6, tem: 7, ağu: 8, agu: 8, eyl: 9, eki: 10, kas: 11, ara: 12 };
function ixPrep(sh) {
  const rows = sh.rows; let hi = 0, best = -1;
  rows.slice(0, 15).forEach((r, i) => { const t = r.filter((c) => { const x = ixTxt(c); return x && ixN(c) === null && !ixDate(c); }).length; if (t > best && t >= 2) { best = t; hi = i; } });
  const heads = (rows[hi] || []).map((c, i) => ixTxt(c) || 'Sütun ' + (i + 1)); const data = rows.slice(hi + 1).filter((r) => r.some((c) => ixTxt(c)));
  return { heads, data };
}
function ixAuto(type, P) {
  const map = {}; const used = new Set(); const hn = P.heads.map(ixNorm);
  IX_F[type].forEach((f) => { const i = hn.findIndex((h, j) => !used.has(j) && f[2].test(h)); if (i >= 0) { map[f[0]] = i; used.add(i); } });
  const col = (i) => P.data.slice(0, 40).map((r) => r[i]);
  const frac = (i, fn) => { const c = col(i).filter((x) => ixTxt(x)); return c.length ? c.filter(fn).length / c.length : 0; };
  const need = (k, fn) => { if (map[k] != null) return; let b = -1, bs = 0.6; P.heads.forEach((_, i) => { if (used.has(i)) return; const s = frac(i, fn); if (s > bs) { bs = s; b = i; } }); if (b >= 0) { map[k] = b; used.add(b); } };
  const dk = type === 'defter' ? 'date' : type === 'fatura' ? 'date' : 'due'; need(dk, (x) => !!ixDate(x));
  const ak = type === 'defter' ? 'total' : type === 'fatura' ? 'tot' : 'amt'; if (!(type === 'defter' && (map.gelir != null || map.gider != null))) need(ak, (x) => ixN(x) !== null && !ixDate(x));
  const tk = type === 'defter' ? 'desc' : type === 'fatura' ? 'cust' : 'who'; need(tk, (x) => ixN(x) === null && ixTxt(x).length > 2);
  return map;
}
function ixDetect(sh) {
  const P = ixPrep(sh); const nm = ixNorm(sh.name); let best = 'defter', bs = -1;
  ['defter', 'fatura', 'borc'].forEach((t) => { const m = ixAuto(t, P); const req = IX_F[t].filter((f) => f[3] === 1 || false); let sc = IX_F[t].filter((f) => m[f[0]] != null).length; if (t === 'defter' && (m.gelir != null || m.gider != null) && m.date != null) sc += 2;
    if (t === 'fatura' && /fatura|alacak|cari|müşteri|musteri/.test(nm)) sc += 3; if (t === 'borc' && /borç|borc|tedarik|ödeme|odeme/.test(nm)) sc += 3; if (t === 'defter' && /gelir|gider|defter|kasa|hareket|muhasebe/.test(nm)) sc += 3;
    if (t === 'fatura' && m.due == null && m.no == null) sc -= 2; if (t === 'borc' && m.who == null) sc -= 2; if (sc > bs) { bs = sc; best = t; } });
  return best;
}
const ixCur = () => { const sh = MXI.sheets[MXI.si]; if (!sh) return null; if (!sh._p) sh._p = ixPrep(sh); return sh; };
NEWM.mximp = () => {
  if (MXI.step === 'busy') return sheet('Excel aktar', '<div class="callout">' + ic('clock') + '<div><b>Dosya okunuyor</b><p style="margin-top:2px">Birkaç saniye sürer…</p></div></div>');
  if (MXI.step === 'done' && MXI.done) { const d = MXI.done; return sheet('Aktarım tamam', `<div class="callout">${ic('check')}<div><b>${d.n} kayıt eklendi</b><p style="margin-top:2px">${esc(d.txt)}${d.dup ? ' ' + d.dup + ' kayıt zaten vardı, atlandı.' : ''}${d.bad ? ' ' + d.bad + ' satır eksik bilgi yüzünden atlandı.' : ''}</p></div></div><div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn grow" data-a="ixclose">Tamam</button><button class="btn sec" data-a="ixundo">Geri al</button><button class="btn sec" data-a="mximp">Başka sayfa</button></div>`); }
  const sh = MXI.step === 'map' ? ixCur() : null;
  if (!sh) {
    const xl = S.settings && S.settings.xlast;
    return sheet('Excel aktar', `<p class="muted small">Şimdiye kadar Excel'de tuttuğun kayıtları Kais'e taşı. Dosyayı yükle, Kais sütunları kendisi tanır ve eşler. Sen önizlemeyi kontrol edip onaylarsın. Dosya cihazından çıkmaz.</p>
    ${MXI.err ? `<div class="callout warn" style="margin:8px 0">${ic('alert')}<div><p>${esc(MXI.err)}</p></div></div>` : ''}
    <label class="btn block" style="cursor:pointer;margin-top:10px">${ic('file', 18)} Excel ya da CSV seç<input id="ix-file" type="file" accept=".xlsx,.csv,.txt" style="display:none"></label>
    <div class="field" style="margin:10px 0 0"><label for="ix-txt">Ya da tabloyu kopyalayıp yapıştır</label><textarea id="ix-txt" rows="4" style="${mxInp}" placeholder="Tarih;Açıklama;Tutar"></textarea></div><button class="btn sec block" style="margin-top:8px" data-a="ixpaste">Yapıştırılanı oku</button>
    <p class="small muted" style="margin-top:10px">Gelir gider hareketleri, faturalar (alacaklar) ve borçlar aktarılabilir. Birden çok sayfa varsa her biri ayrı seçilir. Eski .xls dosyasını .xlsx olarak kaydet.</p>
    ${xl ? `<div class="card" style="margin-top:12px;padding:10px 12px"><div class="small muted">Son aktarım: ${xl.n} kayıt · ${mxDM(xl.t)}</div><button class="btn sm sec" style="margin-top:6px" data-a="ixundo">Son aktarımı geri al</button></div>` : ''}`);
  }
  const P = sh._p; const fields = IX_F[MXI.type]; const R = ixBuild(MXI.type, MXI.map, P); const nm = fields.filter((f) => MXI.map[f[0]] != null).length;
  const miss = fields.filter((f) => f[3] === 1 && MXI.map[f[0]] == null && !(MXI.type === 'defter' && f[0] === 'total' && (MXI.map.gelir != null || MXI.map.gider != null)));
  const opt = (cur) => `<option value="">— yok —</option>${P.heads.map((h, i) => `<option value="${i}" ${cur === i ? 'selected' : ''}>${esc(h.slice(0, 30))}</option>`).join('')}`;
  const sel = (f) => `<div class="row" style="gap:8px;align-items:center;padding:4px 0"><span class="small" style="flex:0 0 42%">${f[1]}${f[3] === 1 && !(MXI.type === 'defter' && f[0] === 'total' && (MXI.map.gelir != null || MXI.map.gider != null)) ? ' *' : ''}</span><select data-ixm="${f[0]}" style="${mxInp};padding:9px 10px;flex:1">${opt(MXI.map[f[0]])}</select></div>`;
  const pv = R.out.slice(0, 5).map((o) => MXI.type === 'defter' ? `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span style="min-width:0">${mxDmy(o.iso)} · ${esc(o.desc)}</span><b class="num" style="color:${o.dir === 'gelir' ? '#15803d' : '#b42318'}">${o.dir === 'gelir' ? '+' : '−'}${fmt0(o.total)}</b></div>` : MXI.type === 'fatura' ? `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span style="min-width:0">${esc(o.cust)} · vade ${mxDmy(o.due)}</span><b class="num">${fmt0(o.tot)} ${o.st === 'odendi' ? '✓' : ''}</b></div>` : `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span style="min-width:0">${esc(o.who)} · vade ${mxDmy(o.due)}</span><b class="num">${fmt0(o.amt)} ${o.paid ? '✓' : ''}</b></div>`).join('');
  return sheet('Excel aktar', `<div class="callout">${ic('sparkle')}<div><b>Kais ${nm} alanı otomatik eşledi</b><p style="margin-top:2px">${esc(MXI.fn || 'Yapıştırılan tablo')} · ${P.data.length} satır. Yanlış eşleşme varsa aşağıdan düzelt.</p></div></div>
  ${MXI.sheets.length > 1 ? `<div class="field" style="margin:10px 0 0"><label for="ix-s">Sayfa</label><select id="ix-s" style="${mxInp}">${MXI.sheets.map((s, i) => `<option value="${i}" ${i === MXI.si ? 'selected' : ''}>${esc(s.name)} (${s.rows.length})</option>`).join('')}</select></div>` : ''}
  <div class="field" style="margin:10px 0 0"><label for="ix-t">Bu sayfa ne içeriyor?</label><select id="ix-t" style="${mxInp}">${Object.keys(IX_T).map((k) => `<option value="${k}" ${k === MXI.type ? 'selected' : ''}>${IX_T[k]}</option>`).join('')}</select></div>
  <div class="card" style="margin-top:10px;padding:8px 12px">${fields.map(sel).join('')}</div>
  ${MXI.type === 'defter' ? `<div class="row" style="gap:8px;margin-top:8px"><div class="field" style="margin:0;flex:1"><label for="ix-d">Tür belli değilse</label><select id="ix-d" style="${mxInp}"><option value="gider" ${MXI.defDir === 'gider' ? 'selected' : ''}>Gider say</option><option value="gelir" ${MXI.defDir === 'gelir' ? 'selected' : ''}>Gelir say</option></select></div><div class="field" style="margin:0;flex:1"><label for="ix-r">KDV belli değilse</label><select id="ix-r" style="${mxInp}">${[0, 1, 10, 20].map((x) => `<option ${x === MXI.defRate ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>` : ''}
  <h3 style="margin-top:14px">Önizleme</h3><div class="row wrap" style="gap:6px;margin-bottom:4px"><span class="pill p-ok">${R.out.length} aktarılacak</span>${R.dup ? `<span class="pill p-info">${R.dup} zaten var</span>` : ''}${R.bad ? `<span class="pill p-warn">${R.bad} eksik satır</span>` : ''}</div>${pv || '<p class="muted small">Eşleşen satır yok. Sütunları kontrol et.</p>'}
  ${miss.length ? `<div class="callout warn" style="margin-top:8px">${ic('alert')}<div><p>Şu alanı seçmen gerekiyor: ${miss.map((f) => f[1]).join(', ')}</p></div></div>` : ''}
  <div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn grow" data-a="iximport" ${R.out.length && !miss.length ? '' : 'disabled'}>${R.out.length} kaydı aktar</button><button class="btn sec" data-a="ixreset">Vazgeç</button></div>`);
};
H.mximp = () => { MXI.step = 'pick'; MXI.sheets = []; MXI.err = ''; MXI.done = null; MXI.fn = ''; S.modal = { type: 'mximp' }; renderModal(); };
H.ixreset = () => { MXI.step = 'pick'; MXI.sheets = []; MXI.err = ''; renderModal(); };
H.ixclose = () => { S.modal = null; render(); };
function ixLoadSheets(sheets, fn) {
  sheets = sheets.map((s) => ({ name: s.name, rows: s.rows.slice(0, 5000) })).filter((s) => s.rows.length > 1);
  if (!sheets.length) { MXI.step = 'pick'; MXI.err = 'Dosyada okunabilir satır bulamadım.'; renderModal(); return; }
  MXI.sheets = sheets; MXI.fn = fn; MXI.err = ''; MXI.step = 'map'; ixSetSheet(0); renderModal();
}
H.ixpaste = () => { const t = ($('#ix-txt') || {}).value || ''; if (t.trim().length < 5) return toast('Tabloyu yapıştır.', 'warn'); ixLoadSheets([{ name: 'Yapıştırılan', rows: mxCsv(t) }], ''); };
document.addEventListener('change', async (e) => {
  const t = e.target; if (!t || !S.modal || S.modal.type !== 'mximp') return;
  if (t.id === 'ix-file' && t.files && t.files[0]) {
    const f = t.files[0]; MXI.step = 'busy'; renderModal();
    try {
      if (/\.xlsx$/i.test(f.name)) {
        const X = await xlLoad(); const wb = new X.Workbook(); await wb.xlsx.load(await f.arrayBuffer()); const sheets = [];
        wb.worksheets.forEach((ws) => { const rows = []; ws.eachRow({ includeEmpty: false }, (r) => { const a = []; r.eachCell({ includeEmpty: true }, (c, i) => { let v = c.value; if (v && typeof v === 'object') { if (v instanceof Date) v = v.toISOString().slice(0, 10); else if (v.result !== undefined) v = v.result instanceof Date ? v.result.toISOString().slice(0, 10) : v.result; else if (v.richText) v = v.richText.map((x) => x.text).join(''); else if (v.text) v = v.text; else v = ''; } a[i - 1] = v == null ? '' : v; }); for (let i = 0; i < a.length; i++) if (a[i] === undefined) a[i] = ''; rows.push(a); }); sheets.push({ name: ws.name, rows }); });
        ixLoadSheets(sheets, f.name);
      } else if (/\.xls$/i.test(f.name)) { MXI.step = 'pick'; MXI.err = 'Eski .xls dosyası okunamıyor. Excel\'de "Farklı kaydet" ile .xlsx yapıp yükle.'; renderModal(); }
      else { ixLoadSheets([{ name: f.name, rows: mxCsv(await f.text()) }], f.name); }
    } catch (x) { MXI.step = 'pick'; MXI.err = 'Dosya okunamadı. İnternet bağlantını kontrol et ya da CSV olarak kaydedip dene.'; renderModal(); }
    return;
  }
  if (MXI.step !== 'map') return;
  if (t.id === 'ix-s') { ixSetSheet(+t.value); renderModal(); }
  else if (t.id === 'ix-t') { MXI.type = t.value; MXI.map = ixAuto(MXI.type, ixCur()._p); renderModal(); }
  else if (t.id === 'ix-d') { MXI.defDir = t.value; renderModal(); }
  else if (t.id === 'ix-r') { MXI.defRate = +t.value; renderModal(); }
  else if (t.dataset && t.dataset.ixm) { if (t.value === '') delete MXI.map[t.dataset.ixm]; else MXI.map[t.dataset.ixm] = +t.value; renderModal(); }
});
H.iximport = () => {
  if (mxRestricted()) return toast('Şube kısıtlı hesapta bu işlem kapalı.', 'warn'); if (locked()) return; const sh = ixCur(); if (!sh) return;
  const R = ixBuild(MXI.type, MXI.map, sh._p); if (!R.out.length) return; const b = 'x' + Date.now().toString(36); let paid = 0;
  R.out.forEach((o) => {
    if (MXI.type === 'defter') LEDGER.push({ id: 'g' + ++seq, date: mxDM(o.iso), iso: o.iso, desc: o.desc, acc: o.acc, doc: o.doc, rate: o.rate, total: o.total, dir: o.dir, src: 'Excel', ixk: o.key, xb: b });
    else if (MXI.type === 'fatura') { INV.push({ id: 'iv' + ++seq, no: o.no || 'X-' + seq, date: mxDM(o.iso), iso: o.iso, cust: o.cust, tot: o.tot, due: o.due, st: o.st, lines: [], xb: b }); if (o.st === 'odendi') paid++; }
    else { DEBTS.push({ id: 'd' + ++seq, who: o.who, note: o.note, amt: o.amt, due: o.due, rem: 3, on: true, paid: o.paid, xb: b }); if (o.paid) paid++; }
  });
  if (!S.settings) S.settings = {}; S.settings.xlast = { b, n: R.out.length, t: fiIso() }; try { pSched(); } catch (e) {}
  const lab = { defter: 'hareket tabloya', fatura: 'fatura Faturalar ve tahsilata', borc: 'borç Borçlar ekranına' }[MXI.type];
  MXI.done = { n: R.out.length, dup: R.dup, bad: R.bad, txt: R.out.length + ' ' + lab + ' işlendi' + (paid ? ', ' + paid + ' tanesi ödenmiş olarak.' : '.') }; MXI.step = 'done'; render(); S.modal = { type: 'mximp' }; renderModal();
};
H.ixundo = () => {
  const xl = S.settings && S.settings.xlast; if (!xl) return; if (mxRestricted()) return toast('Şube kısıtlı hesapta bu işlem kapalı.', 'warn'); if (locked()) return;
  const rm = (a) => { for (let i = a.length - 1; i >= 0; i--) if (a[i].xb === xl.b) a.splice(i, 1); }; rm(LEDGER); rm(INV); rm(DEBTS); delete S.settings.xlast; try { pSched(); } catch (e) {}
  MXI.step = 'pick'; MXI.done = null; toast('Son aktarım geri alındı.', 'ok'); render(); S.modal = { type: 'mximp' }; renderModal();
};

/* v152: hoş geldin turu ve kurulum sihirbazına "Excel'den aktar" adımı */
{
  const pi = TOUR.patron.findIndex((x) => x.v === 'muhasebe'); TOUR.patron.splice(pi >= 0 ? pi + 1 : 1, 0, { ico: 'file', t: 'Excel\'ini taşı', s: 'Şimdiye kadar Excel\'de tuttuğun kayıtları yükle. Kais sütunları kendisi tanır, sen onaylarsın. Akıllı muhasebe kartında.', v: 'muhasebe' });
  TOUR.muhasebeci.push({ ico: 'file', t: 'Müşterinin Excel\'ini aktar', s: 'Müşterin eski takip dosyasını getirdiyse Excel\'den aktar ile hareket, fatura ve borçları tek seferde yükle.', v: 'borc' });
  const _s = suSteps; suSteps = function () {
    const a = _s.apply(this, arguments); const st = S.settings || {}; const done = !!(st.xlast || st.ximpSkip || LEDGER.some((r) => r.src === 'Excel') || INV.some((v) => v.xb));
    a.splice(1, 0, { k: 'imp', ico: 'file', t: 'Excel\'indeki kayıtları taşı', s: 'Eski takip dosyanı yükle, Kais sütunları tanıyıp doldursun. Excel\'in yoksa atla.', done, a: 'ximpgo' });
    return a;
  };
  H.ximpgo = () => { S.modal = null; S.view = S.user && S.user.role === 'muhasebeci' ? 'borc' : 'muhasebe'; render(); H.mximp(); };
  H.ximpskip = () => { if (!S.settings) S.settings = {}; S.settings.ximpSkip = true; try { pSched(); } catch (e) {} S.modal = null; render(); };
  const _n = NEWM.mximp; NEWM.mximp = function () { const h = _n.apply(this, arguments); const st = S.settings || {}; if (MXI.step !== 'pick' || st.ximpSkip || st.xlast) return h; return h.replace(/(<p class="small muted" style="margin-top:10px">Gelir gider hareketleri[\s\S]*?<\/p>)/, '$1<button class="btn sec block" style="margin-top:10px" data-a="ximpskip">Excel\'im yok, bu adımı atla</button>'); };
}

/* =====================================================================
   v153: Excel aktarımı "tahmin etmeden": kaynak veriyi olduğu gibi taşır, belirsiz her şeyi sorar,
   KDV/tutar/tarih/durum mantığını doğrular, toplamları dosyayla karşılaştırır, atlananları nedeniyle listeler.
   ===================================================================== */
{
  const F = IX_F;
  F.defter.unshift(['kdvamt', 'KDV tutarı', /kdv.*(tutar|miktar|bedel)|hesaplanan|kdv\s*\(?tl/, 0], ['matrah', 'Matrah (KDV hariç)', /matrah|kdv\s*(hariç|haric|siz)|net\s*tutar|^net$/, 0], ['cur', 'Para birimi', /para\s*birim|döviz|doviz|^pb$|currency/, 0], ['br', 'Şube', /şube|sube|lokasyon|mağaza|magaza/, 0]);
  F.defter.forEach((f) => { if (f[0] === 'date') f[2] = /^(?!.*(vade|son\s*öde)).*(tarih|date|^gün$)/; if (f[0] === 'doc') f[2] = /belge\s*t[üu]r|fatura\s*t[üu]r|^belge$|^belge\s*cinsi/; });
  F.fatura.unshift(['kdvamt', 'KDV tutarı', /kdv.*(tutar|miktar|bedel)|hesaplanan/, 0], ['matrah', 'Matrah (KDV hariç)', /matrah|kdv\s*(hariç|haric|siz)|net\s*tutar|^net$|ara\s*toplam/, 0], ['vkn', 'Vergi / TC no', /vkn|tckn|vergi\s*(no|numar|kimlik)|^tc/, 0], ['eposta', 'E-posta', /e-?\s?posta|mail/, 0], ['tel', 'Telefon', /tel|gsm|cep/, 0], ['adr', 'Adres', /adres/, 0], ['cur', 'Para birimi', /para\s*birim|döviz|doviz|^pb$|currency/, 0], ['rate', 'KDV oranı', /kdv\s*(oran|%)|^kdv$|oran/, 0], ['desc', 'Açıklama / kalem', /açıklama|aciklama|ürün|urun|hizmet|detay/, 0]);
  F.fatura.forEach((f) => { if (f[0] === 'date') f[2] = /^(?!.*(vade|son\s*öde)).*(tarih|date)/; });
}
function ixDate(v, fmt) {
  if (v == null || v === '') return null; if (typeof v === 'number') { if (v > 30000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10); return null; }
  const s = ixTxt(v); const m0 = s.match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]{3,})\.?\s+(\d{4})/); if (m0) { const mo = IX_MON[m0[2].toLocaleLowerCase('tr').slice(0, 3)]; if (mo) return m0[3] + '-' + String(mo).padStart(2, '0') + '-' + m0[1].padStart(2, '0'); }
  const m = s.match(/^(\d{1,2})([./-])(\d{1,2})\2(\d{2,4})/); if (m) { let a = +m[1], b = +m[3], y = +m[4]; if (y < 100) y += 2000; if (fmt === 'mdy' && m[2] !== '.') { const t = a; a = b; b = t; } if (b > 12 || a > 31 || a < 1 || b < 1) return null; return y + '-' + String(b).padStart(2, '0') + '-' + String(a).padStart(2, '0'); }
  return mxDate(s);
}
function ixDfmt(P, idx) {
  if (idx == null) return { fmt: 'dmy', amb: false }; let dm = false, md = false, amb = false;
  P.data.forEach((r) => { const m = ixTxt(r[idx]).match(/^(\d{1,2})([./-])(\d{1,2})\2(\d{2,4})/); if (!m) return; const a = +m[1], b = +m[3]; if (m[2] === '.') { dm = true; return; } if (a > 12) dm = true; else if (b > 12) md = true; else amb = true; });
  if (md && !dm) return { fmt: 'mdy', amb: false }; if (dm) return { fmt: 'dmy', amb: false }; return { fmt: 'dmy', amb };
}
const IX_RATES = [0, 1, 8, 10, 18, 20];
const ixRateOf = (v) => { if (v == null || v === '') return null; let n = typeof v === 'number' ? v : ixN(String(v).replace('%', '')); if (n === null) return null; if (n > 0 && n < 1) n = Math.round(n * 100); return n; };
const ixSumRow = (r) => r.some((c) => { const t = ixNorm(c); return t && ixN(c) === null && /^(genel\s*)?(ara\s*)?toplam\b|^total\b|^devir\b|^aktarma\b/.test(t); });
const ixSnap = (x) => (x >= 0 ? IX_RATES.find((k) => Math.abs(k - x) <= 0.6) : undefined);
const ixStOf = (t) => { t = ixNorm(t); if (!t) return null; if (/ödenmedi|odenmedi|bekl|açık|acik|hayır|hayir|tahsil edilmedi|vadesi|kısmi|kismi/.test(t)) return 'bekliyor'; if (/öden|oden|tahsil|kapa|evet|paid|✓|^x$/.test(t)) return 'odendi'; return null; };
function ixBuild(type, map, P) {
  const D = MXI.dec || {}; const dec = { dfmt: D.dfmt, dir: D.dir, rate: D.rate == null || D.rate === '' ? null : D.rate === 'skip' ? 'skip' : Number(D.rate), incl: D.incl == null || D.incl === '' ? null : D.incl === 'yes', st: D.st };
  const out = [], skip = [], warn = [], need = {}, pend = { dir: 0, rate: 0, incl: 0, st: 0 }; let dup = 0; const sumRows = [];
  const g = (r, k) => (map[k] != null && map[k] >= 0 ? r[map[k]] : undefined); const today = fiIso();
  const d1 = ixDfmt(P, map.date), d2 = ixDfmt(P, map.due); const fmt = dec.dfmt || (d1.fmt === 'mdy' || d2.fmt === 'mdy' ? 'mdy' : 'dmy');
  if ((d1.amb || d2.amb) && !dec.dfmt) { need.dfmt = true; return { out, skip, warn, need, pend, dup, rec: null, extra: [], blocked: true }; }
  const used = new Set(Object.values(map)); const extraI = P.heads.map((h, i) => i).filter((i) => !used.has(i)); const extra = extraI.map((i) => P.heads[i]);
  const amtKeys = type === 'defter' ? ['gelir', 'gider', 'total', 'matrah'] : type === 'fatura' ? ['tot', 'matrah'] : ['amt']; const colSum = {}; const hasM = map.matrah != null, hasK = map.kdvamt != null;
  const tcol = [map.total, map.tot, map.amt, map.gelir, map.gider].find((x) => x != null); const hint = tcol != null ? ixNorm(P.heads[tcol]) : '';
  const hintIn = /dahil|genel|ödenecek|odenecek|brüt|brut/.test(hint), hintEx = /hariç|haric|net|matrah|kdvsiz/.test(hint);
  P.data.forEach((r) => {
    const n = r.__n; if (ixSumRow(r)) { skip.push({ n, why: 'Toplam satırı (aktarılmaz)', sum: true }); sumRows.push(r); return; }
    amtKeys.forEach((k) => { const v = ixN(g(r, k)); if (v !== null && v !== undefined) colSum[k] = (colSum[k] || 0) + v; });
    const ex = {}; extraI.slice(0, 12).forEach((i) => { const v = ixTxt(r[i]); if (v) ex[ixTxt(P.heads[i]).slice(0, 30)] = v.slice(0, 80); });
    const cur = ixTxt(g(r, 'cur')).toUpperCase(); if (cur && !/^(TL|TRY|₺|TÜRK)/.test(cur)) { skip.push({ n, why: 'Para birimi ' + cur + ' (TL değil)' }); return; }
    if (type === 'defter') {
      const iso = ixDate(g(r, 'date'), fmt); if (!iso) { skip.push({ n, why: 'Tarih okunamadı' }); return; }
      let tv = null, dir = null; const a = ixN(g(r, 'gelir')), b = ixN(g(r, 'gider')); const mv = ixN(g(r, 'matrah')), kv = ixN(g(r, 'kdvamt'));
      if (map.gelir != null || map.gider != null) { if (a > 0) { tv = a; dir = 'gelir'; } else if (b > 0) { tv = b; dir = 'gider'; } else if (a < 0 || b < 0) { skip.push({ n, why: 'Negatif tutar (iade/ters kayıt)' }); return; } }
      else { const t = ixN(g(r, 'total')); if (t) tv = t; const dt = ixNorm(g(r, 'dir')); if (/gelir|satış|satis|tahsilat|giren|alacak/.test(dt)) dir = 'gelir'; else if (/gider|alış|alis|ödeme|odeme|çıkan|cikan|borç|borc/.test(dt)) dir = 'gider'; }
      if (tv == null && mv) tv = mv + (kv || 0); if (!tv) { skip.push({ n, why: 'Tutar yok' }); return; }
      if (dir == null) { if (dec.dir == null) { pend.dir++; need.dir = true; return; } if (dec.dir === 'skip') { skip.push({ n, why: 'Tür belirsiz (atlandı)' }); return; } dir = dec.dir === 'sign' ? (tv < 0 ? 'gider' : 'gelir') : dec.dir; }
      tv = Math.abs(tv); let rate = ixRateOf(g(r, 'rate')); if (rate != null && !IX_RATES.includes(rate)) rate = null;
      if (rate == null && mv && kv != null) { const s = ixSnap(Math.abs(kv) / Math.abs(mv) * 100); if (s != null) rate = s; }
      if (rate == null) { if (dec.rate == null) { pend.rate++; need.rate = true; return; } if (dec.rate === 'skip') { skip.push({ n, why: 'KDV oranı belirsiz (atlandı)' }); return; } rate = dec.rate; }
      let total = tv;
      if (mv && kv != null && !(map.total != null && ixN(g(r, 'total')))) total = Math.abs(mv) + Math.abs(kv);
      else if (mv && (map.total != null && ixN(g(r, 'total')))) { const T = Math.abs(ixN(g(r, 'total'))); if (kv != null) { if (Math.abs(T - (Math.abs(mv) + Math.abs(kv))) < 0.05) total = T; else if (Math.abs(T - Math.abs(mv)) < 0.05) total = Math.abs(mv) + Math.abs(kv); else { skip.push({ n, why: 'Tutar, matrah + KDV ile tutmuyor' }); return; } } else total = Math.abs(T - Math.abs(mv)) < 0.05 ? Math.round(Math.abs(mv) * (1 + rate / 100) * 100) / 100 : T; }
      else if (rate > 0 && !hasM && !hasK) { let inc = hintIn ? true : hintEx ? false : dec.incl; if (inc == null) { pend.incl++; need.incl = true; return; } if (inc === false) total = Math.round(tv * (1 + rate / 100) * 100) / 100; }
      const desc = ixTxt(g(r, 'desc')) || ixTxt(g(r, 'acc')); if (!desc) warn.push({ n, why: 'Açıklama yok' });
      let br = ''; const bt = ixTxt(g(r, 'br')); if (bt) { const B = BRANCHES.find((x) => mxKey(x.name) === mxKey(bt)); if (B) br = B.id; else { warn.push({ n, why: 'Şube "' + bt + '" tanımlı değil' }); ex['Şube'] = bt; } }
      const key = iso + '|' + total.toFixed(2) + '|' + desc.slice(0, 20); if (LEDGER.some((x) => x.ixk === key)) { dup++; return; }
      out.push({ n, iso, desc: (desc || '(açıklamasız)').slice(0, 80), total: Math.round(total * 100) / 100, dir, rate, acc: ixTxt(g(r, 'acc')) || (dir === 'gelir' ? INCATS[2] : 'Diğer'), doc: ixTxt(g(r, 'doc')).slice(0, 20) || '—', key, ex, br });
    } else if (type === 'fatura') {
      const cust = ixTxt(g(r, 'cust')); if (!cust) { skip.push({ n, why: 'Müşteri adı yok' }); return; }
      const mv = ixN(g(r, 'matrah')), kv = ixN(g(r, 'kdvamt')); let tot = ixN(g(r, 'tot')); let rate = ixRateOf(g(r, 'rate')); if (rate != null && !IX_RATES.includes(rate)) rate = null;
      if (rate == null && mv && kv != null) { const s = ixSnap(Math.abs(kv) / Math.abs(mv) * 100); if (s != null) rate = s; }
      if (!tot && mv) { if (kv != null) tot = mv + kv; else if (rate != null) tot = Math.round(mv * (1 + rate / 100) * 100) / 100; else { skip.push({ n, why: 'KDV bilgisi yok, toplam hesaplanamadı' }); return; } }
      if (!tot) { skip.push({ n, why: 'Tutar yok' }); return; } if (tot < 0) { skip.push({ n, why: 'Negatif tutar (iade/ters kayıt)' }); return; }
      if (mv && kv != null && Math.abs(tot - (mv + kv)) > 0.05 && Math.abs(tot - mv) > 0.05) { skip.push({ n, why: 'Tutar, matrah + KDV ile tutmuyor' }); return; }
      if (mv && Math.abs(tot - mv) <= 0.05 && kv == null && rate != null) tot = Math.round(mv * (1 + rate / 100) * 100) / 100;
      const iso = ixDate(g(r, 'date'), fmt) || ''; if (!iso) warn.push({ n, why: 'Fatura tarihi yok' }); const due = ixDate(g(r, 'due'), fmt) || ''; if (!due) warn.push({ n, why: 'Vade yok' });
      let st = map.st != null ? ixStOf(g(r, 'st')) : null; if (/kısmi|kismi/.test(ixNorm(g(r, 'st')))) warn.push({ n, why: 'Kısmi ödeme: kalan tutarı elle düzelt' });
      if (!st) { if (dec.st == null) { pend.st++; need.st = true; return; } if (dec.st === 'skip') { skip.push({ n, why: 'Ödeme durumu belirsiz (atlandı)' }); return; } st = dec.st; }
      const no = ixTxt(g(r, 'no')); if (no ? INV.some((v) => v.no === no && mxKey(v.cust) === mxKey(cust)) : INV.some((v) => mxKey(v.cust) === mxKey(cust) && Math.abs(mxN(v.tot) - tot) < 0.01 && v.iso === iso)) { dup++; return; }
      let net = mv ? Math.abs(mv) : (rate != null && !hasM ? Math.round(tot / (1 + rate / 100) * 100) / 100 : null); if (mv && rate == null && kv != null) net = Math.abs(mv);
      if (MXI.toLedger) { if (rate == null) { if (dec.rate == null) { pend.rate++; need.rate = true; return; } if (dec.rate === 'skip') { skip.push({ n, why: 'KDV oranı belirsiz (atlandı)' }); return; } rate = dec.rate; } }
      out.push({ n, iso, cust: cust.slice(0, 60), tot: Math.round(tot * 100) / 100, due, st, no, net, rate, vkn: ixTxt(g(r, 'vkn')), eposta: ixTxt(g(r, 'eposta')), tel: ixTxt(g(r, 'tel')), adr: ixTxt(g(r, 'adr')), desc: ixTxt(g(r, 'desc')), ex });
    } else {
      const who = ixTxt(g(r, 'who')); if (!who) { skip.push({ n, why: 'Tedarikçi adı yok' }); return; } const amt = ixN(g(r, 'amt')); if (!amt) { skip.push({ n, why: 'Tutar yok' }); return; } if (amt < 0) { skip.push({ n, why: 'Negatif tutar (iade/ters kayıt)' }); return; }
      let st = map.st != null ? ixStOf(g(r, 'st')) : null; if (!st) { if (dec.st == null) { pend.st++; need.st = true; return; } if (dec.st === 'skip') { skip.push({ n, why: 'Ödeme durumu belirsiz (atlandı)' }); return; } st = dec.st; }
      const due = ixDate(g(r, 'due'), fmt) || ''; if (!due) warn.push({ n, why: 'Vade yok' });
      if (DEBTS.some((d) => mxKey(d.who) === mxKey(who) && Math.abs(mxN(d.amt) - amt) < 0.01 && d.due === due)) { dup++; return; }
      out.push({ n, who: who.slice(0, 60), note: ixTxt(g(r, 'note')).slice(0, 60) || '', amt: Math.round(amt * 100) / 100, due, paid: st === 'odendi', ex });
    }
  });
  let rec = null; if (sumRows.length) { const sums = Object.keys(colSum).map((k) => colSum[k]); const nums = [].concat(...sumRows.map((r) => r.map((c) => ixN(c)).filter((x) => x !== null && x !== 0))); const hit = nums.find((x) => sums.some((s) => Math.abs(Math.abs(s) - Math.abs(x)) < 0.05)); rec = hit != null ? { ok: true, txt: 'Dosyadaki toplam satırı (' + fmt0(hit) + ') ile satırların toplamı tutuyor.' } : { ok: false, txt: 'Dosyadaki toplam satırı ' + nums.slice(0, 3).map(fmt0).join(' / ') + ' diyor, satırların toplamı ' + sums.slice(0, 3).map((x) => fmt0(x)).join(' / ') + '. Dosyada gizli ya da filtrelenmiş satır olabilir.' }; }
  return { out, skip, warn, need, pend, dup, rec, extra };
}
function ixSetSheet(i) { MXI.si = i; MXI.dec = {}; const sh = ixCur(); if (!sh) return; MXI.type = ixDetect(sh); MXI.map = ixAuto(MXI.type, sh._p); ixFixRate(); }
function ixFixRate() { const sh = ixCur(); if (!sh || MXI.map.rate == null) return; const i = MXI.map.rate; const vals = sh._p.data.slice(0, 60).map((r) => r[i]).filter((x) => ixTxt(x)); if (!vals.length) return; const ok = vals.filter((x) => { const r = ixRateOf(x); return r != null && IX_RATES.includes(r); }).length / vals.length; if (ok < 0.7 && !('kdvamt' in MXI.map) && IX_F[MXI.type].some((f) => f[0] === 'kdvamt')) { MXI.map.kdvamt = i; delete MXI.map.rate; } }
{
  const _wrap = ixAuto; ixAuto = function (type, P) { const m = _wrap.apply(this, arguments); if (m.rate != null) { const vals = P.data.slice(0, 60).map((r) => r[m.rate]).filter((x) => ixTxt(x)); if (vals.length) { const ok = vals.filter((x) => { const r = ixRateOf(x); return r != null && IX_RATES.includes(r); }).length / vals.length; if (ok < 0.7 && IX_F[type].some((f) => f[0] === 'kdvamt') && m.kdvamt == null) { m.kdvamt = m.rate; delete m.rate; } } } return m; };
}
{
  const _ld = ixLoadSheets; ixLoadSheets = function (sheets, fn) { sheets.forEach((s) => s.rows.forEach((r, i) => { if (r.__n == null) r.__n = i + 1; })); return _ld.call(this, sheets, fn); };
  MXI.dec = {}; MXI.toLedger = false;
  const _old = NEWM.mximp;
  const dsel = (k, lab, opts, cur, cnt, why) => `<div class="card" style="padding:10px 12px;margin-top:8px;border-color:#E0A526"><div class="small"><b style="font-weight:600">${lab}</b>${cnt ? ' · ' + cnt + ' satır bekliyor' : ''}</div><div class="small muted" style="margin:2px 0 6px">${why}</div><select data-ixd="${k}" style="${mxInp};padding:10px">${[['', 'Seç…']].concat(opts).map((o) => `<option value="${o[0]}" ${String(cur == null ? '' : cur) === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
  NEWM.mximp = function () {
    const sh = MXI.step === 'map' ? ixCur() : null; if (!sh) return _old.apply(this, arguments);
    const P = sh._p; const fields = IX_F[MXI.type]; const R = ixBuild(MXI.type, MXI.map, P); const nm = fields.filter((f) => MXI.map[f[0]] != null).length; const D = MXI.dec;
    const miss = fields.filter((f) => f[3] === 1 && MXI.map[f[0]] == null && !(MXI.type === 'defter' && f[0] === 'total' && (MXI.map.gelir != null || MXI.map.gider != null || MXI.map.matrah != null)));
    const opt = (cur) => `<option value="">— yok —</option>${P.heads.map((h, i) => `<option value="${i}" ${cur === i ? 'selected' : ''}>${esc(h.slice(0, 30))}</option>`).join('')}`;
    const sel = (f) => `<div class="row" style="gap:8px;align-items:center;padding:4px 0"><span class="small" style="flex:0 0 42%">${f[1]}${f[3] === 1 && !(MXI.type === 'defter' && f[0] === 'total' && (MXI.map.gelir != null || MXI.map.gider != null || MXI.map.matrah != null)) ? ' *' : ''}</span><select data-ixm="${f[0]}" style="${mxInp};padding:9px 10px;flex:1">${opt(MXI.map[f[0]])}</select></div>`;
    let dq = ''; const nd = R.need;
    if (nd.dfmt) dq += dsel('dfmt', 'Tarih biçimi', [['dmy', 'Gün/Ay/Yıl (16/11/2026)'], ['mdy', 'Ay/Gün/Yıl (11/16/2026)']], D.dfmt, 0, 'Tarihlerin hepsi 12 ve altında, hangisi gün hangisi ay belli değil.');
    if (nd.dir) dq += dsel('dir', 'Gelir mi gider mi?', [['sign', 'Artı tutar gelir, eksi tutar gider'], ['gider', 'Hepsi gider'], ['gelir', 'Hepsi gelir'], ['skip', 'Bu satırları aktarma']], D.dir, R.pend.dir, 'Dosyada gelir/gider ayrımı yok. Tahmin etmiyorum, sen söyle.');
    if (nd.rate) dq += dsel('rate', 'KDV oranı', [['0', '%0'], ['1', '%1'], ['10', '%10'], ['20', '%20'], ['skip', 'Bu satırları aktarma']], D.rate, R.pend.rate, 'Dosyada KDV oranı yok.');
    if (nd.incl) dq += dsel('incl', 'Tutarlar KDV dahil mi?', [['yes', 'KDV dahil (ödenen toplam)'], ['no', 'KDV hariç (matrah)']], D.incl, R.pend.incl, 'Sütun adından anlaşılmıyor. Yanlış seçim KDV hesabını bozar.');
    if (nd.st) dq += dsel('st', 'Ödeme durumu', [['odendi', 'Hepsi ödenmiş (arşiv kaydı)'], ['bekliyor', 'Hepsi açık (tahsil edilecek / ödenecek)'], ['skip', 'Bu satırları aktarma']], D.st, R.pend.st, 'Durum sütunu yok ya da boş. Yanlış alacak oluşmasın diye soruyorum.');
    const sk = R.skip.filter((x) => !x.sum); const pv = R.out.slice(0, 5).map((o) => (MXI.type === 'defter' ? `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span style="min-width:0">${mxDmy(o.iso)} · ${esc(o.desc)} <span class="muted">· KDV %${o.rate}</span></span><b class="num" style="color:${o.dir === 'gelir' ? '#15803d' : '#b42318'}">${o.dir === 'gelir' ? '+' : '−'}${fmt0(o.total)}</b></div>` : MXI.type === 'fatura' ? `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span style="min-width:0">${esc(o.no || '—')} · ${esc(o.cust)} <span class="muted">· vade ${mxDmy(o.due)}</span></span><b class="num">${fmt0(o.tot)} ${o.st === 'odendi' ? '✓' : ''}</b></div>` : `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span style="min-width:0">${esc(o.who)} <span class="muted">· vade ${mxDmy(o.due)}</span></span><b class="num">${fmt0(o.amt)} ${o.paid ? '✓' : ''}</b></div>`)).join('');
    const pending = R.pend.dir + R.pend.rate + R.pend.incl + R.pend.st + (nd.dfmt ? 1 : 0); const tot = R.out.reduce((t, o) => t + (o.total || o.tot || o.amt || 0), 0);
    return sheet('Excel aktar', `<div class="callout">${ic('sparkle')}<div><b>Kais ${nm} alanı eşledi, tahmin yürütmüyor</b><p style="margin-top:2px">${esc(MXI.fn || 'Yapıştırılan tablo')} · ${P.data.length} satır. Kaynakta ne varsa o taşınır, belli olmayan her şeyi sana sorar.</p></div></div>
    ${MXI.sheets.length > 1 ? `<div class="field" style="margin:10px 0 0"><label for="ix-s">Sayfa</label><select id="ix-s" style="${mxInp}">${MXI.sheets.map((s, i) => `<option value="${i}" ${i === MXI.si ? 'selected' : ''}>${esc(s.name)} (${s.rows.length})</option>`).join('')}</select></div>` : ''}
    <div class="field" style="margin:10px 0 0"><label for="ix-t">Bu sayfa ne içeriyor?</label><select id="ix-t" style="${mxInp}">${Object.keys(IX_T).map((k) => `<option value="${k}" ${k === MXI.type ? 'selected' : ''}>${IX_T[k]}</option>`).join('')}</select></div>
    ${dq ? `<h3 style="margin-top:14px">Senin kararın gerekiyor</h3>${dq}` : ''}
    <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">Sütun eşlemesi (${nm}/${fields.length})</summary><div class="card" style="margin-top:8px;padding:8px 12px">${fields.map(sel).join('')}</div></details>
    ${MXI.type === 'fatura' ? `<label class="row" style="gap:10px;margin-top:10px;align-items:flex-start"><input id="ix-l" type="checkbox" ${MXI.toLedger ? 'checked' : ''} style="width:20px;height:20px;flex:none;margin-top:2px"><span class="small">Bu faturaları gelir olarak deftere de işle<br><span class="muted">Satışlarını gelir gider sayfasından da aktarıyorsan açma, ikiye katlanır.</span></span></label>` : ''}
    <h3 style="margin-top:14px">Kontrol</h3><div class="row wrap" style="gap:6px;margin-bottom:4px"><span class="pill p-ok">${R.out.length} aktarılacak${R.out.length ? ' · ' + fmt0(tot) : ''}</span>${R.dup ? `<span class="pill p-info">${R.dup} zaten var</span>` : ''}${sk.length ? `<span class="pill p-warn">${sk.length} atlanacak</span>` : ''}${pending ? `<span class="pill p-bad">${pending} karar bekliyor</span>` : ''}${R.warn.length ? `<span class="pill p-info">${R.warn.length} uyarı</span>` : ''}</div>
    ${R.rec ? `<div class="callout ${R.rec.ok ? '' : 'warn'}" style="margin-top:6px">${ic(R.rec.ok ? 'check' : 'alert')}<div><p>${esc(R.rec.txt)}</p></div></div>` : ''}
    ${sk.length ? `<details style="margin-top:8px"><summary style="cursor:pointer" class="small"><b>Atlanan satırlar ve nedenleri</b></summary>${sk.slice(0, 40).map((x) => `<div class="small" style="padding:4px 0;border-top:1px solid var(--line,#e5e8ee)">Satır ${x.n}: ${esc(x.why)}</div>`).join('')}${sk.length > 40 ? `<div class="small muted">… ve ${sk.length - 40} satır daha</div>` : ''}<button class="btn sm sec" style="margin-top:6px" data-a="ixskipcsv">Listeyi indir</button></details>` : ''}
    ${R.warn.length ? `<details style="margin-top:8px"><summary style="cursor:pointer" class="small"><b>Uyarılar (aktarılır, dikkat et)</b></summary>${R.warn.slice(0, 30).map((x) => `<div class="small" style="padding:4px 0;border-top:1px solid var(--line,#e5e8ee)">Satır ${x.n}: ${esc(x.why)}</div>`).join('')}</details>` : ''}
    ${R.extra.length ? `<p class="small muted" style="margin-top:8px">Eşlenmeyen sütunlar (${esc(R.extra.slice(0, 6).join(', '))}${R.extra.length > 6 ? '…' : ''}) kayıtla birlikte not olarak saklanır, hiçbir bilgi kaybolmaz.</p>` : ''}
    <h3 style="margin-top:12px">Önizleme</h3>${pv || '<p class="muted small">Henüz aktarılacak satır yok. Yukarıdaki kararları ver ya da sütunları kontrol et.</p>'}
    ${miss.length ? `<div class="callout warn" style="margin-top:8px">${ic('alert')}<div><p>Şu alanı seçmen gerekiyor: ${miss.map((f) => f[1]).join(', ')}</p></div></div>` : ''}
    <div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn grow" data-a="iximport" ${R.out.length && !miss.length && !nd.dfmt ? '' : 'disabled'}>${R.out.length} kaydı aktar${pending ? ' (' + pending + ' bekleyen hariç)' : ''}</button><button class="btn sec" data-a="ixreset">Vazgeç</button></div>`);
  };
  document.addEventListener('change', (e) => {
    const t = e.target; if (!t || !S.modal || S.modal.type !== 'mximp' || MXI.step !== 'map') return;
    if (t.dataset && t.dataset.ixd) { if (t.value === '') delete MXI.dec[t.dataset.ixd]; else MXI.dec[t.dataset.ixd] = t.value; renderModal(); }
    else if (t.id === 'ix-t') { MXI.dec = {}; renderModal(); }
    else if (t.id === 'ix-l') { MXI.toLedger = t.checked; renderModal(); }
  });
  H.ixskipcsv = () => { const sh = ixCur(); if (!sh) return; const R = ixBuild(MXI.type, MXI.map, sh._p); const NL = String.fromCharCode(10); const by = {}; sh._p.data.forEach((r) => { by[r.__n] = r; }); const q = (x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; const lines = [['Satır', 'Neden'].concat(sh._p.heads).map(q).join(';')].concat(R.skip.filter((x) => !x.sum).map((x) => [x.n, x.why].concat(by[x.n] || []).map(q).join(';'))); saveBlob('atlanan-satirlar.csv', new Blob(['﻿' + lines.join(NL)], { type: 'text/csv;charset=utf-8' })); };
  H.iximport = () => {
    if (mxRestricted()) return toast('Şube kısıtlı hesapta bu işlem kapalı.', 'warn'); if (locked()) return; const sh = ixCur(); if (!sh) return;
    const R = ixBuild(MXI.type, MXI.map, sh._p); if (!R.out.length || R.need.dfmt) return; const b = 'x' + Date.now().toString(36); let paid = 0, newC = 0; const sn = sh.name;
    R.out.forEach((o) => {
      const exs = o.ex && Object.keys(o.ex).length ? o.ex : undefined;
      if (MXI.type === 'defter') { const row = { id: 'g' + ++seq, date: mxDM(o.iso), iso: o.iso, desc: o.desc, acc: o.acc, doc: o.doc, rate: o.rate, total: o.total, dir: o.dir, src: 'Excel', ixk: o.key, xb: b, xr: o.n }; if (o.br) row.br = o.br; if (exs) row.ex = exs; LEDGER.push(row); }
      else if (MXI.type === 'fatura') {
        const lines = o.net != null && o.rate != null ? [{ d: o.desc || 'Aktarılan fatura', q: 1, p: o.net, r: o.rate }] : [];
        const v = { id: 'iv' + ++seq, no: o.no || '—', date: o.iso ? mxDM(o.iso) : '—', iso: o.iso, due: o.due, st: o.st, cust: o.cust, vkn: o.vkn, adr: o.adr, lines, tot: o.tot, by: S.user.id, imp: true, xb: b, xr: o.n }; if (o.net != null) v.net = o.net; if (o.st === 'odendi') { v.paidAt = ''; paid++; } if (exs) v.ex = exs; INV.push(v);
        let c = FCUST.find((x) => mxKey(x.name) === mxKey(o.cust)); if (!c) { c = { id: 'fc' + (++seq), name: o.cust, vkn: '', adr: '', eposta: '', xb: b }; FCUST.push(c); newC++; } if (o.vkn && !c.vkn) c.vkn = o.vkn; if (o.adr && !c.adr) c.adr = o.adr; if (o.eposta && !c.eposta) c.eposta = o.eposta; if (o.tel && !c.tel) c.tel = o.tel;
        if (MXI.toLedger) LEDGER.push({ id: 'g' + ++seq, date: v.date, iso: o.iso || fiIso(), desc: 'Fatura ' + v.no + ' · ' + o.cust, acc: INCATS[2], doc: 'Fatura', rate: o.rate, total: o.tot, dir: 'gelir', src: 'Excel', xb: b, xr: o.n });
      } else { const d = { id: 'd' + ++seq, who: o.who, note: o.note || 'Borç', amt: o.amt, due: o.due, rem: 3, on: !o.paid && !!o.due, paid: o.paid, xb: b, xr: o.n }; if (exs) d.ex = exs; DEBTS.push(d); if (o.paid) paid++; }
    });
    if (!S.settings) S.settings = {}; S.settings.xlast = { b, n: R.out.length, t: fiIso() }; (S.settings.xhist = S.settings.xhist || []).push(S.settings.xlast); if (S.settings.xhist.length > 10) S.settings.xhist.shift(); try { pSched(); } catch (e) {}
    const lab = { defter: 'hareket tabloya', fatura: 'fatura Faturalar ve tahsilata', borc: 'borç Borçlar ekranına' }[MXI.type];
    const pend = R.pend.dir + R.pend.rate + R.pend.incl + R.pend.st;
    MXI.done = { n: R.out.length, dup: R.dup, bad: R.skip.filter((x) => !x.sum).length + pend, txt: R.out.length + ' ' + lab + ' işlendi' + (paid ? ', ' + paid + ' tanesi ödenmiş olarak' : '') + (newC ? ', ' + newC + ' yeni müşteri kartı açıldı' : '') + '.' }; MXI.step = 'done'; render(); S.modal = { type: 'mximp' }; renderModal();
  };
  const _u = H.ixundo; H.ixundo = function () { const xl = S.settings && S.settings.xlast; if (xl) { for (let i = FCUST.length - 1; i >= 0; i--) if (FCUST[i].xb === xl.b) FCUST.splice(i, 1); } const r = _u.apply(this, arguments); if (xl) { const h = S.settings.xhist || []; h.pop(); if (h.length) { S.settings.xlast = h[h.length - 1]; try { pSched(); } catch (e) {} render(); if (S.modal && S.modal.type === 'mximp') renderModal(); } } return r; };
}

/* =====================================================================
   v154: KDV beyanname hazırlığı (oran bazlı matrah ve KDV, belgesiz gider uyarısı) + Excel çıktısı
   ===================================================================== */
const MXK = { ym: '' };
const mxYm = () => MXK.ym || fiIso().slice(0, 7);
function mxKdv(ym) {
  const rows = LEDGER.filter((r) => r.iso && r.iso.slice(0, 7) === ym); const G = {}, X = {}; let nodoc = 0, nodocAmt = 0, norate = 0, sor = 0, tvs = 0;
  rows.forEach((r) => {
    const P = mhKdvParts(r); const t = P.t, rt = mxN(r.rate), m = P.m; const gelir = dirOf(r) === 'gelir';
    if (!gelir && (!r.doc || r.doc === '—')) { nodoc++; nodocAmt += t; return; }
    /* tevkifat: satışta müşteri KDV'nin bir kısmını keser (bize hesaplanan olarak yazılmaz); alışta biz sorumlu sıfatıyla beyan ederiz */
    const k = gelir ? P.k - P.tv : P.k; if (gelir) tvs += P.tv; else sor += P.tv;
    const B = gelir ? G : X; const o = B[rt] || (B[rt] = { rate: rt, m: 0, k: 0, t: 0, n: 0 }); o.m += m; o.k += k; o.t += t; o.n++;
  });
  const sum = (B, f) => Object.values(B).reduce((a, o) => a + o[f], 0); const hes = sum(G, 'k') + sor, ind = sum(X, 'k');
  return { rows, G, X, hes: r2(hes), ind: r2(ind), net: r2(hes - ind), gm: r2(sum(G, 'm')), xm: r2(sum(X, 'm')), nodoc, nodocAmt: r2(nodocAmt), sor: r2(sor), tvs: r2(tvs) };
}
const mxKdvTbl = (B, title) => { const L = Object.values(B).sort((a, b) => a.rate - b.rate); return `<div class="card flush" style="margin-top:10px"><div class="row between" style="padding:12px 14px 6px"><h3>${title}</h3></div>${L.length ? L.map((o) => `<div class="row between" style="padding:9px 14px;gap:8px;border-top:1px solid var(--line,#e5e8ee)"><div><b style="font-weight:600">%${o.rate}</b><div class="small muted">${o.n} kayıt · matrah ${fmt0(o.m)}</div></div><b class="num">${fmt0(o.k)}</b></div>`).join('') : '<div class="empty">Kayıt yok.</div>'}</div>`; };
NEWM.mxkdv = () => {
  const ym = mxYm(); const K = mxKdv(ym); const inp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
  return sheet('KDV hazırlığı', `<div class="field" style="margin:0"><label for="mk-m">Dönem</label><input id="mk-m" type="month" value="${esc(ym)}" style="${inp}"></div>
  <div class="kpis" style="margin-top:10px"><div class="kpi"><div class="l">Hesaplanan</div><div class="v num">${fmt0(K.hes)}</div></div><div class="kpi"><div class="l">İndirilecek</div><div class="v num">${fmt0(K.ind)}</div></div><div class="kpi"><div class="l">${K.net >= 0 ? 'Ödenecek' : 'Devreden'}</div><div class="v num">${fmt0(Math.abs(K.net))}</div></div></div>
  ${K.sor || K.tvs ? `<div class="callout" style="margin-top:10px">${ic('alert')}<div><b>Tevkifat hesaba katıldı</b><p style="margin-top:2px">${K.tvs ? 'Satışlarda müşterinin kestiği ' + fmt0(K.tvs) + ' KDV hesaplanana yazılmadı. ' : ''}${K.sor ? 'Alışlarda sorumlu sıfatıyla ' + fmt0(K.sor) + ' KDV hesaplanana eklendi; aynı tutar indirilecekte de var.' : ''}</p></div></div>` : ''}
  ${K.nodoc ? `<div class="callout warn" style="margin-top:10px">${ic('alert')}<div><b>${K.nodoc} belgesiz gider hesaba katılmadı</b><p style="margin-top:2px">${fmt0(K.nodocAmt)} tutarındaki giderin belge türü yok. Fiş ya da fatura bilgisi girilirse indirilecek KDV'ye eklenir.</p></div></div>` : ''}
  ${!K.rows.length ? '<p class="muted small" style="margin-top:10px">Bu dönemde kayıt yok.</p>' : ''}${mxKdvTbl(K.G, 'Hesaplanan KDV (satışlar)')}${mxKdvTbl(K.X, 'İndirilecek KDV (alışlar, belgeli giderler)')}
  <button class="btn block" style="margin-top:12px" data-a="mxkdvxl" ${K.rows.length ? '' : 'disabled'}>Excel olarak indir</button><p class="small muted" style="margin-top:8px">Kayıtlardaki KDV oranı ve KDV dahil tutardan hesaplanır. Beyanname öncesi mali müşavirinle kontrol et.</p>`);
};
H.mxkdv = () => { S.modal = { type: 'mxkdv' }; renderModal(); };
document.addEventListener('change', (e) => { const t = e.target; if (t && t.id === 'mk-m' && /^\d{4}-\d{2}$/.test(t.value)) { MXK.ym = t.value; renderModal(); } });
H.mxkdvxl = async () => {
  const ym = mxYm(); const K = brScope(() => mxKdv(ym)); if (!K.rows.length) return;
  try {
    toast('Excel hazırlanıyor…'); const X = await xlLoad(); const wb = new X.Workbook(); const num = '#,##0.00';
    const ws = wb.addWorksheet('KDV Özeti'); ws.columns = [{ width: 28 }, { width: 8 }, { width: 10 }, { width: 16 }, { width: 16 }, { width: 16 }]; ws.addRow([BIZ + ' · KDV özeti · ' + ym]).font = { bold: true, size: 13 }; ws.addRow([]);
    const sec = (t, B) => { ws.addRow([t]).font = { bold: true }; const h = ws.addRow(['', 'KDV %', 'Kayıt', 'Matrah', 'KDV', 'Toplam']); h.font = { bold: true }; Object.values(B).sort((a, b) => a.rate - b.rate).forEach((o) => { const r = ws.addRow(['', o.rate, o.n, r2(o.m), r2(o.k), r2(o.t)]); [4, 5, 6].forEach((c) => { r.getCell(c).numFmt = num; }); }); ws.addRow([]); };
    sec('Hesaplanan KDV (satışlar)', K.G); sec('İndirilecek KDV (belgeli giderler)', K.X);
    [['Hesaplanan KDV' + (K.sor ? ' (sorumlu sıfatıyla ' + K.sor.toFixed(2) + ' dahil)' : ''), K.hes], ['İndirilecek KDV', K.ind], [K.net >= 0 ? 'Ödenecek KDV' : 'Devreden KDV', Math.abs(K.net)]].forEach((a) => { const r = ws.addRow([a[0], '', '', '', a[1]]); r.font = { bold: true }; r.getCell(5).numFmt = num; });
    if (K.nodoc) { ws.addRow([]); ws.addRow(['Belgesiz gider (hesaba katılmadı)', '', K.nodoc, '', '', K.nodocAmt]).getCell(6).numFmt = num; }
    ['Gelir', 'Gider'].forEach((T) => { const w = wb.addWorksheet(T); w.columns = [{ header: 'Tarih', width: 12 }, { header: 'Açıklama', width: 36 }, { header: 'Hesap', width: 18 }, { header: 'Belge', width: 12 }, { header: 'KDV %', width: 8 }, { header: 'Matrah', width: 14 }, { header: 'KDV', width: 14 }, { header: 'Toplam', width: 14 }]; w.getRow(1).font = { bold: true };
      K.rows.filter((r) => (dirOf(r) === 'gelir') === (T === 'Gelir')).sort((a, b) => (a.iso < b.iso ? -1 : 1)).forEach((r) => { const t = mxN(r.total), rt = mxN(r.rate), m = rt ? t / (1 + rt / 100) : t; const x = w.addRow([mxDmy(r.iso), r.desc || '', r.acc || '', r.doc || '', rt, r2(m), r2(t - m), r2(t)]); [6, 7, 8].forEach((c) => { x.getCell(c).numFmt = num; }); }); });
    const buf = await wb.xlsx.writeBuffer(); saveBlob('kdv-' + ym + '.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); toast('Excel indirildi.', 'ok');
  } catch (e) { toast('Excel hazırlanamadı. İnternet bağlantını kontrol et.', 'warn'); }
};

/* =====================================================================
   v155: aylık muhasebe paketi (tek Excel: özet, defter, faturalar, borçlar, KDV) + paylaşım
   ===================================================================== */
function mxPkData(ym) {
  const K = mxKdv(ym); const rows = K.rows.slice().sort((a, b) => (a.iso < b.iso ? -1 : 1)); const gel = rows.filter((r) => dirOf(r) === 'gelir').reduce((t, r) => t + mxN(r.total), 0), gid = rows.filter((r) => dirOf(r) !== 'gelir').reduce((t, r) => t + mxN(r.total), 0);
  const inv = INV.filter((v) => (v.iso && v.iso.slice(0, 7) === ym) || v.st !== 'odendi'); const openInv = INV.filter((v) => v.st !== 'odendi'); const late = INV.filter((v) => fiLate(v));
  const debts = allDebts().filter((d) => !d.paid); const pend = RECEIPTS.filter((f) => f.status === 'musavirde').length;
  return { K, rows, gel: r2(gel), gid: r2(gid), net: r2(gel - gid), inv, openInv, late, debts, pend, openAmt: r2(openInv.reduce((t, v) => t + ivOpen(v), 0)), lateAmt: r2(late.reduce((t, v) => t + ivOpen(v), 0)), debtAmt: r2(debts.reduce((t, d) => t + mxN(d.amt), 0)) };
}
function mxPkText(ym, D) {
  const NL = String.fromCharCode(10); return [BIZ + ' · ' + ym + ' dönemi muhasebe paketi', 'Gelir: ' + fmt0(D.gel), 'Gider: ' + fmt0(D.gid), 'Net: ' + fmt0(D.net), (D.K.net >= 0 ? 'Ödenecek KDV: ' : 'Devreden KDV: ') + fmt0(Math.abs(D.K.net)), 'Açık alacak: ' + fmt0(D.openAmt) + (D.late.length ? ' (' + D.late.length + ' fatura gecikmiş)' : ''), 'Ödenecek borç: ' + fmt0(D.debtAmt), D.K.nodoc ? D.K.nodoc + ' belgesiz gider var (' + fmt0(D.K.nodocAmt) + ')' : '', D.pend ? D.pend + ' belge onay bekliyor' : '', 'Detaylar ekteki Excel dosyasında.'].filter(Boolean).join(NL);
}
async function mxPkBuild(ym, D) {
  const X = await xlLoad(); const wb = new X.Workbook(); const num = '#,##0.00'; const hd = (ws) => { ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; };
  const o = wb.addWorksheet('Özet'); o.columns = [{ width: 34 }, { width: 18 }]; o.addRow([BIZ + ' · ' + ym]).font = { bold: true, size: 14 }; o.addRow(['Hazırlanma tarihi', mxDmy(fiIso())]); o.addRow([]);
  [['Gelir toplamı', D.gel], ['Gider toplamı', D.gid], ['Net', D.net], ['Hesaplanan KDV', D.K.hes], ['İndirilecek KDV', D.K.ind], [D.K.net >= 0 ? 'Ödenecek KDV' : 'Devreden KDV', Math.abs(D.K.net)], ['Belgesiz gider (KDV hesabına girmedi)', D.K.nodocAmt], ['Açık alacak', D.openAmt], ['Vadesi geçmiş alacak', D.lateAmt], ['Ödenecek borç', D.debtAmt]].forEach((a) => { const r = o.addRow(a); r.getCell(2).numFmt = num; }); o.addRow(['Onay bekleyen belge', D.pend]);
  const d = wb.addWorksheet('Defter'); d.columns = [{ header: 'Tarih', width: 12 }, { header: 'Tür', width: 8 }, { header: 'Açıklama', width: 36 }, { header: 'Hesap', width: 18 }, { header: 'Belge', width: 12 }, { header: 'KDV %', width: 8 }, { header: 'Matrah', width: 14 }, { header: 'KDV', width: 14 }, { header: 'Toplam', width: 14 }, { header: 'Şube', width: 14 }, { header: 'Kaynak', width: 12 }]; hd(d);
  D.rows.forEach((r) => { const t = mxN(r.total), rt = mxN(r.rate), m = rt ? t / (1 + rt / 100) : t; const b = (BRANCHES.find((x) => x.id === r.br) || {}).name || ''; const x = d.addRow([mxDmy(r.iso), dirOf(r) === 'gelir' ? 'Gelir' : 'Gider', r.desc || '', r.acc || '', r.doc || '', rt, r2(m), r2(t - m), r2(t), b, r.src || '']); [7, 8, 9].forEach((c) => { x.getCell(c).numFmt = num; }); });
  const f = wb.addWorksheet('Faturalar'); f.columns = [{ header: 'Fatura no', width: 14 }, { header: 'Tarih', width: 12 }, { header: 'Müşteri', width: 30 }, { header: 'Tutar', width: 14 }, { header: 'Vade', width: 12 }, { header: 'Durum', width: 16 }]; hd(f);
  D.inv.forEach((v) => { const x = f.addRow([v.no, mxDmy(v.iso), v.cust, mxN(v.tot), mxDmy(v.due), v.st === 'odendi' ? 'Ödendi' : fiLate(v) ? 'Vadesi geçti' : 'Açık']); x.getCell(4).numFmt = num; });
  const b = wb.addWorksheet('Borçlar'); b.columns = [{ header: 'Kime', width: 28 }, { header: 'Açıklama', width: 30 }, { header: 'Tutar', width: 14 }, { header: 'Vade', width: 12 }]; hd(b);
  D.debts.forEach((x) => { const r = b.addRow([x.who, x.note || '', mxN(x.amt), mxDmy(x.due)]); r.getCell(3).numFmt = num; });
  const k = wb.addWorksheet('KDV'); k.columns = [{ width: 26 }, { width: 8 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 14 }];
  [['Hesaplanan KDV (satışlar)', D.K.G], ['İndirilecek KDV (belgeli giderler)', D.K.X]].forEach((a) => { k.addRow([a[0]]).font = { bold: true }; k.addRow(['', 'KDV %', 'Kayıt', 'Matrah', 'KDV', 'Toplam']).font = { bold: true }; Object.values(a[1]).sort((p, q) => p.rate - q.rate).forEach((s) => { const r = k.addRow(['', s.rate, s.n, r2(s.m), r2(s.k), r2(s.t)]); [4, 5, 6].forEach((c) => { r.getCell(c).numFmt = num; }); }); k.addRow([]); });
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
NEWM.mxpaket = () => {
  const ym = mxYm(); const D = mxPkData(ym); const inp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
  const row = (l, v, w) => `<div class="row between" style="padding:9px 14px;border-top:1px solid var(--line,#e5e8ee)"><span>${l}</span><b class="num"${w ? ' style="color:#b42318"' : ''}>${v}</b></div>`;
  return sheet('Excel dönem dosyası', `<p class="muted small">Muhasebecine göndereceğin dönem dosyası tek Excel dosyasında: özet, defter, faturalar, borçlar ve KDV.</p><div class="field" style="margin:8px 0 0"><label for="mk-m">Dönem</label><input id="mk-m" type="month" value="${esc(ym)}" style="${inp}"></div>
  <div class="card flush" style="margin-top:10px">${row('Gelir', fmt0(D.gel))}${row('Gider', fmt0(D.gid))}${row('Net', fmt0(D.net))}${row(D.K.net >= 0 ? 'Ödenecek KDV' : 'Devreden KDV', fmt0(Math.abs(D.K.net)))}${row('Açık alacak', fmt0(D.openAmt))}${row('Ödenecek borç', fmt0(D.debtAmt))}${D.late.length ? row('Vadesi geçmiş fatura', D.late.length + ' · ' + fmt0(D.lateAmt), 1) : ''}${D.K.nodoc ? row('Belgesiz gider', D.K.nodoc + ' · ' + fmt0(D.K.nodocAmt), 1) : ''}${D.pend ? row('Onay bekleyen belge', String(D.pend), 1) : ''}</div>
  ${D.K.nodoc || D.pend || D.late.length ? `<div class="callout warn" style="margin-top:10px">${ic('alert')}<div><p>Pakette eksikler var. Göndermeden önce Ay sonu kontrolünden bakabilirsin.</p></div></div>` : ''}
  <div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn grow" data-a="mxpkshare">Paketi paylaş</button><button class="btn sec" data-a="mxpkdl">Excel indir</button></div><p class="small muted" style="margin-top:8px">Paylaş, telefonunda WhatsApp ya da e-posta seçeneklerini açar. Desteklenmiyorsa dosya iner ve özet mesaj hazırlanır.</p>`);
};
H.mxpaket = () => { S.modal = { type: 'mxpaket' }; renderModal(); };
H.mxpkdl = async () => { const ym = mxYm(); try { toast('Paket hazırlanıyor…'); const D = brScope(() => mxPkData(ym)); const blob = await mxPkBuild(ym, D); saveBlob('muhasebe-paketi-' + ym + '.xlsx', blob); toast('Paket indirildi.', 'ok'); } catch (e) { toast('Paket hazırlanamadı. İnternet bağlantını kontrol et.', 'warn'); } };
H.mxpkshare = async () => {
  const ym = mxYm(); try {
    toast('Paket hazırlanıyor…'); const D = brScope(() => mxPkData(ym)); const blob = await mxPkBuild(ym, D); const name = 'muhasebe-paketi-' + ym + '.xlsx'; const text = brScope(() => mxPkText(ym, D));
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: BIZ + ' ' + ym, text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    saveBlob(name, blob); toast('Dosya indirildi. Mesajına ekleyip gönder.', 'ok'); window.open(waLink('', text), '_blank', 'noopener');
  } catch (e) { toast('Paket hazırlanamadı. İnternet bağlantını kontrol et.', 'warn'); }
};

/* v156: Şube yetkisi sunucuda (supabase/sql/branch_scope.sql). Patron kuralı br_set ile yazar, açılışta br_list ile okur. */
async function brSync(au) {
  try {
    const c = sbClient(); if (!c || !SBS.biz || !CL.on) return;
    const e = (S.settings.brs || {})[au] || null; const r = await c.rpc('br_set', { bid: SBS.biz.id, au, rule: e });
    if (r.error && !/function|schema cache|does not exist/i.test(String(r.error.message || ''))) toast('Şube yetkisi sunucuya yazılamadı. Tekrar dene.', 'bad');
  } catch (x) {}
}
{ const _bp = H.brperm; H.brperm = function (el) { const au = el && el.dataset && el.dataset.u; const r = _bp.apply(this, arguments); if (au) brSync(au); return r; }; }
{ const _ca = cloudAttach; cloudAttach = async function () {
  const r = await _ca.apply(this, arguments);
  try {
    if (CL.on && roleOf() === 'patron') { const l = await sbClient().rpc('br_list', { bid: SBS.biz.id }); if (!l.error && l.data && typeof l.data === 'object') { S.settings.brs = l.data; render(); } }
  } catch (x) {}
  return r;
}; }

/* ===== v157: kısmi tahsilat ve ödeme, çoklu ödeme eşleştirme ===== */
const ivR = (n) => Math.round(n * 100) / 100;
function ivPaidAmt(v) { if (v.st === 'odendi') return mxN(v.tot); return Math.min(mxN(v.tot), ivR((v.pays || []).reduce((t, p) => t + mxN(p.amt), 0))); }
function ivOpen(v) { return v.st === 'odendi' ? 0 : Math.max(0, ivR(mxN(v.tot) - ivPaidAmt(v))); }
function ivPay(v, amt, iso, src, note) {
  const a = Math.min(ivR(mxN(amt)), ivOpen(v)); if (!(a > 0)) return 0;
  (v.pays || (v.pays = [])).push({ id: 'p' + ++seq, iso: iso || fiIso(), amt: a, src: src || 'Elle', note: String(note || '').slice(0, 80) });
  if (ivOpen(v) <= 0.005) { v.st = 'odendi'; v.paidAt = iso || fiIso(); } return a;
}
function dbPaidAmt(d) { return ivR((d.pays || []).reduce((t, p) => t + mxN(p.amt), 0)); }
function dbRem(d) {
  if (d.auto || !(d.pays && d.pays.length)) return d; const rest = Math.max(0, ivR(mxN(d.amt) - dbPaidAmt(d)));
  if (rest <= 0.005) return Object.assign({}, d, { paid: true });
  return Object.assign({}, d, { orig: d.amt, amt: rest, note: String(d.note || '') + ' · ' + fmt0(dbPaidAmt(d)) + ' ödendi' });
}
const dbOpen = (d) => (d.paid ? 0 : dbRem(d).amt);
function dbPay(d, amt, iso, note) {
  const a = Math.min(ivR(mxN(amt)), dbOpen(d)); if (!(a > 0)) return 0;
  (d.pays || (d.pays = [])).push({ id: 'p' + ++seq, iso: iso || fiIso(), amt: a, note: String(note || '').slice(0, 80) });
  if (dbOpen(d) <= 0.005) { d.paid = true; d.paidAt = iso || fiIso(); } return a;
}
const mxOptK = (k) => k === 'led' || k === 'invpart' || k === 'invmulti';
const ivInp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
const ivNum = (n) => String(ivR(n)).replace('.', ',');

/* fatura ayrıntısı: ödeme geçmişi + kısmi tahsilat */
{ const _fo = NEWM.fatura_ok; NEWM.fatura_ok = function (m) {
  const h = _fo.apply(this, arguments); const v = INV.find((x) => x.id === m.id); if (!v) return h;
  const pays = v.pays || [];
  const hist = pays.length ? `<div class="card" style="padding:12px;margin-top:10px"><div class="row between"><b>Tahsilatlar</b><span class="small muted">Kalan ${fmt(ivOpen(v))}</span></div>${pays.map((p) => `<div class="row between small" style="gap:8px;padding:6px 0;border-top:1px solid var(--line,#e5e8ee)"><span>${esc(mxDmy(p.iso))}${p.src ? ' · ' + esc(p.src) : ''}${p.note ? ' · ' + esc(p.note) : ''}</span><b class="num">${fmt(p.amt)}</b></div>`).join('')}</div>` : '';
  const btn = v.st !== 'odendi' ? `<button class="btn sec block" style="margin-top:8px" data-a="ivpart" data-id="${v.id}">Kısmi tahsilat ekle</button>` : '';
  return h.replace(/(<button class="btn block[^"]*" style="margin-top:8px" data-a="fipaid")/, hist + btn + '$1');
}; }
NEWM.ivpay = (m) => {
  const v = INV.find((x) => x.id === m.id); if (!v) return sheet('Tahsilat', '<p>Fatura bulunamadı.</p>');
  return sheet('Kısmi tahsilat · ' + esc(v.no), `<p class="muted small">${esc(v.cust)} · toplam ${fmt(v.tot)} · tahsil edilen ${fmt(ivPaidAmt(v))} · kalan <b>${fmt(ivOpen(v))}</b></p>
  <div class="field"><label for="iv-amt">Tutar</label><input id="iv-amt" inputmode="decimal" style="${ivInp}" value="${ivNum(ivOpen(v))}"></div>
  <div class="field"><label for="iv-date">Tarih</label><input id="iv-date" type="date" value="${fiIso()}" style="${ivInp}"></div>
  <div class="field"><label for="iv-note">Not (isteğe bağlı)</label><input id="iv-note" style="${ivInp}" placeholder="Havale, nakit, çek"></div>
  <div class="err" id="iv-err" role="alert"></div><button class="btn block" data-a="ivpaysave" data-id="${v.id}">Kaydet</button>`);
};
H.ivpart = (el) => { S.modal = { type: 'ivpay', id: el.dataset.id }; renderModal(); };
H.ivpaysave = (el) => {
  if (locked()) return; const v = INV.find((x) => x.id === el.dataset.id); if (!v) return; const e = $('#iv-err');
  const amt = trNum($('#iv-amt').value), iso = $('#iv-date').value || fiIso();
  if (!(amt > 0)) { if (e) e.textContent = 'Tutarı yaz.'; return; }
  if (amt > ivOpen(v) + 0.005) { if (e) e.textContent = 'Tutar kalandan fazla (' + fmt(ivOpen(v)) + '). Fazlayı "Ödeme dağıt" ile başka faturaya yazabilirsin.'; return; }
  ivPay(v, amt, iso, 'Elle', $('#iv-note').value); try { pSched(); } catch (x) {}
  S.modal = { type: 'fatura_ok', id: v.id }; render(); toast(ivOpen(v) <= 0 ? 'Fatura tamamen tahsil edildi.' : fmt(amt) + ' tahsil edildi, kalan ' + fmt(ivOpen(v)) + '.', 'ok');
};
/* tam tahsilat da geçmişe yazılsın; geri alınca ödemeler temizlensin */
H.fipaid = (el) => {
  const v = INV.find((x) => x.id === el.dataset.id); if (!v) return;
  if (v.st === 'odendi') { v.st = 'bekliyor'; v.paidAt = ''; v.pays = []; }
  else { const iso = fiIso(); ivPay(v, ivOpen(v), iso, 'Elle', ''); v.st = 'odendi'; v.paidAt = iso; }
  try { pSched(); } catch (e) {} toast(v.st === 'odendi' ? 'Tahsil edildi olarak işaretlendi.' : 'Tekrar bekliyor yapıldı.', 'ok'); renderModal(); render();
};

/* borç: Ödendi → tutar sor (kısmi ödeme) */
{ const _dp = H.debtpaid; H.debtpaid = function (el) { const d = DEBTS.find((x) => x.id === el.dataset.id); if (!d || d.auto) return _dp.apply(this, arguments); S.modal = { type: 'dbpay', id: d.id }; renderModal(); }; }
NEWM.dbpay = (m) => {
  const d = DEBTS.find((x) => x.id === m.id); if (!d) return sheet('Ödeme', '<p>Borç bulunamadı.</p>'); const rest = dbOpen(d); const pays = d.pays || [];
  return sheet('Ödeme · ' + esc(d.who), `<p class="muted small">${esc(String(d.note || ''))} · toplam ${fmt(d.amt)} · ödenen ${fmt(dbPaidAmt(d))} · kalan <b>${fmt(rest)}</b></p>
  <div class="field"><label for="db-amt">Ödenen tutar</label><input id="db-amt" inputmode="decimal" style="${ivInp}" value="${ivNum(rest)}"></div>
  <div class="field"><label for="db-date">Tarih</label><input id="db-date" type="date" value="${fiIso()}" style="${ivInp}"></div>
  <p class="small muted" style="margin:4px 0 8px">Tutarı azaltırsan kısmi ödeme olarak kaydedilir, borç kalan tutarla açık kalır.</p>
  ${pays.length ? `<div class="card" style="padding:10px;margin-bottom:10px">${pays.map((p) => `<div class="row between small" style="padding:4px 0"><span>${esc(mxDmy(p.iso))}</span><b class="num">${fmt(p.amt)}</b></div>`).join('')}</div>` : ''}
  <div class="err" id="db-err2" role="alert"></div><button class="btn block" data-a="dbpaysave" data-id="${d.id}">Ödendi olarak kaydet</button>`);
};
H.dbpaysave = (el) => {
  if (locked()) return; const d = DEBTS.find((x) => x.id === el.dataset.id); if (!d) return; const e = $('#db-err2'); const amt = trNum($('#db-amt').value), iso = $('#db-date').value || fiIso();
  if (!(amt > 0)) { if (e) e.textContent = 'Tutarı yaz.'; return; } if (amt > dbOpen(d) + 0.005) { if (e) e.textContent = 'Tutar kalandan fazla (' + fmt(dbOpen(d)) + ').'; return; }
  dbPay(d, amt, iso, ''); try { pSched(); } catch (x) {} S.modal = null; render(); toast(d.paid ? 'Borç tamamen ödendi.' : fmt(amt) + ' ödendi, kalan ' + fmt(dbOpen(d)) + '.', 'ok');
};

/* çoklu ödeme: bir ödemeyi müşterinin birden çok faturasına dağıt */
const IVD = { key: '', amt: '', date: '', al: {}, manual: false };
function ivdCusts() { const m = {}; INV.filter((v) => v.st !== 'odendi' && ivOpen(v) > 0).forEach((v) => { const k = mxKey(v.cust); (m[k] || (m[k] = { key: k, name: v.cust || '—', inv: [] })).inv.push(v); }); return Object.values(m).sort((a, b) => (a.name < b.name ? -1 : 1)); }
function ivdInvs() { const g = ivdCusts().find((x) => x.key === IVD.key); return g ? g.inv.slice().sort((a, b) => ((a.due || a.iso || '') < (b.due || b.iso || '') ? -1 : 1)) : []; }
function ivdAuto() { let left = ivR(trNum(IVD.amt) || 0); IVD.al = {}; ivdInvs().forEach((v) => { const x = Math.min(left, ivOpen(v)); if (x > 0.004) { IVD.al[v.id] = ivR(x); left = ivR(left - x); } }); IVD.manual = false; }
NEWM.ivdagit = () => {
  const cs = ivdCusts(); if (!cs.length) return sheet('Ödeme dağıt', '<p class="muted">Açık fatura yok.</p>');
  const invs = ivdInvs(); const amt = trNum(IVD.amt) || 0; const used = ivR(invs.reduce((t, v) => t + (IVD.al[v.id] || 0), 0)); const left = ivR(amt - used);
  const rows = invs.map((v) => `<div class="row between" style="gap:8px;padding:8px 0;border-top:1px solid var(--line,#e5e8ee);align-items:center"><div class="grow" style="min-width:0"><b>${esc(v.no)}</b><div class="small muted">vade ${esc(mxDmy(v.due))} · kalan ${fmt(ivOpen(v))}</div></div><input data-ivd="a:${v.id}" inputmode="decimal" style="${ivInp};width:110px;padding:8px 10px" value="${IVD.al[v.id] != null ? ivNum(IVD.al[v.id]) : ''}" placeholder="0" aria-label="${esc(v.no)} tutarı"></div>`).join('');
  return sheet('Ödeme dağıt', `<p class="muted small">Müşteriden gelen tek ödemeyi, en eski vadeden başlayarak faturalara dağıtır. Tutarları istediğin gibi değiştirebilirsin.</p>
  <div class="field"><label for="ivd-c">Müşteri</label><select id="ivd-c" data-ivd="cust" style="${ivInp}"><option value="">Seç</option>${cs.map((g) => `<option value="${esc(g.key)}" ${g.key === IVD.key ? 'selected' : ''}>${esc(g.name)} · ${fmt0(g.inv.reduce((t, v) => t + ivOpen(v), 0))}</option>`).join('')}</select></div>
  <div class="row" style="gap:8px"><div class="field grow" style="margin:0"><label for="ivd-a">Gelen tutar</label><input id="ivd-a" data-ivd="amt" inputmode="decimal" style="${ivInp}" value="${esc(IVD.amt)}" placeholder="0,00"></div><div class="field grow" style="margin:0"><label for="ivd-d">Tarih</label><input id="ivd-d" data-ivd="date" type="date" style="${ivInp}" value="${esc(IVD.date || fiIso())}"></div></div>
  ${IVD.key ? `<div style="margin-top:10px">${rows}</div><div class="card" style="padding:12px;margin-top:10px"><div class="row between"><span class="muted small">Dağıtılan</span><b>${fmt(used)}</b></div><div class="row between"><span class="muted small">Dağıtılmayan</span><b style="${left < -0.005 ? 'color:#E5484D' : ''}">${fmt(left)}</b></div></div>
  ${left > 0.005 ? '<p class="small muted" style="margin-top:6px">Dağıtılmayan tutar kayda alınmaz. Fazla ödeme (avans) için ayrıca not al.</p>' : ''}${left < -0.005 ? '<p class="small" style="margin-top:6px;color:#E5484D">Faturalara yazılan toplam, gelen tutardan fazla.</p>' : ''}
  <div class="err" id="ivd-err" role="alert"></div><button class="btn block" style="margin-top:8px" data-a="ivdsave" ${used > 0.004 && left > -0.005 ? '' : 'disabled'}>Faturalara işle</button>` : ''}`);
};
H.ivdagit = () => { IVD.key = ''; IVD.amt = ''; IVD.date = ''; IVD.al = {}; IVD.manual = false; S.modal = { type: 'ivdagit' }; renderModal(); };
document.addEventListener('change', (e) => {
  const t = e.target; if (!t || !t.dataset || t.dataset.ivd == null || !S.modal || S.modal.type !== 'ivdagit') return; const k = t.dataset.ivd;
  if (k === 'cust') { IVD.key = t.value; ivdAuto(); } else if (k === 'amt') { IVD.amt = t.value; ivdAuto(); } else if (k === 'date') IVD.date = t.value;
  else if (k.indexOf('a:') === 0) { const n = trNum(t.value); const id = k.slice(2); if (n > 0) IVD.al[id] = ivR(n); else delete IVD.al[id]; IVD.manual = true; }
  renderModal();
});
H.ivdsave = () => {
  if (locked()) return; const invs = ivdInvs(); const amt = trNum(IVD.amt) || 0; const iso = IVD.date || fiIso(); let used = 0, n = 0;
  invs.forEach((v) => { const a = IVD.al[v.id] || 0; if (a > ivOpen(v) + 0.005) used = NaN; else used += a; }); if (!(used >= 0) || used > amt + 0.005) return toast('Tutarları kontrol et.', 'warn');
  invs.forEach((v) => { const a = IVD.al[v.id] || 0; if (a > 0 && ivPay(v, a, iso, 'Elle', 'Toplu tahsilat')) n++; });
  try { pSched(); } catch (x) {} S.modal = null; render(); toast(n + ' faturaya ' + fmt(used) + ' işlendi.', 'ok');
};

/* banka ekstresi: tek ödeme birden çok faturaya ya da kısmi tahsilata denk gelirse öner (varsayılan kapalı) */
mxKind.invmulti = ['Birden çok fatura', 'p-info']; mxKind.invpart = ['Kısmi tahsilat', 'p-warn'];
{ const _mm = mxMatch; mxMatch = function (txs) {
  const res = _mm.apply(this, arguments); const claimed = new Set(res.filter((r) => r.kind === 'inv' && r.ref).map((r) => r.ref.id));
  res.forEach((r) => {
    if (r.kind !== 'new' || !(r.t.amt > 0)) return; const a = Math.abs(r.t.amt); const w = mxWords(r.t.desc); if (!w.length) return;
    const score = (name) => mxWords(name).filter((x) => w.some((y) => y.includes(x) || x.includes(y))).length;
    const by = {}; INV.filter((v) => v.st !== 'odendi' && ivOpen(v) > 0 && !claimed.has(v.id)).forEach((v) => { const k = mxKey(v.cust); (by[k] = by[k] || []).push(v); });
    let best = null, bs = 0, tie = false; Object.keys(by).forEach((k) => { const s = score(by[k][0].cust); if (s > bs) { best = by[k]; bs = s; tie = false; } else if (s === bs && s > 0) tie = true; });
    if (!best || tie || bs < 1) return; best.sort((x, y) => ((x.due || '') < (y.due || '') ? -1 : 1));
    const tot = ivR(best.reduce((t, v) => t + ivOpen(v), 0)); const n = Math.min(best.length, 12); let hit = null;
    const rec = (i, left, pick) => { if (hit) return; if (Math.abs(left) < 0.015 && pick.length) { hit = pick.slice(); return; } if (i >= n || pick.length >= 4 || left < -0.015) return; pick.push(best[i]); rec(i + 1, left - ivOpen(best[i]), pick); pick.pop(); rec(i + 1, left, pick); };
    rec(0, a, []);
    if (hit && hit.length > 1) { r.kind = 'invmulti'; r.alloc = hit.map((v) => ({ v, amt: ivOpen(v) })); hit.forEach((v) => claimed.add(v.id)); return; }
    if (a < tot - 0.015) { let left = a; const al = []; best.forEach((v) => { if (left <= 0.005) return; const x = Math.min(left, ivOpen(v)); al.push({ v, amt: ivR(x) }); left = ivR(left - x); }); r.kind = 'invpart'; r.alloc = al; al.forEach((x) => claimed.add(x.v.id)); }
  });
  return res;
}; }

/* borç/alacak ekstre kapsamı: kısmi tutarlar */
{ const _cr = mxCariRows; mxCariRows = function (kind, name) {
  const k = mxKey(name); const rows = _cr.apply(this, arguments);
  if (kind === 'musteri') return rows.map((r) => { const v = INV.find((x) => x.no === r.no && mxKey(x.cust) === k); return v && r.open && ivPaidAmt(v) > 0 ? Object.assign({}, r, { tot: ivOpen(v), note: 'Kısmi tahsilat (fatura ' + fmt0(v.tot) + ')' }) : r; });
  return rows.map((r) => { const d = DEBTS.find((x) => mxKey(x.who) === k && (x.note || 'Borç') === r.no); return d && r.open && dbPaidAmt(d) > 0 ? Object.assign({}, r, { tot: dbOpen(d), note: 'Kısmi ödeme' }) : r; });
}; }

/* ===== v158: çevrimdışı yazma kuyruğu + 3 yollu birleştirme =====
   - Her bulut yazımından önce yerel durum cihazda (IndexedDB) saklanır; yazım başarılı olunca silinir.
   - Başka cihaz aynı bölümü değiştirmişse (sürüm çakışması / yoklama) ezmek yerine, son eşitlenen duruma göre 3 yollu birleştirilir.
   - Uygulama yeniden açılınca bekleyen yerel değişiklikler buluttaki güncel veriyle birleştirilip gönderilir. */
const kqS = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, key) => { o[key] = v[key]; return o; }, {}) : v));
const kqEq = (a, b) => kqS(a) === kqS(b);
const kqObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const kqIdArr = (a) => Array.isArray(a) && a.every((x) => kqObj(x) && x.id != null);
function kqMerge(b, l, r, st) {
  if (kqEq(l, b)) return r; if (kqEq(r, b)) return l; if (kqEq(l, r)) return l;
  if (kqObj(l) && kqObj(r) && (kqObj(b) || b === undefined)) {
    const bb = b || {}; const o = {}; const keys = new Set(Object.keys(l).concat(Object.keys(r), Object.keys(bb)));
    keys.forEach((k) => {
      const inL = k in l, inR = k in r, inB = k in bb;
      if (inL && inR) { o[k] = (k === 'seq' && typeof l[k] === 'number' && typeof r[k] === 'number') ? Math.max(l[k], r[k]) : kqMerge(bb[k], l[k], r[k], st); }
      else if (inL) { if (!inB) o[k] = l[k]; else if (!kqEq(l[k], bb[k])) { o[k] = l[k]; st.n++; } }
      else if (inR) { if (!inB) o[k] = r[k]; else if (!kqEq(r[k], bb[k])) { o[k] = r[k]; st.n++; } }
    });
    return o;
  }
  if (kqIdArr(l) && kqIdArr(r) && (b === undefined || kqIdArr(b))) {
    const bm = new Map((b || []).map((x) => [x.id, x])), lm = new Map(l.map((x) => [x.id, x])), rm = new Map(r.map((x) => [x.id, x])); const out = [];
    r.forEach((ri) => {
      const li = lm.get(ri.id), bi = bm.get(ri.id);
      if (!li) { if (bi && kqEq(ri, bi)) return; if (bi) st.n++; out.push(ri); return; }
      out.push(kqMerge(bi, li, ri, st));
    });
    l.forEach((li) => { if (rm.has(li.id)) return; const bi = bm.get(li.id); if (bi && kqEq(li, bi)) return; if (bi) st.n++; out.push(li); });
    return out;
  }
  st.n++; return l;
}
function kqScopeApply(o) { try { pApply(JSON.stringify(o)); } catch (e) {} }

/* cihaz deposu */
let KQDB = null;
function kqOpen() { if (KQDB) return KQDB; KQDB = new Promise((res) => { try { const q = indexedDB.open('kaispilot', 1); q.onupgradeneeded = () => { q.result.createObjectStore('q'); }; q.onsuccess = () => res(q.result); q.onerror = () => res(null); q.onblocked = () => res(null); } catch (e) { res(null); } }); return KQDB; }
async function kqIdb(mode, fn) { const db = await kqOpen(); if (!db) return null; return new Promise((res) => { try { const tx = db.transaction('q', mode); const r = fn(tx.objectStore('q')); tx.oncomplete = () => res(mode === 'readonly' ? (r && r.result !== undefined ? r.result : null) : true); tx.onerror = () => res(null); tx.onabort = () => res(null); } catch (e) { res(null); } }); }
const kqGet = (k) => kqIdb('readonly', (s) => s.get(k));
const kqSet = (k, v) => kqIdb('readwrite', (s) => s.put(v, k));
const kqDel = (k) => kqIdb('readwrite', (s) => s.delete(k));
const kqKey = () => 'q:' + ((SBS.user && SBS.user.id) || '') + ':' + ((SBS.biz && SBS.biz.id) || '');
const kqOn = () => !!(CL.on && SBS.biz && SBS.user && !CL.rule && typeof indexedDB !== 'undefined');
function kqCur() { const sp = splitSnap(pSnap()); const cur = {}; Object.keys(sp).forEach((sc) => { if (canW(sc)) cur[sc] = JSON.stringify(sp[sc]); }); return cur; }
async function kqPersist() { if (!kqOn()) return; try { await kqSet(kqKey(), { v: 1, at: Date.now(), base: Object.assign({}, CL.base), cur: kqCur() }); PS.queued = true; } catch (e) {} }

CL.base = CL.base || {}; CL.pend = CL.pend || {};
/* bulut yazımı: önce cihaza yaz (write-ahead), başarılıysa sil */
{ const _cs = cloudSet; cloudSet = async function (d) {
  if (kqOn()) await kqPersist();
  const before = Object.assign({}, CL.sent);
  await _cs.apply(this, arguments);
  Object.keys(CL.sent).forEach((sc) => { if (CL.sent[sc] !== before[sc] && CL.sent[sc] !== '__dirty__') CL.base[sc] = CL.sent[sc]; });
  try { if (kqOn() && !clDirty() && !Object.keys(CL.pend).length) { await kqDel(kqKey()); PS.queued = false; } } catch (e) {}
}; }

/* uzaktan gelen bölümleri yerel değişikliklerle birleştirip uygula (açık pencere yoksa) */
function kqApplyPend() {
  if (!CL.on || CL.rule || S.modal || PS.busy) return false; const scs = Object.keys(CL.pend); if (!scs.length) return false;
  const loc = splitSnap(pSnap()); let conf = 0, dirty = false;
  scs.forEach((sc) => {
    const P = CL.pend[sc]; let remote; try { remote = JSON.parse(P.state); } catch (e) { return; }
    const local = loc[sc]; let merged = remote;
    if (local && canW(sc)) { const base = CL.base[sc] ? JSON.parse(CL.base[sc]) : undefined; const st = { n: 0 }; merged = base === undefined ? kqMerge({}, local, remote, st) : kqMerge(base, local, remote, st); conf += st.n; }
    kqScopeApply(merged); CL.base[sc] = P.state; CL.vers[sc] = P.version;
    const same = kqEq(merged, remote); if (same) { const sp2 = splitSnap(pSnap()); CL.sent[sc] = JSON.stringify(sp2[sc]); } else { CL.sent[sc] = '__dirty__'; dirty = true; }
  });
  CL.pend = {}; CL.at = clTime(); PS.last = pSnap(); if (conf) toast('Başka cihazdaki değişikliklerle birleştirildi. ' + conf + ' çakışmada senin değişikliğin korundu.', 'warn');
  if (dirty) setTimeout(() => { try { pSched(); } catch (e) {} }, 50); return true;
}
{ const _r = render; render = function () { const r = _r.apply(this, arguments); try { if (Object.keys(CL.pend).length && kqApplyPend()) { _r.apply(this, arguments); } } catch (e) {} return r; }; }

/* çakışma: ezme, birleştir */
{ const _cc = cloudConflict; cloudConflict = async function (sc) {
  if (CL.rule) return _cc.apply(this, arguments);
  const c = sbClient(); const r = await c.from('app_state').select('scope,state,version').eq('business_id', SBS.biz.id).eq('scope', sc).limit(1);
  if (r.error || !r.data || !r.data[0]) throw (r.error || new Error('Bulut kaydı okunamadı.'));
  CL.pend[sc] = { state: r.data[0].state, version: r.data[0].version };
  if (!kqApplyPend()) { PS.state = 'saving'; setTimeout(render, 60); return; }
  PS.state = 'saved'; setTimeout(() => { render(); }, 60);
}; }

/* yoklama: değişen bölümleri bekletmeli al, sürümü uygulanana kadar ilerletme */
{ const _cp = cloudPoll; cloudPoll = async function () {
  if (CL.rule) return _cp.apply(this, arguments);
  if (!CL.on || PS.busy || CL.busy || !SBS.biz) return; CL.busy = true;
  try {
    const c = sbClient(); const bid = SBS.biz.id; const v = await c.from('app_state').select('scope,version').eq('business_id', bid); if (v.error || !v.data) { CL.busy = false; return; }
    const ch = v.data.filter((x) => x.scope !== 'all' && x.version > (CL.vers[x.scope] || 0) && !(CL.pend[x.scope] && CL.pend[x.scope].version >= x.version));
    if (ch.length) {
      const res = await Promise.all(ch.map((x) => c.from('app_state').select('scope,state,version').eq('business_id', bid).eq('scope', x.scope).limit(1))); let any = false;
      res.forEach((r) => { const row = r.data && r.data[0]; if (row) { CL.pend[row.scope] = { state: row.state, version: row.version }; any = true; } });
      if (any) { if (kqApplyPend()) render(); }
    }
  } catch (e) {} CL.busy = false;
}; }

/* açılışta: bekleyen çevrimdışı değişiklikleri buluttaki güncel veriyle birleştir */
async function kqRecover() {
  if (!kqOn()) return; let e = null; try { e = await kqGet(kqKey()); } catch (x) { e = null; } if (!e || !e.cur) return;
  let conf = 0, n = 0;
  Object.keys(e.cur).forEach((sc) => {
    if (!canW(sc) || CL.base[sc] === undefined) return; let local, base, remote; try { local = JSON.parse(e.cur[sc]); remote = JSON.parse(CL.base[sc]); base = e.base && e.base[sc] ? JSON.parse(e.base[sc]) : undefined; } catch (x) { return; }
    if (base !== undefined && kqEq(local, base)) return; if (kqEq(local, remote)) return;
    const st = { n: 0 }; const merged = base === undefined ? kqMerge({}, local, remote, st) : kqMerge(base, local, remote, st); conf += st.n;
    if (kqEq(merged, remote)) return; kqScopeApply(merged); CL.sent[sc] = '__dirty__'; n++;
  });
  if (n) { PS.last = pSnap(); try { render(); } catch (x) {} toast('Çevrimdışıyken yaptığın değişiklikler gönderiliyor.' + (conf ? ' ' + conf + ' çakışmada senin değişikliğin korundu.' : ''), 'ok'); setTimeout(() => { try { pSched(); } catch (x) {} }, 100); }
  else { try { await kqDel(kqKey()); } catch (x) {} }
}
{ const _ca2 = cloudAttach; cloudAttach = async function () { const r = await _ca2.apply(this, arguments); try { await kqRecover(); } catch (e) {} return r; }; }

/* görünür durum + çıkış + sekme gizlenirken */
{ const _ps = paintStatus; paintStatus = function () { _ps.apply(this, arguments); try { const e = document.getElementById('ps-chip'); if (e && PS.state === 'error' && (PS.queued || navigator.onLine === false)) e.textContent = 'Cihazda saklı, bağlanınca gider'; } catch (x) {} }; }
{ const _so = idSignOut; idSignOut = async function () { let k = null, dirty = false; try { k = kqKey(); dirty = clDirty(); } catch (e) {} const r = await _so.apply(this, arguments); try { if (k && !dirty) await kqDel(k); } catch (e) {} return r; }; }
document.addEventListener('visibilitychange', () => { try { if (document.visibilityState === 'hidden' && kqOn() && clDirty()) kqPersist(); } catch (e) {} });
