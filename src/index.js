const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SIPA Community — Neurodiverse Builders</title>
<meta name="description" content="Connect with neurodiverse builders. Share progress, find co-founders, discover open-source projects, blog and vlog. Your tribe, your protocol." />
<meta property="og:title" content="SIPA Community" />
<meta property="og:description" content="Neurodiverse builders platform. Q4 2026." />
<meta property="og:image" content="https://ai.sipa-os.org/og.png" />
<link rel="icon" href="https://ai.sipa-os.org/favicon.ico" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0a;
    --surface: #111;
    --border: rgba(255,255,255,0.06);
    --text: #fff;
    --muted: #666;
    --accent: #a855f7;
    --blue: #3b82f6;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }

  /* Ecosystem nav */
  .ecosystem { border-bottom: 1px solid var(--border); background: rgba(0,0,0,.3); overflow-x: auto; }
  .ecosystem-inner { display: flex; max-width: 960px; margin: 0 auto; padding: 0 24px; }
  .eco-link { display: flex; align-items: center; gap: 6px; padding: 10px 12px; font-size: 10px; color: var(--muted); text-decoration: none; border-bottom: 2px solid transparent; white-space: nowrap; transition: color .15s; }
  .eco-link:hover { color: #fff; border-color: rgba(255,255,255,.15); }
  .eco-link.active { color: #fff; border-color: var(--accent); }

  /* Hero */
  .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px 60px; text-align: center; }
  .badge { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); border: 1px solid rgba(168,85,247,.3); padding: 3px 10px; display: inline-block; margin-bottom: 28px; }
  h1 { font-size: clamp(32px, 6vw, 64px); line-height: 1.05; letter-spacing: -.02em; max-width: 700px; }
  h1 span { color: var(--accent); }
  .sub { margin-top: 20px; color: var(--muted); font-size: 14px; max-width: 520px; line-height: 1.7; }
  .cta-row { display: flex; gap: 12px; margin-top: 36px; flex-wrap: wrap; justify-content: center; }
  .btn-primary { background: var(--accent); color: #fff; padding: 12px 28px; font-size: 13px; font-family: inherit; cursor: pointer; border: none; transition: opacity .15s; text-decoration: none; }
  .btn-primary:hover { opacity: .85; }
  .btn-outline { border: 1px solid var(--border); color: var(--muted); padding: 12px 28px; font-size: 13px; font-family: inherit; cursor: pointer; background: transparent; transition: color .15s, border-color .15s; text-decoration: none; }
  .btn-outline:hover { color: #fff; border-color: rgba(255,255,255,.2); }

  /* Features */
  .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1px; background: var(--border); max-width: 960px; width: 100%; margin: 60px auto 0; }
  .feat { background: var(--bg); padding: 32px 28px; }
  .feat-tag { font-size: 10px; color: var(--accent); margin-bottom: 16px; }
  .feat-title { font-size: 16px; margin-bottom: 10px; }
  .feat-body { font-size: 12px; color: var(--muted); line-height: 1.65; }

  /* Notify form */
  .notify { max-width: 480px; margin: 56px auto 0; width: 100%; padding: 0 24px; }
  .notify-label { font-size: 11px; color: var(--muted); margin-bottom: 10px; display: block; }
  .notify-row { display: flex; gap: 0; }
  .notify-row input { flex: 1; background: var(--surface); border: 1px solid var(--border); border-right: none; padding: 10px 14px; color: #fff; font-family: inherit; font-size: 13px; outline: none; }
  .notify-row input:focus { border-color: var(--accent); }
  .notify-row button { background: var(--accent); color: #fff; border: none; padding: 10px 18px; font-family: inherit; font-size: 13px; cursor: pointer; }
  .notify-note { font-size: 10px; color: var(--muted); margin-top: 8px; }
  .success-msg { color: var(--accent); font-size: 12px; margin-top: 8px; display: none; }

  /* Footer */
  footer { border-top: 1px solid var(--border); padding: 24px; text-align: center; font-size: 11px; color: var(--muted); }
  footer a { color: var(--muted); text-decoration: none; margin: 0 8px; }
  footer a:hover { color: #fff; }
</style>
</head>
<body>

<!-- Ecosystem nav -->
<nav class="ecosystem">
  <div class="ecosystem-inner">
    <a class="eco-link" href="https://focus.sipa-os.org" target="_blank">🎯 Focus</a>
    <a class="eco-link" href="https://ai.sipa-os.org" target="_blank">🤖 AI</a>
    <a class="eco-link" href="https://shell.sipa-os.org" target="_blank">⚡ Shell</a>
    <a class="eco-link" href="https://neuropower.sipa-os.org" target="_blank">🧠 NeuroPower</a>
    <a class="eco-link" href="https://games.sipa-os.org" target="_blank">🎮 Games</a>
    <a class="eco-link active" href="https://community.sipa-os.org">👥 Community</a>
  </div>
</nav>

<!-- Hero -->
<section class="hero">
  <div class="badge">// Q4 2026 · Coming Soon</div>
  <h1>Your tribe,<br /><span>your protocol</span></h1>
  <p class="sub">A platform for neurodiverse builders. Share progress, find co-founders, discover open-source, write blogs &amp; vlogs. Built on SIPA OS — non-lying, privacy-first, open stack.</p>
  <div class="cta-row">
    <a class="btn-primary" href="https://ai.sipa-os.org">Try SIPA AI →</a>
    <a class="btn-outline" href="https://github.com/soulinpsyabstract/sipa-community" target="_blank">GitHub Repo ↗</a>
  </div>

  <!-- Features grid -->
  <div class="features">
    <div class="feat">
      <div class="feat-tag">// 01</div>
      <div class="feat-title">Connect</div>
      <div class="feat-body">Find neurodiverse co-founders, collaborators, and builders across the ADHD / BPD / ASD spectrum.</div>
    </div>
    <div class="feat">
      <div class="feat-tag">// 02</div>
      <div class="feat-title">Discover</div>
      <div class="feat-body">Open-source projects, tools, and research built by and for the neurodiverse community.</div>
    </div>
    <div class="feat">
      <div class="feat-tag">// 03</div>
      <div class="feat-title">Share</div>
      <div class="feat-body">Blog, vlog, and post progress updates. Every entry SHA-256 hashed for integrity.</div>
    </div>
    <div class="feat">
      <div class="feat-tag">// 04</div>
      <div class="feat-title">Protocol</div>
      <div class="feat-body">NON_LYING · PRIVACY_FIRST · OPEN_STACK · NEURO_SAFE. Community standards enforced by MLL.</div>
    </div>
  </div>

  <!-- Notify -->
  <div class="notify">
    <span class="notify-label">// get notified when we launch</span>
    <div class="notify-row">
      <input type="email" id="email-input" placeholder="your@email.com" />
      <button onclick="notify()">Notify me</button>
    </div>
    <div class="notify-note">No spam. One email when Community goes live.</div>
    <div class="success-msg" id="success-msg">✓ Saved — we'll ping you at launch.</div>
  </div>
</section>

<footer>
  <a href="https://ai.sipa-os.org/protocol">Protocol</a>
  <a href="https://ai.sipa-os.org/privacy">Privacy</a>
  <a href="https://github.com/soulinpsyabstract/sipa-community" target="_blank">GitHub</a>
  <br /><br />
  SIPA OS · Soul In PsyAbstract LLC · community.sipa-os.org
</footer>

<script>
async function notify() {
  const email = document.getElementById('email-input').value.trim();
  if (!email || !email.includes('@')) return;
  try {
    await fetch('https://api.sipa-os.org/community/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ts: new Date().toISOString() })
    });
  } catch(_) {}
  document.getElementById('success-msg').style.display = 'block';
  document.getElementById('email-input').value = '';
}
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'sipa-community',
        version: '1.0.0',
        ts: new Date().toISOString()
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\nSitemap: https://community.sipa-os.org/sitemap.xml\n');
    }

    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-SIPA-Service': 'community',
        'X-SIPA-Version': '1.0.0',
      }
    });
  }
};
