import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/* One drawing per stage of an order, in the flat two-tone style of the rest of
   the app: a main colour for the body, a second tone for the shaded parts, and a
   third (the tile behind) knocked out for the details. All on a 32 grid.

   receipt: the order placed   coins: paid          box: being packed
   van: on its way             house: delivered     medal: complete
   calendar: a booking asked   bubble: agreed      clock: the work under way */

export type StepKind = 'receipt' | 'coins' | 'box' | 'van' | 'house' | 'medal' | 'calendar' | 'bubble' | 'clock' | 'chat';

export default function StepIcon({
  kind,
  size = 26,
  ink,
  soft,
  cut,
}: {
  kind: StepKind;
  size?: number;
  /** The body of the drawing. */
  ink: string;
  /** The shaded parts. */
  soft: string;
  /** The colour behind the drawing, used for the details cut out of it. */
  cut: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {kind === 'receipt' ? (
        <>
          <Path d="M8 4h16a2 2 0 0 1 2 2v22l-3-2-3 2-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2z" fill={ink} />
          <Rect x="11" y="10" width="10" height="2.2" rx="1.1" fill={cut} />
          <Rect x="11" y="15" width="10" height="2.2" rx="1.1" fill={cut} />
          <Rect x="11" y="20" width="6" height="2.2" rx="1.1" fill={soft} />
        </>
      ) : null}

      {kind === 'coins' ? (
        <>
          <Circle cx="20.5" cy="11.5" r="8" fill={soft} />
          <Circle cx="14" cy="19" r="9.5" fill={ink} />
          <Circle cx="14" cy="19" r="6.2" fill="none" stroke={cut} strokeWidth="1.8" />
          <Path d="M10.8 19.2l2.4 2.4 4.4-4.8" fill="none" stroke={cut} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}

      {kind === 'box' ? (
        <>
          <Path d="M4 11l12 5.5V29L4 23.5z" fill={ink} />
          <Path d="M28 11l-12 5.5V29l12-5.5z" fill={soft} />
          <Path d="M4 11l12-6 12 6-12 5.5z" fill={ink} />
          <Path d="M9.4 8.3l12 5.9-3.4 1.7L6 10z" fill={cut} opacity={0.9} />
          <Path d="M16 16.5V29" stroke={cut} strokeWidth="1.6" opacity={0.5} />
        </>
      ) : null}

      {kind === 'van' ? (
        <>
          <Rect x="2" y="8" width="17" height="14.5" rx="2.4" fill={ink} />
          <Path d="M19 12.5h5.6l4.4 4.7v5.3H19z" fill={soft} />
          <Path d="M21.2 14.4h2.9l2.5 2.8h-5.4z" fill={cut} />
          <Rect x="5" y="11.5" width="8" height="2" rx="1" fill={cut} opacity={0.85} />
          <Circle cx="9" cy="23.5" r="3.9" fill={ink} stroke={cut} strokeWidth="1.6" />
          <Circle cx="23" cy="23.5" r="3.9" fill={ink} stroke={cut} strokeWidth="1.6" />
          <Circle cx="9" cy="23.5" r="1.2" fill={cut} />
          <Circle cx="23" cy="23.5" r="1.2" fill={cut} />
        </>
      ) : null}

      {kind === 'house' ? (
        <>
          <Path d="M5 15.5L16 6.5l11 9V28H5z" fill={ink} />
          <Path d="M2.5 16L16 4.8 29.5 16" fill="none" stroke={soft} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="13" y="18" width="6" height="10" rx="1.2" fill={cut} />
          <Circle cx="17.6" cy="23.2" r="0.8" fill={ink} />
          <Rect x="21" y="12.5" width="3" height="5" rx="0.8" fill={soft} />
        </>
      ) : null}

      {kind === 'medal' ? (
        <>
          <Path d="M10 18.5L6.5 29l5.5-2.8 2.6 4.3 1.4-8.6z" fill={soft} />
          <Path d="M22 18.5L25.5 29 20 26.2l-2.6 4.3L16 21.9z" fill={soft} />
          <Circle cx="16" cy="12" r="9.5" fill={ink} />
          <Path d="M16 6.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill={cut} />
        </>
      ) : null}
      {kind === 'calendar' ? (
        <>
          <Rect x="4" y="6" width="24" height="22" rx="4" fill={ink} />
          <Path d="M4 10a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v3.5H4z" fill={soft} />
          <Rect x="9.5" y="3" width="3" height="7" rx="1.5" fill={ink} />
          <Rect x="19.5" y="3" width="3" height="7" rx="1.5" fill={ink} />
          <Circle cx="10" cy="19" r="1.7" fill={cut} />
          <Circle cx="16" cy="19" r="1.7" fill={cut} />
          <Circle cx="22" cy="19" r="1.7" fill={cut} />
          <Circle cx="10" cy="24" r="1.7" fill={cut} />
          <Circle cx="16" cy="24" r="1.7" fill={soft} />
        </>
      ) : null}

      {kind === 'bubble' ? (
        <>
          <Path d="M5 8a3.5 3.5 0 0 1 3.5-3.5h15A3.5 3.5 0 0 1 27 8v11a3.5 3.5 0 0 1-3.5 3.5H16L10 28v-5.5H8.5A3.5 3.5 0 0 1 5 19z" fill={ink} />
          <Path d="M10.6 13.4l3.6 3.6 7.2-7.4" fill="none" stroke={cut} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}

      {kind === 'chat' ? (
        <>
          <Path d="M5 8a3.5 3.5 0 0 1 3.5-3.5h15A3.5 3.5 0 0 1 27 8v11a3.5 3.5 0 0 1-3.5 3.5H16L10 28v-5.5H8.5A3.5 3.5 0 0 1 5 19z" fill={ink} />
          <Circle cx="11" cy="13.5" r="1.9" fill={cut} />
          <Circle cx="16" cy="13.5" r="1.9" fill={cut} />
          <Circle cx="21" cy="13.5" r="1.9" fill={soft} />
        </>
      ) : null}

      {kind === 'clock' ? (
        <>
          <Circle cx="6.5" cy="7" r="3.6" fill={soft} />
          <Circle cx="25.5" cy="7" r="3.6" fill={soft} />
          <Circle cx="16" cy="17.5" r="11.5" fill={ink} />
          <Path d="M16 10.5v7l5 3" fill="none" stroke={cut} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="16" cy="17.5" r="1.4" fill={cut} />
        </>
      ) : null}
    </Svg>
  );
}
