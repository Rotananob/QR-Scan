/**
 * Production Serverless Handler for Realtime Tracking & Telegram Alerts
 * Compatible with Vercel Serverless Functions & Local Vite Dev Server
 */

import {
  sendTelegramAlert,
  getClientIp,
  getClientLocation,
  parseDeviceDetails,
  getCambodiaTimeString,
} from './_telegram.js';

// In-memory ledger to debounce duplicate visitor alerts (1 alert per IP/user per 30 minutes)
const visitorDedupeMap = new Map();
const VISITOR_COOLDOWN_MS = 30 * 60 * 1000;

function shouldAlertVisitor(key) {
  const now = Date.now();
  const lastAlert = visitorDedupeMap.get(key);
  if (lastAlert && now - lastAlert < VISITOR_COOLDOWN_MS) {
    return false;
  }
  visitorDedupeMap.set(key, now);
  // Clean old entries periodically
  if (visitorDedupeMap.size > 2000) {
    for (const [k, v] of visitorDedupeMap.entries()) {
      if (now - v > VISITOR_COOLDOWN_MS) visitorDedupeMap.delete(k);
    }
  }
  return true;
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
    const { event, clientData = {}, user = null, details = {} } = req.body || {};
    const ip = getClientIp(req);
    const loc = await getClientLocation(ip, req);
    const device = parseDeviceDetails(req.headers['user-agent'], clientData);
    const time = getCambodiaTimeString();

    const userInfo = user?.email
      ? `${user.displayName || 'User'} (${user.email})`
      : 'Guest Visitor (មិនទាន់ Login)';

    // 1. New Visitor on website / PWA
    if (event === 'page_visit') {
      const dedupeKey = `${loc.ip}_${user?.uid || 'guest'}`;
      if (shouldAlertVisitor(dedupeKey)) {
        const msg = [
          '🌐 <b>NEW VISITOR ON QR SCAN!</b>',
          '━━━━━━━━━━━━━━━━━━',
          `📍 <b>Location:</b> ${loc.city}, ${loc.country} ${loc.flag}`,
          `🌐 <b>IP Address:</b> <code>${loc.ip}</code> (${loc.isp})`,
          `📱 <b>Device:</b> ${device.platform}`,
          `🖥 <b>Display:</b> ${device.display} (${device.screen})`,
          `👤 <b>User:</b> ${userInfo}`,
          `🔗 <b>Page:</b> ${details.path || '/'}`,
          `⏰ <b>Time:</b> ${time}`,
          '━━━━━━━━━━━━━━━━━━',
        ].join('\n');

        await sendTelegramAlert(msg);
      }
      return res.status(200).json({ success: true, tracked: true });
    }

    // 2. User clicked Generate QR code
    if (event === 'qr_generated') {
      const qrType = details.type || 'Custom QR';
      const contentSnippet = details.title || details.preview || 'Content created';

      const msg = [
        '✨ <b>QR CODE GENERATED!</b>',
        '━━━━━━━━━━━━━━━━━━',
        `🏷 <b>QR Type:</b> <b>${qrType.toUpperCase()}</b>`,
        `📝 <b>Title/Content:</b> <code>${String(contentSnippet).slice(0, 100)}</code>`,
        `👤 <b>User:</b> ${userInfo}`,
        `📱 <b>Device:</b> ${device.platform} (${device.display})`,
        `📍 <b>Location:</b> ${loc.city}, ${loc.country} ${loc.flag}`,
        `🌐 <b>IP Address:</b> <code>${loc.ip}</code>`,
        `⏰ <b>Time:</b> ${time}`,
        '━━━━━━━━━━━━━━━━━━',
      ].join('\n');

      await sendTelegramAlert(msg);
      return res.status(200).json({ success: true, tracked: true });
    }

    // 3. Checkout QR expired
    if (event === 'qr_expired') {
      const msg = [
        '⏳ <b>CHECKOUT QR EXPIRED (UNPAID)</b>',
        '━━━━━━━━━━━━━━━━━━',
        `🧾 <b>Tran ID:</b> <code>${details.tranId || 'Unknown'}</code>`,
        `💵 <b>Amount:</b> $3.00 USD`,
        `👤 <b>User:</b> ${userInfo}`,
        `⌛ <b>Reason:</b> 3-minute timeout without settlement`,
        `📱 <b>Device:</b> ${device.platform}`,
        `📍 <b>Location:</b> ${loc.city}, ${loc.country} ${loc.flag}`,
        `🌐 <b>IP Address:</b> <code>${loc.ip}</code>`,
        `⏰ <b>Time:</b> ${time}`,
        '━━━━━━━━━━━━━━━━━━',
      ].join('\n');

      await sendTelegramAlert(msg);
      return res.status(200).json({ success: true, tracked: true });
    }

    return res.status(400).json({ error: 'Unknown event type.' });
  } catch (err) {
    console.error('[Track API Error]:', err);
    return res.status(500).json({ error: err.message || 'Tracking error.' });
  }
}
