import { Text } from '@/components/AppText';
import AnimatedCheck from '@/components/AnimatedCheck';
import { Illo } from '@/constants/Illustration';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Modal, Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

/* Wami's own message dialog, in place of the phone's native alert. `Alert` has
   the same call shape as React Native's (`Alert.alert(title, message, buttons)`),
   so every call site keeps working; the look is ours: a success tick with
   confetti, a coral badge for errors, an amber one for "are you sure". The
   kind is read from the title ("Success", "Couldn't save"...) or passed as
   `{ kind }`. Mount <DialogHost /> once at the app root. */

export type DialogKind = 'success' | 'error' | 'confirm' | 'info';

export interface DialogButton {
  text?: string;
  onPress?: (value?: string) => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface DialogOptions {
  kind?: DialogKind;
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface Dialog {
  title: string;
  message?: string;
  buttons: DialogButton[];
  kind: DialogKind;
  cancelable: boolean;
  onDismiss?: () => void;
}

/* ── the queue ───────────────────────────────────────────────────────────── */

const queue: Dialog[] = [];
let listener: (() => void) | null = null;

const FAILED = /(error|fail|couldn'?t|could not|can'?t|cannot|unable|denied|missing|invalid|oops|wrong|required|problem|not (found|allowed|available))/i;
const WORKED = /(success|posted|saved|published|done|sent|booked|confirmed|imported|listed|updated|created|welcome|thank)/i;

function inferKind(title: string, buttons: DialogButton[]): DialogKind {
  if (buttons.some((b) => b.style === 'destructive')) return 'confirm';
  if (FAILED.test(title)) return 'error';
  if (WORKED.test(title)) return 'success';
  return 'info';
}

export const Alert = {
  alert(title: string, message?: string, buttons?: DialogButton[], options?: DialogOptions) {
    // A raised keyboard sits above the dialog on iPhone and hides its buttons.
    Keyboard.dismiss();
    const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
    queue.push({
      title,
      message: message || undefined,
      buttons: list,
      kind: options?.kind ?? inferKind(title, list),
      cancelable: options?.cancelable ?? list.some((b) => b.style === 'cancel'),
      onDismiss: options?.onDismiss,
    });
    listener?.();
  },
};

/* ── the badge ───────────────────────────────────────────────────────────── */

const TONE: Record<Exclude<DialogKind, 'success'>, string> = {
  error: Illo.coral,
  confirm: Illo.amber,
  info: Illo.teal,
};

function Badge({ kind }: { kind: Exclude<DialogKind, 'success'> }) {
  const pop = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    if (kind === 'error') {
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(shake, { toValue: 1, duration: 360, easing: Easing.linear, useNativeDriver: true }),
      ]).start();
    }
  }, [kind, pop, shake]);

  const wobble = shake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -7, 7, -5, 4, 0],
  });
  const colour = TONE[kind];

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: colour, transform: [{ scale: pop }, { translateX: wobble }] },
      ]}
    >
      {kind === 'info' ? (
        <>
          <View style={[styles.dot, { top: 20 }]} />
          <View style={[styles.bar, { top: 33, height: 22 }]} />
        </>
      ) : (
        <>
          <View style={[styles.bar, { top: 18, height: 26 }]} />
          <View style={[styles.dot, { top: 50 }]} />
        </>
      )}
    </Animated.View>
  );
}

/* ── the host ────────────────────────────────────────────────────────────── */

export function DialogHost() {
  const isDark = useColorScheme() === 'dark';
  const [current, setCurrent] = useState<Dialog | null>(null);
  const appear = useRef(new Animated.Value(0)).current;

  const currentRef = useRef<Dialog | null>(null);

  const next = useCallback(() => {
    if (currentRef.current) return;
    const upcoming = queue.shift();
    if (upcoming) {
      currentRef.current = upcoming;
      setCurrent(upcoming);
    }
  }, []);

  useEffect(() => {
    listener = next;
    next();
    return () => {
      listener = null;
    };
  }, [next]);

  useEffect(() => {
    if (current) {
      appear.setValue(0);
      Animated.timing(appear, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [current, appear]);

  const close = (after?: () => void) => {
    currentRef.current = null;
    setCurrent(null);
    // Let the next dialog (or the screen) settle, then run the button's action.
    setTimeout(() => {
      after?.();
      next();
    }, 0);
  };

  if (!current) return null;

  const dismissable = current.cancelable;
  const cancel = current.buttons.find((b) => b.style === 'cancel');
  // The tappable order: actions first, cancel last.
  const ordered = [...current.buttons.filter((b) => b.style !== 'cancel'), ...(cancel ? [cancel] : [])];

  const card = isDark ? '#1A1A1A' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : Illo.ink;
  const sub = isDark ? '#9AA5AD' : '#5E6670';

  const content = (
    <View style={styles.backdrop}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => dismissable && close(current.onDismiss)}
        accessibilityLabel="Close"
      />
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.card,
          {
            backgroundColor: card,
            opacity: appear,
            transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          },
        ]}
      >
        {current.kind === 'success' ? <AnimatedCheck size={110} /> : <Badge kind={current.kind} />}

        <Text style={[styles.title, { color: text }]}>{current.title}</Text>
        {current.message ? <Text style={[styles.message, { color: sub }]}>{current.message}</Text> : null}

        <View style={styles.buttons}>
          {ordered.map((b, i) => {
            const isCancel = b.style === 'cancel';
            const destructive = b.style === 'destructive';
            const primary = !isCancel && !destructive && i === 0;
            return (
              <TouchableOpacity
                key={`${b.text}-${i}`}
                style={[
                  styles.button,
                  destructive && { backgroundColor: Illo.coral },
                  primary && { backgroundColor: Illo.teal },
                  !isCancel && !destructive && !primary && { borderWidth: 1.5, borderColor: Illo.teal },
                ]}
                onPress={() => close(() => b.onPress?.())}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: destructive ? '#FFFFFF' : primary ? Illo.ink : isCancel ? sub : Illo.teal },
                  ]}
                >
                  {b.text || 'OK'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );

  // On iPhone a normal Modal can't open over another Modal or a sheet; an
  // overlay in the window itself always sits on top.
  if (Platform.OS === 'ios') return <FullWindowOverlay>{content}</FullWindowOverlay>;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => {
      if (dismissable) close(current.onDismiss);
    }}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
  },
  bar: {
    position: 'absolute',
    width: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 16 },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  buttons: { alignSelf: 'stretch', gap: 10, marginTop: 22 },
  button: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
