/**
 * SmartAttend — Subject Details Screen
 * Connected to real backend data
 */

import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL =
  'https://automark-u7nr.onrender.com/api';

const RADIUS = 54;
const CIRCUMFERENCE =
  2 * Math.PI * RADIUS;

type SubjectDetails = {
  id: number;
  name: string;
  code: string;
  credits: number;
  faculty?: string;
  description?: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

type AttendanceLog = {
  id?: number;
  date?: string;
  status?: string;
  time?: string;
};

export default function SubjectDetailsScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{ id?: string }>();

  const { tokens } = useAuth();

  const [subject, setSubject] =
    useState<SubjectDetails | null>(null);

  const [attendanceLog, setAttendanceLog] =
    useState<AttendanceLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadSubjectDetails = useCallback(
    async (isRefresh = false) => {
      if (!tokens?.accessToken) {
        setError(
          'Authentication token is missing.',
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!id) {
        setError('Subject ID is missing.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        };

        // ----------------------------------------
        // 1. Fetch subject details
        // ----------------------------------------

        const subjectResponse =
          await fetch(
            `${API_BASE_URL}/student/subjects/${id}`,
            {
              method: 'GET',
              headers,
            },
          );

        const subjectResult =
          await subjectResponse.json();

        console.log(
          'SUBJECT DETAILS STATUS:',
          subjectResponse.status,
        );

        console.log(
          'SUBJECT DETAILS RESPONSE:',
          subjectResult,
        );

        if (
          !subjectResponse.ok ||
          !subjectResult.success
        ) {
          throw new Error(
            subjectResult.message ||
              'Failed to load subject details',
          );
        }

        const subjectData =
          subjectResult.data;

        /*
         * Backend may return the subject itself
         * as an object:
         *
         * subject: {
         *   id,
         *   code,
         *   name,
         *   credits
         * }
         *
         * Handle that structure safely.
         */

        const subjectInfo =
          typeof subjectData?.subject === 'object' &&
          subjectData.subject !== null
            ? subjectData.subject
            : typeof subjectData?.name === 'object' &&
                subjectData.name !== null
              ? subjectData.name
              : subjectData;

        const facultyName =
          typeof subjectData?.faculty === 'string'
            ? subjectData.faculty
            : subjectData?.faculty?.name ||
              subjectData?.faculty?.user?.name ||
              subjectData?.class?.faculty?.name ||
              subjectData?.class?.faculty?.user?.name ||
              'Faculty';

        setSubject({
          id: Number(
            subjectInfo?.id ??
              subjectData?.id ??
              id,
          ),

          name: String(
            subjectInfo?.name ??
              subjectData?.subjectName ??
              'Subject',
          ),

          code: String(
            subjectInfo?.code ??
              subjectData?.code ??
              'N/A',
          ),

          credits: Number(
            subjectInfo?.credits ??
              subjectData?.credits ??
              0,
          ),

          faculty: String(
            facultyName,
          ),

          description: String(
            subjectData?.description ||
              subjectInfo?.description ||
              'No description available.',
          ),

          totalClasses: Number(
  subjectData?.attendance?.totalClasses ??
    0,
),

present: Number(
  subjectData?.attendance?.present ??
    0,
),

absent: Number(
  subjectData?.attendance?.absent ??
    0,
),

late: Number(
  subjectData?.attendance?.late ??
    0,
),

percentage: Number(
  subjectData?.attendance?.percentage ??
    0,
),
        });

        // ----------------------------------------
        // 2. Fetch attendance history
        // ----------------------------------------

        const historyResponse =
          await fetch(
            `${API_BASE_URL}/student/attendance/history`,
            {
              method: 'GET',
              headers,
            },
          );

        const historyResult =
          await historyResponse.json();

        console.log(
          'ATTENDANCE HISTORY STATUS:',
          historyResponse.status,
        );

        console.log(
          'ATTENDANCE HISTORY RESPONSE:',
          historyResult,
        );

        if (
          historyResponse.ok &&
          historyResult.success
        ) {
          const history =
            Array.isArray(historyResult.data)
              ? historyResult.data
              : [];

          /*
           * Keep only attendance records
           * belonging to this subject.
           */

          const filteredHistory =
            history.filter((item: any) => {
              const recordSubjectId =
                item?.subjectId ??
                item?.subject?.id ??
                item?.class?.subjectId ??
                item?.class?.subject?.id;

              return (
                recordSubjectId !== undefined &&
                String(recordSubjectId) ===
                  String(id)
              );
            });

          setAttendanceLog(
            filteredHistory,
          );
        } else {
          setAttendanceLog([]);
        }
      } catch (err) {
        console.error(
          'SUBJECT DETAILS ERROR:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load subject details',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, tokens?.accessToken],
  );

  /*
   * Load when the screen first opens and
   * refresh whenever the student comes back
   * to this screen.
   */
  useFocusEffect(
  useCallback(() => {
    loadSubjectDetails(true);
  }, [loadSubjectDetails]),
);

  const formatDate = (
    value?: string,
  ) => {
    if (!value) {
      return 'Date unavailable';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  };

  const formatTime = (
    value?: string,
  ) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  // ----------------------------------------
  // Loading state
  // ----------------------------------------

  if (loading && !subject) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading subject details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------
  // Error state
  // ----------------------------------------

  if (error && !subject) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={Colors.onSurface}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Subject Details
          </Text>

          <View
            style={{
              width: 40,
            }}
          />
        </View>

        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.error}
          />

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() =>
              loadSubjectDetails()
            }
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!subject) {
    return null;
  }

  // ----------------------------------------
  // Attendance calculations
  // ----------------------------------------

  const percentage = Math.max(
    0,
    Math.min(
      100,
      Number(subject.percentage) || 0,
    ),
  );

  const progressColor =
    percentage < 75
      ? '#F59E0B'
      : '#16A34A';

  const progressArc =
    (percentage / 100) *
    CIRCUMFERENCE;

 const missed = Math.max(
  0,
  Number(subject.absent) || 0,
);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={Colors.onSurface}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Subject Details
        </Text>

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadSubjectDetails(true)
            }
          />
        }
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.subjectIcon,
                {
                  backgroundColor: `${progressColor}18`,
                },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={28}
                color={progressColor}
              />
            </View>

            <View style={styles.heroInfo}>
              <Text
                style={styles.heroSubject}
              >
                {subject.name}
              </Text>

              <Text
                style={styles.heroCode}
              >
                {subject.code} ·{' '}
                {subject.credits} Credits
              </Text>

              <Text
                style={styles.heroFaculty}
              >
                {subject.faculty}
              </Text>
            </View>
          </View>

          {/* Circular chart */}
          <View style={styles.chartRow}>
            <View style={styles.chartWrap}>
              <Svg
                width={144}
                height={144}
                style={{
                  transform: [
                    {
                      rotate: '-90deg',
                    },
                  ],
                }}
              >
                <Circle
                  cx={72}
                  cy={72}
                  r={RADIUS}
                  stroke="#E5E7EB"
                  strokeWidth={10}
                  fill="transparent"
                />

                <Circle
                  cx={72}
                  cy={72}
                  r={RADIUS}
                  stroke={progressColor}
                  strokeWidth={10}
                  fill="transparent"
                  strokeDasharray={`${progressArc} ${CIRCUMFERENCE}`}
                  strokeLinecap="round"
                />
              </Svg>

              <View
                style={styles.chartCenter}
              >
                <Text
                  style={[
                    styles.chartPct,
                    {
                      color:
                        progressColor,
                    },
                  ]}
                >
                  {percentage.toFixed(0)}%
                </Text>

                <Text
                  style={styles.chartSub}
                >
                  Attendance
                </Text>
              </View>
            </View>

            <View
              style={styles.statsBlock}
            >
              {[
                {
                  label:
                    'Classes Attended',
                  value:
                    subject.present,
                  color:
                    progressColor,
                },
                {
                  label:
                    'Total Classes',
                  value:
                    subject.totalClasses,
                  color:
                    Colors.onSurface,
                },
                {
                  label:
                    'Classes Missed',
                  value: missed,
                  color:
                    Colors.error,
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={styles.statRow}
                >
                  <Text
                    style={[
                      styles.statVal,
                      {
                        color:
                          s.color,
                      },
                    ]}
                  >
                    {s.value}
                  </Text>

                  <Text
                    style={styles.statLbl}
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {percentage < 75 && (
            <View
              style={styles.warningBanner}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color="#F59E0B"
              />

              <Text
                style={styles.warningText}
              >
                Attendance is below the
                required 75% threshold.
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text
            style={styles.descTitle}
          >
            About This Subject
          </Text>

          <Text
            style={styles.descText}
          >
            {subject.description ||
              'No description available.'}
          </Text>
        </View>

        {/* Attendance log */}
        <View style={styles.logSection}>
          <Text
            style={styles.logTitle}
          >
            Recent Attendance
          </Text>

          {attendanceLog.length === 0 ? (
            <Text
              style={styles.emptyText}
            >
              No attendance records found
              for this subject.
            </Text>
          ) : (
            attendanceLog.map(
              (log, index) => {
                const status =
                  String(
                    log.status || '',
                  ).toUpperCase();

                const isPresent =
                  status === 'PRESENT';

                const isLate =
                  status === 'LATE';

                const statusColor =
                  isPresent
                    ? '#16A34A'
                    : isLate
                      ? '#F59E0B'
                      : Colors.error;

                return (
                  <View
                    key={
                      log.id ??
                      `${log.date}-${index}`
                    }
                    style={styles.logRow}
                  >
                    <View
                      style={[
                        styles.logDot,
                        {
                          backgroundColor:
                            statusColor,
                        },
                      ]}
                    />

                    <View
                      style={styles.logInfo}
                    >
                      <Text
                        style={
                          styles.logDate
                        }
                      >
                        {formatDate(
                          log.date,
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.logStatus,
                          {
                            color:
                              statusColor,
                          },
                        ]}
                      >
                        {isPresent
                          ? `Present · ${formatTime(log.time)}`
                          : isLate
                            ? `Late · ${formatTime(log.time)}`
                            : 'Absent'}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        isPresent
                          ? 'checkmark-circle'
                          : isLate
                            ? 'time'
                            : 'close-circle'
                      }
                      size={20}
                      color={
                        statusColor
                      }
                    />
                  </View>
                );
              },
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  header: {
    height: 56,
    paddingHorizontal:
      Spacing.marginMobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.outlineVariant,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
    gap: Spacing.lg,
    paddingHorizontal:
      Spacing.marginMobile,
    paddingTop: Spacing.lg,
  },

  heroCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
    gap: Spacing.lg,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },

  subjectIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroInfo: {
    flex: 1,
  },

  heroSubject: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  heroCode: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  heroFaculty: {
    ...Typography.bodySm,
    color: Colors.primaryContainer,
    fontWeight: '500',
    marginTop: 4,
  },

  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },

  chartWrap: {
    position: 'relative',
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
  },

  chartPct: {
    fontSize: 24,
    fontWeight: '700',
  },

  chartSub: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
  },

  statsBlock: {
    flex: 1,
    gap: Spacing.md,
  },

  statRow: {
    flexDirection: 'column',
  },

  statVal: {
    ...Typography.headlineMd,
    fontWeight: '700',
  },

  statLbl: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7E6',
    borderRadius: Radius.lg,
    padding: 10,
  },

  warningText: {
    ...Typography.labelMd,
    color: '#F59E0B',
    flex: 1,
  },

  descCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },

  descTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },

  descText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },

  logSection: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
    gap: Spacing.md,
  },

  logTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.surfaceContainerLow,
  },

  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  logInfo: {
    flex: 1,
  },

  logDate: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '500',
  },

  logStatus: {
    ...Typography.labelXs,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
  },

  errorText: {
    ...Typography.bodyMd,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 12,
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },

  retryText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '600',
  },

  emptyText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
