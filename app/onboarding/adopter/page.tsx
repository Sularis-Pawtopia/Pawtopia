import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { AdopterOnboardingForm } from '@/components/forms/AdopterOnboardingForm';

export default async function AdopterOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.is_verified) {
    redirect('/dashboard');
  }

  if (user.role !== 'adopter') {
    const roleOnboardingRoute: Record<string, string> = {
      regular_user: '/onboarding/user',
      volunteer: '/onboarding/volunteer',
      ngo: '/onboarding/ngo',
      shelter: '/onboarding/shelter',
      dvmf: '/onboarding/dvmf',
    };
    redirect(roleOnboardingRoute[user.role] || '/onboarding/user');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <AdopterOnboardingForm />
        </div>
      </div>
    </div>
  );
}
