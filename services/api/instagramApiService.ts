// Instagram connect + import — the backend's real OAuth flow.
//
// Verified against the live API (2026-10-14):
//   GET    /instagram/connect     -> { success, oauth_url }   (open it in a browser)
//   GET    /instagram/status      -> { success, connected, ...profile fields when connected }
//   POST   /instagram/import      -> imports the connected account's posts as offerings;
//                                    422 "No Instagram account connected" until connected
//   DELETE /instagram/disconnect  -> drops the connection
//
// The browser step is done by the app (see hooks/useInstagramConnection.ts):
// Instagram redirects to the backend's callback page, which exchanges the code.
// The app then simply asks /instagram/status whether that worked.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface InstagramStatus {
  connected: boolean;
  username?: string;
  [key: string]: any;
}

export interface InstagramImportResult {
  /** How many posts were imported, when the backend says; undefined otherwise. */
  count?: number;
  message?: string;
  raw: any;
}

const asString = (v: any): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);

/** GET /instagram/connect — the Instagram OAuth URL to open in a browser. */
export async function getInstagramConnectUrl(): Promise<string> {
  const res = await apiClient.get<any>(API_ENDPOINTS.INSTAGRAM.CONNECT, { raw: true });
  const url = asString(res.data?.oauth_url) ?? asString(res.data?.url) ?? asString(res.data?.data?.oauth_url);
  if (!url) throw new Error('The server did not return an Instagram link. Please try again.');
  return url;
}

/** GET /instagram/status */
export async function getInstagramStatus(): Promise<InstagramStatus> {
  const res = await apiClient.get<any>(API_ENDPOINTS.INSTAGRAM.STATUS, { raw: true });
  const body = res.data ?? {};
  const account = body.account ?? body.instagram ?? body.data ?? {};
  return {
    ...body,
    connected: Boolean(body.connected ?? account.connected),
    username: asString(body.username) ?? asString(body.instagram_username) ?? asString(account.username),
  };
}

/** POST /instagram/import */
export async function importInstagramPosts(): Promise<InstagramImportResult> {
  const res = await apiClient.post<any>(API_ENDPOINTS.INSTAGRAM.IMPORT, {}, { raw: true });
  const body = res.data ?? {};
  const list = body.offerings ?? body.imported ?? body.items ?? body.data;
  const count =
    typeof body.imported_count === 'number' ? body.imported_count
    : typeof body.count === 'number' ? body.count
    : typeof body.imported === 'number' ? body.imported
    : typeof body.total === 'number' ? body.total
    : Array.isArray(list) ? list.length
    : undefined;
  return { count, message: asString(body.message), raw: body };
}

/** DELETE /instagram/disconnect */
export async function disconnectInstagram(): Promise<void> {
  await apiClient.delete<any>(API_ENDPOINTS.INSTAGRAM.DISCONNECT);
}
