"""Uyelik satiri yokken sahibi oldugu isletme bulunur; kurulum acilmaz."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.add_init_script("window.supabase={createClient:()=>({})}")
    pg.goto(URL); pg.wait_for_timeout(500)
    r = pg.evaluate("""async()=>{
      const q=(t)=>{const o={eq(){return o},then(res){res({data:t==='businesses'?[{id:'b1',name:'Büyük Çamlıca',owner_id:'z'}]:[],error:null})},insert(){return Promise.resolve({})},select(){return o}};return o};
      window.sbClient=()=>({from:q});
      SBS.user={id:'z'};ID.mems=[];ID.active=null;
      await sbLoadBiz();
      return [ID.mems.length, ID.active&&ID.active.role, SBS.biz&&SBS.biz.name]}""")
    check('Isletme sahibi uyelik olmadan bulundu', r == [1, 'patron', 'Büyük Çamlıca'], r)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
