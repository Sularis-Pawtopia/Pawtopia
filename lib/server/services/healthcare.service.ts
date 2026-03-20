import { createClient } from '@/lib/supabase/server';
import { sendHealthcarePaymentReceiptEmail } from '@/lib/server/utils/healthcare-receipt-email';

export type HealthcareServiceType = 'spay_neuter' | 'vaccination' | 'deworming';
export type HealthcareAppointmentStatus =
  | 'pending_approval'
  | 'approved_pending_payment'
  | 'paid_scheduled'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type HealthcareCalendarView = 'day' | 'week' | 'month';

export type CreateHealthcareAppointmentRequestInput = {
  dvmf_id: string;
  pet_id: string;
  service_id: string;
  preferred_date: string;
  preferred_time: string;
  reason?: string;
  requester_notes?: string;
};

export type ReviewHealthcareAppointmentDecision = 'approve' | 'reject';

export type ManageHealthcareAppointmentDecision = 'mark_paid' | 'mark_completed' | 'mark_cancelled';

export type CreateHealthcareSlotInput = {
  service_id: string;
  slot_start: string;
  slot_end: string;
  capacity: number;
  notes?: string;
};

export type UpsertHealthcareServiceInput = {
  id?: string;
  service_type?: HealthcareServiceType;
  service_name: string;
  description?: string;
  is_paid: boolean;
  base_fee: number;
  duration_minutes: number;
  is_active?: boolean;
};

export type BranchOperatingHours = {
  slot_minutes: number;
  days: Record<
    string,
    {
      is_open: boolean;
      open_time: string;
      close_time: string;
      capacity_per_slot: number;
    }
  >;
};

export type UpdateDvmfBranchProfileInput = {
  organization_name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  operating_hours: BranchOperatingHours;
};

function resolvePlatformServiceFee(): number {
  const raw = process.env.HEALTHCARE_PLATFORM_SERVICE_FEE_PHP || process.env.NEXT_PUBLIC_HEALTHCARE_PLATFORM_SERVICE_FEE_PHP;
  const parsed = Number(raw || 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed * 100) / 100;
}

function getDefaultOperatingHours(): BranchOperatingHours {
  const defaultDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const days = defaultDays.reduce((acc, day) => {
    acc[day] = {
      is_open: day !== 'sunday',
      open_time: '08:00',
      close_time: day === 'saturday' ? '14:00' : '17:00',
      capacity_per_slot: 3,
    };
    return acc;
  }, {} as BranchOperatingHours['days']);

  return {
    slot_minutes: 60,
    days,
  };
}

function normalizeOperatingHours(raw: unknown): BranchOperatingHours {
  const fallback = getDefaultOperatingHours();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;
  const slotMinutesRaw = Number(obj.slot_minutes);
  const slot_minutes = Number.isFinite(slotMinutesRaw) && slotMinutesRaw > 0 ? Math.floor(slotMinutesRaw) : fallback.slot_minutes;
  const sourceDays = (obj.days && typeof obj.days === 'object' ? obj.days : obj) as Record<string, unknown>;

  const days = { ...fallback.days };
  for (const [day, defaultValue] of Object.entries(fallback.days)) {
    const candidate = sourceDays[day];
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }

    const value = candidate as Record<string, unknown>;
    const capacityRaw = Number(value.capacity_per_slot);
    days[day] = {
      is_open: typeof value.is_open === 'boolean' ? value.is_open : defaultValue.is_open,
      open_time: typeof value.open_time === 'string' ? value.open_time : defaultValue.open_time,
      close_time: typeof value.close_time === 'string' ? value.close_time : defaultValue.close_time,
      capacity_per_slot:
        Number.isFinite(capacityRaw) && capacityRaw > 0 ? Math.floor(capacityRaw) : defaultValue.capacity_per_slot,
    };
  }

  return {
    slot_minutes,
    days,
  };
}

async function getCurrentUserWithRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' as const };
  }

  const db = supabase as any;
  const { data: profile, error } = await db
    .from('users')
    .select('id, role, is_verified')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { error: 'User profile not found' as const };
  }

  return { supabase, db, user: profile as { id: string; role: string; is_verified?: boolean } };
}

