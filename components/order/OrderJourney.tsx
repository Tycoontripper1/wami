import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import Colors from '@/constants/Colors';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import StepIcon, { StepKind } from './StepIcon';

/* The path an order takes, drawn as a route down the side. Each stage has its own
   drawing (a receipt, coins, a box, a van, a house, a medal) on a rounded tile:
     done   a soft teal tile, the drawing in teal, a small tick on the corner
     now    a solid teal tile, a ring that keeps pulsing, and one plain sentence
            about what happens next and who has to do it
     later  an outlined grey tile
   The road between the tiles is solid teal where the order has been, and dashed
   where it has yet to go. The sentence changes with who is looking, because the
   buyer and the seller wait on different things. */

type Role = 'buyer' | 'seller' | 'viewer';
type Theme = { text: string; sub: string; border: string };

const ORDER = ['placed', 'packing', 'dispatched', 'delivered', 'complete'];
const rank = (status: string) => Math.max(0, ORDER.indexOf(status));

const TEAL = Colors.light.primary;
const AMBER = '#FFB300';

type Step = { key: string; kind: StepKind; label: string; reached: boolean; now: string };

/** A ring that swells and fades around the current step, so the eye lands on it. */
function Pulse() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' })
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] },
      ]}
    />
  );
}

export default function OrderJourney({
  status,
  paid,
  role,
  theme,
  isDark = true,
}: {
  status: string;
  paid: boolean;
  role: Role;
  theme: Theme;
  isDark?: boolean;
}) {
  const st = (status || 'placed').toLowerCase();
  const r = rank(st);
  const buyer = role === 'buyer';

  const steps: Step[] = [
    { key: 'placed', kind: 'receipt', label: 'Order placed', reached: true, now: buyer ? 'Pay to confirm your order.' : 'Waiting for the buyer to pay.' },
    {
      key: 'paid',
      kind: 'coins',
      label: 'Payment received',
      reached: paid,
      now: buyer ? 'Paid. Waiting for the seller to start packing.' : 'Paid. Start packing when you are ready.',
    },
    {
      key: 'packing',
      kind: 'box',
      label: 'Being packed',
      reached: paid && r >= 1,
      now: buyer ? 'The seller is packing your order.' : 'Pack it, then mark it as dispatched.',
    },
    {
      key: 'dispatched',
      kind: 'van',
      label: 'On its way',
      reached: paid && r >= 2,
      now: buyer ? 'It is on its way. Tap "I received it" when it arrives.' : 'Sent. Waiting for the buyer to confirm it arrived.',
    },
    {
      key: 'delivered',
      kind: 'house',
      label: 'Delivered',
      reached: paid && r >= 3,
      now: buyer ? 'It has arrived. Confirm everything is right to finish.' : 'The buyer has it. Waiting for them to finish the order.',
    },
    { key: 'complete', kind: 'medal', label: 'Complete', reached: paid && r >= 4, now: 'This order is complete.' },
  ];

  // Where the order is now: the last step reached (the first, if payment is still open).
  let current = 0;
  steps.forEach((s, i) => {
    if (s.reached) current = i;
  });
  const finished = current === steps.length - 1;

  const doneTile = isDark ? 'rgba(0,188,212,0.18)' : '#D9F7FB';
  const doneInk = isDark ? TEAL : '#00838F';
  const doneSoft = isDark ? '#6FDCEC' : '#7FD3DE';

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`${steps[current].label}. ${steps[current].now}`}>
      {steps.map((step, i) => {
        const done = step.reached && (i < current || finished);
        const isNow = i === current && !finished;
        const last = i === steps.length - 1;

        const tileBg = isNow ? TEAL : done ? doneTile : 'transparent';
        const ink = isNow ? '#0F1419' : done ? doneInk : theme.sub;
        const soft = isNow ? '#FFFFFF' : done ? doneSoft : theme.border;

        return (
          <View key={step.key} style={[styles.row, !last && { minHeight: isNow ? 78 : 62 }]}>
            <View style={styles.rail}>
              <View style={styles.tileWrap}>
                {isNow ? <Pulse /> : null}
                <View style={[styles.tile, { backgroundColor: tileBg, borderColor: isNow ? TEAL : done ? 'transparent' : theme.border, borderStyle: done || isNow ? 'solid' : 'dashed' }]}>
                  <StepIcon kind={step.kind} ink={ink} soft={soft} cut={isNow ? TEAL : done ? (isDark ? '#16313a' : '#D9F7FB') : isDark ? '#1A1A1A' : '#FFFFFF'} />
                </View>
                {done ? (
                  <View style={styles.tick}>
                    <Ionicons name="checkmark" size={11} color="#0F1419" />
                  </View>
                ) : null}
              </View>
              {!last ? (
                <View style={[styles.road, done ? { backgroundColor: TEAL } : { borderLeftWidth: 2, borderStyle: 'dashed', borderColor: theme.border, width: 0 }]} />
              ) : null}
            </View>
            <View style={[styles.text, !last && { paddingBottom: isNow ? 18 : 16 }]}>
              <Text style={{ color: done || isNow ? theme.text : theme.sub, fontSize: 15.5, fontWeight: isNow ? '800' : done ? '600' : '500' }}>{step.label}</Text>
              {isNow ? (
                <View style={styles.noteRow}>
                  <View style={[styles.noteDot, { backgroundColor: AMBER }]} />
                  <Text style={{ color: theme.sub, fontSize: 13.5, lineHeight: 19, flex: 1 }}>{step.now}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 46, alignItems: 'center' },
  tileWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  tile: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 42, height: 42, borderRadius: 14, borderWidth: 2, borderColor: AMBER },
  tick: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  road: { width: 3, flex: 1, marginVertical: 3, borderRadius: 2 },
  text: { flex: 1, paddingLeft: 12, paddingTop: 9 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  noteDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
});
