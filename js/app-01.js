(function(){ if (typeof claude !== 'undefined') return;
  let LS = null; try { localStorage.setItem('kp:t','1'); localStorage.removeItem('kp:t'); LS = localStorage; } catch (e) { LS = null; }
  const mem = {};
  const get = (k) => { try { const v = LS ? LS.getItem(k) : mem[k]; return v ? JSON.parse(v) : null; } catch (e) { return null; } };
  const set = (k, v) => { const t = JSON.stringify(v); if (LS) LS.setItem(k, t); else mem[k] = t; };
  const db = { doc: (p) => ({ set: async (v) => { set('kp:' + p, v); }, onSnapshot: (cb) => { const emit = () => { const v = get('kp:' + p); cb({ exists: !!v, data: () => v, metadata: { fromCache: false } }); }; setTimeout(emit, 0); window.addEventListener('storage', (e) => { if (e.key === 'kp:' + p) emit(); }); return () => {}; } }) };
  const dl = { save: async ({ filename, data }) => { const u = URL.createObjectURL(data); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } };
  window.claude = { use: async (n) => (n === 'db' ? db : n === 'downloads' ? dl : null) };
})();
'use strict';
/* Pazar yeri (ilan, üretici paneli) kapalı. Açmak için ?market=1 ile aç, kapatmak için ?market=0. */
const MARKET_ON = (() => { try { const m = /[?&]market=([01])/.exec(location.search); if (m) localStorage.setItem('kp_market', m[1]); return localStorage.getItem('kp_market') === '1'; } catch (e) { return false; } })();
/* ---------- yardımcılar ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
const fmt0 = (n) => Math.round(n).toLocaleString('tr-TR') + ' ₺';
const hhmm = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const mmss = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 1.9 4.5 4.5"/>',
  megaphone: '<path d="M3 10v4h4l8 4V6L7 10z"/><path d="M18 9c1.3.8 2 2 2 3s-.7 2.2-2 3"/>',
  box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  logout: '<path d="M9 4H5v16h4"/><path d="M16 8l4 4-4 4M20 12H9"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  send: '<path d="M3 11l18-8-8 18-2-8z"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  coffee: '<path d="M4 8h12v6a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M16 10h2a2 2 0 010 4h-2M7 3v2M11 3v2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
};
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const mark = (s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="7" y="7" width="18" height="18" rx="2"/><rect x="7" y="7" width="18" height="18" rx="2" transform="rotate(45 16 16)"/><circle cx="16" cy="16" r="3.2" fill="currentColor" stroke="none"/></svg>`;

/* ---------- veri ---------- */
let BIZ = 'İşletmem';
const _NOW = new Date();
const MONTH_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTH_ABBR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const _PM = (_NOW.getMonth() + 11) % 12; const _PY = _NOW.getMonth() === 0 ? _NOW.getFullYear() - 1 : _NOW.getFullYear();
const PREVM = MONTH_LONG[_PM]; const CURM = MONTH_LONG[_NOW.getMonth()]; const PREVA = MONTH_ABBR[_PM]; const CURA = MONTH_ABBR[_NOW.getMonth()];
const PERIOD = PREVM + ' ' + _PY;
const USERS = [
  { id: 'u1', name: 'Patron', role: 'patron', title: 'Patron', email: '', color: '#0D56A6' },
  { id: 'u2', name: 'Müdür', role: 'mudur', title: 'Müdür', email: '', color: '#17807E' },
  { id: 'u3', name: 'Muhasebeci', role: 'muhasebeci', title: 'Muhasebeci', email: '', color: '#7A4FB5' },
  { id: 'u4', name: 'Çalışan 1', role: 'calisan', title: 'Çalışan', email: '', color: '#B5651D' },
  { id: 'u5', name: 'Çalışan 2', role: 'calisan', title: 'Çalışan', email: '', color: '#3E7C3A' },
  { id: 'u6', name: 'Çalışan 3', role: 'calisan', title: 'Çalışan', email: '', color: '#C23A4D' },
  { id: 'u7', name: 'Çalışan 4', role: 'calisan', title: 'Çalışan', email: '', color: '#4A5BA8' },
];
const EMP_IDS = ['u4', 'u5', 'u6', 'u7'];
const ROLE_LABEL = { patron: 'Patron', mudur: 'Müdür', muhasebeci: 'Muhasebeci', calisan: 'Çalışan' };
const byId = (id) => USERS.find((u) => u.id === id);
const ini = (n) => n.split(' ').map((x) => x[0]).slice(0, 2).join('');
const avatar = (u, s = 36) => `<span class="avatar" style="background:${u.color};width:${s}px;height:${s}px" aria-hidden="true">${esc(ini(u.name))}</span>`;
const CATS = ['Hammadde', 'İş yemeği', 'Akaryakıt', 'Elektrik', 'Doğalgaz', 'Su', 'Telefon / internet', 'Kira', 'Temizlik', 'Ulaşım', 'Diğer'];

let ROWS = [
  { id: 'b1', date: '02 Eki', desc: 'METRO TOPTAN MAĞAZACILIK', amt: -4820.5, kind: 'gider' },
  { id: 'b2', date: '03 Eki', desc: 'KÖŞE MARKET', amt: -840, kind: 'gider' },
  { id: 'b3', date: '05 Eki', desc: 'KİRA - E. TAŞÇI', amt: -45000, kind: 'gider' },
  { id: 'b4', date: '05 Eki', desc: 'ÜNLÜ MAMULLER LTD', amt: -12300, kind: 'gider' },
  { id: 'b5', date: '06 Eki', desc: 'ENERJİSA ELEKTRİK', amt: -3640.2, kind: 'gider' },
  { id: 'b6', date: '07 Eki', desc: 'TURKCELL İLETİŞİM', amt: -690, kind: 'gider' },
  { id: 'b7', date: '09 Eki', desc: 'POS TAHSİLAT', amt: 94450, kind: 'gelir' },
  { id: 'b8', date: '10 Eki', desc: 'PETRO YOL AKARYAKIT', amt: -1280, kind: 'gider' },
  { id: 'b9', date: '12 Eki', desc: 'İGDAŞ DOĞALGAZ', amt: -1150, kind: 'gider' },
  { id: 'b10', date: '14 Eki', desc: 'POS TAHSİLAT', amt: 101300, kind: 'gelir' },
  { id: 'b11', date: '18 Eki', desc: 'İSKİ SU', amt: -420, kind: 'gider' },
  { id: 'b12', date: '20 Eki', desc: 'BİM BİRLEŞİK MAĞAZALAR', amt: -1960.4, kind: 'gider' },
  { id: 'b13', date: '22 Eki', desc: 'POS TAHSİLAT', amt: 112100, kind: 'gelir' },
  { id: 'b14', date: '24 Eki', desc: 'BULUT YEDEKLEME ABONELİĞİ', amt: -239.99, kind: 'tekrar', cat: 'Diğer' },
  { id: 'b15', date: '28 Eki', desc: 'HAVALE ***5532', amt: -3500, kind: 'gider' },
  { id: 'b16', date: '30 Eki', desc: 'MAAŞ - A. DEMİR', amt: -30000, kind: 'maas' },
  { id: 'b17', date: '30 Eki', desc: 'MAAŞ - M. KAYA', amt: -30000, kind: 'maas' },
  { id: 'b18', date: '30 Eki', desc: 'MAAŞ - Z. ARSLAN', amt: -30000, kind: 'maas' },
  { id: 'b19', date: '30 Eki', desc: 'MAAŞ - B. ŞAHİN', amt: -30000, kind: 'maas' },
];
let RECEIPTS = [
  { id: 'f1', seller: 'Metro Toptan', date: '02 Eki', total: 4820.5, rate: 10, cat: 'Hammadde', status: 'onayli', by: 'u1', bank: 'b1' },
  { id: 'f2', seller: 'Ünlü Mamuller (fatura)', date: '05 Eki', total: 12300, rate: 10, cat: 'Hammadde', status: 'onayli', by: 'u1', bank: 'b4' },
  { id: 'f3', seller: 'Enerjisa (fatura)', date: '06 Eki', total: 3640.2, rate: 20, cat: 'Elektrik', status: 'onayli', by: 'u1', bank: 'b5' },
  { id: 'f4', seller: 'İGDAŞ (fatura)', date: '12 Eki', total: 1150, rate: 20, cat: 'Doğalgaz', status: 'onayli', by: 'u1', bank: 'b9' },
  { id: 'f5', seller: 'BİM', date: '20 Eki', total: 1960.4, rate: 10, cat: 'Hammadde', status: 'onayli', by: 'u1', bank: 'b12' },
  { id: 'f6', seller: 'Kira makbuzu', date: '05 Eki', total: 45000, rate: 0, cat: 'Kira', status: 'onayli', by: 'u1', bank: 'b3' },
  { id: 'f7', seller: 'Aksoy Kırtasiye', date: '13 Eki', total: 215, rate: 20, cat: 'Diğer', status: 'bekliyor', by: 'u5', bank: null },
  { id: 'f8', seller: 'Pırıl Temizlik Toptan', date: '16 Eki', total: 386.9, rate: 20, cat: 'Temizlik', status: 'bekliyor', by: 'u6', bank: null },
  { id: 'f9', seller: 'Taksi (müşteri siparişi)', date: '19 Eki', total: 240, rate: 20, cat: 'Ulaşım', status: 'bekliyor', by: 'u4', bank: null },
];
let seq = 100;
const SAMPLES = [
  { seller: 'Köşe Market', date: '03 Eki', total: 840, rate: 10, cat: null, ask: true, bank: 'b2', conf: 0.62 },
  { seller: 'Petro Yol Akaryakıt', date: '10 Eki', total: 1280, rate: 20, cat: 'Akaryakıt', bank: 'b8', conf: 0.97 },
  { seller: 'Turkcell İletişim (fatura)', date: '07 Eki', total: 690, rate: 20, cat: 'Telefon / internet', bank: 'b6', conf: 0.99 },
];
const GENERIC = [{ seller: 'Örnek Kırtasiye', date: '12 Kas', total: 175, rate: 20, cat: 'Diğer', bank: null, conf: 0.94 }];
const EMP_SAMPLES = [
  { seller: 'Güneş Kırtasiye', date: '12 Kas', total: 132.5, rate: 20, cat: 'Diğer', bank: null, conf: 0.95 },
  { seller: 'Doğan Temizlik', date: '13 Kas', total: 318, rate: 20, cat: 'Temizlik', bank: null, conf: 0.91 },
];
let RULES = [
  { k: 'Metro Toptan', v: 'Hammadde' },
  { k: 'Ünlü Mamuller', v: 'Hammadde' },
  { k: 'Enerjisa', v: 'Elektrik' },
];

const MAILDOCS = [
  { id: 'e1', from: 'Turkcell Fatura', subj: 'Ekim e-faturanız hazır', date: '07 Eki', total: 690, rate: 20, cat: 'Telefon / internet', bank: 'b6' },
  { id: 'e2', from: 'İSKİ e-Fatura', subj: 'Su faturanız', date: '18 Eki', total: 420, rate: 10, cat: 'Su', bank: 'b11' },
  { id: 'e3', from: 'Petro Yol e-Arşiv', subj: 'E-arşiv faturanız', date: '10 Eki', total: 1280, rate: 20, cat: 'Akaryakıt', bank: 'b8' },
  { id: 'e4', from: 'Ünlü Mamuller', subj: 'Fatura 2026-1184', date: '05 Eki', total: 12300, rate: 10, cat: 'Hammadde', bank: 'b4' },
  { id: 'e5', from: 'Bulut Yedek Hizmeti', subj: 'Abonelik faturası', date: '24 Eki', total: 239.99, rate: 20, cat: 'Diğer', bank: 'b14' },
  { id: 'e6', from: 'Çekirdek Kahve Toptan', subj: 'Kasım fiyat listesi', date: '09 Kas', total: null, rate: 0, cat: '', bank: null },
];
let RECV = [
  { id: 'a1', name: 'Ahmet Yılmaz', email: 'ahmet@yilmaz.example', amt: 15000, days: 12, note: 'Düğün siparişi' },
  { id: 'a2', name: 'Lale Catering', email: 'muhasebe@lalecatering.example', amt: 8400, days: -1, note: 'Aylık pasta teslimi' },
  { id: 'a3', name: 'Mavi Ofis', email: 'info@maviofis.example', amt: 3200, days: 31, note: 'Kahve aboneliği' },
];
let NOTES = { b15: [{ by: 'u3', text: 'Bu havalenin alıcısı kim? Fatura ya da açıklama var mı?', time: '12 Kas 10:20' }] };
let CUSTOMERS = [
  { id: 'k1', name: 'Selin Aydın', email: 'selin.aydin@example.com', visits: 14, last: 3, iys: 'onayli' },
  { id: 'k2', name: 'Can Öztürk', email: 'can.ozturk@example.com', visits: 9, last: 11, iys: 'onayli' },
  { id: 'k3', name: 'Deniz Korkmaz', email: 'deniz.k@example.com', visits: 6, last: 25, iys: 'onayli' },
  { id: 'k4', name: 'Burcu Ekinci', email: 'burcu.e@example.com', visits: 2, last: 48, iys: 'onayli' },
  { id: 'k5', name: 'Murat Tan', email: 'murat.tan@example.com', visits: 11, last: 6, iys: 'yok' },
  { id: 'k6', name: 'Hande Uçar', email: 'hande.ucar@example.com', visits: 5, last: 19, iys: 'onayli' },
  { id: 'k7', name: 'Oğuz Bayrak', email: 'oguz.b@example.com', visits: 1, last: 70, iys: 'ret' },
  { id: 'k8', name: 'Ece Sarı', email: 'ece.sari@example.com', visits: 8, last: 9, iys: 'onayli' },
  { id: 'k9', name: 'Tolga Er', email: 'tolga.er@example.com', visits: 3, last: 33, iys: 'onayli' },
  { id: 'k10', name: 'Pınar Gür', email: 'pinar.gur@example.com', visits: 12, last: 2, iys: 'onayli' },
];
let CAMPAIGNS = [{ subj: 'Yeni sonbahar menüsü', date: '28 Eki', sent: 8, open: '%62' }];
const MONTHS = [{ m: 'Ağu', in: 268400, out: 158200 }, { m: 'Eyl', in: 289700, out: 165900 }];
const UPCOMING = [
  { d: '30 Kas', t: 'Maaşlar (4 kişi)', a: 110000 },
  { d: '05 Ara', t: 'Kira', a: 45000 },
  { d: '05 Ara', t: 'Ünlü Mamuller', a: 12300 },
  { d: '06 Ara', t: 'Elektrik (tahmin)', a: 3640 },
  { d: '12 Ara', t: 'Doğalgaz (tahmin)', a: 1150 },
];
const TPL = [
  { n: 'Hafta sonu indirimi', subj: 'Bu hafta sonu sıcak içeceklerde %15 indirim', body: 'Merhaba {ad},\n\nCumartesi ve pazar günü tüm sıcak içeceklerde %15 indirim var. Kasada bu e-postayı göstermen yeterli.\n\nSeni bekliyoruz,\nÇınar Kafe & Fırın' },
  { n: 'Yeni ürün', subj: 'Yeni tarçınlı rulomuz çıktı', body: 'Merhaba {ad},\n\nFırından yeni çıktı: tarçınlı rulo. İlk gün kahveyle birlikte alana ikinci rulo bizden.\n\nÇınar Kafe & Fırın' },
  { n: 'Seni özledik', subj: 'Uzun zaman oldu, bir kahve ısmarlayalım', body: 'Merhaba {ad},\n\nSeni bir süredir göremedik. Bu ay içinde uğrarsan bir kahve bizden.\n\nÇınar Kafe & Fırın' },
];
const ATT = {
  u4: { state: 'none', inAt: null, breakMin: 0, late: 0, log: [] },
  u5: { state: 'working', inAt: '08:02', breakMin: 15, late: 0, log: [] },
  u6: { state: 'pending', inAt: '08:41', breakMin: 34, late: 11, log: [], note: '12:05 molasından döndüm demedi' },
  u7: { state: 'break', inAt: '08:28', breakMin: 9, late: 0, log: [] },
};
const EMPDATA = {
  u4: { late: 1, over: 18, miss: 0, task: 96, prot: '1 gün yıllık izin', itiraz: null },
  u5: { late: 0, over: 6, miss: 1, task: 92, prot: '', itiraz: null },
  u6: { late: 3, over: 34, miss: 2, task: 88, prot: '2 gün rapor', itiraz: null },
  u7: { late: 2, over: 12, miss: 1, task: 81, prot: '', itiraz: { thread: [{ by: 'u7', text: '14 Ekim sabahı müşteri bekliyordu, geç girişim işin gereğiydi.', time: '13 Kas 18:05' }], status: 'inceleniyor', unreadBoss: true, unreadEmp: false } },
};
const CRIT = [
  { k: 'late', name: 'Geç kalma', val: (v) => `${v} kez geç`, comp: (v) => Math.max(0, 100 - v * 12), how: 'Her geç kalma 12 puan düşürür' },
  { k: 'over', name: 'Mola aşımı', val: (v) => `${v} dk aşım`, comp: (v) => Math.max(0, 100 - v * 0.8), how: 'Aşılan her dakika 0,8 puan düşürür' },
  { k: 'miss', name: 'Eksik kayıt', val: (v) => `${v} eksik`, comp: (v) => Math.max(0, 100 - v * 15), how: 'Her eksik kayıt 15 puan düşürür' },
  { k: 'task', name: 'Görev tamamlama', val: (v) => `%${v}`, comp: (v) => v, how: 'Tamamlanan görevlerin yüzdesi' },
];
let MSGS = [
  { id: 'm1', type: 'duyuru', title: 'Cuma günü stok sayımı var', body: 'Cuma kapanıştan sonra depo sayımı yapacağız. Raf düzenini perşembe akşamı tamamlayalım.', to: ['u4', 'u5', 'u6', 'u7'], time: '12 Kas 17:40', reads: ['u5', 'u6', 'u7'], res: {} },
  { id: 'm2', type: 'mesai', title: 'Bugün 1 saat uzatıyoruz', body: 'Akşam rezervasyonu nedeniyle kapanış 1 saat uzayacak.', hours: 1, pay: 1000, to: ['u4', 'u5'], time: 'Bugün 09:10', reads: ['u5'], res: { u5: 'kabul' } },
];
let STOCK = [
  { id: 's1', name: 'Un (50 kg çuval)', unit: 'çuval', qty: 8, min: 5 },
  { id: 's2', name: 'Süt (1 L)', unit: 'adet', qty: 36, min: 40 },
  { id: 's3', name: 'Kahve çekirdeği (1 kg)', unit: 'paket', qty: 14, min: 10 },
  { id: 's4', name: 'Toz şeker (5 kg)', unit: 'paket', qty: 6, min: 4 },
  { id: 's5', name: 'Karton bardak (8 oz)', unit: 'adet', qty: 300, min: 400 },
  { id: 's6', name: 'Zeytinyağı (5 L)', unit: 'bidon', qty: 3, min: 2 },
  { id: 's7', name: 'Peçete (koli)', unit: 'koli', qty: 5, min: 3 },
];
const CLIENTS = [
  { id: 'c1', name: BIZ, sector: 'Kafe ve fırın' },
  { id: 'c2', name: 'Doruk İnşaat', sector: 'Yapı malzemesi', pct: 94, open: 3 },
  { id: 'c3', name: 'Ada Kuaför', sector: 'Hizmet', pct: 100, open: 0 },
];
const PREV_EXP = 165900;
const AVG_HAM = 11800;

/* ---------- durum ---------- */
const newDraft = () => ({ type: 'duyuru', aud: 'all', title: '', body: '', hours: '1', pay: '1000', sel: [] });
const S = {
  user: null,
  view: 'bugun',
  sub: { muhasebe: 'ozet', ekip: 'bugun', belgeler: 'ekstre', musteri: 'kampanya' },
  mail: { on: false, provider: '', addr: '', send: true },
  camp: { seg: 'all', subj: '', body: '' },
  filter: 'hepsi',
  modal: null,
  weights: { late: 30, over: 25, miss: 20, task: 25 },
  settings: { mudurRanking: false, reminders: true, mudurMaas: false, brkPlan: 15, brkMax: 60 },
  draft: newDraft(),
  client: 'c1',
  sampleIdx: 0,
  empIdx: 0,
  invoiceIn: false,
  sent: null,
  closed: false,
  insightOpen: false,
  openRank: [],
  loginErr: '',
};
const H = {};
const locked = () => {
  try { if (PLAN.ro) { toast('Aboneliğin sona erdiği için kayıt yapılamıyor.', 'warn'); return true; } } catch (e) {}
  if (S.closed) {
    toast(`${PERIOD} dönemi kapalı. Değişiklik için muhasebeciyle konuş.`, 'warn');
    return true;
  }
  return false;
};

/* ---------- hesaplar ---------- */
function rowStatus(r) {
  if (r.kind === 'gelir') return 'gelir';
  if (r.kind === 'maas') return 'maas';
  if (r.kind === 'tekrar') return 'tekrar';
  if (RECEIPTS.some((f) => f.bank === r.id)) return 'eslesti';
  if (r.belgesiz) return 'belgesiz';
  return 'eksik';
}
const countStatus = (s) => ROWS.filter((r) => rowStatus(r) === s).length;
const totals = () => ({
  in: ROWS.filter((r) => r.amt > 0).reduce((a, r) => a + r.amt, 0),
  out: ROWS.filter((r) => r.amt < 0).reduce((a, r) => a + -r.amt, 0),
});
const kdv = (f) => f.total - f.total / (1 + f.rate / 100);
function scores() {
  const W = S.weights;
  const sum = W.late + W.over + W.miss + W.task;
  return EMP_IDS.map((id) => {
    const d = EMPDATA[id];
    const parts = CRIT.map((c) => {
      const comp = c.comp(d[c.k]);
      const w = W[c.k];
      return { c, comp, w, share: sum ? (w / sum) * 100 : 0, contrib: sum ? (w * comp) / sum : 0 };
    });
    const score = parts.reduce((a, p) => a + p.contrib, 0);
    return { id, d, parts, score };
  }).sort((a, b) => b.score - a.score);
}
const unreadFor = (uid) => MSGS.filter((m) => m.to.includes(uid) && !m.reads.includes(uid));
const lowStock = () => STOCK.filter((s) => s.qty < s.min);
const pendingReceipts = () => RECEIPTS.filter((f) => f.status === 'bekliyor');
const pendingAtt = () => EMP_IDS.filter((id) => ATT[id].state === 'pending' && !ATT[id].fix);

