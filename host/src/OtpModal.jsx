import React, {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {theme} from './theme';

/** Native OTP modal owned by the host (mini apps can't render native UI themselves). */
export function OtpModal({visible, title, onSubmit, onCancel}) {
  const [otp, setOtp] = useState('');
  const close = fn => {
    setOtp('');
    fn();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => close(onCancel)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title || 'Enter OTP'}</Text>
          <Text style={styles.hint}>Demo OTP: 123456</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.ghost]} onPress={() => close(onCancel)}>
              <Text style={styles.ghostText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => close(() => onSubmit(otp))}>
              <Text style={styles.btnText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24},
  card: {backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12},
  title: {fontSize: 18, fontWeight: '700', color: theme.ink},
  hint: {color: theme.muted},
  input: {borderWidth: 1, borderColor: theme.line, borderRadius: 10, padding: 12, fontSize: 22, letterSpacing: 8, textAlign: 'center'},
  row: {flexDirection: 'row', gap: 10},
  btn: {flex: 1, backgroundColor: theme.brand, borderRadius: 10, padding: 12, alignItems: 'center'},
  btnText: {color: '#fff', fontWeight: '700'},
  ghost: {backgroundColor: '#fff', borderWidth: 1, borderColor: theme.line},
  ghostText: {color: theme.ink, fontWeight: '700'},
});
