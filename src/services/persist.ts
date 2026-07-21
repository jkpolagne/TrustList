/** Backs the mutable mock stores with localStorage so admin actions (approve,
 * reject, convert, status changes) survive a reload or a second tab — both of
 * which happen naturally while demoing the public hub next to the admin view. */
export function loadPersisted<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : seed;
  } catch {
    return seed;
  }
}

export function savePersisted<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — falls back to in-memory only for this session
  }
}