export async function getHealthcareServicesService(dvmfId?: string) {
  try {
    const supabase = await createClient();
    const db = supabase as any;

    let query = db
      .from('dvmf_healthcare_services')
      .select(`
        *,
        dvmf:users!dvmf_healthcare_services_dvmf_id_fkey(id, username, avatar_url)
      `)
      .eq('is_active', true)
      .order('service_name', { ascending: true });

    if (dvmfId) {
      query = query.eq('dvmf_id', dvmfId);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch healthcare services' };
  }
}

export async function getHealthcareEligiblePetsService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['adopter', 'volunteer', 'regular_user'].includes(user.role)) {
      return { success: true, data: [] };
    }

    const { data, error } = await db
      .from('pets')
      .select(`
        id,
        name,
        species,
        breed,
        owner_id,
        post:posts(media_urls),
        owner:users!pets_owner_id_fkey(id, username, avatar_url)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(120);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch eligible pets for healthcare appointments' };
  }
}

export async function getDvmfHealthcareBranchesService() {
  try {
    const supabase = await createClient();
    const db = supabase as any;

    const { data, error } = await db
      .from('organization_profiles')
      .select(`
        user_id,
        organization_name,
        phone,
        email,
        address,
        city,
        state,
        zip_code,
        operating_hours,
        verification_status,
        is_active,
        user:users!organization_profiles_user_id_fkey(id, username, avatar_url, role, is_verified)
      `)
      .eq('organization_type', 'dvmf')
      .eq('is_active', true)
      .order('organization_name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const rows = (data || []).filter((row: any) => row.user?.role === 'dvmf' && row.user?.is_verified);
    return { success: true, data: rows };
  } catch {
    return { success: false, error: 'Failed to fetch DVMF branches' };
  }
}

export async function getDvmfBranchProfileService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can access branch profile settings' };
    }

    const { data, error } = await db
      .from('organization_profiles')
      .select('user_id, organization_name, description, phone, email, address, city, state, zip_code, operating_hours, verification_status, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    const profile = data || {
      user_id: user.id,
      organization_name: '',
      operating_hours: getDefaultOperatingHours(),
      verification_status: 'pending',
      is_active: true,
    };

    return {
      success: true,
      data: {
        ...profile,
        operating_hours: normalizeOperatingHours(profile.operating_hours),
      },
    };
  } catch {
    return { success: false, error: 'Failed to fetch DVMF branch profile settings' };
  }
}

export async function updateDvmfBranchProfileService(input: UpdateDvmfBranchProfileInput) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can update branch settings' };
    }

    const normalizedHours = normalizeOperatingHours(input.operating_hours);

    const { error: orgError } = await db
      .from('organization_profiles')
      .upsert(
        {
          user_id: user.id,
          organization_type: 'dvmf',
          organization_name: input.organization_name,
          description: input.description || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zip_code: input.zip_code || null,
          operating_hours: normalizedHours,
          is_active: true,
        },
        { onConflict: 'user_id' }
      );

    if (orgError) {
      return { success: false, error: orgError.message };
    }

    const { error: userError } = await db
      .from('users')
      .update({
        phone: input.phone || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip_code: input.zip_code || null,
      })
      .eq('id', user.id);

    if (userError) {
      return { success: false, error: userError.message };
    }

    return { success: true, data: { operating_hours: normalizedHours } };
  } catch {
    return { success: false, error: 'Failed to update DVMF branch settings' };
  }
}

export async function getAvailableHealthcareSlotsService(
  dvmfId: string,
  options?: { serviceType?: HealthcareServiceType; serviceId?: string; date?: string; from?: string; to?: string }
) {
  try {
    if (options?.serviceId && options?.date) {
      // DEPRECATED: Slot-based booking replaced with time-based appointment requests
      return getBranchAvailabilitySlotsService();
    }

    const supabase = await createClient();
    const db = supabase as any;

    let query = db
      .from('dvmf_healthcare_slots')
      .select(`
        *,
        service:dvmf_healthcare_services(id, service_type, service_name, is_paid, base_fee, duration_minutes, is_active),
        appointments:healthcare_appointment_requests(id, status)
      `)
      .eq('dvmf_id', dvmfId)
      .eq('is_active', true)
      .order('slot_start', { ascending: true });

    if (options?.from) {
      query = query.gte('slot_start', options.from);
    }

    if (options?.to) {
      query = query.lte('slot_start', options.to);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    let rows = (data || []).filter((slot: any) => {
      const approvedCount = Number(slot.approved_bookings_count || 0);
      const pendingCount = (slot.appointments || []).filter((appointment: any) => appointment.status === 'pending_approval').length;
      const count = approvedCount + pendingCount;
      const capacity = Number(slot.capacity || 0);
      return capacity > 0 && count < capacity;
    });

    if (options?.serviceType) {
      rows = rows.filter((slot: any) => slot.service?.service_type === options.serviceType);
    }

    return { success: true, data: rows };
  } catch {
    return { success: false, error: 'Failed to fetch healthcare slots' };
  }
}

export async function getBranchAvailabilitySlotsService() {
  // DEPRECATED: Slot-based booking has been replaced with time-based appointment requests
  // Users now specify preferred_date and preferred_time directly
  return {
    success: false,
    error: 'Slot-based booking is deprecated. Use the new appointment request flow with preferred time selection.',
  };
}

export async function getDvmfHealthcareServicesForOwnerService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can manage healthcare services' };
    }

    const { data, error } = await db
      .from('dvmf_healthcare_services')
      .select('*')
      .eq('dvmf_id', user.id)
      .order('service_name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch DVMF healthcare services' };
  }
}

export async function upsertDvmfHealthcareServiceService(input: UpsertHealthcareServiceInput) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can manage healthcare services' };
    }

    const serviceType = input.service_type || 'vaccination';
    const commonPayload = {
      service_name: input.service_name,
      description: input.description || null,
      is_paid: Boolean(input.is_paid),
      base_fee: Number(input.base_fee || 0),
      duration_minutes: Math.max(15, Math.floor(Number(input.duration_minutes || 60))),
      is_active: input.is_active !== false,
    };

    if (input.id) {
      const { data, error } = await db
        .from('dvmf_healthcare_services')
        .update(commonPayload)
        .eq('id', input.id)
        .eq('dvmf_id', user.id)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    }

    const { data, error } = await db
      .from('dvmf_healthcare_services')
      .insert({
        dvmf_id: user.id,
        service_type: serviceType,
        ...commonPayload,
      })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to save healthcare service' };
  }
}

export async function removeDvmfHealthcareServiceService(serviceId: string) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can manage healthcare services' };
    }

    const { error } = await db
      .from('dvmf_healthcare_services')
      .update({ is_active: false })
      .eq('id', serviceId)
      .eq('dvmf_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to deactivate healthcare service' };
  }
}

export async function createHealthcareAppointmentRequestService(
  input: CreateHealthcareAppointmentRequestInput
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['adopter', 'volunteer', 'regular_user'].includes(user.role)) {
      return { success: false, error: 'Role is not allowed to request healthcare appointments' };
    }

    const { data: service, error: serviceError } = await db
      .from('dvmf_healthcare_services')
      .select('id, dvmf_id, service_type, is_paid, base_fee, is_active')
      .eq('id', input.service_id)
      .single();

    if (serviceError || !service) {
      return { success: false, error: 'Healthcare service not found' };
    }

    if (!service.is_active || service.dvmf_id !== input.dvmf_id) {
      return { success: false, error: 'Service is unavailable for the selected DVMF' };
    }

    const { data: pet, error: petError } = await db
      .from('pets')
      .select('id, owner_id')
      .eq('id', input.pet_id)
      .single();

    if (petError || !pet || !pet.owner_id) {
      return { success: false, error: 'Selected pet is not eligible for healthcare scheduling' };
    }

    if (pet.owner_id !== user.id) {
      return { success: false, error: 'You can only request healthcare for your own pets' };
    }

    // Validate date and time format
    if (!input.preferred_date || !input.preferred_time) {
      return { success: false, error: 'Preferred date and time are required' };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.preferred_date)) {
      return { success: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(input.preferred_time)) {
      return { success: false, error: 'Invalid time format. Use HH:MM' };
    }

    // Validate date is not in the past
    const preferredDateTime = new Date(`${input.preferred_date}T${input.preferred_time}`);
    const now = new Date();
    if (preferredDateTime < now) {
      return { success: false, error: 'Preferred date and time cannot be in the past' };
    }

    const serviceBaseFee = Number(service.base_fee || 0);
    const platformFee = service.is_paid ? resolvePlatformServiceFee() : 0;
    const totalFee = service.is_paid ? serviceBaseFee + platformFee : 0;
    const paymentRequired = totalFee > 0;

    const { data: created, error: createError } = await db
      .from('healthcare_appointment_requests')
      .insert({
        requester_id: user.id,
        dvmf_id: input.dvmf_id,
        pet_id: input.pet_id,
        service_id: input.service_id,
        preferred_date: input.preferred_date,
        preferred_time: input.preferred_time,
        slot_id: null,
        reason: input.reason || null,
        requester_notes: input.requester_notes || null,
        status: 'pending_approval',
        service_base_fee: serviceBaseFee,
        platform_service_fee: platformFee,
        total_fee: totalFee,
        payment_required: paymentRequired,
      })
      .select('*')
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create healthcare appointment request' };
  }
}

export async function getMyHealthcareAppointmentRequestsService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    const { data, error } = await db
      .from('healthcare_appointment_requests')
      .select(`
        *,
        service:dvmf_healthcare_services(id, service_type, service_name, is_paid, base_fee),
        pet:pets(id, name, species, breed, owner_id),
        slot:dvmf_healthcare_slots(id, slot_start, slot_end, capacity),
        dvmf:users!healthcare_appointment_requests_dvmf_id_fkey(id, username, avatar_url)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch your healthcare appointment requests' };
  }
}

