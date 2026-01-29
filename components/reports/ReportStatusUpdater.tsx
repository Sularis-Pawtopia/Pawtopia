'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateReportStatus } from '@/lib/actions/report.actions';
import type { ReportStatus } from '@/types/expanded.types';

interface ReportStatusUpdaterProps {
  reportId: string;
  currentStatus: ReportStatus;
  canManage: boolean;
}

const STATUSES: { value: ReportStatus; label: string; description: string }[] = [
  { value: 'pending', label: '🕐 Pending', description: 'Awaiting initial review' },
  { value: 'under_review', label: '📝 Under Review', description: 'Being reviewed by staff' },
  { value: 'investigating', label: '🔍 Investigating', description: 'Active investigation ongoing' },
  { value: 'action_taken', label: '⚡ Action Taken', description: 'Intervention has been made' },
  { value: 'resolved', label: '✅ Resolved', description: 'Case successfully resolved' },
  { value: 'closed', label: '🔒 Closed', description: 'Case closed (no further action)' },
  { value: 'referred', label: '↗️ Referred', description: 'Referred to another agency' },
];

export function ReportStatusUpdater({ 
  reportId, 
  currentStatus, 
  canManage 
}: ReportStatusUpdaterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);

  const currentStatusInfo = STATUSES.find(s => s.value === currentStatus);

  const handleStatusChange = (status: ReportStatus) => {
    setSelectedStatus(status);
    setNotes('');
  };

  const handleSubmit = () => {
    if (!selectedStatus) return;

    startTransition(async () => {
      const result = await updateReportStatus(reportId, selectedStatus, notes || undefined);
      
      if (result.success) {
        setIsOpen(false);
        setSelectedStatus(null);
        setNotes('');
        router.refresh();
      } else {
        alert('Failed to update status: ' + result.error);
      }
    });
  };

  if (!canManage) {
    return (
      <div className="text-right">
        <div className="text-sm text-gray-500">Current Status</div>
        <div className="text-lg font-medium">{currentStatusInfo?.label}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
      >
        Update Status
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border z-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Update Report Status</h3>
            
            <div className="space-y-2 mb-4">
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  disabled={status.value === currentStatus}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedStatus === status.value
                      ? 'bg-orange-100 border-2 border-orange-500'
                      : status.value === currentStatus
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{status.label}</div>
                  <div className="text-xs text-gray-500">{status.description}</div>
                </button>
              ))}
            </div>

            {selectedStatus && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this status change..."
                  rows={3}
                  className="w-full rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedStatus(null);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedStatus || isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
