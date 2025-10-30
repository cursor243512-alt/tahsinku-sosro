-- STEP BY STEP FIX untuk Attendance Duplicates
-- Jalankan per bagian di Supabase Dashboard > SQL Editor

-- ========================================
-- STEP 1: CEK DATA DUPLIKAT
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
-- STEP 2: HAPUS SEMUA DUPLIKAT (sisakan 1)
-- ========================================
-- Hapus record lama, sisakan yang paling baru (ID terbesar)
DELETE FROM attendance
WHERE id NOT IN (
    SELECT MAX(id)
    FROM attendance
    GROUP BY participant_id, class_id, date
);

-- ========================================
-- STEP 3: TAMBAH UNIQUE CONSTRAINT
-- ========================================
-- Sekarang bisa tambah constraint karena duplikat sudah dihapus
ALTER TABLE attendance 
ADD CONSTRAINT attendance_participant_class_date_unique 
UNIQUE (participant_id, class_id, date);

-- ========================================
-- STEP 4: VERIFIKASI
-- ========================================
-- Cek constraint berhasil dibuat
SELECT 
    conname as constraint_name,
    CASE contype 
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        ELSE contype
    END as constraint_type
FROM pg_constraint 
WHERE conrelid = 'attendance'::regclass 
AND conname = 'attendance_participant_class_date_unique';

-- Harusnya return 1 row dengan type UNIQUE

-- ========================================
-- STEP 5: TEST INSERT DUPLIKAT (OPTIONAL)
-- ========================================
-- Test bahwa duplikat tidak bisa diinsert lagi
-- (Ini akan error, dan itu bagus!)
/*
INSERT INTO attendance (teacher_id, class_id, participant_id, date, status, created_by_admin)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333332',
    '2025-10-29',
    'hadir',
    '00000000-0000-0000-0000-000000000001'
);
*/
