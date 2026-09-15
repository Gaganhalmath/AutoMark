/**
 * SmartAttend — Registration Success Screen
 * Design reference: stitch_smartattend_mobile_app_onboarding/registration_successful/code.html
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';

export default function RegistrationSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const pingAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ping = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1.4,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    ping.start();

    return () => ping.stop();
  }, [pingAnim]);

  const handleContinue = () => {
    router.replace('/(student)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={Colors.onSurface}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Registration Successful
          </Text>
        </View>

        {/* ── Success Visual ──────────────────────────────────────────── */}
        <View style={styles.successSection}>
          <View style={styles.successIconWrap}>
            <Animated.View
              style={[
                styles.pingRing,
                {
                  transform: [{ scale: pingAnim }],
                  opacity: pingAnim.interpolate({
                    inputRange: [1, 1.4],
                    outputRange: [0.25, 0],
                  }),
                },
              ]}
            />

            <View style={styles.successCircle}>
              <Ionicons
                name="checkmark-circle"
                size={44}
                color={Colors.success}
              />
            </View>
          </View>

          <Text style={styles.successTitle}>
            Device Registered!
          </Text>

          <Text style={styles.successDesc}>
            This device is now successfully linked to your account.
          </Text>
        </View>

        {/* ── Device Link Card ────────────────────────────────────────── */}
        <View style={styles.linkCard}>
          <View style={styles.linkIconCircle}>
            <Ionicons
              name="link"
              size={22}
              color={Colors.success}
            />
          </View>

          <View style={styles.linkInfo}>
            <Text style={styles.linkUsn}>
              {user?.displayName || 'Student Account'}
            </Text>

            <View style={styles.linkStatusRow}>
              <Text style={styles.linkStatusText}>
                Device Linked Successfully
              </Text>

              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.success}
              />
            </View>
          </View>
        </View>

        {/* ── Binding Status Card ─────────────────────────────────────── */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardRow}>
            <Text style={styles.statusCardLabel}>
              Binding Status
            </Text>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                DEVICE ACTIVE
              </Text>
            </View>
          </View>

          <View style={styles.statusCardDivider} />

          <View style={styles.statusCardDeviceRow}>
            <View style={styles.statusCardDeviceIcon}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={Colors.primaryContainer}
              />
            </View>

            <View>
              <Text style={styles.statusCardDeviceName}>
                AutoMark Device
              </Text>

              <Text style={styles.statusCardDeviceSub}>
                Registered to your student account
              </Text>
            </View>
          </View>
        </View>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              pressed && {
                opacity: 0.9,
                transform: [{ scale: 0.99 }],
              },
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueBtnText}>
              CONTINUE TO APP
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={Colors.onPrimary}
            />
          </Pressable>

          <View style={styles.securityNote}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.primaryContainer}
              style={{
                flexShrink: 0,
                marginTop: 1,
              }}
            />

            <Text style={styles.securityNoteText}>
              Your device is now registered for secure attendance
              verification.
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginBottom: Spacing.lg,
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderRadius: Radius.full,
  },

  headerTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    flex: 1,
    textAlign: 'center',
    paddingRight: 32,
  },

  successSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },

  successIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  pingRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },

  successCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  successTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
  },

  successDesc: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    maxWidth: 280,
  },

  linkCard: {
    backgroundColor: Colors.successContainer,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Shadow.sm,
  },

  linkIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.white}CC`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  linkInfo: {
    flex: 1,
    minWidth: 0,
  },

  linkUsn: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  linkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },

  linkStatusText: {
    ...Typography.labelMd,
    color: Colors.success,
    fontWeight: '600',
  },

  statusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },

  statusCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusCardLabel: {
    ...Typography.bodySm,
    color: Colors.outline,
  },

  statusPill: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },

  statusPillText: {
    ...Typography.labelXs,
    color: Colors.onSecondaryContainer,
    fontWeight: '600',
  },

  statusCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVariant,
  },

  statusCardDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  statusCardDeviceIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusCardDeviceName: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '500',
  },

  statusCardDeviceSub: {
    ...Typography.bodySm,
    color: Colors.outline,
  },

  actions: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  continueBtn: {
    height: 48,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },

  continueBtnText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    letterSpacing: 1,
  },

  securityNote: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  securityNoteText: {
    ...Typography.bodySm,
    color: Colors.onSecondaryContainer,
    flex: 1,
    lineHeight: 18,
  },
});