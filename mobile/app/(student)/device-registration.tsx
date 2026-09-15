/**
 * SmartAttend — Device Registration Screen
 * Design reference: stitch_smartattend_mobile_app_onboarding/device_registration/code.html
 *
 * Business rules:
 * - ONE USN ↔ ONE device
 * - No BLE in Phase 1 — registration is simulated
 * - Real cryptographic binding in Phase 4
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuth } from '../../auth/AuthProvider';
import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { apiRequest } from '../../services/api';

const REGISTRATION_STEPS = [
  { text: 'Communicating with server...', ms: '42ms' },
  { text: 'Verifying hardware signature...', ms: '38ms' },
  { text: 'Binding cryptographic token...', ms: '51ms' },
  { text: 'Syncing institutional credentials...', ms: '29ms' },
  { text: 'Finalizing registration...', ms: '18ms' },
];

export default function DeviceRegistrationScreen() {
  console.log("🔥🔥🔥 DEVICE REGISTRATION SCREEN LOADED 🔥🔥🔥");
  const router = useRouter();
  const { user, tokens } = useAuth();

  const generateDeviceKey = async () => {
  const existingKey = await SecureStore.getItemAsync('smartattend_device_key');

  if (existingKey) {
    return existingKey;
  }

  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const publicKey = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync('smartattend_device_key', publicKey);

  return publicKey;
};

  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pingAnim = useRef(new Animated.Value(1)).current;

  // Spinner
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  // Ping animation
  useEffect(() => {
    const ping = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    ping.start();
    return () => ping.stop();
  }, [pingAnim]);

  // Real device registration
useEffect(() => {
  let mounted = true;

  const registerDevice = async () => {
    try {
      if (!tokens?.accessToken) {
        throw new Error('Authentication session not found');
      }

      // Step 1 — Generate or retrieve the device key
      if (mounted) setStepIndex(0);
      const publicKey = await generateDeviceKey();

console.log("🔥 GENERATED DEVICE KEY:", publicKey);
      // Step 2 — Send the key to the backend
      if (mounted) setStepIndex(1);

      console.log("DEVICE TOKEN:", tokens.accessToken);

      await apiRequest('/student/device', {
        method: 'POST',
        body: { publicKey },
        token: tokens.accessToken,
      });

      // Step 3 — Registration succeeded
      if (mounted) {
        setStepIndex(REGISTRATION_STEPS.length - 1);
        setComplete(true);
      }

      // Navigate after a short pause
      setTimeout(() => {
        if (mounted) {
          router.replace('/(student)/registration-success');
        }
      }, 1000);
    } catch (error) {
      console.error('DEVICE REGISTRATION ERROR:', error);

      if (mounted) {
        setComplete(false);
        setStepIndex(0);
      }
    }
  };

  registerDevice();

  return () => {
    mounted = false;
  };
}, [router, tokens?.accessToken]);

  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentStep = REGISTRATION_STEPS[Math.min(stepIndex, REGISTRATION_STEPS.length - 1)];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <SmartAttendLogo size={32} />
        <Text style={styles.headerTitle}>Device Registration</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={Colors.onPrimary} />
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Hero icon */}
        <View style={styles.heroIconWrap}>
          <Animated.View
            style={[
              styles.pingRing,
              { transform: [{ scale: pingAnim }], opacity: pingAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.3, 0] }) },
            ]}
          />
          <View style={styles.heroIconCircle}>
            <Ionicons name="phone-portrait-outline" size={38} color={Colors.tertiary} />
            <View style={styles.heroIconBadge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Status title */}
        <Text style={styles.statusTitle}>
          {complete ? 'Device successfully linked' : 'Registering your device...'}
        </Text>
        <Text style={styles.statusDesc}>
          Please wait while we securely link this device to your account with our server.
        </Text>

        {/* Spinner + progress */}
        <View style={styles.progressWrap}>
          <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="9" stroke={Colors.primaryContainer} strokeWidth="3" opacity={0.2} />
              <Path d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3z" fill={Colors.primaryContainer} />
            </Svg>
          </Animated.View>
          <View style={styles.progressPill}>
            <View style={[styles.progressDot, { backgroundColor: Colors.primaryContainer }]} />
            <Text style={styles.progressText}>
              {complete ? 'Registration Complete' : currentStep.text}
            </Text>
          </View>
        </View>

        {/* Telemetry strip */}
        <View style={styles.telemetry}>
          <Text style={styles.telemetryText}>HANDSHAKE SEC-256</Text>
          <Text style={styles.telemetryDot}>•</Text>
          <Text style={styles.telemetryText}>{currentStep.ms}</Text>
          <Text style={styles.telemetryDot}>•</Text>
          <Text style={[styles.telemetryText, { color: Colors.primaryContainer, fontWeight: '500' }]}>ENCRYPTED</Text>
        </View>

        {/* Security commitment card */}
        <View style={styles.securityCard}>
          <View style={styles.securityIconWrap}>
            <Ionicons name="shield" size={18} color={Colors.tertiary} />
          </View>
          <View style={styles.securityCardContent}>
            <Text style={styles.securityCardTitle}>Single Device Binding</Text>
            <Text style={styles.securityCardBody}>
              This process will register this device to your USN and cannot be used for another account.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },

  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.marginMobile, gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
    ...Shadow.sm,
  },
  headerTitle: { flex: 1, ...Typography.titleSm, color: Colors.onSurface },
  avatarCircle: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.marginMobile, gap: Spacing['3xl'],
  },

  heroIconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pingRing: {
    position: 'absolute',
    width: 112, height: 112, borderRadius: Radius.full,
    backgroundColor: `${Colors.tertiaryFixed}66`,
  },
  heroIconCircle: {
    width: 80, height: 80, borderRadius: Radius.full,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  heroIconBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },

  statusTitle: {
    ...Typography.headlineMd, color: Colors.onSurface,
    textAlign: 'center',
  },
  statusDesc: {
    ...Typography.bodyMd, color: Colors.onSurfaceVariant,
    textAlign: 'center', maxWidth: 280, lineHeight: 24,
  },

  progressWrap: { alignItems: 'center', gap: Spacing.md },
  progressPill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  progressDot: { width: 8, height: 8, borderRadius: Radius.full },
  progressText: { ...Typography.labelMd, color: Colors.primary, fontWeight: '500' },

  telemetry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, opacity: 0.7 },
  telemetryText: { ...Typography.labelXs, color: Colors.onSurfaceVariant },
  telemetryDot: { ...Typography.labelXs, color: Colors.onSurfaceVariant },

  securityCard: {
    width: '100%', backgroundColor: `${Colors.tertiaryFixed}99`,
    borderRadius: Radius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, ...Shadow.sm,
  },
  securityIconWrap: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, ...Shadow.sm,
  },
  securityCardContent: { flex: 1 },
  securityCardTitle: { ...Typography.labelLg, color: Colors.onSurface, marginBottom: 2 },
  securityCardBody: { ...Typography.bodySm, color: Colors.onSurfaceVariant, lineHeight: 18 },
});
