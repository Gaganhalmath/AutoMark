/**
 * SmartAttend — Faculty Class Management
 *
 * Flow:
 * Faculty Dashboard
 *      ↓
 * Class Management
 *      ↓
 * Select one of the faculty's classes
 *      ↓
 * View real class details + enrolled students
 *      ↓
 * Start Attendance
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'http://192.168.212.213:5000/api';

type FacultyClass = {
  id: number;
  semester: number;
  section: string;
  academicYear: string;
  subject: {
    id: number;
    code: string;
    name: string;
    credits: number;
  } | null;
  department: {
    id: number;
    name: string;
    code: string;
  } | null;
};

type ClassDetails = FacultyClass & {
  students: Array<{
    enrollmentId: number;
    studentId: number;
    registerNumber: string | null;
    name: string | null;
    email: string | null;
    semester: number | null;
    section: string | null;
  }>;
  totalStudents: number;
};

type TimetableItem = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  classId: number;
  semester: number | null;
  section: string | null;
  academicYear: string | null;
  subject: {
    id: number;
    code: string;
    name: string;
  } | null;
};

const DAYS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export default function ManageClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const initialParam = params.id ?? params.classId;

  const initialClassId = Array.isArray(initialParam)
    ? Number(initialParam[0])
    : initialParam
      ? Number(initialParam)
      : null;

  const [classes, setClasses] = useState<FacultyClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    Number.isInteger(initialClassId) ? initialClassId : null,
  );

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(
    null,
  );

  const [timetable, setTimetable] = useState<TimetableItem[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId !== null) {
      loadClassDetails(selectedClassId);
    } else {
      setClassDetails(null);
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      setLoadingClasses(false);
      return;
    }

    try {
      setLoadingClasses(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/faculty/classes`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      const text = await response.text();

      let result: any;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          `Classes API returned an invalid response (${response.status}).`,
        );
      }

      console.log('FACULTY CLASSES STATUS:', response.status);
      console.log('FACULTY CLASSES RESPONSE:', result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to load faculty classes.',
        );
      }

      setClasses(result.data || []);

      /*
       * If a class ID was supplied through navigation and it exists
       * in the faculty's actual class list, keep it selected.
       */
      if (
        initialClassId !== null &&
        (result.data || []).some(
          (item: FacultyClass) => Number(item.id) === initialClassId,
        )
      ) {
        setSelectedClassId(initialClassId);
      }
    } catch (err: any) {
      console.error('FACULTY CLASSES ERROR:', err);

      setClasses([]);
      setError(err?.message || 'Unable to load faculty classes.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadClassDetails = async (classId: number) => {
    if (!tokens?.accessToken) {
      setError('Authentication token is missing.');
      return;
    }

    try {
      setLoadingDetails(true);
      setError(null);
      setClassDetails(null);

      const [detailsResponse, timetableResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/faculty/classes/${classId}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }),

        fetch(`${API_BASE_URL}/faculty/timetable`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }),
      ]);

      const detailsText = await detailsResponse.text();
      const timetableText = await timetableResponse.text();

      let detailsResult: any;
      let timetableResult: any;

      try {
        detailsResult = JSON.parse(detailsText);
      } catch {
        throw new Error(
          `Class details returned an invalid response (${detailsResponse.status}).`,
        );
      }

      try {
        timetableResult = JSON.parse(timetableText);
      } catch {
        throw new Error(
          `Timetable returned an invalid response (${timetableResponse.status}).`,
        );
      }

      if (!detailsResponse.ok || !detailsResult.success) {
        throw new Error(
          detailsResult.message || 'Failed to load class details.',
        );
      }

      if (!timetableResponse.ok || !timetableResult.success) {
        throw new Error(
          timetableResult.message || 'Failed to load timetable.',
        );
      }

      setClassDetails(detailsResult.data);
      setTimetable(timetableResult.data || []);

      console.log('CLASS MANAGEMENT DETAILS:', detailsResult.data);
    } catch (err: any) {
      console.error('CLASS MANAGEMENT DETAILS ERROR:', err);

      setClassDetails(null);
      setError(err?.message || 'Unable to load class details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getTimetableForClass = (classId: number) => {
    return timetable.find(
      (item) => Number(item.classId) === Number(classId),
    );
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return 'Not assigned';

    const parts = time.split(':');

    if (parts.length < 2) {
      return time;
    }

    const hour = Number(parts[0]);
    const minute = parts[1];

    if (Number.isNaN(hour)) {
      return time;
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
  };

  const handleStartAttendance = () => {
    if (!selectedClassId) {
      Alert.alert('Class Required', 'Please select a class first.');
      return;
    }

    router.push({
      pathname: '/(faculty)/start-attendance',
      params: {
        id: String(selectedClassId),
      },
    });
  };

  /*
   * CLASS LIST VIEW
   */
  if (selectedClassId === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Class Management</Text>

          <View style={styles.headerSpacer} />
        </View>

        {loadingClasses ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading your classes...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>
              Unable to load classes
            </Text>

            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadClasses}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTitle}>
              No Classes Assigned
            </Text>

            <Text style={styles.emptyText}>
              There are currently no classes assigned to your faculty
              account.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.pageTitle}>Your Classes</Text>

            <Text style={styles.pageSubtitle}>
              Select a class to view its details and enrolled students.
            </Text>

            {classes.map((classItem) => (
              <Pressable
                key={classItem.id}
                style={({ pressed }) => [
                  styles.classCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() =>
  router.push({
    pathname: '/(faculty)/class-details',
    params: {
      id: String(classItem.id),
    },
  })
}
              >
                <View style={styles.classCardTop}>
                  <View style={styles.subjectIcon}>
                    <Text style={styles.subjectIconText}>
                      {(classItem.subject?.code || 'C').charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.classMainInfo}>
                    <Text style={styles.classSubjectName}>
                      {classItem.subject?.name ||
                        'Subject unavailable'}
                    </Text>

                    <Text style={styles.classCode}>
                      {classItem.subject?.code || '—'}
                    </Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </View>

                <View style={styles.classMeta}>
                  <MetaBadge
                    text={`Semester ${classItem.semester}`}
                  />

                  <MetaBadge
                    text={`Section ${classItem.section}`}
                  />

                  <MetaBadge text={classItem.academicYear} />
                </View>

                <Text style={styles.departmentText}>
                  {classItem.department?.name ||
                    classItem.department?.code ||
                    'Department unavailable'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  /*
   * CLASS DETAILS VIEW
   */
  const currentTimetable = getTimetableForClass(selectedClassId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            setSelectedClassId(null);
            setClassDetails(null);
            setError(null);
          }}
        >
          <Text style={styles.backText}>Classes</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Class Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      {loadingDetails ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading class details...
          </Text>
        </View>
      ) : error || !classDetails ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>
            Unable to load class
          </Text>

          <Text style={styles.errorText}>
            {error || 'Class information is unavailable.'}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadClassDetails(selectedClassId)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Subject */}
          <View style={styles.subjectHero}>
            <View style={styles.heroIcon}>
              <Text style={styles.heroIconText}>
                {(classDetails.subject?.code || 'C').charAt(0)}
              </Text>
            </View>

            <Text style={styles.heroSubjectName}>
              {classDetails.subject?.name ||
                'Subject unavailable'}
            </Text>

            <Text style={styles.heroSubjectCode}>
              {classDetails.subject?.code || '—'}
            </Text>
          </View>

          {/* Class Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Class Information
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                label="Semester"
                value={`Semester ${classDetails.semester}`}
              />

              <InfoRow
                label="Section"
                value={classDetails.section}
              />

              <InfoRow
                label="Academic Year"
                value={classDetails.academicYear}
              />

              <InfoRow
                label="Department"
                value={
                  classDetails.department?.name ||
                  classDetails.department?.code ||
                  'Not assigned'
                }
              />

              <InfoRow
                label="Credits"
                value={
                  classDetails.subject?.credits !== undefined
                    ? String(classDetails.subject.credits)
                    : '—'
                }
                last
              />
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>

            <View style={styles.infoCard}>
              <InfoRow
                label="Day"
                value={
                  currentTimetable
                    ? DAYS[currentTimetable.dayOfWeek] ||
                      `Day ${currentTimetable.dayOfWeek}`
                    : 'Not scheduled'
                }
              />

              <InfoRow
                label="Time"
                value={
                  currentTimetable
                    ? `${formatTime(
                        currentTimetable.startTime,
                      )} - ${formatTime(
                        currentTimetable.endTime,
                      )}`
                    : 'Not scheduled'
                }
              />

              <InfoRow
                label="Classroom / Hall"
                value={
                  currentTimetable?.room || 'Not assigned'
                }
                last
              />
            </View>
          </View>

          {/* Students */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Enrolled Students
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {classDetails.totalStudents}
                </Text>
              </View>
            </View>

            {classDetails.students.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No students enrolled
                </Text>

                <Text style={styles.emptyText}>
                  There are currently no students assigned to this
                  class.
                </Text>
              </View>
            ) : (
              <View style={styles.studentsCard}>
                {classDetails.students.map(
                  (student, index) => (
                    <View
                      key={`${student.enrollmentId}-${student.studentId}`}
                      style={[
                        styles.studentRow,
                        index ===
                          classDetails.students.length - 1 &&
                          styles.lastStudentRow,
                      ]}
                    >
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {(student.name || '?')
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.name || 'Unknown Student'}
                        </Text>

                        <Text style={styles.registerNumber}>
                          {student.registerNumber ||
                            'No register number'}
                        </Text>
                      </View>
                    </View>
                  ),
                )}
              </View>
            )}
          </View>

          {/* Attendance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Attendance
            </Text>

            <View style={styles.attendanceCard}>
              <Text style={styles.attendanceTitle}>
                Start Attendance Session
              </Text>

              <Text style={styles.attendanceDescription}>
                Start a BLE attendance session for this class.
                Students with registered devices can then be
                detected and verified.
              </Text>

              <Pressable
                style={styles.startButton}
                onPress={handleStartAttendance}
              >
                <Text style={styles.startButtonText}>
                  Start Attendance
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function MetaBadge({ text }: { text: string }) {
  return (
    <View style={styles.metaBadge}>
      <Text style={styles.metaBadgeText}>{text}</Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.lastInfoRow,
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: Colors.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  errorText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  retryButton: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    minWidth: 60,
  },

  backText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  headerSpacer: {
    width: 60,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },

  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  classCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardPressed: {
    opacity: 0.75,
  },

  classCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  subjectIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  subjectIconText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },

  classMainInfo: {
    flex: 1,
  },

  classSubjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  classCode: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },

  chevron: {
    fontSize: 28,
    color: Colors.textSecondary,
    marginLeft: 8,
  },

  classMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },

  metaBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  departmentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 12,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  subjectHero: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  heroIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },

  heroSubjectName: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.textPrimary,
  },

  heroSubjectCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
  },

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  countBadge: {
    minWidth: 30,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  lastInfoRow: {
    borderBottomWidth: 0,
  },

  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  infoValue: {
    flex: 1.4,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  studentsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  lastStudentRow: {
    borderBottomWidth: 0,
  },

  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },

  studentAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  registerNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 5,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },

  attendanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  attendanceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  attendanceDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginTop: 7,
    marginBottom: 16,
  },

  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: 'center',
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});