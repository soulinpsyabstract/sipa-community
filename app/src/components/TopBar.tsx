import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePresence } from "../hooks/usePresence";
import { Search, Menu } from "lucide-react";
import SearchDialog from "./SearchDialog";
import NotificationsBell from "./NotificationsBell";

function UserAvatar({ name }: { name: string }) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
      {initial}
    </div>
  );
}

export default function TopBar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const { profile, signOut } = useAuth();
  const { onlineUsers } = usePresence();
  const totalOnline = onlineUsers.length + 1;
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="h-12 px-3 lg:px-4 flex items-center justify-between border-b border-border bg-panel shrink-0 z-50">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0">
          {/* Hamburger menu (mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-muted hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          <span className="text-sm font-bold text-foreground">
            SIPA<span className="text-accent">•</span> Community
          </span>
          <span className="text-xs text-muted hidden sm:inline whitespace-nowrap">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1.5 align-middle"></span>
            {totalOnline} online
          </span>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2 ml-2 overflow-hidden">
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded border border-border bg-background text-xs text-muted hover:text-foreground hover:border-accent/30 transition-all duration-150 cursor-pointer shrink-0"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline text-[10px] text-muted/50 border border-border rounded px-1">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications */}
          <NotificationsBell />

          {/* Online avatars — hidden on very small screens */}
          {onlineUsers.length > 0 && (
            <div className="hidden md:flex items-center -space-x-1.5 overflow-hidden max-w-[120px] lg:max-w-[200px]">
              {onlineUsers.slice(0, 5).map((u) => (
                <div
                  key={u.user_id}
                  className="relative online-dot-ring shrink-0"
                  title={u.display_name}
                >
                  <UserAvatar name={u.display_name} />
                  <span className="online-dot absolute -bottom-0.5 -right-0.5 border border-panel" />
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <span className="text-xs text-muted ml-1 shrink-0">
                  +{onlineUsers.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Profile */}
          {profile && (
            <div className="flex items-center gap-1.5 lg:gap-2 ml-1.5 lg:ml-3 pl-1.5 lg:pl-3 border-l border-border">
              <UserAvatar name={profile.display_name} />
              <span className="text-xs text-foreground hidden md:inline max-w-[80px] lg:max-w-[100px] truncate">
                {profile.display_name}
              </span>
              <button
                onClick={signOut}
                className="text-xs text-muted hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
                title="Sign out"
              >
                exit
              </button>
            </div>
          )}
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
