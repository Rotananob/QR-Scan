/**
 * Cryptographic Security Helper for Payment Integrity
 * Prevents transaction tampering, spoofing, replay attacks, and brute-force status polling.
 */

import crypto from 'crypto';

const SERVER_SECRET =
  process.env.PAYMENT_SECURITY_SECRET ||
  process.env.FIREBASE_CONFIG ||
  'khqr-pro-sec-key-rotana-98234-x81-prod-token';

/**
 * Creates a cryptographically signed HMAC token for an invoice session.
 */
export function signPaymentSession({ tranId, userId, amount = 3.0, currency = 'USD', createdAt }) {
  const payload = `${String(tranId)}:${String(userId || 'guest')}:${Number(amount).toFixed(2)}:${currency}:${createdAt || ''}`;
  return crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
}

/**
 * Verifies that a payment session signature matches the expected transaction parameters.
 */
export function verifyPaymentSession({ tranId, userId, amount = 3.0, currency = 'USD', signature, createdAt }) {
  if (!signature || !tranId) return false;

  // Try exact match with createdAt
  if (createdAt) {
    const expected = signPaymentSession({ tranId, userId, amount, currency, createdAt });
    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expected, 'hex')
        )
      ) {
        return true;
      }
    } catch {}
  }

  // Fallback match without createdAt (for backward compatibility)
  const legacyPayload = `${String(tranId)}:${String(userId || 'guest')}:${Number(amount).toFixed(2)}:${currency}:`;
  const legacyExpected = crypto.createHmac('sha256', SERVER_SECRET).update(legacyPayload).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(legacyExpected, 'hex')
    );
  } catch {
    return false;
  }
}

// In-memory rate limiting ledger for check-status (Max 120 checks per minute per IP)
const statusCheckCounter = new Map();
const MAX_STATUS_CHECKS_PER_MINUTE = 120;

export function checkStatusRateLimit(identifier) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const record = statusCheckCounter.get(identifier);

  if (!record || now > record.resetAt) {
    statusCheckCounter.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: MAX_STATUS_CHECKS_PER_MINUTE - 1 };
  }

  if (record.count >= MAX_STATUS_CHECKS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_STATUS_CHECKS_PER_MINUTE - record.count };
}

/**
 * Checks if a transaction ID has already been claimed by a different user in Firestore.
 * Prevents Replay Attacks.
 */
export async function isTransactionClaimedByOther(db, tranId, userId) {
  if (!db || !tranId) return false;
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('lastTranId', '==', String(tranId)).limit(2).get();
    if (snapshot.empty) return false;

    for (const doc of snapshot.docs) {
      if (doc.id !== String(userId)) {
        console.warn(`[Security] Replay attack detected! TranId ${tranId} was already claimed by user ${doc.id}`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Security] Could not check transaction replay in Firestore:', err.message);
  }
  return false;
}
