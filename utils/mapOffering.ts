import type { CreativeData } from '@/components/SwipeableCardStack';
import type { DiscoveryOffering } from '@/services/api/discoveryService';

// Map a backend discovery offering onto the card shape the Home feed and the
// swipe stack share.
export const mapOfferingToCreativeData = (offering: DiscoveryOffering): CreativeData => ({
  id: String(offering.id ?? offering.offering_id),
  name: offering.name || offering.title || 'Untitled',
  role: offering.role || offering.category || '',
  location: offering.location?.city
    ? `${offering.location.city}${offering.location.region ? ', ' + offering.location.region : ''}`
    : '',
  distance: offering.distance_km !== undefined ? `${offering.distance_km.toFixed(1)} km away` : undefined,
  rating: offering.rating ?? 0,
  reviews: offering.reviews ?? offering.reviews_count ?? 0,
  // The backend's discovery items carry `media_url` / `thumbnail_url`; with
  // none of them the card shows its own neutral placeholder rather than a
  // stock photo that looks like the creative's work.
  image: (() => {
    const uri = offering.media_url || offering.thumbnail_url || offering.image || offering.images?.[0];
    return uri ? { uri } : undefined;
  })(),
  video: offering.video,
  tags: offering.tags?.slice(0, 3),
  creatorId: offering.creator?.id !== undefined ? String(offering.creator.id) : undefined,
  creatorName: offering.creator?.name,
  creatorUsername: offering.creator?.username,
  creatorImage: offering.creator?.profile_image || undefined,
  caption: (typeof offering.description === 'string' ? offering.description.trim() : '') || undefined,
});
