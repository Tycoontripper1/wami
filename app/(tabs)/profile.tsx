import Colors from '@/constants/Colors';
import { profileService } from '@/services/api/profileService';
import { signOut, updateUser } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const user = useSelector((state: RootState) => state.auth.user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);



  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsRefreshing(true);
      const response = await profileService.getProfile();
      if (response.success && response.data) {
        dispatch(updateUser(response.data));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleLogout = () => {
    dispatch(signOut());
    router.replace('/(auth)/sign-in');
  };

  const menuItems = [
    { icon: 'person', label: 'Edit Profile', route: '/edit-profile' },
    { icon: 'wallet', label: 'Wallet', route: '/(tabs)/wallet' },
    { icon: 'basket', label: 'My Products', route: '/my-products' },
    { icon: 'calendar', label: 'Manage Availability', route: '/creative-dashboard' },
    { icon: 'card', label: 'Payment Methods', route: '/payment-methods' },
    { icon: 'bookmark', label: 'Saved', route: '/favourites' },
    { icon: 'time', label: 'Booking History', route: '/booking-history' },
    { icon: 'bag', label: 'My Orders', route: '/orders' },
    { icon: 'notifications', label: 'Notifications', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
    { icon: 'location', label: 'Location Services', toggle: true, value: locationEnabled, onToggle: setLocationEnabled },
    { icon: 'shield-checkmark', label: 'Privacy & Security', route: '/privacy' },
    { icon: 'help-circle', label: 'Help & Support', route: '/support' },
    { icon: 'information-circle', label: 'About', route: '/about' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Profile</Text>
          <TouchableOpacity>
            <Ionicons name="settings" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: themeColors.cardBg }]} onPress={() => router.push('/edit-profile')}>
          <View style={styles.avatarContainer}>
            {(user?.profile_image || user?.avatar) ? (
              <Image source={{ uri: user?.profile_image || user?.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={themeColors.subText} />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={() => router.push('/edit-profile')}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: themeColors.text }]}>
              {user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name}` : 'Guest User')}
            </Text>
            <Text style={[styles.userEmail, { color: themeColors.subText }]}>
              {user?.email || 'guest@wami.com'}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={themeColors.subText} />
              <Text style={[styles.userLocation, { color: themeColors.subText }]}>
                {user?.location?.city ? `${user.location.city}, ${user.location.country}` : 'Nigeria'}
              </Text>
            </View>
            {user?.username && (
              <Text style={[styles.userHandle, { color: Colors.light.primary }]}>
                @{user.username}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.subText} />
        </TouchableOpacity>

        {/* Bio Section (New) */}
        {user?.bio && (
          <View style={[styles.bioSection, { backgroundColor: themeColors.cardBg }]}>
            <Text style={[styles.bioText, { color: themeColors.text }]}>{user.bio}</Text>
          </View>
        )}

        {/* Categories Section (New) */}
        {user?.categories && user.categories.length > 0 && (
          <View style={styles.categoriesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {user.categories.map((cat: any) => (
                <View key={cat.id} style={[styles.categoryBadge, { backgroundColor: Colors.light.primary + '20' }]}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryName, { color: Colors.light.primary }]}>{cat.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Become a Creative Banner */}
        <TouchableOpacity
          style={styles.becomeCreativeCard}
          onPress={() => router.push('/(auth)/creative-categories' as any)}
        >
          <View style={styles.becomeCreativeContent}>
            <View style={styles.becomeCreativeIcon}>
              <Ionicons name="sparkles" size={24} color="#fff" />
            </View>
            <View style={styles.becomeCreativeText}>
              <Text style={styles.becomeCreativeTitle}>Become a Creative</Text>
              <Text style={styles.becomeCreativeSubtitle}>
                Showcase your work and get discovered
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Loyalty Rewards Card */}
        <TouchableOpacity
          style={[styles.loyaltyCard, { backgroundColor: themeColors.cardBg }]}
          onPress={() => router.push('/rewards' as any)}
        >
          <View style={styles.loyaltyHeader}>
            <View style={styles.loyaltyBadge}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
            </View>
            <View style={styles.loyaltyInfo}>
              <Text style={[styles.loyaltyTitle, { color: themeColors.text }]}>Wami Rewards</Text>
              <Text style={[styles.loyaltyTier, { color: Colors.light.primary }]}>Bronze Member</Text>
            </View>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsValue, { color: themeColors.text }]}>50</Text>
            <Text style={[styles.pointsLabel, { color: themeColors.subText }]}>points</Text>
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: themeColors.cardBg }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.text }]}>12</Text>
            <Text style={[styles.statLabel, { color: themeColors.subText }]}>Bookings</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.text }]}>8</Text>
            <Text style={[styles.statLabel, { color: themeColors.subText }]}>Favourites</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.text }]}>24</Text>
            <Text style={[styles.statLabel, { color: themeColors.subText }]}>Reviews</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { backgroundColor: themeColors.cardBg }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomColor: themeColors.border, borderBottomWidth: 1 },
              ]}
              onPress={() => item.route && router.push(item.route as any)}
              disabled={item.toggle}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={22} color={themeColors.subText} />
                <Text style={[styles.menuLabel, { color: themeColors.text }]}>{item.label}</Text>
              </View>
              {item.toggle ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: themeColors.border, true: Colors.light.primary }}
                  thumbColor="#fff"
                />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={themeColors.subText} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.versionText, { color: themeColors.subText }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 13,
  },
  bioSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesScroll: {
    gap: 10,
    paddingRight: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuContainer: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
  becomeCreativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: Colors.light.primary,
  },
  becomeCreativeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  becomeCreativeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  becomeCreativeText: {
    marginLeft: 12,
    flex: 1,
  },
  becomeCreativeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  becomeCreativeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  loyaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loyaltyBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyInfo: {
    gap: 2,
  },
  loyaltyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loyaltyTier: {
    fontSize: 13,
    fontWeight: '600',
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 12,
  },
});
