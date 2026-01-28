'use client';

import Link from 'next/link';

export function CreateStoryButton() {
  return (
    <Link
      href="/stories/new"
      className="inline-block bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-lg"
    >
      ✍️ Share Your Story
    </Link>
  );
}
