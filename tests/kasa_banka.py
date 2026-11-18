"""Nakit ve banka ekrani."""
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
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.view='muhasebe';render()}")
    check('Muhasebe ana ekraninda satir var', ev("()=>!!document.querySelector('[data-a=mxkb]')"))
    ev("""()=>{LEDGER.length=0;const y=fiIso().slice(0,7);
      const add=(d,ch,dir,t,a,desc)=>LEDGER.push({id:'t'+(++seq),date:'x',iso:y+'-'+d,desc,acc:a,doc:'—',rate:0,total:t,dir,src:'Excel',ch});
      add('03','nakit','gelir',760,'KERMES GELİRİ','Satış');add('04','nakit','gider',100,'İŞÇİ GİDERİ','İşçi');add('05','banka','gelir',400,'KERMES GELİRİ','Kermes');add('06','banka','gider',300,'HAYVAN BAKIMI','VTF');add('07','','gider',50,'Diğer','Belirsiz');}""")
    ev("()=>H.mxkb()"); pg.wait_for_timeout(100)
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Hepsi: net +710', '710' in t.replace('.', '').replace(',', ''), t[:300])
    check('Nakit ve banka kartlari', 'Nakit' in t and 'Banka' in t and 'belirtilmemiş' in t)
    ev("()=>H.mxkbch({dataset:{k:'banka'}})"); t = ev("()=>document.querySelector('.sheet').innerText")
    check('Banka: net +100', '+100' in t.replace('.', ''), t[:300])
    ev("()=>H.mxkbm({dataset:{d:'-1'}})"); t = ev("()=>document.querySelector('.sheet').innerText")
    check('Onceki ay bos', 'Bu ay kayıt yok' in t)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
