import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIRECTORY = `${FileSystem.cacheDirectory || ''}amika-data-cache/`;

function fingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function cacheUri(token: string, key: string) {
  return `${CACHE_DIRECTORY}${fingerprint(token)}-${key}.json`;
}

async function ensureCacheDirectory() {
  if (!FileSystem.cacheDirectory) return false;
  const info = await FileSystem.getInfoAsync(CACHE_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true });
  }
  return true;
}

export async function readPersistentCache<T>(token: string | null | undefined, key: string) {
  if (!token || !FileSystem.cacheDirectory) return undefined;
  try {
    const uri = cacheUri(token, key);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return undefined;
    return JSON.parse(await FileSystem.readAsStringAsync(uri)) as T;
  } catch {
    return undefined;
  }
}

export async function writePersistentCache(token: string | null | undefined, key: string, value: unknown) {
  if (!token) return;
  try {
    if (!(await ensureCacheDirectory())) return;
    await FileSystem.writeAsStringAsync(cacheUri(token, key), JSON.stringify(value));
  } catch {
    // Cache writes are best-effort and should never interrupt the app.
  }
}

export async function removePersistentCache(token: string | null | undefined, keys: string[]) {
  if (!token || !FileSystem.cacheDirectory) return;
  await Promise.all(keys.map(async (key) => {
    try {
      const uri = cacheUri(token, key);
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // A missing or already-purged cache file needs no recovery.
    }
  }));
}
