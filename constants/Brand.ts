/** WAMI 2.0 brand tokens — splash, logo cutouts, native splash backgrounds */
export const Brand = {
  cyan: '#00BCD4',
  cyanBright: '#33C9E2',
  // White text on `cyan` is 2.3:1 contrast — well under the 4.5:1 minimum
  // for readable text. Use this deeper shade when the design needs to keep
  // white text on a cyan-family background (4.5:1); white-on-amber has no
  // such passing deep variant (even worse: 2.0:1) — amber buttons need dark
  // text, not a deeper amber. Checked 2026-10-10.
  cyanDeep: '#00838F',
  amber: '#FFA000',
  white: '#FFFFFF',
  splash: {
    light: '#00BCD4',
    dark: '#0F1419',
  },
} as const;
