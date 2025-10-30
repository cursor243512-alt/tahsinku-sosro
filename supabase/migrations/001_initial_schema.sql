-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  whatsapp TEXT,
  gender TEXT,
  job TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('privat', 'reguler')),
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  days TEXT[] NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table (berlangganan/pendaftaran)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu_pembayaran' CHECK (status IN ('lunas', 'menunggu_pembayaran')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('hadir', 'izin', 'berhalangan')),
  reason TEXT CHECK (reason IN ('sakit', 'acara', 'keperluan_mendesak', 'peserta_libur') OR reason IS NULL),
  created_by_admin UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_enrollments_participant ON enrollments(participant_id);
CREATE INDEX idx_enrollments_teacher ON enrollments(teacher_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_due_date ON enrollments(due_date);
CREATE INDEX idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_participant ON attendance(participant_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Insert default admin
INSERT INTO admins (email, display_name) 
VALUES ('coder243512@gmail.com', 'Admin Utama')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users to do everything for now)
-- Note: Untuk production, ini harus dipersempit ke admin users only

-- Admins policies
CREATE POLICY "Allow all operations on admins" ON admins FOR ALL USING (true) WITH CHECK (true);

-- Teachers policies
CREATE POLICY "Allow all operations on teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);

-- Participants policies
CREATE POLICY "Allow all operations on participants" ON participants FOR ALL USING (true) WITH CHECK (true);

-- Classes policies
CREATE POLICY "Allow all operations on classes" ON classes FOR ALL USING (true) WITH CHECK (true);

-- Enrollments policies
CREATE POLICY "Allow all operations on enrollments" ON enrollments FOR ALL USING (true) WITH CHECK (true);

-- Attendance policies
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
