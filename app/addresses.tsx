import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import EmptyState from '@/components/EmptyState';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { Ionicons } from '@/components/FlatIcon';
import GuestPrompt from '@/components/GuestPrompt';
import Colors from '@/constants/Colors';
import type { RootState } from '@/store/store';
import { SavedAddress, deleteAddress, loadAddresses, saveAddress, setDefaultAddress } from '@/utils/addressBook';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const LABELS = ['Home', 'Work', 'Other'];

type Draft = { id?: string; label: string; line1: string; city: string; phone: string; isDefault: boolean };
const EMPTY: Draft = { label: 'Home', line1: '', city: '', phone: '', isDefault: false };

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const signedIn = useSelector((s: RootState) => s.auth.isAuthenticated);

  const [list, setList] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);

  const t = {
    bg: isDark ? '#000' : '#fff',
    card: isDark ? '#1A1A1A' : '#F5F7F8',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    border: isDark ? '#2C2C2E' : '#E3E7EA',
  };

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    loadAddresses(user?.id).then((l) => {
      setList(l);
      setLoading(false);
    });
  }, [signedIn, user?.id]);

  const save = async () => {
    if (!draft) return;
    if (!draft.line1.trim() || !draft.city.trim()) {
      Alert.alert('Missing info', 'Add the street address and the city.');
      return;
    }
    setList(await saveAddress(user?.id, { ...draft, phone: draft.phone.trim() || undefined }));
    setDraft(null);
  };

  const remove = (a: SavedAddress) =>
    Alert.alert('Delete this address?', `${a.label}: ${a.line1}, ${a.city}`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => setList(await deleteAddress(user?.id, a.id)) },
    ]);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => (draft ? setDraft(null) : router.back())} style={styles.iconBtn} accessibilityLabel="Back">
          <Ionicons name={draft ? 'close' : 'arrow-back'} size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>{draft ? (draft.id ? 'Edit address' : 'New address') : 'Saved addresses'}</Text>
        <View style={styles.iconBtn} />
      </View>

      {!signedIn ? (
        <GuestPrompt illustration="town" title="Sign in to save addresses" message="Saved addresses make checkout one tap." />
      ) : loading ? null : draft ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: t.sub }]}>What do you call it?</Text>
          <View style={styles.chips}>
            {LABELS.map((l) => {
              const active = draft.label === l;
              return (
                <TouchableOpacity
                  key={l}
                  onPress={() => setDraft({ ...draft, label: l })}
                  style={[styles.chip, { backgroundColor: active ? Colors.light.primary : t.card, borderColor: active ? Colors.light.primary : t.border }]}
                >
                  <Text style={{ color: active ? '#0F1419' : t.text, fontWeight: '600', fontSize: 14 }}>{l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FloatingLabelInput label="Street address *" value={draft.line1} onChangeText={(v) => setDraft({ ...draft, line1: v })} placeholder="House number and street" />
          <FloatingLabelInput label="City *" value={draft.city} onChangeText={(v) => setDraft({ ...draft, city: v })} placeholder="e.g. Lagos" />
          <FloatingLabelInput label="Phone for this address" value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} keyboardType="phone-pad" placeholder="Optional: your account phone is used if empty" />
          <TouchableOpacity style={styles.checkRow} onPress={() => setDraft({ ...draft, isDefault: !draft.isDefault })}>
            <Ionicons name={draft.isDefault ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={draft.isDefault ? Colors.light.primary : t.sub} />
            <Text style={{ color: t.text, fontSize: 15 }}>Use this one first at checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={save}>
            <Text style={styles.primaryText}>Save address</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : list.length === 0 ? (
        <>
          <EmptyState illustration="town" title="No saved addresses yet" message="Save the places you get things delivered, and pick one at checkout." onRetry={() => setDraft({ ...EMPTY, phone: user?.phone ?? '' })} retryLabel="Add an address" />
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 100 }}>
          {list.map((a) => (
            <View key={a.id} style={[styles.card, { backgroundColor: t.card }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardLabel, { color: t.text }]}>{a.label}</Text>
                  {a.isDefault ? (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: t.text, fontSize: 14, marginTop: 4 }}>{a.line1}</Text>
                <Text style={{ color: t.sub, fontSize: 14 }}>{a.city}</Text>
                {a.phone ? <Text style={{ color: t.sub, fontSize: 13, marginTop: 2 }}>{a.phone}</Text> : null}
                <View style={styles.actions}>
                  {!a.isDefault ? (
                    <TouchableOpacity onPress={async () => setList(await setDefaultAddress(user?.id, a.id))}>
                      <Text style={styles.action}>Make default</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => setDraft({ id: a.id, label: a.label, line1: a.line1, city: a.city, phone: a.phone ?? '', isDefault: !!a.isDefault })}>
                    <Text style={styles.action}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(a)}>
                    <Text style={[styles.action, { color: '#E5533F' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.primary} onPress={() => setDraft({ ...EMPTY, phone: user?.phone ?? '' })}>
            <Text style={styles.primaryText}>Add an address</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  primary: { height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  card: { borderRadius: 16, padding: 16, flexDirection: 'row' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 16, fontWeight: '800' },
  defaultPill: { backgroundColor: '#E0F7FA', borderRadius: 10, paddingHorizontal: 8, height: 20, alignItems: 'center', justifyContent: 'center' },
  defaultText: { fontSize: 11, fontWeight: '700', color: '#006978' },
  actions: { flexDirection: 'row', gap: 18, marginTop: 12 },
  action: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
});
