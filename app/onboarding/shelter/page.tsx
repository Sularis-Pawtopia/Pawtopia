import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { ShelterOnboardingForm } from '@/components/forms/ShelterOnboardingForm';

export default async function ShelterOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if already has shelter profile
  // If yes, redirect to shelter dashboard
  // This check would be done in the form component or server action

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Shelter Profile
          </h1>
          <p className="text-gray-600">
            Tell us about your shelter to start listing pets for adoption
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <ShelterOnboardingForm />
        </div>
      </div>
    </div>
  );
}
