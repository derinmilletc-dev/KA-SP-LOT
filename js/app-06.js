/* ===== v69: Rezervasyon kartı, sıkı yerleşim ===== */
rzCard = function (r) {
  const h = rzHist(r.phone, r.id); const st = RZ_ST[r.st]; const a = [];
  const b = (s, t, c) => `<button class="btn sm${c ? ' ' + c : ''}" data-a="rzst" data-id="${r.id}" data-s="${s}">${t}</button>`;
  if (r.st === 'onay') a.push(b('geldi', 'Geldi', ''), b('gelmedi', 'Gelmedi', 'sec'), b('iptal', 'İptal', 'sec rzc-no'));
  if (r.st === 'geldi') a.push(b('bitti', 'Masa boşaldı', ''));
  if (['gelmedi', 'iptal'].includes(r.st)) a.push(b('onay', 'Geri al', 'sec'));
  const wa = r.phone && rzActive(r) ? rzWa(r, rzMsg(r, 'hat')) : '';
  const end = fromMin((toMin(r.time) + r.dur) % 1440);
  const meta = [`${r.n} kişi`, r.tids.length ? 'Masa ' + esc(rzNames(r.tids)) : 'masa yok'].concat(r.src ? [esc(r.src)] : []);
  const tag = h.miss ? `<span class="rzc-tg bad">${h.miss} kez gelmedi</span>` : h.n >= 2 ? `<span class="rzc-tg ok">${h.n} kez geldi</span>` : '';
  const links = [wa ? `<a href="${wa}" target="_blank" rel="noopener">WhatsApp</a>` : '', r.phone ? `<button data-a="rzcopy" data-id="${r.id}">Mesajı kopyala</button>` : '', `<button data-a="rzedit" data-id="${r.id}">Düzenle</button>`].filter(Boolean).join('');
  return `<div class="card rzc"><div class="rzc-h"><div class="rzc-n"><b>${esc(r.name)}</b><span class="rzc-t">${esc(r.time)}–${esc(end)}</span></div><span class="pill ${st[0]}">${st[1]}</span></div>
  <div class="rzc-m">${meta.map((x) => `<span>${x}</span>`).join('')}${tag}</div>
  ${r.note ? `<p class="rzc-nt">${ic('info', 14)}<span>${esc(r.note)}</span></p>` : ''}
  ${a.length ? `<div class="rzc-a">${a.join('')}</div>` : ''}
  <div class="rzc-l">${links}</div></div>`;
};
/* ===== v70: Kais AI asistan: geniş veri, yeni eylemler, hafıza ===== */
const AI_TYPES = ['fatura_kaydet', 'excel_indir', 'siparis_olustur', 'stok_guncelle', 'duyuru_gonder', 'rezervasyon_ekle', 'rezervasyon_durum', 'izin_karar', 'sozlesme_olustur', 'hafiza_kaydet'];
const AI_STATE = { none: 'henüz gelmedi', working: 'çalışıyor', break: 'molada', pending: 'kaydı onay bekliyor', out: 'çıktı', done: 'çıktı' };
const aiMemKey = () => 'kp_aimem_' + ((SBS.biz && SBS.biz.id) || 'x') + '_' + ((S.user && S.user.id) || 'u');
const aiMemGet = () => { try { const o = JSON.parse(localStorage.getItem(aiMemKey()) || 'null'); return o && typeof o === 'object' ? o : { msgs: [], notes: [] }; } catch (e) { return { msgs: [], notes: [] }; } };
const aiMemSet = (o) => { try { localStorage.setItem(aiMemKey(), JSON.stringify(o)); } catch (e) {} };
function aiMemLoad() {
  const k = aiMemKey(); if (AIC.memKey === k) return; AIC.memKey = k; const m = aiMemGet(); AIC.notes = m.notes || [];
  if (!AIC.msgs.length) AIC.msgs = (m.msgs || []).map((x) => ({ role: x.role, content: x.content, att: x.att, acts: (x.acts || []).map((a) => (a.st === 'open' ? { ...a, st: 'skip' } : a)) }));
}
function aiMemSave() { const m = aiMemGet(); aiMemSet({ notes: AIC.notes || m.notes || [], msgs: AIC.msgs.slice(-60).map((x) => ({ role: x.role, content: x.content, att: x.att, acts: (x.acts || []).map((a) => ({ type: a.type, args: a.args, st: a.st, msg: a.msg })) })) }); }
const aiCtxV69 = aiContext;
aiContext = function () {
  const c = aiCtxV69(); const r = S.user.role; const mgr = ['patron', 'mudur'].includes(r); const t = (f) => { try { return f(); } catch (e) { return undefined; } };
  c.simdi = hhmm(new Date()); c.hafiza_notlari = (AIC.notes || []).slice(-20).concat((typeof KR !== 'undefined' ? KR.rules : []).map((x) => 'Şirket kuralı: ' + x.t));
  if (mgr) {
    c.ekip = t(() => EMP_IDS.map((id) => { const u = byId(id); const a = ATT[id] || {}; const p = PROFILES[id] || {}; const l = izLeft(id); const o = { id, ad: u.name, gorev: u.title || '', durum: AI_STATE[a.state] || a.state, giris: a.inAt || null, mola_dk: a.breakMin || 0, gec_kalma_dk: a.late || 0, kalan_yillik_izin_gun: l ? l.left : null, ise_giris: p.hire || null }; if (r === 'patron') { o.maas = p.salary; o.maas_turu = p.stype; } return o; }));
    c.izin_talepleri = t(() => LVREQ.slice(-20).map((q) => ({ id: q.id, kisi: (byId(q.uid) || {}).name, tur: q.type, tarih: q.txt, gun: q.days, durum: q.status, karsi_teklif: q.counter ? q.counter.txt : null, son_mesaj: q.thread && q.thread.length ? q.thread[q.thread.length - 1].text : '' })));
    c.duyurular = t(() => MSGS.slice(-8).map((m) => ({ tur: m.type, baslik: m.title, zaman: m.time, alici: m.to.length, okuyan: m.reads.filter((x) => m.to.includes(x)).length, kabul: m.type === 'mesai' ? m.to.filter((x) => m.res[x] === 'kabul').length : undefined, red: m.type === 'mesai' ? m.to.filter((x) => m.res[x] === 'red').length : undefined })));
    c.rezervasyonlar = t(() => RESV.filter((x) => x.date >= REF_ISO && x.date <= addDays(REF_ISO, 14) && rzActive(x)).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)).slice(0, 40).map((x) => ({ id: x.id, ad: x.name, kisi: x.n, tarih: x.date, saat: x.time, sure_dk: x.dur, durum: x.st, masa: rzNames(x.tids), not: x.note || '' })));
    c.masalar = t(() => ({ acilis: RCFG.open, kapanis: RCFG.close, liste: TABLES.map((x) => ({ id: x.id, ad: x.name, kapasite: x.cap, bolge: x.zone })) }));
    c.izinli_ve_mola = t(() => LEAVES.slice(-15).map((x) => ({ kisi: (byId(x.uid) || {}).name, tur: x.type, gun: x.days, tarih: x.txt || x.date })));
  } else if (r === 'calisan') {
    c.ben = t(() => { const id = S.user.id; const a = ATT[id] || {}; const l = izLeft(id); return { durum: AI_STATE[a.state] || a.state, giris: a.inAt || null, mola_dk: a.breakMin || 0, kalan_yillik_izin_gun: l ? l.left : null, izin_taleplerim: LVREQ.filter((q) => q.uid === id).map((q) => ({ tarih: q.txt, gun: q.days, durum: q.status })) }; });
  }
  if (mgr || r === 'muhasebeci') {
    c.tedarikciler = t(() => SUPPLIERS.map((sp) => ({ id: sp.id, ad: sp.name, teslim_gun: sp.lead, mesafe_km: sgKm(sp) == null ? null : Math.round(sgKm(sp) * 10) / 10, teslimat_bolgesi_icinde: !sgOut(sp), simdi_acik: sgOpen(sp) ? sgOpen(sp).open : null, tahmini_teslim: sgEta(sp) ? sgEta(sp).txt : null, odeme_vade_gun: sp.prof ? sp.prof.pay_terms || 0 : null, uygunluk_puani: sgScore(sp).v, min_siparis: sp.minAmt, fiyatlar: Object.entries(sp.items || {}).map(([sid, pr]) => ({ urun: (stById(sid) || {}).name, birim_fiyat: pr })).filter((x) => x.urun) })));
    c.tedarikci_performans = t(() => supPerf().map((x) => ({ ad: x.sp.name, siparis: x.n, zamaninda_yuzde: x.ontime == null ? null : Math.round(x.ontime * 100), ort_teslim_gun: x.avgLead == null ? null : Math.round(x.avgLead * 10) / 10, fiyat_degisimi_yuzde: x.price == null ? null : Math.round(x.price), puan: x.score })));
    c.fiyat_artislari = t(() => priceAlerts().slice(0, 8).map((i) => ({ urun: i.st.name, artis_yuzde: Math.round(i.pct), son_satici: i.last && i.last.who })));
  }
  let s = JSON.stringify(c); if (s.length > 44000) { ['izinli_ve_mola', 'duyurular', 'recete_marji', 'defter'].forEach((k) => { if (JSON.stringify(c).length > 44000) delete c[k]; }); }
  return c;
};
aiAsk = async function (text) {
  aiMemLoad(); const mode = AIC.mode; AIC.mode = null; const c = sbClient(); AIC.err = ''; const atts = AIC.files.slice(); AIC.files = [];
  AIC.msgs.push({ role: 'user', content: text, att: atts.map((a) => a.name) }); AIC.busy = true; render();
  try {
    if (!c || !SBS.user || !SBS.biz) throw new Error('Kais AI için bulut hesabına giriş yapmalısın.');
    const r = await c.functions.invoke('kais-ai', { body: { business_id: SBS.biz.id, mode: mode || undefined, messages: AIC.msgs.slice(-20).map((m) => ({ role: m.role, content: m.content })), context: aiContext(), attachments: atts.map((a) => ({ type: a.type, media_type: a.media_type, data: a.data })) } });
    if (r.error) { let m = ''; try { m = (await r.error.context.json()).error; } catch (e) {} throw new Error(m || (/not found|404|FunctionsFetch/i.test(String(r.error.message)) ? 'Kais AI sunucusu kurulmamış. Kurulum adımlarını uygula.' : 'Kais AI şu an yanıt vermedi.')); }
    if (r.data && r.data.error) throw new Error(r.data.error);
    const acts = ((r.data && r.data.actions) || []).filter((a) => a && AI_TYPES.includes(a.type)).map((a) => ({ type: a.type, args: a.args || {}, st: 'open' }));
    acts.forEach((a) => { if (a.type === 'hafiza_kaydet') { const n = String(a.args.not || '').trim().slice(0, 300); if (n) { AIC.notes = (AIC.notes || []).concat([n]).slice(-30); a.st = 'done'; a.msg = 'Hafızaya kaydettim: ' + n; } else a.st = 'skip'; } });
    AIC.msgs.push({ role: 'assistant', content: (r.data && r.data.reply) || 'Yanıt gelmedi.', acts });
  } catch (e) { AIC.err = e.message || 'Hata'; AIC.msgs.pop(); AIC.draft = text; AIC.files = atts; AIC.mode = mode || null; }
  AIC.busy = false; aiMemSave(); render(); const el = document.getElementById('ai-end'); if (el && el.scrollIntoView) el.scrollIntoView();
};
const aiClearV69 = H.aiclear; H.aiclear = () => { aiClearV69(); AIC.memKey = aiMemKey(); aiMemSave(); };
H.aimemclr = () => { AIC.notes = []; aiMemSave(); render(); toast('Hafıza notları silindi.', 'ok'); };
['patron', 'mudur'].forEach((k) => { AI_Q[k] = ['Kim molada, kim geç kaldı?', 'Bekleyen izin taleplerini özetle', 'Tedarikçileri karşılaştır', 'Yarın 20:00 için 4 kişilik rezervasyon ekle', 'Herkese "Cuma stok sayımı var" duyurusu gönder', 'Yeni çalışan için sözleşme hazırla'].concat(AI_Q[k].slice(0, 2)); });
AI_Q.calisan = AI_Q.calisan.concat(['Kalan yıllık iznim kaç gün?']);
const aiPeople = (a) => { const l = Array.isArray(a) ? a : a ? [a] : []; if (!l.length || l.some((x) => /herkes|hepsi|tüm|tum|ekip/i.test(String(x)))) return EMP_IDS.slice(); const out = []; l.forEach((x) => { const s = String(x).toLocaleLowerCase('tr'); const id = EMP_IDS.find((i) => i === x || (byId(i).name || '').toLocaleLowerCase('tr') === s) || EMP_IDS.find((i) => (byId(i).name || '').toLocaleLowerCase('tr').includes(s)); if (id && !out.includes(id)) out.push(id); }); return out; };
const aiDoneCard = (a) => `<div class="ai-ok">${ic('check', 18)}<span>${esc(a.msg || 'Tamamlandı.')}</span></div>`;
const aiHead = (ico, t, s) => `<div class="ai-ah"><span>${ic(ico, 20)}</span><div><b>${t}</b><small>${s}</small></div></div>`;
const aiBtns = (i, j, ok, no) => `<div class="ai-bt"><button class="btn sm" data-a="aiact2" data-i="${i}" data-j="${j}">${ok}</button><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">${no || 'Vazgeç'}</button></div>`;
function aiContractD(g) { const hire = /^\d{4}-\d{2}-\d{2}$/.test(g.baslangic || '') ? g.baslangic : ''; return { name: String(g.ad_soyad || '').trim(), pos: String(g.gorev || '').trim(), hire, salary: Number(g.maas) > 0 ? Number(g.maas) : 0, stype: g.maas_turu === 'brut' ? 'brut' : 'net', hours: Number(g.haftalik_saat) > 0 ? Number(g.haftalik_saat) : 45, trial: g.deneme_ay != null && g.deneme_ay !== '' && Number(g.deneme_ay) >= 0 ? Number(g.deneme_ay) : 2, payday: 30 }; }
function aiContractCard(a, i, j) {
  const d = aiContractD(a.args); const body = contractText(d); const parts = body.split('\n\n'); const miss = [!d.pos && 'görev', !d.hire && 'başlangıç tarihi', !d.salary && 'maaş'].filter(Boolean);
  const row = (k, v) => `<div><small>${k}</small><b>${esc(v || '________')}</b></div>`;
  return `<div class="ai-card ai-doc">${aiHead('file', 'İş sözleşmesi taslağı', 'Kontrol et, taslak olarak kaydet ya da PDF al')}
  <div class="ai-paper"><div class="ai-pt">İŞ SÖZLEŞMESİ</div><div class="ai-pp"><div><small>İşveren</small><b>${esc(BIZ)}</b></div><div><small>Çalışan</small><b>${esc(d.name || '________')}</b></div></div>
  <div class="ai-pk">${row('Görev', d.pos)}${row('Başlangıç', d.hire ? isoTxt(d.hire) : '')}${row('Ücret', d.salary ? fmt(d.salary) + (d.stype === 'brut' ? ' brüt' : ' net') : '')}${row('Haftalık süre', d.hours + ' saat')}${row('Deneme', d.trial + ' ay')}${row('Ödeme günü', 'Her ayın ' + d.payday + '. günü')}</div>
  <details><summary>Tüm maddeleri gör</summary>${parts.slice(2, -2).map((p) => `<p>${esc(p).replace(/^(Madde \d+ - [^\n]+)\n/, '<b>$1</b><br>')}</p>`).join('')}</details>
  <div class="ai-sg"><span>İşveren imzası</span><span>Çalışan imzası</span></div></div>
  ${miss.length ? `<div class="ai-wn">${ic('alert', 16)}<span>Yazılmadığı için boş bıraktım: ${miss.join(', ')}. Maaş net mi brüt mü belirtilmediyse net varsaydım.</span></div>` : ''}
  <div class="ai-bt"><button class="btn sm" data-a="aiact2" data-i="${i}" data-j="${j}" data-k="save">Taslak olarak kaydet</button><button class="btn sm sec" data-a="aiact2" data-i="${i}" data-j="${j}" data-k="pdf">PDF / Yazdır</button><button class="btn sm sec" data-a="aiact2" data-i="${i}" data-j="${j}" data-k="copy">Kopyala</button></div><p class="ai-nt">Bu metin taslaktır. İmzadan önce iş hukukçusu kontrol etmelidir.</p></div>`;
}
const aiCardV69 = aiActCard;
aiActCard = function (a, i, j) {
  if (!['duyuru_gonder', 'rezervasyon_ekle', 'rezervasyon_durum', 'izin_karar', 'sozlesme_olustur', 'hafiza_kaydet'].includes(a.type)) return aiCardV69(a, i, j);
  if (a.st === 'done') return aiDoneCard(a); if (a.st === 'skip') return `<div class="small muted">Vazgeçildi.</div>`;
  const g = a.args || {}; const id = (k) => `aa-${i}-${j}-${k}`;
  if (a.type === 'sozlesme_olustur') return aiContractCard(a, i, j);
  if (a.type === 'duyuru_gonder') {
    const to = aiPeople(g.alicilar); const mesai = g.tur === 'mesai';
    if (!to.length) return `<div class="callout warn">${ic('alert')}<div>Alıcı bulunamadı. Kimlere gideceğini yaz.</div></div>`;
    return `<div class="ai-card">${aiHead(mesai ? 'clock' : 'megaphone', mesai ? 'Mesai teklifi' : 'Duyuru', to.length === EMP_IDS.length ? 'Herkese gidecek' : to.map((x) => esc(byId(x).name)).join(', '))}
    <div class="field"><label for="${id('t')}">Başlık</label><input id="${id('t')}" type="text" value="${esc(g.baslik || '')}"></div>
    <div class="field"><label for="${id('b')}">Mesaj</label><textarea id="${id('b')}">${esc(g.mesaj || '')}</textarea></div>
    ${mesai ? `<div class="row wrap"><div class="field grow"><label for="${id('h')}">Ek süre (saat)</label><input id="${id('h')}" type="text" inputmode="decimal" value="${esc(String(g.saat || 1))}"></div><div class="field grow"><label for="${id('p')}">Kişi başı ek ücret (₺)</label><input id="${id('p')}" type="text" inputmode="decimal" value="${esc(String(g.ucret == null ? 0 : g.ucret))}"></div></div>` : ''}
    ${aiBtns(i, j, mesai ? 'Teklifi gönder' : 'Duyuruyu gönder')}</div>`;
  }
  if (a.type === 'rezervasyon_ekle') {
    const m = { date: g.tarih, time: g.saat, dur: Number(g.sure_dk) > 0 ? Number(g.sure_dk) : 90, n: Number(g.kisi), tid: 'auto' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || '') || m.date < REF_ISO || !/^\d{1,2}:\d{2}$/.test(m.time || '') || !(m.n >= 1)) return `<div class="callout warn">${ic('alert')}<div>Rezervasyon için tarih, saat ve kişi sayısı eksik ya da geçersiz.</div></div>`;
    const c = rzCheck(m);
    return `<div class="ai-card">${aiHead('cal', 'Rezervasyon', esc(rzDayName(m.date)) + ' · ' + esc(m.time))}
    <div class="ai-pk"><div><small>Misafir</small><b>${esc(g.ad || '—')}</b></div><div><small>Kişi</small><b>${m.n}</b></div><div><small>Süre</small><b>${m.dur} dk</b></div><div><small>Masa</small><b>${c.res ? esc(rzNames(c.res)) : 'yok'}</b></div></div>
    ${g.not ? `<p class="ai-nt">Not: ${esc(g.not)}</p>` : ''}
    ${c.res ? aiBtns(i, j, 'Rezervasyonu ekle') : `<div class="ai-wn">${ic('alert', 16)}<span>${esc(c.msg || 'Bu saatte uygun masa yok.')}${c.alt.length ? ' Uygun saatler: ' + c.alt.join(', ') + '.' : ''}</span></div><div class="ai-bt"><button class="btn sm sec" data-a="aiskip" data-i="${i}" data-j="${j}">Kapat</button></div>`}</div>`;
  }
  if (a.type === 'rezervasyon_durum') {
    const r = RESV.find((x) => x.id === g.rezervasyon_id); const lab = { geldi: 'Geldi', gelmedi: 'Gelmedi', iptal: 'İptal et', bitti: 'Masa boşaldı', onay: 'Onayla' }[g.durum];
    if (!r || !lab) return `<div class="callout warn">${ic('alert')}<div>Rezervasyon bulunamadı.</div></div>`;
    return `<div class="ai-card">${aiHead('cal', 'Rezervasyon durumu', esc(r.name) + ' · ' + esc(r.time))}<p class="ai-nt">Durum şuna çevrilecek: <b>${lab}</b></p>${aiBtns(i, j, lab)}</div>`;
  }
  if (a.type === 'izin_karar') {
    const q = LVREQ.find((x) => x.id === g.talep_id); if (!q || !['bekliyor', 'yanit'].includes(q.status)) return `<div class="callout warn">${ic('alert')}<div>Karar bekleyen böyle bir izin talebi yok.</div></div>`;
    const ok = g.karar !== 'reddet'; const e = lrEff(q);
    return `<div class="ai-card">${aiHead('clock', 'İzin talebi', esc((byId(q.uid) || {}).name) + ' · ' + esc(e.txt) + ' · ' + e.days + ' gün')}<p class="ai-nt">${ok ? 'Onay ekranını açarım, kesintiyi ve türü sen kontrol edip kaydedersin.' : 'Red için açıklama yazman gerekir, ekranı açarım.'}</p>${g.neden ? `<p class="ai-nt">Önerim: ${esc(g.neden)}</p>` : ''}${aiBtns(i, j, ok ? 'Onay ekranını aç' : 'Red ekranını aç')}</div>`;
  }
  return '';
};
H.aiact2 = async (el) => {
  const a = ((AIC.msgs[+el.dataset.i] || {}).acts || [])[+el.dataset.j]; if (!a || a.st !== 'open') return;
  const g = a.args || {}; const gv = (k) => (document.getElementById(`aa-${el.dataset.i}-${el.dataset.j}-${k}`) || {}).value; const done = (m) => { a.st = 'done'; a.msg = m; aiMemSave(); render(); };
  const need = (roles) => { if (!roles.includes(S.user.role)) { toast('Bu işlem için yetkin yok.', 'warn'); return false; } return !locked(); };
  if (a.type === 'duyuru_gonder') {
    if (!need(['patron', 'mudur'])) return; const to = aiPeople(g.alicilar); const title = (gv('t') || '').trim(); const body = (gv('b') || '').trim(); const mesai = g.tur === 'mesai';
    if (!title || !body) { toast('Başlık ve mesaj boş olamaz.', 'warn'); return; }
    const m = { id: 'm' + ++seq, type: mesai ? 'mesai' : 'duyuru', title, body, to, time: 'Bugün ' + hhmm(new Date()), reads: [], res: {} };
    if (mesai) { const h = trNum(gv('h')); const p = trNum(gv('p')); if (!(h > 0) || !(p >= 0)) { toast('Süre ve ücreti kontrol et.', 'warn'); return; } m.hours = String(h); m.pay = String(p); }
    MSGS.push(m); done((mesai ? 'Mesai teklifi ' : 'Duyuru ') + to.length + ' kişiye gönderildi.'); return;
  }
  if (a.type === 'rezervasyon_ekle') {
    if (!need(['patron', 'mudur'])) return; const m = { date: g.tarih, time: g.saat, dur: Number(g.sure_dk) > 0 ? Number(g.sure_dk) : 90, n: Number(g.kisi), tid: 'auto' }; const c = rzCheck(m);
    if (!c.res) { toast(c.msg || 'Bu saatte uygun masa yok.', 'warn'); return; }
    RESV.push({ id: 'r' + (++seq), name: String(g.ad || 'Misafir').trim(), phone: String(g.telefon || '').trim(), n: m.n, date: m.date, time: m.time, dur: m.dur, tids: c.res, src: 'Kais AI', note: String(g.not || ''), st: 'onay', by: S.user.id });
    S.rzDate = m.date; done('Rezervasyon eklendi: ' + (g.ad || 'Misafir') + ', ' + m.time + ', masa ' + rzNames(c.res) + '.'); return;
  }
  if (a.type === 'rezervasyon_durum') {
    if (!need(['patron', 'mudur'])) return; const r = RESV.find((x) => x.id === g.rezervasyon_id); if (!r) return; H.rzst({ dataset: { id: r.id, s: g.durum } }); if (r.st === g.durum) done(r.name + ' için durum güncellendi.'); return;
  }
  if (a.type === 'izin_karar') {
    if (!need(['patron', 'mudur'])) return; a.st = 'done'; a.msg = g.karar === 'reddet' ? 'Red ekranı açıldı.' : 'Onay ekranı açıldı.'; aiMemSave(); (g.karar === 'reddet' ? H.lrrej : H.lrok)({ dataset: { id: g.talep_id } }); render(); return;
  }
  if (a.type === 'sozlesme_olustur') {
    if (!need(['patron', 'mudur'])) return; const d = aiContractD(g); const body = contractText(d); const k = el.dataset.k;
    if (k === 'copy') { cpy(body, 'Sözleşme metni kopyalandı.'); return; }
    if (k === 'pdf') { const w = window.open('', '_blank'); if (!w) { toast('Açılır pencere engellendi. Kopyala düğmesini kullan.', 'warn'); return; } w.document.write('<!doctype html><meta charset="utf-8"><title>İş sözleşmesi</title><style>body{font:15px/1.6 Georgia,serif;max-width:720px;margin:32px auto;padding:0 20px;white-space:pre-wrap}</style>' + esc(body).replace(/^(Madde \d+ - .*)$/gm, '<b>$1</b>')); w.document.close(); setTimeout(() => { try { w.print(); } catch (e) {} }, 400); return; }
    DRAFTS.unshift({ id: 'df' + ++seq, kind: 'is', name: d.name || 'Çalışan', title: 'İş sözleşmesi: ' + (d.name || 'Çalışan'), body, date: isoShort(REF_ISO) }); done('Sözleşme taslağı kaydedildi. Çalışanlar, Sözleşmeler sekmesinde duruyor.'); return;
  }
};
const viewKaisV69 = viewKaisAI;
viewKaisAI = function () {
  aiMemLoad(); const h = viewKaisV69(); const n = (AIC.notes || []).length;
  const foot = `<div class="ai-mem">${ic('sparkle', 16)}<span>Sohbet geçmişini bu cihazda hatırlarım${n ? ', ' + n + ' not tuttum' : ''}.</span>${n ? '<button data-a="aimemclr">Notları sil</button>' : ''}</div>`;
  return h.replace(/<\/div>\s*$/, foot + '</div>');
};
/* ===== v71: Muhasebeci Dönem ekranı ===== */
function mcKdv() {
  const t = LEDGER.filter((r) => dirOf(r) === 'gelir' && lper(r) === PREVM); const hes = t.reduce((a, r) => a + kdv(r), 0); const ind = gp().reduce((a, r) => a + kdv(r), 0); const fark = hes - ind; const miss = countStatus('eksik');
  const tot = Math.max(hes, ind, 1);
  return `<section class="mc-c"><div class="mc-ch"><div><h3>${esc(PREVM)} KDV hazırlığı</h3><p>Tahmini özet. Beyanı muhasebeci hazırlar ve teyit eder.</p></div></div>
  <div class="mc-kd"><div class="mc-kr"><span>Hesaplanan</span><div class="mc-kb"><i class="a" style="width:${Math.round(hes / tot * 100)}%"></i></div><b>${fmt0(hes)}</b></div><div class="mc-kr"><span>İndirilecek</span><div class="mc-kb"><i class="g" style="width:${Math.round(ind / tot * 100)}%"></i></div><b>${fmt0(ind)}</b></div></div>
  <div class="mc-fk ${fark >= 0 ? '' : 'neg'}"><span>${fark >= 0 ? 'Tahmini fark' : 'Devreden olabilir'}</span><b>${fmt0(Math.abs(fark))}</b></div>
  ${miss ? `<div class="mc-wn">${ic('alert', 16)}<span>${miss} belgesiz işlem hesaba girmedi. Belge gelince indirilecek tutar artabilir.</span></div>` : (ROWS.length ? `<div class="mc-ok">${ic('check', 16)}<span>Tüm harcamalar belgeyle eşleşti.</span></div>` : `<div class="mc-wn">${ic('info', 16)}<span>Henüz işlem yok. Ekstre okunup belgeler gelince burada hesaplanır.</span></div>`)}
  <small class="mc-sm">${t.length} gelir ve ${gp().length} gider satırından hesaplandı. Vergi tavsiyesi değildir.</small></section>`;
}
viewDonem = function () {
  const n = RECEIPTS.filter((f) => f.status === 'musavirde').length; const fix = RECEIPTS.filter((f) => f.status === 'duzeltme').length; const miss = countStatus('eksik');
  const total = ROWS.filter((r) => ['gider', 'tekrar'].includes(r.kind)).length; const pct = total ? Math.round(((total - miss) / total) * 100) : null;
  const t = totals(); const open = openReceipts(true).length; const ds = debtSoon(); const wn = waitingNotes();
  const missSum = ROWS.filter((r) => rowStatus(r) === 'eksik').reduce((a, r) => a + Math.abs(Number(r.amt) || 0), 0);
  const C = 2 * Math.PI * 34; const off = pct == null ? C : C * (1 - pct / 100); const tone = pct == null ? '#B8C2D0' : pct >= 90 ? '#1E9E5A' : pct >= 60 ? 'var(--cini)' : '#E8A317';
  const mx = Math.max(t.in, t.out, 1);
  const tk = (ico, c, ti, sub, v, s, cnt) => `<button class="mc-t ${c}" data-a="nav" data-v="${v}" ${s ? `data-s="${s}"` : ''}><span class="mc-ti">${ic(ico, 20)}</span><span class="mc-tx"><b>${esc(ti)}</b><small>${esc(sub)}</small></span>${cnt ? `<em>${cnt}</em>` : ''}${ic('chevron', 18)}</button>`;
  const tasks = [];
  if (n) tasks.push(tk('receipt', 'w', `${n} yeni belge seni bekliyor`, 'Patron fiş yükledi. İncele ve onayla.', 'belgeler', 'gelen', n));
  if (miss) tasks.push(tk('alert', 'b', `${miss} işlemin belgesi eksik`, `Belgesiz görünen toplam ${fmt0(missSum)}`, 'belgeler', 'ekstre', miss));
  if (fix) tasks.push(tk('chat', 'i', `${fix} belge patronda düzeltme bekliyor`, 'Düzelince gelen kutusuna düşer', 'belgeler', 'gelen', fix));
  if (ds.length) tasks.push(tk('wallet', 'w', `${ds.length} ödeme için hatırlatma zamanı`, `${ds[0].who}: ${fmt0(ds[0].amt)}`, 'borc', '', ds.length));
  const q = (ico, l, v, s, b) => `<button data-a="nav" data-v="${v}" ${s ? `data-s="${s}"` : ''}>${ic(ico, 22)}<span>${l}</span>${b ? `<i>${b}</i>` : ''}</button>`;
  return `<div class="stack-lg mc"><div class="mc-hd"><h2>${esc(BIZ)}</h2><div class="mc-pr"><span class="wait">${esc(PREVM)} · kapanış bekliyor</span><span class="run">${esc(CURM)} · devam ediyor</span></div></div>
  <section class="mc-hero"><div class="mc-rg"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="none" stroke="#E6ECF4" stroke-width="9"/><circle cx="40" cy="40" r="34" fill="none" stroke="${tone}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 40 40)"/></svg><b>${pct == null ? '—' : '%' + pct}</b></div>
    <div class="mc-hs"><h3>Dönem durumu</h3><p>${pct == null ? 'Henüz işlem yok' : pct >= 100 ? 'Tüm işlemler belgeli' : pct + ' / 100 belgeli'}</p><div class="mc-n"><span><b>${ROWS.length}</b> işlem</span><span class="${miss ? 'bad' : ''}"><b>${miss}</b> eksik</span><span><b>${open}</b> onay</span></div></div></section>
  <section class="mc-c"><div class="mc-ch"><div><h3>Gelen ve giden</h3><p>${esc(PERIOD)}</p></div></div>
    <div class="mc-fl"><div><span>Gelen</span><div class="mc-kb"><i class="g" style="width:${Math.round(t.in / mx * 100)}%"></i></div><b>${fmt0(t.in)}</b></div><div><span>Giden</span><div class="mc-kb"><i class="r" style="width:${Math.round(t.out / mx * 100)}%"></i></div><b>${fmt0(t.out)}</b></div></div>
    <div class="mc-net"><span>Fark</span><b class="${t.in - t.out >= 0 ? 'pos' : 'neg'}">${t.in - t.out >= 0 ? '+' : '−'}${fmt0(Math.abs(t.in - t.out))}</b></div></section>
  <section class="mc-s"><div class="mc-sh"><h3>Sıradaki işler</h3>${tasks.length ? `<span class="mc-cn">${tasks.length}</span>` : ''}</div>${tasks.length ? tasks.join('') : `<div class="mc-e">${ic('check', 26)}<b>Bekleyen iş yok</b><p>Yeni belge ya da soru gelince burada görünür.</p></div>`}</section>
  <div class="mc-q">${q('receipt', 'Belgeler', 'belgeler', 'gelen', n)}${q('list', 'Tablo', 'tablo')}${q('file', 'Paket', 'paket')}${q('wallet', 'Borçlar', 'borc', '', ds.length)}</div>
  ${Object.keys(NOTES).length ? `<section class="mc-s"><div class="mc-sh"><h3>Notlar ve sorular</h3>${wn.length ? `<span class="mc-cn">${wn.length} cevap bekliyor</span>` : ''}</div>${Object.keys(NOTES).map((id) => { const r = ROWS.find((x) => x.id === id); if (!r) return ''; const a = NOTES[id]; const last = a[a.length - 1]; const u = byId(last.by); return `<button class="mc-nt" data-a="notes" data-id="${id}">${avatar(u, 34)}<span><b>${esc(r.desc)}</b><small>${esc(u.name.split(' ')[0])}: ${esc(last.text)}</small></span>${ic('chevron', 18)}</button>`; }).join('')}</section>` : ''}
  ${mcKdv()}</div>`;
};
/* ===== v72: Belgeler ekranı ===== */
function bgFlags(f) {
  const o = []; const open = ['bekliyor', 'musavirde'].includes(f.status);
  if (open && RECEIPTS.some((x) => x.id !== f.id && x.seller === f.seller && Math.abs(x.total - f.total) < 0.01 && x.date === f.date)) o.push(['warn', 'Aynı satıcı, tarih ve tutarda başka bir belge var. İki kez yüklenmiş olabilir.']);
  if (open && !f.bank && Number(f.total) > 0) o.push(['info', 'Ekstrede henüz karşılığı bulunamadı.']);
  if (open && f.cat === 'Hammadde' && Number(f.rate) === 20) o.push(['warn', 'Hammadde için KDV %20 girilmiş. Kalemleri kontrol et.']);
  return o;
}
receiptRow = function (f, role) {
  const u = byId(f.by) || { name: '—' }; const P = RS[f.status] || ['p-mute', f.status];
  const nI = (f.items || []).filter((i) => i.on && i.stk).length; let act = '';
  if (role === 'patron') {
    if (f.status === 'bekliyor') act = `<button class="btn sm" data-a="approve" data-id="${f.id}">Onayla, muhasebeciye gönder</button><button class="btn sm sec bg-no" data-a="reject" data-id="${f.id}">Reddet</button>`;
    if (f.status === 'duzeltme') act = `<button class="btn sm" data-a="resend" data-id="${f.id}">Düzelttim, tekrar gönder</button>`;
  }
  if (role === 'muh' && f.status === 'musavirde') act = `<button class="btn sm" data-a="review" data-id="${f.id}">${ic('check', 16)} İncele ve onayla</button>`;
  const flags = bgFlags(f);
  const why = f.note && ['duzeltme', 'reddedildi'].includes(f.status) ? `<div class="bg-fl warn">${ic('chat', 16)}<span><b>${f.status === 'duzeltme' ? 'Muhasebecinin notu' : 'Red gerekçesi'}:</b> ${esc(f.note)}</span></div>` : '';
  return `<div class="bg-c st-${f.status}"><div class="bg-t"><span class="bg-ic">${ic('receipt', 20)}</span><div class="bg-n"><b>${esc(f.seller)}</b><small>${esc(f.date)} · ${esc(String(u.name).split(' ')[0])} yükledi</small></div><b class="bg-am">${fmt(f.total)}</b></div>
  <div class="bg-ch"><span class="pill ${P[0]}">${P[1]}</span><span class="bg-k">${esc(f.cat)}</span>${f.rate ? `<span class="bg-k">KDV %${f.rate} · ${fmt(kdv(f))}</span>` : ''}${nI ? `<span class="bg-k">${nI} kalem ${f.status === 'onayli' ? 'stoğa girdi' : 'stoğa girecek'}</span>` : ''}${f.bank ? `<span class="bg-k ok">${ic('check', 13)} Ekstreyle eşleşti</span>` : flags.some((x) => x[0] === 'info') ? '<span class="bg-k wn">Ekstrede yok</span>' : ''}</div>
  ${flags.filter((x) => x[0] === 'warn').map((x) => `<div class="bg-fl ${x[0]}">${ic(x[0] === 'warn' ? 'alert' : 'info', 16)}<span>${esc(x[1])}</span></div>`).join('')}${why}${act ? `<div class="bg-a">${act}</div>` : ''}</div>`;
};
inboxHTML = function () {
  const inb = RECEIPTS.filter((f) => f.status === 'musavirde').reverse(); const fix = RECEIPTS.filter((f) => f.status === 'duzeltme'); const doneAll = RECEIPTS.filter((f) => f.status === 'onayli'); const done = doneAll.slice(-4).reverse();
  const sum = inb.reduce((a, f) => a + Number(f.total || 0), 0); const kd = inb.reduce((a, f) => a + (f.rate ? kdv(f) : 0), 0); const warn = inb.filter((f) => bgFlags(f).some((x) => x[0] === 'warn')).length;
  const k = (n, l, c) => `<div class="bg-k2 ${c}"><b>${n}</b><span>${l}</span></div>`;
  const sec = (t, sub, arr, cn) => `<section class="bg-s"><div class="bg-sh"><div><h3>${t}</h3><p>${sub}</p></div>${cn != null ? `<span class="bg-cn">${cn}</span>` : ''}</div>${arr}</section>`;
  return `<div class="stack-lg bg"><div class="bg-ks">${k(inb.length, 'Onay bekliyor', inb.length ? 'w' : '')}${k(fix.length, 'Düzeltmede', fix.length ? 'i' : '')}${k(doneAll.length, 'Onaylı', doneAll.length ? 'g' : '')}</div>
  ${inb.length ? `<div class="bg-sm">${ic('sparkle', 18)}<div><b>${fmt0(sum)} tutarında ${inb.length} belge bekliyor</b><span>İndirilecek KDV tahmini ${fmt0(kd)}${warn ? ` · ${warn} belgede kontrol edilecek nokta var` : ''}. Belgeyi aç, kalemleri düzeltip onayla; gider tabloya yazılır.</span></div></div>` : ''}
  ${sec('Onay bekleyenler', 'Patronun yüklediği belgeler', inb.length ? inb.map((f) => receiptRow(f, 'muh')).join('') : `<div class="bg-e">${ic('check', 26)}<b>Gelen kutusu boş</b><p>Patron fiş yükleyince burada görünür ve bildirim gelir.</p></div>`, inb.length)}
  ${fix.length ? sec('Düzeltme bekleyenler', 'Patron düzeltip tekrar gönderince buraya düşer', fix.map((f) => receiptRow(f, 'muh')).join(''), fix.length) : ''}
  ${done.length ? sec('Son onaylananlar', 'Gider tabloya yazıldı', done.map((f) => receiptRow(f, 'muh')).join('')) : ''}</div>`;
};
/* ===== v73: Gelir ve gider ===== */
const tbHue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function tbCard(r, dis) {
  const gelir = dirOf(r) === 'gelir'; const cats = gelir ? INCATS : CATS; const open = S.tcOpen && S.tcOpen[r.id]; const mis = mismatch(r); const h = tbHue(r.acc);
  const inp = (k, v, lab, num) => `<div class="field"><label for="tc-${r.id}-${k}">${lab}</label><input id="tc-${r.id}-${k}" ${num ? 'type="number" step="0.01" inputmode="decimal"' : 'type="text"'} value="${esc(v)}" data-ch="cell" data-id="${r.id}" data-k="${k}" ${dis}></div>`;
  return `<article class="tb-c ${r.fresh ? 'fresh' : ''} ${mis ? 'mis' : ''}"><div class="tb-t"><span class="tb-ic" style="background:hsl(${h} 70% 94%);color:hsl(${h} 55% 32%)">${esc(String(r.acc || '?').charAt(0))}</span><div class="tb-n"><b>${esc(r.desc)}</b><small>${esc(r.date)}${r.doc && r.doc !== '—' ? ' · ' + esc(r.doc) : ''}</small></div><b class="tb-am ${gelir ? 'in' : ''}">${gelir ? '+' : ''}${fmt(r.total)}</b></div>
  <div class="tb-ch"><span class="tb-k">${esc(r.acc)}</span><span class="tb-k">KDV %${r.rate} · ${fmt(kdv(r))}</span>${srcPill(r)}${mis ? `<span class="pill p-bad">Ekstre ${fmt(Math.abs(mis.amt))}</span>` : ''}</div>
  <button class="tb-ed" data-a="tcopen" data-id="${r.id}" aria-expanded="${!!open}">${open ? 'Kapat' : 'Düzenle'}</button>
  ${open ? `<div class="tb-f"><div class="row wrap">${inp('date', r.date, 'Tarih')}${inp('doc', r.doc, 'Belge')}</div>${inp('desc', r.desc, 'Açıklama')}<div class="row wrap"><div class="field"><label for="tc-${r.id}-acc">Hesap</label><select id="tc-${r.id}-acc" data-ch="cell" data-id="${r.id}" data-k="acc" ${dis}>${cats.map((c) => `<option ${c === r.acc ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label for="tc-${r.id}-rate">KDV</label><select id="tc-${r.id}-rate" data-ch="cell" data-id="${r.id}" data-k="rate" ${dis}>${[0, 1, 10, 20].map((x) => `<option value="${x}" ${x === Number(r.rate) ? 'selected' : ''}>%${x}</option>`).join('')}</select></div></div>${inp('total', r.total, 'Toplam (KDV dahil)', true)}<button class="btn sm sec tb-del" data-a="ldel" data-id="${r.id}" ${dis}>${ic('trash', 16)} Satırı sil</button></div>` : ''}</article>`;
}
tabloHTML = function (role) {
  const kind = S.sub.tablo === 'gelir' ? 'gelir' : 'gider'; const dis = S.closed ? 'disabled' : ''; const gelir = kind === 'gelir'; const view = S.tview === 'tablo' ? 'tablo' : 'kart';
  const all = LEDGER.filter((r) => dirOf(r) === kind && inPer(r) && tbChOk(r)); const q = (S.tq || '').trim().toLocaleLowerCase('tr');
  const rows = q ? all.filter((r) => [r.desc, r.acc, r.doc].join(' ').toLocaleLowerCase('tr').includes(q)) : all;
  const sum = (k) => LEDGER.filter((r) => dirOf(r) === k && inPer(r) && tbChOk(r)).reduce((a, r) => a + (Number(r.total) || 0), 0);
  const inn = sum('gelir'); const out = sum('gider'); const fark = inn - out; const mx = Math.max(inn, out, 1);
  const sumT = rows.reduce((a, r) => a + (Number(r.total) || 0), 0); const sumK = rows.reduce((a, r) => a + kdv(r), 0); const nf = all.filter((r) => r.fresh).length;
  const by = {}; all.forEach((r) => { by[r.acc] = (by[r.acc] || 0) + (Number(r.total) || 0); }); const tot = Object.values(by).reduce((a, b) => a + b, 0) || 1; const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const ins = []; if (top.length && tot > 0) ins.push(['info', `En büyük ${gelir ? 'gelir' : 'gider'} kalemi ${top[0][0]}: ${gelir ? 'gelirin' : 'giderin'} %${Math.round(top[0][1] / tot * 100)}'i.`]);
  const nm = all.filter((r) => mismatch(r)).length; if (nm) ins.push(['warn', `${nm} satırda ekstre tutarı tablodan farklı.`]);
  const nz = all.filter((r) => !(Number(r.total) > 0)).length; if (nz) ins.push(['warn', `${nz} satırın tutarı boş ya da sıfır.`]);
  if (!gelir && fark < 0) ins.push(['warn', 'Bu dönemde giderler geliri aşıyor.']);
  const html = `<div class="stack-lg tb">
  ${seg('tablo', [['gider', 'Giderler'], ['gelir', 'Gelirler']], kind)}
  ${perChips()}${tbChChips()}${misBanner()}
  <section class="tb-h"><div class="tb-hr"><div><small>Gelir</small><b>${fmt0(inn)}</b></div><div><small>Gider</small><b>${fmt0(out)}</b></div><div class="${fark >= 0 ? 'pos' : 'neg'}"><small>Fark</small><b>${fark >= 0 ? '+' : '−'}${fmt0(Math.abs(fark))}</b></div></div>
    <div class="tb-bars"><i class="g" style="width:${Math.round(inn / mx * 100)}%"></i><i class="r" style="width:${Math.round(out / mx * 100)}%"></i></div></section>
  ${top.length ? `<section class="tb-bk"><div class="tb-bh"><h3>${gelir ? 'Gelir dağılımı' : 'Gider dağılımı'}</h3><span>${esc(S.tper === 'hepsi' ? 'Tüm dönemler' : S.tper)}</span></div>${top.map(([k, v]) => `<div class="tb-br"><span>${esc(k)}</span><div class="tb-kb"><i style="width:${Math.round(v / tot * 100)}%;background:hsl(${tbHue(k)} 60% 52%)"></i></div><b>${fmt0(v)}</b></div>`).join('')}</section>` : ''}
  ${ins.length ? `<div class="tb-in">${ins.map((x) => `<div class="${x[0]}">${ic(x[0] === 'warn' ? 'alert' : 'sparkle', 16)}<span>${esc(x[1])}</span></div>`).join('')}</div>` : ''}
  ${nf ? `<div class="tb-in"><div class="ok">${ic('check', 16)}<span>${nf} yeni gider yazıldı. Yeşil satırları Kais onaylanan fişlerden ekledi.</span></div></div>` : ''}
  ${S.closed ? `<div class="callout warn">${ic('lock')}<div>${PERIOD} dönemi kapalı, tablo düzenlenemez.</div></div>` : ''}
  <div class="tb-tool"><div class="tb-sr"><input type="search" id="tb-q" placeholder="${gelir ? 'Gelirlerde ara' : 'Giderlerde ara'}" value="${esc(S.tq || '')}" data-ch="tq" aria-label="Ara"></div><div class="tb-vw"><button data-a="tview" data-v="kart" aria-pressed="${view === 'kart'}">Kartlar</button><button data-a="tview" data-v="tablo" aria-pressed="${view === 'tablo'}">Tablo</button></div></div>
  <div class="tb-act"><button class="btn sec sm" data-a="copycsv">CSV kopyala</button>${xlsxBtn()}<button class="btn sm" data-a="ladd" ${dis}>${ic('plus', 16)} Satır ekle</button></div>
  ${view === 'kart' ? (rows.length ? `<div class="tb-l">${rows.map((r) => tbCard(r, dis)).join('')}</div><div class="tb-ft"><span>${rows.length} satır</span><span>KDV ${fmt(sumK)}</span><b>${fmt(sumT)}</b></div>` : `<div class="tb-e">${ic('list', 26)}<b>${q ? 'Eşleşen satır yok' : (gelir ? 'Henüz gelir yok' : 'Henüz gider yok')}</b><p>${q ? 'Aramayı değiştir.' : gelir ? 'Ekstredeki tahsilatlar ve siparişler buraya yazılır.' : 'Muhasebeci bir fişi onaylayınca satır buraya kendiliğinden yazılır.'}</p></div>`)
    : `<div class="xl"><table class="xt"><thead><tr><th>Tarih</th><th>Açıklama</th><th>Hesap</th><th>Belge</th><th>KDV %</th><th class="r">KDV</th><th class="r">Toplam</th><th>Kaynak</th><th><span class="sr">Sil</span></th></tr></thead><tbody id="xt-body">${rows.map((r) => ledgerTr(r, dis)).join('')}</tbody><tfoot><tr><td colspan="5">${rows.length} satır</td><td class="num rt" id="lf-kdv">${fmt(sumK)}</td><td class="num rt" id="lf-tot">${fmt(sumT)}</td><td colspan="2"></td></tr></tfoot></table></div><p class="small muted">Yana kaydırarak tüm sütunları görürsün.</p>`}
  <p class="small muted">Oran ya da toplam değişince KDV kendiliğinden hesaplanır. Elle değiştirilen satır "Düzenlendi" olarak işaretlenir.${gelir ? ' KDV oranını satış kalemine göre düzelt; yeme-içme satışında oran farklı olabilir, muhasebeciyle teyit et.' : ''}</p>
  <details class="chk card" id="ck-audit" ${S.openChk.includes('audit') ? 'open' : ''}><summary class="check"><span class="dot tone-info">${ic('clock', 16)}</span><div class="grow"><b style="font-weight:600">Değişiklik geçmişi</b><div class="small muted">Kim neyi ne zaman değiştirdi, geri alabilirsin</div></div><span class="chev">${ic('chevron', 18)}</span></summary><div class="cbody" id="audit-list">${auditList()}</div></details></div>`;
  if (role === 'patron') { LEDGER.forEach((r) => { r.fresh = false; }); RECEIPTS.forEach((f) => { f.fresh = false; }); }
  return html;
};
H.tbch = (el) => { S.tch = el.dataset.v; render(); };
H.tview = (el) => { S.tview = el.dataset.v; render(); };
H.tcopen = (el) => { S.tcOpen = S.tcOpen || {}; S.tcOpen[el.dataset.id] = !S.tcOpen[el.dataset.id]; render(); };
const _och73 = onChange;
onChange = function (e) {
  const el = e.target; const ch = el.dataset && el.dataset.ch;
  if (ch === 'tq') { S.tq = el.value; render(); const x = document.getElementById('tb-q'); if (x) { x.focus(); try { x.setSelectionRange(x.value.length, x.value.length); } catch (er) {} } return; }
  const r = _och73(e);
  if (ch === 'cell' && el.id && el.id.startsWith('tc-')) render();
  return r;
};
/* ===== v74: Muhasebeci Çalışanlar, ödenen maaşlar, sözleşmeler ===== */
const csPrev = viewCalisanlar;
const csChip = (t, c) => `<span class="cs-ch ${c || ''}">${t}</span>`;
function csEmp(id) {
  const u = byId(id); const p = PROFILES[id]; const d = dueOf(id); const pct = d.total ? Math.max(0, Math.min(100, Math.round((d.paid / d.total) * 100))) : 0;
  return `<button class="cs-e" data-a="accopen" data-id="${id}"><div class="cs-et">${avatar(u, 42)}<div class="cs-en"><b>${esc(u.name)}</b><small>${esc(u.title || '')} · kıdem ${tenureTxt(monthsBetween(p.hire))}</small></div><div class="cs-ek"><b>${fmt0(Math.abs(d.left))}</b><small>${d.left > 0 ? 'kalan' : 'tamam'}</small></div>${ic('chevron', 18)}</div>
  <div class="cs-bar"><i style="width:${pct}%"></i></div><div class="cs-eb"><span>${CURM} hakkı ${fmt0(d.total)} · ödenen ${fmt0(d.paid)}</span></div>
  <div class="cs-cc">${csChip(fmt0(p.salary) + ' ' + (p.stype === 'net' ? 'net' : 'brüt'))}${p.contract ? csChip('Sözleşme kayıtlı', 'ok') : csChip('Sözleşme eksik', 'wn')}${d.ded ? csChip('İzin kesintisi ' + fmt0(d.ded), 'in') : ''}</div></button>`;
}
viewCalisanlar = function () {
  if (S.empView && PROFILES[S.empView]) return csPrev();
  const cur = ['maas', 'soz'].includes(S.sub.calisanlar) ? S.sub.calisanlar : 'liste'; const tabs = [['liste', 'Çalışanlar'], ['maas', 'Ödenen maaşlar'], ['soz', 'Sözleşmeler']];
  const all = EMP_IDS.map((id) => dueOf(id)); const tot = all.reduce((a, d) => a + d.total, 0); const paid = all.reduce((a, d) => a + d.paid, 0); const left = tot - paid; const pct = tot ? Math.round(Math.min(100, paid / tot * 100)) : 0;
  const sal = EMP_IDS.reduce((a, id) => a + (PROFILES[id].salary || 0), 0); const noC = EMP_IDS.filter((id) => !PROFILES[id].contract); const yesC = EMP_IDS.length - noC.length;
  let body = '';
  if (cur === 'maas') {
    const kinds = Object.keys(PAY_KIND); const f = S.pkf || 'hepsi'; const sumK = (k) => PAYS.filter((x) => x.kind === k).reduce((a, x) => a + x.amt, 0); const mxK = Math.max(1, ...kinds.map(sumK));
    const list = PAYS.slice().reverse().filter((x) => f === 'hepsi' || x.kind === f);
    const nobody = EMP_IDS.filter((id, i) => all[i].paid === 0 && all[i].total > 0);
    body = `<section class="cs-h"><div class="cs-hh"><div><small>${esc(CURM)} hakkı</small><b>${fmt0(tot)}</b></div><div class="cs-rg"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/><circle cx="30" cy="30" r="25" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="${(157.1 * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 30 30)"/></svg><b>%${pct}</b></div></div><div class="cs-hr"><div><small>Ödenen</small><b>${fmt0(paid)}</b></div><div><small>Kalan</small><b>${fmt0(left)}</b></div></div></section>
    ${nobody.length ? `<div class="cs-in warn">${ic('alert', 16)}<span>${nobody.map((id) => esc(byId(id).name)).join(', ')} için bu ay henüz ödeme yok.</span></div>` : ''}
    <section class="cs-s"><div class="cs-sh"><div><h3>Çalışan bazında</h3><p>${esc(PREVM)} maaşı ekstreden bulundu. ${esc(CURM)} hesabı mesai ve izin kesintisini içerir.</p></div></div>${EMP_IDS.map(csEmp).join('')}</section>
    <section class="cs-c"><div class="cs-sh"><div><h3>Ödeme türleri</h3></div></div>${kinds.map((k) => `<div class="cs-kr"><span>${PAY_KIND[k]}</span><div class="cs-kb"><i class="k-${k}" style="width:${Math.round(sumK(k) / mxK * 100)}%"></i></div><b>${fmt0(sumK(k))}</b></div>`).join('')}</section>
    <section class="cs-s"><div class="cs-sh"><div><h3>Tüm ödemeler</h3><p>${PAYS.length} kayıt</p></div></div><div class="chips">${[['hepsi', 'Tümü']].concat(kinds.map((k) => [k, PAY_KIND[k]])).map((x) => `<button class="chip" data-a="cspf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join('')}</div>
    ${list.length ? list.map((x) => { const u = byId(x.uid); return `<div class="cs-p">${avatar(u, 36)}<div class="cs-pn"><b>${esc(u.name)}</b><small>${esc(x.per)} · ${esc(x.date)}</small></div><span class="cs-pk k-${x.kind}">${PAY_KIND[x.kind]}</span><b class="cs-pa">${fmt(x.amt)}</b></div>`; }).join('') : `<div class="cs-e0">${ic('wallet', 26)}<b>Ödeme kaydı yok</b><p>Ekstreden okunan maaş ve avanslar burada görünür.</p></div>`}</section>`;
  } else if (cur === 'soz') {
    body = `<section class="cs-h"><div class="cs-hh"><div><small>Sözleşme durumu</small><b>${yesC} / ${EMP_IDS.length} kayıtlı</b></div><div class="cs-rg"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/><circle cx="30" cy="30" r="25" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="${(157.1 * (1 - (EMP_IDS.length ? yesC / EMP_IDS.length : 0))).toFixed(1)}" transform="rotate(-90 30 30)"/></svg><b>${EMP_IDS.length ? Math.round(yesC / EMP_IDS.length * 100) : 0}%</b></div></div>${noC.length ? `<p class="cs-hp">${noC.map((id) => esc(byId(id).name)).join(', ')} için sözleşme yüklenmemiş.</p>` : '<p class="cs-hp">Tüm çalışanların sözleşmesi kayıtlı.</p>'}</section>
    <section class="cs-ai"><span class="cs-ib">${ic('sparkle', 20)}</span><div><b>Kais AI ile belge hazırla</b><p>Yeni çalışanın bilgisini yaz; iş sözleşmesi, izin belgesi ya da yazılı uyarı taslağı hazırlasın. Kais AI sohbetinden de isteyebilirsin.</p><button class="btn sm" data-a="dfopen">${ic('plus', 16)} Taslak hazırla</button></div></section>
    <section class="cs-s"><div class="cs-sh"><div><h3>Sözleşmeler</h3><p>Çalışana dokununca sözleşme örneğini görürsün.</p></div></div>${EMP_IDS.map((id) => { const u = byId(id); const p = PROFILES[id]; return `<button class="cs-ct ${p.contract ? '' : 'no'}" data-a="accopen" data-id="${id}">${avatar(u, 40)}<div class="cs-en"><b>${esc(u.name)}</b><small>${p.contract ? 'Belirsiz süreli · ' + esc(isoTxt(p.hire)) + ' · ' + fmt0(p.salary) + ' ' + (p.stype === 'net' ? 'net' : 'brüt') : 'Sözleşme yüklenmemiş'}</small></div>${p.contract ? csChip('Kayıtlı', 'ok') : csChip('Eksik', 'wn')}${ic('chevron', 18)}</button>`; }).join('')}</section>
    <section class="cs-s"><div class="cs-sh"><div><h3>Hazırlanan taslaklar</h3><p>${DRAFTS.length ? DRAFTS.length + ' taslak' : 'Henüz taslak yok'}</p></div></div>${DRAFTS.length ? DRAFTS.map((d) => `<div class="cs-dr"><span class="cs-di">${ic('file', 20)}</span><div class="cs-en"><b>${esc(d.title)}</b><small>${esc(DF_KIND[d.kind] || 'Belge')} · ${esc(d.date)}</small></div>${csChip('Taslak', 'wn')}<button class="btn sm sec" data-a="dfview" data-id="${d.id}">Aç</button></div>`).join('') : `<div class="cs-e0">${ic('file', 26)}<b>Taslak yok</b><p>Yukarıdan Kais AI ile ilk belgeni hazırla.</p></div>`}</section>
    ${legalCard()}`;
  } else {
    body = `<section class="cs-h"><div class="cs-hr3"><div><small>Çalışan</small><b>${EMP_IDS.length}</b></div><div><small>Aylık maaş</small><b>${fmt0(sal)}</b></div><div><small>Sözleşmesi eksik</small><b class="${noC.length ? 'bad' : ''}">${noC.length}</b></div></div></section>
    ${noC.length ? `<div class="cs-in warn">${ic('alert', 16)}<span>${noC.length} çalışanın sözleşmesi eksik. Sözleşmeler sekmesinden taslak hazırlayabilirsin.</span></div>` : ''}
    ${left > 0 ? `<div class="cs-in info">${ic('wallet', 16)}<span>${esc(CURM)} için ödenmesi gereken kalan tutar ${fmt0(left)}.</span></div>` : ''}
    <section class="cs-s">${EMP_IDS.map(csEmp).join('')}</section>`;
  }
  return `<div class="stack-lg cs">${seg('calisanlar', tabs, cur)}${body}</div>`;
};
H.cspf = (el) => { S.pkf = el.dataset.v; render(); };
/* ===== v75: Borç ve alacak ===== */
function brDebt(d) {
  const n = daysTo(d.due); const late = n < 0; const near = !d.paid && d.on && n <= d.rem; const tone = d.paid ? 'ok' : late || n === 0 ? 'bad' : near ? 'wn' : '';
  const when = d.paid ? 'Ödendi' : late ? `${-n} gün gecikmiş` : n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : `${n} gün kaldı`;
  return `<div class="br-c ${tone}"><div class="br-t"><div class="br-n"><b>${esc(d.who)}</b><small>${esc(d.note)}</small></div><div class="br-a"><b>${fmt(d.amt)}</b><span class="br-w ${tone}">${when}</span></div></div>
  <div class="br-m">${ic('clock', 14)} Vade ${esc(isoTxt(d.due))}${d.auto ? ' · <span class="br-au">otomatik hesap</span>' : ''}</div>
  ${d.paid ? '' : `<div class="br-f"><button class="br-b ${d.on ? 'on' : ''}" data-a="debtrem" data-id="${d.id}" aria-pressed="${!!d.on}">${ic('clock', 15)} ${d.on ? 'Hatırlatma açık' : 'Hatırlatma kapalı'}</button>${d.on ? `<select class="br-s" data-ch="drem" data-id="${d.id}" aria-label="${esc(d.who)} hatırlatma günü">${[1, 3, 5, 7].map((x) => `<option value="${x}" ${x === d.rem ? 'selected' : ''}>${x} gün önce</option>`).join('')}</select>` : ''}<button class="btn sm br-ok" data-a="debtpaid" data-id="${d.id}">${ic('check', 15)} Ödendi</button></div>`}</div>`;
}
function brRecv(a) {
  const late = a.days > 0; const tone = late ? 'bad' : 'wn';
  const when = late ? `${a.days} gün gecikmiş` : a.days === 0 ? 'Vadesi bugün' : `Vadesi ${-a.days === 1 ? 'yarın' : -a.days + ' gün sonra'}`;
  return `<div class="br-c ${tone}"><div class="br-t"><div class="br-n"><b>${esc(a.name)}</b><small>${esc(a.note)}</small></div><div class="br-a"><b>${fmt(a.amt)}</b><span class="br-w ${tone}">${when}</span></div></div>
  <div class="br-m">${ic('mail', 14)} ${esc(a.email)}${a.reminded ? ` · <span class="br-au">Hatırlatıldı ${esc(a.reminded)}</span>` : ''}</div>
  <div class="br-f"><button class="btn sm" data-a="remind" data-id="${a.id}">${ic('send', 15)} ${a.reminded ? 'Tekrar hatırlat' : 'Hatırlatma gönder'}</button><button class="btn sm sec" data-a="paid" data-id="${a.id}">${ic('check', 15)} Tahsil edildi</button></div></div>`;
}
borcAlacakHTML = function (role) {
  const ds = allDebts(); const open = ds.filter((d) => !d.paid); const paid = ds.filter((d) => d.paid);
  const totD = open.reduce((a, d) => a + d.amt, 0); const rl = RECV.filter((a) => !a.paid); const alac = rl.reduce((a, x) => a + x.amt, 0);
  const fark = alac - totD; const w7 = open.filter((d) => daysTo(d.due) <= 7); const w7s = w7.reduce((a, d) => a + d.amt, 0);
  const lateR = rl.filter((a) => a.days > 0); const lateS = lateR.reduce((a, x) => a + x.amt, 0); const soon = debtSoon();
  const f = S.bf || 'hepsi'; const shown = open.filter((d) => f === 'hepsi' || (f === 'yakin' && daysTo(d.due) <= 14) || (f === 'oto' && d.auto));
  const sm = [];
  if (lateS) sm.push(['bad', `${lateR.length} kişiden ${fmt0(lateS)} vadesi geçmiş alacak var. Hatırlatma göndererek tahsil edebilirsin.`]);
  if (w7s) sm.push(['wn', `Önümüzdeki 7 günde ${fmt0(w7s)} ödeme var (${w7.map((d) => esc(d.who)).join(', ')}).`]);
  if (lateS && w7s && lateS >= w7s) sm.push(['ok', 'Vadesi geçen alacakları toplarsan önümüzdeki hafta ödemelerini karşılarsın.']);
  const alacakMail = mailReady() ? '' : `<div class="br-in">${ic('mail', 16)}<span>Müşteriye e-posta gönderme henüz hazır değil.</span></div>`;
  return `<div class="stack-lg br">
  <section class="br-h"><div class="br-hr"><div><small>Ödenecek</small><b>${fmt0(totD)}</b></div><div><small>Tahsil edilecek</small><b>${fmt0(alac)}</b></div></div><div class="br-net ${fark < 0 ? 'neg' : ''}"><span>Net durum</span><b>${fark < 0 ? '−' : '+'}${fmt0(Math.abs(fark))}</b></div></section>
  ${sm.length ? `<section class="br-sm">${sm.map((x) => `<div class="br-in ${x[0]}">${ic(x[0] === 'ok' ? 'check' : x[0] === 'bad' ? 'alert' : 'clock', 16)}<span>${x[1]}</span></div>`).join('')}</section>` : ''}
  <section class="br-s2"><div class="br-sh"><div><h3>Ödenecekler</h3><p>${open.length} açık borç. Maaş ve KDV kendiliğinden hesaplanır.</p></div><button class="btn sm" data-a="debtadd">${ic('plus', 16)} Borç ekle</button></div>
  <div class="chips">${[['hepsi', 'Tümü'], ['yakin', '14 gün içinde'], ['oto', 'Otomatik']].map((x) => `<button class="chip" data-a="bf" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join('')}</div>
  ${shown.length ? shown.map(brDebt).join('') : `<div class="br-e0">${ic('check', 26)}<b>${open.length ? 'Bu filtrede borç yok' : 'Ödenecek borç yok'}</b></div>`}
  ${paid.length ? `<details class="br-pd"><summary>Ödenenler (${paid.length})</summary>${paid.map(brDebt).join('')}</details>` : ''}</section>
  <section class="br-s2"><div class="br-sh"><div><h3>Tahsil edilecekler</h3><p>${rl.length} kişi · vadesi geçen ${fmt0(lateS)}</p></div></div>
  ${rl.length ? rl.slice().sort((a, b) => b.days - a.days).map(brRecv).join('') : `<div class="br-e0">${ic('check', 26)}<b>Açık alacak yok</b></div>`}${alacakMail}</section></div>`;
};
H.bf = (el) => { S.bf = el.dataset.v; render(); };
/* ===== v76: Aylık paket + Satışlar ===== */
paketHTML = function (role) {
  const mode = role === 'patron' ? 'patron' : 'muh';
  const missRows = ROWS.filter((r) => rowStatus(r) === 'eksik'); const open = openReceipts(); const empty = !RECEIPTS.length && !ROWS.length; const ready = !empty && !missRows.length && !open.length; const t = totals();
  const gsum = gp().reduce((a, r) => a + (Number(r.total) || 0), 0); const noDoc = countStatus('belgesiz');
  const steps = 4; const done = 2 + (missRows.length ? 0 : 1) + (open.length ? 0 : 1) - 0; const pct = empty ? 0 : Math.round(Math.min(steps, done) / steps * 100);
  const it = (ok, title, sub, body, id) => {
    const ic1 = `<span class="pk-d ${ok ? 'ok' : 'bad'}">${ic(ok ? 'check' : 'alert', 16)}</span>`;
    return body ? `<details class="pk-i chk ${ok ? 'ok' : 'bad'}" id="ck-${id}" ${S.openChk.includes(id) ? 'open' : ''}><summary>${ic1}<div class="pk-t"><b>${esc(title)}</b><small>${esc(sub)}</small></div><span class="chev">${ic('chevron', 18)}</span></summary><div class="pk-b">${body}</div></details>` : `<div class="pk-i ${ok ? 'ok' : 'bad'}"><div class="pk-s">${ic1}<div class="pk-t"><b>${esc(title)}</b><small>${esc(sub)}</small></div></div></div>`;
  };
  const missBody = missRows.map((r) => `<div class="pk-r"><div class="pk-rn"><b>${esc(r.desc)}</b><small>${esc(r.date)}</small></div><b class="pk-ra">${fmt(r.amt)}</b><div class="pk-rb">${mode === 'patron' ? `<button class="btn sm" data-a="upload">${ic('camera', 16)} Fiş ekle</button><button class="btn sm sec" data-a="nodoc" data-id="${r.id}">Fişim yok</button>${r.requested ? '<span class="pill p-warn">Muhasebeci istedi</span>' : ''}` : r.requested ? '<span class="pill p-warn">Belge istendi</span>' : `<button class="btn sm sec" data-a="request" data-id="${r.id}">Eksik belge iste</button>`}</div></div>`).join('');
  const openBody = open.map((f) => `<div class="pk-r"><div class="pk-rn"><b>${esc(f.seller)}</b><small>${esc(f.date)} · ${esc(byId(f.by).name.split(' ')[0])}</small></div><b class="pk-ra">${fmt(f.total)}</b><div class="pk-rb"><span class="pill ${RS[f.status][0]}">${RS[f.status][1]}</span>${f.status === 'bekliyor' && mode === 'patron' ? `<button class="btn sm" data-a="approve" data-id="${f.id}">Onayla</button><button class="btn sm sec" data-a="reject" data-id="${f.id}">Reddet</button>` : ''}${f.status === 'musavirde' && mode === 'muh' ? `<button class="btn sm" data-a="review" data-id="${f.id}">İncele ve onayla</button>` : ''}${f.status === 'duzeltme' ? `<small>${esc(f.note)}</small>` : ''}</div></div>`).join('');
  const left = (missRows.length ? 1 : 0) + (open.length ? 1 : 0);
  const msg = empty ? 'Ekstre ve belgeler gelince paket burada hazırlanır.' : S.closed ? `${PERIOD} dönemi kapatıldı.` : ready ? (mode === 'patron' ? 'Paket hazır. Muhasebeciye gönderebilirsin.' : 'Her şey tamam. Dönemi kapatabilirsin.') : `${left} konu çözülünce paket hazır olur.`;
  return `<div class="stack-lg pk">
  <section class="pk-h ${ready ? 'ok' : ''}"><div class="pk-hh"><div><small>${PERIOD} paketi</small><b>${empty ? 'Henüz veri yok' : ready ? 'Hazır' : 'Hazırlanıyor'}</b></div><div class="cs-rg"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/><circle cx="30" cy="30" r="25" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="${(157.1 * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 30 30)"/></svg><b>%${pct}</b></div></div><p>${esc(msg)}</p>
  <div class="pk-k"><div><small>Gelen</small><b>${fmt0(t.in)}</b></div><div><small>Giden</small><b>${fmt0(t.out)}</b></div><div><small>Belgesiz</small><b>${noDoc}</b></div></div></section>
  <section class="pk-l" ${empty ? 'hidden' : ''}>${it(true, 'Fişler okundu', `${RECEIPTS.length} fiş ve fatura kayıtlı`)}
  ${missRows.length ? it(false, `${missRows.length} işlemin belgesi eksik`, 'Hangileri olduğunu görmek için dokun', missBody, 'miss') : it(true, 'Eksik belge yok', 'Tüm harcamalar belgeyle eşleşti')}
  ${open.length ? it(false, `${open.length} belge onay bekliyor`, 'Patron ya da muhasebeci onayında olanlar', openBody, 'open') : it(true, 'Bekleyen onay yok', 'Tüm belgeler onaylandı')}
  ${it(true, 'Gider tablosu güncel', `${gp().length} satır yazıldı, toplam ${fmt0(gsum)}`)}
  ${it(true, 'Maaş ödemeleri listelendi', 'Maaşlar ekstreden okunur. Bordro hesabı bu üründe yok.')}</section>
  <section class="pk-x"><div class="pk-xh"><span class="pk-xi">${ic('file', 20)}</span><div><b>Muhasebeci çıktısı</b><small>Gider tablosundan üretilir. Türkçe Excel'de doğrudan açılır.</small></div></div>
  <div class="pk-act">${xlsxBtn()}<button class="btn sm sec" data-a="copycsv">Kopyala</button></div>
  <details class="pk-csv"><summary>CSV önizleme</summary><textarea class="csv" readonly aria-label="CSV önizleme" id="csvbox">${esc(csvText())}</textarea></details>
  ${role === 'patron' ? `<button class="btn block" data-a="sendpkg" ${S.sent ? 'disabled' : ''}>${ic('send')} ${S.sent ? 'Muhasebeciye gönderildi' : 'Muhasebeciye gönder'}</button>` : `<button class="btn block" data-a="closeperiod" ${!ready || S.closed ? 'disabled' : ''}>${ic('lock')} ${S.closed ? 'Dönem kapalı' : 'Dönemi kapat'}</button>`}
  ${role !== 'patron' && !ready ? '<p class="pk-n">Eksik belge ya da bekleyen onay varken dönem kapatılamaz.</p>' : ''}
  ${S.sent ? `<p class="pk-n">${role === 'patron' ? 'Gönderildi: ' : '<span class="pill p-ok">Patron paketi gönderdi</span> '}${esc(S.sent)}</p>` : ''}</section></div>`;
};

viewSatis = function () {
  const st = salesStats(); const pv = S.salePrev; const rcList = Object.values(RECIPES);
  const net = st.list.reduce((a, o) => a + (o.rc ? o.net : 0), 0); const marj = net ? Math.round(st.kar / net * 100) : 0;
  const withR = st.list.filter((o) => o.rc && o.net > 0).map((o) => Object.assign({ m: (o.net - o.cost) / o.net }, o));
  const best = st.list[0]; const low = withR.slice().sort((a, b) => a.m - b.m)[0]; const noR = st.list.filter((o) => !o.rc); const mx = Math.max(1, ...st.list.map((o) => o.net));
  const sm = [];
  if (best) sm.push(['ok', 'star', `En çok kazandıran ürün ${esc(best.name)}: ${fmt0(best.net)} ciro (KDV hariç).`]);
  if (low && low.m < 0.4) sm.push(['wn', 'alert', `${esc(low.name)} marjı düşük (%${Math.round(low.m * 100)}). Fiyatı ya da reçete maliyetini gözden geçir.`]);
  if (noR.length) sm.push(['bad', 'alert', `${noR.length} ürünün reçetesi yok (${noR.slice(0, 3).map((o) => esc(o.name)).join(', ')}). Maliyet hesaplanmıyor, stok düşmüyor.`]);
  const lowSt = STOCK.filter((s) => !(s.cost > 0)).length; if (lowSt) sm.push(['wn', 'alert', `${lowSt} stok kaleminin birim maliyeti yok. Reçete maliyeti eksik çıkar.`]);
  return `<div class="stack-lg sx">
  <section class="pk-h"><div class="pk-hh"><div><small>Satışlar ve maliyet</small><b>${fmt0(st.t.total)}</b><small>ciro, KDV dahil</small></div>${st.list.length ? `<div class="sx-m"><b>%${marj}</b><small>brüt marj</small></div>` : ''}</div>
  <div class="pk-k two"><div><small>Maliyet</small><b>${fmt0(st.t.cost)}</b></div><div><small>Brüt kâr</small><b>${fmt0(st.kar)}</b></div></div></section>
  ${sm.length ? `<section class="br-sm">${sm.map((x) => `<div class="br-in ${x[0]}">${ic(x[1] === 'star' ? 'check' : 'alert', 16)}<span>${x[2]}</span></div>`).join('')}</section>` : ''}
  <section class="sx-up"><div class="pk-xh"><span class="pk-xi">${ic('file', 20)}</span><div><b>Satış dosyası yükle</b><small>Adisyondan aldığın CSV ya da Excel. Sütunlar: Tarih; Ürün; Adet; Tutar (KDV dahil).</small></div></div>
  <div class="field"><label for="sale-file">Dosya (.csv ya da .xlsx)</label><input id="sale-file" type="file" accept=".csv,.txt,.xlsx,text/csv" data-ch="salefile"></div>
  <details class="pk-csv" ${S.saleText ? 'open' : ''}><summary>Ya da veriyi yapıştır</summary><textarea id="sale-text" style="min-height:100px" placeholder="Tarih;Ürün;Adet;Tutar">${esc(S.saleText)}</textarea></details>
  <div class="pk-act"><button class="btn sm" data-a="saleprev">Önizle</button><button class="btn sm sec" data-a="salesample">Örnek doldur</button></div>
  ${pv ? `<div class="br-in ${pv.rows.length ? '' : 'wn'}">${ic(pv.rows.length ? 'check' : 'alert', 16)}<span><b>${pv.rows.length} satır okundu, ${fmt0(pv.total)}</b>${pv.dup ? `<br>${pv.dup} satır daha önce yüklenmiş, atlanacak.` : ''}${pv.unk.length ? `<br>Reçetesi olmayan ürün: ${esc(pv.unk.join(', '))}.` : ''}${pv.errors.slice(0, 4).map((e) => `<br>${esc(e)}`).join('')}</span></div><button class="btn block" data-a="saleimport" ${pv.rows.length - pv.dup > 0 ? '' : 'disabled'}>İçe aktar</button>` : ''}</section>
  ${SALEIMP.length ? `<section class="cs-s"><div class="cs-sh"><div><h3>Yüklenen dosyalar</h3><p>Gelir tablosuna yazarken ekstredeki POS ödemeleriyle aynı günü iki kez saymadığından emin ol.</p></div></div>${SALEIMP.map((i) => `<div class="br-c ${i.led ? 'ok' : ''}"><div class="br-t"><div class="br-n"><b>${esc(i.name)}</b><small>${i.n} satır${i.unknown.length ? ' · ' + i.unknown.length + ' ürünün reçetesi yok' : ''}</small></div><div class="br-a"><b>${fmt0(i.total)}</b></div></div><div class="br-f">${i.led ? '<span class="br-w ok">Gelir tablosunda</span>' : `<button class="btn sm" data-a="saleled" data-id="${i.id}">Gelir tablosuna yaz</button>`}<button class="btn sm sec" data-a="saledel" data-id="${i.id}">Geri al</button></div></div>`).join('')}</section>` : ''}
  <section class="cs-s"><div class="cs-sh"><div><h3>Ürün kârlılığı</h3><p>KDV hariç ciro eksi reçete maliyeti.</p></div></div>
  ${st.list.length ? st.list.map((o) => { const m = o.rc && o.net > 0 ? Math.round((o.net - o.cost) / o.net * 100) : null; const tone = m === null ? '' : m < 40 ? 'wn' : 'ok'; return `<div class="sx-p"><div class="br-t"><div class="br-n"><b>${esc(o.name)}</b><small>${o.qty} adet · ciro ${fmt0(o.net)}${o.rc ? ' · maliyet ' + fmt0(o.cost) : ''}</small></div>${m === null ? '<span class="br-w">Reçete yok</span>' : `<span class="br-w ${tone}">%${m} marj</span>`}</div><div class="cs-bar"><i style="width:${Math.round(o.net / mx * 100)}%;background:${tone === 'wn' ? '#E8A317' : '#1F66BD'}"></i></div></div>`; }).join('') : `<div class="cs-e0">${ic('trend', 26)}<b>Henüz satış yüklenmedi</b><p>Yukarıdan bir satış dosyası yükle, ürün marjları burada görünür.</p></div>`}</section>
  <section class="cs-s"><div class="cs-sh"><div><h3>Reçeteler</h3><p>Satış yüklenince malzemeler stoktan düşer.</p></div><button class="btn sm" data-a="rcpnew">${ic('plus', 16)} Yeni reçete</button></div>
  ${rcList.map((rc) => { const c = rcCost(rc); return `<button class="cs-ct" data-a="rcpedit" data-k="${esc(prodKey(rc.name))}"><div class="cs-en"><b>${esc(rc.name)}</b><small>${Object.keys(rc.items).length} malzeme · birim maliyet ${fmt(c)} · KDV %${rc.rate}</small></div>${ic('chevron', 18)}</button>`; }).join('') || `<div class="cs-e0">${ic('file', 26)}<b>Reçete yok</b></div>`}</section>
  <details class="pk-csv sx-sc"><summary>Stok birim maliyeti (${STOCK.length} kalem)</summary><p class="pk-n">Reçete maliyeti bu fiyatlarla hesaplanır. Alış fişi geldikçe güncelle.</p>
  ${STOCK.map((s) => `<div class="sx-sr"><span>${esc(s.name)}<small>1 ${esc(s.unit)} için</small></span><input class="num" type="number" min="0" step="0.01" value="${s.cost || 0}" data-ch="scost" data-id="${s.id}" aria-label="${esc(s.name)} birim maliyeti"></div>`).join('')}</details></div>`;
};
/* ===== v77: Çalışan Bugün ===== */
bugunCalisan = function () {
  const u = S.user; const a = ATT[u.id]; const first = u.name.split(' ')[0]; const now = new Date(); const nm = now.getHours() * 60 + now.getMinutes();
  const mine = LVREQ.filter((r) => r.uid === u.id); const c = mine.filter((r) => r.status === 'karsi'); const d = mine.filter((r) => r.unreadEmp && r.status !== 'karsi');
  const itz = EMPDATA[u.id] && EMPDATA[u.id].itiraz && EMPDATA[u.id].itiraz.unreadEmp;
  const offers = MSGS.filter((m) => m.type === 'mesai' && m.to.includes(u.id) && !m.res[u.id]).length; const unread = unreadFor(u.id).length;
  const items = [];
  if (c.length) items.push(todo('clock', 'bad', 'İzin talebine karşı teklif geldi', `${c[0].txt} yerine ${c[0].counter.txt}. Kabul ya da reddet.`, 'maasim'));
  else if (d.length) items.push(todo('clock', 'info', 'İzin talebin cevaplandı', d[0].status === 'onayli' ? 'Onaylandı, ayrıntı Maaşım ekranında' : 'Gerekçeyi Maaşım ekranında oku', 'maasim'));
  if (itz) items.push(todo('chat', 'warn', 'İtirazın için yeni mesajın var', EMPDATA[u.id].itiraz.status === 'cevap bekleniyor' ? 'İşveren soru sordu, cevap bekliyor' : 'İşveren kararını yazdı', 'puanim'));
  if (offers) items.push(todo('megaphone', 'warn', `${offers} mesai teklifi cevap bekliyor`, 'Kabul ya da reddet', 'duyuru'));
  else if (unread) items.push(todo('megaphone', 'info', `${unread} yeni duyuru`, 'Okumak için dokun', 'duyuru'));
  let worked = 0; const m = /^(\d{1,2}):(\d{2})/.exec(a.inAt || '');
  if (m && (a.state === 'working' || a.state === 'break' || a.state === 'pending')) worked = Math.max(0, nm - (Number(m[1]) * 60 + Number(m[2])) - (a.breakMin || 0));
  const hm = (x) => `${Math.floor(x / 60)} sa ${String(x % 60).padStart(2, '0')} dk`;
  const T = { none: ['Mesaide değilsin', `Günaydın ${esc(first)}`, 'Çalışma gününe başlamak için mesaiye gir.'], working: ['Çalışıyorsun', `Mesaiye girişin ${esc(a.inAt)}`, `Mola toplamı ${a.breakMin || 0} dk`], break: ['Moladasın', '', `Planlanan mola ${Number(S.settings.brkPlan) || 15} dk. En fazla iki bildirim alırsın.`], pending: a.fix ? ['Düzeltme istendi', 'Mola kaydını kontrol et', 'İşveren düzeltme istedi. Kontrol edip tekrar gönder, kesinti yapılmaz.'] : ['Onay bekliyor', 'Mola dönüşün onayda', 'İşveren onaylayınca kayıt kesinleşir. Kesinti yapılmaz.'], out: ['Mesaiden çıktın', 'İyi akşamlar', 'Bugünün kaydı işverenle aynı şekilde görünür.'] }[a.state];
  let big = `<b class="cb-big">${T[1]}</b>`;
  if (a.state === 'break') { if (!a.bstart) a.bstart = Date.now() - (a.breakMin || 0) * 60000; const s = Math.floor((Date.now() - a.bstart) / 1000); big = `<b class="cb-big timer ${s > (Number(S.settings.brkPlan) || 15) * 60 ? 'over' : ''}" id="brk-timer">${mmss(s)}</b>`; }
  const btn = { none: `<button class="cb-b pri" data-a="clockin">${ic('clock', 20)} Mesaiye gir</button>`, working: `<button class="cb-b" data-a="breakstart">${ic('coffee', 18)} Molaya çık</button><button class="cb-b ghost" data-a="clockout">Mesaiden çık</button>`, break: `<button class="cb-b pri" data-a="breakend">Döndüm</button>`, pending: a.fix ? `<button class="cb-b pri" data-a="attre">Düzelttim, tekrar gönder</button>` : '', out: '' }[a.state];
  const hint = [];
  if (a.state === 'working' && worked >= 300 && !(a.breakMin > 0)) hint.push(['5 saati geçti ve bugün mola kaydın yok. Mola hakkını kullanmayı unutma.', 'breakstart', 'Molaya çık']);
  if (a.state === 'none' && nm > 9 * 60 + 15) hint.push(['Vardiyan 09:00\'da başladı. Mesaiye girmeyi unutma.', 'clockin', 'Mesaiye gir']);
  if (a.state === 'working' && nm > 18 * 60 + 15) hint.push(['Vardiya saatin geçti. İşin bittiyse mesaiden çıkmayı unutma.', 'clockout', 'Mesaiden çık']);
  if (a.late) hint.push([`Bugün ${a.late} dk geç girdin.`]);
  { const pp = PROFILES[u.id]; if (pp && pp.salary > 0) { const pd = msPayday(pp); const dd = dueOf(u.id); if (pd.n >= 0 && pd.n <= 3 && dd.left > 0) hint.push([`Maaş günü ${pd.n === 0 ? 'bugün' : pd.n + ' gün sonra'}. Kalan ${fmt0(dd.left)} ödenecek.`, 'nav:maasim', 'Maaşıma bak']); } }
  { const sc = scores().find((x) => x.id === u.id); if (sc && sc.score < 75) hint.push([`Bu ayki puanın ${sc.score.toFixed(1).replace('.', ',')}. Hangi kriterde puan kaybettiğini görebilirsin.`, 'nav:puanim', 'Puanıma bak']); }
  const iz = izLeft(u.id); const due = PROFILES[u.id] ? dueOf(u.id) : null;
  const tiles = `<div class="cb-t"><button data-a="nav" data-v="maasim">${ic('calendar', 20)}<b>${iz ? iz.left : '—'}</b><small>gün yıllık izin</small></button><button data-a="nav" data-v="maasim">${ic('wallet', 20)}<b>${due ? fmt0(Math.max(0, due.left)) : '—'}</b><small>${esc(CURM)} kalan maaş</small></button><button data-a="nav" data-v="masraf">${ic('receipt', 20)}<b>Ekle</b><small>masraf fişi</small></button></div>`;
  const log = a.log.length ? `<div class="cb-lg">${a.log.map((l, i) => `<div class="cb-lr"><span class="cb-ld ${i === a.log.length - 1 ? 'on' : ''}"></span><b>${esc(l[0])}</b><span>${esc(l[1])}</span></div>`).join('')}</div>` : `<p class="cb-e">Henüz kayıt yok. Giriş yapınca burada görünür.</p>`;
  return `<div class="stack-lg cbx">
  <div class="cb-gr">${avatar(u, 46)}<div><h2>Merhaba ${esc(first)}</h2><p>${esc(today())} · Vardiya 09:00 – 18:00</p></div></div>
  <section class="cb-h ${a.state}"><span class="cb-st">${T[0]}</span>${big}<p>${T[2]}</p>
  ${worked && a.state !== 'break' ? `<div class="cb-w"><div class="cs-bar"><i style="width:${Math.min(100, Math.round(worked / 540 * 100))}%"></i></div><small>Bugün ${hm(worked)} çalıştın · hedef 9 saat vardiya</small></div>` : ''}
  ${btn ? `<div class="cb-act">${btn}</div>` : ''}</section>
  ${hint.length ? `<section class="cb-s"><h3>Kais önerileri</h3>${hint.map((x) => `<div class="cb-hn"><span>${x[0]}</span>${x[1] ? (x[1].startsWith('nav:') ? `<button data-a="nav" data-v="${x[1].slice(4)}">${x[2]}</button>` : `<button data-a="${x[1]}">${x[2]}</button>`) : ''}</div>`).join('')}</section>` : ''}
  ${items.length ? `<section class="cb-s"><h3>Seni bekleyenler</h3><div class="stack">${items.join('')}</div></section>` : ''}
  ${tiles}
  <section class="cb-s"><h3>Bugünkü kaydın</h3>${log}<p class="cb-n">Sistem yalnızca giriş, çıkış ve mola süresini saklar. Konum yalnızca girişte dükkâna yakınlığı doğrulamak için bir kez kontrol edilir, kaydedilmez. Kamera ve biyometri kullanılmaz.</p></section></div>`;
};
/* ===== v78: Çalışan Duyurular ===== */
function deCard(m, fresh) {
  const uid = S.user.id; const mesai = m.type === 'mesai'; const r = m.res[uid];
  if (!mesai) return `<article class="de-a ${fresh ? 'new' : ''}"><div class="de-ah"><span class="de-ai">${ic('megaphone', 18)}</span><div class="de-at"><b>${esc(m.title)}</b><small>Duyuru · ${esc(m.time)}</small></div>${fresh ? '<i class="de-dot" aria-label="Yeni"></i>' : ''}</div><p class="de-ab">${esc(m.body)}</p></article>`;
  const hrs = Number(m.hours) || 0; const end = 18 * 60 + Math.round(hrs * 60); const endT = String(Math.floor(end / 60) % 24).padStart(2, '0') + ':' + String(end % 60).padStart(2, '0');
  const st = r === 'kabul' ? ['ok', 'Kabul ettin'] : r === 'red' ? ['mt', 'Reddettin'] : ['wn', 'Cevap bekliyor'];
  return `<article class="de-o ${st[0]}"><div class="de-oh"><span class="de-os ${st[0]}">${st[1]}</span>${fresh ? '<span class="dy-new">Yeni</span>' : ''}<small>${esc(m.time)}</small></div>
  <b class="de-ot">${esc(m.title)}</b><p class="de-ab">${esc(m.body)}</p>
  <div class="de-pay"><div><small>Ek ücret</small><b>+${fmt0(Number(m.pay))}</b></div><div><small>Ek çalışma</small><b>${esc(m.hours)} saat</b></div><div><small>Çıkış</small><b>${endT}</b></div></div>
  ${r ? `<div class="dy-me ${r}">${ic(r === 'kabul' ? 'check' : 'x', 18)}<span>${r === 'kabul' ? 'Teklifi kabul ettin, kayda geçti' : 'Teklifi reddettin'}</span></div>${r === 'red' && m.why && m.why[uid] ? `<p class="dy-why">Mazeretin: ${esc(m.why[uid].text)}</p>` : ''}`
    : `<div class="de-ac"><button class="de-y" data-a="respond" data-id="${m.id}" data-v="kabul">${ic('check', 18)} Kabul ediyorum</button><button class="de-n" data-a="respond" data-id="${m.id}" data-v="red">Reddet</button></div><p class="dy-note">Cevabın işverenle paylaşılır ve kayda geçer.</p>`}</article>`;
}
const _vdyE = viewDuyuru;
viewDuyuru = function () {
  const u = S.user; if (u.role !== 'calisan') return _vdyE();
  const mine = MSGS.filter((m) => m.to.includes(u.id)).slice().reverse(); const fresh = mine.filter((m) => !m.reads.includes(u.id)).map((m) => m.id);
  mine.forEach((m) => { if (!m.reads.includes(u.id)) m.reads.push(u.id); });
  const f = S.dyef || 'hepsi'; const offers = mine.filter((m) => m.type === 'mesai'); const pend = offers.filter((m) => !m.res[u.id]); const acc = offers.filter((m) => m.res[u.id] === 'kabul');
  const pendPay = pend.reduce((a, m) => a + Number(m.pay || 0), 0); const accPay = acc.reduce((a, m) => a + Number(m.pay || 0), 0);
  const list = mine.filter((m) => f === 'hepsi' || (f === 'teklif' ? m.type === 'mesai' : m.type !== 'mesai'));
  const order = list.slice().sort((a, b) => (a.type === 'mesai' && !a.res[u.id] ? 0 : 1) - (b.type === 'mesai' && !b.res[u.id] ? 0 : 1));
  return `<div class="stack-lg de"><div class="dy-hd"><h2>Duyurular</h2><p>İşvereninden gelen mesajlar ve teklifler.</p></div>
  ${offers.length ? `<section class="de-h ${pend.length ? '' : 'calm'}"><div><small>${pend.length ? 'Cevap bekleyen teklif' : 'Bekleyen teklif yok'}</small><b>${pend.length ? pend.length + ' teklif · +' + fmt0(pendPay) : 'Hepsi cevaplandı'}</b></div><div class="de-hr"><small>Kabul ettiğin</small><b>+${fmt0(accPay)}</b></div></section>` : ''}
  <div class="chips">${[['hepsi', 'Tümü', mine.length], ['teklif', 'Teklifler', offers.length], ['duyuru', 'Duyurular', mine.length - offers.length]].map((x) => `<button class="chip" data-a="dyef" data-v="${x[0]}" aria-pressed="${f === x[0]}">${x[1]} ${x[2]}</button>`).join('')}</div>
  ${order.length ? order.map((m) => deCard(m, fresh.includes(m.id))).join('') : `<div class="dy-e">${ic('megaphone', 30)}<b>${mine.length ? 'Bu listede mesaj yok' : 'Henüz duyuru yok'}</b><p>İşvereninin gönderdiği mesajlar burada görünür.</p></div>`}</div>`;
};
H.dyef = (el) => { S.dyef = el.dataset.v; render(); };
/* ===== v79: Çalışan Puanım ===== */
viewPuanim = function () {
  const u = S.user; const d = EMPDATA[u.id]; const sc = scores().find((s) => s.id === u.id); const it = d.itiraz;
  const sv = sc.score; const lvl = sv >= 90 ? ['Çok iyi', 'g'] : sv >= 75 ? ['İyi', 'b'] : sv >= 60 ? ['Orta', 'a'] : ['Gelişmeli', 'r'];
  const parts = sc.parts.map((p) => { const w = p.comp > 0 ? p.contrib / p.comp : 0; return { p, gain: w * (100 - p.comp), tone: p.comp >= 90 ? 'g' : p.comp >= 75 ? 'b' : p.comp >= 60 ? 'a' : 'r' }; });
  const worst = parts.slice().sort((a, b) => b.gain - a.gain)[0];
  const circ = 2 * Math.PI * 25; const f1 = (n) => n.toFixed(1).replace('.', ',');
  const tip = worst && worst.gain >= 0.5 ? `En çok puan kaybettiğin kriter <b>${esc(worst.p.c.name)}</b>. Bu ay düzelirse yaklaşık +${f1(worst.gain)} puan kazanırsın.` : 'Tüm kriterlerde güçlüsün. Böyle devam.';
  const html = `<div class="stack-lg pu">
  <div class="dy-hd"><h2>${PERIOD} puanın</h2><p>Bu puan yalnızca kayıtlı verilere dayanır, karar yerine geçmez. Sıralamayı yalnızca işveren görür.</p></div>
  <section class="pu-h ${lvl[1]}"><div class="pu-hh"><div><small>Toplam puan</small><b>${f1(sv)}</b><span class="pu-lv">${lvl[0]}</span></div><div class="cs-rg pu-rg"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/><circle cx="30" cy="30" r="25" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - Math.min(100, sv) / 100)).toFixed(1)}" transform="rotate(-90 30 30)"/></svg><b>%${Math.round(sv)}</b></div></div><p>${tip}</p></section>
  <section class="cs-s"><div class="cs-sh"><div><h3>Kriterler</h3><p>Her kriter toplam puana belli oranda katkı yapar.</p></div></div>
  ${parts.map((x) => `<div class="pu-c"><div class="br-t"><div class="br-n"><b>${esc(x.p.c.name)}</b><small>${esc(x.p.c.how)}</small></div><div class="br-a"><b>${f1(x.p.contrib)}</b><span class="pu-w ${x.tone}">${x.p.comp.toFixed(0)} puan</span></div></div><div class="cs-bar"><i class="pu-b ${x.tone}" style="width:${Math.max(3, Math.min(100, x.p.comp))}%"></i></div><div class="pu-m"><span>Kaydın: <b>${esc(x.p.c.val(d[x.p.c.k]))}</b></span>${x.gain >= 0.5 ? `<span class="pu-g">+${f1(x.gain)} kazanabilirsin</span>` : `<span class="pu-ok">${x.p.comp >= 99.5 ? 'Tam puan' : 'Neredeyse tam'}</span>`}</div></div>`).join('')}
  <div class="pu-ex">${ic('calendar', 16)} ${d.prot ? `Kapsam dışı: ${esc(d.prot)}` : 'Kapsam dışı gün yok'}</div></section>
  <section class="pu-it"><div class="br-t"><div class="cs-sh"><div><h3>Açıklama ya da itiraz</h3><p>Yanlış bir kayıt ya da bir sebep varsa işverene yaz.</p></div></div>${it ? itPill(it) : ''}</div>
  ${it ? thread(it.thread) : ''}
  ${!it || it.status !== 'kabul edildi' ? `<div class="field"><label for="itx">${!it ? 'Mesajın' : it.status === 'cevap bekleniyor' ? 'İşverenin sorusuna cevabın' : it.status === 'reddedildi' ? 'Karara karşı yeni bir açıklama ekle' : 'İşverene ek bir not yaz'}</label><textarea id="itx" placeholder="Örnek: 14 Ekim sabahı müşteri bekliyordu."></textarea></div><button class="btn block" data-a="itsend">${ic('send')} ${it ? 'Cevabı gönder' : 'İşverene gönder'}</button>` : '<p class="pk-n">İşveren itirazını kabul etti, puanın güncellendi.</p>'}</section></div>`;
  if (it) it.unreadEmp = false;
  return html;
};
/* ===== v80: Çalışan Maaşım ===== */
function msPayday(p) {
  const pd = Math.min(28, Number(p.payday) || 30); let y = REF.y; let m = REF.m; if (REF.d > pd) { m++; if (m > 12) { m = 1; y++; } }
  const last = new Date(y, m, 0).getDate(); const d = Math.min(Number(p.payday) || 30, last);
  const iso = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); return { iso, n: daysTo(iso) };
}
const msRow = (a, b, c, cls) => `<div class="ms-r ${cls || ''}"><span>${a}${c ? `<small>${c}</small>` : ''}</span><b>${b}</b></div>`;
const msRt = (t, v, body) => `<details class="ms-rt"><summary><span>${esc(t)}</span><b>${esc(v)}</b>${ic('chevron', 16)}</summary><p>${body}</p></details>`;
viewMaasim = function () {
  const uid = S.user.id; const _hc = LVREQ.some((r) => r.uid === uid && (r.status === 'karsi' || r.unreadEmp)); LVREQ.forEach((r) => { if (r.uid === uid) r.unreadEmp = false; }); if (_hc && !S.sub.maasim) S.sub.maasim = 'izin';
  const u = byId(uid); const p = PROFILES[uid]; const mm = monthsBetween(p.hire); const d = dueOf(uid); const pr = empPayroll(uid);
  const tabs = [['maas', 'Maaş'], ['mesai', 'Mesai'], ['izin', 'İzin'], ['hak', 'Haklar']]; const hasCtr = LVREQ.some((r) => r.uid === uid && (r.status === 'karsi' || r.unreadEmp)); const cur = tabs.some((x) => x[0] === S.sub.maasim) ? S.sub.maasim : (hasCtr || S.msUnread ? 'izin' : 'maas');
  const pct = d.total ? Math.max(0, Math.min(100, Math.round(d.paid / d.total * 100))) : 0; const pdy = msPayday(p);
  const lv = LEAVES.filter((x) => x.uid === uid); const ent = leaveDays(mm, uid) + yizCarry(uid); const used = lv.filter((x) => x.type === 'yillik').reduce((a, x) => a + x.days, 0); const left = Math.max(0, ent - used);
  const hour15 = d.hourly * 1.5; const otPct = Math.min(100, Math.round(p.otYear / 270 * 100)); const pays = PAYS.filter((x) => x.uid === uid && x.per === NEXTP); const last = PAYS.find((x) => x.uid === uid && x.kind === 'maas' && x.per === PERIOD);
  const ring = (v, tone) => `<div class="cs-rg"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="7"/><circle cx="30" cy="30" r="25" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="157.1" stroke-dashoffset="${(157.1 * (1 - v / 100)).toFixed(1)}" transform="rotate(-90 30 30)"/></svg><b>%${v}</b></div>`;
  let body = '';
  if (cur === 'maas' && !(p.salary > 0)) {
    body = `<div class="cs-e0">${ic('wallet', 26)}<b>Maaş bilgin henüz girilmemiş</b><p>İşverenin sözleşmeni ve maaşını sisteme girince hak, ödeme ve bordro tahminin burada görünür.</p></div>`;
  } else if (cur === 'maas') {
    const low = pr.net < T26.asgNet - 0.5; const tot = pr.sgk + pr.isz + pr.gv + pr.damga || 1;
    const notes = [];
    if (d.left > 0) notes.push(['wn', 'clock', `${pdy.n <= 0 ? 'Ödeme günü bugün' : pdy.n + ' gün sonra'} (${esc(isoTxt(pdy.iso))}) kalan ${fmt0(d.left)} ödenecek.`]);
    else if (d.total > 0) notes.push(['ok', 'check', `${esc(CURM)} maaşın tamamen ödendi.`]);
    if (d.ded) notes.push(['wn', 'alert', `Ücretsiz izin nedeniyle maaşından ${fmt0(d.ded)} kesinti var.`]);
    if (p.stype === 'brut') notes.push(['wn', 'alert', 'Maaş brüt kayıtlı. Eline geçen net tutar bordroya göre belli olur.']);
    body = `<section class="cs-h"><div class="cs-hh"><div><small>${esc(CURM)} hakkın</small><b>${fmt0(d.total)}</b></div>${ring(pct)}</div><div class="cs-hr"><div><small>Ödenen</small><b>${fmt0(d.paid)}</b></div><div><small>${d.left < 0 ? 'Fazla ödenen' : 'Kalan'}</small><b>${fmt0(Math.abs(d.left))}</b></div></div></section>
    ${notes.map((x) => `<div class="br-in ${x[0]}">${ic(x[1], 16)}<span>${x[2]}</span></div>`).join('')}
    <section class="ms-c"><h3>Nasıl hesaplandı</h3>${msRow(`Maaş (${p.stype === 'net' ? 'net' : 'brüt'})`, fmt(p.salary))}${msRow(`Fazla mesai, ${p.otMonth} saat`, fmt(d.ot), `Saat ücreti ${fmt(d.hourly)}, zamlı ${fmt(hour15)}`)}${d.offers.map((m) => msRow('Kabul ettiğin mesai teklifi', fmt(Number(m.pay)), esc(m.title))).join('')}${(d.holL || []).map((x) => msRow('Resmi tatil çalışma ücreti', fmt(x.amt), x.d + ' ' + VD_MON[x.m] + ', ' + esc(x.n))).join('')}${d.ded ? msRow('İzin kesintisi', fmt(-d.ded), 'Ücretsiz izin günleri', 'neg') : ''}${msRow('Toplam hak', fmt(d.total), '', 'tot')}</section>
    <section class="ms-c"><h3>Yapılan ödemeler</h3>${pays.length ? pays.map((x) => `<div class="ms-p"><span class="cs-pk k-${x.kind}">${PAY_KIND[x.kind]}</span><span>${esc(x.date)}</span><b>${fmt(x.amt)}</b></div>`).join('') : '<p class="ms-n">Bu ay henüz ödeme yapılmadı.</p>'}${last ? `<p class="ms-n">${esc(PREVM)} maaşı ödendi: ${esc(last.date)}, ${fmt(last.amt)}</p>` : ''}</section>
    <section class="ms-c"><h3>Bordro tahmini</h3><p class="ms-n">${REF.m}. ay, 2026 oranlarıyla. Resmi bordro değildir.</p>${low ? `<div class="br-in bad">${ic('alert', 16)}<span>Net maaşın 2026 asgari ücretin (${fmt0(T26.asgNet)}) altında görünüyor. Muhasebeciyle kontrol et.</span></div>` : ''}
    <div class="ms-bar"><i style="width:${Math.round(pr.net / pr.brut * 100)}%"></i></div><div class="ms-lg"><span><i class="a"></i>Eline geçen ${fmt0(pr.net)}</span><span><i class="b"></i>Kesintiler ${fmt0(tot)}</span></div>
    ${msRow('Brüt maaş', fmt(pr.brut), p.stype === 'net' ? 'Netten geriye doğru hesaplandı' : 'Kayıtlı brüt')}${msRow('SGK işçi payı (%14)', fmt(-pr.sgk), '', 'neg')}${msRow('İşsizlik sigortası (%1)', fmt(-pr.isz), '', 'neg')}${msRow('Gelir vergisi', fmt(-pr.gv), 'Asgari ücret istisnası düşüldü', 'neg')}${msRow('Damga vergisi', fmt(-pr.damga), 'Binde 7,59', 'neg')}${msRow('Net maaş', fmt(pr.net), '', 'tot')}<p class="ms-n">Her ay aynı brüt varsayıldı. Prim ve vergi dilimi değişimi sonucu oynatır. Bordroyu muhasebeci keser.</p></section>`;
  } else if (cur === 'mesai') {
    const rows = CLOCK.filter((c) => c.uid === uid).slice(0, 5);
    body = `<section class="cs-h"><div class="cs-hh"><div><small>Bu ay fazla mesai</small><b>${p.otMonth} saat</b></div><div class="ms-hv"><small>Zamlı saat</small><b>${fmt0(hour15)}</b></div></div><div class="cs-hr"><div><small>Bu yıl</small><b>${p.otYear} sa</b></div><div><small>Mesai ücreti</small><b>${fmt0(d.ot)}</b></div></div></section>
    <section class="ms-c"><div class="ms-lh"><b>Yıllık fazla mesai sınırı</b><span>${p.otYear} / 270 saat</span></div><div class="cs-bar"><i style="width:${otPct}%;background:${otPct > 80 ? '#E8A317' : '#1F66BD'}"></i></div><p class="ms-n">${otPct > 80 ? 'Yıllık sınıra yaklaşıyorsun.' : `Haftalık ${p.hours} saati aşan çalışma yüzde 50 zamlı ödenir.`}</p></section>
    <section class="ms-c"><h3>Kabul ettiğin teklifler</h3>${d.offers.length ? d.offers.map((m) => msRow(esc(m.title), '+' + fmt0(Number(m.pay)), `${esc(m.hours)} saat ek çalışma`)).join('') : '<p class="ms-n">Bu ay kabul edilmiş mesai teklifi yok.</p>'}</section>
    <section class="ms-c">${puantaj(uid)}</section>
    <section class="ms-c"><h3>Giriş-çıkış kayıtları</h3>${rows.length ? rows.map((c) => msRow(`${esc(isoShort(c.date))} · ${esc(c.in)} – ${esc(c.out || 'devam ediyor')}`, c.out ? c.hrs + ' sa' : '—', `Mola ${c.brk} dk${c.via === 'kod' ? ' · kodla girdi' : c.via === 'konum' ? ' · konumla girdi' : ''}`)).join('') : '<p class="ms-n">Henüz kayıt yok. Giriş yapınca burada görünür.</p>'}</section>`;
  } else if (cur === 'izin') {
    const upct = ent ? Math.min(100, Math.round(used / ent * 100)) : 0;
    body = `<section class="cs-h"><div class="cs-hh"><div><small>Kalan yıllık izin</small><b>${ent ? left + ' gün' : 'Henüz yok'}</b></div>${ent ? ring(upct) : ''}</div>${ent ? `<div class="cs-hr"><div><small>Yıllık hak</small><b>${ent} gün</b></div><div><small>Kullanılan</small><b>${used} gün</b></div></div>` : `<p class="cs-hp">Yıllık izin hakkı 1 yıl dolunca doğar (${esc(isoTxt(String(Number(p.hire.slice(0, 4)) + 1) + p.hire.slice(4)))}).</p>`}</section>
    <section class="ms-c"><h3>İzin geçmişi</h3>${lv.length ? lv.map((x) => `<div class="ms-p"><span class="pill ${LV_PILL[x.type]}">${LV_KIND[x.type]}</span><span>${esc(x.txt)}</span><b>${x.days} gün</b></div>${x.type === 'ucretsiz' ? `<p class="ms-n">${x.ded ? 'Maaştan kesinti: ' + fmt(x.ded) : 'Maaştan kesinti yapılmadı'}</p>` : ''}`).join('') : '<p class="ms-n">Kayıtlı izin yok.</p>'}<p class="ms-n">Yıllık izin ve rapor günleri puanlamada kapsam dışıdır.</p></section>
    ${lrSection(uid, true)}`;
  } else {
    const wk = noticeWeeks(mm); const eligible = isoTxt(String(Number(p.hire.slice(0, 4)) + 1) + p.hire.slice(4)); const trialEnd = mm >= p.trial;
    body = `<section class="ms-c"><h3>Haklar ve süreler</h3><p class="ms-n">Kıdeme göre kanundaki asgari değerler. Sözleşme daha lehte olabilir.</p>
    ${msRt('Kıdem', tenureTxt(mm), `İşe giriş ${esc(isoTxt(p.hire))}. İzin, ihbar süresi ve kıdem tazminatı bu süreye göre değişir.`)}${msRt('Yıllık izin', ent ? ent + ' gün' : 'Henüz yok', 'Bir yıldan beş yıla kadar (beş yıl dahil) 14 gün, beş yıldan fazla on beş yıldan az 20 gün, on beş yıl ve üzeri 26 gün. 4857 sayılı İş Kanunu md. 53.')}${msRt('Fazla mesai', '%50 zamlı', 'Haftalık 45 saati aşan çalışma saat ücretinin yüzde 50 zamlısı ile ödenir. Yıllık fazla çalışma süresi en çok 270 saattir.')}${msRt('İhbar süresi', wk + ' hafta', 'Çalışma süresi 6 aya kadar 2, 6 ay ile 1,5 yıl arası 4, 1,5 ile 3 yıl arası 6, 3 yıldan fazla 8 hafta. İş Kanunu md. 17.')}${msRt('Deneme süresi', trialEnd ? 'Tamamlandı' : 'Sürüyor', `Sözleşmede ${p.trial} ay. Deneme süresi kanunda en çok 2 aydır, toplu iş sözleşmesiyle 4 aya çıkabilir.`)}${msRt('Kıdem tazminatı', mm >= 12 ? 'Şart sağlandı' : 'Henüz değil', mm >= 12 ? 'En az 1 yıl çalışma şartı doldu. Hak, kanunda sayılan fesih hallerinde doğar. Tutar hesabı bu üründe yok.' : `1 yıl dolunca (${esc(eligible)}) kanunda sayılan fesih hallerinde doğar.`)}${msRt('Hafta tatili ve resmi tatil', 'Ücretli', 'Haftada en az 24 saat kesintisiz dinlenme hakkı vardır. Ulusal bayram ve genel tatil günleri ücretlidir.')}<p class="ms-n">Hukuki konularda iş hukukçusu ya da muhasebeciyle teyit et.</p></section>
    <section class="ms-c"><div class="ms-lh"><h3>İş sözleşmesi</h3>${p.contract ? '<span class="cs-ch ok">Kayıtlı</span>' : '<span class="cs-ch wn">Eksik</span>'}</div>${p.contract ? `<p class="ms-n">Kais AI okudu, ${esc(p.cAt)}</p>${msRow('Tür', 'Belirsiz süreli')}${msRow('İşe giriş', esc(isoTxt(p.hire)))}${msRow('Maaş', fmt(p.salary) + ' ' + (p.stype === 'net' ? 'net' : 'brüt'))}${msRow('Haftalık saat', p.hours + ' saat')}${msRow('Deneme', p.trial + ' ay')}${msRow('Ödeme günü', 'Her ayın ' + p.payday + "'u")}${contractPreview(uid)}` : '<p class="ms-n">İşvereninin sözleşmeni sisteme yüklemesi bekleniyor.</p>'}</section>`;
  }
  return `<div class="stack-lg ms"><div class="ms-id">${avatar(u, 48)}<div><h2>${esc(u.name)}</h2><p>${esc(u.title)} · kıdem ${tenureTxt(mm)}</p></div></div>${seg('maasim', tabs, cur)}${body}</div>`;
};

const _nlC = notifList;
notifList = function () {
  const out = _nlC(); const u = S.user; if (!u || u.role !== 'calisan') return out;
  const add = (key, sev, text, view, tab) => out.push({ key: key + '|' + REF_ISO, sev, text, view, tab });
  const a = ATT[u.id]; const nm = new Date().getHours() * 60 + new Date().getMinutes();
  if (a) {
    if (a.state === 'none' && nm > 9 * 60 + 15 && nm < 18 * 60) add('cin', 'warn', 'Vardiyan başladı ama giriş yapmadın.', 'bugun', null);
    if (a.state === 'break' && a.bstart && (Date.now() - a.bstart) / 60000 > 15) add('brk', 'bad', 'Mola süren 15 dakikayı aştı. Dönünce Döndüm\'e dokun.', 'bugun', null);
    if (a.state === 'working' && nm > 18 * 60 + 15) add('cout', 'info', 'Vardiya saatin geçti, çıkış yapmayı unutma.', 'bugun', null);
  }
  const offers = MSGS.filter((m) => m.type === 'mesai' && m.to.includes(u.id) && !m.res[u.id]).length; if (offers) add('mes' + offers, 'warn', offers + ' mesai teklifi cevap bekliyor.', 'duyuru', null);
  const un = unreadFor(u.id).length; if (un && !offers) add('dyr' + un, 'info', un + ' yeni duyuru var.', 'duyuru', null);
  LVREQ.filter((r) => r.uid === u.id).forEach((r) => { if (r.status === 'karsi') add('kr' + r.id, 'warn', 'İzin talebine karşı teklif geldi. Kabul ya da reddet.', 'maasim', 'izin'); else if (r.unreadEmp) add('ir' + r.id, 'info', 'İzin talebin cevaplandı.', 'maasim', 'izin'); });
  const it = EMPDATA[u.id] && EMPDATA[u.id].itiraz; if (it && it.unreadEmp) add('itz', 'warn', 'İtirazın için işverenden yeni mesaj var.', 'puanim', null);
  const pp = PROFILES[u.id]; if (pp && pp.salary > 0) { const pd = msPayday(pp); const dd = dueOf(u.id); if (pd.n >= 0 && pd.n <= 3 && dd.left > 0) add('pay', 'info', 'Maaş günü ' + (pd.n === 0 ? 'bugün' : pd.n + ' gün sonra') + '.', 'maasim', 'maas'); }
  const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((x, y) => rank[x.sev] - rank[y.sev]);
};
/* ===== v81: konumla giriş ===== */
if (!S.settings.clockMode) S.settings.clockMode = 'konum';
if (!S.settings.shopR) S.settings.shopR = 1000;
const gMode = () => S.settings.clockMode || 'konum';
const gShopOK = () => !!(S.settings.shop && isFinite(S.settings.shop.lat) && isFinite(S.settings.shop.lng));
const gDist = (la1, lo1, la2, lo2) => { const R = 6371000; const t = (x) => x * Math.PI / 180; const dl = t(la2 - la1); const dn = t(lo2 - lo1); const a = Math.sin(dl / 2) ** 2 + Math.cos(t(la1)) * Math.cos(t(la2)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(a)); };
const gTxt = (m) => m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(m) + ' m';
function gGet(cb) {
  if (!navigator.geolocation) { cb({ err: 'unsup' }); return; }
  navigator.geolocation.getCurrentPosition((p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy || 0 }), (e) => cb({ err: e && e.code === 1 ? 'deny' : e && e.code === 3 ? 'time' : 'err' }), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}
const _codeCardG = codeCard; codeCard = function () { return gMode() === 'kod' ? _codeCardG() : ''; };
const _cceG = codeCardEkip; codeCardEkip = function () { return gMode() === 'kod' ? _cceG() : ''; };
const _clkInG = H.clockin;
H.clockin = () => {
  if (gMode() === 'yok') { _ci(); clkIn(S.user.id); return; }
  if (gMode() !== 'konum') return _clkInG();
  if (!gShopOK()) { toast('İşveren dükkân konumunu henüz belirlemedi.', 'warn'); S.modal = { type: 'geo', st: 'noshop' }; renderModal(); return; }
  H.geotry();
};
H.geotry = () => {
  S.modal = { type: 'geo', st: 'wait' }; renderModal();
  gGet((g) => {
    if (!S.modal || S.modal.type !== 'geo') return;
    if (g.err) { S.modal = { type: 'geo', st: g.err }; renderModal(); return; }
    const sh = S.settings.shop; const d = gDist(g.lat, g.lng, sh.lat, sh.lng); const eff = Math.max(0, d - Math.min(g.acc, 100));
    if (eff <= (S.settings.shopR || 1000)) { S.modal = null; _ci(); clkIn(S.user.id); if (CLOCK[0]) { CLOCK[0].via = 'konum'; CLOCK[0].dist = Math.round(d); } toast('Giriş kaydedildi, dükkâna ' + gTxt(d) + ' uzaklıktasın.', 'ok'); }
    else { S.modal = { type: 'geo', st: 'far', d: Math.round(d) }; renderModal(); }
  });
};
NEWM.geo = () => {
  const m = S.modal; const r = S.settings.shopR || 1000;
  const body = {
    wait: `<div class="geo"><span class="geo-i spin">${ic('clock', 28)}</span><b>Konumun kontrol ediliyor</b><p>Tarayıcı izin isterse "İzin ver"e dokun. Konum yalnızca giriş anında bir kez kontrol edilir, kaydedilmez.</p></div>`,
    far: `<div class="geo"><span class="geo-i">${ic('clock', 28)}</span><b>Dükkâna ulaştığında tekrar dene</b><p>Giriş, dükkâna ${gTxt(r)} yaklaştığında yapılır. Vardığında aşağıdaki düğmeye dokun.</p><button class="btn block" data-a="geotry">Dükkândayım, tekrar dene</button></div>`,
    deny: `<div class="geo"><span class="geo-i bad">${ic('alert', 28)}</span><b>Konum izni kapalı</b><p>Giriş için konum izni gerekir. iPhone'da Ayarlar > Gizlilik > Konum Servisleri > Safari'den izni aç, sonra tekrar dene.</p><button class="btn block" data-a="geotry">Tekrar dene</button></div>`,
    time: `<div class="geo"><span class="geo-i bad">${ic('alert', 28)}</span><b>Konum alınamadı</b><p>Sinyal zayıf olabilir. Açık alana çıkıp tekrar dene.</p><button class="btn block" data-a="geotry">Tekrar dene</button></div>`,
    err: `<div class="geo"><span class="geo-i bad">${ic('alert', 28)}</span><b>Konum alınamadı</b><p>Konum servisleri kapalı olabilir. Açıp tekrar dene.</p><button class="btn block" data-a="geotry">Tekrar dene</button></div>`,
    unsup: `<div class="geo"><span class="geo-i bad">${ic('alert', 28)}</span><b>Bu cihaz konumu desteklemiyor</b><p>İşverenine haber ver, giriş yöntemini değiştirsin.</p></div>`,
    noshop: `<div class="geo"><span class="geo-i bad">${ic('alert', 28)}</span><b>Dükkân konumu belirlenmemiş</b><p>İşveren Ayarlar > Giriş yöntemi bölümünden dükkân konumunu kaydedince giriş yapabilirsin.</p></div>`,
  }[m.st] || '';
  return sheet('Konumla giriş', body);
};
H.shopset = () => {
  toast('Konum alınıyor…');
  gGet((g) => {
    if (g.err) { toast(g.err === 'deny' ? 'Konum izni kapalı. Tarayıcı ayarından izin ver.' : 'Konum alınamadı, tekrar dene.', 'warn'); return; }
    S.settings.shop = { lat: Math.round(g.lat * 1e5) / 1e5, lng: Math.round(g.lng * 1e5) / 1e5, acc: Math.round(g.acc), at: new Date().toLocaleDateString('tr-TR') };
    render(); toast('Dükkân konumu kaydedildi.', 'ok'); if (typeof pSched === 'function') pSched();
  });
};
H.clkmode = (el) => { S.settings.clockMode = el.dataset.v; render(); if (typeof pSched === 'function') pSched(); };
const _viewAyG = viewAyarlar;
viewAyarlar = function () {
  const h = _viewAyG(); const md = gMode(); const sh = S.settings.shop; const r = S.settings.shopR || 1000;
  const opt = (v, t, s) => `<button class="geo-o" data-a="clkmode" data-v="${v}" aria-pressed="${md === v}"><b>${t}</b><small>${s}</small></button>`;
  const card = `<div class="card stack"><div><h3>Giriş yöntemi</h3><p class="muted small" style="margin-top:2px">Çalışan işe başlarken nasıl doğrulansın?</p></div>
  <div class="geo-os">${opt('konum', 'Konum', 'Dükkâna yakınsa girer')}${opt('kod', 'Kod', 'Dükkândaki kodu yazar')}${opt('yok', 'Kapalı', 'Doğrulama yok')}</div>
  ${md === 'konum' ? `<div class="geo-s ${gShopOK() ? 'ok' : 'no'}"><div>${ic(gShopOK() ? 'check' : 'alert', 18)}<span>${gShopOK() ? 'Dükkân konumu kayıtlı (' + esc(sh.at || '') + ', ±' + (sh.acc || 0) + ' m)' : 'Dükkân konumu henüz kayıtlı değil'}</span></div><button class="btn sm ${gShopOK() ? 'sec' : ''}" data-a="shopset">${ic('send', 16)} ${gShopOK() ? 'Konumu güncelle' : 'Şu anki konumu dükkân yap'}</button></div>
  <div class="field"><label for="shop-r">Giriş mesafesi</label><select id="shop-r" data-ch="shopr">${[200, 500, 1000, 2000].map((x) => `<option value="${x}" ${x === r ? 'selected' : ''}>${gTxt(x)} içinde</option>`).join('')}</select></div>
  <p class="small muted">Dükkânda dururken "Şu anki konumu dükkân yap"a dokun. Çalışanın konumu yalnızca giriş anında bir kez kontrol edilir, kaydedilmez. Sadece giriş yapılan mesafe ve saat tutulur.</p>` : md === 'kod' ? '<p class="small muted">Kod, patron ve müdürün Bugün sayfasında görünür ve her dakika değişir.</p>' : '<p class="small muted">Giriş doğrulanmaz, çalışan dokununca saat kaydedilir.</p>'}</div>`;
  const i = h.indexOf('<div class="card"><h3>Yetkiler</h3>');
  return i >= 0 ? h.slice(0, i) + card + h.slice(i) : h.replace(/<\/div>\s*$/, card + '</div>');
};
const _och81 = onChange;
onChange = function (e) { const el = e.target; if (el.dataset && el.dataset.ch === 'shopr') { S.settings.shopR = Number(el.value) || 1000; toast('Giriş mesafesi güncellendi.'); if (typeof pSched === 'function') pSched(); return; } return _och81(e); };
/* ===== v82: telefon kapalıyken push bildirim ===== */
const PUSH = { pub: 'BEyriv2csC6u5pWJ1-JNT5vDj0krwhR3gRpGmwwXKQQvHYLRLlEvPjpercOfCaeH8by0QEOON6R5ULyZq_vVRoQ', st: 'bos', busy: false, msg: '' };
const pushOK = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof PushManager !== 'undefined' && typeof Notification !== 'undefined';
const pushIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || '');
const pushStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const pushKey = (s) => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
async function pushReg() { if (!pushOK()) return null; try { return await navigator.serviceWorker.register('/sw.js'); } catch (e) { return null; } }
async function pushCheck() {
  if (!pushOK()) { PUSH.st = 'yok'; return; }
  if (Notification.permission === 'denied') { PUSH.st = 'red'; return; }
  try { const r = await navigator.serviceWorker.getRegistration('/sw.js'); const s = r && await r.pushManager.getSubscription(); PUSH.st = s && Notification.permission === 'granted' ? 'acik' : 'bos'; } catch (e) { PUSH.st = 'bos'; }
}
const pushCtx = () => SBS.user && SBS.biz && ID.active && sbClient() ? { c: sbClient(), bid: SBS.biz.id, uid: SBS.user.id, au: ID.active.app_uid } : null;
async function pushSave(sub) {
  const x = pushCtx(); if (!x) return false; const j = sub.toJSON();
  const r = await x.c.from('push_subs').upsert({ business_id: x.bid, user_id: x.uid, app_uid: x.au, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, ua: (navigator.userAgent || '').slice(0, 160) }, { onConflict: 'endpoint' });
  return !r.error;
}
H.pushon = async () => {
  if (PUSH.busy) return; if (!pushCtx()) { toast('Önce hesabınla giriş yapmalısın.', 'warn'); return; }
  if (!pushOK()) { PUSH.st = 'yok'; renderModal(); return; }
  PUSH.busy = true; PUSH.msg = ''; renderModal();
  try {
    const reg = await pushReg(); if (!reg) throw new Error('sw'); await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission(); if (perm !== 'granted') { PUSH.st = perm === 'denied' ? 'red' : 'bos'; throw new Error('perm'); }
    let sub = await reg.pushManager.getSubscription(); if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: pushKey(PUSH.pub) });
    if (!(await pushSave(sub))) throw new Error('db');
    PUSH.st = 'acik'; toast('Telefon kapalıyken de bildirim gelecek.', 'ok');
  } catch (e) { if (PUSH.st !== 'red') PUSH.msg = e && e.message === 'db' ? 'Kayıt yapılamadı. Bağlantını kontrol edip tekrar dene.' : e && e.message === 'perm' ? '' : 'Bildirim açılamadı. Tekrar dene.'; }
  PUSH.busy = false; renderModal();
};
H.pushoff = async () => {
  if (PUSH.busy) return; PUSH.busy = true; renderModal();
  try { const r = await navigator.serviceWorker.getRegistration('/sw.js'); const s = r && await r.pushManager.getSubscription(); if (s) { const ep = s.endpoint; await s.unsubscribe(); const x = pushCtx(); if (x) await x.c.from('push_subs').delete().eq('endpoint', ep); } PUSH.st = 'bos'; toast('Telefon bildirimi kapatıldı.'); } catch (e) { PUSH.msg = 'Kapatılamadı. Tekrar dene.'; }
  PUSH.busy = false; renderModal();
};
function pushRow() {
  const ios = pushIOS() && !pushStandalone(); let t = '', b = '', k = 'off';
  if (!pushOK()) { t = ios ? 'Ana ekrana ekle: Paylaş, sonra "Ana Ekrana Ekle". Simgeden açınca buradan aç.' : 'Bu tarayıcı telefon bildirimini desteklemiyor.'; k = 'na'; }
  else if (ios) { t = 'Önce ana ekrana ekle: Paylaş, sonra "Ana Ekrana Ekle". Simgeden açınca buradan aç.'; b = '<button class="btn sm" data-a="pushon">Dene</button>'; k = 'na'; }
  else if (PUSH.st === 'acik') { t = 'Telefon kapalıyken de bildirim gelir.'; b = '<button class="btn sm sec" data-a="pushoff"' + (PUSH.busy ? ' disabled' : '') + '>Kapat</button>'; k = 'on'; }
  else if (PUSH.st === 'red') { t = 'Engellenmiş. Tarayıcı ayarlarından bu site için bildirime izin ver.'; k = 'na'; }
  else { t = 'Uygulama kapalıyken bile hatırlatma, izin ve mesai cevapları telefonuna düşsün.'; b = '<button class="btn sm"' + (PUSH.busy ? ' disabled' : '') + ' data-a="pushon">' + (PUSH.busy ? 'Açılıyor' : 'Aç') + '</button>'; }
  return `<div class="nb-push ${k}"><span class="nb-pi">${ic('bell', 18)}</span><div class="nb-pt"><b>Telefon bildirimi ${k === 'on' ? '<i class="nb-on">Açık</i>' : ''}</b><span>${t}</span>${PUSH.msg ? `<span class="nb-err">${esc(PUSH.msg)}</span>` : ''}</div>${b}</div>`;
}
const NB_IC = { stok: 'box', satinalma: 'box', rezerv: 'clock', bugun: 'clock', ekip: 'users', maasim: 'users', puanim: 'users', duyuru: 'megaphone', muhasebe: 'trend', borc: 'trend', belgeler: 'file' };
NEWM.bell = () => {
  if (PUSH.st === 'bos') pushCheck().then(() => { if (S.modal && S.modal.type === 'bell' && PUSH.st !== 'bos') renderModal(); });
  const L = notifList(); const seen = nfLoad(); const unread = L.filter((x) => !seen.has(x.key)).length;
  const grp = [['bad', 'Acil'], ['warn', 'Dikkat'], ['info', 'Bilgi']];
  const item = (x) => { const i = L.indexOf(x); const sn = seen.has(x.key); return `<button class="nb-it ${x.sev}${sn ? ' seen' : ''}" data-a="nfgo" data-i="${i}"><span class="nb-ic">${ic(NB_IC[x.view] || (x.sev === 'bad' ? 'alert' : 'info'), 18)}</span><span class="nb-tx">${esc(x.text)}</span><span class="nb-go">${sn ? '' : '<i class="nb-dot"></i>'}${ic('chevron', 16)}</span></button>`; };
  const list = L.length ? grp.map(([k, n]) => { const g = L.filter((x) => x.sev === k); return g.length ? `<div class="nb-gh">${n} <span>${g.length}</span></div><div class="nb-grp">${g.map(item).join('')}</div>` : ''; }).join('')
    : `<div class="nb-empty">${ic('check', 30)}<b>Her şey yolunda</b><span>Bekleyen bildirim yok.</span></div>`;
  const top = L.length ? `<div class="nb-sum"><span>${unread ? `<b>${unread}</b> yeni` : 'Hepsi okundu'}${L.filter((x) => x.sev === 'bad').length ? ` · <em>${L.filter((x) => x.sev === 'bad').length} acil</em>` : ''}</span>${unread ? '<button class="nb-read" data-a="nfread">Hepsini okundu yap</button>' : ''}</div>` : '';
  return sheet('Bildirimler', `${top}${list}${pushRow()}`);
};
async function pushSend(to, title, body) {
  try { const x = pushCtx(); if (!x || !to || !to.length) return; const ids = to.slice();
    const s = await x.c.auth.getSession(); const tok = s && s.data && s.data.session && s.data.session.access_token; if (!tok) return;
    fetch(SB_URL + '/functions/v1/kais-push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, apikey: SB_KEY }, body: JSON.stringify({ action: 'send', business_id: x.bid, to: ids, title, body }) }).catch(() => {});
  } catch (e) {}
}
const _sendP = H.sendmsg;
H.sendmsg = () => {
  const d = S.draft; const to = d && d.aud === 'all' ? EMP_IDS.slice() : d && d.sel ? d.sel.slice() : []; const n0 = MSGS.length; const ttl = d && d.title ? d.title.trim() : ''; const ty = d && d.type;
  _sendP(); if (MSGS.length > n0) pushSend(to, ty === 'mesai' ? 'Mesai teklifi' : 'Yeni duyuru', ttl);
};
const _lrfP = H.lrfinal;
H.lrfinal = () => { const m = S.modal; const r = m && LVREQ.find((x) => x.id === m.id); const st0 = r && r.status; _lrfP(); if (r && r.status !== st0 && r.status === 'onayli') pushSend([r.uid], 'İzin talebin cevaplandı', 'Sonucu uygulamadan gör.'); };
if (pushOK()) { pushReg(); }
/* ===== v83: konuma göre tedarikçi sıralama, canlı katalog fiyatı, açık saat, teslim tahmini ===== */
const SGD = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const sgn = (x) => String(x || '').toLowerCase().replace(/İ/g, 'i').replace(/ı/g, 'i').replace(/[^a-z0-9ğüşöç ]/g, '').replace(/\s+/g, ' ').trim();
const sgBase = (n) => sgn(String(n || '').split(' (')[0]);
function sgNow() { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date()); const g = (t) => p.find((x) => x.type === t).value; return { min: Number(g('hour')) % 24 * 60 + Number(g('minute')), wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')) }; }
const sgTm = (s) => { const a = String(s || '0:0').split(':').map(Number); return (a[0] || 0) * 60 + (a[1] || 0); };
function sgKm(t) { const sh = S.settings.shop; const p = t && t.prof; if (!(sh && isFinite(sh.lat) && p && p.lat != null && isFinite(p.lat))) return null; return gDist(sh.lat, sh.lng, p.lat, p.lng) / 1000; }
function sgOut(t) { const km = sgKm(t); const r = t && t.prof ? Number(t.prof.radius_km) || 0 : 0; return km != null && r > 0 && km > r; }
function sgOpen(t) {
  const p = t && t.prof; if (!p || !p.hours || !Object.values(p.hours).some((x) => x && x.o)) return null; const n = sgNow(); const h = p.hours[n.wd];
  if (h && h.o && n.min >= sgTm(h.o) && n.min < sgTm(h.c)) return { open: true, txt: 'Açık · ' + h.c + ' kadar' };
  for (let i = 0; i < 8; i++) { const wd = (n.wd + i) % 7; const x = p.hours[wd]; if (x && x.o && (i > 0 || n.min < sgTm(x.o))) return { open: false, txt: 'Kapalı · ' + (i === 0 ? 'bugün ' : i === 1 ? 'yarın ' : SGD[wd] + ' ') + x.o + '\'de açılır' }; }
  return { open: false, txt: 'Kapalı' };
}
function sgEta(t) {
  const p = t && t.prof; if (!p) return null; const n = sgNow(); let d = 0; if (p.cutoff && n.min > sgTm(p.cutoff)) d = 1; d += Math.ceil(Number(p.lead_days) || 0);
  const dd = (p.delivery_days || []).map(Number); let g = 0; if (dd.length) { while (!dd.includes((n.wd + d) % 7) && g < 8) { d++; g++; } }
  const wd = (n.wd + d) % 7; return { days: d, wd, txt: d === 0 ? 'bugün' : d === 1 ? 'yarın' : SGD[wd] + ' (' + d + ' gün)' };
}
function sgFac(st, c) { // tedarikçi birimi -> stok birimi çarpanı
  const su = sgn(c.u), tu = sgn(st.unit); if (su === tu) return 1; const m = /\((\d+(?:[.,]\d+)?)\s*(kg|gr|g|lt|l|ml)\b/i.exec(st.name || ''); if (!m) return null; let z = Number(m[1].replace(',', '.')); const u = m[2].toLowerCase();
  const toKg = u === 'gr' || u === 'g' ? z / 1000 : u === 'ml' ? z / 1000 : z; const kind = u === 'kg' || u === 'gr' || u === 'g' ? 'kg' : 'l';
  if ((su === 'kg' && kind === 'kg') || (su === 'l' && kind === 'l')) return toKg; return null;
}
function sgEff(c, qty) { let pct = 0; (c.t || []).forEach((x) => { if (qty >= x.q && x.p > pct) pct = x.p; }); let v = c.p * (1 - pct / 100); if (c.pr && c.pr.pct > 0 && (!c.pr.until || c.pr.until >= REF_ISO)) v *= 1 - c.pr.pct / 100; return v; }
function sgScore(t) {
  let v = 40; const tags = []; const why = []; const km = sgKm(t); const eta = sgEta(t); const op = sgOpen(t);
  const rs = Object.keys(t.items || {}).map((sid) => { const all = SUPPLIERS.filter((x) => x.items[sid] > 0).map((x) => x.items[sid]); return all.length > 1 ? t.items[sid] / Math.min(...all) : null; }).filter((x) => x != null);
  if (rs.length) { const avg = rs.reduce((a, b) => a + b, 0) / rs.length; v += Math.max(0, 25 - (avg - 1) * 125); if (avg <= 1.01) tags.push('En ucuz'); why.push(avg <= 1.01 ? 'fiyatı en düşük' : 'fiyatı ortalama %' + Math.round((avg - 1) * 100) + ' yüksek'); }
  if (km != null) { if (sgOut(t)) { v -= 30; tags.push('Bölge dışı'); why.push('teslimat bölgen dışında'); } else { v += Math.max(0, 20 - km * 0.8); why.push(q1(km) + ' km uzakta'); } }
  const ld = eta ? eta.days : (t.lead || 3); v += Math.max(0, 15 - ld * 3); if (ld <= 1) tags.push('Hızlı teslim'); why.push('teslim ' + (eta ? eta.txt : ld + ' gün'));
  if (op && op.open) v += 3;
  const pay = t.prof ? Number(t.prof.pay_terms) || 0 : 0; if (pay > 0) { v += Math.min(7, pay / 4); tags.push(pay + ' gün vade'); }
  const out = Object.values(t.live || {}).filter((l) => l.out).length; if (out) { v -= Math.min(16, out * 8); why.push(out + ' ürün tükenmiş'); }
  return { v: Math.max(0, Math.min(100, Math.round(v))), tags, why };
}
function sgLine(t) { const km = sgKm(t); const op = sgOpen(t); const eta = sgEta(t); const a = []; if (km != null) a.push(q1(km) + ' km'); if (eta) a.push('tahmini teslim ' + eta.txt); if (op) a.push(op.open ? 'şu an açık' : 'şu an kapalı'); return a.length ? ' · ' + a.join(' · ') : ''; }
function sgApply() {
  SUPPLIERS.forEach((t) => {
    if (!t.prof) return; if (t.lead0 == null) t.lead0 = t.lead; if (t.min0 == null) t.min0 = t.minAmt || 0; const e = sgEta(t); if (e) t.lead = Math.max(0, e.days); if (Number(t.prof.min_order) > 0) t.minAmt = Number(t.prof.min_order);
  });
}
async function sgPull() {
  const c = sbClient(); if (!c || !SBS.biz) return false; const ids = SUPPLIERS.filter((t) => t.sbid).map((t) => t.sbid); if (!ids.length) return false;
  const [pf, pr] = await Promise.all([c.from('supplier_profiles').select('*').in('supplier_id', ids), c.from('supplier_products').select('*').in('supplier_id', ids)]);
  if (pf.error || pr.error) return false; const before = JSON.stringify(SUPPLIERS.map((t) => [t.prof, t.live, t.items]));
  SUPPLIERS.forEach((t) => {
    if (!t.sbid) return; const p = (pf.data || []).find((x) => x.supplier_id === t.sbid); const L = (pr.data || []).filter((x) => x.supplier_id === t.sbid && x.active !== false);
    t.prof = p ? { lat: p.lat, lng: p.lng, radius_km: p.radius_km, hours: p.hours || {}, delivery_days: p.delivery_days || [], cutoff: p.cutoff, lead_days: p.lead_days, min_order: p.min_order, delivery_fee: p.delivery_fee, free_over: p.free_over, pay_terms: p.pay_terms, address: p.address, city: p.city, district: p.district, phone: p.phone, about: p.about } : null;
    if (p && p.phone && !t.phone) t.phone = p.phone;
    t.cat = L.slice(0, 150).map((x) => ({ id: x.id, n: x.name, u: x.unit, p: Number(x.price) || 0, st: x.stock, skt: x.lot_exp || null, sh: x.shelf_days || null, pr: x.promo_pct > 0 ? { pct: Number(x.promo_pct), until: x.promo_until || null } : null, t: x.tiers || [], c: x.category || '', mq: Number(x.min_qty) || 1, ph: Array.isArray(x.photos) ? x.photos.slice(0, 4) : [] }));
    t.live = {}; STOCK.forEach((st) => { const c0 = t.cat.find((x) => sgBase(x.n) === sgBase(st.name)); if (!c0) return; const f = sgFac(st, c0); const out = c0.st === 'yok';
      t.live[st.id] = { cid: c0.id, out, stock: c0.st, f, promo: c0.pr && (!c0.pr.until || c0.pr.until >= REF_ISO) ? c0.pr.pct : 0, skt: c0.skt };
      if (f != null && !out) { const pr0 = Math.round(sgEff(c0, 1) * f * 100) / 100; if (pr0 > 0) t.items[st.id] = pr0; } });
  });
  sgApply(); return JSON.stringify(SUPPLIERS.map((t) => [t.prof, t.live, t.items])) !== before;
}
const _sbPullG = sbPull; sbPull = async function () { const ch = await _sbPullG(); let c2 = false; try { c2 = await sgPull(); } catch (e) {} if (c2 && typeof pSched === 'function') pSched(); return ch || c2; };
const _offG = offersOf; offersOf = (sid) => { const all = _offG(sid); const ok = all.filter((t) => !(t.live && t.live[sid] && t.live[sid].out) && !sgOut(t)); return ok.length ? ok : all; };
function sgList() {
  const hasGeo = SUPPLIERS.some((t) => t.prof && t.prof.lat != null); const shop = S.settings.shop && isFinite(S.settings.shop.lat); sgApply();
  const L = SUPPLIERS.map((t) => ({ t, sc: sgScore(t), km: sgKm(t) })).sort((a, b) => b.sc.v - a.sc.v); const kms = L.map((x) => x.km).filter((x) => x != null); const near = kms.length > 1 ? Math.min(...kms) : null;
  const note = hasGeo && !shop ? `<div class="callout" style="margin:0 16px 8px">${ic('info')}<div>Dükkân konumunu kaydedersen tedarikçileri sana yakınlığa göre sıralarım.<div style="margin-top:6px"><button class="btn sm sec" data-a="goayar">Ayarlara git</button></div></div></div>` : '';
  return note + L.map(({ t, sc, km }) => { const op = sgOpen(t); const eta = sgEta(t); const tags = sc.tags.slice(); if (near != null && km === near) tags.unshift('En yakın');
    return `<div class="sg-row"><button class="sg-main" data-a="supinfo" data-id="${t.id}"><div class="grow"><div class="row between" style="gap:8px"><b style="font-weight:600">${esc(t.name)}</b><span class="sg-sc ${sc.v >= 70 ? 'hi' : sc.v >= 50 ? 'mid' : 'lo'}">${sc.v}</span></div>
      <div class="small muted">${Object.keys(t.items).length} ürün${km != null ? ' · ' + q1(km) + ' km' : ''} · ${eta ? 'teslim ' + eta.txt : 'teslim ' + t.lead + ' gün'}${t.minAmt ? ' · en az ' + fmt0(t.minAmt) : ''}</div>
      <div class="sg-tags">${op ? `<span class="sg-t ${op.open ? 'ok' : 'bad'}">${esc(op.txt)}</span>` : ''}${tags.map((x) => `<span class="sg-t">${esc(x)}</span>`).join('')}${Object.values(t.live || {}).some((l) => l.promo) ? '<span class="sg-t pr">Kampanya var</span>' : ''}</div></div>${ic('chevron', 18)}</button>
      <button class="sg-ed" data-a="supedit" data-id="${t.id}" aria-label="Düzenle">${ic('gear', 16)}</button></div>`; }).join('');
}
H.goayar = () => { S.view = 'ayarlar'; S.modal = null; render(); };
H.supinfo = (el) => { S.modal = { type: 'supinfo', id: el.dataset.id }; renderModal(); };
NEWM.supinfo = (m) => {
  const t = supById(m.id); if (!t) return sheet('Tedarikçi', '<p class="muted">Bulunamadı.</p>'); const p = t.prof; const sc = sgScore(t); const km = sgKm(t); const op = sgOpen(t); const eta = sgEta(t);
  const hrs = p && p.hours && Object.values(p.hours).some((x) => x && x.o) ? [1, 2, 3, 4, 5, 6, 0].map((d) => { const h = p.hours[d]; return `<div class="logline" style="padding:8px 16px"><span>${SGD[d]}</span><span>${h && h.o ? h.o + ' – ' + h.c : 'Kapalı'}</span></div>`; }).join('') : '';
  const link = p && p.lat != null ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : '';
  const live = STOCK.filter((st) => t.live && t.live[st.id]).map((st) => { const l = t.live[st.id]; const c = (t.cat || []).find((x) => x.id === l.cid) || {}; const sk = l.skt ? dleft(l.skt) : null;
    return `<div class="logline" style="padding:8px 16px"><span>${esc(st.name)}<span class="small muted" style="display:block">${l.f != null && t.items[st.id] ? fmt(t.items[st.id]) + ' / ' + esc(st.unit) : 'birim farklı: ' + fmt(c.p || 0) + ' / ' + esc(c.u || '')}${(c.t || []).length ? ' · ' + c.t.map((x) => x.q + '+ ' + esc(c.u) + ' %' + x.p).join(', ') : ''}</span></span><span class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end"><span class="pill ${l.out ? 'p-bad' : l.stock === 'az' ? 'p-warn' : 'p-ok'}">${l.out ? 'Tükendi' : l.stock === 'az' ? 'Azaldı' : 'Stokta'}</span>${l.promo ? `<span class="pill p-info">%${l.promo} kampanya</span>` : ''}${sk != null && sk <= 30 ? `<span class="pill p-warn">SKT ${sk} gün</span>` : ''}</span></div>`; }).join('');
  const others = (t.cat || []).filter((x) => !(t.live && Object.values(t.live).some((l) => l.cid === x.id))).slice(0, 12);
  return sheet(t.name, `<div class="stack"><div class="row between"><span class="sg-sc big ${sc.v >= 70 ? 'hi' : sc.v >= 50 ? 'mid' : 'lo'}">${sc.v}</span><div class="grow small muted" style="padding-left:12px">Uygunluk puanı. ${esc(sc.why.join(', '))}.</div></div>
  ${p ? `<div class="card stack" style="padding:12px"><div class="small">${p.address ? esc(p.address) + (p.district || p.city ? ', ' + esc([p.district, p.city].filter(Boolean).join(' / ')) : '') : 'Adres girilmemiş'}</div>${km != null ? `<div class="small">Mesafe: <b>${q1(km)} km</b>${sgOut(t) ? ' · <span style="color:var(--nar)">teslimat bölgesi dışında</span>' : ''}</div>` : '<div class="small muted">Mesafe için dükkân konumu gerekir (Ayarlar).</div>'}${op ? `<div class="small"><b>${esc(op.txt)}</b></div>` : ''}${eta ? `<div class="small">Şimdi sipariş verirsen tahmini teslim: <b>${esc(eta.txt)}</b>${p.cutoff ? ' (kesim ' + esc(p.cutoff) + ')' : ''}</div>` : ''}
    <div class="small muted">${p.min_order > 0 ? 'En az sipariş ' + fmt0(p.min_order) + '. ' : ''}${p.delivery_fee > 0 ? 'Teslimat ' + fmt0(p.delivery_fee) + (p.free_over > 0 ? ', ' + fmt0(p.free_over) + ' üzeri ücretsiz' : '') + '. ' : ''}${p.pay_terms > 0 ? p.pay_terms + ' gün vade.' : 'Peşin ödeme.'}</div>
    <div class="row wrap">${t.phone ? `<a class="btn sm sec" href="tel:${esc(String(t.phone).replace(/\s/g, ''))}">${ic('mail', 16)} Ara</a>` : ''}${link ? `<a class="btn sm sec" target="_blank" rel="noopener" href="${link}">${ic('send', 16)} Yol tarifi</a>` : ''}</div></div>${hrs ? `<div class="card flush"><div style="padding:12px 16px 4px"><b>Çalışma saatleri</b></div>${hrs}</div>` : ''}` : '<div class="callout">' + ic('info') + '<div>Bu tedarikçi henüz panelinde konum ve saat bilgisi girmemiş.</div></div>'}
  ${live ? `<div class="card flush"><div style="padding:12px 16px 4px"><b>Senin ürünlerinde canlı fiyat ve stok</b></div>${live}</div>` : ''}
  ${others.length ? `<div class="card flush"><div style="padding:12px 16px 4px"><b>Kataloğundaki diğer ürünler</b></div>${others.map((x) => `<div class="logline" style="padding:8px 16px"><span class="row" style="gap:10px">${x.ph && x.ph[0] ? `<img src="${esc(x.ph[0])}" alt="" loading="lazy" style="width:40px;height:40px;border-radius:8px;object-fit:cover">` : ''}${esc(x.n)}</span><span class="small muted">${fmt(x.p)} / ${esc(x.u)}</span></div>`).join('')}</div>` : ''}
  <button class="btn sec" data-a="supedit" data-id="${t.id}">Bilgileri düzenle</button></div>`);
};
const _nlSG = notifList;
notifList = function () { const out = _nlSG(); const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return out;
  try { stockPlan().filter((p) => p.status !== 'ok').forEach((p) => SUPPLIERS.forEach((t) => { const l = t.live && t.live[p.st.id]; if (l && l.promo && !l.out) out.push({ key: 'frs' + t.id + p.st.id + '|' + REF_ISO, sev: 'info', text: t.name + ' ' + p.st.name.split(' (')[0] + ' için %' + l.promo + ' kampanyada. Stoğun azalıyor, fırsat.', view: 'satinalma', tab: null }); })); } catch (e) {}
  const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };
saSupsCard = function () {
  return `<div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px"><div><h3>Tedarikçiler</h3><p class="muted small" style="margin-top:2px">Konuma, saate ve fiyata göre sıralı. Detay için dokun.</p></div><button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button></div>${sgList()}</div>`;
};
/* v84: toptancı arama, elle konum, WhatsApp, eksik teslim, puan, tekrarlayan sipariş, sipariş bildirimi */
const RECUR = []; const RATES = []; P_ARR.push(['RECUR', () => RECUR], ['RATES', () => RATES]);
const waPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (!d) return ''; if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = '90' + d.slice(1); else if (d.length === 10) d = '90' + d; return d; };
const waLink = (phone, text) => { const n = waPhone(phone); return 'https://wa.me/' + (n ? n : '') + '?text=' + encodeURIComponent(text); };
H.ordwa = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o) return; const t = supById(o.supId); const url = waLink(t && t.phone, o.msg || orderMsg(t || { lead: 2 }, o.lines)); if (!waPhone(t && t.phone)) toast('Tedarikçinin telefonu yok. WhatsApp\'ta kişiyi kendin seç.', 'warn'); window.open(url, '_blank', 'noopener'); };
async function ordNotify(o, kind) { try { const c = sbClient(); if (!c || !o || !o.sbid) return; const s = await c.auth.getSession(); const tok = s && s.data && s.data.session && s.data.session.access_token; if (!tok) return; fetch(SB_URL + '/functions/v1/kais-push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, apikey: SB_KEY }, body: JSON.stringify({ action: 'order_notify', order_id: o.sbid, kind }) }).catch(() => {}); } catch (e) {} }
async function ordPush(o) { try { const t = supById(o.supId); const c = sbClient(); if (!c || !SBS.biz || !t || !t.sbid || o.sbid) return; const i = await c.from('orders').insert({ business_id: SBS.biz.id, supplier_id: t.sbid, lines: o.lines, total: o.total }).select('id').single(); if (i.error || !i.data) return; o.sbid = i.data.id; ordNotify(o, 'yeni'); } catch (e) {} }
const _ordcreate84 = H.ordcreate;
H.ordcreate = (el) => { const n = ORDERS.length; _ordcreate84(el); if (ORDERS.length > n) { const o = ORDERS[0]; ordPush(o); const t = supById(o.supId); if (t && t.sbid) toast('Sipariş kaydedildi, toptancının paneline gönderildi.', 'ok'); } };
const _ordcancel84 = H.ordcancel; H.ordcancel = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); _ordcancel84(el); if (o && o.sbid) { try { sbClient().from('orders').update({ status: 'iptal' }).eq('id', o.sbid).then(() => ordNotify(o, 'iptal')); } catch (e) {} } };
/* eksik / hasarlı teslim */
const RCV_WHY = [['', 'Sorun yok'], ['eksik', 'Eksik geldi'], ['hasar', 'Hasarlı / bozuk'], ['yanlis', 'Yanlış ürün'], ['skt', 'SKT çok kısa']];
H.ordrecv = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || o.status !== 'gonderildi') return; S.modal = { type: 'recv', id: o.id }; renderModal(); };
NEWM.recv = (m) => { const o = ORDERS.find((x) => x.id === m.id); if (!o) return sheet('Teslim', '<p class="muted">Sipariş bulunamadı.</p>'); const t = supById(o.supId);
  return sheet('Teslimatı kontrol et', `<div class="stack"><p class="muted small">${esc(t ? t.name : 'Tedarikçi')} siparişi. Gelen miktarı yaz. Eksik veya sorunlu olanı seç, borca sadece kabul ettiğin kısım yazılır.</p>
  ${o.lines.map((l, i) => `<div class="card stack" style="padding:12px"><b style="font-weight:600">${esc(l.name.split(' (')[0])}</b><div class="small muted">Sipariş: ${fq(l.qty)} ${esc(l.unit)} × ${fmt(l.price)}</div>
  <div class="row" style="gap:8px"><div class="field grow"><label for="rc-q${i}">Kabul edilen</label><input type="text" id="rc-q${i}" inputmode="decimal" value="${l.qty}"></div><div class="field grow"><label for="rc-w${i}">Sorun</label><select id="rc-w${i}">${RCV_WHY.map((w) => `<option value="${w[0]}">${w[1]}</option>`).join('')}</select></div></div></div>`).join('')}
  <div class="field"><label for="rc-n">Not (isteğe bağlı)</label><input type="text" id="rc-n" placeholder="Örn. 2 kasa ezilmişti"></div><div class="err" id="rc-err" role="alert"></div>
  <button class="btn" data-a="recvok">Teslim aldım</button></div>`); };
