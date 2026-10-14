import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {AppState} from 'react-native';
import {CDN_URL} from './config';

/**
 * Single source of truth for WHICH mini apps exist, WHERE their bundle is, WHICH version,
 * WHAT they may do (capabilities) and WHETHER they are enabled (kill-switch).
 *
 * Production equivalent: MiniAppRuntimeContext.jsx (GET /api/v1/mini-apps/runtime).
 * Here the "platform" is just dist/runtime.json on the static server.
 */

// Bundled copy so the Home screen renders instantly / offline, before the fetch returns.
const FALLBACK_APPS = [
  {id: 'miniapp-hello', name: 'Hello Packages', version: '1.0.0', enabled: true, minHostVersion: '1.0.0',
    capabilities: [], bundlePath: 'miniapp-hello/1.0.0/index.html'},
  {id: 'miniapp-topup', name: 'Top-up', version: '1.0.0', enabled: true, minHostVersion: '1.0.0',
    capabilities: ['payment.create', 'otp.request', 'confirm'], bundlePath: 'miniapp-topup/1.0.0/index.html'},
];

const RuntimeContext = createContext(null);

export function RuntimeProvider({children}) {
  const [apps, setApps] = useState(FALLBACK_APPS);
  const [source, setSource] = useState('fallback'); // 'fallback' | 'remote'

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${CDN_URL}/runtime.json?t=${Date.now()}`);
      if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
      const json = await res.json();
      // NOTE: differs from production — remote entries REPLACE local ones (incl. capabilities),
      // so the platform can revoke a permission. Production unions local + server capabilities.
      setApps(json.apps);
      setSource('remote');
      console.log(`[runtime] loaded ${json.apps.length} apps from CDN`);
    } catch (e) {
      console.log(`[runtime] fetch failed, keep current list: ${e.message}`);
    }
  }, []);

  // Load on start + every time the app returns to foreground (how hot deploy gets picked up).
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', s => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(
    () => ({apps, source, refresh, getApp: id => apps.find(a => a.id === id) || null}),
    [apps, source, refresh],
  );
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export const useRuntime = () => useContext(RuntimeContext);
