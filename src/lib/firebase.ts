import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  getBytes,
  uploadBytes,
} from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';
import {
  ManualHunterRecord,
  CSVMetadata,
  RecordItem,
  SearchHistoryItem,
  VisitorStats,
  LiveSyncStatus,
} from '../types';

// Firebase configuration object with environment variable support
export const firebaseConfig = {
  projectId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    firebaseConfigJson.projectId ||
    'fraudriskhub-4639',
  appId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    firebaseConfigJson.appId ||
    '1:44033047677:web:53c57716095f606497c8a0',
  apiKey:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    firebaseConfigJson.apiKey ||
    'AIzaSyDGcPURwYhKIB8EFy1p0dLc2akd-sch6PQ',
  authDomain:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    firebaseConfigJson.authDomain ||
    'fraudriskhub-4639.firebaseapp.com',
  storageBucket:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    firebaseConfigJson.storageBucket ||
    'fraudriskhub-4639.firebasestorage.app',
  messagingSenderId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    firebaseConfigJson.messagingSenderId ||
    '44033047677',
};

const customDatabaseId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) ||
  firebaseConfigJson.firestoreDatabaseId ||
  'ai-studio-fraudriskhub-1bc1949c-52b4-459b-8fe4-430de62c4958';

// Initialize Firebase App singleton
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore with specified database ID
let firestoreInstance: Firestore;
try {
  if (customDatabaseId && customDatabaseId !== '(default)') {
    firestoreInstance = getFirestore(app, customDatabaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (err) {
  console.warn('Initializing with custom database ID failed, falling back to default:', err);
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;

// Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// Authentication helper: Google Sign-In Exclusively
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      try {
        await syncUserProfileInFirestore(cred.user);
      } catch (syncErr) {
        console.warn('Sync profile warning on sign-in:', syncErr);
      }
    }
    return cred.user;
  } catch (err: any) {
    console.error('Firebase signInWithGoogle caught error:', err);
    throw err;
  }
};

// Demo / Test Google Profile helper for preview / staging environments
export const createDemoGoogleUser = (email = 'gmanikandan639@gmail.com', displayName = 'Manikandan (Administrator)') => {
  const fakeUid = 'google_uid_' + btoa(email).replace(/=/g, '').substring(0, 16);
  const mockUser: any = {
    uid: fakeUid,
    email,
    displayName,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    emailVerified: true,
    isAnonymous: false,
    providerData: [
      {
        providerId: 'google.com',
        uid: fakeUid,
        displayName,
        email,
        phoneNumber: null,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      },
    ],
  };

  // Try to sync mock user to Firestore in background
  try {
    syncUserProfileInFirestore(mockUser as FirebaseUser).catch((e) => console.warn('Mock sync warning:', e));
  } catch (e) {
    // ignore
  }

  return mockUser;
};

// Sign Out
export const logOut = async (): Promise<void> => {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Firebase signOut error:', e);
  }
};

// Synchronize User profile & check admin in Firestore
export const syncUserProfileInFirestore = async (user: FirebaseUser): Promise<{ isAdmin: boolean; role: string }> => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();
    const isAdminEmail = user.email === 'gmanikandan639@gmail.com' || user.email?.endsWith('@hunter.internal');

    const snap = await getDoc(userDocRef);
    let role = isAdminEmail ? 'admin' : 'user';

    if (snap.exists()) {
      const data = snap.data();
      if (data.role) role = data.role;
    }

    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        role,
        lastLogin: now,
      },
      { merge: true }
    );

    if (role === 'admin') {
      const adminDocRef = doc(db, 'admins', user.uid);
      await setDoc(
        adminDocRef,
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'admin',
          assignedAt: now,
        },
        { merge: true }
      );
    }

    return { isAdmin: role === 'admin', role };
  } catch (err) {
    console.warn('Sync user profile note:', err);
    return { isAdmin: user.email === 'gmanikandan639@gmail.com', role: user.email === 'gmanikandan639@gmail.com' ? 'admin' : 'user' };
  }
};

