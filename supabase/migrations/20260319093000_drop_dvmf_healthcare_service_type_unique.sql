-- Allow DVMF branches to create multiple named services without type-based uniqueness collisions.

ALTER TABLE dvmf_healthcare_services
  DROP CONSTRAINT IF EXISTS dvmf_healthcare_services_unique_type_per_dvmf;
