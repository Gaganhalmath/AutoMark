/**
 * SmartAttend — Faculty Attendance Summary Screen
 * Real attendance data from backend
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';
import { apiRequest } from '../../services/api';

type AttendanceSummary = {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
};

type AttendanceSession = {
  sessionId: number;
  sessionDate: string;
  startedAt: string;
  endedAt: string | null;
  status: 'FINALIZED' | 'OPEN';

  class: {
    id: number | null;
    semester: number | null;
    section: string | null;
    academicYear: string | null;
  };

  subject: {
    id: number;
    code: string;
    name: string;
  } | null;

  attendance: AttendanceSummary;
};

export default function FacultyAttendanceScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAttendanceHistory = useCallback(async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('========================================');
      console.log('FACULTY ATTENDANCE SUMMARY');
      console.log('Fetching real attendance history...');
      console.log('========================================');

      const result = await apiRequest<{
        success: boolean;
        data: AttendanceSession[];
        message?: string;
      }>('/faculty/attendance/history', {
        method: 'GET',
        token: tokens.accessToken,
      });

      console.log('FACULTY ATTENDANCE HISTORY RESPONSE:', result);

      if (!result.success) {
        throw new Error(
          result.message || 'Failed to load attendance history',
        );
      }

      const receivedSessions = Array.isArray(result.data)
        ? result.data
        : [];

      setSessions(receivedSessions);
    } catch (err) {
      console.error('FACULTY ATTENDANCE SUMMARY ERROR:', err);

      setSessions([]);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load attendance history',
      );
    } finally {
      setLoading(false);
    }
  }, [tokens?.accessToken]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

  /*
   * Calculate overall attendance from actual session data.
   *
   * We use:
   *
   * Total attendance opportunities =
   * total enrolled students across sessions
   *
   * Present =
   * total students marked PRESENT across sessions
   *
   * This produces a real overall attendance percentage.
   */
  const totalSessions = sessions.length;

  const totalStudentsAcrossSessions = sessions.reduce(
    (sum, session) =>
      sum + (session.attendance?.totalStudents || 0),
    0,
  );

  const totalPresent = sessions.reduce(
    (sum, session) =>
      sum + (session.attendance?.present || 0),
    0,
  );

  const totalAbsent = sessions.reduce(
    (sum, session) =>
      sum + (session.attendance?.absent || 0),
    0,
  );

  const totalLate = sessions.reduce(
    (sum, session) =>
      sum + (session.attendance?.late || 0),
    0,
  );

  const averageAttendance =
    totalStudentsAcrossSessions > 0
      ? Math.round(
          (totalPresent / totalStudentsAcrossSessions) * 100,
        )
      : 0;

  /*
   * For now "Late / Exceptions" represents late attendance
   * records because the current history API does not expose
   * a separate exception count.
   */
  const exceptions = totalLate;

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Unknown date';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAttendanceRate = (
    session: AttendanceSession,
  ) => {
    const total = session.attendance?.totalStudents || 0;
    const present = session.attendance?.present || 0;

    if (total === 0) {
      return 0;
    }

    return Math.round((present / total) * 100);
  };

  const getStatusText = (
    session: AttendanceSession,
  ) => {
    if (session.status === 'FINALIZED') {
      return 'Finalized';
    }

    return 'Open';
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>
            Attendance Summary
          </Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading attendance summary...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>
          Attendance Summary
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ERROR */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Unable to Load Attendance
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryBtn}
              onPress={fetchAttendanceHistory}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* SUMMARY CARD */}
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>
                Faculty Overview
              </Text>

              <View style={styles.bannerGrid}>
                <View style={styles.metric}>
                  <Text style={styles.metricVal}>
                    {averageAttendance}%
                  </Text>

                  <Text style={styles.metricSub}>
                    Avg Attendance
                  </Text>
                </View>

                <View style={styles.metric}>
                  <Text style={styles.metricVal}>
                    {totalSessions}
                  </Text>

                  <Text style={styles.metricSub}>
                    Sessions Held
                  </Text>
                </View>

                <View style={styles.metric}>
                  <Text
                    style={[
                      styles.metricVal,
                      {
                        color:
                          exceptions > 0
                            ? Colors.warning
                            : Colors.success,
                      },
                    ]}
                  >
                    {exceptions}
                  </Text>

                  <Text style={styles.metricSub}>
                    Late / Exceptions
                  </Text>
                </View>
              </View>
            </View>

            {/* OVERALL INFORMATION */}
            {sessions.length > 0 && (
              <View style={styles.overallCard}>
                <View style={styles.overallRow}>
                  <Text style={styles.overallLabel}>
                    Students Recorded
                  </Text>

                  <Text style={styles.overallValue}>
                    {totalStudentsAcrossSessions}
                  </Text>
                </View>

                <View style={styles.overallRow}>
                  <Text style={styles.overallLabel}>
                    Present Records
                  </Text>

                  <Text
                    style={[
                      styles.overallValue,
                      { color: Colors.success },
                    ]}
                  >
                    {totalPresent}
                  </Text>
                </View>

                <View style={styles.overallRow}>
                  <Text style={styles.overallLabel}>
                    Absent Records
                  </Text>

                  <Text
                    style={[
                      styles.overallValue,
                      { color: Colors.error },
                    ]}
                  >
                    {totalAbsent}
                  </Text>
                </View>

                <View style={styles.overallRow}>
                  <Text style={styles.overallLabel}>
                    Late Records
                  </Text>

                  <Text
                    style={[
                      styles.overallValue,
                      { color: Colors.warning },
                    ]}
                  >
                    {totalLate}
                  </Text>
                </View>
              </View>
            )}

            {/* SESSIONS */}
            <Text style={styles.sectionTitle}>
              Recent Conducted Sessions
            </Text>

            {sessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No Attendance Sessions
                </Text>

                <Text style={styles.emptyText}>
                  Attendance sessions conducted by you
                  will appear here.
                </Text>
              </View>
            ) : (
              sessions.map((session) => {
                const rate =
                  getAttendanceRate(session);

                return (
                  <View
                    key={session.sessionId}
                    style={styles.card}
                  >
                    {/* TOP */}
                    <View style={styles.cardTop}>
                      <View style={styles.subjectInfo}>
                        <Text
                          style={styles.subjectName}
                        >
                          {session.subject?.name ||
                            'Unknown Subject'}
                        </Text>

                        <Text
                          style={styles.subjectCode}
                        >
                          {session.subject?.code ||
                            'N/A'}
                          {' • '}
                          {session.class?.section ||
                            'N/A'}
                          {' • Sem '}
                          {session.class?.semester ??
                            'N/A'}
                        </Text>
                      </View>

                      <View style={styles.ratePill}>
                        <Text style={styles.rateText}>
                          {rate}%
                        </Text>
                      </View>
                    </View>

                    {/* STATUS */}
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>
                        Status
                      </Text>

                      <Text
                        style={[
                          styles.statusValue,
                          session.status ===
                            'FINALIZED'
                            ? styles.finalizedStatus
                            : styles.openStatus,
                        ]}
                      >
                        {getStatusText(session)}
                      </Text>
                    </View>

                    {/* PROGRESS */}
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              Math.max(rate, 0),
                              100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>

                    {/* META */}
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>
                        Date:{' '}
                        {formatDate(
                          session.sessionDate,
                        )}
                      </Text>

                      <Text style={styles.metaLabel}>
                        Present:{' '}
                        {session.attendance?.present ||
                          0}{' '}
                        /{' '}
                        {session.attendance
                          ?.totalStudents || 0}
                      </Text>
                    </View>

                    {/* LATE / ABSENT */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText}>
                        Absent:{' '}
                        {session.attendance?.absent ||
                          0}
                      </Text>

                      <Text style={styles.detailText}>
                        Late:{' '}
                        {session.attendance?.late ||
                          0}
                      </Text>
                    </View>

                    {/* REVIEW */}
                    <View style={styles.btnRow}>
                      <Pressable
                        style={styles.reviewBtn}
                        onPress={() =>
                          router.push({
                            pathname:
                              '/(faculty)/attendance-review',
                            params: {
                              sessionId:
                                String(
                                  session.sessionId,
                                ),
                            },
                          })
                        }
                      >
                        <Text
                          style={styles.reviewBtnText}
                        >
                          Review Attendance
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  appBar: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  appBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 30,
  },

  banner: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
  },

  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  bannerGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
  },

  metric: {
    flex: 1,
    alignItems: 'center',
  },

  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  metricSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
  },

  overallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },

  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  overallLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  overallValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    gap: 12,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  subjectInfo: {
    flex: 1,
    paddingRight: 10,
  },

  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  subjectCode: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  ratePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  rateText: {
    color: Colors.success,
    fontWeight: '800',
    fontSize: 13,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  statusValue: {
    fontSize: 12,
    fontWeight: '800',
  },

  finalizedStatus: {
    color: Colors.success,
  },

  openStatus: {
    color: Colors.warning,
  },

  progressBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  btnRow: {
    marginTop: 4,
  },

  reviewBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  reviewBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },

  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },

  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.error,
  },

  errorText: {
    marginTop: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});