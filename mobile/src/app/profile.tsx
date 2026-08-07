import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { Avatar, Button, PaperCard } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { border, colors, type } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter(); const { user, signOut } = useAuth();
  function confirmSignOut() { Alert.alert('Sign out of Amika?', 'Your memories will stay safely in your account.', [{ text: 'Stay', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }]); }
  return <SafeAreaView style={styles.safe}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><ChevronLeft size={24} color={colors.ink} /></Pressable><Text style={styles.headerTitle}>Your Amika</Text></View><View style={styles.content}><View style={styles.profile}><Avatar name={user?.name || 'A'} uri={user?.profileImage} size={90} color={colors.citrus} /><Text style={styles.name}>{user?.name}</Text><Text style={styles.email}>{user?.email}</Text></View><PaperCard><View style={styles.row}><View style={styles.icon}><ShieldCheck size={21} color={colors.ink} /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Memories stay yours</Text><Text style={styles.rowBody}>Private by design, shared only when you choose.</Text></View></View></PaperCard><PaperCard><Text style={styles.metaLabel}>Connected service</Text><Text numberOfLines={2} style={styles.meta}>{API_URL.replace('https://', '')}</Text><Text style={styles.version}>Amika mobile · 1.0.0</Text></PaperCard><Button label="Sign out" tone="paper" onPress={confirmSignOut} /><View style={styles.signoutIcon}><LogOut size={17} color={colors.muted} /></View></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.paper }, header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderBottomWidth: 1.5, borderBottomColor: colors.line }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontFamily: type.heavy, fontSize: 19, color: colors.ink }, content: { padding: 20, gap: 18 }, profile: { alignItems: 'center', paddingVertical: 18 }, name: { fontFamily: type.heavy, color: colors.ink, fontSize: 27, marginTop: 14 }, email: { fontFamily: type.medium, color: colors.muted, marginTop: 3 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', ...border }, rowTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 15 }, rowBody: { fontFamily: type.regular, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }, metaLabel: { fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }, meta: { fontFamily: type.medium, color: colors.ink, fontSize: 13, marginTop: 6 }, version: { fontFamily: type.regular, color: colors.muted, fontSize: 11, marginTop: 7 }, signoutIcon: { alignItems: 'center' }, });
