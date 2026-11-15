import React from 'react';
import Journey, { JourneyStep, JourneyTheme } from './Journey';

/* The path a booking takes: asked, agreed, paid and held by Wami, under way, done.
   Drawn by the shared Journey; this decides the stages and the one sentence about
   what happens next, which differs for the person who booked and the creative. */

type Role = 'buyer' | 'creative' | 'viewer';

const ORDER = ['requested', 'accepted', 'paid', 'in_progress', 'completed'];

export default function BookingJourney({
  status,
  role,
  who,
  theme,
  isDark = true,
}: {
  status: string;
  role: Role;
  /** The other person's name, for the sentences ("Waiting for Toheeb to answer"). */
  who?: string;
  theme: JourneyTheme;
  isDark?: boolean;
}) {
  const at = Math.max(0, ORDER.indexOf((status || 'requested').toLowerCase()));
  const buyer = role === 'buyer';
  const name = who || (buyer ? 'the creative' : 'the buyer');

  const steps: JourneyStep[] = [
    {
      key: 'requested',
      kind: 'calendar',
      label: 'Request sent',
      reached: at >= 0,
      now: buyer ? `Waiting for ${name} to answer your request.` : `${name} is waiting for your answer.`,
    },
    {
      key: 'accepted',
      kind: 'bubble',
      label: 'Accepted',
      reached: at >= 1,
      now: buyer ? 'Accepted. Pay to lock in your date.' : `Accepted. Waiting for ${name} to pay.`,
    },
    {
      key: 'paid',
      kind: 'coins',
      label: 'Paid, held by Wami',
      reached: at >= 2,
      now: buyer ? 'Paid. Wami holds the money until the work is done.' : 'Paid. Start the work when the day comes.',
    },
    {
      key: 'in_progress',
      kind: 'clock',
      label: 'In progress',
      reached: at >= 3,
      now: buyer ? 'The work is under way.' : 'Mark the work done when you finish.',
    },
    {
      key: 'completed',
      kind: 'medal',
      label: 'Completed',
      reached: at >= 4,
      now: 'The work is done.',
    },
  ];

  return <Journey steps={steps} theme={theme} isDark={isDark} />;
}
