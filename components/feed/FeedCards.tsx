import { Text } from '@/components/AppText';
import AnimatedHeart from '@/components/AnimatedHeart';
import { Ionicons } from '@/components/FlatIcon';
import type { CreativeData } from '@/components/SwipeableCardStack';
import Colors from '@/constants/Colors';
import type { WamiCard as WamiCardData } from '@/constants/WamiCards';
import React from 'react';
import { Image, Share, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

const INK = '#0F1419';
const ORANGE = '#FFA000';

export interface ListingData {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  stock?: number;
}

function useTone() {
  const isDark = useColorScheme() === 'dark';
  return {
    isDark,
    card: isDark ? '#1A1A1A' : '#F5F7F8',
    text: isDark ? '#FFFFFF' : INK,
    sub: isDark ? '#9AA5AD' : '#5E6670',
    tile: isDark ? '#12333B' : '#E3F7FA',
  };
}

/* ── From Wami ──────────────────────────────────────────────────────────── */

export function WamiFeedCard({
  card,
  onPress,
  onDismiss,
}: {
  card: WamiCardData;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const isTip = card.kind === 'tip';
  const bg = isTip ? ORANGE : Colors.light.primary;
  return (
    <View style={[styles.wami, { backgroundColor: bg }]}>
      <TouchableOpacity style={styles.dismiss} onPress={onDismiss} accessibilityLabel="Dismiss" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color={INK} />
      </TouchableOpacity>
      <View style={styles.badge}>
        <Ionicons name="location" size={13} color={INK} />
        <Text style={styles.badgeText}>From Wami</Text>
        <Ionicons name="checkmark-circle" size={13} color={INK} />
      </View>
      <Text style={styles.wamiTitle}>{card.title}</Text>
      <Text style={styles.wamiBody}>{card.body}</Text>
      <TouchableOpacity style={styles.wamiButton} onPress={onPress}>
        <Text style={styles.wamiButtonText}>{card.button}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── A creative ─────────────────────────────────────────────────────────── */

export function CreativeFeedCard({
  item,
  saved,
  onSave,
  onOpen,
}: {
  item: CreativeData;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const t = useTone();
  const meta = [item.role, item.distance || item.location].filter(Boolean).join(' · ');

  // No photo: a compact row instead of a big empty block.
  if (!item.image) {
    return (
      <TouchableOpacity activeOpacity={0.9} style={[styles.compact, { backgroundColor: t.card }]} onPress={onOpen}>
        {item.creatorImage ? (
          <Image source={{ uri: item.creatorImage }} style={styles.compactAvatar} />
        ) : (
          <View style={[styles.compactAvatar, styles.avatarEmpty, { backgroundColor: t.tile }]}>
            <Ionicons name="person" size={28} color={Colors.light.primary} accent={ORANGE} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.rating > 0 ? (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={ORANGE} />
                <Text style={[styles.ratingText, { color: t.text }]}>{item.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
          {meta ? (
            <Text style={[styles.meta, { color: t.sub }]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          <View style={[styles.smallButton, { marginTop: 10 }]}>
            <Text style={styles.smallButtonText}>View profile</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onSave} accessibilityLabel={saved ? 'Unsave' : 'Save'} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AnimatedHeart saved={saved} size={24} idleColor={t.sub} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.card, { backgroundColor: t.card }]} onPress={onOpen}>
      <View style={styles.photoWrap}>
        {item.image ? (
          <Image source={item.image} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty, { backgroundColor: t.tile }]}>
            <Ionicons name="person" size={44} color={Colors.light.primary} accent={ORANGE} />
          </View>
        )}
        <TouchableOpacity style={styles.heart} onPress={onSave} accessibilityLabel={saved ? 'Unsave' : 'Save'}>
          <AnimatedHeart saved={saved} size={22} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.rating > 0 ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color={ORANGE} />
              <Text style={[styles.ratingText, { color: t.text }]}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        {meta ? (
          <Text style={[styles.meta, { color: t.sub }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <View style={styles.smallButton}>
          <Text style={styles.smallButtonText}>View profile</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ── A portfolio post: the creator's work, big ──────────────────────────── */

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function PostFeedCard({
  item,
  saved,
  onSave,
  onOpen,
}: {
  item: CreativeData;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  const t = useTone();
  const meta = [item.role, item.distance || item.location].filter(Boolean).join(' · ');

  const share = () => {
    Share.share({ message: `${item.name} on Wami` }).catch(() => {});
  };

  return (
    <View style={[styles.post, { backgroundColor: t.card }]}>
      {/* the creator: tap to open the profile */}
      <TouchableOpacity style={styles.postHead} activeOpacity={0.8} onPress={onOpen}>
        {item.creatorImage ? (
          <Image source={{ uri: item.creatorImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: t.tile }]}>
            <Text style={[styles.avatarText, { color: t.isDark ? '#6FDCEC' : '#0A3A44' }]}>{initials(item.creatorName || item.name)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
            {item.creatorName || item.name}
          </Text>
          {meta ? (
            <Text style={[styles.meta, { color: t.sub, marginTop: 1 }]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        {item.rating > 0 ? (
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={ORANGE} />
            <Text style={[styles.ratingText, { color: t.text }]}>{item.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* the work */}
      <TouchableOpacity activeOpacity={0.95} onPress={onOpen}>
        <Image source={item.image} style={styles.postImage} />
      </TouchableOpacity>

      {/* actions */}
      <View style={styles.postActions}>
        <TouchableOpacity onPress={onSave} accessibilityLabel={saved ? 'Unsave' : 'Save'} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AnimatedHeart saved={saved} size={26} idleColor={t.sub} />
        </TouchableOpacity>
        <TouchableOpacity onPress={share} accessibilityLabel="Share" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="send" size={24} color={t.sub} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[styles.smallButton, { marginTop: 0 }]} onPress={onOpen}>
          <Text style={styles.smallButtonText}>View profile</Text>
        </TouchableOpacity>
      </View>

      {item.caption ? (
        <Text style={[styles.caption, { color: t.text }]} numberOfLines={2}>
          <Text style={{ fontWeight: '700' }}>{item.creatorName || item.name}  </Text>
          {item.caption}
        </Text>
      ) : null}
    </View>
  );
}

/* ── A product ──────────────────────────────────────────────────────────── */

export function ListingFeedCard({ item, onOpen }: { item: ListingData; onOpen: () => void }) {
  const t = useTone();
  const meta = [item.category, item.stock !== undefined ? `${item.stock} in stock` : ''].filter(Boolean).join(' · ');
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.listing, { backgroundColor: t.card }]} onPress={onOpen}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.listingThumb} />
      ) : (
        <View style={[styles.listingThumb, styles.photoEmpty, { backgroundColor: t.tile }]}>
          <Ionicons name="bag" size={30} color={Colors.light.primary} accent={ORANGE} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: t.sub }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <View style={[styles.row, { marginTop: 10 }]}>
          <Text style={[styles.price, { color: t.text }]}>₦{item.price.toLocaleString()}</Text>
          <View style={[styles.smallButton, { marginTop: 0 }]}>
            <Text style={styles.smallButtonText}>View</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wami: { borderRadius: 18, padding: 16 },
  dismiss: { position: 'absolute', top: 12, right: 12, zIndex: 2 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,20,25,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: INK },
  wamiTitle: { fontSize: 18, fontWeight: '800', color: INK, marginTop: 10, paddingRight: 28 },
  wamiBody: { fontSize: 14, lineHeight: 20, color: INK, marginTop: 4, marginBottom: 14, opacity: 0.85 },
  wamiButton: {
    alignSelf: 'flex-start',
    backgroundColor: INK,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  wamiButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  card: { borderRadius: 18, overflow: 'hidden' },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15,20,25,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 3 },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 12,
  },
  smallButtonText: { fontSize: 14, fontWeight: '700', color: INK },

  compact: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 14 },
  compactAvatar: { width: 64, height: 64, borderRadius: 32 },
  post: { borderRadius: 18, overflow: 'hidden', paddingBottom: 12 },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#0A3A44' },
  postImage: { width: '100%', aspectRatio: 1 },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 12, paddingTop: 12 },
  caption: { fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingTop: 10 },

  listing: { flexDirection: 'row', gap: 14, borderRadius: 18, padding: 12, alignItems: 'center' },
  listingThumb: { width: 92, height: 92, borderRadius: 14 },
  price: { fontSize: 17, fontWeight: '800' },
});
