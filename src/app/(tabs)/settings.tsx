import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Button, Callout, Card, Columns, Field, Screen, SectionTitle } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { LOW_CONFIDENCE_PERCENT, parseNumber, type LogInput } from '@/lib/battery';
import { pickCsv, shareCsv } from '@/lib/backup';
import { csvToLogs, logsToCsv } from '@/lib/csv';
import { useStore } from '@/state/store';

const sameLog = (a: LogInput, b: LogInput) =>
  a.date === b.date && a.kwh === b.kwh && a.km === b.km && a.percent === b.percent;

export default function SettingsScreen() {
  const { settings, saveSettings, logs, importLogs, clearAll } = useStore();
  const [carName, setCarName] = useState(settings!.carName);
  const [nominal, setNominal] = useState(String(settings!.nominalKwh));
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ tone: 'info' | 'warning'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const nominalValue = parseNumber(nominal);
  const nominalError = nominalValue > 0 && nominalValue < 500 ? undefined : 'Enter the usable capacity in kWh';
  const dirty = carName.trim() !== settings!.carName || nominalValue !== settings!.nominalKwh;

  const save = async () => {
    if (nominalError) return;
    await saveSettings({ carName: carName.trim() || 'My EV', nominalKwh: nominalValue });
    setSaved(true);
  };

  const exportCsv = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    await shareCsv(`wattchdog-${stamp}.csv`, logsToCsv(logs));
  };

  const importCsv = async () => {
    setMessage(null);
    const text = await pickCsv();
    if (text === null) return;
    const { logs: parsed, errors } = csvToLogs(text);
    const fresh = parsed.filter((p) => !logs.some((l) => sameLog(l, p)));
    await importLogs(fresh);
    const skipped = parsed.length - fresh.length;
    const parts = [`Imported ${fresh.length} log${fresh.length === 1 ? '' : 's'}`];
    if (skipped > 0) parts.push(`${skipped} already present`);
    if (errors.length > 0) parts.push(`${errors.length} skipped:\n${errors.slice(0, 5).join('\n')}`);
    setMessage({ tone: errors.length > 0 ? 'warning' : 'info', text: parts.join(' · ') });
  };

  const carCard = (
    <>
      <SectionTitle>Your car</SectionTitle>
      <Card style={{ gap: Spacing.lg }}>
        <Field
          label="Name"
          text
          value={carName}
          onChangeText={(t) => {
            setCarName(t);
            setSaved(false);
          }}
          placeholder="My EV"
        />
        <Field
          label="Nominal usable capacity"
          unit="kWh"
          value={nominal}
          onChangeText={(t) => {
            setNominal(t);
            setSaved(false);
          }}
          keyboardType="decimal-pad"
          error={nominal === '' ? undefined : nominalError}
        />
        <Button
          label={saved ? 'Saved' : 'Save'}
          icon={saved ? 'checkmark' : undefined}
          onPress={save}
          disabled={!dirty || !!nominalError}
        />
      </Card>
    </>
  );

  const backupCard = (
    <>
      <SectionTitle>Backup</SectionTitle>
      <Card style={{ gap: Spacing.md }}>
        <Text style={styles.body}>
          Your logs live only on this phone. Export a CSV now and then and keep it somewhere safe.
        </Text>
        <Button
          label="Export CSV"
          icon="share-outline"
          variant="secondary"
          onPress={exportCsv}
          disabled={logs.length === 0}
        />
        <Button label="Import CSV" icon="download-outline" variant="secondary" onPress={importCsv} />
        {message && (
          <Callout icon={message.tone === 'warning' ? 'warning' : 'checkmark-circle'} tone={message.tone}>
            {message.text}
          </Callout>
        )}
      </Card>
    </>
  );

  // Inline two-step confirmation: system alerts don't exist on web.
  const dangerCard = (
    <>
      <SectionTitle>Delete data</SectionTitle>
      <Card style={{ gap: Spacing.md }}>
        <Text style={styles.body}>Removes all {logs.length} logs and your car settings, then starts setup again.</Text>
        {confirmClear ? (
          <>
            <Callout icon="warning" tone="warning">
              This can’t be undone.{logs.length > 0 ? ' Export a CSV first if you might want the data back.' : ''}
            </Callout>
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => setConfirmClear(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Delete all" icon="trash" variant="danger" onPress={clearAll} />
              </View>
            </View>
          </>
        ) : (
          <Button label="Delete all data" icon="trash-outline" variant="danger" onPress={() => setConfirmClear(true)} />
        )}
      </Card>
    </>
  );

  const aboutCard = (
    <>
      <SectionTitle>How it works</SectionTitle>
      <Card style={{ gap: Spacing.md }}>
        <Text style={styles.body}>
          Each log estimates usable capacity as <Text style={styles.strong}>kWh used ÷ % used</Text>. 15 kWh for 25 %
          means about 60 kWh. Dividing by the nominal capacity gives state of health.
        </Text>
        <Text style={styles.body}>
          The car rounds its charge level to whole percent, so short trips are noisy. Logs under{' '}
          {LOW_CONFIDENCE_PERCENT} % used are marked low confidence and count less. Longer trips give the best readings.
        </Text>
        <Text style={styles.body}>
          Use the energy figure from the trip computer, not from a wallbox: charging losses would make the battery look
          bigger than it is.
        </Text>
      </Card>
      <View style={styles.footer}>
        <Logo size={28} color={Colors.textMuted} />
        <Text style={styles.footerText}>Wattchdog {Constants.expoConfig?.version}</Text>
      </View>
    </>
  );

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <Columns
        left={
          <>
            {carCard}
            {backupCard}
            {dangerCard}
          </>
        }
        right={aboutCard}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  body: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  strong: { color: Colors.text, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: Spacing.md },
  footer: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.lg },
  footerText: { color: Colors.textMuted, fontSize: 12 },
});
