// kais-mail testleri (Node 22.6+):  node --experimental-strip-types supabase/test_mail.mjs
// Sahte Google/Gmail/Anthropic sunucusu ve sahte veritabanı kullanır; gerçek hesaba dokunmaz.
const store = { SUPABASE_URL: 'https://x.supabase.co', GMAIL_CLIENT_ID: 'cid', GMAIL_CLIENT_SECRET: 'sec', MAIL_SECRET_KEY: 'test-key-123', ANTHROPIC_API_KEY: 'ak', APP_URL: 'https://www.kaispilot.com' };
globalThis.Deno = { env: { get: (k) => store[k] } };
const M = await import('./functions/kais-mail/index.ts');
let bad = 0;
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('FAIL', m, JSON.stringify(a), '!=', JSON.stringify(b)); } else console.log('ok', m); };
const ok = (c, m) => eq(!!c, true, m);

// ---- tutar okuma: belirsizse tahmin etme ----
eq(M.cleanAmount('1.234,56'), 1234.56, 'TR biçimi');
eq(M.cleanAmount('1,234.56'), 1234.56, 'EN biçimi');
eq(M.cleanAmount('12,5'), 12.5, 'virgüllü ondalık');
eq(M.cleanAmount('1.234'), null, 'belirsiz 1.234 -> null');
eq(M.cleanAmount('1,234'), null, 'belirsiz 1,234 -> null');
eq(M.cleanAmount('abc'), null, 'sayı değil');
eq(M.cleanAmount(0), null, 'sıfır');
eq(M.cleanAmount(-5), null, 'negatif');
eq(M.cleanAmount(99.999), 100, 'yuvarlama');
eq(M.cleanAmount(null), null, 'null');
eq(M.cleanAmount(1e9), null, 'aşırı büyük');
eq(M.normCurrency('tl'), 'TRY', 'TL -> TRY'); eq(M.normCurrency('R'), 'ZAR', 'R -> ZAR'); eq(M.normCurrency('xx'), null, 'geçersiz para birimi');

// ---- UBL (e-Fatura) ----
const ubl = (pct, extra = '') => `<?xml version="1.0"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
<cbc:UBLVersionID>2.1</cbc:UBLVersionID><cbc:ProfileID>TICARIFATURA</cbc:ProfileID><cbc:ID>ABC2026000001234</cbc:ID><cbc:IssueDate>2026-10-07</cbc:IssueDate><cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
<cac:Signature><cbc:ID>imza</cbc:ID></cac:Signature>
<cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ÖRNEK TOPTAN A.Ş.</cbc:Name></cac:PartyName></cac:Party></cac:AccountingSupplierParty>
<cac:TaxTotal><cbc:TaxAmount currencyID="TRY">200.00</cbc:TaxAmount>${pct}</cac:TaxTotal>
<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="TRY">1000.00</cbc:LineExtensionAmount><cbc:TaxInclusiveAmount currencyID="TRY">1200.00</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="TRY">1200.00</cbc:PayableAmount></cac:LegalMonetaryTotal>
<cac:InvoiceLine><cbc:ID>1</cbc:ID><cac:TaxTotal><cac:TaxSubtotal><cbc:TaxableAmount>5</cbc:TaxableAmount><cbc:Percent>1</cbc:Percent><cac:TaxCategory><cac:TaxScheme><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal></cac:InvoiceLine>${extra}</Invoice>`;
const sub = (base, pct) => `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="TRY">${base}</cbc:TaxableAmount><cbc:TaxAmount currencyID="TRY">0</cbc:TaxAmount><cbc:Percent>${pct}</cbc:Percent><cac:TaxCategory><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal>`;
let u = M.parseUbl(ubl(sub('1000.00', 20)));
eq([u.seller, u.invoice_no, u.invoice_date, u.total, u.currency, u.tax_rate, u.confidence], ['ÖRNEK TOPTAN A.Ş.', 'ABC2026000001234', '2026-10-07', 1200, 'TRY', 20, 'yuksek'], 'UBL tek oran');
u = M.parseUbl(ubl(sub('600.00', 10) + sub('400.00', 20)));
eq([u.tax_rate, u.confidence], [10, 'orta'], 'UBL karışık oran: en büyük matrah, güven orta');
u = M.parseUbl(ubl(''));
eq([u.tax_rate, u.total], [null, 1200], 'UBL KDV satırı yok -> oran null (uydurma yok)');
eq(M.parseUbl('<html>fatura</html>'), null, 'XML fatura değil');
eq(M.parseUbl(ubl(sub('1', 20)).replace(/<cbc:PayableAmount[^>]*>[^<]*<\/cbc:PayableAmount>/, '').replace(/<cbc:TaxInclusiveAmount[^>]*>[^<]*<\/cbc:TaxInclusiveAmount>/, '')).total, null, 'UBL tutar yoksa null');

