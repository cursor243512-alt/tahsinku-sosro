# 🚀 Panduan Setup Supabase untuk TahsinKu Dashboard

## Step 1: Login ke Supabase

1. Buka https://supabase.com
2. Login dengan akun Anda
3. Pilih project yang sudah Anda buat (yang memiliki URL: `https://rvxkaldqcwibanitxtqb.supabase.co`)

## Step 2: Jalankan SQL Migrations

1. Di dashboard Supabase, klik **SQL Editor** di sidebar kiri
2. Klik **New Query**
3. Copy seluruh isi file `supabase/migrations/001_initial_schema.sql`
4. Paste ke SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`
6. Tunggu sampai selesai (Anda akan melihat "Success. No rows returned")

7. Ulangi langkah yang sama untuk file `supabase/migrations/002_seed_data.sql`

## Step 3: Setup Authentication

### 3.1 Enable Email Authentication

1. Di dashboard Supabase, klik **Authentication** di sidebar
2. Klik **Providers**
3. Pastikan **Email** provider sudah enabled (toggle ON)
4. **PENTING**: Scroll ke bawah dan **DISABLE** "Confirm Email" untuk testing
   - Cari opsi "Enable email confirmations"
   - Toggle menjadi **OFF** (agar tidak perlu konfirmasi email saat testing)

### 3.2 Buat User Admin Pertama

1. Masih di **Authentication**, klik **Users**
2. Klik **Add User** (atau **Invite**)
3. Pilih **Create new user**
4. Isi:
   - **Email**: `coder243512@gmail.com`
   - **Password**: `admin123` (atau password yang Anda inginkan)
   - **Auto Confirm User**: Centang (jika ada opsi ini)
5. Klik **Create User** atau **Send Invitation**

**Catatan**: User ini harus match dengan data di tabel `admins` yang sudah dibuat via migration.

## Step 4: Konfigurasi Row Level Security (RLS)

RLS sudah dikonfigurasi di migration, tapi untuk sementara kita set policy yang permissive agar semua authenticated users bisa akses semua tabel.

**Untuk production**, Anda perlu membatasi policy hanya untuk admin users berdasarkan `auth.uid()`.

### Optional: Cek RLS Policies

1. Di dashboard Supabase, klik **Table Editor**
2. Pilih salah satu tabel (misalnya `participants`)
3. Klik tab **Policies** di bagian atas
4. Pastikan ada policy "Allow all operations"

## Step 5: (Opsional) Buat .env.local

Untuk keamanan yang lebih baik, buat file `.env.local` di root project dan pindahkan credentials ke sana:

```bash
# File: .env.local
NEXT_PUBLIC_SUPABASE_URL=https://rvxkaldqcwibanitxtqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eGthbGRxY3dpYmFuaXR4dHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjM4NTksImV4cCI6MjA3NzEzOTg1OX0.bpheiy90CtU4H76Vs22ksPpCtZM67WqPtf6nv7H443o
```

Kemudian update `lib/supabase.ts`:

```typescript
// Ganti hardcoded values dengan:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

## Step 6: Jalankan Development Server

```bash
npm run dev
```

Buka browser di http://localhost:3000

## Step 7: Login Pertama Kali

1. Aplikasi akan redirect ke `/login`
2. Masukkan:
   - **Email**: `coder243512@gmail.com`
   - **Password**: `admin123` (atau password yang Anda set di Step 3)
3. Klik **Login**

## Troubleshooting

### Error: "Invalid login credentials"

**Solusi**:
1. Pastikan user sudah dibuat di Authentication > Users
2. Pastikan password yang dimasukkan benar
3. Pastikan email confirmation sudah di-disable (atau user sudah di-confirm)

### Error: "relation does not exist"

**Solusi**:
1. Pastikan semua SQL migrations sudah dijalankan
2. Cek di Table Editor apakah semua tabel sudah ada

### Error: "row-level security policy"

**Solusi**:
1. Pastikan RLS policies sudah dibuat via migration
2. Atau sementara disable RLS untuk testing:
   ```sql
   ALTER TABLE nama_tabel DISABLE ROW LEVEL SECURITY;
   ```

### Data seed tidak muncul

**Solusi**:
1. Cek di Table Editor > Pilih tabel > View data
2. Jika kosong, jalankan ulang file `002_seed_data.sql`

## Fitur yang Sudah Tersedia

✅ **Login Admin** - Akses terbatas untuk admin  
✅ **Berlangganan** - Lihat daftar peserta, status pembayaran, sorting, search  
✅ **Absensi** - Catat kehadiran dengan filter dinamis per pengajar & kelas  
✅ **Pendaftaran Peserta** - CRUD peserta + daftarkan ke kelas  
✅ **Pengajar** - CRUD pengajar + kelola kelas & jadwal  
✅ **Jadwal** - Lihat jadwal mengajar semua pengajar  

## Fitur yang Belum Diimplementasi (Future Enhancement)

- Invite admin baru (perlu implement email service)
- Dashboard analytics
- Laporan bulanan
- Notifikasi otomatis jatuh tempo

## ✅ Fitur Baru: Export ke Google Sheets

Sekarang Anda bisa export data ke Google Sheets! Lihat file `SETUP_GOOGLE_SHEETS.md` untuk panduan setup.

## Support

Jika ada masalah, silakan tanyakan atau cek:
- Supabase Logs: Dashboard > Logs
- Browser Console: F12 > Console tab
- Terminal: Lihat error di terminal tempat `npm run dev` berjalan
