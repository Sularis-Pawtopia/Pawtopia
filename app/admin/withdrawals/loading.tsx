import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminWithdrawalsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-10 w-[28rem] mb-2" />
        <Skeleton className="h-6 w-[30rem] max-w-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6 space-y-3">
            <Skeleton className="h-8 w-56" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
