import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface FeedPost {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string;
  author_app_slug?: string;
}

interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string;
}

export default function FeedView() {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!supabase) return;
    loadPosts();

    const postSub = supabase
      .channel("feed-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_posts" },
        async (payload) => {
          const newPost = payload.new as FeedPost;
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("display_name, app_slug")
            .eq("user_id", newPost.author_id)
            .single();
          if (profile) {
            newPost.author_name = profile.display_name;
            newPost.author_app_slug = profile.app_slug;
          }
          setPosts((prev) => [newPost, ...prev]);
        }
      )
      .subscribe();

    const reactSub = supabase
      .channel("feed-reactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feed_reactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReactions((prev) => [...prev, payload.new as Reaction]);
          } else if (payload.eventType === "DELETE") {
            setReactions((prev) =>
              prev.filter((r) => r.id !== (payload.old as Reaction).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postSub);
      supabase.removeChannel(reactSub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const loadPosts = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: postsData } = await supabase
      .from("feed_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsData) {
      const withAuthors = await Promise.all(
        (postsData as FeedPost[]).map(async (post) => {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("display_name, app_slug")
            .eq("user_id", post.author_id)
            .single();
          return {
            ...post,
            author_name: profile?.display_name,
            author_app_slug: profile?.app_slug,
          };
        })
      );
      setPosts(withAuthors);
    }

    const { data: reactData } = await supabase
      .from("feed_reactions")
      .select("*");

    if (reactData) setReactions(reactData as Reaction[]);

    setLoading(false);
  };

  const createPost = async () => {
    if (!input.trim() || !user || !supabase) return;
    const body = input.trim().slice(0, 500);
    const { error } = await supabase.from("feed_posts").insert({
      author_id: user.id,
      body,
    });
    if (!error) {
      setInput("");
      inputRef.current?.focus();
    }
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user || !supabase) return;

    const existing = reactions.find(
      (r) => r.post_id === postId && r.user_id === user.id && r.emoji === emoji
    );

    if (existing) {
      await supabase.from("feed_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("feed_reactions").insert({
        post_id: postId,
        user_id: user.id,
        emoji,
      });
    }
  };

  const getReactionCount = (postId: string, emoji: string) => {
    return reactions.filter(
      (r) => r.post_id === postId && r.emoji === emoji
    ).length;
  };

  const hasReacted = (postId: string, emoji: string) => {
    return reactions.some(
      (r) => r.post_id === postId && r.user_id === user?.id && r.emoji === emoji
    );
  };

  const toggleThread = async (postId: string) => {
    const willOpen = !openThreads[postId];
    setOpenThreads((prev) => ({ ...prev, [postId]: willOpen }));
    if (willOpen && !comments[postId] && supabase) {
      const { data } = await supabase
        .from("feed_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (data) {
        const withAuthors = await Promise.all(
          (data as Comment[]).map(async (c) => {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("display_name")
              .eq("user_id", c.author_id)
              .single();
            return { ...c, author_name: profile?.display_name };
          })
        );
        setComments((prev) => ({ ...prev, [postId]: withAuthors }));
      }
    }
  };

  const postComment = async (postId: string) => {
    if (!user || !supabase) return;
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    const { data, error } = await supabase
      .from("feed_comments")
      .insert({ post_id: postId, author_id: user.id, body })
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          { ...(data as Comment), author_name: "You" },
        ],
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      createPost();
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Post Composer */}
      <div className="bg-panel border border-border rounded-lg p-4">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What are you building? (max 500 chars)"
          maxLength={500}
          rows={3}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors duration-150 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted">{input.length}/500</span>
          <button
            onClick={createPost}
            disabled={!input.trim()}
            className="bg-accent text-white rounded px-4 py-1.5 text-xs font-medium hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            Post
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-panel border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted">No posts yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-panel border border-border rounded-lg p-4 space-y-3"
            >
              {/* Author + Time */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(`/user/${post.author_id}`)}
                  className="flex items-center gap-2 hover:text-accent transition-colors duration-150 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                    {(post.author_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="text-sm text-foreground">
                      {post.author_name || post.author_id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      ~/{post.author_app_slug || "?"}
                    </span>
                  </div>
                </button>
                <span className="text-[10px] text-muted">
                  {timeAgo(post.created_at)}
                </span>
              </div>

              {/* Body */}
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {post.body}
              </p>

              {/* Reactions + comments toggle */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/50 flex-wrap">
                {["👍", "❤️", "🔥", "🚀"].map((emoji) => {
                  const count = getReactionCount(post.id, emoji);
                  const reacted = hasReacted(post.id, emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(post.id, emoji)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all duration-150 cursor-pointer ${
                        reacted
                          ? "bg-accent/10 border-accent/30 text-accent"
                          : "bg-background border-border text-muted hover:text-foreground hover:border-accent/30"
                      }`}
                    >
                      <span className="text-sm">{emoji}</span>
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
                <button
                  onClick={() => toggleThread(post.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border bg-background text-muted hover:text-foreground hover:border-accent/30 transition-all duration-150 cursor-pointer ml-auto"
                >
                  💬 {(comments[post.id] || []).length || ""}
                </button>
              </div>

              {/* Comment thread */}
              {openThreads[post.id] && (
                <div className="pt-2 border-t border-border/50 space-y-2">
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent shrink-0">
                        {(c.author_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-background rounded-xl px-3 py-1.5 text-xs flex-1">
                        <span className="font-medium text-foreground mr-1.5">
                          {c.author_name || c.author_id.slice(0, 8)}
                        </span>
                        <span className="text-muted">{c.body}</span>
                      </div>
                    </div>
                  ))}
                  {(comments[post.id] || []).length === 0 && (
                    <p className="text-xs text-muted px-1">No comments yet — be the first.</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={commentDrafts[post.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") postComment(post.id);
                      }}
                      placeholder="Write a comment..."
                      className="flex-1 bg-background border border-border rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => postComment(post.id)}
                      className="text-xs font-medium text-accent hover:opacity-80 px-1 cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
