#!/usr/bin/env python3
"""index.html icindeki js/app-NN.js etiketlerine icerik ozeti (?v=...) yazar.
Kullanim: python3 tools/stamp.py          -> gunceller
          python3 tools/stamp.py --check  -> ozet eskiyse hata verir (CI)
Ozet degisince tarayici ve servis calisani yeni dosyayi ceker; eski surum karisip kalmaz."""
import hashlib, os, re, sys
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
idx = os.path.join(root, 'index.html'); html = open(idx, encoding='utf-8').read(); bad = []
def fix(m):
    path = m.group(1); f = os.path.join(root, path)
    h = hashlib.sha1(open(f, 'rb').read()).hexdigest()[:10]
    if m.group(2) != h: bad.append(path)
    return '<script src="%s?v=%s"></script>' % (path, h)
new = re.sub(r'<script src="(js/app-\d+\.js)\?v=([0-9a-f]*)"></script>', fix, html)
tags = re.findall(r'<script src="js/app-\d+\.js\?v=', html)
files = sorted(f for f in os.listdir(os.path.join(root, 'js')) if re.fullmatch(r'app-\d+\.js', f))
if len(tags) != len(files): print('index.html etiketleri ile js/ dosyalari uyusmuyor:', len(tags), len(files)); sys.exit(1)
if '--check' in sys.argv:
    if bad: print('Ozeti eski dosyalar (python3 tools/stamp.py calistir):', ', '.join(bad)); sys.exit(1)
    print('Ozetler guncel,', len(tags), 'dosya'); sys.exit(0)
if new != html: open(idx, 'w', encoding='utf-8', newline='').write(new)
print('Guncellendi:' if bad else 'Zaten guncel:', ', '.join(bad) or len(tags))
