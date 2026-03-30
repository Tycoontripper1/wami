import Colors from '@/constants/Colors';
import { CREATIVES_DB } from '@/store/creativeMatchSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

interface RecommendedCreativesProps {
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

export default function RecommendedCreatives({
  title = 'Based on your saves',
  subtitle = 'You might love...',
  maxItems = 5,
}: RecommendedCreativesProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { recommendations, matchScores, quizCompleted } = useSelector(
    (state: RootState) => state.creativeMatch
  );
  const favorites = useSelector((state: RootState) => state.favorites.items);

  const themeColors = {
    background: isDark ? '#1a1a1a' : '#f5f5f5',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#2a2a2a' : '#fff',
  };

  // Get recommended creatives with their data
  const recommendedCreatives = recommendations
    .slice(0, maxItems)
    .map((id) => {
      const creative = CREATIVES_DB.find((c) => c.id === id);
      return creative ? { ...creative, matchScore: matchScores[id] } : null;
    })
    .filter(Boolean);

  // If no quiz completed, show prompt
  if (!quizCompleted && favorites.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: themeColors.text }]}>Find Your Perfect Match</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              Take our Creative DNA quiz
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.quizPrompt}
          onPress={() => router.push('/creative-dna-quiz' as any)}
        >
          <View style={styles.quizContent}>
            <Text style={styles.quizIcon}>🧬</Text>
            <View style={styles.quizText}>
              <Text style={styles.quizTitle}>Creative DNA Quiz</Text>
              <Text style={styles.quizDesc}>
                Answer 5 quick questions to discover creatives that match your style
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  if (recommendedCreatives.length === 0) {
    return null;
  }

  const renderCreative = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.creativeCard, { backgroundColor: themeColors.cardBg }]}
      onPress={() => router.push(`/profile/${item.id}` as any)}
    >
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={24} color={themeColors.subText} />
      </View>
      <Text style={[styles.creativeName, { color: themeColors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{item.matchScore}% match</Text>
      </View>
      <View style={styles.tagsRow}>
        {item.aesthetics.slice(0, 2).map((tag: string) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: themeColors.subText }]}>{subtitle}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/creative-dna-quiz' as any)}>
          <Text style={styles.retakeLink}>Retake Quiz</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={recommendedCreatives}
        renderItem={renderCreative}
        keyExtractor={(item) => item!.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  retakeLink: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  creativeCard: {
    width: 140,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  creativeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  matchBadge: {
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  matchText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  quizPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 16,
  },
  quizContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quizIcon: {
    fontSize: 36,
  },
  quizText: {
    flex: 1,
  },
  quizTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  quizDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
});
