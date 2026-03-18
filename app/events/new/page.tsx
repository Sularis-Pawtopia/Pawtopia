import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { EventCreateForm } from '@/components/events/EventCreateForm';

interface NewEventPageProps {
  searchParams?: {
    type?: string;
  };
}

export default async function NewEventPage({ searchParams }: NewEventPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!['shelter', 'ngo', 'dvmf'].includes(user.role)) {
    redirect('/events');
  }

  const type = (searchParams?.type || '').toLowerCase();
  const initialMode = type === 'donation' ? 'donation' : 'event';
  const heading = initialMode === 'donation' ? 'Create Donation Drive' : 'Create Event';
  const subtitle = initialMode === 'donation'
    ? 'Launch a campaign with a target quota and static payment instructions.'
    : 'Publish your event to the community feed and events tab.';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{heading}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <EventCreateForm initialMode={initialMode} />
      </div>
    </div>
  );
}
