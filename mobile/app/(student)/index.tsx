/**
 * SmartAttend — Student Home Screen
 * Design reference: stitch_smartattend_mobile_app_onboarding/student_home/code.html
 *
 * Sections:
 * - Top bar with logo + notification bell
 * - Greeting + USN/dept info
 * - Purple "Next Class" hero card
 * - "Weekly Goal on Track" insight bar
 * - 2×3 Quick Actions grid
 * - Academic daily insight banner
 */
import React, {
  useCallback,
  useState,
} from 'react';
import {
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

import { useAuth } from '../../auth/AuthProvider';
import { SmartAttendLogo } from '../../assets/SmartAttendLogo';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { getStudentDashboard } from '../../api/client';

export default function StudentHomeScreen() {
  const { user, tokens } = useAuth();
  const router = useRouter();
  const [student, setStudent] = React.useState<any>(null);
const [timetable, setTimetable] = React.useState<any[]>([]);
const [attendance, setAttendance] = React.useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadDashboard = useCallback(
  async (isPullToRefresh = false) => {
    try {
      if (!tokens?.accessToken) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      };

      const [
        dashboardResponse,
        timetableResponse,
        attendanceResponse,
      ] = await Promise.all([
        getStudentDashboard(tokens.accessToken),

        fetch(
          'https://automark-u7nr.onrender.com/api/student/timetable',
          { headers },
        ),

        fetch(
          'https://automark-u7nr.onrender.com/api/student/attendance',
          { headers },
        ),
      ]);

      const timetableResult =
        await timetableResponse.json();

      const attendanceResult =
        await attendanceResponse.json();

      if (
        !timetableResponse.ok ||
        !timetableResult.success
      ) {
        throw new Error(
          timetableResult?.message ||
            'Failed to load timetable.',
        );
      }

      if (
        !attendanceResponse.ok ||
        !attendanceResult.success
      ) {
        throw new Error(
          attendanceResult?.message ||
            'Failed to load attendance.',
        );
      }

      setStudent(dashboardResponse.data.student);
      setTimetable(timetableResult.data || []);
      setAttendance(attendanceResult.data || []);
    } catch (err: any) {
      console.error(
        'Student dashboard error:',
        err,
      );

      setError(
        err?.message ||
          'Failed to load dashboard',
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
    loadDashboard();
  }, [loadDashboard]),
);

const totalClasses = attendance.reduce(
  (sum, item) => sum + Number(item.totalClasses || 0),
  0
);

const totalPresent = attendance.reduce(
  (sum, item) => sum + Number(item.present || 0),
  0
);

const overallPercentage =
  totalClasses > 0
    ? Number(((totalPresent / totalClasses) * 100).toFixed(2))
    : 0;

    const getNextClass = (items: any[]) => {
  if (!items || items.length === 0) {
    return null;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const parseTime = (time: string) => {
  if (!time) return 0;

  const parts = time.split(':');

  const hour = Number(parts[0]);
  const minute = Number(parts[1] ?? 0);

  return hour * 60 + minute;
};

  // First: classes happening today
  const todayClasses = items
    .filter(
      (item) =>
        Number(item.dayOfWeek) === currentDay
    )
    .sort(
      (a, b) =>
        parseTime(a.startTime) -
        parseTime(b.startTime)
    );

  // Currently ongoing class
  const ongoingClass = todayClasses.find((item) => {
    const start = parseTime(item.startTime);
    const end = parseTime(item.endTime);

    return currentMinutes >= start && currentMinutes < end;
  });

  if (ongoingClass) {
    return ongoingClass;
  }

  // Next class today
  const nextToday = todayClasses.find(
    (item) =>
      parseTime(item.startTime) > currentMinutes
  );

  if (nextToday) {
    return nextToday;
  }

  // No more classes today.
  // Find the next class in the upcoming days.
  const upcomingClasses = items
    .map((item) => {
      const day = Number(item.dayOfWeek);

      let daysUntil = day - currentDay;

      if (daysUntil <= 0) {
        daysUntil += 7;
      }

      return {
        item,
        daysUntil,
        startMinutes: parseTime(item.startTime),
      };
    })
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil ||
        a.startMinutes - b.startMinutes
    );

  return upcomingClasses[0]?.item || null;
};

const firstClass = getNextClass(timetable);
const isCurrentClass = (() => {
  if (!firstClass) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const parseTime = (time: string) => {
    if (!time) return 0;

    const parts = time.split(':');
    const hour = Number(parts[0]);
    const minute = Number(parts[1] ?? 0);

    return hour * 60 + minute;
  };

  const start = parseTime(firstClass.startTime);
  const end = parseTime(firstClass.endTime);

  return (
    Number(firstClass.dayOfWeek) === currentDay &&
    currentMinutes >= start &&
    currentMinutes < end
  );
})();
const subjectForDetails =
  attendance.length > 0
    ? attendance[0]?.subject?.name || 'Subject Details'
    : firstClass?.subject?.name || 'Subject Details';

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

const formatTime = (time: string) => {
  if (!time) return '';

  const [hourString, minute] = time.split(':');
  let hour = Number(hourString);

  const suffix = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
};

  const quickActions = [
    {
      id: 'attendance',
      label: 'Attendance',
      sub: 'Mark or Verify',
      icon: 'checkmark-circle-outline' as const,
      iconBg: Colors.surfaceContainer,
      iconColor: Colors.primaryContainer,
      onPress: () => router.push('/(student)/attendance'),
    },
    {
      id: 'timetable',
      label: 'Timetable',
      sub: 'Daily Schedule',
      icon: 'calendar-outline' as const,
      iconBg: Colors.surfaceContainerHigh,
      iconColor: Colors.secondary,
      onPress: () => router.push('/(student)/timetable'),
    },
    {
      id: 'profile',
      label: 'My Profile',
      sub: 'Student ID Card',
      icon: 'person-circle-outline' as const,
      iconBg: Colors.tertiaryFixed,
      iconColor: Colors.tertiary,
      onPress: () => router.push('/(student)/profile'),
    },
    {
      id: 'history',
      label: 'Attendance History',
      sub: 'Past Records',
      icon: 'analytics-outline' as const,
      iconBg: Colors.surfaceVariant,
      iconColor: Colors.onSecondaryFixedVariant,
      onPress: () => router.push('/(student)/history'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      sub: 'Campus Alerts',
      icon: 'notifications-outline' as const,
      iconBg: '#FEECEC',
      iconColor: Colors.error,
      onPress: () => router.push('/(student)/notifications'),
    },
    {
  id: 'help',
  label: 'Subject Details',
  sub: subjectForDetails || 'Subject Details',
  icon: 'book-outline' as const,
  iconBg: Colors.secondaryFixed,
  iconColor: Colors.onSecondaryContainer,
  onPress: () => {
    const subjectId =
      attendance[0]?.subject?.id ||
      firstClass?.subject?.id;

    if (subjectId) {
      router.push({
        pathname: '/(student)/subject-details',
        params: {
          id: String(subjectId),
        },
      });
    } else {
      console.log('No subject ID available for Subject Details');
    }
  },
},
  ];
if (loading) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

if (error || !student) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error || 'Unable to load student data'}</Text>
      </View>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Top App Bar ──────────────────────────────────────────────────── */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <SmartAttendLogo size={32} />
          <Text style={styles.appBarTitle}>Student Home</Text>
        </View>
        <View style={styles.appBarRight}>
          <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => router.push('/(student)/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.onSurfaceVariant} />
          </Pressable>
          <Pressable style={styles.avatarCircle} onPress={() => router.push('/(student)/profile')}>
            <Ionicons name="person" size={18} color={Colors.onPrimary} />
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
      onRefresh={() => loadDashboard(true)}
      colors={[Colors.primary]}
      tintColor={Colors.primary}
    />
  }
>
        {/* ── Greeting ─────────────────────────────────────────────────── */}
        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greetName}>
              Hello, {student.name.split(' ')[0]} 👋
            </Text>
            <Text style={styles.greetSub}>
              {student.registerNumber} • Semester {student.semester} • Section {student.section}
            </Text>
          </View>
          <View style={styles.notifBtnWrap}>
            <Pressable style={styles.greetNotifBtn} hitSlop={8} onPress={() => router.push('/(student)/notifications')}>
              <Ionicons name="notifications-outline" size={20} color={Colors.onSurfaceVariant} />
            </Pressable>
            <View style={styles.notifDot} />
          </View>
        </View>

        {/* ── Next Class Hero Card (purple gradient) ───────────────────── */}
        <View style={styles.heroCard}>
          {/* Decorative blobs */}
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />

          <View style={styles.heroInner}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroNextClassBadge}>
                <View style={styles.heroLiveDot} />
                <Text style={styles.heroNextClassLabel}>{isCurrentClass ? 'CURRENT CLASS' : 'NEXT CLASS'}</Text>
              </View>
              <View style={styles.heroTimePill}>
                <Text style={styles.heroTimePillText}>
  {firstClass
    ? getDayName(firstClass.dayOfWeek)
    : 'No schedule'}
