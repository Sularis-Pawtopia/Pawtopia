import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getUserPermissions } from '@/lib/actions/role.actions';
import { getReports, getReportStats } from '@/lib/actions/report.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { ReportFiltersComponent, ReportsList } from '@/components/reports';

export const metadata = {
  title: 'Reports Dashboard | Pawtopia',
  description: 'Manage animal welfare reports',
};

export default async function ReportsDashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
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

  // Get reports with filters
  const filters = {
    status: searchParams.status as any,
    report_type: searchParams.type as any,
    urgency_level: searchParams.urgency as any,
    city: searchParams.city,
  };

  const page = parseInt(searchParams.page || '1');
  
  const [reportsResult, statsResult] = await Promise.all([
    getReports(filters, page, 20),
    getReportStats(),
  ]);

  const reports = reportsResult.data;
  const stats = statsResult.data;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <p className="text-gray-600">Manage and respond to animal welfare reports</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <StatCard label="Total" value={stats.total} color="gray" />
              <StatCard label="Today" value={stats.today} color="blue" />
              <StatCard label="Pending" value={stats.pending} color="yellow" />
              <StatCard label="Under Review" value={stats.under_review} color="orange" />
              <StatCard label="Investigating" value={stats.investigating} color="purple" />
              <StatCard label="Resolved" value={stats.resolved} color="green" />
              <StatCard label="Critical" value={stats.critical} color="red" urgent />
            </div>
          )}

          {/* Filters */}
          <ReportFiltersComponent />

          {/* Reports List */}
          {reports && (
            <ReportsList 
              reports={reports.data} 
              totalPages={reports.totalPages}
              currentPage={page}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color, 
  urgent 
}: { 
  label: string; 
  value: number; 
  color: string;
  urgent?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4 ${urgent ? 'ring-2 ring-red-500' : ''}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
