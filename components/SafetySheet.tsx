import { Alert } from '@/components/AppAlert';
import { Text, TextInput } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import Colors from '@/constants/Colors';
import { blockUser, reportContent, ReportReason, ReportTarget } from '@/services/api/safetyService';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

const REASONS: { key: ReportReason; label: string; hint: string }[] = [
  { key: 'scam', label: 'Scam or fraud', hint: 'Asks for money outside Wami, or is not who they say' },
  { key: 'fake', label: 'Fake or stolen work', hint: 'Photos or work that are not theirs' },
  { key: 'inappropriate', label: 'Inappropriate', hint: 'Offensive, harmful or not allowed' },
  { key: 'spam', label: 'Spam', hint: 'Repeated or unwanted messages or listings' },
  { key: 'other', label: 'Something else', hint: 'Tell us what happened' },
];

export type SafetyTarget = {
  type: ReportTarget;
  id: string | number;
  /** The person behind it, for the Block option. */
  userId?: string | number;
  name?: string;
};

/** Report something, or block a person. Apple and Google both require this for anything people post. */
export default function SafetySheet({
  visible,
  target,
  onClose,
  onBlocked,
}: {
  visible: boolean;
  target: SafetyTarget | null;
  onClose: () => void;
  onBlocked?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'report' | 'block' | null>(null);

  useEffect(() => {
    if (visible) {
      setReason(null);
      setNote('');
      setBusy(null);
    }
  }, [visible]);

  const t = {
    bg: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    card: isDark ? '#2A2A2D' : '#F5F7F8',
    border: isDark ? '#3A3A3C' : '#E3E7EA',
  };

  if (!target) return null;

  const send = async () => {
    if (!reason) return;
    setBusy('report');
    try {
      await reportContent({ target_type: target.type, target_id: target.id, reason, note: note.trim() || undefined });
      onClose();
      Alert.alert('Report sent', 'Thank you. Our team will look at it. You will not be named to the person you reported.');
    } catch (error: any) {
      Alert.alert("Couldn't send the report", error?.message ?? 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const block = () => {
    if (target.userId === undefined) return;
    Alert.alert(
      `Block ${target.name ?? 'this person'}?`,
      "They won't be able to message you, and you won't see them in your feed. You can unblock them any time in Privacy & Security.",
      [
        { text: 'Keep them', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setBusy('block');
            try {
              await blockUser(target.userId!, reason ?? undefined);
              onClose();
              onBlocked?.();
              Alert.alert('Blocked', `${target.name ?? 'They'} can no longer message you.`);
            } catch (error: any) {
              Alert.alert("Couldn't block", error?.message ?? 'Please try again.');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: t.bg, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: t.text }]}>Report{target.name ? ` ${target.name}` : ''}</Text>
            <Text style={[styles.sub, { color: t.sub }]}>What is wrong? We review every report.</Text>

            {REASONS.map((r) => {
              const active = reason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.reason, { backgroundColor: t.card, borderColor: active ? Colors.light.primary : 'transparent' }]}
                  onPress={() => setReason(r.key)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reasonLabel, { color: t.text }]}>{r.label}</Text>
                    <Text style={[styles.reasonHint, { color: t.sub }]}>{r.hint}</Text>
                  </View>
                  <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? Colors.light.primary : t.sub} />
                </TouchableOpacity>
              );
            })}

            {reason ? (
              <TextInput
                style={[styles.note, { backgroundColor: t.card, color: t.text }]}
                value={note}
                onChangeText={setNote}
                placeholder="Add details (optional)"
                placeholderTextColor={t.sub}
                multiline
                maxLength={500}
              />
            ) : null}

            <TouchableOpacity
              style={[styles.send, !reason && { opacity: 0.45 }]}
              onPress={send}
              disabled={!reason || busy !== null}
            >
              {busy === 'report' ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.sendText}>Send report</Text>}
            </TouchableOpacity>

            {target.userId !== undefined ? (
              <TouchableOpacity style={styles.block} onPress={block} disabled={busy !== null}>
                {busy === 'block' ? (
                  <ActivityIndicator color="#E5533F" />
                ) : (
                  <>
                    <Ionicons name="ban" size={18} color="#E5533F" />
                    <Text style={styles.blockText}>Block {target.name ?? 'this person'}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#8E8E93', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 4, marginBottom: 14 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 2 },
  reasonLabel: { fontSize: 15, fontWeight: '700' },
  reasonHint: { fontSize: 13, marginTop: 2 },
  note: { borderRadius: 12, padding: 14, minHeight: 80, fontSize: 15, textAlignVertical: 'top', marginTop: 4 },
  send: { height: 48, borderRadius: 12, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  sendText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  block: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  blockText: { fontSize: 15, fontWeight: '700', color: '#E5533F' },
});
