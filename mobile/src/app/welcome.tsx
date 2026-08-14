import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { border, colors, shadow, type } from '@/lib/theme';
import { Button, DividerLabel, Field, Spinner } from '@/components/ui';
import { MemorySeedling } from '@/components/memory-seedling';

export default function Welcome() {
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [googleLoading, setGoogleLoading] = useState(false);
  async function submit() {
    if (!email.trim() || !password) return Alert.alert('A couple details are missing', 'Add your email and password to continue.');
    if (mode === 'signup' && !name.trim()) return Alert.alert('What should friends call you?', 'Add your name to create your Amika account.');
    setLoading(true); try { if (mode === 'signin') await signIn(email.trim(), password); else await signUp(name.trim(), email.trim(), password); } catch (error) { Alert.alert(mode === 'signin' ? 'Couldn’t sign in' : 'Couldn’t create account', error instanceof Error ? error.message : 'Please try again.'); } finally { setLoading(false); }
  }
  async function continueWithGoogle() {
    setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (error) { Alert.alert('Couldn’t continue with Google', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setGoogleLoading(false); }
  }
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
    <View style={styles.brand}><View style={styles.mark}><MemorySeedling size={82} /></View><Text style={styles.logo}>amika</Text><Text style={styles.tagline}>Keep the little moments that make a friendship yours.</Text></View>
    <View style={styles.packet}><View style={styles.tabs}><Button label="Sign in" tone={mode === 'signin' ? 'citrus' : 'quiet'} disabled={loading || googleLoading} onPress={() => setMode('signin')} style={{ flex: 1 }} /><Button label="I’m new" tone={mode === 'signup' ? 'citrus' : 'quiet'} disabled={loading || googleLoading} onPress={() => setMode('signup')} style={{ flex: 1 }} /></View><DividerLabel>{mode === 'signin' ? 'Welcome back' : 'Start your memory circle'}</DividerLabel><Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" disabled={loading || googleLoading} onPress={continueWithGoogle} style={({ pressed }) => [styles.googleButton, pressed && styles.googlePressed, (loading || googleLoading) && styles.disabled]}>{googleLoading ? <Spinner /> : <><View style={styles.googleMark}><Text style={styles.googleLetter}>G</Text></View><Text style={styles.googleText}>Continue with Google</Text></>}</Pressable><DividerLabel>or use email</DividerLabel>{mode === 'signup' ? <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" placeholder="Raunaq" editable={!loading && !googleLoading} /> : null}<Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" editable={!loading && !googleLoading} /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="At least 6 characters" editable={!loading && !googleLoading} /><Button label={mode === 'signin' ? 'Open Amika' : 'Create my Amika'} loading={loading} disabled={googleLoading} onPress={submit} />
    </View><Text style={styles.foot}>No follower counts. No performance. Just memories with people you love.</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper }, scroll: { minHeight: '100%', padding: 22, justifyContent: 'center', gap: 26 }, brand: { alignItems: 'center' }, mark: { width: 104, height: 92, alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: colors.apricotSoft }, logo: { fontFamily: type.heavy, fontSize: 44, letterSpacing: -2, color: colors.mossDeep, marginTop: 14 }, tagline: { fontFamily: type.medium, color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 5, maxWidth: 320 }, packet: { backgroundColor: colors.white, borderRadius: 24, padding: 17, gap: 15, ...border, ...shadow }, tabs: { flexDirection: 'row', padding: 3, backgroundColor: colors.paperDeep, borderRadius: 16 }, googleButton: { minHeight: 52, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...border }, googlePressed: { transform: [{ translateY: 2 }] }, googleMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...border }, googleLetter: { fontFamily: type.heavy, fontSize: 16, color: '#3158A6' }, googleText: { fontFamily: type.heavy, fontSize: 15, color: colors.ink }, disabled: { opacity: .5 }, foot: { fontFamily: type.medium, fontSize: 12, lineHeight: 18, textAlign: 'center', color: colors.muted, paddingHorizontal: 20 },
});
