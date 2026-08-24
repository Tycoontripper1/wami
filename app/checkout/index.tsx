import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { addProductOrder } from '@/store/paymentSlice';
import { RootState } from '@/store/store';
import { PaymentMethodType, ShippingOption, buildOrderTimeline, formatCurrency } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const SHIPPING_OPTIONS = {
  pickup: { label: 'Pick-up', duration: '3-5 days', fee: 0 },
  express: { label: 'Express', duration: '1-2 days', fee: 2000 },
};

const PAYMENT_METHODS: { key: PaymentMethodType; label: string; icon: string; description: string }[] = [
  { key: 'card', label: 'Debit / Credit Card', icon: 'card', description: 'Visa, Mastercard, Verve' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'swap-horizontal', description: 'Transfer directly from your bank' },
  { key: 'wallet', label: 'Wami Wallet', icon: 'wallet', description: 'Pay from your Wami balance' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const productId = params.productId as string;
  const user = useSelector((state: RootState) => state.auth.user);
  const walletBalance = useSelector((state: RootState) => state.wallet?.balances?.NGN ?? 0);

  const product = MOCK_PRODUCTS.find(p => p.id === productId) || MOCK_PRODUCTS[0];

  // Form state
  const [shippingOption, setShippingOption] = useState<ShippingOption>('express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [country, setCountry] = useState('Nigeria');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const deliveryFee = SHIPPING_OPTIONS[shippingOption].fee;
  const serviceFee = Math.round(product.price * 0.03);
  const total = product.price + serviceFee + deliveryFee;

  const isAddressComplete = address.trim().length > 0 && city.trim().length > 0;
  const isContactComplete = phone.trim().length > 0 && email.trim().length > 0;

  const handlePay = () => {
    if (!isAddressComplete) {
      Alert.alert('Missing Info', 'Please add a shipping address.');
      return;
    }
    if (!isContactComplete) {
      Alert.alert('Missing Info', 'Please add your contact information.');
      return;
    }

    if (paymentMethod === 'wallet') {
      if (walletBalance < total) {
        Alert.alert('Insufficient Balance', `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than the total (₦${total.toLocaleString()}). Please top up or choose another payment method.`);
        return;
      }
      processOrder();
    } else if (paymentMethod === 'bank_transfer') {
      setShowPaymentSheet(true);
    } else {
      // Card — simulate Paystack flow
      processOrder();
    }
  };

  const processOrder = () => {
    setIsProcessing(true);
    setPaymentFailed(false);

    // Simulate an occasional card decline so the payment-failed state is reachable
    if (paymentMethod === 'card' && Math.random() < 0.3) {
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentFailed(true);
      }, 1500);
      return;
    }

    const orderId = `ORD${Date.now()}`;
    const trackingNumber = `LGS-${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

    const newOrder = {
      id: orderId,
      customerId: String(user?.id ?? 'guest'),
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      sellerName: product.sellerName,
      price: product.price,
      serviceFee,
      deliveryFee,
      total,
      currency: 'NGN',
      shippingOption,
      shippingAddress: { country, address, city },
      contactInfo: { phoneNumber: phone, email },
      paymentMethod,
      paymentStatus: 'completed' as const,
      orderStatus: 'packed' as const,
      trackingNumber,
      estimatedDelivery: new Date(Date.now() + (shippingOption === 'express' ? 2 : 5) * 86400000).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' }),
      timeline: buildOrderTimeline('packed'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addProductOrder(newOrder));

    setTimeout(() => {
      setIsProcessing(false);
      router.replace(`/checkout/success?orderId=${orderId}&trackingNumber=${trackingNumber}`);
    }, 2000);
  };

  if (paymentFailed) {
    return (
      <View style={[styles.container, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <EmptyState
          icon="close-circle-outline"
          title="Payment Failed"
          message="We couldn't process your card payment. Please check your card details or try a different payment method."
          onRetry={processOrder}
          retryLabel="Try Again"
        />
        <TouchableOpacity style={styles.goBackBtn} onPress={() => setPaymentFailed(false)}>
          <Text style={[styles.goBackBtnText, { color: tc.sub }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.text }]}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Shipping Address */}
        <TouchableOpacity
          style={[styles.sectionRow, { backgroundColor: tc.card, borderColor: tc.border }]}
          onPress={() => setShowAddressSheet(true)}
        >
          <View style={styles.sectionRowLeft}>
            <Ionicons name="location" size={20} color={Colors.light.primary} />
            <View style={styles.sectionRowText}>
              <Text style={[styles.sectionRowLabel, { color: tc.sub }]}>Shipping Address</Text>
              <Text style={[styles.sectionRowValue, { color: tc.text }]} numberOfLines={1}>
                {isAddressComplete ? `${address}, ${city}` : 'Add Shipping Address'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tc.sub} />
        </TouchableOpacity>

        {/* Contact Information */}
        <TouchableOpacity
          style={[styles.sectionRow, { backgroundColor: tc.card, borderColor: tc.border }]}
          onPress={() => setShowContactSheet(true)}
        >
          <View style={styles.sectionRowLeft}>
            <Ionicons name="person" size={20} color={Colors.light.primary} />
            <View style={styles.sectionRowText}>
              <Text style={[styles.sectionRowLabel, { color: tc.sub }]}>Contact Information</Text>
              <Text style={[styles.sectionRowValue, { color: tc.text }]} numberOfLines={1}>
                {isContactComplete ? phone : 'Add Contact Information'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tc.sub} />
        </TouchableOpacity>

        {/* Item */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardTitle, { color: tc.sub }]}>Item</Text>
          <View style={styles.itemRow}>
            <View style={[styles.itemImagePlaceholder, { backgroundColor: tc.input }]}>
              <Ionicons name="image" size={28} color={tc.sub} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: tc.text }]} numberOfLines={2}>{product.name}</Text>
              <Text style={[styles.itemCategory, { color: tc.sub }]}>{product.category}</Text>
            </View>
            <Text style={[styles.itemPrice, { color: tc.text }]}>₦{product.price.toLocaleString()}</Text>
          </View>
        </View>

        {/* Shipping Options */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardTitle, { color: tc.sub }]}>Shipping Options</Text>
          {(Object.keys(SHIPPING_OPTIONS) as ShippingOption[]).map(key => {
            const opt = SHIPPING_OPTIONS[key];
            const selected = shippingOption === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.shippingOption, selected && { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}
                onPress={() => setShippingOption(key)}
              >
                <View style={[styles.radioOuter, { borderColor: selected ? Colors.light.primary : tc.border }]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.shippingInfo}>
                  <Text style={[styles.shippingLabel, { color: tc.text }]}>{opt.label}</Text>
                  <Text style={[styles.shippingDuration, { color: tc.sub }]}>{opt.duration}</Text>
                </View>
                <Text style={[styles.shippingFee, { color: opt.fee === 0 ? '#4CD964' : tc.text }]}>
                  {opt.fee === 0 ? 'Free' : `₦${opt.fee.toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price Summary */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardTitle, { color: tc.sub }]}>Price Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: tc.sub }]}>Order</Text>
            <Text style={[styles.summaryValue, { color: tc.text }]}>₦{product.price.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: tc.sub }]}>Service fee (3%)</Text>
            <Text style={[styles.summaryValue, { color: tc.text }]}>₦{serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: tc.sub }]}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: deliveryFee === 0 ? '#4CD964' : tc.text }]}>
              {deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: tc.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: tc.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: Colors.light.primary }]}>₦{total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
          <Text style={[styles.cardTitle, { color: tc.sub }]}>Payment Method</Text>
          {PAYMENT_METHODS.map(method => {
            const selected = paymentMethod === method.key;
            return (
              <TouchableOpacity
                key={method.key}
                style={[styles.paymentOption, selected && { backgroundColor: Colors.light.primary + '15', borderColor: Colors.light.primary }]}
                onPress={() => setPaymentMethod(method.key)}
              >
                <View style={[styles.paymentIconWrap, { backgroundColor: selected ? Colors.light.primary : tc.input }]}>
                  <Ionicons name={method.icon as any} size={20} color={selected ? '#fff' : tc.sub} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, { color: tc.text }]}>{method.label}</Text>
                  <Text style={[styles.paymentDesc, { color: tc.sub }]}>{method.description}</Text>
                  {method.key === 'wallet' && (
                    <Text style={[styles.walletBalance, { color: Colors.light.primary }]}>
                      Balance: ₦{walletBalance.toLocaleString()}
                    </Text>
                  )}
                </View>
                <View style={[styles.radioOuter, { borderColor: selected ? Colors.light.primary : tc.border }]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Pay Button */}
      <View style={[styles.footer, { backgroundColor: tc.card, borderTopColor: tc.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerTotal}>
          <Text style={[styles.footerTotalLabel, { color: tc.sub }]}>Total</Text>
          <Text style={[styles.footerTotalValue, { color: tc.text }]}>₦{total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, isProcessing && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={isProcessing}
        >
          <Text style={styles.payBtnText}>{isProcessing ? 'Processing...' : 'Pay'}</Text>
        </TouchableOpacity>
      </View>

      {/* Shipping Address Bottom Sheet */}
      <Modal visible={showAddressSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: tc.card }]}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.sheetTitle, { color: tc.text }]}>Shipping Address</Text>

              <Text style={[styles.inputLabel, { color: tc.sub }]}>Country</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.input, color: tc.text }]}
                value={country}
                onChangeText={setCountry}
                placeholderTextColor={tc.sub}
              />
              <Text style={[styles.inputLabel, { color: tc.sub }]}>Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.input, color: tc.text }]}
                placeholder="Street address"
                placeholderTextColor={tc.sub}
                value={address}
                onChangeText={setAddress}
              />
              <Text style={[styles.inputLabel, { color: tc.sub }]}>Town / City</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.input, color: tc.text }]}
                placeholder="City"
                placeholderTextColor={tc.sub}
                value={city}
                onChangeText={setCity}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={() => setShowAddressSheet(false)}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Contact Info Bottom Sheet */}
      <Modal visible={showContactSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: tc.card }]}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.sheetTitle, { color: tc.text }]}>Contact Information</Text>

              <Text style={[styles.inputLabel, { color: tc.sub }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.input, color: tc.text }]}
                placeholder="e.g. 08012345678"
                placeholderTextColor={tc.sub}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text style={[styles.inputLabel, { color: tc.sub }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: tc.input, color: tc.text }]}
                placeholder="email@example.com"
                placeholderTextColor={tc.sub}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={() => setShowContactSheet(false)}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Bank Transfer Sheet */}
      <Modal visible={showPaymentSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: tc.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: tc.text }]}>Bank Transfer</Text>
            <Text style={[styles.sheetSub, { color: tc.sub }]}>Transfer exactly the amount below to complete your order</Text>

            <View style={[styles.bankCard, { backgroundColor: tc.input }]}>
              <View style={styles.bankRow}>
                <Text style={[styles.bankLabel, { color: tc.sub }]}>Bank</Text>
                <Text style={[styles.bankValue, { color: tc.text }]}>Wami Payments — GT Bank</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={[styles.bankLabel, { color: tc.sub }]}>Account Number</Text>
                <Text style={[styles.bankValue, { color: tc.text }]}>0123456789</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={[styles.bankLabel, { color: tc.sub }]}>Account Name</Text>
                <Text style={[styles.bankValue, { color: tc.text }]}>Wami Technologies Ltd</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: tc.border, marginVertical: 12 }]} />
              <View style={styles.bankRow}>
                <Text style={[styles.bankLabel, { color: tc.sub }]}>Amount to Transfer</Text>
                <Text style={[styles.transferAmount, { color: Colors.light.primary }]}>₦{total.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => { setShowPaymentSheet(false); processOrder(); }}>
              <Text style={styles.saveBtnText}>I've Transferred — Confirm Order</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPaymentSheet(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: tc.sub }]}>Cancel</Text>
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
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  goBackBtn: { alignItems: 'center', paddingBottom: 40 },
  goBackBtnText: { fontSize: 15, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 12 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  sectionRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sectionRowText: { flex: 1 },
  sectionRowLabel: { fontSize: 12, marginBottom: 2 },
  sectionRowValue: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImagePlaceholder: { width: 60, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemCategory: { fontSize: 13 },
  itemPrice: { fontSize: 16, fontWeight: '700' },
  shippingOption: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', gap: 12,
  },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.primary },
  shippingInfo: { flex: 1 },
  shippingLabel: { fontSize: 15, fontWeight: '600' },
  shippingDuration: { fontSize: 12, marginTop: 2 },
  shippingFee: { fontSize: 15, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '800' },
  divider: { height: 1 },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', gap: 12,
  },
  paymentIconWrap: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 15, fontWeight: '600' },
  paymentDesc: { fontSize: 12, marginTop: 2 },
  walletBalance: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  footer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 16, borderTopWidth: 1, gap: 16,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 12 },
  footerTotalValue: { fontSize: 20, fontWeight: '800' },
  payBtn: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 40,
    paddingVertical: 16, borderRadius: 30,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Sheets
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  sheetSub: { fontSize: 14, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  saveBtn: {
    backgroundColor: Colors.light.primary, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  cancelBtnText: { fontSize: 15, fontWeight: '500' },
  bankCard: { borderRadius: 16, padding: 16, gap: 10 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankLabel: { fontSize: 13 },
  bankValue: { fontSize: 14, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  transferAmount: { fontSize: 20, fontWeight: '800' },
});
