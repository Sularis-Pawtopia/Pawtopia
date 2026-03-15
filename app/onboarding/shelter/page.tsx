import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { ShelterOnboardingForm } from '@/components/forms/ShelterOnboardingForm';

export default async function ShelterOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.is_verified) {
    redirect('/shelter');
  }

  if (user.role !== 'shelter') {
    const roleOnboardingRoute: Record<string, string> = {
      regular_user: '/onboarding/user',
      volunteer: '/onboarding/volunteer',
      adopter: '/onboarding/adopter',
      ngo: '/onboarding/ngo',
      dvmf: '/onboarding/dvmf',
    };
    redirect(roleOnboardingRoute[user.role] || '/onboarding/user');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-3">
            <span className="text-2xl">🐾</span>
          </div>
          <p className="text-sm text-primary-600">
            Create an account in order to gain access to Pawtopia.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <ShelterOnboardingForm />
        </div>
      </div>
    </div>
  );
}
