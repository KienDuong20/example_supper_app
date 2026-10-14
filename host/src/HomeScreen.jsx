import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useRuntime} from './RuntimeContext';
import {CDN_URL, HOST_VERSION, MSISDN} from './config';
import {theme} from './theme';

/** Home: one tile per mini app in the runtime manifest. Tapping a tile opens it. */
export function HomeScreen({onOpen}) {
  const {apps, source, refresh} = useRuntime();

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Mini Super App</Text>
        <Text style={styles.heroSub}>
          {MSISDN} · host v{HOST_VERSION}
        </Text>
      </View>

      <View style={styles.sourceRow}>
        <Text style={styles.source}>
          Manifest: <Text style={styles.bold}>{source}</Text> · {CDN_URL}
        </Text>
        <Pressable onPress={refresh} hitSlop={8}>
          <Text style={styles.link}>Refresh</Text>
        </Pressable>
      </View>

      <FlatList
        data={apps}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <Pressable style={styles.tile} onPress={() => onOpen(item.id)}>
            <View style={styles.flex}>
              <Text style={styles.tileTitle}>{item.name}</Text>
              <Text style={styles.tileSub}>
                {item.id} · v{item.version}
              </Text>
              <Text style={styles.tileCaps}>caps: {item.capabilities.join(', ') || 'none'}</Text>
            </View>
            {item.enabled === false ? <Text style={styles.off}>OFF</Text> : <Text style={styles.chev}>›</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.bg},
  flex: {flex: 1},
  hero: {backgroundColor: theme.brand, padding: 20, paddingTop: 24},
  heroTitle: {color: '#fff', fontSize: 24, fontWeight: '800'},
  heroSub: {color: '#CFE6FF', marginTop: 4},
  sourceRow: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12},
  source: {color: theme.muted, fontSize: 12},
  bold: {fontWeight: '700', color: theme.ink},
  link: {color: theme.brand, fontWeight: '700', fontSize: 12},
  list: {padding: 16, gap: 10},
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.line,
  },
  tileTitle: {fontSize: 16, fontWeight: '700', color: theme.ink},
  tileSub: {color: theme.muted, fontSize: 12, marginTop: 2},
  tileCaps: {color: theme.brand, fontSize: 12, marginTop: 4},
  chev: {fontSize: 26, color: theme.muted},
  off: {color: theme.danger, fontWeight: '800'},
});
