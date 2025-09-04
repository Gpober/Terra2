// src/lib/utils.ts
/**
 * Merges class names together and filters out falsy values
 * @param classes Array of class names
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats currency values consistently
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats date strings consistently
 * @param date Date string or object
 * @returns Formatted date string (MMM DD, YYYY)
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculates percentage change between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Percentage change with sign
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): string {
  if (previous === 0) return "0%";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

/**
 * Debounces a function to limit execution rate
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Truncates text with ellipsis
 * @param text Text to truncate
 * @param length Max length before truncation
 * @returns Truncated text
 */
export function truncate(text: string, length = 50): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

/**
 * Returns the start and end dates for the current month
 * @returns Object with start and end in YYYY-MM-DD format
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}
