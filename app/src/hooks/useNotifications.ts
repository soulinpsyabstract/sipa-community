import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string;
  type: "friend_request" | "message" | "reaction" | "system";
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  from_user_id: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user, supabase } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!user || !supabase) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [user, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel("notifications")
      .on<Notification>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);
          if (!newNotif.is_read) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAsRead = async (id: string) => {
    if (!supabase) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    if (!user || !supabase) return;
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, reload: load };
}
