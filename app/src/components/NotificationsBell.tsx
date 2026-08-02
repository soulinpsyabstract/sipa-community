import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, Check, UserPlus, MessageSquare, Heart, Info } from "lucide-react";
import { useNotifications, type Notification } from "../hooks/useNotifications";

function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case "friend_request":
      return <UserPlus size={14} className="text-blue-400" />;
    case "message":
      return <MessageSquare size={14} className="text-accent" />;
    case "reaction":
      return <Heart size={14} className="text-red-400" />;
    default:
      return <Info size={14} className="text-muted" />;
  }
}

export default function NotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotifClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-1.5 rounded transition-colors duration-150 cursor-pointer ${
          open ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground hover:bg-surface"
        }`}
        title="Notifications"
      >
        {unreadCount > 0 ? <BellRing size={16} /> : <Bell size={16} />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-destructive text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-medium leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-panel border border-border rounded-lg shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto scroll-thin">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150 cursor-pointer hover:bg-surface ${
                    !n.is_read ? "bg-accent/5 border-l-2 border-accent" : "border-l-2 border-transparent"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="text-[11px] text-muted mt-0.5 line-clamp-2">
                        {n.body}
                      </div>
                    )}
                    <div className="text-[10px] text-muted/60 mt-1">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
