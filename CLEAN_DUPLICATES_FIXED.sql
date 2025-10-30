-- FIX ATTENDANCE DUPLICATES (PostgreSQL Compatible)
-- Jalankan step by step di Supabase Dashboard

-- ========================================
-- STEP 1: CEK DATA DUPLIKAT YANG ADA
-- ========================================
SELECT 
    p.name as nama_peserta,
    c.name as nama_kelas,
    a.date as tanggal,
    COUNT(*) as jumlah_duplikat
FROM attendance a
JOIN participants p ON p.id = a.participant_id
JOIN classes c ON c.id = a.class_id
GROUP BY p.name, c.name, a.date, a.participant_id, a.class_id
HAVING COUNT(*) > 1
ORDER BY a.date DESC;

-- ========================================
-- STEP 2: HAPUS DUPLIKAT (Metode PostgreSQL)
-- ========================================
-- Hapus duplikat, sisakan 1 record dengan created_at terbaru
DELETE FROM attendance a
WHERE a.ctid NOT IN (
    SELECT MAX(b.ctid)
    FROM attendance b
    WHERE b.participant_id = a.participant_id
      AND b.class_id = a.class_id
      AND b.date = a.date
    GROUP BY b.participant_id, b.class_id, b.date
);

-- Alternatif jika metode di atas tidak jalan:
-- DELETE FROM attendance
-- WHERE ctid NOT IN (
--     SELECT DISTINCT ON (participant_id, class_id, date) ctid
--     FROM attendance
--     ORDER BY participant_id, class_id, date, created_at DESC
-- );

-- ========================================
-- STEP 3: VERIFIKASI TIDAK ADA DUPLIKAT LAGI
-- ========================================
SELECT 
    participant_id, 
    class_id, 
    date,
    COUNT(*) as count
FROM attendance
GROUP BY participant_id, class_id, date
HAVING COUNT(*) > 1;

-- Harusnya return 0 rows

-- ========================================
-- STEP 4: TAMBAH UNIQUE CONSTRAINT
-- ========================================
ALTER TABLE attendance 
ADD CONSTRAINT attendance_participant_class_date_unique 
UNIQUE (participant_id, class_id, date);

-- ========================================
-- STEP 5: VERIFIKASI CONSTRAINT BERHASIL
-- ========================================
SELECT 
    conname as constraint_name,
    CASE contype 
        WHEN 'u' THEN '✅ UNIQUE CONSTRAINT CREATED'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        ELSE contype
    END as status
FROM pg_constraint 
WHERE conrelid = 'attendance'::regclass 
AND conname = 'attendance_participant_class_date_unique';

-- Harusnya return: ✅ UNIQUE CONSTRAINT CREATED

-- ========================================
-- SELESAI! Absensi siap digunakan
-- ========================================
