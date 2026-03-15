'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { callApiAction } from '@/lib/api/action-client';
import { signUpSchema, type SignUpFormData } from '@/lib/validations';

// Role definitions with badges, descriptions, and requirements
const ROLES = [
  {
    value: 'regular_user',
    label: 'User',
    emoji: '👤',
    badge: '🌟 Community Member',
    description: 'Browse pets, attend events, like & follow shelters and NGOs',
    capabilities: [
      'View pet listings feed',
      'See and attend events',
      'Like & follow shelters/NGOs',
      'Apply as volunteer or adopter later',
      'Donate to shelters',
    ],
    requirements: [],
    isOrganization: false,
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    emoji: '🤝',
    badge: '💪 Volunteer Hero',
    description: 'Help at events and shelters as a verified volunteer',
    capabilities: [
      'All User capabilities',
      'Apply to volunteer at events',
      'Earn volunteer badges',
      'Track volunteer hours',
      'Get volunteer certification',
    ],
    requirements: [
      'Complete volunteer application',
      'Pass background verification',
    ],
    isOrganization: false,
  },
  {
    value: 'adopter',
    label: 'Adopter',
    emoji: '🏠',
    badge: '❤️ Pet Parent',
    description: 'Adopt pets and give them a loving home',
    capabilities: [
      'All User capabilities',
      'Submit adoption applications',
      'Track adoption status',
      'Access adopter resources',
      'Post adoption success stories',
    ],
    requirements: [
      'Complete adopter profile',
      'Home verification may be required',
    ],
    isOrganization: false,
  },
  {
    value: 'ngo',
    label: 'NGO',
    emoji: '🏛️',
    badge: '🌍 NGO Partner',
    description: 'Animal welfare organization hosting events',
    capabilities: [
      'Post and manage events',
      'Publish educational content',
      'Partner with shelters',
      'Recruit volunteers',
      'Promote advocacy campaigns',
    ],
    requirements: [
      'Organization name',
      'Verification documents (optional)',
    ],
    isOrganization: true,
  },
  {
    value: 'shelter',
    label: 'Shelter',
    emoji: '🏥',
    badge: '🐾 Shelter Partner',
    description: 'Animal shelter listing pets for adoption',
    capabilities: [
      'Post and manage pet listings',
      'Review adoption applications',
      'Post and manage events',
      'Accept donations',
      'Manage shelter profile',
    ],
    requirements: [
      'Organization name',
      'Registration number',
      'Verification required',
    ],
    isOrganization: true,
  },
  {
    value: 'dvmf',
    label: 'DVMF',
    emoji: '🏢',
    badge: '🛡️ Official Partner',
    description: 'Government animal welfare facility',
    capabilities: [
      'All Shelter capabilities',
      'View & manage animal reports',
      'Respond to welfare concerns',
      'Coordinate with authorities',
      'Access priority reports',
    ],
    requirements: [
      'Organization name',
      'DVMF registration number',
      'Government verification required',
    ],
    isOrganization: true,
  },
] as const;

type RoleValue = typeof ROLES[number]['value'];

export function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'role' | 'details'>('role');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'regular_user',
    },
  });

  const selectedRole = watch('role') as RoleValue;
  const selectedRoleInfo = ROLES.find(r => r.value === selectedRole);

  const handleRoleSelect = (role: RoleValue) => {
    setValue('role', role);
  };

  const handleContinue = async () => {
    const isValid = await trigger('role');
    if (isValid) {
      setStep('details');
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await callApiAction('auth', 'signUp', [data]);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        const routeMap: Record<string, string> = {
          regular_user: '/onboarding/user',
          volunteer: '/onboarding/volunteer',
          adopter: '/onboarding/adopter',
          ngo: '/onboarding/ngo',
          shelter: '/onboarding/shelter',
          dvmf: '/onboarding/dvmf',
        };
        setTimeout(() => router.push(routeMap[data.role] || '/onboarding/user'), 1000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">Account created successfully! Redirecting...</p>
        </div>
      )}

      {step === 'role' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose your role
            </label>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    selectedRole === role.value
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{role.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{role.label}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    {selectedRole === role.value && (
                      <div className="text-primary-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('role')} />
            {errors.role && (
              <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {selectedRoleInfo && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">What you can do:</h4>
                <ul className="mt-2 space-y-1">
                  {selectedRoleInfo.capabilities.map((cap, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {cap}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedRoleInfo.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Requirements:</h4>
                  <ul className="mt-2 space-y-1">
                    {selectedRoleInfo.requirements.map((req, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-primary-500">•</span> {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Continue as {selectedRoleInfo?.label}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setStep('role')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to role selection
          </button>

          <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg">
            <span className="text-2xl">{selectedRoleInfo?.emoji}</span>
            <span className="font-medium text-primary-800">{selectedRoleInfo?.label}</span>
            <span className="text-xs bg-primary-100 px-2 py-0.5 rounded-full text-primary-700">
              {selectedRoleInfo?.badge}
            </span>
          </div>

          {selectedRoleInfo?.isOrganization && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-medium text-blue-900">Organization Details</h3>
              
              <div>
                <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  {...register('organization_name')}
                  type="text"
                  id="organization_name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={selectedRole === 'dvmf' ? 'e.g., Manila DVMF' : 'e.g., Happy Paws Shelter'}
                  disabled={isLoading}
                />
                {errors.organization_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.organization_name.message}</p>
                )}
              </div>

              {['shelter', 'dvmf'].includes(selectedRole) && (
                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number *
                  </label>
                  <input
                    {...register('registration_number')}
                    type="text"
                    id="registration_number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={selectedRole === 'dvmf' ? 'DVMF Registration #' : 'SEC/DTI Registration #'}
                    disabled={isLoading}
                  />
                  {errors.registration_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.registration_number.message}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="organization_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  {...register('organization_phone')}
                  type="tel"
                  id="organization_phone"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="09123456789"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="johndoe"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </>
      )}
    </form>
  );
}
