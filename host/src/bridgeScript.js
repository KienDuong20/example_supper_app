/**
 * JS injected into the mini app WebView BEFORE its own scripts run.
 * Defines the low-level bridge that the mini app SDK (miniapps/_sdk/sdk.js) wraps.
 *
 *   mini app → host : window.ReactNativeWebView.postMessage({type, requestId, payload})
 *   host → mini app : webView.injectJavaScript("window.__bridge._resolve(requestId, ok, data)")
 *
 * Production equivalent: buildBridgeScript() in MiniAppHost.jsx (window.MobiFoneBridge).
 */
export function buildBridgeScript({hostVersion, msisdn, capabilities}) {
  const host = JSON.stringify({inHost: true, version: hostVersion, msisdn, capabilities}).replace(/</g, '\\u003c');
  return `
(function () {
  if (window.__bridge) return;
  window.__HOST__ = ${host};
  var pending = {};
  var seq = 0;
  window.__bridge = {
    send: function (type, payload) {
      return new Promise(function (resolve, reject) {
        var id = 'r' + (++seq);
        pending[id] = { resolve: resolve, reject: reject };
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, requestId: id, payload: payload }));
      });
    },
    _resolve: function (id, ok, data) {
      var p = pending[id];
      if (!p) return;
      delete pending[id];
      ok ? p.resolve(data) : p.reject(new Error(String(data)));
    }
  };
})();
true;`;
}