/* ---------- bildirim ve pencere ---------- */
function toast(msg, tone = '') {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + tone;
  el.setAttribute('role', 'status');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}
function sheet(title, body) {
  return `<div class="overlay" data-a="backdrop"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sh"><h3>${esc(title)}</h3><button class="xbtn" data-a="closemodal" aria-label="Kapat">${ic('x')}</button></div>${body}</div></div>`;
}

/* ---------- giriş ekranı ---------- */
function loginHTML() {
  const demo = USERS.filter((u) => ['u1', 'u2', 'u3', 'u4'].includes(u.id));
  return `<div class="login">
  <section class="login-art">
    <svg class="pat" aria-hidden="true"><defs><pattern id="tile" width="56" height="56" patternUnits="userSpaceOnUse"><g fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.2"><rect x="12" y="12" width="32" height="32"/><rect x="12" y="12" width="32" height="32" transform="rotate(45 28 28)"/><circle cx="28" cy="28" r="6"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#tile)"/></svg>
    <div class="brand">${mark(30)}<span>KaisPilot</span></div>
    <div>
      <h2>Fiş, ekstre, ekip ve stok tek ekranda.</h2>
      <p class="lead">Patron, müdür, muhasebeci ve çalışan aynı sisteme girer, herkes yalnızca kendi işini görür.</p>
      <div class="roles"><span>Patron: bugün ne yapman gerektiğini görür</span><span>Muhasebeci: ayın paketini hazır alır</span><span>Çalışan: giriş, mola ve masrafını tek dokunuşla yapar</span></div>
    </div>
    <p class="small" style="color:#CFE0F4">Demo hesaplarda ekrandaki veriler örnektir.</p>
  </section>
  <section class="login-form"><div class="inner">
    <div><h1 style="font-size:28px">Giriş yap</h1><p class="muted" style="margin-top:6px">${esc(BIZ)} hesabına gir.</p></div>
    <form id="login" class="stack" novalidate>
      <div class="field"><label for="em">E-posta</label><input id="em" type="email" autocomplete="username" placeholder="ad@sirket.com"></div>
      <div class="field"><label for="pw">Şifre</label><input id="pw" type="password" autocomplete="current-password" placeholder="Şifren"></div>
      <div class="err" id="lerr" role="alert">${esc(S.loginErr)}</div>
      <button class="btn block" type="submit">Giriş yap</button>
    </form>
    <div class="stack">
      <p class="lbl">Demo hesapları (şifre: demo1234)</p>
      <div class="demo">${demo.map((u) => `<button type="button" data-a="demo" data-id="${u.id}"><b>${esc(ROLE_LABEL[u.role])}</b><span>${esc(u.name)}</span></button>`).join('')}</div>
    </div>
  </div></section>
</div>`;
}

/* ---------- kabuk ---------- */
const NAV = {
  patron: [['bugun', 'Bugün', 'home'], ['muhasebe', 'Muhasebe', 'receipt'], ['ekip', 'Ekip', 'users'], ['musteri', 'Müşteri', 'mail'], ['duyuru', 'Duyuru', 'megaphone', 'more'], ['stok', 'Stok', 'box', 'more'], ['ayarlar', 'Ayarlar', 'gear', 'more']],
  mudur: [['bugun', 'Bugün', 'home'], ['ekip', 'Ekip', 'users'], ['duyuru', 'Duyuru', 'megaphone'], ['stok', 'Stok', 'box']],
  muhasebeci: [['donem', 'Dönem', 'home'], ['belgeler', 'Belgeler', 'receipt'], ['tablo', 'Tablo', 'table'], ['calisanlar', 'Çalışanlar', 'users'], ['borc', 'Borç ve alacak', 'wallet', 'more'], ['paket', 'Aylık paket', 'file', 'more']],
  calisan: [['bugun', 'Bugün', 'home'], ['masraf', 'Masraf', 'receipt'], ['duyuru', 'Duyurular', 'megaphone'], ['puanim', 'Puanım', 'trend'], ['maasim', 'Maaşım', 'wallet']],
};
const TITLES = { musteri: 'Müşteriler', bugun: 'Bugün', muhasebe: 'Muhasebe', ekip: 'Ekip', duyuru: 'Duyurular', stok: 'Stok', ayarlar: 'Ayarlar', donem: 'Dönem', belgeler: 'Belgeler', paket: 'Aylık paket', masraf: 'Masraf fişlerim', puanim: 'Puanım', maasim: 'Maaşım', tablo: 'Gelir ve gider', calisanlar: 'Çalışanlar', borc: 'Borç ve alacak' };

function badgeForV2(view, u) {
  if (u.role !== 'calisan') return 0;
  if (view === 'duyuru') return unreadFor(u.id).length;
  if (view === 'puanim') { const it = EMPDATA[u.id] && EMPDATA[u.id].itiraz; return it && it.unreadEmp ? 1 : 0; }
  return 0;
}
function shellHTML() {
  const u = S.user;
  const nav = NAV[u.role];
  const item = (n, cls) => `<button class="${cls}" data-a="nav" data-v="${n[0]}" ${S.view === n[0] ? 'aria-current="page"' : ''}>${ic(n[2], 22)}<span>${esc(n[1])}</span>${badgeFor(n[0], u) ? '<span class="pill p-bad" style="padding:1px 7px">' + badgeFor(n[0], u) + '</span>' : ''}</button>`;
  return `<div class="shell">
  <aside class="side"><div class="brand">${mark(30)}<span>KaisPilot</span></div>
    <nav aria-label="Ana menü">${nav.map((n) => item(n, 'nav')).join('')}</nav>
    <div class="me">${avatar(u, 38)}<div class="grow"><b style="display:block;font-weight:600">${esc(u.name)}</b><span class="small muted">${esc(ROLE_LABEL[u.role])}</span></div><button class="xbtn" data-a="logout" aria-label="Çıkış yap" title="Çıkış yap">${ic('logout')}</button></div>
  </aside>
  <div class="col">
    <header class="top"><span class="mark">${mark(26)}</span><h1 class="ptitle">${esc(TITLES[S.view] || '')}</h1><span class="biz">${esc(BIZ)}</span><button class="avatar" style="background:${u.color}" data-a="menu" aria-label="Hesap menüsü">${esc(ini(u.name))}</button></header>
    <main class="main" id="main">${viewHTML()}</main>
  </div>
  <nav class="tabbar" aria-label="Alt menü">${nav.filter((n) => !n[3]).map((n) => item(n, 'tab')).join('')}${nav.some((n) => n[3]) ? `<button class="tab" data-a="menu" ${nav.some((n) => n[3] && n[0] === S.view) ? 'aria-current="page"' : ''}>${ic('list', 22)}<span>Daha fazla</span></button>` : ''}</nav>
</div>`;
}

function render() {
  const app = $('#app');
  if (!app) return;
  app.innerHTML = S.user ? shellHTML() : loginHTML();
  renderModal();
}
function go(view, sub) {
  S.view = view;
  if (sub) {
    const grp = view === 'belgeler' ? 'belgeler' : view;
    S.sub[grp] = sub;
  }
  render();
  if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
}

/* ---------- görünümler ---------- */
function viewHTML() {
  const r = S.user.role;
  const v = S.view;
  const map = {
    patron: { bugun: bugunPatron, muhasebe: viewMuhasebe, musteri: viewMusteri, ekip: viewEkip, duyuru: viewDuyuru, stok: viewStok, ayarlar: viewAyarlar },
    mudur: { bugun: bugunMudur, ekip: viewEkip, duyuru: viewDuyuru, stok: viewStok },
    muhasebeci: { donem: viewDonem, belgeler: viewBelgeler, tablo: viewTablo, calisanlar: viewCalisanlar, borc: viewBorc, paket: viewPaket },
    calisan: { bugun: bugunCalisan, masraf: viewMasraf, duyuru: viewDuyuru, puanim: viewPuanim, maasim: viewMaasim },
  };
  const fn = (map[r] || {})[v];
  return fn ? fn() : '<div class="empty">Bu sayfa bulunamadı.</div>';
}
const seg = (group, items, cur) => `<div class="seg" role="group">${items.map((i) => `<button data-a="sub" data-g="${group}" data-v="${i[0]}" aria-pressed="${cur === i[0]}">${esc(i[1])}</button>`).join('')}</div>`;
const today = () => new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
const todo = (icon, tone, title, sub, view, subv) => `<button class="todo" data-a="nav" data-v="${view}" ${subv ? `data-s="${subv}"` : ''}><span class="dot tone-${tone}">${ic(icon, 22)}</span><span class="grow"><b>${esc(title)}</b><span class="sub">${esc(sub)}</span></span>${ic('chevron', 18)}</button>`;

const thread = (arr) => `<div class="thread">${arr.map((m) => { const u = byId(m.by); return `<div class="bub ${m.by === S.user.id ? 'me' : ''}"><div class="bh"><b>${esc(u.name.split(' ')[0])}</b> <span class="muted">${esc(m.time)}</span></div><div>${esc(m.text)}</div></div>`; }).join('')}</div>`;
const nowT = () => 'Bugün ' + hhmm(new Date());
const itPill = (it) => ({ inceleniyor: '<span class="pill p-warn">İşveren inceliyor</span>', 'cevap bekleniyor': '<span class="pill p-info">Cevap bekleniyor</span>', 'kabul edildi': '<span class="pill p-ok">Kabul edildi</span>', reddedildi: '<span class="pill p-mute">Reddedildi</span>' }[it.status] || '');
const waitingNotes = () => Object.keys(NOTES).filter((id) => { const a = NOTES[id]; return a.length && byId(a[a.length - 1].by).role === 'muhasebeci'; });
const mailStatus = (d) => (d.bank && RECEIPTS.some((f) => f.bank === d.bank) ? 'var' : d.total == null ? 'atla' : 'yeni');
const mailReady = () => S.mail.on && S.mail.send;

/* Bugün: patron */
function bugunPatron() {
  const items = [];
  const miss = countStatus('eksik');
  const pend = pendingReceipts().length;
  const att = pendingAtt();
  const low = lowStock();
  if (miss) items.push(todo('alert', 'bad', `${miss} işlemin fişi yok`, 'Ekstrede harcama var, belge eklenmemiş', 'muhasebe', 'ekstre'));
  if (pend) items.push(todo('receipt', 'warn', `${pend} masraf fişi onay bekliyor`, 'Çalışanların yüklediği fişler', 'muhasebe', 'fisler'));
  const rv = RECEIPTS.filter((f) => f.status === 'duzeltme');
  if (rv.length) items.unshift(todo('chat', 'warn', `Muhasebeci ${rv.length} fiş için düzeltme istedi`, `${rv[0].seller}: ${rv[0].note}`, 'muhasebe', 'belgeler'));
  const fr = RECEIPTS.filter((f) => f.fresh);
  if (fr.length) items.unshift(todo('check', 'ok', `${fr.length} gider tabloya yazıldı`, `${fr.map((f) => f.seller).join(', ')} onaylandı`, 'muhasebe', 'tablo'));
  const sn = RECEIPTS.filter((f) => f.status === 'musavirde' && f.by === 'u1');
  if (sn.length) items.push(todo('send', 'info', `${sn.length} fişin muhasebecide`, 'Onaylanınca gider tabloya yazılır', 'muhasebe', 'belgeler'));
  const nc = EMP_IDS.filter((id) => !PROFILES[id].contract);
  if (nc.length) items.push(todo('file', 'info', `${byId(nc[0]).name} için iş sözleşmesi yok`, 'Fotoğrafını yükle, Kais AI kaydetsin', 'ekip', 'maas'));
  const wy = MSGS.filter((x) => x.whyNew);
  if (wy.length) items.unshift(todo('chat', 'warn', 'Bir mesai teklifi mazeretle reddedildi', wy[0].title, 'duyuru'));
  const lrp = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status));
  if (lrp.length) items.unshift(todo('clock', 'warn', `${lrp.length} izin talebi karar bekliyor`, `${byId(lrp[0].uid).name}: ${lrp[0].txt}`, 'ekip', 'talep'));
  const dsp = debtSoon();
  if (dsp.length) items.push(todo('wallet', 'warn', `${dsp.length} ödeme için hatırlatma zamanı`, `${dsp[0].who}: ${fmt0(dsp[0].amt)}`, 'muhasebe', 'ozet'));
  if (att.length) items.push(todo('clock', 'warn', `${att.length} mola dönüşü onay bekliyor`, `${byId(att[0]).name}: ${ATT[att[0]].note || 'döndüm demedi'}`, 'ekip', 'bugun'));
  if (low.length) items.push(todo('box', 'warn', `${low.length} ürün kritik seviyede`, low.map((s) => s.name.split(' (')[0]).join(', '), 'stok'));
  const wn = waitingNotes();
  if (wn.length) items.unshift(todo('chat', 'warn', `Muhasebecinin ${wn.length} sorusu cevap bekliyor`, `${byId('u3').name}: ${NOTES[wn[0]][NOTES[wn[0]].length - 1].text}`, 'muhasebe', 'ekstre'));
  const itr = EMP_IDS.filter((id) => EMPDATA[id].itiraz && EMPDATA[id].itiraz.unreadBoss);
  if (itr.length) items.unshift(todo('alert', 'warn', `${byId(itr[0]).name} itirazı için yazdı`, 'Puanı inceleyip cevap ver', 'ekip', 'siralama'));
  if (!S.mail.on) items.push(todo('mail', 'info', 'E-postanı bağla', 'Faturalar kendiliğinden gelsin, müşterilere e-posta gönderebil', 'muhasebe', 'eposta'));
  else if (MAILDOCS.some((d) => mailStatus(d) === 'yeni')) items.push(todo('mail', 'info', `${MAILDOCS.filter((d) => mailStatus(d) === 'yeni').length} fatura e-postanda bulundu`, 'Tek dokunuşla muhasebeye ekle', 'muhasebe', 'eposta'));
  const late = RECV.filter((a) => !a.paid && a.days > 0);
  if (late.length) items.push(todo('trend', 'bad', `${late.length} alacağın vadesi geçti`, `${late.map((a) => a.name).join(', ')}: ${fmt0(late.reduce((x, a) => x + a.amt, 0))}`, 'muhasebe', 'alacak'));
  const t = totals();
  const cur = RECEIPTS.filter((f) => f.cat === 'Hammadde').reduce((a, f) => a + f.total, 0);
  const pct = Math.round((cur / AVG_HAM - 1) * 100);
  const expPct = Math.round((t.out / PREV_EXP - 1) * 100);
  return `<div class="stack-lg">
  <div><h2>Bugün ne yapmalısın?</h2><p class="muted" style="margin-top:4px">${esc(today())} · ${items.length} konu seni bekliyor</p></div>
  <div class="stack">${items.join('')}</div>
  <div class="card stack">
    <div class="row between wrap"><div><h3>Kais fark etti</h3><p class="muted small">Hesabı her zaman gösteririm.</p></div><span class="pill p-info">Gider +%${expPct} geçen aya göre</span></div>
    <p>Hammadde gideri son 3 ay ortalamasının %${pct} üzerinde.</p>
    <button class="btn sec sm" style="align-self:flex-start" data-a="insight">${S.insightOpen ? 'Hesabı gizle' : 'Hesabı göster'}</button>
    ${S.insightOpen ? `<div class="callout">${ic('info')}<div>Son 3 ay ortalaması ${fmt0(AVG_HAM)}. ${PERIOD}: ${fmt0(cur)}, ekstrede Metro, Ünlü Mamuller ve BİM ödemeleri. Fark ${fmt0(cur - AVG_HAM)}. Yetersiz geçmiş varsa uyarı üretmem.</div></div>` : ''}
  </div>
  <div class="card stack"><h3>${PERIOD} özeti</h3>
    <div class="kpis"><div class="kpi"><div class="l">Gelen</div><div class="v num">${fmt0(t.in)}</div></div><div class="kpi"><div class="l">Giden</div><div class="v num">${fmt0(t.out)}</div></div><div class="kpi"><div class="l">Fark</div><div class="v num">${fmt0(t.in - t.out)}</div></div></div>
  </div></div>`;
}
function bugunMudurV2() {
  const low = lowStock();
  return `<div class="stack-lg">
  <div><h2>Bugün ekipte durum</h2><p class="muted" style="margin-top:4px">${esc(today())}</p></div>
  <div class="card flush">${EMP_IDS.map((id) => empRow(id, true)).join('')}</div>
  ${low.length ? `<div class="stack">${todo('box', 'warn', `${low.length} ürün kritik seviyede`, low.map((s) => s.name.split(' (')[0]).join(', '), 'stok')}</div>` : ''}
  <div class="stack">${todo('megaphone', 'info', 'Ekibe duyuru gönder', 'Herkese ya da seçtiğin kişilere', 'duyuru')}</div>
  </div>`;
}
function bugunCalisanV2() {
  const u = S.user;
  const a = ATT[u.id];
  const unread = unreadFor(u.id).length;
  const itz = EMPDATA[u.id] && EMPDATA[u.id].itiraz && EMPDATA[u.id].itiraz.unreadEmp;
  const offers = MSGS.filter((m) => m.type === 'mesai' && m.to.includes(u.id) && !m.res[u.id]).length;
  let main = '';
  if (a.state === 'none') main = `<div class="clock"><span class="pill p-mute">Henüz giriş yok</span><div class="state">Günaydın ${esc(u.name.split(' ')[0])}</div><p class="muted" style="margin-bottom:16px">Çalışma gününe başlamak için giriş yap.</p><button class="btn block" data-a="clockin">${ic('clock')} Giriş yap</button></div>`;
  if (a.state === 'working') main = `<div class="clock"><span class="pill p-ok">Çalışıyorsun</span><div class="state">Giriş ${esc(a.inAt)}</div><p class="muted" style="margin-bottom:16px">Bugün toplam mola: ${a.breakMin} dk</p><div class="stack"><button class="btn block" data-a="breakstart">${ic('coffee')} Molaya çık</button><button class="btn sec block" data-a="clockout">Çıkış yap</button></div></div>`;
  if (a.state === 'pending' && a.fix) main = `<div class="clock"><span class="pill p-bad">Düzeltme istendi</span><div class="state">İşveren mola kaydını düzeltmeni istedi</div><p class="muted" style="margin-bottom:16px">${esc(a.note || '')}</p><button class="btn block" data-a="attre">Düzelttim, tekrar gönder</button></div>`;
  else if (a.state === 'pending') main = `<div class="clock"><span class="pill p-warn">Onay bekliyor</span><div class="state">Mola dönüşün onayda</div><p class="muted">İşveren onaylayınca kayıt kesinleşir. Kesinti yapılmaz.</p></div>`;
  if (a.state === 'break') {
    if (!a.bstart) a.bstart = Date.now() - a.breakMin * 60000;
    const s = Math.floor((Date.now() - a.bstart) / 1000);
    main = `<div class="clock"><span class="pill p-info">Moladasın</span><div class="timer ${s > (Number(S.settings.brkPlan) || 15) * 60 ? 'over' : ''}" id="brk-timer">${mmss(s)}</div><p class="muted" style="margin-bottom:16px">Planlanan mola ${Number(S.settings.brkPlan) || 15} dk. En fazla iki bildirim alırsın.</p><button class="btn block" data-a="breakend">Döndüm</button></div>`;
  }
  if (a.state === 'out') main = `<div class="clock"><span class="pill p-mute">Çıkış yaptın</span><div class="state">İyi akşamlar</div><p class="muted">Bugünün kaydı işverenle aynı şekilde görünür.</p></div>`;
  return `<div class="stack-lg">
  <div><h2>Merhaba ${esc(u.name.split(' ')[0])}</h2><p class="muted" style="margin-top:4px">${esc(today())} · Vardiya 09:00 – 18:00</p></div>
  <div class="card">${main}</div>
  ${itz ? `<div class="stack">${todo('chat', 'warn', 'İtirazın için yeni mesajın var', EMPDATA[u.id].itiraz.status === 'cevap bekleniyor' ? 'İşveren soru sordu, cevap bekliyor' : 'İşveren kararını yazdı', 'puanim')}</div>` : ''}
  ${offers ? `<div class="stack">${todo('megaphone', 'warn', `${offers} mesai teklifi cevap bekliyor`, 'Kabul ya da reddet', 'duyuru')}</div>` : ''}
  ${unread && !offers ? `<div class="stack">${todo('megaphone', 'info', `${unread} yeni duyuru`, 'Okumak için dokun', 'duyuru')}</div>` : ''}
  <div class="card"><h3>Bugünkü kaydın</h3>${a.log.length ? a.log.map((l) => `<div class="logline"><span>${esc(l[0])}</span><span class="muted num">${esc(l[1])}</span></div>`).join('') : '<p class="muted" style="margin-top:6px">Henüz kayıt yok.</p>'}
    <p class="small muted" style="margin-top:10px">Sistem yalnızca giriş, çıkış ve mola süresini saklar. Konum yalnızca girişte dükkâna yakınlığı doğrulamak için bir kez kontrol edilir, kaydedilmez. Kamera ve biyometri kullanılmaz.</p></div>
  </div>`;
}

