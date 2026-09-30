import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
let rawFirebaseConfig: Record<string, any> = {};

const defaultProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'vsnry-labs-b4d4f';
const defaultAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${defaultProjectId}.firebaseapp.com`;
const defaultStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${defaultProjectId}.firebasestorage.app`;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || rawFirebaseConfig.apiKey || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || rawFirebaseConfig.authDomain || defaultAuthDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId || defaultProjectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket || defaultStorageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig.messagingSenderId || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || rawFirebaseConfig.appId || '1:000000000000:web:demo-app-id',
  firestoreDatabaseId: (rawFirebaseConfig as any).firestoreDatabaseId
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const storage = getStorage(app);

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
    logger.error(`[FS_SAVE_FAIL] Error al guardar documento en Firestore (${docRef?.path || "doc"}): ${err.message}`, {
      path: docRef?.path,
      error: err.message,
    }, "Firestore");
    throw err;
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
    logger.error(`[FS_SYNC_FAIL] Error de sincronización al leer Firestore (${docRef?.path || "doc"}): ${err.message}`, {
      path: docRef?.path,
      error: err.message,
    }, "Firestore");
    throw err;
  }
}

