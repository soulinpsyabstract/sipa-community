import { SupabaseClient } from '@supabase/supabase-js';
import { Friendship } from './types';

export async function listFriendships(
  supabase: SupabaseClient,
  myId: string
): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);
  if (error) {
    console.error('listFriendships failed', error);
    return [];
  }
  return data as Friendship[];
}

export async function sendFriendRequest(
  supabase: SupabaseClient,
  myId: string,
  otherId: string
) {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: myId, addressee_id: otherId, status: 'pending' });
  if (error) console.error('sendFriendRequest failed', error);
}

export async function respondToRequest(
  supabase: SupabaseClient,
  friendshipId: string,
  accept: boolean
) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) console.error('respondToRequest failed', error);
}

export async function removeFriendship(supabase: SupabaseClient, friendshipId: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) console.error('removeFriendship failed', error);
}

export function friendStatusWith(
  friendships: Friendship[],
  myId: string,
  otherId: string
): { friendship: Friendship | null; isFriend: boolean; incomingRequest: boolean; outgoingRequest: boolean } {
  const f = friendships.find(
    (x) =>
      (x.requester_id === myId && x.addressee_id === otherId) ||
      (x.requester_id === otherId && x.addressee_id === myId)
  );
  if (!f) return { friendship: null, isFriend: false, incomingRequest: false, outgoingRequest: false };
  return {
    friendship: f,
    isFriend: f.status === 'accepted',
    incomingRequest: f.status === 'pending' && f.addressee_id === myId,
    outgoingRequest: f.status === 'pending' && f.requester_id === myId,
  };
}