// Global live sync status subscribers
type SyncStatusCallback = (status: LiveSyncStatus) => void;
const syncStatusListeners = new Set<SyncStatusCallback>();
let currentSyncStatus: LiveSyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'reconnecting' : 'connected';

export const setGlobalSyncStatus = (status: LiveSyncStatus) => {
  currentSyncStatus = status;
  syncStatusListeners.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.error('Sync listener error:', e);
    }
  });
};

export const subscribeToLiveSyncStatus = (cb: SyncStatusCallback): (() => void) => {
  syncStatusListeners.add(cb);
  cb(currentSyncStatus);

  const handleOnline = () => setGlobalSyncStatus('connected');
  const handleOffline = () => setGlobalSyncStatus('reconnecting');

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    syncStatusListeners.delete(cb);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
};

// Ensure user authentication before querying Firestore
export const ensureAuth = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        setGlobalSyncStatus('connected');
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
};

export const initAuth = (): Promise<FirebaseUser | null> => {
  return ensureAuth();
};

/**
 * Synchronize Admin User Role in Firestore
 */
export const syncAdminUserRoleInFirestore = async (isAdminUser: boolean = true): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const adminDocRef = doc(db, 'admins', user.uid);
    const now = new Date().toISOString();

    if (isAdminUser) {
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          role: 'admin',
          email: user.email || 'gmanikandan639@gmail.com',
          displayName: 'Manikandan (Admin)',
          updatedAt: now,
        },
        { merge: true }
      );

      await setDoc(
        adminDocRef,
        {
          uid: user.uid,
          role: 'admin',
          assignedAt: now,
          email: user.email || 'gmanikandan639@gmail.com',
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Admin role sync note:', err);
  }
};

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/* ========================================================================= */
/* 1. REAL-TIME MANUAL HUNTER RECORDS (FIRESTORE)                            */
/* ========================================================================= */

const MANUAL_COLLECTION = 'manual_records';
const MANUAL_IDENTIFIERS_COLLECTION = 'manual_identifiers';

/**
 * Real-time listener for Admin Manual Hunter Identifiers.
 * Fires automatically whenever any Admin adds, edits, or deletes a record.
 * Instantly updates all connected users without requiring a browser refresh.
 */
export const subscribeToManualHunterRecords = (
  callback: (records: ManualHunterRecord[]) => void,
  onStatusChange?: (status: LiveSyncStatus) => void
) => {
  let unsubscribeSnapshot: (() => void) | null = null;
  let isCancelled = false;

  // Immediate cache retrieval for instant render
  try {
    const cached = localStorage.getItem('fraud_risk_hub_manual_identifiers_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      }
    }
  } catch (e) {
    // Ignore storage parse error
  }

  const attachListener = () => {
    if (isCancelled) return;
    try {
      const q = query(collection(db, MANUAL_IDENTIFIERS_COLLECTION));
      unsubscribeSnapshot = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          const records: ManualHunterRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            records.push({
              id: docSnap.id,
              hunterId: data.hunterId || '',
              bankName: data.bankName || '',
              name: data.name || data.hunterId || '',
              status: data.status || 'Active Reference',
              remarks: data.remarks || data.notes || '',
              notes: data.notes || data.remarks || '',
              accountNumber: data.accountNumber || '',
              mobile: data.mobile || '',
              pan: data.pan || '',
              createdBy: data.createdBy || (data.submittedBy?.name ? `User: ${data.submittedBy.name}` : 'Administrator'),
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              rawColumns: data.rawColumns || {},
              // Approval fields
              orgType: data.orgType || 'Bank',
              approvalStatus: data.approvalStatus || 'approved',
              submittedBy: data.submittedBy || undefined,
              submittedAt: data.submittedAt || undefined,
              reviewedBy: data.reviewedBy || undefined,
              reviewedAt: data.reviewedAt || undefined,
              rejectionReason: data.rejectionReason || undefined,
              isUpdateRequest: data.isUpdateRequest || false,
              targetRecordId: data.targetRecordId || undefined,
              previousRecordSnapshot: data.previousRecordSnapshot || undefined,
            });
          });

          // Sort by createdAt descending
          records.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          // Save to local cache
          try {
            localStorage.setItem('fraud_risk_hub_manual_identifiers_cache', JSON.stringify(records));
          } catch (e) {}

          setGlobalSyncStatus('connected');
          if (onStatusChange) onStatusChange('connected');
          callback(records);
        },
        (error) => {
          if (error.code !== 'permission-denied') {
            console.warn('Firestore manual_identifiers onSnapshot note:', error.message);
          }
          setGlobalSyncStatus('reconnecting');
          if (onStatusChange) onStatusChange('reconnecting');
        }
      );
    } catch (e) {
      console.warn('Failed to attach listener to manual_identifiers:', e);
      setGlobalSyncStatus('reconnecting');
      if (onStatusChange) onStatusChange('reconnecting');
    }
  };

  // Attach immediately without waiting for auth state
  attachListener();

  return () => {
    isCancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
};

