"""Excel aktarim: satir bazinda 'Odeme sekli' sutunundan nakit/banka ayrimi; tahmin yok."""
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
    def load(rows, name='Gelir Gider'):
        ev("()=>{LEDGER.length=0;MXI.step='pick';MXI.pdec={};MXI.dec={};MXI.ch='';}")
        ev("""(R)=>{const a=R.map((r,i)=>{r.__n=i+1;return r});ixLoadSheets([{name:%r,rows:a}],'t.xlsx');S.modal={type:'mximp'};renderModal();}""" % name, rows)
        pg.wait_for_timeout(150)
    def go():
        ev("()=>{MXI.dec={rate:'0',incl:'yes',dfmt:'dmy'};renderModal()}"); ev("()=>H.iximport()"); pg.wait_for_timeout(200)
    rows = [['Tarih','Açıklama','Ödeme Şekli','Gelir','Gider'],
            ['03.11.2026','Satış 1','Nakit','1.000,00',''],['04.11.2026','Kira','Havale','','6.000,00'],['05.11.2026','Satış 2','Kredi Kartı','2.500,00',''],
            ['06.11.2026','Un','Nakit','','550,00'],['07.11.2026','Bilinmeyen','Karışık','','10,00']]
    load(rows); go()
    L = ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>[r.desc,r.ch||'',r.total,r.dir])")
    d = {x[0]: x for x in L}
    check('5 satir aktarildi', len(L) == 5, L)
    check('Nakit satirlari', d['Satış 1'][1] == 'nakit' and d['Un'][1] == 'nakit', L)
    check('Havale ve kredi karti banka', d['Kira'][1] == 'banka' and d['Satış 2'][1] == 'banka', L)
    check('Taninmayan deger belirtilmemis kalir (tahmin yok)', d['Bilinmeyen'][1] == '', L)
    check('Tutar ve yon dogru', d['Kira'][2] == 6000 and d['Kira'][3] == 'gider' and d['Satış 2'][2] == 2500 and d['Satış 2'][3] == 'gelir', L)
    check('Ozet metni kaynak sutunu soyler', 'Ödeme şekli sütunu' in ev("()=>MXI.done?MXI.done.txt:''"), ev("()=>MXI.done"))
    # sayfa adi 'Banka' ise sayfa duzeyi kazanir
    load([['Tarih','Açıklama','Gelir','Gider'],['03.11.2026','A','100,00',''],['04.11.2026','B','','40,00']], 'Banka Hareketleri'); go()
    L = ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>r.ch||'')")
    check('Sayfa adi Banka: tum satirlar banka', L == ['banka', 'banka'], L)
    # ödeme sütunu yok, sayfa adı belirsiz: belirtilmemiş
    load([['Tarih','Açıklama','Gelir','Gider'],['03.11.2026','A','100,00',''],['04.11.2026','B','','40,00']], 'Sayfa1'); go()
    L = ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>r.ch||'')")
    check('Belirsiz sayfa: belirtilmemis kalir', L == ['', ''], L)
    # İngilizce başlıklar
    load([['Date','Description','Income','Expense','Method'],['2026-11-03','Sale','100','','Cash'],['2026-11-04','Rent','','50','Bank transfer'],['2026-11-05','Tip','5','','Cash']], 'Sheet1'); go()
    L = ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>[r.desc,r.ch||''])")
    check('Ingilizce: Cash/Bank transfer', dict(L).get('Sale') == 'nakit' and dict(L).get('Rent') == 'banka', L)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
