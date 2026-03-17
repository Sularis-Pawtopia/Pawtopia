-- Allow volunteers to withdraw their own event applications.
DROP POLICY IF EXISTS "Volunteers can delete own event applications" ON event_volunteers;

CREATE POLICY "Volunteers can delete own event applications" ON event_volunteers
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = volunteer_id
    AND status IN ('pending', 'approved', 'rejected')
  );
