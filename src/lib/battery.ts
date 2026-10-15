export type Log = {
  id: string;
  /** Unix epoch milliseconds. */
  date: number;
  /** Energy used on the trip, from the car's trip computer. */
  kwh: number;
  km: number;
  /** State-of-charge percentage points used on the trip (1–100). */
  percent: number;
  note: string;
};

export type LogInput = Omit<Log, 'id'>;

export type Settings = {
  carName: string;
  nominalKwh: number;
};

const DAY = 24 * 60 * 60 * 1000;

/** Below this many % used, SoC rounding makes an estimate unreliable. */
export const LOW_CONFIDENCE_PERCENT = 20;
/** Low-confidence logs still count, but much less. */
export const LOW_CONFIDENCE_WEIGHT = 0.35;
/** An estimate further than this from nominal is probably a typo. */
export const IMPLAUSIBLE_DEVIATION = 0.25;

export const HEADLINE_WINDOW_DAYS = 90;
export const HEADLINE_MIN_LOGS = 5;
const TREND_BANDWIDTH_DAYS = 30;

export function estimateCapacity(log: Pick<Log, 'kwh' | 'percent'>): number {
  return log.kwh / (log.percent / 100);
}

export function stateOfHealth(capacityKwh: number, nominalKwh: number): number {
  return (capacityKwh / nominalKwh) * 100;
}

/** kWh per 100 km. */
export function efficiency(log: Pick<Log, 'kwh' | 'km'>): number {
  return (log.kwh / log.km) * 100;
}

export function isLowConfidence(log: Pick<Log, 'percent'>): boolean {
  return log.percent < LOW_CONFIDENCE_PERCENT;
}

/** Bigger trips are less affected by SoC rounding, so they count more. */
export function weightOf(log: Pick<Log, 'percent'>): number {
  return log.percent * (isLowConfidence(log) ? LOW_CONFIDENCE_WEIGHT : 1);
}

export function isImplausible(capacityKwh: number, nominalKwh: number): boolean {
  return Math.abs(capacityKwh / nominalKwh - 1) > IMPLAUSIBLE_DEVIATION;
}

function weightedCapacity(logs: Log[]): number {
  let sum = 0;
  let weights = 0;
  for (const log of logs) {
    const w = weightOf(log);
    sum += estimateCapacity(log) * w;
    weights += w;
  }
  return sum / weights;
}

export type Headline = {
  capacityKwh: number;
  sampleCount: number;
  /** True when the 90-day window was too sparse and the latest logs were used instead. */
  usedFallback: boolean;
};

/**
 * Weighted average over the last 90 days. If that window holds fewer than
 * five logs, the five most recent logs are used instead.
 */
export function headlineCapacity(logs: Log[], now = Date.now()): Headline | null {
  if (logs.length === 0) return null;
  const newestFirst = [...logs].sort((a, b) => b.date - a.date);
  const windowStart = now - HEADLINE_WINDOW_DAYS * DAY;
  const recent = newestFirst.filter((l) => l.date >= windowStart);
  const usedFallback = recent.length < HEADLINE_MIN_LOGS;
  const sample = usedFallback ? newestFirst.slice(0, HEADLINE_MIN_LOGS) : recent;
  return {
    capacityKwh: weightedCapacity(sample),
    sampleCount: sample.length,
    usedFallback,
  };
}

export type TrendPoint = { date: number; capacityKwh: number };

/**
 * Smoothed capacity at each log's date: a Gaussian time kernel combined with
 * each log's confidence weight, so one odd reading can't yank the line around.
 */
export function trend(logs: Log[]): TrendPoint[] {
  const sorted = [...logs].sort((a, b) => a.date - b.date);
  const bandwidth = TREND_BANDWIDTH_DAYS * DAY;
  return sorted.map((at) => {
    let sum = 0;
    let weights = 0;
    for (const log of sorted) {
      const distance = (log.date - at.date) / bandwidth;
      const w = weightOf(log) * Math.exp(-0.5 * distance * distance);
      sum += estimateCapacity(log) * w;
      weights += w;
    }
    return { date: at.date, capacityKwh: sum / weights };
  });
}

/** Total energy over total distance, so long trips count proportionally. */
export function averageEfficiency(logs: Log[]): number | null {
  let kwh = 0;
  let km = 0;
  for (const log of logs) {
    kwh += log.kwh;
    km += log.km;
  }
  return km > 0 ? (kwh / km) * 100 : null;
}

export type Range = '3M' | '1Y' | 'All';

export function rangeStart(range: Range, now = Date.now()): number {
  switch (range) {
    case '3M':
      return now - 91 * DAY;
    case '1Y':
      return now - 365 * DAY;
    case 'All':
      return -Infinity;
  }
}

export type FieldErrors = Partial<Record<'kwh' | 'km' | 'percent', string>>;

export function validateLog(input: Pick<LogInput, 'kwh' | 'km' | 'percent'>): FieldErrors {
  const errors: FieldErrors = {};
  if (!Number.isFinite(input.kwh) || input.kwh <= 0) errors.kwh = 'Enter the kWh used';
  if (!Number.isFinite(input.km) || input.km <= 0) errors.km = 'Enter the distance driven';
  if (!Number.isFinite(input.percent) || input.percent < 1 || input.percent > 100) {
    errors.percent = 'Between 1 and 100 %';
  }
  return errors;
}

/** Parses user-typed numbers, accepting a comma as decimal separator. */
export function parseNumber(text: string): number {
  const cleaned = text.trim().replace(',', '.');
  return cleaned === '' ? NaN : Number(cleaned);
}