/* Ekip */
function empRow(id, canAct) {
  const u = byId(id);
  const a = ATT[id];
  const P = (a.state === 'pending' && a.fix) ? ['p-bad', 'Düzeltme bekleniyor'] : { none: ['p-mute', 'Henüz giriş yok'], working: ['p-ok', 'Çalışıyor'], break: ['p-info', 'Molada'], pending: ['p-warn', 'Onay bekliyor'], out: ['p-mute', 'Çıkış yaptı'] }[a.state];
  const meta = [`Giriş ${a.inAt || '—'}`, `Mola ${a.breakMin} dk`];
  if (a.late) meta.push(`${a.late} dk geç girdi`);
  return `<div class="emp">${S.user.role === 'patron' ? `<button class="empbtn" data-a="empopen" data-id="${id}" aria-label="${esc(u.name)} maaş ve haklar">${avatar(u, 40)}<span class="grow"><b style="font-weight:600;display:block">${esc(u.name)}</b><span class="small muted">${esc(u.title)} · maaş ve haklar</span></span></button>` : `${avatar(u, 40)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">${esc(u.title)}</div></div>`}<span class="pill ${P[0]}">${P[1]}</span><div class="meta">${esc(meta.join(' · '))}${a.state === 'pending' ? ' · ' + esc(a.note) : ''}</div>${a.state === 'pending' && !a.fix && canAct ? `<div class="act"><button class="btn sm" data-a="attok" data-id="${id}">Onayla</button><button class="btn sm sec" data-a="attfix" data-id="${id}">Düzeltme iste</button></div>` : ''}</div>`;
}

function rankingHTML() {
  const sc = scores();
  return sc.map((s, i) => {
    const u = byId(s.id);
    const it = s.d.itiraz;
    return `<details class="rk" id="rk-${s.id}" ${S.openRank.includes(s.id) ? 'open' : ''}>
      <summary><span class="pos">${i + 1}</span><span class="grow"><b style="font-weight:600">${esc(u.name)}</b> <span class="small muted">${esc(u.title)}</span>${it && ['inceleniyor', 'cevap bekleniyor'].includes(it.status) ? (it.unreadBoss ? ' <span class="pill p-bad">Yeni mesaj</span>' : ' <span class="pill p-warn">İtiraz var</span>') : ''}</span><span class="score num">${s.score.toFixed(1).replace('.', ',')}</span><span class="bar"><i style="width:${s.score}%"></i></span></summary>
      <div class="body">
        <div class="tblwrap"><table class="tbl"><thead><tr><th>Kriter</th><th>Kayıt</th><th class="r">Puan</th><th class="r">Ağırlık</th><th class="r">Katkı</th></tr></thead><tbody>
        ${s.parts.map((p) => `<tr><td>${esc(p.c.name)}<div class="small muted">${esc(p.c.how)}</div></td><td class="num">${esc(p.c.val(s.d[p.c.k]))}</td><td class="r num">${p.comp.toFixed(0)}</td><td class="r num">%${p.share.toFixed(0)}</td><td class="r num"><b>${p.contrib.toFixed(1).replace('.', ',')}</b></td></tr>`).join('')}
        </tbody></table></div>
        <div class="row wrap">${s.d.prot ? `<span class="pill p-info">Kapsam dışı: ${esc(s.d.prot)}</span>` : '<span class="pill p-mute">Kapsam dışı gün yok</span>'}</div>
        ${it ? `<div class="callout warn">${ic('alert')}<div class="grow"><div class="row wrap"><b>İtiraz ve yazışma</b>${itPill(it)}</div>${thread(it.thread)}
          ${['inceleniyor', 'cevap bekleniyor'].includes(it.status) ? `<div class="field" style="margin-top:12px"><label for="itm-${s.id}">Gerekçe ya da soru yaz</label><textarea id="itm-${s.id}" placeholder="Örnek: O sabah müşteriyi kim bekletiyordu? Hangi sipariş için?"></textarea></div>
          <div class="row wrap" style="margin-top:10px"><button class="btn sm" data-a="itask" data-id="${s.id}">Soru sor</button><button class="btn sm sec" data-a="itok" data-id="${s.id}">Kabul et, puanı güncelle</button><button class="btn sm sec" data-a="itno" data-id="${s.id}">Gerekçeyle reddet</button></div><p class="small muted" style="margin-top:8px">Soru ve gerekçe çalışana bildirim olarak gider, çalışan cevap yazabilir.</p>` : '<p class="small muted" style="margin-top:8px">Çalışan yeni bir açıklama yazarsa burada görünür.</p>'}</div></div>` : ''}
      </div></details>`;
  }).join('');
}
function rankingView() {
  const W = S.weights;
  const sl = CRIT.map((c) => `<div><div class="wl"><label for="w-${c.k}">${esc(c.name)}</label><b class="num" id="wv-${c.k}">%${W[c.k]}</b></div><input id="w-${c.k}" type="range" min="0" max="60" step="5" value="${W[c.k]}" data-ch="w" data-k="${c.k}"></div>`).join('');
  return `<div class="stack-lg">
  <div class="callout warn">${ic('alert')}<div><b>${PERIOD} devam ve çalışma düzeni sıralaması</b><p style="margin-top:2px">Bu sıralama yalnızca kayıtlı verilere dayanır, karar yerine geçmez. Rapor, yıllık izin ve doğum izni günleri kapsam dışıdır. Çalışan kendi puanını ve kriterleri görür, itiraz edebilir.</p></div></div>
  <div class="card flush" id="rank-region">${rankingHTML()}${EMP_IDS.forEach((id) => { if (EMPDATA[id].itiraz) EMPDATA[id].itiraz.unreadBoss = false; }) || ''}</div>
  <div class="card stack"><div><h3>Kriter dosyası</h3><p class="muted small">Kriterleri ve ağırlıkları sen belirlersin. Toplam otomatik %100'e ölçeklenir.</p></div><div class="weights">${sl}</div></div>
  </div>`;
}

/* Puanım */
function viewPuanim() {
  const u = S.user;
  const d = EMPDATA[u.id];
  const sc = scores().find((s) => s.id === u.id);
  const it = d.itiraz;
  const html = `<div class="stack-lg">
  <div><h2>${PERIOD} puanın</h2><p class="muted" style="margin-top:4px">Bu puan yalnızca kayıtlı verilere dayanır, karar yerine geçmez. Sıralamayı yalnızca işveren görür.</p></div>
  <div class="card stack"><div class="row between"><span class="muted">Toplam puan</span><span class="timer" style="font-size:40px">${sc.score.toFixed(1).replace('.', ',')}</span></div>
  <div class="tblwrap"><table class="tbl"><thead><tr><th>Kriter</th><th>Kayıt</th><th class="r">Puan</th><th class="r">Katkı</th></tr></thead><tbody>${sc.parts.map((p) => `<tr><td>${esc(p.c.name)}<div class="small muted">${esc(p.c.how)}</div></td><td class="num">${esc(p.c.val(d[p.c.k]))}</td><td class="r num">${p.comp.toFixed(0)}</td><td class="r num"><b>${p.contrib.toFixed(1).replace('.', ',')}</b></td></tr>`).join('')}</tbody></table></div>
  <div>${d.prot ? `<span class="pill p-info">Kapsam dışı: ${esc(d.prot)}</span>` : '<span class="pill p-mute">Kapsam dışı gün yok</span>'}</div></div>
  <div class="card stack"><div class="row between wrap"><h3>Açıklama ya da itiraz</h3>${it ? itPill(it) : ''}</div>
  ${it ? thread(it.thread) : ''}
  ${!it || it.status !== 'kabul edildi' ? `<div class="field"><label for="itx">${!it ? 'Bir kaydın yanlışsa ya da bir sebebi varsa yaz' : it.status === 'cevap bekleniyor' ? 'İşverenin sorusuna cevabın' : it.status === 'reddedildi' ? 'Karara karşı yeni bir açıklama ekle' : 'İşverene ek bir not yaz'}</label><textarea id="itx" placeholder="Örnek: 14 Ekim sabahı müşteri bekliyordu."></textarea></div><button class="btn" style="align-self:flex-start" data-a="itsend">${ic('send')} ${it ? 'Cevabı gönder' : 'İşverene gönder'}</button>` : '<p class="small muted">İşveren itirazını kabul etti, puanın güncellendi.</p>'}
  </div></div>`;
  if (it) it.unreadEmp = false;
  return html;
}

/* Duyuru */
function viewDuyuru() {
  const u = S.user;
  if (u.role === 'calisan') {
    const mine = MSGS.filter((m) => m.to.includes(u.id));
    const fresh = mine.filter((m) => !m.reads.includes(u.id)).map((m) => m.id);
    mine.forEach((m) => { if (!m.reads.includes(u.id)) m.reads.push(u.id); });
    return `<div class="stack-lg"><div><h2>Duyurular</h2><p class="muted" style="margin-top:4px">İşvereninden gelen mesajlar ve teklifler.</p></div>
    <div class="card flush">${mine.length ? mine.map((m) => msgCard(m, fresh.includes(m.id), true)).join('') : '<div class="empty">Henüz duyuru yok.</div>'}</div></div>`;
  }
  const d = S.draft;
  const mesai = d.type === 'mesai';
  return `<div class="stack-lg">
  <div class="card stack"><h3>Yeni mesaj</h3>
    ${seg('msgtype', [['duyuru', 'Duyuru'], ['mesai', 'Mesai teklifi']], d.type)}
    <div class="field"><span class="lbl">Kime</span><div class="chips">
      <button class="chip" data-a="aud" data-v="all" aria-pressed="${d.aud === 'all'}">Herkes (${EMP_IDS.length} kişi)</button>
      <button class="chip" data-a="aud" data-v="sel" aria-pressed="${d.aud === 'sel'}">Seçtiklerim</button></div></div>
    ${d.aud === 'sel' ? `<div class="chips">${EMP_IDS.map((id) => `<label class="chip" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="rcp" value="${id}" ${d.sel.includes(id) ? 'checked' : ''}> ${esc(byId(id).name)}</label>`).join('')}</div>` : ''}
    <div class="field"><label for="d-title">Başlık</label><input id="d-title" type="text" value="${esc(d.title)}" placeholder="${mesai ? 'Bugün 1 saat uzatıyoruz' : 'Cuma günü stok sayımı var'}"></div>
    ${mesai ? `<div class="row wrap"><div class="field grow"><label for="d-hours">Ek süre (saat)</label><input id="d-hours" type="number" min="0.5" step="0.5" value="${esc(d.hours)}"></div><div class="field grow"><label for="d-pay">Ek ücret (₺)</label><input id="d-pay" type="number" min="0" step="50" value="${esc(d.pay)}"></div></div>
    <div class="callout warn">${ic('alert')}<div>Çalışan teklifi kabul ya da reddeder, cevabı kayda geçer. Fazla mesainin yasal koşulları ve zam oranı muhasebeci ya da iş hukukçusuyla doğrulanmalı.</div></div>` : ''}
    <div class="field"><label for="d-body">Mesaj</label><textarea id="d-body" placeholder="Çalışanların okuyacağı metin">${esc(d.body)}</textarea></div>
    <button class="btn" style="align-self:flex-start" data-a="sendmsg">${ic('send')} Gönder</button>
  </div>
  <div class="card flush"><div style="padding:16px 16px 0"><h3>Gönderilenler</h3></div>${MSGS.slice().reverse().map((m) => msgCard(m, false, false)).join('')}</div></div>`;
}
function msgCard(m, fresh, asEmp) {
  const names = (ids) => ids.map((id) => esc(byId(id).name.split(' ')[0])).join(', ');
  const kabul = m.to.filter((id) => m.res[id] === 'kabul');
  const red = m.to.filter((id) => m.res[id] === 'red');
  const bek = m.to.filter((id) => !m.res[id]);
  const uid = S.user.id;
  let foot = '';
  if (asEmp && m.type === 'mesai') {
    const r = m.res[uid];
    foot = r ? `<span class="pill ${r === 'kabul' ? 'p-ok' : 'p-mute'}">${r === 'kabul' ? 'Kabul ettin' : 'Reddettin'}</span>${r === 'red' && m.why && m.why[uid] ? `<p class="small muted">Mazeretin: ${esc(m.why[uid].text)}</p>` : ''}` : `<div class="row wrap"><button class="btn" data-a="respond" data-id="${m.id}" data-v="kabul">Kabul ediyorum</button><button class="btn sec" data-a="respond" data-id="${m.id}" data-v="red">Reddet</button></div><p class="small muted">Cevabın işverenle paylaşılır ve kayda geçer.</p>`;
  } else if (!asEmp) {
    foot = `<div class="small muted">Okundu ${m.reads.filter((id) => m.to.includes(id)).length}/${m.to.length}${m.reads.length < m.to.length ? ' · okumayanlar: ' + names(m.to.filter((id) => !m.reads.includes(id))) : ''}</div>` +
      (m.type === 'mesai' ? `<div class="who"><span class="pill p-ok">Kabul ${kabul.length}</span><span class="pill p-warn">Bekliyor ${bek.length}</span><span class="pill p-mute">Red ${red.length}</span></div>${red.map((id) => (m.why && m.why[id] ? `<div class="callout warn" style="margin-top:8px">${ic('chat')}<div><b>${esc(byId(id).name.split(' ')[0])} reddetti, mazereti:</b><p style="margin-top:2px">${esc(m.why[id].text)}</p></div></div>` : '')).join('')}` : '');
  }
  return `<div class="msg"><div class="mh">${m.type === 'mesai' ? '<span class="pill p-warn">Mesai teklifi</span>' : '<span class="pill p-info">Duyuru</span>'}${fresh ? '<span class="pill p-bad">Yeni</span>' : ''}<span class="small muted">${esc(m.time)}</span></div>
  <b>${esc(m.title)}</b><p>${esc(m.body)}</p>
  ${m.type === 'mesai' ? `<div class="small"><b class="num">${esc(m.hours)} saat</b> ek çalışma, <b class="num">${fmt(Number(m.pay))}</b> ek ücret</div>` : ''}
  ${foot}${!asEmp ? `<div class="small muted">Alıcılar: ${m.to.length === EMP_IDS.length ? 'Herkes' : names(m.to)}</div>` : ''}</div>`;
}

/* Stok */
function viewStok() {
  const low = lowStock();
  return `<div class="stack-lg">
  <div class="row between wrap"><div><h2>Stok</h2><p class="muted small" style="margin-top:4px">Ürün, adet ve en az tutulacak seviye.</p></div><button class="btn" data-a="stkadd">${ic('plus')} Ürün ekle</button></div>
  ${low.length ? `<div class="callout warn">${ic('alert')}<div><b>${low.length} ürün kritik seviyede:</b> ${esc(low.map((s) => s.name.split(' (')[0]).join(', '))}</div></div>` : ''}
  <div class="card flush">${STOCK.map((s) => {
    const st = s.qty < s.min ? ['p-bad', 'Kritik', 'var(--nar)'] : s.qty < s.min * 1.25 ? ['p-warn', 'Azalıyor', '#D9A441'] : ['p-ok', 'Yeterli', 'var(--yesil)'];
    const pct = Math.min(100, Math.round((s.qty / (s.min * 2)) * 100));
    return `<div class="stk"><div><div class="row wrap" style="gap:8px"><b style="font-weight:600">${esc(s.name)}</b><span class="pill ${st[0]}">${st[1]}</span></div><div class="small muted">En az ${s.min} ${esc(s.unit)}</div><div class="minibar"><i style="width:${pct}%;background:${st[2]}"></i></div></div>
    <div class="stepper"><button data-a="stk" data-id="${s.id}" data-d="-1" aria-label="${esc(s.name)} bir azalt">−</button><b>${s.qty}</b><button data-a="stk" data-id="${s.id}" data-d="1" aria-label="${esc(s.name)} bir artır">+</button></div></div>`;
  }).join('')}</div>
  ${stokLogCard()}</div>`;
}

/* Muhasebe: ortak parçalar */
function ledgerRow(r, mode) {
  const st = rowStatus(r);
  const rc = RECEIPTS.find((f) => f.bank === r.id);
  const pill = { eslesti: ['p-ok', 'Eşleşti'], eksik: ['p-bad', 'Fiş yok'], belgesiz: ['p-warn', 'Belgesiz'], gelir: ['p-info', 'Gelir'], maas: ['p-info', 'Maaş'], tekrar: ['p-mute', 'Tekrarlayan'] }[st];
  let foot = `<span class="pill ${pill[0]}">${pill[1]}</span>`;
  if (rc) foot += `<span class="small muted">${esc(rc.seller)} · ${esc(rc.cat)}</span>`;
  if (rc && ledgerMis(rc.id)) foot += '<span class="pill p-bad">Tabloyla uyuşmuyor</span>';
  else if (r.cat) foot += `<span class="small muted">${esc(r.cat)}</span>`;
  if (st === 'eksik') {
    if (mode === 'muh') foot += r.requested ? '<span class="pill p-warn">Belge istendi</span>' : `<button class="btn sm sec" data-a="request" data-id="${r.id}">Eksik belge iste</button>`;
    else {
      foot += `<button class="btn sm" data-a="upload">${ic('camera', 16)} Fiş ekle</button><button class="btn sm sec" data-a="nodoc" data-id="${r.id}">Fişim yok</button>`;
      if (r.requested) foot += '<span class="pill p-warn">Muhasebeci istedi</span>';
    }
  }
  if (st === 'belgesiz') foot += '<span class="small muted">Otomatik gider yazılmadı. Muhasebeciye danış.</span>';
  if (st === 'tekrar') foot += '<span class="small muted">Her ay aynı tutar, Kais buldu</span>';
  if (r.kind !== 'gelir') { const nn = (NOTES[r.id] || []).length; foot += `<button class="btn sm ghost" data-a="notes" data-id="${r.id}">${ic('chat', 16)} ${nn ? nn + ' not' : 'Soru / not'}</button>`; }
  return `<div class="lrow s-${st}"><div class="ld">${esc(r.date)}</div><div class="lt">${esc(r.desc)}</div><div class="lamt num ${r.amt > 0 ? 'in' : ''}">${r.amt > 0 ? '+' : ''}${fmt(r.amt)}</div><div class="lfoot">${foot}</div></div>`;
}
function ekstreHTML(mode) {
  const f = S.filter;
  const FILT = [['hepsi', 'Hepsi', ROWS.length], ['eksik', 'Fiş yok', countStatus('eksik')], ['eslesti', 'Eşleşti', countStatus('eslesti')], ['belgesiz', 'Belgesiz', countStatus('belgesiz')], ['gelir', 'Gelir', countStatus('gelir')], ['maas', 'Maaş', countStatus('maas')], ['tekrar', 'Tekrarlayan', countStatus('tekrar')]];
  const rows = ROWS.filter((r) => f === 'hepsi' || rowStatus(r) === f);
  return `<div class="stack">
  <div class="callout">${ic('file')}<div><b>${PERIOD} banka ekstresi</b><p style="margin-top:2px">${ROWS.length} işlem okundu: ${countStatus('eslesti')} fişle eşleşti, ${countStatus('eksik')} işlemin belgesi eksik.</p></div></div>
  <div class="chips">${FILT.map((x) => `<button class="chip" data-a="filter" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]} ${x[2]}</button>`).join('')}</div>
  <div class="card ledger">${rows.length ? rows.map((r) => ledgerRow(r, mode)).join('') : '<div class="empty">Bu filtrede işlem yok.</div>'}</div></div>`;
}

function fislerHTML(canApprove) {
  return `<div class="stack"><div class="row between wrap"><p class="muted small">Fişi çek, Kais okusun. Emin değilse sorar, cevabını hatırlar.</p>${canApprove ? `<button class="btn" data-a="upload">${ic('camera')} Fiş ekle</button>` : ''}</div>
  <div class="card flush">${RECEIPTS.slice().reverse().map((f) => receiptRow(f, canApprove)).join('')}</div></div>`;
}



function chartHTML() {
  const t = totals();
  const data = MONTHS.concat([{ m: PREVA, in: t.in, out: t.out }]);
  const max = Math.max(...data.flatMap((d) => [d.in, d.out]));
  const base = 130; const top = 24;
  const bars = data.map((d, i) => {
    const x = 20 + i * 100; const hi = (d.in / max) * (base - top); const ho = (d.out / max) * (base - top);
    return `<rect class="bi" x="${x}" y="${base - hi}" width="38" height="${hi}" rx="3"/><rect class="bo" x="${x + 42}" y="${base - ho}" width="38" height="${ho}" rx="3"/><text x="${x + 19}" y="${base - hi - 5}" text-anchor="middle">${Math.round(d.in / 1000)}K</text><text x="${x + 61}" y="${base - ho - 5}" text-anchor="middle">${Math.round(d.out / 1000)}K</text><text x="${x + 40}" y="${base + 17}" text-anchor="middle">${d.m}</text>`;
  }).join('');
  return `<svg class="ch" viewBox="0 0 320 150" role="img" aria-label="Son üç ayın gelen ve giden toplamları, bin lira"><line x1="8" x2="312" y1="${base}" y2="${base}" stroke="#DCE3EC"/>${bars}</svg><div class="legend"><span><i style="background:var(--cini)"></i>Gelen</span><span><i style="background:var(--turq)"></i>Giden</span><span>Bin ₺, ağustos ve eylül örnek veridir</span></div>`;
}

