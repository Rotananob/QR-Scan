/**
 * AI Security Shield: Phishing, Homoglyph, and Threat Intelligence Analyzer
 * Evaluates scanned QR URLs to protect users from malicious sites before opening.
 */

export interface SecurityAnalysisResult {
  level: 'safe' | 'warning' | 'danger';
  score: number; // 0 to 100
  title: string;
  description: string;
  badges: { label: string; type: 'success' | 'warning' | 'danger' }[];
  threats: string[];
}

const KNOWN_OFFICIAL_DOMAINS = [
  'ababank.com',
  'payway.com.kh',
  'bakong.nbc.gov.kh',
  'nbc.gov.kh',
  'acledabank.com.kh',
  'wingmoney.com',
  'canadiabank.com.kh',
  'sathapana.com.kh',
  'google.com',
  'youtube.com',
  'facebook.com',
  'telegram.org',
  't.me',
  'github.com',
  'apple.com',
  'microsoft.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
];

const SUSPICIOUS_TLDS = [
  '.top', '.xyz', '.work', '.fit', '.kim', '.gq', '.cf', '.tk', '.ml', '.ga', '.surf', '.buzz', '.monster'
];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'buff.ly', 'ow.ly', 'goo.gl', 'shorte.st'
];

const DECEPTIVE_KEYWORDS = [
  'aba-bank', 'aba-login', 'aba-verify', 'payway-kh', 'bakong-app', 'bakong-reward',
  'acleda-login', 'wing-reward', 'free-crypto', 'claim-airdrop', 'verify-wallet',
  'telegram-nitro', 'facebook-security', 'free-gift', 'login-verify'
];

export function analyzeUrlSafety(rawUrl: string): SecurityAnalysisResult {
  let urlObj: URL | null = null;
  try {
    urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    return {
      level: 'warning',
      score: 50,
      title: 'តំណភ្ជាប់មិនប្រក្រតី (Malformed URL)',
      description: 'តំណភ្ជាប់នេះមិនមានទម្រង់ត្រឹមត្រូវតាមស្ដង់ដារអ៊ីនធឺណិតឡើយ។ សូមប្រយ័ត្នមុនពេលបើក។',
      badges: [{ label: 'ទម្រង់មិនស្តង់ដារ', type: 'warning' }],
      threats: ['Malformed URL syntax'],
    };
  }

  const hostname = urlObj.hostname.toLowerCase();
  const protocol = urlObj.protocol.toLowerCase();
  const pathname = urlObj.pathname.toLowerCase();

  const threats: string[] = [];
  const badges: { label: string; type: 'success' | 'warning' | 'danger' }[] = [];
  let score = 100;

  // 1. Check known verified official domains
  const isVerifiedOfficial = KNOWN_OFFICIAL_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );

  if (isVerifiedOfficial && protocol === 'https:') {
    return {
      level: 'safe',
      score: 99,
      title: 'តំណភ្ជាប់ផ្លូវការ និងមានសុវត្ថិភាព (Verified Official)',
      description: 'Domain នេះជាកម្មសិទ្ធិរបស់ស្ថាប័នធនាគារ ឬក្រុមហ៊ុនល្បីឈ្មោះផ្លូវការដែលបានផ្ទៀងផ្ទាត់។',
      badges: [
        { label: 'ផ្លូវការ (Verified Domain)', type: 'success' },
        { label: 'SSL Encrypted (HTTPS)', type: 'success' },
      ],
      threats: [],
    };
  }

  // 2. Unencrypted HTTP Check
  if (protocol !== 'https:') {
    score -= 30;
    threats.push('Unencrypted HTTP connection (គ្មានប្រព័ន្ធសុវត្ថិភាព SSL/TLS)');
    badges.push({ label: 'គ្មាន HTTPS (Not Secure)', type: 'danger' });
  } else {
    badges.push({ label: 'SSL Encrypted (HTTPS)', type: 'success' });
  }

  // 3. Raw IP Address as domain (often used in phishing / attacks)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    score -= 40;
    threats.push('Direct IP Address Host (ប្រើលេខ IP ដោយគ្មានឈ្មោះ Domain)');
    badges.push({ label: 'IP Host (គួរឱ្យសង្ស័យ)', type: 'danger' });
  }

  // 4. Punycode / Cyrillic Homograph Attacks (e.g. xn--)
  if (hostname.includes('xn--')) {
    score -= 50;
    threats.push('Punycode Homograph Attack (តួអក្សរក្លែងបន្លំភ្នែក)');
    badges.push({ label: 'អក្សរក្លែងបន្លំ (Punycode)', type: 'danger' });
  }

  // 5. Deceptive Financial Spoofing Keywords
  for (const kw of DECEPTIVE_KEYWORDS) {
    if (hostname.includes(kw) || pathname.includes(kw)) {
      score -= 50;
      threats.push(`Deceptive Phishing Keyword "${kw}" detected`);
      badges.push({ label: 'ក្លែងបន្លំធនាគារ (Spoofing)', type: 'danger' });
      break;
    }
  }

  // 6. Suspicious TLDs
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      score -= 20;
      threats.push(`Uncommon/High-risk TLD (${tld})`);
      badges.push({ label: `កន្ទុយ ${tld} (High-Risk TLD)`, type: 'warning' });
      break;
    }
  }

  // 7. URL Shorteners
  if (URL_SHORTENERS.some((s) => hostname === s || hostname.endsWith(`.${s}`))) {
    score -= 15;
    threats.push('URL Shortener (តំណភ្ជាប់បិទបាំងទិសដៅដើម)');
    badges.push({ label: 'Link បំព្រួញ (Shortened)', type: 'warning' });
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) {
    return {
      level: 'safe',
      score,
      title: 'តំណភ្ជាប់មានសុវត្ថិភាពខ្ពស់ (Safe Link)',
      description: 'មិនមានសញ្ញានៃការក្លែងបន្លំ ឬ Phishing ត្រូវបានរកឃើញទេ។ អ្នកអាចបើកបានដោយទំនុកចិត្ត។',
      badges: badges.length > 0 ? badges : [{ label: 'Clean Domain', type: 'success' }],
      threats,
    };
  }

  if (score >= 50) {
    return {
      level: 'warning',
      score,
      title: 'តំណភ្ជាប់គួរឱ្យសង្ស័យ (Suspicious Link)',
      description: 'តំណភ្ជាប់នេះមានចំណុចមិនប្រក្រតីមួយចំនួន (ដូចជា Link បំព្រួញ ឬកន្ទុយ Domain មិនសូវស្គាល់)។ សូមប្រុងប្រយ័ត្ន!',
      badges,
      threats,
    };
  }

  return {
    level: 'danger',
    score,
    title: 'គ្រោះថ្នាក់! សង្ស័យជា Phishing / Scam',
    description: 'ប្រព័ន្ធ AI Security បានរកឃើញសញ្ញាក្លែងបន្លំ (Phishing) គួរឱ្យសង្ស័យខ្លាំង។ សូមកុំបញ្ចូលលេខសម្ងាត់ ឬព័ត៌មានធនាគារ!',
    badges,
    threats,
  };
}
