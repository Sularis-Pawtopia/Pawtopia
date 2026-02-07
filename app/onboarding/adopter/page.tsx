import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { AdopterOnboardingForm } from '@/components/forms/AdopterOnboardingForm';

export default async function AdopterOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
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
