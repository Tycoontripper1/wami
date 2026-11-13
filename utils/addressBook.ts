import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiAddress,
  createAddress,
  listAddresses,
  removeAddress,
  updateAddress,
} from '@/services/api/addressesService';

/* Saved delivery addresses. They live on the account (GET/POST/PATCH/DELETE
   /addresses), so they follow the person to a new phone. A copy is kept on the
   phone as a cache and as a fallback when the server cannot be reached, and
   addresses saved on a phone before the server had an address book are
   uploaded to the account once, the first time the list loads. */

export interface SavedAddress {
  id: string;
  /** Home, Work, or whatever the person called it. */
  label: string;
  line1: string;
  city: string;
  state?: string;
  phone?: string;
  isDefault?: boolean;
  /** True when the address is on the account (its id is the server's id). */
  synced?: boolean;
}

type UserKey = string | number | undefined | null;

const keyFor = (userId: UserKey) => `@wami_addresses_${userId ?? 'guest'}`;
const movedKey = (userId: UserKey) => `@wami_addresses_moved_${userId ?? 'guest'}`;

async function readLocal(userId: UserKey): Promise<SavedAddress[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const list: SavedAddress[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Exactly one default, and it comes first; with none chosen the first is it.
function tidy(list: SavedAddress[]): SavedAddress[] {
  const defaultId = list.find((a) => a.isDefault)?.id ?? list[0]?.id;
  return list.map((a) => ({ ...a, isDefault: a.id === defaultId })).sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
}

async function writeLocal(userId: UserKey, list: SavedAddress[]): Promise<SavedAddress[]> {
  const out = tidy(list);
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(out));
  return out;
}

const fromApi = (a: ApiAddress): SavedAddress => ({
  id: String(a.id),
  label: a.label || 'Home',
  line1: a.line1,
  city: a.city,
  state: a.state || undefined,
  phone: a.phone || undefined,
  isDefault: a.is_default === true || a.is_default === 1,
  synced: true,
});

/** True when this street and city are already saved, ignoring case and spacing. */
export function hasAddress(list: SavedAddress[], line1: string, city: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return list.some((a) => norm(a.line1) === norm(line1) && norm(a.city) === norm(city));
}

/* Reads the account's list and caches it. The first time, any address that was
   only on this phone is uploaded, then the list is read again. */
async function loadFromServer(userId: UserKey): Promise<SavedAddress[]> {
  let remote = (await listAddresses()).map(fromApi);
  if (!(await AsyncStorage.getItem(movedKey(userId)))) {
    const local = (await readLocal(userId)).filter((a) => !a.synced && !hasAddress(remote, a.line1, a.city));
    let failed = false;
    for (const a of local) {
      try {
        await createAddress({ label: a.label, line1: a.line1, city: a.city, country: 'Nigeria', phone: a.phone, is_default: !!a.isDefault && !remote.some((r) => r.isDefault) });
      } catch {
        failed = true;
      }
    }
    if (local.length && !failed) remote = (await listAddresses()).map(fromApi);
    if (!failed) await AsyncStorage.setItem(movedKey(userId), '1');
  }
  return writeLocal(userId, remote);
}

export async function loadAddresses(userId: UserKey): Promise<SavedAddress[]> {
  try {
    return await loadFromServer(userId);
  } catch {
    return readLocal(userId);
  }
}

/** Adds an address, or updates it when `id` is given. The first one saved becomes the default. */
export async function saveAddress(userId: UserKey, address: Omit<SavedAddress, 'id'> & { id?: string }): Promise<SavedAddress[]> {
  const clean = { label: address.label.trim() || 'Home', line1: address.line1.trim(), city: address.city.trim(), phone: address.phone };
  const current = await readLocal(userId);
  const existing = address.id ? current.find((a) => a.id === address.id) : undefined;
  try {
    if (existing?.synced) {
      await updateAddress(existing.id, { ...clean, country: 'Nigeria', is_default: !!address.isDefault || undefined });
    } else {
      await createAddress({ ...clean, country: 'Nigeria', is_default: !!address.isDefault || current.length === 0 });
    }
    return await loadFromServer(userId);
  } catch {
    // Offline or an older server: keep it on the phone so nothing is lost.
    const id = address.id ?? `${Date.now()}`;
    const next: SavedAddress = { ...address, ...clean, id };
    const merged = current.some((a) => a.id === id) ? current.map((a) => (a.id === id ? next : a)) : [...current, next];
    return writeLocal(userId, next.isDefault ? merged.map((a) => ({ ...a, isDefault: a.id === id })) : merged);
  }
}

export async function deleteAddress(userId: UserKey, id: string): Promise<SavedAddress[]> {
  const current = await readLocal(userId);
  const target = current.find((a) => a.id === id);
  try {
    if (target?.synced) {
      await removeAddress(id);
      return await loadFromServer(userId);
    }
  } catch {
    // fall through: remove it from the phone's copy at least
  }
  return writeLocal(userId, current.filter((a) => a.id !== id));
}

export async function setDefaultAddress(userId: UserKey, id: string): Promise<SavedAddress[]> {
  const current = await readLocal(userId);
  const target = current.find((a) => a.id === id);
  try {
    if (target?.synced) {
      await updateAddress(id, { is_default: true });
      return await loadFromServer(userId);
    }
  } catch {
    // fall through to the phone's copy
  }
  return writeLocal(userId, current.map((a) => ({ ...a, isDefault: a.id === id })));
}
