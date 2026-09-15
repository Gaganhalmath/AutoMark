/**
 * SmartAttend — Attendance Reminder / Home Attendance Ongoing Screen
 * Design reference: stitch_smartattend_mobile_app_onboarding/home_attendance_ongoing/code.html
 *
 * Shows active attendance window banner with countdown
 */

import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { useAuth } from '../../auth/AuthProvider';

type TimetableItem = {
  id: number | string;
  classId?: number | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;

  faculty?:
    | string
    | {
        name?: string;
        user?: {
          name?: string;
        };
      };

  section?: string;

  class?: {
    section?: string;

    faculty?: {
      name?: string;
      user?: {
        name?: string;
      };
    };

    subject?: {
      name?: string;
      code?: string;
    };
  };

  subject?: {
    name?: string;
    code?: string;
  };
};

type ActiveSessionResponse = {
  success: boolean;
  data?: {
    active: boolean;
    sessionId?: string | number;
    startedAt?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
  };
  message?: string;
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return 0;
  }

  return hours * 60 + minutes;
}

function getSubjectName(item: TimetableItem): string {
  return (
    item.subject?.name ||
    item.class?.subject?.name ||
    item.subject?.code ||
    item.class?.subject?.code ||
    'Class'
  );
}

function getFacultyName(item: TimetableItem): string {
  if (typeof item.faculty === 'string') {
    return item.faculty;
  }

  return (
    item.faculty?.name ||
    item.faculty?.user?.name ||
    item.class?.faculty?.name ||
    item.class?.faculty?.user?.name ||
    'Faculty'
  );
}

function getSection(item: TimetableItem): string {
  return (
    item.section ||
    item.class?.section ||
    'Section'
  );
}

function formatTime(time: string): string {
  const [hoursString, minutesString] = time.split(':');

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return time;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;

  return `${String(displayHour).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')} ${period}`;
}

