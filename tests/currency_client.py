"""Hesap bazinda para birimi (raporlar, CSV) ve fis okumada KDV tahmini yasagi / para birimi uyarisi."""
import os, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 800}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render()}")
    txt = lambda: pg.evaluate("()=>document.body.innerText")
    # --- raporlar ---
    pg.evaluate("""()=>{
      LEDGER.length=0; INV.length=0;
      const per=(typeof CURM==='string')?CURM:'';
      const mk=(id,dir,ch,tot,acc)=>({id,dir,ch,total:tot,acc:acc||'Hammadde',desc:'x'+id,date:'05 '+CURA,rate:0,src:'Elle',doc:''});
      LEDGER.push(mk('a1','gelir','nakit',1000),mk('a2','gider','nakit',400),mk('a3','gelir','banka',5000),mk('a4','gider','banka',2000));
      S.settings=S.settings||{}; S.settings.kcur={nakit:{sym:'R',code:'ZAR',name:'Rand'},banka:{sym:'₺',code:'TRY',name:'Türk lirası'}};
      S.settings.cur=S.settings.cur||{sym:'₺',code:'TRY',name:'Türk lirası'};
      S.rcur=''; S.view='rapor'; render();
    }""")
    pg.wait_for_timeout(600)
    t = txt()
    check('Rapor sayfasi acildi', 'Raporlar' in t, t[:200])
    check('Para birimi secimi gorunur', pg.locator('[data-a=rcur]').count() == 2, pg.locator('[data-a=rcur]').count())
    check('Toplanmaz uyarisi', 'toplanmaz' in t)
    # varsayilan para birimi (TL) gorunumu: yalniz banka satirlari
    n0 = pg.evaluate("()=>LEDGER.length")
    check('Rapor sonrasi defter geri yuklendi (4 satir)', n0 == 4, n0)
    ring = pg.evaluate("()=>rcurList()")
    check('Para birimi listesi TL ve R', sorted(ring) == sorted(['₺', 'R']), ring)
    # Rand gorunumu
    pg.click('[data-a=rcur][data-v=R]'); pg.wait_for_timeout(500)
    t = txt()
    check('Rand gorunumunde R simgesi', 'R 1.000' in t.replace(' ', ' ') or 'R 600' in t.replace(' ', ' ') or 'R ' in t, t[:300])
    check('Rand gorunumunde TL banka tutari yok', '5.000' not in t and '3.000' not in t, t[:400])
    pg.click('[data-a=rcur][data-v="₺"]'); pg.wait_for_timeout(500); t2 = txt().replace('\u00a0', ' ')
    check('TL gorunumu: gelir 5.000 ₺, gider 2.000 ₺, net 3.000 ₺', '5.000 ₺' in t2 and '2.000 ₺' in t2 and '3.000 ₺' in t2 and 'R 1.000' not in t2, t2[:400])
    pg.click('[data-a=rcur][data-v=R]'); pg.wait_for_timeout(400); t = txt()
    check('Defter yine 4 satir', pg.evaluate("()=>LEDGER.length") == 4)
    check('Simge zorlamasi sifirlandi', pg.evaluate("()=>CURFORCE") == '')
    check('Faturalar yalniz TL raporunda notu', 'yalnızca ₺ raporunda' in t)
    # tek para birimi: secim cikmaz
    pg.evaluate("()=>{S.settings.kcur={};render()}"); pg.wait_for_timeout(300)
    check('Tek para biriminde secim yok', pg.locator('[data-a=rcur]').count() == 0)
    # CSV
    pg.evaluate("()=>{S.settings.kcur={nakit:{sym:'R',code:'ZAR',name:'Rand'},banka:{sym:'₺',code:'TRY',name:'TL'}}}")
    csv = pg.evaluate("()=>csvText()").split('\n')
    check('CSV para birimi sutunu', csv[0].endswith(';Para birimi') and csv[1].endswith(';R') and csv[3].endswith(';₺'), csv[:4])
    # --- fis okuma ---
    pg.evaluate("""()=>{
      window.__ai={}; SBS.c={from:()=>({select:()=>({eq:()=>({}),}),}),auth:{getSession:async()=>({data:{session:null}})},
        functions:{invoke:async(n,o)=>({data:{data:window.__ai},error:null})}};
      SBS.user={id:'u-1',email:'p@x.com'}; SBS.biz={id:'11111111-1111-1111-1111-111111111111',name:'Biz'}; S.noAI=false;
      window.__pick=async()=>{ S.modal={type:'upload',step:'pick'}; renderModal(); const f=new File([new Uint8Array(3000)],'fis.jpg',{type:'image/jpeg'});
        aiPrepFile=async()=>({type:'image',media_type:'image/jpeg',data:'x'.repeat(200)}); onChange({target:{dataset:{ch:'file'},files:[f]}}); };
    }""")
    def run(ai):
        pg.evaluate("(a)=>{__ai=a}", ai); pg.evaluate("()=>__pick()"); pg.wait_for_timeout(900)
        return pg.evaluate("()=>S.modal&&S.modal.sample")
    s = run({'satici': 'Migros', 'tarih': '2026-11-10', 'toplam': 120.5, 'kdv_orani': None, 'kategori': 'Hammadde', 'guven': 'orta'})
    check('KDV okunamadi: oran bos, tahmin isaretli', s and s['rate'] is None and s['rateGuess'] is True, s)
    t = txt(); check('Secim kutusu Sec ile baslar, 10 degil', pg.evaluate("()=>document.getElementById('oc-rate').value") == '' and 'kendin seç' in t, t[:200])
    n = pg.evaluate("()=>RECEIPTS.length"); pg.evaluate("()=>H.savereceipt()"); pg.wait_for_timeout(300)
    check('Oran secilmeden kaydedilmez', pg.evaluate("()=>RECEIPTS.length") == n)
    pg.select_option('#oc-rate', '20'); pg.evaluate("()=>H.savereceipt()"); pg.wait_for_timeout(400)
    check('Oran secilince kaydedilir, %20', pg.evaluate("()=>RECEIPTS.length") == n + 1 and pg.evaluate("()=>RECEIPTS[RECEIPTS.length-1].rate") == 20)
    s = run({'satici': 'A', 'tarih': '2026-11-10', 'toplam': 50, 'kdv_orani': 10, 'kategori': 'Hammadde', 'guven': 'orta'})
    check('Orta guvenle gelen %10 tahmin sayilir', s and s['rate'] is None and s['rateGuess'] is True, s)
    s = run({'satici': 'A', 'tarih': '2026-11-10', 'toplam': 50, 'kdv_orani': 10, 'kategori': 'Hammadde', 'guven': 'yuksek'})
    check('Yuksek guvenle %10 kabul', s and s['rate'] == 10 and s['rateGuess'] is False, s)
    s = run({'satici': 'A', 'tarih': '2026-11-10', 'toplam': 50, 'kdv_orani': 8, 'kategori': 'Hammadde', 'guven': 'yuksek', 'para_birimi': 'USD'})
    check('%8 gecerli oran', s and s['rate'] == 8 and s['cur'] == 'USD', s)
    check('Para birimi uyarisi', 'Fişte para birimi' in txt() and 'USD' in txt())
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nBASARISIZ: %d' % len(fails) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
