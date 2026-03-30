import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';

interface BrandInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  optional?: boolean;
}

export default function BrandInput({ icon, placeholder, value, onChangeText, optional }: BrandInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
    text: isDark ? '#fff' : '#000',
    placeholder: isDark ? '#666' : '#999',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}>
      <Ionicons name={icon} size={20} color={Colors.light.primary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: themeColors.text }]}
        placeholder={optional ? `${placeholder} (optional)` : placeholder}
        placeholderTextColor={themeColors.placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
