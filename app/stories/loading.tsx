import { Skeleton } from '@/components/ui/Skeleton';

export default function StoriesLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <Skeleton className="h-12 w-80 mx-auto mb-4 bg-white/25" />
            <Skeleton className="h-6 w-[32rem] max-w-full mx-auto mb-8 bg-white/25" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Skeleton className="h-44 w-full mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
