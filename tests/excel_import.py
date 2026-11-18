"""Excel aktar: tarih biçimleri, tarihsiz satir (atlanmaz), dogru sayfa otomatik secilir (Aciklama sayfasi degil)."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'};}")
    cases = {'17.11.2026':'2026-11-17','17/11/2026':'2026-11-17','17-11-26':'2026-11-17','2026-11-17':'2026-11-17','2026-11-17T00:00:00.000Z':'2026-11-17','2026/11/7':'2026-11-07','2026.11.17':'2026-11-17','17 Kasım 2026':'2026-11-17','17 Kas 26':'2026-11-17','17.Kas.2026':'2026-11-17','17.11.2026 14:35':'2026-11-17','17.11.2026 Salı':'2026-11-17','46343':'2026-11-17','46343.6':'2026-11-17'}
    for k, v in cases.items():
        r = ev("(k)=>ixDate(k,'dmy')", k); check('Tarih: ' + k, r == v, r)
    check('Excel seri sayi', ev("()=>ixDate(46343,'dmy')") == '2026-11-17')
    check('Gecersiz metin tarih degil', ev("()=>ixDate('Market alışverişi','dmy')") is None)
    # 1) Aciklama sayfasi (tarih yok) + veri sayfasi: veri sayfasi secilir
    ev("""()=>{const rows=(a)=>a.map((r,i)=>{r.__n=i+1;return r});
      ixLoadSheets([{name:'ACIKLAMA',rows:rows([['Açıklama','Tutar'],['Kira',15000],['Market',2300],['Elektrik',1800]])},{name:'GELİR GİDER',rows:rows([['Tarih','Açıklama','Tutar'],['17.11.2026','Satış',4200],['18.11.2026','Kira',15000],['19.11.2026','Un',3100]])}],'t.xlsx')}""")
    pg.wait_for_timeout(100)
    check('Veri sayfasi otomatik secilir', ev("()=>MXI.sheets[MXI.si].name")=='GELİR GİDER', ev("()=>MXI.sheets[MXI.si].name"))
    check('Tarih eslesti', ev("()=>MXI.map.date")==0)
    # 2) Tarih sutunu olmayan sayfa: hicbir satir atlanmaz
    ev("()=>{ixSetSheet(0);MXI.dec={dir:'gider',rate:'20',incl:'yes'};MXI.type='defter'}")
    r = ev("()=>{const R=ixBuild('defter',MXI.map,ixCur()._p);return {out:R.out.length,skip:R.skip.length,nd:R.nd,dates:[...new Set(R.out.map(o=>o.iso))],need:R.need,pend:R.pend}}")
    check('Tarihsiz sayfada satirlar atlanmaz', r['skip']==0 and r['nd']==3, r)
    check('Varsayilan tarih bugun', r['dates']==[ev("()=>fiIso()")], r)
    ev("()=>{MXI.dec={dir:'gider',rate:'20',incl:'yes',nd:'d:2026-05-01'}}"); r = ev("()=>ixBuild('defter',MXI.map,ixCur()._p).out.map(o=>o.iso)")
    check('Secilen tarih kullanilir', set(r)=={'2026-05-01'}, r)
    ev("()=>{MXI.dec={dir:'gider',rate:'20',incl:'yes',nd:'skip'}}"); r = ev("()=>{const R=ixBuild('defter',MXI.map,ixCur()._p);return [R.out.length,R.skip.length]}")
    check('Atla secenegi', r==[0,3], r)
    # 3) bos tarih hucreleri: onceki satirin tarihi
    ev("""()=>{ixLoadSheets([{name:'Defter',rows:[['Tarih','Açıklama','Tutar'],['17.11.2026','A',100],['','B',200],['bozuk','C',300],['19.11.2026','D',400]].map((r,i)=>{r.__n=i+1;return r})}],'x');MXI.dec={dir:'gider',rate:'20',incl:'yes'}}""")
    pg.wait_for_timeout(100)
    r = ev("()=>{const R=ixBuild('defter',MXI.map,ixCur()._p);return {n:R.out.length,sk:R.skip.length,d:R.out.map(o=>o.iso),nd:R.nd}}")
    check('Bos/bozuk tarih: onceki satirin tarihi, hic atlanmaz', r['n']==4 and r['sk']==0 and r['d']==['2026-11-17']*3+['2026-11-19'] or r['d']==['2026-11-17','2026-11-17','2026-11-17','2026-11-19'], r)
    # 4) arayuz: kart gorunur, aktarma dugmesi acik
    ev("()=>{ixLoadSheets([{name:'ACIKLAMA',rows:[['Açıklama','Tutar'],['Kira',15000],['Market',2300]].map((r,i)=>{r.__n=i+1;return r})}],'a.xlsx');MXI.dec={dir:'gider',rate:'20',incl:'yes'};S.modal={type:'mximp'};renderModal()}"); pg.wait_for_timeout(100)
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Arayuz: Tarihi olmayan satirlar karti', 'Tarihi olmayan satırlar' in t and '2 satır' in t, t[:300])
    check('Arayuz: aktar dugmesi aktif', ev("()=>{const b=document.querySelector('[data-a=iximport]');return b&&!b.disabled}"))
    check('Arayuz: Tarih okunamadi hatasi yok', 'Tarih okunamadı' not in t)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not fails else 'FAIL: %d' % len(fails))
