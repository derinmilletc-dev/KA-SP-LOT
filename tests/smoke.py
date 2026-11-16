"""KaisPilot duman testi: index.html'i file:// ile acar, rolleri/ekranlari/pencereleri gezer,
hata, 'undefined/NaN' sizintisi ve temel muhasebe hesaplarini dogrular.
Calistir: python3 tests/smoke.py   (gerek: pip install playwright && playwright install chromium)"""
import os, sys
from playwright.sync_api import sync_playwright

URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
ROLES = ['patron', 'mudur', 'muhasebeci', 'calisan']
# Bunlar parametreyle acilir (ornegin secili kayit); bos acilinca hata vermesi beklenen pencereler.
NEED_PARAMS = {'pwtemp', 'cntsum', 'invnew', 'invcode', 'rznew', 'etiket', 'fatura'}
BAD = r'/undefined|NaN|\[object/'
fails = []


def check(name, cond, extra=''):
    print(('OK   ' if cond else 'FAIL ') + name + (' ' + str(extra) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in ((390, 844), (1366, 768)):
        pg = b.new_page(viewport={'width': w, 'height': h})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL)
        pg.wait_for_timeout(700)
        check(f'[{w}] acilis hatasiz', not errs, errs)

        for role in ROLES:
            pg.evaluate("(r)=>{loginAs(USERS.find(u=>u.role===r));S.modal=null;render()}", role)
            views = pg.evaluate("()=>[...new Set([...document.querySelectorAll('button.nav[data-a=nav]')].map(e=>e.dataset.v))]")
            check(f'[{w}] {role}: menu bos degil', len(views) >= 3, views)
            for v in views:
                errs.clear()
                pg.evaluate("(v)=>{S.modal=null;S.view=v;render()}", v)
                txt = pg.evaluate("()=>(document.querySelector('main')||document.body).innerText")
                bad = pg.evaluate("(t)=>/undefined|NaN|\\[object/.test(t)", txt)
                check(f'[{w}] {role}/{v}: hatasiz ve dolu', not errs and len(txt.strip()) > 20 and not bad, errs or txt[:80])

            r = pg.evaluate("""(skip)=>{const bad=[];for(const k of Object.keys(NEWM)){if(skip.includes(k))continue;
              try{S.modal={type:k};renderModal();const t=(document.getElementById('modal-root')||{}).innerText||'';
              if(/undefined|NaN|\\[object/.test(t))bad.push(k+':metin')}catch(e){bad.push(k+':'+String(e).slice(0,60))}finally{S.modal=null}}return bad}""", list(NEED_PARAMS))
            check(f'[{w}] {role}: tum pencereler acilir', not r, r)
        pg.close()

    # --- muhasebe hesaplari ---
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.goto(URL)
    pg.wait_for_timeout(700)
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe'}")
    kdv = pg.evaluate("""()=>{const ym=fiIso().slice(0,7);LEDGER.length=0;
      LEDGER.push({id:'a',iso:ym+'-02',date:'2',desc:'S',acc:'Satış',doc:'Fatura',rate:10,total:1100,dir:'gelir'},
        {id:'b',iso:ym+'-03',date:'3',desc:'S2',acc:'Satış',doc:'Fatura',rate:20,total:1200,dir:'gelir'},
        {id:'c',iso:ym+'-04',date:'4',desc:'Un',acc:'Mal',doc:'Fiş',rate:10,total:550,dir:'gider'},
        {id:'d',iso:ym+'-05',date:'5',desc:'N',acc:'Diğer',doc:'—',rate:20,total:240,dir:'gider'});
      const K=mxKdv(ym);return [K.hes,K.ind,K.net,K.nodoc,K.nodocAmt]}""")
    check('KDV: hesaplanan/indirilecek/net/belgesiz', kdv == [300, 50, 250, 1, 240], kdv)
    age = pg.evaluate("""()=>{const iso=d=>new Date(Date.now()+d*864e5).toISOString().slice(0,10);
      return mxAge([{amt:100,due:iso(-3),who:'A'},{amt:50,due:iso(10),who:'B'}]).map(x=>[x.t,x.c])}""")
    check('Yaslandirma: kovalar', age[0] == [50, 1] and age[1] == [100, 1] and sum(x[0] for x in age) == 150, age)
    fc = pg.evaluate("()=>{S.settings.cashStart=1000;S.modal=null;const F=mxForecast(90);return typeof F.d30==='number'&&typeof F.d90==='number'&&isFinite(F.d30)}")
    check('Nakit tahmini sayisal', fc)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.evaluate("()=>{H.mxpaket()}")
    t = pg.evaluate("()=>document.getElementById('modal-root').innerText")
    check('Excel donem dosyasi penceresi acilir', 'Excel dönem dosyası' in t and not errs, errs)
    pg.close()
    b.close()

print('\nBASARISIZ:' if fails else '\nHEPSI GECTI', len(fails) or '')
sys.exit(1 if fails else 0)
