import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme, useThemePreference, type ThemePreference } from '@/hooks/use-color-scheme';
import { getApiKey } from '@/lib/secureKey';

const THEME_OPTIONS: { label: string; value: ThemePreference; icon: IconName }[] = [
  { label: 'Dark', value: 'dark', icon: 'dark-mode' },
  { label: 'Light', value: 'light', icon: 'light-mode' },
  { label: 'System', value: 'system', icon: 'settings-suggest' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const [themePref, setThemePref] = useThemePreference();
  const [hasApiKey, setHasApiKey] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getApiKey()
        .then((k) => setHasApiKey(Boolean(k?.trim())))
        .catch(() => setHasApiKey(false));
    }, [])
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── THEME SWITCHER ─────────────────────────────────────────── */}
        <Txt variant="labelSm" color="textSecondary" style={styles.sectionLabel}>
          APPEARANCE & THEME
        </Txt>
        <Card style={styles.card}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themePref === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setThemePref(opt.value)}
                  style={({ pressed }) => [
                    styles.themeBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.containerLow,
                      borderColor: isSelected ? colors.primary : colors.outlineVariant,
                      opacity: pressed ? 0.8 : 1,
                    },
                    isSelected ? Shadows.sm : undefined,
                  ]}
                >
                  <Icon
                    name={opt.icon}
                    size={18}
                    color={isSelected ? '#FFFFFF' : colors.text}
                  />
                  <Txt
                    variant="labelMd"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                  >
                    {opt.label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* ── AI ENGINE NAVIGATION CARD ──────────────────────────────── */}
        <Txt variant="labelSm" color="textSecondary" style={styles.sectionLabel}>
          AI CONFIGURATION
        </Txt>
        <Card style={styles.card}>
          <Pressable
            onPress={() => router.push('/settings/ai-engine')}
            style={({ pressed }) => [
              styles.navRow,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.navIconWrap, { backgroundColor: colors.containerLow }]}>
              <Icon name="psychology" size={22} color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.navTitleRow}>
                <Txt variant="labelMd" color="text">
                  AI Audio Engine
                </Txt>
                <View style={[styles.badge, { backgroundColor: hasApiKey ? colors.primary : colors.containerLow }]}>
                  <Txt variant="labelSm" style={{ fontSize: 10, fontWeight: '700', color: hasApiKey ? '#FFFFFF' : colors.textSecondary }}>
                    {hasApiKey ? 'Active' : 'Offline'}
                  </Txt>
                </View>
              </View>
              <Txt variant="labelSm" color="textSecondary">
                OpenRouter API key & LLM model configuration
              </Txt>
            </View>
            <Icon name="chevron-right" size={20} color="primary" />
          </Pressable>
        </Card>

        {/* ── ABOUT & GUIDE ─────────────────────────────────────────── */}
        <Txt variant="labelSm" color="textSecondary" style={styles.sectionLabel}>
          GUIDE & HELP
        </Txt>
        <Card style={styles.card}>
          <Pressable
            onPress={() => router.push('/onboarding')}
            style={({ pressed }) => [
              styles.navRow,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.navIconWrap, { backgroundColor: colors.containerLow }]}>
              <Icon name="auto-awesome" size={20} color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="labelMd" color="text">
                Welcome Tour & API Guide
              </Txt>
              <Txt variant="labelSm" color="textSecondary">
                View features breakdown and OpenRouter setup instructions
              </Txt>
            </View>
            <Icon name="chevron-right" size={20} color="primary" />
          </Pressable>
        </Card>

        {/* ── PRIVACY & DATA ─────────────────────────────────────────── */}
        <Txt variant="labelSm" color="textSecondary" style={styles.sectionLabel}>
          DATA & STORAGE
        </Txt>
        <Card style={styles.card}>
          <Pressable
            onPress={() => router.push('/settings/privacy')}
            style={({ pressed }) => [
              styles.navRow,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.navIconWrap, { backgroundColor: colors.containerLow }]}>
              <Icon name="security" size={20} color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="labelMd" color="text">
                Session Data & Privacy
              </Txt>
              <Txt variant="labelSm" color="textSecondary">
                Export session history, clear database or reset app
              </Txt>
            </View>
            <Icon name="chevron-right" size={20} color="primary" />
          </Pressable>
        </Card>

        {/* ── FOOTER: POWERED BY 9TSOLUTIONS ──────────────────────────── */}
        <View style={styles.footer}>
          <View style={[styles.footerBadge, { borderColor: colors.outlineVariant, backgroundColor: colors.containerLow }]}>
            <Icon name="verified" size={14} color="primary" />
            <Txt variant="labelSm" style={styles.footerText}>
              Powered by <Txt variant="labelSm" style={{ color: colors.primary, fontWeight: '700' }}>9tsolutions</Txt>
            </Txt>
          </View>
          <Txt variant="labelSm" color="textSecondary" style={styles.versionText}>
            Trigger App v1.0.0
          </Txt>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120, gap: 4 },
  sectionLabel: {
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 2,
  },
  card: { padding: 14, borderRadius: 16, marginBottom: 4 },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
  versionText: {
    fontSize: 11,
    opacity: 0.6,
  },
});
