import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { RegularUserOnboardingForm } from '@/components/forms/RegularUserOnboardingForm';

export default async function RegularUserOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.is_verified) {
    redirect('/dashboard');
  }

  if (user.role !== 'regular_user') {
    const roleOnboardingRoute: Record<string, string> = {
      volunteer: '/onboarding/volunteer',
      adopter: '/onboarding/adopter',
      ngo: '/onboarding/ngo',
      shelter: '/onboarding/shelter',
      dvmf: '/onboarding/dvmf',
    };
    redirect(roleOnboardingRoute[user.role] || '/onboarding/user');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌟</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Pawtopia!
          </h1>
          <p className="text-gray-600">
            Let&apos;s set up your profile so we can personalize your experience
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <span className="mr-1">🎉</span> Join our community of animal lovers
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <RegularUserOnboardingForm userId={user.id} />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>As a community member, you can:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded">🔍 Browse adoptable pets</span>
            <span className="px-2 py-1 bg-gray-100 rounded">🎉 Attend events</span>
            <span className="px-2 py-1 bg-gray-100 rounded">💬 Join discussions</span>
            <span className="px-2 py-1 bg-gray-100 rounded">🔔 Get alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
