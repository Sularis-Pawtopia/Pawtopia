'use client';

import { CatLoader } from '@/components/ui/CatLoader';

interface PageLoaderOverlayProps {
  label?: string;
}

export function PageLoaderOverlay({ label = 'Loading...' }: PageLoaderOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/95">
      <div className="flex flex-col items-center gap-2 text-gray-700">
        <CatLoader size={96} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}