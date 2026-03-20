'use server';

import { revalidatePath } from 'next/cache';
import {
  createHealthcareAppointmentRequestService,
  createHealthcareSlotService,
  getBranchAvailabilitySlotsService,
  getDvmfBranchProfileService,
  getDvmfHealthcareBranchesService,
  getDvmfHealthcareCalendarService,
  getDvmfHealthcareServicesForOwnerService,
  getAvailableHealthcareSlotsService,
  getDvmfHealthcareAppointmentRequestsService,
  getDvmfHealthcareCalendarWeekService,
  getHealthcareEligiblePetsService,
  getHealthcareServicesService,
  getMyHealthcareAppointmentRequestsService,
  manageHealthcareAppointmentStatusService,
  removeDvmfHealthcareServiceService,
  reviewHealthcareAppointmentRequestService,
  updateDvmfBranchProfileService,
  upsertDvmfHealthcareServiceService,
  type CreateHealthcareAppointmentRequestInput,
  type CreateHealthcareSlotInput,
  type HealthcareCalendarView,
  type HealthcareAppointmentStatus,
  type HealthcareServiceType,
  type ManageHealthcareAppointmentDecision,
  type ReviewHealthcareAppointmentDecision,
  type UpsertHealthcareServiceInput,
  type UpdateDvmfBranchProfileInput,
} from '@/lib/server/services/healthcare.service';
import { initiateMayaCheckoutService } from '@/lib/server/services/healthcare-payment.service';
import { syncMayaPaymentStatusService } from '@/lib/server/services/healthcare-payment.service';

export async function getHealthcareServices(dvmfId?: string) {
  return getHealthcareServicesService(dvmfId);
}

export async function getHealthcareEligiblePets() {
  return getHealthcareEligiblePetsService();
}

export async function getDvmfHealthcareBranches() {
  return getDvmfHealthcareBranchesService();
}

export async function getAvailableHealthcareSlots(
  dvmfId: string,
  options?: { serviceType?: HealthcareServiceType; serviceId?: string; date?: string; from?: string; to?: string }
) {
  return getAvailableHealthcareSlotsService(dvmfId, options);
}

export async function getBranchAvailabilitySlots(_dvmfId: string, _serviceId: string, _date: string) {
  // DEPRECATED: Use the new time-based appointment request flow instead
  return getBranchAvailabilitySlotsService();
}

export async function createHealthcareAppointmentRequest(
  input: CreateHealthcareAppointmentRequestInput
) {
  const result = await createHealthcareAppointmentRequestService(input);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dvmf/operations');
  }
  return result;
}

export async function getMyHealthcareAppointmentRequests() {
  return getMyHealthcareAppointmentRequestsService();
}

export async function getDvmfHealthcareAppointmentRequests(filters?: {
  status?: HealthcareAppointmentStatus;
}) {
  return getDvmfHealthcareAppointmentRequestsService(filters);
}

export async function reviewHealthcareAppointmentRequest(
  requestId: string,
  decision: ReviewHealthcareAppointmentDecision,
  reviewNotes?: string
) {
  const result = await reviewHealthcareAppointmentRequestService(requestId, decision, reviewNotes);
  if (result.success) {
    revalidatePath('/dvmf/operations');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function manageHealthcareAppointmentStatus(
  requestId: string,
  decision: ManageHealthcareAppointmentDecision,
  cancellationReason?: string
) {
  const result = await manageHealthcareAppointmentStatusService(requestId, decision, cancellationReason);
  if (result.success) {
    revalidatePath('/dvmf/operations');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function createHealthcareSlot(input: CreateHealthcareSlotInput) {
  const result = await createHealthcareSlotService(input);
  if (result.success) {
    revalidatePath('/dvmf/operations');
  }
  return result;
}

export async function getDvmfHealthcareCalendarWeek(weekStartIso?: string) {
  return getDvmfHealthcareCalendarWeekService(weekStartIso);
}

export async function getDvmfHealthcareCalendar(view: HealthcareCalendarView, referenceIso?: string) {
  return getDvmfHealthcareCalendarService(view, referenceIso);
}

export async function getDvmfHealthcareServicesForOwner() {
  return getDvmfHealthcareServicesForOwnerService();
}

export async function saveDvmfHealthcareService(input: UpsertHealthcareServiceInput) {
  const result = await upsertDvmfHealthcareServiceService(input);
  if (result.success) {
    revalidatePath('/dvmf/operations');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function removeDvmfHealthcareService(serviceId: string) {
  const result = await removeDvmfHealthcareServiceService(serviceId);
  if (result.success) {
    revalidatePath('/dvmf/operations');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function getDvmfBranchProfile() {
  return getDvmfBranchProfileService();
}

export async function updateDvmfBranchProfile(input: UpdateDvmfBranchProfileInput) {
  const result = await updateDvmfBranchProfileService(input);
  if (result.success) {
    revalidatePath('/dvmf/operations');
    revalidatePath('/dashboard');
    revalidatePath('/dvmf');
  }
  return result;
}

export async function initiateMayaCheckout(appointmentRequestId: string) {
  const result = await initiateMayaCheckoutService(appointmentRequestId);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dvmf/operations');
  }
  return result;
}

export async function syncMayaPaymentStatus(
  appointmentRequestId: string,
  options?: { assumePaidOnSuccessReturn?: boolean }
) {
  const result = await syncMayaPaymentStatusService(appointmentRequestId, options);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/dvmf/operations');
    revalidatePath('/healthcare');
  }
  return result;
}
