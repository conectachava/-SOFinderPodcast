import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, setDoc, getDoc, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

let authInstance: any = undefined;

export const auth: any = (() => {
  if (typeof window === 'undefined') return undefined;
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
})();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore as per security standards.
 */
export async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, '_system_', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

let dbInstance: any = undefined;
let storageInstance: any = undefined;

export const db: any = (() => {
  if (typeof window === 'undefined') return undefined;
  if (!dbInstance) {
    dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
  return dbInstance;
})();

export const storage: any = (() => {
  if (typeof window === 'undefined') return undefined;
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
})();

/**
 * Utilitario para limpiar la caché de persistencia de Firestore.
 */
export async function clearFirestoreAuthCache(): Promise<boolean> {
  try {
    // 2. Limpiar IndexedDB de Firestore y Firebase Auth local storage
    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        if (indexedDB.databases) {
          const dbs = await indexedDB.databases().catch(() => []);
          for (const dbInfo of dbs) {
            if (
              dbInfo.name &&
              (dbInfo.name.toLowerCase().includes("firebase") ||
                dbInfo.name.toLowerCase().includes("firestore") ||
                dbInfo.name.toLowerCase().includes("firebaselocalstorage"))
            ) {
              try {
                indexedDB.deleteDatabase(dbInfo.name);
              } catch (e) { }
            }
          }
        }

        // Borrado explícito de bases conocidas de Firebase/Firestore
        const knownDBs = [
          "firebaseLocalStorageDb",
          "firestore/[DEFAULT]/[DEFAULT]/main",
          "firestore/[DEFAULT]",
          "firebase-heartbeat-database",
          "firebase-installations-database",
        ];
        for (const dbName of knownDBs) {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (e) { }
        }
      } catch (idbErr) {
        console.warn("[clearFirestoreAuthCache] IndexedDB notice:", idbErr);
      }
    }

    // 3. Limpiar LocalStorage y SessionStorage relacionados
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        if (window.localStorage) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.toLowerCase().includes("firebase") ||
                key.toLowerCase().includes("firestore") ||
                key.toLowerCase().includes("auth") ||
                key.startsWith("sf_auth"))
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => {
            try { localStorage.removeItem(k); } catch (e) { }
          });
        }
        if (window.sessionStorage) {
          try { sessionStorage.clear(); } catch (e) { }
        }
      } catch (e) {
        console.warn("[clearFirestoreAuthCache] Error al limpiar Storage:", e);
      }
    }

    console.log("[clearFirestoreAuthCache] Caché de Firestore y Autenticación eliminada con éxito.");
    return true;
  } catch (error) {
    console.warn("[clearFirestoreAuthCache] Error prevenido:", error);
    return false;
  }
}

/**
 * Operación de escritura atómica en Firestore con manejo robusto de errores y registro de eventos
 */
export async function safeSetDoc(docRef: any, data: any, options?: any) {
  const { logger } = await import("./logger");
  try {
    const res = await setDoc(docRef, data, options);
    logger.info(`[FS_WRITE_SUCCESS] Escritura en Firestore confirmada en '${docRef?.path || "documento"}'`, { path: docRef?.path }, "Firestore");
    return res;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, docRef?.path || null);
  }
}

/**
 * Operación de lectura segura en Firestore
 */
export async function safeGetDoc(docRef: any) {
  const { logger } = await import("./logger");
  try {
    const docSnap = await getDoc(docRef);
    logger.info(`[FS_READ_SUCCESS] Lectura de Firestore completada en '${docRef?.path || "documento"}'`, { path: docRef?.path, exists: docSnap.exists() }, "Firestore");
    return docSnap;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, docRef?.path || null);
  }
}

