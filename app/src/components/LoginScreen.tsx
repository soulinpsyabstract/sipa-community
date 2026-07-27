import { useSipaAuth } from '../context/AuthContext';

const ECOSYSTEM = [
  { label: 'Focus', href: 'https://focus.sipa-os.org' },
  { label: 'NeuroPower', href: 'https://neuropower.sipa-os.org' },
  { label: 'AI', href: 'https://ai.sipa-os.org' },
  { label: 'Shell', href: 'https://shell.sipa-os.org' },
  { label: 'Games', href: 'https://games.sipa-os.org' },
];

export function LoginScreen() {
  const { login } = useSipaAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-accent border border-accent/30 px-2.5 py-1 inline-block mb-6">
          // one login, one community
        </div>
        <h1 className="text-3xl md:text-5xl leading-tight">
          Your tribe, <span className="text-accent">your protocol</span>
        </h1>
        <p className="mt-4 text-muted text-sm max-w-md mx-auto leading-relaxed">
          One account across the whole SIPA OS ecosystem. Chat with any builder, in any
          app, in real time.
        </p>
      </div>
      <button
        onClick={login}
        className="bg-accent text-white px-8 py-3 text-sm hover:opacity-85 transition-opacity"
      >
        Sign in →
      </button>
      <div className="flex flex-wrap justify-center gap-2 text-[10px] text-muted uppercase tracking-wider">
        {ECOSYSTEM.map((e) => (
          <a key={e.label} href={e.href} target="_blank" rel="noreferrer" className="hover:text-white">
            {e.label}
          </a>
        ))}
      </div>
    </div>
  );
}
