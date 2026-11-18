"""Oturum varken sayfa acilirken statik yukleniyor ekrani; oturum yokken yok."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.add_init_script("window.supabase={createClient:()=>({})};localStorage.setItem('sb-abc-auth-token','{\"x\":1}')")
    pg.goto(URL, wait_until='commit'); pg.wait_for_timeout(100)
    check('Erken: kp-boot sinifi', pg.evaluate("()=>document.documentElement.classList.contains('kp-boot')"))
    pg.wait_for_timeout(5000)
    check('Oturum yok sayilinca kalkti', not pg.evaluate("()=>document.documentElement.classList.contains('kp-boot')"))
    pg2 = b.new_page(); pg2.add_init_script("window.supabase={createClient:()=>({})}")
    pg2.goto(URL); pg2.wait_for_timeout(500)
    check('Oturum yokken kp-boot yok', not pg2.evaluate("()=>document.documentElement.classList.contains('kp-boot')"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
