import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@/components/FlatIcon';
import SwipeableCardStack, { CreativeData } from '@/components/SwipeableCardStack';
import Colors from '@/constants/Colors';
import { useFavorites } from '@/hooks/useFavorites';
import { DiscoveryOffering, getDiscoveryFeed, getNearYou, swipeOffering } from '@/services/api/discoveryService';
import { extractList } from '@/utils/extractList';
import { mapOfferingToCreativeData } from '@/utils/mapOffering';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The swipe stack, one creative at a time. It used to be the whole Home
// screen; Home is a feed now and this is one tap away.

const MODES = ['For you', 'Near you'] as const;

export default function SwipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  const [mode, setMode] = useState<(typeof MODES)[number]>('For you');
  const [feed, setFeed] = useState<DiscoveryOffering[] | null>(null);
  const [nearYou, setNearYou] = useState<DiscoveryOffering[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const tc = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    chip: isDark ? '#1A1A1A' : '#F5F7F8',
  };

  const load = useCallback(async (which: (typeof MODES)[number]) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = which === 'Near you' ? await getNearYou() : await getDiscoveryFeed();
      const list = extractList<DiscoveryOffering>(res.data);
      if (which === 'Near you') setNearYou(list);
      else setFeed(list);
    } catch (error) {
      console.error('Failed to load creatives to swipe:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'For you' && feed === null) load('For you');
    if (mode === 'Near you' && nearYou === null) load('Near you');
  }, [mode, feed, nearYou, load]);

  const creatives: CreativeData[] = useMemo(
    () => ((mode === 'Near you' ? nearYou : feed) ?? []).map(mapOfferingToCreativeData),
    [mode, feed, nearYou]
  );

  const handleSwipeRight = (item: CreativeData) => {
    swipeOffering(item.id, 'like').catch((error) => console.error('Swipe (like) failed:', error));
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: item.id,
        creatorId: item.creatorId ?? '',
        creatorName: item.creatorName ?? '',
        creatorUsername: item.creatorUsername ?? '',
      },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.text }]}>Swipe</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.modes}>
        {MODES.map((m) => {
          const active = m === mode;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.mode, { backgroundColor: active ? Colors.light.primary : tc.chip }]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeText, { color: active ? '#0F1419' : tc.sub }]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.stack}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.light.primary} size="large" />
          </View>
        ) : hasError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Oops, we can't find anything"
            message="Something went wrong while loading creatives. Please check your connection and try again."
            onRetry={() => load(mode)}
          />
        ) : creatives.length > 0 ? (
          <SwipeableCardStack
            data={creatives}
            onSwipeLeft={(item) =>
              swipeOffering(item.id, 'pass').catch((error) => console.error('Swipe (pass) failed:', error))
            }
            onSwipeRight={handleSwipeRight}
            onSave={(item) => toggleFavorite(item)}
            isSaved={(item) => isFavorite(item.id)}
          />
        ) : (
          <EmptyState
            icon="location-outline"
            title="No creatives nearby"
            message="Try changing your location to discover more creatives"
            onRetry={() => router.push('/location-picker' as any)}
            retryLabel="Change location"
          />
        )}
      </View>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  modes: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  mode: { paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 14, fontWeight: '700' },
  stack: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
