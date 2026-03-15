'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { 
  Report, 
  ReportInsert, 
  ReportUpdate, 
  ReportFilters,
  ReportStatusHistory,
  ActionResponse,
  PaginatedResponse 
} from '@/types/expanded.types';

async function requireReportManager() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' as const };
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || !['admin', 'dvmf'].includes(profile.role)) {
    return { error: 'Forbidden' as const };
  }

  return { supabase, user };
}

// =============================================
// CREATE REPORT (Authenticated or Anonymous)
// =============================================

export async function createReport(
  data: ReportInsert,
  mediaUrls: string[] = []
): Promise<ActionResponse<Report>> {
  try {
    const supabase = await createClient();
    
    // Get current user (may be null for anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Build insert data
    const insertData: ReportInsert = {
      ...data,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
    };
    
    // Handle anonymous vs authenticated
    if (data.is_anonymous) {
      insertData.reporter_id = null;
      // Store contact info if provided
      if (data.reporter_contact_info) {
        insertData.reporter_contact_info = data.reporter_contact_info;
      }
    } else {
      if (!user) {
        return { success: false, error: 'Authentication required for non-anonymous reports' };
      }
      insertData.reporter_id = user.id;
    }
    
    const { data: report, error } = await supabase
      .from('reports')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Create report error:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/reports');
    return { success: true, data: report as Report };
  } catch (error) {
    console.error('Create report error:', error);
    return { success: false, error: 'Failed to submit report' };
  }
}

// =============================================
// GET REPORTS (City Pound / Admin only)
// =============================================

export async function getReports(
  filters: ReportFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<ActionResponse<PaginatedResponse<Report>>> {
  try {
    const auth = await requireReportManager();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase } = auth;
    
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.report_type) {
      query = query.eq('report_type', filters.report_type);
    }
    if (filters.urgency_level) {
      query = query.eq('urgency_level', filters.urgency_level);
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.city) {
      query = query.ilike('location_city', `%${filters.city}%`);
    }
    if (filters.state) {
      query = query.eq('location_state', filters.state);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Get reports error:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data: {
        data: data as Report[],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    };
  } catch (error) {
    console.error('Get reports error:', error);
    return { success: false, error: 'Failed to fetch reports' };
  }
}

// =============================================
// GET SINGLE REPORT
// =============================================

export async function getReport(id: string): Promise<ActionResponse<Report>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Get report error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as Report };
  } catch (error) {
    console.error('Get report error:', error);
    return { success: false, error: 'Failed to fetch report' };
  }
}

// Alias for getReport
export const getReportById = getReport;

// =============================================
// UPDATE REPORT STATUS
// =============================================

export async function updateReportStatus(
  id: string,
  newStatus: string,
  notes?: string
): Promise<ActionResponse<Report>> {
  try {
    const auth = await requireReportManager();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase, user } = auth;
    
    // Get current report to track status change
    const { data: currentReport } = await supabase
      .from('reports')
      .select('status')
      .eq('id', id)
      .single();
    
    const oldStatus = currentReport?.status;
    
    // Build update data
    const updateData: ReportUpdate = { 
      status: newStatus as Report['status'] 
    };
    
    // If resolving, set resolved fields
    if (newStatus === 'resolved' || newStatus === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    }
    
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Update report error:', error);
      return { success: false, error: error.message };
    }
    
    // Log status change in history
    if (oldStatus !== newStatus) {
      await supabase
        .from('report_status_history')
        .insert({
          report_id: id,
          from_status: oldStatus,
          to_status: newStatus,
          changed_by: user.id,
          notes: notes || null,
        });
    }
    
    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/reports/${id}`);
    return { success: true, data: data as Report };
  } catch (error) {
    console.error('Update report error:', error);
    return { success: false, error: 'Failed to update report' };
  }
}

// Generic update function
export async function updateReport(
  id: string,
  update: ReportUpdate
): Promise<ActionResponse<Report>> {
  try {
    const auth = await requireReportManager();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase, user } = auth;
    
    // Build update data
    const updateData: ReportUpdate = { ...update };
    
    // If resolving, set resolved fields
    if (update.status === 'resolved' || update.status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    }
    
    // If assigning, set assigned fields
    if (update.assigned_to) {
      updateData.assigned_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Update report error:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/reports/${id}`);
    return { success: true, data: data as Report };
  } catch (error) {
    console.error('Update report error:', error);
    return { success: false, error: 'Failed to update report' };
  }
}

// =============================================
// ASSIGN REPORT
// =============================================

export async function assignReport(
  reportId: string,
  assigneeId: string
): Promise<ActionResponse<Report>> {
  try {
    const auth = await requireReportManager();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase } = auth;
    
    const { data, error } = await supabase
      .from('reports')
      .update({
        assigned_to: assigneeId,
        assigned_at: new Date().toISOString(),
        status: 'under_review'
      })
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/reports');
    return { success: true, data: data as Report };
  } catch (error) {
    return { success: false, error: 'Failed to assign report' };
  }
}

// =============================================
// GET REPORT STATUS HISTORY
// =============================================

export async function getReportHistory(
  reportId: string
): Promise<ActionResponse<ReportStatusHistory[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('report_status_history')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get report history error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as ReportStatusHistory[] };
  } catch (error) {
    console.error('Get report history error:', error);
    return { success: false, error: 'Failed to fetch report history' };
  }
}

// Alias for getReportHistory
export const getReportStatusHistory = getReportHistory;

// =============================================
// GET USER'S OWN REPORTS (non-anonymous only)
// =============================================

export async function getMyReports(): Promise<ActionResponse<Report[]>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', user.id)
      .eq('is_anonymous', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get my reports error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as Report[] };
  } catch (error) {
    console.error('Get my reports error:', error);
    return { success: false, error: 'Failed to fetch your reports' };
  }
}

// =============================================
// GET REPORT STATISTICS (for dashboard)
// =============================================

export async function getReportStats(): Promise<ActionResponse<{
  total: number;
  pending: number;
  under_review: number;
  investigating: number;
  resolved: number;
  critical: number;
  today: number;
}>> {
  try {
    const supabase = await createClient();
    
    // Get counts by status
    const { data: allReports, error } = await supabase
      .from('reports')
      .select('status, urgency_level, created_at');
    
    if (error) {
      console.error('Get report stats error:', error);
      return { success: false, error: error.message };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      total: allReports.length,
      pending: allReports.filter(r => r.status === 'pending').length,
      under_review: allReports.filter(r => r.status === 'under_review').length,
      investigating: allReports.filter(r => r.status === 'investigating').length,
      resolved: allReports.filter(r => r.status === 'resolved').length,
      critical: allReports.filter(r => r.urgency_level === 'critical').length,
      today: allReports.filter(r => new Date(r.created_at) >= today).length,
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Get report stats error:', error);
    return { success: false, error: 'Failed to fetch report statistics' };
  }
}

// =============================================
// UPLOAD REPORT MEDIA
// =============================================

export async function uploadReportMedia(
  file: File,
  reportId?: string
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const folder = reportId || 'pending';
    const fileName = `${folder}/${timestamp}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload report media error:', error);
      return { success: false, error: error.message };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(data.path);
    
    return { success: true, data: publicUrl };
  } catch (error) {
    console.error('Upload report media error:', error);
    return { success: false, error: 'Failed to upload media' };
  }
}
