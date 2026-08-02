import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserCheck, Clock, UserPlus, X, Check, ArrowLeft } from "lucide-react";

interface FriendUser {
  user_id: string;
  display_name: string;
  app_slug: string;
}

interface PendingRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  user?: FriendUser;
}

export default function FriendsPage() {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  const loadData = async () => {
    if (!user || !supabase) return;
    setLoading(true);

    // Accepted friends
    const { data: acceptedData } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(
        `and(requester_id.eq.${user.id},status.eq.accepted),and(addressee_id.eq.${user.id},status.eq.accepted)`
      );

    if (acceptedData) {
      const friendIds = acceptedData.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, app_slug")
          .in("user_id", friendIds);

        if (profiles) setFriends(profiles as FriendUser[]);
      }
    }

    // Incoming pending
    const { data: incomingData } = await supabase
      .from("friendships")
      .select("*")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    if (incomingData) {
      const withUsers = await Promise.all(
        (incomingData as PendingRequest[]).map(async (req) => {
          const { data: prof } = await supabase
            .from("user_profiles")
            .select("user_id, display_name, app_slug")
            .eq("user_id", req.requester_id)
            .single();
          return { ...req, user: (prof as FriendUser) || undefined };
        })
      );
      setIncoming(withUsers);
    }

    // Sent pending
    const { data: sentData } = await supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", user.id)
      .eq("status", "pending");

    if (sentData) setSentRequests(sentData as PendingRequest[]);

    setLoading(false);
  };

  const respondToRequest = async (
    requestId: string,
    status: "accepted" | "declined"
  ) => {
    if (!supabase) return;
    await supabase
      .from("friendships")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-lg font-bold text-foreground">Friends</h1>
      </div>

      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-xs text-muted uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Incoming Requests ({incoming.length})
          </h2>
          {incoming.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between py-2"
            >
              <button
                onClick={() => navigate(`/user/${req.requester_id}`)}
                className="flex items-center gap-3 hover:text-accent transition-colors duration-150 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  {req.user?.display_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm text-foreground">
                    {req.user?.display_name || req.requester_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted">~/{req.user?.app_slug}</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => respondToRequest(req.id, "accepted")}
                  className="p-1.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-all duration-150 cursor-pointer"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => respondToRequest(req.id, "declined")}
                  className="p-1.5 bg-surface text-muted rounded hover:text-destructive transition-all duration-150 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-xs text-muted uppercase tracking-wider flex items-center gap-1">
          <UserCheck size={12} /> Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No friends yet. Start connecting!
          </p>
        ) : (
          friends.map((f) => (
            <button
              key={f.user_id}
              onClick={() => navigate(`/user/${f.user_id}`)}
              className="flex items-center gap-3 w-full py-2 hover:bg-surface rounded px-2 -mx-2 transition-colors duration-150 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {f.display_name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="text-left">
                <p className="text-sm text-foreground">{f.display_name}</p>
                <p className="text-xs text-muted">~/{f.app_slug}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="bg-panel border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-xs text-muted uppercase tracking-wider flex items-center gap-1">
            <UserPlus size={12} /> Sent Requests ({sentRequests.length})
          </h2>
          {sentRequests.map((req) => (
            <div key={req.id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {req.addressee_id.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-foreground">
                  {req.addressee_id.slice(0, 8)}...
                </p>
                <p className="text-xs text-warning">Pending</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
