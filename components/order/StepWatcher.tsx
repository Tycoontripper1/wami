import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import { ApiBooking, bookingRole, getAllMyBookings, normaliseStatus } from '@/services/api/bookingsService';
import { getNotifications } from '@/services/api/notificationsService';
import { ApiOrderRecord, getOrders, orderRole } from '@/services/api/ordersService';
import { emitStepNotice, onStepNotice } from '@/services/stepEvents';
import type { RootState } from '@/store/store';
import { extractList } from '@/utils/extractList';
import { StepNotice, bookingKind, noticeFromNotification, orderKind } from '@/utils/stepNotices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import StepIcon from './StepIcon';

/* Step-change notices while the app is open.

   The server already writes notifications for some events (an order moving on,
   a new message) and push needs credentials that are not there yet. Until then,
   this does the job on the phone: every half minute it looks at the person's
   orders and bookings, compares them with what it saw last time, and when the
   OTHER person has moved a step it slides a banner in from the top: the step's
   drawing, what happened, and a tap that opens it. Your own moves are never
   announced back to you. New chat messages the server has sent are shown the same
   way (unless that chat is open, which already updates itself).

   What it saw last time is kept per account on the phone. The very first look only
   remembers, so nobody is greeted with a pile of old news. */

const EVERY = 30000;
const snapshotKey = (userId: string | number | undefined) => `@wami_steps_seen_${userId ?? 'x'}`;

type Snapshot = { orders: Record<string, string>; bookings: Record<string, string>; notices: string[] };

const personName = (p: any): string | undefined => (p ? p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username : undefined);
const firstName = (name?: string) => (name ? name.split(' ')[0] : undefined);

/** The orders where the other person has just moved a step, as notices. */
function orderNotices(orders: ApiOrderRecord[], myId: string | number | undefined, before: Record<string, string>): StepNotice[] {
  const out: StepNotice[] = [];
  for (const o of orders) {
    const role = orderRole(o, myId);
    const status = String(o.status ?? 'placed').toLowerCase();
    const paid = ['paid', 'success', 'successful'].includes(String(o.payment_status ?? '').toLowerCase());
    const stage = paid && status === 'placed' ? 'paid' : status;
    const seen = before[String(o.id)];
    if (seen === stage) continue;
    if (seen === undefined && role !== 'seller') continue; // my own new order is not news

    const href = `/order-tracking/${o.id}`;
    if (role === 'seller') {
      if (seen === undefined && stage === 'placed') out.push({ kind: 'receipt', title: `New order #${o.id}`, body: 'A buyer placed an order. It starts once they pay.', href });
      else if (stage === 'paid') out.push({ kind: 'coins', title: `Order #${o.id} is paid`, body: 'Start packing when you are ready.', href });
      else if (stage === 'delivered') out.push({ kind: 'house', title: `Order #${o.id} arrived`, body: 'The buyer confirmed it arrived.', href });
      else if (stage === 'complete') out.push({ kind: 'medal', title: `Order #${o.id} is complete`, body: 'The buyer has closed the order.', href });
    } else {
      if (stage === 'packing') out.push({ kind: orderKind('packing'), title: `Order #${o.id} is being packed`, body: 'The seller has started on it.', href });
      else if (stage === 'dispatched') out.push({ kind: orderKind('dispatched'), title: `Order #${o.id} is on its way`, body: 'Tap "I received it" when it arrives.', href });
    }
  }
  return out;
}

/** The bookings where the other person has just moved a step, as notices. */
function bookingNotices(bookings: ApiBooking[], myId: string | number | undefined, before: Record<string, string>): StepNotice[] {
  const out: StepNotice[] = [];
  for (const b of bookings) {
    const role = bookingRole(b, myId);
    const status = normaliseStatus(b.status);
    const seen = before[String(b.id)];
    if (seen === status) continue;
    if (seen === undefined && role !== 'creative') continue; // a booking I just made is not news

    const href = `/service-tracking/${b.id}`;
    const who = firstName(role === 'creative' ? personName(b.buyer) : personName(b.creative ?? b.creator));
    const title = String(b.project_title ?? 'your booking');
    if (role === 'creative') {
      if (seen === undefined && status === 'requested') out.push({ kind: 'calendar', title: 'New booking request', body: `${who ?? 'Someone'} asked for ${title}. Answer it from the booking.`, href });
      else if (status === 'paid') out.push({ kind: 'coins', title: 'A booking was paid', body: `${who ?? 'The buyer'} paid. Start the work when the day comes.`, href });
    } else {
      if (status === 'accepted') out.push({ kind: bookingKind('accepted'), title: 'Your booking was accepted', body: `${who ?? 'The creative'} accepted. Pay to lock in your date.`, href });
      else if (status === 'in_progress') out.push({ kind: bookingKind('in_progress'), title: 'The work has started', body: `${who ?? 'The creative'} is on it.`, href });
      else if (status === 'completed') out.push({ kind: bookingKind('completed'), title: 'The work is done', body: 'Release the payment if you are happy.', href });
      else if (status === 'declined') out.push({ kind: 'calendar', title: 'Your request was declined', body: `${who ?? 'The creative'} could not take it.`, href });
    }
  }
  return out;
}

