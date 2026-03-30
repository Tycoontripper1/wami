import Colors from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocationData';
import { RootState } from '@/store/store';
import { addTransaction } from '@/store/walletSlice';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
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

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function AddFundsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { primaryCurrency } = useSelector((state: RootState) => state.wallet);
  const { region } = useLocation();

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paystack' | 'bank' | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
    inputBg: isDark ? '#1A1A1A' : '#F8F9FA',
  };

  // Determine available payment methods based on region
  const isNigeria = region.code === 'NG';

  const handlePresetSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add transaction
      dispatch(
        addTransaction({
          id: `txn_${Date.now()}`,
          title: 'Add Funds',
          amount: parseFloat(amount),
          currency: primaryCurrency,
          type: 'credit',
          category: 'topup',
          status: 'success',
          date: new Date().toISOString(),
          paymentMethod: selectedMethod,
        })
      );

      Alert.alert('Success!', 'Funds added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add funds. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Add Funds</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: themeColors.subText }]}>Enter Amount</Text>
            <View style={[styles.amountContainer, { backgroundColor: themeColors.inputBg }]}>
              <Text style={[styles.currencySymbol, { color: themeColors.text }]}>
                {primaryCurrency === 'NGN' ? '₦' : '$'}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: themeColors.text }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={themeColors.subText}
              />
            </View>
          </View>

          {/* Preset Amounts */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: themeColors.subText }]}>Quick Select</Text>
            <View style={styles.presetsGrid}>
              {PRESET_AMOUNTS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor:
                        amount === preset.toString()
                          ? Colors.light.primary
                          : themeColors.cardBg,
                      borderColor:
                        amount === preset.toString()
                          ? Colors.light.primary
                          : themeColors.border,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color:
                          amount === preset.toString() ? '#fff' : themeColors.text,
                      },
                    ]}
                  >
                    {primaryCurrency === 'NGN' ? '₦' : '$'}
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: themeColors.subText }]}>
              Payment Method
            </Text>

            {/* Stripe - International */}
            {!isNigeria && (
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor:
                      selectedMethod === 'stripe' ? Colors.light.primary : themeColors.border,
                    borderWidth: selectedMethod === 'stripe' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedMethod('stripe')}
                activeOpacity={0.7}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, { backgroundColor: '#635BFF15' }]}>
                    <Ionicons name="card" size={24} color="#635BFF" />
                  </View>
                  <View>
                    <Text style={[styles.methodTitle, { color: themeColors.text }]}>
                      Credit/Debit Card
                    </Text>
                    <Text style={[styles.methodSubtitle, { color: themeColors.subText }]}>
                      Powered by Stripe
                    </Text>
                  </View>
                </View>
                {selectedMethod === 'stripe' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            )}

            {/* Paystack - Nigeria */}
            {isNigeria && (
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor:
                      selectedMethod === 'paystack' ? Colors.light.primary : themeColors.border,
                    borderWidth: selectedMethod === 'paystack' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedMethod('paystack')}
                activeOpacity={0.7}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, { backgroundColor: '#00C3F715' }]}>
                    <Ionicons name="card" size={24} color="#00C3F7" />
                  </View>
                  <View>
                    <Text style={[styles.methodTitle, { color: themeColors.text }]}>
                      Nigerian Card
                    </Text>
                    <Text style={[styles.methodSubtitle, { color: themeColors.subText }]}>
                      Powered by Paystack
                    </Text>
                  </View>
                </View>
                {selectedMethod === 'paystack' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            )}

            {/* Bank Transfer - Nigeria */}
            {isNigeria && (
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor:
                      selectedMethod === 'bank' ? Colors.light.primary : themeColors.border,
                    borderWidth: selectedMethod === 'bank' ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedMethod('bank')}
                activeOpacity={0.7}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, { backgroundColor: '#4CAF5015' }]}>
                    <Ionicons name="business" size={24} color="#4CAF50" />
                  </View>
                  <View>
                    <Text style={[styles.methodTitle, { color: themeColors.text }]}>
                      Bank Transfer
                    </Text>
                    <Text style={[styles.methodSubtitle, { color: themeColors.subText }]}>
                      Instant using your bank app
                    </Text>
                  </View>
                </View>
                {selectedMethod === 'bank' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor:
                  !amount || !selectedMethod || isProcessing
                    ? themeColors.border
                    : Colors.light.primary,
              },
            ]}
            onPress={handleAddFunds}
            disabled={!amount || !selectedMethod || isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <Text style={styles.buttonText}>Processing...</Text>
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 16,
    height: 64,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  presetText: {
    fontSize: 16,
    fontWeight: '700',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