H.recvok = () => {
  const m = S.modal; const o = ORDERS.find((x) => x.id === m.id); if (!o || o.status !== 'gonderildi') return; const g = (id) => document.getElementById(id); const sup = supById(o.supId);
  const rows = o.lines.map((l, i) => { const got = Math.max(0, Math.min(l.qty, Number(String(g('rc-q' + i).value).replace(',', '.')) || 0)); const why = g('rc-w' + i).value || (got < l.qty ? 'eksik' : ''); return { sid: l.sid, name: l.name, unit: l.unit, ord: l.qty, got, price: l.price, why: got < l.qty ? why || 'eksik' : why }; });
  const acc = Math.round(rows.reduce((a, r) => a + r.got * r.price, 0) * 100) / 100; const short = Math.round((o.total - acc) * 100) / 100; const note = (g('rc-n').value || '').trim();
  rows.forEach((r) => { const st = STOCK.find((x) => x.id === r.sid); if (!st || r.got <= 0) return; st.qty = r3(st.qty + r.got); st.cost = r.price; st.sup = o.supId; STOCKLOG.unshift({ t: isoShort(REF_ISO), name: st.name, qty: r.got, from: sup ? sup.name : 'Tedarikçi' }); });
  if (acc > 0) DEBTS.push({ id: 'd' + (++seq), who: sup ? sup.name : 'Tedarikçi', note: 'Sipariş ' + o.date + (short > 0 ? ' (eksik teslim, ' + fmt0(short) + ' düşüldü)' : ''), amt: acc, due: addDays(REF_ISO, (sup && sup.prof && sup.prof.pay_terms > 0) ? sup.prof.pay_terms : 14), rem: 3, on: true, ord: o.id });
  o.status = 'teslim'; o.recv = { rows: rows.filter((r) => r.got < r.ord || r.why), short, note, acc, date: REF_ISO }; o.total0 = o.total; o.total = acc;
  auditAdd({ type: 'ord', text: 'Sipariş teslim alındı: ' + (sup ? sup.name : '') + ', ' + fmt(acc) + (short > 0 ? ' (eksik ' + fmt(short) + ')' : '') });
  if (o.sbid) { try { sbClient().from('orders').update({ recv: o.recv }).eq('id', o.sbid).then(() => {}); } catch (e) {} }
  S.modal = { type: 'rate', id: o.id, stars: 0, ot: true }; renderModal(); toast(short > 0 ? 'Stok güncellendi. Eksik kısım borca yazılmadı.' : 'Stok güncellendi, tutar Borçlar\'a eklendi.', 'ok');
};
const shortMsg = (o, t) => { const r = o.recv; return ['Merhaba, ' + BIZ + ' olarak ' + o.date + ' tarihli siparişte sorun var:', ''].concat(r.rows.filter((x) => x.got < x.ord || x.why).map((x) => '- ' + x.name.split(' (')[0] + ': sipariş ' + fq(x.ord) + ', kabul ' + fq(x.got) + ' ' + x.unit + ' (' + (RCV_WHY.find((w) => w[0] === x.why) || ['', 'Sorun'])[1].toLowerCase() + ')')).concat(r.note ? ['', 'Not: ' + r.note] : []).concat(['', 'Eksik/hasarlı kısım için ' + fmt0(r.short) + ' alacak notu veya yeniden gönderim rica ederiz.']).join('\n'); };
H.shortwa = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || !o.recv) return; const t = supById(o.supId); window.open(waLink(t && t.phone, shortMsg(o, t)), '_blank', 'noopener'); };
/* tedarikçi puanı */
NEWM.rate = (m) => { const o = ORDERS.find((x) => x.id === m.id); const t = o && supById(o.supId); const star = (n) => `<button class="btn ${m.stars >= n ? '' : 'sec'}" style="padding:10px 0;flex:1" data-a="ratestar" data-v="${n}" aria-label="${n} yıldız">${n}</button>`;
  return sheet('Tedarikçiyi puanla', `<div class="stack"><p class="muted small">${esc(t ? t.name : 'Tedarikçi')} nasıldı? Puan, sıralamada ve önerilerde kullanılır.</p>
  <div class="row" style="gap:6px">${[1, 2, 3, 4, 5].map(star).join('')}</div>
  <div class="toggle"><div><b style="font-weight:600">Zamanında geldi</b></div><button class="sw" data-a="rateot" role="switch" aria-checked="${m.ot !== false}" aria-label="Zamanında geldi"></button></div>
  <div class="field"><label for="rt-n">Not (isteğe bağlı)</label><input type="text" id="rt-n" value="${esc(m.note || '')}"></div>
  <div class="row wrap"><button class="btn grow" data-a="ratesave">Kaydet</button><button class="btn sec" data-a="rateskip">Şimdi değil</button></div></div>`); };
