"""Patron kaydi (3 adim), Google ile giris/hizli kurulum, davet koduyla katilma. Sahte Supabase istemcisi kullanir."""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
FAKE = """()=>{
  const db={members:[],businesses:[]}; window.__db=db; window.__calls=[]; let uid=0; const users={};
  const chain=(rows)=>{ const o={ select(){return o}, eq(){return o}, in(){return o}, order(){return o}, limit(){return o}, maybeSingle(){return o}, single(){return o}, then(res){return Promise.resolve({data:rows,error:null}).then(res)} }; return o; };
  const sess=(u)=>({data:{session:{user:u,access_token:'t'},user:u},error:null});
  const fake={
    auth:{
      async getSession(){ return {data:{session:window.__sess||null}}; },
      async signUp({email,password,options}){ window.__calls.push(['signUp',email]); if(users[email]) return {data:{},error:{message:'User already registered'}}; const u={id:'U'+(++uid),email,user_metadata:(options&&options.data)||{}}; users[email]={u,password}; window.__sess={user:u}; return sess(u); },
      async signInWithPassword({email,password}){ const x=users[email]; if(!x||x.password!==password) return {data:{},error:{message:'Invalid login credentials'}}; window.__sess={user:x.u}; return sess(x.u); },
      async signInWithOAuth(o){ window.__calls.push(['oauth',o.provider,o.options.redirectTo]); return {data:{},error:null}; },
      async signOut(){ window.__sess=null; return {}; }, onAuthStateChange(){ return {data:{subscription:{unsubscribe(){}}}}; }, async updateUser(){ return {data:{},error:null}; }
    },
    from(t){
      if(t==='members') return { select(){ const o=chain(db.members.filter(m=>m.user_id===(window.__sess&&window.__sess.user.id)).map(m=>Object.assign({},m,{businesses:db.businesses.find(b=>b.id===m.business_id)}))); return o; } };
      if(t==='businesses') return { insert(r){ const b={id:'B'+(db.businesses.length+1),name:r.name,owner_id:r.owner_id}; db.businesses.push(b); db.members.push({business_id:b.id,role:'patron',app_uid:'u1',display_name:null,user_id:r.owner_id}); return Promise.resolve({data:null,error:null}); }, select(){ return chain([]); } };
      if(t==='consents') return { insert(r){ (db.consents=db.consents||[]).push(r); return Promise.resolve({data:null,error:null}); } };
      return { select(){return chain([])}, insert(){return Promise.resolve({data:null,error:null})}, upsert(){return Promise.resolve({data:null,error:null})}, update(){return chain([])} };
    },
    async rpc(n,a){ window.__calls.push(['rpc',n,a]); if(n==='claim_invite'){ if(a.p_code==='K7M2QX'){ const b={id:'BX',name:'Davetli Cafe',owner_id:'o'}; if(!db.businesses.find(x=>x.id==='BX')) db.businesses.push(b); db.members.push({business_id:'BX',role:'calisan',app_uid:'u4',display_name:'Ali',user_id:window.__sess.user.id}); return {data:{ok:true},error:null}; } return {data:{error:'invalid_code'},error:null}; } return {data:null,error:null}; },
    channel(){ const c={on(){return c},subscribe(){return c}}; return c; }, removeChannel(){}
  };
  SBS.c=fake; window.__noReload=true;
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800)
    ev = lambda js, *a: pg.evaluate(js, *a) if a else pg.evaluate(js)
    ev(FAKE); ev("()=>{S.user=null;SBS.user=null;S.lgTab='own';S.lgCreate=false;render()}")
    html = ev("()=>document.body.innerHTML")
    check('Giris: Google ile devam et dugmesi var', 'data-a="sggoogle"' in html)
    # Google
    ev("()=>H.sggoogle()"); pg.wait_for_timeout(100)
    check('Google: OAuth saglayici google ve donus adresi gonderilir', ev("()=>window.__calls.some(c=>c[0]==='oauth'&&c[1]==='google'&&/^file|^http/.test(c[2]))"))
    # Kayit adim 1
    ev("()=>{H.lgcreate()}"); pg.wait_for_timeout(100)
    check('Kayit: adim 1 gorunur, Google secenegi var', ev("()=>S.sg.step")==1 and ev("()=>!!document.querySelector('[data-a=sggoogle]')"))
    pg.screenshot(path='/tmp/sg1.png')
    ev("()=>H.sgnext()"); check('Kayit: bos form adim 1de kalir', ev("()=>S.sg.step")==1 and ev("()=>document.getElementById('sg-err').textContent")!='')
    pg.fill('#sg-name','Ahmet Yilmaz'); pg.fill('#sg-em','ahmet@ornek.com'); pg.fill('#sg-pw','kisa')
    ev("()=>H.sgnext()"); check('Kayit: kisa sifre reddedilir', ev("()=>S.sg.step")==1)
    pg.fill('#sg-pw','guclusifre1'); ev("()=>H.sgnext()")
    check('Kayit: adim 2ye gecer, hesap henuz acilmaz', ev("()=>S.sg.step")==2 and ev("()=>window.__calls.filter(c=>c[0]==='signUp').length")==0)
    ev("()=>H.sgnext()"); check('Kayit: isletme adi/sektor olmadan ilerlemez', ev("()=>S.sg.step")==2)
    pg.fill('#sg-biz','Deniz Kafe'); ev("()=>H.ddpick({closest:()=>document.querySelector('[data-dd]'),dataset:{v:'Kafe & Restoran',ic:'store'}})") if False else None
    ev("()=>{document.querySelector('[data-dd] .lx-di').click()}")
    pg.click('#sg-il'); pg.wait_for_timeout(80); pg.screenshot(path='/tmp/sg_il0.png')
    check('Sehir: modern liste acilir, 81 il', ev("()=>document.querySelectorAll('.cx-dp .cx-i').length")>=80 and ev("()=>!document.getElementById('sg-il').hasAttribute('list')"))
    pg.fill('#sg-il','izm'); pg.wait_for_timeout(80)
    check('Sehir: yazinca filtrelenir (izm -> Izmir)', ev("()=>[...document.querySelectorAll('.cx-dp .cx-i')].map(x=>x.dataset.v)")==['İzmir'])
    pg.screenshot(path='/tmp/sg_il.png')

    pg.mouse.click(0,0) if False else None
    ev("()=>document.querySelector('.cx-dp .cx-i').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}))")
    check('Sehir: secim degeri yazar, liste kapanir', ev("()=>document.getElementById('sg-il').value")=='İzmir' and ev("()=>!document.querySelector('.cx-dp')"))
    ev("()=>H.sgnext()"); check('Kayit: adim 3e gecer', ev("()=>S.sg.step")==3, ev("()=>[S.sg.tur,document.getElementById('sg-err')&&document.getElementById('sg-err').textContent]"))
    check('Kayit: sektore gore bolumler onceden secili', ev("()=>document.querySelectorAll('[data-grp=mods] .pf-c.on').length")>=1, ev("()=>S.sg.tur"))
    pg.screenshot(path='/tmp/sg3.png')
    ev("()=>H.sgback()"); pg.screenshot(path='/tmp/sg2.png'); check('Kayit: geri adim 2ye doner, bilgiler korunur', ev("()=>S.sg.step")==2 and pg.input_value('#sg-biz')=='Deniz Kafe')
    ev("()=>H.sgnext()"); pg.wait_for_timeout(100)
    ev("()=>{document.querySelector('[data-grp=cal] .pf-c').click()}")
    ev("()=>H.sgnext()"); pg.wait_for_timeout(300)
    check('Kayit: sartlar kabul edilmeden hesap acilmaz', ev("()=>window.__calls.filter(c=>c[0]==='signUp').length")==0 and 'kabul' in ev("()=>document.getElementById('sg-err').textContent"))
    ev("()=>{document.getElementById('sg-kabul').click()}")
    ev("()=>H.sgnext()"); pg.wait_for_timeout(1500)
    r = ev("()=>({u:S.user&&S.user.role, biz:BIZ, calls:window.__calls.filter(c=>c[0]==='signUp').length, bs:window.__db.businesses.length, tur:PROF.tur, il:PROF.il, cal:PROF.cal, nm:S.user&&S.user.name, err:S.loginErr})")
    check('Kayit: patron olarak girer, tek hesap ve tek isletme acilir', r['u']=='patron' and r['calls']==1 and r['bs']==1, r)
    pg.wait_for_timeout(600)
    cs = ev("()=>(window.__db.consents||[])")
    check('Onay kaydi: kurulumda sartlar+KVKK onayi kaydedilir', len(cs)==1 and cs[0]['kind']=='kurulum' and cs[0]['ver']=='2026-11-17' and cs[0]['docs'].get('kvkk') and cs[0]['email'], cs)
    check('Kayit: isletme adi, sektor, sehir, ekip buyuklugu profile yazilir', r['biz']=='Deniz Kafe' and r['tur']!='' and r['il']=='İzmir' and r['cal']!='', r)
    check('Kayit: ad soyad patron adi olur', r['nm']=='Ahmet Yilmaz', r)
    # ayni e-posta ile tekrar kayit: yanlis sifre
    ev("()=>{S.user=null;SBS.user=null;window.__sess=null;ID.active=null;ID.mems=[];S.lgTab='own';S.lgCreate=false;render();H.lgcreate()}")
    pg.fill('#sg-name','X'); pg.fill('#sg-em','ahmet@ornek.com'); pg.fill('#sg-pw','baskasifre99'); ev("()=>{H.sgnext();}")
    pg.fill('#sg-biz','Baska'); ev("()=>{document.querySelector('[data-dd] .lx-di').click()}"); ev("()=>{H.sgnext();document.getElementById('sg-kabul').checked=true;H.sgnext();}"); pg.wait_for_timeout(500)
    check('Kayit: kayitli e-posta yanlis sifreyle isletme acamaz', ev("()=>window.__db.businesses.length")==1 and 'kayıtlı' in ev("()=>S.loginErr"), ev("()=>S.loginErr"))
    # Google kullanicisi, isletmesi yok -> hizli kurulum (adim 2)
    ev("()=>{window.__sess={user:{id:'G1',email:'g@gmail.com',user_metadata:{full_name:'Gul Demir'}}};SBS.user=window.__sess.user;S.user=null;ID.active=null;ID.mems=[];S.lgCreate=false;S.sg=null;S.lgTab='own';render()}")
    check('Google: isletmesi olmayan hesap hizli kurulum (adim 2) ekranina duser', ev("()=>S.sg&&S.sg.step")==2 and 'Gul' in ev("()=>document.body.innerText"), ev("()=>document.body.innerText.slice(0,200)"))
    check('Google: adim 1 atlanir, geri dugmesi yok', ev("()=>!document.querySelector('[data-a=sgback]')"))
    pg.fill('#sg-biz','Gul Market'); ev("()=>{document.querySelectorAll('[data-dd] .lx-di')[2].click()}"); ev("()=>H.sgnext()"); ev("()=>{document.getElementById('sg-kabul').checked=true;H.sgnext()}"); pg.wait_for_timeout(1500)
    r = ev("()=>({u:S.user&&S.user.role,biz:BIZ,signUps:window.__calls.filter(c=>c[0]==='signUp').length,nm:S.user&&S.user.name})")
    check('Google: sifresiz hesapla isletme kurulur, patron girer', r['u']=='patron' and r['biz']=='Gul Market' and r['nm']=='Gul Demir', r)
    # Google + davet kodu
    ev("()=>{S.user=null;ID.active=null;ID.mems=[];window.__sess={user:{id:'G2',email:'c@gmail.com',user_metadata:{}}};SBS.user=window.__sess.user;S.lgCreate=false;S.sg=null;S.lgTab='emp';render()}")
    check('Google: calisan sekmesinde davet kodu ekrani', ev("()=>!!document.getElementById('sg-code')"))
    pg.fill('#sg-code','ZZZZZZ'); ev("()=>H.sgclaim()"); pg.wait_for_timeout(300)
    check('Davet (Google): onay kutusu isaretsizken ilerlemez', 'kabul' in ev("()=>document.getElementById('sg-err').textContent"))
    ev("()=>{document.getElementById('sg-kabulj').click(); H.sgclaim()}"); pg.wait_for_timeout(300)
    check('Davet: gecersiz kod Turkce hata verir', 'geçersiz' in ev("()=>document.getElementById('sg-err').textContent"), ev("()=>S.loginErr"))
    pg.fill('#sg-code','K7M2QX'); ev("()=>H.sgclaim()"); pg.wait_for_timeout(1500)
    check('Davet: gecerli kodla calisan olarak girer', ev("()=>S.user&&S.user.role")=='calisan', ev("()=>S.loginErr"))
    pg.wait_for_timeout(500)
    check('Onay kaydi: davetle katilimda kaydedilir', any(c['kind']=='davet' and c['email']=='c@gmail.com' for c in ev("()=>(window.__db.consents||[])")), ev("()=>window.__db.consents"))
    # ---- Masaustu giris ekrani ----
    pg.set_viewport_size({'width': 1440, 'height': 860})
    ev("()=>{localStorage.setItem('kp_em','ayse@firma.com');S.lgEm='';S.user=null;SBS.user=null;S.lgCreate=false;S.lgTab='own';render()}")
    ev("()=>{S.lgEm=localStorage.getItem('kp_em');render()}"); pg.wait_for_timeout(200)
    check('Masaustu: bolunmus giris ekrani ve ozellik paneli', ev("()=>!!document.querySelector('.login.lx3 .lp .lp-f')") and ev("()=>document.querySelector('.lx-hero').getBoundingClientRect().width")>600)
    check('Masaustu: son kullanilan e-posta hazir gelir', pg.input_value('#id-em') == 'ayse@firma.com')
    check('Masaustu: Caps Lock uyarisi alani var', ev("()=>!!document.querySelector('#id-pw')&&!!document.querySelector('.lx-caps')"))
    ev("()=>{S.lgTab='emp';render()}")
    check('Masaustu: calisan sekmesinde panel metni degisir', 'Ekibe hoş geldin' in ev("()=>document.querySelector('.lx-copy').innerText"))
    pg.set_viewport_size({'width': 390, 'height': 844})
    check('Sayfa hatasi yok', not er, er[:3])
    # davet baglantisi: ?kod= ile gelen calisan
    pg3 = b.new_page(viewport={'width': 1440, 'height': 860}); pg3.add_init_script('window.supabase={createClient:()=>({})}')
    pg3.goto(URL + '?kod=K7M2QX'); pg3.wait_for_timeout(2200)
    check('Davetle katilim: onay kutusu var', pg3.evaluate("()=>!!document.getElementById('id-kabul')"))
    pg3.evaluate("()=>{window.__idauth=0; idAuth=function(){window.__idauth++}}")
    pg3.evaluate("()=>H.idnew()")
    check('Davetle katilim: kutu isaretsizken ilerlemez', pg3.evaluate("()=>window.__idauth")==0 and pg3.evaluate("()=>document.querySelector('.kb-cons').classList.contains('err')"))
    pg3.evaluate("()=>{document.getElementById('id-kabul').click(); H.idnew()}")
    check('Davetle katilim: isaretlenince devam eder', pg3.evaluate("()=>window.__idauth")==1)
    pg3.close()
    pg2 = b.new_page(viewport={'width': 1440, 'height': 860}); pg2.add_init_script('window.supabase={createClient:()=>({})}')
    pg2.goto(URL + '?kod=k7m2qx'); pg2.wait_for_timeout(2200)
    r = pg2.evaluate("()=>({tab:S.lgTab,code:(document.getElementById('id-code')||{}).value,h1:(document.querySelector('.lx-card h1')||{}).textContent,cp:(document.querySelector('.lx-copy h2')||{}).textContent})")
    check('Davet linki: calisan sekmesi, kod kendiliginden dolu', r['tab'] == 'emp' and r['code'] == 'K7M2QX', r)
    check('Davet linki: baslik ve sol panel calisan icin', r['h1'] == 'Ekibe katıl' and 'hoş geldin' in r['cp'], r)
    pg2.evaluate("()=>{window.__c=null;Object.defineProperty(navigator,'clipboard',{value:{writeText:(t)=>{window.__c=t;return Promise.resolve()}},configurable:true});S.modal={type:'invcode',uid:USERS[1].id,code:'K7M2QX'};H.invcopy()}")
    check('Davet mesaji: link icerir', '?kod=K7M2QX' in (pg2.evaluate("()=>window.__c") or ''))
    pg2.close()
    b.close()
print('\nHATA: ' + str(len(fails)) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
