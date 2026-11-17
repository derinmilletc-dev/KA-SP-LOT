/* ===== v45: Profilini tamamla ===== */
const PROF = { tur: '', tip: '', vkn: '', vd: '', il: '', ilce: '', tel: '', cal: '', muh: '', sube: '', yontem: '', zaman: [], mods: [], snooze: 0, done: false };
const PEND = { tur: '' };
P_OBJ.push(['PROF', () => PROF]);
function profReset() { Object.assign(PROF, { tur: '', tip: '', vkn: '', vd: '', il: '', ilce: '', tel: '', cal: '', muh: '', sube: '', yontem: '', zaman: [], mods: [], snooze: 0, done: false }); }
const _wd45 = wipeData; wipeData = function () { _wd45(); profReset(); };
function profPend() { if (PEND.tur && !PROF.tur) { PROF.tur = PEND.tur; pSched(); } PEND.tur = ''; }

const PFI = (b) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
const PFI_ = {
  store: '<path d="M3 9l2-5h14l2 5"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5"/>',
  cup: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  fork: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3Zm0 0v7"/>',
  bread: '<path d="M4 10a4 4 0 0 1 3-6h10a4 4 0 0 1 3 6v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 12v4M15 12v4"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  pill: '<path d="M10.5 20.5 3.5 13.5a4.95 4.95 0 1 1 7-7l7 7a4.95 4.95 0 1 1-7 7Z"/><path d="m8.5 8.5 7 7"/>',
  flower: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/>',
  laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
  bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 17h20M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/>',
  car: '<path d="M19 17h2a1 1 0 0 0 1-1v-3a2 2 0 0 0-1.5-1.9L18 9l-2-4H8L6 9l-2.5 2.1A2 2 0 0 0 2 13v3a1 1 0 0 0 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9Z"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  clinic: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
  factory: '<path d="M2 21V10l6 4v-4l6 4V4h6v17Z"/>',
  case: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  dumbbell: '<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 16v4M17 18h4"/>',
  glass: '<path d="M8 22h8M12 15v7M5 3h14l-7 12Z"/>',
  cone: '<path d="M7 11a5 5 0 0 1 10 0"/><path d="M7 11h10l-5 11Z"/>',
  truck: '<path d="M2 6h11v10H2zM13 9h5l3 3v4h-8"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  bucket: '<path d="M5 8h14l-1.5 13h-11Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  mega: '<path d="M3 11v2l13 5V6Z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  helmet: '<path d="M2 18h20v3H2zM4 18a8 8 0 0 1 16 0M12 6v6"/>',
  apple: '<path d="M12 7c-3-3-8 0-7 6 .6 4 3 8 7 8s6.4-4 7-8c1-6-4-9-7-6Z"/><path d="M12 7c0-2 1-3 3-4"/>',
  leaf: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15Z"/><path d="M5 19 13 11"/>',
  pencil: '<path d="M4 20l1-4L17 4a2.1 2.1 0 0 1 3 3L8 19Z"/>',
  dots: '<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>',
  chev: '<path d="m6 9 6 6 6-6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', check: '<path d="m5 12 5 5 9-10"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', pin: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>'
};
const PF_TYPES = [
  ['Market', 'cart', ['Stok', 'Satış (POS)', 'Tedarik'], 'bakkal süpermarket'],
  ['Kafe', 'cup', ['Stok', 'Satış (POS)', 'Tedarik'], 'kahve cafe'],
  ['Restoran', 'fork', ['Stok', 'Satış (POS)', 'Tedarik', 'Bordro ve maaş'], 'lokanta yemek'],
  ['Fırın & Pastane', 'bread', ['Stok', 'Satış (POS)', 'Tedarik'], 'ekmek börek unlu mamul'],
  ['Kuaför & Berber', 'scissors', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'saç'],
  ['Mağaza', 'bag', ['Stok', 'Satış (POS)'], 'giyim ayakkabı butik'],
  ['Fast food', 'fork', ['Stok', 'Satış (POS)', 'Tedarik'], 'hamburger pizza'],
  ['Dönerci & Kebapçı', 'fork', ['Stok', 'Satış (POS)', 'Tedarik'], 'lahmacun pide ocakbaşı'],
  ['Tatlıcı & Dondurmacı', 'cone', ['Stok', 'Satış (POS)', 'Tedarik'], 'baklava'],
  ['Bar & Pub', 'glass', ['Stok', 'Satış (POS)', 'Bordro ve maaş'], 'kulüp meyhane'],
  ['Catering', 'fork', ['Stok', 'Tedarik', 'Bordro ve maaş'], 'yemek organizasyon'],
  ['Kasap, Manav & Şarküteri', 'apple', ['Stok', 'Satış (POS)', 'Tedarik'], 'et sebze meyve'],
  ['Eczane', 'pill', ['Stok', 'Satış (POS)'], 'ilaç'],
  ['Kırtasiye', 'pencil', ['Stok', 'Satış (POS)'], 'kitap hediyelik'],
  ['Çiçekçi', 'flower', ['Stok', 'Satış (POS)', 'Tedarik'], 'çiçek'],
  ['Elektronik', 'laptop', ['Stok', 'Satış (POS)'], 'telefon bilgisayar'],
  ['Güzellik Salonu', 'sparkle', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'estetik manikür'],
  ['Spa & Masaj', 'leaf', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'hamam'],
  ['Spor Salonu', 'dumbbell', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'fitness pilates yoga'],
  ['Otel & Pansiyon', 'bed', ['Müşteri ve rezervasyon', 'Bordro ve maaş', 'Duyuru ve vardiya'], 'konaklama'],
  ['Oto Servis & Yıkama', 'car', ['Stok', 'Müşteri ve rezervasyon', 'Bordro ve maaş'], 'araba lastik tamir'],
  ['Atölye & Tamir', 'wrench', ['Stok', 'Müşteri ve rezervasyon'], 'usta tamirci'],
  ['Temizlik', 'bucket', ['Müşteri ve rezervasyon', 'Bordro ve maaş', 'Duyuru ve vardiya'], 'hizmet'],
  ['Nakliyat & Lojistik', 'truck', ['Tedarik', 'Bordro ve maaş', 'Duyuru ve vardiya'], 'kargo taşıma'],
  ['Eğitim & Kurs', 'cap', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'okul dershane'],
  ['Klinik & Diş', 'clinic', ['Müşteri ve rezervasyon', 'Stok', 'Bordro ve maaş'], 'sağlık doktor muayenehane'],
  ['Üretim & İmalat', 'factory', ['Stok', 'Tedarik', 'Bordro ve maaş'], 'fabrika'],
  ['Toptan Ticaret', 'truck', ['Stok', 'Tedarik'], 'toptancı bayi'],
  ['E-ticaret', 'globe', ['Stok', 'Tedarik'], 'online internet'],
  ['Ofis & Danışmanlık', 'case', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'avukat mali müşavir'],
  ['Ajans', 'mega', ['Müşteri ve rezervasyon', 'Bordro ve maaş'], 'reklam tasarım yazılım'],
  ['İnşaat & Taahhüt', 'helmet', ['Tedarik', 'Bordro ve maaş', 'Duyuru ve vardiya'], 'müteahhit'],
  ['Diğer', 'dots', [], '']
];
const pfIc = (n) => PFI(PFI_[n] || PFI_.dots);
const foldTr = (t) => String(t).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
function ddHTML(val, ph) {
  const cur = PF_TYPES.find((t) => t[0] === val);
  return `<div class="lx-dd" data-dd><input type="hidden" id="id-tur" value="${esc(val || '')}"><button type="button" class="lx-sel${cur ? ' has' : ''}" data-a="ddtog" aria-haspopup="listbox"><span class="lx-ico">${pfIc(cur ? cur[1] : 'store')}</span><span class="lx-sv">${esc(cur ? cur[0] : ph)}</span><span class="lx-chev">${pfIc('chev')}</span></button>
  <div class="lx-dp"><div class="lx-ds">${pfIc('search')}<input type="text" data-dds placeholder="İşletme türü ara..." autocomplete="off" aria-label="İşletme türü ara"></div><div class="lx-dl" role="listbox">${PF_TYPES.map((t) => `<button type="button" role="option" class="lx-di${val === t[0] ? ' on' : ''}" data-a="ddpick" data-v="${esc(t[0])}" data-ic="${t[1]}" data-k="${esc(foldTr(t[0] + ' ' + t[3]))}">${pfIc(t[1])}<span>${esc(t[0])}</span><i class="lx-ck">${pfIc('check')}</i></button>`).join('')}<div class="lx-de">Sonuç bulunamadı</div></div></div></div>`;
}
function ddApplySug(v) { const mb = document.querySelector('[data-grp="mods"]'); const sug = PF_SUG[v]; if (mb && sug && sug.length && !mb.querySelector('.on')) mb.querySelectorAll('.pf-c').forEach((b) => { if (sug.includes(b.dataset.v)) b.classList.add('on'); }); }
H.ddtog = (el) => { const d = el.closest('[data-dd]'); const o = !d.classList.contains('open'); document.querySelectorAll('[data-dd].open').forEach((x) => x.classList.remove('open')); if (o) { d.classList.add('open'); const si = d.querySelector('[data-dds]'); if (si) { si.value = ''; ddFilter(d, ''); if (!(window.matchMedia && matchMedia('(pointer:coarse)').matches)) si.focus(); } const on = d.querySelector('.lx-di.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' }); } };
H.ddpick = (el) => { const d = el.closest('[data-dd]'); d.querySelectorAll('.lx-di').forEach((b) => b.classList.remove('on')); el.classList.add('on'); d.querySelector('#id-tur').value = el.dataset.v; const sel = d.querySelector('.lx-sel'); sel.classList.add('has'); sel.querySelector('.lx-sv').textContent = el.dataset.v; sel.querySelector('.lx-ico').innerHTML = pfIc(el.dataset.ic); d.classList.remove('open'); ddApplySug(el.dataset.v); };
function ddFilter(d, q) { const f = foldTr(q.trim()); let n = 0; d.querySelectorAll('.lx-di').forEach((b) => { const show = !f || b.dataset.k.indexOf(f) >= 0; b.style.display = show ? '' : 'none'; if (show) n++; }); const e = d.querySelector('.lx-de'); if (e) e.style.display = n ? 'none' : 'block'; }
if (typeof document !== 'undefined') {
  document.addEventListener('input', (e) => { const t = e.target; if (t && t.dataset && t.dataset.dds !== undefined) ddFilter(t.closest('[data-dd]'), t.value); });
  document.addEventListener('click', (e) => { if (!e.target.closest || e.target.closest('[data-dd]')) return; document.querySelectorAll('[data-dd].open').forEach((x) => x.classList.remove('open')); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('[data-dd].open').forEach((x) => x.classList.remove('open')); });
}
function lxCreate() {
  const em = esc(S.lgEm || '');
  const fld = (lab, ico, inner) => `<div class="lx-f"><label>${lab}</label><div class="lx-in">${ico}${inner}</div></div>`;
  return `<div class="login lx"><section class="lx-hero"><div class="lx-brand">${lxMark(40)}<span>KaisPilot</span></div><div class="lx-copy"><h2>İşletmenizi tek yerden yönetin.</h2><p>Fiş, ekip, stok ve tedarik süreçlerinizi tek ekrandan kontrol edin.</p></div>${lxArt()}</section>
  <section class="lx-card"><div class="lx-cin"><form id="idform" class="lx-form lx-cr" novalidate>
  <div class="lx-crh"><span class="lx-crt">${pfIc('store')}</span><div><h1>İşletme oluştur</h1><p class="lx-sub">İşletmenizi birkaç adımda KaisPilot'a taşıyın.</p></div></div>
  <div class="lx-f"><label for="id-biz">İşletme adı</label><div class="lx-in">${pfIc('store')}<input id="id-biz" type="text" autocomplete="organization" placeholder="İşletme adınızı yazın"></div></div>
  <div class="lx-f"><label>İşletme türü</label>${ddHTML('', 'İşletme türünüzü seçin')}</div>
  <div class="lx-f"><label for="id-name">Ad soyad</label><div class="lx-in">${pfIc('user')}<input id="id-name" type="text" autocomplete="name" placeholder="Adınız ve soyadınız"></div></div>
  <div class="lx-f"><label for="id-em">E-posta</label><div class="lx-in">${LXI.mail}<input id="id-em" type="email" autocomplete="username" inputmode="email" autocapitalize="none" placeholder="e-posta@firma.com" value="${em}"></div></div>
  <div class="lx-f"><label for="id-pw">Şifre</label><div class="lx-in">${LXI.lock}<input id="id-pw" type="password" autocomplete="new-password" placeholder="En az 8 karakter"><button type="button" class="lx-eye" data-a="pwtog" aria-label="Şifreyi göster veya gizle">${LXI.eye}</button></div></div>
  <div class="err" id="id-err" role="alert">${esc(S.loginErr)}</div>
  <button class="lx-go" type="button" data-a="idnew"><span>İşletmeyi oluştur</span>${LXI.arrow}</button>
  <p class="lx-crn">${pfIc('info')}<span>Bilgilerinizi daha sonra işletme ayarlarından değiştirebilirsiniz.</span></p>
  <p class="lx-crb">Zaten hesabın var mı? <button type="button" class="lx-link" data-a="lgcreate">Giriş yap</button></p>
  </form></div></section></div>`;
}
const _lg46 = loginHTML; loginHTML = function () { const cloud = sbOK(); if (cloud && S.lgCreate && (S.lgTab || 'own') === 'own' && !(SBS.user && ID.mems.length > 1 && !ID.active)) return lxCreate(); return _lg46(); };
const PF_IL = ['Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkâri','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kilis','Kırıkkale','Kırklareli','Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Şanlıurfa','Siirt','Sinop','Sivas','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'];
const PF_TUR = PF_TYPES.map((t) => t[0]);
const PF_TIP = ['Şahıs işletmesi', 'Limited şirket', 'Anonim şirket', 'Kuruluş aşamasında'];
const PF_CAL = ['Sadece ben', '2–5 kişi', '6–20 kişi', '21–50 kişi', '50+ kişi'];
const PF_MUH = ['Var', 'Arıyorum', 'Kendim tutuyorum'];
const PF_MOD = ['Stok', 'Satış (POS)', 'Tedarik', 'Bordro ve maaş', 'Müşteri ve rezervasyon', 'Duyuru ve vardiya'];
const PF_SUG = {}; PF_TYPES.forEach((t) => { PF_SUG[t[0]] = t[2]; });
const PF_FIELDS = [['tur', 'İşletme türü'], ['tip', 'Şirket tipi'], ['vkn', 'Vergi no'], ['il', 'Şehir'], ['tel', 'Telefon'], ['cal', 'Ekip büyüklüğü'], ['muh', 'Muhasebeci'], ['mods', 'Kullanacağın bölümler']];
function pfHas(k) { return k === 'mods' ? PROF.mods.length > 0 : !!PROF[k]; }
function pfMissing() { return PF_FIELDS.filter(([k]) => !pfHas(k)); }
function vknOk(v) {
  if (!/^\d+$/.test(v)) return false; const d = v.split('').map(Number);
  if (v.length === 10) { let sum = 0; for (let i = 0; i < 9; i++) { const t = (d[i] + 9 - i) % 10; let x = t === 0 ? 0 : (t * Math.pow(2, 9 - i)) % 9; if (t !== 0 && x === 0) x = 9; sum += x; } return (10 - (sum % 10)) % 10 === d[9]; }
  if (v.length === 11) { if (d[0] === 0) return false; const odd = d[0] + d[2] + d[4] + d[6] + d[8]; const even = d[1] + d[3] + d[5] + d[7]; if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false; return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10]; }
  return false;
}
function telFmt(v) { let d = String(v).replace(/\D/g, ''); if (d.startsWith('90') && d.length > 10) d = d.slice(2); if (d.startsWith('0')) d = d.slice(1); d = d.slice(0, 10); const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean); return d ? '0 ' + p.join(' ') : ''; }
function pfChips(g, list, sel, multi) { return `<div class="pf-cs" data-grp="${g}" data-multi="${multi ? 1 : 0}">${list.map((x) => `<button type="button" class="pf-c${(multi ? sel.includes(x) : sel === x) ? ' on' : ''}" data-a="pfchip" data-g="${g}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`; }
function profCard() {
  const r = S.user && S.user.role; if (r !== 'patron' || S.demoMode || PROF.done || Date.now() < (PROF.snooze || 0)) return '';
  profPend(); const miss = pfMissing(); if (!miss.length) return '';
  const n = PF_FIELDS.length - miss.length; const pct = Math.round(n / PF_FIELDS.length * 100); const C = 2 * Math.PI * 22; const off = C * (1 - pct / 100);
  return `<div class="pf-card"><div class="pf-top"><svg class="pf-ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="5"/><circle cx="26" cy="26" r="22" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 26 26)"/><text x="26" y="30.5" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">%${pct}</text></svg><div><h3>Profilini tamamla</h3><p>İşletmen için ${miss.length} kısa bilgi kaldı. Kais ekranları sana göre hazırlar.</p></div></div>
  <div class="pf-miss">${miss.slice(0, 5).map(([k, l]) => `<button type="button" data-a="pfopen" data-f="${k}">${esc(l)}</button>`).join('')}${miss.length > 5 ? `<span>+${miss.length - 5}</span>` : ''}</div>
  <div class="pf-act"><button type="button" class="pf-go" data-a="pfopen">Devam et</button><button type="button" class="pf-later" data-a="pfsnooze">Sonra</button></div></div>`;
}
const _vh45 = viewHTML; viewHTML = function () { let h = _vh45(); const r = S.user && S.user.role; if (r === 'patron' && S.view === 'bugun') { const c = profCard(); if (c) h = h.replace('<div class="stack-lg">', '<div class="stack-lg">' + c); } return h; };
H.pfopen = (el) => { profPend(); S.modal = { type: 'prof', f: (el && el.dataset && el.dataset.f) || '' }; renderModal(); setTimeout(() => { const f = el && el.dataset && el.dataset.f; const t = f && document.querySelector('[data-pfk="' + f + '"]'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'center' }); }, 60); };
H.pfsnooze = () => { PROF.snooze = Date.now() + 3 * 864e5; pSched(); render(); };
H.pfchip = (el) => {
  const box = el.closest('[data-grp]'); if (!box) return; const multi = box.dataset.multi === '1'; const was = el.classList.contains('on');
  if (!multi) box.querySelectorAll('.pf-c').forEach((b) => b.classList.remove('on'));
  el.classList.toggle('on', multi ? !was : !was ? true : false);
};
function pfOn(g) { return Array.from(document.querySelectorAll('[data-grp="' + g + '"] .on')).map((b) => b.dataset.v); }
NEWM.prof = () => {
  const L = (k, t, body, hint) => `<div class="pf-s" data-pfk="${k}"><label class="pf-l">${t}${hint ? ` <span class="pf-h">${hint}</span>` : ''}</label>${body}</div>`;
  const miss = pfMissing().length; const pct = Math.round((PF_FIELDS.length - miss) / PF_FIELDS.length * 100);
  return sheet('Profilini tamamla', `<div class="pf-bar"><i style="width:${pct}%"></i></div><p class="small muted" style="margin:6px 0 4px">Boş bırakabilirsin, istediğin zaman devam edersin.</p>
  ${L('tur', 'İşletme türü', ddHTML(PROF.tur, 'İşletme türünüzü seçin'))}
  ${L('tip', 'Şirket tipi', pfChips('tip', PF_TIP, PROF.tip, false))}
  <div class="pf-row">
   ${L('vkn', 'Vergi no', `<input id="pf-vkn" inputmode="numeric" maxlength="11" autocomplete="off" placeholder="10 hane (şahıs ise T.C. no)" value="${esc(PROF.vkn)}"><div class="pf-st" id="pf-vkn-s"></div>`)}
   ${L('vd', 'Vergi dairesi', `<input id="pf-vd" autocomplete="off" list="pf-vdl" placeholder="Örn. ${esc(PROF.il || 'Kadıköy')} Vergi Dairesi" value="${esc(PROF.vd)}"><datalist id="pf-vdl">${PROF.il ? `<option value="${esc(PROF.il)} Vergi Dairesi">` : ''}</datalist>`)}
  </div>
  <div class="pf-row pf-2">
   ${L('il', 'Şehir', `<input id="pf-il" autocomplete="off" placeholder="Şehir yaz ya da seç" value="${esc(PROF.il)}">`)}
   ${L('ilce', 'İlçe', `<input id="pf-ilce" autocomplete="off" placeholder="Örn. Kadıköy" value="${esc(PROF.ilce)}">`)}
  </div>
  ${L('tel', 'İşletme telefonu', `<input id="pf-tel" inputmode="tel" autocomplete="tel" placeholder="0 5xx xxx xx xx" value="${esc(PROF.tel)}">`)}
  ${L('cal', 'Kaç kişi çalışıyor?', pfChips('cal', PF_CAL, PROF.cal, false))}
  ${L('muh', 'Muhasebecin var mı?', pfChips('muh', PF_MUH, PROF.muh, false), 'Varsa sonra davet kodu ile ekleyebilirsin')}
  ${L('mods', 'Hangi bölümleri kullanacaksın?', pfChips('mods', PF_MOD, PROF.mods, true), 'Birden fazla seç')}
  <div class="row" style="gap:8px;margin-top:14px"><button type="button" class="btn block" data-a="pfsave">Kaydet</button></div>`);
};
H.pfsave = () => {
  const g = (id) => ((document.getElementById(id) || {}).value || '').trim();
  const vkn = g('pf-vkn').replace(/\D/g, '');
  if (vkn && !vknOk(vkn)) { const e = document.getElementById('pf-vkn-s'); if (e) { e.textContent = 'Numara geçersiz görünüyor. Kontrol et ya da boş bırak.'; e.className = 'pf-st bad'; } toast('Vergi numarasını kontrol et.', 'bad'); return; }
  const one = (k) => pfOn(k)[0] || '';
  Object.assign(PROF, { tur: g('id-tur'), tip: one('tip'), vkn, vd: g('pf-vd'), il: g('pf-il'), ilce: g('pf-ilce'), tel: g('pf-tel'), cal: one('cal'), muh: one('muh'), mods: pfOn('mods') });
  if (vkn) EDOC.vkn = vkn; if (PROF.vd) EDOC.vd = PROF.vd;
  PROF.done = pfMissing().length === 0; pSched(); S.modal = null; renderModal(); render();
  toast(PROF.done ? 'Profil tamam. Teşekkürler.' : 'Kaydedildi.', 'ok');
};
if (typeof document !== 'undefined') document.addEventListener('input', (e) => {
  const t = e.target; if (!t || !t.id) return;
  if (t.id === 'pf-vkn') { const v = t.value.replace(/\D/g, '').slice(0, 11); if (v !== t.value) t.value = v; const s = document.getElementById('pf-vkn-s'); if (!s) return; if (!v) { s.textContent = ''; s.className = 'pf-st'; } else if (v.length < 10) { s.textContent = v.length + '/10 hane'; s.className = 'pf-st'; } else if (vknOk(v)) { s.textContent = v.length === 10 ? 'Geçerli vergi numarası' : 'Geçerli T.C. kimlik numarası'; s.className = 'pf-st ok'; } else { s.textContent = 'Numara geçersiz görünüyor'; s.className = 'pf-st bad'; } }
  if (t.id === 'pf-tel') { const f = telFmt(t.value); if (f !== t.value) t.value = f; }
  if (t.id === 'pf-il') { const dl = document.getElementById('pf-vdl'); if (dl) dl.innerHTML = t.value ? `<option value="${esc(t.value)} Vergi Dairesi">` : ''; }
});


