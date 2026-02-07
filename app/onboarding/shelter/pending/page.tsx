import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export default async function ShelterPendingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // If already verified, go straight to shelter dashboard
  if (user.is_verified && user.role === 'shelter') {
    redirect('/shelter');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-100">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
            <span className="text-4xl">⏳</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Application Submitted!
          </h1>

          <p className="text-gray-600 mb-2">
            Thank you for registering your shelter with Pawtopia.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Your application is now under review.</strong> Our admin team will
              verify your documents and information. You&apos;ll be notified once your
              shelter is approved and you can start posting pets for adoption.
            </p>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            This usually takes 1–3 business days. If you have any questions,
            please contact our support team.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full inline-block bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
