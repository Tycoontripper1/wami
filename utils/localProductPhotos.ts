import AsyncStorage from '@react-native-async-storage/async-storage';

/* Stopgap for product photos.

   The backend has no upload route for product images: `media_url` only accepts
   an http(s) link, and a file sent with POST /products is ignored (verified
   against the live API). Until it can store an image, the photo a seller picks
   is remembered on this device against the listing's id, so their own screens
   (My Products, the shop on that phone) still show it. Buyers on other
   devices see nothing until the backend stores the image. Remove this once
   products return a real `media_url`. */

const KEY = '@wami_product_photos';

let cache: Record<string, string> = {};
let loading: Promise<void> | null = null;

/** Loads the remembered photos once; await it before mapping a list. */
export function loadLocalProductPhotos(): Promise<void> {
  if (!loading) {
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => {
        cache = raw ? JSON.parse(raw) : {};
      })
      .catch(() => {
        cache = {};
      });
  }
  return loading;
}

/** The remembered photo for a listing id, or '' (call after loadLocalProductPhotos). */
export function localProductPhoto(id: string | number | undefined | null): string {
  if (id === undefined || id === null) return '';
  return cache[String(id)] ?? '';
}

export async function rememberProductPhoto(id: string | number, uri: string): Promise<void> {
  await loadLocalProductPhotos();
  cache = { ...cache, [String(id)]: uri };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // kept in memory for this session at least
  }
}
