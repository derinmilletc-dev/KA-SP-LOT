from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); er=[]; pg.on('pageerror',lambda e:er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto('file:///home/claude/ka-sp-lot/index.html'); pg.wait_for_timeout(500)
    r=pg.evaluate("""()=>{
      const n=()=>liveUsers().map(u=>u.role).join(',');
      const demo=n(); S.demoMode=false; SBS.biz={id:'b'}; ID.active={role:'patron'};
      ID.team={members:[],invites:[{app_uid:'u2'}],err:''}; const none=n();
      ID.team={members:[{app_uid:'u3'}],invites:[],err:''}; const acc=n();
      return {demo,none,acc}}""")
    print(r)
    assert 'mudur' in r['demo'] and 'mudur' not in r['none'] and 'muhasebeci' not in r['none']
    assert 'muhasebeci' in r['acc'] and 'mudur' not in r['acc'] and 'patron' in r['acc']
    assert not er,er; print('ALL OK')
