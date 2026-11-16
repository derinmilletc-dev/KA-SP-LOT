/* =====================================================================
   İzin talebi: çalışan ister, yönetici onaylar / karşı teklif sunar
   ===================================================================== */
let LVREQ = [
  { id: 'r1', uid: 'u5', type: 'ucretsiz', txt: '24–26 Kas', days: 3, status: 'bekliyor', thread: [{ by: 'u5', text: 'Ailevi bir işim var, köye gitmem gerekiyor.', time: '13 Kas 16:20' }] },
  { id: 'r2', uid: 'u4', type: 'yillik', txt: '20–24 Kas', days: 5, status: 'karsi', counter: { txt: '27 Kas–01 Ara', days: 5 }, thread: [
    { by: 'u4', text: 'Kardeşimin düğünü var, o hafta izin almak istiyorum.', time: '12 Kas 11:05' },
    { by: 'u2', text: 'O hafta stok sayımı ve yoğunluk var. 27 Kas–01 Ara arası olur mu?', time: '13 Kas 09:30' }] },
];
const lrEff = (r) => (r.counter && r.resp === 'kabul' ? r.counter : { txt: r.txt, days: r.days });
function lrPill(r, who) {
  if (r.status === 'bekliyor') return who === 'admin' ? '<span class="pill p-warn">Karar bekliyor</span>' : '<span class="pill p-warn">Yönetici inceliyor</span>';
  if (r.status === 'karsi') return who === 'admin' ? '<span class="pill p-info">Çalışanın cevabı bekleniyor</span>' : '<span class="pill p-bad">Karşı teklif, cevabın bekleniyor</span>';
  if (r.status === 'yanit') return who === 'admin' ? `<span class="pill p-warn">Çalışan ${r.resp === 'kabul' ? 'kabul etti' : 'kabul etmedi'}, onay bekliyor</span>` : '<span class="pill p-warn">Cevabın yöneticide</span>';
  if (r.status === 'onayli') return '<span class="pill p-ok">Onaylandı, kaydedildi</span>';
  return '<span class="pill p-mute">Reddedildi</span>';
}
function lrCard(r, who) {
  const u = byId(r.uid); const admin = who === 'admin';
  let act = '';
  if (admin && ['bekliyor', 'yanit'].includes(r.status)) act = `<button class="btn sm" data-a="lrok" data-id="${r.id}">Onayla</button><button class="btn sm sec" data-a="lrctr" data-id="${r.id}">Karşı teklif</button><button class="btn sm sec" data-a="lrrej" data-id="${r.id}">Reddet</button>`;
  if (!admin && r.status === 'karsi') act = `<button class="btn sm" data-a="lrresp" data-id="${r.id}" data-v="kabul">Kabul ediyorum</button><button class="btn sm sec" data-a="lrresp" data-id="${r.id}" data-v="red">Kabul etmiyorum</button>`;
  const fin = r.fin ? `<div class="small muted">${LV_KIND[r.fin.type]}${r.fin.type === 'ucretsiz' ? (r.fin.ded ? ', maaştan ' + fmt(r.fin.ded) + ' kesilecek (günlük ' + fmt(r.fin.perDay) + ')' : ', maaştan kesinti yok') : ', maaştan kesinti yok'}</div>` : '';
  return `<div class="msg"><div class="mh"><span class="pill ${LV_PILL[r.type]}">${r.type === 'ucretsiz' ? 'Ücretsiz izin ister' : 'Ücretli yıllık izin ister'}</span>${lrPill(r, who)}${!admin && r.unreadEmp ? '<span class="pill p-bad">Yeni</span>' : ''}</div>
  <b>${admin ? esc(u.name) + ' · ' : ''}${esc(r.txt)} · ${r.days} gün</b>
  ${r.counter ? `<div class="callout">${ic('clock')}<div><b>Karşı teklif:</b> ${esc(r.counter.txt)} (${r.counter.days} gün)</div></div>` : ''}
  ${thread(r.thread)}${fin}${act ? `<div class="row wrap">${act}</div>` : ''}</div>`;
}
function lrSection(uid, mine) {
  const list = LVREQ.filter((r) => r.uid === uid).slice().reverse();
  return `<div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>İzin talepleri</h3><p class="muted small" style="margin-top:2px">${mine ? 'Tarih ve nedeni yaz, yönetici karar verir. Karşı teklif gelirse cevap yazabilirsin.' : 'Çalışanın talepleri, yazışmalar ve kesintiler.'}</p></div>${mine ? `<button class="btn sm" data-a="lrnew">${ic('plus', 16)} İzin talebi</button>` : ''}</div>${list.length ? list.map((r) => lrCard(r, mine ? 'emp' : 'admin')).join('') : '<div class="empty">Henüz talep yok.</div>'}</div>`;
}
function talepHTML() {
  const wait = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status)).reverse();
  const ctr = LVREQ.filter((r) => r.status === 'karsi').reverse();
  const done = LVREQ.filter((r) => ['onayli', 'reddedildi'].includes(r.status)).slice(-5).reverse();
  const block = (t, sub, arr) => (arr.length ? `<div class="card flush"><div style="padding:16px 16px 6px"><h3>${t}</h3><p class="muted small" style="margin-top:2px">${sub}</p></div>${arr.map((r) => lrCard(r, 'admin')).join('')}</div>` : '');
  return `<div class="stack-lg"><div class="callout">${ic('info')}<div>Çalışan tarih ve nedenle talep gönderir. Onaylayabilir, reddedebilir ya da başka tarih önerebilirsin. Çalışan cevaplayınca sana geri düşer, sen onaylayınca izin kaydedilir. Ücretsiz izinde maaştan kesinti sen seçersin.</div></div>
  ${block('Karar bekleyenler', 'Yeni talepler ve çalışanın cevapladıkları', wait)}${block('Çalışanın cevabı bekleniyor', 'Karşı teklif gönderdiklerin', ctr)}${block('Son kararlar', 'Onaylanan ve reddedilenler', done)}
  ${!wait.length && !ctr.length && !done.length ? '<div class="card empty">Henüz izin talebi yok.</div>' : ''}</div>`;
}
const lappSum = (m) => { const r = LVREQ.find((x) => x.id === m.id); const d = lrEff(r).days; return m.kind === 'ucretsiz' ? (m.ded ? `${d} gün × ${fmt(m.perDay)} = maaştan ${fmt(Math.round(m.perDay * d))} kesilecek` : `${d} gün ücretsiz, maaştan kesinti yapılmayacak`) : `${d} gün ücretli, maaştan kesinti yapılmaz`; };

function lvctrModal(m) {
  const r = LVREQ.find((x) => x.id === m.id);
  return sheet('Karşı teklif', `<div class="callout">${ic('clock')}<div><b>${esc(byId(r.uid).name)}</b><p style="margin-top:2px">İstediği: ${esc(r.txt)} · ${r.days} gün</p></div></div>
  <div class="row"><div class="field grow"><label for="lc-txt">Önerdiğin tarihler</label><input id="lc-txt" type="text" placeholder="Örnek: 27 Kas–01 Ara"></div><div class="field grow"><label for="lc-days">Gün</label><input id="lc-days" type="number" min="1" step="1" value="${r.days}"></div></div>
  <div class="field"><label for="lc-note">Nedenini yaz</label><textarea id="lc-note" placeholder="Örnek: O hafta stok sayımı var."></textarea></div>
  <div class="err" id="lc-err" role="alert"></div><button class="btn block" data-a="lrctrok" data-id="${r.id}">${ic('send')} Çalışana gönder</button><p class="small muted">Çalışan kabul eder ya da açıklama yazıp reddeder, cevabı sana geri düşer.</p>`);
}
function lvappModal(m) {
  const r = LVREQ.find((x) => x.id === m.id); const u = byId(r.uid); const p = PROFILES[r.uid]; const e = lrEff(r);
  return sheet('İzni onayla', `<div class="callout">${ic('clock')}<div><b>${esc(u.name)}</b><p style="margin-top:2px">${esc(e.txt)} · ${e.days} gün${r.counter && r.resp === 'kabul' ? ' · çalışan karşı teklifi kabul etti' : ''}</p></div></div>
  <div class="field"><label for="la-type">İzin türü</label><select id="la-type" data-ch="lapp" data-f="type"><option value="yillik" ${m.kind === 'yillik' ? 'selected' : ''}>Ücretli yıllık izin</option><option value="mazeret" ${m.kind === 'mazeret' ? 'selected' : ''}>Ücretli mazeret izni</option><option value="ucretsiz" ${m.kind === 'ucretsiz' ? 'selected' : ''}>Ücretsiz izin</option></select></div>
  ${m.kind === 'ucretsiz' ? `<div class="field"><label for="la-ded">Maaştan kesinti</label><select id="la-ded" data-ch="lapp" data-f="ded"><option value="1" ${m.ded ? 'selected' : ''}>Kes</option><option value="0" ${m.ded ? '' : 'selected'}>Kesme</option></select></div>
  ${m.ded ? `<div class="field"><label for="la-pd">Günlük kesinti (₺)</label><input id="la-pd" type="number" min="0" step="10" inputmode="decimal" value="${esc(m.perDay)}" data-ch="lapp" data-f="perDay"><p class="small muted">Varsayılan: maaşın 30'a bölümü, ${fmt(p.salary / 30)}. İstediğin tutarı yazabilirsin.</p></div>` : ''}` : ''}
  <div class="callout warn">${ic('wallet')}<div><span id="la-sumt">${esc(lappSum(m))}</span></div></div>
  <div class="field"><label for="la-note">Çalışana not (isteğe bağlı)</label><textarea id="la-note"></textarea></div>
  <div class="err" id="la-err" role="alert"></div><button class="btn block" data-a="lrfinal">Onayla ve kaydet</button><p class="small muted">Kesinti tutarı ve hukuki sonuçlar için iş hukukçusu ya da muhasebeciyle teyit et.</p>`);
}
function lvrespModal(m) {
  const r = LVREQ.find((x) => x.id === m.id);
  const yes = m.v === 'kabul';
  return sheet(yes ? 'Karşı teklifi kabul et' : 'Karşı teklifi reddet', `<div class="callout">${ic('clock')}<div><b>Karşı teklif:</b> ${esc(r.counter.txt)} (${r.counter.days} gün)<p style="margin-top:2px">İstediğin: ${esc(r.txt)}</p></div></div>
  <div class="field"><label for="lr-text">${yes ? 'Not (isteğe bağlı)' : 'Mazeretin ya da açıklaman'}</label><textarea id="lr-text" placeholder="${yes ? 'Örnek: Tamam, o tarihte olur.' : 'Örnek: Düğün o hafta, tarih değişmiyor.'}"></textarea></div>
  <div class="err" id="lr-err" role="alert"></div><button class="btn block" data-a="lrrespok" data-id="${r.id}" data-v="${m.v}">${yes ? 'Kabul ediyorum, gönder' : 'Reddet, gönder'}</button><p class="small muted">Cevabın yöneticiye gider. Yönetici onaylayınca izin kaydedilir.</p>`);
}
H.lrnew = () => { S.modal = { type: 'lvreq' }; renderModal(); };
H.lrsend = () => {
  const g = (id) => document.getElementById(id);
  const type = g('lq-type').value || 'yillik'; const days = Number(g('lq-days').value); const txt = (g('lq-txt').value || '').trim(); const why = (g('lq-why').value || '').trim();
  const er = (t) => { g('lq-err').textContent = t; };
  if (!txt) return er('Tarihleri yaz.');
  if (!(days >= 1)) return er('Gün sayısını yaz.');
  if (why.length < 5) return er('Nedenini yaz. Nedensiz talep gönderilemez.');
  if (type === 'yillik') {
    const ent = (leaveDays(monthsBetween(PROFILES[S.user.id].hire), S.user.id) + yizCarry(S.user.id));
    const used = LEAVES.filter((x) => x.uid === S.user.id && x.type === 'yillik').reduce((a, x) => a + x.days, 0);
    if (days > ent - used) return er(ent ? `Kalan yıllık iznin ${ent - used} gün. Daha fazlası için ücretsiz izin seç.` : 'Yıllık izin hakkın henüz doğmadı. Ücretsiz izin isteyebilirsin.');
  }
  LVREQ.push({ id: 'r' + ++seq, uid: S.user.id, type, txt, days, status: 'bekliyor', thread: [{ by: S.user.id, text: why, time: nowT() }] });
  S.modal = null; render(); toast('Talebin patrona ve müdüre gitti.', 'ok');
};
H.lrrej = (el) => { S.modal = { type: 'why', kind: 'lvrej', id: el.dataset.id }; renderModal(); };
H.lrctr = (el) => { S.modal = { type: 'lvctr', id: el.dataset.id }; renderModal(); };
H.lrctrok = (el) => {
  const g = (id) => document.getElementById(id);
  const txt = (g('lc-txt').value || '').trim(); const days = Number(g('lc-days').value); const note = (g('lc-note').value || '').trim();
  if (!txt) { g('lc-err').textContent = 'Önerdiğin tarihleri yaz.'; return; }
  if (!(days >= 1)) { g('lc-err').textContent = 'Gün sayısını yaz.'; return; }
  if (note.length < 5) { g('lc-err').textContent = 'Nedenini yaz.'; return; }
  const r = LVREQ.find((x) => x.id === el.dataset.id);
  r.counter = { txt, days }; r.status = 'karsi'; r.resp = null; r.unreadEmp = true;
  r.thread.push({ by: S.user.id, text: `${note} Öneri: ${txt} (${days} gün).`, time: nowT() });
  S.modal = null; render(); toast('Karşı teklif çalışana gitti.', 'ok');
};
H.lrresp = (el) => { S.modal = { type: 'lvresp', id: el.dataset.id, v: el.dataset.v }; renderModal(); };
H.lrrespok = (el) => {
  const t = ((document.getElementById('lr-text') || {}).value || '').trim();
  if (el.dataset.v === 'red' && t.length < 5) { document.getElementById('lr-err').textContent = 'Reddederken açıklama yazman gerekir.'; return; }
  const r = LVREQ.find((x) => x.id === el.dataset.id);
  r.resp = el.dataset.v; r.status = 'yanit';
  r.thread.push({ by: S.user.id, text: (el.dataset.v === 'kabul' ? 'Karşı teklifi kabul ediyorum. ' : 'Karşı teklifi kabul etmiyorum. ') + t, time: nowT() });
  S.modal = null; render(); toast('Cevabın yöneticiye gitti. Onaylayınca izin kaydedilir.', 'ok');
};
H.lrok = (el) => {
  const r = LVREQ.find((x) => x.id === el.dataset.id);
  S.modal = { type: 'lvapp', id: r.id, kind: r.type, ded: r.type === 'ucretsiz', perDay: Math.round(PROFILES[r.uid].salary / 30) };
  renderModal();
};
H.lrfinal = () => {
  const m = S.modal; const r = LVREQ.find((x) => x.id === m.id); const e = lrEff(r);
  if (m.kind === 'yillik') {
    const ent = (leaveDays(monthsBetween(PROFILES[r.uid].hire), r.uid) + yizCarry(r.uid));
    const used = LEAVES.filter((x) => x.uid === r.uid && x.type === 'yillik').reduce((a, x) => a + x.days, 0);
    if (e.days > ent - used) { document.getElementById('la-err').textContent = ent ? `Kalan yıllık izin ${ent - used} gün. Türü ücretsiz ya da mazeret izni yap.` : 'Yıllık izin hakkı henüz doğmadı. Türü değiştir.'; return; }
  }
  const ded = m.kind === 'ucretsiz' && m.ded ? Math.round(Number(m.perDay) * e.days) : 0;
  const note = ((document.getElementById('la-note') || {}).value || '').trim();
  LEAVES.push({ id: 'lv' + ++seq, uid: r.uid, type: m.kind, txt: e.txt, days: e.days, ded, perDay: ded ? Number(m.perDay) : 0, per: NEXTP });
  r.status = 'onayli'; r.unreadEmp = true; r.fin = { type: m.kind, ded, perDay: Number(m.perDay) };
  r.thread.push({ by: S.user.id, text: `Onaylandı: ${e.txt}, ${LV_KIND[m.kind]}. ${m.kind === 'ucretsiz' ? (ded ? `Maaştan ${fmt(ded)} kesilecek.` : 'Maaştan kesinti yapılmayacak.') : 'Maaştan kesinti yapılmaz.'}${note ? ' ' + note : ''}`, time: nowT() });
  S.modal = null; render(); toast('İzin onaylandı ve kaydedildi.', 'ok');
};

/* bugün ekranları: izin bildirimleri */
function bugunMudur() {
  const n = LVREQ.filter((r) => ['bekliyor', 'yanit'].includes(r.status));
  const top = n.length ? `<div class="stack">${todo('clock', 'warn', `${n.length} izin talebi karar bekliyor`, `${byId(n[0].uid).name}: ${n[0].txt}`, 'ekip', 'talep')}</div>` : '';
  return bugunMudurV2().replace('<div class="card flush">', top + '<div class="card flush">');
}
function bugunCalisan() {
  const mine = LVREQ.filter((r) => r.uid === S.user.id);
  const c = mine.filter((r) => r.status === 'karsi'); const d = mine.filter((r) => r.unreadEmp && r.status !== 'karsi');
  let top = '';
  if (c.length) top = `<div class="stack">${todo('clock', 'bad', 'İzin talebine karşı teklif geldi', `${c[0].txt} yerine ${c[0].counter.txt}. Kabul ya da reddet.`, 'maasim')}</div>`;
  else if (d.length) top = `<div class="stack">${todo('clock', 'info', 'İzin talebin cevaplandı', d[0].status === 'onayli' ? 'Onaylandı, ayrıntı Maaşım ekranında' : 'Gerekçeyi Maaşım ekranında oku', 'maasim')}</div>`;
  return bugunCalisanV2().replace('<div class="card">', top + '<div class="card">');
}

/* =====================================================================
   v4: muhasebeci merkezi: çalışanlar, maaşlar, sözleşmeler, gelir tablosu,
   borç ve alacak, Kais AI belge taslağı
   ===================================================================== */
const INCATS = ['Satış (POS)', 'Sipariş / toptan', 'Diğer gelir'];
const dirOf = (r) => r.dir || 'gider';
const gl = () => LEDGER.filter((r) => dirOf(r) === 'gider');
Object.assign(S.sub, { tablo: 'gider', calisanlar: 'liste' });
['b7', 'b10', 'b13'].forEach((id, i) => {
  const b = ROWS.find((r) => r.id === id);
  LEDGER.push({ id: 'gi' + (i + 1), dir: 'gelir', date: b.date, desc: 'POS tahsilat', acc: INCATS[0], doc: 'POS raporu', rate: 10, total: b.amt, src: 'Ekstre', bank: id });
});
LEDGER.push({ id: 'gi4', dir: 'gelir', date: '18 Eki', desc: 'Pasta siparişi (nakit)', acc: INCATS[1], doc: 'Fiş', rate: 10, total: 3200, src: 'Elle' });

