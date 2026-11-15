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
