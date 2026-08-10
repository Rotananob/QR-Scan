const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];
const SAFE_PROTOCOLS = ['https:', 'http:'];

export interface ValidationResult {
  isValid: boolean;
  isDangerous: boolean;
  isSecure: boolean;
  warning?: string;
  normalizedUrl?: string;
}

export function validateURL(raw: string): ValidationResult {
  try {
    const url = new URL(raw);
    const protocol = url.protocol.toLowerCase();

    if (DANGEROUS_PROTOCOLS.includes(protocol)) {
      return {
        isValid: false,
        isDangerous: true,
        isSecure: false,
        warning: `Dangerous protocol blocked: ${protocol}`,
      };
    }

    if (!SAFE_PROTOCOLS.includes(protocol)) {
      return {
        isValid: true,
        isDangerous: false,
        isSecure: false,
        warning: `Unusual protocol: ${protocol}`,
        normalizedUrl: url.href,
      };
    }

    const isSecure = protocol === 'https:';
    return {
      isValid: true,
      isDangerous: false,
      isSecure,
      warning: isSecure ? undefined : 'This site uses HTTP (not secure)',
      normalizedUrl: url.href,
    };
  } catch {
    return {
      isValid: false,
      isDangerous: false,
      isSecure: false,
      warning: 'Invalid URL format',
    };
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isLikelyMalicious(content: string): boolean {
  const lower = content.toLowerCase();
  if (DANGEROUS_PROTOCOLS.some((p) => lower.startsWith(p))) return true;
  if (/<script/i.test(content)) return true;
  if (/javascript\s*:/i.test(content)) return true;
  return false;
}
