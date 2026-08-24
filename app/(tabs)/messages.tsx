import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock conversations data
const CONVERSATIONS = [
  {
    id: '1',
    name: 'Paul Studio',
    role: 'Photographer',
    lastMessage: 'Sure, I can do that shoot next week!',
    time: '2m ago',
    unread: 2,
    image: require('@/assets/images/onboarding_bg_creative.webp'),
    online: true,
  },
  {
    id: '2',
    name: 'Sandra Hair',
    role: 'HairStylist',
    lastMessage: 'Thanks for the booking confirmation',
    time: '1h ago',
    unread: 0,
    image: require('@/assets/images/onboarding_bg_seller.webp'),
    online: false,
  },
  {
    id: '3',
    name: 'Sarah Makeup',
    role: 'Makeup Artist',
    lastMessage: 'I\'ll send you the portfolio soon',
    time: '3h ago',
    unread: 1,
    image: require('@/assets/images/onboarding_bg_service.webp'),
    online: true,
  },
  {
    id: '4',
    name: 'Mike Events',
    role: 'Event Planner',
    lastMessage: 'The venue is confirmed for Saturday',
    time: 'Yesterday',
    unread: 0,
    image: require('@/assets/images/onboarding_bg_creative.webp'),
    online: false,
  },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const filteredConversations = CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: typeof CONVERSATIONS[0] }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { borderBottomColor: themeColors.border }]}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        <Image source={item.image} style={styles.avatar} resizeMode="cover" />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.topRow}>
          <Text style={[styles.conversationName, { color: themeColors.text }]}>{item.name}</Text>
          <Text style={[styles.timeText, { color: themeColors.subText }]}>{item.time}</Text>
        </View>
        <Text style={[styles.roleText, { color: themeColors.subText }]}>{item.role}</Text>
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: item.unread > 0 ? themeColors.text : themeColors.subText },
              item.unread > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbox-outline" size={80} color={themeColors.subText} />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No messages yet</Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
        Start a conversation with creatives you're interested in!
      </Text>
      <TouchableOpacity
        style={styles.findCreativeButton}
        onPress={() => router.push('/(tabs)/discover')}
      >
        <Text style={styles.findCreativeButtonText}>Find a Creative</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: themeColors.text }]}>Messages</Text>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
          <Ionicons name="search" size={20} color={themeColors.subText} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={themeColors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
  },
  roleText: {
    fontSize: 12,
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  findCreativeButton: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  findCreativeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
