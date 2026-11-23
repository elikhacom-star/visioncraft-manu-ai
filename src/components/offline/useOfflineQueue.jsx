import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'offline_queue_v1';

export default function useOfflineQueue() {
  const [queue, setQueue] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const persist = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setQueue(next);
  };

  const addTask = useCallback((task) => {
    const withId = { id: task.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, retries: 0, ...task };
    persist([...queue, withId]);
    return withId;
  }, [queue]);

  const removeTask = useCallback((id) => {
    persist(queue.filter(t => t.id !== id));
  }, [queue]);

  const clearQueue = useCallback(() => {
    persist([]);
  }, [queue]);

  // Process with provided async handler(task) => void
  const processQueue = useCallback(async (handler) => {
    let processed = 0;
    let errors = 0;
    for (const task of [...queue]) {
      try {
        await handler(task);
        processed += 1;
        // remove after success
        const next = (prev => prev.filter(t => t.id !== task.id))(queue);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setQueue(next);
      } catch (e) {
        errors += 1;
        // keep the task for later
      }
    }
    return { processed, errors, total: queue.length };
  }, [queue]);

  // Keep state in sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setQueue(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { queue, addTask, removeTask, clearQueue, processQueue };
}