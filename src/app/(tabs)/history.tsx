import { StyleSheet, Text, View } from 'react-native';

import { AddLogFab } from '@/components/fab';
import { LogRow } from '@/components/log-row';
import { Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Log } from '@/lib/battery';
import { formatMonth } from '@/lib/format';
import { useStore } from '@/state/store';

function groupByMonth(logs: Log[]): { month: number; logs: Log[] }[] {
  const groups: { month: number; logs: Log[] }[] = [];
  for (const log of logs) {
    const d = new Date(log.date);
    const month = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const last = groups[groups.length - 1];
    if (last?.month === month) last.logs.push(log);
    else groups.push({ month, logs: [log] });
  }
  return groups;
}

export default function History() {
  const { logs, settings, deleteLog } = useStore();
  const nominal = settings!.nominalKwh;

  return (
    <View style={{ flex: 1 }}>
      <Screen maxWidth={760}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            {logs.length === 0 ? 'Nothing logged yet' : `${logs.length} logs · tap to edit, swipe left to delete`}
          </Text>
        </View>
        {groupByMonth(logs).map((group) => (
          <View key={group.month} style={{ gap: Spacing.sm }}>
            <Text style={styles.month}>{formatMonth(group.month, true)}</Text>
            <View style={styles.list}>
              {group.logs.map((log) => (
                <LogRow key={log.id} log={log} nominalKwh={nominal} onDelete={(l) => deleteLog(l.id)} />
              ))}
            </View>
          </View>
        ))}
      </Screen>
      <AddLogFab />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  month: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});
