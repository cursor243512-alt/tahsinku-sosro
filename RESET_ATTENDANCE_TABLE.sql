-- ALTERNATIF: Reset Table Attendance (Hapus Semua Data)
-- ⚠️ WARNING: Ini akan HAPUS SEMUA DATA ABSENSI
-- Gunakan ini jika data masih testing/tidak penting

-- 1. Hapus semua data attendance
TRUNCATE TABLE attendance;

-- 2. Tambah unique constraint di table kosong
ALTER TABLE attendance 
ADD CONSTRAINT attendance_participant_class_date_unique 
UNIQUE (participant_id, class_id, date);

-- 3. Verifikasi berhasil
SELECT 'Attendance table reset complete!' as status;

-- Cek constraint
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'attendance'::regclass 
AND conname = 'attendance_participant_class_date_unique';
