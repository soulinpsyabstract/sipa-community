import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UsersRound, Hash } from "lucide-react";

interface Conversation {
  id: string;
  type: "direct" | "channel" | "group";
  channel_name: string | null;
  participants: string[];
  name?: string;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
  other_user_name?: string;
}

const channels = [
  { name: "general", label: "general" },
  { name: "show-and-tell", label: "show-and-tell" },
  { name: "co-founders", label: "co-founders" },
  { name: "open-source", label: "open-source" },
];

export default function DMConversationList() {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [directConvs, setDirectConvs] = useState<Conversation[]>([]);
  const [groupConvs, setGroupConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) return;
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  const loadConversations = async () => {
    if (!user || !supabase) return;
    setLoading(true);

    // Load DM conversations
    const { data: dms } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "direct")
      .contains("participants", [user.id])
      .order("created_at", { ascending: false });

    // Load group conversations
    const { data: groups } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "group")
      .contains("participants", [user.id])
      .order("created_at", { ascending: false });

    const enrichConv = async (conv: Conversation) => {
      let otherUserName: string | undefined;
      const name = conv.name;

      if (conv.type === "direct") {
        const otherUserId = conv.participants.find((p) => p !== user.id);
        if (otherUserId) {
          const { data: prof } = await supabase
            .from("user_profiles")
            .select("display_name")
            .eq("user_id", otherUserId)
            .single();
          if (prof) otherUserName = prof.display_name;
        }
      }

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      return {
        ...conv,
        other_user_name: otherUserName,
        name,
        last_message: (lastMsg as { content?: string })?.content,
        last_message_at: (lastMsg as { created_at?: string })?.created_at,
        unread_count: unread || 0,
      };
    };

    const [enrichedDms, enrichedGroups] = await Promise.all([
      dms ? Promise.all(dms.map(enrichConv)) : [],
      groups ? Promise.all(groups.map(enrichConv)) : [],
    ]);

    enrichedDms.sort((a, b) => {
      const aTime = a.last_message_at
        ? new Date(a.last_message_at).getTime()
        : 0;
      const bTime = b.last_message_at
        ? new Date(b.last_message_at).getTime()
        : 0;
      return bTime - aTime;
    });

    enrichedGroups.sort((a, b) => {
      const aTime = a.last_message_at
        ? new Date(a.last_message_at).getTime()
        : 0;
      const bTime = b.last_message_at
        ? new Date(b.last_message_at).getTime()
        : 0;
      return bTime - aTime;
    });

    setDirectConvs(enrichedDms);
    setGroupConvs(enrichedGroups);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allEmpty =
    directConvs.length === 0 &&
    groupConvs.length === 0 &&
    channels.length === 0;

  return (
    <div className="p-3 lg:p-4 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-lg font-bold text-foreground">Messages</h1>

      {allEmpty ? (
        <div className="bg-panel border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted">No conversations yet.</p>
          <p className="text-xs text-muted/60 mt-1">
            Go to Who's Online to start a DM with someone
          </p>
        </div>
      ) : (
        <>
          {/* Direct Messages */}
          {directConvs.length > 0 && (
            <section>
              <h2 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">
                Direct Messages
              </h2>
              <div className="space-y-1">
                {directConvs.map((conv) => {
                  const otherId = conv.participants.find(
                    (p) => p !== user?.id
                  );
                  return (
                    <button
                      key={conv.id}
                      onClick={() => otherId && navigate(`/dm/${otherId}`)}
                      className="w-full bg-panel border border-border rounded-lg p-3 hover:bg-surface transition-colors duration-150 text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                            {(conv.other_user_name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate font-medium">
                              {conv.other_user_name || "Unknown"}
                            </p>
                            {conv.last_message && (
                              <p className="text-xs text-muted truncate max-w-[180px] sm:max-w-[300px]">
                                {conv.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted whitespace-nowrap">
                              {formatTime(conv.last_message_at)}
                            </span>
                          )}
                          {conv.unread_count && conv.unread_count > 0 && (
                            <span className="text-[10px] bg-accent text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Group Chats */}
          {groupConvs.length > 0 && (
            <section>
              <h2 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">
                Groups
              </h2>
              <div className="space-y-1">
                {groupConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/group/${conv.id}`)}
                    className="w-full bg-panel border border-border rounded-lg p-3 hover:bg-surface transition-colors duration-150 text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                          <UsersRound size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate font-medium">
                            {conv.name || "Unnamed Group"}
                          </p>
                          {conv.last_message && (
                            <p className="text-xs text-muted truncate max-w-[180px] sm:max-w-[300px]">
                              {conv.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.last_message_at && (
                          <span className="text-[10px] text-muted whitespace-nowrap">
                            {formatTime(conv.last_message_at)}
                          </span>
                        )}
                        {conv.unread_count && conv.unread_count > 0 && (
                          <span className="text-[10px] bg-accent text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Channels */}
          <section>
            <h2 className="text-xs text-muted uppercase tracking-wider mb-2 px-1">
              Channels
            </h2>
            <div className="space-y-1">
              {channels.map((ch) => (
                <button
                  key={ch.name}
                  onClick={() => navigate(`/channel/${ch.name}`)}
                  className="w-full bg-panel border border-border rounded-lg p-3 hover:bg-surface transition-colors duration-150 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                      <Hash size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate font-medium">
                        #{ch.label}
                      </p>
                      <p className="text-xs text-muted">Public channel</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
