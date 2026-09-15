/**
 * SmartAttend — Student Timetable Screen
 * Real backend timetable + reference UI
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
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
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../auth/AuthProvider';
import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Shadow, Spacing } from '../../constants/spacing';

type TimetableItem = {
  id: number | string;
  classId: number | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  faculty?: string | {
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

type DayItem = {
  key: string;
  label: string;
  date: string;
  month: string;
  fullDate: string;
  dayNumber: number;
};

const STATUS_COLORS = {
  past: {
    bg: Colors.surfaceContainer,
    text: Colors.onSurfaceVariant,
    label: 'Past',
    strip: Colors.surfaceContainerHighest,
  },
  ongoing: {
    bg: '#EAF8ED',
    text: '#16A34A',
    label: 'ONGOING',
    strip: '#16A34A',
  },
  upcoming: {
    bg: Colors.surfaceContainerLowest,
    text: Colors.primaryContainer,
    label: 'Next Up',
    strip: Colors.surfaceContainerHighest,
  },
};

const getMonday = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
};

const formatMonth = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short' });

const formatDateNumber = (date: Date) =>
  date.toLocaleDateString('en-US', { day: '2-digit' });

const getFullDayName = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const getDayName = (dayNumber: number) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  return days[dayNumber] || '';
};

const parseTimeToMinutes = (time: string) => {
  if (!time) return 0;

  const parts = time.split(':');
  const hour = Number(parts[0]);
  const minute = Number(parts[1] || 0);

  return hour * 60 + minute;
};

const formatTime = (time: string) => {
  if (!time) return '';

  const [hourString, minute] = time.split(':');
  let hour = Number(hourString);

  const suffix = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${minute || '00'} ${suffix}`;
};

const getFacultyName = (item: TimetableItem) => {
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
};

const getSubjectName = (item: TimetableItem) =>
  item.subject?.name ||
  item.class?.subject?.name ||
  'Subject';

const getSubjectCode = (item: TimetableItem) =>
  item.subject?.code ||
  item.class?.subject?.code ||
  '';

const getSection = (item: TimetableItem) =>
  item.section ||
  item.class?.section ||
  'Section';

export default function TimetableScreen() {
  const { tokens } = useAuth();
  const router = useRouter();

  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const getTodayKey = () => {
  const day = new Date().getDay();

  const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return dayKeys[day];
};

const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState<string | null>(null);
const [refreshing, setRefreshing] = useState(false);

  /*
   * Build the current Monday-Friday week dynamically.
   */
  /*
 * Build the current Monday-Sunday week dynamically.
 */
