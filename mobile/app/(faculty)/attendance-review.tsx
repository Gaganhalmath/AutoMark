/**
 * SmartAttend — Attendance Review Screen
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

type Participant = {
  studentId: number;
  registerNumber: string;
  name: string;
  email: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  source: string | null;
  attendanceId: number | null;
};

export default function AttendanceReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const sessionId = params.sessionId as string | undefined;

  console.log('REVIEW SCREEN SESSION ID:', sessionId);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchParticipants = async () => {

    console.log('ATTENDANCE REVIEW PARAMS:', params);
console.log('ATTENDANCE REVIEW SESSION ID:', sessionId);
console.log('ATTENDANCE REVIEW TOKEN EXISTS:', !!tokens?.accessToken);

    if (!sessionId || !tokens?.accessToken) {
      setError('Session information is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `https://automark-u7nr.onrender.com/api/attendance/sessions/${sessionId}/participants`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

console.log('ATTENDANCE REVIEW HTTP STATUS:', response.status);
console.log('ATTENDANCE REVIEW SESSION ID:', sessionId);
console.log('ATTENDANCE REVIEW RESPONSE:', result);

if (!response.ok || !result.success) {
  throw new Error(
    result.message || 'Failed to load attendance data',
  );
}

      setParticipants(result.data.participants || []);
    } catch (err) {
      console.error('Attendance review error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load attendance data',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [sessionId, tokens?.accessToken]);

  const total = participants.length;

  const present = participants.filter(
    (student) => student.status === 'PRESENT',
  ).length;

  const absent = participants.filter(
    (student) => student.status === 'ABSENT',
  ).length;

  const late = participants.filter(
    (student) => student.status === 'LATE',
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Session Summary Review</Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardSubject}>
            Attendance Session
          </Text>

          <Text style={styles.cardMeta}>
            Session ID: {sessionId || 'Unknown'}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                Loading attendance...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                style={styles.retryBtn}
                onPress={fetchParticipants}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.gridBox}>
                  <Text style={styles.gridNum}>{total}</Text>
                  <Text style={styles.gridLabel}>Total</Text>
                </View>

                <View style={styles.gridBox}>
                  <Text
                    style={[
                      styles.gridNum,
                      { color: Colors.success },
                    ]}
                  >
                    {present}
                  </Text>
                  <Text style={styles.gridLabel}>Present</Text>
                </View>

                <View style={styles.gridBox}>
                  <Text
                    style={[
                      styles.gridNum,
                      { color: Colors.error },
                    ]}
                  >
                    {absent}
                  </Text>
                  <Text style={styles.gridLabel}>Absent</Text>
                </View>

                <View style={styles.gridBox}>
                  <Text
                    style={[
                      styles.gridNum,
                      { color: Colors.warning },
                    ]}
                  >
                    {late}
                  </Text>
                  <Text style={styles.gridLabel}>Late</Text>
                </View>
              </View>

              <View style={styles.studentList}>
                <Text style={styles.listTitle}>
                  Attendance Details
                </Text>

                {participants.map((student) => (
                  <View
                    key={student.studentId}
                    style={styles.studentRow}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {student.name}
                      </Text>

                      <Text style={styles.studentRegister}>
                        {student.registerNumber}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.status,
                        student.status === 'PRESENT' &&
                          styles.presentStatus,
                        student.status === 'ABSENT' &&
                          styles.absentStatus,
                        student.status === 'LATE' &&
                          styles.lateStatus,
                      ]}
                    >
                      {student.status}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {!loading && !error && (
          <View style={styles.actionCard}>
            <Text style={styles.sectionHeader}>
              Manual Verification
            </Text>

            <Text style={styles.sectionSub}>
              Review attendance details before submitting the
              final attendance ledger.
            </Text>

            <Pressable
              style={styles.exceptionBtn}
              onPress={() =>
                router.push({
                  pathname: '/(faculty)/manual-exceptions',
                  params: {
                    sessionId: String(sessionId),
                  },
                })
              }
            >
              <Text style={styles.exceptionBtnText}>
                ✏️ Review Manual Exceptions
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Pressable
        style={[
          styles.finalizeBtn,
          (loading || !!error) && styles.disabledBtn,
        ]}
        disabled={loading || !!error}
        onPress={() =>
          router.push({
            pathname: '/(faculty)/finalize-attendance',
            params: {
              sessionId: String(sessionId),
            },
          })
        }
      >
        <Text style={styles.finalizeBtnText}>
          Finalize & Submit Ledger
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

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },

  cardSubject: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  cardMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  gridBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  gridNum: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  gridLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
  },

  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },

  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  studentList: {
    marginTop: 20,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  studentRegister: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  status: {
    fontSize: 12,
    fontWeight: '800',
  },

  presentStatus: {
    color: Colors.success,
  },

  absentStatus: {
    color: Colors.error,
  },

  lateStatus: {
    color: Colors.warning,
  },

  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  sectionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },

  exceptionBtn: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  exceptionBtnText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 14,
  },

  finalizeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
    elevation: 4,
  },

  disabledBtn: {
    opacity: 0.5,
  },

  finalizeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
