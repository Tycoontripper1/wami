import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import type { JourneyState } from '@/utils/journeyState';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import StepIcon from './StepIcon';

/* The small version of the journey, for a row in a list: the drawing of the stage
   it is at on a teal tile, its name and "step 3 of 6", a segmented bar of how far
   along it is, and, when it is this person's move, an amber label saying so
   ("Pay now"). Dead ends (cancelled, declined) show a greyed line and no bar. */

const TEAL = Colors.light.primary;

export default function ProgressStrip({
  state,
  theme,
  isDark = true,
}: {
  state: JourneyState;
  theme: { text: string; sub: string; border: string };
  isDark?: boolean;
}) {
  if (state.ended) {
    return (
      <View style={styles.row}>
        <View style={[styles.tile, { borderColor: theme.border, borderStyle: 'dashed', borderWidth: 1.5 }]}>
          <StepIcon kind={state.kind} size={20} ink={theme.sub} soft={theme.border} cut={isDark ? '#1C1C1E' : '#FFFFFF'} />
        </View>
        <Text style={{ color: theme.sub, fontSize: 14, fontWeight: '700' }}>{state.ended}</Text>
      </View>
    );
  }

  const done = state.index === state.total - 1;
  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: done ? '#4CD964' : TEAL }]}>
          <StepIcon kind={state.kind} size={22} ink="#0F1419" soft="#FFFFFF" cut={done ? '#4CD964' : TEAL} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '800' }} numberOfLines={1}>
            {state.label}
          </Text>
          <Text style={{ color: theme.sub, fontSize: 12 }}>
            Step {state.index + 1} of {state.total}
          </Text>
        </View>
        {state.needs ? (
          <View style={styles.needs}>
            <Text style={styles.needsText}>{state.needs}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: state.total }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i <= state.index ? (done ? '#4CD964' : TEAL) : theme.border }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tile: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  needs: { backgroundColor: '#FFB300', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  needsText: { color: '#0F1419', fontSize: 12, fontWeight: '800' },
  bar: { flexDirection: 'row', gap: 3, marginTop: 10 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
});
