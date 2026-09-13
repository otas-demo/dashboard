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


