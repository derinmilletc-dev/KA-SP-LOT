/* ===== v130: Boş durum ekranları (stok, satın alma) + muhasebeci ana sayfa sırası ===== */
(function () { try { const st = document.createElement('style'); st.textContent = `
.ep{text-align:center;border:1px dashed #C9D6EA;background:linear-gradient(180deg,#F7FAFF,#fff);border-radius:24px;padding:28px 20px 22px;animation:ppIn .5s cubic-bezier(.2,.8,.2,1) both}
.ep-i{width:64px;height:64px;border-radius:20px;margin:0 auto 14px;display:grid;place-items:center;color:#fff;background:linear-gradient(160deg,#2A7FDB,#0A3F7A);box-shadow:0 14px 26px -12px rgba(10,63,122,.6)}
.ep h3{margin:0 0 6px;font:800 20px system-ui;letter-spacing:-.01em;color:#0E2B4D}.ep p{margin:0 auto 16px;max-width:300px;font:500 14px/1.45 system-ui;color:#5B6B82}
.ep-b{display:flex;flex-direction:column;gap:8px}.ep-b button{border:0;border-radius:14px;padding:13px;font:700 14px system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;background:#EEF3FB;color:#1B5FB8}.ep-b button.pri{background:#1B5FB8;color:#fff}
.ep-s{display:flex;justify-content:center;gap:14px;margin-top:14px;font:600 12px system-ui;color:#7A8AA0}.ep-s span{display:flex;align-items:center;gap:5px}
`; document.head.appendChild(st); } catch (e) {} })();
const epCard = (ico, title, text, btns, steps) => `<section class="ep"><div class="ep-i">${ic(ico, 30)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="ep-b">${btns.map((x, i) => `<button type="button" class="${i ? '' : 'pri'}" data-a="${x[0]}"${x[2] ? ' data-v="' + x[2] + '"' : ''}>${ic(x[3] || 'plus', 16)}${esc(x[1])}</button>`).join('')}</div>${steps ? `<div class="ep-s">${steps.map((t, i) => `<span>${i + 1}. ${esc(t)}</span>`).join('')}</div>` : ''}</section>`;
const viewStokV130 = viewStok;
viewStok = function () {
  if (STOCK.length) return viewStokV130();
  const canAdd = !S.user || ['patron', 'mudur'].includes(S.user.role);
  return `<div class="stack-lg"><div><h2>Stok</h2><p class="muted" style="margin-top:4px">Ne kadar kaldı, ne zaman biter, ne alınmalı.</p></div>${epCard('box', 'Stoğunu birkaç dakikada kur', 'Ürünlerini ekle. Kais azalanları sana söyler ve siparişi hazırlar.', canAdd ? [['stkadd', 'Ürün ekle', '', 'plus'], ['stkbulk', 'Excel ya da listeden aktar', '', 'file'], ['cntphoto', 'Raf fotoğrafı at, Kais saysın', '', 'sparkle']] : [], ['Ekle', 'Say', 'Kais uyarır'])}</div>`;
};
const viewSatinAlmaV130 = viewSatinAlma;
viewSatinAlma = function () {
  if (STOCK.length) return viewSatinAlmaV130();
  return `<div class="stack-lg"><div><h2>Satın alma</h2><p class="muted" style="margin-top:4px">Stok, satış ve reçetelerden hesaplanır. Kais önerir, sipariş sende onaylanır.</p></div>${epCard('box', 'Önce stoğunu ekle', 'Ürünlerin olunca Kais neyin ne zaman biteceğini hesaplar ve tedarikçi fiyatlarını karşılaştırır.', [['nav', 'Stoğa git', 'stok', 'box']], ['Stok ekle', 'Fiyat gir', 'Karşılaştır'])}</div>`;
};
const kbTidyV130 = kbTidy;
kbTidy = function () { const r = kbTidyV130.apply(this, arguments); try { const m = document.querySelector('main'); if (m && S.user && S.user.role === 'muhasebeci' && S.view === 'donem') { const mc = m.querySelector('.mc'); const hd = mc && mc.querySelector('.mc-hd'); const hero = mc && mc.querySelector('.mc-hero'); if (hd && hero && hd.nextElementSibling !== hero) { hd.after(hero); const tasks = mc.querySelector('.mc-s'); if (tasks) hero.after(tasks); const kz = m.querySelector('.kz'); if (kz && kz.parentElement) { const d = kz.parentElement; if (d === mc || d === m) { const w = document.createElement('div'); w.style.marginTop = '12px'; d.appendChild(kz); } } } } } catch (e) {} return r; };

/* ===== v131: dokunma alanı, taşma ===== */
(function () { try { const st = document.createElement('style'); st.textContent = `
.rz2,.rz2-l,.rz2-r,.rz2-l>*{min-width:0;max-width:100%}.rz-card,.rz-free{max-width:100%;box-sizing:border-box}
.hit{position:relative}.hit::after{content:"";position:absolute;left:-6px;right:-6px;top:-6px;bottom:-6px}
`; document.head.appendChild(st); } catch (e) {} })();
function hitFix() { try { document.querySelectorAll('main button,main .sw,main [data-a],header button').forEach((e) => { if (e.classList.contains('hit')) return; const r = e.getBoundingClientRect(); if (!r.width || !r.height || (r.width >= 40 && r.height >= 40)) return; if (getComputedStyle(e).position !== 'static') return; e.classList.add('hit'); }); } catch (x) {} }
{ const _r = render; render = function () { const r = _r.apply(this, arguments); hitFix(); return r; }; }

