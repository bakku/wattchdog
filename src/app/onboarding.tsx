import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { Button, Field } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { parseNumber } from '@/lib/battery';
import { useStore } from '@/state/store';

export default function Onboarding() {
  const { saveSettings } = useStore();
  const insets = useSafeAreaInsets();
  // Landscape phones are short: less space above the logo keeps the form in reach.
  const compact = useWindowDimensions().height < 500;
  const [carName, setCarName] = useState('');
  const [nominal, setNominal] = useState('');

  const nominalValue = parseNumber(nominal);
  const valid = nominalValue > 0 && nominalValue < 500;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['rgba(61, 245, 160, 0.18)', 'rgba(61, 245, 160, 0)']}
        style={[StyleSheet.absoluteFill, { height: 420 }]}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (compact ? Spacing.xl : Spacing.xxl * 1.5),
            paddingBottom: insets.bottom + Spacing.xl,
            paddingLeft: insets.left + Spacing.xl,
            paddingRight: insets.right + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Logo size={96} />
          <Text style={styles.title}>Wattchdog</Text>
          <Text style={styles.tagline}>Keeps an eye on your EV’s battery health, one trip at a time.</Text>
        </View>

        <View style={{ gap: Spacing.lg }}>
          <Field label="Car name" text value={carName} onChangeText={setCarName} placeholder="My EV" />
          <Field
            label="Nominal usable capacity"
            unit="kWh"
            value={nominal}
            onChangeText={setNominal}
            keyboardType="decimal-pad"
            placeholder="77"
          />
          <Text style={styles.hint}>
            The usable (net) capacity your car had when new. Check the spec sheet: e.g. 77 kWh for a VW ID.4 Pro.
          </Text>
        </View>

        <Button
          label="Start watching"
          icon="arrow-forward"
          disabled={!valid}
          onPress={() => saveSettings({ carName: carName.trim() || 'My EV', nominalKwh: nominalValue })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    flexGrow: 1,
    gap: Spacing.xxl,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.md },
  title: { color: Colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: Colors.textSecondary, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  hint: { color: Colors.textMuted, fontSize: 13, lineHeight: 19 },
});
