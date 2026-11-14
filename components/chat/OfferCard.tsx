import { Text, TextInput } from '@/components/AppText';
import Colors from '@/constants/Colors';
import { ApiOffer, OfferStatus, answerOffer } from '@/services/api/offersService';
import { formatAmountInput, parseAmount } from '@/utils/money';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Alert } from '@/components/AppAlert';

/* A price offer, drawn in the chat in place of a plain message. Whoever
   received it (the message is not theirs) can Accept, Decline or Counter while
   it is pending; whoever made it can Withdraw it. Once it is answered the card
   says so, and an accepted offer points the buyer back to the item, where the
   server prices it at the agreed amount. */

type Theme = { text: string; subText: string; border: string; card: string };

const LABEL: Record<OfferStatus, string> = {
  pending: 'Waiting for an answer',
  accepted: 'Accepted',
  declined: 'Declined',
  countered: 'Countered',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

const TONE: Record<OfferStatus, string> = {
  pending: '#E08A00',
  accepted: '#1F8F6C',
  declined: '#E5533F',
  countered: '#7660D0',
  withdrawn: '#6B7280',
  expired: '#6B7280',
};

const naira = (n: number) => `₦${n.toLocaleString()}`;

export default function OfferCard({
  offer,
  incoming,
  theme,
  onChange,
}: {
  offer: ApiOffer;
  /** True when the other person made this offer, so it is mine to answer. */
  incoming: boolean;
  theme: Theme;
  /** Called with the updated offer, and again after a counter, so the chat can reload. */
  onChange: (offer: ApiOffer, countered?: boolean) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [countering, setCountering] = useState(false);
  const [counter, setCounter] = useState('');

  const pending = offer.status === 'pending';
  const tone = TONE[offer.status];

  const run = async (status: 'accepted' | 'declined' | 'countered' | 'withdrawn', amount?: number) => {
    setBusy(status);
    try {
      const next = await answerOffer(offer.id, status, amount);
      onChange(next, status === 'countered');
      setCountering(false);
      setCounter('');
    } catch (error: any) {
      Alert.alert("That didn't go through", error?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const sendCounter = () => {
    const amount = parseAmount(counter);
    if (amount <= 0) {
      Alert.alert('Add an amount', 'Enter the price you would take.');
      return;
    }
    if (offer.listed_price && amount >= offer.listed_price) {
      Alert.alert('That is not a counter', `The listed price is ${naira(offer.listed_price)}. Counter with something lower.`);
      return;
    }
    run('countered', amount);
  };

  const button = (label: string, onPress: () => void, kind: 'primary' | 'plain' | 'danger', key: string) => (
    <TouchableOpacity
      key={key}
      onPress={onPress}
      disabled={busy !== null}
      accessibilityRole="button"
      style={[
        styles.btn,
        kind === 'primary' && { backgroundColor: Colors.light.primary },
        kind === 'plain' && { borderWidth: 1, borderColor: theme.border },
        kind === 'danger' && { borderWidth: 1, borderColor: '#E5533F' },
        busy !== null && { opacity: 0.6 },
      ]}
    >
      {busy === key ? (
        <ActivityIndicator size="small" color={kind === 'primary' ? '#0F1419' : theme.text} />
      ) : (
        <Text style={[styles.btnText, { color: kind === 'primary' ? '#0F1419' : kind === 'danger' ? '#E5533F' : theme.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.kicker, { color: theme.subText }]}>{incoming ? 'Price offer for you' : 'Your price offer'}</Text>
      <Text style={[styles.amount, { color: theme.text }]}>{naira(offer.amount)}</Text>
      {offer.listed_price ? <Text style={[styles.listed, { color: theme.subText }]}>Listed at {naira(offer.listed_price)}</Text> : null}

      <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
        <Text style={[styles.pillText, { color: tone }]}>{pending && !incoming ? 'Waiting for a reply' : LABEL[offer.status]}</Text>
      </View>

      {pending && incoming ? (
        countering ? (
          <View style={{ marginTop: 12 }}>
            <TextInput
              value={counter}
              onChangeText={(t) => setCounter(formatAmountInput(t))}
              placeholder="Your price (₦)"
              placeholderTextColor={theme.subText}
              keyboardType="numeric"
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <View style={styles.row}>
              {button('Send counter', sendCounter, 'primary', 'countered')}
              {button('Cancel', () => setCountering(false), 'plain', 'cancel')}
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            {button('Accept', () => run('accepted'), 'primary', 'accepted')}
            {button('Counter', () => setCountering(true), 'plain', 'counter')}
            {button('Decline', () => run('declined'), 'danger', 'declined')}
          </View>
        )
      ) : null}

      {pending && !incoming ? <View style={styles.row}>{button('Withdraw', () => run('withdrawn'), 'plain', 'withdrawn')}</View> : null}

      {offer.status === 'accepted' && !incoming && offer.listing_id ? (
        <View style={styles.row}>
          {button(`Buy at ${naira(offer.amount)}`, () => router.push(`/product-detail/${offer.listing_id}` as any), 'primary', 'buy')}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, minWidth: 220, maxWidth: 300 },
  kicker: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  listed: { fontSize: 13, marginTop: 2 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  pillText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { minHeight: 40, borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 15 },
});
