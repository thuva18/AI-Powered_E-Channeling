// components/DatePickerInput.jsx
// Reusable themed date picker — works on iOS (modal spinner) & Android (native dialog)

import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

/**
 * DatePickerInput
 * @param {string}   label       - Field label displayed above the input
 * @param {string}   value       - Current date string in YYYY-MM-DD format
 * @param {function} onChange    - Callback: (dateString: string) => void
 * @param {string}   placeholder - Placeholder text when no date is selected
 * @param {Date}     minimumDate - Earliest selectable date (default: none)
 * @param {Date}     maximumDate - Latest selectable date (default: none)
 * @param {string}   accentColor - Hex color for the active state highlight
 * @param {object}   style       - Extra container style overrides
 */
export default function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  accentColor,
  style,
}) {
  const { C, S, isDark } = useTheme();
  const accent = accentColor || C.primary;

  // Internal Date object — keeps picker in sync with string value
  const [dateObj, setDateObj] = useState(() => {
    if (value) {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return minimumDate ? new Date(Math.max(new Date(), minimumDate)) : new Date();
  });
  const [showPicker, setShowPicker] = useState(false);

  const applyDate = (event, selected) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected || event?.type === 'dismissed') return;
    setDateObj(selected);
    const y = selected.getFullYear();
    const m = String(selected.getMonth() + 1).padStart(2, '0');
    const d = String(selected.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  };

  const displayText = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : placeholder;

  return (
    <View style={style}>
      {!!label && (
        <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
      )}

      {/* Tappable field */}
      <TouchableOpacity
        style={[
          styles.field,
          { backgroundColor: C.inputBgAlt, borderColor: value ? accent : C.border },
          value && { backgroundColor: `${accent}10` },
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.75}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? accent : C.textMuted}
          style={{ marginRight: 10 }}
        />
        <Text style={{ flex: 1, color: value ? C.textPrimary : C.textMuted, fontSize: FONT_SIZES.base }}>
          {displayText}
        </Text>
        <View style={styles.row}>
          {!!value && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onChange(''); }}
              hitSlop={8}
              style={{ marginRight: 6 }}
            >
              <Ionicons name="close-circle" size={17} color={C.textMuted} />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-down" size={15} color={C.textMuted} />
        </View>
      </TouchableOpacity>

      {/* iOS: bottom-sheet modal */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.iosOverlay}>
            <View style={[styles.iosSheet, { backgroundColor: C.modalBg }]}>
              <View style={styles.iosToolbar}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={{ color: C.textMuted, fontWeight: '600', fontSize: FONT_SIZES.base }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: C.textPrimary, fontWeight: '800', fontSize: FONT_SIZES.base }}>
                  {label || 'Select Date'}
                </Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={{ color: accent, fontWeight: '800', fontSize: FONT_SIZES.base }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="inline"
                themeVariant={isDark ? 'dark' : 'light'}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={applyDate}
                style={{ backgroundColor: C.modalBg }}
              />
            </View>
          </View>
        </Modal>
      ) : (
        // Android: native dialog, no wrapper needed
        showPicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={applyDate}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    height: 50,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.xl,
  },
  iosSheet: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    paddingBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  iosToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: SPACING.sm,
  },
});
