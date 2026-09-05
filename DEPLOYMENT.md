# 🚀 Panduan Deployment Web Kas MPK (Vercel + Supabase)

Panduan lengkap langkah-demi-langkah untuk mendeploy aplikasi **Website Kas MPK Trenggana Sumapala** ke **Vercel** dengan database cloud **Supabase (PostgreSQL)** gratis.

---

## 📋 Prasyarat
1. Akun [GitHub](https://github.com)
2. Akun [Supabase](https://supabase.com) (Gratis)
3. Akun [Vercel](https://vercel.com) (Gratis)

---

## 🛠️ Langkah 1: Buat Database di Supabase

1. Buka [database.new](https://database.new) dan login dengan akun Supabase.
2. Buat project baru:
   - **Name**: `kas-mpk` (atau bebas)
   - **Database Password**: Buat password yang kuat dan **simpan password ini**.
   - **Region**: Pilih **Singapore (Southeast Asia / ap-southeast-1)** untuk kecepatan maksimal dari Indonesia.
3. Setelah database siap (sekitar 1-2 menit), buka menu **Settings (ikon gerigi)** -> **Database**.
4. Gulir ke bagian **Connection string**:
   - Pilih tab **URI**.
   - Catat connection string untuk **Transaction pooler (Port 6543)** dan **Session / Direct (Port 5432)**.

Contoh format URL:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## ⚙️ Langkah 2: Ubah Prisma Provider ke PostgreSQL

1. Buka file `prisma/schema.prisma` dan ubah `datasource db`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

2. Buat file `.env` di folder root (selevel `package.json`) dan masukkan URL Supabase Anda:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="mpk_trenggana_sumapala_secure_secret_key_2026_2027_production"
```

---

## 📦 Langkah 3: Push Schema & Seed Data 38 Akun ke Supabase

Jalankan perintah berikut di terminal:

```bash
# 1. Buat tabel di database Supabase
npx prisma db push

# 2. Masukkan seluruh 38 akun pengurus dari user_mpk_2026_2027.json
npm run db:seed
```

> ✅ *Setelah selesai, seluruh 38 akun pengurus beserta data iuran dan arus kas awal sudah tersimpan permanen di cloud Supabase!*

---

## 🐙 Langkah 4: Upload / Push Kode ke GitHub

Inisialisasi git dan push ke repository GitHub baru:

```bash
git init
git add .
git commit -m "Deploy Kas MPK Trenggana Sumapala 2026/2027"
git branch -M main
git remote add origin https://github.com/[USERNAME-ANDA]/kas-mpk.git
git push -u origin main
```

*(Pastikan `.env` tidak ikut ter-upload karena sudah otomatis diabaikan oleh `.gitignore`)*

---

## ⚡ Langkah 5: Deploy ke Vercel

1. Buka dashboard [Vercel](https://vercel.com/new).
2. Klik **"Add New..."** -> **"Project"**.
3. Pilih repository GitHub `kas-mpk` yang baru saja di-push.
4. Pada bagian **Environment Variables**, tambahkan 3 variable berikut:

| Key / Nama Variable | Value / Nilai |
|---|---|
| `DATABASE_URL` | *(URL Transaction pooler Supabase Anda)* |
| `DIRECT_URL` | *(URL Session / Direct Supabase Anda)* |
| `JWT_SECRET` | *(String acak rahasia untuk enkripsi login session)* |
| `UPSTASH_REDIS_REST_URL` | `https://tops-pipefish-129799.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `gQAAAAAAAfsHAAIgcDFjY2JiYzRlN2Q5NWM0YjI5YTBmODQxMzdhZGE1MzQxMA` |

5. Klik tombol **"Deploy"**.
6. Tunggu sekitar 1 menit hingga proses build selesai.

---

## 🎉 Selesai!

Aplikasi Web Kas MPK Anda kini aktif secara publik dan dapat diakses oleh seluruh pengurus MPK melalui URL Vercel (contoh: `https://kas-mpk-xxxx.vercel.app`).
