import { Platform } from 'react-native';

export const colors = {
  ink: '#20201F',
  paper: '#F7F2E8',
  paperDeep: '#EEE7D9',
  white: '#FFFCF6',
  periwinkle: '#9EA8F8',
  periwinkleDark: '#6470CF',
  citrus: '#FFD44D',
  rose: '#F6A8A0',
  sage: '#A8CDAE',
  sky: '#A9D7F2',
  muted: '#746F68',
  danger: '#B94343',
  line: '#292826',
};

export const type = {
  regular: Platform.select({ ios: 'Avenir', android: 'sans-serif', default: 'Avenir' }),
  medium: Platform.select({ ios: 'Avenir-Medium', android: 'sans-serif-medium', default: 'Avenir' }),
  heavy: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif', default: 'Avenir' }),
};

export const shadow = {
  shadowColor: colors.ink,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,
};

export const border = { borderWidth: 1.5, borderColor: colors.line };

export const directionContract = {
  thesis: 'Daily memory capture for real friendships—not a generic social feed or planning dashboard.',
  world: 'Graphite ink, warm paper, periwinkle and citrus, crisp borders, hard print shadows, Avenir.',
  story: 'Capture today, choose the people and privacy, then save it into a shared friendship stream.',
  firstViewport: 'A periwinkle folded memory packet leads into a chronological tactile feed and five tabs.',
  form: 'Pocket Accordion; grounded structure candidate 6; seed 2e7d7b8a.',
} as const;
