import { ApiError } from '@/services/api/types';

// The backend currently restricts a few actions (listing an offering,
// viewing the bookings calendar) to creative accounts, even though the
// product intent is that any account can buy or sell — confirmed with
// backend, fix pending on their side. Detect that specific temporary
// restriction so screens can show an honest "coming soon" message instead
// of a generic error, without guessing at every possible 403 reason.
export function isCreativeOnlyRestriction(error: unknown): boolean {
  const apiError = error as Partial<ApiError> | undefined;
  // Backend's wording varies by endpoint ("Only creatives can view bookings
  // calendar." vs "...creative accounts (promote or both)."), so match
  // loosely on "creative" rather than one exact phrase.
  return apiError?.statusCode === 403 && /creative/i.test(apiError?.message ?? '');
}

export const CREATIVE_ONLY_RESTRICTION_MESSAGE =
  "This is available to every account, but the backend is still finishing the update that turns it on for everyone. Please check back soon!";
