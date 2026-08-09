import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Sparkles, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { customInterestId, interestLabel, INTEREST_SUGGESTIONS } from '@/lib/interests';
import { border, colors, shadow, type } from '@/lib/theme';

const MAX_INTERESTS = 20;

function sameInterests(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export default function InterestsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [customInterest, setCustomInterest] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setInterests(user?.interests || []); }, [user?.interests]);

  const selectedLabels = useMemo(
    () => new Set(interests.map((item) => interestLabel(item).toLocaleLowerCase())),
    [interests],
  );
  const dirty = !sameInterests(interests, user?.interests || []);

  function toggleInterest(id: string) {
    setInterests((current) => {
      const label = interestLabel(id).toLocaleLowerCase();
      const existing = current.find((item) => interestLabel(item).toLocaleLowerCase() === label);
      if (existing) return current.filter((item) => item !== existing);
      if (current.length >= MAX_INTERESTS) {
        Alert.alert('Interest list full', `Choose up to ${MAX_INTERESTS} interests.`);
        return current;
      }
      return [...current, id];
    });
  }

  function addCustomInterest() {
    const label = customInterest.trim();
    if (!label) return;
    if ([...label].length > 50) {
      Alert.alert('Interest is too long', 'Keep each interest to 50 characters or fewer.');
      return;
    }
    if (selectedLabels.has(label.toLocaleLowerCase())) {
      setCustomInterest('');
      return;
    }
    if (interests.length >= MAX_INTERESTS) {
      Alert.alert('Interest list full', `Choose up to ${MAX_INTERESTS} interests.`);
      return;
    }
    setInterests((current) => [...current, customInterestId(label)]);
    setCustomInterest('');
  }

  async function saveInterests() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await updateProfile({ interests });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Interests not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to profile" onPress={() => router.back()} style={styles.back}><ChevronLeft size={25} color={colors.ink} /></Pressable>
      <Text style={styles.headerTitle}>Your interests</Text>
    </View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <View style={styles.introIcon}><Sparkles size={25} color={colors.ink} /></View>
          <Text style={styles.title}>The things you’re into lately</Text>
          <Text style={styles.body}>Friends can see these on your profile. Pick a few, add your own, and change them whenever you like.</Text>
          <Text style={styles.count}>{interests.length} of {MAX_INTERESTS} selected</Text>
        </View>

        <View style={styles.selection}>
          <Text style={styles.sectionTitle}>Selected</Text>
          {interests.length ? <View style={styles.chips}>{interests.map((id) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Remove ${interestLabel(id)}`} onPress={() => toggleInterest(id)} style={styles.selectedChip}><Text style={styles.selectedText}>{interestLabel(id)}</Text><X size={15} color={colors.ink} /></Pressable>)}</View> : <Text style={styles.empty}>Nothing selected yet.</Text>}

          <Text style={styles.sectionTitle}>Quick picks</Text>
          <View style={styles.chips}>{INTEREST_SUGGESTIONS.map((item) => {
            const selected = selectedLabels.has(item.label.toLocaleLowerCase());
            return <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleInterest(item.id)} style={[styles.suggestion, selected && styles.suggestionSelected]}><Text style={styles.suggestionText}>{item.label}</Text>{selected ? <X size={14} color={colors.ink} /> : <Plus size={14} color={colors.ink} />}</Pressable>;
          })}</View>

          <Text style={styles.sectionTitle}>Add your own</Text>
          <View style={styles.customRow}>
            <TextInput accessibilityLabel="Custom interest" value={customInterest} onChangeText={setCustomInterest} onSubmitEditing={addCustomInterest} maxLength={50} returnKeyType="done" placeholder="Pottery, night walks, vinyl…" placeholderTextColor="#6F6A64" style={styles.input} />
            <Pressable accessibilityRole="button" accessibilityLabel="Add custom interest" disabled={!customInterest.trim()} onPress={addCustomInterest} style={[styles.add, !customInterest.trim() && styles.disabled]}><Plus size={21} color={colors.ink} /></Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}><Button label={dirty ? 'Save interests' : 'Interests saved'} tone="citrus" loading={saving} disabled={!dirty} onPress={() => void saveInterests()} /></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  keyboard: { flex: 1 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1.5, borderBottomColor: colors.line },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 19 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 16, paddingBottom: 28, gap: 16 },
  intro: { padding: 16, borderRadius: 18, backgroundColor: colors.sky, ...border, ...shadow },
  introIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.citrus, ...border },
  title: { maxWidth: 330, marginTop: 12, fontFamily: type.heavy, color: colors.ink, fontSize: 22, lineHeight: 26 },
  body: { maxWidth: 430, marginTop: 5, fontFamily: type.regular, color: colors.ink, fontSize: 13, lineHeight: 18 },
  count: { marginTop: 10, fontFamily: type.heavy, color: colors.periwinkleDark, fontSize: 10, textTransform: 'uppercase', letterSpacing: .8 },
  selection: { gap: 11, padding: 14, borderRadius: 16, backgroundColor: colors.white, ...border },
  sectionTitle: { marginTop: 4, fontFamily: type.heavy, color: colors.ink, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: { minHeight: Platform.select({ android: 48, default: 44 }), flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.sky, ...border },
  selectedText: { fontFamily: type.heavy, color: colors.ink, fontSize: 12 },
  empty: { fontFamily: type.regular, color: colors.muted, fontSize: 13 },
  suggestion: { minHeight: Platform.select({ android: 48, default: 44 }), flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderRadius: 14, backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.paperDeep },
  suggestionSelected: { backgroundColor: colors.citrus, borderColor: colors.line },
  suggestionText: { fontFamily: type.medium, color: colors.ink, fontSize: 12 },
  customRow: { flexDirection: 'row', gap: 8 },
  input: { minHeight: 48, flex: 1, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.paper, fontFamily: type.regular, color: colors.ink, fontSize: 15, ...border },
  add: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.sage, ...border },
  footer: { padding: 12, paddingBottom: Math.max(12, Platform.OS === 'ios' ? 20 : 12), borderTopWidth: 1.5, borderTopColor: colors.line, backgroundColor: colors.white },
  disabled: { opacity: .45 },
});
