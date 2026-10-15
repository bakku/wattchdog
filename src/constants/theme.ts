export const Colors = {
  background: '#0B0F0E',
  surface: '#121816',
  surfaceRaised: '#1A2220',
  border: '#24302C',
  grid: '#1F2926',
  text: '#ECF5F1',
  textSecondary: '#93A39E',
  textMuted: '#5E6E69',
  accent: '#3DF5A0',
  accentInk: '#04140C',
  accentWash: 'rgba(61, 245, 160, 0.10)',
  accentGlow: 'rgba(61, 245, 160, 0.35)',
  warning: '#FFB547',
  warningWash: 'rgba(255, 181, 71, 0.12)',
  danger: '#FF5C6C',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** Forms and single-column screens stay phone-width on big screens. */
export const MaxContentWidth = 560;
/** Two-column dashboard on unfolded foldables and in landscape. */
export const MaxWideWidth = 1180;