function ozetV2() {
  const miss = ROWS.filter((r) => rowStatus(r) === 'eksik');
  const missSum = miss.reduce((a, r) => a + -r.amt, 0);
  const ham = RECEIPTS.filter((f) => f.cat === 'Hammadde').reduce((a, f) => a + f.total, 0);
  const hamPct = Math.round((ham / AVG_HAM - 1) * 100);
  const ins = [];
  if (miss.length) ins.push(['bad', 'alert', `${miss.length} işlemin belgesi eksik`, `Belgesiz görünen toplam ${fmt(missSum)}. Belge eklenmezse bu tutarlar gider olarak işlenemeyebilir, muhasebeciyle teyit et.`, miss.map((r) => `${r.date} ${r.desc}: ${fmt(r.amt)}`).join(' · ')]);
  const unk = ROWS.find((r) => r.id === 'b15' && rowStatus(r) !== 'eslesti');
  if (unk) ins.push(['warn', 'alert', 'Yeni bir alıcıya 3.500,00 ₺ havale gitmiş', 'Bu alıcıya daha önce ödeme yapılmamış, fatura ya da açıklama da yok.', `${unk.date}: ${unk.desc}. Önceki 3 ayda aynı alıcıya ödeme: 0.`]);
  if (hamPct > 30) ins.push(['warn', 'trend', `Hammadde gideri ortalamanın %${hamPct} üzerinde`, 'Tedarikçi fiyatı ya da alınan miktar değişmiş olabilir.', `Son 3 ay ortalaması ${fmt0(AVG_HAM)}, ${PERIOD}: ${fmt0(ham)}, fark ${fmt0(ham - AVG_HAM)}.`]);
  const up = UPCOMING.reduce((a, x) => a + x.a, 0);
  return `<div class="stack-lg">
  <div class="card stack"><div><h3>Son üç ay</h3><p class="muted small">Gelen ve giden toplamları</p></div>${chartHTML()}</div>
  <div class="card flush"><div style="padding:16px 16px 6px"><h3>Kais fark etti</h3><p class="muted small">Her uyarının hesabını açıp görebilirsin.</p></div>
  ${ins.map((i) => `<details class="ins"><summary><span class="dot tone-${i[0]}" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:none">${ic(i[1], 18)}</span><span class="grow"><b style="font-weight:600">${esc(i[2])}</b></span></summary><div class="ib"><p>${esc(i[3])}</p><p class="small muted">Hesap: ${esc(i[4])}</p></div></details>`).join('')}</div>
  <div class="card stack"><div class="row between wrap"><div><h3>Önümüzdeki 30 gün</h3><p class="muted small">Geçen aylardan öğrenilen ödemeler, tahmindir.</p></div><b class="num">${fmt0(up)}</b></div>
  <div>${UPCOMING.map((x) => `<div class="logline"><span><span class="muted num">${esc(x.d)}</span> &nbsp; ${esc(x.t)}</span><b class="num">${fmt0(x.a)}</b></div>`).join('')}</div></div>
  ${kdvCard()}</div>`;
}
function epostaHTML() {
  if (!S.mail.on) {
    return `<div class="stack-lg"><div class="card stack"><div><h3>İşyeri e-postanı bağla</h3><p class="muted" style="margin-top:4px">Kais gelen kutundaki fatura ve fişleri bulup muhasebeye ekler, ekstredeki işlemlerle eşleştirir. İstersen müşterilerine kampanya ve ödeme hatırlatması da buradan gider.</p></div>
    <div class="stack"><div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Faturalar kendiliğinden gelir</b><div class="small muted">Tedarikçi e-faturaları ve e-arşiv faturaları belge olarak eklenir.</div></div></div>
    <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Eksik belge azalır</b><div class="small muted">Ekstrede fişi olmayan işlemler e-postadan tamamlanır.</div></div></div>
    <div class="check"><span class="dot tone-ok">${ic('check', 16)}</span><div><b style="font-weight:600">Müşterilerle iletişim</b><div class="small muted">Alacak hatırlatması ve kampanya e-postası işyeri adresinden gider.</div></div></div></div>
    <button class="btn" style="align-self:flex-start" data-a="mailconnect">${ic('mail')} E-postayı bağla</button></div></div>`;
  }
  const docs = MAILDOCS.map((d) => ({ d, st: mailStatus(d) }));
  const nNew = docs.filter((x) => x.st === 'yeni').length;
  return `<div class="stack-lg"><div class="card stack"><div class="row between wrap"><div><h3>${esc(S.mail.addr)}</h3><p class="muted small">${esc(S.mail.provider)} · bağlı · müşterilere gönderme ${S.mail.send ? 'açık' : 'kapalı'}</p></div><span class="pill p-ok">Bağlı</span></div>
  <p class="small muted">Son 90 günde 48 e-posta tarandı, ${docs.filter((x) => x.st !== 'atla').length} belge bulundu.</p>
  <div class="row wrap">${nNew ? `<button class="btn" data-a="mailall">${nNew} belgeyi muhasebeye ekle</button>` : '<span class="pill p-ok">Tüm belgeler işlendi</span>'}<button class="btn sec" data-a="maildisc">Bağlantıyı kaldır</button></div></div>
  <div class="card flush">${docs.map(({ d, st }) => {
    const bank = d.bank ? ROWS.find((r) => r.id === d.bank) : null;
    const pill = st === 'yeni' ? '<span class="pill p-info">Yeni</span>' : st === 'var' ? '<span class="pill p-mute">Zaten kayıtlı</span>' : '<span class="pill p-mute">Belge değil, atlandı</span>';
    return `<div class="rrow"><div><b style="font-weight:600">${esc(d.from)}</b><div class="small muted">${esc(d.subj)} · ${esc(d.date)}</div></div><div class="num" style="font-weight:600">${d.total != null ? fmt(d.total) : ''}</div>
    <div class="rfoot">${pill}${bank && st === 'yeni' ? `<span class="small muted">${ic('check', 14)} ${esc(bank.date)} ${esc(bank.desc)} işlemiyle eşleşecek</span>` : ''}${st === 'yeni' ? `<button class="btn sm" data-a="mailadd" data-id="${d.id}">Ekle</button>` : ''}</div></div>`;
  }).join('')}</div></div>`;
}
function alacakHTML() {
  const list = RECV.filter((a) => !a.paid);
  const tot = list.reduce((x, a) => x + a.amt, 0);
  const late = list.filter((a) => a.days > 0);
  return `<div class="stack-lg"><div class="kpis"><div class="kpi"><div class="l">Toplam alacak</div><div class="v num">${fmt0(tot)}</div></div><div class="kpi"><div class="l">Vadesi geçen</div><div class="v num">${fmt0(late.reduce((x, a) => x + a.amt, 0))}</div></div><div class="kpi"><div class="l">Kişi</div><div class="v num">${list.length}</div></div></div>
  <div class="card flush">${list.length ? list.map((a) => {
    const p = a.days > 0 ? `<span class="pill p-bad">${a.days} gün gecikmiş</span>` : a.days === 0 ? '<span class="pill p-warn">Vadesi bugün</span>' : `<span class="pill p-warn">Vadesi ${-a.days === 1 ? 'yarın' : -a.days + ' gün sonra'}</span>`;
    return `<div class="rrow"><div><b style="font-weight:600">${esc(a.name)}</b><div class="small muted">${esc(a.note)} · ${esc(a.email)}</div></div><div class="num" style="font-weight:600">${fmt(a.amt)}</div>
    <div class="rfoot">${p}${a.reminded ? `<span class="pill p-info">Hatırlatıldı · ${esc(a.reminded)}</span>` : ''}<button class="btn sm" data-a="remind" data-id="${a.id}">${ic('send', 16)} ${a.reminded ? 'Tekrar hatırlat' : 'Hatırlatma gönder'}</button><button class="btn sm sec" data-a="paid" data-id="${a.id}">Tahsil edildi</button></div></div>`;
  }).join('') : '<div class="empty">Açık alacak yok.</div>'}</div>
  ${mailReady() ? '' : `<div class="callout">${ic('mail')}<div>Hatırlatmayı işyeri adresinden göndermek için e-postanı bağla. Metni göndermeden önce sen düzenlersin.</div></div>`}</div>`;
}
function viewMusteri() {
  const cur = S.sub.musteri;
  const body = cur === 'liste' ? musteriListe() : kampanyaHTML();
  return `<div class="stack-lg">${seg('musteri', [['kampanya', 'Toplu e-posta'], ['liste', 'Müşteri listesi']], cur)}${body}</div>`;
}
const iysPill = (v) => ({ onayli: '<span class="pill p-ok">İzin verdi</span>', yok: '<span class="pill p-warn">İzin yok</span>', ret: '<span class="pill p-bad">Çıktı</span>' }[v]);
function segList(seg) {
  return CUSTOMERS.filter((c) => (seg === 'all' ? true : seg === 'recent' ? c.last <= 30 : c.visits >= 8));
}
function musteriListe() {
  return `<div class="card flush">${CUSTOMERS.map((c) => `<div class="emp"><span class="avatar" style="background:var(--cini);width:40px;height:40px">${esc(ini(c.name))}</span><div class="grow"><b style="font-weight:600">${esc(c.name)}</b><div class="small muted">${esc(c.email)}</div></div>${iysPill(c.iys)}<div class="meta">${c.visits} ziyaret · son ziyaret ${c.last} gün önce</div></div>`).join('')}</div>
  <div class="callout">${ic('info')}<div>Müşteriler siparişlerden ve kasadan kendiliğinden listeye girer. E-posta izni olmayanlara toplu e-posta gitmez.</div></div>`;
}


/* Muhasebeci */
function viewDonemV2() {
  const miss = countStatus('eksik');
  const total = ROWS.filter((r) => ['gider', 'tekrar'].includes(r.kind)).length;
  const pct = total ? Math.round(((total - miss) / total) * 100) : 100;
  const t = totals();
  const cl = CLIENTS.find((c) => c.id === S.client);
  return `<div class="stack-lg">
  <div><h2>Müşterilerin</h2><p class="muted" style="margin-top:4px">${PERIOD} dönemi</p></div>
  <div class="stack">${CLIENTS.map((c) => {
    const p = c.id === 'c1' ? pct : c.pct;
    const o = c.id === 'c1' ? miss : c.open;
    return `<button class="client" data-a="client" data-id="${c.id}" aria-pressed="${S.client === c.id}"><span class="grow"><b style="font-weight:600">${esc(c.name)}</b><span class="small muted" style="display:block">${esc(c.sector)} · ${o ? o + ' eksik belge' : 'belgeler tam'}</span><span class="prog" style="display:block"><i style="width:${p}%;display:block"></i></span></span><span class="num" style="font-weight:600">%${p}</span></button>`;
  }).join('')}</div>
  ${cl.id === 'c1' ? `<div class="card stack"><h3>${esc(cl.name)}</h3>
    <div class="kpis"><div class="kpi"><div class="l">İşlem</div><div class="v num">${ROWS.length}</div></div><div class="kpi"><div class="l">Eksik belge</div><div class="v num">${miss}</div></div><div class="kpi"><div class="l">Onay bekleyen</div><div class="v num">${openReceipts(true).length}</div></div></div>
    <p class="muted small">Gelen ${fmt0(t.in)} · giden ${fmt0(t.out)}</p>
    <div class="row wrap"><button class="btn" data-a="nav" data-v="belgeler">Belgelere bak</button><button class="btn sec" data-a="nav" data-v="paket">Aylık paket</button></div></div>
    ${Object.keys(NOTES).length ? `<div class="card stack"><h3>Notlar ve sorular</h3>${Object.keys(NOTES).map((id) => { const r = ROWS.find((x) => x.id === id); const a = NOTES[id]; const last = a[a.length - 1]; return `<div class="logline"><span><b style="font-weight:600">${esc(r.desc)}</b><span class="small muted" style="display:block">${esc(byId(last.by).name.split(' ')[0])}: ${esc(last.text)}</span></span><button class="btn sm sec" data-a="notes" data-id="${id}">Aç</button></div>`; }).join('')}</div>` : ''}
    ${kdvCard()}` : `<div class="card empty">Bu müşterinin ayrıntıları prototipte yok.</div>`}
  </div>`;
}

function viewPaket() { return paketHTML('muhasebeci'); }

/* Çalışan: masraf */
function viewMasraf() {
  const mine = RECEIPTS.filter((f) => f.by === S.user.id).reverse();
  return `<div class="stack-lg"><div class="row between wrap"><div><h2>Masraf fişlerim</h2><p class="muted small" style="margin-top:4px">Fişi çek, işveren onaylasın.</p></div><button class="btn" data-a="upload">${ic('camera')} Fiş ekle</button></div>
  <div class="card flush">${mine.length ? mine.map((f) => receiptRow(f, false)).join('') : '<div class="empty">Henüz fiş yüklemedin. "Fiş ekle" ile başla.</div>'}</div></div>`;
}

/* Ayarlar */
function viewAyarlar() {
  const tg = (k, title, sub) => `<div class="toggle"><div><b style="font-weight:600">${esc(title)}</b><div class="small muted">${esc(sub)}</div></div><button class="sw" role="switch" aria-checked="${S.settings[k]}" aria-label="${esc(title)}" data-a="toggle" data-k="${k}"></button></div>`;
  return `<div class="stack-lg">
  <div class="card flush"><div style="padding:16px 16px 0"><h3>Kullanıcılar ve roller</h3><p class="muted small">Rol değişince kişi bir sonraki girişte yeni ekranı görür.</p></div>
  ${USERS.map((u) => `<div class="emp">${avatar(u, 40)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">${esc(u.email)}</div></div><select data-ch="role" data-id="${u.id}" aria-label="${esc(u.name)} rolü" style="width:auto;min-height:40px" ${u.role === 'patron' ? 'disabled' : ''}>${['patron', 'mudur', 'muhasebeci', 'calisan'].map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select></div>`).join('')}</div>
  <div class="card"><h3>Yetkiler</h3>
  ${tg('mudurRanking', 'Müdür aylık sıralamayı görsün', 'Kapalıyken yalnızca patron bireysel sıralamayı görür.')}
  ${tg('mudurMaas', 'Müdür çalışan maaşını görsün', 'Kapalıyken müdür çalışan detayında maaş ve ödemeleri görmez.')}
  ${tg('reminders', 'Mola hatırlatmaları', 'Çalışana en fazla iki bildirim gider: bitmeden 2 dk önce ve bitişte.')}</div>
  <div class="card"><h3>Kais'in öğrendikleri</h3><p class="muted small">Sorduğun şeyleri hatırlar ve bir daha sormaz. İstediğini unutturabilirsin.</p>
  ${RULES.map((r, i) => `<div class="toggle"><span><b style="font-weight:600">${esc(r.k)}</b> <span class="muted">→ ${esc(r.v)}</span></span><button class="btn sm sec" data-a="forget" data-i="${i}">Unut</button></div>`).join('') || '<p class="muted" style="margin-top:8px">Henüz bir şey öğrenmedi.</p>'}</div>
  <div class="card"><h3>Veri ve gizlilik</h3><p class="muted small" style="margin-top:4px">Çalışanlara kayıtların neden tutulduğu açıkça gösterilir. Saklama süresi iş hukuku danışmanıyla belirlenir. Kamera ve biyometrik takip kullanılmaz. Konum yalnızca girişte dükkâna yakınlığı doğrulamak için bir kez kontrol edilir, kaydedilmez.</p></div></div>`;
}

/* ---------- modal ---------- */
function renderModalV2() {
  const root = $('#modal-root');
  if (!root) return;
  const m = S.modal;
  if (!m) { root.innerHTML = ''; return; }
  if (m.type === 'menu') {
    const u = S.user;
    const more = NAV[u.role].filter((n) => n[3]);
    root.innerHTML = sheet('Menü', `<div class="row">${avatar(u, 44)}<div><b>${esc(u.name)}</b><div class="small muted">${esc(ROLE_LABEL[u.role])} · ${esc(BIZ)}</div></div></div>
    ${more.map((n) => `<button class="btn sec block" data-a="nav" data-v="${n[0]}">${ic(n[2])} ${esc(n[1])}</button>`).join('')}
    <button class="btn sec block" data-a="logout">${ic('logout')} Çıkış yap</button><p class="small muted">Prototip sürüm. Ekrandaki veriler örnektir.</p>`);
  } else if (m.type === 'upload') {
    if (m.step === 'pick') {
      root.innerHTML = sheet('Fiş ekle', `<label class="drop" for="file-in">${ic('camera', 30)}<b>Fişin fotoğrafını çek ya da dosya seç</b><span class="small muted">JPG, PNG veya PDF</span></label>
      <input class="sr" id="file-in" type="file" accept="image/*,application/pdf" data-ch="file">
      <button class="btn sec block" data-a="sample">Örnek fiş kullan</button><p class="small muted">Prototipte okuma sonucu örnektir. Gerçek sürümde fişi yapay zekâ okur.</p>`);
    } else if (m.step === 'reading') {
      root.innerHTML = sheet('Fiş okunuyor', `<div class="spin" role="status" aria-label="Okunuyor"></div><p class="muted right" style="text-align:center">Satıcı, tarih, KDV ve toplam çıkarılıyor.</p>`);
    } else if (m.step === 'ask') {
      const s = m.sample;
      root.innerHTML = sheet('Kais bir şey soruyor', `<div class="callout warn">${ic('info')}<div><b>${esc(s.seller)}</b>, ${fmt(s.total)}<p style="margin-top:4px">Bu bir market alışverişi mi, iş yemeği mi? Cevabını hatırlayıp bir daha sormam.</p></div></div>
      <button class="btn block" data-a="answer" data-v="Hammadde">Market, işletme stoğu</button><button class="btn sec block" data-a="answer" data-v="İş yemeği">İş yemeği</button>`);
    } else if (m.step === 'result') {
      const s = m.sample;
      const bank = s.bank ? ROWS.find((r) => r.id === s.bank) : null;
      const f = { total: s.total, rate: s.rate };
      root.innerHTML = sheet('Okuma sonucu', `<div><div class="row between small muted"><span>Okuma güveni</span><span class="num">%${Math.round(s.conf * 100)}</span></div><div class="conf" style="margin-top:6px"><i style="width:${s.conf * 100}%"></i></div></div>
      <dl class="kv"><dt>Satıcı</dt><dd>${esc(s.seller)}</dd><dt>Tarih</dt><dd>${esc(s.date)}</dd><dt>KDV</dt><dd class="num">%${s.rate}${s.rate ? ' · ' + fmt(kdv(f)) : ''}</dd><dt>Toplam</dt><dd class="num">${fmt(s.total)}</dd>
      <dt><label for="mcat">Kategori</label></dt><dd><select id="mcat" data-ch="mcat">${CATS.map((c) => `<option ${c === m.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></dd></dl>
      ${bank ? `<div class="callout">${ic('check')}<div>Ekstredeki <b>${esc(bank.date)} · ${esc(bank.desc)}</b> işlemiyle eşleşti.</div></div>` : '<div class="callout">' + ic('info') + '<div>Ekstrede eşleşen işlem yok, nakit harcama olabilir.</div></div>'}
      <p class="small muted">${S.user.role === 'calisan' ? 'Fiş işverene onay için gider.' : 'Kaydedince fiş muhasebeciye anında bildirim olarak gider. Gider, muhasebeci onaylayınca tabloya yazılır.'}</p>
      <div class="row"><button class="btn grow" data-a="savereceipt">${S.user.role === 'calisan' ? 'Patrona gönder' : 'Muhasebeciye gönder'}</button><button class="btn sec" data-a="closemodal">Vazgeç</button></div>`);
    }
  } else if (m.type === 'mail') {
    root.innerHTML = sheet('E-postanı bağla', `<div class="field"><label for="mail-prov">E-posta sağlayıcısı</label><select id="mail-prov"><option>Gmail</option><option>Outlook / Microsoft 365</option><option>Diğer (IMAP)</option></select></div>
    <div class="field"><label for="mail-addr">İşyeri e-postası</label><input id="mail-addr" type="email" placeholder="muhasebe@isyerim.com"></div>
    <div class="stack"><b style="font-weight:600">Kais'in izinleri</b>
    <label class="row" style="align-items:flex-start"><input type="checkbox" checked disabled> <span>Gelen kutusundaki fatura ve fiş e-postalarını oku<span class="small muted" style="display:block">Kişisel yazışmalar işlenmez.</span></span></label>
    <label class="row" style="align-items:flex-start"><input id="mail-send" type="checkbox" checked> <span>Müşterilere e-posta gönder<span class="small muted" style="display:block">Kampanya ve ödeme hatırlatması için. İstediğin an kapatırsın.</span></span></label></div>
    <div class="err" id="merr" role="alert"></div><button class="btn block" data-a="mailsave">İzin ver ve bağlan</button><p class="small muted">Prototipte gerçek bağlantı kurulmaz. Gelen kutusu örnek veridir.</p>`);
  } else if (m.type === 'remind') {
    const a = RECV.find((x) => x.id === m.id);
    root.innerHTML = sheet('Ödeme hatırlatması', `<dl class="kv"><dt>Alıcı</dt><dd>${esc(a.name)}</dd><dt>Gönderen</dt><dd>${esc(S.mail.addr)}</dd><dt>Tutar</dt><dd class="num">${fmt(a.amt)}</dd></dl>
    <div class="field"><label for="remind-text">Mesaj</label><textarea id="remind-text" style="min-height:170px">${esc(remindDraft(a))}</textarea></div>
    <button class="btn block" data-a="remindsend" data-id="${a.id}">${ic('send')} Gönder</button>`);
  } else if (m.type === 'notes') {
    const arr = NOTES[m.id] || [];
    const r = ROWS.find((x) => x.id === m.id);
    root.innerHTML = sheet('Not ve sorular', `<div class="small muted">${esc(r.date)} · ${esc(r.desc)} · ${fmt(r.amt)}</div>${arr.length ? thread(arr) : '<p class="muted">Henüz not yok. Soru sorabilir ya da açıklama yazabilirsin.</p>'}
    <div class="field"><label for="note-text">Mesajın</label><textarea id="note-text" placeholder="Örnek: Bu ödeme kime yapıldı?"></textarea></div><button class="btn block" data-a="notesend" data-id="${m.id}">${ic('send')} Gönder</button>`);
  } else if (m.type === 'nodoc') {
    root.innerHTML = sheet('Fişim yok', `<div class="callout warn">${ic('alert')}<div>Bu işlem otomatik gider yazılmaz. "Belgesiz" olarak ayrılır. Belgesiz harcamanın gider yazılıp yazılamayacağı vergi açısından sorun olabilir, muhasebecine danış.</div></div>
    <button class="btn block" data-a="nodocok" data-id="${m.id}">Belgesiz olarak işaretle</button><button class="btn sec block" data-a="closemodal">Vazgeç</button>`);
  } else if (m.type === 'stkadd') {
    root.innerHTML = sheet('Ürün ekle', `<div class="field"><label for="sn">Ürün adı</label><input id="sn" type="text" placeholder="Örnek: Çay (1 kg)"></div>
    <div class="row"><div class="field grow"><label for="sq">Adet</label><input id="sq" type="number" min="0" value="10"></div><div class="field grow"><label for="sm">En az</label><input id="sm" type="number" min="0" value="5"></div></div>
    <div class="err" id="serr" role="alert"></div><button class="btn block" data-a="stksave">Ekle</button>`);
  }
}