</Text>
              </View>
            </View>

            <View style={styles.heroClassInfo}>
              <Text style={styles.heroSubjectName}>
  {firstClass?.subject?.name || 'No class scheduled'}
</Text>

<Text style={styles.heroClassMeta}>
  {firstClass
    ? `${firstClass.subject?.code || ''} • ${firstClass.room || 'Room not assigned'}`
    : 'Check your timetable'}
</Text>
            </View>

            <View style={styles.heroTimeBadge}>
              <Ionicons name="time-outline" size={16} color={Colors.onTertiary} />
              <Text style={styles.heroTimeText}>
  {firstClass
    ? `${getDayName(firstClass.dayOfWeek)}, ${formatTime(firstClass.startTime)} – ${formatTime(firstClass.endTime)}`
    : 'No class scheduled'}
</Text>
            </View>

            <Pressable style={styles.viewTimetableBtn} onPress={() => router.push('/(student)/timetable')}>
              <Text style={styles.viewTimetableBtnText}>VIEW TIMETABLE</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Weekly Goal Bar ──────────────────────────────────────────── */}
        <View style={styles.goalBar}>
          <View style={styles.goalBarLeft}>
            <View style={styles.goalIconCircle}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primaryContainer} />
            </View>
            <View>
            <Text style={styles.goalBarTitle}>
  {overallPercentage >= 75
    ? 'Attendance Goal on Track'
    : 'Attendance Needs Attention'}
