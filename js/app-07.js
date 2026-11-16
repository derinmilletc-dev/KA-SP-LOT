/* ===== v94: düzenli raporlar (haftalık, ay sonu): PDF, bildirim ve e-posta ===== */
/* ===== KaisPilot rapor modülü: bağımlılıksız PDF yazıcı + rapor kurucular (tarayıcı ve edge function ortak) ===== */
var KP = {};
KP.WR = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
KP.WB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
KP.TRB = { 'Ş': 138, 'ş': 154, 'Ğ': 208, 'ğ': 240, 'İ': 221, 'ı': 253 };
KP.OTH = { '–': 150, '—': 151, '…': 133, '•': 149, '’': 39, '‘': 39, '“': 34, '”': 34, '→': 62, '₺': 0 };
KP.bytes = function (s) {
  var out = [];
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i), c = s.charCodeAt(i);
    if (KP.TRB[ch] !== undefined) out.push(KP.TRB[ch]);
    else if (KP.OTH[ch] !== undefined) { if (ch === '₺') { out.push(84); out.push(76); } else out.push(KP.OTH[ch]); }
    else if (c < 256) out.push(c);
    else out.push(63);
  }
  return out;
};
KP.esc = function (s) {
  var b = KP.bytes(s), o = '';
  for (var i = 0; i < b.length; i++) {
    var c = b[i];
    if (c === 40 || c === 41 || c === 92) o += '\\' + String.fromCharCode(c);
    else if (c < 32 || c > 126) o += '\\' + ('00' + c.toString(8)).slice(-3);
    else o += String.fromCharCode(c);
  }
  return o;
};
KP.cw = function (ch, bold) {
  var T = bold ? KP.WB : KP.WR, c = ch.charCodeAt(0);
  if (c >= 32 && c <= 126) return T[c - 32];
  if (ch === 'ı') return bold ? 278 : 222;
  if (ch === '₺') return 2 * (bold ? 611 : 556);
  var b = ch.normalize ? ch.normalize('NFD').charAt(0) : ch, bc = b.charCodeAt(0);
  if (bc >= 32 && bc <= 126) return T[bc - 32];
  return 556;
};
KP.tw = function (s, size, bold) { var w = 0; for (var i = 0; i < s.length; i++) w += KP.cw(s.charAt(i), bold); return w * size / 1000; };
KP.fit = function (s, w, size, bold) { s = String(s); if (KP.tw(s, size, bold) <= w) return s; while (s.length > 1 && KP.tw(s + '…', size, bold) > w) s = s.slice(0, -1); return s + '…'; };
KP.rgb = function (h) { h = String(h || '#000000').replace('#', ''); var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255; return r.toFixed(3) + ' ' + g.toFixed(3) + ' ' + b.toFixed(3); };
KP.pdf = function () {
  var W = 595.28, H = 841.89, pages = [], cur = null;
  var api = {
    W: W, H: H,
    page: function () { cur = { c: [] }; pages.push(cur); return api; },
    rect: function (x, y, w, h, fill) { cur.c.push(KP.rgb(fill) + ' rg ' + x.toFixed(2) + ' ' + (H - y - h).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re f'); },
    line: function (x1, y1, x2, y2, col, wd) { cur.c.push(KP.rgb(col) + ' RG ' + (wd || 0.6) + ' w ' + x1.toFixed(2) + ' ' + (H - y1).toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + (H - y2).toFixed(2) + ' l S'); },
    text: function (x, y, s, o) {
      o = o || {}; var size = o.size || 10, bold = !!o.bold; s = String(s); var w = KP.tw(s, size, bold);
      if (o.align === 'r') x -= w; else if (o.align === 'c') x -= w / 2;
      cur.c.push('BT ' + KP.rgb(o.color || '#16231c') + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + x.toFixed(2) + ' ' + (H - y).toFixed(2) + ' Td (' + KP.esc(s) + ') Tj ET');
    },
    count: function () { return pages.length; },
    build: function () {
      var objs = [], enc = '<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [138 /Scedilla 154 /scedilla 208 /Gbreve 240 /gbreve 221 /Idotaccent 253 /dotlessi] >>';
      objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      var kids = [];
      for (var i = 0; i < pages.length; i++) kids.push((5 + i * 2) + ' 0 R');
      objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages.length + ' >>';
      objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding ' + enc + ' >>';
      objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding ' + enc + ' >>';
      for (var p = 0; p < pages.length; p++) {
        var st = pages[p].c.join('\n');
        objs[5 + p * 2] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (6 + p * 2) + ' 0 R >>';
        objs[6 + p * 2] = '<< /Length ' + st.length + ' >>\nstream\n' + st + '\nendstream';
      }
      var out = '%PDF-1.4\n', off = [];
      for (var k = 1; k < objs.length; k++) { off[k] = out.length; out += k + ' 0 obj\n' + objs[k] + '\nendobj\n'; }
      var xr = out.length; out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
      for (var j = 1; j < objs.length; j++) out += ('0000000000' + off[j]).slice(-10) + ' 00000 n \n';
      out += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
      var u = new Uint8Array(out.length); for (var q = 0; q < out.length; q++) u[q] = out.charCodeAt(q) & 255; return u;
    }
  };
  return api;
};
/* sayı ve para biçimi (ICU'ya bağlı kalmadan) */
KP.n = function (v, d) { v = Number(v) || 0; var neg = v < 0; v = Math.abs(v); var s = v.toFixed(d || 0), p = s.split('.'), i = p[0], o = ''; while (i.length > 3) { o = '.' + i.slice(-3) + o; i = i.slice(0, -3); } o = i + o; if (p[1]) o += ',' + p[1]; return (neg ? '-' : '') + o; };
KP.tl = function (v) { return KP.n(v, 0) + ' TL'; };
KP.tl2 = function (v) { return KP.n(v, 2) + ' TL'; };
KP.pct = function (a, b) { return b > 0 ? Math.round((a - b) / b * 100) : null; };
KP.delta = function (a, b) { var p = KP.pct(a, b); return p === null ? { t: 'önceki dönem yok', tone: '' } : { t: (p >= 0 ? '+' : '') + p + '% önceki döneme göre', tone: p >= 0 ? 'ok' : 'bad' }; };
KP.nrm = function (s) { return String(s || '').toLowerCase().replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/[^a-z0-9ğüşöç ]/g, ''); };
KP.dayMs = 864e5;
/* ---- sayfa yerleşimi ---- */
KP.render = function (R) {
  var d = KP.pdf(), W = d.W, H = d.H, M = 40, G = '#1f6f55', INK = '#16231c', MUT = '#5b6b63', y = 0;
  function head(first) {
    d.page();
    if (first) {
      d.rect(0, 0, W, 86, G); d.text(M, 38, R.brand || 'KaisPilot', { size: 10, color: '#cfeadd', bold: true });
      d.text(M, 64, R.title, { size: 22, bold: true, color: '#ffffff' }); d.text(W - M, 38, R.org || '', { size: 10, align: 'r', color: '#ffffff', bold: true }); d.text(W - M, 64, R.sub || '', { size: 10, align: 'r', color: '#cfeadd' });
      y = 112;
    } else { d.rect(0, 0, W, 34, G); d.text(M, 22, (R.brand || 'KaisPilot') + ' · ' + R.title, { size: 9.5, bold: true, color: '#ffffff' }); d.text(W - M, 22, R.sub || '', { size: 9, align: 'r', color: '#cfeadd' }); y = 58; }
  }
  function need(h) { if (y + h > H - 54) { head(false); } }
  head(true);
  var kp = R.kpis || [], gap = 10, kw = (W - 2 * M - gap * (kp.length - 1)) / Math.max(1, kp.length);
  kp.forEach(function (k, i) {
    var x = M + i * (kw + gap); d.rect(x, y, kw, 66, '#f1f6f3'); d.rect(x, y, 3, 66, k.tone === 'bad' ? '#b3392f' : G);
    d.text(x + 12, y + 18, k.l, { size: 8.5, color: MUT, bold: true }); d.text(x + 12, y + 40, KP.fit(k.v, kw - 18, 15, true), { size: 15, bold: true });
    d.text(x + 12, y + 56, KP.fit(k.d || '', kw - 18, 7.5, false), { size: 7.5, color: k.tone === 'bad' ? '#b3392f' : k.tone === 'ok' ? G : MUT });
  });
  y += 66 + 22;
  if (R.bullets && R.bullets.length) {
    d.text(M, y, 'Öne çıkanlar', { size: 12, bold: true }); y += 8;
    R.bullets.forEach(function (b) {
      var lines = KP.wrap(b, W - 2 * M - 16, 9.5, false); need(lines.length * 13 + 6); y += 14;
      d.rect(M, y - 7, 4, 4, G); lines.forEach(function (l, i) { d.text(M + 12, y + i * 13, l, { size: 9.5 }); }); y += (lines.length - 1) * 13;
    });
    y += 30;
  }
  if (R.bars && R.bars.items && R.bars.items.length) {
    var items = R.bars.items, bh = 92, bw = W - 2 * M; need(bh + 56); d.text(M, y, R.bars.title, { size: 12, bold: true }); y += 14;
    var mx = 1; items.forEach(function (it) { mx = Math.max(mx, it.v || 0, it.v2 || 0); });
    var n = items.length, slot = bw / n, two = items.some(function (it) { return it.v2 !== undefined; }), base = y + bh;
    d.line(M, base, W - M, base, '#cfdad4', 0.8);
    items.forEach(function (it, i) {
      var x = M + i * slot, bwid = Math.min(26, slot * (two ? 0.34 : 0.62)), h1 = Math.round((it.v || 0) / mx * (bh - 14)), c = x + slot / 2;
      if (two) { var h2 = Math.round((it.v2 || 0) / mx * (bh - 14)); d.rect(c - bwid - 1, base - h1, bwid, Math.max(h1, 0), G); d.rect(c + 1, base - h2, bwid, Math.max(h2, 0), '#d98a2b'); }
      else { d.rect(c - bwid / 2, base - h1, bwid, Math.max(h1, 0), it.hi ? G : '#9ccbb6'); }
      if (n <= 10 && (it.v || 0) > 0 && !two) d.text(c, base - h1 - 3, KP.n(it.v, 0), { size: 7, align: 'c', color: MUT });
      if (n <= 12 || i % Math.ceil(n / 12) === 0) d.text(c, base + 11, it.l, { size: 7.5, align: 'c', color: MUT });
    });
    if (two) { d.rect(W - M - 150, y - 12, 8, 8, G); d.text(W - M - 138, y - 5, R.bars.n1 || 'Gelir', { size: 8, color: MUT }); d.rect(W - M - 80, y - 12, 8, 8, '#d98a2b'); d.text(W - M - 68, y - 5, R.bars.n2 || 'Gider', { size: 8, color: MUT }); }
    y = base + 34;
  }
  (R.tables || []).forEach(function (t) {
    need(70); d.text(M, y, t.title, { size: 12, bold: true }); y += 8;
    if (t.note) { y += 12; d.text(M, y, t.note, { size: 8.5, color: MUT }); y -= 2; }
    if (!t.rows || !t.rows.length) { y += 20; d.text(M, y, t.empty || 'Bu dönemde kayıt yok.', { size: 9.5, color: MUT }); y += 24; return; }
    var tw = W - 2 * M;
    function th() { y += 4; d.rect(M, y, tw, 20, '#e8efea'); var x = M; t.cols.forEach(function (c) { var cw = c.w * tw; d.text(c.a === 'r' ? x + cw - 8 : x + 8, y + 13.5, c.h, { size: 8.5, bold: true, color: MUT, align: c.a === 'r' ? 'r' : 'l' }); x += cw; }); y += 20; }
    th();
    t.rows.forEach(function (r, ri) {
      if (y + 20 > H - 54) { head(false); th(); }
      if (ri % 2) d.rect(M, y, tw, 20, '#f7faf8'); var x = M;
      t.cols.forEach(function (c, ci) { var cw = c.w * tw, v = r[ci], tone = r.tone && r.tone[ci]; var col = tone === 'bad' ? '#b3392f' : tone === 'ok' ? G : INK; d.text(c.a === 'r' ? x + cw - 8 : x + 8, y + 13.5, KP.fit(v === undefined || v === null ? '' : v, cw - 14, 9, ci === 0 && t.boldFirst), { size: 9, align: c.a === 'r' ? 'r' : 'l', color: col, bold: ci === 0 && t.boldFirst }); x += cw; });
      y += 20;
    });
    y += 22;
  });
  var N = d.count();
  return { doc: d, pages: N };
};
KP.wrap = function (s, w, size, bold) { var words = String(s).split(' '), lines = [], l = ''; words.forEach(function (x) { var t = l ? l + ' ' + x : x; if (KP.tw(t, size, bold) > w && l) { lines.push(l); l = x; } else l = t; }); if (l) lines.push(l); return lines; };
KP.build = function (R) { var r = KP.render(R); return r.doc.build(); };
/* ---- dönem hesabı (İstanbul, UTC+3) ---- */
KP.istDay = function (iso) { return Date.parse(iso + 'T00:00:00+03:00'); };
KP.isoOf = function (ms) { var d = new Date(ms + 3 * 3600000); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); };
KP.MON = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
KP.MONL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
KP.fd = function (ms) { var d = new Date(ms + 3 * 3600000); return d.getUTCDate() + ' ' + KP.MON[d.getUTCMonth()]; };
/* kind: 'w' (geçen hafta, Pzt-Paz) ya da 'm' (bu ay, 1'inden yarına kadar); todayIso: İstanbul bugünü */
KP.period = function (kind, todayIso) {
  var t0 = KP.istDay(todayIso), from, to, pf, pt, label;
  if (kind === 'w') {
    var dow = (new Date(t0 + 3 * 3600000).getUTCDay() + 6) % 7; to = t0 - dow * KP.dayMs; from = to - 7 * KP.dayMs; pf = from - 7 * KP.dayMs; pt = from;
    label = KP.fd(from) + ' - ' + KP.fd(to - KP.dayMs) + ' ' + new Date(from + 3 * 3600000).getUTCFullYear();
  } else {
    var a = todayIso.split('-').map(Number); from = KP.istDay(a[0] + '-' + ('0' + a[1]).slice(-2) + '-01'); to = t0 + KP.dayMs;
    var py = a[1] === 1 ? a[0] - 1 : a[0], pm = a[1] === 1 ? 12 : a[1] - 1; pf = KP.istDay(py + '-' + ('0' + pm).slice(-2) + '-01'); pt = from;
    label = KP.MONL[a[1] - 1] + ' ' + a[0];
  }
  return { kind: kind, from: from, to: to, pfrom: pf, pto: pt, label: label, title: kind === 'w' ? 'Haftalık rapor' : 'Aylık rapor' };
};
KP.buckets = function (P, getT, getV, getV2) {
  var n = Math.round((P.to - P.from) / KP.dayMs), items = [], i;
  for (i = 0; i < n; i++) { var s = P.from + i * KP.dayMs, d = new Date(s + 3 * 3600000), lab = P.kind === 'w' ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][(d.getUTCDay() + 6) % 7] : String(d.getUTCDate()); items.push({ l: lab, v: 0, v2: getV2 ? 0 : undefined, s: s }); }
  getT.forEach(function (o) { var k = Math.floor((o.t - P.from) / KP.dayMs); if (k >= 0 && k < n) { items[k].v += getV(o) || 0; if (getV2) items[k].v2 += getV2(o) || 0; } });
  return items;
};
/* ---- toptancı raporu ---- */
KP.supReport = function (D) {
  var P = D.P, inP = function (t, a, b) { return t >= a && t < b; };
  var ok = D.orders.filter(function (o) { return o.status === 'onaylandi' || o.status === 'teslim'; });
  var cur = ok.filter(function (o) { return inP(o.t, P.from, P.to); }), prv = ok.filter(function (o) { return inP(o.t, P.pfrom, P.pto); });
  var sum = function (L) { return L.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0); };
  var costOf = function (name) { var c = D.costs[KP.nrm(name)]; return c > 0 ? c : 0; };
  var profit = function (L) { var k = 0, any = false; L.forEach(function (o) { o.lines.forEach(function (l) { var c = costOf(l.name); if (c > 0) { any = true; k += (Number(l.price) - c) * Number(l.qty); } }); }); return { v: k, any: any }; };
  var c1 = sum(cur), c0 = sum(prv), p1 = profit(cur), p0 = profit(prv), avg = cur.length ? c1 / cur.length : 0, avg0 = prv.length ? c0 / prv.length : 0;
  var dc = KP.delta(c1, c0), dn = KP.delta(cur.length, prv.length), dp = KP.delta(p1.v, p0.v);
  var kpis = [{ l: 'CİRO', v: KP.tl(c1), d: dc.t, tone: dc.tone }, { l: 'SİPARİŞ', v: String(cur.length), d: dn.t, tone: dn.tone }, { l: 'ORTALAMA SEPET', v: KP.tl(avg), d: KP.delta(avg, avg0).t, tone: KP.delta(avg, avg0).tone }, { l: 'TAHMİNİ KÂR', v: p1.any ? KP.tl(p1.v) : '-', d: p1.any ? dp.t : 'maliyet girilmemiş', tone: p1.any ? dp.tone : '' }];
  var by = {}; cur.forEach(function (o) { var b = by[o.biz] = by[o.biz] || { n: 0, t: 0 }; b.n++; b.t += Number(o.total) || 0; });
  var cus = Object.keys(by).sort(function (a, b) { return by[b].t - by[a].t; });
  var pr = {}; cur.forEach(function (o) { o.lines.forEach(function (l) { var p = pr[l.name] = pr[l.name] || { q: 0, t: 0, k: 0, u: l.unit }; var q = Number(l.qty) || 0, v = (Number(l.price) || 0) * q; p.q += q; p.t += v; var c = costOf(l.name); if (c > 0) p.k += v - c * q; }); });
  var prd = Object.keys(pr).sort(function (a, b) { return pr[b].t - pr[a].t; });
  var items = KP.buckets(P, cur, function (o) { return Number(o.total) || 0; }); var best = items.reduce(function (a, b) { return b.v > a.v ? b : a; }, items[0] || { v: 0 }); items.forEach(function (i) { i.hi = i.v === best.v && i.v > 0; });
  var bullets = [];
  if (prv.length || cur.length) bullets.push('Ciro ' + KP.tl(c1) + ' oldu' + (c0 > 0 ? ', önceki döneme göre %' + Math.abs(KP.pct(c1, c0)) + (c1 >= c0 ? ' arttı.' : ' azaldı.') : '.'));
  if (best.v > 0) bullets.push('En güçlü gün ' + (P.kind === 'w' ? best.l : best.l + '. gün') + ' oldu (' + KP.tl(best.v) + ').');
  if (cus.length) { var share = Math.round(by[cus[0]].t / (c1 || 1) * 100); bullets.push('En çok alan müşteri ' + cus[0] + ' (cironun %' + share + "'i)." + (share >= 50 ? ' Tek müşteriye bağımlılık yüksek, yeni müşteri kazanmayı düşün.' : '')); }
  var open = D.cari.filter(function (c) { return c.kind === 'alacak' && !c.paid; }), late = open.filter(function (c) { return c.due && Date.parse(c.due) < D.now; });
  if (late.length) bullets.push(late.length + ' alacağın vadesi geçti, toplam ' + KP.tl(late.reduce(function (s, c) { return s + (Number(c.amt) || 0); }, 0)) + '. Hatırlatma gönder.');
  var low = D.prods.filter(function (p) { return p.active !== false && Number(p.min) > 0 && Number(p.qty) <= Number(p.min); });
  if (low.length) bullets.push(low.length + ' ürün kritik stok seviyesinde.');
  var mg = prd.filter(function (k) { return pr[k].t > 0 && pr[k].k !== 0 && pr[k].k / pr[k].t < 0.08; }); if (mg.length) bullets.push(mg.length + ' üründe marj %8 altında: ' + mg.slice(0, 2).join(', ') + '.');
  var tables = [];
  tables.push({ title: 'En çok alan müşteriler', cols: [{ h: 'Müşteri', w: 0.46 }, { h: 'Sipariş', w: 0.14, a: 'r' }, { h: 'Ciro', w: 0.22, a: 'r' }, { h: 'Pay', w: 0.18, a: 'r' }], rows: cus.slice(0, 8).map(function (k) { return [k, by[k].n, KP.tl(by[k].t), '%' + Math.round(by[k].t / (c1 || 1) * 100)]; }), boldFirst: true });
  tables.push({ title: 'En çok satan ürünler', cols: [{ h: 'Ürün', w: 0.4 }, { h: 'Miktar', w: 0.18, a: 'r' }, { h: 'Ciro', w: 0.2, a: 'r' }, { h: 'Tahmini kâr', w: 0.22, a: 'r' }], rows: prd.slice(0, 8).map(function (k) { var p = pr[k]; return [k, KP.n(p.q, 1) + ' ' + (p.u || ''), KP.tl(p.t), p.k ? KP.tl(p.k) : '-']; }), boldFirst: true });
  tables.push({ title: 'Alacaklar', note: 'Açık alacak toplamı ' + KP.tl(open.reduce(function (s, c) { return s + (Number(c.amt) || 0); }, 0)) + ', vadesi geçen ' + late.length + ' kayıt.', cols: [{ h: 'Müşteri', w: 0.4 }, { h: 'Vade', w: 0.2 }, { h: 'Gecikme', w: 0.18, a: 'r' }, { h: 'Tutar', w: 0.22, a: 'r' }], rows: open.slice().sort(function (a, b) { return String(a.due || '9').localeCompare(String(b.due || '9')); }).slice(0, 8).map(function (c) { var g = c.due ? Math.round((D.now - Date.parse(c.due)) / KP.dayMs) : 0; var r = [c.who, c.due || '-', g > 0 ? g + ' gün' : '-', KP.tl(c.amt)]; r.tone = [null, null, g > 0 ? 'bad' : null, null]; return r; }), boldFirst: true, empty: 'Açık alacak yok.' });
  tables.push({ title: 'Stok uyarıları', cols: [{ h: 'Ürün', w: 0.46 }, { h: 'Elde', w: 0.18, a: 'r' }, { h: 'Kritik seviye', w: 0.2, a: 'r' }, { h: 'Durum', w: 0.16, a: 'r' }], rows: low.sort(function (a, b) { return (a.qty / (a.min || 1)) - (b.qty / (b.min || 1)); }).slice(0, 8).map(function (p) { var r = [p.name, KP.n(p.qty, 1) + ' ' + (p.unit || ''), KP.n(p.min, 1), Number(p.qty) <= 0 ? 'Bitti' : 'Az']; r.tone = [null, null, null, 'bad']; return r; }), boldFirst: true, empty: 'Kritik stokta ürün yok.' });
  var gl = D.ledger.filter(function (e) { return inP(e.t, P.from, P.to); }), gel = 0, gid = 0; gl.forEach(function (e) { if (e.type === 'gider') gid += Number(e.amt) || 0; else gel += Number(e.amt) || 0; });
  tables.push({ title: 'Defter (gelir ve gider)', cols: [{ h: 'Kalem', w: 0.6 }, { h: 'Tutar', w: 0.4, a: 'r' }], rows: [['Kayıtlı gelir', KP.tl(gel)], ['Kayıtlı gider', KP.tl(gid)], ['Net', KP.tl(gel - gid)]], boldFirst: true });
  var seen = {}; D.orders.forEach(function (o) { if (o.status === 'onaylandi' || o.status === 'teslim') { var s = seen[o.biz] = seen[o.biz] || { last: 0, n: 0 }; s.n++; if (o.t > s.last) s.last = o.t; } });
  var quiet = Object.keys(seen).filter(function (k) { return D.now - seen[k].last > 30 * KP.dayMs && seen[k].n >= 2; }).sort(function (a, b) { return seen[a].last - seen[b].last; });
  if (quiet.length) tables.push({ title: 'Sessiz kalan müşteriler', note: 'Son 30 gündür sipariş vermeyenler.', cols: [{ h: 'Müşteri', w: 0.5 }, { h: 'Son sipariş', w: 0.3 }, { h: 'Gün', w: 0.2, a: 'r' }], rows: quiet.slice(0, 8).map(function (k) { return [k, KP.fd(seen[k].last), String(Math.round((D.now - seen[k].last) / KP.dayMs))]; }), boldFirst: true });
  return { brand: 'KaisPilot Toptancı', title: P.title, sub: P.label, org: D.name, kpis: kpis, bullets: bullets, bars: { title: P.kind === 'w' ? 'Günlük ciro' : 'Günlük ciro (ay boyunca)', items: items }, tables: tables, summary: 'Ciro ' + KP.tl(c1) + (c0 > 0 ? ' (' + dc.t.split(' önceki')[0] + ')' : '') + ', ' + cur.length + ' sipariş' + (cus.length ? ', en çok ' + cus[0] : '') };
};
/* ---- işletme raporu (patron ve muhasebeci) ---- */
KP.trDate = function (s, nowMs) {
  var m = /^(\d{1,2})\s+(\S+)/.exec(String(s || '')); if (!m) return null; var mi = KP.MON.indexOf(m[2]); if (mi < 0) return null;
  var ny = new Date(nowMs + 3 * 3600000).getUTCFullYear(), nm = new Date(nowMs + 3 * 3600000).getUTCMonth(), y = ny; if (mi > nm + 1) y = ny - 1;
  return KP.istDay(y + '-' + ('0' + (mi + 1)).slice(-2) + '-' + ('0' + Number(m[1])).slice(-2));
};
KP.bizReport = function (D) {
  var P = D.P, role = D.role, inP = function (t, a, b) { return t >= a && t < b; }, L = [];
  D.ledger.forEach(function (r) { var t = r.iso ? KP.istDay(r.iso) : KP.trDate(r.date, D.now); if (t === null) return; L.push({ t: t, dir: r.dir || 'gider', total: Number(r.total) || 0, rate: Number(r.rate) || 0, acc: r.acc || 'Diğer', desc: r.desc || '', doc: r.doc, date: r.date }); });
  var cur = L.filter(function (e) { return inP(e.t, P.from, P.to); }), prv = L.filter(function (e) { return inP(e.t, P.pfrom, P.pto); });
  var tot = function (A, dir) { return A.filter(function (e) { return e.dir === dir; }).reduce(function (s, e) { return s + e.total; }, 0); };
  var kd = function (A, dir) { return A.filter(function (e) { return e.dir === dir; }).reduce(function (s, e) { return s + (e.total - e.total / (1 + e.rate / 100)); }, 0); };
  var g1 = tot(cur, 'gelir'), x1 = tot(cur, 'gider'), g0 = tot(prv, 'gelir'), x0 = tot(prv, 'gider'), n1 = g1 - x1, n0 = g0 - x0;
  var dg = KP.delta(g1, g0), dx = KP.delta(x1, x0); var dn = n0 !== 0 ? KP.delta(n1, Math.abs(n0)) : { t: 'önceki dönem yok', tone: '' }; if (x1 > x0 && x0 > 0) dx.tone = 'bad'; else if (x0 > 0) dx.tone = 'ok';
  var debts = D.debts.filter(function (d) { return !d.paid; }), lateD = debts.filter(function (d) { return d.due && Date.parse(d.due) < D.now; }), recv = D.recv.filter(function (a) { return !a.paid; });
  var kpis = [{ l: 'GELİR', v: KP.tl(g1), d: dg.t, tone: dg.tone }, { l: 'GİDER', v: KP.tl(x1), d: dx.t, tone: dx.tone }, { l: 'NET', v: KP.tl(n1), d: dn.t, tone: n1 < 0 ? 'bad' : dn.tone }];
  var kv = kd(cur, 'gelir') - kd(cur, 'gider');
  kpis.push(role === 'muhasebeci' ? { l: 'KDV FARKI', v: KP.tl(kv), d: kv >= 0 ? 'ödenecek KDV tahmini' : 'devreden KDV tahmini', tone: '' } : { l: 'AÇIK BORÇ', v: KP.tl(debts.reduce(function (s, d) { return s + (Number(d.amt) || 0); }, 0)), d: lateD.length ? lateD.length + ' kaydın vadesi geçti' : 'vadesi geçen yok', tone: lateD.length ? 'bad' : 'ok' });
  var items = KP.buckets(P, cur, function (e) { return e.dir === 'gelir' ? e.total : 0; }, function (e) { return e.dir === 'gider' ? e.total : 0; });
  var byA = {}; cur.filter(function (e) { return e.dir === 'gider'; }).forEach(function (e) { byA[e.acc] = (byA[e.acc] || 0) + e.total; }); var ak = Object.keys(byA).sort(function (a, b) { return byA[b] - byA[a]; });
  var byG = {}; cur.filter(function (e) { return e.dir === 'gelir'; }).forEach(function (e) { byG[e.acc] = (byG[e.acc] || 0) + e.total; }); var gk = Object.keys(byG).sort(function (a, b) { return byG[b] - byG[a]; });
  var nodoc = cur.filter(function (e) { return !e.doc || e.doc === '—' || e.doc === 'eksik'; });
  var bullets = [];
  bullets.push('Dönem sonucu: gelir ' + KP.tl(g1) + ', gider ' + KP.tl(x1) + ', net ' + KP.tl(n1) + (n1 < 0 ? ' (zarar).' : '.'));
  if (ak.length) bullets.push('En büyük gider kalemi ' + ak[0] + ': ' + KP.tl(byA[ak[0]]) + ' (giderin %' + Math.round(byA[ak[0]] / (x1 || 1) * 100) + ').');
  if (x0 > 0 && x1 > x0 * 1.15) bullets.push('Giderler önceki döneme göre %' + KP.pct(x1, x0) + ' arttı, kalemleri kontrol et.');
  if (lateD.length) bullets.push(lateD.length + ' borcun vadesi geçti, toplam ' + KP.tl(lateD.reduce(function (s, d) { return s + (Number(d.amt) || 0); }, 0)) + '.');
  if (nodoc.length) bullets.push(nodoc.length + ' kayıtta belge yok' + (role === 'muhasebeci' ? ', KDV indirimi için belgeleri tamamla.' : '.'));
  var low = D.stock.filter(function (s) { return Number(s.min) > 0 && Number(s.qty) <= Number(s.min); });
  if (role !== 'muhasebeci' && low.length) bullets.push(low.length + ' ürün kritik stokta.');
  var tables = [];
  tables.push({ title: 'Gider dağılımı', cols: [{ h: 'Kalem', w: 0.5 }, { h: 'Tutar', w: 0.28, a: 'r' }, { h: 'Pay', w: 0.22, a: 'r' }], rows: ak.slice(0, 8).map(function (k) { return [k, KP.tl(byA[k]), '%' + Math.round(byA[k] / (x1 || 1) * 100)]; }), boldFirst: true });
  tables.push({ title: 'Gelir dağılımı', cols: [{ h: 'Kalem', w: 0.5 }, { h: 'Tutar', w: 0.28, a: 'r' }, { h: 'Pay', w: 0.22, a: 'r' }], rows: gk.slice(0, 6).map(function (k) { return [k, KP.tl(byG[k]), '%' + Math.round(byG[k] / (g1 || 1) * 100)]; }), boldFirst: true });
  tables.push({ title: 'Borçlar', note: 'Açık borç toplamı ' + KP.tl(debts.reduce(function (s, d) { return s + (Number(d.amt) || 0); }, 0)) + '.', cols: [{ h: 'Kime', w: 0.4 }, { h: 'Vade', w: 0.2 }, { h: 'Kalan gün', w: 0.18, a: 'r' }, { h: 'Tutar', w: 0.22, a: 'r' }], rows: debts.slice().sort(function (a, b) { return String(a.due || '9').localeCompare(String(b.due || '9')); }).slice(0, 8).map(function (d) { var k = d.due ? Math.round((Date.parse(d.due) - D.now) / KP.dayMs) : null; var r = [d.who, d.due || '-', k === null ? '-' : (k < 0 ? Math.abs(k) + ' gün geçti' : k + ' gün'), KP.tl(d.amt)]; r.tone = [null, null, k !== null && k < 0 ? 'bad' : null, null]; return r; }), boldFirst: true, empty: 'Açık borç yok.' });
  if (role !== 'muhasebeci') {
    tables.push({ title: 'Alacaklar', note: 'Açık alacak toplamı ' + KP.tl(recv.reduce(function (s, a) { return s + (Number(a.amt) || 0); }, 0)) + '.', cols: [{ h: 'Kimden', w: 0.5 }, { h: 'Gecikme', w: 0.22, a: 'r' }, { h: 'Tutar', w: 0.28, a: 'r' }], rows: recv.slice(0, 6).map(function (a) { return [a.name, (a.days || 0) + ' gün', KP.tl(a.amt)]; }), boldFirst: true, empty: 'Açık alacak yok.' });
    tables.push({ title: 'Kritik stok', cols: [{ h: 'Ürün', w: 0.5 }, { h: 'Elde', w: 0.25, a: 'r' }, { h: 'Alt sınır', w: 0.25, a: 'r' }], rows: low.slice(0, 8).map(function (s) { return [s.name, KP.n(s.qty, 1) + ' ' + (s.unit || ''), KP.n(s.min, 1)]; }), boldFirst: true, empty: 'Kritik stokta ürün yok.' });
  } else {
    tables.push({ title: 'Belgesiz kayıtlar', note: 'Belge türü girilmemiş giderler. Eksik belge KDV indirimini engeller.', cols: [{ h: 'Tarih', w: 0.16 }, { h: 'Açıklama', w: 0.5 }, { h: 'KDV', w: 0.1, a: 'r' }, { h: 'Tutar', w: 0.24, a: 'r' }], rows: nodoc.slice(0, 12).map(function (e) { return [e.date, e.desc, '%' + e.rate, KP.tl(e.total)]; }), empty: 'Tüm kayıtların belgesi var.' });
  }
  return { brand: 'KaisPilot', title: P.title, sub: P.label, org: D.name, kpis: kpis, bullets: bullets, bars: { title: P.kind === 'w' ? 'Günlük gelir ve gider' : 'Günlük gelir ve gider (ay boyunca)', items: items, n1: 'Gelir', n2: 'Gider' }, tables: tables, summary: 'Gelir ' + KP.tl(g1) + ', gider ' + KP.tl(x1) + ', net ' + KP.tl(n1) + (lateD.length ? ', ' + lateD.length + ' vadesi geçen borç' : '') };
};


