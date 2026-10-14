/**
 * miniapp-topup — a SECURE WRITE flow:
 *   confirm (native dialog) → requestOtp (native modal) → POST /topup
 * Each step is a bridge call that the host checks against this app's capabilities.
 */
(function () {
  const sdk = window.MiniSDK;
  const meta = window.__MINIAPP__;
  const app = document.getElementById('app');
  const AMOUNTS = [10000, 50000, 100000];
  let amount = AMOUNTS[1];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }

  function render(logHtml) {
    app.innerHTML = `
      <div class="card">
        <h2>${esc(meta.name)}</h2>
        <div class="meta">v${esc(meta.version)} · caps: ${esc((sdk.host.capabilities || []).join(', ') || 'none')}</div>
      </div>
      <div class="card"><b>Amount</b><ul>
        ${AMOUNTS.map((a) => `<li><label><input type="radio" name="amt" value="${a}" ${a === amount ? 'checked' : ''}/> ${a.toLocaleString()}đ</label></li>`).join('')}
      </ul></div>
      <button id="pay" ${sdk.hasCapability('payment.create') ? '' : 'disabled'}>Top up</button>
      <div class="card log" id="log">${logHtml || 'Log…'}</div>`;
    document.querySelectorAll('input[name=amt]').forEach((el) => {
      el.onchange = () => (amount = Number(el.value));
    });
    document.getElementById('pay').onclick = pay;
  }

  function step(text, cls) {
    const el = document.getElementById('log');
    const line = `<div class="${cls || ''}">${esc(text)}</div>`;
    el.innerHTML = el.textContent === 'Log…' ? line : el.innerHTML + line;
  }

  async function pay() {
    document.getElementById('log').textContent = 'Log…';
    try {
      step('1. confirm → host native dialog');
      const ok = await sdk.confirm(`Top up ${amount.toLocaleString()}đ for ${sdk.host.msisdn || 'this number'}?`);
      if (!ok) return step('Cancelled by user', 'err');

      step('2. requestOtp → host native modal');
      const otp = await sdk.requestOtp('Confirm top-up');

      step('3. POST /topup → host checks payment.create');
      const res = await sdk.api('POST', '/topup', { amount, otp });
      step(`✔ Success · txn ${res.txnId} · balance ${res.balance.toLocaleString()}đ`, 'ok');
    } catch (e) {
      step(`✘ ${e.message}`, 'err');
    }
  }

  render();
})();
