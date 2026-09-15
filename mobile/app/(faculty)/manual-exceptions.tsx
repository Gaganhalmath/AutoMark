/**
 * SmartAttend — Manual Exceptions Screen
 * Real backend implementation
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

type Participant = {
  studentId: number;
  registerNumber: string | null;
  name: string | null;
  email: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  source: 'BLE' | 'MANUAL' | null;
  attendanceId: number | null;
};

export default function ManualExceptionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const sessionId = params.sessionId as string | undefined;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState('');

  const fetchParticipants = useCallback(async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    if (!sessionId) {
      setError('Session ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/attendance/sessions/${sessionId}/participants`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

      console.log('MANUAL EXCEPTIONS STATUS:', response.status);
      console.log('MANUAL EXCEPTIONS RESPONSE:', result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to load session participants',
        );
      }

      setParticipants(result.data?.participants || []);
    } catch (err) {
      console.error('MANUAL EXCEPTIONS ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load session participants',
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, tokens?.accessToken]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleMarkPresent = async (student: Participant) => {
    if (!tokens?.accessToken || !sessionId) {
      Alert.alert('Error', 'Authentication or session information is missing.');
      return;
    }

    const reason =
      reasons[student.studentId]?.trim() || 'Manual faculty override';

    try {
      setUpdatingStudentId(student.studentId);

      let response: Response;

      // --------------------------------------------------
      // Existing attendance record → UPDATE it
      // --------------------------------------------------

      if (student.attendanceId) {
        response = await fetch(
          `${API_BASE_URL}/attendance/${student.attendanceId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
            body: JSON.stringify({
              status: 'PRESENT',
              reason,
            }),
          },
        );
      }

      // --------------------------------------------------
      // No attendance record yet → CREATE MANUAL record
      // --------------------------------------------------

      else {
        response = await fetch(`${API_BASE_URL}/attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            sessionId: Number(sessionId),
            studentId: student.studentId,
            status: 'PRESENT',
            source: 'MANUAL',
          }),
        });
      }

      const result = await response.json();

      console.log('MANUAL ATTENDANCE UPDATE STATUS:', response.status);
      console.log('MANUAL ATTENDANCE UPDATE RESPONSE:', result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to update attendance',
        );
      }

      Alert.alert(
        'Attendance Updated',
        `${student.name || student.registerNumber || 'Student'} has been marked Present.`,
      );

      await fetchParticipants();
    } catch (err) {
      console.error('MANUAL ATTENDANCE UPDATE ERROR:', err);

      Alert.alert(
        'Update Failed',
        err instanceof Error
          ? err.message
          : 'Failed to update attendance',
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleKeepAbsent = (student: Participant) => {
    Alert.alert(
      'Keep Absent',
      `${student.name || student.registerNumber || 'Student'} will remain absent.`,
      [{ text: 'OK' }],
    );
  };

  const absentStudents = participants.filter(
    (student) => student.status === 'ABSENT',
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Manual Exception Override</Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Loading attendance records...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              style={styles.retryBtn}
              onPress={fetchParticipants}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : !sessionId ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>
              Session ID is missing.
            </Text>
          </View>
        ) : absentStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No Manual Exceptions
            </Text>

            <Text style={styles.emptyText}>
              There are currently no absent students requiring a manual
              attendance override.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                {absentStudents.length} student
                {absentStudents.length !== 1 ? 's' : ''} currently absent
              </Text>

              <Text style={styles.infoText}>
                Review the students below and manually mark Present if the
                faculty has verified their attendance.
              </Text>
            </View>

            {absentStudents.map((student) => {
              const isUpdating =
                updatingStudentId === student.studentId;

              return (
                <View
                  key={student.studentId}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(student.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.headerTextCol}>
                      <Text style={styles.studentName}>
                        {student.name || 'Unknown Student'}
                      </Text>

                      <Text style={styles.studentUsn}>
                        {student.registerNumber || 'Register number unavailable'}
                      </Text>
                    </View>

                    <View style={styles.statusTag}>
                      <Text style={styles.statusText}>
                        ABSENT
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>
                      Verification Reason
                    </Text>

                    <TextInput
                      value={reasons[student.studentId] || ''}
                      onChangeText={(text) =>
                        setReasons((prev) => ({
                          ...prev,
                          [student.studentId]: text,
                        }))
                      }
                      placeholder="Enter reason for manual override"
                      placeholderTextColor={Colors.textSecondary}
                      style={styles.reasonInput}
                      multiline
                    />
                  </View>

                  <View style={styles.btnRow}>
                    <Pressable
                      style={[
                        styles.approveBtn,
                        isUpdating && styles.disabledBtn,
                      ]}
                      disabled={isUpdating}
                      onPress={() => handleMarkPresent(student)}
                    >
                      {isUpdating ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <Text style={styles.approveBtnText}>
                          Mark Present
                        </Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.rejectBtn}
                      disabled={isUpdating}
                      onPress={() => handleKeepAbsent(student)}
                    >
                      <Text style={styles.rejectBtnText}>
                        Keep Absent
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },

  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: Colors.textSecondary,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },

  headerTextCol: {
    flex: 1,
  },

  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  studentUsn: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },

  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  reasonLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },

  reasonInput: {
    minHeight: 45,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  approveBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  rejectBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});