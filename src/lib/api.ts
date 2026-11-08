import type { ApiFailure, Session } from './types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export function failure(error: unknown): ApiFailure {
  return {
    message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
    status: error instanceof ApiError ? error.status : 0,
  };
}
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: options.signal || AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
        ? 'The request took too long. Please try again.'
        : 'We couldn’t connect to the store. Please try again shortly.',
      0,
    );
  }
  const payload = (await response.json().catch(() => null)) as {
    status?: string;
    message?: string | string[];
    data?: T;
  } | null;
  if (!response.ok || payload?.status === 'error') {
    if (response.status === 401 && options.token)
      window.dispatchEvent(new CustomEvent('barakah:session-expired', { detail: options.token }));
    const message = payload?.message;
    throw new ApiError(
      Array.isArray(message)
        ? message.join(' · ')
        : message || 'The store could not complete your request. Please try again.',
      response.status,
    );
  }
  if (!payload || !('data' in payload))
    throw new ApiError('The store returned an unexpected response. Please try again.', 502);
  return payload.data as T;
}
export const sessionToken = (state: unknown) =>
  (state as { auth: { session: Session | null } }).auth.session?.token;
export const sessionRole = (state: unknown) =>
  (state as { auth: { session: Session | null } }).auth.session?.role;
export function loadSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem('barakah:session') || 'null');
    return value && typeof value.token === 'string' && ['admin', 'customer'].includes(value.role)
      ? value
      : null;
  } catch {
    return null;
  }
}
