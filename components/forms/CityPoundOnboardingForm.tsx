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

const cityPoundOnboardingSchema = z.object({
  organization_name: z.string().min(2, 'Organization name is required'),
  description: z.string().min(50, 'Please provide a detailed description (min 50 characters)'),
  registration_number: z.string().min(5, 'DVMF Registration number is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zip_code: z.string().min(4, 'ZIP code is required'),
  capacity: z.number().min(1, 'Capacity is required'),
  service_areas: z.array(z.string()).min(1, 'Select at least one service area'),
});

type CityPoundFormData = z.infer<typeof cityPoundOnboardingSchema>;

const SERVICE_AREA_OPTIONS = [
  'Manila',
  'Quezon City',
  'Makati',
  'Pasig',
  'Taguig',
  'Pasay',
  'Parañaque',
  'Las Piñas',
  'Muntinlupa',
  'Marikina',
  'San Juan',
  'Mandaluyong',
  'Caloocan',
  'Malabon',
  'Navotas',
  'Valenzuela',
];

interface CityPoundOnboardingFormProps {
  userId: string;
  existingOrgName?: string;
  existingRegNumber?: string;
}

export function CityPoundOnboardingForm({ 
  userId, 
  existingOrgName,
  existingRegNumber 
}: CityPoundOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CityPoundFormData>({
    resolver: zodResolver(cityPoundOnboardingSchema),
    defaultValues: {
      organization_name: existingOrgName || '',
      registration_number: existingRegNumber || '',
      service_areas: [],
      capacity: 50,
    },
  });

  const toggleArea = (area: string) => {
    const updated = selectedAreas.includes(area)
      ? selectedAreas.filter((a) => a !== area)
      : [...selectedAreas, area];
    setSelectedAreas(updated);
    setValue('service_areas', updated);
  };

  const onSubmit = async (data: CityPoundFormData) => {
    setIsSubmitting(true);
    try {
      const result = await callApiAction('onboarding', 'submitCityPoundOnboarding', [userId, data]);
      if (result?.error) {
        notify.error({ title: 'Onboarding failed', description: result.error });
        console.error(result.error);
      } else {
        notify.success({ title: 'Registration complete', description: 'Your DVMF profile has been submitted.' });
      }
    } catch (error) {
      notify.error({ title: 'Onboarding failed', description: 'Failed to submit city pound onboarding form.' });
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && <PageLoaderOverlay label="Submitting registration..." />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Facility Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Facility Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="organization_name">
            Facility Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organization_name"
            {...register('organization_name')}
            placeholder="e.g., Manila City Veterinary Office - Animal Pound"
          />
          {errors.organization_name && (
            <p className="text-red-500 text-sm">{errors.organization_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_number">
            DVMF Registration Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="registration_number"
            {...register('registration_number')}
            placeholder="e.g., DVMF-NCR-2024-001"
          />
          {errors.registration_number && (
            <p className="text-red-500 text-sm">{errors.registration_number.message}</p>
          )}
          <p className="text-sm text-gray-500">
            Your official registration with the Department of Veterinary Medicine and Fisheries
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            About Your Facility <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Describe your facility, services offered, and animal welfare programs..."
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">
            Animal Capacity <span className="text-red-500">*</span>
          </Label>
          <Input
            id="capacity"
            type="number"
            {...register('capacity', { valueAsNumber: true })}
            placeholder="Maximum number of animals"
          />
          {errors.capacity && (
            <p className="text-red-500 text-sm">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      {/* Service Areas */}
      <div className="space-y-2">
        <Label>Jurisdiction/Service Areas <span className="text-red-500">*</span></Label>
        <p className="text-sm text-gray-500">Select cities/municipalities under your jurisdiction</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_AREA_OPTIONS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedAreas.includes(area)
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
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
            <Input id="phone" {...register('phone')} placeholder="(02) XXXX-XXXX" />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Official Email <span className="text-red-500">*</span></Label>
            <Input id="email" {...register('email')} placeholder="vetoffice@city.gov.ph" />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
          <Input id="address" {...register('address')} placeholder="Official address" />
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
            <Input id="zip_code" {...register('zip_code')} placeholder="1000" />
            {errors.zip_code && <p className="text-red-500 text-sm">{errors.zip_code.message}</p>}
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Official Partner Benefits:</strong> As a verified city pound/DVMF partner, 
          you&apos;ll have access to animal welfare reports in your jurisdiction and can coordinate 
          with other shelters and NGOs on the platform.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Complete Registration'}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        Your facility will be verified by our team. This typically takes 1-2 business days.
      </p>
      </form>
    </>
  );
}