/* ===== v131: Menü grupları + arama ===== */
(function () { try { const st = document.createElement('style'); st.textContent = `
.mn-q{width:100%;box-sizing:border-box;border:1px solid #DCE5F2;background:#F6F9FE;border-radius:14px;padding:11px 14px;font:500 14px system-ui;margin:10px 0 4px;outline:0}.mn-q:focus{border-color:#1B5FB8;box-shadow:0 0 0 3px rgba(27,95,184,.15)}
.mn-g{margin-top:12px}.mn-g>small{display:block;font:700 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#7A8AA0;margin:0 2px 6px}
.mn-t{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mn-t button{display:flex;align-items:center;gap:9px;border:1px solid #E1E8F3;background:#fff;border-radius:14px;padding:12px;font:600 13.5px system-ui;color:#0E2B4D;cursor:pointer;text-align:left;min-height:48px}.mn-t button:active{transform:scale(.97)}.mn-t button .ic{flex:0 0 auto;color:#1B5FB8}
.mn-t{grid-template-columns:repeat(2,minmax(0,1fr))}.mn-t button{min-width:0;align-items:center;gap:11px;padding:11px;border-radius:16px;min-height:62px;box-shadow:0 1px 0 rgba(14,43,77,.03)}.mn-ic{flex:0 0 38px;height:38px;border-radius:12px;display:grid;place-items:center}.mn-ic .ic{color:inherit!important}.mn-tx{min-width:0}.mn-tx b{display:block;font:700 13.5px/1.2 system-ui;color:#0E2B4D}.mn-tx small{display:block;font:500 11.5px/1.3 system-ui;color:#7A8AA0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mn-pf{background:linear-gradient(135deg,#F2F7FE,#fff);border:1px solid #E1E8F3;border-radius:18px;padding:12px 14px}.mn-pf .avatar{box-shadow:0 8px 16px -8px rgba(15,76,154,.7)}
.mn-g>small{letter-spacing:.08em}
.mn-ft{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}.mn-ft button{display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #E1E8F3;background:#fff;border-radius:14px;padding:12px;font:600 13.5px system-ui;color:#0E2B4D;cursor:pointer}.mn-ft button.out{color:#C0392B;border-color:#F3D4D0;background:#FFF8F7}.mn-ft button.out .ic{color:inherit}
.mn-e{display:none;text-align:center;color:#7A8AA0;font:500 13px system-ui;padding:14px}
`; document.head.appendChild(st); } catch (e) {} })();
{
  const MN_G = { satis: 'Satış ve tedarik', ebelge: 'Satış ve tedarik', satinalma: 'Satış ve tedarik', stok: 'Satış ve tedarik', borc: 'Satış ve tedarik', paket: 'Satış ve tedarik', rezerv: 'Yönetim', ops: 'Yönetim', musteri: 'Yönetim', duyuru: 'Yönetim', ayarlar: 'Yönetim', kaisai: 'Kais', sartlar: 'Yasal' };
  const MN_S = { stok: 'Ne kaldı, ne biter', satis: 'Ciro ve maliyet', ebelge: 'Fatura hazırlığı', satinalma: 'Sipariş ve fiyat', borc: 'Borç ve alacak', paket: 'Aylık dosya', rezerv: 'Masa ve saat', ops: 'Günlük işleyiş', musteri: 'Liste ve kampanya', duyuru: 'Ekibe mesaj', ayarlar: 'Hesap ve ekip', kaisai: 'Yapay zekâ asistan', sartlar: 'KVKK ve sözleşme' };
  const MN_C = { 'Satış ve tedarik': ['#E8F1FD', '#1B5FB8'], 'Yönetim': ['#E3F6F3', '#128C84'], 'Kais': ['#EFE9FD', '#6B47D6'], 'Yasal': ['#EEF1F5', '#5B6B82'], 'Diğer': ['#EEF1F5', '#5B6B82'] };
  const _rm2 = renderModal;
  renderModal = function () {
    _rm2.apply(this, arguments); const m = S.modal; const root = $('#modal-root'); if (!root || !m || m.type !== 'menu' || root.querySelector('.mn-g')) return;
    try {
      const btns = Array.from(root.querySelectorAll('.sheet button[data-a="nav"]')); if (!btns.length) return;
      const groups = {}; btns.forEach((b) => { const g = MN_G[b.dataset.v] || 'Diğer'; (groups[g] = groups[g] || []).push(b); });
      const order = ['Satış ve tedarik', 'Yönetim', 'Kais', 'Yasal', 'Diğer'].filter((g) => groups[g]);
      const wrap = document.createElement('div'); wrap.className = 'mn';
      if (btns.length > 5) { const q = document.createElement('input'); q.className = 'mn-q'; q.type = 'search'; q.placeholder = 'Menüde ara'; q.setAttribute('aria-label', 'Menüde ara'); wrap.appendChild(q); q.addEventListener('input', () => { const t = q.value.trim().toLocaleLowerCase('tr-TR'); let any = false; wrap.querySelectorAll('.mn-g').forEach((g) => { let n = 0; g.querySelectorAll('button').forEach((b) => { const ok = !t || b.textContent.toLocaleLowerCase('tr-TR').includes(t); b.style.display = ok ? '' : 'none'; if (ok) n++; }); g.style.display = n ? '' : 'none'; if (n) any = true; }); e.style.display = any ? 'none' : 'block'; }); }
      order.forEach((g) => { const d = document.createElement('div'); d.className = 'mn-g'; d.innerHTML = order.length > 1 ? `<small>${g}</small>` : ''; const t = document.createElement('div'); t.className = 'mn-t'; groups[g].forEach((b) => { const svg = b.querySelector('svg'); const lab = b.textContent.trim(); const c = MN_C[g] || MN_C['Diğer']; b.className = ''; b.innerHTML = `<span class="mn-ic" style="background:${c[0]};color:${c[1]}">${svg ? svg.outerHTML : ''}</span><span class="mn-tx"><b>${esc(lab)}</b><small>${esc(MN_S[b.dataset.v] || '')}</small></span>`; t.appendChild(b); }); d.appendChild(t); wrap.appendChild(d); });
      const e = document.createElement('div'); e.className = 'mn-e'; e.textContent = 'Eşleşen bir şey yok.'; wrap.appendChild(e);
      const lo = root.querySelector('[data-a="logout"]'); if (lo) lo.parentNode.insertBefore(wrap, lo); const pf = root.querySelector('.sheet .row'); if (pf) pf.classList.add('mn-pf'); const pw = root.querySelector('[data-a="pwopen"]'); const ft = document.createElement('div'); ft.className = 'mn-ft'; if (pw) { pw.className = ''; pw.innerHTML = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Şifreni değiştir'; ft.appendChild(pw); } if (lo) { lo.className = 'out'; ft.appendChild(lo); } wrap.after(ft);
      const pp = root.querySelector('.sheet p.small.muted'); if (pp && /Prototip/.test(pp.textContent)) { if (SBS && SBS.user) pp.remove(); else pp.textContent = 'Demo sürüm. Ekrandaki veriler örnektir.'; }
    } catch (x) {}
  };
}

/* ===== v131: Fiyat listesi sonucu: eski fiyatla fark, eşleşmeyen satır uyarısı, satırı çıkar ===== */
(function () { try { const st = document.createElement('style'); st.textContent = '.pl-r.pl-un{background:#FFF8E6;border-radius:12px}.pl-h{display:block;font:600 11.5px system-ui;margin-top:2px;color:#6B7A90}.pl-h.up{color:#C0392B}.pl-h.dn{color:#1E9E5A}.pl-h.nw{color:#B26A00}.pl-x{border:0;background:#EEF3FB;color:#6B7A90;border-radius:9px;width:30px;height:30px;font:700 15px system-ui;cursor:pointer;flex:none}.pl-r.pl-gone{display:none}.pl-l .pl-r{display:grid!important;grid-template-columns:1fr 96px 30px;grid-template-areas:"n n x" "s p p";gap:8px;align-items:center;padding:10px}.pl-r .pl-n{grid-area:n}.pl-r select{grid-area:s;min-width:0;width:100%}.pl-r input{grid-area:p;min-width:0;width:100%}.pl-r .pl-x{grid-area:x}'; document.head.appendChild(st); } catch (e) {} })();
{
  const _rm3 = renderModal;
  renderModal = function () {
    _rm3.apply(this, arguments); const m = S.modal; const root = $('#modal-root'); if (!root || !m || m.type !== 'pl' || m.step !== 'res') return;
    try {
      const sup = SUPPLIERS.find((t) => t.id === PL.sup);
      const upd = (i) => {
        const row = root.querySelectorAll('.pl-r')[i]; if (!row) return; const sel = document.getElementById('pl-m' + i); const inp = document.getElementById('pl-p' + i); const nm = row.querySelector('.pl-n');
        let h = nm.querySelector('.pl-h'); if (!h) { h = document.createElement('span'); h.className = 'pl-h'; nm.appendChild(h); }
        const v = trNum(inp.value); const old = sup && sel.value && sup.items && sup.items[sel.value];
        row.classList.toggle('pl-un', !sel.value);
        if (!sel.value) { h.className = 'pl-h nw'; h.textContent = 'Eşleşmedi. Ürün seç ya da atla'; }
        else if (old > 0 && v > 0) { const d = Math.round((v / old - 1) * 100); h.className = 'pl-h ' + (d > 0 ? 'up' : d < 0 ? 'dn' : ''); h.textContent = d === 0 ? 'Fiyat aynı' : 'Eski ' + fmt(old) + ' ' + (d > 0 ? '↑ %' : '↓ %') + Math.abs(d); }
        else { h.className = 'pl-h'; h.textContent = old > 0 ? '' : 'Yeni fiyat'; }
      };
      root.querySelectorAll('.pl-r').forEach((row, i) => {
        upd(i); const sel = document.getElementById('pl-m' + i), inp = document.getElementById('pl-p' + i); if (!sel || !inp) return;
        sel.addEventListener('change', () => upd(i)); inp.addEventListener('input', () => upd(i));
        const x = document.createElement('button'); x.type = 'button'; x.className = 'pl-x'; x.setAttribute('aria-label', 'Satırı çıkar'); x.textContent = '×'; x.addEventListener('click', () => { sel.value = ''; row.classList.add('pl-gone'); });
        row.appendChild(x);
      });
    } catch (e) {}
  };
}

/* ===== v131: Hata mesajları Türkçe ===== */
function trErr(m) {
  m = String(m || '');
  if (!m) return 'Bağlanılamadı. İnternetini kontrol edip tekrar dene.';
  if (/failed to fetch|networkerror|network request|load failed|fetch failed|timeout|timed out/i.test(m)) return 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.';
  if (/password should be at least|weak_password|password.*(short|weak)/i.test(m)) return 'Şifre en az 6 karakter olmalı. Harf ve rakam karışık yaparsan daha güvenli olur.';
  if (/unable to validate email|invalid email|email address.*invalid|invalid format/i.test(m)) return 'E-posta adresi geçerli görünmüyor. Yazımı kontrol et.';
  if (/signups? not allowed|signup.*disabled/i.test(m)) return 'Şu an yeni kayıt alınmıyor. Biraz sonra tekrar dene.';
  if (/rate limit|too many|over_.*_rate/i.test(m)) return 'Kısa sürede çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar dene.';
  if (/same password|different from the old/i.test(m)) return 'Yeni şifren eskisinden farklı olmalı.';
  if (/session.*(expired|missing)|jwt expired|refresh token/i.test(m)) return 'Oturumun sona erdi. Tekrar giriş yap.';
  if (/user not found|no user/i.test(m)) return 'Bu e-postayla kayıtlı bir hesap bulamadım.';
  if (/[a-z]{4,} [a-z]{3,} [a-z]{3,}/i.test(m) && !/[çğıöşüÇĞİÖŞÜ]/.test(m)) return 'Bir sorun oluştu. Tekrar dene, sürerse bize yaz.';
  return m;
}

/* ===== v132: Tablo (Excel görünümü) modern ve düzenli; iç içe kaydırma hatası düzeltildi ===== */
{ const _cap = capLists; capLists = function (root) { _cap(root); try { document.querySelectorAll('.cap-sc[data-capd]').forEach((el) => { if (el.classList.contains('fk-l')) return; const k = new Set(Array.from(el.children).map((c) => c.tagName + '.' + String(c.className).split(' ')[0])); if (k.size > 3) { el.style.maxHeight = ''; el.style.overflowY = ''; el.classList.remove('cap-sc'); } }); } catch (e) {} }; }
(function () { try { const st = document.createElement('style'); st.textContent = `
.tb .xl{max-height:min(70vh,620px);overflow:auto;border:1px solid #E1E8F3;border-radius:18px;background:#fff;box-shadow:0 10px 26px -18px rgba(14,43,77,.35);-webkit-overflow-scrolling:touch}
.tb .xt{min-width:880px;border-collapse:separate;border-spacing:0;font-size:13.5px;font-variant-numeric:tabular-nums}
.tb .xt th{position:sticky;top:0;z-index:3;background:#F3F7FC;color:#5B6B82;font:700 11px system-ui;letter-spacing:.06em;text-transform:uppercase;padding:12px 10px;border-bottom:1px solid #E1E8F3}
.tb .xt td{border-top:0;border-bottom:1px solid #EEF2F8;padding:3px 4px;background:#fff;height:46px}
.tb .xt tbody tr:nth-child(even) td{background:#FAFCFF}
.tb .xt tbody tr:hover td{background:#F1F6FE}
.tb .xt tr.fresh td{background:#F0FAF4!important}
.tb .xt th:nth-child(1),.tb .xt td:nth-child(1){position:sticky;left:0;z-index:2;min-width:86px;max-width:86px}
.tb .xt th:nth-child(2),.tb .xt td:nth-child(2){position:sticky;left:86px;z-index:2;box-shadow:6px 0 8px -6px rgba(14,43,77,.18)}
.tb .xt th:nth-child(1),.tb .xt th:nth-child(2){z-index:4}
.tb .xt input.cell,.tb .xt select.cell{border-radius:9px;min-height:36px;padding:4px 8px;color:#0E2B4D;font:600 13.5px system-ui}
.tb .xt input.cell[data-k=date]{font-weight:500;color:#5B6B82}
.tb .xt .cell:hover{border-color:#D2DDEC;background:#fff}
.tb .xt .cell:focus{border-color:#1B5FB8;background:#fff;outline:0;box-shadow:0 0 0 3px rgba(27,95,184,.15)}
.tb .xt td.num{font-weight:600;color:#3B4A63}
.tb .xt input.cell.r[data-k=total]{font-weight:800}
.tb .xt tfoot td{position:sticky;bottom:0;z-index:3;background:#F3F7FC;border-top:1px solid #DCE5F2;border-bottom:0;font:800 13.5px system-ui;color:#0E2B4D;height:46px}
.tb .xt tfoot td:nth-child(1){left:0;z-index:4}
.tb .xt tr.mis td{box-shadow:inset 3px 0 0 #E8A317}
.tb .xt .xbtn{opacity:.55;transition:opacity .15s}.tb .xt tr:hover .xbtn{opacity:1}
@media(max-width:600px){.tb .xt th:nth-child(1),.tb .xt td:nth-child(1){position:static;min-width:72px;max-width:72px}.tb .xt th:nth-child(2),.tb .xt td:nth-child(2){left:0}.tb .xt input.cell[data-k=desc]{width:150px!important}.tb .xt tfoot td:nth-child(1){left:auto;position:static}}
`; document.head.appendChild(st); } catch (e) {} })();

/* ===== v133: Akıllı Excel: Özet sayfası, tablolar, formüller, açılır listeler; arka planda buluta kaydedilir ===== */
const XL = { lib: null, hash: '', busy: false, off: false, at: '', err: '', url: 'vendor/exceljs-4.4.0/exceljs.min.js' };
function xlLoad() {
  if (typeof ExcelJS !== 'undefined') return Promise.resolve(ExcelJS);
  if (XL.lib) return XL.lib;
  XL.lib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = XL.url; s.onload = () => (typeof ExcelJS !== 'undefined' ? res(ExcelJS) : rej(new Error('ExcelJS yok'))); s.onerror = () => { XL.lib = null; rej(new Error('Excel kitaplığı yüklenemedi')); }; document.head.appendChild(s); });
  return XL.lib;
}
const XL_AY = { oca: 0, şub: 1, sub: 1, mar: 2, nis: 3, may: 4, haz: 5, tem: 6, ağu: 7, agu: 7, eyl: 8, eki: 9, kas: 10, ara: 11 };
function xlDate(str) { const m = /^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})$/.exec(String(str || '').trim()); if (!m) return String(str || ''); const k = XL_AY[m[2].toLocaleLowerCase('tr-TR').slice(0, 3)]; return k === undefined ? String(str) : new Date(Date.UTC(+m[3], k, +m[1])); }
async function xlBuild() {
  const E = await xlLoad(); const wb = new E.Workbook(); wb.creator = 'KaisPilot'; wb.created = new Date(); wb.calcProperties = { fullCalcOnLoad: true };
  const NAVY = 'FF0F3F7A', SOFT = 'FFEAF1FB', INK = 'FF0E2B4D', MUT = 'FF5B6B82'; const TRY = '#,##0.00 "₺"';
  const now = new Date(); const stamp = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const led = (k) => LEDGER.filter((r) => dirOf(r) === k); const rate = (r) => Number(r.rate) || 0; const kd = (r) => (Number(r.total) || 0) - (Number(r.total) || 0) / (1 + rate(r) / 100);
  const periods = []; LEDGER.forEach((r) => { const p = lper(r); if (!periods.includes(p)) periods.push(p); });
  const cats = CATS.slice(); LEDGER.forEach((r) => { if (r.acc && !cats.includes(r.acc)) cats.push(r.acc); });
  const sumOf = (list, f) => list.reduce((a, r) => a + f(r), 0);
  // Özet
  const sm = wb.addWorksheet('Özet', { properties: { tabColor: { argb: NAVY } }, views: [{ showGridLines: false }] });
  sm.columns = [{ width: 24 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
  sm.mergeCells('A1:F1'); sm.getCell('A1').value = BIZ + ' · Muhasebe özeti'; sm.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; sm.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; sm.getCell('A1').alignment = { vertical: 'middle', indent: 1 }; sm.getRow(1).height = 38;
  sm.mergeCells('A2:F2'); sm.getCell('A2').value = 'Güncellendi: ' + stamp + ' · KaisPilot tarafından otomatik hazırlanır. Gelirler ve Giderler sayfalarındaki tablolar buraya kendiliğinden yansır.'; sm.getCell('A2').font = { size: 10, color: { argb: MUT } }; sm.getCell('A2').alignment = { indent: 1, wrapText: true }; sm.getRow(2).height = 28;
  const inn = sumOf(led('gelir'), (r) => Number(r.total) || 0), out = sumOf(led('gider'), (r) => Number(r.total) || 0), kin = sumOf(led('gelir'), kd), kout = sumOf(led('gider'), kd);
  const kp = [['Toplam gelir', 'SUM(Gelirler!H:H)', inn], ['Toplam gider', 'SUM(Giderler!H:H)', out], ['Net durum', 'B5-C5', inn - out], ['Hesaplanan KDV', 'SUM(Gelirler!G:G)', kin], ['İndirilecek KDV', 'SUM(Giderler!G:G)', kout]];
  sm.getRow(4).height = 22; sm.getRow(5).height = 30;
  kp.forEach((x, i) => { const c = sm.getCell(4, i + 2), v = sm.getCell(5, i + 2); c.value = x[0]; c.font = { size: 10, bold: true, color: { argb: MUT } }; c.alignment = { horizontal: 'center', vertical: 'bottom' }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; v.value = { formula: x[1], result: x[2] }; v.numFmt = TRY; v.font = { size: 14, bold: true, color: { argb: i === 2 ? (x[2] >= 0 ? 'FF1E9E5A' : 'FFC0392B') : INK } }; v.alignment = { horizontal: 'center', vertical: 'middle' }; v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; });
  sm.getCell('A4').value = 'Dönem toplamı'; sm.getCell('A4').font = { bold: true, color: { argb: MUT }, size: 10 }; sm.getCell('A5').value = 'Tüm veriler'; sm.getCell('A5').font = { bold: true, color: { argb: INK } };
  let r0 = 8; sm.getCell('A' + (r0 - 1)).value = 'Aylık özet'; sm.getCell('A' + (r0 - 1)).font = { size: 13, bold: true, color: { argb: INK } };
  const hdr = (ws, row, vals) => { vals.forEach((v, i) => { const c = ws.getCell(row, i + 1); c.value = v; c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; c.alignment = { vertical: 'middle', horizontal: i ? 'right' : 'left', indent: i ? 0 : 1 }; }); ws.getRow(row).height = 24; };
  hdr(sm, r0, ['Dönem', 'Gelir', 'Gider', 'Net', 'Gelir KDV', 'Gider KDV']);
  periods.forEach((p, i) => { const rw = r0 + 1 + i; const g = led('gelir').filter((r) => lper(r) === p), d = led('gider').filter((r) => lper(r) === p); const gi = sumOf(g, (r) => Number(r.total) || 0), gd = sumOf(d, (r) => Number(r.total) || 0);
    sm.getCell('A' + rw).value = p; sm.getCell('A' + rw).alignment = { indent: 1 }; sm.getCell('A' + rw).font = { bold: true, color: { argb: INK } };
    const f = [[`SUMIFS(Gelirler!H:H,Gelirler!A:A,$A${rw})`, gi], [`SUMIFS(Giderler!H:H,Giderler!A:A,$A${rw})`, gd], [`B${rw}-C${rw}`, gi - gd], [`SUMIFS(Gelirler!G:G,Gelirler!A:A,$A${rw})`, sumOf(g, kd)], [`SUMIFS(Giderler!G:G,Giderler!A:A,$A${rw})`, sumOf(d, kd)]];
    f.forEach((x, j) => { const c = sm.getCell(rw, j + 2); c.value = { formula: x[0], result: x[1] }; c.numFmt = TRY; c.border = { bottom: { style: 'thin', color: { argb: 'FFE3E9F2' } } }; }); sm.getCell('A' + rw).border = { bottom: { style: 'thin', color: { argb: 'FFE3E9F2' } } }; });
  const pe = r0 + periods.length; if (periods.length) { try { sm.addConditionalFormatting({ ref: `D${r0 + 1}:D${pe}`, rules: [{ type: 'cellIs', operator: 'lessThan', formulae: [0], style: { font: { color: { argb: 'FFC0392B' }, bold: true } } }, { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [0], style: { font: { color: { argb: 'FF1E9E5A' }, bold: true } } }] }); } catch (e) {} }
  let r1 = pe + 3; sm.getCell('A' + (r1 - 1)).value = 'Gider dağılımı (hesaba göre)'; sm.getCell('A' + (r1 - 1)).font = { size: 13, bold: true, color: { argb: INK } };
  hdr(sm, r1, ['Hesap', 'Tutar', 'Pay']); const gd = led('gider'); const used = cats.filter((c) => gd.some((r) => r.acc === c));
  used.forEach((c, i) => { const rw = r1 + 1 + i; const v = sumOf(gd.filter((r) => r.acc === c), (r) => Number(r.total) || 0); sm.getCell('A' + rw).value = c; sm.getCell('A' + rw).alignment = { indent: 1 }; sm.getCell('B' + rw).value = { formula: `SUMIFS(Giderler!H:H,Giderler!D:D,$A${rw})`, result: v }; sm.getCell('B' + rw).numFmt = TRY; sm.getCell('C' + rw).value = { formula: `IFERROR(B${rw}/$C$5,0)`, result: out ? v / out : 0 }; sm.getCell('C' + rw).numFmt = '0%'; ['A', 'B', 'C'].forEach((l) => { sm.getCell(l + rw).border = { bottom: { style: 'thin', color: { argb: 'FFE3E9F2' } } }; }); });
  sm.getCell('C5').value = { formula: 'SUM(Giderler!H:H)', result: out }; sm.getCell('C5').numFmt = TRY;
  if (used.length) { try { sm.addConditionalFormatting({ ref: `B${r1 + 1}:B${r1 + used.length}`, rules: [{ type: 'dataBar', gradient: false, cfvo: [{ type: 'num', value: 0 }, { type: 'max' }], color: { argb: 'FF9FC5F8' } }] }); } catch (e) {} }
  // Liste sayfası (açılır liste kaynakları)
  const ls = wb.addWorksheet('Listeler', { state: 'hidden' }); ls.getCell('A1').value = 'Hesap'; cats.forEach((c, i) => { ls.getCell('A' + (i + 2)).value = c; }); ls.getCell('B1').value = 'Belge'; const docs = ['Fatura', 'E-arşiv', 'Fiş', 'Z raporu', 'Gider pusulası', 'Serbest meslek makbuzu']; LEDGER.forEach((r) => { if (r.doc && !docs.includes(r.doc)) docs.push(r.doc); }); docs.forEach((c, i) => { ls.getCell('B' + (i + 2)).value = c; }); ls.getCell('C1').value = 'KDV'; [0, 1, 10, 20].forEach((c, i) => { ls.getCell('C' + (i + 2)).value = c; });
  // Gelirler / Giderler
  const mk = (name, kind, tab) => {
    const list = led(kind); const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: tab } }, views: [{ state: 'frozen', ySplit: 1, xSplit: 3, showGridLines: false }] });
    const heads = ['Dönem', 'Tarih', 'Açıklama', 'Hesap', 'Belge', 'KDV %', 'KDV', 'Toplam', 'Kaynak', 'Not'];
    ws.columns = [{ width: 11 }, { width: 13 }, { width: 36 }, { width: 22 }, { width: 18 }, { width: 8 }, { width: 14 }, { width: 16 }, { width: 13 }, { width: 24 }];
    const row = (r) => [lper(r), xlDate(rDateY(r)), String(r.desc || ''), String(r.acc || ''), String(r.doc || ''), rate(r), kd(r), Number(r.total) || 0, r.edited ? 'Düzenlendi' : String(r.src || ''), (() => { try { return mismatch(r) ? 'Ekstre tutarı farklı' : ''; } catch (e) { return ''; } })()];
    if (list.length) {
      ws.addTable({ name: name + '_T', ref: 'A1', headerRow: true, totalsRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: heads.map((h, i) => ({ name: h, filterButton: true, totalsRowLabel: i === 0 ? 'Toplam' : undefined, totalsRowFunction: i === 6 || i === 7 ? 'sum' : undefined })), rows: list.map(row) });
      list.forEach((r, i) => { const rw = i + 2; ws.getCell('G' + rw).value = { formula: `H${rw}-H${rw}/(1+F${rw}/100)`, result: kd(r) }; });
      for (let c = 1; c <= 10; c++) { const hc = ws.getCell(1, c); hc.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }; hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; hc.alignment = { vertical: 'middle', horizontal: c >= 7 && c <= 8 ? 'right' : 'left' }; for (let rr = 2; rr <= list.length + 1; rr++) ws.getCell(rr, c).border = { bottom: { style: 'thin', color: { argb: 'FFE3E9F2' } } }; }
      const tr = list.length + 2; ws.getCell('G' + tr).value = { formula: `SUBTOTAL(109,G2:G${list.length + 1})`, result: sumOf(list, kd) }; ws.getCell('H' + tr).value = { formula: `SUBTOTAL(109,H2:H${list.length + 1})`, result: sumOf(list, (r) => Number(r.total) || 0) };
      ['G', 'H'].forEach((l) => { ws.getCell(l + tr).numFmt = TRY; ws.getCell(l + tr).font = { bold: true }; });
    } else { hdr(ws, 1, heads); }
    ws.getColumn('B').numFmt = 'dd.mm.yyyy'; ws.getColumn('G').numFmt = TRY; ws.getColumn('H').numFmt = TRY; ws.getColumn('F').numFmt = '"%"0'; ws.getRow(1).height = 26;
    try { ws.dataValidations.add('D2:D3000', { type: 'list', allowBlank: true, formulae: [`Listeler!$A$2:$A$${cats.length + 1}`], showErrorMessage: false }); ws.dataValidations.add('E2:E3000', { type: 'list', allowBlank: true, formulae: [`Listeler!$B$2:$B$${docs.length + 1}`], showErrorMessage: false }); ws.dataValidations.add('F2:F3000', { type: 'list', allowBlank: true, formulae: ['Listeler!$C$2:$C$5'], showErrorMessage: false }); } catch (e) {}
    try { ws.addConditionalFormatting({ ref: 'H2:H3000', rules: [{ type: 'dataBar', gradient: false, cfvo: [{ type: 'num', value: 0 }, { type: 'max' }], color: { argb: kind === 'gelir' ? 'FFB7E1C8' : 'FFF4C2BD' } }] }); } catch (e) {}
    return ws;
  };
  mk('Gelirler', 'gelir', 'FF1E9E5A'); mk('Giderler', 'gider', 'FFC0392B');
  // Diğer sayfalar
  const nm = (id) => (USERS.find((u) => u.id === id) || {}).name || id;
  const simple = (name, heads, rows, widths, tab) => { const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: tab || 'FF6B7A90' } }, views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] }); ws.columns = widths.map((w) => ({ width: w })); hdr(ws, 1, heads); rows.forEach((r, i) => { r.forEach((v, j) => { const c = ws.getCell(i + 2, j + 1); c.value = v; c.border = { bottom: { style: 'thin', color: { argb: 'FFE3E9F2' } } }; if (typeof v === 'number' && /tutar|maaş|net|brüt/i.test(heads[j])) c.numFmt = TRY; }); }); if (rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: heads.length } }; };
  try { simple('Çalışanlar', ['Ad', 'Görev', 'İşe giriş', 'Maaş (net)', 'Haftalık saat', 'Maaş günü', 'Sözleşme'], EMP_IDS.map((id) => { const p = PROFILES[id]; return [nm(id), (USERS.find((u) => u.id === id) || {}).title || '', String(p.hire || ''), Number(p.salary) || 0, p.hours, p.payday, p.contract ? 'Yüklü' : 'Eksik']; }), [22, 16, 14, 16, 14, 12, 12]); } catch (e) {}
  try { simple('Maaş ödemeleri', ['Ad', 'Tür', 'Dönem', 'Tutar', 'Tarih'], PAYS.map((p) => [nm(p.uid), p.kind === 'maas' ? 'Maaş' : p.kind === 'avans' ? 'Avans' : String(p.kind), String(p.per), Number(p.amt) || 0, String(p.date)]), [22, 12, 14, 16, 12]); } catch (e) {}
  try { simple('Borçlar', ['Kime', 'Not', 'Vade', 'Tutar', 'Durum'], allDebts().map((d) => [String(d.who), String(d.note || ''), String(d.due || ''), Number(d.amt) || 0, d.paid ? 'Ödendi' : 'Açık']), [26, 36, 12, 16, 12]); } catch (e) {}
  try { simple('Alacaklar', ['Kimden', 'Not', 'Gün', 'Tutar', 'Durum'], RECV.map((a) => [String(a.name), String(a.note || ''), a.days, Number(a.amt) || 0, a.paid ? 'Tahsil edildi' : 'Açık']), [26, 30, 8, 16, 14]); } catch (e) {}
  return wb;
}
async function xlBlob() { const wb = await xlBuild(); const buf = await wb.xlsx.writeBuffer(); return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); }
xlsxBtn = function () { return '<button class="btn sec sm" data-a="xlsx">' + ic('file', 16) + ' Excel indir</button>'; };
H.xlsx = async (el) => {
  const b = el && el.closest && el.closest('button'); if (b) { b.disabled = true; b.dataset.t = b.innerHTML; b.textContent = 'Hazırlanıyor…'; }
  try { const bl = await xlBlob(); await saveBlob('kaispilot-muhasebe-' + REF_ISO.slice(0, 7) + '.xlsx', bl); toast('Excel dosyası hazır.', 'ok'); }
  catch (e) { try { await saveBlob('kaispilot-muhasebe-' + REF_ISO.slice(0, 7) + '.xlsx', new Blob(buildXlsx(), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); toast('Excel dosyası hazır.', 'ok'); } catch (x) { toast('Excel indirilemedi.', 'warn'); } }
  if (b) { b.disabled = false; b.innerHTML = b.dataset.t || 'Excel indir'; }
};
/* arka planda buluta kaydet */
const xlRole = () => !!(S.user && ['patron', 'muhasebeci'].includes(S.user.role));
function xlSig() { try { return LEDGER.length + ':' + JSON.stringify(LEDGER).length + ':' + simpleHash(JSON.stringify([LEDGER, PAYS.length, RECV.length])); } catch (e) { return String(Date.now()); } }
function simpleHash(t) { let h = 0; for (let i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) | 0; } return h; }
async function xlSync() {
  if (XL.busy || XL.off || !xlRole()) return; const c = sbOK() && sbClient(); if (!c || !SBS.user || !SBS.biz) return; const sig = xlSig(); if (sig === XL.hash) return;
  XL.busy = true;
  try { const bl = await xlBlob(); const r = await c.storage.from('muhasebe-excel').upload(SBS.biz.id + '/muhasebe.xlsx', bl, { upsert: true, contentType: bl.type }); if (r.error) throw r.error; XL.hash = sig; XL.at = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); XL.err = ''; const e = document.getElementById('xl-st'); if (e) e.textContent = 'Excel dosyan arka planda güncel · ' + XL.at; }
  catch (e) { const m = String((e && e.message) || e || ''); if (/bucket not found|not found|row-level|policy|permission|Unauthorized|403|404/i.test(m)) XL.off = true; XL.err = m; }
  XL.busy = false;
}
setInterval(() => { try { xlSync(); } catch (e) {} }, 12000); setTimeout(() => { try { xlSync(); } catch (e) {} }, 5000);
const tabloHTMLV133 = tabloHTML;
tabloHTML = function () { const h = tabloHTMLV133.apply(this, arguments); const cloud = !!(SBS && SBS.user && SBS.biz) && !XL.off; const line = cloud ? `<p class="small muted" id="xl-st" style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${XL.at ? '#1E9E5A' : '#E8A317'};display:inline-block"></span>${XL.at ? 'Excel dosyan arka planda güncel · ' + XL.at : 'Excel dosyan arka planda hazırlanıyor…'}</p>` : ''; return line ? h.replace('<div class="tb-act">', line + '<div class="tb-act">') : h; };

