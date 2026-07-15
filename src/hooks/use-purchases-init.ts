import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { configurePurchases, purchasesAvailable, resetPurchases } from "@/lib/revenuecat";

// Configures the RevenueCat SDK with the signed-in user's Supabase id as
// soon as it's available, and logs out of RevenueCat's own identity when
// they sign out -- mirrors usePushRegistration's exact shape (a boot-time
// side-effect hook keyed on user?.id, silently no-op when unavailable).
export function usePurchasesInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      resetPurchases();
      return;
    }
    if (!purchasesAvailable) return;
    configurePurchases(user.id);
  }, [user?.id]);
}
