import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { EventCreateForm } from '@/components/events/EventCreateForm';

export default async function NewEventPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!['shelter', 'ngo', 'dvmf'].includes(user.role)) {
    redirect('/events');
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Event / Drive</h1>
          <p className="text-gray-600">Publish your event to the community feed and events tab.</p>
        </div>
        <EventCreateForm />
      </div>
    </div>
  );
}
