import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { makeSupabaseClient, PRESENCE_CHANNEL } from '../lib/supabase';
import { ensureProfile } from '../lib/profiles';
import { PresenceState, SipaApp, UserProfile } from '../lib/types';

export type Profile = UserProfile;

type AuthContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  supabase: SupabaseClient | null;
  online: Record<string, PresenceState>;
  login: () => void;
  logout: () => void;
  // Compatibility surface for components written against a Supabase-native
  // auth shape (user.id / signOut / refreshProfile). Auth0 + JWT remains the
  // only real auth path; these just re-expose the same profile/logout under
  // the names that code expects.
  user: { id: string; email?: string } | null;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  loginWithConnection: (connection?: 'google-oauth2' | 'github' | 'email') => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useSipaAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSipaAuth must be used within AuthProvider');
  return ctx;
}

export const useAuth = useSipaAuth;

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientRef = useRef<SupabaseClient | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (auth0Loading) return;

    if (!isAuthenticated || !user?.sub) {
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const token = await getAccessTokenSilently();
      if (cancelled) return;
      tokenRef.current = token;

      const client = makeSupabaseClient(token);
      clientRef.current = client;
      setSupabase(client);

      const displayName =
        (user.name as string) || (user.email as string) || user.sub!.slice(0, 12);
      const p = await ensureProfile(client, user.sub!, displayName);
      if (cancelled) return;
      setProfile(p);

      const channel = client.channel(PRESENCE_CHANNEL, {
        config: { presence: { key: user.sub! } },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceState>();
          const flat: Record<string, PresenceState> = {};
          for (const key of Object.keys(state)) {
            const entries = state[key];
            if (entries?.[0]) flat[key] = entries[0];
          }
          setOnline(flat);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              id: user.sub,
              name: displayName,
              app: 'community' as SipaApp,
            });
          }
        });

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0Loading, isAuthenticated, user?.sub]);

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // beforeunload's async fetch is unreliable — the tab can die mid-flight.
    // fetch(..., { keepalive: true }) survives unload the way sendBeacon does,
    // but (unlike sendBeacon) still lets us set the Authorization header RLS needs.
    function markLastSeen() {
      const userId = profile?.user_id;
      const token = tokenRef.current;
      if (!userId || !token) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}`;
      fetch(url, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ last_seen: new Date().toISOString() }),
      }).catch(() => {});
    }
    window.addEventListener('pagehide', markLastSeen);
    return () => window.removeEventListener('pagehide', markLastSeen);
  }, [profile?.user_id]);

  async function refreshProfile() {
    if (!supabase || !profile) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .maybeSingle();
    if (data) setProfile(data as UserProfile);
  }

  const doLogout = () => auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  const value: AuthContextValue = {
    loading: auth0Loading || !ready,
    isAuthenticated,
    profile,
    supabase,
    online,
    login: () => loginWithRedirect(),
    logout: doLogout,
    user: profile ? { id: profile.user_id, email: profile.display_name } : null,
    signOut: doLogout,
    refreshProfile,
    // Passing an explicit connection skips Auth0's own hosted picker page
    // entirely and sends the user straight to that provider — same pattern
    // Focus/NeuroPower/AI use. Without this, loginWithRedirect() renders
    // Auth0's raw Universal Login screen, which currently also surfaces an
    // unused/dev-keys Microsoft connection and its warning banner.
    loginWithConnection: (connection) =>
      loginWithRedirect(connection ? { authorizationParams: { connection } } : undefined),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
