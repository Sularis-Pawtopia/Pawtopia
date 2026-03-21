'use client';

import { useEffect, useState } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { formatDistanceToNow } from 'date-fns';
import type { ReportStatusHistory } from '@/types/expanded.types';
import { Skeleton } from '@/components/ui/Skeleton';

interface ReportTimelineProps {
  reportId: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'yellow' },
  under_review: { label: 'Under Review', color: 'orange' },
  investigating: { label: 'Investigating', color: 'purple' },
  action_taken: { label: 'Action Taken', color: 'blue' },
  resolved: { label: 'Resolved', color: 'green' },
  closed: { label: 'Closed', color: 'gray' },
  referred: { label: 'Referred', color: 'indigo' },
};

export function ReportTimeline({ reportId }: ReportTimelineProps) {
  const [history, setHistory] = useState<ReportStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const result = await callApiAction<ReportStatusHistory[]>('reports', 'getReportHistory', [reportId]);
      if (result.data) {
        setHistory(result.data);
      }
      setLoading(false);
    }
    fetchHistory();
  }, [reportId]);

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`timeline-skeleton-${index}`} className="pl-6">
            <Skeleton className="h-4 w-56 mb-2" />
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No status changes yet.</p>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {history.map((item) => {
          const fromInfo = item.from_status ? statusLabels[item.from_status] : null;
          const toInfo = statusLabels[item.to_status] || { label: item.to_status, color: 'gray' };

          const colorClasses: Record<string, string> = {
            yellow: 'bg-yellow-500',
            orange: 'bg-orange-500',
            purple: 'bg-purple-500',
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            gray: 'bg-gray-500',
            indigo: 'bg-indigo-500',
          };

          return (
            <div key={item.id} className="relative pl-6">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ${colorClasses[toInfo.color]} ring-2 ring-white`} />
              
              <div>
                <div className="flex items-center gap-2 text-sm">
                  {fromInfo && (
                    <>
                      <span className="text-gray-500">{fromInfo.label}</span>
                      <span className="text-gray-400">→</span>
                    </>
                  )}
                  <span className="font-medium">{toInfo.label}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(item.changed_at), { addSuffix: true })}
                </div>
                {item.notes && (
                  <div className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
