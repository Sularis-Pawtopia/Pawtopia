-- Allow adopters to cancel (delete) their own pending adoption requests
CREATE POLICY "Adopters can cancel own adoption requests" ON adoption_requests
  FOR DELETE
  USING (auth.uid() = adopter_id);
