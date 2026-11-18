"""Yenilemede uye sorgusu ilk basta bos/hatali donse tekrar dener, onboarding'e atmaz; kurulum adimlari hatirlanir."""
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
    # 1) yukleme hatasi: onboarding degil uyari
    ev("()=>{SBS.user={id:'z',email:'a@b.c'};S.user=null;ID.mems=[];ID.active=null;SBS.loadErr='JWT expired';S.lgCreate=false;render()}")
    t = ev("()=>document.body.innerText")
    check('Hata varken kurulum degil uyari', 'İşletmen yüklenemedi' in t and 'JWT expired' in t and 'işletmeni tanıyalım' not in t, t[:200])
    # 2) tekrar dene: uye gelince girer
    ev("""()=>{let n=0;sbLoadBiz=async function(){n++;if(n<2){SBS.loadErr='gecici';throw new Error('gecici')}ID.mems=[{business_id:'b1',role:'patron',app_uid:'u1',businesses:{id:'b1',name:'Test',owner_id:'z'}}];ID.active=ID.mems[0];SBS.biz=ID.mems[0].businesses};
      cloudTry=async()=>{};window.__n=()=>n}""")
    ev("()=>H.sgretry()"); pg.wait_for_timeout(3500)
    check('Tekrar deneyince isletme acilir', ev("()=>!!S.user && ID.mems.length===1"), ev("()=>[!!S.user,ID.mems.length,window.__n()]"))
    # 3) kurulum adimi hatirlanir
    ev("()=>{S.user=null;ID.mems=[];ID.active=null;SBS.loadErr='';SBS.user={id:'z2',email:'x@y.z'};localStorage.removeItem('kp_sg');sgInit();S.sg.biz='Benim Isletme';S.sg.tur='';S.sg.step=2;S.lgCreate=true;render()}")
    check('Adim kaydedildi', ev("()=>JSON.parse(localStorage.kp_sg).biz")=='Benim Isletme')
    ev("()=>{S.sg=null;sgInit()}")
    check('Yenilemede geri geldi', ev("()=>S.sg.biz")=='Benim Isletme' and ev("()=>S.sg.step")==2)
    check('Sifre saklanmaz', 'pw' not in ev("()=>JSON.parse(localStorage.kp_sg)"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
