"""Gercek .xlsx dosyalari (birlesik hucre, gercek tarih, formul, yan yana tablo, aylik matris) dosya secme yolundan okunur."""
import os, datetime, tempfile
from openpyxl import Workbook
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
D = tempfile.mkdtemp(); files = {}
wb = Workbook(); ws = wb.active; ws.title = 'Kasa'; ws.merge_cells('A1:D1'); ws['A1'] = 'ACME LTD - KASA DEFTERİ'
ws.append([]); ws.append(['Tarih', 'Açıklama', 'Gelir', 'Gider'])
ws.append([datetime.date(2026, 11, 3), 'Satış', 1000, None]); ws.append([datetime.date(2026, 11, 4), 'Kira', None, 500]); ws.append([datetime.date(2026, 11, 5), 'Satış 2', '=500+250', None]); ws.append([None, 'TOPLAM', '=SUM(C4:C6)', '=SUM(D4:D6)'])
files['merged'] = (D + '/merged.xlsx', (1750, 500, 3)); wb.save(files['merged'][0])
wb = Workbook(); ws = wb.active; ws.title = 'Defter'; ws.append(['GELİRLER', None, None, None, 'GİDERLER', None, None]); ws.append(['Tarih', 'Açıklama', 'Tutar', None, 'Tarih', 'Açıklama', 'Tutar'])
ws.append([datetime.date(2026, 11, 3), 'Satış', 1000, None, datetime.date(2026, 11, 4), 'Kira', 500]); ws.append([datetime.date(2026, 11, 5), 'Satış 2', 250, None, datetime.date(2026, 11, 6), 'Un', 100])
files['yanyana'] = (D + '/yanyana.xlsx', (1250, 600, 4)); wb.save(files['yanyana'][0])
wb = Workbook(); ws = wb.active; ws.title = '2026'; ws.append(['Kalem', 'Ocak', 'Şubat', 'Mart', 'Toplam']); ws.append(['GELİRLER']); ws.append(['Satış', 1000, 1200, 900, '=SUM(B3:D3)']); ws.append(['GİDERLER']); ws.append(['Kira', 500, 500, 500, '=SUM(B5:D5)'])
files['matris'] = (D + '/matris.xlsx', (3100, 1500, 6)); wb.save(files['matris'][0])
wb = Workbook(); ws1 = wb.active; ws1.title = 'Gelirler'; ws1.append(['Tarih', 'Açıklama', 'Tutar']); ws1.append([datetime.date(2026, 11, 3), 'Satış', 1000]); ws2 = wb.create_sheet('Giderler'); ws2.append(['Tarih', 'Açıklama', 'Tutar']); ws2.append([datetime.date(2026, 11, 4), 'Kira', 500])
files['ayri'] = (D + '/ayri.xlsx', (1000, 500, 2)); wb.save(files['ayri'][0])
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'}}")
    for k, (path, exp) in files.items():
        ev("()=>{LEDGER.length=0;S.settings.ixlay={};MXI.step='pick';MXI.sheets=[];MXI.dec={};MXI.plan=null;S.modal={type:'mximp'};renderModal()}")
        pg.set_input_files('#ix-file', path); pg.wait_for_timeout(1500)
        t = ev("""()=>{let g=0,d=0,k=0;(MXI.sheets||[]).forEach((s,i)=>{ixSetSheet(i);if(MXI.type!=='defter')return;MXI.dec={rate:'0',incl:'yes',dfmt:'dmy',nd:'skip'};const R=ixBuild('defter',MXI.map,s._p);R.out.forEach(o=>{if(o.dir==='gelir')g+=o.total;else d+=o.total;k++})});return {g,d,k,n:(MXI.sheets||[]).length}}""")
        check('xlsx ' + k, abs(t['g'] - exp[0]) < 0.01 and abs(t['d'] - exp[1]) < 0.01 and t['k'] == exp[2], {'beklenen': exp, 'okunan': t})
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
