/**
 * Pure Client-Side EMVCo KHQR Builder
 * Generates 100% compliant Bakong/NBC standard KHQR payment strings
 * Zero Node.js runtime dependencies (fast, lightweight, pure browser compatible)
 */

function formatTlv(tag: string, value: string): string {
  const len = new TextEncoder().encode(value).length;
  const lenStr = len.toString().padStart(2, '0');
  return `${tag}${lenStr}${value}`;
}

export function computeKhqrCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface BuildClientKhqrOptions {
  bakongId?: string;
  abaAccount?: string;
  merchantName: string;
  merchantCity?: string;
  amount?: number;
  currency?: 'USD' | 'KHR';
  billNumber?: string;
  terminalId?: string;
}

export function generateClientKhqr(options: BuildClientKhqrOptions): string {
  const bakongId = (options.bakongId || '').trim();
  const abaAccount = (options.abaAccount || '').trim();
  const merchantName = options.merchantName.trim().toUpperCase() || 'NOB ROTANA';
  const city = (options.merchantCity || 'Phnom Penh').trim();
  const currency = options.currency || 'USD';
  const currencyCode = currency === 'KHR' ? '116' : '840';

  // Tag 00: Format Indicator ('01')
  let payload = formatTlv('00', '01');

  // Tag 01: Initiation Method ('12' = Dynamic if amount provided, '11' = Static if no amount)
  const isDynamic = typeof options.amount === 'number' && options.amount > 0;
  payload += formatTlv('01', isDynamic ? '12' : '11');

  // Tag 30 (ABA Bank Direct Acquiring) or Tag 29 (General Bakong)
  if (abaAccount) {
    const sub00 = formatTlv('00', 'abaakhppxxx@abaa');
    const sub01 = formatTlv('01', abaAccount);
    const sub02 = formatTlv('02', 'ABA Bank');
    payload += formatTlv('30', `${sub00}${sub01}${sub02}`);
  } else if (bakongId) {
    const subtag00 = formatTlv('00', bakongId);
    payload += formatTlv('29', subtag00);
  }

  // Tag 52: Merchant Category Code ('4814' for PayWay telecomm/services, '5999' for General)
  payload += formatTlv('52', abaAccount ? '4814' : '5999');

  // Tag 53: Transaction Currency (840 for USD, 116 for KHR)
  payload += formatTlv('53', currencyCode);

  // Tag 54: Transaction Amount (if specified)
  if (isDynamic) {
    const amountStr = currency === 'KHR' ? Math.round(options.amount!).toString() : options.amount!.toFixed(2);
    payload += formatTlv('54', amountStr);
  }

  // Tag 58: Country Code ('KH')
  payload += formatTlv('58', 'KH');

  // Tag 59: Merchant Name
  payload += formatTlv('59', merchantName);

  // Tag 60: Merchant City
  payload += formatTlv('60', city);

  // Tag 62: Additional Data (Bill Number / Terminal)
  if (options.billNumber || options.terminalId) {
    let sub62 = '';
    if (options.billNumber) sub62 += formatTlv('01', options.billNumber);
    if (options.terminalId) sub62 += formatTlv('07', options.terminalId);
    payload += formatTlv('62', sub62);
  }

  // Tag 63: CRC16 Checksum (Placeholder '6304' then append 4-character hex checksum)
  const crcInput = payload + '6304';
  const crc = computeKhqrCrc16(crcInput);

  return crcInput + crc;
}
