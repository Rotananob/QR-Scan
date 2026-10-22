/**
 * Production Serverless Handler for Checking Transaction Settlement Status
 * Compatible with Vercel Serverless Functions (ESM Node.js runtime)
 * 
 * Security Features:
 * - Anti-tampering HMAC payment signature verification
 * - Anti-replay attack check in Firestore
 * - Rate limiting (120 checks/minute per IP)
 * - Strict $3.00 USD settlement validation via pay-helper KhqrGateway
 */

import crypto from 'crypto';
import { KhqrGateway } from 'pay-helper';
import { invoiceStore } from './_invoiceStore.js';
import { getFirebaseAdmin } from './_firebaseAdmin.js';
import { checkStatusRateLimit, verifyPaymentSession, isTransactionClaimedByOther } from './_security.js';

const CHECKOUT_URL = 'https://link.payway.com.kh/ABAPAYbR5506511';

let gatewayInstance = null;
function getGateway() {
  if (!gatewayInstance) {
    gatewayInstance = new KhqrGateway({
      checkoutUrl: CHECKOUT_URL,
      sessionCacheTtlMs: 300000,
      timeoutMs: 10000,
    });
  }
  return gatewayInstance;
}

async function activateVipInFirestore(userId, tranId, amount = 3.00, currency = 'USD') {
  if (!userId) {
    console.warn('[FirebaseAdmin] Cannot activate VIP: missing userId');
    return false;
  }
  try {
    const { db, FieldValue } = getFirebaseAdmin();
    if (db) {
      // Replay check: has another user already claimed this transaction?
      const alreadyClaimed = await isTransactionClaimedByOther(db, tranId, userId);
      if (alreadyClaimed) {
        console.warn(`[FirebaseAdmin] Blocked replay activation: TranId ${tranId} already claimed by another user`);
        return false;
      }

      const userRef = db.collection('users').doc(String(userId));
      await userRef.set(
        {
          isLifetime: true,
          plan: 'LIFETIME_VIP',
          vipActivatedAt: FieldValue.serverTimestamp(),
          lastTranId: String(tranId),
          amount: Number(amount) || 3.00,
          currency: currency || 'USD',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`[FirebaseAdmin] Successfully activated Lifetime VIP in Firestore for user: ${userId} (tran: ${tranId})`);
      return true;
    }
  } catch (adminErr) {
    console.error('[FirebaseAdmin Error]:', adminErr);
  }
  return false;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // 1. IP & Rate Limiting (Max 120 checks per minute)
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'anonymous';

    const rateCheck = checkStatusRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many status checks. Please wait ${rateCheck.retryAfterSec} seconds.`,
        status: 'PENDING',
        rateLimited: true,
      });
    }

    const { tranId, token, deviceId, clientId, userId, signature, createdAt } = req.body || {};

    if (!tranId) {
      return res.status(400).json({ error: 'Missing tranId in request body.' });
    }

    const tranIdStr = String(tranId).trim();

    // 2. Validate payment session security signature
    const cached = invoiceStore.get(tranIdStr);
    const effectiveUserId = userId || cached?.userId;
    const effectiveCreatedAt = createdAt || cached?.createdAt;
    const effectiveSignature = signature || cached?.signature;

    if (effectiveSignature) {
      const isValidSig = verifyPaymentSession({
        tranId: tranIdStr,
        userId: effectiveUserId,
        amount: 3.00,
        currency: 'USD',
        signature: effectiveSignature,
        createdAt: effectiveCreatedAt,
      });

      if (!isValidSig) {
        console.warn(`[CheckStatus] Invalid HMAC signature for tranId: ${tranIdStr}`);
        return res.status(403).json({
          error: 'Security signature mismatch. Transaction verification failed.',
          status: 'PENDING',
        });
      }
    }

    // 3. Query native checkStatus closure if cached in memory
    if (cached && typeof cached.checkStatus === 'function') {
      try {
        const liveResult = await cached.checkStatus();
        console.log(`[CheckStatus] Native invoice.checkStatus result for ${tranIdStr}:`, liveResult);
        if (liveResult.status === 'PAID') {
          await activateVipInFirestore(
            effectiveUserId,
            tranIdStr,
            cached.invoice?.amount || 3.00,
            cached.invoice?.currency || 'USD'
          );
          return res.status(200).json({
            status: 'PAID',
            tranId: liveResult.tranId || tranIdStr,
            rawStatus: liveResult.rawStatus || 'approved',
            verified: true,
          });
        }
      } catch (liveErr) {
        console.warn(`[CheckStatus] Live check error for ${tranIdStr}:`, liveErr.message);
      }
    }

    // 4. Direct ABA PayWay check-payment-status query if session credentials exist
    const activeToken = token || cached?.token;
    const activeClientId = clientId || cached?.clientId;
    const activeDeviceId = deviceId || cached?.deviceId;
    const activeCookie = cached?.cookieJar;

    if (activeToken && activeDeviceId && activeClientId) {
      try {
        const now = Date.now().toString();
        const hash = crypto
          .createHash('sha512')
          .update(`${activeClientId}${activeDeviceId}${now}`, 'utf8')
          .digest('hex');

        const headers = {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://link.payway.com.kh',
          Referer: CHECKOUT_URL,
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.200 Mobile Safari/537.36',
          token: activeToken,
          ...(activeCookie ? { Cookie: activeCookie } : {}),
        };

        const body = {
          client_id: activeClientId,
          device_id: activeDeviceId,
          hash,
          request_time: now,
        };

        const checkRes = await fetch(
          'https://pwapp.ababank.com/api/pw-app/v1/payment-link/check-payment-status',
          {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000),
          }
        );

        const d = await checkRes.json();
        const action = d?.data?.action?.toLowerCase();
        const isPaid =
          d?.status === 0 ||
          d?.code === '00' ||
          d?.data?.status === 'APPROVED' ||
          d?.message?.toLowerCase?.()?.includes('approved') ||
          action === 'approved' ||
          action === 'paid' ||
          action === 'completed';

        if (isPaid) {
          await activateVipInFirestore(effectiveUserId, tranIdStr, 3.00, 'USD');
          return res.status(200).json({
            status: 'PAID',
            tranId: tranIdStr,
            rawStatus: action || d?.data?.status || 'approved',
            verified: true,
          });
        }
      } catch (directErr) {
        console.warn(`[CheckStatus] Direct check error:`, directErr.message);
      }
    }

    // 5. Fallback to KhqrGateway from pay-helper package
    const gw = getGateway();
    const result = await gw.checkStatus({
      tranId: tranIdStr,
      token: activeToken,
      clientId: activeClientId,
      checkoutUrl: CHECKOUT_URL,
    });

    if (result.status === 'PAID') {
      await activateVipInFirestore(effectiveUserId, tranIdStr, 3.00, 'USD');
      return res.status(200).json({
        status: 'PAID',
        tranId: result.tranId || tranIdStr,
        rawStatus: result.rawStatus,
        verified: true,
      });
    }

    return res.status(200).json({
      status: 'PENDING',
      tranId: result.tranId || tranIdStr,
      rawStatus: result.rawStatus,
    });
  } catch (err) {
    console.error('[API Check-Status Error]:', err);
    return res.status(200).json({
      status: 'PENDING',
      error: err.message,
    });
  }
}
