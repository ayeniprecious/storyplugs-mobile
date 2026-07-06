import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

// Handles taps on the OS push notification — both while the app is running (foreground/background)
// and a cold start where tapping the notification is what launched the app.
export function useNotificationResponseHandler() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    function handleResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as
        | { storyId?: string | null; notificationId?: string }
        | undefined;
      if (data?.storyId) {
        router.push({ pathname: "/story/[id]", params: { id: data.storyId } });
      } else {
        router.push("/notifications");
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);
}