/* ---------- gelir ve gider tablosu ---------- */
function ledgerTr(r, dis) {
  const cats = dirOf(r) === 'gelir' ? INCATS : CATS;
  const inp = (k, v, w, num) => `<input class="cell ${num ? 'r' : ''}" ${num ? 'type="number" step="0.01" inputmode="decimal"' : 'type="text"'} value="${esc(v)}" style="width:${w}px" data-ch="cell" data-id="${r.id}" data-k="${k}" aria-label="${esc(r.desc)} ${CELL_LAB[k]}" ${dis}>`;
  return `<tr class="${r.fresh ? 'fresh' : ''} ${mismatch(r) ? 'mis' : ''}" id="lr-${r.id}"><td>${inp('date', r.date, 70)}</td><td>${inp('desc', r.desc, 190)}</td>
  <td><select class="cell" data-ch="cell" data-id="${r.id}" data-k="acc" aria-label="${esc(r.desc)} hesap" ${dis}>${cats.map((c) => `<option ${c === r.acc ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></td>
  <td>${inp('doc', r.doc, 84)}</td>
  <td><select class="cell" data-ch="cell" data-id="${r.id}" data-k="rate" aria-label="${esc(r.desc)} KDV oranı" ${dis}>${[0, 1, 10, 20].map((x) => `<option value="${x}" ${x === Number(r.rate) ? 'selected' : ''}>%${x}</option>`).join('')}</select></td>
  <td class="num rt" id="lk-${r.id}">${fmt(kdv(r))}</td><td>${inp('total', r.total, 104, true)}</td><td id="ls-${r.id}">${srcCell(r)}</td>
  <td><button class="xbtn sm" data-a="ldel" data-id="${r.id}" aria-label="${esc(r.desc)} satırını sil" ${dis}>${ic('trash', 16)}</button></td></tr>`;
}
function tabloHTML(role) {
  const kind = S.sub.tablo === 'gelir' ? 'gelir' : 'gider';
  const dis = S.closed ? 'disabled' : '';
  const rows = LEDGER.filter((r) => dirOf(r) === kind && inPer(r));
  const sum = (k) => LEDGER.filter((r) => dirOf(r) === k && inPer(r)).reduce((a, r) => a + (Number(r.total) || 0), 0);
  const sumT = rows.reduce((a, r) => a + (Number(r.total) || 0), 0);
  const sumK = rows.reduce((a, r) => a + kdv(r), 0);
  const nf = rows.filter((r) => r.fresh).length;
  const html = `<div class="stack-lg">
  ${seg('tablo', [['gider', 'Giderler'], ['gelir', 'Gelirler']], kind)}
  ${perChips()}${misBanner()}
  <div class="kpis">${kpi('Gelir', fmt0(sum('gelir')))}${kpi('Gider', fmt0(sum('gider')))}${kpi('Fark', fmt0(sum('gelir') - sum('gider')))}</div>
  <div class="row between wrap"><div><h2>${kind === 'gelir' ? 'Gelir tablosu' : 'Gider tablosu'}</h2><p class="muted small" style="margin-top:4px">${kind === 'gelir' ? 'Ekstredeki tahsilatlar ve siparişler buraya yazılır. Hücreye dokunup elle düzeltebilirsin.' : 'Muhasebeci bir fişi onaylayınca satır buraya kendiliğinden yazılır. Hücreye dokunup elle düzeltebilirsin.'}</p></div><div class="row wrap"><button class="btn sec sm" data-a="copycsv">CSV kopyala</button>${xlsxBtn()}<button class="btn sm" data-a="ladd" ${dis}>${ic('plus', 16)} Satır ekle</button></div></div>
  ${nf ? `<div class="callout">${ic('sparkle')}<div><b>${nf} yeni gider yazıldı</b><p style="margin-top:2px">Yeşil satırları Kais onaylanan fişlerden yazdı.</p></div></div>` : ''}
  ${S.closed ? `<div class="callout warn">${ic('lock')}<div>${PERIOD} dönemi kapalı, tablo düzenlenemez.</div></div>` : ''}
  <div class="xl"><table class="xt"><thead><tr><th>Tarih</th><th>Açıklama</th><th>Hesap</th><th>Belge</th><th>KDV %</th><th class="r">KDV</th><th class="r">Toplam</th><th>Kaynak</th><th><span class="sr">Sil</span></th></tr></thead>
  <tbody id="xt-body">${rows.map((r) => ledgerTr(r, dis)).join('')}</tbody>
  <tfoot><tr><td colspan="5">${rows.length} satır</td><td class="num rt" id="lf-kdv">${fmt(sumK)}</td><td class="num rt" id="lf-tot">${fmt(sumT)}</td><td colspan="2"></td></tr></tfoot></table></div>
  <p class="small muted">Yana kaydırarak tüm sütunları görürsün. Oran ya da toplam değişince KDV kendiliğinden hesaplanır. Elle değiştirilen satır "Düzenlendi" olarak işaretlenir.</p>${kind === 'gelir' ? '<p class="small muted">KDV oranını satış kalemine göre düzelt. Yeme-içme satışında oran farklı olabilir, muhasebeciyle teyit et.</p>' : ''}
  <details class="chk card" id="ck-audit" ${S.openChk.includes('audit') ? 'open' : ''}><summary class="check"><span class="dot tone-info">${ic('clock', 16)}</span><div class="grow"><b style="font-weight:600">Değişiklik geçmişi</b><div class="small muted">Kim neyi ne zaman değiştirdi, geri alabilirsin</div></div><span class="chev">${ic('chevron', 18)}</span></summary><div class="cbody" id="audit-list">${auditList()}</div></details></div>`;
  if (role === 'patron') { LEDGER.forEach((r) => { r.fresh = false; }); RECEIPTS.forEach((f) => { f.fresh = false; }); }
  return html;
}
function ledgerRefresh(r) {
  const set = (id, v, html) => { const el = document.getElementById(id); if (!el) return; if (html) el.innerHTML = v; else el.textContent = v; };
  const same = LEDGER.filter((x) => dirOf(x) === dirOf(r) && inPer(x));
  set('lk-' + r.id, fmt(kdv(r)));
  set('ls-' + r.id, srcCell(r), true);
  set('lf-kdv', fmt(same.reduce((a, x) => a + kdv(x), 0)));
  set('lf-tot', fmt(same.reduce((a, x) => a + (Number(x.total) || 0), 0)));
}
function csvText() {
  const n = (x) => Number(x).toFixed(2).replace('.', ',');
  const head = 'Tür;Tarih;Açıklama;Hesap;Belge;KDV %;KDV;Toplam;Kaynak';
  return [head].concat(LEDGER.map((r) => [dirOf(r) === 'gelir' ? 'Gelir' : 'Gider', rDateY(r), String(r.desc).replace(/;/g, ','), r.acc, r.doc, r.rate, n(kdv(r)), n(r.total), r.edited ? 'Düzenlendi' : r.src].join(';'))).join('\n');
}
function kdvCard() {
  const t = LEDGER.filter((r) => dirOf(r) === 'gelir' && lper(r) === PREVM);
  const hes = t.reduce((a, r) => a + kdv(r), 0);
  const ind = gp().reduce((a, r) => a + kdv(r), 0);
  return `<div class="card stack"><div><h3>${PREVM} KDV hazırlık özeti</h3><p class="muted small">Tahmini veri özeti, vergi tavsiyesi değildir. Beyanı muhasebeci hazırlar ve teyit eder.</p></div>
  <div class="kpis"><div class="kpi"><div class="l">Hesaplanan</div><div class="v num">${fmt0(hes)}</div></div><div class="kpi"><div class="l">İndirilecek</div><div class="v num">${fmt0(ind)}</div></div><div class="kpi"><div class="l">Fark</div><div class="v num">${fmt0(hes - ind)}</div></div></div>
  <p class="small muted">Hesaplanan KDV gelir tablosundaki ${t.length}, indirilecek KDV gider tablosundaki ${gp().length} satırdan hesaplandı. ${countStatus('eksik')} belgesiz işlem hesaba girmedi.</p></div>`;
}
H.ladd = () => {
  if (locked()) return;
  const g = S.sub.tablo === 'gelir';
  LEDGER.push({ id: 'g' + ++seq, dir: g ? 'gelir' : 'gider', date: '14 Kas', desc: g ? 'Yeni gelir' : 'Yeni gider', acc: g ? INCATS[0] : 'Diğer', doc: '—', rate: g ? 10 : 20, total: 0, src: 'Elle' });
  render(); toast('Satır eklendi. Hücrelere dokunup doldur.');
};

/* ---------- borç ve alacak ---------- */
let DEBTS = [
  { id: 'dm', auto: 'maas', who: 'Çalışan maaşları', note: 'Kasım maaşlarının kalanı', due: '2026-11-30', rem: 3, on: true },
  { id: 'dk', auto: 'kdv', who: 'Vergi dairesi', note: 'KDV ödemesi (tahmin, muhasebeci teyit eder)', due: '2026-11-28', rem: 3, on: true },
  { id: 'd4', who: 'Çekirdek Kahve Toptan', note: 'Kasım siparişi, vadeli', amt: 9800, due: '2026-11-18', rem: 3, on: true },
  { id: 'd1', who: 'Ünlü Mamuller Ltd', note: 'Hammadde faturası', amt: 12300, due: '2026-12-05', rem: 3, on: true },
  { id: 'd2', who: 'E. Taşçı', note: 'Aralık kirası', amt: 45000, due: '2026-12-05', rem: 5, on: true },
  { id: 'd3', who: 'Enerjisa', note: 'Elektrik faturası (tahmin)', amt: 3640, due: '2026-12-06', rem: 3, on: true },
];
const daysTo = (iso) => { const a = iso.split('-').map(Number); return Math.round((Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(REF.y, REF.m - 1, REF.d)) / 86400000); };
function allDebts() {
  const sal = EMP_IDS.reduce((a, id) => a + Math.max(0, dueOf(id).left), 0);
  const kd = LEDGER.filter((r) => dirOf(r) === 'gelir' && lper(r) === PREVM).reduce((a, r) => a + kdv(r), 0) - gp().reduce((a, r) => a + kdv(r), 0);
  return DEBTS.map((d) => (d.auto === 'maas' ? Object.assign({}, d, { amt: sal }) : d.auto === 'kdv' ? Object.assign({}, d, { amt: Math.max(0, Math.round(kd)) }) : d)).map(dbRem).filter((d) => d.amt > 0 || d.paid).sort((a, b) => (a.due < b.due ? -1 : 1));
}
const debtSoon = () => allDebts().filter((d) => !d.paid && d.on && daysTo(d.due) <= d.rem);
function dueTxt(d) { const n = daysTo(d.due); return n < 0 ? `<span class="pill p-bad">${-n} gün gecikmiş</span>` : n === 0 ? '<span class="pill p-bad">Bugün</span>' : `<span class="pill ${n <= d.rem ? 'p-warn' : 'p-mute'}">${n} gün kaldı</span>`; }
function borcAlacakHTML(role) {
  const ds = allDebts(); const open = ds.filter((d) => !d.paid); const paid = ds.filter((d) => d.paid);
  const totD = open.reduce((a, d) => a + d.amt, 0); const soon = debtSoon();
  const alac = RECV.filter((a) => !a.paid).reduce((a, x) => a + x.amt, 0);
  const row = (d) => `<div class="rrow"><div><b style="font-weight:600">${esc(d.who)}</b><div class="small muted">${esc(d.note)} · vade ${esc(isoTxt(d.due))}</div></div><div class="num" style="font-weight:600">${fmt(d.amt)}</div>
  <div class="rfoot">${d.paid ? '<span class="pill p-ok">Ödendi</span>' : `${dueTxt(d)}<button class="btn sm sec" data-a="debtrem" data-id="${d.id}" aria-pressed="${!!d.on}">${ic('clock', 16)} ${d.on ? 'Hatırlatma açık' : 'Hatırlatma kapalı'}</button>${d.on ? `<select data-ch="drem" data-id="${d.id}" aria-label="${esc(d.who)} hatırlatma günü" style="width:auto;min-height:36px">${[1, 3, 5, 7].map((x) => `<option value="${x}" ${x === d.rem ? 'selected' : ''}>${x} gün önce</option>`).join('')}</select>` : ''}<button class="btn sm" data-a="debtpaid" data-id="${d.id}">Ödendi</button>`}</div></div>`;
  const alacak = alacakHTML().replace('için e-postanı bağla', 'için patronun işletme e-postasını bağlaması gerekir');
  return `<div class="stack-lg">
  <div class="kpis">${kpi('Borç', fmt0(totD))}${kpi('Alacak', fmt0(alac))}${kpi('Fark', fmt0(alac - totD))}</div>
  ${soon.length ? `<div class="callout warn">${ic('clock')}<div><b>${soon.length} ödeme için hatırlatma zamanı</b>${soon.map((d) => `<p style="margin-top:2px">${esc(d.who)}: ${fmt0(d.amt)}, ${daysTo(d.due) <= 0 ? 'bugün ya da geçti' : daysTo(d.due) + ' gün sonra'}</p>`).join('')}</div></div>` : ''}
  <div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>Borçlar, ödenecekler</h3><p class="muted small" style="margin-top:2px">Vadesi yaklaşınca hatırlatma gelir. Maaş ve KDV satırları kendiliğinden hesaplanır.</p></div><button class="btn sm" data-a="debtadd">${ic('plus', 16)} Borç ekle</button></div>
  ${open.length ? open.map(row).join('') : '<div class="empty">Ödenecek borç yok.</div>'}${paid.length ? paid.map(row).join('') : ''}</div>
  <div class="stack"><div><h3>Alacaklar, tahsil edilecekler</h3><p class="muted small" style="margin-top:2px">Vadesi geçenlere e-posta hatırlatması gönderilir.</p></div>${alacak}</div></div>`;
}
function viewBorc() { return borcAlacakHTML('muh'); }
function ozetHTML() { return `<div class="stack-lg">${borcAlacakHTML('patron')}${ozetV2()}</div>`; }
function debtModal() {
  return sheet('Borç ekle', `<div class="field"><label for="db-who">Kime borç?</label><input id="db-who" type="text" placeholder="Örnek: Metro Toptan"></div>
  <div class="field"><label for="db-note">Açıklama</label><input id="db-note" type="text" placeholder="Örnek: Aralık siparişi"></div>
  <div class="row"><div class="field grow"><label for="db-amt">Tutar (₺)</label><input id="db-amt" type="number" min="0" step="50" inputmode="decimal"></div><div class="field grow"><label for="db-due">Vade</label><input id="db-due" type="date" value="2026-12-15"></div></div>
  <div class="field"><label for="db-rem">Hatırlat</label><select id="db-rem"><option value="1">1 gün önce</option><option value="3" selected>3 gün önce</option><option value="5">5 gün önce</option><option value="7">7 gün önce</option></select></div>
  <div class="err" id="db-err" role="alert"></div><button class="btn block" data-a="debtok">Kaydet</button>`);
}
H.debtadd = () => { S.modal = { type: 'debt' }; renderModal(); };
H.debtok = () => {
  const g = (id) => document.getElementById(id);
  const who = (g('db-who').value || '').trim(); const amt = Number(g('db-amt').value); const due = g('db-due').value || '';
  if (!who) { g('db-err').textContent = 'Kime borç olduğunu yaz.'; return; }
  if (!(amt > 0)) { g('db-err').textContent = 'Tutarı yaz.'; return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) { g('db-err').textContent = 'Vade tarihini seç.'; return; }
  DEBTS.push({ id: 'd' + ++seq, who, note: (g('db-note').value || '').trim() || 'Borç', amt, due, rem: Number(g('db-rem').value) || 3, on: true });
  S.modal = null; render(); toast('Borç eklendi, hatırlatma kuruldu.', 'ok');
};
H.debtrem = (el) => { const d = DEBTS.find((x) => x.id === el.dataset.id); d.on = !d.on; render(); toast(d.on ? 'Hatırlatma açıldı.' : 'Hatırlatma kapatıldı.'); };
H.debtpaid = (el) => { const d = DEBTS.find((x) => x.id === el.dataset.id); d.paid = true; render(); toast('Ödendi olarak işaretlendi.', 'ok'); };
const _rem = H.remind;
H.remind = (el) => { if (S.user.role !== 'patron' && !mailReady()) { toast('Hatırlatma e-postası, patron işletme e-postasını bağlayınca gider.', 'warn'); return; } _rem(el); };

/* ---------- belge metinleri ---------- */
function contractText(d) {
  const sal = d.salary ? fmt(d.salary) + (d.stype === 'brut' ? ' brüt' : ' net') : '________ TL';
  return ['İŞ SÖZLEŞMESİ (TASLAK)', '', `İŞVEREN: ${BIZ}`, `ÇALIŞAN: ${d.name || '________'}`, '',
    'Madde 1 - İşin konusu', `Çalışan ${d.pos ? d.pos.toLocaleLowerCase('tr-TR') : '________'} görevinde çalışacaktır. İşveren iş tanımını yazılı olarak güncelleyebilir.`, '',
    'Madde 2 - Süre ve deneme', `Sözleşme ${d.hire ? isoTxt(d.hire) : '__ ___ 2026'} tarihinde başlar, belirsiz süreli yapılmıştır. Deneme süresi ${d.trial} aydır (kanunda en çok 2 ay, toplu iş sözleşmesiyle 4 ay).`, '',
    'Madde 3 - Ücret', `Aylık ücret ${sal}'dır ve her ayın ${d.payday}. günü banka hesabına ödenir. Avans ve kesintiler yazılı kayıtla yapılır.`, '',
    'Madde 4 - Çalışma süresi ve fazla mesai', `Haftalık çalışma süresi ${d.hours} saattir. Haftalık 45 saati aşan çalışma saat ücretinin yüzde 50 fazlasıyla ödenir. Yıllık fazla çalışma 270 saati aşamaz ve yazılı onaya bağlıdır.`, '',
    'Madde 5 - İzinler', 'Çalışan kıdemine göre yıllık ücretli izin hakkına sahiptir (1-5 yıl: 14 gün, 5-15 yıl: 20 gün, 15 yıl ve üzeri: 26 gün). İzin talepleri yazılı yapılır ve işverence onaylanır. Haftada en az 24 saat kesintisiz dinlenme hakkı vardır. Ulusal bayram ve genel tatil günleri ücretlidir.', '',
    'Madde 6 - Fesih ve ihbar', 'Fesihte ihbar süreleri çalışma süresine göre 2, 4, 6 ya da 8 haftadır (İş Kanunu md. 17).', '',
    'Madde 7 - Kişisel veri ve gizlilik', 'Taraflar kişisel verilerin KVKK uyarınca işlenmesini kabul eder. Çalışan işletmenin ticari sırlarını gizli tutar.', '',
    'İşveren: ____________    Çalışan: ____________    Tarih: ____________', '',
    'Bu metin taslaktır. İmzalanmadan önce iş hukukçusu kontrol etmelidir.'].join('\n');
}
function leaveDocText(d) {
  return ['İZİN BELGESİ (TASLAK)', '', `İşveren: ${BIZ}`, `Çalışan: ${d.name}`, `İzin türü: ${d.kind || '________'}`, `Tarihler: ${d.txt || '________'}`, `Süre: ${d.days ? d.days + ' gün' : '________'}`,
    `Ücret durumu: ${d.pay || '________'}`, '', 'İzin süresince çalışanın yıllık izin hakları saklıdır. Yıllık izin ve rapor günleri aylık değerlendirmede kapsam dışıdır.', '',
    'İşveren: ____________    Çalışan: ____________    Tarih: ____________', '', 'Bu metin taslaktır. Ücretsiz izin kesintisini muhasebeciyle teyit et.'].join('\n');
}
function warnDocText(d) {
  return ['YAZILI UYARI (TASLAK)', '', `İşveren: ${BIZ}`, `Çalışan: ${d.name}`, `Tarih: ${d.date}`, '', 'Konu', d.topic || '________', '',
    'Bu yazı, yukarıda belirtilen konunun düzeltilmesi için yapılmış yazılı bir hatırlatmadır. İşten çıkarma bildirimi değildir.', 'Çalışan, konuyla ilgili görüşünü ve açıklamasını yazılı olarak iletme hakkına sahiptir. Açıklama bu yazıya eklenir.', '',
    'İşveren: ____________    Çalışan (teslim aldım): ____________', '', 'Bu metin taslaktır. Disiplin sürecinde iş hukukçusuna danış.'].join('\n');
}
const TRM = { ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6, temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12 };
function dfParse(text) {
  const t = String(text || ''); const low = t.toLocaleLowerCase('tr-TR'); const warn = [];
  let name = (t.split(/,| diye | adlı | isimli | için /i)[0] || '').trim().replace(/^(yeni çalışan|bu)\s+/i, '');
  name = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)).join(' ');
  const pm = low.match(/kasiyer|barista|servis|mutfak|aşçı|garson|şef|temizlik|kurye|bulaşıkçı/); const pos = pm ? pm[0].charAt(0).toLocaleUpperCase('tr-TR') + pm[0].slice(1) : '';
  const dm = low.match(/(\d{1,2})\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/);
  let hire = '';
  if (dm) { const mo = TRM[dm[2]]; hire = `${mo < REF.m ? REF.y + 1 : REF.y}-${String(mo).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`; }
  const sm = t.match(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})(?!\s*saat)/); const salary = sm ? Number(sm[1].replace(/[.\s]/g, '')) : 0;
  const stype = /brüt|brut/.test(low) ? 'brut' : 'net';
  const hm = low.match(/(\d{2})\s*saat/); const hours = hm ? Number(hm[1]) : 45;
  const tm = low.match(/deneme\s*(\d)\s*ay|(\d)\s*ay\s*deneme/); const trial = tm ? Number(tm[1] || tm[2]) : 2;
  if (!name) warn.push('Çalışanın adını anlayamadım.');
  if (!pos) warn.push('Görev yazılmamış, boş bıraktım.');
  if (!hire) warn.push('Başlangıç tarihi yazılmamış, boş bıraktım.');
  if (!salary) warn.push('Maaş yazılmamış, boş bıraktım.');
  else if (!/net|brüt|brut/.test(low)) warn.push('Maaşın net mi brüt mü olduğu yazılmamış, net varsaydım. Kontrol et.');
  if (!hm) warn.push('Haftalık saat yazılmamış, 45 saat yazdım.');
  if (!tm) warn.push('Deneme süresi yazılmamış, 2 ay yazdım.');
  return { name, pos, hire, salary, stype, hours, trial, payday: 30, warn };
}
let DRAFTS = [];
const DF_KIND = { is: 'İş sözleşmesi', izin: 'İzin belgesi', uyari: 'Yazılı uyarı' };
function dfModal(m) {
  if (m.step === 'input') {
    return sheet('Kais AI ile belge hazırla', `<div class="field"><label for="df-kind">Belge türü</label><select id="df-kind"><option value="is">İş sözleşmesi (yeni çalışan)</option><option value="izin">İzin belgesi</option><option value="uyari">Yazılı uyarı</option></select></div>
    <div class="field"><label for="df-text">Bilgileri yaz</label><textarea id="df-text" style="min-height:120px" placeholder="Örnek: Ayşe Yılmaz, kasiyer, 1 Aralık başlıyor, 30.000 net, haftalık 45 saat">${esc(m.text || '')}</textarea></div>
    <p class="small muted">İzin belgesi ve uyarı için kayıtlı çalışanın adını yaz. Eksik bilgiyi sorarım, boş bırakır ve uyarırım.</p>
    <div class="err" id="df-err" role="alert">${esc(m.err || '')}</div><button class="btn block" data-a="dfgo">${ic('sparkle')} Taslağı hazırla</button>`);
  }
  const saved = m.step === 'view';
  return sheet(saved ? m.title : 'Taslak hazır', `${m.warn && m.warn.length ? `<div class="callout warn">${ic('alert')}<div><b>Kontrol et</b>${m.warn.map((w) => `<p style="margin-top:2px">${esc(w)}</p>`).join('')}</div></div>` : ''}
  <div class="field"><label for="df-body">${esc(DF_KIND[m.kind])}: ${esc(m.name || '')}</label><textarea id="df-body" class="paper-edit">${esc(m.body)}</textarea></div>
  <div class="row wrap"><button class="btn grow" data-a="${saved ? 'dfupd' : 'dfsave'}">${saved ? 'Değişikliği kaydet' : 'Taslağı kaydet'}</button><button class="btn sec" data-a="dfcopy">Kopyala</button>${saved ? '<button class="btn sec" data-a="dfdel">Sil</button>' : ''}</div>
  <p class="small muted">Bu metin taslaktır. İmzalanmadan önce iş hukukçusu kontrol etmelidir.</p>`);
}
H.dfopen = () => { S.modal = { type: 'df', step: 'input' }; renderModal(); };
H.dfgo = () => {
  const kind = document.getElementById('df-kind').value || 'is'; const text = (document.getElementById('df-text').value || '').trim();
  const fail = (e) => { S.modal = { type: 'df', step: 'input', text, err: e }; renderModal(); };
  if (text.length < 4) return fail('Bilgileri yaz.');
  const date = String(REF.d).padStart(2, '0') + ' ' + CURA + ' ' + REF.y;
  if (kind === 'is') {
    const d = dfParse(text);
    if (!d.name) return fail('Çalışanın adını yaz.');
    S.modal = { type: 'df', step: 'result', kind, name: d.name, warn: d.warn, body: contractText(d) }; renderModal(); return;
  }
  const uid = aiWho(text);
  if (!uid) return fail('Kayıtlı bir çalışan adı bulamadım. Adı yaz.');
  const u = byId(uid);
  if (kind === 'uyari') {
    const rest = text.replace(new RegExp(u.name.split(' ')[0] + "[^\\s,]*", 'i'), '').replace(/^[\s,:-]+/, '').trim();
    S.modal = { type: 'df', step: 'result', kind, name: u.name, warn: rest ? [] : ['Uyarının konusu yazılmamış, boş bıraktım.'], body: warnDocText({ name: u.name, date, topic: rest }) }; renderModal(); return;
  }
  const lv = LEAVES.filter((x) => x.uid === uid).slice(-1)[0];
  const warn = lv ? ['Çalışanın son kayıtlı iznini kullandım. Doğru değilse metni düzelt.'] : ['Bu çalışanın kayıtlı izni yok, alanları boş bıraktım.'];
  const pay = lv ? (lv.type === 'ucretsiz' ? (lv.ded ? `Ücretsiz, maaştan ${fmt(lv.ded)} kesilecek` : 'Ücretsiz, maaştan kesinti yok') : 'Ücretli') : '';
  S.modal = { type: 'df', step: 'result', kind, name: u.name, warn, body: leaveDocText({ name: u.name, kind: lv ? LV_KIND[lv.type] : '', txt: lv ? lv.txt : '', days: lv ? lv.days : 0, pay }) }; renderModal();
};
const dfBody = () => (document.getElementById('df-body') || {}).value;
H.dfsave = () => {
  const m = S.modal; const body = dfBody() || m.body;
  DRAFTS.unshift({ id: 'df' + ++seq, kind: m.kind, name: m.name, title: DF_KIND[m.kind] + ': ' + m.name, body, date: '14 Kas' });
  S.modal = null; S.view = 'calisanlar'; S.sub.calisanlar = 'soz'; S.empView = null; render(); toast('Taslak kaydedildi. Sözleşmeler sekmesinde duruyor.', 'ok');
};
H.dfview = (el) => { const d = DRAFTS.find((x) => x.id === el.dataset.id); S.modal = { type: 'df', step: 'view', id: d.id, kind: d.kind, name: d.name, title: d.title, body: d.body, warn: [] }; renderModal(); };
H.dfupd = () => { const d = DRAFTS.find((x) => x.id === S.modal.id); d.body = dfBody() || d.body; S.modal = null; render(); toast('Taslak güncellendi.', 'ok'); };
H.dfdel = () => { DRAFTS = DRAFTS.filter((x) => x.id !== S.modal.id); S.modal = null; render(); toast('Taslak silindi.'); };
H.dfcopy = () => { const t = dfBody() || ''; try { navigator.clipboard.writeText(t).then(() => toast('Metin kopyalandı.', 'ok'), () => toast('Kopyalanamadı. Metni seçip kopyala.', 'warn')); } catch (e) { toast('Kopyalanamadı. Metni seçip kopyala.', 'warn'); } };
function contractPreview(uid) {
  const p = PROFILES[uid]; const u = byId(uid);
  const txt = contractText({ name: u.name, pos: u.title, hire: p.hire, salary: p.salary, stype: p.stype, hours: p.hours, trial: p.trial, payday: p.payday });
  return `<details class="rt" style="border:1px solid var(--line);border-radius:12px"><summary><span>Yüklenen sözleşme örneği</span><span class="small muted">${esc(p.fname || 'is-sozlesmesi.jpg')}</span></summary><div class="rb"><div class="paper">${esc(txt)}</div><p class="small muted" style="margin-top:8px">Prototipte metin örnektir. Gerçek sürümde yüklenen fotoğraf ya da PDF burada açılır.</p></div></details>`;
}

