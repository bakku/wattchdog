import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import type { IconName } from '@/components/ui';
import { useStore } from '@/state/store';

function TabIcon({
  name,
  focusedName,
  color,
  focused,
}: {
  name: IconName;
  focusedName: IconName;
  color: ColorValue;
  focused: boolean;
}) {
  return <Ionicons name={focused ? focusedName : name} size={24} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { settings } = useStore();
  // After "Delete all data" the screens below must not render before onboarding takes over.
  if (!settings) return null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 68 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 15, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: (p) => <TabIcon name="pulse-outline" focusedName="pulse" {...p} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: (p) => <TabIcon name="list-outline" focusedName="list" {...p} /> }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: (p) => <TabIcon name="settings-outline" focusedName="settings" {...p} /> }}
      />
    </Tabs>
  );
}
