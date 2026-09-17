import SalesChart, { SalesChartPoint } from '@/components/analytics/SalesChart';
import Colors from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocationData';
import { getSellerTransactions, getSellerWallet, SellerTransaction } from '@/services/api/sellerService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Maps the seller-wallet transaction shape (unconfirmed field names — the
// collection has no example response for GET /v1/seller/transactions) onto
// the display shape this screen already renders.
const mapSellerTransaction = (t: SellerTransaction, index: number): Transaction => ({
  id: String(t.id ?? index),
  title: t.description ?? t.title ?? t.type ?? 'Transaction',
  amount: Number(t.amount ?? 0),
  type: (t.type === 'debit' || t.amount < 0) ? 'debit' : 'credit',
  category: t.category ?? t.type ?? 'other',
  date: t.created_at ?? t.date ?? '',
  status: (t.status as Transaction['status']) ?? 'success',
});

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { formatPrice, region, currencySymbol } = useLocation();

  // State
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Modals
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTab, setHistoryTab] = useState<'transactions' | 'analytics'>('transactions');
  const [showTxnDetailModal, setShowTxnDetailModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  
  // Form states
  const [fundAmount, setFundAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isNigeria = region?.code === 'NG' || region?.name === 'Nigeria';

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadWallet = useCallback(async () => {
    setIsLoadingWallet(true);
    try {
      const [walletRes, txnsRes] = await Promise.all([
        getSellerWallet(),
        getSellerTransactions({ page: 1 }),
      ]);
      setBalance(Number((walletRes.data as any)?.balance ?? 0));
      const txnData: any = txnsRes.data;
      const items: SellerTransaction[] = Array.isArray(txnData) ? txnData : txnData?.items ?? [];
      setTransactions(items.map(mapSellerTransaction));
    } catch (error) {
      console.error('Failed to load seller wallet:', error);
    } finally {
      setIsLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const themeColors = {
    background: isDark ? '#0A0A0A' : '#F5F7FA',
    text: isDark ? '#fff' : '#1A1A2E',
    subText: isDark ? '#888' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    border: isDark ? '#2A2A2A' : '#E8ECF0',
  };

  const filteredTransactions = transactions.filter((t) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Credit') return t.type === 'credit';
    if (selectedFilter === 'Debit') return t.type === 'debit';
    if (selectedFilter === 'Pending') return t.status === 'pending';
    return true;
  });

  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  // Real net cash flow per day, derived from the real transactions already
  // loaded above — no separate analytics call needed for this small preview
  // (the full breakdown lives at /seller-analytics).
  const dailyNetSeries = useMemo<SalesChartPoint[]>(() => {
    const byDay = new Map<string, number>();
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = isNaN(d.getTime()) ? t.date : d.toISOString().split('T')[0];
      const signed = t.type === 'credit' ? t.amount : -t.amount;
      byDay.set(key, (byDay.get(key) ?? 0) + signed);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([key, value]) => {
        const d = new Date(key);
        return {
          label: isNaN(d.getTime()) ? key : d.toLocaleDateString('en-NG', { weekday: 'short' }),
          value,
        };
      });
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const byCategory = new Map<string, number>();
    transactions.filter(t => t.type === 'debit').forEach((t) => {
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    });
    return Array.from(byCategory.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [transactions]);

  const presetAmounts = isNigeria ? [1000, 5000, 10000, 20000, 50000, 100000] : [10, 25, 50, 100, 250, 500];

  // Handlers
  //
  // Neither "add funds" (wallet top-up) nor a peer-to-peer "transfer" has any
  // matching endpoint anywhere in the WAMI Postman collection — only the
  // seller wallet balance/transactions and payout-requests are documented
  // (see docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §2.3/§3.9). Faking a
  // credit/debit here would make the screen lie about money that never
  // actually moved, so both are left honestly unavailable until backend
  // confirms a real contract, instead of manufacturing a fake transaction.
  const handleAddFunds = () => {
    setShowAddFundsModal(false);
    setFundAmount('');
    setSelectedPaymentMethod(null);
    Alert.alert('Not Available Yet', "Adding funds isn't supported by the backend yet. Please check back soon.");
  };

  const handleTransfer = () => {
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferRecipient('');
    Alert.alert('Not Available Yet', "Wallet-to-wallet transfers aren't supported by the backend yet. Please check back soon.");
  };

  const openTxnDetail = (txn: Transaction) => {
    setSelectedTxn(txn);
    setShowTxnDetailModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: themeColors.subText }]}>Welcome back 👋</Text>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>My Wallet</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: themeColors.cardBg }]} onPress={() => router.push('/seller-analytics' as any)}>
              <Ionicons name="stats-chart-outline" size={20} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: themeColors.cardBg }]} onPress={() => router.push('/notifications' as any)}>
              <Ionicons name="notifications-outline" size={22} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['#00BCD4', '#0097A7', '#00838F'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.cardChip}>
                  <Ionicons name="wallet" size={18} color="#fff" />
                </View>
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowBalance(!showBalance)}>
                  <Ionicons name={showBalance ? 'eye' : 'eye-off'} size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{showBalance ? formatPrice(balance) : '••••••••'}</Text>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowAddFundsModal(true)}>
                  <View style={styles.quickActionIcon}><Ionicons name="add" size={22} color="#00BCD4" /></View>
                  <Text style={styles.quickActionText}>Add Money</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/wallet/withdraw')}>
                  <View style={styles.quickActionIcon}><Ionicons name="arrow-up" size={22} color="#00BCD4" /></View>
                  <Text style={styles.quickActionText}>Withdraw</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowTransferModal(true)}>
                  <View style={styles.quickActionIcon}><Ionicons name="swap-horizontal" size={22} color="#00BCD4" /></View>
                  <Text style={styles.quickActionText}>Transfer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowHistoryModal(true)}>
                  <View style={styles.quickActionIcon}><Ionicons name="time" size={22} color="#00BCD4" /></View>
                  <Text style={styles.quickActionText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>



        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Transactions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', 'Credit', 'Debit', 'Pending'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, { backgroundColor: selectedFilter === filter ? Colors.light.primary : themeColors.cardBg, borderColor: selectedFilter === filter ? Colors.light.primary : themeColors.border }]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterText, { color: selectedFilter === filter ? '#fff' : themeColors.text }]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsList}>
          {isLoadingWallet && <ActivityIndicator color={Colors.light.primary} style={{ marginVertical: 20 }} />}
          {!isLoadingWallet && filteredTransactions.length === 0 && (
            <Text style={[styles.emptyText, { color: themeColors.subText, textAlign: 'center', marginTop: 20 }]}>No transactions yet</Text>
          )}
          {filteredTransactions.slice(0, 5).map((txn) => (
            <TouchableOpacity key={txn.id} style={[styles.txnItem, { backgroundColor: themeColors.cardBg }]} onPress={() => openTxnDetail(txn)}>
              <View style={[styles.txnIconBg, { backgroundColor: txn.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }]}>
                <Ionicons name={txn.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={20} color={txn.type === 'credit' ? '#4CAF50' : '#F44336'} />
              </View>
              <View style={styles.txnDetails}>
                <Text style={[styles.txnTitle, { color: themeColors.text }]}>{txn.title}</Text>
                <Text style={[styles.txnDate, { color: themeColors.subText }]}>{txn.date}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? '#4CAF50' : themeColors.text }]}>
                  {txn.type === 'credit' ? '+' : '-'}{formatPrice(txn.amount)}
                </Text>
                <View style={[styles.txnStatus, { backgroundColor: txn.status === 'success' ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Text style={[styles.txnStatusText, { color: txn.status === 'success' ? '#4CAF50' : '#FF9800' }]}>{txn.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {transactions.length > 5 && (
            <TouchableOpacity style={[styles.viewAllBtn, { backgroundColor: themeColors.cardBg }]} onPress={() => setShowHistoryModal(true)}>
              <Text style={[styles.viewAllText, { color: Colors.light.primary }]}>View All Transactions</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ADD FUNDS MODAL */}
      <Modal visible={showAddFundsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddFundsModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setShowAddFundsModal(false)}><Ionicons name="close" size={28} color={themeColors.text} /></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Add Funds</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.amountSection}>
              <Text style={[styles.amountLabel, { color: themeColors.subText }]}>Enter Amount</Text>
              <View style={[styles.amountInputBox, { backgroundColor: themeColors.cardBg }]}>
                <Text style={[styles.currencyPrefix, { color: themeColors.text }]}>{currencySymbol}</Text>
                <TextInput style={[styles.amountInput, { color: themeColors.text }]} value={fundAmount} onChangeText={setFundAmount} placeholder="0.00" placeholderTextColor={themeColors.subText} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.presetsSection}>
              <Text style={[styles.presetsLabel, { color: themeColors.subText }]}>Quick Select</Text>
              <View style={styles.presetsGrid}>
                {presetAmounts.map((amount) => (
                  <TouchableOpacity key={amount} style={[styles.presetBtn, { backgroundColor: fundAmount === amount.toString() ? Colors.light.primary : themeColors.cardBg }]} onPress={() => setFundAmount(amount.toString())}>
                    <Text style={[styles.presetText, { color: fundAmount === amount.toString() ? '#fff' : themeColors.text }]}>{currencySymbol}{amount.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.paymentSection}>
              <Text style={[styles.paymentLabel, { color: themeColors.subText }]}>Payment Method</Text>
              {isNigeria ? (
                <>
                  <TouchableOpacity style={[styles.paymentOption, { backgroundColor: themeColors.cardBg }]} onPress={() => setSelectedPaymentMethod('bank')}>
                    <View style={[styles.paymentIconBg, { backgroundColor: '#E8F5E9' }]}><Ionicons name="business" size={24} color="#4CAF50" /></View>
                    <View style={styles.paymentInfo}><Text style={[styles.paymentTitle, { color: themeColors.text }]}>Bank Transfer</Text><Text style={[styles.paymentDesc, { color: themeColors.subText }]}>Transfer from Nigerian bank</Text></View>
                    {selectedPaymentMethod === 'bank' && <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.paymentOption, { backgroundColor: themeColors.cardBg }]} onPress={() => setSelectedPaymentMethod('paystack')}>
                    <View style={[styles.paymentIconBg, { backgroundColor: '#E3F2FD' }]}><Ionicons name="card" size={24} color="#2196F3" /></View>
                    <View style={styles.paymentInfo}><Text style={[styles.paymentTitle, { color: themeColors.text }]}>Debit Card (Paystack)</Text><Text style={[styles.paymentDesc, { color: themeColors.subText }]}>Visa, Mastercard, Verve</Text></View>
                    {selectedPaymentMethod === 'paystack' && <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.paymentOption, { backgroundColor: themeColors.cardBg }]} onPress={() => setSelectedPaymentMethod('stripe')}>
                  <View style={[styles.paymentIconBg, { backgroundColor: '#EDE7F6' }]}><Ionicons name="card" size={24} color="#673AB7" /></View>
                  <View style={styles.paymentInfo}><Text style={[styles.paymentTitle, { color: themeColors.text }]}>Credit/Debit Card (Stripe)</Text><Text style={[styles.paymentDesc, { color: themeColors.subText }]}>Pay securely</Text></View>
                  {selectedPaymentMethod === 'stripe' && <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />}
                </TouchableOpacity>
              )}
            </View>
            {isNigeria && selectedPaymentMethod === 'bank' && (
              <View style={[styles.bankDetails, { backgroundColor: themeColors.cardBg }]}>
                <Text style={[styles.bankDetailsTitle, { color: themeColors.text }]}>Transfer to:</Text>
                <View style={styles.bankRow}><Text style={[styles.bankLabel, { color: themeColors.subText }]}>Bank:</Text><Text style={[styles.bankValue, { color: themeColors.text }]}>Wema Bank</Text></View>
                <View style={styles.bankRow}><Text style={[styles.bankLabel, { color: themeColors.subText }]}>Account:</Text><Text style={[styles.bankValue, { color: themeColors.text }]}>0123456789</Text></View>
                <View style={styles.bankRow}><Text style={[styles.bankLabel, { color: themeColors.subText }]}>Name:</Text><Text style={[styles.bankValue, { color: themeColors.text }]}>Wami/Your Name</Text></View>
                <Text style={[styles.bankNote, { color: Colors.light.primary }]}>ⓘ Auto-credited when received</Text>
              </View>
            )}
          </ScrollView>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: fundAmount && selectedPaymentMethod ? Colors.light.primary : themeColors.border }]} onPress={handleAddFunds} disabled={!fundAmount || !selectedPaymentMethod}>
              <Text style={styles.confirmBtnText}>{selectedPaymentMethod === 'bank' ? "I've Sent the Money" : 'Add Funds'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal visible={showTransferModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTransferModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}><Ionicons name="close" size={28} color={themeColors.text} /></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Transfer</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={[styles.balancePreview, { backgroundColor: themeColors.cardBg }]}>
              <Text style={[styles.balancePreviewLabel, { color: themeColors.subText }]}>Available Balance</Text>
              <Text style={[styles.balancePreviewAmount, { color: themeColors.text }]}>{formatPrice(balance)}</Text>
            </View>
            <View style={styles.amountSection}>
              <Text style={[styles.amountLabel, { color: themeColors.subText }]}>Recipient Username/Email</Text>
              <View style={[styles.amountInputBox, { backgroundColor: themeColors.cardBg }]}>
                <Ionicons name="person-outline" size={20} color={themeColors.subText} style={{ marginRight: 10 }} />
                <TextInput style={[styles.amountInput, { color: themeColors.text, fontSize: 16 }]} value={transferRecipient} onChangeText={setTransferRecipient} placeholder="Enter username or email" placeholderTextColor={themeColors.subText} />
              </View>
            </View>
            <View style={styles.amountSection}>
              <Text style={[styles.amountLabel, { color: themeColors.subText }]}>Amount</Text>
              <View style={[styles.amountInputBox, { backgroundColor: themeColors.cardBg }]}>
                <Text style={[styles.currencyPrefix, { color: themeColors.text }]}>{currencySymbol}</Text>
                <TextInput style={[styles.amountInput, { color: themeColors.text }]} value={transferAmount} onChangeText={setTransferAmount} placeholder="0.00" placeholderTextColor={themeColors.subText} keyboardType="numeric" />
              </View>
            </View>
          </ScrollView>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: transferAmount && transferRecipient && parseFloat(transferAmount) <= balance ? Colors.light.primary : themeColors.border }]} onPress={handleTransfer} disabled={!transferAmount || !transferRecipient || parseFloat(transferAmount) > balance}>
              <Text style={styles.confirmBtnText}>Send Money</Text>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal visible={showHistoryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHistoryModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)}><Ionicons name="close" size={28} color={themeColors.text} /></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Transaction History</Text>
            <View style={{ width: 28 }} />
          </View>
      
