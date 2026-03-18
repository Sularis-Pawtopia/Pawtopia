'use client';

import Link from 'next/link';
import { CalendarPlus, HandHeart, PawPrint } from 'lucide-react';

interface CreatePostButtonProps {
  userRole?: string;
}

export function CreatePostButton({ userRole }: CreatePostButtonProps) {
  const canCreateEvent = ['shelter', 'ngo', 'dvmf'].includes(userRole || '');
  const canCreateAdoption = ['shelter', 'dvmf'].includes(userRole || '');
  const adoptionHref = userRole === 'dvmf' ? '/dvmf/pets/new' : '/shelter/pets/new';

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">Create a New Post</p>
        <p className="text-xs text-gray-500 mt-1">Choose a post type. Each option opens a dedicated form.</p>
      </div>

      {canCreateEvent ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link
            href="/events/new?type=event"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CalendarPlus className="w-4 h-4 text-primary-600" />
            Event
          </Link>

          <Link
            href="/events/new?type=donation"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <HandHeart className="w-4 h-4 text-primary-600" />
            Donation Drive
          </Link>

          {canCreateAdoption ? (
            <Link
              href={adoptionHref}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <PawPrint className="w-4 h-4 text-primary-600" />
              Adoptable Pet
            </Link>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-400 bg-gray-50">
              <PawPrint className="w-4 h-4" />
              Adoptable Pet
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Event, donation, and adoption posting is available for shelter, NGO, and DVMF roles.</p>
      )}
    </div>
  );
}