</Text>

<Text style={styles.goalBarSub}>
  Overall attendance: {overallPercentage}%
</Text>
</View>
          </View>
          <View style={styles.goalBadge}>
            <Text style={styles.goalBadgeText}>
  {overallPercentage >= 75 ? 'Good' : 'Below 75%'}
</Text>
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionMeta}>Tap to open</Text>
          </View>

          <View style={styles.quickGrid}>
            {quickActions.map((qa) => (
              <Pressable
                key={qa.id}
                onPress={qa.onPress}
                style={({ pressed }) => [
                  styles.quickCard,
                  pressed && styles.quickCardPressed,
                ]}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: qa.iconBg }]}>
                  <Ionicons name={qa.icon} size={22} color={qa.iconColor} />
                </View>
                <Text style={styles.quickLabel}>{qa.label}</Text>
                <Text style={styles.quickSub}>{qa.sub}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Academic Insight Banner ───────────────────────────────────── */}
        <View style={styles.insightBanner}>
          <View style={styles.insightIconCircle}>
            <Ionicons name="school" size={22} color={Colors.primaryContainer} />
          </View>
          <View style={styles.insightTextBlock}>
            <Text style={styles.insightTitle} numberOfLines={1}>
  {firstClass
    ? `Next: ${firstClass.subject?.name || 'Class'}`
    : 'No upcoming class'}
