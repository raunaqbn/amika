import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Image as ImageIcon, RotateCcw } from 'lucide-react-native';
import { border, colors, shadow, type } from '@/lib/theme';

export function Button({ label, tone = 'ink', loading, style, ...props }: PressableProps & { label: string; tone?: 'ink' | 'paper' | 'citrus' | 'quiet'; loading?: boolean; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" disabled={loading || props.disabled} {...props} style={({ pressed }) => [styles.button, styles[`button_${tone}`], pressed && styles.pressed, props.disabled && styles.disabled, style]}>
      {loading ? <ActivityIndicator color={tone === 'paper' ? colors.ink : colors.white} /> : <Text style={[styles.buttonText, tone === 'paper' || tone === 'citrus' || tone === 'quiet' ? styles.buttonTextDark : null]}>{label}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text><TextInput placeholderTextColor="#918B82" {...props} style={[styles.field, props.multiline && styles.fieldMultiline, props.style]} /></View>;
}

export function Avatar({ name, uri, size = 42, color = colors.periwinkle }: { name: string; uri?: string | null; size?: number; color?: string }) {
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>{uri ? <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={80} /> : <Text style={[styles.avatarText, { fontSize: size * .38 }]}>{name.trim().charAt(0).toUpperCase()}</Text>}</View>;
}

export function PaperCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function EmptyState({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><ImageIcon size={28} color={colors.ink} strokeWidth={1.8} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{actionLabel && onAction ? <Button label={actionLabel} tone="citrus" onPress={onAction} style={{ marginTop: 8 }} /> : null}</View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>That didn’t land</Text><Text style={styles.emptyBody}>{message}</Text><Button label="Try again" tone="paper" onPress={onRetry} style={{ marginTop: 8 }} /><RotateCcw size={16} color={colors.muted} style={{ marginTop: 14 }} /></View>;
}

export function DividerLabel({ children }: { children: React.ReactNode }) {
  return <View style={styles.dividerRow}><View style={styles.rule} /><Text style={styles.dividerText}>{children}</Text><View style={styles.rule} /></View>;
}

const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...border },
  button_ink: { backgroundColor: colors.ink }, button_paper: { backgroundColor: colors.white }, button_citrus: { backgroundColor: colors.citrus }, button_quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  buttonText: { color: colors.white, fontFamily: type.heavy, fontSize: 15 }, buttonTextDark: { color: colors.ink }, pressed: { transform: [{ translateY: 2 }] }, disabled: { opacity: .5 },
  fieldWrap: { gap: 7 }, fieldLabel: { fontFamily: type.heavy, color: colors.ink, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  field: { minHeight: 50, backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 15, fontFamily: type.regular, fontSize: 16, color: colors.ink, ...border },
  fieldMultiline: { minHeight: 104, paddingTop: 13, textAlignVertical: 'top' },
  avatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', ...border }, avatarText: { fontFamily: type.heavy, color: colors.ink },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 16, ...border, ...shadow },
  empty: { alignItems: 'center', paddingVertical: 46, paddingHorizontal: 28 }, emptyIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center', marginBottom: 18, ...border },
  emptyTitle: { fontFamily: type.heavy, color: colors.ink, fontSize: 21, textAlign: 'center' }, emptyBody: { fontFamily: type.regular, color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 }, rule: { height: 1.5, backgroundColor: colors.line, flex: 1 }, dividerText: { fontFamily: type.heavy, color: colors.muted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
});
