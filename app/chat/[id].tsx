import Colors from '@/constants/Colors';
import { addBooking, addPayment } from '@/store/paymentSlice';
import { RootState } from '@/store/store';
import { addTransaction, deductFromBalance } from '@/store/walletSlice';
import { Message, calculateEscrow, formatCurrency } from '@/types/payment';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Image,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock conversation data
const MOCK_CREATIVE = {
  id: '1',
  name: 'Paul Studio',
  role: 'Photographer',
  image: require('../../assets/images/onboarding_bg_creative.webp'),
  online: true,
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    conversationId: '1',
    senderId: '1',
    text: 'Hi! I saw your work and I love it. Are you available for a photoshoot next Saturday?',
    type: 'text',
    timestamp: '2024-01-19T10:00:00Z',
    isRead: true,
  },
  {
    id: '2',
    conversationId: '1',
    senderId: 'creative',
    text: 'Hello! Thank you so much! Yes, I\'m available next Saturday. What type of shoot are you looking for?',
    type: 'text',
    timestamp: '2024-01-19T10:05:00Z',
    isRead: true,
  },
  {
    id: '3',
    conversationId: '1',
    senderId: '1',
    text: 'I need a portrait session for my professional profile. About 2 hours.',
    type: 'text',
    timestamp: '2024-01-19T10:10:00Z',
    isRead: true,
  },
  {
    id: '4',
    conversationId: '1',
    senderId: 'creative',
    text: 'Perfect! For a 2-hour portrait session with editing, I can offer you a great package.',
    type: 'text',
    timestamp: '2024-01-19T10:15:00Z',
    isRead: true,
  },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [currentProposal, setCurrentProposal] = useState<Message['priceProposal'] | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'bank_transfer' | 'wallet'>('card');
  const [paymentResult, setPaymentResult] = useState<'processing' | 'success' | 'failed' | null>(null);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const user = useSelector((state: RootState) => state.auth.user);
  const walletBalance = useSelector((state: RootState) => state.wallet?.balances?.NGN ?? 0);
  const currentUserId = user?.id || '1';

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
    myBubble: Colors.light.primary,
    theirBubble: isDark ? '#1A1A1A' : '#F0F0F0',
  };

  const sendMessage = (text: string, type: Message['type'] = 'text', extra?: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId: id as string,
      senderId: currentUserId,
      text,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...extra,
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const handleSendPress = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
    }
  };

  const handleSendPriceProposal = () => {
    const amount = parseFloat(proposedPrice);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    sendMessage(`I'd like to propose ${formatCurrency(amount)} for the portrait session.`, 'price_proposal', {
      priceProposal: {
        amount,
        currency: 'NGN',
        service: 'Portrait Photography Session',
        accepted: undefined,
      },
    });

    setShowPriceModal(false);
    setProposedPrice('');

    // Simulate creative accepting the proposal
    setTimeout(() => {
      const acceptMessage: Message = {
        id: Date.now().toString(),
        conversationId: id as string,
        senderId: 'creative',
        text: `Great! I accept ${formatCurrency(amount)} for the portrait session. You can proceed with payment.`,
        type: 'payment_request',
        priceProposal: {
          amount,
          currency: 'NGN',
          service: 'Portrait Photography Session',
          accepted: true,
        },
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, acceptMessage]);
      setCurrentProposal(acceptMessage.priceProposal!);
    }, 2000);
  };

  const handlePayNow = () => {
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!currentProposal) return;

    // Wallet validation before proceeding
    if (selectedPaymentMethod === 'wallet' && walletBalance < currentProposal.amount) {
      Alert.alert('Insufficient Balance', 'Your wallet balance is too low. Please top up or choose another payment method.');
      return;
    }

    // Close all modals, show processing screen
    setShowPaymentModal(false);
    setShowBankSheet(false);
    setPaymentResult('processing');
    resultScale.setValue(0);
    resultOpacity.setValue(0);

    // Simulate network processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Simulate random failure for demo (90% success rate)
    const succeeded = Math.random() > 0.1;

    if (!succeeded) {
      setPaymentResult('failed');
      Animated.parallel([
        Animated.spring(resultScale, { toValue: 1, useNativeDriver: true, damping: 10 }),
        Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      return;
    }

    const escrow = calculateEscrow(currentProposal.amount, currentProposal.currency);
    const bookingId = `booking_${Date.now()}`;
    const paymentId = `payment_${Date.now()}`;
    setLastBookingId(bookingId);

    // Deduct from wallet if wallet payment
    if (selectedPaymentMethod === 'wallet') {
      dispatch(deductFromBalance({ currency: 'NGN', amount: currentProposal.amount }));
      dispatch(addTransaction({
        id: `txn_${Date.now()}`,
        title: `Service Payment — ${MOCK_CREATIVE.name}`,
        description: currentProposal.service,
        amount: currentProposal.amount,
        currency: 'NGN',
        type: 'debit',
        category: 'booking',
        status: 'success',
        date: new Date().toISOString(),
        reference: paymentId,
        paymentMethod: 'Wami Wallet',
      }));
    }

    // Create booking
    dispatch(addBooking({
      id: bookingId,
      customerId: currentUserId,
      creativeId: MOCK_CREATIVE.id,
      creativeName: MOCK_CREATIVE.name,
      creativeImage: MOCK_CREATIVE.image,
      service: currentProposal.service,
      description: currentProposal.service,
      agreedPrice: currentProposal.amount,
      currency: currentProposal.currency,
      status: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Create payment record
    dispatch(addPayment({
      id: paymentId,
      bookingId,
      customerId: currentUserId,
      creativeId: MOCK_CREATIVE.id,
      amount: currentProposal.amount,
      currency: currentProposal.currency,
      status: 'completed',
      escrow,
      paymentMethod: selectedPaymentMethod === 'card' ? 'Card' : selectedPaymentMethod === 'wallet' ? 'Wami Wallet' : 'Bank Transfer',
      transactionId: `TXN${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Add confirmation message to chat
    const confirmMessage: Message = {
      id: Date.now().toString(),
      conversationId: id as string,
      senderId: 'system',
      text: `Payment of ${formatCurrency(currentProposal.amount)} successful! 🎉\n\n${MOCK_CREATIVE.name} has received ${formatCurrency(escrow.creativeInitialPayment)} (70%).\n\n${formatCurrency(escrow.heldAmount)} (30%) is held in escrow until service completion.`,
      type: 'payment_confirmation',
      paymentInfo: { bookingId, amount: currentProposal.amount, status: 'completed' },
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, confirmMessage]);
    setCurrentProposal(null);

    // Show success screen
    setPaymentResult('success');
    Animated.parallel([
      Animated.spring(resultScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 100 }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const dismissResult = () => {
    setPaymentResult(null);
    resultScale.setValue(0);
    resultOpacity.setValue(0);
  };


  const renderMessage = ({ item }: { item: Message }) => {

    const isMyMessage = item.senderId === currentUserId;
    const isSystem = item.senderId === 'system';

    if (isSystem || item.type === 'payment_confirmation') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={[styles.systemMessage, { backgroundColor: 'rgba(0,217,255,0.1)' }]}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />
            <Text style={[styles.systemMessageText, { color: themeColors.text }]}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    }

    if (item.type === 'payment_request' && item.priceProposal?.accepted) {
      return (
        <View style={styles.paymentRequestContainer}>
          <View style={[styles.messageBubble, { backgroundColor: themeColors.theirBubble }]}>
            <Text style={[styles.messageText, { color: themeColors.text }]}>{item.text}</Text>
          </View>
          <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
            <Ionicons name="wallet" size={20} color="#fff" />
            <Text style={styles.payButtonText}>Pay {formatCurrency(item.priceProposal.amount)}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMyMessage && styles.myMessageRow]}>
        {!isMyMessage && (
          <Image source={MOCK_CREATIVE.image} style={styles.messageAvatar} />
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? { backgroundColor: themeColors.myBubble }
              : { backgroundColor: themeColors.theirBubble },
          ]}
        >
          <Text style={[styles.messageText, { color: isMyMessage ? '#fff' : themeColors.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, { color: isMyMessage ? 'rgba(255,255,255,0.7)' : themeColors.subText }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
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
        <Image source={MOCK_CREATIVE.image} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: themeColors.text }]}>{MOCK_CREATIVE.name}</Text>
          <Text style={[styles.headerStatus, { color: MOCK_CREATIVE.online ? '#4CD964' : themeColors.subText }]}>
            {MOCK_CREATIVE.online ? 'Online' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="call-outline" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Area */}
      <View style={[
        styles.inputContainer, 
        { 
          paddingBottom: Platform.OS === 'ios' 
            ? (keyboardHeight > 0 ? 10 : insets.bottom + 10)
            : insets.bottom + 10,
          marginBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
          backgroundColor: themeColors.background, 
          borderTopColor: themeColors.border 
        }
      ]}>
        <TouchableOpacity style={styles.attachButton} onPress={() => setShowPriceModal(true)}>
          <Ionicons name="cash-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
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
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendPress}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Price Proposal Modal */}
      <Modal visible={showPriceModal} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => { Keyboard.dismiss(); setShowPriceModal(false); }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent, 
              { 
                backgroundColor: themeColors.background,
                marginBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
              }
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Propose a Price</Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.subText }]}>
              Enter the amount you'd like to pay for this service
            </Text>
            <View style={[styles.priceInputContainer, { backgroundColor: themeColors.inputBg }]}>
              <Text style={[styles.currencySymbol, { color: themeColors.text }]}>₦</Text>
              <TextInput
                style={[styles.priceInput, { color: themeColors.text }]}
                placeholder="0"
                placeholderTextColor={themeColors.subText}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleSendPriceProposal}>
                <Text style={styles.confirmButtonText}>Send Proposal</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.paymentModalContent, { backgroundColor: themeColors.background }]}>
            {/* Header */}
            <View style={styles.paymentHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {currentProposal && (
              <>
                {/* Service Summary */}
                <View style={[styles.serviceSummary, { backgroundColor: themeColors.inputBg }]}>
                  <Image source={MOCK_CREATIVE.image} style={styles.serviceImage} />
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: themeColors.text }]}>{MOCK_CREATIVE.name}</Text>
                    <Text style={[styles.serviceType, { color: themeColors.subText }]}>{currentProposal.service}</Text>
                  </View>
                  <Text style={[styles.escrowValue, { color: Colors.light.primary }]}>
                    {formatCurrency(currentProposal.amount)}
                  </Text>
                </View>

                {/* Payment Method Selector */}
                <Text style={[styles.escrowTitle, { color: themeColors.text, marginBottom: 8 }]}>Pay with</Text>
                <View style={styles.methodRow}>
                  {[
                    { key: 'card', icon: 'card', label: 'Card' },
                    { key: 'bank_transfer', icon: 'swap-horizontal', label: 'Transfer' },
                    { key: 'wallet', icon: 'wallet', label: 'Wallet' },
                  ].map((m) => {
                    const sel = selectedPaymentMethod === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.methodChip, sel && { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, { borderColor: themeColors.border, backgroundColor: sel ? Colors.light.primary : themeColors.inputBg }]}
                        onPress={() => setSelectedPaymentMethod(m.key as any)}
                      >
                        <Ionicons name={m.icon as any} size={16} color={sel ? '#fff' : themeColors.subText} />
                        <Text style={[styles.methodChipText, { color: sel ? '#fff' : themeColors.text }]}>{m.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedPaymentMethod === 'wallet' && (
                  <Text style={[styles.escrowNote, { color: walletBalance >= currentProposal.amount ? '#4CD964' : '#FF3B30', marginBottom: 12 }]}>
                    Wallet balance: {formatCurrency(walletBalance)}
                    {walletBalance < currentProposal.amount ? ' — Insufficient' : ' — Sufficient ✓'}
                  </Text>
                )}

                {selectedPaymentMethod === 'bank_transfer' && (
                  <View style={[styles.bankInfoBox, { backgroundColor: themeColors.inputBg }]}>
                    <Text style={[styles.bankInfoRow, { color: themeColors.subText }]}>Bank: <Text style={{ color: themeColors.text, fontWeight: '700' }}>GT Bank</Text></Text>
                    <Text style={[styles.bankInfoRow, { color: themeColors.subText }]}>Account: <Text style={{ color: themeColors.text, fontWeight: '700' }}>0123456789</Text></Text>
                    <Text style={[styles.bankInfoRow, { color: themeColors.subText }]}>Name: <Text style={{ color: themeColors.text, fontWeight: '700' }}>Wami Technologies Ltd</Text></Text>
                    <Text style={[styles.bankInfoRow, { color: Colors.light.primary, fontWeight: '800', fontSize: 16, marginTop: 6 }]}>Transfer: {formatCurrency(currentProposal.amount)}</Text>
                  </View>
                )}

                {/* Escrow Breakdown */}
                <View style={styles.escrowSection}>
                  <Text style={[styles.escrowTitle, { color: themeColors.text }]}>Payment Breakdown</Text>

                  <View style={styles.escrowRow}>
                    <Text style={[styles.escrowLabel, { color: themeColors.subText }]}>Total Amount</Text>
                    <Text style={[styles.escrowValue, { color: themeColors.text }]}>{formatCurrency(currentProposal.amount)}</Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

                  <View style={styles.escrowRow}>
                    <View style={styles.escrowLabelRow}>
                      <Ionicons name="flash" size={16} color="#4CD964" />
                      <Text style={[styles.escrowLabel, { color: themeColors.subText }]}>Instant Payment (70%)</Text>
                    </View>
                    <Text style={[styles.escrowValue, { color: '#4CD964' }]}>{formatCurrency(currentProposal.amount * 0.7)}</Text>
                  </View>
                  <Text style={[styles.escrowNote, { color: themeColors.subText }]}>Released to {MOCK_CREATIVE.name} immediately</Text>

                  <View style={styles.escrowRow}>
                    <View style={styles.escrowLabelRow}>
                      <Ionicons name="shield-checkmark" size={16} color={Colors.light.primary} />
                      <Text style={[styles.escrowLabel, { color: themeColors.subText }]}>Escrow (30%)</Text>
                    </View>
                    <Text style={[styles.escrowValue, { color: Colors.light.primary }]}>{formatCurrency(currentProposal.amount * 0.3)}</Text>
                  </View>
                  <Text style={[styles.escrowNote, { color: themeColors.subText }]}>Released after service completion</Text>
                </View>

                {/* Pay Button */}
                <TouchableOpacity
                  style={[styles.payNowButton, isProcessingPayment && styles.payNowButtonDisabled]}
                  onPress={() => {
                    if (selectedPaymentMethod === 'bank_transfer') {
                      setShowPaymentModal(false);
                      setShowBankSheet(true);
                    } else if (selectedPaymentMethod === 'wallet' && walletBalance < (currentProposal?.amount ?? 0)) {
                      Alert.alert('Insufficient Balance', 'Please top up your wallet or choose another payment method.');
                    } else {
                      processPayment();
                    }
                  }}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <Text style={styles.payNowButtonText}>Processing...</Text>
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={20} color="#fff" />
                      <Text style={styles.payNowButtonText}>Pay {formatCurrency(currentProposal.amount)}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.secureText, { color: themeColors.subText }]}>
                  🔒 Secured by Wami Escrow Protection
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Bank Transfer Sheet */}
      <Modal visible={showBankSheet} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.paymentModalContent, { backgroundColor: themeColors.background }]}>
            <View style={styles.paymentHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Bank Transfer</Text>
              <TouchableOpacity onPress={() => setShowBankSheet(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.escrowNote, { color: themeColors.subText, marginBottom: 16 }]}>
              Transfer exactly the amount below to complete your service payment
            </Text>
            <View style={[styles.bankInfoBox, { backgroundColor: themeColors.inputBg }]}>
              <Text style={[styles.bankInfoRow, { color: themeColors.subText }]}>Bank: <Text style={{ color: themeColors.text, fontWeight: '700' }}>GT Bank</Text></Text>
              <Text style={[styles.bankInfoRow, { color: themeColors.subText }]}>Account: <Text style={{ color: themeColors.text, fontWeight: '700' }}>0123456789</Text></Text>
              <Text style={[styles.bankInfoRow, { color: themeColors.subText }]}>Name: <Text style={{ color: themeColors.text, fontWeight: '700' }}>Wami Technologies Ltd</Text></Text>
              {currentProposal && (
                <Text style={[styles.bankInfoRow, { color: Colors.light.primary, fontWeight: '800', fontSize: 18, marginTop: 8 }]}>
                  {formatCurrency(currentProposal.amount)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => { setShowBankSheet(false); processPayment(); }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.payNowButtonText}>I've Transferred — Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Payment Result Overlay ─── */}
      <Modal visible={paymentResult !== null} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          {paymentResult === 'processing' && (
            <View style={styles.resultCard}>
              <View style={styles.processingRing}>
                <Ionicons name="card" size={48} color={Colors.light.primary} />
              </View>
              <Text style={styles.resultTitle}>Processing Payment</Text>
              <Text style={styles.resultSub}>Please wait while we secure your payment…</Text>
              <View style={styles.processingDots}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.3 }]} />
                ))}
              </View>
            </View>
          )}

          {paymentResult === 'success' && (
            <Animated.View style={[styles.resultCard, { opacity: resultOpacity, transform: [{ scale: resultScale }] }]}>
              <Ionicons name="checkmark-circle" size={80} color="#4CD964" />
              <Text style={styles.resultTitle}>Payment Successful!</Text>
              <Text style={styles.resultSub}>
                Your service has been booked and the payment is secured in escrow.
              </Text>
              <View style={[styles.resultInfoBox, { backgroundColor: 'rgba(76,217,100,0.1)' }]}>
                <Text style={styles.resultInfoLabel}>Method used</Text>
                <Text style={styles.resultInfoValue}>
                  {selectedPaymentMethod === 'card' ? '💳 Card' : selectedPaymentMethod === 'wallet' ? '👛 Wami Wallet' : '🏦 Bank Transfer'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.resultPrimaryBtn} 
                onPress={() => {
                  dismissResult();
                  if (lastBookingId) {
                    router.push(`/service-tracking/${lastBookingId}` as any);
                  }
                }}
              >
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.resultPrimaryBtnText}>Track My Service</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultSecondaryBtn} onPress={dismissResult}>
                <Text style={styles.resultSecondaryBtnText}>Back to Chat</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {paymentResult === 'failed' && (
            <Animated.View style={[styles.resultCard, { opacity: resultOpacity, transform: [{ scale: resultScale }] }]}>
              <Ionicons name="close-circle" size={80} color="#FF3B30" />
              <Text style={styles.resultTitle}>Payment Failed</Text>
              <Text style={styles.resultSub}>
                We couldn't process your payment. Please try again or use a different payment method.
              </Text>
              <TouchableOpacity
                style={styles.resultPrimaryBtn}
                onPress={() => { dismissResult(); setShowPaymentModal(true); }}
              >
                <Text style={styles.resultPrimaryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultSecondaryBtn} onPress={dismissResult}>
                <Text style={styles.resultSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Modal>
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
  headerStatus: {
    fontSize: 12,
  },
  headerButton: {
    padding: 8,
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
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    maxWidth: '90%',
  },
  systemMessageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  paymentRequestContainer: {
    marginBottom: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  attachButton: {
    padding: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  serviceImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  serviceInfo: {
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceType: {
    fontSize: 13,
  },
  escrowSection: {
    marginBottom: 24,
  },
  escrowTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  escrowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  escrowLabel: {
    fontSize: 14,
  },
  escrowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  escrowNote: {
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 24,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    marginBottom: 16,
  },
  payNowButtonDisabled: {
    opacity: 0.7,
  },
  payNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secureText: {
    fontSize: 12,
    textAlign: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  methodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  methodChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bankInfoBox: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 20,
  },
  bankInfoRow: {
    fontSize: 14,
    lineHeight: 22,
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  processingRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  resultSub: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  processingDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  resultInfoBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  resultInfoLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  resultInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  resultPrimaryBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  resultPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultSecondaryBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  resultSecondaryBtnText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '500',
  },
});

