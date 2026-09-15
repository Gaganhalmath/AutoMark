/**
 * SmartAttend — All Checks Passed Ready to Mark Screen
 *
 * Real flow:
 * 1. Receive BLE session ID + RSSI
 * 2. Get logged-in student JWT
 * 3. Submit attendance to backend
 * 4. Backend validates student/session/enrollment/device
 * 5. Navigate to attendance marked screen
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'https://automark-backend-wput.onrender.com/api';
const formatTime = (value: string) => {
  if (!value) return '';

  // Handle ISO date returned by the backend
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Handle HH:mm values
  const [hourString, minute = '00'] = value.split(':');

  let hour = Number(hourString);

  if (Number.isNaN(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
};

export default function AllChecksPassedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { tokens } = useAuth();

  const sessionId = params.sessionId as string | undefined;
const rssi = params.rssi as string | undefined;

const subjectName =
  (params.subjectName as string) || 'Subject';

const subjectCode =
  (params.subjectCode as string) || '';

const room =
  (params.room as string) || 'Room not assigned';

const faculty =
  (params.faculty as string) || 'Faculty';

const scheduledStart =
  (params.scheduledStart as string) || '';

const scheduledEnd =
  (params.scheduledEnd as string) || '';

  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAttendance = async () => {
    if (submitting) {
      return;
    }

    if (!sessionId) {
      Alert.alert(
        'Attendance Error',
        'Attendance session information is missing.'
      );
      return;
    }

    if (!tokens?.accessToken) {
      Alert.alert(
        'Login Required',
        'Your student session has expired. Please login again.'
      );
      return;
    }

    try {
      setSubmitting(true);

      console.log(
        'SmartAttend: Submitting student BLE attendance'
      );

      console.log(
        'SmartAttend: Session ID =',
        sessionId
      );

      console.log(
        'SmartAttend: RSSI =',
        rssi
      );

      const response = await fetch(
        `${API_BASE_URL}/attendance/student/ble/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            sessionId: Number(sessionId),
            rssi: rssi ? Number(rssi) : null,
          }),
        }
      );

      const result = await response.json();

      console.log(
        'STUDENT BLE ATTENDANCE STATUS:',
        response.status
      );

      console.log(
        'STUDENT BLE ATTENDANCE RESPONSE:',
        result
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Unable to mark attendance.'
        );
      }

      console.log(
        'SmartAttend: Attendance marked successfully'
      );

      router.replace({
        pathname: '/(student)/attendance-marked',
        params: {
          sessionId: String(sessionId),
          attendanceId: String(
            result.data?.attendanceId || ''
          ),
        },
      });

    } catch (error) {
      console.error(
        'STUDENT BLE ATTENDANCE ERROR:',
        error
      );

      Alert.alert(
        'Attendance Failed',
        error instanceof Error
          ? error.message
          : 'Unable to mark attendance. Please try again.'
      );

      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIconCircle}>
          <Text style={styles.checkIcon}>✨</Text>
        </View>

        <Text style={styles.title}>
          Ready to Mark Attendance
        </Text>

        <Text style={styles.subtitle}>
          All security and location checks have passed
          successfully. Tap the button below to submit
          your attendance.
        </Text>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Subject
            </Text>

            <Text style={styles.detailValue}>
  {subjectName}
  {subjectCode ? ` (${subjectCode})` : ''}
</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Classroom
            </Text>

            <Text style={styles.detailValue}>
  {room}
</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Faculty
            </Text>

            <Text style={styles.detailValue}>
  {faculty}
</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Time Window
            </Text>

            <Text style={styles.detailValue}>
  {scheduledStart && scheduledEnd
    ? `${formatTime(scheduledStart)} - ${formatTime(scheduledEnd)}`
    : 'Time not available'}
</Text>
          </View>
        </View>

        {sessionId && (
          <Text
            style={{
              marginTop: 16,
              fontSize: 12,
              color: Colors.textSecondary,
            }}
          >
            Attendance Session: {sessionId}
          </Text>
        )}
      </View>

      <Pressable
        style={[
          styles.markBtn,
          submitting && styles.markBtnDisabled,
        ]}
        onPress={handleSubmitAttendance}
        disabled={submitting}
      >
        <Text style={styles.markBtnText}>
          {submitting
            ? 'Submitting Attendance...'
            : 'Confirm & Submit Attendance'}
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

  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  checkIcon: {
    fontSize: 48,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
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

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  markBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },

  markBtnDisabled: {
    opacity: 0.6,
  },

  markBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});