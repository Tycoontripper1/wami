import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Currency = 'USD' | 'NGN' | 'GBP' | 'EUR';

export interface Transaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: Currency;
  type: 'credit' | 'debit';
  category: 'topup' | 'booking' | 'withdrawal' | 'refund' | 'transfer';
  status: 'success' | 'pending' | 'failed';
  date: string;
  reference?: string;
  paymentMethod?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // Visa, Mastercard, Verve
  bankName?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
}

interface WalletState {
  balances: {
    [key in Currency]: number;
  };
  primaryCurrency: Currency;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  insights: {
    income: number;
    expenses: number;
    savings: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balances: {
    USD: 1250.0,
    NGN: 0,
    GBP: 0,
    EUR: 0,
  },
  primaryCurrency: 'USD',
  transactions: [
    {
      id: '1',
      title: 'Top Up',
      amount: 50,
      currency: 'USD',
      type: 'credit',
      category: 'topup',
      status: 'success',
      date: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Booking - Paul Studio',
      amount: 150,
      currency: 'USD',
      type: 'debit',
      category: 'booking',
      status: 'success',
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      title: 'Withdrawal',
      amount: 200,
      currency: 'USD',
      type: 'debit',
      category: 'withdrawal',
      status: 'pending',
      date: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ],
  paymentMethods: [],
  insights: {
    income: 550,
    expenses: 350,
    savings: 200,
  },
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Balance Management
    updateBalance: (state, action: PayloadAction<{ currency: Currency; amount: number }>) => {
      state.balances[action.payload.currency] = action.payload.amount;
    },
    addToBalance: (state, action: PayloadAction<{ currency: Currency; amount: number }>) => {
      state.balances[action.payload.currency] += action.payload.amount;
    },
    deductFromBalance: (state, action: PayloadAction<{ currency: Currency; amount: number }>) => {
      state.balances[action.payload.currency] -= action.payload.amount;
    },
    setPrimaryCurrency: (state, action: PayloadAction<Currency>) => {
      state.primaryCurrency = action.payload;
    },

    // Transaction Management
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      // Update balance
      if (action.payload.type === 'credit') {
        state.balances[action.payload.currency] += action.payload.amount;
      } else {
        state.balances[action.payload.currency] -= action.payload.amount;
      }
      // Update insights
      if (action.payload.type === 'credit') {
        state.insights.income += action.payload.amount;
      } else {
        state.insights.expenses += action.payload.amount;
      }
    },
    updateTransactionStatus: (
      state,
      action: PayloadAction<{ id: string; status: Transaction['status'] }>
    ) => {
      const transaction = state.transactions.find((t) => t.id === action.payload.id);
      if (transaction) {
        transaction.status = action.payload.status;
      }
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },

    // Payment Methods
    addPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter((pm) => pm.id !== action.payload);
    },
    setDefaultPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === action.payload,
      }));
    },

    // Insights
    updateInsights: (
      state,
      action: PayloadAction<{ income?: number; expenses?: number; savings?: number }>
    ) => {
      if (action.payload.income !== undefined) state.insights.income = action.payload.income;
      if (action.payload.expenses !== undefined) state.insights.expenses = action.payload.expenses;
      if (action.payload.savings !== undefined) state.insights.savings = action.payload.savings;
    },

    // Loading States
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  updateBalance,
  addToBalance,
  deductFromBalance,
  setPrimaryCurrency,
  addTransaction,
  updateTransactionStatus,
  setTransactions,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  updateInsights,
  setLoading,
  setError,
} = walletSlice.actions;

export default walletSlice.reducer;
