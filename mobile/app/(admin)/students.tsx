/**
 * SmartAttend — Admin Student Management Screen
 * Connected to real backend student data.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { Colors } from '../../constants/colors';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../auth/AuthProvider';

type AdminStudent = {
  id: number;
  name: string;
  usn: string;
  department: string;
  semester: string | number;
  section?: string | null;
  academicYear?: string | null;
  email?: string | null;
  deviceBound: boolean;
  boundDeviceName?: string | null;
};

type StudentsResponse = {
  success: boolean;
  data: AdminStudent[];
  message?: string;
};

export default function StudentManagementScreen() {
  const router = useRouter();
  const { tokens } = useAuth();

  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = useCallback(
    async (isRefresh = false) => {
      if (!tokens?.accessToken) {
        setError('Authentication token is missing.');
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

        setError('');

        const response =
          await apiRequest<StudentsResponse>(
            '/admin/students',
            {
              method: 'GET',
              token: tokens.accessToken,
            },
          );

        console.log(
          'ADMIN STUDENTS RESPONSE:',
          response,
        );

        setStudents(response.data ?? []);
      } catch (err) {
        console.error(
          'ADMIN STUDENTS FETCH ERROR:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load students.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tokens?.accessToken],
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.name
          ?.toLowerCase()
          .includes(searchText) ||
        student.usn
          ?.toLowerCase()
          .includes(searchText) ||
        student.department
          ?.toLowerCase()
          .includes(searchText) ||
        student.email
          ?.toLowerCase()
          .includes(searchText)
      );
    });
  }, [students, query]);

  const openStudentProfile = (
    student: AdminStudent,
  ) => {
    router.push({
      pathname: '/(admin)/student-profile',
      params: {
        id: String(student.id),
        usn: student.usn,
      },
    });
  };

  const openStudentSetup = () => {
    router.push('/(admin)/student-setup');
  };

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
          Student Management
        </Text>

        <Pressable onPress={openStudentSetup}>
          <Text style={styles.addText}>
            + Add
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search student by USN, Name or Dept..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {/* Loading */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading students...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>
            Unable to load students
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => fetchStudents()}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) =>
            String(item.id)
          }
          contentContainerStyle={[
            styles.listContent,
            filteredStudents.length === 0 &&
              styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStudents(true)}
              colors={[Colors.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {query.trim()
                  ? 'No students found'
                  : 'No students available'}
              </Text>

              <Text style={styles.emptyText}>
                {query.trim()
                  ? 'Try another name, USN or department.'
                  : 'Add a student to see them here.'}
              </Text>

              {!query.trim() && (
                <Pressable
                  style={styles.emptyAddButton}
                  onPress={openStudentSetup}
                >
                  <Text
                    style={
                      styles.emptyAddButtonText
                    }
                  >
                    + Add Student
                  </Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                openStudentProfile(item)
              }
            >
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name
                    ? item.name
                        .charAt(0)
                        .toUpperCase()
                    : '?'}
                </Text>
              </View>

              {/* Student information */}
              <View style={styles.info}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <Text
                  style={styles.usn}
                  numberOfLines={1}
                >
                  {item.usn} • {item.department} •
                  {' '}Sem {item.semester}
                </Text>

                <Text
                  style={styles.deviceInfo}
                  numberOfLines={1}
                >
                  Device:{' '}
                  {item.deviceBound
                    ? item.boundDeviceName ||
                      'Registered Device'
                    : 'No Device Registered'}
                </Text>
              </View>

              {/* Device status */}
              <View
                style={[
                  styles.statusPill,
                  item.deviceBound
                    ? styles.pillSuccess
                    : styles.pillWarning,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.deviceBound
                      ? styles.textSuccess
                      : styles.textWarning,
                  ]}
                >
                  {item.deviceBound
                    ? 'Bound'
                    : 'Pending'}
                </Text>
              </View>
            </Pressable>
          )}
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

  addText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },

  searchContainer: {
    padding: 16,
  },

  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    elevation: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  usn: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  deviceInfo: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },

  pillSuccess: {
    backgroundColor: '#DCFCE7',
  },

  pillWarning: {
    backgroundColor: '#FEF3C7',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  textSuccess: {
    color: Colors.success,
  },

  textWarning: {
    color: Colors.warning,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  emptyAddButton: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});