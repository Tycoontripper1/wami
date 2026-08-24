import SuccessScreen from '@/components/SuccessScreen';
import Colors from '@/constants/Colors';
import { deliveryService } from '@/services/deliveryService';
import { RootState } from '@/store/store';
import { Driver } from '@/types/delivery';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const QUICK_TAGS = ['On time', 'Friendly', 'Careful'];

export default function RateDriverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const driverId = params.driverId as string;

  const order = useSelector((state: RootState) => state.payment.productOrders.find(o => o.id === orderId));

  const [driver, setDriver] = useState<Driver | null>(null);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  useEffect(() => {
    if (!order) return;
    deliveryService.findDrivers(order).then((drivers) => {
      setDriver(drivers.find(d => d.id === driverId) || drivers[0]);
    });
  }, [order?.id, driverId]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  if (submitted) {
    return (
      <SuccessScreen
        title="Thank You!"
        subtitle="Your rating helps us maintain great delivery experiences."
        referenceLabel="Order"
        referenceValue={order?.trackingNumber}
        primaryLabel="Track Order"
        onPrimary={() => router.replace(`/order-tracking/${orderId}`)}
        secondaryLabel="Go Home"
        onSecondary={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {driver && <Image source={{ uri: driver.avatar }} style={styles.avatar} />}
        <Text style={[styles.title, { color: tc.text }]}>Rate {driver?.name ?? 'your driver'}</Text>
        <Text style={[styles.subtitle, { color: tc.sub }]}>How was your delivery experience?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={36}
                color={n <= rating ? '#FFD700' : tc.sub}
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tagsRow}>
          {QUICK_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: selected ? Colors.light.primary : tc.input,
                    borderColor: selected ? Colors.light.primary : tc.border,
                  },
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, { color: selected ? '#fff' : tc.text }]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.feedbackInput, { backgroundColor: tc.input, color: tc.text, borderColor: tc.border }]}
          placeholder="Leave optional feedback..."
          placeholderTextColor={tc.sub}
          value={feedback}
          onChangeText={setFeedback}
          multiline
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, rating === 0 && { opacity: 0.5 }]}
          onPress={() => setSubmitted(true)}
          disabled={rating === 0}
        >
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32 },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  starsRow: { flexDirection: 'row', marginBottom: 28 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 },
  tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 14, fontWeight: '600' },
  feedbackInput: {
    width: '100%', minHeight: 90, borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 14, textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  submitBtn: { backgroundColor: Colors.light.primary, borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
