"""Her turlu Excel duzeni: toplamlar (gelir, gider, satir) beklenenle birebir tutmali; bazilari uctan uca (kasa dagilimi)."""
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'fixtures'))
from ix_layouts import C
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
LOAD = """(sh)=>{LEDGER.length=0;S.settings.ixlay={};MXI.step='pick';MXI.pdec={};MXI.dec={};MXI.ch='';MXI.plan=null;
  ixLoadSheets(sh.map(s=>({name:s[0],rows:s[1].map((r,i)=>{const a=r.slice();a.__n=i+1;return a})})),'t.xlsx');S.modal={type:'mximp'};renderModal();"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'}}")
    for n, sheets, exp in C:
        t = ev(LOAD + """let g=0,d=0,k=0;MXI.sheets.forEach((s,i)=>{ixSetSheet(i);if(MXI.type!=='defter')return;MXI.dec={rate:'0',incl:'yes',dfmt:'dmy',nd:'skip'};const R=ixBuild('defter',MXI.map,s._p);R.out.forEach(o=>{if(o.dir==='gelir')g+=o.total;else d+=o.total;k++})});return {g,d,k}}""", sheets)
        ok = exp is None or (abs(t['g'] - exp[0]) < 0.01 and abs(t['d'] - exp[1]) < 0.01 and t['k'] == exp[2])
        check('Duzen ' + n, ok, {'beklenen': exp, 'okunan': t})
    def e2e(idx, fn):
        n, sheets, exp = [c for c in C if c[0].startswith(str(idx) + ' ')][0]
        ev(LOAD + "MXI.dec={rate:'0',incl:'yes',dfmt:'dmy',nd:'skip'};renderModal();}", sheets)
        for i in range(ev("()=>MXI.sheets.length")):
            ev("(i)=>{ixSetSheet(i);MXI.step='map';MXI.dec={rate:'0',incl:'yes',dfmt:'dmy',nd:'skip'};H.iximport()}", i); pg.wait_for_timeout(150)
        return ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>[r.dir||'gider',r.total,r.ch||''])")
    L = e2e(25, None)
    nk = sum(x[1] for x in L if x[2] == 'nakit'); bk = sum(x[1] for x in L if x[2] == 'banka')
    check('Gunluk satis: nakit 1800, kart/banka 700', nk == 1800 and bk == 700, L)
    L = e2e(26, None)
    check('Yevmiye: gelir 1000 ve gider 500 nakit kasada', sorted(L) == sorted([['gelir', 1000, 'nakit'], ['gider', 500, 'nakit']]), L)
    L = e2e(33, None)
    check('Ayni satirda gelir+gider iki kayit olur', sorted((x[0], x[1]) for x in L) == [('gelir', 1000), ('gider', 200)], L)
    L = e2e(4, None)
    check('Gelirler/Giderler sayfalari yonu sayfa adindan alir', sorted((x[0], x[1]) for x in L) == [('gelir', 250), ('gelir', 1000), ('gider', 100), ('gider', 500)], L)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
