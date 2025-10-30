# 🎓 TahsinKu Dashboard - Platform Manajemen Tahsin

Platform manajemen modern untuk mengelola peserta, pengajar, absensi, dan jadwal tahsin.

## ✨ Fitur Utama

- **🔐 Login Admin** - Sistem autentikasi admin dengan Supabase Auth
- **📋 Berlangganan** - Kelola berlangganan peserta dengan status pembayaran otomatis (jatuh tempo 28 hari)
- **✅ Absensi** - Catat kehadiran dengan filter dinamis per pengajar & kelas
- **👥 Manajemen Peserta** - CRUD peserta lengkap + pendaftaran ke kelas
- **👨‍🏫 Manajemen Pengajar** - CRUD pengajar + kelola kelas & jadwal mengajar
- **📅 Jadwal** - Lihat jadwal mengajar semua pengajar dalam satu tampilan
- **📊 Export ke Google Sheets** - Export data peserta, pengajar, absensi, dan pembayaran ke spreadsheet

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: TailwindCSS v4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Export**: Google Sheets API (googleapis)
- **Icons**: Lucide React
- **Form**: React Hook Form + Zod
- **Date**: date-fns

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

**Baca file `SETUP_SUPABASE.md` untuk panduan lengkap!**

Ringkasan:
1. Login ke dashboard Supabase
2. Jalankan SQL migrations di SQL Editor
3. Setup authentication (buat user admin)
4. (Opsional) Pindahkan credentials ke `.env.local`

### 3. Setup Google Sheets (Opsional)

**Baca file `SETUP_GOOGLE_SHEETS.md` untuk panduan lengkap!**

Ringkasan:
1. Buat Google Cloud Project & enable Google Sheets API
2. Buat Service Account & download credentials JSON
3. Simpan file sebagai `google-credentials.json` di root project
4. Buat spreadsheet & share dengan email service account
5. Tambahkan konfigurasi ke `.env.local`:
   ```bash
   GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   ```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 🔑 Login Default

- **Email**: `coder243512@gmail.com`
- **Password**: `admin123` (sesuai yang Anda set saat setup)

## 📁 Struktur Project

```
tahsinku-platform/
├── app/
│   ├── api/export/           # API routes untuk export
│   │   ├── participants/     # Export peserta
│   │   ├── instructors/      # Export pengajar
│   │   ├── attendance/       # Export absensi
│   │   └── payments/         # Export pembayaran
│   ├── dashboard/
│   │   ├── berlangganan/     # Fitur berlangganan
│   │   ├── absensi/           # Fitur absensi
│   │   ├── peserta/           # CRUD peserta
│   │   ├── pengajar/          # CRUD pengajar
│   │   ├── jadwal/            # Lihat jadwal
│   │   └── layout.tsx         # Dashboard layout
│   ├── login/                 # Login page
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── export-button.tsx     # Komponen tombol export
├── lib/
│   ├── supabase.ts           # Supabase client & types
│   ├── google-sheets.ts      # Google Sheets service
│   ├── auth-context.tsx      # Auth context provider
│   └── utils.ts              # Utilities
├── supabase/migrations/      # SQL migrations
├── SETUP_SUPABASE.md         # Panduan setup Supabase
└── SETUP_GOOGLE_SHEETS.md    # Panduan setup Google Sheets
```

## 🎯 Alur Penggunaan

### 1. Tambah Pengajar
1. Masuk ke menu **Pengajar**
2. Klik **Tambah Pengajar**, isi data
3. Klik ikon 🎓 untuk **Kelola Kelas**
4. Tambahkan kelas (privat/reguler) dengan jadwal

### 2. Daftar Peserta
1. Masuk ke menu **Manajemen Peserta**
2. Klik **Tambah Peserta**, isi data
3. Klik ikon ➕ untuk **Daftarkan ke Kelas**
4. Pilih kelas, tanggal daftar
5. Otomatis masuk ke **Berlangganan** dengan jatuh tempo 28 hari

### 3. Catat Absensi
1. Masuk ke menu **Absensi**
2. Pilih pengajar → otomatis muncul kelas yang dia ajar
3. Pilih kelas → otomatis muncul daftar peserta
4. Pilih tanggal, status kehadiran (Hadir/Izin/Berhalangan)
5. Jika izin/berhalangan, pilih alasan
6. Klik **Kirim Absensi**

### 4. Monitor Berlangganan
1. Masuk ke menu **Berlangganan**
2. Lihat daftar peserta, jatuh tempo, status pembayaran
3. Search & sort data
4. Klik **Tandai Lunas** untuk update status

### 5. Export Data ke Google Sheets
1. **Setup** (hanya sekali): Ikuti `SETUP_GOOGLE_SHEETS.md` untuk konfigurasi
2. Masuk ke menu mana saja (Peserta/Pengajar/Absensi/Berlangganan)
3. Klik tombol **Export ke Sheets** di kanan atas
4. Data akan otomatis ter-export ke spreadsheet yang sudah dikonfigurasi
5. Spreadsheet akan memiliki sheet terpisah untuk setiap jenis data

## 🔄 Database Schema

### Tabel Utama
- `admins` - Data admin
- `teachers` - Data pengajar
- `participants` - Data peserta
- `classes` - Kelas (terhubung ke pengajar)
- `enrollments` - Pendaftaran/berlangganan peserta
- `attendance` - Absensi kehadiran

### Relasi
- `classes.teacher_id` → `teachers.id`
- `enrollments.participant_id` → `participants.id`
- `enrollments.teacher_id` → `teachers.id`
- `enrollments.class_id` → `classes.id`
- `attendance.teacher_id` → `teachers.id`
- `attendance.class_id` → `classes.id`
- `attendance.participant_id` → `participants.id`

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Deploy!

## 📝 To-Do Future Enhancements

- [x] ~~Ekspor ke Google Sheets~~ ✅ **Sudah diimplementasi!**
- [ ] Invite admin baru via email
- [ ] Dashboard analytics
- [ ] Laporan bulanan otomatis
- [ ] Notifikasi WhatsApp untuk jatuh tempo
- [ ] Pembayaran terintegrasi
- [ ] Scheduled export otomatis

## 🐛 Troubleshooting

Lihat file `SETUP_SUPABASE.md` bagian Troubleshooting.

## 📄 License

MIT

## 👨‍💻 Developer

Dibuat dengan ❤️ menggunakan teknologi terbaik untuk platform tahsin Indonesia.
