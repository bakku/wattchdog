import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Android's "medium" window class: unfolded foldables, tablets and landscape phones. */
export const WIDE_BREAKPOINT = 600;

export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}

export function Screen({
  children,
  bottomInset = 120,
  maxWidth = MaxContentWidth,
}: {
  children: ReactNode;
  bottomInset?: number;
  maxWidth?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        {
          maxWidth,
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: bottomInset,
          paddingLeft: insets.left + Spacing.lg,
          paddingRight: insets.right + Spacing.lg,
        },
      ]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const ink =
    variant === 'primary' ? Colors.accentInk : variant === 'danger' ? Colors.danger : Colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant !== 'primary' && styles.buttonSecondary,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
      ]}>
      {icon && <Ionicons name={icon} size={18} color={ink} />}
      <Text style={[styles.buttonLabel, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  unit,
  error,
  style,
  text,
  ...input
}: TextInputProps & {
  label: string;
  unit?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
  /** Free text gets a calmer size than the big numeric inputs. */
  text?: boolean;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, error && styles.fieldBoxError]}>
        <TextInput
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.accent}
          style={[styles.fieldInput, text && styles.fieldInputText]}
          {...input}
        />
        {unit && <Text style={styles.fieldUnit}>{unit}</Text>}
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function Callout({ icon, tone, children }: { icon: IconName; tone: 'warning' | 'info'; children: ReactNode }) {
  const color = tone === 'warning' ? Colors.warning : Colors.textSecondary;
  return (
    <View style={[styles.callout, tone === 'warning' && { backgroundColor: Colors.warningWash }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  screenContent: {
    gap: Spacing.lg,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
  },
  buttonPrimary: { backgroundColor: Colors.accent },
  buttonSecondary: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  field: { gap: Spacing.xs + 2 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  fieldBoxError: { borderColor: Colors.danger },
  fieldInput: {
    flex: 1,
    minWidth: 0,
    color: Colors.text,
    fontSize: 22,
    fontWeight: '600',
    height: '100%',
    outlineStyle: 'none',
  } as object,
  fieldInputText: { fontSize: 17, fontWeight: '500' },
  fieldUnit: { color: Colors.textMuted, fontSize: 15, fontWeight: '600', marginLeft: Spacing.sm },
  fieldError: { color: Colors.danger, fontSize: 12 },
  callout: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  calloutText: { flex: 1, color: Colors.text, fontSize: 13, lineHeight: 19 },
});
