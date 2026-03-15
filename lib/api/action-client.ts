import type { ApiActionArgs, ApiDomain, ApiDomainAction } from '@/lib/api/contracts';

export type ApiActionResult<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
};

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
  const response = await fetch(`/api/${domain}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, args }),
  });

  const result = (await response.json()) as ApiActionResult<T>;
  if (!response.ok && !result.error) {
    return {
      success: false,
      error: 'Request failed',
    };
  }

  return result;
}