import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { Icon } from '@/components/Icon';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.outlineVariant,
            marginBottom: bottomPad,
            shadowColor: '#000000',
          },
        ],
        tabBarBackground: () => (
          <View style={[styles.tabBarBg, { backgroundColor: colors.card }]} />
        ),
      }}
    >
      {/* 1. LEFT: Words (history) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Words',
          tabBarIcon: ({ color }) => (
            <Icon name="checklist" size={16} color={color} />
          ),
        }}
      />

      {/* 2. LEFT-MID: Again */}
      <Tabs.Screen
        name="again"
        options={{
          title: 'Again',
          tabBarIcon: ({ color }) => (
            <Icon name="refresh" size={16} color={color} />
          ),
        }}
      />

      {/* 3. CENTRE: Prominent Dashboard (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.prominentCenterBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.card,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Icon
                name="home"
                size={22}
                color="#FFFFFF"
              />
            </View>
          ),
        }}
      />

      {/* 4. RIGHT-MID: Practice */}
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => (
            <Icon name="tune" size={16} color={color} />
          ),
        }}
      />

      {/* 5. RIGHT: Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name="settings" size={16} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    overflow: 'visible',
  },
  tabBarBg: {
    flex: 1,
    borderRadius: 30,
  },
  tabBarLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  prominentCenterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
    elevation: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
});
