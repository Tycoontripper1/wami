import { OrderTone } from '@/services/api/ordersService';

// Badge colours for order and payment states. Every pair keeps at least 4.5:1
// between text and its own background, in both colour schemes.
const LIGHT: Record<OrderTone, { bg: string; fg: string }> = {
  warn: { bg: '#FFF1CC', fg: '#7A4A00' },
  good: { bg: '#DDF5E8', fg: '#0B5D33' },
  info: { bg: '#D9F7FB', fg: '#005F6B' },
  bad: { bg: '#FDECEA', fg: '#8A1C14' },
  muted: { bg: '#EEF1F4', fg: '#4A545E' },
};

const DARK: Record<OrderTone, { bg: string; fg: string }> = {
  warn: { bg: '#3A2A00', fg: '#FFD27A' },
  good: { bg: '#0F3A24', fg: '#8FE0B5' },
  info: { bg: '#0A3A44', fg: '#6FDCEC' },
  bad: { bg: '#431511', fg: '#FFB4AB' },
  muted: { bg: '#232A31', fg: '#B8C0C8' },
};

export const orderToneColors = (isDark: boolean) => (isDark ? DARK : LIGHT);