export async function getDvmfHealthcareAppointmentRequestsService(options?: {
  status?: HealthcareAppointmentStatus;
}) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can review healthcare requests' };
    }

    let query = db
      .from('healthcare_appointment_requests')
      .select(`
        *,
        service:dvmf_healthcare_services(id, service_type, service_name, is_paid, base_fee),
        slot:dvmf_healthcare_slots(id, slot_start, slot_end, capacity, approved_bookings_count),
        requester:users!healthcare_appointment_requests_requester_id_fkey(id, username, avatar_url, role),
        pet:pets(id, name, species, breed, owner_id)
      `)
      .eq('dvmf_id', user.id)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch DVMF healthcare requests' };
  }
}

export async function reviewHealthcareAppointmentRequestService(
  requestId: string,
  decision: ReviewHealthcareAppointmentDecision,
  reviewNotes?: string
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can review appointment requests' };
    }

    const { data: request, error: requestError } = await db
      .from('healthcare_appointment_requests')
      .select('id, dvmf_id, status, slot_id, payment_required, total_fee')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return { success: false, error: 'Appointment request not found' };
    }

    if (request.dvmf_id !== user.id) {
      return { success: false, error: 'You cannot review this appointment request' };
    }

    if (request.status !== 'pending_approval') {
      return { success: false, error: 'Only pending requests can be reviewed' };
    }

    if (decision === 'approve' && request.slot_id) {
      const { data: slot, error: slotError } = await db
        .from('dvmf_healthcare_slots')
        .select('id, capacity, approved_bookings_count')
        .eq('id', request.slot_id)
        .single();

      if (slotError || !slot) {
        return { success: false, error: 'Selected slot is no longer available' };
      }

      if (Number(slot.approved_bookings_count || 0) >= Number(slot.capacity || 0)) {
        return { success: false, error: 'Slot capacity has been reached' };
      }
    }

    const requiresPayment = Boolean(request.payment_required) && Number(request.total_fee || 0) > 0;
    const nextStatus =
      decision === 'approve'
        ? requiresPayment
          ? 'approved_pending_payment'
          : 'paid_scheduled'
        : 'rejected';

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await db
      .from('healthcare_appointment_requests')
      .update({
        status: nextStatus,
        reviewed_by: user.id,
        reviewed_at: nowIso,
        review_notes: reviewNotes || null,
        approved_at: decision === 'approve' ? nowIso : null,
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to review appointment request' };
  }
}

