import { describe, expect, it } from 'vitest';

import { csvToLogs, logsToCsv } from './csv';

describe('csv', () => {
  it('round-trips logs including awkward notes', () => {
    const logs = [
      { date: Date.UTC(2026, 0, 2, 8), kwh: 12.5, km: 80, percent: 21, note: 'cold, "snow"\nshort hop' },
      { date: Date.UTC(2026, 0, 1, 8), kwh: 30, km: 190, percent: 45, note: '' },
    ];
    const csv = logsToCsv(logs);
    expect(csv.split('\n')[0]).toBe('date,kwh_used,km,percent_used,note');

    const parsed = csvToLogs(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.logs).toEqual([logs[1], logs[0]]);
  });

  it('reports bad rows by line and keeps the good ones', () => {
    const csv = [
      'date,kwh_used,km,percent_used,note',
      '2026-01-01T08:00:00.000Z,30,190,45,ok',
      'yesterday,30,190,45,',
      '2026-01-03T08:00:00.000Z,30,190,0,',
    ].join('\r\n');
    const parsed = csvToLogs(csv);
    expect(parsed.logs).toHaveLength(1);
    expect(parsed.errors).toEqual(['Line 3: invalid date', 'Line 4: Between 1 and 100 %']);
  });

  it('rejects files without the required columns', () => {
    expect(csvToLogs('foo,bar\n1,2').errors[0]).toMatch(/Missing column/);
  });

  it('accepts files without a note column', () => {
    const parsed = csvToLogs('date,kwh_used,km,percent_used\n2026-01-01,30,190,45');
    expect(parsed.logs[0].note).toBe('');
  });
});
