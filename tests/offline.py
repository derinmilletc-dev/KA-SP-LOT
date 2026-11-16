"""Cevrimdisi yazma kuyrugu ve 3 yollu birlestirme: sahte sunucu (surumlu), iki cihaz, baglanti kopmasi, yeniden acilis."""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)

SETUP = """()=>{
  window.SRV={ekip:{state:JSON.stringify({seq:200,ROLES:{},PROFILES:{},SETTINGS:{shop:1},RECEIPTS:[]}),version:3},
              muh:{state:JSON.stringify({LEDGER:[{id:'s1',iso:'2026-11-01',date:'1',desc:'Eski',acc:'Satış',doc:'Fatura',rate:10,total:100,dir:'gelir'}],INV:[],DEBTS:[]}),version:5},
              stok:{state:JSON.stringify({STOCK:[]}),version:1}};
  window.OFF=false;window.WR=0;
  const net=()=>{ if(window.OFF) throw new TypeError('Failed to fetch') };
  const q=(table)=>{ const st={f:{}};const o={
      select(){st.sel=1;return o},eq(k,v){st.f[k]=v;return o},limit(){return o},in(){return o},
      insert(row){return {then:(f)=>{try{net()}catch(e){return f({error:{message:'Failed to fetch'}})};if(SRV[row.scope])return f({error:{message:'duplicate key 23505',code:'23505'}});SRV[row.scope]={state:row.state,version:row.version};f({error:null})}}},
      update(row){st.upd=row;return o},delete(){return o},
      then(f){ try{net()}catch(e){return f({error:{message:'Failed to fetch'}})}
        const rows=Object.keys(SRV).filter(k=>!st.f.scope||st.f.scope===k).map(k=>({scope:k,state:SRV[k].state,version:SRV[k].version}));
        if(st.upd){const r=SRV[st.f.scope]; if(!r||r.version!==st.f.version)return f({data:[],error:null}); r.state=st.upd.state;r.version=st.upd.version;WR++;return f({data:[{version:r.version}],error:null})}
        return f({data:rows,error:null}) } };return o};
  window.fake={from:q,rpc:async()=>({data:null})};
  sbClient=()=>fake;
  const u=USERS.find(x=>x.role==='patron');loginAs(u);ID.active={role:'patron',app_uid:u.id,business_id:'bz'};SBS.biz={id:'bz'};SBS.user={id:'uu1'};
  PS.db=PS.db||{doc:()=>({set(){},onSnapshot(){}})};PS.localDb=PS.db;CL.on=false;PS.loaded=true;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(600)

    # ---- A) birlestirme birim testleri
    t = pg.evaluate("""()=>{const M=(b,l,r)=>{const st={n:0};const o=kqMerge(b,l,r,st);return [JSON.stringify(o),st.n]};const out={};
      const row=(id,x)=>Object.assign({id},x||{});
      out.addBoth=M({A:[row(1)]},{A:[row(1),row(2)]},{A:[row(1),row(3)]});
      out.delLocal=M({A:[row(1),row(2)]},{A:[row(1)]},{A:[row(1),row(2),row(3)]});
      out.delRemote=M({A:[row(1),row(2)]},{A:[row(1),row(2)]},{A:[row(1)]});
      out.editLocalOnly=M({A:[row(1,{v:1})]},{A:[row(1,{v:2})]},{A:[row(1,{v:1}),row(9)]});
      out.fieldMerge=M({A:[row(1,{x:1,y:1})]},{A:[row(1,{x:2,y:1})]},{A:[row(1,{x:1,y:5})]});
      out.sameFieldConflict=M({A:[row(1,{x:1})]},{A:[row(1,{x:2})]},{A:[row(1,{x:3})]});
      out.delVsEdit=M({A:[row(1,{x:1})]},{A:[]},{A:[row(1,{x:7})]});
      out.objKeys=M({S:{a:1,b:1}},{S:{a:2,b:1}},{S:{a:1,b:3}});
      out.seq=M({seq:100},{seq:150},{seq:120});
      out.noBase=(()=>{const st={n:0};return [JSON.stringify(kqMerge(undefined,{A:[row(1),row(2)]},{A:[row(1),row(3)]},st)),st.n]})();
      out.unchanged=M({A:[row(1)]},{A:[row(1)]},{A:[row(1),row(4)]});
      return out}""")
    ids = lambda s: sorted([x['id'] for x in __import__('json').loads(s[0])['A']])
    check('Birlestir: iki taraf farkli ekledi -> ikisi de', ids(t['addBoth']) == [1,2,3], t['addBoth'])
    check('Birlestir: yerelde silinen silinir, uzaktaki yeni kalir', ids(t['delLocal']) == [1,3], t['delLocal'])
    check('Birlestir: uzakta silinen (yerelde degismemis) silinir', ids(t['delRemote']) == [1], t['delRemote'])
    check('Birlestir: yerel duzenleme + uzak ekleme', ids(t['editLocalOnly']) == [1,9] and '"v":2' in t['editLocalOnly'][0], t['editLocalOnly'])
    check('Birlestir: ayri alanlar ikisi de korunur', '"x":2' in t['fieldMerge'][0] and '"y":5' in t['fieldMerge'][0] and t['fieldMerge'][1] == 0, t['fieldMerge'])
    check('Birlestir: ayni alan cakismasi yerel kazanir, sayilir', '"x":2' in t['sameFieldConflict'][0] and t['sameFieldConflict'][1] == 1, t['sameFieldConflict'])
    check('Birlestir: yerelde silinmis ama uzakta duzenlenmis -> uzak korunur', ids(t['delVsEdit']) == [1] and '"x":7' in t['delVsEdit'][0] and t['delVsEdit'][1] == 1, t['delVsEdit'])
    check('Birlestir: nesne anahtarlari ayri ayri', '"a":2' in t['objKeys'][0] and '"b":3' in t['objKeys'][0], t['objKeys'])
    check('Birlestir: seq buyuk olan', '"seq":150' in t['seq'][0], t['seq'])
    check('Birlestir: taban yoksa birlesim', ids(t['noBase']) == [1,2,3], t['noBase'])
    check('Birlestir: yerel degismediyse uzak aynen', ids(t['unchanged']) == [1,4], t['unchanged'])

    # ---- B) sahte sunucu entegrasyonu
    pg.evaluate(SETUP)
    pg.evaluate("async()=>{await cloudAttach()}"); pg.wait_for_timeout(200)
    check('Acilis: sunucu verisi yuklendi', pg.evaluate("()=>LEDGER.map(x=>x.id)") == ['s1'])
    # B cihazi sunucuya satir ekler
    pg.evaluate("""()=>{const s=JSON.parse(SRV.muh.state);s.LEDGER.push({id:'b1',iso:'2026-11-02',date:'2',desc:'B cihazi',acc:'Satış',doc:'Fatura',rate:10,total:50,dir:'gelir'});SRV.muh={state:JSON.stringify(s),version:SRV.muh.version+1}}""")
    # yerelde cevrimdisi satir ekle
    pg.evaluate("()=>{OFF=true;LEDGER.push({id:'a1',iso:'2026-11-03',date:'3',desc:'Yerel',acc:'Satış',doc:'Fatura',rate:10,total:70,dir:'gelir'})}")
    pg.evaluate("async()=>{await pFlush()}"); pg.wait_for_timeout(300)
    check('Baglanti yokken durum hata + kuyrukta', pg.evaluate("()=>[PS.state,!!PS.queued]") == ['error', True])
    e = pg.evaluate("async()=>{const e=await kqGet(kqKey());return e?Object.keys(JSON.parse(JSON.stringify(e.cur))):null}")
    check('Degisiklik cihazda (IndexedDB) saklandi', e and 'muh' in e, e)
    # baglanti geldi: yoklama -> birlestir -> yaz
    pg.evaluate("()=>{OFF=false}")
    pg.evaluate("async()=>{await cloudPoll()}"); pg.wait_for_timeout(200)
    check('Poll sonrasi yerelde iki satir da var (a1 + b1)', sorted(pg.evaluate("()=>LEDGER.map(x=>x.id)")) == ['a1','b1','s1'], pg.evaluate("()=>LEDGER.map(x=>x.id)"))
    pg.evaluate("async()=>{PS.last='';await pFlush()}"); pg.wait_for_timeout(300)
    srv = pg.evaluate("()=>JSON.parse(SRV.muh.state).LEDGER.map(x=>x.id).sort()")
    check('Sunucuda ikisi de var, hicbiri ezilmedi', srv == ['a1','b1','s1'], srv)
    check('Yazim sonrasi kuyruk temizlendi', pg.evaluate("async()=>!(await kqGet(kqKey()))"))
    check('Durum kaydedildi', pg.evaluate("()=>PS.state") == 'saved')

    # surum cakismasi (yazarken baska cihaz yazdi) -> ezme yok
    pg.evaluate("""()=>{const s=JSON.parse(SRV.muh.state);s.LEDGER.push({id:'b2',iso:'2026-11-04',date:'4',desc:'B2',acc:'Satış',doc:'Fatura',rate:10,total:5,dir:'gelir'});SRV.muh={state:JSON.stringify(s),version:SRV.muh.version+1};
      LEDGER.push({id:'a2',iso:'2026-11-05',date:'5',desc:'Yerel2',acc:'Satış',doc:'Fatura',rate:10,total:9,dir:'gelir'})}""")
    pg.evaluate("async()=>{await pFlush()}"); pg.wait_for_timeout(400); pg.evaluate("async()=>{await pFlush()}"); pg.wait_for_timeout(300)
    srv = pg.evaluate("()=>JSON.parse(SRV.muh.state).LEDGER.map(x=>x.id).sort()")
    loc = sorted(pg.evaluate("()=>LEDGER.map(x=>x.id)"))
    check('Surum cakismasinda iki cihazin satiri da kaldi (sunucu)', srv == ['a1','a2','b1','b2','s1'], srv)
    check('...ve yerelde de', loc == ['a1','a2','b1','b2','s1'], loc)

    # yeniden acilis: cevrimdisi duzenle, uygulamayi kapat (bellek bosalir), baglanti gelince ac
    pg.evaluate("()=>{OFF=true;LEDGER.push({id:'a3',iso:'2026-11-06',date:'6',desc:'Kapanmadan once',acc:'Satış',doc:'Fatura',rate:10,total:11,dir:'gelir'})}")
    pg.evaluate("async()=>{await pFlush()}"); pg.wait_for_timeout(300)
    pg.evaluate("""()=>{const s=JSON.parse(SRV.muh.state);s.LEDGER.push({id:'b3',iso:'2026-11-07',date:'7',desc:'B3',acc:'Satış',doc:'Fatura',rate:10,total:3,dir:'gelir'});SRV.muh={state:JSON.stringify(s),version:SRV.muh.version+1};
      cloudOff();LEDGER.length=0;OFF=false;}""")
    pg.evaluate("async()=>{await cloudAttach()}"); pg.wait_for_timeout(1500)
    pg.evaluate("async()=>{await pFlush()}"); pg.wait_for_timeout(400)
    srv = pg.evaluate("()=>JSON.parse(SRV.muh.state).LEDGER.map(x=>x.id).sort()")
    check('Yeniden acilista bekleyen degisiklik gonderildi, uzak satir da var', srv == ['a1','a2','a3','b1','b2','b3','s1'], srv)
    check('Yeniden acilis sonrasi kuyruk temiz', pg.evaluate("async()=>!(await kqGet(kqKey()))"))

    # bir bolumde yerel degisiklik yokken uzak aynen uygulanir
    pg.evaluate("""()=>{const s=JSON.parse(SRV.stok.state);s.STOCK.push({id:'k1',name:'Un',unit:'kg',qty:5});SRV.stok={state:JSON.stringify(s),version:SRV.stok.version+1}}""")
    pg.evaluate("async()=>{await cloudPoll()}"); pg.wait_for_timeout(200)
    check('Modal aciksa uzak degisiklik bekler', pg.evaluate("()=>!S.modal||!STOCK.some(x=>x.id==='k1')"))
    pg.evaluate("()=>{S.modal=null;render()}"); pg.wait_for_timeout(200)
    check('Degismemis bolum uzaktan aynen gelir', pg.evaluate("()=>STOCK.some(x=>x.id==='k1')"))
    n0 = pg.evaluate("()=>WR"); pg.evaluate("async()=>{await pFlush()}"); pg.wait_for_timeout(300)
    check('Uzak degisiklik gereksiz geri yazim yaratmadi', pg.evaluate("()=>WR") == n0, pg.evaluate("()=>WR") - n0)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nBASARISIZ' if fails else '\nHEPSI GECTI'); sys.exit(1 if fails else 0)