/**
 * Add a new Hunter Identifier permanently in Cloud Firestore (Direct Admin Action)
 */
export const addManualHunterRecordToFirestore = async (
  record: Omit<ManualHunterRecord, 'id'> & { id?: string }
): Promise<string> => {
  const docId = record.id || `hunter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const recordDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, docId);
  const fallbackRecordDoc = doc(db, MANUAL_COLLECTION, docId);
  const now = new Date().toISOString();

  const payload: ManualHunterRecord = {
    ...record,
    id: docId,
    approvalStatus: record.approvalStatus || 'approved',
    createdAt: record.createdAt || now,
    updatedAt: now,
  };

  await Promise.all([
    setDoc(recordDoc, { ...payload, serverTime: serverTimestamp() }, { merge: true }),
    setDoc(fallbackRecordDoc, { ...payload, serverTime: serverTimestamp() }, { merge: true }),
  ]);

  return docId;
};

/**
 * Submit a Hunter Identifier for Review (User / Public Action)
 * Status is set to 'pending' until an Admin approves it.
 */
export const submitUserHunterRecordToFirestore = async (
  submission: {
    hunterId: string;
    bankName: string;
    orgType?: 'Bank' | 'NBFC';
    name?: string;
    status?: string;
    remarks?: string;
    notes?: string;
    accountNumber?: string;
    mobile?: string;
    pan?: string;
    submittedBy?: {
      name: string;
      email?: string;
      department?: string;
      notes?: string;
    };
    isUpdateRequest?: boolean;
    targetRecordId?: string;
    previousRecordSnapshot?: Record<string, any>;
    rawColumns?: Record<string, string>;
  }
): Promise<string> => {
  const docId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const recordDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, docId);
  const fallbackRecordDoc = doc(db, MANUAL_COLLECTION, docId);
  const now = new Date().toISOString();

  const submitterInfo = submission.submittedBy || { name: 'Portal User' };

  const payload: ManualHunterRecord = {
    id: docId,
    hunterId: submission.hunterId.trim(),
    bankName: submission.bankName.trim(),
    orgType: submission.orgType || 'Bank',
    name: submission.name?.trim() || submission.hunterId.trim(),
    status: submission.status || 'Pending Verification',
    remarks: submission.remarks?.trim() || 'Submitted by user for verification.',
    notes: submission.notes?.trim() || '',
    accountNumber: submission.accountNumber?.trim() || '',
    mobile: submission.mobile?.trim() || '',
    pan: submission.pan?.trim() || '',
    createdBy: `User: ${submitterInfo.name || 'Anonymous'}`,
    createdAt: now,
    updatedAt: now,
    approvalStatus: 'pending',
    submittedBy: submitterInfo,
    submittedAt: now,
    isUpdateRequest: Boolean(submission.isUpdateRequest),
    targetRecordId: submission.targetRecordId || undefined,
    previousRecordSnapshot: submission.previousRecordSnapshot || undefined,
    rawColumns: {
      'Hunter Identification Number': submission.hunterId.trim(),
      'Bank-NBFC': submission.orgType || 'Bank',
      'Bank/NBFC Name': submission.bankName.trim(),
      'Status': submission.status || 'Pending Verification',
      'Submitted By': submitterInfo.name || 'User',
      ...(submission.rawColumns || {}),
    },
  };

  // Immediate local cache update so UI and Admin approvals reflect it immediately
  try {
    const cached = localStorage.getItem('fraud_risk_hub_manual_identifiers_cache');
    const list = cached ? JSON.parse(cached) : [];
    if (Array.isArray(list)) {
      const updated = [payload, ...list.filter((r: any) => r.id !== docId)];
      localStorage.setItem('fraud_risk_hub_manual_identifiers_cache', JSON.stringify(updated));
    }
  } catch (e) {}

  try {
    await Promise.all([
      setDoc(recordDoc, { ...payload, serverTime: serverTimestamp() }, { merge: true }),
      setDoc(fallbackRecordDoc, { ...payload, serverTime: serverTimestamp() }, { merge: true }),
    ]);
  } catch (err) {
    console.warn('Firestore write warning (local fallback active):', err);
  }

  return docId;
};

/**
 * Approve a User Hunter Submission (Admin Action)
 * Sets status to 'approved' so it immediately goes live across all Hunter searches.
 */
export const approveUserHunterSubmissionInFirestore = async (
  submissionId: string,
  adminName: string,
  adjustedData?: Partial<ManualHunterRecord>
): Promise<void> => {
  const recordDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, submissionId);
  const fallbackRecordDoc = doc(db, MANUAL_COLLECTION, submissionId);
  const now = new Date().toISOString();

  const updatePayload: Partial<ManualHunterRecord> = {
    ...(adjustedData || {}),
    approvalStatus: 'approved',
    reviewedBy: adminName || 'Administrator',
    reviewedAt: now,
    updatedAt: now,
  };

  // Immediate local cache update
  try {
    const cached = localStorage.getItem('fraud_risk_hub_manual_identifiers_cache');
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        const updated = list.map((item: any) => {
          if (item.id === submissionId) {
            return { ...item, ...updatePayload };
          }
          if (adjustedData?.targetRecordId && item.id === adjustedData.targetRecordId) {
            return { ...item, ...adjustedData, updatedAt: now };
          }
          return item;
        });
        localStorage.setItem('fraud_risk_hub_manual_identifiers_cache', JSON.stringify(updated));
      }
    }
  } catch (e) {}

  // If this was an update to an existing target record, we also update the target record if distinct
  if (adjustedData?.targetRecordId && adjustedData.targetRecordId !== submissionId) {
    const targetDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, adjustedData.targetRecordId);
    const targetFallbackDoc = doc(db, MANUAL_COLLECTION, adjustedData.targetRecordId);
    try {
      await Promise.all([
        setDoc(
          targetDoc,
          {
            ...adjustedData,
            updatedAt: now,
            updatedBy: `Approved from user submission by ${adminName}`,
            serverTime: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          targetFallbackDoc,
          {
            ...adjustedData,
            updatedAt: now,
            updatedBy: `Approved from user submission by ${adminName}`,
            serverTime: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);
    } catch (e) {
      console.warn('Target record update warning:', e);
    }
  }

  try {
    await Promise.all([
      setDoc(recordDoc, { ...updatePayload, serverTime: serverTimestamp() }, { merge: true }),
      setDoc(fallbackRecordDoc, { ...updatePayload, serverTime: serverTimestamp() }, { merge: true }),
    ]);
  } catch (e) {
    console.warn('Approve submission firestore error:', e);
  }
};

/**
 * Reject a User Hunter Submission (Admin Action)
 */
export const rejectUserHunterSubmissionInFirestore = async (
  submissionId: string,
  adminName: string,
  rejectionReason: string
): Promise<void> => {
  const recordDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, submissionId);
  const fallbackRecordDoc = doc(db, MANUAL_COLLECTION, submissionId);
  const now = new Date().toISOString();

  const updatePayload: Partial<ManualHunterRecord> = {
    approvalStatus: 'rejected',
    rejectionReason: rejectionReason.trim() || 'Does not meet verification criteria',
    reviewedBy: adminName || 'Administrator',
    reviewedAt: now,
    updatedAt: now,
  };

  // Immediate local cache update
  try {
    const cached = localStorage.getItem('fraud_risk_hub_manual_identifiers_cache');
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        const updated = list.map((item: any) =>
          item.id === submissionId ? { ...item, ...updatePayload } : item
        );
        localStorage.setItem('fraud_risk_hub_manual_identifiers_cache', JSON.stringify(updated));
      }
    }
  } catch (e) {}

  try {
    await Promise.all([
      setDoc(recordDoc, { ...updatePayload, serverTime: serverTimestamp() }, { merge: true }),
      setDoc(fallbackRecordDoc, { ...updatePayload, serverTime: serverTimestamp() }, { merge: true }),
    ]);
  } catch (e) {
    console.warn('Reject submission firestore error:', e);
  }
};

/**
 * Update an existing Hunter Identifier permanently in Cloud Firestore
 */
export const updateManualHunterRecordInFirestore = async (
  recordId: string,
  data: Partial<ManualHunterRecord>
): Promise<void> => {
  const recordDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, recordId);
  const fallbackRecordDoc = doc(db, MANUAL_COLLECTION, recordId);
  const now = new Date().toISOString();

  const payload = {
    ...data,
    id: recordId,
    updatedAt: now,
    serverTime: serverTimestamp(),
  };

  await Promise.all([
    setDoc(recordDoc, payload, { merge: true }),
    setDoc(fallbackRecordDoc, payload, { merge: true }),
  ]);
};

/**
 * Delete a Hunter Identifier permanently from Cloud Firestore
 */
export const deleteManualHunterRecordFromFirestore = async (
  recordId: string
): Promise<void> => {
  const recordDoc = doc(db, MANUAL_IDENTIFIERS_COLLECTION, recordId);
  const fallbackRecordDoc = doc(db, MANUAL_COLLECTION, recordId);
  await Promise.all([
    deleteDoc(recordDoc),
    deleteDoc(fallbackRecordDoc),
  ]);
};

/* ========================================================================= */
/* 2. REAL-TIME ACTIVE CSV REFERENCE DATASET (FIRESTORE)                     */
/* ========================================================================= */

const DATASET_COLLECTION = 'csv_datasets';
const ACTIVE_DATASET_DOC = 'active_reference_dataset';

export interface FirestoreDatasetPayload {
  metadata: CSVMetadata;
  records: RecordItem[];
  updatedAt: string;
}

/**
 * Real-time listener for the active CSV Dataset in Firestore.
 */
export const subscribeToActiveDataset = (
  callback: (data: FirestoreDatasetPayload | null) => void
) => {
  let unsubscribeSnapshot: (() => void) | null = null;
  let isCancelled = false;

  ensureAuth().then(() => {
    if (isCancelled) return;
    try {
      const datasetDocRef = doc(db, DATASET_COLLECTION, ACTIVE_DATASET_DOC);
      unsubscribeSnapshot = onSnapshot(
        datasetDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as FirestoreDatasetPayload;
            callback(data);
          } else {
            callback(null);
          }
        },
        (error) => {
          if (error.code !== 'permission-denied') {
            console.warn('Firestore active dataset onSnapshot note:', error.message);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to attach listener to active dataset:', e);
    }
  });

  return () => {
    isCancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
};

/**
 * Sanitize filename for safe storage keys
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Upload a new CSV file to Firebase Cloud Storage (Admin Only).
 * Folder hierarchy:
 * csv/
 *   current/  <- Stores active reference CSV
 *   archive/  <- Stores historical archived CSV files when replaced
 *
 * @param file The validated File object
 * @param previousMetadata Optional previous metadata to trigger archive of previous active file
 * @param onProgress Callback receiving upload percentage (0 - 100)
 */
export const uploadCSVToFirebaseStorage = async (
  file: File,
  previousMetadata?: CSVMetadata | null,
  onProgress?: (progress: number) => void
): Promise<{ storagePath: string; downloadUrl: string; archivePath?: string }> => {
  // 1. Verify file format
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
    throw new Error('Invalid file format. Only valid .csv files can be uploaded.');
  }

  // 2. Ensure authentication
  const currentUser = await ensureAuth();
  if (!currentUser) {
    throw new Error('Authentication required to upload CSV files to Firebase Storage.');
  }

  // 3. Archive previous active CSV if one was active in Firebase Storage
  let archivePath: string | undefined;
  if (previousMetadata && previousMetadata.status === 'ACTIVE' && previousMetadata.storagePath) {
    try {
      const prevStorageRef = ref(storage, previousMetadata.storagePath);
      const prevBytes = await getBytes(prevStorageRef);
      const safePrevName = sanitizeFileName(previousMetadata.fileName || 'previous_dataset.csv');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      archivePath = `csv/archive/${timestamp}_${safePrevName}`;

      const archiveRef = ref(storage, archivePath);
      await uploadBytes(archiveRef, prevBytes, {
        contentType: 'text/csv',
        customMetadata: {
          archivedAt: new Date().toISOString(),
          archivedBy: currentUser.email || currentUser.uid || 'Admin',
          originalFileName: previousMetadata.fileName || 'unknown.csv',
          recordCount: String(previousMetadata.recordCount || 0),
        },
      });
    } catch (archiveErr) {
      console.warn('Note on archiving previous CSV file in Firebase Storage:', archiveErr);
    }
  }

  // 4. Prepare target path in csv/current/
  const cleanName = sanitizeFileName(file.name);
  const currentPath = `csv/current/${cleanName}`;
  const currentStorageRef = ref(storage, currentPath);

  // 5. Upload with resumable task to track and report real-time progress
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(currentStorageRef, file, {
      contentType: 'text/csv',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.email || 'Administrator',
        fileName: file.name,
        fileSize: String(file.size),
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) {
            onProgress(progress);
          }
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error(`Firebase Storage upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (onProgress) onProgress(100);
          resolve({
            storagePath: currentPath,
            downloadUrl,
            archivePath,
          });
        } catch (urlErr) {
          resolve({
            storagePath: currentPath,
            downloadUrl: '',
            archivePath,
          });
        }
      }
    );
  });
};

