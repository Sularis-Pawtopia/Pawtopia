-- Rename the role enum value so the platform uses DVMF consistently
ALTER TYPE user_role RENAME VALUE 'city_pound' TO 'dvmf';

-- Keep backward compatibility helper name and add a new helper for clarity
CREATE OR REPLACE FUNCTION is_city_pound(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(check_user_id, 'dvmf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_dvmf(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(check_user_id, 'dvmf');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expand event creation policy to support DVMF and NGO organizers
DROP POLICY IF EXISTS "Shelters can create events" ON events;
CREATE POLICY "Organizers can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = shelter_id AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('shelter', 'ngo', 'dvmf')
    )
  );
