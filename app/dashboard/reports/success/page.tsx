import Link from 'next/link';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export const metadata = {
  title: 'Report Submitted | Pawtopia',
  description: 'Your animal welfare report has been submitted successfully',
};

export default async function ReportSuccessPage() {
  const user = await getCurrentUser();

  return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4 py-12">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Report Submitted Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for reporting. Your report has been received and will be reviewed by our team. 
            {user ? ' You can track the status of your report in your dashboard.' : ' If you provided contact information, we may reach out for more details.'}
          </p>

          {/* Info Cards */}
          <div className="grid gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-medium text-gray-900">Under Review</h3>
              <p className="text-sm text-gray-500">Our team will assess the urgency and take action</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-2xl mb-2">📞</div>
              <h3 className="font-medium text-gray-900">We May Contact You</h3>
              <p className="text-sm text-gray-500">For critical cases, we may reach out for more information</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/report"
              className="px-6 py-3 text-orange-600 bg-orange-50 rounded-full font-medium hover:bg-orange-100 transition"
            >
              Submit Another Report
            </Link>
            {user ? (
              <Link
                href="/dashboard/reports"
                className="px-6 py-3 text-white bg-orange-500 rounded-full font-medium hover:bg-orange-600 transition"
              >
                View My Reports
              </Link>
            ) : (
              <Link
                href="/"
                className="px-6 py-3 text-white bg-orange-500 rounded-full font-medium hover:bg-orange-600 transition"
              >
                Back to Home
              </Link>
            )}
          </div>

          {/* Emergency Note */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>🚨 Emergency?</strong> If an animal is in immediate danger, please call your local authorities or emergency services.
            </p>
          </div>
        </div>
      </div>
  );
}
