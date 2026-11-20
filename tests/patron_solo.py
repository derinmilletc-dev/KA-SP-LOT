"""Muhasebeci yokken patron fisi kendisi inceleyip onaylar."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); er = []; pg = b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: er.append(str(e)[:200])); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{ID.team={members:[],invites:[]};S.user=USERS.find(u=>u.id==='u1');S.view='bugun';render();H.sample()}"); pg.wait_for_timeout(2500)
    if ev("()=>S.modal.step") == 'ask': pg.click('[data-a="answer"] >> nth=0'); pg.wait_for_timeout(2500)
    check('buton metni', 'Kaydet ve incele' in ev("()=>document.getElementById('modal-root').innerText"))
    pg.click('[data-a="savereceipt"]'); pg.wait_for_timeout(400)
    check('inceleme kendiliginden acildi', ev("()=>S.modal&&S.modal.type")=='rev', ev("()=>S.modal&&S.modal.type"))
    pg.click('[data-a="revok"]'); pg.wait_for_timeout(150)
    check('tabloya yazildi', ev("()=>RECEIPTS[RECEIPTS.length-1].status")=='onayli' and ev("()=>LEDGER.some(g=>g.rc===RECEIPTS[RECEIPTS.length-1].id)"))
    # bekleyen fis listede incele butonu
    ev("()=>{RECEIPTS[RECEIPTS.length-1].status='musavirde';S.view='muhasebe';S.sub={muhasebe:'belgeler'};render()}")
    check('belgelerde incele butonu', pg.query_selector('#main [data-a="review"]') is not None)
    # muhasebeci varsa patrona buton yok
    ev("()=>{ID.team={members:[{app_uid:'u3'}],invites:[]};render()}")
    check('muhasebeci varsa buton yok', pg.query_selector('#main [data-a="review"]') is None)
    check('hata yok', not er, er)
    b.close()
print('\nHATA:', f if f else 'yok'); raise SystemExit(1 if f else 0)
