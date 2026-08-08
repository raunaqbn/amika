import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from './ui';
import { NotificationBell } from './notification-bell';
import { colors, type } from '@/lib/theme';
import { useAuth } from '@/context/auth';

export function Screen({ title, eyebrow, children, scroll = true, right, ...props }: ScrollViewProps & { title: string; eyebrow?: string; children: React.ReactNode; scroll?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const content = <>{children}</>;
  return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><View style={{ flex: 1 }}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{right || <View style={styles.headerActions}><NotificationBell /><Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')}><Avatar name={user?.name || 'A'} uri={user?.profileImage} size={42} color={colors.citrus} /></Pressable></View>}</View>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} {...props}>{content}</ScrollView> : <View style={[styles.content, { flex: 1 }]}>{content}</View>}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { minHeight: 76, paddingHorizontal: 18, paddingBottom: 11, flexDirection: 'row', alignItems: 'flex-end', gap: 12, borderBottomWidth: 1.5, borderBottomColor: colors.line },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  eyebrow: { fontFamily: type.heavy, fontSize: 10, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.periwinkleDark },
  title: { fontFamily: type.heavy, fontSize: 27, lineHeight: 31, color: colors.ink },
  content: { padding: 18, paddingBottom: 34, gap: 18 },
});
