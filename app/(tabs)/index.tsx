import GuestPrompt from '@/components/GuestPrompt';
import AppGuidance from '@/components/AppGuidance';
import { Text, TextInput } from '@/components/AppText';
import FilterSheet from '@/components/home/FilterSheet';
import NearYouStrip, { NearCreative } from '@/components/home/NearYouStrip';
import EmptyState from '@/components/EmptyState';
import {
  CreativeFeedCard,
  ListingData,
  ListingFeedCard,
  PostFeedCard,
  WamiFeedCard,
} from '@/components/feed/FeedCards';
import { Ionicons } from '@/components/FlatIcon';
import type { CreativeData } from '@/components/SwipeableCardStack';
import Colors from '@/constants/Colors';
import { WAMI_CARDS, WamiCard } from '@/constants/WamiCards';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useFavorites } from '@/hooks/useFavorites';
import { useLocation } from '@/hooks/useLocationData';
import { DiscoveryOffering, getDiscoveryFeed, getNearYou } from '@/services/api/discoveryService';
import { getUnreadCount as getUnreadNotificationCount } from '@/services/api/notificationsService';
import { getProducts } from '@/services/api/productsService';
import { COUNTRY_VIEW } from '@/data/regionGeo';
import { getMapPlaces } from '@/services/api/creatorsService';
import { extractList } from '@/utils/extractList';
import { bboxFor } from '@/utils/mapBox';
import { absoluteUrl } from '@/utils/mediaUrl';
import { openCreator } from '@/utils/openCreator';
import { loadLocalProductPhotos, localProductPhoto } from '@/utils/localProductPhotos';
import { mapOfferingToCreativeData } from '@/utils/mapOffering';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['For you', 'Following', 'Near you', 'Trending'] as const;
type Tab = (typeof TABS)[number];

const DISMISSED_KEY = '@wami_dismissed_cards';

type FeedItem =
  | { kind: 'wami'; key: string; card: WamiCard }
  | { kind: 'creative'; key: string; data: CreativeData }
  | { kind: 'listing'; key: string; data: ListingData };

