import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import type { Log, LogInput, Settings } from '@/lib/battery';
import { openRepo } from '@/lib/repo';
import type { Repo } from '@/lib/repo-shared';

type Store = {
  ready: boolean;
  logs: Log[];
  settings: Settings | null;
  addLog(input: LogInput): Promise<void>;
  importLogs(inputs: LogInput[]): Promise<void>;
  updateLog(log: Log): Promise<void>;
  deleteLog(id: string): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      const opened = await openRepo();
      const [loadedLogs, loadedSettings] = await Promise.all([
        opened.listLogs(),
        opened.getSettings(),
      ]);
      setLogs(loadedLogs);
      setSettings(loadedSettings);
      setRepo(opened);
    })();
  }, []);

  const mutate = useCallback(
    async (change: (r: Repo) => Promise<void>) => {
      if (!repo) return;
      await change(repo);
      setLogs(await repo.listLogs());
    },
    [repo],
  );

  const store: Store = {
    ready: repo !== null,
    logs,
    settings,
    addLog: (input) => mutate((r) => r.addLog(input)),
    importLogs: (inputs) => mutate((r) => r.addLogs(inputs)),
    updateLog: (log) => mutate((r) => r.updateLog(log)),
    deleteLog: (id) => mutate((r) => r.deleteLog(id)),
    saveSettings: async (next) => {
      await repo?.saveSettings(next);
      setSettings(next);
    },
  };

  return <StoreContext value={store}>{children}</StoreContext>;
}

export function useStore(): Store {
  const store = use(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
