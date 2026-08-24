import Colors from '@/constants/Colors';
import { createBooking } from '@/services/api/bookingsService';
import { createQuote } from '@/services/api/quotesService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface QuoteRequestModalProps {
  visible: boolean;
  onClose: () => void;
  creative: {
    id: string;
    name: string;
    role: string;
    priceRange?: { min: number; max: number };
  };
  onSubmit: (quote: QuoteRequest) => void;
}

export interface QuoteRequest {
  id: string;
  bookingId: string;
  creativeId: string;
  creativeName: string;
  service: string;
  budget: string;
  description: string;
  preferredDate: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

const SERVICE_OPTIONS = [
  'Portrait Photography',
  'Event Coverage',
  'Product Shoot',
  'Hair Styling',
  'Makeup',
  'Custom Service',
];

export default function QuoteRequestModal({
  visible,
  onClose,
  creative,
  onSubmit,
}: QuoteRequestModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedService, setSelectedService] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddReferenceImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setReferenceImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const themeColors = {
    background: isDark ? '#1a1a1a' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#2a2a2a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const handleSubmit = async () => {
    if (!selectedService || !budget || !description) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const budgetAmount = Number(budget.replace(/[^\d]/g, '')) || 0;
    const today = new Date().toISOString().split('T')[0];

    setIsSubmitting(true);
    try {
      // A quote is created against a booking, so we open a (negotiating)
      // booking first, then attach the buyer's proposed quote to it.
      const bookingRes = await createBooking({
        offering_id: creative.id,
        project_title: selectedService,
        project_details: description,
        start_date: preferredDate || today,
        end_date: preferredDate || today,
        total_amount: budgetAmount,
        currency: 'NGN',
      });
      const bookingId = String(bookingRes.data?.id ?? `booking_${Date.now()}`);

      const quoteRes = await createQuote({
        booking_id: bookingId,
        price: budgetAmount,
        currency: 'NGN',
        message: description,
      });
      const quoteId = String(quoteRes.data?.id ?? `quote_${Date.now()}`);

      const quote: QuoteRequest = {
        id: quoteId,
        bookingId,
        creativeId: creative.id,
        creativeName: creative.name,
        service: selectedService,
        budget,
        description,
        preferredDate: preferredDate || 'Flexible',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      onSubmit(quote);
      Alert.alert(
        'Quote Request Sent! 🎉',
        `Your request has been sent to ${creative.name}. They will respond within 24 hours.`,
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset form
      setSelectedService('');
      setBudget('');
      setDescription('');
      setPreferredDate('');
      setReferenceImages([]);
    } catch (error) {
      console.error('Failed to send quote request:', error);
      Alert.alert("Couldn't Send Request", 'Something went wrong while sending your quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>Get a Quote</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Creative Info */}
          <View style={[styles.creativeInfo, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={themeColors.subText} />
            </View>
            <View>
              <Text style={[styles.creativeName, { color: themeColors.text }]}>{creative.name}</Text>
              <Text style={[styles.creativeRole, { color: themeColors.subText }]}>{creative.role}</Text>
              {creative.priceRange && (
                <Text style={[styles.priceInfo, { color: Colors.light.primary }]}>
                  ₦{creative.priceRange.min.toLocaleString()} - ₦{creative.priceRange.max.toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Service Selection */}
            <Text style={[styles.label, { color: themeColors.text }]}>What do you need? *</Text>
            <View style={styles.servicesGrid}>
              {SERVICE_OPTIONS.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.serviceOption,
                    {
                      backgroundColor:
                        selectedService === service ? Colors.light.primary : themeColors.cardBg,
                      borderColor: selectedService === service ? Colors.light.primary : themeColors.border,
                    },
                  ]}
                  onPress={() => setSelectedService(service)}
                >
                  <Text
                    style={[
                      styles.serviceText,
                      { color: selectedService === service ? '#fff' : themeColors.text },
                    ]}
                  >
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget */}
            <Text style={[styles.label, { color: themeColors.text }]}>Your Budget *</Text>
            <View style={[styles.inputContainer, { backgroundColor: themeColors.cardBg }]}>
              <Text style={[styles.currencyPrefix, { color: themeColors.text }]}>₦</Text>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Enter your budget"
                placeholderTextColor={themeColors.subText}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />
            </View>

            {/* Description */}
            <Text style={[styles.label, { color: themeColors.text }]}>Describe what you need *</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: themeColors.cardBg, color: themeColors.text },
              ]}
              placeholder="Tell them about your project, event, or requirements..."
              placeholderTextColor={themeColors.subText}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {/* Preferred Date */}
            <Text style={[styles.label, { color: themeColors.text }]}>Preferred Date (Optional)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: themeColors.cardBg, color: themeColors.text }]}
              placeholder="e.g., Next Saturday, January 25"
              placeholderTextColor={themeColors.subText}
              value={preferredDate}
              onChangeText={setPreferredDate}
            />

            {/* Reference Images */}
            <Text style={[styles.label, { color: themeColors.text }]}>Reference Images (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {referenceImages.map((uri, index) => (
                <View key={uri + index} style={styles.refImageWrap}>
                  <Image source={{ uri }} style={styles.refImage} />
                  <TouchableOpacity style={styles.refImageRemove} onPress={() => handleRemoveReferenceImage(index)}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addImageButton, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}
                onPress={handleAddReferenceImage}
              >
                <Ionicons name="camera-outline" size={22} color={themeColors.subText} />
              </TouchableOpacity>
            </ScrollView>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!selectedService || !budget || !description || isSubmitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedService || !budget || !description || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Send Quote Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  creativeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creativeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  creativeRole: {
    fontSize: 14,
  },
  priceInfo: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    marginLeft: 6,
  },
  inputField: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refImageWrap: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
  },
  refImage: {
    width: '100%',
    height: '100%',
  },
  refImageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
