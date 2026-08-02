export function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-border2"
      />
    );
  }
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-semibold"
    >
      {initial}
    </div>
  );
}

export function StatusDot({ isOnline }: { isOnline: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-muted'}`}
    />
  );
}

export function AppTag({ app }: { app: string }) {
  return (
    <span className="text-[10px] uppercase tracking-wider text-muted bg-panel2 rounded-full px-2.5 py-1">
      {app}
    </span>
  );
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function lastSeenLabel(iso: string): string {
  return `last seen ${timeAgo(iso)} ago`;
}
