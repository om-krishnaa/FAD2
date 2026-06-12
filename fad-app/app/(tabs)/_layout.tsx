import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SavedUser = {
  role?: 'user' | 'admin' | 'super_admin';
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme ?? 'light'];

  const [user, setUser] = useState<SavedUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const savedUser = await SecureStore.getItemAsync('fad_user');

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        }
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, []);

  if (loadingUser) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.tint} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const screenOptions = {
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarActiveTintColor: theme.tint,
    tabBarInactiveTintColor: theme.tabIconDefault,
    tabBarStyle: {
      height: 58 + insets.bottom,
      paddingTop: 6,
      paddingBottom: Math.max(insets.bottom, 8),
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      backgroundColor: theme.background,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '700' as const,
    },
  };

  if (isAdmin) {
    return (
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="house.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="ads"
          options={{
            title: 'Ads',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="megaphone.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="chart.bar.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="doc.text.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="gearshape.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen name="users" options={{ href: null }} />
        <Tabs.Screen name="security" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="creditcard.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen name="ads" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="users" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}