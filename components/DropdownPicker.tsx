import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: IconName;
  badge?: string;
}

interface DropdownPickerProps {
  label?: string;
  options: (string | DropdownOption)[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  modalTitle?: string;
  style?: object;
}

export function DropdownPicker({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select option',
  modalTitle = 'Select Option',
  style,
}: DropdownPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const currentOption = normalizedOptions.find((o) => o.value === selectedValue);
  const displayLabel = currentOption ? currentOption.label : selectedValue || placeholder;

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Txt variant="labelSm" color="textSecondary" style={styles.label}>
          {label}
        </Txt>
      )}

      {/* Trigger Button */}
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.card,
            borderColor: colors.outlineVariant,
            opacity: pressed ? 0.8 : 1,
          },
          Shadows.sm,
        ]}
      >
        <View style={styles.triggerLeft}>
          {currentOption?.icon && (
            <Icon name={currentOption.icon} size={18} color="primary" />
          )}
          <Txt variant="labelMd" color="text" numberOfLines={1} style={styles.triggerText}>
            {displayLabel}
          </Txt>
        </View>
        <Icon name="expand-more" size={20} color="primary" />
      </Pressable>

      {/* Modal Selection Dialog */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.card, borderColor: colors.outlineVariant },
                  Shadows.md,
                ]}
              >
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
                  <Txt variant="headlineMd" color="text" style={styles.modalTitle}>
                    {modalTitle}
                  </Txt>
                  <Pressable
                    onPress={() => setModalVisible(false)}
                    hitSlop={8}
                    style={styles.closeBtn}
                  >
                    <Icon name="close" size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  </Pressable>
                </View>

                {/* Options List */}
                <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                  {normalizedOptions.map((opt) => {
                    const isSelected = opt.value === selectedValue;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          onSelect(opt.value);
                          setModalVisible(false);
                        }}
                        style={({ pressed }) => [
                          styles.optionItem,
                          {
                            backgroundColor: isSelected ? colors.containerLow : 'transparent',
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <View style={styles.optionLeft}>
                          {opt.icon && (
                            <Icon
                              name={opt.icon}
                              size={18}
                              color={isSelected ? 'primary' : 'outline'}
                            />
                          )}
                          <Txt
                            variant="bodyMd"
                            color={isSelected ? 'primary' : 'text'}
                            style={[styles.optionLabel, isSelected && styles.selectedLabel]}
                          >
                            {opt.label}
                          </Txt>
                        </View>

                        {isSelected && (
                          <Icon name="check" size={18} color="primary" />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: 6, letterSpacing: 0.5 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  triggerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  closeBtn: {
    padding: 4,
  },
  optionsList: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  selectedLabel: {
    fontFamily: 'Inter_700Bold',
  },
});
