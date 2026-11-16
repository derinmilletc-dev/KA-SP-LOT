"""Plan bandi ve salt okunur mod (istemci)."""
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
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render()}")
    bar = lambda: pg.evaluate("()=>{const e=document.getElementById('plan-bar');return e?e.textContent:null}")
    check('Plan yokken bant yok', bar() is None)
    pg.evaluate("()=>{PLAN.st={plan:'deneme',plan_name:'Deneme',status:'trial',effective:'ok',days_left:3};PLAN.ro=false;render()}")
    check('Deneme 3 gun kala uyari', '3 gün' in (bar() or ''), bar())
    pg.evaluate("()=>{PLAN.st={plan:'deneme',status:'trial',effective:'ok',days_left:20};render()}")
    check('20 gun kala bant yok', bar() is None, bar())
    pg.evaluate("()=>{PLAN.st={plan:'pro',plan_name:'Pro',status:'past_due',effective:'grace',days_left:-1};render()}")
    check('Ek sure uyarisi', 'ek süre' in (bar() or '').lower(), bar())
    pg.evaluate("()=>{PLAN.st={plan:'pro',status:'active',effective:'readonly',days_left:-20};PLAN.ro=true;render()}")
    check('Salt okunur bandi', 'sona erdi' in (bar() or ''), bar())
    check('Salt okunurken locked() true', pg.evaluate("()=>locked()") is True)
    n = pg.evaluate("()=>{const n=LEDGER.length;H.ladd();return LEDGER.length-n}")
    check('Salt okunurken satir eklenemez', n == 0, n)
    pg.evaluate("()=>{PLAN.ro=false;PLAN.st=null;render()}")
    check('Plan kalkinca bant ve kilit kalkar', bar() is None and pg.evaluate("()=>locked()") is False)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('FAILED' if fails else 'ALL OK'); sys.exit(1 if fails else 0)
