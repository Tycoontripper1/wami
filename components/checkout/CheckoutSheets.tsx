import { Text } from '@/components/AppText';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { Ionicons } from '@/components/FlatIcon';
import Colors from '@/constants/Colors';
import { SavedAddress, hasAddress, saveAddress } from '@/utils/addressBook';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Where an order is going. `id` is set when it is one of the saved addresses. */
export interface Destination {
  id?: string;
  label?: string;
  line1: string;
  city: string;
}

function useSheetTheme() {
  const isDark = useColorScheme() === 'dark';
  return {
    bg: isDark ? '#1C1C1E' : '#FFFFFF',
    card: isDark ? '#2A2A2D' : '#F5F7F8',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    border: isDark ? '#3A3A3C' : '#E3E7EA',
  };
}

function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const t = useSheetTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: t.bg, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={t.sub} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Pick a saved address, or add a new one. Choosing closes the sheet. */
export function AddressSheet({
  visible,
  onClose,
  userId,
  saved,
  selectedId,
  accountPhone,
  onSaved,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  userId: string | number | undefined;
  saved: SavedAddress[];
  selectedId?: string;
  accountPhone: string;
  onSaved: (list: SavedAddress[]) => void;
  onSelect: (destination: Destination, phone?: string) => void;
}) {
  const router = useRouter();
  const t = useSheetTheme();
  const [adding, setAdding] = useState(false);
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [remember, setRemember] = useState(true);

  // Open on the list when there is one, and straight on the form when there is not.
  useEffect(() => {
    if (visible) {
      setAdding(saved.length === 0);
      setLine1('');
      setCity('');
      setRemember(true);
    }
  }, [visible, saved.length]);

  const useNew = async () => {
    const street = line1.trim();
    const town = city.trim();
    if (!street || !town) return;
    if (remember && !hasAddress(saved, street, town)) {
      const list = await saveAddress(userId, {
        label: saved.length === 0 ? 'Home' : 'Other',
        line1: street,
        city: town,
        phone: accountPhone || undefined,
        isDefault: saved.length === 0,
      });
      onSaved(list);
      const made = list.find((a) => a.line1 === street && a.city === town);
      onSelect({ id: made?.id, label: made?.label, line1: street, city: town });
    } else {
      onSelect({ line1: street, city: town });
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={adding ? 'New address' : 'Deliver to'}>
      {adding ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FloatingLabelInput label="Street address *" value={line1} onChangeText={setLine1} placeholder="House number and street" />
          <FloatingLabelInput label="City *" value={city} onChangeText={setCity} placeholder="e.g. Lagos" />
          <TouchableOpacity style={styles.checkRow} onPress={() => setRemember((v) => !v)}>
            <Ionicons name={remember ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={remember ? Colors.light.primary : t.sub} />
            <Text style={{ color: t.text, fontSize: 15 }}>Save for next time</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primary, (!line1.trim() || !city.trim()) && { opacity: 0.5 }]} onPress={useNew} disabled={!line1.trim() || !city.trim()}>
            <Text style={styles.primaryText}>Deliver here</Text>
          </TouchableOpacity>
          {saved.length > 0 ? (
            <TouchableOpacity style={styles.linkRow} onPress={() => setAdding(false)}>
              <Text style={styles.link}>Back to my addresses</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          {saved.map((a) => {
            const active = selectedId === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.option, { backgroundColor: t.card, borderColor: active ? Colors.light.primary : 'transparent' }]}
                activeOpacity={0.8}
                onPress={() => {
                  onSelect({ id: a.id, label: a.label, line1: a.line1, city: a.city }, a.phone);
                  onClose();
                }}
              >
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? Colors.light.primary : t.sub} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>
                    {a.label}
                    {a.isDefault ? '  ·  Default' : ''}
                  </Text>
                  <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }}>{a.line1}, {a.city}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.addRow} onPress={() => setAdding(true)}>
            <Ionicons name="add-circle" size={22} color={Colors.light.primary} />
            <Text style={styles.link}>Add a new address</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              onClose();
              router.push('/addresses' as any);
            }}
          >
            <Text style={[styles.link, { color: t.sub }]}>Manage my addresses</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </Sheet>
  );
}

/** Change the number the seller will use to reach you for this order. */
export function PhoneSheet({
  visible,
  onClose,
  phone,
  accountPhone,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  phone: string;
  accountPhone: string;
  onSave: (phone: string) => void;
}) {
  const t = useSheetTheme();
  const [value, setValue] = useState(phone);

  useEffect(() => {
    if (visible) setValue(phone);
  }, [visible, phone]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Contact number">
      <FloatingLabelInput label="Phone number *" value={value} onChangeText={setValue} keyboardType="phone-pad" placeholder="So the seller can reach you" />
      <Text style={{ color: t.sub, fontSize: 13, marginBottom: 14 }}>This only changes the number for this order.</Text>
      <TouchableOpacity
        style={[styles.primary, !value.trim() && { opacity: 0.5 }]}
        disabled={!value.trim()}
        onPress={() => {
          onSave(value.trim());
          onClose();
        }}
      >
        <Text style={styles.primaryText}>Use this number</Text>
      </TouchableOpacity>
      {accountPhone && value.trim() !== accountPhone ? (
        <TouchableOpacity style={styles.linkRow} onPress={() => setValue(accountPhone)}>
          <Text style={styles.link}>Use my account number ({accountPhone})</Text>
        </TouchableOpacity>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#8E8E93', alignSelf: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  primary: { height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  linkRow: { alignItems: 'center', paddingVertical: 14 },
  link: { fontSize: 15, fontWeight: '700', color: Colors.light.primary },
});
