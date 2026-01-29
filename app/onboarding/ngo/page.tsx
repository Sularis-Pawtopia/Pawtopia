import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { NgoOnboardingForm } from '@/components/forms/NgoOnboardingForm';
import { createClient } from '@/lib/supabase/server';

export default async function NgoOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get existing organization name if set during signup
  const supabase = await createClient();
  const { data: orgProfile } = await supabase
    .from('organization_profiles')
    .select('organization_name')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your NGO Profile
          </h1>
          <p className="text-gray-600">
            Tell us about your organization to start advocating for animal welfare
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <span className="mr-1">🌍</span> NGO Partner Badge
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <NgoOnboardingForm 
            userId={user.id} 
            existingOrgName={orgProfile?.organization_name}
          />
        </div>
      </div>
    </div>
  );
}