/* ===== v134: Belgeler: süzgeç, hızlı onay, toplu onay; çalışan ekranı çift selam düzeltmesi ===== */
(function () { try { const st = document.createElement('style'); st.textContent = `
.bgx{display:flex;gap:8px;align-items:center;overflow-x:auto;scrollbar-width:none;padding:2px 0 4px}.bgx::-webkit-scrollbar{display:none}
.bgx button{flex:0 0 auto;border:1px solid #DCE5F2;background:#fff;border-radius:99px;padding:8px 13px;font:600 13px system-ui;color:#0E2B4D;cursor:pointer;display:flex;align-items:center;gap:6px}
.bgx button[aria-pressed=true]{background:#0F3F7A;border-color:#0F3F7A;color:#fff}.bgx button em{font-style:normal;font:700 11px system-ui;background:rgba(15,63,122,.1);border-radius:99px;padding:1px 7px}.bgx button[aria-pressed=true] em{background:rgba(255,255,255,.22)}
.bgb{display:flex;gap:8px}.bgb button{flex:1;border:0;border-radius:14px;padding:12px;font:700 14px system-ui;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px}.bgb .pri{background:#1B5FB8;color:#fff}.bgb .pri:disabled{opacity:.45}
.bg[data-f=warn] .bg-c[data-w="0"],.bg[data-f=clean] .bg-c[data-w="1"]{display:none}
.bg-a .qk{background:#E8F1FD;color:#1B5FB8}
`; document.head.appendChild(st); } catch (e) {} })();
const bgWarn = (f) => { try { return bgFlags(f).some((x) => x[0] === 'warn'); } catch (e) { return false; } };
{ const _rr = receiptRow; receiptRow = function (f, role) { let h = _rr.apply(this, arguments); h = h.replace('<div class="bg-c ', '<div data-w="' + (bgWarn(f) ? 1 : 0) + '" class="bg-c '); if (role === 'muh' && f.status === 'musavirde' && !bgWarn(f)) h = h.replace(/(<button class="btn sm" data-a="review" data-id="[^"]+">[\s\S]*?<\/button>)/, `$1<button class="btn sm sec qk" data-a="bgqok" data-id="${f.id}">Hızlı onayla</button>`); return h; }; }
{ const _ib = inboxHTML; inboxHTML = function () { let h = _ib.apply(this, arguments); const inb = RECEIPTS.filter((f) => f.status === 'musavirde'); const w = inb.filter(bgWarn).length; const c = inb.length - w; const cur = S.bgf || 'all'; h = h.replace('<div class="stack-lg bg">', `<div class="stack-lg bg" data-f="${cur}">`);
  if (inb.length > 1) { const bar = `<div class="bgx" role="group" aria-label="Süz"><button type="button" data-a="bgf" data-v="all" aria-pressed="${cur === 'all'}">Hepsi <em>${inb.length}</em></button><button type="button" data-a="bgf" data-v="clean" aria-pressed="${cur === 'clean'}">Temiz <em>${c}</em></button><button type="button" data-a="bgf" data-v="warn" aria-pressed="${cur === 'warn'}">Kontrol gerekli <em>${w}</em></button></div>${c ? `<div class="bgb"><button type="button" class="pri" data-a="bgqall">${ic('check', 16)} Temiz ${c} belgeyi onayla</button></div>` : ''}`; h = h.replace('<section class="bg-s">', bar + '<section class="bg-s">'); }
  return h; }; }
H.bgf = (el) => { S.bgf = el.dataset.v; render(); };
function bgApprove(id) { const f = RECEIPTS.find((x) => x.id === id); if (!f || f.status !== 'musavirde') return false; S.modal = { type: 'rev', id: f.id, cat: f.cat, rate: f.rate, total: f.total, items: (f.items || []).map((i) => Object.assign({}, i)) }; H.revok(); return RECEIPTS.find((x) => x.id === id).status !== 'musavirde'; }
H.bgqok = (el) => { if (locked()) return; if (bgApprove(el.dataset.id)) toast('Onaylandı, gider tabloya yazıldı.', 'ok'); };
H.bgqall = () => { if (locked()) return; const ids = RECEIPTS.filter((f) => f.status === 'musavirde' && !bgWarn(f)).map((f) => f.id); let n = 0; ids.forEach((id) => { try { if (bgApprove(id)) n++; } catch (e) {} }); S.modal = null; render(); toast(n + ' belge onaylandı, giderler tabloya yazıldı.', 'ok'); };
{ const _bc2 = bugunCalisan; bugunCalisan = function () { const h = _bc2.apply(this, arguments); return h.replace(/<h2>Merhaba [^<]*<\/h2><p[^>]*>([^<]*?) · (Vardiya[^<]*)<\/p>/, '<h2>$2</h2><p>$1</p>'); }; }

/* ===== v134b: boş durumlar (masraf, paket) ve Kais AI para soruları ===== */
{ const _vm = viewMasraf; viewMasraf = function () { const mine = RECEIPTS.filter((f) => f.by === S.user.id); if (mine.length) return _vm.apply(this, arguments); return `<div class="stack-lg"><div><h2>Masraf fişlerim</h2><p class="muted small" style="margin-top:4px">Fişi çek, patronun onaylasın.</p></div>${epCard('receipt', 'Masrafını fotoğrafla', 'Fişin fotoğrafını çek. Kais okur, patronun onaylar, ödemen takip edilir.', [['upload', 'Fiş ekle', '', 'camera']], ['Çek', 'Onay', 'Ödeme'])}</div>`; }; }
{ const _vp = viewPaket; viewPaket = function () { if (LEDGER.length || ROWS.length) return _vp.apply(this, arguments); return `<div class="stack-lg"><div><h2>Aylık paket</h2><p class="muted small" style="margin-top:4px">Ayın belgeleri ve tabloları tek dosyada.</p></div>${epCard('file', 'Paket için veri bekleniyor', 'Belgeler onaylanıp ekstre gelince paket kendiliğinden hazırlanır. Eksik belge ve onay durumu burada görünür.', [['nav', 'Belgelere git', 'belgeler', 'receipt']], ['Belge', 'Ekstre', 'Paket'])}</div>`; }; }
['patron', 'muhasebeci'].forEach((k) => { if (AI_Q[k]) AI_Q[k] = ['Bu ay kâr mı zarar mı?', 'En çok harcadığım 3 kalem hangisi?', 'KDV tahminim ne kadar?'].concat(AI_Q[k].filter((q) => !/kâr mı zarar|en çok harcad|KDV tahmin/i.test(q))); });

/* ===== v135: Hesap, KDV ve Belge alanları: listeden seç ya da kendin yaz; yazdığın listeye eklenir ===== */
const CUSTOM = { acc: [], inc: [], doc: [], rate: [] }; P_OBJ.push(['CUSTOM', () => CUSTOM]);
const CB_DOCS = ['Fatura', 'E-arşiv', 'Fiş', 'Z raporu', 'Gider pusulası', 'Serbest meslek makbuzu', 'Ekstre', 'Belgesiz'];
function cbSync() { try { ['acc', 'inc', 'doc', 'rate'].forEach((k) => { if (!Array.isArray(CUSTOM[k])) CUSTOM[k] = []; }); CUSTOM.acc.forEach((c) => { if (!CATS.includes(c)) CATS.push(c); }); CUSTOM.inc.forEach((c) => { if (!INCATS.includes(c)) INCATS.push(c); }); } catch (e) {} }
const cbList = (k) => k === 'inc' ? INCATS : k === 'doc' ? CB_DOCS.concat(CUSTOM.doc, LEDGER.map((r) => r.doc).filter(Boolean)).filter((x, i, a) => a.indexOf(x) === i && x !== '—') : k === 'rate' ? [0, 1, 10, 20].concat(CUSTOM.rate.map(Number)).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b) : CATS;
function cbLearn(k, v) {
  v = String(v == null ? '' : v).trim(); if (!v) return false;
  if (k === 'rate') { const n = Number(String(v).replace(',', '.').replace('%', '')); if (!(n >= 0 && n <= 100)) return false; if (cbList('rate').includes(n)) return false; CUSTOM.rate.push(n); try { pSched(); } catch (e) {} toast('%' + n + ' KDV oranı listene eklendi.', 'ok'); return true; }
  if (cbList(k).some((x) => String(x).toLocaleLowerCase('tr-TR') === v.toLocaleLowerCase('tr-TR'))) return false;
  if (v.length > 40) return false; CUSTOM[k].push(v); cbSync(); try { pSched(); } catch (e) {} toast('"' + v + '" listene eklendi.', 'ok'); return true;
}
const cbKindOf = (el) => { const d = el.dataset || {}; if (d.k === 'doc') return 'doc'; if (d.k === 'rate') return 'rate'; if (d.k === 'acc') { const r = LEDGER.find((x) => x.id === d.id); return r && dirOf(r) === 'gelir' ? 'inc' : 'acc'; } if (d.ch === 'rcat' || d.ch === 'mcat' || d.ch === 'cat') return 'acc'; return null; };
(function () { try { const st = document.createElement('style'); st.textContent = `
.cb-in{width:100%;box-sizing:border-box}.cb-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-top:6px;padding-bottom:2px}.cb-chips::-webkit-scrollbar{display:none}
.cb-chips button{flex:0 0 auto;border:1px solid #DCE5F2;background:#fff;color:#0E2B4D;border-radius:99px;padding:6px 11px;font:600 12px system-ui;cursor:pointer}.cb-chips button.on{background:#0F3F7A;border-color:#0F3F7A;color:#fff}
.cb-hint{font:500 11.5px system-ui;color:#7A8AA0;margin-top:4px}
.cb-my{display:flex;align-items:center;gap:6px}.cb-my span{flex:1;font:600 14px system-ui;color:#0E2B4D}.cb-my button{border:0;background:#FDE7E5;color:#C0392B;border-radius:9px;width:32px;height:32px;font:700 16px system-ui;cursor:pointer}
`; document.head.appendChild(st); } catch (e) {} })();
function comboFix() {
  try {
    cbSync(); let host = document.getElementById('cb-lists'); if (!host) { host = document.createElement('div'); host.id = 'cb-lists'; host.hidden = true; document.body.appendChild(host); }
    host.innerHTML = [['acc', CATS], ['inc', INCATS], ['doc', cbList('doc')], ['rate', cbList('rate').map((x) => x)]].map(([k, l]) => `<datalist id="cb-${k}">${l.map((x) => `<option value="${esc(String(x))}"></option>`).join('')}</datalist>`).join('');
    const sels = document.querySelectorAll('main select[data-k="acc"], main select[data-k="rate"], #modal-root select[data-ch="rcat"], #modal-root select[data-ch="mcat"], main select[data-ch="cat"], #modal-root select[data-ch="cat"]');
    sels.forEach((sel) => {
      const k = cbKindOf(sel); if (!k) return; const inp = document.createElement('input'); inp.type = 'text'; inp.setAttribute('list', 'cb-' + k); inp.className = (sel.className ? sel.className + ' ' : '') + 'cb-in';
      Array.from(sel.attributes).forEach((a) => { if (!['class', 'type'].includes(a.name)) inp.setAttribute(a.name, a.value); });
      const op = sel.options[sel.selectedIndex]; let v = op ? (k === 'rate' ? op.value : op.text) : ''; inp.value = k === 'rate' ? String(v) : v; inp.placeholder = k === 'rate' ? 'Oran yaz' : 'Seç ya da yaz'; inp.autocomplete = 'off'; if (k === 'rate') inp.inputMode = 'decimal';
      sel.replaceWith(inp);
      if (inp.closest('.tb-f, .sheet') && !inp.closest('td')) { const row = document.createElement('div'); row.className = 'cb-chips'; (k === 'rate' ? cbList('rate') : cbList(k)).slice(0, 14).forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = k === 'rate' ? '%' + c : c; if (String(c) === String(inp.value)) b.className = 'on'; b.addEventListener('click', () => { inp.value = String(c); inp.dispatchEvent(new Event('change', { bubbles: true })); }); row.appendChild(b); }); inp.after(row); const h = document.createElement('div'); h.className = 'cb-hint'; h.textContent = 'Listede yoksa yaz, listene eklenir.'; row.after(h); }
    });
    document.querySelectorAll('main input[data-k="doc"]').forEach((i) => { i.setAttribute('list', 'cb-doc'); i.autocomplete = 'off'; });
  } catch (e) {}
}
{ const _r135 = render; render = function () { const r = _r135.apply(this, arguments); comboFix(); return r; }; }
{ const _rm135 = renderModal; renderModal = function () { const r = _rm135.apply(this, arguments); comboFix(); return r; }; }
{ let cbBusy = false; const _oc135 = onChange; onChange = function (e) { if (cbBusy) return; const el = e.target; let k = null; try { k = cbKindOf(el); } catch (x) {} if (k && el.tagName === 'INPUT') { const raw = String(el.value || '').trim(); if (k === 'rate') { const n = Number(raw.replace(',', '.').replace('%', '')); if (!(n >= 0 && n <= 100)) { toast('KDV oranı 0 ile 100 arasında olmalı.', 'warn'); return; } el.value = String(n); } if (!raw && k !== 'doc') return; cbLearn(k, raw); } cbBusy = true; try { return _oc135.apply(this, arguments); } finally { cbBusy = false; } }; }
/* Listelerim */
H.mylists = () => { S.modal = { type: 'mylists' }; renderModal(); };
H.mlrm = (el) => { const k = el.dataset.k, v = el.dataset.v; CUSTOM[k] = CUSTOM[k].filter((x) => String(x) !== v); if (k === 'acc') { const i = CATS.indexOf(v); if (i >= 0 && !LEDGER.some((r) => r.acc === v) && !RECEIPTS.some((r) => r.cat === v)) CATS.splice(i, 1); } if (k === 'inc') { const i = INCATS.indexOf(v); if (i >= 0 && !LEDGER.some((r) => r.acc === v)) INCATS.splice(i, 1); } try { pSched(); } catch (e) {} renderModal(); };
H.mladd = (el) => { const k = el.dataset.k; const inp = document.getElementById('ml-' + k); if (!inp) return; if (!cbLearn(k, inp.value)) { if (inp.value.trim()) toast('Bu zaten listede ya da geçersiz.', 'warn'); } renderModal(); };
NEWM.mylists = () => { const sec = (k, t, ph) => { const arr = CUSTOM[k] || []; return `<div class="field"><label>${t}</label>${arr.length ? arr.map((x) => `<div class="cb-my"><span>${k === 'rate' ? '%' : ''}${esc(String(x))}</span><button type="button" data-a="mlrm" data-k="${k}" data-v="${esc(String(x))}" aria-label="Sil">×</button></div>`).join('') : '<p class="small muted">Henüz eklediğin yok.</p>'}<div class="row" style="gap:8px;margin-top:8px"><input id="ml-${k}" placeholder="${ph}" maxlength="40" style="flex:1"><button class="btn sm" data-a="mladd" data-k="${k}">Ekle</button></div></div>`; }; return sheet('Listelerim', `<p class="muted small">Tabloda listeden seçmek yerine yazdığın her değer buraya eklenir. Buradan da ekleyip silebilirsin.</p>${sec('acc', 'Gider hesapları', 'Örn. Reklam')}${sec('inc', 'Gelir hesapları', 'Örn. Catering')}${sec('doc', 'Belge türleri', 'Örn. Dekont')}${sec('rate', 'KDV oranları', 'Örn. 8')}`); };
{ const _ta = tabloHTML; tabloHTML = function () { const h = _ta.apply(this, arguments); return h.replace('<div class="tb-act">', '<div class="tb-act">').replace(/(<button class="btn sm" data-a="ladd"[^>]*>[\s\S]*?<\/button>)/, `<button class="btn sec sm" data-a="mylists">${ic('list', 16)} Listelerim</button>$1`); }; }
cbSync();

/* ===== v136: Fatura / satış belgesi kes (Kais hazırlar, PDF/yazdır, gelire yazar) ===== */
const INV = []; P_ARR.push(['INV', () => INV]); P_SCOPE.INV = 'muh';
const fiOk = () => !!S.user && ['patron', 'mudur', 'muhasebeci'].includes(S.user.role);
const fiToday = () => new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }).replace('.', '');
const FTPL = { unvan: '', vkn: '', vd: '', adres: '', tel: '', eposta: '', iban: '', prefix: 'KP', rate: 20, vade: 0, note: '', renk: '#0F3F7A', baslik: 'SATIŞ BELGESİ' }; P_OBJ.push(['FTPL', () => FTPL]); P_SCOPE.FTPL = 'muh';
const fiNo = () => (FTPL.prefix || 'KP') + '-' + new Date().getFullYear() + '-' + String(INV.length + 1).padStart(4, '0');
const fiCalc = (ls) => { let net = 0, kd = 0; const by = {}; ls.forEach((l) => { const t = (Number(l.q) || 0) * (Number(l.p) || 0); const k = t * (Number(l.r) || 0) / 100; net += t; kd += k; by[l.r] = (by[l.r] || 0) + k; }); return { net, kd, tot: net + kd, by }; };
function fiOpen(pre) { if (!fiOk()) { toast('Fatura kesme yetkin yok.', 'warn'); return; } S.modal = Object.assign({ type: 'fatura', cust: '', vkn: '', adr: '', date: fiToday(), note: '', note: FTPL.note || '', lines: [{ d: '', q: 1, p: 0, r: Number(FTPL.rate) || 20 }], tolg: true }, pre || {}); renderModal(); }
H.finew = () => fiOpen();
H.fiadd = () => { S.modal.lines.push({ d: '', q: 1, p: 0, r: Number(FTPL.rate) || 20 }); renderModal(); };
H.firm = (el) => { const m = S.modal; if (m.lines.length > 1) m.lines.splice(+el.dataset.i, 1); renderModal(); };
NEWM.fatura = (m) => { const c = fiCalc(m.lines); const f = (k, lab, ph) => `<div class="field"><label>${lab}</label><input data-fi="${k}" value="${esc(m[k] || '')}" placeholder="${ph || ''}"></div>`;
  const known = CUSTOMERS.slice(0, 6).map((u) => `<button type="button" data-a="ficust" data-id="${u.id}">${esc(u.name)}</button>`).join('');
  return sheet('Fatura kes', `<div class="callout warn">${ic('alert')}<div>Bu belge <b>resmi e-Fatura değildir</b>. Müşteriye vermek için hazır belge; GİB entegrasyonu sonra eklenecek.</div></div>
  <div class="field"><label>Müşteri</label><input data-fi="cust" value="${esc(m.cust)}" placeholder="Ad / ünvan"><div class="cb-chips">${known}</div></div>
  <div class="row wrap">${f('vkn', 'VKN / TCKN', 'İsteğe bağlı')}${f('date', 'Tarih')}</div>${f('adr', 'Adres', 'İsteğe bağlı')}
  <p class="lbl">Kalemler</p>${m.lines.map((l, i) => `<div class="card" style="padding:10px;margin-bottom:8px"><input data-fl="d" data-i="${i}" value="${esc(l.d)}" placeholder="Ne sattın? Örn. Catering hizmeti" style="width:100%;margin-bottom:6px"><div class="row" style="gap:6px"><input data-fl="q" data-i="${i}" type="number" inputmode="decimal" value="${l.q}" aria-label="Adet" style="width:64px"><input data-fl="p" data-i="${i}" type="number" inputmode="decimal" step="0.01" value="${l.p || ''}" placeholder="Birim fiyat (KDV hariç)" style="flex:1"><input data-fl="r" data-i="${i}" type="text" list="cb-rate" inputmode="decimal" value="${l.r}" aria-label="KDV" style="width:58px"><button type="button" class="btn sm sec" data-a="firm" data-i="${i}" aria-label="Kalemi sil">×</button></div></div>`).join('')}
  <button class="btn sm sec" data-a="fiadd">${ic('plus', 16)} Kalem ekle</button>
  <div class="card" style="margin-top:10px;padding:12px" id="fi-tot">${fiTotHTML(c)}</div>
  ${f('note', 'Not', 'Faturada görünecek not')}<label class="small" style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" data-fi="tolg" ${m.tolg ? 'checked' : ''}> Gelir tablosuna da yaz</label>
  <button class="btn block" data-a="fisave">${ic('file')} Faturayı kaydet</button>`); };
const fiTotHTML = (c) => `<div class="row between small"><span class="muted">Ara toplam</span><b>${fmt(c.net)}</b></div><div class="row between small"><span class="muted">KDV</span><b>${fmt(c.kd)}</b></div><div class="row between" style="margin-top:4px"><b>Genel toplam</b><b style="font-size:18px">${fmt(c.tot)}</b></div>`;
H.ficust = (el) => { const u = CUSTOMERS.find((x) => x.id === el.dataset.id); if (u) { S.modal.cust = u.name; renderModal(); } };
document.addEventListener('input', (e) => { const t = e.target, m = S.modal; if (!m || m.type !== 'fatura' || !t.dataset) return; if (t.dataset.fi) { m[t.dataset.fi] = t.type === 'checkbox' ? t.checked : t.value; return; } if (t.dataset.fl) { const l = m.lines[+t.dataset.i]; if (!l) return; l[t.dataset.fl] = t.dataset.fl === 'd' ? t.value : (t.dataset.fl === 'r' ? (t.value === '' ? 0 : Number(String(t.value).replace(',', '.').replace('%', '')) || 0) : Number(String(t.value).replace(',', '.')) || 0); const box = document.getElementById('fi-tot'); if (box) box.innerHTML = fiTotHTML(fiCalc(m.lines)); } });
document.addEventListener('change', (e) => { const t = e.target, m = S.modal; if (m && m.type === 'fatura' && t.dataset && t.dataset.fi === 'tolg') m.tolg = t.checked; });
function fiHTML(v) { const c = fiCalc(v.lines); const I = Object.assign({}, EDOC || {}, Object.fromEntries(Object.entries(FTPL).filter(([k, x]) => x !== '' && x != null))); const ac = /^#[0-9a-f]{6}$/i.test(FTPL.renk) ? FTPL.renk : '#0F3F7A'; const rows = v.lines.map((l) => `<tr><td>${esc(l.d || '—')}</td><td style="text-align:right">${l.q}</td><td style="text-align:right">${fmt(+l.p || 0)}</td><td style="text-align:right">%${l.r}</td><td style="text-align:right">${fmt((+l.q || 0) * (+l.p || 0))}</td></tr>`).join('');
  return `<div class="fi-doc" style="--fa:${ac}"><div class="fi-h"><div><b style="font-size:20px">${esc(I.unvan || BIZ)}</b><div>${esc([I.vd && I.vkn ? I.vd + ' VD · ' + I.vkn : (I.vkn || ''), I.adres].filter(Boolean).join(' · '))}</div><div>${esc([I.tel, I.eposta].filter(Boolean).join(' · '))}</div></div><div style="text-align:right"><b style="font-size:18px;letter-spacing:1px">${esc(FTPL.baslik || 'SATIŞ BELGESİ')}</b><div>No: ${esc(v.no)}</div><div>Tarih: ${esc(v.date)}</div></div></div>
  <div class="fi-c"><small>Sayın</small><b>${esc(v.cust || '—')}</b><div>${esc([v.vkn, v.adr].filter(Boolean).join(' · '))}</div></div>
  <table><thead><tr><th style="text-align:left">Açıklama</th><th>Adet</th><th>Birim fiyat</th><th>KDV</th><th>Tutar</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="fi-t"><div><span>Ara toplam</span><b>${fmt(c.net)}</b></div>${Object.keys(c.by).filter((k) => c.by[k]).map((k) => `<div><span>KDV %${k}</span><b>${fmt(c.by[k])}</b></div>`).join('')}<div class="fi-g"><span>Genel toplam</span><b>${fmt(c.tot)}</b></div></div>
  ${FTPL.vade ? `<div class="fi-c" style="margin-top:10px"><small>Vade</small><b>${FTPL.vade} gün</b></div>` : ''}${I.iban ? `<div class="fi-c"><small>Ödeme için IBAN</small><b>${esc(I.iban)}</b></div>` : ''}${v.note ? `<div class="fi-c"><small>Not</small>${esc(v.note)}</div>` : ''}<p class="fi-n">Bu belge bilgi amaçlıdır; e-Fatura / e-Arşiv yerine geçmez. KaisPilot ile hazırlandı.</p></div>`; }
H.fisave = () => { const m = S.modal; if (!m.cust.trim()) { toast('Müşteri adını yaz.', 'warn'); return; } const ls = m.lines.filter((l) => (Number(l.p) || 0) > 0); if (!ls.length) { toast('En az bir kalemin fiyatı olmalı.', 'warn'); return; } ls.forEach((l) => { if (!l.d.trim()) l.d = 'Hizmet'; });
  const c = fiCalc(ls); const v = { id: 'iv' + (++seq), no: fiNo(), date: m.date || fiToday(), cust: m.cust.trim(), vkn: m.vkn, adr: m.adr, lines: ls.map((l) => Object.assign({}, l)), net: c.net, tot: c.tot, by: S.user.id, note: m.note || '' };
  INV.push(v); if (m.tolg) { LEDGER.push({ id: 'g' + (++seq), date: v.date, desc: 'Fatura ' + v.no + ' · ' + v.cust, acc: 'Diğer gelir', doc: 'Fatura', rate: Math.max.apply(null, ls.map((l) => Number(l.r) || 0)), total: c.tot, dir: 'gelir', src: 'Kais' }); }
  try { auditAdd({ txt: v.no + ' numaralı fatura kesildi: ' + v.cust }); } catch (e) {} try { pSched(); } catch (e) {} S.modal = { type: 'fatura_ok', id: v.id }; renderModal(); };
