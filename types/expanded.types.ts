// =============================================
// PAWTOPIA EXPANDED TYPES
// New roles, reports, volunteers, education
// =============================================

// =============================================
// ENUMS
// =============================================

export type UserRoleType = 
  | 'admin'
  | 'regular_user'
  | 'adopter'
  | 'volunteer'
  | 'shelter'
  | 'ngo'
  | 'dvmf';

export type ReportType = 
  | 'abuse'
  | 'neglect'
  | 'stray'
  | 'injured'
  | 'hoarding'
  | 'illegal_breeding'
  | 'abandoned'
  | 'other';

export type ReportStatus = 
  | 'pending'
  | 'under_review'
  | 'investigating'
  | 'action_taken'
  | 'resolved'
  | 'closed'
  | 'referred';

export type VolunteerStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type EventVolunteerStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'attended'
  | 'no_show';

export type VerificationStatus = 
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';

export type ContentType = 'article' | 'guide' | 'announcement' | 'seminar' | 'infographic';

// =============================================
// USER ROLES
// =============================================

export interface UserRole {
  id: string;
  user_id: string;
  role: UserRoleType;
  granted_by: string | null;
  granted_at: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleInsert {
  id?: string;
  user_id: string;
  role: UserRoleType;
  granted_by?: string | null;
  granted_at?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UserRoleUpdate {
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
}

// =============================================
// ORGANIZATION PROFILES (NGO, DVMF)
// =============================================

export interface OrganizationProfile {
  id: string;
  user_id: string;
  organization_type: 'ngo' | 'dvmf';
  organization_name: string;
  registration_number: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  verification_status: VerificationStatus;
  verification_documents: string[] | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  operating_hours: Record<string, string> | null;
  service_areas: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProfileInsert {
  id?: string;
  user_id: string;
  organization_type: 'ngo' | 'dvmf';
  organization_name: string;
  registration_number?: string | null;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  verification_documents?: string[] | null;
  operating_hours?: Record<string, string> | null;
  service_areas?: string[] | null;
}

export interface OrganizationProfileUpdate {
  organization_name?: string;
  registration_number?: string | null;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  verification_status?: VerificationStatus;
  verification_documents?: string[] | null;
  verified_at?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  operating_hours?: Record<string, string> | null;
  service_areas?: string[] | null;
  is_active?: boolean;
}

// =============================================
// VOLUNTEER PROFILES
// =============================================

export interface VolunteerProfile {
  id: string;
  user_id: string;
  status: VolunteerStatus;
  application_reason: string | null;
  skills: string[] | null;
  availability: Record<string, boolean> | null;
  preferred_activities: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  has_vehicle: boolean;
  can_handle_animals: boolean;
  experience_level: string | null;
  background_check_completed: boolean;
  background_check_date: string | null;
  training_completed: boolean;
  training_completion_date: string | null;
  badge_awarded_at: string | null;
  total_volunteer_hours: number;
  events_attended: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerProfileInsert {
  id?: string;
  user_id: string;
  application_reason?: string | null;
  skills?: string[] | null;
  availability?: Record<string, boolean> | null;
  preferred_activities?: string[] | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  has_vehicle?: boolean;
  can_handle_animals?: boolean;
  experience_level?: string | null;
}

export interface VolunteerProfileUpdate {
  status?: VolunteerStatus;
  application_reason?: string | null;
  skills?: string[] | null;
  availability?: Record<string, boolean> | null;
  preferred_activities?: string[] | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  has_vehicle?: boolean;
  can_handle_animals?: boolean;
  experience_level?: string | null;
  background_check_completed?: boolean;
  background_check_date?: string | null;
  training_completed?: boolean;
  training_completion_date?: string | null;
  badge_awarded_at?: string | null;
  total_volunteer_hours?: number;
  events_attended?: number;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
}

// =============================================
// REPORTS
// =============================================

export interface Report {
  id: string;
  reporter_id: string | null;
  is_anonymous: boolean;
  reporter_name: string | null;
  reporter_contact: string | null;
  reporter_email: string | null;
  reporter_contact_info: {
    email?: string;
    phone?: string;
  } | null;
  report_type: ReportType;
  title: string;
  description: string;
  address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_notes: string | null;
  media_urls: string[] | null;
  animal_type: string | null;
  animal_breed: string | null;
  animal_color: string | null;
  animal_count: number;
  animal_condition: string | null;
  urgency_level: UrgencyLevel;
  status: ReportStatus;
  assigned_to: string | null;
  assigned_at: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportInsert {
  id?: string;
  reporter_id?: string | null;
  is_anonymous?: boolean;
  reporter_name?: string | null;
  reporter_contact?: string | null;
  reporter_email?: string | null;
  reporter_contact_info?: {
    email?: string;
    phone?: string;
  } | null;
  report_type: ReportType;
  title: string;
  description: string;
  address?: string | null;
  barangay?: string | null;
  city?: string | null;
  province?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_notes?: string | null;
  media_urls?: string[] | null;
  animal_type?: string | null;
  animal_breed?: string | null;
  animal_color?: string | null;
  animal_count?: number;
  animal_condition?: string | null;
  urgency_level?: UrgencyLevel;
}

export interface ReportUpdate {
  status?: ReportStatus;
  assigned_to?: string | null;
  assigned_at?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  urgency_level?: UrgencyLevel;
}

export interface ReportStatusHistory {
  id: string;
  report_id: string;
  from_status: ReportStatus | null;
  to_status: ReportStatus;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  created_at: string;
}

// =============================================
// EVENT VOLUNTEERS
// =============================================

export interface EventVolunteer {
  id: string;
  event_id: string;
  volunteer_id: string;
  status: EventVolunteerStatus;
  application_message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_logged: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventVolunteerInsert {
  id?: string;
  event_id: string;
  volunteer_id: string;
  application_message?: string | null;
}

export interface EventVolunteerUpdate {
  status?: EventVolunteerStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  hours_logged?: number | null;
  notes?: string | null;
}

// =============================================
// EDUCATIONAL CONTENT
// =============================================

export interface EducationalContent {
  id: string;
  author_id: string;
  author_type: 'ngo' | 'dvmf' | 'admin';
  title: string;
  slug: string | null;
  summary: string | null;
  content: string;
  content_type: ContentType;
  featured_image_url: string | null;
  media_urls: string[] | null;
  category: string | null;
  tags: string[] | null;
  is_published: boolean;
  published_at: string | null;
  event_date: string | null;
  event_location: string | null;
  registration_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface EducationalContentInsert {
  id?: string;
  author_id: string;
  author_type: 'ngo' | 'dvmf' | 'admin';
  title: string;
  slug?: string | null;
  summary?: string | null;
  content: string;
  content_type?: ContentType;
  featured_image_url?: string | null;
  media_urls?: string[] | null;
  category?: string | null;
  tags?: string[] | null;
  is_published?: boolean;
  event_date?: string | null;
  event_location?: string | null;
  registration_url?: string | null;
}

export interface EducationalContentUpdate {
  title?: string;
  slug?: string | null;
  summary?: string | null;
  content?: string;
  content_type?: ContentType;
  featured_image_url?: string | null;
  media_urls?: string[] | null;
  category?: string | null;
  tags?: string[] | null;
  is_published?: boolean;
  published_at?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  registration_url?: string | null;
  view_count?: number;
}

// =============================================
// EXTENDED EVENT TYPE (with volunteer fields)
// =============================================

export interface ExtendedEvent {
  id: string;
  post_id: string;
  shelter_id: string;
  event_name: string;
  event_date: string;
  end_date: string | null;
  location: string;
  event_type: string | null;
  capacity: number | null;
  registration_required: boolean;
  registration_url: string | null;
  // New fields
  organizer_type: UserRoleType | null;
  organizer_id: string | null;
  volunteers_needed: number;
  volunteers_confirmed: number;
  is_volunteer_event: boolean;
  requirements: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// USER WITH ROLES
// =============================================

export interface UserWithRoles {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  roles: UserRoleType[];
  volunteer_profile?: VolunteerProfile | null;
  organization_profile?: OrganizationProfile | null;
}

// =============================================
// PERMISSION HELPERS
// =============================================

export interface UserPermissions {
  isAdmin: boolean;
  isCityPound: boolean;
  isNgo: boolean;
  isShelter: boolean;
  isVolunteer: boolean;
  isAdopter: boolean;
  canViewReports: boolean;
  canManageReports: boolean;
  canCreateEvents: boolean;
  canManageVolunteers: boolean;
  canPostEducation: boolean;
  canVerifyOrganizations: boolean;
}

// =============================================
// FORM DATA TYPES
// =============================================

export interface ReportFormData {
  report_type: ReportType;
  title: string;
  description: string;
  is_anonymous: boolean;
  location_address?: string;
  location_city?: string;
  location_state?: string;
  location_zip?: string;
  location_lat?: number;
  location_lng?: number;
  location_notes?: string;
  animal_species?: string;
  animal_breed?: string;
  animal_color?: string;
  animal_count?: number;
  animal_condition?: string;
  urgency_level?: UrgencyLevel;
  contact_email?: string;
  contact_phone?: string;
}

export interface VolunteerApplicationFormData {
  application_reason: string;
  skills: string[];
  availability: Record<string, boolean>;
  preferred_activities: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_vehicle: boolean;
  can_handle_animals: boolean;
  experience_level: string;
}

export interface OrganizationApplicationFormData {
  organization_type: 'ngo' | 'dvmf';
  organization_name: string;
  registration_number?: string;
  description: string;
  website?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  service_areas: string[];
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================
// FILTER TYPES
// =============================================

export interface ReportFilters {
  status?: ReportStatus;
  report_type?: ReportType;
  urgency_level?: UrgencyLevel;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  city?: string;
  state?: string;
}

export interface VolunteerFilters {
  status?: VolunteerStatus;
  has_vehicle?: boolean;
  can_handle_animals?: boolean;
  experience_level?: string;
}

export interface EventFilters {
  event_type?: string;
  is_volunteer_event?: boolean;
  date_from?: string;
  date_to?: string;
  organizer_type?: UserRoleType;
}
