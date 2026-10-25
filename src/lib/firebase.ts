import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function loadCredentials() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    const parsed = JSON.parse(json) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function isFirebaseConfigured(): boolean {
  return loadCredentials() !== null;
}

/**
 * ¿El error es porque se agotó la cuota diaria de Firestore? (gRPC 8 / RESOURCE_EXHAUSTED).
 * En el plan gratuito pasa al superar 50.000 lecturas o 20.000 escrituras en el día.
 */
export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown; details?: unknown };
  if (e.code === 8 || e.code === "resource-exhausted" || e.code === "RESOURCE_EXHAUSTED") return true;
  const text = `${typeof e.message === "string" ? e.message : ""} ${typeof e.details === "string" ? e.details : ""}`;
  return /RESOURCE_EXHAUSTED|Quota exceeded/i.test(text);
}

/** Mensaje para la persona cuando la base llegó a su límite del día. */
export const QUOTA_MESSAGE =
  "La base de datos llegó a su límite de hoy. Se restablece hacia las 2:00 a. m. (hora de Colombia). Lo que no se pudo guardar sigue en este teléfono.";

/** Solo para probar: FIRESTORE_SIMULATE_QUOTA=1 hace que toda operación falle como si se hubiera agotado la cuota. */
function simulateQuota(): void {
  if (process.env.FIRESTORE_SIMULATE_QUOTA === "1") {
    throw Object.assign(new Error("8 RESOURCE_EXHAUSTED: Quota exceeded. (simulado)"), { code: 8 });
  }
}

export function getDb(): Firestore {
  simulateQuota();
  if (db) return db;

  const credentials = loadCredentials();
  if (!credentials) {
    throw new Error(
      "Firebase no está configurado. Define FIREBASE_SERVICE_ACCOUNT o FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.",
    );
  }

  if (!getApps().length) {
    app = initializeApp({
      credential: cert({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      }),
      projectId: credentials.projectId,
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  return db;
}
