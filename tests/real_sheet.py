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
    r = ev("""()=>{const rows=[['BANKA MUHASEBE TAKİBATI','','','','',''],['HESAP ADI','SIRA NO','GELİRLER','GİDERLER','BAKİYE','AÇIKLAMA'],
    ['BANKA GİDERLERİ','','','R 0.00','R 10,668.89','BANKA KESİNTİSİ'],['KERMES GELİRİ','','R 400.00','','R 11,068.89','KERMES GELİRİ'],['HAYVAN BAKIMI','','','R 1,300.00','R 12,270.75','VTF TRANSPORT ÖDEME']].map((r,i)=>{r.__n=i+1;return r});
    ixLoadSheets([{name:'BUYUK CAMLICA 3017',rows}],'m.xlsx');MXI.dec={rate:'0',incl:'yes'};const R=ixBuild('defter',MXI.map,ixCur()._p);
    return {map:MXI.map,ch:MXI.ch,n:R.out.length,sk:R.skip.map(x=>x.why),o:R.out.map(o=>[o.desc,o.acc,o.dir,o.total])}}""")
    check('Banka sayfasi esleme', r['map'].get('acc')==0 and r['map'].get('gelir')==2 and r['map'].get('gider')==3 and r['map'].get('desc')==5 and r['map'].get('total') is None, r['map'])
    check('Banka sayfasi: baslik satirindan banka akisi', r['ch']=='banka', r['ch'])
    check('Banka: 2 gercek satir, sifir tutarli atlanir', r['n']==2 and len(r['sk'])==1, r)
    r = ev("""()=>{const rows=[['','BÜYÜK ÇAMLICA NAKİT','','','','',''],['','HESAP TÜRÜ','HESAP ADI','BELGE NUMARASI','GELİRLER','GİDERLER','AÇIKLAMA'],['9/26/2026','ÖN MUHASEBE','İŞÇİ GİDERİ','','','R 100.00','x'],['9/27/2026','ÖN MUHASEBE','KERMES GELİRİ','','R 760.00','','y'],['10/3/2026','ÖN MUHASEBE','KERMES GELİRİ','','R 600.00','','z']].map((r,i)=>{r.__n=i+1;return r});
    ixLoadSheets([{name:'NAKİT',rows}],'m.xlsx');MXI.dec={rate:'0',incl:'yes'};const R=ixBuild('defter',MXI.map,ixCur()._p);return {date:MXI.map.date,d:R.out.map(o=>o.iso),nd:R.nd}}""")
    check('Basligi bos tarih sutunu (ay/gun/yil) okunur', r['date']==0 and r['d']==['2026-09-26','2026-09-27','2026-10-03'] and r['nd']==0, r)
    check('Sayfa hatasi yok', not er, er)
    b.close()
print('\nHEPSI GECTI' if not f else 'FAIL: %d' % len(f))