NEWM.fatura_ok = (m) => { const v = INV.find((x) => x.id === m.id); if (!v) return sheet('Fatura', '<p>Bulunamadı.</p>'); return sheet(v.no, `<div class="fi-wrap">${fiHTML(v)}</div><div class="row wrap" style="gap:8px;margin-top:10px"><button class="btn" style="flex:1" data-a="fiprint" data-id="${v.id}">${ic('file')} PDF / Yazdır</button><button class="btn sec" style="flex:1" data-a="fishare" data-id="${v.id}">Paylaş</button></div><button class="btn sec block" style="margin-top:8px" data-a="finew">Yeni fatura</button>`); };
H.fiprint = (el) => { const v = INV.find((x) => x.id === el.dataset.id); if (!v) return; let root = document.getElementById('kp-print'); if (!root) { root = document.createElement('div'); root.id = 'kp-print'; document.body.appendChild(root); } root.innerHTML = fiHTML(v); document.body.classList.add('kp-printing'); const done = () => { document.body.classList.remove('kp-printing'); root.innerHTML = ''; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 80); };
H.fishare = (el) => { const v = INV.find((x) => x.id === el.dataset.id); if (!v) return; const t = `${BIZ} · Satış belgesi ${v.no}\nMüşteri: ${v.cust}\nTarih: ${v.date}\nToplam: ${fmt(v.tot)}`; if (navigator.share) navigator.share({ title: v.no, text: t }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Özet kopyalandı.', 'ok')); };

H.fitpl = () => { S.modal = { type: 'fatura_tpl' }; renderModal(); };
NEWM.fatura_tpl = () => { const f = (k, lab, ph, t) => `<div class="field"><label>${lab}</label><input data-ft="${k}" ${t === 'n' ? 'type="number" inputmode="numeric"' : ''} value="${esc(String(FTPL[k] == null || FTPL[k] === '' ? (k === 'unvan' ? EDOC.unvan || '' : k === 'vkn' ? EDOC.vkn || '' : k === 'vd' ? EDOC.vd || '' : k === 'adres' ? EDOC.adres || '' : '') : FTPL[k]))}" placeholder="${ph || ''}"></div>`;
  const cols = ['#0F3F7A', '#0E7C66', '#7A3FA0', '#C2410C', '#111827'];
  return sheet('Fatura taslağı', `<p class="muted small">Her fatura bu taslakla kesilir. Burada değiştirdiğin her şey yeni kesilen faturalarda görünür.</p>${f('unvan', 'Ünvan')}<div class="row wrap">${f('vkn', 'VKN')}${f('vd', 'Vergi dairesi')}</div>${f('adres', 'Adres')}<div class="row wrap">${f('tel', 'Telefon')}${f('eposta', 'E-posta')}</div>${f('iban', 'IBAN', 'TR00 0000 …')}<div class="row wrap">${f('prefix', 'Numara öneki', 'KP')}${f('rate', 'Varsayılan KDV %', '20', 'n')}${f('vade', 'Vade (gün)', '0', 'n')}</div>${f('baslik', 'Belge başlığı', 'SATIŞ BELGESİ')}${f('note', 'Alt not', 'Her faturada çıkacak not')}
  <p class="lbl">Renk</p><div class="row" style="gap:8px;margin-bottom:10px">${cols.map((c) => `<button type="button" data-a="ftcol" data-c="${c}" aria-label="${c}" style="width:34px;height:34px;border-radius:50%;background:${c};border:${FTPL.renk === c ? '3px solid #fff;box-shadow:0 0 0 2px ' + c : '2px solid #fff'}"></button>`).join('')}</div>
  <p class="lbl">Önizleme</p><div class="fi-wrap" id="ft-pv">${fiHTML({ no: fiNo(), date: fiToday(), cust: 'Örnek Müşteri', vkn: '', adr: '', lines: [{ d: 'Örnek hizmet', q: 1, p: 1000, r: Number(FTPL.rate) || 20 }], note: '' })}</div><button class="btn block" style="margin-top:10px" data-a="ftdone">Kaydet</button>`); };
H.ftcol = (el) => { FTPL.renk = el.dataset.c; try { pSched(); } catch (e) {} renderModal(); };
H.ftdone = () => { try { pSched(); } catch (e) {} toast('Fatura taslağı kaydedildi.', 'ok'); S.modal = null; renderModal(); };
document.addEventListener('input', (e) => { const t = e.target; if (!S.modal || S.modal.type !== 'fatura_tpl' || !t.dataset || !t.dataset.ft) return; const k = t.dataset.ft; FTPL[k] = (k === 'rate' || k === 'vade') ? (Number(t.value) || 0) : t.value; try { pSched(); } catch (x) {} const pv = document.getElementById('ft-pv'); if (pv) pv.innerHTML = fiHTML({ no: fiNo(), date: fiToday(), cust: 'Örnek Müşteri', vkn: '', adr: '', lines: [{ d: 'Örnek hizmet', q: 1, p: 1000, r: Number(FTPL.rate) || 20 }], note: '' }); });
H.finlist = () => { S.modal = { type: 'fatura_list' }; renderModal(); };
H.fiopen = (el) => { S.modal = { type: 'fatura_ok', id: el.dataset.id }; renderModal(); };
NEWM.fatura_list = () => sheet('Kestiğim faturalar', INV.length ? INV.slice().reverse().map((v) => `<button class="card" data-a="fiopen" data-id="${v.id}" style="width:100%;text-align:left;margin-bottom:8px;padding:12px;display:flex;justify-content:space-between;gap:8px"><span><b>${esc(v.cust)}</b><br><small class="muted">${esc(v.no)} · ${esc(v.date)}</small></span><b>${fmt(v.tot)}</b></button>`).join('') : '<p class="muted">Henüz fatura kesmedin.</p>');
(function () { try { const st = document.createElement('style'); st.textContent = `.fi-wrap{max-height:46vh;overflow:auto;border:1px solid #DCE5F2;border-radius:12px;background:#fff}.fi-doc{padding:16px;color:#0E2B4D;font:13px system-ui;background:#fff}.fi-h{display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid var(--fa,#0F3F7A);padding-bottom:10px;margin-bottom:12px}.fi-c{margin-bottom:12px}.fi-c small{display:block;color:#7A8AA0}.fi-doc table{width:100%;border-collapse:collapse}.fi-doc th{font-size:11px;color:#7A8AA0;border-bottom:1px solid #DCE5F2;padding:6px 4px;text-align:right}.fi-doc td{padding:7px 4px;border-bottom:1px solid #EEF2F8}.fi-t{margin:12px 0 0 auto;width:60%;min-width:200px}.fi-t div{display:flex;justify-content:space-between;padding:3px 0}.fi-g{border-top:2px solid var(--fa,#0F3F7A);margin-top:4px;padding-top:6px!important;font-size:15px}.fi-n{margin-top:16px;font-size:11px;color:#7A8AA0}@media print{body.kp-printing .fi-doc{padding:0}}`; document.head.appendChild(st); } catch (e) {} })();
{ const _ta = tabloHTML; tabloHTML = function () { const h = _ta.apply(this, arguments); if (!fiOk()) return h; return h.replace('<div class="tb-act">', `<div class="tb-act" style="margin-bottom:8px"><button class="btn sm" data-a="finew">${ic('file', 16)} Fatura kes</button><button class="btn sec sm" data-a="finlist">Faturalarım${INV.length ? ' (' + INV.length + ')' : ''}</button><button class="btn sec sm" data-a="fitpl">Taslak</button></div><div class="tb-act">`); }; }
function kaInvoiceAct(text) { if (!fiOk()) return { content: 'Fatura kesmek patron, müdür ve muhasebeci için.' };
  const pre = {}; const mm = text.match(/([\p{L}][\p{L}\s.&-]{1,40}?)['’‘](?:a|e|ya|ye|na|ne|ın|in)\s/iu); if (mm) pre.cust = mm[1].trim().replace(/\s+/g, ' ');
  const am = text.match(/(\d[\d.]*(?:,\d+)?)\s*(?:tl|lira|₺)/i); const km = text.match(/(?:kdv|%)\s*%?\s*(\d{1,2})/i); const rate = km ? Number(km[1]) : 20; const ci = text.indexOf(':'); let d = ci >= 0 ? text.slice(ci + 1).trim() : ''; if (!d) { const dm = text.match(/(?:tl|lira|₺)\s*(?:lik|luk)?\s+([\p{L}\s]{3,40}?)\s+(?:için\s+)?fatura/iu); d = dm ? dm[1].trim() : ''; }
  let p = 0; if (am) { p = Number(am[1].replace(/\./g, '').replace(',', '.')) || 0; if (/kdv\s*(dahil|dâhil)/i.test(text)) p = p / (1 + rate / 100); }
  pre.lines = [{ d: d || '', q: 1, p: Math.round(p * 100) / 100, r: rate }]; fiOpen(pre);
  return { content: (pre.cust ? pre.cust + ' için fatura taslağını' : 'Fatura taslağını') + ' hazırladım. Bilgileri kontrol edip "Faturayı kaydet"e dokun. Resmi e-Fatura değildir.' }; }
{ const _ki = kaIntent; kaIntent = function (text) { const f = kaFold(text); if (f.length < 220 && /\bfatura\b/.test(f) && /\b(kes|kesel|kesecegim|olustur|hazirla|duzenle)\w*/.test(f) && !/\b(neden|nasil|kac|ne zaman|kesildi)\b/.test(f)) return kaInvoiceAct(text); return _ki.apply(this, arguments); }; }
['patron', 'muhasebeci'].forEach((k) => { if (AI_Q[k] && !AI_Q[k].some((q) => /fatura kes/i.test(q))) AI_Q[k].splice(1, 0, 'Fatura kes: Ahmet\'e 5000 TL danışmanlık'); });

/* ===== v137: fatura gönder (PDF/WhatsApp/e-posta), tahsilat, tekrarlayan, müşteri rehberi, ürün listesi ===== */
const FCUST = [], FITEMS = [], FREC = [];
[['FCUST', FCUST], ['FITEMS', FITEMS], ['FREC', FREC]].forEach(([k, a]) => { P_ARR.push([k, () => a]); P_SCOPE[k] = 'muh'; });
const fiIso = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }; /* yerel gün: gece 00-03 arası UTC dünü gösterirdi */
const fiAddMonth = (iso) => { const a = iso.split('-').map(Number); const d = new Date(Date.UTC(a[0], a[1], 1)); const last = new Date(Date.UTC(a[0], a[1] + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(a[2], last)); return d.toISOString().slice(0, 10); };
const fiLate = (v) => v.st !== 'odendi' && v.due && v.due < fiIso();
const fiLateN = () => INV.filter(fiLate).length;
const fiDueRec = () => FREC.filter((r) => r.on !== false && r.next <= fiIso());
function fiLoad(src) { return new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = () => no(new Error('yüklenemedi')); document.head.appendChild(sc); }); }
async function fiPdf(v) {
  if (!window.html2canvas) await fiLoad('vendor/html2canvas-1.4.1.min.js');
  if (!(window.jspdf && window.jspdf.jsPDF)) await fiLoad('vendor/jspdf-2.5.1.umd.min.js');
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff'; host.innerHTML = fiHTML(v); document.body.appendChild(host);
  try { const cv = await window.html2canvas(host, { scale: 2, backgroundColor: '#fff' }); const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }); const W = 595.28, H = 841.89; let w = W, h = cv.height * W / cv.width; if (h > H) { w = W * H / h; h = H; } pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', (W - w) / 2, 0, w, h); return pdf.output('blob'); } finally { host.remove(); }
}
H.fipdf = async (el) => { const v = INV.find((x) => x.id === el.dataset.id); if (!v) return; toast('PDF hazırlanıyor…'); try { const blob = await fiPdf(v); const file = new File([blob], v.no + '.pdf', { type: 'application/pdf' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: v.no, text: BIZ + ' · ' + v.no }); return; } catch (e) { if (e && e.name === 'AbortError') return; } } saveBlob(v.no + '.pdf', blob); toast('PDF indirildi.', 'ok'); } catch (e) { toast('PDF hazırlanamadı, yazdırma açılıyor.', 'warn'); H.fiprint(el); } };
const fiText = (v) => `${BIZ} · Satış belgesi ${v.no}\nMüşteri: ${v.cust}\nTarih: ${v.date}\nToplam: ${fmt(v.tot)}${(FTPL.iban) ? '\nIBAN: ' + FTPL.iban : ''}`;
H.fiwa = (el) => { const v = INV.find((x) => x.id === el.dataset.id); if (v) window.open('https://wa.me/?text=' + encodeURIComponent(fiText(v)), '_blank'); };
H.fimail = (el) => { const v = INV.find((x) => x.id === el.dataset.id); if (!v) return; const c = FCUST.find((x) => x.name === v.cust); location.href = 'mailto:' + encodeURIComponent((c && c.eposta) || '') + '?subject=' + encodeURIComponent(BIZ + ' · ' + v.no) + '&body=' + encodeURIComponent(fiText(v) + '\n\nBelgeyi PDF olarak ayrıca ekleyebilirsin.'); };
H.fipaid = (el) => { const v = INV.find((x) => x.id === el.dataset.id); if (!v) return; v.st = v.st === 'odendi' ? 'bekliyor' : 'odendi'; v.paidAt = v.st === 'odendi' ? fiIso() : ''; try { pSched(); } catch (e) {} toast(v.st === 'odendi' ? 'Tahsil edildi olarak işaretlendi.' : 'Tekrar bekliyor yapıldı.', 'ok'); renderModal(); render(); };
const fiPill = (v) => v.st === 'odendi' ? '<span class="pill p-ok">Ödendi</span>' : (v.pays && v.pays.length && ivPaidAmt(v) > 0) ? (fiLate(v) ? '<span class="pill p-bad">Vadesi geçti · kalan ' + fmt0(ivOpen(v)) + '</span>' : '<span class="pill p-warn">Kısmi · kalan ' + fmt0(ivOpen(v)) + '</span>') : fiLate(v) ? '<span class="pill p-bad">Vadesi geçti</span>' : '<span class="pill p-warn">Bekliyor</span>';
H.fisave = () => { const m = S.modal; if (!m.cust.trim()) { toast('Müşteri adını yaz.', 'warn'); return; } const ls = m.lines.filter((l) => (Number(l.p) || 0) > 0); if (!ls.length) { toast('En az bir kalemin fiyatı olmalı.', 'warn'); return; } ls.forEach((l) => { if (!l.d.trim()) l.d = 'Hizmet'; });
  const c = fiCalc(ls); const iso = fiIso(); const v = { id: 'iv' + (++seq), no: fiNo(), date: m.date || fiToday(), iso, due: FTPL.vade ? addDays(iso, Number(FTPL.vade)) : iso, st: 'bekliyor', cust: m.cust.trim(), vkn: m.vkn, adr: m.adr, lines: ls.map((l) => Object.assign({}, l)), net: c.net, tot: c.tot, by: S.user.id, note: m.note || '' };
  INV.push(v); if (m.tolg) LEDGER.push({ id: 'g' + (++seq), date: v.date, desc: 'Fatura ' + v.no + ' · ' + v.cust, acc: 'Diğer gelir', doc: 'Fatura', rate: Math.max.apply(null, ls.map((l) => Number(l.r) || 0)), total: c.tot, dir: 'gelir', src: 'Kais' });
  const cu = FCUST.find((x) => x.name.toLocaleLowerCase('tr') === v.cust.toLocaleLowerCase('tr')); if (cu) { cu.vkn = m.vkn || cu.vkn; cu.adr = m.adr || cu.adr; cu.eposta = m.eposta || cu.eposta; } else FCUST.push({ id: 'fc' + (++seq), name: v.cust, vkn: m.vkn || '', adr: m.adr || '', eposta: m.eposta || '' });
  ls.forEach((l) => { const it = FITEMS.find((x) => x.d.toLocaleLowerCase('tr') === l.d.toLocaleLowerCase('tr')); if (it) { it.p = Number(l.p); it.r = Number(l.r); } else if (FITEMS.length < 60) FITEMS.push({ id: 'fx' + (++seq), d: l.d, p: Number(l.p), r: Number(l.r) }); });
  if (m.recId) { const r = FREC.find((x) => x.id === m.recId); if (r) r.next = fiAddMonth(r.next); } else if (m.rec) { FREC.push({ id: 'fr' + (++seq), cust: v.cust, vkn: m.vkn, adr: m.adr, note: m.note || '', lines: ls.map((l) => Object.assign({}, l)), day: Number(iso.slice(8)), next: fiAddMonth(iso), on: true }); toast('Her ay bu faturayı kesmen için hatırlatılacak.', 'ok'); }
  try { auditAdd({ txt: v.no + ' numaralı fatura kesildi: ' + v.cust }); } catch (e) {} try { pSched(); } catch (e) {} S.modal = { type: 'fatura_ok', id: v.id }; renderModal(); };
NEWM.fatura = (m) => { const c = fiCalc(m.lines); const f = (k, lab, ph) => `<div class="field"><label>${lab}</label><input data-fi="${k}" value="${esc(m[k] || '')}" placeholder="${ph || ''}"></div>`;
  const mine = FCUST.length ? FCUST.slice(-8).reverse() : CUSTOMERS.slice(0, 6).map((u) => ({ id: u.id, name: u.name })); const chips = mine.map((u) => `<button type="button" data-a="ficust" data-id="${u.id}">${esc(u.name)}</button>`).join('');
  const items = FITEMS.slice(-10).reverse().map((x) => `<button type="button" data-a="fiitem" data-id="${x.id}">${esc(x.d)} · ${fmt0(x.p)}</button>`).join('');
  return sheet(m.recId ? 'Tekrarlayan fatura' : 'Fatura kes', `<div class="callout warn">${ic('alert')}<div>Bu belge <b>resmi e-Fatura değildir</b>. Müşteriye vermek için hazır belge; GİB entegrasyonu sonra eklenecek.</div></div>
  <div class="field"><label>Müşteri</label><input data-fi="cust" list="fi-cl" value="${esc(m.cust)}" placeholder="Ad / ünvan" autocomplete="off"><datalist id="fi-cl">${FCUST.map((u) => `<option value="${esc(u.name)}"></option>`).join('')}</datalist>${chips ? `<div class="cb-chips">${chips}</div>` : ''}</div>
  <div class="row wrap">${f('vkn', 'VKN / TCKN', 'İsteğe bağlı')}${f('date', 'Tarih')}</div>${f('adr', 'Adres', 'İsteğe bağlı')}${f('eposta', 'Müşteri e-postası', 'Göndermek için')}
  <p class="lbl">Kalemler</p>${items ? `<div class="cb-chips" style="margin:0 0 8px">${items}</div>` : ''}${m.lines.map((l, i) => `<div class="card" style="padding:10px;margin-bottom:8px"><input data-fl="d" data-i="${i}" value="${esc(l.d)}" placeholder="Ne sattın? Örn. Catering hizmeti" style="width:100%;margin-bottom:6px"><div class="row" style="gap:6px"><input data-fl="q" data-i="${i}" type="number" inputmode="decimal" value="${l.q}" aria-label="Adet" style="width:64px"><input data-fl="p" data-i="${i}" type="number" inputmode="decimal" step="0.01" value="${l.p || ''}" placeholder="Birim fiyat (KDV hariç)" style="flex:1"><input data-fl="r" data-i="${i}" type="text" list="cb-rate" inputmode="decimal" value="${l.r}" aria-label="KDV" style="width:58px"><button type="button" class="btn sm sec" data-a="firm" data-i="${i}" aria-label="Kalemi sil">×</button></div></div>`).join('')}
  <button class="btn sm sec" data-a="fiadd">${ic('plus', 16)} Kalem ekle</button>
  <div class="card" style="margin-top:10px;padding:12px" id="fi-tot">${fiTotHTML(c)}</div>${f('note', 'Not', 'Faturada görünecek not')}
  <label class="small" style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" data-fi="tolg" ${m.tolg ? 'checked' : ''}> Gelir tablosuna da yaz</label>
  ${m.recId ? '' : `<label class="small" style="display:flex;gap:8px;align-items:center;margin:0 0 10px"><input type="checkbox" data-fi="rec" ${m.rec ? 'checked' : ''}> Her ay tekrarla (hatırlat)</label>`}
  <button class="btn block" data-a="fisave">${ic('file')} Faturayı kaydet</button>`); };
H.fiitem = (el) => { const x = FITEMS.find((i) => i.id === el.dataset.id); if (!x) return; const m = S.modal; const empty = m.lines.length === 1 && !m.lines[0].d && !(+m.lines[0].p); const l = { d: x.d, q: 1, p: x.p, r: x.r }; if (empty) m.lines[0] = l; else m.lines.push(l); renderModal(); };
H.ficust = (el) => { const u = FCUST.find((x) => x.id === el.dataset.id) || CUSTOMERS.find((x) => x.id === el.dataset.id); if (!u) return; const m = S.modal; m.cust = u.name; if (u.vkn) m.vkn = u.vkn; if (u.adr) m.adr = u.adr; if (u.eposta || u.email) m.eposta = u.eposta || u.email; renderModal(); };
document.addEventListener('change', (e) => { const t = e.target, m = S.modal; if (m && m.type === 'fatura' && t.dataset && t.dataset.fi === 'cust') { const u = FCUST.find((x) => x.name.toLocaleLowerCase('tr') === String(t.value).trim().toLocaleLowerCase('tr')); if (u) { m.cust = u.name; m.vkn = m.vkn || u.vkn || ''; m.adr = m.adr || u.adr || ''; m.eposta = m.eposta || u.eposta || ''; renderModal(); } } });
NEWM.fatura_ok = (m) => { const v = INV.find((x) => x.id === m.id); if (!v) return sheet('Fatura', '<p>Bulunamadı.</p>'); return sheet(v.no, `<div class="row between" style="margin-bottom:8px">${fiPill(v)}<small class="muted">${v.due && v.due !== v.iso ? 'Vade ' + v.due.split('-').reverse().join('.') : 'Peşin'}</small></div><div class="fi-wrap">${fiHTML(v)}</div>
  <button class="btn block" style="margin-top:10px" data-a="fipdf" data-id="${v.id}">${ic('file')} PDF olarak gönder</button>
  <div class="row" style="gap:8px;margin-top:8px"><button class="btn sec" style="flex:1" data-a="fiwa" data-id="${v.id}">WhatsApp</button><button class="btn sec" style="flex:1" data-a="fimail" data-id="${v.id}">E-posta</button><button class="btn sec" style="flex:1" data-a="fiprint" data-id="${v.id}">Yazdır</button></div>
  <button class="btn block ${v.st === 'odendi' ? 'sec' : ''}" style="margin-top:8px" data-a="fipaid" data-id="${v.id}">${v.st === 'odendi' ? 'Tekrar bekliyor yap' : 'Tahsil edildi'}</button><button class="btn sec block" style="margin-top:8px" data-a="finew">Yeni fatura</button>`); };
