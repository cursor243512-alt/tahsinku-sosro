-- Seed Data untuk Testing
-- Data ini sesuai dengan contoh yang diberikan user

-- Insert teacher: Ustadzah Himmah
INSERT INTO teachers (id, name, phone, gender, address) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Ustadzah Himmah', '081234567890', 'Perempuan', 'Jakarta')
ON CONFLICT (id) DO NOTHING;

-- Insert classes yang diajar Ustadzah Himmah
INSERT INTO classes (id, type, name, teacher_id, capacity, days, time) 
VALUES 
  -- Privat classes
  ('22222222-2222-2222-2222-222222222221', 'privat', 'Privat: Senin & Selasa - Ibu Diah', '11111111-1111-1111-1111-111111111111', 1, ARRAY['Senin', 'Selasa'], '18.10'),
  ('22222222-2222-2222-2222-222222222222', 'privat', 'Privat: Rabu & Jumat - Ibu Ashiva', '11111111-1111-1111-1111-111111111111', 1, ARRAY['Rabu', 'Jumat'], '18.10'),
  ('22222222-2222-2222-2222-222222222223', 'privat', 'Privat: Kamis & Jumat - Ibu Susi', '11111111-1111-1111-1111-111111111111', 1, ARRAY['Kamis', 'Jumat'], '19.15'),
  -- Reguler class
  ('22222222-2222-2222-2222-222222222224', 'reguler', 'Reguler: Senin & Rabu', '11111111-1111-1111-1111-111111111111', 5, ARRAY['Senin', 'Rabu'], '18.10')
ON CONFLICT (id) DO NOTHING;

-- Insert participants
INSERT INTO participants (id, name, address, whatsapp, gender, job) 
VALUES 
  -- Privat students
  ('33333333-3333-3333-3333-333333333331', 'Ibu Susi', 'Jakarta Selatan', '081111111111', 'Perempuan', 'Ibu Rumah Tangga'),
  ('33333333-3333-3333-3333-333333333332', 'Ashiva Faranas', 'Jakarta Barat', '081111111112', 'Perempuan', 'Mahasiswa'),
  ('33333333-3333-3333-3333-333333333333', 'Diah Wahyuning', 'Jakarta Timur', '081111111113', 'Perempuan', 'Pegawai Swasta'),
  -- Reguler students
  ('33333333-3333-3333-3333-333333333334', 'Sri Hartini', 'Jakarta Utara', '081111111114', 'Perempuan', 'Guru'),
  ('33333333-3333-3333-3333-333333333335', 'Sri Nurweni', 'Jakarta Pusat', '081111111115', 'Perempuan', 'Wiraswasta'),
  ('33333333-3333-3333-3333-333333333336', 'Ria Filisita', 'Tangerang', '081111111116', 'Perempuan', 'Karyawan'),
  ('33333333-3333-3333-3333-333333333337', 'Nur Aini', 'Bekasi', '081111111117', 'Perempuan', 'Ibu Rumah Tangga')
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments (berlangganan)
-- Ibu Susi - Privat, daftar 9 Oktober 2025, jatuh tempo 6 November 2025 (28 hari)
INSERT INTO enrollments (participant_id, teacher_id, class_id, start_date, due_date, status) 
VALUES 
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', '2025-10-09', '2025-11-06', 'menunggu_pembayaran'),
  
  -- Ashiva Faranas - Privat, daftar 15 September 2025
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2025-09-15', '2025-10-13', 'menunggu_pembayaran'),
  
  -- Diah Wahyuning - Privat, daftar 18 September 2025
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2025-09-18', '2025-10-16', 'menunggu_pembayaran'),
  
  -- Sri Hartini - Reguler, daftar 17 September 2025
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222224', '2025-09-17', '2025-10-15', 'menunggu_pembayaran'),
  
  -- Sri Nurweni - Reguler, daftar 16 September 2025
  ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222224', '2025-09-16', '2025-10-14', 'menunggu_pembayaran'),
  
  -- Ria Filisita - Reguler, daftar 16 September 2025
  ('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222224', '2025-09-16', '2025-10-14', 'menunggu_pembayaran'),
  
  -- Nur Aini - Reguler, daftar 15 September 2025
  ('33333333-3333-3333-3333-333333333337', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222224', '2025-09-15', '2025-10-13', 'lunas')
ON CONFLICT DO NOTHING;
