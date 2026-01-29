import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { VolunteerOnboardingForm } from '@/components/forms/VolunteerOnboardingForm';

export default async function VolunteerOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💪</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a Volunteer Hero
          </h1>
          <p className="text-gray-600">
            Tell us about yourself and how you&apos;d like to help animals in need
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
            <span className="mr-1">🏅</span> Earn the Volunteer Hero badge
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <VolunteerOnboardingForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}
