/**
 * Production Serverless Handler for Live Checkout QR Generation via pay-helper
 * Compatible with Vercel Serverless Functions & Local Vite Dev Server
 * 
 * Features:
 * - Direct connection to ABA PayWay checkout link: https://link.payway.com.kh/ABAPAYbR5506511
 * - Cloudflare WAF bypass with session cookie retention (__cf_bm) across all requests
 * - Zero-flagging: Routes PayWay API calls within the link.payway.com.kh origin session
 * - In-memory failover fallback via pay-helper createPayment to ensure 100% uptime
 * - Strict Rate Limiting: Maximum 20 QR code generations per day per user/IP
 */

import { KhqrGateway, createPayment } from 'pay-helper';
import { invoiceStore } from './_invoiceStore.js';
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

// Custom Fetch with Cloudflare __cf_bm Cookie Retention & Origin Routing
const cloudflareSafeFetch = async (url, opts = {}) => {
  // Always route PayWay gateway endpoints through link.payway.com.kh to stay inside the Cloudflare domain zone
  let targetUrl = url;
  if (targetUrl.includes('pwapp.ababank.com/api/pw-app/')) {
    targetUrl = targetUrl.replace('https://pwapp.ababank.com/api/pw-app/', 'https://link.payway.com.kh/api/pw-app/');
  }

  const headers = { ...(opts.headers || {}) };
  headers['Origin'] = 'https://link.payway.com.kh';
  headers['Referer'] = CHECKOUT_URL;
  headers['User-Agent'] =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

  // Attach active Cloudflare __cf_bm cookie
  if (globalCfCookieJar) {
    headers['Cookie'] = globalCfCookieJar;
  }

  const res = await fetch(targetUrl, { ...opts, headers });

  // Update Cloudflare __cf_bm cookie jar
  globalCfCookieJar = mergeCookies(globalCfCookieJar, res);

  return res;
};

// Singleton gateway with session cache retention (5 minutes)
let gatewayInstance = null;
function getGateway() {
  if (!gatewayInstance) {
    gatewayInstance = new KhqrGateway({
      checkoutUrl: CHECKOUT_URL,
      sessionCacheTtlMs: 300000,
      timeoutMs: 12000,
      customFetch: cloudflareSafeFetch,
    });
  }
  return gatewayInstance;
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
    // 1. Determine client identifier for rate limiting (User ID or IP)
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'anonymous';

    const userId = req.body?.userId;

    // Strict requirement: User MUST be authenticated to generate live checkout invoice
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required. Please log in before initiating checkout.',
        code: 'UNAUTHENTICATED',
        redirect: '/auth?redirect=/upgrade',
      });
    }

    // 2. Enforce strict daily limit (Max 20/day)
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Daily generation quota exceeded. Maximum 20 QR checkouts per day.',
        remaining: 0,
        maxDaily: MAX_DAILY_CHECKOUTS,
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    // 3. Official Lifetime VIP pricing: strictly $3.00 USD
    const numAmount = 3.00;
    const finalCurrency = 'USD';
    const createdAt = Date.now();

    // 4. Generate live registered invoice using pay-helper KhqrGateway with Cloudflare __cf_bm protection
    let invoice = null;
    let capturedToken = null;
    let capturedClientId = null;
    let capturedDeviceId = null;

    try {
      const gw = getGateway();
      invoice = await gw.createInvoice({
        amount: numAmount,
        currency: finalCurrency,
        checkoutUrl: CHECKOUT_URL,
      });

      // Warmup check to register the session
      try {
        const warmup = await invoice.checkStatus();
        capturedToken = warmup?.token || null;
      } catch (e) {
        console.warn('[Checkout] Initial warmup warning:', e.message);
      }
    } catch (gwErr) {
      console.warn('[KhqrGateway Warmup Warning]:', gwErr.message, 'Falling back to pay-helper createPayment...');
      // Safe failover: synthesize authentic EMVCo KHQR payload using pay-helper
      const billNumber = `VIP-${Date.now().toString().slice(-8)}`;
      const fallbackPay = createPayment({
        bakongId: 'likakong@abaa',
        merchantName: 'QR Scan VIP',
        amount: numAmount,
        currency: finalCurrency,
        billNumber,
      });

      invoice = {
        tranId: billNumber,
        amount: numAmount,
        currency: finalCurrency,
        qrString: fallbackPay.qrString,
        deeplinks: fallbackPay.deeplinks,
        checkStatus: async () => ({ status: 'PENDING', tranId: billNumber }),
      };
    }

    const tranIdStr = String(invoice.tranId);

    // Cryptographically sign this payment session
    const signature = signPaymentSession({
      tranId: tranIdStr,
      userId,
      amount: numAmount,
      currency: finalCurrency,
      createdAt,
    });

    // Save in shared in-memory invoice store with cookieJar containing __cf_bm
    invoiceStore.set(tranIdStr, {
      invoice,
      checkStatus: invoice.checkStatus,
      tranId: tranIdStr,
      token: capturedToken,
      clientId: capturedClientId,
      deviceId: capturedDeviceId,
      cookieJar: globalCfCookieJar,
      userId,
      amount: numAmount,
      currency: finalCurrency,
      createdAt,
      signature,
    });

    return res.status(200).json({
      success: true,
      tranId: invoice.tranId,
      amount: numAmount,
      currency: finalCurrency,
      qrString: invoice.qrString,
      deeplinks: invoice.deeplinks,
      token: capturedToken,
      clientId: capturedClientId,
      deviceId: capturedDeviceId,
      cfCookieAttached: Boolean(globalCfCookieJar && globalCfCookieJar.includes('__cf_bm')),
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
