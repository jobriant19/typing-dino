# 🦖 DinoTyping

Game typing test bergaya **Dino Runner (Chrome Dino)** dengan tema **pixel art**, dibangun dengan **Laravel 13 + MySQL (Laragon)** untuk backend penyimpanan progress, dan **Vanilla JS Canvas** untuk mesin gamenya (tanpa framework frontend tambahan, jadi ringan).

## ✨ Fitur

- ⌨️ Ketik kata yang muncul di atas rintangan darat (kaktus) untuk **auto-lompat**.
- ✈️ Ketik kata yang muncul di atas serangan udara untuk **auto-shield / menghancurkannya**.
- 🟩 Indikator **benar** (hijau) dan 🟥 **salah** (merah, berkedip) huruf-per-huruf saat mengetik.
- ❤️ Sistem **3 nyawa** — 1 kesalahan ketik (atau 1 rintangan terlewat) = 1 nyawa hilang.
- 🎚️ 3 tingkat kesulitan: **Easy, Medium, Hard** (kecepatan, panjang kata, dan target rintangan berbeda).
- 💀 Layar **Game Over** saat nyawa habis, lengkap tombol **Coba Lagi** (reset bersih) & **Menu Utama**.
- 🏆 Layar **Menang** saat target rintangan tercapai, dengan tombol menuju **Sertifikat**.
- 🥇 **Sertifikat pencapaian** bergaya pixel-art eksklusif — bisa **diunduh sebagai PNG** dan **dicetak (print)**.
- 📊 Statistik **skor tertinggi** dan **waktu tercepat** tersimpan permanen di database MySQL per pemain & per kesulitan (tetap muncul walau direfresh/reset).
- 📱 **Sepenuhnya responsif** — desktop, tablet, maupun mobile (keyboard virtual otomatis muncul saat disentuh).
- 🎬 **Demo otomatis** di halaman paling awal — dino "mengetik sendiri" menghadapi rintangan darat & serangan udara sebelum pemain mulai bermain.
- 🎵 **Musik latar** (autoplay & loop) di halaman awal maupun saat bermain, plus **efek suara** untuk lompat, mengetik (benar/salah), menyerang, dan kena damage.

---

## 🧰 Prasyarat

Pastikan sudah terpasang di komputer kamu:

