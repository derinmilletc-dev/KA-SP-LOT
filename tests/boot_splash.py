"""Yenilemede oturum varken kurulum/giris yerine yukleniyor ekrani; hesap gelince uygulama."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.add_init_script("window.supabase={createClient:()=>({})};localStorage.setItem('sb-abc-auth-token','{\"x\":1}')")
    pg.goto(URL); pg.wait_for_timeout(600); ev = pg.evaluate
    ev("()=>{SBS.user={id:'z',email:'a@b.c'};S.user=null;ID.mems=[];render()}")
    t = ev("()=>document.body.innerText")
    check('Oturum varken yukleniyor ekrani', 'Hesabın hazırlanıyor' in t and 'işletmeni tanıyalım' not in t, t[:150])
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'))}"); pg.wait_for_timeout(500)
    t = ev("()=>document.body.innerText")
    check('Hesap gelince uygulama acilir', 'Hesabın hazırlanıyor' not in t and ev("()=>!!S.user"))
    pg2 = b.new_page(viewport={'width': 390, 'height': 844}); pg2.add_init_script("window.supabase={createClient:()=>({})}")
    pg2.goto(URL); pg2.wait_for_timeout(600)
    check('Oturum yokken yukleniyor ekrani yok', 'Hesabın hazırlanıyor' not in pg2.evaluate("()=>document.body.innerText"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
