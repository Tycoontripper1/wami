import Colors from '@/constants/Colors';
import {
    ApiMessage,
    getMessages,
    markConversationRead,
    sendMessage as sendMessageApi,
    startConversation,
} from '@/services/api/chatService';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; avatar?: string; recipientId?: string }>();
  const isNewConversation = params.id === 'new';
  const [conversationId, setConversationId] = useState<string | undefined>(
    isNewConversation ? undefined : params.id
  );
  const recipientName = params.name || 'Conversation';
  const recipientAvatar = params.avatar || undefined;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(!isNewConversation);
  const [loadError, setLoadError] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = String(user?.id ?? '');

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
    myBubble: Colors.light.primary,
    theirBubble: isDark ? '#1A1A1A' : '#F0F0F0',
  };

  const load = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await getMessages(conversationId);
      setMessages(Array.isArray(res.data) ? res.data : []);
      markConversationRead(conversationId).catch((error) =>
        console.error('Failed to mark conversation read:', error)
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    if (!conversationId && !params.recipientId) return;

    setInputText('');
    setIsSending(true);
    // Optimistic bubble so the UI feels instant; replaced by the server copy
    // (or removed) once the real request settles.
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, sender_id: currentUserId, body: text, created_at: new Date().toISOString() },
    ]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      if (!conversationId) {
        // First message of a brand new conversation — the collection has no
        // separate "create empty conversation" call, starting one and
        // sending the first message are the same request.
        const res = await startConversation(params.recipientId!, text);
        const newId = String((res.data as any)?.id ?? '');
        if (newId) setConversationId(newId);
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? (res.data as any) ?? m : m)));
      } else {
        const res = await sendMessageApi(conversationId, text);
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.data ?? m : m)));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ApiMessage }) => {
    const isMyMessage = String(item.sender_id ?? '') === currentUserId;
    return (
      <View style={[styles.messageRow, isMyMessage && styles.myMessageRow]}>
        {!isMyMessage && recipientAvatar && (
          <Image source={{ uri: recipientAvatar }} style={styles.messageAvatar} />
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? { backgroundColor: themeColors.myBubble } : { backgroundColor: themeColors.theirBubble },
          ]}
        >
          <Text style={[styles.messageText, { color: isMyMessage ? '#fff' : themeColors.text }]}>
            {item.body}
          </Text>
          {item.created_at && (
            <Text style={[styles.messageTime, { color: isMyMessage ? 'rgba(255,255,255,0.7)' : themeColors.subText }]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        {recipientAvatar ? (
          <Image source={{ uri: recipientAvatar }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, { backgroundColor: themeColors.inputBg, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="person" size={20} color={themeColors.subText} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: themeColors.text }]} numberOfLines={1}>{recipientName}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      ) : loadError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: themeColors.subText, textAlign: 'center', marginBottom: 16 }}>
            Couldn't load this conversation.
          </Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={themeColors.subText} />
              <Text style={{ color: themeColors.subText, marginTop: 12 }}>Say hello 👋</Text>
            </View>
          }
        />
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Platform.OS === 'ios' ? (keyboardHeight > 0 ? 10 : insets.bottom + 10) : insets.bottom + 10,
            marginBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.border,
          },
        ]}
      >
        <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBg }]}>
          <TextInput
            style={[styles.input, { color: themeColors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  retryBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
});
