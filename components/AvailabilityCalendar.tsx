import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  day: string;
  date: number;
  month: string;
  year: number;
  full: string;
  slots: TimeSlot[];
  isToday: boolean;
  isPast: boolean;
}

interface AvailabilityCalendarProps {
  onSelectSlot: (date: string, time: string) => void;
  onBookNextAvailable?: () => void;
  selectedDate?: string;
  selectedTime?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ALL_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

// Generate availability for a specific month
const generateMonthAvailability = (year: number, month: number): DayAvailability[] => {
  const days: DayAvailability[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    
    // Randomly make some slots unavailable for realism (only for non-past dates)
    const slots = ALL_SLOTS.map((time) => ({
      time,
      available: isPast ? false : Math.random() > 0.3, // 70% chance of being available for future dates
    }));

    days.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d,
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: year,
      full: date.toISOString().split('T')[0],
      slots,
      isToday,
      isPast,
    });
  }
  return days;
};

export default function AvailabilityCalendar({
  onSelectSlot,
  onBookNextAvailable,
  selectedDate,
  selectedTime,
}: AvailabilityCalendarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  // Generate availability for current month view
  const availability = useMemo(() => {
    return generateMonthAvailability(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Set active day to today or first available day when month changes
  React.useEffect(() => {
    const todayIndex = availability.findIndex((d) => d.isToday);
    if (todayIndex >= 0) {
      setActiveDayIndex(todayIndex);
    } else {
      // Find first non-past day
      const firstAvailable = availability.findIndex((d) => !d.isPast);
      setActiveDayIndex(firstAvailable >= 0 ? firstAvailable : 0);
    }
  }, [currentYear, currentMonth]);

  const themeColors = {
    background: isDark ? '#1a1a1a' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#2a2a2a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const today = new Date();
    const currentMonthDate = new Date(currentYear, currentMonth, 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Don't go before current month
    if (currentMonthDate > thisMonth) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    // Allow up to 6 months ahead
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    
    if (nextMonthDate <= maxDate) {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Check if we can go previous
  const canGoPrevious = () => {
    const today = new Date();
    const currentMonthDate = new Date(currentYear, currentMonth, 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonthDate > thisMonth;
  };

  // Check if we can go next
  const canGoNext = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    return nextMonthDate <= maxDate;
  };

  // Find next available slot across all months
  const findNextAvailable = () => {
    for (const day of availability) {
      if (day.isPast) continue;
      for (const slot of day.slots) {
        if (slot.available) {
          return { date: day.full, time: slot.time, display: `${day.day}, ${day.month} ${day.date} at ${slot.time}` };
        }
      }
    }
    return null;
  };

  const nextAvailable = findNextAvailable();
  const activeDay = activeDayIndex !== null ? availability[activeDayIndex] : null;

  const handleBookNextAvailable = () => {
    if (nextAvailable) {
      onSelectSlot(nextAvailable.date, nextAvailable.time);
      onBookNextAvailable?.();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Next Available Quick Book */}
      {nextAvailable && (
        <TouchableOpacity style={styles.nextAvailableCard} onPress={handleBookNextAvailable}>
          <View style={styles.nextAvailableContent}>
            <Ionicons name="flash" size={20} color="#fff" />
            <View style={styles.nextAvailableText}>
              <Text style={styles.nextAvailableLabel}>Next Available</Text>
              <Text style={styles.nextAvailableTime}>{nextAvailable.display}</Text>
            </View>
          </View>
          <Text style={styles.bookNowText}>Book Now →</Text>
        </TouchableOpacity>
      )}

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity 
          style={[styles.navButton, !canGoPrevious() && styles.navButtonDisabled]} 
          onPress={goToPreviousMonth}
          disabled={!canGoPrevious()}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={canGoPrevious() ? themeColors.text : themeColors.border} 
          />
        </TouchableOpacity>
        
        <View style={styles.monthDisplay}>
          <Text style={[styles.monthTitle, { color: themeColors.text }]}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.navButton, !canGoNext() && styles.navButtonDisabled]} 
          onPress={goToNextMonth}
          disabled={!canGoNext()}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={canGoNext() ? themeColors.text : themeColors.border} 
          />
        </TouchableOpacity>
      </View>

      {/* Calendar Days Scroll */}
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select a Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
        {availability.map((day, index) => {
          const hasAvailable = day.slots.some((s) => s.available);
          const isActive = index === activeDayIndex;
          const isDisabled = day.isPast;
          
          return (
            <TouchableOpacity
              key={day.full}
              style={[
                styles.dayCard,
                {
                  backgroundColor: isActive ? Colors.light.primary : themeColors.cardBg,
                  opacity: isDisabled ? 0.4 : hasAvailable ? 1 : 0.6,
                },
                day.isToday && !isActive && styles.todayCard,
              ]}
              onPress={() => !isDisabled && setActiveDayIndex(index)}
              disabled={isDisabled}
            >
              <Text style={[styles.dayName, { color: isActive ? '#fff' : themeColors.subText }]}>
                {day.day}
              </Text>
              <Text style={[styles.dayDate, { color: isActive ? '#fff' : themeColors.text }]}>
                {day.date}
              </Text>
              {day.isToday && (
                <Text style={[styles.todayLabel, { color: isActive ? '#fff' : Colors.light.primary }]}>
                  Today
                </Text>
              )}
              {!day.isToday && hasAvailable && !isDisabled && (
                <View style={[styles.availableDot, { backgroundColor: isActive ? '#fff' : '#4CD964' }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slots for Selected Day */}
      {activeDay && !activeDay.isPast && (
        <>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Available Times - {activeDay.day}, {activeDay.month} {activeDay.date}
          </Text>
          <View style={styles.slotsGrid}>
            {activeDay.slots.map((slot) => {
              const isSelected = selectedDate === activeDay.full && selectedTime === slot.time;
              
              return (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    {
                      backgroundColor: isSelected
                        ? Colors.light.primary
                        : slot.available
                        ? themeColors.cardBg
                        : themeColors.border,
                      borderColor: isSelected ? Colors.light.primary : themeColors.border,
                    },
                  ]}
                  onPress={() => slot.available && onSelectSlot(activeDay.full, slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeText,
                      {
                        color: isSelected
                          ? '#fff'
                          : slot.available
                          ? themeColors.text
                          : themeColors.subText,
                      },
                    ]}
                  >
                    {slot.time}
                  </Text>
                  {!slot.available && (
                    <Text style={[styles.unavailableText, { color: themeColors.subText }]}>Booked</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CD964' }]} />
          <Text style={[styles.legendText, { color: themeColors.subText }]}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: themeColors.border }]} />
          <Text style={[styles.legendText, { color: themeColors.subText }]}>Booked</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
  },
  nextAvailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  nextAvailableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextAvailableText: {
    gap: 2,
  },
  nextAvailableLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  nextAvailableTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  daysScroll: {
    marginBottom: 20,
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 10,
    minWidth: 60,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unavailableText: {
    fontSize: 10,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
});
