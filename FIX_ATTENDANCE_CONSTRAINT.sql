-- FIX untuk error "no unique or exclusion constraint matching the ON CONFLICT specification"
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

-- 1. Tambah unique constraint untuk mencegah duplikasi absensi
ALTER TABLE attendance 
ADD CONSTRAINT attendance_participant_class_date_unique 
UNIQUE (participant_id, class_id, date);

-- 2. Bersihkan index yang redundan (opsional, untuk performa)
DROP INDEX IF EXISTS idx_attendance_participant;
DROP INDEX IF EXISTS idx_attendance_class_id;

-- Cek hasilnya
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'attendance'::regclass 
AND conname = 'attendance_participant_class_date_unique';

-- Hasil yang diharapkan: 1 row dengan contype = 'u' (unique)