/* ---------- eylemler ---------- */
H.backdrop = (el, e) => { if (e.target === el) H.closemodal(); };
H.closemodal = () => { S.modal = null; renderModal(); };
H.demo = (el) => loginAs(byId(el.dataset.id));
H.logout = () => { S.user = null; S.modal = null; S.loginErr = ''; render(); };
H.menu = () => { S.modal = { type: 'menu' }; renderModal(); };
H.nav = (el) => {
  S.modal = null;
  const v = el.dataset.v;
  if (el.dataset.s) {
    if (v === 'muhasebe') S.sub.muhasebe = el.dataset.s;
    if (v === 'ekip') S.sub.ekip = el.dataset.s;
    if (el.dataset.s === 'ekstre') S.filter = 'eksik';
    if (v === 'ekip' && el.dataset.s === 'siralama') S.openRank = EMP_IDS.filter((id) => EMPDATA[id].itiraz && EMPDATA[id].itiraz.unreadBoss);
  }
  go(v);
};
H.sub = (el) => {
  if (el.dataset.g === 'msgtype') { snap(); S.draft.type = el.dataset.v; render(); return; }
  S.sub[el.dataset.g] = el.dataset.v;
  if (el.dataset.g === 'muhasebe' || el.dataset.g === 'belgeler') S.filter = 'hepsi';
  render();
};
H.filter = (el) => { S.filter = el.dataset.v; render(); };
H.insight = () => { S.insightOpen = !S.insightOpen; render(); };
H.client = (el) => { S.client = el.dataset.id; render(); };

function loginAs(u) {
  S.user = u;
  S.view = u.role === 'muhasebeci' ? 'donem' : 'bugun';
  S.modal = null;
  render();
  if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
}

/* fiş yükleme */
function nextSample() {
  if (S.user.role === 'calisan') { const s = EMP_SAMPLES[S.empIdx % EMP_SAMPLES.length]; S.empIdx++; return s; }
  const taken = RECEIPTS.map((f) => f.bank);
  return SAMPLES.find((x) => !taken.includes(x.bank)) || GENERIC[0];
}
H.upload = () => { if (locked()) return; S.modal = { type: 'upload', step: 'pick' }; renderModal(); };
function startRead() {
  const s = nextSample();
  S.modal = { type: 'upload', step: 'reading', sample: s, cat: s.cat };
  renderModal();
  setTimeout(() => {
    if (!S.modal || S.modal.step !== 'reading') return;
    S.modal.step = s.ask ? 'ask' : 'result';
    renderModal();
  }, 1300);
}
H.sample = startRead;
H.answer = (el) => {
  const m = S.modal;
  m.cat = el.dataset.v;
  if (!RULES.some((r) => r.k === m.sample.seller)) RULES.unshift({ k: m.sample.seller, v: m.cat });
  m.step = 'result';
  renderModal();
};
H.savereceipt = () => {
  const m = S.modal;
  const s = m.sample;
  const isEmp = S.user.role === 'calisan';
  RECEIPTS.push({ id: 'f' + ++seq, seller: s.seller, date: s.date, total: s.total, rate: s.rate, cat: m.cat || 'Diğer', status: isEmp ? 'bekliyor' : 'onayli', by: S.user.id, bank: isEmp ? null : s.bank || null });
  const bank = !isEmp && s.bank ? ROWS.find((r) => r.id === s.bank) : null;
  S.modal = null;
  render();
  toast(bank ? `Fiş kaydedildi. Ekstredeki ${bank.date} işlemiyle eşleşti.` : isEmp ? 'Fiş işverene onay için gitti.' : 'Fiş kaydedildi.', 'ok');
};
H.approve = (el) => { if (locked()) return; const f = RECEIPTS.find((x) => x.id === el.dataset.id); f.status = 'onayli'; render(); toast('Fiş onaylandı.'); };
H.reject = (el) => { if (locked()) return; const f = RECEIPTS.find((x) => x.id === el.dataset.id); f.status = 'reddedildi'; render(); toast('Fiş reddedildi.'); };
H.nodoc = (el) => { if (locked()) return; S.modal = { type: 'nodoc', id: el.dataset.id }; renderModal(); };
H.nodocok = (el) => { ROWS.find((r) => r.id === el.dataset.id).belgesiz = true; S.modal = null; render(); toast('İşlem "belgesiz" olarak işaretlendi. Gider yazılmadı.', 'warn'); };
H.request = (el) => { if (locked()) return; ROWS.find((r) => r.id === el.dataset.id).requested = true; render(); toast('Patrona belge isteği gitti.'); };

/* ekip */
H.clockin = () => { const a = ATT[S.user.id]; a.state = 'working'; a.inAt = hhmm(new Date()); a.log.push(['Giriş', a.inAt]); render(); toast('Giriş kaydedildi: ' + a.inAt, 'ok'); };
H.breakstart = () => { const a = ATT[S.user.id]; a.state = 'break'; a.bstart = Date.now(); a.n1 = a.n2 = false; a.log.push(['Mola başladı', hhmm(new Date())]); render(); };
H.breakend = () => {
  const a = ATT[S.user.id];
  const min = Math.max(1, Math.round((Date.now() - a.bstart) / 60000));
  a.breakMin += min; a.state = 'working';
  a.log.push(['Döndüm', hhmm(new Date()) + ' · ' + min + ' dk mola']);
  render();
  toast(`Dönüşün kaydedildi. Bu mola ${min} dk.`, 'ok');
};
H.clockout = () => { const a = ATT[S.user.id]; a.state = 'out'; a.log.push(['Çıkış', hhmm(new Date())]); render(); toast('Mesaiden çıkışın kaydedildi.', 'ok'); };
H.attok = (el) => { ATT[el.dataset.id].state = 'working'; ATT[el.dataset.id].note = ''; delete ATT[el.dataset.id].fix; render(); toast('Mola dönüşü onaylandı.', 'ok'); };
H.attfix = (el) => { const a = ATT[el.dataset.id]; if (!a) return; a.fix = { at: Date.now() }; render(); toast(`${byId(el.dataset.id).name.split(' ')[0]}'e düzeltme talebi gönderildi. Cevap gelince tekrar görünür.`, 'ok'); };
H.attre = () => { const a = ATT[S.user.id]; if (!a) return; delete a.fix; render(); toast('Düzeltmen tekrar onaya gönderildi.', 'ok'); };
const itText = (id) => { const t = document.getElementById('itm-' + id); return t ? t.value.trim() : ''; };
H.itask = (el) => {
  const id = el.dataset.id; const t = itText(id);
  if (!t) { toast('Önce sorunu yaz.', 'bad'); return; }
  const it = EMPDATA[id].itiraz;
  it.thread.push({ by: S.user.id, text: t, time: nowT() }); it.status = 'cevap bekleniyor'; it.unreadEmp = true; it.unreadBoss = false;
  S.openRank = [id]; render(); toast(`${byId(id).name.split(' ')[0]}'e soru gönderildi. Bildirim olarak görür.`, 'ok');
};
H.itok = (el) => {
  const id = el.dataset.id; const d = EMPDATA[id]; const t = itText(id);
  d.itiraz.thread.push({ by: S.user.id, text: t || 'İtirazın kabul edildi. Geç kalma kaydın bir azaltıldı, puanın güncellendi.', time: nowT() });
  d.itiraz.status = 'kabul edildi'; d.itiraz.unreadEmp = true; if (d.late > 0) d.late -= 1;
  S.openRank = [id]; render(); toast('İtiraz kabul edildi, puan güncellendi.', 'ok');
};
H.itno = (el) => {
  const id = el.dataset.id; const t = itText(id);
  if (!t) { toast('Reddetmek için gerekçeni yaz.', 'bad'); return; }
  const it = EMPDATA[id].itiraz;
  it.thread.push({ by: S.user.id, text: t, time: nowT() }); it.status = 'reddedildi'; it.unreadEmp = true;
  S.openRank = [id]; render(); toast('Gerekçeyle reddedildi. Çalışan bildirim alır, cevap yazabilir.');
};
H.itsend = () => {
  const t = ((document.getElementById('itx') || {}).value || '').trim();
  if (!t) { toast('Önce yazını gir.', 'bad'); return; }
  const d = EMPDATA[S.user.id];
  if (!d.itiraz) d.itiraz = { thread: [], status: 'inceleniyor', unreadBoss: true, unreadEmp: false };
  d.itiraz.thread.push({ by: S.user.id, text: t, time: nowT() }); d.itiraz.status = 'inceleniyor'; d.itiraz.unreadBoss = true;
  render(); toast('Mesajın işverene gitti.', 'ok');
};

/* duyuru */
function snap() {
  const g = (id) => document.getElementById(id);
  if (!g('d-title')) return;
  S.draft.title = g('d-title').value;
  S.draft.body = g('d-body').value;
  if (g('d-hours')) S.draft.hours = g('d-hours').value;
  if (g('d-pay')) S.draft.pay = g('d-pay').value;
  S.draft.sel = Array.from(document.querySelectorAll('input[name=rcp]:checked')).map((i) => i.value);
}
H.aud = (el) => { snap(); S.draft.aud = el.dataset.v; render(); };
H.sendmsg = () => {
  snap();
  const d = S.draft;
  if (!d.title.trim() || !d.body.trim()) { toast('Başlık ve mesaj boş olamaz.', 'bad'); return; }
  const to = d.aud === 'all' ? EMP_IDS.slice() : d.sel.slice();
  if (!to.length) { toast('En az bir alıcı seç.', 'bad'); return; }
  const m = { id: 'm' + ++seq, type: d.type, title: d.title.trim(), body: d.body.trim(), to, time: 'Bugün ' + hhmm(new Date()), reads: [], res: {} };
  if (d.type === 'mesai') {
    if (!(Number(d.hours) > 0) || !(Number(d.pay) >= 0)) { toast('Süre ve ücreti kontrol et.', 'bad'); return; }
    m.hours = d.hours; m.pay = d.pay;
  }
  MSGS.push(m);
  S.draft = newDraft();
  render();
  toast(d.type === 'mesai' ? `Mesai teklifi ${to.length} kişiye gitti.` : `Duyuru ${to.length} kişiye gitti.`, 'ok');
};
H.respond = (el) => { const m = MSGS.find((x) => x.id === el.dataset.id); m.res[S.user.id] = el.dataset.v; render(); toast(el.dataset.v === 'kabul' ? 'Teklifi kabul ettin.' : 'Teklifi reddettin.', 'ok'); };

/* stok */
H.stk = (el) => { const s = STOCK.find((x) => x.id === el.dataset.id); s.qty = Math.max(0, s.qty + Number(el.dataset.d)); render(); };
H.stkadd = () => { S.modal = { type: 'stkadd' }; renderModal(); };
H.stksave = () => {
  const n = document.getElementById('sn').value.trim();
  const q = Number(document.getElementById('sq').value);
  const mn = Number(document.getElementById('sm').value);
  if (!n) { document.getElementById('serr').textContent = 'Ürün adını yaz.'; return; }
  STOCK.push({ id: 's' + ++seq, name: n, unit: 'adet', qty: q >= 0 ? q : 0, min: mn >= 0 ? mn : 0 });
  S.modal = null; render(); toast('Ürün eklendi.', 'ok');
};
H.invoicein = () => {
  S.invoiceIn = true;
  STOCK.find((s) => s.id === 's2').qty += 60;
  STOCK.find((s) => s.id === 's5').qty += 500;
  render(); toast('Metro faturasından 2 kalem stoğa girdi.', 'ok');
};

/* e-posta, alacak, not, kampanya */
const remindDraft = (a) => {
  const ad = a.name.split(' ')[0];
  const when = a.days > 0 ? `vadesi ${a.days} gün önce geçti` : a.days === 0 ? 'vadesi bugün doluyor' : 'vadesi yarın doluyor';
  return `Merhaba ${ad},\n\n${a.note} için ${fmt(a.amt)} tutarındaki ödemenin ${when}. Ödemeyi yaptıysan bu mesajı dikkate alma, yapmadıysan en kısa sürede dönüş yaparsan seviniriz.\n\nİyi çalışmalar,\n${BIZ}`;
};
H.mailconnect = () => { S.modal = { type: 'mail' }; renderModal(); };
H.mailsave = () => {
  const addr = document.getElementById('mail-addr').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(addr)) { document.getElementById('merr').textContent = 'Geçerli bir e-posta adresi yaz.'; return; }
  S.mail = { on: true, provider: document.getElementById('mail-prov').value, addr, send: document.getElementById('mail-send').checked };
  S.modal = null; S.sub.muhasebe = 'eposta'; render(); toast('E-posta bağlandı. Gelen kutusu tarandı.', 'ok');
};
H.maildisc = () => { S.mail = { on: false, provider: '', addr: '', send: true }; render(); toast('Bağlantı kaldırıldı.'); };

H.mailadd = (el) => {
  if (locked()) return;
  const d = MAILDOCS.find((x) => x.id === el.dataset.id);
  addMailDoc(d); render();
  const b = d.bank ? ROWS.find((r) => r.id === d.bank) : null;
  toast(b ? `Eklendi. Ekstredeki ${b.date} işlemiyle eşleşti.` : 'Belge eklendi.', 'ok');
};
H.mailall = () => {
  if (locked()) return;
  const list = MAILDOCS.filter((d) => mailStatus(d) === 'yeni');
  list.forEach(addMailDoc); render(); toast(`${list.length} belge eklendi, ekstreyle eşleşti.`, 'ok');
};
H.remind = (el) => {
  if (!mailReady()) { toast('Önce e-postanı bağla.', 'warn'); S.sub.muhasebe = 'eposta'; render(); return; }
  S.modal = { type: 'remind', id: el.dataset.id }; renderModal();
};
H.remindsend = (el) => {
  const a = RECV.find((x) => x.id === el.dataset.id);
  a.reminded = nowT(); S.modal = null; render(); toast(`Hatırlatma ${a.name}'e gönderildi.`, 'ok');
};
H.paid = (el) => { RECV.find((x) => x.id === el.dataset.id).paid = true; render(); toast('Alacak tahsil edildi olarak işaretlendi.', 'ok'); };
H.notes = (el) => { S.modal = { type: 'notes', id: el.dataset.id }; renderModal(); };
H.notesend = (el) => {
  const t = (document.getElementById('note-text').value || '').trim();
  if (!t) { toast('Önce mesajını yaz.', 'bad'); return; }
  const id = el.dataset.id;
  (NOTES[id] = NOTES[id] || []).push({ by: S.user.id, text: t, time: nowT() });
  render(); toast('Mesaj gönderildi.', 'ok');
};
function snapCamp() {
  const a = document.getElementById('c-subj'); const b = document.getElementById('c-body');
  if (a) S.camp.subj = a.value;
  if (b) S.camp.body = b.value;
}
H.camptpl = (el) => { const t = TPL[Number(el.dataset.i)]; S.camp.subj = t.subj; S.camp.body = t.body; render(); };
H.campseg = (el) => { snapCamp(); S.camp.seg = el.dataset.v; render(); };
H.campsend = () => {
  snapCamp();
  const c = S.camp;
  const ok = segList(c.seg).filter((x) => x.iys === 'onayli');
  if (!c.subj.trim() || !c.body.trim()) { toast('Konu ve mesajı yaz.', 'bad'); return; }
  if (!ok.length) { toast('Bu grupta izinli müşteri yok.', 'bad'); return; }
  if (!mailReady()) { toast('Önce e-postanı bağla.', 'warn'); S.view = 'muhasebe'; S.sub.muhasebe = 'eposta'; render(); return; }
  CAMPAIGNS.push({ subj: c.subj.trim(), date: 'Bugün', sent: ok.length, open: 'yeni gitti' });
  S.camp = { seg: 'all', subj: '', body: '' }; render(); toast(`Kampanya ${ok.length} kişiye gönderildi.`, 'ok');
};

/* paket ve ayarlar */
H.copycsv = () => {
  const t = csvText();
  const done = () => toast('CSV kopyalandı.', 'ok');
  try { navigator.clipboard.writeText(t).then(done, () => toast('Kopyalanamadı. Metni seçip kopyala.', 'warn')); }
  catch (e) { toast('Kopyalanamadı. Metni seçip kopyala.', 'warn'); }
};
H.sendpkg = () => { S.sent = new Date().toLocaleDateString('tr-TR') + ' ' + hhmm(new Date()); render(); toast('Paket muhasebeciye gönderildi.', 'ok'); };
H.closeperiod = () => { S.closed = true; render(); toast(`${PERIOD} dönemi kapatıldı.`, 'ok'); };
H.toggle = (el) => { S.settings[el.dataset.k] = !S.settings[el.dataset.k]; render(); };
H.forget = (el) => { RULES.splice(Number(el.dataset.i), 1); render(); };

/* ---------- olaylar ---------- */
function onClick(e) {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = H[el.dataset.a];
  if (fn) fn(el, e);
}

function onInput(e) {
  const el = e.target;
  if (el.dataset && el.dataset.ch === 'w') {
    S.weights[el.dataset.k] = Number(el.value);
    const lab = document.getElementById('wv-' + el.dataset.k);
    if (lab) lab.textContent = '%' + el.value;
    const reg = document.getElementById('rank-region');
    if (reg) reg.innerHTML = rankingHTML();
  }
}
function onSubmit(e) {
  if (e.target.id !== 'login') return;
  e.preventDefault();
  const em = document.getElementById('em').value.trim().toLowerCase();
  const pw = document.getElementById('pw').value;
  const u = USERS.find((x) => x.email === em);
  if (!u || pw !== 'demo1234') {
    S.loginErr = 'E-posta ya da şifre hatalı. Aşağıdaki demo hesaplardan birini seçebilirsin.';
    document.getElementById('lerr').textContent = S.loginErr;
    return;
  }
  loginAs(u);
}

function tick() {
  if (!S.user || !ATT[S.user.id]) return;
  const a = ATT[S.user.id];
  if (a.state !== 'break') return;
  const s = Math.floor((Date.now() - a.bstart) / 1000);
  const el = document.getElementById('brk-timer');
  if (el) { el.textContent = mmss(s); el.classList.toggle('over', s > (Number(S.settings.brkPlan) || 15) * 60); }
  if (S.settings.reminders) {
    if (s >= 780 && !a.n1) { a.n1 = true; toast('Molanın bitmesine 2 dk kaldı.'); }
    if (s >= 900 && !a.n2) { a.n2 = true; toast('Mola süren doldu. Döndüğünde "Döndüm"e dokun.', 'warn'); }
  }
}
function init() {
  document.addEventListener('click', (e) => onClick(e));
  document.addEventListener('change', (e) => onChange(e));
  document.addEventListener('input', (e) => onInput(e));
  document.addEventListener('submit', (e) => onSubmit(e));
  document.addEventListener('toggle', onToggle, true);
  setInterval(tick, 1000);
  render();
}
/* =====================================================================
   v3: muhasebe akışı, gider tablosu, maaş ve haklar, Kais AI sözleşme
   ===================================================================== */
Object.assign(ICONS, {
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  wallet: '<path d="M4 7h15a1 1 0 011 1v11H5a1 1 0 01-1-1z"/><path d="M4 7l3-3h10v3"/><circle cx="16" cy="13.5" r="1.2"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
});

const REF = { y: _NOW.getFullYear(), m: _NOW.getMonth() + 1, d: _NOW.getDate() };
const NEXTP = CURM + ' ' + REF.y;
const MON = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const isoTxt = (iso) => { const a = iso.split('-').map(Number); return String(a[2]).padStart(2, '0') + ' ' + MON[a[1] - 1] + ' ' + a[0]; };
const monthsBetween = (iso) => { const a = iso.split('-').map(Number); let mm = (REF.y - a[0]) * 12 + (REF.m - a[1]); if (REF.d < a[2]) mm--; return Math.max(0, mm); };
const tenureTxt = (mm) => { const y = Math.floor(mm / 12); const r = mm % 12; return [y ? y + ' yıl' : '', r ? r + ' ay' : ''].filter(Boolean).join(' ') || '1 aydan az'; };
const empAge = (uid) => { const b = (PROFILES[uid] || {}).birth; if (!/^\d{4}-\d{2}-\d{2}$/.test(b || '')) return null; const t = fiIso(); let a = Number(t.slice(0, 4)) - Number(b.slice(0, 4)); if (t.slice(5) < b.slice(5)) a--; return a >= 0 && a < 120 ? a : null; };
/* İş Kanunu md. 53: 18 ve daha küçük, 50 ve daha yukarı yaştaki işçilere yıllık izin 20 günden az olamaz */
const leaveAgeMin = (uid) => { const a = uid ? empAge(uid) : null; return a != null && (a <= 18 || a >= 50); };
const leaveDays = (mm, uid) => { const d = mm < 12 ? 0 : mm <= 60 ? 14 : mm < 180 ? 20 : 26; return d && d < 20 && leaveAgeMin(uid) ? 20 : d; };
const noticeWeeks = (mm) => (mm < 6 ? 2 : mm < 18 ? 4 : mm < 36 ? 6 : 8);
const PAY_KIND = { maas: 'Maaş', avans: 'Avans', mesai: 'Mesai', prim: 'Prim' };
const LV_KIND = { yillik: 'Yıllık izin', rapor: 'Rapor', ucretsiz: 'Ücretsiz izin', mazeret: 'Mazeret izni' };
const LV_PILL = { yillik: 'p-info', rapor: 'p-warn', ucretsiz: 'p-mute', mazeret: 'p-mute' };

