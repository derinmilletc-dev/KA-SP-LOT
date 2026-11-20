"""Aktarim: ozet, kopya korumasi, kategori onerisi (kendi gecmisinden), devir satiri."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
rows = [['Tarih','Açıklama','Ödeme Şekli','Gelir','Gider'],
        ['03.11.2026','Devir','','5.000,00',''],
        ['03.11.2026','Un alımı','Nakit','','550,00'],['04.11.2026','Satış','Kredi Kartı','2.500,00',''],
        ['05.11.2026','Kira','Havale','','6.000,00']]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'};LEDGER.length=0;LEDGER.push({id:'m1',date:'1 Kas',iso:'2026-11-01',desc:'Un alımı',acc:'Hammadde',doc:'—',rate:0,total:300,dir:'gider'},{id:'m2',date:'5 Kas',iso:'2026-11-05',desc:'Elle kira',acc:'Kira',doc:'—',rate:0,total:6000,dir:'gider'})}")
    def load():
        ev("(R)=>{const a=R.map((r,i)=>{r.__n=i+1;return r});MXI.step='pick';MXI.pdec={};MXI.dec={};ixLoadSheets([{name:'Gelir Gider',rows:a}],'t.xlsx');S.modal={type:'mximp'};renderModal();MXI.dec={rate:'0',incl:'yes',dfmt:'dmy'}}", rows)
    load()
    R = ev("()=>{const sh=ixCur();const R=ixBuild(MXI.type,MXI.map,sh._p);return {n:R.out.length,sm:R.sm,sug:R.sug,near:R.near,devir:R.devir,acc:R.out.map(o=>[o.desc,o.acc])}}")
    check('Devir satiri gelir sayilmadi', R['n'] == 3 and R['devir'] == 1, R)
    check('Ozet gelir/gider dogru', R['sm']['gelir'] == 2500 and R['sm']['gider'] == 6550, R)
    check('Kasa dagilimi 1 nakit 2 banka', R['sm']['nakit'] == 1 and R['sm']['banka'] == 2, R)
    check('Kategori gecmisten onerildi', dict(R['acc'])['Un alımı'] == 'Hammadde' and R['sug'] == 1, R)
    check('Elle kayitla ayni tutar uyarisi', R['near'] == 1, R)
    check('Ozet HTML uretildi', 'Gelir' in ev("()=>{const sh=ixCur();return ixSumHtml(ixBuild(MXI.type,MXI.map,sh._p))}"))
    ev("()=>H.iximport()"); pg.wait_for_timeout(200)
    n1 = ev("()=>LEDGER.filter(r=>r.src==='Excel').length")
    check('Ilk aktarim 3 satir', n1 == 3, n1)
    load(); ev("()=>H.iximport()"); pg.wait_for_timeout(200)
    n2 = ev("()=>LEDGER.filter(r=>r.src==='Excel').length")
    check('Ayni dosya ikinci kez: kopya eklenmedi', n2 == 3, n2)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
