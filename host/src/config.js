import {Platform} from 'react-native';

/** Version of this host build. Mini apps declare `minHostVersion` against it. */
export const HOST_VERSION = '1.0.0';

/** Fake logged-in subscriber (no login screen in this example). */
export const MSISDN = '0901234567';

/**
 * The "CDN" serving mini app bundles + runtime.json (`npx serve dist -l 8080`).
 * Android emulator reaches the Mac via 10.0.2.2; iOS simulator via localhost.
 * On a physical device, replace with your Mac's LAN IP.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const CDN_URL = `http://${DEV_HOST}:8080`;

/** True when `current` >= `min` (semver-ish "1.2.3"). */
export function meetsMinVersion(current, min) {
  if (!min) {return true;}
  const a = String(current).split('.').map(Number);
  const b = String(min).split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d !== 0) {return d > 0;}
  }
  return true;
}
