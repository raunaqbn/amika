import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, shadow, type } from '@/lib/theme';

export function MemorySeedling({ size = 52 }: { size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M51 26C55 12 68 7 82 10C81 25 70 34 55 32Z" fill={colors.moss} />
        <Path d="M50 27C48 34 48 40 50 45" stroke={colors.mossDeep} strokeWidth="4" strokeLinecap="round" />
        <Path d="M16 61C16 42 31 33 50 34C70 34 84 43 84 62C84 81 70 90 50 90C30 90 16 81 16 61Z" fill={colors.terracotta} />
        <Circle cx="40" cy="61" r="3.2" fill={colors.mossDeep} />
        <Circle cx="60" cy="61" r="3.2" fill={colors.mossDeep} />
        <Path d="M43 70Q50 76 57 70" stroke={colors.mossDeep} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

export function MemorySavedCelebration({ visible, friendName }: { visible: boolean; friendName?: string }) {
  const arrival = useRef(new Animated.Value(0)).current;
  const unfurl = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) { arrival.setValue(0); unfurl.setValue(0); return; }
    Animated.sequence([
      Animated.timing(arrival, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(unfurl, { toValue: 1, damping: 10, stiffness: 150, mass: .65, useNativeDriver: true }),
    ]).start();
  }, [arrival, unfurl, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View pointerEvents="none" style={styles.overlay}>
        <Animated.View style={[styles.halo, { opacity: arrival, transform: [{ scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [.55, 1] }) }] }]} />
        <Animated.View style={[styles.celebration, { opacity: arrival, transform: [{ translateY: arrival.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [.95, 1] }) }] }]}>
          <Animated.View style={{ transform: [{ rotate: unfurl.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '0deg'] }) }, { scale: unfurl.interpolate({ inputRange: [0, 1], outputRange: [.88, 1] }) }] }}>
            <MemorySeedling size={118} />
          </Animated.View>
          <View style={styles.memoryDots}>
            <Animated.View style={[styles.memoryDot, { opacity: unfurl, transform: [{ translateY: unfurl.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]} />
            <Animated.View style={[styles.memoryDotSmall, { opacity: unfurl }]} />
          </View>
          <Text style={styles.savedTitle}>Memory tucked in.</Text>
          <Text style={styles.savedBody}>{friendName ? `Your Memory Seedling kept this one with ${friendName}.` : 'Your Memory Seedling kept this one safe.'}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(57,66,56,.25)' },
  halo: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: 'rgba(232,176,128,.32)' },
  celebration: { width: '100%', maxWidth: 380, alignItems: 'center', padding: 24, borderRadius: 26, backgroundColor: colors.white, ...shadow },
  memoryDots: { position: 'absolute', top: 42, right: 92, width: 48, height: 42 },
  memoryDot: { position: 'absolute', right: 4, bottom: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.butter },
  memoryDotSmall: { position: 'absolute', right: 0, top: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.apricot },
  savedTitle: { marginTop: 8, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 22 },
  savedBody: { maxWidth: 270, marginTop: 6, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
