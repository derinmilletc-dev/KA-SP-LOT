"""kais-cron tek dosya: panelde yalnızca index.ts yapıştırılabildiği için logic.ts index.ts'in içine birleştirilir.
Çıktı: supabase/functions/kais-cron/index.single.ts (Supabase panelinde bu dosyanın içeriği yapıştırılır)."""
import re, os
d = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'functions', 'kais-cron')
idx = open(os.path.join(d, 'index.ts'), encoding='utf-8').read().split('\n')
logic = open(os.path.join(d, 'logic.ts'), encoding='utf-8').read()
head, body, ext_imports = [], [], []
seen_import = False
for ln in idx:
    if re.match(r"^import .* from '\./logic\.ts';?\s*$", ln): seen_import = True; continue
    if ln.startswith('import '): ext_imports.append(ln); seen_import = True; continue
    (body if seen_import else head).append(ln)
logic = re.sub(r'^export ', '', logic, flags=re.M)
out = '\n'.join(head + ext_imports + ['', '/* ---- logic.ts (birleştirildi) ---- */', logic, '/* ---- index.ts ---- */'] + body)
open(os.path.join(d, 'index.single.ts'), 'w', encoding='utf-8').write(out)
print('index.single.ts', len(out.split('\n')), 'satir', 'logic.ts basvurusu kaldi' if "./logic" in out else 'tek dosya')