H.fitab = (el) => { S.modal.tab = el.dataset.t; renderModal(); };
H.finlist = () => { S.modal = { type: 'fatura_list', tab: fiDueRec().length ? 'tekrar' : 'fat' }; renderModal(); };
H.frkes = (el) => { const r = FREC.find((x) => x.id === el.dataset.id); if (r) fiOpen({ cust: r.cust, vkn: r.vkn, adr: r.adr, note: r.note, eposta: (FCUST.find((x) => x.name === r.cust) || {}).eposta || '', lines: r.lines.map((l) => Object.assign({}, l)), recId: r.id }); };
H.frdel = (el) => { const i = FREC.findIndex((x) => x.id === el.dataset.id); if (i >= 0) FREC.splice(i, 1); try { pSched(); } catch (e) {} renderModal(); render(); };
H.fcdel = (el) => { const i = FCUST.findIndex((x) => x.id === el.dataset.id); if (i >= 0) FCUST.splice(i, 1); try { pSched(); } catch (e) {} renderModal(); };
H.fxdel = (el) => { const i = FITEMS.findIndex((x) => x.id === el.dataset.id); if (i >= 0) FITEMS.splice(i, 1); try { pSched(); } catch (e) {} renderModal(); };
NEWM.fatura_list = (m) => { const tab = m.tab || 'fat'; const t = (k, l, n) => `<button type="button" class="${tab === k ? 'on' : ''}" data-a="fitab" data-t="${k}">${l}${n ? ' ' + n : ''}</button>`; const dueN = fiDueRec().length;
  const tabs = `<div class="cb-chips" style="margin:0 0 12px">${t('fat', 'Faturalar', INV.length ? '(' + INV.length + ')' : '')}${t('tekrar', 'Tekrarlayan', dueN ? '(' + dueN + ' hazır)' : FREC.length ? '(' + FREC.length + ')' : '')}${t('musteri', 'Müşteriler', FCUST.length ? '(' + FCUST.length + ')' : '')}${t('urun', 'Ürün/hizmet', FITEMS.length ? '(' + FITEMS.length + ')' : '')}</div>`;
  const row = (a, b, c) => `<div class="cb-my"><span>${a}<br><small class="muted">${b}</small></span>${c}</div>`; let body = '';
  if (tab === 'fat') { const bek = INV.filter((v) => v.st !== 'odendi').reduce((a, v) => a + ivOpen(v), 0); body = (INV.length ? `<div class="card" style="padding:12px;margin-bottom:10px"><div class="row between"><span class="muted small">Tahsil bekleyen</span><b>${fmt(bek)}</b></div>${fiLateN() ? `<div class="small" style="color:#C0392B;margin-top:4px">${fiLateN()} faturanın vadesi geçti</div>` : ''}</div>` : '') + (INV.length ? INV.slice().reverse().map((v) => `<button class="card" data-a="fiopen" data-id="${v.id}" style="width:100%;text-align:left;margin-bottom:8px;padding:12px;display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>${esc(v.cust)}</b><br><small class="muted">${esc(v.no)} · ${esc(v.date)}</small></span><span style="text-align:right"><b>${fmt(v.tot)}</b><br>${fiPill(v)}</span></button>`).join('') : '<p class="muted">Henüz fatura kesmedin.</p>'); }
  if (tab === 'tekrar') body = FREC.length ? FREC.map((r) => { const due = r.next <= fiIso(); return row(esc(r.cust), 'Her ay · sıradaki ' + r.next.split('-').reverse().join('.') + ' · ' + fmt(fiCalc(r.lines).tot), `${due ? `<button class="btn sm" data-a="frkes" data-id="${r.id}" style="width:auto;height:auto;background:#0F3F7A;color:#fff;padding:8px 14px;font:600 13px system-ui">Kes</button>` : ''}<button type="button" data-a="frdel" data-id="${r.id}" aria-label="Sil">×</button>`); }).join('') : '<p class="muted small">Fatura keserken "Her ay tekrarla"yı işaretle; her ay hatırlatılır.</p>';
  if (tab === 'musteri') body = FCUST.length ? FCUST.map((u) => row(esc(u.name), esc([u.vkn, u.eposta].filter(Boolean).join(' · ') || 'Bilgi yok'), `<button type="button" data-a="fcdel" data-id="${u.id}" aria-label="Sil">×</button>`)).join('') : '<p class="muted small">Fatura kestikçe müşteriler burada birikir.</p>';
  if (tab === 'urun') body = FITEMS.length ? FITEMS.map((x) => row(esc(x.d), fmt(x.p) + ' + %' + x.r + ' KDV', `<button type="button" data-a="fxdel" data-id="${x.id}" aria-label="Sil">×</button>`)).join('') : '<p class="muted small">Faturaya yazdığın ürün ve hizmetler burada birikir, sonra tek dokunuşla eklenir.</p>';
  return sheet('Faturalar', tabs + body); };
{ const _ta = tabloHTML; tabloHTML = function () { let h = _ta.apply(this, arguments); const n = fiLateN() + fiDueRec().length; return h.replace(/(data-a="finlist">Faturalarım(?: \(\d+\))?)/, `$1${n ? ' <span class="pill p-bad" style="margin-left:4px">' + n + '</span>' : ''}`); }; }
function kaInvStatus() { if (!fiOk()) return { content: 'Bu bilgi patron, müdür ve muhasebeci için.' }; const bek = INV.filter((v) => v.st !== 'odendi'); if (!bek.length) return { content: INV.length ? 'Kestiğin tüm faturalar tahsil edilmiş.' : 'Henüz fatura kesmedin.' }; const late = bek.filter(fiLate); const tot = bek.reduce((a, v) => a + ivOpen(v), 0); return { content: `${bek.length} faturadan ${fmt(tot)} tahsil bekliyor.${late.length ? ' Vadesi geçenler: ' + late.map((v) => v.cust + ' (' + fmt(ivOpen(v)) + ')').join(', ') + '.' : ' Vadesi geçen yok.'}` }; }
{ const _k2 = kaIntent; kaIntent = function (text) { const f = kaFold(text); if (f.length < 160 && /\bfatura/.test(f) && /\b(vade|tahsil|odenmemis|odemedi|bekleyen|alacak|geciken)/.test(f)) return kaInvStatus(); return _k2.apply(this, arguments); }; }

/* ===== v138: ekstre↔fatura eşleştirme, KDV özeti, haklarım şeridi, çevrimdışı, yedek ===== */
/* -- Ekstre ↔ fatura -- */
const fxFold = (x) => String(x || '').toLocaleLowerCase('tr-TR').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
function fxMatches() {
  const used = new Set(INV.filter((v) => v.bank).map((v) => v.bank)); const out = [];
  INV.filter((v) => v.st !== 'odendi').forEach((v) => {
    const w = fxFold(v.cust).split(/\s+/).filter((x) => x.length >= 3);
    const c = ROWS.filter((r) => r.amt > 0 && !used.has(r.id) && Math.abs(r.amt - ivOpen(v)) < 0.01).map((r) => { const d = fxFold(r.desc); return { r, hit: w.some((x) => d.includes(x)) }; }).sort((a, b) => b.hit - a.hit)[0];
    if (c) { used.add(c.r.id); out.push({ v, r: c.r, sure: c.hit }); }
  });
  return out;
}
function fxUnbilled() { const linked = new Set(INV.map((v) => v.bank).filter(Boolean)); const pos = new Set(fxMatches().map((m) => m.r.id)); return ROWS.filter((r) => r.amt > 0 && !linked.has(r.id) && !pos.has(r.id) && !/POS|TAHS[İI]LAT/i.test(r.desc)).slice(0, 4); }
H.fxok = (el) => { const v = INV.find((x) => x.id === el.dataset.id); const r = ROWS.find((x) => x.id === el.dataset.b); if (!v || !r) return; v.st = 'odendi'; v.paidAt = fiIso(); v.bank = r.id; try { auditAdd({ txt: v.no + ' ekstreyle eşleşti, tahsil edildi' }); pSched(); } catch (e) {} toast(v.cust + ' faturası tahsil edildi.', 'ok'); render(); };
H.fxall = () => { const sure = fxMatches().filter((m) => m.sure); sure.forEach((m) => { m.v.st = 'odendi'; m.v.paidAt = fiIso(); m.v.bank = m.r.id; }); try { pSched(); } catch (e) {} toast(sure.length + ' fatura tahsil edildi.', 'ok'); render(); };
H.fxbill = (el) => { const r = ROWS.find((x) => x.id === el.dataset.b); if (!r) return; const rate = Number(FTPL.rate) || 20; fiOpen({ cust: '', lines: [{ d: '', q: 1, p: Math.round(r.amt / (1 + rate / 100) * 100) / 100, r: rate }], note: 'Ekstre: ' + r.desc }); };
function fxCard() {
  if (!fiOk() || !INV.length && !fxUnbilled().length) return ''; const ms = fxMatches(); const un = fxUnbilled(); if (!ms.length && !un.length) return '';
  const sure = ms.filter((m) => m.sure).length;
  return `<div class="card stack fxc"><div><h3>Tahsilat eşleşmeleri</h3><p class="muted small" style="margin-top:2px">Ekstrede gelen para, kestiğin faturalarla karşılaştırıldı.</p></div>
  ${ms.map((m) => `<div class="cb-my"><span>${esc(m.v.cust)} · ${fmt0(m.v.tot)}<br><small class="muted">${esc(m.r.date)} · ${esc(m.r.desc)} · ${m.sure ? 'Ad ve tutar tuttu' : 'Yalnız tutar tuttu'}</small></span><button type="button" class="btn sm" data-a="fxok" data-id="${m.v.id}" data-b="${m.r.id}" style="width:auto;height:auto;background:#0F3F7A;color:#fff;padding:8px 12px;font:600 13px system-ui">Onayla</button></div>`).join('')}
  ${sure > 1 ? `<button class="btn sm sec" data-a="fxall">Kesin ${sure} eşleşmeyi onayla</button>` : ''}
  ${un.length ? `<p class="lbl" style="margin-top:6px">Faturası olmayan gelenler</p>${un.map((r) => `<div class="cb-my"><span>${esc(r.desc)} · ${fmt0(r.amt)}<br><small class="muted">${esc(r.date)}</small></span><button type="button" class="btn sm sec" data-a="fxbill" data-b="${r.id}" style="width:auto;height:auto;background:#EAF1FB;color:#0F3F7A;padding:8px 12px;font:600 13px system-ui">Fatura kes</button></div>`).join('')}` : ''}</div>`;
}
{ const _e = ekstreHTML; ekstreHTML = function () { const h = _e.apply(this, arguments); const c = fxCard(); return c ? c + h : h; }; }
/* -- KDV özeti -- */
function kdvData(per) {
  const rows = LEDGER.filter((r) => lper(r) === per); const by = {}; let hes = 0, ind = 0, hm = 0, im = 0;
  rows.forEach((r) => { const k = Number(r.rate) || 0; const P = mhKdvParts(r); const v = P.k, net = P.m; by[k] = by[k] || { h: 0, i: 0, hm: 0, im: 0 }; if (dirOf(r) === 'gelir') { const hv = v - P.tv; by[k].h += hv; by[k].hm += net; hes += hv; hm += net; } else { by[k].i += v; by[k].im += net; ind += v; im += net; hes += P.tv; by[k].h += P.tv; } });
  return { by, hes, ind, hm, im, pay: Math.max(0, hes - ind), carry: Math.max(0, ind - hes), n: rows.length, free: ROWS.filter((r) => r.kind === 'gider' && !r.fid).length };
}
H.kdvp = (el) => { S.kdvp = el.dataset.p; render(); };
function kdvCsv(per) { const d = kdvData(per); const l = [['KDV oranı', 'Gelir matrahı', 'Hesaplanan KDV', 'Gider matrahı', 'İndirilecek KDV']]; Object.keys(d.by).sort((a, b) => a - b).forEach((k) => l.push(['%' + k, d.by[k].hm.toFixed(2), d.by[k].h.toFixed(2), d.by[k].im.toFixed(2), d.by[k].i.toFixed(2)])); l.push(['Toplam', d.hm.toFixed(2), d.hes.toFixed(2), d.im.toFixed(2), d.ind.toFixed(2)]); l.push([], ['Ödenecek KDV', d.pay.toFixed(2)], ['Devreden KDV', d.carry.toFixed(2)]); return '﻿' + l.map((r) => r.join(';')).join('\n'); }
H.kdvcsv = () => { const per = S.kdvp === 'cur' ? CURM : PREVM; saveBlob('KDV-ozeti-' + per.replace(/\s+/g, '-') + '.csv', new Blob([kdvCsv(per)], { type: 'text/csv;charset=utf-8' })); toast('KDV özeti indirildi.', 'ok'); };
kdvCard = function () {
  const cur = S.kdvp === 'cur'; const per = cur ? CURM : PREVM; const d = kdvData(per); const ks = Object.keys(d.by).sort((a, b) => a - b);
  const seg = `<div class="cb-chips" style="margin:0"><button type="button" class="${cur ? '' : 'on'}" data-a="kdvp" data-p="prev">${PREVM}</button><button type="button" class="${cur ? 'on' : ''}" data-a="kdvp" data-p="cur">${CURM}${cur ? '' : ''}</button></div>`;
  return `<div class="card stack"><div><h3>KDV özeti</h3><p class="muted small" style="margin-top:2px">Tahmini veri özeti, vergi tavsiyesi değildir. Beyanı muhasebeci hazırlar ve teyit eder.</p></div>${seg}
  <div class="kpis"><div class="kpi"><div class="l">Hesaplanan</div><div class="v num">${fmt0(d.hes)}</div></div><div class="kpi"><div class="l">İndirilecek</div><div class="v num">${fmt0(d.ind)}</div></div><div class="kpi"><div class="l">${d.carry > 0 ? 'Devreden' : 'Ödenecek'}</div><div class="v num">${fmt0(d.carry > 0 ? d.carry : d.pay)}</div></div></div>
  ${ks.length ? `<div class="stack" style="gap:0">${ks.map((k) => `<div class="row between small" style="padding:8px 0;border-top:1px solid #EEF2F8"><b>%${k} KDV</b><span class="muted">Hesaplanan ${fmt0(d.by[k].h)} · İndirilecek ${fmt0(d.by[k].i)}</span></div>`).join('')}</div>` : '<p class="small muted">Bu dönemde satır yok.</p>'}
  <p class="small muted">Hesaplanan KDV gelir tablosundan, indirilecek KDV gider tablosundan (${d.n} satır) hesaplandı. ${countStatus('eksik')} belgesiz işlem hesaba girmedi.</p>
  <button class="btn sm sec" data-a="kdvcsv">KDV özetini indir (Excel'de açılır)</button></div>`;
};
{ const _k3 = kaIntent; kaIntent = function (text) { const f = kaFold(text); if (f.length < 120 && /\bkdv\b/.test(f) && /(ne kadar|kac|tahmin|odenecek|ozet|durum)/.test(f)) { if (!fiOk()) return { content: 'KDV özeti patron, müdür ve muhasebeci için.' }; const d = kdvData(PREVM); return { content: `${PREVM} için hesaplanan KDV ${fmt0(d.hes)}, indirilecek KDV ${fmt0(d.ind)}. ${d.carry > 0 ? 'Fark ' + fmt0(d.carry) + ' devreden KDV olarak görünüyor.' : 'Tahmini ödenecek KDV ' + fmt0(d.pay) + '.'} Bu bir tahmindir, beyanı muhasebeci teyit eder.` }; } return _k3.apply(this, arguments); }; }
/* -- Çalışan: haklarım şeridi -- */
{ const _tb = viewTalebim; viewTalebim = function () { let h = _tb.apply(this, arguments); try { const me = S.user.id; const p = PROFILES[me]; const ent = leaveDays(monthsBetween(p.hire), me) + yizCarry(me); const used = LEAVES.filter((x) => x.uid === me && x.type === 'yillik').reduce((a, x) => a + x.days, 0); const ym = REF_ISO.slice(0, 7); const av = REQS.filter((x) => x.uid === me && x.kind === 'avans' && x.st === 'onay' && String(x.date0 || '').slice(0, 7) === ym).reduce((a, x) => a + x.amt, 0); const pend = LVREQ.filter((x) => x.uid === me && ['bekliyor', 'yanit', 'karsi'].includes(x.status)).length + REQS.filter((x) => x.uid === me && x.st === 'bekliyor').length;
  const strip = `<div class="kpis hk"><div class="kpi"><div class="l">Kalan izin</div><div class="v num">${Math.max(0, ent - used)} gün</div></div><div class="kpi"><div class="l">Bu ay avans</div><div class="v num">${fmt0(av)}</div></div><div class="kpi"><div class="l">Bekleyen</div><div class="v num">${pend}</div></div></div>`; h = h.replace('<div class="op-tg">', strip + '<div class="op-tg">'); } catch (e) {} return h; }; }
/* -- Çevrimdışı -- */
(function () { try {
  window.addEventListener('online', () => { try { PS.last = ''; pSched(); if (typeof xlSync === 'function') xlSync(); } catch (e) {} });
  setInterval(() => { try { if (PS.state === 'error' && navigator.onLine !== false) { PS.last = ''; pSched(); } } catch (e) {} }, 30000);
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('/sw.js').catch(() => {}); } catch (e) {} })();
/* -- Yedek -- */
H.bkopen = () => { S.modal = { type: 'yedek' }; renderModal(); };
NEWM.yedek = (m) => sheet('Yedek', `<p class="muted small">Tüm verin tek dosyada. Şifreler ve oturum bilgileri yedeğe girmez. Dosyayı güvenli bir yerde sakla.</p>
  <button class="btn block" data-a="bkdl">${ic('file')} Yedeği indir</button>
  ${S.user && S.user.role === 'patron' ? `<div class="card" style="margin-top:14px;padding:12px"><b>Yedekten geri yükle</b><p class="small muted" style="margin:4px 0 10px">Şu anki verilerin yedekteki verilerle değişir. Önce yedeğini indirmeni öneririz.</p>${m.fn ? `<div class="callout warn">${ic('alert')}<div><b>${esc(m.fn)}</b> dosyasıyla değiştirilecek.</div></div><button class="btn block" style="margin-top:8px;background:#C0392B" data-a="bkgo">Evet, geri yükle</button>` : `<label class="btn sec block" style="text-align:center;cursor:pointer">Dosya seç<input type="file" accept=".json,application/json" data-ch="bkfile" hidden></label>`}</div>` : ''}`);
H.bkdl = () => { try { const o = JSON.parse(pSnap()); delete o.AUTH; const d = new Date().toISOString().slice(0, 10); saveBlob('kaispilot-yedek-' + d + '.json', new Blob([JSON.stringify(o)], { type: 'application/json' })); toast('Yedek indirildi.', 'ok'); } catch (e) { toast('Yedek alınamadı.', 'warn'); } };
H.bkgo = () => { const m = S.modal; if (!m || !m.txt) return; try { const o = JSON.parse(m.txt); delete o.AUTH; if (!pApply(JSON.stringify(o))) throw 0; try { PS.last = ''; pSched(); } catch (e) {} S.modal = null; toast('Yedekten geri yüklendi.', 'ok'); render(); } catch (e) { toast('Yedek dosyası geçersiz.', 'warn'); } };
document.addEventListener('change', (e) => { const t = e.target; if (!t.dataset || t.dataset.ch !== 'bkfile' || !t.files || !t.files[0]) return; const f = t.files[0]; const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(String(rd.result)); if (!o || typeof o !== 'object' || !('LEDGER' in o || 'RECEIPTS' in o)) throw 0; S.modal = { type: 'yedek', fn: f.name, txt: String(rd.result) }; renderModal(); } catch (x) { toast('Bu bir KaisPilot yedeği değil.', 'warn'); } }; rd.readAsText(f); });
{ const _rm = renderModal; renderModal = function () { const r = _rm.apply(this, arguments); try { const m = S.modal; if (m && m.type === 'menu' && S.user && ['patron', 'muhasebeci'].includes(S.user.role)) { const ft = document.querySelector('#modal-root .mn-ft'); if (ft && !ft.querySelector('[data-a="bkopen"]')) { const b = document.createElement('button'); b.type = 'button'; b.dataset.a = 'bkopen'; b.innerHTML = ic('file', 18) + 'Yedek'; ft.insertBefore(b, ft.firstChild); } } } catch (e) {} return r; }; }

