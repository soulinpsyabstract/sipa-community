export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono uppercase tracking-[0.3em] text-xs text-accent/70 mb-4">Legal</p>
        <h1 className="text-3xl font-extrabold text-white">Privacy Statement</h1>
        <p className="mt-2 text-sm text-muted">Last updated: August 2, 2026</p>

        <div className="mt-10 space-y-7 text-white/85 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Data we collect</h2>
            <p>
              Account email and profile info (from your Google/GitHub login via Auth0), messages
              you send (channels, DMs, group chats), feed posts and reactions, friend
              connections, and presence/online status shared across the SIPA OS ecosystem.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How we use it</h2>
            <p>
              To run your account, deliver your messages to the right people, show your feed and
              notifications, and sync presence across other SIPA OS apps you use. We do not sell
              your data. We do not use your private messages to train public AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Who can see what</h2>
            <p>
              Direct messages and group chats are visible only to their participants. Feed posts
              are visible to the SIPA Community, unless you delete them. Presence/online status
              is visible to other logged-in members.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Storage & security</h2>
            <p>
              Data is stored on managed cloud infrastructure (Supabase) with row-level security —
              access is restricted to authenticated users and the data they're entitled to see.
              Authentication itself runs through Auth0, not stored passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Your rights</h2>
            <p>
              You can delete your posts and messages yourself in the app, or request full account
              deletion by emailing{" "}
              <a href="mailto:sipa-core@sipa-os.org" className="text-accent hover:underline">
                sipa-core@sipa-os.org
              </a>
              . EU/UK users have GDPR rights including access, rectification, and erasure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Cookies</h2>
            <p>
              We use only essential cookies/local storage for authentication and session
              continuity. No third-party advertising trackers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Contact</h2>
            <p>
              Privacy questions: <a href="mailto:sipa-core@sipa-os.org" className="text-accent hover:underline">sipa-core@sipa-os.org</a>
            </p>
          </section>
        </div>

        <a href="/" className="mt-10 inline-block text-xs text-muted hover:text-white transition-colors">
          ← Back
        </a>
      </div>
    </div>
  );
}
