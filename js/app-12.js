/* =====================================================================
   v160 Muhasebe derinliği: Tek Düzen hesap eşlemesi, mizan, gelir tablosu, özet bilanço,
   tevkifat / ÖTV / stopaj alanları ve döviz kaydı. Defter satırlarından türetilir; satırlar değişmez.
   ===================================================================== */
const MH = { ym: '', mode: 'ay', tab: 'mizan', q: '', id: '' };
const MH_AD = { '100': 'Kasa / Banka', '120': 'Alıcılar', '136': 'Mahsup Edilecek Vergi (tevkifat, stopaj)', '191': 'İndirilecek KDV', '360': 'Ödenecek Vergi ve Fonlar', '391': 'Hesaplanan KDV', '500': 'Sermaye / Açılış', '600': 'Yurt İçi Satışlar', '601': 'Yurt Dışı Satışlar', '602': 'Diğer Gelirler', '621': 'Satılan Ticari Mallar Maliyeti', '649': 'Diğer Olağan Gelir ve Kârlar', '689': 'Diğer Olağan Gider ve Zararlar', '740': 'Hizmet Üretim Maliyeti', '760': 'Pazarlama Satış Dağıtım Giderleri', '770': 'Genel Yönetim Giderleri', '780': 'Finansman Giderleri' };
const MH_GELIR = ['600', '601', '602', '649'], MH_GIDER = ['621', '740', '760', '770', '780', '689'];
const MH_TV = ['', '2/10', '3/10', '4/10', '5/10', '7/10', '9/10', '10/10'];
const mhN = (v) => Number(v) || 0;
const mhFmt = (n) => (Math.round(n * 100) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function mhMap() { if (!S.settings) S.settings = {}; if (!S.settings.hmap || typeof S.settings.hmap !== 'object') S.settings.hmap = {}; return S.settings.hmap; }
function mhKod(r) {
  if (r.hk && MH_AD[r.hk]) return r.hk; const m = (S.settings && S.settings.hmap) || {}; if (m[r.acc] && MH_AD[m[r.acc]]) return m[r.acc];
  if (dirOf(r) === 'gelir') return /diğer gelir/i.test(r.acc || '') ? '649' : '600';
  return /hammadde/i.test(r.acc || '') ? '621' : '770';
}
function mhTv(r) { const a = String(r.tv || '').split('/'); return a.length === 2 && +a[1] ? Math.min(1, (+a[0] || 0) / +a[1]) : 0; }
/* Bir defter satırının çift taraflı karşılığı. total = KDV ve ÖTV dahil brüt tutar (TL). */
function mhEntries(r) {
  const t = mhN(r.total), rt = mhN(r.rate), otv = Math.max(0, mhN(r.otv)), stp = Math.max(0, mhN(r.stp)); const gelir = dirOf(r) === 'gelir'; const kod = mhKod(r);
  const belge = gelir || (r.doc && r.doc !== '—'); const base = t - otv; const m = belge && rt ? base / (1 + rt / 100) : base; const kdv = belge && rt ? base - m : 0; const tvk = kdv * mhTv(r);
  const L = [], add = (k, b, a, sub) => { if (Math.abs(b) > 0.004 || Math.abs(a) > 0.004) L.push({ k, sub: sub || '', b: r2(b), a: r2(a) }); };
  if (gelir) { add('100', t - tvk - stp, 0); add('136', tvk + stp, 0); add(kod, 0, m, r.acc); add('391', 0, kdv); add('360', 0, otv); }
  else { add(kod, m + otv, 0, r.acc); add('191', kdv, 0); add('100', 0, t - tvk - stp); add('360', 0, tvk + stp); }
  return L;
}
function mhRange() { const ym = MH.ym || fiIso().slice(0, 7); const to = ym + '-31'; const from = MH.mode === 'yil' ? ym.slice(0, 4) + '-01-01' : ym + '-01'; return { ym, from, to }; }
function mhMizan(from, to) {
  const M = {}; let tb = 0, ta = 0; const open = mhN(S.settings && S.settings.mhOpen);
  const put = (e) => { const key = e.k + '|' + (e.sub || ''); const o = M[key] || (M[key] = { k: e.k, sub: e.sub || '', b: 0, a: 0 }); o.b += e.b; o.a += e.a; };
  if (open && (!from || from <= '0000')) { put({ k: '100', b: open, a: 0 }); put({ k: '500', b: 0, a: open }); }
  LEDGER.forEach((r) => { if (!r.iso || (from && r.iso < from) || (to && r.iso > to)) return; mhEntries(r).forEach(put); });
  const lines = Object.values(M).map((o) => ({ k: o.k, ad: MH_AD[o.k] || o.k, sub: o.sub, b: r2(o.b), a: r2(o.a) })).sort((x, y) => (x.k + x.sub < y.k + y.sub ? -1 : 1));
  lines.forEach((l) => { tb += l.b; ta += l.a; }); return { lines, tb: r2(tb), ta: r2(ta), ok: Math.abs(tb - ta) < 0.05 };
}
const mhBal = (lines, pred) => r2(lines.filter(pred).reduce((t, l) => t + l.a - l.b, 0)); /* alacak bakiyesi (gelir yönü) */
function mhGelirTablosu(from, to) {
  const Z = mhMizan(from, to).lines; const sat = mhBal(Z, (l) => ['600', '601', '602'].includes(l.k)); const mal = -mhBal(Z, (l) => l.k === '621');
  const dig = mhBal(Z, (l) => l.k === '649'); const gid = Z.filter((l) => ['740', '760', '770', '780', '689'].includes(l.k)).map((l) => ({ ad: l.sub || l.ad, kod: l.k, t: r2(l.b - l.a) }));
  const gtop = r2(gid.reduce((t, x) => t + x.t, 0)); const brut = r2(sat - mal); const faal = r2(brut - gtop); return { sat, mal, brut, gid, gtop, faal, dig, net: r2(faal + dig) };
}
function mhBilanco(to) {
  const open = mhN(S.settings && S.settings.mhOpen); const Z = mhMizan('', to).lines; const bal = (k) => r2(Z.filter((l) => l.k === k).reduce((t, l) => t + l.b - l.a, 0));
  let kasa = bal('100'); let alici = 0;
  INV.forEach((v) => { if (!v.iso || v.iso > to) return; const o = ivOpen(v); if (o <= 0.005) return; if (LEDGER.some((r) => r.desc && r.desc.indexOf('Fatura ' + v.no) >= 0 && dirOf(r) === 'gelir')) alici += o; });
  alici = r2(alici); kasa = r2(kasa - alici); const mah = bal('136'), indkdv = bal('191'); const hkdv = r2(-bal('391')), vergi = r2(-bal('360'));
  const kar = r2(mhBal(Z, (l) => MH_GELIR.includes(l.k)) - Z.filter((l) => MH_GIDER.includes(l.k)).reduce((t, l) => t + l.b - l.a, 0));
  const aktif = r2(kasa + alici + mah + indkdv), pasif = r2(vergi + hkdv + open + kar);
  return { kasa, alici, mah, indkdv, hkdv, vergi, sermaye: open, kar, aktif, pasif, ok: Math.abs(aktif - pasif) < 0.05 };
}
const mhInp = 'width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit';
const mhRow = (a, b, bold, cls) => `<div class="row between" style="padding:7px 14px;${bold ? 'font-weight:700;' : ''}"><span class="small">${a}</span><span class="num small ${cls || ''}">${b}</span></div>`;
NEWM.mhrap = () => {
  const R = brScope(() => { const g = mhRange(); return { g, Z: mhMizan(g.from, g.to), G: mhGelirTablosu(g.from, g.to), B: mhBilanco(g.to) }; }); const g = R.g; let body = '';
  if (MH.tab === 'mizan') {
    body = `<div class="card flush" style="margin-top:10px"><div class="row between" style="padding:10px 14px 4px"><b class="small">Hesap</b><span class="small muted">Borç · Alacak</span></div>${R.Z.lines.length ? R.Z.lines.map((l) => `<div class="row between" style="padding:6px 14px;gap:8px"><span class="small" style="min-width:0">${l.k} ${esc(l.ad)}${l.sub ? ' · ' + esc(l.sub) : ''}</span><span class="num small" style="white-space:nowrap">${l.b ? mhFmt(l.b) : '—'} · ${l.a ? mhFmt(l.a) : '—'}</span></div>`).join('') : '<p class="muted small" style="padding:10px 14px">Bu dönemde kayıt yok.</p>'}${mhRow('Toplam', mhFmt(R.Z.tb) + ' · ' + mhFmt(R.Z.ta), true)}</div>
    <p class="small ${R.Z.ok ? 'muted' : ''}" style="margin-top:8px">${R.Z.ok ? 'Borç ve alacak toplamı eşit.' : 'Borç ve alacak eşit değil, kayıtları kontrol et.'}</p>`;
  } else if (MH.tab === 'gelir') {
    const G = R.G; body = `<div class="card flush" style="margin-top:10px">${mhRow('Satışlar', mhFmt(G.sat))}${mhRow('Satışların maliyeti (621)', '-' + mhFmt(G.mal))}${mhRow('Brüt kâr', mhFmt(G.brut), true)}${G.gid.map((x) => mhRow(esc(x.ad) + ' (' + x.kod + ')', '-' + mhFmt(x.t))).join('')}${mhRow('Faaliyet kârı', mhFmt(G.faal), true)}${mhRow('Diğer gelirler (649)', mhFmt(G.dig))}${mhRow('Dönem kârı (vergi öncesi)', mhFmt(G.net), true, G.net < 0 ? 'bad' : '')}</div>`;
  } else {
    const B = R.B; body = `<div class="card flush" style="margin-top:10px"><div style="padding:10px 14px 2px"><b class="small">Aktif</b></div>${mhRow('100 Kasa / Banka', mhFmt(B.kasa))}${mhRow('120 Alıcılar (açık faturalar)', mhFmt(B.alici))}${mhRow('136 Mahsup edilecek vergi', mhFmt(B.mah))}${mhRow('191 İndirilecek KDV', mhFmt(B.indkdv))}${mhRow('Toplam aktif', mhFmt(B.aktif), true)}</div>
    <div class="card flush" style="margin-top:10px"><div style="padding:10px 14px 2px"><b class="small">Pasif</b></div>${mhRow('391 Hesaplanan KDV', mhFmt(B.hkdv))}${mhRow('360 Ödenecek vergi, stopaj, ÖTV', mhFmt(B.vergi))}${mhRow('500 Sermaye / açılış', mhFmt(B.sermaye))}${mhRow('Kâr / zarar (başlangıçtan)', mhFmt(B.kar), false, B.kar < 0 ? 'bad' : '')}${mhRow('Toplam pasif', mhFmt(B.pasif), true)}</div>
    <div class="field" style="margin-top:10px"><label for="mh-open">Açılış kasa / banka bakiyesi (₺)</label><input id="mh-open" inputmode="decimal" value="${S.settings && S.settings.mhOpen ? esc(String(S.settings.mhOpen)) : ''}" placeholder="0" style="${mhInp}"></div><button class="btn sec block" data-a="mhopen" style="margin-top:6px">Bakiyeyi kaydet</button>
    <p class="small muted" style="margin-top:8px">Defterdeki gelir ve giderlerden türetilen yönetim bilançosudur. Resmî bilanço için mali müşavirinin kayıtları esastır.</p>`;
  }
  const tb = (k, t) => `<button class="btn ${MH.tab === k ? '' : 'sec'}" data-a="mhtab" data-v="${k}" style="flex:1;padding:10px 6px">${t}</button>`;
  return sheet('Mizan ve bilanço', `<div style="display:flex;gap:6px">${tb('mizan', 'Mizan')}${tb('gelir', 'Gelir tablosu')}${tb('bilanco', 'Bilanço')}</div>
  <div style="display:flex;gap:8px;margin-top:10px"><input id="mh-m" type="month" value="${esc(g.ym)}" style="${mhInp}"><button class="btn sec" data-a="mhmode" style="white-space:nowrap">${MH.mode === 'yil' ? 'Yıl başından' : 'Yalnız ay'}</button></div>${body}
  <div style="display:flex;gap:8px;margin-top:12px"><button class="btn block" data-a="mhxl">Excel indir</button><button class="btn sec block" data-a="mhmap">Hesap eşlemesi</button></div>`);
};
H.mhrap = () => { S.modal = { type: 'mhrap' }; renderModal(); };
H.mhtab = (el) => { MH.tab = el.dataset.v || 'mizan'; renderModal(); };
H.mhmode = () => { MH.mode = MH.mode === 'yil' ? 'ay' : 'yil'; renderModal(); };
H.mhopen = () => { const v = mhN(trNum((document.getElementById('mh-open') || {}).value)); if (!S.settings) S.settings = {}; S.settings.mhOpen = v; try { pSched(); } catch (e) {} toast('Açılış bakiyesi kaydedildi.', 'ok'); renderModal(); };
document.addEventListener('change', (e) => { const t = e.target; if (t && t.id === 'mh-m' && /^\d{4}-\d{2}$/.test(t.value)) { MH.ym = t.value; renderModal(); } });
H.mhxl = async () => {
  try {
    const g = mhRange(); const R = brScope(() => ({ Z: mhMizan(g.from, g.to), G: mhGelirTablosu(g.from, g.to), B: mhBilanco(g.to) })); toast('Excel hazırlanıyor…'); const X = await xlLoad(); const wb = new X.Workbook(); const num = '#,##0.00';
    const w1 = wb.addWorksheet('Mizan'); w1.columns = [{ width: 8 }, { width: 40 }, { width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }]; w1.addRow([BIZ + ' · Mizan · ' + g.from + ' / ' + g.to]).font = { bold: true, size: 13 }; w1.addRow(['Kod', 'Hesap', 'Alt hesap', 'Borç', 'Alacak', 'Bakiye']).font = { bold: true };
    R.Z.lines.forEach((l) => { const x = w1.addRow([l.k, l.ad, l.sub, l.b, l.a, r2(l.b - l.a)]); [4, 5, 6].forEach((c) => { x.getCell(c).numFmt = num; }); }); const tr = w1.addRow(['', 'Toplam', '', R.Z.tb, R.Z.ta, '']); tr.font = { bold: true }; tr.getCell(4).numFmt = num; tr.getCell(5).numFmt = num;
    const w2 = wb.addWorksheet('Gelir Tablosu'); w2.columns = [{ width: 44 }, { width: 18 }]; const G = R.G; [['Satışlar', G.sat], ['Satışların maliyeti (621)', -G.mal], ['Brüt kâr', G.brut]].concat(G.gid.map((x) => [x.ad + ' (' + x.kod + ')', -x.t]), [['Faaliyet kârı', G.faal], ['Diğer gelirler (649)', G.dig], ['Dönem kârı (vergi öncesi)', G.net]]).forEach((a) => { const x = w2.addRow(a); x.getCell(2).numFmt = num; });
    const w3 = wb.addWorksheet('Bilanço'); w3.columns = [{ width: 44 }, { width: 18 }]; const B = R.B; [['AKTİF', ''], ['100 Kasa / Banka', B.kasa], ['120 Alıcılar', B.alici], ['136 Mahsup edilecek vergi', B.mah], ['191 İndirilecek KDV', B.indkdv], ['Toplam aktif', B.aktif], ['PASİF', ''], ['391 Hesaplanan KDV', B.hkdv], ['360 Ödenecek vergi, stopaj, ÖTV', B.vergi], ['500 Sermaye / açılış', B.sermaye], ['Kâr / zarar', B.kar], ['Toplam pasif', B.pasif]].forEach((a) => { const x = w3.addRow(a); x.getCell(2).numFmt = num; if (/^(AKT|PAS|Top)/.test(a[0])) x.font = { bold: true }; });
    const buf = await wb.xlsx.writeBuffer(); saveBlob('mizan-' + g.ym + '.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); toast('Excel indirildi.', 'ok');
  } catch (e) { toast('Excel hazırlanamadı. İnternet bağlantını kontrol et.', 'warn'); }
};
/* hesap eşlemesi: defterdeki her hesap adı için Tek Düzen kodu */
NEWM.mhmap = () => {
  const accs = Array.from(new Set(LEDGER.map((r) => (r.acc || '') + '|' + dirOf(r)))).sort(); const m = (S.settings && S.settings.hmap) || {};
  return sheet('Hesap eşlemesi', `<p class="small muted">Defterdeki hesap adlarının Tek Düzen karşılığı. Değiştirince mizan ve gelir tablosu buna göre kurulur.</p>${accs.length ? accs.map((k, i) => { const [a, d] = k.split('|'); const list = d === 'gelir' ? MH_GELIR : MH_GIDER; const cur = (m[a] && list.includes(m[a])) ? m[a] : mhKod({ acc: a, dir: d }); return `<div class="field" style="margin-top:8px"><label>${esc(a || '—')} <span class="muted">(${d === 'gelir' ? 'gelir' : 'gider'})</span></label><select data-hm="${esc(a)}" style="${mhInp}">${list.map((c) => `<option value="${c}"${c === cur ? ' selected' : ''}>${c} ${MH_AD[c]}</option>`).join('')}</select></div>`; }).join('') : '<p class="muted small">Defterde kayıt yok.</p>'}`);
};
H.mhmap = () => { S.modal = { type: 'mhmap' }; renderModal(); };
document.addEventListener('change', (e) => { const t = e.target; if (!t || !t.dataset || t.dataset.hm == null) return; mhMap()[t.dataset.hm] = t.value; try { pSched(); } catch (x) {} toast('Eşleme kaydedildi.', 'ok'); });
/* kayıt ayrıntısı: tevkifat, ÖTV, stopaj, döviz, hesap kodu */
NEWM.mhrows = () => {
  const q = String(MH.q || '').toLowerCase(); const rows = brScope(() => LEDGER.filter((r) => !q || String(r.desc || '').toLowerCase().includes(q) || String(r.acc || '').toLowerCase().includes(q)).slice().sort((a, b) => ((b.iso || '') < (a.iso || '') ? -1 : 1)).slice(0, 40));
  return sheet('Kayıt ayrıntısı', `<input id="mh-q" placeholder="Ara: açıklama ya da hesap" value="${esc(MH.q)}" style="${mhInp}">${rows.map((r) => `<button class="btn sec block" data-a="mhedit" data-id="${esc(r.id)}" style="margin-top:8px;text-align:left;display:flex;justify-content:space-between;gap:8px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(r.desc || '—')}</span><span class="num" style="white-space:nowrap">${fmt0(mhN(r.total))}${r.tv || r.otv || r.stp || (r.cur && r.cur !== 'TRY') ? ' ·' : ''}${r.tv ? ' T' + esc(r.tv) : ''}${r.otv ? ' ÖTV' : ''}${r.stp ? ' S' : ''}${r.cur && r.cur !== 'TRY' ? ' ' + esc(r.cur) : ''}</span></button>`).join('') || '<p class="muted small" style="margin-top:10px">Kayıt yok.</p>'}`);
};
H.mhrows = () => { S.modal = { type: 'mhrows' }; renderModal(); };
document.addEventListener('input', (e) => { const t = e.target; if (t && t.id === 'mh-q') { MH.q = t.value; const p = t.selectionStart; renderModal(); const n = document.getElementById('mh-q'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} } } });
NEWM.mhedit = (m) => {
  const r = LEDGER.find((x) => x.id === m.id); if (!r) return sheet('Kayıt ayrıntısı', '<p class="muted">Kayıt bulunamadı.</p>'); const gelir = dirOf(r) === 'gelir'; const kod = mhKod(r); const list = gelir ? MH_GELIR : MH_GIDER;
  return sheet('Kayıt ayrıntısı', `<p class="small"><b>${esc(r.desc || '—')}</b><br><span class="muted">${esc(r.acc || '')} · KDV dahil ${mhFmt(mhN(r.total))} ₺</span></p>
  <div class="field"><label for="mh-tv">KDV tevkifatı</label><select id="mh-tv" style="${mhInp}">${MH_TV.map((x) => `<option value="${x}"${(r.tv || '') === x ? ' selected' : ''}>${x || 'Yok'}</option>`).join('')}</select></div>
  <div class="field"><label for="mh-otv">ÖTV tutarı (₺, toplamın içinde)</label><input id="mh-otv" inputmode="decimal" value="${r.otv ? esc(String(r.otv)) : ''}" placeholder="0" style="${mhInp}"></div>
  <div class="field"><label for="mh-stp">Stopaj tutarı (₺)</label><input id="mh-stp" inputmode="decimal" value="${r.stp ? esc(String(r.stp)) : ''}" placeholder="0" style="${mhInp}"></div>
  <div class="field"><label for="mh-cur">Para birimi</label><select id="mh-cur" style="${mhInp}">${['TRY', 'USD', 'EUR', 'GBP'].map((c) => `<option${(r.cur || 'TRY') === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
  <div style="display:flex;gap:8px"><div class="field" style="flex:1"><label for="mh-fx">Döviz tutarı</label><input id="mh-fx" inputmode="decimal" value="${r.fx ? esc(String(r.fx)) : ''}" style="${mhInp}"></div><div class="field" style="flex:1"><label for="mh-kur">Kur</label><input id="mh-kur" inputmode="decimal" value="${r.kur ? esc(String(r.kur)) : ''}" style="${mhInp}"></div></div>
  <div class="field"><label for="mh-hk">Hesap kodu</label><select id="mh-hk" style="${mhInp}">${list.map((c) => `<option value="${c}"${c === kod ? ' selected' : ''}>${c} ${MH_AD[c]}</option>`).join('')}</select></div>
  <button class="btn block" data-a="mhsave" data-id="${esc(r.id)}" style="margin-top:8px">Kaydet</button><p class="small muted" style="margin-top:8px">Döviz tutarı ve kur girilirse toplam TL karşılığı olarak güncellenir.</p>`);
};
H.mhedit = (el) => { S.modal = { type: 'mhedit', id: el.dataset.id }; renderModal(); };
H.mhsave = (el) => {
  if (typeof locked === 'function' && locked()) return; const r = LEDGER.find((x) => x.id === el.dataset.id); if (!r) return; const g = (id) => String((document.getElementById(id) || {}).value || '').trim(); const n = (id) => mhN(trNum(g(id)));
  const tv = g('mh-tv'), otv = n('mh-otv'), stp = n('mh-stp'), cur = g('mh-cur') || 'TRY', fx = n('mh-fx'), kur = n('mh-kur');
  if (otv < 0 || stp < 0 || otv + stp > mhN(r.total) + 0.005) { toast('ÖTV ve stopaj toplamdan büyük olamaz.', 'warn'); return; }
  if (cur !== 'TRY' && (fx <= 0 || kur <= 0)) { toast('Döviz için tutar ve kur gir.', 'warn'); return; }
  if (tv) r.tv = tv; else delete r.tv; if (otv) r.otv = otv; else delete r.otv; if (stp) r.stp = stp; else delete r.stp;
  if (cur !== 'TRY') { r.cur = cur; r.fx = fx; r.kur = kur; r.total = r2(fx * kur); } else { delete r.cur; delete r.fx; delete r.kur; }
  const hk = g('mh-hk'); const def = mhKod(Object.assign({}, r, { hk: '' })); if (hk && hk !== def) r.hk = hk; else delete r.hk;
  try { pSched(); } catch (e) {} toast('Kaydedildi.', 'ok'); S.modal = { type: 'mhrows' }; renderModal();
};
/* =====================================================================
   v161 Abonelik ve plan: sunucudaki plan durumunu okur (plan_get), süre bitimine yaklaşınca uyarır,
   süre ve ek süre bitince yalnızca okuma moduna alır (sunucu 'plan_expired' ile de korur).
   Plan ve durum admin panelinden ayarlanır. plans.sql çalıştırılmamışsa sessizce kapalı kalır.
   ===================================================================== */
const PLAN = { st: null, ro: false, at: 0 };
async function planLoad() {
  try {
    if (!SBS.biz || (typeof DEMO !== 'undefined' && DEMO)) return; const c = sbClient(); if (!c) return;
    const r = await c.rpc('plan_get', { bid: SBS.biz }); if (r.error || !r.data) return;
    PLAN.st = r.data; PLAN.ro = r.data.effective === 'readonly'; PLAN.at = Date.now(); planPaint();
    if (PLAN.ro) { PS.state = 'readonly'; try { paintStatus(); } catch (e) {} }
  } catch (e) {}
}
function planMsg() {
  const s = PLAN.st; if (!s) return null; const isP = S.user && S.user.role === 'patron'; const d = s.days_left; const nm = s.plan_name || 'Plan';
  if (s.effective === 'readonly') return ['bad', isP ? 'Aboneliğin sona erdi. Veriler duruyor ama yeni kayıt yapılamıyor. Devam etmek için bizimle iletişime geç.' : 'İşletmenin aboneliği sona erdi. Şimdilik yalnızca görüntüleyebilirsin.'];
  if (!isP) return null;
  if (s.effective === 'grace') return ['warn', (s.status === 'past_due' ? 'Ödemen gecikti. ' : 'Aboneliğin bitti. ') + 'Kısa bir ek süre var, sonra uygulama yalnızca okuma moduna geçer.'];
  if (d != null && d >= 0 && d <= 7 && ['trial', 'active'].includes(s.status)) return ['info', (s.status === 'trial' ? 'Deneme süren ' : nm + ' aboneliğin ') + (d === 0 ? 'bugün' : d + ' gün sonra') + ' bitiyor.'];
  return null;
}
function planPaint() {
  try {
    let el = document.getElementById('plan-bar'); const m = PLAN.st ? planMsg() : null;
    if (!m) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'plan-bar'; document.body.appendChild(el); }
    const col = { bad: '#E5484D', warn: '#F5A524', info: '#3E63DD' }[m[0]];
    el.setAttribute('style', 'position:fixed;left:8px;right:8px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:50;padding:10px 12px;border-radius:12px;background:var(--card,#fff);color:inherit;border:1px solid ' + col + ';box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:13px;line-height:1.35');
    el.textContent = m[1];
  } catch (e) {}
}
{ const _pf = pFlush; pFlush = async function () { if (PLAN.ro) { PS.state = 'readonly'; try { paintStatus(); } catch (e) {} return; } return _pf.apply(this, arguments); }; }
{ const _ca = cloudAttach; cloudAttach = async function () { const r = await _ca.apply(this, arguments); try { await planLoad(); } catch (e) {} return r; }; }
{ const _cp = cloudPoll; cloudPoll = async function () { const r = await _cp.apply(this, arguments); try { if (Date.now() - PLAN.at > 10 * 60000) planLoad(); } catch (e) {} return r; }; }
{ const _rn = render; render = function () { const r = _rn.apply(this, arguments); try { planPaint(); } catch (e) {} return r; }; }

/* KDV hesabı için tek yerden: ÖTV matrahtan düşülür, tevkifat KDV'nin kesilen kısmıdır (tv). */
function mhKdvParts(r) {
  const t = mxN(r.total), rt = mxN(r.rate), otv = Math.max(0, mxN(r.otv)); const base = t - otv; const m = rt ? base / (1 + rt / 100) : base; const k = rt ? base - m : 0;
  return { t, m, k, tv: k * mhTv(r) };
}

/* v165: salt okunur planda yazan kalan işleyiciler de kilitlenir (dönem kapanışı bunlara uygulanmaz) */
['saleimport', 'ebsave', 'rztadd', 'vdtog', 'vdmin', 'vdauto', 'vdcopy', 'vdclear', 'vdpub', 'vdtadd', 'vdtdel', 'izweek', 'izoff', 'brpub', 'brnoti', 'brkp', 'brkm', 'brperm', 'chk', 'rqsend', 'opgo', 'ppwk', 'ftcol', 'clkmode', 'rptog', 'kaall', 'kaundo', 'sendmsg', 'respond'].forEach((n) => {
  const o = H[n]; if (typeof o !== 'function') return;
  H[n] = function () { try { if (PLAN.ro) { toast('Aboneliğin sona erdiği için kayıt yapılamıyor.', 'warn'); return; } } catch (e) {} return o.apply(this, arguments); };
});

/* v167: patron kaydı (3 adım), Google ile giriş, Google sonrası hızlı kurulum soruları */
(() => {
  const css = document.createElement('style'); css.id = 'sg-css';
  css.textContent = `.sg-pg{display:flex;gap:6px;margin:2px 0 14px}.sg-pg i{flex:1;height:5px;border-radius:3px;background:#DCE5F1}.sg-pg i.on{background:var(--cini,#0D56A6)}
.sg-st{font-size:12px;font-weight:700;color:var(--cini,#0D56A6);letter-spacing:.3px;text-transform:uppercase;margin-bottom:4px}
.sg-g{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:50px;border:1.5px solid #CBD7E6;background:#fff;border-radius:14px;font:inherit;font-weight:600;font-size:16px;color:#1B2B41;cursor:pointer}
.sg-g:active{transform:scale(.99)}.sg-g svg{flex:none}.sg-or{display:flex;align-items:center;gap:10px;color:#74839A;font-size:13px;margin:12px 0}.sg-or:before,.sg-or:after{content:"";flex:1;height:1px;background:#DCE5F1}
.sg-hi{display:flex;align-items:center;gap:10px;background:#EEF4FC;border-radius:14px;padding:10px 12px;margin-bottom:12px;font-size:14px;color:#1B2B41}.sg-hi b{display:block}
.sg-ok{font-size:13px;color:#74839A;margin-top:6px}.sg-ok.y{color:#1B8A5A}
.sg-sm{font-size:13px;color:#4C5E78;margin:2px 0 8px}.sg-row{display:flex;gap:10px;margin-top:6px}.sg-row .lx-alt{flex:0 0 auto;min-width:92px}`;
  document.head.appendChild(css);
})();
const SG_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
const sgGoogleBtn = (label) => `<button type="button" class="sg-g" data-a="sggoogle">${SG_G}<span>${label || 'Google ile devam et'}</span></button>`;
const sgNameOf = () => { const u = SBS.user; const m = (u && u.user_metadata) || {}; return String(m.full_name || m.name || '').trim(); };
S.sg = S.sg || null;
function sgInit() { S.sg = { step: SBS.user ? 2 : 1, name: sgNameOf(), em: S.lgEm || '', pw: '', biz: '', tur: '', il: '', cal: '', mods: [], muh: '' }; }
function sgSnap() {
  if (!S.sg) return; const g = (id) => { const e = document.getElementById(id); return e ? e.value : undefined; };
  const set = (k, v) => { if (v !== undefined) S.sg[k] = String(v).trim(); };
  set('name', g('sg-name')); set('em', g('sg-em')); if (g('sg-pw') !== undefined) S.sg.pw = g('sg-pw'); set('biz', g('sg-biz')); set('il', g('sg-il'));
  if (document.getElementById('id-tur')) S.sg.tur = g('id-tur') || '';
  if (document.querySelector('[data-grp="cal"]')) S.sg.cal = pfOn('cal')[0] || ''; if (document.querySelector('[data-grp="muh"]')) S.sg.muh = pfOn('muh')[0] || '';
  if (document.querySelector('[data-grp="mods"]')) S.sg.mods = pfOn('mods');
  { const k = document.getElementById('sg-kabul'); if (k) S.sg.kabul = k.checked; }
}
const sgErr = (t) => { S.loginErr = t; const e = document.getElementById('sg-err'); if (e) e.textContent = t; };
lxCreate = function () {
  if (!S.sg) sgInit(); const s = S.sg, st = s.step, g = !!SBS.user, nm = esc(s.name.split(' ')[0] || '');
  const fld = (lab, id, ico, inner) => `<div class="lx-f"><label for="${id}">${lab}</label><div class="lx-in">${ico}${inner}</div></div>`;
  const pg = `<div class="sg-pg" aria-label="Adım ${st} / 3">${[1, 2, 3].map((i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>`;
  const titles = { 1: ['Hesabını oluştur', 'Başlamak 1 dakikanı almaz.'], 2: [g && nm ? 'Merhaba ' + nm + ', işletmeni tanıyalım' : 'İşletmeni tanıyalım', 'Sana uygun kurulumu hazırlayacağız.'], 3: ['Son dokunuş', 'Sektörüne göre bir başlangıç seçtik, değiştirebilirsin.'] };
  let body = '';
  if (st === 1) body = `${sgGoogleBtn()}<div class="sg-or"><span>veya e-posta ile</span></div>${fld('Ad soyad', 'sg-name', pfIc('user'), `<input id="sg-name" type="text" autocomplete="name" placeholder="Adınız ve soyadınız" value="${esc(s.name)}">`)}
    ${fld('E-posta', 'sg-em', LXI.mail, `<input id="sg-em" type="email" autocomplete="username" inputmode="email" autocapitalize="none" placeholder="e-posta@firma.com" value="${esc(s.em)}">`)}
    ${fld('Şifre', 'sg-pw', LXI.lock, `<input id="sg-pw" type="password" autocomplete="new-password" placeholder="En az 8 karakter" value="${esc(s.pw)}"><button type="button" class="lx-eye" data-a="pwtog" aria-label="Şifreyi göster veya gizle">${LXI.eye}</button>`)}<div class="sg-ok${s.pw.length >= 8 ? ' y' : ''}" id="sg-pwh">${s.pw.length >= 8 ? 'Şifre uygun.' : 'En az 8 karakter.'}</div>`;
  else if (st === 2) body = `${g ? `<div class="sg-hi">${LXI.mail}<div><b>${esc(SBS.user.email || 'Hesabın')}</b><span class="small muted">ile giriş yapıldı</span></div></div>` : ''}
    ${fld('İşletme adı', 'sg-biz', pfIc('store'), `<input id="sg-biz" type="text" autocomplete="organization" placeholder="İşletme adınızı yazın" value="${esc(s.biz)}">`)}
    <div class="lx-f"><label>Hangi sektördesin?</label>${ddHTML(s.tur, 'İşletme türünüzü seçin')}</div>
    ${fld('Şehir <span class="lx-opt">isteğe bağlı</span>', 'sg-il', pfIc('store'), `<input id="sg-il" autocomplete="off" placeholder="Şehir yaz ya da seç" value="${esc(s.il)}">`)}`;
  else body = `<div class="lx-f"><label>Kaç kişi çalışıyor?</label>${pfChips('cal', PF_CAL, s.cal, false)}</div>
    <div class="lx-f"><label>Hangi bölümleri kullanacaksın?</label>${pfChips('mods', PF_MOD, s.mods, true)}<p class="sg-sm" style="margin-top:6px">Birden fazla seçebilirsin. Sonradan Ayarlar'dan değiştirirsin.</p></div>
    <div class="lx-f"><label>Muhasebecin var mı?</label>${pfChips('muh', PF_MUH, s.muh, false)}</div>
    <label class="kb-cons"><input type="checkbox" id="sg-kabul"${s.kabul ? ' checked' : ''}><span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım sözleşmesinı</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label>`;
  const back = st > (g ? 2 : 1) ? `<button type="button" class="lx-alt" data-a="sgback"><b>Geri</b></button>` : '';
  const nextLbl = st === 3 ? 'İşletmeyi oluştur' : 'Devam';
  const foot = st === 1 ? `<p class="lx-crb">Zaten hesabın var mı? <button type="button" class="lx-link" data-a="sgexit">Giriş yap</button></p>` : g ? `<p class="lx-crb">Davet koduyla mı katılacaksın? <button type="button" class="lx-link" data-a="sgjoin">Kodu gir</button> · <button type="button" class="lx-link" data-a="idout">Çıkış yap</button></p>` : '';
  return `<div class="login lx"><section class="lx-hero"><div class="lx-brand">${lxMark(40)}<span>KaisPilot</span></div><div class="lx-copy"><h2>İşletmenizi tek yerden yönetin.</h2><p>Fiş, ekip, stok ve tedarik süreçlerinizi tek ekrandan kontrol edin.</p></div>${lxArt()}</section>
  <section class="lx-card"><div class="lx-cin"><form id="sgform" class="lx-form lx-cr" novalidate>${pg}<div class="sg-st">Adım ${st} / 3</div><h1>${titles[st][0]}</h1><p class="lx-sub" style="margin-bottom:12px">${titles[st][1]}</p>
  ${body}<div class="err" id="sg-err" role="alert">${esc(S.loginErr)}</div>
  <div class="sg-row">${back}<button class="lx-go" type="button" data-a="sgnext" style="flex:1"><span>${nextLbl}</span>${LXI.arrow}</button></div>${foot}</form></div></section></div>`;
};
H.lgcreate = () => { S.lgEm = (document.getElementById('id-em') || {}).value || S.lgEm || ''; S.lgCreate = !S.lgCreate; S.loginErr = ''; if (S.lgCreate) sgInit(); render(); };
H.sgexit = () => { S.lgCreate = false; S.loginErr = ''; render(); };
H.sgback = () => { sgSnap(); S.loginErr = ''; if (S.sg.step > (SBS.user ? 2 : 1)) S.sg.step--; render(); };
H.sgnext = () => {
  sgSnap(); const s = S.sg;
  if (s.step === 1) {
    if (!s.name) return sgErr('Adını ve soyadını yaz.');
    if (!/^\S+@\S+\.\S{2,}$/.test(s.em)) return sgErr('Geçerli bir e-posta adresi yaz.');
    if (s.pw.length < 8) return sgErr('Şifre en az 8 karakter olmalı.');
  } else if (s.step === 2) { if (!s.biz) return sgErr('İşletmenin adını yaz.'); if (!s.tur) return sgErr('Sektörünü seç.'); if (!s.mods.length && PF_SUG[s.tur]) s.mods = PF_SUG[s.tur].slice(); }
  else { if (!s.kabul) return sgErr('Devam etmek için kullanım sözleşmesini ve KVKK metnini kabul etmelisin.'); return sgFinish(); }
  S.loginErr = ''; s.step++; render(); try { window.scrollTo(0, 0); } catch (e) {}
};
async function sgFinish() {
  const s = S.sg; const c = sbClient(); if (!c) return sgErr('Bulut bağlantısı kullanılamıyor.'); if (ID.busy) return; ID.busy = true; S.loginErr = '';
  try {
    if (!SBS.user) {
      let r = await c.auth.signUp({ email: s.em, password: s.pw, options: { data: { full_name: s.name } } });
      if (r.error && /already registered/i.test(r.error.message || '')) { r = await c.auth.signInWithPassword({ email: s.em, password: s.pw }); if (r.error) throw new Error('Bu e-posta zaten kayıtlı. Giriş yap ekranından şifrenle gir ya da "Şifremi unuttum?" kullan.'); }
      else if (r.error) throw r.error;
      if (!r.data.session) { ID.busy = false; return sgErr('Hesap açıldı. E-postana gelen onay bağlantısına tıkla, sonra giriş yap.'); }
      SBS.user = r.data.session.user;
    }
    await sbLoadBiz();
    if (!ID.mems.length) {
      const i = await c.from('businesses').insert({ name: s.biz, owner_id: SBS.user.id }); if (i.error) throw i.error;
      NAMES.u1 = { name: s.name || sgNameOf() || 'Patron', title: 'Patron' }; BIZ = s.biz; wipeData(); PEND.prof = { tur: s.tur, il: s.il, cal: s.cal, muh: s.muh, mods: s.mods.slice() }; applyNames(); await sbLoadBiz();
    }
    ID.busy = false; S.sg = null; S.lgCreate = false; try { sessionStorage.removeItem('kp_lg'); } catch (e) {}
    if (ID.mems.length > 1 && !ID.active) { render(); return; } await idEnter(); try { profPend(); } catch (e) {} render();
  } catch (e) { ID.busy = false; sgErr(idMsg(e)); }
}
profPend = function () {
  const p = PEND.prof; if (p) { if (!PROF.tur) Object.assign(PROF, { tur: p.tur || '', il: p.il || '', cal: p.cal || '', muh: p.muh || '', mods: p.mods || [] }); PEND.prof = null; pSched(); }
  if (PEND.tur && !PROF.tur) { PROF.tur = PEND.tur; pSched(); } PEND.tur = '';
};
/* Google */
H.sggoogle = async () => {
  const c = sbClient(); if (!c) return sgErr('Bulut bağlantısı kullanılamıyor.');
  try { sessionStorage.setItem('kp_lg', S.lgTab === 'emp' ? 'emp' : 'own'); } catch (e) {}
  try { const r = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); if (r.error) throw r.error; }
  catch (e) { const m = String((e && e.message) || e); const t = /provider.*not enabled|Unsupported provider/i.test(m) ? 'Google ile giriş henüz açılmamış.' : idMsg(e); S.loginErr = t; const x = document.getElementById('sg-err') || document.getElementById('id-err'); if (x) x.textContent = t; }
};
/* Google ile gelen ama işletmesi olmayan hesap */
H.sgjoin = () => { S.lgTab = 'emp'; S.lgCreate = false; S.loginErr = ''; render(); };
H.sgclaim = async () => {
  const code = ((document.getElementById('sg-code') || {}).value || '').trim().toUpperCase(); if (!code) return sgErr('Davet kodunu yaz.');
  const c = sbClient(); if (!c || !SBS.user) return;
  { const k = document.getElementById('sg-kabulj'); if (k && !k.checked) { const l = k.closest('.kb-cons'); if (l) l.classList.add('err'); return sgErr('Devam etmek için kullanım sözleşmesini ve KVKK metnini kabul etmelisin.'); } try { consentMark('davet', SBS.user.email); } catch (e) {} }
  try { const x = await c.rpc('claim_invite', { p_code: code }); if (x.error) throw x.error; if (x.data && x.data.error) throw new Error(x.data.error); await sbLoadBiz(); if (!ID.mems.length) return sgErr('Kod kabul edildi ama işletme bulunamadı. İşverenle konuş.'); if (ID.mems.length > 1 && !ID.active) { render(); return; } await idEnter(); }
  catch (e) { sgErr(idMsg(e)); }
};
H.sgown = () => { S.lgTab = 'own'; S.loginErr = ''; S.lgCreate = true; sgInit(); render(); };
{
  const prev = loginHTML;
  loginHTML = function () {
    if (!sbOK()) return prev();
    const noBiz = SBS.user && !S.user && !ID.active && ID.mems.length === 0;
    if (noBiz && S.lgTab === 'emp') {
      return `<div class="login lx lx-emp"><section class="lx-hero"><div class="lx-brand">${lxMark(40)}<span>KaisPilot</span></div><div class="lx-copy"><h2>Ekibe hoş geldin.</h2><p>İşvereninin verdiği davet koduyla katıl.</p></div>${lxArt()}</section>
      <section class="lx-card"><div class="lx-cin"><form id="sgform" class="lx-form" novalidate><h1>Davet koduyla katıl</h1><p class="lx-sub" style="margin-bottom:12px">${esc(SBS.user.email || '')} olarak giriş yapıldı.</p>
      <div class="lx-f"><label for="sg-code">Davet kodu</label><div class="lx-in">${LXI.lock}<input id="sg-code" type="text" autocapitalize="characters" maxlength="8" placeholder="Örn. K7M2QX" style="text-transform:uppercase;letter-spacing:.5px"></div></div>
      <label class="kb-cons"><input type="checkbox" id="sg-kabulj"><span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım sözleşmesinı</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label>
      <div class="err" id="sg-err" role="alert">${esc(S.loginErr)}</div><button class="lx-go" type="button" data-a="sgclaim"><span>Katıl</span>${LXI.arrow}</button>
      <p class="lx-crb">İşletme sahibi misin? <button type="button" class="lx-link" data-a="sgown">İşletmeni kur</button> · <button type="button" class="lx-link" data-a="idout">Çıkış yap</button></p></form></div></section></div>`;
    }
    if (noBiz && !S.lgCreate) { S.lgTab = 'own'; S.lgCreate = true; sgInit(); }
    let h = prev();
    if (!SBS.user && !S.lgCreate && (S.lgTab || 'own') !== 'sup') h = h.replace(/(<form id="idform" class="lx-form" novalidate>)/, `$1${sgGoogleBtn()}<div class="sg-or"><span>veya e-posta ile</span></div>`);
    return h;
  };
}
if (typeof document !== 'undefined') {
  document.addEventListener('submit', (e) => { if (e.target && e.target.id === 'sgform') { e.preventDefault(); (S.sg && S.lgCreate ? H.sgnext : H.sgclaim)(); } });
  document.addEventListener('keydown', (e) => { if (e.key !== 'Enter') return; const t = e.target; if (!t || t.tagName !== 'INPUT' || !t.closest || !t.closest('#sgform')) return; e.preventDefault(); if (document.getElementById('sg-code')) H.sgclaim(); else H.sgnext(); });
  document.addEventListener('input', (e) => { const t = e.target; if (t && t.id === 'sg-pw') { const h = document.getElementById('sg-pwh'); if (h) { const ok = t.value.length >= 8; h.textContent = ok ? 'Şifre uygun.' : 'En az 8 karakter.'; h.className = 'sg-ok' + (ok ? ' y' : ''); } } });
  try { if (sessionStorage.getItem('kp_lg') === 'emp') S.lgTab = 'emp'; } catch (e) {}
}

/* v168: doğum tarihi (yaşa bağlı asgari 20 gün izin) */
H.birthsave = (el) => {
  if (!S.user || !['patron', 'mudur'].includes(S.user.role)) return; const id = el.dataset.id; const p = PROFILES[id]; const v = ((document.getElementById('dr-birth') || {}).value || '').trim(); if (!p) return;
  if (v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v > fiIso() || v < '1900-01-01')) { toast('Doğum tarihini kontrol et.', 'warn'); return; }
  p.birth = v; pSched(); render(); try { renderModal(); } catch (e) {} toast(v ? (leaveAgeMin(id) ? 'Kaydedildi. Yaşı nedeniyle izin hakkı en az 20 gün.' : 'Doğum tarihi kaydedildi.') : 'Doğum tarihi silindi.', 'ok');
};

/* v169: Kais AI: finans/vardiya bağlamı, borç ödeme ve fiş onay işlemleri, her rol için hızlı komutlar */
AI_TYPES.push('borc_ode', 'fis_onayla');
{
  const _c = aiContext;
  aiContext = function () {
    const c = _c(); const r = S.user.role; const t = (f) => { try { return f(); } catch (e) { return undefined; } };
    const money = ['patron', 'muhasebeci'].includes(r); const mgr = ['patron', 'mudur'].includes(r);
    if (money) {
      c.borclar = t(() => DEBTS.filter((d) => !d.paid).slice(0, 20).map((d) => ({ id: d.id, kime: d.who, not: d.note || '', kalan: d.auto ? Math.round(allDebts().find((x) => x.id === d.id).amt) : dbOpen(d), vade: d.due || null, otomatik: !!d.auto })));
      c.alacaklar = t(() => RECV.filter((a) => !a.paid).slice(0, 15).map((a) => ({ id: a.id, kimden: a.name || a.who, tutar: a.amt, vade_gun: a.days })));
      c.acik_faturalar = t(() => INV.filter((v) => v.st !== 'odendi').slice(0, 15).map((v) => ({ no: v.no, musteri: v.cust, kalan: ivOpen(v), vade: v.due || null })));
      c.kdv = t(() => { const k = kdvData(PERIOD); return { donem: PERIOD, hesaplanan: Math.round(k.hes), indirilecek: Math.round(k.ind), odenecek: Math.round(k.pay), devreden: Math.round(k.carry), faturasiz_gider_sayisi: k.free }; });
    }
    if (mgr) {
      c.bekleyen_fisler = t(() => RECEIPTS.filter((f) => f.status === 'bekliyor').slice(0, 15).map((f) => ({ id: f.id, satici: f.seller, tarih: f.date, toplam: f.total, kim: (byId(f.by) || {}).name || '' })));
      c.vardiya_bugun = t(() => { const n = new Date(); return EMP_IDS.map((id) => { const s = vdState(n.getFullYear(), n.getMonth(), n.getDate(), id); return { ad: byId(id).name, durum: s.k === 'shift' ? s.t.n + ' ' + s.t.s + '-' + vdEnd(s.t) : s.k === 'leave' ? 'izinli' : s.k === 'off' ? 'haftalık izin' : s.k === 'hol' ? 'tatil' : 'plan yok' }; }); });
    }
    if (r === 'calisan') {
      c.vardiyam = t(() => { const out = []; const n = new Date(); for (let i = 0; i < 7; i++) { const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i); const s = vdState(d.getFullYear(), d.getMonth(), d.getDate(), S.user.id); out.push({ gun: vdYmd(d.getFullYear(), d.getMonth(), d.getDate()), durum: s.k === 'shift' ? s.t.n + ' ' + s.t.s + '-' + vdEnd(s.t) : s.k === 'leave' ? 'izinli' : s.k === 'off' ? 'haftalık izin' : s.k === 'hol' ? 'tatil' : 'plan yok' }); } return out; });
    }
    let s = JSON.stringify(c); if (s.length > 44000) { ['alacaklar', 'acik_faturalar', 'vardiya_bugun'].forEach((k) => { if (JSON.stringify(c).length > 44000) delete c[k]; }); }
    return c;
  };
  const _card = aiActCard;
  aiActCard = function (a, i, j) {
    if (!['borc_ode', 'fis_onayla'].includes(a.type)) return _card(a, i, j);
    if (a.st === 'done') return aiDoneCard(a); if (a.st === 'skip') return '<div class="small muted">Vazgeçildi.</div>';
    const g = a.args || {}; const id = (k) => `aa-${i}-${j}-${k}`;
    if (a.type === 'borc_ode') {
      const d = aiDebtOf(g); if (!d) return `<div class="callout warn">${ic('alert')}<div>Ödenecek borç bulunamadı.</div></div>`;
      if (d.auto) return `<div class="callout warn">${ic('alert')}<div>${esc(d.who)} kalemi otomatik hesaplanıyor. Borçlar sayfasından işaretle.</div></div>`;
      const rest = dbOpen(d); const amt = Number(g.tutar) > 0 ? Math.min(Number(g.tutar), rest) : rest;
      return `<div class="ai-card">${aiHead('wallet', 'Borç ödemesi', esc(d.who) + (d.note ? ' · ' + esc(d.note) : ''))}<div class="ai-pk"><div><small>Kalan borç</small><b>${fmt(rest)}</b></div><div><small>Vade</small><b>${d.due ? esc(isoTxt(d.due)) : '—'}</b></div></div>
      <div class="field"><label for="${id('a')}">Ödenen tutar (₺)</label><input id="${id('a')}" type="text" inputmode="decimal" value="${esc(String(amt).replace('.', ','))}"></div><p class="ai-nt">Bu kayıt banka hareketi değildir; ödemeyi yaptıktan sonra işlenir.</p>${aiBtns(i, j, 'Ödemeyi kaydet')}</div>`;
    }
    const f = RECEIPTS.find((x) => x.id === g.fis_id);
    if (!f || f.status !== 'bekliyor') return `<div class="callout warn">${ic('alert')}<div>Onay bekleyen böyle bir fiş yok.</div></div>`;
    return `<div class="ai-card">${aiHead('receipt', 'Fiş onayı', esc(f.seller) + ' · ' + esc(f.date))}<div class="ai-pk"><div><small>Tutar</small><b>${fmt(f.total)}</b></div><div><small>KDV</small><b>%${f.rate}</b></div><div><small>Yükleyen</small><b>${esc((byId(f.by) || {}).name || '—')}</b></div></div><p class="ai-nt">Onaylanınca muhasebeciye gider.</p>${aiBtns(i, j, 'Onayla')}</div>`;
  };
  const _act = H.aiact2;
  H.aiact2 = async function (el) {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j];
    if (!a || !['borc_ode', 'fis_onayla'].includes(a.type)) return _act.apply(this, arguments);
    if (a.st !== 'open') return; const g = a.args || {};
    if (S.user.role !== 'patron') { toast('Bu işlem için yetkin yok.', 'warn'); return; } if (locked()) return;
    const done = (m) => { a.st = 'done'; a.msg = m; try { aiMemSave(); } catch (e) {} render(); };
    if (a.type === 'borc_ode') {
      const d = aiDebtOf(g); if (!d || d.auto) { toast('Borç bulunamadı.', 'warn'); return; } const amt = trNum((document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-a`) || {}).value); const rest = dbOpen(d);
      if (!(amt > 0)) { toast('Tutarı yaz.', 'warn'); return; } if (amt > rest + 0.005) { toast('Tutar kalandan fazla (' + fmt(rest) + ').', 'warn'); return; }
      dbPay(d, amt, fiIso(), ''); try { pSched(); } catch (e) {} done(d.paid ? d.who + ' borcu tamamen ödendi.' : fmt(amt) + ' ödendi, kalan ' + fmt(dbOpen(d)) + '.'); return;
    }
    const f = RECEIPTS.find((x) => x.id === g.fis_id); if (!f || f.status !== 'bekliyor') { toast('Fiş zaten işlenmiş.', 'warn'); return; }
    f.status = 'musavirde'; done(f.seller + ' fişi onaylandı, muhasebeciye gitti.');
  };
}
function aiDebtOf(g) { const id = String(g.borc_id || ''); let d = id && DEBTS.find((x) => String(x.id) === id && !x.paid); if (!d && g.kime) { const k = mxKey(g.kime); const l = DEBTS.filter((x) => !x.paid && mxKey(x.who) === k); if (l.length === 1) d = l[0]; } return d || null; }
/* her rol için hızlı komutlar */
{
  const _v2 = viewKaisAI;
  viewKaisAI = function () {
    let h = _v2.apply(this, arguments); const r = S.user && S.user.role; if (!r || kaMgr() && r === 'mudur') return h;
    const Q = { patron: [['wallet', 'Geciken ödemeler ve alacaklar'], ['receipt', 'Bu ayki KDV durumu'], ['check', 'Onay bekleyen fişler']], muhasebeci: [['receipt', 'Bu ayki KDV durumu'], ['wallet', 'Geciken ödemeler ve alacaklar'], ['bars', 'Gider dağılımını özetle'], ['check', 'Faturasız gider var mı?']] }[r];
    if (!Q) return h; const row = `<div class="kc-wrap"><div class="kc-lab">${ic('sparkle', 14)} Hızlı sorular</div><div class="kc-row">${Q.map((c) => `<button type="button" class="kc-p" data-a="aiq" data-q="${esc(c[1])}">${ic(c[0], 14)}${esc(c[1])}</button>`).join('')}</div></div>`;
    const m = '<div class="kx-sec"><div class="kx-lab"><b>Sorun</b>'; const i = h.indexOf(m); return i < 0 ? h : (h.indexOf('kc-wrap') >= 0 && r === 'patron' ? h.replace(/(<div class="kc-row">[\s\S]*?)(<\/div><\/div>)/, `$1${Q.map((c) => `<button type="button" class="kc-p" data-a="aiq" data-q="${esc(c[1])}">${ic(c[0], 14)}${esc(c[1])}</button>`).join('')}$2`) : h.slice(0, i) + row + h.slice(i));
  };
}

/* v170: logoya (üst çubuk, yan menü, giriş ekranı) dokununca her zaman ana ekrana git */
if (typeof document !== 'undefined') document.addEventListener('click', (e) => {
  const t = e.target; if (!t || !t.closest) return; const lg = t.closest('.top .mark, .side .brand, .lx-brand, .login .brand'); if (!lg) return;
  e.preventDefault();
  if (S.user) { S.modal = null; try { renderModal(); } catch (x) {} H.nav({ dataset: { v: 'bugun' } }); try { window.scrollTo(0, 0); } catch (x) {} return; }
  S.lgCreate = false; S.sg = null; S.loginErr = ''; S.lgTab = 'own'; render(); try { window.scrollTo(0, 0); } catch (x) {}
});
if (typeof document !== 'undefined') { const css = document.createElement('style'); css.textContent = '.top .mark,.side .brand,.lx-brand,.login .brand{cursor:pointer}'; document.head.appendChild(css); }

/* v171: bilgisayar için bölünmüş modern giriş ekranı + akıllı küçük dokunuşlar */
{
  const css = document.createElement('style'); css.id = 'lx3-css';
  css.textContent = `
.lx3 .lp,.lx3 .lp-ft,.lx3 .lx-sl{display:none}
@media(min-width:1000px){
.login.lx.lx2.lx3{display:grid!important;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);align-items:stretch!important;justify-content:stretch!important;padding:0!important;min-height:100vh!important;background:#F4F7FC!important}
.lx3 .lx-hero{grid-column:1;grid-row:1;max-width:none!important;width:auto!important;padding:44px 60px 36px!important;position:relative!important;overflow:hidden!important;color:#fff;display:flex!important;flex-direction:column!important;gap:26px;background:linear-gradient(150deg,#0C4F9E 0%,#0A3A70 52%,#072B55 100%)!important}
.lx3 .lx-hero::before{display:block!important;content:""!important;position:absolute!important;width:520px!important;height:520px!important;right:-160px!important;top:-140px!important;border-radius:50%;background:radial-gradient(circle,rgba(70,160,255,.38),rgba(70,160,255,0) 68%)!important;pointer-events:none}
.lx3 .lx-hero::after{display:block!important;content:""!important;position:absolute!important;width:420px!important;height:420px!important;left:-120px!important;bottom:-150px!important;border-radius:50%;background:radial-gradient(circle,rgba(46,211,154,.22),rgba(46,211,154,0) 70%)!important;pointer-events:none}
.lx3 .lx-hero>*{position:relative!important;z-index:1}
.lx3 .lx-brand{color:#fff!important;font-size:22px!important}
.lx3 .lx-brand svg{background:rgba(255,255,255,.16)!important;box-shadow:none!important;border:1px solid rgba(255,255,255,.28)}
.lx3 .lx-art,.lx3 .lx2-tag{display:none!important}
.lx3 .lx-hero{justify-content:flex-start;gap:0!important;padding:44px clamp(48px,5vw,84px) 34px!important;background:radial-gradient(circle at 1px 1px,rgba(255,255,255,.07) 1px,transparent 0) 0 0/26px 26px,linear-gradient(155deg,#0D55A8 0%,#093566 50%,#061F40 100%)!important}
.lx3 .lx-copy{display:block!important;margin-top:auto;max-width:none!important;width:100%!important}
.lx3 .lx-copy h2 em{white-space:nowrap}
.lx3 .lx-brand{display:flex!important;align-items:center}
.lx3 .lx-sl{display:inline-flex;align-items:center;margin-left:16px;padding:6px 0 6px 16px;border-left:1px solid rgba(255,255,255,.28);font-style:normal;font-size:13px;font-weight:500;letter-spacing:.25px;color:rgba(255,255,255,.78);white-space:nowrap}
.lx3 .lx-sl::before{content:"";width:6px;height:6px;border-radius:50%;background:#2ED39A;box-shadow:0 0 0 4px rgba(46,211,154,.2);margin-right:10px}
.lx3 .lx-copy h2{font-size:clamp(40px,3.7vw,66px)!important;line-height:1.08!important;letter-spacing:-.025em;color:#fff!important;max-width:680px;font-weight:600;margin:22px 0 0!important}
.lx3 .lx-copy h2 em{font-style:normal;font-weight:700;background:linear-gradient(100deg,#8FD0FF,#5BE5B4);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.lx3 .lx-copy p{font-size:clamp(17px,1.35vw,20px)!important;line-height:1.55!important;font-weight:400;color:rgba(255,255,255,.72)!important;max-width:520px;margin-top:20px!important}
.lx3 .lp{display:grid!important;grid-template-columns:1fr 1fr;gap:14px;max-width:640px;margin-top:38px}
.lx3 .lp-f{display:flex;flex-direction:column;gap:12px;align-items:flex-start;padding:18px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.lx3 .lp-f:last-child:nth-child(odd){grid-column:1/-1}
.lx3 .lp-i{flex:none;width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);display:grid!important;place-items:center;color:#fff}
.lx3 .lp-i svg{width:19px!important;height:19px!important;margin:0!important;display:block!important;position:static!important}
.lx3 .lp-f b{display:block;font-size:15px;font-weight:600;color:#fff;letter-spacing:-.1px}
.lx3 .lp-f span{display:block;font-size:13px;line-height:1.45;color:rgba(255,255,255,.62);margin-top:4px}
.lx3 .lp-pvw{display:block!important;margin-top:14px}
.lx3 .lp-pv{max-width:640px;border-radius:20px;padding:16px 18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.lx3 .lp-ph{display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.6);margin-bottom:12px;letter-spacing:.3px}
.lx3 .lp-k{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.lx3 .lp-k div{background:rgba(255,255,255,.08);border-radius:13px;padding:11px 13px}
.lx3 .lp-k small{display:block;font-size:11.5px;color:rgba(255,255,255,.6)}.lx3 .lp-k b{display:block;font-size:19px;font-weight:600;color:#fff;margin-top:3px;font-variant-numeric:tabular-nums}
.lx3 .lp-k b.up{color:#7BF1C4}
.lx3 .lp-ai{display:flex;gap:10px;align-items:center;margin-top:12px;font-size:13.5px;line-height:1.4;color:#fff;background:rgba(255,255,255,.1);border-radius:13px;padding:10px 12px}
.lx3 .lp-ai i{flex:none;width:24px;height:24px;border-radius:8px;background:#2ED39A;color:#06361f;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:12px}
.lx3 .lp-ft{display:block!important;font-size:12.5px;color:rgba(255,255,255,.5);margin-top:auto;padding-top:34px;text-align:center;width:100%;align-self:center}
.lx3 .lx-card{grid-column:2;grid-row:1;align-self:center!important;justify-self:center!important;max-width:460px!important;width:calc(100% - 64px)!important;margin:40px 32px!important;padding:34px 32px 28px!important}
.lx3 .lx-card h1{font-size:30px!important}
.lx3 .lx-caps{display:none;margin-top:6px;font-size:12.5px;color:#B45309;font-weight:600}
.lx3 .lx-caps.on{display:block}
}
@media(min-width:1000px) and (max-height:900px){.lx3 .lp-pvw{display:none!important}}
@media(min-width:1000px) and (max-height:700px){.lx3 .lp{display:none!important}}
.lx-caps{display:none;margin-top:6px;font-size:12.5px;color:#B45309;font-weight:600}.lx-caps.on{display:block}
.lx-copyr{width:100%;text-align:center;font-size:12.5px;color:#74839A;margin:14px 0 0}@media(min-width:1000px){.lx3 .lx-copyr{display:none}}
`;
  document.head.appendChild(css);
  const FE = {
    own: { h: 'İşletmenizi <em>tek yerden</em> yönetin.', p: 'Fiş, ekip, stok ve tedarik süreçleriniz tek ekranda.', f: [['receipt', 'Fişi fotoğrafla, Kais okusun', 'Tutar, KDV ve kategori kendiliğinden gelir.'], ['users', 'Ekip, vardiya ve izin', 'Plan, talep ve onaylar tek yerde.'], ['box', 'Stok ve tedarik', 'Azalan ürün için sipariş önerisi hazır.'], ['sparkle', 'Kais AI', 'Sorunu yaz, işlemi senin onayına hazırlasın.']] },
    emp: { h: 'Ekibe <em>hoş geldin.</em>', p: 'Vardiyanı, iznini ve görevlerini tek yerden takip et.', f: [['calendar', 'Vardiya planın', 'Hangi gün kaçta, hep elinin altında.'], ['clock', 'İzin ve talepler', 'İzin iste, durumunu anında gör.'], ['check', 'Görevler', 'Bugünün işleri ve tamamladıkların.']] },
  };
  const CPR = '© ' + new Date().getFullYear() + ' KaisPilot. Tüm hakları saklıdır.';
  const _out = loginHTML;
  loginHTML = function () {
    let h = _out.apply(this, arguments); if (S.user || h.indexOf('class="login lx') < 0) return h;
    const k = S.lgTab === 'emp' ? 'emp' : 'own'; const d = FE[k];
    const feats = `<div class="lp">${d.f.map((x) => `<div class="lp-f"><span class="lp-i">${ic(x[0], 20)}</span><div><b>${x[1]}</b><span>${x[2]}</span></div></div>`).join('')}</div>`;
    const pv = k === 'own' ? `<div class="lp lp-pvw"><div class="lp-pv"><div class="lp-ph"><span>Bugün</span><span>Örnek ekran</span></div><div class="lp-k"><div><small>Bu ay gelir</small><b>₺248.600</b></div><div><small>Gider</small><b>₺161.200</b></div><div><small>Onay bekleyen fiş</small><b class="up">3</b></div></div><div class="lp-ai"><i>K</i><span>Süt stoğu azalıyor. Tedarikçiye sipariş hazırlayayım mı?</span></div></div></div>` : '';
    h = h.replace(/<div class="lx-copy">[\s\S]*?<\/div>/, `<div class="lx-copy"><h2>${d.h}</h2><p>${d.p}</p></div>`);
    h = h.replace('</section>', `${feats}${pv}<div class="lp-ft">${CPR}</div></section>`);
    h = h.replace(/<\/section><\/div>$/, `</section><p class="lx-copyr">${CPR}</p></div>`);
    h = h.replace(/(<div class="lx-brand">[\s\S]*?<span>KaisPilot<\/span>)/, '$1<i class="lx-sl">Yöneten Siz, Kolaylaştıran Kais</i>');
    if (k === 'emp' && S.lgCreate) h = h.replace(/<h1>Giriş yap<\/h1>(\s*<p class="lx-sub"[^>]*>)[^<]*/, '<h1>Ekibe katıl</h1>$1Davet koduyla hesabını oluştur');
    h = h.replace(/<div class="login lx([^"]*)"/, '<div class="login lx$1 lx3"');
    h = h.replace(/(<div class="lx-in">(?:(?!<\/div>)[\s\S])*?id="(?:id|sg)-pw"[\s\S]*?<\/div>)/, '$1<div class="lx-caps" role="status">Caps Lock açık</div>');
    return h;
  };
  const _tab = H.lgtab; H.lgtab = function (el) { try { localStorage.setItem('kp_tab', el.dataset.v === 'emp' ? 'emp' : 'own'); } catch (e) {} return _tab.apply(this, arguments); };
  const _in = H.idin; H.idin = function () { try { const e = (document.getElementById('id-em') || {}).value; if (e && /^\S+@\S+$/.test(e.trim())) localStorage.setItem('kp_em', e.trim()); } catch (x) {} return _in.apply(this, arguments); };
  try { if (!S.lgEm) S.lgEm = localStorage.getItem('kp_em') || ''; if (!S.lgTab && localStorage.getItem('kp_tab') === 'emp' && !/[?&]kod=/.test(location.search)) S.lgTab = 'emp'; } catch (e) {}
  const _rn = render;
  render = function () { _rn.apply(this, arguments); try { if (!S.user && window.matchMedia && matchMedia('(min-width:1000px)').matches && !S.lgCreate && !(document.activeElement && document.activeElement.tagName === 'INPUT')) setTimeout(() => { const em = document.getElementById('id-em'); const pw = document.getElementById('id-pw'); const t = em && em.value ? pw : em; if (t && !(document.activeElement && document.activeElement.tagName === 'INPUT')) t.focus(); }, 40); } catch (e) {} };
  document.addEventListener('keydown', (e) => { const t = e.target; if (!t || !t.id || !/^(id|sg)-pw$/.test(t.id) || !e.getModifierState) return; const c = t.closest('.lx-f, .lx-in'); const box = c && (c.parentElement || c).querySelector('.lx-caps'); if (box) box.classList.toggle('on', e.getModifierState('CapsLock')); });
}

/* v173: betikler ağdan sırayla yüklenirken ilk çizim eski giriş ekranıyla kalabiliyordu; tüm betikler gelince bir kez yeniden çiz */
if (typeof window !== 'undefined') {
  const lastPaint = () => { try { if (!S.user && !S.modal && !Array.from(document.querySelectorAll('input')).some((i) => i.value && i.id !== 'id-em')) { const e = document.getElementById('id-em'); if (e && e.value) S.lgEm = e.value; render(); } } catch (e) {} };
  setTimeout(lastPaint, 0);
  if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(lastPaint, 50)); else setTimeout(lastPaint, 50);
}

/* v177: Kais AI: yeni işlemler (görev, vardiya taslağı, alacak tahsilatı), "Neden?" gerekçesi, Geri al, hafıza yönetimi */
AI_TYPES.push('gorev_ver', 'vardiya_taslak', 'alacak_tahsil');
{
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const norm = (a) => {
    const g = a.args || {};
    if (a.type === 'gorev_ver' && g.gorev != null) {
      const k = String(g.kime || 'herkes'); const all = /herkes|hepsi|tüm|tum|ekip/i.test(k) || !k.trim(); const p = all ? [] : aiPeople([k]);
      a.args = { t: String(g.gorev || '').trim().slice(0, 200), uid: all ? 'all' : (p[0] || ''), due: ISO.test(g.son_gun || '') && g.son_gun >= REF_ISO ? g.son_gun : REF_ISO, neden: g.neden };
    }
    if (a.type === 'vardiya_taslak' && g.ay != null) {
      const m = /^(\d{4})-(\d{2})$/.exec(String(g.ay)); const d = new Date(REF_ISO);
      a.args = { y: m ? +m[1] : d.getFullYear(), m: m ? +m[2] - 1 : d.getMonth(), neden: g.neden };
    }
  };
  const recvOf = (g) => { const id = String(g.alacak_id || ''); let r = id && RECV.find((x) => x.id === id && !x.paid); if (!r && g.kimden) { const k = mxKey(g.kimden); const l = RECV.filter((x) => !x.paid && mxKey(x.name || x.who || '') === k); if (l.length === 1) r = l[0]; } return r || null; };
  const snap = (a) => {
    const g = a.args || {};
    if (a.type === 'duyuru_gonder') { const n = MSGS.length; return () => { if (MSGS.length > n) { const m = MSGS[MSGS.length - 1]; return () => { const i = MSGS.indexOf(m); if (i >= 0) MSGS.splice(i, 1); }; } }; }
    if (a.type === 'rezervasyon_ekle') { const n = RESV.length; return () => { if (RESV.length > n) { const r = RESV[RESV.length - 1]; return () => { const i = RESV.indexOf(r); if (i >= 0) RESV.splice(i, 1); }; } }; }
    if (a.type === 'rezervasyon_durum') { const r = RESV.find((x) => x.id === g.rezervasyon_id); const st = r && r.st; return () => r && r.st !== st ? () => { r.st = st; } : null; }
    if (a.type === 'fis_onayla') { const f = RECEIPTS.find((x) => x.id === g.fis_id); const st = f && f.status; return () => f && f.status !== st ? () => { f.status = st; } : null; }
    if (a.type === 'borc_ode') { const d = aiDebtOf(g); const n = d && d.pays ? d.pays.length : 0; return () => { if (d && d.pays && d.pays.length > n) { const p = d.pays[d.pays.length - 1]; return () => { d.pays = d.pays.filter((x) => x !== p); d.paid = false; delete d.paidAt; try { pSched(); } catch (e) {} }; } }; }
    if (a.type === 'gorev_ver') { const top = TASKS[0] && TASKS[0].id; return () => { const t = TASKS[0]; if (t && t.id !== top) return () => { const i = TASKS.indexOf(t); if (i >= 0) TASKS.splice(i, 1); }; }; }
    return null;
  };
  ['aiact2', 'aiact'].forEach((nm) => {
    const _o = H[nm];
    H[nm] = async function (el) {
      const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (!a || a.st !== 'open') return _o.apply(this, arguments);
      norm(a);
      if (a.type === 'alacak_tahsil') {
        if (S.user.role !== 'patron') { toast('Bu işlem için yetkin yok.', 'warn'); return; } if (locked()) return;
        const r = recvOf(a.args || {}); if (!r) { toast('Alacak bulunamadı ya da zaten tahsil edilmiş.', 'warn'); return; }
        r.paid = true; try { pSched(); } catch (e) {} a.undo = () => { r.paid = false; try { pSched(); } catch (e) {} };
        a.st = 'done'; a.msg = (r.name || r.who || 'Alacak') + ' alacağı tahsil edildi olarak işaretlendi.'; try { aiMemSave(); } catch (e) {} render(); return;
      }
      const post = snap(a); const r = await _o.apply(this, arguments);
      if (a.st === 'done' && post) { try { const u = post(); if (u) { a.undo = u; render(); } } catch (e) {} }
      return r;
    };
  });
  H.aiundo = (el) => {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (!a || a.st !== 'done' || typeof a.undo !== 'function') return;
    if (locked()) return; try { a.undo(); } catch (e) { toast('Geri alınamadı.', 'warn'); return; }
    a.undo = null; a.st = 'undone'; try { pSched(); aiMemSave(); } catch (e) {} render(); toast('İşlem geri alındı.', 'ok');
  };
  const _card = aiActCard;
  aiActCard = function (a, i, j) {
    try { norm(a); } catch (e) {}
    if (a.st === 'undone') return `<div class="small muted">↩ Geri alındı: ${esc(a.msg || '')}</div>`;
    if (a.st === 'done' && typeof a.undo === 'function') return aiDoneCard(a) + `<div class="ai-bt"><button class="btn sm sec" data-a="aiundo" data-i="${i}" data-j="${j}">Geri al</button></div>`;
    let h;
    if (a.type === 'alacak_tahsil') {
      if (a.st === 'done') return aiDoneCard(a); if (a.st === 'skip') return '<div class="small muted">Vazgeçildi.</div>';
      const r = recvOf(a.args || {});
      h = !r ? `<div class="callout warn">${ic('alert')}<div>Tahsil edilecek alacak bulunamadı.</div></div>`
        : `<div class="ai-card">${aiHead('wallet', 'Alacak tahsilatı', esc(r.name || r.who || '') + (r.note ? ' · ' + esc(r.note) : ''))}<div class="ai-pk"><div><small>Tutar</small><b>${fmt(r.amt)}</b></div><div><small>Durum</small><b>${r.days < 0 ? Math.abs(r.days) + ' gün gecikmiş' : r.days + ' gün var'}</b></div></div><p class="ai-nt">Parayı aldıktan sonra onayla. Bu kayıt banka hareketi değildir.</p>${aiBtns(i, j, 'Tahsil edildi')}</div>`;
    } else h = _card(a, i, j);
    const why = a.args && String(a.args.neden || '').trim();
    if (a.st === 'open' && why && h && h.indexOf('callout warn') < 0) h += `<details class="ai-why"><summary>Neden?</summary><p>${esc(why.slice(0, 300))}</p></details>`;
    return h;
  };
  /* hafıza yönetimi */
  H.aimem = () => { S.modal = { type: 'aimem' }; renderModal(); };
  NEWM.aimem = () => { const n = AIC.notes || []; return sheet('Kais hafızası', `<p class="muted small">Kais bunları hatırlar ve önerilerinde kullanır. Notlar cihazlar arasında eşlenir.</p>
    <div class="stack" style="gap:6px">${n.length ? n.map((x, i) => `<div class="logline"><span>${esc(x)}</span><button class="btn sm sec" data-a="aimemdel" data-n="${i}" aria-label="Notu sil">Sil</button></div>`).join('') : '<p class="small muted">Henüz not yok. Sohbette "bunu hatırla" demen yeterli.</p>'}</div>
    <div class="field" style="margin-top:12px"><label for="am-new">Yeni not</label><input id="am-new" type="text" maxlength="300" placeholder="Örn. Süt hep Ahmet'ten alınır"></div><button class="btn block" data-a="aimemadd">Hafızaya ekle</button>`); };
  H.aimemdel = (el) => { const n = (AIC.notes || []).slice(); n.splice(+el.dataset.n, 1); AIC.notes = n; aiMemSave(); try { kmSched(); } catch (e) {} renderModal(); render(); };
  H.aimemadd = () => { const e = document.getElementById('am-new'); const t = String((e && e.value) || '').trim().slice(0, 300); if (!t) { toast('Notu yaz.', 'warn'); return; } AIC.notes = (AIC.notes || []).concat([t]).slice(-30); aiMemSave(); try { kmSched(); } catch (x) {} renderModal(); render(); toast('Hafızaya eklendi.', 'ok'); };
  const _v = viewKaisAI;
  viewKaisAI = function () {
    const h = _v.apply(this, arguments); return h.replace(/(<div class="ai-mem">[\s\S]*?)(<\/div>)/, '$1<button data-a="aimem">Hafızayı yönet</button>$2');
  };
  const css = document.createElement('style'); css.textContent = '.ai-why{margin:6px 2px 0;font-size:13px;color:var(--mut,#5b6b82)}.ai-why summary{cursor:pointer;font-weight:600}.ai-why p{margin:6px 0 0;line-height:1.45}';
  document.head.appendChild(css);
}

/* v178: davet mesajına tek dokunuşla açılan bağlantı da eklenir */
H.invcopy = () => { if (S.modal && S.modal.code) cpy(invText(S.modal.code) + '\nTek dokunuşla aç: ' + ivLink(S.modal.code), 'Mesaj kopyalandı. WhatsApp\'tan gönder.'); };

/* v179: hesap açarken şartlar ve KVKK için onay kutusu (davetle katılımda da) */
{
  const css = document.createElement('style');
  css.textContent = '.kb-cons{display:flex;gap:10px;align-items:flex-start;margin:10px 0 2px;font-size:13.5px;line-height:1.5;color:#4C5E78;cursor:pointer;text-align:left}.kb-cons input{flex:none;width:20px;height:20px;margin:1px 0 0;accent-color:#1553b0;cursor:pointer}.kb-cons.err{color:#B42318}.kb-cons.err input{outline:2px solid #B42318;outline-offset:1px}';
  document.head.appendChild(css);
  const _l = loginHTML;
  loginHTML = function () {
    let h = _l.apply(this, arguments);
    return h.replace(/<p class="lg-ok">Hesap açarak [\s\S]*?<\/p>/, '<label class="kb-cons"><input type="checkbox" id="id-kabul"><span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım sözleşmesinı</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label>');
  };
  const _n = H.idnew;
  H.idnew = function () {
    const k = document.getElementById('id-kabul');
    if (k && !k.checked) { const l = k.closest('.kb-cons'); if (l) l.classList.add('err'); toast('Devam etmek için şartları ve KVKK metnini kabul etmelisin.', 'warn'); try { k.focus(); } catch (e) {} return; }
    return _n.apply(this, arguments);
  };
  document.addEventListener('change', (e) => { const t = e.target; if (t && (t.id === 'id-kabul' || t.id === 'sg-kabul' || t.id === 'sg-kabulj')) { const l = t.closest('.kb-cons'); if (l && t.checked) l.classList.remove('err'); } });
}

/* v179b: şartlar ve KVKK onayının kaydı (admin panelinde görünür) */
const LEGAL_VER = '2026-11-17';
const CK = 'kp_consent_pend';
function consentMark(kind, email) { try { localStorage.setItem(CK, JSON.stringify({ kind, email: String(email || '').toLowerCase(), at: Date.now(), ua: String(navigator.userAgent || '').slice(0, 180) })); } catch (e) {} }
async function consentFlush() {
  let p; try { p = JSON.parse(localStorage.getItem(CK) || 'null'); } catch (e) { p = null; } if (!p) return;
  if (Date.now() - p.at > 864e5) { try { localStorage.removeItem(CK); } catch (e) {} return; }
  const c = sbOK() && sbClient(); if (!c || !SBS.user || !SBS.user.email || String(SBS.user.email).toLowerCase() !== p.email) return;
  try {
    const r = await c.from('consents').insert({ user_id: SBS.user.id, business_id: (SBS.biz && SBS.biz.id) || null, email: SBS.user.email, kind: p.kind, ver: LEGAL_VER, docs: { kullanim: LEGAL_VER, kvkk: LEGAL_VER }, ua: p.ua });
    if (!r.error || r.error.code === '23505') localStorage.removeItem(CK);
  } catch (e) {}
}
{
  const _sg = H.sgnext;
  H.sgnext = function () { const before = S.sg && S.sg.step; const r = _sg.apply(this, arguments); try { if (before === 3 && S.sg && S.sg.kabul) consentMark(SBS.user && SBS.user.email && !S.sg.em ? 'google' : 'kurulum', S.sg.em || (SBS.user && SBS.user.email)); } catch (e) {} return r; };
  const _jn = H.idnew;
  H.idnew = function () { const k = document.getElementById('id-kabul'); const em = (document.getElementById('id-em') || {}).value; if (k && k.checked && em) consentMark('davet', em); return _jn.apply(this, arguments); };
  const _lb = sbLoadBiz;
  sbLoadBiz = async function () { const r = await _lb.apply(this, arguments); consentFlush(); return r; };
}

/* v183: şehir alanı için modern açılır liste (tarayıcının eski datalist'i yerine) */
{
  const css = document.createElement('style');
  css.textContent = '.cx-dp{position:fixed;z-index:9999;background:#fff;border:1px solid #D3DCE8;border-radius:18px;box-shadow:0 18px 40px rgba(15,40,80,.20);padding:8px 6px;max-height:236px;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;animation:cxin .14s ease-out}@keyframes cxin{from{opacity:0;transform:translateY(-4px) scale(.985)}to{opacity:1;transform:none}}.cx-h{padding:4px 12px 6px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8895A9}.cx-i{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 12px;border-radius:12px;font-size:16px;color:var(--ink,#0F2850);cursor:pointer}.cx-i svg{width:20px;height:20px;flex:none;color:#7C8CA3}.cx-i span{flex:1;min-width:0}.cx-i mark{background:none;color:var(--cini,#0D56A6);font-weight:800}.cx-i:hover,.cx-i.on{background:#EAF1FB}.cx-i.on svg,.cx-i:hover svg{color:var(--cini,#0D56A6)}.cx-i.sel{background:#CFE0F8;font-weight:700;color:var(--cini-d,#0A3E80)}.cx-e{padding:16px;text-align:center;color:#8895A9;font-size:14px}';
  document.head.appendChild(css);
  const fold = (s) => String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  let dp = null, cur = null, idx = -1, items = [];
  const close = () => { if (dp) { dp.remove(); dp = null; } cur = null; idx = -1; };
  const pos = () => { if (!dp || !cur) return; const r = (cur.parentElement || cur).getBoundingClientRect(); const below = innerHeight - r.bottom; dp.style.left = r.left + 'px'; dp.style.width = r.width + 'px'; if (below < 250 && r.top > below) { dp.style.top = ''; dp.style.bottom = (innerHeight - r.top + 6) + 'px'; } else { dp.style.bottom = ''; dp.style.top = (r.bottom + 6) + 'px'; } };
  const pick = (v) => { if (!cur) return; cur.value = v; cur.dispatchEvent(new Event('input', { bubbles: true })); close(); };
  const hi = () => { if (!dp) return; dp.querySelectorAll('.cx-i').forEach((e, i) => e.classList.toggle('on', i === idx)); const e = dp.querySelectorAll('.cx-i')[idx]; if (e && e.scrollIntoView) e.scrollIntoView({ block: 'nearest' }); };
  const show = (inp) => {
    const q = fold(inp.value.trim()); const all = (typeof PF_IL !== 'undefined' ? PF_IL : []);
    items = q ? all.filter((x) => fold(x).startsWith(q)).concat(all.filter((x) => !fold(x).startsWith(q) && fold(x).indexOf(q) >= 0)) : all.slice();
    if (!dp) { dp = document.createElement('div'); dp.className = 'cx-dp'; dp.setAttribute('role', 'listbox'); document.body.appendChild(dp); dp.addEventListener('mousedown', (e) => { e.preventDefault(); const t = e.target.closest('.cx-i'); if (t) pick(t.dataset.v); }); dp.addEventListener('touchstart', () => {}, { passive: true }); }
    cur = inp; idx = -1;
    const mk = (x) => { const k = fold(x), i = q ? k.indexOf(q) : -1; return i < 0 ? esc(x) : esc(x.slice(0, i)) + '<mark>' + esc(x.slice(i, i + q.length)) + '</mark>' + esc(x.slice(i + q.length)); };
    dp.innerHTML = items.length ? (q ? '' : '<div class="cx-h">Şehir seç</div>') + items.map((x) => '<div class="cx-i' + (fold(x) === fold(inp.value) ? ' sel' : '') + '" role="option" data-v="' + esc(x) + '">' + pfIc('pin') + '<span>' + mk(x) + '</span></div>').join('') : '<div class="cx-e">Sonuç yok. Yazdığın şehir olduğu gibi kaydedilir.</div>';
    pos(); const sl = dp.querySelector('.cx-i.sel'); if (sl && !q) dp.scrollTop = Math.max(0, sl.offsetTop - 60);
  };
  const isIl = (t) => t && t.tagName === 'INPUT' && (t.id === 'sg-il' || t.id === 'pf-il');
  document.addEventListener('focusin', (e) => { if (isIl(e.target)) { e.target.removeAttribute('list'); show(e.target); } });
  document.addEventListener('input', (e) => { if (isIl(e.target)) { e.target.removeAttribute('list'); show(e.target); } });
  document.addEventListener('click', (e) => { if (isIl(e.target)) { if (!dp) show(e.target); } });
  document.addEventListener('focusout', (e) => { if (isIl(e.target)) setTimeout(close, 120); });
  document.addEventListener('keydown', (e) => {
    if (!dp || !isIl(e.target)) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(items.length - 1, idx + 1); hi(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); hi(); }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); pick(items[idx]); }
    else if (e.key === 'Escape') { close(); }
  });
  addEventListener('resize', pos); document.addEventListener('scroll', pos, true);
}
