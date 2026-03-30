import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { profileService } from '@/services/api/profileService';
import { signOut } from '@/store/authSlice';
import { AccountActionRequest } from '@/types/accountTypes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

type ActionType = 'deactivate' | 'delete' | null;

export default function AccountActionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [showPassword, setShowPassword] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleAction = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password to confirm');
      return;
    }

    try {
      setIsProcessing(true);
      const data: AccountActionRequest = { password };

      if (selectedAction === 'deactivate') {
        await profileService.deactivateAccount(data);
        Alert.alert('Account Deactivated', 'Your account has been deactivated. You can reactivate it by signing in again.');
      } else if (selectedAction === 'delete') {
        await profileService.deleteAccount(data);
        Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
      }

      // Logout and redirect
      dispatch(signOut());
      router.replace('/(auth)/sign-in');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Action failed. Please check your password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = (type: ActionType) => {
    setSelectedAction(type);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Account Actions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!selectedAction ? (
          <View>
            <Text style={[styles.title, { color: themeColors.text }]}>Manage your account</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              Choose how you want to manage your presence on Wami.
            </Text>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: themeColors.cardBg }]}
              onPress={() => confirmAction('deactivate')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="pause-circle-outline" size={28} color="#FF9500" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: themeColors.text }]}>Deactivate Account</Text>
                <Text style={[styles.actionDescription, { color: themeColors.subText }]}>
                  Temporarily hide your profile. You can come back and reactivate anytime.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: themeColors.cardBg, borderColor: 'rgba(255,59,48,0.3)', borderWidth: 1 }]}
              onPress={() => confirmAction('delete')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                <Ionicons name="trash-outline" size={28} color="#FF3B30" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: "#FF3B30" }]}>Delete Account</Text>
                <Text style={[styles.actionDescription, { color: themeColors.subText }]}>
                  Permanently remove all your data. This action cannot be undone.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={() => setSelectedAction(null)} style={styles.backToChoices}>
              <Ionicons name="chevron-back" size={16} color={Colors.light.primary} />
              <Text style={styles.backToChoicesText}>Back to options</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: themeColors.text }]}>
              {selectedAction === 'deactivate' ? 'Deactivate your account?' : 'Delete your account?'}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              {selectedAction === 'deactivate' 
                ? 'Your profile, works, and messages will be hidden until you reactivate your account by logging back in.'
                : 'This will permanently delete your profile and all associated data. You will not be able to recover it.'}
            </Text>

            <View style={styles.passwordForm}>
              <FloatingLabelInput
                label="Confirm with Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightAccessory={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={themeColors.subText} />
                  </TouchableOpacity>
                }
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                selectedAction === 'delete' ? styles.deleteButton : styles.deactivateButton,
                isProcessing && styles.disabledButton
              ]} 
              onPress={handleAction}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {selectedAction === 'deactivate' ? 'Confirm Deactivation' : 'Permanently Delete Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  actionCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,149,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  backToChoices: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  backToChoicesText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  passwordForm: {
    marginBottom: 32,
  },
  toggleButton: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    height: '100%',
  },
  confirmButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