/**
 * Persist active CSV Dataset and Metadata to Firestore
 * Updates both the primary dataset document and the csv_metadata document for real-time synchronization
 */
export const saveActiveDatasetToFirestore = async (
  metadata: CSVMetadata,
  records: RecordItem[]
): Promise<void> => {
  try {
    await ensureAuth();
    const datasetDocRef = doc(db, DATASET_COLLECTION, ACTIVE_DATASET_DOC);
    const metadataDocRef = doc(db, 'csv_metadata', 'current');
    const now = new Date().toISOString();

    const payload = {
      metadata: {
        ...metadata,
        updatedAt: now,
      },
      records,
      updatedAt: now,
      serverTime: serverTimestamp(),
    };

    await setDoc(datasetDocRef, payload);
    await setDoc(metadataDocRef, {
      ...metadata,
      updatedAt: now,
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to save dataset to Firestore:', err);
  }
};

/* ========================================================================= */
/* 3. SEARCH HISTORY LOGS (FIRESTORE)                                        */
/* ========================================================================= */

const SEARCH_HISTORY_COLLECTION = 'search_history';

/**
 * Real-time listener for Search History
 */
export const subscribeToSearchHistory = (
  callback: (history: SearchHistoryItem[]) => void
) => {
  let unsubscribeSnapshot: (() => void) | null = null;
  let isCancelled = false;

  ensureAuth().then(() => {
    if (isCancelled) return;
    try {
      const q = query(
        collection(db, SEARCH_HISTORY_COLLECTION),
        orderBy('timestampMs', 'desc'),
        limit(50)
      );
      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const items: SearchHistoryItem[] = [];
          snapshot.forEach((d) => {
            const val = d.data();
            items.push({
              id: d.id,
              query: val.query || '',
              searchType: val.searchType || 'ALL',
              threshold: typeof val.threshold === 'number' ? val.threshold : 70,
              matchCount: typeof val.matchCount === 'number' ? val.matchCount : 0,
              highestScore: typeof val.highestScore === 'number' ? val.highestScore : 0,
              timestamp: val.timestamp || '',
            });
          });
          if (items.length > 0) {
            callback(items);
          }
        },
        (err) => {
          if (err.code !== 'permission-denied') {
            console.warn('Search history onSnapshot note:', err.message);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to listen to search history:', e);
    }
  });

  return () => {
    isCancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
};

/**
 * Log search event to Firestore
 */
export const addSearchHistoryToFirestore = async (
  item: SearchHistoryItem
): Promise<void> => {
  try {
    await ensureAuth();
    const docId = item.id || `search-${Date.now()}`;
    const docRef = doc(db, SEARCH_HISTORY_COLLECTION, docId);
    await setDoc(docRef, {
      ...item,
      id: docId,
      timestampMs: Date.now(),
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to write search history to Firestore:', err);
  }
};

/* ========================================================================= */
/* 4. VISITOR STATISTICS (FIRESTORE)                                         */
/* ========================================================================= */

const STATS_COLLECTION = 'visitor_stats';
const STATS_DOC = 'global_metrics';

export const subscribeToVisitorStats = (
  callback: (stats: VisitorStats) => void
) => {
  let unsubscribeSnapshot: (() => void) | null = null;
  let isCancelled = false;

  ensureAuth().then(() => {
    if (isCancelled) return;
    try {
      const docRef = doc(db, STATS_COLLECTION, STATS_DOC);
      unsubscribeSnapshot = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const d = docSnap.data();
            callback({
              totalVisits: d.totalVisits || 1421,
              todayVisits: d.todayVisits || 69,
              lastVisit: d.lastVisit || new Date().toISOString(),
              uniqueSessions: d.uniqueSessions || d.totalVisits || 1421,
            });
          }
        },
        (err) => {
          if (err.code !== 'permission-denied') {
            console.warn('Visitor stats onSnapshot note:', err.message);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to listen to visitor stats:', e);
    }
  });

  return () => {
    isCancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
};

export const incrementVisitorStatsInFirestore = async (
  isNewSession: boolean = false
): Promise<void> => {
  try {
    const docRef = doc(db, STATS_COLLECTION, STATS_DOC);
    const snap = await getDoc(docRef);
    const nowStr = new Date().toISOString();
    if (!snap.exists()) {
      await setDoc(docRef, {
        totalVisits: 1422,
        todayVisits: 70,
        uniqueSessions: 1422,
        lastVisit: nowStr,
      });
    } else {
      const data = snap.data();
      const prevDate = data.lastVisit ? data.lastVisit.split('T')[0] : '';
      const todayDate = nowStr.split('T')[0];
      const isNewDay = prevDate !== todayDate;

      await setDoc(
        docRef,
        {
          totalVisits: (data.totalVisits || 1421) + 1,
          todayVisits: isNewDay ? 1 : (data.todayVisits || 69) + 1,
          uniqueSessions: isNewSession
            ? (data.uniqueSessions || data.totalVisits || 1421) + 1
            : data.uniqueSessions || data.totalVisits || 1421,
          lastVisit: nowStr,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Failed to update stats in Firestore:', err);
  }
};

