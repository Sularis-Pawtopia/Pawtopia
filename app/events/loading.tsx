import { Skeleton } from '@/components/ui/Skeleton';

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-72 bg-white/25 mb-3" />
          <Skeleton className="h-6 w-[28rem] bg-white/25 mb-8" />
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-white/20" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