/* ---------- muhasebeci: çalışanlar ---------- */
H.accopen = (el) => { S.empView = el.dataset.id; render(); if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0); };
const _nav2 = H.nav;
H.nav = (el) => { if (el.dataset.v === 'calisanlar') S.empView = null; _nav2(el); };
const _sub2 = H.sub;
H.sub = (el) => { if (el.dataset.g === 'calisanlar') S.empView = null; _sub2(el); };
function viewCalisanlar() {
  if (S.empView && PROFILES[S.empView]) return `<div class="stack-lg"><div><button class="btn sec sm" data-a="empback">${ic('back', 16)} Çalışanlar</button></div>${empDetail(S.empView, false, true)}</div>`;
  const cur = S.sub.calisanlar; const tabs = [['liste', 'Çalışanlar'], ['maas', 'Ödenen maaşlar'], ['soz', 'Sözleşmeler']];
  const all = EMP_IDS.map((id) => dueOf(id));
  let body = '';
  if (cur === 'maas') {
    const tot = all.reduce((a, d) => a + d.total, 0); const paid = all.reduce((a, d) => a + d.paid, 0);
    body = `<div class="kpis">${kpi(CURM + ' hakkı', fmt0(tot))}${kpi('Ödenen', fmt0(paid))}${kpi('Kalan', fmt0(tot - paid))}</div>
    <div class="card flush"><div style="padding:16px 16px 6px"><h3>Çalışan bazında</h3><p class="muted small" style="margin-top:2px">${PREVM} maaşı ekstreden bulundu. ${CURM} hesabı mesai ve izin kesintisini içerir.</p></div>${EMP_IDS.map((id, i) => { const u = byId(id); const d = all[i]; const pct = d.total ? Math.max(0, Math.min(100, Math.round((d.paid / d.total) * 100))) : 0; return `<button class="emp go" data-a="accopen" data-id="${id}" style="grid-template-columns:auto minmax(0,1fr) auto">${avatar(u, 40)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">Hak ${fmt0(d.total)} · ödenen ${fmt0(d.paid)}${d.ded ? ' · izin kesintisi ' + fmt0(d.ded) : ''}</div><div class="minibar" style="max-width:none"><i style="width:${pct}%;background:var(--turq)"></i></div></div><div class="right"><div class="num" style="font-weight:600">${fmt0(Math.abs(d.left))}</div><div class="small muted">${d.left > 0 ? 'kalan' : 'tamam'}</div></div></button>`; }).join('')}</div>
    <div class="card flush"><div style="padding:16px 16px 6px"><h3>Tüm ödemeler</h3></div>${PAYS.slice().reverse().map((x) => `<div class="logline" style="padding:12px 16px"><span><span class="pill p-info">${PAY_KIND[x.kind]}</span> ${esc(byId(x.uid).name)}<span class="small muted" style="display:block">${esc(x.per)} · ${esc(x.date)}</span></span><b class="num">${fmt(x.amt)}</b></div>`).join('')}</div>`;
  } else if (cur === 'soz') {
    body = `<div class="card stack aicard"><div class="row"><span class="aib">${ic('sparkle', 20)}</span><div class="grow"><h3>Kais AI ile belge hazırla</h3><p class="muted small" style="margin-top:2px">Yeni çalışanın bilgisini yaz, iş sözleşmesi taslağı hazırlasın. İzin belgesi ve yazılı uyarı da hazırlar.</p></div></div><button class="btn" style="align-self:flex-start" data-a="dfopen">${ic('plus')} Taslak hazırla</button></div>
    <div class="card flush"><div style="padding:16px 16px 6px"><h3>Sisteme yüklenen sözleşmeler</h3><p class="muted small" style="margin-top:2px">Çalışana dokununca sözleşme örneğini görürsün.</p></div>${EMP_IDS.map((id) => { const u = byId(id); const p = PROFILES[id]; return `<button class="emp go" data-a="accopen" data-id="${id}">${avatar(u, 40)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">${p.contract ? 'Belirsiz süreli · ' + esc(isoTxt(p.hire)) + ' · ' + fmt0(p.salary) + ' ' + (p.stype === 'net' ? 'net' : 'brüt') : 'Sözleşme yüklenmemiş'}</div></div>${p.contract ? '<span class="pill p-ok">Kayıtlı</span>' : '<span class="pill p-warn">Eksik</span>'}${ic('chevron', 18)}</button>`; }).join('')}</div>
    <div class="card flush"><div style="padding:16px 16px 6px"><h3>Hazırlanan taslaklar</h3></div>${DRAFTS.length ? DRAFTS.map((d) => `<div class="rrow"><div><b style="font-weight:600">${esc(d.title)}</b><div class="small muted">${esc(d.date)} · taslak</div></div><span class="pill p-warn">Taslak</span><div class="rfoot"><button class="btn sm sec" data-a="dfview" data-id="${d.id}">Aç</button></div></div>`).join('') : '<div class="empty">Henüz taslak yok.</div>'}</div>`;
  } else {
    const sal = EMP_IDS.reduce((a, id) => a + PROFILES[id].salary, 0);
    body = `<div class="kpis">${kpi('Çalışan', EMP_IDS.length)}${kpi('Aylık maaş', fmt0(sal))}${kpi('Sözleşmesi eksik', EMP_IDS.filter((id) => !PROFILES[id].contract).length)}</div>
    <div class="card flush">${EMP_IDS.map((id, i) => { const u = byId(id); const p = PROFILES[id]; const d = all[i]; return `<button class="emp go" data-a="accopen" data-id="${id}">${avatar(u, 40)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">${esc(u.title)} · ${fmt0(p.salary)} ${p.stype === 'net' ? 'net' : 'brüt'} · kıdem ${tenureTxt(monthsBetween(p.hire))}</div>${p.contract ? '' : '<span class="pill p-warn" style="margin-top:6px">Sözleşme eksik</span>'}</div><div class="right"><div class="num" style="font-weight:600">${fmt0(Math.abs(d.left))}</div><div class="small muted">${d.left > 0 ? 'kalan' : 'tamam'}</div></div>${ic('chevron', 18)}</button>`; }).join('')}</div>`;
  }
  return `<div class="stack-lg">${seg('calisanlar', tabs, cur)}${body}</div>`;
}

/* =====================================================================
   v5: tutarlılık düzeltmeleri: puantaj-mesai bağı, ekstre-tablo kontrolü,
   değişiklik geçmişi, dönem ayrımı
   ===================================================================== */
S.tper = 'hepsi';
const lper = (r) => (String(r.date).indexOf(PREVA) >= 0 ? PREVM : String(r.date).indexOf(CURA) >= 0 ? CURM : 'Diğer');
const rDateY = (r) => r.date + ' ' + (String(r.date).indexOf(PREVA) >= 0 ? _PY : REF.y);
const inPer = (r) => S.tper === 'hepsi' || lper(r) === S.tper;
const gp = () => gl().filter((r) => lper(r) === PREVM);

/* puantaj: mesai giriş-çıkış kayıtlarından hesaplanır */
const WEEKS = ['02–07 Kas', '09–14 Kas'];
const DAYN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const HOURS = {
  u4: [[9, 9, 9, 9, 9, 3], [9, 9, 9, 9, 9, 3]],
  u5: [[8, 8, 8, 8, 8, 7], [8, 8, 8, 8, 8, 7]],
  u6: [[8, 8, 8, 8, 8, 5], [8, 8, 8, 8, 8, 4]],
  u7: [[9, 9, 9, 9, 9, 5], [9, 9, 9, 8, 8, 5]],
};
function otFromLog(uid) {
  const lim = PROFILES[uid].hours;
  const weeks = HOURS[uid].map((h, i) => { const total = h.reduce((a, x) => a + x, 0); return { lab: WEEKS[i], days: h, total, ot: Math.max(0, total - lim) }; });
  return { weeks, hours: weeks.reduce((a, w) => a + w.ot, 0) };
}
EMP_IDS.forEach((id) => {
  const p = PROFILES[id]; const prev = p.otYear - p.otMonth;
  Object.defineProperty(p, 'otMonth', { get: () => otFromLog(id).hours, enumerable: true, configurable: true });
  Object.defineProperty(p, 'otYear', { get: () => prev + otFromLog(id).hours, enumerable: true, configurable: true });
});
function puantaj(uid) {
  const o = otFromLog(uid); const lim = PROFILES[uid].hours;
  return `<div><p class="lbl">Puantaj, ${CURM}</p>${o.weeks.map((w) => `<div class="logline"><span>${esc(w.lab)}<span class="small muted" style="display:block">${w.days.map((h, i) => DAYN[i] + ' ' + h).join(' · ')}</span></span><span class="num"><b>${w.total} sa</b>${w.ot ? ` · <span style="color:var(--safran)">${w.ot} sa fazla</span>` : ''}</span></div>`).join('')}<p class="small muted" style="margin-top:6px">Giriş, çıkış ve mola kayıtlarından net çalışma saati. Haftalık ${lim} saati aşan kısım fazla mesai sayılır ve maaş hesabına kendiliğinden girer.</p></div>`;
}

/* ekstre ile tablo uyuşması */
function mismatch(r) {
  const f = r.rc && RECEIPTS.find((x) => x.id === r.rc);
  const bid = r.bank || (f && f.bank);
  const b = bid && ROWS.find((x) => x.id === bid);
  if (!b) return null;
  return Math.abs(Math.abs(b.amt) - Number(r.total)) > 0.005 ? b : null;
}
const ledgerMis = (rcid) => { const r = LEDGER.find((x) => x.rc === rcid); return !!(r && mismatch(r)); };
const srcCell = (r) => srcPill(r) + (mismatch(r) ? ` <span class="pill p-bad">Ekstre ${fmt(Math.abs(mismatch(r).amt))}</span>` : '');
function misBanner() {
  const list = LEDGER.filter((r) => mismatch(r));
  if (!list.length) return '';
  return `<div class="callout warn">${ic('alert')}<div class="grow"><b>${list.length} satırın tutarı ekstreyle uyuşmuyor</b>${list.map((r) => { const b = mismatch(r); return `<div class="row between wrap" style="margin-top:8px"><span>${esc(r.desc)}: tabloda ${fmt(Number(r.total))}, ekstrede ${fmt(Math.abs(b.amt))}</span>${S.closed ? '' : `<button class="btn sm sec" data-a="lfix" data-id="${r.id}">Ekstre tutarına eşitle</button>`}</div>`; }).join('')}<p class="small muted" style="margin-top:8px">İndirim, kısmi ödeme ya da elle değişiklik olabilir. Doğruysa olduğu gibi bırak.</p></div></div>`;
}
const perChips = () => `<div class="chips">${[['hepsi', 'Tümü'], [PREVM, PREVM + ' (kapanış)'], [CURM, CURM + ' (devam ediyor)']].map((x) => `<button class="chip" data-a="tper" data-v="${x[0]}" aria-pressed="${S.tper === x[0]}">${x[1]}</button>`).join('')}</div>`;
H.tper = (el) => { S.tper = el.dataset.v; render(); };

/* değişiklik geçmişi ve geri alma */
let AUDIT = [];
const CELL_TR = { date: 'tarih', desc: 'açıklama', acc: 'hesap', doc: 'belge', rate: 'KDV oranı', total: 'toplam' };
const whoNow = () => S.user.name.split(' ')[0] + ' · ' + ROLE_LABEL[S.user.role];
function auditList() {
  if (!AUDIT.length) return '<p class="small muted">Henüz değişiklik yok.</p>';
  return AUDIT.slice(0, 20).map((e, i) => `<div class="mini"><div><span class="small muted">${esc(e.t)} · ${esc(e.who)}</span><div>${esc(e.text)}</div></div><div></div>${(e.type === 'cell' || e.type === 'del') ? `<div class="m2">${e.undone ? '<span class="pill p-mute">Geri alındı</span>' : `<button class="btn sm sec" data-a="lundo" data-i="${i}">Geri al</button>`}</div>` : ''}</div>`).join('');
}
function auditAdd(e) {
  AUDIT.unshift(Object.assign({ t: nowT(), who: whoNow() }, e));
  const el = document.getElementById('audit-list'); if (el) el.innerHTML = auditList();
}
function auditCell(r, k, old) {
  const f = (v) => (k === 'total' ? fmt(Number(v)) : k === 'rate' ? '%' + v : v);
  auditAdd({ type: 'cell', rid: r.id, k, old, text: `${r.desc}: ${CELL_TR[k]} ${f(old)} → ${f(r[k])}` });
}
H.lundo = (el) => {
  if (locked()) return;
  const e = AUDIT[Number(el.dataset.i)];
  if (!e || e.undone) return;
  if (e.type === 'cell') {
    const r = LEDGER.find((x) => x.id === e.rid);
    if (!r) { toast('Satır artık yok.', 'warn'); return; }
    r[e.k] = e.old; r.edited = true; e.undone = true;
    auditAdd({ text: 'Geri alındı: ' + e.text });
  } else {
    LEDGER.splice(Math.min(e.idx, LEDGER.length), 0, e.row); e.undone = true;
    auditAdd({ text: `Silinen satır geri geldi: ${e.row.desc}` });
  }
  render(); toast('Geri alındı.', 'ok');
};
function ldelModal(m) {
  const r = LEDGER.find((x) => x.id === m.id);
  return sheet('Satırı sil', `<div class="callout warn">${ic('alert')}<div><b>${esc(r.desc)}</b><p style="margin-top:2px">${esc(r.date)} · ${fmt(Number(r.total))}</p></div></div><p class="small muted">Silinen satır Değişiklik geçmişinde durur, oradan geri alabilirsin.</p>
  <div class="row"><button class="btn bad grow" data-a="ldelok" data-id="${r.id}">Sil</button><button class="btn sec" data-a="closemodal">Vazgeç</button></div>`);
}
H.ldel = (el) => { if (locked()) return; S.modal = { type: 'ldel', id: el.dataset.id }; renderModal(); };
H.ldelok = (el) => {
  const idx = LEDGER.findIndex((x) => x.id === el.dataset.id); if (idx < 0) return;
  const row = LEDGER[idx];
  LEDGER = LEDGER.filter((x) => x.id !== row.id);
  auditAdd({ type: 'del', row, idx, text: `Satır silindi: ${row.desc}, ${fmt(Number(row.total))}` });
  S.modal = null; render(); toast('Satır silindi. Geçmişten geri alabilirsin.');
};
H.lfix = (el) => {
  if (locked()) return;
  const r = LEDGER.find((x) => x.id === el.dataset.id); const b = mismatch(r); if (!b) return;
  const old = r.total; r.total = Math.abs(b.amt); r.edited = true;
  auditAdd({ type: 'cell', rid: r.id, k: 'total', old, text: `${r.desc}: toplam ${fmt(Number(old))} → ${fmt(r.total)} (ekstreye eşitlendi)` });
  render(); toast('Tutar ekstreye eşitlendi.', 'ok');
};
const _ladd = H.ladd;
H.ladd = () => { const n = LEDGER.length; _ladd(); if (LEDGER.length > n) auditAdd({ text: `Satır eklendi: ${LEDGER[LEDGER.length - 1].desc}` }); };
const _revok = H.revok;
H.revok = () => {
  const m = S.modal; const f = m && RECEIPTS.find((x) => x.id === m.id); const n = LEDGER.length;
  _revok();
  if (LEDGER.length > n) auditAdd({ text: `Kais satır yazdı: ${f.seller}, ${fmt(f.total)} (muhasebeci onayladı)` });
};

/* v6: gerçek .xlsx indirme */
let DL = null;
if (typeof claude !== 'undefined' && claude && claude.use) { try { Promise.resolve(claude.use('downloads')).then((d) => { DL = d; render(); }, () => {}); } catch (e) {} }
const CRC_T = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) {
  const enc = new TextEncoder(); const parts = []; const cen = []; let off = 0;
  const u16 = (v) => [v & 255, (v >> 8) & 255]; const u32 = (v) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  files.forEach((f) => {
    const nm = enc.encode(f.name); const d = enc.encode(f.data); const c = crc32(d);
    const lh = [0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), ...u16(0)];
    parts.push(new Uint8Array(lh), nm, d);
    cen.push([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)], nm);
    off += lh.length + nm.length + d.length;
  });
  let cl = 0; cen.forEach((x) => { const a = x instanceof Uint8Array ? x : new Uint8Array(x); parts.push(a); cl += a.length; });
  parts.push(new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cl), ...u32(off), 0, 0]));
  return parts;
}
const xe = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
function colL(i) { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
// hücre: string | number | {n:sayı} para | {f:'formül', v:değer} | {b:'kalın metin'} | {bn: kalın para}
function sheetXml(rows, widths) {
  const out = rows.map((r, ri) => '<row r="' + (ri + 1) + '"' + (ri === 0 ? ' ht="26" customHeight="1"' : '') + '>' + r.map((c, ci) => {
    const ref = colL(ci) + (ri + 1);
    if (c === null || c === undefined || c === '') return '';
    if (typeof c === 'string') return '<c r="' + ref + '" t="inlineStr"' + (ri === 0 ? ' s="1"' : ' s="6"') + '><is><t xml:space="preserve">' + xe(c) + '</t></is></c>';
    if (typeof c === 'number') return '<c r="' + ref + '" s="3"><v>' + c + '</v></c>';
    if (c.f) return '<c r="' + ref + '" s="2"><f>' + xe(c.f) + '</f><v>' + c.v + '</v></c>';
    if (c.n !== undefined) return '<c r="' + ref + '" s="2"><v>' + c.n + '</v></c>';
    if (c.bn !== undefined) return '<c r="' + ref + '" s="4"><v>' + c.bn + '</v></c>';
    if (c.bf) return '<c r="' + ref + '" s="4"><f>' + xe(c.bf) + '</f><v>' + c.v + '</v></c>';
    if (c.b) return '<c r="' + ref + '" t="inlineStr" s="5"><is><t>' + xe(c.b) + '</t></is></c>';
    return '';
  }).join('') + '</row>').join('');
  const cols = '<cols>' + widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + cols + '<sheetData>' + out + '</sheetData>' + (rows.length > 1 ? '<autoFilter ref="A1:' + colL(widths.length - 1) + (rows.length - (rows[rows.length - 1].some((c) => c && typeof c === 'object' && c.bf) ? 1 : 0)) + '"/>' : '') + '</worksheet>';
}
const r2 = (x) => Math.round(x * 100) / 100;
function ledgerSheet(kind) {
  const rows = [['Dönem', 'Tarih', 'Açıklama', 'Hesap', 'Belge', 'KDV %', 'KDV', 'Toplam', 'Kaynak']];
  const list = LEDGER.filter((r) => dirOf(r) === kind);
  list.forEach((r, i) => { const n = i + 2; rows.push([lper(r), rDateY(r), String(r.desc), String(r.acc), String(r.doc || ''), Number(r.rate), { f: 'H' + n + '-H' + n + '/(1+F' + n + '/100)', v: r2(kdv(r)) }, { n: Number(r.total) }, r.edited ? 'Düzenlendi' : String(r.src || '')]); });
  const e = list.length + 1;
  rows.push(['', '', '', '', '', { b: 'Toplam' }, { bf: 'SUM(G2:G' + e + ')', v: r2(list.reduce((a, r) => a + kdv(r), 0)) }, { bf: 'SUM(H2:H' + e + ')', v: r2(list.reduce((a, r) => a + Number(r.total), 0)) }]);
  return rows;
}
function buildXlsx() {
  const nm = (id) => (USERS.find((u) => u.id === id) || {}).name || id;
  const sheets = [
    ['Giderler', ledgerSheet('gider'), [10, 14, 34, 22, 14, 8, 12, 14, 12]],
    ['Gelirler', ledgerSheet('gelir'), [10, 14, 34, 22, 14, 8, 12, 14, 12]],
    ['Çalışanlar', [['Ad', 'Görev', 'İşe giriş', 'Maaş (net)', 'Haftalık saat', 'Maaş günü', 'Sözleşme']].concat(EMP_IDS.map((id) => { const p = PROFILES[id]; return [nm(id), (USERS.find((u) => u.id === id) || {}).title || '', p.hire, { n: p.salary }, p.hours, p.payday, p.contract ? 'Yüklü' : 'Eksik']; })), [22, 14, 12, 14, 14, 10, 12]],
    ['Maaş ödemeleri', [['Ad', 'Tür', 'Dönem', 'Tutar', 'Tarih']].concat(PAYS.map((p) => [nm(p.uid), p.kind === 'maas' ? 'Maaş' : p.kind === 'avans' ? 'Avans' : String(p.kind), String(p.per), { n: p.amt }, String(p.date)])), [22, 10, 14, 14, 10]],
    ['Borçlar', [['Kime', 'Not', 'Vade', 'Tutar', 'Durum']].concat(allDebts().map((d) => [d.who, d.note, d.due, { n: d.amt }, d.paid ? 'Ödendi' : 'Açık'])), [26, 36, 12, 14, 10]],
    ['Bordro girdisi', [['Ad', 'Dönem', 'Net maaş', 'Brüt (tahmini)', 'Fazla mesai saat', 'Ücretsiz izin günü', 'İzin kesintisi', 'Avans']].concat(EMP_IDS.map((id) => { const p = PROFILES[id]; const d = dueOf(id); const pr = empPayroll(id); const ud = LEAVES.filter((x) => x.uid === id && x.type === 'ucretsiz' && x.per === NEXTP).reduce((a, x) => a + x.days, 0); const av = PAYS.filter((x) => x.uid === id && x.kind === 'avans' && x.per === NEXTP).reduce((a, x) => a + x.amt, 0); return [nm(id), NEXTP, { n: r2(pr.net) }, { n: r2(pr.brut) }, p.otMonth, ud, { n: d.ded }, { n: av }]; })), [22, 14, 14, 14, 16, 16, 14, 12]],
    ['Alacaklar', [['Kimden', 'Not', 'Gün', 'Tutar', 'Durum']].concat(RECV.map((a) => [a.name, a.note, a.days, { n: a.amt }, a.paid ? 'Tahsil edildi' : 'Açık'])), [26, 30, 8, 14, 12]],
  ];
  eSheets().forEach((x) => { if (SALES.length || (x[0] !== 'Satış ve maliyet' && x[0] !== 'e-Belge taslağı')) sheets.push(x); });
  const files = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + xe(s[0]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCE8F5"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F3F7A"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF1FB"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFE3E9F2"/></bottom><diagonal/></border><border><left/><right/><top style="medium"><color rgb="FF0F3F7A"/></top><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="1" fillId="4" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf></cellXfs></styleSheet>' },
  ].concat(sheets.map((s, i) => ({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXml(s[1], s[2]) })));
  return zipStore(files);
}
function xlsxBtn() { return DL ? '<button class="btn sec sm" data-a="xlsx">' + ic('file', 16) + ' Excel indir</button>' : ''; }
H.xlsx = async () => {
  if (!DL) return toast('Bu ekranda indirme kullanılamıyor.', 'warn');
  try {
    await DL.save({ filename: 'cinar-kafe-muhasebe-2026-11.xlsx', data: new Blob(buildXlsx(), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
    toast('Excel dosyası hazır.', 'ok');
  } catch (e) { if (!/declin/i.test(String((e && (e.code || e.message)) || e))) toast('Excel indirilemedi.', 'warn'); }
};

/* v7: bordro tahmini, tazminat bilgisi, hukuki kontrol */
const T26 = { asgBrut: 33030, asgNet: 28075.5, sgk: 0.14, isz: 0.01, damga: 0.00759, damgaEx: 250.7, kidemTavan: 73729.87,
  brk: [[190000, 0.15], [400000, 0.2], [1500000, 0.27], [5300000, 0.35], [Infinity, 0.4]] };
function gvTax(cum) { let t = 0; let lo = 0; for (const [hi, r] of T26.brk) { if (cum > lo) t += (Math.min(cum, hi) - lo) * r; lo = hi; } return t; }
function payroll(brut, m) {
  const sgk = brut * T26.sgk; const isz = brut * T26.isz; const mat = brut - sgk - isz;
  const gvRaw = gvTax(mat * m) - gvTax(mat * (m - 1));
  const mA = T26.asgBrut * (1 - T26.sgk - T26.isz);
  const gvEx = gvTax(mA * m) - gvTax(mA * (m - 1));
  const gv = Math.max(0, gvRaw - gvEx); const damga = Math.max(0, brut * T26.damga - T26.damgaEx);
  return { brut, sgk, isz, gv, damga, net: brut - sgk - isz - gv - damga };
}
function netToBrut(net, m) { let lo = net; let hi = net * 3; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (payroll(mid, m).net < net) lo = mid; else hi = mid; } return payroll((lo + hi) / 2, m); }
function empPayroll(uid) { const p = PROFILES[uid]; return p.stype === 'brut' ? payroll(p.salary, REF.m) : netToBrut(p.salary, REF.m); }
function exitInfo(uid) {
  const p = PROFILES[uid]; const mm = monthsBetween(p.hire); const wk = noticeWeeks(mm); const pr = empPayroll(uid);
  const yrs = mm / 12; const ihbar = (pr.brut / 30) * 7 * wk; const base = Math.min(pr.brut, T26.kidemTavan);
  const kidem = mm >= 12 ? base * yrs : 0;
  return { wk, ihbar, kidem, kidemNet: kidem * (1 - T26.damga), cap: pr.brut > T26.kidemTavan };
}
const empDetailV6 = empDetail;
empDetail = function (uid, mine, ro) {
  const html = empDetailV6(uid, mine, ro);
  const p = PROFILES[uid]; const pr = empPayroll(uid); const low = pr.net < T26.asgNet - 0.5;
  const ex = exitInfo(uid);
  const row = (a, b, c) => `<div class="logline"><span>${a}${c ? `<span class="small muted" style="display:block">${c}</span>` : ''}</span><b class="num">${b}</b></div>`;
  const card = `<div class="card stack"><div><h3>Bordro tahmini</h3><p class="muted small" style="margin-top:2px">${REF.m}. ay için, 2026 oranlarıyla. Resmi bordro değildir.</p></div>
  ${low ? `<div class="callout bad">${ic('alert')}<div><b>Maaş asgari ücretin altında</b><p style="margin-top:2px">2026 net asgari ücret ${fmt(T26.asgNet)}. Bu çalışanın net maaşı bunun altında görünüyor, muhasebeciyle kontrol et.</p></div></div>` : ''}
  <div>${row('Brüt maaş', fmt(pr.brut), p.stype === 'net' ? 'Netten geriye doğru hesaplandı' : 'Kayıtlı brüt')}${row('SGK işçi payı (%14)', fmt(-pr.sgk))}${row('İşsizlik sigortası (%1)', fmt(-pr.isz))}${row('Gelir vergisi', fmt(-pr.gv), 'Asgari ücret istisnası düşüldü, kümülatif dilime göre')}${row('Damga vergisi', fmt(-pr.damga), 'Binde 7,59, asgari ücret istisnası düşüldü')}${row('<b style="font-weight:600">Net maaş</b>', fmt(pr.net))}</div>
  <p class="small muted">Her ay aynı brüt ödendiği varsayıldı. Prim, ek ödeme ve vergi dilimi değişimi sonucu oynatır. Bordroyu muhasebecinin bordro programı keser.</p>
  ${mine ? '' : `<details class="rt"><summary><span>İşten ayrılırsa ödenecek tutarlar</span><b class="num">bilgi</b></summary><div class="rb">
  ${row('İhbar süresi', ex.wk + ' hafta')}${row('İhbar tazminatı (brüt)', fmt(ex.ihbar), 'Süreye uyulmadan feshedilirse. Gelir ve damga vergisi kesilir.')}${row('Kıdem tazminatı (brüt)', ex.kidem ? fmt(ex.kidem) : 'Yok', ex.kidem ? (ex.cap ? 'Tavan ' + fmt(T26.kidemTavan) + ' uygulandı. Yalnız damga vergisi kesilir.' : 'Tavan altında. Yalnız damga vergisi kesilir.') : '1 yıl dolmadığı için hak yok')}
  <p class="small muted" style="margin-top:8px">Bu bilgi amaçlıdır. Kais kimseyi işten çıkarmaz. Hangi fesihte hangi hakkın doğduğunu iş hukukçusu belirler. Kıdem tavanı 1 Tem – 31 Ara 2026 için ${fmt(T26.kidemTavan)}.</p></div></details>`}
  </div>`;
  return html.replace(/<\/div>\s*$/, card + '</div>');
};

/* belge metinleri: araştırma sonrası düzeltmeler */
const contractTextV6 = contractText;
contractText = function (d) {
  return contractTextV6(d)
    .replace('Taraflar kişisel verilerin KVKK uyarınca işlenmesini kabul eder.', 'İşveren, çalışanın kişisel verilerini KVKK md. 10 uyarınca ayrı bir aydınlatma metniyle bilgilendirir. Açık rıza gereken işlemler için rıza ayrı bir belgeyle alınır.')
    .replace('Avans ve kesintiler yazılı kayıtla yapılır.', 'Ücret, kanundaki asgari ücretin altında olamaz. Avans ve kesintiler yazılı kayıtla yapılır.');
};
const leaveDocTextV6 = leaveDocText;
leaveDocText = function (d) {
  const unpaid = /Ücretsiz/.test(d.pay || '') || /Ücretsiz/.test(d.kind || '');
  const extra = unpaid
    ? ['', 'Ücretsiz izin yalnızca çalışanın yazılı onayıyla uygulanır (İş Kanunu md. 22). Bu sürede iş sözleşmesi askıdadır, ücret ve SGK primi ödenmez, süre kural olarak kıdeme ve yıllık izne sayılmaz.', 'Çalışanın onayı: [ ] Kabul ediyorum   [ ] Kabul etmiyorum   (6 iş günü içinde yazılı)']
    : ['', 'Yıllık ücretli izin ücreti, çalışan izne başlamadan önce ödenir (İş Kanunu md. 57).'];
  return leaveDocTextV6(d).replace('\nİşveren: ____________', extra.join('\n') + '\n\nİşveren: ____________');
};
function kvkkText(d) {
  return ['ÇALIŞAN KVKK AYDINLATMA METNİ (TASLAK)', '', `Veri sorumlusu: ${BIZ}`, `Çalışan: ${d.name}`, '',
    '1. Veri sorumlusunun kimliği', `${BIZ}, işletme adresi: ________, iletişim: ________.`, '',
    '2. İşlenen veriler ve amaç', 'Kimlik, iletişim, banka (IBAN), özlük, maaş, izin, mesai ve puantaj verileriniz; iş sözleşmesinin kurulması ve yürütülmesi, ücret ve SGK işlemleri, izin takibi ve yasal yükümlülükler için işlenir.', '',
    '3. Hukuki sebep', 'Sözleşmenin ifası, işverenin hukuki yükümlülüğü ve meşru menfaat (KVKK md. 5). Bu sebeplere dayanan işlemler için açık rıza istenmez.', '',
    '4. Aktarım', 'Verileriniz SGK, vergi dairesi, işletmenin muhasebecisi ve bankaya, yalnız yukarıdaki amaçlarla aktarılır.', '',
    '5. Toplama yöntemi', 'Verileriniz sizden formlar, sözleşme, fiş ve uygulama kayıtlarıyla toplanır.', '',
    '6. Haklarınız (KVKK md. 11)', 'Verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltme, silme, aktarılan kişileri öğrenme, itiraz etme ve zarar halinde tazminat isteme haklarına sahipsiniz. Başvurunuzu yazılı olarak ________ adresine iletebilirsiniz.', '',
    'Teslim aldım: ____________    Tarih: ____________', '',
    'Bu metin bir bilgilendirmedir, onay belgesi değildir. Açık rıza gereken bir işlem varsa rıza ayrı bir belgeyle alınmalıdır (KVKK Kurulu 2026/347 ilke kararı).',
    'Bu metin taslaktır. Veri sorumlusu bilgileri ve VERBİS yükümlülüğü için iş hukukçusu kontrol etmelidir.'].join('\n');
}
DF_KIND.kvkk = 'KVKK aydınlatma metni';
const dfModalV6 = dfModal;
dfModal = function (m) { return dfModalV6(m).replace('<option value="uyari">Yazılı uyarı</option>', '<option value="uyari">Yazılı uyarı</option><option value="kvkk">KVKK aydınlatma metni</option>'); };
const dfParseV6 = dfParse;
dfParse = function (text) {
  const d = dfParseV6(text);
  if (d.salary) { const net = d.stype === 'brut' ? payroll(d.salary, 1).net : d.salary; if (net < T26.asgNet - 0.5) d.warn.push('Yazılan maaş 2026 net asgari ücretin (' + fmt(T26.asgNet) + ') altında. Asgari ücretten az maaş yazılamaz.'); }
  return d;
};
const _dfgo = H.dfgo;
H.dfgo = () => {
  const kind = (document.getElementById('df-kind') || {}).value; const text = ((document.getElementById('df-text') || {}).value || '').trim();
  if (kind !== 'kvkk') return _dfgo();
  const fail = (e) => { S.modal = { type: 'df', step: 'input', text, err: e }; renderModal(); };
  const uid = text.length < 3 ? null : aiWho(text);
  if (!uid) return fail('Kayıtlı bir çalışan adı bulamadım. Adı yaz.');
  const u = byId(uid);
  S.modal = { type: 'df', step: 'result', kind, name: u.name, warn: ['Adres ve iletişim alanlarını doldur.'], body: kvkkText({ name: u.name }) }; renderModal();
};

/* hukuki durum: şablon başına dayanak ve kontrol */
const LEGAL = [
  ['İş sözleşmesi', 'İş Kanunu md. 8, 17, 41, 53', ['Ücret asgari ücretin altında olmamalı', 'Deneme süresi en çok 2 ay', 'İhbar süreleri 2/4/6/8 hafta', 'Fazla mesai %50 zamlı, yıllık 270 saat sınırı']],
  ['Ücretsiz izin', 'İş Kanunu md. 22, Yargıtay 9. HD', ['Çalışanın yazılı onayı olmadan uygulanamaz', 'Onay için 6 iş günü süre tanınır', 'Süre kural olarak kıdeme ve yıllık izne sayılmaz', 'Kesinti tutarı çalışana yazılı bildirilir']],
  ['Yıllık izin', 'İş Kanunu md. 53, 57', ['Hak 14/20/26 gün, kıdeme göre', 'İzin ücreti izne çıkmadan önce yatırılır', 'İzin yazılı kayda geçer']],
  ['Yazılı uyarı', 'İş Kanunu md. 18-25', ['Uyarı işten çıkarma değildir, metinde böyle yazar', 'Çalışanın savunması alınır', 'Fesih kararı hukukçuyla verilir']],
  ['KVKK aydınlatma', 'KVKK md. 10, 11', ['Kimlik, amaç, aktarım, toplama yöntemi ve hukuki sebep yazılır', 'Haklar (md. 11) sayılır', 'Açık rıza ayrı belge olur', 'VERBİS gereği işletmeye göre ayrıca bakılır']],
];
function legalCard() {
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Hukuki kontrol durumu</h3><p class="muted small" style="margin-top:2px">Şablonlar kaynaklara göre güncellendi. Hiçbiri henüz bir iş hukukçusundan geçmedi.</p></div>
  ${LEGAL.map((l) => `<details class="rt"><summary><span>${esc(l[0])}</span><span class="pill p-warn">Avukat onayı bekliyor</span></summary><div class="rb"><p class="small muted">Dayanak: ${esc(l[1])}</p>${l[2].map((x) => `<p class="small" style="margin-top:4px">• ${esc(x)}</p>`).join('')}</div></details>`).join('')}</div>`;
}
const viewCalisanlarV6 = viewCalisanlar;
viewCalisanlar = function () {
  const h = viewCalisanlarV6();
  if (S.empView || S.sub.calisanlar !== 'soz') return h;
  return h.replace(/<\/div>\s*$/, legalCard() + '</div>');
};

/* v8: kalıcı kayıt, giriş, satış yükleme, reçete maliyeti, giriş kodu, e-belge hazırlığı */
const REF_ISO = REF.y + '-' + String(REF.m).padStart(2, '0') + '-' + String(REF.d).padStart(2, '0');
const isoShort = (iso) => { const a = iso.split('-').map(Number); return String(a[2]).padStart(2, '0') + ' ' + MON[a[1] - 1]; };
const prodKey = (s) => String(s).trim().toLocaleLowerCase('tr-TR');
const r3 = (x) => Math.round(x * 1000) / 1000;
if (S.settings.codeIn === undefined) S.settings.codeIn = true;

/* ---- yeni veri ---- */
let SALES = []; let SALEIMP = []; let CLOCK = [];
let RECIPES = {
  latte: { name: 'Latte', rate: 10, items: { s2: 0.2, s3: 0.018, s5: 1 } },
  'filtre kahve': { name: 'Filtre kahve', rate: 10, items: { s3: 0.012, s5: 1 } },
  simit: { name: 'Simit', rate: 10, items: { s1: 0.003 } },
  poğaça: { name: 'Poğaça', rate: 10, items: { s1: 0.0035, s6: 0.006, s2: 0.03 } },
  cheesecake: { name: 'Cheesecake', rate: 10, items: { s2: 0.15, s4: 0.01, s1: 0.002 } },
};
const EDOC = { unvan: BIZ, vkn: '', vd: '', adres: '', eposta: '', muk: 'bilmiyorum', ent: '' };
const COST0 = { s1: 1500, s2: 38, s3: 700, s4: 220, s5: 3.5, s6: 1500, s7: 450 };
STOCK.forEach((s) => { if (s.cost == null) s.cost = COST0[s.id] || 0; });
const AUTH = { secret: Math.random().toString(36).slice(2, 10), salt: Math.random().toString(36).slice(2, 10), h: {}, must: {}, demo: true };

/* ---- kalıcı kayıt (db) ---- */
const P_ARR = [['LEDGER', () => LEDGER], ['RECEIPTS', () => RECEIPTS], ['PAYS', () => PAYS], ['LEAVES', () => LEAVES], ['LVREQ', () => LVREQ], ['DEBTS', () => DEBTS], ['DRAFTS', () => DRAFTS], ['AUDIT', () => AUDIT], ['MSGS', () => MSGS], ['STOCK', () => STOCK], ['STOCKLOG', () => STOCKLOG], ['RECV', () => RECV], ['ROWS', () => ROWS], ['SALES', () => SALES], ['SALEIMP', () => SALEIMP], ['CLOCK', () => CLOCK]];
const P_OBJ = [['HOURS', () => HOURS], ['ATT', () => ATT], ['EMPDATA', () => EMPDATA], ['RECIPES', () => RECIPES], ['EDOC', () => EDOC], ['NOTES', () => NOTES], ['SETTINGS', () => S.settings], ['MAIL', () => S.mail]];
const PS = { db: null, loaded: false, state: 'local', last: '', timer: null, busy: false, remote: null, canWrite: true };
function pSnap() {
  const o = { seq, AUTH, PROFILES: {}, ROLES: {} };
  P_ARR.forEach(([k, g]) => { o[k] = g(); }); P_OBJ.forEach(([k, g]) => { o[k] = g(); });
  EMP_IDS.forEach((id) => { const p = {}; Object.keys(PROFILES[id]).forEach((k) => { if (k !== 'otMonth' && k !== 'otYear') p[k] = PROFILES[id][k]; }); o.PROFILES[id] = p; });
  USERS.forEach((u) => { o.ROLES[u.id] = u.role; });
  return JSON.stringify(o);
}
function pApply(str) {
  let o; try { o = JSON.parse(str); } catch (e) { return false; }
  P_ARR.forEach(([k, g]) => { if (Array.isArray(o[k])) { const a = g(); a.splice(0, a.length, ...o[k]); } });
  P_OBJ.forEach(([k, g]) => { if (o[k] && typeof o[k] === 'object') { const t = g(); Object.keys(t).forEach((x) => { delete t[x]; }); Object.assign(t, o[k]); } });
  if (o.PROFILES) Object.keys(o.PROFILES).forEach((id) => { const t = PROFILES[id]; if (t) Object.entries(o.PROFILES[id]).forEach(([k, v]) => { if (k !== 'otMonth' && k !== 'otYear') t[k] = v; }); });
  if (o.ROLES) USERS.forEach((u) => { if (o.ROLES[u.id]) u.role = o.ROLES[u.id]; });
  if (o.AUTH) { AUTH.secret = o.AUTH.secret || AUTH.secret; AUTH.salt = o.AUTH.salt || AUTH.salt; AUTH.h = o.AUTH.h || {}; AUTH.must = o.AUTH.must || {}; AUTH.demo = o.AUTH.demo !== false; }
  if (typeof o.seq === 'number') seq = Math.max(seq, o.seq);
  return true;
}
const PS_TXT = { local: 'Örnek veri', saving: 'Kaydediliyor…', saved: 'Kaydedildi', readonly: 'Salt okunur', error: 'Kaydedilemedi' };
function paintStatus() { const e = document.getElementById('ps-chip'); if (e) e.textContent = PS_TXT[PS.state] || ''; }
function pSched() { if (!PS.db || !PS.loaded || !PS.canWrite) return; clearTimeout(PS.timer); PS.timer = setTimeout(pFlush, 900); }
async function pFlush() {
  if (PS.busy) { pSched(); return; }
  const s = pSnap(); if (s === PS.last) return;
  PS.busy = true; PS.state = 'saving'; paintStatus();
  try { await PS.db.doc('kais/state').set({ s, at: Date.now() }); PS.last = s; PS.state = 'saved'; }
  catch (e) { PS.state = e && e.code === 'invalid_argument' ? 'readonly' : 'error'; if (PS.state === 'readonly') PS.canWrite = false; }
  PS.busy = false; paintStatus();
  if (PS.state === 'saved' && pSnap() !== PS.last) pSched();
}
const renderV7 = render;
render = function () {
  renderV7();
  if (PS.remote && !S.modal && !PS.busy) { const s = PS.remote; PS.remote = null; if (pApply(s)) { PS.last = pSnap(); renderV7(); } }
  pSched(); paintStatus();
};
function pInit() {
  if (typeof claude === 'undefined' || !claude || !claude.use) return;
  (async () => {
    try {
      const db = await claude.use('db'); if (!db) return;
      let us = null; try { us = await claude.use('user'); } catch (e) { us = null; }
      if (PS.cloudOn) { PS.localDb = db; return; } PS.db = db; PS.state = 'saving'; paintStatus();
      if (us && us.can && us.can('data.write') === false) PS.canWrite = false;
      const tm = setTimeout(() => { if (!PS.loaded) { PS.state = 'error'; paintStatus(); } }, 10000);
      db.doc('kais/state').onSnapshot((snap) => {
        clearTimeout(tm);
        if (!snap.exists) { if (snap.metadata && snap.metadata.fromCache) return; if (!PS.loaded) { PS.loaded = true; PS.state = PS.canWrite ? 'saving' : 'readonly'; pSched(); } return; }
        const s = snap.data().s;
        if (!PS.loaded) { PS.loaded = true; if (pApply(s)) PS.last = pSnap(); PS.state = PS.canWrite ? 'saved' : 'readonly'; render(); return; }
        if (s !== PS.last) { PS.remote = s; if (!S.modal) render(); }
      }, () => { PS.state = 'error'; paintStatus(); });
    } catch (e) { PS.state = 'error'; paintStatus(); }
  })();
}
const shellHTMLV7 = shellHTML;
shellHTML = function () { return shellHTMLV7().replace('<span class="biz">' + esc(BIZ) + '</span>', '<span class="biz">' + esc(BIZ) + '</span><span class="pill p-mute" id="ps-chip" style="font-size:11px">' + (PS_TXT[PS.state] || '') + '</span>'); };

/* ---- giriş: şifre ---- */
async function sha(s) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return 'x' + s; } }
const pwHash = (uid, pw) => sha(AUTH.salt + ':' + uid + ':' + pw);
onSubmit = function (e) {
  if (e.target.id !== 'login') return;
  e.preventDefault();
  const em = document.getElementById('em').value.trim().toLowerCase(); const pw = document.getElementById('pw').value;
  const u = USERS.find((x) => x.email === em);
  (async () => {
    let ok = false;
    if (u) { const h = AUTH.h[u.id]; ok = h ? (await pwHash(u.id, pw)) === h : (pw === 'demo1234' && AUTH.demo !== false); }
    if (!ok) { S.loginErr = 'E-posta ya da şifre hatalı.' + (AUTH.demo !== false ? ' Aşağıdaki demo hesaplardan birini seçebilirsin.' : ''); document.getElementById('lerr').textContent = S.loginErr; return; }
    loginAs(u);
    if (AUTH.must[u.id]) { S.modal = { type: 'pw', force: true }; renderModal(); }
  })();
};
const loginHTMLV7 = loginHTML;
loginHTML = function () { const h = loginHTMLV7(); return AUTH.demo === false ? h.replace(/<div class="demo">[\s\S]*?<\/div>/, '').replace('Demo hesapları (şifre: demo1234)', 'Demo girişleri kapalı') : h; };
const _demo = H.demo;
H.demo = (el) => { if (AUTH.demo === false) { toast('Demo girişleri kapalı.', 'warn'); return; } _demo(el); };
H.pwopen = () => { S.modal = { type: 'pw', force: false }; renderModal(); };
H.pwsave = async () => {
  const g = (id) => document.getElementById(id); const m = S.modal; const u = S.user; const err = (t) => { g('pw-err').textContent = t; };
  const a = g('pw-new').value; const b = g('pw-new2').value;
  if (!m.force) { const cur = AUTH.h[u.id] ? (await pwHash(u.id, g('pw-old').value)) === AUTH.h[u.id] : g('pw-old').value === 'demo1234'; if (!cur) return err('Şu anki şifre yanlış.'); }
  if (a.length < 8) return err('Yeni şifre en az 8 karakter olmalı.');
  if (a === 'demo1234') return err('Demo şifresini yeni şifre yapamazsın.');
  if (a !== b) return err('İki şifre aynı değil.');
  AUTH.h[u.id] = await pwHash(u.id, a); delete AUTH.must[u.id];
  S.modal = null; render(); toast('Şifren değişti.', 'ok');
};
H.pwreset = async (el) => {
  const id = el.dataset.id; const tmp = 'gecici-' + String(Math.floor(1000 + Math.random() * 9000));
  AUTH.h[id] = await pwHash(id, tmp); AUTH.must[id] = true;
  S.modal = { type: 'pwtemp', id, tmp }; render();
};
H.demotoggle = () => {
  if (AUTH.demo !== false) { if (!AUTH.h[S.user.id]) { toast('Önce kendi şifreni değiştir, sonra demo girişlerini kapat.', 'warn'); return; } AUTH.demo = false; toast('Demo girişleri kapandı. Şifresi olmayan hesaplar giremez.', 'warn'); } else { AUTH.demo = true; toast('Demo girişleri açıldı.'); }
  render();
};
const viewAyarlarV7 = viewAyarlar;
viewAyarlar = function () {
  const card = `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Hesap güvenliği</h3><p class="muted small" style="margin-top:2px">Şifreler karıştırılarak saklanır. Sıfırlanan şifreyi çalışan ilk girişte değiştirir.</p></div>
  ${USERS.map((u) => `<div class="emp">${avatar(u, 36)}<div class="grow"><b style="font-weight:600">${esc(u.name)}</b><div class="small muted">${AUTH.h[u.id] ? 'Kendi şifresi var' : 'Demo şifresi'}${AUTH.must[u.id] ? ' · ilk girişte değiştirecek' : ''}</div></div><button class="btn sec sm" data-a="pwreset" data-id="${u.id}">Sıfırla</button></div>`).join('')}
  <div style="padding:12px 16px"><button class="btn sec" data-a="demotoggle">${AUTH.demo === false ? 'Demo girişlerini aç' : 'Demo girişlerini kapat'}</button><p class="small muted" style="margin-top:8px">Bu prototipte şifre denetimi sayfanın içinde yapılır. Gerçek bir sunucu kimlik doğrulamasının yerini tutmaz.</p></div></div>`;
  return viewAyarlarV7();
};

