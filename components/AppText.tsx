import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';

/* The app's typeface is Figtree. React Native has no global default font, and a
   custom font needs one family name per weight, so these two wrappers (used
   instead of react-native's Text and TextInput) pick the right Figtree file
   from the `fontWeight` each style already asks for. Nothing else about a
   style changes, and an explicit `fontFamily` always wins. */

const FAMILY: Record<string, string> = {
  '100': 'Figtree_300Light',
  '200': 'Figtree_300Light',
  '300': 'Figtree_300Light',
  '400': 'Figtree_400Regular',
  normal: 'Figtree_400Regular',
  '500': 'Figtree_500Medium',
  '600': 'Figtree_600SemiBold',
  '700': 'Figtree_700Bold',
  bold: 'Figtree_700Bold',
  '800': 'Figtree_800ExtraBold',
  '900': 'Figtree_900Black',
};

function withFigtree(style: TextProps['style']): TextProps['style'] {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  if (flat.fontFamily) return style;
  const family = FAMILY[String(flat.fontWeight ?? '400')] ?? FAMILY['400'];
  // The weight is baked into the family, so the numeric weight is neutralised
  // (Android would otherwise fake a bold on top of an already bold file).
  return [style, { fontFamily: family, fontWeight: 'normal' }] as TextProps['style'];
}

export function Text(props: TextProps & { ref?: React.Ref<RNText> }) {
  return <RNText {...props} style={withFigtree(props.style)} />;
}

// Screens type their refs as `TextInput`, so the name is also the instance type.
export type TextInput = RNTextInput;

export function TextInput(props: TextInputProps & { ref?: React.Ref<RNTextInput> }) {
  return <RNTextInput {...props} style={withFigtree(props.style) as TextInputProps['style']} />;
}
