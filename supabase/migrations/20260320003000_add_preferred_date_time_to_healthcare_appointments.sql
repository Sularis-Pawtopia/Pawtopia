-- Add preferred_date and preferred_time columns to healthcare_appointment_requests
-- These columns are used for time-based appointment requests where users specify
-- their preferred date and time instead of selecting from pre-made slots

ALTER TABLE healthcare_appointment_requests
ADD COLUMN preferred_date DATE,
ADD COLUMN preferred_time TIME;

-- Create index for faster lookups by preferred date
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_preferred_date
  ON healthcare_appointment_requests(preferred_date);

-- Create composite index for date + time queries
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_preferred_datetime
  ON healthcare_appointment_requests(preferred_date, preferred_time);
