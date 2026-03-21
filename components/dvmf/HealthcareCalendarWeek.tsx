'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { notify } from '@/lib/ui/notify';

interface HealthcareCalendarWeekProps {
  initialCalendarData: {
    view: 'day' | 'week' | 'month';
    period_start: string;
    period_end: string;
    slots: any[];
  } | null;
}

const dayFormatter = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const monthHeaderFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'long',
  year: 'numeric',
});

function toWeekStart(iso: string) {
  const base = new Date(iso);
  const weekday = base.getUTCDay();
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() + offsetToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function toIsoDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toReferenceIsoAtNoon(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)).toISOString();
}

function toReadableTime(timeValue?: string) {
  if (!timeValue) return 'Time not set';
  const [hoursRaw, minutesRaw] = timeValue.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return timeValue;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalized = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalized}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function minutesToReadableTime(totalMinutes: number) {
  const bounded = Math.max(0, Math.min(DAY_END_MINUTE, totalMinutes));
  const normalized = bounded === DAY_END_MINUTE ? 0 : bounded;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return toReadableTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'approved_pending_payment':
      return 'border-blue-300 bg-blue-50 text-blue-800';
    case 'paid_scheduled':
      return 'border-violet-300 bg-violet-50 text-violet-800';
    case 'completed':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    case 'cancelled':
      return 'border-rose-300 bg-rose-50 text-rose-800';
    case 'pending_approval':
    default:
      return 'border-amber-300 bg-amber-50 text-amber-800';
  }
}

const HOUR_ROW_HEIGHT = 56;
const DAY_START_MINUTE = 0;
const DAY_END_MINUTE = 24 * 60;

