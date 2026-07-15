import { useCallback, useEffect, useState } from "react";
import Purchases, {
  CustomerInfo,
  PURCHASES_ERROR_CODE,
  PurchasesPackage,
} from "react-native-purchases";

import { PREMIUM_ENTITLEMENT_ID, purchasesAvailable } from "@/lib/revenuecat";

// Wraps the RevenueCat SDK for manage-subscription.tsx: available packages
// for the current offering, the signed-in user's current entitlement
// status, and purchase/restore actions. `available` is false on web or
// when RevenueCat keys aren't configured yet -- callers should show a
// "coming soon"-style state rather than a broken purchase button in that
// case, the same way the rest of this app degrades for unconfigured
// features instead of crashing.
export function usePurchases() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!purchasesAvailable) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [offerings, info] = await Promise.all([Purchases.getOfferings(), Purchases.getCustomerInfo()]);
      setPackages(offerings.current?.availablePackages ?? []);
      setCustomerInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load subscription plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The client-side read of entitlement status -- used for instant UI
  // feedback right after a purchase. The source of truth for is_premium in
  // Supabase is still the revenuecat-webhook edge function, not this value.
  const isPremiumFromStore = !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  const managementUrl = customerInfo?.managementURL ?? null;

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    setError(null);
    try {
      const { customerInfo: updated } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updated);
      return { error: null };
    } catch (err) {
      const code = (err as { code?: PURCHASES_ERROR_CODE })?.code;
      if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { error: null };
      }
      const message = err instanceof Error ? err.message : "Purchase failed. Please try again.";
      setError(message);
      return { error: message };
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setPurchasing(true);
    setError(null);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Restore failed.";
      setError(message);
      return { error: message };
    } finally {
      setPurchasing(false);
    }
  }, []);

  return {
    available: purchasesAvailable,
    loading,
    purchasing,
    error,
    packages,
    isPremiumFromStore,
    managementUrl,
    purchase,
    restore,
    refresh,
  };
}
