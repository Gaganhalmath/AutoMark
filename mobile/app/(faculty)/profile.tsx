/**
 * SmartAttend — Faculty Profile
 * Uses real authenticated faculty data from the backend.
 * No mock data.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';
import { apiRequest } from '../../services/api';

interface FacultyProfile {
  id: number;
  employeeId: string;
  name: string | null;
  email: string | null;
  department: string | null;
  departmentCode: string | null;
  totalClasses: number;
}

export default function FacultyProfileScreen() {
  const { tokens, logout } = useAuth();

  const [profile, setProfile] =
    useState<FacultyProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [tokens?.accessToken]);

  const loadProfile = async () => {
    if (!tokens?.accessToken) {
      setLoading(false);
      setError('Authentication token is unavailable.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest<{
  success: boolean;
  message?: string;
  data: FacultyProfile;
}>(
  '/faculty/dashboard',
  {
    method: 'GET',
    token: tokens.accessToken,
  },
);

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message ||
            'Failed to load faculty profile.',
        );
      }

      setProfile(response.data);
    } catch (err: any) {
      console.error(
        'FACULTY PROFILE ERROR:',
        err,
      );

      setError(
        err?.message ||
          'Unable to load faculty profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safe}
        edges={['top']}
      >
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>
            Profile
          </Text>
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primaryContainer}
          />

          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView
        style={styles.safe}
        edges={['top']}
      >
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>
            Profile
          </Text>
        </View>

        <View style={styles.centerContainer}>
          <Ionicons
            name="person-circle-outline"
            size={64}
            color={Colors.onSurfaceVariant}
          />

          <Text style={styles.errorTitle}>
            Unable to load profile
          </Text>

          <Text style={styles.errorText}>
            {error ||
              'Faculty profile information is unavailable.'}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadProfile}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const name = profile.name || 'Faculty';
  const email = profile.email || '-';
  const employeeId = profile.employeeId || '-';
  const department = profile.department || '-';
  const departmentCode = profile.departmentCode || '';

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top']}
    >
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={40}
              color={Colors.onPrimary}
            />
          </View>

          <Text style={styles.name}>
            {name}
          </Text>

          <Text style={styles.id}>
            {employeeId}
            {department
              ? ` • ${department}`
              : ''}
          </Text>
        </View>

        {/* Faculty Information */}
        <View style={styles.card}>
          <ProfileRow
            label="Name"
            value={name}
          />

          <ProfileRow
            label="Email"
            value={email}
          />

          <ProfileRow
            label="Employee ID"
            value={employeeId}
          />

          <ProfileRow
            label="Department"
            value={
              departmentCode
                ? `${department} (${departmentCode})`
                : department
            }
          />

          <ProfileRow
            label="Assigned Classes"
            value={String(profile.totalClasses)}
          />

          <ProfileRow
            label="Role"
            value="FACULTY"
            last
          />
        </View>

        {/* Account Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={Colors.primaryContainer}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Account Status
            </Text>

            <Text style={styles.statusValue}>
              ACTIVE
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <Pressable
          style={styles.logoutBtn}
          onPress={logout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.error}
          />

          <Text style={styles.logoutText}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        last && styles.lastRow,
      ]}
    >
      <Text style={styles.rowLabel}>
        {label}
      </Text>

      <Text
        style={styles.rowValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  appBar: {
    height: 64,
    paddingHorizontal: Spacing.marginMobile,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },

  appBarTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },

  content: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },

  avatarWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },

  id: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  rowLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },

  rowValue: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    flex: 2,
    textAlign: 'right',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },

  statusValue: {
    ...Typography.labelLg,
    color: Colors.primaryContainer,
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.errorContainer,
  },

  logoutText: {
    ...Typography.labelLg,
    color: Colors.error,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },

  loadingText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
  },

  errorTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    marginTop: Spacing.sm,
  },

  errorText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryContainer,
  },

  retryText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
  },
});