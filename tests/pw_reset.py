"""Sifre sifirlama akisi: adim 1 (onay) -> adim 2 (e-postani kontrol et, sayac) -> yeni sifre (guc, eslesme). Sahte istemci."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("""()=>{window.__c=[];window.__fail=false;SBS.c={auth:{resetPasswordForEmail:async(e,o)=>{__c.push(['reset',e]);return __fail?{error:{message:'Error sending recovery email'}}:{data:{},error:null}},updateUser:async(o)=>{__c.push(['upd',o.password]);return{data:{},error:null}}}};S.user=null;SBS.user=null;S.lgTab='own';S.lgCreate=false;render()}""")
    pg.fill('#id-em', 'ahmt4565@gmail.com'); pg.click('[data-a=idforgot]'); pg.wait_for_timeout(200)
    check('Adim 1 acilir, e-posta dolu', ev("()=>document.getElementById('fp-em')&&document.getElementById('fp-em').value")=='ahmt4565@gmail.com')
    check('Adim 1: istek hemen gonderilmez', ev("()=>__c.length")==0)
    pg.fill('#fp-em', 'gecersiz'); pg.click('#fp-go'); pg.wait_for_timeout(100)
    check('Gecersiz e-posta reddedilir', 'geçerli' in ev("()=>document.getElementById('fp-err').textContent") and ev("()=>__c.length")==0)
    pg.fill('#fp-em', 'ahmt4565@gmail.com'); pg.click('#fp-go'); pg.wait_for_timeout(300)
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Adim 2: e-postani kontrol et, maskeli adres', 'E-postanı kontrol et' in t and 'a***5@gmail.com' in t, t[:120])
    check('Adim 2: Gmail ac dugmesi', 'Gmail' in t and ev("()=>!!document.querySelector('.fp a.btn[href*=\"mail.google\"]')"))
    check('Adim 2: tekrar gonder sayaci kilitli', ev("()=>document.getElementById('fp-re').disabled")==True and 'sn' in ev("()=>document.getElementById('fp-re').textContent"))
    check('Tek istek gitti', ev("()=>__c.filter(c=>c[0]==='reset').length")==1)
    pg.click('[data-a=fpchange]'); pg.wait_for_timeout(100)
    check('E-postayi degistir: adim 1e doner', ev("()=>!!document.getElementById('fp-em')"))
    ev("()=>{__fail=true}"); pg.click('#fp-go'); pg.wait_for_timeout(300)
    check('SMTP hatasi: anlasilir mesaj, pencere acik', 'gönderilemedi' in ev("()=>document.getElementById('fp-err').textContent") and ev("()=>!!document.getElementById('fp-go')"))
    # eski hata yazisi silinir
    ev("()=>{S.modal=null;S.loginErr='Önce e-posta adresini yaz';render();document.getElementById('id-err').textContent='Önce e-posta adresini yaz'}")
    pg.fill('#id-em', 'a@b.co'); check('Yazinca eski hata silinir', ev("()=>document.getElementById('id-err').textContent")=='')
    # yeni sifre
    ev("()=>{S.modal={type:'newpw'};renderModal()}"); pg.wait_for_timeout(100)
    pg.fill('#np-pw', 'abc'); check('Guc: zayif', ev("()=>document.getElementById('np-txt').textContent")=='Zayıf')
    pg.fill('#np-pw', 'Guclu1Sifre!x'); check('Guc: guclu', ev("()=>document.getElementById('np-txt').textContent")=='Güçlü')
    pg.fill('#np-pw2', 'baska'); pg.click('[data-a=pwsave]'); pg.wait_for_timeout(100)
    check('Eslesmeyen sifre reddedilir', 'aynı değil' in ev("()=>document.getElementById('np-err').textContent") and ev("()=>__c.filter(c=>c[0]==='upd').length")==0)
    pg.fill('#np-pw2', 'Guclu1Sifre!x'); pg.click('[data-a=pwsave]'); pg.wait_for_timeout(300)
    check('Sifre kaydedilir, pencere kapanir', ev("()=>__c.filter(c=>c[0]==='upd').length")==1 and ev("()=>!document.getElementById('np-pw')"))
    check('Sayfa hatasi yok', not er, er); pg.screenshot(path='/tmp/fp.png')
    b.close()
print('\nHEPSI GECTI' if not fails else 'FAIL: %d' % len(fails))
