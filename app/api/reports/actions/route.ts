import {
  assignReport,
  createReport,
  getMyReports,
  getReport,
  getReportHistory,
  getReports,
  getReportStats,
  updateReport,
  updateReportStatus,
  uploadReportMedia,
} from '@/lib/actions/report.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  createReport,
  getReports,
  getReport,
  updateReportStatus,
  updateReport,
  assignReport,
  getReportHistory,
  getMyReports,
  getReportStats,
  uploadReportMedia,
});