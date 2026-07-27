import { useEffect, useRef, useState } from 'react';
import { useSipaAuth } from '../context/AuthContext';
import { Conversation, Message, UserProfile } from '../lib/types';
import { timeLabel } from './ui';

export function ChannelView({ conversation }: { conversation: Conversation }) {
  const { supabase, profile } = useSipaAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      if (active && data) setMessages(data as Message[]);
    })();

    const channel = supabase
      .channel(`channel-messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, conversation.id]);

  useEffect(() => {
    if (!supabase || messages.length === 0) return;
    const senderIds = Array.from(new Set(messages.map((m) => m.sender_id)));
    const unknown = senderIds.filter((id) => !names[id]);
    if (unknown.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', unknown);
      if (data) {
        setNames((prev) => {
          const next = { ...prev };
          for (const row of data as UserProfile[]) next[row.user_id] = row.display_name;
          return next;
        });
      }
    })();
  }, [supabase, messages, names]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!supabase || !profile || !draft.trim()) return;
    const content = draft.trim();
    setDraft('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: profile.user_id,
      content,
    });
    if (error) console.error('send message failed', error);
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border px-4 py-3 text-sm text-muted">
        # {conversation.channel_name}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="text-accent">{names[m.sender_id] || m.sender_id.slice(0, 8)}</span>{' '}
            <span className="text-muted text-xs">{timeLabel(m.created_at)}</span>
            <div className="text-white">{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={`Message #${conversation.channel_name}`}
          className="flex-1 bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button onClick={send} className="bg-accent px-4 py-2 text-sm text-white hover:opacity-85">
          Send
        </button>
      </div>
    </div>
  );
}
