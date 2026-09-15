/**
 * SmartAttend — Live Student Participation Screen
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'https://automark-backend-wput.onrender.com/api';

interface BackendParticipant {
  studentId: number | null;
  registerNumber: string | null;
  name: string | null;
  email: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  source: 'BLE' | 'MANUAL' | null;
  attendanceId: number | null;
}

interface StudentItem {
  studentId: number;
  studentUsn: string;
  studentName: string;
  status: 'Present' | 'Absent' | 'Late';
  source: string | null;
  time?: string;
}

export default function LiveParticipationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { tokens } = useAuth();

  const sessionId = params.sessionId as string | undefined;

  const [filter, setFilter] = useState<
    'all' | 'present' | 'absent'
  >('all');

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!sessionId) {
      setError('Attendance session ID is missing');
      setLoading(false);
      return;
    }

    if (!tokens?.accessToken) {
      setError('Authentication token is missing');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/attendance/sessions/${sessionId}/participants`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const result = await response.json();

      console.log(
        'PARTICIPANTS STATUS:',
        response.status
      );

      console.log(
        'PARTICIPANTS RESPONSE:',
        result
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to fetch participants'
        );
      }

      const backendParticipants: BackendParticipant[] =
        result.data?.participants ?? [];

      const mappedStudents: StudentItem[] =
        backendParticipants
          .filter(
            (student) =>
              student.studentId !== null
          )
          .map((student) => ({
            studentId: student.studentId!,
            studentUsn:
              student.registerNumber ?? 'N/A',
            studentName:
              student.name ?? 'Unknown Student',
            status:
              student.status === 'PRESENT'
                ? 'Present'
                : student.status === 'LATE'
                  ? 'Late'
                  : 'Absent',
            source: student.source,
          }));

      setStudents(mappedStudents);
      setError(null);
    } catch (err) {
      console.error(
        'FETCH PARTICIPANTS ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load student roster'
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, tokens?.accessToken]);

  useEffect(() => {
    fetchParticipants();

    // Refresh roster every 5 seconds
    const refreshTimer = setInterval(() => {
      fetchParticipants();
    }, 5000);

    return () => {
      clearInterval(refreshTimer);
    };
  }, [fetchParticipants]);

  const filteredStudents = students.filter(
    (student) => {
      if (filter === 'present') {
        return student.status === 'Present';
      }

      if (filter === 'absent') {
        return student.status === 'Absent';
      }

      return true;
    }
  );

  const presentCount = students.filter(
    (student) => student.status === 'Present'
  ).length;

  const absentCount = students.filter(
    (student) => student.status === 'Absent'
  ).length;

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
          Live Student Roster
        </Text>

        <View style={{ width: 60 }} />
      </View>

      {/* Session Information */}
      <View style={styles.sessionBar}>
        <Text style={styles.sessionLabel}>
          Attendance Session
        </Text>

        <Text style={styles.sessionId}>
          #{sessionId ?? 'N/A'}
        </Text>
      </View>

      {/* Filter Chips */}
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
            All ({students.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.chip,
            filter === 'present' &&
              styles.chipActive,
          ]}
          onPress={() =>
            setFilter('present')
          }
        >
          <Text
            style={[
              styles.chipText,
              filter === 'present' &&
                styles.chipTextActive,
            ]}
          >
            Present ({presentCount})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.chip,
            filter === 'absent' &&
              styles.chipActive,
          ]}
          onPress={() =>
            setFilter('absent')
          }
        >
          <Text
            style={[
              styles.chipText,
              filter === 'absent' &&
                styles.chipTextActive,
            ]}
          >
            Absent ({absentCount})
          </Text>
        </Pressable>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading student roster...
          </Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Unable to load roster
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryBtn}
            onPress={fetchParticipants}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      {/* Roster List */}
      {!loading && !error && (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) =>
            item.studentId.toString()
          }
          contentContainerStyle={
            styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No students found
              </Text>

              <Text style={styles.emptyText}>
                No students are enrolled in this
                class.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPresent =
              item.status === 'Present';

            const isLate =
              item.status === 'Late';

            return (
              <View style={styles.itemCard}>
                <View style={styles.avatar}>
                  <Text
                    style={styles.avatarText}
                  >
                    {item.studentName
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.name}>
                    {item.studentName}
                  </Text>

                  <Text style={styles.usn}>
                    {item.studentUsn}
                  </Text>

                  {item.source && (
                    <Text style={styles.source}>
                      Source: {item.source}
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isPresent
                      ? styles.bgSuccess
                      : isLate
                        ? styles.bgLate
                        : styles.bgAbsent,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isPresent
                        ? styles.textSuccess
                        : isLate
                          ? styles.textLate
                          : styles.textAbsent,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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

  sessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
  },

  sessionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  sessionId: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '800',
  },

  filterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  chipTextActive: {
    color: '#FFFFFF',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    elevation: 1,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 16,
  },

  itemInfo: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  usn: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  source: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  bgSuccess: {
    backgroundColor: '#DCFCE7',
  },

  bgAbsent: {
    backgroundColor: '#FEE2E2',
  },

  bgLate: {
    backgroundColor: '#FEF3C7',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  textSuccess: {
    color: Colors.success,
  },

  textAbsent: {
    color: Colors.error,
  },

  textLate: {
    color: '#B45309',
  },

  center: {
    flex: 1,
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
    paddingTop: 60,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});