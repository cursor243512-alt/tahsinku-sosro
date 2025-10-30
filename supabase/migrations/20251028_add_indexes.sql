-- Performance indexes for TahsinKu Platform
-- Safe to re-run: use IF NOT EXISTS

-- Participants: search and sort
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants (lower(name));
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants (created_at DESC);

-- Enrollments: filters and sorts
CREATE INDEX IF NOT EXISTS idx_enrollments_start_date ON enrollments (start_date DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_due_date ON enrollments (due_date DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments (status);
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON enrollments (participant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_teacher_id ON enrollments (teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments (class_id);

-- Classes: filters by teacher and type
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_type ON classes (type);

-- Attendance: common filters
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance (class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON attendance (teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date DESC);
