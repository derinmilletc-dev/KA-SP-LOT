// Kais AI: KaisPilot'un yapay zekâ ucu. Uygulamadan gelen isteği doğrular, Claude'a iletir, JSON yanıt döner.
// Gerekli sır: ANTHROPIC_API_KEY. İsteğe bağlı: KAIS_AI_MODEL (varsayılan claude-sonnet-5-5).
// Yükleme: supabase functions deploy kais-ai   (JWT doğrulaması AÇIK kalsın, --no-verify-jwt kullanma)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ERR = (m: string, status = 400) => J({ error: m }, status);

const KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const MODEL = Deno.env.get('KAIS_AI_MODEL') || 'claude-sonnet-5-5';
// Fiş, belge ve fiyat listesi okuma gibi basit işler için ucuz model
const MODEL_FAST = Deno.env.get('KAIS_AI_MODEL_FAST') || 'claude-haiku-5-5';
const SB_SRV = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const num = (k: string, d: number) => { const v = Number(Deno.env.get(k)); return Number.isFinite(v) && v > 0 ? Math.floor(v) : d; };
// İşletme başına limitler (isteğe bağlı sırlarla değiştirilir)
const LIM = { chat: { day: num('AI_CHAT_DAY', 40), month: num('AI_CHAT_MONTH', 600) }, read: { day: num('AI_READ_DAY', 40), month: num('AI_READ_MONTH', 600) } };
const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';

const NL = String.fromCharCode(10);
const CATS = 'Hammadde, İş yemeği, Akaryakıt, Elektrik, Doğalgaz, Su, Telefon / internet, Kira, Temizlik, Ulaşım, Diğer';

const BASE = `Sen Kais AI'sın: Türkiye'deki küçük işletmeler (kafe, restoran, market) için çalışan bir yönetim ve muhasebe yardımcısı.
Kurallar:
- Her zaman Türkçe, kısa ve net yaz. Telefon ekranında okunacak, en fazla birkaç kısa paragraf.
- Yalnızca sana verilen "context" verisine ve kullanıcının yazdıklarına dayan. Veride olmayan rakamı uydurma; bilmiyorsan "bu veride yok" de.
- Para tutarlarını Türk lirası olarak, binlik ayraçlı yaz (örn. 12.400 ₺).
- Vergi, hukuk ve bordro konularında kesin hüküm verme; tahmin olduğunu söyle, muhasebeciye danışmayı öner.
- Başka kullanıcıların kişisel verisini ya da rolünün göremediği bilgiyi paylaşma.`;

const ACTIONS_DOC = `Kullanıcı bir işlem isterse "actions" dizisine şu tiplerden birini koy (kullanıcı onaylayınca uygulama uygular; sen uygulamış gibi konuşma, "hazırladım, onayına sunuyorum" de):
- siparis_olustur: {"urunler":[{"stok_id":"","ad":"","miktar":0}]}   (stok_id context.stok içinden)
- stok_guncelle: {"islemler":[{"stok_id":"","ad":"","miktar":0,"tur":"say|ekle|dus","neden":""}]}   (say: sayım sonucu mutlak miktar, ekle: artır, dus: azalt)
- excel_indir: {}
- duyuru_gonder: {"alicilar":["herkes" ya da ekip üyesi adları],"tur":"duyuru|mesai","baslik":"","mesaj":"","saat":1,"ucret":0}   (mesai teklifinde saat ve ucret doldur)
- rezervasyon_ekle: {"ad":"","telefon":"","kisi":0,"tarih":"YYYY-MM-DD","saat":"HH:MM","sure_dk":90,"not":""}
- rezervasyon_durum: {"rezervasyon_id":"","durum":"geldi|gelmedi|iptal|bitti|onay"}
- izin_karar: {"talep_id":"","karar":"onayla|reddet","neden":""}
- sozlesme_olustur: {"ad_soyad":"","gorev":"","baslangic":"YYYY-MM-DD","maas":0,"maas_turu":"net|brut","haftalik_saat":45,"deneme_ay":2}
- hafiza_kaydet: {"not":""}   (kullanıcı "bunu hatırla" derse kısa bir not)
Eksik bilgi varsa (tarih, kişi sayısı, tutar gibi) uydurma, soru sor ve actions boş kalsın.`;

const ROLE_ACTIONS: Record<string, string[]> = {
  patron: ['siparis_olustur', 'stok_guncelle', 'excel_indir', 'duyuru_gonder', 'rezervasyon_ekle', 'rezervasyon_durum', 'izin_karar', 'sozlesme_olustur', 'hafiza_kaydet'],
  mudur: ['siparis_olustur', 'stok_guncelle', 'excel_indir', 'duyuru_gonder', 'rezervasyon_ekle', 'rezervasyon_durum', 'izin_karar', 'sozlesme_olustur', 'hafiza_kaydet'],
  muhasebeci: ['excel_indir', 'hafiza_kaydet'],
  calisan: ['stok_guncelle', 'hafiza_kaydet'],
};

