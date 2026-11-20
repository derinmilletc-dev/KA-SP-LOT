"""Tanitim turu: bir kez; X ile kapatilsa da tekrar cikmaz; baska cihazda (bulut hesabi) cikmaz."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); er = []
    ctx = b.new_context(); pg = ctx.new_page(); pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(700); ev = pg.evaluate
    ev("()=>{window.__upd=[];sbClient=()=>({auth:{updateUser:async(x)=>{window.__upd.push(x);return {}}}});SBS.user={id:'uA',user_metadata:{full_name:'A'}};S.user={role:'patron',id:'u1',name:'A'};S.demoMode=false;localStorage.clear()}")
    check('Yeni kullanici: tur gorulmemis', ev("()=>tourSeen()===false"))
    ev("()=>tourDone()")
    check('Bulut hesabina yazildi', ev("()=>window.__upd.length===1&&window.__upd[0].data.kp_tour.patron===1"), ev("()=>window.__upd"))
    ev("()=>tourDone()"); check('Ikinci kez yazilmaz', ev("()=>window.__upd.length===1"))
    # baska cihaz: localStorage bos ama hesapta isaret var
    ev("()=>{localStorage.clear();SBS.user={id:'uA',user_metadata:{kp_tour:{patron:1}}}}")
    check('Baska cihaz: hesapta isaret varsa tur cikmaz', ev("()=>tourSeen()===true"))
    check('Baska rol icin tur ayri', ev("()=>{S.user={role:'calisan',id:'u2'};return tourSeen()===false}"))
    # X ile kapatma: acildigi anda gorulmus sayilir
    ev("()=>{localStorage.clear();SBS.user={id:'uB',user_metadata:{}};S.user={role:'patron',id:'u1',name:'A'};S.modal=null;S.settings.setupHide=true}")
    ev("()=>render()"); pg.wait_for_timeout(1500)
    shown = ev("()=>!!(S.modal&&S.modal.type==='tour')")
    check('Tur ilk girista acilir', shown)
    ev("()=>{S.modal=null;render()}"); pg.wait_for_timeout(200)
    check('X ile kapatinca gorulmus sayilir', ev("()=>tourSeen()===true"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
