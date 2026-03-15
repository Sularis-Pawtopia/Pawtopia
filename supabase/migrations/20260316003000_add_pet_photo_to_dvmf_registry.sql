-- Optional photo URL for DVMF registry records
ALTER TABLE dvmf_pet_registry
ADD COLUMN IF NOT EXISTS pet_photo_url TEXT;
