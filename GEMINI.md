# Dizi&Film Takip - Google Antigravity Geliştirici Kılavuzu (GEMINI.md)

Bu dosya, Google Antigravity yapay zeka ajanları için **Dizi&Film Takip** projesinin kurallarını, mimari standartlarını ve geliştirme pratiklerini tanımlar.

---

## 1. Projeye Genel Bakış

* **Uygulama Adı:** Dizi&Film Takip (ttime)
* **Kapsam:** Letterboxd ve TV Time benzeri, TMDB API ve Supabase destekli modern film/dizi takip platformu.
* **Temel Özellikler:** Bölüm bölüm dizi izleme takibi (`EpisodeTracker`), aylık yayın takvimi (`CalendarView`), canlı arkadaş/sosyal aktivite akışı (`ActivityFeedView`), özel koleksiyonlar (`CollectionsView`), spoiler korumalı incelemeler, Letterboxd puanlama histogramı ve Wrapped tarzı aylık özet (`MonthlyRecapModal`).

---

## 2. Teknoloji Yığını (Tech Stack)

* **Frontend:** React 19 (`react: ^19.0.1`, `react-dom: ^19.0.1`)
* **Dil & Derleyici:** TypeScript 5.8 (`typescript: ~5.8.2`)
* **Build Aracı:** Vite 6.2 (`vite: ^6.2.3`, `@vitejs/plugin-react: ^5.0.4`)
* **CSS & Tema:** Tailwind CSS v4 (`@tailwindcss/vite`, `@tailwindcss/vite: ^4.1.14`)
  * Arka Plan: `#0B0C0E`
  * Kartlar / Paneller: `#14171D` (Kenarlık: `#232833`)
  * Vurgu Rengi: `#E63946`
* **Animasyonlar:** Motion (`motion/react: ^12.23.24`)
* **İkonlar:** Lucide React (`lucide-react: ^0.546.0`)
* **Veritabanı & Kimlik Doğrulama:** Supabase (`@supabase/supabase-js: ^2.110.8`)
* **Harici API:** The Movie Database (TMDB) REST API (Türkçe dil desteği, tr-TR)
* **PWA & Caching:** `vite-plugin-pwa: ^1.3.0` (TMDB ve Unsplash resimleri için Workbox CacheFirst)
* **Durum Yönetimi:** Zustand (`store/useAppStore.ts`) + React Query (`@tanstack/react-query: ^5.101.4`) + LocalStorage

---

## 3. Temel Geliştirme Komutları

```bash
# Bağımlılıkları yükleme
npm install

# Geliştirme sunucusunu başlatma (port 3000, 0.0.0.0 host)
npm run dev

# TypeScript tip kontrolü (hatasız olmalı)
npm run lint

# Üretim derlemesi oluşturma (dist/)
npm run build

# Derlemeyi önizleme
npm run preview
```

---

## 4. Mimari İlkeler ve Zorunlu Kurallar

### 4.1 Çift Katmanlı Veri Modeli (Dual-Layer Persistence)
* Uygulama, Supabase kimlik bilgileri olmadığında veya çevrimdışı olunduğunda **asla çökmemelidir**.
* `src/lib/supabase.ts` içindeki sahte istemci (`createDummyClient`) yerel çalışma desteği sunar.
* Tüm veri işlemlerinde hem `localStorage` hem de `supabase` güncellenir.
* `updated_at` zaman damgaları kullanılarak yerel ve uzak veriler akıllıca harmanlanır (`merge`), veri kaybı yaşanmaz.

### 4.2 Bileşen Modülerliği ve Temiz Kod
* `src/App.tsx` ana orkestrasyonu sağlar. Yeni durumlar ve alt özellikler eklendiğinde `App.tsx` dosyasını aşırı büyütmek yerine `src/components/`, `src/hooks/` veya `src/store/` altına modüler yapılar kurulmalıdır.
* Ağır bileşenler `lazyWithRetry` ile dinamik olarak içe aktarılmalıdır.

### 4.3 Türkçe Fonetik ve Dil Uyumu
* Sosyal akış ve bildirimlerde yabancı ve Türkçe yapım adlarına sesli harf uyumu ve Türkçe ekler getirilirken mutlaka `src/utils/textUtils.ts` yardımcı fonksiyonları kullanılmalıdır:
  * `getTurkishAccusativeSuffix(title)` (Örn: *Loki'yi*, *Severance'ı*, *Fargo'yu*)
  * `getEpisodeAccusativeSuffix(ep)` (Örn: *S1B1'i*, *S2B2'yi*, *S3B3'ü*)

### 4.4 Görsel Boyutlandırma ve Kota Koruması
* Kullanıcı profil avatarları ve banner yüklemeleri mutlaka `src/utils/imageCompressor.ts` üzerinden Canvas tabanlı JPEG sıkıştırmasından geçirilmelidir (`compressImage`). Ham büyük dosyalar doğrudan `localStorage` veya Supabase'e yazılmamalıdır.

### 4.5 Güvenlik & Row Level Security (RLS)
* Veritabanı işlemleri Supabase RLS politikalarına (`src/lib/supabase-schema.sql`) uygun olarak yapılmalıdır. Her kullanıcı yalnızca kendi `user_id`sine ait kayıtları değiştirebilmelidir.
