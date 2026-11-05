import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import { useCartCount } from '@/hooks/useCartCount';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

/** The cart icon with a count badge, opening the cart. */
export default function CartButton({ color, size = 24 }: { color: string; size?: number }) {
  const router = useRouter();
  const count = useCartCount();
  return (
    <TouchableOpacity onPress={() => router.push('/cart' as any)} style={styles.btn} accessibilityLabel={count > 0 ? `Cart, ${count} items` : 'Cart'}>
      <Ionicons name="cart" size={size} color={color} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E5533F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
