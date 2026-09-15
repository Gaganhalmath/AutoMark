/**
 * SmartAttend — Attendance History Detail Screen
 * Real backend attendance detail
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

import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

type AttendanceDetail = {
  attendanceId: number;
  sessionId: number;

  status: string;
  source: string | null;

  date: string | null;
  startedAt: string | null;
  endedAt: string | null;
  markedAt: string | null;

  subject: {
    id: number | null;
    code: string | null;
    name: string | null;
  } | null;

  class: {
    id: number | null;
    semester: number | null;
    section: string | null;
    academicYear: string | null;
  } | null;

  faculty: string | null;

  timetable: {
    id: number;
    dayOfWeek: number;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
  } | null;

  verification: {
    rssi: number | null;
    gps: string | null;
    device: string | null;
  };
};

export default function AttendanceHistoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const [attendance, setAttendance] =
    useState<AttendanceDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const attendanceId = Array.isArray(params.attendanceId)
    ? params.attendanceId[0]
    : params.attendanceId;

  const formatDate = (value: string | null) => {
    if (!value) return 'Not recorded';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (value: string | null) => {
    if (!value) return 'Not recorded';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeSlot = () => {
    if (!attendance?.timetable) {
      return 'Not recorded';
    }

    const start = attendance.timetable.startTime;
    const end = attendance.timetable.endTime;

    if (!start && !end) {
      return 'Not recorded';
    }

    return `${formatClockTime(start)} - ${formatClockTime(end)}`;
  };

  const formatClockTime = (value: string | null) => {
    if (!value) return '--';

    const parts = value.split(':');

    if (parts.length < 2) {
      return value;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    if (Number.isNaN(hour)) {
      return value;
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minute} ${suffix}`;
  };

  const fetchAttendanceDetail = async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    if (!attendanceId) {
      setError('Attendance record ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/student/attendance/history/${attendanceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

      console.log(
        'STUDENT ATTENDANCE DETAIL STATUS:',
        response.status,
      );

      console.log(
        'STUDENT ATTENDANCE DETAIL RESPONSE:',
        result,
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to load attendance details',
        );
      }

      setAttendance(result.data);
    } catch (err) {
      console.error(
        'STUDENT ATTENDANCE DETAIL ERROR:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load attendance details',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceDetail();
  }, [tokens?.accessToken, attendanceId]);

  const status = attendance?.status || 'UNKNOWN';

  const isPresent = status === 'PRESENT';
  const isLate = status === 'LATE';

  const statusBackground = isPresent
    ? '#F0FDF4'
    : isLate
      ? '#FFFBEB'
      : '#FEF2F2';

  const statusBorder = isPresent
    ? '#BBF7D0'
    : isLate
      ? '#FDE68A'
      : '#FECACA';

  const badgeBackground = isPresent
    ? '#DCFCE7'
    : isLate
      ? '#FEF3C7'
      : '#FEE2E2';

  const badgeTextColor = isPresent
    ? Colors.success
    : isLate
      ? '#D97706'
      : Colors.error;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading attendance details...
        </Text>
      </View>
    );
  }

  if (error || !attendance) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Unable to load attendance
        </Text>

        <Text style={styles.errorText}>
          {error || 'Attendance record not found.'}
        </Text>

        <Pressable
          style={styles.retryBtn}
          onPress={fetchAttendanceDetail}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </Pressable>

        <Pressable
          style={styles.backErrorBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backErrorText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

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
          Session Audit Log
        </Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: statusBackground,
              borderColor: statusBorder,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: badgeBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: badgeTextColor },
                ]}
              >
                {status}
              </Text>
            </View>

            <Text style={styles.sessionId}>
              ID: {attendance.attendanceId}
            </Text>
          </View>

          <Text style={styles.subjectName}>
            {attendance.subject?.name ||
              'Unknown Subject'}
          </Text>

          <Text style={styles.subjectCode}>
            {attendance.subject?.code ||
              'No subject code'}
          </Text>
        </View>

        {/* Class Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Class Information
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Date
            </Text>

            <Text style={styles.val}>
              {formatDate(attendance.date)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Time Slot
            </Text>

            <Text style={styles.val}>
              {formatTimeSlot()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Faculty
            </Text>

            <Text style={styles.val}>
              {attendance.faculty ||
                'Not recorded'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Room / Venue
            </Text>

            <Text style={styles.val}>
              {attendance.timetable?.room ||
                'Not recorded'}
            </Text>
          </View>
        </View>

        {/* Attendance Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Attendance Information
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Attendance ID
            </Text>

            <Text style={styles.val}>
              #{attendance.attendanceId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Session ID
            </Text>

            <Text style={styles.val}>
              #{attendance.sessionId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Source
            </Text>

            <Text style={styles.val}>
              {attendance.source || 'Manual'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Marked At
            </Text>

            <Text style={styles.val}>
              {formatTime(attendance.markedAt)}
            </Text>
          </View>
        </View>

        {/* Technical Verification */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Technical Verification
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              BLE Signal RSSI
            </Text>

            <Text style={styles.val}>
              {attendance.verification?.rssi !== null &&
              attendance.verification?.rssi !== undefined
                ? `${attendance.verification.rssi} dBm`
                : 'Not recorded'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              GPS Coordinates
            </Text>

            <Text style={styles.val}>
              {attendance.verification?.gps ||
                'Not recorded'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Registered Device
            </Text>

            <Text style={styles.val}>
              {attendance.verification?.device ||
                'Registered device'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Verification Time
            </Text>

            <Text style={styles.val}>
              {formatTime(attendance.markedAt)}
            </Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>
            Verification Note
          </Text>

          <Text style={styles.noteText}>
            Technical values are displayed only when
            they were recorded during attendance
            verification. Unavailable values are not
            generated or estimated.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginBottom: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  backErrorBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  backErrorText: {
    color: Colors.primary,
    fontWeight: '600',
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

  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },

  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  badgeText: {
    fontWeight: '800',
    fontSize: 12,
  },

  sessionId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  subjectName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  subjectCode: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 20,
  },

  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },

  val: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  noteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 0,
  },

  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },

  noteText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
});