"""Fis tarama uctan uca (gercek Tesseract, Turkce karakterli fis resmi): muhasebe 'Fisten kayit' ve calisan fis yukleme."""
import http.server, os, socketserver, sys, threading
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
IMG = os.path.join(ROOT, 'tests', 'fixtures', 'fis_tr.png')
from playwright.sync_api import sync_playwright
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(800)
    ev = lambda js, *a: pg.evaluate(js, *a) if a else pg.evaluate(js)
    def wait(js, n=60):
        for _ in range(n):
            pg.wait_for_timeout(1000)
            if ev(js): return True
        return False
    # --- muhasebe: Fisten kayit
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe';LEDGER.length=0;render();H.mxfis()}")
    pg.set_input_files('#mxf-file', IMG)
    ok = wait("()=>MXF.step==='form'||(MXF.step==='pick'&&MXF.err)")
    p_ = ev("()=>MXF.p"); check('Tarama: form acildi', ok and p_, ev("()=>MXF.err"))
    if p_:
        check('Tarama: toplam 54,40', p_['total'] == 54.4, p_)
        check('Tarama: tarih 12.11.2026', p_['iso'] == '2026-11-12', p_)
        check('Tarama: satici Turkce karakterli', 'Özdemir' in p_['desc'] and 'Market' in p_['desc'], p_)
        check('Tarama: KDV %10 (kalem satirlarindan)', p_['rate'] == 10, p_)
        ev("()=>{document.getElementById('mf-a').value=document.getElementById('mf-a').value||'Diğer';document.getElementById('mf-w').value='nakit';H.mxfsave()}")
        row = ev("()=>LEDGER[LEDGER.length-1]")
        check('Tarama: deftere gider olarak yazildi', row and row['dir'] == 'gider' and row['total'] == 54.4 and row['iso'] == '2026-11-12' and row['doc'] == 'Fiş' and row['rate'] == 10, row)
        K = ev("()=>{const K=mxKdv('2026-11');return [K.ind]}")
        check('Tarama: KDV hazirligina indirilecek olarak yansidi (4,94)', abs(K[0] - 4.94) < 0.01, K)
    # --- calisan: fis yukle
    ev("()=>{loginAs(USERS.find(u=>u.id==='u4'));S.modal=null;render();H.upload()}")
    pg.set_input_files('input[type=file][data-ch=file]', IMG)
    ok = wait("()=>S.modal&&S.modal.type==='upload'&&['result','ask'].includes(S.modal.step)")
    check('Calisan fis: okundu', ok, ev("()=>S.modal"))
    if ok:
        if ev("()=>S.modal.step") == 'ask': ev("()=>H.answer({dataset:{v:'Hammadde'}})")
        ev("()=>H.savereceipt()")
        f = ev("()=>RECEIPTS[RECEIPTS.length-1]")
        check('Calisan fis: patron onayina dustu, tutar 54,40', f['status'] == 'bekliyor' and f['total'] == 54.4 and f['by'] == 'u4', f)
    # --- okunamayan resim
    from PIL import Image
    Image.new('RGB', (600, 400), 'white').save('/tmp/bos.png')
    ev("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;render();H.mxfis()}"); pg.set_input_files('#mxf-file', '/tmp/bos.png')
    wait("()=>MXF.step==='pick'&&MXF.err", 40)
    check('Bos resim: anlasilir hata, kayit olusmaz', ev("()=>/okunamad/i.test(MXF.err)"), ev("()=>MXF.err"))
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('FAILED' if fails else 'ALL OK'); sys.exit(1 if fails else 0)
