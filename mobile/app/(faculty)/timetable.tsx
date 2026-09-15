/**
 * SmartAttend — Faculty Timetable
 * Real backend timetable
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../auth/AuthProvider';
import { Colors } from '../../constants/colors';

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

const DAYS = [
  { key: 'Mon', dayNumber: 1 },
  { key: 'Tue', dayNumber: 2 },
  { key: 'Wed', dayNumber: 3 },
  { key: 'Thu', dayNumber: 4 },
  { key: 'Fri', dayNumber: 5 },
  { key: 'Sat', dayNumber: 6 },
];

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

export default function FacultyTimetableScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const getTodayKey = () => {
  const day = new Date().getDay();
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (day === 0) {
    return 'Mon';
  }

  return dayKeys[day - 1];
};

const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const [timetable, setTimetable] = useState<FacultyTimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDayInfo =
    DAYS.find((day) => day.key === selectedDay) || DAYS[0];

  useEffect(() => {
    const loadTimetable = async () => {
      if (!tokens?.accessToken) {
        setLoading(false);
        setError('Authentication token is missing.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          'https://automark-backend-wput.onrender.com/api/faculty/timetable',
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || 'Failed to load faculty timetable',
          );
        }

        setTimetable(result?.data || []);
      } catch (err: any) {
        console.error('Faculty timetable error:', err);

        setError(
          err?.message || 'Failed to load faculty timetable',
        );
      } finally {
        setLoading(false);
      }
    };

    loadTimetable();
  }, [tokens?.accessToken]);

  const classes = useMemo(() => {
    const filtered = timetable.filter(
      (item) =>
        Number(item.dayOfWeek) === selectedDayInfo.dayNumber,
    );

    return [...filtered].sort(
      (a, b) =>
        parseTimeToMinutes(a.startTime) -
        parseTimeToMinutes(b.startTime),
    );
  }, [timetable, selectedDayInfo]);

  const getClassStatus = (
  cls: FacultyTimetableItem,
) => {
  const now = new Date();

  const currentDayNumber =
    now.getDay() === 0 ? 7 : now.getDay();

  if (currentDayNumber !== selectedDayInfo.dayNumber) {
    return 'upcoming' as const;
  }

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const startMinutes = parseTimeToMinutes(
    cls.startTime,
  );

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

  const retry = async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://automark-backend-wput.onrender.com/api/faculty/timetable',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            'Failed to load faculty timetable',
        );
      }

      setTimetable(result?.data || []);
    } catch (err: any) {
      setError(
        err?.message || 'Failed to load faculty timetable',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>
          Faculty Timetable
        </Text>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
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
                  styles.dayTabText,
                  active && styles.dayTabTextActive,
                ]}
              >
                {day.key}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text style={styles.stateText}>
              Loading timetable...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons
              name="alert-circle-outline"
              size={42}
              color={Colors.textSecondary}
            />

            <Text style={styles.stateTitle}>
              Unable to load timetable
            </Text>

            <Text style={styles.stateText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={retry}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={42}
              color={Colors.primary}
            />

            <Text style={styles.emptyTitle}>
              No classes scheduled
            </Text>

            <Text style={styles.emptyText}>
              No classes are scheduled for {selectedDay}.
            </Text>
          </View>
        ) : (
          classes.map((cls) => {
            const status = getClassStatus(cls);

            const isOngoing = status === 'ongoing';

            return (
              <View
                key={String(cls.id)}
                style={[
                  styles.card,
                  isOngoing && styles.cardOngoing,
                ]}
              >
                {/* Time + Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.timeRow}>
                    <Ionicons
                      name={
                        isOngoing
                          ? 'timer-outline'
                          : 'time-outline'
                      }
                      size={17}
                      color={
                        isOngoing
                          ? Colors.success
                          : Colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.timeText,
                        isOngoing &&
                          styles.timeTextOngoing,
                      ]}
                    >
                      {formatTime(cls.startTime)} -{' '}
                      {formatTime(cls.endTime)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isOngoing
                        ? styles.badgeOngoing
                        : styles.badgeUpcoming,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isOngoing
                          ? styles.textOngoing
                          : styles.textUpcoming,
                      ]}
                    >
                      {isOngoing
                        ? 'ONGOING'
                        : status === 'past'
                          ? 'PAST'
                          : 'UPCOMING'}
                    </Text>
                  </View>
                </View>

                {/* Subject */}
                <Text style={styles.subjectText}>
                  {cls.subject?.name || 'Subject'}
                </Text>

                {cls.subject?.code ? (
                  <Text style={styles.subjectCode}>
                    {cls.subject.code}
                  </Text>
                ) : null}

                {/* Details */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />

                  <Text style={styles.metaText}>
                    Section {cls.section || '-'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="business-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />

                  <Text style={styles.metaText}>
                    {cls.room || 'Room not assigned'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="school-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />

                  <Text style={styles.metaText}>
                    Semester {cls.semester || '-'}
                  </Text>
                </View>

                {/* Buttons */}
                <View style={styles.btnRow}>
                  <Pressable
                    style={styles.detailsBtn}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/(faculty)/class-details',
                        params: {
                          id: String(cls.classId),
                        },
                      })
                    }
                  >
                    <Text style={styles.detailsBtnText}>
                      Class Details
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.startBtn}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/(faculty)/start-attendance',
                        params: {
                          id: String(cls.classId),
                        },
                      })
                    }
                  >
                    <Text style={styles.startBtnText}>
                      Start Session
                    </Text>
                  </Pressable>
                </View>
              </View>
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

  daySelector: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },

  dayTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },

  dayTabActive: {
    backgroundColor: Colors.primary,
  },

  dayTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  dayTabTextActive: {
    color: '#FFFFFF',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    gap: 8,
  },

  cardOngoing: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  timeTextOngoing: {
    color: Colors.success,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  badgeOngoing: {
    backgroundColor: '#DCFCE7',
  },

  badgeUpcoming: {
    backgroundColor: '#EEF2FF',
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  textOngoing: {
    color: Colors.success,
  },

  textUpcoming: {
    color: Colors.primary,
  },

  subjectText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },

  subjectCode: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  detailsBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },

  detailsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  startBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },

  startBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },

  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },

  stateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});