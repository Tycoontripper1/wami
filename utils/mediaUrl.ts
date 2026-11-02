/**
 * Pictures from the API are meant to be links, but some profile photos arrive as
 * a bare storage id ("wami/profile-images/abc"), which cannot be shown. Return a
 * usable link, or undefined so the screen shows initials instead.
 */
export function absoluteUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  return /^https?:\/\//i.test(value) ? value : undefined;
}

export function initials(name?: string | null): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
