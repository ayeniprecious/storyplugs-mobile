import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in."
  );
}

// Expo Router's web build prerenders on a Node server, where `window` (and AsyncStorage's web
// implementation, which reads `window.localStorage`) doesn't exist. No-op there instead of crashing.
const isBrowser = typeof window !== "undefined";
const ssrSafeStorage = {
  getItem: (key: string) => (isBrowser ? AsyncStorage.getItem(key) : Promise.resolve(null)),
  setItem: (key: string, value: string) =>
    isBrowser ? AsyncStorage.setItem(key, value) : Promise.resolve(),
  removeItem: (key: string) => (isBrowser ? AsyncStorage.removeItem(key) : Promise.resolve()),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
