"""Muhasebeye basla sihirbazi: bakiye, para birimi, KDV, gider basliklari, eski kayitlar korunur."""
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
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'};S.settings=S.settings||{};LEDGER.length=0;LEDGER.push({id:'o1',date:'1 Kas',iso:'2026-11-01',desc:'Benzin',acc:'Akaryakıt',doc:'—',rate:0,total:300,dir:'gider'});H.mbopen()}")
    pg.wait_for_timeout(200)
    check('Ilk kurulum listesinde adim var', ev("()=>suSteps()[0].k==='muh'&&suSteps()[0].a==='mbopen'"))
    txt = lambda: ev("()=>document.querySelector('.sheet').innerText")
    check('Adim 0 acildi', 'baştan doğru' in txt() and 'Zaten 1 kaydın' in txt(), txt()[:200])
    pg.click('[data-a="mbcur"][data-c="$"]'); pg.click('[data-a="mbnext"]'); pg.wait_for_timeout(100)
    pg.fill('#mb-n', 'abc'); pg.click('[data-a="mbnext"]'); pg.wait_for_timeout(100)
    check('Gecersiz tutar uyarilir', 'sayı olarak' in txt(), txt()[:200])
    pg.fill('#mb-n', '12.500,50'); pg.fill('#mb-b', '3000'); pg.click('[data-a="mbnext"]'); pg.wait_for_timeout(100)
    pg.click('[data-a="mbnext"]'); pg.wait_for_timeout(100)
    check('KDV secmeden gecilmez', 'Bir seçenek seç' in txt(), txt()[:200])
    pg.click('[data-a="mbkdv"][data-v="muaf"]'); pg.click('[data-a="mbnext"]'); pg.wait_for_timeout(100)
    pg.click('[data-a="mbtpl"][data-v="kafe"]'); pg.fill('#mb-new', 'Sigara'); pg.click('[data-a="mbaddcat"]'); pg.wait_for_timeout(100)
    pg.click('[data-a="mbnext"]'); pg.wait_for_timeout(100)
    t = txt()
    check('Ozet dogru', 'Toplam başlangıç' in t and '15.500' in t.replace(' ', '.').replace(' ', ''), t[:400])
    pg.click('[data-a="mbfinish"]'); pg.wait_for_timeout(200)
    s = ev("()=>({kb:S.settings.kbal,cur:S.settings.cur,kdv:S.settings.kdvMode,mh:S.settings.mhOpen,done:!!S.settings.mbDone,cats:CATS.slice()})")
    check('Nakit 12500.5 banka 3000', s['kb']['nakit']['v'] == 12500.5 and s['kb']['banka']['v'] == 3000, s['kb'])
    check('Para birimi dolar', s['cur']['code'] == 'USD', s['cur'])
    check('KDV muaf kaydedildi', s['kdv'] == 'muaf' and s['done'], s)
    check('Acilis bakiyesi toplam', s['mh'] == 15500.5, s['mh'])
    c = s['cats']
    check('Sablon basliklari + kendi baslik', 'Ambalaj' in c and 'Sigara' in c, c)
    check('Eski kayitta kullanilan baslik korundu', 'Akaryakıt' in c, c)
    check('Diger sonda', c[-1] == 'Diğer' and 'Doğalgaz' in c, c)
    check('Bitis ekraninda sonraki adimlar', 'Muhasebe başladı' in txt() and 'Fiş fotoğrafı' in txt(), txt()[:200])
    check('Ilk kurulum adimi tamam', ev("()=>suSteps()[0].done===true"))
    ev("(R)=>{const a=R.map((r,i)=>{r.__n=i+1;return r});MXI.step='pick';MXI.dec={};ixLoadSheets([{name:'G',rows:a}],'t.xlsx')}", [['Tarih','Açıklama','Gelir','Gider'],['03.11.2026','X','100,00',''],['04.11.2026','Y','','5,00']])
    check('KDV muaf: Excel aktarimda oran 0 onayli', ev("()=>MXI.dec.rate")=='0', ev("()=>MXI.dec"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
