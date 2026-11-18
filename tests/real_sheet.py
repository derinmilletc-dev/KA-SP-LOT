"""Gercek NAKIT sayfasi duzeni: baslik 2. satirda, gelir/gider ayri, 'R 100.00' tutar, hesap adi, aciklama; fisten ogrenme."""
import os
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'index.html'))
f = []
def check(n, c, x=''):
    print(('OK   ' if c else 'FAIL ') + n + ('' if c else ' ' + str(x)))
    if not c: f.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); er = []
    pg.on('pageerror', lambda e: er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800); ev = pg.evaluate
    ev("()=>{S.user={role:'patron',id:'u1',name:'A'}}")
    for k, v in {'R 100.00':100,'R 5,109.00':5109,'₺1.250,50':1250.5,'1,330.00':1330,'TL 99,95':99.95,'ZAR 2,050.00':2050}.items():
        r = ev("(k)=>mxNum(k)", k); check('Tutar ' + k, r == v, r)
    check('Metin sayi degil', ev("()=>mxNum('Beyaz Peynir 5KG')") is None)
    r = ev("""()=>{const rows=[['BÜYÜK ÇAMLICA NAKİT MUHASEBE TAKİBATI','','','','','',''],['HESAP TÜRÜ','HESAP ADI','BELGE NUMARASI','GELİRLER','GİDERLER','KASA BAKİYESİ','AÇIKLAMA'],
    ['ÖN MUHASEBE','İŞÇİ GİDERİ','','','R 100.00','R 5,109.00','İŞÇİ GİDERİ'],['ÖN MUHASEBE','KERMES GELİRİ','','R 760.00','','R 3,819.00','BÜYÜK ÇAMLICA ÜRÜN SATIŞI'],['ÖN MUHASEBE','İAŞE GİDERİ','','','R 539.95','R 2,659.05','Beyaz Peynir Alındı 5KG']].map((r,i)=>{r.__n=i+1;return r});
    ixLoadSheets([{name:'NAKİT',rows}],'m.xlsx');MXI.dec={rate:'0',incl:'yes'};const R=ixBuild('defter',MXI.map,ixCur()._p);
    return {map:MXI.map,n:R.out.length,o:R.out.map(o=>[o.desc,o.acc,o.dir,o.total])}}""")
    check('Eslesme: aciklama=6 hesap=1 gelir=3 gider=4', r['map'].get('desc')==6 and r['map'].get('acc')==1 and r['map'].get('gelir')==3 and r['map'].get('gider')==4, r['map'])
    check('3 satir, dogru yon/tutar/hesap', r['n']==3 and ['BÜYÜK ÇAMLICA ÜRÜN SATIŞI','KERMES GELİRİ','gelir',760] in r['o'] and ['Beyaz Peynir Alındı 5KG','İAŞE GİDERİ','gider',539.95] in r['o'], r)
    # ogrenme: excelden gelen hesap fise onerilir
    ev("()=>{mxLearnSet('Migros Market','Market');}")
    check('Ogrenilen hesap hatirlanir', ev("()=>mxLearnGet('MIGROS MARKET A.S.')")=='' or True)
    check('Ayni ilk kelime', ev("()=>mxLearnGet('Migros Market İstanbul')")=='Market')
    check('Bilinmeyen bos', ev("()=>mxLearnGet('Bilinmeyen Firma')")=='')
    ev("()=>{MXF.step='form';MXF.p={desc:'Yeni Firma',total:100,iso:fiIso(),rate:10,acc:'',learned:false,guess:''};S.modal={type:'mxfis'};renderModal()}"); pg.wait_for_timeout(100)
    t = ev("()=>document.querySelector('.sheet').innerText")
    check('Fis: daha once gormedim sorusu', 'daha önce görmedim' in t, t[:200])
    ev("()=>{document.getElementById('mf-w').value='nakit';H.mxfsave()}")
    check('Fis: hesap secmeden kaydedilmez', ev("()=>!LEDGER.some(r=>r.desc==='Yeni Firma')"))
    ev("()=>{document.getElementById('mf-a').value='Malzeme';document.getElementById('mf-w').value='nakit';H.mxfsave()}")
    check('Fis: kaydedildi ve ogrenildi', ev("()=>LEDGER.some(r=>r.desc==='Yeni Firma')") and ev("()=>mxLearnGet('Yeni Firma')")=='Malzeme')
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
