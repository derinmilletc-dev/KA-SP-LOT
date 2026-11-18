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
- `kais-cron` güncellendi: her akşam 21:00-22:00 arası yöneticilere "Günün kapanışı" bildirimi (ciro, gider, fark). Dashboard'a `index.single.ts` içeriği yapıştırılır (logic.ts içinde birleşik; `python3 tools/build_cron_single.py` ile üretilir). Panelde ayrı logic.ts dosyası olmadığı için index.ts değil index.single.ts yapıştırılmalı.
- Davet bağlantısı: `/?kod=KOD` adresi açılınca çalışan giriş ekranında kod kendiliğinden yazılır; davet penceresinde QR ve WhatsApp düğmesi vardır.

## Admin paneli (v146)
- Adres: `<site>/admin/` (aynı repo, ayrı sayfa; arama motorlarına kapalı).
- Kurulum: (1) `supabase/sql/telemetry.sql`, (2) `supabase/sql/admin.sql` çalıştır (ana admin: ahmtt4565@gmail.com, hesap yoksa önce ana uygulamadan ya da admin sayfasından o e-postayla kayıt ol ve admin.sql'i yeniden çalıştır), (3) `kais-admin` fonksiyonunu deploy et (JWT doğrulaması AÇIK), (4) `kais-ai` fonksiyonunu güncelle (askıya alma ve işletme limiti desteği).
- Giriş: e-posta, şifre ve zorunlu 2FA (TOTP). Telefon kaybında kurtarma: SQL'de `delete from auth.mfa_factors where user_id = '<id>';`.
- Yetkiler: ana admin her şeyi görür, moderatör ve yetkilerini yalnızca ana admin yönetir. Admin yalnızca sayı ve durum görür; muhasebe, çalışan ve fiş verisi görünmez.
- Askıya alınan işletme: giriş ekranında uyarı alır ve Kais AI kullanamaz.

## v147 — Admin: Kais AI
- `kais-admin` yeniden yüklenmeli (`/tmp/out/kais-admin-FINAL.ts`). Yeni izin: `kais` (moderatöre ayrıca verilir, ana admin hepsini görür).
- Aynı `ANTHROPIC_API_KEY` sırrı kullanılır. İsteğe bağlı: `KAIS_ADMIN_MODEL` (varsayılan claude-sonnet-5-5).
- Kais AI yalnızca özet sayıları (işletme, AI, hata, kullanım, geri bildirim) görür; muhasebe/çalışan/fiş verisi yoktur.

## v148 — Admin: duyuru, destek, notlar, büyüme, sistem, özellik bayrakları
- SQL: `sql/admin2.sql` çalıştır. `kais-admin` yeniden yüklenmeli.
- Yeni izinler: `announce`, `support`, `flags`. Büyüme ve notlar `businesses`, Sistem sağlığı `errors` iznine bağlıdır.
- Duyurular uygulamada üstte bir şerit olarak görünür. Push bildirimi göndermez.
- Uygulamada bayrak kullanmak için: `FLAG('anahtar')` true/false döner.
- Destek görünümü yalnızca ana admine açıktır, veri yapısını ve kayıt sayısını gösterir, içeriği göstermez. Her kullanım denetim kaydına yazılır.

## v149 — Akşam Kais özeti, şube yetkisi, tahsilat, tur, yedek doğrulama
- `kais-cron` yeniden yüklenmeli (`/tmp/out/kais-cron-single.ts`). Akşam kapanış bildirimine Kais yorumu eklendi. `ANTHROPIC_API_KEY` sırrı gerekir. Haiku kullanır (`KAIS_CRON_MODEL` ile değişir). Kapatmak için `KAIS_EVE_AI=0`. Patron Ayarlar'dan "Akşam özeti"ni kapatabilir.
- `kais-admin` yeniden yüklenmeli: Sistem sayfasına yedek sağlığı eklendi.
- Yeni SQL yok.
- Şube yetkisi uygulama içi bir görünüm kısıtlamasıdır (Raporlar > Şube yetkisi). Veritabanı düzeyinde ayrım değildir.


## Gmail bağlantısı (e-postadaki faturaları bulma) (v239)

Uygulamada Muhasebe > Belgeler > "E-posta ile gelen faturalar" bölümü bunu kullanır. Üç parça: SQL tabloları, `kais-mail` fonksiyonu, Google OAuth istemcisi.

### 1. Google Cloud (giriş projesinden AYRI, yeni bir proje: "KaisPilot Mail")
Ayrı proje önerilir: Gmail izni "doğrulanmamış" iken 100 yeni kullanıcı sınırı vardır ve bu sınır dolarsa o projedeki Google ile giriş de kapanabilir.
1. console.cloud.google.com > yeni proje > **Gmail API**'yi etkinleştir.
2. Google Auth Platform (OAuth onay ekranı): uygulama adı KaisPilot, destek e-postası, logo, yetkili alan adı `kaispilot.com`, gizlilik politikası `https://www.kaispilot.com/gizlilik/`, kullanım şartları `https://www.kaispilot.com/kullanim-sartlari/`. Kitle: **Harici**. Yayın durumu: **Üretimde** (Test durumunda izin 7 günde biter, bağlantı her hafta kopar).
3. Veri erişimi (Scopes) > ekle: `https://www.googleapis.com/auth/gmail.readonly`
4. Kimlik bilgileri > OAuth istemci kimliği > Web uygulaması. Yetkili yönlendirme URI'si tam olarak: `https://bbcsbkgbwzciyfymvpxh.supabase.co/functions/v1/kais-mail`
5. Çıkan **İstemci kimliği** ve **İstemci sırrı**'nı bir yere not et (sohbete yapıştırma).

### 2. Supabase
1. SQL Editor: `sql/mail_gmail.sql` dosyasını çalıştır. Kontrol: `select relname, relrowsecurity from pg_class where relname in ('mail_connections','mail_secrets','mail_docs');` üç satır, hepsi `true`.
2. Edge Functions > Secrets: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `MAIL_SECRET_KEY` (en az 40 karakterlik rastgele bir metin, kaybetme: kayıtlı Gmail anahtarlarını bununla şifreler). `ANTHROPIC_API_KEY` `kais-ai` ile aynı, zaten varsa tekrar eklemene gerek yok. İsteğe bağlı: `MAIL_AI_DAY` (işletme başına günlük belge okuma sınırı, varsayılan 80).
3. Edge Functions > yeni fonksiyon adı **kais-mail**, içine `functions/kais-mail/index.ts` dosyasının tamamını yapıştır. **Verify JWT KAPALI** olmalı (Google'dan dönüş oturum başlığı taşımaz; fonksiyon oturumu kendisi doğrular). CLI ile: `supabase functions deploy kais-mail --no-verify-jwt`
4. Deneme: `https://bbcsbkgbwzciyfymvpxh.supabase.co/functions/v1/kais-mail` adresini tarayıcıda aç, `{"ok":true,"service":"kais-mail","configured":true}` görmelisin. `configured:false` ise bir sır eksik.

### Nasıl çalışır
- Patron "Gmail'i bağla" der, Google'a gider, yalnızca okuma izni verir, geri döner. Yenileme anahtarı AES-GCM ile şifrelenip `mail_secrets` tablosunda durur; istemci bu tabloyu okuyamaz.
- "Şimdi tara" son 90 günde fatura, makbuz gibi görünen e-postaları bulur. e-Fatura XML'i (UBL) kesin okunur. PDF, görsel ve düz metin yapay zekâ ile okunur; tutar açıkça yazmıyorsa boş bırakılır, tahmin edilmez. E-posta metni ve ekler saklanmaz.
- Belgeler listelenir, patron "Ekle" deyince fiş olarak muhasebeciye gider.

### Google doğrulaması (sonra)
`gmail.readonly` Google'ın "kısıtlı" izni. Doğrulanana kadar: kullanıcılar "Bu uygulama doğrulanmadı" uyarısı görür ve toplam 100 yeni kullanıcı sınırı vardır (sıfırlanmaz). 100'ün üstü için Google doğrulaması ve yıllık üçüncü taraf güvenlik değerlendirmesi (CASA) gerekir.

## Müşteriye e-posta (kais-send)

Ödeme hatırlatması ve izinli müşterilere toplu e-posta. Resend kullanır, `kais-cron` ile aynı sırları paylaşır.

1. **SQL:** `sql/mail_send.sql` dosyasını SQL Editor'de çalıştır (iki tablo: `mail_sends`, `mail_optout`).
2. **Sırlar:** `RESEND_API_KEY` ve `RESEND_FROM` zaten `kais-cron` için tanımlıysa yeni sır gerekmez. İsteğe bağlı: `MAIL_DAY` (işletme başına günlük sınır, varsayılan 50), `APP_URL`.
3. **Fonksiyon:** `functions/kais-send/index.ts` içeriğini yeni fonksiyon `kais-send` olarak yapıştır, **Verify JWT kapalı** (oturumu fonksiyon kendisi doğrular, "listeden çık" bağlantısı oturumsuz çalışmalı).
4. **Kontrol:** tarayıcıda `https://<proje>.supabase.co/functions/v1/kais-send` açınca `{"ok":true,"service":"kais-send","configured":true}` gelmeli.

Nasıl çalışır: alıcı adresi ve izin bilgisi istemciden alınmaz, kayıtlı işletme verisinden okunur. Kampanya yalnızca `iys = onayli` olan ve listeden çıkmamış müşterilere gider. Her kampanya e-postasında imzalı "listeden çık" bağlantısı (`/cikis/` sayfası) ve tek tık başlığı (`List-Unsubscribe`) bulunur. Aynı alacağa günde bir hatırlatma, aynı kampanya aynı adrese bir kez gider. Açılma oranı ölçülmez.
