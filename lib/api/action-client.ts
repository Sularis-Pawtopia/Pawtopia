import type { ApiActionArgs, ApiDomain, ApiDomainAction } from '@/lib/api/contracts';

export type ApiActionResult<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
};

function normalizeApiError(error: unknown, fallback = 'Request failed'): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    const normalized = error.trim();
    if (!normalized || normalized === '{}' || normalized === '[object Object]') {
      return fallback;
    }
    return normalized;
  }

  if (typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      const normalized = maybeMessage.trim();
      if (normalized && normalized !== '{}' && normalized !== '[object Object]') {
        return normalized;
      }
    }

    const maybeError = (error as { error?: unknown }).error;
    if (typeof maybeError === 'string') {
      const normalized = maybeError.trim();
      if (normalized && normalized !== '{}' && normalized !== '[object Object]') {
        return normalized;
      }
    }
  }

  return fallback;
}

export async function callApiAction<
  D extends ApiDomain,
  A extends ApiDomainAction<D>
>(
  domain: D,
  action: A,
  args: ApiActionArgs<D, A>
): Promise<ApiActionResult<unknown>>;

export async function callApiAction<T = unknown>(
  domain: ApiDomain,
  action: string,
  args: unknown[]
): Promise<ApiActionResult<T>>;

export async function callApiAction<T = unknown>(
  domain: ApiDomain,
  action: string,
  args: unknown[]
): Promise<ApiActionResult<T>> {
  try {
    const response = await fetch(`/api/${domain}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, args }),
    });

    let result: ApiActionResult<T>;
    try {
      result = (await response.json()) as ApiActionResult<T>;
    } catch {
      return {
        success: false,
        error: 'Unexpected response from server',
      };
    }

    if (!response.ok && !result.error) {
      return {
        success: false,
        error: 'Request failed',
      };
    }

    if (result.error) {
      return {
        ...result,
        success: false,
        error: normalizeApiError(result.error),
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: normalizeApiError(error, 'Network error. Please try again.'),
    };
  }
}