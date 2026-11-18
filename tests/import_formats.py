"""Farkli bicimli dosyalar: ingilizce ekstre, debit/credit, tek tutar+bakiye, ; csv, windows-1254, .xls."""
import os, subprocess, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
URL = 'file://' + ROOT + '/index.html'
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
# .xls uretimi (SheetJS node ile degil, python xlwt yoksa atla)
xls = '/tmp/t_fmt.xls' if os.path.exists('/tmp/t_fmt.xls') else None
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(600); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'};}")
    def build(rows, dec="{rate:'20',incl:'yes'}"):
        return ev("""(rows)=>{rows.forEach((r,i)=>r.__n=i+1);ixLoadSheets([{name:'Sayfa1',rows}],'x');MXI.dec=%s;const sh=ixCur();const R=ixBuild(MXI.type,MXI.map,sh._p);return {t:MXI.type,m:MXI.map,out:R.out.map(o=>[o.iso,o.dir,o.total,o.desc]),skip:R.skip.length,pend:R.pend,warn:R.warn.length,need:R.need}}""" % dec, rows)
    # 1 ingilizce ekstre, onsoz satirlari, debit/credit, altta toplam
    r = build([['ACME BANK'], ['Account: 123'], [''], ['Date', 'Description', 'Debit', 'Credit', 'Balance'], ['03/11/2026', 'Coffee', 12.5, '', 987.5], ['04/11/2026', 'Salary', '', 500, 1487.5], ['Total', '', 12.5, 500, '']], "{rate:'20',incl:'yes',dfmt:'dmy'}")
    check('Ingilizce ekstre: baslik+yon', [x[1] for x in r['out']] == ['gider', 'gelir'] and r['out'][0][2] == 12.5, r)
    check('Toplam satiri atlandi', len(r['out']) == 2, r)
    # 2 tek tutar + bakiye, yon yok
    r = build([['Tarih', 'Açıklama', 'Tutar', 'Bakiye'], ['01.11.2026', 'Açılış', '', 1000], ['02.11.2026', 'Market', 200, 800], ['03.11.2026', 'Tahsilat', 500, 1300], ['04.11.2026', 'Yakıt', 100, 1200]])
    check('Bakiyeden yon cikarildi', [x[1] for x in r['out']] == ['gider', 'gelir', 'gider'] and r['pend']['dir'] == 0, r)
    # 3 yeni->eski sirali
    r = build([['Tarih', 'Açıklama', 'Tutar', 'Bakiye'], ['04.11.2026', 'Yakıt', 100, 1200], ['03.11.2026', 'Tahsilat', 500, 1300], ['02.11.2026', 'Market', 200, 800], ['01.11.2026', 'Açılış', '', 1000]])
    check('Ters sirali ekstrede yon', [x[1] for x in r['out']] == ['gider', 'gelir', 'gider'], r)
    # 4 CSV: ; ayrac, virgullu ondalik, windows-1254
    txt = 'Tarih;Açıklama;Gelir;Gider\n01.11.2026;"Satış; peşin";1.234,50;\n02.11.2026;Kira;;400,00\n'
    rows = ev("(t)=>mxCsv(t)", txt)
    check('CSV ; ayraci, tirnakli ayrac', len(rows) == 3 and rows[1][1] == 'Satış; peşin' and len(rows[1]) == 4, rows)
    r = build(rows)
    check('CSV virgullu ondalik', [x[2] for x in r['out']] == [1234.5, 400], r)
    ok = ev("(a)=>ixDecode(new Uint8Array(a).buffer)", list('Açıklama;Şube;Gün'.encode('cp1254')))
    check('Windows-1254 cozuldu', ok == 'Açıklama;Şube;Gün', ok)
    ok = ev("(a)=>ixDecode(new Uint8Array(a).buffer)", list(b'\xef\xbb\xbf' + 'Tarih,İşlem'.encode('utf-8')))
    check('UTF-8 BOM atildi', ok == 'Tarih,İşlem', ok)
    # 5 | ayrac ve tab
    rows = ev("(t)=>mxCsv(t)", 'Date|Details|Amount\n1/11/2026|X|5.5\n')
    check('| ayraci', len(rows[0]) == 3, rows)
    # 6 iki tutar sutunu ters siralanmis kolon (Alacak/Borc)
    r = build([['Tarih', 'Açıklama', 'Borç', 'Alacak'], ['01.11.2026', 'A', 50, ''], ['02.11.2026', 'B', '', 70]])
    check('Borc=gider Alacak=gelir', [x[1] for x in r['out']] == ['gider', 'gelir'], r)
    # 7 bakiye uyusmuyor uyarisi
    r = build([['Tarih', 'Açıklama', 'Gelir', 'Gider', 'Bakiye'], ['01.11.2026', 'A', 100, '', 100], ['02.11.2026', 'B', '', 30, 90]])
    check('Bakiye uyusmazligi uyari', r['warn'] >= 1, r)
    # 8 xls
    if xls:
        buf = list(open(xls, 'rb').read())
        sh = ev("async(a)=>{const s=await ixReadXls(new Uint8Array(a).buffer);return s.map(x=>[x.name,x.rows.length,x.rows[1]])}", buf)
        check('.xls okundu', sh and sh[0][1] == 3 and sh[0][2][2] == 100, sh)
    else:
        print('ATLA .xls (xlwt yok)')
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
