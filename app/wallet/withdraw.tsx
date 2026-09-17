import Colors from '@/constants/Colors';
import { requestPayout } from '@/services/api/sellerService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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

export default function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    border: isDark ? '#333' : '#e0e0e0',
    inputBg: isDark ? '#1a1a1a' : '#f9f9f9',
  };

  const handleWithdraw = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (!accountNumber.trim() || !accountName.trim() || !bankCode.trim()) {
      Alert.alert('Missing Bank Details', 'Please fill in your account number, account name, and bank code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayout({
        amount: numericAmount,
        bank_details: {
          account_number: accountNumber.trim(),
          account_name: accountName.trim(),
          bank_code: bankCode.trim(),
        },
      });
      Alert.alert('Payout Requested', "We've received your withdrawal request. It's now pending review.", [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to request payout:', error);
      Alert.alert("Couldn't Request Payout", error?.message ?? 'Something went wrong while submitting your withdrawal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Withdraw</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="arrow-up" size={48} color={Colors.light.primary} />
          </View>
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>Withdraw Funds</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Request a payout to your linked bank account. Requests are reviewed before funds are released.
        </Text>

        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Amount (₦)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="e.g. 20000"
          placeholderTextColor={themeColors.subText}
        />

        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Account Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
          placeholder="0123456789"
          placeholderTextColor={themeColors.subText}
        />

        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Account Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="As it appears on your bank account"
          placeholderTextColor={themeColors.subText}
        />

        <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Bank Code</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: themeColors.border }]}
          value={bankCode}
          onChangeText={setBankCode}
          keyboardType="number-pad"
          placeholder="e.g. 011"
          placeholderTextColor={themeColors.subText}
        />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleWithdraw}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Request Withdrawal</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    marginTop: 12,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,188,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  submitButton: {
    width: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
