"""Kais AI: rol bazli baglam, borc odeme ve fis onay islemleri, her rol icin hizli sorular."""
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
    login = lambda role: ev("(r)=>{loginAs(USERS.find(u=>u.role===r));S.modal=null;render()}", role)
    login('patron')
    ev("""()=>{ DEBTS.length=0; DEBTS.push({id:'dA',who:'Toptanci X',note:'Fatura 12',amt:1000,due:addDays(REF_ISO,-5),rem:3,on:true,paid:false});
      RECEIPTS.push({id:'fq1',seller:'Migros',date:'12 Kas',total:240,rate:10,cat:'Hammadde',status:'bekliyor',by:'u4',bank:null,at:'10:00',items:[]}); }""")
    c = ev("()=>aiContext()")
    check('Baglam (patron): borc, KDV, bekleyen fis, vardiya var', all(k in c for k in ['borclar', 'kdv', 'bekleyen_fisler', 'vardiya_bugun']), list(c))
    check('Baglam: borc kalan tutari dogru', c['borclar'][0]['kalan'] == 1000 and c['borclar'][0]['id'] == 'dA', c.get('borclar'))
    # borc odeme karti
    ev("()=>{AIC.msgs=[{role:'assistant',content:'Hazirladim',acts:[{type:'borc_ode',args:{borc_id:'dA',tutar:400},st:'open'},{type:'fis_onayla',args:{fis_id:'fq1'},st:'open'}]}]; S.view='kaisai'; render();}")
    html = ev("()=>document.body.innerHTML")
    check('Kart: borc odeme ve fis onay kartlari gorunur', 'Borç ödemesi' in html and 'Fiş onayı' in html)
    ev("()=>H.aiact2({dataset:{i:'0',j:'0'}})")
    check('Borc: kismi odeme kaydedilir (kalan 600)', ev("()=>dbOpen(DEBTS[0])")==600 and ev("()=>AIC.msgs[0].acts[0].st")=='done', ev("()=>dbOpen(DEBTS[0])"))
    ev("()=>{AIC.msgs[0].acts[0]={type:'borc_ode',args:{borc_id:'dA',tutar:0},st:'open'}; render(); document.getElementById('aa-0-0-a').value='9999'; H.aiact2({dataset:{i:'0',j:'0'}})}")
    check('Borc: kalandan fazla tutar reddedilir', ev("()=>dbOpen(DEBTS[0])")==600 and ev("()=>AIC.msgs[0].acts[0].st")=='open')
    ev("()=>{document.getElementById('aa-0-0-a').value='600'; H.aiact2({dataset:{i:'0',j:'0'}})}")
    check('Borc: kalan odenince borc kapanir', ev("()=>DEBTS[0].paid")==True)
    ev("()=>H.aiact2({dataset:{i:'0',j:'1'}})")
    check('Fis: onaylaninca muhasebeciye gider', ev("()=>RECEIPTS.find(f=>f.id==='fq1').status")=='musavirde')
    # yetki
    ev("()=>{RECEIPTS.push({id:'fq2',seller:'A',date:'12 Kas',total:50,rate:10,cat:'Diğer',status:'bekliyor',by:'u4',bank:null,at:'10:00',items:[]});}")
    login('muhasebeci')
    ev("()=>{AIC.msgs=[{role:'assistant',content:'x',acts:[{type:'fis_onayla',args:{fis_id:'fq2'},st:'open'}]}]; render(); H.aiact2({dataset:{i:'0',j:'0'}})}")
    check('Yetki: muhasebeci fis onaylayamaz', ev("()=>RECEIPTS.find(f=>f.id==='fq2').status")=='bekliyor')
    c = ev("()=>aiContext()")
    check('Baglam (muhasebeci): finans var, bekleyen fis/vardiya yok', 'kdv' in c and 'borclar' in c and 'bekleyen_fisler' not in c and 'vardiya_bugun' not in c, list(c))
    login('calisan')
    c = ev("()=>aiContext()")
    check('Baglam (calisan): kendi vardiyasi var, finans verisi yok', 'vardiyam' in c and not any(k in c for k in ['borclar', 'kdv', 'alacaklar', 'acik_faturalar', 'bekleyen_fisler']), list(c))
    # hizli sorular
    for role, want in [('patron', 'KDV'), ('muhasebeci', 'KDV'), ('mudur', 'Hızlı komutlar')]:
        login(role); ev("()=>{AIC.msgs=[];S.view='kaisai';render()}")
        html = ev("()=>document.body.innerHTML")
        check('Hizli sorular: ' + role, want in html and 'data-a="aiq"' in html, role)
    # ---- v177: yeni islemler, neden, geri al, hafiza ----
    login('patron')
    ev("""()=>{ RECV.length=0; RECV.push({id:'aq1',name:'Lale Catering',amt:8400,days:-1,note:'Pasta'}); DEBTS.length=0; DEBTS.push({id:'dB',who:'Toptanci Y',note:'F1',amt:500,due:addDays(REF_ISO,2),rem:3,on:true,paid:false});
      RECEIPTS.push({id:'fq9',seller:'Bim',date:'12 Kas',total:90,rate:10,cat:'Diğer',status:'bekliyor',by:'u4',bank:null,at:'10:00',items:[]});
      TASKS.length=0; MSGS.length=0;
      AIC.msgs=[{role:'assistant',content:'x',acts:[
        {type:'alacak_tahsil',args:{alacak_id:'aq1',neden:'Vadesi 1 gun gecti.'},st:'open'},
        {type:'gorev_ver',args:{gorev:'Bar temizligi',kime:'herkes',son_gun:addDays(REF_ISO,1),neden:'Haftalik temizlik.'},st:'open'},
        {type:'vardiya_taslak',args:{ay:REF_ISO.slice(0,7),neden:'Gelecek ay plani yok.'},st:'open'},
        {type:'borc_ode',args:{borc_id:'dB',tutar:200},st:'open'},
        {type:'fis_onayla',args:{fis_id:'fq9'},st:'open'}]}]; S.view='kaisai'; render(); }""")
    html = ev("()=>document.body.innerHTML")
    check('Kart: alacak tahsil, gorev, vardiya kartlari', 'Alacak tahsilatı' in html and 'Bar temizligi' in html and 'Vardiya taslağı' in html)
    check('Neden? gerekcesi gorunur', 'Vadesi 1 gun gecti.' in html and 'Neden?' in html)
    ev("()=>H.aiact2({dataset:{i:'0',j:'0'}})")
    check('Alacak: tahsil edildi isaretlenir', ev("()=>RECV[0].paid")==True)
    ev("()=>H.aiundo({dataset:{i:'0',j:'0'}})")
    check('Alacak: geri al calisir', ev("()=>!RECV[0].paid && AIC.msgs[0].acts[0].st")=='undone', ev("()=>AIC.msgs[0].acts[0].st"))
    ev("()=>H.aiact({dataset:{i:'0',j:'1'}})")
    check('Gorev: verilir (yarin, herkes)', ev("()=>TASKS.length===1 && TASKS[0].uid==='all' && TASKS[0].t==='Bar temizligi'"), ev("()=>JSON.stringify(TASKS)"))
    check('Gorev: Geri al dugmesi var', 'data-a="aiundo"' in ev("()=>document.body.innerHTML"))
    ev("()=>H.aiundo({dataset:{i:'0',j:'1'}})")
    check('Gorev: geri alinca silinir', ev("()=>TASKS.length")==0)
    ev("()=>H.aiact({dataset:{i:'0',j:'2'}})")
    check('Vardiya taslagi: kabul edilir', ev("()=>AIC.msgs[0].acts[2].st")=='done', ev("()=>AIC.msgs[0].acts[2].msg"))
    ev("()=>H.aiact2({dataset:{i:'0',j:'3'}})")
    check('Borc: kismi odeme (kalan 300)', ev("()=>dbOpen(DEBTS[0])")==300)
    ev("()=>H.aiundo({dataset:{i:'0',j:'3'}})")
    check('Borc: geri alinca kalan 500', ev("()=>dbOpen(DEBTS[0])")==500 and ev("()=>!DEBTS[0].paid"))
    ev("()=>H.aiact2({dataset:{i:'0',j:'4'}}); H.aiundo({dataset:{i:'0',j:'4'}})")
    check('Fis: onay geri alinir', ev("()=>RECEIPTS.find(f=>f.id==='fq9').status")=='bekliyor')
    # yetki: calisan alacak tahsil edemez
    login('calisan')
    ev("()=>{AIC.msgs=[{role:'assistant',content:'x',acts:[{type:'alacak_tahsil',args:{alacak_id:'aq1'},st:'open'}]}]; render(); H.aiact2({dataset:{i:'0',j:'0'}})}")
    check('Yetki: calisan alacak tahsil edemez', ev("()=>!RECV[0].paid"))
    # hafiza yonetimi
    login('patron')
    ev("()=>{AIC.notes=['Sut hep Ahmet den alinir','Cuma kapali'];AIC.msgs=[];S.view='kaisai';render()}")
    check('Hafiza: yonet dugmesi', 'data-a="aimem"' in ev("()=>document.body.innerHTML"))
    ev("()=>H.aimem()"); html = ev("()=>document.body.innerHTML")
    check('Hafiza: notlar listelenir', 'Sut hep Ahmet' in html and 'data-a="aimemdel"' in html)
    ev("()=>H.aimemdel({dataset:{n:'0'}})")
    check('Hafiza: tek not silinir', ev("()=>AIC.notes.join('|')")=='Cuma kapali', ev("()=>AIC.notes"))
    ev("()=>{document.getElementById('am-new').value='Pazartesi stok say'; H.aimemadd()}")
    check('Hafiza: not eklenir', ev("()=>AIC.notes.length")==2 and ev("()=>aiContext().hafiza_notlari.includes('Pazartesi stok say')"))
    check('Sayfa hatasi yok', not er, er[:3])
    b.close()
print('\nHATA: ' + str(len(fails)) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
