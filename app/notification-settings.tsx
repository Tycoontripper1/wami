import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import InfoPage, { useInfoTheme } from '@/components/InfoPage';
import GuestPrompt from '@/components/GuestPrompt';
import Colors from '@/constants/Colors';
import { getNotificationSettings, NotificationSettings, updateNotificationSettings } from '@/services/api/notificationsService';
import type { RootState } from '@/store/store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, View } from 'react-native';
import { useSelector } from 'react-redux';

// "new_message" becomes "New message".
const labelFor = (key: string) => {
  const words = key.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function NotificationSettingsScreen() {
  const t = useInfoTheme();
  const signedIn = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    setFailed(false);
    try {
      setSettings(await getNotificationSettings());
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (category: string, channel: 'push' | 'email', value: boolean) => {
    const before = settings;
    const next = { ...settings, [category]: { ...settings[category], [channel]: value } };
    setSettings(next);
    try {
      await updateNotificationSettings({ [category]: next[category] });
    } catch (error: any) {
      setSettings(before);
      Alert.alert("Couldn't save that", error?.message ?? 'Please try again.');
    }
  };

  const categories = Object.keys(settings);

  return (
    <InfoPage title="Notifications">
      {!signedIn ? (
        <View style={{ height: 420 }}>
          <GuestPrompt illustration="bell" title="Sign in to choose" message="Pick which updates reach you, as a push or an email." />
        </View>
      ) : loading ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />
      ) : failed ? (
        <EmptyState icon="cloud-offline-outline" title="We couldn't load your settings" message="Check your connection and try again." onRetry={load} />
      ) : categories.length === 0 ? (
        <EmptyState illustration="bell" title="Nothing to set yet" message="Every update is switched on. Choices will appear here as they are added." />
      ) : (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <View style={styles.headRow}>
            <View style={{ flex: 1 }} />
            <Text style={[styles.col, { color: t.sub }]}>Push</Text>
            <Text style={[styles.col, { color: t.sub }]}>Email</Text>
          </View>
          {categories.map((key, i) => (
            <View key={key} style={[styles.row, i > 0 && { borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.name, { color: t.text }]}>{labelFor(key)}</Text>
              <View style={styles.switchWrap}>
                <Switch
                  value={!!settings[key]?.push}
                  onValueChange={(v) => change(key, 'push', v)}
                  trackColor={{ true: Colors.light.primary, false: t.border }}
                />
              </View>
              <View style={styles.switchWrap}>
                <Switch
                  value={!!settings[key]?.email}
                  onValueChange={(v) => change(key, 'email', v)}
                  trackColor={{ true: Colors.light.primary, false: t.border }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  col: { width: 64, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  switchWrap: { width: 64, alignItems: 'center' },
});
