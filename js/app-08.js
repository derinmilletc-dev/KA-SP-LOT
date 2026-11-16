/* ===== v88: Raporlar (PDF + CSV), yoklama arşivi ===== */
const CLKSUM = {}; P_OBJ.push(['CLKSUM', () => CLKSUM]); P_SCOPE.CLKSUM = 'ekip';
const rpLateOf = (c) => { try { const [y, m, d] = c.date.split('-').map(Number); const s = vdState(y, m - 1, d, c.uid); if (s.k !== 'shift' || !c.in) return 0; const L = toMin(c.in) - toMin(s.t.s); return L >= 10 ? 1 : 0; } catch (e) { return 0; } };
function clkArchive() {
  const old = CLOCK.filter((c) => c.date && c.out && dleft(c.date) < -62); if (!old.length) return;
  old.forEach((c) => { const ym = c.date.slice(0, 7); const o = ((CLKSUM[ym] = CLKSUM[ym] || {})[c.uid] = CLKSUM[ym][c.uid] || { d: 0, h: 0, b: 0, l: 0 }); o.d++; o.h = Math.round((o.h + (Number(c.hrs) || 0)) * 100) / 100; o.b += Number(c.brk) || 0; o.l += rpLateOf(c); });
  const keep = CLOCK.filter((c) => !old.includes(c)); CLOCK.length = 0; keep.forEach((c) => CLOCK.push(c));
}
/* clkIn orijinali 300 kayıtta keser; sınırı kaldırmak için yeniden yaz */
clkIn = function (uid) { CLOCK.unshift({ id: 'ck' + (++seq), uid, date: REF_ISO, in: ATT[uid].inAt, out: '', brk: 0, hrs: 0, via: 'kod' }); clkArchive(); if (CLOCK.length > 6000) CLOCK.length = 6000; };
{ const _w = wipeData; wipeData = function () { _w.apply(this, arguments); Object.keys(CLKSUM).forEach((k) => { delete CLKSUM[k]; }); }; }
const rpYM = () => { const n = new Date(); const b = new Date(n.getFullYear(), n.getMonth() + (S.rpO || 0), 1); return [b.getFullYear(), b.getMonth(), b.getFullYear() + '-' + vdP(b.getMonth() + 1)]; };
const rpDiff = (a, b) => { const x = a.split('-').map(Number), y = b.split('-').map(Number); return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5); };
const rpPct = (a, b) => (b ? Math.round(a / b * 100) : 0);
function rpData(y, m, ym) {
  const dim = new Date(y, m + 1, 0).getDate(); const D = { y, m, ym, dim, label: VD_MON[m] + ' ' + y, biz: BIZ, by: S.user ? S.user.name : '', at: today() };
  // kasa
  const K = KASA.filter((k) => k.date.startsWith(ym)).sort((a, b) => (a.date < b.date ? -1 : 1)); const kd = K.filter((k) => k.diff != null);
  const pym = (() => { const b = new Date(y, m - 1, 1); return b.getFullYear() + '-' + vdP(b.getMonth() + 1); })(); const PK = KASA.filter((k) => k.date.startsWith(pym));
  D.kasa = { n: K.length, ciro: K.reduce((a, k) => a + ksSales(k), 0), pciro: PK.reduce((a, k) => a + ksSales(k), 0), pn: PK.length, nak: K.reduce((a, k) => a + Math.max(0, k.cash - k.open), 0), kart: K.reduce((a, k) => a + k.card, 0), ref: K.reduce((a, k) => a + (k.ref || 0), 0), diff: kd.reduce((a, k) => a + k.diff, 0), ac: kd.filter((k) => k.diff < -(OPC.tol || 50)).length, fz: kd.filter((k) => k.diff > (OPC.tol || 50)).length, worst: kd.slice().sort((a, b) => a.diff - b.diff)[0] || null, rows: K, missing: 0 };
  { const lim = ym === REF_ISO.slice(0, 7) ? Number(REF_ISO.slice(8)) : dim; if (K.length) { for (let d = 1; d <= lim; d++) { const ds = ym + '-' + vdP(d); if (!K.some((k) => k.date === ds)) D.kasa.missing++; } } }
  // arıza
  const M = MAINT.filter((x) => x.date.startsWith(ym)); const Mc = MAINT.filter((x) => x.doneAt && x.doneAt.startsWith(ym)); const cat = {}; M.forEach((x) => { cat[x.cat] = (cat[x.cat] || 0) + 1; });
  const dur = Mc.filter((x) => x.date).map((x) => Math.max(0, rpDiff(x.date, x.doneAt)));
  D.ariza = { n: M.length, acil: M.filter((x) => x.pri === 'acil').length, cozulen: Mc.length, acik: MAINT.filter((x) => x.st !== 'bitti').length, cost: Mc.reduce((a, x) => a + (Number(x.cost) || 0), 0), avg: dur.length ? Math.round(dur.reduce((a, b) => a + b, 0) / dur.length * 10) / 10 : null, cat: Object.keys(cat).map((k) => [k, cat[k]]).sort((a, b) => b[1] - a[1]), late: MPLAN.filter((p) => mpLeft(p) < 0).length };
  // görev
  const T = TASKS.filter((t) => t.due && t.due.startsWith(ym)); const per = {}; T.forEach((t) => { if (t.uid === 'all') return; const o = (per[t.uid] = per[t.uid] || { n: 0, d: 0 }); o.n++; if (t.st === 'bitti') o.d++; });
  D.gorev = { n: T.length, d: T.filter((t) => t.st === 'bitti').length, late: T.filter((t) => t.st !== 'bitti' && t.due < REF_ISO).length, per: Object.keys(per).map((u) => [u, per[u].n, per[u].d]).sort((a, b) => b[1] - a[1]) };
  // talepler
  const R = REQS.filter((r) => String(r.date0 || '').startsWith(ym)); const av = R.filter((r) => r.kind === 'avans' && r.st === 'onay');
  const o1 = m * 40 + 1, o2 = m * 40 + dim; let izinGun = 0, izinKisi = new Set(); ekLeaves().filter((x) => x.st === 'onayli').forEach((x) => { const q = ekRange(x); if (!q) return; const a = Math.max(q[0], o1), b = Math.min(q[1], o2); if (b >= a) { izinGun += b - a + 1; izinKisi.add(x.uid); } });
  D.talep = { n: R.length, onay: R.filter((r) => r.st === 'onay').length, red: R.filter((r) => r.st === 'red').length, bek: R.filter((r) => r.st === 'bekliyor').length, avN: av.length, avT: av.reduce((a, r) => a + r.amt, 0), takas: R.filter((r) => r.kind === 'takas' && r.st === 'onay').length, izinGun, izinKisi: izinKisi.size };
  // rezervasyon
  const Z = RESV.filter((r) => r.date.startsWith(ym)); const bt = ['geldi', 'bitti']; const gz = Z.filter((r) => bt.includes(r.st)).length, gm = Z.filter((r) => r.st === 'gelmedi').length, ic1 = Z.filter((r) => r.st === 'iptal').length; const src = {}; Z.forEach((r) => { src[r.src || 'Diğer'] = (src[r.src || 'Diğer'] || 0) + 1; }); const wd = [0, 0, 0, 0, 0, 0, 0]; Z.filter((r) => r.st !== 'iptal').forEach((r) => { wd[dowOf(r.date)]++; });
  D.rez = { n: Z.length, gel: gz, gelmedi: gm, iptal: ic1, ppl: Z.filter((r) => r.st !== 'iptal').reduce((a, r) => a + (Number(r.n) || 0), 0), src: Object.keys(src).map((k) => [k, src[k]]).sort((a, b) => b[1] - a[1]), busy: wd.indexOf(Math.max(...wd)), busyN: Math.max(...wd) };
  // yoklama
  const per2 = {}; const sm = CLKSUM[ym] || {}; Object.keys(sm).forEach((u) => { per2[u] = { d: sm[u].d, h: sm[u].h, b: sm[u].b, l: sm[u].l }; });
  CLOCK.filter((c) => c.date.startsWith(ym) && c.out).forEach((c) => { const o = (per2[c.uid] = per2[c.uid] || { d: 0, h: 0, b: 0, l: 0 }); o.d++; o.h = Math.round((o.h + (Number(c.hrs) || 0)) * 100) / 100; o.b += Number(c.brk) || 0; o.l += rpLateOf(c); });
  D.yok = Object.keys(per2).map((u) => ({ u, name: opN(u), d: per2[u].d, h: per2[u].h, b: per2[u].d ? Math.round(per2[u].b / per2[u].d) : 0, l: per2[u].l })).sort((a, b) => b.h - a.h);
  // liste uyumu
  const days = {}; CHKL.filter((c) => c.date.startsWith(ym)).forEach((c) => { (days[c.date] = days[c.date] || new Set()).add(c.id); }); const nAc = CHKI.filter((i) => i.when === 'ac').length, nKa = CHKI.filter((i) => i.when === 'ka').length;
  const dl = Object.keys(days); D.liste = { gun: dl.length, tamAc: nAc ? dl.filter((d) => CHKI.filter((i) => i.when === 'ac').every((i) => days[d].has(i.id))).length : 0, tamKa: nKa ? dl.filter((d) => CHKI.filter((i) => i.when === 'ka').every((i) => days[d].has(i.id))).length : 0, nAc, nKa };
  D.kais = rpKais(D); return D;
}
function rpKais(D) {
  const T = []; const k = D.kasa, a = D.ariza, g = D.gorev, z = D.rez, y = D.yok;
  if (k.n) { if (k.pn >= 5 && k.n >= 5 && k.pciro > 0) { const ch = Math.round((k.ciro / k.n - k.pciro / k.pn) / (k.pciro / k.pn) * 100); T.push([Math.abs(ch) >= 15 ? (ch < 0 ? 'a' : 'g') : 'i', 'Günlük ciro ortalaması geçen aya göre ' + (ch >= 0 ? '+' : '−') + '%' + Math.abs(ch), D.label + ' cirosu ' + opTl(k.ciro) + ' (' + k.n + ' gün).']); }
    if (k.diff < -(OPC.tol || 50) * 2) T.push(['r', 'Kasa açığı ' + opTl(Math.abs(k.diff)), k.ac + ' günde açık var' + (k.worst ? '; en büyüğü ' + isoShort(k.worst.date) + ' (' + opTl(Math.abs(k.worst.diff)) + ').' : '.')]); else if (k.n >= 5) T.push(['g', 'Kasa dengeli', 'Ay toplamı fark ' + (k.diff ? (k.diff > 0 ? '+' : '−') + opTl(Math.abs(k.diff)) : 'yok') + '.']);
    if (k.missing >= 3) T.push(['a', k.missing + ' gün kasa kapanışı girilmedi', 'Düzenli giriş, fark takibini güçlendirir.']); }
  if (a.n) { const top = a.cat[0]; T.push([a.acil ? 'a' : 'i', a.n + ' arıza bildirildi', (top ? top[0] + ' en çok bozulan (' + top[1] + '). ' : '') + (a.cost ? 'Çözülenlerin maliyeti ' + opTl(a.cost) + '.' : '')]); if (a.avg != null && a.avg > 3) T.push(['a', 'Arızalar geç çözülüyor', 'Ortalama çözüm süresi ' + a.avg + ' gün.']); }
  if (g.n >= 3) { const p = rpPct(g.d, g.n); T.push([p < 70 ? 'a' : 'g', 'Görevlerin %' + p + "'i tamamlandı", g.late ? g.late + ' görev gecikti.' : 'Geciken görev yok.']); }
  if (z.n >= 5) { const ns = rpPct(z.gelmedi, z.gel + z.gelmedi); if (z.gel + z.gelmedi >= 5) T.push([ns > 10 ? 'a' : 'g', 'Gelmeme oranı %' + ns, z.gelmedi + ' misafir gelmedi.' + (ns > 10 ? ' Hatırlatma e-postasını açık tut.' : '')]); }
  const lt = y.slice().sort((p, q) => q.l - p.l)[0]; if (lt && lt.l >= 3) T.push(['a', opN(lt.u) + ' ' + lt.l + ' kez geç girdi', 'Bu ay en çok geç kalan kişi.']);
  return T;
}
const rpTl = (n) => fmt0(n);
function rpBars(rows) { const mx = Math.max(1, ...rows.map((r) => r[1])); return `<div class="rp-bars">${rows.map((r) => `<div class="rp-b"><span>${esc(r[0])}</span><i><u style="width:${Math.round(r[1] / mx * 100)}%"></u></i><b>${r[2] != null ? r[2] : r[1]}</b></div>`).join('')}</div>`; }
function rpChart(D) {
  const K = D.kasa.rows; if (!K.length) return ''; const W = 1000, H = 130, P = 22; const by = {}; K.forEach((k) => { by[Number(k.date.slice(8))] = k; }); const mx = Math.max(1, ...K.map((k) => ksSales(k))); const bw = (W - P * 2) / D.dim;
  let s = `<svg viewBox="0 0 ${W} ${H + 18}" class="rp-svg" role="img" aria-label="Günlük ciro"><line x1="${P}" y1="${H}" x2="${W - P}" y2="${H}" stroke="#D5DEEA"/>`;
  for (let d = 1; d <= D.dim; d++) { const k = by[d]; if (!k) continue; const h = Math.max(2, Math.round(ksSales(k) / mx * (H - 14))); const bad = k.diff != null && k.diff < -(OPC.tol || 50); s += `<rect x="${(P + (d - 1) * bw + 1.5).toFixed(1)}" y="${H - h}" width="${Math.max(2, bw - 3).toFixed(1)}" height="${h}" rx="2" fill="${bad ? '#C4384B' : '#2F73C9'}"/>`; }
  [1, 8, 15, 22, D.dim].forEach((d) => { s += `<text x="${(P + (d - 1) * bw + bw / 2).toFixed(1)}" y="${H + 14}" text-anchor="middle" font-size="10" fill="#6B7A90">${d}</text>`; });
  return s + '</svg><p class="rp-cap"><i class="b"></i>Günlük ciro <i class="r"></i>Kasa açığı olan gün</p>';
}
function rpBody(D) {
  const k = D.kasa, a = D.ariza, g = D.gorev, t = D.talep, z = D.rez, l = D.liste;
  const tile = (v, lab) => `<div class="rp-t"><b>${v}</b><small>${lab}</small></div>`;
  const sec = (h, inner) => `<section class="rp-s"><h3>${h}</h3>${inner}</section>`;
  const kais = D.kais.length ? sec('Kais yorumu', `<div class="rp-k">${D.kais.map((x) => `<div class="rp-ki ${x[0]}"><i></i><div><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div></div>`).join('')}</div>`) : '';
  const kasa = sec('Kasa ve ciro', k.n ? `<div class="rp-ts">${tile(rpTl(k.ciro), 'Toplam ciro')}${tile(k.n + ' gün', 'Kapanış girilen')}${tile((k.diff > 0 ? '+' : k.diff < 0 ? '−' : '') + rpTl(Math.abs(k.diff)), 'Toplam kasa farkı')}${tile(rpTl(k.ref), 'İade ve iptal')}</div>${rpChart(D)}<p class="rp-n">Nakit ${rpTl(k.nak)} · Kart ${rpTl(k.kart)} · ${k.ac} gün kasa açığı, ${k.fz} gün fazlalık${k.missing ? ' · ' + k.missing + ' gün kapanış girilmedi' : ''}</p>` : '<p class="rp-n">Bu ay kasa kapanışı girilmemiş.</p>');
  const ariza = sec('Arıza ve bakım', a.n || a.cozulen ? `<div class="rp-ts">${tile(a.n, 'Bildirilen')}${tile(a.cozulen, 'Çözülen')}${tile(a.acik, 'Şu an açık')}${tile(a.cost ? rpTl(a.cost) : '—', 'Arıza maliyeti')}</div>${a.cat.length ? rpBars(a.cat) : ''}<p class="rp-n">${a.avg != null ? 'Ortalama çözüm süresi ' + a.avg + ' gün' : 'Çözülen arıza yok'} · ${a.acil} acil arıza · ${a.late} bakım gecikmiş</p>` : '<p class="rp-n">Bu ay arıza bildirilmemiş.</p>');
  const gorev = sec('Görevler', g.n ? `<div class="rp-ts">${tile(g.n, 'Verilen')}${tile(g.d, 'Tamamlanan')}${tile('%' + rpPct(g.d, g.n), 'Tamamlama')}${tile(g.late, 'Geciken')}</div>${g.per.length ? rpBars(g.per.slice(0, 12).map((p) => [opN(p[0]), p[2], p[2] + '/' + p[1]])) : ''}` : '<p class="rp-n">Bu ay vadesi gelen görev yok.</p>');
  const talep = sec('Çalışan talepleri', `<div class="rp-ts">${tile(t.n, 'Talep')}${tile(t.avN ? rpTl(t.avT) : '—', 'Onaylı avans (' + t.avN + ')')}${tile(t.takas, 'Vardiya değişimi')}${tile(t.izinGun + ' gün', 'Onaylı izin (' + t.izinKisi + ' kişi)')}</div><p class="rp-n">${t.onay} onaylandı · ${t.red} reddedildi · ${t.bek} bekliyor</p>`);
  const rez = sec('Rezervasyon', z.n ? `<div class="rp-ts">${tile(z.n, 'Rezervasyon')}${tile(z.ppl, 'Toplam kişi')}${tile(z.gel, 'Gelen')}${tile('%' + rpPct(z.gelmedi, z.gel + z.gelmedi), 'Gelmeme oranı')}</div>${z.src.length ? rpBars(z.src) : ''}<p class="rp-n">${z.busyN ? 'En yoğun gün: ' + DOWN[z.busy] + ' (' + z.busyN + ' rezervasyon)' : ''} · ${z.iptal} iptal</p>` : '<p class="rp-n">Bu ay rezervasyon yok.</p>');
  const lst = sec('Açılış ve kapanış listesi', l.gun ? `<div class="rp-ts">${tile(l.gun, 'Liste kullanılan gün')}${tile(l.nAc ? l.tamAc + '/' + l.gun : '—', 'Açılış tam')}${tile(l.nKa ? l.tamKa + '/' + l.gun : '—', 'Kapanış tam')}</div>` : '<p class="rp-n">Bu ay liste işaretlenmemiş.</p>');
  const yok = sec('Yoklama', D.yok.length ? `<div class="rp-tb"><table><thead><tr><th>Çalışan</th><th>Gün</th><th>Saat</th><th>Ort. mola</th><th>Geç</th></tr></thead><tbody>${D.yok.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.d}</td><td>${r.h}</td><td>${r.b} dk</td><td>${r.l}</td></tr>`).join('')}</tbody></table></div>` : '<p class="rp-n">Bu ay tamamlanmış yoklama kaydı yok.</p>');
  return kais + kasa + ariza + gorev + talep + rez + lst + yok;
}
const RP_CSS = `.rp-s{background:#fff;border:1px solid #E1E8F2;border-radius:18px;padding:16px 18px;margin-bottom:12px;break-inside:avoid}.rp-s h3{margin:0 0 12px;font-size:16px}.rp-ts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.rp-t{background:#F4F8FE;border-radius:12px;padding:10px 12px}.rp-t b{display:block;font-size:20px}.rp-t small{font-size:12px;color:#5B6B82}.rp-n{margin:10px 0 0;font-size:13px;color:#5B6B82}.rp-svg{width:100%;height:auto;margin-top:12px}.rp-cap{margin:4px 0 0;font-size:12px;color:#5B6B82;display:flex;gap:6px;align-items:center}.rp-cap i{width:10px;height:10px;border-radius:3px;display:inline-block}.rp-cap .b{background:#2F73C9}.rp-cap .r{background:#C4384B;margin-left:10px}
.rp-bars{display:flex;flex-direction:column;gap:6px;margin-top:12px}.rp-b{display:grid;grid-template-columns:150px 1fr 44px;gap:10px;align-items:center;font-size:13px}.rp-b i{height:8px;background:#E8EDF4;border-radius:99px;overflow:hidden;display:block}.rp-b u{display:block;height:100%;background:#2F73C9;border-radius:99px}.rp-b b{text-align:right}.rp-b span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rp-k{display:flex;flex-direction:column;gap:10px}.rp-ki{display:flex;gap:10px}.rp-ki i{width:8px;height:8px;border-radius:50%;margin-top:6px;flex:none;background:#2F73C9}.rp-ki.r i{background:#C4384B}.rp-ki.a i{background:#E3A21A}.rp-ki.g i{background:#14A05A}.rp-ki b{font-size:14px}.rp-ki p{margin:2px 0 0;font-size:13px;color:#5B6B82}
.rp-tb{max-height:420px;overflow:auto}.rp-tb table{width:100%;border-collapse:collapse;font-size:13px}.rp-tb th{position:sticky;top:0;background:#F4F8FE;text-align:left;padding:8px 10px;font-size:12px;color:#5B6B82}.rp-tb td{padding:8px 10px;border-top:1px solid #EEF2F7}
@media(max-width:700px){.rp-ts{grid-template-columns:repeat(2,1fr)}.rp-b{grid-template-columns:100px 1fr 40px}}`;
{ const st = document.createElement('style'); st.textContent = RP_CSS; document.head.appendChild(st); }
function rpView() {
  const [y, m, ym] = rpYM(); const D = rpData(y, m, ym);
  return `<div class="rp"><section class="op-c"><div class="iz-nv"><button type="button" data-a="rpo" data-v="-1" aria-label="Önceki ay">${ic('back', 18)}</button><div style="text-align:center"><h3 style="margin:0">${D.label}</h3><span class="small muted">Aylık işletme raporu</span></div><button type="button" data-a="rpo" data-v="1" aria-label="Sonraki ay"${(S.rpO || 0) >= 0 ? ' disabled' : ''}>${ic('chevron', 18)}</button></div>
  <div class="op-ba" style="justify-content:center;margin-top:12px"><button class="btn" data-a="rppdf">${ic('file', 16)} PDF raporu</button><button class="btn sec" data-a="rpcsv" data-v="kasa">Kasa (Excel)</button><button class="btn sec" data-a="rpcsv" data-v="yok">Yoklama (Excel)</button></div></section>${rpBody(D)}</div>`;
}
H.rpo = (el) => { S.rpO = Math.min(0, (S.rpO || 0) + Number(el.dataset.v)); render(); };
function rpDoc(D) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(D.biz)} · ${esc(D.label)} raporu</title><style>*{box-sizing:border-box}body{margin:0;background:#F1F5FA;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#10213A;-webkit-print-color-adjust:exact;print-color-adjust:exact}.wrap{max-width:820px;margin:0 auto;padding:16px}.bar{position:sticky;top:0;background:#fff;border-bottom:1px solid #E1E8F2;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:2}.bar button{background:#0E4B97;color:#fff;border:0;border-radius:10px;padding:10px 16px;font:inherit;font-weight:600}.hd{padding:8px 4px 16px}.hd h1{margin:0;font-size:24px}.hd p{margin:4px 0 0;color:#5B6B82;font-size:13px}${RP_CSS}@media print{body{background:#fff}.bar{display:none}.wrap{padding:0;max-width:none}.rp-s{border-color:#D5DEEA}@page{size:A4;margin:14mm}}</style></head><body><div class="bar"><span>${esc(D.label)} raporu</span><button onclick="window.print()">PDF olarak kaydet / yazdır</button></div><div class="wrap"><div class="hd"><h1>${esc(D.biz)}</h1><p>${esc(D.label)} aylık işletme raporu · Hazırlayan: ${esc(D.by)} · ${esc(D.at)}</p></div>${rpBody(D)}<p style="text-align:center;font-size:11px;color:#7A889C;margin:18px 0">KaisPilot ile hazırlandı.</p></div></body></html>`;
}
H.rppdf = () => { const [y, m, ym] = rpYM(); const w = window.open('', '_blank'); if (!w) { toast('Açılır pencere engellendi. Tarayıcıda izin ver.', 'warn'); return; } w.document.open(); w.document.write(rpDoc(rpData(y, m, ym))); w.document.close(); };
const rpCsvSafe = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
H.rpcsv = (el) => {
  const [y, m, ym] = rpYM(); const D = rpData(y, m, ym); let rows = [];
  if (el.dataset.v === 'kasa') { rows.push(['Tarih', 'Açılış kasası', 'Sayılan nakit', 'Kart', 'Sistem toplamı', 'İade/iptal', 'Fark', 'Not']); D.kasa.rows.forEach((k) => rows.push([k.date, k.open, k.cash, k.card, k.sys, k.ref || 0, k.diff == null ? '' : k.diff, k.note || ''])); }
  else { rows.push(['Çalışan', 'Çalışılan gün', 'Toplam saat', 'Ort. mola (dk)', 'Geç giriş']); D.yok.forEach((r) => rows.push([r.name, r.d, String(r.h).replace('.', ','), r.b, r.l])); }
  const csv = '﻿' + rows.map((r) => r.map(rpCsvSafe).join(';')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = (el.dataset.v === 'kasa' ? 'kasa-' : 'yoklama-') + ym + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Dosya indirildi.', 'ok');
};
/* Operasyon: tüm sekmeleri tek yerde birleştir */
opTab = () => { const t = S.sub.ops; return ['ozet', 'liste', 'gorev', 'ariza', 'kasa', 'talep', 'rapor'].includes(t) ? t : 'ozet'; };
viewOps = function () {
  opSeed(); const cur = opTab(); const nA = mtOpen().length, nT = REQS.filter((r) => r.st === 'bekliyor').length, nG = tkOpen().length;
  const items = [['ozet', 'Özet'], ['liste', 'Günlük liste'], ['gorev', 'Görevler' + (nG ? ' (' + nG + ')' : '')], ['ariza', 'Arıza ve bakım' + (nA ? ' (' + nA + ')' : '')], ['kasa', 'Kasa'], ['talep', 'Talepler' + (nT ? ' (' + nT + ')' : '')], ['rapor', 'Raporlar']];
  const body = { ozet: opOzet, liste: () => `<div class="op-g2">${chkCard('ac', true)}${chkCard('ka', true)}</div>`, gorev: tkView, ariza: mtView, kasa: ksView, talep: rqView, rapor: rpView }[cur]();
  return `<div class="stack-lg op"><div><h2>Operasyon</h2><p class="muted" style="margin-top:4px">${esc(today())} · günlük işleyişi tek yerden takip et</p></div>${seg('ops', items, cur).replace('<div class="seg"', '<div class="seg seg-b"')}${body}</div>`;
};
/* ===== v89: 200 personel performansı ===== */
let __ekC = null;
{ const _el = ekLeaves; ekLeaves = function (id) { if (!__ekC) { const all = _el(); const by = {}; all.forEach((x) => { (by[x.uid] = by[x.uid] || []).push(x); }); __ekC = { all, by }; } return id ? (__ekC.by[id] || []).slice() : __ekC.all.slice(); }; }
{ const _r = render; render = function () { __ekC = null; return _r.apply(this, arguments); }; }
{ const _p = pSched; pSched = function () { __ekC = null; return _p.apply(this, arguments); }; }

/* ===== v90: Roller ve yetkiler, Kais bağlantılı öneri, Bugün özeti, fiyat kıyası ===== */
const KP_G = [
  ['Sayfalar', [['stokView', 'Stok', 'Stok listesi ve sayım'], ['saView', 'Satın alma', 'Alınacaklar ve siparişler'], ['rezView', 'Rezervasyon', 'Liste, masa planı, rapor'], ['opsView', 'Operasyon', 'Görev, arıza, kasa, raporlar'], ['kaisAi', 'Kais AI', 'Kais ile sohbet'], ['maliyetView', 'Maliyet ve kâr', 'Stok maliyet sekmesi, kâr oranları (varsayılan kapalı)']]],
  ['İşlemler', [['stokEdit', 'Stok düzenleme', 'Miktar, ürün ve toplu giriş'], ['saOrder', 'Sipariş verme', 'Oluştur, gönder, teslim al, iptal et'], ['rezEdit', 'Rezervasyon yazma', 'Ekle, düzenle, durum değiştir'], ['rezDel', 'Rezervasyon iptali ve masa silme', 'Geri alınması zor işlemler'], ['reqApprove', 'Talep ve izin kararı', 'Avans, takas, izin onayı ve reddi']]],
];
const KP_ALL = KP_G.reduce((a, g) => a.concat(g[1].map((x) => x[0])), []);
const KP_VIEW = { stok: 'stokView', satinalma: 'saView', rezerv: 'rezView', ops: 'opsView', kaisai: 'kaisAi' };
const KP_PRE = {
  tam: () => ({}),
  dengeli: () => ({ saOrder: false, rezDel: false, reqApprove: true, stokEdit: true }),
  izleme: () => ({ stokEdit: false, saOrder: false, rezEdit: false, rezDel: false, reqApprove: false }),
};
const KP_OFF = ['maliyetView'];
const kpOn = (k) => { const p = S.settings.perm; return KP_OFF.includes(k) ? !!(p && p[k] === true) : (!p || p[k] !== false); };
const kpCan = (k) => { const u = S.user; if (!u || u.role !== 'mudur') return true; return kpOn(k); };
const kpDeny = () => toast('Bu işlem için yetkin kapalı. Patronla konuş.', 'warn');
{
  const base = NAV.mudur.slice();
  Object.defineProperty(NAV, 'mudur', { configurable: true, enumerable: true, get() { return base.filter((n) => !KP_VIEW[n[0]] || kpCan(KP_VIEW[n[0]])); } });
}
{
  const _v = viewHTML;
  viewHTML = function () {
    const u = S.user; const k = KP_VIEW[S.view];
    if (u && u.role === 'mudur' && k && !kpCan(k)) return `<div class="kp-lock">${ic('lock', 28)}<b>Bu bölüm kapalı</b><p>Patron bu sayfayı senin için açmadı. İstersen ona söyle, Ayarlar'dan açabilir.</p><button class="btn sec" data-a="nav" data-v="bugun">Bugün'e dön</button></div>`;
    return _v();
  };
}
[['stokEdit', ['stk', 'stkadd', 'stksave', 'stkbulk']], ['saOrder', ['ordcreate', 'ordcancel', 'ordrecv', 'ordwa', 'ordrec', 'ordremind']], ['rezEdit', ['rznew', 'rzedit', 'rzsave', 'rzsend', 'rzforce', 'rztadd']], ['rezDel', ['rztdel']], ['reqApprove', ['rqok', 'rqno', 'lrok', 'lrrej', 'lrctr', 'lrctrok', 'lrfinal']]].forEach((g) => {
  g[1].forEach((n) => { const o = H[n]; if (typeof o !== 'function') return; H[n] = function (el) { if (!kpCan(g[0])) return kpDeny(); return o.apply(this, arguments); }; });
});
{ const o = H.rzst; if (typeof o === 'function') H.rzst = function (el) { const s = el && el.dataset && el.dataset.s; if (s === 'iptal' ? !kpCan('rezDel') : !kpCan('rezEdit')) return kpDeny(); return o.apply(this, arguments); }; }
H.perm = (el) => {
  if (!S.user || S.user.role !== 'patron') return;
  const k = el.dataset.k; if (!KP_ALL.includes(k)) return;
  const p = S.settings.perm || (S.settings.perm = {}); if (KP_OFF.includes(k)) p[k] = p[k] !== true; else p[k] = p[k] === false; pSched(); render();
};
H.permpre = (el) => {
  if (!S.user || S.user.role !== 'patron') return;
  const f = KP_PRE[el.dataset.v]; if (!f) return; const o = f(); const p = {}; KP_ALL.forEach((k) => { if (o[k] === false) p[k] = false; });
  KP_OFF.forEach((k) => { if (el.dataset.v === 'tam') p[k] = true; }); S.settings.perm = p; if (el.dataset.v === 'izleme') { S.settings.mudurMaas = false; } pSched(); render(); toast('Yetkiler güncellendi.', 'ok');
};
const kpPreOn = () => { const p = S.settings.perm || {}; const off = KP_ALL.filter((k) => p[k] === false).sort().join(','); return ['tam', 'dengeli', 'izleme'].find((n) => { const o = KP_PRE[n](); return KP_ALL.filter((k) => o[k] === false).sort().join(',') === off; }) || ''; };
function kpCard() {
  const on = KP_ALL.filter((k) => kpCan(k)).length; const pre = kpPreOn();
  const sw = (k, t, s) => `<div class="toggle"><div><b style="font-weight:600">${esc(t)}</b><div class="small muted">${esc(s)}</div></div><button class="sw" role="switch" aria-checked="${kpOn(k)}" aria-label="${esc(t)}" data-a="perm" data-k="${k}"></button></div>`;
  return `<div class="card kp-card"><div class="row between wrap"><div><h3>Müdür yetkileri</h3><p class="muted small" style="margin-top:2px">Müdürün neyi görüp neyi yapabileceğini sen belirlersin. Kapattığın sayfa menüsünden kalkar.</p></div><span class="pill p-info">${on}/${KP_ALL.length} açık</span></div>
  <div class="kp-pre">${[['tam', 'Tam yetki'], ['dengeli', 'Dengeli'], ['izleme', 'Sadece izleme']].map((x) => `<button type="button" data-a="permpre" data-v="${x[0]}" aria-pressed="${pre === x[0]}">${x[1]}</button>`).join('')}</div>
  ${KP_G.map((g) => `<div class="kp-g"><div class="kp-gh">${g[0]}</div>${g[1].map((x) => sw(x[0], x[1], x[2])).join('')}</div>`).join('')}
  <div class="kp-g"><div class="kp-gh">Kişisel veri</div>
  <div class="toggle"><div><b style="font-weight:600">Maaş ve ödemeler</b><div class="small muted">Çalışan detayında görünsün</div></div><button class="sw" role="switch" aria-checked="${S.settings.mudurMaas !== false}" aria-label="Maaş ve ödemeler" data-a="toggle" data-k="mudurMaas"></button></div>
  <div class="toggle"><div><b style="font-weight:600">Aylık sıralama</b><div class="small muted">Bireysel puan ve sıralama</div></div><button class="sw" role="switch" aria-checked="${!!S.settings.mudurRanking}" aria-label="Aylık sıralama" data-a="toggle" data-k="mudurRanking"></button></div></div>
  <p class="small muted" style="margin-top:10px">Not: Yetkiler uygulama ekranında uygulanır. Veri tabanı düzeyinde sınır, rol bazlı kapsamlar (stok, ekip, muhasebe) üzerinden zaten ayrılır.</p></div>`;
}
{
  const _v = viewHTML;
  viewHTML = function () {
    let h = _v(); const u = S.user;
    if (u && u.role === 'patron' && S.view === 'ayarlar' && !h.includes('kp-card')) { const i = h.indexOf('<div class="card"><h3>Yetkiler</h3>'); if (i >= 0) h = h.slice(0, i) + kpCard() + h.slice(i).replace('<h3>Yetkiler</h3>', '<h3>Diğer ayarlar</h3>'); }
    return h;
  };
}

/* --- Kais bağlantılı öneri --- */
const kbNum = (n) => (Math.round(n * 10) / 10).toLocaleString('tr-TR');
function kbSales() {
  const by = {}; SALES.forEach((s) => { by[s.date] = (by[s.date] || 0) + (Number(s.total) || 0); });
  return by;
}
function kbShifts(iso) { const a = iso.split('-').map(Number); let n = 0, lv = 0; EMP_IDS.forEach((id) => { const s = vdState(a[0], a[1] - 1, a[2], id); if (s.k === 'shift') n++; else if (s.k === 'leave') lv++; }); return { n, lv, pub: vdPub(a[0], a[1] - 1) }; }
function kbDay() {
  const tm = addDays(REF_ISO, 1); const f = { tm, sig: [], act: [], busy: false };
  const rs = RESV.filter((r) => r.date === tm && rzActive(r)); const guests = rs.reduce((a, r) => a + (Number(r.n) || 0), 0); const cap = rzCap(); const pk = rzPeak(tm);
  f.res = { n: rs.length, guests, cap, peak: pk.p, at: pk.t };
  const by = kbSales(); const ds = Object.keys(by).filter((d) => d < REF_ISO && dayDiff(d, REF_ISO) <= 56);
  const dw = dowOf(tm); const same = ds.filter((d) => dowOf(d) === dw);
  if (ds.length >= 7 && same.length >= 2) { const all = ds.reduce((a, d) => a + by[d], 0) / ds.length; const sm = same.reduce((a, d) => a + by[d], 0) / same.length; if (all > 0) f.pct = Math.round((sm / all - 1) * 100); f.avg = sm; }
  f.sh = kbShifts(tm); f.shToday = kbShifts(REF_ISO);
  const plan = stockPlan(); f.crit = plan.filter((p) => p.status === 'now'); f.soon = plan.filter((p) => p.status === 'soon'); f.props = proposals();
  f.busy = (f.pct != null && f.pct >= 10) || (cap > 0 && f.res.peak / cap >= 0.7);
  return f;
}
const kbName = (st) => st.name.split(' (')[0];
const kbWd = (iso) => ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dowOf(iso)];
function kbCard() {
  const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return '';
  const f = kbDay(); const rows = []; const act = []; const wd = kbWd(f.tm);
  const R = (tone, ico, t) => rows.push(`<li class="kb-r ${tone}"><span>${ic(ico, 16)}</span><div>${t}</div></li>`);
  if (f.res.n) R(f.res.cap && f.res.peak / f.res.cap >= 0.7 ? 'warn' : '', 'calendar', `<b>${f.res.n} rezervasyon, ${f.res.guests} kişi.</b> En yoğun saat ${esc(f.res.at)}${f.res.cap ? ' (doluluk %' + Math.round(f.res.peak / f.res.cap * 100) + ')' : ''}.`);
  if (f.pct != null) R(f.pct >= 10 ? 'warn' : '', 'trend', `<b>${wd} satışları ${f.pct >= 0 ? 'ortalamanın %' + f.pct + ' üstünde' : 'ortalamanın %' + Math.abs(f.pct) + ' altında'}.</b> Son haftaların ${wd.toLowerCase()} ortalaması ${fmt0(Math.round(f.avg))}.`);
  if (!f.sh.pub) R('warn', 'users', '<b>Bu ayın vardiya planı yayında değil.</b> Çalışanlar yarın kimin çalışacağını göremiyor.');
  else R(f.busy && f.sh.n < f.shToday.n ? 'bad' : '', 'users', `<b>Yarın ${f.sh.n} kişi vardiyada</b>${f.sh.lv ? ', ' + f.sh.lv + ' kişi izinli' : ''}${f.shToday.n ? ' (bugün ' + f.shToday.n + ')' : ''}.${f.busy && f.sh.n < f.shToday.n ? ' Yoğun günde bugünden az kişi var.' : ''}`);
  const sc = f.crit.concat(f.soon);
  if (sc.length) R(f.crit.length ? 'bad' : 'warn', 'box', `<b>${f.crit.length ? f.crit.length + ' ürün şimdi sipariş istiyor' : sc.length + ' ürün yakında bitecek'}:</b> ${esc(sc.slice(0, 3).map((p) => kbName(p.st)).join(', '))}${sc.length > 3 ? ' ve ' + (sc.length - 3) + ' ürün daha' : ''}.`);
  const need = f.props.length ? f.props.reduce((a, o) => a + o.total, 0) : 0;
  let rec = '';
  const parts = [];
  if (f.busy) parts.push(`${wd} yoğun görünüyor`);
  if (f.busy && f.sh.pub && f.sh.n < f.shToday.n) parts.push('vardiyaya kişi eklemeyi düşün');
  if (!f.sh.pub) parts.push('vardiya planını yayınla');
  if (f.props.length) parts.push(`${f.props.length} tedarikçiye toplam ${fmt0(Math.round(need))} sipariş hazır`);
  if (parts.length) rec = parts.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.';
  if (f.props.length && kpCan('saView')) act.push(['nav', 'satinalma', 'Siparişi hazırla', 'box']);
  if ((f.busy || !f.sh.pub) && u.role === 'patron') act.push(['nav', 'ekip', 'Vardiyayı aç', 'users', 'vardiya']);
  if (f.res.n && kpCan('rezView')) act.push(['nav', 'rezerv', 'Rezervasyonlar', 'calendar']);
  if (!rows.length) return '';
  return `<section class="card kb-card"><div class="row between wrap"><div class="row" style="gap:8px"><span class="kb-sp">${ic('sparkle', 18)}</span><div><h3>Kais: yarın için bütün resim</h3><p class="muted small" style="margin-top:2px">${esc(wd)} · stok, vardiya, satış ve rezervasyon birlikte değerlendirildi</p></div></div></div>
  <ul class="kb-l">${rows.join('')}</ul>
  ${rec ? `<div class="kb-rec">${ic('check', 16)}<div><b>Önerim</b><p>${esc(rec)}</p></div></div>` : '<div class="kb-rec ok">' + ic('check', 16) + '<div><b>Yarın için dikkat çeken bir şey yok.</b></div></div>'}
  ${act.length ? `<div class="kb-act">${act.map((a) => `<button class="btn sm sec" data-a="nav" data-v="${a[1]}"${a[4] ? ' data-s="' + a[4] + '"' : ''}>${ic(a[3], 16)} ${a[2]}</button>`).join('')}</div>` : ''}</section>`;
}
function kbStrip() {
  const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return '';
  const plan = stockPlan(); const crit = plan.filter((p) => p.status === 'now').length; const acil = MAINT.filter((m) => m.pri === 'acil' && m.st !== 'bitti').length;
  const lv = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length; const rq = REQS.filter((r) => r.st === 'bekliyor').length; const rc = u.role === 'patron' ? pendingReceipts().length : 0;
  const ord = proposals().reduce((a, o) => a + o.lines.length, 0); let late = 0; try { late = opLate().length; } catch (e) {}
  const by = kbSales(); const ts = by[REF_ISO];
  const c = (ico, n, l, tone, v, s) => `<button class="kb-c ${tone}${n ? '' : ' z'}" data-a="nav" data-v="${v}"${s ? ' data-s="' + s + '"' : ''}><span>${ic(ico, 18)}</span><b>${n}</b><small>${l}</small></button>`;
  const items = [c('alert', crit + acil, 'kritik', 'bad', crit ? 'stok' : (u.role === 'patron' || kpCan('opsView') ? 'ops' : 'bugun')), c('clock', lv + rq + rc, 'onay bekliyor', 'warn', rc && !lv && !rq ? 'muhasebe' : (lv && !rq ? 'ekip' : 'ops'), rc && !lv && !rq ? 'fisler' : lv && !rq ? 'talep' : 'talep'), c('box', ord, 'ürün sipariş', 'info', 'satinalma'), c('users', late, 'geç kalan', 'warn', 'ekip', 'bugun')];
  if (ts != null && (u.role === 'patron')) items.push(`<button class="kb-c ok" data-a="nav" data-v="satis"><span>${ic('trend', 18)}</span><b>${fmt0(Math.round(ts))}</b><small>bugünkü satış</small></button>`);
  const vis = items.filter((x, i) => !(i === 2 && !kpCan('saView')) );
  return `<div class="kb-st" role="group" aria-label="Bugünün özeti">${vis.join('')}</div>`;
}
{
  const _v = viewHTML;
  viewHTML = function () {
    let h = _v(); const u = S.user;
    if (!u || S.view !== 'bugun' || !['patron', 'mudur'].includes(u.role) || h.includes('kb-st')) return h;
    const add = kbStrip() + kbCard(); if (!add) return h;
    const t = '<div class="stack-lg">'; const i = h.indexOf(t); return i < 0 ? add + h : h.slice(0, i + t.length) + add + h.slice(i + t.length);
  };
}

/* --- Tedarikçi fiyat kıyası --- */
function fkRows() {
  const perf = {}; try { supPerf().forEach((x) => { perf[x.sp.id] = x; }); } catch (e) {}
  return stockPlan().filter((p) => p.status !== 'ok').map((p) => {
    const offs = offersOf(p.st.id).slice().sort((a, b) => a.items[p.st.id] - b.items[p.st.id]);
    return { p, offs, perf };
  }).filter((r) => r.offs.length);
}
function fkCard() {
  const rows = fkRows(); if (!rows.length) return '';
  return `<section class="card fk-card"><div><h3>Fiyat kıyası</h3><p class="muted small" style="margin-top:2px">Stoğu azalan ürünlerde tedarikçi teklifleri yan yana. Kais fiyat, teslim süresi ve mesafeye göre seçer; karar senin.</p></div>
  <div class="fk-l cap-sc">${rows.map((r) => {
    const p = r.p; const best = r.offs[0].items[p.st.id];
    return `<div class="fk-p"><div class="row between wrap"><b>${esc(kbName(p.st))}</b><span class="small muted">${fq(p.st.qty)} ${esc(p.st.unit)} · ${p.left === Infinity ? 'tüketim yok' : '~' + (p.left < 10 ? kbNum(p.left) : Math.round(p.left)) + ' gün yeter'}</span></div>
    ${r.offs.map((t) => { const pr = t.items[p.st.id]; const pick = p.pick && p.pick.id === t.id; const km = sgKm(t); const pf = r.perf[t.id]; const why = pick ? (pr === best ? 'en ucuz ve zamanında' : 'daha ucuzu geç gelir') : '';
      return `<div class="fk-o${pick ? ' pk' : ''}"><div class="grow"><b>${esc(t.name)}</b>${pick ? `<span class="pill p-ok">Kais seçimi</span>` : ''}<div class="small muted">Teslim ${t.lead} gün${km != null ? ' · ' + kbNum(km) + ' km' : ''}${pf && pf.ontime != null ? ' · zamanında %' + Math.round(pf.ontime * 100) : ''}${why ? ' · ' + why : ''}</div></div><div class="fk-pr"><b class="num">${fmt(pr)}</b>${pr > best ? `<small>+%${Math.round((pr / best - 1) * 100)}</small>` : '<small class="g">en düşük</small>'}</div></div>`; }).join('')}</div>`;
  }).join('')}</div></section>`;
}
{
  const _v = viewSatinAlma;
  viewSatinAlma = function () {
    const h = _v(); if ((S.saTab || 'siparis') !== 'siparis') return h; const c = fkCard(); if (!c) return h;
    const i = h.lastIndexOf('</div>'); return i < 0 ? h + c : h.slice(0, i) + c + h.slice(i);
  };
}

/* ===== v93: Kais aksiyonları (öneri değil, tek dokunuşla iş) ===== */
const KACT = { day: '', done: {} }; P_OBJ.push(['KACT', () => KACT]); P_SCOPE.KACT = 'ekip';
const kaFresh = () => { if (KACT.day !== REF_ISO) { KACT.day = REF_ISO; KACT.done = {}; } };
const kaHello = () => { const h = new Date().getHours(); return h < 5 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'; };
function kaVdMonth() { const n = new Date(); const y = n.getFullYear(), m = n.getMonth(); if (!vdPub(y, m)) return { y, m }; const nx = new Date(y, m + 1, 1); if (n.getDate() >= 20 && !vdPub(nx.getFullYear(), nx.getMonth())) return { y: nx.getFullYear(), m: nx.getMonth() }; return null; }
function kaItems() {
  kaFresh(); const u = S.user; const out = []; if (!u || !['patron', 'mudur'].includes(u.role)) return out;
  const f = kbDay(); const P = u.role === 'patron';
  const run = (key, ico, tone, text, sub, fn, undo) => out.push({ key, ico, tone, text, sub, fn, undo, d: KACT.done[key] || null });
  const go = (ico, tone, text, sub, v, s) => out.push({ key: 'go:' + text, ico, tone, text, sub, go: [v, s] });
  if (P || (kpCan('saView') && kpCan('saOrder'))) f.props.forEach((o) => {
    run('ord:' + o.sup.id, 'box', f.crit.length ? 'bad' : 'warn', `${o.sup.name}'a ${o.lines.length} kalem sipariş hazırla`, `${fmt0(Math.round(o.total))} · teslim ${o.sup.lead} gün · ${o.lines.slice(0, 3).map((l) => kbName(l.st)).join(', ')}${o.lines.length > 3 ? '…' : ''}`,
      () => { const n = ORDERS.length; H.ordcreate({ dataset: { id: o.sup.id } }); return ORDERS.length > n ? { id: ORDERS[0].id, kind: 'ord' } : null; },
      (d) => { const x = ORDERS.find((q) => q.id === d.id); if (x && x.status === 'gonderildi') x.status = 'iptal'; });
  });
  const tk = (key, text, uid) => run(key, 'check', 'warn', text, 'Görev olarak verilir, çalışana bildirim gider', () => { const k = { id: 'tk' + (++seq), t: text, uid, by: u.id, due: REF_ISO, pri: 'onemli', st: 'acik', at: nowT() }; TASKS.unshift(k); pSched(); try { pushSend(uid === 'all' ? EMP_IDS : [uid], 'Yeni görev', text); } catch (e) {} return { id: k.id, kind: 'tk' }; }, (d) => { const i = TASKS.findIndex((q) => q.id === d.id); if (i >= 0) TASKS.splice(i, 1); });
  const asg = P ? ((USERS.find((x) => x.role === 'mudur') || {}).id || 'all') : 'all';
  if (kpCan('opsView') && f.crit.length) tk('tk:crit:' + REF_ISO, 'Kritik ürünleri say ve doğrula: ' + f.crit.slice(0, 3).map((p) => kbName(p.st)).join(', '), asg);
  if (kpCan('opsView') && f.busy) tk('tk:busy:' + f.tm, kbWd(f.tm) + ' yoğun olacak: masa, stok ve ekip hazırlığını kontrol et', asg);
  const vm = kaVdMonth();
  if (vm) {
    const ym = vm.y + '-' + String(vm.m + 1).padStart(2, '0'); const has = Object.keys(VD_F).some((d) => d.startsWith(ym));
    if (P && VD_T.length && !has) run('vd:' + ym, 'users', 'warn', 'Vardiya planı taslağını hazırla', `${vm.m + 1}. ay için ${EMP_IDS.length} kişiye dağıtır; yayınlamadan önce sen gözden geçirirsin`, () => { vdAuto(vm.y, vm.m); pSched(); return { kind: 'vd' }; }, null);
    else if (P) go('users', 'warn', 'Vardiya planı yayında değil', has ? 'Plan hazır, gözden geçirip yayınla' : 'Önce vardiya şablonu ekle', 'ekip', 'vardiya');
  }
  priceAlerts().slice(0, 2).forEach((i) => go('trend', 'warn', `${kbName(i.st)} fiyatı ortalamanın %${Math.round(i.pct)} üstünde`, i.best ? 'En düşük teklif: ' + i.best.name : 'Tedarikçi tekliflerini karşılaştır', 'satinalma'));
  const lv = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length; const rq = REQS.filter((r) => r.st === 'bekliyor').length;
  if (kpCan('reqApprove') && lv + rq) go('clock', 'warn', `${lv + rq} talep karar bekliyor`, 'İzin, avans ve takas talepleri', lv && !rq ? 'ekip' : 'ops', 'talep');
  const ac = MAINT.filter((m) => m.pri === 'acil' && m.st !== 'bitti').length; if (ac && kpCan('opsView')) go('alert', 'bad', `${ac} acil arıza açık`, 'İlgilenecek kişiyi ata', 'ops', 'ariza');
  Object.keys(KACT.done).forEach((k) => { if (!out.some((i) => i.key === k)) { const d = KACT.done[k]; out.push({ key: k, fn: true, text: d.text || 'Kais işi', sub: '', d, undo: d.kind === 'ord' || d.kind === 'tk' ? kaUndoD : null }); } });
  return out;
}
const kaUndoD = (d) => { if (d.kind === 'ord') { const x = ORDERS.find((q) => q.id === d.id); if (x && x.status === 'gonderildi') x.status = 'iptal'; } else if (d.kind === 'tk') { const i = TASKS.findIndex((q) => q.id === d.id); if (i >= 0) TASKS.splice(i, 1); } };
const kaSel = (it) => (S.kaSel && S.kaSel[it.key] === false) ? false : true;
function kaCard() {
  const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return '';
  const items = kaItems(); if (!items.length) return '';
  const runs = items.filter((i) => i.fn); const todo_ = runs.filter((i) => !i.d); const n = todo_.filter(kaSel).length;
  const row = (i) => i.fn ? (i.d ? `<div class="ka-r done"><span class="ka-ck">${ic('check', 14)}</span><div class="grow"><b>${esc(i.text)}</b><small>Yapıldı · ${esc(i.d.at)}</small></div>${i.undo ? `<button class="btn sm sec" data-a="kaundo" data-k="${esc(i.key)}">Geri al</button>` : ''}</div>`
    : `<button type="button" class="ka-r" data-a="kasel" data-k="${esc(i.key)}" aria-pressed="${kaSel(i)}"><span class="ka-ck">${kaSel(i) ? ic('check', 14) : ''}</span><div class="grow"><b>${esc(i.text)}</b><small>${esc(i.sub)}</small></div></button>`)
    : `<button type="button" class="ka-r go" data-a="nav" data-v="${i.go[0]}"${i.go[1] ? ' data-s="' + i.go[1] + '"' : ''}><span class="ka-ic ${i.tone}">${ic(i.ico, 15)}</span><div class="grow"><b>${esc(i.text)}</b><small>${esc(i.sub)}</small></div>${ic('chevron', 16)}</button>`;
  const name = (u.name || '').split(' ')[0];
  return `<section class="card ka-card"><div class="row" style="gap:10px"><span class="kb-sp">${ic('sparkle', 18)}</span><div><h3>${kaHello()} ${esc(name)}</h3><p class="muted small" style="margin-top:2px">${todo_.length ? `${todo_.length} işi senin için hazırlayabilirim. Onayınla yaparım.` : runs.length ? 'Hazırlayabileceğim her şeyi yaptım.' : 'Dikkat etmen gereken konular:'}</p></div></div>
  <div class="ka-l">${items.map(row).join('')}</div>
  ${todo_.length ? `<button class="btn block" data-a="kaall"${n ? '' : ' disabled'}>${ic('check', 16)} Seçilenleri yap${n ? ' (' + n + ')' : ''}</button>` : ''}</section>`;
}
H.kasel = (el) => { const k = el.dataset.k; S.kaSel = S.kaSel || {}; S.kaSel[k] = S.kaSel[k] === false; render(); };
H.kaall = () => {
  const items = kaItems().filter((i) => i.fn && !i.d && kaSel(i)); if (!items.length) return; let ok = 0;
  items.forEach((i) => { try { const r = i.fn(); KACT.done[i.key] = Object.assign({ at: hhmm(new Date()), text: i.text }, r || {}); ok++; } catch (e) { toast('Bir iş yapılamadı: ' + (e && e.message || e), 'warn'); } });
  try { auditAdd({ type: 'kais', text: 'Kais ' + ok + ' işi onayla yaptı' }); } catch (e) {}
  pSched(); render(); toast(ok + ' iş hazırlandı.', 'ok');
};
H.kaundo = (el) => { const d = KACT.done[el.dataset.k]; const it = kaItems().find((i) => i.key === el.dataset.k); if (!d || !it || !it.undo) return; try { kaUndoD(d); } catch (e) {} delete KACT.done[el.dataset.k]; pSched(); render(); toast('Geri alındı.'); };
{ const _v = viewHTML; viewHTML = function () { let h = _v(); const u = S.user; if (!u || S.view !== 'bugun' || !['patron', 'mudur'].includes(u.role) || h.includes('ka-card')) return h; const c = kaCard(); if (!c) return h; const i = h.indexOf('<section class="card kb-card">'); if (i < 0) { const t = '<div class="stack-lg">'; const j = h.indexOf(t); return j < 0 ? c + h : h.slice(0, j + t.length) + c + h.slice(j + t.length); } const e = h.indexOf('</section>', i) + 10; return h.slice(0, e) + c + h.slice(e); }; }

/* ===== v94: Kais sohbette iş yapar (yerel komutlar: anında, ücretsiz, veri cihazdan çıkmaz) ===== */
const kaFold = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/â/g, 'a').replace(/[’'`]/g, "'").trim();
const kaMgr = () => !!S.user && ['patron', 'mudur'].includes(S.user.role);
const kaDeny = (t) => ({ content: t });
function kaOrderAct() {
  if (!kaMgr()) return kaDeny('Sipariş hazırlamak patron ve müdürün işi. Bu rolde yapamam.');
  if (!kpCan('saOrder')) return kaDeny('Sipariş verme yetkin kapalı. Patronla konuş.');
  const rows = stockPlan().filter((p) => p.pick && p.qty > 0); const props = proposals();
  if (!rows.length) return { content: 'Şu an sipariş vermen gereken ürün yok. Stok seviyeleri yeterli görünüyor.' };
  const tot = props.reduce((a, o) => a + o.total, 0);
  return { content: `${rows.length} ürün için ${props.length} tedarikçiye sipariş hazırladım, toplam ${fmt0(Math.round(tot))}. Her ürün için en uygun tedarikçiyi fiyat, teslim süresi ve mesafeye göre seçtim. Miktarları düzeltip onaylayabilirsin.`, acts: [{ type: 'siparis_olustur', args: { urunler: rows.map((p) => ({ stok_id: p.st.id, miktar: p.qty })) }, st: 'open' }] };
}
function kaUidFrom(f) {
  if (/\b(herkes|ekip|tum calisan|calisanlara)/.test(f)) return 'all';
  const us = USERS.filter((u) => u.role !== 'patron' || u.id !== (S.user && S.user.id)).sort((a, b) => b.name.length - a.name.length);
  for (const u of us) { const fn = kaFold(u.name.split(' ')[0]); if (fn.length >= 3 && new RegExp('(^|[^a-z])' + fn + "([^a-z]|$)").test(f)) return u.id; }
  return null;
}
function kaTaskAct(text) {
  if (!kaMgr()) return kaDeny('Görev vermek patron ve müdürün işi.');
  if (!kpCan('opsView')) return kaDeny('Operasyon yetkin kapalı, görev veremem.');
  const f = kaFold(text); const ci = text.indexOf(':'); let body = ci >= 0 ? text.slice(ci + 1).trim() : '';
  const uid = kaUidFrom(ci >= 0 ? kaFold(text.slice(0, ci)) : f);
  if (!body) { body = text.replace(/\b(\S+'?(a|e|ya|ye|na|ne)\s+)?g[öo]rev\s+(ver|ata|olu[sş]tur|ekle)\w*/i, '').replace(/\b(herkese|ekibe)\b/i, '').replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, ''); const nm = uid && uid !== 'all' ? (byId(uid).name.split(' ')[0]) : ''; if (nm) body = body.replace(new RegExp(nm + "('?\\w{0,3})\\s*", 'i'), '').trim(); }
  if (body.length < 4) return { content: 'Görev ne olsun? Şöyle yaz: "Mehmet\'e görev ver: bar temizliğini bitir".' };
  const due = /\byarin\b/.test(f) ? addDays(REF_ISO, 1) : REF_ISO;
  return { content: 'Görevi hazırladım. Kime verileceğini ve metni kontrol et, sonra onayla.', acts: [{ type: 'gorev_ver', args: { t: body.replace(/\s*\b(bugun|yarin)\b\s*/i, ' ').trim() || body, uid: uid || 'all', due }, st: 'open' }] };
}
function kaShiftAct() {
  if (!S.user || S.user.role !== 'patron') return kaDeny('Vardiya planını yalnızca patron hazırlayabilir.');
  const vm = kaVdMonth() || { y: new Date().getFullYear(), m: new Date().getMonth() };
  if (!VD_T.length) return kaDeny('Önce vardiya şablonu eklemelisin (Ekip, Vardiya). Şablon olmadan plan çıkaramam.');
  const ym = vm.y + '-' + String(vm.m + 1).padStart(2, '0');
  if (Object.keys(VD_F).some((d) => d.startsWith(ym))) return kaDeny(`${vm.m + 1}. ay için plan zaten girilmiş. Elle yaptığın değişiklikleri silmemek için dokunmadım.`);
  return { content: `${vm.m + 1}. ay için ${EMP_IDS.length} kişiye vardiya dağıtabilirim: şablonlara dönüşümlü, herkese haftalık izin günü. Taslağı kaydedince Ekip, Vardiya'dan gözden geçirip yayınlarsın.`, acts: [{ type: 'vardiya_taslak', args: { y: vm.y, m: vm.m }, st: 'open' }] };
}
function kaTomorrow() {
  if (!kaMgr()) return kaDeny('Bu özet yalnızca patron ve müdür için.');
  const f = kbDay(); const wd = kbWd(f.tm); const L = [];
  L.push(f.res.n ? `Rezervasyon: ${f.res.n} kayıt, ${f.res.guests} kişi${f.res.cap ? ', en yoğun saat ' + f.res.at + ' (doluluk %' + Math.round(f.res.peak / f.res.cap * 100) + ')' : ''}.` : 'Rezervasyon: henüz kayıt yok.');
  if (f.pct != null) L.push(`Satış: ${wd} günleri ortalamanın %${Math.abs(f.pct)} ${f.pct >= 0 ? 'üstünde' : 'altında'} seyrediyor.`);
  L.push(f.sh.pub ? `Vardiya: ${f.sh.n} kişi çalışıyor${f.sh.lv ? ', ' + f.sh.lv + ' kişi izinli' : ''}.` : 'Vardiya: bu ayın planı yayında değil.');
  const sc = f.crit.concat(f.soon); L.push(sc.length ? `Stok: ${sc.slice(0, 4).map((p) => kbName(p.st) + (p.left === Infinity ? '' : ' (~' + Math.max(0, Math.round(p.left)) + ' gün)')).join(', ')} azalıyor.` : 'Stok: kritik ürün yok.');
  const tip = []; if (f.busy) tip.push(`${wd} yoğun görünüyor`); if (f.busy && f.sh.pub && f.sh.n < f.shToday.n) tip.push('vardiyaya kişi eklemeyi düşün'); if (sc.length) tip.push('siparişi bugün verirsen yetişir');
  return { content: `${wd} için bütün resim:\n\n${L.map((x) => '• ' + x).join('\n')}${tip.length ? '\n\nÖnerim: ' + tip.join(', ') + '.' : '\n\nDikkat çeken bir şey yok.'}` };
}
function kaToday() {
  if (!kaMgr()) return kaDeny('Bu özet yalnızca patron ve müdür için.');
  const it = kaItems(); if (!it.length) return { content: 'Şu an dikkat çeken bir konu yok. Her şey yolunda görünüyor.' };
  const todo_ = it.filter((i) => i.fn && !i.d); const info = it.filter((i) => !i.fn);
  return { content: `${it.length} konu dikkatimi çekti:\n\n${it.filter((i) => !i.d).map((i) => '• ' + i.text).join('\n')}${todo_.length ? '\n\nBunlardan ' + todo_.length + ' tanesini senin için hazırlayabilirim. Bugün ekranındaki Kais kartından seçip onaylayabilirsin.' : ''}`, acts: [] };
}
function kaCritical() {
  if (!kaMgr()) return kaDeny('Stok durumu yalnızca patron ve müdür için.');
  const p = stockPlan().filter((x) => x.status !== 'ok').sort((a, b) => a.left - b.left);
  if (!p.length) return { content: 'Kritik ya da azalan ürün yok.' };
  return { content: `${p.length} ürün azalıyor:\n\n${p.slice(0, 10).map((x) => `• ${kbName(x.st)}: ${fq(x.st.qty)} ${x.st.unit}${x.left === Infinity ? '' : ', yaklaşık ' + Math.max(0, Math.round(x.left * 10) / 10) + ' gün yeter'}${x.pick ? ' → ' + x.pick.name + ' (' + fmt(x.price) + ')' : ''}`).join('\n')}\n\nİstersen "sipariş hazırla" yaz, hepsini ayarlayayım.` };
}
function kaCompare() {
  if (!kaMgr()) return kaDeny('Tedarikçi fiyatları yalnızca patron ve müdür için.');
  const rows = stockPlan().filter((x) => x.status !== 'ok' && offersOf(x.st.id).length > 1);
  if (!rows.length) return { content: 'Karşılaştırılacak, birden fazla tedarikçisi olan azalan ürün yok.' };
  return { content: rows.slice(0, 6).map((x) => { const o = offersOf(x.st.id).slice().sort((a, b) => a.items[x.st.id] - b.items[x.st.id]); const best = o[0].items[x.st.id]; return `${kbName(x.st)}:\n` + o.map((t) => `  ${x.pick && x.pick.id === t.id ? '★' : '•'} ${t.name}: ${fmt(t.items[x.st.id])}${t.items[x.st.id] > best ? ' (+%' + Math.round((t.items[x.st.id] / best - 1) * 100) + ')' : ''}, ${t.lead} gün${sgKm(t) != null ? ', ' + q1(sgKm(t)) + ' km' : ''}`).join('\n'); }).join('\n\n') + '\n\n★ Kais seçimi: fiyat, teslim süresi ve mesafeye göre.' };
}
function kaIntent(text) {
  const f = kaFold(text); if (f.length > 220) return null;
  if (/(\bsiparis\b.*\b(hazirla|ver|olustur|cikar|gec)|\b(hazirla|olustur)\b.*\bsiparis|eksikleri?\s+(tamamla|sipar))/.test(f) && !/\b(neden|nasil|ne zaman|kac|gecmis|durum)\b/.test(f)) return kaOrderAct();
  if (/\bgorev\b.*\b(ver|ata|olustur|ekle)|\b(gorev)\s+(ver|ata)/.test(f)) return kaTaskAct(text);
  if (/\bvardiya\b.*\b(hazirla|planla|olustur|dagit|doldur|cikar)/.test(f)) return kaShiftAct();
  if (/^yarin\b.*(nasil|yogun|durum|hazirlik|ozet)/.test(f) || /^yarin[?. ]*$/.test(f)) return kaTomorrow();
  if (/^(bugun|bugun ne yapmaliyim|bugun neye dikkat etmeliyim|durum|ozet|gunaydin|merhaba kais|neye dikkat etmeliyim|ne yapmaliyim)[?!. ]*$/.test(f)) return kaToday();
  if (/(kritik|azalan|biten|bitecek).*(stok|urun)|stok.*(kritik|azal|biten)/.test(f) && f.length < 70) return kaCritical();
  if (/(tedarikci|fiyat).*(karsilastir|kiyasla|ucuz)|(karsilastir|kiyasla).*(tedarikci|fiyat)/.test(f)) return kaCompare();
  return null;
}
{
  const _ask = aiAsk;
  aiAsk = async function (text) {
    const r = AIC.files && AIC.files.length ? null : kaIntent(text);
    if (!r) return _ask(text);
    AIC.err = ''; AIC.mode = null; AIC.msgs.push({ role: 'user', content: text }); AIC.msgs.push({ role: 'assistant', content: r.content, acts: r.acts || [], local: true, src: r.src || 'Stok, satış, vardiya ve rezervasyon kayıtların' });
    try { aiMemSave(); } catch (e) {} render(); const el = document.getElementById('ai-end'); if (el && el.scrollIntoView) el.scrollIntoView();
  };
}
{
  const _c = aiActCard;
  aiActCard = function (a, i, j) {
    if (a.type === 'gorev_ver' && a.st === 'open') {
      const g = a.args; const id = (k) => `aa-${i}-${j}-${k}`; const us = USERS.filter((u) => u.id !== S.user.id);
      return `<div class="card stack kc-act"><div class="kc-h"><span>${ic('check', 16)}</span><div><b>Görev</b><div class="small muted">Verilince çalışana bildirim gider</div></div></div>
      <div class="field"><label for="${id('t')}">Ne yapılacak?</label><input id="${id('t')}" type="text" value="${esc(g.t)}"></div>
      <div class="row wrap"><div class="field grow"><label for="${id('u')}">Kime</label><select id="${id('u')}"><option value="all"${g.uid === 'all' ? ' selected' : ''}>Herkes</option>${us.map((u) => `<option value="${u.id}"${g.uid === u.id ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="field grow"><label for="${id('d')}">Son gün</label><input id="${id('d')}" type="date" min="${REF_ISO}" value="${esc(g.due)}"></div></div>
      <div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Görevi ver</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
    }
    if (a.type === 'vardiya_taslak' && a.st === 'open') {
      const g = a.args; return `<div class="card stack kc-act"><div class="kc-h"><span>${ic('users', 16)}</span><div><b>Vardiya taslağı</b><div class="small muted">${g.m + 1}. ay · ${EMP_IDS.length} kişi · ${VD_T.length} şablon</div></div></div>
      <p class="small muted" style="margin:0">Taslak yayınlanmaz. Ekip, Vardiya sayfasında düzeltip yayınlarsın.</p>
      <div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Taslağı hazırla</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
    }
    if (a.type === 'gorev_ver' || a.type === 'vardiya_taslak') return a.st === 'done' ? `<div class="callout info">${ic('info')}<div>${esc(a.msg || 'Tamamlandı.')}</div></div>` : '<div class="small muted">Vazgeçildi.</div>';
    return _c(a, i, j);
  };
}
{
  const _a = H.aiact;
  H.aiact = async function (el) {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (!a || a.st !== 'open') return;
    const done = (m) => { a.st = 'done'; a.msg = m; try { aiMemSave(); } catch (e) {} render(); };
    if (a.type === 'siparis_olustur' && S.user.role === 'mudur' && !kpCan('saOrder')) return kpDeny();
    if (a.type === 'stok_guncelle' && S.user.role === 'mudur' && !kpCan('stokEdit')) return kpDeny();
    if (a.type === 'gorev_ver') {
      if (!kaMgr() || !kpCan('opsView')) return kpDeny();
      const g = (k) => ((document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-${k}`) || {}).value || '').trim(); const t = g('t');
      if (t.length < 3) { toast('Görevi yaz.', 'warn'); return; }
      const uid = g('u') || 'all'; let due = g('d') || REF_ISO; if (due < REF_ISO) due = REF_ISO;
      TASKS.unshift({ id: 'tk' + (++seq), t, uid, by: S.user.id, due, pri: 'normal', st: 'acik', at: nowT() }); if (TASKS.length > 500) TASKS.length = 500; pSched();
      try { pushSend(uid === 'all' ? EMP_IDS : [uid], 'Yeni görev', t + (due === REF_ISO ? ' (bugün)' : ' · ' + isoShort(due))); } catch (e) {}
      try { auditAdd({ type: 'kais', text: 'Kais görev verdi: ' + t }); } catch (e) {}
      done('Görev verildi: ' + t + ' (' + (uid === 'all' ? 'herkes' : opN(uid).split(' ')[0]) + ').'); toast('Görev verildi.', 'ok'); return;
    }
    if (a.type === 'vardiya_taslak') {
      if (!S.user || S.user.role !== 'patron') return kpDeny();
      const ym = a.args.y + '-' + String(a.args.m + 1).padStart(2, '0'); if (Object.keys(VD_F).some((d) => d.startsWith(ym))) { done('Bu ay için plan zaten vardı, dokunmadım.'); return; }
      vdAuto(a.args.y, a.args.m); pSched(); try { auditAdd({ type: 'kais', text: 'Kais vardiya taslağı hazırladı: ' + ym }); } catch (e) {}
      done('Vardiya taslağı hazır. Ekip, Vardiya sayfasından gözden geçirip yayınla.'); toast('Taslak hazır.', 'ok'); return;
    }
    return _a.call(this, el);
  };
}
{
  const _v = viewKaisAI;
  viewKaisAI = function () {
    let h = _v(); if (!kaMgr()) return h;
    const P = S.user.role === 'patron'; const ch = [['box', 'Kritik ürünlere sipariş hazırla'], ['calendar', 'Yarın nasıl görünüyor?'], ['sparkle', 'Bugün ne yapmalıyım?'], ['trend', 'Tedarikçi fiyatlarını kıyasla'], ['bars', 'Bu hafta nasıl geçti?']].concat(P ? [['users', 'Vardiya planını hazırla']] : []).concat([['check', 'Görev ver: ']]);
    const row = `<div class="kc-wrap"><div class="kc-lab">${ic('sparkle', 14)} Hızlı komutlar <em>anında yanıtlar, işlemi sen onaylarsın</em></div><div class="kc-row">${ch.map((c) => c[1].endsWith(': ') ? `<button type="button" class="kc-p" data-a="kafill" data-q="${esc(c[1])}">${ic(c[0], 14)}${esc(c[1].trim().replace(/:$/, ''))}</button>` : `<button type="button" class="kc-p" data-a="aiq" data-q="${esc(c[1])}">${ic(c[0], 14)}${esc(c[1])}</button>`).join('')}</div></div>`;
    const m = '<div class="kx-sec"><div class="kx-lab"><b>Sorun</b>'; const i = h.indexOf(m); return i < 0 ? h : h.slice(0, i) + row + h.slice(i);
  };
}
H.kafill = (el) => { const t = document.getElementById('ai-q'); if (t) { t.value = el.dataset.q; AIC.draft = t.value; t.focus(); try { t.setSelectionRange(t.value.length, t.value.length); } catch (e) {} } };

/* ===== v95: Hesabı sil (mağaza şartı) ve sunucu denetim kaydı ===== */
const DEL = { busy: false, err: '' };
const delCloud = () => !!(SBS.user && SBS.biz && sbOK());
const delOwner = () => { try { const a = ID.active; return !!(a && a.businesses && SBS.user && a.businesses.owner_id === SBS.user.id) || (!!SBS.biz && !!SBS.user && SBS.biz.owner_id === SBS.user.id); } catch (e) { return false; } };
H.delopen = () => { DEL.busy = false; DEL.err = ''; S.modal = { type: 'delacc' }; renderModal(); };
NEWM.delacc = () => {
  const cloud = delCloud(); const own = cloud && delOwner();
  const li = (t) => `<li>${esc(t)}</li>`;
  const gone = cloud ? ['Giriş hesabın ve şifren', 'Bildirim kayıtların ve cihaz bağlantıların', 'Yüklediğin belgeler ve imzaladığın sözleşme formu', 'Kais ile olan notların'].concat(own ? ['İşletmedeki tüm ekip, stok, satış, muhasebe ve rezervasyon verisi', 'Çalışanların ve müdürün erişimi'] : []) : ['Bu cihazdaki tüm KaisPilot verileri'];
  return sheet(own ? 'İşletmeyi ve hesabı sil' : 'Hesabımı sil', `<div class="dl-w">${ic('alert', 22)}<div><b>Bu işlem geri alınamaz.</b><p>${cloud ? (own ? 'İşletmen ve hesabın kalıcı olarak silinir.' : 'Hesabın kalıcı olarak silinir. İşletme verisine dokunulmaz.') : 'Bulut hesabı bağlı değil; yalnızca bu cihazdaki veriler silinir.'}</p></div></div>
  <div class="dl-b"><b>Silinecekler</b><ul>${gone.map(li).join('')}</ul></div>
  ${own ? '<div class="dl-b soft"><b>Saklanacaklar</b><ul><li>Tedarikçilerle ortak ticari kayıtlar (sipariş, cari) yasal saklama süresi boyunca, adın ve işletme bilgin olmadan tutulur.</li></ul><p class="small muted" style="margin:6px 0 0">Silmeden önce muhasebe paketini indirmek istersen Muhasebe, Aylık paket sayfasını kullan.</p></div>' : ''}
  <div class="field"><label for="del-c">Onaylamak için <b>SİL</b> yaz</label><input id="del-c" type="text" autocomplete="off" autocapitalize="characters" placeholder="SİL"></div>
  <div class="err" id="del-e" role="alert">${esc(DEL.err)}</div>
  <button class="btn block dl-go" id="del-go" data-a="delgo" disabled>${DEL.busy ? 'Siliniyor…' : own ? 'İşletmeyi ve hesabı kalıcı olarak sil' : 'Hesabımı kalıcı olarak sil'}</button>
  <button class="btn sec block" data-a="closemodal">Vazgeç</button>`);
};
document.addEventListener('input', (e) => { const el = e.target; if (!el || el.id !== 'del-c') return; const b = document.getElementById('del-go'); if (b) b.disabled = DEL.busy || kaFold(el.value) !== 'sil'; });
const delMsg = (e) => { const m = String((e && e.message) || e || ''); return /owner_required|delete_blocked/.test(m) ? 'Hesap şu an silinemedi. Bağlı kayıtlar var; destek ile iletişime geç.' : /delete_my_account|schema cache|does not exist/i.test(m) ? 'Hesap silme sunucuda kurulu değil. tenant_account.sql dosyasını çalıştır.' : /not_signed_in/.test(m) ? 'Oturum süresi dolmuş. Tekrar giriş yapıp dene.' : 'Silinemedi. Bağlantını kontrol edip tekrar dene.'; };
function delLocal() { try { Object.keys(localStorage).filter((k) => /^kp/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} try { sessionStorage.clear(); } catch (e) {} }
H.delgo = async () => {
  const el = document.getElementById('del-c'); if (DEL.busy || !el || kaFold(el.value) !== 'sil') return;
  DEL.busy = true; DEL.err = ''; renderModal(); const bt = document.getElementById('del-go'); if (bt) bt.disabled = true;
  try {
    if (delCloud()) {
      try { clearTimeout(PS.timer); } catch (e) {}
      const r = await sbClient().rpc('delete_my_account'); if (r.error) throw r.error;
      try { cloudOff(); } catch (e) {} try { await sbClient().auth.signOut(); } catch (e) {}
    }
    delLocal(); try { wipeData(); } catch (e) {}
    SBS.user = null; SBS.biz = null; SBS.sups = []; try { ID.mems = []; ID.active = null; ID.team = null; ID.pref = null; } catch (e) {}
    S.user = null; S.modal = null; DEL.busy = false;
    if (typeof location !== 'undefined' && location.reload && !global_noreload()) location.reload(); else render();
  } catch (e) { DEL.busy = false; DEL.err = delMsg(e); renderModal(); const i = document.getElementById('del-c'); if (i) { i.value = 'SİL'; const b = document.getElementById('del-go'); if (b) b.disabled = false; } }
};
{
  const _rm = renderModal;
  renderModal = function () {
    _rm.apply(this, arguments); const m = S.modal; const root = $('#modal-root'); if (!root || !m || m.type !== 'menu') return;
    if (root.querySelector('[data-a="delopen"]')) return; const b = '<button class="dl-link" data-a="delopen">Hesabımı sil</button>';
    const p = root.querySelector('.sheet p.small.muted'); if (p) p.insertAdjacentHTML('beforebegin', b); else { const s = root.querySelector('.sheet'); if (s) s.insertAdjacentHTML('beforeend', b); }
  };
}

/* --- sunucu denetim kaydı --- */
const SLG = { q: [], t: null, off: false };
function slog(action, detail) {
  if (SLG.off || !SBS.user || !SBS.biz || !S.user) return;
  SLG.q.push({ business_id: SBS.biz.id, role: S.user.role, action: String(action).slice(0, 80), detail: detail || {} }); if (SLG.q.length > 100) SLG.q.shift();
  clearTimeout(SLG.t); SLG.t = setTimeout(slogFlush, 3000);
}
async function slogFlush() {
  const c = sbOK() && sbClient(); if (!c || !SLG.q.length) return; const rows = SLG.q.splice(0, 50);
  try { const r = await c.from('audit_log').insert(rows); if (r.error) { if (/relation|schema cache|permission|violates/i.test(r.error.message)) SLG.off = true; } else AUD.loaded = false; } catch (e) {}
}
{ const _au = auditAdd; auditAdd = function (e) { const r = _au.apply(this, arguments); try { if (e && e.type && e.type !== 'cell') slog(e.type, { text: String(e.text || '').slice(0, 200) }); } catch (x) {} return r; }; }
{ const _p = H.perm; H.perm = function (el) { const before = JSON.stringify(S.settings.perm || {}); const r = _p.apply(this, arguments); if (JSON.stringify(S.settings.perm || {}) !== before) slog('yetki', { text: 'Müdür yetkisi değişti: ' + el.dataset.k }); return r; }; }
{ const _p = H.permpre; H.permpre = function (el) { const r = _p.apply(this, arguments); slog('yetki', { text: 'Müdür yetki şablonu: ' + el.dataset.v }); return r; }; }
{ const _p = H.invmake; if (_p) H.invmake = async function (el) { const r = await _p.apply(this, arguments); try { if (S.modal && S.modal.type === 'invcode') { const u = byId(el.dataset.id); slog('davet', { text: 'Davet kodu üretildi: ' + (u ? u.name : '') }); } } catch (e) {} return r; }; }
{ const _p = H.memrm; if (_p) H.memrm = async function (el) { const armed = S.rmArm === el.dataset.id; const r = await _p.apply(this, arguments); if (armed) slog('uye', { text: 'Bir üyenin erişimi kapatıldı' }); return r; }; }

const AUD = { rows: [], busy: false, err: '', loaded: false, f: 'all' };
const AUD_L = { uye_katildi: ['Üye katıldı', 'uye'], uye: ['Erişim', 'uye'], davet: ['Davet', 'uye'], yetki: ['Yetki', 'yetki'], kais: ['Kais', 'kais'], ord: ['Sipariş', 'ord'] };
async function audLoad() {
  if (AUD.busy || !delCloud()) return; AUD.busy = true; AUD.err = '';
  try { const r = await sbClient().from('audit_log').select('id,role,action,detail,created_at').eq('business_id', SBS.biz.id).order('created_at', { ascending: false }).limit(120); if (r.error) throw r.error; AUD.rows = r.data || []; AUD.loaded = true; }
  catch (e) { AUD.err = /relation|schema cache|permission/i.test(String((e && e.message) || e)) ? 'Denetim kaydı sunucuda kurulu değil (tenant_hardening.sql).' : 'Kayıtlar yüklenemedi.'; AUD.loaded = true; }
  AUD.busy = false; if (S.view === 'ayarlar') render();
}
function audCard() {
  if (!delCloud()) return '';
  const fl = [['all', 'Tümü'], ['kais', 'Kais'], ['ord', 'Sipariş'], ['uye', 'Üye ve davet'], ['yetki', 'Yetki']];
  const rows = AUD.rows.filter((r) => AUD.f === 'all' || (AUD_L[r.action] || ['', 'x'])[1] === AUD.f);
  const when = (iso) => { const d = new Date(iso); return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
  const txt = (r) => (r.detail && r.detail.text) || (r.action === 'uye_katildi' ? (r.detail && r.detail.ad ? r.detail.ad + ' işletmeye katıldı' : 'Yeni üye katıldı') : r.action);
  return `<div class="card au-card"><div class="row between wrap"><div><h3>Denetim kaydı</h3><p class="muted small" style="margin-top:2px">Kim, ne zaman, neyi değiştirdi. Yalnızca patron görür, kimse silemez.</p></div><button class="btn sm sec" data-a="audref">${AUD.busy ? 'Yükleniyor…' : 'Yenile'}</button></div>
  <div class="kp-pre">${fl.map((x) => `<button type="button" data-a="audf" data-v="${x[0]}" aria-pressed="${AUD.f === x[0]}">${x[1]}</button>`).join('')}</div>
  ${AUD.err ? `<div class="callout warn">${ic('alert')}<div>${esc(AUD.err)}</div></div>` : ''}
  <div class="au-l">${rows.length ? rows.map((r) => `<div class="au-r"><span class="au-t">${esc(when(r.created_at))}</span><div class="grow"><b>${esc(txt(r))}</b><small>${esc((AUD_L[r.action] || [r.action])[0])} · ${esc(({ patron: 'Patron', mudur: 'Müdür', muhasebeci: 'Muhasebeci', calisan: 'Çalışan' })[r.role] || r.role || '')}</small></div></div>`).join('') : `<p class="muted small" style="margin:8px 0 0">${AUD.busy ? '' : AUD.loaded ? 'Henüz kayıt yok.' : ''}</p>`}</div></div>`;
}
H.audref = () => { AUD.loaded = false; audLoad(); render(); };
H.audf = (el) => { AUD.f = el.dataset.v; render(); };
{
  const _v = viewHTML;
  viewHTML = function () {
    let h = _v(); const u = S.user; if (!u || u.role !== 'patron' || S.view !== 'ayarlar' || h.includes('au-card')) return h;
    if (!AUD.loaded && !AUD.busy && delCloud()) setTimeout(audLoad, 0);
    const danger = `<div class="card dl-card"><h3>Hesap ve veri</h3><p class="muted small" style="margin:2px 0 10px">Hesabını ve işletme verini kalıcı olarak silebilirsin.</p><button class="btn sec" data-a="delopen">${delCloud() && delOwner() ? 'İşletmeyi ve hesabı sil' : 'Hesabımı sil'}</button></div>`;
    const i = h.lastIndexOf('</div>'); return i < 0 ? h : h.slice(0, i) + audCard() + danger + h.slice(i);
  };
}

/* ===== v96: işletme devri ve Kais hafızasını sunucuya senkronlama ===== */
{
  const _tc = teamCard;
  teamCard = function () {
    let h = _tc(); if (!ID.team || !ID.active || ID.active.role !== 'patron') return h;
    ID.team.members.filter((m) => m.role === 'mudur').forEach((m) => { h = h.replace(`<button class="btn sm sec" data-a="memrm" data-id="${m.id}">`, `<button class="btn sm sec" data-a="trnopen" data-id="${m.id}">Sahipliği devret</button><button class="btn sm sec" data-a="memrm" data-id="${m.id}">`); });
    return h;
  };
}
const TRN = { busy: false, err: '' };
H.trnopen = (el) => { TRN.busy = false; TRN.err = ''; S.modal = { type: 'trn', id: el.dataset.id }; renderModal(); };
NEWM.trn = (m) => {
  const mem = ID.team && ID.team.members.find((x) => x.id === m.id); const u = mem && byId(mem.app_uid); const nm = (mem && mem.display_name) || (u && u.name) || 'Müdür';
  return sheet('Sahipliği devret', `<div class="dl-w">${ic('alert', 22)}<div><b>${esc(nm)} işletmenin sahibi olur.</b><p>Sen müdür olursun. Veri yerinde kalır. Bunu yalnızca yeni sahip geri alabilir.</p></div></div>
  <div class="dl-b"><b>Ne değişir</b><ul><li>${esc(nm)} patron yetkilerini alır (finans, ekip, davetler, hesap silme).</li><li>Sen müdür yetkilerine inersin.</li><li>Devirden sonra yeniden giriş yaparsın.</li></ul></div>
  <div class="field"><label for="trn-c">Onaylamak için <b>DEVRET</b> yaz</label><input id="trn-c" type="text" autocomplete="off" autocapitalize="characters" placeholder="DEVRET"></div>
  <div class="err" id="trn-e" role="alert">${esc(TRN.err)}</div>
  <button class="btn block dl-go" id="trn-go" data-a="trngo" data-id="${esc(m.id)}" disabled>${TRN.busy ? 'Devrediliyor…' : 'Sahipliği devret'}</button><button class="btn sec block" data-a="closemodal">Vazgeç</button>`);
};
document.addEventListener('input', (e) => { const el = e.target; if (!el || el.id !== 'trn-c') return; const b = document.getElementById('trn-go'); if (b) b.disabled = TRN.busy || kaFold(el.value) !== 'devret'; });
H.trngo = async (el) => {
  const c = document.getElementById('trn-c'); if (TRN.busy || !c || kaFold(c.value) !== 'devret' || !ID.active) return;
  TRN.busy = true; TRN.err = ''; const id = el.dataset.id; renderModal();
  try {
    try { clearTimeout(PS.timer); if (CL.on) await pFlush(); } catch (e) {}
    const r = await sbClient().rpc('transfer_business', { p_business: ID.active.business_id, p_member: id }); if (r.error) throw r.error;
    TRN.busy = false; S.modal = null; await idSignOut();
  } catch (e) { TRN.busy = false; const m = String((e && e.message) || e); TRN.err = /transfer_business|schema cache|does not exist/i.test(m) ? 'Devir sunucuda kurulu değil. tenant_transfer.sql dosyasını çalıştır.' : /not_owner/.test(m) ? 'Yalnızca işletme sahibi devredebilir.' : /target_must/.test(m) ? 'Devir yalnızca müdüre yapılabilir.' : 'Devredilemedi. Bağlantını kontrol et.'; renderModal(); }
};

{
  const _hh = hesapHTML;
  hesapHTML = function () {
    let h = _hh(); if (!ID.team || !ID.active || ID.active.role !== 'patron') return h;
    ID.team.members.filter((m) => m.role === 'mudur').forEach((m) => { h = h.replace(`<button class="hb sec" data-a="memrm" data-id="${m.id}">`, `<button class="hb sec" data-a="trnopen" data-id="${m.id}">Devret</button><button class="hb sec" data-a="memrm" data-id="${m.id}">`); });
    return h;
  };
}
/* Kais notları: cihazlar arası (kais_memory) */
const KM = { key: '', synced: '[]', t: null, off: false };
async function kmPull() {
  const c = sbOK() && sbClient(); if (!c || !SBS.user || !SBS.biz || KM.off) return; const k = aiMemKey(); if (KM.key === k) return; KM.key = k;
  try {
    const r = await c.from('kais_memory').select('content,created_at').eq('business_id', SBS.biz.id).eq('user_id', SBS.user.id).eq('kind', 'fact').order('created_at', { ascending: true }).limit(60);
    if (r.error) { if (/relation|schema cache|permission/i.test(r.error.message)) KM.off = true; return; }
    const srv = (r.data || []).map((x) => x.content); const loc = AIC.notes || []; const all = srv.concat(loc.filter((n) => !srv.includes(n))).slice(-30);
    KM.synced = JSON.stringify(srv); if (JSON.stringify(all) !== JSON.stringify(loc)) { AIC.notes = all; aiMemSave(); if (S.view === 'kaisai') render(); } else if (all.length !== srv.length) kmSched();
  } catch (e) {}
}
function kmSched() { clearTimeout(KM.t); KM.t = setTimeout(kmPush, 1500); }
async function kmPush() {
  const c = sbOK() && sbClient(); if (!c || !SBS.user || !SBS.biz || KM.off) return; const notes = (AIC.notes || []).slice(-30); const j = JSON.stringify(notes); if (j === KM.synced) return;
  try {
    const d = await c.from('kais_memory').delete().eq('business_id', SBS.biz.id).eq('user_id', SBS.user.id).eq('kind', 'fact'); if (d.error) throw d.error;
    if (notes.length) { const i = await c.from('kais_memory').insert(notes.map((n) => ({ business_id: SBS.biz.id, user_id: SBS.user.id, kind: 'fact', content: String(n).slice(0, 500) }))); if (i.error) throw i.error; }
    KM.synced = j;
  } catch (e) { if (/relation|schema cache|permission/i.test(String((e && e.message) || e))) KM.off = true; }
}
{
  const _ml = aiMemLoad; aiMemLoad = function () { const r = _ml.apply(this, arguments); kmPull(); return r; };
  const _ms = aiMemSave; aiMemSave = function () { const r = _ms.apply(this, arguments); if (KM.key === aiMemKey()) kmSched(); return r; };
  const _mc = H.aimemclr; if (_mc) H.aimemclr = function () { const r = _mc.apply(this, arguments); AIC.notes = []; kmSched(); return r; };
}

/* v97: alt menü etiketi sığsın */
NAV.mudur.forEach((x) => { if (x[0] === 'rezerv') x[1] = 'Rezerv.'; });

/* ===== v98: fiş ve fatura anında deftere yazılır (gider ya da gelir), tam tarih, Excel durumu ===== */
const _fiso = (s) => {
  s = String(s || '').trim(); let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s))) return m[0];
  if ((m = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(s))) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  if ((m = /^(\d{1,2})\s+(\S+)$/.exec(s))) {
    const k = MON.findIndex((x) => x.toLocaleLowerCase('tr') === m[2].toLocaleLowerCase('tr')); if (k < 0) return '';
    const ry = Number(REF_ISO.slice(0, 4)); let y = ry; const cand = y + '-' + String(k + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0');
    if (dayDiff(REF_ISO, cand) > 31) y = ry - 1; return y + '-' + String(k + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0');
  }
  return '';
};
const _fvalid = (iso) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false; const d = new Date(iso + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === iso; };
const _fdmy = (iso) => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4);
function ledSync() {
  let ch = false;
  RECEIPTS.forEach((f) => {
    if (!f.iso) return; const rows = LEDGER.filter((r) => r.rc === f.id);
    const live = f.status === 'musavirde' || f.status === 'onayli';
    if (live) {
      let r = rows.find((x) => x.lg) || null; rows.filter((x) => x !== r).forEach((x) => { LEDGER.splice(LEDGER.indexOf(x), 1); ch = true; });
      if (!r && f.lg) { r = null; if (!rows.length) return; }
      if (!r) { r = { id: 'g' + ++seq, lg: true }; LEDGER.push(r); f.lg = true; ch = true; }
      const pend = f.status === 'musavirde'; const want = { dir: f.dir || 'gider', date: f.date, iso: f.iso, desc: f.seller, acc: f.cat, doc: docType(f), rate: Number(f.rate), total: Number(f.total), src: 'Kais', rc: f.id, pend };
      if (!r.edited) Object.keys(want).forEach((k) => { if (r[k] !== want[k]) { r[k] = want[k]; ch = true; } }); else if (r.pend !== pend) { r.pend = pend; ch = true; }
    } else if (rows.length) { rows.filter((x) => x.pend || x.lg).forEach((x) => { LEDGER.splice(LEDGER.indexOf(x), 1); ch = true; }); f.lg = false; }
  });
  if (ch) { try { pSched(); } catch (e) {} }
  return ch;
}
{ const _r = render; render = function () { try { ledSync(); } catch (e) {} return _r.apply(this, arguments); }; }

/* Excel: tam tarih ve dönem, durum sütunu */
ledgerSheet = function (kind) {
  const rows = [['Dönem', 'Tarih', 'Açıklama', 'Hesap', 'Belge', 'KDV %', 'KDV', 'Toplam', 'Kaynak', 'Durum']];
  const list = LEDGER.filter((r) => dirOf(r) === kind);
  list.forEach((r, i) => {
    const n = i + 2; const per = r.iso && _fvalid(r.iso) ? MONTH_LONG[Number(r.iso.slice(5, 7)) - 1] + ' ' + r.iso.slice(0, 4) : lper(r); const dt = r.iso && _fvalid(r.iso) ? _fdmy(r.iso) : rDateY(r);
    rows.push([per, dt, String(r.desc), String(r.acc), String(r.doc || ''), Number(r.rate), { f: 'H' + n + '-H' + n + '/(1+F' + n + '/100)', v: r2(kdv(r)) }, { n: Number(r.total) }, r.edited ? 'Düzenlendi' : String(r.src || ''), r.pend ? 'Muhasebeci teyidi bekliyor' : 'Teyitli']);
  });
  const e = list.length + 1;
  rows.push(['', '', '', '', '', { b: 'Toplam' }].concat(list.length ? [{ bf: 'SUM(G2:G' + e + ')', v: r2(list.reduce((a, r) => a + kdv(r), 0)) }, { bf: 'SUM(H2:H' + e + ')', v: r2(list.reduce((a, r) => a + Number(r.total), 0)) }] : [{ n: 0 }, { n: 0 }]));
  return rows;
};

/* okuma sonucu: tür (gider/gelir), tam tarih */
const _rm98 = renderModal;
renderModal = function () {
  _rm98.apply(this, arguments); const m = S.modal; const root = $('#modal-root'); if (!m || !root || typeof root.innerHTML !== 'string') return;
  if (m.type === 'upload' && m.step === 'result' && m.sample) {
    const dir = m.sample.dir || 'gider'; let h = root.innerHTML; if (h.includes('data-a="ocdir"')) return;
    const seg = `<dt>Tür</dt><dd><div class="oc-dir" role="group" aria-label="Tür"><button type="button" data-a="ocdir" data-v="gider" aria-pressed="${dir === 'gider'}">Gider</button><button type="button" data-a="ocdir" data-v="gelir" aria-pressed="${dir === 'gelir'}">Gelir</button></div></dd>`;
    const k = h.indexOf('<dt><label for="mcat">'); if (k < 0) return; h = h.slice(0, k) + seg + h.slice(k);
    if (dir === 'gelir') h = h.replace(/(<select id="mcat"[^>]*>)[\s\S]*?(<\/select>)/, (mm, a, b) => a + INCATS.map((c) => `<option ${c === m.cat ? 'selected' : ''}>${esc(c)}</option>`).join('') + b);
    h = h.replace('Kaydedince fiş muhasebeciye anında bildirim olarak gider. Gider, muhasebeci onaylayınca tabloya yazılır.', 'Kaydedince hemen Gider ya da Gelir tablosuna ve Excel\'e yazılır. Muhasebeci teyit eder, hata görürse düzeltme ister.');
    if (m.sample.dateGuess) h = h.replace('<dt><label for="oc-date">Tarih</label></dt>', '<dt><label for="oc-date">Tarih (okunamadı, kontrol et)</label></dt>');
    root.innerHTML = h;
  }
  if (m.type === 'rev') { const f = RECEIPTS.find((x) => x.id === m.id); if (f && f.dir === 'gelir') root.innerHTML = root.innerHTML.replace(/(<select[^>]*data-ch="rcat"[^>]*>)[\s\S]*?(<\/select>)/, (mm, a, b) => a + INCATS.map((c) => `<option ${c === m.cat ? 'selected' : ''}>${esc(c)}</option>`).join('') + b); }
};
H.ocdir = (el) => { const m = S.modal; if (!m || !m.sample) return; const d = el.dataset.v === 'gelir' ? 'gelir' : 'gider'; if ((m.sample.dir || 'gider') === d) return; m.sample.dir = d; m.cat = d === 'gelir' ? INCATS[0] : 'Diğer'; renderModal(); };
{
  const _sv = H.savereceipt;
  H.savereceipt = function () {
    const m = S.modal; const s = m && m.sample; const n0 = RECEIPTS.length; const dir = (s && s.dir) || 'gider'; const typed = (document.getElementById('oc-date') || {}).value;
    let iso = s && s.iso && !typed ? s.iso : _fiso(typed || (s && s.date)) || (s && s.iso) || '';
    if (s && !_fvalid(iso)) { toast('Tarihi GG.AA.YYYY olarak yaz (örnek 14.11.2026).', 'warn'); return; }
    if (s && Number(s.total) > 0 && !(Number(s.total) < 1e8)) { toast('Toplam tutarı kontrol et.', 'warn'); return; }
    const r = _sv.apply(this, arguments);
    if (RECEIPTS.length > n0) { const f = RECEIPTS[RECEIPTS.length - 1]; f.iso = iso || f.iso || _fiso(f.date); f.dir = dir; if (f.iso) { f.date = f.date; } try { ledSync(); render(); } catch (e) {} }
    return r;
  };
}
{
  const _ai = H.aiact;
  H.aiact = async function (el) {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; const isInv = a && a.st === 'open' && !['excel_indir', 'siparis_olustur', 'stok_guncelle', 'gorev_ver', 'vardiya_taslak', 'duyuru_gonder', 'rezervasyon_ekle', 'rezervasyon_durum', 'izin_karar', 'sozlesme_olustur', 'hafiza_kaydet'].includes(a.type);
    const n0 = RECEIPTS.length; const gv = (k) => (document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-${k}`) || {}).value;
    const iso = isInv ? _fiso(gv('d')) : ''; const dir = isInv && gv('k') === 'gelir' ? 'gelir' : 'gider';
    if (isInv && iso && !_fvalid(iso)) { toast('Tarih geçersiz.', 'warn'); return; }
    const r = await _ai.call(this, el);
    if (isInv && RECEIPTS.length > n0) { const f = RECEIPTS[RECEIPTS.length - 1]; f.iso = iso; f.dir = dir; if (dir === 'gelir' && !INCATS.includes(f.cat)) f.cat = INCATS[0]; try { ledSync(); render(); } catch (e) {} }
    return r;
  };
}
{
  const _c = aiActCard;
  aiActCard = function (a, i, j) {
    const h = _c(a, i, j); if (a.st !== 'open' || h.indexOf('Gider kaydı önerisi') < 0) return h;
    const id = `aa-${i}-${j}-k`;
    return h.replace('Gider kaydı önerisi', 'Gider ya da gelir kaydı').replace('<div class="row wrap"><div class="field grow"><label for="aa-' + i + '-' + j + '-r">', `<div class="field"><label for="${id}">Tür</label><select id="${id}"><option value="gider" selected>Gider (aldığım fatura)</option><option value="gelir">Gelir (kestiğim fatura)</option></select></div><div class="row wrap"><div class="field grow"><label for="aa-${i}-${j}-r">`);
  };
}

/* ===== v99: tek faturada iki KDV oranı (karışık KDV) ===== */
const _p2 = (f) => (f && f.p2 && Number(f.p2.total) > 0 && Number(f.p2.total) < Number(f.total) ? { total: r2(Number(f.p2.total)), rate: Number(f.p2.rate) } : null);
ledSync = function () {
  let ch = false;
  RECEIPTS.forEach((f) => {
    if (!f.iso) return; const rows = LEDGER.filter((r) => r.rc === f.id); const live = f.status === 'musavirde' || f.status === 'onayli';
    if (!live) { if (rows.length) { rows.filter((x) => x.pend || x.lg).forEach((x) => { LEDGER.splice(LEDGER.indexOf(x), 1); ch = true; }); f.lg = false; } return; }
    const p2 = _p2(f); const parts = [{ k: 1, total: p2 ? r2(Number(f.total) - p2.total) : Number(f.total), rate: Number(f.rate) }]; if (p2) parts.push({ k: 2, total: p2.total, rate: p2.rate });
    const had = rows.some((x) => x.lg); if (!had && f.lg && rows.length) return;
    rows.filter((x) => !x.lg || !parts.some((p) => p.k === (x.k || 1))).forEach((x) => { const i = LEDGER.indexOf(x); if (i >= 0) { LEDGER.splice(i, 1); ch = true; } });
    const pend = f.status === 'musavirde';
    parts.forEach((pt) => {
      let r = LEDGER.find((x) => x.rc === f.id && x.lg && (x.k || 1) === pt.k); if (!r) { r = { id: 'g' + ++seq, lg: true }; LEDGER.push(r); f.lg = true; ch = true; }
      const want = { dir: f.dir || 'gider', date: f.date, iso: f.iso, desc: f.seller + (p2 ? ' (%' + pt.rate + ' KDV kısmı)' : ''), acc: f.cat, doc: docType(f), rate: pt.rate, total: pt.total, src: 'Kais', rc: f.id, k: pt.k, pend };
      if (!r.edited) Object.keys(want).forEach((k) => { if (r[k] !== want[k]) { r[k] = want[k]; ch = true; } }); else if (r.pend !== pend) { r.pend = pend; ch = true; }
    });
  });
  if (ch) { try { pSched(); } catch (e) {} }
  return ch;
};
{
  const _rm = renderModal;
  renderModal = function () {
    _rm.apply(this, arguments); const m = S.modal; const root = $('#modal-root'); if (!m || !root || typeof root.innerHTML !== 'string' || m.type !== 'upload' || m.step !== 'result' || !m.sample) return;
    let h = root.innerHTML; if (h.includes('id="oc-p2t"')) return; const k = h.indexOf('<dt>Tür</dt>'); if (k < 0) return; const s = m.sample;
    const add = `<dt><label for="oc-p2t">Farklı KDV'li kısım (varsa)</label></dt><dd><div class="oc-p2"><input type="text" inputmode="decimal" id="oc-p2t" placeholder="Tutar" value="${esc(s.p2t || '')}" data-ch="ocp2" data-k="p2t"><select id="oc-p2r" data-ch="ocp2" data-k="p2r" aria-label="Kısmın KDV oranı">${[0, 1, 10, 20].map((x) => `<option value="${x}" ${Number(s.p2r == null ? 20 : s.p2r) === x ? 'selected' : ''}>%${x}</option>`).join('')}</select></div></dd>`;
    root.innerHTML = h.slice(0, k) + add + h.slice(k);
  };
}
document.addEventListener('input', (e) => { const el = e.target; if (el && el.dataset && el.dataset.ch === 'ocp2' && S.modal && S.modal.sample) S.modal.sample[el.dataset.k] = el.value; });
document.addEventListener('change', (e) => { const el = e.target; if (el && el.dataset && el.dataset.ch === 'ocp2' && S.modal && S.modal.sample) S.modal.sample[el.dataset.k] = el.value; });
{
  const _sv = H.savereceipt;
  H.savereceipt = function () {
    const m = S.modal; const s = m && m.sample; let p2 = null;
    if (s) {
      const t = trNum((document.getElementById('oc-p2t') || {}).value); const rr = Number((document.getElementById('oc-p2r') || {}).value);
      const raw = String((document.getElementById('oc-p2t') || {}).value || '').trim();
      if (raw) { const gt = trNum((document.getElementById('oc-total') || {}).value) || Number(s.total); if (!(t > 0) || !(t < gt)) { toast('Farklı KDV\'li kısım, toplamdan küçük olmalı.', 'warn'); return; } p2 = { total: t, rate: [0, 1, 10, 20].includes(rr) ? rr : 20 }; }
    }
    const n0 = RECEIPTS.length; const r = _sv.apply(this, arguments);
    if (p2 && RECEIPTS.length > n0) { const f = RECEIPTS[RECEIPTS.length - 1]; if (p2.total < Number(f.total)) { f.p2 = p2; try { ledSync(); render(); } catch (e) {} } }
    return r;
  };
}
{
  const _c = aiActCard;
  aiActCard = function (a, i, j) {
    const h = _c(a, i, j); if (a.st !== 'open' || h.indexOf('Gider ya da gelir kaydı') < 0 || h.includes(`aa-${i}-${j}-p`)) return h;
    const add = `<div class="row wrap"><div class="field grow"><label for="aa-${i}-${j}-p">Farklı KDV'li kısım (isteğe bağlı)</label><input id="aa-${i}-${j}-p" type="text" inputmode="decimal" placeholder="Tutar"></div><div class="field grow"><label for="aa-${i}-${j}-q">Kısmın KDV %</label><select id="aa-${i}-${j}-q">${[0, 1, 10, 20].map((x) => `<option value="${x}" ${x === 20 ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>`;
    const k = h.indexOf('<div class="row wrap"><button class="btn sm" data-a="aiact"'); return k < 0 ? h : h.slice(0, k) + add + h.slice(k);
  };
}
{
  const _ai = H.aiact;
  H.aiact = async function (el) {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; const g = (k) => (document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-${k}`) || {}).value;
    let p2 = null; const open = a && a.st === 'open' && document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-p`);
    if (open) { const raw = String(g('p') || '').trim(); if (raw) { const t = trNum(raw); const gt = trNum(g('t')); if (!(t > 0) || !(t < gt)) { toast('Farklı KDV\'li kısım, toplamdan küçük olmalı.', 'warn'); return; } p2 = { total: t, rate: Number(g('q')) }; } }
    const n0 = RECEIPTS.length; const r = await _ai.call(this, el);
    if (p2 && RECEIPTS.length > n0) { const f = RECEIPTS[RECEIPTS.length - 1]; f.p2 = p2; try { ledSync(); render(); } catch (e) {} }
    return r;
  };
}

/* ===== v101: yeni işletme karşılama (ilk kurulum) ===== */
function suSteps() {
  const t = ID.team; const team = !!(t && ((t.members || []).length > 1 || (t.invites || []).length > 0));
  return [
    { k: 'prof', ico: 'gear', t: 'İşletme bilgilerini tamamla', s: 'Tür, vergi no, şehir. Kais\'in önerileri buna göre şekillenir.', done: !!PROF.tur, a: 'pfopen' },
    { k: 'team', ico: 'users', t: 'Ekibini davet et', s: 'Müdür, muhasebeci ve çalışanlar kendi hesabıyla girer.', done: team, a: 'nav', v: 'ekip', sub: 'hesap' },
    { k: 'stok', ico: 'box', t: 'İlk stok ürünlerini ekle', s: 'Kais azalanları takip eder, sipariş önerir.', done: STOCK.length > 0, a: 'nav', v: 'stok' },
    { k: 'sup', ico: 'tag', t: 'Tedarikçini ekle', s: 'Siparişler ve fiyat kıyası buradan yapılır.', done: SUPPLIERS.length > 0, a: 'nav', v: 'satinalma' },
    { k: 'vd', ico: 'calendar', t: 'Vardiya şablonu oluştur', s: 'Kais planı senin yerine dağıtır.', done: VD_T.length > 0, a: 'nav', v: 'ekip', sub: 'vardiya' },
    { k: 'fis', ico: 'receipt', t: 'İlk fişi ya da faturayı yükle', s: 'Gider ve Excel kaydı otomatik oluşur.', done: RECEIPTS.length > 0 || LEDGER.length > 0, a: 'nav', v: 'muhasebe' },
  ];
}
const suFresh = () => !STOCK.length && !SUPPLIERS.length && !RECEIPTS.length && !LEDGER.length && !SALES.length;
function suPage() {
  const st = suSteps(); const n = st.filter((x) => x.done).length; const nx = st.findIndex((x) => !x.done); const nm = ((S.user && S.user.name) || '').split(' ')[0];
  return `<div class="stack-lg su"><div class="su-h"><span class="su-b">${ic('sparkle', 16)} İlk kurulum</span><h2>Hoş geldin${nm ? ', ' + esc(nm) : ''}</h2><p>${esc(BIZ)} için ${st.length} kısa adım. İstediğin sırayla yap, Kais her adımda yardım eder.</p>
  <div class="su-p" role="progressbar" aria-valuenow="${n}" aria-valuemax="${st.length}"><i style="width:${Math.round(n / st.length * 100)}%"></i></div><small>${n} / ${st.length} tamam</small></div>
  <div class="su-l">${st.map((x, i) => `<button type="button" class="su-s ${x.done ? 'ok' : i === nx ? 'now' : ''}" data-a="${x.a}"${x.v ? ` data-v="${x.v}"` : ''}${x.sub ? ` data-s="${x.sub}"` : ''}><span class="su-i">${x.done ? ic('check', 18) : ic(x.ico, 18)}</span><span class="su-t"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>${x.done ? '<em>Tamam</em>' : ic('chevron', 18)}</button>`).join('')}</div>
  <div class="su-f"><button type="button" class="btn sec block" data-a="kaisai-go" data-v="kaisai">${ic('sparkle', 16)} Kais'e sor</button><button type="button" class="su-lk" data-a="suhide">Sonra yaparım</button></div></div>`;
}
function suBanner() {
  const st = suSteps(); const n = st.filter((x) => x.done).length; if (n === st.length) return '';
  return `<div class="su-bn"><span class="su-bi">${ic('sparkle', 16)}</span><div class="grow"><b>Kurulum ${n}/${st.length}</b><small>Kalan adımlar seni bekliyor</small></div><button type="button" class="btn sm" data-a="suopen">Devam</button><button type="button" class="su-x" data-a="suclose" aria-label="Kapat">${ic('x', 16)}</button></div>`;
}
H.suhide = () => { S.settings.setupHide = true; S.suForce = false; try { pSched(); } catch (e) {} render(); };
H.suopen = () => { S.suForce = true; render(); };
H.suclose = () => { S.settings.setupSeen = false; try { pSched(); } catch (e) {} render(); };
H['kaisai-go'] = (el) => H.nav({ dataset: { v: 'kaisai' } });
{
  const _v = viewHTML;
  viewHTML = function () {
    const u = S.user; if (!u || u.role !== 'patron' || S.view !== 'bugun' || S.modal) return _v.apply(this, arguments);
    const done = suSteps().every((x) => x.done);
    if (!S.settings.setupHide && !done && (S.suForce || suFresh())) { if (!S.settings.setupSeen) { S.settings.setupSeen = true; try { pSched(); } catch (e) {} } return suPage(); }
    const h = _v.apply(this, arguments); if (S.settings.setupSeen && !done && S.settings.setupHide !== 'x') return h.replace(/^(<div[^>]*>)/, (m) => m + suBanner());
    return h;
  };
}

/* ===== v102: Kais AI geliştirme: stok komutu, tahmin, geri bildirim, kaynak etiketi ===== */
function kaStockCmd(text) {
  if (!kaMgr()) return kaDeny('Stok değiştirmek patron ve müdürün işi.');
  if (S.user.role === 'mudur' && !kpCan('stokEdit')) return kaDeny('Stok düzenleme yetkin kapalı.');
  const f = kaFold(text); const zero = /\b(bitti|kalmadi|sifirla|tukendi)\b/.test(f);
  const hit = STOCK.filter((s) => f.includes(kaFold(kbName(s)).split(' ')[0]) && kaFold(kbName(s)).split(' ')[0].length > 2).sort((a, b) => kbName(b).length - kbName(a).length);
  if (!hit.length) return { content: 'Hangi ürün? Stoktaki adıyla yaz, örnek: "süt bitti" ya da "un 5 kg düş".', src: 'Stok listesi' };
  const s = hit[0]; const m = f.match(/(\d+(?:[.,]\d+)?)/); const n = m ? Number(m[1].replace(',', '.')) : null; const dec = /\b(dus|azalt|cikar|kullandik|harcadik)\b/.test(f);
  let to; if (zero) to = 0; else if (n != null && dec) to = Math.max(0, s.qty - n); else if (n != null) to = n; else return { content: s.name + ' için yeni miktarı yaz. Örnek: "' + kbName(s) + ' 12 ' + s.unit + '" ya da "bitti".', src: 'Stok listesi' };
  return { content: 'Stoğu şöyle güncelleyeceğim. Onaylarsan değişir.', src: 'Stok listesi', acts: [{ type: 'stok_komut', args: { id: s.id, to }, st: 'open' }] };
}
function kaForecast() {
  if (!kaMgr()) return kaDeny('Tahminler yalnızca patron ve müdür için.');
  const by = kbSales(); const ds = Object.keys(by).filter((d) => d < REF_ISO && dayDiff(d, REF_ISO) <= 56);
  if (ds.length < 14) return { content: 'Tahmin için en az iki haftalık satış verisi gerekiyor. Satış ekledikçe yapabilirim.', src: 'Satış kayıtları' };
  const rows = []; let tot = 0; const DN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  for (let k = 1; k <= 7; k++) { const d = addDays(REF_ISO, k); const same = ds.filter((x) => dowOf(x) === dowOf(d)); if (!same.length) continue; const avg = same.reduce((a, x) => a + by[x], 0) / same.length; tot += avg; rows.push('• ' + DN[dowOf(d)] + ': ~' + fmt(Math.round(avg / 10) * 10)); }
  const crit = stockPlan().filter((p) => p.status !== 'ok' && p.left !== Infinity).sort((a, b) => a.left - b.left).slice(0, 3);
  return { content: 'Önümüzdeki 7 gün için tahmini ciro ~' + fmt(Math.round(tot / 100) * 100) + ' (son 8 haftanın aynı günlerinin ortalaması).\n\n' + rows.join('\n') + (crit.length ? '\n\nİlk bitecekler:\n' + crit.map((x) => '• ' + kbName(x.st) + ': yaklaşık ' + Math.max(0, Math.round(x.left * 10) / 10) + ' gün').join('\n') : '') + '\n\nBu bir tahmindir, kampanya ve hava gibi etkileri bilmez.', src: 'Son 8 haftanın satışları ve stok hızı' };
}
{
  const _k = kaIntent;
  kaIntent = function (text) {
    const f = kaFold(text); if (f.length > 120) return _k(text);
    if (/\b(tahmin|ongor)/.test(f) && !/\b(kim|nasil|neden)\b/.test(f)) return kaForecast();
    if (/\b(bitti|kalmadi|tukendi|sifirla)\b/.test(f) && !/\?/.test(f) && f.split(' ').length <= 6) return kaStockCmd(text);
    if (/\b(\d+)\b.*\b(dus|azalt)\b|\b(dus|azalt)\b.*\b\d+\b/.test(f) && (/\b(stok|kg|lt|litre|adet|gr)\b/.test(f) || STOCK.some((x) => { const w = kaFold(kbName(x)).split(' ')[0]; return w.length > 2 && f.includes(w); }))) return kaStockCmd(text);
    return _k(text);
  };
}
{
  const _c = aiActCard;
  aiActCard = function (a, i, j) {
    if (a.type !== 'stok_komut') return _c(a, i, j);
    if (a.st !== 'open') return a.st === 'done' ? `<div class="callout info">${ic('info')}<div>${esc(a.msg || 'Güncellendi.')}</div></div>` : '<div class="small muted">Vazgeçildi.</div>';
    const s = STOCK.find((x) => x.id === a.args.id); if (!s) return '<div class="small muted">Ürün bulunamadı.</div>';
    return `<div class="card stack kc-act"><div class="kc-h"><span>${ic('box', 16)}</span><div><b>Stok güncelle</b><div class="small muted">${esc(s.name)}</div></div></div><div class="ai-pk"><div><small>Şimdi</small><b>${fq(s.qty)} ${esc(s.unit)}</b></div><div><small>Olacak</small><b>${fq(a.args.to)} ${esc(s.unit)}</b></div></div><div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Güncelle</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
  };
  const _a = H.aiact;
  H.aiact = async function (el) {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j];
    if (a && a.type === 'stok_komut' && a.st === 'open') {
      if (!kaMgr() || (S.user.role === 'mudur' && !kpCan('stokEdit'))) return kpDeny();
      const s = STOCK.find((x) => x.id === a.args.id); if (!s) return; const old = s.qty; s.qty = a.args.to; pSched();
      try { auditAdd({ type: 'kais', text: 'Kais stok güncelledi: ' + s.name + ' ' + fq(old) + ' → ' + fq(s.qty) }); } catch (e) {}
      a.st = 'done'; a.msg = s.name + ': ' + fq(old) + ' → ' + fq(s.qty) + ' ' + s.unit; try { aiMemSave(); } catch (e) {} render(); toast('Stok güncellendi.', 'ok'); return;
    }
    return _a.call(this, el);
  };
}
H.aifb = (el) => {
  const i = +el.dataset.i; const m = AIC.msgs[i]; if (!m || m.fb) return; m.fb = el.dataset.v;
  try { slog('kais_geri_bildirim', { v: m.fb, local: !!m.local, q: String((AIC.msgs[i - 1] || {}).content || '').slice(0, 120) }); } catch (e) {}
  try { aiMemSave(); } catch (e) {} render(); toast(m.fb === 'up' ? 'Teşekkürler.' : 'Not aldım, geliştireceğiz.', 'ok');
};
{
  const _v = viewKaisAI;
  viewKaisAI = function () {
    const h = _v(); let li = -1; AIC.msgs.forEach((m, i) => { if (m.role === 'assistant') li = i; }); if (li < 0 || AIC.busy) return h;
    const m = AIC.msgs[li];
    const bar = `<div class="kfb">${m.src ? `<span class="kfb-s">${ic('info', 14)} Baktığım veri: ${esc(m.src)}</span>` : ''}${m.fb ? `<span class="kfb-s">${m.fb === 'up' ? 'Faydalı bulundu' : 'Geliştirilecek'}</span>` : `<span class="kfb-q">Faydalı mıydı?</span><button type="button" class="kfb-b" data-a="aifb" data-i="${li}" data-v="up" aria-label="Faydalı">👍</button><button type="button" class="kfb-b" data-a="aifb" data-i="${li}" data-v="down" aria-label="Faydasız">👎</button>`}</div>`;
    return h.replace('<span id="ai-end">', bar + '<span id="ai-end">');
  };
}

/* ===== v103: şirket kuralları (ortak hafıza), izin komutu, tablo teyit etiketi ===== */
const KR = { rules: [], key: '', off: false };
const krMgr = () => !!(S.user && ['patron', 'mudur'].includes(S.user.role));
async function krPull() {
  const c = sbOK() && sbClient(); if (!c || !SBS.user || !SBS.biz || KR.off) return; const k = SBS.biz.id + ':' + SBS.user.id; if (KR.key === k) return; KR.key = k;
  try {
    const r = await c.from('kais_memory').select('id,content,created_at').eq('business_id', SBS.biz.id).is('user_id', null).eq('kind', 'rule').order('created_at', { ascending: true }).limit(40);
    if (r.error) { if (/relation|schema cache|permission/i.test(r.error.message || '')) KR.off = true; KR.key = ''; return; }
    KR.rules = (r.data || []).map((x) => ({ id: x.id, t: x.content })); if (S.view === 'kaisai') render();
  } catch (e) { KR.key = ''; }
}
async function krAdd(text) {
  const t = String(text || '').trim().slice(0, 300); if (t.length < 4 || !krMgr()) return false;
  if (KR.rules.some((x) => kaFold(x.t) === kaFold(t))) return true;
  const c = sbOK() && sbClient();
  if (c && SBS.user && SBS.biz) { const r = await c.from('kais_memory').insert({ business_id: SBS.biz.id, user_id: null, kind: 'rule', content: t }).select('id'); if (r.error) { toast('Kural kaydedilemedi.', 'warn'); return false; } KR.rules.push({ id: r.data && r.data[0] && r.data[0].id, t }); }
  else KR.rules.push({ id: 'l' + (++seq), t });
  try { auditAdd({ type: 'kais', text: 'Şirket kuralı eklendi: ' + t }); } catch (e) {} return true;
}
H.krad = async () => { const el = document.getElementById('kr-in'); if (!el) return; const ok = await krAdd(el.value); if (ok) { toast('Kural eklendi. Kais bundan sonra bunu bilecek.', 'ok'); render(); } };
H.krdel = async (el) => {
  if (!krMgr()) return; const i = KR.rules.findIndex((x) => String(x.id) === el.dataset.id); if (i < 0) return;
  const c = sbOK() && sbClient(); if (c && SBS.biz && !/^l\d+$/.test(String(KR.rules[i].id))) { const r = await c.from('kais_memory').delete().eq('id', KR.rules[i].id); if (r.error) { toast('Silinemedi.', 'warn'); return; } }
  KR.rules.splice(i, 1); render();
};
function krCard() {
  if (!S.user || S.user.role === 'calisan') return '';
  const mg = krMgr();
  return `<details class="card kr" ${KR.rules.length ? 'open' : ''}><summary class="check"><span class="dot tone-info">${ic('sparkle', 16)}</span><div class="grow"><b style="font-weight:600">Şirket kuralları</b><div class="small muted">${KR.rules.length ? KR.rules.length + ' kural, yöneticilerin hepsi için geçerli' : 'Kais\'in herkes için hatırlaması gereken kurallar'}</div></div></summary>
  <div class="stack" style="margin-top:10px">${KR.rules.map((x) => `<div class="kr-r"><span>${esc(x.t)}</span>${mg ? `<button type="button" class="xbtn sm" data-a="krdel" data-id="${esc(String(x.id))}" aria-label="Kuralı sil">${ic('trash', 16)}</button>` : ''}</div>`).join('') || '<p class="small muted" style="margin:0">Henüz kural yok.</p>'}
  ${mg ? `<div class="row"><input id="kr-in" class="grow" type="text" maxlength="300" placeholder="Örnek: Pazartesi kapalıyız" autocomplete="off"><button class="btn sm" data-a="krad">Ekle</button></div><p class="small muted" style="margin:0">Sohbette de yazabilirsin: "kural: cuma günleri erken kapatıyoruz".</p>` : ''}</div></details>`;
}
{
  const _v = viewKaisAI;
  viewKaisAI = function () { krPull(); const h = _v(); const c = krCard(); return c ? h.replace('<div class="stack">', c + '<div class="stack">') : h; };
}
const KA_MO = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
function kaDates(f) {
  const y = Number(REF_ISO.slice(0, 4)); const mk = (d, m) => { let iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); if (iso < REF_ISO) iso = (y + 1) + iso.slice(4); return iso; };
  const mr = '(' + KA_MO.join('|') + ')'; let m = f.match(new RegExp('(\\d{1,2})\\s*' + mr + '?\\s*(?:-|ile|ila)\\s*(\\d{1,2})\\s*' + mr));
  if (m) { const m2 = KA_MO.indexOf(m[4]); const m1 = m[2] ? KA_MO.indexOf(m[2]) : m2; const a = mk(+m[1], m1); let b = mk(+m[3], m2); if (b < a) b = a; return [a, b]; }
  m = f.match(new RegExp('(\\d{1,2})\\s*' + mr)); if (m) { const a = mk(+m[1], KA_MO.indexOf(m[2])); return [a, a]; }
  const n = f.match(/\b(\d{1,2})\s*gun/); const st = /\bbugun\b/.test(f) ? REF_ISO : /\bobur gun\b/.test(f) ? addDays(REF_ISO, 2) : addDays(REF_ISO, 1);
  if (n && +n[1] >= 1 && +n[1] <= 60) return [st, addDays(st, +n[1] - 1)];
  return [st, st];
}
function kaLeaveAct(text) {
  if (!kaMgr()) return kaDeny('İzin kaydetmek patron ve müdürün işi.');
  const f = kaFold(text); const uid = kaUidFrom(f); if (!uid || uid === 'all') return { content: 'Kimin izni? Şöyle yaz: "Ali yarın izinli" ya da "Ayşe 20-22 Kasım izinli".', src: 'Ekip listesi' };
  const [a, b] = kaDates(f); const type = /\brapor/.test(f) ? 'rapor' : /\bucretsiz/.test(f) ? 'ucretsiz' : /\byillik/.test(f) ? 'yillik' : 'mazeret';
  return { content: byId(uid).name.split(' ')[0] + ' için izni hazırladım. Tarihi ve türü kontrol edip onayla.', src: 'Ekip ve izin kayıtları', acts: [{ type: 'izin_ver', args: { uid, type, a, b }, st: 'open' }] };
}
const kaLvTxt = (a, b) => (a === b ? isoShort(a) : isoShort(a) + '–' + isoShort(b));
{
  const _k = kaIntent;
  kaIntent = function (text) {
    const f = kaFold(text); if (f.length > 160) return _k(text);
    const m = f.match(/^(?:sirket )?(?:kural|kurali)(?: ekle)?\s*[:\-]\s*(.{4,})$/) || f.match(/^(?:hatirla|unutma)\s*[:\-]\s*(?:herkes icin\s*)?(.{4,})$/);
    if (m) { if (!krMgr()) return kaDeny('Şirket kuralını yalnızca patron ve müdür ekleyebilir.'); const t = text.slice(text.search(/[:\-]/) + 1).trim(); return { content: 'Şu kuralı tüm yöneticiler için kaydedeyim mi?', src: 'Şirket kuralları', acts: [{ type: 'kural_ekle', args: { t }, st: 'open' }] }; }
    if (/\b(izinli|izin ver|izne cik|raporlu|izin yaz|izin gir)\b/.test(f) && !/\?|\b(kim|kimler|kac|ne zaman|var mi)\b/.test(f)) return kaLeaveAct(text);
    return _k(text);
  };
}
{
  const _c = aiActCard;
  aiActCard = function (a, i, j) {
    if (a.type === 'kural_ekle') {
      if (a.st !== 'open') return a.st === 'done' ? `<div class="callout info">${ic('info')}<div>${esc(a.msg || 'Kaydedildi.')}</div></div>` : '<div class="small muted">Vazgeçildi.</div>';
      return `<div class="card stack kc-act"><div class="kc-h"><span>${ic('sparkle', 16)}</span><div><b>Şirket kuralı</b><div class="small muted">Yöneticilerin hepsi için hatırlanır</div></div></div><div class="field"><input id="aa-${i}-${j}-t" type="text" maxlength="300" value="${esc(a.args.t)}" aria-label="Kural"></div><div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">Kaydet</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
    }
    if (a.type === 'izin_ver') {
      if (a.st !== 'open') return a.st === 'done' ? `<div class="callout info">${ic('info')}<div>${esc(a.msg || 'Kaydedildi.')}</div></div>` : '<div class="small muted">Vazgeçildi.</div>';
      const g = a.args; const id = (k) => `aa-${i}-${j}-${k}`; const us = USERS.filter((u) => u.role !== 'patron');
      return `<div class="card stack kc-act"><div class="kc-h"><span>${ic('calendar', 16)}</span><div><b>İzin kaydı</b><div class="small muted">Vardiya planında o günler izinli görünür</div></div></div>
      <div class="row wrap"><div class="field grow"><label for="${id('u')}">Kim</label><select id="${id('u')}">${us.map((u) => `<option value="${u.id}"${g.uid === u.id ? ' selected' : ''}>${esc(u.name)}</option>`).join('')}</select></div>
      <div class="field grow"><label for="${id('y')}">Tür</label><select id="${id('y')}">${Object.keys(LV_KIND).map((k) => `<option value="${k}"${g.type === k ? ' selected' : ''}>${LV_KIND[k]}</option>`).join('')}</select></div></div>
      <div class="row wrap"><div class="field grow"><label for="${id('a')}">Başlangıç</label><input id="${id('a')}" type="date" value="${esc(g.a)}"></div><div class="field grow"><label for="${id('b')}">Bitiş</label><input id="${id('b')}" type="date" value="${esc(g.b)}"></div></div>
      <div class="row wrap"><button class="btn sm" data-a="aiact" data-i="${i}" data-j="${j}">İzni kaydet</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Vazgeç</button></div></div>`;
    }
    return _c(a, i, j);
  };
  const _a = H.aiact;
  H.aiact = async function (el) {
    const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (!a || a.st !== 'open' || !['kural_ekle', 'izin_ver'].includes(a.type)) return _a.call(this, el);
    const g = (k) => ((document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-${k}`) || {}).value || '').trim(); const done = (m) => { a.st = 'done'; a.msg = m; try { aiMemSave(); } catch (e) {} render(); };
    if (!kaMgr()) return kpDeny();
    if (a.type === 'kural_ekle') { const t = g('t'); if (t.length < 4) { toast('Kuralı yaz.', 'warn'); return; } if (await krAdd(t)) { done('Kural kaydedildi: ' + t); toast('Kural kaydedildi.', 'ok'); } return; }
    const uid = g('u'), type = g('y'), s = g('a'), e = g('b') || s; if (!byId(uid) || !LV_KIND[type]) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e) || e < s) { toast('Tarihleri kontrol et.', 'warn'); return; }
    const days = dayDiff(s, e) + 1; if (days > 60) { toast('En fazla 60 gün girebilirsin.', 'warn'); return; }
    if (type === 'yillik') { const i = yizInfo(uid); if (days > i.left) { toast(i.tot ? 'Kalan yıllık izin ' + Math.max(0, i.left) + ' gün.' : 'Yıllık izin hakkı henüz doğmadı.', 'warn'); return; } }
    if (LEAVES.some((x) => x.uid === uid && x.txt === kaLvTxt(s, e))) { done('Bu izin zaten kayıtlı.'); return; }
    LEAVES.push({ id: 'lv' + ++seq, uid, type, txt: kaLvTxt(s, e), days }); vdSave();
    try { auditAdd({ type: 'kais', text: 'Kais izin kaydetti: ' + byId(uid).name + ' ' + kaLvTxt(s, e) }); } catch (x) {}
    try { pushSend([uid], 'İznin kaydedildi', LV_KIND[type] + ': ' + kaLvTxt(s, e)); } catch (x) {}
    done(byId(uid).name + ': ' + LV_KIND[type] + ', ' + kaLvTxt(s, e) + ' (' + days + ' gün) kaydedildi.'); toast('İzin kaydedildi.', 'ok');
  };
}
/* Tablo: muhasebeci teyidi bekleyen satırlara etiket */
{
  const _t = ledgerTr;
  ledgerTr = function (r, dis) { const h = _t.apply(this, arguments); return r.pend ? h.replace(`id="ls-${r.id}">`, `id="ls-${r.id}"><span class="pill p-warn tb-p">Teyit bekliyor</span> `) : h; };
}
{
  const _tc = tbCard;
  tbCard = function (r) { const h = _tc.apply(this, arguments); return r.pend ? h.replace('<div class="tb-ch">', '<div class="tb-ch"><span class="pill p-warn tb-p">Teyit bekliyor</span>') : h; };
}

/* ===== v104: yasal metinler (KVKK aydınlatma, gizlilik, kullanım şartları) ===== */
const LEGAL_LINKS = '<a href="/gizlilik/" target="_blank" rel="noopener">Gizlilik</a><span aria-hidden="true">·</span><a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma</a><span aria-hidden="true">·</span><a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım şartları</a>';
{
  const _l = loginHTML;
  loginHTML = function () {
    let h = _l.apply(this, arguments);
    if (h.indexOf('data-a="idnew"') >= 0 && h.indexOf('lg-yasal') < 0) h = h.replace('<button class="lx-go" type="button" data-a="idnew">', '<p class="lg-ok">Hesap açarak <a href="/kullanim-sartlari/" target="_blank" rel="noopener">Kullanım şartlarını</a> ve <a href="/kvkk/" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okuduğunu kabul edersin.</p><button class="lx-go" type="button" data-a="idnew">');
    return h.replace(/<\/form>/, '</form><div class="lg-yasal" id="lg-yasal">' + LEGAL_LINKS + '</div>');
  };
}
{
  const _h = hesapHTML;
  hesapHTML = function () { const h = _h.apply(this, arguments); return h + `<div class="card"><h3>Yasal</h3><div class="lg-yasal lg-in">${LEGAL_LINKS}</div></div>`; };
}

/* ===== v105: siparişi tedarikçiye tek dokunuşla gönder ===== */
NEWM.ordsend = (m) => {
  const o = ORDERS.find((x) => x.id === m.id); if (!o) return sheet('Sipariş', '<p class="muted">Sipariş bulunamadı.</p>');
  const t = supById(o.supId) || {}; const msg = o.msg || orderMsg(t.lead != null ? t : { lead: 2 }, o.lines); const ph = waPhone(t.phone); const em = String(t.email || '').trim();
  const sent = [o.wa ? 'WhatsApp' : '', o.mailed ? 'e-posta' : ''].filter(Boolean).join(' ve ');
  return sheet((t.name || 'Tedarikçi') + ' siparişi', `<div class="os-w"><div class="os-p">${esc(msg)}</div>
  ${sent ? `<p class="small os-ok">${ic('check', 14)} ${esc(sent)} ile gönderildi.</p>` : ''}
  <div class="os-b"><button class="btn block os-wa" data-a="ordsendwa" data-id="${esc(o.id)}">${ic('send', 18)} WhatsApp'ta gönder</button><small class="muted">${ph ? '+' + esc(ph) + ' numarasına açılır' : 'Telefon kayıtlı değil, kişiyi WhatsApp\'ta kendin seçersin'}</small>
  <button class="btn sec block" data-a="ordsendmail"${em ? '' : ' disabled'} data-id="${esc(o.id)}">${ic('mail', 18)} E-posta ile gönder</button>${em ? `<small class="muted">${esc(em)}</small>` : '<small class="muted">E-posta kayıtlı değil. Tedarikçi kartından ekleyebilirsin.</small>'}
  <button class="btn sec block" data-a="ordcopy" data-id="${esc(o.id)}">${ic('copy', 18)} Mesajı kopyala</button><button class="os-lk" data-a="closemodal">Sonra gönderirim</button></div></div>`);
};
H.ordsendopen = (el) => { if (!ORDERS.find((x) => x.id === el.dataset.id)) return; S.modal = { type: 'ordsend', id: el.dataset.id }; renderModal(); };
H.ordsendwa = (el) => { H.ordwa(el); const o = ORDERS.find((x) => x.id === el.dataset.id); if (o) { try { pSched(); } catch (e) {} } renderModal(); render(); };
H.ordsendmail = (el) => {
  const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o) return; const t = supById(o.supId) || {}; const em = String(t.email || '').trim(); if (!em) { toast('Tedarikçinin e-postası yok.', 'warn'); return; }
  const msg = o.msg || orderMsg(t.lead != null ? t : { lead: 2 }, o.lines); o.mailed = REF_ISO; try { pSched(); } catch (e) {}
  window.location.href = 'mailto:' + encodeURIComponent(em).replace('%40', '@') + '?subject=' + encodeURIComponent(BIZ + ' sipariş') + '&body=' + encodeURIComponent(msg); renderModal(); render();
};
{
  const _oc = H.ordcreate;
  H.ordcreate = function (el) { const n = ORDERS.length; _oc.apply(this, arguments); if (ORDERS.length > n) { const o = ORDERS[0]; const t = supById(o.supId); if (!(t && t.sbid)) { S.modal = { type: 'ordsend', id: o.id }; renderModal(); } } };
}

/* ===== v106: haftalık özet, çevrimdışı sonrası eşitleme ===== */
function kaWeekly() {
  if (!kaMgr()) return kaDeny('Haftalık özet yalnızca patron ve müdür için.');
  const a0 = addDays(REF_ISO, -6), b1 = addDays(REF_ISO, -7), b0 = addDays(REF_ISO, -13); const by = kbSales();
  const sum = (x, y) => Object.keys(by).filter((d) => d >= x && d <= y).reduce((t, d) => t + by[d], 0);
  const cur = sum(a0, REF_ISO), prev = sum(b0, b1);
  const gid = (x, y) => LEDGER.filter((r) => r.iso && r.iso >= x && r.iso <= y && dirOf(r) === 'gider').reduce((t, r) => t + (Number(r.total) || 0), 0);
  const gc = gid(a0, REF_ISO), gp = gid(b0, b1);
  const pct = (c, p) => (p > 0 ? Math.round((c / p - 1) * 100) : null); const sg = (n) => (n == null ? '' : ' (' + (n >= 0 ? '+' : '') + n + '% geçen haftaya göre)');
  const tops = {}; SALES.filter((s) => s.date >= a0 && s.date <= REF_ISO).forEach((s) => { const k = prodKey(s.prod); tops[k] = tops[k] || { n: s.prod, q: 0, t: 0 }; tops[k].q += Number(s.qty) || 0; tops[k].t += Number(s.total) || 0; });
  const top = Object.values(tops).sort((x, y) => y.t - x.t).slice(0, 3);
  const low = costRows().filter((r) => r.margin != null && r.margin * 100 < MCFG.hedef).slice(0, 3);
  const crit = stockPlan().filter((p) => p.status === 'now').length; const lines = [];
  if (!cur && !prev && !gc) return { content: 'Son iki haftada satış ya da gider kaydı yok. Veri girdikçe haftalık özet çıkarırım.', src: 'Satış ve gider kayıtları' };
  lines.push('**Son 7 gün**', '• Ciro: ' + fmt(Math.round(cur)) + sg(pct(cur, prev)));
  if (gc || gp) lines.push('• Gider (kayıtlı): ' + fmt(Math.round(gc)) + sg(pct(gc, gp)));
  if (cur && gc) lines.push('• Fark: ' + fmt(Math.round(cur - gc)));
  if (top.length) lines.push('', '**En çok kazandıran**', ...top.map((x) => '• ' + x.n + ': ' + fmt(Math.round(x.t)) + ' (' + fq(x.q) + ' adet)'));
  if (low.length) lines.push('', '**Hedef kârın altında**', ...low.map((r) => '• ' + r.name + ': %' + Math.round(r.margin * 100) + (r.need ? ', fiyat ' + fmt(r.need) + ' olmalı' : '')));
  if (crit) lines.push('', '• ' + crit + ' ürün kritik stokta.');
  return { content: lines.join('\n'), src: 'Son 14 günün satışları, gider kayıtları ve reçete maliyetleri' };
}
{
  const _k = kaIntent;
  kaIntent = function (text) { const f = kaFold(text); if (f.length < 70 && /(haftalik|bu hafta|gecen hafta|hafta nasil|hafta ozet)/.test(f) && /(ozet|nasil|rapor|durum|gecti)/.test(f)) return kaWeekly(); return _k(text); };
}
window.addEventListener('online', () => { try { if (typeof CL !== 'undefined' && CL.on && typeof pFlush === 'function') pFlush(); } catch (e) {} });

/* ===== v107: Bugün ekranı sadeleştirme (patron) ===== */
function kbTidy() {
  try {
    if (!S.user || !['patron', 'mudur'].includes(S.user.role) || S.view !== 'bugun' || S.modal) return; const m = document.querySelector('main'); if (!m || m.querySelector('.tid, .tid-done')) return;
    const q = (s) => m.querySelector(s); const kst = q('.kb-st'); if (!kst) return; const pat = S.user.role === 'patron';
    const fold = (el, ico, title, sub, open) => { if (!el) return; const d = document.createElement('details'); d.className = 'tid card'; if (open) d.open = true; d.innerHTML = `<summary><span class="tid-i">${ic(ico, 18)}</span><span class="tid-t"><b>${title}</b><small>${esc(sub)}</small></span></summary>`; el.parentNode.insertBefore(d, el); el.classList.add('tid-in'); d.appendChild(el); };
    const bn = kst.querySelector('.su-bn'); if (bn && pat) m.insertBefore(bn, kst);
    const dsec = q('.dsec'); if (dsec && pat) m.insertBefore(dsec, kst.nextSibling);
    if (!pat) { const dup = q('.stx-ks'); if (dup) dup.style.display = 'none'; const mq = q('.mg-q'); const hi = q('.mg-hi'); if (mq && hi) hi.parentNode.insertBefore(mq, hi.nextSibling); const tm = Array.from(m.querySelectorAll('.mg-card')).find((x) => !x.classList.contains('mg-att') && /Ekip durumu/.test(x.textContent)); if (tm) { const out = (tm.textContent.match(/(\d+)\s*dışarıda/) || [])[0]; fold(tm, 'users', 'Ekip durumu', out || 'Kim çalışıyor', false); } }
    const lis = m.querySelectorAll('.kb-card .kb-l .kb-r'); if (lis.length > 3) { for (let i = 3; i < lis.length; i++) lis[i].style.display = 'none'; const more = document.createElement('li'); more.className = 'kb-more'; more.textContent = '+' + (lis.length - 3) + ' madde daha'; lis[0].parentNode.appendChild(more); }
    const kb = q('.kb-card'); const f1 = kb && kb.querySelector('.kb-r'); fold(kb, 'calendar', 'Kais: yarın için bütün resim', f1 ? f1.textContent.trim().slice(0, 70) : 'Yarının özeti', false);
    const ka = q('.ka-card'); const kn = ka && (ka.querySelector('.btn.block') || {}).textContent; fold(ka, 'sparkle', 'Kais senin için hazırladı', (kn || '').replace(/[^\d]/g, '') ? (kn.replace(/[^\d]/g, '') + ' iş, tek dokunuşla yap') : 'Önerileri gör', false);
    const kz = q('.kz'); const kp = kz && kz.querySelector('.pill'); fold(kz, 'list', 'Günün özeti', kp ? kp.textContent.trim() : 'Kais günü değerlendirdi', false);
    const ki = q('.ki'); if (ki && /Henüz veri yok/i.test(ki.textContent)) ki.style.display = 'none';
    const pf = q('.pf-card'); if (pf && pat) { pf.classList.add('pf-min'); m.querySelector('.dash') && m.querySelector('.dash').appendChild(pf); }
    const mk = document.createElement('i'); mk.className = 'tid-done'; mk.hidden = true; m.appendChild(mk);
  } catch (e) {}
}
{ const _r = render; render = function () { const r = _r.apply(this, arguments); kbTidy(); return r; }; }
function kbFoldCards(sel, ico, firstOpen) {
  try {
    const m = document.querySelector('main'); if (!m || m.querySelector('.tid-done')) return;
    Array.from(m.querySelectorAll(sel)).forEach((el, i) => {
      if (el.closest('details.tid')) return; const h = el.querySelector('h2, h3, h4'); if (!h) return; const t = h.textContent.trim(); const sm = el.querySelector('.muted, p.small, small'); let sub = sm ? sm.textContent.trim().replace(/\s+/g, ' ') : ''; if (sub === t) sub = ''; if (sub.length > 60) sub = sub.slice(0, 58) + '…';
      const d = document.createElement('details'); d.className = 'tid card'; if (firstOpen && i === 0) d.open = true; d.innerHTML = `<summary><span class="tid-i">${ic(ico, 18)}</span><span class="tid-t"><b>${esc(t)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></summary>`;
      el.parentNode.insertBefore(d, el); el.classList.add('tid-in'); d.appendChild(el);
      const hh = el.querySelector(':scope > .row h3, :scope > div > h3, :scope > h3, :scope > header'); 
    });
    const mk = document.createElement('i'); mk.className = 'tid-done'; mk.hidden = true; m.appendChild(mk);
  } catch (e) {}
}
{
  const _r2 = render;
  render = function () {
    const r = _r2.apply(this, arguments);
    if (S.user && !S.modal) { if (S.view === 'ayarlar' && S.user.role === 'patron') kbFoldCards('main .stack-lg > .card, main > .card.flush', 'gear', false); else if (S.view === 'sartlar') kbFoldCards('main .sz > .sz-card', 'file', true); }
    return r;
  };
}

/* ===== v108: rol görünürlüğü: müdür maliyet/kâr kapalı, muhasebeci stok sayımı, arıza ve kampanyayı salt okunur görür ===== */
NAV.muhasebeci.push(['stok', 'Stok sayımı', 'box', 'more'], ['ops', 'Arıza ve bakım', 'gear', 'more'], ['musteri', 'Kampanyalar', 'mail', 'more']);
TITLES.stok = TITLES.stok || 'Stok'; TITLES.ops = TITLES.ops || 'Operasyon'; TITLES.musteri = TITLES.musteri || 'Müşteri';
{
  const _vh = viewHTML;
  viewHTML = function () { const u = S.user; if (u && u.role === 'muhasebeci') { if (S.view === 'stok') return viewStok(); if (S.view === 'ops') return viewOps(); if (S.view === 'musteri') return roCamps(); } return _vh.apply(this, arguments); };
}
function roCamps() {
  const L = (typeof CAMPAIGNS !== 'undefined' ? CAMPAIGNS : []).slice().reverse();
  return `<div class="stack-lg"><div><h2>Kampanyalar</h2><p class="muted small" style="margin-top:4px">Gönderilen toplu e-postalar. Yeni kampanyayı patron hazırlar.</p></div>${L.length ? `<div class="card flush">${L.map((c) => `<div class="rrow"><div><b style="font-weight:600">${esc(c.subj)}</b><div class="small muted">${esc(c.date)} · ${c.sent} kişiye</div></div><span class="pill p-info">${esc(c.open || 'gitti')}</span></div>`).join('')}</div>` : `<div class="empty">Henüz kampanya gönderilmedi.</div>`}</div>`;
}
const RO_VIEWS = ['stok', 'ops', 'musteri'];
const RO_OK = ['nav', 'sub', 'sttab', 'stkf', 'stg', 'sthist', 'stkgo', 'opgo', 'mtf', 'closemodal', 'togmore', 'moremenu', 'more'];
const RO_HIDE = ['stk', 'stkadd', 'stkbulk', 'cntstart', 'lotadd', 'wasteadd', 'wasteopen', 'minall', 'minapply', 'etkopen', 'campsend', 'camptpl', 'campseg', 'chk', 'rqnew', 'opnew', 'mtnew', 'mpnew', 'mpq'];
const roOn = () => !!(S.user && S.user.role === 'muhasebeci' && RO_VIEWS.includes(S.view));
window.addEventListener('click', (e) => {
  if (!roOn()) return; const el = e.target && e.target.closest && e.target.closest('[data-a]'); if (!el) return; const a = el.dataset.a;
  if (RO_OK.includes(a) || /^(sub|nav)$/.test(a)) return; if (el.closest('.nav, nav, .tabbar, .bnav, header')) return;
  e.stopImmediatePropagation(); e.preventDefault(); try { toast('Muhasebeci bu bölümü yalnızca görüntüler.', 'warn'); } catch (x) {}
}, true);
{
  const _r = render;
  render = function () {
    const u = S.user;
    if (u && u.role === 'mudur' && !kpCan('maliyetView') && S.stTab === 'maliyet') S.stTab = 'liste';
    if (u && u.role === 'muhasebeci') { S.sub = S.sub || {}; if (S.view === 'ops' && S.sub.ops !== 'ariza') S.sub.ops = 'ariza'; if (S.view === 'musteri' && S.sub.musteri !== 'kampanya') S.sub.musteri = 'kampanya'; if (S.view === 'stok' && !['liste', 'sayim', 'fire'].includes(S.stTab)) S.stTab = 'sayim'; }
    const r = _r.apply(this, arguments);
    try {
      const m = document.querySelector('main'); if (!m || !u) return r;
      if (u.role === 'mudur' && !kpCan('maliyetView')) m.querySelectorAll('[data-a="sttab"][data-t="maliyet"], [data-a="sttab"][data-v="maliyet"]').forEach((b) => b.remove());
      if (roOn()) {
        m.querySelectorAll('[data-a]').forEach((b) => { if (RO_HIDE.includes(b.dataset.a)) b.style.display = 'none'; });
        if (S.view === 'ops') m.querySelectorAll('[data-a="sub"]').forEach((b) => { if (b.dataset.v !== 'ariza') b.style.display = 'none'; });
        if (S.view === 'musteri') m.querySelectorAll('[data-a="sub"]').forEach((b) => { if (b.dataset.v !== 'kampanya') b.style.display = 'none'; });
        if (S.view === 'stok') m.querySelectorAll('[data-a="sttab"]').forEach((b) => { if (!['liste', 'sayim', 'fire'].includes(b.dataset.v || b.dataset.t)) b.style.display = 'none'; });
        if (!m.querySelector('.ro-note')) { const n = document.createElement('div'); n.className = 'ro-note'; n.textContent = 'Bu bölümü yalnızca görüntülersin.'; m.insertBefore(n, m.firstChild); }
      }
    } catch (e) {}
    return r;
  };
}

/* ===== v109: muhasebeci yetkileri (patron belirler) ===== */
const MP_G = [['mStok', 'Stok sayımı', 'Liste, sayım ve fire (salt okunur)', 'stok'], ['mOps', 'Arıza ve bakım', 'Arıza bildirimleri ve bakım takvimi (salt okunur)', 'ops'], ['mKamp', 'Kampanyalar', 'Gönderilen toplu e-postalar (salt okunur)', 'musteri'], ['mCal', 'Çalışanlar, maaş ve sözleşmeler', 'Bordro, avans ve evraklar', 'calisanlar'], ['mBorc', 'Borç ve alacak', 'Tedarikçi borçları ve ödemeler', 'borc'], ['mSatis', 'Satışlar', 'Satış kayıtları ve içe aktarma', 'satis'], ['mAi', 'Kais AI', 'Kais ile sohbet', 'kaisai']];
const mpOn = (k) => { const p = S.settings.mperm; return !p || p[k] !== false; };
const MP_VIEW = {}; MP_G.forEach((g) => { MP_VIEW[g[3]] = g[0]; });
const mpView = (v) => !MP_VIEW[v] || mpOn(MP_VIEW[v]);
{
  const base = NAV.muhasebeci.slice();
  Object.defineProperty(NAV, 'muhasebeci', { configurable: true, enumerable: true, get() { return base.filter((n) => mpView(n[0])); } });
  const _vh = viewHTML;
  viewHTML = function () {
    const u = S.user; if (u && u.role === 'muhasebeci' && !mpView(S.view)) return `<div class="kp-lock">${ic('lock', 28)}<b>Bu bölüm kapalı</b><p>Patron bu sayfayı senin için açmadı. İstersen ona söyle, Ayarlar'dan açabilir.</p><button class="btn sec" data-a="nav" data-v="donem">Dönem'e dön</button></div>`;
    let h = _vh.apply(this, arguments);
    if (u && u.role === 'patron' && S.view === 'ayarlar' && !h.includes('mp-card')) { const i = h.indexOf('<div class="card"><h3>Diğer ayarlar</h3>'); if (i >= 0) h = h.slice(0, i) + mpCard() + h.slice(i); }
    return h;
  };
}
function mpCard() {
  const on = MP_G.filter((g) => mpOn(g[0])).length;
  return `<div class="card kp-card mp-card"><div class="row between wrap"><div><h3>Muhasebeci yetkileri</h3><p class="muted small" style="margin-top:2px">Muhasebecinin hangi sayfaları göreceğini sen belirlersin. Dönem, belgeler ve tablo her zaman açık.</p></div><span class="pill p-info">${on}/${MP_G.length} açık</span></div>
  <div class="kp-g">${MP_G.map((g) => `<div class="toggle"><div><b style="font-weight:600">${esc(g[1])}</b><div class="small muted">${esc(g[2])}</div></div><button class="sw" role="switch" aria-checked="${mpOn(g[0])}" aria-label="${esc(g[1])}" data-a="mperm" data-k="${g[0]}"></button></div>`).join('')}</div></div>`;
}
H.mperm = (el) => {
  if (!S.user || S.user.role !== 'patron') return; const k = el.dataset.k; if (!MP_G.some((g) => g[0] === k)) return;
  const p = S.settings.mperm || (S.settings.mperm = {}); p[k] = p[k] === false; try { auditAdd({ type: 'kais', text: 'Muhasebeci yetkisi ' + (p[k] === false ? 'kapatıldı' : 'açıldı') + ': ' + MP_G.find((g) => g[0] === k)[1] }); } catch (e) {} pSched(); render();
};

/* ===== v110: herkese açık online rezervasyon ===== */
const RBK = { cfg: null, reqs: [], loaded: false, busy: false, err: '', t: 0 };
const rbCan = () => S.user && ['patron', 'mudur'].includes(S.user.role) && typeof SBS !== 'undefined' && SBS.biz && sbClient();
const rbLink = () => (RBK.cfg ? location.origin + '/rez/?k=' + RBK.cfg.slug : '');
async function rbLoad() {
  if (!rbCan() || RBK.busy) return; RBK.busy = true;
  try {
    const c = sbClient(); const b = SBS.biz.id;
    const [a, r] = await Promise.all([c.from('booking_config').select('*').eq('business_id', b).maybeSingle(), c.from('booking_requests').select('*').eq('business_id', b).eq('status', 'bekliyor').order('date').order('time').limit(50)]);
    if (a.error) throw a.error; if (r.error) throw r.error; RBK.cfg = a.data || null; RBK.reqs = r.data || []; RBK.err = '';
  } catch (e) { RBK.err = /relation|schema cache|booking/i.test(String((e && e.message) || e)) ? 'kurulmamış' : 'bağlanamadı'; }
  RBK.busy = false; RBK.loaded = true; RBK.t = Date.now(); if (S.view === 'rezerv' && !S.modal) render();
}
function rbCard() {
  if (RBK.err === 'kurulmamış') return S.user.role === 'patron' ? `<div class="callout warn">${ic('alert')}<div>Online rezervasyon kurulmamış. Supabase'de <b>tenant_booking.sql</b> dosyasını çalıştır.</div></div>` : '';
  const q = RBK.reqs.map((x) => `<div class="rrow"><div><b style="font-weight:600">${esc(x.name)}</b> · ${x.n} kişi<div class="small muted">${esc(String(x.date).split('-').reverse().join('.'))} · ${esc(x.time)} · ${esc(x.phone)}${x.note ? ' · ' + esc(x.note) : ''}</div></div><div class="row" style="gap:6px"><button class="btn sec" data-a="bkno" data-id="${x.id}">Reddet</button><button class="btn" data-a="bkok" data-id="${x.id}">Onayla</button></div></div>`).join('');
  const head = RBK.cfg && RBK.cfg.enabled
    ? `<div class="row between wrap" style="gap:8px"><div><h3 style="margin:0">Online rezervasyon</h3><p class="muted small" style="margin-top:2px">Müşteri linkten talep gönderir, sen onaylarsın.</p></div><span class="pill ${RBK.reqs.length ? 'p-warn' : 'p-ok'}">${RBK.reqs.length ? RBK.reqs.length + ' bekliyor' : 'Açık'}</span></div>
    <div class="row wrap" style="gap:8px;margin-top:10px"><button class="btn sec" data-a="bkcopy">Linki kopyala</button><button class="btn sec" data-a="bkwa">WhatsApp'ta paylaş</button>${S.user.role === 'patron' ? '<button class="btn sec" data-a="bkoff">Kapat</button>' : ''}</div>`
    : `<div class="row between wrap" style="gap:8px"><div><h3 style="margin:0">Online rezervasyon</h3><p class="muted small" style="margin-top:2px">Müşterilerine bir link ver, masa talebini kendileri göndersin.</p></div>${S.user.role === 'patron' ? '<button class="btn" data-a="bkon">Aç</button>' : '<span class="pill">Kapalı</span>'}</div>`;
  return `<div class="card bk-card">${head}${q ? `<div style="margin-top:12px">${q}</div>` : ''}</div>`;
}
{
  const _vr = viewRezerv;
  viewRezerv = function () {
    let h = _vr.apply(this, arguments);
    if (rbCan()) { if (!RBK.loaded) rbLoad(); const c = rbCard(); const m = '<div class="seg" role="group" aria-label="Rezervasyon bölümleri">'; const i = h.indexOf(m); if (c && i >= 0) h = h.slice(0, i) + c + h.slice(i); }
    return h;
  };
  setInterval(() => { if (S.view === 'rezerv' && !document.hidden && !S.modal && Date.now() - RBK.t > 40000) rbLoad(); }, 20000);
}
H.bkon = async () => {
  if (!rbCan() || S.user.role !== 'patron') return;
  const slug = Array.from(crypto.getRandomValues(new Uint8Array(6))).map((x) => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join('');
  const c = sbClient(); const r = RBK.cfg ? await c.from('booking_config').update({ enabled: true }).eq('business_id', SBS.biz.id) : await c.from('booking_config').insert({ business_id: SBS.biz.id, slug, open_h: RCFG.open || 8, close_h: RCFG.close || 22 });
  if (r.error) { toast('Açılamadı.', 'bad'); return; } try { auditAdd({ type: 'kais', text: 'Online rezervasyon açıldı' }); } catch (e) {} RBK.loaded = false; await rbLoad(); toast('Online rezervasyon açıldı.', 'ok');
};
H.bkoff = async () => { if (!rbCan() || S.user.role !== 'patron') return; const r = await sbClient().from('booking_config').update({ enabled: false }).eq('business_id', SBS.biz.id); if (r.error) { toast('Kapatılamadı.', 'bad'); return; } try { auditAdd({ type: 'kais', text: 'Online rezervasyon kapatıldı' }); } catch (e) {} RBK.loaded = false; await rbLoad(); toast('Kapatıldı. Link artık çalışmaz.', 'ok'); };
H.bkcopy = async () => { try { await navigator.clipboard.writeText(rbLink()); toast('Link kopyalandı.', 'ok'); } catch (e) { toast(rbLink(), 'ok'); } };
H.bkwa = () => { window.open('https://wa.me/?text=' + encodeURIComponent('Rezervasyon için: ' + rbLink()), '_blank', 'noopener'); };
H.bkno = async (el) => { if (!rbCan()) return; const r = await sbClient().from('booking_requests').update({ status: 'red' }).eq('id', el.dataset.id); if (r.error) { toast('Güncellenemedi.', 'bad'); return; } RBK.reqs = RBK.reqs.filter((x) => String(x.id) !== String(el.dataset.id)); render(); toast('Talep reddedildi. Müşteriyi aramayı unutma.', 'ok'); };
H.bkok = async (el) => {
  if (!rbCan()) return; const q = RBK.reqs.find((x) => String(x.id) === String(el.dataset.id)); if (!q) return;
  const m = { date: q.date, time: q.time, dur: RCFG.dur || 90, n: q.n, tid: 'auto' }; const c = rzCheck(m);
  if (!c.res) { toast('O saatte uygun masa yok. Müşteriyi arayıp başka saat öner veya reddet.', 'warn'); return; }
  const r = await sbClient().from('booking_requests').update({ status: 'onaylandi' }).eq('id', q.id).eq('status', 'bekliyor'); if (r.error) { toast('Güncellenemedi.', 'bad'); return; }
  RESV.push({ id: 'r' + (++seq), name: q.name, phone: q.phone, n: q.n, date: q.date, time: q.time, dur: m.dur, tids: c.res, src: 'Online', note: q.note || '', st: 'onay', by: S.user.id });
  RBK.reqs = RBK.reqs.filter((x) => x.id !== q.id); S.rzDate = q.date; pSched(); render(); toast('Onaylandı, masa ' + rzNames(c.res) + '. Müşteriyi arayıp teyit et.', 'ok');
};

/* qrcode-generator (MIT, Kazuhiko Arase) */
const KQR = (function(){var module={exports:{}};var exports=module.exports;var define=undefined;var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1})},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(o*r,n*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}(function(){return qrcode});

return module.exports;})();

