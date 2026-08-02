import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Check } from "lucide-react";

const appSlugs = ["focus", "neuropower", "ai", "shell", "games", "community"];

export default function ProfileView() {
  const { profile, supabase, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [appSlug, setAppSlug] = useState<string>(profile?.app_slug || "community");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!profile || !supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName,
        bio,
        app_slug: appSlug,
      })
      .eq("user_id", profile.user_id);

    if (!error) {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-lg font-bold text-foreground">Profile</h1>

      <div className="bg-panel border border-border rounded-lg p-6 space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {(displayName || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">{displayName}</p>
            <p className="text-xs text-muted">~/{appSlug}</p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-xs text-muted mb-1 block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors duration-150"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs text-muted mb-1 block">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors duration-150 resize-none"
          />
          <div className="text-right text-[10px] text-muted">{bio.length}/300</div>
        </div>

        {/* App Slug */}
        <div>
          <label className="text-xs text-muted mb-1 block">Currently building in</label>
          <div className="flex flex-wrap gap-2">
            {appSlugs.map((slug) => (
              <button
                key={slug}
                onClick={() => setAppSlug(slug)}
                className={`px-3 py-1 text-xs rounded border transition-all duration-150 cursor-pointer ${
                  appSlug === slug
                    ? "bg-accent text-white border-accent"
                    : "bg-background text-muted border-border hover:text-foreground hover:border-accent/50"
                }`}
              >
                {slug}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent text-white rounded px-4 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 transition-all duration-150 active:scale-[0.97] cursor-pointer"
        >
          {saved ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}
