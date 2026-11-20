"""Excel disa aktarma: nakit/banka, para birimi ayrimi, gunluk/haftalik/aylik/yillik sayfalar.
Sayilar LibreOffice ile yeniden hesaplanip bagimsiz Python toplamlariyla karsilastirilir."""
import os, sys, tempfile, warnings, subprocess, shutil, datetime as dt
warnings.filterwarnings('ignore')
import openpyxl
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
if not shutil.which('soffice'):
    print('SKIP  LibreOffice yok'); sys.exit(0)
tmp = tempfile.mkdtemp()
ROWS = [  # iso, yon, kasa, para, tutar, kdv%
  ('2026-11-03', 'gelir', 'nakit', 'TRY', 1000, 10), ('2026-11-03', 'gider', 'nakit', 'TRY', 400, 20), ('2026-11-10', 'gelir', 'nakit', 'TRY', 500, 0),
  ('2026-11-03', 'gelir', 'banka', 'USD', 200, 0), ('2026-11-04', 'gider', 'banka', 'USD', 50, 0), ('2025-12-30', 'gelir', 'banka', 'USD', 300, 0),
  ('2026-10-15', 'gider', '', 'TRY', 120, 20), ('2026-11-03', 'gelir', '', 'TRY', 80, 10), ('2026-01-01', 'gelir', 'banka', 'USD', 7.5, 0),
]
SYM = {'TRY': '₺', 'USD': '$'}
KAS = {'nakit': 'Nakit', 'banka': 'Banka', '': 'Belirtilmemiş'}
def recalc(f):
    out = os.path.join(tmp, 'rc'); os.makedirs(out, exist_ok=True)
    subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx', '--outdir', out, f], capture_output=True, timeout=150)
    return openpyxl.load_workbook(os.path.join(out, os.path.basename(f)), data_only=True)
