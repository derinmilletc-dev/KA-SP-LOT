from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); er=[]; pg.on('pageerror',lambda e:er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto('file:///home/claude/ka-sp-lot/index.html'); pg.wait_for_timeout(500)
    r=pg.evaluate("""()=>{
      LEDGER.length=0; S.tper='hepsi'; S.sub.tablo='gider'; S.tch='hepsi';
      const iso=fiIso(); const mk=(id,ch,t)=>({id,date:'01.01',iso,desc:'x'+id,acc:'Diğer',total:t,rate:0,ch});
      LEDGER.push(mk('g1','nakit',100),mk('g2','banka',2000),mk('g3','',50));
      const out={};
      out.all=tabloHTML(); S.tch='nakit'; out.nakit=tabloHTML(); S.tch='banka'; S.settings=S.settings||{}; S.settings.kcur={banka:{sym:'$',code:'USD',name:'Dolar'}}; out.banka=tabloHTML(); S.tch='yok'; out.yok=tabloHTML(); S.tch='hepsi'; out.hepsi2=tabloHTML();
      out.sym=curSym(); return out}""")
    print(len(r['all']))
    assert 'Nakit (1)' in r['all'] and 'Banka (1)' in r['all'] and 'Belirtilmemiş (1)' in r['all']
    assert 'xg1' in r['nakit'] and 'xg2' not in r['nakit'] and 'xg3' not in r['nakit']
    assert 'xg2' in r['banka'] and 'xg1' not in r['banka'] and '$' in r['banka'] and '2.000' in r['banka']
    assert 'xg3' in r['yok'] and 'xg1' not in r['yok']
    assert 'karışık' in r['hepsi2']
    assert r['sym']=='₺','ctx leak'
    print(pg.evaluate("()=>{S.settings.kcur.nakit={sym:'€'};S.tch='hepsi';const h=NEWM.mxkb?String(NEWM.mxkb()).includes('Hesap para birimi'):false;return h}"))
    assert not er,er
    print('ALL OK')
