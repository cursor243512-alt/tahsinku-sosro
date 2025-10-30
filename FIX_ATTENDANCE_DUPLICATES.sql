-- FIX: Bersihkan data duplikat sebelum membuat unique constraint
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

-- 1. Lihat data duplikat yang ada
SELECT participant_id, class_id, date, COUNT(*) as jumlah_duplikat
FROM attendance
GROUP BY participant_id, class_id, date
HAVING COUNT(*) > 1;

-- 2. Backup data duplikat (untuk jaga-jaga)
CREATE TABLE IF NOT EXISTS attendance_backup AS 
SELECT * FROM attendance
WHERE (participant_id, class_id, date) IN (
    SELECT participant_id, class_id, date
    FROM attendance
    GROUP BY participant_id, class_id, date
    HAVING COUNT(*) > 1
);

-- 3. Hapus duplikat, sisakan hanya 1 record terbaru per kombinasi
DELETE FROM attendance a
WHERE a.id NOT IN (
    SELECT MAX(id)
    FROM attendance b
    WHERE b.participant_id = a.participant_id 
    AND b.class_id = a.class_id 
    AND b.date = a.date
    GROUP BY participant_id, class_id, date
);

-- 4. Sekarang buat unique constraint (setelah duplikat dihapus)
ALTER TABLE attendance 
ADD CONSTRAINT attendance_participant_class_date_unique 
UNIQUE (participant_id, class_id, date);

-- 5. Verifikasi constraint berhasil dibuat
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'attendance'::regclass 
AND conname = 'attendance_participant_class_date_unique';

-- 6. (Optional) Lihat data backup jika perlu
-- SELECT * FROM attendance_backup;

-- 7. (Optional) Hapus table backup setelah yakin semua OK
-- DROP TABLE IF EXISTS attendance_backup;