// ---- yapay zekâ çıktısı doğrulama ----
eq(M.normalizeAi({ belge_mi: false, toplam: 10 }), null, 'belge değil -> null');
eq(M.normalizeAi(null), null, 'boş çıktı');
let n = M.normalizeAi({ belge_mi: true, satici: ' Turkcell ', toplam: '1.234,56', para_birimi: 'TL', kdv_orani: 20, kategori: 'Telefon / internet', tarih: '2026-10-07', guven: 'yuksek' });
eq([n.seller, n.total, n.currency, n.tax_rate, n.category, n.invoice_date, n.confidence], ['Turkcell', 1234.56, 'TRY', 20, 'Telefon / internet', '2026-10-07', 'yuksek'], 'AI alanları');
n = M.normalizeAi({ belge_mi: true, toplam: null, kdv_orani: null, kategori: 'Uydurma', tarih: '2026-13-40', guven: 'yuksek' });
eq([n.total, n.tax_rate, n.category, n.invoice_date, n.confidence], [null, null, null, null, 'dusuk'], 'AI: tutar yok -> güven düşük, uydurma kategori/tarih reddedilir');

// ---- durum imzası ve şifreleme ----
const S = store.MAIL_SECRET_KEY;
const st = await M.signState({ b: 'biz', u: 'usr', e: Date.now() + 60000 }, S);
eq((await M.verifyState(st, S))?.b, 'biz', 'durum doğrulandı');
eq(await M.verifyState(st.slice(0, -2) + 'xx', S), null, 'imza bozuk');
eq(await M.verifyState(st, 'baska-anahtar'), null, 'yanlış anahtar');
eq(await M.verifyState(await M.signState({ b: 'x', e: Date.now() - 1 }, S), S), null, 'süresi dolmuş durum');
eq(await M.verifyState('abc', S), null, 'çöp durum');
const enc = await M.encryptToken('1//refresh-token', S);
ok(!enc.includes('refresh'), 'şifreli metinde düz anahtar yok');
eq(await M.decryptToken(enc, S), '1//refresh-token', 'şifre çözme');
let thr = false; try { await M.decryptToken(enc, 'yanlis'); } catch { thr = true; } ok(thr, 'yanlış anahtarla çözülemez');
ok((await M.encryptToken('x', S)) !== (await M.encryptToken('x', S)), 'her şifreleme farklı (rastgele iv)');

// ---- ayrıştırma yardımcıları ----
eq(M.parseFrom('"Turkcell Fatura" <fatura@turkcell.com.tr>'), { name: 'Turkcell Fatura', addr: 'fatura@turkcell.com.tr' }, 'gönderen adı');
eq(M.parseFrom('a@b.com'), { name: null, addr: 'a@b.com' }, 'çıplak adres');
eq(M.attKind({ filename: 'Fatura.PDF', mime: 'application/octet-stream' }), 'pdf', 'pdf uzantısı');
eq(M.attKind({ filename: 'x.xml', mime: 'text/xml' }), 'xml', 'xml');
eq(M.attKind({ filename: 'x.zip', mime: 'application/zip' }), null, 'zip desteklenmez');
eq(M.stripHtml('<p>Merhaba&nbsp;<b>dünya</b></p><script>x()</script>'), 'Merhaba dünya', 'html temizleme');

