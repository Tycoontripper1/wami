import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import InfoPage, { useInfoTheme } from '@/components/InfoPage';
import Colors from '@/constants/Colors';
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_E164,
  SUPPORT_WHATSAPP,
} from '@/constants/Contact';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I book a creative?',
    a: 'Open their listing, pick a date and time, add a few details and send the request. They accept or decline, and you can reschedule or cancel from your bookings.',
  },
  {
    q: 'How does payment work?',
    a: 'Wami holds part of your payment until the work is done. When you are happy, you release it. If you cancel after paying, the part still held is returned to you.',
  },
  {
    q: "I didn't get my sign-up code.",
    a: 'Check your spam folder, wait a minute and tap Resend. A code lasts 10 minutes and you can ask for a new one once a minute. Still nothing? Contact us below.',
  },
  {
    q: 'How do I sell on Wami?',
    a: 'On your Profile tap Become a Creative, choose your categories, then use the Post button to list a product or a service.',
  },
  {
    q: 'How do I report a problem with a person or a listing?',
    a: 'Open their profile or the listing and tap the report option. Our team reviews every report. You can also block someone so they cannot message you.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile, then Privacy & Security, then Delete account. Your personal data is removed and you are signed out everywhere.',
  },
];

function Row({ icon, label, detail, onPress }: { icon: string; label: string; detail: string; onPress: () => void }) {
  const t = useInfoTheme();
  return (
    <TouchableOpacity style={[styles.row, { borderColor: t.border }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={26} color={Colors.light.primary} accent="#FFA000" />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
        <Text style={[styles.rowDetail, { color: t.sub }]}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={t.sub} />
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const t = useInfoTheme();
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);
  const version = Constants.expoConfig?.version ?? '';

  const email = () => {
    const subject = encodeURIComponent('Wami support');
    const body = encodeURIComponent(`\n\n---\nWami ${version} · ${Platform.OS}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <InfoPage title="Help & Support">
      <View style={[styles.card, { backgroundColor: t.card }]}>
        <Text style={[styles.heading, { color: t.text }]}>Talk to us</Text>
        <Text style={[styles.copy, { color: t.sub }]}>
          A real person reads every message. Tell us what happened and what you were trying to do.
        </Text>
        <Row
          icon="call"
          label="Call"
          detail={SUPPORT_PHONE_DISPLAY}
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE_E164}`).catch(() => {})}
        />
        <Row
          icon="chatbubbles"
          label="WhatsApp"
          detail={SUPPORT_PHONE_DISPLAY}
          onPress={() => Linking.openURL(SUPPORT_WHATSAPP).catch(() => {})}
        />
        <Row icon="mail" label="Email" detail={SUPPORT_EMAIL} onPress={email} />
      </View>

      <View style={[styles.card, { backgroundColor: t.card }]}>
        <Text style={[styles.heading, { color: t.text }]}>Common questions</Text>
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <View key={item.q} style={[styles.faq, { borderColor: t.border }]}>
              <TouchableOpacity style={styles.faqHead} onPress={() => setOpen(isOpen ? null : i)} activeOpacity={0.7}>
                <Text style={[styles.faqQ, { color: t.text }]}>{item.q}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={t.sub} />
              </TouchableOpacity>
              {isOpen ? <Text style={[styles.faqA, { color: t.sub }]}>{item.a}</Text> : null}
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.link} onPress={() => router.push('/privacy' as any)}>
        <Text style={styles.linkText}>Privacy & Security</Text>
      </TouchableOpacity>
      {version ? <Text style={[styles.version, { color: t.sub }]}>Wami {version}</Text> : null}
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16 },
  heading: { fontSize: 18, fontWeight: '800' },
  copy: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 16, fontWeight: '700' },
  rowDetail: { fontSize: 14, marginTop: 1 },
  faq: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '700' },
  faqA: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  link: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 15, fontWeight: '700', color: Colors.light.primary },
  version: { textAlign: 'center', fontSize: 12 },
});
