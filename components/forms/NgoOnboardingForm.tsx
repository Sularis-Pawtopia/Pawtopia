'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { callApiAction } from '@/lib/api/action-client';
import { notify } from '@/lib/ui/notify';
import { PageLoaderOverlay } from '@/components/ui/PageLoaderOverlay';

const ngoOnboardingSchema = z.object({
  organization_name: z.string().min(2, 'Organization name is required'),
  description: z.string().min(50, 'Please provide a detailed description (min 50 characters)'),
  registration_number: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zip_code: z.string().min(4, 'ZIP code is required'),
  service_areas: z.array(z.string()).min(1, 'Select at least one service area'),
});

type NgoFormData = z.infer<typeof ngoOnboardingSchema>;

const SERVICE_AREA_OPTIONS = [
  'Metro Manila',
  'Rizal',
  'Cavite',
  'Laguna',
  'Bulacan',
  'Batangas',
  'Pampanga',
  'Cebu',
  'Davao',
  'Nationwide',
];

interface NgoOnboardingFormProps {
  userId: string;
  existingOrgName?: string;
}

export function NgoOnboardingForm({ userId, existingOrgName }: NgoOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NgoFormData>({
    resolver: zodResolver(ngoOnboardingSchema),
    defaultValues: {
      organization_name: existingOrgName || '',
      service_areas: [],
    },
  });

  const toggleArea = (area: string) => {
    const updated = selectedAreas.includes(area)
      ? selectedAreas.filter((a) => a !== area)
      : [...selectedAreas, area];
    setSelectedAreas(updated);
    setValue('service_areas', updated);
  };

  const onSubmit = async (data: NgoFormData) => {
    setIsSubmitting(true);
    try {
      const result = await callApiAction('onboarding', 'submitNgoOnboarding', [userId, data]);
      if (result?.error) {
        notify.error({ title: 'Onboarding failed', description: result.error });
        console.error(result.error);
      } else {
        notify.success({ title: 'Registration complete', description: 'Your NGO profile has been submitted.' });
        if (typeof result?.redirectTo === 'string') {
          window.location.href = result.redirectTo;
        }
      }
    } catch (error) {
      notify.error({ title: 'Onboarding failed', description: 'Failed to submit NGO onboarding form.' });
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && <PageLoaderOverlay label="Submitting registration..." />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Organization Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="organization_name">
            Organization Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organization_name"
            {...register('organization_name')}
            placeholder="Your NGO name"
          />
          {errors.organization_name && (
            <p className="text-red-500 text-sm">{errors.organization_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            About Your Organization <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Tell us about your organization's mission, activities, and impact..."
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registration_number">SEC/DTI Registration Number</Label>
            <Input
              id="registration_number"
              {...register('registration_number')}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://yourorganization.org"
            />
            {errors.website && (
              <p className="text-red-500 text-sm">{errors.website.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Service Areas */}
      <div className="space-y-2">
        <Label>Service Areas <span className="text-red-500">*</span></Label>
        <p className="text-sm text-gray-500">Select areas where your organization operates</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_AREA_OPTIONS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedAreas.includes(area)
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        {errors.service_areas && (
          <p className="text-red-500 text-sm">{errors.service_areas.message}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
            <Input id="phone" {...register('phone')} placeholder="09XX XXX XXXX" />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input id="email" {...register('email')} placeholder="contact@yourorg.org" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
          <Input id="address" {...register('address')} placeholder="Street address" />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
            <Input id="city" {...register('city')} placeholder="City" />
            {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Province <span className="text-red-500">*</span></Label>
            <Input id="state" {...register('state')} placeholder="Metro Manila" />
            {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">ZIP Code <span className="text-red-500">*</span></Label>
            <Input id="zip_code" {...register('zip_code')} placeholder="1234" />
            {errors.zip_code && <p className="text-red-500 text-sm">{errors.zip_code.message}</p>}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Complete Registration'}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        Your organization will be verified by our team. You can start posting events immediately.
      </p>
      </form>
    </>
  );
}
