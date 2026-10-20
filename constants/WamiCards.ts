// "From Wami" cards on the Home feed: updates, tips and announcements written
// by the team. They live here until the backend serves them (see the plan for
// an announcements endpoint: kind, title, body, image, button, link,
// placement, dates, audience). Keep each one true to what the app does today.

export type WamiCardKind = 'update' | 'tip' | 'announcement';

export interface WamiCard {
  id: string;
  kind: WamiCardKind;
  title: string;
  body: string;
  button: string;
  /** An in-app route. */
  route: string;
}

export const WAMI_CARDS: WamiCard[] = [
  {
    id: 'explore-map',
    kind: 'update',
    title: 'See creatives on the map',
    body: 'Pick a city and tap a bubble to find who is around you.',
    button: 'Open the map',
    route: '/explore-map',
  },
  {
    id: 'list-something',
    kind: 'tip',
    title: 'Make something? List it',
    body: 'Add a product or a service in a minute and let people find it.',
    button: 'Start listing',
    route: '/(tabs)/sell',
  },
];
