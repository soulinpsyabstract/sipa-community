import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePresence } from "../hooks/usePresence";

export default function OnlineUsersPage() {
  const navigate = useNavigate();
  const { onlineUsers } = usePresence();

  // Group by app
  const grouped = onlineUsers.reduce<Record<string, typeof onlineUsers>>(
    (acc, u) => {
      const app = u.current_app || "community";
      if (!acc[app]) acc[app] = [];
      acc[app].push(u);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-lg font-bold text-foreground">
          Who's Online
        </h1>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="bg-panel border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted">No one else is online right now.</p>
        </div>
      )}

      {Object.entries(grouped).map(([app, users]) => (
        <div
          key={app}
          className="bg-panel border border-border rounded-lg p-4 space-y-2"
        >
          <h2 className="text-xs text-muted uppercase tracking-wider">
            ~/{app}
          </h2>
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => navigate(`/user/${u.user_id}`)}
                className="flex items-center gap-3 w-full py-2 px-2 -mx-2 rounded hover:bg-surface transition-colors duration-150 cursor-pointer"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                    {u.display_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className="online-dot absolute -bottom-0.5 -right-0.5 border border-panel" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-foreground">{u.display_name}</p>
                  <p className="text-xs text-muted">online</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
