/**
 * Memoria de sesión de la app: datos ya cargados y estado de cada pantalla.
 *
 * Usa sessionStorage: sobrevive mientras la app sigue abierta (cambiar de
 * pestaña, ir a otra app y volver) y se borra al cerrarla del todo.
 */

const PREFIX = "fuerza_session_v1:";

/** Copia en memoria para no parsear JSON en cada lectura. */
const memory = new Map<string, unknown>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSession<T>(key: string): T | undefined {
  if (memory.has(key)) return memory.get(key) as T;
  const raw = storage()?.getItem(PREFIX + key);
  if (raw == null) return undefined;
  try {
    const value = JSON.parse(raw) as T;
    memory.set(key, value);
    return value;
  } catch {
    return undefined;
  }
}

export function writeSession(key: string, value: unknown): void {
  memory.set(key, value);
  try {
    storage()?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Cuota llena o modo privado: queda al menos en memoria
  }
}

/** Borra las claves que empiezan por `prefix` (o todas si no se indica). */
export function clearSession(prefix = ""): void {
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  const s = storage();
  if (!s) return;
  try {
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i);
      if (k && k.startsWith(PREFIX + prefix)) s.removeItem(k);
    }
  } catch {
    // Ignorar
  }
}

/* ---- Datos de la API (se muestran al instante y se actualizan en segundo plano) ---- */

const dataKey = (url: string) => `data:${url}`;

export function readCachedJson<T>(url: string): T | undefined {
  return readSession<T>(dataKey(url));
}

/** Una copia más nueva que esto no se vuelve a pedir al servidor (ahorra lecturas de la base). */
export const FRESH_MS = 60 * 1000;

/** Hora en que se guardó la copia. Empieza igual que la clave de datos, así se invalida junto con ella. */
const atKey = (url: string) => `${dataKey(url)}#at`;

/** ¿La copia guardada de esta URL tiene menos de `maxAgeMs`? */
export function isCachedFresh(url: string, maxAgeMs = FRESH_MS, now = Date.now()): boolean {
  const at = readSession<number>(atKey(url));
  return typeof at === "number" && readCachedJson(url) !== undefined && now - at < maxAgeMs;
}

/**
 * GET con caché de sesión: si la respuesta es correcta se guarda para que la
 * próxima visita a la pantalla la pinte sin esperar. Si la copia es reciente
 * (menos de 60 s), ni siquiera se pide: pasar de una pantalla a otra no vuelve a leer la base.
 * Tras guardar o borrar se llama invalidateCachedJson, así que lo nuevo aparece enseguida.
 */
export async function fetchJsonCached<T>(url: string, opts: { maxAgeMs?: number } = {}): Promise<{ ok: boolean; data: T; status?: number; fromCache?: boolean }> {
  if (isCachedFresh(url, opts.maxAgeMs)) return { ok: true, data: readCachedJson<T>(url)!, fromCache: true };
  const res = await fetch(url);
  const data = (await res.json()) as T;
  if (res.ok) {
    writeSession(dataKey(url), data);
    writeSession(atKey(url), Date.now());
  }
  return { ok: res.ok, data, status: res.status };
}

/** Tras guardar o borrar algo, la copia de esa URL deja de ser válida. */
export function invalidateCachedJson(...urls: string[]): void {
  for (const url of urls) clearSession(dataKey(url));
}
