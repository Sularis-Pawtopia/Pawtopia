import { Skeleton } from '@/components/ui/Skeleton';

export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0 space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </aside>
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-10 w-44" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
