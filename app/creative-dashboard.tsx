import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Days of the week
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Time slots
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

export default function CreativeDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Availability state
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Mon: ['09:00 AM', '10:00 AM', '02:00 PM'],
    Tue: ['10:00 AM', '11:00 AM', '03:00 PM'],
    Wed: ['09:00 AM', '02:00 PM', '04:00 PM'],
    Thu: ['10:00 AM', '11:00 AM'],
    Fri: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM'],
    Sat: [],
    Sun: [],
  });

  // Pricing state
  const [minPrice, setMinPrice] = useState('25000');
  const [maxPrice, setMaxPrice] = useState('100000');
  const [instantBooking, setInstantBooking] = useState(true);
  const [autoAcceptQuotes, setAutoAcceptQuotes] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      if (daySlots.includes(time)) {
        return { ...prev, [day]: daySlots.filter((t) => t !== time) };
      } else {
        return { ...prev, [day]: [...daySlots, time] };
      }
    });
  };

  const handleSave = () => {
    Alert.alert('Saved!', 'Your availability and pricing have been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Manage Availability</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Pricing Section */}
        <View style={[styles.section, { backgroundColor: themeColors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={24} color={Colors.light.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Pricing</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Text style={[styles.priceLabel, { color: themeColors.subText }]}>Minimum Price</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.background }]}>
                <Text style={[styles.currencyPrefix, { color: themeColors.text }]}>₦</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.subText}
                />
              </View>
            </View>
            <View style={styles.priceSeparator}>
              <Text style={[styles.toText, { color: themeColors.subText }]}>to</Text>
            </View>
            <View style={styles.priceInput}>
              <Text style={[styles.priceLabel, { color: themeColors.subText }]}>Maximum Price</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.background }]}>
                <Text style={[styles.currencyPrefix, { color: themeColors.text }]}>₦</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={themeColors.subText}
                />
              </View>
            </View>
          </View>

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>Instant Booking</Text>
              <Text style={[styles.toggleDesc, { color: themeColors.subText }]}>
                Allow customers to book without messaging
              </Text>
            </View>
            <Switch
              value={instantBooking}
              onValueChange={setInstantBooking}
              trackColor={{ false: themeColors.border, true: Colors.light.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>Auto-accept Quotes</Text>
              <Text style={[styles.toggleDesc, { color: themeColors.subText }]}>
                Automatically accept quote requests in your price range
              </Text>
            </View>
            <Switch
              value={autoAcceptQuotes}
              onValueChange={setAutoAcceptQuotes}
              trackColor={{ false: themeColors.border, true: Colors.light.primary }}
            />
          </View>
        </View>



        {/* Availability Section */}
        <View style={[styles.section, { backgroundColor: themeColors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color={Colors.light.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Weekly Availability</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: themeColors.subText }]}>
            Tap to toggle your available time slots
          </Text>

          {DAYS.map((day) => (
            <View key={day} style={styles.dayRow}>
              <Text style={[styles.dayLabel, { color: themeColors.text }]}>{day}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
                {TIME_SLOTS.map((time) => {
                  const isSelected = availability[day]?.includes(time);
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        {
                          backgroundColor: isSelected ? Colors.light.primary : themeColors.background,
                          borderColor: isSelected ? Colors.light.primary : themeColors.border,
                        },
                      ]}
                      onPress={() => toggleTimeSlot(day, time)}
                    >
                      <Text
                        style={[styles.timeSlotText, { color: isSelected ? '#fff' : themeColors.text }]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </View>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 12,
    marginLeft: 4,
  },
  priceSeparator: {
    paddingBottom: 14,
  },
  toText: {
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
  },
  dayRow: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  slotsScroll: {
    flexDirection: 'row',
  },
  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
  },

});
