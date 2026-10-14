/**
 * Mini App SDK — the ONLY API a mini app uses to talk to the host.
 *
 * The host injects `window.__bridge` + `window.__HOST__` before this page loads
 * (see host/src/bridgeScript.js). This SDK wraps that low-level bridge into Promises.
 *
 * Production equivalent: `mobifone-miniapp-sdk.js` (window.MobiFoneSDK) + `MobiFoneBridge`.
 */
(function () {
  const bridge = window.__bridge;
  const inHost = Boolean(bridge && window.ReactNativeWebView);

  // Opened in a normal browser (no host) → small stubs so the page can still be previewed.
  function browserStub(type, payload) {
    if (type === 'confirm') return Promise.resolve(window.confirm(payload.message));
    if (type === 'requestOtp') return Promise.resolve(window.prompt('OTP (browser stub)', '123456'));
    return Promise.reject(new Error('Not running inside the Super App host'));
  }

  function send(type, payload) {
    return inHost ? bridge.send(type, payload || {}) : browserStub(type, payload || {});
  }

  window.MiniSDK = {
    host: window.__HOST__ || { inHost: false, capabilities: [] },
    inHost,

    /** Call a host-proxied API. The host decides if this mini app is allowed to. */
    api(method, path, body) {
      return send('callApi', { method, path, body });
    },

    /** Ask the host to show its native OTP modal. Resolves with the OTP string. */
    requestOtp(title) {
      return send('requestOtp', { title });
    },

    /** Ask the host for a native confirmation (stand-in for biometric). Resolves true/false. */
    confirm(message) {
      return send('confirm', { message });
    },

    /** Lets UI hide features the mini app was not granted. Security is still enforced by the host. */
    hasCapability(cap) {
      return (this.host.capabilities || []).includes(cap);
    },
  };
})();