const PROFILES = {
  u4: { hire: '2023-02-13', salary: 30000, stype: 'net', hours: 45, trial: 2, payday: 30, contract: true, cAt: '13 Şub 2023', otMonth: 6, otYear: 96 },
  u5: { hire: '2024-06-03', salary: 30000, stype: 'net', hours: 45, trial: 2, payday: 30, contract: true, cAt: '03 Haz 2024', otMonth: 4, otYear: 58 },
  u6: { hire: '2026-03-03', salary: 30000, stype: 'net', hours: 45, trial: 2, payday: 30, contract: false, cAt: '', otMonth: 0, otYear: 12 },
  u7: { hire: '2022-09-12', salary: 30000, stype: 'net', hours: 45, trial: 2, payday: 30, contract: true, cAt: '12 Eyl 2022', otMonth: 8, otYear: 140 },
};
let PAYS = [
  { id: 'p1', uid: 'u4', kind: 'maas', per: 'Ekim 2026', amt: 30000, date: '30 Eki' },
  { id: 'p2', uid: 'u5', kind: 'maas', per: 'Ekim 2026', amt: 30000, date: '30 Eki' },
  { id: 'p3', uid: 'u6', kind: 'maas', per: 'Ekim 2026', amt: 30000, date: '30 Eki' },
  { id: 'p4', uid: 'u7', kind: 'maas', per: 'Ekim 2026', amt: 30000, date: '30 Eki' },
  { id: 'p5', uid: 'u4', kind: 'avans', per: NEXTP, amt: 3000, date: '06 Kas' },
  { id: 'p6', uid: 'u5', kind: 'avans', per: NEXTP, amt: 5000, date: '10 Kas' },
  { id: 'p7', uid: 'u7', kind: 'avans', per: NEXTP, amt: 2000, date: '11 Kas' },
];
let LEAVES = [
  { id: 'lv1', uid: 'u4', type: 'yillik', txt: '18–22 Ağu', days: 5 },
  { id: 'lv2', uid: 'u4', type: 'yillik', txt: '08 Eki', days: 1 },
  { id: 'lv3', uid: 'u5', type: 'yillik', txt: '14–17 Tem', days: 4 },
  { id: 'lv4', uid: 'u6', type: 'rapor', txt: '20–21 Eki', days: 2, note: 'Doktor raporu' },
  { id: 'lv5', uid: 'u7', type: 'yillik', txt: '01–07 Haz', days: 7 },
];
function dueOf(uid) {
  const p = PROFILES[uid];
  const hourly = p.salary / 225;
  const ot = Math.round(p.otMonth * hourly * 1.5);
  const offers = MSGS.filter((m) => m.type === 'mesai' && m.res[uid] === 'kabul');
  const offPay = offers.reduce((a, m) => a + Number(m.pay), 0);
  const paid = PAYS.filter((x) => x.uid === uid && x.per === NEXTP).reduce((a, x) => a + x.amt, 0);
  const ded = LEAVES.filter((x) => x.uid === uid && x.ded > 0 && x.per === NEXTP).reduce((a, x) => a + x.ded, 0);
  const total = p.salary + ot + offPay - ded;
  return { hourly, ot, offers, offPay, ded, paid, total, left: total - paid };
}

/* mazeret: reddeden herkes gerekçe yazar */
const m2 = MSGS.find((m) => m.id === 'm2');
m2.to.push('u7'); m2.reads.push('u7'); m2.res.u7 = 'red';
m2.why = { u7: { text: 'Bu akşam okul sınavım var, kapanış sonrası kalamam. Yarın uzatılırsa kalabilirim.', time: 'Bugün 09:40' } };
m2.whyNew = true;

/* fişler: yeni durumlar ve örnek kalemler */
SAMPLES[0].items = [
  { name: 'Kahve çekirdeği (1 kg)', qty: 2, amt: 600, stk: 's3' },
  { name: 'Toz şeker (5 kg)', qty: 4, amt: 240, stk: 's4' },
];
const docType = (f) => (/fatura/i.test(f.seller) ? 'Fatura' : /makbuz/i.test(f.seller) ? 'Makbuz' : 'Fiş');
let LEDGER = RECEIPTS.filter((f) => f.status === 'onayli').map((f, i) => ({ id: 'g' + (i + 1), date: f.date, desc: f.seller, acc: f.cat, doc: docType(f), rate: f.rate, total: f.total, src: 'Kais', rc: f.id }));
LEDGER.push({ id: 'g' + (LEDGER.length + 1), date: '27 Eki', desc: 'Nakit: çiçek ve mum', acc: 'Diğer', doc: '—', rate: 20, total: 180, src: 'Elle' });
RECEIPTS.push(
  { id: 'f10', seller: 'Metro Toptan', date: '14 Kas', total: 2654, rate: 10, cat: 'Hammadde', status: 'musavirde', by: 'u1', bank: null, at: '09:42', items: [
    { name: 'Süt (1 L)', qty: 24, amt: 924, stk: 's2', on: true },
    { name: 'Karton bardak (8 oz)', qty: 500, amt: 450, stk: 's5', on: true },
    { name: 'Un (50 kg çuval)', qty: 2, amt: 1280, stk: 's1', on: true },
  ] },
  { id: 'f11', seller: 'Hırdavat Yıldız', date: '14 Kas', total: 480, rate: 20, cat: 'Diğer', status: 'musavirde', by: 'u1', bank: null, at: '11:15', items: [] }
);
const STOCKLOG = [];
const openReceipts = (all) => RECEIPTS.filter((f) => ['bekliyor', 'musavirde', 'duzeltme'].includes(f.status) && (all || String(f.date).indexOf(PREVA) >= 0));
const RS = { bekliyor: ['p-warn', 'Patron onayı bekliyor'], musavirde: ['p-info', 'Muhasebecide'], duzeltme: ['p-bad', 'Düzeltme istendi'], onayli: ['p-ok', 'Onaylandı, tabloda'], reddedildi: ['p-mute', 'Reddedildi'] };

Object.assign(S.sub, { muhasebe: 'belgeler', belgeler: 'gelen', ekip: 'bugun' });
S.empView = null;
S.openChk = [];

/* ---------- rozet, belge satırı ---------- */
function badgeFor(view, u) {
  if (u.role === 'muhasebeci' && view === 'belgeler') return RECEIPTS.filter((f) => f.status === 'musavirde').length;
  if (u.role === 'calisan' && view === 'maasim') return LVREQ.filter((r) => r.uid === u.id && (r.status === 'karsi' || r.unreadEmp)).length;
  return badgeForV2(view, u);
}
function receiptRow(f, role) {
  const u = byId(f.by);
  const P = RS[f.status];
  const nI = (f.items || []).filter((i) => i.on && i.stk).length;
  let act = '';
  if (role === 'patron') {
    if (f.status === 'bekliyor') act = `<button class="btn sm" data-a="approve" data-id="${f.id}">Onayla, muhasebeciye gönder</button><button class="btn sm sec" data-a="reject" data-id="${f.id}">Reddet</button>`;
    if (f.status === 'duzeltme') act = `<button class="btn sm" data-a="resend" data-id="${f.id}">Düzelttim, tekrar gönder</button>`;
  }
  if (role === 'muh' && f.status === 'musavirde') act = `<button class="btn sm" data-a="review" data-id="${f.id}">İncele ve onayla</button>`;
  const stk = nI ? `<span class="small muted">${nI} kalem stoğa ${f.status === 'onayli' ? 'girdi' : 'girecek'}</span>` : '';
  const why = f.note && ['duzeltme', 'reddedildi'].includes(f.status) ? `<div class="rfoot"><div class="callout warn" style="width:100%">${ic('chat')}<div><b>${f.status === 'duzeltme' ? 'Muhasebecinin notu' : 'Red gerekçesi'}:</b><p style="margin-top:2px">${esc(f.note)}</p></div></div></div>` : '';
  return `<div class="rrow"><div><b style="font-weight:600">${esc(f.seller)}</b><div class="small muted">${esc(f.date)} · yükleyen ${esc(u.name.split(' ')[0])} · ${esc(f.cat)}${f.rate ? ' · KDV %' + f.rate + ': ' + fmt(kdv(f)) : ''}</div></div><div class="num" style="font-weight:600">${fmt(f.total)}</div>
  <div class="rfoot"><span class="pill ${P[0]}">${P[1]}</span>${stk}${f.bank ? '<span class="small muted">Ekstreyle eşleşti</span>' : ''}${act}</div>${why}</div>`;
}

/* ---------- patron: Belgeler ---------- */


/* ---------- muhasebeci: gelen kutusu ---------- */
function inboxHTML() {
  const inb = RECEIPTS.filter((f) => f.status === 'musavirde').reverse();
  const fix = RECEIPTS.filter((f) => f.status === 'duzeltme');
  const done = RECEIPTS.filter((f) => f.status === 'onayli').slice(-4).reverse();
  return `<div class="stack-lg">
  <div class="callout">${ic('sparkle')}<div><b>${inb.length ? inb.length + ' belge seni bekliyor' : 'Bekleyen belge yok'}</b><p style="margin-top:2px">Fişi aç. Kategori, KDV ve stok kalemlerini aynı ekranda düzeltip onayla. Gider tabloya kendiliğinden yazılır.</p></div></div>
  <div class="card flush">${inb.length ? inb.map((f) => receiptRow(f, 'muh')).join('') : '<div class="empty">Gelen kutusu boş.</div>'}</div>
  ${fix.length ? `<div class="card flush"><div style="padding:16px 16px 0"><h3>Düzeltme bekleyenler</h3><p class="muted small">Patron düzeltip tekrar gönderince buraya düşer.</p></div>${fix.map((f) => receiptRow(f, 'muh')).join('')}</div>` : ''}
  <div class="card flush"><div style="padding:16px 16px 0"><h3>Son onaylananlar</h3></div>${done.map((f) => receiptRow(f, 'muh')).join('')}</div></div>`;
}
function viewBelgeler() {
  let cur = S.sub.belgeler;
  if (cur !== 'ekstre') cur = 'gelen';
  S.sub.belgeler = cur;
  return `<div class="stack-lg">${seg('belgeler', [['gelen', 'Gelen kutusu'], ['ekstre', 'Ekstre']], cur)}${cur === 'ekstre' ? ekstreHTML('muh') : inboxHTML()}</div>`;
}
function viewDonem() {
  const n = RECEIPTS.filter((f) => f.status === 'musavirde').length;
  const miss = countStatus('eksik');
  const total = ROWS.filter((r) => ['gider', 'tekrar'].includes(r.kind)).length;
  const pct = total ? Math.round(((total - miss) / total) * 100) : 100;
  const t = totals();
  const fix = RECEIPTS.filter((f) => f.status === 'duzeltme').length;
  const items = [];
  if (n) items.push(todo('receipt', 'warn', `${n} yeni belge seni bekliyor`, 'Patron fiş yükledi. Tek ekranda incele ve onayla.', 'belgeler', 'gelen'));
  if (fix) items.push(todo('chat', 'info', `${fix} belge patronda düzeltme bekliyor`, 'Düzeltilince gelen kutusuna düşer', 'belgeler', 'gelen'));
  if (miss) items.push(todo('alert', 'bad', `${miss} işlemin belgesi eksik`, 'Ekstrede harcama var, belge yok', 'belgeler', 'ekstre'));
  const ds = debtSoon();
  if (ds.length) items.push(todo('wallet', 'warn', `${ds.length} ödeme için hatırlatma zamanı`, `${ds[0].who}: ${fmt0(ds[0].amt)}`, 'borc'));
  const wn = waitingNotes();
  return `<div class="stack-lg">
  <div><h2>${esc(BIZ)}</h2><p class="muted" style="margin-top:4px">${PREVM} dönemi kapanış bekliyor · ${CURM} dönemi devam ediyor</p></div>
  ${items.length ? `<div class="stack">${items.join('')}</div>` : `<div class="callout">${ic('check')}<div>Bekleyen iş yok.</div></div>`}
  <div class="card stack"><div class="row between wrap"><h3>Dönem durumu</h3><span class="num" style="font-weight:600">%${pct} belgeli</span></div>
    <div class="prog"><i style="width:${pct}%"></i></div>
    <div class="kpis"><div class="kpi"><div class="l">İşlem</div><div class="v num">${ROWS.length}</div></div><div class="kpi"><div class="l">Eksik belge</div><div class="v num">${miss}</div></div><div class="kpi"><div class="l">Onay bekleyen</div><div class="v num">${openReceipts(true).length}</div></div></div>
    <p class="muted small">Gelen ${fmt0(t.in)} · giden ${fmt0(t.out)}</p>
    <div class="row wrap"><button class="btn" data-a="nav" data-v="belgeler">Gelen kutusu</button><button class="btn sec" data-a="nav" data-v="tablo">Gider tablosu</button><button class="btn sec" data-a="nav" data-v="paket">Aylık paket</button></div></div>
  ${Object.keys(NOTES).length ? `<div class="card stack"><h3>Notlar ve sorular</h3>${Object.keys(NOTES).map((id) => { const r = ROWS.find((x) => x.id === id); const a = NOTES[id]; const last = a[a.length - 1]; return `<div class="logline"><span><b style="font-weight:600">${esc(r.desc)}</b><span class="small muted" style="display:block">${esc(byId(last.by).name.split(' ')[0])}: ${esc(last.text)}</span></span><button class="btn sm sec" data-a="notes" data-id="${id}">Aç</button></div>`; }).join('')}</div>` : ''}
  ${kdvCard()}</div>`;
}
function viewTablo() { return tabloHTML('muh'); }

/* ---------- gider tablosu ---------- */
const chPill = (r) => (r.ch === 'banka' ? '<span class="pill p-info">Banka</span> ' : r.ch === 'nakit' ? '<span class="pill p-ok">Nakit</span> ' : '');
const srcPill = (r) => chPill(r) + (r.edited ? '<span class="pill p-warn">Düzenlendi</span>' : r.src === 'Kais' ? '<span class="pill p-info">Kais yazdı</span>' : r.src === 'Ekstre' ? '<span class="pill p-mute">Ekstreden</span>' : '<span class="pill p-mute">Elle</span>');
const CELL_LAB = { date: 'tarih', desc: 'açıklama', doc: 'belge', total: 'toplam' };






/* ---------- aylık paket: açılır liste ---------- */
function paketHTML(role) {
  const mode = role === 'patron' ? 'patron' : 'muh';
  const missRows = ROWS.filter((r) => rowStatus(r) === 'eksik');
  const open = openReceipts();
  const ready = !missRows.length && !open.length;
  const t = totals();
  const dot = (ok) => `<span class="dot ${ok ? 'tone-ok' : 'tone-bad'}">${ic(ok ? 'check' : 'x', 16)}</span>`;
  const plain = (ok, title, sub) => `<div class="check">${dot(ok)}<div><b style="font-weight:600">${esc(title)}</b><div class="small muted">${esc(sub)}</div></div></div>`;
  const exp = (id, title, sub, body) => `<details class="chk" id="ck-${id}" ${S.openChk.includes(id) ? 'open' : ''}><summary class="check">${dot(false)}<div class="grow"><b style="font-weight:600">${esc(title)}</b><div class="small muted">${esc(sub)}</div></div><span class="chev">${ic('chevron', 18)}</span></summary><div class="cbody">${body}</div></details>`;
  const missBody = missRows.map((r) => `<div class="mini"><div><b style="font-weight:600">${esc(r.desc)}</b><div class="small muted">${esc(r.date)}</div></div><div class="num" style="font-weight:600">${fmt(r.amt)}</div><div class="m2">${mode === 'patron' ? `<button class="btn sm" data-a="upload">${ic('camera', 16)} Fiş ekle</button><button class="btn sm sec" data-a="nodoc" data-id="${r.id}">Fişim yok</button>${r.requested ? '<span class="pill p-warn">Muhasebeci istedi</span>' : ''}` : r.requested ? '<span class="pill p-warn">Belge istendi</span>' : `<button class="btn sm sec" data-a="request" data-id="${r.id}">Eksik belge iste</button>`}</div></div>`).join('');
  const openBody = open.map((f) => `<div class="mini"><div><b style="font-weight:600">${esc(f.seller)}</b><div class="small muted">${esc(f.date)} · ${esc(byId(f.by).name.split(' ')[0])}</div></div><div class="num" style="font-weight:600">${fmt(f.total)}</div><div class="m2"><span class="pill ${RS[f.status][0]}">${RS[f.status][1]}</span>${f.status === 'bekliyor' && mode === 'patron' ? `<button class="btn sm" data-a="approve" data-id="${f.id}">Onayla</button><button class="btn sm sec" data-a="reject" data-id="${f.id}">Reddet</button>` : ''}${f.status === 'musavirde' && mode === 'muh' ? `<button class="btn sm" data-a="review" data-id="${f.id}">İncele ve onayla</button>` : ''}${f.status === 'duzeltme' ? `<span class="small muted">${esc(f.note)}</span>` : ''}</div></div>`).join('');
  return `<div class="stack-lg">
  <div class="card"><h3>${PERIOD} paketi</h3><p class="muted small">Muhasebeci için hazırlanan aylık çıktı. Eksik olanlara dokununca hangileri olduğunu görürsün.</p>
  ${plain(true, 'Tüm fişler okundu', `${RECEIPTS.length} fiş ve fatura kayıtlı`)}
  ${missRows.length ? exp('miss', `${missRows.length} işlemin belgesi eksik`, 'Hangileri olduğunu görmek için dokun', missBody) : plain(true, 'Eksik belge yok', 'Tüm harcamalar belgeyle eşleşti')}
  ${open.length ? exp('open', `${open.length} belge onay bekliyor`, 'Patron ya da muhasebeci onayında olanlar', openBody) : plain(true, 'Bekleyen onay yok', 'Tüm belgeler onaylandı')}
  ${plain(true, 'Gider tablosu güncel', `${gp().length} gider satırı yazıldı, toplam ${fmt0(gp().reduce((a, r) => a + (Number(r.total) || 0), 0))}`)}
  ${plain(true, 'Maaş ödemeleri listelendi', 'Maaşlar ekstreden okunur. Bordro hesabı bu üründe yok.')}
  <div class="kpis" style="margin-top:12px"><div class="kpi"><div class="l">Gelen</div><div class="v num">${fmt0(t.in)}</div></div><div class="kpi"><div class="l">Giden</div><div class="v num">${fmt0(t.out)}</div></div><div class="kpi"><div class="l">Belgesiz</div><div class="v num">${countStatus('belgesiz')}</div></div></div></div>
  <div class="card stack"><div><h3>Excel / CSV çıktısı</h3><p class="muted small">Gider tablosundan üretilir. Noktalı virgülle ayrılmış, Türkçe Excel'de doğrudan açılır.</p></div>
  <textarea class="csv" readonly aria-label="CSV önizleme" id="csvbox">${esc(csvText())}</textarea>
  <div class="xrow"><button class="btn sec" data-a="copycsv">Kopyala</button>${xlsxBtn()}
  ${role === 'patron' ? `<button class="btn" data-a="sendpkg" ${S.sent ? 'disabled' : ''}>${ic('send')} ${S.sent ? 'Muhasebeciye gönderildi' : 'Muhasebeciye gönder'}</button>` : `<button class="btn" data-a="closeperiod" ${!ready || S.closed ? 'disabled' : ''}>${ic('lock')} ${S.closed ? 'Dönem kapalı' : 'Dönemi kapat'}</button>`}</div>
  ${role !== 'patron' && !ready ? '<p class="small muted">Eksik belge ya da bekleyen onay varken dönem kapatılamaz.</p>' : ''}
  ${S.sent && role !== 'patron' ? `<p class="small"><span class="pill p-ok">Patron paketi gönderdi</span> ${esc(S.sent)}</p>` : ''}
  ${S.sent && role === 'patron' ? `<p class="small muted">Gönderildi: ${esc(S.sent)}</p>` : ''}</div></div>`;
}

/* ---------- patron: muhasebe sekmeleri ---------- */

function viewMuhasebe() {
  const L = { eposta: 'belgeler', fisler: 'belgeler', alacak: 'ozet', paket: 'tablo' };
  let cur = S.sub.muhasebe;
  if (cur === 'eposta' && !S.openChk.includes('mail')) S.openChk.push('mail');
  if (L[cur]) { cur = L[cur]; S.sub.muhasebe = cur; }
  const map = { belgeler: belgelerPatron, tablo: () => tabloHTML('patron') + paketHTML('patron'), ekstre: () => ekstreHTML('patron'), ozet: ozetHTML };
  const tabs = [['belgeler', 'Belgeler'], ['tablo', 'Tablo'], ['ekstre', 'Ekstre'], ['ozet', 'Özet']];
  return `<div class="stack-lg">${seg('muhasebe', tabs, cur)}${S.closed ? `<div class="callout warn">${ic('lock')}<div>${PERIOD} dönemi muhasebeci tarafından kapatıldı. Değişiklik için muhasebeciye yaz.</div></div>` : ''}${(map[cur] || belgelerPatron)()}</div>`;
}
function addMailDoc(d) {
  RECEIPTS.push({ id: 'f' + ++seq, seller: d.from, date: d.date, total: d.total, rate: d.rate, cat: d.cat, status: 'musavirde', by: 'u1', bank: d.bank, at: 'e-posta', items: [] });
}

/* ---------- stok: fişten giriş kaydı ---------- */
function stokLogCard() {
  return `<div class="card stack"><div><h3>Fişten stoğa giriş</h3><p class="muted small">Muhasebeci bir alış fişini onaylarken kalemleri stok ürünüyle eşler. Onaylayınca adetler buraya kendiliğinden eklenir.</p></div>${STOCKLOG.length ? STOCKLOG.slice(0, 6).map((x) => `<div class="logline"><span>${esc(x.name)}<span class="small muted" style="display:block">${esc(x.from)} · ${esc(x.t)}</span></span><b class="num">+${x.qty}</b></div>`).join('') : '<p class="small muted">Henüz fişten giren kalem yok.</p>'}</div>`;
}

/* ---------- açılır liste ve geri bildirim ---------- */
function onToggle(e) {
  const d = e.target;
  if (!d.id) return;
  const key = d.id.slice(3);
  if (d.id.indexOf('rk-') === 0) { S.openRank = S.openRank.filter((x) => x !== key); if (d.open) S.openRank.push(key); }
  else if (d.id.indexOf('ck-') === 0) { S.openChk = S.openChk.filter((x) => x !== key); if (d.open) S.openChk.push(key); }
}

