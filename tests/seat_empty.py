"""Yeni bulut isletmesinde sahte calisan yok; davet/baglanti ile gorunur, isim baglanir."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 900}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(600); ev = pg.evaluate
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.demoMode=false;SBS.biz={id:'b',name:'X'};ID.active={role:'patron',business_id:'b',businesses:SBS.biz};ID.team={members:[],invites:[],err:''};S.view='ekip';S.sub.ekip='bugun';render()}")
    check('Calisan yeri yok', ev("()=>EMP_IDS.length")==0, ev("()=>EMP_IDS"))
    t = ev("()=>document.body.innerText")
    check('Calisan ekle karti', 'Çalışan ekle' in t and 'Çalışan 1' not in t.split('Hesap bağlantıları')[0], t[:300])
    ev("()=>{S.sub.ekip='hesap';render()}"); t2 = ev("()=>document.body.innerText")
    check('Hesap baglantilari duruyor', 'Çalışan 1' in t2 and 'Müdür' in t2, t2[:200])
    ev("()=>{S.sub.ekip='bugun';render()}")
    ev("()=>{ID.team={members:[],invites:[{app_uid:'u4'}],err:''};NAMES.u4={name:'Ali Yılmaz',title:'Garson'};applyNames();render()}")
    check('Davet edilen gorunur', ev("()=>EMP_IDS.join()")=='u4')
    ev("()=>{S.sub.ekip='hesap';render()}")
    check('Isim baglandi', 'Ali Yılmaz' in ev("()=>document.body.innerText"))
    ev("()=>{ID.team={members:[{app_uid:'u3',display_name:'Ayşe Hanım',role:'muhasebeci'}],invites:[],err:''};render()}")
    check('Uye adi muhasebeciye yazildi', ev("()=>byId('u3').name")=='Ayşe Hanım')
    ev("()=>{ID.team={members:[],invites:[],err:''};render();H.empadd()}")
    check('Davet penceresi bos isimle', ev("()=>S.modal&&S.modal.type==='invnew'&&S.modal.blank")==True and ev("()=>document.getElementById('iv-name').value")=='')
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
