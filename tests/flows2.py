"""Ikinci tur: rezervasyon, duyuru/mesai teklifi, vardiya, rol gorunurlugu, salt okunur plan kilidi."""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    ev = lambda js, *a: pg.evaluate(js, *a) if a else pg.evaluate(js)
    login = lambda role, uid=None: ev("([r,i])=>{loginAs(USERS.find(u=>i?u.id===i:u.role===r));S.modal=null;render()}", [role, uid])

    # ---- Rezervasyon ----
    login('patron')
    r = ev("""()=>{ seedTables(); rzSeat(); const o={}; const D=addDays(REF_ISO,2);
      const mk=(over)=>{S.modal=Object.assign({type:'rznew',id:null,name:'Test',phone:'0555 111 22 33',n:2,date:D,time:'19:00',dur:90,src:'Telefon',note:'',tid:'auto',email:''},over); renderModal(); H.rzsave(); S.modal=null; };
      let n=RESV.length; mk({}); o.add=RESV.length===n+1;
      for(let i=0;i<10;i++) mk({name:'G'+i,n:8,time:'20:00'});
      const big=RESV.filter(r=>r.date===D&&r.time==='20:00'&&rzActive(r)); const used=new Set(); o.dup=false; big.forEach(r=>r.tids.forEach(t=>{ if(used.has(t)) o.dup=true; used.add(t); }));
      n=RESV.length; mk({date:addDays(REF_ISO,-1)}); o.past=RESV.length===n;
      RESV.push({id:'rp',name:'Eski',phone:'0532 000 00 00',n:2,date:addDays(REF_ISO,-3),time:'18:00',dur:60,tids:['t1'],src:'Telefon',note:'',st:'bitti'});
      H.rzedit({dataset:{id:'rp'}}); document.getElementById('rz-note').value='duzeltildi'; H.rzsave(); o.pastEdit=RESV.find(r=>r.id==='rp').note==='duzeltildi';
      const q=RESV.find(x=>rzActive(x)).id; H.rzst({dataset:{id:q,s:'gelmedi'}}); H.rzst({dataset:{id:q,s:'onay'}}); o.undo=RESV.find(x=>x.id===q).st==='onay';
      const tid=RESV.find(x=>x.date>=REF_ISO&&rzActive(x)&&x.tids.length).tids[0]; const tl=TABLES.length; H.rztdel({dataset:{id:tid}}); o.tdel=TABLES.length===tl;
      return o; }""")
    check('Rez: yeni rezervasyon eklenir', r['add'])
    check('Rez: ayni saatte ayni masa iki kez verilmez', not r['dup'])
    check('Rez: gecmis tarihe yeni rezervasyon yazilmaz', r['past'])
    check('Rez: gecmis rezervasyonun notu duzeltilebilir', r['pastEdit'])
    check('Rez: gelmedi/geri al calisir', r['undo'])
    check('Rez: aktif rezervasyonlu masa silinmez', r['tdel'])

    # ---- Duyuru / mesai teklifi ----
    r = ev("""()=>{ const o={}; S.draft={type:'mesai',aud:'sel',title:'Ek mesai',body:'Cumartesi',hours:'2',pay:'1500',sel:['u4','u5']}; const n=MSGS.length;
      document.body.insertAdjacentHTML('beforeend','<div id=tmp></div>'); H.sendmsg(); o.sent=MSGS.length===n+1; 
      const m=MSGS[MSGS.length-1]; o.m={t:m.type,to:m.to,h:m.hours}; o.id=m.id; return o; }""")
    check('Duyuru: mesai teklifi secilen kisilere gider', r['sent'] and r['m']['to'] == ['u4', 'u5'] and r['m']['t'] == 'mesai', r)
    mid = r['id']
    login('calisan', 'u4')
    ev("(id)=>H.respond({dataset:{id,v:'kabul'}})", mid)
    check('Mesai: calisan kabul etti', ev("(id)=>{const m=MSGS.find(x=>x.id===id);return m&&m.res&&m.res.u4}", mid) == 'kabul')
    ev("()=>H.respond({dataset:{id:'yok',v:'kabul'}})")
    check('Mesai: silinmis teklife cevap hata vermez', not er, er)

    # ---- Vardiya ----
    login('patron')
    r = ev("""()=>{ const [y,m]=vdBase(); const n=vdAuto(y,m); const dim=new Date(y,m+1,0).getDate(); const o={n,dim};
      // her calisan icin haftalik kapasite: izinli gunde vardiya sayilmaz
      o.any=EMP_IDS.some(id=>{ for(let d=1;d<=dim;d++) if(vdState(y,m,d,id).k==='shift') return true; return false;});
      o.ins=vdInsights(y,m).map(x=>x.t); return o; }""")
    check('Vardiya: otomatik plan vardiya uretir', r['any'] and r['n'] > 0, r)
    check('Vardiya: kontrol notlari hesaplanir', len(r['ins']) > 0)

    # ---- Yasa bagli asgari 20 gun izin (4857 md. 53) ----
    r = ev("""()=>{ const t=fiIso(); const y=Number(t.slice(0,4)); const md=t.slice(5); const at=(age,dayShift)=>{ const d=new Date(y-age,Number(md.slice(0,2))-1,Number(md.slice(3))+dayShift); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
      PROFILES.u4.hire='2023-02-13'; PROFILES.u6.hire='2026-03-03'; PROFILES.u7.hire='2005-09-12'; const o={}; const base=leaveDays(monthsBetween(PROFILES.u4.hire),'u4'); o.base=base;
      const set=(u,b)=>{ PROFILES[u].birth=b; };
      set('u4',at(50,0)); o.a50=leaveDays(monthsBetween(PROFILES.u4.hire),'u4'); set('u4',at(50,1)); o.a49=leaveDays(monthsBetween(PROFILES.u4.hire),'u4');
      set('u4',at(18,0)); o.a18=leaveDays(monthsBetween(PROFILES.u4.hire),'u4'); set('u4',at(19,0)); o.a19=leaveDays(monthsBetween(PROFILES.u4.hire),'u4');
      set('u6',at(55,0)); o.young=leaveDays(monthsBetween(PROFILES.u6.hire),'u6');
      set('u7',at(60,0)); o.long=leaveDays(monthsBetween(PROFILES.u7.hire),'u7'); // 26 gun kalir
      set('u4',at(52,0)); o.ekBal=ekBal('u4').ent; o.izLeft=izLeft('u4').ent;
      delete PROFILES.u4.birth; delete PROFILES.u6.birth; delete PROFILES.u7.birth; return o; }""")
    check('Izin: 50 yasinda en az 20 gun', r['a50'] == 20 and r['base'] == 14, r)
    check('Izin: 49 yasinda normal hak', r['a49'] == 14, r)
    check('Izin: 18 yasinda 20 gun, 19 yasinda normal', r['a18'] == 20 and r['a19'] == 14, r)
    check('Izin: 1 yil dolmamissa yasa bakilmaksizin hak yok', r['young'] == 0, r)
    check('Izin: 26 gun hakki olan 20ye dusmez', r['long'] == 26, r)
    check('Izin: ekip ve talep ekranlari ayni hakki kullanir', r['ekBal'] == 20 and r['izLeft'] == 20, r)
    # ---- Kismi odenen borc: ayni notlu iki borc, cari ekstre ----
    r = ev("""()=>{ DEBTS.length=0; DEBTS.push({id:'dA',who:'Toptanci X',note:'Borç',amt:1000,due:addDays(REF_ISO,-5),rem:3,on:true,paid:false},{id:'dB',who:'Toptanci X',note:'Borç',amt:500,due:addDays(REF_ISO,5),rem:3,on:true,paid:false});
      dbPay(DEBTS[0],400,REF_ISO,''); const rows=mxCariRows('tedarikci','Toptanci X'); const m={}; rows.forEach(x=>m[x.id]=x.tot);
      return {all:allDebts().map(d=>d.amt), m, op:DEBTS.map(dbOpen)}; }""")
    check('Borc: kismi odeme listede kalani gosterir', r['all'] == [600, 500], r)
    check('Borc: ayni notlu iki borcta cari ekstre dogru satiri gunceller', r['m'] == {'dA': 600, 'dB': 500}, r)

    # ---- Rol gorunurlugu ----
    r = ev("""()=>{ const bad=[]; const views=[...new Set(Object.values(NAV).flat().map(x=>x[0]))].concat(['maas','muhasebe','ayarlar','admin','stok','ekip','musteri']);
      for(const role of ['patron','mudur','muhasebeci','calisan']){ loginAs(USERS.find(x=>x.role===role));
        for(const v of views){ if(NAV[role].some(n=>n[0]===v)) continue; S.view=v; S.modal=null; render(); const t=viewHTML().replace(/<[^>]+>/g,' ');
          if(t.trim().length>200 && !(role==='muhasebeci'&&v==='rapor')) bad.push(role+':'+v); } }
      return bad; }""")
    check('Rol: menude olmayan sayfalar acilmaz', not r, r)

    # ---- Salt okunur plan ----
    login('patron')
    r = ev("""()=>{ const snap=()=>JSON.stringify([P_ARR.map(([n,f])=>f()),P_OBJ.map(([n,f])=>f())]); PLAN.ro=true; const bad=[];
      ['saleimport','ebsave','rztadd','vdauto','vdcopy','vdclear','vdpub','vdtadd','vdtdel','izweek','brpub','chk','rqsend','opgo','ppwk','ftcol','sendmsg','respond'].forEach(n=>{ if(typeof H[n]!=='function') return; for(const id of ['m1','s1','r1']){ const b=snap(); try{ S.modal=null; H[n]({dataset:{id,v:'kabul',d:'1',s:'geldi',k:'x'}}); }catch(e){} if(b!==snap()){ bad.push(n); break; } } });
      PLAN.ro=false; return bad; }""")
    check('Plan: salt okunurda kalan yazma islemleri kilitli', not r, r)
    check('Sayfa hatasi yok', not er, er[:2])
    b.close()
print('\nHATA: ' + str(len(fails)) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
