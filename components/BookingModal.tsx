import Colors from '@/constants/Colors';
import { createBooking } from '@/services/api/bookingsService';
import { addBooking, Booking } from '@/store/bookingsSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  creative: {
    id: string;
    name: string;
    role: string;
    image?: string;
  };
  onViewBooking?: (bookingId: string) => void;
  onMessage?: () => void;
}

const PROJECT_TYPES = ['Photoshoot', 'Event', 'Branding', 'Custom Project'];
const BUDGET_RANGES = ['₦20,000 – ₦50,000', '₦50,000 – ₦100,000', '₦100,000 – ₦250,000', '₦250,000+'];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toISOString().split('T')[0],
    });
  }
  return dates;
};

const STEP_LABELS = ['Project', 'Schedule', 'Summary', 'Done'];
const PAYMENT_METHODS = [
  { key: 'card', label: 'Debit / Credit Card', icon: 'card' as const },
  { key: 'wallet', label: 'Wami Wallet', icon: 'wallet' as const },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'swap-horizontal' as const },
];

export default function BookingModal({ visible, onClose, creative, onViewBooking, onMessage }: BookingModalProps) {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(1);

  // Step 1
  const [projectType, setProjectType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState<string | null>(null);
  const [milestonePayment, setMilestonePayment] = useState(false);

  // Step 2
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Result
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = generateDates();

  const themeColors = {
    background: isDark ? '#1a1a1a' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#2a2a2a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  // Mock base price derived from budget range for fee breakdown
  const basePrice = budgetRange
    ? parseInt(budgetRange.replace(/[^\d]/g, '').slice(0, 6) || '50000', 10) || 50000
    : 50000;
  const wamiFee = Math.round(basePrice * 0.18);
  const total = basePrice + wamiFee;

  const resetAndClose = () => {
    setStep(1);
    setProjectType(null);
    setDescription('');
    setBudgetRange(null);
    setMilestonePayment(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setPaymentMethod('card');
    setBookingRef(null);
    onClose();
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => (step === 1 ? resetAndClose() : setStep((s) => s - 1));

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const apiBooking = await createBooking({
        offering_id: creative.id,
        project_title: `${projectType} with ${creative.name}`,
        project_details: description.trim(),
        start_date: selectedDate!,
        end_date: selectedDate!,
        total_amount: total,
        currency: 'NGN',
      });

      const ref = String(apiBooking.data?.id ?? `WB-${Date.now().toString().slice(-8)}`);
      const booking: Booking = {
        id: `booking_${Date.now()}`,
        creativeId: creative.id,
        creativeName: creative.name,
        creativeRole: creative.role,
        creativeImage: creative.image,
        date: selectedDate!,
        time: selectedTime!,
        notes: description.trim() || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      dispatch(addBooking(booking));
      setBookingRef(ref);
      goNext();
    } catch (error) {
      console.error('Failed to create booking:', error);
      Alert.alert("Couldn't Book", 'Something went wrong while creating your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const step1Valid = projectType && description.trim().length > 0 && budgetRange;
  const step2Valid = selectedDate && selectedTime;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.closeButton}>
              <Ionicons name={step === 1 ? 'close' : 'arrow-back'} size={24} color={themeColors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {step < 4 ? `Step ${step} of 3` : 'Booking Confirmed'}
            </Text>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
              {step < 4 && <Ionicons name="close" size={24} color={themeColors.text} />}
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          {step < 4 && (
            <View style={styles.stepIndicatorRow}>
              {STEP_LABELS.slice(0, 3).map((label, i) => (
                <View key={label} style={styles.stepIndicatorItem}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor: i + 1 <= step ? Colors.light.primary : themeColors.cardBg,
                        borderColor: i + 1 <= step ? Colors.light.primary : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: i + 1 <= step ? '#fff' : themeColors.subText, fontSize: 12, fontWeight: '700' }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepIndicatorLabel, { color: i + 1 === step ? Colors.light.primary : themeColors.subText }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* STEP 1 — Project details */}
            {step === 1 && (
              <>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Project Type</Text>
                <View style={styles.chipsRow}>
                  {PROJECT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: projectType === type ? Colors.light.primary : themeColors.cardBg,
                          borderColor: projectType === type ? Colors.light.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => setProjectType(type)}
                    >
                      <Text style={{ color: projectType === type ? '#fff' : themeColors.text, fontSize: 13, fontWeight: '500' }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Project Description</Text>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: themeColors.cardBg, color: themeColors.text, borderColor: themeColors.border }]}
                  placeholder="Describe what you need..."
                  placeholderTextColor={themeColors.subText}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Budget Range</Text>
                <View style={styles.chipsColumn}>
                  {BUDGET_RANGES.map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.budgetOption,
                        {
                          backgroundColor: budgetRange === range ? Colors.light.primary + '15' : themeColors.cardBg,
                          borderColor: budgetRange === range ? Colors.light.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => setBudgetRange(range)}
                    >
                      <View style={[styles.radioOuter, { borderColor: budgetRange === range ? Colors.light.primary : themeColors.border }]}>
                        {budgetRange === range && <View style={styles.radioInner} />}
                      </View>
                      <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '500' }}>{range}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.milestoneToggle, { backgroundColor: themeColors.cardBg }]}
                  onPress={() => setMilestonePayment((v) => !v)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneTitle, { color: themeColors.text }]}>Pay in Milestones</Text>
                    <Text style={[styles.milestoneSub, { color: themeColors.subText }]}>
                      Split payment across project stages instead of paying upfront
                    </Text>
                  </View>
                  <View style={[styles.switchTrack, { backgroundColor: milestonePayment ? Colors.light.primary : themeColors.border }]}>
                    <View style={[styles.switchThumb, milestonePayment && styles.switchThumbOn]} />
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2 — Date & time */}
            {step === 2 && (
              <>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
                  {dates.map((d) => (
                    <TouchableOpacity
                      key={d.full}
                      style={[
                        styles.dateCard,
                        { backgroundColor: selectedDate === d.full ? Colors.light.primary : themeColors.cardBg },
                      ]}
                      onPress={() => setSelectedDate(d.full)}
                    >
                      <Text style={[styles.dateDay, { color: selectedDate === d.full ? '#fff' : themeColors.subText }]}>{d.day}</Text>
                      <Text style={[styles.dateNum, { color: selectedDate === d.full ? '#fff' : themeColors.text }]}>{d.date}</Text>
                      <Text style={[styles.dateMonth, { color: selectedDate === d.full ? '#fff' : themeColors.subText }]}>{d.month}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Time</Text>
                <View style={styles.timesContainer}>
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeCard,
                        {
                          backgroundColor: selectedTime === time ? Colors.light.primary : themeColors.cardBg,
                          borderColor: selectedTime === time ? Colors.light.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={{ color: selectedTime === time ? '#fff' : themeColors.text, fontSize: 14, fontWeight: '500' }}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* STEP 3 — Order summary + payment */}
            {step === 3 && (
              <>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Order Summary</Text>
                <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBg }]}>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: themeColors.subText, fontSize: 14 }}>Project</Text>
                    <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '600' }}>{projectType}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: themeColors.subText, fontSize: 14 }}>Date & Time</Text>
                    <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '600' }}>{selectedDate} · {selectedTime}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.summaryRow}>
                    <Text style={{ color: themeColors.subText, fontSize: 14 }}>Service Cost</Text>
                    <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '600' }}>₦{basePrice.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: themeColors.subText, fontSize: 14 }}>Wami Fee (18%)</Text>
                    <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '600' }}>₦{wamiFee.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                  <View style={styles.summaryRow}>
                    <Text style={{ color: themeColors.text, fontSize: 16, fontWeight: '700' }}>Total</Text>
                    <Text style={{ color: Colors.light.primary, fontSize: 18, fontWeight: '800' }}>₦{total.toLocaleString()}</Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Payment Method</Text>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: paymentMethod === m.key ? Colors.light.primary + '15' : themeColors.cardBg,
                        borderColor: paymentMethod === m.key ? Colors.light.primary : themeColors.border,
                      },
                    ]}
                    onPress={() => setPaymentMethod(m.key)}
                  >
                    <Ionicons name={m.icon} size={20} color={paymentMethod === m.key ? Colors.light.primary : themeColors.subText} />
                    <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '500', flex: 1, marginLeft: 12 }}>{m.label}</Text>
                    <View style={[styles.radioOuter, { borderColor: paymentMethod === m.key ? Colors.light.primary : themeColors.border }]}>
                      {paymentMethod === m.key && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* STEP 4 — Success */}
            {step === 4 && (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-circle" size={72} color={Colors.light.primary} />
                </View>
                <Text style={[styles.successTitle, { color: themeColors.text }]}>Booking Confirmed!</Text>
                <Text style={[styles.successSub, { color: themeColors.subText }]}>
                  Your booking with {creative.name} has been confirmed.
                </Text>
                <View style={[styles.refCard, { backgroundColor: themeColors.cardBg }]}>
                  <Text style={{ color: themeColors.subText, fontSize: 12 }}>Booking Reference</Text>
                  <Text style={{ color: themeColors.text, fontSize: 18, fontWeight: '700', marginTop: 4 }}>{bookingRef}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer buttons */}
          {step === 1 && (
            <TouchableOpacity style={[styles.bookButton, !step1Valid && styles.bookButtonDisabled]} onPress={goNext} disabled={!step1Valid}>
              <Text style={styles.bookButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
          {step === 2 && (
            <TouchableOpacity style={[styles.bookButton, !step2Valid && styles.bookButtonDisabled]} onPress={goNext} disabled={!step2Valid}>
              <Text style={styles.bookButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
          {step === 3 && (
            <TouchableOpacity
              style={[styles.bookButton, isSubmitting && styles.bookButtonDisabled]}
              onPress={handleConfirmBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          )}
          {step === 4 && (
            <View style={styles.successButtonsRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: themeColors.cardBg }]}
                onPress={() => {
                  resetAndClose();
                  onMessage?.();
                }}
              >
                <Text style={{ color: themeColors.text, fontSize: 15, fontWeight: '600' }}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookButton, { flex: 1, marginTop: 0 }]}
                onPress={() => {
                  resetAndClose();
                  onViewBooking?.(bookingRef!);
                }}
              >
                <Text style={styles.bookButtonText}>View Booking</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  closeButton: { padding: 4, width: 32 },
  stepIndicatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stepIndicatorItem: { alignItems: 'center', flex: 1, gap: 4 },
  stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepIndicatorLabel: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipsColumn: { gap: 10, marginBottom: 20 },
  budgetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.primary },
  milestoneToggle: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, marginBottom: 20 },
  milestoneTitle: { fontSize: 15, fontWeight: '600' },
  milestoneSub: { fontSize: 12, marginTop: 2 },
  switchTrack: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  switchThumbOn: { alignSelf: 'flex-end' },
  datesContainer: { marginBottom: 24 },
  dateCard: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, marginRight: 10, minWidth: 70 },
  dateDay: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  dateNum: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  dateMonth: { fontSize: 12 },
  timesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  timeCard: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  notesInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  summaryCard: { borderRadius: 16, padding: 16, gap: 10, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIconWrap: { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  successSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  refCard: { borderRadius: 16, padding: 18, alignItems: 'center', width: '100%' },
  bookButton: { backgroundColor: Colors.light.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  bookButtonDisabled: { opacity: 0.5 },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  secondaryButton: { flex: 1, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
});
