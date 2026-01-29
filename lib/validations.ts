import { z } from 'zod';

// =============================================
// AUTH SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['regular_user', 'adopter', 'volunteer', 'ngo', 'shelter', 'city_pound']),
  // Organization fields (required for ngo, shelter, city_pound)
  organization_name: z.string().optional(),
  registration_number: z.string().optional(),
  organization_address: z.string().optional(),
  organization_city: z.string().optional(),
  organization_phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  // Organization roles require org name
  if (['ngo', 'shelter', 'city_pound'].includes(data.role)) {
    return !!data.organization_name && data.organization_name.length >= 3;
  }
  return true;
}, {
  message: 'Organization name is required (min 3 characters)',
  path: ['organization_name'],
}).refine((data) => {
  // Shelter and city_pound require registration number
  if (['shelter', 'city_pound'].includes(data.role)) {
    return !!data.registration_number && data.registration_number.length >= 5;
  }
  return true;
}, {
  message: 'Registration number is required',
  path: ['registration_number'],
});

// =============================================
// PROFILE SCHEMAS
// =============================================

export const adopterProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().nullable().optional(),
  phone: z.string().regex(/^09\d{9}$/, 'Invalid phone number (must be 11 digits starting with 09)'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'Province/Region is required'),
  zip_code: z.string().regex(/^\d{4}$/, 'Invalid ZIP code (must be 4 digits)'),
  occupation: z.string().min(1, 'Occupation is required'),
  income_range: z.string().min(1, 'Income range is required'),
  household_size: z.coerce.number().min(1, 'Household size must be at least 1'),
  has_children: z.boolean(),
  has_other_pets: z.boolean(),
  pet_experience: z.string().min(10, 'Please provide more details about your pet experience'),
  home_type: z.enum(['apartment', 'house', 'condo', 'other']),
  home_ownership: z.enum(['rent', 'own']),
  yard_size: z.string().optional(),
});

export const shelterProfileSchema = z.object({
  shelter_name: z.string().min(1, 'Shelter name is required'),
  description: z.string().min(20, 'Please provide a detailed description (at least 20 characters)'),
  phone: z.string().regex(/^09\d{9}$/, 'Invalid phone number (must be 11 digits starting with 09)'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'Province/Region is required'),
  zip_code: z.string().regex(/^\d{4}$/, 'Invalid ZIP code (must be 4 digits)'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  registration_number: z.string().min(1, 'Registration number is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').optional(),
});

export const updateUserProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  phone: z.string().regex(/^09\d{9}$/, 'Invalid phone number (must be 11 digits starting with 09)').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().regex(/^\d{4}$/, 'Invalid ZIP code (must be 4 digits)').optional().or(z.literal('')),
});

// =============================================
// PET SCHEMAS
// =============================================

export const petSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  age_years: z.coerce.number().min(0, 'Age must be positive').optional(),
  age_months: z.coerce.number().min(0).max(11, 'Months must be between 0 and 11').optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  size: z.enum(['small', 'medium', 'large', 'extra_large']),
  color: z.string().optional(),
  weight: z.coerce.number().min(0, 'Weight must be positive').optional(),
  is_vaccinated: z.boolean(),
  is_spayed_neutered: z.boolean(),
  medical_history: z.string().optional(),
  temperament: z.array(z.string()).min(1, 'Select at least one temperament'),
  good_with_kids: z.boolean().optional(),
  good_with_dogs: z.boolean().optional(),
  good_with_cats: z.boolean().optional(),
  energy_level: z.enum(['low', 'medium', 'high']),
  special_needs: z.string().optional(),
  adoption_fee: z.coerce.number().min(0, 'Adoption fee must be positive').optional(),
  description: z.string().min(20, 'Please provide a detailed description (at least 20 characters)'),
  tags: z.array(z.string()).optional(),
});

export const updatePetStatusSchema = z.object({
  status: z.enum(['available', 'pending', 'adopted']),
});

// =============================================
// POST SCHEMAS
// =============================================

export const lostPetSchema = z.object({
  pet_name: z.string().min(1, 'Pet name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  age_years: z.coerce.number().min(0, 'Age must be positive').optional(),
  color: z.string().min(1, 'Color is required'),
  last_seen_location: z.string().min(1, 'Last seen location is required'),
  last_seen_date: z.string().min(1, 'Last seen date is required'),
  reward: z.coerce.number().min(0, 'Reward must be positive').optional(),
  contact_phone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Invalid phone number'),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  description: z.string().min(20, 'Please provide a detailed description'),
});

export const eventSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  event_date: z.string().min(1, 'Event date is required'),
  end_date: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  event_type: z.enum(['adoption_drive', 'fundraiser', 'awareness', 'training', 'other']),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').optional(),
  registration_required: z.boolean(),
  registration_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().min(20, 'Please provide a detailed description'),
});

export const storySchema = z.object({
  story_text: z.string().min(50, 'Please share more details about your story (at least 50 characters)'),
  adoption_date: z.string().optional(),
});

export const feedPostSchema = z.object({
  description: z.string().min(1, 'Description is required').max(5000, 'Description is too long'),
  tags: z.array(z.string()).optional(),
});

// =============================================
// ADOPTION SCHEMAS
// =============================================

export const adoptionApplicationSchema = z.object({
  why_adopt: z.string().min(50, 'Please provide more details (at least 50 characters)'),
  previous_pet_experience: z.string().min(20, 'Please provide more details about your experience'),
  current_pets: z.string().min(10, 'Please describe your current pets or write "None"'),
  household_members: z.string().min(10, 'Please describe your household members'),
  work_schedule: z.string().min(10, 'Please describe your work schedule'),
  pet_care_plan: z.string().min(30, 'Please provide more details about your pet care plan'),
  emergency_plan: z.string().min(20, 'Please describe your emergency plan'),
  veterinarian_info: z.string().optional(),
  additional_notes: z.string().optional(),
});

export const updateAdoptionRequestSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  notes: z.string().optional(),
  rejection_reason: z.string().optional(),
});

// =============================================
// COMMENT SCHEMAS
// =============================================

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
  parent_comment_id: z.string().uuid().optional(),
});

// =============================================
// SEARCH & FILTER SCHEMAS
// =============================================

export const petFilterSchema = z.object({
  species: z.string().optional(),
  breed: z.string().optional(),
  size: z.string().optional(),
  gender: z.string().optional(),
  age_min: z.coerce.number().optional(),
  age_max: z.coerce.number().optional(),
  good_with_kids: z.boolean().optional(),
  good_with_dogs: z.boolean().optional(),
  good_with_cats: z.boolean().optional(),
  shelter_id: z.string().uuid().optional(),
  status: z.enum(['available', 'pending', 'adopted']).optional(),
});

export const postFilterSchema = z.object({
  post_type: z.enum(['adoptable', 'lost_pet', 'event', 'story', 'feed']).optional(),
  user_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// =============================================
// TYPE EXPORTS
// =============================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type AdopterProfileFormData = z.infer<typeof adopterProfileSchema>;
export type ShelterProfileFormData = z.infer<typeof shelterProfileSchema>;
export type PetFormData = z.infer<typeof petSchema>;
export type LostPetFormData = z.infer<typeof lostPetSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type StoryFormData = z.infer<typeof storySchema>;
export type FeedPostFormData = z.infer<typeof feedPostSchema>;
export type AdoptionApplicationFormData = z.infer<typeof adoptionApplicationSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type PetFilterFormData = z.infer<typeof petFilterSchema>;
export type PostFilterFormData = z.infer<typeof postFilterSchema>;
