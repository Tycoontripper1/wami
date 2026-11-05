import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import Colors from '@/constants/Colors';
import { useCategories } from '@/hooks/useCategories';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Filters for the Home feed. Categories live here, one tap away, instead of taking a row of the screen. */
export default function FilterSheet({
  visible,
  category,
  onClose,
  onApply,
}: {
  visible: boolean;
  category: string | null;
  onClose: () => void;
  onApply: (category: string | null) => void;
}) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const categories = useCategories();
  const [picked, setPicked] = useState<string | null>(category);

  useEffect(() => {
    if (visible) setPicked(category);
  }, [visible, category]);

  const t = {
    bg: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    chip: isDark ? '#2A2A2D' : '#F5F7F8',
    border: isDark ? '#3A3A3C' : '#E3E7EA',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: t.bg, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.text }]}>Filter</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={t.sub} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: t.sub }]}>What are you looking for?</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
            <View style={styles.chips}>
              {categories.map((c) => {
                const active = picked === c.name;
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.8}
                    onPress={() => setPicked(active ? null : c.name)}
                    style={[styles.chip, { backgroundColor: active ? Colors.light.primary : t.chip, borderColor: active ? Colors.light.primary : t.border }]}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, { color: active ? '#0F1419' : t.text }]}>
                      {c.icon ? `${c.icon} ` : ''}
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.clear, { borderColor: t.border }]}
              onPress={() => {
                setPicked(null);
                onApply(null);
                onClose();
              }}
            >
              <Text style={[styles.clearText, { color: t.text }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.apply}
              onPress={() => {
                onApply(picked);
                onClose();
              }}
            >
              <Text style={styles.applyText}>{picked ? `Show ${picked}` : 'Show everything'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#8E8E93', alignSelf: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  clear: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 16, fontWeight: '700' },
  apply: { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
});
