import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/auth';
import { PushNotificationRegistration } from '@/components/push-notification-registration';
import { Spinner } from '@/components/ui';
import { colors } from '@/lib/theme';

function Navigation() {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.loading}><Spinner color={colors.ink} size="large" /></View>;
  return <>{user ? <PushNotificationRegistration /> : null}<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper }, animation: 'slide_from_right' }}>
    <Stack.Protected guard={!user}><Stack.Screen name="welcome" /></Stack.Protected>
    <Stack.Protected guard={!!user}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="memory/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="friend/[id]" />
      <Stack.Screen name="conversation/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
    </Stack.Protected>
  </Stack></>;
}

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Navigation /></AuthProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper } });
