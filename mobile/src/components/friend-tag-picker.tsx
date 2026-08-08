import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, UserRoundX } from 'lucide-react-native';
import { border, colors, type } from '@/lib/theme';
import type { Friend } from '@/types';
import { Avatar } from './ui';

type FriendTagPickerProps = {
  friends: Friend[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  emptyLabel?: string;
  helper?: string;
};

export function FriendTagPicker({
  friends,
  selectedIds,
  onChange,
  multiple = false,
  emptyLabel = 'No one',
  helper,
}: FriendTagPickerProps) {
  function choose(friendId?: string) {
    void Haptics.selectionAsync();
    if (!friendId) {
      onChange([]);
      return;
    }
    if (!multiple) {
      onChange([friendId]);
      return;
    }
    onChange(selectedIds.includes(friendId)
      ? selectedIds.filter((id) => id !== friendId)
      : [...selectedIds, friendId]);
  }

  const nobodySelected = selectedIds.length === 0;

  return <View style={styles.wrap}>
    <ScrollView
      horizontal
      directionalLockEnabled
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.options}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${emptyLabel}, do not tag a friend`}
        accessibilityState={{ selected: nobodySelected }}
        onPress={() => choose()}
        style={({ pressed }) => [styles.option, nobodySelected && styles.optionSelected, pressed && styles.optionPressed]}
      >
        <View style={[styles.emptyAvatar, nobodySelected && styles.avatarSelected]}>
          <UserRoundX size={18} color={colors.ink} />
        </View>
        <Text numberOfLines={1} style={[styles.optionText, nobodySelected && styles.optionTextSelected]}>{emptyLabel}</Text>
        {nobodySelected ? <View style={styles.check}><Check size={12} color={colors.ink} strokeWidth={3} /></View> : null}
      </Pressable>

      {friends.map((friend) => {
        const selected = selectedIds.includes(friend.id);
        return <Pressable
          key={friend.id}
          accessibilityRole="button"
          accessibilityLabel={`${selected ? 'Remove' : 'Tag'} ${friend.name}`}
          accessibilityState={{ selected }}
          onPress={() => choose(friend.id)}
          style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}
        >
          <Avatar name={friend.name} uri={friend.customProfileImage || friend.profileImage} size={30} color={colors.sky} />
          <Text numberOfLines={1} style={[styles.optionText, selected && styles.optionTextSelected]}>{friend.name}</Text>
          {selected ? <View style={styles.check}><Check size={12} color={colors.ink} strokeWidth={3} /></View> : null}
        </Pressable>;
      })}
    </ScrollView>
    {helper ? <Text style={styles.helper}>{helper}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  options: { gap: 9, paddingRight: 4 },
  option: { minHeight: 46, maxWidth: 188, paddingHorizontal: 8, paddingRight: 12, borderRadius: 24, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8, ...border },
  optionSelected: { backgroundColor: colors.citrus, borderWidth: 2 },
  optionPressed: { transform: [{ translateY: 2 }] },
  emptyAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperDeep, ...border },
  avatarSelected: { backgroundColor: colors.white },
  optionText: { flexShrink: 1, fontFamily: type.medium, color: colors.ink, fontSize: 14 },
  optionTextSelected: { fontFamily: type.heavy },
  check: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line },
  helper: { fontFamily: type.regular, color: colors.muted, fontSize: 12, lineHeight: 17 },
});
