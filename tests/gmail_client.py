"""Gmail baglantisi (istemci): bagli degil, baglanma, belge listesi, ekleme, tarama, kaldirma, hata durumlari.
Sahte Supabase istemcisi kullanir; gercek Google/Gmail'e dokunmaz. Sunucu tarafi icin: node --experimental-strip-types supabase/test_mail.mjs"""
import os, sys, json
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)

FAKE = """()=>{
  window.__calls=[]; window.__scan=[]; window.__tbl={conn:[],docs:[],err:null}; window.__inv={};
  const chain=(table)=>{const q={t:table};const api={select:()=>api,eq:()=>api,order:()=>api,limit:()=>api,
    then:(res,rej)=>{const T=window.__tbl; if(T.err) return Promise.resolve({data:null,error:T.err}).then(res,rej);
      return Promise.resolve({data:table==='mail_connections'?T.conn:T.docs,error:null}).then(res,rej);}};return api;};
  const fake={from:chain,auth:{getSession:async()=>({data:{session:null}})},
    functions:{invoke:async(name,opt)=>{const a=opt.body.action;window.__calls.push({name,body:opt.body});
      if(a==='scan'){const r=window.__scan.shift(); return r&&r.fail?{data:null,error:{message:'x',context:{json:async()=>({error:r.fail})}}}:{data:r||{ok:true,processed:0,remaining:0,done:true},error:null};}
      if(a==='start') return {data:{url:'https://accounts.google.com/o/oauth2/v2/auth?x=1'},error:null};
      return {data:window.__inv[a]||{ok:true},error:null};}}};
  SBS.c=fake; SBS.user={id:'u-1',email:'p@x.com'}; SBS.biz={id:'11111111-1111-1111-1111-111111111111',name:'Biz'};
  MAILX.loaded=false; MAILX.at=0; MAILX.busy=false; MAILX.conn=null; MAILX.err=''; MAILX.setup=false; MAILX.confirm=false;
}"""
CONN = {'id': 'c1', 'email': 'isyeri@gmail.com', 'provider': 'gmail', 'status': 'active', 'last_error': None, 'last_scan_at': '2026-11-18T10:00:00Z', 'created_at': '2026-11-18T09:00:00Z'}
def doc(i, **k):
    d = {'id': 'd%d' % i, 'from_name': 'G%d' % i, 'from_addr': 'g%d@x.com' % i, 'subject': 'Fatura %d' % i, 'received_at': '2026-11-10T10:00:00Z', 'kind': 'xml', 'seller': 'Satici %d' % i,
         'invoice_no': 'N%d' % i, 'invoice_date': '2026-11-10', 'total': 100.0 * i, 'currency': 'TRY', 'tax_rate': 20, 'category': 'Hammadde', 'confidence': 'yuksek', 'status': 'yeni'}
    d.update(k); return d
