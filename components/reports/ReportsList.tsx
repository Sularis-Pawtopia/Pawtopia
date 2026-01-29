'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import type { Report } from '@/types/expanded.types';

interface ReportsListProps {
  reports: Report[];
  totalPages: number;
  currentPage: number;
}

export function ReportsList({ reports, totalPages, currentPage }: ReportsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/dashboard/reports?${params.toString()}`);
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
        <p className="text-gray-500">
          No reports match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Urgency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border px-6 py-4">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  const typeLabels: Record<string, { label: string; emoji: string }> = {
    abuse: { label: 'Abuse', emoji: '🚨' },
    neglect: { label: 'Neglect', emoji: '⚠️' },
    stray: { label: 'Stray', emoji: '🐕' },
    injured: { label: 'Injured', emoji: '🩹' },
    hoarding: { label: 'Hoarding', emoji: '🏠' },
    illegal_breeding: { label: 'Illegal Breeding', emoji: '🔒' },
    abandoned: { label: 'Abandoned', emoji: '💔' },
    other: { label: 'Other', emoji: '📋' },
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-orange-100 text-orange-800',
    investigating: 'bg-purple-100 text-purple-800',
    action_taken: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    referred: 'bg-indigo-100 text-indigo-800',
  };

  const urgencyStyles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 ring-1 ring-red-500',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const typeInfo = typeLabels[report.report_type] || { label: report.report_type, emoji: '📋' };

  return (
    <tr className={`hover:bg-gray-50 ${report.urgency_level === 'critical' ? 'bg-red-50' : ''}`}>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
            {report.title}
          </div>
          <div className="text-xs text-gray-500">
            {report.is_anonymous ? '👤 Anonymous' : `ID: ${report.id.slice(0, 8)}...`}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm">
          {typeInfo.emoji} {typeInfo.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{report.city || 'Unknown'}</div>
        <div className="text-xs text-gray-500">{report.barangay || ''}</div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[report.status]}`}>
          {report.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${urgencyStyles[report.urgency_level]}`}>
          {report.urgency_level}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/dashboard/reports/${report.id}`}
          className="text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          View Details →
        </Link>
      </td>
    </tr>
  );
}
