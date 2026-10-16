import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AddLogFab } from '@/components/fab';
import { LogRow } from '@/components/log-row';
import { Logo } from '@/components/logo';
import { ChartLegend, SohChart } from '@/components/soh-chart';
import { Card, Screen, SectionTitle, WIDE_BREAKPOINT } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  averageEfficiency,
  HEADLINE_WINDOW_DAYS,
  headlineCapacity,
  stateOfHealth,
  type Range,
} from '@/lib/battery';
import { fixed } from '@/lib/format';
import { useStore } from '@/state/store';

const RANGES: Range[] = ['3M', '1Y', 'All'];

function meterColor(soh: number): string {
  if (soh >= 80) return Colors.accent;
  if (soh >= 70) return Colors.warning;
  return Colors.danger;
}

export default function Dashboard() {
  const { logs, settings } = useStore();
  const [range, setRange] = useState<Range>('1Y');
  const nominal = settings!.nominalKwh;
  const headline = headlineCapacity(logs);
  const avgEfficiency = averageEfficiency(logs);
  const totalKm = logs.reduce((sum, l) => sum + l.km, 0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Unfolded foldables and tablets have room for a taller plot; phones and landscape keep it short.
  const roomy = windowWidth >= WIDE_BREAKPOINT && windowHeight >= WIDE_BREAKPOINT;

  const hero = headline ? (
    <HeroCard
      soh={stateOfHealth(headline.capacityKwh, nominal)}
      capacity={headline.capacityKwh}
      nominal={nominal}
      caption={
        headline.usedFallback
          ? `Weighted average of your latest ${headline.sampleCount} logs`
          : `Weighted average of ${headline.sampleCount} logs from the last ${HEADLINE_WINDOW_DAYS} days`
      }
    />
  ) : (
    <EmptyHero />
  );

  const tiles = (
    <View style={styles.tiles}>
      <StatTile label="Efficiency" value={avgEfficiency ? fixed(avgEfficiency) : '–'} unit="kWh/100 km" />
      <StatTile label="Distance" value={totalKm.toLocaleString('en-GB', { maximumFractionDigits: 0 })} unit="km" />
      <StatTile label="Logs" value={String(logs.length)} unit="trips" />
    </View>
  );

  const chart = (
    <Card style={{ gap: Spacing.md }}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.cardTitle}>State of health</Text>
          <Text style={styles.cardSub}>% of nominal {fixed(nominal)} kWh</Text>
        </View>
        <View style={styles.chips}>
          {RANGES.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              accessibilityState={{ selected: r === range }}
              onPress={() => setRange(r)}
              style={[styles.chip, r === range && styles.chipActive]}>
              <Text style={[styles.chipText, r === range && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <SohChart logs={logs} nominalKwh={nominal} range={range} height={roomy ? 300 : 230} />
      <ChartLegend />
    </Card>
  );

  const recent = (
    <View style={{ gap: Spacing.md }}>
      <SectionTitle
        right={
          <Link href="/history" style={styles.link}>
            See all
          </Link>
        }>
        Recent logs
      </SectionTitle>
      <View style={styles.list}>
        {logs.slice(0, 3).map((log) => (
          <LogRow key={log.id} log={log} nominalKwh={nominal} />
        ))}
      </View>
    </View>
  );


  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <View style={styles.header}>
          <Logo size={34} />
          <View>
            <Text style={styles.brand}>Wattchdog</Text>
            <Text style={styles.car}>{settings!.carName}</Text>
          </View>
        </View>

        {logs.length === 0 ? (
          hero
        ) : (
          <>
            {hero}
            {tiles}
            {chart}
            {recent}
          </>
        )}
      </Screen>
      <AddLogFab />
    </View>
  );
}

function HeroCard({ soh, capacity, nominal, caption }: { soh: number; capacity: number; nominal: number; caption: string }) {
  // Landscape phones are short: lay the hero out as a band so the chart stays in reach.
  const { width, height } = useWindowDimensions();
  const compact = height < 500;
  const band = compact && width >= WIDE_BREAKPOINT;
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['rgba(61, 245, 160, 0.20)', 'rgba(61, 245, 160, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroBody, band && styles.heroBand]}>
        <View style={styles.heroBody}>
          <Text style={styles.heroLabel}>Battery health</Text>
          <View style={styles.heroValueRow}>
            <Text style={[styles.heroValue, compact && styles.heroValueCompact]}>{fixed(soh)}</Text>
            <Text style={styles.heroUnit}>%</Text>
          </View>
        </View>
        <View style={[styles.heroBody, band && styles.heroBandDetail]}>
          <Text style={styles.heroSub}>
            ≈ <Text style={styles.heroSubStrong}>{fixed(capacity)} kWh</Text> usable of {fixed(nominal)}{'\u00A0'}kWh
          </Text>
          <View style={styles.meterTrack}>
            <View
              style={[styles.meterFill, { width: `${Math.min(Math.max(soh, 0), 100)}%`, backgroundColor: meterColor(soh) }]}
            />
          </View>
          <Text style={styles.heroCaption}>{caption}</Text>
        </View>
      </View>
    </View>
  );
}

function EmptyHero() {
  return (
    <View style={[styles.hero, styles.emptyHero]}>
      <LinearGradient
        colors={['rgba(61, 245, 160, 0.16)', 'rgba(61, 245, 160, 0.02)']}
        style={StyleSheet.absoluteFill}
      />
      <Logo size={72} cutout={Colors.surface} />
      <Text style={styles.emptyTitle}>Log your first trip</Text>
      <Text style={styles.emptyBody}>
        After a drive, note the kWh used, the kilometres and how many percent of charge it took. Wattchdog does
        the maths and watches your battery’s health over time.
      </Text>
      <View style={styles.emptyHint}>
        <Text style={styles.emptyHintText}>Tap + to start</Text>
        <Ionicons name="arrow-down" size={16} color={Colors.accent} style={{ transform: [{ rotate: '-45deg' }] }} />
      </View>
    </View>
  );
}

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  brand: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  car: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  hero: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(61, 245, 160, 0.25)',
    overflow: 'hidden',
    gap: Spacing.xs,
  },
  heroLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-start' },
  heroValue: {
    color: Colors.text,
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '800',
    letterSpacing: -3,
    textShadowColor: Colors.accentGlow,
    textShadowRadius: 24,
  },
  heroValueCompact: { fontSize: 52, lineHeight: 60, letterSpacing: -2 },
  heroBody: { gap: Spacing.xs },
  heroBand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  heroBandDetail: { flex: 1 },
  heroUnit: { color: Colors.accent, fontSize: 30, fontWeight: '700', marginTop: 12, marginLeft: 4 },
  heroSub: { color: Colors.textSecondary, fontSize: 15 },
  heroSubStrong: { color: Colors.text, fontWeight: '700' },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(61, 245, 160, 0.12)',
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: 4 },
  heroCaption: { color: Colors.textMuted, fontSize: 12, marginTop: Spacing.sm },
  emptyHero: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  emptyBody: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  emptyHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  emptyHintText: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 2,
  },
  tileLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tileValue: { color: Colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  tileUnit: { color: Colors.textMuted, fontSize: 11 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  cardSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  chips: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.pill,
    padding: 3,
  },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: Colors.accentInk },
  link: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  list: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});
