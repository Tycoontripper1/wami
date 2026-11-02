import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import InfoPage, { useInfoTheme } from '@/components/InfoPage';
import Colors from '@/constants/Colors';
import { PRIVACY_URL, TERMS_URL } from '@/constants/Contact';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

const COLLECT: { title: string; body: string }[] = [
  { title: 'Your account', body: 'Your name, username, email and password, and the photo and bio you choose to add.' },
  { title: 'Your location', body: 'Only if you allow it, to show who is near you. Other people see your city and area, never your exact position.' },
  { title: 'What you post', body: 'Listings, photos, reviews and messages you send. Messages are visible to the person you send them to.' },
  { title: 'Bookings and orders', body: 'What you book or buy, when, and the amounts. Card details are handled by our payment partner and never stored by us.' },
];

export default function PrivacyScreen() {
  const t = useInfoTheme();
  const router = useRouter();
  const signedIn = useSelector((s: RootState) => !!s.auth.user);

  const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => {});

  const Action = ({ icon, label, detail, onPress, danger }: { icon: string; label: string; detail?: string; onPress: () => void; danger?: boolean }) => (
    <TouchableOpacity style={[styles.action, { borderColor: t.border }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={24} color={danger ? '#E5533F' : Colors.light.primary} accent={danger ? undefined : '#FFA000'} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: danger ? '#E5533F' : t.text }]}>{label}</Text>
        {detail ? <Text style={[styles.actionDetail, { color: t.sub }]}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={t.sub} />
    </TouchableOpacity>
  );

  return (
    <InfoPage title="Privacy & Security">
      <View style={[styles.card, { backgroundColor: t.card }]}>
        <Text style={[styles.heading, { color: t.text }]}>What we keep, and why</Text>
        {COLLECT.map((item) => (
          <View key={item.title} style={styles.point}>
            <Text style={[styles.pointTitle, { color: t.text }]}>{item.title}</Text>
            <Text style={[styles.pointBody, { color: t.sub }]}>{item.body}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: t.card, paddingVertical: 4 }]}>
        {signedIn ? (
          <>
            <Action icon="lock-closed" label="Change password" onPress={() => router.push('/change-password' as any)} />
            <Action icon="ban" label="Blocked people" detail="People who can't message you" onPress={() => router.push('/blocked' as any)} />
          </>
        ) : null}
        <Action icon="location" label="Location access" detail="Change it in your phone's settings" onPress={() => Linking.openSettings().catch(() => {})} />
        {signedIn ? (
          <Action icon="trash" label="Delete account" detail="Removes your personal data" danger onPress={() => router.push('/account-actions' as any)} />
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: t.card, paddingVertical: 4 }]}>
        <Action icon="document-text" label="Privacy policy" onPress={() => open(PRIVACY_URL)} />
        <Action icon="document-text" label="Terms of use" onPress={() => open(TERMS_URL)} />
      </View>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  point: { paddingTop: 12 },
  pointTitle: { fontSize: 15, fontWeight: '700' },
  pointBody: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  actionLabel: { fontSize: 16, fontWeight: '600' },
  actionDetail: { fontSize: 13, marginTop: 1 },
});
