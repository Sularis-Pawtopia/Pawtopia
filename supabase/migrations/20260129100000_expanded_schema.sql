-- =============================================
-- PAWTOPIA EXPANDED SCHEMA
-- Roles, Reporting, Volunteers, Events, Education
-- =============================================

-- =============================================
-- NEW ENUMS
-- =============================================

-- Report types
CREATE TYPE report_type AS ENUM (
  'animal_abuse',
  'neglect',
  'injured_animal',
  'disease_concern',
  'other'
);

-- Report status
CREATE TYPE report_status AS ENUM (
  'pending',
  'under_review',
  'investigating',
  'resolved',
  'dismissed'
);

-- Volunteer application status
CREATE TYPE volunteer_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

-- Event volunteer application status
CREATE TYPE event_volunteer_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'attended',
  'no_show'
);

-- Organization verification status
CREATE TYPE verification_status AS ENUM (
  'pending',
  'verified',
  'rejected',
  'suspended'
);

-- =============================================
-- NOTE: user_roles table is defined in initial schema
-- =============================================
-- =============================================
-- ORGANIZATION PROFILES (NGO, City Pound)
-- =============================================

CREATE TABLE organization_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  organization_type user_role NOT NULL CHECK (organization_type IN ('ngo', 'city_pound')),
  organization_name TEXT NOT NULL,
  registration_number TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  verification_status verification_status DEFAULT 'pending',
  verification_documents JSONB, -- Array of document URLs
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  operating_hours JSONB,
  service_areas TEXT[], -- Areas they cover
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VOLUNTEER PROFILES
-- =============================================

CREATE TABLE volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status volunteer_status DEFAULT 'pending',
  application_reason TEXT,
  skills TEXT[],
  availability JSONB, -- {monday: true, tuesday: false, ...}
  preferred_activities TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  has_vehicle BOOLEAN DEFAULT FALSE,
  can_handle_animals BOOLEAN DEFAULT TRUE,
  experience_level TEXT, -- none, some, experienced
  background_check_completed BOOLEAN DEFAULT FALSE,
  background_check_date DATE,
  training_completed BOOLEAN DEFAULT FALSE,
  training_completion_date DATE,
  badge_awarded_at TIMESTAMPTZ,
  total_volunteer_hours DECIMAL(10,2) DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ANIMAL WELFARE REPORTS
-- =============================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Reporter info (nullable for anonymous)
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  reporter_contact_info JSONB, -- Optional contact for anonymous reports
  
  -- Report details
  report_type report_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Location
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  location_zip TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_notes TEXT, -- Additional location details
  
  -- Media
  media_urls JSONB, -- Array of photo/video URLs
  
  -- Animal details
  animal_species TEXT,
  animal_breed TEXT,
  animal_color TEXT,
  animal_count INTEGER DEFAULT 1,
  animal_condition TEXT,
  
  -- Urgency and status
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  status report_status DEFAULT 'pending',
  
  -- Assignment and handling
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- City pound staff
  assigned_at TIMESTAMPTZ,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report status history for audit trail
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  previous_status report_status,
  new_status report_status NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENHANCED EVENTS (Multi-organizer support)
-- =============================================

-- Add organizer_type to existing events or create enhanced version
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_type user_role;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteers_needed INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteers_confirmed INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_volunteer_event BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS requirements TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Event volunteer applications
CREATE TABLE event_volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status event_volunteer_status DEFAULT 'pending',
  application_message TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  hours_logged DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, volunteer_id)
);

-- =============================================
-- EDUCATIONAL CONTENT
-- =============================================

CREATE TABLE educational_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  author_type user_role NOT NULL CHECK (author_type IN ('ngo', 'city_pound', 'admin')),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'article' CHECK (content_type IN ('article', 'guide', 'announcement', 'seminar', 'infographic')),
  
  -- Media
  featured_image_url TEXT,
  media_urls JSONB,
  
  -- Categorization
  category TEXT,
  tags TEXT[],
  
  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  
  -- For seminars/events
  event_date TIMESTAMPTZ,
  event_location TEXT,
  registration_url TEXT,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- User roles (indexes - table defined in initial schema)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Organization profiles
CREATE INDEX idx_org_profiles_user_id ON organization_profiles(user_id);
CREATE INDEX idx_org_profiles_type ON organization_profiles(organization_type);
CREATE INDEX idx_org_profiles_verification ON organization_profiles(verification_status);

