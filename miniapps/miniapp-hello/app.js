/**
 * miniapp-hello — shows two things:
 *   1. a READ call through the bridge (allowed: public path)
 *   2. a WRITE call this mini app has NO capability for (denied by the host)
 */
(function () {
  const sdk = window.MiniSDK;
  const meta = window.__MINIAPP__;
  const app = document.getElementById('app');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }

  function render(packagesHtml, logHtml) {
    app.innerHTML = `
      <div class="card">
        <h2>${esc(meta.name)}</h2>
        <div class="meta">v${esc(meta.version)} · host v${esc(sdk.host.version || '-')} · user ${esc(sdk.host.msisdn || '-')}</div>
      </div>
      <div class="card"><b>Packages</b> (GET /packages)<ul>${packagesHtml}</ul></div>
      <button class="ghost" id="steal">Try POST /topup (no capability)</button>
      <div class="card log" id="log">${logHtml || 'Log…'}</div>`;
    document.getElementById('steal').onclick = tryTopup;
  }

  function log(text, cls) {
    document.getElementById('log').innerHTML = `<span class="${cls}">${esc(text)}</span>`;
  }

  function load() {
    render('<li>Loading…</li>');
    sdk
      .api('GET', '/packages')
      .then((list) => {
        const rows = list.map((p) => `<li><span>${esc(p.name)}</span><b>${esc(p.price.toLocaleString())}đ</b></li>`).join('');
        render(rows, '<span class="ok">✔ GET /packages allowed (public)</span>');
      })
      .catch((e) => render(`<li class="err">${esc(e.message)}</li>`));
  }

  function tryTopup() {
    sdk
      .api('POST', '/topup', { amount: 50000 })
      .then(() => log('✘ Unexpected: topup succeeded', 'err'))
      .catch((e) => log(`✔ Host denied as expected:\n${e.message}`, 'ok'));
  }

  load();
})();
