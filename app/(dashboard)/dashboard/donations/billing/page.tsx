import { Metadata } from 'next'
import { OrganizerBillingPanel } from '@/components/donations/OrganizerBillingPanel'

export const metadata: Metadata = {
  title: 'Donation Billing Setup | Pawtopia',
  description: 'Manage your payout accounts and donation balance',
}

export default function DonationBillingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            💰 Donation Billing & Balance
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your payout accounts and track your donation balance
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <OrganizerBillingPanel />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            📋 How it works
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-3">1.</span>
              <span>Add a billing account (bank or e-wallet) where you want to receive payouts</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">2.</span>
              <span>Set one account as your default for recurring withdrawals</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">3.</span>
              <span>Monitor your donation balance including received amounts and fees</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">4.</span>
              <span>Request a withdrawal when you&apos;re ready to receive funds</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">5.</span>
              <span>An administrator will review and complete your withdrawal</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
