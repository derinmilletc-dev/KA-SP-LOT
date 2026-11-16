"""Şube kısıtlı muhasebeci: istemci yalnızca st_get/st_put/st_versions RPC'lerini kullanır, doğrudan app_state'e dokunmaz."""
import os, sys
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});er=[];pg.on('pageerror',lambda e:er.append(str(e)))
    pg.goto(URL);pg.wait_for_timeout(700)
    r=pg.evaluate("""async()=>{
      const out={};window.__calls=[];
      const muh={LEDGER:[{id:'l1',iso:'2026-11-02',date:'2',desc:'A',acc:'Satış',doc:'Fatura',rate:10,total:110,dir:'gelir',br:'b1'},{id:'l4',iso:'2026-11-03',date:'3',desc:'B',acc:'Satış',doc:'Fatura',rate:10,total:40,dir:'gelir',br:'b1'}],INV:[],BRANCHES:[{id:'b1',name:'A'}]};
      const ekip={ROLES:{},SETTINGS:{shop:3},RECEIPTS:[],PROFILES:{},seq:1};
      let ver={muh:5,ekip:7};
      const fake={rpc:async(n,a)=>{window.__calls.push([n,a&&a.sc||'']);
        if(n==='br_rule')return{data:{b:['b1'],none:false}};
        if(n==='st_get')return{data:[{scope:'muh',state:JSON.stringify(muh),version:ver.muh},{scope:'ekip',state:JSON.stringify(ekip),version:ver.ekip}]};
        if(n==='st_versions')return{data:[{scope:'muh',version:ver.muh},{scope:'ekip',version:ver.ekip}]};
        if(n==='st_put'){window.__put=window.__put||[];window.__put.push([a.sc,JSON.parse(a.st),a.ver]);ver[a.sc]=a.ver+1;return{data:a.ver+1}}
        return{data:null}},
        from:()=>{window.__calls.push(['DIRECT_FROM']);const t={select:()=>t,eq:()=>t,limit:()=>t,in:()=>t,insert:async()=>({error:{message:'x'}}),update:()=>t,delete:()=>t,then:(f)=>f({data:[],error:null})};return t}};
      sbClient=()=>fake;
      const u=USERS.find(x=>x.role==='muhasebeci');loginAs(u);
      ID.active={role:'muhasebeci',app_uid:u.id,business_id:'bz'};SBS.biz={id:'bz'};SBS.user={id:'uu'};
      CL.on=false;
      await cloudAttach();
      out.ledger=LEDGER.map(x=>x.id);out.rule=CL.rule;out.known=CL.ruleKnown;out.brRule=!!brRule();
      LEDGER.push({id:'l5',iso:'2026-11-04',date:'4',desc:'C',acc:'Satış',doc:'Fatura',rate:10,total:55,dir:'gelir',br:'b1'});
      await cloudSet({s:pSnap()});
      out.put=(window.__put||[]).map(x=>[x[0],(x[1].LEDGER||[]).map(y=>y.id),x[2]]);
      await cloudPoll();
      out.calls=window.__calls.map(x=>x[0]).join(',');
      return out}""")
    print(r)
    ok = (r['ledger'] == ['l1', 'l4'] and r['rule'] and r['brRule'] and 'DIRECT_FROM' not in r['calls']
          and r['put'] == [['muh', ['l1', 'l4', 'l5'], 5]] and not er)
    print('OK' if ok else 'FAIL', er)
    sys.exit(0 if ok else 1)
