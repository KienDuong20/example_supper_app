import React, {useRef, useState} from 'react';
import {Alert, Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {buildBridgeScript} from './bridgeScript';
import {evaluate} from './capabilityPolicy';
import {callMockApi} from './mockApi';
import {OtpModal} from './OtpModal';
import {CDN_URL, HOST_VERSION, MSISDN} from './config';
import {theme} from './theme';

/**
 * Runs ONE mini app: loads its bundle in a WebView, injects the bridge, and handles every
 * bridge message: policy check → native action → reply to the mini app.
 *
 * Production equivalent: src/miniapp/MiniAppHost.jsx.
 */
export function MiniAppHost({app}) {
  const webRef = useRef(null);
  const [otp, setOtp] = useState(null); // {requestId, title} while the OTP modal is open
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // `?mbf_v=` busts the WebView/CDN cache when a new version is published (hot deploy).
  // Same param name as production (utils/miniAppBundleUrl.js → withMiniAppCacheBust).
  const bundleUrl = `${CDN_URL}/${app.bundlePath}?mbf_v=${app.version}`;
console.log("BUNDLE",bundleUrl)
  const reply = (requestId, ok, data) => {
    const js = `window.__bridge && window.__bridge._resolve(${JSON.stringify(requestId)}, ${ok}, ${JSON.stringify(data ?? null)}); true;`;
    webRef.current?.injectJavaScript(js);
  };

  const onMessage = async event => {
    // NOTE: differs from production — only accept messages from pages on our CDN origin.
    if (!String(event.nativeEvent.url || '').startsWith(CDN_URL)) {return;}

    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    const {type, requestId, payload = {}} = msg;
    const label = type === 'callApi' ? `${type} ${payload.method} ${payload.path}` : type;

    // 1. Security gate: is this mini app allowed to do this?
    const verdict = evaluate(msg, app.capabilities);
    console.log(`[bridge] ${app.id} ${label} → ${verdict.allowed ? 'ALLOWED' : `DENIED (${verdict.reason})`}`);
    if (!verdict.allowed) {
      return reply(requestId, false, `Mini app "${app.id}" denied: ${verdict.reason}`);
    }

    // 2. Perform the action natively, 3. reply.
    try {
      if (type === 'callApi') {
        const data = await callMockApi(payload.method, payload.path, payload.body, {msisdn: MSISDN});
        reply(requestId, true, data);
      } else if (type === 'requestOtp') {
        setOtp({requestId, title: payload.title}); // reply happens when the modal closes
      } else if (type === 'confirm') {
        // Stand-in for biometric (Face ID / Touch ID) in production.
        Alert.alert('Confirm', payload.message || 'Continue?', [
          {text: 'Cancel', style: 'cancel', onPress: () => reply(requestId, true, false)},
          {text: 'OK', onPress: () => reply(requestId, true, true)},
        ]);
      }
    } catch (e) {
      reply(requestId, false, e.message);
    }
  };

  // NOTE: differs from production — the WebView may only navigate inside our CDN.
  // Any other link opens in the system browser, so foreign pages never get the bridge.
  const onShouldStartLoadWithRequest = req => {
    if (req.url.startsWith(CDN_URL) || req.url === 'about:blank') {return true;}
    Linking.openURL(req.url);
    return false;
  };

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Cannot load mini app</Text>
        <Text style={styles.errText}>{loadError}</Text>
        <Text style={styles.errText}>Is the CDN running? (node tools/cdn.js)</Text>
        <Pressable
          style={styles.btn}
          onPress={() => {
            setLoadError(null);
            setReloadKey(k => k + 1);
          }}>
          <Text style={styles.btnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <WebView
        // New id/version → new key → WebView remounts with the new bundle.
        key={`${app.id}:${app.version}:${reloadKey}`}
        ref={webRef}
        source={{uri: bundleUrl}}
        injectedJavaScriptBeforeContentLoaded={buildBridgeScript({
          hostVersion: HOST_VERSION,
          msisdn: MSISDN,
          capabilities: app.capabilities,
        })}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onError={e => setLoadError(e.nativeEvent.description)}
        onHttpError={e => setLoadError(`HTTP ${e.nativeEvent.statusCode}`)}
        style={styles.flex}
      />
      <OtpModal
        visible={Boolean(otp)}
        title={otp?.title}
        onSubmit={code => {
          reply(otp.requestId, true, code);
          setOtp(null);
        }}
        onCancel={() => {
          reply(otp.requestId, false, 'OTP cancelled');
          setOtp(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8},
  errTitle: {fontSize: 17, fontWeight: '700', color: theme.danger},
  errText: {color: theme.muted, textAlign: 'center'},
  btn: {marginTop: 8, backgroundColor: theme.brand, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24},
  btnText: {color: '#fff', fontWeight: '700'},
});
