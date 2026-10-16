import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Callout, Field } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  efficiency,
  estimateCapacity,
  isImplausible,
  isLowConfidence,
  LOW_CONFIDENCE_PERCENT,
  parseNumber,
  stateOfHealth,
  validateLog,
} from '@/lib/battery';
import { fixed, formatDay } from '@/lib/format';
import { useStore } from '@/state/store';

const DAY = 24 * 60 * 60 * 1000;

export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { logs, settings, addLog, updateLog, deleteLog } = useStore();
  const existing = id ? logs.find((l) => l.id === id) : undefined;
  const insets = useSafeAreaInsets();

  const [openedAt] = useState(Date.now);
  const [date, setDate] = useState(existing?.date ?? openedAt);
  const [kwh, setKwh] = useState(existing ? String(existing.kwh) : '');
  const [km, setKm] = useState(existing ? String(existing.km) : '');
  const [percent, setPercent] = useState(existing ? String(existing.percent) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [submitted, setSubmitted] = useState(false);

  const values = { kwh: parseNumber(kwh), km: parseNumber(km), percent: parseNumber(percent) };
  const errors = validateLog(values);
  const valid = Object.keys(errors).length === 0;
  const nominal = settings!.nominalKwh;
  const capacity = valid ? estimateCapacity(values) : null;
  const canGoForward = date + DAY <= openedAt;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    setSubmitted(true);
    if (!valid) return;
    const input = { date, ...values, note: note.trim() };
    if (existing) await updateLog({ ...input, id: existing.id });
    else await addLog(input);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    close();
  };

  const remove = async () => {
    await deleteLog(existing!.id);
    close();
  };

  // Only nag about a field once the user has touched it or tried to save.
  const errorFor = (field: keyof typeof errors, raw: string) => (submitted || raw !== '' ? errors[field] : undefined);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.lg + (Platform.OS === 'android' ? insets.top : 0),
            paddingBottom: insets.bottom + Spacing.xl,
            paddingLeft: insets.left + Spacing.lg,
            paddingRight: insets.right + Spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{existing ? 'Edit log' : 'New log'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.dateRow}>
          <Pressable
            accessibilityLabel="Previous day"
            onPress={() => setDate(date - DAY)}
            style={styles.dateButton}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.dateLabel}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.dateText}>{formatDay(date)}</Text>
          </View>
          <Pressable
            accessibilityLabel="Next day"
            disabled={!canGoForward}
            onPress={() => setDate(date + DAY)}
            style={[styles.dateButton, !canGoForward && { opacity: 0.3 }]}>
            <Ionicons name="chevron-forward" size={20} color={Colors.text} />
          </Pressable>
        </View>

        <Field
          label="Energy used"
          unit="kWh"
          value={kwh}
          onChangeText={setKwh}
          keyboardType="decimal-pad"
          placeholder="15.2"
          autoFocus={!existing}
          error={errorFor('kwh', kwh)}
        />
        <View style={styles.pair}>
          <Field
            style={{ flex: 1 }}
            label="Distance"
            unit="km"
            value={km}
            onChangeText={setKm}
            keyboardType="decimal-pad"
            placeholder="98"
            error={errorFor('km', km)}
          />
          <Field
            style={{ flex: 1 }}
            label="Charge used"
            unit="%"
            value={percent}
            onChangeText={setPercent}
            keyboardType="decimal-pad"
            placeholder="21"
            error={errorFor('percent', percent)}
          />
        </View>

        <View style={styles.preview}>
          <PreviewStat label="Capacity" value={capacity ? fixed(capacity) : '–'} unit="kWh" />
          <View style={styles.previewDivider} />
          <PreviewStat label="Health" value={capacity ? fixed(stateOfHealth(capacity, nominal)) : '–'} unit="%" />
          <View style={styles.previewDivider} />
          <PreviewStat label="Efficiency" value={valid ? fixed(efficiency(values)) : '–'} unit="kWh/100 km" />
        </View>

        {valid && isLowConfidence(values) && (
          <Callout icon="information-circle" tone="info">
            Under {LOW_CONFIDENCE_PERCENT} % used, rounding of the charge display makes this estimate rough. It will
            still be saved, but count less in your trend.
          </Callout>
        )}
        {capacity !== null && isImplausible(capacity, nominal) && (
          <Callout icon="warning" tone="warning">
            {fixed(capacity)} kWh is far from your nominal {fixed(nominal)} kWh. Double-check the numbers. You can
            still save if they’re right.
          </Callout>
        )}

        <Field
          label="Note (optional)"
          text
          value={note}
          onChangeText={setNote}
          placeholder="Motorway, 2 °C, heating on"
          style={{ marginTop: Spacing.xs }}
        />

        <View style={{ gap: Spacing.md, marginTop: Spacing.sm }}>
          <Button label={existing ? 'Save changes' : 'Save log'} icon="checkmark" onPress={save} />
          {existing && <Button label="Delete log" icon="trash-outline" variant="danger" onPress={remove} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PreviewStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.previewStat}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
      <Text style={styles.previewUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    gap: Spacing.lg,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: 4,
  },
  dateButton: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  dateText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  pair: { flexDirection: 'row', gap: Spacing.md },
  preview: {
    flexDirection: 'row',
    backgroundColor: Colors.accentWash,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 160, 0.25)',
    paddingVertical: Spacing.md,
  },
  previewStat: { flex: 1, alignItems: 'center', gap: 1 },
  previewDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(61, 245, 160, 0.25)' },
  previewLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  previewValue: { color: Colors.text, fontSize: 24, fontWeight: '700' },
  previewUnit: { color: Colors.textMuted, fontSize: 11 },
});
