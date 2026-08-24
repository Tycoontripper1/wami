import Colors from '@/constants/Colors';
import { respondToQuote } from '@/services/api/quotesService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const WAMI_FEE_PERCENT = 0.18;

export default function QuoteReceivedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const quoteId = params.id as string;
  const creativeName = (params.creativeName as string) || 'Creative';
  const service = (params.service as string) || 'Custom Service';
  const offerAmount = Number(params.offerAmount) || 80000;

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'countered' | 'declined'>('pending');
  const [isResponding, setIsResponding] = useState(false);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const wamiFee = Math.round(offerAmount * WAMI_FEE_PERCENT);
  const total = offerAmount + wamiFee;

  const respond = async (accepted: boolean) => {
    setIsResponding(true);
    try {
      await respondToQuote(quoteId, { accepted });
      setStatus(accepted ? 'accepted' : 'declined');
      if (accepted) {
        Alert.alert('Quote Accepted!', 'Proceed to booking to confirm your appointment.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Failed to respond to quote:', error);
      Alert.alert("Couldn't Respond", 'Something went wrong while responding to this quote. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleAccept = () => {
    Alert.alert(
      'Accept Quote',
      `Accept ${creativeName}'s offer of ₦${offerAmount.toLocaleString()} (₦${total.toLocaleString()} total with Wami fee)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => respond(true) },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert('Decline Quote', 'Are you sure you want to decline this offer?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => respond(false) },
    ]);
  };

  const handleSendCounter = () => {
    if (!counterAmount.trim()) {
      Alert.alert('Missing Amount', 'Please enter your counter offer');
      return;
    }
    setStatus('countered');
    setShowCounterModal(false);
    Alert.alert('Counter Offer Sent', `Your counter offer of ₦${Number(counterAmount).toLocaleString()} has been sent to ${creativeName}.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView edges={['top']} style={{ backgroundColor: tc.card }}>
        <View style={[styles.header, { borderBottomColor: tc.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={tc.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.text }]}>Quote Received</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <View style={styles.creativeRow}>
            <View style={[styles.avatar, { backgroundColor: tc.input }]}>
              <Ionicons name="person" size={24} color={tc.sub} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.creativeName, { color: tc.text }]}>{creativeName}</Text>
              <Text style={[styles.serviceText, { color: tc.sub }]}>{service}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: status === 'pending' ? Colors.light.primary + '15' : tc.input }]}>
              <Text style={[styles.statusPillText, { color: Colors.light.primary }]}>{status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardLabel, { color: tc.sub }]}>Offer Amount</Text>
          <Text style={[styles.offerAmount, { color: Colors.light.primary }]}>₦{offerAmount.toLocaleString()}</Text>

          <View style={[styles.divider, { backgroundColor: tc.border }]} />

          <Text style={[styles.cardLabel, { color: tc.sub, marginBottom: 8 }]}>Fee Breakdown</Text>
          <View style={styles.feeRow}>
            <Text style={{ color: tc.sub, fontSize: 14 }}>Service Cost</Text>
            <Text style={{ color: tc.text, fontSize: 14, fontWeight: '600' }}>₦{offerAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={{ color: tc.sub, fontSize: 14 }}>Wami Fee (18%)</Text>
            <Text style={{ color: tc.text, fontSize: 14, fontWeight: '600' }}>₦{wamiFee.toLocaleString()}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <View style={styles.feeRow}>
            <Text style={{ color: tc.text, fontSize: 16, fontWeight: '700' }}>Total</Text>
            <Text style={{ color: Colors.light.primary, fontSize: 18, fontWeight: '800' }}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {status === 'pending' && (
        <View style={[styles.footer, { backgroundColor: tc.card, borderTopColor: tc.border, paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={[styles.declineBtn, { borderColor: tc.border }]} onPress={handleDecline} disabled={isResponding}>
            <Text style={[styles.declineBtnText, { color: tc.text }]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.counterBtn, { borderColor: Colors.light.primary }]} onPress={() => setShowCounterModal(true)} disabled={isResponding}>
            <Text style={[styles.counterBtnText, { color: Colors.light.primary }]}>Counter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={isResponding}>
            {isResponding ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptBtnText}>Accept</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCounterModal} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: tc.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: tc.text }]}>Counter Offer</Text>
            <View style={[styles.inputRow, { backgroundColor: tc.input }]}>
              <Text style={{ color: tc.text, fontSize: 16, fontWeight: '600' }}>₦</Text>
              <TextInput
                style={[styles.input, { color: tc.text }]}
                placeholder="Enter your counter amount"
                placeholderTextColor={tc.sub}
                keyboardType="numeric"
                value={counterAmount}
                onChangeText={setCounterAmount}
              />
            </View>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendCounter}>
              <Text style={styles.sendBtnText}>Send Counter Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCounterModal(false)} style={styles.cancelBtn}>
              <Text style={{ color: tc.sub, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  creativeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  creativeName: { fontSize: 16, fontWeight: '700' },
  serviceText: { fontSize: 13, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  offerAmount: { fontSize: 28, fontWeight: '800', marginTop: 6, marginBottom: 14 },
  divider: { height: 1, marginVertical: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  declineBtn: { flex: 1, borderWidth: 1.5, borderRadius: 26, paddingVertical: 14, alignItems: 'center' },
  declineBtnText: { fontSize: 14, fontWeight: '600' },
  counterBtn: { flex: 1, borderWidth: 1.5, borderRadius: 26, paddingVertical: 14, alignItems: 'center' },
  counterBtnText: { fontSize: 14, fontWeight: '600' },
  acceptBtn: { flex: 1, backgroundColor: Colors.light.primary, borderRadius: 26, paddingVertical: 14, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  input: { flex: 1, fontSize: 16 },
  sendBtn: { backgroundColor: Colors.light.primary, borderRadius: 26, paddingVertical: 15, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
});
