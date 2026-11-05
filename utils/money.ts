/**
 * Puts the commas in as someone types an amount, so 1250000 reads as
 * 1,250,000. Anything that is not a digit is dropped. Whole naira is the
 * default; pass `{ decimals: true }` for fields that take kobo (up to two
 * places, as in a wallet top-up).
 */
export function formatAmountInput(text: string, options?: { decimals?: boolean }): string {
  let clean = String(text ?? '').replace(/[^\d.]/g, '');

  if (!options?.decimals) {
    clean = clean.split('.')[0];
  } else {
    const [whole, ...rest] = clean.split('.');
    clean = rest.length > 0 ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
  }

  const [whole, fraction] = clean.split('.');
  const trimmed = whole.replace(/^0+(?=\d)/, '');
  const grouped = trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${grouped}.${fraction}` : grouped;
}

/** The number behind what was typed: "1,250,000" is 1250000; empty or invalid is 0. */
export function parseAmount(text: string | number | null | undefined): number {
  if (typeof text === 'number') return Number.isFinite(text) ? text : 0;
  const n = Number(String(text ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** A short form for axes and tight spaces: 950, 12.5k, 1.2M. No currency sign. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

const trim = (n: number) => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toString();
