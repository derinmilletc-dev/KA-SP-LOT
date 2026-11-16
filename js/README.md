# js/ — uygulama kodu

`index.html` bu dosyaları sırayla yükler (`app-01.js` … `app-NN.js`). Hepsi tek bir sayfa betiğinin ardışık parçalarıdır:
aynı genel kapsamı paylaşırlar, bu yüzden bir dosyada tanımlanan ad sonrakilerde kullanılabilir.

Kurallar
- Yeni özellik: **en son dosyanın sonuna** yeni bir blok ekle (mevcut fonksiyonu sarmalamak için `{ const _x = f; f = function () { … }; }` kalıbı).
- Üst düzeyde çalışan kod, kendinden **sonraki** dosyada tanımlanan bir fonksiyonu çağırmamalı (eskiden hoisting örtüyordu, artık sıra önemli).
- Dosyayı değiştirince: `python3 tools/stamp.py` (index.html'deki `?v=` özetini günceller; CI `--check` ile doğrular).
- Mükerrer fonksiyon bildirimi kontrolü: `node tools/check_dups.js` (acorn gerekir).
- Dosya çok büyürse yeni `app-NN.js` ekle ve `index.html`e etiketi ekle; bölme noktası ifade sınırında olmalı.
