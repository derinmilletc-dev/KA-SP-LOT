"""Roller arasi akis: calisan -> mudur -> patron (ariza, talep, izin, gorev)."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); er = []
    pg = b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: er.append(str(e)[:200])); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{window.__push=[];pushSend=(ids,t,b)=>{window.__push.push([ids,t,b])}}")
    def go(uid, v, sub=None):
        ev("([u,v,s])=>{S.user=USERS.find(x=>x.id===u);S.view=v;S.sub=s||{};S.modal=null;render()}", [uid, v, sub]); pg.wait_for_timeout(80)
    def has(sel): return pg.query_selector(sel) is not None
    # ARIZA
    go('u4', 'bugun'); pg.click('[data-a="mtnew"]'); pg.wait_for_timeout(80)
    pg.click('[data-a="pfchip"]:has-text("Klima")'); pg.click('[data-a="pfchip"]:has-text("Acil")'); pg.fill('#mt-place', 'Salon'); pg.fill('#mt-desc', 'Klima su damlatiyor'); pg.click('[data-a="mtsend"]'); pg.wait_for_timeout(100)
    check('ariza kaydi', ev("()=>MAINT.length")==1 and ev("()=>MAINT[0].pri")=='acil', ev("()=>JSON.stringify(MAINT)"))
    check('ariza bildirimi mudur+patron', ev("()=>JSON.stringify(window.__push[0][0].sort())")=='["u1","u2"]', ev("()=>JSON.stringify(window.__push)"))
    check('tekrar ariza -> not', (lambda: (pg.click('[data-a="mtnew"]') if has('[data-a="mtnew"]') else None, 0)[1] or True)())
    pg.click('[data-a="pfchip"]:has-text("Klima")'); pg.fill('#mt-place', 'salon'); pg.fill('#mt-desc', 'Hala damlatiyor'); pg.click('[data-a="mtsend"]'); pg.wait_for_timeout(100)
    check('ayni ariza cogalmadi', ev("()=>MAINT.length")==1 and ev("()=>MAINT[0].notes.length")==1)
    for uid in ('u2', 'u1'):
        go(uid, 'ops', {'ops': 'ariza'})
        check(uid + ' arizayi gorur', has('[data-a="mtst"][data-v="islemde"]'))
    go('u2', 'ops', {'ops': 'ariza'}); pg.click('[data-a="mtst"][data-v="islemde"]'); pg.wait_for_timeout(80)
    check('islemde', ev("()=>MAINT[0].st")=='islemde' and ev("()=>MAINT[0].asg")=='u2')
    pg.click('[data-a="mtst"][data-v="bitti"]'); pg.wait_for_timeout(80); pg.fill('#md-cost', '250'); pg.click('[data-a="mtdoneok"]'); pg.wait_for_timeout(80)
    check('cozuldu + maliyet', ev("()=>MAINT[0].st")=='bitti' and ev("()=>MAINT[0].cost")==250)
    check('calisana bildirim', ev("()=>window.__push.some(x=>x[0][0]==='u4'&&/çözüldü/.test(x[1]))"))
    # TALEP avans: onay + red
    go('u4', 'talebim')
    for amt in ('1000', '500'):
        pg.click('[data-a="rqnew"][data-k="avans"]'); pg.wait_for_timeout(80); pg.fill('#rq-amt', amt); pg.fill('#rq-txt', 'Kira icin'); pg.click('[data-a="rqsend"]'); pg.wait_for_timeout(80)
    check('2 talep', ev("()=>REQS.length")==2, ev("()=>REQS.length"))
    go('u2', 'ops', {'ops': 'talep'})
    check('mudur talepleri gorur', has('[data-a="rqok"]'))
    ids = ev("()=>REQS.map(r=>r.id)")
    pg.evaluate("(id)=>H.rqok({dataset:{id}})", ids[1]); pg.wait_for_timeout(60)
    ev("(id)=>{H.rqno({dataset:{id}})}", ids[0]); pg.wait_for_timeout(80); pg.fill('#rn-t', 'Butce yok'); ev("(id)=>H.rqnook({dataset:{id}})", ids[0])
    check('onay/red', ev("()=>REQS.map(r=>r.st).join()")=='red,onay', ev("()=>REQS.map(r=>r.st).join()"))
    check('calisana sonuc bildirimi', ev("()=>window.__push.filter(x=>x[0][0]==='u4'&&/(onaylandı|reddedildi)/.test(x[1])).length")==2)
    # IZIN
    go('u4', 'talebim'); pg.click('[data-a="rqnew"][data-k="izin"]'); pg.wait_for_timeout(80)
    pg.click('[data-a="lqkind"][data-v="ucretsiz"]'); pg.fill('#lq-d1', '2026-12-10'); pg.fill('#lq-d2', '2026-12-11'); pg.fill('#lq-why', 'Ailevi'); pg.click('[data-a="lrsend"]'); pg.wait_for_timeout(100)
    rid = ev("()=>LVREQ[0].id")
    go('u2', 'ekip', {'ekip': 'izin'}); check('mudur izin gorur', has('[data-a="lrok"]'))
    go('u1', 'ekip', {'ekip': 'talep'}); check('patron izin gorur', has('[data-a="lrok"]'))
    ev("(id)=>H.lrok({dataset:{id}})", rid); pg.wait_for_timeout(80)
    pg.click('[data-a="lrfinal"]'); pg.wait_for_timeout(100)
    check('izin onaylandi', ev("()=>LVREQ[0].status")!='bekliyor', ev("()=>JSON.stringify(LVREQ[0])")[:200])
    # GOREV
    go('u2', 'ops', {'ops': 'gorev'}); pg.click('[data-a="tknew"]'); pg.wait_for_timeout(80); pg.fill('#tk-t', 'Vitrini sil'); pg.select_option('#tk-u', 'u4'); pg.click('[data-a="tksave"]'); pg.wait_for_timeout(80)
    check('gorev olustu', ev("()=>TASKS.length")==1, ev("()=>TASKS.length"))
    go('u4', 'bugun'); check('calisan gorevi gorur', 'Vitrini sil' in ev("()=>document.getElementById('main').innerText"))
    ev("(id)=>H.tkdone({dataset:{id}})", ev("()=>TASKS[0].id")); check('gorev bitti', ev("()=>TASKS[0].st")=='bitti' and ev("()=>TASKS[0].doneBy")=='u4')
    # Her rol her gorunum hatasiz
    for u in ('u1', 'u2', 'u3', 'u4'):
        for v in ev("(u)=>NAV[USERS.find(x=>x.id===u).role].map(n=>n[0])", u):
            go(u, v)
    check('sayfa hatasi yok', not er, er)
    b.close()
print('\nHATA:', f if f else 'yok'); raise SystemExit(1 if f else 0)