export async function manageHealthcareAppointmentStatusService(
  requestId: string,
  decision: ManageHealthcareAppointmentDecision,
  cancellationReason?: string
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can manage appointment status' };
    }

    const { data: request, error: requestError } = await db
      .from('healthcare_appointment_requests')
      .select('id, dvmf_id, status, payment_required, total_fee, review_notes')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return { success: false, error: 'Appointment request not found' };
    }

    if (request.dvmf_id !== user.id) {
      return { success: false, error: 'You cannot modify this appointment request' };
    }

    const nowIso = new Date().toISOString();
    const updates: Record<string, unknown> = {
      reviewed_by: user.id,
      reviewed_at: nowIso,
    };

    if (decision === 'mark_paid') {
      if (request.status !== 'approved_pending_payment') {
        return { success: false, error: 'Only approved requests awaiting payment can be marked as paid' };
      }

      const requiresPayment = Boolean(request.payment_required) && Number(request.total_fee || 0) > 0;
      if (!requiresPayment) {
        return { success: false, error: 'This request does not require payment' };
      }

      updates.status = 'paid_scheduled';
      updates.paid_at = nowIso;
    } else if (decision === 'mark_completed') {
      if (request.status !== 'paid_scheduled') {
        return { success: false, error: 'Only paid and scheduled requests can be marked as completed' };
      }

      updates.status = 'completed';
      updates.completed_at = nowIso;
    } else {
      if (request.status !== 'paid_scheduled') {
        return { success: false, error: 'Only paid and scheduled requests can be cancelled' };
      }

      const trimmedReason = String(cancellationReason || '').trim();
      if (!trimmedReason) {
        return { success: false, error: 'Cancellation reason is required' };
      }

      updates.status = 'cancelled';
      updates.cancelled_at = nowIso;
      updates.review_notes = trimmedReason;
    }

    const { data: updated, error: updateError } = await db
      .from('healthcare_appointment_requests')
      .update(updates)
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (decision === 'mark_paid') {
      const { data: details } = await db
        .from('healthcare_appointment_requests')
        .select(`
          id,
          total_fee,
          service_base_fee,
          platform_service_fee,
          paid_at,
          service:dvmf_healthcare_services(service_name),
          pet:pets(name),
          requester:users!healthcare_appointment_requests_requester_id_fkey(email, username)
        `)
        .eq('id', requestId)
        .maybeSingle();

      const recipientEmail = details?.requester?.email || null;
      if (recipientEmail) {
        const receiptResult = await sendHealthcarePaymentReceiptEmail({
          recipientEmail,
          recipientName: details?.requester?.username || 'Pet Owner',
          appointmentRequestId: requestId,
          serviceName: details?.service?.service_name || 'Healthcare Service',
          petName: details?.pet?.name || 'Pet',
          amountTotal: Number(details?.total_fee || 0),
          amountService: Number(details?.service_base_fee || 0),
          amountPlatformFee: Number(details?.platform_service_fee || 0),
          paidAtIso: details?.paid_at || nowIso,
        });

        if (!receiptResult.success) {
          console.error('Healthcare payment receipt email failed:', receiptResult.error);
        }
      }
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update appointment status' };
  }
}