/* ---- giriş kodu ve giriş-çıkış kaydı ---- */
function codeFor(slot) { let h = 2166136261; const s = AUTH.secret + ':' + slot; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return String(100000 + (h % 900000)); }
const curSlot = () => Math.floor(Date.now() / 60000);
const shopCode = () => codeFor(curSlot());
const codeOk = (c) => { const s = curSlot(); return /^\d{6}$/.test(String(c).trim()) && [s, s - 1].some((x) => codeFor(x) === String(c).trim()); };
let codeCard = () => `<div class="card stack"><div><h3>Giriş kodu</h3><p class="muted small" style="margin-top:2px">Çalışan işe başlarken bu kodu girer. Kod her dakika değişir, dükkândan uzakta kullanılamaz.</p></div><div class="num" id="shop-code" style="font-size:40px;font-weight:700;letter-spacing:.14em;text-align:center">${shopCode()}</div><button type="button" class="btn sec sm" style="align-self:center" data-a="codecopy">Kodu kopyala</button><p class="small muted" style="text-align:center">Yenilenmesine <span id="code-left">${60 - new Date().getSeconds()}</span> sn</p></div>`;
const bugunPatronV7 = bugunPatron; bugunPatron = function () { return bugunPatronV7().replace(/<\/div>\s*$/, codeCard() + '</div>'); };
const bugunMudurV7 = bugunMudur; bugunMudur = function () { return bugunMudurV7().replace(/<\/div>\s*$/, codeCard() + '</div>'); };
const tickV7 = tick;
tick = function () { tickV7(); const e = document.getElementById('shop-code'); if (e) { e.textContent = shopCode(); const l = document.getElementById('code-left'); if (l) l.textContent = 60 - new Date().getSeconds(); } };
const _ci = H.clockin;
H.clockin = () => { if (S.settings.codeIn === false) { _ci(); clkIn(S.user.id); return; } S.modal = { type: 'code' }; renderModal(); };
H.codego = () => {
  const v = (document.getElementById('cd-in') || {}).value || '';
  if (!codeOk(v)) { document.getElementById('cd-err').textContent = 'Kod yanlış ya da süresi geçmiş. Dükkândaki ekranda görünen güncel kodu gir.'; return; }
  S.modal = null; _ci(); clkIn(S.user.id);
};
const weekdayIdx = (iso) => { const d = new Date(iso + 'T00:00:00Z').getUTCDay(); return d === 0 ? -1 : d - 1; };
function clkIn(uid) { CLOCK.unshift({ id: 'ck' + (++seq), uid, date: REF_ISO, in: ATT[uid].inAt, out: '', brk: 0, hrs: 0, via: 'kod' }); if (CLOCK.length > 300) CLOCK.length = 300; }
function clkOut(uid) {
  const a = ATT[uid]; const now = hhmm(new Date()); const mins = (t) => { const p = String(t).split(':').map(Number); return p[0] * 60 + p[1]; };
  const hrs = Math.round(Math.max(0, mins(now) - mins(a.inAt || now) - a.breakMin) / 15) / 4;
  const rec = CLOCK.find((c) => c.uid === uid && !c.out && c.date === REF_ISO); if (rec) { rec.out = now; rec.brk = a.breakMin; rec.hrs = hrs; }
  const wd = weekdayIdx(REF_ISO); if (wd >= 0 && HOURS[uid] && HOURS[uid][1]) HOURS[uid][1][wd] = hrs;
}
const _co = H.clockout;
H.clockout = () => { const uid = S.user.id; _co(); clkOut(uid); render(); };
const empDetailV7 = empDetail;
empDetail = function (uid, mine, ro) {
  const rows = CLOCK.filter((c) => c.uid === uid).slice(0, 5);
  const card = `<div class="card stack"><div><h3>Giriş-çıkış kayıtları</h3><p class="muted small" style="margin-top:2px">Puantaj ve mesai, çıkış yapılınca bu kayıttan hesaplanır.</p></div>${rows.length ? rows.map((c) => `<div class="logline"><span>${esc(isoShort(c.date))} · ${esc(c.in)} – ${esc(c.out || 'devam ediyor')}<span class="small muted" style="display:block">Mola ${c.brk} dk${c.via === 'kod' ? ' · kodla girdi' : c.via === 'konum' ? ' · konumla girdi' : ''}</span></span><b class="num">${c.out ? c.hrs + ' sa' : '—'}</b></div>`).join('') : '<p class="muted small">Henüz kayıt yok. Çalışan giriş kodunu girince burada görünür.</p>'}</div>`;
  return empDetailV7(uid, mine, ro).replace(/<\/div>\s*$/, card + '</div>');
};

/* ---- satış dosyası ---- */
function trNum(s) { s = String(s == null ? '' : s).replace(/[₺\s]|tl/gi, ''); if (!s) return NaN; if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.'); else if (s.includes(',')) s = s.replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); const n = Number(s); return isFinite(n) ? n : NaN; }
function parseDate(s) {
  s = String(s || '').trim(); let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); let y; let mo; let d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else { m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/); if (!m) return ''; d = +m[1]; mo = +m[2]; y = +m[3]; }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
function parseSales(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean); const out = { rows: [], errors: [] };
  if (!lines.length) return out;
  const del = [';', '\t', ','].find((d) => lines[0].includes(d)) || ';'; let cols = { d: 0, p: 1, q: 2, t: 3 }; let start = 0;
  const h = lines[0].split(del).map((x) => x.trim().toLocaleLowerCase('tr-TR'));
  if (h.some((x) => /tarih|date|ürün|urun|adet|tutar/.test(x))) {
    start = 1; const f = (re) => h.findIndex((x) => re.test(x));
    const c = { d: f(/tarih|date/), p: f(/ürün|urun|product/), q: f(/adet|miktar|qty/), t: f(/tutar|toplam|total|ciro/) };
    if (c.d >= 0 && c.p >= 0 && c.q >= 0 && c.t >= 0) cols = c; else out.errors.push('Başlıktaki sütunlar anlaşılamadı. Sıra Tarih;Ürün;Adet;Tutar varsayıldı.');
  }
  for (let i = start; i < lines.length; i++) {
    const x = lines[i].split(del).map((s) => s.trim().replace(/^"|"$/g, '')); const date = parseDate(x[cols.d]); const prod = x[cols.p]; const qty = trNum(x[cols.q]); const total = trNum(x[cols.t]);
    if (!date || !prod || !(qty > 0) || !(total >= 0)) { out.errors.push('Satır ' + (i + 1) + ' okunamadı: ' + lines[i].slice(0, 40)); continue; }
    out.rows.push({ date, prod, qty, total });
  }
  return out;
}
const saleKey = (r) => r.date + '|' + prodKey(r.prod) + '|' + r.qty + '|' + r.total;
function importSales(rows, name) {
  const keys = new Set(SALES.map(saleKey)); const id = 'im' + (++seq); let add = 0; let dup = 0; let tot = 0; const unknown = new Set(); const cons = {};
  rows.forEach((r) => {
    const k = saleKey(r); if (keys.has(k)) { dup++; return; } keys.add(k);
    SALES.push({ id: 'sl' + (++seq), imp: id, date: r.date, prod: r.prod, qty: r.qty, total: r.total }); add++; tot += r.total;
    const rc = RECIPES[prodKey(r.prod)]; if (!rc) { unknown.add(r.prod); return; }
    Object.entries(rc.items).forEach(([sid, q]) => { const st = STOCK.find((x) => x.id === sid); if (!st) return; const use = Math.min(st.qty, q * r.qty); st.qty = r3(st.qty - use); cons[sid] = r3((cons[sid] || 0) + use); });
  });
  const imp = { id, name: name || 'yapıştırılan veri', n: add, dup, total: tot, unknown: [...unknown], cons, led: false };
  if (add) { SALEIMP.unshift(imp); auditAdd({ type: 'imp', text: 'Adisyon dosyası içe aktarıldı: ' + add + ' satır, ' + fmt(tot) }); }
  return imp;
}
function rcCost(rc) { return Object.entries(rc.items).reduce((a, [sid, q]) => { const st = STOCK.find((x) => x.id === sid); return a + (st ? st.cost || 0 : 0) * q; }, 0); }
function salesStats() {
  const by = {};
  SALES.forEach((s) => { const k = prodKey(s.prod); const rc = RECIPES[k]; const rate = rc ? rc.rate : 10; const o = by[k] || (by[k] = { name: s.prod, qty: 0, total: 0, net: 0, cost: 0, rc: !!rc }); o.qty += s.qty; o.total += s.total; o.net += s.total / (1 + rate / 100); if (rc) o.cost += rcCost(rc) * s.qty; });
  const list = Object.values(by).sort((a, b) => b.net - a.net);
  const t = list.reduce((a, o) => ({ total: a.total + o.total, cost: a.cost + (o.rc ? o.cost : 0), netKnown: a.netKnown + (o.rc ? o.net : 0) }), { total: 0, cost: 0, netKnown: 0 });
  return { list, t, kar: t.netKnown - t.cost };
}
const SAMPLE_CSV = () => ['Tarih;Ürün;Adet;Tutar', ...[['Latte', 62, 95], ['Filtre kahve', 48, 70], ['Simit', 120, 25], ['Poğaça', 70, 40], ['Cheesecake', 18, 130], ['Limonata', 22, 85]].map((p) => '14.11.2026;' + p[0] + ';' + p[1] + ';' + String(p[1] * p[2]).replace('.', ',') + ',00')].join('\n');
S.saleText = ''; S.saleName = ''; S.salePrev = null;
function previewOf(text, name) {
  const p = parseSales(text); const keys = new Set(SALES.map(saleKey)); const dup = p.rows.filter((r) => keys.has(saleKey(r))).length;
  const unk = [...new Set(p.rows.filter((r) => !RECIPES[prodKey(r.prod)]).map((r) => r.prod))];
  return { rows: p.rows, errors: p.errors, dup, unk, name: name || 'yapıştırılan veri', total: p.rows.reduce((a, r) => a + r.total, 0) };
}
function viewSatis() {
  const st = salesStats(); const pv = S.salePrev;
  const rcList = Object.values(RECIPES);
  return `<div class="stack-lg">
  <div><h2>Satışlar ve maliyet</h2><p class="muted small" style="margin-top:4px">Adisyon programından aldığın satış dosyasını yükle. Gelir tablosu, stok ve ürün kârlılığı buradan beslenir.</p></div>
  <div class="kpis">${kpi('Ciro (KDV dahil)', fmt0(st.t.total))}${kpi('Maliyet', fmt0(st.t.cost))}${kpi('Brüt kâr', fmt0(st.kar))}</div>
  <div class="card stack"><div><h3>Satış dosyası yükle</h3><p class="muted small" style="margin-top:2px">Sütunlar: Tarih; Ürün; Adet; Tutar. Tutar KDV dahil satır toplamıdır. Excel'den CSV olarak kaydet.</p></div>
  <div class="field"><label for="sale-file">Dosya (.csv ya da .xlsx)</label><input id="sale-file" type="file" accept=".csv,.txt,.xlsx,text/csv" data-ch="salefile"></div>
  <div class="field"><label for="sale-text">Ya da buraya yapıştır</label><textarea id="sale-text" style="min-height:110px" placeholder="Tarih;Ürün;Adet;Tutar">${esc(S.saleText)}</textarea></div>
  <div class="row wrap"><button class="btn grow" data-a="saleprev">Önizle</button><button class="btn sec" data-a="salesample">Örnek doldur</button></div>
  ${pv ? `<div class="callout ${pv.rows.length ? 'info' : 'warn'}">${ic(pv.rows.length ? 'info' : 'alert')}<div><b>${pv.rows.length} satır okundu, ${fmt0(pv.total)}</b>${pv.dup ? `<p style="margin-top:2px">${pv.dup} satır daha önce yüklenmiş, atlanacak.</p>` : ''}${pv.unk.length ? `<p style="margin-top:2px">Reçetesi olmayan ürün: ${esc(pv.unk.join(', '))}. Bunlar için maliyet hesaplanmaz, stok düşmez.</p>` : ''}${pv.errors.slice(0, 4).map((e) => `<p style="margin-top:2px">${esc(e)}</p>`).join('')}</div></div>
  <button class="btn" data-a="saleimport" ${pv.rows.length - pv.dup > 0 ? '' : 'disabled'}>İçe aktar</button>` : ''}</div>
  ${SALEIMP.length ? `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Yüklenen dosyalar</h3></div>${SALEIMP.map((i) => `<div class="rrow"><div><b style="font-weight:600">${esc(i.name)}</b><div class="small muted">${i.n} satır · ${fmt0(i.total)}${i.unknown.length ? ' · ' + i.unknown.length + ' ürünün reçetesi yok' : ''}</div></div><div class="rfoot">${i.led ? '<span class="pill p-ok">Gelir tablosunda</span>' : `<button class="btn sm" data-a="saleled" data-id="${i.id}">Gelir tablosuna yaz</button>`}<button class="btn sm sec" data-a="saledel" data-id="${i.id}">Geri al</button></div></div>`).join('')}
  <p class="small muted" style="padding:10px 16px">Gelir tablosuna yazarken ekstredeki POS ödemeleriyle aynı günü iki kez saymadığından emin ol. Muhasebeci kontrol eder.</p></div>` : ''}
  <div class="card flush"><div style="padding:16px 16px 6px"><h3>Ürün kârlılığı</h3><p class="muted small" style="margin-top:2px">KDV hariç ciro eksi reçeteden gelen maliyet. KDV oranı ürünün reçetesindeki orandır.</p></div>
  ${st.list.length ? st.list.map((o) => `<div class="logline" style="padding:12px 16px"><span><b style="font-weight:600">${esc(o.name)}</b><span class="small muted" style="display:block">${o.qty} adet · ciro ${fmt0(o.net)}${o.rc ? ' · maliyet ' + fmt0(o.cost) : ''}</span></span>${o.rc ? `<span class="pill ${(o.net - o.cost) / o.net < 0.4 ? 'p-warn' : 'p-ok'}">%${Math.round(((o.net - o.cost) / o.net) * 100)} marj</span>` : '<span class="pill p-mute">Reçete yok</span>'}</div>`).join('') : '<div class="empty">Henüz satış yüklenmedi.</div>'}</div>
  <div class="card flush"><div style="padding:16px 16px 6px" class="row between wrap"><div><h3>Reçeteler</h3><p class="muted small" style="margin-top:2px">Satış yüklenince malzemeler stoktan düşer.</p></div><button class="btn sm" data-a="rcpnew">${ic('plus', 16)} Yeni reçete</button></div>
  ${rcList.map((rc) => { const c = rcCost(rc); return `<button class="emp go" data-a="rcpedit" data-k="${esc(prodKey(rc.name))}"><div class="grow"><b style="font-weight:600">${esc(rc.name)}</b><div class="small muted">${Object.keys(rc.items).length} malzeme · birim maliyet ${fmt(c)} · KDV %${rc.rate}</div></div>${ic('chevron', 18)}</button>`; }).join('')}</div>
  <div class="card flush"><div style="padding:16px 16px 6px"><h3>Stok birim maliyeti</h3><p class="muted small" style="margin-top:2px">Reçete maliyeti bu fiyatlarla hesaplanır. Alış fişi geldikçe güncelle.</p></div>
  ${STOCK.map((s) => `<div class="logline" style="padding:10px 16px"><span>${esc(s.name)}<span class="small muted" style="display:block">1 ${esc(s.unit)} için</span></span><input class="num" style="width:96px;text-align:right" type="number" min="0" step="0.01" value="${s.cost || 0}" data-ch="scost" data-id="${s.id}" aria-label="${esc(s.name)} birim maliyeti"></div>`).join('')}</div>
  </div>`;
}
H.saleprev = () => { S.saleText = (document.getElementById('sale-text') || {}).value || ''; S.salePrev = S.saleText.trim() ? previewOf(S.saleText, S.saleName) : null; if (!S.salePrev) toast('Önce dosya yükle ya da veriyi yapıştır.', 'warn'); render(); };
H.salesample = () => { S.saleText = SAMPLE_CSV(); S.saleName = 'ornek-satis.csv'; S.salePrev = previewOf(S.saleText, S.saleName); render(); };
H.saleimport = () => {
  if (!S.salePrev || !S.salePrev.rows.length) return; const imp = importSales(S.salePrev.rows, S.salePrev.name);
  S.saleText = ''; S.saleName = ''; S.salePrev = null; render(); toast(imp.n + ' satır eklendi' + (imp.dup ? ', ' + imp.dup + ' tekrar atlandı' : '') + '. Stok güncellendi.', 'ok');
};
H.saledel = (el) => {
  const id = el.dataset.id; const imp = SALEIMP.find((x) => x.id === id); if (!imp) return;
  Object.entries(imp.cons || {}).forEach(([sid, q]) => { const st = STOCK.find((x) => x.id === sid); if (st) st.qty = r3(st.qty + q); });
  for (let i = SALES.length - 1; i >= 0; i--) if (SALES[i].imp === id) SALES.splice(i, 1);
  for (let i = LEDGER.length - 1; i >= 0; i--) if (LEDGER[i].imp === id) LEDGER.splice(i, 1);
  SALEIMP.splice(SALEIMP.indexOf(imp), 1); auditAdd({ type: 'imp', text: 'Satış dosyası geri alındı: ' + imp.name }); render(); toast('Dosya geri alındı, stok eski haline döndü.');
};
H.saleled = (el) => {
  const id = el.dataset.id; const imp = SALEIMP.find((x) => x.id === id); if (!imp || imp.led) return; const g = {};
  SALES.filter((s) => s.imp === id).forEach((s) => { const rc = RECIPES[prodKey(s.prod)]; const rate = rc ? rc.rate : 10; const k = s.date + '|' + rate; g[k] = (g[k] || 0) + s.total; });
  Object.entries(g).sort().forEach(([k, total]) => { const [date, rate] = k.split('|'); LEDGER.push({ id: 'g' + (++seq), dir: 'gelir', date: isoShort(date), desc: 'Günlük satış, ' + imp.name, acc: 'Satış (POS)', doc: 'Adisyon', rate: Number(rate), total: Math.round(total * 100) / 100, src: 'Satış', imp: id, fresh: true }); });
  imp.led = true; auditAdd({ type: 'imp', text: 'Satışlar gelir tablosuna yazıldı: ' + imp.name }); render(); toast('Gelir tablosuna yazıldı.', 'ok');
};
const _och = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'salefile') {
    const f = el.files && el.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => { S.saleText = String(rd.result || ''); S.saleName = f.name; S.salePrev = previewOf(S.saleText, f.name); render(); };
    rd.onerror = () => toast('Dosya okunamadı.', 'warn'); rd.readAsText(f); return;
  }
  if (ch === 'scost') { const st = STOCK.find((x) => x.id === el.dataset.id); if (st) { st.cost = Math.max(0, Number(el.value) || 0); toast('Birim maliyet güncellendi.'); } return; }
  return _och(e);
};
H.rcpnew = () => { S.modal = { type: 'rcp', k: '', name: '', rate: 10, items: {} }; renderModal(); };
H.rcpedit = (el) => { const rc = RECIPES[el.dataset.k]; if (!rc) return; S.modal = { type: 'rcp', k: el.dataset.k, name: rc.name, rate: rc.rate, items: Object.assign({}, rc.items) }; renderModal(); };
H.rcpsave = () => {
  const g = (id) => document.getElementById(id); const m = S.modal; const name = (g('rc-name').value || '').trim();
  if (!name) { g('rc-err').textContent = 'Ürün adını yaz.'; return; }
  const items = {}; STOCK.forEach((s) => { const v = Number(String(g('rc-' + s.id).value).replace(',', '.')); if (v > 0) items[s.id] = v; });
  if (!Object.keys(items).length) { g('rc-err').textContent = 'En az bir malzeme yaz.'; return; }
  const key = prodKey(name); if (m.k && m.k !== key) delete RECIPES[m.k];
  RECIPES[key] = { name, rate: Number(g('rc-rate').value) || 10, items };
  S.modal = null; render(); toast('Reçete kaydedildi.', 'ok');
};
H.rcpdel = () => { delete RECIPES[S.modal.k]; S.modal = null; render(); toast('Reçete silindi.'); };

/* ---- e-belge hazırlığı ---- */

function ebChecks() {
  const unk = [...new Set(SALES.filter((s) => !RECIPES[prodKey(s.prod)]).map((s) => s.prod))];
  return [
    ['Ünvan ve vergi kimlik no', /^\d{10}$/.test(EDOC.vkn) && !!EDOC.unvan, /^\d{10}$/.test(EDOC.vkn) ? (vknOk(EDOC.vkn) ? 'Girildi' : 'Kontrol basamağı tutmuyor, numarayı kontrol et') : '10 haneli numara yaz'],
    ['Vergi dairesi, adres ve e-posta', !!(EDOC.vd && EDOC.adres && EDOC.eposta), 'Faturada görünür'],
    ['e-Fatura / e-Arşiv mükellefiyeti', EDOC.muk !== 'bilmiyorum', EDOC.muk === 'bilmiyorum' ? 'Muhasebeciye ya da GİB sorgusundan öğren' : EDOC.muk === 'evet' ? 'Mükellef' : 'Mükellef değil'],
    ['Entegratör seçildi', !!EDOC.ent, EDOC.ent || 'Seçilmedi'],
    ['Satış verisi yüklü', SALES.length > 0, SALES.length ? SALES.length + ' satır' : 'Satışlar sayfasından yükle'],
    ['Ürünlerin KDV oranı belli', SALES.length > 0 && !unk.length, unk.length ? unk.length + ' ürünün reçetesi yok, %10 varsayıldı' : 'Reçetelerden alınır'],
  ];
}
const EB_ENT = ['', 'Paraşüt', 'Logo İşbaşı', 'Başka bir entegratör'];
function viewEBelge() {
  const cs = ebChecks(); const ok = cs.filter((c) => c[1]).length;
  return `<div class="stack-lg">
  <div><h2>e-Belge hazırlığı</h2><p class="muted small" style="margin-top:4px">Fatura ve e-Adisyon için gereken bilgileri toplar, hazır veriyi dosya olarak verir.</p></div>
  <div class="callout warn">${ic('alert')}<div><b>Kais fatura kesmez, GİB'e göndermez</b><p style="margin-top:2px">Bunun için bir e-belge entegratörüne bağlanmak gerekir. Şu an bağlantı yok. Buradaki hazırlık, entegratöre geçişi kolaylaştırır.</p></div></div>
  <div class="card stack"><div class="row between"><h3>Hazırlık durumu</h3><span class="pill ${ok === cs.length ? 'p-ok' : 'p-warn'}">${ok} / ${cs.length}</span></div>
  ${cs.map((c) => `<div class="logline"><span>${esc(c[0])}<span class="small muted" style="display:block">${esc(c[2])}</span></span><span class="pill ${c[1] ? 'p-ok' : 'p-mute'}">${c[1] ? 'Tamam' : 'Eksik'}</span></div>`).join('')}
  <div class="logline"><span>Entegratör bağlantısı<span class="small muted" style="display:block">Fatura gönderimi için gerekli</span></span><span class="pill p-bad">Bağlı değil</span></div></div>
  ${EDOC.muk === 'evet' ? `<div class="callout">${ic('info')}<div>e-Fatura mükellefi olan lokanta ve kafelerde e-Adisyon da gündeme gelir. Adisyon programının e-Adisyon desteğini sor, kuralı muhasebeciyle teyit et.</div></div>` : ''}
  <div class="card stack"><h3>İşletme bilgileri</h3>
  <div class="field"><label for="eb-unvan">Ünvan</label><input type="text" id="eb-unvan" value="${esc(EDOC.unvan)}"></div>
  <div class="field"><label for="eb-vkn">Vergi kimlik no</label><input type="text" id="eb-vkn" inputmode="numeric" maxlength="10" value="${esc(EDOC.vkn)}"></div>
  <div class="field"><label for="eb-vd">Vergi dairesi</label><input type="text" id="eb-vd" value="${esc(EDOC.vd)}"></div>
  <div class="field"><label for="eb-adres">Adres</label><input type="text" id="eb-adres" value="${esc(EDOC.adres)}"></div>
  <div class="field"><label for="eb-eposta">Fatura e-postası</label><input id="eb-eposta" type="email" value="${esc(EDOC.eposta)}"></div>
  <div class="field"><label for="eb-muk">e-Fatura mükellefi misin?</label><select id="eb-muk"><option value="bilmiyorum" ${EDOC.muk === 'bilmiyorum' ? 'selected' : ''}>Bilmiyorum</option><option value="evet" ${EDOC.muk === 'evet' ? 'selected' : ''}>Evet</option><option value="hayir" ${EDOC.muk === 'hayir' ? 'selected' : ''}>Hayır</option></select></div>
  <div class="field"><label for="eb-ent">Entegratör</label><select id="eb-ent">${EB_ENT.map((x) => `<option value="${esc(x)}" ${EDOC.ent === x ? 'selected' : ''}>${esc(x || 'Seçilmedi')}</option>`).join('')}</select></div>
  <div class="err" id="eb-err" role="alert"></div><button class="btn" data-a="ebsave">Kaydet</button></div>
  <div class="card stack"><div><h3>Hazırlık dosyası</h3><p class="muted small" style="margin-top:2px">Excel dosyasına "e-Belge bilgi" ve "e-Belge taslağı" sayfaları eklenir. Entegratörün toplu fatura şablonuna taşınır.</p></div>${xlsxBtn() || '<p class="small muted">Excel indirme bu ekranda kullanılamıyor.</p>'}</div>
  </div>`;
}
H.ebsave = () => {
  const g = (id) => (document.getElementById(id) || {}).value || '';
  const vkn = g('eb-vkn').replace(/\s/g, '');
  if (vkn && !/^\d{10}$/.test(vkn)) { document.getElementById('eb-err').textContent = 'Vergi kimlik no 10 haneli olmalı.'; return; }
  Object.assign(EDOC, { unvan: g('eb-unvan').trim(), vkn, vd: g('eb-vd').trim(), adres: g('eb-adres').trim(), eposta: g('eb-eposta').trim(), muk: g('eb-muk') || 'bilmiyorum', ent: g('eb-ent') });
  render(); toast('Bilgiler kaydedildi.', 'ok');
};
function eSheets() {
  const out = [];
  const st = salesStats();
  out.push(['Satış ve maliyet', [['Ürün', 'Adet', 'Ciro (KDV dahil)', 'Ciro (KDV hariç)', 'Maliyet', 'Kâr', 'Marj %']].concat(st.list.map((o) => [o.name, o.qty, { n: r2(o.total) }, { n: r2(o.net) }, o.rc ? { n: r2(o.cost) } : 'Reçete yok', o.rc ? { n: r2(o.net - o.cost) } : '', o.rc ? Math.round(((o.net - o.cost) / o.net) * 100) : ''])), [24, 8, 16, 16, 12, 12, 8]]);
  out.push(['e-Belge bilgi', [['Alan', 'Değer'], ['Ünvan', EDOC.unvan], ['Vergi kimlik no', EDOC.vkn], ['Vergi dairesi', EDOC.vd], ['Adres', EDOC.adres], ['E-posta', EDOC.eposta], ['e-Fatura mükellefi', EDOC.muk], ['Entegratör', EDOC.ent || 'Seçilmedi']], [22, 40]]);
  out.push(['e-Belge taslağı', [['Tarih', 'Ürün', 'Adet', 'Birim fiyat (KDV hariç)', 'KDV %', 'KDV tutarı', 'Toplam (KDV dahil)']].concat(SALES.map((s) => { const rc = RECIPES[prodKey(s.prod)]; const rate = rc ? rc.rate : 10; const net = s.total / (1 + rate / 100); return [s.date, s.prod, s.qty, { n: r2(net / s.qty) }, rate, { n: r2(s.total - net) }, { n: r2(s.total) }]; })), [12, 24, 8, 20, 8, 14, 18]]);
  return out;
}

