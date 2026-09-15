/**
 * SmartAttend — BLE Proximity Check Screen
 *
 * Real flow:
 * 1. Receive BLE session ID + RSSI from attendance-check
 * 2. Estimate approximate distance from faculty device using RSSI
 * 3. Display proximity information
 * 4. Pass session ID + RSSI to final confirmation screen
 */

import React, { useEffect, useState } from 'react';
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

function estimateDistance(rssi: number): number {
  // Approximate BLE distance model.
  // RSSI-based distance is affected by walls, people,
  // phone orientation, and radio interference.
  const measuredPower = -59;
  const pathLossExponent = 2;

  const distance = Math.pow(
    10,
    (measuredPower - rssi) / (10 * pathLossExponent)
  );

  // Keep the displayed value within a sensible range.
  return Math.max(0.1, Math.min(distance, 100));
}

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${distance.toFixed(1)} m`;
  }

  if (distance < 10) {
    return `${distance.toFixed(1)} m`;
  }

  return `${Math.round(distance)} m`;
}

export default function LocationCheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const sessionId = params.sessionId as string | undefined;
  const rssiParam = params.rssi as string | undefined;

  const rssi = rssiParam ? Number(rssiParam) : null;

  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState(
    'Checking proximity to faculty device...'
  );

  useEffect(() => {
    if (rssi === null || Number.isNaN(rssi)) {
      setStatus('Unable to determine BLE signal strength.');
      return;
    }

    const estimatedDistance = estimateDistance(rssi);

    setDistance(estimatedDistance);
    setStatus('Faculty device detected within BLE range.');

    const timer = setTimeout(() => {
      router.replace({
  pathname: '/(student)/all-checks-passed',
  params: {
    sessionId: sessionId || '',
    rssi: String(rssi),

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
    }, 1200);

    return () => clearTimeout(timer);
  }, [sessionId, rssi]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* Proximity visualization */}
        <View style={styles.mapCard}>
          <Text style={styles.pinIcon}>📡</Text>

          <View style={styles.circleRipple} />

          <Text style={styles.roomTag}>
            Faculty Device
          </Text>
        </View>

        <Text style={styles.title}>
          Proximity Verification
        </Text>

        <Text style={styles.subtitle}>
          Checking your approximate distance from the
          faculty attendance device using BLE signal strength.
        </Text>

        <View style={styles.statusBox}>

          <View style={styles.distanceBadge}>
            <Text style={styles.distanceValue}>
              {distance !== null
                ? formatDistance(distance)
                : '--'}
            </Text>

            <Text style={styles.distanceLabel}>
              Approx. Distance from Faculty
            </Text>
          </View>

          <Text style={styles.statusText}>
            {status}
          </Text>

          {rssi !== null && !Number.isNaN(rssi) && (
            <View style={styles.signalInfo}>
              <Text style={styles.signalLabel}>
                BLE SIGNAL
              </Text>

              <Text style={styles.signalValue}>
                {rssi} dBm
              </Text>
            </View>
          )}

        </View>
      </View>

      <Pressable
        style={styles.secondaryBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.secondaryBtnText}>
          Cancel
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

  mapCard: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  pinIcon: {
    fontSize: 48,
  },

  circleRipple: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },

  roomTag: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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

  statusBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },

  distanceBadge: {
    alignItems: 'center',
    marginBottom: 12,
  },

  distanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
  },

  distanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
  },

  signalInfo: {
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },

  signalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  signalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 3,
  },

  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },

  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});