H.ratestar = (el) => { const n = document.getElementById('rt-n'); if (n) S.modal.note = n.value; S.modal.stars = Number(el.dataset.v); renderModal(); };
H.rateot = () => { const n = document.getElementById('rt-n'); if (n) S.modal.note = n.value; S.modal.ot = !(S.modal.ot !== false); renderModal(); };
H.rateskip = () => { S.modal = null; render(); };
H.ratesave = () => { const m = S.modal; const o = ORDERS.find((x) => x.id === m.id); if (!o) return; if (!(m.stars >= 1)) { toast('Yıldız seç.', 'warn'); return; } const note = (document.getElementById('rt-n').value || '').trim();
  const r = { id: 'r' + (++seq), supId: o.supId, ord: o.id, stars: m.stars, ot: m.ot !== false, full: !(o.recv && o.recv.short > 0), note, date: REF_ISO }; RATES.push(r); S.modal = null; render(); toast('Puan kaydedildi.', 'ok');
  const t = supById(o.supId); if (t && t.sbid && SBS.biz && sbClient()) { try { sbClient().from('supplier_ratings').insert({ business_id: SBS.biz.id, supplier_id: t.sbid, order_id: o.sbid || null, stars: r.stars, on_time: r.ot, complete: r.full, note: note || null }).then(() => {}); } catch (e) {} } };
