"""Disari aktarmalar: Excel (muhasebe, KDV, paket, mizan), CSV, yedek. Dosya icerigi sayisal olarak dogrulanir."""
import os, sys, csv, io, json, tempfile, warnings, subprocess, shutil
warnings.filterwarnings('ignore')
import openpyxl
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, accept_downloads=True); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    ev = lambda js, *a: pg.evaluate(js, *a) if a else pg.evaluate(js)
    ev("""()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe';
      const ym=fiIso().slice(0,7);window.__ym=ym;LEDGER.length=0;INV.length=0;DEBTS.length=0;
      LEDGER.push({id:'a',iso:ym+'-02',date:'2 Kas',desc:'Satis A',acc:'Satış',doc:'Fatura',rate:10,total:1100,dir:'gelir'},
        {id:'b',iso:ym+'-03',date:'3 Kas',desc:'Satis B',acc:'Satış',doc:'Fatura',rate:20,total:1200,dir:'gelir'},
        {id:'c',iso:ym+'-04',date:'4 Kas',desc:'Un',acc:'Hammadde',doc:'Fiş',rate:10,total:550,dir:'gider'},
        {id:'d',iso:ym+'-05',date:'5 Kas',desc:'Belgesiz',acc:'Diğer',doc:'—',rate:20,total:240,dir:'gider'},
        {id:'e',iso:ym+'-06',date:'6 Kas',desc:'Kira',acc:'Kira',doc:'Fatura',rate:20,total:6000,dir:'gider'});
      INV.push({id:'i1',no:'F-1',date:'2 Kas',iso:ym+'-02',cust:'ABC Ltd',tot:1100,net:1000,due:ym+'-20',st:'bekliyor',lines:[{d:'x',q:1,p:1000,r:10}]},
               {id:'i2',no:'F-2',date:'3 Kas',iso:ym+'-03',cust:'Zeta AS',tot:1200,net:1000,due:ym+'-25',st:'odendi',lines:[{d:'x',q:1,p:1000,r:20}]});
      DEBTS.push({id:'d1',who:'Tedarikci',amt:900,due:ym+'-28',note:'Mal'});render()}""")
    def grab(call, ext):
        with pg.expect_download(timeout=20000) as d: ev(call)
        f = os.path.join(tmp, d.value.suggested_filename); d.value.save_as(f); return f
    HAVE = bool(shutil.which('soffice'))
    def recalc(f):
        if not HAVE: return openpyxl.load_workbook(f)  # formuller hesaplanamaz: bu dosyada sayisal kontroller atlanir
        out = os.path.join(tmp, 'rc'); os.makedirs(out, exist_ok=True)
        subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx', '--outdir', out, f], capture_output=True, timeout=120)
        return openpyxl.load_workbook(os.path.join(out, os.path.basename(f)), data_only=True)
    def rows(ws): return [list(r) for r in ws.iter_rows(values_only=True)]
    # ---- Excel: muhasebe
    fx = grab("()=>H.xlsx(null)", 'xlsx'); wb = openpyxl.load_workbook(fx)
    check('Excel: sayfalar', all(n in wb.sheetnames for n in ['Özet', 'Gelirler', 'Giderler', 'Borçlar', 'Alacaklar']), wb.sheetnames)
    wv = recalc(fx)
    if not HAVE: print('SKIP  LibreOffice yok: formul sonuclari kontrol edilmedi')
    gel = [r for r in rows(wv['Gelirler'])[1:] if r[0] and r[0] != 'Toplam']; gid = [r for r in rows(wv['Giderler'])[1:] if r[0] and r[0] != 'Toplam']
    check('Excel: donem sutunu ay adi (Kas 2026)', all('Kas' in str(r[0]) or '2026' in str(r[0]) for r in gel + gid) and all(r[0] != 'Diğer' for r in gel + gid), [r[:2] for r in gel + gid])
    check('Excel: gelir satirlari ve toplam 2300', len(gel) == 2 and sum(r[7] for r in gel) == 2300, gel)
    check('Excel: gider satirlari ve toplam 6790', len(gid) == 3 and sum(r[7] for r in gid) == 6790, gid)
    kdv_g = round(sum(r[6] for r in gel if isinstance(r[6], (int, float))), 2); kdv_i = round(sum(r[6] for r in gid if isinstance(r[6], (int, float))), 2)
    if HAVE: check('Excel: KDV sutunu (gelir 100+200, gider 50+1000+40)', kdv_g == 300 and abs(kdv_i - (50 + 1000 + 40)) < 0.02, [kdv_g, kdv_i])
    ov = {str(r[0]): r for r in rows(wv['Özet']) if r and r[0]}
    t = ov.get('Tüm veriler')
    if HAVE: check('Excel: ozet (hesaplanmis) gelir 2300, gider 6790, net -4490', t and (t[1], t[2], t[3]) == (2300, 6790, -4490), t)
    # ---- KDV Excel (belgesiz gider KDV'ye katilmaz)
    wb = recalc(grab("()=>H.mxkdvxl()", 'xlsx')); ws = wb[wb.sheetnames[0]]; vals = {str(r[0]): r for r in rows(ws) if r and r[0]}
    if HAVE: check('KDV Excel: hesaplanan 300 / indirilecek 1050 (belgesiz haric)', abs(vals['Hesaplanan KDV'][4] - 300) < .01 and abs(vals['İndirilecek KDV'][4] - 1050) < .01, [vals.get('Hesaplanan KDV'), vals.get('İndirilecek KDV')])
    check('KDV Excel: belgesiz gider ayrica listelendi', any('Belgesiz' in k for k in vals), list(vals)[:12])
    # ---- paket
    wb = openpyxl.load_workbook(grab("()=>H.mxpkdl()", 'xlsx'))
    d = [r for r in rows(wb['Defter'])[1:] if r[0] or r[1]]; f = [r for r in rows(wb['Faturalar'])[1:] if any(r)]; bo = [r for r in rows(wb['Borçlar'])[1:] if any(r)]
    check('Paket: defter 5, fatura 2, borc 1 satir', (len(d), len(f), len(bo)) == (5, 2, 1), (len(d), len(f), len(bo)))
    # ---- mizan
    wb = openpyxl.load_workbook(grab("()=>H.mhxl()", 'xlsx')); z = rows(wb['Mizan'])
    tot = [r for r in z if r[1] == 'Toplam'][0]
    check('Mizan Excel: borc=alacak', tot[3] == tot[4] and tot[3] > 0, tot)
    # ---- CSV / yedek
    t = open(grab("()=>H.expfat()", 'csv'), encoding='utf-8-sig').read(); rr = list(csv.reader(io.StringIO(t)))
    check('Fatura CSV: baslik + 2 fatura', len(rr) == 3, rr)
    t = open(grab("()=>H.kdvcsv()", 'csv'), encoding='utf-8-sig').read()
    check('KDV CSV uretildi', 'KDV' in t, t[:80])
    j = json.load(open(grab("()=>H.bkdl()", 'json')))
    check('Yedek: defter 5 ve fatura 2 icerir, sifre/oturum yok', len(j.get('LEDGER', [])) == 5 and len(j.get('INV', [])) == 2 and 'AUTH' not in j, list(j)[:8])
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('FAILED' if fails else 'ALL OK'); sys.exit(1 if fails else 0)
