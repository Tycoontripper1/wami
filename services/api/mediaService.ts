import { File } from 'expo-file-system';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

// POST /media — multipart { file, kind: 'image' }. Max 10 MB; JPEG, PNG, WebP or HEIC.
// The id that comes back is what a listing wants in media_ids.

/** Uploads one picked photo and returns its media id. */
export const uploadImage = async (uri: string, _mimeType?: string | null): Promise<string> => {
  const form = new FormData();
  // Expo's fetch only sends a Blob or File as a file part (the old
  // { uri, name, type } object is rejected), and File reads the picked
  // photo from disk with its name and type taken from the path.
  form.append('file', new File(uri) as any);
  form.append('kind', 'image');

  const res: any = await apiClient.post(API_ENDPOINTS.MEDIA.UPLOAD, form, { timeout: 60000 });
  const body = res?.data ?? res;
  const id = body?.id ?? body?.media_id ?? body?.media?.id;
  if (id === undefined || id === null) throw new Error('The upload did not return a photo id.');
  return String(id);
};

/** Uploads several photos in order and returns their ids. Stops at the first failure. */
export const uploadImages = async (assets: Array<string | { uri: string; mimeType?: string | null }>): Promise<string[]> => {
  const ids: string[] = [];
  for (const asset of assets) {
    ids.push(typeof asset === 'string' ? await uploadImage(asset) : await uploadImage(asset.uri, asset.mimeType));
  }
  return ids;
};

// DELETE /media/:id — only while it isn't attached to a listing (409 otherwise).
export const deleteMedia = async (id: string | number) => apiClient.delete(API_ENDPOINTS.MEDIA.BY_ID(id));
