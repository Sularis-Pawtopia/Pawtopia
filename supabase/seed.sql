-- =============================================
-- PAWTOPIA SEED DATA
-- Seed file for development and testing
-- =============================================

-- Note: This seed file uses Supabase Auth functions
-- Run this after the migrations are applied

-- =============================================
-- 1. CREATE TEST USERS (using Supabase auth.users)
-- =============================================

-- First, we create users in auth.users table
-- These are test accounts with password: Test1234!

-- Admin User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'a0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@pawtopia.ph',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin_pawtopia","role":"admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Regular User
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  'b0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'user@test.com',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"test_user","role":"regular_user"}',
  NOW(), NOW(), 'authenticated', 'authenticated',
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Volunteer User
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  'c0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'volunteer@test.com',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"volunteer_hero","role":"volunteer"}',
  NOW(), NOW(), 'authenticated', 'authenticated',
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Adopter User
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  'd0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'yankinyurii123@gmail.com',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"pet_parent","role":"adopter"}',
  NOW(), NOW(), 'authenticated', 'authenticated',
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- NGO User
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  'e0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'ngo@pawsphilippines.org',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"paws_ph","role":"ngo"}',
  NOW(), NOW(), 'authenticated', 'authenticated',
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Shelter User
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  'f0000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'shelter@happypaws.ph',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"happy_paws_shelter","role":"shelter"}',
  NOW(), NOW(), 'authenticated', 'authenticated',
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- City Pound User
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '10000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'pound@manila.gov.ph',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"manila_city_pound","role":"dvmf"}',
  NOW(), NOW(), 'authenticated', 'authenticated',
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 1b. CREATE IDENTITIES FOR AUTH USERS
-- =============================================
-- Supabase requires auth.identities records for login to work

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '{"sub":"a0000001-0000-0000-0000-000000000001","email":"admin@pawtopia.ph","email_verified":true}', 'email', 'a0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW()),
  ('b0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '{"sub":"b0000001-0000-0000-0000-000000000001","email":"user@test.com","email_verified":true}', 'email', 'b0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW()),
  ('c0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', '{"sub":"c0000001-0000-0000-0000-000000000001","email":"volunteer@test.com","email_verified":true}', 'email', 'c0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW()),
  ('d0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', '{"sub":"d0000001-0000-0000-0000-000000000001","email":"adopter@test.com","email_verified":true}', 'email', 'd0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW()),
  ('e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', '{"sub":"e0000001-0000-0000-0000-000000000001","email":"ngo@pawsphilippines.org","email_verified":true}', 'email', 'e0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW()),
  ('f0000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', '{"sub":"f0000001-0000-0000-0000-000000000001","email":"shelter@happypaws.ph","email_verified":true}', 'email', 'f0000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW()),
  ('10000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', '{"sub":"10000001-0000-0000-0000-000000000001","email":"pound@manila.gov.ph","email_verified":true}', 'email', '10000001-0000-0000-0000-000000000001', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. CREATE USER PROFILES
-- =============================================

-- Admin Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, created_at
) VALUES (
  'a0000001-0000-0000-0000-000000000001',
  'admin@pawtopia.ph',
  'admin_pawtopia',
  'admin',
  'admin',
  true,
  '🛡️ Pawtopia Administrator | Ensuring animal welfare across the platform',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Regular User Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, phone, address, city, state, zip_code, created_at
) VALUES (
  'b0000001-0000-0000-0000-000000000001',
  'user@test.com',
  'test_user',
  'regular_user',
  'regular_user',
  true,
  '🐾 Animal lover | Here to support shelters and find my perfect pet companion',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
  '09171234567',
  '123 Main Street, Barangay San Antonio',
  'Makati',
  'Metro Manila',
  '1200',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Volunteer Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, phone, city, state, created_at
) VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'volunteer@test.com',
  'volunteer_hero',
  'volunteer',
  'volunteer',
  true,
  '💪 Volunteer Hero | 50+ hours helping animals | Dog walking specialist',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=volunteer',
  '09181234567',
  'Quezon City',
  'Metro Manila',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Adopter Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, phone, city, state, created_at
) VALUES (
  'd0000001-0000-0000-0000-000000000001',
  'adopter@test.com',
  'pet_parent',
  'adopter',
  'adopter',
  true,
  '❤️ Proud pet parent | Adopted 2 dogs from local shelters',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=adopter',
  '09191234567',
  'Pasig',
  'Metro Manila',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- NGO Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, phone, city, state, created_at
) VALUES (
  'e0000001-0000-0000-0000-000000000001',
  'ngo@pawsphilippines.org',
  'paws_ph',
  'ngo',
  'ngo',
  true,
  '🌍 PAWS Philippines | Animal welfare advocacy since 1954',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=paws',
  '09201234567',
  'Quezon City',
  'Metro Manila',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Shelter Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, phone, city, state, created_at
) VALUES (
  'f0000001-0000-0000-0000-000000000001',
  'shelter@happypaws.ph',
  'happy_paws_shelter',
  'shelter',
  'shelter',
  true,
  '🏥 Happy Paws Animal Shelter | Rescuing and rehoming since 2015',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=shelter',
  '09211234567',
  'Taguig',
  'Metro Manila',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- City Pound Profile
INSERT INTO public.users (
  id, email, username, role, primary_role, is_verified, bio, avatar_url, phone, city, state, created_at
) VALUES (
  '10000001-0000-0000-0000-000000000001',
  'pound@manila.gov.ph',
  'manila_city_pound',
  'dvmf',
  'dvmf',
  true,
  '🏢 Manila City Pound | DVMF Partner | Official government animal welfare facility',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=pound',
  '09221234567',
  'Manila',
  'Metro Manila',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. ASSIGN USER ROLES (simplified - just user_id and role)
-- =============================================

-- Note: The trigger will auto-insert these, but we add explicitly for seeded users

INSERT INTO public.user_roles (user_id, role) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'admin'),
  ('b0000001-0000-0000-0000-000000000001', 'regular_user'),
  ('c0000001-0000-0000-0000-000000000001', 'volunteer'),
  ('d0000001-0000-0000-0000-000000000001', 'adopter'),
  ('e0000001-0000-0000-0000-000000000001', 'ngo'),
  ('f0000001-0000-0000-0000-000000000001', 'shelter'),
  ('10000001-0000-0000-0000-000000000001', 'dvmf')
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================
-- 4. CREATE ORGANIZATION PROFILES
-- =============================================

-- NGO Organization
INSERT INTO public.organization_profiles (
  user_id, organization_type, organization_name, description, 
  phone, email, address, city, state, zip_code,
  verification_status, website, service_areas, is_active
) VALUES (
  'e0000001-0000-0000-0000-000000000001',
  'ngo',
  'PAWS Philippines',
  'The Philippine Animal Welfare Society (PAWS) is a volunteer-based non-government organization whose goal is to prevent animal cruelty through education, animal sheltering and advocacy.',
  '09201234567',
  'info@pawsphilippines.org',
  '89 Katipunan Ave, White Plains',
  'Quezon City',
  'Metro Manila',
  '1110',
  'verified',
  'https://www.pawsphilippines.org',
  ARRAY['Metro Manila', 'Rizal', 'Cavite', 'Laguna', 'Bulacan'],
  true
) ON CONFLICT DO NOTHING;

-- Shelter Organization
INSERT INTO public.organization_profiles (
  user_id, organization_type, organization_name, registration_number,
  description, phone, email, address, city, state, zip_code,
  verification_status, website, service_areas, is_active
) VALUES (
  'f0000001-0000-0000-0000-000000000001',
  'ngo',
  'Happy Paws Animal Shelter',
  'SEC-2015-00012345',
  'Happy Paws is a no-kill animal shelter dedicated to rescuing, rehabilitating, and rehoming abandoned and abused animals in Metro Manila.',
  '09211234567',
  'adopt@happypaws.ph',
  '45 Bonifacio Global City',
  'Taguig',
  'Metro Manila',
  '1630',
  'verified',
  'https://www.happypaws.ph',
  ARRAY['Metro Manila', 'Rizal'],
  true
) ON CONFLICT DO NOTHING;

-- City Pound Organization
INSERT INTO public.organization_profiles (
  user_id, organization_type, organization_name, registration_number,
  description, phone, email, address, city, state, zip_code,
  verification_status, is_active
) VALUES (
  '10000001-0000-0000-0000-000000000001',
  'dvmf',
  'Manila City Veterinary Office - Animal Pound',
  'DVMF-NCR-2020-001',
  'Official animal pound of the City of Manila under the Department of Veterinary Medicine and Fisheries. We handle animal welfare reports, rescues, and adoptions.',
  '09221234567',
  'vetoffice@manila.gov.ph',
  'City Hall Complex, Padre Burgos Ave',
  'Manila',
  'Metro Manila',
  '1000',
  'verified',
  true
) ON CONFLICT DO NOTHING;

-- =============================================
-- 5. CREATE VOLUNTEER PROFILES
-- =============================================

INSERT INTO public.volunteer_profiles (
  user_id, status, application_reason, skills, availability,
  preferred_activities, has_vehicle, can_handle_animals, experience_level,
  background_check_completed, training_completed, total_volunteer_hours, events_attended
) VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'approved',
  'I love animals and want to help shelters care for rescued pets. I have experience with dogs and cats at home.',
  ARRAY['Dog walking', 'Cat care', 'Photography', 'Social media', 'Event planning'],
  '{"monday": true, "tuesday": false, "wednesday": true, "thursday": false, "friday": true, "saturday": true, "sunday": true}',
  ARRAY['Dog walking', 'Adoption events', 'Photography', 'Community outreach'],
  true,
  true,
  'experienced',
  true,
  true,
  52.5,
  12
) ON CONFLICT DO NOTHING;

-- =============================================
-- 6. CREATE SAMPLE SHELTER PROFILES
-- =============================================

INSERT INTO public.shelter_profiles (
  user_id, shelter_name, description, website,
  capacity
) VALUES (
  'f0000001-0000-0000-0000-000000000001',
  'Happy Paws Animal Shelter',
  'No-kill shelter dedicated to rescuing and rehoming abandoned animals',
  'https://www.happypaws.ph',
  100
) ON CONFLICT DO NOTHING;

INSERT INTO public.shelter_profiles (
  user_id, shelter_name, description, capacity
) VALUES (
  '10000001-0000-0000-0000-000000000001',
  'Manila City Animal Pound',
  'Official government animal welfare facility for the City of Manila',
  200
) ON CONFLICT DO NOTHING;

-- =============================================
-- 7. CREATE SAMPLE PETS
-- =============================================
-- Pets require post_id references, skipping for now
-- Pets can be created through the application UI

-- =============================================
-- 8. CREATE SAMPLE EVENTS
-- =============================================
-- Events require post_id references, skipping for now
-- Events can be created through the application UI

-- =============================================
-- 9. CREATE SAMPLE REPORTS
-- =============================================

INSERT INTO public.reports (
  id, reporter_id, is_anonymous, report_type, title, description,
  location_address, location_city, location_state, urgency_level, status,
  animal_species, animal_count, animal_condition
) VALUES
(
  '99999999-9999-9999-9999-999999999999',
  'b0000001-0000-0000-0000-000000000001',
  false,
  'other',
  'Pack of stray dogs near school',
  'There is a pack of about 5-6 stray dogs that have been staying near the elementary school. They seem friendly but some parents are concerned. They look thin and could use some food and medical attention.',
  'Near Rizal Elementary School',
  'Manila',
  'Metro Manila',
  'normal',
  'pending',
  'Dog',
  6,
  'Thin, possibly malnourished'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NULL,
  true,
  'animal_abuse',
  'Dog chained without food or water',
  'There is a dog that has been chained in the backyard of a house for days. The dog appears to have no access to food or water. The owner is rarely home. The dog looks very weak.',
  'Block 5, Lot 12, Sunrise Village',
  'Quezon City',
  'Metro Manila',
  'critical',
  'investigating',
  'Dog',
  1,
  'Weak, dehydrated, possible skin disease'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'c0000001-0000-0000-0000-000000000001',
  false,
  'injured_animal',
  'Cat hit by motorcycle',
  'Saw a cat get hit by a motorcycle near the market. The cat is still alive but cannot move its back legs. I am waiting with the cat but cannot transport it to a vet.',
  'Kamuning Market, Corner Street',
  'Quezon City',
  'Metro Manila',
  'critical',
  'resolved',
  'Cat',
  1,
  'Injured, possible broken spine or legs'
);

-- =============================================
-- 10. CREATE SAMPLE POSTS (Feed)
-- =============================================
-- Posts can be created through the application UI

-- =============================================
-- 11. SUMMARY OF TEST ACCOUNTS
-- =============================================

/*
TEST ACCOUNTS (Password for all: Test1234!)
============================================

1. ADMIN
   Email: admin@pawtopia.ph
   Role: Admin
   Badge: 🛡️ Administrator

2. REGULAR USER
   Email: user@test.com
   Role: Regular User
   Badge: 🌟 Community Member

3. VOLUNTEER
   Email: volunteer@test.com
   Role: Volunteer
   Badge: 💪 Volunteer Hero

4. ADOPTER
   Email: adopter@test.com
   Role: Adopter
   Badge: ❤️ Pet Parent

5. NGO
   Email: ngo@pawsphilippines.org
   Org: PAWS Philippines
   Role: NGO
   Badge: 🌍 NGO Partner

6. SHELTER
   Email: shelter@happypaws.ph
   Org: Happy Paws Animal Shelter
   Role: Shelter
   Badge: 🐾 Shelter Partner

7. CITY POUND
   Email: pound@manila.gov.ph
   Org: Manila City Pound
   Role: City Pound / DVMF
   Badge: 🛡️ Official Partner
*/
