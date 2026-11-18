"""Sira no tutar sanilmaz, belirsiz sayfa aktarilmaz, guncel bakiye dosyadan ve elle."""
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
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));LEDGER.length=0}")
    ev("""()=>{const R=(a)=>a.map((r,i)=>{r.__n=i+1;return r});
    const seqS=R([['HESAP ADI','SIRA NO','AÇIKLAMA'],['IAŞE GİDERLERİ',1,'a'],['ARAÇ YAKIT',2,'b'],['KIRTASİYE',3,'c'],['TAMİR',4,'d'],['HIRDAVAT',5,'e'],['ELEKTRİK',6,'f'],['SU',7,'g']]);
    const banka=R([['BANKA MUHASEBE TAKİBATI','','','',''],['TARİH','HESAP ADI','GELİRLER','GİDERLER','BAKİYE','AÇIKLAMA'],
      ['8/19/2026','KERMES GELİRİ','R 400.00','','R 1,400.00','K'],['8/20/2026','HAYVAN BAKIMI','','R 300.00','R 1,100.00','V'],['8/21/2026','KERMES GELİRİ','R 150.00','','R 1,250.00','K2']]);
    const nakit=R([['NAKİT','','','',''],['TARİH','HESAP ADI','GELİRLER','GİDERLER','KASA BAKİYESİ','AÇIKLAMA'],
      ['9/26/2026','İŞÇİ GİDERİ','','R 100.00','R 900.00','a'],['9/27/2026','KERMES GELİRİ','R 760.00','','R 1,660.00','b']]);
    ixLoadSheets([{name:'ARAÇLAR',rows:seqS},{name:'NAKİT',rows:nakit},{name:'BUYUK CAMLICA 3017',rows:banka}],'m.xlsx');MXI.pdec={rate:'0',incl:'yes'};S.modal={type:'mximp'};renderModal();}""")
    pg.wait_for_timeout(150)
    check('Sira no sayfasi atlanir', ev("()=>MXI.plan[0].role")=='atla', ev("()=>MXI.plan.map(p=>p.role).join()"))
    check('Nakit/banka okunur', ev("()=>MXI.plan.map(p=>p.role).join()")=='atla,nakit,banka')
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Eslesme ozeti gorunur', 'Gelir: GELİRLER' in t and 'Gider: GİDERLER' in t, t[:700])
    ev("()=>H.ixplanrun()"); pg.wait_for_timeout(200)
    check('Nakit anchor 1660', ev("()=>S.settings.kbal.nakit.v")==1660, ev("()=>S.settings.kbal"))
    check('Banka anchor 1250', ev("()=>S.settings.kbal.banka.v")==1250)
    ev("()=>{LEDGER.push({id:'g'+(++seq),date:'x',iso:fiIso(),desc:'Yeni',acc:'X',doc:'—',rate:0,total:60,dir:'gider',src:'Elle',ch:'nakit'})}")
    ev("()=>H.mxkb()"); pg.wait_for_timeout(100)
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Guncel nakit 1.600 (1660-60)', '1.600' in t and 'Nakit kasa' in t, t[:400])
    ev("()=>{document.getElementById('kb-b').value='5000';H.mxkbset()}"); t = ev("()=>document.querySelector('.sheet').innerText")
    check('Elle banka 5.000', '5.000' in t, t[:400])
    check('Cift lira yok', '₺ ₺' not in t)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
