import { useState } from 'react';
import { useSipaAuth } from '../context/AuthContext';

const ECOSYSTEM = [
  { label: 'SIPA OS', desc: 'the full ecosystem', href: 'https://sipa-os.org' },
  { label: 'SIPA Focus', desc: 'cognitive scaffolding for ADHD', href: 'https://focus.sipa-os.org' },
  { label: 'Neuropower', desc: 'How I Did It With BPD', href: 'https://neuropower.sipa-os.org' },
  { label: 'SIPA AI', desc: 'Protocol-0 cognitive assistant', href: 'https://ai.sipa-os.org' },
  { label: 'SIPA Shell', desc: 'system dashboard and modular tools', href: 'https://shell.sipa-os.org' },
  { label: 'SIPA Games', desc: 'neurodivergent-friendly games', href: 'https://games.sipa-os.org' },
  { label: 'Syntaxit', desc: 'open machine-to-machine AI network', href: 'https://syntax.sipa-os.org' },
  { label: 'Company Deck', desc: 'investor pitch deck', href: 'https://deck.sipa-os.org' },
];

export function LoginScreen() {
  const { loginWithConnection } = useSipaAuth();
  const [pending, setPending] = useState(false);

  function start(connection?: 'google-oauth2' | 'github') {
    // A second click while the first OAuth transaction is still in-flight
    // corrupts Auth0's stored `state`, producing "Auth error: Invalid state"
    // on whichever redirect lands second. Lock the buttons on first click.
    if (pending) return;
    setPending(true);
    loginWithConnection(connection);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center bg-bg">
      <div>
        <div className="text-xs font-semibold text-accent bg-accent/10 rounded-full px-3.5 py-1.5 inline-block mb-6">
          One login, one community
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
          Your tribe, <span className="text-accent">your protocol</span>
        </h1>
        <p className="mt-4 text-muted text-base max-w-md mx-auto leading-relaxed">
          One account across the whole SIPA OS ecosystem. Chat with any builder, in any
          app, in real time.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-2.5">
        <button
          onClick={() => start('google-oauth2')}
          disabled={pending}
          className="w-full bg-panel2 text-white font-medium px-5 py-3 rounded-full text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Redirecting…' : 'Continue with Google'}
        </button>
        <button
          onClick={() => start('github')}
          disabled={pending}
          className="w-full bg-panel2 text-white font-medium px-5 py-3 rounded-full text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Redirecting…' : 'Continue with GitHub'}
        </button>
        <button
          onClick={() => start()}
          disabled={pending}
          className="w-full bg-accent text-white font-semibold px-5 py-3 rounded-full text-sm hover:bg-accentDim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Redirecting…' : 'Sign in →'}
        </button>
      </div>
      <footer className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-xs text-left pt-4 border-t border-border">
        {ECOSYSTEM.map((e) => (
          <a
            key={e.label}
            href={e.href}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-white transition-colors"
          >
            <span className="block font-medium text-white/80">{e.label}</span>
            <span className="block text-[11px] text-muted">{e.desc}</span>
          </a>
        ))}
      </footer>
    </div>
  );
}
