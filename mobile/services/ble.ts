import { NativeEventEmitter, NativeModules } from 'react-native';

const { SmartAttendBLE } = NativeModules;

if (!SmartAttendBLE) {
  console.warn(
    'SmartAttendBLE native module is not available.'
  );
}

const bleEvents = SmartAttendBLE
  ? new NativeEventEmitter(SmartAttendBLE)
  : null;

export type BleDetection = {
  id: string;
  rssi: number;
};

export type BleStartResult = {
  success: boolean;
  errorCode?: string;
  message?: string;
};

export type BleError = { errorCode: string; message: string };

export const BLEService = {
  async requestPermissions(operation: 'advertise' | 'scan' = 'scan'): Promise<boolean> {
    if (!SmartAttendBLE) {
      throw new Error('SmartAttendBLE native module is not available');
    }

    return await SmartAttendBLE.requestPermissions(operation);
  },

  async startTeacherBroadcast(sessionId: string): Promise<BleStartResult> {
    if (!SmartAttendBLE) {
      throw new Error('SmartAttendBLE native module is not available');
    }

    return await SmartAttendBLE.startTeacherBroadcast(sessionId);
  },

  stopTeacherBroadcast() {
    SmartAttendBLE?.stopTeacherBroadcast();
  },

  async startStudentScanning(
    callback: (data: BleDetection) => void
  ): Promise<{ result: BleStartResult; subscription: { remove: () => void } }> {
    if (!bleEvents) {
      throw new Error('SmartAttendBLE native module is not available');
    }

    const subscription = bleEvents.addListener(
      'SmartAttendSessionDetected',
      callback
    );

    const result = await SmartAttendBLE.startStudentScanning();

    return { result, subscription };
  },

  stopStudentScanning() {
    SmartAttendBLE?.stopStudentScanning();
  },

  addErrorListener(callback: (error: BleError) => void) {
    if (!bleEvents) throw new Error('SmartAttendBLE native module is not available');
    return bleEvents.addListener('SmartAttendBLEError', callback);
  },

  startTeacherScanning(
    callback: (data: BleDetection) => void
  ) {
    if (!bleEvents) {
      throw new Error('SmartAttendBLE native module is not available');
    }

    const subscription = bleEvents.addListener(
      'SmartAttendStudentDetected',
      callback
    );

    SmartAttendBLE.startTeacherScanning();

    return subscription;
  },

  stopTeacherScanning() {
    SmartAttendBLE?.stopTeacherScanning();
  },

  stopAll() {
    SmartAttendBLE?.stopAll();
  },
};
