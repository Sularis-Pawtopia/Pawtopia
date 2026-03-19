'use client';

import { useMemo, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface HealthcareCalendarWeekProps {
  initialCalendarData: {
    view: 'week' | 'month' | 'year';
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

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
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

export function HealthcareCalendarWeek({ initialCalendarData }: HealthcareCalendarWeekProps) {
  const [calendarData, setCalendarData] = useState(initialCalendarData);
  const [view, setView] = useState<'week' | 'month' | 'year'>(initialCalendarData?.view || 'week');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const periodStart = useMemo(() => {
    if (calendarData?.period_start) {
      return new Date(calendarData.period_start);
    }
    return toWeekStart(new Date().toISOString());
  }, [calendarData?.period_start]);

  const dayCount = view === 'year' ? 366 : view === 'month' ? 31 : 7;

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
      const key = toIsoDateKey(new Date(slot.slot_start));
      const current = grouped.get(key) || [];
      current.push(slot);
      grouped.set(key, current);
    }

    for (const day of days) {
      const list = grouped.get(day.key) || [];
      list.sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime());
      grouped.set(day.key, list);
    }

    return grouped;
  }, [days, calendarData?.slots]);

  const loadCalendar = (nextView: 'week' | 'month' | 'year', targetIso?: string) => {
    setError(null);
    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'getDvmfHealthcareCalendar', [nextView, targetIso]);
      if (!result.success || result.error) {
        setError(result.error || 'Failed to load healthcare calendar week');
        return;
      }
      setView(nextView);
      setCalendarData(result.data);
    });
  };

  const goPrevious = () => {
    const target = new Date(periodStart);
    if (view === 'week') {
      target.setDate(periodStart.getDate() - 7);
    } else if (view === 'month') {
      target.setMonth(periodStart.getMonth() - 1);
    } else {
      target.setFullYear(periodStart.getFullYear() - 1);
    }
    loadCalendar(view, target.toISOString());
  };

  const goNext = () => {
    const target = new Date(periodStart);
    if (view === 'week') {
      target.setDate(periodStart.getDate() + 7);
    } else if (view === 'month') {
      target.setMonth(periodStart.getMonth() + 1);
    } else {
      target.setFullYear(periodStart.getFullYear() + 1);
    }
    loadCalendar(view, target.toISOString());
  };

  const visibleDays = useMemo(() => {
    if (view === 'week') {
      return days;
    }

    const withSlots = days.filter((day) => (slotsByDay.get(day.key) || []).length > 0);
    return withSlots.slice(0, view === 'month' ? 31 : 120);
  }, [days, slotsByDay, view]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Healthcare Calendar</h3>
          <p className="text-sm text-gray-500">Switch between weekly, monthly, and yearly appointment workload views.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            {(['week', 'month', 'year'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => loadCalendar(candidate, new Date().toISOString())}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === candidate ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {candidate[0].toUpperCase() + candidate.slice(1)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goPrevious}
            disabled={isPending}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={isPending}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${view === 'week' ? 'xl:grid-cols-7' : 'xl:grid-cols-4'} gap-3`}>
        {visibleDays.map((day) => {
          const daySlots = slotsByDay.get(day.key) || [];

          return (
            <div key={day.key} className="bg-white rounded-xl border border-gray-200 min-h-[260px] flex flex-col">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{dayFormatter.format(day.date)}</p>
                <p className="text-xs text-gray-500">{daySlots.length} slot{daySlots.length === 1 ? '' : 's'}</p>
              </div>

              <div className="p-3 space-y-2 overflow-y-auto max-h-[520px]">
                {daySlots.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-400">No slots configured.</div>
                ) : (
                  daySlots.map((slot) => {
                    const approved = Number(slot.approved_bookings_count || 0);
                    const capacity = Number(slot.capacity || 0);
                    const pending = (slot.appointments || []).filter((appointment: any) => appointment.status === 'pending_approval').length;

                    return (
                      <div key={slot.id} className="rounded-lg border border-gray-200 p-3 bg-orange-50/40">
                        <p className="text-xs font-semibold text-gray-800">
                          {timeFormatter.format(new Date(slot.slot_start))} - {timeFormatter.format(new Date(slot.slot_end))}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{slot.service?.service_name || 'Healthcare slot'}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            Approved {approved}/{capacity}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                            Pending {pending}
                          </span>
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

      {view !== 'week' && visibleDays.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
          No slots in this {view} range yet.
        </div>
      ) : null}
    </div>
  );
}
