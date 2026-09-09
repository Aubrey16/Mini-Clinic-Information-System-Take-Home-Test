# Mini Clinic Information System

Aplikasi manajemen klinik dengan frontend React dan backend Node.js/Express. Fitur utama mencakup autentikasi berbasis peran, data pasien, pendaftaran, antrean, pemeriksaan/rekam medis, resep, dan dashboard.

## Prasyarat

- Node.js 18+ dan npm
- PostgreSQL 16+ **atau** Docker Desktop (untuk menjalankan PostgreSQL melalui Docker Compose)

## Instalasi

1. Kloning repository lalu buka direktori proyek.

   ```bash
   git clone https://github.com/Aubrey16/Mini-Clinic-Information-System-Take-Home-Test.git
   cd Mini-Clinic-Information-System-Take-Home-Test
   ```

2. Instal dependensi backend dan frontend.

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   cd ..
   ```

3. Siapkan file konfigurasi lokal dari contoh.

   **PowerShell:**

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

4. Buat database dan muat schema serta data contoh. Lihat bagian [Inisialisasi database](#inisialisasi-database).

## Konfigurasi `.env`

File rahasia tidak disertakan di repository. Salin masing-masing `.env.example` menjadi `.env`, kemudian sesuaikan nilainya.

### Backend — `backend/.env`

| Variabel | Keterangan | Contoh |
| --- | --- | --- |
| `PORT` | Port API | `5000` |
| `NODE_ENV` | Lingkungan aplikasi | `development` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://postgres:postgres@localhost:5432/mini_clinic` |
| `JWT_SECRET` | Secret untuk token JWT; gunakan nilai acak minimal 32 karakter | `ganti-dengan-secret-acak-yang-panjang` |
| `JWT_EXPIRES_IN` | Masa berlaku token | `8h` |
| `CORS_ORIGIN` | Origin frontend yang diizinkan | `http://localhost:5173` |

### Frontend — `frontend/.env`

| Variabel | Keterangan | Contoh |
| --- | --- | --- |
| `VITE_API_URL` | URL dasar backend | `http://localhost:5000` |

> Jangan commit file `.env`. Berkas tersebut telah diabaikan melalui `.gitignore`; hanya `.env.example` yang dilacak Git.

## Inisialisasi database

Proyek menggunakan file SQL, bukan migration runner. Jalankan `schema.sql` sekali untuk membangun struktur database, lalu `seed.sql` untuk data contoh.

1. Jalankan PostgreSQL dengan Docker (opsional bila PostgreSQL lokal sudah tersedia):

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. Terapkan schema dan seed.

   **Dengan `psql`:**

   ```bash
   psql -h localhost -U postgres -d mini_clinic -f database/schema.sql
   psql -h localhost -U postgres -d mini_clinic -f database/seed.sql
   ```

   **PowerShell, melalui kontainer Docker:**

   ```powershell
   Get-Content database/schema.sql | docker exec -i mini-clinic-db psql -U postgres -d mini_clinic
   Get-Content database/seed.sql | docker exec -i mini-clinic-db psql -U postgres -d mini_clinic
   ```

`schema.sql` bersifat membangun ulang tabel yang ada; jangan gunakan pada database produksi tanpa backup. Untuk memuat ulang data contoh, jalankan `seed.sql` kembali—berkas ini mengosongkan tabel aplikasi terlebih dahulu.

## Menjalankan aplikasi

Jalankan backend dan frontend di dua terminal terpisah.

**Terminal 1 — backend**

```bash
cd backend
npm run dev
```

API berjalan di `http://localhost:5000`; dokumentasi Swagger tersedia di `http://localhost:5000/api-docs`.

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

Buka URL yang ditampilkan Vite (umumnya `http://localhost:5173`). Untuk build produksi frontend, gunakan `npm run build` dari direktori `frontend`.

## Akun login demo

Semua akun hasil seed menggunakan kata sandi `password123`.

| Nama | Email | Peran |
| --- | --- | --- |
| Admin Klinik | `admin@klinik.test` | Administrator |
| dr. Budi Santoso | `dokter@klinik.test` | Dokter |
| Rina Wulandari | `pendaftaran@klinik.test` | Petugas Pendaftaran |

## Struktur proyek

```text
.
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/          # Koneksi database
│   │   ├── middlewares/     # Auth, peran, dan validasi
│   │   ├── modules/         # Modul API per fitur
│   │   └── server.js        # Entry point API
│   └── .env.example
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/      # Komponen bersama
│   │   ├── pages/           # Halaman aplikasi
│   │   └── api.js           # Klien HTTP API
│   └── .env.example
├── database/
│   ├── schema.sql           # DDL schema, constraints, trigger, dan view
│   └── seed.sql             # Data contoh dan akun demo
├── docs/
│   ├── openapi.yaml         # Spesifikasi OpenAPI/Swagger
│   └── postman-collection.json
├── infra/docker-compose.yml # PostgreSQL via Docker Compose
└── prd.md                   # Product requirement document
```

## Berkas pendukung

- Database: `database/schema.sql` dan `database/seed.sql`
- Koleksi Postman: `docs/postman-collection.json`
- Dokumentasi API: `docs/openapi.yaml` atau Swagger UI pada `/api-docs`
- ERD teks: `database/README.md`

## Pemeriksaan singkat

```bash
cd backend && npm test
cd ../frontend && npm run build
```