const SAYIM = 'Kip: raf fotoğrafıyla sayım. Fotoğrafta net gördüğün ürünleri say; net görmediğini sayma ve söyle. Sonucu stok_guncelle eylemine tur say olarak koy; stok_id değerini context.stok içinden eşleştir.' + NL;
const JSON_MODES: Record<string, string> = {
  fis: `Ekteki fiş, fatura ya da makbuzu oku. Yalnızca geçerli JSON döndür:
{"satici":"","tarih":"YYYY-MM-DD","toplam":0,"kdv_orani":0,"kategori":"","guven":"yuksek|orta|dusuk"}
- toplam: KDV dahil ödenecek genel toplam (sayı, TL).
- kdv_orani: belgede görünen baskın KDV oranı (0, 1, 10 ya da 20). Göremiyorsan 10 yaz ve guven'i orta ya da dusuk yap.
- kategori şunlardan biri: ${CATS}.
- Okuyamadığın alanı boş bırak, uydurma. Toplamı net okuyamıyorsan toplam 0 yaz.`,
  belge: `Kullanıcının yazdığı metinden bir çalışan için iş sözleşmesi bilgilerini çıkar. Yalnızca geçerli JSON döndür:
{"ad_soyad":"","gorev":"","baslangic":"YYYY-MM-DD","maas":0,"maas_turu":"net|brut","haftalik_saat":0,"deneme_ay":0}
Metinde olmayan alanı boş ya da 0 bırak, uydurma. maas_turu belli değilse boş bırak.`,
  sozlesme: `Ekteki (ya da metindeki) iş sözleşmesini oku. Yalnızca geçerli JSON döndür:
{"calisan_adi":"","gorev":"","ise_giris":"YYYY-MM-DD","maas":0,"maas_turu":"net|brut","haftalik_saat":0,"deneme_ay":0}
Okuyamadığın ya da yazmayan alanı boş ya da 0 bırak, uydurma.`,
};

function strip(s: string) { return String(s || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(); }
function parseJson(t: string): any {
  const s = strip(t); const a = s.indexOf('{'); const b = s.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

type Att = { type: string; media_type: string; data: string };
function contentBlocks(text: string, atts: Att[]) {
  const out: any[] = [];
  for (const a of atts) {
    if (a.type === 'pdf') out.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.data } });
    else out.push({ type: 'image', source: { type: 'base64', media_type: /^image\/(png|jpeg|webp|gif)$/.test(a.media_type) ? a.media_type : 'image/jpeg', data: a.data } });
  }
  out.push({ type: 'text', text });
  return out;
}

