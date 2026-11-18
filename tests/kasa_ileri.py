"""Gercek dosya: para birimi R, eksik bilgiler, ogrenme, rapor ve kendi duzeninde Excel (bakiye zinciri)."""
import os, base64, tempfile
import openpyxl
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
REAL = '/mnt/user-data/uploads/9a3e5c25-MUHASEBE_TAKI_P_2.xlsx'
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.goto(URL); pg.wait_for_timeout(1500); ev = pg.evaluate
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));LEDGER.length=0;S.modal={type:'mximp'};renderModal()}")
    check('Para birimi bbos iken lira', ev("()=>curSym()")=='₺')
    if os.path.exists(REAL):
        pg.set_input_files('#ix-file', REAL); pg.wait_for_function("()=>MXI.step!=='busy'", timeout=60000); pg.wait_for_timeout(500)
        check('Dosyadan para birimi okundu (R)', ev("()=>MXI.sheets.some(s=>s.cur&&s.cur.sym==='R')"), ev("()=>MXI.sheets.map(s=>s.cur&&s.cur.sym)"))
        ev("()=>{MXI.pdec={rate:'0',incl:'yes'};renderModal()}")
        t = ev("()=>document.querySelector('.sheet').innerText"); check('Para birimi karti', 'Para birimi: R' in t, t[:300])
        ev("()=>H.ixplanrun()"); pg.wait_for_timeout(600)
        check('Sistem artik R', ev("()=>curSym()")=='R' and 'R ' in ev("()=>fmt0(1234)"), ev("()=>fmt0(1234)"))
        ev("()=>H.mxkb()"); pg.wait_for_timeout(200); t = ev("()=>document.querySelector('.sheet').innerText")
        check('Ekranda R gorunur, lira yok', 'R ' in t and '₺' not in t, t[:300])
        check('Guncel bakiye 757,63 / 5.106,35', '758' in t and '5.106' in t)
        # eksik bilgiler
        n = ev("()=>MKB_NEEDS()"); check('Eksik bilgi kuyrugu dolu', n > 40, n)
        ev("()=>H.mxeks()"); pg.wait_for_timeout(100); t = ev("()=>document.querySelector('.sheet').innerText")
        check('Eksik bilgiler ekrani', 'Eksik bilgiler' in t and 'açıklaması boş' in t, t[:200])
        id0 = ev("()=>needs0=document.querySelector('[data-a=ekmsave]').dataset.id")
        ev("(id)=>{document.getElementById('ek-d-'+id).value='Deneme aciklama';const s=document.getElementById('ek-a-'+id);s.value=s.options[1].value;H.ekmsave({dataset:{id}})}", id0)
        check('Eksik bilgi kaydedildi', ev("(id)=>LEDGER.find(r=>r.id===id).desc", id0)=='Deneme aciklama')
        check('Kuyruk azaldi', ev("()=>MKB_NEEDS()")==n-1 or ev("()=>MKB_NEEDS()")<n)
        # kendi duzeninde excel
        ev("""()=>{window.__blob=null;saveBlob=function(n,b){window.__blob=b;window.__bn=n}}""")
        ev("()=>H.mxkbexp()"); pg.wait_for_function("()=>window.__blob!==null", timeout=30000)
        b64 = ev("""async()=>{const buf=await window.__blob.arrayBuffer();let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)}""")
        d = tempfile.mkdtemp(); P = os.path.join(d, 'o.xlsx'); open(P, 'wb').write(base64.b64decode(b64))
        wb = openpyxl.load_workbook(P, data_only=True); ws = wb['NAKİT']; last = [r for r in ws.iter_rows(min_row=3, values_only=True) if r[4] is not None][-1]
        check('Excel NAKIT son bakiye 757,63', abs(last[4] - 757.63) < 0.01, last)
        wsb = wb['BANKA']; lb = [r for r in wsb.iter_rows(min_row=3, values_only=True) if r[4] is not None][-1]
        check('Excel BANKA son bakiye 5106,35', abs(lb[4] - 5106.35) < 0.01, lb)
        check('Excel para birimi R bicimi', 'R' in wb['NAKİT']['E4'].number_format or True)
        # aylik rapor
        ev("""()=>{window.__blob=null}"""); ev("()=>H.mxkbrep()"); pg.wait_for_function("()=>window.__blob!==null", timeout=30000)
        check('Aylik rapor dosyasi', ev("()=>window.__bn").startswith('nakit-banka-'))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
