import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getEventPostByEventId } from '@/lib/actions/post.actions';
import { syncDonationPaymentStatus, syncDonationPaymentStatusByRequestRef } from '@/lib/actions/donation.actions';
import { FeedList } from '@/components/feed/FeedList';
import { EventRegistrationPanel } from '@/components/events/EventRegistrationPanel';
import { EventCommentsPanel } from '@/components/events/EventCommentsPanel';
import { DonationDonorPanel } from '@/components/donations/DonationDonorPanel';

interface EventDetailPageProps {
  params: {
    eventId: string;
  };
  searchParams?: {
    donation?: string;
    requestRef?: string;
    tx?: string;
  };
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const user = await getCurrentUser();

  if (searchParams?.donation === 'success') {
    if (typeof searchParams.tx === 'string' && searchParams.tx.length > 0) {
      await syncDonationPaymentStatus(searchParams.tx, { assumePaidOnSuccessReturn: true });
    } else if (typeof searchParams.requestRef === 'string' && searchParams.requestRef.length > 0) {
      await syncDonationPaymentStatusByRequestRef(searchParams.requestRef, { assumePaidOnSuccessReturn: true });
    }
  }

  const result = await getEventPostByEventId(params.eventId);

  if ('error' in result || !result.data) {
    notFound();
  }

  const eventFromPost = (result.data as any).event;
  const eventData = Array.isArray(eventFromPost) ? eventFromPost[0] : eventFromPost;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Event Post</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3">
            {eventData && eventData.event_type === 'donation_drive' ? (
              <DonationDonorPanel
                campaignId={eventData.id}
                organizerName={eventData.organizer?.username || 'Organizer'}
                monetaryEnabled={eventData.donation_monetary_enabled || false}
                inKindEnabled={eventData.donation_in_kind_enabled || false}
                beneficiary={eventData.donation_beneficiary}
                dropoffAddress={eventData.donation_dropoff_address}
                dropoffMapUrl={eventData.donation_dropoff_map_url}
                dropoffInstructions={eventData.donation_notes}
                currentUserId={user?.id}
                organizerId={eventData.organizer_id}
              />
            ) : (
              eventData && (
                <EventRegistrationPanel
                  event={eventData}
                  currentUser={{
                    id: user?.id,
                    role: user?.role,
                  }}
                />
              )
            )}
          </div>

          <div className="lg:col-span-6">
            <FeedList
              initialPosts={[result.data as any]}
              currentUserId={user?.id}
              userRole={user?.role}
              hideComments
            />
          </div>

          <div className="lg:col-span-3">
            <EventCommentsPanel
              postId={(result.data as any).id}
              currentUserId={user?.id}
              initialComments={(result.data as any).comments || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
