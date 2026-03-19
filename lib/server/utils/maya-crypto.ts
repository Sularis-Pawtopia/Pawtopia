import crypto from 'crypto';

export function signMayaPayload(payload: string, secret: string) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export function verifyMayaSignature(payload: string, signature: string | null, secret: string) {
  if (!signature || !secret) {
    return false;
  }

  const provided = signature.trim();
  const normalized = provided.includes('=') ? provided.split('=').pop() || '' : provided;
  const expected = signMayaPayload(payload, secret);

  const providedBuffer = Buffer.from(normalized, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