export async function createHealthcareSlotService(input: CreateHealthcareSlotInput) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can create healthcare slots' };
    }

    if (!Number.isFinite(input.capacity) || input.capacity <= 0) {
      return { success: false, error: 'Slot capacity must be greater than zero' };
    }

    const { data: service, error: serviceError } = await db
      .from('dvmf_healthcare_services')
      .select('id, dvmf_id, is_active')
      .eq('id', input.service_id)
      .single();

    if (serviceError || !service || service.dvmf_id !== user.id || !service.is_active) {
      return { success: false, error: 'Service is invalid for slot creation' };
    }

    const { data: slot, error } = await db
      .from('dvmf_healthcare_slots')
      .insert({
        dvmf_id: user.id,
        service_id: input.service_id,
        slot_start: input.slot_start,
        slot_end: input.slot_end,
        capacity: Math.floor(input.capacity),
        approved_bookings_count: 0,
        notes: input.notes || null,
        is_active: true,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: slot };
  } catch {
    return { success: false, error: 'Failed to create healthcare slot' };
  }
}

export async function getDvmfHealthcareCalendarWeekService(weekStartIso?: string) {
  return getDvmfHealthcareCalendarService('week', weekStartIso);
}

export async function getDvmfHealthcareCalendarService(
  view: HealthcareCalendarView = 'week',
  referenceIso?: string
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'dvmf') {
      return { success: false, error: 'Only DVMF accounts can view healthcare calendar operations' };
    }

    const reference = referenceIso ? new Date(referenceIso) : new Date();
    const day = reference.getUTCDay();
    const offsetToMonday = day === 0 ? -6 : 1 - day;

    let rangeStart = new Date(reference);
    let rangeEnd = new Date(reference);

    if (view === 'day') {
      rangeStart.setUTCHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setUTCDate(rangeStart.getUTCDate() + 1);
    } else if (view === 'week') {
      rangeStart.setUTCDate(reference.getUTCDate() + offsetToMonday);
      rangeStart.setUTCHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setUTCDate(rangeStart.getUTCDate() + 7);
    } else if (view === 'month') {
      rangeStart = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1, 0, 0, 0));
      rangeEnd = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1, 0, 0, 0));
    }

    // Query appointments directly instead of pre-generated slots
    const rangeStartDate = rangeStart.toISOString().split('T')[0];
    const rangeEndDate = rangeEnd.toISOString().split('T')[0];

    const { data: appointments, error: appointmentsError } = await db
      .from('healthcare_appointment_requests')
      .select(`
        *,
        service:dvmf_healthcare_services(id, service_type, service_name, is_paid, duration_minutes),
        requester:users!healthcare_appointment_requests_requester_id_fkey(id, username, avatar_url),
        pet:pets(id, name, species)
      `)
      .eq('dvmf_id', user.id)
      .gte('preferred_date', rangeStartDate)
      .lt('preferred_date', rangeEndDate)
      .in('status', ['pending_approval', 'approved_pending_payment', 'paid_scheduled', 'completed'])
      .order('preferred_date', { ascending: true })
      .order('preferred_time', { ascending: true });

    if (appointmentsError) {
      return { success: false, error: appointmentsError.message };
    }

    // Group appointments by date and time to calculate occupancy
    type AppointmentsByDateAndTime = { [key: string]: any[] };
    const appointmentsByDateAndTime: AppointmentsByDateAndTime = {};
    
    for (const appointment of appointments || []) {
      const key = `${appointment.preferred_date}T${appointment.preferred_time}`;
      if (!appointmentsByDateAndTime[key]) {
        appointmentsByDateAndTime[key] = [];
      }
      appointmentsByDateAndTime[key].push(appointment);
    }

    // Default capacity per time slot (can be tuned)
    const DEFAULT_CAPACITY = 3;

    // Transform into slot-like structure for calendar display
    const slots = Object.entries(appointmentsByDateAndTime).map(([dateTime, appts]) => {
      const [date, time] = dateTime.split('T');
      const pendingCount = appts.filter(a => a.status === 'pending_approval').length;
      const approvedCount = appts.filter(a => a.status === 'approved_pending_payment').length;
      const paidCount = appts.filter(a => a.status === 'paid_scheduled').length;
      const completedCount = appts.filter(a => a.status === 'completed').length;
      const occupiedCount = pendingCount + approvedCount + paidCount + completedCount;
      const utilization = Math.min(1, occupiedCount / DEFAULT_CAPACITY);

      return {
        id: `${date}T${time}`,
        dvmf_id: user.id,
        slot_start: `${date}T${time}:00Z`,
        slot_end: `${date}T${time}:00Z`,
        preferred_date: date,
        preferred_time: time,
        capacity: DEFAULT_CAPACITY,
        occupied_count: occupiedCount,
        pending_count: pendingCount,
        approved_count: approvedCount,
        paid_count: paidCount,
        completed_count: completedCount,
        utilization,
        appointments: appts,
      };
    });

    return {
      success: true,
      data: {
        view,
        period_start: rangeStart.toISOString(),
        period_end: rangeEnd.toISOString(),
        slots,
      },
    };
  } catch {
    return { success: false, error: 'Failed to fetch healthcare calendar data' };
  }
}
