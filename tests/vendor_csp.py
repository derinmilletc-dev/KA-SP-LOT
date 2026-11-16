"""Kendi sunucumuzdan yuklenen kutuphaneler (Supabase, ExcelJS, PDF, OCR) CSP altinda calisir mi?
Yerel http sunucusu CSP basligini vercel.json'daki gibi gonderir; internet gerekmez (dis istekler engellenir)."""
import base64, http.server, os, socketserver, sys, threading, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CSP = json.load(open(os.path.join(ROOT, 'vercel.json')))
CSP = [h['value'] for g in CSP['headers'] if g['source'] == '/(.*)' for h in g['headers'] if h['key'] == 'Content-Security-Policy'][0]

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Content-Security-Policy', CSP); super().end_headers()
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
IMG = os.path.join(os.path.dirname(__file__), 'fixtures', 'fis.png')

from playwright.sync_api import sync_playwright
fails = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: fails.append(n)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(accept_downloads=True); pg = ctx.new_page()
    errs = []; ext = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if 'Content Security Policy' in m.text else None)
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('http://127.0.0.1') else (ext.append(r.request.url) or r.abort()))
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(800)
    check('Supabase kutuphanesi yerelden yuklendi', pg.evaluate("()=>typeof window.supabase==='object'&&typeof window.supabase.createClient==='function'"))
    pg.evaluate("()=>{loginAs(USERS.find(x=>x.role==='patron'));S.modal=null;S.view='muhasebe';const ym=fiIso().slice(0,7);LEDGER.length=0;INV.length=0;LEDGER.push({id:'a',iso:ym+'-02',date:'2',desc:'S',acc:'Satış',doc:'Fatura',rate:10,total:1100,dir:'gelir'});INV.push({id:'i1',no:'F-1',iso:ym+'-01',cust:'ABC',tot:5000,due:fiIso(),st:'bekliyor',lines:[{d:'x',q:1,p:5000,r:10}]});render()}")
    with pg.expect_download(timeout=20000) as d: pg.evaluate("()=>H.mxpkdl()")
    check('ExcelJS ile paket indirildi', d.value.suggested_filename.endswith('.xlsx'))
    r = pg.evaluate("async()=>{try{const b=await fiPdf(INV[0]);return [b.size>1000,b.type]}catch(e){return 'ERR '+e}}")
    check('html2canvas + jsPDF ile PDF uretildi', isinstance(r, list) and r[0], r)
    b64 = base64.b64encode(open(IMG, 'rb').read()).decode()
    t = pg.evaluate("""async(b64)=>{try{const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const f=new File([u],'fis.png',{type:'image/png'});const r=await ocrFile(f);return r.text}catch(e){return 'ERR '+(e&&e.message||e)}}""", b64)
    check('Tesseract OCR yerel dosyalarla calisti', isinstance(t, str) and '125' in t and not t.startswith('ERR'), t)
    check('Disariya istek yok (fontlar haric)', not [u for u in ext if 'fonts.g' not in u], ext)
    check('CSP ihlali / sayfa hatasi yok', not errs, errs)
    b.close()
print('\nBASARISIZ' if fails else '\nHEPSI GECTI'); sys.exit(1 if fails else 0)
