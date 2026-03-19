import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getFeedPosts } from '@/lib/actions/post.actions';
import { getUserAdoptionRequests } from '@/lib/actions/adoption.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { FeedList } from '@/components/feed/FeedList';
import { CreatePostButton } from '@/components/feed/CreatePostButton';
import { SuggestedShelters } from '@/components/SuggestedShelters';
import { MyAdoptionRequests } from '@/components/pets/MyAdoptionRequests';
import { HealthcareBookingCard } from '@/components/healthcare/HealthcareBookingCard';
import { MyHealthcareAppointments } from '@/components/healthcare/MyHealthcareAppointments';
import {
  getDvmfHealthcareBranches,
  getHealthcareEligiblePets,
  getHealthcareServices,
  getMyHealthcareAppointmentRequests,
} from '@/lib/actions/healthcare.actions';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  // Unverified non-shelter users go to onboarding
  if (!user.is_verified && user.role !== 'shelter') {
    redirect('/onboarding/adopter');
  }

  const isPendingShelter = user.role === 'shelter' && !user.is_verified;
  const canUseHealthcareRequesterFlow = ['adopter', 'volunteer', 'regular_user'].includes(user.role);

  const [{ data: initialPosts }, adoptionResult, healthcareRequestsResult, healthcareBranchesResult, healthcareServicesResult, healthcarePetsResult] = await Promise.all([
    getFeedPosts({ limit: 10 }),
    user.role === 'adopter' ? getUserAdoptionRequests(user.id) : Promise.resolve({ data: [] }),
    canUseHealthcareRequesterFlow ? getMyHealthcareAppointmentRequests() : Promise.resolve({ success: true, data: [] }),
    canUseHealthcareRequesterFlow ? getDvmfHealthcareBranches() : Promise.resolve({ success: true, data: [] }),
    canUseHealthcareRequesterFlow ? getHealthcareServices() : Promise.resolve({ success: true, data: [] }),
    canUseHealthcareRequesterFlow ? getHealthcareEligiblePets() : Promise.resolve({ success: true, data: [] }),
  ]);

  const adoptionRequests = adoptionResult.data || [];
  const healthcareRequests = (healthcareRequestsResult.success ? healthcareRequestsResult.data : []) || [];
  const healthcareBranches = (healthcareBranchesResult.success ? healthcareBranchesResult.data : []) || [];
  const healthcareServices = (healthcareServicesResult.success ? healthcareServicesResult.data : []) || [];
  const healthcarePets = (healthcarePetsResult.success ? healthcarePetsResult.data : []) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Pending Shelter Verification Banner */}
          {isPendingShelter && (
            <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-start gap-4">
              <span className="text-3xl">⏳</span>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg">Shelter Verification Pending</h3>
                <p className="text-amber-800 text-sm mt-1">
                  Your shelter registration is under review. You can browse the feed but won&apos;t be able to post pets until verified. This usually takes 1–3 business days.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-900">
                    👤 User Privileges
                  </span>
                  <span className="text-xs text-amber-700">Full shelter access will be granted after approval</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user.username}!
                </h1>
                <p className="text-gray-600">
                  Discover pets looking for their forever homes
                </p>
              </div>

              {!isPendingShelter && <CreatePostButton userRole={user.role} />}
              
              <div className="mt-6">
                <FeedList initialPosts={initialPosts || []} currentUserId={user.id} userRole={isPendingShelter ? 'user' : user.role} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                {/* Adoption Requests for adopters */}
                {user.role === 'adopter' && adoptionRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🐾 My Adoption Requests
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {adoptionRequests.length}
                      </span>
                    </h3>
                    <MyAdoptionRequests requests={adoptionRequests} />
                  </div>
                )}

                {canUseHealthcareRequesterFlow && (
                  <>
                    <HealthcareBookingCard initialBranches={healthcareBranches} initialServices={healthcareServices} initialPets={healthcarePets} canAddPet={user.role === 'adopter'} />
                    <MyHealthcareAppointments initialRequests={healthcareRequests} />
                  </>
                )}

                {/* Verification Status Tracker for pending shelters */}
                {isPendingShelter && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      📋 Application Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Registration Submitted</p>
                          <p className="text-xs text-gray-500">Your shelter details have been received</p>
                        </div>
                      </div>
                      <div className="ml-3 border-l-2 border-amber-300 h-4"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs animate-pulse">⏳</div>
                        <div>
                          <p className="text-sm font-medium text-amber-800">Under Review</p>
                          <p className="text-xs text-gray-500">Admin is reviewing your documents</p>
                        </div>
                      </div>
                      <div className="ml-3 border-l-2 border-gray-200 h-4"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs">3</div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">Verified</p>
                          <p className="text-xs text-gray-400">Full shelter access granted</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Estimated review time: 1–3 business days</p>
                    </div>
                  </div>
                )}

                {user.role === 'ngo' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">NGO Insights</h3>
                    <p className="text-sm text-gray-600">
                      This dashboard is optimized for overview and discovery. Manage event registrants within each event page.
                    </p>
                    <Link
                      href="/dashboard/ngo-operations"
                      className="inline-flex mt-3 items-center px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700"
                    >
                      Open NGO Operations
                    </Link>
                  </div>
                )}

                <SuggestedShelters />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
