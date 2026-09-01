import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getDatabase, Database } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';

let adminAppInstance: App | null = null;

export const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'fraudriskhub-4639',
  clientEmail: 'firebase-adminsdk-fbsvc@fraudriskhub-4639.iam.gserviceaccount.com',
  databaseURL: 'https://fraudriskhub-4639-default-rtdb.firebaseio.com',
};

/**
 * Lazy initialization of Firebase Admin SDK
 * Supports:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string or base64)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS
 * 3. FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL + FIREBASE_PROJECT_ID
 * 4. Application Default Credentials fallback
 */
export function getFirebaseAdminApp(): App {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAppInstance = existingApps[0]!;
    return adminAppInstance;
  }

  try {
    // Option 1: Inline JSON or base64 string
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      let parsedCreds: any;
      try {
        parsedCreds = JSON.parse(serviceAccountJson);
      } catch {
        const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        parsedCreds = JSON.parse(decoded);
      }

      adminAppInstance = initializeApp({
        credential: cert(parsedCreds),
        databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
        projectId: parsedCreds.project_id || DEFAULT_FIREBASE_CONFIG.projectId,
      });
      console.log('✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_KEY');
      return adminAppInstance;
    }

    // Option 2: File path
    const credPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(process.cwd(), 'serviceAccountKey.json');

    if (fs.existsSync(credPath)) {
      const fileContent = fs.readFileSync(credPath, 'utf8');
      const parsedCreds = JSON.parse(fileContent);
      adminAppInstance = initializeApp({
        credential: cert(parsedCreds),
        databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
        projectId: parsedCreds.project_id || DEFAULT_FIREBASE_CONFIG.projectId,
      });
      console.log(`✅ Firebase Admin initialized from service account file: ${credPath}`);
      return adminAppInstance;
    }

    // Option 3: Separate env vars (Private key, client email, project ID)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || DEFAULT_FIREBASE_CONFIG.clientEmail;
    const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId;

    if (privateKey && clientEmail) {
      adminAppInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
        projectId,
      });
      console.log('✅ Firebase Admin initialized from FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL');
      return adminAppInstance;
    }

    // Option 4: Project ID with Application Default Credentials
    adminAppInstance = initializeApp({
      projectId,
      databaseURL: process.env.FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_CONFIG.databaseURL,
    });
    console.log(`✅ Firebase Admin initialized with project ID: ${projectId}`);
    return adminAppInstance;
  } catch (error) {
    console.warn('⚠️ Firebase Admin initialization note:', error);
    const existingApps = getApps();
    if (existingApps.length === 0) {
      adminAppInstance = initializeApp({
        projectId: DEFAULT_FIREBASE_CONFIG.projectId,
        databaseURL: DEFAULT_FIREBASE_CONFIG.databaseURL,
      });
      return adminAppInstance;
    }
    adminAppInstance = existingApps[0]!;
    return adminAppInstance;
  }
}

export function getAdminAuth(): Auth {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}

export function getAdminFirestore(): Firestore {
  const app = getFirebaseAdminApp();
  return getFirestore(app);
}

export function getAdminDatabase(): Database | null {
  try {
    const app = getFirebaseAdminApp();
    return getDatabase(app);
  } catch (err) {
    console.warn('Realtime Database not initialized or not configured:', err);
    return null;
  }
}

/**
 * Helper to verify ID Token securely on server
 */
export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Failed to verify Firebase ID token:', error);
    return null;
  }
}