async function claude(system: string, messages: any[], maxTokens = 1800, model = MODEL) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('anthropic_' + r.status + ':' + String(j?.error?.message || '').slice(0, 160));
  return String((j.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('')).trim();
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return ERR('Yalnızca POST.', 405);
  if (!KEY) return ERR('Kais AI sunucuda henüz kurulmamış (ANTHROPIC_API_KEY yok).', 503);

  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/.test(auth)) return ERR('Giriş yapman gerekiyor.', 401);
  const sb = createClient(SB_URL, SB_ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const u = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  const uid = u?.data?.user?.id; if (!uid) return ERR('Oturumun geçersiz. Yeniden giriş yap.', 401);

  let body: any; try { body = await req.json(); } catch { return ERR('İstek okunamadı.'); }
  const bid = String(body?.business_id || ''); if (!/^[0-9a-f-]{36}$/i.test(bid)) return ERR('İşletme belirtilmemiş.');
  // erişim: RLS yalnızca üyesi olduğun işletmeyi gösterir
  const biz = await sb.from('businesses').select('id,name,owner_id').eq('id', bid).maybeSingle();
  if (biz.error || !biz.data) return ERR('Bu işletmeye erişimin yok.', 403);
  let role = 'calisan';
  if (biz.data.owner_id === uid) role = 'patron';
  else { const m = await sb.from('members').select('role').eq('business_id', bid).eq('user_id', uid).maybeSingle(); if (m.data?.role) role = String(m.data.role); }
  if (!ROLE_ACTIONS[role]) role = 'calisan';

  const mode = typeof body.mode === 'string' ? body.mode : '';
  const atts: Att[] = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 3)
    .filter((a: any) => a && typeof a.data === 'string' && a.data.length > 100 && ['image', 'pdf'].includes(a.type));
  if (atts.reduce((t, a) => t + a.data.length, 0) > 9_000_000) return ERR('Dosyalar çok büyük. Daha küçük bir fotoğraf dene.', 413);
  const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-20)
    .filter((m: any) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 6000) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return ERR('Mesaj boş.');
  const ctx = body.context && typeof body.context === 'object' ? JSON.stringify(body.context).slice(0, 48000) : '{}';
  const last = msgs[msgs.length - 1].content;

  // Kullanım özeti (Claude çağrılmaz, sayaç artmaz)
  if (mode === 'usage') {
    if (role !== 'patron') return ERR('Kullanımı yalnızca patron görebilir.', 403);
    const q = await sb.from('ai_usage').select('day,kind,n').eq('business_id', bid).gte('day', new Date(Date.now() - 32 * 864e5).toISOString().slice(0, 10));
    const tr = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10); const out: any = { chat: { day: 0, month: 0 }, read: { day: 0, month: 0 }, limits: LIM };
    (q.data || []).forEach((x: any) => { if (!out[x.kind]) return; if (x.day === tr) out[x.kind].day += x.n; if (String(x.day).slice(0, 7) === tr.slice(0, 7)) out[x.kind].month += x.n; });
    return J({ usage: out });
  }
  const kind: 'chat' | 'read' = (mode === 'fis' || mode === 'belge' || /"urunler"/.test(last)) ? 'read' : 'chat';
  if (SB_SRV) {
    try {
      const srv = createClient(SB_URL, SB_SRV, { auth: { persistSession: false } });
      const h = await srv.rpc('ai_usage_hit', { p_biz: bid, p_kind: kind, p_day_max: LIM[kind].day, p_month_max: LIM[kind].month });
      const row = Array.isArray(h.data) ? h.data[0] : h.data;
      if (!h.error && row && row.ok === false) return ERR(row.day_n >= LIM[kind].day ? 'Bugünlük Kais AI hakkın doldu. Yarın yeniden dene.' : 'Bu ayki Kais AI hakkın doldu. Yeni ay başında yenilenir.', 429);
    } catch (_) { /* sayaç tablosu kurulu değilse engelleme */ }
  }
  try {
    // 1) Yapılandırılmış okuma kipleri: yalnızca JSON
    if (JSON_MODES[mode]) {
      if (mode === 'fis' && !atts.length) return ERR('Okunacak fotoğraf ya da PDF bulunamadı.');
      const t = await claude(BASE + NL + NL + JSON_MODES[mode], [{ role: 'user', content: contentBlocks(last, atts) }], 700, mode === 'sozlesme' ? MODEL : MODEL_FAST);
      const d = parseJson(t);
      if (!d) return ERR('Belge okunamadı. Daha net bir fotoğraf dene.', 422);
      return J({ data: d });
    }
    // 2) Kampanya şablonları: reply içinde JSON dizi
    if (mode === 'kampanya') {
      const sys = [BASE, '', 'İşletme için müşteriye gidecek e-posta şablonları yaz.', 'Yalnızca geçerli bir JSON dizi döndür, şu biçimde: [ {n, subj, body} ]. n kısa ad, subj konu, body metin; anahtarlar çift tırnaklı olsun.', '5 şablon yaz. Metinde yer tutucu olarak {ad} ve {isletme} kullan.', 'Abartılı vaat verme, ticari ileti kurallarına uygun, kısa ve samimi ol.'].join(NL);
      const t = await claude(sys, [{ role: 'user', content: last }], 2200);
      return J({ reply: t });
    }
    // 3) Sohbet (sayım kipi dahil): reply + actions
    const allowed = ROLE_ACTIONS[role];
    const sys = `${BASE}

Kullanıcının rolü: ${role}. İşletme: ${biz.data.name}.
${mode === 'sayim' ? SAYIM : ''}
${ACTIONS_DOC}
Bu rolün kullanabileceği eylemler: ${allowed.join(', ')}. Dışındakini önerme.

Çıktı biçimi: yalnızca geçerli JSON: {"reply":"kullanıcıya yazılacak metin","actions":[...]}.
Kullanıcı açıkça belirli bir biçimde çıktı (ör. JSON) istiyorsa reply alanına o çıktıyı aynen koy.

Uygulamanın verdiği güncel veri (context, JSON):
${ctx}`;
    const turns = msgs.map((m: any, i: number) => i === msgs.length - 1 && atts.length ? { role: 'user', content: contentBlocks(m.content, atts) } : m);
    const t = await claude(sys, turns, 1800, kind === 'read' ? MODEL_FAST : MODEL);
    const j = parseJson(t);
    if (!j || typeof j.reply !== 'string') return J({ reply: strip(t) || 'Yanıt gelmedi.', actions: [] });
    const actions = (Array.isArray(j.actions) ? j.actions : []).filter((a: any) => a && allowed.includes(a.type)).slice(0, 5)
      .map((a: any) => ({ type: a.type, args: a.args && typeof a.args === 'object' ? a.args : {} }));
    return J({ reply: j.reply, actions });
  } catch (e) {
    const m = String((e as Error)?.message || e);
    console.error('kais-ai', m);
    if (/anthropic_(401|403)/.test(m)) return ERR('Kais AI anahtarı geçersiz. Yönetici kontrol etmeli.', 502);
    if (/anthropic_429|anthropic_529/.test(m)) return ERR('Kais AI şu an yoğun. Biraz sonra tekrar dene.', 503);
    return ERR('Kais AI şu an yanıt veremedi.', 502);
  }
}

Deno.serve(handle);
