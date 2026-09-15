/**
 * SmartAttend — Admin Student Profile & Device Management Screen
 * Connected to real backend data.
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Colors } from '../../constants/colors';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../auth/AuthProvider';

type StudentDevice = {
  id: number;
  publicKey: string;
  isActive: boolean;
};

type AdminStudentProfile = {
  id: number;
  userId: number;

  name: string;
  email: string | null;

  usn: string;

  department: string;
  departmentId: number;

  semester: number;
  section: string | null;
  academicYear: string | null;

  attendancePercentage: number;

  deviceBound: boolean;
  deviceCount: number;
  activeDeviceCount: number;

  device: StudentDevice | null;
};

type StudentProfileResponse = {
  success: boolean;
  data: AdminStudentProfile;
  message?: string;
};

type UnbindResponse = {
  success: boolean;
  message?: string;
  data?: {
    studentId: number;
    unboundCount: number;
    deviceBound: boolean;
  };
};

export default function AdminStudentProfileScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const studentId = Number(params.id);

  const [student, setStudent] =
    useState<AdminStudentProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unbindLoading, setUnbindLoading] =
    useState(false);

  const [error, setError] = useState('');

  /**
   * In-screen message modal.
   *
   * This replaces Alert.alert() so Android does not
   * try to display a native alert when the Activity
   * is being detached/unmounted.
   */
  const [messageModal, setMessageModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  /**
   * Device unbind confirmation modal.
   */
  const [confirmModalVisible, setConfirmModalVisible] =
    useState(false);

  /**
   * Show an in-screen message.
   */
  const showMessage = useCallback(
    (title: string, message: string) => {
      setMessageModal({
        visible: true,
        title,
        message,
      });
    },
    [],
  );

  /**
   * Close message modal.
   */
  const closeMessageModal = useCallback(() => {
    setMessageModal((current) => ({
      ...current,
      visible: false,
    }));
  }, []);

  /**
   * Fetch the complete student profile.
   */
  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (!tokens?.accessToken) {
        setError(
          'Authentication token is missing.',
        );

        setLoading(false);
        setRefreshing(false);

        return;
      }

      if (
        !studentId ||
        Number.isNaN(studentId)
      ) {
        setError('Invalid student ID.');

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
          await apiRequest<StudentProfileResponse>(
            `/admin/students/${studentId}`,
            {
              method: 'GET',
              token: tokens.accessToken,
            },
          );

        console.log(
          'ADMIN STUDENT PROFILE:',
          response,
        );

        setStudent(response.data);
      } catch (err) {
        console.error(
          'ADMIN STUDENT PROFILE ERROR:',
          err,
        );

        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load student profile.';

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId, tokens?.accessToken],
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Open the confirmation modal.
   */
  const handleUnbind = useCallback(() => {
    if (!student || unbindLoading) {
      return;
    }

    setConfirmModalVisible(true);
  }, [student, unbindLoading]);

  /**
   * Cancel unbind operation.
   */
  const cancelUnbind = useCallback(() => {
    if (unbindLoading) {
      return;
    }

    setConfirmModalVisible(false);
  }, [unbindLoading]);

  /**
   * Actually unbind the device.
   */
  const confirmUnbind = useCallback(async () => {
    if (
      !student ||
      !tokens?.accessToken ||
      unbindLoading
    ) {
      return;
    }

    try {
      setConfirmModalVisible(false);
      setUnbindLoading(true);

      const response =
        await apiRequest<UnbindResponse>(
          `/admin/students/${student.id}/unbind-device`,
          {
            method: 'POST',
            token: tokens.accessToken,
          },
        );

      console.log(
        'ADMIN DEVICE UNBIND RESPONSE:',
        response,
      );

      /**
       * Reload from backend so the UI reflects
       * the actual database state.
       */
      await loadProfile(true);

      /**
       * Show success message only after the
       * database state has been refreshed.
       */
      showMessage(
        'Device Unbound',
        response.message ||
          'The student device has been unbound successfully.',
      );
    } catch (err) {
      console.error(
        'ADMIN DEVICE UNBIND ERROR:',
        err,
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to unbind the device.';

      showMessage(
        'Unbind Failed',
        message,
      );
    } finally {
      setUnbindLoading(false);
    }
  }, [
    student,
    tokens?.accessToken,
    unbindLoading,
    loadProfile,
    showMessage,
  ]);

  /**
   * Mask the public key.
   */
  const getMaskedPublicKey = (
    publicKey: string,
  ) => {
    if (!publicKey) {
      return 'Unavailable';
    }

    if (publicKey.length <= 12) {
      return publicKey;
    }

    return `${publicKey.slice(
      0,
      6,
    )}••••${publicKey.slice(-6)}`;
  };

  /**
   * Loading screen.
   */
  if (loading) {
    return (
      <View style={styles.container}>
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
            Student Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading student profile...
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Error screen.
   */
  if (error || !student) {
    return (
      <View style={styles.container}>
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
            Student Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>
            Unable to load profile
          </Text>

          <Text style={styles.errorText}>
            {error || 'Student not found.'}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => loadProfile()}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
          Student Hardware Audit
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Student Banner */}
        <View style={styles.banner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {student.name
                ? student.name
                    .charAt(0)
                    .toUpperCase()
                : '?'}
            </Text>
          </View>

          <Text style={styles.name}>
            {student.name}
          </Text>

          <Text style={styles.usn}>
            {student.usn} • {student.department}
          </Text>

          <Text style={styles.email}>
            {student.email ||
              'No email available'}
          </Text>
        </View>

        {/* Hardware Binding */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Hardware Binding Info
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Binding Status
            </Text>

            <View
              style={[
                styles.badge,
                student.deviceBound
                  ? styles.badgeSuccess
                  : styles.badgeWarning,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  student.deviceBound
                    ? styles.textSuccess
                    : styles.textWarning,
                ]}
              >
                {student.deviceBound
                  ? 'Active Lock'
                  : 'No Device Bound'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Registered Devices
            </Text>

            <Text style={styles.val}>
              {student.deviceCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Active Devices
            </Text>

            <Text style={styles.val}>
              {student.activeDeviceCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Public Key
            </Text>

            <Text
              style={styles.val}
              numberOfLines={1}
            >
              {student.device
                ? getMaskedPublicKey(
                    student.device.publicKey,
                  )
                : 'Unregistered'}
            </Text>
          </View>

          {student.deviceBound && (
            <Pressable
              style={[
                styles.unbindBtn,
                unbindLoading &&
                  styles.unbindBtnDisabled,
              ]}
              onPress={handleUnbind}
              disabled={unbindLoading}
            >
              {unbindLoading ? (
                <ActivityIndicator
                  color={Colors.error}
                />
              ) : (
                <Text style={styles.unbindBtnText}>
                  🔓 Reset & Unbind Hardware Lock
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Academic Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Academic Records
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Overall Attendance Rate
            </Text>

            <Text
              style={[
                styles.val,
                styles.attendanceValue,
              ]}
            >
              {student.attendancePercentage}%
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Semester
            </Text>

            <Text style={styles.val}>
              Semester {student.semester}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Section
            </Text>

            <Text style={styles.val}>
              {student.section || 'N/A'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Academic Year
            </Text>

            <Text style={styles.val}>
              {student.academicYear ||
                'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* UNBIND CONFIRMATION MODAL */}
      {/* ================================================== */}

      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelUnbind}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>
                🔓
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              Unbind Device?
            </Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to unbind the
              device from{' '}
              <Text style={styles.modalStudentName}>
                {student.name}
              </Text>
              ?
            </Text>

            <Text style={styles.modalSubMessage}>
              The student will need to register a
              device again before using attendance.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={cancelUnbind}
                disabled={unbindLoading}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmButton,
                  unbindLoading &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={confirmUnbind}
                disabled={unbindLoading}
              >
                {unbindLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={
                      styles.confirmButtonText
                    }
                  >
                    Unbind Device
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================== */}
      {/* RESULT MESSAGE MODAL */}
      {/* ================================================== */}

      <Modal
        visible={messageModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeMessageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIcon,
                messageModal.title ===
                  'Device Unbound'
                  ? styles.successIcon
                  : styles.errorIcon,
              ]}
            >
              <Text style={styles.modalIconText}>
                {messageModal.title ===
                'Device Unbound'
                  ? '✓'
                  : '!' }
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              {messageModal.title}
            </Text>

            <Text style={styles.modalMessage}>
              {messageModal.message}
            </Text>

            <Pressable
              style={styles.okButton}
              onPress={closeMessageModal}
            >
              <Text style={styles.okButtonText}>
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

  headerSpacer: {
    width: 60,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },

  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,

    backgroundColor: '#EEF2FF',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 12,
  },

  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },

  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  usn: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
  },

  email: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },

  label: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  val: {
    maxWidth: '55%',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  attendanceValue: {
    color: Colors.success,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },

  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  textSuccess: {
    color: Colors.success,
  },

  textWarning: {
    color: Colors.warning,
  },

  unbindBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 48,
  },

  unbindBtnDisabled: {
    opacity: 0.7,
  },

  unbindBtnText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 14,
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

  /* ============================= */
  /* MODALS */
  /* ============================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },

  modalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  successIcon: {
    backgroundColor: '#DCFCE7',
  },

  errorIcon: {
    backgroundColor: '#FEE2E2',
  },

  modalIconText: {
    fontSize: 27,
    fontWeight: '800',
    color: Colors.primary,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  modalMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  modalStudentName: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  modalSubMessage: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  modalButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  confirmButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmButtonDisabled: {
    opacity: 0.7,
  },

  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  okButton: {
    width: '100%',
    minHeight: 48,
    marginTop: 22,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  okButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});