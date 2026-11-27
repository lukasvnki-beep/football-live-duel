// Free vs premium in the app: the plan card on the Profile tab and the "Go premium" screen.
// The server counts the games (api/_plan.js); this file only shows them.
// The screen opens by itself when the server says the free limit is reached (status 402 from /api/duel).
(function () {
  const me = () => { try { return JSON.parse(localStorage.getItem('fld.me') || 'null'); } catch (e) { return null; } };
  const signedIn = () => { try { return !!localStorage.getItem('fld.acct'); } catch (e) { return false; } };
  let plan = null;

  async function load(body) {
    const m = me() || {};
    const r = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get', id: m.id, token: m.token, ...(body || {}) }) });
    const b = await r.json().catch(() => ({}));
    if (!r.ok || b.error) throw new Error(b.error || 'Something went wrong.');
    plan = b; return b;
  }

  const css = document.createElement('style');
  css.textContent = `
.pm-ov{position:fixed;inset:0;z-index:60;background:rgba(8,17,30,.97);display:flex;padding:20px;overflow:auto}
.pm-box{margin:auto;width:100%;max-width:420px;display:flex;flex-direction:column;gap:14px;text-align:center}
.pm-box h2{font-family:var(--display);font-size:2.4rem;text-transform:uppercase;line-height:1}
.pm-star{font-size:3rem;line-height:1}
.pm-list{display:flex;flex-direction:column;gap:8px;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:14px}
.pm-list div{display:flex;gap:10px;align-items:flex-start}
.pm-list b{color:var(--accent)}
.pm-bar{height:8px;border-radius:8px;background:var(--panel2);overflow:hidden}
.pm-bar i{display:block;height:100%;background:var(--accent)}
.pm-tag{display:inline-block;padding:2px 10px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:.8rem}
.pm-test{border:1px dashed var(--line);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:8px}`;
  document.head.appendChild(css);

  function usedHtml(p) {
    if (p.premium) return '<p class="small" style="margin:0"><span class="pm-tag">PREMIUM</span> Unlimited online duels. Thank you!</p>';
    const row = (lab, n, max) => `<div class="small" style="display:flex;justify-content:space-between"><span>${lab}</span><b>${Math.min(n, max)} of ${max}</b></div><div class="pm-bar"><i style="width:${Math.min(100, n / max * 100)}%"></i></div>`;
    return `<p class="small muted" style="margin:0">Free plan: ${p.limits.day} online duel a day, ${p.limits.week} a week. Practice games are always free.</p>
      ${row('Online duels today', p.day, p.limits.day)}${row('Online duels this week', p.week, p.limits.week)}`;
  }

  function open(reason) {
    close();
    const ov = document.createElement('div'); ov.className = 'pm-ov'; ov.id = 'pm-ov';
    const draw = () => {
      const p = plan;
      ov.innerHTML = `<div class="pm-box">
        <div class="pm-star">⭐</div>
        <h2>Go premium</h2>
        ${reason ? `<p style="margin:0">${reason.replace(/[<>&]/g, '')}</p>` : '<p class="muted" style="margin:0">Play as many duels as you want.</p>'}
        <div class="pm-list">
          <div><b>✓</b><span>Unlimited online duels with your friends, every day</span></div>
          <div><b>✓</b><span>All power-ups, chat, forfeits and badges, like now</span></div>
          <div><b>✓</b><span>Support a small independent app</span></div>
        </div>
        ${p ? `<div class="pm-list">${usedHtml(p)}</div>` : ''}
        ${p && p.premium ? '' : '<button class="btn" id="pm-buy">Go premium</button>'}
        <p class="small muted" style="margin:0">Payments are coming soon. Practice and same-phone games stay free.</p>
        ${p && p.canTest ? `<div class="pm-test"><span class="small muted">Test only (no payment): you see this because you are a tester.</span>
          <button class="btn ghost" id="pm-tog">${p.premium ? 'Turn premium off' : 'Turn premium on (test)'}</button></div>` : ''}
        <button class="btn ghost" id="pm-close">${p && p.premium ? 'Close' : 'Not now'}</button></div>`;
      ov.querySelector('#pm-close').onclick = close;
      const buy = ov.querySelector('#pm-buy');
      if (buy) buy.onclick = () => { buy.textContent = 'Coming soon'; buy.disabled = true; };
      const tog = ov.querySelector('#pm-tog');
      if (tog) tog.onclick = async () => { tog.disabled = true; try { await load({ action: 'test', on: !plan.premium }); draw(); card(); } catch (e) { tog.textContent = e.message; } };
    };
    draw(); document.body.appendChild(ov);
    load().then(draw).catch(() => {});
  }
  function close() { const o = document.getElementById('pm-ov'); if (o) o.remove(); }

  // Plan card on the Profile tab: fills <div id="plan"></div>
  function card() {
    const el = document.getElementById('plan'); if (!el) return;
    const draw = p => {
      el.className = 'lg';
      el.innerHTML = `<h3>Your plan</h3>${p ? usedHtml(p) : '<p class="small muted" style="margin:0">Loading…</p>'}
        ${p && !p.premium ? '<button class="btn" id="pm-go" style="padding:12px">⭐ Go premium</button>' : ''}
        ${p && p.premium ? '<button class="linkbtn" id="pm-go" style="text-align:left;padding:0">Manage premium</button>' : ''}
        ${p && !p.premium && !signedIn() ? '<p class="small muted" style="margin:0">Sign in below to keep your plan on every phone.</p>' : ''}`;
      const go = el.querySelector('#pm-go'); if (go) go.onclick = () => open();
    };
    draw(plan); load().then(draw).catch(() => { if (!plan) el.remove(); });
  }

  // Open the screen when the server says the free limit is reached
  const f0 = window.fetch.bind(window);
  window.fetch = async function (u, o) {
    const r = await f0(u, o);
    try {
      if (r.status === 402 && String(u).startsWith('/api/duel')) r.clone().json().then(b => { if (b && b.limit) setTimeout(() => open(b.error), 50); }).catch(() => {});
    } catch (e) {}
    return r;
  };

  window.FLDPremium = { open, card };
})();
