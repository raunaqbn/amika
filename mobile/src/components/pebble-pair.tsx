import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors, shadow, type } from '@/lib/theme';

function PebbleFace({ width, height, looks, cheek }: { width: number; height: number; looks: 'left' | 'right'; cheek: string }) {
  const eyeRadius = Math.max(1.55, width * .047);
  const shift = looks === 'right' ? width * .03 : -width * .03;
  const smileStart = width * .39 + shift;
  const smileEnd = width * .62 + shift;
  const smileY = height * .58;

  return <Svg pointerEvents="none" width={width} height={height} style={styles.face}>
    <Circle cx={width * .31 + shift} cy={height * .38} r={eyeRadius} fill={colors.expression} />
    <Circle cx={width * .57 + shift} cy={height * .36} r={eyeRadius} fill={colors.expression} />
    <Path
      d={`M ${smileStart} ${smileY} Q ${width * .51 + shift} ${height * .68} ${smileEnd} ${smileY - height * .018}`}
      stroke={colors.expression}
      strokeWidth={Math.max(1.15, width * .028)}
      strokeLinecap="round"
      fill="none"
    />
    <Ellipse
      cx={looks === 'right' ? width * .77 : width * .16}
      cy={height * .58}
      rx={width * .07}
      ry={height * .038}
      fill={cheek}
      opacity={.82}
    />
  </Svg>;
}

export function PebblePair({ size = 52 }: { size?: number }) {
  const largeWidth = size * .63;
  const largeHeight = size * .64;
  const smallWidth = size * .45;
  const smallHeight = size * .46;

  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.pair, { width: size, height: size * .78 }]}>
    <View style={[styles.large, { width: largeWidth, height: largeHeight, borderRadius: size * .32 }]}>
      <PebbleFace width={largeWidth} height={largeHeight} looks="right" cheek={colors.apricot} />
    </View>
    <View style={[styles.small, { width: smallWidth, height: smallHeight, borderRadius: size * .24 }]}>
      <PebbleFace width={smallWidth} height={smallHeight} looks="left" cheek={colors.butter} />
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
          <Animated.View style={{ transform: [{ translateX: reunion.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }, { rotate: '-7deg' }] }}>
            <View style={styles.celebrateLarge}><PebbleFace width={96} height={94} looks="right" cheek={colors.apricot} /></View>
          </Animated.View>
          <Animated.View style={{ marginLeft: -15, marginTop: 30, transform: [{ translateX: reunion.interpolate({ inputRange: [0, 1], outputRange: [54, 0] }) }, { translateY: reunion.interpolate({ inputRange: [0, 1], outputRange: [-42, 0] }) }, { rotate: '8deg' }] }}>
            <View style={styles.celebrateSmall}><PebbleFace width={66} height={64} looks="left" cheek={colors.butter} /></View>
          </Animated.View>
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
  face: { position: 'absolute', left: 0, top: 0 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(57,66,56,.25)' },
  halo: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: 'rgba(232,176,128,.32)' },
  celebration: { width: '100%', maxWidth: 380, alignItems: 'center', padding: 24, borderRadius: 26, backgroundColor: colors.white, ...shadow },
  reunion: { height: 118, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  celebrateLarge: { width: 96, height: 94, overflow: 'hidden', borderRadius: 48, backgroundColor: colors.moss },
  celebrateSmall: { width: 66, height: 64, overflow: 'hidden', borderRadius: 33, backgroundColor: colors.terracotta },
  savedTitle: { marginTop: 8, fontFamily: type.heavy, color: colors.mossDeep, fontSize: 22 },
  savedBody: { maxWidth: 270, marginTop: 6, fontFamily: type.regular, color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
