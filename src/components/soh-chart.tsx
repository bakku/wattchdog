import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  estimateCapacity,
  isLowConfidence,
  rangeStart,
  stateOfHealth,
  trend,
  type Log,
  type Range,
} from '@/lib/battery';
import { fixed, formatDate, formatMonth } from '@/lib/format';

const PAD = { top: 18, right: 52, bottom: 28, left: 34 };
const DAY = 24 * 60 * 60 * 1000;

type Point = { log: Log; soh: number; capacity: number; x: number; y: number };

function niceDomain(values: number[]): { min: number; max: number; step: number } {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = hi - lo > 30 ? 10 : 5;
  return {
    min: Math.floor((lo - 1) / step) * step,
    max: Math.ceil((hi + 1) / step) * step,
    step,
  };
}

function monthTicks(from: number, to: number): number[] {
  const ticks: number[] = [];
  const d = new Date(from);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() <= to) {
    ticks.push(d.getTime());
    d.setMonth(d.getMonth() + 1);
  }
  const every = Math.ceil(ticks.length / 4);
  return ticks.filter((_, i) => i % every === 0);
}

export function SohChart({
  logs,
  nominalKwh,
  range,
  height = 230,
}: {
  logs: Log[];
  nominalKwh: number;
  range: Range;
  height?: number;
}) {
  const [now] = useState(Date.now);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const start = rangeStart(range, now);
  const visible = logs.filter((l) => l.date >= start).sort((a, b) => a.date - b.date);
  // Smooth over every log so the line doesn't bend at the range edge.
  const smoothed = trend(logs).filter((p) => p.date >= start);

  if (visible.length === 0) {
    return (
      <View style={[styles.empty, { height: height }]}>
        <Text style={styles.emptyText}>No logs in this range yet</Text>
      </View>
    );
  }

  const xMin = range === 'All' ? visible[0].date : start;
  const xMax = Math.max(now, visible[visible.length - 1].date);
  const span = Math.max(xMax - xMin, 30 * DAY);
  const domain = niceDomain([
    100,
    ...visible.map((l) => stateOfHealth(estimateCapacity(l), nominalKwh)),
    ...smoothed.map((p) => stateOfHealth(p.capacityKwh, nominalKwh)),
  ]);

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = height - PAD.top - PAD.bottom;
  const xOf = (t: number) => PAD.left + ((t - (xMax - span)) / span) * plotW;
  const yOf = (soh: number) => PAD.top + (1 - (soh - domain.min) / (domain.max - domain.min)) * plotH;

  const points: Point[] = visible.map((log) => {
    const capacity = estimateCapacity(log);
    const soh = stateOfHealth(capacity, nominalKwh);
    return { log, soh, capacity, x: xOf(log.date), y: yOf(soh) };
  });
  const line = smoothed.map((p) => ({ x: xOf(p.date), y: yOf(stateOfHealth(p.capacityKwh, nominalKwh)) }));
  const linePath = line.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const baseline = PAD.top + plotH;
  const areaPath =
    line.length > 1
      ? `${linePath} L${line[line.length - 1].x.toFixed(1)},${baseline} L${line[0].x.toFixed(1)},${baseline} Z`
      : '';
  const lastTrend = smoothed[smoothed.length - 1];
  const lastTrendSoh = stateOfHealth(lastTrend.capacityKwh, nominalKwh);

  const yTicks: number[] = [];
  for (let v = domain.min; v <= domain.max; v += domain.step) yTicks.push(v);
  const xTicks = monthTicks(xMax - span, xMax);
  const showYear = span > 300 * DAY;

  const pick = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.x - x) < Math.abs(points[best].x - x)) best = i;
    });
    setSelected(best);
  };

  const active = selected !== null ? points[selected] : null;
  const tooltipW = 150;

  return (
    <View
      style={{ height: height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={pick}
      onResponderMove={pick}
      onResponderRelease={() => setSelected(null)}
      onResponderTerminate={() => setSelected(null)}
      accessibilityLabel={`State of health chart, trend at ${fixed(lastTrendSoh)} percent`}>
      {width > 0 && (
        <Svg width={width} height={height} pointerEvents="none">
          <Defs>
            <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.accent} stopOpacity={0.22} />
              <Stop offset="1" stopColor={Colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {yTicks.map((v) => (
            <G key={v}>
              <Line x1={PAD.left} x2={PAD.left + plotW} y1={yOf(v)} y2={yOf(v)} stroke={Colors.grid} strokeWidth={1} />
              <SvgText x={PAD.left - 8} y={yOf(v) + 4} fill={Colors.textMuted} fontSize={11} textAnchor="end">
                {v}
              </SvgText>
            </G>
          ))}
          {xTicks.map((t) => (
            <SvgText key={t} x={xOf(t)} y={height - 8} fill={Colors.textMuted} fontSize={11} textAnchor="middle">
              {formatMonth(t, showYear)}
            </SvgText>
          ))}

          <Line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={yOf(100)}
            y2={yOf(100)}
            stroke={Colors.textMuted}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <SvgText x={PAD.left + plotW + 6} y={yOf(100) + 4} fill={Colors.textMuted} fontSize={11}>
            Nominal
          </SvgText>

          {areaPath !== '' && <Path d={areaPath} fill="url(#wash)" />}
          {line.length > 1 && (
            <Path d={linePath} stroke={Colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {active && (
            <Line x1={active.x} x2={active.x} y1={PAD.top} y2={baseline} stroke={Colors.textSecondary} strokeWidth={1} />
          )}

          {points.map((p) => {
            const low = isLowConfidence(p.log);
            return (
              <Circle
                key={p.log.id}
                cx={p.x}
                cy={p.y}
                r={active === p ? 6.5 : 4.5}
                fill={low ? Colors.surface : Colors.accent}
                stroke={low ? Colors.accent : Colors.surface}
                strokeWidth={2}
              />
            );
          })}

          <SvgText
            x={line[line.length - 1].x + 8}
            y={line[line.length - 1].y + (Math.abs(yOf(100) - line[line.length - 1].y) < 14 ? 16 : 4)}
            fill={Colors.text}
            fontSize={12}
            fontWeight="700">
            {`${fixed(lastTrendSoh)}%`}
          </SvgText>
        </Svg>
      )}

      {active && (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            { width: tooltipW, left: Math.min(Math.max(active.x - tooltipW / 2, 0), width - tooltipW) },
          ]}>
          <Text style={styles.tooltipValue}>
            {fixed(active.soh)}% <Text style={styles.tooltipSub}>· {fixed(active.capacity)} kWh</Text>
          </Text>
          <Text style={styles.tooltipSub}>
            {formatDate(active.log.date)}
            {isLowConfidence(active.log) ? ' · low confidence' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export function ChartLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
        <Text style={styles.legendText}>Log</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, styles.dotHollow]} />
        <Text style={styles.legendText}>Under 20 % used</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.lineKey} />
        <Text style={styles.legendText}>Trend</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  tooltip: {
    position: 'absolute',
    top: -6,
    backgroundColor: Colors.surfaceRaised,
    borderColor: Colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.md - 2,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  tooltipValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  tooltipSub: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  legend: { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
  legendText: { color: Colors.textSecondary, fontSize: 12 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotHollow: { borderWidth: 2, borderColor: Colors.accent },
  lineKey: { width: 14, height: 2, borderRadius: 1, backgroundColor: Colors.accent },
});
