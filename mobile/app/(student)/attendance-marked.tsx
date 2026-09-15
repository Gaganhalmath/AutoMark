/**
 * SmartAttend — Attendance Marked Successfully Screen
 * Real attendance data from backend
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

type AttendanceRecord = {
  attendanceId: number;
  sessionId: number;
  date: string | null;
  markedAt: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  source: string | null;
  subject: {
    id: number | null;
    code: string | null;
    name: string | null;
  } | null;
};

export default function AttendanceMarkedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const attendanceId = params.attendanceId
    ? Number(params.attendanceId)
    : null;

  const sessionId = params.sessionId
    ? Number(params.sessionId)
    : null;

  const [attendance, setAttendance] =
    useState<AttendanceRecord | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendanceDetails = async () => {
      if (!tokens?.accessToken) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/student/attendance/history`,
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
          'ATTENDANCE MARKED HISTORY STATUS:',
          response.status,
        );

        console.log(
          'ATTENDANCE MARKED HISTORY RESPONSE:',
          result,
        );

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
            'Failed to load attendance details',
          );
        }

        const history: AttendanceRecord[] =
          result.data || [];

        let matchedRecord: AttendanceRecord | undefined;

        if (attendanceId) {
          matchedRecord = history.find(
            (item) =>
              item.attendanceId === attendanceId,
          );
        }

        if (!matchedRecord && sessionId) {
          matchedRecord = history.find(
            (item) =>
              item.sessionId === sessionId,
          );
        }

        if (!matchedRecord) {
          throw new Error(
            'Attendance record could not be found.',
          );
        }

        setAttendance(matchedRecord);
      } catch (err) {
        console.error(
          'ATTENDANCE MARKED DETAILS ERROR:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load attendance details.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceDetails();
  }, [
    tokens?.accessToken,
    attendanceId,
    sessionId,
  ]);

  const formatDateTime = (
    date: string | null,
  ) => {
    if (!date) {
      return 'Not available';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    const datePart = parsed.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );

    const timePart = parsed.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    return `${datePart}, ${timePart}`;
  };

  const getVerificationMethod = (
    source: string | null,
  ) => {
    if (source === 'BLE') {
      return 'Bluetooth Low Energy (BLE)';
    }

    if (source) {
      return source;
    }

    return 'Manual';
  };

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
        <View style={styles.errorCircle}>
          <Text style={styles.errorMark}>!</Text>
        </View>

        <Text style={styles.title}>
          Attendance Marked
        </Text>

        <Text style={styles.subtitle}>
          Your attendance was submitted successfully,
          but the receipt details could not be loaded.
        </Text>

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <Pressable
          style={styles.doneBtn}
          onPress={() =>
            router.replace('/(student)')
          }
        >
          <Text style={styles.doneBtnText}>
            Back to Home Dashboard
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>
            🎉
          </Text>
        </View>

        <Text style={styles.title}>
          Attendance Marked!
        </Text>

        <Text style={styles.subtitle}>
          Your attendance has been successfully
          recorded and verified by AutoMark.
        </Text>

        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>
              ATTENDANCE RECEIPT
            </Text>

            <Text style={styles.receiptId}>
              #{attendance.attendanceId}
            </Text>
          </View>

          <View style={styles.receiptDivider} />

          {/* Subject */}
          <View style={styles.receiptRow}>
            <Text style={styles.label}>
              Subject
            </Text>

            <View style={styles.valueContainer}>
              <Text style={styles.val}>
                {attendance.subject?.name ||
                  'Unknown Subject'}
              </Text>

              {attendance.subject?.code ? (
                <Text style={styles.codeText}>
                  {attendance.subject.code}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Date */}
          <View style={styles.receiptRow}>
            <Text style={styles.label}>
              Date & Time
            </Text>

            <Text style={styles.val}>
              {formatDateTime(
                attendance.markedAt ||
                attendance.date,
              )}
            </Text>
          </View>

          {/* Session */}
          <View style={styles.receiptRow}>
            <Text style={styles.label}>
              Session
            </Text>

            <Text style={styles.val}>
              #{attendance.sessionId}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.receiptRow}>
            <Text style={styles.label}>
              Status
            </Text>

            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {attendance.status}
              </Text>
            </View>
          </View>

          {/* Verification */}
          <View style={styles.receiptRow}>
            <Text style={styles.label}>
              Verification
            </Text>

            <Text style={styles.val}>
              {getVerificationMethod(
                attendance.source,
              )}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.doneBtn}
        onPress={() =>
          router.replace('/(student)')
        }
      >
        <Text style={styles.doneBtnText}>
          Back to Home Dashboard
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  checkMark: {
    fontSize: 48,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },

  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  receiptTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  receiptId: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },

  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
    gap: 12,
  },

  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    flexShrink: 0,
  },

  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },

  val: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },

  codeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  statusText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 11,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },

  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  errorMark: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.error,
  },

  errorText: {
    fontSize: 12,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },

  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});