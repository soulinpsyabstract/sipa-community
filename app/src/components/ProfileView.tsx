import { useState } from 'react';
import { useSipaAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/profiles';
import { Avatar } from './ui';

export function ProfileView() {
  const { supabase, profile } = useSipaAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!supabase || !profile) return;
    await updateProfile(supabase, profile.user_id, {
      display_name: displayName,
      bio,
      avatar_url: avatarUrl || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="border-b border-border px-4 py-3 text-sm text-muted">Profile</div>
      <div className="p-6 max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={displayName || '?'} url={avatarUrl} size={48} />
          <span className="text-xs text-muted">{profile?.app_slug}</span>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted block mb-1">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted block mb-1">
            Avatar URL
          </label>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full bg-panel2 border border-border px-3 py-2 text-sm outline-none focus:border-accent resize-none"
          />
        </div>
        <button onClick={save} className="bg-accent px-4 py-2 text-sm text-white hover:opacity-85">
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  );
}
