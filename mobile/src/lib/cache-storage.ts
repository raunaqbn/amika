import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIRECTORY = `${FileSystem.cacheDirectory || ''}amika-data-cache/`;
const DOCUMENT_DIRECTORY = `${FileSystem.documentDirectory || ''}amika-private-data/`;

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

async function ensureDocumentDirectory() {
  if (!FileSystem.documentDirectory) return false;
  const info = await FileSystem.getInfoAsync(DOCUMENT_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCUMENT_DIRECTORY, { intermediates: true });
  }
  return true;
}

function documentUri(token: string, key: string) {
  return `${DOCUMENT_DIRECTORY}${fingerprint(token)}-${key}.json`;
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

export async function readDurableData<T>(token: string | null | undefined, key: string) {
  if (!token || !FileSystem.documentDirectory) return undefined;
  try {
    const uri = documentUri(token, key);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return undefined;
    return JSON.parse(await FileSystem.readAsStringAsync(uri)) as T;
  } catch {
    return undefined;
  }
}

export async function writeDurableData(token: string | null | undefined, key: string, value: unknown) {
  if (!token) throw new Error('Sign in again to save this draft.');
  if (!(await ensureDocumentDirectory())) throw new Error('Draft storage is unavailable on this device.');
  await FileSystem.writeAsStringAsync(documentUri(token, key), JSON.stringify(value));
}

export async function removeDurableData(token: string | null | undefined, keys: string[]) {
  if (!token || !FileSystem.documentDirectory) return;
  await Promise.all(keys.map(async (key) => {
    const uri = documentUri(token, key);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  }));
}
