"""Sifirlama baglantisi: siteye girmeden yeni sifre ekrani -> kaydedince giris (e-posta dolu, dogru sekme); suresi dolmus baglanti. Sahte istemci."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
FAKE = """(()=>{window.__calls=[];const ses={user:{id:'U1',email:'ahmet.yilmaz@gmail.com'}};
Object.defineProperty(window,'supabase',{configurable:false,writable:false,value:{createClient:()=>({auth:{getSession:async()=>({data:{session:window.__nosess?null:ses}}),updateUser:async(o)=>{__calls.push(['upd',o.password]);return window.__updErr?{error:{message:window.__updErr}}:{data:{},error:null}},signOut:async()=>{__calls.push(['out']);return{error:null}},signInWithPassword:async()=>({error:{message:'Invalid login'}})},from:()=>({select:()=>({eq:async()=>({data:[{role:window.__role||'calisan'}]})})})})}})})()"""
with sync_playwright() as p:
    b = p.chromium.launch()
    def page(hash_, pre=''):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); er = []
        pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script(FAKE + ';' + pre); pg.goto(URL + hash_); pg.wait_for_timeout(1200); return pg, er
    # 1) gecerli baglanti
    pg, er = page('#access_token=abc&refresh_token=r&type=recovery&expires_in=3600')
    ev = pg.evaluate
    check('Siteye girmez (kullanici yok)', ev("()=>!S.user && !SBS.user"))
    check('Yeni sifre ekrani gorunur', ev("()=>!!document.getElementById('rc-pw')") and 'Yeni şifreni belirle' in ev("()=>document.body.innerText"))
    check('E-posta maskeli', 'a***z@gmail.com' in ev("()=>document.body.innerText"), ev("()=>document.body.innerText.slice(0,200)"))
    check('Adres cubugundaki token temizlenir', 'access_token' not in ev("()=>location.hash"))
    pg.fill('#rc-pw', 'abc'); pg.fill('#rc-pw2', 'abc'); pg.click('[data-a=rcsave]'); pg.wait_for_timeout(150)
    check('Kisa sifre reddedilir', 'En az 8' in ev("()=>document.getElementById('rc-err').textContent") and ev("()=>__calls.length")==0)
    pg.fill('#rc-pw', 'Guclu1Sifre!'); pg.fill('#rc-pw2', 'Baska1Sifre!'); pg.click('[data-a=rcsave]'); pg.wait_for_timeout(150)
    check('Eslesmeyen sifre reddedilir', 'aynı değil' in ev("()=>document.getElementById('rc-err').textContent") and ev("()=>__calls.length")==0)
    check('Guc gostergesi', ev("()=>document.getElementById('rc-txt').textContent")=='Güçlü')
    pg.fill('#rc-pw2', 'Guclu1Sifre!'); pg.click('[data-a=rcsave]'); pg.wait_for_timeout(400)
    check('Sifre kaydedildi ve cikis yapildi', ev("()=>__calls.map(c=>c[0]).join()")=='upd,out', ev("()=>__calls"))
    t = ev("()=>document.body.innerText")
    check('Giris ekranina doner, basari notu var', 'Şifren güncellendi' in t and 'Yeni şifreni belirle' not in t, t[:200])
    check('E-posta dolu', ev("()=>document.getElementById('id-em').value")=='ahmet.yilmaz@gmail.com')
    check('Calisan sekmesi (rol calisan)', ev("()=>S.lgTab")=='emp')
    check('Sifre alanina odaklanir', ev("()=>document.activeElement&&document.activeElement.id")=='id-pw')
    pg.type('#id-pw', 'x'); check('Yazinca basari notu silinir', ev("()=>!document.getElementById('lx-recnote')"))
    check('Sayfa hatasi yok', not er, er)
    # 2) yenileyince tekrar giris yok (bekleyen sifirlama)
    pg2, er2 = page('#access_token=abc&type=recovery', pre="sessionStorage.setItem('kp_rec','1')")
    pg2.evaluate("()=>{history.replaceState(null,'',location.pathname)}")
    # 3) patron rolu -> own sekmesi
    pg3, er3 = page('#access_token=abc&type=recovery', pre="window.__role='patron'")
    check('Patron rolu: Patron sekmesi', pg3.evaluate("()=>REC.tab")=='own')
    # 4) suresi dolmus baglanti
    pg4, er4 = page('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    t4 = pg4.evaluate("()=>document.body.innerText")
    check('Suresi dolmus: acik mesaj ve yeni baglanti dugmesi', 'Bağlantı geçerli değil' in t4 and 'Yeni bağlantı iste' in t4)
    pg4.click('[data-a=rcagain]'); pg4.wait_for_timeout(300)
    check('Yeni baglanti iste: sifre sifirlama penceresi acilir', pg4.evaluate("()=>!!document.getElementById('fp-em')"))
    # 5) oturumu olmayan recovery
    pg5, er5 = page('#access_token=abc&type=recovery', pre="window.__nosess=true")
    check('Oturum yoksa gecersiz baglanti ekrani', 'Bağlantı geçerli değil' in pg5.evaluate("()=>document.body.innerText"))
    # 6) eski sifreyle ayni
    pg6, er6 = page('#access_token=abc&type=recovery', pre="window.__updErr='New password should be different from the old password.'")
    pg6.fill('#rc-pw', 'Guclu1Sifre!'); pg6.fill('#rc-pw2', 'Guclu1Sifre!'); pg6.click('[data-a=rcsave]'); pg6.wait_for_timeout(300)
    check('Eski sifre hatasi Turkce', 'eskisiyle aynı' in pg6.evaluate("()=>document.getElementById('rc-err').textContent"))
    # 7) normal acilis etkilenmez
    pg7, er7 = page('', pre="window.__nosess=true")
    check('Normal acilis: giris ekrani, recovery yok', pg7.evaluate("()=>!REC.on && !!document.getElementById('id-em')"))
    check('Hata yok (diger sayfalar)', not (er2 or er3 or er4 or er5 or er6 or er7), [er2, er3, er4, er5, er6, er7])
    pg.screenshot(path='/tmp/rc_login.png'); pg3.screenshot(path='/tmp/rc_screen.png')
    b.close()
print('\nHEPSI GECTI' if not fails else 'FAIL: %d' % len(fails))
