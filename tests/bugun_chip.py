from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); er=[]; pg.on('pageerror',lambda e:er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto('file:///home/claude/ka-sp-lot/index.html'); pg.wait_for_timeout(500)
    exp={'yok':(True,False),'davet':(False,True),'bagli':(False,False)}
    Ts={'yok':{'members':[],'invites':[],'err':''},'davet':{'members':[],'invites':[{'app_uid':'u3'}],'err':''},'bagli':{'members':[{'app_uid':'u3'}],'invites':[],'err':''}}
    for k,T in Ts.items():
        h=pg.evaluate("(T)=>{ID.team=T;return ppHome()}",T)
        got=('Muhasebeci davet et' in h,'daveti bekliyor' in h)
        print(k,got); assert got==exp[k],k
    assert not er,er
    print('ALL OK')
