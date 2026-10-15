const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' });
const monthYearFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' });

export function formatDate(ms: number): string {
  return dateFormat.format(ms);
}

export function formatShortDate(ms: number): string {
  return shortDateFormat.format(ms);
}

export function formatMonth(ms: number, withYear: boolean): string {
  return (withYear ? monthYearFormat : monthFormat).format(ms);
}

/** Calendar-relative label for the log form: Today, Yesterday, or a date. */
export function formatDay(ms: number, now = Date.now()): string {
  const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(ms);
}

export function fixed(value: number, digits = 1): string {
  return value.toFixed(digits);
}
