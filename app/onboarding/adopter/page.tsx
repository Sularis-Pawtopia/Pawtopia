import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { AdopterOnboardingForm } from '@/components/forms/AdopterOnboardingForm';

export default async function AdopterOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Tell us about yourself to start your adoption journey
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <AdopterOnboardingForm />
        </div>
      </div>
    </div>
  );
}
