/**
 * Decides if a bridge message from a mini app is allowed, given the capabilities
 * the runtime manifest granted that mini app.
 *
 * NOTE: differs from production — this is a true ALLOWLIST (default-deny):
 * unknown message types and unknown API routes are rejected. Production only checks a
 * list of sensitive paths and lets everything else through.
 */

// Bridge intents → required capability.
const INTENTS = {
  requestOtp: 'otp.request',
  confirm: 'confirm',
};

// Every API route a mini app may call. cap: null = public (any mini app).
const API_ROUTES = [
  {method: 'GET', path: '/packages', cap: null},
  {method: 'POST', path: '/topup', cap: 'payment.create'},
];

/** @returns {{allowed: boolean, reason?: string}} */
export function evaluate(msg, granted = []) {
  const has = cap => !cap || granted.includes(cap);

  if (msg.type in INTENTS) {
    const cap = INTENTS[msg.type];
    return has(cap) ? {allowed: true} : {allowed: false, reason: `missing capability '${cap}'`};
  }

  if (msg.type === 'callApi') {
    const {method = 'GET', path = ''} = msg.payload || {};
    const route = API_ROUTES.find(r => r.method === method.toUpperCase() && r.path === path);
    if (!route) {return {allowed: false, reason: `route not allowed: ${method} ${path}`};}
    return has(route.cap) ? {allowed: true} : {allowed: false, reason: `missing capability '${route.cap}'`};
  }

  return {allowed: false, reason: `unknown bridge call '${msg.type}'`};
}
