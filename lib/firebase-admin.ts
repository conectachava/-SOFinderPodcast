import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
let rawFirebaseConfig: Record<string, any> = {};
try {
  rawFirebaseConfig = require('../firebase-applet-config.json');
} catch {
  rawFirebaseConfig = {};
}

const projectId = (
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  rawFirebaseConfig.projectId ||
  'vsnry-labs-b4d4f'
).trim();

const databaseId =
  process.env.FIRESTORE_DATABASE_ID ||
  (rawFirebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  undefined;

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();
  if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
    formatted = formatted.slice(1, -1);
  }
  return formatted.replace(/\\n/g, '\n');
}

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  let serviceAccountKeyObj: any = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccountKeyObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (serviceAccountKeyObj.private_key) {
        serviceAccountKeyObj.private_key = formatPrivateKey(serviceAccountKeyObj.private_key);
      }
    } catch (e) {
      console.warn('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  if (serviceAccountKeyObj) {
    try {
      return initializeApp({
        credential: cert(serviceAccountKeyObj),
        projectId: serviceAccountKeyObj.project_id || projectId,
        storageBucket: rawFirebaseConfig.storageBucket || undefined,
      });
    } catch (e) {
      console.warn('[Firebase Admin] Failed initializing with FIREBASE_SERVICE_ACCOUNT_KEY, falling back:', e);
    }
  }

  if (clientEmail && privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
        storageBucket: rawFirebaseConfig.storageBucket || undefined,
      });
    } catch (e) {
      console.warn('[Firebase Admin] Failed initializing with cert credential, falling back to default ADC:', e);
    }
  }

  return initializeApp({
    projectId,
    storageBucket: rawFirebaseConfig.storageBucket || undefined,
  });
}

let cachedDb: Firestore | null = null;
export function getAdminDb(): Firestore {
  if (!cachedDb) {
    const adminApp = getAdminApp();
    cachedDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
  }
  return cachedDb;
}

let cachedAuth: Auth | null = null;
export function getAdminAuth(): Auth {
  if (!cachedAuth) {
    const adminApp = getAdminApp();
    cachedAuth = getAuth(adminApp);
  }
  return cachedAuth;
}

export async function verifyIdToken(idToken: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    console.warn('[Firebase Admin] Verify ID token error/warning:', err);
    return null;
  }
}


