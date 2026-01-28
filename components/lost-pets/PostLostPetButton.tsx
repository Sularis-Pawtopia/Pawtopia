'use client';

import Link from 'next/link';

export function PostLostPetButton() {
  return (
    <Link
      href="/lost-pets/new"
      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center gap-2"
    >
      <span>📝</span>
      <span>Post Lost/Found Pet</span>
    </Link>
  );
}