/* ---------- ekip: maaş ve haklar ---------- */
const kpi = (l, v) => `<div class="kpi"><div class="l">${esc(l)}</div><div class="v num">${v}</div></div>`;
function viewEkip() {
  const cur = S.sub.ekip;
  const isP = S.user.role === 'patron';
  const canRank = isP || S.settings.mudurRanking;
  const nReq = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length;
  const tabs = [['bugun', 'Bugün'], ['talep', 'İzin talepleri' + (nReq ? ' (' + nReq + ')' : '')]].concat(isP ? [['maas', 'Maaş ve haklar']] : []).concat([['siralama', 'Aylık sıralama']]);
  let body;
  if (cur === 'maas' && isP) body = viewMaas();
  else if (cur === 'talep') body = talepHTML();
  else if (cur === 'siralama') body = canRank ? rankingView() : `<div class="card empty">${ic('lock', 28)}<p style="margin-top:8px">Bireysel sıralamayı yalnızca patron görür. Patron isterse Ayarlar'dan yetki verebilir.</p></div>`;
  else body = `<div class="card flush">${EMP_IDS.map((id) => empRow(id, true)).join('')}</div><div class="callout">${ic('info')}<div>Çalışan da kendi kaydını aynı şekilde görür. Unutulan "döndüm" dokunuşu otomatik kesinti yapmaz, kayıt "onay bekliyor" olur.${isP ? ' Çalışanın adına dokununca maaş ve haklarını görürsün.' : ''}</div></div>`;
  return `<div class="stack-lg">${seg('ekip', tabs, cur === 'maas' && !isP ? 'bugun' : cur)}${body}</div>`;
}
function viewMaas() {
  if (S.empView && PROFILES[S.empView]) {
    return `<div class="stack-lg"><div><button class="btn sec sm" data-a="empback">${ic('back', 16)} Çalışanlar</button></div>${empDetail(S.empView, false)}</div>`;
  }
  const all = EMP_IDS.map((id) => dueOf(id));
  const tot = all.reduce((a, d) => a + d.total, 0); const paid = all.reduce((a, d) => a + d.paid, 0);
  return `<div class="stack-lg">
  <div class="card stack aicard"><div class="row"><span class="aib">${ic('sparkle', 20)}</span><div class="grow"><h3>Kais AI</h3><p class="muted small" style="margin-top:2px">İş sözleşmesinin fotoğrafını ekle, kimin olduğunu yaz. Maaş, mesai, izin ve haklar kendiliğinden doldurulur.</p></div></div>
  <button class="btn" style="align-self:flex-start" data-a="aiopen">${ic('camera')} Sözleşme yükle</button></div>
  <div class="kpis">${kpi(CURM + ' hakkı', fmt0(tot))}${kpi('Ödenen', fmt0(paid))}${kpi('Kalan', fmt0(tot - paid))}</div>
  <div class="card flush">${EMP_IDS.map((id) => {
    const u = byId(id); const p = PROFILES[id]; const d = dueOf(id);
    return `<button class="emp go" data-a="empopen" data-id="${id}">${avatar(u, 40)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">${esc(u.title)} · kıdem ${tenureTxt(monthsBetween(p.hire))}</div>${p.contract ? '' : '<span class="pill p-warn" style="margin-top:6px">Sözleşme eksik</span>'}</div><div class="right"><div class="num" style="font-weight:600">${fmt0(Math.abs(d.left))}</div><div class="small muted">${d.left > 0 ? 'kalan' : d.left < 0 ? 'fazla ödendi' : 'tamam'}</div></div>${ic('chevron', 18)}</button>`;
  }).join('')}</div>
  <div class="callout">${ic('info')}<div>Tutarlar net maaş üzerinden tahmindir. Bordro, SGK ve vergi hesabı muhasebecidedir. Yasal süreler asgari değerlerdir, sözleşme daha lehte olabilir.</div></div></div>`;
}
function viewMaasim() {
  LVREQ.forEach((r) => { if (r.uid === S.user.id) r.unreadEmp = false; });
  return `<div class="stack-lg"><div><h2>Maaşım ve haklarım</h2><p class="muted" style="margin-top:4px">Ödemelerin, mesain, izinlerin ve sözleşmen burada.</p></div>${empDetail(S.user.id, true)}</div>`;
}
function empDetail(uid, mine, ro) {
  const u = byId(uid); const p = PROFILES[uid]; const mm = monthsBetween(p.hire); const d = dueOf(uid);
  const pct = d.total ? Math.max(0, Math.min(100, Math.round((d.paid / d.total) * 100))) : 0;
  const lv = LEAVES.filter((x) => x.uid === uid);
  const ent = leaveDays(mm, uid) + yizCarry(uid);
  const used = lv.filter((x) => x.type === 'yillik').reduce((a, x) => a + x.days, 0);
  const left = Math.max(0, ent - used);
  const pays = PAYS.filter((x) => x.uid === uid && x.per === NEXTP);
  const last = PAYS.find((x) => x.uid === uid && x.kind === 'maas' && x.per === PERIOD);
  const wk = noticeWeeks(mm);
  const hour15 = d.hourly * 1.5;
  const otPct = Math.min(100, Math.round((p.otYear / 270) * 100));
  const eligible = isoTxt(String(Number(p.hire.slice(0, 4)) + 1) + p.hire.slice(4));
  const trialEnd = mm >= p.trial;
  const rt = (title, val, body) => `<details class="rt"><summary><span>${esc(title)}</span><b class="num">${esc(val)}</b></summary><div class="rb">${body}</div></details>`;
  return `<div class="stack-lg">
  <div class="row">${avatar(u, 52)}<div class="grow"><h2>${esc(u.name)}</h2><div class="small muted">${esc(u.title)} · ${esc(isoTxt(p.hire))} tarihinde başladı</div><div class="row wrap" style="gap:6px;margin-top:6px"><span class="pill p-info">Kıdem ${tenureTxt(mm)}</span>${p.contract ? '<span class="pill p-ok">Sözleşme kayıtlı</span>' : '<span class="pill p-warn">Sözleşme eksik</span>'}</div></div></div>

  <div class="card stack"><div class="row between wrap"><div><h3>${mine ? 'Bu ayki maaş hakkın' : NEXTP + ' maaşı'}</h3><p class="muted small">Ödeme günü her ayın ${p.payday}'u</p></div>${d.left <= 0 ? '<span class="pill p-ok">Tamamı ödendi</span>' : `<span class="pill p-warn">${fmt0(d.left)} kalan</span>`}</div>
  <div class="kpis">${kpi('Hak edilen', fmt0(d.total))}${kpi('Ödenen', fmt0(d.paid))}${kpi(d.left < 0 ? 'Fazla ödenen' : 'Kalan', fmt0(Math.abs(d.left)))}</div>
  <div class="prog" role="img" aria-label="Ödenen oran %${pct}"><i style="width:${pct}%"></i></div>
  <div><div class="logline"><span>Maaş (${p.stype === 'net' ? 'net' : 'brüt'})</span><b class="num">${fmt(p.salary)}</b></div>
  <div class="logline"><span>Fazla mesai, ${p.otMonth} saat<span class="small muted" style="display:block">Saat ücreti ${fmt(d.hourly)}, zamlı ${fmt(hour15)}</span></span><b class="num">${fmt(d.ot)}</b></div>
  ${d.offers.map((m) => `<div class="logline"><span>Kabul edilen mesai teklifi<span class="small muted" style="display:block">${esc(m.title)}</span></span><b class="num">${fmt(Number(m.pay))}</b></div>`).join('')}
  ${(d.holL || []).map((x) => `<div class="logline"><span>Resmi tatil çalışma ücreti<span class="small muted" style="display:block">${x.d} ${VD_MON[x.m]}, ${esc(x.n)}</span></span><b class="num">${fmt(x.amt)}</b></div>`).join('')}
  ${d.ded ? `<div class="logline"><span>İzin kesintisi<span class="small muted" style="display:block">Ücretsiz izin günleri</span></span><b class="num">${fmt(-d.ded)}</b></div>` : ''}
  <div class="logline"><span><b style="font-weight:600">Toplam hak</b></span><b class="num">${fmt(d.total)}</b></div></div>
  ${pays.length ? `<div><p class="lbl">Bu ay yapılan ödemeler</p>${pays.map((x) => `<div class="logline"><span><span class="pill p-info">${PAY_KIND[x.kind]}</span> <span class="muted">${esc(x.date)}</span></span><b class="num">${fmt(x.amt)}</b></div>`).join('')}</div>` : '<p class="small muted">Bu ay henüz ödeme yapılmadı.</p>'}
  ${last ? `<p class="small muted">${PREVM} maaşı ödendi: ${esc(last.date)}, ${fmt(last.amt)}</p>` : ''}
  ${p.stype === 'brut' ? `<div class="callout warn">${ic('alert')}<div>Maaş brüt kayıtlı. Eline geçen net tutar bordroya göre belli olur, bu yüzden hesap yaklaşıktır.</div></div>` : ''}
  ${mine || ro ? '' : `<button class="btn" style="align-self:flex-start" data-a="payadd" data-id="${uid}">${ic('plus')} Ödeme ekle</button>`}
  <p class="small muted">Tutarlar tahmindir. Saat ücreti maaşın 225 saate bölünmesiyle bulundu. Bordro, SGK ve vergi hesabı muhasebecidedir.</p></div>

  <div class="card stack"><div><h3>Mesai</h3><p class="muted small" style="margin-top:2px">Haftalık normal çalışma ${p.hours} saat. Aşan süre yüzde 50 zamlı ödenir.</p></div>
  <div class="kpis">${kpi('Bu ay', p.otMonth + ' sa')}${kpi('Zamlı saat', fmt0(hour15))}${kpi('Bu yıl', p.otYear + ' sa')}</div>
  <div><div class="row between small"><span class="muted">Yıllık fazla mesai sınırı</span><b class="num">${p.otYear} / 270 saat</b></div><div class="prog" role="img" aria-label="Yıllık sınırın %${otPct} kadarı kullanıldı"><i style="width:${otPct}%;background:${otPct > 80 ? 'var(--safran)' : 'var(--turq)'}"></i></div></div>
  ${d.offers.length ? d.offers.map((m) => `<div class="logline"><span>${esc(m.title)}<span class="small muted" style="display:block">Kabul edildi · ${esc(m.hours)} saat ek çalışma</span></span><b class="num">${fmt(Number(m.pay))}</b></div>`).join('') : '<p class="small muted">Bu ay kabul edilmiş mesai teklifi yok.</p>'}${puantaj(uid)}</div>

  <div class="card stack"><div class="row between wrap"><div><h3>İzinler</h3><p class="muted small" style="margin-top:2px">Yıllık izin ve rapor günleri puanlamada kapsam dışıdır.</p></div>${mine || ro ? '' : `<button class="btn sm" data-a="lvadd" data-id="${uid}">${ic('plus', 16)} İzin ekle</button>`}</div>
  ${ent ? `<div class="kpis">${kpi('Yıllık hak', ent + ' gün')}${kpi('Kullanılan', used + ' gün')}${kpi('Kalan', left + ' gün')}</div><div class="prog" role="img" aria-label="Yıllık iznin ${used} günü kullanıldı"><i style="width:${Math.min(100, Math.round((used / ent) * 100))}%"></i></div>` : `<div class="callout">${ic('info')}<div>Yıllık izin hakkı 1 yıl dolunca doğar (${esc(eligible)}). O tarihten sonra ${leaveDays(12, uid)} gün.</div></div>`}
  ${lv.length ? `<div>${lv.map((x) => `<div class="logline"><span><span class="pill ${LV_PILL[x.type]}">${LV_KIND[x.type]}</span> <span class="muted">${esc(x.txt)}</span>${x.note ? `<span class="small muted" style="display:block">${esc(x.note)}</span>` : ''}${x.type === 'ucretsiz' ? `<span class="small muted" style="display:block">${x.ded ? 'Maaştan kesinti: ' + fmt(x.ded) + ' (günlük ' + fmt(x.perDay) + ')' : 'Maaştan kesinti yapılmadı'}</span>` : ''}</span><b class="num">${x.days} gün</b></div>`).join('')}</div>` : '<p class="small muted">Kayıtlı izin yok.</p>'}</div>

  ${ro ? '' : lrSection(uid, mine)}

  <div class="card flush"><div style="padding:16px 16px 6px"><h3>Haklar ve süreler</h3><p class="muted small" style="margin-top:2px">Kıdeme göre kanundaki asgari değerler. Sözleşme daha lehte olabilir.</p></div>
  ${rt('Kıdem', tenureTxt(mm), `İşe giriş ${esc(isoTxt(p.hire))}. İzin, ihbar süresi ve kıdem tazminatı bu süreye göre değişir.`)}
  ${rt('Yıllık izin', ent ? ent + ' gün' : 'Henüz yok', 'Bir yıldan beş yıla kadar (beş yıl dahil) 14 gün, beş yıldan fazla on beş yıldan az 20 gün, on beş yıl ve üzeri 26 gün. 4857 sayılı İş Kanunu md. 53.')}
  ${rt('Fazla mesai', '%50 zamlı', 'Haftalık 45 saati aşan çalışma saat ücretinin yüzde 50 zamlısı ile ödenir. Yıllık fazla çalışma süresi en çok 270 saattir.')}
  ${rt('İhbar süresi', wk + ' hafta', 'Çalışma süresi 6 aya kadar 2, 6 ay ile 1,5 yıl arası 4, 1,5 ile 3 yıl arası 6, 3 yıldan fazla 8 hafta. İş Kanunu md. 17.')}
  ${rt('Deneme süresi', trialEnd ? 'Tamamlandı' : 'Sürüyor', `Sözleşmede ${p.trial} ay. Deneme süresi kanunda en çok 2 aydır, toplu iş sözleşmesiyle 4 aya çıkabilir.`)}
  ${rt('Kıdem tazminatı', mm >= 12 ? 'Şart sağlandı' : 'Henüz değil', mm >= 12 ? 'En az 1 yıl çalışma şartı doldu. Hak, kanunda sayılan fesih hallerinde doğar. Tutar hesabı bu üründe yok.' : `1 yıl dolunca (${esc(eligible)}) kanunda sayılan fesih hallerinde doğar.`)}
  ${rt('Hafta tatili ve resmi tatil', 'Ücretli', 'Haftada en az 24 saat kesintisiz dinlenme hakkı vardır. Ulusal bayram ve genel tatil günleri ücretlidir.')}
  <p class="small muted" style="padding:12px 16px">Hukuki konularda iş hukukçusu ya da muhasebeciyle teyit et.</p></div>

  <div class="card stack"><div class="row between wrap"><div><h3>İş sözleşmesi</h3><p class="muted small" style="margin-top:2px">${p.contract ? 'Kais AI okudu, ' + esc(p.cAt) : 'Sistemde kayıtlı sözleşme yok'}</p></div>${p.contract ? '<span class="pill p-ok">Kayıtlı</span>' : '<span class="pill p-warn">Eksik</span>'}</div>
  ${p.contract ? `<dl class="kv"><dt>Tür</dt><dd>Belirsiz süreli</dd><dt>İşe giriş</dt><dd>${esc(isoTxt(p.hire))}</dd><dt>Maaş</dt><dd class="num">${fmt(p.salary)} ${p.stype === 'net' ? 'net' : 'brüt'}</dd><dt>Haftalık saat</dt><dd>${p.hours} saat</dd><dt>Deneme</dt><dd>${p.trial} ay</dd><dt>Ödeme günü</dt><dd>Her ayın ${p.payday}'u</dd></dl>${contractPreview(uid)}` : (mine || ro ? `<p class="muted">${ro ? 'Patron sözleşmeyi henüz sisteme yüklemedi.' : 'İşvereninin sözleşmeni sisteme yüklemesi bekleniyor.'}</p>` : `<div class="callout warn">${ic('alert')}<div>Sözleşmenin fotoğrafını yükle. Kais AI maaş, mesai, izin ve hakları kendiliğinden doldurur.</div></div>`)}
  ${mine || ro ? '' : `<button class="btn ${p.contract ? 'sec' : ''}" style="align-self:flex-start" data-a="aiopen" data-id="${uid}">${ic('sparkle')} ${p.contract ? 'Yeni sözleşme yükle' : 'Sözleşmeyi Kais AI ile yükle'}</button>`}</div></div>`;
}

/* ---------- pencereler ---------- */
function whyModal(m) {
  const T = {
    offer: ['Teklifi reddet', 'Mazeretin işverene gider ve kayda geçer. Mazeret yazmadan reddedilemez.', 'Reddet', 'Mazeretin', 'Örnek: O gün sınavım var, kalamam.'],
    rcpt: ['Fişi reddet', 'Gerekçe çalışana bildirim olarak gider. Gerekçe yazmadan reddedilemez.', 'Reddet', 'Red gerekçesi', 'Örnek: Fişin tarihi okunmuyor, yeniden çek.'],
    lvrej: ['İzin talebini reddet', 'Gerekçe çalışana bildirim olarak gider. Gerekçe yazmadan reddedilemez.', 'Reddet', 'Red gerekçesi', 'Örnek: O hafta kadro eksik. Başka bir tarih önerebilirim.'],
    return: ['Düzeltme iste', 'Notun patrona gider. Fiş düzeltilince sana tekrar düşer.', 'Düzeltme iste', 'Ne düzeltilmeli?', 'Örnek: Bu fatura değil fiş, KDV tutarı okunmuyor.'],
  }[m.kind];
  let ctx = '';
  if (m.kind === 'lvrej') { const q = LVREQ.find((x) => x.id === m.id); ctx = `<div class="callout">${ic('clock')}<div><b>${esc(byId(q.uid).name)}</b><p style="margin-top:2px">${esc(q.txt)} · ${q.days} gün · ${LV_KIND[q.type]}</p></div></div>`; }
  else if (m.kind === 'offer') { const g = MSGS.find((x) => x.id === m.id); ctx = `<div class="callout">${ic('megaphone')}<div><b>${esc(g.title)}</b><p style="margin-top:2px">${esc(g.hours)} saat ek çalışma, ${fmt(Number(g.pay))} ek ücret</p></div></div>`; }
  else { const f = RECEIPTS.find((x) => x.id === m.id); ctx = `<div class="callout">${ic('receipt')}<div><b>${esc(f.seller)}</b><p style="margin-top:2px">${esc(f.date)} · ${fmt(f.total)}</p></div></div>`; }
  return sheet(T[0], `${ctx}<div class="field"><label for="why-text">${T[3]}</label><textarea id="why-text" placeholder="${esc(T[4])}"></textarea></div><div class="err" id="why-err" role="alert"></div><p class="small muted">${T[1]}</p><div class="row"><button class="btn grow" data-a="whyok">${T[2]}</button><button class="btn sec" data-a="closemodal">Vazgeç</button></div>`);
}
function reviewModal(m) {
  const f = RECEIPTS.find((x) => x.id === m.id);
  const u = byId(f.by);
  const bank = f.bank ? ROWS.find((r) => r.id === f.bank) : null;
  const opts = (sel) => '<option value="">Stok ürünü seç</option>' + STOCK.map((s) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  const items = m.items.length ? m.items.map((it, i) => `<div class="ritem"><div class="rtop"><b style="font-weight:600">${esc(it.name)}</b><span class="num">${fmt(it.amt)}</span></div>
    <div class="rctl"><label class="inl"><input type="checkbox" data-ch="ritem" data-f="on" data-i="${i}" ${it.on ? 'checked' : ''}> Stoğa gir</label><input class="qty" type="number" min="0" step="1" value="${esc(it.qty)}" data-ch="ritem" data-f="qty" data-i="${i}" aria-label="${esc(it.name)} adedi"><select data-ch="ritem" data-f="stk" data-i="${i}" aria-label="${esc(it.name)} stok ürünü">${opts(it.stk)}</select></div></div>`).join('') : '<p class="small muted">Bu fişte stoğa girecek kalem yok.</p>';
  return sheet('Fişi incele', `<div class="row between"><div><b style="font-weight:600">${esc(f.seller)}</b><div class="small muted">${esc(f.date)} · ${esc(u.name.split(' ')[0])} yükledi${f.at ? ' · ' + esc(f.at) : ''}</div></div><span class="pill p-info">Muhasebecide</span></div>
  ${bank ? `<div class="callout">${ic('check')}<div>Ekstredeki <b>${esc(bank.date)} · ${esc(bank.desc)}</b> işlemiyle eşleşti.</div></div>` : ''}
  <div class="field"><label for="rv-cat">Kategori</label><select id="rv-cat" data-ch="rcat">${CATS.map((c) => `<option ${c === m.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
  <div class="row"><div class="field grow"><label for="rv-total">Toplam (₺)</label><input id="rv-total" type="number" step="0.01" inputmode="decimal" value="${esc(m.total)}" data-ch="rtotal"></div><div class="field grow"><label for="rv-rate">KDV oranı</label><select id="rv-rate" data-ch="rrate">${[0, 1, 10, 20].map((x) => `<option value="${x}" ${x === Number(m.rate) ? 'selected' : ''}>%${x}</option>`).join('')}</select></div></div>
  <p class="small muted" id="rv-kdv">KDV tutarı: ${fmt(kdv({ total: Number(m.total), rate: Number(m.rate) }))}</p>
  <div class="stack"><b style="font-weight:600">Kalemler ve stok</b>${items}</div>
  <div class="callout">${ic('sparkle')}<div>Onaylayınca gider <b>Gider tablosuna</b> yazılır${m.items.some((i) => i.on && i.stk) ? ' ve işaretli kalemler stoğa girer' : ''}.</div></div>
  <div class="row wrap"><button class="btn grow" data-a="revok">Onayla ve tabloya yaz</button><button class="btn sec" data-a="revret">Düzeltme iste</button></div>`);
}
function payModal(m) {
  const u = byId(m.uid); const d = dueOf(m.uid);
  return sheet('Ödeme ekle', `<div class="callout">${ic('wallet')}<div><b>${esc(u.name)}</b><p style="margin-top:2px">${CURM} hakkı ${fmt(d.total)}, ödenen ${fmt(d.paid)}, kalan ${fmt(d.left)}</p></div></div>
  <div class="field"><label for="pay-kind">Ödeme türü</label><select id="pay-kind">${Object.keys(PAY_KIND).map((k) => `<option value="${k}">${PAY_KIND[k]}</option>`).join('')}</select></div>
  <div class="row"><div class="field grow"><label for="pay-amt">Tutar (₺)</label><input id="pay-amt" type="number" min="0" step="50" inputmode="decimal" value="${d.left > 0 ? Math.round(d.left) : ''}"></div><div class="field grow"><label for="pay-date">Tarih</label><input id="pay-date" type="text" value="14 Kas"></div></div>
  <div class="err" id="pay-err" role="alert"></div><button class="btn block" data-a="payok" data-id="${m.uid}">Kaydet</button><p class="small muted">Bu kayıt banka hareketi değildir. Ödemeyi yaptıktan sonra buraya işlersin.</p>`);
}
function leaveModal(m) {
  const u = byId(m.uid); const p = PROFILES[m.uid]; const ent = leaveDays(monthsBetween(p.hire), m.uid);
  const used = LEAVES.filter((x) => x.uid === m.uid && x.type === 'yillik').reduce((a, x) => a + x.days, 0);
  return sheet('İzin ekle', `<div class="callout">${ic('info')}<div><b>${esc(u.name)}</b><p style="margin-top:2px">Yıllık izin: ${ent} gün hak, ${used} gün kullanıldı, ${Math.max(0, ent - used)} gün kaldı</p></div></div>
  <div class="field"><label for="lv-type">İzin türü</label><select id="lv-type">${Object.keys(LV_KIND).map((k) => `<option value="${k}">${LV_KIND[k]}</option>`).join('')}</select></div>
  <div class="row"><div class="field grow"><label for="lv-txt">Tarih</label><input id="lv-txt" type="text" placeholder="Örnek: 20–22 Kas"></div><div class="field grow"><label for="lv-days">Gün</label><input id="lv-days" type="number" min="1" step="1" value="1"></div></div>
  <div class="err" id="lv-err" role="alert"></div><button class="btn block" data-a="lvok" data-id="${m.uid}">Kaydet</button><p class="small muted">Yıllık izin ve rapor günleri aylık sıralamada kapsam dışı kalır.</p>`);
}
function aiExtract(m) {
  const p = PROFILES[m.uid]; const u = byId(m.uid);
  return { name: u.name, pos: u.title, hire: p.hire, salary: p.salary, hours: p.hours, trial: p.trial, payday: p.payday };
}
function aiModal(m) {
  if (m.step === 'input') {
    return sheet('Kais AI', `<label class="drop" for="ai-file">${ic('camera', 30)}<b>Sözleşmenin fotoğrafını çek ya da dosya seç</b><span class="small muted">JPG, PNG veya PDF</span></label>
    <input class="sr" id="ai-file" type="file" accept="image/*,application/pdf" data-ch="aifile">
    ${m.file ? `<div class="callout">${ic('check')}<div><b>${esc(m.fname)}</b> eklendi.</div></div>` : '<button class="btn sec block" data-a="aisample">Örnek sözleşme kullan</button>'}
    <div class="field"><label for="ai-text">Kais AI'a söyle</label><textarea id="ai-text" placeholder="Örnek: Bu Zeynep Arslan için iş sözleşmesi, kaydet.">${esc(m.text || '')}</textarea></div>
    <button class="btn block" data-a="aigo">${ic('sparkle')} Okusun ve kaydetsin</button><p class="small muted">Prototipte okuma sonucu örnektir. Gerçek sürümde sözleşme görüntüsünden okunur ve her alanı sen onaylarsın.</p>`);
  }
  if (m.step === 'who') {
    return sheet('Kais AI soruyor', `<div class="callout warn">${ic('info')}<div><b>Bu sözleşmenin kime ait olduğunu anlayamadım.</b><p style="margin-top:4px">Mesajında kayıtlı bir çalışan adı yok. Kimin sözleşmesi?</p></div></div>${EMP_IDS.map((id) => `<button class="btn sec block" data-a="aiwho" data-id="${id}">${esc(byId(id).name)}</button>`).join('')}<p class="small muted">Yeni çalışan ekleme bu prototipte yok.</p>`);
  }
  if (m.step === 'reading') {
    return sheet('Sözleşme okunuyor', `<div class="spin" role="status" aria-label="Okunuyor"></div><p class="muted" style="text-align:center">Ad, işe giriş, maaş, çalışma saati ve deneme süresi çıkarılıyor.</p>`);
  }
  const x = aiExtract(m); const p = PROFILES[m.uid]; const mm = monthsBetween(x.hire);
  if (m.step === 'ask') {
    return sheet('Kais AI soruyor', `<div class="callout warn">${ic('info')}<div><b>${esc(x.name)}</b> sözleşmesinde aylık <b>${fmt(x.salary)}</b> yazıyor.<p style="margin-top:4px">Bu tutar net mi, brüt mü? Cevabını maaş hesabında kullanırım.</p></div></div>
    <button class="btn block" data-a="aistype" data-v="net">Net</button><button class="btn sec block" data-a="aistype" data-v="brut">Brüt</button>`);
  }
  const chk = (t, s) => `<div class="check">${`<span class="dot tone-ok">${ic('check', 16)}</span>`}<div><b style="font-weight:600">${esc(t)}</b><div class="small muted">${esc(s)}</div></div></div>`;
  return sheet('Okuma sonucu', `<dl class="kv"><dt>Çalışan</dt><dd>${esc(x.name)}</dd><dt>Görev</dt><dd>${esc(x.pos)}</dd><dt>İşe giriş</dt><dd>${esc(isoTxt(x.hire))}</dd><dt>Maaş</dt><dd class="num">${fmt(x.salary)} ${m.stype === 'net' ? 'net' : 'brüt'}</dd><dt>Haftalık saat</dt><dd>${x.hours} saat</dd><dt>Deneme</dt><dd>${x.trial} ay</dd></dl>
  ${m.stype === 'brut' ? `<div class="callout warn">${ic('alert')}<div>Brüt maaş. Net ödeme bordroya göre belli olur, hesap yaklaşık kalır.</div></div>` : ''}
  <div><b style="font-weight:600">Kais şuralara kaydedecek</b>
  ${chk('Çalışan profili', 'Görev ve işe giriş tarihi')}${chk('Maaş', `${CURM} maaş hesabı, ${fmt0(x.salary)} ${m.stype === 'net' ? 'net' : 'brüt'}`)}${chk('Mesai', `Haftalık ${x.hours} saat, yüzde 50 zamlı fazla mesai`)}${chk('İzinler', `Kıdem ${tenureTxt(mm)}, yıllık izin ${leaveDays(mm, m.uid) || 'henüz yok'}${leaveDays(mm, m.uid) ? ' gün' : ''}`)}${chk('Haklar ve süreler', `Deneme ${x.trial} ay, ihbar süresi ${noticeWeeks(mm)} hafta`)}</div>
  <div class="row"><button class="btn grow" data-a="aisave">Kaydet</button><button class="btn sec" data-a="closemodal">Vazgeç</button></div><p class="small muted">Prototipte okuma sonucu örnektir. Hukuki değerleri iş hukukçusu ya da muhasebeciyle teyit et.</p>`);
}
function renderModal() {
  const root = $('#modal-root');
  if (!root) return;
  const m = S.modal;
  const mk = m && { why: whyModal, rev: reviewModal, pay: payModal, lv: leaveModal, ai: aiModal, lvreq: lvreqModal, lvctr: lvctrModal, lvapp: lvappModal, lvresp: lvrespModal, df: dfModal, debt: debtModal, ldel: ldelModal }[m.type];
  if (!mk) { renderModalV2(); return; }
  root.innerHTML = mk(m);
}

