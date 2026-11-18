// kais-send testleri (Node 22.6+):  node --experimental-strip-types supabase/test_send.mjs
// Sahte Resend ve sahte veritabanı kullanır; gerçek e-posta gitmez.
const store = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv-key-test', RESEND_API_KEY: 're_test', RESEND_FROM: 'Kais <bilgi@kaispilot.com>', MAIL_DAY: '5', APP_URL: 'https://www.kaispilot.com' };
globalThis.Deno = { env: { get: (k) => store[k] } };
const M = await import('./functions/kais-send/index.ts');
let bad = 0;
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log('FAIL', m, JSON.stringify(a), '!=', JSON.stringify(b)); } else console.log('ok', m); };
const ok = (c, m) => eq(!!c, true, m);

// ---- saf yardımcılar ----
eq(M.validEmail('a@b.com'), true, 'geçerli adres'); eq(M.validEmail('a b@c.com'), false, 'boşluklu adres'); eq(M.validEmail('a@b'), false, 'noktasız alan'); eq(M.validEmail('a@b.com,c@d.com'), false, 'iki adres');
eq(M.escH('<b>"x"&\'</b>'), '&lt;b&gt;&quot;x&quot;&amp;&#39;&lt;/b&gt;', 'html kaçışı');
eq(M.safeName('Çınar "Kafe" <x@y.com>\r\nBcc: z'), 'Çınar Kafe x y.com Bcc  z'.replace('  ', ' '), 'gönderen adı temizliği') ;
eq(M.fromWithName('Kais <bilgi@kaispilot.com>', 'Çınar Kafe'), 'Çınar Kafe <bilgi@kaispilot.com>', 'gönderen adı işletme adı olur');
eq(M.fromWithName('bilgi@kaispilot.com', ''), 'bilgi@kaispilot.com', 'ad yoksa yalnız adres');
eq(M.personalize('Merhaba {ad}, hoş geldin', 'Selin Aydın'), 'Merhaba Selin, hoş geldin', '{ad} yerine ilk ad');
eq(M.personalize('Merhaba {ad}', ''), 'Merhaba Müşterimiz', 'ad yoksa varsayılan');
const rm = M.buildRemind('Çınar Kafe', 'Mavi Ofis', 3200, 'Merhaba {ad}\n<script>alert(1)</script>');
ok(!rm.html.includes('<script>') && rm.html.includes('&lt;script&gt;'), 'hatırlatmada kullanıcı metni kaçışlı');
ok(rm.subject.includes('Çınar Kafe'), 'hatırlatma konusunda işletme adı');
const cm = M.buildCampaign('Çınar Kafe', 'Selin Aydın', 'İndirim\nBcc: x', 'Merhaba {ad}', 'https://www.kaispilot.com/cikis/?u=abc');
ok(!cm.subject.includes('\n'), 'konuda satır sonu yok'); ok(cm.html.includes('listeden çıkabilirsiniz') && cm.html.includes('/cikis/?u=abc'), 'kampanyada çıkış bağlantısı var'); ok(cm.text.includes('Listeden çıkmak için'), 'düz metinde de çıkış bağlantısı');

// ---- çıkış imzası ----
const tok = await M.signUnsub('biz-1', 'Selin@Ornek.com', 'sir');
eq(await M.verifyUnsub(tok, 'sir'), { b: 'biz-1', e: 'selin@ornek.com' }, 'çıkış imzası doğrulandı (küçük harf)');
eq(await M.verifyUnsub(tok, 'baska'), null, 'yanlış anahtar'); eq(await M.verifyUnsub(tok.slice(0, -3) + 'AAA', 'sir'), null, 'bozuk imza'); eq(await M.verifyUnsub('x', 'sir'), null, 'çöp');

