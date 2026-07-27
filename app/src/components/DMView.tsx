import { useEffect, useRef, useState } from 'react';
import { useSipaAuth } from '../context/AuthContext';
import { Message, UserProfile } from '../lib/types';
import { Avatar, timeLabel } from './ui';

export function DMView({ withProfile }: { withProfile: UserProfile }) {
  const { supabase, profile } = useSipaAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase || !profile) return;
    let active = true;

    (async () => {
      const mySub = profile.user_id;
      const theirSub = withProfile.user_id;

      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'direct')
        .contains('participants', [mySub])
        .contains('participants', [theirSub]);

      let convoId = existing?.[0]?.id as string | undefined;

      if (!convoId) {
        const { data: created, error } = await supabase
          .from('conversations')
          .insert({ type: 'direct', participants: [mySub, theirSub] })
          .select()
          .single();
        if (error) {
          console.error('create DM failed', error);
          return;
        }
        convoId = created.id;
      }

      if (!active) return;
      setConversationId(convoId!);

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convoId!)
        .order('created_at', { ascending: true });
      if (active && msgs) setMessages(msgs as Message[]);
    })();

    return () => {
      active = false;
    };
  }, [supabase, profile, withProfile.user_id]);

  useEffect(() => {
    if (!supabase || !conversationId) return;
    const channel = supabase
      .channel(`dm-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!supabase || !profile || !conversationId || !draft.trim()) return;
    const content = draft.trim();
    setDraft('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: profile.user_id,
      content,
    });
    if (error) console.error('send DM failed', error);
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <Avatar name={withProfile.display_name} url={withProfile.avatar_url} size={24} />
        <span className="text-sm">{withProfile.display_name}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === profile?.user_id;
          return (
            <div key={m.id} className={`text-sm flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-3 py-1.5 ${mine ? 'bg-accent text-white' : 'bg-panel2 text-white'}`}>
                <div>{m.content}</div>
                <div className="text-[10px] opacity-60 mt-0.5">{timeLabel(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Message ${withProfile.display_name}`}
          className="flex-1 bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button onClick={send} className="bg-accent px-4 py-2 text-sm text-white hover:opacity-85">
          Send
        </button>
      </div>
    </div>
  );
}
