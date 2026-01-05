import Colors from '@/constants/Colors';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TextInputProps, View, ViewStyle, useColorScheme } from 'react-native';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
  rightAccessory?: React.ReactNode;
}

export function FloatingLabelInput({ 
  label, 
  value, 
  containerStyle, 
  rightAccessory,
  style, 
  onFocus, 
  onBlur, 
  placeholder,
  ...props 
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    border: isDark ? '#333' : '#E0E0E0',
    placeholder: isDark ? '#666' : '#999',
    labelInactive: isDark ? '#666' : '#999',
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [themeColors.labelInactive, Colors.light.primary],
    }),
    backgroundColor: themeColors.background,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text style={labelStyle} pointerEvents="none">
        {label}
      </Animated.Text>
      <View style={[
        styles.inputContainer,
        { 
          borderColor: themeColors.border,
          backgroundColor: themeColors.background 
        },
        isFocused && styles.focusedContainer
      ]}>
        <TextInput
          {...props}
          value={value}
          style={[styles.input, { color: themeColors.text }, style]}
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
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
  },
  focusedContainer: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
