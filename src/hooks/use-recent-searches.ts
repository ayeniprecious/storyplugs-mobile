import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "storyplugs.recentSearches";
const MAX_RECENT = 8;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setRecent(JSON.parse(stored));
        } catch {
          // ignore malformed stored value
        }
      }
    });
  }, []);

  function persist(next: string[]) {
    setRecent(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSearch = useCallback(
    (query: string) => {
      persist(recent.filter((q) => q !== query));
    },
    [recent]
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, []);

  return { recent, addSearch, removeSearch, clearAll };
}
