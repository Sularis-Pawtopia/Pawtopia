import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { CityPoundOnboardingForm } from '@/components/forms/CityPoundOnboardingForm';
import { createClient } from '@/lib/supabase/server';

export default async function CityPoundOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get existing organization info if set during signup
  const supabase = await createClient();
  const { data: orgProfile } = await supabase
    .from('organization_profiles')
    .select('organization_name, registration_number')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            City Pound / DVMF Registration
          </h1>
          <p className="text-gray-600">
            Complete your official facility profile to access animal welfare reports
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <span className="mr-1">🛡️</span> Official Partner Badge
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <CityPoundOnboardingForm 
            userId={user.id}
            existingOrgName={orgProfile?.organization_name}
            existingRegNumber={orgProfile?.registration_number}
          />
        </div>
      </div>
    </div>
  );
}
