# Rancangan Sistem: **Ramadhan Tracker** (Mobile-First, React + Vite)

## 1) Visi Produk
Membangun **Ramadhan Tracker** yang terasa seperti “asisten ibadah harian”:
- super cepat di mobile,
- ringan kuota,
- tetap nyaman saat jaringan lambat,
- memotivasi tanpa menggurui,
- fokus untuk penggunaan personal (perorangan) dengan sistem login.

---

## 2) Rekomendasi Framework & Tech Stack (UI keren, ringan, mobile-friendly)

## Framework utama (direkomendasikan): **React + Vite + TypeScript + PWA**
Alasan:
- Vite sangat cepat (dev server + build waktu kecil), ideal untuk SPA mobile-first.
- Bundle output ringan dan bisa dikonfigurasi jadi PWA (installable di HP).
- Fleksibel penuh — tidak terikat konvensi framework besar.
- Cocok sempurna dengan **Tailwind CSS + shadcn/ui**.

## UI & State
- **Tailwind CSS** (utility-first, cepat, konsisten)
- **shadcn/ui** (komponen modern, accessible, customizable)
- **lucide-react** (ikon ringan dan konsisten)
- **Framer Motion** (animasi mikro seperlunya, tetap ringan)
- **Zustand** (state global sederhana, kecil)
- **TanStack Query** (cache data server + sync efisien)

## Mobile-first & Offline
- **vite-plugin-pwa** / Workbox untuk offline cache + install prompt
- IndexedDB (melalui `idb`) untuk draft/checklist offline

## Backend/API
Karena React murni SPA, backend wajib terpisah. Dua opsi:
1. **API ringan**: Express.js / Fastify + Supabase (recommended awal)
2. **Serverless**: Supabase Edge Functions atau Cloudflare Workers

> Untuk fase awal, opsi (1) paling cepat dan hemat biaya.

---

## 3) Tren Aplikasi Ramadhan Tracker Saat Ini (yang layak diadopsi)
Fitur tren yang terbukti meningkatkan retensi:
1. **Daily streak & progress ring** (visual kemajuan harian)
2. **Checklist ibadah fleksibel** (wajib + sunnah + custom)
3. **Habit gamification** (badge, level, milestone)
4. **Qur’an journey** (target tilawah, halaman/juz, audio progress)
5. **Prayer utilities** (jadwal sholat, imsak, iftar, qibla)
6. **Personal accountability** (ringkasan progres pribadi dan target harian)
7. **Refleksi harian** (journal, mood, gratitude, doa)
8. **Push reminder personal** (cerdas, tidak spam)
9. **Konten mikro** (1 menit insight harian)
10. **Donasi & amal tracker** (target sedekah transparan)

---

## 4) Fitur Sistem (Banyak, membantu, dan “keren”)

## A. Core Ibadah Tracker
- Checklist harian: sholat 5 waktu, tarawih, witir, dhuha, qiyam, dzikir
- Puasa: status puasa harian + catatan alasan jika tidak penuh
- Tilawah: track per ayat/halaman/juz + target khatam
- Sedekah: nominal, jenis, reminder mingguan
- Doa: daftar doa personal + status diamalkan

## B. Smart Planner Ramadhan
- To-do harian berbasis waktu (sebelum sahur, setelah ashar, sebelum tidur)
- “Focus Mode” 20–30 menit ibadah tanpa distraksi
- Template program 30 hari (pemula, menengah, intensif)

## C. Motivasi & Gamification
- XP per aktivitas (bobot bisa disetting user)
- Badge: “7 hari konsisten tahajud”, “khatam milestone”, “sedekah rutin”
- Progress card share (untuk story WA/IG, privat/public bisa diatur)

## D. Qur’an & Knowledge
- Integrasi mushaf digital + bookmark terakhir
- Mode target: “1 juz/hari”, “5 halaman/hari”, custom target
- Ringkasan tadabbur harian (konten pendek)

## E. Refleksi & Kesehatan Spiritual
- Journal harian: syukur, evaluasi, niat besok
- Mood tracker Ramadhan
- Insight personal mingguan berbasis pola ibadah

