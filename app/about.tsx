import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import InfoPage, { useInfoTheme } from '@/components/InfoPage';
import { WAMIPinIcon } from '@/components/logo/WAMIPinIcon';
import Colors from '@/constants/Colors';
import { PRIVACY_URL, SITE_URL, TERMS_URL } from '@/constants/Contact';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
  const t = useInfoTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '';

  const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => {});

  const Link = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={[styles.link, { borderColor: t.border }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.linkLabel, { color: t.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={t.sub} />
    </TouchableOpacity>
  );

  return (
    <InfoPage title="About">
      <View style={styles.hero}>
        <WAMIPinIcon size={64} color={Colors.light.primary} cutoutColor={t.background} />
        <Text style={[styles.name, { color: t.text }]}>Wami</Text>
        {version ? <Text style={[styles.version, { color: t.sub }]}>Version {version}</Text> : null}
      </View>

      <View style={[styles.card, { backgroundColor: t.card }]}>
        <Text style={[styles.copy, { color: t.text }]}>
          Wami helps people in a city find photographers, stylists, makers and sellers, talk to them, book a date and
          buy what they make.
        </Text>
        <Text style={[styles.copy, { color: t.sub, marginTop: 10 }]}>
          Creatives get a page for their work and a way to take bookings and orders. Buyers get a place to look first
          and decide.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: t.card, paddingVertical: 4 }]}>
        <Link label="Terms of use" onPress={() => open(TERMS_URL)} />
        <Link label="Privacy policy" onPress={() => open(PRIVACY_URL)} />
        <Link label="Our website" onPress={() => open(SITE_URL)} />
        <Link label="Help & Support" onPress={() => router.push('/support' as any)} />
      </View>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  name: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  version: { fontSize: 13 },
  card: { borderRadius: 18, padding: 16 },
  copy: { fontSize: 15, lineHeight: 22 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  linkLabel: { fontSize: 16, fontWeight: '600' },
});
