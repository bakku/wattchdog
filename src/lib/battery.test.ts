import { describe, expect, it } from 'vitest';

import {
  averageEfficiency,
  efficiency,
  estimateCapacity,
  headlineCapacity,
  isImplausible,
  isLowConfidence,
  parseNumber,
  stateOfHealth,
  trend,
  validateLog,
  weightOf,
  type Log,
} from './battery';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 15);

let nextId = 0;
function log(partial: Partial<Log>): Log {
  return {
    id: String(nextId++),
    date: NOW,
    kwh: 15,
    km: 100,
    percent: 25,
    note: '',
    ...partial,
  };
}

describe('per-log figures', () => {
  it('estimates capacity from energy and % used', () => {
    expect(estimateCapacity({ kwh: 15, percent: 25 })).toBe(60);
  });

  it('computes state of health against nominal', () => {
    expect(stateOfHealth(69.3, 77)).toBeCloseTo(90);
  });

  it('computes efficiency in kWh/100 km', () => {
    expect(efficiency({ kwh: 18, km: 120 })).toBe(15);
  });

  it('flags trips under 20 % as low confidence and down-weights them', () => {
    expect(isLowConfidence({ percent: 19 })).toBe(true);
    expect(isLowConfidence({ percent: 20 })).toBe(false);
    expect(weightOf({ percent: 10 })).toBeCloseTo(3.5);
    expect(weightOf({ percent: 40 })).toBe(40);
  });

  it('warns when an estimate deviates more than 25 % from nominal', () => {
    expect(isImplausible(60, 77)).toBe(false);
    expect(isImplausible(55, 77)).toBe(true);
    expect(isImplausible(100, 77)).toBe(true);
  });
});

describe('headlineCapacity', () => {
  it('returns null without logs', () => {
    expect(headlineCapacity([], NOW)).toBeNull();
  });

  it('weights by % used within the 90-day window', () => {
    const logs = [
      ...Array.from({ length: 4 }, (_, i) => log({ date: NOW - i * DAY, kwh: 30, percent: 50 })), // 60 kWh, w=50
      log({ date: NOW - 5 * DAY, kwh: 14, percent: 20 }), // 70 kWh, w=20
    ];
    const result = headlineCapacity(logs, NOW)!;
    expect(result.usedFallback).toBe(false);
    expect(result.sampleCount).toBe(5);
    expect(result.capacityKwh).toBeCloseTo((60 * 200 + 70 * 20) / 220);
  });

  it('ignores logs older than 90 days when the window has enough', () => {
    const logs = [
      ...Array.from({ length: 5 }, (_, i) => log({ date: NOW - i * DAY, kwh: 15, percent: 25 })),
      log({ date: NOW - 200 * DAY, kwh: 40, percent: 50 }),
    ];
    expect(headlineCapacity(logs, NOW)!.capacityKwh).toBeCloseTo(60);
  });

  it('falls back to the latest five logs when the window is sparse', () => {
    const logs = [
      log({ date: NOW - 10 * DAY, kwh: 15, percent: 25 }),
      ...Array.from({ length: 6 }, (_, i) => log({ date: NOW - (200 + i) * DAY, kwh: 35, percent: 50 })),
    ];
    const result = headlineCapacity(logs, NOW)!;
    expect(result.usedFallback).toBe(true);
    expect(result.sampleCount).toBe(5);
    expect(result.capacityKwh).toBeCloseTo((60 * 25 + 70 * 200) / 225);
  });
});

describe('trend', () => {
  it('returns one point per log in date order', () => {
    const points = trend([log({ date: NOW }), log({ date: NOW - 10 * DAY })]);
    expect(points.map((p) => p.date)).toEqual([NOW - 10 * DAY, NOW]);
  });

  it('pulls an outlier towards its neighbours', () => {
    const logs = [
      log({ date: NOW - 2 * DAY, kwh: 30, percent: 50 }),
      log({ date: NOW - DAY, kwh: 7, percent: 10 }), // 70 kWh, low confidence
      log({ date: NOW, kwh: 30, percent: 50 }),
    ];
    const outlier = trend(logs)[1].capacityKwh;
    expect(outlier).toBeGreaterThan(60);
    expect(outlier).toBeLessThan(62);
  });
});

describe('averageEfficiency', () => {
  it('divides total energy by total distance', () => {
    expect(averageEfficiency([log({ kwh: 10, km: 100 }), log({ kwh: 30, km: 100 })])).toBe(20);
  });

  it('returns null without distance', () => {
    expect(averageEfficiency([])).toBeNull();
  });
});

describe('input', () => {
  it('validates hard limits', () => {
    expect(validateLog({ kwh: 15, km: 100, percent: 25 })).toEqual({});
    expect(Object.keys(validateLog({ kwh: 0, km: NaN, percent: 101 }))).toEqual(['kwh', 'km', 'percent']);
  });

  it('parses comma decimals', () => {
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber(' ')).toBeNaN();
  });
});
