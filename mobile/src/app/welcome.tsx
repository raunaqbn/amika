import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Heart, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { border, colors, shadow, type } from '@/lib/theme';
import { Button, DividerLabel, Field } from '@/components/ui';

export default function Welcome() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false);
  async function submit() {
    if (!email.trim() || !password) return Alert.alert('A couple details are missing', 'Add your email and password to continue.');
    if (mode === 'signup' && !name.trim()) return Alert.alert('What should friends call you?', 'Add your name to create your Amika account.');
    setLoading(true); try { if (mode === 'signin') await signIn(email.trim(), password); else await signUp(name.trim(), email.trim(), password); } catch (error) { Alert.alert(mode === 'signin' ? 'Couldn’t sign in' : 'Couldn’t create account', error instanceof Error ? error.message : 'Please try again.'); } finally { setLoading(false); }
  }
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
    <View style={styles.brand}><View style={styles.mark}><Heart size={28} color={colors.ink} fill={colors.rose} /><Sparkles size={19} color={colors.ink} style={styles.sparkle} /></View><Text style={styles.logo}>amika</Text><Text style={styles.tagline}>Keep the little moments that make a friendship yours.</Text></View>
    <View style={styles.packet}><View style={styles.tabs}><Button label="Sign in" tone={mode === 'signin' ? 'citrus' : 'quiet'} onPress={() => setMode('signin')} style={{ flex: 1 }} /><Button label="I’m new" tone={mode === 'signup' ? 'citrus' : 'quiet'} onPress={() => setMode('signup')} style={{ flex: 1 }} /></View><DividerLabel>{mode === 'signin' ? 'Welcome back' : 'Start your memory circle'}</DividerLabel>{mode === 'signup' ? <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" placeholder="Raunaq" /> : null}<Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="At least 6 characters" /><Button label={mode === 'signin' ? 'Open Amika' : 'Create my Amika'} loading={loading} onPress={submit} />
    </View><Text style={styles.foot}>No follower counts. No performance. Just memories with people you love.</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, scroll: { minHeight: '100%', padding: 22, justifyContent: 'center', gap: 26 }, brand: { alignItems: 'center' }, mark: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.periwinkle, ...border, ...shadow }, sparkle: { position: 'absolute', top: 8, right: 8 }, logo: { fontFamily: type.heavy, fontSize: 44, letterSpacing: -2, color: colors.ink, marginTop: 17 }, tagline: { fontFamily: type.medium, color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 5, maxWidth: 320 }, packet: { backgroundColor: colors.periwinkle, borderRadius: 22, padding: 17, gap: 15, ...border, ...shadow }, tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,.35)', borderRadius: 15 }, foot: { fontFamily: type.medium, fontSize: 12, lineHeight: 18, textAlign: 'center', color: colors.muted, paddingHorizontal: 20 },
});