// /products lists the same listing twice (a marketplace row and a manual row);
// keep one, preferring the manual row, which is the one the app can open.
function toListings(raw: any[]): ListingData[] {
  const published = raw.filter((p) => p.status === undefined || p.status === 'published');
  const seen = new Set<string>();
  const out: ListingData[] = [];
  [...published]
    .sort((a, b) => (a.source === 'manual' ? -1 : 0) - (b.source === 'manual' ? -1 : 0))
    .forEach((p) => {
      const sig = `${p.title}|${Number(p.price)}|${String(p.created_at ?? '').slice(0, 16)}`;
      if (seen.has(sig)) return;
      seen.add(sig);
      out.push({
        id: String(p.id),
        name: p.title || p.name || 'Untitled',
        category: p.category || '',
        price: Number(p.price) || 0,
        image: p.thumbnail_url || p.media_url || p.image || p.images?.[0] || localProductPhoto(p.id) || undefined,
        stock: typeof p.stock === 'number' ? p.stock : undefined,
      });
    });
  return out;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { region, city, coordinates } = useLocation();
  const { signedIn, gate } = useAuthGate();

  const [activeTab, setActiveTab] = useState<Tab>('For you');
  const [feed, setFeed] = useState<DiscoveryOffering[] | null>(null);
  const [nearYou, setNearYou] = useState<DiscoveryOffering[] | null>(null);
  const [following, setFollowing] = useState<DiscoveryOffering[] | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [nearby, setNearby] = useState<NearCreative[]>([]);
  const [followingError, setFollowingError] = useState(false);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [feedError, setFeedError] = useState(false);
  const [nearYouError, setNearYouError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const tc = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    chip: isDark ? '#1A1A1A' : '#F5F7F8',
  };

  const loadFeed = useCallback(async () => {
    setFeedError(false);
    const [feedRes, productsRes] = await Promise.allSettled([
      getDiscoveryFeed(),
      getProducts({ limit: 20 }),
      loadLocalProductPhotos(),
    ]);
    if (feedRes.status === 'fulfilled') setFeed(extractList<DiscoveryOffering>(feedRes.value.data));
    else {
      console.error('Failed to load discovery feed:', feedRes.reason);
      setFeed(null);
      setFeedError(true);
    }
    if (productsRes.status === 'fulfilled') setListings(toListings(extractList<any>(productsRes.value.data)));
  }, []);

  const loadNearYou = useCallback(async () => {
    setNearYouError(false);
    try {
      const res = await getNearYou();
      setNearYou(extractList<DiscoveryOffering>(res.data));
    } catch (error) {
      console.error('Failed to load near-you offerings:', error);
      setNearYou(null);
      setNearYouError(true);
    }
  }, []);

  // Reload whenever Home comes back into view, so something just listed (or a
  // photo just changed) shows up without a pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      loadFeed().finally(() => setIsLoading(false));
    }, [loadFeed])
  );

  useEffect(() => {
    let live = true;
    const view = coordinates
      ? { latitude: coordinates.lat, longitude: coordinates.lng, latitudeDelta: 1.2, longitudeDelta: 1.2 }
      : COUNTRY_VIEW[region.code] ?? COUNTRY_VIEW.NG;
    getMapPlaces({ bbox: bboxFor(view), limit: 20 })
      .then((res) => {
        if (!live) return;
        setNearby(
          extractList<any>(res.data).map((p) => ({
            id: String(p.id),
            username: p.username ? String(p.username) : undefined,
            name: String(p.name ?? ''),
            role: p.role ? String(p.role) : undefined,
            image: absoluteUrl(p.avatar_url),
          }))
        );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [coordinates, region.code]);

  const loadFollowing = useCallback(async () => {
    setFollowingError(false);
    try {
      const res = await getDiscoveryFeed({ tab: 'following' });
      setFollowing(extractList<DiscoveryOffering>(res.data));
    } catch (error) {
      console.error('Failed to load the following feed:', error);
      setFollowing(null);
      setFollowingError(true);
    }
  }, []);

  // Following is read fresh each time it is opened, so a new follow shows up.
  useEffect(() => {
    if (activeTab === 'Following' && signedIn) loadFollowing();
  }, [activeTab, signedIn, loadFollowing]);

  useEffect(() => {
    if (activeTab === 'Near you' && nearYou === null && !nearYouError) loadNearYou();
  }, [activeTab, nearYou, nearYouError, loadNearYou]);

  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    getUnreadNotificationCount()
      .then((res) => setUnread(res.data?.count ?? 0))
      .catch((error) => console.error('Failed to load unread notification count:', error));
  }, [signedIn]);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((raw) => setDismissed(raw ? JSON.parse(raw) : []))
      .catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      loadFeed(),
      activeTab === 'Near you' ? loadNearYou() : Promise.resolve(),
      activeTab === 'Following' && signedIn ? loadFollowing() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  }, [loadFeed, loadNearYou, loadFollowing, activeTab, signedIn]);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
  };

  const openCreative = (item: CreativeData) => {
    openCreator(router, item);
  };

  const searching = query.trim().length > 0 || category !== null;

  // What the list shows: creatives and listings taking turns, with a From Wami
  // card a few posts down and a second further on. A search or a filter shows
  // only what matches, with no promo cards.
  const items: FeedItem[] = useMemo(() => {
    const cards = searching ? [] : WAMI_CARDS.filter((c) => !dismissed.includes(c.id));
    let creatives: CreativeData[];
    if (activeTab === 'Near you') creatives = (nearYou ?? []).map(mapOfferingToCreativeData);
    else if (activeTab === 'Following') creatives = (following ?? []).map(mapOfferingToCreativeData);
    else {
      creatives = (feed ?? []).map(mapOfferingToCreativeData);
      if (activeTab === 'Trending') creatives.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    }
    let shop = activeTab === 'For you' ? listings : [];

    const q = query.trim().toLowerCase();
    const wanted = category?.toLowerCase() ?? null;
    if (q || wanted) {
      creatives = creatives.filter((p) => {
        const haystack = [p.name, p.role, p.creatorName, p.creatorUsername, p.caption, ...(p.tags ?? [])].filter(Boolean).join(' ').toLowerCase();
        return (!q || haystack.includes(q)) && (!wanted || (p.role ?? '').toLowerCase() === wanted);
      });
      shop = shop.filter((p) => (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)) && (!wanted || (p.category ?? '').toLowerCase() === wanted));
    }

    const out: FeedItem[] = [];
    const placed = new Set<string>();
    const place = (i: 0 | 1) => {
      if (cards[i] && !placed.has(cards[i].id)) {
        placed.add(cards[i].id);
        out.push({ kind: 'wami', key: `wami-${cards[i].id}`, card: cards[i] });
      }
    };
    let c = 0;
    let l = 0;
    while (c < creatives.length || l < shop.length) {
      if (c < creatives.length) out.push({ kind: 'creative', key: `c-${creatives[c].id}`, data: creatives[c++] });
      if (l < shop.length) out.push({ kind: 'listing', key: `l-${shop[l].id}`, data: shop[l++] });
      if (out.length === 4) place(0);
      if (out.length === 10) place(1);
    }
    // A short feed still shows the cards, after everything else.
    if (out.length >= 1) {
      place(0);
      if (out.length >= 6) place(1);
    }
    return out;
  }, [activeTab, feed, nearYou, following, listings, dismissed, query, category, searching]);

  const hasContent = items.some((i) => i.kind !== 'wami');
  const currentError =
    activeTab === 'Near you' ? nearYouError : activeTab === 'Following' ? signedIn && followingError : feedError && listings.length === 0;
  const retry = activeTab === 'Near you' ? loadNearYou : activeTab === 'Following' ? loadFollowing : loadFeed;

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.kind === 'wami') {
      return (
        <WamiFeedCard
          card={item.card}
          onPress={() => router.push(item.card.route as any)}
          onDismiss={() => dismiss(item.card.id)}
        />
      );
    }
    if (item.kind === 'creative') {
      const Card = item.data.image ? PostFeedCard : CreativeFeedCard;
      return (
        <Card
          item={item.data}
          saved={isFavorite(item.data.id)}
          onSave={() => toggleFavorite(item.data)}
          onOpen={() => openCreative(item.data)}
        />
      );
    }
    return <ListingFeedCard item={item.data} onOpen={() => router.push(`/product-detail/${item.data.id}` as any)} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.location} onPress={() => router.push('/location-picker' as any)}>
            <Ionicons name="location" size={18} color={Colors.light.primary} accent="#FFA000" />
            <Text style={[styles.locationText, { color: tc.text }]}>
              {city}, {region.name}
            </Text>
            <Ionicons name="chevron-down" size={16} color={tc.sub} />
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/explore-map' as any)} accessibilityLabel="Explore on the map">
              <Ionicons name="map" size={24} color={tc.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/swipe' as any)} accessibilityLabel="Swipe through creatives">
              <Ionicons name="albums" size={24} color={tc.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => gate('Sign in to see your notifications.', () => router.push('/notifications' as any))} accessibilityLabel="Notifications">
              <Ionicons name="notifications" size={24} color={tc.text} />
              {unread > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: tc.chip }]}>
            <Ionicons name="search" size={20} color={tc.sub} />
            <TextInput
              style={[styles.searchInput, { color: tc.text }]}
              placeholder="Search creatives and their work"
              placeholderTextColor={tc.sub}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={20} color={tc.sub} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: category ? Colors.light.primary : tc.chip }]}
            onPress={() => setShowFilter(true)}
            accessibilityLabel={category ? `Filter, showing ${category}` : 'Filter'}
          >
            <Ionicons name="options-outline" size={22} color={category ? '#0F1419' : tc.text} />
          </TouchableOpacity>
        </View>

        {category ? (
          <View style={styles.activeFilterRow}>
            <TouchableOpacity style={[styles.activeFilter, { backgroundColor: Colors.light.primary + '22' }]} onPress={() => setCategory(null)}>
              <Text style={[styles.activeFilterText, { color: Colors.light.primary }]}>{category}</Text>
              <Ionicons name="close" size={14} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, { backgroundColor: active ? Colors.light.primary : tc.chip }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: active ? '#0F1419' : tc.sub }]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'Following' && !signedIn ? (
        <GuestPrompt illustration="heart" title="Follow the people you like" message="Sign in, follow creatives, and their new work shows up here." />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      ) : currentError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Oops, we can't find anything"
          message="Something went wrong while loading. Please check your connection and try again."
          onRetry={retry}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.key}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
          ListHeaderComponent={
            activeTab === 'For you' && !searching && nearby.length > 0 ? (
              <NearYouStrip
                people={nearby}
                onOpen={(p) => router.push(`/creator/${p.id}` as any)}
                onSeeMap={() => router.push('/explore-map' as any)}
              />
            ) : undefined
          }
          ListFooterComponent={
            !hasContent ? (
              searching ? (
                <EmptyState
                  icon="search-outline"
                  title="Nothing matches that"
                  message="Try a different word, or clear the filter."
                  onRetry={() => {
                    setQuery('');
                    setCategory(null);
                  }}
                  retryLabel="Clear search"
                />
              ) : activeTab === 'Following' ? (
                <EmptyState
                  illustration="heart"
                  title="You are not following anyone yet"
                  message="Open a creative's page and tap Follow. Their new work will show here."
                  onRetry={() => router.push('/swipe' as any)}
                  retryLabel="Find creatives"
                />
              ) : (
                <EmptyState
                  icon="location-outline"
                  title="No creatives nearby"
                  message="Try changing your location to discover more creatives"
                  onRetry={() => router.push('/location-picker' as any)}
                  retryLabel="Change location"
                />
              )
            ) : undefined
          }
        />
      )}

      <FilterSheet visible={showFilter} category={category} onClose={() => setShowFilter(false)} onApply={setCategory} />

      <AppGuidance />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBtn: { padding: 4, position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tab: { paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 22, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  filterBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activeFilterRow: { flexDirection: 'row', marginBottom: 10 },
  activeFilter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15 },
  activeFilterText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 6 },
});
