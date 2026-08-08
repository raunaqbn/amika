import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useNotificationCount } from '@/hooks/use-notification-count';
import { border, colors, type } from '@/lib/theme';

export function NotificationBell() {
  const router = useRouter();
  const { total } = useNotificationCount();
  const label = total ? `Open notifications, ${total} unread` : 'Open notifications';

  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push('/notifications' as Href)} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
    <Bell size={21} color={colors.ink} fill={total ? colors.periwinkle : 'transparent'} />
    {total ? <View style={styles.badge}><Text style={styles.badgeText}>{total > 9 ? '9+' : total}</Text></View> : null}
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, ...border },
  pressed: { transform: [{ translateY: 2 }] },
  badge: { position: 'absolute', right: -5, top: -5, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.citrus, ...border },
  badgeText: { fontFamily: type.heavy, color: colors.ink, fontSize: 9 },
});
