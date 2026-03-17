-- Allow event organizers to review participant registrations.
DROP POLICY IF EXISTS "Organizers can update event registrations" ON event_attendees;

CREATE POLICY "Organizers can update event registrations" ON event_attendees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_attendees.event_id
        AND (events.shelter_id = auth.uid() OR events.organizer_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_attendees.event_id
        AND (events.shelter_id = auth.uid() OR events.organizer_id = auth.uid())
    )
  );
