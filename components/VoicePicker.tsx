import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ACCENTS } from '@/lib/constants';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getVoicesForAccent, speakSample, type VoiceOption } from '@/lib/tts';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';

interface VoicePickerProps {
  accent: string;
  /** Chosen voice identifier; empty/undefined = automatic (best installed voice for the accent). */
  voiceId?: string;
  speechRate: number;
  onChange: (next: { accent: string; voiceId?: string }) => void;
}

const MAX_VOICES_SHOWN = 6;

/** "IELTS Accent & Voice" card from the Practice design, plus the installed-voice list. */
export function VoicePicker({ accent, voiceId, speechRate, onChange }: VoicePickerProps) {
  const colors = Colors[useColorScheme()];
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setVoices(await getVoicesForAccent(accent, true));
    setLoading(false);
  }, [accent]);

  useEffect(() => {
    let active = true;
    getVoicesForAccent(accent).then((list) => {
      if (active) {
        setVoices(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [accent]);

  const accentLabel = ACCENTS.find((a) => a.id === accent)?.label ?? accent;
  const noVoices = !loading && voices.length === 0;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="record-voice-over" size={18} color="primary" />
          <Txt variant="labelLg">IELTS Accent & Voice</Txt>
        </View>
        <Pressable
          onPress={() => speakSample(accent, speechRate, voiceId)}
          style={styles.sample}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Icon name="play-circle-outline" size={16} color="primary" />
          <Txt variant="labelMd" color="primary">
            Sample
          </Txt>
        </Pressable>
      </View>

      <View style={styles.accents}>
        {ACCENTS.map((acc) => {
          const selected = accent === acc.id;
          return (
            <Pressable
              key={acc.id}
              onPress={() => onChange({ accent: acc.id, voiceId: undefined })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.accentRow,
                { backgroundColor: selected ? colors.containerLow : colors.background },
                !selected && styles.dim,
              ]}
            >
              <View style={styles.accentLeft}>
                <Icon
                  name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={selected ? 'primary' : 'outline'}
                />
                <View style={styles.accentText}>
                  <Txt variant="labelLg">{acc.label}</Txt>
                  <Txt variant="labelSm" color="textSecondary">
                    {acc.region}
                  </Txt>
                </View>
              </View>
              {acc.official && (
                <View style={[styles.badge, { backgroundColor: colors.background }]}>
                  <Txt variant="labelSm" color="primary">
                    Official
                  </Txt>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.voiceHeader}>
        <Txt variant="labelMd">{accentLabel} voice</Txt>
        <Pressable onPress={refresh} hitSlop={8}>
          <Txt variant="labelMd" color="primary">
            Refresh
          </Txt>
        </Pressable>
      </View>

      {noVoices ? (
        <Txt variant="labelMd" color="textSecondary" style={styles.note}>
          No {accentLabel} voice is installed on this device, so the default voice is used. Install one in your
          device text-to-speech settings, then tap Refresh.
        </Txt>
      ) : (
        <View style={styles.voices}>
          <VoiceRow
            name="Automatic (best available)"
            detail="Highest-quality installed voice"
            selected={!voiceId}
            onPress={() => onChange({ accent, voiceId: undefined })}
          />
          {voices.slice(0, MAX_VOICES_SHOWN).map((v) => (
            <VoiceRow
              key={v.id}
              name={v.name}
              detail={v.enhanced ? 'Enhanced quality' : 'Standard quality'}
              selected={voiceId === v.id}
              onPress={() => onChange({ accent, voiceId: v.id })}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function VoiceRow(props: { name: string; detail: string; selected: boolean; onPress: () => void }) {
  const colors = Colors[useColorScheme()];
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      style={[styles.voiceRow, { backgroundColor: props.selected ? colors.containerLow : colors.background }]}
    >
      <Icon
        name={props.selected ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={18}
        color={props.selected ? 'primary' : 'outline'}
      />
      <View style={styles.accentText}>
        <Txt variant="labelMd" numberOfLines={1}>
          {props.name}
        </Txt>
        <Txt variant="labelSm" color="textSecondary">
          {props.detail}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sample: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accents: { gap: 8, marginTop: 4 },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    minHeight: 56,
  },
  dim: { opacity: 0.85 },
  accentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  accentText: { flex: 1 },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  note: { lineHeight: 18 },
  voices: { gap: 6 },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
