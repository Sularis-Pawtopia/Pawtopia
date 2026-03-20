import { NextResponse } from 'next/server';
import { processMayaWebhookService } from '@/lib/server/services/healthcare-payment.service';

export async function POST(request: Request) {
  const signature =
    request.headers.get('x-maya-signature') ||
    request.headers.get('x-paymaya-signature') ||
    request.headers.get('x-signature') ||
    request.headers.get('signature');
  const rawBody = await request.text();

  const result = await processMayaWebhookService(rawBody, signature);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: result.statusCode }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
  });
}
