import AsyncStorage from '@react-native-async-storage/async-storage';

interface RotationState {
  usedIds: string[];
  lastPickedDate: string;
  lastPickedId: string;
}

function todayString(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function loadState(storageKey: string): Promise<RotationState> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as RotationState;
  } catch {
    // Corrupt/missing storage — fall through to a fresh cycle.
  }
  return { usedIds: [], lastPickedDate: '', lastPickedId: '' };
}

/**
 * Picks one item per calendar day, at random, without repeating an item until
 * every other item has been shown at least once (tracked in AsyncStorage).
 * Once the pool is exhausted, the cycle resets and starts picking randomly
 * from the full list again. New items are immediately eligible since they've
 * never been in the "used" list.
 */
export async function pickWithoutRepeat<T extends { id: string }>(
  storageKey: string,
  items: T[],
  date: Date = new Date()
): Promise<T | null> {
  if (items.length === 0) return null;

  const state = await loadState(storageKey);
  const today = todayString(date);

  if (state.lastPickedDate === today) {
    const stillThere = items.find((item) => item.id === state.lastPickedId);
    if (stillThere) return stillThere;
  }

  let pool = items.filter((item) => !state.usedIds.includes(item.id));
  let usedIds = state.usedIds;
  if (pool.length === 0) {
    // Every item has been shown at least once — start a new cycle.
    pool = items;
    usedIds = [];
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  const nextState: RotationState = {
    usedIds: [...usedIds, picked.id],
    lastPickedDate: today,
    lastPickedId: picked.id,
  };
  await AsyncStorage.setItem(storageKey, JSON.stringify(nextState));

  return picked;
}