rows = lambda ws: [list(r) for r in ws.iter_rows(values_only=True)]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, accept_downloads=True); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700); ev = pg.evaluate
    ev("""(R)=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe';
      S.settings=S.settings||{};S.settings.kcur={banka:{sym:'$',code:'USD'}};
      LEDGER.length=0;INV.length=0;DEBTS.length=0;
      R.forEach((x,i)=>{const o={id:'t'+i,iso:x[0],date:'x',desc:'Satir '+i,acc:x[1]==='gelir'?'Satış':'Hammadde',doc:'Fatura',rate:x[5],total:x[4],dir:x[1],src:'Excel'};if(x[2])o.ch=x[2];LEDGER.push(o)});render()}""", ROWS)
    check('Satir para birimleri doğru (nakit ₺, banka $)', ev("()=>[rowCurSym(LEDGER[0]),rowCurSym(LEDGER[3]),rowCurSym(LEDGER[6])]") == ['₺', '$', '₺'])
    with pg.expect_download(timeout=30000) as d: ev("()=>H.xlsx(null)")
    f = os.path.join(tmp, d.value.suggested_filename); d.value.save_as(f)
    wb0 = openpyxl.load_workbook(f)
    check('Sayfalar: Özet, Gelirler, Giderler, Günlük, Haftalık, Aylık, Yıllık', all(n in wb0.sheetnames for n in ['Özet', 'Gelirler', 'Giderler', 'Günlük', 'Haftalık', 'Aylık', 'Yıllık']), wb0.sheetnames)
    wv = recalc(f)
    # Gelirler / Giderler: kasa ve para birimi sutunlari
    gel = [r for r in rows(wv['Gelirler'])[1:] if r[0]]; gid = [r for r in rows(wv['Giderler'])[1:] if r[0]]
    exp_g = sorted((KAS[x[2]], SYM[x[3]], x[4]) for x in ROWS if x[1] == 'gelir'); exp_d = sorted((KAS[x[2]], SYM[x[3]], x[4]) for x in ROWS if x[1] == 'gider')
    check('Gelirler: kasa + para birimi + tutar', sorted((r[10], r[11], r[7]) for r in gel) == exp_g, sorted((r[10], r[11], r[7]) for r in gel))
    check('Giderler: kasa + para birimi + tutar', sorted((r[10], r[11], r[7]) for r in gid) == exp_d, sorted((r[10], r[11], r[7]) for r in gid))
    check('Gelirler: toplam satiri yok (farkli para birimi toplanmaz)', not any(str(r[0]) == 'Toplam' for r in rows(wv['Gelirler'])))
    # Özet
    ov = {str(r[0]): r for r in rows(wv['Özet']) if r and r[0]}
    def tot(cur, yon): return sum(x[4] for x in ROWS if SYM[x[3]] == cur and x[1] == yon)
    for cur in ['₺', '$']:
        t = ov.get('Tüm veriler (%s)' % cur)
        check('Özet %s: gelir/gider/net' % cur, t and abs(t[1] - tot(cur, 'gelir')) < .001 and abs(t[2] - tot(cur, 'gider')) < .001 and abs(t[3] - (tot(cur, 'gelir') - tot(cur, 'gider'))) < .001, t)
    # Özet: nakit/banka bloğu (ilk blok ₺: Nakit, Banka, Belirtilmemiş)
    ozr = rows(wv['Özet'])
    kas_rows = [r for r in ozr if r and r[0] in ('Nakit', 'Banka', 'Belirtilmemiş')]
    check('Özet: nakit/banka satirlari', len(kas_rows) >= 3, kas_rows)
    nak = kas_rows[0]; check('Özet ₺ Nakit: gelir 1500, gider 400, net 1100', (nak[1], nak[2], nak[3]) == (1500, 400, 1100), nak)
    # Dönem sayfaları: bağımsız toplam
    def start_of(iso, name):
        d = dt.date.fromisoformat(iso)
        if name == 'Günlük': return d
        if name == 'Haftalık': return d - dt.timedelta(days=d.weekday())
        if name == 'Aylık': return d.replace(day=1)
        return d.replace(month=1, day=1)
    for name in ['Günlük', 'Haftalık', 'Aylık', 'Yıllık']:
        exp = {}
        for iso, yon, ch, cur, tut, kdv in ROWS:
            k = (start_of(iso, name), SYM[cur]); a = exp.setdefault(k, [0.0] * 6)
            a[({'Nakit': 0, 'Banka': 2, 'Belirtilmemiş': 4}[KAS[ch]]) + (0 if yon == 'gelir' else 1)] += tut
        got = {}
        for r in rows(wv[name])[1:]:
            if r[0] and isinstance(r[1], dt.datetime) and r[3]: got[(r[1].date(), r[3])] = [float(x or 0) for x in r[4:10]] + [float(r[10] or 0), float(r[11] or 0), float(r[12] or 0)]
        ok = set(got) == set(exp) and all(all(abs(got[k][i] - exp[k][i]) < .001 for i in range(6)) for k in exp)
        check('%s sayfasi: her donem x para birimi bagimsiz toplamla ayni (%d satir)' % (name, len(exp)), ok, {str(k): (got.get(k), exp.get(k)) for k in exp if got.get(k) is None or any(abs(got[k][i] - exp[k][i]) > .001 for i in range(6))})
        ok2 = all(abs(v[6] - (v[0] + v[2] + v[4])) < .001 and abs(v[7] - (v[1] + v[3] + v[5])) < .001 and abs(v[8] - (v[6] - v[7])) < .001 for v in got.values())
        check('%s: toplam gelir/gider/net tutarli' % name, ok2)
    # Toplam satırları para birimi ayrı
    tl = [r for r in rows(wv['Aylık']) if r and r[0] == 'Toplam' and r[3]]
    td = {r[3]: r for r in tl}
    check('Aylık: ₺ toplam gelir', abs(td['₺'][10] - tot('₺', 'gelir')) < .001 and abs(td['$'][10] - tot('$', 'gelir')) < .001 and abs(td['₺'][11] - tot('₺', 'gider')) < .001 and abs(td['$'][11] - tot('$', 'gider')) < .001, td)
    # Arayuz: farkli para birimleri "Hepsi" icinde toplanmaz
    ev("()=>{S.settings.kcur={banka:{sym:'$',code:'USD'}};S.tch='hepsi';render()}")
    ok_ = ev("()=>LEDGER.filter((r)=>tbChOk(r)).every((r)=>rowCurSym(r)==='₺')")
    check('Hepsi: yalnizca varsayilan para birimi kayitlari', ok_)
    check('Hepsi: sayi ₺ kayitlari kadar', ev("()=>LEDGER.filter((r)=>tbChOk(r)).length") == sum(1 for x in ROWS if SYM[x[3]] == '₺'))
    check('Banka secilince $ kayitlari gorunur', ev("()=>{S.tch='banka';const n=LEDGER.filter((r)=>tbChOk(r)).length;S.tch='hepsi';return n}") == sum(1 for x in ROWS if x[2] == 'banka'))
    check('Uyari metni: para birimleri toplanmaz', 'birbirine eklenmez' in ev("()=>{S.sub=S.sub||{};S.sub.tablo='gelir';return tbChChips()}"))
    # Tek para birimi: eski düzen korunur
    ev("()=>{S.settings.kcur={};render()}")
    with pg.expect_download(timeout=30000) as d: ev("()=>H.xlsx(null)")
    f2 = os.path.join(tmp, 'tek-' + d.value.suggested_filename); d.value.save_as(f2); w2 = recalc(f2)
    o2 = {str(r[0]): r for r in rows(w2['Özet']) if r and r[0]}
    check('Tek para birimi: Özet "Tüm veriler" etiketi ve toplamlar', 'Tüm veriler' in o2 and abs(o2['Tüm veriler'][1] - sum(x[4] for x in ROWS if x[1] == 'gelir')) < .001, o2.get('Tüm veriler'))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nBASARISIZ: %d' % len(fails) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
