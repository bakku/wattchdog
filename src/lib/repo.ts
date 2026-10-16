import * as SQLite from 'expo-sqlite';

import type { LogInput, Settings } from './battery';
import { newId, type Repo } from './repo-shared';

type LogRow = { id: string; date: number; kwh: number; km: number; percent: number; note: string };

async function migrate(db: SQLite.SQLiteDatabase) {
  const { user_version: version } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  ))!;
  if (version < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE logs (
        id TEXT PRIMARY KEY NOT NULL,
        date INTEGER NOT NULL,
        kwh REAL NOT NULL,
        km REAL NOT NULL,
        percent REAL NOT NULL,
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX logs_date ON logs (date);
      CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      PRAGMA user_version = 1;
    `);
  }
}

export async function openRepo(): Promise<Repo> {
  const db = await SQLite.openDatabaseAsync('wattchdog.db');
  await migrate(db);

  const insert = (input: LogInput) =>
    db.runAsync(
      'INSERT INTO logs (id, date, kwh, km, percent, note) VALUES (?, ?, ?, ?, ?, ?)',
      newId(),
      input.date,
      input.kwh,
      input.km,
      input.percent,
      input.note,
    );

  return {
    listLogs: () => db.getAllAsync<LogRow>('SELECT * FROM logs ORDER BY date DESC'),
    addLog: async (input) => {
      await insert(input);
    },
    addLogs: (inputs) =>
      db.withTransactionAsync(async () => {
        for (const input of inputs) await insert(input);
      }),
    updateLog: async (log) => {
      await db.runAsync(
        'UPDATE logs SET date = ?, kwh = ?, km = ?, percent = ?, note = ? WHERE id = ?',
        log.date,
        log.kwh,
        log.km,
        log.percent,
        log.note,
        log.id,
      );
    },
    deleteLog: async (id) => {
      await db.runAsync('DELETE FROM logs WHERE id = ?', id);
    },
    getSettings: async () => {
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'settings'",
      );
      return row ? (JSON.parse(row.value) as Settings) : null;
    },
    saveSettings: async (settings) => {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('settings', ?)",
        JSON.stringify(settings),
      );
    },
    clearAll: () =>
      db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM logs');
        await db.runAsync('DELETE FROM settings');
      }),
  };
}
