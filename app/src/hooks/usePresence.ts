import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export interface PresenceUser {
  user_id: string;
  display_name: string;
  avatar_url: string;
  current_app: string;
  online_at: number;
}

// Presence tracking itself lives in AuthContext (one channel per session,
// shared across the whole SIPA ecosystem). This hook just reshapes that
// state into the shape the NativelyAI-derived UI expects, instead of
// running a second, competing presence channel.
export function usePresence() {
  const { online, profile } = useAuth();

  const onlineUsers = useMemo<PresenceUser[]>(() => {
    return Object.values(online)
      .filter((p) => p.id !== profile?.user_id)
      .map((p) => ({
        user_id: p.id,
        display_name: p.name,
        avatar_url: "",
        current_app: p.app,
        online_at: Date.now(),
      }));
  }, [online, profile?.user_id]);

  return { onlineUsers, updateCurrentApp: async () => {} };
}
