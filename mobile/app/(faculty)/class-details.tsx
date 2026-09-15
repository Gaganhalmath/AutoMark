/**
 * SmartAttend — Faculty Class Details Screen
 * Real backend class + enrolled student data
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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

import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

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

type Student = {
  id: number;
  name?: string;
  registerNumber?: string;
  email?: string;
  section?: string;
  semester?: number;
};

type ClassStudentsResponse = {
  success: boolean;
  data?: {
    students?: Student[];
    totalStudents?: number;
  };
  message?: string;
};

const formatTime = (time: string) => {
  if (!time) return '';

  const [hourString, minuteString = '00'] = time.split(':');

  let hour = Number(hourString);

  if (Number.isNaN(hour)) {
    return time;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${minuteString} ${suffix}`;
};

const getDayName = (dayOfWeek: number) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  return days[Number(dayOfWeek)] || 'Unknown Day';
};

const getStatus = (
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) => {
  const now = new Date();

  if (now.getDay() !== Number(dayOfWeek)) {
    return 'UPCOMING';
  }

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = startTime
    .split(':')
    .map(Number);

  const [endHour, endMinute] = endTime
    .split(':')
    .map(Number);

  const startMinutes =
    startHour * 60 + startMinute;

  const endMinutes =
    endHour * 60 + endMinute;

  if (currentMinutes >= endMinutes) {
    return 'PAST';
  }

  if (
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes
  ) {
    return 'ONGOING';
  }

  return 'UPCOMING';
};

export default function ClassDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const classId = params.id
    ? Number(params.id)
    : null;

  const [classData, setClassData] =
    useState<FacultyTimetableItem | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [studentsLoading, setStudentsLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadClassDetails = useCallback(
    async () => {
      if (!tokens?.accessToken) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      if (!classId) {
        setError('Class ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        /*
         * Load the faculty timetable.
         * This gives us the actual class/subject/schedule.
         */
        const timetableResponse = await fetch(
          `${API_BASE_URL}/faculty/timetable`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          },
        );

        const timetableResult =
          await timetableResponse.json();

        console.log(
          'CLASS DETAILS TIMETABLE STATUS:',
          timetableResponse.status,
        );

        if (
          !timetableResponse.ok ||
          !timetableResult.success
        ) {
          throw new Error(
            timetableResult?.message ||
              'Failed to load class details.',
          );
        }

        const timetable: FacultyTimetableItem[] =
          timetableResult.data || [];

        const foundClass = timetable.find(
          (item) =>
            Number(item.classId) ===
            Number(classId),
        );

        if (!foundClass) {
          throw new Error(
            'Class was not found in your timetable.',
          );
        }

        setClassData(foundClass);

        /*
         * Load the actual students enrolled in this class.
         *
         * The backend endpoint used here is:
         * GET /api/faculty/classes/:classId
         *
         * If your backend returns a different structure,
         * we will adjust it after seeing the response.
         */
        setStudentsLoading(true);

        try {
          const studentsResponse =
            await fetch(
              `${API_BASE_URL}/faculty/classes/${classId}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type':
                    'application/json',
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              },
            );

          const studentsResult =
            (await studentsResponse.json()) as ClassStudentsResponse;

          console.log(
            'CLASS STUDENTS STATUS:',
            studentsResponse.status,
          );

          console.log(
            'CLASS STUDENTS RESPONSE:',
            JSON.stringify(studentsResult),
          );

          if (studentsResponse.ok) {
            const responseData =
              studentsResult?.data;

            const actualStudents =
              responseData?.students;

            if (Array.isArray(actualStudents)) {
              setStudents(actualStudents);
            } else {
              setStudents([]);
            }
          } else {
            console.warn(
              'Unable to load class students:',
              studentsResult?.message,
            );

            setStudents([]);
          }
        } catch (studentError) {
          console.error(
            'CLASS STUDENTS ERROR:',
            studentError,
          );

          /*
           * Don't fail the entire class-details screen
           * just because the student list could not load.
           */
          setStudents([]);
        } finally {
          setStudentsLoading(false);
        }
      } catch (err) {
        console.error(
          'CLASS DETAILS ERROR:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load class details.',
        );
      } finally {
        setLoading(false);
      }
    },
    [tokens?.accessToken, classId],
  );

  useFocusEffect(
    useCallback(() => {
      loadClassDetails();
    }, [loadClassDetails]),
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading class details...
        </Text>
      </View>
    );
  }

  if (error || !classData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Unable to load class
        </Text>

        <Text style={styles.errorText}>
          {error ||
            'Class details unavailable.'}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const subjectName =
    classData.subject?.name || 'Subject';

  const subjectCode =
    classData.subject?.code || '-';

  const semester =
    classData.semester ?? '-';

  const section =
    classData.section || '-';

  const room =
    classData.room || 'Room not assigned';

  const status = getStatus(
    classData.dayOfWeek,
    classData.startTime,
    classData.endTime,
  );

  const isOngoing =
    status === 'ONGOING';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Class Details
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Class Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>
              {subjectCode}
            </Text>
          </View>

          <Text style={styles.subjectTitle}>
            {subjectName}
          </Text>

          <Text style={styles.metaSub}>
            Computer Science • Semester {semester}
          </Text>

          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {section}
              </Text>

              <Text style={styles.statLabel}>
                Section
              </Text>
            </View>

            <View style={styles.vDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {semester}
              </Text>

              <Text style={styles.statLabel}>
                Semester
              </Text>
            </View>

            <View style={styles.vDivider} />

            <View style={styles.statBox}>
              <Text
                style={styles.statNum}
                numberOfLines={1}
              >
                {studentsLoading
                  ? '...'
                  : students.length}
              </Text>

              <Text style={styles.statLabel}>
                Students
              </Text>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>
            Schedule & Venue
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Subject
            </Text>

            <Text
              style={styles.infoVal}
              numberOfLines={2}
            >
              {subjectName}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Subject Code
            </Text>

            <Text style={styles.infoVal}>
              {subjectCode}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Section
            </Text>

            <Text style={styles.infoVal}>
              {section}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Semester
            </Text>

            <Text style={styles.infoVal}>
              {semester}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Academic Year
            </Text>

            <Text style={styles.infoVal}>
              {classData.academicYear || '-'}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Day
            </Text>

            <Text style={styles.infoVal}>
              {getDayName(
                classData.dayOfWeek,
              )}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Classroom
            </Text>

            <Text style={styles.infoVal}>
              {room}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Time Window
            </Text>

            <Text style={styles.infoVal}>
              {formatTime(
                classData.startTime,
              )}{' '}
              -{' '}
              {formatTime(
                classData.endTime,
              )}
            </Text>
          </View>

          <View style={styles.hDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Status
            </Text>

            <View
              style={[
                styles.statusTag,
                isOngoing
                  ? styles.tagActive
                  : status === 'PAST'
                    ? styles.tagPast
                    : styles.tagUpcoming,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isOngoing
                    ? styles.textActive
                    : status === 'PAST'
                      ? styles.textPast
                      : styles.textUpcoming,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* Enrolled Students */}
        <View style={styles.card}>
          <View style={styles.studentsHeader}>
            <Text style={styles.cardHeader}>
              Enrolled Students
            </Text>

            <Text style={styles.studentCount}>
              {studentsLoading
                ? 'Loading...'
                : `${students.length} Students`}
            </Text>
          </View>

          {studentsLoading ? (
            <View style={styles.studentLoading}>
              <ActivityIndicator
                size="small"
                color={Colors.primary}
              />

              <Text style={styles.studentLoadingText}>
                Loading enrolled students...
              </Text>
            </View>
          ) : students.length === 0 ? (
            <View style={styles.noStudents}>
              <Text style={styles.noStudentsTitle}>
                No students found
              </Text>

              <Text style={styles.noStudentsText}>
                No enrolled students are available
                for this class.
              </Text>
            </View>
          ) : (
            <View style={styles.studentList}>
              {students.map(
                (student, index) => (
                  <View
                  key={`${student.id}-${student.registerNumber || student.email || index}`}
                    style={styles.studentRow}
                  >
                    <View
                      style={styles.studentNumber}
                    >
                      <Text
                        style={
                          styles.studentNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View
                      style={styles.studentInfo}
                    >
                      <Text
                        style={
                          styles.studentName
                        }
                        numberOfLines={1}
                      >
                        {student.name ||
                          'Student'}
                      </Text>

                      <Text
                        style={
                          styles.studentRegister
                        }
                      >
                        {student.registerNumber ||
                          student.email ||
                          '-'}
                      </Text>
                    </View>
                  </View>
                ),
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <Pressable
            style={styles.startBtn}
            onPress={() =>
              router.push({
                pathname:
                  '/(faculty)/start-attendance',
                params: {
                  id: String(
                    classData.classId,
                  ),
                },
              })
            }
          >
            <Text style={styles.startBtnText}>
              🚀 Start Attendance Session
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              router.push({
                pathname:
                  '/(faculty)/attendance',
              })
            }
          >
            <Text
              style={styles.secondaryBtnText}
            >
              📋 View Attendance History
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
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

  headerSpacer: {
    width: 60,
  },

  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 30,
  },

  bannerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
  },

  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor:
      'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 12,
  },

  codeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  subjectTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },

  metaSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statNum: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  vDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },

  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  studentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  studentCount: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },

  studentLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  studentLoadingText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  noStudents: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  noStudentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  noStudentsText: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  studentList: {
    marginTop: 4,
  },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  studentNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  studentNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
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
    marginTop: 3,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 15,
  },

  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  infoVal: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  hDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },

  tagActive: {
    backgroundColor: '#DCFCE7',
  },

  tagUpcoming: {
    backgroundColor: '#EEF2FF',
  },

  tagPast: {
    backgroundColor: '#F1F5F9',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  textActive: {
    color: Colors.success,
  },

  textUpcoming: {
    color: Colors.primary,
  },

  textPast: {
    color: Colors.textSecondary,
  },

  actionSection: {
    gap: 12,
    marginTop: 4,
  },

  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    elevation: 4,
  },

  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});