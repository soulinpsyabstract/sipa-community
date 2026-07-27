import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from './types';

export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string,
  displayName: string
): Promise<UserProfile | null> {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing as UserProfile;

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, display_name: displayName, app_slug: 'community' },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('ensureProfile failed', error);
    return null;
  }
  return data as UserProfile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'avatar_url'>>
) {
  const { error } = await supabase
    .from('user_profiles')
    .update(patch)
    .eq('user_id', userId);
  if (error) console.error('updateProfile failed', error);
}

export async function touchLastSeen(supabase: SupabaseClient, userId: string) {
  await supabase
    .from('user_profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('user_id', userId);
}
