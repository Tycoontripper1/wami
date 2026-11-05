import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import { ApiCategory, FALLBACK_CATEGORIES, getCategories } from '@/services/api/categoriesService';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

/** Pick one category from the list Wami keeps, instead of typing your own. */
export default function CategoryPicker({
  value,
  onChange,
  label = 'Category',
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}) {
  const isDark = useColorScheme() === 'dark';
  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let live = true;
    getCategories().then((list) => {
      if (live) setCategories(list);
    });
    return () => {
      live = false;
    };
  }, []);

  const t = {
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    chip: isDark ? '#1A1A1A' : '#F5F7F8',
    border: isDark ? '#2C2C2E' : '#E3E7EA',
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: t.sub }]}>{label}</Text>
      <View style={styles.row}>
        {categories.map((c) => {
          const active = value === c.name;
          return (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.8}
              onPress={() => onChange(active ? '' : c.name)}
              style={[
                styles.chip,
                { backgroundColor: active ? Colors.light.primary : t.chip, borderColor: active ? Colors.light.primary : t.border },
              ]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
});
