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
H.mhopen = () => { const v = mhN(String((document.getElementById('mh-open') || {}).value || '').replace(',', '.')); if (!S.settings) S.settings = {}; S.settings.mhOpen = v; try { pSched(); } catch (e) {} toast('Açılış bakiyesi kaydedildi.', 'ok'); renderModal(); };
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
  if (typeof locked === 'function' && locked()) return; const r = LEDGER.find((x) => x.id === el.dataset.id); if (!r) return; const g = (id) => String((document.getElementById(id) || {}).value || '').trim(); const n = (id) => mhN(g(id).replace(',', '.'));
  const tv = g('mh-tv'), otv = n('mh-otv'), stp = n('mh-stp'), cur = g('mh-cur') || 'TRY', fx = n('mh-fx'), kur = n('mh-kur');
  if (otv < 0 || stp < 0 || otv + stp > mhN(r.total) + 0.005) { toast('ÖTV ve stopaj toplamdan büyük olamaz.', 'warn'); return; }
  if (cur !== 'TRY' && (fx <= 0 || kur <= 0)) { toast('Döviz için tutar ve kur gir.', 'warn'); return; }
  if (tv) r.tv = tv; else delete r.tv; if (otv) r.otv = otv; else delete r.otv; if (stp) r.stp = stp; else delete r.stp;
  if (cur !== 'TRY') { r.cur = cur; r.fx = fx; r.kur = kur; r.total = r2(fx * kur); } else { delete r.cur; delete r.fx; delete r.kur; }
  const hk = g('mh-hk'); const def = mhKod(Object.assign({}, r, { hk: '' })); if (hk && hk !== def) r.hk = hk; else delete r.hk;
  try { pSched(); } catch (e) {} toast('Kaydedildi.', 'ok'); S.modal = { type: 'mhrows' }; renderModal();
};
/* giriş kartına iki kısayol */
{ const _mc = mxCard; mxCard = function () { let h = _mc.apply(this, arguments); if (!h) return h; const tile = (a, i, t, s) => `<button class="btn sec" data-a="${a}" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:12px;height:auto;min-height:74px;border-radius:14px"><span style="display:flex;gap:6px;align-items:center;font-weight:600">${ic(i, 17)} ${t}</span><span class="small muted" style="font-weight:400">${s}</span></button>`; const add = tile('mhrap', 'table', 'Mizan ve bilanço', 'Gelir tablosu, Tek Düzen') + tile('mhrows', 'list', 'Kayıt ayrıntısı', 'Tevkifat, ÖTV, stopaj, döviz'); const i = h.lastIndexOf('</div></div>'); return i < 0 ? h : h.slice(0, i) + add + h.slice(i); }; }
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
