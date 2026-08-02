import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);

/**
 * Utilitario para limpiar la caché de autenticación y persistencia de Firestore/Firebase.
 * Resuelve bucles infinitos de "verificando sesión" causados por tokens expirados o estado local corrupto.
 */
export async function clearFirestoreAuthCache(): Promise<boolean> {
  try {
    // 1. Intentar cerrar sesión en Firebase Auth
    if (auth) {
      await auth.signOut().catch(() => {});
    }

    // 2. Limpiar IndexedDB de Firestore y Firebase Auth local storage
    if (typeof window !== "undefined" && window.indexedDB) {
      if (indexedDB.databases) {
        try {
          const dbs = await indexedDB.databases();
          for (const dbInfo of dbs) {
            if (
              dbInfo.name &&
              (dbInfo.name.toLowerCase().includes("firebase") ||
               dbInfo.name.toLowerCase().includes("firestore") ||
               dbInfo.name.toLowerCase().includes("firebaselocalstorage"))
            ) {
              indexedDB.deleteDatabase(dbInfo.name);
            }
          }
        } catch (e) {
          console.warn("[clearFirestoreAuthCache] Error al listar IndexedDBs:", e);
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
        } catch (e) {}
      }
    }

    // 3. Limpiar LocalStorage y SessionStorage relacionados
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
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
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (e) {
        console.warn("[clearFirestoreAuthCache] Error al limpiar Storage:", e);
      }
    }

    console.log("[clearFirestoreAuthCache] Caché de Firestore y Autenticación eliminada con éxito.");
    return true;
  } catch (error) {
    console.error("[clearFirestoreAuthCache] Error inesperado:", error);
    return false;
  }
}

