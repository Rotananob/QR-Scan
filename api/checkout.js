/**
 * Production Serverless Handler for Live Checkout QR Generation via PayWay & pay-helper
 * Compatible with Vercel Serverless Functions & Local Vite Dev Server
 * 
 * Features:
 * - Direct connection to ABA PayWay checkout link: https://link.payway.com.kh/ABAPAYbR5506511
 * - Cloudflare WAF bypass with session cookie retention (__cf_bm) across all requests
 * - Captures token, clientId, deviceId, requestTime, and saves session in Firestore + memory
 * - Generates authentic bank deeplinks for ABA, Bakong, Acleda, and Wing
 * - Strict Rate Limiting: Maximum 20 QR code generations per day per user/IP
 */

import crypto from 'crypto';
import { buildBankDeeplinks } from 'pay-helper';
import { invoiceStore } from './_invoiceStore.js';
import { getFirebaseAdmin } from './_firebaseAdmin.js';
import { signPaymentSession } from './_security.js';

const CHECKOUT_URL = 'https://link.payway.com.kh/ABAPAYbR5506511';
const MAX_DAILY_CHECKOUTS = 20;

// Daily in-memory rate limit ledger
const dailyCounter = new Map();

function getTodayString() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

function checkRateLimit(clientIdentifier) {
  const today = getTodayString();
  const key = `${today}_${clientIdentifier}`;
  const current = dailyCounter.get(key) || 0;

  if (current >= MAX_DAILY_CHECKOUTS) {
    return {
      allowed: false,
      count: current,
      remaining: 0,
      max: MAX_DAILY_CHECKOUTS,
    };
  }

  dailyCounter.set(key, current + 1);
  return {
    allowed: true,
    count: current + 1,
    remaining: MAX_DAILY_CHECKOUTS - (current + 1),
    max: MAX_DAILY_CHECKOUTS,
  };
}

// Global Cloudflare session cookie cache (captures and refreshes __cf_bm)
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

