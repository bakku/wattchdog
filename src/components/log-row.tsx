import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  efficiency,
  estimateCapacity,
  isImplausible,
  isLowConfidence,
  stateOfHealth,
  type Log,
} from '@/lib/battery';
import { fixed, formatDate } from '@/lib/format';

export function LogRow({
  log,
  nominalKwh,
  onDelete,
}: {
  log: Log;
  nominalKwh: number;
  onDelete?: (log: Log) => void;
}) {
  const capacity = estimateCapacity(log);
  const low = isLowConfidence(log);
  const odd = isImplausible(capacity, nominalKwh);

  const row = (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Edit this log"
      onPress={() => router.push({ pathname: '/log', params: { id: log.id } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.surfaceRaised }]}>
      <View style={[styles.marker, low ? styles.markerHollow : styles.markerFilled]} />
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.date}>{formatDate(log.date)}</Text>
          <Text style={styles.soh}>{fixed(stateOfHealth(capacity, nominalKwh))}%</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.detail}>
            {fixed(log.kwh)} kWh · {fixed(log.km, 0)} km · {fixed(log.percent, 0)}%
          </Text>
          <Text style={styles.detail}>{fixed(capacity)} kWh</Text>
        </View>
        <View style={styles.tags}>
          <Text style={styles.tag}>{fixed(efficiency(log))} kWh/100 km</Text>
          {low && <Text style={styles.tag}>Low confidence</Text>}
          {odd && (
            <View style={styles.warnTag}>
              <Ionicons name="warning" size={11} color={Colors.warning} />
              <Text style={styles.warnText}>Check values</Text>
            </View>
          )}
        </View>
        {log.note !== '' && (
          <Text style={styles.note} numberOfLines={2}>
            {log.note}
          </Text>
        )}
      </View>
    </Pressable>
  );

  if (!onDelete) return row;

  return (
    <Swipeable
      friction={2}
      rightThreshold={60}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete log"
          onPress={() => onDelete(log)}
          style={styles.deleteAction}>
          <Ionicons name="trash" size={20} color={Colors.text} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}>
      {row}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  marker: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  markerFilled: { backgroundColor: Colors.accent },
  markerHollow: { borderWidth: 2, borderColor: Colors.accent },
  body: { flex: 1, gap: 3 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  date: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  soh: { color: Colors.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  detail: { color: Colors.textSecondary, fontSize: 13, fontVariant: ['tabular-nums'] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: 4 },
  tag: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  warnTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warningWash,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  warnText: { color: Colors.warning, fontSize: 11, fontWeight: '600' },
  note: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  deleteAction: {
    width: 96,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteText: { color: Colors.text, fontSize: 12, fontWeight: '700' },
});
