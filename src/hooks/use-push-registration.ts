import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Registers this device for push and saves the Expo push token to the user's profile.
// Real remote push (app closed / phone locked) only works on a physical device or an Android
// emulator with Google Play services (FCM works there) with a development or production build —
// Expo Go (SDK 53+), web, and the iOS Simulator (a hard platform limitation, unlike Android's
// emulator) cannot receive it, so this silently no-ops there instead of throwing.
export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    const unsupported =
      Platform.OS === "web" || (Platform.OS === "ios" && !Device.isDevice);
    if (!user?.id || unsupported) return;

    let cancelled = false;

    async function register() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn(
          "No EAS projectId configured — skipping push token registration. Run `eas init` before building for real push delivery."
        );
        return;
      }

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled || !token) return;
        await supabase.from("profiles").update({ push_token: token }).eq("id", user!.id);
      } catch (err) {
        console.warn("Failed to get Expo push token:", err);
      }
    }

    register();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);
}
