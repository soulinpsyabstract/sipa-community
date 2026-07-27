import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthProvider, useSipaAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, View } from './components/Sidebar';
import { ChannelView } from './components/ChannelView';
import { DMView } from './components/DMView';
import { FeedView } from './components/FeedView';
import { ProfileView } from './components/ProfileView';
import { Conversation, Friendship, UserProfile } from './lib/types';
import { listFriendships, respondToRequest, sendFriendRequest } from './lib/friends';

function Shell() {
  const { loading, isAuthenticated, supabase, profile } = useSipaAuth();
  const [channels, setChannels] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [view, setView] = useState<View>({ tab: 'feed' });

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'channel')
        .order('created_at', { ascending: true });
      if (convos) setChannels(convos as Conversation[]);

      const { data: profiles } = await supabase.from('user_profiles').select('*');
      if (profiles) setPeople((profiles as UserProfile[]).filter((p) => p.user_id !== profile?.user_id));

      if (profile?.user_id) {
        setFriendships(await listFriendships(supabase, profile.user_id));
      }
    })();
  }, [supabase, profile?.user_id]);

  useEffect(() => {
    if (!supabase || !profile?.user_id) return;
    const channel = supabase
      .channel(`friendships-${profile.user_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        async () => {
          setFriendships(await listFriendships(supabase, profile.user_id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile?.user_id]);

  async function handleAddFriend(p: UserProfile) {
    if (!supabase || !profile?.user_id) return;
    await sendFriendRequest(supabase, profile.user_id, p.user_id);
    setFriendships(await listFriendships(supabase, profile.user_id));
  }

  async function handleRespondRequest(friendshipId: string, accept: boolean) {
    if (!supabase || !profile?.user_id) return;
    await respondToRequest(supabase, friendshipId, accept);
    setFriendships(await listFriendships(supabase, profile.user_id));
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>;
  }

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="flex">
      <Sidebar
        channels={channels}
        people={people}
        friendships={friendships}
        view={view}
        onSelectFeed={() => setView({ tab: 'feed' })}
        onSelectChannel={(c) => setView({ tab: 'channel', conversationId: c.id })}
        onSelectPerson={(p) => setView({ tab: 'dm', conversationId: '', withProfile: p })}
        onSelectProfile={() => setView({ tab: 'profile' })}
        onAddFriend={handleAddFriend}
        onRespondRequest={handleRespondRequest}
      />
      {view.tab === 'feed' && <FeedView />}
      {view.tab === 'channel' &&
        (() => {
          const c = channels.find((c) => c.id === view.conversationId);
          return c ? <ChannelView conversation={c} /> : null;
        })()}
      {view.tab === 'dm' && <DMView withProfile={view.withProfile} />}
      {view.tab === 'profile' && <ProfileView />}
    </div>
  );
}

function AppInner() {
  const { isLoading, error } = useAuth0();
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-error text-sm">
        Auth error: {error.message}
      </div>
    );
  }
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>;
  }
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

export default function App() {
  return <AppInner />;
}
