import { Metadata } from 'next'
import { OrganizerWithdrawalPanel } from '@/components/donations/OrganizerWithdrawalPanel'

export const metadata: Metadata = {
  title: 'Request Withdrawal | Pawtopia',
  description: 'Request a withdrawal from your donation balance',
}

export default function WithdrawalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            🏦 Request Withdrawal
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Request to withdraw your available donation balance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main withdrawal form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
            <OrganizerWithdrawalPanel />
          </div>

          {/* Info sidebar */}
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-3">
                ✔️ Withdrawal Status
              </h2>
              <p className="text-sm text-green-800 mb-4">
                All withdrawals require admin approval for security.
              </p>
              <div className="space-y-2 text-sm text-green-700">
                <div><strong>Pending:</strong> Awaiting admin review</div>
                <div><strong>Approved:</strong> Approved for processing</div>
                <div><strong>Processing:</strong> Being transferred</div>
                <div><strong>Completed:</strong> Funds received</div>
                <div><strong>Rejected:</strong> Needs resubmission</div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-amber-900 mb-3">
                ⏱️ Processing Time
              </h2>
              <p className="text-sm text-amber-800">
                Withdrawals typically take 2-5 business days after approval.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Requirements
              </h2>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Verified organizer account</li>
                <li>✓ Valid billing account on file</li>
                <li>✓ Minimum withdrawal amount: ₱500</li>
                <li>✓ AdminApproval required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