// ---- sahte veritabanı ----
const BID = '11111111-1111-1111-1111-111111111111';
const db = {
  businesses: [{ id: BID, owner_id: 'u-owner', name: 'Çınar Kafe' }], members: [{ business_id: BID, user_id: 'u-mud', role: 'mudur' }, { business_id: BID, user_id: 'u-cal', role: 'calisan' }],
  users: { 'tok-owner': { id: 'u-owner', email: 'patron@cinar.com' }, 'tok-mud': { id: 'u-mud', email: '' }, 'tok-cal': { id: 'u-cal', email: 'c@c.com' } },
  app_state: [{ business_id: BID, scope: 'stok', state: JSON.stringify({
    RECV: [{ id: 'a1', name: 'Mavi Ofis', email: 'info@mavi.com', amt: 3200, days: 5 }, { id: 'a2', name: 'Eksik', email: '', amt: 10 }, { id: 'a3', name: 'Ödenmiş', email: 'p@p.com', amt: 5, paid: true }],
    CUSTOMERS: [{ id: 'k1', name: 'Selin Aydın', email: 'selin@x.com', iys: 'onayli' }, { id: 'k2', name: 'Can', email: 'can@x.com', iys: 'onayli' }, { id: 'k3', name: 'Murat', email: 'murat@x.com', iys: 'yok' }, { id: 'k4', name: 'Oğuz', email: 'oguz@x.com', iys: 'onayli' }, { id: 'k5', name: 'Bozuk', email: 'bozuk', iys: 'onayli' }, { id: 'k6', name: 'Selin2', email: 'SELIN@x.com', iys: 'onayli' }, { id: 'k7', name: 'Ece', email: 'ece@x.com', iys: 'onayli' }, { id: 'k8', name: 'Tolga', email: 'tolga@x.com', iys: 'onayli' }],
  }) }],
  mail_sends: [], mail_optout: [{ business_id: BID, email: 'oguz@x.com' }],
};
const q = (table) => {
  const f = []; let cnt = false, head = false, sel = null;
  const api = {
    select(c, o) { sel = c; if (o && o.count) cnt = true; if (o && o.head) head = true; return api; },
    eq(k, v) { f.push((r) => r[k] === v); return api; }, in(k, vs) { f.push((r) => vs.includes(r[k])); return api; }, gte(k, v) { f.push((r) => r[k] >= v); return api; }, limit() { return api; },
    maybeSingle() { const rows = db[table].filter((r) => f.every((g) => g(r))); return Promise.resolve({ data: rows[0] || null, error: null }); },
    then(res) { const rows = db[table].filter((r) => f.every((g) => g(r))); res({ data: head ? null : rows, count: cnt ? rows.length : null, error: null }); },
    insert(row) { if (table === 'mail_sends' && db.mail_sends.some((r) => r.business_id === row.business_id && r.key === row.key)) return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } }); db[table].push({ created_at: new Date().toISOString(), ...row }); return Promise.resolve({ error: null }); },
    upsert(row) { if (!db[table].some((r) => r.business_id === row.business_id && r.email === row.email)) db[table].push(row); return Promise.resolve({ error: null }); },
    delete() { const d = { eq(k, v) { f.push((r) => r[k] === v); return d; }, then(res) { db[table] = db[table].filter((r) => !f.every((g) => g(r))); res({ error: null }); } }; return d; },
  };
  return api;
};
const srv = { auth: { getUser: async (t) => (db.users[t] ? { data: { user: db.users[t] } } : { data: { user: null } }) }, from: q };
const sentMails = []; let failNext = 0;
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('https://api.resend.com/emails')) {
    if (failNext > 0) { failNext--; return { ok: false, status: 422, text: async () => 'bad' }; }
    sentMails.push(JSON.parse(init.body)); return { ok: true, status: 200, text: async () => '{}' };
  }
  throw new Error('beklenmeyen istek ' + url);
};
const call = (body, tok = 'tok-owner', qs = '') => M.handle(new Request('https://x.supabase.co/functions/v1/kais-send' + qs, { method: 'POST', headers: tok ? { Authorization: 'Bearer ' + tok } : {}, body: JSON.stringify(body) }), srv);
const rd = async (r) => ({ s: r.status, j: await r.json() });

