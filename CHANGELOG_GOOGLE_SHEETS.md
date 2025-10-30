# 📊 Changelog: Google Sheets Integration

## ✅ Fitur yang Ditambahkan

### 1. **Google Sheets Service** (`lib/google-sheets.ts`)
- Service untuk mengelola koneksi ke Google Sheets API
- Fungsi export untuk 4 jenis data:
  - `exportParticipantsToSheets()` - Export data peserta
  - `exportInstructorsToSheets()` - Export data pengajar
  - `exportAttendanceToSheets()` - Export data absensi
  - `exportPaymentsToSheets()` - Export data pembayaran
- Auto-create sheets jika belum ada
- Auto-format header (bold, background biru)
- Test connection function

### 2. **API Routes** (`app/api/export/`)
- `/api/export/participants` - Endpoint export peserta
- `/api/export/instructors` - Endpoint export pengajar
- `/api/export/attendance` - Endpoint export absensi
- `/api/export/payments` - Endpoint export pembayaran
- Semua dilengkapi dengan authentication check
- Fetch data dari Supabase dengan join relations

### 3. **Export Button Component** (`components/export-button.tsx`)
- Komponen reusable untuk tombol export
- Loading state dengan spinner
- Success/error notifications
- Auto-hide notification setelah beberapa detik
- Icon dari Lucide React (FileSpreadsheet)

### 4. **Integrasi di Dashboard Pages**
Tombol export ditambahkan ke 4 halaman:
- ✅ **Berlangganan** (`app/dashboard/berlangganan/page.tsx`)
- ✅ **Peserta** (`app/dashboard/peserta/page.tsx`)
- ✅ **Pengajar** (`app/dashboard/pengajar/page.tsx`)
- ✅ **Absensi** (`app/dashboard/absensi/page.tsx`)

### 5. **Dokumentasi Lengkap**
- `SETUP_GOOGLE_SHEETS.md` - Panduan step-by-step setup Google Cloud & Service Account
- `README.md` - Update dengan fitur Google Sheets
- `SETUP_SUPABASE.md` - Update status fitur
- `.env.local.example` - Template environment variables

### 6. **Security & Configuration**
- `.gitignore` updated untuk exclude `google-credentials.json`
- Environment variables untuk credentials path & spreadsheet ID
- Service Account authentication (lebih aman dari OAuth)

## 📦 Dependencies Baru

```json
{
  "googleapis": "^latest"
}
```

## 🔧 Environment Variables Baru

```bash
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

## 📋 Data yang Di-export

### Participants Sheet
- ID, Nama, Email, Telepon, Alamat, Tanggal Lahir, Tanggal Daftar, Status

### Instructors Sheet  
- ID, Nama, Email, Telepon, Spesialisasi, Status

### Attendance Sheet
- ID, Nama Peserta, Kelas, Pengajar, Tanggal, Status, Catatan

### Payments Sheet
- ID, Nama Peserta, Jumlah (Rp), Tanggal Bayar, Metode, Status, Catatan

## 🚀 Cara Menggunakan

1. **Setup** (sekali saja):
   - Ikuti panduan di `SETUP_GOOGLE_SHEETS.md`
   - Buat Service Account di Google Cloud
   - Download credentials JSON
   - Share spreadsheet dengan email service account
   - Set environment variables

2. **Export Data**:
   - Login ke dashboard
   - Buka halaman mana saja (Peserta/Pengajar/Absensi/Berlangganan)
   - Klik tombol **"Export ke Sheets"** di kanan atas
   - Data otomatis ter-export ke spreadsheet

## ⚡ Features

- ✅ Real-time export on-demand
- ✅ Automatic sheet creation
- ✅ Formatted headers (bold + colored)
- ✅ Clear existing data before export (fresh data setiap kali)
- ✅ Authentication required
- ✅ Error handling with user-friendly messages
- ✅ Loading states & notifications
- ✅ Separate sheets untuk setiap jenis data

## 🎯 Next Steps (Optional)

- [ ] Scheduled auto-export (cron job)
- [ ] Incremental updates (append instead of replace)
- [ ] Export filters (date range, status, dll)
- [ ] Export history/logs
- [ ] Multiple spreadsheet support
- [ ] Export to CSV as alternative

## 📝 Notes

- **API Quota**: Google Sheets API free tier = 300 requests/min
- **Performance**: Export besar (1000+ rows) bisa memakan waktu beberapa detik
- **Security**: Credentials JSON jangan di-commit ke Git!
- **Spreadsheet**: Harus di-share dengan email service account
