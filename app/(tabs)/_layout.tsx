// import { useColorScheme } from '@/components/useColorScheme';
// import { Ionicons } from '@expo/vector-icons';
// import { Tabs } from 'expo-router';
// import React from 'react';
// import { StyleSheet, View } from 'react-native';

// export default function TabLayout() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: '#ffff', // Bright cyan/teal for active icon
//         tabBarInactiveTintColor: '#94A3B8', // Muted gray-slate for inactive
//         tabBarShowLabel: false, // No text labels - pure icon bar
//         tabBarStyle: {
//           // Floating pill exactly like the image
//           position: 'absolute',
//           bottom: 20,
//           left: 16,
//           right: 16,
//           height: 70,
//           borderRadius: 40,
//           backgroundColor: isDark ? '#1A1A1A' : '#E0F7FA', // Soft teal/cyan tint
//           borderTopWidth: 0,
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           paddingHorizontal: 4,
//         },
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color, focused }) => (
//             <View style={focused ? styles.activeTabIndicator : null}>
//               <Ionicons 
//                 name={focused ? 'home' : 'home-outline'} 
//                 size={26} 
//                 color={color} 
//               />
//             </View>
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="discover"
//         options={{
//           title: 'Discover',
//           tabBarIcon: ({ color, focused }) => (
//             <View style={focused ? styles.activeTabIndicator : null}>
//               <Ionicons 
//                 name={focused ? 'search' : 'search-outline'} 
//                 size={21} 
//                 color={color} 
//               />
//             </View>
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="sell"
//         options={{
//           title: 'Sell',
//           tabBarIcon: ({ color, focused }) => (
//             <View style={focused ? styles.activeTabIndicator : null}>
//               <Ionicons 
//                 name={focused ? 'add-circle' : 'add-circle-outline'} 
//                 size={21} 
//                 color={color} 
//               />
//             </View>
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="messages"
//         options={{
//           title: 'Messages',
//           tabBarIcon: ({ color, focused }) => (
//             <View style={focused ? styles.activeTabIndicator : null}>
//               <Ionicons 
//                 name={focused ? 'chatbubble' : 'chatbubble-outline'} 
//                 size={21} 
//                 color={color} 
//               />
//             </View>
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: 'Profile',
//           tabBarIcon: ({ color, focused }) => (
//             <View style={focused ? styles.activeTabIndicator : null}>
//               <Ionicons 
//                 name={focused ? 'person' : 'person-outline'} 
//                 size={21} 
//                 color={color} 
//               />
//             </View>
//           ),
//         }}
//       />
//       <Tabs.Screen name="wallet" options={{ href: null }} />
//       <Tabs.Screen name="two" options={{ href: null }} />
//     </Tabs>
//   );
// }

// const styles = StyleSheet.create({
//   activeTabIndicator: {
//     // Subtle background like in the image (very light teal circle)
//     backgroundColor: '#00BCD4', // 20% opacity teal
//     padding: 8,
//     paddingHorizontal: 16,
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POST_OPTIONS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'service', label: 'Add a Service', icon: 'briefcase-outline', route: '/add-service' },
  { key: 'product', label: 'List a Product', icon: 'pricetag-outline', route: '/(tabs)/sell' },
  { key: 'post', label: 'Share a Post', icon: 'image-outline', route: '/share-post' },
];

function PostOptionsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSelect = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[
            modalStyles.sheet,
            { backgroundColor: isDark ? '#1C1C1E' : '#fff', paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={modalStyles.handle} />
          <Text style={[modalStyles.title, { color: isDark ? '#fff' : '#000' }]}>What would you like to post?</Text>
          {POST_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[modalStyles.option, { borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
              onPress={() => handleSelect(opt.route)}
            >
              <View style={[modalStyles.optionIcon, { backgroundColor: Colors.light.primary + '20' }]}>
                <Ionicons name={opt.icon} size={22} color={Colors.light.primary} />
              </View>
              <Text style={[modalStyles.optionLabel, { color: isDark ? '#fff' : '#000' }]}>{opt.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#8E8E93' : '#6B7280'} />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#8E8E93', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  optionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
});

type TabIconProps = {
  focused: boolean;
  iconFocused: keyof typeof Ionicons.glyphMap;
  iconUnfocused: keyof typeof Ionicons.glyphMap;
  label: string;
};

function TabItem({ focused, iconFocused, iconUnfocused, label }: TabIconProps) {
  return (
    <View style={styles.tabItemWrapper}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? iconFocused : iconUnfocused}
          size={22}
          color={focused ? '#FFFFFF' : '#ffffff'}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPostModal, setShowPostModal] = useState(false);

  return (
    <>
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 16,
          height: 72,
          borderRadius: 50,
          backgroundColor: isDark ? '#1C3A39' : Colors.light.primaryLight,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#00BFA5',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: 8,
          
        },
        tabBarItemStyle: {
          height: 72,
          paddingVertical: 0,
          flex: 1,
          minWidth: 0,
        
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              focused={focused}
              iconFocused="home"
              iconUnfocused="home-outline"
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              focused={focused}
              iconFocused="bag"
              iconUnfocused="bag-outline"
              label="Shop"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              focused={focused}
              iconFocused="add-circle"
              iconUnfocused="add-circle-outline"
              label="Post"
            />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            setShowPostModal(true);
          },
        })}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              focused={focused}
              iconFocused="chatbubble-ellipses"
              iconUnfocused="chatbubble-ellipses-outline"
              label="Chats"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              focused={focused}
              iconFocused="person"
              iconUnfocused="person-outline"
              label="Profile"
            />
          ),
        }}
      />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
    <PostOptionsModal visible={showPostModal} onClose={() => setShowPostModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',

    gap: 3,
    paddingTop: 4,
    width: '100%',
    // backgroundColor: '#000000',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 0,
    top: 15,
  
  },
  iconWrap: {
    width: 40,
    height: 34,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.light.primary,
    width: 48,
    height: 36,
    borderRadius: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffff',
    letterSpacing: 0,
    textAlign: 'center',
    flexShrink: 1,
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    zIndex: 500,
    paddingBottom: 0,
  
  },
  labelActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
});