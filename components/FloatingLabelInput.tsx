import Colors from '@/constants/Colors';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TextInputProps, View, ViewStyle, useColorScheme } from 'react-native';
import { TextInput } from '@/components/AppText';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
  rightAccessory?: React.ReactNode;
  /** For screens that are always white, whatever the device theme. */
  forceLight?: boolean;
}

export function FloatingLabelInput({ 
  label, 
  value, 
  containerStyle, 
  rightAccessory,
  forceLight,
  style, 
  onFocus, 
  onBlur, 
  placeholder,
  ...props 
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const multiline = !!props.multiline;
  // A text area grows with what is typed, from `numberOfLines` rows up to 10 rows,
  // then scrolls. (Native reports the text height; the web reports it with padding.)
  const rows = props.numberOfLines ?? 3;
  const pad = Platform.OS === 'web' ? 0 : 26;
  const textAreaHeight = Math.min(Math.max(rows * 21 + 26, contentHeight + pad), 10 * 21 + 26);
  // The container draws the focus border; the browser's own ring would double it.
  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' && !forceLight;
  
  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    border: isDark ? '#333' : '#E0E0E0',
    placeholder: isDark ? '#666' : '#999',
    labelInactive: isDark ? '#666' : '#999',
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [13, -9],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [themeColors.labelInactive, Colors.light.primary],
    }),
    backgroundColor: themeColors.background,
    paddingHorizontal: 4,
    zIndex: 1,
    fontFamily: 'Figtree_500Medium',
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text style={labelStyle} pointerEvents="none">
        {label}
      </Animated.Text>
      <View style={[
        styles.inputContainer,
        multiline ? styles.multilineContainer : styles.singleLineContainer,
        { 
          borderColor: themeColors.border,
          backgroundColor: themeColors.background 
        },
        isFocused && styles.focusedContainer
      ]}>
        <TextInput
          {...props}
          value={value}
          style={[
            styles.input,
            multiline && [styles.multilineInput, { height: textAreaHeight }],
            { color: themeColors.text },
            webNoOutline,
            style,
          ]}
          onContentSizeChange={(e) => {
            setContentHeight(e.nativeEvent.contentSize.height);
            props.onContentSizeChange?.(e);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor={themeColors.placeholder}
        />
        {rightAccessory}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  // The app's standard field: 46px tall, 10px radius, 15px text.
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
  },
  singleLineContainer: {
    alignItems: 'center',
    height: 46,
  },
  // A text area grows with its content instead of clipping it to one row.
  multilineContainer: {
    alignItems: 'flex-start',
    minHeight: 46,
  },
  focusedContainer: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multilineInput: {
    alignSelf: 'stretch',
    paddingTop: 13,
    paddingBottom: 13,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
});
