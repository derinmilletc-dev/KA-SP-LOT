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
    const r = await c.rpc('plan_get', { bid: SBS.biz.id || SBS.biz }); if (r.error || !r.data) return;
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
const PF_SUBE = ['Tek şube', '2–3 şube', '4+ şube'];
const PF_YON = ['Defter / kâğıt', 'Excel', 'Başka bir program', 'Hiçbiri, yeni başlıyorum'];
const PF_ZAMAN = ['Fiş ve muhasebe', 'Stok ve sipariş', 'Vardiya ve puantaj', 'Maaş ve bordro', 'Rezervasyon ve müşteri', 'Satış ve kasa'];
const ZAMAN_MOD = { 'Stok ve sipariş': ['Stok', 'Tedarik'], 'Vardiya ve puantaj': ['Duyuru ve vardiya'], 'Maaş ve bordro': ['Bordro ve maaş'], 'Rezervasyon ve müşteri': ['Müşteri ve rezervasyon'], 'Satış ve kasa': ['Satış (POS)'] };
const sgI = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SG_IC = { receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>', box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', wallet: '<path d="M4 7a2 2 0 0 1 2-2h11v3"/><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="16.5" cy="13.5" r="1.2"/>', cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>', cart: '<path d="M3 4h2.5l2 11h10l2-8H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="16.5" cy="19" r="1.3"/>', truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>', mega: '<path d="M4 10v4l12 5V5z"/><path d="M16 9a3 3 0 0 1 0 6M7 15v4"/>' };
const SG_ZI = { 'Fiş ve muhasebe': 'receipt', 'Stok ve sipariş': 'box', 'Vardiya ve puantaj': 'clock', 'Maaş ve bordro': 'wallet', 'Rezervasyon ve müşteri': 'cal', 'Satış ve kasa': 'cart' };
const SG_ZD = { 'Fiş ve muhasebe': 'Fiş, KDV, gelir-gider', 'Stok ve sipariş': 'Sayım, tedarik, fire', 'Vardiya ve puantaj': 'Plan, giriş-çıkış', 'Maaş ve bordro': 'Maaş, izin, avans', 'Rezervasyon ve müşteri': 'Masa, müşteri, kampanya', 'Satış ve kasa': 'Kasa, günlük ciro' };
const SG_MI = { 'Stok': 'box', 'Satış (POS)': 'cart', 'Tedarik': 'truck', 'Bordro ve maaş': 'wallet', 'Müşteri ve rezervasyon': 'cal', 'Duyuru ve vardiya': 'mega' };
function sgTiles(g, list, sel, icons, desc, chip) { return `<div class="pf-cs sg-tg${chip ? ' sg-fl' : ''}" data-grp="${g}" data-multi="1">${list.map((x) => `<button type="button" class="pf-c sg-t${sel.includes(x) ? ' on' : ''}" data-a="pfchip" data-g="${g}" data-v="${esc(x)}" aria-pressed="${sel.includes(x) ? 'true' : 'false'}"><i class="sg-ti">${sgI(SG_IC[icons[x]] || SG_IC.box)}</i><b>${esc(x)}</b><u class="sg-tk"></u></button>`).join('')}</div>`; }
const sgNameOf = () => { const u = SBS.user; const m = (u && u.user_metadata) || {}; return String(m.full_name || m.name || '').trim(); };
S.sg = S.sg || null;
function sgInit() { S.sg = { step: SBS.user ? 2 : 1, name: sgNameOf(), em: S.lgEm || '', pw: '', biz: '', tur: '', il: '', cal: '', sube: '', yontem: '', zaman: [], mods: [], muh: '', kabul: false, pazar: false }; }
function sgSnap() {
  if (!S.sg) return; const g = (id) => { const e = document.getElementById(id); return e ? e.value : undefined; };
  const set = (k, v) => { if (v !== undefined) S.sg[k] = String(v).trim(); };
  set('name', g('sg-name')); set('em', g('sg-em')); if (g('sg-pw') !== undefined) S.sg.pw = g('sg-pw'); set('biz', g('sg-biz')); set('il', g('sg-il'));
  if (document.getElementById('id-tur')) S.sg.tur = g('id-tur') || '';
  if (document.querySelector('[data-grp="cal"]')) S.sg.cal = pfOn('cal')[0] || ''; if (document.querySelector('[data-grp="muh"]')) S.sg.muh = pfOn('muh')[0] || '';
  if (document.querySelector('[data-grp="mods"]')) S.sg.mods = pfOn('mods');
  if (document.querySelector('[data-grp="sube"]')) S.sg.sube = pfOn('sube')[0] || ''; if (document.querySelector('[data-grp="yontem"]')) S.sg.yontem = pfOn('yontem')[0] || ''; if (document.querySelector('[data-grp="zaman"]')) S.sg.zaman = pfOn('zaman');
  { const k = document.getElementById('sg-kabul'); if (k) S.sg.kabul = k.checked; const z = document.getElementById('sg-pazar'); if (z) S.sg.pazar = z.checked; }
}
const sgErr = (t) => { S.loginErr = t; const e = document.getElementById('sg-err'); if (e) e.textContent = t; };
lxCreate = function () {
  if (!S.sg) sgInit(); const s = S.sg, st = s.step, g = !!SBS.user, nm = esc(s.name.split(' ')[0] || '');
  const fld = (lab, id, ico, inner) => `<div class="lx-f"><label for="${id}">${lab}</label><div class="lx-in">${ico}${inner}</div></div>`;
  const pg = `<div class="sg-pg" aria-label="Adım ${st} / 4">${[1, 2, 3, 4].map((i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>`;
  const titles = { 1: ['Hesabını oluştur', 'Başlamak 1 dakikanı almaz.'], 2: [g && nm ? 'Merhaba ' + nm + ', işletmeni tanıyalım' : 'İşletmeni tanıyalım', 'Sana uygun kurulumu hazırlayacağız.'], 3: ['İşin nasıl yürüyor?', 'Birkaç soruyla Kais seni daha iyi tanısın.'], 4: ['Son dokunuş', 'Sana özel kurulumu hazırladık, sonradan değiştirebilirsin.'] };
  let body = '';
  if (st === 1) body = `${sgGoogleBtn()}<div class="sg-or"><span>veya e-posta ile</span></div>${fld('Ad soyad', 'sg-name', pfIc('user'), `<input id="sg-name" type="text" autocomplete="name" placeholder="Adınız ve soyadınız" value="${esc(s.name)}">`)}
    ${fld('E-posta', 'sg-em', LXI.mail, `<input id="sg-em" type="email" autocomplete="username" inputmode="email" autocapitalize="none" placeholder="e-posta@firma.com" value="${esc(s.em)}">`)}
    ${fld('Şifre', 'sg-pw', LXI.lock, `<input id="sg-pw" type="password" autocomplete="new-password" placeholder="En az 8 karakter" value="${esc(s.pw)}"><button type="button" class="lx-eye" data-a="pwtog" aria-label="Şifreyi göster veya gizle">${LXI.eye}</button>`)}<div class="sg-ok${s.pw.length >= 8 ? ' y' : ''}" id="sg-pwh">${s.pw.length >= 8 ? 'Şifre uygun.' : 'En az 8 karakter.'}</div>`;
  else if (st === 2) body = `${g ? `<div class="sg-hi">${LXI.mail}<div><b>${esc(SBS.user.email || 'Hesabın')}</b><span class="small muted">ile giriş yapıldı</span></div></div>` : ''}
    ${fld('İşletme adı', 'sg-biz', pfIc('store'), `<input id="sg-biz" type="text" autocomplete="organization" placeholder="İşletme adınızı yazın" value="${esc(s.biz)}">`)}
    <div class="lx-f"><label>Hangi sektördesin?</label>${ddHTML(s.tur, 'İşletme türünüzü seçin')}</div>
    ${fld('Şehir <span class="lx-opt">isteğe bağlı</span>', 'sg-il', pfIc('store'), `<input id="sg-il" autocomplete="off" placeholder="Şehir yaz ya da seç" value="${esc(s.il)}">`)}`;
  else if (st === 3) body = `<div class="lx-f"><label>Kaç kişi çalışıyor?</label>${pfChips('cal', PF_CAL, s.cal, false)}</div>
    <div class="lx-f"><label>Kaç şubeniz var?</label>${pfChips('sube', PF_SUBE, s.sube, false)}</div>
    <div class="lx-f"><label>İşleri şu an nasıl takip ediyorsun?</label>${pfChips('yontem', PF_YON, s.yontem, false)}</div>
    <div class="lx-f"><label>Muhasebecin var mı?</label>${pfChips('muh', PF_MUH, s.muh, false)}</div>`;
  else body = `<div class="sg-sum"><i class="sg-av">${esc((s.biz || 'K').trim().charAt(0).toLocaleUpperCase('tr'))}</i><div class="sg-sb"><b>${esc(s.biz || 'İşletmen')}</b><div class="sg-ch">${[s.tur, s.il, s.cal].filter(Boolean).map((x) => `<em>${esc(x)}</em>`).join('')}</div></div></div>
    <div class="sg-sec"><h3>En çok neye zaman harcıyorsun?</h3><p>Birden fazla seçebilirsin. Kais bunları öne çıkarır ve ilgili bölümleri açar.</p>${sgTiles('zaman', PF_ZAMAN, s.zaman, SG_ZI)}</div>
    <div class="sg-sec"><h3>Kullanacağın bölümler</h3><p>Sektörüne göre seçtik. Sonradan Ayarlar'dan değiştirirsin.</p>${sgTiles('mods', PF_MOD, s.mods, SG_MI, null, true)}</div>
    <div class="sg-cc"><label class="sg-ck kb-cons"><input type="checkbox" id="sg-kabul"${s.kabul ? ' checked' : ''}><i class="sg-bx"></i><span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım sözleşmesini</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label>
    <label class="sg-ck sg-opt"><input type="checkbox" id="sg-pazar"${s.pazar ? ' checked' : ''}><i class="sg-bx"></i><span>Ürün haberleri, ipuçları ve kampanyaları e-posta ve bildirimle almak istiyorum <b>İsteğe bağlı</b><small>İstediğin zaman kaispilot@gmail.com adresine yazarak vazgeçebilirsin.</small></span></label></div>`;
  const back = st > (g ? 2 : 1) ? `<button type="button" class="lx-alt" data-a="sgback"><b>Geri</b></button>` : '';
  const nextLbl = st === 4 ? 'İşletmeyi oluştur' : 'Devam';
  const foot = st === 1 ? `<p class="lx-crb">Zaten hesabın var mı? <button type="button" class="lx-link" data-a="sgexit">Giriş yap</button></p>` : g ? `<p class="lx-crb">Davet koduyla mı katılacaksın? <button type="button" class="lx-link" data-a="sgjoin">Kodu gir</button> · <button type="button" class="lx-link" data-a="idout">Çıkış yap</button></p>` : '';
  return `<div class="login lx"><section class="lx-hero"><div class="lx-brand">${lxMark(40)}<span>KaisPilot</span></div><div class="lx-copy"><h2>İşletmenizi tek yerden yönetin.</h2><p>Fiş, ekip, stok ve tedarik süreçlerinizi tek ekrandan kontrol edin.</p></div>${lxArt()}</section>
  <section class="lx-card"><div class="lx-cin"><form id="sgform" class="lx-form lx-cr" novalidate>${pg}<div class="sg-st">Adım ${st} / 4</div><h1>${titles[st][0]}</h1><p class="lx-sub" style="margin-bottom:12px">${titles[st][1]}</p>
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
  else if (s.step === 3) { /* hepsi isteğe bağlı */ }
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
    PEND.prof = { tur: s.tur, il: s.il, cal: s.cal, muh: s.muh, sube: s.sube, yontem: s.yontem, zaman: (s.zaman || []).slice(), mods: (s.mods || []).slice() };
    if (!ID.mems.length) {
      const i = await c.from('businesses').insert({ name: s.biz, owner_id: SBS.user.id }); if (i.error) throw i.error;
      freshBiz(s.biz, s.name || sgNameOf() || 'Patron'); applyNames(); await sbLoadBiz();
    }
    ID.busy = false; S.sg = null; S.lgCreate = false; try { sessionStorage.removeItem('kp_lg'); } catch (e) {}
    if (ID.mems.length > 1 && !ID.active) { render(); return; } await idEnter(); try { profPend(); } catch (e) {} render();
  } catch (e) { ID.busy = false; sgErr(idMsg(e)); }
}
profPend = function () {
  const p = PEND.prof; if (p) { if (!PROF.tur && !PROF.il && !PROF.cal && !PROF.muh && !(PROF.mods && PROF.mods.length)) Object.assign(PROF, { tur: p.tur || '', il: p.il || '', cal: p.cal || '', muh: p.muh || '', sube: p.sube || '', yontem: p.yontem || '', zaman: p.zaman || [], mods: p.mods || [] }); PEND.prof = null; pSched(); }
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
      <label class="kb-cons"><input type="checkbox" id="sg-kabulj"><span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım sözleşmesini</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label>
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
    h = h.replace(/<\/section><\/div>$/, `</section><p class="lx-copyr">© ${new Date().getFullYear()} KaisPilot</p></div>`);
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
    return h.replace(/<p class="lg-ok">Hesap açarak [\s\S]*?<\/p>/, '<label class="kb-cons"><input type="checkbox" id="id-kabul"><span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım sözleşmesini</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum.</span></label>');
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
function consentMark(kind, email, pazar) { try { localStorage.setItem(CK, JSON.stringify({ kind, pazar: !!pazar, email: String(email || '').toLowerCase(), at: Date.now(), ua: String(navigator.userAgent || '').slice(0, 180) })); } catch (e) {} }
async function consentFlush() {
  let p; try { p = JSON.parse(localStorage.getItem(CK) || 'null'); } catch (e) { p = null; } if (!p) return;
  if (Date.now() - p.at > 864e5) { try { localStorage.removeItem(CK); } catch (e) {} return; }
  const c = sbOK() && sbClient(); if (!c || !SBS.user || !SBS.user.email || String(SBS.user.email).toLowerCase() !== p.email) return;
  try {
    const r = await c.from('consents').insert({ user_id: SBS.user.id, business_id: (SBS.biz && SBS.biz.id) || null, email: SBS.user.email, kind: p.kind, ver: LEGAL_VER, docs: { kullanim: LEGAL_VER, kvkk: LEGAL_VER }, ua: p.ua });
    if (!r.error || r.error.code === '23505') {
      if (p.pazar) { try { await c.from('consents').insert({ user_id: SBS.user.id, business_id: (SBS.biz && SBS.biz.id) || null, email: SBS.user.email, kind: 'pazarlama', ver: LEGAL_VER, docs: { ticari_ileti: LEGAL_VER }, ua: p.ua }); } catch (e) {} }
      localStorage.removeItem(CK);
    }
  } catch (e) {}
}
{
  const _sg = H.sgnext;
  H.sgnext = function () { const before = S.sg && S.sg.step; const r = _sg.apply(this, arguments); try { if (before === 4 && S.sg && S.sg.kabul) consentMark(SBS.user && SBS.user.email && !S.sg.em ? 'google' : 'kurulum', S.sg.em || (SBS.user && SBS.user.email), S.sg.pazar); } catch (e) {} return r; };
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

/* v188: kayıt adım 4/4: akıllı sorular, özet kartı, isteğe bağlı pazarlama onayı */
{
  const css = document.createElement('style');
  css.textContent = '.kb-opt{margin-top:6px;padding:10px 12px;border-radius:12px;background:#F4F7FB;border:1px dashed #C9D6E8}.kb-opt em{display:block;font-style:normal;font-size:12px;color:#74839A;margin-top:2px}';
  document.head.appendChild(css);
  const _pc = H.pfchip;
  H.pfchip = function (el) { const r = _pc.apply(this, arguments); try { if (el.dataset.g === 'zaman' && el.classList.contains('on')) (ZAMAN_MOD[el.dataset.v] || []).forEach((m) => { const b = document.querySelector('[data-grp="mods"] .pf-c[data-v="' + m + '"]'); if (b) b.classList.add('on'); }); } catch (e) {} return r; };
  const _ac = aiContext;
  aiContext = function () { const c = _ac.apply(this, arguments); try { c.profil = { sektor: PROF.tur || undefined, sehir: PROF.il || undefined, calisan: PROF.cal || undefined, sube: PROF.sube || undefined, mevcut_yontem: PROF.yontem || undefined, en_cok_zaman_alan: (PROF.zaman || []).length ? PROF.zaman : undefined }; } catch (e) {} return c; };
}

/* v189: adım 4 görünümü: kartlı seçimler, özet kartı, onay kartı */
{
  const css = document.createElement('style');
  css.textContent = `#sgform .lx-f{margin-bottom:20px}#sgform .lx-f>label{display:block;margin:0 0 10px;font-size:14.5px;font-weight:700;color:#0F2850}
#sgform .pf-cs{display:flex;flex-wrap:wrap;gap:8px}#sgform .pf-c{min-height:42px;padding:0 16px;font-size:14px}
#sgform .pf-c.on{border-color:#1553b0;background:#EDF4FE;color:#0F2850;box-shadow:0 0 0 3px rgba(21,83,176,.10)}
.sg-sum{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 24px;border-radius:18px;background:linear-gradient(135deg,#0F3F85,#1C6FD0);color:#fff;box-shadow:0 10px 24px rgba(15,63,133,.22)}
.sg-av{flex:none;width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);display:grid;place-items:center;font-style:normal;font-weight:800;font-size:22px;color:#fff}
.sg-sb{min-width:0;flex:1}.sg-sb b{display:block;font-size:17px;line-height:1.25;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sg-ch{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.sg-ch em{font-style:normal;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.16);color:#EAF2FF}
.sg-sec{margin:0 0 24px}.sg-sec h3{margin:0;font-size:15px;font-weight:800;color:#0F2850;line-height:1.3}.sg-sec p{margin:4px 0 12px;font-size:13px;color:#74839A;line-height:1.45}
#sgform .sg-tg{display:grid;grid-template-columns:1fr 1fr;gap:10px}#sgform .sg-tg.sg-fl{display:flex;flex-wrap:wrap;gap:8px}
#sgform .pf-c.sg-t{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:12px;text-align:left;border-radius:16px;padding:12px;min-height:88px;border:1.5px solid #DCE5F1;background:#fff;color:#1B2B41;transition:border-color .15s,background .15s,box-shadow .15s,transform .1s}
#sgform .pf-c.sg-t:active{transform:scale(.985)}
.sg-ti{flex:none;width:34px;height:34px;border-radius:11px;background:#EEF3FA;color:#4C6A94;display:grid;place-items:center;font-style:normal;transition:background .15s,color .15s}
.sg-t b{display:block;font-size:14px;line-height:1.25;font-weight:700;padding-right:4px}
.sg-tk{position:absolute;top:12px;right:12px;width:20px;height:20px;border-radius:50%;border:1.5px solid #C9D6E8;background:#fff;transition:all .15s;text-decoration:none}
#sgform .pf-c.sg-t.on{border-color:#1553b0;background:#EDF4FE}#sgform .pf-c.sg-t.on .sg-ti{background:#1553b0;color:#fff}
#sgform .pf-c.sg-t.on .sg-tk{background:#1553b0 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/12px no-repeat;border-color:#1553b0}
#sgform .sg-fl .pf-c.sg-t{flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;min-height:44px;padding:0 14px 0 8px;border-radius:999px}
#sgform .sg-fl .sg-ti{width:28px;height:28px;border-radius:50%}#sgform .sg-fl .sg-ti svg{width:16px;height:16px}#sgform .sg-fl .sg-t b{font-size:13.5px;padding:0;white-space:nowrap}#sgform .sg-fl .sg-tk{display:none}
.sg-cc{margin:4px 0 6px;border-radius:18px;border:1px solid #DCE5F1;background:#fff;overflow:hidden}
.sg-ck{display:flex!important;gap:12px;align-items:flex-start;margin:0!important;padding:14px!important;cursor:pointer;font-size:13.5px;line-height:1.5;color:#33465F;border:0!important;background:transparent!important;position:relative}.sg-ck+.sg-ck{border-top:1px solid #E6EDF6!important;background:#F7FAFD!important}
.sg-ck input{position:absolute;opacity:0;width:0;height:0;margin:0}.sg-bx{flex:none;width:22px;height:22px;margin-top:1px;border-radius:7px;border:1.8px solid #B5C4D9;background:#fff;transition:all .15s}
.sg-ck input:checked+.sg-bx{background:#1553b0 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center/14px no-repeat;border-color:#1553b0}
.sg-ck input:focus-visible+.sg-bx{outline:3px solid rgba(21,83,176,.25);outline-offset:1px}.sg-ck.err .sg-bx{border-color:#B42318;box-shadow:0 0 0 3px rgba(180,35,24,.12)}
.sg-ck span{flex:1;min-width:0}.sg-ck a{color:#1553b0;font-weight:600}.sg-ck b{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:#E7EEF8;color:#4C6A94;font-size:11px;font-weight:700;vertical-align:1px}.sg-ck small{display:block;margin-top:3px;font-size:12px;color:#7C8CA3}`;
  document.head.appendChild(css);
}

/* v190: yeni işletme tamamen temiz başlar (önceki oturumdan ya da örnek veriden hiçbir şey kalmaz) */
{ const _w = wipeData; wipeData = function () { _w.apply(this, arguments); try { VD_T.length = 0; } catch (e) {} }; }
const BOOT_P = (() => { try { wipeData(); return pSnap(); } catch (e) { return ''; } })();
function freshBiz(name, owner) {
  try { if (BOOT_P) pApply(BOOT_P); } catch (e) {}
  NAMES.u1 = { name: owner || 'Patron', title: 'Patron' }; BIZ = name; wipeData(); try { EDOC.unvan = name; } catch (e) {} applyNames();
}
{
  const _rn = render;
  render = function () { try { if (typeof SBS !== 'undefined' && SBS.biz && SBS.biz.name && BIZ !== SBS.biz.name) { BIZ = SBS.biz.name; } } catch (e) {} return _rn.apply(this, arguments); };
}

/* v191: telefon giriş ekranı: ortalı logo + KaisPilot, kartsız sade form, Patron/Çalışan aynı düzen */
if (typeof document !== 'undefined') {
  const css = document.createElement('style'); css.id = 'lx4-css';
  const S4 = '.login.lx3:has(#idform)';
  css.textContent = `@media(max-width:999px){
${S4}{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;min-height:100vh;min-height:100dvh;padding:0 30px calc(env(safe-area-inset-bottom,0px) + 14px)!important;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,system-ui,sans-serif;background:radial-gradient(120% 55% at 112% -6%,rgba(176,208,250,.62),rgba(176,208,250,0) 62%),radial-gradient(95% 34% at -12% 104%,rgba(196,219,251,.7),rgba(196,219,251,0) 64%),linear-gradient(180deg,#F5F8FD,#FCFDFF)!important}
${S4} .lx-hero{flex:none!important;aspect-ratio:auto!important;height:auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center;background:none!important;padding:calc(env(safe-area-inset-top,0px) + 26px) 0 0!important;margin:0!important;width:100%!important;max-width:none!important;min-height:0!important;box-shadow:none!important;border:0!important;border-radius:0!important;overflow:visible!important;gap:0!important}
${S4} .lx-hero::before,${S4} .lx-hero::after{display:none!important}
${S4} .lx-copy,${S4} .lx-art,${S4} .lp,${S4} .lp-ft,${S4} .lx-sl{display:none!important}
${S4} .lx-brand{display:flex!important;flex-direction:column!important;align-items:center!important;gap:10px!important;font-size:31px!important}
${S4} .lx-brand svg{width:52px!important;height:52px!important;padding:10px!important;border-radius:15px!important;background:linear-gradient(160deg,#2b73d6,#0a2a60)!important;border:0!important;box-shadow:0 8px 18px rgba(10,42,96,.28)!important}
${S4} .lx-brand span{font-size:31px!important;font-weight:800!important;letter-spacing:-.6px!important;color:#0E1B3D!important;line-height:1.1}
${S4} .lx2-tag{display:block!important;margin:6px 0 0!important;padding:0!important;font-size:16.5px!important;line-height:1.35;color:#5D6E87!important;text-align:center}
${S4} .lx-card{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:36px 0 0!important;max-width:none!important;width:100%!important;animation:none!important;border-radius:0!important;flex:1 1 auto}
${S4} .lx-cin{padding:0!important;max-width:none!important}
${S4} .lx-cin>h1,${S4} .lx-cin>.lx-sub{display:none!important}
${S4} .lx-tabs{margin:0 6px 28px!important;padding:4px!important;gap:4px!important;border-radius:16px!important;background:#E6ECF6!important;box-shadow:none!important}
${S4} .lx-tabs button{min-height:38px!important;height:38px;border-radius:12px!important;font-size:16px!important}
${S4} .lx-tabs button b{font-size:16px!important;font-weight:650!important}
${S4} .lx-tabs button[aria-pressed=true]{box-shadow:0 2px 8px rgba(14,43,77,.12)!important;color:#0F5FBF!important}
${S4} .sg-g{min-height:44px;height:44px;border-radius:14px;border:1.5px solid #D3DDEC;font-size:17px;font-weight:650}
${S4} .sg-or{margin:8px 0 2px;font-size:15px}
${S4} .lx-f{margin-top:4px}
${S4} .lx-f label{font-size:16px!important;font-weight:700!important;color:#0E1B3D}
${S4} .lx-in{min-height:42px!important;height:42px!important;padding-top:0!important;padding-bottom:0!important;border-radius:14px!important;border:1.5px solid #D9E2EF!important}
${S4} .lx-in input{font-size:17px!important}
${S4} .lx-link{font-size:16px!important;font-weight:700!important}
${S4} .lx-go{min-height:46px!important;height:46px;border-radius:15px!important;font-size:18px!important;margin-top:14px!important}
${S4} .lx-or{margin:10px 6px!important;font-size:15px!important}
${S4} .lx-alt{min-height:40px!important;height:40px;border-radius:14px!important;border:1.5px solid #D3DDEC!important;font-size:17px!important;padding:0 12px!important}
${S4} .lx-alt b{font-size:17px!important;font-weight:700!important}
${S4} .lx-alt span:not(.lx-opt){display:none!important}
${S4} .lg-yasal{display:flex;flex-wrap:nowrap;justify-content:center;align-items:center;gap:8px;white-space:nowrap;margin-top:18px!important;font-size:13.5px;color:#7C8BA2}
${S4} .lg-yasal span{margin:0!important;padding:0!important}
${S4} .lg-yasal a{color:#7C8BA2!important;text-decoration:none}
${S4} .lx-copyr{margin:10px 0 0!important;font-size:14px;color:#7C8BA2}
}`;
  document.head.appendChild(css);
}

/* v192: gerçek çalışanı olmayan işletmede "Çalışan 1 bugün henüz gelmedi" bildirimleri çıkmasın */
{
  const _ol = opLate;
  opLate = function () { return _ol.apply(this, arguments).filter((l) => { const u = byId(l.id); return u && !/^Çalışan \d+$/.test(u.name || '') && !!(u.name || '').trim(); }); };
}

/* v194: işletme adı ve kendi adın Profil ekranından düzeltilebilir (eski hesaplarda yanlış kalan isimler için) */
{
  const _np = NEWM.prof;
  NEWM.prof = function () {
    let h = _np.apply(this, arguments);
    if (!(typeof SBS !== 'undefined' && SBS.biz && roleOf() === 'patron')) return h;
    const nm = (NAMES.u1 && NAMES.u1.name) || ((byId('u1') || {}).name) || '';
    const f = `<div class="pf-row pf-2"><div class="pf-s"><label class="pf-l">İşletme adı</label><input id="pf-bn" autocomplete="organization" placeholder="İşletme adın" value="${esc(BIZ)}"></div><div class="pf-s"><label class="pf-l">Adın soyadın</label><input id="pf-un" autocomplete="name" placeholder="Adın soyadın" value="${esc(nm === 'Patron' ? '' : nm)}"></div></div>`;
    return h.replace('<div class="pf-s" data-pfk="tur">', f + '<div class="pf-s" data-pfk="tur">');
  };
  const _ps = H.pfsave;
  H.pfsave = async function () {
    const g = (id) => ((document.getElementById(id) || {}).value || '').trim();
    const bn = g('pf-bn'), un = g('pf-un');
    if (document.getElementById('pf-bn')) {
      try {
        const c = sbClient();
        if (bn && bn !== BIZ && c && SBS.biz) {
          const r = await c.from('businesses').update({ name: bn }).eq('id', SBS.biz.id);
          if (!r.error) { SBS.biz.name = bn; if (ID.active && ID.active.businesses) ID.active.businesses.name = bn; BIZ = bn; try { EDOC.unvan = bn; } catch (e) {} } else toast('İşletme adı kaydedilemedi.', 'bad');
        }
        if (un && un !== (NAMES.u1 && NAMES.u1.name)) {
          NAMES.u1 = { name: un, title: 'Patron' }; applyNames();
          if (c && SBS.user && ID.active) { try { await c.from('members').update({ display_name: un }).eq('business_id', SBS.biz.id).eq('user_id', SBS.user.id); } catch (e) {} }
        }
      } catch (e) {}
    }
    return _ps.apply(this, arguments);
  };
}

/* v195: kutudaki yazıyı fareyle seçip arka plana bırakınca pencere kapanıyordu: kapanma için basma da arka planda başlamalı */
if (typeof document !== 'undefined') {
  let pd = null;
  ['mousedown', 'touchstart', 'pointerdown'].forEach((n) => document.addEventListener(n, (e) => { pd = e.target; }, true));
  const _bd = H.backdrop;
  H.backdrop = function (el, e) { if (pd && el && pd !== el && el.contains(pd)) return; return _bd.apply(this, arguments); };
}

/* v197: kayıtta zaten sorulan bilgiler (tür, şehir, çalışan sayısı, muhasebeci, bölümler) profil ekranında tekrar sorulmaz */
{
  const _np2 = NEWM.prof;
  NEWM.prof = function () {
    const h = _np2.apply(this, arguments);
    try {
      const done = { tur: !!PROF.tur, il: !!PROF.il, cal: !!PROF.cal, muh: !!PROF.muh, mods: !!(PROF.mods && PROF.mods.length) };
      const t = document.createElement('div'); t.innerHTML = h;
      Object.keys(done).forEach((k) => { if (done[k]) t.querySelectorAll('[data-pfk="' + k + '"]').forEach((n) => { n.style.display = 'none'; }); });
      return t.innerHTML;
    } catch (e) { return h; }
  };
}

/* v201: kaydırmalı sekme çubuğu (Vardiya, İzin takvimi…): fare tekeri yatay kaydırır, sürükleyerek kaydırılır, seçili sekme ortalanır */
{
  const _sf = segFix;
  segFix = function () {
    _sf.apply(this, arguments);
    try {
      document.querySelectorAll('.seg').forEach((s) => {
        if (s.__hs) return; s.__hs = 1;
        s.addEventListener('wheel', (e) => { if (s.scrollWidth <= s.clientWidth + 2 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; s.scrollLeft += e.deltaY; e.preventDefault(); }, { passive: false });
        let x0 = 0, l0 = 0, drag = false, moved = false;
        s.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0 || s.scrollWidth <= s.clientWidth + 2) return; drag = true; moved = false; x0 = e.clientX; l0 = s.scrollLeft; });
        window.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; s.classList.add('drg'); } if (moved) s.scrollLeft = l0 - dx; });
        window.addEventListener('pointerup', () => { if (!drag) return; drag = false; setTimeout(() => s.classList.remove('drg'), 0); });
        s.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
        const p = s.querySelector('[aria-pressed=true]'); if (p && s.scrollWidth > s.clientWidth + 2) s.scrollLeft = Math.max(0, p.offsetLeft - (s.clientWidth - p.offsetWidth) / 2);
      });
    } catch (e) {}
  };
}

/* v206: şifre sıfırlama: adım adım akış (e-posta onayı → "e-postanı kontrol et" + yeniden gönder sayacı → güçlü yeni şifre) */
{
  const FP = { step: 1, email: '', busy: false, err: '', cool: 0, t: null, sentAt: 0 };
  const okMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
  const maskMail = (v) => { const [a, d] = String(v).split('@'); return a.length <= 2 ? a.charAt(0) + '***@' + d : a.charAt(0) + '***' + a.slice(-1) + '@' + d; };
  const PROV = { 'gmail.com': ['Gmail', 'https://mail.google.com/'], 'googlemail.com': ['Gmail', 'https://mail.google.com/'], 'outlook.com': ['Outlook', 'https://outlook.live.com/mail/'], 'hotmail.com': ['Outlook', 'https://outlook.live.com/mail/'], 'live.com': ['Outlook', 'https://outlook.live.com/mail/'], 'yahoo.com': ['Yahoo Mail', 'https://mail.yahoo.com/'], 'icloud.com': ['iCloud Mail', 'https://www.icloud.com/mail'], 'yandex.com': ['Yandex Mail', 'https://mail.yandex.com/'], 'yandex.com.tr': ['Yandex Mail', 'https://mail.yandex.com.tr/'] };
  const provOf = (m) => PROV[String(m).split('@')[1].toLowerCase()] || null;
  const tick = () => {
    if (FP.t) clearInterval(FP.t); const upd = () => { const left = Math.max(0, FP.cool - Math.floor((Date.now() - FP.sentAt) / 1000)); const b = document.getElementById('fp-re'); if (b) { b.disabled = left > 0; b.textContent = left > 0 ? 'Tekrar gönder (' + left + ' sn)' : 'Tekrar gönder'; } if (left <= 0 && FP.t) { clearInterval(FP.t); FP.t = null; } };
    upd(); FP.t = setInterval(upd, 1000);
  };
  H.idforgot = () => { FP.step = 1; FP.err = ''; FP.busy = false; FP.email = ((document.getElementById('id-em') || {}).value || S.lgEm || '').trim(); S.modal = { type: 'fpass' }; renderModal(); setTimeout(() => { const i = document.getElementById('fp-em'); if (i && !FP.email) i.focus(); }, 80); };
  NEWM.fpass = () => {
    if (FP.step === 2) {
      const pv = provOf(FP.email);
      return sheet('E-postanı kontrol et', `<div class="fp"><div class="fp-ic ok">${ic('check', 26)}</div><p class="fp-t">Sıfırlama bağlantısını <b>${esc(maskMail(FP.email))}</b> adresine gönderdik.</p>
      ${pv ? `<a class="btn block" href="${pv[1]}" target="_blank" rel="noopener">${esc(pv[0])}'i aç</a>` : ''}
      <ul class="fp-l"><li>Bağlantı yaklaşık 1 saat geçerli, tek kullanımlık.</li><li>Gelmediyse <b>Spam / Gereksiz</b> klasörüne bak.</li><li>Bağlantıya tıklayınca yeni şifreni belirleyeceksin.</li></ul>
      <div class="err" id="fp-err" role="alert">${esc(FP.err)}</div>
      <div class="fp-r"><button class="btn sec" id="fp-re" data-a="fpsend" disabled>Tekrar gönder</button><button class="fp-lk" data-a="fpchange">E-postayı değiştir</button></div></div>`);
    }
    return sheet('Şifreni sıfırla', `<div class="fp"><div class="fp-ic">${ic('lock', 24)}</div><p class="fp-t">Hesabına bağlı e-posta adresini onayla, sana güvenli bir sıfırlama bağlantısı gönderelim.</p>
      <div class="field"><label for="fp-em">E-posta</label><input id="fp-em" type="email" inputmode="email" autocomplete="username" autocapitalize="none" value="${esc(FP.email)}" placeholder="ad@sirket.com"></div>
      <div class="err" id="fp-err" role="alert">${esc(FP.err)}</div>
      <button class="btn block" id="fp-go" data-a="fpsend"${FP.busy ? ' disabled' : ''}>${FP.busy ? 'Gönderiliyor…' : 'Bağlantı gönder'}</button><button class="fp-lk" data-a="closemodal">Vazgeç, girişe dön</button></div>`);
  };
  H.fpchange = () => { FP.step = 1; FP.err = ''; if (FP.t) { clearInterval(FP.t); FP.t = null; } renderModal(); };
  H.fpsend = async () => {
    if (FP.busy) return; const inp = document.getElementById('fp-em'); if (inp) FP.email = inp.value.trim(); const e = document.getElementById('fp-err');
    if (!okMail(FP.email)) { FP.err = 'E-posta adresi geçerli görünmüyor. Yazımı kontrol et.'; if (e) e.textContent = FP.err; return; }
    const c = sbClient(); if (!c) { FP.err = 'Bulut bağlantısı kullanılamıyor.'; if (e) e.textContent = FP.err; return; }
    FP.busy = true; FP.err = ''; const go = document.getElementById('fp-go'); if (go) { go.disabled = true; go.textContent = 'Gönderiliyor…'; }
    try { const r = await c.auth.resetPasswordForEmail(FP.email, { redirectTo: location.origin + location.pathname }); if (r.error) throw r.error; S.lgEm = FP.email; FP.step = 2; FP.cool = 60; FP.sentAt = Date.now(); FP.busy = false; renderModal(); tick(); }
    catch (x) { FP.busy = false; try { console.warn('fpsend', x); } catch (e2) {} const m = String((x && x.message) || x || ''); FP.err = /sending recovery|error sending|smtp/i.test(m) ? 'E-posta şu an gönderilemedi. Biraz sonra tekrar dene, sürerse bize yaz.' : idMsg(x); if (FP.step === 2) { renderModal(); tick(); } else { const g = document.getElementById('fp-go'); if (g) { g.disabled = false; g.textContent = 'Bağlantı gönder'; } const e3 = document.getElementById('fp-err'); if (e3) e3.textContent = FP.err; } }
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'fp-em') { e.preventDefault(); H.fpsend(); } });
  /* eski hata yazısı e-posta/şifre yazılınca silinir */
  document.addEventListener('input', (e) => { const t = e.target; if (t && (t.id === 'id-em' || t.id === 'id-pw')) { const er = document.getElementById('id-err'); if (er && er.textContent) er.textContent = ''; S.loginErr = ''; } if (t && t.id === 'np-pw') npMeter(); });
  /* yeni şifre: güç göstergesi, tekrar alanı, göster/gizle */
  function npScore(v) { let s = 0; if (v.length >= 8) s++; if (v.length >= 12) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; return Math.min(4, s); }
  function npMeter() { const v = (document.getElementById('np-pw') || {}).value || ''; const s = v ? Math.max(1, npScore(v)) : 0; const b = document.getElementById('np-bar'); if (b) { b.dataset.s = s; b.style.setProperty('--w', s * 25 + '%'); } const t = document.getElementById('np-txt'); if (t) t.textContent = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'][s] || ''; }
  NEWM.newpw = () => sheet('Yeni şifre belirle', `<div class="fp"><div class="fp-ic">${ic('lock', 24)}</div><p class="fp-t">Hesabın için yeni bir şifre seç. En az 8 karakter, harf ve rakam karışık olsun.</p>
    <div class="field"><label for="np-pw">Yeni şifre</label><div class="fp-pw"><input id="np-pw" type="password" autocomplete="new-password"><button type="button" class="fp-eye" data-a="npshow" aria-label="Göster veya gizle">${LXI.eye}</button></div><div class="fp-m"><i id="np-bar" data-s="0"></i><span id="np-txt"></span></div></div>
    <div class="field"><label for="np-pw2">Şifreyi tekrar yaz</label><input id="np-pw2" type="password" autocomplete="new-password"></div>
    <div class="err" id="np-err" role="alert"></div><button class="btn block" data-a="pwsave">Şifreyi kaydet</button></div>`);
  H.npshow = () => { ['np-pw', 'np-pw2'].forEach((id) => { const i = document.getElementById(id); if (i) i.type = i.type === 'password' ? 'text' : 'password'; }); };
  H.pwsave = async () => {
    const v = (document.getElementById('np-pw') || {}).value || ''; const v2 = (document.getElementById('np-pw2') || {}).value || ''; const e = document.getElementById('np-err'); const say = (t) => { if (e) e.textContent = t; };
    if (v.length < 8) return say('En az 8 karakter yaz.'); if (v !== v2) return say('İki şifre aynı değil.');
    try { const r = await sbClient().auth.updateUser({ password: v }); if (r.error) throw r.error; try { history.replaceState(null, '', location.pathname); } catch (e2) {} S.modal = null; render(); toast('Şifren güncellendi. Artık yeni şifrenle girebilirsin.', 'ok'); } catch (x) { say(idMsg(x)); }
  };
}

/* v207: şifre sıfırlama bağlantısı: siteye girmeden önce yeni şifre ekranı → kaydedince girişe döner (e-posta dolu, sekme doğru), tarayıcıya giriş bilgisini kaydetme; Patron ve Çalışan aynı akış */
if (!S.lgEm) { try { const le = localStorage.getItem('kp_last_em'); if (le) S.lgEm = le; } catch (e) {} }
{
  const _ie = idEnter; idEnter = async function () { if (REC.on) { render(); return; } return _ie.apply(this, arguments); };
  const _fg = H.idforgot; H.idforgot = function () { try { localStorage.setItem('kp_rtab', S.lgTab || 'own'); } catch (e) {} return _fg.apply(this, arguments); };
  const mk = (v) => { const [a, d] = String(v || '').split('@'); return d ? (a.length <= 2 ? a.charAt(0) + '***@' + d : a.charAt(0) + '***' + a.slice(-1) + '@' + d) : ''; };
  const field = (id, label, ac) => `<div class="lx-f"><label for="${id}">${label}</label><div class="lx-in"><input id="${id}" type="password" autocomplete="${ac}" placeholder="••••••••"></div></div>`;
  const recHTML = (h) => {
    const hero = h.slice(0, h.indexOf('<section class="lx-card">')); let card;
    if (REC.err) card = `<h1>Bağlantı geçerli değil</h1><p class="lx-sub">Süresi dolmuş ya da daha önce kullanılmış.</p><p class="lx-note">Güvenliğin için sıfırlama bağlantıları tek kullanımlık ve kısa ömürlü. Yeni bir bağlantı isteyebilirsin.</p><button class="lx-go" type="button" data-a="rcagain"><span>Yeni bağlantı iste</span>${LXI.arrow}</button><button type="button" class="lx-alt" data-a="rccancel"><b>Girişe dön</b></button>`;
    else card = `<h1>Yeni şifreni belirle</h1><p class="lx-sub">${esc(mk(REC.email) || 'Hesabın')} için</p><form id="rcform" class="lx-form" novalidate>${field('rc-pw', 'Yeni şifre', 'new-password')}<div class="fp-m"><i id="rc-bar" data-s="0"></i><span id="rc-txt"></span></div>${field('rc-pw2', 'Şifreyi tekrar yaz', 'new-password')}<button type="button" class="lx-link" data-a="rceye">Şifreleri göster / gizle</button><div class="err" id="rc-err" role="alert"></div><button class="lx-go" type="button" data-a="rcsave"><span>Şifreyi kaydet</span>${LXI.arrow}</button><button type="button" class="lx-alt" data-a="rccancel"><b>Vazgeç, girişe dön</b></button><p class="lx-hint">En az 8 karakter. Kaydedince giriş ekranına döneceksin.</p></form>`;
    return hero + `<section class="lx-card"><div class="lx-cin">${card}</div></section></div>`;
  };
  const _lh = loginHTML;
  loginHTML = function () {
    const h = _lh.apply(this, arguments);
    if (REC.on) return recHTML(h);
    if (S.loginNote && sbOK()) { const i = h.indexOf('<div class="lx-f">'); if (i > 0) return h.slice(0, i) + `<p class="lx-note ok" id="lx-recnote">${esc(S.loginNote)}</p>` + h.slice(i); }
    return h;
  };
  const sc = (v) => { let s = 0; if (v.length >= 8) s++; if (v.length >= 12) s++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; return Math.min(4, s); };
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t) return;
    if (t.id === 'rc-pw') { const v = t.value; const s = v ? Math.max(1, sc(v)) : 0; const b = document.getElementById('rc-bar'); if (b) { b.dataset.s = s; b.style.setProperty('--w', s * 25 + '%'); } const x = document.getElementById('rc-txt'); if (x) x.textContent = ['', 'Zayıf', 'Orta', 'İyi', 'Güçlü'][s]; }
    if ((t.id === 'id-em' || t.id === 'id-pw') && S.loginNote) { S.loginNote = ''; const n = document.getElementById('lx-recnote'); if (n) n.remove(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && (e.target.id === 'rc-pw' || e.target.id === 'rc-pw2')) { e.preventDefault(); H.rcsave(); } });
  const leave = async () => { try { await sbClient().auth.signOut({ scope: 'local' }); } catch (e) {} try { sessionStorage.removeItem('kp_rec'); } catch (e) {} REC.on = false; REC.err = ''; SBS.user = null; ID.active = null; ID.mems = []; S.user = null; };
  H.rceye = () => { ['rc-pw', 'rc-pw2'].forEach((id) => { const i = document.getElementById(id); if (i) i.type = i.type === 'password' ? 'text' : 'password'; }); };
  H.rccancel = async () => { const em = REC.email; const tb = REC.tab; await leave(); S.lgTab = tb; S.lgEm = em || S.lgEm; render(); };
  H.rcagain = async () => { const em = REC.email; await leave(); S.lgTab = localStorage.getItem('kp_rtab') || 'own'; S.lgEm = em || S.lgEm; render(); setTimeout(() => { try { H.idforgot(); } catch (e) {} }, 60); };
  H.rcsave = async () => {
    if (REC.busy) return; const v = (document.getElementById('rc-pw') || {}).value || ''; const v2 = (document.getElementById('rc-pw2') || {}).value || ''; const e = document.getElementById('rc-err'); const say = (t) => { if (e) e.textContent = t; };
    if (v.length < 8) return say('En az 8 karakter yaz.'); if (v !== v2) return say('İki şifre aynı değil.');
    REC.busy = true;
    try {
      const r = await sbClient().auth.updateUser({ password: v }); if (r.error) throw r.error;
      const em = REC.email, tb = REC.tab; await leave(); S.lgTab = tb; S.lgEm = em; S.loginErr = ''; S.loginNote = 'Şifren güncellendi. Şimdi yeni şifrenle giriş yap.'; try { localStorage.setItem('kp_last_em', em); } catch (e2) {}
      REC.busy = false; render(); setTimeout(() => { const p = document.getElementById('id-pw'); if (p) p.focus(); }, 80);
    } catch (x) {
      REC.busy = false; const m = String((x && x.message) || x || '');
      if (/session.*missing|expired|jwt/i.test(m)) { REC.err = 'expired'; render(); return; }
      say(/different from the old/i.test(m) ? 'Yeni şifre eskisiyle aynı olamaz.' : /weak|easy to guess|pwned/i.test(m) ? 'Bu şifre kolay tahmin edilir. Daha uzun veya karışık bir şifre seç.' : idMsg(x));
    }
  };
  /* giriş başarılı olunca tarayıcıya şifreyi kaydettir, e-postayı hatırla */
  const _ia = idAuth;
  idAuth = async function (kind, mode) {
    const em = ((document.getElementById('id-em') || {}).value || '').trim(); const pw = (document.getElementById('id-pw') || {}).value || '';
    const r = await _ia.apply(this, arguments);
    try { if (S.user && !REC.on && em && pw.length >= 8) { localStorage.setItem('kp_last_em', em); if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) navigator.credentials.store(new PasswordCredential({ id: em, password: pw, name: em })); } } catch (e) {}
    return r;
  };
  if (REC.on) setTimeout(() => { try { render(); } catch (e) {} }, 0);
}

/* v212: sayfa yenilenince kaldığın ekrana dön (Bugün'e atma) */
{
  let rst = false;
  const ok = (u, v) => { try { return !!(NAV[u.role] || []).some((n) => n[0] === v); } catch (e) { return false; } };
  const _la = loginAs;
  loginAs = function (u) {
    let o = null; if (rst) { rst = false; try { o = JSON.parse(sessionStorage.getItem('kp_v') || 'null'); } catch (e) {} }
    _la.apply(this, arguments);
    if (!o) return;
    try { if (o && o.v && o.u === u.id && ok(u, o.v)) { S.view = o.v; if (o.s) Object.assign(S.sub, o.s); render(); } } catch (e) {}
  };
  const _ie = idEnter;
  idEnter = async function () { rst = true; try { return await _ie.apply(this, arguments); } finally { rst = false; } };
  const _r = render;
  render = function () { const r = _r.apply(this, arguments); try { if (S.user && S.view) sessionStorage.setItem('kp_v', JSON.stringify({ u: S.user.id, v: S.view, s: S.sub })); } catch (e) {} return r; };
}

/* v221: yenilemede işletme kaybolmasın: yükleme hatasını gösterme, yeniden dene, kurulum adımlarını hatırla */
{
  SBS.loadErr = '';
  const _lb = sbLoadBiz;
  sbLoadBiz = async function () { try { SBS.loadErr = ''; return await _lb.apply(this, arguments); } catch (e) { SBS.loadErr = String((e && e.message) || e || 'bilinmeyen hata').slice(0, 160); throw e; } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function retryLoad() {
    for (let a = 0; a < 2 && SBS.user && !ID.mems.length && !S.user; a++) {
      try { const c = sbClient(); if (c) { const x = await c.auth.refreshSession(); if (x && x.data && x.data.session) SBS.user = x.data.session.user; } } catch (e) {}
      try { await sbLoadBiz(); } catch (e) {}
      if (ID.mems.length) { try { await idEnter(); } catch (e) {} render(); return true; }
      await sleep(700 * (a + 1));
    }
    return false;
  }
  const watch = async () => { if (!SBS.user || S.user || ID.mems.length || REC.on || (S.sg && S.sg.step > 2) || ID.busy) return; SBS.retrying = true; render(); await retryLoad(); SBS.retrying = false; render(); };
  setTimeout(watch, 1800); setTimeout(watch, 5000);
  H.sgretry = async () => { SBS.loadErr = ''; SBS.retrying = true; render(); const ok = await retryLoad(); SBS.retrying = false; if (!ok && !SBS.loadErr && !ID.mems.length) SBS.loadErr = ''; render(); };
  /* yükleme hatası varsa kurulum ekranı yerine açık bir uyarı */
  const _lh = loginHTML;
  loginHTML = function () {
    if (sbOK() && SBS.user && !S.user && !ID.active && !ID.mems.length && (SBS.loadErr || SBS.retrying)) {
      return `<div class="login lx"><section class="lx-card" style="margin:auto"><div class="lx-cin"><h1>${SBS.retrying ? 'İşletmen yükleniyor…' : 'İşletmen yüklenemedi'}</h1>
      <p class="lx-sub">${esc(SBS.user.email || '')} hesabıyla giriş yapıldı.${SBS.loadErr ? '<br>Sebep: ' + esc(SBS.loadErr) : ''}</p>
      ${SBS.retrying ? '' : '<div class="row wrap" style="gap:8px;margin-top:14px"><button class="lx-go" type="button" data-a="sgretry"><span>Tekrar dene</span></button><button class="lx-link" type="button" data-a="idout">Çıkış yap</button></div>'}</div></section></div>`;
    }
    return _lh.apply(this, arguments);
  };
  /* kurulum adımları yenilemede kaybolmasın (şifre saklanmaz) */
  const KEY = 'kp_sg';
  const save = () => { try { if (S.sg) { const o = Object.assign({}, S.sg); delete o.pw; o.u = SBS.user ? SBS.user.id : ''; localStorage.setItem(KEY, JSON.stringify(o)); } } catch (e) {} };
  const _si = sgInit;
  sgInit = function () { _si.apply(this, arguments); try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && S.sg && (o.u || '') === (SBS.user ? SBS.user.id : '')) { const st = o.step; Object.assign(S.sg, o, { pw: '' }); delete S.sg.u; if (!SBS.user && st > 1) S.sg.step = 1; } } catch (e) {} };
  const _rn = render;
  render = function () { const r = _rn.apply(this, arguments); if (S.sg) save(); return r; };
  const _sf = sgFinish; sgFinish = async function () { const r = await _sf.apply(this, arguments); if (!S.sg) { try { localStorage.removeItem(KEY); } catch (e) {} } return r; };
}

/* v223: yenilerken kurulum/giriş ekranı çakmasın: oturum varsa hesap yüklenene kadar yükleniyor ekranı */
{
  const hasSess = () => { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true; } } catch (e) {} return false; };
  const BOOT = { on: hasSess() && !/[?#&](access_token|type=recovery|code=)/.test(location.search + location.hash), t0: Date.now() };
  window.KP_BOOT = BOOT;
  if (!BOOT.on) { try { document.documentElement.classList.remove('kp-boot'); } catch (e) {} }
  const _lh = loginHTML;
  loginHTML = function () {
    if (BOOT.on && !S.user && !(typeof REC !== 'undefined' && REC.on)) {
      return `<div class="kp-splash"><div class="kp-sp-in"><div class="kp-sp-logo"><span class="kp-sp-ring"></span><div class="kp-sp-mark"><img src="/icon-192.png" width="72" height="72" alt="" style="display:block;border-radius:22px"></div></div><div class="kp-sp-name">KaisPilot</div><div class="kp-sp-sub">Hesabın hazırlanıyor</div><div class="kp-sp-bar"><i></i></div></div><style>.kp-splash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:radial-gradient(900px 600px at 20% 15%,rgba(90,160,255,.35),transparent 60%),radial-gradient(700px 500px at 85% 90%,rgba(40,120,220,.30),transparent 60%),linear-gradient(160deg,#0A2547,#123F7A 55%,#1B5FB4);color:#fff;font-family:inherit}.kp-sp-in{display:flex;flex-direction:column;align-items:center;animation:kpfade .5s ease both}.kp-sp-logo{position:relative;width:92px;height:92px;display:grid;place-items:center}.kp-sp-mark{width:72px;height:72px;border-radius:22px;display:grid;place-items:center;box-shadow:0 14px 36px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.16),0 0 44px rgba(106,168,255,.35);animation:kppulse 2.2s ease-in-out infinite}.kp-sp-mark svg{filter:brightness(0) invert(1)}.kp-sp-ring{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:rgba(255,255,255,.85);border-right-color:rgba(255,255,255,.25);animation:kpspin 1.1s linear infinite}.kp-sp-name{margin-top:22px;font-size:28px;font-weight:700;letter-spacing:.2px}.kp-sp-sub{margin-top:6px;font-size:14px;color:rgba(255,255,255,.72)}.kp-sp-bar{margin-top:22px;width:160px;height:3px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}.kp-sp-bar i{display:block;height:100%;width:40%;border-radius:3px;background:#fff;animation:kpbar 1.3s ease-in-out infinite}@keyframes kpspin{to{transform:rotate(360deg)}}@keyframes kppulse{50%{transform:scale(1.05)}}@keyframes kpfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes kpbar{0%{margin-left:-40%}100%{margin-left:100%}}@media(prefers-reduced-motion:reduce){.kp-sp-ring,.kp-sp-mark,.kp-sp-bar i{animation:none}}</style></div>`;
    }
    return _lh.apply(this, arguments);
  };
  if (BOOT.on) {
    const iv = setInterval(() => {
      const age = Date.now() - BOOT.t0; let done = false;
      if (S.user || (typeof REC !== 'undefined' && REC.on)) done = true;
      else if (age > 2500 && !SBS.user) done = true;                           /* oturum gerçekten yok */
      else if (age > 6500 && SBS.user && !ID.mems.length && !ID.busy) done = true; /* işletmesi yok ya da yüklenemedi */
      else if (age > 15000) done = true;
      if (done) { clearInterval(iv); BOOT.on = false; try { render(); } catch (e) {} try { document.documentElement.classList.remove('kp-boot'); } catch (e) {} }
    }, 150);
  }
}

/* v224: işletmesi var ama üyelik satırı yok/okunamıyorsa kurulum açılmasın: sahibi olduğu işletmeyi bul, üyeliği onar */
{
  const _lb = sbLoadBiz;
  sbLoadBiz = async function () {
    await _lb.apply(this, arguments);
    if (!SBS.user || ID.mems.length) return;
    const c = sbClient(); if (!c) return;
    try {
      const r = await c.from('businesses').select('id,name,owner_id').eq('owner_id', SBS.user.id);
      const b = r && r.data && r.data[0]; if (!b) return;
      let mem = null;
      try { await c.from('members').insert({ business_id: b.id, user_id: SBS.user.id, role: 'patron', app_uid: 'u1' }); } catch (e) {}
      try { const r2 = await c.from('members').select('business_id,role,app_uid,display_name,businesses(id,name,owner_id)').eq('user_id', SBS.user.id).eq('business_id', b.id); mem = r2 && r2.data && r2.data.find((m) => m.businesses); } catch (e) {}
      if (!mem) mem = { business_id: b.id, role: 'patron', app_uid: 'u1', display_name: null, businesses: b };
      ID.mems = [mem]; ID.active = mem; SBS.biz = mem.businesses;
      try { if (canSup()) await sbSyncSups(); } catch (e) {}
    } catch (e) {}
  };
}

/* v226: bulut işletmesinde gerçek (davet edilmiş/bağlı) olmayan çalışan yerleri Ekip'te görünmesin; boşsa "Çalışan ekle" */
{
  const cloudBiz = () => !!(typeof SBS !== 'undefined' && SBS.biz && ID.active && !S.demoMode);
  window.seatSync = function () {
    try {
      if (!cloudBiz()) return;
      const all = USERS.filter((u) => u.role === 'calisan').map((u) => u.id); const T = ID.team;
      let sel;
      if (T && T.err) sel = all;
      else if (!T) sel = [];
      else {
        sel = all.filter((id) => T.members.some((m) => m.app_uid === id) || T.invites.some((i) => i.app_uid === id));
        T.members.forEach((m) => { if (m.display_name && m.app_uid && m.app_uid !== 'u1' && byId(m.app_uid)) { const cur = NAMES[m.app_uid] || {}; if (cur.name !== m.display_name) NAMES[m.app_uid] = { name: m.display_name, title: cur.title || byId(m.app_uid).title }; } });
        applyNames();
      }
      if (EMP_IDS.length !== sel.length || EMP_IDS.some((x, i) => x !== sel[i])) { EMP_IDS.length = 0; sel.forEach((x) => EMP_IDS.push(x)); }
    } catch (e) {}
  };
  const _r = render;
  render = function () {
    try { document.documentElement.dataset.view = S.view || ''; } catch (e) {}
    try { seatSync(); if (cloudBiz() && !ID.team && !ID.teamBusy && sbClient()) teamLoad().then(() => render()); } catch (e) {}
    return _r.apply(this, arguments);
  };
  const _ve = viewEkip;
  viewEkip = function () {
    let h = _ve.apply(this, arguments);
    if (cloudBiz() && ID.team && !ID.team.err && !EMP_IDS.length && S.sub && S.sub.ekip === 'bugun') {
      const pat = ID.active.role === 'patron';
      h = `<div class="card stack"><div class="row" style="gap:12px;align-items:flex-start">${ic('users', 24)}<div><h3>Ekibini kur</h3><p class="muted small" style="margin-top:2px">Henüz çalışanın yok. İlk çalışanı ekle; vardiya, izin, mola ve maaş sayfaları onunla birlikte dolar.</p></div></div>${pat ? '<button class="btn" data-a="empadd">Çalışan ekle</button>' : ''}</div>` + h;
    }
    return h;
  };
  H.empadd = () => {
    const act = new Set(EMP_IDS); let u = USERS.filter((x) => x.role === 'calisan').find((x) => !act.has(x.id));
    if (!u) { H.seatadd(); u = USERS.filter((x) => x.role === 'calisan').find((x) => !act.has(x.id)); }
    if (!u) return; S.modal = { type: 'invnew', uid: u.id, blank: true }; renderModal();
  };
  const _in = NEWM.invnew;
  NEWM.invnew = function (m) { let h = _in.apply(this, arguments); if (m && m.blank) { const u = byId(m.uid); h = h.replace('id="iv-name" value="' + esc(u.name) + '"', 'id="iv-name" value="" placeholder="Örn. Ali Yılmaz"').replace('id="iv-title" value="' + esc(u.title || '') + '"', 'id="iv-title" value="" placeholder="Örn. Garson"'); } return h; };
}

/* v235: yenilemede kaydırma konumu korunur */
{
  let t = null;
  const save = () => { try { sessionStorage.setItem('kp_sy', JSON.stringify({ v: S.view || '', y: Math.round(window.scrollY || 0) })); } catch (e) {} };
  window.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(save, 150); }, { passive: true });
  let want = null; try { want = JSON.parse(sessionStorage.getItem('kp_sy') || 'null'); } catch (e) {}
  if (want && want.y > 40) {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (Date.now() - t0 > 12000) return clearInterval(iv);
      if (!S.user || (window.KP_BOOT && window.KP_BOOT.on)) return;
      if ((S.view || '') !== want.v) { clearInterval(iv); return; }
      if (document.documentElement.scrollHeight - innerHeight >= want.y) { window.scrollTo(0, want.y); clearInterval(iv); }
    }, 200);
  }
}

/* v236: bulut hesabında davet edilmemiş Müdür/Muhasebeci koltukları seçim listelerinde görünmez */
function liveUsers() {
  try {
    if (!(typeof SBS !== 'undefined' && SBS.biz && ID.active && !S.demoMode)) return USERS;
    const T = ID.team; if (!T || T.err) return USERS;
    return USERS.filter((u) => u.role === 'patron' || u.role === 'calisan' ? (u.role === 'patron' || EMP_IDS.includes(u.id)) : T.members.some((m) => m.app_uid === u.id));
  } catch (e) { return USERS; }
}

/* v236: kasa/banka filtresi (defter) ve hesap bazında para birimi */
const KCURS = [['₺', 'TRY', 'Türk lirası'], ['$', 'USD', 'Dolar'], ['€', 'EUR', 'Euro'], ['£', 'GBP', 'Sterlin'], ['R', 'ZAR', 'Rand']];
function withCh(k, fn) { const o = CHCTX; CHCTX = (k === 'nakit' || k === 'banka') ? k : ''; try { return fn(); } finally { CHCTX = o; } }
function tbChOf(r) { return r.ch || (r.src === 'Banka' ? 'banka' : ''); }
/* Farklı para birimli hesaplar varsa "Hepsi" yalnızca varsayılan para birimini toplar; farklı para birimleri hiçbir yerde birbirine eklenmez. */
function curOkAll(r) { try { return !kcurDiff() || rowCurSym(r) === defCurSym(); } catch (e) { return true; } }
function tbChOk(r) { const f = S.tch || 'hepsi'; if (f === 'hepsi') return curOkAll(r); if (f === 'yok') return !tbChOf(r); return tbChOf(r) === f; }
function kcurSym(k) { try { const c = S.settings && S.settings.kcur && S.settings.kcur[k]; return c ? c.sym : curSym(); } catch (e) { return '₺'; } }
function kcurDiff() { const a = withCh('', () => curSym()); return ['nakit', 'banka'].some((k) => kcurSym(k) !== a); }
function tbChChips() {
  try {
    const kind = S.sub && S.sub.tablo === 'gelir' ? 'gelir' : 'gider';
    const base = LEDGER.filter((r) => dirOf(r) === kind && inPer(r));
    const n = { hepsi: 0, nakit: 0, banka: 0, yok: 0 }; base.forEach((r) => { n[tbChOf(r) || 'yok']++; if (curOkAll(r)) n.hepsi++; });
    if (!n.nakit && !n.banka) { S.tch = 'hepsi'; return ''; }
    const f = S.tch || 'hepsi';
    const L = [['hepsi', 'Hepsi'], ['nakit', 'Nakit'], ['banka', 'Banka']].concat(n.yok ? [['yok', 'Belirtilmemiş']] : []);
    const warn = f === 'hepsi' && kcurDiff() ? `<div class="tb-in"><div class="warn">${ic('alert', 16)}<span>Nakit ${esc(kcurSym('nakit'))}, banka ${esc(kcurSym('banka'))} ile tutuluyor. Para birimleri birbirine eklenmez: "Hepsi" yalnızca ${esc(defCurSym())} kayıtlarını toplar. Diğerleri için Nakit ya da Banka seç.</span></div></div>` : '';
    return `<div class="chips" role="group" aria-label="Kasa ve banka">${L.map(([k, l]) => `<button class="chip" data-a="tbch" data-v="${k}" aria-pressed="${f === k}">${l} (${n[k]})</button>`).join('')}</div>${warn}`;
  } catch (e) { return ''; }
}
{
  const _tb = tabloHTML;
  tabloHTML = function () { const f = S.tch; return withCh(f === 'nakit' || f === 'banka' ? f : '', () => _tb.apply(this, arguments)); };
  const _kb = NEWM.mxkb;
  NEWM.mxkb = function () { const f = window.MKB_CHV ? window.MKB_CHV() : ''; return withCh(f === 'nakit' || f === 'banka' ? f : '', () => _kb.apply(this, arguments)); };
}
function kcurHtml() {
  const sel = (k, l) => `<div class="field" style="margin:0;flex:1"><label for="kc-${k}">${l} para birimi</label><select id="kc-${k}" data-ch="kcur" data-k="${k}" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--line,#d6dbe3);background:var(--card,#fff);font:inherit">${KCURS.map((c) => `<option value="${c[0]}" ${kcurSym(k) === c[0] ? 'selected' : ''}>${c[0]} · ${c[2]}</option>`).join('')}</select></div>`;
  return `<details style="margin-bottom:8px"><summary style="cursor:pointer" class="small"><b>Hesap para birimi</b></summary><div class="row" style="gap:8px;margin-top:8px">${sel('nakit', 'Nakit')}${sel('banka', 'Banka')}</div><p class="small muted" style="margin-top:6px">Her hesap kendi para biriminde gösterilir. Tutarlar çevrilmez, sadece simge değişir.</p></details>`;
}
document.addEventListener('change', (e) => {
  const t = e.target; if (!t || !t.dataset || t.dataset.ch !== 'kcur') return;
  const c = KCURS.find((x) => x[0] === t.value); if (!c) return; if (!S.settings) S.settings = {};
  const k = S.settings.kcur = S.settings.kcur || {}; k[t.dataset.k] = { sym: c[0], code: c[1], name: c[2] };
  try { pSched(); } catch (x) {} toast('Para birimi güncellendi.', 'ok'); try { renderModal(); } catch (x) {} try { render(); } catch (x) {}
});

/* ======================================================================
   Gmail bağlantısı (gerçek). Sunucu: supabase/functions/kais-mail, tablolar: supabase/sql/mail_gmail.sql
   Durum sunucudadır (mail_connections, mail_docs); burada yalnızca okunur ve gösterilir.
   ====================================================================== */
var MAILX = { scanErr: '', loaded: false, busy: false, scanning: false, starting: false, err: '', setup: false, at: 0, conn: null, rows: 0, prog: 0, limited: false, confirm: false };
const MAIL_ERR = {
  iptal: 'Gmail bağlantısı iptal edildi.',
  izin: 'Gmail bağlanamadı: "e-postaları görüntüle" iznini vermen gerekiyor. Tekrar dene ve izin kutusunu işaretle.',
  anahtar: 'Google bağlantı anahtarı vermedi. myaccount.google.com/permissions sayfasından KaisPilot erişimini kaldırıp yeniden dene.',
  oturum: 'Bağlantı süresi doldu. Yeniden dene.',
  yetki: 'E-postayı yalnızca patron bağlayabilir.',
  kurulum: 'Gmail bağlantısı sunucuda henüz kurulmamış. Kurulum adımları tamamlanmalı.',
  hata: 'Gmail bağlanamadı. Biraz sonra tekrar dene.',
};
function mailBid() { try { return (SBS.biz && SBS.biz.id) || ''; } catch (e) { return ''; } }
function mailCloud() { try { return !!(SBS && SBS.user && mailBid() && sbClient()); } catch (e) { return false; } }
function mailDate(v) {
  if (!v) return '';
  const s = String(v); const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return m[3] + ' ' + MON[+m[2] - 1];
  const d = new Date(s); return isNaN(d) ? '' : String(d.getDate()).padStart(2, '0') + ' ' + MON[d.getMonth()];
}
function mailCurOk(d) {
  if (!d.cur) return true;
  const map = { TRY: ['₺', 'TL'], ZAR: ['R', 'ZAR'], USD: ['$'], EUR: ['€'], GBP: ['£'] };
  let sym = '₺'; try { sym = curSym(); } catch (e) {}
  return (map[d.cur] || [d.cur]).includes(sym);
}
function mailAddable(d) { return d.total != null && mailCurOk(d); }
function mailStatusX(d) {
  if (d.src !== 'gmail') return d.bank && RECEIPTS.some((f) => f.bank === d.bank) ? 'var' : d.total == null ? 'atla' : 'yeni';
  if (d.st0 === 'eklendi' || RECEIPTS.some((f) => f.mailId === d.id)) return 'var';
  if (d.total == null) return 'atla';
  return 'yeni';
}
function mailDupHint(d) { return d.src === 'gmail' && d.total != null && RECEIPTS.some((f) => !f.mailId && Math.abs(Number(f.total) - d.total) < 0.01 && f.date === d.date); }
async function mailInvoke(action, extra) {
  const c = sbClient();
  const r = await c.functions.invoke('kais-mail', { body: Object.assign({ action, business_id: mailBid() }, extra || {}) });
  if (r.error) { let m = ''; try { m = (await r.error.context.json()).error; } catch (e) {} throw new Error(m || (/not found|404|FunctionsFetch|Failed to send/i.test(String(r.error.message)) ? 'E-posta sunucusu kurulmamış. Kurulum adımları tamamlanmalı.' : 'E-posta hizmeti şu an yanıt vermedi.')); }
  if (r.data && r.data.error) { const e = new Error(r.data.error); e.revoked = !!r.data.revoked; throw e; }
  return r.data || {};
}
async function mailLoad(force) {
  if (!mailCloud() || MAILX.busy) return;
  if (!force && MAILX.loaded && Date.now() - MAILX.at < 15000) return;
  MAILX.busy = true;
  try {
    const c = sbClient(); const bid = mailBid();
    const cr = await c.from('mail_connections').select('id,email,provider,status,last_error,last_scan_at,created_at').eq('business_id', bid).order('created_at', { ascending: true });
    if (cr.error) throw cr.error;
    const list = cr.data || []; const conn = list.find((x) => x.status !== 'revoked') || list[0] || null;
    let rows = [];
    if (conn) {
      const dr = await c.from('mail_docs').select('id,from_name,from_addr,subject,received_at,kind,seller,invoice_no,invoice_date,total,currency,tax_rate,category,confidence,status').eq('connection_id', conn.id).order('received_at', { ascending: false }).limit(300);
      if (dr.error) throw dr.error; rows = dr.data || [];
    }
    MAILX.setup = false; MAILX.err = ''; MAILX.conn = conn; MAILX.rows = rows.length;
    S.mail = { on: !!conn && conn.status !== 'revoked', provider: conn ? 'Gmail' : '', addr: conn ? conn.email : '', send: false };
    MAILDOCS.length = 0;
    rows.filter((d) => d.kind !== 'none').forEach((d) => {
      const seller = d.seller || d.from_name || d.from_addr || 'Bilinmeyen gönderen';
      const rule = RULES.find((r) => seller.toLowerCase().includes(String(r.k).toLowerCase()));
      MAILDOCS.push({ id: d.id, src: 'gmail', from: seller, subj: d.subject || '', date: mailDate(d.invoice_date || d.received_at), total: d.total == null ? null : Number(d.total), rate: d.tax_rate == null ? null : Number(d.tax_rate), cat: d.category || (rule && rule.v) || 'Diğer', bank: null, cur: d.currency || '', st0: d.status, conf: d.confidence, no: d.invoice_no || '' });
    });
  } catch (e) {
    const m = String((e && (e.message || e.code)) || e);
    if (/42P01|does not exist|schema cache|mail_connections|mail_docs/i.test(m)) { MAILX.setup = true; MAILX.err = ''; MAILX.conn = null; S.mail = { on: false, provider: '', addr: '', send: false }; MAILDOCS.length = 0; } else MAILX.err = 'E-posta bilgisi okunamadı. Biraz sonra tekrar dene.';
  }
  MAILX.busy = false; MAILX.at = Date.now(); MAILX.loaded = true;
  try { if (!S.modal && S.user && (S.view === 'muhasebe' || S.view === 'bugun')) render(); } catch (e) {}
}
function mailMark(ids, st) { if (mailCloud() && ids.length) mailInvoke('mark', { doc_ids: ids, status: st }).catch(() => {}); }

addMailDoc = function (d) {
  RECEIPTS.push({ id: 'f' + ++seq, seller: d.from, date: d.date, total: d.total, rate: d.rate == null ? 0 : d.rate, cat: d.cat, status: 'musavirde', by: S.user.id, bank: d.bank || null, at: 'e-posta', items: [], mailId: d.src === 'gmail' ? d.id : undefined });
  if (d.src === 'gmail') { d.st0 = 'eklendi'; mailMark([d.id], 'eklendi'); }
};
H.mailadd = (el) => {
  if (locked()) return;
  const d = MAILDOCS.find((x) => x.id === el.dataset.id); if (!d || !mailAddable(d) || mailStatus(d) !== 'yeni') return;
  addMailDoc(d); render(); toast('Belge muhasebeye eklendi.', 'ok');
};
H.mailall = () => {
  if (locked()) return;
  const ys = MAILDOCS.filter((d) => mailStatus(d) === 'yeni');
  const list = ys.filter((d) => mailAddable(d) && d.conf !== 'dusuk');
  list.forEach(addMailDoc); render();
  const left = ys.length - list.length;
  toast(list.length + ' belge eklendi.' + (left ? ' ' + left + ' belgeyi tek tek kontrol et (güven düşük ya da para birimi farklı).' : ''), left ? 'warn' : 'ok');
};
H.mailscan = async () => {
  if (MAILX.scanning || !mailCloud()) return;
  MAILX.scanning = true; MAILX.scanErr = ''; MAILX.prog = 0; MAILX.limited = false; try { render(); } catch (e) {}
  try {
    for (let i = 0; i < 12; i++) {
      const r = await mailInvoke('scan'); MAILX.prog += r.processed || 0; MAILX.limited = !!r.limited;
      if (r.done || !(r.processed > 0)) { if (r.rate) MAILX.scanErr = 'Gmail şu an yoğun. Biraz sonra tekrar tara.'; break; }
      await mailLoad(true);
    }
  } catch (e) { MAILX.scanErr = e.message || 'Tarama yapılamadı.'; }
  MAILX.scanning = false; await mailLoad(true); try { render(); } catch (e) {}
};
H.mailconnect = () => { if (!mailCloud()) { toast('E-posta bağlantısı için bulut hesabıyla giriş yapmalısın.', 'warn'); return; } S.modal = { type: 'gmailc' }; renderModal(); };
H.gmailgo = async () => {
  if (MAILX.starting) return; MAILX.starting = true;
  try { try { renderModal(); } catch (e) {} try { if (typeof pFlush === 'function') await pFlush(); } catch (e) {} const r = await mailInvoke('start'); if (!r.url) throw new Error('Google bağlantısı hazırlanamadı.'); location.href = r.url; }
  catch (e) { MAILX.starting = false; S.modal = null; try { renderModal(); } catch (x) {} toast(e.message || 'Bağlanamadı.', 'bad'); }
};
H.maildisc = () => { MAILX.confirm = true; render(); };
H.maildiscno = () => { MAILX.confirm = false; render(); };
H.maildiscok = async () => {
  try { await mailInvoke('disconnect'); MAILX.confirm = false; MAILDOCS.length = 0; S.mail = { on: false, provider: '', addr: '', send: false }; MAILX.conn = null; MAILX.rows = 0; toast('Gmail bağlantısı kaldırıldı.', 'ok'); }
  catch (e) { MAILX.confirm = false; toast(e.message || 'Bağlantı kaldırılamadı.', 'bad'); }
  await mailLoad(true); render();
};
H.mailsave = () => { H.mailconnect(); };

NEWM.gmailc = () => sheet("Gmail'ini bağla", `<div class="stack">
  <p>Kais, gelen kutundaki <b>fatura, e-arşiv ve makbuz</b> e-postalarını bulur, tutarı okur ve sen onaylayınca muhasebeye ekler.</p>
  <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Yalnızca okuma izni</b><div class="small muted">Kais e-posta göndermez, silmez, değiştirmez.</div></div></div>
  <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Son 90 gün, yalnızca fatura gibi görünenler</b><div class="small muted">Diğer yazışmalar incelenmez.</div></div></div>
  <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">KaisPilot e-posta metnini ve ekleri saklamaz</b><div class="small muted">Yalnızca gönderen, konu, satıcı, tarih, tutar ve KDV oranı kaydedilir.</div></div></div>
  <div class="callout">${ic('info')}<div class="small">Tutarı okumak için fatura metni ve eki yapay zekâ hizmetine (Anthropic) gönderilir, KaisPilot bunları saklamaz. KaisPilot'un Google'dan aldığı bilgileri kullanması ve başka bir uygulamaya aktarması, Sınırlı Kullanım gereklilikleri dahil, Google API Hizmetleri Kullanıcı Verisi Politikası'na uygundur. Bilgiyi satmaz, reklam için kullanmaz.</div></div>
  <p class="small muted">Google bu aşamada "Bu uygulama doğrulanmadı" uyarısı gösterebilir. "Gelişmiş" bağlantısına basıp devam edebilirsin. Bağlantıyı istediğin an kaldırabilirsin.</p>
  <button class="btn block" data-a="gmailgo"${MAILX.starting ? ' disabled' : ''}>${MAILX.starting ? 'Google açılıyor…' : 'Google ile devam et'}</button><button class="btn sec block" data-a="closemodal">Vazgeç</button></div>`);

function mailFmt(d) { if (d.total == null) return ''; return d.cur && !mailCurOk(d) ? Number(d.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ' + d.cur : fmt(d.total); }
function mailRowHTML(d) {
  const st = mailStatus(d); const dup = st === 'yeni' && mailDupHint(d); const addable = mailAddable(d);
  const pill = st === 'yeni' ? '<span class="pill p-info">Yeni</span>' : st === 'var' ? '<span class="pill p-mute">Muhasebeye eklendi</span>' : '<span class="pill p-warn">Tutar okunamadı</span>';
  const notes = [];
  if (st === 'yeni' && d.conf === 'dusuk') notes.push('Okuma güveni düşük, tutarı kontrol et.');
  if (st === 'yeni' && d.rate == null) notes.push('KDV oranı belgede okunamadı, muhasebeci kontrol etmeli.');
  if (st === 'yeni' && !mailCurOk(d)) notes.push('Para birimi ' + d.cur + ', bu işletmeninkinden farklı. Elle ekle.');
  if (st === 'yeni' && !d.cur) notes.push('Para birimi belgede yazmıyor.');
  if (dup) notes.push('Aynı tarih ve tutarda bir kayıt var, tekrar eklemeden önce kontrol et.');
  if (st === 'atla') notes.push('Belgeyi e-postadan açıp tutarı elle ekleyebilirsin.');
  return `<div class="rrow"><div><b style="font-weight:600">${esc(d.from)}</b><div class="small muted">${esc(d.subj)}${d.date ? ' · ' + esc(d.date) : ''}${d.no ? ' · ' + esc(d.no) : ''}</div></div><div class="num" style="font-weight:600">${esc(mailFmt(d))}</div>
  <div class="rfoot">${pill}${notes.map((n) => `<span class="small muted">${esc(n)}</span>`).join('')}${st === 'yeni' && addable ? `<button class="btn sm" data-a="mailadd" data-id="${esc(d.id)}">Ekle</button>` : ''}</div></div>`;
}
epostaHTML = function () {
  if (mailCloud() && !MAILX.busy && (!MAILX.loaded || Date.now() - MAILX.at > 30000)) setTimeout(() => mailLoad(), 0);
  const isP = S.user && S.user.role === 'patron';
  if (!mailCloud()) return `<div class="card stack"><div><h3>İşyeri e-postanı bağla</h3><p class="muted" style="margin-top:4px">E-posta bağlantısı için bulut hesabıyla giriş yapmış olmalısın.</p></div></div>`;
  if (MAILX.setup) return `<div class="card stack"><div><h3>E-posta bağlantısı kurulumu eksik</h3><p class="muted" style="margin-top:4px">Sunucu tarafında e-posta tabloları henüz oluşturulmamış. Kurulum adımları tamamlanınca burası çalışır.</p></div></div>`;
  if (!MAILX.loaded) return `<div class="card stack"><p class="muted">E-posta durumu yükleniyor…</p></div>`;
  const conn = MAILX.conn;
  if (!conn || !S.mail.on) {
    const bad = conn && conn.status === 'revoked' ? `<div class="callout warn">${ic('alert')}<div>${esc(conn.last_error || 'Google erişimi kaldırılmış.')} Yeniden bağlayabilirsin.</div></div>` : '';
    return `<div class="stack-lg"><div class="card stack"><div><h3>Gmail'ini bağla</h3><p class="muted" style="margin-top:4px">Kais gelen kutundaki fatura ve fişleri bulur, tutarı okur, sen onaylayınca muhasebeye ekler.</p></div>${bad}
    <div class="stack"><div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Yalnızca okuma izni</b><div class="small muted">Kais e-posta göndermez, silmez, değiştirmez.</div></div></div>
    <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Eklemeden önce sen onaylarsın</b><div class="small muted">Bulunan belgeler listelenir, "Ekle" dediklerin muhasebeye gider.</div></div></div>
    <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">KaisPilot e-posta metnini ve ekleri saklamaz</b><div class="small muted">Yalnızca gönderen, konu, satıcı, tarih, tutar ve KDV oranı kaydedilir.</div></div></div></div>
    ${isP ? `<button class="btn" style="align-self:flex-start" data-a="mailconnect">${ic('mail')} Gmail'i bağla</button>` : '<p class="small muted">E-postayı patron bağlar.</p>'}
    <p class="small muted">Şimdilik yalnızca Gmail destekleniyor. Outlook ve diğer sağlayıcılar sonra gelecek.</p></div></div>`;
  }
  const docs = MAILDOCS.slice(); const nNew = docs.filter((d) => mailStatus(d) === 'yeni').length;
  const when = conn.last_scan_at ? new Date(conn.last_scan_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const err = MAILX.scanErr || MAILX.err || (conn.status === 'error' ? conn.last_error : '');
  const info = MAILX.scanning ? `Taranıyor… ${MAILX.prog} e-posta işlendi.` : !conn.last_scan_at ? 'Henüz taranmadı. "Şimdi tara" ile başlat.' : `${MAILX.rows} e-posta incelendi, ${docs.length} belge bulundu. Son tarama: ${when}. Son 90 gün taranır.`;
  return `<div class="stack-lg"><div class="card stack"><div class="row between wrap"><div><h3>${esc(conn.email)}</h3><p class="muted small">Gmail · bağlı · yalnızca okuma izni</p></div><span class="pill p-ok">Bağlı</span></div>
  <p class="small muted">${esc(info)}</p>
  ${err ? `<div class="callout warn">${ic('alert')}<div>${esc(err)}</div></div>` : ''}${MAILX.limited ? `<div class="callout">${ic('info')}<div>Bugünlük belge okuma sınırı doldu. Kalanlar yarın taranır.</div></div>` : ''}
  <div class="row wrap">${nNew ? `<button class="btn" data-a="mailall"${MAILX.scanning ? ' disabled' : ''}>${nNew} belgeyi muhasebeye ekle</button>` : ''}<button class="btn sec" data-a="mailscan"${MAILX.scanning ? ' disabled' : ''}>${MAILX.scanning ? 'Taranıyor…' : 'Şimdi tara'}</button>${isP ? (MAILX.confirm ? `<span class="small">Bağlantı kaldırılsın mı?</span><button class="btn sm" data-a="maildiscok">Evet, kaldır</button><button class="btn sm sec" data-a="maildiscno">Vazgeç</button>` : '<button class="btn sec" data-a="maildisc">Bağlantıyı kaldır</button>') : ''}</div></div>
  ${docs.length ? `<div class="card flush"${docs.length > 5 ? ' style="max-height:480px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch"' : ''}>${docs.map(mailRowHTML).join('')}</div>` : (conn.last_scan_at && !MAILX.scanning ? `<div class="card"><p class="muted">Son 90 günde fatura ya da makbuz gibi görünen bir e-posta bulunamadı.</p></div>` : '')}</div>`;
};

(function () {
  const _ie = idEnter;
  idEnter = async function () { await _ie(); try { mailBoot(); } catch (e) {} };
})();
async function mailBoot() {
  const q = new URLSearchParams(location.search); const g = q.get('gmail');
  if (g) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
  if (!mailCloud()) return;
  await mailLoad(true);
  if (!g || !S.user) return;
  if (S.user.role === 'patron') { try { H.nav({ dataset: { v: 'muhasebe', s: 'eposta' } }); } catch (e) {} }
  if (g === 'ok') { toast('Gmail bağlandı. Faturalar aranıyor…', 'ok'); H.mailscan(); }
  else toast(MAIL_ERR[q.get('m')] || MAIL_ERR.hata, 'bad');
}

/* ===== v240: müşteriye e-posta gönderme (kais-send, Resend) ===== */
var SENDX = { ready: false, probed: false, at: 0, busy: false, left: 0, limit: 0, optAt: 0, why: '' };
P_ARR.push(['CUSTOMERS', () => CUSTOMERS], ['CAMPAIGNS', () => CAMPAIGNS]); P_SCOPE.CUSTOMERS = 'stok'; P_SCOPE.CAMPAIGNS = 'stok';
async function sendInvoke(action, extra) {
  const c = sbClient();
  const r = await c.functions.invoke('kais-send', { body: Object.assign({ action, business_id: mailBid() }, extra || {}) });
  if (r.error) { let m = ''; try { m = (await r.error.context.json()).error; } catch (e) {} throw new Error(m || (/not found|404|FunctionsFetch|Failed to send/i.test(String(r.error.message)) ? 'E-posta gönderme sunucusu kurulmamış.' : 'E-posta servisi yanıt vermedi.')); }
  if (r.data && r.data.error) throw new Error(r.data.error);
  return r.data || {};
}
async function sendProbe(force) {
  if (!mailCloud() || SENDX.busy) { if (!mailCloud() && SENDX.ready) { SENDX.ready = false; } return; }
  if (!force && SENDX.probed && Date.now() - SENDX.at < 60000) return;
  SENDX.at = Date.now(); SENDX.probed = true;
  const was = SENDX.ready;
  try {
    const r = await sendInvoke('status');
    SENDX.ready = !!r.configured; SENDX.left = r.dayLeft; SENDX.limit = r.dayLimit; SENDX.why = r.configured ? '' : 'Resend anahtarı sunucuda tanımlı değil.';
  } catch (e) { SENDX.ready = false; SENDX.why = e.message || ''; }
  let changed = was !== SENDX.ready;
  if (SENDX.ready && Date.now() - SENDX.optAt > 60000) {
    SENDX.optAt = Date.now();
    try {
      const o = await sendInvoke('optouts'); const set = new Set((o.emails || []).map((x) => String(x).toLowerCase()));
      CUSTOMERS.forEach((c) => { if (c.iys !== 'ret' && c.email && set.has(String(c.email).toLowerCase())) { c.iys = 'ret'; changed = true; } });
      if (changed && typeof pSched === 'function') pSched();
    } catch (e) { /* çıkış listesi alınamadıysa sunucu yine de göndermez */ }
  }
  if (changed && S.view === 'musteri' || (changed && S.modal)) { try { render(); } catch (e) {} }
}
const _vmu240 = viewMusteri;
viewMusteri = function () { sendProbe(false); return _vmu240(); };

/* hatırlatma: gerçek gönderim */
H.remindsend = async (el) => {
  if (SENDX.busy) return;
  const a = RECV.find((x) => x.id === el.dataset.id); if (!a) return;
  const t = ((document.getElementById('remind-text') || {}).value || '').trim();
  if (t.length < 5) { toast('Mesaj boş.', 'bad'); return; }
  if (!a.email || !/^\S+@\S+\.\S+$/.test(a.email)) { toast('Bu kişinin e-posta adresi yok. Önce adresi ekle.', 'bad'); return; }
  SENDX.busy = true; el.disabled = true; el.textContent = 'Gönderiliyor…';
  try {
    try { if (typeof pFlush === 'function') await pFlush(); } catch (e) {}
    await sendInvoke('remind', { rid: a.id, text: t });
    a.reminded = nowT(); S.modal = null; SENDX.busy = false; if (typeof pSched === 'function') pSched(); render(); toast(`Hatırlatma ${a.name} kişisine gönderildi.`, 'ok'); sendProbe(true);
  } catch (e) { SENDX.busy = false; el.disabled = false; el.textContent = 'Gönder'; toast(e.message || 'Gönderilemedi.', 'bad'); }
};

/* kampanya: gerçek gönderim, iki adımlı onay */
const _kamp240 = kampanyaHTML;
kampanyaHTML = function () {
  let h = _kamp240();
  if (!mailReady()) return h;
  const ok = segList(S.camp.seg).filter((x) => x.iys === 'onayli').length; const arm = !!S.camp.arm;
  h = h.replace(/<button type="button" class="cm-go" data-a="campsend">[\s\S]*?<\/button>/, arm
    ? `<button type="button" class="cm-go" data-a="campsend">${ic('send', 22)}<b>Evet, ${ok} kişiye şimdi gönder</b></button><button type="button" class="btn sec block" data-a="campno">Vazgeç</button>`
    : `<button type="button" class="cm-go" data-a="campsend">${ic('send', 22)}<b>${ok} kişiye gönder</b></button>`);
  h = h.replace(/<p class="cm-f">[\s\S]*?<\/p>/, `<p class="cm-f">${arm ? 'Gönderilen e-posta geri alınamaz. ' : ''}Mesaja otomatik "listeden çık" bağlantısı eklenir. Yalnızca "İzin verdi" olan müşterilere gider. Açılma oranı ölçülmez. Günlük kalan hak: ${SENDX.left}.</p>`);
  return h;
};
H.campno = () => { snapCamp(); S.camp.arm = false; render(); };
H.campsend = async () => {
  snapCamp(); const c = S.camp;
  const ok = segList(c.seg).filter((x) => x.iys === 'onayli');
  if (!c.subj.trim() || !c.body.trim()) { toast('Konu ve mesajı yaz.', 'bad'); return; }
  if (!ok.length) { toast('Bu grupta izinli müşteri yok.', 'bad'); return; }
  if (!mailReady()) { toast('Müşteriye e-posta gönderme henüz hazır değil. Kampanya gönderilmedi.', 'warn'); return; }
  if (SENDX.busy) return;
  if (!c.arm) { c.arm = true; render(); return; }
  SENDX.busy = true; toast('Gönderiliyor, biraz sürebilir…', 'ok');
  try {
    try { if (typeof pFlush === 'function') await pFlush(); } catch (e) {}
    const cid = 'c' + Date.now().toString(36);
    const r = await sendInvoke('campaign', { cid, subject: c.subj.trim(), text: c.body, ids: ok.map((x) => x.id) });
    (r.optIds || []).forEach((id) => { const k = CUSTOMERS.find((x) => x.id === id); if (k) k.iys = 'ret'; });
    if (r.sent > 0) CAMPAIGNS.push({ subj: c.subj.trim(), date: 'Bugün', sent: r.sent, open: 'ölçülmüyor' });
    SENDX.busy = false; SENDX.left = r.dayLeft;
    if (r.sent > 0) S.camp = { seg: 'all', subj: '', body: '' }; else c.arm = false;
    if (typeof pSched === 'function') pSched(); render();
    const extra = (r.failed ? ` ${r.failed} adres gönderilemedi.` : '') + (r.limited ? ' Günlük sınır doldu, kalanlar yarın gönderilebilir.' : '') + (r.dup ? ` ${r.dup} kişiye zaten gitmişti.` : '');
    toast(r.sent > 0 ? `Kampanya ${r.sent} kişiye gönderildi.${extra}` : 'Hiç e-posta gitmedi.' + extra, r.sent > 0 && !r.failed ? 'ok' : 'warn');
  } catch (e) { SENDX.busy = false; c.arm = false; render(); toast(e.message || 'Gönderilemedi.', 'bad'); }
};
const _camseg240 = H.campseg; H.campseg = (el) => { S.camp.arm = false; _camseg240(el); };
const _camtpl240 = H.camptpl; H.camptpl = (el) => { S.camp.arm = false; _camtpl240(el); };

/* müşteri listesi: ekleme, izin, silme */
const cuIz = (c) => c.izinTarih ? ` · izin ${esc(c.izinTarih)}` : '';
musteriListe = function () {
  const rows = CUSTOMERS.map((c) => `<div class="emp"><span class="avatar" style="background:var(--cini);width:40px;height:40px">${esc(ini(c.name))}</span><div class="grow"><b style="font-weight:600">${esc(c.name)}</b><div class="small muted">${esc(c.email)}${cuIz(c)}</div></div>${iysPill(c.iys)}<div class="meta">${c.visits ? c.visits + ' ziyaret · son ziyaret ' + c.last + ' gün önce' : 'Elle eklendi'}</div>
    <div class="row" style="gap:6px;margin-top:6px">${c.iys === 'yok' ? `<button class="btn sm sec" data-a="custizin" data-id="${esc(c.id)}">İzin aldım</button>` : ''}${c.iys === 'onayli' ? `<button class="btn sm sec" data-a="custret" data-id="${esc(c.id)}">İzni kaldır</button>` : ''}<button class="btn sm sec" data-a="custdel" data-id="${esc(c.id)}">Sil</button></div></div>`).join('');
  return `<div class="stack-lg"><button class="btn" data-a="custnew">${ic('plus', 18)} Müşteri ekle</button>
  <div class="card flush">${rows || '<div class="empty">Henüz müşteri yok. "Müşteri ekle" ile başla.</div>'}</div>
  <div class="callout">${ic('info')}<div>Toplu e-posta yalnızca "İzin verdi" olanlara gider. İzni, müşteriden e-posta almak için onay aldıysan işaretle. Listeden çıkanlara bir daha gitmez. Kapsamı iş hukukçusuyla doğrula.</div></div></div>`;
};
NEWM.custnew = () => sheet('Müşteri ekle', `<div class="stack">
  <div class="field"><label for="cu-name">Ad soyad</label><input id="cu-name" type="text" autocomplete="off" maxlength="80"></div>
  <div class="field"><label for="cu-mail">E-posta</label><input id="cu-mail" type="email" autocomplete="off" maxlength="160" placeholder="ornek@mail.com"></div>
  <label class="row" style="align-items:flex-start"><input id="cu-iz" type="checkbox"> <span>Bu kişi, işletmemden kampanya e-postası almayı kabul etti<span class="small muted" style="display:block">Onayı kendin aldıysan işaretle. Emin değilsen boş bırak, o zaman yalnızca kayıt olarak eklenir.</span></span></label>
  <div class="err" id="cu-err" role="alert"></div><button class="btn block" data-a="custadd">Ekle</button><button class="btn sec block" data-a="closemodal">Vazgeç</button></div>`);
H.custnew = () => { S.modal = { type: 'custnew' }; renderModal(); };
H.custadd = () => {
  const name = (document.getElementById('cu-name').value || '').trim(); const mail = (document.getElementById('cu-mail').value || '').trim().toLowerCase(); const iz = document.getElementById('cu-iz').checked; const er = document.getElementById('cu-err');
  if (!name) { er.textContent = 'Adını yaz.'; return; }
  if (!/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(mail)) { er.textContent = 'Geçerli bir e-posta adresi yaz.'; return; }
  if (CUSTOMERS.some((c) => String(c.email).toLowerCase() === mail)) { er.textContent = 'Bu e-posta zaten listede.'; return; }
  CUSTOMERS.push({ id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name.slice(0, 80), email: mail, visits: 0, last: 0, iys: iz ? 'onayli' : 'yok', izinTarih: iz ? new Date().toLocaleDateString('tr-TR') : '' });
  S.modal = null; if (typeof pSched === 'function') pSched(); render(); toast('Müşteri eklendi.', 'ok');
};
H.custizin = (el) => { const c = CUSTOMERS.find((x) => x.id === el.dataset.id); if (!c || c.iys === 'ret') return; c.iys = 'onayli'; c.izinTarih = new Date().toLocaleDateString('tr-TR'); if (typeof pSched === 'function') pSched(); render(); toast('İzin işaretlendi. Onayı müşteriden aldığından emin ol.', 'ok'); };
H.custret = (el) => { const c = CUSTOMERS.find((x) => x.id === el.dataset.id); if (!c) return; c.iys = 'yok'; c.izinTarih = ''; if (typeof pSched === 'function') pSched(); render(); toast('İzin kaldırıldı. Artık kampanya gitmez.', 'ok'); };
H.custdel = (el) => { const i = CUSTOMERS.findIndex((x) => x.id === el.dataset.id); if (i < 0) return; const c = CUSTOMERS[i]; CUSTOMERS.splice(i, 1); if (typeof pSched === 'function') pSched(); render(); toast(`${c.name} listeden silindi.`, 'ok'); };

/* ===== v241: raporlarda hesap bazında para birimi, fişte para birimi uyarısı ===== */
const rowCurSym = (r) => { try { return kcurSym(tbChOf(r)); } catch (e) { return '₺'; } };
const defCurSym = () => { try { return withCh('', () => curSym()); } catch (e) { return '₺'; } };
function rcurList() { const d = defCurSym(); const l = [d]; ['nakit', 'banka'].forEach((k) => { const s = kcurSym(k); if (!l.includes(s)) l.push(s); }); return l; }
H.rcur = (el) => { S.rcur = el.dataset.v; render(); };
{
  const _vr = viewRaporX;
  viewRaporX = function () {
    const list = rcurList();
    if (list.length < 2) return _vr.apply(this, arguments);
    const cur = list.includes(S.rcur) ? S.rcur : list[0];
    const fullL = LEDGER.slice(); const fullI = INV.slice();
    LEDGER.splice(0, LEDGER.length, ...fullL.filter((r) => rowCurSym(r) === cur));
    if (cur !== defCurSym()) INV.splice(0, INV.length);
    const oldF = CURFORCE; CURFORCE = cur; let h;
    try { h = _vr.apply(this, arguments); }
    finally { CURFORCE = oldF; LEDGER.splice(0, LEDGER.length, ...fullL); INV.splice(0, INV.length, ...fullI); }
    const chips = `<div class="card stack" style="gap:8px"><div class="small"><b>Para birimi</b></div><div class="chips" role="group" aria-label="Para birimi">${list.map((c) => `<button class="chip" data-a="rcur" data-v="${esc(c)}" aria-pressed="${c === cur}">${esc(c)}</button>`).join('')}</div><p class="small muted">Hesaplar farklı para biriminde tutuluyor. Raporlar para birimine göre ayrı gösterilir, tutarlar çevrilmez ve toplanmaz.${cur !== defCurSym() ? ' Kestiğin faturalar yalnızca ' + esc(defCurSym()) + ' raporunda görünür.' : ''}</p></div>`;
    const i = h.indexOf('</p></div>'); return i < 0 ? chips + h : h.slice(0, i + 10) + chips + h.slice(i + 10);
  };
  const _csv = csvText;
  csvText = function () {
    const t = _csv.apply(this, arguments); const L = t.split('\n');
    if (L.length !== LEDGER.length + 1 || rcurList().length < 2) return t;
    return L.map((x, i) => i === 0 ? x + ';Para birimi' : x + ';' + rowCurSym(LEDGER[i - 1])).join('\n');
  };
  const _rm = renderModal;
  renderModal = function () {
    _rm.apply(this, arguments); const m = S.modal; const root = $('#modal-root');
    if (!m || m.type !== 'upload' || m.step !== 'result' || !m.sample || !m.sample.cur || !root || typeof root.innerHTML !== 'string') return;
    const dc = (S.settings && S.settings.cur && S.settings.cur.code) || 'TRY';
    if (m.sample.cur === dc || root.innerHTML.includes('rc-warn')) return;
    const w = `<div class="callout warn" id="rc-warn">${ic('alert')}<div>Fişte para birimi <b>${esc(m.sample.cur)}</b> görünüyor, hesabın ${esc(dc)}. Okunan tutarı kontrol et, gerekirse çevirip yaz.</div></div>`;
    root.innerHTML = root.innerHTML.replace('<dl class="kv"', w + '<dl class="kv"');
  };
}

/* ===== v242: faturayı e-postayla (PDF ekli) gerçekten gönder (kais-send, Resend) ===== */
{
  const _fimail = H.fimail;
  const blobB64 = (b) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(new Error('Dosya okunamadı.')); r.readAsDataURL(b); });
  H.fimail = async (el) => {
    const v = INV.find((x) => x.id === el.dataset.id); if (!v) return;
    if (SENDX.busy) return;
    try { await sendProbe(false); } catch (e) {}
    const c = FCUST.find((x) => x.name.toLocaleLowerCase('tr') === String(v.cust).toLocaleLowerCase('tr'));
    const to = c && c.eposta ? String(c.eposta).trim() : '';
    if (!SENDX.ready || !mailCloud()) { _fimail(el); return; }
    if (!/^\S+@\S+\.\S+$/.test(to)) { toast('Bu müşterinin e-postası kayıtlı değil. Müşteriler sekmesinden ya da yeni faturada yaz.', 'warn'); return; }
    if (!window.confirm(`${v.no} faturası PDF ekli olarak ${to} adresine gönderilsin mi?`)) return;
    SENDX.busy = true; const old = el.textContent; el.disabled = true; el.textContent = 'Gönderiliyor…';
    try {
      try { if (typeof pFlush === 'function') await pFlush(); } catch (e) {}
      const pdf = await blobB64(await fiPdf(v));
      await sendInvoke('invoice', { invoice_id: v.id, pdf });
      v.mailedAt = fiIso(); v.mailedTo = to; try { pSched(); } catch (e) {}
      toast(`Fatura ${to} adresine gönderildi.`, 'ok'); sendProbe(true);
    } catch (e) { toast(e.message || 'Gönderilemedi.', 'bad'); }
    finally { SENDX.busy = false; el.disabled = false; el.textContent = old; }
  };
}

/* ===== v245: gerçek K logosu, giriş ve yükleme ekranlarında ===== */
{
  const st = document.createElement('style');
  st.textContent = '.lx-brand img{width:52px;height:52px;border-radius:15px;box-shadow:0 8px 22px rgba(10,42,96,.32),0 0 0 1px rgba(255,255,255,.14);flex:none}.side .brand img,.onb-top .brand img{box-shadow:0 4px 12px rgba(10,42,96,.25)}';
  document.head.appendChild(st);
}

/* ===== v246: Excel: nakit/banka (kasa) ve para birimi ayrımı, günlük/haftalık/aylık/yıllık sayfalar ===== */
const XL_KASA = { nakit: 'Nakit', banka: 'Banka' };
const xlKasa = (r) => XL_KASA[tbChOf(r)] || 'Belirtilmemiş';
const xlFmtOf = (s) => '#,##0.00 "' + String(s || '₺').replace(/"/g, '') + '"';
const XL_AYAD = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
function xlCurList() {
  const d = defCurSym(); const l = [d];
  LEDGER.forEach((r) => { const c = rowCurSym(r); if (!l.includes(c)) l.push(c); });
  return l;
}
/* Her satırın gerçek tarihi: kayıtlı ISO, yoksa "14 Kas" gibi metinden (yıl referans yıl) */
function xlIso(r) {
  if (r.iso && /^\d{4}-\d{2}-\d{2}$/.test(String(r.iso))) return String(r.iso);
  const d = xlDate(rDateY(r));
  return d instanceof Date && !isNaN(d) ? d.toISOString().slice(0, 10) : '';
}
const xlUtc = (iso) => new Date(iso + 'T00:00:00Z');
function xlRowsAll() {
  return LEDGER.map((r) => { const total = Number(r.total) || 0, rt = Number(r.rate) || 0; return { r, iso: xlIso(r), dir: dirOf(r), kasa: xlKasa(r), cur: rowCurSym(r), total, kd: total - total / (1 + rt / 100) }; });
}
const xlSum = (rows, f) => rows.reduce((a, x) => a + f(x), 0);
const xlBorder = { bottom: { style: 'thin', color: { argb: 'FFE3E9F2' } } };

function xlOzet(wb, X) {
  const { NAVY, SOFT, INK, MUT, stamp, hdr } = X; const curs = xlCurList(); const multi = curs.length > 1; const all = xlRowsAll();
  const sm = wb.addWorksheet('Özet', { properties: { tabColor: { argb: NAVY } }, views: [{ showGridLines: false }] });
  sm.columns = [{ width: 26 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
  sm.mergeCells('A1:F1'); const t1 = sm.getCell('A1'); t1.value = BIZ + ' · Muhasebe özeti'; t1.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; t1.alignment = { vertical: 'middle', indent: 1 }; sm.getRow(1).height = 36;
  sm.mergeCells('A2:F2'); const t2 = sm.getCell('A2'); t2.value = 'Güncellendi: ' + stamp + ' · KaisPilot tarafından otomatik hazırlanır. Gelirler ve Giderler sayfalarındaki tablolar buraya, Günlük, Haftalık, Aylık ve Yıllık sayfalarına kendiliğinden yansır.' + (multi ? ' Hesaplar farklı para biriminde tutulduğu için her para birimi ayrı gösterilir, birbirine eklenmez.' : ''); t2.font = { size: 10, color: { argb: MUT } }; t2.alignment = { indent: 1, wrapText: true, vertical: 'top' }; sm.getRow(2).height = multi ? 44 : 30;
  let row = 4;
  curs.forEach((cur) => {
    const F = xlFmtOf(cur); const CQ = '"' + cur + '"'; const my = all.filter((x) => x.cur === cur); const gel = my.filter((x) => x.dir === 'gelir'), gid = my.filter((x) => x.dir !== 'gelir');
    const sIf = (sh, col, extra) => `SUMIFS(${sh}!$${col}:$${col},${sh}!$L:$L,${CQ}${extra || ''})`;
    // KPI
    const kr = row, vr = row + 1; sm.getRow(kr).height = 22; sm.getRow(vr).height = 30;
    const inn = xlSum(gel, (x) => x.total), out = xlSum(gid, (x) => x.total), kin = xlSum(gel, (x) => x.kd), kout = xlSum(gid, (x) => x.kd);
    const kp = [['Toplam gelir', sIf('Gelirler', 'H'), inn], ['Toplam gider', sIf('Giderler', 'H'), out], ['Net durum', `B${vr}-C${vr}`, inn - out], ['Hesaplanan KDV', sIf('Gelirler', 'G'), kin], ['İndirilecek KDV', sIf('Giderler', 'G'), kout]];
    kp.forEach((x, i) => { const c = sm.getCell(kr, i + 2), v = sm.getCell(vr, i + 2); c.value = x[0]; c.font = { size: 10, bold: true, color: { argb: MUT } }; c.alignment = { horizontal: 'center', vertical: 'bottom' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; v.value = { formula: x[1], result: x[2] }; v.numFmt = F; v.font = { size: 14, bold: true, color: { argb: INK } }; v.alignment = { horizontal: 'center', vertical: 'middle' }; v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; });
    sm.getCell('A' + kr).value = multi ? 'Dönem toplamı · ' + cur : 'Dönem toplamı'; sm.getCell('A' + kr).font = { bold: true, color: { argb: MUT }, size: 10 };
    sm.getCell('A' + vr).value = multi ? 'Tüm veriler (' + cur + ')' : 'Tüm veriler'; sm.getCell('A' + vr).font = { bold: true, color: { argb: INK } };
    row = vr + 3;
    // Nakit ve banka
    sm.getCell('A' + (row - 1)).value = 'Nakit ve banka' + (multi ? ' (' + cur + ')' : ''); sm.getCell('A' + (row - 1)).font = { size: 13, bold: true, color: { argb: INK } };
    hdr(sm, row, ['Kasa', 'Gelir', 'Gider', 'Net']);
    const kasas = ['Nakit', 'Banka'].concat(my.some((x) => x.kasa === 'Belirtilmemiş') ? ['Belirtilmemiş'] : []);
    kasas.forEach((k, i) => { const rw = row + 1 + i; const g = xlSum(gel.filter((x) => x.kasa === k), (x) => x.total), d = xlSum(gid.filter((x) => x.kasa === k), (x) => x.total);
      sm.getCell('A' + rw).value = k; sm.getCell('A' + rw).alignment = { indent: 1 }; sm.getCell('A' + rw).font = { bold: true, color: { argb: INK } };
      [[sIf('Gelirler', 'H', `,Gelirler!$K:$K,$A${rw}`), g], [sIf('Giderler', 'H', `,Giderler!$K:$K,$A${rw}`), d], [`B${rw}-C${rw}`, g - d]].forEach((x, j) => { const c = sm.getCell(rw, j + 2); c.value = { formula: x[0], result: x[1] }; c.numFmt = F; c.border = xlBorder; }); sm.getCell('A' + rw).border = xlBorder; });
    const kt = row + 1 + kasas.length; sm.getCell('A' + kt).value = 'Toplam'; sm.getCell('A' + kt).font = { bold: true }; sm.getCell('A' + kt).alignment = { indent: 1 };
    ['B', 'C', 'D'].forEach((l, j) => { const c = sm.getCell(l + kt); c.value = { formula: `SUM(${l}${row + 1}:${l}${kt - 1})`, result: [inn, out, inn - out][j] }; c.numFmt = F; c.font = { bold: true }; c.border = { top: { style: 'thin', color: { argb: INK } } }; });
    row = kt + 3;
    // Aylık özet
    sm.getCell('A' + (row - 1)).value = 'Aylık özet' + (multi ? ' (' + cur + ')' : ''); sm.getCell('A' + (row - 1)).font = { size: 13, bold: true, color: { argb: INK } };
    hdr(sm, row, ['Dönem', 'Gelir', 'Gider', 'Net', 'Gelir KDV', 'Gider KDV']);
    const months = []; my.forEach((x) => { if (x.iso) { const m = x.iso.slice(0, 7); if (!months.includes(m)) months.push(m); } }); months.sort();
    months.forEach((m, i) => { const rw = row + 1 + i; const gg = gel.filter((x) => x.iso.slice(0, 7) === m), dd = gid.filter((x) => x.iso.slice(0, 7) === m);
      const A = sm.getCell('A' + rw); A.value = xlUtc(m + '-01'); A.numFmt = 'mmmm yyyy'; A.alignment = { indent: 1, horizontal: 'left' }; A.font = { bold: true, color: { argb: INK } }; A.border = xlBorder;
      const rg = (sh, col) => sIf(sh, col, `,${sh}!$B:$B,">="&$A${rw},${sh}!$B:$B,"<"&EDATE($A${rw},1)`);
      [[rg('Gelirler', 'H'), xlSum(gg, (x) => x.total)], [rg('Giderler', 'H'), xlSum(dd, (x) => x.total)], [`B${rw}-C${rw}`, xlSum(gg, (x) => x.total) - xlSum(dd, (x) => x.total)], [rg('Gelirler', 'G'), xlSum(gg, (x) => x.kd)], [rg('Giderler', 'G'), xlSum(dd, (x) => x.kd)]].forEach((x, j) => { const c = sm.getCell(rw, j + 2); c.value = { formula: x[0], result: x[1] }; c.numFmt = F; c.border = xlBorder; }); });
    if (months.length) { try { sm.addConditionalFormatting({ ref: `D${row + 1}:D${row + months.length}`, rules: [{ type: 'cellIs', operator: 'lessThan', formulae: [0], style: { font: { color: { argb: 'FFC0392B' }, bold: true } } }, { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [0], style: { font: { color: { argb: 'FF1E9E5A' }, bold: true } } }] }); } catch (e) {} }
    row = row + months.length + 4;
    // Gider dağılımı
    sm.getCell('A' + (row - 1)).value = 'Gider dağılımı (hesaba göre)' + (multi ? ' (' + cur + ')' : ''); sm.getCell('A' + (row - 1)).font = { size: 13, bold: true, color: { argb: INK } };
    hdr(sm, row, ['Hesap', 'Tutar', 'Pay']); const used = []; gid.forEach((x) => { const a = String(x.r.acc || ''); if (!used.includes(a)) used.push(a); });
    used.forEach((a, i) => { const rw = row + 1 + i; const v = xlSum(gid.filter((x) => String(x.r.acc || '') === a), (x) => x.total);
      sm.getCell('A' + rw).value = a; sm.getCell('A' + rw).alignment = { indent: 1 }; sm.getCell('A' + rw).border = xlBorder;
      const b = sm.getCell('B' + rw); b.value = { formula: sIf('Giderler', 'H', `,Giderler!$D:$D,$A${rw}`), result: v }; b.numFmt = F; b.border = xlBorder;
      const c = sm.getCell('C' + rw); c.value = { formula: `IF($C$${vr}=0,0,B${rw}/$C$${vr})`, result: out ? v / out : 0 }; c.numFmt = '0.0%'; c.border = xlBorder; });
    if (used.length) { try { sm.addConditionalFormatting({ ref: `B${row + 1}:B${row + used.length}`, rules: [{ type: 'dataBar', gradient: false, cfvo: [{ type: 'num', value: 0 }, { type: 'max' }], color: { argb: 'FF9FC5F8' } }] }); } catch (e) {} }
    row = row + used.length + 4;
  });
}

function xlPeriods(wb, X) {
  const { NAVY, hdr } = X; const all = xlRowsAll().filter((x) => x.iso); const curs = xlCurList();
  const dstr = (d) => String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear();
  const addD = (d, n) => new Date(d.getTime() + n * 864e5);
  const isoWeek = (d) => { const t = new Date(d.getTime()); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); const y = t.getUTCFullYear(); const w = Math.ceil(((t - new Date(Date.UTC(y, 0, 1))) / 864e5 + 1) / 7); return [y, w]; };
  const G = {
    'Günlük': (iso) => { const d = xlUtc(iso); return { key: iso, a: dstr(d), s: d, e: d }; },
    'Haftalık': (iso) => { const d = xlUtc(iso); const s = addD(d, -((d.getUTCDay() + 6) % 7)); const e = addD(s, 6); const [y, w] = isoWeek(s); return { key: s.toISOString().slice(0, 10), a: y + '-H' + String(w).padStart(2, '0') + ' (' + dstr(s).slice(0, 5) + ' – ' + dstr(e).slice(0, 5) + ')', s, e }; },
    'Aylık': (iso) => { const d = xlUtc(iso); const s = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); const e = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); return { key: s.toISOString().slice(0, 10), a: XL_AYAD[s.getUTCMonth()] + ' ' + s.getUTCFullYear(), s, e }; },
    'Yıllık': (iso) => { const y = +iso.slice(0, 4); return { key: String(y), a: String(y), s: new Date(Date.UTC(y, 0, 1)), e: new Date(Date.UTC(y, 11, 31)) }; },
  };
  const heads = ['Dönem', 'Başlangıç', 'Bitiş', 'Para birimi', 'Nakit gelir', 'Nakit gider', 'Banka gelir', 'Banka gider', 'Belirtilmemiş gelir', 'Belirtilmemiş gider', 'Toplam gelir', 'Toplam gider', 'Net'];
  const cols = [['Nakit', 'gelir'], ['Nakit', 'gider'], ['Banka', 'gelir'], ['Banka', 'gider'], ['Belirtilmemiş', 'gelir'], ['Belirtilmemiş', 'gider']];
  Object.keys(G).forEach((name) => {
    const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: 'FF2B73D6' } }, views: [{ state: 'frozen', ySplit: 1, xSplit: 1, showGridLines: false }] });
    ws.columns = [{ width: 26 }, { width: 12 }, { width: 12 }, { width: 11 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 17 }, { width: 17 }, { width: 16 }, { width: 16 }, { width: 16 }];
    hdr(ws, 1, heads); ws.getRow(1).height = 30; ws.getRow(1).alignment = { wrapText: true, vertical: 'middle' };
    const map = new Map(); all.forEach((x) => { const g = G[name](x.iso); const k = g.key + '|' + x.cur; if (!map.has(k)) map.set(k, { g, cur: x.cur, rows: [] }); map.get(k).rows.push(x); });
    const items = [...map.values()].sort((p, q) => (p.g.key < q.g.key ? -1 : p.g.key > q.g.key ? 1 : curs.indexOf(p.cur) - curs.indexOf(q.cur)));
    items.forEach((it, i) => {
      const rw = i + 2; const F = xlFmtOf(it.cur);
      ws.getCell('A' + rw).value = it.g.a; ws.getCell('A' + rw).font = { bold: true }; ws.getCell('A' + rw).alignment = { indent: 1 };
      ws.getCell('B' + rw).value = it.g.s; ws.getCell('C' + rw).value = it.g.e; ws.getCell('B' + rw).numFmt = ws.getCell('C' + rw).numFmt = 'dd.mm.yyyy'; ws.getCell('D' + rw).value = it.cur; ws.getCell('D' + rw).alignment = { horizontal: 'center' };
      const vals = cols.map(([k, d]) => xlSum(it.rows.filter((x) => x.kasa === k && (d === 'gelir' ? x.dir === 'gelir' : x.dir !== 'gelir')), (x) => x.total));
      cols.forEach(([k, d], j) => { const sh = d === 'gelir' ? 'Gelirler' : 'Giderler'; const c = ws.getCell(rw, 5 + j);
        c.value = { formula: `SUMIFS(${sh}!$H:$H,${sh}!$L:$L,$D${rw},${sh}!$K:$K,"${k}",${sh}!$B:$B,">="&$B${rw},${sh}!$B:$B,"<="&$C${rw})`, result: vals[j] }; c.numFmt = F; });
      const gi = vals[0] + vals[2] + vals[4], gd = vals[1] + vals[3] + vals[5];
      [['K', `E${rw}+G${rw}+I${rw}`, gi], ['L', `F${rw}+H${rw}+J${rw}`, gd], ['M', `K${rw}-L${rw}`, gi - gd]].forEach(([l, f, v]) => { const c = ws.getCell(l + rw); c.value = { formula: f, result: v }; c.numFmt = F; c.font = { bold: true }; });
      for (let c = 1; c <= 13; c++) ws.getCell(rw, c).border = xlBorder;
    });
    const n = items.length + 1;
    if (items.length) {
      try { ws.addConditionalFormatting({ ref: `M2:M${n}`, rules: [{ type: 'cellIs', operator: 'lessThan', formulae: [0], style: { font: { color: { argb: 'FFC0392B' }, bold: true } } }, { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [0], style: { font: { color: { argb: 'FF1E9E5A' }, bold: true } } }] }); } catch (e) {}
      try { ws.autoFilter = { from: 'A1', to: 'M' + n }; } catch (e) {}
      let tr = n + 2; ws.getCell('A' + tr).value = 'Toplam (para birimi ayrı)'; ws.getCell('A' + tr).font = { bold: true, color: { argb: NAVY } };
      curs.filter((c) => items.some((it) => it.cur === c)).forEach((cur) => { tr++; const mine = items.filter((it) => it.cur === cur); const F = xlFmtOf(cur);
        ws.getCell('A' + tr).value = 'Toplam'; ws.getCell('A' + tr).alignment = { indent: 1 }; ws.getCell('A' + tr).font = { bold: true }; ws.getCell('D' + tr).value = cur; ws.getCell('D' + tr).alignment = { horizontal: 'center' }; ws.getCell('D' + tr).font = { bold: true };
        const tv = cols.map((_, j) => xlSum(mine, (it) => xlSum(it.rows.filter((x) => x.kasa === cols[j][0] && (cols[j][1] === 'gelir' ? x.dir === 'gelir' : x.dir !== 'gelir')), (x) => x.total)));
        'EFGHIJ'.split('').forEach((l, j) => { const c = ws.getCell(l + tr); c.value = { formula: `SUMIFS(${l}$2:${l}$${n},$D$2:$D$${n},$D${tr})`, result: tv[j] }; c.numFmt = F; c.font = { bold: true }; c.border = { top: { style: 'thin', color: { argb: 'FF0E2B4D' } } }; });
        const gi = tv[0] + tv[2] + tv[4], gd = tv[1] + tv[3] + tv[5];
        [['K', `E${tr}+G${tr}+I${tr}`, gi], ['L', `F${tr}+H${tr}+J${tr}`, gd], ['M', `K${tr}-L${tr}`, gi - gd]].forEach(([l, f, v]) => { const c = ws.getCell(l + tr); c.value = { formula: f, result: v }; c.numFmt = F; c.font = { bold: true }; c.border = { top: { style: 'thin', color: { argb: 'FF0E2B4D' } } }; }); });
    } else { ws.getCell('A2').value = 'Henüz kayıt yok.'; ws.getCell('A2').font = { color: { argb: 'FF5B6B82' } }; }
  });
}

/* ===== v247: Excel aktarımı: satır bazında "Ödeme şekli" sütunundan nakit/banka ayrımı ===== */
const IX_PAY_NAKIT = /^(nakit|cash|pe[sş]in|kasa|elden)(\b|$)/;
const IX_PAY_BANKA = /havale|\beft\b|\bfast\b|banka|bank|kredi\s*kart|kart|\bpos\b|[cç]ek\b|transfer|virman|\bach\b|card|swift|sepa/;
function ixPayKind(v) {
  const t = String(v == null ? '' : v).toLocaleLowerCase('tr').replace(/İ/g, 'i').trim(); if (!t) return '';
  if (IX_PAY_NAKIT.test(t)) return 'nakit'; if (IX_PAY_BANKA.test(t)) return 'banka'; return '';
}
/* Aktarılan satırların ek sütunlarında (ex) ödeme şekli sütununu bulur, satırlara ch yazar. Bulamazsa null döner, hiçbir şey yazmaz. */
function ixPayCol(rows) {
  const keys = {}; rows.forEach((r) => { const ex = r.ex || {}; Object.keys(ex).forEach((k) => { const v = ex[k]; if (v == null || v === '') return; (keys[k] = keys[k] || { n: 0, hit: 0 }).n++; if (ixPayKind(v)) keys[k].hit++; }); });
  let best = null; Object.keys(keys).forEach((k) => { const q = keys[k]; if (q.n >= 2 && q.hit / q.n >= 0.6 && (!best || q.hit > keys[best].hit)) best = k; });
  if (!best) return null; let nakit = 0, banka = 0, none = 0;
  rows.forEach((r) => { const kind = ixPayKind((r.ex || {})[best]); if (kind) { r.ch = kind; if (kind === 'nakit') nakit++; else banka++; } else none++; });
  return { key: best, nakit, banka, none };
}

/* ===== v248: Aktarım kontrol özeti, kopya uyarısı, kategori önerisi ===== */
{
  const nk = (t) => String(t == null ? '' : t).toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim().slice(0, 20);
  const _b2 = ixBuild;
  ixBuild = function (type, map, P) {
    const R = _b2.apply(this, arguments);
    try {
      if (type !== 'defter' || !R || !R.out) return R;
      /* 0) Elle düzeltilen atlanmış satırlar */
      R.fixl = [];
      const fixK = (typeof MXI !== 'undefined' && MXI.fix) || {}; const si = (typeof MXI !== 'undefined' ? MXI.si : 0) || 0;
      const rowOf = {}; P.data.forEach((r) => { rowOf[r.__n] = r; });
      (R.skip || []).slice().forEach((x) => {
        if (x.sum || !/^(Tutar yok|Tarih yok)/.test(x.why)) return; const row = rowOf[x.n]; if (!row) return;
        const filled = row.filter((c) => String(c == null ? '' : c).trim() !== '').length; if (filled < 2) return;
        const fx = fixK[si + ':' + x.n];
        const desc = (String(row[map.desc] == null ? '' : row[map.desc]).trim() || String(row[map.acc] == null ? '' : row[map.acc]).trim() || '(açıklamasız)').slice(0, 80);
        if (!fx) { R.fixl.push({ n: x.n, why: x.why, desc }); return; }
        let iso = fx.iso, total = fx.total, dir = fx.dir;
        if (!iso && map.date != null) iso = ixDate(row[map.date], (MXI.dec && MXI.dec.dfmt) || 'dmy') || '';
        if (!total) { const gv = map.gelir != null ? ixN(row[map.gelir]) || 0 : 0; const dv = map.gider != null ? Math.abs(ixN(row[map.gider]) || 0) : 0; const tv = map.total != null ? Math.abs(ixN(row[map.total]) || 0) : 0; if (gv) { total = Math.abs(gv); dir = dir || 'gelir'; } else if (dv) { total = dv; dir = dir || 'gider'; } else total = tv; }
        if (!iso || !total) { R.fixl.push({ n: x.n, why: x.why, desc }); return; }
        dir = dir || 'gider'; total = Math.round(total * 100) / 100; const key = iso + '|' + total.toFixed(2) + '|' + desc.slice(0, 20);
        R.skip.splice(R.skip.indexOf(x), 1);
        if (LEDGER.some((l) => l.ixk === key)) { R.dup = (R.dup || 0) + 1; return; }
        R.out.push({ n: x.n, iso, desc, total, dir, rate: 0, acc: (map.acc != null ? String(row[map.acc] == null ? '' : row[map.acc]).trim() : '') || (dir === 'gelir' ? INCATS[2] : 'Diğer'), doc: '—', key, ex: {}, br: '' });
        R.warn.push({ n: x.n, why: 'Elle düzeltildi (KDV 0 alındı)' });
      });
      R.out.sort((x, y) => x.n - y.n);
      /* 1) Kategori önerisi: hesap sütunu eşlenmediyse, daha önce aynı açıklamayla girilmiş kayıtların hesabı önerilir (kendi geçmişin) */
      R.sug = 0;
      if (map.acc == null) {
        const h = {}; LEDGER.forEach((r) => { if (!r.acc || r.acc === 'Diğer' || r.src === 'Excel' && r.sugd) return; const k = nk(r.desc) + '|' + dirOf(r); (h[k] = h[k] || {})[r.acc] = ((h[k] || {})[r.acc] || 0) + 1; });
        R.out.forEach((o) => { const c = h[nk(o.desc) + '|' + o.dir]; if (!c) return; const best = Object.keys(c).sort((x, y) => c[y] - c[x])[0]; if (best && best !== o.acc) { o.acc = best; o.sug = true; R.sug++; } });
      }
      /* 2) Elle girilmiş kayıtla aynı gün/tutar/yön: aktarılır ama uyarılır */
      R.near = 0;
      R.out.forEach((o) => { if (LEDGER.some((r) => !r.ixk && r.iso === o.iso && Math.abs((+r.total || 0) - o.total) < 0.005 && dirOf(r) === o.dir)) { R.near++; R.warn.push({ n: o.n, why: 'Aynı gün ve tutarda elle girilmiş bir kayıt var (' + o.desc.slice(0, 24) + '), çift olabilir' }); } });
      R.devir = (R.skip || []).filter((x) => /^Devir/.test(x.why)).length + (P && P.data ? P.data.filter((r) => ixSumRow(r) && r.some((c) => /^(devir|açılış|acilis|opening|brought|carried)/.test(ixNorm(c)))).length : 0);
      /* 3) Özet */
      const sm = { n: R.out.length, gelir: 0, gider: 0, nakit: 0, banka: 0, none: 0 };
      R.out.forEach((o) => { if (o.dir === 'gelir') sm.gelir += o.total; else sm.gider += o.total; });
      const ch = (typeof MXI !== 'undefined' && MXI.ch) || '';
      if (ch) { if (ch === 'nakit') sm.nakit = sm.n; else sm.banka = sm.n; } else { const rc = ixPayCol(R.out.map((o) => ({ ex: o.ex, o }))); if (rc) { sm.nakit = rc.nakit; sm.banka = rc.banka; sm.none = rc.none; } else sm.none = sm.n; }
      R.sm = sm;
      /* 4) Aylık döküm + bakiye tutarlılığı */
      const MA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']; const ym2 = (iso) => iso.slice(0, 7);
      const mon = {}; R.out.forEach((o) => { const k = ym2(o.iso); const m = mon[k] = mon[k] || { gelir: 0, gider: 0, bal: null }; if (o.dir === 'gelir') m.gelir += o.total; else m.gider += o.total; });
      const bi = P.heads.findIndex((h, i) => /bakiye|balance/.test(ixNorm(h)) && i !== map.gelir && i !== map.gider && i !== map.total);
      R.balBad = null;
      if (bi >= 0 && map.date != null && (map.gelir != null || map.gider != null)) {
        let prev = null; const fm = (MXI.dec && MXI.dec.dfmt) || 'dmy';
        P.data.forEach((r) => { const b = ixN(r[bi]); const di = ixDate(r[map.date], fm); if (b === null) return; const d = (map.gelir != null ? ixN(r[map.gelir]) || 0 : 0) - (map.gider != null ? Math.abs(ixN(r[map.gider]) || 0) : 0); if (prev !== null && Math.abs(b - prev - d) > 0.05 && !R.balBad) R.balBad = { n: r.__n, ym: di ? ym2(di) : '' }; prev = b; if (di) { const k = ym2(di); (mon[k] = mon[k] || { gelir: 0, gider: 0, bal: null }).bal = b; } });
      }
      R.mon = Object.keys(mon).sort().map((k) => ({ k, label: MA[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4), gelir: mon[k].gelir, gider: mon[k].gider, bal: mon[k].bal }));
    } catch (e) {}
    return R;
  };
  window.ixSumHtml = function (R) {
    const sm = R && R.sm; if (!sm || !sm.n) return '';
    const m = (v) => fmt0(Math.round(v * 100) / 100);
    const cell = (l, v, c) => '<div class="kpi"><div class="l">' + l + '</div><div class="v num"' + (c ? ' style="color:' + c + '"' : '') + '>' + v + '</div></div>';
    return '<div class="kpis" style="margin-top:8px">' + cell('Gelir', m(sm.gelir), 'var(--ok,#1a8f4b)') + cell('Gider', m(sm.gider), 'var(--bad,#c0392b)') + cell('Net', m(sm.gelir - sm.gider)) + '</div>'
      + '<p class="small muted" style="margin-top:6px">Kasa dağılımı: ' + sm.nakit + ' nakit, ' + sm.banka + ' banka' + (sm.none ? ', ' + sm.none + ' belirtilmemiş' : '') + '.</p>'
      + (R.sug ? '<div class="callout" style="margin-top:6px">' + ic('check') + '<div><p>' + R.sug + ' satırın hesabı, daha önce kendi girdiğin aynı açıklamalardan alındı. Önizlemede kontrol edebilirsin.</p></div></div>' : '')
      + (typeof MXI !== 'undefined' && MXI.nofNote ? '<div class="callout warn" style="margin-top:6px">' + ic('alert') + '<div><p><b>' + MXI.nofNote + ' hücrede formülün sonucu dosyada kayıtlı değil</b>, bu hücreler boş okundu ve satırlar eksik gelebilir. Dosyayı Excel\'de açıp kaydet, sonra yeniden yükle.</p></div></div>' : '')
      + (typeof MXI !== 'undefined' && MXI.autoDir ? '<p class="small muted" style="margin-top:6px">Gelir/gider yönü ' + esc(MXI.autoDir) + ' anlaşıldı.</p>' : '')
      + (typeof MXI !== 'undefined' && MXI.layNote ? '<p class="small muted" style="margin-top:6px">Bu dosya düzeni daha önce aktarılmıştı, sütunlar aynı şekilde eşlendi. Yanlışsa aşağıdan değiştirebilirsin.</p>' : '')
      + (R.devir ? '<p class="small muted" style="margin-top:6px">' + R.devir + ' devir/açılış satırı gelir sayılmadı.</p>' : '')
      + (R.mon && R.mon.length > 1 ? '<details style="margin-top:8px"><summary style="cursor:pointer" class="small"><b>Aylık döküm (' + R.mon.length + ' ay)</b></summary>' + R.mon.map((m) => '<div class="small row" style="justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid var(--line,#e5e8ee)"><span>' + m.label + '</span><span class="num">+' + fmt0(Math.round(m.gelir)) + ' / −' + fmt0(Math.round(m.gider)) + (m.bal != null ? ' · dosya bakiyesi ' + fmt0(Math.round(m.bal)) : '') + '</span></div>').join('') + '</details>' : '')
      + (R.balBad ? '<div class="callout warn" style="margin-top:6px">' + ic('alert') + '<div><p>Dosyadaki bakiye sütunu satır ' + R.balBad.n + ' civarında tutmuyor' + (R.balBad.ym ? ' (' + R.balBad.ym.slice(5, 7) + '/' + R.balBad.ym.slice(0, 4) + ')' : '') + '. Orada eksik, silinmiş ya da elle değiştirilmiş bir satır olabilir. Aktarmadan önce o ayı kontrol et.</p></div></div>' : '')
      + (R.fixl && R.fixl.length ? '<details style="margin-top:8px" open><summary style="cursor:pointer" class="small"><b>Eksik satırları tamamla (' + R.fixl.length + ')</b></summary>' + R.fixl.slice(0, 8).map((x) => '<div class="card" style="padding:8px 10px;margin-top:6px"><div class="small"><b>Satır ' + x.n + '</b> · ' + esc(x.desc) + '<br><span class="muted">' + esc(x.why) + '</span></div><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><input id="ixf-d-' + x.n + '" type="date" style="' + mxInp + ';flex:1 1 130px;padding:8px"><input id="ixf-a-' + x.n + '" inputmode="decimal" placeholder="Tutar" style="' + mxInp + ';flex:1 1 90px;padding:8px"><select id="ixf-r-' + x.n + '" style="' + mxInp + ';flex:1 1 90px;padding:8px"><option value="gider">Gider</option><option value="gelir">Gelir</option></select><button class="btn sm" data-a="ixfixadd" data-i="' + x.n + '">Ekle</button></div></div>').join('') + (R.fixl.length > 8 ? '<p class="small muted">… ve ' + (R.fixl.length - 8) + ' satır daha (listeyi indirip dosyada düzeltebilirsin).</p>' : '') + '</details>' : '')
      + (R.near ? '<div class="callout warn" style="margin-top:6px">' + ic('alert') + '<div><p>' + R.near + ' satır, elle girdiğin bir kayıtla aynı gün ve tutarda. Aynı işlemse aktarmadan önce kontrol et.</p></div></div>' : '');
  };
}

/* satır düzeltme eylemi */
H.ixfixadd = (el) => {
  const n = +el.dataset.i; const g = (id) => { const x = document.getElementById(id); return x ? x.value : ''; };
  const iso = g('ixf-d-' + n); const tot = mxNum(g('ixf-a-' + n)); const dir = g('ixf-r-' + n) || 'gider';
  const sh = ixCur(); const R = sh ? ixBuild(MXI.type, MXI.map, sh._p) : null; const it = R && R.fixl.find((x) => x.n === n); if (!it) return;
  if (/^Tarih/.test(it.why) && !iso) return toast('Tarihi seç.', 'warn');
  if (/^Tutar/.test(it.why) && !(tot > 0)) return toast('Tutarı yaz.', 'warn');
  if (!iso && !(tot > 0)) return toast('Tarih ve tutarı yaz.', 'warn');
  MXI.fix = MXI.fix || {}; MXI.fix[(MXI.si || 0) + ':' + n] = { iso: iso || '', total: tot > 0 ? tot : 0, dir }; renderModal();
};

/* ===== v249: para birimi tanıma, düzen hafızası ===== */
const IX_CURA = { '$': 'USD', 'USD': 'USD', 'DOLAR': 'USD', 'DOLLAR': 'USD', '€': 'EUR', 'EUR': 'EUR', 'EURO': 'EUR', '£': 'GBP', 'GBP': 'GBP', 'STERLIN': 'GBP', 'R': 'ZAR', 'ZAR': 'ZAR', 'RAND': 'ZAR', 'TL': 'TRY', 'TRY': 'TRY', '₺': 'TRY' };
function ixCurCh(c) {
  const code = IX_CURA[String(c || '').trim().toUpperCase().replace(/İ/g, 'I')] || ''; if (!code || code === 'TRY') return '';
  const kc = (S.settings && S.settings.kcur) || {}; const m = ['nakit', 'banka'].filter((k) => kc[k] && kc[k].code === code); return m.length === 1 ? m[0] : '';
}
{
  const sigOf = (P) => (P && P.heads ? P.heads.map((h) => ixNorm(h)).join('|') : '');
  const lays = () => ((S.settings = S.settings || {}).ixlay = S.settings.ixlay || {});
  const _a = ixAuto;
  ixAuto = function (type, P) {
    const m = _a.apply(this, arguments);
    try { const L = lays()[sigOf(P)]; const sm = L && L.map && L.map[type]; if (sm && Object.keys(sm).every((k) => sm[k] < P.heads.length)) return Object.assign({}, sm); } catch (e) {}
    return m;
  };
  const _s = ixSetSheet;
  ixSetSheet = function (i) {
    const r = _s.apply(this, arguments);
    try { const sh = ixCur(); MXI.layNote = false; const L = sh && lays()[sigOf(sh._p)]; if (L) { MXI.layNote = true; if (L.ch && L.chName === ixNorm(sh.name) && sh._ch == null && !MXI.ch) MXI.ch = L.ch; } MXI.fix = MXI.fix || {}; } catch (e) {}
    return r;
  };
  const _l = ixLoadSheets;
  ixLoadSheets = function () { MXI.fix = {}; return _l.apply(this, arguments); };
  const _im = H.iximport;
  H.iximport = function () {
    const sh0 = ixCur(); const P0 = sh0 && sh0._p; const type0 = MXI.type; const map0 = Object.assign({}, MXI.map); const ch0 = MXI.ch; const n0 = LEDGER.length;
    const r = _im.apply(this, arguments);
    try {
      if (MXI.step === 'done') {
        for (let i = n0; i < LEDGER.length; i++) { const x = LEDGER[i]; if (x.src === 'Excel' && x.ex && x.ex['Para birimi']) { const k = ixCurCh(x.ex['Para birimi']); if (k) x.ch = k; } }
        if (P0 && type0 === 'defter') { const L = lays(); const sg = sigOf(P0); const o = L[sg] || { map: {} }; o.map[type0] = map0; o.ch = ch0 || ''; o.chName = ch0 && sh0 ? ixNorm(sh0.name) : ''; o.at = Date.now(); delete L[sg]; L[sg] = o; const ks = Object.keys(L); while (ks.length > 30) delete L[ks.shift()]; try { pSched(); } catch (e) {} }
      }
    } catch (e) {}
    return r;
  };
}

/* ===== v250: farklı Excel düzenlerini tek biçime çevirme (yan yana tablolar, bölümlü liste, aylık matris) + yön çıkarımı ===== */
const IXS_MON = { oca: 1, jan: 1, şub: 2, sub: 2, feb: 2, mar: 3, nis: 4, apr: 4, may: 5, haz: 6, jun: 6, tem: 7, jul: 7, ağu: 8, agu: 8, aug: 8, eyl: 9, sep: 9, eki: 10, oct: 10, kas: 11, nov: 11, ara: 12, dec: 12 };
const IXS_MONL = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function ixsTxt(v) { return String(v == null ? '' : v).trim(); }
function ixsMonth(h) { const t = ixNorm(h).replace(/[^a-zçğıöşü0-9 ]/g, ' ').trim(); const w = t.split(' ')[0] || ''; if (w.length < 3 || w.length > 9) return 0; const m = IXS_MON[w.slice(0, 3)]; if (!m) return 0; return /^(oca|jan|şub|sub|feb|mar|nis|apr|may|haz|jun|tem|jul|ağu|agu|aug|eyl|sep|eki|oct|kas|nov|ara|dec)[a-zçğıöşü]*$/.test(w) ? m : 0; }
/* Sayfa/bölüm adından yön: yalnızca açık kelimeler */
function ixsDir(txt) {
  const t = ixNorm(txt); if (!t || /toplam|total|net\b|kâr|zarar|fark|bakiye/.test(t)) return '';
  const g = /gelir|income|revenue|satış|satis|tahsilat|girdi|giren|sales/.test(t), d = /gider|expense|masraf|maliyet|harcama|çıkan|cikan|ödemeler|odemeler|alışlar|alislar|spending|cost/.test(t);
  return g && !d ? 'gelir' : d && !g ? 'gider' : '';
}
function ixsHeader(rows) {
  let hi = 0, best = -1; rows.slice(0, 15).forEach((r, i) => { const t = r.filter((c) => { const x = ixsTxt(c); return x && ixN(c) === null && !ixDate(c); }).length; if (t > best && t >= 2) { best = t; hi = i; } }); return best >= 2 ? hi : -1;
}
function ixsMk(arr, n) { arr.__n = n; return arr; }
/* Bölüm başlıklı liste: "GELİRLER" ... satırlar ... "GİDERLER" ... satırlar */
function ixsSections(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return sh;
  const H = rows[hi].map(ixsTxt); if (H.some((h) => /^(tür|tur|tip|yön|yon|type)$/i.test(h))) return sh;
  let cur = '', found = 0; const out = [];
  rows.slice(hi + 1).forEach((r) => {
    const ne = r.map((c, i) => [i, ixsTxt(c)]).filter((x) => x[1] !== '');
    if (ne.length === 1 && ne[0][0] <= 1 && ixN(ne[0][1]) === null) { const d = ixsDir(ne[0][1]); if (d) { cur = d; found++; return; } }
    out.push(ixsMk(r.concat(new Array(Math.max(0, H.length - r.length)).fill('')).slice(0, H.length).concat([cur === 'gelir' ? 'Gelir' : cur === 'gider' ? 'Gider' : '']), r.__n));
  });
  if (!found) return sh;
  return { name: sh.name, cur: sh.cur, rows: [ixsMk(H.concat(['Tür']), rows[hi].__n)].concat(out) };
}
/* Aylık matris: satırlar kalem, sütunlar ay -> hareket satırlarına çevrilir */
function ixsMatrix(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return [sh];
  const H = rows[hi].map(ixsTxt); const mi = []; H.forEach((h, i) => { const m = ixsMonth(h); if (m && i >= 1) mi.push([i, m, h]); });
  if (mi.length < 3 || new Set(mi.map((x) => x[1])).size !== mi.length) return [sh];
  const above = rows.slice(0, hi + 1).map((r) => r.join(' ')).join(' ') + ' ' + sh.name; let ym = (above.match(/\b(20\d\d)\b/) || [])[1]; let assumed = false; if (!ym) { ym = String(new Date().getFullYear()); assumed = true; }
  const typI = H.findIndex((h) => /^(tür|tur|tip|yön|yon|type)$/i.test(h));
  const labI = (() => { let b = 0; for (let i = 0; i < H.length; i++) { if (mi.some((x) => x[0] === i)) continue; b = i; break; } return b; })();
  const out = [ixsMk(['Tarih', 'Açıklama', 'Tutar', 'Tür'], rows[hi].__n)]; let cur = '';
  rows.slice(hi + 1).forEach((r) => {
    const lab = ixsTxt(r[labI]); if (!lab) return;
    const nums = mi.filter((x) => ixN(r[x[0]]) !== null && ixN(r[x[0]]) !== 0);
    if (!nums.length) { const d = ixsDir(lab); if (d) cur = d; return; }
    if (/^(genel\s*)?toplam|^net\b|^(net\s*)?(kâr|kar)\b|^zarar|^fark|^bakiye|^total|^profit|^devir/.test(ixNorm(lab))) return;
    const d = ixsDir(typI >= 0 ? r[typI] : '') || cur || ixsDir(lab);
    nums.forEach((x) => out.push(ixsMk(['01.' + String(x[1]).padStart(2, '0') + '.' + ym, lab + ' · ' + IXS_MONL[x[1] - 1], Math.abs(ixN(r[x[0]])) * (ixN(r[x[0]]) < 0 && !d ? -1 : 1), d === 'gelir' ? 'Gelir' : d === 'gider' ? 'Gider' : ''], r.__n)));
  });
  if (out.length < 2) return [sh];
  return [{ name: sh.name + ' (aylık tablo' + (assumed ? ', yıl dosyada yok: ' + ym + ' alındı' : '') + ')', cur: sh.cur, rows: out }];
}
/* Yan yana iki tablo: başlık satırında ilk başlık tekrar ediyorsa böl */
function ixsSplit(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return [sh];
  const H = rows[hi].map((c) => ixNorm(c)); const first = H.find((x) => x); if (!first) return [sh];
  const idx = []; H.forEach((h, i) => { if (h === first) idx.push(i); }); if (idx.length < 2) return [sh];
  const ends = idx.slice(1).concat([H.length]); const parts = [];
  idx.forEach((s, k) => {
    const e = ends[k]; const title = rows.slice(0, hi + 1).map((r) => r.slice(s, e).join(' ')).join(' '); const d = ixsDir(title);
    const body = rows.slice(hi).map((r) => ixsMk(r.slice(s, e), r.__n)).filter((r, j) => j === 0 || r.some((c) => ixsTxt(c) !== ''));
    if (body.length < 2) return; parts.push({ name: sh.name + ' · ' + (d === 'gelir' ? 'Gelirler' : d === 'gider' ? 'Giderler' : 'Tablo ' + (k + 1)), cur: sh.cur, rows: body });
  });
  return parts.length ? parts : [sh];
}
function ixsNormalize(sheets) {
  const out = []; sheets.forEach((sh) => { try { ixsSplit(sh).forEach((s1) => { const s2 = ixsSections(s1); ixsMatrix(s2).forEach((s3) => out.push(s3)); }); } catch (e) { out.push(sh); } }); return out;
}
{
  const _l2 = ixLoadSheets; ixLoadSheets = function (sheets, fn) { try { sheets.forEach((s) => s.rows.forEach((r, i) => { if (r.__n == null) r.__n = i + 1; })); sheets = ixsNormalize(sheets); } catch (e) {} return _l2.call(this, sheets, fn); };
  /* yön çıkarımı: gelir/gider sütunu ya da Tür yoksa sayfa adından ya da artı/eksi işaretinden; yoksa eskisi gibi sorulur */
  const _b3 = ixBuild;
  ixBuild = function (type, map, P) {
    let saved = null; MXI.autoDir = '';
    try {
      if (type === 'defter' && MXI.dec && MXI.dec.dir == null && map.gelir == null && map.gider == null && map.dir == null) {
        const sh = (MXI.sheets || []).find((s) => s._p === P); let auto = '', why = '';
        const dn = sh ? ixsDir(sh.name) : ''; if (dn) { auto = dn; why = 'sayfa adından (' + sh.name + ')'; }
        else if (map.total != null) { const v = P.data.map((r) => ixN(r[map.total])).filter((x) => x !== null && x !== 0); if (v.some((x) => x < 0) && v.some((x) => x > 0)) { auto = 'sign'; why = 'tutarın işaretinden (artı gelir, eksi gider)'; } }
        if (auto) { saved = MXI.dec; MXI.dec = Object.assign({}, saved, { dir: auto }); MXI.autoDir = why; }
      }
    } catch (e) {}
    try { return _b3.apply(this, arguments); } finally { if (saved) MXI.dec = saved; }
  };
}

/* ===== v250b: aynı satırda hem gelir hem gider, sütun adı/değerinden yön, günlük satış (nakit/kart), yevmiye ===== */
function ixExpandBoth(data, map) {
  if (map.gelir == null || map.gider == null) return data;
  let any = false; const out = [];
  data.forEach((r) => { const a = ixN(r[map.gelir]), b = ixN(r[map.gider]); if (a > 0 && b > 0) { any = true; const x = r.slice(); x[map.gider] = ''; x.__n = r.__n; const y = r.slice(); y[map.gelir] = ''; y.__n = r.__n; out.push(x, y); } else out.push(r); });
  return any ? out : data;
}
{
  const GPRE = /^(giriş|giris|gelir|giren|tahsilat|alacak|credit|income|para girişi)/, DPRE = /^(çıkış|cikis|gider|çıkan|cikan|ödeme|odeme|borç|borc|debit|expense|para çıkışı)/;
  const DIRW = /^(gelir|gider|tahsilat|ödeme|odeme|giriş|giris|çıkış|cikis|borç|borc|alacak|income|expense|debit|credit|cr|dr|satış|satis|alış|alis|para girişi|para çıkışı|giren|çıkan|cikan|deposit|withdrawal|payment)$/;
  const _a2 = ixAuto;
  ixAuto = function (type, P) {
    const m = _a2.apply(this, arguments);
    try {
      if (type === 'defter') {
        const hn = P.heads.map(ixNorm);
        if (m.total != null && m.gelir == null && GPRE.test(hn[m.total]) && !/^(alacak)/.test(hn[m.total]) || (m.total != null && m.gelir == null && m.gider != null && GPRE.test(hn[m.total]))) { m.gelir = m.total; delete m.total; }
        else if (m.total != null && m.gider == null && DPRE.test(hn[m.total]) && m.gelir != null) { m.gider = m.total; delete m.total; }
        if (m.dir == null && m.gelir == null && m.gider == null) {
          const used = new Set(Object.values(m)); let best = -1, bs = 0.8;
          P.heads.forEach((_, i) => { if (used.has(i)) return; const v = P.data.slice(0, 80).map((r) => ixNorm(r[i])).filter((x) => x); if (v.length < 2) return; const f = v.filter((x) => DIRW.test(x)).length / v.length; if (f >= bs && new Set(v).size <= 8) { bs = f; best = i; } });
          if (best >= 0) m.dir = best;
        }
      }
    } catch (e) {}
    return m;
  };
}
/* Günlük satış: Tarih | Nakit | Kredi Kartı | (Toplam) -> her ödeme şekli ayrı satır */
const IXS_PAYH = /^(nakit|cash|peşin|pesin|kredi\s*kart[ıi]?|kart|k\.?\s*kart[ıi]?|pos|banka|havale|eft|havale\s*\/\s*eft|çek|cek)\b/;
function ixsPayCols(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return sh;
  const H = rows[hi].map(ixsTxt); const hn = H.map(ixNorm);
  if (hn.some((h) => /^(gelir|gider|tutar|borç|borc|alacak|giriş|giris|çıkış|cikis|income|expense|debit|credit|amount)/.test(h))) return sh;
  const pi = []; hn.forEach((h, i) => { if (IXS_PAYH.test(h)) pi.push(i); }); if (pi.length < 2) return sh;
  const di = hn.findIndex((h) => /^(tarih|date|gün|gun)/.test(h)); if (di < 0) return sh;
  const ti = hn.findIndex((h, i) => !pi.includes(i) && /toplam|total|genel|günlük|gunluk|ciro|hasılat|hasilat/.test(h));
  const ai = hn.findIndex((h) => /açıklama|aciklama|description|not$|detay/.test(h));
  const hint = ixsDir([sh.name, H.join(' ')].join(' ')) || (/satış|satis|ciro|hasılat|hasilat|sales|tahsilat/.test(ixNorm(sh.name + ' ' + H.join(' '))) ? 'gelir' : '');
  const out = [ixsMk(['Tarih', 'Açıklama', 'Tutar', 'Ödeme Şekli', 'Tür'], rows[hi].__n)];
  rows.slice(hi + 1).forEach((r) => {
    if (!ixsTxt(r[di]) || !ixDate(r[di], 'dmy') && !ixDate(r[di], 'mdy')) return; let sum = 0;
    pi.forEach((i) => { const v = ixN(r[i]); if (v) { sum += v; out.push(ixsMk([r[di], ai >= 0 && ixsTxt(r[ai]) ? ixsTxt(r[ai]) : (hint === 'gider' ? 'Günlük ödeme' : 'Günlük satış'), v, H[i], hint === 'gelir' ? 'Gelir' : hint === 'gider' ? 'Gider' : ''], r.__n)); } });
    if (ti >= 0) { const T = ixN(r[ti]); if (T && Math.abs(T - sum) > 0.05) out.push(ixsMk([r[di], 'Toplamdan kalan (ödeme şekli belli değil)', Math.round((T - sum) * 100) / 100, '', hint === 'gelir' ? 'Gelir' : hint === 'gider' ? 'Gider' : ''], r.__n)); }
  });
  return out.length > 1 ? { name: sh.name + ' (günlük satış tablosu)', cur: sh.cur, rows: out } : sh;
}
/* Yevmiye/mizan: yalnızca 6xx ve 7xx hesapları (gelir/gider); 100 kasa, 102 banka karşı satırından ödeme şekli */
function ixsJournal(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return sh; const H = rows[hi].map(ixsTxt); const hn = H.map(ixNorm);
  const ci = hn.findIndex((h) => /^hesap\s*(kodu|no|numarası|numarasi)$|^kod$/.test(h)); const bi = hn.findIndex((h) => /^borç$|^borc$|^debit$/.test(h)); const ai = hn.findIndex((h) => /^alacak$|^credit$/.test(h));
  if (ci < 0 || bi < 0 || ai < 0) return sh;
  const fi = hn.findIndex((h) => /fiş\s*no|fis\s*no|yevmiye\s*no|madde\s*no|belge\s*no/.test(h)); const di = hn.findIndex((h) => /^tarih|^date/.test(h));
  const ni = hn.findIndex((h) => /hesap\s*ad[ıi]|^hesap$/.test(h)); const xi = hn.findIndex((h) => /açıklama|aciklama|description/.test(h));
  const code = (r) => ixsTxt(r[ci]).replace(/[^0-9]/g, ''); const data = rows.slice(hi + 1).filter((r) => code(r));
  if (data.length < 2 || data.filter((r) => /^[1-9]\d{2}/.test(code(r))).length / data.length < 0.8) return sh;
  const chOf = {}; data.forEach((r) => { const k = fi >= 0 ? ixsTxt(r[fi]) : ''; const c = code(r); if (k && /^100/.test(c)) chOf[k] = 'Nakit'; else if (k && /^10[1-2]/.test(c)) chOf[k] = chOf[k] || 'Banka'; });
  const out = [ixsMk(['Tarih', 'Açıklama', 'Tutar', 'Tür', 'Ödeme Şekli', 'Hesap'], rows[hi].__n)]; let skipped = 0;
  data.forEach((r) => { const c = code(r); if (!/^[67]/.test(c)) { skipped++; return; } const b = ixN(r[bi]) || 0, a = ixN(r[ai]) || 0; if (!b && !a) return; const net = a - b; const k = fi >= 0 ? ixsTxt(r[fi]) : '';
    out.push(ixsMk([di >= 0 ? r[di] : '', [ixsTxt(xi >= 0 ? r[xi] : ''), ixsTxt(ni >= 0 ? r[ni] : '')].filter(Boolean).join(' · ') || c, Math.abs(net), net > 0 ? 'Gelir' : 'Gider', chOf[k] || '', c + (ni >= 0 ? ' ' + ixsTxt(r[ni]) : '')], r.__n)); });
  return out.length > 1 ? { name: sh.name + ' (yevmiye: yalnızca gelir ve gider hesapları, ' + skipped + ' bilanço satırı alınmadı)', cur: sh.cur, rows: out } : sh;
}
{
  const _n = ixsNormalize;
  ixsNormalize = function (sheets) { return _n(sheets.map((sh) => { try { return ixsJournal(ixsPayCols(sh)); } catch (e) { return sh; } })); };
}

/* ===== v250c: iki satırlı başlık, günler yatay, B/A işareti ===== */
function ixsTwoHeader(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0 || hi + 2 >= rows.length) return sh;
  const top = rows[hi], sub = rows[hi + 1]; const subCells = sub.map((c, i) => [i, ixsTxt(c)]).filter((x) => x[1] !== '');
  if (subCells.length < 2 || subCells.some((x) => ixN(x[1]) !== null || ixDate(x[1]))) return sh;
  if (!subCells.some((x) => ixsTxt(top[x[0]]) === '' || /^(tutar|toplam|amount|miktar|tutarlar)$/.test(ixNorm(top[x[0]])))) return sh;
  const nxt = rows[hi + 2]; if (!nxt || !nxt.some((c) => ixN(c) !== null || ixDate(c))) return sh;
  const H = top.map((c, i) => { const t = ixsTxt(c), s = ixsTxt(sub[i]); return !s ? t : (!t || /^(tutar|toplam|amount|miktar|tutarlar)$/.test(ixNorm(t))) ? s : t + ' ' + s; });
  for (let i = top.length; i < sub.length; i++) H[i] = ixsTxt(sub[i]);
  return { name: sh.name, cur: sh.cur, rows: rows.slice(0, hi).concat([ixsMk(H, top.__n)], rows.slice(hi + 2)) };
}
function ixsBA(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return sh;
  const ci = rows[hi].findIndex((h) => /^(b\s*\/\s*a|a\s*\/\s*b|ba|ab|d\s*\/\s*c|c\s*\/\s*d|dr\s*\/\s*cr|cr\s*\/\s*dr)$/.test(ixNorm(h))); if (ci < 0) return sh;
  const hdr = ixNorm(rows[hi][ci]); const credit = /^(a|c|cr)$/, debit = /^(b|d|dr)$/;
  const data = rows.slice(hi + 1); const vals = data.map((r) => ixNorm(r[ci])).filter((x) => x); if (vals.length < 2 || !vals.every((v) => credit.test(v) || debit.test(v))) return sh;
  return { name: sh.name, cur: sh.cur, rows: rows.slice(0, hi + 1).concat(data.map((r) => { const x = r.slice(); const v = ixNorm(r[ci]); if (v) x[ci] = credit.test(v) ? 'Alacak' : 'Borç'; x.__n = r.__n; return x; })) };
}
function ixsDays(sh) {
  const rows = sh.rows; const hi = ixsHeader(rows); if (hi < 0) return sh;
  const H = rows[hi].map(ixsTxt); const di = []; H.forEach((h, i) => { if (/^\d{1,2}$/.test(h) && +h >= 1 && +h <= 31) di.push([i, +h]); });
  if (di.length < 10 || new Set(di.map((x) => x[1])).size !== di.length) return sh;
  const ctx = rows.slice(0, hi + 1).map((r) => r.join(' ')).join(' ') + ' ' + sh.name; const mm = (ixNorm(ctx).match(/[a-zçğıöşü]+/g) || []).map(ixsMonth).find((x) => x);
  if (!mm) return sh; let ym = (ctx.match(/\b(20\d\d)\b/) || [])[1]; let assumed = false; if (!ym) { ym = String(new Date().getFullYear()); assumed = true; }
  const dim = new Date(+ym, mm, 0).getDate(); const labI = H.findIndex((h, i) => !di.some((x) => x[0] === i) && true);
  const out = [ixsMk(['Tarih', 'Açıklama', 'Tutar', 'Tür'], rows[hi].__n)]; let cur = '';
  rows.slice(hi + 1).forEach((r) => {
    const lab = ixsTxt(r[labI]); if (!lab) return; const nums = di.filter((x) => ixN(r[x[0]]) !== null && ixN(r[x[0]]) !== 0 && x[1] <= dim);
    if (!nums.length) { const d = ixsDir(lab); if (d) cur = d; return; }
    if (/^(genel\s*)?toplam|^net\b|^(net\s*)?(kâr|kar)\b|^zarar|^fark|^bakiye|^total|^devir/.test(ixNorm(lab))) return;
    const d = cur || ixsDir(lab);
    nums.forEach((x) => out.push(ixsMk([String(x[1]).padStart(2, '0') + '.' + String(mm).padStart(2, '0') + '.' + ym, lab, Math.abs(ixN(r[x[0]])), d === 'gelir' ? 'Gelir' : d === 'gider' ? 'Gider' : ''], r.__n)));
  });
  return out.length > 1 ? { name: sh.name + ' (günlük tablo' + (assumed ? ', yıl dosyada yok: ' + ym + ' alındı' : '') + ')', cur: sh.cur, rows: out } : sh;
}
{
  const _n2 = ixsNormalize;
  ixsNormalize = function (sheets) { return _n2(sheets.map((sh) => { try { return ixsDays(ixsBA(ixsTwoHeader(sh))); } catch (e) { return sh; } })); };
}

/* ===== v251: "Muhasebeye başla" sihirbazı ===== */
const MB_TPL = {
  kafe: ['Restoran / kafe', 'Hammadde', ['Hammadde', 'Ambalaj', 'Kira', 'Elektrik', 'Doğalgaz', 'Su', 'Temizlik', 'Telefon / internet', 'Personel', 'Bakım / onarım', 'Reklam', 'Diğer']],
  market: ['Market / bakkal', 'cart', ['Mal alımı', 'Kira', 'Elektrik', 'Su', 'Telefon / internet', 'Personel', 'Nakliye', 'Poşet / ambalaj', 'Reklam', 'Bakım / onarım', 'Diğer']],
  atolye: ['Atölye / üretim', 'gear', ['Hammadde', 'Malzeme', 'Akaryakıt', 'Kira', 'Elektrik', 'Doğalgaz', 'Su', 'Personel', 'Bakım / onarım', 'Nakliye', 'Diğer']],
  hizmet: ['Hizmet / ofis', 'users', ['Kira', 'Elektrik', 'Telefon / internet', 'Yazılım / abonelik', 'Reklam', 'Ulaşım', 'İş yemeği', 'Personel', 'Temizlik', 'Diğer']],
  perakende: ['Mağaza / perakende', 'tag', ['Mal alımı', 'Kira', 'Elektrik', 'Ambalaj', 'Personel', 'Reklam', 'Nakliye', 'Telefon / internet', 'Diğer']],
  mevcut: ['Şimdiki liste kalsın', 'check', null],
};
const MB_DEFAULT_CATS = CATS.slice();
const MBS = { step: 0, cur: '₺', nakit: '', banka: '', kdv: '', rate: 20, tpl: '', cats: [], err: '' };
function mbApplyCats() {
  const l = S.settings && Array.isArray(S.settings.cats) && S.settings.cats.length ? S.settings.cats.slice() : null; if (!l) return;
  const used = []; LEDGER.forEach((r) => { if (dirOf(r) !== 'gelir' && r.acc && !l.includes(r.acc) && !used.includes(r.acc)) used.push(r.acc); });
  const base = l.filter((x) => x !== 'Diğer').concat(used, ['Diğer']); if (base.join('|') !== CATS.join('|')) CATS.splice(0, CATS.length, ...base);
}
function mbPool() { const s = new Set(); Object.keys(MB_TPL).forEach((k) => (MB_TPL[k][2] || []).forEach((c) => s.add(c))); MB_DEFAULT_CATS.forEach((c) => s.add(c)); s.delete('Diğer'); return Array.from(s); }
H.mbopen = () => {
  if (S.user && S.user.role !== 'patron' && S.user.role !== 'muhasebeci') return toast('Bu sihirbazı patron açar.', 'warn'); if (locked()) return;
  const kb = (S.settings && S.settings.kbal) || {}; const cs = (S.settings && S.settings.cur) || {};
  Object.assign(MBS, { step: 0, cur: cs.sym || '₺', nakit: kb.nakit ? String(kb.nakit.v) : '', banka: kb.banka ? String(kb.banka.v) : '', kdv: (S.settings && S.settings.kdvMode) || '', rate: (S.settings && S.settings.kdvRate) || 20, tpl: '', cats: (S.settings && S.settings.cats) || CATS.filter((x) => x !== 'Diğer'), err: '' });
  S.modal = { type: 'mbasla' }; renderModal();
};
function mbRead() {
  const g = (id) => { const x = document.getElementById(id); return x ? x.value : null; };
  if (MBS.step === 1) { const n = g('mb-n'), b = g('mb-b'); if (n !== null) MBS.nakit = n; if (b !== null) MBS.banka = b; }
}
const mbFmt = (v) => (+v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const mbNum = (v) => { const s = String(v == null ? '' : v).trim(); if (s === '') return 0; const x = trNum(s); return isNaN(x) ? null : x; };
H.mbnext = () => {
  mbRead(); MBS.err = '';
  if (MBS.step === 1) { if (mbNum(MBS.nakit) === null || mbNum(MBS.banka) === null) { MBS.err = 'Tutarı sayı olarak yaz. Örnek: 12500 ya da 12.500,50'; return renderModal(); } }
  if (MBS.step === 2 && !MBS.kdv) { MBS.err = 'Bir seçenek seç. Bilmiyorsan "Sonra karar veririm" de.'; return renderModal(); }
  MBS.step = Math.min(MBS.step + 1, 4); renderModal();
};
H.mbback = () => { mbRead(); MBS.err = ''; MBS.step = Math.max(0, MBS.step - 1); renderModal(); };
H.mbcur = (el) => { MBS.cur = el.dataset.c; renderModal(); };
H.mbkdv = (el) => { MBS.kdv = el.dataset.v; MBS.err = ''; renderModal(); };
H.mbrate = (el) => { MBS.rate = +el.dataset.v; renderModal(); };
H.mbtpl = (el) => { mbRead(); const k = el.dataset.v; MBS.tpl = k; const t = MB_TPL[k]; MBS.cats = t && t[2] ? t[2].filter((x) => x !== 'Diğer') : ((S.settings && S.settings.cats) || MB_DEFAULT_CATS.filter((x) => x !== 'Diğer')); renderModal(); };
H.mbcat = (el) => { const c = el.dataset.c; MBS.cats = MBS.cats.includes(c) ? MBS.cats.filter((x) => x !== c) : MBS.cats.concat([c]); renderModal(); };
H.mbaddcat = () => { const v = ((document.getElementById('mb-new') || {}).value || '').trim().slice(0, 30); if (!v) return; if (!MBS.cats.includes(v) && v !== 'Diğer') MBS.cats = MBS.cats.concat([v]); renderModal(); };
H.mbfinish = () => {
  const n = mbNum(MBS.nakit), b = mbNum(MBS.banka); if (n === null || b === null) { MBS.step = 1; MBS.err = 'Tutarı sayı olarak yaz.'; return renderModal(); }
  if (!S.settings) S.settings = {}; const c = KCURS.find((x) => x[0] === MBS.cur) || KCURS[0];
  S.settings.cur = { sym: c[0], code: c[1], name: c[2] }; if (S.settings.kcur) { delete S.settings.kcur.nakit; delete S.settings.kcur.banka; }
  const kb = (S.settings.kbal = S.settings.kbal || {}); const t = fiIso();
  kb.nakit = { v: n, seq: seq, from: 'Başlangıç', iso: t, t }; kb.banka = { v: b, seq: seq, from: 'Başlangıç', iso: t, t };
  S.settings.mhOpen = Math.round((n + b) * 100) / 100;
  S.settings.kdvMode = MBS.kdv; S.settings.kdvRate = MBS.rate; if (MBS.kdv === 'muaf') MXI.defRate = 0; else if (MBS.kdv === 'kdvli') MXI.defRate = MBS.rate;
  if (MBS.cats.length) S.settings.cats = MBS.cats.slice(); mbApplyCats();
  S.settings.mbDone = { t, n, b, cur: c[1] }; try { pSched(); } catch (e) {}
  MBS.step = 5; try { render(); } catch (e) {} renderModal();
};
NEWM.mbasla = function () {
  const st = MBS.step; const seg = [0, 1, 2, 3, 4].map((i) => `<i style="flex:1;height:5px;border-radius:3px;background:${i <= Math.min(st, 4) ? 'var(--brand,#2563eb)' : 'var(--line,#e5e8ee)'}"></i>`).join('');
  const sel = (on) => (on ? 'box-shadow:0 0 0 2px var(--brand,#2563eb);' : '');
  const tile = (act, attrs, on, ico, title, sub) => `<button type="button" class="card" data-a="${act}" ${attrs} style="${sel(on)}padding:12px;text-align:left;display:flex;gap:10px;align-items:center;width:100%;margin-top:8px"><span style="flex:none">${ic(ico, 20)}</span><span style="min-width:0"><b>${esc(title)}</b>${sub ? `<br><span class="small muted">${esc(sub)}</span>` : ''}</span></button>`;
  const err = MBS.err ? `<div class="callout warn" style="margin-top:10px">${ic('alert')}<div><p>${esc(MBS.err)}</p></div></div>` : '';
  const nav = (next, label) => `<div class="row" style="gap:8px;margin-top:14px">${st > 0 ? '<button class="btn sec" data-a="mbback">Geri</button>' : ''}<button class="btn grow" data-a="${next}">${label}</button></div>`;
  let body = '';
  if (st === 0) {
    const have = LEDGER.length ? `<div class="callout" style="margin:10px 0">${ic('check')}<div><p>Zaten ${LEDGER.length} kaydın var. Bunlar silinmez, bakiyen bugünden itibaren üstüne eklenir.</p></div></div>` : '';
    body = `<h3 style="margin:2px 0 4px">Muhasebeni baştan doğru kuralım</h3><p class="muted small">4 kısa soru. Sonra her kayıt nakit ve banka olarak ayrı izlenir, Excel'e düzenli çıkar.</p>${have}
      <div class="field" style="margin-top:12px"><label>Hangi para birimiyle çalışıyorsun?</label><div class="row wrap" style="gap:6px">${KCURS.map((x) => `<button type="button" class="btn sm ${MBS.cur === x[0] ? '' : 'sec'}" data-a="mbcur" data-c="${x[0]}">${x[0]} ${esc(x[2])}</button>`).join('')}</div></div>
      <p class="small muted" style="margin-top:6px">Sonradan her kasa için ayrı para birimi de seçebilirsin. Farklı para birimleri birbirine eklenmez.</p>${nav('mbnext', 'Başla')}`;
  } else if (st === 1) {
    body = `<h3 style="margin:2px 0 4px">Bugün elinde ne kadar var?</h3><p class="muted small">Kasadaki parayı say, banka uygulamandan bakiyeye bak. Bu, bugünkü başlangıç bakiyen olur.</p>
      <div class="field" style="margin-top:12px"><label for="mb-n">Nakit kasa (${esc(MBS.cur)})</label><input id="mb-n" inputmode="decimal" value="${esc(MBS.nakit)}" placeholder="0" style="${mxInp}"></div>
      <div class="field"><label for="mb-b">Banka hesabı (${esc(MBS.cur)})</label><input id="mb-b" inputmode="decimal" value="${esc(MBS.banka)}" placeholder="0" style="${mxInp}"></div>
      <p class="small muted">Hiç yoksa ya da bilmiyorsan boş bırak, 0 sayılır. Sonradan "Nakit ve banka" ekranından düzeltebilirsin.</p>${err}${nav('mbnext', 'Devam')}`;
  } else if (st === 2) {
    const rt = MBS.kdv === 'kdvli' ? `<div class="field" style="margin-top:10px"><label>En çok uyguladığın KDV oranı</label><div class="row" style="gap:6px">${[1, 10, 20].map((v) => `<button type="button" class="btn sm ${MBS.rate === v ? '' : 'sec'}" data-a="mbrate" data-v="${v}">%${v}</button>`).join('')}</div><p class="small muted" style="margin-top:6px">Sadece Excel aktarımında önerilen oran olur. Her satırda kendi oranı geçerlidir.</p></div>` : '';
    body = `<h3 style="margin:2px 0 4px">KDV'li çalışıyor musun?</h3><p class="muted small">Kais vergi tavsiyesi vermez, sadece kayıt biçimini ayarlar. Emin değilsen muhasebecine sor.</p>
      ${tile('mbkdv', 'data-v="kdvli"', MBS.kdv === 'kdvli', 'receipt', 'Evet, KDV\'liyim', 'Satışlarıma KDV ekliyorum')}${tile('mbkdv', 'data-v="muaf"', MBS.kdv === 'muaf', 'check', 'Hayır, KDV\'siz / muaf', 'Aktarılan satırlar KDV %0 sayılır')}${tile('mbkdv', 'data-v="sonra"', MBS.kdv === 'sonra', 'calendar', 'Sonra karar veririm', 'Excel aktarırken KDV\'yi sana sorarım')}${rt}${err}${nav('mbnext', 'Devam')}`;
  } else if (st === 3) {
    const pool = mbPool().concat(MBS.cats.filter((c) => !mbPool().includes(c)));
    body = `<h3 style="margin:2px 0 4px">Giderlerin hangi başlıklarda toplansın?</h3><p class="muted small">İşletme türünü seç, hazır liste gelsin. Sonra kendine göre aç kapat.</p>
      <div class="row wrap" style="gap:6px;margin-top:8px">${Object.keys(MB_TPL).map((k) => `<button type="button" class="btn sm ${MBS.tpl === k ? '' : 'sec'}" data-a="mbtpl" data-v="${k}">${esc(MB_TPL[k][0])}</button>`).join('')}</div>
      <div class="row wrap" style="gap:6px;margin-top:12px">${pool.map((c) => `<button type="button" class="btn sm ${MBS.cats.includes(c) ? '' : 'sec'}" data-a="mbcat" data-c="${esc(c)}">${MBS.cats.includes(c) ? '✓ ' : ''}${esc(c)}</button>`).join('')}</div>
      <div class="row" style="gap:6px;margin-top:10px"><input id="mb-new" placeholder="Kendi başlığını ekle" style="${mxInp};flex:1;padding:10px"><button class="btn sm sec" data-a="mbaddcat">Ekle</button></div>
      <p class="small muted" style="margin-top:6px">"Diğer" her zaman listede durur. Eski kayıtlarındaki başlıklar silinmez.</p>${nav('mbnext', 'Devam')}`;
  } else if (st === 4) {
    const n = mbNum(MBS.nakit) || 0, b = mbNum(MBS.banka) || 0; const kd = MBS.kdv === 'kdvli' ? 'KDV\'li, önerilen oran %' + MBS.rate : MBS.kdv === 'muaf' ? 'KDV\'siz / muaf' : 'KDV sonra belirlenecek';
    const row = (l, v) => `<div class="row between" style="padding:8px 0;border-top:1px solid var(--line,#e5e8ee)"><span class="muted small">${l}</span><b class="small" style="text-align:right">${esc(v)}</b></div>`;
    body = `<h3 style="margin:2px 0 4px">Hazır, bir kontrol edelim</h3><p class="muted small">Başlamadan önce son hali. Yanlış varsa Geri'ye dönüp düzelt.</p>
      <div style="margin-top:8px">${row('Para birimi', MBS.cur)}${row('Nakit kasa', mbFmt(n) + ' ' + MBS.cur)}${row('Banka hesabı', mbFmt(b) + ' ' + MBS.cur)}${row('Toplam başlangıç', mbFmt(Math.round((n + b) * 100) / 100) + ' ' + MBS.cur)}${row('KDV', kd)}${row('Gider başlıkları', (MBS.cats.length ? MBS.cats.length : CATS.length - 1) + ' başlık + Diğer')}</div>
      <div class="callout" style="margin-top:10px">${ic('sparkle')}<div><p>Bundan sonra her gelir ve gider nakit ya da banka olarak işlenir. Bakiyelerin kayıtlarla birlikte kendiliğinden güncellenir.</p></div></div>${nav('mbfinish', 'Muhasebeyi başlat')}`;
  } else {
    body = `<div style="text-align:center;padding:6px 0 2px"><div style="font-size:38px">${ic('check', 38)}</div><h3 style="margin:6px 0 4px">Muhasebe başladı</h3><p class="muted small">Başlangıç bakiyen kaydedildi. Şimdi ilk kaydını ekleyebilirsin.</p></div>
      <div class="stack" style="gap:8px;margin-top:10px"><button class="btn block" data-a="upload">${ic('camera', 16)} Fiş fotoğrafı ekle</button><button class="btn sec block" data-a="mximp">${ic('file', 16)} Excel'imi aktar</button><button class="btn sec block" data-a="mxkb">${ic('wallet', 16)} Nakit ve bankayı gör</button><button class="btn sec block" data-a="closemodal">Sonra</button></div>`;
  }
  return sheet('Muhasebeye başla', `${st < 5 ? `<div style="display:flex;gap:4px;margin:0 0 12px">${seg}</div>` : ''}${body}`);
};
/* açılışta/çizimde: seçilen gider başlıklarını uygula; ilk kurulum listesine adım ekle; boş muhasebe sayfasında davet kartı */
{
  const _ss = suSteps;
  suSteps = function () { const a = _ss.apply(this, arguments); a.unshift({ k: 'muh', ico: 'wallet', t: 'Muhasebeyi başlat', s: 'Nakit, banka ve KDV bilgin 2 dakikada hazır.', done: !!(S.settings && S.settings.mbDone), a: 'mbopen' }); return a; };
  const _vh2 = viewHTML;
  viewHTML = function () {
    try { mbApplyCats(); } catch (e) {}
    const h = _vh2.apply(this, arguments);
    try { if (S.view === 'muhasebe' && S.user && S.user.role === 'patron' && !(S.settings && S.settings.mbDone) && !S.modal) { const c = emCard('Muhasebeyi baştan doğru kur', 'Nakit, banka, KDV ve gider başlıklarını 2 dakikada ayarla.', 'mbopen', 'Başla'); const i = h.indexOf('>'); return i < 0 ? c + h : h.slice(0, i + 1) + c + h.slice(i + 1); } } catch (e) {}
    return h;
  };
  const _ss2 = ixSetSheet; ixSetSheet = function () { const r = _ss2.apply(this, arguments); try { const m = S.settings && S.settings.kdvMode; if (m === 'muaf') { MXI.dec = MXI.dec || {}; if (MXI.dec.rate == null) MXI.dec.rate = '0'; } else if (m === 'kdvli' && S.settings.kdvRate) MXI.defRate = S.settings.kdvRate; } catch (e) {} return r; };
}

/* ===== v253: yeni tanıtım turu (rol ve duruma göre, görsel, kaydırmalı, son adımda kişisel başlangıç listesi) ===== */
{
  const st = document.createElement('style'); st.textContent = `
  .tr-top{display:flex;gap:5px;align-items:center;margin:0 0 12px}.tr-top i{flex:1;height:5px;border-radius:3px;background:var(--line,#e5e8ee);cursor:pointer;transition:background .25s}.tr-top i.on{background:var(--acc,#2f6fed)}
  .tr-skip{background:none;border:0;color:inherit;opacity:.6;font-size:13px;padding:4px 6px;margin-left:6px;cursor:pointer}
  .tr-hero{height:168px;border-radius:22px;background:linear-gradient(135deg,var(--acc,#2f6fed) 0%,#6d5dfc 100%);display:grid;place-items:center;overflow:hidden;position:relative;margin-bottom:16px;color:#fff}
  .tr-hero:before{content:"";position:absolute;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.12);right:-60px;top:-80px}.tr-hero:after{content:"";position:absolute;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.1);left:-40px;bottom:-60px}
  .tr-hero>*{position:relative;z-index:1}
  .tr-c{background:#fff;color:#14213d;border-radius:14px;padding:9px 12px;box-shadow:0 10px 26px rgba(10,20,60,.25);font-size:12px;line-height:1.35}.tr-c b{display:block;font-size:15px}
  .tr-pill{display:inline-block;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;background:#e7f6ec;color:#15803d}.tr-pill.w{background:#fff3d6;color:#a35a00}
  .tr-row{display:flex;gap:8px}.tr-bars{display:flex;gap:3px;align-items:flex-end;height:28px;margin-top:6px}.tr-bars i{flex:1;background:linear-gradient(#6d5dfc,#2f6fed);border-radius:3px 3px 0 0}
  .tr-bc{height:34px;width:120px;background:repeating-linear-gradient(90deg,#14213d 0 2px,#fff 2px 4px,#14213d 4px 5px,#fff 5px 8px,#14213d 8px 11px,#fff 11px 13px);border-radius:3px}
  .tr-gr{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;width:250px}.tr-gr span{height:16px;border-radius:5px;background:rgba(255,255,255,.2)}.tr-gr span.a{background:#fff}.tr-gr span.b{background:#ffd166}.tr-gr span.c{background:#7ee0b0}
  .tr-bub{max-width:78%;padding:8px 11px;border-radius:14px;font-size:12.5px;line-height:1.35}.tr-bub.u{background:rgba(255,255,255,.95);color:#14213d;border-bottom-right-radius:4px;align-self:flex-end}.tr-bub.k{background:rgba(20,33,61,.55);color:#fff;border-bottom-left-radius:4px;align-self:flex-start}
  .tr-bl{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:7px;text-align:left}.tr-bl li{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.4}.tr-bl li svg{flex:none;margin-top:2px;color:var(--acc,#2f6fed)}
  .tr-chip{display:inline-block;padding:5px 11px;border-radius:99px;background:rgba(255,255,255,.2);font-size:12px;font-weight:600;margin:3px}
  .tr-todo{display:flex;gap:10px;align-items:center;text-align:left;width:100%;padding:11px 12px;border-radius:14px;border:1px solid var(--line,#e5e8ee);background:var(--card,#fff);color:inherit;margin-top:8px;cursor:pointer}.tr-todo b{display:block;font-size:14px}.tr-todo span.s{font-size:12px;opacity:.65}
  .tr-in-r{animation:trR .28s ease both}.tr-in-l{animation:trL .28s ease both}@keyframes trR{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}@keyframes trL{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
  .tr-float{animation:trF 3.2s ease-in-out infinite}@keyframes trF{50%{transform:translateY(-6px)}}
  @media (prefers-reduced-motion:reduce){.tr-in-r,.tr-in-l,.tr-float{animation:none}}`; document.head.appendChild(st);
}
function tourSlides() {
  const r = S.user && S.user.role; const nm = ((S.user && S.user.name) || '').split(' ')[0]; const done = {}; try { suSteps().forEach((x) => { done[x.k] = x.done; }); } catch (e) {}
  const mk = (ico, t, s, v, bl, hero, go) => ({ ico, t, s, v, bl: bl || [], hero: hero || '', go: go || '' });
  if (r === 'patron') {
    const L = [
      mk('sparkle', 'Hoş geldin' + (nm ? ', ' + esc(nm) : ''), esc(BIZ) + ' artık cebinde. 1 dakikada seni nelerin beklediğini göstereyim.', '', [], 'hi'),
      mk('wallet', 'Muhasebe: nakit ve banka ayrı', 'Her gelir ve gider nakit ya da banka olarak işlenir. Bakiyelerin kayıtlarla birlikte kendiliğinden güncellenir.', 'muhasebe', ['Excel\'in varsa içeri alırsın, hangi düzende olursa olsun', 'Excel\'in yoksa Kais sıfırdan düzenli tutar', 'Günlük, haftalık, aylık, yıllık Excel çıktısı'], 'muh', 'Muhasebeyi aç'),
      mk('receipt', 'Fiş ve fatura kendiliğinden', 'Fişin fotoğrafını çek, Kais okusun. Emin olamazsa sana sorar, tahmin yürütmez.', 'muhasebe', ['Faturayı müşterine PDF ekli e-postayla gönder', 'Vadesi geçenlere tek dokunuşla hatırlatma'], 'fis'),
      done.stok ? null : mk('box', 'Stok, barkod ve son kullanma', 'Barkod okutarak sayım yap. Azalan ve tarihi yaklaşan ürünleri Kais takip eder.', 'stok', ['Barkodla hızlı stok sayımı', 'SKT yaklaşınca uyarı'], 'stok', 'Stoğa git'),
      done.team ? null : mk('users', 'Ekip aynı sistemde', 'Vardiya, izin ve giriş çıkış saatleri otomatik. Çalışanlar davet koduyla kendi hesabıyla girer, yetkileri sen belirlersin.', 'ekip', ['Vardiya planı ve izin talepleri', 'Giriş çıkış ve mesai otomatik hesaplanır'], 'ekip', 'Ekibe git'),
      mk('sparkle', 'Kais\'e sor', '"Bu ay neden zarardayım?" gibi sorular sor, Kais senin verinden cevap versin.', 'kaisai', [], 'ai', 'Kais\'e sor'),
    ].filter(Boolean);
    const todo = []; try { suSteps().filter((x) => !x.done).slice(0, 4).forEach((x) => todo.push(x)); } catch (e) {}
    L.push({ ico: 'check', t: todo.length ? 'Başlamak için 2 dakika' : 'Her şey hazır', s: todo.length ? 'Sana kalan adımlar bunlar. Birine dokun, kaldığın yerden devam edersin.' : 'Kurulum adımlarını tamamlamışsın. İyi çalışmalar!', v: '', bl: [], hero: 'son', todo });
    return L;
  }
  const T = TOUR[r] || []; const L = T.map((x, i) => mk(x.ico, i === 0 && nm ? 'Hoş geldin, ' + esc(nm) : x.t, x.s, x.v, [], 'ico', i === 0 ? '' : 'Şuraya git'));
  if (L.length) { L[0].t = nm ? 'Hoş geldin, ' + esc(nm) : 'Hoş geldin'; L[0].s = x0(T[0]) ; L.push({ ico: 'check', t: 'Hazırsın', s: 'İstediğin zaman Yardım bölümünden turu yeniden izleyebilirsin.', v: '', bl: [], hero: 'son', todo: [] }); }
  function x0(a) { return a.t + ': ' + a.s; }
  return L;
}
function tourHero(h, x) {
  if (h === 'hi') return `<div class="tr-hero"><div class="tr-float" style="text-align:center"><img src="/icon-192.png" width="64" height="64" alt="" style="border-radius:18px;box-shadow:0 10px 28px rgba(0,0,0,.3)"><div style="margin-top:12px">${['Muhasebe', 'Stok', 'Ekip', 'Kais'].map((c) => `<span class="tr-chip">${c}</span>`).join('')}</div></div></div>`;
  if (h === 'muh') return `<div class="tr-hero"><div class="tr-row"><div class="tr-c" style="width:128px"><span style="opacity:.6">Nakit kasa</span><b>12.500 ₺</b><div class="tr-bars">${[40, 55, 35, 70, 60, 85, 75].map((v) => `<i style="height:${v}%"></i>`).join('')}</div></div><div class="tr-c" style="width:128px"><span style="opacity:.6">Banka</span><b>3.000 ₺</b><div class="tr-bars">${[70, 50, 60, 45, 65, 55, 80].map((v) => `<i style="height:${v}%"></i>`).join('')}</div></div></div><span style="position:absolute;right:12px;bottom:8px;font-size:10px;opacity:.7;z-index:2">örnek</span></div>`;
  if (h === 'fis') return `<div class="tr-hero"><div class="tr-row" style="align-items:center"><div class="tr-c" style="width:120px"><span style="opacity:.6">Migros</span><div style="height:6px;border-radius:3px;background:#e3e7ee;margin:6px 0"></div><div style="height:6px;width:70%;border-radius:3px;background:#e3e7ee"></div><b style="margin-top:8px">248,90 ₺</b></div><div style="text-align:left"><span class="tr-pill">✓ Okundu</span><br><span class="tr-pill w" style="margin-top:6px">KDV %10</span></div></div></div>`;
  if (h === 'stok') return `<div class="tr-hero"><div class="tr-c" style="text-align:center"><div class="tr-bc" style="margin:0 auto 8px"></div><span class="tr-pill w">SKT 3 gün</span> <span class="tr-pill">24 adet</span></div></div>`;
  if (h === 'ekip') return `<div class="tr-hero"><div class="tr-gr">${['a b c a b c a', 'b a a c a b b', 'c c a b b a c'].map((r) => r.split(' ').map((c) => `<span class="${c}"></span>`).join('')).join('')}</div></div>`;
  if (h === 'ai') return `<div class="tr-hero"><div style="display:flex;flex-direction:column;gap:8px;width:86%"><div class="tr-bub u">Bu ay neden zarardayım?</div><div class="tr-bub k">Kira ve hammadde geçen aya göre arttı. Detayını göstereyim mi?</div></div></div>`;
  if (h === 'son') return `<div class="tr-hero" style="height:120px"><div class="tr-float">${ic('check', 54)}</div></div>`;
  return `<div class="tr-hero" style="height:140px"><div class="tr-float" style="width:76px;height:76px;border-radius:24px;background:rgba(255,255,255,.2);display:grid;place-items:center">${ic(x.ico, 38)}</div></div>`;
}
NEWM.tour = (m) => {
  const L = tourSlides(); if (!L.length) return sheet('Hoş geldin', ''); const i = Math.max(0, Math.min(m.i || 0, L.length - 1)); const x = L[i]; const last = i === L.length - 1;
  const dots = `<div class="tr-top">${L.map((_, j) => `<i class="${j <= i ? 'on' : ''}" data-a="tourat" data-i="${j}"></i>`).join('')}${last ? '' : '<button class="tr-skip" data-a="tourskip">Atla</button>'}</div>`;
  const bl = x.bl.length ? `<ul class="tr-bl">${x.bl.map((b) => `<li>${ic('check', 16)}<span>${b}</span></li>`).join('')}</ul>` : '';
  const todo = (x.todo || []).map((t) => `<button type="button" class="tr-todo" data-a="tourdo" data-act="${t.a}" data-v="${t.v || ''}">${ic(t.ico || 'check', 20)}<span><b>${esc(t.t)}</b><span class="s">${esc(t.s)}</span></span></button>`).join('');
  const go = x.v && x.go ? `<button class="btn sec block" style="margin-top:10px" data-a="tourgo" data-v="${x.v}">${esc(x.go)}</button>` : '';
  const nav = `<div class="row" style="gap:8px;margin-top:14px">${i > 0 ? '<button class="btn sec" style="flex:1" data-a="tourprev">Geri</button>' : ''}<button class="btn" style="flex:2" data-a="${last ? 'tourend' : 'tournext'}">${last ? (x.todo && x.todo.length ? 'Sonra yaparım' : 'Başla') : (i === 0 ? 'Turu başlat' : 'İleri')}</button></div>`;
  return sheet('Kais ile tanış', `${dots}<div class="${m.dir === 'l' ? 'tr-in-l' : 'tr-in-r'}">${tourHero(x.hero, x)}<h2 style="margin:0 0 6px;font-size:21px;line-height:1.25">${x.t}</h2><p class="muted" style="margin:0;line-height:1.5">${x.s}</p>${bl}${todo}${go}</div>${nav}`);
};
H.tournext = () => { const n = tourSlides().length; S.modal.i = Math.min((S.modal.i || 0) + 1, n - 1); S.modal.dir = 'r'; renderModal(); };
H.tourprev = () => { S.modal.i = Math.max(0, (S.modal.i || 0) - 1); S.modal.dir = 'l'; renderModal(); };
H.tourat = (el) => { const j = +el.dataset.i; S.modal.dir = j < (S.modal.i || 0) ? 'l' : 'r'; S.modal.i = j; renderModal(); };
H.tourdo = (el) => { tourDone(); const a = el.dataset.act, v = el.dataset.v; S.modal = null; if (a === 'nav') H.nav({ dataset: { v } }); else if (H[a]) H[a](el); else render(); };
document.addEventListener('touchstart', (e) => { if (S.modal && S.modal.type === 'tour' && e.touches[0]) S.tx = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
document.addEventListener('touchend', (e) => { if (!(S.modal && S.modal.type === 'tour') || !S.tx || !e.changedTouches[0]) return; const dx = e.changedTouches[0].clientX - S.tx[0], dy = e.changedTouches[0].clientY - S.tx[1]; S.tx = null; if (Math.abs(dx) > 60 && Math.abs(dy) < 50) (dx < 0 ? H.tournext : H.tourprev)(); }, { passive: true });
document.addEventListener('keydown', (e) => { if (S.modal && S.modal.type === 'tour' && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) { if (e.key === 'ArrowRight') H.tournext(); else if (e.key === 'ArrowLeft') H.tourprev(); } });
