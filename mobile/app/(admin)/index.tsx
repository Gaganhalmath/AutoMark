/**
 * SmartAttend — Admin Dashboard
 * Design reference: stitch_smartattend_mobile_app_onboarding/admin_dashboard/code.html
 *
 * Sections:
 * - Status bar + App Bar (SmartAttend | Admin Dashboard)
 * - Greeting + Institution + Super Admin role
 * - 3-column Overview Summary metric cards
 * - 3×3 Quick Actions grid (9 modules)
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { MOCK_ADMIN, MOCK_ADMIN_STATS } from '../../mocks/mockData';

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueBg?: string;
  onPress?: () => void;
}

function MetricCard({ icon, iconBg, iconColor, label, value, onPress }: MetricCardProps) {
  return (
    <Pressable style={metricStyles.card} onPress={onPress}>
      <View style={[metricStyles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={metricStyles.label} numberOfLines={1}>{label}</Text>
      <Text style={metricStyles.value}>{value}</Text>
    </Pressable>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1, height: 120, borderRadius: Radius.xl, padding: Spacing.sm,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLowest,
    ...Shadow.sm,
  },
  iconCircle: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.labelXs, color: Colors.onSurface, fontWeight: '600', textAlign: 'center' },
  value: { ...Typography.headlineMd, color: Colors.primaryContainer, fontWeight: '700', lineHeight: 26 },
});

interface QuickModuleProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  badge?: number;
  onPress: () => void;
}

function QuickModule({ icon, iconBg, iconColor, label, badge, onPress }: QuickModuleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [moduleStyles.card, pressed && moduleStyles.pressed]}
    >
      {badge !== undefined && badge > 0 && (
        <View style={moduleStyles.badge}>
          <Text style={moduleStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <View style={[moduleStyles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={moduleStyles.label} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

const moduleStyles = StyleSheet.create({
  card: {
    flex: 1, height: 106, backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, ...Shadow.sm,
  },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
  iconCircle: { width: 40, height: 40, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.labelXs, color: Colors.onSurface, fontWeight: '600', textAlign: 'center', paddingHorizontal: 4 },
  badge: {
    position: 'absolute', top: 6, right: 6, minWidth: 20, height: 20,
    borderRadius: Radius.full, backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, zIndex: 10,
  },
  badgeText: { ...Typography.labelXs, color: Colors.onPrimary, fontWeight: '700' },
});

export default function AdminDashboardScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const admin = MOCK_ADMIN;
  const stats = MOCK_ADMIN_STATS;

  const quickModules: QuickModuleProps[] = [
    { icon: 'person-circle-outline', iconBg: Colors.tertiaryFixed, iconColor: Colors.tertiary, label: 'Student\nManagement', onPress: () => router.push('/(admin)/students') },
    { icon: 'school-outline', iconBg: '#EAF8ED', iconColor: '#16A34A', label: 'Faculty\nManagement', onPress: () => router.push('/(admin)/faculty') },
    { icon: 'calendar-outline', iconBg: '#EAF8ED', iconColor: '#16A34A', label: 'Timetable\nManagement', onPress: () => router.push('/(admin)/timetable') },
    { icon: 'checkmark-circle-outline', iconBg: Colors.surfaceContainer, iconColor: Colors.primaryContainer, label: 'Attendance\nOverview', onPress: () => router.push('/(admin)/attendance') },
    { icon: 'analytics-outline', iconBg: Colors.warningContainer, iconColor: Colors.warning, label: 'Reports &\nAnalytics', onPress: () => router.push('/(admin)/reports') },
    { icon: 'notifications-outline', iconBg: '#FFF0F3', iconColor: Colors.danger, label: 'Notifications', badge: 3, onPress: () => router.push('/(admin)/audit-logs') },
    { icon: 'settings-outline', iconBg: Colors.surfaceContainerHigh, iconColor: Colors.onSurfaceVariant, label: 'Settings', onPress: () => router.push('/(admin)/settings') },
    { icon: 'shield-checkmark-outline', iconBg: Colors.tertiaryFixed, iconColor: Colors.tertiary, label: 'Audit Logs', onPress: () => router.push('/(admin)/audit-logs') },
    { icon: 'pulse-outline', iconBg: Colors.surfaceContainer, iconColor: Colors.primaryContainer, label: 'System\nStatus', onPress: () => router.push('/(admin)/academic-master') },
  ];

  // Split into 3×3 grid rows
  const rows = [quickModules.slice(0, 3), quickModules.slice(3, 6), quickModules.slice(6, 9)];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── App Bar ──────────────────────────────────────────────────── */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <SmartAttendLogo size={32} />
          <View>
            <Text style={styles.appBarBrand}>AutoMark</Text>
            <Text style={styles.appBarTitle}>Admin Dashboard</Text>
          </View>
        </View>
        <View style={styles.appBarRight}>
          <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => router.push('/(admin)/audit-logs')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.onSurfaceVariant} />
          </Pressable>
          <Pressable style={styles.avatarCircle} onPress={() => router.push('/(admin)/users')}>
            <Ionicons name="person" size={18} color={Colors.onPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ─────────────────────────────────────────────── */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetName}>Hello, Admin 👋</Text>
            <Text style={styles.greetSub}>AutoMark Institute • Super Admin</Text>
          </View>
          <View style={styles.notifWrap}>
            <Pressable style={styles.greetNotifBtn} hitSlop={8} onPress={() => router.push('/(admin)/audit-logs')}>
              <Ionicons name="notifications-outline" size={24} color={Colors.onSurface} />
            </Pressable>
            <View style={styles.notifDot} />
          </View>
        </View>

        {/* ── Overview Summary ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview Summary</Text>
            <Text style={styles.sectionMeta}>Updated live</Text>
          </View>
          <View style={styles.metricRow}>
            <MetricCard
              icon="people-outline" iconBg={`${Colors.tertiaryFixed}66`} iconColor={Colors.tertiary}
              label="Students" value={stats.totalStudents.toLocaleString()}
              onPress={() => router.push('/(admin)/students')}
            />
            <MetricCard
              icon="id-card-outline" iconBg="#EAF8ED" iconColor="#16A34A"
              label="Faculty" value={stats.totalFaculty.toString()}
              valueBg="#EAF8ED"
              onPress={() => router.push('/(admin)/faculty')}
            />
            <MetricCard
              icon="book-outline" iconBg="#FFF7E6" iconColor={Colors.warning}
              label="Active Classes" value={stats.activeSessionsToday.toString()}
              onPress={() => router.push('/(admin)/timetable')}
            />
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionMeta}>9 Modules</Text>
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.moduleRow}>
              {row.map((mod, mi) => (
                <QuickModule key={`${ri}-${mi}`} {...mod} />
              ))}
            </View>
          ))}
        </View>

        {/* ── Logout ──────────────────────────────────────────────── */}
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surfaceContainerLowest },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing['3xl'], gap: Spacing['2xl'],
  },

  appBar: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.marginMobile,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.outlineVariant,
    ...Shadow.sm,
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  appBarBrand: { ...Typography.labelXs, color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  appBarTitle: { ...Typography.titleSm, color: Colors.onSurface },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full },
  avatarCircle: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  greetRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: Spacing.md,
  },
  greetName: { ...Typography.headlineMd, color: Colors.onSurface, fontWeight: '700' },
  greetSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  notifWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  greetNotifBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: Radius.full,
    backgroundColor: Colors.error, borderWidth: 2, borderColor: Colors.surfaceContainerLowest,
  },

  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...Typography.titleSm, color: Colors.onSurface, fontWeight: '700' },
  sectionMeta: { ...Typography.labelXs, color: Colors.secondary, fontWeight: '500', letterSpacing: 0.5 },

  metricRow: { flexDirection: 'row', gap: Spacing.sm },

  moduleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.errorContainer,
  },
  logoutText: { ...Typography.labelLg, color: Colors.error },
});