const DAYS: DayItem[] = useMemo(() => {
  const monday = getMonday(new Date());

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const key = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ][index];

    return {
      key,
      label: key,
      date: formatDateNumber(date),
      month: formatMonth(date),
      fullDate: getFullDayName(date),
      dayNumber: index + 1,
    };
  });
}, []);

  const selectedDayInfo =
    DAYS.find((day) => day.key === selectedDay) || DAYS[0];

  /*
   * Load real timetable from backend.
   */
  const loadTimetable = useCallback(
  async (isPullToRefresh = false) => {
    if (!tokens?.accessToken) {
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
        'http://192.168.212.213:5000/api/student/timetable',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const result = await response.json();

      console.log("STUDENT TIMETABLE RESPONSE:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(
          result?.message || 'Failed to load timetable'
        );
      }

      setTimetable(result?.data || []);
    } catch (err: any) {
      console.error('Student timetable error:', err);
      setError(err?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  [tokens?.accessToken]
);

useEffect(() => {
  loadTimetable();
}, [loadTimetable]);

useFocusEffect(
  useCallback(() => {
    loadTimetable(true);
  }, [loadTimetable])
);
  /*
   * Get classes for selected day.
   */
  const classes = useMemo(() => {
    if (!selectedDayInfo) return [];

    const filtered = timetable.filter(
      (item) => Number(item.dayOfWeek) === selectedDayInfo.dayNumber
    );

    return [...filtered].sort(
      (a, b) =>
        parseTimeToMinutes(a.startTime) -
        parseTimeToMinutes(b.startTime)
    );
  }, [timetable, selectedDayInfo]);

  const sessionCount = classes.length;

  /*
   * Determine class status based on current time.
   */
  const getClassStatus = (cls: TimetableItem) => {
  const now = new Date();

  // SmartAttend uses Monday = 1 ... Sunday = 7
  const today =
    now.getDay() === 0 ? 7 : now.getDay();

  if (
    !selectedDayInfo ||
    today !== selectedDayInfo.dayNumber
  ) {
    return 'upcoming' as const;
  }

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const startMinutes = parseTimeToMinutes(cls.startTime);
  const endMinutes = parseTimeToMinutes(cls.endTime);

  if (currentMinutes >= endMinutes) {
    return 'past' as const;
  }

  if (
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes
  ) {
    return 'ongoing' as const;
  }

  return 'upcoming' as const;
};
  /*
   * Find the first upcoming class and mark it as Next Up.
   */
  const nextClassId = useMemo(() => {
    const now = new Date();

    if (!selectedDayInfo || now.getDay() !== selectedDayInfo.dayNumber) {
      return null;
    }

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const next = classes.find(
      (cls) =>
        parseTimeToMinutes(cls.startTime) > currentMinutes
    );

    return next?.id ?? null;
  }, [classes, selectedDayInfo]);

  const checkAndOpenAttendance = async (cls: TimetableItem) => {
  const status = getClassStatus(cls);

  console.log('VERIFY CLASS STATUS:', status);
  console.log('VERIFY CLASS:', JSON.stringify(cls, null, 2));

  if (status !== 'ongoing') {
    console.log('VERIFY BLOCKED: CLASS IS NOT ONGOING');
    return;
  }

  if (!tokens?.accessToken) {
    console.log('VERIFY BLOCKED: NO ACCESS TOKEN');
    return;
  }

  try {
    setCheckingSession(String(cls.classId));

    const response = await fetch(
      `http://192.168.212.213:5000/api/attendance/student/active-session/${cls.classId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );

    const result = await response.json();

    console.log('ACTIVE SESSION STATUS:', response.status);
console.log(
  'ACTIVE SESSION RESPONSE:',
  JSON.stringify(result, null, 2)
);

    if (!response.ok || !result.success) {
      throw new Error(
        result?.message || 'Unable to check attendance session'
      );
    }

    if (!result.data?.active || !result.data?.sessionId) {
      return;
    }

    const session = result.data;

    const sessionId = String(session.sessionId);

    router.push({
      pathname: '/(student)/attendance-check',
      params: {
        sessionId,

        subjectName:
          session.class?.subject?.name ||
          getSubjectName(cls),

        subjectCode:
          session.class?.subject?.code ||
          getSubjectCode(cls),

        room:
          session.class?.room ||
          cls.room ||
          '',

        faculty:
          session.class?.faculty ||
          getFacultyName(cls),

        scheduledStart:
          session.scheduledStart
            ? String(session.scheduledStart)
            : cls.startTime,

        scheduledEnd:
          session.scheduledEnd
            ? String(session.scheduledEnd)
            : cls.endTime,
      },
    });
  } catch (err) {
    console.error(
      'Student attendance session check error:',
      err
    );
  } finally {
    setCheckingSession(null);
  }
};

  const renderLoading = () => (
    <View style={styles.centerState}>
      <ActivityIndicator
        size="large"
        color={Colors.primaryContainer}
      />
      <Text style={styles.stateText}>
        Loading timetable...
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerState}>
      <Ionicons
        name="alert-circle-outline"
        size={42}
        color={Colors.onSurfaceVariant}
      />
      <Text style={styles.stateTitle}>
        Unable to load timetable
      </Text>
      <Text style={styles.stateText}>
        {error || 'Please try again.'}
      </Text>

      <Pressable
        style={styles.retryButton}
        onPress={() => {
          setError(null);

          if (tokens?.accessToken) {
            fetch(
              'http://192.168.212.213:5000/api/student/timetable',
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              }
            )
              .then((response) => response.json())
              .then((result) => {
                if (result?.success !== false) {
                  setTimetable(result?.data || []);
                } else {
                  throw new Error(
                    result?.message || 'Failed to load timetable'
                  );
                }
              })
              .catch((err) => {
                setError(
                  err?.message || 'Failed to load timetable'
                );
              });
          }
        }}
      >
        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>
    </View>
  );

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
              AuroMark
            </Text>
            <Text style={styles.headerTitle}>
              Timetable
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push('/(student)/notifications')
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
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => loadTimetable(true)}
    />
  }
>
        {/* Page title */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
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

            <View>
              <Text style={styles.pageTitle}>
                My Timetable
              </Text>

              <Text style={styles.pageSubtitle}>
                B.E Computer Science
              </Text>
            </View>
          </View>
        </View>

        {/* 6-day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScroll}
        >
          <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.dayRow}
>
  {DAYS.map((day) => {
              const active = selectedDay === day.key;

              return (
                <Pressable
                  key={day.key}
                  style={[
                    styles.dayTab,
                    active && styles.dayTabActive,
                  ]}
                  onPress={() => setSelectedDay(day.key)}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      active && styles.dayLabelActive,
                    ]}
                  >
                    {day.label}
                  </Text>

                  <Text
                    style={[
                      styles.dayDate,
                      active && styles.dayDateActive,
                    ]}
                  >
                    {day.date}
                  </Text>

                  <Text
                    style={[
                      styles.dayMonth,
                      active && styles.dayMonthActive,
                    ]}
                  >
                    {day.month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ScrollView>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <View style={styles.dayDot} />

            <Text style={styles.dayHeaderText}>
              {selectedDayInfo?.fullDate || 'Timetable'}
            </Text>
          </View>

          <View style={styles.sessionPill}>
            <Text style={styles.sessionPillText}>
              {sessionCount} Sessions
            </Text>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          <View style={styles.cardsList}>
            {classes.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={30}
                    color={Colors.primaryContainer}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No classes scheduled
                </Text>

                <Text style={styles.emptyText}>
                  There are no timetable sessions scheduled
                  for this day.
                </Text>
              </View>
            ) : (
              classes.map((cls) => {
                let status = getClassStatus(cls);

                /*
                 * Only the first future class on today's schedule
                 * gets the "Next Up" badge.
                 */
                if (
                  status === 'upcoming' &&
                  nextClassId === cls.id
                ) {
                  status = 'upcoming';
                }

                const colors = STATUS_COLORS[status];
                const isOngoing = status === 'ongoing';
                const isNext =
                  status === 'upcoming' &&
                  nextClassId === cls.id;

                return (
                  <View
  key={String(cls.id)}
  style={[
    styles.classCard,
    {
      backgroundColor: colors.bg,
    },
  ]}
>
                    {/* Left strip */}
                    <View
                      style={[
                        styles.statusStrip,
                        {
                          backgroundColor: colors.strip,
                        },
                      ]}
                    />

                    <View style={styles.cardContent}>
                      {/* Time + Status */}
                      <View style={styles.cardRow}>
                        <View style={styles.timeRow}>
                          <Ionicons
                            name={
                              isOngoing
                                ? 'timer-outline'
                                : 'time-outline'
                            }
                            size={16}
                            color={
                              isOngoing
                                ? '#16A34A'
                                : Colors.onSurfaceVariant
                            }
                          />

                          <Text
                            style={[
                              styles.timeText,
                              isOngoing &&
                                styles.timeTextOngoing,
                            ]}
                          >
                            {formatTime(cls.startTime)} –{' '}
                            {formatTime(cls.endTime)}
                          </Text>
                        </View>

                        {isOngoing ? (
                          <View style={styles.ongoingPill}>
                            <View
                              style={styles.ongoingDot}
                            />

                            <Text
                              style={styles.ongoingText}
                            >
                              ONGOING
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor:
                                  Colors.surfaceContainer,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color:
                                    Colors.onSurfaceVariant,
                                },
                              ]}
                            >
                              {isNext
                                ? 'Next Up'
                                : colors.label}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Subject + Section */}
                      <View style={styles.cardRow}>
                        <View style={styles.subjectContainer}>
                          <Text
                            style={[
                              styles.subjectName,
                              isOngoing &&
                                styles.subjectNameOngoing,
                            ]}
                          >
                            {getSubjectName(cls)}
                          </Text>

                          {getSubjectCode(cls) ? (
                            <Text style={styles.subjectCode}>
                              {getSubjectCode(cls)}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.sectionPill}>
                          <Text style={styles.sectionText}>
                            {getSection(cls)}
                          </Text>
                        </View>
                      </View>

                      {isOngoing && (
                        <Text style={styles.ongoingSubtext}>
                          Attendance window currently open
                        </Text>
                      )}

                      {/* Room + Faculty */}
                      <View
                        style={[
                          styles.cardRow,
                          styles.cardFooter,
                        ]}
                      >
                        <View style={styles.roomRow}>
                          <Ionicons
                            name="business-outline"
                            size={15}
                            color={
                              isOngoing
                                ? '#16A34A'
                                : Colors.primaryContainer
                            }
                          />

                          <Text style={styles.roomText}>
                            {cls.room || 'Room not assigned'}
                          </Text>
                        </View>

                        {isOngoing ? (
 <Pressable
  style={styles.verifyRow}
  onPress={() => {
    console.log('VERIFY PRESENCE PRESSED');
    checkAndOpenAttendance(cls);
  }}
>
    <Text style={styles.verifyText}>
      Verify Presence
    </Text>

    <Ionicons
      name="arrow-forward"
      size={14}
      color={Colors.primaryContainer}
    />
  </Pressable>
) : (
                          <Text style={styles.facultyText}>
                            {getFacultyName(cls)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Tip card */}
            {classes.length > 0 && (
              <View style={styles.tipCard}>
                <View style={styles.tipIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={18}
                    color="#5B3FD3"
                  />
                </View>

                <Text style={styles.tipText}>
                  Tap on a class to check whether attendance
verification is currently available.
                </Text>

                <Ionicons
                  name="hand-left-outline"
                  size={18}
                  color="#5B3FD3"
                  style={{ opacity: 0.6 }}
                />
              </View>
            )}
          </View>
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
    paddingHorizontal: Spacing.marginMobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
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
    backgroundColor: Colors.primaryContainer,
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
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },

  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },

  pageTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },

  pageSubtitle: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },

  dayScroll: {
    paddingLeft: Spacing.marginMobile,
    marginBottom: Spacing.md,
  },

  dayRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingRight: Spacing.marginMobile,
    paddingVertical: 4,
  },

  dayTab: {
    minWidth: 62,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    ...Shadow.sm,
  },

  dayTabActive: {
    backgroundColor: Colors.primaryContainer,
  },

  dayLabel: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  dayLabelActive: {
    color: Colors.onPrimary,
    fontWeight: '600',
  },

  dayDate: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    marginTop: 2,
  },

  dayDateActive: {
    ...Typography.headlineMd,
    color: Colors.onPrimary,
  },

  dayMonth: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
  },

  dayMonthActive: {
    color: Colors.onPrimary,
    opacity: 0.9,
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    marginBottom: Spacing.md,
  },

  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryContainer,
  },

  dayHeaderText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },

  sessionPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  sessionPillText: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: '600',
  },

  cardsList: {
    paddingHorizontal: Spacing.marginMobile,
    gap: Spacing.md,
  },

  classCard: {
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.sm,
  },

  statusStrip: {
    width: 4,
  },

  cardContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,197,216,0.3)',
    paddingTop: 8,
    marginTop: 2,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  timeText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },

  timeTextOngoing: {
    color: '#16A34A',
    fontWeight: '700',
  },

  ongoingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  ongoingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },

  ongoingText: {
    ...Typography.labelXs,
    color: '#16A34A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  statusPill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  statusText: {
    ...Typography.labelXs,
    fontWeight: '600',
  },

  subjectContainer: {
    flex: 1,
    marginRight: 8,
  },

  subjectName: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  subjectNameOngoing: {
    fontWeight: '700',
  },

  subjectCode: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  ongoingSubtext: {
    ...Typography.labelXs,
    color: '#16A34A',
    fontWeight: '500',
    marginTop: -4,
  },

  sectionPill: {
    backgroundColor: Colors.secondaryFixed,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  sectionText: {
    ...Typography.labelXs,
    color: Colors.onSecondaryFixed,
    fontWeight: '600',
  },

  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  roomText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontWeight: '500',
  },

  facultyText: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    maxWidth: 150,
    textAlign: 'right',
  },

  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  verifyText: {
    ...Typography.labelXs,
    color: Colors.primaryContainer,
    fontWeight: '600',
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F1EDFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },

  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    flex: 1,
    fontWeight: '500',
  },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },

  stateTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    marginTop: 12,
    textAlign: 'center',
  },

  stateText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  retryText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: '600',
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingVertical: 45,
    paddingHorizontal: 25,
    ...Shadow.sm,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: '600',
    marginTop: 14,
  },

  emptyText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
  },
});