<View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, historyTab === 'transactions' && styles.tabBtnActive, { borderBottomColor: historyTab === 'transactions' ? Colors.light.primary : 'transparent' }]}
                onPress={() => setHistoryTab('transactions')}
              >
                <Text style={[styles.tabText, { color: historyTab === 'transactions' ? Colors.light.primary : themeColors.subText }]}>Transactions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, historyTab === 'analytics' && styles.tabBtnActive, { borderBottomColor: historyTab === 'analytics' ? Colors.light.primary : 'transparent' }]}
                onPress={() => setHistoryTab('analytics')}
              >
                <Text style={[styles.tabText, { color: historyTab === 'analytics' ? Colors.light.primary : themeColors.subText }]}>Analytics</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {historyTab === 'transactions' ? (
                <View style={{ flex: 1, paddingBottom: 20 }}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={themeColors.subText} />
                    <TextInput
                      style={[styles.searchInput, { color: themeColors.text }]}
                      placeholder="Search transactions..."
                      placeholderTextColor={themeColors.subText}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <View style={{ gap: 20 }}>
                     {/* Grouping Logic Inline for Simplicity since we have mock data */}
                     {(() => {
                        const filtered = transactions.filter(t => 
                          t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                           return (
                             <View style={styles.emptyState}>
                               <View style={[styles.emptyIconBg, { backgroundColor: themeColors.cardBg }]}>
                                 <Ionicons name="document-text-outline" size={40} color={themeColors.subText} />
                               </View>
                               <Text style={[styles.emptyText, { color: themeColors.subText }]}>No transactions found</Text>
                             </View>
                           );
                        }

                        // Simple grouping by distinct date strings from the mock data
                        const groups: { [key: string]: Transaction[] } = {};
                        filtered.forEach(txn => {
                           const groupName = txn.date.includes('Today') ? 'Today' : 
                                             txn.date.includes('Yesterday') ? 'Yesterday' : 
                                             'Older';
                           if (!groups[groupName]) groups[groupName] = [];
                           groups[groupName].push(txn);
                        });

                        return ['Today', 'Yesterday', 'Older'].map(group => {
                           if (!groups[group] || groups[group].length === 0) return null;
                           return (
                              <View key={group}>
                                 <Text style={[styles.groupTitle, { color: themeColors.subText }]}>{group}</Text>
                                 <View style={[styles.groupList, { backgroundColor: themeColors.cardBg }]}>
                                    {groups[group].map((txn, index) => (
                                       <TouchableOpacity 
                                          key={txn.id} 
                                          style={[
                                             styles.historyItem, 
                                             { marginBottom: 8, borderRadius: 12 }
                                          ]} 
                                          onPress={() => openTxnDetail(txn)}
                                       >
                                          <View style={[
                                             styles.historyIcon, 
                                             { backgroundColor: txn.type === 'credit' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 82, 82, 0.1)' }
                                          ]}>
                                             <Ionicons 
                                                name={
                                                   txn.category === 'topup' ? 'wallet' :
                                                   txn.category === 'booking' ? 'calendar' :
                                                   txn.category === 'withdrawal' ? 'cash' : 
                                                   txn.type === 'credit' ? 'arrow-down' : 'arrow-up'
                                                } 
                                                size={20} 
                                                color={txn.type === 'credit' ? '#4CAF50' : '#FF5252'} 
                                             />
                                          </View>
                                          <View style={styles.historyDetails}>
                                             <Text style={[styles.historyTitle, { color: themeColors.text }]}>{txn.title}</Text>
                                             <Text style={[styles.historySub, { color: themeColors.subText }]}>{txn.date} • {txn.status}</Text>
                                          </View>
                                          <Text style={[styles.historyAmount, { color: txn.type === 'credit' ? '#4CAF50' : themeColors.text }]}>
                                             {txn.type === 'credit' ? '+' : '-'}{formatPrice(txn.amount)}
                                          </Text>
                                       </TouchableOpacity>
                                    ))}
                                 </View>
                              </View>
                           );
                        });
                     })()}
                  </View>
                </View>
              ) : (
                <View style={{ paddingBottom: 40 }}>
                  <View style={styles.graphCard}>
                    <Text style={[styles.graphTitle, { color: themeColors.text }]}>Net Cash Flow</Text>
                    <SalesChart data={dailyNetSeries} formatValue={(v) => `${v >= 0 ? '+' : ''}${formatPrice(v)}`} />
                  </View>

                  <TouchableOpacity
                    style={[styles.viewFullAnalyticsBtn, { backgroundColor: themeColors.cardBg }]}
                    onPress={() => { setShowHistoryModal(false); router.push('/seller-analytics' as any); }}
                  >
                    <Ionicons name="stats-chart" size={18} color={Colors.light.primary} />
                    <Text style={[styles.viewFullAnalyticsText, { color: Colors.light.primary }]}>View Full Sales Analytics</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
                  </TouchableOpacity>

                  <View style={styles.statsRow}>
                     <View style={[styles.insightCard, { backgroundColor: themeColors.cardBg }]}>
                      <LinearGradient colors={['#4CAF50', '#66BB6A'] as const} style={styles.insightIconBg}>
                        <Ionicons name="arrow-down" size={18} color="#fff" />
                      </LinearGradient>
                      <View style={styles.insightInfo}>
                        <Text style={[styles.insightLabel, { color: themeColors.subText }]}>Income</Text>
                        <Text style={[styles.insightAmount, { color: themeColors.text }]}>{formatPrice(totalIncome)}</Text>
                      </View>
                    </View>
                    <View style={[styles.insightCard, { backgroundColor: themeColors.cardBg }]}>
                      <LinearGradient colors={['#FF5252', '#FF7961'] as const} style={styles.insightIconBg}>
                        <Ionicons name="arrow-up" size={18} color="#fff" />
                      </LinearGradient>
                      <View style={styles.insightInfo}>
                        <Text style={[styles.insightLabel, { color: themeColors.subText }]}>Spent</Text>
                        <Text style={[styles.insightAmount, { color: themeColors.text }]}>{formatPrice(totalExpenses)}</Text>
                      </View>
                    </View>
                  </View>

                   <View style={[styles.breakdownCard, { backgroundColor: themeColors.cardBg }]}>
                      <Text style={[styles.breakdownTitle, { color: themeColors.text }]}>Top Categories</Text>
                      {categoryBreakdown.length === 0 ? (
                        <Text style={{ color: themeColors.subText, fontSize: 13 }}>No spending yet</Text>
                      ) : (
                        categoryBreakdown.map(([category, amount]) => (
                          <View key={category} style={styles.categoryItem}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <View style={[styles.catIcon, { backgroundColor: Colors.light.primary + '20' }]}>
                                <Ionicons name="pricetag" size={18} color={Colors.light.primary} />
                              </View>
                              <Text style={[styles.catName, { color: themeColors.text, textTransform: 'capitalize' }]}>{category}</Text>
                            </View>
                            <Text style={[styles.catAmount, { color: themeColors.text }]}>- {formatPrice(amount)}</Text>
                          </View>
                        ))
                      )}
                   </View>
                </View>
              )}
            </ScrollView>
        </View>

        
      </Modal>

      {/* TRANSACTION DETAIL MODAL */}
      <Modal visible={showTxnDetailModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTxnDetailModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setShowTxnDetailModal(false)}><Ionicons name="close" size={28} color={themeColors.text} /></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Transaction Details</Text>
            <View style={{ width: 28 }} />
          </View>
          {selectedTxn && (
            <View style={styles.txnDetailContent}>
              <View style={[styles.txnDetailIcon, { backgroundColor: selectedTxn.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }]}>
                <Ionicons name={selectedTxn.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={40} color={selectedTxn.type === 'credit' ? '#4CAF50' : '#F44336'} />
              </View>
              <Text style={[styles.txnDetailAmount, { color: selectedTxn.type === 'credit' ? '#4CAF50' : themeColors.text }]}>
                {selectedTxn.type === 'credit' ? '+' : '-'}{formatPrice(selectedTxn.amount)}
              </Text>
              <Text style={[styles.txnDetailTitle, { color: themeColors.text }]}>{selectedTxn.title}</Text>
              <View style={[styles.txnDetailCard, { backgroundColor: themeColors.cardBg }]}>
                <View style={styles.txnDetailRow}><Text style={[styles.txnDetailLabel, { color: themeColors.subText }]}>Status</Text><Text style={[styles.txnDetailValue, { color: selectedTxn.status === 'success' ? '#4CAF50' : '#FF9800' }]}>{selectedTxn.status}</Text></View>
                <View style={styles.txnDetailRow}><Text style={[styles.txnDetailLabel, { color: themeColors.subText }]}>Date</Text><Text style={[styles.txnDetailValue, { color: themeColors.text }]}>{selectedTxn.date}</Text></View>
                <View style={styles.txnDetailRow}><Text style={[styles.txnDetailLabel, { color: themeColors.subText }]}>Category</Text><Text style={[styles.txnDetailValue, { color: themeColors.text }]}>{selectedTxn.category}</Text></View>
                <View style={styles.txnDetailRow}><Text style={[styles.txnDetailLabel, { color: themeColors.subText }]}>Reference</Text><Text style={[styles.txnDetailValue, { color: themeColors.text }]}>{selectedTxn.id}</Text></View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  cardWrapper: { marginBottom: 20 },
  balanceCard: { borderRadius: 24, overflow: 'hidden', minHeight: 220 },
  decorCircle1: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle2: { position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)' },
  decorCircle3: { position: 'absolute', top: 60, right: 60, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardContent: { padding: 24, flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardChip: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  eyeBtn: { padding: 8 },
  balanceSection: { marginBottom: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 6 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickActionBtn: { alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  quickActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  insightsSection: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  insightCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, gap: 10 },
  insightIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightInfo: { flex: 1 },
  insightLabel: { fontSize: 12, marginBottom: 2 },
  insightAmount: { fontSize: 16, fontWeight: '700' },
  insightBadge: { fontSize: 11, fontWeight: '700', color: '#4CAF50', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  filterSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 13, fontWeight: '600' },
  transactionsList: { gap: 10 },
  txnItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, gap: 12 },
  txnIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txnDetails: { flex: 1 },
  txnTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  txnDate: { fontSize: 12 },
  txnRight: { alignItems: 'flex-end', gap: 4 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
  txnStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  txnStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 6, marginTop: 10, backgroundColor: 'rgba(0,0,0,0.03)' },
  viewAllText: { fontSize: 14, fontWeight: '600' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalContent: { flex: 1, padding: 20 },
  modalFooter: { padding: 20 },
  balancePreview: { padding: 20, borderRadius: 24, marginBottom: 24, alignItems: 'center' },
  balancePreviewLabel: { fontSize: 14, marginBottom: 6, opacity: 0.7 },
  balancePreviewAmount: { fontSize: 32, fontWeight: '800' },
  amountSection: { marginBottom: 24 },
  amountLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  amountInputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 20, height: 70 },
  currencyPrefix: { fontSize: 28, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '700' },
  presetsSection: { marginBottom: 24 },
  presetsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetBtn: { width: (width - 60) / 3, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  presetText: { fontSize: 15, fontWeight: '700' },
  paymentSection: { marginBottom: 24 },
  paymentLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 10, gap: 14 },
  paymentIconBg: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  paymentDesc: { fontSize: 13, opacity: 0.7 },
  bankDetails: { padding: 20, borderRadius: 20, marginTop: 20 },
  bankDetailsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bankLabel: { fontSize: 14, opacity: 0.7 },
  bankValue: { fontSize: 15, fontWeight: '600' },
  bankNote: { fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  txnDetailContent: { flex: 1, alignItems: 'center', padding: 24 },
  txnDetailIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  txnDetailAmount: { fontSize: 40, fontWeight: '800', marginBottom: 10 },
  txnDetailTitle: { fontSize: 20, fontWeight: '700', marginBottom: 30, textAlign: 'center' },
  txnDetailCard: { width: '100%', padding: 24, borderRadius: 24 },
  txnDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  txnDetailLabel: { fontSize: 15, opacity: 0.7 },
  txnDetailValue: { fontSize: 15, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', marginHorizontal: 4, borderRadius: 12 },
  tabBtnActive: { },
  tabText: { fontSize: 15, fontWeight: '600' },
  graphCard: { marginBottom: 16, padding: 10 },
  graphTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: 6 },
  viewFullAnalyticsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginBottom: 20 },
  viewFullAnalyticsText: { fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  breakdownCard: { padding: 20, borderRadius: 24 },
  breakdownTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '600' },
  catAmount: { fontSize: 15, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500' },
  groupTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
  groupList: { borderRadius: 24, overflow: 'hidden' },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, marginBottom: 0 },
  historyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  historyDetails: { flex: 1 },
  historyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  historySub: { fontSize: 13, opacity: 0.7 },
  historyAmount: { fontSize: 17, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 16 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