// ---- yetki ----
eq((await rd(await call({ action: 'status', business_id: BID }, null))).s, 401, 'giriş yoksa 401');
eq((await rd(await call({ action: 'status', business_id: BID }, 'tok-cal'))).s, 403, 'çalışan gönderemez');
eq((await rd(await call({ action: 'status', business_id: BID }, 'tok-mud'))).j.configured, true, 'müdür durumu görür');
let r = await rd(await call({ action: 'status', business_id: BID })); eq([r.j.dayLimit, r.j.dayLeft], [5, 5], 'günlük sınır');

// ---- hatırlatma ----
r = await rd(await call({ action: 'remind', business_id: BID, rid: 'a1', text: 'Merhaba {ad}, 3.200 TL ödemeniz bekliyor.' }));
eq([r.s, r.j.sent], [200, 1], 'hatırlatma gitti');
eq([sentMails[0].to, sentMails[0].from, sentMails[0].reply_to], [['info@mavi.com'], 'Çınar Kafe <bilgi@kaispilot.com>', 'patron@cinar.com'], 'alıcı kayıttan, gönderen işletme adı, yanıt adresi patron');
ok(sentMails[0].text.includes('Merhaba Mavi'), 'ad kişiselleştirildi');
eq((await rd(await call({ action: 'remind', business_id: BID, rid: 'a1', text: 'tekrar tekrar' }))).s, 409, 'aynı gün ikinci hatırlatma engellenir');
eq(sentMails.length, 1, 'çift gönderim olmadı');
eq((await rd(await call({ action: 'remind', business_id: BID, rid: 'a2', text: 'merhaba sana' }))).s, 422, 'adres yoksa gönderilmez');
eq((await rd(await call({ action: 'remind', business_id: BID, rid: 'a3', text: 'merhaba sana' }))).s, 409, 'ödenmiş alacağa gönderilmez');
eq((await rd(await call({ action: 'remind', business_id: BID, rid: 'yok', text: 'merhaba sana' }))).s, 404, 'kayıtsız alacak');
eq((await rd(await call({ action: 'remind', business_id: BID, rid: 'a1', to: 'baska@x.com', text: 'x' }, 'tok-cal'))).s, 403, 'çalışan hatırlatamaz');
failNext = 1; db.app_state[0].state = db.app_state[0].state.replace('"id":"a2","name":"Eksik","email":""', '"id":"a2","name":"Eksik","email":"e@e.com"');
r = await rd(await call({ action: 'remind', business_id: BID, rid: 'a2', text: 'merhaba sana' })); eq(r.s, 502, 'Resend hatası -> 502');
r = await rd(await call({ action: 'remind', business_id: BID, rid: 'a2', text: 'merhaba sana' })); eq([r.s, r.j.sent], [200, 1], 'hata sonrası tekrar denenebilir (kayıt geri alındı)');