1. **[Laragon](https://laragon.org/download/)** (Full version — sudah termasuk PHP, MySQL, Composer, Node.js).
2. Pastikan versi **PHP ≥ 8.2** aktif di Laragon (cek di menu Laragon → PHP → pilih versi).
3. **Node.js ≥ 18** (biasanya sudah tersedia lewat Laragon, atau instal manual dari nodejs.org).

---

## 🚀 Langkah Instalasi dari Nol (Folder Langsung di Drive D, di Luar `www` Laragon)

Project ini akan ditaruh di **`D:\typing-dino`** (bukan di dalam `D:\laragon\www`). Laragon tetap dipakai untuk servis PHP, MySQL, dan Composer/Node yang sudah terpasang di dalamnya — hanya lokasi foldernya saja yang custom.

### 1. Buat folder project via Composer

Buka **Terminal Laragon** (klik tombol *Terminal* di aplikasi Laragon — ini penting supaya `php`, `composer`, `npm` langsung terdeteksi tanpa perlu setting PATH manual), lalu jalankan:

```bash
cd /d D:\
composer create-project laravel/laravel typing-dino "13.*"
cd typing-dino
```

Sekarang project Laravel kosong sudah ada di `D:\typing-dino`.

Tunggu sampai proses composer selesai mengunduh Laravel 13.

### 2. Salin semua file dari paket ini

Dari paket **typing-dino-source.zip** yang saya berikan, salin & **timpa (overwrite)** ke dalam folder project Laravel yang baru dibuat (`D:\typing-dino`):

| Dari paket ini                          | Ke folder project                          |
|------------------------------------------|---------------------------------------------|
| `app/Models/Score.php`                   | `app/Models/Score.php`                       |
| `app/Http/Controllers/GameController.php`| `app/Http/Controllers/GameController.php`    |
| `app/Http/Controllers/CertificateController.php` | `app/Http/Controllers/CertificateController.php` |
| `app/Http/Controllers/Api/ScoreController.php` | `app/Http/Controllers/Api/ScoreController.php` |
| `database/migrations/2024_01_01_000000_create_scores_table.php` | `database/migrations/...` |
| `routes/web.php`                         | `routes/web.php` (**timpa**)                 |
| `routes/api.php`                         | `routes/api.php` (**timpa**, buat file baru jika belum ada — lihat catatan di bawah) |
| `resources/views/game.blade.php`         | `resources/views/game.blade.php`             |
| `resources/views/certificate.blade.php`  | `resources/views/certificate.blade.php`      |
| `resources/views/components/layout.blade.php` | `resources/views/components/layout.blade.php` |
| `resources/css/app.css`                  | `resources/css/app.css` (**timpa**)          |
| `resources/js/app.js`                    | `resources/js/app.js` (**timpa**)            |
| `resources/js/game.js`                   | `resources/js/game.js`                       |
| `resources/js/landing-demo.js`           | `resources/js/landing-demo.js`               |
| `resources/js/certificate.js`            | `resources/js/certificate.js`                |
| `public/assets/images/`                  | `public/assets/images/` (logo, ikon, sprite rintangan) |
| `public/assets/sounds/`                  | `public/assets/sounds/` (backsound & efek suara) |

> 💡 **Tips cepat**: cukup salin seluruh folder `app`, `database`, `public`, `resources`, `routes` dari paket ini lalu timpa folder yang sama persis di dalam project Laravel barumu. Struktur foldernya memang dibuat identik agar tinggal *copy-paste replace*.

### 3. Aktifkan routing API (jika `routes/api.php` belum otomatis terdaftar)

Laravel 13 (seperti Laravel 11/12) secara default **tidak** menyertakan `routes/api.php` kecuali diaktifkan. Buka file **`bootstrap/app.php`** di project barumu, lalu ubah bagian `withRouting` menjadi seperti ini:

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

### 4. Konfigurasi file `.env`

Salin `.env.example` dari paket ini ke `.env` di project (atau edit `.env` yang sudah ada hasil composer), pastikan bagian database seperti berikut (default Laragon MySQL — user `root`, password kosong):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=typing_dino
DB_USERNAME=root
DB_PASSWORD=
```

Lalu generate app key (jika belum otomatis):

```bash
php artisan key:generate
```

### 5. Buat database & jalankan migrasi

Buka **Laragon → Menu → MySQL → HeidiSQL** (atau phpMyAdmin), buat database baru bernama: typing_dino


Kembali ke terminal, di dalam folder project, jalankan:

```bash
php artisan migrate
```

Ini akan membuat tabel `scores` untuk menyimpan skor tertinggi & waktu tercepat setiap pemain.

### 6. Install dependency & build asset frontend

```bash
npm install
npm run build
```

> Untuk mode development (auto-reload saat edit CSS/JS), gunakan `npm run dev` di terminal terpisah selagi mengembangkan.

### 7. Jalankan project (folder di luar `www`)

Karena `D:\typing-dino` **di luar** folder `www` bawaan Laragon, Laragon **tidak otomatis** mendeteksinya. Pakai salah satu opsi berikut:

**Opsi A — Paling simpel: `php artisan serve`**

Cukup jalankan MySQL dari Laragon (klik **Start All**, atau minimal start service MySQL saja), lalu di terminal (folder `D:\typing-dino`):

```bash
php artisan serve
```

Buka browser ke `http://127.0.0.1:8000`. Selesai — tidak perlu setting apapun lagi. Ini opsi yang paling saya rekomendasikan untuk kebutuhan development/belajar.

**Opsi B — Daftarkan ke Laragon lewat "www-other-directories" (biar tetap dapat domain `.test` & Start All otomatis)**

1. Klik kanan ikon **Laragon** di system tray → **Www Other Directories** → **Add**.
2. Arahkan ke folder `D:\typing-dino` (bukan ke `public` di dalamnya, pilih folder root project).
3. Laragon otomatis membuat virtual host, biasanya dengan alamat `http://typing-dino.test`.
4. Klik **Reload** / **Start All** di Laragon.
5. Buka `http://typing-dino.test` di browser.

> Jika opsi B muncul error "document root not found" atau semacamnya, pastikan struktur foldernya benar (`D:\typing-dino\public\index.php` harus ada — ini otomatis ada karena hasil `composer create-project`).

**Opsi C — Virtual host manual (jika menu "Www Other Directories" tidak tersedia di versi Laragon kamu)**

1. Klik kanan ikon Laragon → **Apache** → **httpd-vhosts.conf** (atau **Nginx** → `nginx.conf` tergantung web server yang kamu pakai di Laragon), lalu tambahkan blok berikut:

```apache
<VirtualHost *:80>
    ServerName typing-dino.test
    DocumentRoot "D:/typing-dino/public"
    <Directory "D:/typing-dino/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

2. Klik kanan ikon Laragon → **Hosts file** → tambahkan baris: 127.0.0.1 typing-dino.test


3. **Restart All** di Laragon, lalu buka `http://typing-dino.test`.

---

## 🎮 Cara Bermain

1. Di halaman paling awal, lihat dulu **demo otomatis** cara bermain, lalu klik **MULAI**.
2. Masukkan nama pemain, pilih tingkat kesulitan (**Easy / Medium / Hard**).
3. Klik **Mulai Permainan**.
4. Kata akan muncul di atas kaktus (rintangan darat) atau pesawat (serangan udara) yang mendekat dari kanan.
5. Ketik kata tersebut **huruf demi huruf** (lengkap dengan efek suara ketik):
   - Huruf benar → berubah **hijau**.
   - Huruf salah → berkedip **merah**, **1 nyawa hilang**, dan dino ikut bereaksi kena damage.
   - Kata selesai diketik dengan benar → dino otomatis **melompat** (rintangan darat, dengan efek suara lompat) atau mengaktifkan **perisai** (serangan udara).
   - Rintangan yang **tidak sempat diketik** sampai mencapai dino juga mengurangi 1 nyawa.
6. Nyawa habis (3x kesalahan) → **Game Over**, bisa **Coba Lagi** (reset bersih, statistik permainan sebelumnya tidak hilang) atau kembali ke **Menu**.
7. Berhasil menyelesaikan target rintangan (Easy: 15, Medium: 20, Hard: 25) → **Menang!** → klik **Lihat Sertifikat** untuk melihat, mengunduh (PNG), atau mencetak sertifikat pencapaianmu.
8. Skor tertinggi dan waktu tercepat kamu per tingkat kesulitan selalu ditampilkan di menu utama dan tersimpan permanen di database.
9. Musik latar diputar otomatis & berulang begitu kamu melakukan interaksi pertama (klik/ketuk/tekan tombol apa pun) — ini karena kebijakan browser yang memblokir suara sebelum ada interaksi pengguna.

**Mobile/Touch**: ketuk area permainan untuk memunculkan keyboard virtual, lalu ketik seperti biasa.

---

## 🗂️ Struktur Folder Penting

typing-dino/
├── app/
│ ├── Http/Controllers/
│ │ ├── GameController.php # Halaman utama game
│ │ ├── CertificateController.php # Halaman sertifikat
│ │ └── Api/ScoreController.php # API simpan/ambil skor
│ └── Models/Score.php
├── database/migrations/
│ └── ..._create_scores_table.php
├── public/
│ └── assets/
│ ├── images/
│ │ ├── logo.png
│ │ ├── icon.png
│ │ └── obstacle/
│ │ └── cactus.png # Sprite kaktus (rintangan darat)
│ └── sounds/
│ ├── backsound.mp3 # Musik latar (autoplay & loop)
│ ├── jump.mp3 # Efek suara lompat dino
│ ├── typing.mp3
│ └── gameover.mp3
├── resources/
│ ├── views/
│ │ ├── components/layout.blade.php
│ │ ├── game.blade.php
│ │ └── certificate.blade.php
│ ├── css/app.css # Tema pixel-art & responsif
│ └── js/
│ ├── app.js
│ ├── game.js # Mesin game (canvas, fisika, typing, efek suara)
│ ├── landing-demo.js # Demo otomatis di halaman paling awal
│ └── certificate.js # Generator sertifikat canvas
├── vite.config.js # Daftar entry point aset (wajib memuat game.js & landing-demo.js)
└── routes/
├── web.php
└── api.php


---

## 🛠️ Troubleshooting

| Masalah | Solusi |
|---|---|
| Halaman putih / error 500 | Jalankan `php artisan config:clear` dan `php artisan view:clear`, cek `.env` sudah benar. |
| CSS/JS tidak muncul (tampilan polos) | Pastikan sudah `npm run build`, atau jalankan `npm run dev` saat development. |
| Error koneksi database | Pastikan service MySQL di Laragon sudah **Start**, dan database `typing_dino` sudah dibuat. |
| Route API 404 | Pastikan langkah 3 (`bootstrap/app.php` mendaftarkan `routes/api.php`) sudah dilakukan. |
| Skor tidak tersimpan tapi game tetap jalan | Game tetap bisa dimainkan offline (fallback ke localStorage), cek console browser & pastikan Laragon/MySQL menyala untuk sinkronisasi permanen. |
| `Unable to locate file in Vite manifest` | Pastikan file JS yang error (mis. `landing-demo.js`) sudah didaftarkan di `input: [...]` pada `vite.config.js`, lalu jalankan ulang `npm run dev` / `npm run build`. |
| Musik latar / efek suara tidak terdengar | Ini kebijakan browser (autoplay diblokir sampai ada interaksi) — klik/ketuk apa saja di halaman dulu, suara akan langsung aktif untuk seterusnya. Pastikan juga file di `public/assets/sounds/` sudah ada dengan nama persis: `backsound.mp3`, `jump.mp3`, `type-correct.mp3`, `type-wrong.mp3`. |

---

## 📄 Lisensi

Bebas digunakan dan dimodifikasi untuk keperluan belajar maupun pengembangan lebih lanjut.