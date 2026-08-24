import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OnboardingProgress from '@/components/OnboardingProgress';
import Colors from '@/constants/Colors';
import { setInstagramAutoSync, setSelectedInstagramPosts } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const GRID_GAP = 4;
const THUMB_SIZE = (width - 48 - GRID_GAP * 2) / 3;

export default function CreativeInstagramPostsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const instagram = useSelector((state: RootState) => state.creativeOnboarding.instagram);
  const savedSelection = useSelector((state: RootState) => state.creativeOnboarding.selectedInstagramPostIds);
  const savedAutoSync = useSelector((state: RootState) => state.creativeOnboarding.instagramAutoSync);

  const posts = instagram?.posts ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(savedSelection?.length ? savedSelection : posts.map(p => p.id));
  const [autoSync, setAutoSync] = useState(savedAutoSync ?? true);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

  const togglePost = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : posts.map(p => p.id));
  };

  const handleSkip = () => {
    dispatch(setSelectedInstagramPosts([]));
    dispatch(setInstagramAutoSync(autoSync));
    router.push('./creative-availability' as any);
  };

  const handleNext = () => {
    dispatch(setSelectedInstagramPosts(selectedIds));
    dispatch(setInstagramAutoSync(autoSync));
    router.push('./creative-availability' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={5} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>Choose your posts</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Select which Instagram posts to show on your Wami profile
        </Text>

        <View style={styles.selectAllRow}>
          <Text style={[styles.selectAllLabel, { color: themeColors.text }]}>
            {selectedIds.length} of {posts.length} selected
          </Text>
          <TouchableOpacity onPress={toggleSelectAll}>
            <Text style={styles.selectAllAction}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {posts.map((post) => {
            const selected = selectedIds.includes(post.id);
            return (
              <TouchableOpacity
                key={post.id}
                style={styles.thumbWrap}
                activeOpacity={0.85}
                onPress={() => togglePost(post.id)}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.thumb} />
                {!selected && <View style={styles.thumbDim} />}
                <View style={styles.checkbox}>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={selected ? Colors.light.primary : '#fff'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.syncRow, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.syncTitle, { color: themeColors.text }]}>Auto-sync new posts</Text>
            <Text style={[styles.syncSubtitle, { color: themeColors.subText }]}>
              Automatically show new Instagram posts on Wami
            </Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: themeColors.border, true: Colors.light.primary }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons onSkip={handleSkip} onNext={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 30, marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  selectAllRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  selectAllLabel: { fontSize: 13, fontWeight: '600' },
  selectAllAction: { fontSize: 13, fontWeight: '700', color: Colors.light.primary },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP,
  },
  thumbWrap: {
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  thumbDim: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)',
  },
  checkbox: {
    position: 'absolute', top: 6, right: 6,
  },
  syncRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 16, borderWidth: 1, marginTop: 24,
  },
  syncTitle: { fontSize: 15, fontWeight: '600' },
  syncSubtitle: { fontSize: 12, marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
});
