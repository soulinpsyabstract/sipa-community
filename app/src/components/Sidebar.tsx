import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MessageCircle,
  Hash,
  Rss,
  Users,
  User,
  Plus,
  UsersRound,
  X,
} from "lucide-react";

const channels = [
  { name: "general", label: "general" },
  { name: "show-and-tell", label: "show-and-tell" },
  { name: "co-founders", label: "co-founders" },
  { name: "open-source", label: "open-source" },
];

interface DMConv {
  id: string;
  otherUserId: string;
  otherUserName: string;
  unreadCount: number;
}

interface GroupConv {
  id: string;
  name: string;
  created_by: string;
  unreadCount: number;
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, supabase } = useAuth();
  const [dmConvs, setDmConvs] = useState<DMConv[]>([]);
  const [groupConvs, setGroupConvs] = useState<GroupConv[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const currentPath = location.pathname;

  useEffect(() => {
    if (!user || !supabase) return;
    loadDmConvs();
    loadGroupConvs();
    loadPendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  // Refresh when navigating back to root
  useEffect(() => {
    if (currentPath === "/" && supabase) {
      loadDmConvs();
      loadGroupConvs();
      loadPendingCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const loadDmConvs = async () => {
    if (!user || !supabase) return;

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "direct")
      .contains("participants", [user.id]);

    if (!convs || convs.length === 0) return;

    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherUserId =
          conv.participants.find((p: string) => p !== user.id) || "";
        let otherUserName = otherUserId.slice(0, 8);

        const { data: prof } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("user_id", otherUserId)
          .single();
        if (prof) otherUserName = prof.display_name;

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        return {
          id: conv.id,
          otherUserId,
          otherUserName,
          unreadCount: count || 0,
        };
      })
    );

    enriched.sort((a, b) => b.unreadCount - a.unreadCount);
    setDmConvs(enriched);
    setTotalUnread(enriched.reduce((sum, c) => sum + c.unreadCount, 0));
  };

  const loadGroupConvs = async () => {
    if (!user || !supabase) return;

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "group")
      .contains("participants", [user.id]);

    if (!convs || convs.length === 0) {
      setGroupConvs([]);
      return;
    }

    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        return {
          id: conv.id,
          name: conv.name || "Unnamed Group",
          created_by: conv.created_by || "",
          unreadCount: count || 0,
        };
      })
    );

    enriched.sort((a, b) => b.unreadCount - a.unreadCount);
    setGroupConvs(enriched);
  };

  const loadPendingCount = async () => {
    if (!user || !supabase) return;
    const { count } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("addressee_id", user.id)
      .eq("status", "pending");
    setPendingCount(count || 0);
  };

  const navItem = (
    to: string,
    icon: React.ReactNode,
    label: string,
    badge?: number
  ) => {
    const isActive = (() => {
      if (to === "/") return currentPath === "/";
      return currentPath.startsWith(to);
    })();
    return (
      <button
        onClick={() => {
          navigate(to);
          onClose?.();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-150 cursor-pointer ${
          isActive
            ? "bg-accent/10 text-accent"
            : "text-muted hover:text-foreground hover:bg-surface"
        }`}
      >
        <span className="w-4 h-4 shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto text-xs bg-accent text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const handleNavigate = (to: string) => {
    navigate(to);
    onClose?.();
  };

  return (
    <>
      {/* ProfilePreview */}
      {profile && (
        <button
          onClick={() => handleNavigate("/profile")}
          className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-surface transition-colors duration-150 cursor-pointer shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
            {profile.display_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-foreground truncate">
              {profile.display_name}
            </div>
            <div className="text-xs text-muted truncate">@{profile.app_slug}</div>
          </div>
          <div className="relative">
            <span className="online-dot" />
          </div>
          {/* Close button on mobile */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="lg:hidden text-muted hover:text-foreground ml-2 cursor-pointer"
          >
            <X size={16} />
          </button>
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-thin p-2 space-y-1">
        {/* Direct Messages */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span className="text-xs text-muted uppercase tracking-wider">
            Direct Messages
          </span>
        </div>
        {navItem("/", <MessageCircle size={16} />, "All Messages", totalUnread)}

        {dmConvs.slice(0, 8).map((dm) => {
          const active = currentPath === `/dm/${dm.otherUserId}`;
          return (
            <button
              key={dm.id}
              onClick={() => handleNavigate(`/dm/${dm.otherUserId}`)}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-sm transition-all duration-150 cursor-pointer ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent shrink-0">
                {dm.otherUserName.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-xs">{dm.otherUserName}</span>
              {dm.unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-accent text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {dm.unreadCount}
                </span>
              )}
            </button>
          );
        })}
        {dmConvs.length > 8 && (
          <button
            onClick={() => handleNavigate("/")}
            className="w-full text-xs text-muted hover:text-accent px-3 py-1 text-left transition-colors duration-150 cursor-pointer"
          >
            +{dmConvs.length - 8} more
          </button>
        )}

        {/* Group Chats */}
        <div className="flex items-center justify-between px-3 pt-4 pb-1">
          <span className="text-xs text-muted uppercase tracking-wider">
            Groups
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateGroup(true);
            }}
            className="text-muted hover:text-accent transition-colors duration-150 cursor-pointer"
            title="Create group"
          >
            <Plus size={14} />
          </button>
        </div>

        {groupConvs.length === 0 && (
          <div className="text-xs text-muted/50 px-3 py-2 italic">
            No groups yet
          </div>
        )}

        {groupConvs.map((grp) => {
          const active = currentPath === `/group/${grp.id}`;
          return (
            <button
              key={grp.id}
              onClick={() => handleNavigate(`/group/${grp.id}`)}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-sm transition-all duration-150 cursor-pointer ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent shrink-0">
                <UsersRound size={12} />
              </div>
              <span className="truncate text-xs">{grp.name}</span>
              {grp.unreadCount > 0 && (
                <span className="ml-auto text-[10px] bg-accent text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {grp.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Channels */}
        <div className="text-xs text-muted px-3 pt-4 pb-1 uppercase tracking-wider">
          Channels
        </div>
        {channels.map((ch) =>
          navItem(`/channel/${ch.name}`, <Hash size={16} />, `#${ch.label}`)
        )}

        <div className="border-t border-border my-2" />

        {navItem("/feed", <Rss size={16} />, "Feed")}
        {navItem(
          "/friends",
          <Users size={16} />,
          "Friends",
          pendingCount
        )}
        {navItem("/online", <User size={16} />, "Who's Online")}
      </nav>

      {/* Create Group Dialog */}
      {showCreateGroup && (
        <CreateGroupDialog
          onClose={() => setShowCreateGroup(false)}
          onCreated={(groupId) => {
            setShowCreateGroup(false);
            handleNavigate(`/group/${groupId}`);
            loadGroupConvs();
          }}
        />
      )}
    </>
  );
}

function CreateGroupDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}) {
  const { user, supabase } = useAuth();
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<
    { user_id: string; display_name: string }[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || searchQuery.length < 2) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .or(`display_name.ilike.%${searchQuery}%`)
        .limit(10);
      if (data) setUsers(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = async () => {
    if (!name.trim() || !user || !supabase) return;
    if (selected.length < 1) {
      setError("Add at least 1 member");
      return;
    }
    setCreating(true);
    setError("");

    const participants = [user.id, ...selected];

    const { data, error: err } = await supabase
      .from("conversations")
      .insert({
        type: "group",
        name: name.trim(),
        participants,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (err) {
      setError(err.message);
      setCreating(false);
      return;
    }

    if (data) {
      onCreated(data.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Create Group</h3>
        </div>

        <div className="p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name..."
            maxLength={60}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
          />

          <div>
            <p className="text-xs text-muted mb-2">
              Add members ({selected.length} selected)
            </p>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {users.length > 0 && (
            <div className="max-h-36 overflow-y-auto space-y-1 border border-border rounded p-1">
              {users.map((u) => {
                const isSelected = selected.includes(u.user_id);
                return (
                  <button
                    key={u.user_id}
                    onClick={() => toggleUser(u.user_id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-accent/20 text-accent"
                        : "text-muted hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? "bg-accent border-accent"
                          : "border-border"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-white text-[9px]">✓</span>
                      )}
                    </div>
                    {u.display_name}
                  </button>
                );
              })}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="p-4 pt-0 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={createGroup}
            disabled={creating || !name.trim() || selected.length < 1}
            className="px-4 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
