/**
 * SmartAttend — Attendance Check / BLE Verification Screen
 *
 * Real flow:
 * 1. Request Bluetooth permissions
 * 2. Start student BLE scanning
 * 3. Detect faculty attendance session
 * 4. Capture Session ID + RSSI
 * 5. Stop scanning
 * 6. Continue to the next verification step
 */

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { BLEService } from '../../services/ble';

export default function AttendanceCheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(
    'Requesting Bluetooth permission...'
  );

  const [bleDetected, setBleDetected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    (params.sessionId as string) || null
  );
  const [rssi, setRssi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: { remove: () => void } | null = null;
    const errorSubscription = BLEService.addErrorListener((bleError) => {
      if (!mounted) return;
      setError(bleError.message);
      setCurrentStep('Bluetooth scanning failed.');
    });

    const startVerification = async () => {
      try {
        console.log('SmartAttend: Starting student attendance verification');

        // --------------------------------------------------
        // STEP 1 — Bluetooth permission
        // --------------------------------------------------

        setProgress(10);
        setCurrentStep('Requesting Bluetooth permission...');

        const permissionGranted =
          await BLEService.requestPermissions('scan');

        if (!mounted) return;

        if (!permissionGranted) {
          throw new Error(
            'Bluetooth permission was not granted.'
          );
        }

        console.log(
          'SmartAttend BLE: Bluetooth permission granted'
        );

        // --------------------------------------------------
        // STEP 2 — Start BLE scanning
        // --------------------------------------------------

        setProgress(25);
        setCurrentStep(
          'Scanning for classroom attendance beacon...'
        );

        console.log(
          'SmartAttend BLE: Starting student scanning'
        );

        const scan = await BLEService.startStudentScanning(
          (data) => {
            if (!mounted) return;

            console.log(
              'SmartAttend BLE: Session detected =',
              data.id
            );

            console.log(
              'SmartAttend BLE: RSSI =',
              data.rssi
            );

            setSessionId(data.id);
            setRssi(data.rssi);
            setBleDetected(true);

            setProgress(100);
            setCurrentStep(
              'Classroom beacon detected successfully!'
            );

            // Stop scanning after the first valid detection.
            BLEService.stopStudentScanning();

            if (subscription) {
              subscription.remove();
              subscription = null;
            }

            // Continue to the next verification screen.
            setTimeout(() => {
              if (!mounted) return;

              router.replace({
  pathname: '/(student)/location-check',
  params: {
    sessionId: data.id,
    rssi: String(data.rssi),

    // Carry real class/session details forward
    subjectName:
      (params.subjectName as string) || '',

    subjectCode:
      (params.subjectCode as string) || '',

    room:
      (params.room as string) || '',

    faculty:
      (params.faculty as string) || '',

    scheduledStart:
      (params.scheduledStart as string) || '',

    scheduledEnd:
      (params.scheduledEnd as string) || '',
  },
});
            }, 800);
          }
        );

        if (!scan.result.success) {
          scan.subscription.remove();
          throw new Error(scan.result.message || 'Unable to start BLE scanning.');
        }
        subscription = scan.subscription;

        console.log(
          'SmartAttend BLE: Scan STARTED'
        );

      } catch (err) {
        console.error(
          'SmartAttend ATTENDANCE CHECK ERROR:',
          err
        );

        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to verify attendance.'
        );

        setCurrentStep(
          'Bluetooth verification failed.'
        );
      }
    };

    startVerification();

    return () => {
      mounted = false;

      console.log(
        'SmartAttend BLE: Cleaning up student scanning'
      );

      BLEService.stopStudentScanning();

      if (subscription) {
        subscription.remove();
      }
      errorSubscription.remove();
    };
  }, []);

  const handleCancel = () => {
    BLEService.stopStudentScanning();

    if (subscriptionSafe()) {
      // Nothing else required.
    }

    router.back();
  };

  const subscriptionSafe = () => true;

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <View
          style={[
            styles.iconCircle,
            bleDetected && styles.iconCircleSuccess,
          ]}
        >
          <Text style={styles.radarIcon}>
            {bleDetected ? '✅' : '📡'}
          </Text>
        </View>

        <Text style={styles.title}>
          {bleDetected
            ? 'Classroom Detected'
            : 'Checking Requirements'}
        </Text>

        <Text style={styles.subtitle}>
          {error
            ? error
            : bleDetected
            ? `Attendance session ${sessionId} detected successfully.`
            : 'Please stand near your classroom while AutoMark verifies the attendance beacon.'}
        </Text>

        <View style={styles.progressCard}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {progress}% Completed
          </Text>

          <Text style={styles.stepText}>
            {currentStep}
          </Text>

          {bleDetected && (
            <View style={styles.bleInfo}>
              <Text style={styles.infoLabel}>
                SESSION ID
              </Text>

              <Text style={styles.infoValue}>
                {sessionId}
              </Text>

              <Text style={styles.infoLabel}>
                SIGNAL STRENGTH
              </Text>

              <Text style={styles.infoValue}>
                {rssi} dBm
              </Text>
            </View>
          )}
        </View>

        <View style={styles.checklist}>

          <View style={styles.checkRow}>
            <Text style={styles.checkIcon}>
              {progress >= 25 ? '🔄' : '⏳'}
            </Text>

            <Text style={styles.checkLabel}>
              Bluetooth / BLE Permission
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.checkIcon}>
              {bleDetected ? '✅' : '⏳'}
            </Text>

            <Text style={styles.checkLabel}>
              Classroom Beacon Detected
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.checkIcon}>
              {bleDetected ? '🔄' : '⏳'}
            </Text>

            <Text style={styles.checkLabel}>
              Continuing Attendance Verification
            </Text>
          </View>

        </View>
      </View>

      <Pressable
        style={styles.cancelBtn}
        onPress={handleCancel}
      >
        <Text style={styles.cancelText}>
          Cancel Verification
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

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  iconCircleSuccess: {
    backgroundColor: '#DCFCE7',
  },

  radarIcon: {
    fontSize: 48,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
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

  progressCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 2,
  },

  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },

  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },

  stepText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  bleInfo: {
    width: '100%',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 6,
  },

  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },

  checklist: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  checkIcon: {
    fontSize: 18,
  },

  checkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
});
