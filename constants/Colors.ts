const tintColorLight = '#00BCD4'; // Primary Cyan
const tintColorDark = '#fff';

export default {
  light: {
    // 0F1419 (brand dark, see constants/Brand.ts) instead of pure #000 —
    // softer, and it's already the brand's dark tone elsewhere (splash).
    text: '#0F1419',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: '#00BCD4',
    primaryLight: '#00BCD460',
    // For a button that needs to keep WHITE text on a cyan-family
    // background: white-on-00BCD4 is 2.3:1 contrast, well under the 4.5:1
    // minimum for readable text. White-on-00838F is 4.5:1 — use this
    // background instead in that case. Prefer dark text on the regular
    // `primary` cyan where the design allows it (8.1:1) over reaching for
    // this. Checked 2026-10-10.
    primaryDeep: '#00838F',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#00BCD4',
    primaryDeep: '#00838F',
  },
};
