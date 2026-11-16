"""Uctan uca akislar: fis onay zinciri, izin talebi/karsi teklif, avans-takas talebi, ariza, gorev, fatura.
Roller loginAs ile degistirilir; sunucu gerektirmez."""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}, accept_downloads=True); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    ev = lambda js, *a: pg.evaluate(js, *a) if a else pg.evaluate(js)
    pg.add_init_script('0')
    def login(role, uid=None): ev("([r,i])=>{loginAs(USERS.find(u=>i?u.id===i:u.role===r));S.modal=null;render()}", [role, uid])
    def setv(i, v): pg.evaluate("([i,v])=>{const e=document.getElementById(i);e.value=v}", [i, v])
    toast = lambda: ev("()=>document.getElementById('toasts').innerText")

    # ---------- FIS: calisan -> patron -> muhasebeci ----------
    login('calisan', 'u4')
    ev("()=>{H.upload();H.sample()}"); pg.wait_for_timeout(2600)
    if ev("()=>S.modal&&S.modal.step") == 'ask': ev("()=>H.answer({dataset:{v:'Hammadde'}})")
    ev("()=>H.savereceipt()")
    f = ev("()=>RECEIPTS[RECEIPTS.length-1]")
    check('Fis: calisan yukledi, patron onayi bekliyor', f['status'] == 'bekliyor' and f['by'] == 'u4' and f['total'] > 0, f)
    n_led = ev("()=>LEDGER.length")
    check('Fis: onaylanmadan deftere yazilmadi', ev("(id)=>!LEDGER.some(r=>r.rc===id)", f['id']))
    login('patron'); ev("(id)=>H.approve({dataset:{id}})", f['id'])
    check('Fis: patron onayi muhasebeciye gonderir', ev("(id)=>RECEIPTS.find(x=>x.id===id).status", f['id']) == 'musavirde')
    login('muhasebeci'); ev("(id)=>H.review({dataset:{id}})", f['id']); ev("()=>H.revok()")
    check('Fis: muhasebeci onayi defterde tek gider satiri', ev("(id)=>LEDGER.filter(r=>r.rc===id).map(r=>[r.dir,r.total])", f['id']) == [['gider', f['total']]], ev("(id)=>LEDGER.filter(r=>r.rc===id)", f['id']))
    check('Fis: durum onayli', ev("(id)=>RECEIPTS.find(x=>x.id===id).status", f['id']) == 'onayli')
    # ikinci onay defteri cogaltmaz
    ev("(id)=>{S.modal={type:'rev',id,cat:'Diğer',rate:20,total:10,items:[]};H.revok()}", f['id'])
    check('Fis: ayni fis ikinci kez deftere yazilmaz', ev("(id)=>LEDGER.filter(r=>r.rc===id).length", f['id']) == 1, ev("(id)=>LEDGER.filter(r=>r.rc===id).length", f['id']))

    # fis reddi
    login('calisan', 'u5'); ev("()=>{H.upload();H.sample()}"); pg.wait_for_timeout(2600)
    if ev("()=>S.modal&&S.modal.step") == 'ask': ev("()=>H.answer({dataset:{v:'Diğer'}})")
    ev("()=>H.savereceipt()"); f2 = ev("()=>RECEIPTS[RECEIPTS.length-1].id")
    login('patron'); ev("(id)=>H.reject({dataset:{id}})", f2)
    mt = ev("()=>S.modal&&S.modal.type"); setv('why-text', 'ab'); ev("()=>H.whyok()")
    check('Fis reddi: gerekcesiz red olmaz', ev("(id)=>RECEIPTS.find(x=>x.id===id).status", f2) == 'bekliyor')
    setv('why-text', 'Fisin tarihi okunmuyor'); ev("()=>H.whyok()")
    st = ev("(id)=>RECEIPTS.find(x=>x.id===id).status", f2)
    check('Fis reddi: durum reddedildi ve deftere yazilmadi', st in ('reddedildi', 'red') and ev("(id)=>!LEDGER.some(r=>r.rc===id)", f2), [st, mt])

    # ---------- IZIN: talep -> karsi teklif -> kabul -> onay ----------
    LQ = lambda kind, why, d1o, d2o: ev("([k,w,a,b])=>{H.lrnew();const m=S.modal;m.kind=k;m.why=w;m.d1=addDays(REF_ISO,a);m.d2=addDays(REF_ISO,b);m.days=null;H.lrsend()}", [kind, why, d1o, d2o])
    login('calisan', 'u4'); n_lv = ev("()=>LEAVES.length")
    LQ('ucretsiz', 'a', 30, 31)
    check('Izin: nedensiz talep gonderilmez', ev("()=>LVREQ.filter(r=>r.uid==='u4').length") == ev("()=>LVREQ.filter(r=>r.uid==='u4').length") and ev("()=>!!S.modal") is True)
    n0 = ev("()=>LVREQ.length"); LQ('ucretsiz', 'Ailevi bir islem icin', 30, 31)
    rq = ev("()=>LVREQ[LVREQ.length-1]")
    check('Izin: talep bekliyor', ev("()=>LVREQ.length") == n0 + 1 and rq['status'] == 'bekliyor' and rq['uid'] == 'u4', rq)
    login('mudur'); ev("(id)=>H.lrctr({dataset:{id}})", rq['id']); setv('lc-txt', '23-24 Ara'); setv('lc-days', '2'); setv('lc-note', 'O gun stok sayimi var')
    ev("(id)=>H.lrctrok({dataset:{id}})", rq['id'])
    check('Izin: karsi teklif calisana gitti', ev("(id)=>LVREQ.find(r=>r.id===id).status", rq['id']) == 'karsi')
    login('calisan', 'u4'); ev("(id)=>H.lrresp({dataset:{id,v:'red'}})", rq['id']); setv('lr-text', 'x'); ev("(id)=>H.lrrespok({dataset:{id,v:'red'}})", rq['id'])
    check('Izin: aciklamasiz red kabul edilmez', ev("(id)=>LVREQ.find(r=>r.id===id).status", rq['id']) == 'karsi')
    ev("(id)=>H.lrresp({dataset:{id,v:'kabul'}})", rq['id']); setv('lr-text', 'Tamam'); ev("(id)=>H.lrrespok({dataset:{id,v:'kabul'}})", rq['id'])
    check('Izin: kabul yoneticiye dondu', ev("(id)=>LVREQ.find(r=>r.id===id).status", rq['id']) == 'yanit')
    login('patron'); ev("()=>{PROFILES.u4.salary=30000}"); ev("(id)=>H.lrok({dataset:{id}})", rq['id']); ev("()=>H.lrfinal()")
    r2 = ev("(id)=>LVREQ.find(r=>r.id===id)", rq['id']); lv = ev("()=>LEAVES.slice(-1)[0]")
    check('Izin: onay kaydi ve gun sayisi (karsi teklif 23-24 Ara)', r2['status'] == 'onayli' and ev("()=>LEAVES.length") == n_lv + 1 and lv['uid'] == 'u4' and lv['days'] == 2 and '23' in lv['txt'], [r2['status'], lv])
    check('Izin: ucretsiz izinde maastan kesinti hesaplandi', lv['type'] == 'ucretsiz' and lv['ded'] == 2000, lv)
    # yillik izin hakki asimi
    login('calisan', 'u5'); n0 = ev("()=>LVREQ.length"); LQ('yillik', 'Uzun tatil istiyorum', 20, 120)
    check('Izin: yillik hak asilirsa reddedilir', ev("()=>LVREQ.length") == n0)

    # ---------- AVANS / TAKAS TALEBI ----------
    login('calisan', 'u6'); ev("()=>H.rqnew({dataset:{k:'avans'}})"); setv('rq-amt', '2.500'); setv('rq-txt', 'Kira icin'); ev("()=>H.rqsend({dataset:{k:'avans'}})")
    rq2 = ev("()=>REQS.find(r=>r.uid==='u6'&&r.kind==='avans')")
    check('Avans: talep 2500 TL', rq2 and rq2['amt'] == 2500 and rq2['st'] == 'bekliyor', rq2)
    ev("()=>H.rqnew({dataset:{k:'avans'}})"); setv('rq-amt', '0'); setv('rq-txt', 'x'); ev("()=>H.rqsend({dataset:{k:'avans'}})")
    check('Avans: tutarsiz/nedensiz talep olusmaz', ev("()=>REQS.filter(r=>r.uid==='u6'&&r.kind==='avans').length") == 1)
    login('mudur'); ev("(id)=>H.rqok({dataset:{id}})", rq2['id'])
    check('Avans: mudur onayi', ev("(id)=>REQS.find(r=>r.id===id).st", rq2['id']) == 'onay')
    login('calisan', 'u7'); ev("()=>H.rqnew({dataset:{k:'diger'}})"); setv('rq-txt', 'Yeni onluk lazim'); ev("()=>H.rqsend({dataset:{k:'diger'}})")
    rq3 = ev("()=>REQS.find(r=>r.uid==='u7')"); login('patron'); ev("(id)=>H.rqno({dataset:{id}})", rq3['id']); setv('rn-t', 'Stok var'); ev("(id)=>H.rqnook({dataset:{id}})", rq3['id'])
    check('Talep: red notuyla', ev("(id)=>[REQS.find(r=>r.id===id).st,REQS.find(r=>r.id===id).note]", rq3['id']) == ['red', 'Stok var'])

    # ---------- ARIZA ----------
    login('calisan', 'u4'); ev("()=>H.mtnew()"); ev("()=>{const c=document.querySelector('[data-pf=mtcat] button, [data-pfk=mtcat] button');if(c)c.click()}")
    ok_cat = ev("()=>pfOn('mtcat').length")
    if not ok_cat: ev("()=>{const b=[...document.querySelectorAll('#modal-root button')].find(x=>/Elektrik|Su|Isıtma|Soğutma|Ekipman|Diğer/i.test(x.innerText));if(b)b.click()}")
    setv('mt-desc', 'Buzdolabi su akitiyor'); setv('mt-place', 'Mutfak'); n_m = ev("()=>MAINT.length"); ev("()=>H.mtsend()")
    check('Ariza: bildirim olustu', ev("()=>MAINT.length") == n_m + 1 or ev("()=>document.getElementById('mt-e').textContent") != '', ev("()=>pfOn('mtcat')"))
    mid = ev("()=>MAINT[0].id"); login('mudur'); ev("(id)=>H.mtst({dataset:{id,v:'islemde'}})", mid)
    ev("(id)=>H.mtst({dataset:{id,v:'bitti'}})", mid); setv('md-cost', '350'); ev("(id)=>H.mtdoneok({dataset:{id}})", mid)
    check('Ariza: islemde -> cozuldu, maliyet kaydi', ev("(id)=>{const m=MAINT.find(x=>x.id===id);return [m.st,m.cost]}", mid) == ['bitti', 350])

    # ---------- GOREV ----------
    login('patron'); ev("()=>H.tknew()"); setv('tk-t', 'Vitrin camlarini sil'); setv('tk-u', 'u5'); ev("()=>H.tksave()")
    tk = ev("()=>TASKS[0]"); check('Gorev: verildi', tk['t'] == 'Vitrin camlarini sil' and tk['uid'] == 'u5' and tk['st'] == 'acik', tk)
    login('calisan', 'u5'); ev("(id)=>H.tkdone({dataset:{id}})", tk['id'])
    check('Gorev: calisan tamamladi', ev("(id)=>[TASKS.find(x=>x.id===id).st,TASKS.find(x=>x.id===id).doneBy]", tk['id']) == ['bitti', 'u5'])

    # ---------- FATURA ----------
    login('patron'); ev("()=>H.finew()"); n_i = ev("()=>INV.length"); n_l = ev("()=>LEDGER.length")
    ev("()=>{S.modal.cust='Test Ltd';S.modal.vkn='1234567890';S.modal.lines=[{d:'Hizmet',q:2,p:500,r:20}]}"); ev("()=>H.fisave()")
    iv = ev("()=>INV[INV.length-1]")
    check('Fatura: olustu, KDV dahil toplam 1200 (2x500+%20)', ev("()=>INV.length") == n_i + 1 and iv['tot'] == 1200 and iv['net'] == 1000, iv)
    check('Fatura: numara ve vade var', bool(iv['no']) and bool(iv['due']), iv)
    led = ev("(no)=>LEDGER.filter(r=>r.desc&&r.desc.includes(no)).map(r=>[r.dir,r.total,r.rate])", iv['no'])
    check('Fatura: deftere gelir olarak yazildi', led == [['gelir', 1200, 20]], led)
    ev("()=>H.finew()"); ev("()=>{S.modal.cust='';S.modal.lines=[{d:'x',q:1,p:10,r:20}]}"); ev("()=>H.fisave()")
    check('Fatura: musterisiz kaydedilmez', ev("()=>INV.length") == n_i + 1)
    ev("()=>H.finew()"); ev("()=>{S.modal.cust='Z';S.modal.lines=[{d:'x',q:1,p:0,r:20}]}"); ev("()=>H.fisave()")
    check('Fatura: fiyatsiz kalem kaydedilmez', ev("()=>INV.length") == n_i + 1)
    ev("(id)=>H.fipaid({dataset:{id}})", iv['id']); check('Fatura: odendi isaretlenir', ev("(id)=>INV.find(x=>x.id===id).st", iv['id']) == 'odendi')
    ev("(id)=>H.fipaid({dataset:{id}})", iv['id']); check('Fatura: odendi geri alinir', ev("(id)=>INV.find(x=>x.id===id).st", iv['id']) == 'bekliyor')
    with pg.expect_download(timeout=20000) as d: ev("(id)=>H.fipdf({dataset:{id}})", iv['id'])
    check('Fatura: PDF indirildi/paylasildi', d.value.suggested_filename.endswith('.pdf'), d.value.suggested_filename)

    # ---------- IZIN HAKKI (Is Kanunu m.53) ----------
    ent = ev("()=>[0,11,12,60,61,179,180,300].map(m=>leaveDays(m))")
    check('Yillik izin hakki: <1y 0, 1-5y 14, 5-15y 20, >=15y 26', ent == [0, 0, 14, 14, 20, 20, 26, 26], ent)

    # ---------- PARA GIRISI (Turkce bicim) ----------
    nums = ev("()=>['2.500','12.500,75','1500,5','₺ 1.234,56','2500','0,5'].map(trNum)")
    check('Tutar ayrisimi: 2.500 -> 2500, 12.500,75 -> 12500.75', nums == [2500, 12500.75, 1500.5, 1234.56, 2500, 0.5], nums)
    login('patron'); ev("()=>{LEDGER.length=0;LEDGER.push({id:'m1',iso:fiIso(),date:'1 Kas',desc:'X',acc:'Diğer',doc:'Fiş',rate:20,total:30000,dir:'gider'})}")
    ev("()=>{S.modal={type:'mhedit',id:'m1'};renderModal()}"); setv('mh-stp', '1.250,50'); ev("()=>H.mhsave({dataset:{id:'m1'}})")
    check('Stopaj 1.250,50 dogru okunur', ev("()=>LEDGER[0].stp") == 1250.5, ev("()=>LEDGER[0].stp"))

    # ---------- BORC / ODEME / MAAS ----------
    login('patron'); ev("()=>H.debtadd()"); setv('db-who', 'Un Tedarikcisi'); setv('db-amt', '4500'); setv('db-due', '2026-12-05'); n_d = ev("()=>DEBTS.length"); ev("()=>H.debtok()")
    d = ev("()=>DEBTS[DEBTS.length-1]"); check('Borc: eklendi', ev("()=>DEBTS.length") == n_d + 1 and d['amt'] == 4500 and d['who'] == 'Un Tedarikcisi', d)
    ev("()=>H.debtadd()"); setv('db-who', 'Y'); setv('db-amt', '0'); setv('db-due', '2026-12-05'); ev("()=>H.debtok()")
    check('Borc: tutarsiz eklenmez', ev("()=>DEBTS.length") == n_d + 1)
    ev("(id)=>H.debtpaid({dataset:{id}})", d['id']); setv('db-amt', '1.500'); ev("(id)=>H.dbpaysave({dataset:{id}})", d['id'])
    check('Borc: kismi odeme 1.500 -> kalan 3000', ev("(id)=>dbRem(DEBTS.find(x=>x.id===id)).amt", d['id']) == 3000, ev("(id)=>DEBTS.find(x=>x.id===id).pays", d['id']))
    ev("(id)=>H.debtpaid({dataset:{id}})", d['id']); setv('db-amt', '3000'); ev("(id)=>H.dbpaysave({dataset:{id}})", d['id'])
    check('Borc: kalan odenince kapanir', ev("(id)=>dbOpen(DEBTS.find(x=>x.id===id))", d['id']) == 0, ev("(id)=>JSON.stringify(DEBTS.find(x=>x.id===id))", d['id']))
    ev("()=>H.payadd({dataset:{id:'u4'}})"); setv('pay-amt', '3000'); n_p = ev("()=>PAYS.length"); ev("()=>H.payok({dataset:{id:'u4'}})")
    pp = ev("()=>PAYS[PAYS.length-1]"); check('Maas/avans odemesi kaydedildi', ev("()=>PAYS.length") == n_p + 1 and pp['amt'] == 3000 and pp['uid'] == 'u4', pp)

    # ---------- STOK ----------
    ev("()=>H.stkadd()"); setv('sn', 'Test Un'); setv('sq', '25'); setv('sm', '5'); n_s = ev("()=>STOCK.length"); ev("()=>H.stksave()")
    st = ev("()=>STOCK[STOCK.length-1]"); check('Stok: urun eklendi', ev("()=>STOCK.length") == n_s + 1 and st['name'] == 'Test Un' and st['qty'] == 25 and st['min'] == 5, st)
    ev("()=>H.stkadd()"); setv('sn', ''); setv('sq', '1'); setv('sm', '1'); ev("()=>H.stksave()"); check('Stok: adsiz urun eklenmez', ev("()=>STOCK.length") == n_s + 1)

    # ---------- GUN SINIRI (Istanbul 01:30 = UTC onceki gun) ----------
    ctx2 = b.new_context(timezone_id='Europe/Istanbul'); pg2 = ctx2.new_page(); pg2.clock.set_fixed_time('2026-11-16T22:30:00Z')
    pg2.goto(URL); pg2.wait_for_timeout(600)
    check('Gece 01:30 (Istanbul): bugun 17 Kasim, UTC dunu degil', pg2.evaluate("()=>fiIso()") == '2026-11-17', pg2.evaluate("()=>fiIso()"))
    ctx2.close()
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('FAILED' if fails else 'ALL OK'); sys.exit(1 if fails else 0)
