import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { ApiConversation, getConversations } from '@/services/api/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

// The collection's conversation shape is unconfirmed beyond `id` — map
// defensively, the same way discoveryService's DiscoveryOffering does.
// See docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §3.7.
const displayName = (c: ApiConversation) =>
  c.name || c.recipient?.name || c.recipient_name || `Conversation #${c.id}`;
const displayAvatar = (c: ApiConversation): string | undefined =>
  c.avatar || c.recipient?.avatar || c.image;
const displayLastMessage = (c: ApiConversation) => {
  const lm: any = c.last_message;
  return (typeof lm === 'object' ? lm?.body : lm) || c.body || 'No messages yet';
};
const displayUnread = (c: ApiConversation) => Number(c.unread_count ?? 0);

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await getConversations({ page: 1 });
      const data: any = res.data;
      setConversations(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh whenever the tab regains focus, so a conversation just opened
  // (and its unread count/last message) stays current without a manual pull.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const filteredConversations = conversations.filter((c) =>
    displayName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: ApiConversation }) => {
    const unread = displayUnread(item);
    const avatar = displayAvatar(item);
    return (
      <TouchableOpacity
        style={[styles.conversationCard, { borderBottomColor: themeColors.border }]}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: { id: String(item.id), name: displayName(item), avatar: avatar ?? '' },
          } as any)
        }
      >
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: themeColors.inputBg }]}>
              <Ionicons name="person" size={24} color={themeColors.subText} />
            </View>
          )}
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.topRow}>
            <Text style={[styles.conversationName, { color: themeColors.text }]} numberOfLines={1}>
              {displayName(item)}
            </Text>
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                { color: unread > 0 ? themeColors.text : themeColors.subText },
                unread > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {displayLastMessage(item)}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyConversations = () => (
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

      {isLoading ? (
        <View style={{ padding: 16, gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : hasError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load messages"
          message="Something went wrong. Please check your connection and try again."
          onRetry={load}
        />
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyConversations />
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
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
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
