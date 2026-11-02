import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import InfoPage, { useInfoTheme } from '@/components/InfoPage';
import Colors from '@/constants/Colors';
import { getBlocks, unblockUser } from '@/services/api/safetyService';
import { extractList } from '@/utils/extractList';
import { absoluteUrl, initials } from '@/utils/mediaUrl';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type Row = { blockId: string; userId: string; name: string; username?: string; avatar?: string };

// The shape of a block is not pinned down in the handbook, so read it loosely:
// the person may sit under `blocked`, `blocked_user` or `user`.
const toRow = (b: any): Row => {
  const who = b.blocked_user ?? b.blocked ?? b.user ?? b;
  return {
    blockId: String(b.id ?? who.id),
    userId: String(b.blocked_id ?? b.user_id ?? who.id ?? b.id),
    name: who.name || [who.first_name, who.last_name].filter(Boolean).join(' ') || who.username || 'Someone',
    username: who.username,
    avatar: absoluteUrl(who.avatar_url ?? who.profile_image),
  };
};

export default function BlockedScreen() {
  const t = useInfoTheme();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await getBlocks();
      setRows(extractList<any>(res.data).map(toRow));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (row: Row) => {
    setBusyId(row.blockId);
    try {
      await unblockUser(row.blockId);
      setRows((prev) => prev.filter((r) => r.blockId !== row.blockId));
    } catch (error: any) {
      Alert.alert("Couldn't unblock", error?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <InfoPage title="Blocked people">
      {loading ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />
      ) : failed ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Oops, we can't find anything"
          message="Something went wrong while loading this list."
          onRetry={load}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Nobody is blocked"
          message="People you block can't message you, and you won't see them in your feed."
        />
      ) : (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          {rows.map((row, i) => (
            <View key={row.blockId} style={[styles.row, i > 0 && { borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              {row.avatar ? (
                <Image source={{ uri: row.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Text style={styles.avatarText}>{initials(row.name)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
                  {row.name}
                </Text>
                {row.username ? <Text style={[styles.handle, { color: t.sub }]}>@{row.username}</Text> : null}
              </View>
              <TouchableOpacity style={styles.button} onPress={() => unblock(row)} disabled={busyId === row.blockId}>
                {busyId === row.blockId ? (
                  <ActivityIndicator size="small" color="#0F1419" />
                ) : (
                  <Text style={styles.buttonText}>Unblock</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarEmpty: { backgroundColor: '#E3F7FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#0A3A44' },
  name: { fontSize: 16, fontWeight: '700' },
  handle: { fontSize: 13, marginTop: 1 },
  button: { height: 36, minWidth: 84, borderRadius: 10, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#0F1419' },
});
