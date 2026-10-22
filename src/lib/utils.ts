import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats duration strictly in months:
 * e.g. 1 -> "1 month"
 * e.g. 2 -> "2 months"
 * e.g. 3 -> "3 months"
 * e.g. 12 -> "12 months"
 */
export function formatDuration(duration: number | undefined): string {
  if (!duration && duration !== 0) return '1 month';
  const num = Number(duration);
  if (isNaN(num) || num <= 0) return '1 month';

  return `${num} ${num === 1 ? 'month' : 'months'}`;
}

/**
 * Escapes user input so it can be used literally inside a RegExp
 * (search boxes would otherwise throw on "(" or allow ReDoS patterns).
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Contract end date = startDate + duration (months).
 * Returns null when the start date cannot be parsed.
 */
export function getContractEndDate(startDate: string | undefined, duration: number | undefined): Date | null {
  if (!startDate) return null;
  const end = new Date(startDate);
  if (isNaN(end.getTime())) return null;
  const months = Number(duration) > 0 ? Number(duration) : 1;
  end.setMonth(end.getMonth() + months);
  return end;
}