/* ---- pencereler ---- */
const NEWM = {
  code: () => sheet('Giriş kodu', `<p class="muted">Dükkândaki ekranda (patron ya da müdür "Bugün" sayfası) görünen 6 haneli kodu gir.</p><div class="field"><label for="cd-in">Kod</label><input type="text" id="cd-in" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></div><div class="err" id="cd-err" role="alert"></div><button class="btn block" data-a="codego">Girişi kaydet</button>`),
  pw: (m) => sheet(m.force ? 'Yeni şifre belirle' : 'Şifreni değiştir', `${m.force ? '<p class="muted">Şifren sıfırlandı. Devam etmeden önce kendi şifreni belirle.</p>' : '<div class="field"><label for="pw-old">Şu anki şifre</label><input id="pw-old" type="password" autocomplete="current-password"></div>'}<div class="field"><label for="pw-new">Yeni şifre (en az 8 karakter)</label><input id="pw-new" type="password" autocomplete="new-password"></div><div class="field"><label for="pw-new2">Yeni şifre, tekrar</label><input id="pw-new2" type="password" autocomplete="new-password"></div><div class="err" id="pw-err" role="alert"></div><button class="btn block" data-a="pwsave">Şifreyi kaydet</button>`),
  pwtemp: (m) => sheet('Geçici şifre', `<p class="muted">${esc(byId(m.id).name)} için geçici şifre aşağıda. Bir kez gösterilir. Kişi ilk girişte kendi şifresini belirler.</p><div class="num" style="font-size:26px;font-weight:700;text-align:center;padding:14px">${esc(m.tmp)}</div>`),
  rcp: (m) => sheet(m.k ? 'Reçeteyi düzenle' : 'Yeni reçete', `<div class="field"><label for="rc-name">Ürün adı (satış dosyasındaki gibi)</label><input type="text" id="rc-name" value="${esc(m.name)}"></div>
  <div class="field"><label for="rc-rate">KDV oranı</label><select id="rc-rate">${[1, 10, 20].map((r) => `<option value="${r}" ${m.rate === r ? 'selected' : ''}>%${r}</option>`).join('')}</select></div>
  <p class="lbl">1 ürün için kullanılan malzeme (stok biriminden)</p>
  ${STOCK.map((s) => `<div class="field"><label for="rc-${s.id}">${esc(s.name)} (${esc(s.unit)})</label><input type="text" id="rc-${s.id}" inputmode="decimal" value="${m.items[s.id] || ''}" placeholder="0"></div>`).join('')}
  <div class="err" id="rc-err" role="alert"></div><div class="row wrap"><button class="btn grow" data-a="rcpsave">Kaydet</button>${m.k ? '<button class="btn sec" data-a="rcpdel">Sil</button>' : ''}</div>`),
};
const renderModalV7 = renderModal;
renderModal = function () {
  const m = S.modal; const root = $('#modal-root');
  if (m && NEWM[m.type] && root) { root.innerHTML = NEWM[m.type](m); return; }
  renderModalV7();
  if (m && m.type === 'menu' && root) root.innerHTML = root.innerHTML.replace('<button class="btn sec block" data-a="logout">', '<button class="btn sec block" data-a="pwopen">Şifreni değiştir</button><button class="btn sec block" data-a="logout">');
};

/* ---- gezinme ---- */
NAV.patron.push(['satis', 'Satışlar', 'trend', 'more'], ['ebelge', 'e-Belge', 'file', 'more']);
NAV.muhasebeci.push(['satis', 'Satışlar', 'trend', 'more'], ['ebelge', 'e-Belge', 'file', 'more']);
TITLES.satis = 'Satışlar'; TITLES.ebelge = 'e-Belge';
const viewHTMLV7 = viewHTML;
viewHTML = function () { const r = S.user.role; if (r === 'patron' || r === 'muhasebeci') { if (S.view === 'satis') return viewSatis(); if (S.view === 'ebelge') return viewEBelge(); } return viewHTMLV7(); };
pInit();

/* v9: KaisPilot adı, Satın alma */
let SUPPLIERS = [
  { id: 't1', name: 'Anadolu Un Sanayi', phone: '0532 000 00 01', lead: 3, minAmt: 0, items: { s1: 1450, s4: 215 } },
  { id: 't2', name: 'Çekirdek Kahve Toptan', phone: '0532 000 00 02', lead: 3, minAmt: 3000, items: { s3: 690, s5: 3.2 } },
  { id: 't3', name: 'Süt Dünyası', phone: '0532 000 00 03', lead: 1, minAmt: 800, items: { s2: 36 } },
  { id: 't4', name: 'Hızlı Toptan', phone: '0532 000 00 04', lead: 1, minAmt: 1000, items: { s1: 1520, s2: 39, s3: 710, s4: 225, s5: 3.4, s6: 1480, s7: 440 } },
];
let ORDERS = [];
const SUP0 = { s1: 't1', s2: 't3', s3: 't2', s4: 't1', s5: 't2', s6: 't4', s7: 't4' };
STOCK.forEach((s) => { if (s.sup === undefined) s.sup = SUP0[s.id] || null; });
if (S.settings.cover === undefined) S.settings.cover = 7;
P_ARR.push(['SUPPLIERS', () => SUPPLIERS], ['ORDERS', () => ORDERS]);

function addDays(iso, n) { const a = iso.split('-').map(Number); const d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + n)); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
const supById = (id) => SUPPLIERS.find((t) => t.id === id);
let offersOf = (sid) => SUPPLIERS.filter((t) => t.items[sid] > 0);
function useOf(st) {
  if (st.use > 0) return { v: st.use, src: 'elle', days: 0 };
  const days = new Set(SALES.map((s) => s.date)).size;
  if (!days) return { v: 0, src: 'yok', days: 0 };
  let tot = 0; SALES.forEach((s) => { const rc = RECIPES[prodKey(s.prod)]; if (rc && rc.items[st.id]) tot += rc.items[st.id] * s.qty; });
  return { v: tot / days, src: tot > 0 ? 'satış' : 'yok', days };
}
function stockPlan() {
  const cover = Number(S.settings.cover) || 7;
  return STOCK.map((st) => {
    const u = useOf(st); const daily = u.v; const left = daily > 0 ? st.qty / daily : Infinity;
    const offs = offersOf(st.id); const leadMin = offs.length ? Math.min(...offs.map((t) => t.lead)) : 2;
    let status = 'ok'; if (left <= leadMin + 1) status = 'now'; else if (left <= leadMin + 4) status = 'soon';
    if (daily <= 0 && st.qty <= st.min) status = 'soon';
    let pick = null; let qty = 0; let late = false;
    if (status !== 'ok' && offs.length) {
      const fast = offs.filter((t) => t.lead <= Math.max(1, Math.floor(left)));
      const pool = fast.length ? fast : offs.slice().sort((a, b) => a.lead - b.lead).slice(0, 1); late = !fast.length && left !== Infinity;
      pick = pool.slice().sort((a, b) => a.items[st.id] - b.items[st.id] || a.lead - b.lead || (sgKm(a) || 0) - (sgKm(b) || 0))[0];
      qty = daily > 0 ? Math.max(1, Math.ceil(daily * (cover + pick.lead) - st.qty)) : Math.max(1, Math.ceil(st.min * 2 - st.qty));
    }
    return { st, daily, left, src: u.src, days: u.days, status, pick, qty, late, price: pick ? pick.items[st.id] : 0, base: st.cost || 0 };
  });
}
function proposals() {
  const g = {};
  stockPlan().filter((p) => p.pick).forEach((p) => { const o = g[p.pick.id] || (g[p.pick.id] = { sup: p.pick, lines: [], total: 0, saving: 0 }); o.lines.push(p); o.total += p.qty * p.price; o.saving += Math.max(0, (p.base - p.price) * p.qty); });
  return Object.values(g).sort((a, b) => a.sup.lead - b.sup.lead);
}
function orderMsg(sup, lines) {
  return ['Merhaba, ' + BIZ + ' adına sipariş vermek istiyoruz:', ''].concat(lines.map((l) => '- ' + l.name + ': ' + l.qty + ' ' + l.unit)).concat(['', 'Teslimat ' + sup.lead + ' gün içinde mümkünse. Fiyat ve stok durumunu onaylar mısınız?']).join('\n');
}
const lineOf = (p) => ({ sid: p.st.id, name: p.st.name, unit: p.st.unit, qty: p.qty, price: p.price });
const ORD_ST = { gonderildi: ['p-info', 'Gönderildi'], teslim: ['p-ok', 'Teslim alındı'], iptal: ['p-mute', 'İptal'] };
const fq = (n) => (Math.round(n * 100) / 100).toLocaleString('tr-TR');
function viewSatinAlma() {
  const plan = stockPlan(); const props = proposals(); const cover = Number(S.settings.cover) || 7;
  const now = plan.filter((p) => p.status === 'now').length; const soon = plan.filter((p) => p.status === 'soon').length;
  const sav = props.reduce((a, p) => a + p.saving, 0);
  const noData = plan.every((p) => p.src === 'yok'); const days = Math.max(...plan.map((p) => p.days), 0);
  const pill = (p) => p.left === Infinity ? '<span class="pill p-mute">Tüketim yok</span>' : `<span class="pill ${p.status === 'now' ? 'p-bad' : p.status === 'soon' ? 'p-warn' : 'p-ok'}">~${p.left < 10 ? fq(Math.round(p.left * 10) / 10) : Math.round(p.left)} gün yeter</span>`;
  return `<div class="stack-lg">
  <div><h2>Satın alma</h2><p class="muted small" style="margin-top:4px">Stok, satış ve reçetelerden hesaplanır. Kais önerir, sipariş sende onaylanır.</p></div>
  <div class="kpis">${kpi('Şimdi sipariş', now)}${kpi('Yakında', soon)}${kpi('Olası tasarruf', fmt0(sav))}</div>
  ${noData ? `<div class="callout warn">${ic('alert')}<div><b>Tüketim hesabı için satış verisi yok</b><p style="margin-top:2px">Satışlar sayfasından günlük satış dosyası yükle ya da ürünlerin günlük tüketimini elle yaz.</p></div></div>` : days < 7 ? `<div class="callout">${ic('info')}<div>Tüketim ${days} günlük satıştan hesaplandı. En az bir haftalık veriyle tahmin güvenilir olur.</div></div>` : ''}
  <div class="field"><label for="cover">Stok kaç günlük tutulsun?</label><select id="cover" data-ch="cover">${[5, 7, 10, 14].map((d) => `<option value="${d}" ${cover === d ? 'selected' : ''}>${d} gün</option>`).join('')}</select></div>
  ${props.length ? `<div class="stack"><h3>Önerilen siparişler</h3>${props.map((o) => `<div class="card stack"><div class="row between wrap"><div><b style="font-weight:600">${esc(o.sup.name)}</b><div class="small muted">Teslim ${o.sup.lead} gün${o.sup.minAmt ? ' · en az ' + fmt0(o.sup.minAmt) : ''}${sgLine(o.sup)}</div></div><b class="num">${fmt0(o.total)}</b></div>
  <div>${o.lines.map((p) => `<div class="logline"><span>${esc(p.st.name)}<span class="small muted" style="display:block">${p.qty} ${esc(p.st.unit)}${p.packs ? ' (' + fq(p.packs) + ' ' + esc(p.packName) + ')' : ''} × ${fmt(p.price)}${p.base > p.price ? ' · eskisi ' + fmt(p.base) : p.base && p.base < p.price ? ' · eskisi ' + fmt(p.base) + ' (daha ucuzdu, ama geç gelir)' : ''}${p.late ? ' · stok bitmeden gelmeyebilir' : ''}</span></span>${pill(p)}</div>`).join('')}</div>
  ${o.total < o.sup.minAmt ? `<div class="callout warn">${ic('alert')}<div>Tutar minimum sipariş tutarının altında (${fmt0(o.sup.minAmt)}).</div></div>` : ''}
  ${o.saving > 0 ? `<p class="small muted">Son alış fiyatına göre yaklaşık ${fmt0(o.saving)} tasarruf.</p>` : ''}
  <div class="row wrap"><button class="btn grow" data-a="ordcreate" data-id="${o.sup.id}">Siparişi kaydet ve mesajı kopyala</button></div></div>`).join('')}</div>` : '<div class="callout">' + ic('check') + '<div>Şu an sipariş vermen gereken ürün yok.</div></div>'}
  <div class="card flush"><div style="padding:16px 16px 6px"><h3>Stok durumu</h3><p class="muted small" style="margin-top:2px">Günlük tüketimi elle yazarsan o kullanılır.</p></div>
  ${plan.slice().sort((a, b) => a.left - b.left).map((p) => `<div class="logline" style="padding:10px 16px"><span>${esc(p.st.name)}<span class="small muted" style="display:block">${fq(p.st.qty)} ${esc(p.st.unit)} · günde ${p.daily ? fq(p.daily) : '?'} (${p.src})</span></span><span class="row" style="gap:8px">${pill(p)}<input class="num" style="width:70px;text-align:right" type="number" min="0" step="0.01" placeholder="günlük" value="${p.st.use || ''}" data-ch="suse" data-id="${p.st.id}" aria-label="${esc(p.st.name)} günlük tüketim"></span></div>`).join('')}</div>
  ${ORDERS.length ? `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Siparişler</h3></div>${ORDERS.map((o) => `<div class="rrow"><div><b style="font-weight:600">${esc(supById(o.supId) ? supById(o.supId).name : 'Tedarikçi')}</b><div class="small muted">${esc(o.date)} · ${o.lines.map((l) => l.qty + ' ' + l.unit + ' ' + l.name.split(' (')[0]).join(', ')}</div></div><b class="num">${fmt0(o.total)}</b><div class="rfoot"><span class="pill ${ORD_ST[o.status][0]}">${ORD_ST[o.status][1]}</span>${o.conf ? ' <span class="pill p-ok">Tedarikçi onayladı</span>' : ''}${o.status === 'gonderildi' ? `<button class="btn sm" data-a="ordrecv" data-id="${o.id}">Teslim aldım</button><button class="btn sm sec" data-a="ordcopy" data-id="${o.id}">Mesajı kopyala</button><button class="btn sm sec" data-a="ordcancel" data-id="${o.id}">İptal</button>` : ''}</div></div>`).join('')}</div>` : ''}
  <div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>Tedarikçiler</h3><p class="muted small" style="margin-top:2px">Fiyatları kendi teklif ve faturalarına göre güncelle.</p></div><button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button></div>
  ${sgList()}</div>
  <p class="small muted">Tedarikçi fiyatlarını KaisPilot kendisi bulmaz, sen girersin. Pazaryeri ve tedarikçinin kendi paneli bu sürümde yok.</p>
  </div>`;
}
const cpy = (t, ok) => { try { navigator.clipboard.writeText(t).then(() => toast(ok, 'ok'), () => toast('Kopyalanamadı. Siparişler listesinden tekrar dene.', 'warn')); } catch (e) { toast('Kopyalanamadı. Siparişler listesinden tekrar dene.', 'warn'); } };
H.ordcreate = (el) => {
  const o = proposals().find((x) => x.sup.id === el.dataset.id); if (!o) return;
  const lines = o.lines.map(lineOf); const ord = { id: 'o' + (++seq), supId: o.sup.id, date: isoShort(REF_ISO), iso: REF_ISO, lines, total: Math.round(o.total * 100) / 100, status: 'gonderildi', msg: orderMsg(o.sup, lines) };
  ORDERS.unshift(ord); auditAdd({ type: 'ord', text: 'Sipariş kaydedildi: ' + o.sup.name + ', ' + fmt(ord.total) });
  render(); cpy(ord.msg, 'Sipariş kaydedildi, mesaj kopyalandı. Tedarikçiye gönder.');
};
H.ordcopy = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (o) cpy(o.msg, 'Mesaj kopyalandı.'); };
H.ordcancel = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (o) { o.status = 'iptal'; render(); toast('Sipariş iptal edildi.'); } };
H.ordrecv = (el) => {
  const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || o.status !== 'gonderildi') return; const sup = supById(o.supId);
  o.lines.forEach((l) => { const st = STOCK.find((x) => x.id === l.sid); if (!st) return; st.qty = r3(st.qty + l.qty); st.cost = l.price; st.sup = o.supId; STOCKLOG.unshift({ t: isoShort(REF_ISO), name: st.name, qty: l.qty, from: sup ? sup.name : 'Tedarikçi' }); });
  DEBTS.push({ id: 'd' + (++seq), who: sup ? sup.name : 'Tedarikçi', note: 'Sipariş ' + o.date, amt: o.total, due: addDays(REF_ISO, 14), rem: 3, on: true, ord: o.id });
  o.status = 'teslim'; auditAdd({ type: 'ord', text: 'Sipariş teslim alındı: ' + (sup ? sup.name : '') + ', ' + fmt(o.total) });
  render(); toast('Stok güncellendi, tutar Borçlar\'a eklendi.', 'ok');
};
const _och2 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'cover') { S.settings.cover = Number(el.value) || 7; render(); return; }
  if (ch === 'suse') { const st = STOCK.find((x) => x.id === el.dataset.id); if (st) { const v = Number(el.value); st.use = v > 0 ? v : 0; render(); } return; }
  return _och2(e);
};
H.supnew = () => { S.modal = { type: 'sup', id: '', name: '', phone: '', email: '', lead: 2, minAmt: 0, items: {} }; renderModal(); };
H.supedit = (el) => { const t = supById(el.dataset.id); if (!t) return; S.modal = { type: 'sup', id: t.id, name: t.name, phone: t.phone || '', email: t.email || '', lead: t.lead, minAmt: t.minAmt || 0, items: Object.assign({}, t.items) }; renderModal(); };
H.supsave = () => {
  const g = (id) => document.getElementById(id); const m = S.modal; const name = (g('sp-name').value || '').trim();
  if (!name) { g('sp-err').textContent = 'Tedarikçi adını yaz.'; return; }
  const items = {}; STOCK.forEach((s) => { const v = Number(String(g('sp-' + s.id).value).replace(',', '.')); if (v > 0) items[s.id] = v; });
  if (!Object.keys(items).length) { g('sp-err').textContent = 'En az bir ürünün fiyatını yaz.'; return; }
  const rec = { name, phone: (g('sp-phone').value || '').trim(), email: ((g('sp-email') || { value: '' }).value || '').trim().toLowerCase(), lead: Math.max(0, Number(g('sp-lead').value) || 0), minAmt: Math.max(0, Number(g('sp-min').value) || 0), items };
  if (m.id) Object.assign(supById(m.id), rec); else SUPPLIERS.push(Object.assign({ id: 't' + (++seq) }, rec));
  S.modal = null; render(); toast('Tedarikçi kaydedildi.', 'ok');
};
H.supdel = () => { const id = S.modal.id; if (ORDERS.some((o) => o.supId === id && o.status === 'gonderildi')) { document.getElementById('sp-err').textContent = 'Açık siparişi olan tedarikçi silinemez.'; return; } SUPPLIERS.splice(SUPPLIERS.findIndex((t) => t.id === id), 1); STOCK.forEach((s) => { if (s.sup === id) s.sup = null; }); S.modal = null; render(); toast('Tedarikçi silindi.'); };
NEWM.sup = (m) => sheet(m.id ? 'Tedarikçiyi düzenle' : 'Yeni tedarikçi', `<div class="field"><label for="sp-name">Ad</label><input type="text" id="sp-name" value="${esc(m.name)}"></div>
  <div class="field"><label for="sp-phone">Telefon</label><input type="text" id="sp-phone" value="${esc(m.phone)}"></div>
  <div class="field"><label for="sp-email">E-posta (tedarikçi paneline davet için)</label><input type="text" id="sp-email" inputmode="email" value="${esc(m.email || '')}" placeholder="Boş bırakırsan teklifleri elle girersin"></div>
  <div class="field"><label for="sp-lead">Teslim süresi (gün)</label><input type="text" id="sp-lead" inputmode="numeric" value="${m.lead}"></div>
  <div class="field"><label for="sp-min">Minimum sipariş tutarı (₺)</label><input type="text" id="sp-min" inputmode="decimal" value="${m.minAmt || ''}" placeholder="Yok"></div>
  <p class="lbl">Birim fiyatlar (taşımadığı ürünü boş bırak)</p>
  ${STOCK.map((s) => `<div class="field"><label for="sp-${s.id}">${esc(s.name)} (1 ${esc(s.unit)})</label><input type="text" id="sp-${s.id}" inputmode="decimal" value="${m.items[s.id] || ''}" placeholder="—"></div>`).join('')}
  <div class="err" id="sp-err" role="alert"></div><div class="row wrap"><button class="btn grow" data-a="supsave">Kaydet</button>${m.id ? '<button class="btn sec" data-a="supdel">Sil</button>' : ''}</div>`);
function orderSheets() {
  if (!ORDERS.length) return [];
  return [['Siparişler', [['Tarih', 'Tedarikçi', 'Ürün', 'Miktar', 'Birim', 'Birim fiyat', 'Tutar', 'Durum']].concat(ORDERS.flatMap((o) => o.lines.map((l) => [o.date, (supById(o.supId) || {}).name || '', l.name, l.qty, l.unit, { n: l.price }, { n: r2(l.qty * l.price) }, ORD_ST[o.status][1]]))), [10, 24, 26, 10, 10, 14, 14, 14]]];
};
const eSheetsV8 = eSheets; eSheets = function () { return eSheetsV8().concat(orderSheets()); };
NAV.patron.push(['satinalma', 'Satın alma', 'box', 'more']); NAV.mudur.push(['satinalma', 'Satın alma', 'box', 'more']);
TITLES.satinalma = 'Satın alma';
const viewHTMLV8 = viewHTML;
viewHTML = function () { const r = S.user.role; if ((r === 'patron' || r === 'mudur') && S.view === 'satinalma') return viewSatinAlma(); return viewHTMLV8(); };