const rpPref = () => { const s = S.settings; s.reports = s.reports || {}; return s.reports; };
const rpOn = (k) => rpPref()[k] !== false;
function rpDl(name, bytes) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

function rpWhy(j) { const w = String((j && (j.why || j.error)) || ''); if (/RESEND/i.test(w)) return 'E-posta servisi henüz kurulmamış. Kurulumu yapan kişiye ilet.'; if (/yetki/i.test(w)) return 'Bu raporu e-postayla alma yetkin yok.'; if (/veri yok|okunamad/i.test(w)) return 'İşletme verisi henüz buluta kaydedilmemiş. Biraz sonra tekrar dene.'; return w || 'Gönderilemedi.'; }
function reportCard() { const u = S.user; if (!u || !['patron', 'muhasebeci'].includes(u.role)) return '';
  const row = (k, t, d) => `<div class="toggle"><div><b style="font-weight:600">${t}</b><div class="small muted">${d}</div></div><button class="sw" data-a="rptog" data-v="${k}" role="switch" aria-checked="${rpOn(k)}" aria-label="${t}"></button></div>`;
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Düzenli raporlar</h3><p class="muted small" style="margin-top:2px">${u.role === 'muhasebeci' ? 'KDV, belgesiz kayıt ve borç vadelerini öne çıkaran' : 'Gelir, gider, borç ve stok durumunu özetleyen'} PDF rapor.</p></div>
  ${row('w', 'Haftalık rapor', 'Her Pazartesi 08:30 civarı, geçen haftanın özeti')}${row('m', 'Aylık rapor', 'Ay sonu akşamı, o ayın özeti')}${row('push', 'Bildirim olarak gelsin', 'Rapor hazır olunca telefona haber verir')}${row('mail', 'E-postaya PDF gelsin', 'Hesabına kayıtlı e-posta adresine ek olarak')}
  <div style="padding:12px 16px" class="stack"><div class="row wrap"><button class="btn sec sm" data-a="rptpdf" data-v="w">Geçen haftayı PDF indir</button><button class="btn sec sm" data-a="rptpdf" data-v="m">Bu ayı PDF indir</button></div><div class="row wrap"><button class="btn sec sm" data-a="rptmail" data-v="w">Haftalığı e-postama gönder</button><button class="btn sec sm" data-a="rptmail" data-v="m">Aylığı e-postama gönder</button></div></div></div>`; }
H.rptog = (el) => { const k = el.dataset.v; rpPref()[k] = !rpOn(k); if (typeof pSched === 'function') pSched(); render(); };
H.rptpdf = (el) => { try { const kind = el.dataset.v; const D = rpData(kind); const R = KP.bizReport(D); rpDl('kaispilot-' + (kind === 'w' ? 'haftalik' : 'aylik') + '-rapor.pdf', KP.build(R)); toast('PDF hazır.', 'ok'); } catch (e) { toast('PDF oluşturulamadı.', 'warn'); } };
H.rptmail = async (el) => { const c = sbClient(); if (!c || !SBS.biz) { toast('E-posta için önce Tedarikçi ekranından hesabına bağlan.', 'warn'); return; } if (SBS.busy) return; SBS.busy = true;
  try { try { if (typeof pFlush === 'function') await pFlush(); } catch (e) {} const s = await c.auth.getSession(); const tok = s && s.data && s.data.session && s.data.session.access_token; const r = await fetch(SB_URL + '/functions/v1/kais-push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, apikey: SB_KEY }, body: JSON.stringify({ action: 'report_now', scope: 'biz', business_id: SBS.biz.id, kind: el.dataset.v }) }); const j = await r.json().catch(() => ({})); if (j && j.ok) toast('PDF rapor ' + j.to + ' adresine gönderildi.', 'ok'); else toast(rpWhy(j), 'warn'); } catch (e) { toast('Bağlantı kurulamadı. Sonra tekrar dene.', 'warn'); } finally { SBS.busy = false; } };
const _va94 = viewAyarlar; viewAyarlar = function () { return _va94() + reportCard(); };
const _vd94 = viewDonem; viewDonem = function () { return _vd94() + reportCard(); };
/* ===== v95: toptancının müşteriye özel sabit fiyatı ===== */
const _sgPull95 = sgPull;
sgPull = async function () { const r = await _sgPull95(); try { const c = sbClient(); const ids = SUPPLIERS.filter((t) => t.sbid).map((t) => t.sbid); if (c && ids.length) { const q = await c.from('supplier_cprice').select('supplier_id,product_id,price').in('supplier_id', ids); if (!q.error) SUPPLIERS.forEach((t) => { t.cprN = 0; (q.data || []).filter((x) => x.supplier_id === t.sbid).forEach((x) => { if (t.items && t.live && t.live[x.product_id] && !t.live[x.product_id].out && Number(x.price) > 0) { t.items[x.product_id] = Number(x.price); t.cprN++; } }); }); } } catch (e) {} return r; };
const _supinfo95 = NEWM.supinfo; NEWM.supinfo = (m) => { const h = _supinfo95(m); const t = supById(m.id); return t && t.cprN > 0 ? h.replace('<div class="stack">', '<div class="stack"><div class="callout"><div><b>' + t.cprN + ' üründe sana özel sabit fiyat var</b><div class="small muted">Sipariş verirken bu fiyatlar otomatik uygulanır.</div></div></div>') : h; };

if (typeof window !== 'undefined') { window.__K = { RESV, TABLES, RCFG, ONB, ONB_DEF, onbDecide, onbPage, viewSartlar, lxEmp, BR, brCard, brLoad, cstat, clientsCard, BK, bkMake, bkAuto, bkApply, xlsxToText, buildXlsx, aiReady, aiCall, AIC, aiContext, aiAsk, viewKaisAI, POS, posRow, posPoll, posCard, ocrParse, barBits, barcodeSVG, eanOk, genCode, C39, code39Bits, notifList, nfUnread, nfCheck, costRows, supPerf, MCFG, RESV, TABLES, rzAssign, rzAlt, rzHeat, rzInsights, viewRezerv, splitSnap, canR, canW, addSeatLocal, SEATS, wipeData, NAV, ID, NAMES, idAuth, idEnter, CL, PS, cloudPoll, pFlush, pSnap, parseBulk, codeFind, autoMin, salesProfile, abcList, anomalies, transitOf, LOTS, WASTE, COUNTLOG, lotSync, SBS, sbPull, sbSyncSups, sbCard, supTag, RFQS: () => RFQS, rfqStat, priceInfo, priceAlerts, matchReceipt, pricePoints, RECEIPTS, stockPlan, proposals, SUPPLIERS: () => SUPPLIERS, ORDERS: () => ORDERS, useOf, onSubmit, pwOK: null, parseSales, importSales, salesStats, previewOf, SALES: () => SALES, SALEIMP: () => SALEIMP, RECIPES, CLOCK: () => CLOCK, shopCode, codeOk, pSnap, pApply, AUTH, PS, pwHash, ebChecks, vknOk, EDOC, payroll, netToBrut, exitInfo, kvkkText, buildXlsx, AUDIT: () => AUDIT, otFromLog, mismatch, DEBTS: () => DEBTS, DRAFTS: () => DRAFTS, dfParse, onChange, LEDGER: () => LEDGER, PROFILES, PAYS, LEAVES, LVREQ: () => LVREQ, STOCK, STOCKLOG, MSGS, S, H, render, go, loginAs, USERS, ATT, ROWS, RECEIPTS, csvText, scores, viewHTML, startRead }; }
init();

/* v72: çalışan Bugün'e vardiya kartı (en son sarmal) */
{const _bc = bugunCalisan; bugunCalisan = function () { let h = _bc.apply(this, arguments); try { if (S.user && S.user.role === 'calisan') { const c = vdEmpCard(S.user.id); if (c) h = h.replace('<section class="cb-h', c + '<section class="cb-h'); const now = new Date(), s = vdMyDay(S.user.id, now); if (s.k === 'shift') h = h.replace(/Vardiya \d{2}:\d{2} – \d{2}:\d{2}/, 'Vardiya ' + s.t.s + ' – ' + vdEnd(s.t)); } } catch (e) {} return h; };}
talepHTML = tqHTML;
/* ===== v80: Duyuru (yönetici), minimal ===== */
function dzCard(m) {
  const first = (id) => esc(byId(id).name.split(' ')[0]); const mesai = m.type === 'mesai'; const n = m.to.length || 1;
  const rd = m.reads.filter((id) => m.to.includes(id)); const unread = m.to.filter((id) => !m.reads.includes(id));
  const kabul = m.to.filter((id) => m.res[id] === 'kabul'); const red = m.to.filter((id) => m.res[id] === 'red'); const bek = m.to.filter((id) => !m.res[id]);
  const chip = mesai ? `<span class="dz-s ${bek.length ? 'w' : 'g'}">${bek.length ? bek.length + ' cevap bekliyor' : 'Hepsi cevapladı'}</span>` : `<span class="dz-s ${unread.length ? 'i' : 'g'}">${unread.length ? 'Okundu ' + rd.length + '/' + n : 'Herkes okudu'}</span>`;
  const bar = mesai ? `<div class="dz-b3"><i class="g" style="width:${kabul.length / n * 100}%"></i><i class="a" style="width:${bek.length / n * 100}%"></i><i class="m" style="width:${red.length / n * 100}%"></i></div><div class="dz-ft"><span class="g">Kabul ${kabul.length}</span><span class="a">Bekliyor ${bek.length}</span><span class="m">Red ${red.length}</span>${unread.length ? `<em>Okumayan: ${unread.map(first).join(', ')}</em>` : ''}</div>` : `<div class="dz-b"><i style="width:${Math.round(rd.length / n * 100)}%"></i></div>${unread.length ? `<div class="dz-ft"><em>Okumayan: ${unread.map(first).join(', ')}</em></div>` : ''}`;
  const why = red.map((id) => (m.why && m.why[id] ? `<div class="dz-w">${ic('chat', 15)}<span><b>${first(id)}</b> reddetti: ${esc(m.why[id].text)}</span></div>` : '')).join('');
  return `<article class="dz-c ${mesai ? 'ms' : ''}"><div class="dz-h"><span class="dz-i">${ic(mesai ? 'clock' : 'megaphone', 17)}</span><div class="dz-t"><b>${esc(m.title)}</b><span>${mesai ? 'Mesai · +' + esc(m.hours) + ' saat · ' + fmt0(Number(m.pay || 0)) : 'Duyuru'} · ${esc(m.time)}</span></div>${chip}</div>
  <p class="dz-p">${esc(m.body)}</p>${bar}${why}<div class="dz-to">${ic('users', 14)} ${m.to.length === EMP_IDS.length ? 'Herkese gitti' : m.to.map(first).join(', ')}</div></article>`;
}
function dzView() {
  const d = S.draft; const mesai = d.type === 'mesai'; const f = S.dyf || 'hepsi';
  const nTo = d.aud === 'all' ? EMP_IDS.length : d.sel.length; const tp = DY_TPL[d.type] || [];
  const list = MSGS.slice().reverse().filter((m) => f === 'hepsi' || m.type === f);
  const waiting = MSGS.reduce((a, m) => a + (m.type === 'mesai' ? m.to.filter((id) => !m.res[id]).length : 0), 0);
  const unr = MSGS.reduce((a, m) => a + m.to.filter((id) => !m.reads.includes(id)).length, 0);
  const seg = (v, t) => `<button data-a="sub" data-g="msgtype" data-v="${v}" aria-pressed="${d.type === v}">${ic(v === 'mesai' ? 'clock' : 'megaphone', 16)}${t}</button>`;
  const tot = MSGS.reduce((a, m) => a + m.to.length, 0); const rdc = MSGS.reduce((a, m) => a + m.reads.filter((id) => m.to.includes(id)).length, 0); const pct = tot ? Math.round(rdc / tot * 100) : 0;
  const st = (ico, n, l, c) => `<div class="dz-st ${c || ''}"><span>${ic(ico, 20)}</span><div><b>${n}</b><small>${l}</small></div></div>`;
  const kais = `<div class="dz-sts">${st('megaphone', MSGS.length, 'Gönderilen mesaj')}${st('clock', waiting, 'Cevap bekleyen', waiting ? 'w' : '')}${st('check', tot ? '%' + pct : '–', 'Okunma oranı', 'g')}${st('sparkle', unr, 'Okunmamış mesaj', unr ? 'i' : '')}</div>`;
  return `<div class="dz"><div class="dz-hd"><div><h2>Duyurular</h2><p>Ekibine mesaj ya da mesai teklifi gönder.</p></div></div>${kais}
  <div class="dz-g"><section class="dz-cm"><div class="dz-ct"><h3>Yeni mesaj</h3><span>Ekibine saniyeler içinde ulaş</span></div><div class="dz-sg">${seg('duyuru', 'Duyuru')}${seg('mesai', 'Mesai teklifi')}</div>
    <div class="dz-r"><span class="dz-l">Kime</span><button class="chip" data-a="aud" data-v="all" aria-pressed="${d.aud === 'all'}">Herkes (${EMP_IDS.length})</button><button class="chip" data-a="aud" data-v="sel" aria-pressed="${d.aud === 'sel'}">Seçtiklerim</button></div>
    ${d.aud === 'sel' ? `<div class="dy-pk">${EMP_IDS.map((id) => `<label class="${d.sel.includes(id) ? 'on' : ''}"><input type="checkbox" name="rcp" value="${id}" ${d.sel.includes(id) ? 'checked' : ''} data-a="dypick">${avatar(byId(id), 28)}<span>${esc(byId(id).name)}</span></label>`).join('')}</div>` : ''}
    <div class="dz-tp"><span class="dz-l">Hızlı şablon</span>${tp.map((t, i) => `<button data-a="dytpl" data-i="${i}">${esc(t[0])}</button>`).join('')}</div>
    <input id="d-title" type="text" aria-label="Başlık" value="${esc(d.title)}" placeholder="${mesai ? 'Başlık: Bugün 1 saat uzatıyoruz' : 'Başlık: Cuma günü stok sayımı var'}">
    <textarea id="d-body" aria-label="Mesaj" rows="5" placeholder="Çalışanların okuyacağı metin">${esc(d.body)}</textarea>
    ${mesai ? `<div class="dy-hr">${['1', '2', '3', '4'].map((h) => `<button data-a="dyh" data-v="${h}" aria-pressed="${String(d.hours) === h}">${h} saat</button>`).join('')}</div>
    <div class="row wrap"><div class="field grow"><label for="d-hours">Süre (saat)</label><input id="d-hours" type="number" min="0.5" step="0.5" value="${esc(d.hours)}"></div><div class="field grow"><label for="d-pay">Kişi başı ücret (₺)</label><input id="d-pay" type="number" min="0" step="50" inputmode="decimal" value="${esc(d.pay)}"></div></div>
    <div class="dz-sm">${ic('wallet', 16)}<span>${nTo} kişi × ${fmt(Number(d.pay) || 0)} = <b>${fmt((Number(d.pay) || 0) * nTo)}</b></span></div>
    <p class="dz-nt">Çalışan kabul ya da reddeder, cevabı kayda geçer. Yasal koşulları muhasebeciyle doğrula.</p>` : ''}
    <button class="btn block dy-go" data-a="sendmsg">${ic('send')} ${mesai ? 'Teklifi gönder' : 'Duyuruyu gönder'}${nTo ? ' · ' + nTo + ' kişi' : ''}</button></section>
  <section class="dz-ls"><div class="dz-lh"><h3>Gönderilenler</h3><span>${MSGS.length ? MSGS.length + ' mesaj' : ''}</span></div>
    ${MSGS.length ? `<div class="dz-sg sm">${[['hepsi', 'Tümü'], ['duyuru', 'Duyuru'], ['mesai', 'Mesai']].map((x) => `<button data-a="dyf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join('')}</div>` : ''}
    <div class="dz-lst">${list.length ? list.map(dzCard).join('') : `<div class="dy-e">${ic('megaphone', 30)}<b>${MSGS.length ? 'Bu türde mesaj yok' : 'İlk mesajını gönder'}</b><p>${MSGS.length ? 'Başka bir filtre seç.' : 'Gönderdiklerin, kimin okuduğuyla birlikte burada görünür.'}</p></div>`}</div></section></div></div>`;
}
{ const _v = viewDuyuru; viewDuyuru = function () { return S.user.role === 'calisan' ? _v() : dzView(); }; }
/* ===== v82: Stok listesi, geniş yerleşim ===== */
{
  const _vs82 = viewStok;
  viewStok = function () {
    const h = _vs82();
    if (!/stx-find/.test(h)) return h;
    const box = document.createElement('div'); box.innerHTML = h; const root = box.firstElementChild;
    if (!root || !root.classList.contains('stx')) return h;
    const kids = [...root.children]; const top = []; const L = []; const R = []; let seenList = false;
    kids.forEach((c) => {
      if (c.classList.contains('stx-head') || c.classList.contains('stx-tools') || c.classList.contains('seg') || c.classList.contains('stx-ks')) top.push(c);
      else if (c.classList.contains('stx-find') || c.classList.contains('stx-chips') || c.classList.contains('stx-view')) L.push(c);
      else if (c.matches('.card.flush') && !seenList && L.length >= 3) { seenList = true; c.classList.add('sx2-list'); L.push(c); }
      else if (c.tagName === 'P' && seenList) L.push(c);
      else R.push(c);
    });
    let k = '';
    try {
      const rows = stokRows(); const acil = rows.filter((p) => p.lvl === 'acil'); const az = rows.filter((p) => p.lvl === 'azalan');
      const soon = rows.filter((p) => p.left !== Infinity && p.left < 14).sort((a, b) => a.left - b.left)[0];
      const need = rows.filter((p) => p.pick && p.qty).length; const skt = sktSoon(3).length;
      const ln = [];
      if (acil.length) ln.push(`<li class="r"><i></i><span><b>${acil.length} ürün acil:</b> ${esc(acil.slice(0, 3).map((p) => p.st.name.split(' (')[0]).join(', '))}</span></li>`);
      if (az.length) ln.push(`<li class="a"><i></i><span><b>${az.length} ürün azalıyor:</b> ${esc(az.slice(0, 3).map((p) => p.st.name.split(' (')[0]).join(', '))}</span></li>`);
      if (soon) ln.push(`<li class="i"><i></i><span><b>${esc(soon.st.name.split(' (')[0])}</b> yaklaşık ${soon.left < 10 ? q1(soon.left) : Math.round(soon.left)} gün içinde biter</span></li>`);
      if (skt) ln.push(`<li class="r"><i></i><span><b>${skt} parti</b> 3 gün içinde bozulacak</span></li>`);
      if (need) ln.push(`<li class="a"><i></i><span><b>${need} ürün</b> için sipariş gerekiyor</span></li>`);
      if (!ln.length) ln.push('<li class="g"><i></i><span><b>Her şey yolunda.</b> Acil ya da azalan ürün yok.</span></li>');
      k = `<section class="sx2-k"><div class="sx2-kh">${ic('sparkle', 18)}<b>Kais özeti</b></div><ul>${ln.join('')}</ul></section>`;
    } catch (e) {}
    root.innerHTML = '';
    top.forEach((c) => root.appendChild(c));
    const wrap = document.createElement('div'); wrap.className = 'sx2';
    const l = document.createElement('div'); l.className = 'sx2-l'; L.forEach((c) => l.appendChild(c));
    const r = document.createElement('aside'); r.className = 'sx2-r'; r.innerHTML = k; R.forEach((c) => r.appendChild(c));
    wrap.appendChild(l); wrap.appendChild(r); root.appendChild(wrap);
    return root.outerHTML;
  };
}
/* ===== v83: uzun listelere otomatik scroll (200 personele göre) ===== */
function capLists(root) {
  try {
    const lim = Math.max(420, Math.min(680, Math.round(window.innerHeight * 0.7)));
    (root || document).querySelectorAll('.main *, #modal-root .sheet *').forEach((el) => {
      if (el.children.length < 12 || el.dataset.capd) return;
      const t = el.tagName; if (/^(TABLE|TBODY|THEAD|TR|SELECT|OPTGROUP)$/.test(t)) return;
      if (el.closest('svg,select')) return;
      if (el.offsetHeight <= lim + 40) return;
      const cs = getComputedStyle(el); if (/(auto|scroll)/.test(cs.overflowY) || cs.display === 'contents') return;
      for (let p = el.parentElement; p && !p.classList.contains('main'); p = p.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return; }
      el.dataset.capd = '1'; el.style.maxHeight = lim + 'px'; el.style.overflowY = 'auto'; el.classList.add('cap-sc');
    });
  } catch (e) {}
}
{ const _r83 = render; render = function () { const r = _r83.apply(this, arguments); capLists(); return r; }; }
{ const _m83 = renderModal; renderModal = function () { const r = _m83.apply(this, arguments); capLists(); return r; }; }
/* ===== v84: Satın alma, yeniden tasarım ===== */
const sa2Eta = (o) => { const t = supById(o.supId); const lead = t ? Math.max(0, Number(t.lead) || 0) : 1; return addDays(o.iso || REF_ISO, lead); };
const sa2When = (iso) => { const d = dleft(iso); return d === 0 ? 'bugün' : d === 1 ? 'yarın' : d > 1 ? d + ' gün sonra' : Math.abs(d) + ' gün gecikti'; };
const sa2Short = (n) => String(n || '').split(' (')[0];
function sa2Tips(props) {
  const T = []; const plan = stockPlan(); const sav = props.reduce((a, p) => a + p.saving, 0);
  const late = ORDERS.filter((o) => o.status === 'gonderildi' && dleft(sa2Eta(o)) < 0);
  late.forEach((o) => { const t = supById(o.supId); T.push(['r', 'Sipariş gecikti', `${t ? t.name : 'Tedarikçi'} siparişi ${sa2When(sa2Eta(o))}. Aramak ya da WhatsApp'tan sormak iyi olur.`, 'ordwa', o.id, 'WhatsApp']); });
  plan.filter((p) => p.status === 'now' && !props.some((o) => o.lines.some((l) => l.st.id === p.st.id)) && !ORDERS.some((o) => o.status === 'gonderildi' && o.lines.some((l) => l.sid === p.st.id))).slice(0, 2).forEach((p) => T.push(['r', sa2Short(p.st.name) + ' bitmek üzere', 'Hiçbir tedarikçi teklifi ya da yoldaki sipariş yok. Bir tedarikçi ekle ya da teklif iste.', 'satab', 'teklif', 'Teklif iste']));
  props.forEach((o) => { if (o.total < o.sup.minAmt) { const miss = o.sup.minAmt - o.total; const inL = new Set(o.lines.map((l) => l.st.id)); const add = plan.filter((p) => p.status === 'soon' && !inL.has(p.st.id) && o.sup.items && o.sup.items[p.st.id] > 0).map((p) => sa2Short(p.st.name)); T.push(['a', o.sup.name + ': minimum tutara ' + fmt0(miss) + ' kaldı', add.length ? `${add.slice(0, 3).join(', ')} da yakında bitecek, siparişe eklersen minimum tutarı geçersin.` : 'Siparişe başka ürün ekle ya da bu ürünleri başka tedarikçiden al.']); } });
  props.forEach((o) => o.lines.filter((p) => p.late).slice(0, 1).forEach((p) => T.push(['a', sa2Short(p.st.name) + ' stok bitmeden gelmeyebilir', 'En hızlı tedarikçinin teslim süresi stoğun yetme süresinden uzun. Acil bir yerden alıp aradaki boşluğu kapat.'])));
  if (sav > 0) T.push(['g', 'Tahmini tasarruf ' + fmt0(sav), 'Önerilen siparişler son alış fiyatlarına göre bu kadar ucuz. Kais en ucuz ve zamanında gelen tedarikçiyi seçti.']);
  try { STOCK.map(priceInfo).filter((i) => i.flag && i.best).slice(0, 2).forEach((i) => T.push(['a', sa2Short(i.st.name) + ' fiyatı %' + Math.round(i.pct) + ' arttı', `${i.best.name} şu an ${fmt(i.best.items[i.st.id])} ile en ucuz seçenek. Son alış ${fmt(i.last.price)} idi.`])); } catch (e) {}
  const cnt = {}; ORDERS.filter((o) => o.status === 'teslim').forEach((o) => { (cnt[o.supId] = cnt[o.supId] || []).push(o); });
  Object.keys(cnt).filter((k) => cnt[k].length >= 2 && !RECUR.some((r) => r.supId === k)).slice(0, 1).forEach((k) => { const t = supById(k); T.push(['i', (t ? t.name : 'Tedarikçi') + ' ile düzenli alışveriş yapıyorsun', cnt[k].length + ' kez sipariş verdin. Her hafta tekrarlayan sipariş kurarsan günü gelince hatırlatırım.', 'ordrec', cnt[k][0].id, 'Tekrarla']); });
  if (!T.length) T.push(['g', 'Her şey yolunda', 'Acil sipariş, geciken teslimat ya da fiyat artışı yok.']);
  return T;
}
function sa2KaisCard(props) {
  const T = sa2Tips(props);
  return `<section class="sa2-k"><div class="sa2-kh">${ic('sparkle', 18)}<b>Kais önerileri</b><em>${T.length}</em></div><div class="sa2-kl">${T.map((t) => `<div class="sa2-ti ${t[0]}"><i></i><div><b>${esc(t[1])}</b><p>${esc(t[2])}</p>${t[3] ? `<button class="btn sm sec" data-a="${t[3]}" data-${t[3] === 'satab' ? 'v' : 'id'}="${t[4]}">${esc(t[5])}</button>` : ''}</div></div>`).join('')}</div></section>`;
}
function sa2Prop(o) {
  const miss = o.total < o.sup.minAmt; const eta = addDays(REF_ISO, Number(o.sup.lead) || 1);
  return `<article class="sa2-c"><div class="sa2-ch"><div class="sa2-cn"><b>${esc(o.sup.name)}</b><span>Teslim ${o.sup.lead} gün · tahmini geliş ${esc(isoShort(eta))}${o.sup.minAmt ? ' · en az ' + fmt0(o.sup.minAmt) : ''}</span></div><b class="sa2-tot">${fmt0(o.total)}</b></div>
  <div class="sa2-ln">${o.lines.map((p) => `<div class="sa2-l"><div><b>${esc(sa2Short(p.st.name))}</b><span>${p.qty} ${esc(p.st.unit)}${p.packs ? ' (' + fq(p.packs) + ' ' + esc(p.packName) + ')' : ''} × ${fmt(p.price)}${p.base > p.price ? ' · eskisi ' + fmt(p.base) : ''}${p.late ? ' · stok bitmeden gelmeyebilir' : ''}</span></div><div class="sa2-lr"><b>${fmt0(p.qty * p.price)}</b>${saPill(p)}</div></div>`).join('')}</div>
  ${miss ? `<div class="sa2-w">${ic('alert', 16)}<span>Minimum sipariş tutarının (${fmt0(o.sup.minAmt)}) altında, ${fmt0(o.sup.minAmt - o.total)} eksik.</span></div>` : ''}
  <div class="sa2-cf"><span>${o.saving > 0 ? 'Yaklaşık ' + fmt0(o.saving) + ' tasarruf' : ''}</span><button class="btn" data-a="ordcreate" data-id="${o.sup.id}">Siparişi kaydet ve mesajı kopyala</button></div></article>`;
}
function sa2Order(o) {
  const t = supById(o.supId); const eta = sa2Eta(o); const dd = dleft(eta); const rec = o.recv && o.recv.short > 0;
  const step = o.status === 'teslim' ? 2 : (o.dl && o.dl !== 'hazirlaniyor') || o.conf ? 1 : 0; const lab = ['Verildi', o.status === 'iptal' ? 'İptal' : 'Yolda', 'Teslim'];
  const when = o.status === 'gonderildi' ? `<span class="sa2-eta ${dd < 0 ? 'r' : dd <= 1 ? 'a' : ''}">Tahmini geliş: <b>${esc(isoShort(eta))}</b> · ${sa2When(eta)}</span>` : o.status === 'teslim' ? `<span class="sa2-eta g">Teslim alındı</span>` : '';
  const stp = o.status === 'iptal' ? '' : `<div class="sa2-st">${lab.map((x, i) => `<div class="${i <= step ? 'on' : ''}"><i></i><span>${x}</span></div>`).join('')}</div>`;
  const lines = o.lines.map((l) => `<div class="sa2-l"><div><b>${esc(sa2Short(l.name))}</b><span>${fq(l.qty)} ${esc(l.unit)} × ${fmt(l.price)}</span></div><div class="sa2-lr"><b>${fmt0(l.qty * l.price)}</b></div></div>`).join('');
  const btn = o.status === 'gonderildi' ? `<button class="btn sm" data-a="ordrecv" data-id="${o.id}">Teslim aldım</button><button class="btn sm sec" data-a="ordsendopen" data-id="${o.id}">${o.wa || o.mailed ? 'Tekrar gönder' : 'Gönder'}</button>${o.sbid && !o.conf ? `<button class="btn sm sec" data-a="ordremind" data-id="${o.id}">Hatırlat</button>` : ''}<button class="btn sm sec" data-a="ordcopy" data-id="${o.id}">Kopyala</button>${o.sbid && !(o.chg && o.chg.status === 'bekliyor') ? `<button class="btn sm sec" data-a="chg" data-id="${o.id}">Değişiklik</button>` : ''}<button class="btn sm sec" data-a="ordcancel" data-id="${o.id}">İptal</button>`
    : o.status === 'teslim' ? `${rec ? `<button class="btn sm" data-a="shortwa" data-id="${o.id}">Eksiği bildir</button>` : ''}<button class="btn sm sec" data-a="ordrec" data-id="${o.id}">Her hafta tekrarla</button>` : '';
  return `<article class="sa2-c"><div class="sa2-ch"><div class="sa2-cn"><b>${esc(t ? t.name : 'Tedarikçi')}</b><span>Verildi ${esc(o.date)} · ${o.lines.length} kalem</span></div><div class="sa2-tt"><b class="sa2-tot">${fmt0(o.total)}</b><span class="pill ${ORD_ST[o.status][0]}">${ORD_ST[o.status][1]}</span></div></div>
  ${when ? `<div class="sa2-wh">${when}${o.conf ? '<span class="pill p-ok">Tedarikçi onayladı</span>' : ''}</div>` : ''}${stp}<div class="sa2-ln">${lines}</div>
  ${rec ? `<div class="sa2-w r">${ic('alert', 16)}<span>Eksik teslim: ${fmt0(o.recv.short)} düşüldü</span></div>${typeof recStat === 'function' ? recStat(o) : ''}` : ''}${typeof ordExtra === 'function' ? ordExtra(o) : ''}${btn ? `<div class="sa2-bt">${btn}</div>` : ''}</article>`;
}
function sa2Orders() {
  const yol = ORDERS.filter((o) => o.status === 'gonderildi').sort((a, b) => sa2Eta(a) < sa2Eta(b) ? -1 : 1); const ok = ORDERS.filter((o) => o.status === 'teslim'); const ip = ORDERS.filter((o) => o.status === 'iptal');
  const f = S.saOf || 'yol'; const arr = f === 'yol' ? yol : f === 'ok' ? ok : ip;
  const seg = (k, l, n) => `<button data-a="saof" data-v="${k}" aria-pressed="${f === k}">${l}<em>${n}</em></button>`;
  return `<div class="tq-sg sa2-sg">${seg('yol', 'Yolda', yol.length)}${seg('ok', 'Teslim alınan', ok.length)}${seg('ip', 'İptal', ip.length)}</div>
  ${arr.length ? `<div class="sa2-gr">${arr.map(sa2Order).join('')}</div>` : `<div class="iz-e">${ic(f === 'yol' ? 'clock' : 'check', 30)}<b>${f === 'yol' ? 'Yolda sipariş yok' : f === 'ok' ? 'Teslim alınan sipariş yok' : 'İptal edilen sipariş yok'}</b><p>${f === 'yol' ? 'Verdiğin siparişler teslim alınana kadar burada görünür.' : 'Siparişler burada birikir.'}</p></div>`}`;
}
function sa2Sup(t) {
  const os = ORDERS.filter((o) => o.supId === t.id && o.status !== 'iptal'); const sum = os.reduce((a, o) => a + o.total, 0); const last = os[0];
  return `<button class="sa2-sp" data-a="supedit" data-id="${t.id}"><span class="sa2-av">${esc(t.name.slice(0, 1))}</span><div class="sa2-spi"><b>${esc(t.name)}${supTag(t.id)}</b><span>${Object.keys(t.items).length} ürün · teslim ${t.lead} gün${t.minAmt ? ' · en az ' + fmt0(t.minAmt) : ''}</span><span>${os.length ? os.length + ' sipariş · toplam ' + fmt0(sum) + (last ? ' · son ' + esc(last.date) : '') : 'Henüz sipariş yok'}${t.phone ? ' · ' + esc(t.phone) : ''}</span></div>${ic('chevron', 18)}</button>`;
}
function sa2Teklif() {
  const plan = stockPlan().filter((p) => p.status !== 'ok'); const O = [];
  plan.forEach((p) => { const offs = offersOf(p.st.id); if (offs.length < 2) return; const pr = offs.map((t) => t.items[p.st.id]).filter((x) => x > 0); const mn = Math.min(...pr), mx = Math.max(...pr); if (mx > 0 && (mx - mn) / mx >= 0.05) { const b = offs.find((t) => t.items[p.st.id] === mn); O.push([sa2Short(p.st.name), b.name, mn, mx]); } });
  const tips = `<section class="sa2-k"><div class="sa2-kh">${ic('sparkle', 18)}<b>Kais önerileri</b></div><div class="sa2-kl">${O.length ? O.map((x) => `<div class="sa2-ti a"><i></i><div><b>${esc(x[0])}: tedarikçiler arasında %${Math.round((x[3] - x[2]) / x[3] * 100)} fiyat farkı var</b><p>${esc(x[1])} ${fmt(x[2])} ile en ucuz, en pahalı ${fmt(x[3])}. Teklif isteyip güncel fiyatları karşılaştır.</p></div></div>`).join('') : `<div class="sa2-ti g"><i></i><div><b>${plan.length ? plan.length + ' ürün azalıyor' : 'Teklife gerek yok'}</b><p>${plan.length ? 'Teklif isteyerek tedarikçilerin güncel fiyatını gör, Kais en ucuz dağıtımı hesaplasın.' : 'Stokta azalan ürün yok, fiyat karşılaştırması gerekmiyor.'}</p></div></div>`}</div></section>`;
  return `<div class="sa2-two"><div class="sa2-main">${rfqCard()}</div><aside class="sa2-side">${tips}</aside></div>`;
}
function sa2Tedarikci() {
  const rc = typeof rcCard === 'function' ? rcCard() : '';
  return `<div class="sa2-two"><div class="sa2-main"><section class="sa2-sc"><div class="sa2-sh"><div><h3>Tedarikçiler</h3><p>Fiyatları kendi teklif ve faturalarına göre güncelle.</p></div><button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button></div><div class="sa2-sl">${SUPPLIERS.length ? SUPPLIERS.map(sa2Sup).join('') : '<div class="empty">Henüz tedarikçi yok.</div>'}</div></section>${rc}</div><aside class="sa2-side">${sbCard()}<p class="small muted">Fiyatları sen girersin ya da fiyat listesinin fotoğrafını, PDF'ini veya mesajını yüklersin, Kais okur.</p></aside></div>`;
}
viewSatinAlma = function () {
  const plan = stockPlan(); const props = proposals(); const cover = Number(S.settings.cover) || 7; const r = S.user && S.user.role;
  const now = plan.filter((p) => p.status === 'now').length; const soon = plan.filter((p) => p.status === 'soon').length; const sav = props.reduce((a, p) => a + p.saving, 0);
  const noData = plan.every((p) => p.src === 'yok'); const tab = ['siparis', 'siparisler', 'teklif', 'tedarikci'].includes(S.saTab) ? S.saTab : 'siparis';
  const yol = ORDERS.filter((o) => o.status === 'gonderildi'); const yolT = yol.reduce((a, o) => a + o.total, 0); const mon = REF_ISO.slice(0, 7); const monT = ORDERS.filter((o) => o.status !== 'iptal' && (o.iso || REF_ISO).slice(0, 7) === mon).reduce((a, o) => a + o.total, 0);
  const openR = RFQS.filter((x) => x.status === 'acik').length; const need = props.reduce((a, o) => a + o.total, 0);
  const seg = [['siparis', 'Alınacaklar' + (props.length ? ' (' + props.length + ')' : '')], ['siparisler', 'Siparişler' + (yol.length ? ' (' + yol.length + ')' : '')], ['teklif', 'Teklif' + (openR ? ' (' + openR + ')' : '')], ['tedarikci', 'Tedarikçi']];
  const st = (ico, n, l, c) => `<div class="dz-st ${c || ''}"><span>${ic(ico, 20)}</span><div><b>${n}</b><small>${l}</small></div></div>`;
  let body = '';
  if (tab === 'siparis') {
    const rb = typeof recBanner === 'function' ? recBanner() : ''; const rcc = typeof recCard === 'function' ? recCard() : ''; const dr = typeof drCard === 'function' ? drCard() : '';
    body = `<div class="sa2-two"><div class="sa2-main">${noData ? `<div class="callout warn">${ic('alert')}<div><b>Tüketim hesabı için satış verisi yok</b><p style="margin-top:2px">Satışlar sayfasından satış yükle ya da Stok sayfasında günlük tüketimi yaz.</p></div></div>` : ''}${rb}${dr}
    <div class="sa2-fl"><span>Stok kaç günlük tutulsun?</span><select id="cover" data-ch="cover" aria-label="Kaç günlük stok">${[5, 7, 10, 14].map((d) => `<option value="${d}" ${cover === d ? 'selected' : ''}>${d} gün</option>`).join('')}</select></div>
    ${props.length ? `<div class="sa2-gr">${props.map(sa2Prop).join('')}</div>` : `<div class="iz-e">${ic('check', 30)}<b>Şu an alınacak ürün yok</b><p>Stok yeterli. Azalan ürün olunca Kais burada sipariş önerir.</p></div>`}${rcc}</div><aside class="sa2-side">${sa2KaisCard(props)}</aside></div>`;
  } else if (tab === 'siparisler') body = `<div class="sa2-two"><div class="sa2-main">${typeof drCard === 'function' ? drCard() : ''}${sa2Orders()}</div><aside class="sa2-side">${sa2KaisCard(props)}</aside></div>`;
  else if (tab === 'teklif') body = sa2Teklif(); else body = sa2Tedarikci();
  return `<div class="stack-lg sa2"><div class="dz-hd"><h2>Satın alma</h2><p>Stok, satış ve reçetelerden hesaplanır. Kais önerir, sipariş sende onaylanır.</p></div>
  <div class="dz-sts">${st('cart' in ICONS ? 'cart' : 'wallet', fmt0(need), 'Alınacak · ' + props.length + ' sipariş', now ? 'w' : '')}${st('clock', fmt0(yolT), 'Yolda · ' + yol.length + ' sipariş', yol.length ? 'i' : '')}${st('wallet', fmt0(monT), 'Bu ay sipariş', '')}${st('sparkle', fmt0(sav), 'Olası tasarruf', 'g')}</div>
  <div class="tq-sg sa2-tb" role="group" aria-label="Satın alma bölümleri">${seg.map((x) => `<button data-a="satab" data-v="${x[0]}" aria-pressed="${tab === x[0]}">${esc(x[1])}</button>`).join('')}</div>${body}</div>`;
};
H.saof = (el) => { S.saOf = el.dataset.v; render(); };
/* ===== v85: Rezervasyon, Kais asistan ===== */
Object.assign(PROF, { kap: PROF.kap || '', masa: PROF.masa || '' });
PF_FIELDS.splice(5, 0, ['kap', 'Kişi kapasitesi'], ['masa', 'Masa sayısı']);
RCFG.k = RCFG.k || { on: true, conf: true, rem: true, hrs: 3, warn: true, ns: true };
const rzK = () => { const k = RCFG.k = RCFG.k || {}; ['on', 'conf', 'rem', 'warn', 'ns', 'auto'].forEach((x) => { if (k[x] == null) k[x] = true; }); if (!k.hrs) k.hrs = 3; return k; };
const rzCap = () => Number(PROF.kap) || TABLES.reduce((a, t) => a + (Number(t.cap) || 0), 0);
function rzLoad(date, extra) {
  const out = []; for (let x = RCFG.open * 60; x < RCFG.close * 60; x += 30) { let p = 0; RESV.filter((r) => r.date === date && rzActive(r) && (!extra || r.id !== extra.id)).forEach((r) => { const rs = toMin(r.time); if (rs <= x && x < rs + r.dur) p += Number(r.n) || 0; }); if (extra) { const rs = toMin(extra.time); if (rs <= x && x < rs + extra.dur) p += Number(extra.n) || 0; } out.push({ t: fromMin(x), p }); } return out;
}
const rzPeak = (date) => rzLoad(date).reduce((a, b) => (b.p > a.p ? b : a), { t: '', p: 0 });
const rzTitle = (r) => String(r.name || '').split(' ')[0];
function rzConfMsg(r) {
  const h = rzHist(r.phone, r.id); const t = rzNames(r.tids); const n = String(r.note || '').toLowerCase();
  let s = `Merhaba ${rzTitle(r)}, ${BIZ} olarak rezervasyonunuzu aldık.\n\n📅 ${rzDayName(r.date)} · ${r.time}\n👥 ${r.n} kişi${t ? '\n🪑 Masa ' + t : ''}\n`;
  if (/doğum|dogum/.test(n)) s += '\n🎂 Doğum gününüz için hazırlık yapacağız, şimdiden kutlu olsun!\n'; else if (/yıl dönümü|evlilik|nişan|kutlama/.test(n)) s += '\n🎉 Özel gününüz için elimizden geleni yapacağız.\n'; else if (r.note) s += '\n📝 Notunuz: ' + r.note + '. Not aldık.\n';
  if (r.n >= 6) s += '\nBüyük grup olduğunuz için masaları sizin için hazırlıyoruz.\n';
  s += h.n >= 2 ? '\nBizi yeniden tercih ettiğiniz için teşekkür ederiz.' : '';
  s += h.miss ? '\nPlanınız değişirse lütfen önceden haber verin, yerinizi başka misafire verebiliriz.' : '\nDeğişiklik ya da iptal için bu mesaja cevap yazabilirsiniz.';
  return s + '\n\nGörüşmek üzere, Kais iyi günler diler.';
}
function rzRemMsg(r) {
  const h = rzHist(r.phone, r.id); const left = Math.max(1, Math.round((toMin(r.time) - (new Date().getHours() * 60 + new Date().getMinutes())) / 60));
  return `Merhaba ${rzTitle(r)}, bugün saat ${r.time} için ${r.n} kişilik rezervasyonunuza yaklaşık ${left} saat kaldı. ${BIZ} olarak sizi bekliyoruz.\n\n${h.miss ? 'Geleceğinizi teyit etmek için bu mesaja EVET yazabilir misiniz? ' : ''}Gelemeyecekseniz lütfen haber verin, yerinizi başka misafire verebiliriz.\n\nKais iyi günler diler.`;
}
const rzMail = (r, kind) => { const msg = kind === 'rem' ? rzRemMsg(r) : rzConfMsg(r); return 'mailto:' + encodeURIComponent(r.email || '') + '?subject=' + encodeURIComponent(BIZ + (kind === 'rem' ? ' · Rezervasyon hatırlatma' : ' · Rezervasyonunuz alındı')) + '&body=' + encodeURIComponent(msg); };
function rzQueue() {
  const k = rzK(); const q = []; const now = new Date().getHours() * 60 + new Date().getMinutes();
  RESV.filter((r) => rzActive(r) && r.date >= REF_ISO && r.email).forEach((r) => {
    if (k.conf && !r.cs) q.push({ r, kind: 'conf' });
    if (k.rem && !r.rs && r.date === REF_ISO && r.st === 'onay') { const dt = toMin(r.time) - now; if (dt > 0 && dt <= k.hrs * 60) q.push({ r, kind: 'rem' }); }
  });
  return q;
}
function rzTips() {
  const T = []; const cap = rzCap(); const k = rzK();
  if (!PROF.kap) T.push(['a', 'Kişi kapasiteni gir', 'Doluluğu ve dolu gün uyarılarını doğru hesaplayabilmem için aynı anda kaç kişi ağırlayabildiğini yaz.', 'pfopen', 'kap', 'Kapasiteyi gir']);
  if (!TABLES.length) T.push(['a', 'Masalarını ekle', 'Masa planı olmadan otomatik masa atayamam.', 'rztables', '', 'Masalar']);
  const ne = RESV.filter((r) => rzActive(r) && r.date >= REF_ISO && !r.email).length; if (ne && k.conf) T.push(['a', ne + ' rezervasyonun e-postası yok', 'Onay ve hatırlatma e-postası gidemez. Rezervasyonu düzenleyip e-posta ekle.']);
  if (k.warn && cap) for (let i = 0; i < 7; i++) { const d = addDays(REF_ISO, i); const pk = rzPeak(d); if (pk.p >= cap * 0.9) T.push([pk.p >= cap ? 'r' : 'a', (i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : rzDayName(d)) + (pk.p >= cap ? ' kapasite dolu' : ' neredeyse dolu'), `${pk.t} civarı ${pk.p}/${cap} kişi. Yeni rezervasyon almadan önce emin ol.`, 'rzday', d, 'Güne git']); }
  if (k.ns) { RESV.filter((r) => r.date >= REF_ISO && r.st === 'onay' && rzHist(r.phone, r.id).miss > 0).slice(0, 2).forEach((r) => T.push(['a', r.name + ' daha önce gelmedi', rzDayName(r.date) + ' ' + r.time + ' rezervasyonu için hatırlatmayı erken gönder, gerekirse teyit iste.', 'rzday', r.date, 'Güne git'])); }
  RESV.filter((r) => r.date >= REF_ISO && r.st === 'onay' && r.n >= 6).slice(0, 1).forEach((r) => T.push(['i', r.n + ' kişilik grup: ' + r.name, rzDayName(r.date) + ' ' + r.time + '. Masaların birleştiğini ve mutfağı önceden bilgilendirmeyi unutma.']));
  const reg = {}; RESV.filter((r) => ['geldi', 'bitti'].includes(r.st)).forEach((r) => { const kk = rzDigits(r.phone) || r.name; (reg[kk] = reg[kk] || { name: r.name, c: 0 }).c++; });
  RESV.filter((r) => r.date >= REF_ISO && rzActive(r)).forEach((r) => { const x = reg[rzDigits(r.phone) || r.name]; if (x && x.c >= 2 && T.length < 8) T.push(['g', x.name + ' sık gelen misafir', x.c + ' kez geldi. Özel karşılama ya da küçük bir ikram iyi olur.']); });
  const quiet = [1, 2, 3].map((o) => addDays(REF_ISO, o)).find((d) => cap && rzPeak(d).p < cap * 0.25 && ![5, 6, 0].includes(dowOf(d)));
  if (quiet && cap) T.push(['i', rzDayName(quiet) + ' sakin görünüyor', 'Doluluk %25\'in altında. Sık gelen misafirlere kampanya mesajı göndermek için Müşteri sayfasına bak.']);
  return T;
}
function rzKaisCard() {
  const k = rzK(); const q = k.on ? rzQueue() : []; const tips = k.on ? rzTips() : []; const cap = rzCap(); const pk = rzPeak(S.rzDate); const pct = cap ? Math.min(100, Math.round(pk.p / cap * 100)) : 0;
  const nt = typeof Notification !== 'undefined'; const on = !!RCFG.notif && nt && Notification.permission === 'granted';
  const sw = (key, label, sub) => `<label class="rzk-sw"><span><b>${label}</b><em>${sub}</em></span><span class="sz-sw"><input type="checkbox" data-ch="rzk" data-k="${key}"${k[key] ? ' checked' : ''}><span class="sz-tr"></span></span></label>`;
  const qh = q.length ? `<div class="rzk-q"><div class="rzk-t">${k.auto ? 'Gidecek e-postalar' : 'Gönderilecek e-postalar'} <em>${q.length}</em></div>${q.slice(0, 8).map((x) => `<div class="rzk-m"><div><b>${esc(x.r.name)}</b><span>${x.kind === 'conf' ? 'Rezervasyon onayı' : 'Hatırlatma'} · ${x.kind === 'conf' && x.r.date !== REF_ISO ? esc(rzDayName(x.r.date)) + ' ' : ''}${esc(x.r.time)}</span></div><div class="rzk-b"><button class="btn sm" data-a="rzsend" data-id="${x.r.id}" data-kind="${x.kind}" data-ch="mail">${k.auto ? 'Şimdi gönder' : 'E-posta gönder'}</button><button class="btn sm sec" data-a="rzsend" data-id="${x.r.id}" data-kind="${x.kind}" data-ch="skip" aria-label="Gönderildi say">✓</button></div></div>`).join('')}</div>` : (k.on ? `<p class="rzk-ok">${k.auto ? 'Bekleyen e-posta yok. E-postası olan misafirlere onay ve hatırlatma kendiliğinden gider.' : 'Bekleyen mesaj yok. Yeni rezervasyonlar için onay, gelmeden önce hatırlatma hazırlarım.'}</p>` : '');
  return `<section class="rzk"><div class="rzk-h">${ic('sparkle', 18)}<b>Kais asistan</b><label class="sz-sw rzk-m1"><input type="checkbox" data-ch="rzk" data-k="on"${k.on ? ' checked' : ''}><span class="sz-tr"></span></label></div>
  ${k.on ? `<div class="rzk-cap"><div><span>${esc(rzDayName(S.rzDate))} en yoğun</span><b>${pk.p}${cap ? ' / ' + cap : ''} kişi</b></div><div class="rzk-bar"><i style="width:${pct}%;background:${pct >= 100 ? 'var(--nar)' : pct >= 80 ? '#E3A21A' : 'var(--cini)'}"></i></div><em>${cap ? (PROF.kap ? 'Kapasite: ' + cap + ' kişi' : 'Masa kapasitesine göre (' + cap + ')') : 'Kapasite girilmedi'}${pk.t ? ' · ' + pk.t : ''}</em></div>${qh}
  ${tips.length ? `<div class="rzk-t">Kais önerileri <em>${tips.length}</em></div><div class="rzk-tl">${tips.slice(0, 6).map((t) => `<div class="sa2-ti ${t[0]}"><i></i><div><b>${esc(t[1])}</b><p>${esc(t[2])}</p>${t[3] ? `<button class="btn sm sec" data-a="${t[3]}" data-${t[3] === 'rzday' ? 'd' : 'f'}="${t[4]}">${esc(t[5])}</button>` : ''}</div></div>`).join('')}</div>` : ''}
  <details class="rzk-set"${S.rzkOpen ? ' open' : ''}><summary>Kais ayarları</summary>${sw('auto', 'Otomatik e-posta', 'Sunucu e-postayı kendiliğinden gönderir, uygulama kapalıyken de')}${sw('conf', 'Onay e-postası', 'Rezervasyon alınınca müşteriye gider')}${sw('rem', 'Hatırlatma e-postası', 'Gelmeden önce müşteriye gider')}<div class="rzk-hr"><span>Hatırlatma zamanı</span>${[1, 2, 3, 4].map((h) => `<button data-a="rzkh" data-h="${h}" aria-pressed="${k.hrs === h}">${h} saat</button>`).join('')}</div><div class="rzk-hr" style="flex-direction:column;align-items:stretch;gap:6px"><span>Yanıt e-postası <em style="font-style:normal;color:var(--ink-2)">(misafir yanıtlarsa buraya gider)</em></span><input class="rzk-in" type="email" inputmode="email" autocapitalize="none" placeholder="rezervasyon@isletmen.com" value="${esc(k.reply || '')}" data-ch="rzkr"></div>${sw('warn', 'Dolu gün uyarısı', 'Kapasite dolunca sormadan almam')}${sw('ns', 'Gelmeyenleri takip et', 'Önceden gelmeyenleri işaretlerim')}${nt ? `<label class="rzk-sw"><span><b>Bildirim</b><em>Misafir gelmeden 30 dk önce haber ver</em></span><span class="sz-sw"><input type="checkbox" data-ch="rznotif"${on ? ' checked' : ''}><span class="sz-tr"></span></span></label>` : ''}</details>` : '<p class="rzk-ok">Kais kapalı. Açarsan rezervasyonları takip eder, müşteri mesajlarını hazırlar, dolu günleri uyarır.</p>'}</section>`;
}
{
  const _v85 = viewRezerv;
  viewRezerv = function () {
    const h = _v85(); const box = document.createElement('div'); box.innerHTML = h; const root = box.firstElementChild; if (!root) return h;
    const kids = [...root.children]; const top = []; const body = [];
    kids.forEach((c) => { if (c.classList.contains('rz-head') || c.classList.contains('rz-bar') || c.classList.contains('rz-week') || c.classList.contains('rz-cal') || c.classList.contains('stx-ks')) top.push(c); else if (c.matches('section.rz-card') && c.querySelector('.rz-nt')) { /* eski bildirim kartı */ } else body.push(c); });
    const role = S.user && S.user.role; root.innerHTML = ''; top.forEach((c) => root.appendChild(c));
    const w = document.createElement('div'); w.className = 'rz2'; const l = document.createElement('div'); l.className = 'rz2-l'; body.forEach((c) => l.appendChild(c)); w.appendChild(l);
    if (role === 'patron' || role === 'mudur') { const r = document.createElement('aside'); r.className = 'rz2-r'; r.innerHTML = rzKaisCard(); w.appendChild(r); }
    root.appendChild(w); return root.outerHTML;
  };
}
H.rzkh = (el) => { rzK().hrs = Number(el.dataset.h); pSched(); render(); };
H.rzday = ((p) => (el) => { if (el.dataset.d) { S.rzDate = el.dataset.d; S.rzMonth = rzMon(S.rzDate); S.rzCal = false; render(); } else p(el); })(H.rzday);
document.addEventListener('toggle', (e) => { if (e.target && e.target.classList && e.target.classList.contains('rzk-set')) S.rzkOpen = e.target.open; }, true);
document.addEventListener('change', (e) => { const el = e.target; if (!el || !el.dataset) return; if (el.dataset.ch === 'rzkr') { const v = String(el.value || '').trim(); if (v && !/^\S+@\S+\.\S{2,}$/.test(v)) { toast('E-posta adresi geçersiz görünüyor.', 'warn'); return; } rzK().reply = v; pSched(); toast('Kaydedildi.', 'ok'); return; } if (el.dataset.ch === 'rzk') { rzK()[el.dataset.k] = !!el.checked; pSched(); render(); } });
H.rzsend = (el) => {
  const r = RESV.find((x) => x.id === el.dataset.id); if (!r) return; const kind = el.dataset.kind; const ch = el.dataset.ch; const msg = kind === 'rem' ? rzRemMsg(r) : rzConfMsg(r);
  if (ch === 'mail') { window.open(rzMail(r, kind), '_blank'); }
  const f = kind === 'rem' ? 'rs' : 'cs'; r[f] = { t: Date.now(), ch }; pSched(); if (S.modal && S.modal.type === 'rzmsg') S.modal = null; render(); if (ch === 'skip') toast('Gönderildi olarak işaretlendi.'); 
};
/* modal: e-posta alanı, kapasite uyarısı */
{ const _n = NEWM.rznew; NEWM.rznew = function (m) {
  let h = _n(m); h = h.replace(/(<div class="field"><label for="rz-phone">[\s\S]*?<\/div>)/, `$1<div class="field"><label for="rz-email">E-posta <span class="small muted">(onay ve hatırlatma buraya gider)</span></label><input type="email" id="rz-email" inputmode="email" autocapitalize="none" value="${esc(m.email || '')}" placeholder="misafir@eposta.com" data-ch="rzf" data-k="email"></div>`);
  if (m.warn) h = h.replace('<div class="field"><label for="rz-name">', `<div class="callout warn" style="margin-bottom:10px">${ic('alert')}<div><b>Emin misin?</b><p style="margin-top:2px">${esc(m.warn)}</p><div class="row wrap" style="gap:8px;margin-top:8px"><button class="btn sm" data-a="rzforce">Yine de ekle</button><button class="btn sm sec" data-a="rzunwarn">Vazgeç</button></div></div></div>$&`);
  return h; }; }
H.rzforce = () => { if (S.modal) { S.modal.force = true; S.modal.warn = ''; } H.rzsave(); };
H.rzunwarn = () => { if (S.modal) { S.modal.warn = ''; S.modal.force = false; renderModal(); } };
{ const _n1 = H.rznew; H.rznew = function () { _n1.apply(this, arguments); if (S.modal) { S.modal.email = ''; } }; const _e1 = H.rzedit; H.rzedit = function (el) { _e1.apply(this, arguments); const r = RESV.find((x) => x.id === el.dataset.id); if (S.modal && r) S.modal.email = r.email || ''; }; }
{ const _s = H.rzsave; H.rzsave = function () {
  const m = S.modal; if (!m || m.type !== 'rznew') return _s.apply(this, arguments); const g = (id) => (document.getElementById(id) || {}).value;
  m.name = (g('rz-name') || m.name || '').trim(); m.phone = (g('rz-phone') || m.phone || '').trim(); m.email = (g('rz-email') != null ? g('rz-email') : m.email || '').trim();
  if (m.email && !/^\S+@\S+\.\S{2,}$/.test(m.email)) { const e = document.getElementById('rz-err'); if (e) e.textContent = 'E-posta adresi geçersiz görünüyor.'; return; }
  const isNew = !m.id; const k = rzK(); const c = rzCheck(m); const cap = rzCap(); let warn = '';
  if (m.name && m.n >= 1 && m.date >= REF_ISO && k.on && k.warn) { const ld = rzLoad(m.date, m.id ? { id: m.id, time: m.time, dur: m.dur, n: m.n } : { id: '_', time: m.time, dur: m.dur, n: m.n }); const pk = ld.reduce((a, b) => (b.p > a.p ? b : a), { p: 0 });
    if (!c.res) warn = (c.msg || 'Bu saatte uygun masa yok') + (cap ? `. Bu saatte ${pk.p}/${cap} kişi olur.` : '.') + ' Bugün o masa dolu ya da kişi kapasitemiz dolu, emin misin?';
    else if (cap && pk.p > cap) warn = `Kişi kapasitesi (${cap}) aşılıyor: bu rezervasyonla ${pk.p} kişi olur. Emin misin?`; }
  if (warn && !m.force) { m.warn = warn; renderModal(); return; }
  const before = RESV.length;
  if (m.force && !c.res) { const base = { name: m.name, phone: m.phone, email: m.email, n: m.n, date: m.date, time: m.time, dur: m.dur, src: m.src, note: m.note || '', tids: [] };
    if (m.id) { const r = RESV.find((x) => x.id === m.id); if (r) Object.assign(r, base); } else RESV.push(Object.assign({ id: 'r' + (++seq), st: 'onay', by: S.user ? S.user.id : '' }, base));
    S.rzDate = m.date; S.modal = null; render(); toast('Rezervasyon masa atanmadan kaydedildi.', 'warn'); }
  else _s.apply(this, arguments);
  const nr = isNew ? RESV[RESV.length - 1] : RESV.find((x) => x.id === m.id);
  if (nr && (RESV.length > before || !isNew)) { nr.email = m.email; if (isNew) { const dt = toMin(nr.time) - (new Date().getHours() * 60 + new Date().getMinutes()); if (nr.date === REF_ISO && dt < k.hrs * 60) nr.rs = { t: Date.now(), ch: 'skip' }; pSched();
    if (k.on && k.conf && nr.email && !S.modal) { if (k.auto) toast('Onay e-postası misafire birkaç dakika içinde gider.', 'ok'); else { S.modal = { type: 'rzmsg', id: nr.id }; renderModal(); } } } }
}; }
NEWM.rzmsg = (m) => { const r = RESV.find((x) => x.id === m.id); if (!r) return sheet('Mesaj', '<p>Rezervasyon bulunamadı.</p>');
  return sheet('Müşteriye onay mesajı', `<div class="callout">${ic('sparkle')}<div>Kais ${esc(rzTitle(r))} için onay mesajını hazırladı. Gönder ya da sonra kuyruktan gönder.</div></div><pre class="rzk-pre">${esc(rzConfMsg(r))}</pre>
  <div class="row wrap" style="gap:8px"><button class="btn grow" data-a="rzsend" data-id="${r.id}" data-kind="conf" data-ch="mail">E-posta ile gönder</button><button class="btn sec" data-a="closemodal">Sonra</button></div><p class="small muted" style="margin-top:8px">Hatırlatma mesajı, rezervasyondan ${rzK().hrs} saat önce Kais'in kuyruğuna düşer.</p>`); };
/* profil: kapasite alanları */
{ const _p = NEWM.prof; NEWM.prof = function (m) { let h = _p(m); const f = `<div class="pf-row pf-2"><div class="pf-s" data-pfk="kap"><label class="pf-l">Kişi kapasitesi <span class="pf-h">aynı anda en fazla</span></label><input id="pf-kap" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Örn. 60" value="${esc(PROF.kap)}"></div><div class="pf-s" data-pfk="masa"><label class="pf-l">Masa sayısı</label><input id="pf-masa" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Örn. 15" value="${esc(PROF.masa)}"></div></div>`;
  return h.replace(/(<div class="pf-s" data-pfk="cal">)/, f + '$1'); }; }
{ const _ps = H.pfsave; H.pfsave = function () { const g = (id) => ((document.getElementById(id) || {}).value || '').replace(/\D/g, '').slice(0, 4); if (document.getElementById('pf-kap')) { PROF.kap = g('pf-kap'); PROF.masa = g('pf-masa'); } return _ps.apply(this, arguments); }; }
/* bildirimler */
{ const _nl = notifList; notifList = function () { const out = _nl(); const u = S.user; if (!u) return out; const add = (key, sev, text, view, tab) => out.push({ key: key + '|' + REF_ISO, sev, text, view, tab });
  if (u.role === 'patron') { const miss = pfMissing(); if (miss.length) add('prof' + miss.length, 'warn', 'Kais seni ve işletmeni daha iyi analiz edip daha iyi hizmet sunabilsin diye profil bilgilerinin hepsini doldur (' + miss.length + ' eksik: ' + miss.slice(0, 3).map((x) => x[1]).join(', ') + (miss.length > 3 ? '…' : '') + ').', 'bugun'); }
  if (['patron', 'mudur'].includes(u.role) && rzK().on) { const q = rzQueue(); const rem = q.filter((x) => x.kind === 'rem'); if (rem.length) add('rzrem' + rem.length, 'warn', rem.length + ' misafire hatırlatma mesajı gönderme zamanı geldi.', 'rezerv'); const cf = q.filter((x) => x.kind === 'conf'); if (cf.length) add('rzconf' + cf.length, 'info', cf.length + ' rezervasyon için onay mesajı hazır.', 'rezerv');
    const cap = rzCap(); if (cap && rzK().warn) for (let i = 0; i < 3; i++) { const d = addDays(REF_ISO, i); const pk = rzPeak(d); if (pk.p >= cap) add('rzfull' + d, 'bad', (i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : rzDayName(d)) + ' kişi kapasitesi doldu (' + pk.p + '/' + cap + ').', 'rezerv'); } }
  return out; }; }
/* profil kartı metni */
{ const _pc = profCard; profCard = function () { return _pc().replace(/<p>İşletmen için \d+ kısa bilgi kaldı\. Kais ekranları sana göre hazırlar\.<\/p>/, (m) => '<p>Kais sizi ve işletmenizi daha iyi analiz edip daha iyi hizmet sunabilmesi için lütfen bilgilerin hepsini doldurun.</p>'); }; }
/* hatırlatma zamanlayıcı: uygulama açıkken müdür/patrona haber */
if (!window.__rzK85) { window.__rzK85 = setInterval(() => { try { const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role) || !rzK().on) return; window.__rzN = window.__rzN || {};
  rzQueue().filter((x) => x.kind === 'rem').forEach((x) => { if (window.__rzN[x.r.id]) return; window.__rzN[x.r.id] = 1; toast(rzTitle(x.r) + ' için hatırlatma zamanı. Kais mesajı hazırladı.', 'warn'); try { pushSend([u.id], 'Rezervasyon hatırlatma', x.r.name + ' · ' + x.r.time + ' · ' + x.r.n + ' kişi. Hatırlatma mesajı hazır.'); } catch (e) {} if (S.view === 'rezerv' && !S.modal) render(); }); } catch (e) {} }, 60000); }