## F. Amal & Sosial
- Tracker sedekah personal + target bulanan
- Integrasi kanal donasi terpercaya (link partner)
- Laporan distribusi amal (jika ada mitra lembaga)

## G. Utility Fitur Pendukung
- Jadwal imsakiyah per lokasi
- Notifikasi adzan/imsak/iftar (configurable)
- Qibla + lokasi masjid terdekat
- Widget homescreen (Android/iOS PWA shortcut)


---

## 5) Prioritas Build (MVP → Growth)

## MVP (wajib rilis awal, 4-6 minggu)
- Auth (email/Google)
- Daily checklist ibadah
- Tilawah tracker
- Jadwal sholat + imsak/iftar
- Progress dashboard sederhana
- Reminder dasar
- PWA installable + offline basic

## Phase 2
- Gamification (badge + streak)
- Journal/mood tracker
- Pengaturan akun lanjutan (session/device, keamanan login)
- Sedekah tracker

## Phase 3
- AI insight
- Share card otomatis
- Advanced analytics + cohort retensi

---

## 6) Arsitektur Sistem (Mobile-Optimized)

## Frontend
- React + Vite SPA (Single Page Application)
- React Router v6 untuk navigasi
- Tailwind + shadcn/ui
- Client caching dengan TanStack Query
- Offline queue untuk checklist update

## Backend
- Express.js / Fastify REST API (atau Supabase Edge Functions)
- Background jobs (pengingat, ringkasan mingguan) via cron/queue
- Push notification service (FCM/Web Push)

## Data Flow singkat
1. User input checklist
2. Simpan lokal dulu (optimistic update)
3. Sync ke server saat online
4. Reconcile jika ada konflik (last-write + log event)

---

## 7) Rekomendasi Database (yang bisa diintegrasikan)

## Pilihan Utama: **PostgreSQL + Prisma**
Kenapa paling cocok:
- Relasional kuat (user, ibadah_log, streak, group, challenge, badges)
- Query analytics bagus
- Aman untuk skala menengah-besar
- Prisma mempermudah schema + migration

## Keputusan Final untuk Proyek Ini: **Supabase Postgres**
- Database utama: Supabase (PostgreSQL managed)
- Auth: Supabase Auth (email/password, OAuth opsional)
- Realtime/Storage: aktifkan sesuai kebutuhan phase 2+

## Opsi Hosting DB
1. **Supabase Postgres** (recommended awal)
   - Cepat setup, ada auth/storage/realtime
   - Cocok startup kecil-menengah
2. **Neon Postgres**
   - Serverless Postgres modern, biaya efisien
3. **PlanetScale (MySQL)**
   - Alternatif jika tim nyaman MySQL
4. **Firebase Firestore**
   - Bagus untuk realtime cepat, tapi analytics relasional lebih menantang

> Saran praktis: mulai dari **Supabase Postgres + Prisma**, lalu scale out saat DAU meningkat.

## Konfigurasi Environment (React + Vite)
Gunakan environment berikut pada file `.env` / `.env.local`:

```env
VITE_SUPABASE_URL=https://oalulbixxtutuyyubfcc.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_ODVl__fHDsyHJHI7qu0BnA_CiAFuEVf
```

Catatan:
- Variabel dengan prefix `VITE_` akan terekspos ke frontend (aman untuk publishable key).
- Jangan menyimpan `service_role key` di frontend; simpan hanya di backend server.

---

## 8) Skema Data Inti (ringkas)

- `users` (id, name, email, password_hash, timezone, locale, created_at)
- `profiles` (user_id, avatar, onboarding_level, privacy_setting)
- `daily_logs` (id, user_id, date, fasting_status, notes)
- `prayer_logs` (id, user_id, date, prayer_name, status, on_time)
- `quran_logs` (id, user_id, date, pages_read, juz_read, minutes)
- `charity_logs` (id, user_id, date, amount, channel, note)
- `habit_streaks` (id, user_id, habit_key, current_streak, best_streak)
- `badges` (id, code, title, description)
- `user_badges` (user_id, badge_id, awarded_at)
- `auth_sessions` (id, user_id, device_name, ip_hash, last_active_at)
- `login_activities` (id, user_id, event_type, created_at)

