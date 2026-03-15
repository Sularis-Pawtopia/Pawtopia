// =============================================
// PAWTOPIA EXPANDED VALIDATORS
// Zod schemas for reports, volunteers, education
// =============================================

import { z } from 'zod';

// =============================================
// ENUMS AS ZOD SCHEMAS
// =============================================

export const reportTypeSchema = z.enum([
  'abuse',
  'neglect',
  'stray',
  'injured',
  'hoarding',
  'illegal_breeding',
  'abandoned',
  'other'
]);

export const reportStatusSchema = z.enum([
  'pending',
  'under_review',
  'investigating',
  'action_taken',
  'resolved',
  'closed',
  'referred'
]);

export const urgencyLevelSchema = z.enum(['low', 'normal', 'high', 'critical']);

export const volunteerStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'suspended'
]);

export const organizationTypeSchema = z.enum(['ngo', 'dvmf']);

export const contentTypeSchema = z.enum([
  'article',
  'guide',
  'announcement',
  'seminar',
  'infographic'
]);

export const experienceLevelSchema = z.enum(['none', 'some', 'experienced']);

// =============================================
// REPORT SCHEMAS
// =============================================

export const reportFormSchema = z.object({
  report_type: reportTypeSchema,
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(20, 'Please provide a detailed description (at least 20 characters)')
    .max(5000, 'Description must be less than 5000 characters'),
  is_anonymous: z.boolean().default(false),
  
  // Location
  location_address: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().optional(),
  location_zip: z.string().optional(),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  location_notes: z.string().max(500).optional(),
  
  // Animal details
  animal_species: z.string().optional(),
  animal_breed: z.string().optional(),
  animal_color: z.string().optional(),
  animal_count: z.number().int().min(1).max(100).default(1),
  animal_condition: z.string().max(500).optional(),
  
  // Urgency
  urgency_level: urgencyLevelSchema.default('normal'),
  
  // Contact for anonymous reports (optional)
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
});

export const reportUpdateSchema = z.object({
  status: reportStatusSchema.optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  resolution_notes: z.string().max(2000).optional(),
  urgency_level: urgencyLevelSchema.optional(),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;
export type ReportUpdateValues = z.infer<typeof reportUpdateSchema>;

// =============================================
// VOLUNTEER SCHEMAS
// =============================================

export const volunteerApplicationSchema = z.object({
  application_reason: z.string()
    .min(50, 'Please explain why you want to volunteer (at least 50 characters)')
    .max(2000, 'Application reason must be less than 2000 characters'),
  
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  
  availability: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }).refine(
    (data) => Object.values(data).some(Boolean),
    'Please select at least one day of availability'
  ),
  
  preferred_activities: z.array(z.string()).default([]),
  
  emergency_contact_name: z.string()
    .min(2, 'Emergency contact name is required'),
  
  emergency_contact_phone: z.string()
    .min(10, 'Please enter a valid phone number'),
  
  has_vehicle: z.boolean().default(false),
  can_handle_animals: z.boolean().default(true),
  experience_level: experienceLevelSchema.default('none'),
});

