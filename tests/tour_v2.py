"""Yeni tanitim turu: rol/duruma gore slaytlar, gezinme, son adimda kisisel liste, eylem dugmeleri."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'<b>Ali</b> Veli'};S.settings=S.settings||{};STOCK.length=0;EMP_IDS.length=0;LEDGER.length=0;RECEIPTS.length=0;SUPPLIERS.length=0;H.tourshow()}")
    pg.wait_for_timeout(200)
    txt = lambda: ev("()=>document.querySelector('.sheet').innerText")
    n = ev("()=>tourSlides().length")
    check('Patron: 7 slayt (yeni hesap)', n == 7, n)
    check('Ad guvenli yazilir (HTML calismaz)', '<b>' in txt() and ev("()=>!document.querySelector('.sheet h2 b')"), txt()[:80])
    pg.screenshot(path='/tmp/t0.png')
    pg.click('[data-a="tournext"]'); pg.wait_for_timeout(120)
    check('Muhasebe slaydi', 'nakit ve banka ayrı' in txt(), txt()[:120]); pg.screenshot(path='/tmp/t1.png')
    pg.click('[data-a="tourat"][data-i="5"]'); pg.wait_for_timeout(120)
    check('Noktaya dokununca atlar (Kais)', "Kais'e sor" in txt(), txt()[:80]); pg.screenshot(path='/tmp/t5.png')
    pg.click('[data-a="tournext"]'); pg.wait_for_timeout(120)
    t = txt(); check('Son slayt: kisisel liste', 'Muhasebeyi başlat' in t and 'Başlamak için' in t, t[:300]); pg.screenshot(path='/tmp/t6.png')
    pg.click('[data-act="mbopen"]'); pg.wait_for_timeout(250)
    check('Eylem: sihirbaz acildi, tur kapandi', ev("()=>S.modal&&S.modal.type==='mbasla'"), ev("()=>S.modal"))
    # akilli: stok ve ekip kuruluysa o slaytlar atlanir; muhasebe baslatildiysa listeden cikar
    ev("()=>{S.modal=null;STOCK.push({id:'sx',name:'X',qty:1,unit:'kg',min:1});S.settings.mbDone={t:'2026-11-20'};}")
    sl = ev("()=>tourSlides().map(s=>s.hero)")
    check('Stok kuruluysa stok slayti yok', 'stok' not in sl, sl)
    last = ev("()=>tourSlides().slice(-1)[0].todo.map(x=>x.k)")
    check('Muhasebe baslatildiysa listede yok', 'muh' not in last, last)
    # diger roller
    for role, mn in (('mudur', 4), ('muhasebeci', 4), ('calisan', 4)):
        c = ev("(r)=>{S.user={role:r,id:'x',name:'Ayşe K'};return tourSlides().length}", role)
        check('Rol ' + role + ' slaytlari', c >= mn, c)
    ev("()=>{S.user={role:'calisan',id:'x',name:'Ayşe K'};H.tourshow()}"); pg.wait_for_timeout(150)
    pg.click('[data-a="tournext"]'); pg.click('[data-a="tourprev"]'); pg.wait_for_timeout(100)
    check('Calisan: geri ileri calisir', 'Ayşe' in txt(), txt()[:80])
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
