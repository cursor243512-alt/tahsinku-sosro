-- Add unique constraint to prevent duplicate attendance records
-- This ensures each participant can only have one attendance record per class per date
ALTER TABLE attendance 
ADD CONSTRAINT attendance_participant_class_date_unique 
UNIQUE (participant_id, class_id, date);

-- Drop the duplicate index if it exists (since unique constraint creates its own index)
DROP INDEX IF EXISTS idx_attendance_participant;
DROP INDEX IF EXISTS idx_attendance_class;

-- Keep only the date index for queries
-- The unique constraint already provides indexes for participant_id and class_id
