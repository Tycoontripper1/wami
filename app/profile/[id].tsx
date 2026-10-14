import BookingModal from '@/components/BookingModal';
import EmptyState from '@/components/EmptyState';
import QuoteRequestModal from '@/components/QuoteRequestModal';
import Colors from '@/constants/Colors';
import { saveOffering, unsaveOffering } from '@/services/api/discoveryService';
import { ApiOffering, getOfferingById } from '@/services/api/offeringsService';
import { createReview, getReviews, ReviewableType } from '@/services/api/reviewsService';
import { addFavorite, removeFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// Reviews on this screen are scoped to the specific offering being viewed —
// confirmed live 2026-10-03 that 'App\Models\Offering' is the only valid
// reviewable_type for this kind of thing ('App\Models\User' is rejected
// outright). See reviewsService.ts for the full finding.
const REVIEWABLE_TYPE: ReviewableType = 'App\\Models\\Offering';

type DisplayReview = {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  isVerified: boolean;
  text: string;
  date: string;
};

const mapApiReview = (r: any, index: number): DisplayReview => ({
  id: String(r.id ?? index),
  userName: r.user?.name ?? r.user_name ?? r.author ?? 'Anonymous',
  avatar: r.user?.avatar ?? r.avatar ?? '',
  rating: Number(r.rating ?? 0),
  isVerified: Boolean(r.is_verified ?? r.verified ?? false),
  text: r.comment ?? r.text ?? '',
  date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '',
});

export default function ProfileScreen() {
  const params = useLocalSearchParams<{
    id: string;
    creatorId?: string;
    creatorName?: string;
    creatorUsername?: string;
  }>();
  const id = params.id;
  // The creative who owns this offering. GET /offerings/:id returns it as
  // `creator: {id, name, username, profile_image}` (confirmed live 2026-10-14),
  // so it's read from the loaded offering below. Params passed in by the
  // screen we came from are used first, so the buttons work before the
  // offering finishes loading.
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // The offering itself — real data (GET /offerings/:id), replacing what
  // used to be MOCK_PROFILE / getCreativeById (local mock data).
  const [offering, setOffering] = useState<ApiOffering | null>(null);
  const [isLoadingOffering, setIsLoadingOffering] = useState(true);
  const [offeringError, setOfferingError] = useState(false);
  const creatorId = params.creatorId || (offering?.creator?.id != null ? String(offering.creator.id) : undefined);
  const creatorName = params.creatorName || offering?.creator?.name || undefined;

  const loadOffering = useCallback(async () => {
    setIsLoadingOffering(true);
    setOfferingError(false);
    try {
      const res = await getOfferingById(id);
      setOffering(res.data);
    } catch (error) {
      console.error('Failed to load offering:', error);
      setOffering(null);
      setOfferingError(true);
    } finally {
      setIsLoadingOffering(false);
    }
  }, [id]);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  const [reviewsList, setReviewsList] = useState<DisplayReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingReviews(true);
      try {
        const res = await getReviews({ page: 1, reviewable_id: id, reviewable_type: REVIEWABLE_TYPE });
        const data: any = res.data;
        const raw = Array.isArray(data) ? data : data?.items ?? [];
        if (!cancelled) setReviewsList(raw.map(mapApiReview));
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        if (!cancelled) setIsLoadingReviews(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some((fav) => fav.id === id);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#fff',
    imagePlaceholder: isDark ? '#1a1a1a' : '#f0f0f0',
  };

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      dispatch(removeFavorite(String(id)));
      unsaveOffering(id).catch((error) => console.error('Failed to unsave offering:', error));
    } else {
      dispatch(addFavorite({
        id: String(id),
        name: creatorName || offering?.title || 'Untitled',
        role: offering?.category || '',
        location: '',
        rating: 0,
        reviews: 0,
        creatorId,
        creatorName,
      } as any));
      saveOffering(id).catch((error) => console.error('Failed to save offering:', error));
    }
  };

  // There's no "get or create conversation with user X" endpoint — the
  // collection's Messaging folder only has "Start Conversation"
  // (POST /v1/messages/conversations { recipient_id, body }), which needs a
  // first message. So this opens chat in "new conversation" mode (see
  // app/chat/[id].tsx) rather than assuming a conversation already exists.
  const handleMessage = () => {
    if (!creatorId) {
      Alert.alert("Can't Message", "We don't have this creative's info — try opening their profile from the feed again.");
      return;
    }
    router.push({
      pathname: '/chat/[id]',
      params: { id: 'new', recipientId: creatorId, name: creatorName ?? '', avatar: '' },
    } as any);
  };

  const handleOpenBooking = () => {
    if (!creatorId) {
      Alert.alert("Can't Book", "We don't have this creative's info — try opening their profile from the feed again.");
      return;
    }
    setShowBookingModal(true);
  };

  const handleOpenQuote = () => {
    if (!creatorId) {
      Alert.alert("Can't Request a Quote", "We don't have this creative's info — try opening their profile from the feed again.");
      return;
    }
    setShowQuoteModal(true);
  };

  // POST /v1/reviews — gated server-side by "you must have booked this
  // offering" (confirmed live 2026-10-03), so this will commonly fail for a
  // real reason, not a bug — surfaced below rather than swallowed.
  const handleAddReview = async () => {
    if (!newReviewText.trim() || isSubmittingReview) return;
    setIsSubmittingReview(true);
    setReviewSubmitError(null);
    try {
      const res = await createReview({
        reviewable_type: REVIEWABLE_TYPE,
        reviewable_id: id,
        rating: newRating,
        comment: newReviewText.trim(),
      });
      setReviewsList([mapApiReview(res.data ?? { rating: newRating, comment: newReviewText }, Date.now()), ...reviewsList]);
      setNewReviewText('');
      setNewRating(5);
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      setReviewSubmitError(error?.message ?? "Couldn't submit your review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Rating average/breakdown computed from this offering's own real
  // reviews — no fabricated baseline blended in.
  const reviewStats = useMemo(() => {
    const totalCount = reviewsList.length;
    const totalSum = reviewsList.reduce((sum, r) => sum + r.rating, 0);
    const average = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : '0.0';

    let fiveStar = 0, fourStar = 0, threeStar = 0, twoStar = 0, oneStar = 0;
    reviewsList.forEach(r => {
      if (r.rating === 5) fiveStar++;
      else if (r.rating === 4) fourStar++;
      else if (r.rating === 3) threeStar++;
      else if (r.rating === 2) twoStar++;
      else if (r.rating === 1) oneStar++;
    });

    const breakdown = [
      totalCount > 0 ? (fiveStar / totalCount) * 100 : 0,
      totalCount > 0 ? (fourStar / totalCount) * 100 : 0,
      totalCount > 0 ? (threeStar / totalCount) * 100 : 0,
      totalCount > 0 ? (twoStar / totalCount) * 100 : 0,
      totalCount > 0 ? (oneStar / totalCount) * 100 : 0,
    ];

    return { average, total: totalCount, breakdown };
  }, [reviewsList]);

  const offeringImage = offering?.thumbnail_url || offering?.media_url || offering?.image || offering?.images?.[0];
  // /products/:id and /offerings/:id both return price as a string
  // ("50000.00", a Laravel decimal cast) — coerce it. Confirmed live
  // 2026-10-03 (see app/checkout/index.tsx's matching fix).
  const price = offering ? Number(offering.price) || 0 : 0;

  if (isLoadingOffering) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (offeringError || !offering) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <TouchableOpacity style={styles.backBtnFloating} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't Load Profile"
          message="We couldn't load this listing. Please check your connection and try again."
          onRetry={loadOffering}
          retryLabel="Try Again"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {offeringImage ? (
            <Image source={{ uri: offeringImage }} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, styles.headerImagePlaceholder, { backgroundColor: themeColors.imagePlaceholder }]}>
              <Ionicons name="image-outline" size={48} color={themeColors.subText} />
            </View>
          )}

          <View style={[styles.headerActions, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#FF3B30' : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.headerInfo}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: themeColors.text }]}>{offering.title}</Text>
              {!!creatorName && (
                <View style={styles.subInfo}>
                  <Ionicons name="person-outline" size={16} color={themeColors.subText} />
                  <Text style={[styles.infoText, { color: themeColors.subText }]}>{creatorName}</Text>
                  {!!offering.category && (
                    <>
                      <View style={styles.dot} />
                      <Ionicons name="pricetag-outline" size={16} color={themeColors.subText} />
                      <Text style={[styles.infoText, { color: themeColors.subText }]}>{offering.category}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
            <View style={[styles.ratingBox, { backgroundColor: isDark ? '#2a2a2a' : '#F5F5F5' }]}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: themeColors.text }]}>{reviewStats.average}</Text>
              <Text style={[styles.reviewText, { color: themeColors.subText }]}>({reviewStats.total})</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

          {!!offering.description && (
            <>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About</Text>
              <Text style={[styles.bodyText, { color: themeColors.subText }]}>{offering.description}</Text>
            </>
          )}

          {!!offering.tags?.length && (
            <View style={styles.tagsContainer}>
              {offering.tags.map((tag: string, index: number) => (
                <View key={index} style={[styles.tag, { backgroundColor: isDark ? 'rgba(0,188,212,0.2)' : '#F0F9FA' }]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price Card */}
          <View style={[styles.priceCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <View style={styles.priceHeader}>
              <View style={styles.priceInfo}>
                <Ionicons name="cash-outline" size={20} color={Colors.light.primary} />
                <Text style={[styles.priceLabel, { color: themeColors.subText }]}>Price</Text>
              </View>
              <Text style={[styles.priceAmount, { color: themeColors.text }]}>
                {offering.currency === 'NGN' ? '₦' : `${offering.currency} `}{price.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.quoteButton} onPress={handleOpenQuote}>
              <Text style={styles.quoteButtonText}>Get Quote</Text>
            </TouchableOpacity>
          </View>

          {/* Reviews section */}
          <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 8 }]}>Reviews</Text>

          <View style={[styles.reviewsSummaryContainer, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <View style={styles.ratingSummaryLeft}>
              <Text style={[styles.ratingBigNumber, { color: themeColors.text }]}>{reviewStats.average}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(Number(reviewStats.average)) ? 'star' : 'star-outline'}
                    size={14}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text style={[styles.ratingTotalText, { color: themeColors.subText }]}>{reviewStats.total} reviews</Text>
            </View>
            <View style={[styles.dividerVertical, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
            <View style={styles.ratingBreakdownRight}>
              {reviewStats.breakdown.map((pct, idx) => {
                const starsCount = 5 - idx;
                return (
                  <View key={idx} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownStarText, { color: themeColors.subText }]}>{starsCount}★</Text>
                    <View style={[styles.breakdownProgressTrack, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
                      <View style={[styles.breakdownProgressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={[styles.breakdownPctText, { color: themeColors.subText }]}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Add a review */}
          <View style={[styles.addReviewContainer, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <Text style={[styles.addReviewTitle, { color: themeColors.text }]}>Add a review</Text>
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                  <Ionicons
                    name={star <= newRating ? 'star' : 'star-outline'}
                    size={28}
                    color="#FFD700"
                    style={styles.pickerStar}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, { color: themeColors.text, borderColor: isDark ? '#444' : '#E0E0E0', backgroundColor: isDark ? '#222' : '#FAFAFA' }]}
              placeholder="Write your review here..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={newReviewText}
              onChangeText={setNewReviewText}
              multiline
              numberOfLines={3}
            />
            {!!reviewSubmitError && (
              <Text style={styles.reviewErrorText}>{reviewSubmitError}</Text>
            )}
            <TouchableOpacity
              style={[styles.submitReviewButton, isSubmittingReview && { opacity: 0.7 }]}
              onPress={handleAddReview}
              disabled={isSubmittingReview}
            >
              <Text style={styles.submitReviewButtonText}>{isSubmittingReview ? 'Submitting…' : 'Submit Review'}</Text>
            </TouchableOpacity>
          </View>

          {/* Individual review cards */}
          <View style={styles.reviewsListContainer}>
            {isLoadingReviews && (
              <Text style={{ color: themeColors.subText, textAlign: 'center', marginBottom: 12 }}>Loading reviews…</Text>
            )}
            {!isLoadingReviews && reviewsList.length === 0 && (
              <Text style={{ color: themeColors.subText, textAlign: 'center', marginBottom: 12 }}>No reviews yet</Text>
            )}
            {reviewsList.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#F0F0F0' }]}>
                <View style={styles.reviewHeader}>
                  {review.avatar ? (
                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder, { backgroundColor: themeColors.imagePlaceholder }]}>
                      <Ionicons name="person" size={18} color={themeColors.subText} />
                    </View>
                  )}
                  <View style={styles.reviewUserMeta}>
                    <View style={styles.reviewUserTopRow}>
                      <Text style={[styles.reviewUserName, { color: themeColors.text }]}>{review.userName}</Text>
                      {review.isVerified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={10} color="#00BCD4" />
                          <Text style={styles.verifiedBadgeText}>Verified Booking</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.reviewStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color="#FFD700"
                        />
                      ))}
                      <Text style={[styles.reviewDate, { color: themeColors.subText }]}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.reviewBodyText, { color: themeColors.text }]}>{review.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Book Now Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: themeColors.background, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
        <View style={styles.stickyFooterContent}>
          <TouchableOpacity style={styles.fullBookButton} onPress={handleOpenBooking}>
            <Text style={styles.fullBookButtonText}>Book Now</Text>
          </TouchableOpacity>
          <View style={styles.paymentNoteContainer}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#00BCD4" />
            <Text style={[styles.paymentNoteText, { color: themeColors.subText }]}>Payment held safely by Wami</Text>
          </View>
        </View>
      </View>

      {!!creatorId && (
        <>
          <BookingModal
            visible={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            offeringId={String(id)}
            creative={{
              id: creatorId,
              name: creatorName ?? 'Creative',
              role: offering.category ?? '',
            }}
            onViewBooking={(bookingId) => router.push(`/service-tracking/${bookingId}` as any)}
            onMessage={handleMessage}
          />

          <QuoteRequestModal
            visible={showQuoteModal}
            onClose={() => setShowQuoteModal(false)}
            offeringId={String(id)}
            creative={{
              id: creatorId,
              name: creatorName ?? 'Creative',
              role: offering.category ?? '',
            }}
            onSubmit={(quote) => {
              setShowQuoteModal(false);
              router.push({
                pathname: '/quote-received/[id]',
                params: {
                  id: quote.id,
                  creativeName: creatorName ?? '',
                  service: quote.service,
                  offerAmount: String(Math.round(Number(quote.budget.replace(/[^\d]/g, '')) || price)),
                },
              } as any);
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnFloating: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    height: 350,
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 140,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 4,
    marginRight: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  ratingBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  reviewText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: '#00BCD4',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    zIndex: 10,
  },
  priceCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 13,
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  quoteButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#0F1419',
    fontWeight: '600',
    fontSize: 14,
  },
  stickyFooterContent: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  fullBookButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fullBookButtonText: {
    color: '#0F1419',
    fontWeight: '700',
    fontSize: 16,
  },
  paymentNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  paymentNoteText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Reviews section styles
  reviewsSummaryContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingSummaryLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBigNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  ratingTotalText: {
    fontSize: 12,
  },
  dividerVertical: {
    width: 1,
    height: 80,
    marginHorizontal: 16,
  },
  ratingBreakdownRight: {
    flex: 1.5,
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownStarText: {
    fontSize: 11,
    width: 20,
    textAlign: 'right',
  },
  breakdownProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  breakdownPctText: {
    fontSize: 11,
    width: 30,
  },
  addReviewContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  addReviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  starPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  pickerStar: {
    marginRight: 2,
  },
  reviewInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 12,
  },
  reviewErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 12,
  },
  submitReviewButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    color: '#0F1419',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewsListContainer: {
    gap: 12,
    marginBottom: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewUserMeta: {
    flex: 1,
    gap: 2,
  },
  reviewUserTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    marginLeft: 8,
  },
  reviewBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,188,212,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#00BCD4',
    fontSize: 10,
    fontWeight: '600',
  },
});
