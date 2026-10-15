import { validateLog, type LogInput } from './battery';

const HEADER = ['date', 'kwh_used', 'km', 'percent_used', 'note'];

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function logsToCsv(logs: LogInput[]): string {
  const rows = [...logs]
    .sort((a, b) => a.date - b.date)
    .map((l) =>
      [new Date(l.date).toISOString(), String(l.kwh), String(l.km), String(l.percent), l.note]
        .map(escapeField)
        .join(','),
    );
  return [HEADER.join(','), ...rows].join('\n') + '\n';
}

/** RFC 4180 tokenizer: handles quoted fields, escaped quotes and newlines inside quotes. */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

export type CsvImport = { logs: LogInput[]; errors: string[] };

export function csvToLogs(text: string): CsvImport {
  const rows = parseRows(text.replace(/^﻿/, ''));
  if (rows.length === 0) return { logs: [], errors: ['The file is empty'] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const column = (name: string) => header.indexOf(name);
  const missing = HEADER.slice(0, 4).filter((name) => column(name) === -1);
  if (missing.length > 0) {
    return { logs: [], errors: [`Missing column(s): ${missing.join(', ')}`] };
  }

  const logs: LogInput[] = [];
  const errors: string[] = [];
  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const get = (name: string) => (row[column(name)] ?? '').trim();
    const log: LogInput = {
      date: Date.parse(get('date')),
      kwh: Number(get('kwh_used')),
      km: Number(get('km')),
      percent: Number(get('percent_used')),
      note: column('note') === -1 ? '' : (row[column('note')] ?? ''),
    };
    if (Number.isNaN(log.date)) {
      errors.push(`Line ${line}: invalid date`);
      return;
    }
    const fieldErrors = Object.values(validateLog(log));
    if (fieldErrors.length > 0) {
      errors.push(`Line ${line}: ${fieldErrors.join(', ')}`);
      return;
    }
    logs.push(log);
  });
  return { logs, errors };
}
