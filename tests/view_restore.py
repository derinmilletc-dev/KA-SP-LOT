"""Yenilemede kalinan ekran geri gelir."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    u = ev("()=>{const u=USERS.find(x=>x.role==='patron');loginAs(u);S.view='muhasebe';render();return u.id}")
    check('Kaydedildi', ev("()=>JSON.parse(sessionStorage.kp_v).v")=='muhasebe')
    ev("()=>{S.user=null;S.view='bugun'}")
    ev("()=>{window.__t=1}")
    ev("(id)=>{const u=USERS.find(x=>x.id===id);S.user=null;return 1}", u)
    # idEnter yolunu taklit et
    ev("""(id)=>{ID.active={businesses:{name:'X'},app_uid:id,role:'patron'};SBS.user={id:'z'};cloudTry=async()=>{};return idEnter()}""", u)
    pg.wait_for_timeout(300)
    check('Yenilemede muhasebe acilir', ev("()=>S.view")=='muhasebe', ev("()=>S.view"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
