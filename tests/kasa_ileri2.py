"""Ekstreden bos aciklama doldurma, ekstrede olmayan sayisi, ogrenilen hesap, bakiye farki."""
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
    pg.goto(URL); pg.wait_for_timeout(1000); ev = pg.evaluate
    ev("""()=>{loginAs(USERS.find(x=>x.role==='patron'));LEDGER.length=0;
      LEDGER.push({id:'g1',date:'x',iso:'2026-09-01',desc:'(açıklamasız)',acc:'Diğer',doc:'—',rate:0,total:373.75,dir:'gider',src:'Excel',ch:'banka'});
      LEDGER.push({id:'g2',date:'x',iso:'2026-09-02',desc:'Kira',acc:'Kira',doc:'—',rate:0,total:5000,dir:'gider',src:'Excel',ch:'banka'});
      S.settings=S.settings||{};S.settings.kbal={banka:{v:1000,seq:2,from:'Excel',n:3,iso:'2026-09-02',t:'2026-09-03'},nakit:{v:500,seq:0,from:'Elle',t:'2026-09-03'}};}""")
    ev("()=>{MX.txt='01.09.2026;ADT GUVENLIK ODEME;-373,75\\n10.09.2026;BILINMEYEN;-99,00';MX.flip=false;H.mxmatch()}")
    r = ev("()=>({kinds:MX.res.map(x=>x.kind),miss:MX.missing})")
    check('Ekstre: bos aciklamali kayit eslesti', r['kinds'][0]=='led', r)
    check('Ekstrede olmayan sayisi (Kira)', r['miss']==1, r)
    ev("()=>{S.modal={type:'mxekstre'};renderModal()}"); t = ev("()=>document.querySelector('.sheet').innerText")
    check('Dolacak aciklama bildirimi', 'boş olan açıklama' in t, t[:300])
    ev("()=>H.mxapply()")
    check('Aciklama ekstreden dolduruldu', ev("()=>LEDGER.find(r=>r.id==='g1').desc")=='ADT GUVENLIK ODEME', ev("()=>LEDGER.map(r=>r.desc)"))
    # ogrenilen hesap
    ev("()=>mxLearnSet('ADT GUVENLIK ODEME','GÜVENLİK GİDERLERİ')")
    ev("""()=>{const P=ixPrep({rows:[['Tarih','Açıklama','Giderler'],['2026-10-01','ADT GUVENLIK ODEME',100]]});MXI.dec={rate:'0',incl:'yes'};window.__r=ixBuild('defter',ixAuto('defter',P),P)}""")
    check('Ogrenilen hesap uygulandi', ev("()=>window.__r.out[0].acc")=='GÜVENLİK GİDERLERİ', ev("()=>window.__r.out"))
    # bakiye farki
    ev("()=>{S.modal=null;H.mxkb()}"); pg.wait_for_timeout(100)
    ev("()=>{document.getElementById('kb-n').value='600';H.mxkbset()}"); pg.wait_for_timeout(600)
    check('Bakiye farki kaydedildi', ev("()=>S.settings.kbal.nakit.chk&&S.settings.kbal.nakit.chk.diff")==100, ev("()=>S.settings.kbal.nakit"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