DOCS = [doc(1, total=1200), doc(2, kind='pdf', total=1280, seller='Petrol Ofisi', category='Akaryakıt'), doc(3, kind='pdf', total=None, tax_rate=None, confidence='dusuk', seller='Belirsiz'),
        doc(4, currency='USD', total=50), doc(5, confidence='dusuk', total=75, tax_rate=None), doc(6, kind='none', total=None, seller=None), doc(7, kind='none', total=None, seller=None)]

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 768}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render()}")
    pg.evaluate(FAKE)
    txt = lambda: pg.evaluate("()=>document.body.innerText")
    tab = lambda: (pg.evaluate("()=>{H.nav({dataset:{v:'muhasebe',s:'eposta'}})}"), pg.wait_for_timeout(500))
    toast = lambda: pg.evaluate("()=>Array.from(document.querySelectorAll('.toast')).map(e=>e.textContent).join(' | ')")

    # 1) bagli degil: sahte veri yok, dogru metin
    tab(); pg.wait_for_timeout(600)
    t = txt()
    check("Bagli degilken 'Gmail'ini bagla' gorunur", "Gmail'ini bağla" in t, t[:200])
    check('Sahte "48 e-posta tarandi" yok', '48 e-posta' not in t)
    check('Bagla dugmesi var', pg.locator('[data-a=mailconnect]').count() == 1)
    check('S.mail.on false', pg.evaluate("()=>S.mail.on") is False)

    # 2) baglanma penceresi ve Google'a yonlendirme
    pg.click('[data-a=mailconnect]'); pg.wait_for_timeout(300)
    t = txt()
    check('Acik rıza metni: yalnizca okuma', 'Yalnızca okuma izni' in t)
    check('Acik rıza: yapay zeka (Anthropic) bildirimi', 'Anthropic' in t)
    check('Acik rıza: Google API Kullanici Verisi Politikasi', 'Kullanıcı Verisi Politikası' in t)
    pg.route('https://accounts.google.com/**', lambda r: r.fulfill(status=200, body='google', content_type='text/html'))
    with pg.expect_navigation(timeout=8000):
        pg.click('[data-a=gmailgo]')
    check('Google izin sayfasina yonlendi', pg.url.startswith('https://accounts.google.com/'), pg.url)
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render()}"); pg.evaluate(FAKE)

    # 3) bagli: belgeler listelenir
    pg.evaluate("(a)=>{__tbl.conn=[a[0]];__tbl.docs=a[1]}", [CONN, DOCS]); tab(); pg.wait_for_timeout(900)
    t = txt()
    check('Bagli adres gorunur', 'isyeri@gmail.com' in t)
    check('Sayilar gercek: 7 incelendi, 5 belge', '7 e-posta incelendi, 5 belge bulundu' in t, t[:600])
    check('Belge degil kayitlari listelenmez', 'G6' not in t and 'Bilinmeyen gönderen' not in t)
    check('Tutar okunamadi etiketi', 'Tutar okunamadı' in t)
    check('Dusuk guven uyarisi', 'güveni düşük' in t)
    check('KDV okunamadi uyarisi', 'KDV oranı belgede okunamadı' in t)
    check('Farkli para birimi uyarisi ve Ekle yok', 'Para birimi USD' in t and pg.locator('[data-a=mailadd][data-id=d4]').count() == 0)
    check('Tutar okunamayanda Ekle yok', pg.locator('[data-a=mailadd][data-id=d3]').count() == 0)
    check('Okunan belgede Ekle var', pg.locator('[data-a=mailadd][data-id=d1]').count() == 1)
    check('Musteriye gonderme izni yok', pg.evaluate("()=>mailReady()") is False)
    check('Sahte alici/izin satiri yok', 'müşterilere gönderme açık' not in t)

    # 4) tek belge ekle
    n0 = pg.evaluate("()=>RECEIPTS.length")
    pg.click('[data-a=mailadd][data-id=d1]'); pg.wait_for_timeout(500)
    r = pg.evaluate("()=>RECEIPTS[RECEIPTS.length-1]")
    check('Fis eklendi', pg.evaluate("()=>RECEIPTS.length") == n0 + 1)
    check('Fis alanlari belgeden: satici, tutar, kdv, kategori', (r['seller'], r['total'], r['rate'], r['cat'], r['mailId']) == ('Satici 1', 1200, 20, 'Hammadde', 'd1'), r)
    check('Fis muhasebeciye gider (musavirde)', r['status'] == 'musavirde')
    check('Sunucuya "eklendi" isaretlendi', pg.evaluate("()=>__calls.some(c=>c.body.action==='mark'&&c.body.status==='eklendi'&&c.body.doc_ids[0]==='d1')"))
    check('Eklenen "Muhasebeye eklendi" gorunur, Ekle kalkar', 'Muhasebeye eklendi' in txt() and pg.locator('[data-a=mailadd][data-id=d1]').count() == 0)
    pg.evaluate("()=>{H.mailadd({dataset:{id:'d1'}})}")
    check('Ayni belge ikinci kez eklenmez', pg.evaluate("()=>RECEIPTS.length") == n0 + 1)

    # 5) hepsini ekle: dusuk guvenli ve farkli para birimi atlanir
    pg.evaluate("()=>H.mailall()"); pg.wait_for_timeout(400)
    ids = pg.evaluate("()=>RECEIPTS.filter(f=>f.mailId).map(f=>f.mailId).sort()")
    check('Hepsini ekle yalnizca guvenli belgeleri ekler', ids == ['d1', 'd2'], ids)
    check('Atlananlar icin uyari', 'tek tek kontrol et' in toast(), toast())

    # 6) mukerrer ipucu: elle girilmis ayni tarih+tutar
    pg.evaluate("()=>{MAILDOCS.find(d=>d.id==='d5').total=99;RECEIPTS.push({id:'fz',seller:'X',date:MAILDOCS.find(d=>d.id==='d5').date,total:99,rate:20,cat:'Diğer',status:'onayli',by:'u1'});render()}")
    check('Ayni tarih ve tutar uyarisi (gizlemez, uyarir)', 'tekrar eklemeden önce kontrol et' in txt())

    # 7) tarama dongusu
    pg.evaluate("()=>{__calls.length=0;__scan.push({ok:true,processed:20,remaining:5,done:false},{ok:true,processed:5,remaining:0,done:true})}")
    pg.evaluate("()=>H.mailscan()"); pg.wait_for_timeout(1500)
    sc = pg.evaluate("()=>__calls.filter(c=>c.body.action==='scan').length")
    check('Tarama kalan bitene kadar tekrar cagrilir (2 kez)', sc == 2, sc)
    check('Tarama bitince dugme geri gelir', pg.evaluate("()=>MAILX.scanning") is False)
    pg.evaluate("()=>{__calls.length=0;__scan.push({fail:'Gmail şu an yoğun, biraz sonra tekrar dene.'})}")
    pg.evaluate("()=>H.mailscan()"); pg.wait_for_timeout(1000)
    check('Tarama hatasi kullaniciya gosterilir', 'Gmail şu an yoğun' in txt())
    pg.evaluate("()=>{__scan.push({ok:true,processed:0,remaining:3,done:false})}")
    pg.evaluate("()=>H.mailscan()"); pg.wait_for_timeout(800)
    check('Ilerleme yoksa dongu sonsuza gitmez', pg.evaluate("()=>__calls.filter(c=>c.body.action==='scan').length") <= 3)

    # 8) baglanti kaldirma (onayli)
    pg.evaluate("()=>H.maildisc()"); pg.wait_for_timeout(300)
    check('Kaldirma once onay ister', 'Bağlantı kaldırılsın mı?' in txt())
    pg.evaluate("()=>H.maildiscno()"); pg.wait_for_timeout(200)
    check('Vazgecince kaldirilmaz', pg.evaluate("()=>S.mail.on") is True and not pg.evaluate("()=>__calls.some(c=>c.body.action==='disconnect')"))
    pg.evaluate("()=>{__tbl.conn=[];__tbl.docs=[]}")
    pg.evaluate("()=>H.maildisc()"); pg.evaluate("()=>H.maildiscok()"); pg.wait_for_timeout(900)
    check('Kaldirma sunucuya gider', pg.evaluate("()=>__calls.some(c=>c.body.action==='disconnect')"))
    check('Kaldirinca durum temiz', pg.evaluate("()=>S.mail.on===false&&MAILDOCS.length===0"))

    # 9) Google'dan donus
    pg.evaluate("()=>{history.pushState(null,'','?gmail=err&m=izin');}")
    pg.evaluate("()=>mailBoot()"); pg.wait_for_timeout(800)
    check('Izin verilmedi mesaji', 'iznini vermen gerekiyor' in toast(), toast())
    check('Adres cubugundaki gmail parametresi temizlendi', 'gmail=' not in pg.evaluate("()=>location.search"))
    pg.evaluate("()=>{__calls.length=0;__scan.push({ok:true,processed:0,remaining:0,done:true});history.pushState(null,'','?gmail=ok');}")
    pg.evaluate("()=>mailBoot()"); pg.wait_for_timeout(1200)
    check('Basarili donuste otomatik tarama baslar', pg.evaluate("()=>__calls.some(c=>c.body.action==='scan')"))
    check('Basarili donuste Muhasebe acilir ve e-posta bolumu acik olur', pg.evaluate("()=>S.view==='muhasebe'&&S.openChk.includes('mail')"))

    # 10) sunucu kurulu degil / tablo yok
    pg.evaluate("()=>{__tbl.err={code:'42P01',message:'relation \"mail_connections\" does not exist'};MAILX.loaded=false;MAILX.at=0}")
    pg.evaluate("()=>mailLoad(true)"); pg.wait_for_timeout(600)
    check('Tablo yoksa kurulum eksik mesaji', 'kurulumu eksik' in txt(), txt()[:200])
    pg.evaluate("()=>{__tbl.err=null}")

    # 11) rol: patron disi baglayamaz
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='muhasebeci'));S.modal=null;MAILX.loaded=false;MAILX.at=0;S.view='muhasebe';S.sub.muhasebe='eposta';render()}"); pg.wait_for_timeout(900)
    check('Patron disinda Bagla dugmesi yok', pg.locator('[data-a=mailconnect]').count() == 0)
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render()}")

    # 12) sahte "gonderildi" yok: musteriye e-posta gonderme henuz yok
    c0 = pg.evaluate("()=>CAMPAIGNS.length")
    pg.evaluate("()=>{S.camp={seg:'all',subj:'Konu',body:'Mesaj'};}")
    pg.evaluate("()=>{CUSTOMERS.push({id:'kz',name:'A',email:'a@x.com',visits:1,last:1,iys:'onayli'});H.campsend()}")
    check('Kampanya sahte gonderilmez', pg.evaluate("()=>CAMPAIGNS.length") == c0 and 'henüz hazır değil' in toast(), toast())
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('FAILED' if fails else 'ALL OK'); sys.exit(1 if fails else 0)