export const volunteerReviewSchema = z.object({
  status: volunteerStatusSchema,
  rejection_reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type VolunteerApplicationValues = z.infer<typeof volunteerApplicationSchema>;
export type VolunteerReviewValues = z.infer<typeof volunteerReviewSchema>;

// =============================================
// ORGANIZATION SCHEMAS
// =============================================

export const organizationApplicationSchema = z.object({
  organization_type: organizationTypeSchema,
  organization_name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be less than 200 characters'),
  registration_number: z.string().optional(),
  description: z.string()
    .min(50, 'Please provide a description (at least 50 characters)')
    .max(2000, 'Description must be less than 2000 characters'),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip_code: z.string().min(4, 'ZIP code is required'),
  service_areas: z.array(z.string()).default([]),
});

export const organizationVerificationSchema = z.object({
  verification_status: z.enum(['verified', 'rejected', 'suspended']),
  rejection_reason: z.string().max(500).optional(),
});

export type OrganizationApplicationValues = z.infer<typeof organizationApplicationSchema>;
export type OrganizationVerificationValues = z.infer<typeof organizationVerificationSchema>;

// =============================================
// EDUCATIONAL CONTENT SCHEMAS
// =============================================

export const educationalContentSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  summary: z.string().max(500).optional(),
  content: z.string()
    .min(100, 'Content must be at least 100 characters'),
  content_type: contentTypeSchema.default('article'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
  
  // For seminars/events
  event_date: z.string().datetime().optional(),
  event_location: z.string().optional(),
  registration_url: z.string().url().optional().or(z.literal('')),
});

export type EducationalContentValues = z.infer<typeof educationalContentSchema>;

// =============================================
// EVENT VOLUNTEER SCHEMAS
// =============================================

export const eventVolunteerApplicationSchema = z.object({
  event_id: z.string().uuid(),
  application_message: z.string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
});

export const eventVolunteerReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional(),
});

export const eventVolunteerCheckInSchema = z.object({
  check_in_time: z.string().datetime(),
});

export const eventVolunteerCheckOutSchema = z.object({
  check_out_time: z.string().datetime(),
  hours_logged: z.number().min(0).max(24),
});

export type EventVolunteerApplicationValues = z.infer<typeof eventVolunteerApplicationSchema>;
export type EventVolunteerReviewValues = z.infer<typeof eventVolunteerReviewSchema>;

// =============================================
// ENHANCED EVENT SCHEMA
// =============================================

export const volunteerEventSchema = z.object({
  event_name: z.string().min(3, 'Event name is required'),
  event_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  location: z.string().min(5, 'Location is required'),
  event_type: z.string().optional(),
  description: z.string().min(20, 'Description is required'),
  capacity: z.number().int().min(1).optional(),
  is_volunteer_event: z.boolean().default(false),
  volunteers_needed: z.number().int().min(0).default(0),
  requirements: z.array(z.string()).default([]),
  is_public: z.boolean().default(true),
});

export type VolunteerEventValues = z.infer<typeof volunteerEventSchema>;

// =============================================
// COMMON SKILL OPTIONS
// =============================================

export const VOLUNTEER_SKILLS = [
  'Animal handling',
  'Dog walking',
  'Cat care',
  'Medical/Veterinary',
  'Transportation',
  'Photography',
  'Social media',
  'Event planning',
  'Fundraising',
  'Administrative',
  'Construction/Repair',
  'Cleaning',
  'Fostering',
  'Training',
  'Grooming',
  'Other',
] as const;

export const VOLUNTEER_ACTIVITIES = [
  'Shelter cleaning',
  'Animal feeding',
  'Dog walking',
  'Cat socialization',
  'Adoption events',
  'Fundraising events',
  'Transport animals',
  'Photography',
  'Administrative work',
  'Facility maintenance',
  'Foster care',
  'Community outreach',
  'Veterinary assistance',
] as const;

export const REPORT_CATEGORIES = [
  { value: 'abuse', label: '🚨 Animal Abuse', description: 'Physical harm, cruelty, or violence towards animals' },
  { value: 'neglect', label: '⚠️ Neglect', description: 'Failure to provide food, water, shelter, or basic care' },
  { value: 'stray', label: '🐕 Stray Animal', description: 'Stray or lost animal in need of rescue' },
  { value: 'injured', label: '🩹 Injured Animal', description: 'Animal in need of medical attention' },
  { value: 'hoarding', label: '🏠 Animal Hoarding', description: 'Excessive number of animals kept in poor conditions' },
  { value: 'illegal_breeding', label: '🔒 Illegal Breeding', description: 'Unlicensed or illegal animal breeding operation' },
  { value: 'abandoned', label: '💔 Abandoned', description: 'Animal left behind or abandoned by owner' },
  { value: 'other', label: '📋 Other', description: 'Other animal welfare concerns' },
] as const;
