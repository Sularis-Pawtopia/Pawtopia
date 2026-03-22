-- Ensure users can only create healthcare appointment requests for pets they own.

DROP POLICY IF EXISTS "Allowed roles can create appointment requests" ON healthcare_appointment_requests;

CREATE POLICY "Allowed roles can create appointment requests" ON healthcare_appointment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('adopter', 'volunteer', 'regular_user')
    )
    AND EXISTS (
      SELECT 1
      FROM users target_dvmf
      WHERE target_dvmf.id = healthcare_appointment_requests.dvmf_id
        AND target_dvmf.role = 'dvmf'
    )
    AND EXISTS (
      SELECT 1
      FROM pets
      WHERE pets.id = healthcare_appointment_requests.pet_id
        AND pets.owner_id = auth.uid()
    )
    AND status = 'pending_approval'
  );
