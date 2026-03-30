import Colors from '@/constants/Colors';
import { addBooking, Booking } from '@/store/bookingsSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
}

// Available time slots
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

// Generate next 7 days
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

export default function BookingModal({ visible, onClose, creative }: BookingModalProps) {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const dates = generateDates();

  const themeColors = {
    background: isDark ? '#1a1a1a' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#2a2a2a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const handleBook = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Info', 'Please select a date and time');
      return;
    }

    const booking: Booking = {
      id: `booking_${Date.now()}`,
      creativeId: creative.id,
      creativeName: creative.name,
      creativeRole: creative.role,
      creativeImage: creative.image,
      date: selectedDate,
      time: selectedTime,
      notes: notes.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    dispatch(addBooking(booking));
    Alert.alert(
      'Booking Confirmed! 🎉',
      `Your appointment with ${creative.name} is scheduled for ${selectedDate} at ${selectedTime}`,
      [{ text: 'OK', onPress: onClose }]
    );

    // Reset form
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>Book Appointment</Text>
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
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Date Selection */}
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
                  <Text style={[styles.dateDay, { color: selectedDate === d.full ? '#fff' : themeColors.subText }]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateNum, { color: selectedDate === d.full ? '#fff' : themeColors.text }]}>
                    {d.date}
                  </Text>
                  <Text style={[styles.dateMonth, { color: selectedDate === d.full ? '#fff' : themeColors.subText }]}>
                    {d.month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Selection */}
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
                  <Text style={[styles.timeText, { color: selectedTime === time ? '#fff' : themeColors.text }]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: themeColors.cardBg, color: themeColors.text, borderColor: themeColors.border },
              ]}
              placeholder="Add any special requests..."
              placeholderTextColor={themeColors.subText}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, (!selectedDate || !selectedTime) && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={!selectedDate || !selectedTime}
          >
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
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
    marginBottom: 20,
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  datesContainer: {
    marginBottom: 24,
  },
  dateCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 10,
    minWidth: 70,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  timeCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