const rateOf = (sid) => { const L = RATES.filter((x) => x.supId === sid); if (!L.length) return null; return { n: L.length, avg: L.reduce((a, x) => a + x.stars, 0) / L.length, ot: L.filter((x) => x.ot).length / L.length, full: L.filter((x) => x.full).length / L.length }; };
const _sgScore84 = sgScore;
sgScore = function (t) { const r = _sgScore84(t); const q = rateOf(t.id); if (!q) return r; const adj = Math.round((q.avg - 3) * 4 + (q.ot - 0.8) * 6 + (q.full - 0.8) * 6); const v = Math.max(0, Math.min(100, r.v + adj)); const tags = r.tags.slice(); tags.push('★ ' + q1(q.avg) + ' (' + q.n + ')'); if (q.full < 0.7) tags.push('Sık eksik getiriyor'); const why = r.why.slice(); why.push('puanın ' + q1(q.avg) + '/5'); return { v, tags, why }; };
/* sipariş kartı: WhatsApp, eksik teslim, tekrarla */
saOrdersCard = function () {
  if (!ORDERS.length) return '';
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Verilen siparişler</h3></div>${ORDERS.map((o) => { const t = supById(o.supId); const rec = o.recv && o.recv.short > 0;
    return `<div class="rrow"><div><b style="font-weight:600">${esc(t ? t.name : 'Tedarikçi')}</b><div class="small muted">${esc(o.date)} · ${o.lines.map((l) => l.qty + ' ' + l.unit + ' ' + l.name.split(' (')[0]).join(', ')}</div>${rec ? `<div class="small" style="color:var(--nar)">Eksik teslim: ${fmt0(o.recv.short)} düşüldü</div>${recStat(o)}` : ''}${typeof ordExtra === 'function' ? ordExtra(o) : ''}</div><b class="num">${fmt0(o.total)}</b><div class="rfoot"><span class="pill ${ORD_ST[o.status][0]}">${ORD_ST[o.status][1]}</span>${o.conf ? ' <span class="pill p-ok">Tedarikçi onayladı</span>' : ''}
    ${o.status === 'gonderildi' ? `<button class="btn sm" data-a="ordrecv" data-id="${o.id}">Teslim aldım</button><button class="btn sm sec" data-a="ordsendopen" data-id="${o.id}">${o.wa || o.mailed ? 'Tekrar gönder' : 'Gönder'}</button><button class="btn sm sec" data-a="ordcopy" data-id="${o.id}">Kopyala</button><button class="btn sm sec" data-a="ordcancel" data-id="${o.id}">İptal</button>` : ''}
    ${o.status === 'teslim' ? `${rec ? `<button class="btn sm" data-a="shortwa" data-id="${o.id}">Eksiği WhatsApp'tan bildir</button>` : ''}<button class="btn sm sec" data-a="ordrec" data-id="${o.id}">Her hafta tekrarla</button>` : ''}</div></div>`; }).join('')}</div>`;
};
/* tekrarlayan sipariş */
const todayDow = () => { const a = REF_ISO.split('-').map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay(); };
H.ordrec = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o) return; const base = o.lines; if (RECUR.some((r) => r.supId === o.supId && JSON.stringify(r.lines.map((l) => [l.sid, l.qty])) === JSON.stringify(base.map((l) => [l.sid, l.qty])))) { toast('Bu sipariş zaten tekrarlanıyor.'); return; }
  RECUR.push({ id: 'rc' + (++seq), supId: o.supId, lines: base.map((l) => ({ sid: l.sid, name: l.name, unit: l.unit, qty: l.qty })), dow: todayDow(), on: true, last: REF_ISO }); render(); toast('Her ' + DOWN[todayDow()].toLowerCase() + ' hatırlatırım, tek dokunuşla siparişi oluşturursun.', 'ok'); };
const recDue = () => RECUR.filter((r) => r.on && r.dow === todayDow() && r.last !== REF_ISO && supById(r.supId));
const recPrice = (t, l) => (t.items && t.items[l.sid] > 0) ? t.items[l.sid] : (STOCK.find((x) => x.id === l.sid) || {}).cost || 0;
H.recgo = (el) => { const r = RECUR.find((x) => x.id === el.dataset.id); const t = r && supById(r.supId); if (!r || !t) return; const lines = r.lines.map((l) => ({ sid: l.sid, name: l.name, unit: l.unit, qty: l.qty, price: recPrice(t, l) })); const total = Math.round(lines.reduce((a, l) => a + l.qty * l.price, 0) * 100) / 100;
  const ord = { id: 'o' + (++seq), supId: t.id, date: isoShort(REF_ISO), iso: REF_ISO, lines, total, status: 'gonderildi', msg: orderMsg(t, lines) }; ORDERS.unshift(ord); r.last = REF_ISO; auditAdd({ type: 'ord', text: 'Tekrarlayan sipariş: ' + t.name + ', ' + fmt(total) }); ordPush(ord); render(); toast('Sipariş oluşturuldu. İstersen WhatsApp\'tan da gönder.', 'ok'); };
H.recoff = (el) => { const r = RECUR.find((x) => x.id === el.dataset.id); if (r) { r.on = !r.on; render(); } };
H.recdel = (el) => { const i = RECUR.findIndex((x) => x.id === el.dataset.id); if (i >= 0) { RECUR.splice(i, 1); render(); } };
H.recday = (el) => { const r = RECUR.find((x) => x.id === el.dataset.id); if (r) { r.dow = (r.dow + 1) % 7; render(); } };
function recCard() { if (!RECUR.length) return ''; return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Tekrarlayan siparişler</h3><p class="muted small" style="margin-top:2px">Günü gelince hatırlatırım, sen onaylarsın.</p></div>${RECUR.map((r) => { const t = supById(r.supId); return `<div class="rrow"><div><b style="font-weight:600">${esc(t ? t.name : 'Tedarikçi')}</b><div class="small muted">${r.lines.map((l) => fq(l.qty) + ' ' + esc(l.unit) + ' ' + esc(l.name.split(' (')[0])).join(', ')}</div></div><div class="rfoot"><button class="btn sm sec" data-a="recday" data-id="${r.id}">Her ${DOWN[r.dow].toLowerCase()}</button><button class="btn sm sec" data-a="recoff" data-id="${r.id}">${r.on ? 'Durdur' : 'Başlat'}</button><button class="btn sm" data-a="recgo" data-id="${r.id}">Şimdi oluştur</button><button class="btn sm sec" data-a="recdel" data-id="${r.id}" aria-label="Sil">Sil</button></div></div>`; }).join('')}</div>`; }
function recBanner() { const d = recDue(); return d.length ? `<div class="callout">${ic('info')}<div><b>Bugün tekrarlayan sipariş günü</b>${d.map((r) => { const t = supById(r.supId); return `<div class="row between" style="margin-top:8px;gap:8px"><span class="small">${esc(t.name)}: ${r.lines.map((l) => fq(l.qty) + ' ' + esc(l.unit) + ' ' + esc(l.name.split(' (')[0])).join(', ')}</span><button class="btn sm" data-a="recgo" data-id="${r.id}">Oluştur</button></div>`; }).join('')}</div></div>` : ''; }
const _vsa84 = viewSatinAlma; viewSatinAlma = function () { let h = _vsa84(); const tab = S.saTab || 'siparis'; const r = S.user && S.user.role; if (r !== 'patron' && r !== 'mudur' && r !== 'muhasebeci') return h; const x = tab === 'siparis' ? recBanner() : ''; const y = tab === 'siparis' || tab === 'tedarikci' ? recCard() : '';
  const k = '<div class="seg" role="group" aria-label="Satın alma bölümleri">'; const i = h.indexOf(k); if (i < 0) return h; const j = h.indexOf('</div>', i) + 6; return h.slice(0, j) + x + h.slice(j, h.lastIndexOf('</div>')) + y + '</div>'; };