-- Volunteer profiles
CREATE INDEX idx_volunteer_profiles_user_id ON volunteer_profiles(user_id);
CREATE INDEX idx_volunteer_profiles_status ON volunteer_profiles(status);

-- Reports
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_urgency ON reports(urgency_level);
CREATE INDEX idx_reports_assigned_to ON reports(assigned_to);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_location ON reports(location_city, location_state);

-- Report history
CREATE INDEX idx_report_history_report_id ON report_status_history(report_id);
CREATE INDEX idx_report_history_created_at ON report_status_history(created_at DESC);

-- Event volunteers
CREATE INDEX idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX idx_event_volunteers_volunteer_id ON event_volunteers(volunteer_id);
CREATE INDEX idx_event_volunteers_status ON event_volunteers(status);

-- Educational content
CREATE INDEX idx_edu_content_author ON educational_content(author_id);
CREATE INDEX idx_edu_content_type ON educational_content(content_type);
CREATE INDEX idx_edu_content_published ON educational_content(is_published);
CREATE INDEX idx_edu_content_slug ON educational_content(slug);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(check_user_id UUID, check_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = check_user_id 
    AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(check_user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is city pound staff
CREATE OR REPLACE FUNCTION is_city_pound(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(check_user_id, 'city_pound');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is verified volunteer
CREATE OR REPLACE FUNCTION is_verified_volunteer(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM volunteer_profiles 
    WHERE user_id = check_user_id 
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USER ROLES POLICIES
-- =============================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT USING (is_admin(auth.uid()));

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" ON user_roles
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- ORGANIZATION PROFILES POLICIES
-- =============================================

-- Public can view verified organizations
CREATE POLICY "Public can view verified orgs" ON organization_profiles
  FOR SELECT USING (verification_status = 'verified' AND is_active = TRUE);

-- Users can view their own org profile
CREATE POLICY "Users can view own org" ON organization_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all orgs
CREATE POLICY "Admins can view all orgs" ON organization_profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Users can create their own org profile
CREATE POLICY "Users can create own org" ON organization_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (organization_type = 'ngo' OR is_admin(auth.uid()))
  );

-- Users can update their own org profile
CREATE POLICY "Users can update own org" ON organization_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update any org (for verification)
CREATE POLICY "Admins can update orgs" ON organization_profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- =============================================
-- VOLUNTEER PROFILES POLICIES
-- =============================================

-- Users can view their own volunteer profile
CREATE POLICY "Users can view own volunteer profile" ON volunteer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all volunteer profiles
CREATE POLICY "Admins can view all volunteers" ON volunteer_profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Event organizers can view approved volunteers
CREATE POLICY "Organizers can view approved volunteers" ON volunteer_profiles
  FOR SELECT USING (
    status = 'approved' AND (
      has_role(auth.uid(), 'shelter') OR
      has_role(auth.uid(), 'ngo') OR
      has_role(auth.uid(), 'city_pound')
    )
  );

-- Users can create their own volunteer application
CREATE POLICY "Users can apply as volunteer" ON volunteer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own volunteer profile" ON volunteer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update any volunteer profile
CREATE POLICY "Admins can update volunteers" ON volunteer_profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- =============================================
-- REPORTS POLICIES (CRITICAL - Privacy)
-- =============================================

-- Reporters can view their own non-anonymous reports
CREATE POLICY "Reporters can view own reports" ON reports
  FOR SELECT USING (
    auth.uid() = reporter_id AND is_anonymous = FALSE
  );

-- City pounds can view all reports
CREATE POLICY "City pounds can view reports" ON reports
  FOR SELECT USING (is_city_pound(auth.uid()));

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (is_admin(auth.uid()));

-- Anyone can create reports (anonymous or authenticated)
CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT WITH CHECK (
    -- Anonymous reports: reporter_id must be null
    (is_anonymous = TRUE AND reporter_id IS NULL) OR
    -- Authenticated reports: reporter_id must match auth user
    (is_anonymous = FALSE AND auth.uid() = reporter_id)
  );

-- Only city pounds and admins can update reports
CREATE POLICY "City pounds can update reports" ON reports
  FOR UPDATE USING (is_city_pound(auth.uid()) OR is_admin(auth.uid()));

-- =============================================
-- REPORT STATUS HISTORY POLICIES
-- =============================================

-- City pounds and admins can view report history
CREATE POLICY "Authorized users can view report history" ON report_status_history
  FOR SELECT USING (
    is_city_pound(auth.uid()) OR is_admin(auth.uid())
  );

-- Only city pounds and admins can insert history
CREATE POLICY "Authorized users can insert history" ON report_status_history
  FOR INSERT WITH CHECK (
    is_city_pound(auth.uid()) OR is_admin(auth.uid())
  );

-- =============================================
-- EVENT VOLUNTEERS POLICIES
-- =============================================

-- Volunteers can view their own applications
CREATE POLICY "Volunteers can view own applications" ON event_volunteers
  FOR SELECT USING (auth.uid() = volunteer_id);

-- Event organizers can view applications for their events
CREATE POLICY "Organizers can view event applications" ON event_volunteers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_volunteers.event_id 
      AND (events.shelter_id = auth.uid() OR events.organizer_id = auth.uid())
    )
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all event volunteers" ON event_volunteers
  FOR SELECT USING (is_admin(auth.uid()));

-- Verified volunteers can apply to events
CREATE POLICY "Volunteers can apply to events" ON event_volunteers
  FOR INSERT WITH CHECK (
    auth.uid() = volunteer_id AND is_verified_volunteer(auth.uid())
  );

-- Volunteers can update their own applications
CREATE POLICY "Volunteers can update own applications" ON event_volunteers
  FOR UPDATE USING (auth.uid() = volunteer_id);

-- Organizers can update applications for their events
CREATE POLICY "Organizers can update event applications" ON event_volunteers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_volunteers.event_id 
      AND (events.shelter_id = auth.uid() OR events.organizer_id = auth.uid())
    )
  );

