import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useRuntime} from './RuntimeContext';
import {MiniAppHost} from './MiniAppHost';
import {HOST_VERSION, meetsMinVersion} from './config';
import {theme} from './theme';

/**
 * Gatekeeper before a mini app runs:
 *   exists? → enabled (kill-switch)? → host new enough (minHostVersion)? → render MiniAppHost
 *
 * Production equivalent: src/screens/MiniAppScreen.jsx (also: login gate, native fallback).
 */
export function MiniAppScreen({appId, onBack}) {
  const {getApp} = useRuntime();
  const app = getApp(appId);

  let body;
  if (!app) {
    body = <Notice title="Mini app not found" text={appId} />;
  } else if (app.enabled === false) {
    body = <Notice title="Temporarily locked" text="This feature is under maintenance (kill-switch)." />;
  } else if (!meetsMinVersion(HOST_VERSION, app.minHostVersion)) {
    body = (
      <Notice
        title="Update required"
        text={`Needs host ≥ v${app.minHostVersion} (this host is v${HOST_VERSION}).`}
      />
    );
  } else {
    body = <MiniAppHost app={app} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {app?.name || appId}
        </Text>
        <Text style={styles.version}>{app ? `v${app.version}` : ''}</Text>
      </View>
      {body}
    </View>
  );
}

function Notice({title, text}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.bg},
  header: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: theme.brand},
  back: {color: '#fff', fontSize: 16, fontWeight: '600'},
  title: {flex: 1, color: '#fff', fontSize: 17, fontWeight: '700'},
  version: {color: '#CFE6FF', fontSize: 12},
  notice: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8},
  noticeTitle: {fontSize: 18, fontWeight: '700', color: theme.ink},
  noticeText: {color: theme.muted, textAlign: 'center'},
});
