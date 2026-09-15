/**
 * SmartAttend — Finalize Attendance Screen
 * Real backend implementation
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../auth/AuthProvider';

const API_BASE_URL = 'https://automark-backend-wput.onrender.com/api';

type Participant = {
  studentId: number;
  registerNumber: string | null;
  name: string | null;
  email: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  source: string | null;
  attendanceId: number | null;
};

export default function FinalizeAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tokens } = useAuth();

  const sessionId = params.sessionId as string | undefined;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState('');

  const fetchParticipants = useCallback(async () => {
    if (!sessionId || !tokens?.accessToken) {
      setError('Session information is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/attendance/sessions/${sessionId}/participants`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      const result = await response.json();

      console.log('FINAL ATTENDANCE STATUS:', response.status);
      console.log('FINAL ATTENDANCE RESPONSE:', result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to load final attendance',
        );
      }

      setParticipants(result.data?.participants || []);
    } catch (err) {
      console.error('FINAL ATTENDANCE ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load final attendance',
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, tokens?.accessToken]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleFinalize = async () => {
    if (!sessionId || !tokens?.accessToken) {
      Alert.alert(
        'Error',
        'Session information is missing.',
      );
      return;
    }

    Alert.alert(
      'Finalize Attendance',
      'Are you sure you want to finalize this attendance session? Once finalized, attendance cannot be modified.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Finalize',
          style: 'destructive',
          onPress: async () => {
            try {
              setFinalizing(true);
              setError('');

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
                'FINALIZE ATTENDANCE STATUS:',
                response.status,
              );
              console.log(
                'FINALIZE ATTENDANCE RESPONSE:',
                result,
              );

              if (!response.ok || !result.success) {
                throw new Error(
                  result.message ||
                    'Failed to finalize attendance session',
                );
              }

              /*
               * The backend creates ABSENT records for all
               * enrolled students who were not marked.
               *
               * Fetch participants again so the final counts
               * represent the finalized session.
               */
              await fetchParticipants();

              setFinalized(true);

              Alert.alert(
                'Attendance Finalized',
                'The attendance session has been successfully finalized.',
              );
            } catch (err) {
              console.error(
                'FINALIZE ATTENDANCE ERROR:',
                err,
              );

              Alert.alert(
                'Finalization Failed',
                err instanceof Error
                  ? err.message
                  : 'Failed to finalize attendance',
              );
            } finally {
              setFinalizing(false);
            }
          },
        },
      ],
    );
  };

  const presentCount = participants.filter(
    (student) => student.status === 'PRESENT',
  ).length;

  const absentCount = participants.filter(
    (student) => student.status === 'ABSENT',
  ).length;

  const lateCount = participants.filter(
    (student) => student.status === 'LATE',
  ).length;

  const totalCount = participants.length;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading final attendance...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.homeBtn}
          onPress={() => router.replace('/(faculty)')}
        >
          <Text style={styles.homeBtnText}>
            Return to Faculty Dashboard
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View
          style={[
            styles.checkCircle,
            finalized && styles.finalizedCircle,
          ]}
        >
          <Text style={styles.icon}>
            {finalized ? '🔒' : '⚠️'}
          </Text>
        </View>

        <Text style={styles.title}>
          {finalized
            ? 'Ledger Locked & Finalized'
            : 'Finalize Attendance'}
        </Text>

        <Text style={styles.subtitle}>
          {finalized
            ? 'The attendance session has been permanently recorded and finalized successfully.'
            : 'Review the attendance summary below. Finalizing will mark all unrecorded students as absent and lock the session.'}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>
              Session ID
            </Text>

            <Text style={styles.val}>
              #{sessionId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Total Students
            </Text>

            <Text style={styles.val}>
              {totalCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Present Count
            </Text>

            <Text
              style={[
                styles.val,
                { color: Colors.success },
              ]}
            >
              {presentCount} / {totalCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Absent Count
            </Text>

            <Text
              style={[
                styles.val,
                { color: Colors.error },
              ]}
            >
              {absentCount} / {totalCount}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>
              Late Count
            </Text>

            <Text
              style={[
                styles.val,
                { color: Colors.warning },
              ]}
            >
              {lateCount} / {totalCount}
            </Text>
          </View>
        </View>
      </View>

      {!finalized ? (
        <Pressable
          style={[
            styles.finalizeBtn,
            finalizing && styles.disabledBtn,
          ]}
          disabled={finalizing}
          onPress={handleFinalize}
        >
          {finalizing ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.finalizeBtnText}>
                Finalizing...
              </Text>
            </View>
          ) : (
            <Text style={styles.finalizeBtnText}>
              Finalize Attendance
            </Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          style={styles.homeBtn}
          onPress={() => router.replace('/(faculty)')}
        >
          <Text style={styles.homeBtnText}>
            Return to Faculty Dashboard
          </Text>
        </Pressable>
      )}
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

  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  finalizedCircle: {
    backgroundColor: '#DCFCE7',
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
    padding: 20,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  val: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  finalizeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  finalizeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  homeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  disabledBtn: {
    opacity: 0.6,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },

  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});