import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetVerificationCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string; token: string }>();
  const [code, setCode] = useState(['', '', '', '']); // 4 digits
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNext = () => {
    const fullCode = code.join('');
    if (fullCode.length === 4) {
      router.push({
        pathname: './reset-password',
        params: {
          email: params.email,
          token: params.token,
          otp: fullCode,
        },
      } as any);
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>W</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>Enter the code to verify your account</Text>
        </View>

        {/* Code Input (4 digits) */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInput | null) => { inputRefs.current[index] = ref; }}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(text: string) => handleCodeChange(text, index)}
              onKeyPress={(e: any) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={true}
              showSoftInputOnFocus={false} // Using custom pad
            />
          ))}
        </View>

        <TouchableOpacity style={styles.resendLink}>
            <Text style={styles.resendText}>Resend code</Text>
        </TouchableOpacity>

        {/* Custom Number Pad */}
        <View style={styles.numberPad}>
          <View style={styles.numberRow}>
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => {
                  const emptyIndex = code.findIndex(d => d === '');
                  if (emptyIndex !== -1) {
                    handleCodeChange(num.toString(), emptyIndex);
                  }
                }}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => {
                  const emptyIndex = code.findIndex(d => d === '');
                  if (emptyIndex !== -1) {
                    handleCodeChange(num.toString(), emptyIndex);
                  }
                }}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => {
                  const emptyIndex = code.findIndex(d => d === '');
                  if (emptyIndex !== -1) {
                    handleCodeChange(num.toString(), emptyIndex);
                  }
                }}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            <View style={styles.numberButton} />
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => {
                const emptyIndex = code.findIndex(d => d === '');
                if (emptyIndex !== -1) {
                  handleCodeChange('0', emptyIndex);
                }
              }}
            >
              <Text style={styles.numberText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => {
                const lastFilledIndex = code.map((d, i) => d ? i : -1).filter(i => i !== -1).pop();
                if (lastFilledIndex !== undefined) {
                  const newCode = [...code];
                  newCode[lastFilledIndex] = '';
                  setCode(newCode);
                }
              }}
            >
              <Ionicons name="backspace-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{flex: 1}} />

        {/* Next Button */}
        <TouchableOpacity 
          style={[styles.nextButton, !isCodeComplete && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isCodeComplete}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the 4 boxes
    gap: 16, // Use gap for spacing
    marginBottom: 20,
  },
  codeInput: {
    width: 64, // Slightly wider since there are fewer
    height: 64,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  codeInputFilled: {
    // borderColor: Colors.light.primary, // Design doesn't show border highlight, but it's good UX
  },
  resendLink: {
      alignItems: 'flex-end',
      marginBottom: 20,
      marginRight: 40, // rough alignment
  },
  resendText: {
      color: '#999',
      fontSize: 12,
  },
  numberPad: {
    marginTop: 20,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  nextButton: {
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
