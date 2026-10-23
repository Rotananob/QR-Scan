#!/usr/bin/env node

/**
 * 🚀 High-Grade Telegram MTProto Direct Relay Bridge
 * Bypasses Telegram Bot API cold-DM restrictions by utilizing MTProto Client API (GramJS).
 * 
 * Target: Sends direct 1-on-1 private messages to Secondary Account (6762495028)
 * without requiring that account to press /start on their physical phone.
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import readline from 'readline';

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_STRING = process.env.TELEGRAM_STRING_SESSION || '';
const SECONDARY_CHAT_ID = '6762495028';

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

export async function createRelayClient() {
  let apiId = API_ID;
  let apiHash = API_HASH;

  if (!apiId || !apiHash) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚡ TELEGRAM MTPROTO DIRECT RELAY SETUP (ONE-TIME)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('This bypasses Bot API limits by sending direct private messages');
    console.log('from your active Telegram session to Acc 2 (6762495028)!\n');
    console.log('Get your free API_ID & API_HASH in 30 seconds at: https://my.telegram.org\n');

    const idStr = await ask('Enter API_ID: ');
    apiId = parseInt(idStr, 10);
    apiHash = await ask('Enter API_HASH: ');
  }

  const session = new StringSession(SESSION_STRING);
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await ask('Enter your active phone number (+855...): '),
    password: async () => await ask('Enter 2FA Password (if any, otherwise Enter): '),
    phoneCode: async () => await ask('Enter 5-digit verification code from Telegram: '),
    onError: (err) => console.error('Auth error:', err),
  });

  const savedSession = client.session.save();
  console.log('\n✅ AUTHENTICATED SUCCESSFULLY!');
  console.log('Save this TELEGRAM_STRING_SESSION for permanent headless operation:\n');
  console.log(savedSession);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return client;
}

export async function sendDirectPrivateMessage(client, targetId, messageText) {
  try {
    const peer = await client.getInputEntity(targetId);
    await client.sendMessage(peer, { message: messageText });
    console.log(`[MTProto Relay] ✅ Direct message dispatched to ${targetId}`);
    return true;
  } catch (err) {
    console.warn(`[MTProto Relay] Error sending to ${targetId}:`, err.message);
    return false;
  }
}

// Standalone execution test
if (process.argv[1]?.endsWith('telegram-relay.mjs')) {
  (async () => {
    try {
      const client = await createRelayClient();
      console.log(`📡 Sending test handshake to ${SECONDARY_CHAT_ID}...`);
      await sendDirectPrivateMessage(
        client,
        SECONDARY_CHAT_ID,
        '🔔 QR-Scan Direct Private Alert Handshake - Connected successfully!'
      );
      await client.disconnect();
      console.log('🎉 Done! Session ready.');
      process.exit(0);
    } catch (e) {
      console.error('Fatal error:', e);
      process.exit(1);
    }
  })();
}
