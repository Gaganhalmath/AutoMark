/**
 * SmartAttend — Faculty History Screen
 *
 * Uses the real backend response from:
 * GET /api/faculty/attendance/history
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
import { useRouter } from 'expo-router';

import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'https://automark-backend-wput.onrender.com/api';

type Session = {
  sessionId: number;
  sessionDate?: string;
  startedAt?: string;
  endedAt?: string | null;
  status?: string;

  class?: {
    id: number;
    semester?: number;
    section?: string;
    academicYear?: string;
  } | null;

  subject?: {
    id: number;
    code: string;
    name: string;
  } | null;

  attendance?: {
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
  } | null;
};

export default function FacultyHistoryScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [filter, setFilter] = useState<
    'all' | 'completed' | 'expired'
  >('all');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/faculty/attendance/history`,
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
        'FACULTY HISTORY STATUS:',
        response.status,
      );

      console.log(
        'FACULTY HISTORY RESPONSE:',
        JSON.stringify(result, null, 2),
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to load attendance history',
        );
      }

      const historyData = Array.isArray(result.data)
        ? result.data
        : result.data?.sessions || [];

      setSessions(historyData);
    } catch (err) {
      console.error(
        'FACULTY HISTORY ERROR:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load attendance history',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [tokens?.accessToken]);

  /**
   * Filter sessions
   */
  const filteredSessions = sessions.filter(
    (session) => {
      if (filter === 'completed') {
        return !!session.endedAt;
      }

      if (filter === 'expired') {
        return !session.endedAt;
      }

      return true;
    },
  );

  /**
   * Format date
   */
  const formatDate = (date?: string) => {
    if (!date) {
      return 'Unknown date';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString();
  };

  /**
   * Format time
   */
  const formatTime = (date?: string) => {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>
          Faculty Session History
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <Pressable
          style={[
            styles.chip,
            filter === 'all' &&
              styles.chipActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.chipText,
              filter === 'all' &&
                styles.chipTextActive,
            ]}
          >
            All Sessions
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.chip,
            filter === 'completed' &&
              styles.chipActive,
          ]}
          onPress={() =>
            setFilter('completed')
          }
        >
          <Text
            style={[
              styles.chipText,
              filter === 'completed' &&
                styles.chipTextActive,
            ]}
          >
            Finalized
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.chip,
            filter === 'expired' &&
              styles.chipActive,
          ]}
          onPress={() =>
            setFilter('expired')
          }
        >
          <Text
            style={[
              styles.chipText,
              filter === 'expired' &&
                styles.chipTextActive,
            ]}
          >
            Expired / Manual
          </Text>
        </Pressable>
      </View>

      {/* History */}
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {loading ? (
          <View
            style={styles.centerContainer}
          >
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text
              style={styles.loadingText}
            >
              Loading attendance history...
            </Text>
          </View>
        ) : error ? (
          <View
            style={styles.centerContainer}
          >
            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryBtn}
              onPress={fetchHistory}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View
            style={styles.centerContainer}
          >
            <Text style={styles.emptyText}>
              No attendance sessions found.
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => {
            /**
             * IMPORTANT:
             *
             * Backend returns:
             *
             * attendance: {
             *   totalStudents,
             *   present,
             *   absent,
             *   late
             * }
             *
             * Therefore we read the values
             * from session.attendance.
             */

            const total =
              session.attendance
                ?.totalStudents ?? 0;

            const present =
              session.attendance
                ?.present ?? 0;

            const absent =
              session.attendance
                ?.absent ?? 0;

            const late =
              session.attendance
                ?.late ?? 0;

            const isFinalized =
              !!session.endedAt;

            const subjectName =
              session.subject?.name ||
              'Attendance Session';

            const subjectCode =
              session.subject?.code || '';

            const section =
              session.class?.section ||
              'Section not available';

            return (
              <Pressable
                key={session.sessionId}
                style={styles.card}
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
                {/* Top Row */}
                <View
                  style={styles.cardTop}
                >
                  <View
                    style={[
                      styles.badge,
                      isFinalized
                        ? styles.completedBadge
                        : styles.pendingBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isFinalized
                          ? styles.completedText
                          : styles.pendingText,
                      ]}
                    >
                      {isFinalized
                        ? 'FINALIZED'
                        : 'ACTIVE'}
                    </Text>
                  </View>

                  <Text
                    style={styles.dateText}
                  >
                    {formatDate(
                      session.sessionDate,
                    )}{' '}
                    •{' '}
                    {formatTime(
                      session.startedAt,
                    )}
                  </Text>
                </View>

                {/* Subject */}
                <Text
                  style={styles.subjectTitle}
                >
                  {subjectName}
                </Text>

                {/* Subject metadata */}
                <Text
                  style={styles.metaSub}
                >
                  {subjectCode
                    ? `${subjectCode} • `
                    : ''}
                  {section}
                </Text>

                {/* Attendance counts */}
                <View
                  style={styles.attendanceRow}
                >
                  <Text
                    style={styles.presentText}
                  >
                    Present: {present} / {total}
                  </Text>

                  <Text
                    style={styles.absentText}
                  >
                    Absent: {absent}
                  </Text>

                  <Text
                    style={styles.lateText}
                  >
                    Late: {late}
                  </Text>
                </View>

                {/* Details */}
                <View
                  style={styles.footerRow}
                >
                  <Text
                    style={styles.viewDetail}
                  >
                    View Details →
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      Colors.background,
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

  filterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },

  chipActive: {
    backgroundColor: Colors.primary,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  chipTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    padding: 16,
    gap: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    gap: 8,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  completedBadge: {
    backgroundColor: '#DCFCE7',
  },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  completedText: {
    color: Colors.success,
  },

  pendingText: {
    color: Colors.warning,
  },

  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  subjectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  metaSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  attendanceRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  presentText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  absentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },

  lateText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent:
      'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  viewDetail: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },

  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
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

  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});