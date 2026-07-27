import { Avatar, StatusDot } from './ui';
import { useSipaAuth } from '../context/AuthContext';
import { Conversation, Friendship, UserProfile } from '../lib/types';
import { friendStatusWith } from '../lib/friends';

type View =
  | { tab: 'feed' }
  | { tab: 'channel'; conversationId: string }
  | { tab: 'dm'; conversationId: string; withProfile: UserProfile }
  | { tab: 'profile' };

const ECOSYSTEM = [
  { label: '🎯 Focus', href: 'https://focus.sipa-os.org' },
  { label: '🧠 NeuroPower', href: 'https://neuropower.sipa-os.org' },
  { label: '🤖 AI', href: 'https://ai.sipa-os.org' },
  { label: '⚡ Shell', href: 'https://shell.sipa-os.org' },
  { label: '🎮 Games', href: 'https://games.sipa-os.org' },
];

export function Sidebar({
  channels,
  people,
  friendships,
  view,
  onSelectChannel,
  onSelectPerson,
  onSelectFeed,
  onSelectProfile,
  onAddFriend,
  onRespondRequest,
}: {
  channels: Conversation[];
  people: UserProfile[];
  friendships: Friendship[];
  view: View;
  onSelectChannel: (c: Conversation) => void;
  onSelectPerson: (p: UserProfile) => void;
  onSelectFeed: () => void;
  onSelectProfile: () => void;
  onAddFriend: (p: UserProfile) => void;
  onRespondRequest: (friendshipId: string, accept: boolean) => void;
}) {
  const { profile, online, logout } = useSipaAuth();
  const myId = profile?.user_id || '';

  const byId = new Map(people.map((p) => [p.user_id, p]));
  const incoming = friendships.filter((f) => f.status === 'pending' && f.addressee_id === myId);
  const friendIds = new Set(
    friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => (f.requester_id === myId ? f.addressee_id : f.requester_id))
  );
  const friends = people.filter((p) => friendIds.has(p.user_id));
  const others = people.filter((p) => !friendIds.has(p.user_id));

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-panel flex flex-col h-screen">
      <div className="border-b border-border overflow-x-auto">
        <div className="flex">
          {ECOSYSTEM.map((e) => (
            <a
              key={e.label}
              href={e.href}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-muted hover:text-white px-2.5 py-2 whitespace-nowrap"
            >
              {e.label}
            </a>
          ))}
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={onSelectFeed}
          className={`w-full text-left text-sm px-2 py-1.5 ${
            view.tab === 'feed' ? 'text-white bg-panel2' : 'text-muted hover:text-white'
          }`}
        >
          # feed
        </button>
      </div>

      <div className="px-3">
        <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Channels</div>
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectChannel(c)}
            className={`w-full text-left text-sm px-2 py-1.5 truncate ${
              view.tab === 'channel' && view.conversationId === c.id
                ? 'text-white bg-panel2'
                : 'text-muted hover:text-white'
            }`}
          >
            # {c.channel_name}
          </button>
        ))}
      </div>

      <div className="px-3 mt-4 flex-1 overflow-y-auto">
        {incoming.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-accent mb-1">
              Friend requests ({incoming.length})
            </div>
            {incoming.map((f) => {
              const p = byId.get(f.requester_id);
              if (!p) return null;
              return (
                <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <Avatar name={p.display_name} url={p.avatar_url} size={20} />
                  <span className="truncate flex-1 text-white">{p.display_name}</span>
                  <button
                    onClick={() => onRespondRequest(f.id, true)}
                    className="text-success hover:opacity-80 text-xs"
                    title="Accept"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onRespondRequest(f.id, false)}
                    className="text-error hover:opacity-80 text-xs"
                    title="Decline"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {friends.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
              Friends ({friends.length})
            </div>
            {friends.map((p) => (
              <button
                key={p.user_id}
                onClick={() => onSelectPerson(p)}
                className={`w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 truncate ${
                  view.tab === 'dm' && view.withProfile.user_id === p.user_id
                    ? 'text-white bg-panel2'
                    : 'text-muted hover:text-white'
                }`}
              >
                <StatusDot isOnline={!!online[p.user_id]} />
                <Avatar name={p.display_name} url={p.avatar_url} size={20} />
                <span className="truncate">{p.display_name}</span>
              </button>
            ))}
          </div>
        )}

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted mb-1">
            Online ({Object.keys(online).length})
          </div>
          {others.map((p) => {
            const status = friendStatusWith(friendships, myId, p.user_id);
            return (
              <div
                key={p.user_id}
                className={`w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 truncate ${
                  view.tab === 'dm' && view.withProfile.user_id === p.user_id
                    ? 'bg-panel2'
                    : ''
                }`}
              >
                <button
                  onClick={() => onSelectPerson(p)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-muted hover:text-white"
                >
                  <StatusDot isOnline={!!online[p.user_id]} />
                  <Avatar name={p.display_name} url={p.avatar_url} size={20} />
                  <span className="truncate">{p.display_name}</span>
                </button>
                {status.outgoingRequest ? (
                  <span className="text-[10px] text-muted shrink-0">pending</span>
                ) : (
                  <button
                    onClick={() => onAddFriend(p)}
                    className="text-accent hover:opacity-80 text-xs shrink-0"
                    title="Add friend"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border p-3 flex items-center justify-between">
        <button
          onClick={onSelectProfile}
          className="flex items-center gap-2 text-sm text-muted hover:text-white truncate"
        >
          <Avatar name={profile?.display_name || '?'} url={profile?.avatar_url} size={22} />
          <span className="truncate">{profile?.display_name}</span>
        </button>
        <button onClick={logout} className="text-[10px] text-muted hover:text-white">
          exit
        </button>
      </div>
    </aside>
  );
}

export type { View };
