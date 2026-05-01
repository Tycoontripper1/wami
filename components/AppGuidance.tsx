import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface Step {
  id: string;
  title: string;
  description: string;
  target: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'circle' | 'rect';
  };
  arrowPos: 'top' | 'bottom' | 'left' | 'right';
}

const STORAGE_KEY = '@wami_onboarding_completed';

export default function AppGuidance() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Welcome to Wami! 🚀',
      description: 'Your premium gateway to connecting with world-class creatives. Let’s show you around.',
      target: { x: width / 2, y: height / 2, width: 0, height: 0, type: 'circle' },
      arrowPos: 'bottom',
    },
    {
      id: 'location',
      title: 'Find Creatives',
      description: 'Find top-tier creatives near your current location or change it anytime.',
      target: { x: 80, y: insets.top + 25, width: 150, height: 40, type: 'rect' },
      arrowPos: 'top',
    },
    {
      id: 'swipe',
      title: 'Swipe to Connect',
      description: 'Swipe RIGHT to view profile and connect. Swipe LEFT to see the next creative.',
      target: { x: width / 2, y: height / 2 - 20, width: width - 40, height: 450, type: 'rect' },
      arrowPos: 'bottom',
    },
    {
      id: 'products',
      title: 'Shop Premium Gear',
      description: 'Shop for photography equipment and products directly in the app.',
      target: { x: width - 75, y: insets.top + 25, width: 50, height: 50, type: 'circle' },
      arrowPos: 'top',
    },
    {
      id: 'discover',
      title: 'Discover & Search',
      description: 'Search for specific services or explore trending creatives in our marketplace.',
      target: { x: width / 2, y: height - insets.bottom - 25, width: 80, height: 50, type: 'rect' },
      arrowPos: 'bottom',
    },
  ];

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (e) {
      console.log('Error reading storage', e);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    } catch (e) {
      console.log('Error saving storage', e);
      setVisible(false);
    }
  };

  useEffect(() => {
    if (visible) {
      bounceAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, currentStepIndex]);

  if (!visible) return null;

  const currentStep = steps[currentStepIndex];
  const { target } = currentStep;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id="mask">
              <Rect height={height} width={width} fill="#fff" />
              {target.width > 0 && (
                target.type === 'circle' ? (
                  <Circle cx={target.x} cy={target.y} r={target.width / 2} fill="#000" />
                ) : (
                  <Rect
                    x={target.x - target.width / 2}
                    y={target.y - target.height / 2}
                    width={target.width}
                    height={target.height}
                    rx={12}
                    fill="#000"
                  />
                )
              )}
            </Mask>
          </Defs>
          <Rect
            height={height}
            width={width}
            fill="rgba(0,0,0,0.85)"
            mask="url(#mask)"
          />
        </Svg>

        {/* Content Box */}
        <View 
          style={[
            styles.contentBox,
            currentStep.arrowPos === 'top' ? { top: target.y + target.height / 2 + 30 } : { bottom: height - (target.y - target.height / 2) + 30 }
          ]}
        >
          {/* Arrow */}
          <Animated.View 
            style={[
              styles.arrow,
              currentStep.arrowPos === 'top' ? styles.arrowTop : styles.arrowBottom,
              { transform: [{ translateY: currentStep.arrowPos === 'top' ? bounceAnim.interpolate({ inputRange: [0, 10], outputRange: [-10, 0] }) : bounceAnim }] }
            ]}
          >
            <Ionicons 
              name={currentStep.arrowPos === 'top' ? "caret-up" : "caret-down"} 
              size={32} 
              color={Colors.light.primary} 
            />
          </Animated.View>

          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleComplete}>
              <Text style={styles.skipBtn}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentStepIndex === steps.length - 1 ? "Got it!" : "Next"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.pagination}>
            {steps.map((_, i) => (
              <View 
                key={i} 
                style={[styles.dot, i === currentStepIndex && styles.activeDot]} 
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentBox: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  arrow: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
  },
  arrowTop: {
    top: -25,
  },
  arrowBottom: {
    bottom: -25,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  skipBtn: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A3A3C',
  },
  activeDot: {
    width: 20,
    backgroundColor: Colors.light.primary,
  },
});
