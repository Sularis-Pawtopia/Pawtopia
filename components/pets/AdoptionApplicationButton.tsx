'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { callApiAction } from '@/lib/api/action-client';
import { Heart, Loader2 } from 'lucide-react';

interface AdoptionApplicationButtonProps {
  petId: string;
  petName: string;
}

export function AdoptionApplicationButton({ petId, petName }: AdoptionApplicationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submitAdoptionRequest = () => {
    setError(null);

    startTransition(async () => {
      const result = await callApiAction('adoption', 'createAdoptionRequest', [petId]);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={submitAdoptionRequest}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
        {isPending ? 'Submitting...' : `Apply to Adopt ${petName}`}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
