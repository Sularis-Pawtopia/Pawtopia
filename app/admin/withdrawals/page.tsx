import { Metadata } from 'next'
import { AdminWithdrawalManagementPanel } from '@/components/donations/AdminWithdrawalManagementPanel'

export const metadata: Metadata = {
  title: 'Withdrawal Requests | Pawtopia Admin',
  description: 'Manage and approve donation withdrawal requests',
}

export default function AdminWithdrawalsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            🔐 Withdrawal Requests Management
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review, approve, and process organizer withdrawal requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-2">Status Distribution</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">⏳ Pending</span>
                  <span className="font-semibold text-orange-600">TBD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">✓ Approved</span>
                  <span className="font-semibold text-green-600">TBD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">⟳ Processing</span>
                  <span className="font-semibold text-blue-600">TBD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">✓ Completed</span>
                  <span className="font-semibold text-blue-500">TBD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">✗ Rejected</span>
                  <span className="font-semibold text-red-600">TBD</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-3">
                📋 Admin Checklist
              </h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>✓ Verify organizer account</li>
                <li>✓ Check billing account validity</li>
                <li>✓ Validate withdrawal amount</li>
                <li>✓ Review available balance</li>
                <li>✓ Process payout</li>
                <li>✓ Upload proof of transfer</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                🔒 Security Notes
              </h3>
              <p className="text-sm text-blue-800">
                Only verified administrators can approve withdrawals. All transactions are logged and require proof documentation.
              </p>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md">
              <AdminWithdrawalManagementPanel />
            </div>
          </div>
        </div>

        {/* Documentation footer */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📚 Withdrawal Process Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Approval - Next Steps</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Review withdrawal amount against available balance</li>
                <li>Verify organizer&apos;s billing account details</li>
                <li>Add approval notes if rejecting (required)</li>
                <li>Confirm action and update status to approved/rejected</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Completion - Next Steps</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Process payout to organizer&apos;s account</li>
                <li>Obtain and upload proof of transfer document</li>
                <li>Record the payout reference number</li>
                <li>Document actual transfer fee (if applicable)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
