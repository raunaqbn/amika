import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BookHeart, Home, MessageCircle, Plus, Users } from 'lucide-react-native';
import { border, colors, type } from '@/lib/theme';
import { useNotificationCount } from '@/hooks/use-notification-count';

const icons = { index: Home, friends: Users, add: Plus, messages: MessageCircle, journal: BookHeart };

export default function TabsLayout() {
  const { chatNotifications } = useNotificationCount(true);
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: styles.label, tabBarStyle: styles.bar, tabBarItemStyle: styles.item, tabBarIcon: ({ color, focused }) => { const Icon = icons[route.name as keyof typeof icons]; return route.name === 'add' ? <View style={styles.add}><Icon size={25} color={colors.ink} strokeWidth={2.5} /></View> : <Icon size={22} color={color} fill={focused && route.name === 'index' ? colors.citrus : 'transparent'} />; } })}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} /><Tabs.Screen name="friends" options={{ title: 'Friends' }} /><Tabs.Screen name="add" options={{ title: 'Add' }} /><Tabs.Screen name="messages" options={{ title: 'Messages', tabBarBadge: chatNotifications || undefined, tabBarBadgeStyle: styles.tabBadge }} /><Tabs.Screen name="journal" options={{ title: 'Journal' }} />
  </Tabs>;
}

const styles = StyleSheet.create({ bar: { backgroundColor: colors.white, borderTopWidth: 1.5, borderTopColor: colors.line, height: 82, paddingTop: 8 }, item: { paddingTop: 2 }, label: { fontFamily: type.heavy, fontSize: 10 }, tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.citrus, color: colors.ink, fontFamily: type.heavy, fontSize: 9, borderWidth: 1, borderColor: colors.line }, add: { width: 47, height: 47, marginTop: -20, borderRadius: 15, backgroundColor: colors.citrus, alignItems: 'center', justifyContent: 'center', ...border }, });
