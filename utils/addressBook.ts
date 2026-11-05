import AsyncStorage from '@react-native-async-storage/async-storage';

/* Saved delivery addresses. The API has no address book, so they live on this
   phone, one list per signed-in account. They are not shared across devices. */

export interface SavedAddress {
  id: string;
  /** Home, Work, or whatever the person called it. */
  label: string;
  line1: string;
  city: string;
  phone?: string;
  isDefault?: boolean;
}

const keyFor = (userId: string | number | undefined | null) => `@wami_addresses_${userId ?? 'guest'}`;

export async function loadAddresses(userId: string | number | undefined | null): Promise<SavedAddress[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const list: SavedAddress[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function write(userId: string | number | undefined | null, list: SavedAddress[]): Promise<SavedAddress[]> {
  // Exactly one default, and it comes first; with none chosen the first is it.
  const defaultId = list.find((a) => a.isDefault)?.id ?? list[0]?.id;
  const tidy = list
    .map((a) => ({ ...a, isDefault: a.id === defaultId }))
    .sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(tidy));
  return tidy;
}

/** Adds an address, or updates it when `id` is given. The first one saved becomes the default. */
export async function saveAddress(
  userId: string | number | undefined | null,
  address: Omit<SavedAddress, 'id'> & { id?: string }
): Promise<SavedAddress[]> {
  const list = await loadAddresses(userId);
  const id = address.id ?? `${Date.now()}`;
  const next: SavedAddress = { ...address, id, line1: address.line1.trim(), city: address.city.trim(), label: address.label.trim() || 'Home' };
  const exists = list.some((a) => a.id === id);
  const merged = exists ? list.map((a) => (a.id === id ? next : a)) : [...list, next];
  // Setting this one as the default clears the others.
  const final = next.isDefault ? merged.map((a) => ({ ...a, isDefault: a.id === id })) : merged;
  return write(userId, final);
}

export async function deleteAddress(userId: string | number | undefined | null, id: string): Promise<SavedAddress[]> {
  const list = await loadAddresses(userId);
  return write(userId, list.filter((a) => a.id !== id));
}

export async function setDefaultAddress(userId: string | number | undefined | null, id: string): Promise<SavedAddress[]> {
  const list = await loadAddresses(userId);
  return write(userId, list.map((a) => ({ ...a, isDefault: a.id === id })));
}

/** True when this street and city are already saved, ignoring case and spacing. */
export function hasAddress(list: SavedAddress[], line1: string, city: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return list.some((a) => norm(a.line1) === norm(line1) && norm(a.city) === norm(city));
}
