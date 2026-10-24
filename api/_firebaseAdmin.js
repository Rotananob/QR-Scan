/**
 * Server-side Firebase Admin SDK Helper
 * Uses bundled service account, FIREBASE_SERVICE_ACCOUNT env var, or local file
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { SERVICE_ACCOUNT_KEY } from './_serviceAccount.js';

let appInstance = null;
let dbInstance = null;
let authInstance = null;

export function getFirebaseAdmin() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
  } else if (!appInstance) {
    let serviceAccount = null;

    // 1. Try environment variable FIREBASE_SERVICE_ACCOUNT (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.warn('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT env:', e);
      }
    }

    // 2. Try bundled SERVICE_ACCOUNT_KEY
    if (!serviceAccount && SERVICE_ACCOUNT_KEY && SERVICE_ACCOUNT_KEY.private_key) {
      serviceAccount = SERVICE_ACCOUNT_KEY;
    }

    // 3. Try local file serviceAccountKey.json
    if (!serviceAccount) {
      try {
        const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(keyPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        }
      } catch (e) {
        console.warn('[FirebaseAdmin] Could not read serviceAccountKey.json:', e);
      }
    }

    if (serviceAccount && serviceAccount.private_key) {
      appInstance = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'rotana-nobb',
      });
      console.log('[FirebaseAdmin] Initialized successfully with Service Account Key for project:', serviceAccount.project_id);
    } else {
      console.warn('[FirebaseAdmin] Warning: Initializing without credentials.');
      appInstance = initializeApp({ projectId: 'rotana-nobb' });
    }
  }

  if (!dbInstance && appInstance) {
    try {
      dbInstance = getFirestore(appInstance);
    } catch (e) {
      console.warn('[FirebaseAdmin] Firestore init warning:', e.message);
    }
  }

  if (!authInstance && appInstance) {
    try {
      authInstance = getAuth(appInstance);
    } catch (e) {
      console.warn('[FirebaseAdmin] Auth init warning:', e.message);
    }
  }

  return {
    app: appInstance,
    auth: authInstance,
    db: dbInstance,
    FieldValue,
  };
}

/**
 * Strict timeout wrapper for Firestore queries to prevent hanging on serverless
 */
export async function withFirestoreTimeout(promise, timeoutMs = 2000) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Firestore query timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}
