import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MessageSquare, Hash, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface UserResult {
  type: "user";
  user_id: string;
  display_name: string;
  bio: string;
}

interface MessageResult {
  type: "message";
  id: string;
  content: string;
  conversation_id: string;
  sender_id: string;
  channel_name?: string;
  sender_name?: string;
  created_at: string;
}

type Result = UserResult | MessageResult;

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { supabase } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!supabase || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const q = `%${query}%`;
      const tasks: Promise<Result[]>[] = [];

      // Search users
      tasks.push(
        (async () => {
          const { data } = await supabase
            .from("user_profiles")
            .select("user_id, display_name, bio")
            .or(`display_name.ilike.${q},bio.ilike.${q}`)
            .limit(5);
          return (data || []).map(
            (u): UserResult => ({
              type: "user",
              user_id: u.user_id,
              display_name: u.display_name,
              bio: u.bio || "",
            })
          );
        })()
      );

      // Search messages
      tasks.push(
        (async () => {
          const { data: msgData } = await supabase
            .from("messages")
            .select("id, content, conversation_id, sender_id, created_at")
            .ilike("content", q)
            .order("created_at", { ascending: false })
            .limit(10);

          if (!msgData || msgData.length === 0) return [] as Result[];

          const senderIds = [...new Set(msgData.map((m) => m.sender_id))];
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("user_id, display_name")
            .in("user_id", senderIds);
          const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

          const convIds = [...new Set(msgData.map((m) => m.conversation_id))];
          const { data: convs } = await supabase
            .from("conversations")
            .select("id, channel_name")
            .in("id", convIds);
          const channelMap = new Map((convs || []).map((c) => [c.id, c.channel_name]));

          return msgData.map(
            (m): MessageResult => ({
              type: "message",
              id: m.id,
              content: m.content,
              conversation_id: m.conversation_id,
              sender_id: m.sender_id,
              sender_name: nameMap.get(m.sender_id) || m.sender_id.slice(0, 8),
              channel_name: channelMap.get(m.conversation_id) || undefined,
              created_at: m.created_at,
            })
          );
        })()
      );

      const all = await Promise.all(tasks);
      setResults(all.flat());
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  const handleSelect = (result: Result) => {
    onClose();
    if (result.type === "user") {
      navigate(`/user/${result.user_id}`);
    } else {
      navigate(`/dm/${result.sender_id}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-panel border border-border rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users and messages..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 focus:outline-none"
          />
          {loading && <Loader2 size={14} className="text-muted animate-spin" />}
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto scroll-thin">
          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="px-4 py-8 text-center text-muted text-xs">
              No results found for "{query}"
            </div>
          )}

          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.type === "user" ? r.user_id : r.id}`}
              onClick={() => handleSelect(r)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150 cursor-pointer hover:bg-surface ${
                i > 0 ? "border-t border-border/50" : ""
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {r.type === "user" ? (
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                    {r.display_name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <MessageSquare size={16} className="text-muted mt-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {r.type === "user" ? r.display_name : r.sender_name}
                  </span>
                  {r.type === "user" && r.bio && (
                    <span className="text-[10px] text-muted truncate">{r.bio}</span>
                  )}
                  {r.type === "message" && r.channel_name && (
                    <span className="text-[10px] text-muted flex items-center gap-0.5">
                      <Hash size={10} /> {r.channel_name}
                    </span>
                  )}
                </div>
                {r.type === "message" && (
                  <div className="text-[11px] text-muted mt-0.5 line-clamp-1">
                    {r.content}
                  </div>
                )}
              </div>
            </button>
          ))}

          {query.length < 2 && (
            <div className="px-4 py-8 text-center text-muted text-xs">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
