/**
 * Contador de lecturas de Firestore (para saber cuánto gasta cada parte de la app).
 *
 * Cada función que lee la base llama a countReads con los documentos que trajo. Con
 * FIRESTORE_LOG_READS=1 (o en desarrollo) se escribe en el registro del servidor:
 *   [firestore] listWorkouts → 41 lecturas (hoy en este servidor: 1.230)
 */

let total = 0;
let day = "";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function shouldLog(): boolean {
  return process.env.FIRESTORE_LOG_READS === "1" || process.env.NODE_ENV === "development";
}

export function countReads(label: string, docs: number): void {
  const d = today();
  if (d !== day) {
    day = d;
    total = 0;
  }
  // Firestore cobra al menos 1 lectura por consulta, aunque no traiga documentos.
  const reads = Math.max(1, docs);
  total += reads;
  if (shouldLog()) console.info(`[firestore] ${label} → ${reads} lecturas (hoy en este servidor: ${total.toLocaleString("es-CO")})`);
}

export function readsToday(): number {
  return day === today() ? total : 0;
}
