import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SocialProofBadge from './SocialProofBadge';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.62; // Reduced to show stacked cards below
const SWIPE_THRESHOLD = width * 0.25;

export interface CreativeData {
  id: string;
  name: string;
  role: string;
  location: string;
  distance?: string;
  rating: number;
  reviews: number;
  image?: ImageSourcePropType;
  video?: string;
  tags?: string[];
}

interface SwipeableCardStackProps {
  data: CreativeData[];
  onSwipeLeft?: (item: CreativeData) => void;
  onSwipeRight?: (item: CreativeData) => void;
  onSave?: (item: CreativeData) => void;
}

export default function SwipeableCardStack({
  data,
  onSwipeLeft,
  onSwipeRight,
  onSave,
}: SwipeableCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const position = useRef(new Animated.ValueXY()).current;
  const videoRef = useRef<Video>(null);

  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  // Second card - visible behind current card with offset
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  const nextCardTranslateY = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0, 25, 0],
    extrapolate: 'clamp',
  });

  // Third card for deeper stack effect
  const thirdCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0.95, 0.9, 0.95],
    extrapolate: 'clamp',
  });

  const thirdCardTranslateY = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [25, 50, 25],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      // Only activate for actual drags, not taps
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Activate only if user has moved finger more than 10 pixels
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy * 0.5 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: width + 100, y: gestureState.dy },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            handleSwipeComplete('right');
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -width - 100, y: gestureState.dy },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            handleSwipeComplete('left');
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      const currentItem = data[currentIndex];
      if (direction === 'left') {
        onSwipeLeft?.(currentItem);
      } else {
        onSwipeRight?.(currentItem);
      }
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => (prev + 1) % data.length);
      setIsPlaying(true);
    },
    [currentIndex, data, onSwipeLeft, onSwipeRight, position]
  );

  const togglePlayback = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderCard = (item: CreativeData, index: number) => {
    const isCurrentCard = index === currentIndex;
    const isNextCard = index === (currentIndex + 1) % data.length;
    const isThirdCard = index === (currentIndex + 2) % data.length;
    const isFourthCard = index === (currentIndex + 3) % data.length;

    if (!isCurrentCard && !isNextCard && !isThirdCard && !isFourthCard) return null;

    let animatedStyle = {};
    let zIndex = 0;
    let opacity = 1;

    if (isCurrentCard) {
      animatedStyle = {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: rotate },
        ],
      };
      zIndex = 4;
    } else if (isNextCard) {
      animatedStyle = {
        transform: [
          { scale: nextCardScale },
          { translateY: nextCardTranslateY },
        ],
      };
      zIndex = 3;
      opacity = 0.9;
    } else if (isThirdCard) {
      animatedStyle = {
        transform: [
          { scale: thirdCardScale },
          { translateY: thirdCardTranslateY },
        ],
      };
      zIndex = 2;
      opacity = 0.8;
    } else if (isFourthCard) {
      // Manual interpolation for 4th card since we strictly defined up to 3rd in hooks
      // But we can just use static values for the 4th card as it's the "background" mostly
      // Or we can reuse the 3rd card animations but with different ranges if we defined them
      // For simplicity, we'll give it a static "deep" position that interpolates slightly
      // by reusing thirdCard interactions but clamped
      
      animatedStyle = {
        transform: [
          { scale: 0.85 }, 
          { translateY: 75 }, 
        ],
      };
      zIndex = 1;
      opacity = 0.7;
    }

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.card,
          animatedStyle,
          { zIndex, opacity },
        ]}
        {...(isCurrentCard ? panResponder.panHandlers : {})}
      >
        {/* Video or Image */}
        {item.video ? (
          <>
            <Video
              ref={isCurrentCard ? videoRef : undefined}
              source={{ uri: item.video }}
              style={styles.cardMedia}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isCurrentCard && isPlaying}
              isLooping
              isMuted={false}
            />
            {/* Play/Pause Button - only show on current card */}
            {isCurrentCard && (
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayback}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={28}
                  color={Colors.light.primary}
                />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Image source={item.image} style={styles.cardMedia} resizeMode="cover" />
        )}
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)'] as const}
          style={styles.gradient}
        />

        {/* Top Icons */}
        <View style={styles.topIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="logo-instagram" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="link-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Social Proof Badge */}
        <View style={styles.socialProofContainer}>
          <SocialProofBadge type={index % 2 === 0 ? 'views' : 'trending'} />
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.tags?.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {!item.tags && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.role}</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveIconButton}
          onPress={() => onSave?.(item)}
        >
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.locationText}>
              {item.location}{item.distance ? ` · ${item.distance}` : ''}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewsText}>({item.reviews} reviews)</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Render in reverse order so third card renders first (bottom) */}
      {data.map((item, index) => renderCard(item, index)).reverse()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardMedia: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  topIcons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -28,
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tagsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  saveIconButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reviewsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  socialProofContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
  },
});
