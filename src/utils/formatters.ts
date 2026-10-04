/**
 * Simple money formatter:
 * Example: Rs. 15,000 or -Rs. 2,000
 */
export function formatMoney(amount: number | undefined | null, currency = 'Rs.'): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const isNegative = num < 0;
  const absFormatted = Math.abs(Math.round(num)).toLocaleString('en-US');
  if (isNegative) {
    return `-${currency} ${absFormatted}`;
  }
  return `${currency} ${absFormatted}`;
}

/**
 * Simple date formatter:
 * e.g. 04 Oct 2026
 */
export function formatDateSimple(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Return today's ISO date string: YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Normalize phone number for reliable matching:
 * e.g. 03257833708, 0325-7833708, +92 325 7833708, +923257833708, 00923257833708, 325 7833708
 */
export function normalizePhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\.\(\)\/]/g, '').trim();
  if (cleaned.startsWith('+92')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('0092')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('92') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('3')) {
    // Missing leading zero for Pakistani mobile: e.g. 3257833708 -> 03257833708
    cleaned = '0' + cleaned;
  }
  return cleaned.replace(/[^0-9]/g, '');
}

/**
 * Check if two phone numbers refer to the same customer
 */
export function isPhoneMatch(
  phoneA: string | undefined | null,
  phoneB: string | undefined | null
): boolean {
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (!normA || !normB || normA.length < 7 || normB.length < 7) return false;
  if (normA === normB) return true;
  // Handle matching if both have at least 10 digits and end with the same 10 digits
  if (normA.length >= 10 && normB.length >= 10) {
    return normA.slice(-10) === normB.slice(-10);
  }
  return false;
}

