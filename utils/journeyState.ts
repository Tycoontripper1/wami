import type { StepKind } from '@/components/order/StepIcon';
import { ApiBooking, bookingRole, normaliseStatus } from '@/services/api/bookingsService';
import { ApiOrderRecord, orderRole } from '@/services/api/ordersService';

/* Where an order or a booking is, in one small object, for the lists: which stage
   (its drawing and name), how far along it is, and whether it is waiting on the
   person looking (`needs`, a few words such as "Pay now"). The lists use it to
   draw a progress strip on every row and to put what needs you first. The detail
   screens draw the same stages in full (OrderJourney, BookingJourney). */

export type JourneyState = {
  kind: StepKind;
  label: string;
  /** Zero-based stage the thing has reached. */
  index: number;
  total: number;
  /** A few words when it is this person's move. */
  needs?: string;
  /** Set for a dead end (cancelled, declined...): the strip shows only this, greyed. */
  ended?: string;
};

const ORDER_STEPS: Array<{ kind: StepKind; label: string }> = [
  { kind: 'receipt', label: 'Order placed' },
  { kind: 'coins', label: 'Payment received' },
  { kind: 'box', label: 'Being packed' },
  { kind: 'van', label: 'On its way' },
  { kind: 'house', label: 'Delivered' },
  { kind: 'medal', label: 'Complete' },
];
const ORDER_RANK = ['placed', 'packing', 'dispatched', 'delivered', 'complete'];

export function orderState(order: ApiOrderRecord, myId?: string | number): JourneyState {
  const status = String(order.status ?? 'placed').toLowerCase();
  const paid = ['paid', 'success', 'successful'].includes(String(order.payment_status ?? '').toLowerCase());
  const total = ORDER_STEPS.length;
  if (status === 'cancelled') return { ...ORDER_STEPS[0], index: 0, total, ended: 'Cancelled' };

  const rank = Math.max(0, ORDER_RANK.indexOf(status));
  const index = paid ? (rank === 0 ? 1 : rank + 1) : 0;
  const role = orderRole(order, myId);

  let needs: string | undefined;
  if (role === 'buyer' && !paid) needs = 'Pay now';
  else if (role === 'seller' && paid && status === 'placed') needs = 'Start packing';
  else if (role === 'seller' && paid && status === 'packing') needs = 'Dispatch it';
  else if (role === 'buyer' && status === 'dispatched') needs = 'Confirm arrival';
  else if (role === 'buyer' && status === 'delivered') needs = 'Finish order';

  return { ...ORDER_STEPS[index], index, total, needs };
}

const BOOKING_STEPS: Array<{ kind: StepKind; label: string }> = [
  { kind: 'calendar', label: 'Request sent' },
  { kind: 'bubble', label: 'Accepted' },
  { kind: 'coins', label: 'Paid, held by Wami' },
  { kind: 'clock', label: 'In progress' },
  { kind: 'medal', label: 'Completed' },
];
const BOOKING_RANK = ['requested', 'accepted', 'paid', 'in_progress', 'completed'];
const BOOKING_ENDS: Record<string, string> = {
  cancelled: 'Cancelled',
  declined: 'Declined',
  expired: 'Expired',
  disputed: 'Disputed',
};

export function bookingState(booking: ApiBooking, myId?: string | number): JourneyState {
  const status = normaliseStatus(booking.status);
  const total = BOOKING_STEPS.length;
  if (BOOKING_ENDS[status]) return { ...BOOKING_STEPS[0], index: 0, total, ended: BOOKING_ENDS[status] };

  const index = Math.max(0, BOOKING_RANK.indexOf(status));
  const role = bookingRole(booking, myId);

  let needs: string | undefined;
  if (role === 'creative' && status === 'requested') needs = 'Answer request';
  else if (role === 'buyer' && status === 'accepted') needs = 'Pay now';
  else if (role === 'creative' && status === 'paid') needs = 'Start the work';
  else if (role === 'creative' && status === 'in_progress') needs = 'Mark done';
  else if (role === 'buyer' && status === 'completed' && booking.money_released !== true) needs = 'Release payment';

  return { ...BOOKING_STEPS[index], index, total, needs };
}

/** Rows that are waiting on this person first; otherwise the order they came in. */
export function needsFirst<T>(rows: T[], stateOf: (row: T) => JourneyState): T[] {
  return rows
    .map((row, position) => ({ row, position, needs: stateOf(row).needs ? 0 : 1 }))
    .sort((a, b) => a.needs - b.needs || a.position - b.position)
    .map((entry) => entry.row);
}
