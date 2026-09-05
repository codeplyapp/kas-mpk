# Website Kas MPK Trenggana Sumapala
**SMA Negeri 2 Taruna Bhayangkara Jawa Timur**
*Masa Bhakti 2026/2027*

Aplikasi Web Manajemen Keuangan, Iuran Kas, dan Arus Kas Majelis Perwakilan Kelas (MPK) Trenggana Sumapala yang modern, transparan, dan otomatis.

---

## 🌟 Fitur Utama

### 1. 💰 Input Iuran Matriks Mingguan (Pola SI-KAS)
- Matriks 4 minggu per bulan (M1, M2, M3, M4) dengan nominal **Rp 5.000 / minggu** (**Rp 20.000 / bulan**).
- Toggle checkbox per minggu dengan pembaruan instan (optimistic UI update).
- Tombol **"+ Lunas 1 Bln"** sekali klik per pengurus dengan efek selebrasi.
- Filter berdasarkan Bulan, Tahun, dan Komisi (BPH, AD/ART, Evaluasi, Publikasi, Tatib, DPS).
- Pencarian cepat berdasarkan nama, kelas, atau jabatan.

### 2. 📊 Dashboard Interaktif & Transparan
- **Mode Bendahara**: Menampilkan saldo total, pemasukan iuran, pengeluaran kas, jumlah tunggakan, grafik kepatuhan per komisi, dan ringkasan aktivitas terbaru.
- **Mode Anggota**: Menampilkan banner peringatan status pembayaran iuran pribadi (Minggu yang belum dibayar), transparansi saldo kas organisasi, dan rincian penggunaan kas.

### 3. 📱 Notifikasi & Penagihan via WhatsApp (`wa.me`)
- Deteksi otomatis anggota yang memiliki tunggakan iuran pada bulan terpilih.
- 1-Klik tombol **"Tagih via WA"** yang otomatis membuka WhatsApp dengan format pesan resmi dan sopan ber-kop MPK Trenggana Sumapala.
- Tombol salin pesan untuk kemudahan arsip / pengiriman manual.

### 4. 📑 Laporan & Ekspor Resmi (PDF - Times New Roman)
- **Ekspor PDF Resmi**: Lengkap dengan Kop Surat resmi MPK Trenggana Sumapala SMAN 2 Taruna Bhayangkara Jatim, Ringkasan Saldo, Rekap Iuran Anggota, Catatan Arus Kas, dan Lembar Tanda Tangan Ketua Umum (Alvano Ghulwani Putra Jr, NIS. 18391) & Bendahara (Dewi Madha Lintang Kencana, NIS. 10266).

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di: [http://localhost:3000](http://localhost:3000)

### 2. Akun Pengurus MPK 2026/2027 (Format JSON)

Data akun seluruh 38 pengurus MPK telah diperbarui sesuai `user_mpk_2026_2027.json`:

| Peran (Role) | Username | Password | Nama Pengurus | Jabatan | Kelas | Komisi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bendahara** | `dewi.xi5` | `BphDewi2026` | Dewi Madha Lintang | Bendahara 1 | XI.5 | BPH MPK |
| **Bendahara** | `nyoman.x6` | `BphNyoman2026` | Nyoman Nheo Nayaka | Bendahara 2 | X.6 | BPH MPK |
| **Anggota** | `alvano.xi5` | `BphAlvano2026` | Alvano Ghulwani Putra | Ketua Umum | XI.5 | BPH MPK |
| **Anggota** | `walmond.xi3` | `BphWalmond2026` | Walmond Alvaro Sitepu | Ketua 1 | XI.3 | BPH MPK |
| **Anggota** | `melsya.x3` | `BphMelsya2026` | Melsya Herlin Viane | Ketua 2 | X.3 | BPH MPK |
| **Anggota** | `cikal.xi6` | `BphCikal2026` | Cikal Paskal Jabbar | Sekretaris 1 | XI.6 | BPH MPK |
| **Anggota** | `chintya.x7` | `BphChintya2026` | Chintya Christie | Sekretaris 2 | X.7 | BPH MPK |
| **Anggota** | `qurotul.xi2` | `AdartQurotul2026` | Qurotul Afidah Bilqisti | Anggota | XI.2 | KOMISI AD/ART |
| **Anggota** | `febrinzo.xi6` | `AdartFebrinzo2026` | I Nyoman Febrinzo | Anggota | XI.6 | KOMISI AD/ART |
| **Anggota** | `zahra.xi3` | `EvalZahra2026` | Zahra Faizza | Anggota | XI.3 | KOMISI EVALUASI |
| **Anggota** | `farel.xi5` | `PubFarel2026` | M Farel | Anggota | XI.5 | KOMISI PUBLIKASI |
| **Anggota** | `kahlilray.xi2` | `TatibKahlilray2026` | M Kahlilray Gaza El Rabay | Anggota | XI.2 | KOMISI TATIB |
| **Anggota** | `gesta.xi1` | `DpsGesta2026` | Gesta Abiyyu Amaresa | Anggota | XI.1 | KOMISI DPS |
| ... | *(38 pengurus lengkap)* | *(Lihat user_mpk_2026_2027.json)* | | | | |

*Daftar lengkap seluruh 38 pengurus beserta username dan password unik terdapat di file `user_mpk_2026_2027.json`.*

---

## 🛠️ Stack Teknologi

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, Canvas Confetti
- **Database & ORM**: SQLite (`prisma/dev.db`), Prisma ORM
- **Keamanan**: JWT Session (`jose`), `bcryptjs`
- **Ekspor Dokumen**: `jspdf`, `jspdf-autotable`, `xlsx` (SheetJS)

---
© 2026 MPK Trenggana Sumapala · SMAN 2 Taruna Bhayangkara Jawa Timur
