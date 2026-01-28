'use client';

import Link from 'next/link';

export function CreateEventButton() {
  return (
    <Link
      href="/events/new"
      className="bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center gap-2 shadow-lg"
    >
      <span>➕</span>
      <span>Create Event</span>
    </Link>
  );
}
