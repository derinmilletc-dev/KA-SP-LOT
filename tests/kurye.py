"""Kurye: anahtar, konum, yardim cagrisi, patron haritasi ve alarm bandi."""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
SHOT = len(sys.argv) > 1
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); er = []
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, geolocation={'latitude': 41.0082, 'longitude': 28.9784, 'accuracy': 12}, permissions=['geolocation'])
    pg = ctx.new_page(); pg.on('pageerror', lambda e: er.append(str(e)[:200])); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(900); ev = pg.evaluate
    def go(uid, v):
        ev("([u,v])=>{S.user=USERS.find(x=>x.id===u);S.view=v;S.modal=null;render()}", [uid, v]); pg.wait_for_timeout(150)
    # patron anahtar
    go('u1', 'ekip'); ev("()=>{S.modal={type:'empdrw',id:'u4',tab:'ozet'};renderModal()}"); pg.wait_for_timeout(100)
    check('calisan kartinda kurye anahtari', pg.query_selector('[data-a="kttog"]') is not None)
    pg.click('[data-a="kttog"]'); pg.wait_for_timeout(150)
    check('kurye acildi', ev("()=>!!S.settings.kur.u4"))
    check('menude Kuryeler', ev("()=>NAV.patron.some(n=>n[0]==='kurye')") and ev("()=>NAV.mudur.some(n=>n[0]==='kurye')"))
    # kurye ekrani
    ev("()=>{S.settings.codeIn=false}")
    go('u4', 'bugun')
    check('kurye karti gorunur', pg.query_selector('.kt-go') is not None)
    go('u5', 'bugun'); check('kurye olmayan gormez', pg.query_selector('.kt') is None)
    go('u4', 'bugun'); pg.click('.kt-go'); pg.wait_for_timeout(300)
    check('onay ekrani', ev("()=>S.modal&&S.modal.type")=='ktcons', ev("()=>S.modal&&S.modal.type"))
    if SHOT: pg.screenshot(path='/tmp/kt_cons.png')
    pg.click('[data-a="ktcons"]'); pg.wait_for_timeout(1500)
    check('konum acik', ev("()=>KT.on"), ev("()=>[KT.on,KT.err,ATT.u4.state]"))
    check('mesai girisi yapildi', ev("()=>ATT.u4.state")=='working')
    pg.wait_for_timeout(1200)
    check('konum gonderildi', ev("()=>!!KT.mem.pos.u4 && Math.abs(KT.mem.pos.u4.lat-41.0082)<0.001"), ev("()=>JSON.stringify(KT.mem.pos)"))
    if SHOT: pg.screenshot(path='/tmp/kt_on.png')
    check('yardim dugmesi', pg.query_selector('.kt-sos') is not None)
    # 2 sn basili tutma
    bx = pg.query_selector('.kt-sos').bounding_box(); pg.mouse.move(bx['x']+60, bx['y']+60); pg.mouse.down(); pg.wait_for_timeout(700); pg.mouse.up(); pg.wait_for_timeout(100)
    check('kisa basista cagri yok', ev("()=>KT.mem.alarms.length")==0)
    bx = pg.query_selector('.kt-sos').bounding_box(); pg.mouse.move(bx['x']+60, bx['y']+60); pg.mouse.down(); pg.wait_for_timeout(2300); pg.mouse.up(); pg.wait_for_timeout(300)
    check('yardim cagrisi gitti', ev("()=>KT.mem.alarms.length")==1 and ev("()=>KT.mem.alarms[0].kind")=='yardim', ev("()=>JSON.stringify(KT.mem.alarms)"))
    check('kurye onay mesaji', pg.query_selector('.kt-sent') is not None)
    if SHOT: pg.screenshot(path='/tmp/kt_sos.png')
    # carpma sorusu
    ev("()=>ktAsk()"); pg.wait_for_timeout(300); check('iyi misin ekrani', ev("()=>S.modal&&S.modal.type")=='ktask')
    if SHOT: pg.screenshot(path='/tmp/kt_ask.png')
    pg.click('[data-a="ktok"]'); pg.wait_for_timeout(100); check('iyiyim kapatir', ev("()=>!S.modal"))
    # patron tarafi
    ev("()=>{KT.rows=[];KT.alarms=[]}")
    go('u1', 'bugun'); pg.wait_for_timeout(900)
    check('patronda alarm bandi', pg.query_selector('#kt-banner.red') is not None, ev("()=>document.getElementById('kt-banner')&&document.getElementById('kt-banner').outerHTML.slice(0,200)"))
    go('u1', 'kurye'); pg.wait_for_timeout(1800)
    check('harita ve liste', pg.query_selector('#kt-map .leaflet-container, #kt-map.leaflet-container') is not None and pg.query_selector('.kt-r') is not None)
    check('isaretci', pg.query_selector('.kt-pin') is not None)
    if SHOT: pg.screenshot(path='/tmp/kt_boss.png')
    check('kurye sayfasinda alarm karti', pg.query_selector('.kt-al') is not None)
    pg.click('.kt-al [data-a="ktack"]'); pg.wait_for_timeout(300)
    go('u1', 'bugun'); pg.wait_for_timeout(300)
    check('gordum sonrasi bant yok', pg.query_selector('#kt-banner') is None)
    # sinyal kesilmesi
    ev("()=>{KT.mem.pos.u4.at=new Date(Date.now()-5*60000).toISOString()}"); ev("()=>ktPoll()"); pg.wait_for_timeout(500)
    check('sinyal yok bandi', pg.query_selector('#kt-banner.amb') is not None)
    go('u2', 'kurye'); pg.wait_for_timeout(1200); check('mudur kuryeleri gorur', pg.query_selector('.kt-r') is not None)
    # mesai bitir
    go('u4', 'bugun'); pg.click('[data-a="ktend"]'); pg.wait_for_timeout(500)
    check('konum kapandi', not ev("()=>KT.on") and ev("()=>KT.mem.pos.u4.on_duty")==False, ev("()=>[KT.on,KT.mem.pos.u4.on_duty,ATT.u4.state]"))
    check('sayfa hatasi yok', not er, er)
    b.close()
print('\nHATA:', f if f else 'yok'); raise SystemExit(1 if f else 0)
