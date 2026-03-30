import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface VoiceNoteProps {
  uri?: string;
  duration?: number;
  isRecording?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
}

export default function VoiceNote({
  duration = 0,
  isRecording = false,
  onPlay,
  onPause,
  isPlaying = false,
}: VoiceNoteProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [currentTime, setCurrentTime] = useState(0);

  const themeColors = {
    background: isDark ? '#2a2a2a' : '#f0f0f0',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
  };

  useEffect(() => {
    if (isRecording || isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [isRecording, isPlaying]);

  // Simulate playback time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, duration));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, currentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWaveform = () => {
    const bars = 20;
    return (
      <View style={styles.waveform}>
        {Array.from({ length: bars }).map((_, i) => {
          const baseHeight = Math.random() * 20 + 5;
          const animatedHeight = waveAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [baseHeight * 0.5, baseHeight],
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: isRecording || isPlaying ? animatedHeight : baseHeight * 0.7,
                  backgroundColor:
                    isPlaying && i < (currentTime / duration) * bars
                      ? Colors.light.primary
                      : isDark
                      ? '#555'
                      : '#ccc',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={isPlaying ? onPause : onPlay}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      
      {renderWaveform()}
      
      <Text style={[styles.duration, { color: themeColors.subText }]}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 10,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 30,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
  },
});
