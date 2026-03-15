import { NextRequest, NextResponse } from 'next/server';
import {
  createEventService,
  getEventsService,
  type CreateEventInput,
} from '@/lib/server/services/events.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const upcoming = searchParams.get('upcoming') === 'true';
  const shelterId = searchParams.get('shelterId') || undefined;
  const eventType = searchParams.get('eventType') || undefined;

  const result = await getEventsService({ upcoming, shelterId, eventType });
  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateEventInput;

  if (!body?.event_name || !body?.event_date || !body?.event_type || !body?.location || !body?.description) {
    return NextResponse.json(
      { success: false, error: 'Missing required event fields' },
      { status: 400 }
    );
  }

  const result = await createEventService(body);
  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}