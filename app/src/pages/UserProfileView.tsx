import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, type Profile } from "../context/AuthContext";
import { UserPlus, UserCheck, Clock, ArrowLeft } from "lucide-react";
import { sendNotification } from "../lib/notifications";

export default function UserProfileView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, supabase } = useAuth();
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) return;

    const load = async () => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profile) setTargetProfile(profile as Profile);

      if (user) {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("status")
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`
          )
          .single();
        if (friendship) setFriendStatus(friendship.status);
      }

      setLoading(false);
    };

    load();
  }, [userId, user?.id, supabase]);

  const sendFriendRequest = async () => {
    if (!user || !userId || !supabase) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: userId,
      status: "pending",
    });
    if (!error) {
      setFriendStatus("pending");
      sendNotification(supabase, {
        userId,
        type: "friend_request",
        title: "Friend request",
        body: `${user.email || "Someone"} wants to be your friend!`,
        link: "/friends",
        fromUserId: user.id,
      });
    }
  };

  const respondToRequest = async (status: "accepted" | "declined") => {
    if (!user || !userId || !supabase) return;
    const { error } = await supabase
      .from("friendships")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("requester_id", userId)
      .eq("addressee_id", user.id);
    if (!error) {
      setFriendStatus(status);
      if (status === "accepted") {
        sendNotification(supabase, {
          userId,
          type: "friend_request",
          title: "Friend request accepted",
          body: `${user.email || "Someone"} accepted your friend request!`,
          link: `/user/${user.id}`,
          fromUserId: user.id,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted">User not found</p>
      </div>
    );
  }

  const isOwn = user?.id === userId;

  const renderFriendButton = () => {
    if (isOwn) return null;

    if (friendStatus === "accepted") {
      return (
        <div className="flex items-center gap-2 text-xs text-success">
          <UserCheck size={14} /> Friends
        </div>
      );
    }

    if (friendStatus === "pending") {
      const received = userId !== user?.id;
      if (received) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-warning flex items-center gap-1">
              <Clock size={14} /> Request pending
            </span>
            <button
              onClick={() => respondToRequest("accepted")}
              className="text-xs bg-accent text-white px-3 py-1 rounded hover:bg-accent-hover transition-all duration-150 cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={() => respondToRequest("declined")}
              className="text-xs bg-surface border border-border text-muted px-3 py-1 rounded hover:text-foreground transition-all duration-150 cursor-pointer"
            >
              Decline
            </button>
          </div>
        );
      }
      return (
        <span className="text-xs text-warning flex items-center gap-1">
          <Clock size={14} /> Request sent
        </span>
      );
    }

    if (friendStatus === "declined") {
      return (
        <button
          onClick={sendFriendRequest}
          className="flex items-center gap-1 text-xs bg-accent text-white px-3 py-1 rounded hover:bg-accent-hover transition-all duration-150 cursor-pointer"
        >
          <UserPlus size={14} /> Add Friend
        </button>
      );
    }

    return (
      <button
        onClick={sendFriendRequest}
        className="flex items-center gap-1 text-xs bg-accent text-white px-3 py-1 rounded hover:bg-accent-hover transition-all duration-150 cursor-pointer"
      >
        <UserPlus size={14} /> Add Friend
      </button>
    );
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-4 transition-colors duration-150 cursor-pointer"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="bg-panel border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {targetProfile.display_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {targetProfile.display_name}
            </h2>
            <p className="text-xs text-muted">~/{targetProfile.app_slug}</p>
          </div>
        </div>

        {targetProfile.bio && (
          <p className="text-sm text-foreground/80">{targetProfile.bio}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="online-dot" />
          <span className="text-xs text-muted">Online</span>
          {renderFriendButton()}
        </div>
      </div>
    </div>
  );
}
