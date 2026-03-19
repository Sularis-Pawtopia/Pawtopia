-- Update default DVMF healthcare service seeding to work without service_type uniqueness.

CREATE OR REPLACE FUNCTION seed_default_dvmf_healthcare_services(target_dvmf_id UUID)
RETURNS VOID AS $$
BEGIN
  IF target_dvmf_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO dvmf_healthcare_services (dvmf_id, service_type, service_name, description, is_paid, base_fee)
  SELECT target_dvmf_id, 'spay_neuter', 'Spay/Neuter', 'Sterilization procedure for eligible pets.', TRUE, 0
  WHERE NOT EXISTS (
    SELECT 1
    FROM dvmf_healthcare_services
    WHERE dvmf_id = target_dvmf_id
      AND service_name = 'Spay/Neuter'
  );

  INSERT INTO dvmf_healthcare_services (dvmf_id, service_type, service_name, description, is_paid, base_fee)
  SELECT target_dvmf_id, 'vaccination', 'Vaccination', 'Core vaccination service.', FALSE, 0
  WHERE NOT EXISTS (
    SELECT 1
    FROM dvmf_healthcare_services
    WHERE dvmf_id = target_dvmf_id
      AND service_name = 'Vaccination'
  );

  INSERT INTO dvmf_healthcare_services (dvmf_id, service_type, service_name, description, is_paid, base_fee)
  SELECT target_dvmf_id, 'deworming', 'Deworming', 'Routine parasite treatment.', FALSE, 0
  WHERE NOT EXISTS (
    SELECT 1
    FROM dvmf_healthcare_services
    WHERE dvmf_id = target_dvmf_id
      AND service_name = 'Deworming'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
