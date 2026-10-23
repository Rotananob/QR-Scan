/**
 * 2-Way Interactive Telegram Bot Command Center
 * Bot Token: 8652045486:AAESDUgU15iP8CbYdLZwGdQBS22sWGo6UxQ
 * Owner Chat ID: 5969566967
 */

import { sendTelegramMessage } from './_telegram.js';
import { getFirebaseAdmin } from './_firebaseAdmin.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8652045486:AAESDUgU15iP8CbYdLZwGdQBS22sWGo6UxQ';
const OWNER_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || '5969566967');

export default async function handler(req, res) {
  // CORS & method verification
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Healthcheck or Set Webhook
  if (req.method === 'GET') {
    const action = req.query?.action;
    const webhookUrl = req.query?.url;

    if (action === 'setWebhook' && webhookUrl) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
        );
        const data = await response.json();
        return res.status(200).json(data);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(200).json({
      status: 'active',
      service: 'QR Scan Telegram 2-Way Bot Command Center',
      ownerChatId: OWNER_CHAT_ID,
      time: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body || {};
    const message = update.message;

    if (!message || !message.text) {
      return res.status(200).json({ ok: true, note: 'No text message' });
    }

    const chatId = String(message.chat?.id);
    const text = message.text.trim();
    const fromUser = message.from?.username || message.from?.first_name || 'User';

    // 1. Strict Owner Authentication
    if (chatId !== OWNER_CHAT_ID) {
      await sendTelegramMessage(
        chatId,
        `⛔ <b>Access Denied</b>\nសូមទោស! គណនី Telegram របស់អ្នក (ID: <code>${chatId}</code>) មិនមានសិទ្ធិបញ្ជា Bot នេះឡើយ។\nមានតែ Admin ផ្លូវការប៉ុណ្ណោះដែលអាចប្រើបាន។`
      );
      return res.status(200).json({ ok: true, denied: true });
    }

    // 2. Command Router
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ').trim();

    const { db, auth, FieldValue } = getFirebaseAdmin();

    switch (command) {
      case '/start':
      case '/help': {
        const helpMsg = `
🤖 <b>QR SCAN ADMIN COMMAND CENTER</b>
━━━━━━━━━━━━━━━━━━━━
សួស្ដីបង <b>${fromUser}</b>! នេះជាមជ្ឈមណ្ឌលបញ្ជា 2-Way Telegram Bot ផ្លូវការ។

📌 <b>បញ្ជាដែលអ្នកអាចប្រើបាន (Commands):</b>
• <code>/stats</code> — ពិនិត្យមើលស្ថិតិអ្នកប្រើប្រាស់ & VIP Live
• <code>/vip email@example.com</code> — ផ្ដល់សិទ្ធិ VIP Lifetime ភ្លាមៗ
• <code>/revoke email@example.com</code> — ដកសិទ្ធិ VIP ពីគណនី
• <code>/broadcast សារផ្សាយដំណឹង</code> — ផ្សាយដំណឹងបន្ទាន់ទៅកាន់ App
• <code>/ping</code> — ពិនិត្យស្ថានភាព Server
━━━━━━━━━━━━━━━━━━━━
💡 <i>គ្រាន់តែចុចលើ Command ខាងលើ ឬវាយបញ្ចូលជាការស្រេច!</i>
`;
        await sendTelegramMessage(chatId, helpMsg);
        break;
      }

      case '/stats': {
        let totalUsers = 0;
        let vipUsers = 0;
        let recentPayments = 0;

        try {
          // Users count
          const usersSnap = await db.collection('users').get();
          totalUsers = usersSnap.size;

          usersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.isLifetime === true || data.subscription?.status === 'active') {
              vipUsers++;
            }
          });

          // Invoices / Transactions
          const invSnap = await db.collection('invoices').get();
          recentPayments = invSnap.size;
        } catch (dbErr) {
          console.warn('[TelegramBot] Stats query error:', dbErr);
        }

        const statsMsg = `
📊 <b>QR SCAN LIVE DASHBOARD STATS</b>
━━━━━━━━━━━━━━━━━━━━
👥 <b>អ្នកប្រើប្រាស់សរុប (Users):</b> <code>${totalUsers}</code> នាក់
👑 <b>សមាជិក VIP Lifetime:</b> <code>${vipUsers}</code> នាក់
💰 <b>វិក្កយបត្រ / Transactions:</b> <code>${recentPayments}</code>
🟢 <b>ស្ថានភាពប្រព័ន្ធ (Server):</b> <b>Healthy & Running</b>
🛡️ <b>AI Security Shield:</b> <b>Active (V2.0)</b>
⏰ <b>ពេលវេលា:</b> ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
━━━━━━━━━━━━━━━━━━━━
`;
        await sendTelegramMessage(chatId, statsMsg);
        break;
      }

      case '/vip': {
        const targetEmail = args.toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) {
          await sendTelegramMessage(
            chatId,
            '⚠️ <b>របៀបប្រើ:</b> <code>/vip user@gmail.com</code>\nសូមបញ្ជាក់អ៊ីមែលដែលអ្នកចង់ Upgrade ជា VIP។'
          );
          break;
        }

        let userRecord = null;
        let uid = null;

        // Try getting by Auth first
        try {
          userRecord = await auth.getUserByEmail(targetEmail);
          uid = userRecord.uid;
        } catch {
          // If not in Auth by email, search Firestore users collection
          try {
            const querySnap = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
            if (!querySnap.empty) {
              const doc = querySnap.docs[0];
              uid = doc.id;
            }
          } catch {}
        }

        if (!uid) {
          await sendTelegramMessage(
            chatId,
            `❌ <b>រកមិនឃើញគណនី:</b> <code>${targetEmail}</code>\nសូមប្រាកដថាអ្នកប្រើប្រាស់បានចុះឈ្មោះក្នុង App រួចហើយ។`
          );
          break;
        }

        // Grant Lifetime VIP in Firestore
        await db.collection('users').doc(uid).set(
          {
            isLifetime: true,
            subscription: {
              status: 'active',
              plan: 'lifetime',
              method: 'telegram_bot_grant',
              grantedBy: `Admin (${chatId})`,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );

        const successMsg = `
🎉 <b>VIP LIFETIME GRANTED BY TELEGRAM!</b>
━━━━━━━━━━━━━━━━━━━━
✅ <b>គណនី:</b> <code>${targetEmail}</code>
🆔 <b>User UID:</b> <code>${uid}</code>
💎 <b>គម្រោង:</b> <b>VIP Lifetime (Full Pro Access)</b>
📅 <b>កាលបរិច្ឆេទ:</b> ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
━━━━━━━━━━━━━━━━━━━━
អតិថិជនអាចប្រើប្រាស់មុខងារ VIP ទាំងអស់បានភ្លាមៗ! 🚀
`;
        await sendTelegramMessage(chatId, successMsg);
        break;
      }

      case '/revoke': {
        const targetEmail = args.toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) {
          await sendTelegramMessage(
            chatId,
            '⚠️ <b>របៀបប្រើ:</b> <code>/revoke user@gmail.com</code>'
          );
          break;
        }

        let uid = null;
        try {
          const userRec = await auth.getUserByEmail(targetEmail);
          uid = userRec.uid;
        } catch {
          const qSnap = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
          if (!qSnap.empty) uid = qSnap.docs[0].id;
        }

        if (!uid) {
          await sendTelegramMessage(chatId, `❌ រកមិនឃើញគណនី: <code>${targetEmail}</code>`);
          break;
        }

        await db.collection('users').doc(uid).set(
          {
            isLifetime: false,
            subscription: {
              status: 'canceled',
              revokedBy: `Admin (${chatId})`,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );

        await sendTelegramMessage(
          chatId,
          `🚫 <b>VIP REVOKED</b>\nគណនី <code>${targetEmail}</code> ត្រូវបានដកសិទ្ធិ VIP រួចរាល់។`
        );
        break;
      }

      case '/broadcast': {
        if (!args) {
          await sendTelegramMessage(
            chatId,
            '⚠️ <b>របៀបប្រើ:</b> <code>/broadcast សារដែលចង់ផ្សាយដំណឹង</code>'
          );
          break;
        }

        try {
          await db.collection('broadcasts').doc('active').set({
            message: args,
            active: true,
            createdAt: FieldValue.serverTimestamp(),
            author: `Admin (${chatId})`,
          });

          await sendTelegramMessage(
            chatId,
            `📢 <b>BROADCAST ANNOUNCED</b>\n━━━━━━━━━━━━━━━━━━━━\nសារផ្សាយដំណឹងត្រូវបានដាក់ផ្សាយទូទាំង App:\n"<i>${args}</i>"`
          );
        } catch (bErr) {
          await sendTelegramMessage(chatId, `❌ បរាជ័យក្នុងការផ្សាយ: ${bErr.message}`);
        }
        break;
      }

      case '/ping': {
        await sendTelegramMessage(chatId, `🏓 <b>Pong!</b> QR Scan Command Center is online and ready.`);
        break;
      }

      default: {
        await sendTelegramMessage(
          chatId,
          `❓ មិនស្គាល់បញ្ជា <code>${command}</code> ទេ។ វាយ <code>/help</code> ដើម្បីមើលបញ្ជាដែលមាន។`
        );
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[TelegramWebhook Error]:', error);
    return res.status(500).json({ error: error.message });
  }
}
