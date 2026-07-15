import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

// Unlike Supabase's keys (see lib/supabase.ts), these aren't required for
// the app to even boot -- only for the Premium purchase flow, and they
// won't exist until RevenueCat's dashboard is set up with real store
// products. Missing keys (or running on web, where there's no native store
// to attach to) disable purchases gracefully instead of crashing the app.
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const apiKey = Platform.OS === "ios" ? IOS_API_KEY : Platform.OS === "android" ? ANDROID_API_KEY : undefined;

export const purchasesAvailable = Platform.OS !== "web" && !!apiKey;

// The RevenueCat entitlement identifier configured in the dashboard --
// whatever product/package a user buys, granting this entitlement is what
// both this client and the revenuecat-webhook edge function key off of to
// decide is_premium. Must match the entitlement identifier you create in
// RevenueCat exactly.
export const PREMIUM_ENTITLEMENT_ID = "premium";

let configuredForUserId: string | null = null;

// Ties RevenueCat's own user identity to the same uuid Supabase already
// uses (auth.uid()) -- the revenuecat-webhook edge function relies on
// app_user_id in RevenueCat's event payload matching profiles.id exactly,
// so this must be called with the Supabase user id, not left anonymous.
export function configurePurchases(userId: string) {
  if (!purchasesAvailable || !apiKey || configuredForUserId === userId) return;
  Purchases.configure({ apiKey, appUserID: userId });
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  configuredForUserId = userId;
}

export async function resetPurchases() {
  if (!purchasesAvailable || !configuredForUserId) return;
  configuredForUserId = null;
  try {
    await Purchases.logOut();
  } catch {
    // no identified user to log out -- fine, nothing to clean up
  }
}

export { Purchases };
