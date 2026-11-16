"""Hesap plani, mizan, gelir tablosu, bilanco, tevkifat/OTV/stopaj, doviz."""
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
    pg.evaluate("""()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe';INV.length=0;LEDGER.length=0;
      const ym=fiIso().slice(0,7);window.__ym=ym;
      LEDGER.push({id:'s1',iso:ym+'-02',date:'2',desc:'Satis',acc:'Satış',doc:'Fatura',rate:20,total:1200,dir:'gelir'},
                  {id:'s2',iso:ym+'-03',date:'3',desc:'Tevkifatli satis',acc:'Satış',doc:'Fatura',rate:20,total:1200,dir:'gelir',tv:'5/10'},
                  {id:'e1',iso:ym+'-04',date:'4',desc:'Kira',acc:'Kira',doc:'Fatura',rate:20,total:1200,dir:'gider'},
                  {id:'e2',iso:ym+'-05',date:'5',desc:'Akaryakit OTV',acc:'Akaryakıt',doc:'Fiş',rate:20,total:1300,dir:'gider',otv:100},
                  {id:'e3',iso:ym+'-06',date:'6',desc:'Belgesiz',acc:'Diğer',doc:'—',rate:0,total:500,dir:'gider'},
                  {id:'e4',iso:ym+'-07',date:'7',desc:'Stopajli',acc:'Diğer',doc:'Fatura',rate:20,total:1200,dir:'gider',stp:120},
                  {id:'e5',iso:ym+'-08',date:'8',desc:'Un',acc:'Hammadde',doc:'Fatura',rate:10,total:1100,dir:'gider'});
      render()}""")
    ent = lambda i: pg.evaluate("(i)=>mhEntries(LEDGER[i]).map(e=>e.k+':'+e.b+'/'+e.a).join(',')", i)
    check('Satis: 100 borc 1200, 600 alacak 1000, 391 200', ent(0) == '100:1200/0,600:0/1000,391:0/200', ent(0))
    check('Tevkifat 5/10: 100 borc 1100, 136 borc 100', ent(1) == '100:1100/0,136:100/0,600:0/1000,391:0/200', ent(1))
    check('Belgeli gider: 770 borc 1000, 191 borc 200', ent(2) == '770:1000/0,191:200/0,100:0/1200', ent(2))
    check('OTV maliyete eklenir (770 borc 1100)', ent(3) == '770:1100/0,191:200/0,100:0/1300', ent(3))
    check('Belgesiz gider KDV yok', ent(4) == '770:500/0,100:0/500', ent(4))
    check('Stopaj: 100 alacak 1080, 360 alacak 120', ent(5) == '770:1000/0,191:200/0,100:0/1080,360:0/120', ent(5))
    check('Hammadde 621e eslenir', pg.evaluate("()=>mhKod(LEDGER[6])") == '621')
    z = pg.evaluate("()=>{const g=mhRange();const z=mhMizan(g.from,g.to);return [z.ok,z.tb,z.ta]}")
    check('Mizan borc=alacak', z[0] and z[1] == z[2], z)
    g = pg.evaluate("()=>{const g=mhRange();const x=mhGelirTablosu(g.from,g.to);return [x.sat,x.mal,x.brut,x.gtop,x.dig,x.net]}")
    # satis 2000, maliyet 1000, giderler 1000+1100+500+1000=3600
    check('Gelir tablosu: satis 2000, maliyet 1000, gider 3600, net -2600', g == [2000, 1000, 1000, 3600, 0, -2600], g)
    bl = pg.evaluate("()=>{const g=mhRange();const B=mhBilanco(g.to);return [B.ok,B.aktif,B.pasif]}")
    check('Bilanco aktif=pasif', bl[0], bl)
    kd = pg.evaluate("()=>{const K=mxKdv(__ym);return [K.hes,K.ind,K.net,K.sor,K.tvs]}")
    # satis1 kdv200 + satis2 kdv200-100(tevkifat)=100 -> 300; alis kdv: e1 200, e2 (OTV dusulunce 1200/1.2) 200, e4 200, e5 100 = 700; sorumlu 0
    check('KDV: tevkifatli satista musterinin kestigi KDV hesaplanana yazilmaz', kd[0] == 300 and kd[4] == 100, kd)
    check('KDV: OTV matrahtan dusuldu, indirilecek 700', kd[1] == 700, kd)
    pg.evaluate("()=>{LEDGER[2].tv='5/10'}")
    kd = pg.evaluate("()=>{const K=mxKdv(__ym);return [K.hes,K.ind,K.sor]}")
    check('KDV: alista tevkifat sorumlu sifatiyla hesaplanana eklenir, indirilecek tam', kd == [400, 700, 100], kd)
    pg.evaluate("()=>{delete LEDGER[2].tv}")
    kd2 = pg.evaluate("()=>{const d=kdvData(CURM);return [typeof d.hes]}")
    check('Eski KDV ozeti calisir', kd2 == ['number'])
    # hesap eslemesi degisimi
    pg.evaluate("()=>{mhMap()['Kira']='740'}")
    check('Hesap eslemesi gecerli (Kira 740)', pg.evaluate("()=>mhKod(LEDGER[2])") == '740')
    pg.evaluate("()=>{delete S.settings.hmap['Kira']}")
    # acilis bakiyesi ve bagli acik fatura
    pg.evaluate("()=>{S.settings.mhOpen=5000;INV.push({id:'i1',no:'F-9',iso:__ym+'-02',cust:'X',tot:1200,due:__ym+'-20',st:'bekliyor',lines:[]});LEDGER[0].desc='Fatura F-9 · X'}")
    bl = pg.evaluate("()=>{const B=mhBilanco(mhRange().to);return [B.ok,B.alici,B.sermaye]}")
    check('Acik fatura aliciya, acilis sermayeye; denge korunur', bl == [True, 1200, 5000], bl)
    # arayuz
    pg.evaluate("()=>{S.modal=null;S.view='muhasebe';render()}")
    check('Giris kartinda iki yeni kisayol', pg.evaluate("()=>!!document.querySelector('[data-a=mhrap]')&&!!document.querySelector('[data-a=mhrows]')"))
    for t in ['mizan', 'gelir', 'bilanco']:
        pg.evaluate("(t)=>{MH.tab=t;H.mhrap()}", t)
        check('Sekme ' + t + ' acilir', pg.evaluate("()=>/Hesap|Brüt|Aktif/.test(document.body.innerText)"))
    pg.evaluate("()=>H.mhmap()"); check('Hesap esleme penceresi', pg.evaluate("()=>document.querySelectorAll('[data-hm]').length")>=3)
    # kayit ayrintisi: doviz
    pg.evaluate("()=>{S.modal={type:'mhedit',id:'e1'};renderModal()}")
    pg.select_option('#mh-cur', 'USD'); pg.fill('#mh-fx', '40'); pg.fill('#mh-kur', '30'); pg.select_option('#mh-tv', '5/10')
    pg.evaluate("()=>H.mhsave({dataset:{id:'e1'}})")
    check('Doviz: toplam 40x30=1200 TL, tevkifat kaydedildi', pg.evaluate("()=>[LEDGER[2].total,LEDGER[2].cur,LEDGER[2].tv]") == [1200, 'USD', '5/10'])
    pg.evaluate("()=>{S.modal={type:'mhedit',id:'e1'};renderModal()}"); pg.fill('#mh-otv', '5000')
    pg.evaluate("()=>H.mhsave({dataset:{id:'e1'}})")
    check('OTV toplamdan buyukse reddedilir', pg.evaluate("()=>!LEDGER[2].otv"))
    pg.evaluate("()=>{S.modal={type:'mhedit',id:'e1'};renderModal()}"); pg.select_option('#mh-cur', 'TRY'); pg.fill('#mh-otv', ''); pg.select_option('#mh-tv', '')
    pg.evaluate("()=>H.mhsave({dataset:{id:'e1'}})")
    check('TRY a donunce doviz alanlari silinir', pg.evaluate("()=>[LEDGER[2].cur,LEDGER[2].fx,LEDGER[2].tv]") == [None, None, None])
    # excel
    pg.evaluate("()=>{S.modal={type:'mhrap'};renderModal()}")
    with pg.expect_download(timeout=15000) as d: pg.evaluate("()=>H.mhxl()")
    check('Mizan Excel indirildi', d.value.suggested_filename.startswith('mizan-'))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('FAILED' if fails else 'ALL OK'); sys.exit(1 if fails else 0)
