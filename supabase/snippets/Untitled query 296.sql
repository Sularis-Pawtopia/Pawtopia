-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('adopter', 'shelter');
CREATE TYPE adoption_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE pet_status AS ENUM ('available', 'pending', 'adopted');
CREATE TYPE lost_pet_status AS ENUM ('lost', 'found');
CREATE TYPE post_type AS ENUM ('adoptable', 'lost_pet', 'event', 'story', 'feed');
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'adoption_request', 'adoption_status', 'message');

-- =============================================
-- USERS TABLE
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'adopter',
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHELTER PROFILES
-- =============================================

CREATE TABLE shelter_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  shelter_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  registration_number TEXT,
  license_document_url TEXT,
  verification_documents JSONB, -- Array of document URLs
  operating_hours JSONB, -- {monday: "9AM-5PM", tuesday: "9AM-5PM", ...}
  capacity INTEGER,
  social_media JSONB, -- {facebook: "", instagram: "", twitter: ""}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADOPTER PROFILES
-- =============================================

CREATE TABLE adopter_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  occupation TEXT,
  income_range TEXT,
  household_size INTEGER,
  has_children BOOLEAN,
  has_other_pets BOOLEAN,
  pet_experience TEXT,
  home_type TEXT, -- apartment, house, condo
  home_ownership TEXT, -- rent, own
  yard_size TEXT,
  home_photos JSONB, -- Array of photo URLs
  valid_id_urls JSONB, -- Array of ID document URLs
  references JSONB, -- Array of reference contacts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POSTS (Unified for all post types)
-- =============================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  post_type post_type NOT NULL,
  title TEXT,
  description TEXT NOT NULL,
  media_urls JSONB, -- Array of image/video URLs
  tags TEXT[],
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PETS (Adoptable Pets)
-- =============================================

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  shelter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL, -- dog, cat, bird, etc.
  breed TEXT,
  age_years INTEGER,
  age_months INTEGER,
  gender TEXT,
  size TEXT, -- small, medium, large
  color TEXT,
  weight DECIMAL(5,2),
  status pet_status DEFAULT 'available',
  is_vaccinated BOOLEAN DEFAULT FALSE,
  is_spayed_neutered BOOLEAN DEFAULT FALSE,
  medical_history TEXT,
  temperament TEXT[],
  good_with_kids BOOLEAN,
  good_with_dogs BOOLEAN,
  good_with_cats BOOLEAN,
  energy_level TEXT, -- low, medium, high
  special_needs TEXT,
  adoption_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOST PETS
-- =============================================

CREATE TABLE lost_pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age_years INTEGER,
  color TEXT,
  last_seen_location TEXT NOT NULL,
  last_seen_date DATE NOT NULL,
  reward DECIMAL(10,2),
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  status lost_pet_status DEFAULT 'lost',
  found_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EVENTS
-- =============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  shelter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  event_type TEXT, -- adoption drive, fundraiser, awareness
  capacity INTEGER,
  registration_required BOOLEAN DEFAULT FALSE,
  registration_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STORIES (Success Stories)
-- =============================================

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  adopter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shelter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_text TEXT NOT NULL,
  adoption_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADOPTION REQUESTS
-- =============================================

CREATE TABLE adoption_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  adopter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shelter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status adoption_status DEFAULT 'pending',
  application_data JSONB, -- Questionnaire responses
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, adopter_id)
);

-- =============================================
-- ADOPTIONS (Successful Adoptions)
-- =============================================

CREATE TABLE adoptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  adopter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shelter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  adoption_request_id UUID REFERENCES adoption_requests(id) ON DELETE SET NULL,
  adoption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  adoption_fee_paid DECIMAL(10,2),
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMENTS
-- =============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LIKES
-- =============================================

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FOLLOWS (Users following shelters)
-- =============================================

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_post_type ON posts(post_type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_active ON posts(is_active);

-- Pets indexes
CREATE INDEX idx_pets_shelter_id ON pets(shelter_id);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_created_at ON pets(created_at DESC);

-- Lost pets indexes
CREATE INDEX idx_lost_pets_user_id ON lost_pets(user_id);
CREATE INDEX idx_lost_pets_status ON lost_pets(status);
CREATE INDEX idx_lost_pets_last_seen_date ON lost_pets(last_seen_date DESC);

-- Events indexes
CREATE INDEX idx_events_shelter_id ON events(shelter_id);
CREATE INDEX idx_events_event_date ON events(event_date);

-- Adoption requests indexes
CREATE INDEX idx_adoption_requests_pet_id ON adoption_requests(pet_id);
CREATE INDEX idx_adoption_requests_adopter_id ON adoption_requests(adopter_id);
CREATE INDEX idx_adoption_requests_shelter_id ON adoption_requests(shelter_id);
CREATE INDEX idx_adoption_requests_status ON adoption_requests(status);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Likes indexes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Follows indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE adopter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS POLICIES
-- =============================================

-- Users can read all public user data
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- SHELTER PROFILES POLICIES
-- =============================================

-- Shelter profiles are viewable by everyone
CREATE POLICY "Shelter profiles are viewable by everyone" ON shelter_profiles
  FOR SELECT USING (true);

-- Users can create their own shelter profile
CREATE POLICY "Users can create own shelter profile" ON shelter_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own shelter profile
CREATE POLICY "Users can update own shelter profile" ON shelter_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- ADOPTER PROFILES POLICIES
-- =============================================

-- Adopter profiles are viewable by the user and shelters
CREATE POLICY "Adopter profiles viewable by user and shelters" ON adopter_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'shelter')
  );

