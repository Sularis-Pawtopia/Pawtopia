'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitVolunteerOnboarding } from '@/lib/actions/onboarding.actions';

const volunteerOnboardingSchema = z.object({
  application_reason: z.string().min(50, 'Please tell us more about why you want to volunteer (min 50 characters)'),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  preferred_activities: z.array(z.string()).min(1, 'Select at least one preferred activity'),
  experience_level: z.enum(['none', 'some', 'experienced']),
  has_vehicle: z.boolean(),
  can_handle_animals: z.boolean(),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Valid phone number required'),
  availability: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
});

type VolunteerFormData = z.infer<typeof volunteerOnboardingSchema>;

const SKILL_OPTIONS = [
  'Dog walking',
  'Cat care',
  'Animal grooming',
  'Pet photography',
  'Social media',
  'Event planning',
  'Fundraising',
  'Administrative work',
  'Transportation',
  'Medical/Vet experience',
  'Training animals',
  'Foster care',
];

const ACTIVITY_OPTIONS = [
  'Dog walking',
  'Cat socialization',
  'Adoption events',
  'Photography',
  'Community outreach',
  'Shelter cleaning',
  'Animal transport',
  'Fostering',
  'Administrative support',
  'Fundraising events',
  'Education programs',
];

interface VolunteerOnboardingFormProps {
  userId: string;
}

export function VolunteerOnboardingForm({ userId }: VolunteerOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerOnboardingSchema),
    defaultValues: {
      has_vehicle: false,
      can_handle_animals: true,
      experience_level: 'none',
      skills: [],
      preferred_activities: [],
      availability: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    },
  });

  const availability = watch('availability');

  const toggleSkill = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    setValue('skills', updated);
  };

  const toggleActivity = (activity: string) => {
    const updated = selectedActivities.includes(activity)
      ? selectedActivities.filter((a) => a !== activity)
      : [...selectedActivities, activity];
    setSelectedActivities(updated);
    setValue('preferred_activities', updated);
  };

  const toggleDay = (day: keyof typeof availability) => {
    setValue(`availability.${day}`, !availability[day]);
  };

  const onSubmit = async (data: VolunteerFormData) => {
    setIsSubmitting(true);
    try {
      const result = await submitVolunteerOnboarding(userId, data);
      if (result?.error) {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Why do you want to volunteer? */}
      <div className="space-y-2">
        <Label htmlFor="application_reason">
          Why do you want to volunteer? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="application_reason"
          {...register('application_reason')}
          placeholder="Tell us about your passion for animals and why you want to help..."
          rows={4}
        />
        {errors.application_reason && (
          <p className="text-red-500 text-sm">{errors.application_reason.message}</p>
        )}
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <Label>Experience with Animals</Label>
        <Select
          onValueChange={(value) => setValue('experience_level', value as any)}
          defaultValue="none"
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No prior experience</SelectItem>
            <SelectItem value="some">Some experience (pet owner, occasional volunteering)</SelectItem>
            <SelectItem value="experienced">Experienced (regular volunteering, professional)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label>Your Skills <span className="text-red-500">*</span></Label>
        <p className="text-sm text-gray-500">Select all skills that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SKILL_OPTIONS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedSkills.includes(skill)
                  ? 'bg-orange-100 border-orange-500 text-orange-700'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
        {errors.skills && (
          <p className="text-red-500 text-sm">{errors.skills.message}</p>
        )}
      </div>

      {/* Preferred Activities */}
      <div className="space-y-2">
        <Label>Preferred Activities <span className="text-red-500">*</span></Label>
        <p className="text-sm text-gray-500">What would you like to help with?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ACTIVITY_OPTIONS.map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => toggleActivity(activity)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedActivities.includes(activity)
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {activity}
            </button>
          ))}
        </div>
        {errors.preferred_activities && (
          <p className="text-red-500 text-sm">{errors.preferred_activities.message}</p>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <Label>Availability</Label>
        <p className="text-sm text-gray-500">Select days you&apos;re typically available</p>
        <div className="flex flex-wrap gap-2">
          {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(
            (day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors capitalize ${
                  availability[day]
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_vehicle"
            onCheckedChange={(checked) => setValue('has_vehicle', !!checked)}
          />
          <Label htmlFor="has_vehicle" className="font-normal">
            I have access to a vehicle for transport
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="can_handle_animals"
            defaultChecked
            onCheckedChange={(checked) => setValue('can_handle_animals', !!checked)}
          />
          <Label htmlFor="can_handle_animals" className="font-normal">
            I&apos;m comfortable handling animals directly
          </Label>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact Name <span className="text-red-500">*</span></Label>
            <Input
              id="emergency_contact_name"
              {...register('emergency_contact_name')}
              placeholder="Full name"
            />
            {errors.emergency_contact_name && (
              <p className="text-red-500 text-sm">{errors.emergency_contact_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Contact Phone <span className="text-red-500">*</span></Label>
            <Input
              id="emergency_contact_phone"
              {...register('emergency_contact_phone')}
              placeholder="09XX XXX XXXX"
            />
            {errors.emergency_contact_phone && (
              <p className="text-red-500 text-sm">{errors.emergency_contact_phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">Your Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
            <Input id="phone" {...register('phone')} placeholder="09XX XXX XXXX" />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
            <Input id="city" {...register('city')} placeholder="Your city" />
            {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
          <Input id="address" {...register('address')} placeholder="Street address" />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province <span className="text-red-500">*</span></Label>
          <Input id="state" {...register('state')} placeholder="Metro Manila" />
          {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting Application...' : 'Submit Volunteer Application'}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        Your application will be reviewed by our team. You&apos;ll receive a notification once approved.
      </p>
    </form>
  );
}
