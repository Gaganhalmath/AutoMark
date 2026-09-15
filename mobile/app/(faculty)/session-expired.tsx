/**
 * SmartAttend — Session Expired Screen
 *
 * This screen is shown when the attendance collection
 * window has ended.
 *
 * Expected route params:
 *   sessionId
 *   classId
 *   subjectName
 *   subjectCode
 *   section
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Colors } from '../../constants/colors';

export default function SessionExpiredScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    sessionId?: string;
    classId?: string;
    subjectName?: string;
    subjectCode?: string;
    section?: string;
  }>();

  const sessionId = params.sessionId;
  const classId = params.classId;

  const subjectName =
    params.subjectName ||
    'Attendance Session';

  const subjectCode =
    params.subjectCode || '';

  const section =
    params.section ||
    'Section not available';

  /**
   * Current time is displayed because the exact
   * auto-close timestamp is not supplied by the
   * backend to this screen.
   */
  const autoClosedAt = new Date().toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  /**
   * Go to attendance review with the REAL session ID.
   *
   * Review screen will then load the actual
   * participants from the backend.
   */
  const handleReview = () => {
    if (!sessionId) {
      console.error(
        'SESSION EXPIRED: Missing sessionId',
      );

      return;
    }

    router.replace({
      pathname:
        '/(faculty)/attendance-review',
      params: {
        sessionId: String(sessionId),
      },
    });
  };

  /**
   * Start a NEW attendance session for the same
   * class.
   *
   * This is intentionally NOT called "Re-open",
   * because the backend currently does not provide
   * an endpoint for extending an existing session.
   */
  const handleStartNewSession = () => {
    if (!classId) {
      console.error(
        'SESSION EXPIRED: Missing classId',
      );

      return;
    }

    router.push({
      pathname:
        '/(faculty)/start-attendance',
      params: {
        id: String(classId),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Expired Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⏱️</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Attendance Window Expired
        </Text>

        <Text style={styles.subtitle}>
          The attendance collection window for this
          class session has ended. Student check-ins
          are now locked.
        </Text>

        {/* Session Information */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>
            Session Information
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Subject
            </Text>

            <Text
              style={styles.val}
              numberOfLines={2}
            >
              {subjectName}
            </Text>
          </View>

          {subjectCode ? (
            <View style={styles.row}>
              <Text style={styles.label}>
                Code
              </Text>

              <Text style={styles.val}>
                {subjectCode}
              </Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.label}>
              Section
            </Text>

            <Text style={styles.val}>
              {section}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Session ID
            </Text>

            <Text style={styles.val}>
              {sessionId || 'Unavailable'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Auto-Closed At
            </Text>

            <Text style={styles.val}>
              {autoClosedAt}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.btnCol}>
        {/* Review / Finalize */}
        <Pressable
          style={[
            styles.reviewBtn,
            !sessionId &&
              styles.disabledBtn,
          ]}
          disabled={!sessionId}
          onPress={handleReview}
        >
          <Text style={styles.reviewBtnText}>
            Proceed to Review & Finalize
          </Text>
        </Pressable>

        {/* Start New Session */}
        <Pressable
          style={[
            styles.newSessionBtn,
            !classId &&
              styles.disabledSecondaryBtn,
          ]}
          disabled={!classId}
          onPress={handleStartNewSession}
        >
          <Text
            style={styles.newSessionBtnText}
          >
            Start New Session
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  icon: {
    fontSize: 48,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    gap: 12,
  },

  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },

  label: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  val: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  btnCol: {
    gap: 12,
    marginBottom: 16,
  },

  reviewBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  newSessionBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  newSessionBtnText: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '700',
  },

  disabledBtn: {
    opacity: 0.5,
  },

  disabledSecondaryBtn: {
    opacity: 0.5,
  },
});