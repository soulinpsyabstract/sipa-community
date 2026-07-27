import { useEffect, useState } from 'react';
import { useSipaAuth } from '../context/AuthContext';
import { FeedPost, FeedReaction, UserProfile } from '../lib/types';
import { Avatar, timeAgo } from './ui';

export function FeedView() {
  const { supabase, profile } = useSipaAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [names, setNames] = useState<Record<string, UserProfile>>({});
  const [reactions, setReactions] = useState<Record<string, FeedReaction[]>>({});
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setPosts(data as FeedPost[]);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || posts.length === 0) return;
    const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
    (async () => {
      const { data } = await supabase.from('user_profiles').select('*').in('user_id', authorIds);
      if (data) {
        const map: Record<string, UserProfile> = {};
        for (const p of data as UserProfile[]) map[p.user_id] = p;
        setNames(map);
      }
      const { data: reacts } = await supabase
        .from('feed_reactions')
        .select('*')
        .in('post_id', posts.map((p) => p.id));
      if (reacts) {
        const grouped: Record<string, FeedReaction[]> = {};
        for (const r of reacts as FeedReaction[]) {
          grouped[r.post_id] = grouped[r.post_id] || [];
          grouped[r.post_id].push(r);
        }
        setReactions(grouped);
      }
    })();
  }, [supabase, posts]);

  async function post() {
    if (!supabase || !profile || !draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    const { data, error } = await supabase
      .from('feed_posts')
      .insert({ author_id: profile.user_id, body })
      .select()
      .single();
    if (!error && data) setPosts((prev) => [data as FeedPost, ...prev]);
  }

  async function react(postId: string) {
    if (!supabase || !profile) return;
    const mine = (reactions[postId] || []).find((r) => r.user_id === profile.user_id);
    if (mine) {
      await supabase.from('feed_reactions').delete().eq('id', mine.id);
      setReactions((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((r) => r.id !== mine.id),
      }));
    } else {
      const { data } = await supabase
        .from('feed_reactions')
        .insert({ post_id: postId, user_id: profile.user_id, emoji: '👍' })
        .select()
        .single();
      if (data) {
        setReactions((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data as FeedReaction],
        }));
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border px-4 py-3 text-sm text-muted"># feed</div>
      <div className="border-b border-border p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share a progress update..."
          rows={2}
          className="w-full bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-accent resize-none"
        />
        <div className="flex justify-end mt-2">
          <button onClick={post} className="bg-accent px-4 py-1.5 text-sm text-white hover:opacity-85">
            Post
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {posts.map((p) => {
          const author = names[p.author_id];
          const myReaction = (reactions[p.id] || []).find((r) => r.user_id === profile?.user_id);
          return (
            <div key={p.id} className="border border-border p-3">
              <div className="flex items-center gap-2">
                <Avatar name={author?.display_name || '?'} url={author?.avatar_url} size={22} />
                <span className="text-sm">{author?.display_name || 'someone'}</span>
                <span className="text-[10px] text-muted">{timeAgo(p.created_at)} ago</span>
              </div>
              <div className="mt-2 text-sm whitespace-pre-wrap">{p.body}</div>
              <button
                onClick={() => react(p.id)}
                className={`mt-2 text-xs ${myReaction ? 'text-accent' : 'text-muted hover:text-white'}`}
              >
                👍 {(reactions[p.id] || []).length}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
