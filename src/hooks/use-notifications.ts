import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { AppNotification } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export interface NotificationItem {
  id: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  notification: Pick<AppNotification, "id" | "title" | "body" | "story_id">;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("notification_recipients")
      .select("id, read, read_at, created_at, notifications(id, title, body, story_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setItems(
      ((data as unknown as {
        id: string;
        read: boolean;
        read_at: string | null;
        created_at: string;
        notifications: AppNotification | null;
      }[]) ?? [])
        .filter((row) => row.notifications)
        .map((row) => ({
          id: row.id,
          read: row.read,
          readAt: row.read_at,
          createdAt: row.created_at,
          notification: row.notifications as AppNotification,
        }))
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return;
    // Multiple components (TopNav, the Notifications screen) can hold this hook at the same
    // time — Home stays mounted behind pushed screens — so each instance needs its own channel
    // name; reusing one across simultaneous subscribers throws on the second `.subscribe()`.
    const channel = supabase
      .channel(`notification_recipients:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_recipients", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const markAsRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    await supabase
      .from("notification_recipients")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase
      .from("notification_recipients")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false);
  }, [user?.id]);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("notification_recipients").delete().eq("id", id);
  }, []);

  const clearAll = useCallback(async () => {
    if (!user?.id) return;
    setItems([]);
    await supabase.from("notification_recipients").delete().eq("user_id", user.id);
  }, [user?.id]);

  return { items, loading, unreadCount, refresh, markAsRead, markAllAsRead, remove, clearAll };
}
