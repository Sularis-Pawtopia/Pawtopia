import { Skeleton } from '@/components/ui/Skeleton';

export default function HealthcareLoading() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 via-white to-cyan-50">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          <div className="rounded-2xl border border-orange-100 bg-white/90 shadow-sm p-5 lg:p-7 mb-6 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-5 w-full max-w-3xl" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="xl:col-span-7 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
