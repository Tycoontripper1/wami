import { apiClient } from '@/services/api/client';
import { profileService } from '@/services/api/profileService';

/** The expiry time in ms, when the token is a JWT that carries one. Anything else returns null. */
export function tokenExpiry(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Has the signed-in session run out? A token that states its own expiry is
 * judged on the spot, with no network call. Any other token is asked about:
 * the server answers 401 for a dead one, which the API client turns into the
 * app-wide sign-out. A network blip or a 500 says nothing about the session,
 * so it is treated as "still fine".
 */
export async function isSessionExpired(): Promise<boolean> {
  const token = apiClient.getAuthToken();
  if (!token) return false;

  const expiry = tokenExpiry(token);
  if (expiry !== null) return expiry <= Date.now();

  try {
    await profileService.getProfile();
    return false;
  } catch (error: any) {
    return error?.statusCode === 401;
  }
}