---

## 9) Rancangan UX/UI (Tailwind + shadcn/ui)

## Screen utama
1. **Home Dashboard**
   - Progress ring hari ini
   - Quick checklist
   - Next reminder card
2. **Tracker**
   - Tab: Sholat, Puasa, Tilawah, Sedekah
3. **Insights**
   - Grafik 7/30 hari
   - Streak & pencapaian
4. **Riwayat**
   - Timeline ibadah harian + filter tanggal
5. **Profile**
   - Pengaturan notifikasi, privasi, target

## Komponen shadcn/ui yang dipakai
- `Card`, `Tabs`, `Progress`, `Badge`, `Dialog`, `Drawer`, `Calendar`, `Switch`, `Toast`, `Skeleton`, `DropdownMenu`

## Routing (React Router v6)
- `/` → Home Dashboard
- `/tracker` → Tracker harian
- `/insights` → Grafik & streak
- `/history` → Riwayat ibadah
- `/profile` → Profil & pengaturan
- `/login`, `/register`, `/forgot-password` → Halaman auth

## Prinsip mobile-first
- Navigasi bawah (bottom nav 4-5 menu)
- Tap target besar (min 44px)
- Hindari tabel kompleks
- Data penting muncul < 2 scroll

---

## 10) Optimasi Kinerja untuk Mobile
- Gunakan React lazy + Suspense untuk komponen berat (code splitting per route)
- Kompres gambar (format WebP/AVIF), lazy load dengan `loading="lazy"`
- Prefetch seperlunya, jangan berlebihan
- Cache API response bertingkat (memory + persistent)
- Batasi animasi; fokus microinteraction ringan
- Pastikan ukuran bundle awal kecil (audit berkala)

Target teknis:
- LCP < 2.5s pada jaringan 4G normal
- JS initial bundle seefisien mungkin
- Time-to-interactive cepat untuk halaman home

---

## 11) Security, Privacy, dan Compliance
- Data ibadah bersifat sensitif → default **private**
- Enkripsi in transit (HTTPS) dan minimal data collection
- Kontrol keamanan login (session management + login activity)
- Audit log untuk perubahan penting
- Opsi ekspor dan hapus data akun

---

## 12) Integrasi yang Direkomendasikan
- Auth: Supabase Auth
- Push notif: FCM + Web Push
- Analytics: PostHog / Umami / GA4 (pilih salah satu)
- Error tracking: Sentry
- Maps/Qibla: API geolocation + perhitungan qibla

---

## 13) Contoh Roadmap 12 Minggu
- Minggu 1-2: setup proyek, auth, desain sistem
- Minggu 3-4: tracker core + dashboard
- Minggu 5-6: jadwal sholat/imsak + reminder
- Minggu 7-8: PWA offline + optimasi performa
- Minggu 9-10: gamification + journal
- Minggu 11: QA device low-end + security hardening
- Minggu 12: soft launch + analytics review

---

## 14) Stack Final yang Disarankan (Ringkas)

- **Frontend:** React + Vite + TypeScript
- **UI:** Tailwind CSS + shadcn/ui + Lucide Icons
- **Routing:** React Router v6
- **State/Data:** Zustand + TanStack Query
- **Backend:** Express.js / Fastify (atau Supabase Edge Functions)
- **DB:** Supabase Postgres + Prisma
- **Notif:** FCM/Web Push
- **Deploy:** Netlify / Cloudflare Pages (frontend) + Supabase (DB) + Railway/Render (backend API)

---

## 15) Kesimpulan
Jika target utama adalah **mobile, ringan, cepat rilis, dan UI modern**, kombinasi terbaik adalah:

**React + Vite (PWA) + Tailwind + shadcn/ui + Supabase Postgres + Prisma**.

Dengan arsitektur SPA + backend terpisah, sistem ini fleksibel, hemat biaya, dan mudah di-deploy ke layanan static hosting modern.
