import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import { initials } from '@/utils/mediaUrl';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

export interface NearCreative {
  id: string;
  username?: string;
  name: string;
  role?: string;
  image?: string;
}

/** A row of round photos: who is close by. Tap one to open their page. */
export default function NearYouStrip({
  people,
  onOpen,
  onSeeMap,
}: {
  people: NearCreative[];
  onOpen: (p: NearCreative) => void;
  onSeeMap: () => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const text = isDark ? '#FFFFFF' : '#0F1419';
  const sub = isDark ? '#9AA5AD' : '#5E6670';

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: text }]}>Creatives near you</Text>
        <TouchableOpacity onPress={onSeeMap}>
          <Text style={styles.link}>See map</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {people.map((p) => (
          <TouchableOpacity key={p.id} style={styles.item} onPress={() => onOpen(p)} activeOpacity={0.8}>
            {p.image ? (
              <Image source={{ uri: p.image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.initials}>{initials(p.name)}</Text>
              </View>
            )}
            <Text style={[styles.handle, { color: text }]} numberOfLines={1}>
              {p.username ? `@${p.username}` : p.name}
            </Text>
            {p.role ? (
              <Text style={[styles.role, { color: sub }]} numberOfLines={1}>
                {p.role}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '800' },
  link: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  row: { gap: 14, paddingRight: 8 },
  item: { width: 72, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.light.primary },
  avatarEmpty: { backgroundColor: '#E3F7FA', alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 20, fontWeight: '800', color: '#0A3A44' },
  handle: { fontSize: 12, fontWeight: '700', marginTop: 6, maxWidth: 72 },
  role: { fontSize: 11, maxWidth: 72 },
});
