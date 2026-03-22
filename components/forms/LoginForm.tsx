'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { callApiAction } from '@/lib/api/action-client';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { notify } from '@/lib/ui/notify';
import { PageLoaderOverlay } from '@/components/ui/PageLoaderOverlay';

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    const normalized = error.trim();
    if (!normalized || normalized === '{}' || normalized === '[object Object]') {
      return fallback;
    }
    return normalized;
  }

  if (typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      const normalized = message.trim();
      if (normalized && normalized !== '{}' && normalized !== '[object Object]') {
        return normalized;
      }
    }

    const nested = (error as { error?: unknown }).error;
    if (typeof nested === 'string') {
      const normalized = nested.trim();
      if (normalized && normalized !== '{}' && normalized !== '[object Object]') {
        return normalized;
      }
    }
  }

  return fallback;
}

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await callApiAction<{ redirectTo?: string }>('auth', 'login', [data]);
      
      if (result?.error) {
        const message = getApiErrorMessage(result.error, 'Unable to sign in. Please check your email and password.');
        setError(message);
        notify.error({ title: 'Sign in failed', description: message });
        setIsLoading(false);
        return;
      }

      if (result?.success === false) {
        const message = 'Unable to sign in right now. Please try again.';
        setError(message);
        notify.error({ title: 'Sign in failed', description: message });
        setIsLoading(false);
        return;
      }

      const redirectTo = typeof result.redirectTo === 'string' ? result.redirectTo : '/dashboard';
      notify.success({ title: 'Signed in', description: 'Welcome back to Pawtopia.' });
      router.push(redirectTo);
      router.refresh();
      return;
    } catch (err: unknown) {
      const message = 'An unexpected error occurred';
      setError(message);
      notify.error({ title: 'Sign in failed', description: message });
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <PageLoaderOverlay label="Signing you in..." />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="your.email@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center">
        <a href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
          Forgot password?
        </a>
      </div>
      </form>
    </>
  );
}
