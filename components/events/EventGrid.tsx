'use client';

import Link from 'next/link';

interface EventGridProps {
  events: any[];
}

export function EventGrid({ events }: EventGridProps) {
  return (
    <div className="space-y-6">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="md:flex">
            {/* Date Badge */}
            <div className="md:flex-shrink-0 bg-gradient-to-br from-primary-500 to-secondary-500 text-white p-6 md:w-32 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold">
                {new Date(event.event_date).getDate()}
              </div>
              <div className="text-lg">
                {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
              </div>
              <div className="text-sm opacity-90">
                {new Date(event.event_date).getFullYear()}
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {event.event_type || 'Event'}
                    </span>
                    {event.registration_required && (
                      <span className="bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Registration Required
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {event.event_name}
                  </h3>
                  <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <span>🏢</span>
                      <span>{event.users?.username || 'Organizer'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⏰</span>
                      <span>
                        {new Date(event.event_date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {event.posts?.description || 'Join us for this exciting event!'}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {event.capacity && (
                    <div className="flex items-center gap-1">
                      <span>👥</span>
                      <span>Max {event.capacity} attendees</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>✓</span>
                    <span>{event.attendee_count || 0} RSVPs</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/events/${event.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </Link>
                  <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                    RSVP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
