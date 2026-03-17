-- Participant registrations for events/drives
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  registration_type TEXT NOT NULL DEFAULT 'participant' CHECK (registration_type = 'participant'),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_status ON event_attendees(event_id, status);

ALTER TABLE events ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_count INTEGER DEFAULT 0;

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own event registrations" ON event_attendees;
CREATE POLICY "Users can view own event registrations" ON event_attendees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can view event registrations" ON event_attendees;
CREATE POLICY "Organizers can view event registrations" ON event_attendees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_attendees.event_id
        AND (events.shelter_id = auth.uid() OR events.organizer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_attendees;
CREATE POLICY "Admins can view all event registrations" ON event_attendees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own event registrations" ON event_attendees;
CREATE POLICY "Users can create own event registrations" ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own event registrations" ON event_attendees;
CREATE POLICY "Users can update own event registrations" ON event_attendees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own event registrations" ON event_attendees;
CREATE POLICY "Users can delete own event registrations" ON event_attendees
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION refresh_event_registration_counts(target_event_id UUID)
RETURNS VOID AS $$
DECLARE
  registered_count INTEGER;
  waitlisted_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO registered_count
  FROM event_attendees
  WHERE event_id = target_event_id
    AND status = 'registered';

  SELECT COUNT(*)::INTEGER INTO waitlisted_count
  FROM event_attendees
  WHERE event_id = target_event_id
    AND status = 'waitlisted';

  UPDATE events
  SET attendee_count = COALESCE(registered_count, 0),
      waitlist_count = COALESCE(waitlisted_count, 0),
      updated_at = NOW()
  WHERE id = target_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_event_attendees_change_refresh_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_event_registration_counts(OLD.event_id);
    RETURN OLD;
  END IF;

  PERFORM refresh_event_registration_counts(NEW.event_id);

  IF TG_OP = 'UPDATE' AND NEW.event_id <> OLD.event_id THEN
    PERFORM refresh_event_registration_counts(OLD.event_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS event_attendees_refresh_counts_trigger ON event_attendees;
CREATE TRIGGER event_attendees_refresh_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION on_event_attendees_change_refresh_counts();

-- Backfill for existing events
SELECT refresh_event_registration_counts(id) FROM events;

-- Allow any authenticated user to apply as event volunteer.
DROP POLICY IF EXISTS "Volunteers can apply to events" ON event_volunteers;
CREATE POLICY "Volunteers can apply to events" ON event_volunteers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = volunteer_id);

-- Keep volunteers_confirmed in sync after status changes
CREATE OR REPLACE FUNCTION refresh_event_volunteers_confirmed(target_event_id UUID)
RETURNS VOID AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO approved_count
  FROM event_volunteers
  WHERE event_id = target_event_id
    AND status = 'approved';

  UPDATE events
  SET volunteers_confirmed = COALESCE(approved_count, 0),
      updated_at = NOW()
  WHERE id = target_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_event_volunteers(event_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM refresh_event_volunteers_confirmed(event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_volunteer_hours(volunteer_user_id UUID, hours NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE volunteer_profiles
  SET total_volunteer_hours = COALESCE(total_volunteer_hours, 0) + COALESCE(hours, 0),
      updated_at = NOW()
  WHERE user_id = volunteer_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
