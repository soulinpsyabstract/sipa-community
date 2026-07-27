export const SIPA_APPS = ['focus', 'neuropower', 'ai', 'shell', 'games', 'community'] as const;
export type SipaApp = (typeof SIPA_APPS)[number];

export type UserProfile = {
  user_id: string;
  display_name: string;
  app_slug: SipaApp;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  type: 'direct' | 'channel';
  participants: string[];
  channel_name: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type FeedPost = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type FeedReaction = {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type PresenceState = {
  id: string;
  name: string;
  app: SipaApp;
};

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
};
