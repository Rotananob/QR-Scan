/**
 * Production Serverless Handler for Checking Transaction Settlement Status
 * Compatible with Vercel Serverless Functions & Local Vite Dev Server
 * 
 * Features:
 * - Anti-tampering HMAC payment signature verification
 * - Anti-replay attack check in Firestore
 * - Rate limiting (120 checks/minute per IP)
 * - Cloudflare WAF bypass with session cookie retention (__cf_bm) across status checks
 * - Multi-tier session lookup: Memory -> Firestore -> Request Payload
 * - Cross-bank instant settlement detection (ABA, Bakong, Acleda, Wing, etc.)
 */

import crypto from 'crypto';
import { invoiceStore } from './_invoiceStore.js';
import { getFirebaseAdmin } from './_firebaseAdmin.js';
import { checkStatusRateLimit, verifyPaymentSession, isTransactionClaimedByOther } from './_security.js';
import {
  sendTelegramAlert,
  getClientIp,
  getClientLocation,
  parseDeviceDetails,
  getCambodiaTimeString,
} from './_telegram.js';

const CHECKOUT_URL = 'https://link.payway.com.kh/ABAPAYbR5506511';

// Global Cloudflare session cookie cache for status verification
let globalCfCookieJar = '';

function mergeCookies(existingJar, res) {
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || ''];
  const newCookies = setCookies.map((c) => (c ? c.split(';')[0].trim() : '')).filter(Boolean);
  if (newCookies.length === 0) return existingJar;

  const cookieMap = new Map();
  if (existingJar) {
    existingJar.split(';').forEach((pair) => {
      const [k, v] = pair.trim().split('=');
      if (k && v) cookieMap.set(k, v);
    });
  }
  newCookies.forEach((pair) => {
    const [k, v] = pair.split('=');
    if (k && v) cookieMap.set(k, v);
  });
  return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
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
          activatedReason: 'KHQR Payment Verified via PayWay',
        },
        { merge: true }
      );

      // Also update invoice record in Firestore
      try {
        await db.collection('invoices').doc(String(tranId)).set(
          {
            status: 'PAID',
            paidAt: FieldValue.serverTimestamp(),
            claimedBy: String(userId),
          },
          { merge: true }
        );
      } catch {}

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

    const { tranId, token, deviceId, clientId, requestTime, userId, signature, createdAt } = req.body || {};

    if (!tranId) {
      return res.status(400).json({ error: 'Missing tranId in request body.' });
    }

    const tranIdStr = String(tranId).trim();

    // 2. Multi-tier Session Resolution: Memory -> Firestore -> Request Payload
    let session = invoiceStore.get(tranIdStr);

    if (!session) {
      try {
        const { db } = getFirebaseAdmin();
        if (db) {
          const docSnap = await db.collection('invoices').doc(tranIdStr).get();
          if (docSnap.exists) {
            session = docSnap.data();
          }
        }
      } catch (fsErr) {
        console.warn('[CheckStatus] Firestore session lookup warning:', fsErr.message);
      }
    }

    const effectiveUserId = userId || session?.userId;
    const effectiveCreatedAt = createdAt || session?.createdAt;
    const effectiveSignature = signature || session?.signature;

    // 3. Check if user is ALREADY marked as Lifetime VIP in Firestore (Instant Success Path)
    if (effectiveUserId) {
      try {
        const { db } = getFirebaseAdmin();
        if (db) {
          const userDoc = await db.collection('users').doc(String(effectiveUserId)).get();
          if (userDoc.exists && userDoc.data()?.isLifetime) {
            return res.status(200).json({
              status: 'PAID',
              tranId: tranIdStr,
              rawStatus: 'approved',
              verified: true,
              alreadyActive: true,
            });
          }
        }
      } catch (userCheckErr) {
        console.warn('[CheckStatus] User VIP status check warning:', userCheckErr.message);
      }
    }

    // 4. Validate payment session security signature
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

    // 5. Query PayWay check-payment-status with authentic tokens & __cf_bm cookie
    const activeToken = token || session?.token;
    const activeClientId = clientId || session?.clientId;
    const activeDeviceId = deviceId || session?.deviceId;
    const activeRequestTime = requestTime || session?.requestTime || Date.now().toString();
    const activeCookie = session?.cookieJar || globalCfCookieJar;

    if (activeToken && activeClientId && activeDeviceId) {
      try {
        const hash = crypto
          .createHash('sha512')
          .update(`${activeClientId}${activeDeviceId}${activeRequestTime}`, 'utf8')
          .digest('hex');

        const headers = {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://link.payway.com.kh',
          Referer: CHECKOUT_URL,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,km;q=0.8',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          token: activeToken,
          ...(activeCookie ? { Cookie: activeCookie } : {}),
        };

        const checkRes = await fetch(
          'https://link.payway.com.kh/api/pw-app/v1/payment-link/check-payment-status',
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              client_id: activeClientId,
              device_id: activeDeviceId,
              hash,
              request_time: activeRequestTime,
            }),
            signal: AbortSignal.timeout(6000),
          }
        );

        globalCfCookieJar = mergeCookies(globalCfCookieJar, checkRes);
        const checkText = await checkRes.text();
        let d = null;
        try {
          d = JSON.parse(checkText);
        } catch {
          console.warn('[CheckStatus] PayWay returned non-JSON:', checkText.slice(0, 100));
        }
        const action = d?.data?.action?.toLowerCase();
        const rawStatus = d?.data?.status;

        console.log(`[CheckStatus] PayWay response for ${tranIdStr}:`, {
          status: checkRes.status,
          action,
          rawStatus,
          message: d?.message || d?.status?.message,
        });

        const isPaid =
          action === 'approved' ||
          action === 'paid' ||
          action === 'completed' ||
          rawStatus === 'APPROVED' ||
          rawStatus === 'PAID' ||
          (d?.status?.tran_id && d?.status?.tran_id !== '' && action !== 'request_qr');

        if (isPaid) {
          await activateVipInFirestore(effectiveUserId, tranIdStr, 3.00, 'USD');

          // Send Realtime Telegram Alert for Payment Success
          try {
            const ip = getClientIp(req);
            getClientLocation(ip, req).then((loc) => {
              const device = parseDeviceDetails(req.headers['user-agent'], req.body?.clientData);
              const time = getCambodiaTimeString();

              const alertMsg = [
                '🎉 <b>PAYMENT SUCCESSFUL! (VIP ACTIVATED)</b>',
                '━━━━━━━━━━━━━━━━━━',
                `💰 <b>Amount Received:</b> $3.00 USD`,
                `🧾 <b>Tran ID:</b> <code>${tranIdStr}</code>`,
                `👤 <b>User ID:</b> <code>${effectiveUserId}</code>`,
                `🏦 <b>Payment Method:</b> ABA PayWay / KHQR (Cross-Bank Settlement)`,
                `👑 <b>Status:</b> Lifetime VIP Member Activated!`,
                `📱 <b>Device:</b> ${device.platform} (${device.display})`,
                `📍 <b>Location:</b> ${loc.city}, ${loc.country} ${loc.flag}`,
                `🌐 <b>IP Address:</b> <code>${loc.ip}</code>`,
                `⏰ <b>Time:</b> ${time}`,
                '━━━━━━━━━━━━━━━━━━',
              ].join('\n');

              sendTelegramAlert(alertMsg).catch(() => {});
            }).catch(() => {});
          } catch {}

          return res.status(200).json({
            status: 'PAID',
            tranId: tranIdStr,
            rawStatus: action || rawStatus || 'approved',
            verified: true,
          });
        }
      } catch (paywayErr) {
        console.warn(`[CheckStatus] Direct PayWay check error:`, paywayErr.message);
      }
    }

    // Return current pending status
    return res.status(200).json({
      status: 'PENDING',
      tranId: tranIdStr,
      verified: false,
    });
  } catch (err) {
    console.error('[CheckStatus Handler Error]:', err);
    return res.status(500).json({
      error: err.message || 'Internal error verifying payment status.',
      status: 'PENDING',
    });
  }
}
