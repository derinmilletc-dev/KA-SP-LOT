"""Kismi tahsilat/odeme, coklu dagitim, ekstre eslestirme (birden cok fatura / kismi)."""
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
    pg.evaluate("""()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe';
      const iso=(d)=>new Date(Date.now()+d*864e5).toISOString().slice(0,10);window.__iso=iso;
      INV.length=0;LEDGER.length=0;
      INV.push({id:'i1',no:'F-1',iso:iso(-40),cust:'ABC Ltd',tot:1000,due:iso(-20),st:'bekliyor',lines:[]},
               {id:'i2',no:'F-2',iso:iso(-30),cust:'ABC Ltd',tot:700,due:iso(-5),st:'bekliyor',lines:[]},
               {id:'i3',no:'F-3',iso:iso(-10),cust:'ABC Ltd',tot:300,due:iso(10),st:'bekliyor',lines:[]},
               {id:'i4',no:'F-4',iso:iso(-10),cust:'Zeta AS',tot:500,due:iso(10),st:'bekliyor',lines:[]});
      render()}""")
    # eski fatura (pays yok)
    check('Eski fatura: acik = toplam', pg.evaluate("()=>ivOpen(INV[0])")==1000)
    # kismi tahsilat
    pg.evaluate("()=>{S.modal={type:'ivpay',id:'i1'};renderModal()}")
    pg.fill('#iv-amt','400'); pg.evaluate("()=>H.ivpaysave({dataset:{id:'i1'}})")
    check('Kismi 400: acik 600, durum bekliyor', pg.evaluate("()=>[ivOpen(INV[0]),INV[0].st,INV[0].pays.length]")==[600,'bekliyor',1])
    check('Kismi tahsilat pill', pg.evaluate("()=>/Kısmi|Vadesi geçti · kalan/.test(fiPill(INV[0]))"))
    check('Yaslandirma kalan tutari kullanir', pg.evaluate("()=>{const a=mxAge(INV.filter(v=>v.st!=='odendi').map(v=>({amt:ivOpen(v),due:v.due,who:v.cust})));return a.reduce((t,r)=>t+r.t,0)}")==600+700+300+500)
    check('Tahsilat grubu toplami kalan', pg.evaluate("()=>{const g=tkGroups().find(x=>x.name==='ABC Ltd');return g.total}")==600+700)
    check('Kais fatura durumu kalan', '600' in pg.evaluate("()=>kaInvStatus().content") or '2.100' in pg.evaluate("()=>kaInvStatus().content"))
    # fazla tutar reddedilir
    pg.evaluate("()=>{S.modal={type:'ivpay',id:'i1'};renderModal()}"); pg.fill('#iv-amt','9999'); pg.evaluate("()=>H.ivpaysave({dataset:{id:'i1'}})")
    check('Fazla tutar reddedildi', pg.evaluate("()=>[ivOpen(INV[0]),INV[0].pays.length]")==[600,1])
    # kalan tamamlanir
    pg.evaluate("()=>{S.modal={type:'ivpay',id:'i1'};renderModal()}"); pg.fill('#iv-amt','600'); pg.evaluate("()=>H.ivpaysave({dataset:{id:'i1'}})")
    check('Kalan odenince fatura odendi', pg.evaluate("()=>[INV[0].st,ivOpen(INV[0]),INV[0].pays.length]")==['odendi',0,2])
    # cok faturaya dagit: ABC acik = F-2 700 + F-3 300
    pg.evaluate("()=>{H.ivdagit();IVD.key=mxKey('ABC Ltd');IVD.amt='800';ivdAuto();renderModal()}")
    al = pg.evaluate("()=>JSON.stringify(IVD.al)")
    check('Dagitim en eski vadeden baslar (F-2 700, F-3 100)', al == '{"i2":700,"i3":100}', al)
    pg.evaluate("()=>H.ivdsave()")
    check('Dagitim islendi', pg.evaluate("()=>[INV[1].st,ivOpen(INV[2])]")==['odendi',200])
    # ekstre: cok fatura / kismi
    pg.evaluate("()=>{INV.length=0;INV.push({id:'a1',no:'A-1',iso:__iso(-30),cust:'Beta Gıda',tot:500,due:__iso(-3),st:'bekliyor',lines:[]},{id:'a2',no:'A-2',iso:__iso(-20),cust:'Beta Gıda',tot:700,due:__iso(5),st:'bekliyor',lines:[]},{id:'a3',no:'A-3',iso:__iso(-20),cust:'Gamma',tot:90,due:__iso(5),st:'bekliyor',lines:[]})}")
    r = pg.evaluate("""()=>{const t=(a,d,k)=>({iso:__iso(0),amt:a,desc:d,key:k});
      const R=mxMatch([t(1200,'Havale BETA GIDA','k1'),t(300,'EFT Beta Gida','k2'),t(555,'Bilinmeyen kisi','k3')]);return R.map(x=>[x.kind,(x.alloc||[]).map(y=>y.v.no+':'+y.amt).join('|')])}""")
    check('Ekstre: 1200 = A-1 + A-2 (birden cok fatura)', r[0]==['invmulti','A-1:500|A-2:700'], r)
    check('Ekstre: ayni faturalar ikinci hareketle tekrar kullanilmaz', r[1][0]=='new', r)
    r1 = pg.evaluate("()=>mxMatch([{iso:__iso(0),amt:300,desc:'EFT Beta Gida',key:'k2'}]).map(x=>[x.kind,(x.alloc||[]).map(y=>y.v.no+':'+y.amt).join('|')])")
    check('Ekstre: tek basina 300 = A-1 kismi tahsilat', r1[0]==['invpart','A-1:300'], r1)
    check('Ekstre: isimsiz tutar yeni kayit', r[2][0]=='new', r)
    pg.evaluate("""()=>{MX.res=mxMatch([{iso:__iso(0),amt:300,desc:'EFT Beta Gida',key:'k2'}]);MX.sel={0:true};H.mxapply()}""")
    check('Ekstre uygulandi: A-1 kalan 200', pg.evaluate("()=>[ivOpen(INV[0]),INV[0].st,INV[0].pays[0].src]")==[200,'bekliyor','Banka'])
    pg.evaluate("""()=>{MX.res=mxMatch([{iso:__iso(0),amt:900,desc:'Havale Beta Gida',key:'k4'}]);MX.sel={};H.mxapply()}""")
    check('Secilmeyen oneri uygulanmaz (varsayilan kapali)', pg.evaluate("()=>[ivOpen(INV[0]),ivOpen(INV[1])]")==[200,700])
    pg.evaluate("""()=>{MX.res=mxMatch([{iso:__iso(0),amt:900,desc:'Havale Beta Gida',key:'k4'}]);MX.sel={0:true};H.mxapply()}""")
    check('Secilince 900 = 200 + 700 islendi', pg.evaluate("()=>[INV[0].st,INV[1].st]")==['odendi','odendi'])
    # borc kismi
    pg.evaluate("()=>{DEBTS.length=0;DEBTS.push({id:'d9',who:'Un Fab.',note:'Mayis',amt:1000,due:__iso(3),rem:3,on:true})}")
    pg.evaluate("()=>{H.debtpaid({dataset:{id:'d9'}})}")
    check('Odendi tiklaninca tutar penceresi acilir', pg.evaluate("()=>S.modal&&S.modal.type")=='dbpay')
    pg.fill('#db-amt','250'); pg.evaluate("()=>H.dbpaysave({dataset:{id:'d9'}})")
    check('Borc kismi: kalan 750, acik', pg.evaluate("()=>{const d=allDebts().find(x=>x.id==='d9');return [d.amt,!!d.paid]}")==[750,False])
    pg.evaluate("()=>{S.modal={type:'dbpay',id:'d9'};renderModal()}"); pg.fill('#db-amt','750'); pg.evaluate("()=>H.dbpaysave({dataset:{id:'d9'}})")
    check('Borc tamamen odendi', pg.evaluate("()=>{const d=allDebts().find(x=>x.id==='d9');return !!d.paid}"))
    # cari ekstre
    pg.evaluate("()=>{INV.length=0;INV.push({id:'c1',no:'C-1',iso:__iso(-9),cust:'Delta',tot:1000,due:__iso(1),st:'bekliyor',pays:[{id:'x',iso:__iso(-1),amt:400}],lines:[]})}")
    check('Cari ekstre kismi kalan 600', pg.evaluate("()=>mxCariRows('musteri','Delta')[0].tot")==600)
    pg.evaluate("()=>{H.ivdagit()}"); check('Odeme dagit penceresi (acik fatura var)', 'Ödeme dağıt' in pg.evaluate("()=>document.getElementById('modal-root').innerText"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nBASARISIZ' if fails else '\nHEPSI GECTI'); sys.exit(1 if fails else 0)