/* v10: fiyat geçmişi, pahalı alış uyarısı, sipariş-fiş kontrolü */
const pad2 = (n) => String(n).padStart(2, '0');
(function seedPrices() {
  const set = (id, items) => { const f = RECEIPTS.find((x) => x.id === id); if (f && !(f.items && f.items.length)) f.items = items; };
  set('f1', [{ name: 'Süt (1 L)', qty: 48, amt: 1608, stk: 's2', on: true }, { name: 'Un (50 kg çuval)', qty: 4, amt: 2320, stk: 's1', on: true }, { name: 'Karton bardak (8 oz)', qty: 600, amt: 516, stk: 's5', on: true }]);
  set('f5', [{ name: 'Süt (1 L)', qty: 30, amt: 1020, stk: 's2', on: true }]);
  const cs = { s1: 640, s5: 0.9 }; STOCK.forEach((s) => { if (cs[s.id] && (s.cost === COST0[s.id])) s.cost = cs[s.id]; });
  const sp = (tid, sid, v) => { const t = SUPPLIERS.find((x) => x.id === tid); if (t && t.items[sid]) t.items[sid] = v; };
  sp('t1', 's1', 625); sp('t4', 's1', 660); sp('t2', 's5', 0.85); sp('t4', 's5', 0.95);
})();
function dShort(s) { const m = String(s).match(/^(\d{1,2})\s+(\S+)/); if (!m) return ''; const i = MON.indexOf(m[2]); if (i < 0) return ''; return REF.y + '-' + pad2(i + 1) + '-' + pad2(m[1]); }
function matchReceipt(o) {
  const sup = supById(o.supId); if (!sup) return null; const key = prodKey(sup.name.split(' ')[0]); if (key.length < 4) return null;
  for (const f of RECEIPTS) {
    if (f.status === 'reddedildi' || !f.items || !f.items.length || !prodKey(f.seller).includes(key)) continue;
    const diffs = []; const ok = o.lines.every((l) => { const it = f.items.find((i) => i.on && i.stk === l.sid && Number(i.qty) === Number(l.qty)); if (!it) return false; const rp = it.amt / it.qty; diffs.push({ name: l.name, op: l.price, rp, pct: (rp / l.price - 1) * 100 }); return true; });
    if (ok) return { f, diffs };
  }
  return null;
}
function pricePoints(sid) {
  const pts = [];
  RECEIPTS.forEach((f) => { if (f.status === 'reddedildi' || !f.items) return; f.items.forEach((it) => { if (it.on && it.stk === sid && Number(it.qty) > 0 && Number(it.amt) > 0) pts.push({ date: dShort(f.date), who: f.seller, qty: Number(it.qty), price: it.amt / it.qty, src: 'fiş' }); }); });
  ORDERS.filter((o) => o.status === 'teslim' && !matchReceipt(o)).forEach((o) => o.lines.forEach((l) => { if (l.sid === sid) pts.push({ date: dShort(o.date), who: (supById(o.supId) || {}).name || 'Tedarikçi', qty: l.qty, price: l.price, src: 'sipariş' }); }));
  return pts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
function priceInfo(st) {
  const pts = pricePoints(st.id); const last = pts[pts.length - 1];
  const o = { st, pts, last, avg: 0, pct: 0, flag: false, best: null, save: 0 };
  if (pts.length >= 2) { const prev = pts.slice(0, -1); o.avg = prev.reduce((a, p) => a + p.price, 0) / prev.length; o.pct = (last.price / o.avg - 1) * 100; o.flag = o.pct >= 8; }
  const offs = offersOf(st.id).slice().sort((a, b) => a.items[st.id] - b.items[st.id]);
  if (last && offs.length) { o.best = offs[0]; o.save = Math.max(0, (last.price - offs[0].items[st.id]) * last.qty); }
  return o;
}
const priceAlerts = () => STOCK.map(priceInfo).filter((i) => i.flag);
function priceCard() {
  const infos = STOCK.map(priceInfo).filter((i) => i.last); const fl = infos.filter((i) => i.flag).length;
  const dels = ORDERS.filter((o) => o.status === 'teslim');
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Fiyat takibi</h3><p class="muted small" style="margin-top:2px">Onaylanan fişlerden ve teslim alınan siparişlerden. Son alış, önceki alışların ortalamasıyla karşılaştırılır.${fl ? ' ' + fl + ' üründe artış var.' : ''}</p></div>
  ${infos.length ? infos.map((i) => `<details class="rt"><summary><span>${esc(i.st.name)}<span class="small muted" style="display:block">Son alış ${fmt(i.last.price)} · ${esc(i.last.who)}</span></span>${i.pts.length < 2 ? '<span class="pill p-mute">1 alış</span>' : `<span class="pill ${i.flag ? 'p-bad' : i.pct < -3 ? 'p-ok' : 'p-mute'}">${i.pct > 0 ? '+' : ''}${Math.round(i.pct)}%</span>`}</summary><div class="rb">
  ${i.pts.length >= 2 ? `<p class="small muted">Önceki ortalama ${fmt(i.avg)}</p>` : '<p class="small muted">Karşılaştırmak için en az iki alış gerekir.</p>'}
  ${i.best && i.best.items[i.st.id] < i.last.price ? `<p class="small" style="margin-top:4px">${esc(i.best.name)} ${fmt(i.best.items[i.st.id])} fiyat veriyor${i.save > 0 ? ', son alış miktarında yaklaşık ' + fmt0(i.save) + ' tasarruf' : ''}.</p>` : ''}
  ${i.pts.slice().reverse().map((p) => `<div class="logline"><span>${esc(isoShort(p.date))} · ${esc(p.who)}<span class="small muted" style="display:block">${fq(p.qty)} ${esc(i.st.unit)} · ${p.src}</span></span><b class="num">${fmt(p.price)}</b></div>`).join('')}</div></details>`).join('') : '<div class="empty">Henüz fiyat verisi yok. Fişteki kalemleri stok ürünüyle eşleyince burada görünür.</div>'}
  ${dels.length ? `<div style="padding:12px 16px"><p class="lbl">Sipariş ve fiş kontrolü</p>${dels.map((o) => { const m = matchReceipt(o); const bad = m && m.diffs.some((d) => Math.abs(d.pct) > 2); return `<div class="logline"><span>${esc((supById(o.supId) || {}).name || 'Tedarikçi')} · ${esc(o.date)}<span class="small muted" style="display:block">${m ? (bad ? m.diffs.filter((d) => Math.abs(d.pct) > 2).map((d) => esc(d.name.split(' (')[0]) + ': siparişte ' + fmt(d.op) + ', fişte ' + fmt(d.rp)).join(' · ') : 'Fiş ve sipariş tutuyor') : 'Fiş henüz gelmedi'}</span></span><span class="pill ${m ? (bad ? 'p-bad' : 'p-ok') : 'p-mute'}">${m ? (bad ? 'Fiyat farkı' : 'Eşleşti') : 'Fiş bekleniyor'}</span></div>`; }).join('')}</div>` : ''}</div>`;
}
const viewSatinAlmaV9 = viewSatinAlma;
viewSatinAlma = function () {
  const h = viewSatinAlmaV9(); const k = '<div class="card flush"><div style="padding:16px 16px 6px"><h3>Stok durumu</h3>';
  return h.includes(k) ? h.replace(k, priceCard() + k) : h;
};
const bugunPatronV9 = bugunPatron;
bugunPatron = function () {
  const al = priceAlerts(); if (!al.length) return bugunPatronV9();
  const a = al.slice().sort((x, y) => y.pct - x.pct)[0];
  const t = `<div class="stack">${todo('trend', 'warn', al.length + ' üründe fiyat artışı', a.st.name.split(' (')[0] + ' önceki alışlara göre %' + Math.round(a.pct) + ' pahalıya alındı', 'satinalma')}</div>`;
  return bugunPatronV9().replace(/<div class="card stack"><div><h3>Giriş kodu<\/h3>/, t + '<div class="card stack"><div><h3>Giriş kodu</h3>');
};
function priceSheets() {
  const rows = [['Ürün', 'Tarih', 'Kaynak', 'Tedarikçi / satıcı', 'Miktar', 'Birim fiyat']];
  STOCK.forEach((s) => pricePoints(s.id).forEach((p) => rows.push([s.name, p.date, p.src, p.who, p.qty, { n: r2(p.price) }])));
  return rows.length > 1 ? [['Fiyat geçmişi', rows, [26, 12, 10, 26, 10, 14]]] : [];
}
const eSheetsV9 = eSheets; eSheets = function () { return eSheetsV9().concat(priceSheets()); };

/* v11: teklif isteme ve karşılaştırma (Faz 3, elle teklif girişi) */
let RFQS = []; P_ARR.push(['RFQS', () => RFQS]);
const rfqMsg = (r) => ['Merhaba, ' + BIZ + ' adına fiyat teklifi istiyoruz:', ''].concat(r.lines.map((l) => '- ' + l.name + ': ' + fq(l.qty) + ' ' + l.unit)).concat(['', 'Birim fiyat, teslim süresi ve minimum sipariş tutarını yazar mısınız?']).join('\n');
function rfqStat(r) {
  const best = {}; r.lines.forEach((l) => { let b = null; Object.keys(r.quotes).forEach((sid) => { const p = r.quotes[sid][l.sid]; if (p > 0 && (!b || p < b.p)) b = { sup: sid, p }; }); if (b) best[l.sid] = b; });
  const per = r.sups.map((sid) => { const q = r.quotes[sid]; if (!q) return null; const full = r.lines.every((l) => q[l.sid] > 0); return { sid, full, total: r.lines.reduce((a, l) => a + (q[l.sid] > 0 ? q[l.sid] * l.qty : 0), 0) }; }).filter(Boolean);
  const split = r.lines.reduce((a, l) => a + (best[l.sid] ? best[l.sid].p * l.qty : 0), 0);
  const fulls = per.filter((x) => x.full).sort((a, b) => a.total - b.total);
  return { best, per, split, covered: Object.keys(best).length === r.lines.length, bestFull: fulls[0] || null };
}
function rfqCard() {
  const open = RFQS.filter((r) => r.status === 'acik'); const plan = stockPlan().filter((p) => p.status !== 'ok' && offersOf(p.st.id).length);
  return `<div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>Teklif iste</h3><p class="muted small" style="margin-top:2px">Azalan ürünler için tedarikçilerden teklif iste, gelen fiyatları gir, Kais karşılaştırsın.</p></div><button class="btn sm" data-a="rfqnew"${plan.length ? '' : ' disabled'}>${ic('plus', 16)} Teklif iste</button></div>
  ${open.length ? open.map((r) => { const st = rfqStat(r); const nm = (id) => (supById(id) || {}).name || 'Tedarikçi';
    return `<div style="padding:12px 16px;border-top:1px solid var(--line,#e6e6e6)"><div class="row between"><b>${esc(r.date)} · ${r.lines.length} ürün</b><button class="btn sm sec" data-a="rfqclose" data-id="${r.id}">Kapat</button></div>
    <p class="small muted">${r.lines.map((l) => fq(l.qty) + ' ' + esc(l.unit) + ' ' + esc(l.name.split(' (')[0])).join(', ')}</p>
    ${r.sups.map((sid) => `<div class="logline"><span>${esc(nm(sid))}<span class="small muted" style="display:block">${r.quotes[sid] ? Object.keys(r.quotes[sid]).length + ' ürüne teklif girildi' : 'Teklif bekleniyor'}${supTag(sid)}</span></span><button class="btn sm sec" data-a="rfqq" data-id="${r.id}" data-sup="${sid}">${r.quotes[sid] ? 'Düzenle' : 'Teklif gir'}</button></div>`).join('')}
    ${st.per.length ? `<p class="lbl" style="margin-top:10px">Karşılaştırma</p>${r.lines.map((l) => { const b = st.best[l.sid]; return `<div class="logline"><span>${esc(l.name.split(' (')[0])}</span><span class="small">${b ? esc(nm(b.sup)) + ' <b class="num">' + fmt(b.p) + '</b>' : '<span class="muted">teklif yok</span>'}</span></div>`; }).join('')}
    <div class="logline"><span>Ürün ürün en ucuz${st.covered ? '' : ' (eksik ürün var)'}</span><b class="num">${fmt0(st.split)}</b></div>
    ${st.bestFull ? `<div class="logline"><span>Tek tedarikçi: ${esc(nm(st.bestFull.sid))}</span><b class="num">${fmt0(st.bestFull.total)}</b></div>${st.covered && st.bestFull.total - st.split > 0.5 ? `<p class="small" style="margin-top:4px">Bölerek sipariş vermek ${fmt0(st.bestFull.total - st.split)} daha ucuz. Birden fazla yere sipariş ve teslimat olacağını unutma.</p>` : ''}` : ''}
    ${st.covered ? `<div class="row wrap" style="margin-top:10px"><button class="btn grow" data-a="rfqok" data-id="${r.id}">En ucuz dağıtımla sipariş ver</button></div>` : '<p class="small muted" style="margin-top:6px">Tüm ürünler için teklif gelince sipariş verebilirsin.</p>'}` : ''}</div>`; }).join('') : `<div class="empty">${plan.length ? 'Açık teklif isteği yok. ' + plan.length + ' ürün azalıyor.' : 'Azalan ürün yok.'}</div>`}</div>`;
}
const viewSatinAlmaV10 = viewSatinAlma;
viewSatinAlma = function () { const h = viewSatinAlmaV10(); const k = '<div class="card flush"><div style="padding:16px 16px 6px"><h3>Fiyat takibi</h3>'; return h.includes(k) ? h.replace(k, rfqCard() + k) : h; };
H.rfqnew = () => {
  const plan = stockPlan().filter((p) => p.status !== 'ok' && offersOf(p.st.id).length); if (!plan.length) return;
  const lines = plan.map((p) => ({ sid: p.st.id, name: p.st.name, unit: p.st.unit, qty: p.qty || Math.max(1, Math.ceil(p.st.min * 2 - p.st.qty)) }));
  const sups = SUPPLIERS.filter((t) => lines.some((l) => t.items[l.sid] > 0)).map((t) => t.id);
  const r = { id: 'r' + (++seq), date: isoShort(REF_ISO), lines, sups, quotes: {}, status: 'acik' }; r.msg = rfqMsg(r); RFQS.unshift(r);
  auditAdd({ type: 'ord', text: 'Teklif istendi: ' + lines.length + ' ürün, ' + sups.length + ' tedarikçi' }); render(); cpy(r.msg, 'Teklif mesajı kopyalandı. Tedarikçilere gönder.');
};
H.rfqclose = (el) => { const r = RFQS.find((x) => x.id === el.dataset.id); if (r) { r.status = 'kapali'; render(); toast('Teklif isteği kapatıldı.'); } };
H.rfqq = (el) => { const r = RFQS.find((x) => x.id === el.dataset.id); if (!r) return; S.modal = { type: 'quote', rid: r.id, sup: el.dataset.sup }; renderModal(); };
NEWM.quote = (m) => { const r = RFQS.find((x) => x.id === m.rid); const t = supById(m.sup); if (!r || !t) return ''; const q = r.quotes[m.sup] || {};
  return sheet('Teklif: ' + t.name, `<p class="small muted">Tedarikçinin verdiği birim fiyatı yaz. Teklif vermediği ürünü boş bırak.</p>${r.lines.map((l) => `<div class="field"><label for="q-${l.sid}">${esc(l.name)} · ${fq(l.qty)} ${esc(l.unit)}</label><input type="text" id="q-${l.sid}" inputmode="decimal" value="${q[l.sid] || ''}" placeholder="—"></div>`).join('')}<div class="err" id="q-err" role="alert"></div><button class="btn" data-a="rfqqsave">Kaydet</button>`); };
H.rfqqsave = () => {
  const m = S.modal; const r = RFQS.find((x) => x.id === m.rid); if (!r) return; const q = {};
  r.lines.forEach((l) => { const v = Number(String(document.getElementById('q-' + l.sid).value).replace(',', '.')); if (v > 0) q[l.sid] = v; });
  if (!Object.keys(q).length) { document.getElementById('q-err').textContent = 'En az bir ürün için fiyat yaz.'; return; }
  r.quotes[m.sup] = q; S.modal = null; render(); toast('Teklif kaydedildi.', 'ok');
};
H.rfqok = (el) => {
  const r = RFQS.find((x) => x.id === el.dataset.id); if (!r) return; const st = rfqStat(r); if (!st.covered) return; const g = {};
  r.lines.forEach((l) => { const b = st.best[l.sid]; (g[b.sup] = g[b.sup] || []).push({ sid: l.sid, name: l.name, unit: l.unit, qty: l.qty, price: b.p }); });
  Object.keys(g).forEach((sid) => { const lines = g[sid]; const sup = supById(sid); const total = Math.round(lines.reduce((a, l) => a + l.qty * l.price, 0) * 100) / 100;
    ORDERS.unshift({ id: 'o' + (++seq), supId: sid, date: isoShort(REF_ISO), iso: REF_ISO, lines, total, status: 'gonderildi', msg: orderMsg(sup, lines) + '\n\nTeklifinizdeki fiyatlarla.', rfq: r.id });
    lines.forEach((l) => { if (sup) sup.items[l.sid] = l.price; }); });
  r.status = 'kapali'; auditAdd({ type: 'ord', text: 'Tekliften sipariş verildi: ' + Object.keys(g).length + ' tedarikçi' }); render(); toast(Object.keys(g).length + ' sipariş kaydedildi. Mesajları Siparişler listesinden kopyala.', 'ok');
};

/* v12: tedarikçi sistemi (Supabase) bağlantısı */
const SB_URL = 'https://bbcsbkgbwzciyfymvpxh.supabase.co';
const SB_KEY = 'sb_publishable_Pc2JtwezlCiezDW4P4IKxw_gXFXUjnA';
const SBS = { c: null, user: null, biz: null, sups: [], busy: false, err: '', last: '' };
const sbOK = () => typeof supabase !== 'undefined' && supabase && supabase.createClient;
function sbClient() { if (!SBS.c && sbOK()) SBS.c = supabase.createClient(SB_URL, SB_KEY); return SBS.c; }
async function sbLoadBiz() {
  const c = sbClient(); if (!c || !SBS.user) return;
  let r = await c.from('businesses').select('*').eq('owner_id', SBS.user.id).limit(1);
  if (r.error) throw r.error;
  if (!r.data || !r.data[0]) { const i = await c.from('businesses').insert({ name: BIZ, owner_id: SBS.user.id }); if (i.error) throw i.error; r = await c.from('businesses').select('*').eq('owner_id', SBS.user.id).limit(1); if (r.error) throw r.error; }
  SBS.biz = r.data && r.data[0] || null;
  if (SBS.biz) await sbSyncSups();
}
async function sbBoot() {
  const c = sbClient(); if (!c) return;
  try { const s = await c.auth.getSession(); SBS.user = s && s.data && s.data.session ? s.data.session.user : null; if (SBS.user) { await sbLoadBiz(); await sbPull(); } } catch (e) { SBS.err = sbMsg(e); }
  render();
}
const sbMsg = (e) => { const m = String((e && e.message) || e || ''); return /Invalid login/i.test(m) ? 'E-posta veya şifre yanlış.' : /already registered/i.test(m) ? 'Bu e-posta zaten kayıtlı, Bağlan ile gir.' : /Email not confirmed/i.test(m) ? 'E-postanı onayla, sonra tekrar dene.' : trErr(m); };
async function sbSyncSups() {
  const c = sbClient(); if (!c || !SBS.biz) return;
  const q = await c.from('suppliers').select('*').eq('business_id', SBS.biz.id); if (q.error) throw q.error; SBS.sups = q.data || [];
  for (const t of SUPPLIERS) {
    if (!t.email) continue;
    let row = SBS.sups.find((x) => x.id === t.sbid) || SBS.sups.find((x) => (x.invite_email || '').toLowerCase() === t.email);
    if (!row) { const i = await c.from('suppliers').insert({ business_id: SBS.biz.id, name: t.name, phone: t.phone || null, lead_days: t.lead || 0, min_amount: t.minAmt || 0, invite_email: t.email }); if (i.error) throw i.error; const q2 = await c.from('suppliers').select('*').eq('business_id', SBS.biz.id); if (q2.error) throw q2.error; SBS.sups = q2.data || []; row = SBS.sups.find((x) => (x.invite_email || '').toLowerCase() === t.email); }
    if (row) t.sbid = row.id;
  }
}
async function sbPull() {
  const c = sbClient(); if (!c || !SBS.biz) return false; let ch = false;
  await sbSyncSups();
  const ids = RFQS.filter((r) => r.sbid).map((r) => r.sbid);
  if (ids.length) {
    const q = await c.from('quotes').select('*').in('rfq_id', ids); if (q.error) throw q.error;
    (q.data || []).forEach((row) => {
      const r = RFQS.find((x) => x.sbid === row.rfq_id); const t = SUPPLIERS.find((x) => x.sbid === row.supplier_id); if (!r || !t) return;
      const m = {}; r.lines.forEach((l, i) => { const v = Number(row.prices && row.prices[i]); if (v > 0) m[l.sid] = v; });
      if (!Object.keys(m).length) return; if (JSON.stringify(r.quotes[t.id]) !== JSON.stringify(m)) { r.quotes[t.id] = m; if (!r.sups.includes(t.id)) r.sups.push(t.id); ch = true; }
    });
  }
  const oids = ORDERS.filter((o) => o.sbid).map((o) => o.sbid);
  if (oids.length) {
    const q = await c.from('orders').select('id,status').in('id', oids); if (q.error) throw q.error;
    (q.data || []).forEach((row) => { const o = ORDERS.find((x) => x.sbid === row.id); if (o && row.status === 'onaylandi' && !o.conf) { o.conf = true; ch = true; } });
  }
  return ch;
}
let supTag = (sid) => { if (!MARKET_ON) return ''; const t = supById(sid); if (!t) return ''; if (!SBS.biz) return t.email ? ' · panel için bağlan' : ''; if (!t.email) return ' · e-posta yok, elle gir'; const row = SBS.sups.find((x) => x.id === t.sbid); return row && row.user_id ? ' · panelde' : ' · davet bekliyor'; };
function sbCard() {
  const addr = (typeof location !== 'undefined' && location.origin && /^http/.test(location.origin)) ? location.origin + '/tedarikci' : '';
  if (!sbOK()) return `<div class="card stack"><div><h3>Tedarikçi paneli</h3><p class="muted small" style="margin-top:2px">Bu ekranda tedarikçi sistemi kullanılamıyor. KaisPilot'u kendi adresinden aç. Şimdilik teklifleri elle girebilirsin.</p></div></div>`;
  if (!SBS.user) return `<div class="card stack"><div><h3>Tedarikçi paneli</h3><p class="muted small" style="margin-top:2px">Bağlanırsan teklif istekleri tedarikçilerin kendi paneline düşer, fiyatlar buraya otomatik gelir. Bu hesap KaisPilot girişinden ayrıdır.</p></div>
  <div class="field"><label for="sb-em">E-posta</label><input type="text" id="sb-em" inputmode="email" autocomplete="username"></div><div class="field"><label for="sb-pw">Şifre (en az 8 karakter)</label><input type="password" id="sb-pw" autocomplete="current-password"></div>
  <div class="err" id="sb-err" role="alert">${esc(SBS.err)}</div><div class="row wrap"><button class="btn grow" data-a="sbin">Bağlan</button><button class="btn sec" data-a="sbup">Hesap oluştur</button></div></div>`;
  const n = SBS.sups.filter((x) => x.user_id).length;
  return `<div class="card stack"><div class="row between wrap"><div><h3>Tedarikçi paneli</h3><p class="muted small" style="margin-top:2px">Bağlı. ${SBS.sups.length} tedarikçi kayıtlı, ${n} tanesi panele girmiş.</p></div><span class="pill p-ok">Bağlı</span></div>
  ${addr ? `<p class="small">Tedarikçilere vereceğin adres: <b>${esc(addr)}</b></p>` : ''}
  <p class="small muted">Tedarikçiyi eklerken e-postasını yaz. O e-postayla panelde hesap açınca teklif isteklerini görür.</p>
  <div class="err" id="sb-err" role="alert">${esc(SBS.err)}</div>
  <div class="row wrap">${addr ? `<button class="btn sm sec" data-a="sbcopy">Adresi kopyala</button>` : ''}<button class="btn sm sec" data-a="sbpull">Teklifleri yenile</button><button class="btn sm sec" data-a="sbout">Bağlantıyı kes</button></div></div>`;
}
const viewSatinAlmaV11 = viewSatinAlma;
viewSatinAlma = function () { const h = viewSatinAlmaV11(); const k = '<div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>Teklif iste</h3>'; return h.includes(k) ? h.replace(k, sbCard() + k) : h; };
async function sbAuth(up) {
  const em = (document.getElementById('sb-em').value || '').trim(); const pw = document.getElementById('sb-pw').value; const c = sbClient();
  const fail = (t) => { SBS.err = t; const e = document.getElementById('sb-err'); if (e) e.textContent = t; };
  if (!em || pw.length < 8) return fail('E-posta ve en az 8 karakterlik şifre yaz.');
  SBS.err = ''; SBS.busy = true;
  try {
    const r = up ? await c.auth.signUp({ email: em, password: pw }) : await c.auth.signInWithPassword({ email: em, password: pw });
    if (r.error) throw r.error;
    if (!r.data.session) { SBS.busy = false; return fail('Hesap açıldı. E-postana gelen onay bağlantısına tıkla, sonra Bağlan ile gir.'); }
    SBS.user = r.data.session.user; await sbLoadBiz(); await sbPull(); toast('Tedarikçi paneline bağlandı.', 'ok');
  } catch (e) { SBS.err = sbMsg(e); SBS.user = null; }
  SBS.busy = false; render();
}
H.sbin = () => { sbAuth(false); };
H.sbup = () => { sbAuth(true); };
H.sbout = async () => { try { await sbClient().auth.signOut(); } catch (e) {} SBS.user = null; SBS.biz = null; SBS.sups = []; render(); toast('Bağlantı kesildi.'); };
H.sbcopy = () => { const a = location.origin + '/tedarikci'; cpy(a, 'Adres kopyalandı.'); };
H.sbpull = async () => { try { const ch = await sbPull(); SBS.err = ''; render(); toast(ch ? 'Yeni teklifler geldi.' : 'Yeni teklif yok.', ch ? 'ok' : undefined); } catch (e) { SBS.err = sbMsg(e); render(); } };
const _rfqnew = H.rfqnew;
H.rfqnew = () => {
  const n = RFQS.length; _rfqnew(); if (RFQS.length === n || !SBS.biz) return; const r = RFQS[0];
  (async () => {
    try {
      await sbSyncSups(); const c = sbClient();
      const i = await c.from('rfqs').insert({ business_id: SBS.biz.id, lines: r.lines.map((l) => ({ sid: l.sid, name: l.name, unit: l.unit, qty: l.qty })) }); if (i.error) throw i.error;
      const q = await c.from('rfqs').select('id,created_at').eq('business_id', SBS.biz.id).order('created_at', { ascending: false }).limit(1); if (q.error) throw q.error;
      r.sbid = q.data[0].id; render(); toast('Teklif isteği tedarikçi paneline gönderildi.', 'ok');
    } catch (e) { SBS.err = sbMsg(e); render(); toast('Panele gönderilemedi: ' + sbMsg(e), 'warn'); }
  })();
};
const _rfqok = H.rfqok;
H.rfqok = (el) => {
  const r = RFQS.find((x) => x.id === el.dataset.id); const n = ORDERS.length; _rfqok(el); const made = ORDERS.slice(0, ORDERS.length - n);
  if (!r || !r.sbid || !SBS.biz || !made.length) return;
  (async () => {
    try {
      const c = sbClient();
      for (const o of made) {
        const t = supById(o.supId); if (!t || !t.sbid) continue;
        let i = await c.from('orders').insert({ business_id: SBS.biz.id, supplier_id: t.sbid, lines: o.lines, total: o.total, rfq_id: r.sbid }); if (i.error && /rfq_id|schema cache/i.test(i.error.message)) i = await c.from('orders').insert({ business_id: SBS.biz.id, supplier_id: t.sbid, lines: o.lines, total: o.total }); if (i.error) throw i.error;
        const q = await c.from('orders').select('id,created_at').eq('business_id', SBS.biz.id).eq('supplier_id', t.sbid).order('created_at', { ascending: false }).limit(1); if (q.error) throw q.error; o.sbid = q.data[0].id;
      }
      await c.from('rfqs').update({ status: 'kapali' }).eq('id', r.sbid); render();
    } catch (e) { toast('Sipariş panele gönderilemedi: ' + sbMsg(e), 'warn'); }
  })();
};
const _rfqclose = H.rfqclose;
H.rfqclose = (el) => { const r = RFQS.find((x) => x.id === el.dataset.id); _rfqclose(el); if (r && r.sbid && SBS.biz) sbClient().from('rfqs').update({ status: 'kapali' }).eq('id', r.sbid).then(() => {}, () => {}); };
setInterval(() => { if (SBS.biz && S.view === 'satinalma' && !S.modal && !SBS.busy && !(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) { sbPull().then((ch) => { if (ch) render(); }, () => {}); } }, 20000);
setTimeout(() => { sbBoot(); }, 0);

/* v13: Satın alma sekmelere bölündü, tüketim ve fiyat takibi Stok sayfasına taşındı */
S.saTab = S.saTab || 'siparis';
const saPill = (p) => p.left === Infinity ? '<span class="pill p-mute">Tüketim yok</span>' : `<span class="pill ${p.status === 'now' ? 'p-bad' : p.status === 'soon' ? 'p-warn' : 'p-ok'}">~${p.left < 10 ? fq(Math.round(p.left * 10) / 10) : Math.round(p.left)} gün yeter</span>`;
function stokUseCard() {
  const plan = stockPlan(); const noData = plan.every((p) => p.src === 'yok'); const days = Math.max(...plan.map((p) => p.days), 0);
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Tüketim ve kalan gün</h3><p class="muted small" style="margin-top:2px">Satış ve reçetelerden hesaplanır. Günlük tüketimi elle yazarsan o kullanılır.</p></div>
  ${noData ? `<div style="padding:0 16px 10px"><div class="callout warn">${ic('alert')}<div><b>Tüketim hesabı için satış verisi yok</b><p style="margin-top:2px">Satışlar sayfasından satış dosyası yükle ya da her ürünün günlük tüketimini aşağıya yaz.</p></div></div></div>` : days < 7 ? `<div style="padding:0 16px 10px"><div class="callout">${ic('info')}<div>Tüketim ${days} günlük satıştan hesaplandı. En az bir haftalık veriyle tahmin güvenilir olur.</div></div></div>` : ''}
  ${plan.slice().sort((a, b) => a.left - b.left).map((p) => `<div class="logline" style="padding:10px 16px"><span>${esc(p.st.name)}<span class="small muted" style="display:block">${fq(p.st.qty)} ${esc(p.st.unit)} · günde ${p.daily ? fq(p.daily) : '?'} (${p.src})</span></span><span class="row" style="gap:8px">${saPill(p)}<input class="num" style="width:70px;text-align:right" type="number" min="0" step="0.01" placeholder="günlük" value="${p.st.use || ''}" data-ch="suse" data-id="${p.st.id}" aria-label="${esc(p.st.name)} günlük tüketim"></span></div>`).join('')}</div>`;
}
const viewStokV12 = viewStok;
viewStok = function () {
  const h = viewStokV12(); const r = S.user && S.user.role; if (r !== 'patron' && r !== 'mudur') return h;
  const extra = stokUseCard() + priceCard(); const log = stokLogCard(); const i = log ? h.lastIndexOf(log) : -1;
  if (i >= 0) return h.slice(0, i) + extra + h.slice(i);
  const j = h.lastIndexOf('</div>'); return h.slice(0, j) + extra + h.slice(j);
};
function saOrdersCard() {
  if (!ORDERS.length) return '';
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Verilen siparişler</h3></div>${ORDERS.map((o) => `<div class="rrow"><div><b style="font-weight:600">${esc(supById(o.supId) ? supById(o.supId).name : 'Tedarikçi')}</b><div class="small muted">${esc(o.date)} · ${o.lines.map((l) => l.qty + ' ' + l.unit + ' ' + l.name.split(' (')[0]).join(', ')}</div></div><b class="num">${fmt0(o.total)}</b><div class="rfoot"><span class="pill ${ORD_ST[o.status][0]}">${ORD_ST[o.status][1]}</span>${o.conf ? ' <span class="pill p-ok">Tedarikçi onayladı</span>' : ''}${o.status === 'gonderildi' ? `<button class="btn sm" data-a="ordrecv" data-id="${o.id}">Teslim aldım</button><button class="btn sm sec" data-a="ordcopy" data-id="${o.id}">Mesajı kopyala</button><button class="btn sm sec" data-a="ordcancel" data-id="${o.id}">İptal</button>` : ''}</div></div>`).join('')}</div>`;
}
function saPropsHTML(props) {
  if (!props.length) return '<div class="callout">' + ic('check') + '<div>Şu an sipariş vermen gereken ürün yok.</div></div>';
  return `<div class="stack"><h3>Önerilen siparişler</h3>${props.map((o) => `<div class="card stack"><div class="row between wrap"><div><b style="font-weight:600">${esc(o.sup.name)}</b><div class="small muted">Teslim ${o.sup.lead} gün${o.sup.minAmt ? ' · en az ' + fmt0(o.sup.minAmt) : ''}</div></div><b class="num">${fmt0(o.total)}</b></div>
  <div>${o.lines.map((p) => `<div class="logline"><span>${esc(p.st.name)}<span class="small muted" style="display:block">${p.qty} ${esc(p.st.unit)}${p.packs ? ' (' + fq(p.packs) + ' ' + esc(p.packName) + ')' : ''} × ${fmt(p.price)}${p.base > p.price ? ' · eskisi ' + fmt(p.base) : p.base && p.base < p.price ? ' · eskisi ' + fmt(p.base) + ' (daha ucuzdu, ama geç gelir)' : ''}${p.late ? ' · stok bitmeden gelmeyebilir' : ''}</span></span>${saPill(p)}</div>`).join('')}</div>
  ${o.total < o.sup.minAmt ? `<div class="callout warn">${ic('alert')}<div>Tutar minimum sipariş tutarının altında (${fmt0(o.sup.minAmt)}).</div></div>` : ''}
  ${o.saving > 0 ? `<p class="small muted">Son alış fiyatına göre yaklaşık ${fmt0(o.saving)} tasarruf.</p>` : ''}
  <div class="row wrap"><button class="btn grow" data-a="ordcreate" data-id="${o.sup.id}">Siparişi kaydet ve mesajı kopyala</button></div></div>`).join('')}</div>`;
}
function saSupsCard() {
  return `<div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>Tedarikçiler</h3><p class="muted small" style="margin-top:2px">Fiyatları kendi teklif ve faturalarına göre güncelle.</p></div><button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button></div>
  ${SUPPLIERS.map((t) => `<button class="emp go" data-a="supedit" data-id="${t.id}"><div class="grow"><b style="font-weight:600">${esc(t.name)}</b><div class="small muted">${Object.keys(t.items).length} ürün · teslim ${t.lead} gün${t.phone ? ' · ' + esc(t.phone) : ''}${t.email ? ' · ' + esc(t.email) : ''}${supTag(t.id)}</div></div>${ic('chevron', 18)}</button>`).join('')}</div>`;
}
viewSatinAlma = function () {
  const plan = stockPlan(); const props = proposals(); const cover = Number(S.settings.cover) || 7;
  const now = plan.filter((p) => p.status === 'now').length; const soon = plan.filter((p) => p.status === 'soon').length; const sav = props.reduce((a, p) => a + p.saving, 0);
  const noData = plan.every((p) => p.src === 'yok'); const tab = S.saTab || 'siparis';
  const openR = RFQS.filter((r) => r.status === 'acik').length;
  const seg = [['siparis', 'Sipariş' + (props.length ? ' (' + props.length + ')' : '')], ['teklif', 'Teklif' + (openR ? ' (' + openR + ')' : '')], ['tedarikci', 'Tedarikçi']];
  let body = '';
  if (tab === 'siparis') body = `${noData ? `<div class="callout warn">${ic('alert')}<div><b>Tüketim hesabı için satış verisi yok</b><p style="margin-top:2px">Satışlar sayfasından satış yükle veya Stok sayfasında günlük tüketimi yaz.</p></div></div>` : ''}
  <div class="field"><label for="cover">Stok kaç günlük tutulsun?</label><select id="cover" data-ch="cover">${[5, 7, 10, 14].map((d) => `<option value="${d}" ${cover === d ? 'selected' : ''}>${d} gün</option>`).join('')}</select></div>${saPropsHTML(props)}${saOrdersCard()}`;
  else if (tab === 'teklif') body = `${rfqCard()}`;
  else body = `${sbCard()}${saSupsCard()}<p class="small muted">Fiyatları sen girersin ya da fiyat listesinin fotoğrafını, PDF'ini veya mesajını yüklersin, Kais okur.</p>`;
  return `<div class="stack-lg"><div><h2>Satın alma</h2><p class="muted small" style="margin-top:4px">Stok, satış ve reçetelerden hesaplanır. Kais önerir, sipariş sende onaylanır. Tüketim ve fiyat takibi Stok sayfasında.</p></div>
  <div class="kpis">${kpi('Şimdi sipariş', now)}${kpi('Yakında', soon)}${kpi('Olası tasarruf', fmt0(sav))}</div>
  <div class="seg" role="group" aria-label="Satın alma bölümleri">${seg.map((x) => `<button data-a="satab" data-v="${x[0]}" aria-pressed="${tab === x[0]}">${esc(x[1])}</button>`).join('')}</div>${body}</div>`;
};
H.satab = (el) => { S.saTab = el.dataset.v; render(); };

/* v14: akıllı Stok sayfası */
S.stFilter = S.stFilter || 'hepsi'; S.stQ = S.stQ || '';
const q1 = (n) => (Math.round(Number(n) * 10) / 10).toLocaleString('tr-TR');
function stokRows() {
  const plan = stockPlan(); const rank = { now: 0, soon: 1, ok: 2 };
  return plan.map((p) => { const st = p.st; const crit = st.qty < st.min; return Object.assign({ crit, pi: priceInfo(st), lvl: p.status === 'now' || crit ? 'acil' : p.status === 'soon' || st.qty < st.min * 1.25 ? 'azalan' : 'yeterli' }, p); })
    .sort((a, b) => (rank[a.status] - rank[b.status]) || ((a.left === Infinity ? 1e9 : a.left) - (b.left === Infinity ? 1e9 : b.left)) || (a.st.qty / a.st.min - b.st.qty / b.st.min));
}
function endTxt(p) { if (p.left === Infinity) return ''; const d = Math.max(0, Math.ceil(p.left)); return d === 0 ? 'bugün biter' : d === 1 ? 'yarın biter' : isoShort(addDays(REF_ISO, d)) + ' civarı biter'; }
function stokRowHTML(p) {
  const st = p.st; const tone = p.lvl === 'acil' ? ['p-bad', 'Acil'] : p.lvl === 'azalan' ? ['p-warn', 'Azalıyor'] : ['p-ok', 'Yeterli'];
  const pct = Math.min(100, Math.round((st.qty / (st.min * 2)) * 100)); const bar = p.lvl === 'acil' ? 'var(--nar)' : p.lvl === 'azalan' ? '#D9A441' : 'var(--yesil)';
  const pi = p.pi; const sug = p.pick && p.qty ? p.qty : 0;
  const trend = pi.pts.length >= 2 ? `<span class="pill ${pi.flag ? 'p-bad' : pi.pct < -3 ? 'p-ok' : 'p-mute'}">fiyat ${pi.pct > 0 ? '+' : ''}${Math.round(pi.pct)}%</span>` : '';
  return `<div class="stk2" style="border-top:1px solid var(--line)"><div class="stk" style="border-top:0"><div><div class="row wrap" style="gap:8px"><b style="font-weight:600">${esc(st.name)}</b><span class="pill ${tone[0]}">${tone[1]}</span>${p.left !== Infinity ? `<span class="small muted">~${p.left < 10 ? q1(p.left) : Math.round(p.left)} gün yeter</span>` : ''}</div>
    <div class="small muted">${p.left !== Infinity ? esc(endTxt(p)) + ' · ' : ''}en az ${q1(st.min)} ${esc(st.unit)}${p.daily ? ' · günde ' + q1(p.daily) : ''}</div><div class="minibar"><i style="width:${pct}%;background:${bar}"></i></div></div>
    <div class="stepper"><button data-a="stk" data-id="${st.id}" data-d="-1" aria-label="${esc(st.name)} bir azalt">−</button><b>${q1(st.qty)}</b><button data-a="stk" data-id="${st.id}" data-d="1" aria-label="${esc(st.name)} bir artır">+</button></div></div>
  <details class="rt"><summary><span class="small">${sug ? `<b>Öneri:</b> ${sug} ${esc(st.unit)} · ${esc(p.pick.name)} · ${fmt(p.price)}` : 'Detay ve düzeltme'}</span>${trend}</summary><div class="rb">
    ${sug ? `<div class="row wrap" style="margin-bottom:8px"><button class="btn sm" data-a="stkgo">Satın almada gör</button></div>` : ''}
    <div class="row wrap" style="gap:10px">
      <label class="small muted" style="flex:1;min-width:120px">Sayım (gerçek miktar)<input class="num" type="number" min="0" step="0.01" value="${st.qty}" data-ch="sqty" data-id="${st.id}" aria-label="${esc(st.name)} sayım"></label>
      <label class="small muted" style="flex:1;min-width:120px">En az seviye<input class="num" type="number" min="0" step="0.01" value="${st.min}" data-ch="smin" data-id="${st.id}" aria-label="${esc(st.name)} en az seviye"></label>
      <label class="small muted" style="flex:1;min-width:120px">Günlük tüketim<input class="num" type="number" min="0" step="0.01" placeholder="otomatik" value="${st.use || ''}" data-ch="suse" data-id="${st.id}" aria-label="${esc(st.name)} günlük tüketim"></label></div>
    <p class="small muted" style="margin-top:8px">Tüketim kaynağı: ${p.src === 'elle' ? 'elle yazdığın değer' : p.src === 'satış' ? p.days + ' günlük satış ve reçeteler' : 'veri yok'}.${st.cost ? ' Birim maliyet ' + fmt(st.cost) + '.' : ''}</p>
    ${pi.pts.length ? `<p class="lbl" style="margin-top:8px">Son alışlar</p>${pi.pts.slice(-3).reverse().map((x) => `<div class="logline"><span class="small">${esc(isoShort(x.date))} · ${esc(x.who)}</span><b class="num">${fmt(x.price)}</b></div>`).join('')}` : ''}
    ${pi.best && pi.last && pi.best.items[st.id] < pi.last.price ? `<p class="small" style="margin-top:6px">${esc(pi.best.name)} ${fmt(pi.best.items[st.id])} fiyat veriyor.</p>` : ''}</div></details></div>`;
}
const viewStokV13 = viewStok;
viewStok = function () {
  const r = S.user && S.user.role; if (r !== 'patron' && r !== 'mudur') return viewStokV13();
  const rows = stokRows(); const f = S.stFilter; const qq = (S.stQ || '').trim().toLowerCase();
  const val = STOCK.reduce((a, s) => a + s.qty * (s.cost || 0), 0);
  const acil = rows.filter((p) => p.lvl === 'acil').length; const az = rows.filter((p) => p.lvl === 'azalan').length;
  const props = proposals(); const need = rows.filter((p) => p.pick && p.qty).length; const al = priceAlerts();
  const vis = rows.filter((p) => (f === 'hepsi' || p.lvl === f) && (!qq || p.st.name.toLowerCase().includes(qq)));
  const seg = [['hepsi', 'Hepsi ' + rows.length], ['acil', 'Acil ' + acil], ['azalan', 'Azalan ' + az], ['yeterli', 'Yeterli ' + (rows.length - acil - az)]];
  return `<div class="stack-lg">
  <div class="row between wrap"><div><h2>Stok</h2><p class="muted small" style="margin-top:4px">Ne kadar kaldı, ne zaman biter, ne alınmalı.</p></div><button class="btn" data-a="stkadd">${ic('plus')} Ürün ekle</button></div>
  <div class="kpis">${kpi('Stok değeri', fmt0(val))}${kpi('Acil', acil)}${kpi('Sipariş gereken', need)}</div>
  ${need ? `<div class="callout warn">${ic('alert')}<div><b>${need} ürün için sipariş gerekiyor.</b> ${props.length ? esc(props.map((o) => o.sup.name + ' ' + fmt0(o.total)).join(' · ')) : ''}<div style="margin-top:8px"><button class="btn sm" data-a="stkgo">Satın almaya git</button></div></div></div>` : `<div class="callout">${ic('check')}<div>Şu an sipariş vermen gereken ürün yok.</div></div>`}
  ${al.length ? `<div class="callout">${ic('info')}<div><b>${al.length} üründe fiyat artışı:</b> ${esc(al.map((i) => i.st.name.split(' (')[0] + ' %' + Math.round(i.pct)).join(', '))}</div></div>` : ''}
  <div class="row wrap" style="gap:10px"><div class="seg" role="group" aria-label="Filtre">${seg.map((x) => `<button data-a="stkf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${esc(x[1])}</button>`).join('')}</div>
    <input type="text" class="grow" style="min-width:140px" placeholder="Ürün ara" value="${esc(S.stQ || '')}" data-ch="stq" aria-label="Ürün ara"></div>
  <div class="card flush">${vis.length ? vis.map(stokRowHTML).join('') : '<div class="empty">Bu filtrede ürün yok.</div>'}</div>
  <p class="small muted">Sıralama aciliyete göredir. Günlük tüketim satış ve reçetelerden hesaplanır, istersen ürünün detayından elle yaz. Satış verisi yoksa kalan gün gösterilmez.</p>
  ${stokLogCard()}${priceCard()}</div>`;
};
H.stkgo = () => { S.view = 'satinalma'; S.saTab = 'siparis'; render(); window.scrollTo && window.scrollTo(0, 0); };
H.stkf = (el) => { S.stFilter = el.dataset.v; render(); };
const _och14 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'stq') { S.stQ = el.value; render(); return; }
  if (ch === 'sqty') { const st = STOCK.find((x) => x.id === el.dataset.id); const v = Number(String(el.value).replace(',', '.')); if (st && v >= 0 && v !== st.qty) { const d = r3(v - st.qty); STOCKLOG.unshift({ t: isoShort(REF_ISO), name: st.name, qty: d, from: 'Sayım düzeltmesi' }); st.qty = r3(v); auditAdd({ type: 'ord', text: 'Stok sayımı: ' + st.name + ' ' + (d > 0 ? '+' : '') + d }); render(); toast('Stok düzeltildi.', 'ok'); } return; }
  if (ch === 'smin') { const st = STOCK.find((x) => x.id === el.dataset.id); const v = Number(String(el.value).replace(',', '.')); if (st && v >= 0) { st.min = v; render(); } return; }
  return _och14(e);
};

/* v15: Stok yönetimi: parti/SKT, fire, sayım, kategori, koli, hareket geçmişi, rapor */
const SEED15 = { s1: { cat: 'Kuru gıda', loc: 'Depo', shelf: 180 }, s2: { cat: 'Süt ürünleri', loc: 'Soğuk oda', shelf: 7, packName: 'koli', packN: 12 }, s3: { cat: 'Kahve', loc: 'Depo', shelf: 120 }, s4: { cat: 'Kuru gıda', loc: 'Depo', shelf: 365 }, s5: { cat: 'Ambalaj', loc: 'Depo', packName: 'koli', packN: 1000 }, s6: { cat: 'Kuru gıda', loc: 'Depo', shelf: 365 }, s7: { cat: 'Ambalaj', loc: 'Depo' } };
STOCK.forEach((s) => { const d = SEED15[s.id]; if (d) Object.keys(d).forEach((k) => { if (s[k] === undefined) s[k] = d[k]; }); });
const LOTS = []; const WASTE = []; const COUNTLOG = [];
P_ARR.push(['LOTS', () => LOTS], ['WASTE', () => WASTE], ['COUNTLOG', () => COUNTLOG]);
[['s2', 12, 2], ['s2', 24, 6], ['s1', 3, 90], ['s1', 5, 150], ['s3', 14, 80], ['s4', 6, 300], ['s6', 3, 200]].forEach(([sid, q, d]) => LOTS.push({ id: 'l' + (++seq), sid, qty: q, exp: addDays(REF_ISO, d), recv: REF_ISO }));
const WHY = ['Bozuldu / SKT geçti', 'Döküldü / hata', 'İkram', 'Diğer'];
const dleft = (iso) => { if (!iso) return null; const a = iso.split('-').map(Number); const b = REF_ISO.split('-').map(Number); return Math.round((Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(b[0], b[1] - 1, b[2])) / 864e5); };
const lotsOf = (sid) => LOTS.filter((l) => l.sid === sid).sort((a, b) => (a.exp || '9999') < (b.exp || '9999') ? -1 : 1);
function lotSync() {
  STOCK.forEach((st) => { let sum = 0; const ls = lotsOf(st.id); ls.forEach((l) => { sum += l.qty; });
    for (let i = 0; i < ls.length && sum > st.qty + 1e-9; i++) { const cut = Math.min(ls[i].qty, sum - st.qty); ls[i].qty = r3(ls[i].qty - cut); sum -= cut; }
  });
  for (let i = LOTS.length - 1; i >= 0; i--) if (LOTS[i].qty <= 1e-9) LOTS.splice(i, 1);
}
const lotFree = (st) => Math.max(0, r3(st.qty - lotsOf(st.id).reduce((a, l) => a + l.qty, 0)));
const mv = (st, qty, k, why) => STOCKLOG.unshift({ t: isoShort(REF_ISO), iso: REF_ISO, name: st.name, sid: st.id, qty, from: why, k, by: S.user ? S.user.name : '' });
/* stokLogCard yalnız fişten girişleri göstersin */
const stokLogCardV14 = stokLogCard;
stokLogCard = function () { const all = STOCKLOG; const keep = all.filter((x) => !x.k); const back = all.slice(); all.length = 0; keep.forEach((x) => all.push(x)); try { return stokLogCardV14(); } finally { all.length = 0; back.forEach((x) => all.push(x)); } };
/* hareket kaydı kancaları */
const _importSales = importSales;
importSales = function (rows, name) { const imp = _importSales(rows, name); Object.entries(imp.cons || {}).forEach(([sid, u]) => { const st = STOCK.find((x) => x.id === sid); if (st && u > 0) mv(st, -u, 'satis', 'Satış: ' + imp.name); }); return imp; };
const _stk15 = H.stk;
H.stk = (el) => { const s = STOCK.find((x) => x.id === el.dataset.id); const b = s ? s.qty : 0; _stk15(el); if (s && s.qty !== b) mv(s, r3(s.qty - b), 'elle', 'Elle düzeltme'); };
const _ordrecv15 = H.ordrecv;
H.ordrecv = (el) => {
  const o = ORDERS.find((x) => x.id === el.dataset.id); const was = o && o.status; _ordrecv15(el);
  if (o && was === 'gonderildi' && o.status === 'teslim') o.lines.forEach((l) => { const st = STOCK.find((x) => x.id === l.sid); if (st && st.shelf > 0) LOTS.push({ id: 'l' + (++seq), sid: st.id, qty: l.qty, exp: addDays(REF_ISO, st.shelf), recv: REF_ISO }); });
};
/* koli: sipariş miktarı tam koliye yuvarlanır */
const stockPlanV14 = stockPlan;
stockPlan = function () { const plan = stockPlanV14(); plan.forEach((p) => { const st = p.st; if (p.pick && p.qty > 0 && st.packN > 1) { p.qty = Math.ceil(p.qty / st.packN) * st.packN; p.packs = p.qty / st.packN; p.packName = st.packName || 'koli'; } }); return plan; };
/* ---- akıllı Stok sayfası v2 ---- */
S.stTab = S.stTab || 'liste'; S.stGroup = S.stGroup || 'liste';
const sktSoon = (n) => LOTS.filter((l) => l.exp && dleft(l.exp) <= n).sort((a, b) => a.exp < b.exp ? -1 : 1);
const sktTxt = (d) => d < 0 ? Math.abs(d) + ' gün önce geçti' : d === 0 ? 'bugün' : d === 1 ? 'yarın' : d + ' gün sonra';
const sktTone = (d) => d <= 0 ? 'p-bad' : d <= 3 ? 'p-warn' : d <= 14 ? 'p-info' : 'p-mute';
const stById = (id) => STOCK.find((x) => x.id === id);
function lotHTML(st) {
  const ls = lotsOf(st.id); const free = lotFree(st);
  return `<p class="lbl" style="margin-top:10px">Partiler ve son kullanma tarihi</p>
  ${ls.length ? ls.map((l) => { const d = dleft(l.exp); return `<div class="logline"><span class="small">${fq(l.qty)} ${esc(st.unit)} <span class="pill ${sktTone(d)}">${l.exp ? esc(isoShort(l.exp)) + ' · ' + sktTxt(d) : 'tarihsiz'}</span></span><span class="row" style="gap:6px">${d !== null && d <= 0 ? `<button class="btn sm" data-a="lotwaste" data-id="${l.id}">Fire yaz</button>` : ''}<button class="btn sm sec" data-a="lotdel" data-id="${l.id}" aria-label="Partiyi sil">Sil</button></span></div>`; }).join('') : '<p class="small muted">Parti kaydı yok.</p>'}
  ${free > 0 ? `<p class="small muted">Tarihi girilmemiş stok: ${fq(free)} ${esc(st.unit)}</p>` : ''}
  <div class="row wrap" style="gap:8px;margin-top:6px"><input class="num" type="number" min="0" step="0.01" placeholder="miktar" id="lq-${st.id}" style="width:90px" aria-label="Parti miktarı"><input type="date" id="ld-${st.id}" aria-label="Son kullanma tarihi"><button class="btn sm sec" data-a="lotadd" data-id="${st.id}">Parti ekle</button></div>`;
}
function stokRowHTML15(p) {
  const base = stokRowHTML(p); const st = p.st; const next = sktSoon(7).filter((l) => l.sid === st.id)[0];
  let h = base;
  if (st.packN > 1) h = h.replace(/(<div class="stepper">)/, `<div class="small muted" style="text-align:right;margin-right:8px">≈ ${q1(st.qty / st.packN)} ${esc(st.packName || 'koli')}</div>$1`);
  if (next) h = h.replace('<span class="small muted">~', `<span class="pill ${sktTone(dleft(next.exp))}">SKT ${sktTxt(dleft(next.exp))}</span> <span class="small muted">~`);
  const extra = `<div style="margin-top:10px"><div class="row wrap" style="gap:10px">
    <label class="small muted" style="flex:1;min-width:130px">Kategori<input type="text" value="${esc(st.cat || '')}" data-ch="scat" data-id="${st.id}" placeholder="Örn: Kuru gıda" aria-label="${esc(st.name)} kategori"></label>
    <label class="small muted" style="flex:1;min-width:130px">Depo yeri<input type="text" value="${esc(st.loc || '')}" data-ch="sloc" data-id="${st.id}" placeholder="Örn: Soğuk oda" aria-label="${esc(st.name)} yer"></label>
    <label class="small muted" style="flex:1;min-width:130px">Raf ömrü (gün)<input class="num" type="number" min="0" value="${st.shelf || ''}" data-ch="sshelf" data-id="${st.id}" placeholder="yok" aria-label="${esc(st.name)} raf ömrü"></label></div>
    <div class="row wrap" style="gap:10px;margin-top:8px"><label class="small muted" style="flex:1;min-width:130px">Paket adı<input type="text" value="${esc(st.packName || '')}" data-ch="spkn" data-id="${st.id}" placeholder="koli, çuval…" aria-label="${esc(st.name)} paket adı"></label>
    <label class="small muted" style="flex:1;min-width:130px">1 pakette kaç ${esc(st.unit)}<input class="num" type="number" min="0" value="${st.packN || ''}" data-ch="spkc" data-id="${st.id}" placeholder="yok" aria-label="${esc(st.name)} paket içi adet"></label></div>
    ${lotHTML(st)}<div class="row wrap" style="margin-top:10px"><button class="btn sm sec" data-a="sthist" data-id="${st.id}">Hareket geçmişi</button><button class="btn sm sec" data-a="wasteopen" data-id="${st.id}">Fire yaz</button></div></div>`;
  return h.replace(/<\/div><\/details><\/div>$/, extra + '</div></details></div>');
}
function groupRows(rows) {
  const g = S.stGroup; if (g === 'liste') return rows.map(stokRowHTML15).join('');
  const key = g === 'kat' ? 'cat' : 'loc'; const m = {}; rows.forEach((p) => { const k = p.st[key] || 'Belirsiz'; (m[k] = m[k] || []).push(p); });
  return Object.keys(m).sort().map((k) => { const v = m[k].reduce((a, p) => a + p.st.qty * (p.st.cost || 0), 0); return `<div class="lbl" style="padding:12px 16px 4px;display:flex;justify-content:space-between"><span>${esc(k)} · ${m[k].length} ürün</span><span>${fmt0(v)}</span></div>${m[k].map(stokRowHTML15).join('')}`; }).join('');
}
function tabSeg() {
  const soon = sktSoon(3).length; const wk = WASTE.length;
  const t = [['liste', 'Liste' + (soon ? ' · SKT ' + soon : '')], ['uretim', 'Üretim'], ['maliyet', 'Maliyet'], ['sayim', 'Sayım' + (S.cnt ? ' •' : '')], ['fire', 'Fire'], ['rapor', 'Rapor']];
  return `<div class="seg" role="group" aria-label="Stok bölümleri">${t.map((x) => `<button data-a="sttab" data-v="${x[0]}" aria-pressed="${S.stTab === x[0]}">${esc(x[1])}</button>`).join('')}</div>`;
}
function stokHead(sub) { return `<div class="row between wrap"><div><h2>Stok</h2><p class="muted small" style="margin-top:4px">${sub}</p></div><div class="row wrap" style="gap:8px"><button class="btn sec" data-a="stkbulk">İçe aktar</button><button class="btn" data-a="stkadd">${ic('plus')} Ürün ekle</button></div></div>${tabSeg()}`; }
function stokListe() {
  const rows = stokRows(); const f = S.stFilter; const qq = (S.stQ || '').trim().toLowerCase();
  const val = STOCK.reduce((a, s) => a + s.qty * (s.cost || 0), 0);
  const acil = rows.filter((p) => p.lvl === 'acil').length; const az = rows.filter((p) => p.lvl === 'azalan').length;
  const props = proposals(); const need = rows.filter((p) => p.pick && p.qty).length; const al = priceAlerts(); const sk = sktSoon(3);
  const vis = rows.filter((p) => (f === 'hepsi' || p.lvl === f) && (!qq || p.st.name.toLowerCase().includes(qq) || (p.st.cat || '').toLowerCase().includes(qq) || (p.st.loc || '').toLowerCase().includes(qq)));
  const seg = [['hepsi', 'Hepsi ' + rows.length], ['acil', 'Acil ' + acil], ['azalan', 'Azalan ' + az], ['yeterli', 'Yeterli ' + (rows.length - acil - az)]];
  const gs = [['liste', 'Liste'], ['kat', 'Kategori'], ['yer', 'Yer']];
  return `${stokHead('Ne kadar kaldı, ne zaman biter, ne alınmalı.')}
  <div class="kpis">${kpi('Stok değeri', fmt0(val))}${kpi('Acil', acil)}${kpi('Sipariş gereken', need)}</div>
  ${sk.length ? `<div class="callout warn">${ic('alert')}<div><b>${sk.length} parti 3 gün içinde bozulacak veya bozuldu:</b> ${esc(sk.slice(0, 3).map((l) => (stById(l.sid) || { name: '' }).name.split(' (')[0] + ' ' + fq(l.qty) + ' · ' + sktTxt(dleft(l.exp))).join(', '))}<div style="margin-top:8px"><button class="btn sm" data-a="sttab" data-v="rapor">Detay</button></div></div></div>` : ''}
  ${need ? `<div class="callout warn">${ic('alert')}<div><b>${need} ürün için sipariş gerekiyor.</b> ${props.length ? esc(props.map((o) => o.sup.name + ' ' + fmt0(o.total)).join(' · ')) : ''}<div style="margin-top:8px"><button class="btn sm" data-a="stkgo">Satın almaya git</button></div></div></div>` : `<div class="callout">${ic('check')}<div>Şu an sipariş vermen gereken ürün yok.</div></div>`}
  ${al.length ? `<div class="callout">${ic('info')}<div><b>${al.length} üründe fiyat artışı:</b> ${esc(al.map((i) => i.st.name.split(' (')[0] + ' %' + Math.round(i.pct)).join(', '))}</div></div>` : ''}
  <div class="row wrap" style="gap:10px"><div class="seg" role="group" aria-label="Filtre">${seg.map((x) => `<button data-a="stkf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${esc(x[1])}</button>`).join('')}</div><div class="seg" role="group" aria-label="Gruplama">${gs.map((x) => `<button data-a="stg" data-v="${x[0]}" aria-pressed="${S.stGroup === x[0]}">${esc(x[1])}</button>`).join('')}</div>
    <input type="text" class="grow" style="min-width:140px" placeholder="Ürün, kategori veya yer ara" value="${esc(S.stQ || '')}" data-ch="stq" aria-label="Ara"></div>
  <div class="card flush">${vis.length ? groupRows(vis) : '<div class="empty">Bu filtrede ürün yok.</div>'}</div>
  <p class="small muted">Sıralama aciliyete göredir. Satış verisi yoksa kalan gün gösterilmez.</p>${priceCard()}`;
}
function stokSayim() {
  const c = S.cnt; const groups = {}; STOCK.filter((st) => !S.cntOnly || S.cntOnly.includes(st.id)).forEach((st) => { const k = st.loc || 'Belirsiz'; (groups[k] = groups[k] || []).push(st); });
  const last = COUNTLOG[0];
  if (!c) return `${stokHead('Raftaki gerçek miktarı yaz, farkı sistem hesaplasın.')}
  <div class="card stack"><div><h3>Sayım yap</h3><p class="muted small" style="margin-top:2px">Ürünleri sayarken yer yer ilerle. Sayım bitince sistemdeki miktarla farkı görür, onaylarsan stok düzelir. Fark kayıp ya da fire demektir.</p></div><button class="btn" data-a="cntstart">Sayıma başla</button></div>
  ${last ? `<div class="callout">${ic('info')}<div>Son sayım: ${esc(isoShort(last.date))}, ${last.items.length} üründe fark, toplam ${fmt0(last.total)}.</div></div>` : ''}
  ${COUNTLOG.length ? `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Geçmiş sayımlar</h3></div>${COUNTLOG.slice(0, 6).map((x) => `<div class="logline" style="padding:10px 16px"><span>${esc(isoShort(x.date))} · ${esc(x.by || '')}<span class="small muted" style="display:block">${x.items.map((i) => esc(i.name.split(' (')[0]) + ' ' + (i.diff > 0 ? '+' : '') + q1(i.diff)).join(', ') || 'Fark yok'}</span></span><b class="num" style="color:${x.total < 0 ? 'var(--nar)' : 'inherit'}">${fmt0(x.total)}</b></div>`).join('')}</div>` : ''}`;
  const n = Object.keys(c.vals).length;
  return `${stokHead('Sayım sürüyor.')}
  <div class="callout">${ic('info')}<div>Sadece saydığın ürünleri yaz, boş bıraktığın ürün değişmez. ${n} / ${STOCK.length} ürün girildi.</div></div>
  ${Object.keys(groups).sort().map((k) => `<div class="card flush"><div class="lbl" style="padding:12px 16px 4px">${esc(k)}</div>${groups[k].map((st) => `<div class="logline" style="padding:10px 16px"><span>${esc(st.name)}<span class="small muted" style="display:block">Sistemde ${q1(st.qty)} ${esc(st.unit)}</span></span><input class="num" style="width:100px;text-align:right" type="number" min="0" step="0.01" placeholder="sayılan" value="${c.vals[st.id] != null ? c.vals[st.id] : ''}" data-ch="cntv" data-id="${st.id}" aria-label="${esc(st.name)} sayılan"></div>`).join('')}</div>`).join('')}
  <div class="row wrap"><button class="btn grow" data-a="cntfinish"${n ? '' : ' disabled'}>Sayımı bitir ve farkı gör</button><button class="btn sec" data-a="cntcancel">Vazgeç</button></div>`;
}
function stokFire() {
  const mon = WASTE.filter((w) => w.date.slice(0, 7) === REF_ISO.slice(0, 7)); const tot = mon.reduce((a, w) => a + w.cost, 0);
  const opts = STOCK.map((s) => `<option value="${s.id}"${S.wasteSid === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
  return `${stokHead('Dökülen, bozulan, ikram edilen ürünleri kaydet.')}
  <div class="kpis">${kpi('Bu ay fire', fmt0(tot))}${kpi('Kayıt', mon.length)}${kpi('Fire oranı', stockValTxt(tot))}</div>
  <div class="card stack"><div><h3>Fire yaz</h3></div>
  <div class="field"><label for="wf-sid">Ürün</label><select id="wf-sid">${opts}</select></div>
  <div class="field"><label for="wf-qty">Miktar</label><input type="number" min="0" step="0.01" id="wf-qty" inputmode="decimal" placeholder="Örn: 2"></div>
  <div class="field"><label for="wf-why">Neden</label><select id="wf-why">${WHY.map((w) => `<option>${esc(w)}</option>`).join('')}</select></div>
  <div class="field"><label for="wf-note">Not (istersen)</label><input type="text" id="wf-note"></div>
  <div class="err" id="wf-err" role="alert"></div><button class="btn" data-a="wasteadd">Fire kaydet</button></div>
  <div class="card flush"><div style="padding:16px 16px 6px"><h3>Son kayıtlar</h3></div>${WASTE.length ? WASTE.slice(0, 12).map((w) => `<div class="logline" style="padding:10px 16px"><span>${esc(w.name)}<span class="small muted" style="display:block">${esc(isoShort(w.date))} · ${esc(w.why)} · ${q1(w.qty)} ${esc(w.unit)}${w.note ? ' · ' + esc(w.note) : ''}</span></span><b class="num">${fmt0(w.cost)}</b></div>`).join('') : '<div class="empty">Henüz fire kaydı yok.</div>'}</div>`;
}
function stockValTxt(w) { const v = STOCK.reduce((a, s) => a + s.qty * (s.cost || 0), 0); return v > 0 ? '%' + (Math.round((w / v) * 1000) / 10).toLocaleString('tr-TR') : '-'; }
function stokRapor() {
  const mon = WASTE.filter((w) => w.date.slice(0, 7) === REF_ISO.slice(0, 7)); const fire = mon.reduce((a, w) => a + w.cost, 0);
  const sayim = COUNTLOG.reduce((a, x) => a + Math.min(0, x.total), 0); const plan = stockPlan(); const sd = Math.max(...plan.map((p) => p.days), 0);
  const dead = sd >= 1 ? plan.filter((p) => p.daily === 0 && p.src !== 'elle' && p.st.qty > 0) : []; const deadVal = dead.reduce((a, p) => a + p.st.qty * (p.st.cost || 0), 0);
  const by = {}; mon.forEach((w) => { by[w.why] = (by[w.why] || 0) + w.cost; }); const mx = Math.max(1, ...Object.values(by));
  const topP = {}; mon.forEach((w) => { topP[w.name] = (topP[w.name] || 0) + w.cost; });
  const cat = {}; STOCK.forEach((s) => { const k = s.cat || 'Belirsiz'; cat[k] = (cat[k] || 0) + s.qty * (s.cost || 0); }); const cm = Math.max(1, ...Object.values(cat));
  const dif = {}; COUNTLOG.forEach((x) => x.items.forEach((i) => { dif[i.name] = (dif[i.name] || 0) + i.val; })); const sk = sktSoon(14);
  const bar = (l, v, m, tone) => `<div style="margin:6px 0"><div class="row between small"><span>${esc(l)}</span><b class="num">${fmt0(v)}</b></div><div class="minibar"><i style="width:${Math.max(3, Math.round((Math.abs(v) / m) * 100))}%;background:${tone || 'var(--cini)'}"></i></div></div>`;
  return `${stokHead('Kayıp, fire ve bağlı para bir arada.')}
  <div class="kpis">${kpi('Bu ay fire', fmt0(fire))}${kpi('Sayım farkı', fmt0(sayim))}${kpi('Hareketsiz stok', sd >= 1 ? fmt0(deadVal) : '-')}</div>
  <div class="card stack"><div><h3>Son kullanma tarihi yaklaşanlar</h3><p class="muted small" style="margin-top:2px">14 gün içinde bozulacak partiler. En erken bozulan ilk kullanılmalı.</p></div>
  ${sk.length ? sk.map((l) => { const st = stById(l.sid) || { name: '?', unit: '' }; const d = dleft(l.exp); return `<div class="logline"><span>${esc(st.name)}<span class="small muted" style="display:block">${fq(l.qty)} ${esc(st.unit)} · ${esc(isoShort(l.exp))}</span></span><span class="row" style="gap:6px"><span class="pill ${sktTone(d)}">${sktTxt(d)}</span>${d <= 0 ? `<button class="btn sm" data-a="lotwaste" data-id="${l.id}">Fire yaz</button>` : ''}</span></div>`; }).join('') : '<p class="small muted">14 gün içinde bozulacak parti yok.</p>'}</div>
  <div class="card stack"><div><h3>Fire nedenleri (bu ay)</h3></div>${Object.keys(by).length ? Object.keys(by).map((k) => bar(k, by[k], mx, 'var(--nar)')).join('') : '<p class="small muted">Bu ay fire kaydı yok.</p>'}
  ${Object.keys(topP).length ? `<p class="lbl" style="margin-top:8px">En çok fire veren ürünler</p>${Object.keys(topP).sort((a, b) => topP[b] - topP[a]).slice(0, 3).map((k) => bar(k, topP[k], Math.max(...Object.values(topP)), 'var(--nar)')).join('')}` : ''}</div>
  <div class="card stack"><div><h3>Sayım farkları</h3><p class="muted small" style="margin-top:2px">Sistemdeki ile gerçek miktar arasındaki fark. Eksi değer, kayıp demektir.</p></div>${Object.keys(dif).length ? Object.keys(dif).sort((a, b) => dif[a] - dif[b]).slice(0, 5).map((k) => bar(k, dif[k], Math.max(...Object.values(dif).map(Math.abs), 1), dif[k] < 0 ? 'var(--nar)' : 'var(--yesil)')).join('') : '<p class="small muted">Henüz sayım yapılmadı.</p>'}</div>
  <div class="card stack"><div><h3>Hareketsiz stok</h3><p class="muted small" style="margin-top:2px">Satış ve reçetelerde hiç kullanılmayan, rafta para bağlayan ürünler.</p></div>${sd < 1 ? '<p class="small muted">Satış verisi yüklenince hesaplanır.</p>' : dead.length ? dead.map((p) => `<div class="logline"><span>${esc(p.st.name)}<span class="small muted" style="display:block">${q1(p.st.qty)} ${esc(p.st.unit)}</span></span><b class="num">${fmt0(p.st.qty * (p.st.cost || 0))}</b></div>`).join('') : '<p class="small muted">Hareketsiz ürün yok.</p>'}</div>
  <div class="card stack"><div><h3>Kategoriye göre stok değeri</h3></div>${Object.keys(cat).sort((a, b) => cat[b] - cat[a]).map((k) => bar(k, cat[k], cm)).join('')}</div>`;
}
const viewStokV14 = viewStok;
viewStok = function () {
  const r = S.user && S.user.role; if (r !== 'patron' && r !== 'mudur') return viewStokV14();
  lotSync(); const b = S.stTab === 'maliyet' ? stokMaliyet() : S.stTab === 'uretim' ? stokUretim() : S.stTab === 'sayim' ? stokSayim() : S.stTab === 'fire' ? stokFire() : S.stTab === 'rapor' ? stokRapor() : stokListe();
  return `<div class="stack-lg">${b}</div>`;
};
H.sttab = (el) => { S.stTab = el.dataset.v; render(); };
H.stg = (el) => { S.stGroup = el.dataset.v; render(); };
H.wasteopen = (el) => { S.wasteSid = el.dataset.id; S.stTab = 'fire'; render(); window.scrollTo && window.scrollTo(0, 0); };
function addWaste(st, qty, why, note) {
  const q = Math.min(qty, st.qty); st.qty = r3(st.qty - q);
  WASTE.unshift({ id: 'w' + (++seq), sid: st.id, name: st.name, unit: st.unit, qty: q, why, note: note || '', date: REF_ISO, cost: Math.round(q * (st.cost || 0) * 100) / 100, by: S.user ? S.user.name : '' });
  mv(st, -q, 'fire', 'Fire: ' + why); auditAdd({ type: 'ord', text: 'Fire kaydı: ' + st.name + ' ' + q1(q) + ' ' + st.unit + ' (' + why + ')' });
}
H.wasteadd = () => {
  const g = (id) => document.getElementById(id); const st = stById(g('wf-sid').value); const q = Number(String(g('wf-qty').value).replace(',', '.')); const err = (t) => { g('wf-err').textContent = t; };
  if (!st) return err('Ürün seç.'); if (!(q > 0)) return err('Miktarı yaz.'); if (q > st.qty) return err('Stokta ' + q1(st.qty) + ' ' + st.unit + ' var, daha fazlasını yazamazsın.');
  addWaste(st, q, g('wf-why').value, (g('wf-note').value || '').trim()); S.wasteSid = st.id; render(); toast('Fire kaydedildi.', 'ok');
};
H.lotwaste = (el) => { const l = LOTS.find((x) => x.id === el.dataset.id); if (!l) return; const st = stById(l.sid); if (!st) return; const q = l.qty; LOTS.splice(LOTS.indexOf(l), 1); addWaste(st, q, WHY[0], 'Parti: ' + (l.exp ? isoShort(l.exp) : '')); render(); toast('Fire kaydedildi.', 'ok'); };
H.lotdel = (el) => { const i = LOTS.findIndex((x) => x.id === el.dataset.id); if (i >= 0) { LOTS.splice(i, 1); render(); } };
H.lotadd = (el) => {
  const st = stById(el.dataset.id); const g = (id) => document.getElementById(id); const q = Number(String(g('lq-' + st.id).value).replace(',', '.')); const d = g('ld-' + st.id).value;
  if (!(q > 0) || !d) { toast('Miktar ve son kullanma tarihini yaz.', 'warn'); return; }
  if (q > lotFree(st) + 1e-9) { toast('Parti, tarihi girilmemiş stoktan (' + q1(lotFree(st)) + ') fazla olamaz. Önce stok miktarını artır.', 'warn'); return; }
  LOTS.push({ id: 'l' + (++seq), sid: st.id, qty: q, exp: d, recv: REF_ISO }); render(); toast('Parti eklendi.', 'ok');
};
H.cntstart = () => { S.cnt = { vals: {} }; render(); };
H.cntcancel = () => { S.cnt = null; render(); };
H.cntfinish = () => {
  if (!S.cnt) return; const items = []; Object.keys(S.cnt.vals).forEach((sid) => { const st = stById(sid); const v = S.cnt.vals[sid]; if (!st || v == null || isNaN(v)) return; const diff = r3(v - st.qty); items.push({ sid, name: st.name, unit: st.unit, exp: st.qty, cnt: v, diff, val: Math.round(diff * (st.cost || 0) * 100) / 100 }); });
  S.modal = { type: 'cntsum', items }; renderModal();
};
NEWM.cntsum = (m) => { const ch = m.items.filter((i) => i.diff !== 0); const tot = ch.reduce((a, i) => a + i.val, 0);
  return sheet('Sayım sonucu', `${ch.length ? ch.map((i) => `<div class="logline"><span>${esc(i.name)}<span class="small muted" style="display:block">Sistemde ${q1(i.exp)}, sayılan ${q1(i.cnt)} ${esc(i.unit)}</span></span><span style="text-align:right"><b class="num" style="color:${i.diff < 0 ? 'var(--nar)' : 'var(--yesil)'}">${i.diff > 0 ? '+' : ''}${q1(i.diff)}</b><span class="small muted" style="display:block">${fmt0(i.val)}</span></span></div>`).join('') + `<div class="logline"><b>Toplam fark</b><b class="num">${fmt0(tot)}</b></div>` : '<p class="muted">Fark yok, sayım sistemle tutuyor.</p>'}
  <div class="row wrap" style="margin-top:12px"><button class="btn grow" data-a="cntapply">${ch.length ? 'Stoğu düzelt' : 'Kapat'}</button><button class="btn sec" data-a="closemodal">Geri dön</button></div>`); };
H.cntapply = () => {
  const m = S.modal; if (!m || m.type !== 'cntsum') return; const ch = m.items.filter((i) => i.diff !== 0);
  ch.forEach((i) => { const st = stById(i.sid); if (st) { st.qty = i.cnt; mv(st, i.diff, 'sayim', 'Sayım düzeltmesi'); } });
  if (ch.length) { COUNTLOG.unshift({ id: 'c' + (++seq), date: REF_ISO, by: S.user ? S.user.name : '', items: ch, total: Math.round(ch.reduce((a, i) => a + i.val, 0) * 100) / 100 }); auditAdd({ type: 'ord', text: 'Stok sayımı: ' + ch.length + ' üründe fark' }); }
  S.cnt = null; S.modal = null; render(); toast(ch.length ? 'Stok düzeltildi.' : 'Sayım kapandı.', 'ok');
};
H.sthist = (el) => { S.modal = { type: 'sthist', sid: el.dataset.id, range: '30' }; renderModal(); };
H.hrange = (el) => { if (S.modal && S.modal.type === 'sthist') { S.modal.range = el.dataset.v; renderModal(); } };
NEWM.sthist = (m) => { const st = stById(m.sid); if (!st) return ''; const cut = m.range === 'all' ? null : addDays(REF_ISO, -Number(m.range));
  const rows = STOCKLOG.filter((x) => (x.sid === st.id || (!x.sid && x.name === st.name)) && (!cut || !x.iso || x.iso >= cut));
  return sheet('Hareketler: ' + st.name.split(' (')[0], `<div class="seg" role="group" aria-label="Süre">${[['7', '7 gün'], ['30', '30 gün'], ['all', 'Tümü']].map((x) => `<button data-a="hrange" data-v="${x[0]}" aria-pressed="${m.range === x[0]}">${x[1]}</button>`).join('')}</div>
  <div style="margin-top:10px">${rows.length ? rows.map((x) => `<div class="logline"><span>${esc(x.from)}<span class="small muted" style="display:block">${esc(x.t)}${x.by ? ' · ' + esc(x.by) : ''}</span></span><b class="num" style="color:${x.qty < 0 ? 'var(--nar)' : 'var(--yesil)'}">${x.qty > 0 ? '+' : ''}${q1(x.qty)}</b></div>`).join('') : '<p class="muted">Bu sürede hareket yok.</p>'}</div><p class="small muted" style="margin-top:8px">Şu an ${q1(st.qty)} ${esc(st.unit)} var.</p>`); };
const _och15 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch; const st = el.dataset && el.dataset.id ? stById(el.dataset.id) : null;
  if (ch === 'scat' && st) { st.cat = el.value.trim(); render(); return; }
  if (ch === 'sloc' && st) { st.loc = el.value.trim(); render(); return; }
  if (ch === 'sshelf' && st) { const v = Number(el.value); st.shelf = v > 0 ? v : 0; render(); return; }
  if (ch === 'spkn' && st) { st.packName = el.value.trim(); render(); return; }
  if (ch === 'spkc' && st) { const v = Number(el.value); st.packN = v > 1 ? v : 0; render(); return; }
  if (ch === 'cntv' && S.cnt) { const v = el.value === '' ? null : Number(String(el.value).replace(',', '.')); if (v == null || isNaN(v) || v < 0) delete S.cnt.vals[el.dataset.id]; else S.cnt.vals[el.dataset.id] = v; render(); return; }
  return _och15(e);
};
/* Bugün: SKT uyarısı */
const bugunPatronV14 = bugunPatron;
bugunPatron = function () { const h = bugunPatronV14(); const sk = sktSoon(3); if (!sk.length) return h; const l = sk[0]; const st = stById(l.sid) || { name: '' };
  const t = `<div class="stack">${todo('alert', 'warn', sk.length + ' parti bozulmak üzere', st.name.split(' (')[0] + ' ' + sktTxt(dleft(l.exp)), 'stok')}</div>`;
  return h.replace(/<div class="card stack"><div><h3>Giriş kodu<\/h3>/, t + '<div class="card stack"><div><h3>Giriş kodu</h3>'); };
function stokSheets() {
  const out = [];
  if (WASTE.length) out.push(['Fire', [['Tarih', 'Ürün', 'Miktar', 'Birim', 'Neden', 'Tutar', 'Not']].concat(WASTE.map((w) => [w.date, w.name, w.qty, w.unit, w.why, { n: r2(w.cost) }, w.note])), [12, 26, 10, 10, 22, 12, 24]]);
  if (LOTS.length) out.push(['Partiler', [['Ürün', 'Miktar', 'Son kullanma', 'Kalan gün']].concat(LOTS.map((l) => [(stById(l.sid) || {}).name || '', l.qty, l.exp || '', dleft(l.exp) == null ? '' : dleft(l.exp)])), [26, 10, 14, 10]]);
  if (COUNTLOG.length) out.push(['Sayımlar', [['Tarih', 'Ürün', 'Sistemde', 'Sayılan', 'Fark', 'Tutar']].concat(COUNTLOG.flatMap((c) => c.items.map((i) => [c.date, i.name, i.exp, i.cnt, i.diff, { n: r2(i.val) }]))), [12, 26, 10, 10, 10, 12]]);
  return out;
}
const eSheetsV14 = eSheets; eSheets = function () { return eSheetsV14().concat(stokSheets()); };

/* v16: yoldaki sipariş, otomatik en az seviye, haftalık tüketim profili, üretim planı, barkod, ABC sayım, anomali, toplu giriş */
const DOWN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const dowOf = (iso) => { const a = iso.split('-').map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay(); };
const transitOf = (sid) => ORDERS.filter((o) => o.status === 'gonderildi').reduce((a, o) => a + o.lines.filter((l) => l.sid === sid).reduce((b, l) => b + l.qty, 0), 0);
const stockPlanV15 = stockPlan;
stockPlan = function () {
  const tr = {}; STOCK.forEach((s) => { tr[s.id] = transitOf(s.id); s.qty = r3(s.qty + tr[s.id]); });
  let plan; try { plan = stockPlanV15(); } finally { STOCK.forEach((s) => { s.qty = r3(s.qty - tr[s.id]); }); }
  plan.forEach((p) => { p.transit = tr[p.st.id]; }); return plan;
};
/* satış profili */
function salesProfile() {
  const dates = new Set(SALES.map((s) => s.date)); const byDate = {}; const byProd = {};
  SALES.forEach((s) => { const k = prodKey(s.prod); (byProd[k] = byProd[k] || {})[s.date] = ((byProd[k] || {})[s.date] || 0) + s.qty;
    const rc = RECIPES[k]; if (!rc) return; const d = (byDate[s.date] = byDate[s.date] || {}); Object.entries(rc.items).forEach(([sid, q]) => { d[sid] = (d[sid] || 0) + q * s.qty; }); });
  const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const useDow = {}; STOCK.forEach((st) => { const per = [[], [], [], [], [], [], []]; [...dates].forEach((d) => { per[dowOf(d)].push((byDate[d] && byDate[d][st.id]) || 0); }); const all = mean([].concat(...per)); useDow[st.id] = { all, dow: per.map(mean) }; });
  const prodDow = {}; Object.keys(byProd).forEach((k) => { const per = [[], [], [], [], [], [], []]; [...dates].forEach((d) => { per[dowOf(d)].push(byProd[k][d] || 0); }); prodDow[k] = { all: mean([].concat(...per)), dow: per.map(mean) }; });
  return { days: dates.size, useDow, prodDow };
}
function leftDow(st, prof, qtyEff) {
  const u = prof.useDow[st.id]; if (!u || !(u.all > 0) || prof.days < 14) return null;
  let rem = qtyEff; const d0 = dowOf(REF_ISO);
  for (let i = 0; i < 60; i++) { const use = (u.dow[(d0 + i) % 7] != null ? u.dow[(d0 + i) % 7] : u.all); if (use <= 0) continue; if (rem <= use) return i + rem / use; rem -= use; }
  return Infinity;
}
/* otomatik en az seviye */
function autoMin(p) {
  if (!(p.daily > 0) || !(p.days >= 3 || p.src === 'elle')) return null;
  const offs = offersOf(p.st.id); const lead = offs.length ? Math.min(...offs.map((t) => t.lead)) : 2;
  let v = Math.ceil(p.daily * (lead + 3)); if (p.st.packN > 1) v = Math.ceil(v / p.st.packN) * p.st.packN;
  if (!(v > 0)) return null; const cur = p.st.min || 0; return { v, lead, cur, diff: cur ? Math.abs(v - cur) / cur : 1 };
}
H.minapply = (el) => { const st = stById(el.dataset.id); const p = stockPlan().find((x) => x.st.id === el.dataset.id); const a = p && autoMin(p); if (st && a) { st.min = a.v; render(); toast('En az seviye ' + q1(a.v) + ' oldu.', 'ok'); } };
H.minall = () => { let n = 0; stockPlan().forEach((p) => { const a = autoMin(p); if (a && a.diff > 0.25) { p.st.min = a.v; n++; } }); render(); toast(n + ' ürünün en az seviyesi güncellendi.', 'ok'); };
/* anomaliler */
function anomalies() {
  const out = []; const c7 = addDays(REF_ISO, -7); const c14 = addDays(REF_ISO, -14); const w = {};
  WASTE.forEach((x) => { const o = (w[x.sid] = w[x.sid] || { a: 0, b: 0, name: x.name }); if (x.date > c7) o.a += x.cost; else if (x.date > c14) o.b += x.cost; });
  Object.values(w).forEach((o) => { if (o.a > 0 && (o.b === 0 ? o.a >= 100 : o.a >= o.b * 2 && o.a - o.b >= 50)) out.push(o.name.split(' (')[0] + ' firesi bu hafta ' + fmt0(o.a) + (o.b ? ', önceki hafta ' + fmt0(o.b) : '') + '.'); });
  const loss = {}; COUNTLOG.forEach((c) => c.items.forEach((i) => { if (i.diff < 0) loss[i.name] = (loss[i.name] || 0) + 1; }));
  Object.keys(loss).forEach((n) => { if (loss[n] >= 2) out.push(n.split(' (')[0] + ' son sayımların ' + loss[n] + ' tanesinde eksik çıktı. Kayıp olabilir.'); });
  return out;
}
/* ABC */
function abcList() {
  const plan = stockPlan(); const rows = plan.map((p) => ({ p, v: (p.daily > 0 ? p.daily * 30 : p.st.qty) * (p.st.cost || 0) })).sort((a, b) => b.v - a.v);
  const tot = rows.reduce((a, r) => a + r.v, 0) || 1; let cum = 0;
  return rows.map((r) => { cum += r.v; const share = cum / tot; const cls = (cum - r.v) / tot < 0.7 ? 'A' : (cum - r.v) / tot < 0.9 ? 'B' : 'C'; const freq = cls === 'A' ? 7 : cls === 'B' ? 14 : 30; const last = r.p.st.lastCount || null; const since = last ? -dleft(last) : null; return { st: r.p.st, v: r.v, cls, freq, last, since, due: last == null || since >= freq }; });
}
/* ---- Liste: akıllı öneriler ---- */
const stokListeV15 = stokListe;
stokListe = function () {
  const h = stokListeV15(); const plan = stockPlan(); const marker = '<div class="row wrap" style="gap:10px"><div class="seg" role="group" aria-label="Filtre">';
  const tr = plan.filter((p) => p.transit > 0); const mins = plan.map((p) => ({ p, a: autoMin(p) })).filter((x) => x.a && x.a.diff > 0.25); const an = anomalies();
  if (!tr.length && !mins.length && !an.length) return h;
  const card = `<div class="card stack"><div><h3>Akıllı öneriler</h3></div>
  ${tr.length ? `<div><p class="lbl">Yolda olan siparişler</p>${tr.map((p) => `<div class="logline"><span class="small">${esc(p.st.name)}</span><span class="pill p-info">${q1(p.transit)} ${esc(p.st.unit)} yolda</span></div>`).join('')}<p class="small muted">Yoldaki miktar stoğa sayılır, bu yüzden tekrar sipariş önerilmez.</p></div>` : ''}
  ${mins.length ? `<div><p class="lbl">Alt sınır önerileri</p><p class="small muted" style="margin:0 0 8px">Alt sınır, stok bu miktarın altına inince "Acil" uyarısı veren seviyedir. Kais satış hızına bakıp sınırı yeniden hesapladı.</p>${mins.map((x) => { const st = x.p.st; const u = esc(st.unit); const up = x.a.v > x.a.cur; const d = x.p.daily; const need = x.a.lead + 3; const dTxt = d < 0.1 ? 'günde 0,1\'den az' : 'günde ortalama ' + q1(d); return `<div class="sgx-i"><div class="sgx-h"><b>${esc(st.name)}</b><span class="pill ${up ? 'p-warn' : 'p-info'}">${up ? 'Sınırı yükselt' : 'Sınırı düşür'}</span></div><div class="sgx-t">Alt sınır <b>${q1(x.a.cur)} ${u}</b> yerine <b>${q1(x.a.v)} ${u}</b> olsun.</div><div class="sgx-w">Neden: ${dTxt} ${u} tükeniyor. Sipariş ${x.a.lead} günde geliyor, üstüne 3 gün yedek: ${need} günlük ihtiyaç ≈ ${q1(x.a.v)} ${u}.${!up && d < 0.5 ? ' Tüketim çok düşük görünüyor, satış verin eksikse bu öneriyi uygulama.' : ''}</div><button class="btn sm sec" data-a="minapply" data-id="${st.id}">${up ? 'Yükselt' : 'Düşür'}</button></div>`; }).join('')}<div class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="minall">Hepsini uygula (${mins.length})</button></div></div>` : ''}
  ${an.length ? `<div><p class="lbl">Dikkat çeken durumlar</p>${an.map((t) => `<div class="callout warn" style="margin:6px 0">${ic('alert')}<div>${esc(t)}</div></div>`).join('')}</div>` : ''}</div>`;
  return h.includes(marker) ? h.replace(marker, card + marker) : h;
};
/* satır: yolda rozeti, haftalık profil, otomatik en az, barkod */
const stokRowHTML15V15 = stokRowHTML15;
stokRowHTML15 = function (p) {
  let h = stokRowHTML15V15(p); const st = p.st;
  if (p.transit > 0) h = h.replace(/(<span class="pill p-(?:bad|warn|ok)">(?:Acil|Azalıyor|Yeterli)<\/span>)/, `$1<span class="pill p-info">Yolda ${q1(p.transit)}</span>`);
  const prof = salesProfile(); const ld = leftDow(st, prof, st.qty + p.transit); const a = autoMin(p); const u = prof.useDow[st.id];
  let add = '';
  if (ld != null) add += `<p class="small" style="margin-top:8px">Haftanın gününe göre ${ld === Infinity ? 'uzun süre yeter' : '~' + (ld < 10 ? q1(ld) : Math.round(ld)) + ' gün yeter'}.</p>`;
  if (u && prof.days >= 14 && u.all > 0) { const mx = Math.max(...u.dow.map((x) => x || 0), 0.0001); add += `<div class="row" style="gap:4px;align-items:flex-end;height:42px;margin:6px 0">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div style="flex:1;text-align:center"><div style="height:${Math.max(3, Math.round(((u.dow[d] || 0) / mx) * 30))}px;background:var(--cini);border-radius:3px"></div><span class="small muted" style="font-size:10px">${DOWN[d].slice(0, 2)}</span></div>`).join('')}</div>`; }
  if (a && a.diff > 0.25) add += `<p class="small" style="margin-top:6px">Önerilen en az seviye: <b>${q1(a.v)}</b> (şimdi ${q1(a.cur)}). <button class="btn sm sec" data-a="minapply" data-id="${st.id}">Uygula</button></p>`;
  if (add) h = h.replace('<p class="small muted" style="margin-top:8px">Tüketim kaynağı:', add + '<p class="small muted" style="margin-top:8px">Tüketim kaynağı:');
  h = h.replace('<p class="lbl" style="margin-top:10px">Partiler ve', `<label class="small muted" style="display:block;margin-top:8px">Barkod<input type="text" value="${esc(st.code || '')}" data-ch="scode" data-id="${st.id}" placeholder="Okut veya yaz" aria-label="${esc(st.name)} barkod"></label><p class="lbl" style="margin-top:10px">Partiler ve`);
  return h;
};
/* ---- Üretim sekmesi ---- */
function stokUretim() {
  const prof = salesProfile(); const plan = stockPlan(); const qOf = (sid) => { const p = plan.find((x) => x.st.id === sid); return p ? p.st.qty + p.transit : 0; };
  const keys = Object.keys(RECIPES); const tmr = addDays(REF_ISO, 1); const td = dowOf(tmr);
  const can = keys.map((k) => { const rc = RECIPES[k]; let mn = Infinity; let lim = null; Object.entries(rc.items).forEach(([sid, q]) => { if (!(q > 0)) return; const n = qOf(sid) / q; if (n < mn) { mn = n; lim = sid; } }); const pd = prof.prodDow[k]; const daily = pd ? pd.all : 0; return { k, rc, n: mn === Infinity ? 0 : Math.floor(mn), lim, daily }; });
  const need = {}; const exp = [];
  keys.forEach((k) => { const pd = prof.prodDow[k]; if (!pd) return; const e = prof.days >= 14 && pd.dow[td] != null ? pd.dow[td] : pd.all; if (!(e > 0)) return; const q = Math.round(e); exp.push({ k, name: RECIPES[k].name, q }); Object.entries(RECIPES[k].items).forEach(([sid, u]) => { need[sid] = (need[sid] || 0) + u * q; }); });
  const short = Object.keys(need).map((sid) => ({ st: stById(sid), need: need[sid], have: qOf(sid) })).filter((x) => x.st && x.need > x.have + 1e-9);
  return `${stokHead('Elindeki malzemeyle ne yapılır, yarın ne gerekir.')}
  <div class="card stack"><div><h3>Elindekiyle kaç adet yapılır</h3><p class="muted small" style="margin-top:2px">Reçetelerdeki malzemeye ve stoğa göre. Yoldaki siparişler dahil.</p></div>
  ${can.length ? can.map((x) => `<div class="logline"><span>${esc(x.rc.name)}<span class="small muted" style="display:block">${x.lim ? 'Sınırlayan: ' + esc((stById(x.lim) || { name: '' }).name.split(' (')[0]) : ''}${x.daily > 0 ? ' · günde ort. ' + q1(x.daily) + ' satılıyor' : ''}</span></span><span class="row" style="gap:6px"><b class="num">${fq(x.n)} adet</b>${x.daily > 0 ? `<span class="pill ${x.n / x.daily < 1.5 ? 'p-bad' : x.n / x.daily < 3 ? 'p-warn' : 'p-ok'}">~${q1(x.n / x.daily)} gün</span>` : ''}</span></div>`).join('') : '<p class="small muted">Henüz reçete yok. Satışlar sayfasından reçete ekle.</p>'}</div>
  <div class="card stack"><div><h3>Yarın için plan (${DOWN[td]})</h3><p class="muted small" style="margin-top:2px">${prof.days >= 14 ? 'Aynı günlerin ortalamasına göre tahmin.' : 'Günlük ortalamaya göre tahmin. İki haftalık satış verisinden sonra haftanın gününe göre hesaplanır.'}</p></div>
  ${exp.length ? `<p class="lbl">Tahmini satış</p>${exp.map((e) => `<div class="logline"><span class="small">${esc(e.name)}</span><b class="num">${fq(e.q)} adet</b></div>`).join('')}
  <p class="lbl" style="margin-top:8px">Malzeme durumu</p>${short.length ? short.map((x) => `<div class="callout warn" style="margin:6px 0">${ic('alert')}<div><b>${esc(x.st.name.split(' (')[0])}</b> eksik: ${q1(x.need)} lazım, ${q1(x.have)} var (${q1(x.need - x.have)} ${esc(x.st.unit)} eksik).</div></div>`).join('') + `<div class="row wrap"><button class="btn sm" data-a="stkgo">Satın almaya git</button></div>` : `<div class="callout">${ic('check')}<div>Yarınki tahmini satış için malzeme yeter.</div></div>`}` : '<p class="small muted">Tahmin için satış verisi yok. Satışlar sayfasından günlük satış dosyası yükle.</p>'}</div>`;
}
/* ---- Sayım: ABC, barkod ---- */
const stokSayimV15 = stokSayim;
stokSayim = function () {
  const h = stokSayimV15(); const abc = abcList(); const due = abc.filter((x) => x.due);
  if (!S.cnt) {
    const card = `<div class="card stack"><div><h3>Bu hafta sayılacaklar</h3><p class="muted small" style="margin-top:2px">Değeri yüksek ürünler (A) haftalık, orta (B) iki haftada bir, düşük (C) ayda bir sayılır.</p></div>
    ${due.length ? due.map((x) => `<div class="logline"><span class="small">${esc(x.st.name)}<span class="muted" style="display:block">${x.last ? 'Son sayım ' + esc(isoShort(x.last)) : 'Hiç sayılmadı'}</span></span><span class="pill ${x.cls === 'A' ? 'p-bad' : x.cls === 'B' ? 'p-warn' : 'p-mute'}">${x.cls}</span></div>`).join('') + `<div class="row wrap" style="margin-top:6px"><button class="btn" data-a="cntdue">Sadece bunları say</button></div>` : '<p class="small muted">Bu hafta sayılması gereken ürün yok.</p>'}</div>`;
    return h.replace('<div class="callout">', card + '<div class="callout">');
  }
  const bc = `<div class="card stack"><div><h3>Barkodla bul</h3><p class="muted small" style="margin-top:2px">Barkodu yaz, el okuyucuyla okut ya da kamerayı kullan. Ürün bulunur ve sayı kutusuna gidilir.</p></div><div class="row wrap" style="gap:8px"><input type="text" class="grow" style="min-width:150px" id="bc-in" placeholder="Barkod" data-ch="bcin" aria-label="Barkod"><button class="btn sec" data-a="bcfind">Bul</button>${'BarcodeDetector' in (typeof window !== 'undefined' ? window : {}) ? '<button class="btn" data-a="scanstart">Kamerayla okut</button>' : ''}</div></div>`;
  return h.replace('<div class="card flush">', bc + '<div class="card flush">');
};
H.cntdue = () => { S.cntOnly = abcList().filter((x) => x.due).map((x) => x.st.id); S.cnt = { vals: {} }; render(); };
const _cntcancel16 = H.cntcancel; H.cntcancel = () => { S.cntOnly = null; _cntcancel16(); };
const _cntapply16 = H.cntapply;
H.cntapply = () => { const ids = S.cnt ? Object.keys(S.cnt.vals) : []; _cntapply16(); if (!S.cnt) { ids.forEach((id) => { const st = stById(id); if (st) st.lastCount = REF_ISO; }); S.cntOnly = null; render(); } };
function codeFind(c) { c = String(c || '').trim(); return c ? STOCK.find((s) => s.code && String(s.code).trim() === c) : null; }
function bcHandle(code) {
  const st = codeFind(code); if (st) { S.cntFocus = st.id; render(); const e = document.querySelector && document.querySelector('[data-ch="cntv"][data-id="' + st.id + '"]'); if (e && e.focus) { e.focus(); if (e.scrollIntoView) e.scrollIntoView({ block: 'center' }); } toast('Bulundu: ' + st.name + '. Sayılan miktarı yaz.', 'ok'); return; }
  S.modal = { type: 'bcassign', code: String(code).trim() }; renderModal();
}
H.bcfind = () => { const e = document.getElementById('bc-in'); const c = e && e.value; if (!c) { toast('Barkodu yaz.', 'warn'); return; } bcHandle(c); };
NEWM.bcassign = (m) => sheet('Barkod bulunamadı', `<p class="muted">${esc(m.code)} barkodu henüz hiçbir ürüne bağlı değil. Hangi ürün?</p><div class="field"><label for="bc-sel">Ürün</label><select id="bc-sel">${STOCK.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div><button class="btn" data-a="bcsave">Bağla ve devam et</button>`);
H.bcsave = () => { const m = S.modal; const st = stById(document.getElementById('bc-sel').value); if (!st) return; st.code = m.code; S.modal = null; renderModal(); bcHandle(m.code); };
let SCAN = { stream: null, on: false };
function scanStop() { SCAN.on = false; try { if (SCAN.stream) SCAN.stream.getTracks().forEach((t) => t.stop()); } catch (e) {} SCAN.stream = null; }
const _closemodal16 = H.closemodal; H.closemodal = () => { scanStop(); _closemodal16(); };
NEWM.scan = () => sheet('Kamerayı barkoda tut', `<video id="scan-v" playsinline muted style="width:100%;border-radius:12px;background:#000"></video><p class="small muted" id="scan-t" style="margin-top:8px">Kamera açılıyor…</p>`);
H.scanstart = async () => {
  S.modal = { type: 'scan' }; renderModal();
  try {
    const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
    SCAN.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); SCAN.on = true;
    const v = document.getElementById('scan-v'); v.srcObject = SCAN.stream; await v.play(); const t = document.getElementById('scan-t'); if (t) t.textContent = 'Barkodu çerçeveye getir.';
    const loop = async () => { if (!SCAN.on) return; try { const r = await det.detect(v); if (r && r[0] && r[0].rawValue) { const code = r[0].rawValue; scanStop(); S.modal = null; renderModal(); bcHandle(code); return; } } catch (e) {} setTimeout(loop, 350); };
    loop();
  } catch (e) { scanStop(); const t = document.getElementById('scan-t'); if (t) t.textContent = 'Kamera açılamadı. İzin verdiğinden emin ol ya da barkodu elle yaz.'; }
};