// ---- tarama: sahte Gmail + sahte veritabanı ----
const b64 = (s) => Buffer.from(s).toString('base64url');
const msgs = {
  m1: { internalDate: '1760000000000', payload: { headers: [{ name: 'From', value: '"Toptan" <f@toptan.com>' }, { name: 'Subject', value: 'Fatura ABC' }], mimeType: 'multipart/mixed', parts: [{ mimeType: 'text/plain', body: { data: b64('Faturanız ektedir.') } }, { filename: 'fatura.xml', mimeType: 'text/xml', body: { size: 2000, data: b64(ubl(sub('1000.00', 20))) } }] } },
  m2: { internalDate: '1760000100000', payload: { headers: [{ name: 'From', value: 'Petrol <e@petrol.com>' }, { name: 'Subject', value: 'E-arşiv faturanız' }], mimeType: 'multipart/mixed', parts: [{ filename: 'fatura.pdf', mimeType: 'application/pdf', body: { size: 5000, attachmentId: 'att1' } }] } },
  m3: { internalDate: '1760000200000', payload: { headers: [{ name: 'From', value: 'x@y.com' }, { name: 'Subject', value: 'Fatura hatırlatma' }], mimeType: 'text/plain', body: { data: b64('Selam') } } },
  m4: { internalDate: '1760000300000', payload: { headers: [{ name: 'From', value: 'Reklam <r@y.com>' }, { name: 'Subject', value: 'Fatura kampanyası' }], mimeType: 'text/plain', body: { data: b64('Yüzde 50 indirim fırsatını kaçırma, hemen tıkla ve alışverişe başla. Bu mesaj reklamdır.') } } },
};
let aiCalls = 0; const aiAnswers = [{ belge_mi: true, satici: 'Petrol Ofisi', toplam: 1280, para_birimi: 'TRY', kdv_orani: 20, kategori: 'Akaryakıt', tarih: '2026-10-10', guven: 'yuksek' }, { belge_mi: false }];
globalThis.fetch = async (url, init) => {
  url = String(url); const R = (o, s = 200) => ({ ok: s < 400, status: s, json: async () => o });
  if (url.startsWith('https://oauth2.googleapis.com/token')) return R({ access_token: 'AT' });
  if (url.includes('/messages?')) return R({ messages: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }, { id: 'm4' }] });
  let m = /\/messages\/(\w+)\/attachments\/(\w+)/.exec(url); if (m) return R({ data: b64('%PDF-1.4 sahte') });
  m = /\/messages\/(\w+)\?format=full/.exec(url); if (m) return R(msgs[m[1]]);
  if (url.startsWith('https://api.anthropic.com')) {
    const body = JSON.parse(init.body); const a = aiAnswers[aiCalls++];
    ok(JSON.stringify(body.system).includes('Asla tahmin etme'), 'AI istemi tahmin yasağı içeriyor');
    return R({ content: [{ type: 'text', text: '```json\n' + JSON.stringify(a) + '\n```' }] });
  }
  return R({}, 404);
};
const docs = []; const conns = [];
const mk = (table) => {
  const q = { table, f: [], op: 'select', opts: null, row: null };
  const api = {
    select: (c, o) => { q.opts = o; return api; }, eq: (k, v) => { q.f.push((r) => r[k] === v); return api; }, neq: () => api, gte: () => api,
    in: (k, vs) => { q.f.push((r) => vs.includes(r[k])); return api; },
    update: (o) => { q.op = 'update'; q.row = o; return api; }, upsert: (o, opt) => { q.op = 'upsert'; q.row = o; q.opt = opt; return api; },
    maybeSingle: async () => ({ data: table === 'mail_secrets' ? { refresh_token_enc: await M.encryptToken('REFRESH', S) } : null }),
    then: (res) => {
      let out;
      if (q.table === 'mail_docs' && q.op === 'select') { const rows = docs.filter((r) => q.f.every((f) => f(r))); out = q.opts?.head ? { count: rows.length, data: null } : { data: rows.map((r) => ({ msg_id: r.msg_id })) }; }
      else if (q.table === 'mail_docs' && q.op === 'upsert') { if (!docs.some((d) => d.connection_id === q.row.connection_id && d.msg_id === q.row.msg_id)) docs.push({ ...q.row, created_at: new Date().toISOString() }); out = { error: null }; }
      else if (q.table === 'mail_connections' && q.op === 'update') { conns.push(q.row); out = { error: null }; }
      else out = { data: null, error: null };
      return Promise.resolve(out).then(res);
    },
  };
  return api;
};
const srv = { from: mk };
const conn = { id: 'c1', business_id: 'b1', email: 'a@gmail.com' };
let r = await M.scanConnection(srv, conn, Date.now());
eq([r.processed, r.remaining, r.limited, r.listed], [4, 0, false, 4], 'tarama: 4 e-posta işlendi');
const by = (id) => docs.find((d) => d.msg_id === id);
eq([by('m1').kind, by('m1').total, by('m1').tax_rate, by('m1').seller, by('m1').confidence], ['xml', 1200, 20, 'ÖRNEK TOPTAN A.Ş.', 'yuksek'], 'XML belge yapay zekâsız okundu');
eq([by('m2').kind, by('m2').total, by('m2').seller, by('m2').category, by('m2').from_addr], ['pdf', 1280, 'Petrol Ofisi', 'Akaryakıt', 'e@petrol.com'], 'PDF belge yapay zekâ ile okundu');
eq([by('m3').kind, by('m3').total ?? null], ['none', null], 'kısa metin: belge değil, yapay zekâ çağrılmadı');
eq([by('m4').kind, by('m4').total ?? null], ['none', null], 'reklam: yapay zekâ belge değil dedi');
eq(aiCalls, 2, 'yapay zekâ yalnızca PDF ve reklam için çağrıldı (XML ve kısa metin için değil)');
ok(!JSON.stringify(docs).includes('%PDF') && !JSON.stringify(docs).includes('Faturanız ektedir'), 'e-posta içeriği ve ek veritabanına yazılmadı');
eq(conns.at(-1).status, 'active', 'bağlantı durumu active');
r = await M.scanConnection(srv, conn, Date.now());
eq([r.processed, r.remaining], [0, 0], 'ikinci tarama: yeni e-posta yok, tekrar işlenmedi');
eq(docs.length, 4, 'mükerrer kayıt yok');

// ---- günlük yapay zekâ sınırı ----
store.MAIL_AI_DAY = '1'; docs.length = 0; aiCalls = 0; aiAnswers.length = 0; aiAnswers.push({ belge_mi: true, satici: 'A', toplam: 5, para_birimi: 'TRY', guven: 'yuksek' }, { belge_mi: false });
r = await M.scanConnection(srv, conn, Date.now());
eq(r.limited, true, 'sınır dolunca limited=true');
ok(docs.length >= 2 && docs.length < 4, 'sınırdan sonra yapay zekâ gerektirenler kaydedilmedi (yarın yeniden denenir)');

// ---- ağ yoğunluğu ----
globalThis.fetch = async (url) => { const rl = String(url).includes('/messages?'); return { ok: !rl, status: rl ? 429 : 200, json: async () => ({ access_token: 'AT' }) }; };
const t0 = await M.scanConnection(srv, conn, Date.now());
ok(String(t0.error).includes('yoğun'), 'Gmail 429 -> kullanıcıya yoğunluk mesajı');

console.log(bad ? `\n${bad} BAŞARISIZ` : '\nHEPSI GECTI');
process.exit(bad ? 1 : 0);