function parseTimeToMinutes(timeValue?: string) {
  if (!timeValue) return null;
  const [hoursPart, minutesPart] = String(timeValue).split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function resolveDisplayRange(startMinute: number, endMinute: number) {
  // Always place events using exact minute boundaries for accurate visual positioning.
  return { displayStart: startMinute, displayEnd: endMinute };
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

export function HealthcareCalendarWeek({ initialCalendarData }: HealthcareCalendarWeekProps) {
  const [calendarData, setCalendarData] = useState(initialCalendarData);
  const [view, setView] = useState<'day' | 'week' | 'month'>(initialCalendarData?.view || 'week');
  const [isPending, startTransition] = useTransition();
  const [isStatusActionPending, startStatusActionTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [statusActionTab, setStatusActionTab] = useState<'payment' | 'outcome'>('payment');
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const dayDateInputRef = useRef<HTMLInputElement | null>(null);

  const periodStart = useMemo(() => {
    if (calendarData?.period_start) {
      return new Date(calendarData.period_start);
    }
    return toWeekStart(new Date().toISOString());
  }, [calendarData?.period_start]);

  const dayCount = useMemo(() => {
    if (view === 'day') return 1;
    if (view === 'week') return 7;
    return new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).getDate();
  }, [view, periodStart]);

  const days = useMemo(() => {
    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(periodStart);
      date.setDate(periodStart.getDate() + index);
      return {
        date,
        key: toIsoDateKey(date),
      };
    });
  }, [dayCount, periodStart]);

  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const day of days) {
      grouped.set(day.key, []);
    }

    for (const slot of calendarData?.slots || []) {
      const key = slot.preferred_date || toIsoDateKey(new Date(slot.slot_start));
      const current = grouped.get(key) || [];
      current.push(slot);
      grouped.set(key, current);
    }

    for (const day of days) {
      const list = grouped.get(day.key) || [];
      list.sort((a, b) => {
        const timeA = a.preferred_time || '00:00';
        const timeB = b.preferred_time || '00:00';
        return timeA.localeCompare(timeB);
      });
      grouped.set(day.key, list);
    }

    return grouped;
  }, [days, calendarData?.slots]);

  const loadCalendar = (nextView: 'day' | 'week' | 'month', targetIso?: string) => {
    setError(null);
    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'getDvmfHealthcareCalendar', [nextView, targetIso]);
      if (!result.success || result.error) {
        const message = result.error || 'Failed to load healthcare calendar week';
        setError(message);
        notify.error({ title: 'Calendar load failed', description: message });
        return;
      }
      setView(nextView);
      setCalendarData(result.data);
    });
  };

  const refreshCurrentCalendar = async () => {
    const targetIso = calendarData?.period_start || toReferenceIsoAtNoon(periodStart);
    const result = await callApiAction<any>('healthcare', 'getDvmfHealthcareCalendar', [view, targetIso]);
    if (!result.success || result.error) {
      const message = result.error || 'Failed to refresh calendar data';
      setStatusActionError(message);
      notify.error({ title: 'Refresh failed', description: message });
      return;
    }
    setCalendarData(result.data);
  };

  const openAppointmentDetails = (appointment: any) => {
    const isAwaitingPayment = appointment?.status === 'approved_pending_payment';
    setSelectedAppointment(appointment);
    setStatusActionTab(isAwaitingPayment ? 'payment' : 'outcome');
    setCancellationReason('');
    setStatusActionError(null);
  };

  const closeAppointmentDetails = () => {
    setSelectedAppointment(null);
    setStatusActionError(null);
    setCancellationReason('');
  };

  const handleStatusAction = (decision: 'mark_paid' | 'mark_completed' | 'mark_cancelled') => {
    if (!selectedAppointment?.id) return;

    if (decision === 'mark_cancelled' && !cancellationReason.trim()) {
      const message = 'Cancellation reason is required so the client can see why it was cancelled.';
      setStatusActionError(message);
      notify.error({ title: 'Cancellation requires reason', description: message });
      return;
    }

    setStatusActionError(null);
    startStatusActionTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'manageHealthcareAppointmentStatus', [
        selectedAppointment.id,
        decision,
        decision === 'mark_cancelled' ? cancellationReason.trim() : undefined,
      ]);

      if (!result.success || result.error) {
        const message = result.error || 'Failed to update appointment status';
        setStatusActionError(message);
        notify.error({ title: 'Status update failed', description: message });
        return;
      }

      const merged = {
        ...selectedAppointment,
        ...(result.data || {}),
      };
      setSelectedAppointment(merged);

      await refreshCurrentCalendar();

      if (decision === 'mark_paid') {
        notify.success({ title: 'Appointment marked paid' });
      } else if (decision === 'mark_completed') {
        notify.success({ title: 'Appointment marked completed' });
      } else {
        notify.success({ title: 'Appointment cancelled' });
      }

      if (decision === 'mark_cancelled') {
        closeAppointmentDetails();
      }
    });
  };

  const goPrevious = () => {
    const target = new Date(periodStart);
    if (view === 'day') {
      target.setDate(periodStart.getDate() - 1);
    } else if (view === 'week') {
      target.setDate(periodStart.getDate() - 7);
    } else {
      target.setMonth(periodStart.getMonth() - 1);
    }
    loadCalendar(view, toReferenceIsoAtNoon(target));
  };

  const goNext = () => {
    const target = new Date(periodStart);
    if (view === 'day') {
      target.setDate(periodStart.getDate() + 1);
    } else if (view === 'week') {
      target.setDate(periodStart.getDate() + 7);
    } else {
      target.setMonth(periodStart.getMonth() + 1);
    }
    loadCalendar(view, toReferenceIsoAtNoon(target));
  };

  const visibleDays = days;

  const periodLabel = useMemo(() => {
    if (view === 'day') {
      return fullDateFormatter.format(periodStart);
    }
    if (view === 'week') {
      const end = new Date(periodStart);
      end.setDate(periodStart.getDate() + 6);
      return `${dayFormatter.format(periodStart)} - ${dayFormatter.format(end)}`;
    }
    return monthHeaderFormatter.format(periodStart);
  }, [view, periodStart]);

  const countAppointments = (daySlots: any[]) =>
    daySlots.reduce((total, slot) => total + (slot.appointments?.length || 0), 0);

  const dayTimelineEvents = useMemo(() => {
    if (view !== 'day') return [] as any[];

    const dayKey = visibleDays[0]?.key || '';
    const daySlots = slotsByDay.get(dayKey) || [];
    const flatAppointments = daySlots.flatMap((slot: any) => slot.appointments || []);

    const normalized = flatAppointments
      .map((appt: any) => {
        const startMinute = parseTimeToMinutes(appt.preferred_time);
        if (startMinute === null) return null;

        const duration = Number(appt.service?.duration_minutes || 60);
        const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 60;
        const endMinuteRaw = startMinute + safeDuration;
        const endMinute = Math.min(DAY_END_MINUTE, Math.max(startMinute + 1, endMinuteRaw));
        const { displayStart, displayEnd } = resolveDisplayRange(startMinute, endMinute);

        return {
          ...appt,
          startMinute,
          endMinute,
          displayStart: Math.max(DAY_START_MINUTE, displayStart),
          displayEnd: Math.min(DAY_END_MINUTE, Math.max(displayStart + 1, displayEnd)),
          column: 0,
          columns: 1,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.displayStart - b.displayStart || a.displayEnd - b.displayEnd);

    const events = normalized as any[];
    const active: any[] = [];

    for (const event of events) {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].displayEnd <= event.displayStart) {
          active.splice(i, 1);
        }
      }

      const usedColumns = new Set(active.map((entry) => entry.column));
      let nextColumn = 0;
      while (usedColumns.has(nextColumn)) nextColumn += 1;
      event.column = nextColumn;
      active.push(event);
    }

    for (const event of events) {
      const overlapping = events.filter((candidate) =>
        overlaps(
          { start: event.displayStart, end: event.displayEnd },
          { start: candidate.displayStart, end: candidate.displayEnd }
        )
      );
      const maxColumn = overlapping.reduce((max, current) => Math.max(max, current.column), 0);
      event.columns = Math.max(1, maxColumn + 1);
    }

    return events;
  }, [view, visibleDays, slotsByDay]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Healthcare Calendar</h3>
          {view === 'day' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (dayDateInputRef.current?.showPicker) {
                    dayDateInputRef.current.showPicker();
                    return;
                  }
                  dayDateInputRef.current?.focus();
                  dayDateInputRef.current?.click();
                }}
                className="text-2xl font-semibold text-gray-900 tracking-tight hover:text-primary-700 underline decoration-dotted underline-offset-4"
                title="Change date"
              >
                {fullDateFormatter.format(periodStart)}
              </button>
              <input
                ref={dayDateInputRef}
                type="date"
                value={toDateInputValue(periodStart)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value) return;
                  const [year, month, day] = value.split('-').map(Number);
                  const next = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
                  loadCalendar('day', next.toISOString());
                }}
                disabled={isPending}
                className="sr-only"
                aria-label="Select appointment date"
              />
            </>
          ) : (
            <p className="text-sm text-gray-500">{periodLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            {(['day', 'week', 'month'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => {
                  if (candidate === 'day' && view !== 'day') {
                    loadCalendar('day', toReferenceIsoAtNoon(new Date()));
                    return;
                  }
                  loadCalendar(candidate, toReferenceIsoAtNoon(periodStart));
                }}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${view === candidate ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {candidate[0].toUpperCase() + candidate.slice(1)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goPrevious}
            disabled={isPending}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={isPending}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>

      {view === 'day' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Daily Appointments</p>
            <p className="text-xs font-medium text-gray-500">
              {countAppointments(slotsByDay.get(visibleDays[0]?.key || '') || [])} booking(s)
            </p>
          </div>
          <div className="p-3 md:p-4">
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[84px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200" />
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-500">
                  Appointment Timeline
                </div>

                <div className="relative border-r border-gray-200 bg-gray-50">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={`label-${hour}`}
                      className="h-14 border-b border-gray-100 px-2 pt-1 text-[11px] text-gray-500"
                    >
                      {toReadableTime(`${String(hour).padStart(2, '0')}:00`)}
                    </div>
                  ))}
                </div>

                <div className="relative bg-white" style={{ height: `${HOUR_ROW_HEIGHT * 24}px` }}>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={`row-${hour}`}
                      className="absolute left-0 right-0 border-b border-gray-100"
                      style={{ top: `${hour * HOUR_ROW_HEIGHT}px` }}
                    />
                  ))}

                  {dayTimelineEvents.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                      No appointments scheduled for this day.
                    </div>
                  ) : (
                    dayTimelineEvents.map((event) => {
                      const top = ((event.displayStart - DAY_START_MINUTE) / 60) * HOUR_ROW_HEIGHT;
                      const height = Math.max(22, ((event.displayEnd - event.displayStart) / 60) * HOUR_ROW_HEIGHT);
                      const columnWidth = 100 / event.columns;
                      const left = event.column * columnWidth;

                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => openAppointmentDetails(event)}
                          className={`absolute rounded-lg border px-2 py-1 text-left overflow-hidden transition hover:shadow-md ${getStatusStyles(event.status)}`}
                          style={{
                            top: `${top + 1}px`,
                            height: `${height - 2}px`,
                            left: `calc(${left}% + 2px)`,
                            width: `calc(${columnWidth}% - 4px)`,
                          }}
                        >
                          <p className="text-[11px] font-semibold truncate">{event.service?.service_name || 'Healthcare Service'}</p>
                          <p className="text-[10px] mt-0.5 truncate">{toReadableTime(event.preferred_time)} - {minutesToReadableTime(event.endMinute)}</p>
                          <p className="text-[10px] mt-0.5 truncate">{event.pet?.name || 'Unknown Pet'} • {event.requester?.username || 'Unknown owner'}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3`}>
        {visibleDays.map((day) => {
          const daySlots = slotsByDay.get(day.key) || [];
          const appointmentCount = countAppointments(daySlots);
          const isToday = toIsoDateKey(new Date()) === day.key;

          return (
            <div key={day.key} className={`bg-white rounded-xl border min-h-[280px] flex flex-col overflow-hidden ${
              isToday ? 'border-blue-300 shadow-sm ring-1 ring-blue-100' : 'border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <p className={`text-sm font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {dayFormatter.format(day.date)}
                </p>
                <p className={`text-xs mt-1 ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                  {appointmentCount} appointment{appointmentCount === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                {appointmentCount === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-xs text-gray-400">No appointments</p>
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const appointments = slot.appointments || [];
                    if (appointments.length === 0) return null;

                    return (
                      <div key={slot.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-2">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-gray-700">{toReadableTime(slot.preferred_time)}</p>
                          {appointments.length > 1 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold">
                              {appointments.length} at this time
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          {appointments.map((appt: any) => (
                            <button
                              key={appt.id}
                              type="button"
                              onClick={() => openAppointmentDetails(appt)}
                              className={`w-full text-left p-2 rounded-md border transition hover:shadow-sm ${getStatusStyles(appt.status)}`}
                            >
                              <p className="text-xs font-semibold truncate">{appt.service?.service_name || 'Healthcare Service'}</p>
                              <p className="text-[11px] mt-0.5 truncate">{appt.pet?.name || 'Unknown Pet'} • {appt.requester?.username || 'Unknown owner'}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment ? (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-start justify-center pt-8 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Appointment Details</h2>
                <p className="text-xs text-white/85 mt-1">Manage payment and outcome status in one place.</p>
              </div>
              <button
                onClick={closeAppointmentDetails}
                className="text-white/90 hover:text-white text-2xl leading-none font-light"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Highlights */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(String(selectedAppointment.status || 'pending_approval'))}`}>
                    {String(selectedAppointment.status || 'pending_approval').replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {Boolean(selectedAppointment.payment_required) && Number(selectedAppointment.total_fee || 0) > 0 ? (
                    ['paid_scheduled', 'completed', 'cancelled'].includes(String(selectedAppointment.status)) ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Payment: Paid</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Payment: Unpaid</span>
                    )
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Free Service</span>
                  )}
                  {selectedAppointment.status === 'completed' ? (
                    <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Outcome: Done</span>
                  ) : null}
                  {selectedAppointment.status === 'cancelled' ? (
                    <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Outcome: Cancelled</span>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Current Status</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{String(selectedAppointment.status || 'pending_approval').replace(/_/g, ' ')}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Payment</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {Boolean(selectedAppointment.payment_required) && Number(selectedAppointment.total_fee || 0) > 0
                        ? ['paid_scheduled', 'completed', 'cancelled'].includes(String(selectedAppointment.status))
                          ? 'Paid'
                          : 'Not yet paid'
                        : 'No payment needed'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-gray-200 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Outcome</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {selectedAppointment.status === 'completed'
                        ? 'Completed'
                        : selectedAppointment.status === 'cancelled'
                          ? 'Cancelled'
                          : 'In progress'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
                <div className="space-y-5">
                  {/* Pet Info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pet</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-red-400 flex items-center justify-center text-white font-bold text-sm">
                        {selectedAppointment.pet?.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedAppointment.pet?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{selectedAppointment.pet?.species || 'Unknown species'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Requester</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                        {selectedAppointment.requester?.username?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedAppointment.requester?.username || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{selectedAppointment.requester?.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</p>
                    <p className="mt-2 font-semibold text-gray-900">{selectedAppointment.service?.service_name || 'Healthcare Service'}</p>
                    <p className="text-xs text-gray-600 mt-1">Type: {selectedAppointment.service?.service_type || 'General'}</p>
                  </div>

                  {/* Appointment Time */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preferred Schedule</p>
                    <div className="mt-2">
                      <span className="block text-sm font-semibold text-gray-900">{selectedAppointment.preferred_date}</span>
                      <span className="block text-sm font-semibold text-sky-700 mt-0.5">{toReadableTime(selectedAppointment.preferred_time)}</span>
                    </div>
                  </div>

                  {/* Reason */}
                  {selectedAppointment.reason ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</p>
                      <p className="mt-2 text-sm text-gray-700">{selectedAppointment.reason}</p>
                    </div>
                  ) : null}

                  {/* Notes */}
                  {selectedAppointment.requester_notes ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
                      <p className="mt-2 text-sm text-gray-700">{selectedAppointment.requester_notes}</p>
                    </div>
                  ) : null}

                  {selectedAppointment.status === 'cancelled' && selectedAppointment.review_notes ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                      <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Cancellation Reason</p>
                      <p className="text-sm text-rose-800 mt-1">{selectedAppointment.review_notes}</p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {/* Pricing */}
                  <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-semibold text-gray-900">₱{Number(selectedAppointment.service_base_fee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-semibold text-gray-900">₱{Number(selectedAppointment.platform_service_fee || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">Total Fee</span>
                        <span className="font-bold text-gray-900">₱{Number(selectedAppointment.total_fee || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Controls */}
                  <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status Controls</p>

                    <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setStatusActionTab('payment')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                          statusActionTab === 'payment' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusActionTab('outcome')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                          statusActionTab === 'outcome' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Outcome
                      </button>
                    </div>

                    {statusActionError ? (
                      <div className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700">
                        {statusActionError}
                      </div>
                    ) : null}

                    {statusActionTab === 'payment' ? (
                      <div className="space-y-2">
                        {selectedAppointment.status === 'approved_pending_payment' && Boolean(selectedAppointment.payment_required) && Number(selectedAppointment.total_fee || 0) > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleStatusAction('mark_paid')}
                            disabled={isStatusActionPending}
                            className="w-full rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {isStatusActionPending ? 'Updating...' : 'Mark as Paid (Cash Received)'}
                          </button>
                        ) : (
                          <p className="text-xs text-gray-600">No payment action available for this appointment state.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedAppointment.status === 'paid_scheduled' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusAction('mark_completed')}
                              disabled={isStatusActionPending}
                              className="w-full rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {isStatusActionPending ? 'Updating...' : 'Mark as Completed'}
                            </button>
                            <textarea
                              value={cancellationReason}
                              onChange={(event) => setCancellationReason(event.target.value)}
                              rows={3}
                              placeholder="Cancellation reason (required if you cancel)..."
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleStatusAction('mark_cancelled')}
                              disabled={isStatusActionPending}
                              className="w-full rounded-lg bg-rose-600 text-white px-3 py-2 text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                            >
                              {isStatusActionPending ? 'Updating...' : 'Cancel Appointment'}
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-gray-600">Outcome controls are available only after the appointment is marked paid and scheduled.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requested At */}
              <p className="text-xs text-gray-500">
                Requested on {new Date(selectedAppointment.created_at).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <button
                onClick={closeAppointmentDetails}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {view !== 'week' && visibleDays.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
          No appointments in this {view} range yet.
        </div>
      ) : null}
    </div>
  );
}
