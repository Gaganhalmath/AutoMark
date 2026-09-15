/**
 * SmartAttend — Subject-wise Attendance Screen
 * Connected to real backend attendance data
 */

import React, {
  useCallback,
  useEffect,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

const RADIUS = 66;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type BackendSubjectAttendance = {
  subjectId: number | null;
  code: string | null;
  subject: string | null;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

function getStatusColor(pct: number): string {
  if (pct >= 75) return '#16A34A';
  if (pct >= 60) return '#F59E0B';
  return '#BA1A1A';
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [subjects, setSubjects] = useState<
    BackendSubjectAttendance[]
  >([]);

  const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(
  async (isPullToRefresh = false) => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }

    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/student/attendance`,
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
        'STUDENT ATTENDANCE STATUS:',
        response.status,
      );

      console.log(
        'STUDENT ATTENDANCE RESPONSE:',
        result,
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to fetch attendance data',
        );
      }

      setSubjects(result.data ?? []);
    } catch (err) {
      console.error(
        'STUDENT ATTENDANCE ERROR:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load attendance data',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  [tokens?.accessToken],
);

  useEffect(() => {
  fetchAttendance();
}, [fetchAttendance]);

useFocusEffect(
  useCallback(() => {
    fetchAttendance(true);
  }, [fetchAttendance]),
);

  /*
   * Calculate overall attendance from real backend data.
   *
   * Overall percentage =
   * total present classes / total classes
   */
  const totalClasses = subjects.reduce(
    (sum, subject) =>
      sum + Number(subject.totalClasses || 0),
    0,
  );

  const totalPresent = subjects.reduce(
    (sum, subject) =>
      sum + Number(subject.present || 0),
    0,
  );

  const totalAbsent = subjects.reduce(
    (sum, subject) =>
      sum + Number(subject.absent || 0),
    0,
  );

  const totalLate = subjects.reduce(
    (sum, subject) =>
      sum + Number(subject.late || 0),
    0,
  );

  const overall =
    totalClasses > 0
      ? Number(
          ((totalPresent / totalClasses) * 100).toFixed(2),
        )
      : 0;

  const progressArc =
    (Math.min(overall, 100) / 100) *
    CIRCUMFERENCE;

  const eligible = overall >= 75;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SmartAttendLogo size={32} />

          <View>
            <Text style={styles.headerBrand}>
              AutoMark
            </Text>

            <Text style={styles.headerTitle}>
              Attendance
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push(
                '/(student)/notifications',
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.onSurfaceVariant}
            />
          </Pressable>

          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={18}
              color={Colors.onPrimary}
            />
          </View>
        </View>
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
      onRefresh={() => fetchAttendance(true)}
    />
  }
>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={Colors.onSurface}
            />
          </Pressable>

          <Text style={styles.pageTitle}>
            Subject-wise Attendance
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading attendance...
            </Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.center}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color={Colors.error}
            />

            <Text style={styles.errorTitle}>
              Unable to load attendance
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryBtn}
              onPress={() => fetchAttendance()}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {/* Real attendance content */}
        {!loading && !error && (
          <>
            {/* Overall circular chart card */}
            <View style={styles.chartCard}>
              <View style={styles.chartWrapper}>
                <Svg
                  width={176}
                  height={176}
                  style={{
                    transform: [
                      { rotate: '-90deg' },
                    ],
                  }}
                >
                  {/* Track */}
                  <Circle
                    cx={88}
                    cy={88}
                    r={RADIUS}
                    stroke="#E5E7EB"
                    strokeWidth={12}
                    fill="transparent"
                  />

                  {/* Progress */}
                  <Circle
                    cx={88}
                    cy={88}
                    r={RADIUS}
                    stroke={
                      eligible
                        ? '#16A34A'
                        : '#BA1A1A'
                    }
                    strokeWidth={12}
                    fill="transparent"
                    strokeDasharray={`${progressArc} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                  />
                </Svg>

                {/* Center text */}
                <View style={styles.chartCenter}>
                  <Text
                    style={styles.chartPercent}
                  >
                    {overall}%
                  </Text>

                  <Text style={styles.chartLabel}>
                    Overall Attendance
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statRow}>
                <View style={styles.statPill}>
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor:
                          eligible
                            ? '#EAF8ED'
                            : '#FEE2E2',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        eligible
                          ? 'checkmark-circle-outline'
                          : 'warning-outline'
                      }
                      size={18}
                      color={
                        eligible
                          ? '#16A34A'
                          : '#BA1A1A'
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.statLabel}
                    >
                      STATUS
                    </Text>

                    <Text
                      style={styles.statValue}
                    >
                      {eligible
                        ? 'Eligible'
                        : 'Below 75%'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statPill}>
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor:
                          '#EEF4FF',
                      },
                    ]}
                  >
                    <Ionicons
                      name="school-outline"
                      size={18}
                      color={
                        Colors.primaryContainer
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.statLabel}
                    >
                      TOTAL ATTENDED
                    </Text>

                    <Text
                      style={styles.statValue}
                    >
                      {totalPresent} /{' '}
                      {totalClasses}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Subjects header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                All Subjects
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                {subjects.length} Subject
                {subjects.length !== 1
                  ? 's'
                  : ''}
              </Text>
            </View>

            {/* Subject list */}
            <View style={styles.subjectList}>
              {subjects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="school-outline"
                    size={40}
                    color={
                      Colors.onSurfaceVariant
                    }
                  />

                  <Text
                    style={styles.emptyTitle}
                  >
                    No subjects found
                  </Text>

                  <Text
                    style={styles.emptyText}
                  >
                    No subjects are currently
                    assigned to your account.
                  </Text>
                </View>
              ) : (
                // subjects.map((sub) => {
                //   const percentage =
                //     Number(sub.percentage) || 0;

                //   const color =
                //     getStatusColor(
                //       percentage,
                //     );

                //   const warning =
                //     percentage < 75;

                //   return (
                //     <Pressable
                //       key={
                //         sub.subjectId ??
                //         `${sub.code}-${sub.subject}`
                //       }
                //       style={
                //         styles.subjectCard
                //       }
                subjects.map((sub, index) => {
  console.log('ATTENDANCE SUBJECT:', index, sub);

  const percentage = Number(sub.percentage) || 0;
  const color = getStatusColor(percentage);
  const warning = percentage < 75;

  return (
    <Pressable
    key={`${sub.subjectId ?? sub.code ?? sub.subject}-${index}`}
                      onPress={() => {
                        if (
                          sub.subjectId ===
                          null
                        ) {
                          return;
                        }

                        router.push({
                          pathname:
                            '/(student)/subject-details',
                          params: {
                            id: String(
                              sub.subjectId,
                            ),
                          },
                        });
                      }}
                    >
                      <View
                        style={
                          styles.subjectRow
                        }
                      >
                        <View
                          style={
                            styles.subjectNameRow
                          }
                        >
                          <View
                            style={[
                              styles.subjectDot,
                              {
                                backgroundColor:
                                  color,
                              },
                            ]}
                          />

                          <View
                            style={
                              styles.subjectTextContainer
                            }
                          >
                            <Text
                              style={
                                styles.subjectName
                              }
                            >
                              {sub.subject ??
                                'Unknown Subject'}
                            </Text>

                            <Text
                              style={
                                styles.subjectCode
                              }
                            >
                              {sub.code ??
                                'N/A'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.subjectPct,
                            { color },
                          ]}
                        >
                          {percentage}%
                        </Text>
                      </View>

                      <View
                        style={
                          styles.subjectStatsRow
                        }
                      >
                        <Text
                          style={
                            styles.subjectCount
                          }
                        >
                          {sub.present} /{' '}
                          {sub.totalClasses}{' '}
                          classes attended
                        </Text>

                        {sub.late > 0 && (
                          <Text
                            style={
                              styles.lateText
                            }
                          >
                            Late: {sub.late}
                          </Text>
                        )}
                      </View>

                      {/* Progress bar */}
                      <View
                        style={
                          styles.progressTrack
                        }
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(
                                percentage,
                                100,
                              )}%` as any,
                              backgroundColor:
                                color,
                            },
                          ]}
                        />
                      </View>

                      {/* Warning */}
                      {warning && (
                        <View
                          style={
                            styles.warningRow
                          }
                        >
                          <Ionicons
                            name="warning-outline"
                            size={14}
                            color="#F59E0B"
                          />

                          <Text
                            style={
                              styles.warningText
                            }
                          >
                            Attendance below
                            75% requirement
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* Policy banner */}
            <View
              style={styles.policyBanner}
            >
              <View
                style={styles.policyIcon}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#5B3FD3"
                />
              </View>

              <View
                style={styles.policyContent}
              >
                <Text
                  style={styles.policyTitle}
                >
                  Attendance Calculation
                  Policy
                </Text>

                <Text
                  style={styles.policyBody}
                >
                  Overall attendance is
                  calculated based on total
                  classes taken across enrolled
                  subjects. A minimum of 75%
                  attendance is required for
                  semester examinations.
                </Text>
              </View>
            </View>

            {/* Debug-friendly summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                Present: {totalPresent} •
                Absent: {totalAbsent} • Late:{' '}
                {totalLate}
              </Text>
            </View>
          </>
        )}
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
    height: 64,
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

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  headerBrand: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: '600',
  },

  headerTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor:
      Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal:
      Spacing.marginMobile,
    paddingVertical: Spacing.sm,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  pageTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },

  chartCard: {
    marginHorizontal:
      Spacing.marginMobile,
    marginBottom: Spacing.lg,
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },

  chartWrapper: {
    position: 'relative',
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
  },

  chartPercent: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 36,
  },

  chartLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  statRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    width: '100%',
  },

  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor:
      Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statLabel: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statValue: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal:
      Spacing.marginMobile,
    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  sectionSubtitle: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
  },

  subjectList: {
    paddingHorizontal:
      Spacing.marginMobile,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },

  subjectCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },

  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  subjectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },

  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  subjectTextContainer: {
    flex: 1,
  },

  subjectName: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  subjectCode: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  subjectPct: {
    ...Typography.titleSm,
    fontWeight: '700',
    marginLeft: 8,
  },

  subjectStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },

  subjectCount: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },

  lateText: {
    ...Typography.labelXs,
    color: '#B45309',
  },

  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },

  warningText: {
    ...Typography.labelXs,
    color: '#F59E0B',
  },

  policyBanner: {
    marginHorizontal:
      Spacing.marginMobile,
    backgroundColor: '#F1EDFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  policyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },

  policyContent: {
    flex: 1,
  },

  policyTitle: {
    ...Typography.labelMd,
    color: '#5B3FD3',
    fontWeight: '600',
    marginBottom: 2,
  },

  policyBody: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    lineHeight: 18,
  },

  center: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
    marginTop: 10,
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },

  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  summary: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  summaryText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
});