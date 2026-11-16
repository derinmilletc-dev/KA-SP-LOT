"""Betikler yavas yuklenirken bile giris ekrani guncel (Google dugmesi, bolunmus duzen) gorunmeli."""
import os, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)
import http.server, threading, functools
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/js/app-'): time.sleep(0.15)
        return super().do_GET()
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=ROOT)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1440, 'height': 860}); er = []
    pg.on('pageerror', lambda e: er.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(4500)
    r = pg.evaluate("()=>({lx3:!!document.querySelector('.login.lx3'),g:!!document.querySelector('[data-a=sggoogle]')})")
    check('Yavas yuklemede giris ekrani guncel (bolunmus duzen + Google)', r['lx3'] and r['g'], r)
    check('Sayfa hatasi yok', not er, er[:3])
    b.close()
srv.shutdown()
print('\nHATA: ' + str(len(fails)) if fails else '\nALL OK'); sys.exit(1 if fails else 0)
