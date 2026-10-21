/**
 * Server-side Firebase Admin SDK Helper
 * Uses serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT env var
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let appInstance = null;

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

    // 2. Try local file serviceAccountKey.json
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

    if (serviceAccount) {
      appInstance = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || 'rotana-nobb',
      });
      console.log('[FirebaseAdmin] Initialized successfully with Service Account Key for project:', serviceAccount.project_id);
    } else {
      console.warn('[FirebaseAdmin] No service account key found, initializing default.');
      appInstance = initializeApp({ projectId: 'rotana-nobb' });
    }
  }

  return {
    app: appInstance,
    auth: getAuth(appInstance),
    db: getFirestore(appInstance),
    FieldValue,
  };
}
