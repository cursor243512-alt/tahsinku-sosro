# 🔄 Real-Time Sync Dashboard ↔ Google Sheets

## ✅ Implementasi Selesai

Sistem **One-Way Real-Time Sync** dari Dashboard ke Google Sheets telah aktif.

## 🎯 Cara Kerja

Dashboard adalah **single source of truth**. Setiap perubahan data di dashboard **otomatis** langsung tersinkronisasi ke Google Sheets di background tanpa perlu klik tombol export.

## 📊 Modul yang Ter-Sync

### 1. **Peserta** (Participants)
- ✅ Tambah peserta → Sheet "Peserta" update
- ✅ Edit peserta → Sheet "Peserta" update
- ✅ Hapus peserta → Sheet "Peserta" update

### 2. **Pengajar** (Teachers/Instructors)
- ✅ Tambah pengajar → Sheet "Pengajar" update
- ✅ Edit pengajar → Sheet "Pengajar" update
- ✅ Hapus pengajar → Sheet "Pengajar" update

### 3. **Berlangganan** (Enrollments/Payments)
- ✅ Daftar berlangganan baru → Sheet "Berlangganan" update
- ✅ Update status pembayaran → Sheet "Berlangganan" update

### 4. **Absensi** (Attendance)
- ✅ Kirim absensi → Sheet "Absensi" update + buka tab baru

## ⚡ Keunggulan

1. **Tanpa Intervensi Manual**
   - Tidak perlu klik tombol "Export to Sheets"
   - Sync otomatis di background

2. **Always Up-to-Date**
   - Google Sheets selalu menampilkan data terbaru
   - Cocok untuk monitoring real-time dan sharing dengan stakeholder

3. **Silent & Fast**
   - Proses sync tidak mengganggu UX
   - Tidak ada alert/popup kecuali error
   - User tetap bisa lanjut kerja

4. **Reliable**
   - Built-in retry logic (3x attempts)
   - Error logging lengkap di console

## 🔍 Monitoring

Sync berjalan di background. Untuk monitoring:

1. **Cek Console Browser (F12)**
   ```
   [auto-export] participants synced: 15 rows
   [auto-export] instructors synced: 8 rows
   [auto-export] payments synced: 42 rows
   ```

2. **Jika Ada Error**
   ```
   [auto-export] participants failed: The caller does not have permission
   ```
   → Cek akses service account ke spreadsheet

## 📝 Catatan Penting

### Tombol "Export to Sheets" Tetap Ada
Tombol manual export masih tersedia di UI untuk:
- Export on-demand jika butuh refresh paksa
- Troubleshooting jika auto-sync gagal
- Export pertama kali saat setup

### Perilaku Auto-Sync
- Sync di-trigger **setelah** mutasi Supabase sukses
- Jika sync gagal, data tetap tersimpan di Supabase
- Sync tidak mem-block UI (non-blocking, silent)

### Performance
- Export full table (bukan incremental)
- Untuk table besar (>1000 rows), sync bisa 1-3 detik
- Google Sheets API quota: 300 req/menit (cukup untuk normal usage)

## 🔧 Troubleshooting

### Sync Tidak Jalan
1. Cek console: ada error log?
2. Pastikan ENV sudah benar (GOOGLE_SHEETS_SPREADSHEET_ID, credentials)
3. Pastikan service account punya akses Editor ke spreadsheet
4. Restart dev server setelah ubah ENV

### Data Tidak Update di Sheets
1. Refresh spreadsheet (Ctrl+R / Cmd+R)
2. Cek apakah ada error di console browser
3. Coba export manual lewat tombol "Export to Sheets"
4. Verifikasi RLS Supabase tidak mem-block query

## 🎉 Ready to Use

Sistem sudah aktif! Coba:
1. Tambah peserta baru di dashboard
2. Refresh Google Sheets
3. Data baru sudah muncul di sheet "Peserta"

**Dashboard dan Sheets kini tersinkronisasi real-time! 🚀**
