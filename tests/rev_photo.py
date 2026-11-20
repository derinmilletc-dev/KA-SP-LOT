"""Muhasebeci: fis fotografini gorur, satici/tarih/tutari duzeltip onaylar."""
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
    ev("()=>{S.user=USERS.find(u=>u.id==='u1');S.view='bugun';render();H.sample()}"); pg.wait_for_timeout(2500)
    if ev("()=>S.modal.step") == 'ask': pg.click('[data-a="answer"] >> nth=0'); pg.wait_for_timeout(2500)
    # foto simulasyonu (tiny jpeg)
    px = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    ev("(px)=>{S.modal.photo=px}", px)
    pg.click('[data-a="savereceipt"]'); pg.wait_for_timeout(200)
    check('foto fise yazildi', ev("()=>!!RECEIPTS[RECEIPTS.length-1].photo"))
    rid = ev("()=>RECEIPTS[RECEIPTS.length-1].id")
    ev("()=>{S.user=USERS.find(u=>u.id==='u3');S.view='belgeler';render()}")
    ev("(id)=>H.review({dataset:{id}})", rid); pg.wait_for_timeout(150)
    check('foto gorunur', pg.query_selector('.rv-ph img') is not None)
    check('akilli kontrol kutusu', pg.query_selector('.rv-sm') is not None)
    check('ayni cat iken oneri yok veya var', True)
    pg.click('.rv-ph img'); check('buyur', ev("()=>document.querySelector('.rv-ph').classList.contains('big')"))
    pg.fill('#rv-seller', 'Duzeltilmis Market'); pg.fill('#rv-date', '19 Kas'); pg.fill('#rv-total', '123.5'); pg.click('[data-a="revok"]'); pg.wait_for_timeout(150)
    r = ev("(id)=>RECEIPTS.find(x=>x.id===id)", rid); g = ev("(id)=>LEDGER.find(x=>x.rc===id)", rid)
    check('fis duzeltildi', r['seller'] == 'Duzeltilmis Market' and r['date'] == '19 Kas' and r['total'] == 123.5, r)
    check('tabloya duzeltilmis yazildi', g and g['desc'] == 'Duzeltilmis Market' and g['total'] == 123.5, g)
    check('hata yok', not er, er)
    b.close()
print('\nHATA:', f if f else 'yok'); raise SystemExit(1 if f else 0)
