# Kais zamanlayıcı (sunucu tarafı)

Uygulama kapalıyken de çalışır:
- Müşteriye **rezervasyon onayı** (kaydedilince) ve **hatırlatma** (varsayılan 3 saat önce) e-postası
- Geç kalan çalışan için yöneticiye bildirim
- Sabah 09:00 günün özeti bildirimi

## Kurulum (bir kez)
1. **Sırlar** (Supabase → Edge Functions → Secrets):
   - `CRON_SECRET`: kendi belirlediğin uzun rastgele bir şifre
   - `RESEND_API_KEY`: Resend anahtarı
   - `RESEND_FROM`: örn. `Çınar Kafe <rezervasyon@senin-alan-adin.com>` (alan adı Resend'de doğrulanmış olmalı)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: `kais-push` fonksiyonunda kullandığınla aynı değerler
2. **Fonksiyonu yükle:** `supabase functions deploy kais-cron --no-verify-jwt`
3. **SQL:** `sql/kais_cron.sql` dosyasını SQL Editor'de çalıştır (önce `BURAYA_GIZLI_SIFRE` yerine `CRON_SECRET` değerini yaz).
4. **Deneme:** `curl -X POST -H "x-cron-secret: <şifre>" https://<proje>.supabase.co/functions/v1/kais-cron` → `{"business":1,"mails":0,...}` döner.

## Notlar
- Saat dilimi `Europe/Istanbul` (logic.ts içinde `TZ`).
- Aynı bildirim iki kez gitmez (`mail_log` tablosu).
- Uygulamada Rezervasyon → Kais ayarları → "Otomatik e-posta" kapatılırsa sunucu o işletme için e-posta göndermez.
- Mantığı test etmek için: `node --experimental-strip-types supabase/test.mjs`

## İşletme izolasyonu (v90)

1. `sql/tenant_hardening.sql` dosyasını SQL editöründe bir kez çalıştır (tekrar çalıştırılabilir).
   Çalışanın finans verisine erişimini kapatır, tedarikçinin sipariş ve teklif sınırlarını sıkılaştırır,
   `audit_log` ve `kais_memory` tablolarını ve `delete_my_account()` fonksiyonunu ekler.
2. `sql/tenant_attack_test.sql` dosyasındaki 5 kimliği doldurup çalıştır. Sonuçta `BAŞARISIZ` satır olmamalı.
3. Yerel Postgres 16 üzerinde, mevcut kuralların birebir kopyasıyla denendi: önce 2 başarısız, sonra 46/46 geçti.

## Ekip verisi koruması (v100)
`sql/tenant_state_guard.sql` dosyasını SQL Editor'de çalıştır. Çalışan hesabı ekip kaydını yazarken ayar, yetki, ad, vardiya planı ve masa düzeni gibi bölümleri değiştiremez (sunucu eski haline geri koyar). Müdür yetki ayarlarını (SETTINGS.perm) ve rolleri değiştiremez. Patron serbesttir.

## Kais AI ve Kais push (v142)

`kais-ai` fotoğraftan fiş/fiyat listesi okuma ve Kais AI sohbetini, `kais-push` telefon bildirimini çalıştırır.

1. **Sır ekle** (Edge Functions → Secrets): `ANTHROPIC_API_KEY` (zorunlu). İsteğe bağlı: `KAIS_AI_MODEL`.
   `kais-push` için `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (kais-cron'dakilerle aynı).
2. **Yükle:** `supabase functions deploy kais-ai` ve `supabase functions deploy kais-push`.
   Panelden yüklüyorsan: Edge Functions → fonksiyon → Code sekmesine `index.ts` içeriğini yapıştır → Deploy.
   **JWT doğrulaması açık kalsın** (kais-cron'un aksine `--no-verify-jwt` kullanma).
3. `kais-push` yalnızca `send` eylemini destekler; `order_notify` ve `report_now` kapalıdır.

## Kais AI limitleri ve model ayrımı (v144)
- `supabase/sql/ai_usage.sql` dosyasını SQL Editor'de bir kez çalıştır (sayaç tablosu ve `ai_quota_hit`).
- Varsayılan limitler (işletme başına): sohbet günde 40, ayda 600; fiş ve fiyat okuma günde 40, ayda 600. Değiştirmek için sırlar: `AI_CHAT_DAY`, `AI_CHAT_MONTH`, `AI_READ_DAY`, `AI_READ_MONTH`.
- Fiş, belge ve fiyat listesi okuma `KAIS_AI_MODEL_FAST` (varsayılan `claude-haiku-5-5`) ile, sohbet ve eylemler `KAIS_AI_MODEL` (varsayılan `claude-sonnet-5-5`) ile çalışır.
- Tablo kurulu değilse sayaç sessizce atlanır, kullanıcı engellenmez.

## Hata kaydı, kullanım sayacı, kapanış bildirimi (v145)
- `supabase/sql/telemetry.sql` dosyasını SQL Editor'de bir kez çalıştır (app_errors ve app_events tabloları, kullanıcı yalnızca kendi adına ekleyebilir, okuma yalnızca sunucu).
- `kais-cron` güncellendi: her akşam 21:00-22:00 arası yöneticilere "Günün kapanışı" bildirimi (ciro, gider, fark). Dashboard'a `index.single.ts` içeriği yapıştırılır.
- Davet bağlantısı: `/?kod=KOD` adresi açılınca çalışan giriş ekranında kod kendiliğinden yazılır; davet penceresinde QR ve WhatsApp düğmesi vardır.
