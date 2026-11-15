import React from 'react';
import Journey, { JourneyStep, JourneyTheme } from './Journey';

/* The path an order takes: placed, paid, packed, on its way, delivered, complete.
   The drawing itself is shared (Journey.tsx); this decides the stages and the one
   sentence about what happens next, which depends on who is looking. */

type Role = 'buyer' | 'seller' | 'viewer';

const ORDER = ['placed', 'packing', 'dispatched', 'delivered', 'complete'];
const rank = (status: string) => Math.max(0, ORDER.indexOf(status));

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
  theme: JourneyTheme;
  isDark?: boolean;
}) {
  const r = rank((status || 'placed').toLowerCase());
  const buyer = role === 'buyer';

  const steps: JourneyStep[] = [
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

  return <Journey steps={steps} theme={theme} isDark={isDark} />;
}
