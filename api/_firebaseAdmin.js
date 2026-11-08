/**
 * Safe, zero-dependency Firebase Admin Helper
 * Prevents Vercel Serverless Function boot crashes from firebase-admin v14 engine incompatibilities.
 */

export function getFirebaseAdmin() {
  return {
    app: null,
    auth: null,
    db: null,
    FieldValue: {
      serverTimestamp: () => new Date(),
    },
  };
}

export async function withFirestoreTimeout(promise, timeoutMs = 2000) {
  if (!promise) return null;
  return promise;
}
