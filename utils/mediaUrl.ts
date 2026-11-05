// Wami's pictures live on Cloudinary. Listing photos arrive as full links, but
// profile photos arrive as a bare id ("wami/profile-images/abc"), which is the
// same file under this base.
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dtfn6grwf/image/upload/';

/**
 * A link that can be shown for a picture the API returned: full links pass
 * through, a bare Wami storage id is turned into its Cloudinary link, and
 * anything else gives undefined so the screen shows initials or a placeholder.
 */
export function absoluteUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^wami\//i.test(value)) return `${CLOUDINARY_BASE}w_400,c_fill,q_auto,f_auto/${value}`;
  return undefined;
}

export function initials(name?: string | null): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
