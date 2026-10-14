import React, {useEffect, useState} from 'react';
import {BackHandler, SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {RuntimeProvider} from './src/RuntimeContext';
import {HomeScreen} from './src/HomeScreen';
import {MiniAppScreen} from './src/MiniAppScreen';
import {theme} from './src/theme';

/**
 * App shell. Navigation is a tiny state machine (no router), like production's
 * SuperAppMobile.jsx — just with one flag instead of ~80.
 */
export default function App() {
  const [miniAppId, setMiniAppId] = useState(null);

  // Android hardware back closes the open mini app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!miniAppId) {return false;}
      setMiniAppId(null);
      return true;
    });
    return () => sub.remove();
  }, [miniAppId]);

  return (
    <RuntimeProvider>
      <StatusBar barStyle="light-content" backgroundColor={theme.brand} />
      <SafeAreaView style={styles.root}>
        {miniAppId ? (
          <MiniAppScreen appId={miniAppId} onBack={() => setMiniAppId(null)} />
        ) : (
          <HomeScreen onOpen={setMiniAppId} />
        )}
      </SafeAreaView>
    </RuntimeProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.brand},
});
