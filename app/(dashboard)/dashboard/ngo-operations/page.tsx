import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { OrganizerEventRegistrantsBoard } from '@/components/events/OrganizerEventRegistrantsBoard';

export default async function NgoOperationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'ngo') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NGO Operations</h1>
            <p className="text-gray-600">Review and process event participant and volunteer workflows.</p>
          </div>

          <OrganizerEventRegistrantsBoard organizerId={user.id} title="NGO Event Registrants" />
        </div>
      </div>
    </div>
  );
}