// ---- kampanya ----
sentMails.length = 0; db.mail_sends.length = 0;
r = await rd(await call({ action: 'campaign', business_id: BID, cid: 'c1', subject: 'Hafta sonu %15', text: 'Merhaba {ad}!', ids: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'zzz'] }));
eq([r.s, r.j.sent, r.j.failed], [200, 2, 0], 'yalnız izinli, çıkmamış, tekil adrese gitti');
eq(r.j.skipped, { izinYok: 1, listedenCikti: 1, adresHatali: 1, bulunamadi: 1, tekrar: 1 }, 'atlananlar doğru sayıldı');
eq(r.j.optIds, ['k4'], 'listeden çıkan müşteri kimliği döner');
eq(sentMails.map((m) => m.to[0]).sort(), ['can@x.com', 'selin@x.com'], 'alıcılar');
ok(sentMails.every((m) => m.headers['List-Unsubscribe'].startsWith('<https://x.supabase.co/functions/v1/kais-send?u=') && m.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click'), 'tek tık çıkış başlığı');
ok(sentMails.every((m) => m.html.includes('/cikis/?u=')), 'gövdede çıkış bağlantısı');
r = await rd(await call({ action: 'campaign', business_id: BID, cid: 'c1', subject: 'Hafta sonu %15', text: 'Merhaba {ad}!', ids: ['k1', 'k2'] }));
eq([r.j.sent, r.j.dup], [0, 2], 'aynı kampanya ikinci kez gitmez');
// günlük sınır: 5, bugün 2 + 1 hatırlatma yok (silindi) -> 3 kalan
r = await rd(await call({ action: 'campaign', business_id: BID, cid: 'c2', subject: 'Yeni', text: 'Merhaba herkese', ids: ['k1', 'k2', 'k7', 'k8'] }));
eq([r.j.sent, r.j.limited], [3, true], 'günlük sınır uygulanır');
eq((await rd(await call({ action: 'campaign', business_id: BID, cid: 'c3', subject: '', text: 'x', ids: ['k1'] }))).s, 422, 'konu boşsa gönderilmez');
eq((await rd(await call({ action: 'campaign', business_id: BID, cid: 'c3', subject: 's', text: 'merhaba', ids: ['k1'] }, 'tok-cal'))).s, 403, 'çalışan kampanya gönderemez');
// istemci izin vermiş gibi davransa da sunucu kayıttan bakar
r = await rd(await call({ action: 'campaign', business_id: BID, cid: 'c4', subject: 's', text: 'merhaba', ids: ['k3'], consent: true, emails: ['kurban@x.com'] }));
eq(r.j.sent, 0, 'izinsiz müşteriye gitmez, istemcideki adres yok sayılır');

// ---- çıkış ----
const t2 = await M.signUnsub(BID, 'selin@x.com', store.SUPABASE_SERVICE_ROLE_KEY);
r = await rd(await M.handle(new Request('https://x.supabase.co/functions/v1/kais-send?u=' + encodeURIComponent(t2), { method: 'POST', body: 'List-Unsubscribe=One-Click', headers: { 'content-type': 'application/x-www-form-urlencoded' } }), srv));
eq([r.s, r.j.ok], [200, true], 'tek tık çıkış çalışır (oturumsuz)');
ok(db.mail_optout.some((x) => x.email === 'selin@x.com'), 'çıkış kaydedildi');
eq((await rd(await M.handle(new Request('https://x.supabase.co/functions/v1/kais-send?u=bozuk', { method: 'POST' }), srv))).s, 400, 'bozuk çıkış bağlantısı reddedilir');
r = await rd(await call({ action: 'optouts', business_id: BID })); eq(r.j.emails.sort(), ['oguz@x.com', 'selin@x.com'], 'çıkanlar listelenir');
sentMails.length = 0; db.mail_sends.length = 0;
r = await rd(await call({ action: 'campaign', business_id: BID, cid: 'c5', subject: 's', text: 'merhaba', ids: ['k1', 'k2'] })); eq([r.j.sent, r.j.skipped.listedenCikti], [1, 1], 'çıkan kişiye bir daha gitmez');

// ---- kurulum yok ----
store.RESEND_API_KEY = '';
eq((await rd(await call({ action: 'remind', business_id: BID, rid: 'a1', text: 'merhaba' }))).s, 503, 'Resend yoksa 503');
eq((await rd(await M.handle(new Request('https://x.supabase.co/functions/v1/kais-send'), srv))).j.configured, false, 'GET kurulum durumunu söyler');

console.log(bad ? 'BASARISIZ: ' + bad : 'HEPSI GECTI'); process.exit(bad ? 1 : 0);
