/**
 * SmartAttend — Student Profile
 */

import React from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';
import { getStudentProfile } from '../../api/client';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { logout, tokens } = useAuth();

  const [student, setStudent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = async (isRefresh = false) => {
    if (!tokens?.accessToken) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const studentData = await getStudentProfile(
        tokens.accessToken
      );

      console.log(
        'PROFILE DATA:',
        JSON.stringify(studentData)
      );

      if (!studentData) {
        throw new Error(
          'Student data missing from profile response'
        );
      }

      setStudent(studentData);
    } catch (err: any) {
      console.log('PROFILE API ERROR:', err);
      setError(err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadProfile();
  }, [tokens?.accessToken]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.message}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.error}
          />

          <Text style={styles.errorTitle}>
            Unable to load profile
          </Text>

          <Text style={styles.errorMessage}>
            {error}
          </Text>

          <Pressable
            style={styles.logoutButton}
            onPress={logout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.error}
            />

            <Text style={styles.logoutText}>
              Sign Out (Testing)
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.message}>
            No student profile data found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            colors={[Colors.primaryContainer]}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={40}
              color={Colors.onPrimary}
            />
          </View>

          <Text style={styles.name}>
            {student.name}
          </Text>

          <Text style={styles.usn}>
            {student.registerNumber}
          </Text>

          <View style={styles.pill}>
            <Text style={styles.pillText}>
              {student.department} • Sem {student.semester}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <ProfileRow
            label="Semester"
            value={`Semester ${student.semester}`}
          />

          <ProfileRow
            label="Section"
            value={`Section ${student.section}`}
          />

          <ProfileRow
            label="Account"
            value="ACTIVE"
          />

          <ProfileRow
            label="Device"
            value={
              student.deviceRegistered
                ? 'Registered'
                : 'Not Registered'
            }
          />

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/(student)/device-registration'
              )
            }
            style={styles.deviceButton}
          >
            <Text style={styles.deviceButtonText}>
              Test Device Registration
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.error}
          />

          <Text style={styles.logoutText}>
            Sign Out (Testing)
          </Text>
        </Pressable>

        <Text style={styles.noLogout}>
          🔒 Student hardware binding active on this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  label: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },

  value: {
    ...Typography.labelLg,
    color: Colors.onSurface,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  message: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  errorTitle: {
    ...Typography.titleSm,
    color: Colors.error,
    marginTop: 12,
  },

  errorMessage: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
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
    flex: 1,
    paddingHorizontal: Spacing.marginMobile,
  },

  contentContainer: {
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
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

  usn: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },

  pill: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },

  pillText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: '600',
  },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
  },

  deviceButton: {
    marginTop: 20,
    marginBottom: 14,
  },

  deviceButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: 8,
  },

  logoutText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },

  noLogout: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});