/* profil kartı: Bugün sayfasında garanti göster */
{ const _vh85 = viewHTML; viewHTML = function () { let h = _vh85(); if (S.user && S.user.role === 'patron' && S.view === 'bugun' && !h.includes('pf-card')) { const c = profCard(); if (c) h = h.replace(/<div class="stack-lg[^"]*">/, (m) => m + c); } return h; }; }
/* ===== v86: Operasyon (müdür) + Talep (çalışan) ===== */
const CHKI = [], CHKL = [], REQS = [], MAINT = [], MPLAN = [], KASA = []; const OPC = { seeded: false, tol: 50 };
P_ARR.push(['CHKI', () => CHKI], ['CHKL', () => CHKL], ['REQS', () => REQS], ['MAINT', () => MAINT], ['MPLAN', () => MPLAN], ['KASA', () => KASA]); P_OBJ.push(['OPC', () => OPC]);
['CHKI', 'CHKL', 'REQS', 'MAINT', 'MPLAN', 'KASA', 'OPC'].forEach((k) => { P_SCOPE[k] = 'ekip'; });
{ const _w = wipeData; wipeData = function () { _w.apply(this, arguments); [CHKI, CHKL, REQS, MAINT, MPLAN, KASA].forEach((a) => { a.length = 0; }); OPC.seeded = false; }; }
const OP_AC = ['Kasayı aç, açılış tutarını say', 'Makine ve ocakları çalıştır', 'Tezgâh, vitrin ve masaları temizle', 'Tuvaletleri kontrol et', 'Günlük hazırlığı ve ürün sayısını kontrol et', 'Buzdolabı sıcaklığını kontrol et'];
const OP_KA = ['Kasayı say ve kapat', 'Makineleri ve ocakları kapat', 'Çöpleri çıkar, zemini temizle', 'Buzdolabı ve ürünleri kontrol et', 'Işık, klima ve kapıları kapat', 'Alarmı kur'];
function opSeed() { if (OPC.seeded) return; OPC.seeded = true; if (CHKI.length) return; OP_AC.forEach((t, i) => CHKI.push({ id: 'ca' + i, when: 'ac', t })); OP_KA.forEach((t, i) => CHKI.push({ id: 'ck' + i, when: 'ka', t })); }
const opHM = () => new Date().toTimeString().slice(0, 5);
const opMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const opN = (id) => (byId(id) || {}).name || 'Biri';
const opMgrs = () => USERS.filter((u) => ['patron', 'mudur'].includes(u.role)).map((u) => u.id);
const opAgo = (iso) => { const d = dleft(iso); return d == null ? '' : d === 0 ? 'Bugün' : d === -1 ? 'Dün' : Math.abs(d) + ' gün önce'; };
const opIsMgr = () => S.user && ['patron', 'mudur'].includes(S.user.role);
const opTl = (n) => fmt0(n);
let opTab = () => { const t = S.sub.ops; return ['ozet', 'liste', 'ariza', 'kasa', 'talep'].includes(t) ? t : 'ozet'; };
/* --- günlük liste --- */
const chkDone = (id) => CHKL.find((x) => x.date === REF_ISO && x.id === id);
const chkStat = (w) => { const it = CHKI.filter((i) => i.when === w); return { n: it.length, d: it.filter((i) => chkDone(i.id)).length }; };
H.chk = (el) => { const id = el.dataset.id; const d = chkDone(id); if (d) CHKL.splice(CHKL.indexOf(d), 1); else CHKL.push({ date: REF_ISO, id, by: S.user.id, at: opHM() }); if (CHKL.length > 1500) CHKL.splice(0, CHKL.length - 1500); pSched(); render(); };
function chkCard(w, edit) {
  opSeed(); const it = CHKI.filter((i) => i.when === w); const s = chkStat(w); const pct = s.n ? Math.round(s.d / s.n * 100) : 0; const title = w === 'ac' ? 'Açılış listesi' : 'Kapanış listesi';
  return `<section class="op-c"><div class="op-ch"><div><h3>${title}</h3><span>${s.d}/${s.n} tamam${s.n && s.d === s.n ? ' · bitti' : ''}</span></div>${edit ? `<button class="btn sm sec" data-a="chkadd" data-w="${w}">${ic('plus', 15)} Madde</button>` : ''}</div><div class="op-bar"><i style="width:${pct}%"></i></div>
  <div class="op-ck">${it.length ? it.map((i) => { const d = chkDone(i.id); return `<div class="op-ci${d ? ' on' : ''}"><button type="button" class="op-cb" data-a="chk" data-id="${i.id}" aria-pressed="${!!d}"><span class="op-bx">${d ? ic('check', 14) : ''}</span><span class="op-ct"><b>${esc(i.t)}</b>${d ? `<em>${esc(opN(d.by).split(' ')[0])} · ${esc(d.at)}</em>` : ''}</span></button>${edit ? `<button class="op-x" data-a="chkdel" data-id="${i.id}" aria-label="Maddeyi sil">${ic('x', 14)}</button>` : ''}</div>`; }).join('') : '<p class="op-em">Madde yok. Madde ekleyebilirsin.</p>'}</div></section>`;
}
H.chkadd = (el) => { S.modal = { type: 'chkadd', w: el.dataset.w }; renderModal(); };
NEWM.chkadd = (m) => sheet(m.w === 'ac' ? 'Açılış maddesi ekle' : 'Kapanış maddesi ekle', `<div class="field"><label for="ck-t">Madde</label><input id="ck-t" maxlength="80" placeholder="Örn. Vitrin ışıklarını aç"></div><div class="err" id="ck-e" role="alert"></div><button class="btn block" data-a="chkaddok" data-w="${m.w}">Ekle</button>`);
H.chkaddok = (el) => { const t = ((document.getElementById('ck-t') || {}).value || '').trim(); if (t.length < 3) { document.getElementById('ck-e').textContent = 'Maddeyi yaz.'; return; } CHKI.push({ id: 'c' + (++seq), when: el.dataset.w, t }); pSched(); S.modal = null; render(); };
H.chkdel = (el) => { const i = CHKI.findIndex((x) => x.id === el.dataset.id); if (i >= 0) CHKI.splice(i, 1); pSched(); render(); };
/* --- arıza ve bakım --- */
const MT_CAT = ['Kahve makinesi', 'Buzdolabı', 'Fırın / Ocak', 'Klima', 'Su / Tesisat', 'Elektrik / Işık', 'Kapı / Kilit', 'Diğer'];
const MT_ST = { acik: ['Açık', 'p-warn'], islemde: ['İşlemde', 'p-info'], bitti: ['Çözüldü', 'p-ok'] };
const mtOpen = () => MAINT.filter((m) => m.st !== 'bitti');
H.mtnew = () => { S.modal = { type: 'mtnew' }; renderModal(); };
NEWM.mtnew = () => sheet('Arıza ya da bakım bildir', `<div class="callout">${ic('sparkle')}<div>Müdüre ve işverene hemen haber gider. Aynı arıza daha önce bildirildiyse Kais birleştirir.</div></div>
  <div class="field"><label>Ne bozuldu?</label>${pfChips('mtcat', MT_CAT, '', false)}</div>
  <div class="field"><label for="mt-place">Nerede <span class="small muted">(isteğe bağlı)</span></label><input id="mt-place" maxlength="40" placeholder="Örn. Mutfak, salon"></div>
  <div class="field"><label>Aciliyet</label>${pfChips('mtpri', ['Normal', 'Acil: çalışmayı durduruyor'], 'Normal', false)}</div>
  <div class="field"><label for="mt-desc">Ne oluyor?</label><textarea id="mt-desc" placeholder="Örn. Su akıtıyor, çalışmıyor, garip ses çıkarıyor"></textarea></div>
  <div class="err" id="mt-e" role="alert"></div><button class="btn block" data-a="mtsend">Gönder</button>`);
H.mtsend = () => {
  const g = (id) => ((document.getElementById(id) || {}).value || '').trim(); const cat = pfOn('mtcat')[0] || ''; const pri = (pfOn('mtpri')[0] || 'Normal').startsWith('Acil') ? 'acil' : 'normal'; const place = g('mt-place'); const desc = g('mt-desc'); const er = (t) => { document.getElementById('mt-e').textContent = t; };
  if (!cat) return er('Ne bozulduğunu seç.'); if (desc.length < 5) return er('Kısaca ne olduğunu yaz.');
  const dup = MAINT.find((m) => m.st !== 'bitti' && m.cat === cat && (m.place || '').toLowerCase() === place.toLowerCase());
  if (dup) { dup.notes = dup.notes || []; dup.notes.push({ by: S.user.id, text: desc, at: nowT() }); if (pri === 'acil') dup.pri = 'acil'; pSched(); S.modal = null; render(); toast('Bu arıza zaten bildirilmişti. Notunu ekledim.', 'ok'); return; }
  MAINT.unshift({ id: 'mt' + (++seq), uid: S.user.id, cat, place, pri, desc, st: 'acik', date: REF_ISO, at: nowT(), notes: [] }); pSched();
  try { pushSend(opMgrs(), pri === 'acil' ? 'Acil arıza' : 'Arıza bildirimi', S.user.name + ': ' + cat + (place ? ' · ' + place : '') + '. ' + desc); } catch (e) {}
  S.modal = null; render(); toast('Arıza bildirimi müdüre gitti.', 'ok');
};
function mtCard(m, mgr) {
  const st = MT_ST[m.st] || MT_ST.acik; const nt = (m.notes || []).slice(-2);
  return `<div class="op-mt${m.pri === 'acil' && m.st !== 'bitti' ? ' acil' : ''}"><div class="op-mh"><b>${esc(m.cat)}${m.place ? ' · ' + esc(m.place) : ''}</b><span class="pill ${st[1]}">${st[0]}</span></div>
  <p>${esc(m.desc)}</p>${nt.map((n) => `<p class="op-nt">${esc(opN(n.by).split(' ')[0])}: ${esc(n.text)}</p>`).join('')}
  <div class="op-mm">${m.pri === 'acil' ? '<span class="pill p-bad">Acil</span>' : ''}<span>${esc(opN(m.uid))} · ${esc(opAgo(m.date))}</span>${m.asg ? `<span>İlgilenen: ${esc(opN(m.asg).split(' ')[0])}</span>` : ''}${m.cost ? `<span>Maliyet ${opTl(m.cost)}</span>` : ''}</div>
  ${mgr && m.st !== 'bitti' ? `<div class="op-ba">${m.st === 'acik' ? `<button class="btn sm sec" data-a="mtst" data-id="${m.id}" data-v="islemde">İşleme al</button>` : ''}<button class="btn sm" data-a="mtst" data-id="${m.id}" data-v="bitti">Çözüldü</button></div>` : ''}</div>`;
}
H.mtst = (el) => { const m = MAINT.find((x) => x.id === el.dataset.id); if (!m) return; if (el.dataset.v === 'bitti') { S.modal = { type: 'mtdone', id: m.id }; renderModal(); return; } m.st = 'islemde'; m.asg = S.user.id; (m.notes = m.notes || []).push({ by: S.user.id, text: 'İşleme aldı.', at: nowT() }); pSched(); try { pushSend([m.uid], 'Arıza işleme alındı', m.cat + ' için ilgileniliyor.'); } catch (e) {} render(); };
NEWM.mtdone = (m) => { const x = MAINT.find((q) => q.id === m.id); return sheet('Arıza çözüldü', `<div class="callout">${ic('check')}<div><b>${esc(x ? x.cat : '')}</b><p style="margin-top:2px">${esc(x ? x.desc : '')}</p></div></div><div class="field"><label for="md-cost">Maliyet <span class="small muted">(₺, isteğe bağlı)</span></label><input id="md-cost" inputmode="decimal" placeholder="0"></div><div class="field"><label for="md-note">Ne yapıldı? <span class="small muted">(isteğe bağlı)</span></label><textarea id="md-note" placeholder="Örn. Servis geldi, parça değişti"></textarea></div><button class="btn block" data-a="mtdoneok" data-id="${m.id}">Kapat</button>`); };
H.mtdoneok = (el) => { const m = MAINT.find((x) => x.id === el.dataset.id); if (!m) return; const g = (id) => ((document.getElementById(id) || {}).value || '').trim(); const c = trNum(g('md-cost')); m.st = 'bitti'; m.doneAt = REF_ISO; if (c > 0) m.cost = c; if (g('md-note')) (m.notes = m.notes || []).push({ by: S.user.id, text: g('md-note'), at: nowT() }); pSched(); try { pushSend([m.uid], 'Arıza çözüldü', m.cat + ' sorunu çözüldü.'); } catch (e) {} S.modal = null; render(); toast('Kapatıldı.', 'ok'); };
const MP_Q = [['Kahve makinesi bakımı', 30], ['Davlumbaz ve yağ filtresi', 30], ['Buzdolabı temizliği', 14], ['Zararlı ilaçlama', 60], ['Yangın tüpü kontrolü', 180], ['Klima filtre temizliği', 90]];
const mpLeft = (p) => p.every + dleft(p.last);
H.mpq = (el) => { const q = MP_Q[Number(el.dataset.i)]; if (!q || MPLAN.some((p) => p.n === q[0])) return; MPLAN.push({ id: 'mp' + (++seq), n: q[0], every: q[1], last: REF_ISO }); pSched(); render(); toast('Bakım takvime eklendi.', 'ok'); };
H.mpdone = (el) => { const p = MPLAN.find((x) => x.id === el.dataset.id); if (p) { p.last = REF_ISO; pSched(); render(); toast('Bakım yapıldı olarak işaretlendi.', 'ok'); } };
H.mpdel = (el) => { const i = MPLAN.findIndex((x) => x.id === el.dataset.id); if (i >= 0) MPLAN.splice(i, 1); pSched(); render(); };
H.mpnew = () => { S.modal = { type: 'mpnew' }; renderModal(); };
NEWM.mpnew = () => sheet('Bakım takvime ekle', `<div class="field"><label for="mp-n">Bakım adı</label><input id="mp-n" maxlength="60" placeholder="Örn. Fırın temizliği"></div><div class="field"><label for="mp-e">Kaç günde bir?</label><input id="mp-e" inputmode="numeric" maxlength="3" placeholder="30"></div><div class="err" id="mp-er" role="alert"></div><button class="btn block" data-a="mpnewok">Ekle</button>`);
H.mpnewok = () => { const n = ((document.getElementById('mp-n') || {}).value || '').trim(); const e = Number((document.getElementById('mp-e') || {}).value); if (n.length < 3 || !(e >= 1)) { document.getElementById('mp-er').textContent = 'Adı ve kaç günde bir olduğunu yaz.'; return; } MPLAN.push({ id: 'mp' + (++seq), n, every: Math.round(e), last: REF_ISO }); pSched(); S.modal = null; render(); };
function mtView() {
  const f = S.mtF || 'acik'; const list = MAINT.filter((m) => f === 'bitti' ? m.st === 'bitti' : m.st !== 'bitti').sort((a, b) => (b.pri === 'acil') - (a.pri === 'acil'));
  const nOpen = mtOpen().length; const plan = MPLAN.slice().sort((a, b) => mpLeft(a) - mpLeft(b));
  return `<div class="op-two"><div class="op-l"><section class="op-c"><div class="op-ch"><div><h3>Arıza bildirimleri</h3><span>${nOpen} açık</span></div><button class="btn sm" data-a="mtnew">${ic('plus', 15)} Bildir</button></div>
  <div class="op-fl">${[['acik', 'Açık ' + nOpen], ['bitti', 'Çözülen ' + MAINT.filter((m) => m.st === 'bitti').length]].map((x) => `<button data-a="mtf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join('')}</div>
  <div class="op-ls">${list.length ? list.map((m) => mtCard(m, true)).join('') : `<p class="op-em">${f === 'acik' ? 'Açık arıza yok.' : 'Çözülen arıza yok.'}</p>`}</div></section></div>
  <div class="op-r"><section class="op-c"><div class="op-ch"><div><h3>Bakım takvimi</h3><span>Düzenli bakımlar</span></div><button class="btn sm sec" data-a="mpnew">${ic('plus', 15)} Ekle</button></div>
  <div class="op-ls">${plan.map((p) => { const l = mpLeft(p); return `<div class="op-mp"><div><b>${esc(p.n)}</b><span class="${l < 0 ? 'bad' : l <= 5 ? 'warn' : ''}">${l < 0 ? Math.abs(l) + ' gün gecikti' : l === 0 ? 'Bugün' : l + ' gün sonra'} · ${p.every} günde bir</span></div><div class="op-ba"><button class="btn sm sec" data-a="mpdone" data-id="${p.id}">Yapıldı</button><button class="op-x" data-a="mpdel" data-id="${p.id}" aria-label="Sil">${ic('x', 14)}</button></div></div>`; }).join('') || '<p class="op-em">Takvim boş. Aşağıdan hızlıca ekle.</p>'}</div>
  <div class="op-qa"><span>Hızlı ekle</span>${MP_Q.map((q, i) => MPLAN.some((p) => p.n === q[0]) ? '' : `<button data-a="mpq" data-i="${i}">${esc(q[0])}</button>`).join('')}</div></section></div></div>`;
}
H.mtf = (el) => { S.mtF = el.dataset.v; render(); };
/* --- kasa --- */
const ksToday = () => KASA.find((k) => k.date === REF_ISO);
const ksSys = () => Math.round(SALES.filter((s) => s.date === REF_ISO).reduce((a, s) => a + (Number(s.total) || 0), 0));
const ksSales = (k) => (k.sys > 0 ? k.sys : Math.max(0, (k.cash - k.open) + k.card));
function ksDiff(v) { const sys = v.sys > 0 ? v.sys : 0; return sys ? Math.round((v.cash - v.open) + v.card - sys) : null; }
const ksChip = (d) => d == null ? '<span class="pill p-mute">Fark yok</span>' : Math.abs(d) <= (OPC.tol || 50) ? '<span class="pill p-ok">Tutuyor</span>' : `<span class="pill ${d < 0 ? 'p-bad' : 'p-warn'}">${d < 0 ? 'Açık ' : 'Fazla '}${opTl(Math.abs(d))}</span>`;
H.kssave = () => {
  const n = (id) => { const v = Number(String((document.getElementById(id) || {}).value || '').replace(/\./g, '').replace(',', '.')); return v >= 0 ? v : 0; };
  const e = { id: 'ks' + (++seq), date: REF_ISO, by: S.user.id, open: n('ks-open'), cash: n('ks-cash'), card: n('ks-card'), sys: n('ks-sys'), ref: n('ks-ref'), note: ((document.getElementById('ks-note') || {}).value || '').trim() };
  if (!e.cash && !e.card) { document.getElementById('ks-e').textContent = 'Nakit ya da kart tutarını yaz.'; return; }
  e.diff = ksDiff(e); const i = KASA.findIndex((k) => k.date === REF_ISO); if (i >= 0) KASA.splice(i, 1); KASA.unshift(e); if (KASA.length > 400) KASA.length = 400; pSched();
  if (e.diff != null && Math.abs(e.diff) > (OPC.tol || 50)) { try { pushSend(opMgrs().filter((x) => x !== S.user.id), 'Kasa farkı', (e.diff < 0 ? 'Kasa açığı ' : 'Kasa fazlası ') + opTl(Math.abs(e.diff)) + ' (' + REF_ISO + ')'); } catch (x) {} }
  render(); toast('Kasa kapanışı kaydedildi.', 'ok');
};
document.addEventListener('input', (ev) => { const t = ev.target; if (!t || !t.closest || !t.closest('.op-ks')) return; const n = (id) => { const v = Number(String((document.getElementById(id) || {}).value || '').replace(/\./g, '').replace(',', '.')); return v >= 0 ? v : 0; }; const v = { open: n('ks-open'), cash: n('ks-cash'), card: n('ks-card'), sys: n('ks-sys') }; const d = ksDiff(v); const el = document.getElementById('ks-prev'); if (el) el.innerHTML = d == null ? 'Sistem toplamını yazarsan farkı hesaplarım.' : 'Fark: <b class="' + (Math.abs(d) <= (OPC.tol || 50) ? 'ok' : d < 0 ? 'bad' : 'warn') + '">' + (d > 0 ? '+' : d < 0 ? '−' : '') + opTl(Math.abs(d)) + '</b>'; });
function ksTips() {
  const T = []; const hist = KASA.filter((k) => k.diff != null).slice(0, 7); const last3 = hist.slice(0, 3);
  if (!ksToday() && opMin() >= 21 * 60) T.push(['a', 'Kasa kapanışı girilmedi', 'Bugünün sayımını yaz. Farkı hemen görürsün.']);
  if (last3.length === 3 && last3.every((k) => k.diff < -(OPC.tol || 50))) T.push(['r', 'Üst üste 3 gün kasa açığı', 'Toplam ' + opTl(Math.abs(last3.reduce((a, k) => a + k.diff, 0))) + ' açık. Kasadan sorumlu kişiyi ve iade/iptalleri kontrol et.']);
  const big = KASA.filter((k) => k.ref > 0 && ksSales(k) > 0 && k.ref / ksSales(k) > 0.05).slice(0, 1); if (big.length) T.push(['a', 'İade ve iptal yüksek', opAgo(big[0].date) + ' cironun %' + Math.round(big[0].ref / ksSales(big[0]) * 100) + "'i iade ya da iptal."]);
  if (hist.length >= 3) { const sum = hist.reduce((a, k) => a + k.diff, 0); T.push([Math.abs(sum) > (OPC.tol || 50) * 3 ? 'a' : 'g', 'Son ' + hist.length + ' gün', sum === 0 ? 'Kasa tam tutuyor.' : 'Toplam fark ' + (sum > 0 ? '+' : '−') + opTl(Math.abs(sum)) + '.']); }
  return T;
}
function ksView() {
  const t = ksToday(); const sys = t ? t.sys : ksSys(); const week = KASA.filter((k) => dleft(k.date) > -7 && k.diff != null).reduce((a, k) => a + k.diff, 0); const v = (x) => (x ? x : '');
  const tips = ksTips();
  return `<div class="op-two"><div class="op-l"><section class="op-c op-ks"><div class="op-ch"><div><h3>Günlük kasa kapanışı</h3><span>${esc(today())}${t ? ' · kaydedildi' : ''}</span></div>${t ? ksChip(t.diff) : ''}</div>
  <div class="op-fg"><div class="field"><label for="ks-open">Açılış kasası</label><input id="ks-open" inputmode="decimal" placeholder="0" value="${v(t && t.open)}"></div><div class="field"><label for="ks-cash">Sayılan nakit</label><input id="ks-cash" inputmode="decimal" placeholder="0" value="${v(t && t.cash)}"></div><div class="field"><label for="ks-card">Kart / POS toplamı</label><input id="ks-card" inputmode="decimal" placeholder="0" value="${v(t && t.card)}"></div><div class="field"><label for="ks-sys">Sistem toplamı${ksSys() ? ' <span class="small muted">(adisyondan)</span>' : ''}</label><input id="ks-sys" inputmode="decimal" placeholder="0" value="${v(sys)}"></div><div class="field"><label for="ks-ref">İade / iptal tutarı</label><input id="ks-ref" inputmode="decimal" placeholder="0" value="${v(t && t.ref)}"></div></div>
  <div class="field"><label for="ks-note">Not <span class="small muted">(isteğe bağlı)</span></label><input id="ks-note" maxlength="120" placeholder="Fark varsa nedenini yaz" value="${esc(t ? t.note : '')}"></div>
  <p class="op-pv" id="ks-prev">${t && t.diff != null ? 'Fark: <b class="' + (Math.abs(t.diff) <= (OPC.tol || 50) ? 'ok' : t.diff < 0 ? 'bad' : 'warn') + '">' + (t.diff > 0 ? '+' : t.diff < 0 ? '−' : '') + opTl(Math.abs(t.diff)) + '</b>' : 'Sistem toplamını yazarsan farkı hesaplarım.'}</p><div class="err" id="ks-e" role="alert"></div><button class="btn block" data-a="kssave">${t ? 'Güncelle' : 'Kasayı kapat'}</button><p class="small muted" style="margin-top:8px">Fark = (sayılan nakit − açılış kasası) + kart − sistem toplamı. ${opTl(OPC.tol || 50)} altı fark "tutuyor" sayılır.</p></section></div>
  <div class="op-r"><section class="op-c"><div class="op-ch"><div><h3>Kais yorumu</h3><span>Son günlere göre</span></div></div><div class="op-ls">${tips.length ? tips.map(opTip).join('') : '<p class="op-em">Birkaç gün kapanış girince kasa trendini yorumlarım. Bu hafta toplam fark: ' + (week ? (week > 0 ? '+' : '−') + opTl(Math.abs(week)) : 'yok') + '.</p>'}</div></section>
  <section class="op-c"><div class="op-ch"><div><h3>Geçmiş</h3><span>Son kapanışlar</span></div></div><div class="op-ls op-hs">${KASA.length ? KASA.slice(0, 30).map((k) => `<div class="op-kr"><div><b>${esc(isoShort(k.date))}</b><span>Ciro ${opTl(ksSales(k))}${k.note ? ' · ' + esc(k.note) : ''}</span></div>${ksChip(k.diff)}</div>`).join('') : '<p class="op-em">Henüz kapanış yok.</p>'}</div></section></div></div>`;
}
/* --- talepler --- */
const RQ_K = { avans: 'Avans', takas: 'Vardiya değişimi', diger: 'Diğer talep' };
const RQ_ST = { bekliyor: ['Bekliyor', 'p-warn'], onay: ['Onaylandı', 'p-ok'], red: ['Reddedildi', 'p-bad'] };
H.rqnew = (el) => { if (el.dataset.k === 'izin') { H.lrnew(); return; } if (el.dataset.k === 'ariza') { H.mtnew(); return; } S.modal = { type: 'rqnew', kind: el.dataset.k }; renderModal(); };
NEWM.rqnew = (m) => {
  const me = S.user.id; const mates = EMP_IDS.filter((x) => x !== me); const k = m.kind; let body = '';
  if (k === 'avans') body = `<div class="field"><label for="rq-amt">Tutar (₺)</label><input id="rq-amt" inputmode="decimal" placeholder="Örn. 2000"></div><div class="field"><label for="rq-txt">Neden?</label><textarea id="rq-txt" placeholder="Kısaca nedenini yaz"></textarea></div>`;
  if (k === 'takas') body = `<div class="field"><label for="rq-date">Hangi gün?</label><input id="rq-date" type="date" min="${REF_ISO}"></div><div class="field"><label for="rq-with">Kiminle değişmek istersin?</label><select id="rq-with"><option value="">Fark etmez, müdür karar versin</option>${mates.map((x) => `<option value="${x}">${esc(opN(x))}</option>`).join('')}</select></div><div class="field"><label for="rq-txt">Nedeni</label><textarea id="rq-txt" placeholder="Kısaca nedenini yaz"></textarea></div>`;
  if (k === 'diger') body = `<div class="field"><label for="rq-txt">Ne istiyorsun?</label><textarea id="rq-txt" placeholder="Talebini yaz"></textarea></div>`;
  return sheet(RQ_K[k] || 'Talep', `${body}<div class="err" id="rq-e" role="alert"></div><button class="btn block" data-a="rqsend" data-k="${k}">Gönder</button><p class="small muted">Müdüre ve işverene gider. Sonucu bu sayfada görürsün.</p>`);
};
H.rqsend = (el) => {
  const k = el.dataset.k; const g = (id) => ((document.getElementById(id) || {}).value || '').trim(); const er = (t) => { document.getElementById('rq-e').textContent = t; }; const r = { id: 'rq' + (++seq), uid: S.user.id, kind: k, txt: g('rq-txt'), st: 'bekliyor', at: nowT(), date0: REF_ISO };
  if (k === 'avans') { r.amt = Number(g('rq-amt').replace(/\./g, '').replace(',', '.')); if (!(r.amt > 0)) return er('Tutarı yaz.'); if (r.txt.length < 3) return er('Nedenini yaz.'); }
  if (k === 'takas') { r.date = g('rq-date'); r.with = g('rq-with'); if (!r.date || r.date < REF_ISO) return er('Gelecek bir gün seç.'); if (r.txt.length < 3) return er('Nedenini yaz.'); }
  if (k === 'diger' && r.txt.length < 5) return er('Talebini yaz.');
  REQS.unshift(r); if (REQS.length > 400) REQS.length = 400; pSched();
  try { pushSend(opMgrs(), RQ_K[k] + ' talebi', S.user.name + (r.amt ? ': ' + opTl(r.amt) : r.date ? ': ' + isoShort(r.date) : '') + '. ' + r.txt); } catch (e) {}
  S.modal = null; render(); toast('Talebin müdüre ve işverene gitti.', 'ok');
};
function rqCard(r, mgr) {
  const st = RQ_ST[r.st] || RQ_ST.bekliyor; let line = '';
  if (r.kind === 'avans') line = opTl(r.amt); if (r.kind === 'takas') line = isoShort(r.date) + (r.with ? ' · ' + esc(opN(r.with).split(' ')[0]) + ' ile' : '');
  const hint = mgr && r.st === 'bekliyor' ? rqHint(r) : '';
  return `<div class="op-mt"><div class="op-mh"><b>${mgr ? esc(opN(r.uid)) + ' · ' : ''}${RQ_K[r.kind]}${line ? ' · ' + line : ''}</b><span class="pill ${st[1]}">${st[0]}</span></div><p>${esc(r.txt || '')}</p>${hint}${r.note ? `<p class="op-nt">${esc(opN(r.by).split(' ')[0])}: ${esc(r.note)}</p>` : ''}<div class="op-mm"><span>${esc(r.at || '')}</span></div>
  ${mgr && r.st === 'bekliyor' ? `<div class="op-ba"><button class="btn sm" data-a="rqok" data-id="${r.id}">Onayla</button><button class="btn sm sec" data-a="rqno" data-id="${r.id}">Reddet</button></div>` : ''}</div>`;
}
function rqHint(r) {
  let h = '';
  if (r.kind === 'avans') { const ym = REF_ISO.slice(0, 7); const prev = REQS.filter((x) => x.uid === r.uid && x.kind === 'avans' && x.st === 'onay' && String(x.date0 || '').slice(0, 7) === ym).reduce((a, x) => a + x.amt, 0); h = prev ? `Bu ay onaylı avansı ${opTl(prev)}. Yeni talep ile ${opTl(prev + r.amt)} olur.` : 'Bu ay onaylı avansı yok.'; }
  if (r.kind === 'takas' && r.date) { const [y, m, d] = r.date.split('-').map(Number); const mine = vdState(y, m - 1, d, r.uid); const t = r.with ? vdState(y, m - 1, d, r.with) : null; const lab = (s) => s.k === 'shift' ? s.t.n + ' vardiyası' : s.k === 'off' ? 'izinli' : s.k === 'leave' ? 'izinde' : 'planı yok'; h = `${esc(opN(r.uid).split(' ')[0])} o gün ${lab(mine)}` + (t ? `, ${esc(opN(r.with).split(' ')[0])} ${lab(t)}.` : '.') + (t && mine.k === 'shift' && t.k === 'shift' && t.t.id === mine.t.id ? ' Aynı vardiya, takas anlamsız.' : ''); }
  return h ? `<p class="op-ai">${ic('sparkle', 14)}<span>${h}</span></p>` : '';
}
H.rqok = (el) => { const r = REQS.find((x) => x.id === el.dataset.id); if (!r) return; r.st = 'onay'; r.by = S.user.id; pSched(); try { pushSend([r.uid], RQ_K[r.kind] + ' onaylandı', 'Talebin onaylandı.'); } catch (e) {} render(); toast('Onaylandı.', 'ok'); };
H.rqno = (el) => { S.modal = { type: 'rqno', id: el.dataset.id }; renderModal(); };
NEWM.rqno = (m) => sheet('Talebi reddet', `<div class="field"><label for="rn-t">Nedeni <span class="small muted">(isteğe bağlı)</span></label><textarea id="rn-t" placeholder="Çalışan görecek"></textarea></div><button class="btn block" data-a="rqnook" data-id="${m.id}">Reddet</button>`);
H.rqnook = (el) => { const r = REQS.find((x) => x.id === el.dataset.id); if (!r) return; r.st = 'red'; r.by = S.user.id; r.note = ((document.getElementById('rn-t') || {}).value || '').trim(); pSched(); try { pushSend([r.uid], RQ_K[r.kind] + ' reddedildi', r.note || 'Talebin onaylanmadı.'); } catch (e) {} S.modal = null; render(); };
function rqView() {
  const nL = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length; const pen = REQS.filter((r) => r.st === 'bekliyor'); const dn = REQS.filter((r) => r.st !== 'bekliyor').slice(0, 25);
  return `<div class="op-two"><div class="op-l"><section class="op-c"><div class="op-ch"><div><h3>Bekleyen talepler</h3><span>${pen.length} talep karar bekliyor</span></div></div><div class="op-ls">${pen.length ? pen.map((r) => rqCard(r, true)).join('') : '<p class="op-em">Bekleyen avans, takas ya da başka talep yok.</p>'}</div></section>
  <section class="op-c"><div class="op-ch"><div><h3>Son kararlar</h3></div></div><div class="op-ls">${dn.length ? dn.map((r) => rqCard(r, true)).join('') : '<p class="op-em">Henüz karar yok.</p>'}</div></section></div>
  <div class="op-r"><section class="op-c"><div class="op-ch"><div><h3>İzin talepleri</h3><span>${nL ? nL + ' karar bekliyor' : 'Bekleyen yok'}</span></div></div><button class="btn block sec" data-a="nav" data-v="ekip" data-s="talep">İzin taleplerine git</button></section>
  <section class="op-c"><div class="op-ch"><div><h3>Arıza bildirimleri</h3><span>${mtOpen().length} açık</span></div></div><button class="btn block sec" data-a="opgo" data-t="ariza">Arızalara git</button></section></div></div>`;
}
/* --- bugünün durumu, geç kalanlar, öneriler --- */
function opLate() {
  const [y, m, d] = REF_ISO.split('-').map(Number); const out = []; const now = opMin(); const off = [];
  EMP_IDS.forEach((id) => { let s = null; try { s = vdState(y, m - 1, d, id); } catch (e) { s = { k: 'none' }; } if (s.k === 'off') off.push(id); });
  EMP_IDS.forEach((id) => { let s = null; try { s = vdState(y, m - 1, d, id); } catch (e) { s = { k: 'none' }; } const a = ATT[id] || {}; let start = null; if (s.k === 'shift') start = toMin(s.t.s); else if (s.k === 'none') start = 9 * 60; if (start == null || a.state !== 'none') return; const end = s.k === 'shift' ? (toMin(s.t.e) || 1440) : 18 * 60; const late = now - start; if (late >= 10 && now < end) out.push({ id, min: late, cover: off.filter((x) => x !== id && (ATT[x] || {}).state === 'none').slice(0, 3) }); });
  return out;
}
function opStatus() {
  const [y, m, d] = REF_ISO.split('-').map(Number); return EMP_IDS.map((id) => { let s = { k: 'none' }; try { s = vdState(y, m - 1, d, id); } catch (e) {} const a = ATT[id] || { state: 'none' }; const lab = { none: 'Girmedi', working: 'Çalışıyor', break: 'Molada', out: 'Çıktı', pending: 'Onay bekliyor' }[a.state] || ''; const sh = s.k === 'shift' ? s.t.n + ' ' + s.t.s + '–' + s.t.e : s.k === 'off' ? 'Haftalık izin' : s.k === 'leave' ? 'İzinde' : s.k === 'hol' ? 'Resmi tatil' : 'Plan yok'; return { id, a, lab, sh, k: s.k }; });
}
function opTips() {
  const T = []; opSeed();
  opLate().forEach((l) => T.push(['r', opN(l.id) + ' ' + opLt(l), 'Henüz giriş yapmadı.' + (l.cover.length ? ' Bugün izinli olanlar: ' + l.cover.map((x) => opN(x).split(' ')[0]).join(', ') + '. Gerekirse yerine çağırabilirsin.' : ''), 'opgo', 'ozet', 'Ekibe bak']));
  const ac = MAINT.filter((m) => m.st !== 'bitti' && m.pri === 'acil'); if (ac.length) T.push(['r', ac.length + ' acil arıza açık', ac.slice(0, 2).map((m) => m.cat + (m.place ? ' (' + m.place + ')' : '')).join(', '), 'opgo', 'ariza', 'Arızalara git']);
  const old = MAINT.filter((m) => m.st === 'acik' && dleft(m.date) <= -3); if (old.length) T.push(['a', old.length + ' arıza 3 günden uzun süredir bekliyor', old[0].cat + ' dahil. İşleme al ya da servis çağır.', 'opgo', 'ariza', 'Arızalara git']);
  const cnt = {}; MAINT.filter((m) => dleft(m.date) > -60).forEach((m) => { cnt[m.cat] = (cnt[m.cat] || 0) + 1; }); Object.keys(cnt).filter((k) => cnt[k] >= 3).slice(0, 1).forEach((k) => T.push(['a', k + ' tekrar tekrar bozuluyor', 'Son 60 günde ' + cnt[k] + ' arıza. Tamirden çok değişim ya da servis anlaşması düşün.']));
  const mp = MPLAN.filter((p) => mpLeft(p) <= 3).sort((a, b) => mpLeft(a) - mpLeft(b)); if (mp.length) T.push([mpLeft(mp[0]) < 0 ? 'r' : 'a', mp[0].n + (mpLeft(mp[0]) < 0 ? ' gecikti' : ' yaklaşıyor'), mp.length > 1 ? 'Toplam ' + mp.length + ' bakım zamanı geldi.' : 'Bakım zamanı. Yapınca işaretle.', 'opgo', 'ariza', 'Takvime git']);
  const pend = REQS.filter((r) => r.st === 'bekliyor'); if (pend.length) T.push(['a', pend.length + ' talep karar bekliyor', pend.slice(0, 2).map((r) => opN(r.uid).split(' ')[0] + ': ' + RQ_K[r.kind].toLowerCase()).join(', '), 'opgo', 'talep', 'Talepleri aç']);
  const ac1 = chkStat('ac'); if (ac1.n && ac1.d < ac1.n && opMin() >= 11 * 60) T.push(['a', 'Açılış listesi eksik', (ac1.n - ac1.d) + ' madde yapılmadı.', 'opgo', 'liste', 'Listeye git']);
  const ka1 = chkStat('ka'); if (ka1.n && ka1.d < ka1.n && opMin() >= 22 * 60) T.push(['a', 'Kapanış listesi eksik', (ka1.n - ka1.d) + ' madde yapılmadı.', 'opgo', 'liste', 'Listeye git']);
  ksTips().filter((t) => t[0] !== 'g').forEach((t) => T.push(t.concat(['opgo', 'kasa', 'Kasaya git'])));
  return T;
}
const opLt = (l) => (l.min < 180 ? l.min + ' dk geç kaldı' : 'bugün henüz gelmedi');
const opTip = (t) => `<div class="sa2-ti ${t[0]}"><i></i><div><b>${esc(t[1])}</b><p>${esc(t[2])}</p>${t[3] ? `<button class="btn sm sec" data-a="${t[3]}" data-t="${t[4]}">${esc(t[5])}</button>` : ''}</div></div>`;
H.opgo = (el) => { S.sub.ops = el.dataset.t || 'ozet'; if (S.view !== 'ops') go('ops'); else render(); };
function opTiles() {
  const st = opStatus(); const on = st.filter((x) => ['working', 'break', 'pending'].includes(x.a.state)).length; const ac = chkStat('ac'); const nP = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).length + REQS.filter((r) => r.st === 'bekliyor').length; const nA = mtOpen().length;
  const T = (cls, ic1, v, l, t) => `<button type="button" class="dz-st ${cls} op-tl" data-a="opgo" data-t="${t}"><span>${ic(ic1, 20)}</span><div><b>${v}</b><small>${l}</small></div></button>`;
  return `<div class="dz-sts">${T('i', 'users', on + '/' + st.length, 'Çalışıyor', 'ozet')}${T(ac.n && ac.d === ac.n ? 'g' : 'w', 'check', ac.d + '/' + ac.n, 'Açılış listesi', 'liste')}${T(nA ? 'w' : 'g', 'gear', nA, 'Açık arıza', 'ariza')}${T(nP ? 'w' : 'g', 'list', nP, 'Bekleyen talep', 'talep')}</div>`;
}
function opOzet() {
  const st = opStatus(); const tips = opTips(); const t = ksToday(); const plan = MPLAN.filter((p) => mpLeft(p) <= 7).sort((a, b) => mpLeft(a) - mpLeft(b));
  const rows = st.map((x) => `<div class="op-er"><span class="op-dot ${x.a.state}"></span><div><b>${esc(opN(x.id))}</b><span>${esc(x.sh)}${x.a.inAt ? ' · giriş ' + esc(x.a.inAt) : ''}</span></div><span class="pill ${x.a.state === 'working' ? 'p-ok' : x.a.state === 'none' && ['shift', 'none'].includes(x.k) && opLate().some((l) => l.id === x.id) ? 'p-bad' : 'p-mute'}">${esc(x.lab)}</span></div>`).join('');
  return `<div class="op-two"><div class="op-l">${opTiles()}<section class="op-c op-kais"><div class="op-ch"><div class="op-kt">${ic('sparkle', 18)}<h3>Kais fark etti</h3></div><span>${tips.length ? tips.length + ' konu' : 'Her şey yolunda'}</span></div><div class="op-ls">${tips.length ? tips.slice(0, 6).map(opTip).join('') : '<p class="op-em">Şu an dikkat gerektiren bir şey görmüyorum. Geç kalan, açık arıza ya da bekleyen talep olursa buraya yazarım.</p>'}</div></section>
  <section class="op-c"><div class="op-ch"><div><h3>Bugün ekipte durum</h3><span>Vardiya ve giriş</span></div></div><div class="op-ls op-hs">${rows || '<p class="op-em">Ekip yok.</p>'}</div></section></div>
  <div class="op-r"><div class="op-g2">${chkCard('ac', false)}${chkCard('ka', false)}</div><section class="op-c"><div class="op-ch"><div><h3>Kasa</h3><span>${t ? 'Bugün kapandı' : 'Bugün henüz kapanmadı'}</span></div>${t ? ksChip(t.diff) : ''}</div>${t ? `<p class="op-em" style="margin:0">Ciro ${opTl(ksSales(t))}</p>` : '<button class="btn sm" data-a="opgo" data-t="kasa">Kasayı kapat</button>'}</section>${plan.length ? `<section class="op-c"><div class="op-ch"><div><h3>Yaklaşan bakımlar</h3></div></div><div class="op-ls">${plan.map((p) => `<div class="op-mp"><div><b>${esc(p.n)}</b><span class="${mpLeft(p) < 0 ? 'bad' : 'warn'}">${mpLeft(p) < 0 ? Math.abs(mpLeft(p)) + ' gün gecikti' : mpLeft(p) === 0 ? 'Bugün' : mpLeft(p) + ' gün sonra'}</span></div></div>`).join('')}</div></section>` : ''}</div></div>`;
}
function viewOps() {
  opSeed(); const nA = mtOpen().length; const nT = REQS.filter((r) => r.st === 'bekliyor').length; const cur = opTab();
  const items = [['ozet', 'Özet'], ['liste', 'Günlük liste'], ['ariza', 'Arıza ve bakım' + (nA ? ' (' + nA + ')' : '')], ['kasa', 'Kasa'], ['talep', 'Talepler' + (nT ? ' (' + nT + ')' : '')]];
  const body = cur === 'liste' ? `<div class="op-g2">${chkCard('ac', true)}${chkCard('ka', true)}</div>` : cur === 'ariza' ? mtView() : cur === 'kasa' ? ksView() : cur === 'talep' ? rqView() : opOzet();
  return `<div class="stack-lg op"><div><h2>Operasyon</h2><p class="muted" style="margin-top:4px">${esc(today())} · günlük işleyişi tek yerden takip et</p></div>${seg('ops', items, cur).replace('<div class="seg"', '<div class="seg seg-b"')}${body}</div>`;
}
/* --- çalışan: Taleplerim --- */
function viewTalebim() {
  const me = S.user.id; const L = LVREQ.filter((r) => r.uid === me).map((r) => ({ k: 'izin', t: 'İzin · ' + r.txt, s: { bekliyor: 'Bekliyor', yanit: 'Yanıtın bekleniyor', karsi: 'Karşı teklif var', onayli: 'Onaylandı', reddedildi: 'Reddedildi' }[r.status] || r.status, tone: r.status === 'onayli' ? 'p-ok' : r.status === 'reddedildi' ? 'p-bad' : 'p-warn', pend: !['onayli', 'reddedildi'].includes(r.status), x: r.status === 'karsi' ? 'Müdür başka tarih önerdi. Yanıt vermek için Bugün sayfasına bak.' : '' }));
  const R = REQS.filter((r) => r.uid === me).map((r) => ({ k: r.kind, t: RQ_K[r.kind] + (r.amt ? ' · ' + opTl(r.amt) : r.date ? ' · ' + isoShort(r.date) : ''), s: RQ_ST[r.st][0], tone: RQ_ST[r.st][1], pend: r.st === 'bekliyor', x: r.note ? opN(r.by).split(' ')[0] + ': ' + r.note : '' }));
  const M = MAINT.filter((m) => m.uid === me).map((m) => ({ k: 'ariza', t: 'Arıza · ' + m.cat + (m.place ? ' · ' + m.place : ''), s: MT_ST[m.st][0], tone: MT_ST[m.st][1], pend: m.st !== 'bitti', x: m.asg ? opN(m.asg).split(' ')[0] + ' ilgileniyor' : '' }));
  const all = L.concat(R, M); const row = (x) => `<div class="op-rr"><div><b>${esc(x.t)}</b>${x.x ? `<span>${esc(x.x)}</span>` : ''}</div><span class="pill ${x.tone}">${esc(x.s)}</span></div>`; const pend = all.filter((x) => x.pend); const done = all.filter((x) => !x.pend);
  const T = (k, i, l, s) => `<button type="button" class="op-tt" data-a="rqnew" data-k="${k}"><span>${ic(i, 22)}</span><b>${l}</b><small>${s}</small></button>`;
  return `<div class="stack-lg op"><div><h2>Talep gönder</h2><p class="muted" style="margin-top:4px">Müdüre ve işverene hemen ulaşır, sonucu burada görürsün.</p></div>
  <div class="op-tg">${T('izin', 'clock', 'İzin', 'Tarih seç, nedenini yaz')}${T('avans', 'receipt', 'Avans', 'Tutarı ve nedenini yaz')}${T('takas', 'users', 'Vardiya değişimi', 'Günü ve kişiyi seç')}${T('ariza', 'gear', 'Arıza ve bakım', 'Bozulan şeyi bildir')}${T('diger', 'chat', 'Diğer', 'Başka bir istek')}</div>
  <section class="op-c"><div class="op-ch"><div><h3>Bekleyenler</h3><span>${pend.length}</span></div></div><div class="op-ls">${pend.length ? pend.map(row).join('') : '<p class="op-em">Bekleyen talebin yok.</p>'}</div></section>
  <section class="op-c"><div class="op-ch"><div><h3>Sonuçlananlar</h3></div></div><div class="op-ls">${done.length ? done.map(row).join('') : '<p class="op-em">Henüz sonuçlanan talep yok.</p>'}</div></section></div>`;
}
/* --- Bugün sayfalarına ekler --- */
function opMini() {
  const tips = opTips(); return `<section class="op-c op-mini"><div class="op-ch"><div class="op-kt">${ic('sparkle', 18)}<h3>Operasyon</h3></div><button class="btn sm sec" data-a="opgo" data-t="ozet">Aç</button></div>${opTiles()}${tips.length ? `<div class="op-ls" style="margin-top:10px">${tips.slice(0, 3).map(opTip).join('')}</div>` : ''}</section>`;
}
function opEmp() {
  opSeed(); const me = S.user.id; const w = opMin() < 15 * 60 ? 'ac' : 'ka'; const mine = REQS.filter((r) => r.uid === me && r.st === 'bekliyor').length + MAINT.filter((m) => m.uid === me && m.st !== 'bitti').length;
  return `<section class="cb-s op-ce"><div class="op-qr"><button class="btn sec" data-a="nav" data-v="talebim">${ic('send', 16)} Talep gönder${mine ? ' (' + mine + ')' : ''}</button><button class="btn sec" data-a="mtnew">${ic('gear', 16)} Arıza bildir</button></div>${CHKI.some((i) => i.when === w) ? chkCard(w, false) : ''}</section>`;
}
{ const _v86 = viewHTML; viewHTML = function () { const r = S.user && S.user.role;
  if (S.view === 'ops' && ['patron', 'mudur'].includes(r)) return viewOps(); if (S.view === 'talebim' && r === 'calisan') return viewTalebim();
  let h = _v86(); if ((r === 'mudur' && S.view === 'bugun') || (r === 'calisan' && S.view === 'bugun')) { const b = document.createElement('div'); b.innerHTML = h;
    if (r === 'mudur') { const a = b.querySelector('.mg-hi'); if (a) a.insertAdjacentHTML('afterend', opMini()); } else { const a = b.querySelector('.cb-s'); if (a) a.insertAdjacentHTML('beforebegin', opEmp()); } h = b.innerHTML; }
  return h; }; }
NAV.mudur.forEach((n) => { if (n[0] === 'duyuru' && !n[3]) n[3] = 'more'; }); NAV.mudur.splice(2, 0, ['ops', 'Operasyon', 'check']); NAV.patron.push(['ops', 'Operasyon', 'check', 'more']);
NAV.calisan.forEach((n) => { if (n[0] === 'puanim' && !n[3]) n[3] = 'more'; }); NAV.calisan.splice(1, 0, ['talebim', 'Talep', 'send']); TITLES.ops = 'Operasyon'; TITLES.talebim = 'Talep gönder';
/* bildirimler */
{ const _nl6 = notifList; notifList = function () { const out = _nl6(); const u = S.user; if (!u) return out; const add = (key, sev, text, view, tab) => out.push({ key: key + '|' + REF_ISO, sev, text, view, tab });
  if (['patron', 'mudur'].includes(u.role)) { opLate().forEach((l) => add('late' + l.id, 'bad', opN(l.id) + ' ' + opLt(l) + ', giriş yapmadı.', 'ops', 'ozet'));
    const ac = MAINT.filter((m) => m.st === 'acik' && m.pri === 'acil'); if (ac.length) add('mtac' + ac.length, 'bad', ac.length + ' acil arıza bildirimi var.', 'ops', 'ariza'); const nr = MAINT.filter((m) => m.st === 'acik').length; if (nr) add('mt' + nr, 'warn', nr + ' arıza işleme alınmadı.', 'ops', 'ariza');
    const pr = REQS.filter((r) => r.st === 'bekliyor').length; if (pr) add('rq' + pr, 'warn', pr + ' çalışan talebi karar bekliyor.', 'ops', 'talep'); const mp = MPLAN.filter((p) => mpLeft(p) < 0).length; if (mp) add('mp' + mp, 'warn', mp + ' bakım gecikti.', 'ops', 'ariza');
    const k = ksTips().find((t) => t[0] === 'r' || t[1] === 'Kasa kapanışı girilmedi'); if (k) add('ks' + k[1], k[0] === 'r' ? 'bad' : 'warn', k[1] + '.', 'ops', 'kasa'); }
  return out; }; }
{ const _g = go; go = function (v) { const r = _g.apply(this, arguments); return r; }; }
if (!window.__op86) { window.__op86 = setInterval(() => { try { const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return; window.__opL = window.__opL || {}; opLate().forEach((l) => { const k = REF_ISO + l.id; if (window.__opL[k]) return; window.__opL[k] = 1; toast(opN(l.id) + ' ' + opLt(l) + '.', 'warn'); try { pushSend([u.id], 'Geç kalan çalışan', opN(l.id) + ' henüz giriş yapmadı (' + opLt(l) + ').'); } catch (e) {} }); } catch (e) {} }, 60000); }
/* ===== v87: görevler, vardiyam, arıza fotoğrafı, çalışan bildirimleri ===== */
const TASKS = []; P_ARR.push(['TASKS', () => TASKS]); P_SCOPE.TASKS = 'ekip';
{ const _w = wipeData; wipeData = function () { _w.apply(this, arguments); TASKS.length = 0; }; }
const tkOpen = () => TASKS.filter((t) => t.st !== 'bitti');
const tkMine = (uid) => tkOpen().filter((t) => t.uid === uid || t.uid === 'all').sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1);
const tkLate = (t) => t.st !== 'bitti' && t.due && t.due < REF_ISO;
const tkDue = (t) => !t.due ? '' : t.due === REF_ISO ? 'Bugün' : t.due < REF_ISO ? Math.abs(dleft(t.due)) + ' gün gecikti' : isoShort(t.due);
H.tknew = () => { S.modal = { type: 'tknew' }; renderModal(); };
NEWM.tknew = () => sheet('Görev ver', `<div class="field"><label for="tk-t">Ne yapılacak?</label><input id="tk-t" maxlength="90" placeholder="Örn. Vitrin camlarını sil"></div>
  <div class="field"><label for="tk-u">Kime?</label><select id="tk-u"><option value="all">Herkes (ilk yapan kapatır)</option>${EMP_IDS.map((x) => `<option value="${x}">${esc(opN(x))}</option>`).join('')}</select></div>
  <div class="field"><label for="tk-d">Ne zamana kadar?</label><input id="tk-d" type="date" min="${REF_ISO}" value="${REF_ISO}"></div>
  <div class="field"><label>Önem</label>${pfChips('tkpri', ['Normal', 'Önemli'], 'Normal', false)}</div>
  <div class="err" id="tk-e" role="alert"></div><button class="btn block" data-a="tksave">Görevi ver</button>`);
H.tksave = () => {
  const g = (id) => ((document.getElementById(id) || {}).value || '').trim(); const t = g('tk-t'); if (t.length < 3) { document.getElementById('tk-e').textContent = 'Görevi yaz.'; return; }
  const k = { id: 'tk' + (++seq), t, uid: g('tk-u') || 'all', by: S.user.id, due: g('tk-d') || REF_ISO, pri: (pfOn('tkpri')[0] || 'Normal') === 'Önemli' ? 'onemli' : 'normal', st: 'acik', at: nowT() };
  if (k.due < REF_ISO) k.due = REF_ISO; TASKS.unshift(k); if (TASKS.length > 500) TASKS.length = 500; pSched();
  try { pushSend(k.uid === 'all' ? EMP_IDS : [k.uid], 'Yeni görev', t + (k.due === REF_ISO ? ' (bugün)' : ' · ' + isoShort(k.due))); } catch (e) {}
  S.modal = null; render(); toast('Görev verildi.', 'ok');
};
H.tkdone = (el) => { const t = TASKS.find((x) => x.id === el.dataset.id); if (!t) return; if (t.st === 'bitti') { t.st = 'acik'; delete t.doneBy; delete t.doneAt; } else { t.st = 'bitti'; t.doneBy = S.user.id; t.doneAt = REF_ISO + ' ' + opHM(); } pSched(); render(); };
H.tkdel = (el) => { const i = TASKS.findIndex((x) => x.id === el.dataset.id); if (i >= 0) TASKS.splice(i, 1); pSched(); render(); };
function tkRow(t, mgr) {
  const late = tkLate(t); const done = t.st === 'bitti';
  return `<div class="op-ci${done ? ' on' : ''}"><button type="button" class="op-cb" data-a="tkdone" data-id="${t.id}" aria-pressed="${done}"><span class="op-bx">${done ? ic('check', 14) : ''}</span><span class="op-ct"><b>${esc(t.t)}</b><em>${t.pri === 'onemli' ? 'Önemli · ' : ''}${mgr ? esc(t.uid === 'all' ? 'Herkes' : opN(t.uid).split(' ')[0]) + ' · ' : ''}${done ? esc(opN(t.doneBy).split(' ')[0]) + ' yaptı · ' + esc(String(t.doneAt || '').slice(11)) : `<span class="${late ? 'bad' : ''}">${esc(tkDue(t))}</span>`}</em></span></button>${mgr ? `<button class="op-x" data-a="tkdel" data-id="${t.id}" aria-label="Görevi sil">${ic('x', 14)}</button>` : ''}</div>`;
}
function tkView() {
  const open = tkOpen().sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1); const done = TASKS.filter((t) => t.st === 'bitti' && String(t.doneAt || '').slice(0, 10) === REF_ISO); const late = open.filter(tkLate).length;
  const by = {}; open.forEach((t) => { (by[t.uid] = by[t.uid] || []).push(t); });
  return `<div class="op-two"><div class="op-l"><section class="op-c"><div class="op-ch"><div><h3>Açık görevler</h3><span>${open.length} görev${late ? ' · ' + late + ' gecikti' : ''}</span></div><button class="btn sm" data-a="tknew">${ic('plus', 15)} Görev ver</button></div>
  <div class="op-ck">${open.length ? Object.keys(by).map((u) => `<div class="op-gh">${u === 'all' ? 'Herkes' : esc(opN(u))}</div>${by[u].map((t) => tkRow(t, true)).join('')}`).join('') : '<p class="op-em">Açık görev yok. "Görev ver" ile ekibe iş atayabilirsin.</p>'}</div></section></div>
  <div class="op-r"><section class="op-c"><div class="op-ch"><div><h3>Bugün tamamlanan</h3><span>${done.length}</span></div></div><div class="op-ck">${done.length ? done.map((t) => tkRow(t, true)).join('') : '<p class="op-em">Bugün tamamlanan görev yok.</p>'}</div></section></div></div>`;
}
/* Operasyon sekmesine görevleri ekle */
opTab = () => { const t = S.sub.ops; return ['ozet', 'liste', 'gorev', 'ariza', 'kasa', 'talep'].includes(t) ? t : 'ozet'; };
{ const _vo = viewOps; viewOps = function () { if (opTab() !== 'gorev') return _vo(); opSeed(); const n = tkOpen().length; const cur = 'gorev';
  const items = [['ozet', 'Özet'], ['liste', 'Günlük liste'], ['gorev', 'Görevler' + (n ? ' (' + n + ')' : '')], ['ariza', 'Arıza ve bakım' + (mtOpen().length ? ' (' + mtOpen().length + ')' : '')], ['kasa', 'Kasa'], ['talep', 'Talepler' + (REQS.filter((r) => r.st === 'bekliyor').length ? ' (' + REQS.filter((r) => r.st === 'bekliyor').length + ')' : '')]];
  return `<div class="stack-lg op"><div><h2>Operasyon</h2><p class="muted" style="margin-top:4px">${esc(today())} · günlük işleyişi tek yerden takip et</p></div>${seg('ops', items, cur).replace('<div class="seg"', '<div class="seg seg-b"')}${tkView()}</div>`; }; }
{ const _vo2 = viewOps; viewOps = function () { const h = _vo2(); if (opTab() === 'gorev') return h; const n = tkOpen().length; return h.replace(/(<button data-a="sub" data-g="ops" data-v="liste"[^>]*>[^<]*<\/button>)/, `$1<button data-a="sub" data-g="ops" data-v="gorev" aria-pressed="false">Görevler${n ? ' (' + n + ')' : ''}</button>`); }; }
{ const _ot = opTips; opTips = function () { const T = _ot(); const l = tkOpen().filter(tkLate); if (l.length) T.splice(Math.min(T.length, 2), 0, ['a', l.length + ' görev gecikti', l.slice(0, 2).map((t) => (t.uid === 'all' ? 'Herkes' : opN(t.uid).split(' ')[0]) + ': ' + t.t).join('; '), 'opgo', 'gorev', 'Görevlere git']); return T; }; }
/* çalışan: Bugün'e görevler */
{ const _oe = opEmp; opEmp = function () { const mine = tkMine(S.user.id); const dn = TASKS.filter((t) => t.st === 'bitti' && t.doneBy === S.user.id && String(t.doneAt || '').slice(0, 10) === REF_ISO).slice(0, 3);
  const h = mine.length || dn.length ? `<section class="cb-s op-ce"><section class="op-c"><div class="op-ch"><div><h3>Görevlerim</h3><span>${mine.length} açık${mine.some(tkLate) ? ' · gecikmiş var' : ''}</span></div></div><div class="op-ck">${mine.concat(dn).map((t) => tkRow(t, false)).join('')}</div></section></section>` : ''; return h + _oe(); }; }
/* çalışan: Vardiyam */
S.vmO = 0; H.vmo = (el) => { S.vmO = el.dataset.v === '0' ? 0 : (S.vmO || 0) + Number(el.dataset.v); render(); };

{ const _vv = viewHTML; viewHTML = function () { if (S.view === 'vardiyam' && S.user && S.user.role === 'calisan') return viewVardiyam(); return _vv(); }; }
NAV.calisan.forEach((n) => { if (n[0] === 'masraf' && !n[3]) n[3] = 'more'; }); NAV.calisan.splice(2, 0, ['vardiyam', 'Vardiyam', 'clock']); TITLES.vardiyam = 'Vardiyam';
/* takas onayında vardiyaları değiştir + karar tarihi */
{ const _ok = H.rqok; H.rqok = function (el) { const r = REQS.find((x) => x.id === el.dataset.id); let sw = false;
  if (r && r.kind === 'takas' && r.with && r.st === 'bekliyor' && r.date) { const [y, m, d] = r.date.split('-').map(Number); const a = vdState(y, m - 1, d, r.uid), b = vdState(y, m - 1, d, r.with);
    if (a.k === 'shift' && b.k === 'shift' && a.t.id !== b.t.id) { vdSet(r.date, r.uid, b.t.id); vdSet(r.date, r.with, a.t.id); sw = true; } else if (a.k === 'shift' && ['off', 'none'].includes(b.k)) { vdSet(r.date, r.uid, 'off'); vdSet(r.date, r.with, a.t.id); sw = true; } }
  if (r) r.decAt = REF_ISO; _ok.apply(this, arguments); if (sw) { try { pushSend([r.with], 'Vardiyan değişti', isoShort(r.date) + ' tarihli vardiyan ' + opN(r.uid).split(' ')[0] + ' ile değiştirildi.'); } catch (e) {} toast('Vardiyalar karşılıklı değiştirildi.', 'ok'); } }; }
{ const _no = H.rqnook; H.rqnook = function (el) { const r = REQS.find((x) => x.id === el.dataset.id); if (r) r.decAt = REF_ISO; return _no.apply(this, arguments); }; }
/* çalışan bildirimleri */
{ const _nl7 = notifList; notifList = function () { const out = _nl7(); const u = S.user; if (!u || u.role !== 'calisan') return out; const add = (key, sev, text, view, tab) => out.push({ key: key + '|' + REF_ISO, sev, text, view, tab });
  const mine = tkMine(u.id); const lt = mine.filter(tkLate).length; if (lt) add('tkl' + lt, 'bad', lt + ' görevin gecikti.', 'bugun'); else if (mine.length) add('tk' + mine.length, 'info', mine.length + ' açık görevin var.', 'bugun');
  REQS.filter((r) => r.uid === u.id && r.decAt && dleft(r.decAt) >= -3).forEach((r) => add('rqd' + r.id + r.st, r.st === 'onay' ? 'info' : 'warn', RQ_K[r.kind] + ' talebin ' + (r.st === 'onay' ? 'onaylandı' : 'reddedildi') + '.', 'talebim'));
  MAINT.filter((m) => m.uid === u.id && ((m.st === 'bitti' && m.doneAt && dleft(m.doneAt) >= -3) || m.st === 'islemde')).forEach((m) => add('mtd' + m.id + m.st, 'info', m.cat + ' arızan ' + (m.st === 'bitti' ? 'çözüldü' : 'için ilgileniliyor') + '.', 'talebim'));
  return out; }; }
/* arıza fotoğrafı */
function opImg(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onerror = rej; fr.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const M = 720; const k = Math.min(1, M / Math.max(im.width, im.height)); const w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k)); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); let q = 0.62; let u = c.toDataURL('image/jpeg', q); while (u.length > 110000 && q > 0.3) { q -= 0.1; u = c.toDataURL('image/jpeg', q); } res(u); }; im.src = fr.result; }; fr.readAsDataURL(file); }); }
{ const _mn = NEWM.mtnew; NEWM.mtnew = function (m) { return _mn(m).replace('<div class="err" id="mt-e"', `<div class="field"><label>Fotoğraf <span class="small muted">(isteğe bağlı)</span></label><div class="op-ph"><label class="btn sec sm" for="mt-file">${ic('camera', 16)} Fotoğraf ekle</label><input id="mt-file" type="file" accept="image/*" hidden data-ch="mtph"><div class="op-pv" id="mt-pv"${S.mtPhoto ? '' : ' hidden'}>${S.mtPhoto ? `<img src="${S.mtPhoto}" alt="">` : ''}</div></div></div><div class="err" id="mt-e"`); }; }
{ const _h = H.mtnew; H.mtnew = function () { S.mtPhoto = null; return _h.apply(this, arguments); }; }
document.addEventListener('change', (e) => { const el = e.target; if (!el || !el.dataset || el.dataset.ch !== 'mtph') return; const f = el.files && el.files[0]; if (!f) return; if (!/^image\//.test(f.type)) { toast('Bir fotoğraf seç.', 'warn'); return; } opImg(f).then((u) => { S.mtPhoto = u; const pv = document.getElementById('mt-pv'); if (pv) { pv.hidden = false; pv.innerHTML = '<img src="' + u + '" alt="">'; } }).catch(() => toast('Fotoğraf okunamadı.', 'warn')); });
{ const _ms = H.mtsend; H.mtsend = function () { const n0 = MAINT.length; const ph = S.mtPhoto; _ms.apply(this, arguments); if (MAINT.length > n0 && ph) { MAINT[0].photo = ph; S.mtPhoto = null; pSched(); render(); } }; }
H.mtimg = (el) => { S.modal = { type: 'mtimg', id: el.dataset.id }; renderModal(); };
NEWM.mtimg = (m) => { const x = MAINT.find((q) => q.id === m.id); return sheet(x ? x.cat : 'Fotoğraf', x && x.photo ? `<img class="op-big" src="${x.photo}" alt="Arıza fotoğrafı">` : '<p>Fotoğraf yok.</p>'); };
{ const _mc = mtCard; mtCard = function (m, mgr) { const h = _mc(m, mgr); return m.photo ? h.replace('<div class="op-mm">', `<button type="button" class="op-th" data-a="mtimg" data-id="${m.id}" aria-label="Fotoğrafı büyüt"><img src="${m.photo}" alt=""></button><div class="op-mm">`) : h; }; }
{ const _os = opSeed; opSeed = function () { _os(); let c = 0; MAINT.forEach((m) => { if (!m.photo) return; if (m.st === 'bitti' && m.doneAt && dleft(m.doneAt) < -30) delete m.photo; else if (++c > 40) delete m.photo; }); }; }
