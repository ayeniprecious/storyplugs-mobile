import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { AppNotification, Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export interface NotificationItem {
  id: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  notification: Pick<AppNotification, "id" | "title" | "body" | "story_id">;
  // Populated from notification_stories -- independent of the single
  // story_id above, and ordered by the admin's chosen rank.
  stories: Story[];
}

interface NotificationStoryRow {
  notification_id: string;
  sort_order: number;
  stories: Story | null;
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

    const rows = (data as unknown as {
      id: string;
      read: boolean;
      read_at: string | null;
      created_at: string;
      notifications: AppNotification | null;
    }[]) ?? [];
    const notificationIds = rows.map((row) => row.notifications?.id).filter((id): id is string => !!id);

    // Separate query mirroring use-curated-sections.ts's story-list pattern --
    // most notifications carry no story list at all, so skip it entirely then.
    const storiesByNotification = new Map<string, Story[]>();
    if (notificationIds.length > 0) {
      const { data: links } = await supabase
        .from("notification_stories")
        .select("notification_id, sort_order, stories(*)")
        .in("notification_id", notificationIds)
        .order("sort_order", { ascending: true });

      for (const link of (links as NotificationStoryRow[] | null) ?? []) {
        if (!link.stories) continue;
        const list = storiesByNotification.get(link.notification_id) ?? [];
        list.push(link.stories);
        storiesByNotification.set(link.notification_id, list);
      }
    }

    setItems(
      rows
        .filter((row) => row.notifications)
        .map((row) => ({
          id: row.id,
          read: row.read,
          readAt: row.read_at,
          createdAt: row.created_at,
          notification: row.notifications as AppNotification,
          stories: storiesByNotification.get((row.notifications as AppNotification).id) ?? [],
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
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`notification_recipients:${user.id}:${suffix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_recipients", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    // notification_recipients only changes when a notification is sent or read/removed --
    // an admin editing an existing notification's title/body updates the parent `notifications`
    // row instead, which has no user_id to filter on, so this listens unfiltered.
    const contentChannel = supabase
      .channel(`notifications:${user.id}:${suffix}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(contentChannel);
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
