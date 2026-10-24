/**
 * Strict Rate Limiter for Checkout QR Code Generation
 * Rule: Maximum 20 QR code generations per calendar day.
 */

export const MAX_DAILY_CHECKOUTS = 50;
const STORAGE_KEY = 'pay_helper_checkout_quota';

export function resetCheckoutQuota(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export interface DailyQuotaInfo {
  date: string;
  count: number;
  remaining: number;
  max: number;
  isExceeded: boolean;
  timeUntilReset: string;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStoredData(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.date === 'string' && typeof parsed.count === 'number') {
        const today = getTodayString();
        if (parsed.date === today) {
          return parsed;
        }
      }
    }
  } catch {
    // fallback if json parse fails
  }
  return { date: getTodayString(), count: 0 };
}

function calculateTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function getDailyQuotaInfo(): DailyQuotaInfo {
  const data = getStoredData();
  const count = data.count;
  const remaining = Math.max(0, MAX_DAILY_CHECKOUTS - count);
  return {
    date: data.date,
    count,
    remaining,
    max: MAX_DAILY_CHECKOUTS,
    isExceeded: remaining <= 0,
    timeUntilReset: calculateTimeUntilMidnight(),
  };
}

export function canGenerateCheckoutQR(): boolean {
  const { remaining } = getDailyQuotaInfo();
  return remaining > 0;
}

export function recordCheckoutQRGeneration(): DailyQuotaInfo {
  const today = getTodayString();
  const data = getStoredData();
  let newCount = data.count + 1;
  if (data.date !== today) {
    newCount = 1;
  }
  
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: newCount })
    );
  } catch {
    // ignore localstorage write errors
  }

  const remaining = Math.max(0, MAX_DAILY_CHECKOUTS - newCount);
  return {
    date: today,
    count: newCount,
    remaining,
    max: MAX_DAILY_CHECKOUTS,
    isExceeded: remaining <= 0,
    timeUntilReset: calculateTimeUntilMidnight(),
  };
}
