"""Aktarim v249: satir duzeltme, para birimi, duzen hafizasi, coklu dosya, aylik bakiye."""
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
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'};LEDGER.length=0;S.settings=S.settings||{};}")
    def load(rows, name='Gelir Gider'):
        ev("(a)=>{const R=a[0];const a2=R.map((r,i)=>{r.__n=i+1;return r});MXI.step='pick';MXI.pdec={};MXI.dec={};MXI.ch='';ixLoadSheets([{name:a[1],rows:a2}],'t.xlsx');S.modal={type:'mximp'};renderModal();MXI.dec={rate:'0',incl:'yes',dfmt:'dmy',nd:'skip'};renderModal()}", [rows, name])
    build = "()=>{const sh=ixCur();const R=ixBuild(MXI.type,MXI.map,sh._p);return {n:R.out.length,fixl:R.fixl.map(x=>x.n),skip:R.skip.map(x=>x.why),mon:R.mon,bad:R.balBad,out:R.out.map(o=>[o.desc,o.total,o.dir,o.iso])}}"
    # 1) satir duzeltme
    load([['Tarih','Açıklama','Gelir','Gider'],['03.11.2026','Normal','100,00',''],['','Tarihsiz','','55,00'],['05.11.2026','Tutarsiz','','']])
    R = ev(build)
    check('2 duzeltilebilir satir', sorted(R['fixl']) == [3, 4], R)
    ev("()=>{MXI.fix={'0:3':{iso:'2026-11-06',total:0,dir:''},'0:4':{iso:'',total:70,dir:'gider'}}}")
    R = ev(build)
    check('Duzeltilen satirlar eklendi', R['n'] == 3 and not R['fixl'], R)
    d = {o[0]: o for o in R['out']}
    check('Tarihsiz: tutar satirdan, tarih elle', d['Tarihsiz'][1] == 55 and d['Tarihsiz'][3] == '2026-11-06', R)
    check('Tutarsiz: tutar elle, tarih satirdan', d['Tutarsiz'][1] == 70 and d['Tutarsiz'][3] == '2026-11-05', R)
    # DOM akisi
    load([['Tarih','Açıklama','Gelir','Gider'],['03.11.2026','Normal','100,00',''],['05.11.2026','Tutarsiz','','']])
    pg.fill('#ixf-a-3', '70,50'); pg.click('button[data-a="ixfixadd"]'); pg.wait_for_timeout(200)
    R = ev(build); check('Ekrandan duzeltme', R['n'] == 2 and not R['fixl'], R)
    # 2) para birimi
    ev("()=>{S.settings.kcur={banka:{sym:'$',code:'USD'}}}")
    load([['Tarih','Açıklama','Para Birimi','Gelir','Gider'],['03.11.2026','Dolar satis','USD','100,00',''],['04.11.2026','Euro satis','EUR','50,00',''],['05.11.2026','Lira','TL','10,00','']])
    R = ev(build); check('USD banka kasasina, EUR atlandi, TL normal', R['n'] == 2 and any('EUR' in w for w in R['skip']), R)
    ev("()=>H.iximport()"); pg.wait_for_timeout(200)
    L = ev("()=>LEDGER.filter(r=>r.src==='Excel').map(r=>[r.desc,r.ch||''])"); d = dict(L)
    check('USD satiri banka kasasi', d.get('Dolar satis') == 'banka' and d.get('Lira') == '', L)
    ev("()=>{S.settings.kcur={};LEDGER.length=0}")
    # 3) duzen hafizasi
    rows = [['Tarih','Not','Para','Cikan'],['03.11.2026','X','100,00',''],['04.11.2026','Y','','5,00']]
    load(rows); ev("()=>{const sh=ixCur();MXI.type='defter';MXI.map={date:0,desc:1,gelir:2,gider:3};H.iximport()}"); pg.wait_for_timeout(200)
    ev("()=>LEDGER.length=0")
    load(rows)
    m = ev("()=>({map:MXI.map,note:!!MXI.layNote})")
    check('Ayni duzen: sutunlar hafizadan', m['map'].get('gelir') == 2 and m['map'].get('gider') == 3 and m['note'], m)
    # 4) coklu dosya
    ev("()=>{MXI.step='pick';MXI.sheets=[];S.modal={type:'mximp'};renderModal()}")
    pg.set_input_files('#ix-file', ['/tmp/csvt/ocak.csv', '/tmp/csvt/subat.csv']); pg.wait_for_timeout(800)
    ns = ev("()=>(MXI.sheets||[]).map(s=>s.name)")
    check('Iki dosya tek seferde yuklendi', len(ns) == 2 and 'ocak' in ns[0] and 'subat' in ns[1], ns)
    # 5) aylik dokum + bakiye
    load([['Tarih','Açıklama','Gelir','Gider','Bakiye'],['03.11.2026','a','100,00','','1000,00'],['04.11.2026','b','','40,00','960,00'],['05.12.2026','c','200,00','','1160,00'],['06.12.2026','d','','10,00','1100,00']], 'Kasa')
    R = ev(build)
    check('Aylik dokum 2 ay', len(R['mon'] or []) == 2, R)
    check('Bakiye tutarsizligi bulundu (12/2026)', R['bad'] and R['bad']['ym'] == '2026-12', R)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
