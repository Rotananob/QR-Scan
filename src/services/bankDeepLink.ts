export interface BankInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  khmerName: string;
  color: string;
  textColor: string;
  bgLight: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  androidPackage: string;
  iosAppStoreId: string;
  playStoreUrl: string;
  appStoreUrl: string;
  scheme: string;
  webFallback: string;
  getAndroidIntent: (qrPayload: string) => string;
  getIosDeepLink: (qrPayload: string) => string;
}

export type PlatformType = 'ios' | 'android' | 'desktop';

/**
 * Verified Detection of Client Platform (iOS, Android, Desktop)
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS Safari
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function getDevicePlatform(): PlatformType {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'desktop';
}

/**
 * Cambodia Banks with Verified Deep Links for iOS & Android
 * - ABA iOS: Custom URI Scheme abamobilebank://ababank.com?type=payway&qrcode=...
 * - ABA Android: Official Intent with package com.aba.mobile.android
 * - Bakong iOS: Official URI Scheme bakong://open?qr=...
 * - Bakong Android: Official Intent with package kh.gov.nbc.bakong
 */
export const CAMBODIA_BANKS: Record<string, BankInfo> = {
  aba: {
    id: 'aba',
    code: 'ABAAKHPP',
    name: 'ABA Bank',
    shortName: 'ABA Mobile',
    khmerName: 'ធនាគារ អេ ប៊ី អេ',
    color: '#004b6e',
    textColor: '#ffffff',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeBg: 'bg-cyan-600 text-white',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    iconBg: 'bg-[#004b6e] text-white',
    androidPackage: 'com.aba.mobile.android',
    iosAppStoreId: '871239109',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.aba.mobile.android',
    appStoreUrl: 'https://apps.apple.com/kh/app/aba-mobile-bank/id871239109',
    scheme: 'abamobilebank://',
    webFallback: 'https://www.ababank.com/aba-mobile-app/',
    getAndroidIntent: (qr: string) => {
      const encoded = encodeURIComponent(qr);
      return `intent://ababank.com?type=payway&qrcode=${encoded}#Intent;scheme=abamobilebank;package=com.aba.mobile.android;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.aba.mobile.android')};end;`;
    },
    getIosDeepLink: (qr: string) => {
      return `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(qr)}`;
    },
  },
  bakong: {
    id: 'bakong',
    code: 'BAKONG',
    name: 'Bakong App (NBC)',
    shortName: 'Bakong App',
    khmerName: 'បាគង (ធនាគារជាតិ)',
    color: '#e53935',
    textColor: '#ffffff',
    bgLight: 'bg-red-50 dark:bg-red-950/40',
    badgeBg: 'bg-red-600 text-white',
    badgeText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-[#e53935] text-white',
    androidPackage: 'kh.gov.nbc.bakong',
    iosAppStoreId: '1463596489',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=kh.gov.nbc.bakong',
    appStoreUrl: 'https://apps.apple.com/kh/app/bakong/id1463596489',
    scheme: 'bakong://',
    webFallback: 'https://bakong.nbc.gov.kh/',
    getAndroidIntent: (qr: string) => {
      const encoded = encodeURIComponent(qr);
      return `intent://open?qr=${encoded}#Intent;scheme=bakong;package=kh.gov.nbc.bakong;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=kh.gov.nbc.bakong')};end;`;
    },
    getIosDeepLink: (qr: string) => {
      return `bakong://open?qr=${encodeURIComponent(qr)}`;
    },
  },
  acleda: {
    id: 'acleda',
    code: 'ACLEKHPP',
    name: 'ACLEDA Bank',
    shortName: 'ACLEDA mobile',
    khmerName: 'ធនាគារ អេស៊ីលីដា',
    color: '#003865',
    textColor: '#ffffff',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    badgeBg: 'bg-blue-800 text-amber-300',
    badgeText: 'text-blue-800 dark:text-amber-300',
    iconBg: 'bg-[#003865] text-[#d4af37]',
    androidPackage: 'com.acledabank.mobile',
    iosAppStoreId: '1143525287',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.acledabank.mobile',
    appStoreUrl: 'https://apps.apple.com/kh/app/acleda-mobile/id1143525287',
    scheme: 'acledamobile://',
    webFallback: 'https://www.acledabank.com.kh/kh/eng/ps_mbtoanchet',
    getAndroidIntent: (qr: string) => {
      const encoded = encodeURIComponent(qr);
      return `intent://open?qr=${encoded}#Intent;scheme=acledamobile;package=com.acledabank.mobile;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.acledabank.mobile')};end;`;
    },
    getIosDeepLink: (qr: string) => {
      return `acledamobile://open?qr=${encodeURIComponent(qr)}`;
    },
  },
  wing: {
    id: 'wing',
    code: 'WINGKHPP',
    name: 'Wing Bank',
    shortName: 'Wing Bank',
    khmerName: 'ធនាគារ វីង',
    color: '#8bc53f',
    textColor: '#ffffff',
    bgLight: 'bg-lime-50 dark:bg-lime-950/40',
    badgeBg: 'bg-lime-600 text-white',
    badgeText: 'text-lime-700 dark:text-lime-300',
    iconBg: 'bg-[#8bc53f] text-slate-900',
    androidPackage: 'com.wingmoney.wingpay',
    iosAppStoreId: '1192221299',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wingmoney.wingpay',
    appStoreUrl: 'https://apps.apple.com/kh/app/wing-bank-app/id1192221299',
    scheme: 'wingbank://',
    webFallback: 'https://www.wingmoney.com/',
    getAndroidIntent: (qr: string) => {
      const encoded = encodeURIComponent(qr);
      return `intent://open?qr=${encoded}#Intent;scheme=wingbank;package=com.wingmoney.wingpay;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.wingmoney.wingpay')};end;`;
    },
    getIosDeepLink: (qr: string) => {
      return `wingbank://open?qr=${encodeURIComponent(qr)}`;
    },
  },
  canadia: {
    id: 'canadia',
    code: 'CANAKHPP',
    name: 'Canadia Bank',
    shortName: 'Canadia Bank',
    khmerName: 'ធនាគារ កាណាឌីយ៉ា',
    color: '#d32f2f',
    textColor: '#ffffff',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    badgeBg: 'bg-rose-600 text-white',
    badgeText: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-[#b71c1c] text-white',
    androidPackage: 'com.canadiabank.mbanking',
    iosAppStoreId: '1478144211',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.canadiabank.mbanking',
    appStoreUrl: 'https://apps.apple.com/kh/app/canadia-bank/id1478144211',
    scheme: 'canadiabank://',
    webFallback: 'https://www.canadiabank.com.kh/',
    getAndroidIntent: (qr: string) => {
      const encoded = encodeURIComponent(qr);
      return `intent://open?qr=${encoded}#Intent;scheme=canadiabank;package=com.canadiabank.mbanking;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.canadiabank.mbanking')};end;`;
    },
    getIosDeepLink: (qr: string) => {
      return `canadiabank://open?qr=${encodeURIComponent(qr)}`;
    },
  },
  sathapana: {
    id: 'sathapana',
    code: 'SATHKHPP',
    name: 'Sathapana Bank',
    shortName: 'Sathapana Mobile',
    khmerName: 'ធនាគារ សាថ powerAll',
    color: '#004d40',
    textColor: '#ffffff',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    badgeBg: 'bg-teal-600 text-white',
    badgeText: 'text-teal-700 dark:text-teal-300',
    iconBg: 'bg-[#004d40] text-white',
    androidPackage: 'com.sathapana.mobilebanking',
    iosAppStoreId: '1436109968',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.sathapana.mobilebanking',
    appStoreUrl: 'https://apps.apple.com/kh/app/sathapana-mobile/id1436109968',
    scheme: 'sathapanamobile://',
    webFallback: 'https://www.sathapana.com.kh/',
    getAndroidIntent: (qr: string) => {
      const encoded = encodeURIComponent(qr);
      return `intent://open?qr=${encoded}#Intent;scheme=sathapanamobile;package=com.sathapana.mobilebanking;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.sathapana.mobilebanking')};end;`;
    },
    getIosDeepLink: (qr: string) => {
      return `sathapanamobile://open?qr=${encodeURIComponent(qr)}`;
    },
  },
};

/**
 * Detect the beneficiary bank from Bakong Account ID or acquiring bank name
 */
export function detectKHQRBank(
  bakongAccountId?: string,
  acquiringBank?: string
): BankInfo {
  const accountLower = (bakongAccountId || '').toLowerCase();
  const bankLower = (acquiringBank || '').toLowerCase();

  // 1. Check ABA Bank
  if (
    accountLower.includes('@abaa') ||
    accountLower.includes('@aba') ||
    bankLower.includes('aba') ||
    bankLower.includes('abaakhpp')
  ) {
    return CAMBODIA_BANKS.aba;
  }

  // 2. Check ACLEDA Bank
  if (
    accountLower.includes('@aclb') ||
    accountLower.includes('@acleda') ||
    bankLower.includes('acleda') ||
    bankLower.includes('aclekhpp')
  ) {
    return CAMBODIA_BANKS.acleda;
  }

  // 3. Check Wing Bank
  if (
    accountLower.includes('@wing') ||
    bankLower.includes('wing') ||
    bankLower.includes('wingkhpp')
  ) {
    return CAMBODIA_BANKS.wing;
  }

  // 4. Check Canadia Bank
  if (
    accountLower.includes('@cnba') ||
    accountLower.includes('@canadia') ||
    bankLower.includes('canadia') ||
    bankLower.includes('canakhpp')
  ) {
    return CAMBODIA_BANKS.canadia;
  }

  // 5. Check Sathapana Bank
  if (
    accountLower.includes('@spbk') ||
    accountLower.includes('@sathapana') ||
    bankLower.includes('sathapana') ||
    bankLower.includes('sathkhpp')
  ) {
    return CAMBODIA_BANKS.sathapana;
  }

  // Default to Bakong App (National Bank of Cambodia)
  return CAMBODIA_BANKS.bakong;
}

/**
 * Get direct Deep Link string for a specific bank and platform
 */
export function getBankDeepLink(bankId: string, qrPayload: string, platform?: PlatformType): string {
  const bank = CAMBODIA_BANKS[bankId] || CAMBODIA_BANKS.bakong;
  const targetPlatform = platform || getDevicePlatform();

  if (targetPlatform === 'android') {
    return bank.getAndroidIntent(qrPayload);
  }
  if (targetPlatform === 'ios') {
    return bank.getIosDeepLink(qrPayload);
  }
  return bank.webFallback;
}

/**
 * Universal Bakong Deep Link (Official Fallback for other banks)
 */
export function getBakongDeepLink(qrPayload: string, platform?: PlatformType): string {
  return getBankDeepLink('bakong', qrPayload, platform);
}

export interface LaunchBankOptions {
  autoCopyClipboard?: boolean;
  onBeforeLaunch?: () => void;
  onFallback?: (url: string) => void;
}

/**
 * Safely launch a bank app without showing browser "invalid address" error
 * - Android: Uses intent:// with S.browser_fallback_url (never errors, auto-falls back to Play Store)
 * - iOS: Triggers custom scheme abamobilebank:// or bakong://, with graceful timeout fallback
 * - Desktop: Opens official web portal / app preview without broken scheme
 */
export function launchBankApp(bank: BankInfo, qrPayload: string, options: LaunchBankOptions = {}): void {
  const { autoCopyClipboard = true, onBeforeLaunch, onFallback } = options;
  if (typeof window === 'undefined') return;

  onBeforeLaunch?.();

  // 1. Auto copy QR string into clipboard as a safety cushion for the user
  if (autoCopyClipboard && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(qrPayload).catch(() => {});
  }

  // 2. Android: Use verified Android Intent
  if (isAndroid()) {
    const intentUrl = bank.getAndroidIntent(qrPayload);
    window.location.href = intentUrl;
    return;
  }

  // 3. iOS (iPhone / iPad)
  if (isIOS()) {
    const iosDeepLink = bank.getIosDeepLink(qrPayload);
    const start = Date.now();
    window.location.href = iosDeepLink;

    // If app is not installed, the page will remain in focus
    setTimeout(() => {
      if (document.hasFocus() && Date.now() - start >= 2200 && !document.hidden) {
        if (onFallback) {
          onFallback(bank.appStoreUrl);
        } else {
          window.location.href = bank.appStoreUrl;
        }
      }
    }, 2200);
    return;
  }

  // 4. Desktop: Open official web portal or Play Store
  const desktopTarget = bank.webFallback || bank.playStoreUrl;
  window.open(desktopTarget, '_blank', 'noopener,noreferrer');
}
