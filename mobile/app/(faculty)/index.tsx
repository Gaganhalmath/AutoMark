/**
 * SmartAttend — Faculty Dashboard (Home)
 * Real backend timetable data
 */

import React, {
  useCallback,
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
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import Svg, { Circle } from 'react-native-svg';

import { useAuth } from '../../auth/AuthProvider';
import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';

const API_BASE_URL = 'https://automark-u7nr.onrender.com/api';

type FacultyTimetableItem = {
  id: number | string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  classId: number;
  semester?: number | null;
  section?: string | null;
  academicYear?: string | null;
  subject?: {
    id?: number;
    code?: string;
    name?: string;
  } | null;
};

const parseTimeToMinutes = (time: string) => {
  if (!time) return 0;

  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + (minutes || 0);
};

const formatTime = (time: string) => {
  if (!time) return '';

  const [hourString, minuteString = '00'] = time.split(':');

  let hour = Number(hourString);

  const suffix = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${minuteString} ${suffix}`;
};

const getDayName = (day: number) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  return days[day] || '';
};

export default function FacultyDashboardScreen() {
  const { logout, tokens } = useAuth();
  const router = useRouter();

  const [timetable, setTimetable] = useState<
    FacultyTimetableItem[]
  >([]);

  const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState('');

  /*
   * Load real faculty timetable
   */
  const loadTimetable = useCallback(
  async (isPullToRefresh = false) => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await fetch(
        `${API_BASE_URL}/faculty/timetable`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.message ||
            'Failed to load faculty timetable',
        );
      }

      setTimetable(result.data || []);
    } catch (err) {
      console.error(
        'FACULTY DASHBOARD TIMETABLE ERROR:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load timetable.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  [tokens?.accessToken],
);

useFocusEffect(
  useCallback(() => {
    loadTimetable();
  }, [loadTimetable]),
);

  /*
   * Today's classes
   */
  const todaysClasses = useMemo(() => {
    const today = new Date().getDay();

    return timetable
      .filter(
        (item) =>
          Number(item.dayOfWeek) === today,
      )
      .sort(
        (a, b) =>
          parseTimeToMinutes(a.startTime) -
          parseTimeToMinutes(b.startTime),
      );
  }, [timetable]);

  /*
   * Determine next/current class
   */
  const nextClass = useMemo(() => {
    if (todaysClasses.length === 0) {
      return null;
    }

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    /*
     * First look for an ongoing class.
     */
    const ongoingClass = todaysClasses.find((item) => {
      const start = parseTimeToMinutes(
        item.startTime,
      );

      const end = parseTimeToMinutes(
        item.endTime,
      );

      return (
        currentMinutes >= start &&
        currentMinutes < end
      );
    });

    if (ongoingClass) {
      return ongoingClass;
    }

    /*
     * Otherwise find the next upcoming class.
     */
    const upcomingClass = todaysClasses.find(
      (item) =>
        parseTimeToMinutes(item.startTime) >
        currentMinutes,
    );

    return upcomingClass || todaysClasses[0];
  }, [todaysClasses]);

  /*
   * Status and countdown for next class
   */
  const classStatus = useMemo(() => {
    if (!nextClass) {
      return {
        status: 'none',
        startsInMinutes: 0,
      };
    }

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const startMinutes = parseTimeToMinutes(
      nextClass.startTime,
    );

    const endMinutes = parseTimeToMinutes(
      nextClass.endTime,
    );

    if (
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    ) {
      return {
        status: 'ongoing',
        startsInMinutes: 0,
      };
    }

    if (currentMinutes < startMinutes) {
      return {
        status: 'upcoming',
        startsInMinutes:
          startMinutes - currentMinutes,
      };
    }

    return {
      status: 'past',
      startsInMinutes: 0,
    };
  }, [nextClass]);

  const quickActions = [
    {
      id: 'timetable',
      label: 'Timetable',
      sub: 'Weekly schedule',
      iconBg: '#EAF8ED',
      iconColor: '#16A34A',
      icon: 'calendar-outline' as const,
      onPress: () =>
        router.push('/(faculty)/timetable'),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      sub: 'Mark roll call',
      iconBg: '#EEF4FF',
      iconColor: Colors.primaryContainer,
      icon: 'checkmark-circle-outline' as const,
      onPress: () =>
        router.push('/(faculty)/attendance'),
    },
    {
      id: 'history',
      label: 'Attendance History',
      sub: 'Logs & trends',
      iconBg: '#FFF7E6',
      iconColor: '#D97706',
      icon: 'analytics-outline' as const,
      onPress: () =>
        router.push('/(faculty)/history'),
    },
    {
      id: 'class-mgmt',
      label: 'Class Management',
      sub: 'Batches & rooms',
      iconBg: '#F1EDFF',
      iconColor: Colors.tertiaryContainer,
      icon: 'create-outline' as const,
      onPress: () =>  
        router.push('/(faculty)/manage-class'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      sub: 'Alerts & circulars',
      iconBg: '#FEECEC',
      iconColor: '#DC2626',
      icon: 'notifications-outline' as const,
      onPress: () =>
        router.push('/(faculty)/notifications'),
    },
    {
      id: 'profile',
      label: 'Profile',
      sub: 'Faculty settings',
      iconBg: '#EEF4FF',
      iconColor: Colors.primaryContainer,
      icon: 'person-circle-outline' as const,
      onPress: () =>
        router.push('/(faculty)/profile'),
    },
  ];

  /*
   * Real roster count is not currently returned
   * by /faculty/timetable, so don't invent one.
   */
  const rosterAvatars = ['✓', '✓'];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <SmartAttendLogo size={32} />

          <View>
            <Text style={styles.appBarBrand}>
              AutoMark
            </Text>

            <Text style={styles.appBarTitle}>
              Home
            </Text>
          </View>
        </View>

        <View style={styles.appBarRight}>
          <Pressable
            style={styles.iconBtn}
            hitSlop={8}
            onPress={() =>
              router.push(
                '/(faculty)/notifications',
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.onSurfaceVariant}
            />
          </Pressable>

          <Pressable
            style={styles.avatarCircle}
            onPress={() =>
              router.push('/(faculty)/profile')
            }
          >
            <Ionicons
              name="person"
              size={18}
              color={Colors.onPrimary}
            />
          </Pressable>
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
      colors={[Colors.primary]}
      tintColor={Colors.primary}
    />
  }
>
        {/* Greeting */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetName}>
              Hello, Faculty 👋
            </Text>

            <Text style={styles.greetSub}>
              Faculty Portal • Today's Schedule
            </Text>
          </View>

          <View style={styles.notifWrap}>
            <Pressable
              style={styles.greetNotifBtn}
              hitSlop={8}
              onPress={() =>
                router.push(
                  '/(faculty)/notifications',
                )
              }
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={Colors.onSurface}
              />
            </Pressable>

            <View style={styles.notifDot} />
          </View>
        </View>

        {/* Next Class */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading today's classes...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.loadingCard}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={Colors.error}
            />

            <Text style={styles.loadingText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryBtn}
              onPress={() =>
                router.push('/(faculty)/timetable')
              }
            >
              <Text style={styles.retryBtnText}>
                Open Timetable
              </Text>
            </Pressable>
          </View>
        ) : nextClass ? (
          <View style={styles.heroCard}>
            {/* Decorative SVG */}
            <View
              style={styles.heroDecor}
              pointerEvents="none"
            >
              <Svg
                width={200}
                height={200}
                viewBox="0 0 200 200"
                fill="none"
              >
                <Circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="10 14"
                  strokeWidth="16"
                />

                <Circle
                  cx="100"
                  cy="100"
                  r="50"
                  fill="rgba(255,255,255,0.07)"
                />
              </Svg>
            </View>

            <View style={styles.heroTopRow}>
              <View style={styles.heroNextBadge}>
                <Text style={styles.heroNextLabel}>
                  {classStatus.status === 'ongoing'
                    ? 'Current Class'
                    : 'Next Class'}
                </Text>
              </View>

              <View style={styles.heroStartingPill}>
                <View
                  style={styles.heroGreenDot}
                />

                <Text
                  style={styles.heroStartingText}
                >
                  {classStatus.status ===
                  'ongoing'
                    ? 'Ongoing'
                    : classStatus.status ===
                        'upcoming'
                      ? `Starting in ${classStatus.startsInMinutes}m`
                      : 'Completed'}
                </Text>
              </View>
            </View>

            <View style={styles.heroClassInfo}>
              <Text
                style={styles.heroSubjectName}
              >
                {nextClass.subject?.name ||
                  'Subject'}
              </Text>

              <Text style={styles.heroClassMeta}>
                {nextClass.subject?.code
                  ? `${nextClass.subject.code} • `
                  : ''}
                Section {nextClass.section || '-'} •{' '}
                {nextClass.room ||
                  'Room not assigned'}
              </Text>

              <View style={styles.heroTimeBadge}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={Colors.onTertiary}
                />

                <Text style={styles.heroTimeText}>
                  {getDayName(
                    nextClass.dayOfWeek,
                  )}
                  ,{' '}
                  {formatTime(
                    nextClass.startTime,
                  )}{' '}
                  –{' '}
                  {formatTime(
                    nextClass.endTime,
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.heroBottomRow}>
              <Pressable
                style={styles.viewClassBtn}
                onPress={() =>
                  router.push({
                    pathname:
                      '/(faculty)/class-details',
                    params: {
                      id: String(
                        nextClass.classId,
                      ),
                    },
                  })
                }
              >
                <Text
                  style={styles.viewClassBtnText}
                >
                  VIEW CLASS
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={Colors.primaryContainer}
                />
              </Pressable>

              <View style={styles.rosterAvatars}>
                {rosterAvatars.map(
                  (initials, i) => (
                    <View
                      key={i}
                      style={[
                        styles.rosterAvatar,
                        {
                          backgroundColor:
                            [
                              Colors.secondaryFixed,
                              Colors.primaryFixed,
                            ][i],
                          zIndex:
                            rosterAvatars.length -
                            i,
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.rosterAvatarText
                        }
                      >
                        {initials}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noClassCard}>
            <Ionicons
              name="calendar-outline"
              size={46}
              color={Colors.primary}
            />

            <Text style={styles.noClassTitle}>
              No classes today
            </Text>

            <Text style={styles.noClassText}>
              You have no classes scheduled for
              today.
            </Text>

            <Pressable
              style={styles.retryBtn}
              onPress={() =>
                router.push('/(faculty)/timetable')
              }
            >
              <Text style={styles.retryBtnText}>
                View Timetable
              </Text>
            </Pressable>
          </View>
        )}

        {/* Today's Schedule */}
        <Pressable
          style={styles.scheduleBar}
          onPress={() =>
            router.push('/(faculty)/timetable')
          }
        >
          <View style={styles.scheduleBarLeft}>
            <View
              style={styles.scheduleIconCircle}
            >
              <Ionicons
                name="people-outline"
                size={22}
                color={Colors.primaryContainer}
              />
            </View>

            <View>
              <Text
                style={styles.scheduleBarTitle}
              >
                Today's Schedule
              </Text>

              <Text
                style={styles.scheduleBarSub}
              >
                {todaysClasses.length}{' '}
                {todaysClasses.length === 1
                  ? 'Class'
                  : 'Classes'}{' '}
                Scheduled
              </Text>
            </View>
          </View>

          <View>
            <Text style={styles.schedulePercent}>
              {nextClass
                ? formatTime(nextClass.startTime)
                : '--'}
            </Text>

            <Text
              style={styles.schedulePercentLabel}
            >
              Next Start
            </Text>
          </View>
        </Pressable>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>

            <Text style={styles.sectionMeta}>
              Faculty Portal
            </Text>
          </View>

          <View style={styles.quickGrid}>
            {quickActions.map((qa) => (
              <Pressable
                key={qa.id}
                onPress={qa.onPress}
                style={({ pressed }) => [
                  styles.quickCard,
                  pressed &&
                    styles.quickCardPressed,
                ]}
              >
                <View
                  style={[
                    styles.quickIconCircle,
                    {
                      backgroundColor:
                        qa.iconBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={qa.icon}
                    size={22}
                    color={qa.iconColor}
                  />
                </View>

                <Text
                  style={styles.quickLabel}
                >
                  {qa.label}
                </Text>

                <Text style={styles.quickSub}>
                  {qa.sub}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Campus Broadcast */}
        <Pressable
          style={styles.broadcastCard}
          onPress={() =>
            router.push(
              '/(faculty)/notifications',
            )
          }
        >
          <View style={styles.broadcastIconWrap}>
            <Ionicons
              name="megaphone-outline"
              size={24}
              color={Colors.primaryContainer}
            />
          </View>

          <View style={styles.broadcastContent}>
            <Text
              style={styles.broadcastTitle}
              numberOfLines={1}
            >
              Mid-Term Verification Notice
            </Text>

            <Text
              style={styles.broadcastBody}
              numberOfLines={1}
            >
              Submit CSE semester attendance
              logs by Friday 5 PM.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.outlineVariant}
          />
        </Pressable>

        {/* Logout */}
        <Pressable
          style={styles.logoutBtn}
          onPress={logout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.error}
          />

          <Text style={styles.logoutText}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_PURPLE = Colors.tertiaryContainer;
const ON_PURPLE = Colors.onTertiary;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.xl,
  },

  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor:
      Colors.outlineVariant,
    ...Shadow.sm,
  },

  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  appBarBrand: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: '600',
  },

  appBarTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
  },

  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },

  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },

  greetName: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  greetSub: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },

  notifWrap: {
    position: 'relative',
  },

  greetNotifBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor:
      Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  heroCard: {
    borderRadius: Radius.xl,
    backgroundColor: CARD_PURPLE,
    padding: Spacing.lg,
    overflow: 'hidden',
    gap: Spacing.md,
    ...Shadow.md,
  },

  heroDecor: {
    position: 'absolute',
    right: -32,
    bottom: -32,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroNextBadge: {
    borderRadius: Radius.full,
    backgroundColor:
      `${Colors.surfaceContainerLowest}33`,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
  },

  heroNextLabel: {
    ...Typography.labelXs,
    color: ON_PURPLE,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  heroStartingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor:
      `${Colors.tertiaryContainer}66`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  heroGreenDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: '#34D399',
  },

  heroStartingText: {
    ...Typography.labelXs,
    color: Colors.onTertiaryContainer,
  },

  heroClassInfo: {
    gap: Spacing.xs,
    zIndex: 1,
  },

  heroSubjectName: {
    ...Typography.headlineMd,
    color: ON_PURPLE,
    fontWeight: '700',
  },

  heroClassMeta: {
    ...Typography.bodyMd,
    color: Colors.onTertiaryContainer,
    fontWeight: '500',
  },

  heroTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },

  heroTimeText: {
    ...Typography.labelMd,
    color: ON_PURPLE,
  },

  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },

  viewClassBtn: {
    height: 44,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    backgroundColor:
      Colors.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.sm,
  },

  viewClassBtnText: {
    ...Typography.labelLg,
    color: Colors.primaryContainer,
    fontWeight: '700',
  },

  rosterAvatars: {
    flexDirection: 'row',
  },

  rosterAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CARD_PURPLE,
    marginLeft: -8,
  },

  rosterAvatarText: {
    ...Typography.labelXs,
    color: Colors.onPrimaryFixed,
    fontWeight: '700',
  },

  loadingCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },

  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  noClassCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  noClassTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: '800',
    color: Colors.onSurface,
  },

  noClassText: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  scheduleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor:
      Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },

  scheduleBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  scheduleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleBarTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  scheduleBarSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },

  schedulePercent: {
    ...Typography.labelLg,
    color: Colors.primaryContainer,
    fontWeight: '700',
    textAlign: 'right',
  },

  schedulePercentLabel: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
  },

  section: {
    gap: Spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },

  sectionMeta: {
    ...Typography.labelXs,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  quickCard: {
    width: '47%',
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },

  quickCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },

  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  quickLabel: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  quickSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },

  broadcastCard: {
    backgroundColor:
      Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },

  broadcastIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    backgroundColor:
      Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  broadcastContent: {
    flex: 1,
    minWidth: 0,
  },

  broadcastTitle: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: '600',
  },

  broadcastBody: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },

  logoutText: {
    ...Typography.labelLg,
    color: Colors.error,
  },
});
