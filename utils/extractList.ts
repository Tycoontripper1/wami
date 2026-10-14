// The backend returns lists in more than one shape depending on the endpoint:
// a bare array, `{ items: [...] }` (discovery), or Laravel's paginator
// `{ current_page, data: [...], ... }` (bookings, products, ...). Reading
// only one of them silently renders an empty screen, so every list read goes
// through here.
export function extractList<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}
