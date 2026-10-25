/**
 * Caché corta en memoria del servidor para lecturas de Firestore que cambian poco.
 *
 * Firebase gratis da 50.000 lecturas al día; varias pantallas y cada mensaje del chat
 * piden los mismos entrenos y pesajes una y otra vez. Con esto, pedidos repetidos dentro
 * de la ventana no vuelven a leer la base. Al guardar o borrar se olvida lo del perfil.
 *
 * En Vercel cada instancia tiene su propia memoria: no es compartida, pero cubre el caso
 * común (navegar entre pantallas seguido).
 */

export const SERVER_CACHE_MS = 60 * 1000;

type Entry = { at: number; value: Promise<unknown> };
const entries = new Map<string, Entry>();

/** Devuelve lo guardado si tiene menos de `ttlMs`; si no, lo carga y lo guarda. Un error no se guarda. */
export function cachedRead<T>(key: string, load: () => Promise<T>, ttlMs = SERVER_CACHE_MS): Promise<T> {
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = load().catch((err) => {
    if (entries.get(key)?.value === value) entries.delete(key);
    throw err;
  });
  entries.set(key, { at: Date.now(), value });
  return value;
}

/** Olvida todo lo guardado de un perfil (tras crear, editar o borrar algo). */
export function forgetCached(profileId: string): void {
  for (const key of [...entries.keys()]) {
    if (key.startsWith(`${profileId}:`)) entries.delete(key);
  }
}

/** Solo para pruebas. */
export function clearServerCache(): void {
  entries.clear();
}
