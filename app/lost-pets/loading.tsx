import { Skeleton } from '@/components/ui/Skeleton';

export default function LostPetsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