/* ===== v47: kod kopyala + zoom kapat ===== */
H.codecopy = async (el) => { const t = ((document.getElementById('shop-code') || {}).textContent || '').replace(/\s/g, ''); if (!t) return; let ok = false; try { await navigator.clipboard.writeText(t); ok = true; } catch (e) { try { const i = document.createElement('textarea'); i.value = t; i.style.position = 'fixed'; i.style.opacity = '0'; document.body.appendChild(i); i.select(); ok = document.execCommand('copy'); i.remove(); } catch (x) {} } toast(ok ? 'Kod kopyalandı: ' + t : 'Kopyalanamadı. Kodu elle yaz.', ok ? 'ok' : 'warn'); };
if (typeof document !== 'undefined') { ['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault())); document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false }); let lt = 0; document.addEventListener('touchend', (e) => { const n = Date.now(); if (n - lt < 300 && !(e.target.closest && e.target.closest('input,textarea,select'))) e.preventDefault(); lt = n; }, { passive: false }); }

/* ===== v48: Bugün (patron) yeniden düzen, giriş kodu Ekip'e ===== */
ICONS.cal = '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'; ICONS.arrow = '<path d="M4 12h15M13 6l6 6-6 6"/>'; ICONS.refresh = '<path d="M20 11a8 8 0 00-14.5-3.5L4 9M4 4v5h5M4 13a8 8 0 0014.5 3.5L20 15M20 20v-5h-5"/>';
ICONS.copy = '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>';
const CODE_RX = /<div class="card stack"><div><h3>Giriş kodu<\/h3>[\s\S]*?id="code-left">\d+<\/span> sn<\/p><\/div>/;
const bugunMudurV47 = bugunMudur; bugunMudur = function () { return bugunMudurV47().replace(CODE_RX, ''); };

const viewEkipV47 = viewEkip; viewEkip = function () { const h = viewEkipV47(); if (!S.user || !['patron', 'mudur'].includes(S.user.role) || S.sub.ekip !== 'bugun') return h; const t = '<div class="stack-lg">'; const i = h.indexOf(t); return i < 0 ? codeCardEkip() + h : h.slice(0, i + t.length) + codeCardEkip() + h.slice(i + t.length); };
const bugunPatronV47 = bugunPatron;
bugunPatron = function () {
  const h = bugunPatronV47();
  const todos = h.match(/<button class="todo"[\s\S]*?<\/button>/g) || [];
  const t = totals();
  const cur = RECEIPTS.filter((f) => f.cat === 'Hammadde').reduce((a, f) => a + f.total, 0);
  const pct = AVG_HAM ? Math.round((cur / AVG_HAM - 1) * 100) : 0;
  const empty = !t.out && !t.in && !cur;
  const up = pct >= 0;
  const lim = S.todoAll ? todos.length : 4; const hidden = todos.length - lim;
  const kiArt = '<svg class="ki-art" viewBox="0 0 150 80" aria-hidden="true"><defs><linearGradient id="kg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FB2F0" stop-opacity=".9"/><stop offset="1" stop-color="#2D6BC4" stop-opacity=".5"/></linearGradient></defs><path d="M2 62 C40 56 70 40 148 8" fill="none" stroke="#6FD3D6" stroke-width="2" stroke-linecap="round" opacity=".8"/><rect x="26" y="52" width="18" height="26" rx="4" fill="url(#kg)"/><rect x="56" y="42" width="18" height="36" rx="4" fill="url(#kg)"/><rect x="86" y="30" width="18" height="48" rx="4" fill="url(#kg)"/><rect x="116" y="14" width="18" height="64" rx="4" fill="url(#kg)"/></svg>';
  const ins = empty
    ? `<div class="ki-t">Henüz veri yok</div><p class="ki-p">Fiş ya da ekstre ekledikçe Kais gider artışlarını burada gösterir.</p>`
    : `<div class="ki-t">Hammadde gideri <span class="ki-d">${up ? '↑' : '↓'} %${Math.abs(pct)}</span></div><p class="ki-p">Son 3 ay ortalamasına göre hammadde giderin ${Math.abs(pct) >= 30 ? 'belirgin şekilde ' : ''}${up ? 'yükseldi' : 'düştü'}.</p><button type="button" class="ki-l" data-a="insight">${S.insightOpen ? 'Hesabı gizle' : 'Hesabı göster'} ${ic('arrow', 16)}</button>${S.insightOpen ? `<div class="ki-o">Son 3 ay ortalaması ${fmt0(AVG_HAM)}. ${esc(PERIOD)}: ${fmt0(cur)}. Fark ${fmt0(cur - AVG_HAM)}. Yetersiz geçmiş varsa uyarı üretmem.</div>` : ''}`;
  const net = t.in - t.out;
  return `<div class="stack-lg dash">
  <div class="ki"><div class="ki-h"><span class="ki-i">${ic('sparkle', 18)}</span><b>Kais fark etti</b></div>${ins}${kiArt}</div>
  <section class="dsec"><div class="dsec-h"><h2>Bugün ne yapmalısın?</h2><p class="muted">${esc(today())} · ${todos.length ? todos.length + ' konu seni bekliyor' : 'her şey yolunda'}</p></div>
   <div class="dtodo">${todos.slice(0, lim).join('') || `<div class="card"><p class="muted">Bugün seni bekleyen bir konu yok.</p></div>`}</div>
   ${hidden > 0 ? `<button type="button" class="dmore" data-a="todoall">${hidden} konu daha göster ${ic('chevron', 14)}</button>` : (S.todoAll && todos.length > 4 ? `<button type="button" class="dmore" data-a="todoall">Daha az göster</button>` : '')}</section>
  <section class="dfin"><div class="dfin-h"><span class="dfin-i">${ic('cal', 20)}</span><h3>${esc(PERIOD)}</h3></div><div class="dfin-r"><div class="dfin-m"><div><span>Gelen</span><b class="num">${fmt0(t.in)}</b></div><div><span>Giden</span><b class="num">${fmt0(t.out)}</b></div><div><span>Net</span><b class="num ${net > 0 ? 'pos' : net < 0 ? 'neg' : ''}">${fmt0(net)}</b></div></div><button type="button" class="dfin-b" data-a="nav" data-v="muhasebe">Finans detaylarını gör ${ic('arrow', 15)}</button></div></section>
  </div>`;
};
const GZ = { ok: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#22B573"/><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>', warn: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#F0A21B"/><path d="M12 7v6M12 16.5h.01" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>', info: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#BFD6F4"/><path d="M12 11v6M12 7.5h.01" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>' };
function gunBullets() {
  const out = []; const low = lowStock();
  out.push(low.length ? ['warn', `${low.length} ürün kritik seviyede: ${low.slice(0, 2).map((x) => x.name.split(' (')[0]).join(', ')}.`] : ['ok', 'Kritik stok sorunu görünmüyor.']);
  const pend = pendingReceipts().length + LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length + debtSoon().length;
  out.push(pend ? ['warn', `${pend} bekleyen onay ya da yaklaşan ödeme var.`] : ['ok', 'Bekleyen rezervasyon veya geciken sipariş yok.']);
  out.push(SALES.length < 3 ? ['info', 'Henüz yeterli satış verisi oluşmadı.'] : ['ok', `Satış verisi güncel (${SALES.length} kayıt).`]);
  return out;
}
const _brCard48 = brCard;
brCard = function () {
  if (!S.user || !['patron', 'mudur'].includes(S.user.role)) return '';
  const ai = aiReady(); if (ai) { try { _brCard48(); } catch (e) {} }
  const b = gunBullets(); const first = b.find((x) => x[0] === 'warn');
  const art = '<svg class="gz-art" viewBox="0 0 110 100" aria-hidden="true"><defs><linearGradient id="gzc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FA8F2"/><stop offset="1" stop-color="#2F68C8"/></linearGradient></defs><g transform="rotate(8 55 50)"><rect x="18" y="10" width="62" height="80" rx="9" fill="url(#gzc)"/><rect x="26" y="20" width="46" height="62" rx="5" fill="#fff" opacity=".95"/><rect x="38" y="4" width="22" height="12" rx="5" fill="#9CC4F7"/><rect x="33" y="28" width="12" height="12" rx="3" fill="#22B573"/><path d="m35.5 34 2.2 2.2 4-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="50" y="30" width="16" height="3" rx="1.5" fill="#9DB8DE"/><rect x="50" y="36" width="11" height="3" rx="1.5" fill="#C4D5EC"/><rect x="33" y="48" width="12" height="12" rx="3" fill="#22B573"/><path d="m35.5 54 2.2 2.2 4-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="50" y="50" width="16" height="3" rx="1.5" fill="#9DB8DE"/><rect x="50" y="56" width="11" height="3" rx="1.5" fill="#C4D5EC"/></g><g><rect x="58" y="58" width="44" height="34" rx="7" fill="#fff" stroke="#BCD3F2"/><rect x="66" y="74" width="7" height="12" rx="2" fill="#4B87DE"/><rect x="77" y="68" width="7" height="18" rx="2" fill="#2F68C8"/><rect x="88" y="64" width="7" height="22" rx="2" fill="#1F55B0"/></g></svg>';
  const det = S.gunOpen ? `<div class="gz-o">${BR.text ? `<div style="white-space:pre-wrap">${esc(BR.text).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')}</div>` : (ai && BR.busy ? '<p>Kais AI bugünün özetini hazırlıyor…</p>' : b.map((x) => `<p>${esc(x[1])}</p>`).join(''))}</div>` : '';
  return `<div class="gz"><div class="gz-h"><span class="gz-i">${ic('sparkle', 22)}</span><div><h3>Günün özeti</h3><p>Kais AI bugün için dikkat edilmesi gerekenleri sıraladı.</p></div></div>${art}<ul class="gz-l">${b.map((x) => `<li>${GZ[x[0]]}<span>${esc(x[1])}</span></li>`).join('')}</ul>${det}<div class="gz-b"><button type="button" class="gz-p" data-a="gundet">Detayları gör ${ic('arrow', 16)}</button><span class="gz-s"><button type="button" data-a="gunyen" aria-label="Yenile">${ic('refresh', 16)}<span>Yenile</span></button>${ai && AI_ROLES.includes(S.user.role) ? `<button type="button" data-a="brask">${ic('chat', 16)}<span>Kais AI'ya sor</span></button>` : ''}</span></div></div>`;
};
H.gundet = () => { S.gunOpen = !S.gunOpen; render(); };
H.gunyen = () => { if (aiReady()) H.brrefresh(); else { render(); toast('Özet güncellendi.', 'ok'); } };
H.todoall = () => { S.todoAll = !S.todoAll; render(); };

/* ===== v50: Muhasebe sayfası mockup ===== */
ICONS.bars = '<path d="M5 20v-7M12 20V5M19 20v-11"/>'; ICONS.layers = '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>'; ICONS.pie = '<path d="M12 3a9 9 0 1 0 9 9h-9Z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15Z"/>'; ICONS.fdoc = '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>';
const MU_TAB_IC = { belgeler: 'receipt', tablo: 'bars', ekstre: 'layers', ozet: 'pie' };
const muSeg = (group, items, cur) => `<div class="mseg" role="group">${items.map((i) => `<button data-a="sub" data-g="${group}" data-v="${i[0]}" aria-pressed="${cur === i[0]}">${ic(MU_TAB_IC[i[0]] || 'receipt', 22)}<span>${esc(i[1])}</span></button>`).join('')}</div>`;
const _vm50 = viewMuhasebe; viewMuhasebe = function () {
  const h = _vm50(); if (!S.user || S.user.role !== 'patron') return h;
  const m = h.match(/<div class="seg" role="group">[\s\S]*?<\/div>/); if (!m) return h;
  const items = [...m[0].matchAll(/data-v="(\w+)" aria-pressed="(true|false)">([^<]*)</g)].map((x) => [x[1], x[3], x[2] === 'true']);
  const cur = (items.find((x) => x[2]) || [])[0]; return h.replace(m[0], muSeg('muhasebe', items.map((x) => [x[0], x[1]]), cur));
};
function belgelerPatron() {
  const wait = RECEIPTS.filter((f) => f.status === 'bekliyor').reverse();
  const rest = RECEIPTS.filter((f) => f.status !== 'bekliyor').reverse();
  const nNew = MAILDOCS.filter((d) => mailStatus(d) === 'yeni').length;
  const mailSub = !S.mail.on ? 'Bağlı değil. Bağlayınca faturalar kendiliğinden gelir.' : nNew ? nNew + ' yeni fatura bulundu' : 'Tüm faturalar işlendi';
  const art = '<svg class="mh-art" viewBox="0 0 120 100" aria-hidden="true"><defs><linearGradient id="mhg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF3FF"/><stop offset="1" stop-color="#9CC2F4"/></linearGradient></defs><path d="M58 4h40l-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4H58z" transform="rotate(8 78 50)" fill="url(#mhg)"/><g transform="rotate(8 78 50)"><rect x="68" y="14" width="22" height="3" rx="1.5" fill="#5E95E0"/><rect x="68" y="22" width="26" height="3" rx="1.5" fill="#7DA9E6"/><rect x="68" y="30" width="18" height="3" rx="1.5" fill="#9DBDEB"/><rect x="68" y="38" width="24" height="3" rx="1.5" fill="#9DBDEB"/></g><rect x="10" y="40" width="46" height="40" rx="11" fill="#1D5CB4" stroke="#fff" stroke-width="2.5"/><circle cx="33" cy="60" r="9" fill="none" stroke="#fff" stroke-width="3"/><rect x="26" y="45" width="9" height="4" rx="2" fill="#fff"/><circle cx="100" cy="64" r="13" fill="#17B58A"/><path d="m93 64 5 5 9-10" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return `<div class="stack-lg mu">
  <div class="mh"><h3>Alışverişten çıktın mı?</h3><p>Fişin fotoğrafını çek. Muhasebecine anında bildirim gider, kalemleri ve KDV'yi kontrol edip onaylar, gider tabloya kendiliğinden yazılır.</p>${art}
    <div class="mh-f"><span><i>1</i>Fişi çek</span>${ic('chevron', 14)}<span><i>2</i>Muhasebeci inceler</span>${ic('chevron', 14)}<span><i>3</i>Tabloya yazılır</span></div>
    <button type="button" class="mh-b" data-a="upload">${ic('camera', 22)}<b>Fiş ekle</b></button></div>
  ${wait.length ? `<div class="card flush"><div style="padding:16px 16px 0"><h3>Senin onayını bekleyen masraflar</h3><p class="muted small">Çalışanların yüklediği fişler. Onaylarsan muhasebeciye gider.</p></div>${wait.map((f) => receiptRow(f, 'patron')).join('')}</div>` : ''}
  <button type="button" class="mlink" data-a="belall" aria-expanded="${!!S.belAll}"><span class="ml-i">${ic('fdoc', 26)}</span><span class="ml-t"><b>Tüm belgeler</b><span>Her fişin nerede olduğunu burada görürsün.</span></span><span class="ml-c${S.belAll ? ' open' : ''}">${ic('chevron', 18)}</span></button>
  ${S.belAll ? `<div class="card flush">${rest.length ? rest.map((f) => receiptRow(f, 'patron')).join('') : '<p class="muted" style="padding:16px">Henüz belge yok. İlk fişini ekle.</p>'}</div>` : ''}
  <details class="chk card mlink mlink-d" id="ck-mail" ${S.openChk.includes('mail') ? 'open' : ''}><summary class="check"><span class="ml-i">${ic('mail', 26)}</span><span class="ml-t"><b>E-posta ile gelen faturalar</b><span>${esc(mailSub)}</span></span><span class="ml-c">${ic('chevron', 18)}</span></summary><div class="cbody">${epostaHTML()}</div></details>
  </div>`;
}
H.belall = () => { S.belAll = !S.belAll; render(); };

/* ===== v51: Ekip sayfası mockup ===== */
ICONS.userplus = '<circle cx="10" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-6 7-6M18 11v6M15 14h6"/>'; ICONS.link = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>';
function codeCardEkip() {
  return `<div class="kcr"><span class="kcr-i">${ic('lock', 22)}</span><div class="kcr-t"><b>Giriş kodu</b><span>Çalışanların işe girişinde kullanacağı kod</span></div><div class="kcr-c"><div class="kcr-n"><span class="num" id="shop-code">${shopCode()}</span><button type="button" data-a="codecopy" aria-label="Kodu kopyala">${ic('copy', 18)}</button></div><small>Yenilenmesine <span id="code-left">${60 - new Date().getSeconds()}</span> sn</small></div></div>`;
}
function ekipBullets() {
  const out = []; const nr = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length; const pa = pendingAtt().length;
  out.push(nr + pa ? ['warn', `${nr ? nr + ' izin talebi' : ''}${nr && pa ? ' ve ' : ''}${pa ? pa + ' mola dönüşü' : ''} onay bekliyor.`] : ['ok', 'Bekleyen izin talebi yok.']);
  const inn = EMP_IDS.filter((id) => ATT[id] && ['working', 'break', 'pending'].includes(ATT[id].state)).length;
  out.push(inn ? ['ok', `Bugün ${inn} çalışan giriş yaptı.`] : ['info', 'Bugün giriş yapan çalışan yok.']);
  const nc = EMP_IDS.filter((id) => PROFILES[id] && !PROFILES[id].contract).length;
  out.push(nc ? ['warn', `${nc} çalışanın iş sözleşmesi eksik.`] : ['ok', 'Maaş ve haklarda bekleyen işlem yok.']);
  return out;
}
function ekipGun() {
  const b = ekipBullets();
  const art = '<svg class="gz-art eg-art" viewBox="0 0 110 80" aria-hidden="true"><defs><linearGradient id="egg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78B0F4"/><stop offset="1" stop-color="#2F6CC9"/></linearGradient></defs><ellipse cx="56" cy="68" rx="46" ry="9" fill="#CFE0F7"/><circle cx="26" cy="30" r="9" fill="url(#egg)" opacity=".85"/><path d="M10 58c0-11 7-17 16-17s16 6 16 17z" fill="url(#egg)" opacity=".85"/><circle cx="86" cy="30" r="9" fill="url(#egg)" opacity=".85"/><path d="M70 58c0-11 7-17 16-17s16 6 16 17z" fill="url(#egg)" opacity=".85"/><circle cx="56" cy="22" r="11" fill="url(#egg)"/><path d="M36 58c0-14 9-22 20-22s20 8 20 22z" fill="url(#egg)"/></svg>';
  const det = S.egOpen ? `<div class="gz-o">${b.map((x) => `<p>${esc(x[1])}</p>`).join('')}<p class="muted small">Detay için ilgili sekmelere bak: İzin talepleri, Maaş ve haklar.</p></div>` : '';
  const aiBtn = aiReady() && AI_ROLES.includes(S.user.role) ? `<button type="button" data-a="brask">${ic('chat', 16)}<span>Kais AI'ya sor</span></button>` : '';
  return `<div class="gz"><div class="gz-h"><span class="gz-i">${ic('sparkle', 22)}</span><div><h3>Günün özeti</h3><p>Kais AI ekibin için önemli durumları özetledi.</p></div></div>${art}<ul class="gz-l">${b.map((x) => `<li>${GZ[x[0]]}<span>${esc(x[1])}</span></li>`).join('')}</ul>${det}<div class="gz-b"><button type="button" class="gz-p" data-a="egdet">Detayları gör ${ic('arrow', 16)}</button>${aiBtn}</div></div>`;
}
H.egdet = () => { S.egOpen = !S.egOpen; render(); };
function ekipKais() {
  let top = null; EMP_IDS.forEach((id) => { const d = EMPDATA[id]; if (d && d.late >= 2 && (!top || d.late > EMPDATA[top].late)) top = id; });
  const art = '<svg class="ki-art" viewBox="0 0 60 60" aria-hidden="true"><rect x="6" y="30" width="12" height="24" rx="3" fill="#5E9AEA"/><rect x="24" y="18" width="12" height="36" rx="3" fill="#3F7FDC"/><rect x="42" y="6" width="12" height="48" rx="3" fill="#2B67C4"/></svg>';
  const body = top
    ? `<div class="ki-t">${esc(byId(top).name.split(' ')[0])} bu ay ${EMPDATA[top].late} kez geç kaldı</div><p class="ki-p">Geç kalma tekrar ediyor. Kısa bir konuşma ya da vardiya değişikliği düşünebilirsin.</p>`
    : `<div class="ki-t">Henüz karşılaştıracak veri yok</div><p class="ki-p">Çalışan verileri oluşmaya başladıkça mesai, maliyet ve verimlilikle ilgili önemli içgörüleri burada gösterir.</p>`;
  return `<div class="ki ki-lt"><div class="ki-h"><span class="ki-i">${ic('sparkle', 18)}</span><b>Kais fark etti</b></div>${body}${art}</div>`;
}
function ekipTasks() {
  const it = []; const isP = S.user.role === 'patron';
  const lr = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)); if (lr.length) it.push(todo('clock', 'warn', `${lr.length} izin talebi karar bekliyor`, `${byId(lr[0].uid).name}: ${lr[0].txt}`, 'ekip', 'talep'));
  const pa = pendingAtt(); if (pa.length) it.push(todo('clock', 'warn', `${pa.length} mola dönüşü onay bekliyor`, `${byId(pa[0]).name}: ${ATT[pa[0]].note || 'döndüm demedi'}`, 'ekip', 'bugun'));
  const nc = EMP_IDS.filter((id) => PROFILES[id] && !PROFILES[id].contract); if (isP && nc.length) it.push(todo('file', 'info', `${byId(nc[0]).name} için iş sözleşmesi yok`, 'Fotoğrafını yükle, Kais AI kaydetsin', 'ekip', 'maas'));
  if (isP && ID.active) {
    it.push(`<button type="button" class="todo" data-a="seatadd"><span class="dot tone-info">${ic('userplus', 22)}</span><span class="grow"><b>Yeni çalışan yeri ekle</b><span class="sub">Ekibine yeni bir çalışan ekleyebilirsin.</span></span>${ic('chevron', 18)}</button>`);
    const un = ID.team ? USERS.filter((u) => u.id !== 'u1' && !ID.team.members.find((x) => x.app_uid === u.id)).length : 0;
    if (un) it.push(todo('link', 'info', 'Hesap bağlantılarını tamamla', 'Müdür, muhasebeci ve çalışanlarını davet et.', 'ekip', 'hesap'));
  }
  return it;
}
function hesapHTML() {
  if (!ID.active || ID.active.role !== 'patron') return `<div class="card"><p class="muted">Hesap bağlantıları bulut hesabıyla çalışır. İşletme hesabınla giriş yapınca burada ekibini davet edebilirsin.</p></div>`;
  if (!ID.team) { if (!ID.teamBusy) teamLoad().then(() => render()); return `<div class="card"><p class="small muted">Hesap bağlantıları yükleniyor…</p></div>`; }
  const rows = USERS.filter((u) => u.id !== 'u1').map((u) => {
    const m = ID.team.members.find((x) => x.app_uid === u.id); const inv = ID.team.invites.find((x) => x.app_uid === u.id);
    const right = m ? `<span class="pill p-ok">Bağlı</span><button class="hb sec" data-a="memrm" data-id="${m.id}">${S.rmArm === m.id ? 'Emin misin?' : 'Çıkar'}</button>`
      : inv ? `<span class="pill p-warn">${esc(inv.code)} · ${invLeft(inv)}</span><button class="hb sec" data-a="invshow" data-id="${u.id}">Göster</button><button class="hb sec" data-a="invrm" data-id="${inv.id}">İptal</button>`
      : `<button class="hb" data-a="invnew" data-id="${u.id}">Davet et</button>`;
    return `<div class="hr"><span class="hr-a" style="background:${u.color || '#3B6FB6'}">${esc(ini((m && m.display_name) || u.name))}</span><span class="hr-n"><b>${esc((m && m.display_name) || u.name)}</b><span>${esc(ROLE_LABEL[u.role])}${u.title && u.role === 'calisan' ? ' · ' + esc(u.title) : ''}${m && m.email ? ' · ' + esc(m.email) : ''}</span></span><span class="hr-r">${right}</span></div>`;
  }).join('');
  return `<div class="ka"><span class="gz-i">${ic('sparkle', 22)}</span><div><b>Kais AI</b><p>Ekibine davet göndererek yetkileri kolayca yönetebilirsin. 1 gün geçerli tek kullanımlık kod ile hızlıca bağlayabilirsin.</p></div></div>
  <div class="card hc"><div class="hc-h"><span class="hc-i">${ic('users', 24)}</span><div class="grow"><h3>Hesap bağlantıları</h3></div><button type="button" class="hb sec" data-a="teamref">${ic('refresh', 15)}<span>Yenile</span></button></div><p class="muted small hc-p">Kişiyi davet et, kodu ona gönder. Kod 24 saat (1 gün) geçerli ve tek kullanımlık.</p>${ID.team.err ? `<div class="callout warn">${ic('alert')}<div>${esc(ID.team.err)}</div></div>` : ''}<div class="hl">${rows}</div><button type="button" class="hadd" data-a="seatadd">${ic('plus', 18)}<span>Yeni çalışan yeri ekle</span></button></div>`;
}
const viewEkipV51 = viewEkip;
viewEkip = function () {
  if (!S.user || !['patron', 'mudur'].includes(S.user.role)) return viewEkipV51();
  const isP = S.user.role === 'patron'; const cur0 = S.sub.ekip;
  const h = viewEkipV17(); const m = h.match(/<div class="seg" role="group">[\s\S]*?<\/div>/); if (!m) return h;
  let items = [...m[0].matchAll(/data-v="(\w+)" aria-pressed="(?:true|false)">([^<]*)</g)].map((x) => [x[1], x[2]]);
  if (isP && ID.active && !items.some((x) => x[0] === 'hesap')) { const i = items.findIndex((x) => x[0] === 'siralama'); items.splice(i < 0 ? items.length : i, 0, ['hesap', 'Hesap bağlantıları']); }
  const cur = items.some((x) => x[0] === cur0) ? cur0 : 'bugun';
  const segH = seg('ekip', items, cur).replace('<div class="seg"', '<div class="seg seg-b"');
  const rest = h.replace(m[0], '').replace(/^<div class="stack-lg">/, '').replace(/<\/div>\s*$/, '');
  if (cur === 'hesap') return `<div class="stack-lg">${segH}${hesapHTML()}</div>`;
  if (cur !== 'bugun') return `<div class="stack-lg">${segH}${rest}</div>`;
  const tk = ekipTasks();
  return `<div class="stack-lg">${segH}<div class="stack-lg dash">${ekipGun()}${ekipKais()}<section class="dsec"><div class="dsec-h"><h2>Bugün ne yapmalısın?</h2><p class="muted">${tk.length ? 'Ekibinle ilgili ' + tk.length + ' konu seni bekliyor.' : 'Ekipte bekleyen konu yok.'}</p></div>${tk.length ? `<div class="dtodo">${tk.join('')}</div>` : ''}</section>${codeCardEkip()}</div>${rest}</div>`;
};

/* ===== v52: Müşteri sayfası mockup ===== */
ICONS.send = ICONS.send || '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>';
ICONS.tag = '<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'; ICONS.gift = '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2-4-6-3-5 0 .6 1.6 3 1 5 0zm0 0c2-4 6-3 5 0-.6 1.6-3 1-5 0z"/>';
function kampanyaHTML() {
  const c = S.camp; const all = segList(c.seg); const ok = all.filter((x) => x.iys === 'onayli'); const out = all.length - ok.length; const first = ok[0];
  const prev = (c.body || '').replace(/\{ad\}/g, first ? first.name.split(' ')[0] : 'Müşterimiz');
  const env = '<svg class="cm-art" viewBox="0 0 90 70" aria-hidden="true"><defs><linearGradient id="cme" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FA8F2"/><stop offset="1" stop-color="#2F68C8"/></linearGradient></defs><path d="M12 30 45 52 78 30v26a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" fill="url(#cme)"/><rect x="24" y="8" width="42" height="34" rx="4" fill="#fff" stroke="#BCD3F2" transform="rotate(-6 45 25)"/><g transform="rotate(-6 45 25)"><rect x="31" y="16" width="28" height="3" rx="1.5" fill="#6FA0E6"/><rect x="31" y="23" width="24" height="3" rx="1.5" fill="#9DBDEB"/><rect x="31" y="30" width="26" height="3" rx="1.5" fill="#9DBDEB"/></g><path d="M12 30 45 52 78 30" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/></svg>';
  const hero = '<svg class="cmh-art" viewBox="0 0 150 80" aria-hidden="true"><defs><linearGradient id="cmh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3F82DA"/><stop offset="1" stop-color="#1B55B0"/></linearGradient></defs><ellipse cx="86" cy="44" rx="58" ry="26" fill="none" stroke="#7FB2F0" stroke-opacity=".45" stroke-width="1.5" transform="rotate(-8 86 44)"/><path d="M26 6 52 14 36 18z" fill="#9CC4F7"/><path d="M26 6 36 18 33 24 30 15z" fill="#6FA0E6"/><path d="M62 38 96 58 130 38v26a6 6 0 0 1-6 6H68a6 6 0 0 1-6-6z" fill="url(#cmh)"/><rect x="72" y="14" width="48" height="40" rx="5" fill="#fff"/><rect x="80" y="24" width="32" height="4" rx="2" fill="#4B87DE"/><rect x="80" y="33" width="28" height="4" rx="2" fill="#9DBDEB"/><rect x="80" y="42" width="30" height="4" rx="2" fill="#9DBDEB"/><path d="M62 38 96 58 130 38" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/></svg>';
  const lab = (ico, t, f) => `<${f ? 'label for="' + f + '"' : 'span'} class="cm-l">${ic(ico, 22)}<b>${t}</b></${f ? 'label' : 'span'}>`;
  return `<div class="stack-lg cm">
  <div class="cm-hero"><div><h3>Yeni kampanya</h3><p>Müşterilerinize toplu e-posta gönderin.</p></div>${hero}</div>
  <div class="card cm-c">
    ${tplRail(lab)}
    <hr class="cm-hr">
    <div class="cm-s">${lab('users', 'Kime')}<div class="cm-ch">${[['all', 'Tüm müşteriler', 'users'], ['recent', 'Son 30 gün gelenler', 'cal'], ['loyal', 'Sadık müşteriler (8+ ziyaret)', 'userplus']].map((x) => `<button type="button" class="cm-p" data-a="campseg" data-v="${x[0]}" aria-pressed="${c.seg === x[0]}">${ic(c.seg === x[0] ? 'check' : x[2], 20)}${x[1]}</button>`).join('')}</div></div>
    <div class="cm-n ${out ? 'warn' : ''}">${ic('users', 26)}<div><b>${ok.length} kişiye gidecek</b>${out ? `<p>${out} kişi e-posta izni vermediği ya da listeden çıktığı için hariç tutuldu.</p>` : ''}</div></div>
    <div class="cm-s">${lab('pencil', 'Konu', 'c-subj')}<input id="c-subj" type="text" value="${esc(c.subj)}" placeholder="Örnek: Bu hafta sonu %15 indirim"></div>
    <div class="cm-s">${lab('chat', 'Mesaj', 'c-body')}<textarea id="c-body" placeholder="{ad} yazarsan her müşterinin adı otomatik gelir">${esc(c.body)}</textarea></div>
    <div class="cm-pv">${ic('mail', 22)}<div><b>Önizleme</b><p style="white-space:pre-line">${esc(prev) || 'Mesajın yazınca burada görünür.'}</p><small>Bu iletiyi almak istemiyorsanız buradan listeden çıkabilirsiniz.</small></div>${env}</div>
    <hr class="cm-hr">
    <button type="button" class="cm-go" data-a="campsend">${ic('send', 22)}<b>${ok.length} kişiye gönder</b></button>
    <p class="cm-f">Gönderen: ${mailReady() ? esc(S.mail.addr) : 'e-posta bağlı değil'}. Ticari elektronik ileti için alıcı onayı ve çıkış bağlantısı gerekir, kapsamı iş hukukçusuyla doğrula.</p>
  </div>
  <div class="card cm-g"><div class="cm-gh"><span class="cm-gi">${ic('layers', 22)}</span><h3>Gönderilen kampanyalar</h3></div>${CAMPAIGNS.length ? CAMPAIGNS.slice().reverse().map((x) => `<div class="cm-r"><div><b>${esc(x.subj)}</b><span>${esc(x.date)} · ${x.sent} kişiye gitti · açılma ${esc(x.open)}</span></div>${ic('chevron', 18)}</div>`).join('') : '<p class="muted" style="padding:4px 14px 14px">Henüz kampanya göndermedin.</p>'}</div></div>`;
}
const _vmu52 = viewMusteri; viewMusteri = function () { return _vmu52().replace('<div class="seg"', '<div class="seg seg-b seg-i"').replace(/(data-v="kampanya" aria-pressed="(?:true|false)">)Toplu e-posta/, '$1' + ic('mail', 22) + '<span>Toplu e-posta</span>').replace(/(data-v="liste" aria-pressed="(?:true|false)">)Müşteri listesi/, '$1' + ic('users', 22) + '<span>Müşteri listesi</span>'); };

/* ===== v54: kampanya şablonları: işletmeye göre 10 davet, yatay kaydırma, Kais AI önerisi ===== */
ICONS.heart = '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'; ICONS.star = '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'; ICONS.party = '<path d="M4 20 9 7l8 8zM14 4v2M19 8h2M18 3l1 1.5M20 13l1.5.5"/>'; ICONS.sparkle = ICONS.sparkle || '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>';
ICONS.invite = '<path d="M3 10l9-6 9 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10l9 6 9-6"/><path d="M9 12V8.5h6V12M10.5 10h3"/>'; ICONS.leaf = ICONS.leaf || '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15Z"/><path d="M5 19 13 11"/>';
const TPL_IC = ['tag', 'gift', 'heart', 'party', 'users', 'invite', 'leaf', 'clock', 'star', 'chat'];
const TPL_V = {
  kafe: { disc: 'sıcak içeceklerde', nw: 'tarçınlı rulo', treat: 'bir kahve', book: 'Masanı önceden ayırt', season: 'sonbahar menümüz', happy: 'hafta içi 15.00-17.00 arası ikinci kahve yarı fiyatına', ev: 'kahve tadım günümüz' },
  firin: { disc: 'unlu mamullerde', nw: 'taze çıkan yeni böreğimiz', treat: 'bir poğaça', book: 'Siparişini önceden ver', season: 'sonbahar lezzetlerimiz', happy: 'akşam 18.00 sonrası günün ürünlerinde indirim', ev: 'ekşi maya atölyemiz' },
  restoran: { disc: 'tüm ana yemeklerde', nw: 'şefin yeni tabağı', treat: 'bir tatlı', book: 'Masanı önceden ayırt', season: 'mevsim menümüz', happy: 'hafta içi öğle menüsünde özel fiyat', ev: 'şef masası akşamımız' },
  market: { disc: 'seçili ürünlerde', nw: 'yeni gelen ürünlerimiz', treat: 'küçük bir sürpriz hediye', book: 'Siparişini önceden ver', season: 'sezon ürünlerimiz', happy: 'hafta içi sabah saatlerinde indirim', ev: 'tadım günümüz' },
  magaza: { disc: 'seçili ürünlerde', nw: 'yeni sezon koleksiyonumuz', treat: 'küçük bir hediye', book: 'Özel gün için ürününü ayırt', season: 'yeni sezon koleksiyonumuz', happy: 'hafta içi seçili ürünlerde ek indirim', ev: 'özel alışveriş günümüz' },
  kuafor: { disc: 'saç bakımı ve kesimde', nw: 'yeni bakım hizmetimiz', treat: 'bir bakım uygulaması', book: 'Randevunu önceden al', season: 'sezon bakımlarımız', happy: 'hafta içi sabah randevularında özel fiyat', ev: 'bakım günümüz' },
  spor: { disc: 'aylık üyeliklerde', nw: 'yeni grup dersimiz', treat: 'bir deneme dersi', book: 'Dersine önceden yer ayırt', season: 'yaz hazırlığı programımız', happy: 'hafta içi sabah seanslarında özel fiyat', ev: 'açık hava antrenmanımız' },
  otel: { disc: 'konaklamalarda', nw: 'yeni oda konseptimiz', treat: 'bir kahvaltı', book: 'Odanı önceden ayırt', season: 'yeni sezon', happy: 'hafta içi konaklamalarda özel fiyat', ev: 'etkinlik gecemiz' },
  oto: { disc: 'bakım paketlerinde', nw: 'yeni servis paketimiz', treat: 'ücretsiz bir kontrol', book: 'Randevunu önceden al', season: 'kış bakım kampanyamız', happy: 'hafta içi randevularda özel fiyat', ev: 'ücretsiz kontrol günümüz' },
  klinik: { disc: 'kontrol ve muayenelerde', nw: 'yeni tedavi seçeneğimiz', treat: 'ücretsiz bir ön muayene', book: 'Randevunu önceden al', season: 'yıllık check-up kampanyamız', happy: 'hafta içi randevularda özel fiyat', ev: 'bilgilendirme günümüz' },
  egitim: { disc: 'kurs kayıtlarında', nw: 'yeni dönem programımız', treat: 'ücretsiz bir deneme dersi', book: 'Yerini önceden ayırt', season: 'yeni dönemimiz', happy: 'hafta içi akşam gruplarında özel fiyat', ev: 'tanışma günümüz' },
  genel: { disc: 'seçili ürün ve hizmetlerde', nw: 'yeni ürün ve hizmetimiz', treat: 'küçük bir sürpriz', book: 'Randevunu ya da siparişini önceden ver', season: 'yeni sezonumuz', happy: 'hafta içi seçili ürünlerde özel fiyat', ev: 'özel günümüz' }
};
function tplGroup() {
  const t = foldTr((typeof PROF !== 'undefined' && PROF.tur) || '') || foldTr(BIZ || '');
  const has = (...w) => w.some((x) => t.indexOf(x) >= 0);
  if (has('kafe', 'cafe', 'kahve')) return 'kafe';
  if (has('firin', 'pastane', 'tatli', 'dondurma')) return 'firin';
  if (has('restoran', 'fast', 'doner', 'kebap', 'bar', 'catering', 'lokanta')) return 'restoran';
  if (has('market', 'kasap', 'manav', 'sarkuteri', 'bakkal')) return 'market';
  if (has('magaza', 'elektronik', 'kirtasiye', 'cicek', 'eczane', 'butik')) return 'magaza';
  if (has('kuafor', 'berber', 'guzellik', 'spa', 'masaj')) return 'kuafor';
  if (has('spor', 'fitness', 'pilates')) return 'spor';
  if (has('otel', 'pansiyon')) return 'otel';
  if (has('oto', 'servis', 'yikama')) return 'oto';
  if (has('klinik', 'dis', 'doktor')) return 'klinik';
  if (has('egitim', 'kurs', 'okul')) return 'egitim';
  return 'genel';
}
function tplBuild() {
  const v = TPL_V[tplGroup()]; const sig = '\n\nSeni bekliyoruz,\n' + BIZ; const hi = 'Merhaba {ad},\n\n';
  return [
    { n: 'Hafta sonu indirimi', subj: `Bu hafta sonu ${v.disc} %15 indirim`, body: `${hi}Cumartesi ve pazar günü ${v.disc} %15 indirim var. Bu e-postayı göstermen yeterli.${sig}` },
    { n: 'Yeni geldi', subj: `Yeni: ${v.nw}`, body: `${hi}Sana haber vermek istedik: ${v.nw} artık burada. İlk gelen müşterilerimize küçük bir sürprizimiz var.${sig}` },
    { n: 'Seni özledik', subj: 'Uzun zaman oldu, seni ağırlamak isteriz', body: `${hi}Seni bir süredir göremedik. Bu ay içinde uğrarsan ${v.treat} bizden.${sig}` },
    { n: 'Doğum günü', subj: 'Doğum gününü kutlarız', body: `${hi}Doğum günün ay içindeyse bize uğra, ${v.treat} bizden. Nice mutlu yıllara!${sig}` },
    { n: 'Etkinlik daveti', subj: `${v.ev[0].toLocaleUpperCase('tr') + v.ev.slice(1)} için davetlisin`, body: `${hi}Bu ay ${v.ev} var ve seni de aramızda görmek isteriz. Yerin sınırlı, bu e-postaya cevap yazarak yerini ayırtabilirsin.${sig}` },
    { n: 'Arkadaşını getir', subj: 'Arkadaşınla gel, ikiniz de kazanın', body: `${hi}Bir arkadaşınla birlikte gelirsen ikinize de ${v.treat} bizden. Bu ay sonuna kadar geçerli.${sig}` },
    { n: 'Yeni sezon', subj: `${v.season[0].toLocaleUpperCase('tr') + v.season.slice(1)} başladı`, body: `${hi}${v.season[0].toLocaleUpperCase('tr') + v.season.slice(1)} başladı. İlk görenlerden olmak için bu hafta uğrayabilirsin.${sig}` },
    { n: 'Yerini ayırt', subj: 'Sıra beklemeden gel', body: `${hi}${v.book}, sıra beklemeden keyfini çıkar. Bu e-postaya cevap yazman yeterli.${sig}` },
    { n: 'Sakin saatler', subj: 'Sakin saatlerde sana özel fırsat', body: `${hi}Daha sakin saatlerde seni daha rahat ağırlıyoruz: ${v.happy}.${sig}` },
    { n: 'Yorumunu paylaş', subj: 'Deneyimin nasıldı?', body: `${hi}Son ziyaretin nasıldı? Bir cümlelik yorumun bizim için çok değerli. Cevap yazarsan bir sonraki ziyaretinde ${v.treat} bizden.${sig.replace('Seni bekliyoruz', 'Teşekkürler')}` }
  ];
}
const curTpls = () => (S.tplAI && S.tplAI.length ? S.tplAI : tplBuild());
H.camptpl = (el) => { const t = curTpls()[Number(el.dataset.i)]; if (!t) return; S.camp.subj = t.subj; S.camp.body = t.body; render(); };
function tplRail(lab) {
  const L = curTpls(); const c = S.camp; const ai = !!(S.tplAI && S.tplAI.length);
  const can = aiReady() && S.user && S.user.role === 'patron';
  return `<div class="cm-s tpl"><div class="tpl-h">${lab('layers', 'Şablon')}${can ? `<button type="button" class="tpl-ai" data-a="tplai" ${S.tplBusy ? 'disabled' : ''}>${ic('sparkle', 16)}<span>${S.tplBusy ? 'Hazırlanıyor…' : ai ? 'Yeniden öner' : 'Kais AI ile öner'}</span></button>` : ''}</div>
  <p class="tpl-n">${ai ? 'Kais AI işletmene göre yazdı.' : 'İşletmene göre ' + L.length + ' davet hazırladım.'} Seçince metne yazılır, düzenleyebilirsin.</p>
  <div class="tpl-rail" role="list">${L.map((t, i) => `<button type="button" role="listitem" class="tpl-c${c.subj === t.subj ? ' on' : ''}" data-a="camptpl" data-i="${i}"><span class="tpl-i">${ic(TPL_IC[i % TPL_IC.length], 20)}</span><b>${esc(t.n)}</b><span class="tpl-s">${esc(t.subj)}</span>${c.subj === t.subj ? `<i class="tpl-k">${ic('check', 14)}</i>` : ''}</button>`).join('')}</div></div>`;
}
H.tplai = async () => {
  if (S.tplBusy) return; S.tplBusy = true; render();
  try {
    const tur = (typeof PROF !== 'undefined' && PROF.tur) || '';
    const q = `İşletme adı: ${BIZ}.${tur ? ' İşletme türü: ' + tur + '.' : ''} Bu işletmenin müşterilerine gönderebileceği 10 FARKLI davet/kampanya e-postası öner (indirim, yeni ürün, özleme, doğum günü, etkinlik, arkadaş getir, sezon, rezervasyon, sakin saat, yorum gibi, işletmenin işine uygun). Yalnızca JSON dizisi yaz, başka hiçbir şey yazma: [{"n":"2-3 kelimelik başlık","subj":"e-posta konusu (en çok 60 karakter)","body":"Merhaba {ad},\\n\\n2 kısa cümle\\n\\nSeni bekliyoruz,\\n${BIZ}"}]. Uydurma fiyat ya da adres yazma.`;
    const d = await aiCall('kampanya', q, [], {});
    let t = String((d && d.reply) || ''); const a = t.indexOf('['); if (a < 0) throw new Error('parse'); t = t.slice(a);
    let arr; try { arr = JSON.parse(t.slice(0, t.lastIndexOf(']') + 1)); } catch (e) { const k = t.lastIndexOf('}'); arr = JSON.parse(t.slice(0, k + 1) + ']'); }
    arr = (arr || []).filter((x) => x && x.n && x.subj && x.body).slice(0, 10).map((x) => ({ n: String(x.n).slice(0, 28), subj: String(x.subj).slice(0, 90), body: String(x.body) }));
    if (arr.length < 3) throw new Error('parse'); S.tplAI = arr; toast('Kais AI yeni şablonlar yazdı.', 'ok');
  } catch (e) { toast(e && e.kind === 'user' ? e.message : 'Şu an öneri alınamadı. Hazır şablonları kullanabilirsin.', 'warn'); }
  S.tplBusy = false; render();
};

/* v55: sahte verilerden arındırma (gerçek sürüm) */
(function () {
  AUTH.demo = false;
  const wd = wipeData;
  wipeData = function () { wd(); [CUSTOMERS, CAMPAIGNS, RULES, MAILDOCS, MONTHS, UPCOMING, RECV].forEach((a) => { a.length = 0; }); if (!(SBS && SBS.user)) { NAMES.u1 = { name: 'Patron', title: 'Patron' }; } USERS.forEach((u) => { u.email = ''; }); try { applyNames(); } catch (e) {} };
  wipeData();
  const pa = pApply; pApply = function (s) { AUTH.demo = false; return pa(s); };
})();

/* v56: Şartlar ve sözleşmeler — modern düzen */
const SZI = {
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h4M10 13h5M10 17h5"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  team: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 14.5c2.8 0 5 1.8 5 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const szi = (k, n) => `<svg viewBox="0 0 24 24" width="${n || 20}" height="${n || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SZI[k]}</svg>`;
const SZ_SUG = {
  fields: [['Kan grubu', 'text'], ['Medeni hâl', 'text'], ['Doğum yeri', 'text'], ['Banka adı', 'text'], ['Ehliyet sınıfı', 'text'], ['SGK sicil no', 'text'], ['Acil durum telefonu', 'tel']],
  docs: [['Vesikalık fotoğraf'], ['Sabıka kaydı'], ['Ehliyet'], ['Banka hesap belgesi'], ['Hijyen / gıda sertifikası'], ['Askerlik durum belgesi']],
  consents: [['Çalışma saati ve mola kurallarını kabul ediyorum'], ['İş sağlığı ve güvenliği kurallarını okudum'], ['Gizlilik yükümlülüğünü kabul ediyorum']],
};
H.onbq = (el) => { const k = el.dataset.k; const l = el.dataset.l; const n = 'x' + Date.now().toString(36); if (k === 'fields') ONB.cd.fields.push({ id: n, label: l, type: el.dataset.t || 'text', req: false }); else if (k === 'docs') ONB.cd.docs.push({ id: n, label: l, req: false }); else ONB.cd.consents.push({ id: n, text: l, req: true }); render(); };
H.onbvar = (el) => { const t = document.getElementById('onb-ctx'); if (!t || !ONB.cd) return; const v = el.dataset.v; const a = t.selectionStart || 0; const b = t.selectionEnd || 0; t.value = t.value.slice(0, a) + v + t.value.slice(b); ONB.cd.contract.text = t.value; t.focus(); t.selectionStart = t.selectionEnd = a + v.length; };
viewSartlar = function () {
  if (!ONB.loaded && !ONB.cfgBusy) { ONB.cfgBusy = true; onbLoadCfg().catch(() => {}).then(() => { ONB.cfgBusy = false; ONB.cd = null; render(); }); return `<div class="sz-load"><span class="sz-sk"></span><span class="sz-sk"></span><span class="sz-sk"></span></div>`; }
  if (!ONB.cd) ONB.cd = onbClone(ONB.cfg || ONB_DEF());
  const cd = ONB.cd; const cloud = onbCloud();
  if (cloud && ONB.list === null && !ONB.listBusy) onbLoadList().then(() => render());
  const pub = !!ONB.ver;
  const hero = ONB.missing ? `<div class="callout warn">${ic('alert')}<div>Bu bölümün tabloları kurulmamış. <b>kaispilot_sozlesme.sql</b> dosyasını Supabase'de bir kez çalıştır.</div></div>`
    : `<div class="sz-hero"><div class="sz-ht"><span class="sz-ic big">${szi('shield', 24)}</span><div class="grow"><b>Karşılama ve sözleşme</b><span class="sz-sub">${!cloud ? 'Bu cihazda deneme modu, çalışanlara gitmez.' : pub ? `Yayında · sürüm ${ONB.ver}` : 'Henüz yayınlanmadı'}</span></div><span class="sz-st ${pub && cloud ? 'ok' : 'wait'}">${pub && cloud ? 'Yayında' : 'Taslak'}</span></div>
    <div class="sz-stats"><div><b>${cd.fields.length}</b><span>bilgi</span></div><div><b>${cd.docs.length}</b><span>evrak</span></div><div><b>${cd.consents.length}</b><span>onay</span></div></div>
    <p class="sz-note">${pub ? 'Yeni katılan çalışan ve müdürler ilk girişte bu adımları tamamlar.' : 'En alttaki <b>Kaydet ve yayınla</b> düğmesine basınca çalışanların karşısına çıkar.'}</p></div>`;
  const tsel = (i, t) => `<select class="sz-sel" data-ch="onbcf" data-k="fields" data-i="${i}" data-p="type" aria-label="Tür">${[['text', 'Yazı'], ['textarea', 'Uzun yazı'], ['date', 'Tarih'], ['tel', 'Telefon'], ['tc', 'T.C. kimlik'], ['iban', 'IBAN']].map((x) => `<option value="${x[0]}"${t === x[0] ? ' selected' : ''}>${x[1]}</option>`).join('')}</select>`;
  const sw = (k, i, v) => `<label class="sz-sw"><input type="checkbox" data-ch="onbcf" data-k="${k}" data-i="${i}" data-p="req"${v ? ' checked' : ''}><span class="sz-tr"></span><em>Zorunlu</em></label>`;
  const del = (k, i) => `<button class="sz-del" data-a="onbdel" data-k="${k}" data-i="${i}" aria-label="Sil">${szi('x', 16)}</button>`;
  const item = (k, i, inner, label, key, extra) => `<div class="sz-item"><input class="sz-in" type="text" value="${esc(label)}" data-ch="onbcf" data-k="${k}" data-i="${i}" data-p="${key}" aria-label="Ad">${inner ? '' : ''}<div class="sz-meta">${extra || ''}${sw(k, i, inner)}${del(k, i)}</div></div>`;
  const sug = (k) => { const have = (k === 'consents' ? cd.consents.map((x) => x.text) : cd[k].map((x) => x.label)).map((x) => String(x).toLowerCase()); const l = SZ_SUG[k].filter((x) => !have.includes(x[0].toLowerCase())).slice(0, 6); return l.length ? `<div class="sz-sug"><span>Öneri</span>${l.map((x) => `<button type="button" data-a="onbq" data-k="${k}" data-l="${esc(x[0])}" data-t="${x[1] || ''}">${szi('plus', 12)}${esc(x[0])}</button>`).join('')}</div>` : ''; };
  const sec = (k, ico, ttl, sub, rows, addLbl, n) => `<section class="sz-card"><header><span class="sz-ic">${szi(ico, 20)}</span><div class="grow"><h3>${ttl}</h3><p>${sub}</p></div><span class="sz-n">${n}</span></header>${rows || `<p class="sz-empty">Henüz bir şey eklenmedi.</p>`}${sug(k)}<button class="sz-add" data-a="onbadd" data-k="${k}">${szi('plus', 16)} ${addLbl}</button></section>`;
  const fields = cd.fields.map((f, i) => item('fields', i, f.req, f.label, 'label', tsel(i, f.type))).join('');
  const docs = cd.docs.map((f, i) => item('docs', i, f.req, f.label, 'label')).join('');
  const cons = cd.consents.map((f, i) => item('consents', i, f.req, f.text, 'text')).join('');
  let list = '';
  if (cloud && !ONB.missing) {
    if (ONB.list === null || ONB.listBusy) list = '<p class="sz-empty">Yükleniyor…</p>';
    else if (ONB.list.err) list = `<p class="sz-empty" style="color:var(--nar)">${esc(ONB.list.err)}</p>`;
    else if (!ONB.list.length) list = '<p class="sz-empty">Henüz davetle katılan çalışan yok. Giriş kodunu Ekip sayfasından paylaşabilirsin.</p>';
    else list = ONB.list.map((x, i) => { const st = onbStatus(x); const nm = (x.s && x.s.answers && x.s.answers.ad) || x.m.display_name || x.m.email; return `<button class="sz-person" data-a="onbsee" data-i="${i}"><span class="sz-av">${esc(String(nm || '?').trim().charAt(0).toUpperCase())}</span><div class="grow"><b>${esc(nm)}</b><span>${esc(ROLE_LABEL[x.m.role] || '')}${x.s && x.s.accepted_at ? ' · onay ' + new Date(x.s.accepted_at).toLocaleDateString('tr-TR') : ''} · ${x.d.length} evrak</span></div><span class="pill ${st[0]}">${st[1]}</span></button>`; }).join('');
  }
  const status = cloud && !ONB.missing ? `<section class="sz-card"><header><span class="sz-ic">${szi('team', 20)}</span><div class="grow"><h3>Çalışanların durumu</h3><p>Davet koduyla katılanlar ve karşılama adımları.</p></div><button class="sz-ref" data-a="onbref">Yenile</button></header>${list}</section>` : '';
  const vars = [['{ad}', 'Ad soyad'], ['{tc}', 'T.C. no'], ['{isletme}', 'İşletme'], ['{gorev}', 'Görev'], ['{tarih}', 'Tarih']];
  const ct = `<section class="sz-card"><header><span class="sz-ic">${szi('pen', 20)}</span><div class="grow"><h3>Sözleşme</h3><p>Çalışanın adı, görevi ve tarihi otomatik yerleşir.</p></div></header>
   <div class="sz-warn">Örnek metni kullanmadan önce kendi şartlarına göre düzenle, gerekirse bir hukukçuya kontrol ettir.</div>
   <label class="sz-lab" for="onb-ctt">Başlık</label><input class="sz-in" type="text" id="onb-ctt" value="${esc(cd.contract.title)}" data-ch="onbcf" data-k="contract" data-p="title">
   <label class="sz-lab" for="onb-ctx">Metin</label>
   <div class="sz-sug"><span>Alan ekle</span>${vars.map((v) => `<button type="button" data-a="onbvar" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>
   <textarea class="sz-in sz-ta" id="onb-ctx" rows="12" data-ch="onbcf" data-k="contract" data-p="text">${esc(cd.contract.text)}</textarea>
   ${pub ? `<label class="sz-sw wide"><input type="checkbox" id="onb-bump"${ONB.bump ? ' checked' : ''} data-ch="onbbump"><span class="sz-tr"></span><em>Sözleşmeyi değiştirdim, mevcut çalışanlar tekrar onaylasın</em></label>` : ''}
   ${pub ? '<button class="sz-link" data-a="onbreset">Örnek ayarlara dön</button>' : ''}</section>`;
  return `<div class="sz">${hero}${status}
  ${sec('fields', 'user', 'Doldurulacak bilgiler', 'Çalışan ilk girişte bu alanları doldurur.', fields, 'Bilgi ekle', cd.fields.length)}
  ${sec('docs', 'doc', 'İstenen evraklar', 'Fotoğraf ya da PDF olarak yüklenir.', docs, 'Evrak ekle', cd.docs.length)}
  ${sec('consents', 'check', 'Onay maddeleri', 'Sözleşmenin altında işaretlenecek kutular.', cons, 'Madde ekle', cd.consents.length)}
  ${ct}
  <div class="sz-bar"><button class="btn sec" data-a="onbprev">Önizle</button><button class="btn grow" data-a="onbpub"${ONB.missing ? ' disabled' : ''}>${pub ? 'Kaydet' : 'Kaydet ve yayınla'}</button></div></div>`;
};

/* v58: Kais AI sayfası yeni tasarım */
const KAI = { spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>', bars: '<path d="M6 20v-5M12 20V9M18 20V4"/>', cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2.5l2.2 11h10.3l2-8H7"/>', chev: '<path d="M9 5l7 7-7 7"/>', up: '<path d="M7 3h7l4 4v14H7z"/><path d="M12 17v-6M9.5 13.5L12 11l2.5 2.5"/>', bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/>', clip: '<path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.3 3.3 0 014.7 4.7L9.2 17.2a1.7 1.7 0 01-2.4-2.4L14 7.5"/>', send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>' };
const kai = (k, n) => `<svg viewBox="0 0 24 24" width="${n || 22}" height="${n || 22}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${KAI[k]}</svg>`;
const KAI_IC = ['spark', 'bars', 'cart'];
const viewKaisAIV58 = viewKaisAI;
viewKaisAI = function () {
  let h = viewKaisAIV58();
  const orb = `<div class="kx-orb" aria-hidden="true"><svg viewBox="0 0 112 92" width="112" height="92"><defs>
<radialGradient id="kxg1" cx=".34" cy=".28" r=".95"><stop offset="0" stop-color="#6FD39E"/><stop offset=".22" stop-color="#23925D"/><stop offset=".6" stop-color="#0B4D2E"/><stop offset="1" stop-color="#042A19"/></radialGradient>
<radialGradient id="kxg2" cx=".66" cy=".74" r=".62"><stop offset=".6" stop-color="#3EE08F" stop-opacity="0"/><stop offset="1" stop-color="#5CF0A8" stop-opacity=".6"/></radialGradient>
<linearGradient id="kxg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FEFC8"/><stop offset=".5" stop-color="#C9FBE6"/><stop offset="1" stop-color="#7BE3BA"/></linearGradient>
<linearGradient id="kxg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="kxf" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
<g transform="rotate(-14 56 46)"><ellipse cx="56" cy="46" rx="52" ry="16" fill="none" stroke="#7FE9BC" stroke-opacity=".55" stroke-width="3" filter="url(#kxf)"/><ellipse cx="56" cy="46" rx="52" ry="16" fill="none" stroke="url(#kxg3)" stroke-width="1.8"/></g>
<circle cx="56" cy="46" r="38" fill="url(#kxg1)"/><circle cx="56" cy="46" r="38" fill="url(#kxg2)"/><circle cx="56" cy="46" r="37.2" fill="none" stroke="#7CF0B8" stroke-opacity=".35" stroke-width="1.4"/>
<ellipse cx="42" cy="26" rx="18" ry="9" transform="rotate(-32 42 26)" fill="url(#kxg4)"/>
<text x="57" y="62" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="46" font-weight="700" font-style="italic" fill="#fff" style="filter:drop-shadow(0 2px 3px rgba(0,40,20,.45))">K</text>
<g transform="rotate(-14 56 46)"><path d="M4 46A52 16 0 0 0 108 46" fill="none" stroke="#7FE9BC" stroke-opacity=".5" stroke-width="3" filter="url(#kxf)"/><path d="M4 46A52 16 0 0 0 108 46" fill="none" stroke="url(#kxg3)" stroke-width="1.8"/></g></svg></div>`;
  h = h.replace(/<div><h2>Kais AI<\/h2><p class="muted small"[^>]*>([\s\S]*?)<\/p><\/div>/, (m, t) => `<div class="kx-hero"><div class="kx-ht"><h2>Kais AI ${kai('spark', 22)}</h2><p>${t}</p></div>${orb}</div>`);
  let qi = 0;
  h = h.replace(/<div class="stack">((?:<button class="btn sec"[^>]*data-a="aiq"[\s\S]*?<\/button>)+)<\/div>/, (m, inner) => `<div class="kx-qs">${inner.replace(/<button class="btn sec"[^>]*data-a="aiq" data-q="([^"]*)">([\s\S]*?)<\/button>/g, (mm, q, t) => `<button type="button" class="kx-q" data-a="aiq" data-q="${q}"><span class="kx-qi">${kai(KAI_IC[qi++ % 3], 22)}</span><span class="grow">${t}</span>${kai('chev', 18)}</button>`)}</div>`);
  h = h.replace(/<div class="field"><label>Fatura ya da belge ekle<\/label><div class="row wrap">([\s\S]*?)<\/div><\/div>(?=<div class="field"><label for="ai-q">)/, (m, inner) => {
    const chips = (inner.match(/<span class="chip">[\s\S]*?<\/span>/g) || []).join('');
    const hasInput = /id="ai-file"/.test(inner);
    return `<div class="kx-sec"><div class="kx-lab"><b>Fatura ya da belge ekle</b><span class="kx-tag">${kai('bolt', 14)} Akıllı analiz</span></div>${chips ? `<div class="kx-chips">${chips}</div>` : ''}${hasInput ? `<label class="kx-drop" for="ai-file">${kai('up', 26)}<b>Fotoğraf / PDF seç</b></label><input id="ai-file" type="file" accept="image/*,application/pdf" multiple data-ch="kfile" style="position:absolute;opacity:0;width:1px;height:1px">` : ''}</div>`;
  });
  h = h.replace(/<div class="field"><label for="ai-q">Sorun<\/label><textarea id="ai-q"[^>]*placeholder="([^"]*)">([\s\S]*?)<\/textarea><\/div>/, (m, ph, v) => `<div class="kx-sec"><div class="kx-lab"><b>Sorun</b></div><div class="kx-box"><textarea id="ai-q" rows="1" placeholder="${ph}">${v}</textarea><div class="kx-tools"><button type="button" class="kx-tool" data-a="aimic" aria-label="Sesle yaz">${kai('mic', 20)}</button><label class="kx-tool" for="ai-file" aria-label="Dosya ekle">${kai('clip', 20)}</label></div></div></div>`);
  h = h.replace(/<div class="row wrap"><button class="btn grow" data-a="aisend"([^>]*)>Gönder<\/button>(<button class="btn sec" data-a="aiclear">Yeni sohbet<\/button>)?<\/div>/, (m, a, c) => `<div class="kx-act"><button class="kx-send" data-a="aisend"${a}>${kai('send', 20)} Gönder</button>${c ? '<button class="kx-new" data-a="aiclear">Yeni sohbet</button>' : ''}</div>`);
  h = h.replace(/<p class="small muted">(Yanıtlar yalnızca[\s\S]*?)<\/p>/, (m, t) => `<p class="kx-info">${kai('info', 18)}<span>${t}</span></p>`);
  return h.replace('<div class="stack-lg">', '<div class="stack-lg kx">');
};
H.aimic = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; const el = document.getElementById('ai-q');
  if (!SR) { toast('Bu tarayıcı sesle yazmayı desteklemiyor.', 'warn'); return; }
  try { const r = new SR(); r.lang = 'tr-TR'; r.interimResults = false; r.onresult = (e) => { const t = Array.from(e.results).map((x) => x[0].transcript).join(' '); if (el) { el.value = (el.value ? el.value + ' ' : '') + t; AIC.draft = el.value; } }; r.onerror = () => toast('Ses alınamadı.', 'warn'); r.start(); toast('Dinliyorum…'); } catch (e) { toast('Mikrofon açılamadı.', 'warn'); }
};

/* v59: Kais AI sayfası yeşil tema (sadece bu sayfa) */
const rndV59 = render; render = function () { const r = rndV59.apply(this, arguments); try { document.body.classList.toggle('kx-on', S.view === 'kaisai' && !!S.user); } catch (e) {} return r; };

document.addEventListener('input', (e) => { const t = e.target; if (t && t.id === 'ai-q') { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; } });

/* v61: Stok sayfası modern görünüm */
const SXI = { plus: '<path d="M12 5v14M5 12h14"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>', up: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', wal: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.01"/>', cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2.5l2.2 11h10.3l2-8H7"/>', find: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>' };
const sxi = (k, n) => `<svg viewBox="0 0 24 24" width="${n || 18}" height="${n || 18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SXI[k]}</svg>`;
const viewStokV61 = viewStok;
viewStok = function () {
  let h = viewStokV61();
  if (!/data-a="stkf"/.test(h)) return h;
  h = h.replace(/<div class="row between wrap"><div><h2>Stok<\/h2><p[^>]*>([\s\S]*?)<\/p><\/div><div class="row wrap"[^>]*>(<button class="btn sec" data-a="etkopen">[\s\S]*?<\/button>)(<button class="btn sec" data-a="stkbulk">[\s\S]*?<\/button>)(<button class="btn" data-a="stkadd">[\s\S]*?<\/button>)<\/div><\/div>/, (m, sub) =>
    `<div class="stx-head"><div class="grow"><h2>Stok</h2><p>${sub}</p></div><button class="stx-add" data-a="stkadd">${sxi('plus', 20)}<span>Ürün ekle</span></button></div><div class="stx-tools"><button type="button" data-a="etkopen">${sxi('tag')} Etiket</button><button type="button" data-a="stkbulk">${sxi('up')} İçe aktar</button></div>`);
  const kic = [['wal', 'blue'], ['alert', 'red'], ['cart', 'amber']]; let ki = 0;
  h = h.replace(/<div class="kpi"><div class="l">([^<]*)<\/div><div class="v num">([^<]*)<\/div><\/div>/g, (m, l, v) => { const c = kic[ki++ % 3]; const num = parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0; return `<div class="stx-k ${c[1]}${c[1] !== 'blue' && num > 0 ? ' on' : ''}"><span class="stx-ki">${sxi(c[0], 18)}</span><b class="num">${v}</b><span class="stx-kl">${l.replace('Sipariş gereken', 'Sipariş')}</span></div>`; });
  h = h.replace('<div class="kpis">', '<div class="stx-ks">');
  h = h.replace(/<div class="row wrap" style="gap:10px">(<div class="seg" role="group" aria-label="Filtre">[\s\S]*?<\/div>)(<div class="seg" role="group" aria-label="Gruplama">[\s\S]*?<\/div>)\s*(<input[^>]*data-ch="stq"[^>]*>)<\/div>/, (m, f, g, i) =>
    `<label class="stx-find">${sxi('find', 18)}${i.replace(' class="grow"', '').replace(/style="[^"]*"/, '')}</label><div class="stx-chips" role="group" aria-label="Filtre">${f.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, '')}</div><div class="stx-view"><span>Görünüm</span>${g.replace('class="seg"', 'class="seg stx-seg"')}</div>`);
  return h.replace('<div class="stack-lg">', '<div class="stack-lg stx">');
};

/* v62: Rezervasyon sayfası — takvim, gün akışı, akıllı bildirimler */
const RZM = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const RZD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const RZI = { cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', l: '<path d="M15 5l-7 7 7 7"/>', r: '<path d="M9 5l7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 21h4"/>', users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 14.5c2.8 0 5 1.8 5 4.5"/>', check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', wa: '<path d="M5 19l1.2-4A8 8 0 1112 20a8 8 0 01-3.8-1z"/>' };
const rzi = (k, n) => `<svg viewBox="0 0 24 24" width="${n || 18}" height="${n || 18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RZI[k]}</svg>`;
S.rzCal = false; S.rzMonth = null;
const rzMon = (d) => { const a = d.split('-').map(Number); return a[0] + '-' + String(a[1]).padStart(2, '0'); };
const rzMonAdd = (m, n) => { const a = m.split('-').map(Number); const d = new Date(Date.UTC(a[0], a[1] - 1 + n, 1)); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
const rzMonday = (iso) => addDays(iso, -((dowOf(iso) + 6) % 7));
const rzNum = (iso) => parseInt(iso.slice(8), 10);
const rzCnt = (d) => RESV.filter((r) => r.date === d && rzActive(r)).length;
function rzLong(d) { return DOWN[dowOf(d)] + ', ' + rzNum(d) + ' ' + RZM[parseInt(d.slice(5, 7), 10) - 1] + ' ' + d.slice(0, 4); }
function rzRel(d) { const n = Math.round((new Date(d + 'T00:00:00Z') - new Date(REF_ISO + 'T00:00:00Z')) / 864e5); return n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : n === -1 ? 'Dün' : n > 0 ? n + ' gün sonra' : -n + ' gün önce'; }
function rzCalHTML() {
  const m = S.rzMonth || rzMon(S.rzDate); const first = m + '-01'; const lead = (dowOf(first) + 6) % 7; const dim = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7), 0)).getUTCDate();
  const cells = []; for (let i = 0; i < lead; i++) cells.push('<span class="rz-c off"></span>');
  for (let d = 1; d <= dim; d++) { const iso = m + '-' + String(d).padStart(2, '0'); const c = rzCnt(iso); cells.push(`<button type="button" class="rz-c${iso === S.rzDate ? ' sel' : ''}${iso === REF_ISO ? ' today' : ''}${iso < REF_ISO ? ' past' : ''}" data-a="rzday" data-d="${iso}" aria-label="${rzLong(iso)}${c ? ', ' + c + ' rezervasyon' : ''}"><b>${d}</b>${c ? `<i>${c}</i>` : ''}</button>`); }
  return `<div class="rz-cal"><div class="rz-cal-h"><button type="button" class="rz-ic" data-a="rzmon" data-n="-1" aria-label="Önceki ay">${rzi('l')}</button><b>${RZM[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}</b><button type="button" class="rz-ic" data-a="rzmon" data-n="1" aria-label="Sonraki ay">${rzi('r')}</button></div>
  <div class="rz-cal-w">${RZD.map((x) => `<span>${x}</span>`).join('')}</div><div class="rz-cal-g">${cells.join('')}</div>
  <div class="rz-cal-f"><button type="button" class="rz-link" data-a="rzday" data-d="${REF_ISO}">Bugüne git</button><span class="small muted"><i class="rz-dot"></i> rezervasyon sayısı</span></div></div>`;
}
rzTop = function () {
  const d = S.rzDate; const L = RESV.filter((r) => r.date === d && rzActive(r)); const ppl = L.reduce((a, r) => a + r.n, 0); const came = L.filter((r) => r.st === 'geldi').length;
  const mon = rzMonday(d); const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const strip = week.map((x, i) => { const c = rzCnt(x); return `<button type="button" class="rz-d${x === d ? ' sel' : ''}${x === REF_ISO ? ' today' : ''}" data-a="rzday" data-d="${x}" aria-pressed="${x === d}"><span>${RZD[i]}</span><b>${rzNum(x)}</b><i class="${c ? 'on' : ''}">${c || ''}</i></button>`; }).join('');
  const full = (() => { const t = TABLES.reduce((a, x) => a + (x.cap || 0), 0); return t ? Math.min(100, Math.round((ppl / t) * 100)) : 0; })();
  return `<div class="rz-head"><div class="grow"><h2>Rezervasyon</h2><p>${esc(rzLong(d))}<span class="rz-rel">${rzRel(d)}</span></p></div><button class="rz-new" data-a="rznew">${rzi('plus', 20)}<span>Yeni</span></button></div>
  <div class="rz-bar"><button type="button" class="rz-ic" data-a="rzstep" data-n="-1" aria-label="Önceki gün">${rzi('l')}</button><button type="button" class="rz-calbtn${S.rzCal ? ' on' : ''}" data-a="rzcal">${rzi('cal', 18)} ${RZM[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}</button><button type="button" class="rz-ic" data-a="rzstep" data-n="1" aria-label="Sonraki gün">${rzi('r')}</button>${d === REF_ISO ? '' : `<button type="button" class="rz-today" data-a="rzday" data-d="${REF_ISO}">Bugün</button>`}<button type="button" class="rz-tb" data-a="rztables">Masalar</button></div>
  ${S.rzCal ? rzCalHTML() : `<div class="rz-week">${strip}</div>`}
  <div class="stx-ks"><div class="stx-k blue"><span class="stx-ki">${rzi('cal', 18)}</span><b class="num">${L.length}</b><span class="stx-kl">Rezervasyon</span></div><div class="stx-k blue"><span class="stx-ki">${rzi('users', 18)}</span><b class="num">${ppl}</b><span class="stx-kl">Kişi${TABLES.length ? ' · %' + full : ''}</span></div><div class="stx-k blue"><span class="stx-ki">${rzi('check', 18)}</span><b class="num">${came}/${L.length}</b><span class="stx-kl">Gelen</span></div></div>`;
};
function rzNotif() {
  const nt = typeof Notification !== 'undefined'; const on = !!RCFG.notif && nt && Notification.permission === 'granted';
  const tm = addDays(REF_ISO, 1); const tl = RESV.filter((r) => r.date === tm && rzActive(r) && r.phone);
  const sw = `<label class="sz-sw"><input type="checkbox" data-ch="rznotif"${on ? ' checked' : ''}><span class="sz-tr"></span><em class="sr-only">Bildirimler</em></label>`;
  return `<section class="rz-card"><div class="rz-nt"><span class="rz-ic2">${rzi('bell', 20)}</span><div class="grow"><b>Rezervasyon bildirimi</b><span>${on ? 'Misafir gelmeden 30 dk önce haber veririm (uygulama açıkken).' : nt ? 'Açınca misafir gelmeden 30 dk önce haber veririm.' : 'Bu tarayıcı bildirim desteklemiyor.'}</span></div>${nt ? sw : ''}</div>
  ${tl.length ? `<div class="rz-rem"><p><b>Yarın için ${tl.length} hatırlatma</b> gönder, gelmeyenler azalır.</p>${tl.slice(0, 4).map((r) => `<div class="rz-rr"><span><b>${esc(r.time)}</b> ${esc(r.name)} · ${r.n}</span><a class="rz-wa" href="${rzWa(r, rzMsg(r, 'hat'))}" target="_blank" rel="noopener">${rzi('wa', 15)} Hatırlat</a></div>`).join('')}${tl.length > 4 ? `<p class="small muted">+${tl.length - 4} kişi daha, yarının gününe geçip gönderebilirsin.</p>` : ''}</div>` : ''}</section>`;
}
rzListe = function () {
  const d = S.rzDate; const L = RESV.filter((r) => r.date === d).sort((a, b) => (a.time < b.time ? -1 : 1)); const act = L.filter(rzActive); const rest = L.filter((r) => !rzActive(r)); const ins = rzInsights(d); const heat = rzHeat(d);
  const today = d === REF_ISO; const now = new Date().getHours() * 60 + new Date().getMinutes();
  const bars = heat.length ? `<section class="rz-card"><div class="rz-ch"><b>Doluluk</b><span>masa kapasitesine göre</span></div><div class="rz-hb">${heat.map((h) => `<div title="${h.t} %${Math.round(h.p * 100)}"><i style="height:${Math.max(4, Math.round(Math.sqrt(h.p) * 54))}px;background:${h.p >= 0.8 ? 'var(--nar)' : h.p >= 0.5 ? '#E3A21A' : 'var(--cini)'};opacity:${h.p ? 1 : 0.25}"></i></div>`).join('')}</div><div class="rz-hl"><span>${esc(heat[0].t)}</span><span>${esc(fromMin(RCFG.close * 60))}</span></div></section>` : '';
  const free = heat.filter((h) => h.p < 0.5 && (!today || toMin(h.t) > now)).filter((h, i) => i % 2 === 0).slice(0, 6);
  const freeH = free.length && TABLES.length ? `<div class="rz-free"><span>Müsait saatler</span>${free.map((h) => `<button type="button" data-a="rzat" data-t="${h.t}">${esc(h.t)}</button>`).join('')}</div>` : '';
  const insH = ins.length ? `<section class="rz-card"><div class="rz-ch"><b>Akıllı notlar</b></div>${ins.map((x) => `<div class="rz-note ${x[0]}">${rzi(x[0] === 'info' ? 'clock' : 'bell', 18)}<span>${esc(x[1])}</span></div>`).join('')}</section>` : '';
  const soon = today ? act.filter((r) => r.st === 'onay' && toMin(r.time) - now >= 0 && toMin(r.time) - now <= 60) : [];
  const soonH = soon.length ? `<div class="rz-soon">${rzi('bell', 18)}<span><b>${esc(soon[0].name.split(' ')[0])}</b> ${toMin(soon[0].time) - now} dk sonra geliyor (${soon[0].n} kişi${soon[0].tids.length ? ', masa ' + esc(rzNames(soon[0].tids)) : ''})${soon.length > 1 ? ` · +${soon.length - 1} kişi daha` : ''}</span></div>` : '';
  let rail = ''; if (act.length) { const groups = {}; act.forEach((r) => { (groups[r.time.slice(0, 2)] = groups[r.time.slice(0, 2)] || []).push(r); }); let nowDone = !today;
    rail = `<div class="rz-rail">${Object.keys(groups).sort().map((h) => { let mark = ''; if (!nowDone && now < (+h) * 60 + 60) { nowDone = true; mark = `<div class="rz-now"><i></i><span>Şimdi ${fromMin(now)}</span></div>`; } return `${mark}<div class="rz-hr"><div class="rz-ht">${h}:00</div><div class="rz-hc">${groups[h].map((r) => `<div class="rz-it st-${r.st}">${rzCard(r)}</div>`).join('')}</div></div>`; }).join('')}</div>`; }
  const empty = `<section class="rz-card rz-empty">${rzi('cal', 34)}<b>${today ? 'Bugün' : 'Bu gün'} için rezervasyon yok</b><span>${TABLES.length ? 'Müsait saatlerden birine dokunarak hızlıca ekleyebilirsin.' : 'Önce Masalar düğmesinden masalarını ekle.'}</span><button class="rz-new" data-a="rznew">${rzi('plus', 18)}<span>Rezervasyon ekle</span></button></section>`;
  return `${soonH}${insH}${act.length ? '' : empty}${freeH}${rail}${rest.length ? `<p class="lbl">Kapanan</p>${rest.map(rzCard).join('')}` : ''}${bars}${rzNotif()}`;
};
H.rzcal = () => { S.rzCal = !S.rzCal; S.rzMonth = rzMon(S.rzDate); render(); };
H.rzmon = (el) => { S.rzMonth = rzMonAdd(S.rzMonth || rzMon(S.rzDate), +el.dataset.n); render(); };
H.rzstep = (el) => { S.rzDate = addDays(S.rzDate, +el.dataset.n); S.rzMonth = rzMon(S.rzDate); render(); };
const rzdayV62 = H.rzday; H.rzday = (el) => { S.rzDate = el.dataset.d; S.rzMonth = rzMon(S.rzDate); S.rzCal = false; render(); };
H.rzat = (el) => { H.rznew(); if (S.modal) S.modal.time = el.dataset.t; renderModal(); };
const _och62 = onChange;
onChange = function (e) {
  const el = e.target;
  if (el && el.dataset && el.dataset.ch === 'rznotif') {
    if (el.checked) { Notification.requestPermission().then((p) => { RCFG.notif = p === 'granted'; if (p !== 'granted') toast('Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsin.', 'warn'); else { toast('Bildirimler açıldı.'); try { new Notification('Kais', { body: 'Rezervasyon bildirimleri açık.' }); } catch (x) {} } pSched && pSched(); render(); }); }
    else { RCFG.notif = false; pSched && pSched(); render(); }
    return;
  }
  return _och62(e);
};
if (!window.__rzTimer) { window.__rzTimer = setInterval(() => { try {
  if (!RCFG.notif || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const now = new Date(); const m = now.getHours() * 60 + now.getMinutes(); const iso = REF_ISO; window.__rzSent = window.__rzSent || {};
  RESV.filter((r) => r.date === iso && r.st === 'onay').forEach((r) => { const dt = toMin(r.time) - m; if (dt <= 30 && dt >= 0 && !window.__rzSent[r.id]) { window.__rzSent[r.id] = 1; try { new Notification('Rezervasyon yaklaşıyor', { body: r.name + ' · ' + r.n + ' kişi · ' + r.time + (dt ? ' (' + dt + ' dk sonra)' : '') }); } catch (x) {} } });
} catch (e) {} }, 60000); }

/* v63: dönem değişince "kapalı" durumunu sıfırla */
{ const cp = H.closeperiod; H.closeperiod = function () { S.closedFor = PERIOD; return cp.apply(this, arguments); };
  const rr = render; render = function () { if (S.closed && S.closedFor && S.closedFor !== PERIOD) S.closed = false; return rr.apply(this, arguments); }; }

/* v64: giriş sayfasında hızlı panel geçişleri (deneme) */
const _lgHTML64 = loginHTML;
loginHTML = function () {
  let h = _lgHTML64(); if (!sbOK()) return h; const tab = S.lgTab || 'own';
  if (tab === 'emp' && !(SBS.user && ID.mems && ID.mems.length > 1 && !ID.active)) {
    const roles = [['mudur', 'Müdür'], ['muhasebeci', 'Muhasebeci'], ['calisan', 'Çalışan'], ['sup', 'Toptancı']];
    const chips = `<div class="lx-rq"><p>Panele hızlı geç (deneme)</p><div>${roles.map((r) => `<button type="button" data-a="lgrole" data-v="${r[0]}">${r[1]}</button>`).join('')}</div></div>`;
    h = h.replace(/(<div class="lx-tabs"[\s\S]*?<\/div>)/, '$1' + chips);
  }
  const sup = `<a class="lx-supq" href="/tedarikci/"><span class="grow"><b>Toptancı mısın?</b><em>Toptancı paneline git</em></span>${LXI.arrow}</a>`;
  return h.replace(/<\/div><\/section><\/div>$/, sup + '</div></section></div>');
};
H.lgrole = (el) => { if (el.dataset.v === 'sup') { location.href = '/tedarikci/?demo=1'; return; } const u = USERS.find((x) => x.role === el.dataset.v); if (!u) return; loginAs(u); toast('Deneme paneli açıldı. Bu ekranda kayıtlı veri yok.'); };
H.lgtab = (function (prev) { return function (el) { if (el.dataset.v === 'sup' && sbOK() && typeof location !== 'undefined' && /^http/.test(location.protocol)) { location.href = '/tedarikci/'; return; } return prev(el); }; })(_lgtab44);
if (typeof window !== 'undefined') window.addEventListener('pageshow', (e) => { if (e.persisted) { try { render(); } catch (x) {} } });

/* v66: Müdür Bugün sayfası yeni tasarım + Ayarlar'da veri sıfırlama */
const MGI = { users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 14.5c2.8 0 5 1.8 5 4.5"/>', cup: '<path d="M5 8h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4zM16 9h2a2 2 0 010 4h-2M8 3v2M12 3v2"/>', check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>', box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>', mega: '<path d="M4 10v4l10 4V6zM14 8.5a3.5 3.5 0 010 7M6 14.5V19"/>', cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', team: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>', r: '<path d="M9 5l7 7-7 7"/>' };
const mgi = (k, n) => `<svg viewBox="0 0 24 24" width="${n || 18}" height="${n || 18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MGI[k]}</svg>`;
const bugunMudurV66 = bugunMudur;
bugunMudur = function () {
  let h = bugunMudurV66(); if (!/Bugün ekipte durum/.test(h)) return h;
  const u = S.user; const hr = new Date().getHours(); const hello = hr < 6 ? 'İyi geceler' : hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : 'İyi akşamlar';
  const first = String(u.name || '').split(' ')[0] || '';
  const cnt = (s) => EMP_IDS.filter((id) => ATT[id] && ATT[id].state === s && !(s === 'pending' && ATT[id].fix)).length; const tot = EMP_IDS.length;
  const todos = (h.match(/<button class="todo"[\s\S]*?<\/button>/g) || []);
  const isAnn = (t) => /data-v="duyuru"/.test(t); const main = todos.filter((t) => !isAnn(t));
  const people = (h.match(/<div class="emp">[\s\S]*?(?=<div class="emp">|<\/div>\s*<div class="stack">|$)/g) || []);
  const rows = []; const rx = /<div class="emp">(<span class="avatar"[^>]*>[^<]*<\/span>)<div class="grow"><b[^>]*>([^<]*)<\/b><div class="small muted">([^<]*)<\/div><\/div><span class="pill ([^"]*)">([^<]*)<\/span><div class="meta">([^<]*)<\/div>(<div class="act">[\s\S]*?<\/div>)?<\/div>/g; let m;
  while ((m = rx.exec(h))) { const st = { 'p-ok': 'on', 'p-info': 'brk', 'p-warn': 'wait', 'p-mute': 'off' }[m[4]] || 'off'; const meta = m[6].split(' · ').map((x) => x.trim()).filter(Boolean);
    rows.push(`<div class="mg-p st-${st}"><div class="mg-pt"><span class="mg-av">${m[1]}<i></i></span><div class="grow"><b>${m[2]}</b><span>${m[3]}</span></div><span class="pill ${m[4]}">${m[5]}</span></div>${meta.length ? `<div class="mg-mt">${meta.map((x) => `<span class="${/geç girdi/.test(x) || Number((/Mola (\d+)/.exec(x) || [])[1]) > 20 ? 'w' : ''}">${x}</span>`).join('')}</div>` : ''}${m[7] ? m[7].replace('class="act"', 'class="act mg-act"') : ''}</div>`); }
  const kp = (ico, tone, val, lab, on) => `<div class="stx-k ${tone}${on ? ' on' : ''}"><span class="stx-ki">${mgi(ico, 18)}</span><b class="num">${val}</b><span class="stx-kl">${lab}</span></div>`;
  const ord = (r) => ({ wait: 0, brk: 1, on: 2, off: 3 }[(/st-(\w+)/.exec(r) || [])[1]] ?? 3); rows.sort((x, y) => ord(x) - ord(y));
  const kpis = `<div class="stx-ks">${kp('users', 'blue', cnt('working') + '/' + tot, 'Çalışıyor')}${kp('cup', 'amber', cnt('break'), 'Molada', cnt('break') > 0)}${kp('check', 'red', cnt('pending'), 'Onay bekliyor', cnt('pending') > 0)}</div>`;
  const taskCard = main.length ? `<section class="mg-card"><div class="mg-ch"><b>Dikkat edilecekler</b><span class="mg-n">${main.length}</span></div><div class="mg-tl">${main.join('')}</div></section>` : '';
  const quick = `<div class="mg-q"><button type="button" data-a="nav" data-v="duyuru">${mgi('mega')}<span>Duyuru</span></button><button type="button" data-a="nav" data-v="stok">${mgi('box')}<span>Stok</span></button><button type="button" data-a="nav" data-v="rezerv">${mgi('cal')}<span>Rezervasyon</span></button><button type="button" data-a="nav" data-v="ekip">${mgi('team')}<span>Ekip</span></button></div>`;
  const team = `<section class="mg-card"><div class="mg-ch"><div><b>Ekip durumu</b><span class="mg-sub">${rows.length ? rows.length + ' kişi' : ''}</span></div><button type="button" class="mg-lnk" data-a="nav" data-v="ekip">Tümü ${mgi('r', 14)}</button></div>${rows.length ? rows.join('') : '<p class="sz-empty">Henüz ekipte kimse yok. Giriş kodunu Ekip sayfasından paylaş.</p>'}</section>`;
  const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  return `<div class="mg"><div class="mg-hi"><h2>${hello}${first ? ', ' + esc(first) : ''}</h2><p>${esc(date)}</p></div><div class="stack-lg">${kpis}${quick}${taskCard}${team}</div></div>`;
};
/* v68: Müdür Bugün, etkileşimli ve akıllı kutular */
{const st=document.createElement('style'); st.textContent=`
button.stx-k{font:inherit;text-align:left;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;align-items:flex-start}
button.stx-k:hover{transform:translateY(-2px);box-shadow:0 10px 22px -10px rgba(13,40,80,.28)}button.stx-k:active{transform:scale(.98)}
button.stx-k.sel{border-color:var(--cini);box-shadow:0 0 0 2px rgba(26,86,160,.18),0 10px 22px -12px rgba(13,40,80,.3)}
.mg-ks{font-size:12px;color:var(--ink-2);margin-top:2px;line-height:1.3;white-space:normal}.mg-ks.w{color:#B26B00;font-weight:600}.mg-ks.r{color:var(--nar);font-weight:600}
.mg-bar{height:5px;border-radius:9px;background:#E8EEF7;margin-top:7px;width:100%;overflow:hidden}.mg-bar i{display:block;height:100%;background:linear-gradient(90deg,#2F9E5F,#5CC48A);border-radius:9px}
.mg-q button{position:relative;transition:transform .15s,box-shadow .15s}.mg-q button:hover{transform:translateY(-2px);box-shadow:0 10px 22px -12px rgba(13,40,80,.28)}
.mg-qb{position:absolute;top:6px;right:8px;min-width:20px;height:20px;border-radius:99px;background:var(--nar);color:#fff;font:700 11.5px system-ui;display:grid;place-items:center;padding:0 6px}
.mg-fl{border:0;background:#EAF2FD;color:var(--cini);font:600 12.5px inherit;font-family:inherit;border-radius:99px;padding:5px 11px;margin-right:6px}
.mg-none{display:none;padding:18px 4px 14px;text-align:center;color:var(--ink-2);font-size:13.5px}
.mg[data-f=on] .mg-p:not(.st-on),.mg[data-f=brk] .mg-p:not(.st-brk),.mg[data-f=wait] .mg-p:not(.st-wait){display:none}
.mg[data-f=on]:not(:has(.st-on)) .mg-none,.mg[data-f=brk]:not(:has(.st-brk)) .mg-none,.mg[data-f=wait]:not(:has(.st-wait)) .mg-none{display:block}
.mg-ts{max-height:500px;overflow-y:auto;margin:0 -8px;padding:0 8px;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}.mg-more{text-align:center;font-size:12px;color:var(--ink-2);padding:8px 0 6px;border-top:1px dashed #E1E8F2}
.mg-sb{padding:2px 0 12px}.mg-sbb{display:flex;height:8px;border-radius:9px;overflow:hidden;gap:2px;background:#EEF2F8}.mg-sbb i{display:block;min-width:6px}.mg-sbl{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;font-size:12px;color:var(--ink-2)}.mg-sbl span{display:inline-flex;align-items:center;gap:5px}.mg-sbl i{width:8px;height:8px;border-radius:50%}
.mg-att{border-color:#F3DDB0;background:linear-gradient(180deg,#fff,#FFFCF6)}.mg-ap{padding:12px 0;border-top:1px solid #F3E7CC;display:flex;flex-direction:column;gap:8px}.mg-ap:first-of-type{border-top:0;padding-top:4px}
.mg-aph{display:flex;align-items:center;gap:12px}.mg-aph b{display:block;font-size:15px}.mg-aph .grow>span{display:block;font-size:12.5px;color:var(--ink-2)}.mg-aph em{font:700 11.5px system-ui;font-style:normal;background:#FDF1DC;color:#B26B00;border-radius:99px;padding:4px 10px;white-space:nowrap}
.mg-apn{margin:0 0 0 50px;font-size:13px;color:var(--ink)}.mg-ap .mg-mt,.mg-ap .mg-act{margin-left:50px}.mg-mt span.w{background:#FDF1DC;color:#B26B00}.mg-att .mg-tl{margin-top:4px}
.mg-tl .todo{transition:background .15s}.mg-tl .todo:hover{background:#F5F8FD!important}
`; document.head.appendChild(st);}
const bugunMudurV67 = bugunMudur;
bugunMudur = function () {
  let h = bugunMudurV67(); if (!/class="mg"/.test(h)) return h;
  const f = S.mgf || ''; const tot = EMP_IDS.length; const cnt = (x) => EMP_IDS.filter((id) => ATT[id] && ATT[id].state === x && !(x === 'pending' && ATT[id].fix)).length; const nfix = EMP_IDS.filter((id) => ATT[id] && ATT[id].state === 'pending' && ATT[id].fix).length;
  const nw = cnt('working'), nb = cnt('break'), np = cnt('pending'), noff = tot - nw - nb - np;
  const late = (h.match(/dk geç girdi/g) || []).length; const bm = [...h.matchAll(/st-brk">[\s\S]*?Mola (\d+) dk/g)].map((m) => Number(m[1])); const longB = bm.length ? Math.max(...bm) : 0;
  const sub = { on: [noff > 0 ? noff + ' kişi henüz girmedi' : (tot ? 'Herkes burada' : ''), noff > 0 ? 'w' : ''], brk: [nb ? (longB ? 'En uzun mola ' + longB + ' dk' : 'Şu an molada') : 'Kimse molada değil', longB >= 30 ? 'w' : ''], wait: [np ? 'Karar bekliyor, dokun ve gör' : 'Bekleyen yok', np ? 'r' : ''] };
  const keys = ['on', 'brk', 'wait']; let i = 0;
  h = h.replace(/<div class="stx-k (blue|amber|red)( on)?">([\s\S]*?)<\/div>/g, (m, tone, on, inner) => { const k = keys[i++] || 'on'; const bar = k === 'on' && tot ? `<span class="mg-bar"><i style="width:${Math.round(nw / tot * 100)}%"></i></span>` : '';
    return `<button type="button" class="stx-k ${tone}${on ? ' on' : ''}${f === k ? ' sel' : ''}" data-a="mgf" data-v="${k}" aria-pressed="${f === k}">${inner}<span class="mg-ks ${sub[k][1]}">${sub[k][0]}</span>${bar}</button>`; });
  const cr = Number(((h.match(/(\d+) ürün kritik/) || [])[1]) || 0), lv = (h.match(/izin talebi bekliyor/g) || []).length;
  h = h.replace(/(<button type="button" data-a="nav" data-v="stok">)/, '$1' + (cr ? `<i class="mg-qb">${cr}</i>` : '')).replace(/(<button type="button" data-a="nav" data-v="ekip">)/, '$1' + (np + lv ? `<i class="mg-qb">${np + lv}</i>` : ''));
  h = h.replace('<div class="mg">', `<div class="mg" data-f="${f}">`);
  h = h.replace('<button type="button" class="mg-lnk" data-a="nav" data-v="ekip">', (f ? `<button type="button" class="mg-fl" data-a="mgf" data-v="${f}">${{ on: 'Çalışıyor', brk: 'Molada', wait: 'Onay bekliyor' }[f]} · temizle ✕</button>` : '') + '<button type="button" class="mg-lnk" data-a="nav" data-v="ekip">');
  /* ekip kartı: durum çubuğu + en fazla 5 satır, sonrası kaydırma */
  const rowsN = (h.match(/class="mg-p st-/g) || []).length; const seg = [['on', nw, '#2F9E5F', 'çalışıyor'], ['brk', nb, '#3B82D6', 'molada'], ['wait', np, '#E3A21A', 'onayda'], ['fix', nfix, '#D9534F', 'düzeltmede'], ['off', Math.max(0, tot - nw - nb - np - nfix), '#C5CEDB', 'dışarıda']].filter((x) => x[1] > 0);
  const sbar = tot ? `<div class="mg-sb"><div class="mg-sbb">${seg.map((x) => `<i style="flex:${x[1]};background:${x[2]}"></i>`).join('')}</div><div class="mg-sbl">${seg.map((x) => `<span><i style="background:${x[2]}"></i>${x[1]} ${x[3]}</span>`).join('')}</div></div>` : '';
  h = h.replace(/(data-v="ekip">Tümü[\s\S]*?<\/button><\/div>)/, '$1' + sbar + '<div class="mg-ts">');
  h = h.replace(/(<\/div>)(<\/section><\/div><\/div>)$/, `$1</div>${rowsN > 5 ? `<div class="mg-more">↓ ${rowsN} kişi var, kaydırarak gör</div>` : ''}<p class="mg-none">Bu durumda kimse yok.</p>$2`);
  if (f !== 'wait') h = h.replace(/<div class="act mg-act">[\s\S]*?<\/div>(?=<\/div>)/g, '').replace(/<div class="mg-ap/g, '<div class="mg-ap');
  /* Dikkat edilecekler: onay isteyenler en üstte, cevaplananlar görünmez */
  const secRe = /<section class="mg-card"><div class="mg-ch"><b>Dikkat edilecekler<\/b>[\s\S]*?<\/section>/; const sec = (h.match(secRe) || [''])[0]; let todos = sec ? (sec.match(/<button class="todo"[\s\S]*?<\/button>/g) || []) : [];
  todos = todos.filter((t) => !/mola dönüş/i.test(t)); const pend = EMP_IDS.filter((id) => ATT[id] && ATT[id].state === 'pending' && !ATT[id].fix);
  const ap = pend.map((id) => { const a = ATT[id], u = byId(id); const chips = [`Giriş ${a.inAt || '—'}`, `Mola ${a.breakMin} dk`].concat(a.late ? [`${a.late} dk geç girdi`] : []);
    return `<div class="mg-ap"><div class="mg-aph">${avatar(u, 38)}<div class="grow"><b>${esc(u.name)}</b><span>Mola dönüşü onay bekliyor</span></div><em>Karar bekliyor</em></div>${a.note ? `<p class="mg-apn">${esc(a.note)}</p>` : ''}<div class="mg-mt">${chips.map((x) => `<span class="${/geç girdi/.test(x) || Number((/Mola (\d+)/.exec(x) || [])[1]) > 20 ? 'w' : ''}">${x}</span>`).join('')}</div><div class="act mg-act"><button class="btn sm" data-a="attok" data-id="${id}">Onayla</button><button class="btn sm sec" data-a="attfix" data-id="${id}">Düzeltme iste</button></div></div>`; }).join('');
  const tot2 = pend.length + todos.length; h = h.replace(secRe, '');
  if (tot2) h = h.replace(/(<div class="mg-hi">[\s\S]*?<\/div>)/, '$1' + `<section class="mg-card mg-att"><div class="mg-ch"><b>Dikkat edilecekler</b><span class="mg-n">${tot2}</span></div>${ap}${todos.length ? `<div class="mg-tl">${todos.join('')}</div>` : ''}</section>`);
  return h;
};
H.mgf = (el) => { S.mgf = S.mgf === el.dataset.v ? '' : el.dataset.v; render(); };
/* ===== v70: Günün özeti, ayrıntılı maddeler + doğrudan Kais'e sor ===== */
{const st=document.createElement('style'); st.textContent=`
.kz{background:linear-gradient(135deg,#EAF2FD 0,#F6FAFF 55%,#FFFFFF);border:1px solid #D3E3F8;border-radius:20px;padding:14px 14px 12px;box-shadow:0 4px 16px rgba(30,90,170,.08)}
.kz-h{display:flex;align-items:center;gap:12px}.kz-i{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#4F8FE8,#2B67C4);color:#fff;display:grid;place-items:center;flex:none}
.kz-t{flex:1;min-width:0}.kz-t h3{margin:0;font-size:18px;letter-spacing:-.2px}.kz-t p{margin:2px 0 0;font-size:13px;color:var(--ink-2);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.kz-c{font:700 11.5px system-ui;border-radius:99px;padding:3px 9px}.kz-c.warn{background:#FDF1DC;color:#B26B00}.kz-c.bad{background:#FDECEC;color:#C0392B}.kz-c.ok{background:#E3F5EA;color:#1E8E55}
.kz-r{border:0;background:#fff;border:1px solid #D3E3F8;color:var(--cini);width:36px;height:36px;border-radius:11px;display:grid;place-items:center;flex:none}
.kz-l{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.kz-it{display:flex;align-items:stretch;gap:6px}.kz-go{flex:1;min-width:0;display:flex;align-items:center;gap:11px;text-align:left;font:inherit;background:#fff;border:1px solid #E1E8F2;border-radius:14px;padding:10px 12px;cursor:pointer;transition:transform .15s,box-shadow .15s}
div.kz-go{cursor:default}.kz-go:is(button):hover{transform:translateY(-1px);box-shadow:0 8px 18px -12px rgba(13,40,80,.35)}
.kz-d{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:none}.t-warn .kz-d{background:#FDF1DC;color:#B26B00}.t-bad .kz-d{background:#FDECEC;color:#C0392B}.t-ok .kz-d{background:#E3F5EA;color:#1E8E55}.t-info .kz-d{background:#E6EEFA;color:#2B67C4}
.kz-x{flex:1;min-width:0}.kz-x b{display:block;font-size:14.5px;line-height:1.25}.kz-x span{display:block;font-size:12.5px;color:var(--ink-2);margin-top:1px;line-height:1.35}
.kz-q{flex:none;width:40px;border:1px solid #D3E3F8;background:#F2F7FE;color:var(--cini);border-radius:14px;display:grid;place-items:center;cursor:pointer}.kz-q:hover{background:#E4EEFC}
.kz-ai{margin-top:10px;background:#fff;border:1px dashed #BFD3F0;border-radius:14px;padding:10px 12px;font-size:13.5px;line-height:1.45}.kz-ai>b{display:flex;gap:6px;align-items:center;color:var(--cini);font-size:12.5px;margin-bottom:4px}.kz-ai .cl{max-height:4.4em;overflow:hidden}.kz-ai button{border:0;background:none;color:var(--cini);font-weight:700;font-size:12.5px;padding:4px 0 0}
.kz-a{display:flex;gap:8px;margin-top:12px;background:#fff;border:1.5px solid #CFE0F7;border-radius:16px;padding:5px 5px 5px 14px;align-items:center}.kz-a:focus-within{border-color:var(--cini);box-shadow:0 0 0 3px rgba(26,86,160,.12)}
.kz-a input{flex:1;min-width:0;border:0!important;outline:0;background:transparent!important;font:inherit;font-size:14.5px;box-shadow:none!important;padding:8px 0;min-height:0!important}.kz-a button{border:0;background:var(--cini);color:#fff;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none}
.kz-s{display:flex;gap:6px;overflow-x:auto;margin-top:8px;padding-bottom:7px;scrollbar-width:thin;scrollbar-color:#BFD3F0 transparent;scroll-snap-type:x proximity}.kz-s::-webkit-scrollbar{height:6px}.kz-s::-webkit-scrollbar-thumb{background:#BFD3F0;border-radius:9px}.kz-s button{scroll-snap-align:start}.kz-s button{flex:none;border:1px solid #D3E3F8;background:#fff;color:var(--ink);border-radius:99px;padding:6px 12px;font:600 12.5px inherit;font-family:inherit;white-space:nowrap}.kz-s button:hover{background:#EAF2FD}
`; document.head.appendChild(st);}
function kzItems(scope) {
  const it = []; const R = S.user.role; const add = (tone, ico, t, d, go, q) => it.push({ tone, ico, t, d, go, q }); const nm = (id) => (byId(id).name || '').split(' ')[0];
  const pa = pendingAtt(), nr = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status));
  if (scope === 'muh') {
    const mu = RECEIPTS.filter((f) => f.status === 'musavirde'), dz = RECEIPTS.filter((f) => f.status === 'duzeltme'), wn = (typeof waitingNotes === 'function' ? waitingNotes() : []);
    add(mu.length ? 'warn' : 'ok', 'receipt', mu.length ? `${mu.length} belge işlenmeyi bekliyor` : 'İşlenecek belge yok', mu.length ? 'Onaylı fişleri defterine işle, belgesi eksik olanı patrona geri gönder.' : 'Patron onaylayıp gönderdikçe burada görünür.', 'belgeler', 'Hangi belgeleri önce işlemeliyim?');
    if (dz.length) add('info', 'receipt', `${dz.length} belge düzeltme bekliyor`, 'Patrona düzeltme için geri gönderildi, cevap gelince tekrar düşer.', 'belgeler', 'Düzeltme bekleyen belgelerde ne eksik?');
    if (wn.length) add('info', 'chat', `${wn.length} notuna cevap bekleniyor`, 'Patrona yazdığın notlar henüz cevaplanmadı.', 'belgeler', 'Cevap bekleyen notlarım neler?');
    const ds = debtSoon(); if (ds.length) add('warn', 'wallet', `${ds.length} ödeme yaklaşıyor`, ds.slice(0, 2).map((d) => `${d.who} ${fmt0(d.amt)}`).join(' · '), 'borc', 'Yaklaşan ödemeleri nasıl planlamalı?');
    add('info', 'file', 'KDV ve dönem özeti hazır', 'Dönem sekmesinde gelir, gider ve KDV tahminini görebilirsin.', 'donem', 'Bu dönemin KDV tahmini nedir ve neden böyle?');
  } else if (scope === 'ekip') {
    if (nr.length) add('warn', 'clock', `${nr.length} izin talebi karar bekliyor`, nr.slice(0, 2).map((r) => `${nm(r.uid)}: ${r.txt}`).join(' · '), 'ekip', 'Bekleyen izin taleplerini onaylarsam vardiya nasıl etkilenir?');
    if (pa.length) add('warn', 'clock', `${pa.length} mola dönüşü onay bekliyor`, pa.slice(0, 2).map((id) => `${nm(id)}: ${ATT[id].note || 'döndüm demedi'}`).join(' · '), 'ekip', 'Mola dönüşü onay bekleyenlere nasıl yaklaşmalıyım?');
    const inn = EMP_IDS.filter((id) => ATT[id] && ['working', 'break', 'pending'].includes(ATT[id].state)).length, br = EMP_IDS.filter((id) => ATT[id] && ATT[id].state === 'break').length;
    add(inn ? 'ok' : 'info', 'users', inn ? `Bugün ${inn}/${EMP_IDS.length} çalışan giriş yaptı` : 'Bugün giriş yapan çalışan yok', br ? `${br} kişi molada.` : (EMP_IDS.length - inn > 0 ? `${EMP_IDS.length - inn} kişi henüz girmedi.` : 'Herkes burada.'), 'ekip', 'Bugünkü ekip durumunu yorumla.');
    const late = EMP_IDS.filter((id) => EMPDATA[id] && EMPDATA[id].late >= 2).sort((x, y) => EMPDATA[y].late - EMPDATA[x].late); if (late.length) add('warn', 'clock', `${nm(late[0])} bu ay ${EMPDATA[late[0]].late} kez geç kaldı`, late.length > 1 ? `${late.length - 1} kişi daha tekrar geç kalıyor.` : 'Geç kalma tekrar ediyor, kısa bir konuşma işe yarayabilir.', 'ekip', `${nm(late[0])} için geç kalma konusunda ne yapmalıyım?`);
    const nc = EMP_IDS.filter((id) => PROFILES[id] && !PROFILES[id].contract); if (nc.length) add('warn', 'file', `${nc.length} çalışanın iş sözleşmesi eksik`, nc.slice(0, 2).map(nm).join(', '), 'ekip', 'Eksik iş sözleşmeleri için ne yapmalıyım?');
  } else {
    const low = lowStock(); const isP = R === 'patron';
    if (low.length) add('warn', 'box', `${low.length} ürün kritik seviyede`, low.slice(0, 3).map((x) => `${x.name.split(' (')[0]} ${x.qty}/${x.min}`).join(' · ') + (low.length > 3 ? ` ve ${low.length - 3} ürün daha` : ''), 'stok', 'Kritik stoktaki ürünlerden ne kadar sipariş vermeliyim?'); else add('ok', 'box', 'Stok durumu sağlıklı', 'Alt sınırın altında ürün yok.', 'stok', 'Stoğum nasıl, dikkat etmem gereken bir şey var mı?');
    if (nr.length) add('warn', 'clock', `${nr.length} izin talebi karar bekliyor`, nr.slice(0, 2).map((r) => `${nm(r.uid)}: ${r.txt}`).join(' · '), 'ekip', 'Bekleyen izin talepleri için ne önerirsin?');
    if (pa.length) add('warn', 'clock', `${pa.length} mola dönüşü onay bekliyor`, pa.slice(0, 2).map((id) => `${nm(id)}: ${ATT[id].note || 'döndüm demedi'}`).join(' · '), 'ekip', 'Mola dönüşü onayı için ne yapmalıyım?');
    if (isP) { const pr = pendingReceipts(); if (pr.length) add('warn', 'receipt', `${pr.length} masraf fişi onayını bekliyor`, 'Onaylarsan muhasebeciye gider.', 'muhasebe', 'Onay bekleyen fişlerde dikkat etmem gereken bir şey var mı?'); const ds = debtSoon(); add(ds.length ? 'warn' : 'ok', 'wallet', ds.length ? `${ds.length} ödeme yaklaşıyor` : 'Yaklaşan ödeme yok', ds.length ? ds.slice(0, 2).map((d) => `${d.who} ${fmt0(d.amt)} · ${daysTo(d.due) <= 0 ? 'bugün ya da geçti' : daysTo(d.due) + ' gün'}`).join(' · ') : 'Vadesi yaklaşan borç görünmüyor.', 'muhasebe', 'Yaklaşan ödemeler için nakit akışım yeter mi?'); }
    const rz = RESV.filter((r) => r.date === REF_ISO && rzActive(r)).sort((x, y) => String(x.time).localeCompare(String(y.time))); if (rz.length) add('info', 'cal', `Bugün ${rz.length} rezervasyon var`, `Sıradaki: ${rz[0].name} ${rz[0].time} · ${rz[0].n} kişi`, 'rezerv', 'Bugünkü rezervasyonlara göre hazırlık önerir misin?');
    const inn = EMP_IDS.filter((id) => ATT[id] && ['working', 'break', 'pending'].includes(ATT[id].state)).length; add(inn ? 'ok' : 'info', 'users', inn ? `${inn}/${EMP_IDS.length} çalışan işbaşında` : 'Henüz kimse giriş yapmadı', EMP_IDS.length - inn > 0 ? `${EMP_IDS.length - inn} kişi henüz girmedi.` : 'Herkes burada.', 'ekip', 'Bugünkü ekip durumunu yorumla.');
    add(SALES.length < 3 ? 'info' : 'ok', 'bars', SALES.length < 3 ? 'Satış yorumu için veri az' : 'Satış verisi güncel', SALES.length < 3 ? 'Kasa verisi ekledikçe Kais satış ve stok yorumu yapar.' : `${SALES.length} satış kaydı değerlendirildi.`, null, 'Satışlarım nasıl gidiyor?');
  }
  const w = { bad: 0, warn: 1, info: 2, ok: 3 }; return it.map((x, i) => [x, i]).sort((a, b) => (w[a[0].tone] - w[b[0].tone]) || (a[1] - b[1])).map((x) => x[0]);
}
function kzCard(scope) {
  const it = kzItems(scope); const nW = it.filter((x) => x.tone === 'warn' || x.tone === 'bad').length;
  const chip = nW ? `<span class="kz-c ${it.some((x) => x.tone === 'bad') ? 'bad' : 'warn'}">${nW} konu dikkat istiyor</span>` : '<span class="kz-c ok">Her şey yolunda</span>';
  const ai = aiReady(); const ico = (k) => ({ box: mgi('box', 18), users: mgi('users', 18), cal: mgi('cal', 18), check: mgi('check', 18) }[k] || ic(k, 18));
  const rows = it.map((x) => { const inner = `<span class="kz-d">${ico(x.ico)}</span><span class="kz-x"><b>${esc(x.t)}</b><span>${esc(x.d)}</span></span>${x.go ? ic('chevron', 16) : ''}`; return `<div class="kz-it t-${x.tone}">${x.go ? `<button type="button" class="kz-go" data-a="nav" data-v="${x.go}">${inner}</button>` : `<div class="kz-go">${inner}</div>`}<button type="button" class="kz-q" data-a="kzq" data-q="${esc(x.q)}" aria-label="Kais'e sor">${ic('chat', 18)}</button></div>`; }).join('');
  const txt = (typeof BR !== 'undefined' && BR.text) ? BR.text : ''; const long = txt.length > 220;
  const brief = txt ? `<div class="kz-ai"><b>${ic('sparkle', 14)} Kais'in yorumu</b><div class="${long && !S.gunOpen ? 'cl' : ''}" style="white-space:pre-wrap">${esc(txt).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')}</div>${long ? `<button type="button" data-a="gundet">${S.gunOpen ? 'Daha az göster' : 'Devamını oku'}</button>` : ''}</div>` : '';
  const sug = [...new Set(it.filter((x) => x.tone !== 'ok').slice(0, 2).map((x) => x.q).concat(['Bugün önce neye bakmalıyım?']))].slice(0, 3);
  const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  return `<div class="kz"><div class="kz-h"><span class="kz-i">${ic('sparkle', 22)}</span><div class="kz-t"><h3>Günün özeti</h3><p>${esc(date)} ${chip}</p></div><button type="button" class="kz-r" data-a="gunyen" aria-label="Yenile">${ic('refresh', 18)}</button></div><div class="kz-l">${rows}</div>${brief}<div class="kz-a"><input id="kz-in" type="text" placeholder="Kais'e sor…" autocomplete="off" enterkeyhint="send"><button type="button" data-a="kzsend" aria-label="Gönder">${ic('arrow', 18)}</button></div><div class="kz-s">${sug.map((q) => `<button type="button" data-a="kzq" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`;
}
function kzAsk(t) { t = String(t || '').trim(); if (!t) { const e = document.getElementById('kz-in'); if (e) e.focus(); return; } if (!aiReady() || !AI_ROLES.includes(S.user.role)) { toast('Kais AI deneme modunda kapalı. Bulut hesabıyla giriş yapınca sorun yanıtlanır.', 'warn'); return; } S.view = 'kaisai'; AIC.draft = ''; window.scrollTo && window.scrollTo(0, 0); aiAsk(t); }
H.kzq = (el) => kzAsk(el.dataset.q); H.kzsend = () => kzAsk((document.getElementById('kz-in') || {}).value);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'kz-in') { e.preventDefault(); H.kzsend(); } });
{const _br70 = brCard; brCard = function () { if (!S.user || !['patron', 'mudur'].includes(S.user.role)) return ''; if (aiReady()) { try { _br70(); } catch (e) {} } return kzCard('bugun'); };}
ekipGun = function () { return kzCard('ekip'); };
{const _vh70 = viewHTML; viewHTML = function () { const h = _vh70(); if (!S.user || S.user.role !== 'muhasebeci' || S.view !== 'donem' || h.includes('class="kz"')) return h; if (h.includes('<section class="mc-hero">')) return h.replace('<section class="mc-hero">', kzCard('muh') + '<section class="mc-hero">'); return h.includes('<div class="stack-lg">') ? h.replace('<div class="stack-lg">', '<div class="stack-lg">' + kzCard('muh')) : h; }; }
/* ===== v71: Ekip merkezi (çalışan kartları, ayrıntı paneli, izin takvimi, mola ayarları) ===== */
{const st=document.createElement('style'); st.textContent=`
.main:has(.ek){max-width:1360px}
.ek{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}
@media(min-width:1100px){.ek{grid-template-columns:minmax(0,1fr) 380px}}
.ek-main,.ek-side{display:flex;flex-direction:column;gap:16px;min-width:0}
.ek-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.ek-h h2{margin:0;font-size:18px}.ek-h span{font-size:13px;color:var(--ink-2)}
.ek-f{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;margin-bottom:6px;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}.ek-f::-webkit-scrollbar{height:6px}.ek-f::-webkit-scrollbar-thumb{background:#C9D5E6;border-radius:9px}
.ek-f button{flex:none;border:1px solid #E1E8F2;background:#fff;border-radius:99px;padding:7px 13px;font:600 13px inherit;font-family:inherit;color:var(--ink);white-space:nowrap}.ek-f button b{margin-left:4px;color:var(--ink-2)}.ek-f button[aria-pressed=true]{background:var(--cini);border-color:var(--cini);color:#fff}.ek-f button[aria-pressed=true] b{color:#fff}
.ek-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;max-height:600px;overflow-y:auto;padding:2px 6px 4px 2px;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}
.ek-c{background:#fff;border:1px solid #E1E8F2;border-radius:18px;padding:13px;display:flex;flex-direction:column;gap:9px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;box-shadow:0 3px 10px rgba(13,40,80,.04)}.ek-c:hover{transform:translateY(-2px);box-shadow:0 12px 24px -14px rgba(13,40,80,.32);border-color:#CFE0F7}
.ek-ct{display:flex;align-items:center;gap:11px}.ek-ct .av{position:relative;flex:none}.ek-ct .av .avatar{width:44px!important;height:44px!important}.ek-ct .av i{position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;border:2px solid #fff;background:#C5CEDB}
.ek-c.st-working .av i{background:#2F9E5F}.ek-c.st-break .av i{background:#3B82D6}.ek-c.st-pending .av i{background:#E3A21A}.ek-c.st-fix .av i{background:#D9534F}
.ek-ct b{display:block;font-size:15px}.ek-ct .gr{flex:1;min-width:0}.ek-ct .gr span{display:block;font-size:12.5px;color:var(--ink-2)}
.ek-ch{display:flex;flex-wrap:wrap;gap:6px}.ek-ch span{background:#F2F5FA;border-radius:99px;padding:4px 10px;font-size:12px;color:var(--ink-2)}.ek-ch span.w{background:#FDF1DC;color:#B26B00}.ek-ch span.b{background:#E6EEFA;color:#2B67C4}
.ek-cf{display:flex;gap:14px;border-top:1px solid #EDF1F7;padding-top:9px;font-size:12.5px;color:var(--ink-2)}.ek-cf b{color:var(--ink);font-size:13.5px;margin-left:3px}
.ek-c .act{display:flex;gap:8px}.ek-c .act .btn{flex:1;min-height:38px;border-radius:12px;font-size:13px}
.ek-up .row2{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #EDF1F7}.ek-up .row2:first-of-type{border-top:0}.ek-up .row2 b{font-size:14px;display:block}.ek-up .row2 span{font-size:12.5px;color:var(--ink-2)}
.sheet.empw{max-width:760px;max-height:92vh;overflow-y:auto}
.dr-h{display:flex;align-items:center;gap:14px}.dr-h .avatar{width:58px!important;height:58px!important;font-size:20px}.dr-h h2{margin:0;font-size:20px}.dr-h p{margin:2px 0 6px;color:var(--ink-2);font-size:13px}
.dr-tabs{display:flex;gap:6px;overflow-x:auto;margin:12px 0;padding-bottom:6px;scrollbar-width:thin}.dr-tabs button{flex:none;border:1px solid #E1E8F2;background:#fff;border-radius:99px;padding:8px 14px;font:600 13px inherit;font-family:inherit;color:var(--ink)}.dr-tabs button[aria-pressed=true]{background:var(--cini);color:#fff;border-color:var(--cini)}
.dr-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px}.dr-k div{background:#F5F8FD;border-radius:14px;padding:10px 12px}.dr-k span{display:block;font-size:12px;color:var(--ink-2)}.dr-k b{font-size:18px}
.dr-s{border:1px solid #E1E8F2;border-radius:16px;padding:12px 14px;margin-bottom:10px}.dr-s h4{margin:0 0 8px;font-size:14.5px}.dr-r{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid #F0F3F8;font-size:14px}.dr-r:first-of-type{border-top:0}.dr-r span{color:var(--ink-2)}.dr-r small{display:block;color:var(--ink-2);font-size:12px}
.dr-bar{height:8px;border-radius:9px;background:#E8EEF7;overflow:hidden;margin:6px 0}.dr-bar i{display:block;height:100%;background:linear-gradient(90deg,#2F9E5F,#5CC48A);border-radius:9px}
.dr-a{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.dr-a .btn{flex:1;min-width:140px}
.iz-nv{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.iz-nv h2{margin:0;font-size:18px;text-transform:capitalize}.iz-nv button{border:1px solid #E1E8F2;background:#fff;border-radius:12px;width:40px;height:40px;display:grid;place-items:center}
.iz-sc{overflow-x:auto;padding-bottom:8px;scrollbar-width:thin;scrollbar-color:#C9D5E6 transparent}.iz-sc::-webkit-scrollbar{height:7px}.iz-sc::-webkit-scrollbar-thumb{background:#C9D5E6;border-radius:9px}
.iz-gr{display:grid;gap:3px;min-width:max-content;align-items:center}.iz-gr .nm{font:600 13px system-ui;position:sticky;left:0;background:#fff;padding-right:8px;z-index:1;white-space:nowrap}.iz-gr .dh{font:600 11px system-ui;color:var(--ink-2);text-align:center}.iz-gr .dh.we{color:#B3BCC9}.iz-gr .dh.td{color:#fff;background:var(--cini);border-radius:8px}
.iz-gr .c{height:26px;border-radius:7px;background:#F2F5FA;min-width:24px}.iz-gr .c.we{background:#EAEEF5}.iz-gr .c.y{background:#5E9AEA}.iz-gr .c.r{background:#E8A93C}.iz-gr .c.u{background:#9AA7BA}.iz-gr .c.m{background:#9B7BD8}.iz-gr .c.p{background:repeating-linear-gradient(45deg,#BCD3F2 0 4px,#E6EEFA 4px 8px);outline:1px dashed #5E9AEA}.iz-gr .c.t{box-shadow:0 0 0 2px var(--cini) inset}
.iz-lg{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink-2);margin-top:8px}.iz-lg i{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:5px;vertical-align:-2px}
.iz-bal{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}.iz-bal .it{border:1px solid #E1E8F2;border-radius:16px;padding:12px;background:#fff}
.mb-o{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 14px}.mb-o button{border:1px solid #E1E8F2;background:#fff;border-radius:12px;padding:10px 16px;font:700 14px inherit;font-family:inherit;color:var(--ink)}.mb-o button[aria-pressed=true]{background:var(--cini);color:#fff;border-color:var(--cini)}
`; document.head.appendChild(st);}
const brkCfg = () => ({ plan: Number(S.settings.brkPlan) || 15, max: Number(S.settings.brkMax) || 60 });
const ekSt = (id) => { const a = ATT[id] || { state: 'none' }; return a.state === 'pending' && a.fix ? 'fix' : a.state; };
const EK_L = { none: ['p-mute', 'Henüz giriş yok'], working: ['p-ok', 'Çalışıyor'], break: ['p-info', 'Molada'], pending: ['p-warn', 'Onay bekliyor'], fix: ['p-bad', 'Düzeltme bekleniyor'], out: ['p-mute', 'Çıkış yaptı'] };
const ekNow = () => { const n = new Date(); return n.getMonth() * 40 + n.getDate(); };
function ekLeaves(id) { const A = LEAVES.map((x) => ({ uid: x.uid, txt: x.txt, type: x.type, days: x.days, st: 'onayli', note: x.note })).concat(LVREQ.filter((r) => r.status !== 'reddedildi').map((r) => { const e = lrEff(r); return { uid: r.uid, txt: e.txt, type: r.type, days: e.days, st: r.status === 'onayli' ? 'onayli' : 'bekliyor' }; })); return id ? A.filter((x) => x.uid === id) : A; }
const ekRange = (x) => { try { return izOrd(x.txt); } catch (e) { return null; } };
const ekOnLeave = (id) => { const o = ekNow(); return ekLeaves(id).some((x) => x.st === 'onayli' && (() => { const q = ekRange(x); return q && q[0] <= o && o <= q[1]; })()); };
function ekBal(id) { const p = PROFILES[id] || {}; const mm = p.hire ? monthsBetween(p.hire) : 0; const ent = leaveDays(mm, id); const used = LEAVES.filter((x) => x.uid === id && x.type === 'yillik').reduce((a, x) => a + x.days, 0); return { ent, used, left: Math.max(0, ent - used), mm }; }
function ekCard(id) {
  const u = byId(id), a = ATT[id] || { state: 'none', breakMin: 0 }, st = ekSt(id), L = EK_L[st] || EK_L.none, b = ekBal(id), c = brkCfg(), sc = scores().find((x) => x.id === id);
  const chips = [`<span class="${st === 'none' ? '' : 'b'}">Giriş ${a.inAt || '—'}</span>`, `<span class="${a.breakMin > c.max ? 'w' : ''}">Mola ${a.breakMin || 0} dk</span>`].concat(a.late ? [`<span class="w">${a.late} dk geç girdi</span>`] : []).concat(ekOnLeave(id) ? ['<span class="b">Bugün izinli</span>'] : []);
  const act = st === 'pending' ? `<div class="act"><button class="btn sm" data-a="attok" data-id="${id}">Onayla</button><button class="btn sm sec" data-a="attfix" data-id="${id}">Düzeltme iste</button></div>` : '';
  return `<div class="ek-c st-${st}" data-a="empdrw" data-id="${id}" role="button" tabindex="0" aria-label="${esc(u.name)} ayrıntıları"><div class="ek-ct"><span class="av">${avatar(u, 44)}<i></i></span><div class="gr"><b>${esc(u.name)}</b><span>${esc(u.title)}</span></div><span class="pill ${L[0]}">${L[1]}</span></div><div class="ek-ch">${chips.join('')}</div>${act}<div class="ek-cf"><span>Yıllık izin<b>${b.ent ? b.left + ' gün' : '—'}</b></span><span>Puan<b>${sc ? sc.score.toFixed(1).replace('.', ',') : '—'}</b></span></div></div>`;
}
function ekTeam() {
  const f = S.ekf || ''; const ids = EMP_IDS.slice(); const cnt = (k) => ids.filter((id) => (k === 'leave' ? ekOnLeave(id) : k === 'off' ? ['none', 'out'].includes(ekSt(id)) : ekSt(id) === k)).length;
  const F = [['', 'Hepsi', ids.length], ['working', 'Çalışıyor', cnt('working')], ['break', 'Molada', cnt('break')], ['pending', 'Onay bekliyor', cnt('pending')], ['fix', 'Düzeltmede', cnt('fix')], ['off', 'Dışarıda', cnt('off')], ['leave', 'İzinli', cnt('leave')]].filter((x) => x[0] === '' || x[2] > 0 || f === x[0]);
  const ord = { pending: 0, break: 1, working: 2, fix: 3, none: 4, out: 5 }; let L = ids.filter((id) => !f || (f === 'leave' ? ekOnLeave(id) : f === 'off' ? ['none', 'out'].includes(ekSt(id)) : ekSt(id) === f)).sort((x, y) => (ord[ekSt(x)] ?? 9) - (ord[ekSt(y)] ?? 9));
  return `<section class="mg-card"><div class="ek-h"><h2>Ekip</h2><span>${ids.length} kişi</span></div><div class="ek-f">${F.map((x) => `<button type="button" data-a="ekf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}<b>${x[2]}</b></button>`).join('')}</div><div class="ek-g">${L.length ? L.map(ekCard).join('') : '<p class="muted" style="padding:14px">Bu durumda kimse yok.</p>'}</div>${ids.length > 6 ? '<div class="mg-more">↓ Daha fazla kişi için kaydır</div>' : ''}</section>`;
}
H.ekf = (el) => { S.ekf = el.dataset.v; render(); };
function ekUpcoming() {
  const o = ekNow(); const L = ekLeaves().map((x) => ({ x, q: ekRange(x) })).filter((y) => y.q && y.q[1] >= o).sort((a, b) => a.q[0] - b.q[0]).slice(0, 5);
  return `<section class="mg-card ek-up"><div class="ek-h"><h2>Yaklaşan izinler</h2><button type="button" class="mg-lnk" data-a="sub" data-g="ekip" data-v="izin">Takvim ${mgi('r', 14)}</button></div>${L.length ? L.map(({ x, q }) => `<div class="row2">${avatar(byId(x.uid), 34)}<div class="grow"><b>${esc(byId(x.uid).name)}</b><span>${esc(x.txt)} · ${x.days} gün · ${LV_KIND[x.type] || x.type}</span></div><span class="pill ${x.st === 'onayli' ? (q[0] <= o ? 'p-ok' : 'p-info') : 'p-warn'}">${x.st === 'onayli' ? (q[0] <= o ? 'İzinde' : 'Onaylı') : 'Bekliyor'}</span></div>`).join('') : '<p class="muted" style="padding:6px 0 12px">Yaklaşan izin yok.</p>'}</section>`;
}
/* --- ayrıntı paneli --- */
const canSal = () => S.user.role === 'patron' || S.settings.mudurMaas !== false;
function empDrawer(id) {
  const m = S.modal, u = byId(id), p = PROFILES[id] || {}, a = ATT[id] || { state: 'none', breakMin: 0 }, st = ekSt(id), L = EK_L[st] || EK_L.none, b = ekBal(id), c = brkCfg(), sc = scores().find((x) => x.id === id), d = EMPDATA[id] || {};
  const tabs = [['ozet', 'Özet'], ['izin', 'İzinler']].concat(canSal() ? [['maas', 'Maaş ve ödemeler']] : []).concat([['hak', 'Haklar ve süreler']]); const tab = tabs.some((x) => x[0] === m.tab) ? m.tab : 'ozet';
  const R = (k, v, sub) => `<div class="dr-r"><span>${k}${sub ? `<small>${sub}</small>` : ''}</span><b>${v}</b></div>`;
  let body = '';
  if (tab === 'ozet') {
    body = `<div class="dr-k"><div><span>Puan</span><b>${sc ? sc.score.toFixed(1).replace('.', ',') : '—'}</b></div><div><span>Yıllık izin kalan</span><b>${b.ent ? b.left + ' gün' : '—'}</b></div><div><span>Geç kalma</span><b>${d.late != null ? d.late + ' kez' : '—'}</b></div><div><span>Görev</span><b>${d.task != null ? '%' + d.task : '—'}</b></div></div>
    <div class="dr-s"><h4>Bugün</h4>${R('Durum', `<span class="pill ${L[0]}">${L[1]}</span>`)}${R('Giriş', a.inAt || '—')}${R('Mola', (a.breakMin || 0) + ' dk', 'Planlanan ' + c.plan + ' dk, günlük sınır ' + c.max + ' dk')}${a.late ? R('Geç giriş', a.late + ' dk') : ''}${a.note ? R('Not', esc(a.note)) : ''}${ekOnLeave(id) ? R('İzin', 'Bugün izinli') : ''}</div>
    <div class="dr-s"><h4>Bu ayki performans</h4>${R('Geç kalma', (d.late != null ? d.late : 0) + ' kez')}${R('Mola aşımı', (d.over != null ? d.over : 0) + ' dk')}${R('Eksik kayıt', (d.miss != null ? d.miss : 0) + ' kez')}${R('Görev tamamlama', '%' + (d.task != null ? d.task : 0))}${d.prot ? R('Puan kapsamı dışı', esc(d.prot)) : ''}</div>
    <div class="dr-s"><h4>Sözleşme</h4>${R('İş sözleşmesi', p.contract ? '<span class="pill p-ok">Kayıtlı</span>' : '<span class="pill p-warn">Eksik</span>', p.cAt ? esc(p.cAt) : '')}${R('İşe giriş', p.hire ? esc(isoTxt(p.hire)) : '—', 'Kıdem ' + (p.hire ? tenureTxt(b.mm) : '—'))}</div>`;
  } else if (tab === 'izin') {
    const A = ekLeaves(id); const pct = b.ent ? Math.min(100, Math.round(b.used / b.ent * 100)) : 0;
    body = `<div class="dr-s"><h4>Yıllık izin hakkı</h4>${b.ent ? `<div class="dr-k" style="margin:0"><div><span>Hak</span><b>${b.ent} gün</b></div><div><span>Kullanılan</span><b>${b.used} gün</b></div><div><span>Kalan</span><b>${b.left} gün</b></div></div><div class="dr-bar"><i style="width:${pct}%"></i></div>` : '<p class="muted small">Yıllık izin hakkı 1 yıl dolunca doğar.</p>'}</div>
    <div class="dr-s"><h4>İzin geçmişi ve talepler</h4>${A.length ? A.map((x) => R(`<span class="pill ${LV_PILL[x.type] || 'p-mute'}">${LV_KIND[x.type] || x.type}</span> ${esc(x.txt)}`, `${x.days} gün ${x.st === 'onayli' ? '' : '<span class="pill p-warn">Bekliyor</span>'}`, x.note ? esc(x.note) : '')).join('') : '<p class="muted small">Kayıtlı izin yok.</p>'}</div>
    <div class="dr-s"><h4>Doğum tarihi</h4>${leaveAgeMin(id) ? `<p class="small" style="margin:0 0 8px">Yaşı nedeniyle yıllık izin en az 20 gün (İş Kanunu md. 53: 18 ve daha küçük, 50 ve daha yukarı yaş).</p>` : `<p class="small muted" style="margin:0 0 8px">18 ve daha küçük ya da 50 ve daha yukarı yaştaki çalışanlara yıllık izin en az 20 gündür. Doğum tarihi girilince hak otomatik hesaplanır.</p>`}${['patron', 'mudur'].includes(S.user && S.user.role) ? `<div class="row" style="gap:8px"><input type="date" id="dr-birth" class="grow" aria-label="Doğum tarihi" value="${esc(p.birth || '')}" max="${fiIso()}" style="min-height:44px"><button class="btn sec" data-a="birthsave" data-id="${id}">Kaydet</button></div>` : (p.birth ? `<p class="small">${esc(isoTxt(p.birth))}</p>` : '')}</div>
    <div class="dr-a"><button class="btn sec" data-a="lvadd" data-id="${id}">${ic('plus', 16)} İzin ekle</button></div>`;
  } else if (tab === 'maas') {
    let du = null; try { du = dueOf(id); } catch (e) {} const pays = PAYS.filter((x) => x.uid === id && x.per === NEXTP);
    body = du ? `<div class="dr-k"><div><span>Hak edilen</span><b>${fmt0(du.total)}</b></div><div><span>Ödenen</span><b>${fmt0(du.paid)}</b></div><div><span>Kalan</span><b>${fmt0(Math.max(0, du.left))}</b></div></div><div class="dr-bar"><i style="width:${du.total ? Math.max(0, Math.min(100, Math.round(du.paid / du.total * 100))) : 0}%"></i></div>
    <div class="dr-s"><h4>Maaş</h4>${R('Maaş (' + (p.stype === 'net' ? 'net' : 'brüt') + ')', fmt(p.salary))}${R('Ödeme günü', 'Her ayın ' + p.payday + '\'u')}${R('Saat ücreti', fmt(du.hourly), 'Maaş 225 saate bölünür')}${R('Fazla mesai', fmt(du.ot), (p.otMonth || 0) + ' saat bu ay')}${(du.holL || []).map((x) => R('Resmi tatil çalışma ücreti', fmt(x.amt), x.d + ' ' + VD_MON[x.m] + ' ' + esc(x.n))).join('')}${du.ded ? R('İzin kesintisi', fmt(-du.ded)) : ''}</div>
    <div class="dr-s"><h4>Bu ay yapılan ödemeler</h4>${pays.length ? pays.map((x) => R(`<span class="pill p-info">${PAY_KIND[x.kind]}</span> ${esc(x.date)}`, fmt(x.amt))).join('') : '<p class="muted small">Bu ay henüz ödeme yok.</p>'}</div>
    ${S.user.role === 'patron' ? `<div class="dr-a"><button class="btn sec" data-a="payadd" data-id="${id}">${ic('plus', 16)} Ödeme ekle</button></div>` : ''}<p class="small muted">Tutarlar tahmindir. Bordro ve vergi hesabı muhasebecidedir.</p>` : '<p class="muted">Maaş bilgisi bulunamadı.</p>';
  } else {
    const mm = b.mm, wk = noticeWeeks(mm), eligible = p.hire ? isoTxt(String(Number(p.hire.slice(0, 4)) + 1) + p.hire.slice(4)) : '';
    body = `<div class="dr-s"><h4>Yan haklar ve süreler</h4>${R('Haftalık çalışma', (p.hours || 45) + ' saat', 'Aşan süre %50 zamlı ödenir')}${R('Yıllık izin', b.ent ? b.ent + ' gün' : 'Henüz doğmadı', b.ent ? '' : 'Doğacağı tarih ' + esc(eligible))}${R('Fazla mesai sınırı', (p.otYear || 0) + ' / 270 saat', 'Bu yıl kullanılan')}${R('İhbar süresi', wk + ' hafta')}${R('Deneme süresi', mm >= (p.trial || 2) ? 'Tamamlandı' : 'Sürüyor', 'Sözleşmede ' + (p.trial || 2) + ' ay')}${R('Kıdem tazminatı', mm >= 12 ? 'Şart sağlandı' : 'Henüz değil', mm >= 12 ? 'En az 1 yıl çalışma şartı doldu' : '1 yıl dolunca (' + esc(eligible) + ')')}</div><p class="small muted">Kıdeme göre kanundaki asgari değerler. Sözleşme daha lehte olabilir.</p>`;
  }
  const pend = st === 'pending' ? `<div class="dr-a"><button class="btn" data-a="attok" data-id="${id}">Mola dönüşünü onayla</button><button class="btn sec" data-a="attfix" data-id="${id}">Düzeltme iste</button></div>` : '';
  const foot = `<div class="dr-a">${S.user.role === 'patron' ? `<button class="btn sec" data-a="empopen" data-id="${id}">Tam sayfada aç</button>` : ''}<button class="btn sec" data-a="nav" data-v="duyuru">${ic('megaphone', 16)} Duyuru gönder</button></div>`;
  return sheet(u.name, `<div class="dr-h">${avatar(u, 58)}<div class="grow"><h2>${esc(u.name)}</h2><p>${esc(u.title)}${p.hire ? ' · ' + esc(isoTxt(p.hire)) + ' tarihinde başladı' : ''}</p><div class="row wrap" style="gap:6px"><span class="pill ${L[0]}">${L[1]}</span>${p.hire ? `<span class="pill p-info">Kıdem ${tenureTxt(b.mm)}</span>` : ''}${p.contract ? '<span class="pill p-ok">Sözleşme kayıtlı</span>' : '<span class="pill p-warn">Sözleşme eksik</span>'}</div></div></div>${pend}<div class="dr-tabs" role="group">${tabs.map((x) => `<button type="button" data-a="empdt" data-v="${x[0]}" aria-pressed="${tab === x[0]}">${x[1]}</button>`).join('')}</div>${body}${foot}`).replace('class="sheet"', 'class="sheet empw"');
}
H.empdrw = (el) => { S.modal = { type: 'empdrw', id: el.dataset.id, tab: 'ozet' }; renderModal(); };
H.empdt = (el) => { if (S.modal && S.modal.type === 'empdrw') { S.modal.tab = el.dataset.v; renderModal(); } };
{const _rm71 = renderModal; renderModal = function () { if (S.modal && S.modal.type === 'empdrw') { const root = $('#modal-root'); if (!root) return; try { root.innerHTML = empDrawer(S.modal.id); } catch (e) { root.innerHTML = ''; S.modal = null; } return; } return _rm71.apply(this, arguments); }; }
document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('ek-c')) { e.preventDefault(); H.empdrw(e.target); } });
/* --- izin takvimi --- */
S.izM = S.izM || 0; H.izm = (el) => { S.izM = (S.izM || 0) + Number(el.dataset.v); render(); }; H.izm0 = () => { S.izM = 0; render(); };
function izinTakvim() {
  const now = new Date(); const base = new Date(now.getFullYear(), now.getMonth() + (S.izM || 0), 1); const y = base.getFullYear(), mo = base.getMonth(), dim = new Date(y, mo + 1, 0).getDate(); const todayD = (S.izM || 0) === 0 ? now.getDate() : -1;
  const A = ekLeaves(); const cls = { yillik: 'y', rapor: 'r', ucretsiz: 'u', mazeret: 'm' };
  const cell = (id, d) => { const o = mo * 40 + d; const hit = A.filter((x) => x.uid === id).find((x) => { const q = ekRange(x); return q && q[0] <= o && o <= q[1]; }); const we = [0, 6].includes(new Date(y, mo, d).getDay()); const hl = vdHolFull(y, mo, d); return `<div class="c ${hit ? (hit.st === 'onayli' ? cls[hit.type] || 'y' : 'p') : (hl ? (S.settings.holClosed ? 'hc' : 'hd') : (vdHol(y, mo, d) ? 'hh' : we ? 'we' : ''))}${d === todayD ? ' t' : ''}" title="${hit ? esc(byId(id).name + ': ' + (LV_KIND[hit.type] || hit.type) + ' ' + hit.txt + (hit.st === 'onayli' ? '' : ' (bekliyor)')) : hl ? esc(hl.n) : vdHol(y, mo, d) ? esc(vdHol(y, mo, d).n + ' (yarım gün)') : ''}"></div>`; };
  const heads = Array.from({ length: dim }, (_, i) => { const d = i + 1, we = [0, 6].includes(new Date(y, mo, d).getDay()); const hl = vdHolFull(y, mo, d); return `<div class="dh${we ? ' we' : ''}${d === todayD ? ' td' : ''}${hl ? ' hl' : ''}" title="${hl ? esc(hl.n) : ''}">${d}</div>`; }).join('');
  const rows = EMP_IDS.map((id) => `<div class="nm">${esc(byId(id).name)}</div>${Array.from({ length: dim }, (_, i) => cell(id, i + 1)).join('')}`).join('');
  const per = {}; for (let d = 1; d <= dim; d++) { const o = mo * 40 + d; const w = EMP_IDS.filter((id) => A.some((x) => x.uid === id && (() => { const q = ekRange(x); return q && q[0] <= o && o <= q[1]; })())); if (w.length >= 2) per[d] = w; }
  const ov = Object.keys(per); let note = '';
  if (ov.length) { const f = Number(ov[0]); note = `<div class="callout warn">${ic('alert')}<div><b>Çakışma var</b><p style="margin-top:2px">${f}${ov.length > 1 ? '–' + ov[ov.length - 1] : ''} ${base.toLocaleDateString('tr-TR', { month: 'long' })} arasında aynı günlerde ${Math.max(...ov.map((k) => per[k].length))} kişi izinde olabilir: ${per[f].map((id) => byId(id).name.split(' ')[0]).join(', ')}. Vardiyayı önceden planla.</p></div></div>`; }
  const o = ekNow(); const UP = A.map((x) => ({ x, q: ekRange(x) })).filter((v) => v.q && v.q[1] >= o).sort((a, b) => a.q[0] - b.q[0]);
  const list = UP.length ? UP.map(({ x, q }) => `<div class="row2">${avatar(byId(x.uid), 34)}<div class="grow"><b>${esc(byId(x.uid).name)}</b><span>${esc(x.txt)} · ${x.days} gün · ${LV_KIND[x.type] || x.type}</span></div><span class="pill ${x.st === 'onayli' ? (q[0] <= o ? 'p-ok' : 'p-info') : 'p-warn'}">${x.st === 'onayli' ? (q[0] <= o ? 'İzinde' : 'Onaylı') : 'Karar bekliyor'}</span></div>`).join('') : '<p class="muted" style="padding:6px 0 12px">Yaklaşan izin yok.</p>';
  const bal = EMP_IDS.map((id) => { const b = ekBal(id); const pct = b.ent ? Math.min(100, Math.round(b.used / b.ent * 100)) : 0; return `<div class="it" data-a="empdrw" data-id="${id}" style="cursor:pointer"><div class="row" style="gap:10px">${avatar(byId(id), 34)}<div class="grow"><b>${esc(byId(id).name)}</b><div class="small muted">${b.ent ? b.used + ' / ' + b.ent + ' gün kullanıldı' : 'Hak henüz doğmadı'}</div></div><b>${b.ent ? b.left + ' gün' : '—'}</b></div><div class="dr-bar"><i style="width:${pct}%"></i></div></div>`; }).join('');
  return `${note}<section class="mg-card"><div class="iz-nv"><button type="button" data-a="izm" data-v="-1" aria-label="Önceki ay">${ic('back', 18)}</button><div style="text-align:center"><h2>${base.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>${(S.izM || 0) !== 0 ? '<button type="button" class="mg-lnk" data-a="izm0" style="border:0;width:auto;height:auto">Bu aya dön</button>' : ''}</div><button type="button" data-a="izm" data-v="1" aria-label="Sonraki ay" style="transform:scaleX(-1)">${ic('back', 18)}</button></div><div class="iz-sc"><div class="iz-gr" style="grid-template-columns:130px repeat(${dim},minmax(24px,1fr))"><div></div>${heads}${rows}</div></div><div class="iz-lg"><span><i style="background:#5E9AEA"></i>Yıllık izin</span><span><i style="background:#E8A93C"></i>Rapor</span><span><i style="background:#9AA7BA"></i>Ücretsiz</span><span><i style="background:#9B7BD8"></i>Mazeret</span><span><i style="background:repeating-linear-gradient(45deg,#BCD3F2 0 3px,#E6EEFA 3px 6px);outline:1px dashed #5E9AEA"></i>Onay bekliyor</span><span><i style="background:#FBE3E0"></i>Resmi tatil</span><span><i style="background:#FDF1DC"></i>Yarım gün</span></div></section>${vdHolCard(y, mo)}
  <div class="ek"><section class="mg-card ek-up"><div class="ek-h"><h2>İzin günleri listesi</h2><span>Devam eden ve yaklaşan</span></div>${list}</section><section class="mg-card"><div class="ek-h"><h2>Yıllık izin bakiyeleri</h2></div><div class="iz-bal">${bal}</div></section></div>`;
}
/* --- mola ayarları --- */
H.brkp = (el) => { S.settings.brkPlan = Number(el.dataset.v); try { pSched && pSched(); } catch (e) {} render(); toast('Planlanan mola ' + el.dataset.v + ' dk olarak ayarlandı.', 'ok'); };
H.brkm = (el) => { S.settings.brkMax = Number(el.dataset.v); try { pSched && pSched(); } catch (e) {} render(); toast('Günlük mola sınırı ' + el.dataset.v + ' dk olarak ayarlandı.', 'ok'); };
function molaAyar() {
  const c = brkCfg(); const over = EMP_IDS.filter((id) => (ATT[id] && ATT[id].breakMin || 0) > c.max);
  const live = EMP_IDS.map((id) => { const a = ATT[id] || { breakMin: 0 }, m = a.breakMin || 0, pct = Math.min(100, Math.round(m / c.max * 100)); return `<div class="dr-r" style="align-items:center"><span style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">${avatar(byId(id), 30)}<span style="color:var(--ink)">${esc(byId(id).name)}<small>${m} / ${c.max} dk${m > c.max ? ' · sınır aşıldı' : ''}</small></span></span><div style="width:40%;min-width:90px"><div class="dr-bar" style="margin:0"><i style="width:${pct}%;${m > c.max ? 'background:#D9534F' : ''}"></i></div></div></div>`; }).join('');
  const tgl = `<div class="toggle"><div><b style="font-weight:600">Mola hatırlatmaları</b><div class="small muted">Çalışana en fazla iki bildirim gider: bitmeden 2 dk önce ve bitişte.</div></div><button class="sw" role="switch" aria-checked="${S.settings.reminders}" aria-label="Mola hatırlatmaları" data-a="toggle" data-k="reminders"></button></div>`;
  return `<div class="ek"><div class="ek-main"><section class="mg-card"><div class="ek-h"><h2>Mola ayarları</h2></div><b style="font-size:14px">Planlanan mola süresi</b><p class="small muted" style="margin:2px 0 0">Çalışanın zamanlayıcısı bu süreyi geçince kırmızıya döner.</p><div class="mb-o">${[10, 15, 20, 30, 45].map((v) => `<button type="button" data-a="brkp" data-v="${v}" aria-pressed="${c.plan === v}">${v} dk</button>`).join('')}</div><b style="font-size:14px">Günlük toplam mola sınırı</b><p class="small muted" style="margin:2px 0 0">Aşan çalışan yönetici ekranında uyarı olarak görünür. Otomatik kesinti yapılmaz.</p><div class="mb-o">${[30, 45, 60, 90, 120].map((v) => `<button type="button" data-a="brkm" data-v="${v}" aria-pressed="${c.max === v}">${v} dk</button>`).join('')}</div>${tgl}</section></div>
  <div class="ek-side"><section class="mg-card"><div class="ek-h"><h2>Bugünkü mola durumu</h2><span>${over.length ? over.length + ' kişi sınırı aştı' : 'Sınır aşan yok'}</span></div>${live}</section></div></div>`;
}
/* --- Ekip sayfası --- */
const _viewEkip71 = viewEkip;
viewEkip = function () {
  if (!S.user || !['patron', 'mudur'].includes(S.user.role)) return _viewEkip71();
  const isP = S.user.role === 'patron'; const cur0 = S.sub.ekip; const nReq = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length;
  const items = [['bugun', 'Bugün'], ['vardiya', 'Vardiya' + (vdNeed() ? ' •' : '')], ['izin', 'İzin takvimi'], ['yiz', 'Yıllık izin'], ['mola', 'Mola ayarları'], ['talep', 'İzin talepleri' + (nReq ? ' (' + nReq + ')' : '')]].concat(isP ? [['maas', 'Maaş ve haklar']] : []).concat(isP && ID.active ? [['hesap', 'Hesap bağlantıları']] : []).concat([['siralama', 'Aylık sıralama']]);
  const cur = items.some((x) => x[0] === cur0) ? cur0 : 'bugun'; const segH = seg('ekip', items, cur).replace('<div class="seg"', '<div class="seg seg-b"');
  if (cur === 'vardiya') return vdView(segH);
  if (cur === 'yiz') return yizView(segH);
  if (cur === 'izin') return `<div class="stack-lg">${segH}${izinTakvim()}</div>`;
  if (cur === 'mola') return `<div class="stack-lg">${segH}${molaAyar()}</div>`;
  if (cur === 'bugun') { const tk = ekipTasks(); return `<div class="stack-lg">${segH}<div class="ek"><div class="ek-main">${kzCard('ekip')}${ekTeam()}</div><div class="ek-side">${ekipKais()}${ekUpcoming()}${tk.length ? `<section class="dsec"><div class="dsec-h"><h2>Bugün ne yapmalısın?</h2><p class="muted">Ekibinle ilgili ${tk.length} konu seni bekliyor.</p></div><div class="dtodo">${tk.join('')}</div></section>` : ''}${codeCardEkip()}</div></div></div>`; }
  const h = _viewEkip71(); const m = h.match(/<div class="seg[^"]*" role="group">[\s\S]*?<\/div>/); return m ? h.replace(m[0], segH) : h;
};