export default function AttendanceReminderScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [nextClass, setNextClass] =
    useState<TimetableItem | null>(null);

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [scheduledStart, setScheduledStart] =
    useState<string | null>(null);

  const [scheduledEnd, setScheduledEnd] =
    useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load today's timetable and check whether
   * the current/next class has an active attendance session.
   */
  useEffect(() => {
    const loadAttendanceReminder = async () => {
      if (!tokens?.accessToken) {
        setLoading(false);
        setError('Please log in again.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          'https://automark-u7nr.onrender.com/api/student/timetable',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || 'Failed to load timetable',
          );
        }

        const timetable: TimetableItem[] =
          result.data || [];

        const today = new Date();
        const todayDay = today.getDay();

        const todayClasses = timetable
          .filter(
            (item) => item.dayOfWeek === todayDay,
          )
          .sort(
            (a, b) =>
              parseTimeToMinutes(a.startTime) -
              parseTimeToMinutes(b.startTime),
          );

        if (todayClasses.length === 0) {
          setNextClass(null);
          setSessionId(null);
          setScheduledStart(null);
          setScheduledEnd(null);
          setLoading(false);
          return;
        }

        const currentMinutes =
          today.getHours() * 60 + today.getMinutes();

        /**
         * Prefer the class that is currently running.
         * Otherwise use the next upcoming class.
         */
        let selectedClass =
          todayClasses.find((item) => {
            const start = parseTimeToMinutes(
              item.startTime,
            );
            const end = parseTimeToMinutes(
              item.endTime,
            );

            return (
              currentMinutes >= start &&
              currentMinutes <= end
            );
          }) || null;

        if (!selectedClass) {
          selectedClass =
            todayClasses.find(
              (item) =>
                parseTimeToMinutes(item.startTime) >
                currentMinutes,
            ) || null;
        }

        if (!selectedClass) {
          setNextClass(todayClasses[todayClasses.length - 1]);
          setSessionId(null);
          setScheduledStart(null);
          setScheduledEnd(null);
          setLoading(false);
          return;
        }

        setNextClass(selectedClass);

        /**
         * Get class ID.
         *
         * Depending on the backend response, classId may
         * exist directly or inside the timetable record.
         */
        const classId =
          selectedClass.classId ?? selectedClass.id;

        if (!classId) {
          setSessionId(null);
          setScheduledStart(null);
          setScheduledEnd(null);
          setLoading(false);
          return;
        }

        const sessionResponse = await fetch(
          `https://automark-u7nr.onrender.com/api/attendance/student/active-session/${classId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          },
        );

        const sessionResult: ActiveSessionResponse =
          await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(
            sessionResult.message ||
              'Failed to check attendance session',
          );
        }

        if (
          sessionResult.success &&
          sessionResult.data?.active
        ) {
          setSessionId(
            sessionResult.data.sessionId
              ? String(sessionResult.data.sessionId)
              : null,
          );

          setScheduledStart(
            sessionResult.data.scheduledStart || null,
          );

          setScheduledEnd(
            sessionResult.data.scheduledEnd || null,
          );
        } else {
          setSessionId(null);
          setScheduledStart(null);
          setScheduledEnd(null);
        }
      } catch (err) {
        console.error(
          'Attendance reminder error:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load attendance information',
        );
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceReminder();
  }, [tokens?.accessToken]);

  /**
   * Calculate countdown using the actual backend
   * scheduledEnd time.
   */
  useEffect(() => {
    if (!scheduledEnd) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const end = new Date(scheduledEnd).getTime();

      if (!Number.isFinite(end)) {
        setTimeLeft(0);
        return;
      }

      const remainingSeconds = Math.max(
        0,
        Math.floor((end - now) / 1000),
      );

      setTimeLeft(remainingSeconds);
    };

    calculateTimeLeft();

    const timer = setInterval(
      calculateTimeLeft,
      1000,
    );

    return () => clearInterval(timer);
  }, [scheduledEnd]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  /**
   * Progress is based on the actual scheduled start/end.
   */
  let progress = 0.0;

  if (scheduledStart && scheduledEnd) {
    const start = new Date(scheduledStart).getTime();
    const end = new Date(scheduledEnd).getTime();
    const now = Date.now();

    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      end > start
    ) {
      progress = Math.min(
        1,
        Math.max(
          0,
          (now - start) / (end - start),
        ),
      );
    }
  }

  const hasActiveSession =
    Boolean(sessionId) && timeLeft > 0;

  const classSubject = nextClass
    ? getSubjectName(nextClass)
    : 'No class';

  const classSection = nextClass
    ? getSection(nextClass)
    : '—';

  const classRoom = nextClass?.room || '—';

  const classFaculty = nextClass
    ? getFacultyName(nextClass)
    : '—';

  const classTime = nextClass
    ? `${formatTime(nextClass.startTime)} – ${formatTime(
        nextClass.endTime,
      )}`
    : '—';

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SmartAttendLogo size={32} />

          <View>
            <Text style={styles.headerBrand}>
              AutoMarl
            </Text>

            <Text style={styles.headerTitle}>
              Student Home
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push('/(student)/notifications')
          }
        >
          <View style={styles.notifBtn}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.onSurface}
            />

            <View style={styles.notifDot} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backRow}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={Colors.onSurface}
          />
        </Pressable>

        {/* Loading state */}
        {loading && (
          <View style={styles.statusCard}>
            <Ionicons
              name="sync-outline"
              size={22}
              color={Colors.primaryContainer}
            />

            <Text style={styles.statusText}>
              Loading attendance information...
            </Text>
          </View>
        )}

        {/* Error state */}
        {!loading && error && (
          <View style={styles.statusCard}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={Colors.error}
            />

            <Text style={styles.statusText}>
              {error}
            </Text>
          </View>
        )}

        {/* No active session */}
        {!loading &&
          !error &&
          !hasActiveSession && (
            <View style={styles.statusCard}>
              <Ionicons
                name="time-outline"
                size={22}
                color={Colors.primaryContainer}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  No Active Attendance
                </Text>

                <Text style={styles.statusText}>
                  {nextClass
                    ? `There is currently no attendance window open for ${classSubject}.`
                    : 'There is no scheduled class for today.'}
                </Text>
              </View>
            </View>
          )}

        {/* Active Attendance Banner */}
        {!loading &&
          !error &&
          hasActiveSession &&
          nextClass && (
            <View style={styles.activeBanner}>
              <View style={styles.bannerTop}>
                <View style={styles.bannerIcon}>
                  <Ionicons
                    name="radio-button-on"
                    size={20}
                    color="#16A34A"
                  />
                </View>

                <Text
                  style={styles.bannerLabel}
                >
                  ATTENDANCE WINDOW OPEN
                </Text>

                <View style={styles.livePill}>
                  <View style={styles.liveDot} />

                  <Text
                    style={styles.livePillText}
                  >
                    LIVE
                  </Text>
                </View>
              </View>

              <Text
                style={styles.bannerSubject}
              >
                {classSubject}
              </Text>

              <Text style={styles.bannerMeta}>
                {classSection} · {classRoom}
              </Text>

              {/* Countdown */}
              <View style={styles.countdown}>
                <View style={styles.countdownTime}>
                  <Text
                    style={styles.countdownNum}
                  >
                    {String(mins).padStart(
                      2,
                      '0',
                    )}
                  </Text>

                  <Text
                    style={styles.countdownSep}
                  >
                    :
                  </Text>

                  <Text
                    style={styles.countdownNum}
                  >
                    {String(secs).padStart(
                      2,
                      '0',
                    )}
                  </Text>
                </View>

                <Text
                  style={styles.countdownLabel}
                >
                  minutes remaining to mark
                  attendance
                </Text>
              </View>

              {/* Progress bar */}
              <View
                style={styles.progressTrack}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>

              <Pressable
                style={styles.markBtn}
                onPress={() =>
                  router.push(
                    '/(student)/attendance-check',
                  )
                }
              >
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={Colors.onPrimary}
                />

                <Text
                  style={styles.markBtnText}
                >
                  MARK MY ATTENDANCE
                </Text>
              </Pressable>
            </View>
          )}

        {/* Class Info card */}
        {!loading && nextClass && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Class Details
            </Text>

            {[
              {
                icon: 'book-outline',
                label: 'Subject',
                value: classSubject,
              },
              {
                icon: 'people-outline',
                label: 'Section',
                value: classSection,
              },
              {
                icon: 'business-outline',
                label: 'Room',
                value: classRoom,
              },
              {
                icon: 'time-outline',
                label: 'Time',
                value: classTime,
              },
              {
                icon: 'person-outline',
                label: 'Faculty',
                value: classFaculty,
              },
            ].map((row) => (
              <View
                key={row.label}
                style={styles.infoRow}
              >
                <View
                  style={styles.infoIconWrap}
                >
                  <Ionicons
                    name={row.icon as any}
                    size={16}
                    color={
                      Colors.primaryContainer
                    }
                  />
                </View>

                <Text
                  style={styles.infoLabel}
                >
                  {row.label}
                </Text>

                <Text
                  style={styles.infoValue}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#5B3FD3"
          />

          <Text style={styles.noteText}>
            Your device must be registered and
            location enabled for BLE proximity
            verification.
          </Text>
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
    height: 64,
    paddingHorizontal: Spacing.marginMobile,
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

  notifBtn: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: 32,
    gap: Spacing.lg,
  },

  backRow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: Spacing.sm,
  },

  activeBanner: {
    backgroundColor: '#EAF8ED',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    gap: Spacing.md,
  },

  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      'rgba(22,163,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerLabel: {
    ...Typography.labelMd,
    color: '#16A34A',
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },

  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },

  livePillText: {
    ...Typography.labelXs,
    color: 'white',
    fontWeight: '700',
  },

  bannerSubject: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  bannerMeta: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },

  countdown: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },

  countdownTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countdownNum: {
    fontSize: 48,
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: 'Inter_700Bold',
  },

  countdownSep: {
    fontSize: 40,
    fontWeight: '700',
    color: '#16A34A',
    marginHorizontal: 4,
  },

  countdownLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },

  progressTrack: {
    height: 6,
    backgroundColor:
      'rgba(22,163,74,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },

  markBtn: {
    height: 52,
    backgroundColor: '#16A34A',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },

  markBtnText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    letterSpacing: 0.8,
  },

  infoCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
    gap: Spacing.sm,
  },

  infoTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.surfaceContainerLow,
  },

  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor:
      Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    width: 60,
  },

  infoValue: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: '500',
    flex: 1,
  },

  noteCard: {
    backgroundColor: '#F1EDFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },

  noteText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },

  statusCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },

  statusTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },

  statusText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
});
