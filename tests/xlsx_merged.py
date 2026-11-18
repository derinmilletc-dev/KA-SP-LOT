"""Gercek xlsx: birlesik baslik hucresi, tarih hucreleri, devir satiri, bos bakiye satirlari, gelir/gider/bakiye toplamlari."""
import os, datetime, tempfile
import openpyxl
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
d = tempfile.mkdtemp(); P = os.path.join(d, 'm.xlsx')
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'NAKİT'
ws['A1'] = 'BÜYÜK ÇAMLICA NAKİT MUHASEBE TAKİBATI'; ws.merge_cells('A1:H1')
ws.append([None, 'HESAP TÜRÜ', 'HESAP ADI', 'BELGE NUMARASI', 'GELİRLER', 'GİDERLER', 'KASA BAKİYESİ', 'AÇIKLAMA'])
D = datetime.datetime
ws.append([D(2026, 8, 1), None, 'AĞUSTOS DEVREDEN', None, 1300, None, 1300, 'DEVİR'])
ws.append([D(2026, 8, 3), 'ÖN MUHASEBE', 'PERSONEL HEDİYE', None, None, 920, 380, 'HEDİYE'])
ws.append([D(2026, 8, 6), 'ÖN MUHASEBE', 'KERMES GELİRİ', None, 1500, None, 1880, 'SATIŞ'])
ws.append([None, None, None, None, None, None, 1880, None]); ws.append([None, None, None, None, None, None, 1880, None])
wb.save(P)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.goto(URL); pg.wait_for_timeout(1500); ev = pg.evaluate
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));LEDGER.length=0;S.modal={type:'mximp'};renderModal()}")
    pg.set_input_files('#ix-file', P); pg.wait_for_function("()=>MXI.step!=='busy'", timeout=60000); pg.wait_for_timeout(300)
    r = ev("()=>{const sh=MXI.sheets[0];const P=ixPrep(sh);MXI.dec={rate:'0',incl:'yes'};const R=ixBuild('defter',ixAuto('defter',P),P);return {heads:P.heads,n:R.out.length,sk:R.skip.map(x=>x.why),g:R.out.filter(o=>o.dir==='gelir').reduce((t,o)=>t+o.total,0),d:R.out.filter(o=>o.dir==='gider').reduce((t,o)=>t+o.total,0)}}")
    check('Birlesik baslik: gercek baslik secildi', r['heads'][4]=='GELİRLER', r['heads'])
    check('Devir gelir sayilmaz, bos bakiye satirlari atlanir', r['n']==2 and r['g']==1500 and r['d']==920, r)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
