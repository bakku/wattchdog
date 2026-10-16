import type { Log, LogInput, Settings } from './battery';

export interface Repo {
  listLogs(): Promise<Log[]>;
  addLog(input: LogInput): Promise<void>;
  addLogs(inputs: LogInput[]): Promise<void>;
  updateLog(log: Log): Promise<void>;
  deleteLog(id: string): Promise<void>;
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<void>;
  /** Deletes every log and the car settings. */
  clearAll(): Promise<void>;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
