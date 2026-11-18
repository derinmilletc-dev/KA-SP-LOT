"""Excel: banka/nakit sayfasi, siradaki sayfa; fis: nereye kaydedilsin."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'};}")
    ev("""()=>{const rows=(a)=>a.map((r,i)=>{r.__n=i+1;return r});
      ixLoadSheets([{name:'BANKA AKIŞI',rows:rows([['Tarih','Açıklama','Tutar'],['17.11.2026','Havale',4200],['18.11.2026','EFT',1000]])},{name:'NAKİT AKIŞI',rows:rows([['Tarih','Açıklama','Tutar'],['17.11.2026','Market',300]])}],'x.xlsx');
      MXI.dec={dir:'gider',rate:'20',incl:'yes'};S.modal={type:'mximp'};renderModal();}""")
    pg.wait_for_timeout(150)
    check('Banka sayfasi otomatik', ev("()=>MXI.ch")=='banka', ev("()=>MXI.ch"))
    check('Kanal secimi gorunur', ev("()=>!!document.getElementById('ix-ch')") or ev("()=>/Banka/.test(document.body.innerText)"))
    ev("()=>H.iximport()"); pg.wait_for_timeout(100)
    check('Satirlara banka etiketi', ev("()=>LEDGER.filter(r=>r.src==='Excel'&&r.ch==='banka').length")==2)
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Siradaki sayfa dugmesi', 'Sıradaki sayfa (1 kaldı)' in t, t[:200])
    ev("()=>H.ixnext()"); pg.wait_for_timeout(100)
    check('Sonraki sayfa nakit', ev("()=>MXI.sheets[MXI.si].name+'|'+MXI.ch")=='NAKİT AKIŞI|nakit', ev("()=>MXI.sheets[MXI.si].name+'|'+MXI.ch"))
    ev("()=>{MXI.dec={dir:'gider',rate:'20',incl:'yes'};H.iximport()}"); pg.wait_for_timeout(100)
    check('Nakit etiketi', ev("()=>LEDGER.filter(r=>r.src==='Excel'&&r.ch==='nakit').length")==1)
    # fis kaydi: secim zorunlu
    ev("()=>{MXF.step='form';MXF.p={desc:'Migros',total:250,iso:fiIso(),rate:10,acc:'Diğer',guess:''};S.modal={type:'mxfis'};renderModal()}"); pg.wait_for_timeout(100)
    check('Fis: nereye kaydedilsin alani', ev("()=>!!document.getElementById('mf-w')"))
    n0 = ev("()=>LEDGER.length"); ev("()=>H.mxfsave()")
    check('Fis: secmeden kaydedilmez', ev("()=>LEDGER.length")==n0)
    ev("()=>{document.getElementById('mf-w').value='banka';H.mxfsave()}")
    check('Fis: banka', ev("()=>LEDGER[LEDGER.length-1].ch")=='banka')
    ev("()=>{MXF.step='form';MXF.p={desc:'Tedarik AŞ',total:900,iso:fiIso(),rate:20,acc:'Diğer',guess:''};S.modal={type:'mxfis'};renderModal()}"); pg.wait_for_timeout(100)
    d0 = ev("()=>DEBTS.length"); n1 = ev("()=>LEDGER.length")
    ev("()=>{document.getElementById('mf-w').value='borc';H.mxfsave()}")
    check('Fis: borca gider', ev("()=>DEBTS.length")==d0+1 and ev("()=>LEDGER.length")==n1)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not fails else 'FAIL: %d' % len(fails))