-- Users can create their own adopter profile
CREATE POLICY "Users can create own adopter profile" ON adopter_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own adopter profile
CREATE POLICY "Users can update own adopter profile" ON adopter_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- POSTS POLICIES
-- =============================================

-- Posts are viewable by everyone if active
CREATE POLICY "Active posts are viewable by everyone" ON posts
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

-- Users can create their own posts
CREATE POLICY "Users can create own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PETS POLICIES
-- =============================================

-- Pets are viewable by everyone
CREATE POLICY "Pets are viewable by everyone" ON pets
  FOR SELECT USING (true);

-- Shelters can create pets
CREATE POLICY "Shelters can create pets" ON pets
  FOR INSERT WITH CHECK (
    auth.uid() = shelter_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'shelter')
  );

-- Shelters can update their own pets
CREATE POLICY "Shelters can update own pets" ON pets
  FOR UPDATE USING (auth.uid() = shelter_id);

-- Shelters can delete their own pets
CREATE POLICY "Shelters can delete own pets" ON pets
  FOR DELETE USING (auth.uid() = shelter_id);

-- =============================================
-- LOST PETS POLICIES
-- =============================================

-- Lost pets are viewable by everyone
CREATE POLICY "Lost pets are viewable by everyone" ON lost_pets
  FOR SELECT USING (true);

-- Users can create their own lost pet posts
CREATE POLICY "Users can create own lost pet posts" ON lost_pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own lost pet posts
CREATE POLICY "Users can update own lost pet posts" ON lost_pets
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- EVENTS POLICIES
-- =============================================

-- Events are viewable by everyone
CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

-- Shelters can create events
CREATE POLICY "Shelters can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = shelter_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'shelter')
  );

-- Shelters can update their own events
CREATE POLICY "Shelters can update own events" ON events
  FOR UPDATE USING (auth.uid() = shelter_id);

-- =============================================
-- STORIES POLICIES
-- =============================================

-- Stories are viewable by everyone
CREATE POLICY "Stories are viewable by everyone" ON stories
  FOR SELECT USING (true);

-- Adopters can create their own stories
CREATE POLICY "Adopters can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = adopter_id);

-- Adopters can update their own stories
CREATE POLICY "Adopters can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = adopter_id);

-- =============================================
-- ADOPTION REQUESTS POLICIES
-- =============================================

-- Adoption requests viewable by adopter and shelter
CREATE POLICY "Adoption requests viewable by involved parties" ON adoption_requests
  FOR SELECT USING (
    auth.uid() = adopter_id OR
    auth.uid() = shelter_id
  );

-- Adopters can create adoption requests
CREATE POLICY "Adopters can create adoption requests" ON adoption_requests
  FOR INSERT WITH CHECK (auth.uid() = adopter_id);

-- Shelters can update adoption requests for their pets
CREATE POLICY "Shelters can update adoption requests" ON adoption_requests
  FOR UPDATE USING (auth.uid() = shelter_id);

-- =============================================
-- ADOPTIONS POLICIES
-- =============================================

-- Adoptions viewable by involved parties
CREATE POLICY "Adoptions viewable by involved parties" ON adoptions
  FOR SELECT USING (
    auth.uid() = adopter_id OR
    auth.uid() = shelter_id
  );

-- Shelters can create adoption records
CREATE POLICY "Shelters can create adoptions" ON adoptions
  FOR INSERT WITH CHECK (auth.uid() = shelter_id);

-- =============================================
-- COMMENTS POLICIES
-- =============================================

-- Comments are viewable by everyone
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- LIKES POLICIES
-- =============================================

-- Likes are viewable by everyone
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications (handled by functions)
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FOLLOWS POLICIES
-- =============================================

-- Follows are viewable by everyone
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

-- Users can create their own follows
CREATE POLICY "Users can create own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shelter_profiles_updated_at BEFORE UPDATE ON shelter_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adopter_profiles_updated_at BEFORE UPDATE ON adopter_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment post like count
CREATE OR REPLACE FUNCTION increment_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post like count
CREATE OR REPLACE FUNCTION decrement_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for like count
CREATE TRIGGER increment_post_likes AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION increment_post_like_count();

CREATE TRIGGER decrement_post_likes AFTER DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION decrement_post_like_count();

-- Function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for comment count
CREATE TRIGGER increment_post_comments AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

CREATE TRIGGER decrement_post_comments AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comment_count();