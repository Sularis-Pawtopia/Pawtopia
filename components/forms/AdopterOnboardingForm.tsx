'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitAdopterOnboarding } from '@/lib/actions/onboarding.actions';

const adopterSchema = z.object({
  phone: z.string().min(11, 'Please enter a valid 11-digit phone number').max(11, 'Phone number must be exactly 11 digits'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'Province/Region is required'),
  zipCode: z.string().min(4, 'ZIP code must be 4 digits').max(4, 'ZIP code must be 4 digits'),
  occupation: z.string().optional(),
  housingType: z.enum(['house', 'apartment', 'condo', 'other']),
  hasYard: z.boolean(),
  hasPets: z.boolean(),
  bio: z.string().min(20, 'Please provide at least 20 characters'),
});

type AdopterFormData = z.infer<typeof adopterSchema>;

export function AdopterOnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdopterFormData>({
    resolver: zodResolver(adopterSchema),
    defaultValues: {
      hasYard: false,
      hasPets: false,
      housingType: 'apartment',
    },
  });

  const onSubmit = async (data: AdopterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const names = (user.user_metadata?.full_name || '').split(' ');
      
      const result = await submitAdopterOnboarding(
        user.id,
        {
          first_name: names[0] || '',
          last_name: names.slice(1).join(' ') || '',
          date_of_birth: null,
          occupation: data.occupation || '',
          income_range: '',
          household_size: 1,
          has_children: false,
          has_other_pets: data.hasPets,
          pet_experience: '',
          home_type: data.housingType,
          home_ownership: 'rent',
          yard_size: data.hasYard ? 'medium' : 'none',
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
        },
        {
          home_photos: [],
          valid_ids: [],
        }
      );

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone *
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="09171234567"
            maxLength={11}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation
          </label>
          <input
            {...register('occupation')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Software Engineer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <input
          {...register('address')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="123 Main Street"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            {...register('city')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Cebu City"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Province/Region *
          </label>
          <input
            {...register('state')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Cebu"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code *
          </label>
          <input
            {...register('zipCode')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="6000"
            maxLength={4}
          />
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Housing Type *
        </label>
        <select
          {...register('housingType')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="condo">Condo</option>
          <option value="other">Other</option>
        </select>
        {errors.housingType && (
          <p className="mt-1 text-sm text-red-600">{errors.housingType.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-center">
          <input
            {...register('hasYard')}
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">I have a yard</span>
        </label>

        <label className="flex items-center">
          <input
            {...register('hasPets')}
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">I currently have pets</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About You *
        </label>
        <textarea
          {...register('bio')}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Tell us about yourself, your experience with pets, and why you want to adopt..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Creating Profile...' : 'Complete Setup'}
      </button>
    </form>
  );
}
