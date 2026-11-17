"""Kayitta sorulanlar profil ekraninda tekrar sorulmaz (v197/v198)."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800)
    ev = pg.evaluate
    vis = "()=>['tur','il','cal','muh','mods'].filter(k=>{const n=document.querySelector('[data-pfk=\"'+k+'\"]');return n&&n.style.display!=='none'})"
    # 1) PROF bos -> hepsi sorulur
    ev("()=>{Object.assign(PROF,{tur:'',il:'',cal:'',muh:'',sube:'',yontem:'',zaman:[],mods:[]});PEND.prof=null;PEND.tur='';S.user=S.user||{role:'patron'};H.pfopen()}"); pg.wait_for_timeout(100)
    check('Bos PROF: sorular gorunur', len(ev(vis)) >= 3, ev(vis))
    # 2) PROF dolu -> kayitta sorulanlar gizli
    ev("()=>{S.modal=null;Object.assign(PROF,{tur:'Kafe',il:'Izmir',cal:'1-5',muh:'Var',mods:['stok']});H.pfopen()}"); pg.wait_for_timeout(100)
    check('Dolu PROF: tekrar sorulmaz', ev(vis) == [], ev(vis))
    # 3) PEND.prof beklerken (isletme baglandiktan sonra) profPend PROF'a isler
    ev("()=>{S.modal=null;Object.assign(PROF,{tur:'',il:'',cal:'',muh:'',sube:'',yontem:'',zaman:[],mods:[]});PEND.prof={tur:'Firin',il:'Ankara',cal:'6-15',muh:'Yok',mods:['muhasebe']};profPend();H.pfopen()}"); pg.wait_for_timeout(100)
    check('PEND.prof PROFa islenir', ev("()=>PROF.tur")=='Firin' and ev("()=>PEND.prof")==None, ev("()=>[PROF.tur,PEND.prof]"))
    check('PEND.prof sonrasi tekrar sorulmaz', ev(vis) == [], ev(vis))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not fails else 'FAIL: %d' % len(fails))
