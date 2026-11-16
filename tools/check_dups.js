// js/app-*.js dosyalarını sırayla birleştirip ayrıştırır; aynı adlı fonksiyon bildirimi (ölü kod / sıra hatası) arar.
// Çalıştır: npm i acorn (CI içinde) ve node tools/check_dups.js ; "dups 0" beklenir.
const fs = require('fs'), path = require('path');
let acorn; try { acorn = require('acorn'); } catch (e) { acorn = require('/tmp/ac/node_modules/acorn'); }
const dir = path.join(__dirname, '..', 'js');
const code = fs.readdirSync(dir).filter((f) => /^app-\d+\.js$/.test(f)).sort().map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
const ast = acorn.parse(code, { ecmaVersion: 'latest', allowReturnOutsideFunction: true });
const by = {}; ast.body.forEach((n) => { if (n.type === 'FunctionDeclaration') (by[n.id.name] = by[n.id.name] || []).push(n); });
const dups = Object.entries(by).filter(([k, v]) => v.length > 1); let bytes = 0; dups.forEach(([k, v]) => v.slice(0, -1).forEach((n) => { bytes += n.end - n.start; }));
console.log('script bytes', code.length, 'dups', dups.length, 'dead bytes', bytes); console.log(dups.slice(0, 12).map(([k, v]) => k + ':' + v.length).join(' '));
process.exit(dups.length ? 1 : 0);
