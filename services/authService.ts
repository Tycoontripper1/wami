import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/store/authSlice';

const STORAGE_KEYS = {
  USER: '@wami_user',
  TOKEN: '@wami_token',
  DONT_SHOW_SUCCESS: '@wami_dont_show_success',
};

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user database (in real app, this would be your backend)
const mockUsers: { [email: string]: any } = {};

export const authService = {
  // Sign In
  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(1500); // Simulate network delay

    // Check if user exists in mock database
    const userData = mockUsers[email.toLowerCase()];
    
    if (!userData) {
      throw new Error('User not found. Please sign up first.');
    }

    if (userData.password !== password) {
      throw new Error('Invalid password. Please try again.');
    }

    // Generate mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Remove password from user object
    const { password: _, ...user } = userData;

    // Store in AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return { user, token };
  },

  // Sign Up
  async signUp(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<{ user: User; token: string }> {
    await delay(1500); // Simulate network delay

    // Check if user already exists
    if (mockUsers[data.email.toLowerCase()]) {
      throw new Error('An account with this email already exists.');
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
    };

    // Store user with password in mock database
    mockUsers[data.email.toLowerCase()] = {
      ...newUser,
      password: data.password,
    };

    // Generate mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

    return { user: newUser, token };
  },

  // Verify Email Code (mock)
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    await delay(1000);
    // In real app, verify with backend
    // For now, accept any 6-digit code
    return code.length === 6;
  },

  // Sign Out
  async signOut(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
  },

  // Restore Session
  async restoreSession(): Promise<{ user: User; token: string } | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      if (userJson && token) {
        const user = JSON.parse(userJson);
        return { user, token };
      }

      return null;
    } catch (error) {
      console.error('Error restoring session:', error);
      return null;
    }
  },

  // Get Don't Show Success preference
  async getDontShowSuccess(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.DONT_SHOW_SUCCESS);
      return value === 'true';
    } catch {
      return false;
    }
  },

  // Set Don't Show Success preference
  async setDontShowSuccess(value: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DONT_SHOW_SUCCESS, value.toString());
  },

  // Update User Profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await delay(1000);
    
    // In real app, update backend
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      const user = JSON.parse(userJson);
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      return updatedUser;
    }
    
    throw new Error('User not found');
  },

  // Connect Instagram (mock)
  async connectInstagram(userId: string): Promise<void> {
    await delay(1500);
    // In real app, handle Instagram OAuth
    console.log('Instagram connected for user:', userId);
  },

  // Forgot Password
  async forgotPassword(email: string): Promise<void> {
    await delay(1500);
    // Check if user exists (optional, depending on security requirements)
    if (!mockUsers[email.toLowerCase()]) {
       // Often APIs don't reveal if a user exists, but we'll throw for the mock
       throw new Error('No account found with this email.');
    }
    // In real app, send email with code
    console.log(`Reset code sent to ${email}`);
  },

  // Reset Password
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await delay(2000);
    
    // Validate code (mock: accept any 4-digit code)
    if (code.length !== 4) {
      throw new Error('Invalid verification code.');
    }

    const userData = mockUsers[email.toLowerCase()];
    if (!userData) {
      throw new Error('User not found.');
    }

    // Update password
    mockUsers[email.toLowerCase()] = {
      ...userData,
      password: newPassword,
    };
  },
};