const _nl84 = notifList; notifList = function () { const out = _nl84(); const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return out; recDue().forEach((r) => { const t = supById(r.supId); out.push({ key: 'rec' + r.id + '|' + REF_ISO, sev: 'info', text: 'Bugün ' + t.name + ' tekrarlayan sipariş günü. Siparişi oluştur.', view: 'satinalma', tab: null }); }); const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };
/* toptancı arama ve ekleme */
const SF = { q: '', res: null, busy: false, err: '' };
H.supfind = () => { SF.q = ''; SF.res = null; SF.err = ''; S.modal = { type: 'supfind' }; renderModal(); setTimeout(() => { H.supq(); }, 0); };
NEWM.supfind = () => { const have = new Set(SUPPLIERS.map((t) => t.sbuid).filter(Boolean)); const shop = S.settings.shop && isFinite(S.settings.shop.lat);
  const rows = (SF.res || []).map((r) => { const km = shop && r.lat != null ? gDist(S.settings.shop.lat, S.settings.shop.lng, r.lat, r.lng) / 1000 : null; return Object.assign({}, r, { km }); }).sort((a, b) => (a.km == null) - (b.km == null) || (a.km || 0) - (b.km || 0));
  return sheet('Toptancı bul', `<div class="stack"><div class="row" style="gap:8px"><div class="field grow"><label for="sf-q" class="sr">Ara</label><input type="text" id="sf-q" value="${esc(SF.q)}" placeholder="Toptancı adı, şehir veya ilçe"></div><button class="btn" data-a="supq">Ara</button></div>
  ${!SBS.biz ? `<div class="callout warn">${ic('alert')}<div>Toptancı aramak için önce Tedarikçi sekmesinden Tedarikçi paneline bağlan.</div></div>` : ''}
  ${SF.busy ? '<p class="muted small">Aranıyor…</p>' : ''}${SF.err ? `<div class="err">${esc(SF.err)}</div>` : ''}
  ${SF.res && !rows.length && !SF.busy ? '<p class="muted small">Sonuç yok. Toptancı henüz KaisPilot\'a kayıt olmamış olabilir. Onu kendin ekleyip fiyatlarını yazabilirsin.</p>' : ''}
  ${rows.map((r) => `<div class="card stack" style="padding:12px"><div class="row between"><b style="font-weight:600">${esc(r.name)}</b>${r.km != null ? `<span class="pill p-info">${q1(r.km)} km</span>` : ''}</div><div class="small muted">${esc([r.district, r.city].filter(Boolean).join(' / ') || 'Konum girilmemiş')} · ${r.product_count || 0} ürün</div>${r.about ? `<div class="small">${esc(String(r.about).slice(0, 120))}</div>` : ''}
  ${SUPPLIERS.some((t) => t.sbsrc === r.src_id) ? '<span class="pill p-ok">Listende</span>' : `<button class="btn sm" data-a="supadd" data-id="${r.src_id}">Listeme ekle</button>`}</div>`).join('')}
  <button class="btn sec" data-a="supnewm">Listede yok, elle ekle</button></div>`); };
