-- Add per-event participant approval mode (auto/manual)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS participant_approval_mode TEXT NOT NULL DEFAULT 'auto'
CHECK (participant_approval_mode IN ('auto', 'manual'));

-- Allow pending participant state for manual approval flows
ALTER TABLE event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_status_check;

ALTER TABLE event_attendees
ADD CONSTRAINT event_attendees_status_check
CHECK (status IN ('pending', 'registered', 'waitlisted', 'cancelled'));
