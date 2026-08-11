import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, shadow, type } from '@/lib/theme';

export function PebblePair({ size = 52 }: { size?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.pair, { width: size, height: size * .78 }]}>
    <View style={[styles.large, { width: size * .62, height: size * .7, borderRadius: size * .31 }]}>
      <View style={[styles.eye, { left: size * .19 }]} /><View style={[styles.eye, { left: size * .36 }]} />
    </View>
    <View style={[styles.small, { width: size * .43, height: size * .5, borderRadius: size * .22 }]}>
      <View style={[styles.eye, { left: size * .12 }]} /><View style={[styles.eye, { left: size * .25 }]} />
    </View>
  </View>;
}

export function MemorySavedCelebration({ visible, friendName }: { visible: boolean; friendName?: string }) {
  const arrival = useRef(new Animated.Value(0)).current;
  const reunion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) { arrival.setValue(0); reunion.setValue(0); return; }
    Animated.sequence([
      Animated.timing(arrival, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(reunion, { toValue: 1, damping: 9, stiffness: 135, mass: .7, useNativeDriver: true }),
    ]).start();
  }, [arrival, reunion, visible]);

  return <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.halo, { opacity: arrival, transform: [{ scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [.5, 1] }) }] }]} />
      <Animated.View style={[styles.celebration, { opacity: arrival, transform: [{ translateY: arrival.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [.94, 1] }) }] }]}>
        <View style={styles.reunion}>
          <Animated.View style={{ transform: [{ translateX: reunion.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }, { rotate: '-7deg' }] }}><View style={styles.celebrateLarge}><View style={[styles.eye, { left: 30 }]} /><View style={[styles.eye, { left: 52 }]} /></View></Animated.View>
          <Animated.View style={{ marginLeft: -15, marginTop: 28, transform: [{ translateX: reunion.interpolate({ inputRange: [0, 1], outputRange: [54, 0] }) }, { translateY: reunion.interpolate({ inputRange: [0, 1], outputRange: [-42, 0] }) }, { rotate: '8deg' }] }}><View style={styles.celebrateSmall}><View style={[styles.eye, { left: 18 }]} /><View style={[styles.eye, { left: 32 }]} /></View></Animated.View>
        </View>
        <Text style={styles.savedTitle}>Memory tucked in.</Text>
        <Text style={styles.savedBody}>{friendName ? `The Pebble Pair brought this one home with ${friendName}.` : 'The Pebble Pair brought this one safely home.'}</Text>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  pair: { position: 'relative' },
  large: { position: 'absolute', left: 0, bottom: 0, overflow: 'hidden', backgroundColor: colors.moss, transform: [{ rotate: '-7deg' }] },
  small: { position: 'absolute', right: 0, bottom: 1, overflow: 'hidden', backgroundColor: colors.terracotta, transform: [{ rotate: '8deg' }] },
  eye: { position: 'absolute', top: '41%', width: 3.5, height: 5, borderRadius: 3, backgroundColor: colors.white },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(57,66,56,.25)' },
  halo: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: 'rgba(232,176,128,.32)' },
  celebration: { width: '100%', maxWidth: 380, alignItems: 'center', padding: 24, borderRadius: 26, backgroundColor: colors.white, ...shadow },
  reunion: { height: 118, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  celebrateLarge: { width: 92, height: 106, overflow: 'hidden', borderRadius: 46, backgroundColor: colors.moss },
  celebrateSmall: { width: 64, height: 74, overflow: 'hidden', borderRadius: 32, backgroundColor: colors.terracotta },
  savedTitle: { marginTop: 8, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 22 },
  savedBody: { maxWidth: 270, marginTop: 6, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
