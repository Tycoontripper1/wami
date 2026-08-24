import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
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
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const handleSave = () => {
    if (!serviceName || !description || !startingPrice) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Service Added', 'Your service has been listed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Add a Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FloatingLabelInput
          label="Service name *"
          placeholder="e.g. Wedding Photography"
          value={serviceName}
          onChangeText={setServiceName}
        />
        <FloatingLabelInput
          label="Description *"
          placeholder="Describe what's included in this service"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
          containerStyle={{ marginBottom: 20 }}
        />
        <FloatingLabelInput
          label="Starting price (₦) *"
          placeholder="e.g. 25000"
          value={startingPrice}
          onChangeText={setStartingPrice}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>List Service</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 60 },
  saveButton: {
    backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
