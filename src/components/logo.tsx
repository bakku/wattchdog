import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

// Watchdog head with pricked ears; the lightning bolt is cut out of the face.
export const HEAD_PATH =
  'M22 12 L39 38 L61 38 L78 12 L81 52 Q81 70 65 82 L56 90 Q50 95 44 90 L35 82 Q19 70 19 52 Z';
export const BOLT_PATH = 'M54 42 L40 63 L49.5 63 L45 82 L61 57 L51.5 57 L56 42 Z';

export function Logo({
  size = 32,
  color = Colors.accent,
  cutout = Colors.background,
}: {
  size?: number;
  color?: string;
  cutout?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={HEAD_PATH} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={4} />
      <Path d={BOLT_PATH} fill={cutout} strokeLinejoin="round" stroke={cutout} strokeWidth={1.5} />
    </Svg>
  );
}
