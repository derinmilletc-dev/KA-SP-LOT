"""Tum sayfalar tek seferde: ozet, rol tahmini, ortak karar, hesap eslesme, bakiye kontrolu, tek geri al."""
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
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'}}")
    ev("""()=>{const R=(a)=>a.map((r,i)=>{r.__n=i+1;return r});
    const nakit=R([['','BÜYÜK ÇAMLICA NAKİT MUHASEBE TAKİBATI','','','','',''],['','HESAP TÜRÜ','HESAP ADI','BELGE NUMARASI','GELİRLER','GİDERLER','KASA BAKİYESİ','AÇIKLAMA'],
      ['9/26/2026','ÖN MUHASEBE','İŞÇİ GİDERİ','','','R 100.00','R 900.00','a'],['9/27/2026','ÖN MUHASEBE','KERMES GELİRİ','','R 760.00','','R 1,660.00','b'],['10/3/2026','ÖN MUHASEBE','KERMES GELİRİ','','R 600.00','','R 2,260.00','c']]);
    const banka=R([['','BANKA MUHASEBE TAKİBATI','','','','',''],['TARİH','HESAP ADI','SIRA NO','GELİRLER','GİDERLER','BAKİYE','AÇIKLAMA'],
      ['8/18/2026','BANKA GİDERLERİ','','','R 0.00','R 1,000.00','BANKA KESİNTİSİ'],['8/19/2026','KERMES GELİRİ','','R 400.00','','R 1,400.00','KERMES'],['8/20/2026','HAYVAN BAKIMI','','','R 300.00','R 1,100.00','VTF'],['8/21/2026','KERMES GELİRİ','','R 100.00','','R 9,999.00','HATALI BAKIYE']]);
    const acik=R([['Açıklama','Tutar'],['Bu sayfa kullanım talimatı','']]);
    ixLoadSheets([{name:'ACIKLAMA',rows:acik},{name:'NAKİT',rows:nakit},{name:'BUYUK CAMLICA 3017',rows:banka}],'m.xlsx');S.modal={type:'mximp'};renderModal();}""")
    pg.wait_for_timeout(150)
    check('Ozet adimi acildi', ev("()=>MXI.step")=='plan', ev("()=>MXI.step"))
    check('Roller: atla/nakit/banka', ev("()=>MXI.plan.map(p=>p.role).join()")=='atla,nakit,banka', ev("()=>MXI.plan.map(p=>p.role).join()"))
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Bakiye uyarisi gorunur', 'Bakiye 1 satırda tutmuyor' in t, t[:900])
    check('KDV sorusu gorunur', 'KDV oranı' in t)
    check('Karar yokken aktar kapali', ev("()=>document.querySelector('[data-a=ixplanrun]').disabled"))
    ev("()=>{MXI.pdec={rate:'0',incl:'yes'};renderModal()}")
    check('Karardan sonra aktar acik', not ev("()=>document.querySelector('[data-a=ixplanrun]').disabled"))
    ev("()=>{S.settings=S.settings||{};S.settings.xmap={'kermes geliri':'Kermes'}}")
    n0 = ev("()=>LEDGER.length"); ev("()=>H.ixplanrun()"); pg.wait_for_timeout(200)
    check('Hepsi aktarildi (3 nakit + 3 banka; sifir tutar atlanir)', ev("()=>LEDGER.length")-n0==6, ev("()=>LEDGER.length")-n0)
    check('Nakit/banka etiketleri', ev("()=>LEDGER.filter(r=>r.src==='Excel'&&r.ch==='nakit').length")==3 and ev("()=>LEDGER.filter(r=>r.src==='Excel'&&r.ch==='banka').length")==3)
    print(ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>r.acc)"))
    check('Hesap eslesmesi uygulandi', ev("()=>LEDGER.filter(r=>r.src==='Excel'&&r.acc==='Kermes').length")>=3)
    check('Tarihler dogru', ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>r.iso).includes('2026-09-26')"))
    check('Ozet ekrani', 'Aktarım tamam' in ev("()=>document.querySelector('.sheet').innerText"))
    ev("()=>H.ixundo()"); pg.wait_for_timeout(100)
    check('Tek geri alma hepsini siler', ev("()=>LEDGER.length")==n0, ev("()=>LEDGER.length")-n0)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
