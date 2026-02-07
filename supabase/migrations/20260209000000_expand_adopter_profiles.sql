-- =============================================
-- Expand adopter_profiles with all onboarding fields
-- =============================================

-- Personal info extras
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS mi TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS social_media_link TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS civil_status TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS prompted_by TEXT[];
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS first_time_adopter TEXT;

-- Alternative contact person
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS alt_first_name TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS alt_last_name TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS alt_mi TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS alt_birth_date DATE;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS alt_relationship TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS alt_contact_number TEXT;

-- Questionnaire / adoption screening
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS looking_to_adopt TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS specific_shelter_animal TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS ideal_pet_description TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS do_you_rent TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS pet_when_moving TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS live_with TEXT[];
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS household_allergic TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS pet_caretaker TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS financial_responsible TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS vacation_care TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS hours_alone TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS introduce_steps TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS family_support TEXT;
ALTER TABLE adopter_profiles ADD COLUMN IF NOT EXISTS had_pets_before TEXT;
