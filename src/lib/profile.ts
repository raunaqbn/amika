export const MAX_PROFILE_STATUS_LENGTH = 139;
export const MAX_PROFILE_INTERESTS = 20;
export const MAX_PROFILE_INTEREST_LENGTH = 50;

export class ProfileInputError extends Error {}

export function normalizeProfileStatus(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw new ProfileInputError('Status must be text.');

  const status = value.trim();
  if ([...status].length > MAX_PROFILE_STATUS_LENGTH) {
    throw new ProfileInputError(`Status must be ${MAX_PROFILE_STATUS_LENGTH} characters or fewer.`);
  }
  return status || null;
}

export function normalizeProfileInterests(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) throw new ProfileInputError('Interests must be a list.');

  const interests = value.map((item) => {
    if (typeof item !== 'string') throw new ProfileInputError('Each interest must be text.');
    const interest = item.trim();
    if (!interest) throw new ProfileInputError('Interests cannot be empty.');
    if ([...interest].length > MAX_PROFILE_INTEREST_LENGTH) {
      throw new ProfileInputError(`Each interest must be ${MAX_PROFILE_INTEREST_LENGTH} characters or fewer.`);
    }
    return interest;
  });

  const uniqueInterests = [...new Set(interests)];
  if (uniqueInterests.length > MAX_PROFILE_INTERESTS) {
    throw new ProfileInputError(`Choose up to ${MAX_PROFILE_INTERESTS} interests.`);
  }
  return uniqueInterests.length ? uniqueInterests : null;
}

export function parseStoredInterests(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
