# 📊 Panduan Setup Google Sheets Integration

## ⚡ Quick Start (Production - Recommended)

Untuk deployment produksi, gunakan ENV variable `GOOGLE_SHEETS_CREDENTIALS_JSON`:

1. Download service account JSON dari Google Cloud
2. Copy seluruh isi JSON (termasuk kurung kurawal)
3. Tambahkan ke `.env.local` atau `.env.production`:
   ```
   GOOGLE_SHEETS_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}
   GOOGLE_SHEETS_SPREADSHEET_ID=1SvQk2KDlYe8Qnx0ovyjhf1Ha-begXIOcJzTEDCNRlQ
   ```
4. Share spreadsheet dengan `client_email` dari JSON sebagai **Editor**
5. Restart server

## Step 1: Buat Google Cloud Project & Service Account

### 1.1 Buat Project di Google Cloud Console

1. Buka https://console.cloud.google.com
2. Klik **Select a project** > **New Project**
3. Nama project: `TahsinKu Platform` (atau nama lain)
4. Klik **Create**

### 1.2 Enable Google Sheets API

1. Di dashboard project, cari **APIs & Services** > **Library**
2. Search: `Google Sheets API`
3. Klik **Google Sheets API** > **Enable**

### 1.3 Buat Service Account

1. Klik **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **Service Account**
3. Isi:
   - **Service account name**: `tahsinku-sheets-service`
   - **Service account ID**: akan otomatis terisi
4. Klik **Create and Continue**
5. **Grant this service account access** (opsional, skip saja) > **Continue**
6. Klik **Done**

### 1.4 Download Credentials JSON

1. Di halaman **Credentials**, klik service account yang baru dibuat
2. Klik tab **Keys**
3. Klik **Add Key** > **Create new key**
4. Pilih **JSON** > **Create**
5. File JSON akan otomatis terdownload (simpan file ini!)

### 1.5 Simpan Credentials di Project

1. Rename file JSON yang didownload menjadi: `google-credentials.json`
2. Pindahkan ke folder root project (jangan commit ke git!)
3. Tambahkan ke `.gitignore`:

```
google-credentials.json
```

## Step 2: Buat Google Spreadsheet

1. Buka https://sheets.google.com
2. Buat spreadsheet baru
3. Beri nama: `TahsinKu Database Export`
4. **PENTING**: Share spreadsheet dengan email service account
   - Klik **Share** di kanan atas
   - Paste email service account (format: `tahsinku-sheets-service@project-id.iam.gserviceaccount.com`)
   - Beri akses **Editor**
   - Klik **Send**

5. Copy Spreadsheet ID dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

## Step 3: Setup Environment Variables

Tambahkan ke file `.env.local`:

```bash
# Google Sheets Integration
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

## Step 4: Struktur Sheet yang Akan Dibuat

Service akan membuat dan **sync real-time** untuk sheets berikut:

- **Peserta** - Data peserta (auto-sync saat tambah/edit/hapus)
- **Pengajar** - Data pengajar (auto-sync saat tambah/edit/hapus)
- **Berlangganan** - Data pembayaran (auto-sync saat tambah/update status)
- **Absensi** - Data absensi (auto-sync saat kirim absensi)

### Sync Real-Time (One-Way: Dashboard → Sheets)

Setiap kali ada perubahan di dashboard, data **otomatis** tersinkronisasi ke Google Sheets:

✅ **Tambah Peserta** → Sheet "Peserta" langsung update  
✅ **Edit Peserta** → Sheet "Peserta" langsung update  
✅ **Hapus Peserta** → Sheet "Peserta" langsung update  

✅ **Tambah Pengajar** → Sheet "Pengajar" langsung update  
✅ **Edit Pengajar** → Sheet "Pengajar" langsung update  
✅ **Hapus Pengajar** → Sheet "Pengajar" langsung update  

✅ **Daftar Berlangganan** → Sheet "Berlangganan" langsung update  
✅ **Update Status Bayar** → Sheet "Berlangganan" langsung update  

✅ **Kirim Absensi** → Sheet "Absensi" langsung update + buka tab baru  

**Sheets selalu menampilkan data terbaru dari dashboard secara otomatis.**

## Step 5: Test Integration

Jalankan export pertama kali melalui:

1. Login ke dashboard
2. Pilih menu yang ingin di-export (misal: Berlangganan)
3. Klik tombol **Export to Sheets**

## Troubleshooting

### Error: "The caller does not have permission"

**Solusi**: 
- Pastikan spreadsheet sudah di-share dengan email service account
- Email service account bisa dilihat di file `google-credentials.json` field `client_email`

### Error: "Unable to parse range"

**Solusi**:
- Pastikan nama sheet sudah benar
- Sheet akan otomatis dibuat jika belum ada

### Error: "ENOENT: no such file or directory"

**Solusi**:
- Pastikan file `google-credentials.json` ada di root project
- Cek path di `.env.local` sudah benar

## Best Practices

1. **Jangan commit** file `google-credentials.json` ke Git
2. **Backup** credentials ke tempat aman (password manager)
3. **Rotate keys** secara berkala untuk keamanan
4. **Monitor** API quota di Google Cloud Console
5. **Gunakan** sheet terpisah untuk development & production

## API Quota

Google Sheets API Free tier:
- 300 requests per minute per project
- 60 requests per minute per user

Untuk aplikasi ini sudah cukup, kecuali ada traffic sangat tinggi.
