import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getUserPermissions } from '@/lib/actions/role.actions';
import { getReportById } from '@/lib/actions/report.actions';
import { ReportStatusUpdater, ReportTimeline } from '@/components/reports';
import { formatDistanceToNow, format } from 'date-fns';

export const metadata = {
  title: 'Report Details | Pawtopia',
  description: 'View and manage report details',
};

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Check permissions
  const permissionsResult = await getUserPermissions(user.id);
  const permissions = permissionsResult.data;
  
  if (!permissions?.canViewReports) {
    redirect('/dashboard');
  }

  // Get report details
  const reportResult = await getReportById(params.id);
  
  if (!reportResult.data) {
    notFound();
  }

  const report = reportResult.data;

  const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
    abuse: { label: 'Animal Abuse', emoji: '🚨', color: 'red' },
    neglect: { label: 'Animal Neglect', emoji: '⚠️', color: 'orange' },
    stray: { label: 'Stray Animal', emoji: '🐕', color: 'blue' },
    injured: { label: 'Injured Animal', emoji: '🩹', color: 'purple' },
    hoarding: { label: 'Animal Hoarding', emoji: '🏠', color: 'yellow' },
    illegal_breeding: { label: 'Illegal Breeding', emoji: '🔒', color: 'gray' },
    abandoned: { label: 'Abandoned Animal', emoji: '💔', color: 'pink' },
    other: { label: 'Other', emoji: '📋', color: 'gray' },
  };

  const urgencyStyles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-500',
    high: 'bg-orange-100 text-orange-800 border-orange-500',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    low: 'bg-green-100 text-green-800 border-green-500',
  };

  const typeInfo = typeLabels[report.report_type] || { label: report.report_type, emoji: '📋', color: 'gray' };

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back Link */}
          <Link 
            href="/dashboard/reports" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            ← Back to Reports
          </Link>

          {/* Header */}
          <div className={`bg-white rounded-xl shadow-sm border-l-4 ${urgencyStyles[report.urgency_level].includes('border') ? urgencyStyles[report.urgency_level].split(' ').find(c => c.includes('border')) : 'border-gray-300'} p-6 mb-6`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{typeInfo.emoji}</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${urgencyStyles[report.urgency_level]}`}>
                    {report.urgency_level.toUpperCase()} URGENCY
                  </span>
                  {report.is_anonymous && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
                      👤 Anonymous Report
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{report.title}</h1>
                <p className="text-gray-500">
                  {typeInfo.label} • Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </p>
              </div>
              <ReportStatusUpdater 
                reportId={report.id} 
                currentStatus={report.status}
                canManage={permissions?.canManageReports || false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
              </div>

              {/* Animal Details */}
              {(report.animal_type || report.animal_count || report.animal_condition) && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">🐾 Animal Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {report.animal_type && (
                      <div>
                        <div className="text-sm text-gray-500">Animal Type</div>
                        <div className="font-medium">{report.animal_type}</div>
                      </div>
                    )}
                    {report.animal_count && (
                      <div>
                        <div className="text-sm text-gray-500">Number of Animals</div>
                        <div className="font-medium">{report.animal_count}</div>
                      </div>
                    )}
                    {report.animal_condition && (
                      <div className="col-span-2">
                        <div className="text-sm text-gray-500">Condition</div>
                        <div className="font-medium">{report.animal_condition}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📍 Location</h2>
                <div className="space-y-3">
                  {report.address && (
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div className="font-medium">{report.address}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {report.barangay && (
                      <div>
                        <div className="text-sm text-gray-500">Barangay</div>
                        <div className="font-medium">{report.barangay}</div>
                      </div>
                    )}
                    {report.city && (
                      <div>
                        <div className="text-sm text-gray-500">City</div>
                        <div className="font-medium">{report.city}</div>
                      </div>
                    )}
                    {report.province && (
                      <div>
                        <div className="text-sm text-gray-500">Province</div>
                        <div className="font-medium">{report.province}</div>
                      </div>
                    )}
                  </div>
                  {report.location_lat && report.location_lng && (
                    <div className="pt-4">
                      <a
                        href={`https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                      >
                        🗺️ Open in Google Maps →
                      </a>
                      <div className="text-xs text-gray-400 mt-1">
                        Coordinates: {report.location_lat.toFixed(6)}, {report.location_lng.toFixed(6)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Media */}
              {report.media_urls && report.media_urls.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">📷 Evidence / Media</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {report.media_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition"
                      >
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">📹</span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reporter Info */}
              {!report.is_anonymous && report.reporter_contact && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">📞 Reporter Contact</h2>
                  <div className="space-y-3">
                    {report.reporter_name && (
                      <div>
                        <div className="text-sm text-gray-500">Name</div>
                        <div className="font-medium">{report.reporter_name}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Contact</div>
                      <div className="font-medium">{report.reporter_contact}</div>
                    </div>
                    {report.reporter_email && (
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <a 
                          href={`mailto:${report.reporter_email}`}
                          className="font-medium text-orange-600 hover:text-orange-700"
                        >
                          {report.reporter_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 Assignment</h2>
                {report.assigned_to ? (
                  <div>
                    <div className="text-sm text-gray-500">Assigned To</div>
                    <div className="font-medium">{report.assigned_to}</div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Not yet assigned</p>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Report Info</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-500">Report ID</div>
                    <div className="font-mono text-xs">{report.id}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Created</div>
                    <div>{format(new Date(report.created_at), 'PPpp')}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Updated</div>
                    <div>{format(new Date(report.updated_at), 'PPpp')}</div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Status History</h2>
                <ReportTimeline reportId={report.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
