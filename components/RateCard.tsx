import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export interface RateTier {
  key: 'mini' | 'full' | 'commercial';
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface RateCardProps {
  basePrice: number;
  onSelectTier?: (tier: RateTier) => void;
}

const WAMI_FEE_PERCENT = 0.18;

export default function RateCard({ basePrice, onSelectTier }: RateCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tc = {
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#2a2a2a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const tiers: RateTier[] = [
    {
      key: 'mini',
      name: 'Mini',
      price: basePrice,
      description: 'A short, focused session for simple projects.',
      features: ['1 revision round', 'Digital delivery only', '3-day turnaround'],
    },
    {
      key: 'full',
      name: 'Full',
      price: Math.round(basePrice * 2.2),
      description: 'Complete coverage with editing and revisions.',
      features: ['3 revision rounds', 'Full editing & retouching', '5-day turnaround'],
    },
    {
      key: 'commercial',
      name: 'Commercial',
      price: Math.round(basePrice * 4.5),
      description: 'For brands and businesses — full usage rights.',
      features: ['Unlimited revisions', 'Commercial usage license', 'Priority turnaround'],
    },
  ];

  return (
    <View>
      {tiers.map((tier) => {
        const fee = Math.round(tier.price * WAMI_FEE_PERCENT);
        const total = tier.price + fee;
        return (
          <View key={tier.key} style={[styles.tierCard, { backgroundColor: tc.cardBg, borderColor: tc.border }]}>
            <View style={styles.tierHeader}>
              <Text style={[styles.tierName, { color: tc.text }]}>{tier.name}</Text>
              <Text style={[styles.tierPrice, { color: Colors.light.primary }]}>₦{tier.price.toLocaleString()}</Text>
            </View>
            <Text style={[styles.tierDescription, { color: tc.subText }]}>{tier.description}</Text>

            <View style={styles.featureList}>
              {tier.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
                  <Text style={[styles.featureText, { color: tc.text }]}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.feeBreakdown, { borderTopColor: tc.border }]}>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: tc.subText }]}>Service Fee</Text>
                <Text style={[styles.feeValue, { color: tc.text }]}>₦{tier.price.toLocaleString()}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: tc.subText }]}>Wami Fee (18%)</Text>
                <Text style={[styles.feeValue, { color: tc.text }]}>₦{fee.toLocaleString()}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeTotalLabel, { color: tc.text }]}>Total</Text>
                <Text style={[styles.feeTotalValue, { color: Colors.light.primary }]}>₦{total.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.selectButton} onPress={() => onSelectTier?.(tier)}>
              <Text style={styles.selectButtonText}>Select {tier.name}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tierCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tierName: { fontSize: 18, fontWeight: '700' },
  tierPrice: { fontSize: 18, fontWeight: '800' },
  tierDescription: { fontSize: 13, marginBottom: 12 },
  featureList: { gap: 8, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13 },
  feeBreakdown: { borderTopWidth: 1, paddingTop: 12, gap: 6, marginBottom: 14 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 13 },
  feeValue: { fontSize: 13, fontWeight: '600' },
  feeTotalLabel: { fontSize: 15, fontWeight: '700' },
  feeTotalValue: { fontSize: 16, fontWeight: '800' },
  selectButton: { backgroundColor: Colors.light.primary, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  selectButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
