// Colours for the flat illustrations (components/illustrations). Drawn from the
// brand — cyan #00BCD4, amber #FFA000, dark #0F1419 — with a lit and a shaded
// shade of each so shapes get depth from two flat faces instead of outlines,
// plus a few friendly accents. Same values as the landing page's "dusk" set.
export const Illo = {
  teal: '#00BCD4',
  tealDeep: '#00838F',
  tealNight: '#0A3A44',
  tealLight: '#6FDCEC',
  glass: '#D9F7FB',

  amber: '#FFA000',
  ember: '#F57C00',
  cloud: '#FFD27A',

  paper: '#FFFFFF',
  ink: '#0F1419',

  coral: '#FF7A66',
  coralDeep: '#E5533F',
  lilac: '#CBB6FF',
  lime: '#C8F044',
  leaf: '#1D5C45',
  leafLight: '#3B8F64',
  brown: '#7A3F1D',
} as const;

// Slide / panel backgrounds. Each carries dark ink text at 7:1 or better.
export const IlloBackgrounds = {
  amber: Illo.amber,
  lilac: Illo.lilac,
  lime: Illo.lime,
  cyan: Illo.teal,
  coral: Illo.coral,
} as const;