export default function StepWatcher() {
  const signedIn = useSelector((s: RootState) => s.auth.isAuthenticated);
  const myId = useSelector((s: RootState) => (s.auth.user as any)?.id);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const look = useCallback(async () => {
    if (!signedIn || myId === undefined || AppState.currentState !== 'active') return;
    try {
      const raw = await AsyncStorage.getItem(snapshotKey(myId));
      const before: Snapshot | null = raw ? JSON.parse(raw) : null;

      const [orders, bookings, feed] = await Promise.all([
        getOrders(1).catch(() => null),
        getAllMyBookings().catch(() => null),
        getNotifications({ page: 1 }).then((r) => extractList<any>(r.data)).catch(() => null),
      ]);

      const next: Snapshot = { orders: { ...(before?.orders ?? {}) }, bookings: { ...(before?.bookings ?? {}) }, notices: before?.notices ?? [] };
      const notices: StepNotice[] = [];

      if (orders) {
        if (before) notices.push(...orderNotices(orders, myId, before.orders));
        for (const o of orders) {
          const status = String(o.status ?? 'placed').toLowerCase();
          const paid = ['paid', 'success', 'successful'].includes(String(o.payment_status ?? '').toLowerCase());
          next.orders[String(o.id)] = paid && status === 'placed' ? 'paid' : status;
        }
      }
      if (bookings) {
        if (before) notices.push(...bookingNotices(bookings, myId, before.bookings));
        for (const b of bookings) next.bookings[String(b.id)] = normaliseStatus(b.status);
      }
      // New chat messages the server has sent; orders and bookings are covered above.
      if (feed) {
        const seen = new Set(next.notices);
        for (const n of feed) {
          const id = String(n.id);
          if (seen.has(id)) continue;
          seen.add(id);
          const d: any = n.data ?? n;
          const unread = !(n.read_at ?? n.is_read);
          const inThatChat = String(d.conversation_id) !== 'undefined' && pathRef.current.startsWith(`/chat/${d.conversation_id}`);
          if (before && unread && String(d.type ?? '').toLowerCase().includes('message') && !inThatChat) notices.push(noticeFromNotification(n));
        }
        next.notices = Array.from(seen).slice(-60);
      }

      await AsyncStorage.setItem(snapshotKey(myId), JSON.stringify(next));
      // A few at a time, so a long absence does not bury the screen.
      notices.slice(0, 3).forEach((n, i) => setTimeout(() => emitStepNotice(n), i * 1200));
    } catch {
      // A missed look is fine; the next one tries again.
    }
  }, [signedIn, myId]);

  useEffect(() => {
    if (!signedIn) return;
    void look();
    const timer = setInterval(() => void look(), EVERY);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void look();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [signedIn, look]);

  return signedIn ? <Banner /> : null;
}

/** The notice sliding in from the top: its drawing, what happened, a tap to open it. */
function Banner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notice, setNotice] = useState<StepNotice | null>(null);
  const queue = useRef<StepNotice[]>([]);
  const slide = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showing = useRef(false);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start(() => {
      showing.current = false;
      setNotice(null);
      const next = queue.current.shift();
      if (next) show(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show = useCallback(
    (n: StepNotice) => {
      showing.current = true;
      setNotice(n);
      Animated.timing(slide, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.2)), useNativeDriver: Platform.OS !== 'web' }).start();
      timer.current = setTimeout(hide, 6500);
    },
    [slide, hide]
  );

  useEffect(
    () =>
      onStepNotice((n) => {
        if (showing.current) queue.current.push(n);
        else show(n);
      }),
    [show]
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!notice) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: insets.top + 8, opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] }) }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${notice.title}. ${notice.body ?? ''}`}
        onPress={() => {
          const href = notice.href;
          hide();
          router.push(href as any);
        }}
        style={styles.card}
      >
        <View style={styles.tile}>
          <StepIcon kind={notice.kind} size={24} ink="#0F1419" soft="#FFFFFF" cut={Colors.light.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {notice.title}
          </Text>
          {notice.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {notice.body}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 9999, elevation: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  tile: { width: 42, height: 42, borderRadius: 13, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  body: { color: '#B8C0C8', fontSize: 13, lineHeight: 18, marginTop: 1 },
});
