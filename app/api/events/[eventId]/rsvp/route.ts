import { NextResponse } from 'next/server';
import { rsvpEventService } from '@/lib/server/services/events.service';

type Params = {
  params: {
    eventId: string;
  };
};

export async function POST(_: Request, { params }: Params) {
  if (!params?.eventId) {
    return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
  }

  const result = await rsvpEventService(params.eventId);
  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}