import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

export function AddLogFab() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add log"
      onPress={() => router.push('/log')}
      style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Ionicons name="add" size={32} color={Colors.accentInk} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
