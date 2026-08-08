export const INTEREST_SUGGESTIONS = [
  { id: 'hiking', label: 'Hiking' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'cooking', label: 'Cooking together' },
  { id: 'movies', label: 'Movies' },
  { id: 'live-music', label: 'Live music' },
  { id: 'photography', label: 'Photography' },
  { id: 'weekend-getaways', label: 'Weekend getaways' },
  { id: 'reading', label: 'Reading' },
  { id: 'video-games', label: 'Video games' },
  { id: 'running', label: 'Running' },
  { id: 'brunch', label: 'Brunch' },
  { id: 'art-galleries', label: 'Art galleries' },
] as const;

const CUSTOM_PREFIX = 'custom:';

export function interestLabel(id: string) {
  if (id.startsWith(CUSTOM_PREFIX)) return id.slice(CUSTOM_PREFIX.length);
  const suggestion = INTEREST_SUGGESTIONS.find((item) => item.id === id);
  if (suggestion) return suggestion.label;
  return id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function customInterestId(label: string) {
  return `${CUSTOM_PREFIX}${label.trim()}`;
}
