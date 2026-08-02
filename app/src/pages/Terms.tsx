export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono uppercase tracking-[0.3em] text-xs text-accent/70 mb-4">Legal</p>
        <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: August 2, 2026</p>

        <div className="mt-10 space-y-7 text-white/85 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Who we are</h2>
            <p>
              Soul In PsyAbstract LLC ("SIPA", "we") operates SIPA Community at{" "}
              <a href="https://community.sipa-os.org" className="text-accent hover:underline">community.sipa-os.org</a>,
              part of the SIPA OS platform. Founder: Aelin AquaSoul, Eilat, Israel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1a. Governing law</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, USA. Any disputes
              shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. What SIPA Community is</h2>
            <p>
              A shared social space across the SIPA OS ecosystem — one login, chat, feed,
              friends, and presence across Focus, NeuroPower, AI, Shell, and Games. You sign in
              with the same account you use elsewhere in SIPA OS (Google or GitHub, via Auth0).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Use of the service</h2>
            <p>
              You agree not to harass other members, impersonate another identity, post unlawful
              content, or attempt to disrupt the service. We may suspend accounts that violate
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Content you post</h2>
            <p>
              You retain ownership of what you post (feed posts, messages, profile content). By
              posting, you grant SIPA a license to display it within the platform to the intended
              audience (public feed, or the specific channel/DM/friend it was sent to).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Intellectual property</h2>
            <p>
              The SIPA Community codebase and branding remain the property of Aelin AquaSoul /
              Soul In PsyAbstract.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Disclaimers</h2>
            <p>
              SIPA Community is not a substitute for medical or psychological care. It is a
              social space, not crisis support — see your app's own crisis resources for that.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Contact</h2>
            <p>
              Questions: <a href="mailto:sipa-core@sipa-os.org" className="text-accent hover:underline">sipa-core@sipa-os.org</a>
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
