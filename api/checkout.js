/**
 * Production Serverless Handler for Live Checkout QR Generation via pay-helper
 * Compatible with Vercel Serverless Functions (ESM Node.js runtime)
 * 
 * Features:
 * - Direct connection to ABA PayWay checkout link: https://link.payway.com.kh/ABAPAYaA536712c
 * - Cloudflare WAF bypass via session cookie retention (__cf_bm) and mobile client hints
 * - Strict Rate Limiting: Maximum 20 QR code generations per day!
 */

import { KhqrGateway } from 'pay-helper';

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

// Singleton gateway with session cache retention (5 minutes)
let gatewayInstance = null;
function getGateway() {
  if (!gatewayInstance) {
    gatewayInstance = new KhqrGateway({
      checkoutUrl: CHECKOUT_URL,
      sessionCacheTtlMs: 300000, // 5-minute session cache retention
      timeoutMs: 15000,
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

    const userId = req.body?.userId || clientIp;

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

    // 3. Official Lifetime VIP pricing: $3.00 USD
    const numAmount = 3.00;
    const finalCurrency = 'USD';

    // 4. Generate live registered invoice using pay-helper KhqrGateway
    const gw = getGateway();
    const invoice = await gw.createInvoice({
      amount: numAmount,
      currency: finalCurrency,
      checkoutUrl: CHECKOUT_URL,
    });

    return res.status(200).json({
      success: true,
      tranId: invoice.tranId,
      amount: invoice.amount,
      currency: invoice.currency,
      qrString: invoice.qrString,
      deeplinks: invoice.deeplinks,
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
