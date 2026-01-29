'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitRegularUserOnboarding } from '@/lib/actions/onboarding.actions';

const regularUserSchema = z.object({
  phone: z.string().min(11, 'Please enter a valid 11-digit phone number').max(11, 'Phone number must be exactly 11 digits').optional().or(z.literal('')),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'Province/Region is required'),
  bio: z.string().min(10, 'Please provide at least 10 characters about yourself').max(500, 'Bio must be 500 characters or less'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  notificationPreferences: z.object({
    adoptionAlerts: z.boolean(),
    eventUpdates: z.boolean(),
    communityPosts: z.boolean(),
    lostPetAlerts: z.boolean(),
  }),
});

type RegularUserFormData = z.infer<typeof regularUserSchema>;

const INTEREST_OPTIONS = [
  { value: 'adoption', label: '🐾 Pet Adoption', description: 'Find your perfect companion' },
  { value: 'volunteering', label: '💪 Volunteering', description: 'Help shelters and events' },
  { value: 'donations', label: '💝 Donations', description: 'Support animal welfare' },
  { value: 'education', label: '📚 Education', description: 'Learn about pet care' },
  { value: 'community', label: '👥 Community', description: 'Connect with pet lovers' },
  { value: 'lost_pets', label: '🔍 Lost Pets', description: 'Help reunite pets with owners' },
  { value: 'events', label: '🎉 Events', description: 'Attend adoption events' },
  { value: 'advocacy', label: '📢 Advocacy', description: 'Promote animal welfare' },
];

interface RegularUserOnboardingFormProps {
  userId: string;
}

export function RegularUserOnboardingForm({ userId }: RegularUserOnboardingFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegularUserFormData>({
    resolver: zodResolver(regularUserSchema),
    defaultValues: {
      phone: '',
      city: '',
      state: '',
      bio: '',
      interests: [],
      notificationPreferences: {
        adoptionAlerts: true,
        eventUpdates: true,
        communityPosts: false,
        lostPetAlerts: true,
      },
    },
  });

  const selectedInterests = watch('interests');

  const toggleInterest = (interest: string) => {
    const current = selectedInterests || [];
    if (current.includes(interest)) {
      setValue('interests', current.filter((i) => i !== interest));
    } else {
      setValue('interests', [...current, interest]);
    }
  };

  const onSubmit = async (data: RegularUserFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await submitRegularUserOnboarding(userId, {
        phone: data.phone || null,
        city: data.city,
        state: data.state,
        bio: data.bio,
        interests: data.interests,
        notification_preferences: data.notificationPreferences,
      });

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

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          About You <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('bio')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Tell us a bit about yourself and why you love animals..."
        />
        {errors.bio && (
          <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
        )}
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What interests you? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest.value}
              type="button"
              onClick={() => toggleInterest(interest.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedInterests?.includes(interest.value)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{interest.label}</div>
              <div className="text-xs text-gray-500">{interest.description}</div>
            </button>
          ))}
        </div>
        {errors.interests && (
          <p className="text-red-500 text-sm mt-1">{errors.interests.message}</p>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('city')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="e.g., Makati"
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Province/Region <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('state')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="e.g., Metro Manila"
          />
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
          )}
        </div>
      </div>

      {/* Phone (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="tel"
          {...register('phone')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="09171234567"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Notification Preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Notification Preferences
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('notificationPreferences.adoptionAlerts')}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm">🐾 Adoption alerts for pets matching my interests</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('notificationPreferences.eventUpdates')}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm">🎉 Updates about adoption events near me</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('notificationPreferences.lostPetAlerts')}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm">🔍 Lost pet alerts in my area</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('notificationPreferences.communityPosts')}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm">👥 Community posts and discussions</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Setting up your profile...
          </>
        ) : (
          <>
            Complete Setup
            <span>→</span>
          </>
        )}
      </button>
    </form>
  );
}