/* ---------- eylemler ---------- */
const _nav = H.nav;
H.nav = (el) => {
  const v = el.dataset.v; const s = el.dataset.s;
  if (v === 'belgeler' && s && S.user.role === 'muhasebeci') S.sub.belgeler = s;
  if (v === 'duyuru' && S.user.role !== 'calisan') MSGS.forEach((x) => { x.whyNew = false; });
  if (v === 'ekip') S.empView = null;
  _nav(el);
};
const _sub = H.sub;
H.sub = (el) => { if (el.dataset.g === 'ekip') S.empView = null; _sub(el); };
const _ms = H.mailsave;
H.mailsave = (el) => { _ms(el); if (S.mail.on && !S.openChk.includes('mail')) { S.openChk.push('mail'); render(); } };

H.respond = (el) => {
  const m = MSGS.find((x) => x.id === el.dataset.id); if (!m) return;
  if (el.dataset.v === 'red') { S.modal = { type: 'why', kind: 'offer', id: m.id }; renderModal(); return; }
  m.res[S.user.id] = 'kabul'; render(); toast('Teklifi kabul ettin.', 'ok');
};
H.approve = (el) => { if (locked()) return; const f = RECEIPTS.find((x) => x.id === el.dataset.id); f.status = 'musavirde'; render(); toast('Fiş onaylandı ve muhasebeciye gönderildi.', 'ok'); };
H.reject = (el) => { if (locked()) return; S.modal = { type: 'why', kind: 'rcpt', id: el.dataset.id }; renderModal(); };
H.resend = (el) => { const f = RECEIPTS.find((x) => x.id === el.dataset.id); f.status = 'musavirde'; f.note = ''; render(); toast('Fiş muhasebeciye tekrar gitti.', 'ok'); };
H.whyok = () => {
  const m = S.modal;
  const t = ((document.getElementById('why-text') || {}).value || '').trim();
  if (t.length < 5) { const er = document.getElementById('why-err'); if (er) er.textContent = 'En az bir cümle yaz. Gerekçe olmadan devam edilemez.'; return; }
  if (m.kind === 'offer') {
    const g = MSGS.find((x) => x.id === m.id); if (!g) { S.modal = null; render(); return; }
    g.res[S.user.id] = 'red'; (g.why = g.why || {})[S.user.id] = { text: t, time: nowT() }; g.whyNew = true;
    S.modal = null; render(); toast('Teklifi reddettin. Mazeretin işverene gitti.', 'ok'); return;
  }
  if (m.kind === 'lvrej') {
    const q = LVREQ.find((x) => x.id === m.id);
    q.status = 'reddedildi'; q.unreadEmp = true; q.thread.push({ by: S.user.id, text: 'Reddedildi: ' + t, time: nowT() });
    S.modal = null; render(); toast('Talep reddedildi. Çalışan gerekçeyi görecek.'); return;
  }
  const f = RECEIPTS.find((x) => x.id === m.id);
  f.note = t;
  if (m.kind === 'rcpt') { f.status = 'reddedildi'; S.modal = null; render(); toast(`Fiş reddedildi. ${byId(f.by).name.split(' ')[0]} gerekçeyi görecek.`); return; }
  f.status = 'duzeltme'; S.modal = null; render(); toast('Düzeltme isteği patrona gitti.', 'ok');
};
H.savereceipt = () => {
  const m = S.modal; const s = m.sample;
  const isEmp = S.user.role === 'calisan';
  const items = !isEmp && s.items && m.cat === 'Hammadde' ? s.items.map((i) => Object.assign({ on: true }, i)) : [];
  RECEIPTS.push({ id: 'f' + ++seq, seller: s.seller, date: s.date, total: s.total, rate: s.rate, cat: m.cat || 'Diğer', status: isEmp ? 'bekliyor' : 'musavirde', by: S.user.id, bank: isEmp ? null : s.bank || null, at: hhmm(new Date()), items });
  const bank = !isEmp && s.bank ? ROWS.find((r) => r.id === s.bank) : null;
  S.modal = null; render();
  toast(isEmp ? 'Fiş işverene onay için gitti.' : bank ? `Fiş muhasebeciye gitti, bildirim gönderildi. Ekstredeki ${bank.date} işlemiyle eşleşti.` : 'Fiş muhasebeciye gitti, bildirim gönderildi.', 'ok');
};
H.review = (el) => {
  if (locked()) return;
  const f = RECEIPTS.find((x) => x.id === el.dataset.id);
  S.modal = { type: 'rev', id: f.id, cat: f.cat, rate: f.rate, total: f.total, items: (f.items || []).map((i) => Object.assign({}, i)) };
  renderModal();
};
H.revret = () => { S.modal = { type: 'why', kind: 'return', id: S.modal.id }; renderModal(); };
H.revok = () => {
  if (locked()) return;
  const m = S.modal; const f = RECEIPTS.find((x) => x.id === m.id);
  if (!(Number(m.total) > 0)) { toast('Toplam tutarı kontrol et.', 'bad'); return; }
  if (m.cat !== f.cat && !RULES.some((r) => r.k === f.seller)) RULES.unshift({ k: f.seller, v: m.cat });
  f.cat = m.cat; f.rate = Number(m.rate); f.total = Number(m.total); f.items = m.items;
  let n = 0;
  m.items.forEach((it) => {
    const s = it.on && it.stk ? STOCK.find((x) => x.id === it.stk) : null; const q = Number(it.qty) || 0;
    if (s && q > 0) { s.qty += q; n++; STOCKLOG.unshift({ t: '14 Kas', name: s.name, qty: q, from: f.seller }); }
  });
  f.status = 'onayli'; f.note = ''; f.fresh = true;
  LEDGER.push({ id: 'g' + ++seq, date: f.date, desc: f.seller, acc: f.cat, doc: docType(f), rate: f.rate, total: f.total, src: 'Kais', rc: f.id, fresh: true });
  S.modal = null; render();
  toast(`Onaylandı. Gider tabloya yazıldı${n ? `, ${n} kalem stoğa girdi` : ''}.`, 'ok');
};
H.ladd = () => { if (locked()) return; LEDGER.push({ id: 'g' + ++seq, date: '14 Kas', desc: 'Yeni gider', acc: 'Diğer', doc: '—', rate: 20, total: 0, src: 'Elle' }); render(); toast('Satır eklendi. Hücrelere dokunup doldur.'); };
H.ldel = (el) => { if (locked()) return; LEDGER = LEDGER.filter((r) => r.id !== el.dataset.id); render(); toast('Satır silindi.'); };

H.empopen = (el) => { S.view = 'ekip'; S.sub.ekip = 'maas'; S.empView = el.dataset.id; render(); if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0); };
H.empback = () => { S.empView = null; render(); };
H.payadd = (el) => { S.modal = { type: 'pay', uid: el.dataset.id }; renderModal(); };
H.payok = (el) => {
  const g = (id) => document.getElementById(id);
  const amt = Number(g('pay-amt').value);
  if (!(amt > 0)) { g('pay-err').textContent = 'Tutarı yaz.'; return; }
  PAYS.push({ id: 'p' + ++seq, uid: el.dataset.id, kind: g('pay-kind').value || 'maas', per: NEXTP, amt, date: (g('pay-date').value || (String(REF.d).padStart(2, '0') + ' ' + CURA)).trim() });
  S.modal = null; render(); toast('Ödeme kaydedildi.', 'ok');
};
H.lvadd = (el) => { S.modal = { type: 'lv', uid: el.dataset.id }; renderModal(); };
H.lvok = (el) => {
  const g = (id) => document.getElementById(id);
  const uid = el.dataset.id; const type = g('lv-type').value || 'yillik'; const days = Number(g('lv-days').value); const txt = (g('lv-txt').value || '').trim();
  if (!(days >= 1)) { g('lv-err').textContent = 'Gün sayısını yaz.'; return; }
  if (!txt) { g('lv-err').textContent = 'Tarihi yaz.'; return; }
  if (type === 'yillik') {
    const ent = (leaveDays(monthsBetween(PROFILES[uid].hire), uid) + yizCarry(uid));
    const used = LEAVES.filter((x) => x.uid === uid && x.type === 'yillik').reduce((a, x) => a + x.days, 0);
    if (days > ent - used) { g('lv-err').textContent = ent ? `Kalan yıllık izin ${ent - used} gün. Daha fazlası için ücretsiz izin seç.` : 'Yıllık izin hakkı henüz doğmadı.'; return; }
  }
  LEAVES.push({ id: 'lv' + ++seq, uid, type, txt, days });
  S.modal = null; render(); toast('İzin kaydedildi.', 'ok');
};

/* Kais AI: sözleşme */
const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9\s]/g, ' ');
function aiWho(text) {
  const t = ' ' + norm(text) + ' ';
  return EMP_IDS.find((id) => { const parts = norm(byId(id).name).split(/\s+/); return t.includes(' ' + parts[0]) || (parts[1] && t.includes(' ' + parts[1])); }) || null;
}
function aiSnap() { const t = document.getElementById('ai-text'); if (t && S.modal && S.modal.type === 'ai') S.modal.text = t.value; }
function aiRead() {
  const m = S.modal; m.step = 'reading'; renderModal();
  setTimeout(() => {
    if (!S.modal || S.modal.type !== 'ai' || S.modal.step !== 'reading') return;
    S.modal.step = S.modal.stype ? 'result' : 'ask'; renderModal();
  }, 1400);
}
H.aiopen = (el) => {
  const uid = el.dataset.id || null;
  S.modal = { type: 'ai', step: 'input', uid, text: uid ? byId(uid).name + ' için iş sözleşmesi, kaydet.' : '', file: false, fname: '', stype: null };
  renderModal();
};
H.aisample = () => { aiSnap(); S.modal.file = true; S.modal.fname = 'is-sozlesmesi.jpg'; renderModal(); };
H.aigo = () => {
  aiSnap();
  const m = S.modal;
  if (!m.file) { toast('Önce sözleşmenin fotoğrafını ekle.', 'warn'); return; }
  const t = ' ' + norm(m.text) + ' ';
  m.stype = / brüt | brut /.test(t) ? 'brut' : / net /.test(t) ? 'net' : null;
  const who = aiWho(m.text) || m.uid;
  if (!who) { m.step = 'who'; renderModal(); return; }
  m.uid = who; aiRead();
};
H.aiwho = (el) => { S.modal.uid = el.dataset.id; aiRead(); };
H.aistype = (el) => { S.modal.stype = el.dataset.v; S.modal.step = 'result'; renderModal(); };
H.aisave = () => {
  const m = S.modal; const p = PROFILES[m.uid];
  p.contract = true; p.stype = m.stype || 'net'; p.cAt = String(REF.d).padStart(2, '0') + ' ' + CURA + ' ' + REF.y; p.fname = m.fname || 'is-sozlesmesi.jpg';
  S.modal = null; S.view = 'ekip'; S.sub.ekip = 'maas'; S.empView = m.uid; render();
  if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  toast(`${byId(m.uid).name.split(' ')[0]} için sözleşme kaydedildi. Maaş, mesai, izin ve haklar güncellendi.`, 'ok');
};

/* değişiklik olayları */
function onChange(e) {
  const el = e.target;
  const ch = el.dataset && el.dataset.ch;
  if (!ch) return;
  const m = S.modal;
  if (ch === 'file') { if (el.files && el.files.length) startRead(); }
  if (ch === 'aifile') { if (m && m.type === 'ai') { aiSnap(); m.file = true; m.fname = (el.files && el.files[0] && el.files[0].name) || 'is-sozlesmesi.jpg'; renderModal(); } }
  if (ch === 'mcat') S.modal.cat = el.value;
  if (ch === 'cat') { RECEIPTS.find((f) => f.id === el.dataset.id).cat = el.value; toast('Kategori güncellendi.'); }
  if (ch === 'role') { byId(el.dataset.id).role = el.value; toast(`${byId(el.dataset.id).name.split(' ')[0]} artık ${ROLE_LABEL[el.value]}.`); }
  if (m && m.type === 'rev') {
    const upd = () => { const k = document.getElementById('rv-kdv'); if (k) k.textContent = 'KDV tutarı: ' + fmt(kdv({ total: Number(m.total), rate: Number(m.rate) })); };
    if (ch === 'rcat') m.cat = el.value;
    if (ch === 'rrate') { m.rate = Number(el.value); upd(); }
    if (ch === 'rtotal') { m.total = Number(el.value) || 0; upd(); }
    if (ch === 'ritem') {
      const it = m.items[Number(el.dataset.i)]; const f = el.dataset.f;
      if (it) { if (f === 'on') it.on = el.checked; else if (f === 'qty') it.qty = Number(el.value) || 0; else if (f === 'stk') it.stk = el.value; }
    }
  }
  if (m && m.type === 'lvapp' && ch === 'lapp') {
    const f = el.dataset.f;
    if (f === 'type') { m.kind = el.value; m.ded = el.value === 'ucretsiz'; renderModal(); }
    else if (f === 'ded') { m.ded = el.value === '1'; renderModal(); }
    else if (f === 'perDay') { m.perDay = Number(el.value) || 0; const t = document.getElementById('la-sumt'); if (t) t.textContent = lappSum(m); }
  }
  if (ch === 'drem') { const d = DEBTS.find((x) => x.id === el.dataset.id); if (d) { d.rem = Number(el.value); toast('Hatırlatma günü güncellendi.'); } }
  if (ch === 'cell') {
    const r = LEDGER.find((x) => x.id === el.dataset.id);
    if (!r) return;
    if (S.closed) { toast(`${PERIOD} dönemi kapalı. Değişiklik için muhasebeciyle konuş.`, 'warn'); return; }
    const k = el.dataset.k; const old = r[k];
    r[k] = k === 'total' ? Number(el.value) || 0 : k === 'rate' ? Number(el.value) : el.value;
    r.edited = true; r.fresh = false;
    if (old !== r[k]) auditCell(r, k, old);
    ledgerRefresh(r);
  }
}


/* v207: şifre sıfırlama bağlantısı durumu (açılış kodu sbBoot erken çalışabildiği için en baştan tanımlı) */
var REC = { on: false, err: '', email: '', tab: 'own', busy: false };
try {
  const hp = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
  if (hp.get('type') === 'recovery' && hp.get('access_token')) { REC.on = true; sessionStorage.setItem('kp_rec', '1'); }
  else if (hp.get('error') && /otp_expired|invalid|expired/i.test((hp.get('error_code') || '') + ' ' + (hp.get('error_description') || ''))) { REC.on = true; REC.err = 'expired'; }
  else if (sessionStorage.getItem('kp_rec') === '1') REC.on = true;
} catch (e) {}
