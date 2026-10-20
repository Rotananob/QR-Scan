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
  getAndroidIntent: (qrPayload: string) => string;
  getIosDeepLink: (qrPayload: string) => string;
}

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
    androidPackage: 'com.paygo24.ibank',
    iosAppStoreId: '871239109',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.paygo24.ibank',
    appStoreUrl: 'https://apps.apple.com/kh/app/aba-mobile-bank/id871239109',
    scheme: 'abamobilebank://',
    getAndroidIntent: (qr: string) =>
      `intent://ababank.com/payway?qrcode=${encodeURIComponent(qr)}#Intent;scheme=abamobilebank;package=com.paygo24.ibank;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.paygo24.ibank')};end;`,
    getIosDeepLink: (qr: string) =>
      `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(qr)}`,
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
    androidPackage: 'com.domain.acledabankqr',
    iosAppStoreId: '1143525287',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.domain.acledabankqr',
    appStoreUrl: 'https://apps.apple.com/kh/app/acleda-mobile/id1143525287',
    scheme: 'acledamobile://',
    getAndroidIntent: (qr: string) =>
      `intent://acledabank.com.kh?qr=${encodeURIComponent(qr)}#Intent;scheme=acledamobile;package=com.domain.acledabankqr;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.domain.acledabankqr')};end;`,
    getIosDeepLink: (qr: string) =>
      `acledamobile://pay?qr=${encodeURIComponent(qr)}`,
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
    scheme: 'wingmoney://',
    getAndroidIntent: (_qr: string) =>
      `intent://#Intent;scheme=wingmoney;package=com.wingmoney.wingpay;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.wingmoney.wingpay')};end;`,
    getIosDeepLink: (qr: string) =>
      `wingmoney://pay?qr=${encodeURIComponent(qr)}`,
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
    androidPackage: 'jp.co.soramitsu.bakong',
    iosAppStoreId: '1463596489',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=jp.co.soramitsu.bakong',
    appStoreUrl: 'https://apps.apple.com/kh/app/bakong/id1463596489',
    scheme: 'bakong://',
    getAndroidIntent: (_qr: string) =>
      `intent://#Intent;scheme=bakong;package=jp.co.soramitsu.bakong;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=jp.co.soramitsu.bakong')};end;`,
    getIosDeepLink: (_qr: string) => `bakong://`,
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
    getAndroidIntent: (_qr: string) =>
      `intent://#Intent;scheme=canadiabank;package=com.canadiabank.mbanking;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.canadiabank.mbanking')};end;`,
    getIosDeepLink: (_qr: string) => `canadiabank://`,
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
    getAndroidIntent: (_qr: string) =>
      `intent://#Intent;scheme=sathapanamobile;package=com.sathapana.mobilebanking;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.sathapana.mobilebanking')};end;`,
    getIosDeepLink: (_qr: string) => `sathapanamobile://`,
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

  // Default to Bakong App
  return CAMBODIA_BANKS.bakong;
}

/**
 * Safely launch a bank app without showing browser "invalid address" error
 */
export function launchBankApp(bank: BankInfo, qrPayload: string): void {
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isAndroid) {
    // Android Chrome supports intent:// with S.browser_fallback_url
    // This will open the app if installed, or silently redirect to Play Store without error!
    const intentUrl = bank.getAndroidIntent(qrPayload);
    window.location.href = intentUrl;
    return;
  }

  if (isIOS) {
    // On iOS Safari, opening unregistered scheme throws "Safari cannot open the page because the address is invalid".
    // We attempt opening via a hidden iframe, and if app not installed within 1.5s, open the App Store.
    const deepLink = bank.getIosDeepLink(qrPayload);
    const start = Date.now();

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
      // If the app wasn't opened (page still visible and time hasn't lagged), open App Store
      if (Date.now() - start < 1800 && !document.hidden) {
        window.open(bank.appStoreUrl, '_blank');
      }
    }, 1200);
    return;
  }

  // Desktop or fallback: Open official Play Store or App Store page
  window.open(bank.playStoreUrl, '_blank');
}
