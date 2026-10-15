import type { Log, Settings } from './battery';
import { newId, type Repo } from './repo-shared';

// expo-sqlite on web needs COOP/COEP headers and a wasm build; the web target
// is only a preview, so localStorage is plenty.
const LOGS_KEY = 'wattchdog.logs';
const SETTINGS_KEY = 'wattchdog.settings';

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeLogs(logs: Log[]) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export async function openRepo(): Promise<Repo> {
  const logs = () => read<Log[]>(LOGS_KEY, []);
  return {
    listLogs: async () => logs().sort((a, b) => b.date - a.date),
    addLog: async (input) => writeLogs([...logs(), { ...input, id: newId() }]),
    addLogs: async (inputs) =>
      writeLogs([...logs(), ...inputs.map((input) => ({ ...input, id: newId() }))]),
    updateLog: async (log) => writeLogs(logs().map((l) => (l.id === log.id ? log : l))),
    deleteLog: async (id) => writeLogs(logs().filter((l) => l.id !== id)),
    getSettings: async () => read<Settings | null>(SETTINGS_KEY, null),
    saveSettings: async (settings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)),
  };
}
