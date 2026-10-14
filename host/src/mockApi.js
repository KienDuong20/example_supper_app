/**
 * Fake backend living inside the host. Mini apps never call it directly — only via the bridge,
 * after capabilityPolicy approved the call. The host adds the user context (msisdn).
 *
 * Production equivalent: platformApi.dispatch → POST /api/v1/async/dispatch → legacy API.
 */
const OTP = '123456';
let balance = 120000;

const ROUTES = {
  'GET /packages': () => [
    {id: 'D5', name: 'D5 — 1GB / 1 day', price: 5000},
    {id: 'C90N', name: 'C90N — 120GB / 30 days', price: 90000},
    {id: 'MAX', name: 'MAX — unlimited / 30 days', price: 150000},
  ],
  'POST /topup': ({amount, otp}, ctx) => {
    if (otp !== OTP) {throw new Error('Wrong OTP (use 123456)');}
    if (!(amount > 0)) {throw new Error('Invalid amount');}
    balance += amount;
    return {txnId: `TX${Date.now()}`, msisdn: ctx.msisdn, balance};
  },
};

export async function callMockApi(method, path, body, ctx) {
  await new Promise(r => setTimeout(r, 400)); // simulate network latency
  const handler = ROUTES[`${String(method).toUpperCase()} ${path}`];
  if (!handler) {throw new Error(`404 ${method} ${path}`);}
  return handler(body || {}, ctx);
}