H.supnewm = () => { H.supnew(); };
H.supq = async () => { const i = document.getElementById('sf-q'); if (i) SF.q = i.value.trim(); const c = sbClient(); if (!c || !SBS.biz) { SF.res = []; renderModal(); return; } SF.busy = true; SF.err = ''; renderModal();
  try { const r = await c.rpc('find_suppliers', { q: SF.q }); if (r.error) throw r.error; SF.res = r.data || []; } catch (e) { SF.res = []; SF.err = /find_suppliers|function/i.test(String(e && e.message)) ? 'Arama henüz kurulmamış. kaispilot_toptanci2.sql dosyasını çalıştır.' : sbMsg(e); }
  SF.busy = false; if (S.modal && S.modal.type === 'supfind') { renderModal(); const j = document.getElementById('sf-q'); if (j) { j.onkeydown = (ev) => { if (ev.key === 'Enter') H.supq(); }; } } };
H.supadd = async (el) => { const c = sbClient(); const r0 = (SF.res || []).find((x) => x.src_id === el.dataset.id); if (!c || !SBS.biz || !r0) return;
  try { const r = await c.rpc('link_supplier', { p_src: r0.src_id, p_business: SBS.biz.id }); if (r.error) throw r.error; const mine = r.data;
    if (!SUPPLIERS.some((t) => t.sbid === mine)) SUPPLIERS.push({ id: 't' + (++seq), name: r0.name, phone: r0.phone || '', email: '', lead: 2, minAmt: 0, items: {}, sbid: mine, sbsrc: r0.src_id, sbuid: r0.user_id });
    await sbSyncSups(); await sgPull(); S.modal = null; render(); toast(r0.name + ' listene eklendi. Fiyatlar kataloğundan geliyor.', 'ok');
  } catch (e) { SF.err = sbMsg(e); renderModal(); } };