-- =============================================
-- EDUCATIONAL CONTENT POLICIES
-- =============================================

-- Public can view published content
CREATE POLICY "Public can view published content" ON educational_content
  FOR SELECT USING (is_published = TRUE);

-- Authors can view their own content
CREATE POLICY "Authors can view own content" ON educational_content
  FOR SELECT USING (auth.uid() = author_id);

-- Admins can view all content
CREATE POLICY "Admins can view all content" ON educational_content
  FOR SELECT USING (is_admin(auth.uid()));

-- NGOs, city pounds, and admins can create content
CREATE POLICY "Authorized users can create content" ON educational_content
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'ngo') OR
      has_role(auth.uid(), 'city_pound')
    )
  );

-- Authors can update their own content
CREATE POLICY "Authors can update own content" ON educational_content
  FOR UPDATE USING (auth.uid() = author_id);

-- Admins can update any content
CREATE POLICY "Admins can update content" ON educational_content
  FOR UPDATE USING (is_admin(auth.uid()));

-- Authors can delete their own content
CREATE POLICY "Authors can delete own content" ON educational_content
  FOR DELETE USING (auth.uid() = author_id);

-- Admins can delete any content
CREATE POLICY "Admins can delete content" ON educational_content
  FOR DELETE USING (is_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger for new tables
-- Note: user_roles table is simplified and doesn't have updated_at

CREATE TRIGGER update_org_profiles_updated_at BEFORE UPDATE ON organization_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_profiles_updated_at BEFORE UPDATE ON volunteer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_volunteers_updated_at BEFORE UPDATE ON event_volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edu_content_updated_at BEFORE UPDATE ON educational_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-record report status changes
CREATE OR REPLACE FUNCTION log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO report_status_history (report_id, previous_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.resolution_notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_report_status AFTER UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION log_report_status_change();

-- Auto-grant volunteer role when approved
CREATE OR REPLACE FUNCTION grant_volunteer_role_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Grant volunteer role (simplified user_roles table)
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'volunteer')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Set badge awarded timestamp
    NEW.badge_awarded_at := NOW();
  ELSIF NEW.status IN ('rejected', 'suspended') AND OLD.status = 'approved' THEN
    -- Remove volunteer role
    DELETE FROM user_roles 
    WHERE user_id = NEW.user_id AND role = 'volunteer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER grant_volunteer_role BEFORE UPDATE ON volunteer_profiles
  FOR EACH ROW EXECUTE FUNCTION grant_volunteer_role_on_approval();

-- =============================================
-- STORAGE BUCKET FOR REPORTS
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for reports bucket (private - only city pounds and admins)
CREATE POLICY "Anyone can upload report media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports');

-- Allow anonymous uploads for reports (using anon key)
CREATE POLICY "Anonymous can upload report media"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "City pounds can view report media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports' AND (is_city_pound(auth.uid()) OR is_admin(auth.uid())));

-- =============================================
-- END OF EXPANDED SCHEMA
-- =============================================
