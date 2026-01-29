
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Navbar } from '@/components/layout/Navbar';
import { ReportForm } from '@/components/forms/ReportForm';

export const metadata = {
  title: 'Report Animal Welfare Concern | Pawtopia',
  description: 'Report animal abuse, neglect, or injured animals to local authorities. Anonymous reporting available.',
};

export default async function ReportPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar user={user} />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="text-4xl font-bold mb-4">🚨 Report Animal Welfare Concern</h1>
            <p className="text-xl text-red-100 max-w-2xl mx-auto">
              Help protect animals in your community. Your report goes directly to 
              City Pound (DVMF) authorities who can investigate and take action.
            </p>
          </div>
        </div>

        {/* Important Info Banner */}
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <div className="bg-white rounded-xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔒</span>
              <div>
                <div className="font-semibold text-gray-900">Anonymous Option</div>
                <div className="text-sm text-gray-600">Your identity protected</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <div className="font-semibold text-gray-900">Fast Response</div>
                <div className="text-sm text-gray-600">Reports prioritized by urgency</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📍</span>
              <div>
                <div className="font-semibold text-gray-900">GPS Location</div>
                <div className="text-sm text-gray-600">Precise location tracking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Form */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <ReportForm isAuthenticated={!!user} />
          </div>
        </div>

        {/* Emergency Info */}
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-bold text-yellow-800 mb-2">🆘 Emergency Situations</h3>
            <p className="text-yellow-700 mb-4">
              If an animal is in immediate life-threatening danger, please also contact:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold">Local Animal Control</div>
                <div className="text-gray-600">Emergency hotline for your area</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold">Police (911)</div>
                <div className="text-gray-600">For violent or criminal situations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