/* eklenen toptancının profili asıl satırdan okunur */
const _sgPull84 = sgPull; sgPull = async function () { const c = sbClient(); if (!c || !SBS.biz) return false; const lk = SUPPLIERS.filter((t) => t.sbid && t.sbsrc); if (!lk.length) return _sgPull84();
  const saved = lk.map((t) => [t, t.sbid]); saved.forEach(([t]) => { t.sbid = t.sbsrc; }); let r = false; try { r = await _sgPull84(); } finally { saved.forEach(([t, id]) => { t.sbid = id; }); } return r; };
let supCodeBox84 = null;
const _nmSup84 = NEWM.sup;
NEWM.sup = (m) => { let h = _nmSup84(m); const t = m.id ? supById(m.id) : null; const has = (m.loc && m.loc.lat != null) || (t && t.prof && t.prof.lat != null && !t.sbid);
  const box = `<div class="card stack" style="padding:12px"><b style="font-weight:600">Konum</b><p class="small muted">Toptancının yanındaysan konumunu kaydet. Mesafeye göre sıralamada kullanırım.</p><div class="row wrap" style="gap:8px"><button class="btn sm sec" data-a="suploc" type="button">${ic('pin', 16)} Şu anki konumumu kaydet</button><span class="small ${has ? '' : 'muted'}" id="sp-locs">${has ? 'Konum kayıtlı' : 'Konum yok'}</span></div></div>`;
  return t && t.sbid ? h : h.replace('<p class="lbl">Birim fiyatlar', box + '<p class="lbl">Birim fiyatlar'); };
H.suploc = () => { const out = document.getElementById('sp-locs'); if (!navigator.geolocation) { if (out) out.textContent = 'Bu cihazda konum yok.'; return; } if (out) out.textContent = 'Konum alınıyor…';
  navigator.geolocation.getCurrentPosition((p) => { S.modal.loc = { lat: Math.round(p.coords.latitude * 1e5) / 1e5, lng: Math.round(p.coords.longitude * 1e5) / 1e5 }; const o2 = document.getElementById('sp-locs'); if (o2) { o2.textContent = 'Konum kayıtlı'; o2.classList.remove('muted'); } }, () => { const o2 = document.getElementById('sp-locs'); if (o2) o2.textContent = 'Konum alınamadı. İzin ver ve tekrar dene.'; }, { enableHighAccuracy: true, timeout: 15000 }); };
const _supsave84 = H.supsave; H.supsave = () => { const m = S.modal; const loc = m && m.loc; const id = m && m.id; const n0 = SUPPLIERS.length; _supsave84(); if (!loc || S.modal) return; const t = id ? supById(id) : SUPPLIERS[SUPPLIERS.length - 1]; if (t && (id || SUPPLIERS.length > n0)) { t.prof = Object.assign({}, t.prof || {}, { lat: loc.lat, lng: loc.lng }); render(); } };
/* Tedarikçiler kartı: Toptancı bul */
saSupsCard = function () {
  return `<div class="card flush"><div class="row between wrap" style="padding:16px 16px 6px;gap:8px"><div><h3>Tedarikçiler</h3><p class="muted small" style="margin-top:2px">Konuma, saate, fiyata ve puana göre sıralı. Detay için dokun.</p></div><div class="row" style="gap:6px"><button class="btn sm sec" data-a="supfind">${ic('search', 16)} Bul</button><button class="btn sm" data-a="supnew">${ic('plus', 16)} Ekle</button></div></div>${sgList()}</div>`;
};
/* v85: işletme konumu toptancıya (teslimat mesafesi) + teslimat ücreti sıralamada */
let _blK = '';
async function bizLocSync() { try { const sh = S.settings.shop; const c = sbClient(); if (!sh || !isFinite(sh.lat) || !c || !SBS.biz) return; const k = sh.lat + ',' + sh.lng; if (k === _blK) return; const r = await c.from('businesses').update({ lat: sh.lat, lng: sh.lng }).eq('id', SBS.biz.id); if (!r.error) _blK = k; } catch (e) {} }
const _shopset85 = H.shopset; H.shopset = () => { _shopset85(); setTimeout(bizLocSync, 4000); setTimeout(bizLocSync, 12000); };
const _sbPull85 = sbPull; sbPull = async function () { const ch = await _sbPull85(); bizLocSync(); return ch; };
const _sgScore85 = sgScore;
sgScore = function (t) { const r = _sgScore85(t); const p = t.prof; if (!p || !(p.delivery_fee > 0)) return r; const fee = Number(p.delivery_fee); const v = Math.max(0, r.v - Math.min(6, Math.round(fee / 60))); const why = r.why.slice(); why.push('teslimat ücreti ' + fmt0(fee) + (p.free_over > 0 ? ', ' + fmt0(p.free_over) + ' üzeri ücretsiz' : '')); return { v, tags: r.tags, why }; };

/* v86: eksik teslim, toptancı onayı */
const recStat = (o) => { if (!o.sbid) return ''; const st = o.recvSt || 'bekliyor'; return st === 'kabul' ? '<div class="small" style="color:var(--ok,#1f7a4d)">Toptancı kabul etti, alacak notu işlendi.</div>' : st === 'itiraz' ? `<div class="small" style="color:var(--nar)">Toptancı itiraz etti${o.recvReply ? ': ' + esc(o.recvReply) : ''}. WhatsApp'tan konuşabilirsin.</div>` : '<div class="small muted">Toptancının cevabı bekleniyor.</div>'; };
const _recvok86 = H.recvok;
H.recvok = () => { const m = S.modal; const o = m && ORDERS.find((x) => x.id === m.id); _recvok86(); if (o && o.recv && o.recv.short > 0 && o.sbid) { o.recvSt = 'bekliyor'; try { sbClient().from('orders').update({ recv_status: 'bekliyor' }).eq('id', o.sbid).then(() => ordNotify(o, 'eksik')); } catch (e) {} } };
const _sbPull86 = sbPull;
sbPull = async function () { let ch = await _sbPull86(); try { const c = sbClient(); const L = ORDERS.filter((o) => o.sbid && o.recv && o.recv.short > 0); if (c && L.length) { const q = await c.from('orders').select('id,recv_status,recv_reply').in('id', L.map((o) => o.sbid)); if (!q.error) (q.data || []).forEach((row) => { const o = ORDERS.find((x) => x.sbid === row.id); if (!o) return; if ((o.recvSt || 'bekliyor') !== (row.recv_status || 'bekliyor') || (o.recvReply || '') !== (row.recv_reply || '')) { o.recvSt = row.recv_status || 'bekliyor'; o.recvReply = row.recv_reply || ''; ch = true; } }); } } catch (e) {} return ch; };
const _nl86 = notifList; notifList = function () { const out = _nl86(); const u = S.user; if (!u || !['patron', 'mudur', 'muhasebeci'].includes(u.role)) return out; ORDERS.filter((o) => o.recvSt === 'itiraz').forEach((o) => { const t = supById(o.supId); out.push({ key: 'ritz' + o.id, sev: 'warn', text: (t ? t.name : 'Toptancı') + ' eksik teslim bildirimine itiraz etti. Konuşup çöz.', view: 'satinalma', tab: null }); }); const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };
/* v87: cari mutabakat (işletme tarafı) */
const RC = { t: null, per: '', orders: [], pays: [], recon: null, busy: false, err: '', sums: {} };
const RC_ST = { bekliyor: ['Onay bekliyor', 'p-warn'], onaylandi: ['Onaylandı', 'p-ok'], itiraz: ['İtiraz var', 'p-bad'] };
const rcMonL = (p) => { const a = p.split('-'); return ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][Number(a[1]) - 1] + ' ' + a[0]; };
const rcShift = (p, n) => { const a = p.split('-').map(Number); const d = new Date(Date.UTC(a[0], a[1] - 1 + n, 1)); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
function rcCompute(orders, pays, period) { const end = period + '-31'; const L = []; let dis = 0;
  orders.filter((o) => ['onaylandi', 'teslim'].includes(o.status) && (o.created_at || '').slice(0, 10) <= end).forEach((o) => { const d = (o.created_at || '').slice(0, 10); L.push({ d, t: 'Sipariş · ' + (o.lines || []).length + ' kalem', a: Number(o.total) || 0 }); if (o.recv && o.recv.short > 0) { if (o.recv_status === 'kabul') L.push({ d, t: 'Alacak notu (eksik teslim)', a: -Number(o.recv.short) }); else dis += Number(o.recv.short); } });
  pays.filter((p) => String(p.pay_date || '') <= end).forEach((p) => L.push({ d: String(p.pay_date), t: 'Ödeme' + (p.note ? ' · ' + p.note : ''), a: -Number(p.amt), by: p.by_side }));
  L.sort((a, b) => (a.d > b.d ? 1 : -1)); const carried = L.filter((x) => x.d.slice(0, 7) < period).reduce((a, x) => a + x.a, 0); return { lines: L.filter((x) => x.d.slice(0, 7) === period), carried: Math.round(carried * 100) / 100, bal: Math.round(L.reduce((a, x) => a + x.a, 0) * 100) / 100, dis }; }
function rcCard() { const L = SUPPLIERS.filter((t) => t.sbid && SBS.biz); if (!L.length) return '';
  return `<div class="card flush"><div style="padding:16px 16px 6px"><h3>Cari mutabakat</h3><p class="muted small" style="margin-top:2px">Panele bağlı tedarikçilerle aylık ekstre onaylayın.</p></div>${L.map((t) => `<button class="emp go" data-a="rcopen" data-id="${t.id}"><div class="grow"><b style="font-weight:600">${esc(t.name)}</b><div class="small muted">Ekstreyi aç, ödeme ekle, onayla</div></div>${ic('chevron', 18)}</button>`).join('')}</div>`; }
async function rcLoad() { const c = sbClient(); if (!c || !RC.t) return; RC.err = '';
  try { const [o, p, r] = await Promise.all([c.from('orders').select('*').eq('supplier_id', RC.t.sbid), c.from('cari_pay').select('*').eq('supplier_id', RC.t.sbid), c.from('cari_recon').select('*').eq('supplier_id', RC.t.sbid).eq('period', RC.per)]);
    if (o.error) throw o.error; RC.orders = o.data || []; if (p.error) throw p.error; RC.pays = p.data || []; RC.recon = (r.data && r.data[0]) || null; if (r.error) throw r.error; } catch (e) { RC.err = /cari_|relation|schema cache/i.test(String(e && e.message)) ? 'Kurulum eksik. kaispilot_mutabakat.sql dosyasını çalıştır.' : sbMsg(e); }
  if (S.modal && S.modal.type === 'ekstre') renderModal(); }
H.rcopen = (el) => { const t = supById(el.dataset.id); if (!t) return; RC.t = t; RC.per = REF_ISO.slice(0, 7); RC.orders = []; RC.pays = []; RC.recon = null; S.modal = { type: 'ekstre' }; renderModal(); rcLoad(); };
H.rcmon = (el) => { RC.per = rcShift(RC.per, Number(el.dataset.v)); RC.recon = null; renderModal(); rcLoad(); };
async function rcNotifyBiz() { const o = RC.orders.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]; if (o) ordNotify({ sbid: o.id }, 'ekstre'); }
H.rcsend = async () => { const c = sbClient(); const k = rcCompute(RC.orders, RC.pays, RC.per); const row = { business_id: SBS.biz.id, supplier_id: RC.t.sbid, period: RC.per, bal: k.bal, sent_by: 'isletme', status: 'bekliyor', note: null, updated_at: new Date().toISOString() };
  const r = await c.from('cari_recon').upsert(row, { onConflict: 'supplier_id,period' }); if (r.error) { RC.err = /cari_|relation|schema cache/i.test(r.error.message) ? 'Kurulum eksik. kaispilot_mutabakat.sql dosyasını çalıştır.' : r.error.message; renderModal(); return; } RC.recon = row; rcNotifyBiz(); toast('Ekstre toptancıya gönderildi.', 'ok'); renderModal(); };
H.rcok = async () => { const c = sbClient(); const r = await c.from('cari_recon').update({ status: 'onaylandi', note: null, updated_at: new Date().toISOString() }).eq('supplier_id', RC.t.sbid).eq('period', RC.per); if (r.error) { RC.err = r.error.message; renderModal(); return; } RC.recon.status = 'onaylandi'; rcNotifyBiz(); toast('Ekstre onaylandı.', 'ok'); renderModal(); };
H.rcno = async () => { const c = sbClient(); const note = ((document.getElementById('rc-n') || {}).value || '').slice(0, 200); const r = await c.from('cari_recon').update({ status: 'itiraz', note: note || null, updated_at: new Date().toISOString() }).eq('supplier_id', RC.t.sbid).eq('period', RC.per); if (r.error) { RC.err = r.error.message; renderModal(); return; } RC.recon.status = 'itiraz'; RC.recon.note = note; rcNotifyBiz(); toast('İtirazın iletildi.', 'ok'); renderModal(); };
H.rcpay = async () => { const c = sbClient(); const amt = trNum((document.getElementById('rc-a') || {}).value); if (!(amt > 0)) { toast('Ödeme tutarını yaz.', 'warn'); return; } const row = { business_id: SBS.biz.id, supplier_id: RC.t.sbid, amt, pay_date: REF_ISO, note: ((document.getElementById('rc-pn') || {}).value || '').slice(0, 80) || null, by_side: 'isletme' };
  const r = await c.from('cari_pay').insert(row); if (r.error) { RC.err = /cari_|relation|schema cache/i.test(r.error.message) ? 'Kurulum eksik. kaispilot_mutabakat.sql dosyasını çalıştır.' : r.error.message; renderModal(); return; } RC.pays.push(row); toast('Ödeme kaydedildi.', 'ok'); renderModal(); };
