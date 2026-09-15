package com.smartattend.ble

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelUuid

class AndroidBleScanner(
    private val context: Context
) {

    private val bluetoothManager =
        context.getSystemService(
            Context.BLUETOOTH_SERVICE
        ) as BluetoothManager

    private val bluetoothAdapter: BluetoothAdapter?
        get() = bluetoothManager.adapter

    private val bluetoothLeScanner: BluetoothLeScanner?
        get() = bluetoothAdapter?.bluetoothLeScanner

    private var isScanning = false

    private var onSessionDetected:
            ((String, Int) -> Unit)? = null
    private var onScanError: ((String, String) -> Unit)? = null

    /**
     * Start scanning for SmartAttend BLE.
     *
     * Returns:
     *
     * Session ID
     * RSSI
     */
    @SuppressLint("MissingPermission")
    fun startScanning(
        onSessionDetected: (String, Int) -> Unit,
        onStart: (Boolean, String?, String?) -> Unit,
        onError: (String, String) -> Unit
    ) {

        if (isScanning) {

            println(
                "SmartAttend BLE: " +
                        "Already scanning"
            )

            onStart(false, "BLE_ALREADY_SCANNING", "A BLE scan is already active.")
            return
        }

        if (!hasScanPermission()) {

            onStart(false, "BLUETOOTH_PERMISSION_DENIED", "BLUETOOTH_SCAN permission is missing.")
            return
        }

        val adapter = bluetoothAdapter

        if (adapter == null) {

            onStart(false, "BLE_SCANNING_UNAVAILABLE", "Bluetooth adapter is unavailable.")
            return
        }

        if (!adapter.isEnabled) {

            onStart(false, "BLUETOOTH_DISABLED", "Bluetooth is disabled.")
            return
        }

        val scanner = bluetoothLeScanner

        if (scanner == null) {

            onStart(false, "BLE_SCANNING_UNAVAILABLE", "BLE scanning is not supported on this device.")
            return
        }

        this.onSessionDetected =
            onSessionDetected
        this.onScanError = onError

        val scanSettings =
            ScanSettings.Builder()
                .setScanMode(
                    ScanSettings.SCAN_MODE_LOW_LATENCY
                )
                .build()

        println(
            "SmartAttend BLE: " +
                    "Starting scanner"
        )

        try {
            scanner.startScan(null, scanSettings, scanCallback)
        } catch (e: SecurityException) {
            onStart(false, "BLUETOOTH_PERMISSION_DENIED", "Bluetooth scan permission is unavailable.")
            return
        } catch (e: Exception) {
            onStart(false, "BLE_SCAN_FAILED", e.message ?: "Unable to start BLE scanning.")
            return
        }

        isScanning = true

        println(
            "SmartAttend BLE: " +
                    "Scanner STARTED"
        )
        onStart(true, null, null)
    }

    /**
     * Stop BLE scanning.
     */
    @SuppressLint("MissingPermission")
    fun stopScanning() {

        if (!isScanning) {
            return
        }

        if (hasScanPermission()) {

            try {

                bluetoothLeScanner?.stopScan(
                    scanCallback
                )

            } catch (e: SecurityException) {

                println(
                    "SmartAttend BLE: " +
                            "Unable to stop scanner"
                )
            }
        }

        isScanning = false
        onSessionDetected = null
        onScanError = null

        println(
            "SmartAttend BLE: " +
                    "Scanner STOPPED"
        )
    }

    /**
     * BLE scan callback.
     */
    private val scanCallback =
        object : ScanCallback() {

            override fun onScanResult(
    callbackType: Int,
    result: ScanResult
) {

    println(
        "SmartAttend BLE: BLE device discovered " +
        "RSSI=${result.rssi}"
    )

    processScanResult(result)
}

            override fun onScanFailed(
                errorCode: Int
            ) {

                println(
                    "SmartAttend BLE: " +
                            "Scan FAILED"
                )

                println(
                    "SmartAttend BLE: " +
                            "Scan error = $errorCode"
                )

                isScanning = false
                onScanError?.invoke("BLE_SCAN_FAILED", "BLE scan failed with error code $errorCode.")
            }
        }

    /**
     * Process discovered BLE packet.
     */
    private fun processScanResult(
    result: ScanResult
) {

    val scanRecord =
        result.scanRecord
            ?: return

    val serviceUuids =
        scanRecord.serviceUuids

    val smartAttendUuid =
        ParcelUuid(
            AndroidBleAdvertiser.SERVICE_UUID
        )

    /*
     * First verify that this is a
     * SmartAttend BLE packet.
     */
    if (
        serviceUuids == null ||
        !serviceUuids.contains(
            smartAttendUuid
        )
    ) {
        return
    }

    var detectedId: String? = null

    /*
     * CASE 1:
     *
     * Short ID stored as Service Data.
     *
     * Example:
     * 30
     */
    val serviceData =
        scanRecord.getServiceData(
            smartAttendUuid
        )

    if (serviceData != null) {

        detectedId =
            serviceData
                .toString(Charsets.UTF_8)
                .trim()
                .takeIf {
                    it.isNotBlank()
                }
    }

    /*
     * CASE 2:
     *
     * Long ID stored as Manufacturer Data.
     *
     * Example:
     * TEST_STUDENT_PUBLIC_KEY_001
     */
    if (detectedId == null) {

        val manufacturerData =
            scanRecord.manufacturerSpecificData

        val studentData =
            manufacturerData?.get(
                AndroidBleAdvertiser.MANUFACTURER_ID
            )

        if (studentData != null) {

            detectedId =
                studentData
                    .toString(Charsets.UTF_8)
                    .trim()
                    .takeIf {
                        it.isNotBlank()
                    }
        }
    }

    if (detectedId == null) {
        return
    }

    val rssi =
        result.rssi

    println(
        "SmartAttend BLE: " +
                "SmartAttend packet received"
    )

    println(
        "SmartAttend BLE: " +
                "ID = $detectedId"
    )

    println(
        "SmartAttend BLE: " +
                "RSSI = $rssi dBm"
    )

    onSessionDetected?.invoke(
        detectedId,
        rssi
    )
}

    /**
     * Check BLE scan permission.
     */
    private fun hasScanPermission(): Boolean {

        return if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.S
        ) {

            context.checkSelfPermission(
                Manifest.permission.BLUETOOTH_SCAN
            ) == PackageManager.PERMISSION_GRANTED

        } else {

            context.checkSelfPermission(
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        }
    }
}