</Text>

<Text style={styles.insightSub} numberOfLines={1}>
  {firstClass
    ? `${firstClass.faculty || 'Faculty'} • ${firstClass.room || 'Room not assigned'} • ${formatTime(firstClass.startTime)}`
    : 'Check your timetable for upcoming classes'}
</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_PURPLE = Colors.tertiaryContainer;
const ON_PURPLE = Colors.onTertiary;

const onSecondaryFixedVariant = '#2e447e';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },

  // App bar
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
    ...Shadow.sm,
  },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  appBarTitle: { ...Typography.titleSm, color: Colors.onSurface },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.full,
  },
  avatarCircle: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Greeting
  greetRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: Spacing.xs,
  },
  greetName: { ...Typography.headlineMd, color: Colors.onSurface },
  greetSub: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  notifBtnWrap: { position: 'relative' },
  greetNotifBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 2, right: 2,
    width: 10, height: 10, borderRadius: Radius.full,
    backgroundColor: Colors.error,
    borderWidth: 2, borderColor: Colors.surface,
  },

  // Hero Card
  heroCard: {
    borderRadius: Radius.xl,
    backgroundColor: CARD_PURPLE,
    padding: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  heroBlob1: {
    position: 'absolute', right: -32, top: -32,
    width: 144, height: 144, borderRadius: Radius.full,
    backgroundColor: Colors.tertiary, opacity: 0.4,
  },
  heroBlob2: {
    position: 'absolute', left: -40, bottom: -40,
    width: 128, height: 128, borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer, opacity: 0.3,
  },
  heroInner: { gap: Spacing.md, zIndex: 1 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroNextClassBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLiveDot: {
    width: 8, height: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceBright,
  },
  heroNextClassLabel: { ...Typography.labelMd, color: `${ON_PURPLE}CC`, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  heroTimePill: {
    backgroundColor: `${Colors.surfaceBright}33`,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 2,
  },
  heroTimePillText: { ...Typography.labelXs, color: ON_PURPLE },
  heroClassInfo: { gap: 2 },
  heroSubjectName: { ...Typography.headlineLg, color: ON_PURPLE },
  heroClassMeta: { ...Typography.bodySm, color: `${ON_PURPLE}E5` },
  heroTimeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: `${ON_PURPLE}1A`,
    borderRadius: Radius.lg,
    paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  heroTimeText: { ...Typography.bodySm, color: ON_PURPLE },
  viewTimetableBtn: {
    height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  viewTimetableBtnText: { ...Typography.labelLg, color: Colors.primaryContainer },

  // Weekly Goal Bar
  goalBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  goalBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalIconCircle: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: `${Colors.secondaryContainer}66`,
    alignItems: 'center', justifyContent: 'center',
  },
  goalBarTitle: { ...Typography.labelMd, color: Colors.onSurface, fontWeight: '600' },
  goalBarSub: { ...Typography.labelXs, color: Colors.onSurfaceVariant },
  goalBadge: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  goalBadgeText: { ...Typography.labelXs, color: Colors.primary, fontWeight: '700' },

  // Quick Actions
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...Typography.titleSm, color: Colors.onSurface },
  sectionMeta: { ...Typography.labelXs, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  quickCard: {
    width: '47%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
    gap: 4,
  },
  quickCardPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  quickIconWrap: {
    width: 40, height: 40, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickLabel: { ...Typography.labelLg, color: Colors.onSurface },
  quickSub: { ...Typography.labelXs, color: Colors.onSurfaceVariant },

  // Insight Banner
  insightBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl, padding: Spacing.md,
  },
  insightIconCircle: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    ...Shadow.sm,
  },
  insightTextBlock: { flex: 1, minWidth: 0 },
  insightTitle: { ...Typography.labelMd, color: Colors.onSurface, fontWeight: '600' },
  insightSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant },
});
