import { Platform, StyleSheet } from 'react-native';

export const colors = {
  ink: '#394238',
  paper: '#F7EEDF',
  paperDeep: '#F1E4D2',
  white: '#FFFAF2',
  moss: '#59674D',
  mossDeep: '#394238',
  apricot: '#E8B080',
  apricotSoft: '#F3D5BE',
  terracotta: '#BF7057',
  butter: '#F2DBA6',
  flax: '#DCCFB9',
  periwinkle: '#E8B080',
  periwinkleDark: '#8F513F',
  citrus: '#E8B080',
  rose: '#D98B76',
  sage: '#DDE5D8',
  sky: '#DCE8DB',
  muted: '#625C52',
  danger: '#A7493D',
  line: '#DCCFB9',
};

export const type = {
  regular: Platform.select({ ios: 'Avenir', android: 'sans-serif', default: 'Avenir' }),
  medium: Platform.select({ ios: 'Avenir-Medium', android: 'sans-serif-medium', default: 'Avenir' }),
  heavy: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif', default: 'Avenir' }),
};

export const shadow = {
  shadowColor: '#594B39',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: .11,
  shadowRadius: 18,
  elevation: 4,
};

export const border = { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.flax };

export const directionContract = {
  thesis: 'Daily memory capture for real friendships—not a generic social feed or planning dashboard.',
  world: 'Oat cream, baked apricot, deep moss, terracotta warmth, quiet flax edges, and the abstract Pebble Pair.',
  story: 'Open fresh stories from your circle, keep one small memory, choose its people and privacy, then watch the Pebble Pair bring it home.',
  firstViewport: 'Stories lead a warm cream home feed; a native five-tab bar keeps Add Memory in the center.',
  form: 'Apricot Moss with native iOS Liquid Glass navigation and soft, organic memory surfaces.',
} as const;
