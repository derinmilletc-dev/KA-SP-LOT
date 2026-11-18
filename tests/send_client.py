"""Musteriye e-posta gonderme (istemci): hazir degil, hatirlatma, kampanya (iki adimli onay), musteri ekleme/izin, listeden cikanlar.
Sahte Supabase istemcisi kullanir; gercek e-posta gitmez. Sunucu tarafi icin: node --experimental-strip-types supabase/test_send.mjs"""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)

FAKE = """()=>{
  window.__calls=[]; window.__inv={status:{ok:true,configured:true,dayLeft:50,dayLimit:50},optouts:{ok:true,emails:[]}}; window.__fail={};
  const fake={from:()=>{const a={select:()=>a,eq:()=>a,order:()=>a,limit:()=>a,then:(r)=>Promise.resolve({data:[],error:null}).then(r)};return a;},auth:{getSession:async()=>({data:{session:null}})},
    functions:{invoke:async(name,opt)=>{const a=opt.body.action;window.__calls.push({name,body:opt.body});
      if(name==='kais-send'&&window.__fail[a]) return {data:null,error:{message:'x',context:{json:async()=>({error:window.__fail[a]})}}};
      return {data:window.__inv[a]||{ok:true},error:null};}}};
  SBS.c=fake; SBS.user={id:'u-1',email:'p@x.com'}; SBS.biz={id:'11111111-1111-1111-1111-111111111111',name:'Biz'};
  SENDX.ready=false; SENDX.probed=false; SENDX.at=0; SENDX.optAt=0; SENDX.busy=false;
  CUSTOMERS.length=0; CAMPAIGNS.length=0; RECV.length=0;
  RECV.push({id:'a1',name:'Mavi Ofis',email:'info@mavi.com',amt:3200,days:5,note:'Kahve aboneligi'},{id:'a2',name:'Adressiz',email:'',amt:10,days:1,note:'x'});
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 768}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render()}")
    txt = lambda: pg.evaluate("()=>document.body.innerText")
    toast = lambda: pg.evaluate("()=>Array.from(document.querySelectorAll('.toast')).map(e=>e.textContent).join(' | ')")
    calls = lambda n=None: pg.evaluate("(n)=>__calls.filter(c=>c.name==='kais-send'&&(!n||c.body.action===n)).map(c=>c.body)", n)
    go = lambda sub: (pg.evaluate("(s)=>{S.view='musteri';S.sub.musteri=s;render()}", sub), pg.wait_for_timeout(700))

    # 1) bulut hesabi yok: hazir degil, gonderim yok
    check('Bulut yokken mailReady false', pg.evaluate("()=>mailReady()") is False)
    pg.evaluate("()=>{CUSTOMERS.push({id:'k1',name:'Selin',email:'s@x.com',visits:3,last:2,iys:'onayli'});S.camp={seg:'all',subj:'Konu',body:'Mesaj metni'}}")
    pg.evaluate("()=>H.campsend()"); pg.wait_for_timeout(300)
    check('Kampanya gonderilmedi, durust uyari', 'henüz hazır değil' in toast() and pg.evaluate("()=>CAMPAIGNS.length") == 0, toast())

    # 2) bulut hesabi var ama sunucuda Resend yok
    pg.evaluate(FAKE); pg.evaluate("()=>{__inv.status={ok:true,configured:false}}")
    go('liste')
    check('Resend yoksa mailReady false', pg.evaluate("()=>mailReady()") is False)
    check('Durum sorgusu gitti', len(calls('status')) == 1)

    # 3) hazir
    pg.evaluate(FAKE); go('liste')
    check('Hazirsa mailReady true', pg.evaluate("()=>mailReady()") is True)
    check('Cikis listesi sorgulandi', len(calls('optouts')) == 1)
    check('Bos listede ekle dugmesi var', pg.locator('[data-a=custnew]').count() == 1)

    # 4) musteri ekleme
    pg.click('[data-a=custnew]'); pg.wait_for_timeout(300)
    pg.fill('#cu-name', 'Selin Aydın'); pg.fill('#cu-mail', 'bozuk'); pg.click('[data-a=custadd]'); pg.wait_for_timeout(200)
    check('Bozuk adres reddedilir', 'Geçerli bir e-posta' in txt() and pg.evaluate("()=>CUSTOMERS.length") == 0)
    pg.fill('#cu-mail', 'Selin@Ornek.com'); pg.check('#cu-iz'); pg.click('[data-a=custadd]'); pg.wait_for_timeout(300)
    c = pg.evaluate("()=>CUSTOMERS[0]")
    check('Musteri izinli eklendi, adres kucuk harf', c['iys'] == 'onayli' and c['email'] == 'selin@ornek.com' and c['izinTarih'], c)
    pg.click('[data-a=custnew]'); pg.wait_for_timeout(200)
    pg.fill('#cu-name', 'Can'); pg.fill('#cu-mail', 'can@ornek.com'); pg.click('[data-a=custadd]'); pg.wait_for_timeout(300)
    check('Isaretsiz eklenen izin yok', pg.evaluate("()=>CUSTOMERS[1].iys") == 'yok')
    pg.click('[data-a=custnew]'); pg.wait_for_timeout(200)
    pg.fill('#cu-name', 'Selin Iki'); pg.fill('#cu-mail', 'SELIN@ornek.com'); pg.click('[data-a=custadd]'); pg.wait_for_timeout(200)
    check('Ayni adres iki kez eklenmez', 'zaten listede' in txt() and pg.evaluate("()=>CUSTOMERS.length") == 2)
    pg.click('[data-a=closemodal]'); pg.wait_for_timeout(200)
    check('Kalicilik listesinde musteriler var', pg.evaluate("()=>P_ARR.some(x=>x[0]==='CUSTOMERS')&&P_ARR.some(x=>x[0]==='CAMPAIGNS')&&P_SCOPE.CUSTOMERS==='stok'"))
    pg.click('[data-a=custizin][data-id]'); pg.wait_for_timeout(300)
    check('"Izin aldim" izni isaretler', pg.evaluate("()=>CUSTOMERS[1].iys") == 'onayli')
    pg.evaluate("()=>H.custret({dataset:{id:CUSTOMERS[1].id}})"); pg.wait_for_timeout(200)
    check('Izin kaldirilir', pg.evaluate("()=>CUSTOMERS[1].iys") == 'yok')

    # 5) kampanya: iki adimli onay, yalniz izinliler
    pg.evaluate("()=>{S.camp={seg:'all',subj:'',body:''}}"); go('kampanya')
    pg.fill('#c-subj', 'Hafta sonu %15'); pg.fill('#c-body', 'Merhaba {ad}, bekleriz.')
    check('Hazirken "henuz hazir degil" yazisi yok', 'henüz hazır değil' not in txt())
    check('Dugme 1 kisiyi sayar', '1 kişiye gönder' in txt(), txt()[:300])
    pg.click('[data-a=campsend]'); pg.wait_for_timeout(400)
    check('Ilk tikta gonderilmez, onay ister', len(calls('campaign')) == 0 and 'Evet, 1 kişiye şimdi gönder' in txt())
    pg.click('[data-a=campno]'); pg.wait_for_timeout(300)
    check('Vazgec onayi kapatir', 'Evet, 1 kişiye' not in txt() and pg.evaluate("()=>S.camp.subj") == 'Hafta sonu %15')
    pg.click('[data-a=campsend]'); pg.wait_for_timeout(300)
    pg.evaluate("()=>{__inv.campaign={ok:true,sent:1,failed:0,dup:0,limited:false,dayLeft:49,skipped:{},optIds:[]}}")
    pg.click('[data-a=campsend]'); pg.wait_for_timeout(900)
    cc = calls('campaign')
    check('Ikinci tikta sunucuya gitti, yalniz izinli kimlik', len(cc) == 1 and cc[0]['ids'] == [pg.evaluate("()=>CUSTOMERS[0].id")] and cc[0]['subject'] == 'Hafta sonu %15' and cc[0]['cid'], cc)
    check('Istemci adres ya da izin bilgisi gondermez', 'emails' not in cc[0] and 'consent' not in cc[0])
    check('Kampanya kaydi, acilma olculmuyor', pg.evaluate("()=>CAMPAIGNS.length") == 1 and 'ölçülmüyor' in pg.evaluate("()=>CAMPAIGNS[0].open"))
    check('Gonderildi mesaji', '1 kişiye gönderildi' in toast(), toast())
    check('Form temizlendi', pg.evaluate("()=>S.camp.subj") == '')

    # 6) kampanya hatasi: kayit yok, onay kapanir
    pg.evaluate("()=>{S.camp={seg:'all',subj:'Konu',body:'Mesaj metni'};__fail.campaign='Bugünlük gönderim sınırına ulaştın. Yarın tekrar dene.'}"); go('kampanya')
    pg.click('[data-a=campsend]'); pg.wait_for_timeout(300); pg.click('[data-a=campsend]'); pg.wait_for_timeout(800)
    check('Hatada kampanya kaydi eklenmez, hata gosterilir', pg.evaluate("()=>CAMPAIGNS.length") == 1 and 'sınırına ulaştın' in toast() and pg.evaluate("()=>!!S.camp.arm") is False, toast())

    # 7) listeden cikanlar
    pg.evaluate("()=>{__inv.optouts={ok:true,emails:['selin@ornek.com']};SENDX.optAt=0;SENDX.at=0}"); go('liste'); pg.wait_for_timeout(600)
    check('Listeden cikan musteri isaretlendi', pg.evaluate("()=>CUSTOMERS[0].iys") == 'ret')
    check('"Cikti" etiketi gorunur', 'Çıktı' in txt())
    pg.evaluate("()=>H.custdel({dataset:{id:CUSTOMERS[0].id}})"); pg.wait_for_timeout(200)
    check('Silme calisir', pg.evaluate("()=>CUSTOMERS.length") == 1)

    # 8) hatirlatma
    pg.evaluate("()=>{S.view='muhasebe';S.sub.muhasebe='alacak';render()}"); pg.wait_for_timeout(400)
    pg.evaluate("()=>H.remind({dataset:{id:'a1'}})"); pg.wait_for_timeout(300)
    t = txt()
    check('Hatirlatma penceresi: gonderen isletme, alici adres', 'info@mavi.com' in t and 'Yanıtlar senin e-posta adresine gelir' in t, t[:400])
    pg.fill('#remind-text', 'Merhaba Mavi, odemeniz bekliyor.')
    pg.evaluate("()=>{__fail.remind='Bu alacak için bugün zaten hatırlatma gönderildi.'}")
    pg.click('[data-a=remindsend]'); pg.wait_for_timeout(700)
    check('Hatada alacak isaretlenmez, pencere acik kalir', pg.evaluate("()=>!RECV[0].reminded&&!!S.modal") is True and 'zaten hatırlatma' in toast(), toast())
    check('Duzenlenen metin korunur', pg.input_value('#remind-text') == 'Merhaba Mavi, odemeniz bekliyor.')
    pg.evaluate("()=>{delete __fail.remind;__inv.remind={ok:true,sent:1}}")
    pg.click('[data-a=remindsend]'); pg.wait_for_timeout(900)
    rc = calls('remind')
    check('Sunucuya yalniz kimlik ve metin gitti', len(rc) == 2 and rc[1]['rid'] == 'a1' and rc[1]['text'].startswith('Merhaba Mavi') and 'to' not in rc[1], rc)
    check('Basarida alacak "hatirlatildi", pencere kapandi', pg.evaluate("()=>!!RECV[0].reminded&&!S.modal") is True and 'gönderildi' in toast(), toast())
    pg.evaluate("()=>H.remind({dataset:{id:'a2'}})"); pg.wait_for_timeout(300); pg.evaluate("()=>H.remindsend({dataset:{id:'a2'},disabled:false})"); pg.wait_for_timeout(400)
    check('Adressiz alacaga gonderilmez', len(calls('remind')) == 2 and 'adresi yok' in toast(), toast())

    # --- fatura e-postayla (PDF ekli) ---
    pg.evaluate("""()=>{ window.__mt=[]; window.fiPdf=async()=>new Blob(['%PDF-1.4 x'],{type:'application/pdf'}); window.confirm=()=>true;
      INV.length=0; FCUST.length=0; INV.push({id:'iv9',no:'KF-9',cust:'Mavi Ofis',tot:100,st:'bekliyor'}); FCUST.push({id:'fc9',name:'Mavi Ofis',eposta:'muh@mavi.com'});
      __inv.invoice={ok:true,sent:1}; SENDX.ready=true; SENDX.probed=true; SENDX.at=Date.now(); SENDX.busy=false; }""")
    pg.evaluate("()=>H.fimail({dataset:{id:'iv9'},textContent:'E-posta',disabled:false})"); pg.wait_for_timeout(900)
    ic = calls('invoice')
    check('Fatura sunucuya kimlik ve PDF ile gitti, adres gitmedi', len(ic) == 1 and ic[0]['invoice_id'] == 'iv9' and ic[0]['pdf'] == __import__('base64').b64encode(b'%PDF-1.4 x').decode() and 'to' not in ic[0], ic)
    check('Fatura gonderildi bilgisi kaydedildi', pg.evaluate("()=>INV[0].mailedTo==='muh@mavi.com'") is True and 'gönderildi' in toast(), toast())
    pg.evaluate("()=>{FCUST[0].eposta=''}"); pg.evaluate("()=>H.fimail({dataset:{id:'iv9'},textContent:'E-posta',disabled:false})"); pg.wait_for_timeout(400)
    check('Adressiz musteriye fatura gonderilmez', len(calls('invoice')) == 1 and 'e-postası kayıtlı değil' in toast(), toast())

    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nBASARISIZ: %d' % len(fails) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
