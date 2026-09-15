/**
 * SmartAttend — BLE Session Active Screen
 */

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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
import { useAuth } from '../../auth/AuthProvider';
import { BLEService } from '../../services/ble';

const API_BASE_URL =
  'http://192.168.212.213:5000/api';

export default function BleSessionActiveScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { tokens } = useAuth();

  const sessionId =
    params.sessionId as string | undefined;

  const classId =
    params.classId as string | undefined;

  const durationMinutes = parseInt(
    (params.durationMinutes as string) || '1',
    10,
  );

  const initialDuration =
    durationMinutes * 60;

  const [timeLeft, setTimeLeft] =
    useState(initialDuration);

  const [ending, setEnding] =
    useState(false);

  /**
   * Prevents the timer and manual button
   * from finalizing the same session twice.
   */
  const finalizingRef = useRef(false);

  /**
   * Keep track of whether the screen is mounted.
   */
  const mountedRef = useRef(true);

  /**
   * Finalize the current attendance session.
   */
  const finalizeSession = async (
    automatic = false,
  ) => {
    if (!sessionId) {
      console.error(
        'FINALIZE ERROR: Missing session ID',
      );

      return false;
    }

    if (!tokens?.accessToken) {
      console.error(
        'FINALIZE ERROR: Missing authentication token',
      );

      return false;
    }

    /**
     * Prevent duplicate requests.
     */
    if (finalizingRef.current) {
      console.log(
        'FINALIZE: Request already in progress',
      );

      return false;
    }

    finalizingRef.current = true;

    if (mountedRef.current) {
      setEnding(true);
    }

    try {
      console.log(
        automatic
          ? 'AUTO FINALIZE: Attendance window expired'
          : 'MANUAL FINALIZE: Faculty ended session',
      );

      console.log(
        'FINALIZE SESSION ID:',
        sessionId,
      );

      if (automatic) {
  console.log(
    'AUTO FINALIZE: Finalizing expired attendance session',
  );

  const response = await fetch(
    `${API_BASE_URL}/attendance/sessions/${sessionId}/finalize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    },
  );

  const result = await response.json();

  console.log(
    'FINALIZE SESSION STATUS:',
    response.status,
  );

  console.log(
    'FINALIZE SESSION RESPONSE:',
    JSON.stringify(result, null, 2),
  );

  if (!response.ok || !result.success) {
    const message = result.message || '';

    if (
      message
        .toLowerCase()
        .includes('already ended') ||
      message
        .toLowerCase()
        .includes('already finalized')
    ) {
      console.log(
        'SESSION WAS ALREADY FINALIZED',
      );
    } else {
      throw new Error(
        message ||
          'Failed to finalize attendance session',
      );
    }
  }
} else {
  console.log(
    'MANUAL END: Skipping backend finalization. Going to review.',
  );
}

      /**
       * Stop BLE immediately after the backend
       * confirms that the session is closed.
       */
      console.log(
        'SmartAttend BLE: Stopping teacher broadcast',
      );

      BLEService.stopTeacherBroadcast();

      if (!mountedRef.current) {
        return true;
      }

      /**
       * IMPORTANT:
       *
       * Always pass the real session ID.
       *
       * Review screen will fetch the actual
       * attendance participants from backend.
       */
      console.log(
        'GOING TO REVIEW WITH SESSION ID:',
        sessionId,
      );

      router.replace({
        pathname:
          '/(faculty)/attendance-review',

        params: {
          sessionId: String(sessionId),
        },
      });

      return true;
    } catch (error) {
      console.error(
        'FINALIZE SESSION ERROR:',
        error,
      );

      if (mountedRef.current) {
        setEnding(false);
      }

      finalizingRef.current = false;

      return false;
    }
  };

  /**
   * Start BLE broadcasting and attendance timer.
   */
  useEffect(() => {
    mountedRef.current = true;

    const startBle = async () => {
      if (!sessionId) {
        console.error(
          'BLE ERROR: Missing session ID',
        );

        return;
      }

      try {
        console.log(
          'SmartAttend BLE: Requesting Bluetooth permissions...',
        );

        await BLEService.requestPermissions();

        if (!mountedRef.current) {
          return;
        }

        console.log(
          'SmartAttend BLE: Starting teacher broadcast',
        );

        console.log(
          'SmartAttend BLE: Session ID =',
          sessionId,
        );

        BLEService.startTeacherBroadcast(
          sessionId,
        );

        console.log(
          'SmartAttend BLE: Teacher broadcast started successfully',
        );
      } catch (error) {
        console.error(
          'SmartAttend BLE START ERROR:',
          error,
        );
      }
    };

    startBle();

    /**
     * Attendance timer.
     *
     * When it reaches zero, we automatically
     * finalize the backend session.
     */
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          console.log(
            'ATTENDANCE TIMER EXPIRED',
          );

          /**
           * Do NOT call finalizeSession directly
           * inside the state updater.
           *
           * Schedule it after the state update.
           */
          setTimeout(() => {
            finalizeSession(true);
          }, 0);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      mountedRef.current = false;

      clearInterval(timer);

      console.log(
        'SmartAttend BLE: Stopping teacher broadcast',
      );

      BLEService.stopTeacherBroadcast();
    };
  }, [sessionId]);

  /**
   * Format timer.
   */
  const formatTime = (secs: number) => {
    const minutes = Math.floor(
      secs / 60,
    );

    const seconds = secs % 60;

    return `${minutes
      .toString()
      .padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  /**
   * Manual End Session button.
   */
  const handleEndSession = async () => {
    await finalizeSession(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* BLE Status */}
        <View style={styles.radarRing}>
          <Text style={styles.bleIcon}>
            📶
          </Text>

          <Text
            style={styles.broadcastingText}
          >
            {ending
              ? 'Closing Attendance Session'
              : 'Broadcasting BLE Signal'}
          </Text>

          {sessionId && (
            <Text
              style={styles.sessionText}
            >
              Session ID: {sessionId}
            </Text>
          )}

          {classId && (
            <Text
              style={styles.sessionText}
            >
              Class ID: {classId}
            </Text>
          )}
        </View>

        {/* Timer */}
        <Text style={styles.timerDisplay}>
          {formatTime(timeLeft)}
        </Text>

        <Text style={styles.timerSub}>
          {timeLeft === 0
            ? 'Attendance Window Closed'
            : 'Time Remaining in Attendance Window'}
        </Text>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>
              {timeLeft === 0
                ? 'Attendance Session Closed'
                : 'Attendance Session Active'}
            </Text>

            <Text style={styles.statusText}>
              {timeLeft === 0
                ? 'The attendance window has expired. The session is being finalized and student check-ins are now locked.'
                : 'Students can now detect this attendance session through BLE.'}
            </Text>
          </View>
        </View>

        {/* Live Roster */}
        {timeLeft > 0 && !ending && (
          <Pressable
            style={styles.liveBtn}
            onPress={() =>
              router.push({
                pathname:
                  '/(faculty)/live-participation',

                params: {
                  sessionId:
                    String(sessionId),
                },
              })
            }
          >
            <Text
              style={styles.liveBtnText}
            >
              👁 View Live Student Roster
            </Text>
          </Pressable>
        )}
      </View>

      {/* End Session */}
      <Pressable
        style={[
          styles.stopBtn,
          ending &&
            styles.stopBtnDisabled,
        ]}
        disabled={ending || timeLeft === 0}
        onPress={handleEndSession}
      >
        <Text style={styles.stopBtnText}>
          {ending
            ? 'Finalizing Attendance...'
            : timeLeft === 0
              ? 'Attendance Window Closed'
              : 'End Session & Review Attendance'}
        </Text>
      </Pressable>
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

  radarRing: {
    alignItems: 'center',
    marginBottom: 24,
  },

  bleIcon: {
    fontSize: 54,
    marginBottom: 8,
  },

  broadcastingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  sessionText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  timerDisplay: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.textPrimary,
  },

  timerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 32,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },

  statusBox: {
    alignItems: 'center',
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  statusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  liveBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  liveBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  stopBtn: {
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  stopBtnDisabled: {
    opacity: 0.6,
  },

  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});