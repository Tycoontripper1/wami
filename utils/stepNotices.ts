import type { StepKind } from '@/components/order/StepIcon';
import type { ApiNotification } from '@/services/api/notificationsService';

/* How a step change reads as a notice: its drawing, a title, a line of detail and
   where tapping it goes. Used by the notification list (for what the server has
   sent) and by the live banner (for changes the app spots itself). */

export type StepNotice = {
  kind: StepKind;
  title: string;
  body?: string;
  /** Where tapping it goes. */
  href: string;
};

const ORDER_KIND: Record<string, StepKind> = {
  placed: 'receipt',
  paid: 'coins',
  packing: 'box',
  dispatched: 'van',
  delivered: 'house',
  complete: 'medal',
  cancelled: 'receipt',
};

const BOOKING_KIND: Record<string, StepKind> = {
  requested: 'calendar',
  accepted: 'bubble',
  paid: 'coins',
  in_progress: 'clock',
  completed: 'medal',
  declined: 'calendar',
  cancelled: 'calendar',
  expired: 'calendar',
};

export const orderKind = (status: string): StepKind => ORDER_KIND[String(status).toLowerCase()] ?? 'receipt';
export const bookingKind = (status: string): StepKind => BOOKING_KIND[String(status).toLowerCase()] ?? 'calendar';

/** A notification the server sent, as a notice: its data block says what happened. */
export function noticeFromNotification(n: ApiNotification): StepNotice {
  const d: any = n.data && typeof n.data === 'object' ? n.data : n;
  const type = String(d.type ?? n.type ?? '').toLowerCase();
  const title = d.title ?? n.title ?? 'Notification';
  const body = d.description ?? d.preview ?? n.body ?? n.message;

  if (type.includes('order') && d.order_id !== undefined) {
    return { kind: orderKind(d.new_status ?? d.status), title, body, href: `/order-tracking/${d.order_id}` };
  }
  if (type.includes('booking') && (d.booking_id ?? d.id) !== undefined) {
    return { kind: bookingKind(d.new_status ?? d.status), title, body, href: `/service-tracking/${d.booking_id ?? d.id}` };
  }
  if (type.includes('message') && d.conversation_id !== undefined) {
    const name = encodeURIComponent(String(d.sender_name ?? ''));
    return { kind: 'chat', title, body, href: `/chat/${d.conversation_id}?name=${name}` };
  }
  return { kind: 'receipt', title, body, href: '/notifications' };
}

/** "just now", "5 min ago", "3 h ago", "yesterday", then the date. */
export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  return new Date(then).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}
