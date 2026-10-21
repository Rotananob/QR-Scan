/**
 * Production Serverless Handler for Checking Transaction Settlement Status
 * Compatible with Vercel Serverless Functions (ESM Node.js runtime)
 */

import { KhqrGateway } from 'pay-helper';
import { getFirebaseAdmin } from './_firebaseAdmin.js';

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
    const { tranId, token, userId } = req.body || {};

    if (!tranId) {
      return res.status(400).json({ error: 'Missing tranId in request body.' });
    }

    const gw = getGateway();
    const result = await gw.checkStatus({
      tranId: String(tranId),
      token: token ? String(token) : undefined,
      checkoutUrl: CHECKOUT_URL,
    });

    // Authoritative Server-side VIP Activation if paid
    if (result.status === 'PAID') {
      try {
        const { db, FieldValue } = getFirebaseAdmin();
        if (db && userId) {
          const userRef = db.collection('users').doc(String(userId));
          await userRef.set(
            {
              isLifetime: true,
              plan: 'LIFETIME_VIP',
              vipActivatedAt: FieldValue.serverTimestamp(),
              lastTranId: tranId,
              amount: 0.01,
              currency: 'USD',
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`[FirebaseAdmin] Successfully activated Lifetime VIP in Firestore for user: ${userId}`);
        }
      } catch (adminErr) {
        console.error('[FirebaseAdmin Error]:', adminErr);
      }
    }

    return res.status(200).json({
      status: result.status, // "PAID" or "PENDING"
      tranId: result.tranId || tranId,
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