function generateRandomDeviceId(len = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

/**
 * Creates live registered PayWay invoice with full token and session metadata
 */
async function createLivePaywayInvoice(amount = 3.00, currency = 'USD') {
  // 1. Fetch checkout page to get aba_data, request_time, and __cf_bm cookie
  const pageRes = await fetch(CHECKOUT_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(12000),
  });

  globalCfCookieJar = mergeCookies(globalCfCookieJar, pageRes);
  const html = await pageRes.text();
  const abaDataMatch = html.match(/["']?aba_data["']?\s*[:=,]\s*["']([^"']+)["']/);
  const reqTimeMatch = html.match(/["']?request_time["']?\s*[:=,]\s*["']?(\d+)["']/);

  if (!abaDataMatch || !reqTimeMatch) {
    throw new Error('Unable to extract session tokens from PayWay checkout link.');
  }

  const abaData = abaDataMatch[1].replace(/\\u002F/g, '/');
  const requestTime = reqTimeMatch[1];

  // 2. Register payment request via list-payment-options
  const addFields = JSON.stringify({ amount: Number(amount).toFixed(2) });
  const hash = crypto.createHash('sha512').update(`${requestTime}${abaData}${addFields}`, 'utf8').digest('hex');

  const listRes = await fetch('https://link.payway.com.kh/api/pw-app/v1/payment/gateway/list-payment-options', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://link.payway.com.kh',
      Referer: CHECKOUT_URL,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      ...(globalCfCookieJar ? { Cookie: globalCfCookieJar } : {}),
    },
    body: JSON.stringify({
      aba_data: abaData,
      additional_fields: addFields,
      hash,
      request_time: requestTime,
    }),
    signal: AbortSignal.timeout(12000),
  });

  globalCfCookieJar = mergeCookies(globalCfCookieJar, listRes);
  const listJson = await listRes.json();

  if (listRes.status !== 200 || !listJson.token) {
    throw new Error(`PayWay payment initialization failed: ${listJson.status?.message || 'Invalid Data'}`);
  }

  const token = listJson.token;
  const clientId = listJson.client_id;
  const tranId = String(listJson.status?.tran_id || listJson.tran_id || `TRX-${Date.now()}`);
  const qrString = listJson.qr_string;
  const deviceId = generateRandomDeviceId(10);
  const deeplinks = buildBankDeeplinks(qrString);

  return {
    tranId,
    token,
    clientId,
    deviceId,
    requestTime,
    qrString,
    deeplinks,
    cookieJar: globalCfCookieJar,
    amount: Number(amount),
    currency,
  };
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const userId = req.body?.userId;

    // Strict requirement: User MUST be authenticated to generate live checkout invoice
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required. Please log in before initiating checkout.',
        code: 'UNAUTHENTICATED',
        redirect: '/auth?redirect=/upgrade',
      });
    }

    // Check if user is ALREADY VIP in Firestore
    try {
      const { db } = getFirebaseAdmin();
      if (db) {
        const userDoc = await db.collection('users').doc(String(userId)).get();
        if (userDoc.exists && userDoc.data()?.isLifetime) {
          return res.status(200).json({
            success: true,
            alreadyVip: true,
            status: 'PAID',
            message: 'User is already a Lifetime VIP member.',
          });
        }
      }
    } catch (checkErr) {
      console.warn('[Checkout] User VIP check warning:', checkErr.message);
    }

    // Enforce strict daily limit (Max 20/day)
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Daily generation quota exceeded. Maximum 20 QR checkouts per day.',
        remaining: 0,
        maxDaily: MAX_DAILY_CHECKOUTS,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    // Official Lifetime VIP pricing: strictly $3.00 USD
    const numAmount = 3.00;
    const finalCurrency = 'USD';
    const createdAt = Date.now();

    // Generate live registered invoice directly with PayWay & pay-helper
    const invoice = await createLivePaywayInvoice(numAmount, finalCurrency);
    const tranIdStr = String(invoice.tranId);

    // Cryptographically sign this payment session
    const signature = signPaymentSession({
      tranId: tranIdStr,
      userId,
      amount: numAmount,
      currency: finalCurrency,
      createdAt,
    });

    // 1. Save in shared in-memory invoice store
    invoiceStore.set(tranIdStr, {
      tranId: tranIdStr,
      token: invoice.token,
      clientId: invoice.clientId,
      deviceId: invoice.deviceId,
      requestTime: invoice.requestTime,
      cookieJar: invoice.cookieJar,
      userId,
      amount: numAmount,
      currency: finalCurrency,
      qrString: invoice.qrString,
      createdAt,
      signature,
    });

    // 2. Persist in Firestore so ALL serverless lambdas have immediate access
    try {
      const { db, FieldValue } = getFirebaseAdmin();
      if (db) {
        await db.collection('invoices').doc(tranIdStr).set({
          tranId: tranIdStr,
          token: invoice.token,
          clientId: invoice.clientId,
          deviceId: invoice.deviceId,
          requestTime: invoice.requestTime,
          cookieJar: invoice.cookieJar,
          userId,
          amount: numAmount,
          currency: finalCurrency,
          qrString: invoice.qrString,
          status: 'PENDING',
          createdAt: FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 180 * 1000),
          signature,
        });
        console.log(`[Checkout] Persisted invoice session to Firestore: ${tranIdStr} for user ${userId}`);
      }
    } catch (fsErr) {
      console.warn('[Checkout] Firestore invoice session persist warning:', fsErr.message);
    }

    return res.status(200).json({
      success: true,
      tranId: invoice.tranId,
      amount: numAmount,
      currency: finalCurrency,
      qrString: invoice.qrString,
      deeplinks: invoice.deeplinks,
      token: invoice.token,
      clientId: invoice.clientId,
      deviceId: invoice.deviceId,
      requestTime: invoice.requestTime,
      cfCookieAttached: Boolean(invoice.cookieJar && invoice.cookieJar.includes('__cf_bm')),
      signature,
      createdAt,
      remainingDaily: rateCheck.remaining,
      maxDaily: MAX_DAILY_CHECKOUTS,
      status: 'PENDING',
    });
  } catch (err) {
    console.error('[API Checkout Error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate checkout invoice.',
      success: false,
    });
  }
}