NEWM.ekstre = () => { const t = RC.t; if (!t) return sheet('Ekstre', '<p class="muted">Tedarikçi seçilmedi.</p>'); const k = rcCompute(RC.orders, RC.pays, RC.per); const rec = RC.recon; const st = rec ? RC_ST[rec.status] : null; const mine = rec && rec.sent_by === 'isletme'; const other = rec && rec.sent_by === 'toptanci'; const diff = other ? Math.round((k.bal - rec.bal) * 100) / 100 : 0;
  return sheet(t.name + ' ekstresi', `<div class="stack"><div class="row between"><button class="btn sm sec" data-a="rcmon" data-v="-1" aria-label="Önceki ay">‹</button><b>${rcMonL(RC.per)}</b><button class="btn sm sec" data-a="rcmon" data-v="1" aria-label="Sonraki ay">›</button></div>
  ${RC.err ? `<div class="err">${esc(RC.err)}</div>` : ''}<div class="logline"><span>Devreden</span><span>${fmt(k.carried)}</span></div>
  ${k.lines.map((x) => `<div class="logline"><span>${esc(x.d.slice(8))}.${esc(x.d.slice(5, 7))} ${esc(x.t)}${x.by ? ' <span class="pill p-mute">' + (x.by === 'isletme' ? 'sen' : 'toptancı') + '</span>' : ''}</span><span>${x.a < 0 ? '−' : ''}${fmt(Math.abs(x.a))}</span></div>`).join('') || '<p class="muted small">Bu ay hareket yok.</p>'}
  <div class="logline"><b>Dönem sonu bakiye (sen borçlusun)</b><b>${fmt(k.bal)}</b></div>${k.dis > 0 ? `<p class="small muted">${fmt0(k.dis)} tutarındaki eksik teslim toptancı kabul edene kadar bakiyeye düşülmedi.</p>` : ''}
  ${st ? `<div class="callout"><div><span class="pill ${st[1]}">${st[0]}</span><div class="small" style="margin-top:6px">${mine ? 'Sen gönderdin: ' : 'Toptancı gönderdi: '}${fmt(rec.bal)}${rec.note ? '<br>Not: ' + esc(rec.note) : ''}${other && Math.abs(diff) >= 0.5 ? '<br>Senin kaydınla fark: ' + fmt(Math.abs(diff)) : ''}</div></div></div>` : ''}
  ${rec && rec.status === 'onaylandi' ? '' : other && rec.status === 'bekliyor' ? `${Math.abs(diff) < 0.5 ? '<button class="btn" data-a="rcok">Onayla</button>' : '<p class="small muted">Bakiyeler farklı. Farkı bulup düzelt ya da itiraz et.</p>'}<div class="field"><label for="rc-n">İtiraz sebebi</label><input type="text" id="rc-n" placeholder="Örn: 12.11 tarihli ödeme eksik"></div><button class="btn sec" data-a="rcno">İtiraz et</button>` : `<button class="btn" data-a="rcsend">${rec ? 'Yeniden gönder' : 'Toptancıya onaya gönder'}</button>`}
  <p class="lbl">Ödeme ekle</p><div class="row" style="gap:8px"><div class="field grow"><label for="rc-a">Tutar (₺)</label><input type="text" id="rc-a" inputmode="decimal"></div><div class="field grow"><label for="rc-pn">Not</label><input type="text" id="rc-pn" placeholder="Havale, nakit"></div></div><button class="btn sec" data-a="rcpay">Ödemeyi kaydet</button></div>`); };
const _sat87 = viewSatinAlma; viewSatinAlma = function () { let h = _sat87(); if ((S.saTab || 'siparis') !== 'tedarikci') return h; const r = S.user && S.user.role; if (r !== 'patron' && r !== 'mudur' && r !== 'muhasebeci') return h; const x = rcCard(); return x ? h.slice(0, h.lastIndexOf('</div>')) + x + '</div>' : h; };
/* v88: WhatsApp sonrası toptancının hazırladığı sipariş, hatırlatma */
const ORDDR = [];
async function ordDraftSync() { try { const c = sbClient(); const ids = SUPPLIERS.filter((t) => t.sbid).map((t) => t.sbid); if (!c || !SBS.biz || !ids.length) return false; const q = await c.from('orders').select('*').in('supplier_id', ids).eq('status', 'taslak'); if (q.error) return false; const rows = q.data || []; const before = JSON.stringify(ORDDR.map((x) => x.id)); ORDDR.splice(0, ORDDR.length, ...rows.filter((r) => !ORDERS.some((o) => o.sbid === r.id))); return JSON.stringify(ORDDR.map((x) => x.id)) !== before; } catch (e) { return false; } }
const _sbPull88 = sbPull; sbPull = async function () { const ch = await _sbPull88(); const c2 = await ordDraftSync(); return ch || c2; };
function drCard() { if (!ORDDR.length) return ''; return `<div class="card stack"><div><h3>Toptancıdan gelen sipariş</h3><p class="muted small" style="margin-top:2px">WhatsApp'ta konuştuğunuz siparişi toptancı hazırladı. Kontrol edip onayla.</p></div>${ORDDR.map((r) => { const t = SUPPLIERS.find((x) => x.sbid === r.supplier_id); return `<div class="card stack" style="padding:12px"><div class="row between"><b style="font-weight:600">${esc(t ? t.name : 'Toptancı')}</b><b class="num">${fmt0(r.total)}</b></div>${(r.lines || []).map((l) => `<div class="logline" style="padding:6px 0"><span>${esc(String(l.name).split(' (')[0])}</span><span>${fq(l.qty)} ${esc(l.unit)} × ${fmt(l.price)}</span></div>`).join('')}<div class="row wrap"><button class="btn grow" data-a="drok" data-id="${r.id}">Onayla</button><button class="btn sec" data-a="drno" data-id="${r.id}">Reddet</button></div></div>`; }).join('')}</div>`; }
H.drok = async (el) => { const r = ORDDR.find((x) => x.id === el.dataset.id); const t = r && SUPPLIERS.find((x) => x.sbid === r.supplier_id); const c = sbClient(); if (!r || !t || !c) return;
  const u = await c.from('orders').update({ status: 'onaylandi' }).eq('id', r.id); if (u.error) { toast('Onaylanamadı: ' + sbMsg(u.error), 'warn'); return; }
  const lines = (r.lines || []).map((l) => { const st = STOCK.find((s) => sgBase(s.name) === sgBase(l.name)); return { sid: st ? st.id : null, name: l.name, unit: l.unit, qty: Number(l.qty), price: Number(l.price) }; });
  ORDERS.unshift({ id: 'o' + (++seq), supId: t.id, date: isoShort(REF_ISO), iso: REF_ISO, lines, total: Number(r.total), status: 'gonderildi', conf: true, sbid: r.id, msg: orderMsg(t, lines) }); ORDDR.splice(ORDDR.indexOf(r), 1);
  auditAdd({ type: 'ord', text: 'Toptancı siparişi onaylandı: ' + t.name + ', ' + fmt(r.total) }); ordNotify({ sbid: r.id }, 'taslak_ok'); render(); toast('Sipariş onaylandı.', 'ok'); };
H.drno = async (el) => { const r = ORDDR.find((x) => x.id === el.dataset.id); const c = sbClient(); if (!r || !c) return; const u = await c.from('orders').update({ status: 'iptal' }).eq('id', r.id); if (u.error) { toast('Reddedilemedi: ' + sbMsg(u.error), 'warn'); return; } ORDDR.splice(ORDDR.indexOf(r), 1); ordNotify({ sbid: r.id }, 'iptal'); render(); toast('Sipariş reddedildi.'); };
H.ordremind = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o) return; const t = supById(o.supId); const txt = 'Merhaba, ' + BIZ + ' olarak ' + o.date + ' tarihli ' + fmt0(o.total) + ' tutarındaki siparişimizi KaisPilot panelinizden onaylayabilir misiniz? Teslim tarihini de yazarsanız sevinirim.'; window.open(waLink(t && t.phone, txt), '_blank', 'noopener'); };
const _ow88 = H.ordwa; H.ordwa = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (o && !o.wa) o.wa = REF_ISO; _ow88(el); };
const _soc88 = saOrdersCard; saOrdersCard = function () { return drCard() + _soc88().replace(/(<button class="btn sm sec" data-a="ordsendopen" data-id="([^"]+)">[^<]*<\/button>)/g, (m, b, id) => { const o = ORDERS.find((x) => x.id === id); return b + (o && o.sbid && !o.conf ? `<button class="btn sm sec" data-a="ordremind" data-id="${id}">Hatırlat</button>` : ''); }); };
const _nl88 = notifList; notifList = function () { const out = _nl88(); const u = S.user; if (!u || !['patron', 'mudur'].includes(u.role)) return out; ORDDR.forEach((r) => { const t = SUPPLIERS.find((x) => x.sbid === r.supplier_id); out.push({ key: 'dr' + r.id, sev: 'info', text: (t ? t.name : 'Toptancı') + ' senin için ' + fmt0(r.total) + ' tutarında sipariş hazırladı. Onayını bekliyor.', view: 'satinalma', tab: null }); }); const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };
/* v89: teklif bağı, çevrimdışı uyarısı, fiyat geçmişi, teslimat takibi, sipariş değişikliği */
(function () { if (typeof document === 'undefined') return; const d = document.createElement('div'); d.id = 'kp-off'; d.setAttribute('role', 'alert'); d.textContent = 'Bağlantı yok. Değişiklikler bağlantı gelince eşitlenir.'; d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:300;background:#b3392f;color:#fff;font:600 13px/1.3 system-ui,sans-serif;padding:8px 14px;text-align:center;display:none'; document.body.appendChild(d);
  const sy = () => { d.style.display = navigator.onLine === false ? 'block' : 'none'; }; window.addEventListener('online', () => { sy(); try { toast('Bağlantı geri geldi.', 'ok'); } catch (e) {} }); window.addEventListener('offline', sy); sy(); })();
const sbFriendly = (m) => { m = String(m || ''); if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Bağlantı koptu. İnterneti kontrol edip tekrar dene.'; if (/row-level security|policy|permission/i.test(m)) return 'Bu işlem için yetkin yok ya da SQL kurulumu eksik.'; if (/jwt|expired/i.test(m)) return 'Oturumun süresi dolmuş. Çıkış yapıp tekrar gir.'; return m; };
const DL_TXT = { hazirlaniyor: ['p-warn', 'Hazırlanıyor'], yolda: ['p-info', 'Yolda'], teslim_edildi: ['p-ok', 'Toptancı teslim etti'] };
const _sbPull89 = sbPull;
sbPull = async function () { let ch = await _sbPull89(); try { const c = sbClient(); const L = ORDERS.filter((o) => o.sbid); if (c && L.length) { const q = await c.from('orders').select('id,delivery,delivery_by,change,lines,total').in('id', L.map((o) => o.sbid)); if (!q.error) (q.data || []).forEach((row) => { const o = ORDERS.find((x) => x.sbid === row.id); if (!o) return;
  if ((o.dl || '') !== (row.delivery || '')) { o.dl = row.delivery || ''; o.dlBy = row.delivery_by || ''; ch = true; }
  const cg = row.change || null; if (JSON.stringify(o.chg || null) !== JSON.stringify(cg)) { o.chg = cg; ch = true; }
  if (cg && cg.status === 'kabul' && o.chgAt !== cg.at && Array.isArray(cg.lines)) { o.lines = cg.lines.map((l) => { const old = o.lines.find((x) => x.name === l.name) || {}; return Object.assign({}, old, l); }); o.total = cg.total; o.chgAt = cg.at; ch = true; } }); }
  const ids = SUPPLIERS.filter((t) => t.sbid).map((t) => t.sbsrc || t.sbid); if (c && ids.length) { const since = new Date(Date.now() - 45 * 864e5).toISOString(); const p = await c.from('price_hist').select('*').in('supplier_id', ids).gte('at', since).order('at', { ascending: true }); if (!p.error) SUPPLIERS.forEach((t) => { const L2 = (p.data || []).filter((x) => x.supplier_id === (t.sbsrc || t.sbid)); if (JSON.stringify(t.ph || []) !== JSON.stringify(L2)) { t.ph = L2; ch = true; } }); } } catch (e) {} return ch; };
/* fiyat değişimi: ürün başına son 30 gün */
function phChanges(t) { const by = {}; (t.ph || []).forEach((x) => { (by[x.product_id] = by[x.product_id] || []).push(x); }); const lim = Date.now() - 30 * 864e5;
  return Object.values(by).map((L) => { const w = L.filter((x) => new Date(x.at).getTime() >= lim); if (!w.length) return null; const o = Number(w[0].old_price) || 0, n = Number(w[w.length - 1].new_price) || 0; if (!o || !n) return null; return { name: w[0].name, unit: w[0].unit, o, n, pc: Math.round((n - o) / o * 1000) / 10, at: w[w.length - 1].at }; }).filter((x) => x && Math.abs(x.pc) >= 1).sort((a, b) => Math.abs(b.pc) - Math.abs(a.pc)); }
const _supinfo89 = NEWM.supinfo;
NEWM.supinfo = (m) => { const h = _supinfo89(m); const t = supById(m.id); const L = t ? phChanges(t) : []; if (!L.length) return h;
  const card = `<div class="card flush"><div style="padding:12px 16px 4px"><b>Son 30 günde fiyat değişimi</b></div>${L.slice(0, 8).map((x) => `<div class="logline" style="padding:8px 16px"><span>${esc(x.name)}<span class="small muted" style="display:block">${fmt(x.o)} → ${fmt(x.n)} / ${esc(x.unit || '')}</span></span><b style="color:${x.pc > 0 ? 'var(--nar,#b3392f)' : 'var(--ok,#1f6f55)'}">${x.pc > 0 ? '+' : ''}${String(x.pc).replace('.', ',')}%</b></div>`).join('')}</div>`;
  return h.replace('<button class="btn sec" data-a="supedit"', card + '<button class="btn sec" data-a="supedit"'); };
/* teslimat + değişiklik: sipariş kartına ek bilgi */
function ordExtra(o) { if (!o.sbid) return ''; let h = ''; const dl = o.dl && DL_TXT[o.dl]; if (o.dl) h += `<div style="margin-top:4px"><span class="pill ${dl[0]}">${dl[1]}${o.dlBy && o.dlBy !== 'Toptancı' ? ' · ' + esc(o.dlBy) : ''}</span></div>`; if (o.rfq) h += ' <span class="pill p-mute">teklif üzerinden</span>';
  const c = o.chg; if (c && c.status === 'bekliyor') { const diff = Math.round((c.total - o.total) * 100) / 100; const dsc = (c.lines || []).map((l) => { const old = o.lines.find((x) => x.name === l.name); return esc(l.name.split(' (')[0]) + ': ' + fq(old ? old.qty : 0) + ' → ' + fq(l.qty) + (old && Number(old.price) !== Number(l.price) ? ' · ' + fmt(old.price) + ' → ' + fmt(l.price) : ''); }).join('<br>');
    h += c.by === 'sup' ? `<div class="callout" style="margin-top:8px"><div><b>Toptancı değişiklik öneriyor (${diff > 0 ? '+' : ''}${fmt0(diff)})</b><div class="small" style="margin-top:4px">${dsc}</div>${c.note ? `<div class="small muted">${esc(c.note)}</div>` : ''}<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm sec" data-a="chgno" data-id="${o.id}">Reddet</button><button class="btn sm" data-a="chgok" data-id="${o.id}">Kabul et</button></div></div></div>` : `<div class="small muted" style="margin-top:6px">Değişiklik teklifin cevap bekliyor (${diff > 0 ? '+' : ''}${fmt0(diff)}).</div>`; }
  else if (c && c.status === 'red') h += '<div class="small muted" style="margin-top:6px">Son değişiklik teklifi reddedildi.</div>';
  return h; }
H.chg = (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || !o.sbid) return; S.modal = { type: 'chg', id: o.id }; renderModal(); };
NEWM.chg = (m) => { const o = ORDERS.find((x) => x.id === m.id); if (!o) return sheet('Değişiklik öner', '<p class="muted">Sipariş bulunamadı.</p>'); const t = supById(o.supId);
  return sheet('Değişiklik öner', `<div class="stack"><p class="muted small">${esc(t ? t.name : 'Toptancı')} kabul ederse sipariş güncellenir. Miktara 0 yazarsan satır çıkar.</p>${o.lines.map((l, i) => `<div class="row between" style="gap:8px"><span class="grow small"><b style="font-weight:600">${esc(l.name.split(' (')[0])}</b> <span class="muted">${esc(l.unit)}</span></span><input class="cg-q" inputmode="decimal" value="${esc(l.qty)}" aria-label="Miktar" style="width:72px"><input class="cg-p" inputmode="decimal" value="${esc(l.price)}" aria-label="Birim fiyat" style="width:84px"></div>`).join('')}
  <div class="field"><label for="cg-n">Neden</label><input id="cg-n" placeholder="Örn: Bu hafta daha az lazım"></div><p class="err" id="cg-e"></p><button class="btn" data-a="chgsend" data-id="${o.id}">Karşıya öner</button></div>`); };
H.chgsend = async (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || !o.sbid || SBS.busy) return; const qs = [...document.querySelectorAll('.cg-q')], ps = [...document.querySelectorAll('.cg-p')]; const num = (v) => Number(String(v).replace(',', '.')) || 0; const lines = []; o.lines.forEach((l, i) => { const q = num(qs[i].value), p = num(ps[i].value); if (q > 0 && p >= 0) lines.push(Object.assign({}, l, { qty: q, price: p })); }); const e = document.getElementById('cg-e');
  if (!lines.length) { if (e) e.textContent = 'En az bir satır kalmalı.'; return; } if (JSON.stringify(lines) === JSON.stringify(o.lines)) { if (e) e.textContent = 'Hiçbir şeyi değiştirmedin.'; return; }
  const total = Math.round(lines.reduce((a, l) => a + l.qty * l.price, 0) * 100) / 100; const ch = { by: 'biz', status: 'bekliyor', lines, total, note: ((document.getElementById('cg-n') || {}).value || '').slice(0, 160), at: new Date().toISOString() };
  SBS.busy = true; try { const r = await sbClient().from('orders').update({ change: ch }).eq('id', o.sbid); if (r.error) throw r.error; o.chg = ch; ordNotify(o, 'degisiklik'); S.modal = null; render(); toast('Değişiklik teklifi gönderildi.', 'ok'); } catch (x) { if (e) e.textContent = /change|schema cache/i.test(String(x.message)) ? 'Kurulum eksik. kaispilot_tedarikci3.sql çalıştırılmalı.' : sbFriendly(x.message); } finally { SBS.busy = false; } };
H.chgok = async (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || !o.chg || SBS.busy) return; SBS.busy = true; try { const ch = Object.assign({}, o.chg, { status: 'kabul' }); const r = await sbClient().from('orders').update({ lines: ch.lines, total: ch.total, change: ch }).eq('id', o.sbid); if (r.error) throw r.error; o.lines = ch.lines.map((l) => Object.assign({}, o.lines.find((x) => x.name === l.name) || {}, l)); o.total = ch.total; o.chg = ch; o.chgAt = ch.at; o.msg = orderMsg(supById(o.supId) || { lead: 2 }, o.lines); ordNotify(o, 'degisiklik_ok'); render(); toast('Değişiklik kabul edildi, sipariş güncellendi.', 'ok'); } catch (x) { toast(sbFriendly(x.message), 'bad'); } finally { SBS.busy = false; } };
H.chgno = async (el) => { const o = ORDERS.find((x) => x.id === el.dataset.id); if (!o || !o.chg || SBS.busy) return; SBS.busy = true; try { const ch = Object.assign({}, o.chg, { status: 'red' }); const r = await sbClient().from('orders').update({ change: ch }).eq('id', o.sbid); if (r.error) throw r.error; o.chg = ch; ordNotify(o, 'degisiklik_red'); render(); toast('Değişiklik reddedildi.'); } catch (x) { toast(sbFriendly(x.message), 'bad'); } finally { SBS.busy = false; } };
const _soc89 = saOrdersCard; saOrdersCard = function () { return _soc89().replace(/(<button class="btn sm sec" data-a="ordcancel" data-id="([^"]+)">İptal<\/button>)/g, (m, b, id) => { const o = ORDERS.find((x) => x.id === id); return (o && o.sbid && !(o.chg && o.chg.status === 'bekliyor') ? `<button class="btn sm sec" data-a="chg" data-id="${id}">Değişiklik</button>` : '') + b; }); };
const _nl89 = notifList; notifList = function () { const out = _nl89(); const u = S.user; if (!u || !['patron', 'mudur', 'muhasebeci'].includes(u.role)) return out;
  ORDERS.filter((o) => o.sbid).forEach((o) => { const t = supById(o.supId); const n = t ? t.name : 'Toptancı'; if (o.dl === 'yolda' && o.status === 'gonderildi') out.push({ key: 'dly' + o.id, sev: 'info', text: n + ' siparişin yolda' + (o.dlBy && o.dlBy !== 'Toptancı' ? ' (' + o.dlBy + ')' : '') + '. Gelince Teslim aldım de.', view: 'satinalma', tab: null }); if (o.chg && o.chg.status === 'bekliyor' && o.chg.by === 'sup') out.push({ key: 'chg' + o.id + o.chg.at, sev: 'warn', text: n + ' siparişte değişiklik öneriyor. Kabul ya da reddet.', view: 'satinalma', tab: null }); });
  try { SUPPLIERS.forEach((t) => phChanges(t).filter((x) => x.pc >= 5 && Date.now() - new Date(x.at).getTime() < 7 * 864e5 && STOCK.some((s) => sgBase(s.name) === sgBase(x.name))).forEach((x) => out.push({ key: 'phr' + t.id + x.name + x.at.slice(0, 10), sev: 'warn', text: t.name + ' ' + x.name + ' fiyatını %' + String(x.pc).replace('.', ',') + ' artırdı. Başka toptancıya bak.', view: 'satinalma', tab: null }))); } catch (e) {}
  const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };
/* v90: teslim kanıtı (toptancı/sürücü teslim ederken alan kişi ve fotoğraf) */
const _sbPull90 = sbPull;
sbPull = async function () { let ch = await _sbPull90(); try { const c = sbClient(); const L = ORDERS.filter((o) => o.sbid && o.dl === 'teslim_edildi'); if (c && L.length) { const q = await c.from('orders').select('id,proof').in('id', L.map((o) => o.sbid)); if (!q.error) (q.data || []).forEach((row) => { const o = ORDERS.find((x) => x.sbid === row.id); if (o && JSON.stringify(o.proof || null) !== JSON.stringify(row.proof || null)) { o.proof = row.proof || null; ch = true; } }); } } catch (e) {} return ch; };
const _ordExtra90 = ordExtra; ordExtra = function (o) { let h = _ordExtra90(o); if (o.proof) h += `<div class="small muted" style="margin-top:6px">Teslim alan: <b>${esc(o.proof.name || '-')}</b>${o.proof.photo ? ` · <a target="_blank" rel="noopener" href="${esc(o.proof.photo)}">fotoğraf</a>` : ''}</div>`; return h; };
/* v91: toptancı siparişi reddedince senin tarafına yansır */
const _sbPull91 = sbPull;
sbPull = async function () { let ch = await _sbPull91(); try { const c = sbClient(); const L = ORDERS.filter((o) => o.sbid && o.status === 'gonderildi'); if (c && L.length) { const q = await c.from('orders').select('id,status,change').in('id', L.map((o) => o.sbid)); if (!q.error) (q.data || []).forEach((row) => { const o = ORDERS.find((x) => x.sbid === row.id); if (o && row.status === 'iptal') { o.status = 'iptal'; o.rejNote = (row.change && row.change.note) || ''; ch = true; } }); } } catch (e) {} return ch; };
const _nl91 = notifList; notifList = function () { const out = _nl91(); const u = S.user; if (!u || !['patron', 'mudur', 'muhasebeci'].includes(u.role)) return out; ORDERS.filter((o) => o.rejNote !== undefined && o.status === 'iptal').forEach((o) => { const t = supById(o.supId); out.push({ key: 'rej' + o.id, sev: 'bad', text: (t ? t.name : 'Toptancı') + ' siparişini reddetti' + (o.rejNote ? ': ' + o.rejNote : '') + '. Başka toptancıya ver.', view: 'satinalma', tab: null }); }); const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };
/* v92: toptancının sana tanıdığı özel iskonto */
const _sgPull92 = sgPull;
sgPull = async function () { const r = await _sgPull92(); try { const c = sbClient(); const ids = SUPPLIERS.filter((t) => t.sbid).map((t) => t.sbid); if (c && ids.length) { const q = await c.from('supplier_customer').select('supplier_id,discount_pct,note').in('supplier_id', ids); if (!q.error) { SUPPLIERS.forEach((t) => { const row = (q.data || []).find((x) => x.supplier_id === t.sbid); const pc = row ? Number(row.discount_pct) || 0 : 0; t.disc = pc; t.discNote = (row && row.note) || ''; if (pc > 0 && t.items && t.live) Object.keys(t.live).forEach((id) => { if (t.items[id] > 0 && !t.live[id].out) t.items[id] = Math.round(t.items[id] * (1 - pc / 100) * 100) / 100; }); }); } } } catch (e) {} return r; };
const _supinfo92 = NEWM.supinfo; NEWM.supinfo = (m) => { const h = _supinfo92(m); const t = supById(m.id); return t && t.disc > 0 ? h.replace('<div class="stack">', '<div class="stack"><div class="callout"><div><b>Sana özel %' + t.disc + ' iskonto uygulanıyor</b>' + (t.discNote ? '<div class="small muted">' + esc(t.discNote) + '</div>' : '') + '</div></div>') : h; };
/* v93: toptancının girdiği fatura tutarı; fark varsa uyarı */
const _sbPull93 = sbPull;
sbPull = async function () { let ch = await _sbPull93(); try { const c = sbClient(); const L = ORDERS.filter((o) => o.sbid && o.status !== 'iptal'); if (c && L.length) { const q = await c.from('orders').select('id,invoice').in('id', L.map((o) => o.sbid)); if (!q.error) (q.data || []).forEach((row) => { const o = ORDERS.find((x) => x.sbid === row.id); if (o && JSON.stringify(o.inv || null) !== JSON.stringify(row.invoice || null)) { o.inv = row.invoice || null; ch = true; } }); } } catch (e) {} return ch; };
const _ordExtra93 = ordExtra; ordExtra = function (o) { let h = _ordExtra93(o); const v = o.inv; if (v) { const d = Math.round((Number(v.total) - Number(o.total)) * 100) / 100; h += `<div class="small" style="margin-top:6px">Fatura${v.no ? ' ' + esc(v.no) : ''}: <b>${fmt(v.total)}</b>${Math.abs(d) >= 0.5 ? ` <span style="color:var(--nar,#b3392f)">(sipariş tutarından ${d > 0 ? '+' : ''}${fmt(d)}${v.why ? ', ' + esc(v.why) : ''})</span>` : ''}</div>`; } return h; };
const _nl93 = notifList; notifList = function () { const out = _nl93(); const u = S.user; if (!u || !['patron', 'mudur', 'muhasebeci'].includes(u.role)) return out; ORDERS.filter((o) => o.inv && Math.abs(Number(o.inv.total) - Number(o.total)) >= 0.5).forEach((o) => { const t = supById(o.supId); const d = Math.round((Number(o.inv.total) - Number(o.total)) * 100) / 100; out.push({ key: 'inv' + o.id + o.inv.total, sev: Math.abs(d) / (Number(o.total) || 1) >= 0.05 ? 'warn' : 'info', text: (t ? t.name : 'Toptancı') + ' faturası sipariş tutarından ' + fmt(Math.abs(d)) + (d > 0 ? ' fazla' : ' eksik') + (o.inv.why ? ' (' + o.inv.why + ')' : '') + '. Kontrol et.', view: 'satinalma', tab: null }); }); const rank = { bad: 0, warn: 1, info: 2 }; return out.sort((a, b) => rank[a.sev] - rank[b.sev]); };

