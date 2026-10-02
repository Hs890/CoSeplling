import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ErrorModal } from '@/components/ErrorModal';
import { Icon, type IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Txt } from '@/components/Txt';
import { Colors } from '@/constants/theme';
import { clearAllData, clearAllHistory, deleteSessionsSince } from '@/db/queries/history';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteApiKey } from '@/lib/secureKey';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

type Row = { days: number; label: string; iconName: IconName; subtitle: string };

const DELETE_ROWS: Row[] = [
  { days: 0, iconName: 'today', label: "Today's history", subtitle: 'Sessions started today' },
  { days: 7, iconName: 'date-range', label: 'Last 7 days', subtitle: 'Sessions from this week' },
  { days: 30, iconName: 'calendar-month', label: 'Last 30 days', subtitle: 'Sessions from this month' },
  { days: 90, iconName: 'folder-delete', label: 'Last 90 days', subtitle: 'Sessions from last 3 months' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme()];

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    iconName?: IconName;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    iconName?: IconName;
  } | null>(null);

  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    title: string;
    message?: string;
  } | null>(null);

  const handleDeleteRange = (days: number, label: string) => {
    setConfirmModal({
      visible: true,
      title: `Delete ${label}?`,
      iconName: 'delete',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const count = await deleteSessionsSince(days);
          setConfirmModal(null);
          setSuccessModal({
            visible: true,
            title: count > 0 ? `${count} session${count === 1 ? '' : 's'} deleted` : 'No sessions found',
          });
        } catch {
          setConfirmModal(null);
          setErrorModal({
            visible: true,
            title: 'Deletion Failed',
          });
        }
      },
    });
  };

  const handleClearAllHistory = () => {
    setConfirmModal({
      visible: true,
      title: 'Delete All History?',
      iconName: 'delete-sweep',
      confirmLabel: 'Delete All',
      onConfirm: async () => {
        try {
          await clearAllHistory();
          setConfirmModal(null);
          setSuccessModal({
            visible: true,
            title: 'History Erased',
          });
        } catch {
          setConfirmModal(null);
          setErrorModal({
            visible: true,
            title: 'Clear Failed',
          });
        }
      },
    });
  };

  const handleFactoryReset = () => {
    setConfirmModal({
      visible: true,
      title: 'Reset All App Data?',
      message: 'This will erase all settings, keys, and session history.',
      iconName: 'restart-alt',
      confirmLabel: 'Reset Everything',
      onConfirm: async () => {
        try {
          await clearAllData();
          await deleteApiKey();
          setConfirmModal(null);
          setSuccessModal({
            visible: true,
            title: 'App Reset Complete',
          });
        } catch {
          setConfirmModal(null);
          setErrorModal({
            visible: true,
            title: 'Reset Failed',
          });
        }
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Data & Privacy" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delete by time range */}
        <Txt variant="labelSm" color="textSecondary" style={styles.sectionLabel}>
          DELETE BY TIME RANGE
        </Txt>
        <Card style={styles.listCard}>
          {DELETE_ROWS.map((row, i) => (
            <Pressable
              key={row.days}
              onPress={() => handleDeleteRange(row.days, row.label)}
              style={({ pressed }) => [
                styles.row,
                {
                  borderBottomWidth: i < DELETE_ROWS.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.outlineVariant,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: colors.containerLow }]}>
                <Icon name={row.iconName} size={20} color="primary" />
              </View>
              <View style={styles.rowBody}>
                <Txt variant="labelLg" color="text">
                  {row.label}
                </Txt>
                <Txt variant="labelSm" color="textSecondary">
                  {row.subtitle}
                </Txt>
              </View>
              <Icon name="chevron-right" size={20} color="primary" />
            </Pressable>
          ))}
        </Card>

        {/* Delete all history */}
        <Txt variant="labelSm" color="textSecondary" style={styles.sectionLabel}>
          BULK ACTIONS
        </Txt>
        <Card style={styles.card}>
          <Pressable
            onPress={handleClearAllHistory}
            style={({ pressed }) => [
              styles.bigRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="delete-sweep" size={22} color="primary" />
            </View>
            <View style={styles.rowBody}>
              <Txt variant="labelLg" color="text">
                Delete all session history
              </Txt>
              <Txt variant="labelSm" color="textSecondary">
                Remove every session & word list. Settings kept.
              </Txt>
            </View>
            <Icon name="chevron-right" size={20} color="primary" />
          </Pressable>
        </Card>

        {/* Factory reset */}
        <Txt variant="labelSm" color="primary" style={styles.sectionLabel}>
          DANGER ZONE
        </Txt>
        <Card style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.containerLow }]}>
          <View style={styles.dangerHead}>
            <Icon name="warning-amber" size={22} color="primary" />
            <Txt variant="labelLg" color="text" style={{ fontWeight: '700' }}>
              Factory app reset
            </Txt>
          </View>
          <Txt variant="bodyMd" color="textSecondary" style={{ marginTop: 4 }}>
            Wipes all sessions, word lists, practice settings, and your OpenRouter API key.
          </Txt>
          <PrimaryButton
            label="Clear All App Data"
            icon="delete-forever"
            onPress={handleFactoryReset}
            style={{ marginTop: 14 }}
          />
        </Card>
      </ScrollView>

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          visible={confirmModal.visible}
          title={confirmModal.title}
          message={confirmModal.message}
          iconName={confirmModal.iconName}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Error Modal */}
      {errorModal && (
        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          iconName={errorModal.iconName || 'error-outline'}
          onClose={() => setErrorModal(null)}
        />
      )}

      {/* Success Modal */}
      {successModal && (
        <ErrorModal
          visible={successModal.visible}
          title={successModal.title}
          message={successModal.message}
          iconName="check-circle"
          actionLabel="Done"
          onClose={() => setSuccessModal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 48, gap: 4 },
  sectionLabel: {
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 2,
  },
  listCard: { borderRadius: 16, overflow: 'hidden', padding: 0 },
  card: { padding: 14, borderRadius: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  bigRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dangerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
