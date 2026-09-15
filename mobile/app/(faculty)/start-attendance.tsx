/**
 * SmartAttend — Start Attendance Screen
 * Real class data from backend
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { Colors } from '../../constants/colors';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

type FacultyTimetableItem = {
  id: number | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  classId: number;
  semester?: number | null;
  section?: string | null;
  academicYear?: string | null;
  subject?: {
    id?: number;
    code?: string;
    name?: string;
  } | null;
};

const formatTime = (time: string) => {
  if (!time) return '';

  const [hourString, minuteString = '00'] =
    time.split(':');

  let hour = Number(hourString);

  const suffix = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${minuteString} ${suffix}`;
};

export default function StartAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const classId = params.id
    ? Number(params.id)
    : null;

  const [classData, setClassData] =
    useState<FacultyTimetableItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [duration, setDuration] = useState(15);
  const [requireGeofence, setRequireGeofence] =
    useState(true);
  const [requireBLE, setRequireBLE] =
    useState(true);

  useEffect(() => {
    const loadClass = async () => {
      if (!tokens?.accessToken) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      if (!classId) {
        setError('Class ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/faculty/timetable`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result?.message ||
              'Failed to load class information',
          );
        }

        const timetable: FacultyTimetableItem[] =
          result.data || [];

        const foundClass = timetable.find(
          (item) =>
            Number(item.classId) === Number(classId),
        );

        if (!foundClass) {
          throw new Error(
            'Class was not found in your timetable.',
          );
        }

        setClassData(foundClass);
      } catch (err) {
        console.error(
          'START ATTENDANCE CLASS ERROR:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load class information.',
        );
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [tokens?.accessToken, classId]);

  const handleStartSession = async () => {
    try {
      if (!tokens?.accessToken) {
        throw new Error(
          'No authentication token available',
        );
      }

      if (!classData?.classId) {
        throw new Error(
          'Class information is not available',
        );
      }

      console.log(
        'START SESSION CLASS ID:',
        classData.classId,
      );

      const response = await fetch(
        `${API_BASE_URL}/attendance/sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            classId: Number(classData.classId),
          }),
        },
      );

      const result = await response.json();

      console.log(
        'START SESSION STATUS:',
        response.status,
      );

      console.log(
        'START SESSION RESPONSE:',
        result,
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result?.message ||
            'Failed to create attendance session',
        );
      }

      const sessionId = result.data.id;

      router.replace({
        pathname: '/(faculty)/ble-session',
        params: {
          durationMinutes:
            duration.toString(),

          sessionId:
            sessionId.toString(),

          classId:
            classData.classId.toString(),
        },
      });
    } catch (error) {
      console.error(
        'START SESSION ERROR:',
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to start attendance session.',
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading class information...
        </Text>
      </View>
    );
  }

  if (error || !classData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Unable to load class
        </Text>

        <Text style={styles.errorText}>
          {error ||
            'Class information is unavailable.'}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const subjectName =
    classData.subject?.name || 'Subject';

  const subjectCode =
    classData.subject?.code || '-';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Configure Session
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Actual Class */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {subjectName}
          </Text>

          <Text style={styles.subjectCode}>
            {subjectCode}
          </Text>

          <Text style={styles.cardSub}>
            Section {classData.section || '-'} •
            Semester {classData.semester || '-'}
          </Text>

          <Text style={styles.cardSub}>
            {classData.room ||
              'Room not assigned'} •{' '}
            {formatTime(classData.startTime)} -{' '}
            {formatTime(classData.endTime)}
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Session Duration
          </Text>

          <View style={styles.durationRow}>
            {[5, 10, 15, 20, 30].map((mins) => (
              <Pressable
                key={mins}
                style={[
                  styles.durationChip,
                  duration === mins &&
                    styles.durationChipActive,
                ]}
                onPress={() =>
                  setDuration(mins)
                }
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === mins &&
                      styles.durationTextActive,
                  ]}
                >
                  {mins} min
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Validation Security
          </Text>

          <Pressable
            style={styles.toggleRow}
            onPress={() =>
              setRequireBLE(!requireBLE)
            }
          >
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>
                BLE Beacon Broadcasting
              </Text>

              <Text style={styles.toggleDesc}>
                Broadcast Bluetooth low-energy
                packet from faculty device
              </Text>
            </View>

            <Text style={styles.toggleIcon}>
              {requireBLE
                ? '🟢 ON'
                : '⚪ OFF'}
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.toggleRow}
            onPress={() =>
              setRequireGeofence(
                !requireGeofence,
              )
            }
          >
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>
                GPS Classroom Geofence
              </Text>

              <Text style={styles.toggleDesc}>
                Enforce classroom location
                validation
              </Text>
            </View>

            <Text style={styles.toggleIcon}>
              {requireGeofence
                ? '🟢 ON'
                : '⚪ OFF'}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Start */}
      <Pressable
        style={styles.startBtn}
        onPress={handleStartSession}
      >
        <Text style={styles.startBtnText}>
          Start Live Attendance Window
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },

  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  backButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backBtn: {
    padding: 8,
  },

  backText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  headerSpacer: {
    width: 60,
  },

  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  subjectCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 5,
  },

  cardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  section: {
    gap: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },

  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },

  durationChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  durationTextActive: {
    color: '#FFFFFF',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
  },

  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },

  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  toggleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  toggleIcon: {
    fontSize: 13,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },

  errorBoxText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },

  startBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
    elevation: 4,
  },

  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});