/* ===== v140: Raporlar + şubeler ===== */
const BRANCHES = []; P_ARR.push(['BRANCHES', () => BRANCHES]); P_SCOPE.BRANCHES = 'muh';
const rxOk = () => !!S.user && ['patron', 'muhasebeci'].includes(S.user.role);
NAV.patron.push(['rapor', 'Raporlar', 'trend', 'more']); NAV.muhasebeci.push(['rapor', 'Raporlar', 'trend', 'more']); TITLES.rapor = 'Raporlar';
{ const _vh = viewHTML; viewHTML = function () { if (S.view === 'rapor' && rxOk()) return viewRaporX(); return _vh.apply(this, arguments); }; }
const rxBr = (r) => (r.br && BRANCHES.some((b) => b.id === r.br)) ? r.br : '';
const rxRows = () => LEDGER.filter((r) => { const f = S.rbr || ''; if (!f) return true; return f === '_none' ? !rxBr(r) : rxBr(r) === f; });
const rxSum = (rows, per, dir) => rows.filter((r) => lper(r) === per && dirOf(r) === dir).reduce((a, r) => a + (Number(r.total) || 0), 0);
function rxCats(rows, per) { const m = {}; rows.filter((r) => lper(r) === per && dirOf(r) === 'gider').forEach((r) => { m[r.acc] = (m[r.acc] || 0) + (Number(r.total) || 0); }); return m; }
function rxWhy(rows) {
  const g1 = rxSum(rows, CURM, 'gelir'), x1 = rxSum(rows, CURM, 'gider'), g0 = rxSum(rows, PREVM, 'gelir'), x0 = rxSum(rows, PREVM, 'gider'); const n1 = g1 - x1, n0 = g0 - x0;
  const c1 = rxCats(rows, CURM), c0 = rxCats(rows, PREVM); const up = Object.keys(c1).map((k) => [k, c1[k] - (c0[k] || 0)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const dG = g1 - g0; let t = `${CURM} şu ana kadar net ${n1 >= 0 ? 'kâr' : 'zarar'}: ${fmt0(Math.abs(n1))}. `;
  if (!g1 && !x1) return { t: 'Bu ay için henüz kayıt yok.', n1, n0, up, g1, x1, g0, x0 };
  t += (g0 ? `Gelir ${PREVM} ayına göre ${dG >= 0 ? fmt0(dG) + ' fazla' : fmt0(-dG) + ' az'}` : 'Gelir ' + fmt0(g1)) + `, gider ${fmt0(x1)}. `;
  if (up.length) t += 'Giderde en çok artanlar: ' + up.map((x) => x[0] + ' (+' + fmt0(x[1]) + ')').join(', ') + '. ';
  if (n1 < 0 && g1 < g0) t += 'Zararın ana sebebi gelirin düşmesi.'; else if (n1 < 0 && up.length) t += 'Zararın ana sebebi gider artışı.';
  return { t: t.trim(), n1, n0, up, g1, x1, g0, x0 };
}
const rxBars = (items, color, fmtv) => { const mx = Math.max.apply(null, items.map((i) => i[1]).concat([1])); return `<div class="rx-bars">${items.map((i) => `<div class="rx-b" title="${esc(i[0])}: ${esc((fmtv || fmt0)(i[1]))}"><span class="rx-l">${esc(i[0])}</span><div class="rx-t"><i style="width:${Math.max(2, Math.round(i[1] / mx * 100))}%;background:${color}"></i></div><b>${(fmtv || fmt0)(i[1])}</b></div>`).join('')}</div>`; };
function viewRaporX() {
  const rows = rxRows(); const w = rxWhy(rows); const f = S.rbr || '';
  const chips = BRANCHES.length ? `<div class="cb-chips" style="margin:0"><button type="button" class="${f === '' ? 'on' : ''}" data-a="rbr" data-b="">Tüm şubeler</button>${BRANCHES.map((b) => `<button type="button" class="${f === b.id ? 'on' : ''}" data-a="rbr" data-b="${b.id}">${esc(b.name)}</button>`).join('')}<button type="button" class="${f === '_none' ? 'on' : ''}" data-a="rbr" data-b="_none">Şubesiz</button></div>` : '';
  const mo = (per, lab) => { const g = rxSum(rows, per, 'gelir'), x = rxSum(rows, per, 'gider'); return `<div class="rx-m"><div class="row between"><b>${lab}</b><span class="small ${g - x >= 0 ? 'rx-pos' : 'rx-neg'}">Net ${fmt0(g - x)}</span></div>${rxBars([['Gelir', g]], '#2a78d6')}${rxBars([['Gider', x]], '#eb6834')}</div>`; };
  const mx0 = Math.max(rxSum(rows, PREVM, 'gelir'), rxSum(rows, PREVM, 'gider'), rxSum(rows, CURM, 'gelir'), rxSum(rows, CURM, 'gider'), 1);
  const c1 = rxCats(rows, CURM), c0 = rxCats(rows, PREVM); const keys = Array.from(new Set(Object.keys(c1).concat(Object.keys(c0)))).sort((a, b) => (c1[b] || 0) - (c1[a] || 0)).slice(0, 7);
  const catRows = keys.map((k) => { const a = c1[k] || 0, b0 = c0[k] || 0, d = a - b0; return `<div class="rx-c"><span>${esc(k)}</span><b>${fmt0(a)}</b><small class="${d > 0 ? 'rx-neg' : 'rx-pos'}">${b0 ? (d >= 0 ? '+' : '−') + fmt0(Math.abs(d)) : 'yeni'}</small></div>`; }).join('');
  const cu = {}; INV.filter((v) => !f || (f === '_none' ? !v.br : v.br === f)).forEach((v) => { cu[v.cust] = (cu[v.cust] || 0) + v.tot; }); const cuL = Object.entries(cu).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const su = {}; rows.filter((r) => dirOf(r) === 'gider').forEach((r) => { const n = String(r.desc || '').replace(/\s*\(.*\)\s*$/, '').trim() || '—'; su[n] = (su[n] || 0) + (Number(r.total) || 0); }); const suL = Object.entries(su).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const brTbl = BRANCHES.length ? `<div class="card stack"><div><h3>Şube karşılaştırma</h3><p class="muted small" style="margin-top:2px">${CURM}</p></div>${BRANCHES.map((b) => ({ n: b.name, id: b.id })).concat([{ n: 'Şubesiz', id: '_none' }]).map((b) => { const rr = LEDGER.filter((r) => b.id === '_none' ? !rxBr(r) : rxBr(r) === b.id); const g = rxSum(rr, CURM, 'gelir'), x = rxSum(rr, CURM, 'gider'); return { n: b.n, g, x }; }).filter((b) => b.g || b.x).map((b) => `<div class="rx-c" style="grid-template-columns:1fr auto auto"><span>${esc(b.n)}</span><span class="small muted">Gelir ${fmt0(b.g)} · Gider ${fmt0(b.x)}</span><b class="${b.g - b.x >= 0 ? 'rx-pos' : 'rx-neg'}">${fmt0(b.g - b.x)}</b></div>`).join('') || '<p class="small muted">Satırlara şube atayınca burada karşılaştırma çıkar.</p>'}</div>` : '';
  return `<div class="stack-lg rx"><div><h2>Raporlar</h2><p class="muted small" style="margin-top:4px">Gelir ve gider tablosundan hesaplanır.</p></div>${chips}
  <div class="card stack"><div class="row" style="gap:8px;align-items:center">${ic('sparkle', 18)}<h3>${w.n1 >= 0 ? 'Bu ay neden kârdayız?' : 'Bu ay neden zarardayız?'}</h3></div><p>${esc(w.t)}</p>${w.up.length ? rxBars(w.up.map((x) => [x[0], x[1]]), '#eb6834') : ''}<p class="small muted">Ay devam ediyorsa rakamlar kesinleşmemiştir.</p></div>
  <div class="card stack"><div><h3>Aylık karşılaştırma</h3><div class="rx-lg"><span><i style="background:#2a78d6"></i>Gelir</span><span><i style="background:#eb6834"></i>Gider</span></div></div>${mo(PREVM, PREVM)}${mo(CURM, CURM + ' (devam ediyor)')}</div>
  <div class="card stack"><div><h3>Gider kalemleri</h3><p class="muted small" style="margin-top:2px">${CURM}, geçen aya göre fark</p></div>${catRows || '<p class="small muted">Henüz gider yok.</p>'}</div>
  <div class="card stack"><div><h3>En çok fatura kestiklerin</h3></div>${cuL.length ? rxBars(cuL, '#2a78d6') : '<p class="small muted">Fatura kestikçe müşteriler burada sıralanır.</p>'}</div>
  <div class="card stack"><div><h3>En çok ödeme yaptıkların</h3></div>${suL.length ? rxBars(suL, '#eb6834') : '<p class="small muted">Henüz gider yok.</p>'}</div>
  ${brTbl}
  <div class="card stack"><div><h3>Şubeler</h3><p class="muted small" style="margin-top:2px">Birden fazla yerin varsa ekle. Gelir ve gider satırlarına şube atayınca rapor şubeye göre ayrılır.</p></div>${BRANCHES.map((b) => `<div class="cb-my"><span>${esc(b.name)}<br><small class="muted">${LEDGER.filter((r) => rxBr(r) === b.id).length} satır</small></span><button type="button" data-a="brdel" data-id="${b.id}" aria-label="Sil">×</button></div>`).join('')}<div class="row" style="gap:8px;align-items:center"><div class="field" style="flex:1;margin:0"><input id="br-new" maxlength="30" placeholder="Örn. Kadıköy şubesi"></div><button class="btn sm" data-a="bradd">Ekle</button></div>${BRANCHES.length ? `<button class="btn sm sec" data-a="brall">Şubesiz tüm satırları ${f && f !== '_none' ? esc((BRANCHES.find((b) => b.id === f) || {}).name || '') + ' şubesine ata' : 'bir şubeye ata'}</button>` : ''}</div></div>`;
}
H.rbr = (el) => { S.rbr = el.dataset.b || ''; render(); };
H.bradd = () => { const i = document.getElementById('br-new'); const n = i && i.value.trim(); if (!n) return; if (BRANCHES.some((b) => b.name.toLocaleLowerCase('tr') === n.toLocaleLowerCase('tr'))) { toast('Bu şube zaten var.', 'warn'); return; } BRANCHES.push({ id: 'br' + (++seq), name: n }); try { pSched(); } catch (e) {} toast('Şube eklendi.', 'ok'); render(); };
H.brdel = (el) => { const i = BRANCHES.findIndex((b) => b.id === el.dataset.id); if (i < 0) return; const n = LEDGER.filter((r) => rxBr(r) === el.dataset.id).length; if (n && !confirm(BRANCHES[i].name + ' silinsin mi? ' + n + ' satır şubesiz kalır.')) return; BRANCHES.splice(i, 1); if (S.rbr === el.dataset.id) S.rbr = ''; try { pSched(); } catch (e) {} render(); };
H.brall = () => { const f = S.rbr; const t = f && f !== '_none' ? f : BRANCHES[0].id; const n = LEDGER.filter((r) => !rxBr(r)).length; LEDGER.forEach((r) => { if (!rxBr(r)) r.br = t; }); try { pSched(); } catch (e) {} toast(n + ' satır ' + BRANCHES.find((b) => b.id === t).name + ' şubesine atandı.', 'ok'); render(); };
/* tabloda satıra şube ata */
function brTag() { try { if (!BRANCHES.length || !rxOk()) return; document.querySelectorAll('main .tb-f').forEach((box) => { if (box.querySelector('[data-brsel]')) return; const a = box.querySelector('[data-k="acc"][data-id]'); if (!a) return; const row = LEDGER.find((r) => r.id === a.dataset.id); if (!row) return; const d = document.createElement('div'); d.className = 'field'; d.innerHTML = `<label>Şube</label><select data-brsel="${row.id}"><option value="">Şubesiz</option>${BRANCHES.map((b) => `<option value="${b.id}"${rxBr(row) === b.id ? ' selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`; const del = box.querySelector('[data-a="ldel"]'); if (del) del.parentNode.insertBefore(d, del); else box.appendChild(d); }); } catch (e) {} }
{ const _r = render; render = function () { const r = _r.apply(this, arguments); brTag(); return r; }; }
document.addEventListener('change', (e) => { const t = e.target; if (!t.dataset || t.dataset.brsel == null) return; const r = LEDGER.find((x) => x.id === t.dataset.brsel); if (r) { r.br = t.value; try { pSched(); } catch (x) {} toast('Şube kaydedildi.', 'ok'); } });
/* faturada şube */
{ const _nf = NEWM.fatura; NEWM.fatura = function (m) { let h = _nf.apply(this, arguments); if (!BRANCHES.length) return h; if (m.br == null) m.br = S.rbr && S.rbr !== '_none' ? S.rbr : ''; const sel = `<div class="field"><label>Şube</label><select data-fi="br"><option value="">Şubesiz</option>${BRANCHES.map((b) => `<option value="${b.id}"${m.br === b.id ? ' selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>`; return h.replace('<label class="small" style="display:flex;gap:8px;align-items:center;margin:10px 0">', sel + '<label class="small" style="display:flex;gap:8px;align-items:center;margin:10px 0">'); }; }
{ const _fs = H.fisave; H.fisave = function () { const m = S.modal; const n = INV.length; const br = m && m.br; _fs.apply(this, arguments); if (INV.length > n && br) { const v = INV[INV.length - 1]; v.br = br; const l = LEDGER[LEDGER.length - 1]; if (l && l.desc && l.desc.indexOf(v.no) >= 0) l.br = br; } }; }
/* Kais: neden zarar/kâr */
{ const _k4 = kaIntent; kaIntent = function (text) { const f = kaFold(text); if (f.length < 120 && /(neden|niye|nicin)/.test(f) && /\b(zarar|kar|kazan|kayip)/.test(f)) { if (!rxOk() && !(S.user && S.user.role === 'mudur')) return _k4.apply(this, arguments); const w = rxWhy(LEDGER); return { content: w.t + ' Ayrıntı için Raporlar sayfasına bak.' }; } return _k4.apply(this, arguments); }; }
(function () { try { const st = document.createElement('style'); st.textContent = '.rx-bars{display:flex;flex-direction:column;gap:6px}.rx-b{display:grid;grid-template-columns:96px 1fr auto;gap:8px;align-items:center;font:500 12.5px system-ui;color:#52606F}.rx-l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rx-t{height:12px;background:#EEF2F8;border-radius:4px;overflow:hidden}.rx-t i{display:block;height:100%;border-radius:0 4px 4px 0}.rx-b b{color:#0E2B4D;font-weight:700;min-width:64px;text-align:right}.rx-m{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid #EEF2F8}.rx-lg{display:flex;gap:14px;font:500 12px system-ui;color:#52606F;margin-top:6px}.rx-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}.rx-c{display:grid;grid-template-columns:1fr auto 76px;gap:8px;align-items:baseline;padding:8px 0;border-top:1px solid #EEF2F8;font:500 13.5px system-ui;color:#0E2B4D}.rx-c small{text-align:right;font-weight:600}.rx-pos{color:#0A7D50}.rx-neg{color:#C0392B}.rx-c b{font-weight:700}'; document.head.appendChild(st); } catch (e) {} })();

/* ===== v141: hesap silerken neden sor, silmeden önce yedek ===== */
const DEL_R = ['Artık kullanmıyorum', 'Çok pahalı', 'Aradığım özellik yok', 'Başka bir program kullanıyorum', 'Kullanması zor', 'Sadece denemek istedim', 'Diğer'];
DEL.reason = ''; DEL.note = '';
{ const _d = NEWM.delacc; NEWM.delacc = function () { let h = _d.apply(this, arguments); const own = delCloud() && delOwner();
  const why = `<div class="field"><label>Neden ayrılıyorsun? <span class="muted small">(isteğe bağlı)</span></label><div class="cb-chips" style="flex-wrap:wrap;overflow:visible">${DEL_R.map((r) => `<button type="button" class="${DEL.reason === r ? 'on' : ''}" data-a="delr" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div><textarea id="del-n" rows="2" maxlength="300" placeholder="Eklemek istediğin bir şey var mı?" style="margin-top:8px">${esc(DEL.note)}</textarea><p class="small muted" style="margin:4px 0 0">Cevabın kimliğinle eşleştirilmeden saklanır, ürünü geliştirmek için kullanılır.</p></div>`;
  const bk = own && rpOk() ? `<button class="btn sec block" data-a="bkdl" style="margin-bottom:10px">${ic('file')} Önce verimi yedek olarak indir</button>` : '';
  return h.replace('<div class="field"><label for="del-c">', bk + why + '<div class="field"><label for="del-c">'); }; }
H.delr = (el) => { DEL.reason = DEL.reason === el.dataset.v ? '' : el.dataset.v; const n = document.getElementById('del-n'); if (n) DEL.note = n.value; renderModal(); };
document.addEventListener('input', (e) => { if (e.target && e.target.id === 'del-n') DEL.note = e.target.value; });
{ const _g = H.delgo; H.delgo = async function () { const el = document.getElementById('del-c'); if (DEL.busy || !el || kaFold(el.value) !== 'sil') return; try { if (delCloud() && (DEL.reason || DEL.note.trim())) await sbClient().from('account_feedback').insert({ reason: DEL.reason || null, note: DEL.note.trim() || null, role: S.user ? S.user.role : null, was_owner: delOwner() }); } catch (e) {} return _g.apply(this, arguments); }; }

/* v142 Bildirimler: izin talebi ve çalışan fişi yöneticiye anında bildirim gider */
{
  const lvNtfMgrs = () => USERS.filter((u) => ['patron', 'mudur'].includes(u.role) && u.id !== (S.user && S.user.id)).map((u) => u.id);
  const _lr = H.lrsend; H.lrsend = function () {
    const n0 = LVREQ.length; const r = _lr.apply(this, arguments);
    try { if (LVREQ.length > n0) { const x = LVREQ[LVREQ.length - 1]; pushSend(lvNtfMgrs(), 'Yeni izin talebi', S.user.name + ': ' + (x.txt || '') + (x.days ? ' (' + x.days + ' gün)' : '')); } } catch (e) {}
    return r;
  };
  const _sr = H.savereceipt; H.savereceipt = function () {
    const n0 = RECEIPTS.length; const r = _sr.apply(this, arguments);
    try { if (RECEIPTS.length > n0) { const x = RECEIPTS[RECEIPTS.length - 1]; if (x && x.status === 'bekliyor') pushSend(lvNtfMgrs(), 'Onay bekleyen fiş', S.user.name + ': ' + (x.seller || 'Fiş') + ' · ' + fmt0(x.total || 0)); } } catch (e) {}
    return r;
  };
}

/* v143 Raporlar: dönem seçimi + CSV / PDF çıktı */
const RXP = [['m0', 'Bu ay'], ['m1', 'Geçen ay'], ['m3', 'Son 3 ay'], ['y', 'Bu yıl']];
const rxIsoMon = (d, k) => d.getFullYear() * 12 + d.getMonth() + k;
function rxPerRows(key) {
  const n = new Date(); const cur = rxIsoMon(n, 0);
  const want = key === 'm1' ? [cur - 1, cur - 1] : key === 'm3' ? [cur - 2, cur] : key === 'y' ? [n.getFullYear() * 12, cur] : [cur, cur];
  return rxRows().filter((r) => {
    let m = null;
    if (r.iso && /^\d{4}-\d{2}/.test(r.iso)) m = Number(r.iso.slice(0, 4)) * 12 + Number(r.iso.slice(5, 7)) - 1;
    else { const l = lper(r); m = l === CURM ? cur : l === PREVM ? cur - 1 : null; }
    return m != null && m >= want[0] && m <= want[1];
  });
}
function rxPerData() {
  const k = S.rxp || 'm0'; const rows = rxPerRows(k); const lab = (RXP.find((x) => x[0] === k) || RXP[0])[1];
  const g = rows.filter((r) => dirOf(r) === 'gelir').reduce((a, r) => a + (Number(r.total) || 0), 0), x = rows.filter((r) => dirOf(r) === 'gider').reduce((a, r) => a + (Number(r.total) || 0), 0);
  const c = {}; rows.filter((r) => dirOf(r) === 'gider').forEach((r) => { c[r.acc || 'Diğer'] = (c[r.acc || 'Diğer'] || 0) + (Number(r.total) || 0); });
  return { k, rows, lab, g, x, cats: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6) };
}
function rxPerCard() {
  const d = rxPerData();
  return `<div class="card stack"><div><h3>Dönem raporu</h3><p class="muted small" style="margin-top:2px">Dönemi seç, özeti gör, dosya olarak al.</p></div>
  <div class="cb-chips" style="margin:0">${RXP.map((p) => `<button type="button" class="${d.k === p[0] ? 'on' : ''}" data-a="rxper" data-v="${p[0]}">${p[1]}</button>`).join('')}</div>
  <div class="rx-m"><div class="row between"><span>Gelir</span><b>${fmt0(d.g)}</b></div><div class="row between"><span>Gider</span><b>${fmt0(d.x)}</b></div><div class="row between"><span>Net</span><b class="${d.g - d.x >= 0 ? 'rx-pos' : 'rx-neg'}">${fmt0(d.g - d.x)}</b></div></div>
  ${d.cats.length ? rxBars(d.cats, '#eb6834') : '<p class="small muted">Bu dönemde gider kaydı yok.</p>'}
  <p class="small muted">${d.rows.length} satır</p>
  <div class="row" style="gap:8px"><button class="btn sec" style="flex:1" data-a="rxcsv">${ic('file')} Excel (CSV)</button><button class="btn sec" style="flex:1" data-a="rxpdf">${ic('file')} PDF / Yazdır</button></div></div>`;
}
{ const _v = viewRaporX; viewRaporX = function () { const h = _v.apply(this, arguments); const i = h.indexOf('<div class="card stack"><div><h3>Aylık karşılaştırma</h3>'); return i < 0 ? h : h.slice(0, i) + rxPerCard() + h.slice(i); }; }
H.rxper = (el) => { S.rxp = el.dataset.v; render(); };
H.rxcsv = () => { const d = rxPerData(); const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const L = [['Tarih', 'Yön', 'Hesap', 'Açıklama', 'KDV %', 'Tutar'].join(';')].concat(d.rows.map((r) => [q(r.iso || r.date), dirOf(r) === 'gelir' ? 'Gelir' : 'Gider', q(r.acc), q(r.desc), r.rate == null ? '' : r.rate, String(Number(r.total) || 0).replace('.', ',')].join(';')));
  L.push(['', '', '', 'Gelir', '', String(d.g).replace('.', ',')].join(';'), ['', '', '', 'Gider', '', String(d.x).replace('.', ',')].join(';'), ['', '', '', 'Net', '', String(d.g - d.x).replace('.', ',')].join(';'));
  saveBlob('rapor-' + d.k + '.csv', new Blob(['﻿' + L.join('\r\n')], { type: 'text/csv;charset=utf-8' })); toast('Rapor indirildi. Excel ile açılır.', 'ok'); };
H.rxpdf = () => { const d = rxPerData(); const e = esc; const tr = d.rows.slice(0, 400).map((r) => `<tr><td>${e(r.iso || r.date)}</td><td>${dirOf(r) === 'gelir' ? 'Gelir' : 'Gider'}</td><td>${e(r.acc || '')}</td><td>${e(r.desc || '')}</td><td style="text-align:right">${fmt0(Number(r.total) || 0)}</td></tr>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>Rapor</title><style>body{font:14px system-ui;padding:24px;color:#111}table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}h2{margin:0}</style><h2>${e(d.lab)} raporu</h2><p>Gelir <b>${fmt0(d.g)}</b> · Gider <b>${fmt0(d.x)}</b> · Net <b>${fmt0(d.g - d.x)}</b></p><table><tr><th>Tarih</th><th>Yön</th><th>Hesap</th><th>Açıklama</th><th>Tutar</th></tr>${tr}</table><script>setTimeout(function(){window.print()},300)<\/script>`;
  try { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); return; } } catch (x) {}
  saveBlob('rapor-' + d.k + '.html', new Blob([html], { type: 'text/html;charset=utf-8' })); toast('Rapor dosyası indirildi. Açıp yazdır.', 'ok'); };

/* v144 Kais AI kullanım göstergesi (yalnız patron) */
const AIU = { d: null, at: 0, busy: false };
async function aiuLoad() {
  if (AIU.busy || Date.now() - AIU.at < 60000) return; AIU.busy = true;
  try { const c = sbClient(); if (!c || !SBS.biz) return; const r = await c.functions.invoke('kais-ai', { body: { business_id: SBS.biz.id, mode: 'usage', messages: [{ role: 'user', content: 'kullanım' }] } }); if (r.data && r.data.usage) { AIU.d = r.data.usage; AIU.at = Date.now(); if (S.view === 'kaisai') render(); } else AIU.at = Date.now(); } catch (e) { AIU.at = Date.now(); } finally { AIU.busy = false; }
}
{ const _k = viewKaisAI; viewKaisAI = function () { let h = _k.apply(this, arguments); try { if (S.user && S.user.role === 'patron' && sbOK() && SBS.biz) { aiuLoad(); const u = AIU.d; if (u) { const m = (k) => u[k].month + ' / ' + u.limits[k].month; h = h.replace('<span id="ai-end"></span></div>', '<span id="ai-end"></span></div><p class="small muted" style="margin:0">Bu ay: sohbet ' + m('chat') + ' · fiş ve fiyat okuma ' + m('read') + '</p>'); } } } catch (e) {} return h; }; }

/* ===== v145: kurulum rehberi, boş ekran yönlendirmesi, davet (WhatsApp + QR), hata kaydı, kullanım sayacı, dışa aktarma ===== */
const APP_VER = 'v202';
const sbLive = () => !!(S.user && S.user.role === 'patron' && !S.demoMode && sbOK() && SBS.biz);
/* 2) Boş ekran yönlendirmesi */
function emCard(title, txt, act, lab) { return `<div class="card su-empty"><div class="grow"><b>${esc(title)}</b><p class="small muted" style="margin:4px 0 0">${esc(txt)}</p></div>${act ? `<button class="btn sm" data-a="${act}">${esc(lab)}</button>` : ''}</div>`; }
{ const _vh = viewHTML; viewHTML = function () {
  const h = _vh.apply(this, arguments); let add = '';
  try { if (sbLive()) {
    if (S.view === 'muhasebe' && !LEDGER.length && !RECEIPTS.length) add = emCard('Henüz kayıt yok', 'İlk fişini fotoğrafla ekle, Kais satıcıyı, tutarı ve KDV\'yi okur.', 'upload', 'Fiş ekle');
    else if (S.view === 'stok' && !STOCK.length) add = emCard('Stokta ürün yok', 'Ürünlerini tek tek ekle ya da fiyat listesi fotoğrafı yükle.', 'stkadd', 'Ürün ekle');
    else if (S.view === 'ekip' && !EMP_IDS.length) add = emCard('Henüz çalışan yok', 'Ekip sayfasından çalışanını davet et, kodu WhatsApp ile gönder.', '', '');
  } } catch (e) {}
  if (!add) return h; const i = h.indexOf('>'); return i < 0 ? add + h : h.slice(0, i + 1) + add + h.slice(i + 1);
}; }
/* 3) Davet: WhatsApp ve QR */
const ivLink = (code) => ((typeof location !== 'undefined' && /^http/.test(location.protocol)) ? location.origin : 'https://www.kaispilot.com') + '/?kod=' + encodeURIComponent(code);
{ const _ic = NEWM.invcode; NEWM.invcode = function (m) { let h = _ic.apply(this, arguments); try { const l = ivLink(m.code);
  h = h.replace('<button class="btn block" data-a="invcopy">Mesajı kopyala</button>', `<div class="su-qr">${qrSvg(l, 168)}<p class="small muted" style="margin:6px 0 0;text-align:center">Telefonla okutunca kod kendiliğinden yazılır</p></div><button class="btn block" data-a="invwa">WhatsApp ile gönder</button><button class="btn sec block" data-a="invcopy" style="margin-top:8px">Mesajı kopyala</button>`); } catch (e) {} return h; }; }
H.invwa = () => { const m = S.modal; if (!m || !m.code) return; const t = invText(m.code) + '\nTek dokunuşla aç: ' + ivLink(m.code); try { window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank'); } catch (e) { cpy(t, 'Mesaj kopyalandı.'); } };
/* davet bağlantısıyla gelen kişi: kod kendiliğinden yazılır */
setTimeout(() => { try { const k = new URLSearchParams(location.search).get('kod'); if (!k || S.user) return; S.lgTab = 'emp'; S.lgCreate = true; S.empMode = 'join'; render(); setTimeout(() => { const i = document.getElementById('id-code'); if (i) i.value = k.toUpperCase().slice(0, 8); }, 250); } catch (e) {} }, 600);
/* 5) Hata kaydı ve 6) kullanım sayacı: yalnızca bulut girişi varken, kişisel veri taşımaz */
const TLM = { errs: [], seen: {}, ev: {}, off: false, n: 0 };
function tlmCtx() { try { if (!sbOK() || !SBS.user || !SBS.biz) return null; return { business_id: SBS.biz.id, user_id: SBS.user.id, role: S.user ? S.user.role : null }; } catch (e) { return null; } }
function tlmErr(msg, stack) { try { msg = String(msg || '').slice(0, 300); if (!msg || TLM.seen[msg] || TLM.n >= 8) return; TLM.seen[msg] = 1; TLM.n++; TLM.errs.push({ view: S.view || null, msg, stack: String(stack || '').slice(0, 800), ua: String(navigator.userAgent || '').slice(0, 160), ver: APP_VER }); } catch (e) {} }
window.addEventListener('error', (e) => tlmErr(e.message, e.error && e.error.stack));
window.addEventListener('unhandledrejection', (e) => tlmErr(e.reason && e.reason.message || e.reason, e.reason && e.reason.stack));
function tlmEv(k) { TLM.ev[k] = (TLM.ev[k] || 0) + 1; }
async function tlmFlush() {
  if (TLM.off) return; const x = tlmCtx(); if (!x) return; const c = sbClient(); if (!c) return;
  const errs = TLM.errs.splice(0), ev = TLM.ev; TLM.ev = {};
  try {
    if (errs.length) { const r = await c.from('app_errors').insert(errs.map((e) => Object.assign({}, x, e))); if (r.error && /app_errors|schema cache|does not exist/i.test(r.error.message || '')) TLM.off = true; }
    const rows = Object.keys(ev).map((k) => Object.assign({}, x, { ev: k, n: ev[k] })); if (rows.length && !TLM.off) { const r = await c.from('app_events').insert(rows); if (r.error && /app_events|schema cache|does not exist/i.test(r.error.message || '')) TLM.off = true; }
  } catch (e) {}
}
setInterval(tlmFlush, 60000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') tlmFlush(); });
{ const _n = H.nav; H.nav = function (el) { try { if (el && el.dataset && el.dataset.v) tlmEv('v:' + el.dataset.v); } catch (e) {} return _n.apply(this, arguments); }; }
['fisave', 'savereceipt', 'aisend', 'xlsx', 'rxcsv', 'rxpdf', 'invmake', 'invwa', 'kdvcsv', 'bkdl', 'lrsend'].forEach((n) => { const f = H[n]; if (typeof f === 'function') H[n] = function () { try { tlmEv('a:' + n); } catch (e) {} return f.apply(this, arguments); }; });
/* 7) Yıllık dışa aktarma kartı (Raporlar) */
function expCard() {
  return `<div class="card stack"><div><h3>Dışa aktar</h3><p class="muted small" style="margin-top:2px">Muhasebeciye vermek ya da arşivlemek için.</p></div>
  <button class="btn sec block" data-a="xlsx">${ic('file')} Tüm kayıtlar (Excel)</button>
  <button class="btn sec block" data-a="expfat">${ic('file')} Faturalar (CSV)</button>
  ${S.user && S.user.role === 'patron' ? `<button class="btn sec block" data-a="bkdl">${ic('file')} Tüm veri yedeği</button>` : ''}</div>`;
}
{ const _v = viewRaporX; viewRaporX = function () { const h = _v.apply(this, arguments); const i = h.indexOf('<div class="card stack"><div><h3>Aylık karşılaştırma</h3>'); return i < 0 ? h : h.slice(0, i) + expCard() + h.slice(i); }; }
H.expfat = () => { const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; const L = [['No', 'Tarih', 'Müşteri', 'Tutar', 'Durum', 'Vade'].join(';')].concat(INV.map((v) => [q(v.no), q(v.iso || v.date || ''), q(v.cust), String(Number(v.tot) || 0).replace('.', ','), v.st === 'odendi' ? 'Ödendi' : 'Bekliyor', q(v.due || '')].join(';')));
  saveBlob('faturalar.csv', new Blob(['﻿' + L.join('\r\n')], { type: 'text/csv;charset=utf-8' })); toast('Faturalar indirildi.', 'ok'); };
(function () { try { const st = document.createElement('style'); st.textContent = '.su-empty{display:flex;gap:12px;align-items:center}.su-qr{display:grid;place-items:center;margin:8px 0}.su-qr svg{border-radius:8px;background:#fff;padding:6px}'; document.head.appendChild(st); } catch (e) {} })();

/* v146 Askıya alınan işletme girişi: sütun yoksa sessizce atlanır */
{ const _ie = idEnter; idEnter = async function () {
  try { const c = sbClient(); if (c && SBS.user && ID.active) { const r = await c.from('businesses').select('suspended_at').eq('id', ID.active.business_id).maybeSingle();
    if (!r.error && r.data && r.data.suspended_at) { try { await c.auth.signOut(); } catch (e) {} SBS.user = null; SBS.biz = null; ID.active = null; ID.mems = []; S.loginErr = 'Bu işletmenin hesabı askıya alınmış. Destek ile iletişime geç.'; render(); return; } } } catch (e) {}
  return _ie.apply(this, arguments); }; }

/* v147 Duyuru şeridi, özellik bayrakları, destek talepleri */
const KX = { flags: [], ann: [], tix: null, busy: false };
function FLAG(k) { return KX.flags.indexOf(k) >= 0; }
async function kxLoad() {
  try {
    const c = sbClient(); if (!c || !SBS.user) return;
    try { const f = await c.rpc('my_flags'); if (!f.error && Array.isArray(f.data)) KX.flags = f.data; } catch (e) {}
    try { const a = await c.from('admin_announcements').select('id,title,body,kind,created_at').order('created_at', { ascending: false }).limit(5); if (!a.error) KX.ann = a.data || []; } catch (e) {}
    kxBar();
  } catch (e) {}
}
function kxSeen() { try { return JSON.parse(localStorage.getItem('kp_ann_seen') || '[]'); } catch (e) { return []; } }
function kxBar() {
  let el = document.getElementById('ann-bar');
  const seen = kxSeen(); const a = (KX.ann || []).find((x) => seen.indexOf(x.id) < 0);
  if (!a || !SBS.user) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ann-bar'; document.body.appendChild(el); }
  const col = a.kind === 'warn' ? '#b45309' : a.kind === 'ok' ? '#15803d' : '#1d4ed8';
  el.style.cssText = 'position:fixed;left:10px;right:10px;top:max(10px,env(safe-area-inset-top));z-index:9999;background:#fff;color:#111;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.22);padding:12px 14px;display:flex;gap:10px;align-items:flex-start;border-left:5px solid ' + col + ';max-width:560px;margin:0 auto';
  el.innerHTML = '<div style="flex:1;min-width:0"><b style="display:block;font-size:14.5px">' + esc(a.title) + '</b>' + (a.body ? '<div style="font-size:13.5px;color:#444;margin-top:3px;white-space:pre-wrap">' + esc(a.body) + '</div>' : '') + '</div><button data-annx="' + esc(a.id) + '" style="border:0;background:#eef0f3;border-radius:9px;min-width:44px;min-height:44px;font-size:13px;font-weight:600">Tamam</button>';
}
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-annx]'); if (!b) return; const s = kxSeen(); s.push(b.dataset.annx); try { localStorage.setItem('kp_ann_seen', JSON.stringify(s.slice(-50))); } catch (x) {} kxBar(); });
{ const _ie2 = idEnter; idEnter = async function () { const r = await _ie2.apply(this, arguments); try { kxLoad(); } catch (e) {} return r; }; }
setInterval(() => { try { if (SBS.user && !document.hidden) kxLoad(); } catch (e) {} }, 600000);

async function kxTickets() {
  try { const c = sbClient(); const r = await c.from('support_tickets').select('id,created_at,kind,message,status,reply,replied_at').eq('user_id', SBS.user.id).order('created_at', { ascending: false }).limit(10); KX.tix = r.error ? [] : (r.data || []); } catch (e) { KX.tix = []; }
  if (S.modal && S.modal.type === 'support') renderModal();
}
NEWM.support = () => {
  const t = KX.tix;
  const list = t === null ? '<p class="muted small">Yükleniyor…</p>' : !t.length ? '<p class="muted small">Henüz mesajın yok.</p>' : t.map((x) => '<div class="card" style="padding:10px 12px;margin-top:8px"><div class="small muted">' + esc(new Date(x.created_at).toLocaleDateString('tr-TR')) + ' · ' + (x.status === 'solved' ? 'Çözüldü' : 'Açık') + '</div><div style="margin-top:4px;white-space:pre-wrap">' + esc(x.message) + '</div>' + (x.reply ? '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:var(--bg2,#f4f6f9)"><b class="small">Kais ekibi</b><div style="white-space:pre-wrap">' + esc(x.reply) + '</div></div>' : '') + '</div>').join('');
  return sheet('Destek', '<p class="muted">Bir sorun, öneri ya da sorun varsa yaz. Ekibimiz buradan cevap verir.</p><div class="field"><label for="sp-k">Konu</label><select id="sp-k"><option value="sorun">Sorun bildir</option><option value="oneri">Öneri</option><option value="soru">Soru</option></select></div><div class="field"><label for="sp-m">Mesajın</label><textarea id="sp-m" rows="4" style="width:100%;font-size:16px" placeholder="Ne oldu? Hangi ekranda?"></textarea></div><button class="btn block" data-a="spsend">Gönder</button><h3 style="margin-top:18px">Mesajların</h3>' + list);
};
H.support = () => { KX.tix = null; S.modal = { type: 'support' }; renderModal(); kxTickets(); };
H.spsend = async () => {
  if (KX.busy) return; const m = ($('#sp-m') || {}).value || ''; const k = ($('#sp-k') || {}).value || 'sorun'; if (m.trim().length < 5) return toast('Mesajı biraz daha ayrıntılı yaz.', 'warn');
  KX.busy = true;
  try {
    const c = sbClient(); const row = { business_id: ID.active.business_id, user_id: SBS.user.id, role: S.user ? S.user.role : null, kind: k, message: m.trim().slice(0, 1500), ver: APP_VER };
    let r = await c.from('support_tickets').insert(row);
    if (r.error) { await new Promise((ok) => setTimeout(ok, 1500)); r = await c.from('support_tickets').insert(row); }
    if (r.error) throw r.error; toast('Mesajın iletildi.', 'ok'); try { tlmEv('a:support'); } catch (e) {} await kxTickets();
  } catch (e) { toast('Gönderilemedi. Biraz sonra tekrar dene.', 'warn'); }
  KX.busy = false;
};
{ const _va = viewAyarlar; viewAyarlar = function () { const h = _va.apply(this, arguments); const card = '<div class="card stack" style="margin-bottom:12px"><div><h3>Destek</h3><p class="muted small" style="margin-top:2px">Sorun, öneri ya da sorunun mu var? Bize yaz, buradan cevap veririz.</p></div><button class="btn sec block" data-a="support">Destek ile yaz</button></div>'; return card + h; }; }

/* --- 3) Tahsilat merkezi: vadesi geçen faturalar için WhatsApp hatırlatma --- */
const TK = { tone: {}, msg: {}, open: null };
const tkDays = (v) => { if (!v.due) return 0; return Math.max(0, Math.floor((new Date(fiIso() + 'T00:00:00Z') - new Date(v.due + 'T00:00:00Z')) / 864e5)); };
const tkAuto = (d) => (d <= 7 ? 'nazik' : d <= 21 ? 'net' : 'son');
const tkTone = { nazik: 'Nazik', net: 'Net', son: 'Son uyarı' };
function tkGroups() {
  const m = {}; INV.filter((v) => fiLate(v)).forEach((v) => { const k = String(v.cust || '—').trim().toLocaleLowerCase('tr'); (m[k] || (m[k] = { key: k, name: v.cust || '—', inv: [] })).inv.push(v); });
  return Object.values(m).map((g) => { g.inv.sort((a, b) => (a.due < b.due ? -1 : 1)); g.total = g.inv.reduce((t, v) => t + ivOpen(v), 0); g.days = Math.max.apply(null, g.inv.map(tkDays)); g.last = Math.max.apply(null, g.inv.map((v) => (v.rem && v.rem.length ? v.rem[v.rem.length - 1].t : 0)).concat([0])); return g; }).sort((a, b) => b.days - a.days || b.total - a.total);
}
function tkPhone(g) { const f = FCUST.find((x) => String(x.name).trim().toLocaleLowerCase('tr') === g.key); const c = (typeof CUSTOMERS !== 'undefined' ? CUSTOMERS : []).find((x) => String(x.name).trim().toLocaleLowerCase('tr') === g.key); return (f && (f.tel || f.phone)) || (c && (c.phone || c.tel)) || ''; }
function tkText(g, tone) {
  const dd = (iso) => iso.split('-').reverse().join('.'); const iban = (EDOC && EDOC.iban) || ''; const ad = String(g.name).split(/\s+/)[0];
  const one = g.inv.length === 1; const lines = g.inv.map((v) => `• ${v.no} · ${fmt0(ivOpen(v))} · vade ${dd(v.due)} (${tkDays(v)} gün)`).join('\n');
  const head = `Merhaba ${ad},`;
  const body = tone === 'nazik' ? (one ? `${BIZ} olarak ${g.inv[0].no} numaralı faturamızın (${fmt0(g.total)}) vadesi ${dd(g.inv[0].due)} tarihinde doldu. Gözden kaçmış olabilir diye hatırlatmak istedik. Ödemeyi yaptıysanız lütfen dikkate almayın.` : `${BIZ} olarak aşağıdaki faturalarımızın vadesi doldu. Gözden kaçmış olabilir diye hatırlatmak istedik. Ödemeyi yaptıysanız lütfen dikkate almayın.\n${lines}\nToplam: ${fmt0(g.total)}`)
    : tone === 'net' ? `${BIZ} olarak aşağıdaki ${one ? 'faturanın' : 'faturaların'} ödemesi ${g.days} gündür bekliyor.\n${lines}${one ? '' : '\nToplam: ' + fmt0(g.total)}\nÖdemeyi bu hafta içinde yapabilir misiniz? Uygun değilse ödeme tarihini bildirmenizi rica ederiz.`
    : `${BIZ} olarak aşağıdaki ${one ? 'faturanın' : 'faturaların'} ödemesi ${g.days} gündür gecikmiş durumda.\n${lines}${one ? '' : '\nToplam: ' + fmt0(g.total)}\nYarın akşama kadar ödeme ya da net ödeme tarihi bilgisi paylaşmanızı rica ederiz. Bir sorun varsa birlikte çözelim.`;
  return head + '\n' + body + (iban ? '\nÖdeme için IBAN: ' + iban : '') + '\nTeşekkürler.';
}
const tkAgo = (t) => { if (!t) return 'Hiç hatırlatılmadı'; const d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? 'Bugün hatırlatıldı' : d + ' gün önce hatırlatıldı'; };
NEWM.tahsilat = () => {
  const G = tkGroups(); const open = INV.filter((v) => v.st !== 'odendi').reduce((t, v) => t + ivOpen(v), 0); const late = G.reduce((t, g) => t + g.total, 0);
  if (!G.length) return sheet('Tahsilat', `<div class="callout">${ic('check')}<div><b>Vadesi geçen fatura yok</b><p style="margin-top:2px">Açık faturalarının toplamı ${fmt0(open)}.</p></div></div>`);
  const top = G[0];
  const cards = G.map((g) => { const tone = TK.tone[g.key] || tkAuto(g.days); const msg = TK.msg[g.key + '|' + tone] != null ? TK.msg[g.key + '|' + tone] : tkText(g, tone); const ph = tkPhone(g); const recent = g.last && Date.now() - g.last < 3 * 864e5;
    return `<div class="card stack" style="margin-top:10px" data-tk="${esc(g.key)}"><div class="row between wrap" style="gap:6px"><div><b style="font-weight:600">${esc(g.name)}</b><div class="small muted">${g.inv.length} fatura · en eski ${g.days} gün</div></div><div style="text-align:right"><b class="num">${fmt0(g.total)}</b><div class="small ${recent ? '' : 'muted'}">${recent ? '<span class="pill p-info">' + tkAgo(g.last) + '</span>' : tkAgo(g.last)}</div></div></div>
    <div class="cb-chips" style="margin:0">${Object.keys(tkTone).map((k) => `<button type="button" class="${tone === k ? 'on' : ''}" data-a="tktone" data-k="${esc(g.key)}" data-t="${k}">${tkTone[k]}</button>`).join('')}</div>
    <div class="field" style="margin:0"><label>Telefon (WhatsApp)</label><input type="tel" inputmode="tel" data-tkph="${esc(g.key)}" value="${esc(ph)}" placeholder="05xx xxx xx xx" style="width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit"></div>
    <div class="field" style="margin:0"><label>Mesaj</label><textarea data-tkm="${esc(g.key)}" data-tone="${tone}" rows="6" style="width:100%;font-size:16px;padding:12px;border:1px solid var(--line,#d9dde3);border-radius:12px;background:var(--card,#fff);color:inherit">${esc(msg)}</textarea></div>
    <div class="row wrap"><button class="btn sm" data-a="tkwa" data-k="${esc(g.key)}">WhatsApp ile gönder</button><button class="btn sm sec" data-a="tkcopy" data-k="${esc(g.key)}">Kopyala</button><button class="btn sm sec" data-a="tkpaid" data-k="${esc(g.key)}">Tahsil edildi</button></div></div>`; }).join('');
  return sheet('Tahsilat', `<div class="kpis"><div class="kpi"><div class="l">Vadesi geçen</div><div class="v num">${fmt0(late)}</div></div><div class="kpi"><div class="l">Açık toplam</div><div class="v num">${fmt0(open)}</div></div><div class="kpi"><div class="l">Kişi</div><div class="v num">${G.length}</div></div></div>
  <div class="callout" style="margin-top:10px">${ic('sparkle')}<div><b>Kais önerisi</b><p style="margin-top:2px">Önce ${esc(top.name)} ile ilgilen: ${top.days} gündür ${fmt0(top.total)} bekliyor. Gecikmeye göre ton otomatik seçildi, istersen değiştir.</p></div></div>${cards}`);
};
H.tahsilat = () => { S.modal = { type: 'tahsilat' }; renderModal(); };
const tkGroup = (k) => tkGroups().find((g) => g.key === k);
H.tktone = (el) => { TK.tone[el.dataset.k] = el.dataset.t; renderModal(); };
document.addEventListener('input', (e) => { const t = e.target; if (t.dataset && t.dataset.tkm != null) TK.msg[t.dataset.tkm + '|' + t.dataset.tone] = t.value; });
document.addEventListener('change', (e) => { const t = e.target; if (!t.dataset || t.dataset.tkph == null) return; const g = tkGroup(t.dataset.tkph); if (!g) return; let f = FCUST.find((x) => String(x.name).trim().toLocaleLowerCase('tr') === g.key); if (!f) { f = { id: 'fc' + (++seq), name: g.name, vkn: '', adr: '', eposta: '' }; FCUST.push(f); } f.tel = t.value.trim(); try { pSched(); } catch (x) {} });
const tkNote = (g, tone, ch) => { g.inv.forEach((v) => { (v.rem || (v.rem = [])).push({ t: Date.now(), tone, ch }); }); try { pSched(); } catch (e) {} };
H.tkwa = (el) => {
  const g = tkGroup(el.dataset.k); if (!g) return; const tone = TK.tone[g.key] || tkAuto(g.days); const ta = document.querySelector('[data-tkm="' + g.key + '"]'); const text = ta ? ta.value : tkText(g, tone);
  const ph = (document.querySelector('[data-tkph="' + g.key + '"]') || {}).value || tkPhone(g);
  if (!waPhone(ph)) { toast('Telefon numarası yaz, mesaj numaraya açılsın.', 'warn'); }
  tkNote(g, tone, 'wa'); window.open(waLink(ph, text), '_blank', 'noopener'); toast('Hatırlatma kaydedildi.', 'ok'); renderModal();
};
H.tkcopy = async (el) => { const g = tkGroup(el.dataset.k); if (!g) return; const ta = document.querySelector('[data-tkm="' + g.key + '"]'); try { await navigator.clipboard.writeText(ta ? ta.value : ''); tkNote(g, TK.tone[g.key] || tkAuto(g.days), 'kopya'); toast('Mesaj kopyalandı.', 'ok'); renderModal(); } catch (e) { toast('Kopyalanamadı.', 'warn'); } };
H.tkpaid = (el) => { const g = tkGroup(el.dataset.k); if (!g) return; g.inv.forEach((v) => { v.st = 'odendi'; v.paidAt = fiIso(); }); try { pSched(); } catch (e) {} toast(g.name + ': ' + g.inv.length + ' fatura tahsil edildi.', 'ok'); render(); renderModal(); };
function tkCard() {
  if (!S.user || !['patron', 'muhasebeci'].includes(S.user.role) || typeof fiOk !== 'function' || !fiOk()) return '';
  const G = tkGroups(); if (!G.length) return '';
  const tot = G.reduce((t, g) => t + g.total, 0);
  return `<div class="card" style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><span class="su-bi" style="flex:none">${ic('wallet', 18)}</span><div class="grow"><b style="font-weight:600">${fmt0(tot)} tahsilat bekliyor</b><div class="small muted">${G.length} müşteri · en eski ${G[0].days} gün gecikmiş</div></div><button class="btn sm" data-a="tahsilat">Hatırlat</button></div>`;
}
{ const _v = viewHTML; viewHTML = function () { const h = _v.apply(this, arguments); const u = S.user; if (!u || S.modal) return h; if (!((u.role === 'patron' && S.view === 'muhasebe') || (u.role === 'muhasebeci' && S.view === 'borc'))) return h; const c = tkCard(); if (!c) return h; return /^<div[^>]*>/.test(h) ? h.replace(/^(<div[^>]*>)/, (m) => m + c) : c + h; }; }

/* --- 4) Hoş geldin turu (role göre) ve akıllı kurulum --- */
const TOUR = {
  patron: [
    { ico: 'home', t: 'Bugün ekranın', s: 'Günün özeti, bekleyen işler ve Kais\'in önerileri burada. Her sabah buradan başla.', v: 'bugun' },
    { ico: 'receipt', t: 'Fiş ve faturayı okut', s: 'Fişin fotoğrafını çek, Kais okuyup muhasebeye işlesin. Elle yazmana gerek kalmaz.', v: 'muhasebe' },
    { ico: 'users', t: 'Ekibini davet et', s: 'Müdür, muhasebeci ve çalışanlar davet koduyla kendi hesabıyla girer. Yetkileri sen belirlersin.', v: 'ekip' },
    { ico: 'sparkle', t: 'Kais\'e sor', s: '"Bu ay neden zarardayım?" gibi sorular sor. Kais verinden cevap verir.', v: 'kaisai' },
    { ico: 'trend', t: 'Raporlar ve yedek', s: 'Gelir, gider ve şube karşılaştırması Raporlar\'da. Verin her gün otomatik yedeklenir.', v: 'rapor' },
  ],
  mudur: [
    { ico: 'home', t: 'Bugün ekranın', s: 'Vardiya, bekleyen talepler ve günün işleri burada.', v: 'bugun' },
    { ico: 'users', t: 'Ekip ve vardiya', s: 'Çalışanların vardiyasını, izin ve mesai taleplerini buradan yönet.', v: 'ekip' },
    { ico: 'box', t: 'Stok', s: 'Azalan ürünler Kais tarafından takip edilir. Sayım yap, sipariş ver.', v: 'stok' },
    { ico: 'megaphone', t: 'Duyuru', s: 'Ekibe tek dokunuşla duyuru gönder.', v: 'duyuru' },
  ],
  muhasebeci: [
    { ico: 'home', t: 'Dönem özeti', s: 'Bu ayın gelir, gider ve KDV durumunu tek bakışta gör.', v: 'donem' },
    { ico: 'receipt', t: 'Belgeler', s: 'Çalışanların yüklediği fişleri onayla ya da müşteri notu ekle.', v: 'belgeler' },
    { ico: 'table', t: 'Tablo ve Excel', s: 'Defter tablosunu düzenle, Excel olarak indir.', v: 'tablo' },
    { ico: 'wallet', t: 'Borç ve alacak', s: 'Vadesi geçen faturalar için tek dokunuşla hatırlatma gönder.', v: 'borc' },
  ],
  calisan: [
    { ico: 'home', t: 'Bugün ekranın', s: 'Vardiyan, giriş çıkış ve günün görevleri burada.', v: 'bugun' },
    { ico: 'receipt', t: 'Masraf', s: 'İşletme için ödediğin bir şeyin fişini fotoğraf çekerek gönder.', v: 'masraf' },
    { ico: 'trend', t: 'Puanım', s: 'Performans puanını ve geri bildirimlerini buradan gör.', v: 'puanim' },
    { ico: 'wallet', t: 'Maaşım', s: 'Hak edişini, ödemelerini ve kalan tutarı şeffaf biçimde gör.', v: 'maasim' },
  ],
};
const tourKey = () => 'kp_tour_' + (S.user ? S.user.role : '') + '_' + (SBS && SBS.user ? SBS.user.id : 'x');
const tourSeen = () => { try { return localStorage.getItem(tourKey()) === '1'; } catch (e) { return true; } };
const tourDone = () => { try { localStorage.setItem(tourKey(), '1'); } catch (e) {} };
NEWM.tour = (m) => {
  const L = TOUR[S.user && S.user.role] || []; const i = Math.min(m.i || 0, L.length - 1); const x = L[i]; if (!x) return sheet('Hoş geldin', '');
  const last = i === L.length - 1; const nm = ((S.user && S.user.name) || '').split(' ')[0];
  return sheet(i === 0 && nm ? 'Hoş geldin, ' + nm : 'Hoş geldin', `<div class="stack" style="align-items:center;text-align:center;gap:14px;padding:6px 0 4px"><span class="su-bi" style="width:72px;height:72px;border-radius:22px;display:grid;place-items:center">${ic(x.ico, 34)}</span><div><h2 style="margin:0 0 6px">${esc(x.t)}</h2><p class="muted" style="margin:0;line-height:1.5">${esc(x.s)}</p></div>
  <div class="row" style="gap:6px;justify-content:center">${L.map((_, j) => `<span style="width:${j === i ? 22 : 8}px;height:8px;border-radius:99px;background:${j === i ? 'var(--acc, #2f6fed)' : 'var(--line, #d9dde3)'};transition:.2s"></span>`).join('')}</div></div>
  <div class="row" style="gap:8px;margin-top:14px">${i > 0 ? '<button class="btn sec" style="flex:1" data-a="tourprev">Geri</button>' : '<button class="btn sec" style="flex:1" data-a="tourskip">Atla</button>'}<button class="btn" style="flex:2" data-a="${last ? 'tourend' : 'tournext'}">${last ? 'Başla' : 'İleri'}</button></div>${x.v && !last ? `<button class="btn sec block" style="margin-top:8px" data-a="tourgo" data-v="${x.v}">Şimdi göster</button>` : ''}`);
};
H.tournext = () => { S.modal.i = (S.modal.i || 0) + 1; renderModal(); };
H.tourprev = () => { S.modal.i = Math.max(0, (S.modal.i || 0) - 1); renderModal(); };
H.tourskip = () => { tourDone(); S.modal = null; render(); };
H.tourend = () => { tourDone(); S.modal = null; render(); };
H.tourgo = (el) => { tourDone(); S.modal = null; H.nav({ dataset: { v: el.dataset.v } }); };
H.tourshow = () => { S.modal = { type: 'tour', i: 0 }; renderModal(); };
function k8TourCard() { if (!S.user) return ''; return `<div class="card stack" style="margin-bottom:12px"><div class="row between wrap" style="gap:8px"><div><h3>Yardım</h3><p class="muted small" style="margin-top:2px">Uygulamanın kısa turunu istediğin zaman yeniden izle.</p></div><button class="btn sm sec" data-a="tourshow">Turu başlat</button></div></div>`; }
{
  const _r = render; let tried = false;
  render = function () {
    const r = _r.apply(this, arguments);
    try {
      if (!tried && S.user && !S.modal && !S.demoMode && SBS && SBS.user && !tourSeen() && TOUR[S.user.role]) {
        const wiz = S.user.role === 'patron' && !S.settings.setupHide && !suSteps().every((x) => x.done) && (S.suForce || suFresh());
        if (!wiz) { tried = true; setTimeout(() => { if (!S.modal && S.user) { S.modal = { type: 'tour', i: 0 }; renderModal(); } }, 900); }
      }
    } catch (e) {}
    return r;
  };
}
/* Kurulum adımları: Kais'e ilk soru ve ilk yedek; banner sıradaki adımı söyler */
{
  const _s = suSteps; suSteps = function () {
    const a = _s.apply(this, arguments);
    a.push({ k: 'ai', ico: 'sparkle', t: 'Kais\'e ilk soruyu sor', s: 'Örn. "Bu ay en çok neye harcadım?" Kais verinden cevaplar.', done: !!S.settings.kaisAsked, a: 'kaisai-go', v: 'kaisai' });
    a.push({ k: 'bk', ico: 'file', t: 'İlk yedeğini al', s: 'Ayarlar\'da yedek alabilir, bir yedeği test edebilirsin.', done: !!(BK && BK.list && BK.list.length) || !!S.settings.bkDone, a: 'nav', v: 'ayarlar' });
    return a;
  };
}
{ const _a = H.aisend; if (typeof _a === 'function') H.aisend = function () { if (S.user && S.user.role === 'patron' && !S.settings.kaisAsked) { S.settings.kaisAsked = true; try { pSched(); } catch (e) {} } return _a.apply(this, arguments); }; }
{ const _b = suBanner; suBanner = function () { let h = _b.apply(this, arguments); if (!h) return h; const nx = suSteps().find((x) => !x.done); if (nx) h = h.replace('<small>Kalan adımlar seni bekliyor</small>', '<small>Sıradaki: ' + esc(nx.t) + '</small>'); return h; }; }

/* --- 5) Yedek doğrulama ve güvenli geri yükleme testi --- */
const BKV = { res: null, busy: false, sel: '', auto: null };
const BK_L = { LEDGER: 'Muhasebe satırı', RECEIPTS: 'Fiş ve belge', INV: 'Fatura', STOCK: 'Stok ürünü', SUPPLIERS: 'Tedarikçi', CUSTOMERS: 'Müşteri', SALES: 'Satış', PAYS: 'Ödeme', DEBTS: 'Borç', LEAVES: 'İzin', FCUST: 'Fatura müşterisi', RESV: 'Rezervasyon', ORDERS: 'Sipariş' };
const bkVerKey = () => 'kp_bkver_' + (SBS && SBS.biz ? SBS.biz.id : 'x');
const bkVerGet = () => { try { return JSON.parse(localStorage.getItem(bkVerKey()) || 'null'); } catch (e) { return null; } };
const bkVerSet = (o) => { BKV.auto = o; try { localStorage.setItem(bkVerKey(), JSON.stringify(o)); } catch (e) {} };
/* Yedek içeriğini şimdiki veriyle karşılaştırır, hiçbir şeyi değiştirmez. */
function bkInspect(snap) {
  const out = { ok: true, issues: [], rows: [], size: String(snap || '').length };
  let o; try { o = JSON.parse(snap); } catch (e) { return { ok: false, issues: ['Yedek dosyası okunamadı (bozuk JSON).'], rows: [], size: out.size }; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { ok: false, issues: ['Yedek biçimi tanınmadı.'], rows: [], size: out.size };
  const keys = P_ARR.map((x) => x[0]);
  const present = keys.filter((k) => k in o);
  if (!present.length) { out.ok = false; out.issues.push('Yedekte hiçbir veri bölümü yok.'); }
  keys.forEach((k) => {
    if (!(k in o)) return; const b = o[k]; const now = (P_ARR.find((x) => x[0] === k)[1]() || []);
    if (!Array.isArray(b)) { out.ok = false; out.issues.push((BK_L[k] || k) + ' bölümü bozuk.'); return; }
    if ((b.length || now.length) && BK_L[k]) out.rows.push({ k, label: BK_L[k], backup: b.length, now: now.length });
  });
  const led = Array.isArray(o.LEDGER) ? o.LEDGER : [];
  const ids = new Set(); let dup = 0, bad = 0; led.forEach((r) => { if (ids.has(r.id)) dup++; else ids.add(r.id); if (!isFinite(Number(r.total))) bad++; });
  if (dup) { out.ok = false; out.issues.push(dup + ' muhasebe satırı tekrarlı.'); }
  if (bad) { out.ok = false; out.issues.push(bad + ' satırın tutarı geçersiz.'); }
  out.rows.sort((a, b) => Math.abs(b.backup - b.now) - Math.abs(a.backup - a.now) || b.backup - a.backup);
  const back = out.rows.reduce((t, r) => t + Math.max(0, r.backup - r.now), 0), lose = out.rows.reduce((t, r) => t + Math.max(0, r.now - r.backup), 0);
  out.back = back; out.lose = lose; return out;
}
async function bkFetchSnap(id) { const r = await sbClient().from('backups').select('snap').eq('id', id).eq('business_id', SBS.biz.id).maybeSingle(); if (r.error) throw r.error; if (!r.data) throw new Error('Yedek bulunamadı.'); return r.data.snap; }
H.bkver = async () => {
  if (!bkCan() || BKV.busy) return; const id = BKV.sel || (BK.list[0] && BK.list[0].id); if (!id) return toast('Önce bir yedek al.', 'warn');
  BKV.busy = true; BKV.res = null; render();
  try { const snap = await bkFetchSnap(id); const r = bkInspect(snap); r.id = id; r.at = Date.now(); r.hash = (await sha256hex(snap)).slice(0, 12); BKV.res = r; if (r.ok) { S.settings.bkDone = true; try { pSched(); } catch (e) {} } }
  catch (e) { BKV.res = { ok: false, issues: [bkMsg(e)], rows: [], size: 0, id, at: Date.now() }; }
  BKV.busy = false; render();
};
H.bksel = (el) => { BKV.sel = el.value || (el.dataset && el.dataset.id) || ''; BKV.res = null; };
document.addEventListener('change', (e) => { const t = e.target; if (t.dataset && t.dataset.bksel != null) { BKV.sel = t.value; BKV.res = null; render(); } });
/* Yedek alınınca veritabanından geri okuyup aynı mı diye doğrula */
{
  const _mk = bkMake;
  bkMake = async function (kind) {
    const local = pSnap(); await _mk.apply(this, arguments);
    try { const id = BK.list[0] && BK.list[0].id; if (!id) return; const back = await bkFetchSnap(id); const h1 = await sha256hex(local), h2 = await sha256hex(back); const ins = bkInspect(back); bkVerSet({ at: Date.now(), ok: h1 === h2 && ins.ok, id, same: h1 === h2, n: ins.rows.reduce((t, r) => t + r.backup, 0), kind }); if (!(h1 === h2 && ins.ok)) { BK.err = 'Yedek alındı ama doğrulanamadı. Lütfen "Bilgisayara indir" ile ayrıca yedekle.'; } }
    catch (e) { bkVerSet({ at: Date.now(), ok: false, err: String((e && e.message) || e) }); }
  };
}
{
  const _c = bkCard;
  bkCard = function () {
    const h = _c.apply(this, arguments); if (!h) return h;
    const v = BKV.auto || bkVerGet(); const r = BKV.res; const kn = { gunluk: 'Günlük', manuel: 'Elle alındı', 'geri-yukleme-oncesi': 'Geri yüklemeden önce' };
    const st = v ? (v.ok ? `<span class="pill p-ok">Doğrulandı</span> <span class="small muted">${esc(bkDay(new Date(v.at).toISOString()))}${v.n ? ' · ' + v.n + ' kayıt' : ''}</span>` : `<span class="pill p-bad">Doğrulanamadı</span> <span class="small muted">${esc(v.err || 'Yedek veritabanından aynı okunamadı')}</span>`) : '<span class="small muted">Henüz doğrulama yok. Yeni alınan her yedek otomatik doğrulanır.</span>';
    const opts = BK.list.slice(0, 10).map((b) => `<option value="${b.id}"${(BKV.sel || (BK.list[0] && BK.list[0].id)) === b.id ? ' selected' : ''}>${esc(bkDay(b.created_at))} · ${esc(kn[b.kind] || b.kind)}</option>`).join('');
    const diff = r ? `<div class="stack" style="gap:8px;margin-top:6px"><div class="callout ${r.ok ? '' : 'warn'}">${ic(r.ok ? 'check' : 'alert')}<div><b>${r.ok ? 'Yedek sağlam' : 'Yedekte sorun var'}</b><p style="margin-top:2px">${r.ok ? 'Dosya okundu, bölümler ve tutarlar tutarlı. Hiçbir şey değişmedi.' : esc(r.issues.join(' '))}</p>${r.hash ? `<p class="small muted" style="margin-top:2px">İmza ${esc(r.hash)} · ${Math.round(r.size / 1024)} KB</p>` : ''}</div></div>
      ${r.ok ? `<div class="small">Bu yedeği geri yüklersen: <b>${r.back}</b> kayıt geri gelir, <b>${r.lose}</b> kayıt kaybolur.</div>` : ''}
      ${r.rows.length ? `<div class="card flush"><table style="width:100%;font-size:13px"><tr><th style="text-align:left;padding:8px 12px">Bölüm</th><th style="text-align:right;padding:8px 12px">Yedekte</th><th style="text-align:right;padding:8px 12px">Şimdi</th></tr>${r.rows.slice(0, 8).map((x) => `<tr><td style="padding:6px 12px">${esc(x.label)}</td><td style="text-align:right;padding:6px 12px">${x.backup}</td><td style="text-align:right;padding:6px 12px;${x.backup !== x.now ? 'font-weight:600' : ''}">${x.now}</td></tr>`).join('')}</table></div>` : ''}</div>` : '';
    const box = `<div class="card stack" style="border:1px dashed var(--line,#d9dde3)"><div><b style="font-weight:600">Yedek sağlığı</b><div style="margin-top:4px">${st}</div></div><div class="row wrap" style="gap:8px"><select data-bksel="1" style="flex:1;min-width:160px;font-size:16px">${opts}</select><button class="btn sm" data-a="bkver" ${BKV.busy ? 'disabled' : ''}>${BKV.busy ? 'Test ediliyor…' : 'Güvenli test'}</button></div><p class="muted small" style="margin:0">Testte yedek indirilir, okunur ve şimdiki verinle karşılaştırılır. Verin değişmez.</p>${diff}</div>`;
    const i = h.lastIndexOf('<div class="row wrap"><button class="btn sm" data-a="bkmake"'); return i > 0 ? h.slice(0, i) + box + h.slice(i) : h;
  };
}
{ const _a = bkAuto; bkAuto = async function () { const r = await _a.apply(this, arguments); try { if (BK.list.length && !BKV.auto && !bkVerGet()) { const id = BK.list[0].id; const snap = await bkFetchSnap(id); const ins = bkInspect(snap); bkVerSet({ at: Date.now(), ok: ins.ok, id, n: ins.rows.reduce((t, x) => t + x.backup, 0) }); } } catch (e) {} return r; }; }

