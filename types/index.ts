import { Database } from './database.types';

// Extract table types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type ShelterProfile = Database['public']['Tables']['shelter_profiles']['Row'];
export type ShelterProfileInsert = Database['public']['Tables']['shelter_profiles']['Insert'];
export type ShelterProfileUpdate = Database['public']['Tables']['shelter_profiles']['Update'];

export type AdopterProfile = Database['public']['Tables']['adopter_profiles']['Row'];
export type AdopterProfileInsert = Database['public']['Tables']['adopter_profiles']['Insert'];
export type AdopterProfileUpdate = Database['public']['Tables']['adopter_profiles']['Update'];

export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'];
export type PostUpdate = Database['public']['Tables']['posts']['Update'];

export type Pet = Database['public']['Tables']['pets']['Row'];
export type PetInsert = Database['public']['Tables']['pets']['Insert'];
export type PetUpdate = Database['public']['Tables']['pets']['Update'];

export type LostPet = Database['public']['Tables']['lost_pets']['Row'];
export type LostPetInsert = Database['public']['Tables']['lost_pets']['Insert'];
export type LostPetUpdate = Database['public']['Tables']['lost_pets']['Update'];

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type Story = Database['public']['Tables']['stories']['Row'];
export type StoryInsert = Database['public']['Tables']['stories']['Insert'];
export type StoryUpdate = Database['public']['Tables']['stories']['Update'];

export type AdoptionRequest = Database['public']['Tables']['adoption_requests']['Row'];
export type AdoptionRequestInsert = Database['public']['Tables']['adoption_requests']['Insert'];
export type AdoptionRequestUpdate = Database['public']['Tables']['adoption_requests']['Update'];

export type Adoption = Database['public']['Tables']['adoptions']['Row'];
export type AdoptionInsert = Database['public']['Tables']['adoptions']['Insert'];
export type AdoptionUpdate = Database['public']['Tables']['adoptions']['Update'];

export type Comment = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];

export type Like = Database['public']['Tables']['likes']['Row'];
export type LikeInsert = Database['public']['Tables']['likes']['Insert'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export type Follow = Database['public']['Tables']['follows']['Row'];
export type FollowInsert = Database['public']['Tables']['follows']['Insert'];

// Enums
export type UserRole = Database['public']['Enums']['user_role'];
export type AdoptionStatus = Database['public']['Enums']['adoption_status'];
export type PetStatus = Database['public']['Enums']['pet_status'];
export type LostPetStatus = Database['public']['Enums']['lost_pet_status'];
export type PostType = Database['public']['Enums']['post_type'];
export type NotificationType = Database['public']['Enums']['notification_type'];

// Extended types with relations
export interface PostWithUser extends Post {
  user: User;
}

export interface PostWithPet extends Post {
  pet: Pet | null;
}

export interface PostWithDetails extends Post {
  user: User;
  pet: Pet | null;
  lost_pet: LostPet | null;
  event: Event | null;
  story: Story | null;
  is_liked_by_user?: boolean;
  comments?: CommentWithUser[];
}

export interface PetWithPost extends Pet {
  post: Post;
  shelter: User;
}

export interface PetWithShelter extends Pet {
  shelter: User & { shelter_profile?: ShelterProfile };
}

export interface CommentWithUser extends Comment {
  user: User;
  replies?: CommentWithUser[];
}

export interface AdoptionRequestWithDetails extends AdoptionRequest {
  pet: PetWithPost;
  adopter: User & { adopter_profile?: AdopterProfile };
  shelter: User & { shelter_profile?: ShelterProfile };
}

export interface AdoptionWithDetails extends Adoption {
  pet: Pet;
  adopter: User & { adopter_profile?: AdopterProfile };
  shelter: User & { shelter_profile?: ShelterProfile };
}

export interface NotificationWithDetails extends Notification {
  sender?: User;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface UserSession {
  user: User;
  profile: ShelterProfile | AdopterProfile | null;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  role: UserRole;
}

export interface AdopterOnboardingFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  occupation: string;
  income_range: string;
  household_size: number;
  has_children: boolean;
  has_other_pets: boolean;
  pet_experience: string;
  home_type: string;
  home_ownership: string;
  yard_size: string;
  home_photos?: File[];
  valid_ids?: File[];
}

export interface ShelterOnboardingFormData {
  shelter_name: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  website?: string;
  registration_number: string;
  license_document?: File;
  verification_documents?: File[];
  capacity?: number;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface PetFormData {
  name: string;
  species: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  gender: string;
  size: string;
  color?: string;
  weight?: number;
  is_vaccinated: boolean;
  is_spayed_neutered: boolean;
  medical_history?: string;
  temperament: string[];
  good_with_kids?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;
  energy_level: string;
  special_needs?: string;
  adoption_fee?: number;
  description: string;
  media: File[];
  tags: string[];
}

export interface LostPetFormData {
  pet_name: string;
  species: string;
  breed?: string;
  age_years?: number;
  color: string;
  last_seen_location: string;
  last_seen_date: string;
  reward?: number;
  contact_phone: string;
  contact_email?: string;
  description: string;
  media: File[];
}

export interface EventFormData {
  event_name: string;
  event_date: string;
  end_date?: string;
  location: string;
  event_type: string;
  capacity?: number;
  registration_required: boolean;
  registration_url?: string;
  description: string;
  media: File[];
}

export interface StoryFormData {
  story_text: string;
  adoption_date?: string;
  media: File[];
}

export interface AdoptionApplicationFormData {
  why_adopt: string;
  previous_pet_experience: string;
  current_pets: string;
  household_members: string;
  work_schedule: string;
  pet_care_plan: string;
  emergency_plan: string;
  veterinarian_info?: string;
  additional_notes?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Filter and search types
export interface PetFilters {
  species?: string;
  breed?: string;
  size?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  good_with_kids?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;
  shelter_id?: string;
  status?: PetStatus;
}

export interface PostFilters {
  post_type?: PostType;
  user_id?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

// Stats types
export interface ShelterStats {
  total_pets: number;
  available_pets: number;
  adopted_pets: number;
  pending_adoptions: number;
  total_events: number;
  total_followers: number;
}

export interface AdopterStats {
  total_comments: number;
  total_likes: number;
  adopted_pets: number;
  pending_requests: number;
  lost_pets_posted: number;
}

// Storage types
export interface UploadedFile {
  url: string;
  path: string;
  bucket: string;
}

export type StorageBucket = 'pet-images' | 'profile-avatars' | 'event-images' | 'documents' | 'stories';
