import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import type { ScanHistoryItem } from '../types/qr';

export const firebaseConfig = {
  apiKey: "AIzaSyA8YBuiFEMgavqHUO593kZgfwUeuAyYCaA",
  authDomain: "rotana-nobb.firebaseapp.com",
  projectId: "rotana-nobb",
  storageBucket: "rotana-nobb.firebasestorage.app",
  messagingSenderId: "670512259646",
  appId: "1:670512259646:web:2105425e62637d612c676f"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isLifetime: boolean;
  plan?: string;
  upgradedAt?: number | null;
  tranId?: string | null;
  amount?: number | null;
  currency?: string | null;
}

// Fetch user profile from Firestore with fallback to local cache
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const isVip = Boolean(
        data.isLifetime === true ||
        data.plan === 'LIFETIME_VIP' ||
        data.subscription?.status === 'active' ||
        data.subscription?.plan === 'lifetime'
      );
      return {
        uid,
        email: data.email || null,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isLifetime: isVip,
        plan: isVip ? 'LIFETIME_VIP' : (data.plan || 'FREE'),
        upgradedAt: data.upgradedAt ? (data.upgradedAt.toMillis ? data.upgradedAt.toMillis() : data.upgradedAt) : (data.vipActivatedAt ? (data.vipActivatedAt.toMillis ? data.vipActivatedAt.toMillis() : data.vipActivatedAt) : null),
        tranId: data.tranId || data.lastTranId || null,
        amount: data.amount || null,
        currency: data.currency || null,
      };
    }
  } catch (err) {
    console.warn('[Firebase] Could not fetch user profile from Firestore:', err);
  }
  return null;
}

// Activate Lifetime VIP membership in Firestore
export async function activateUserLifetime(
  uid: string,
  details: { tranId: string; amount: number; currency: string }
): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        isLifetime: true,
        plan: 'LIFETIME_VIP',
        upgradedAt: serverTimestamp(),
        tranId: details.tranId,
        amount: details.amount,
        currency: details.currency,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to activate lifetime in Firestore:', err);
    return false;
  }
}

// ==========================================
// FIRESTORE SCAN HISTORY SYNC METHODS
// ==========================================

// Save a single scan history item to Firestore under users/{uid}/history/{itemId}
export async function saveHistoryItemToFirestore(uid: string, item: ScanHistoryItem): Promise<void> {
  try {
    const historyDocRef = doc(db, 'users', uid, 'history', item.id);
    await setDoc(
      historyDocRef,
      {
        id: item.id,
        content: item.content,
        type: item.type,
        title: item.title,
        domain: item.domain || null,
        formatName: item.formatName || null,
        createdAt: item.createdAt,
        favorite: Boolean(item.favorite),
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to save history item:', err);
  }
}

// Delete history item from Firestore
export async function deleteHistoryItemFromFirestore(uid: string, itemId: string): Promise<void> {
  try {
    const historyDocRef = doc(db, 'users', uid, 'history', itemId);
    await deleteDoc(historyDocRef);
  } catch (err) {
    console.warn('[Firestore] Failed to delete history item:', err);
  }
}

// Update history item in Firestore (e.g. toggle favorite)
export async function updateHistoryItemInFirestore(
  uid: string,
  itemId: string,
  updates: Partial<ScanHistoryItem>
): Promise<void> {
  try {
    const historyDocRef = doc(db, 'users', uid, 'history', itemId);
    const cleanedUpdates: Record<string, any> = {};
    if (updates.favorite !== undefined) cleanedUpdates.favorite = Boolean(updates.favorite);
    if (updates.title !== undefined) cleanedUpdates.title = updates.title;
    cleanedUpdates.updatedAt = serverTimestamp();

    await updateDoc(historyDocRef, cleanedUpdates);
  } catch (err) {
    console.warn('[Firestore] Failed to update history item:', err);
  }
}

// Fetch user history from Firestore
export async function fetchUserHistoryFromFirestore(uid: string, maxItems = 200): Promise<ScanHistoryItem[]> {
  try {
    const historyCol = collection(db, 'users', uid, 'history');
    const q = query(historyCol, orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(q);

    const items: ScanHistoryItem[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        id: d.id || docSnap.id,
        content: d.content || '',
        type: d.type || 'UNKNOWN',
        title: d.title || '',
        domain: d.domain || undefined,
        formatName: d.formatName || undefined,
        createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
        favorite: Boolean(d.favorite),
      });
    });
    return items;
  } catch (err) {
    console.warn('[Firestore] Failed to fetch user history from Firestore:', err);
    return [];
  }
}

// Clear all history from Firestore for user
export async function clearUserHistoryFromFirestore(uid: string): Promise<void> {
  try {
    const historyCol = collection(db, 'users', uid, 'history');
    const snap = await getDocs(historyCol);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('[Firestore] Failed to clear user history:', err);
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  fbSignOut,
  updateProfile,
  onAuthStateChanged,
};
export type { User };
