package com.smartattend.ble

import android.content.Context

/**
 * Main Android BLE controller for SmartAttend.
 *
 * Responsibilities:
 * - Start/stop teacher session broadcasting
 * - Start/stop student scanning
 * - Start/stop student cryptographic ID broadcasting
 * - Receive detected session IDs and RSSI
 *
 * BLE implementation is delegated to:
 * - AndroidBleAdvertiser
 * - AndroidBleScanner
 */
class AndroidBleManager(
    private val context: Context
) {

    private val advertiser =
        AndroidBleAdvertiser(context)

    private val scanner =
        AndroidBleScanner(context)

    private var currentSessionId: String? = null

    /**
     * ================================
     * TEACHER BROADCAST
     * ================================
     *
     * Teacher broadcasts the Session ID.
     *
     * Example:
     * BCS701
     */
    fun startTeacherBroadcast(
        sessionId: String,
        onResult: (Boolean, String?, String?) -> Unit
    ) {

        if (sessionId.isBlank()) {
            println(
                "SmartAttend BLE: Session ID is empty"
            )
            onResult(false, "BLE_INVALID_SESSION", "Attendance session ID is empty.")
            return
        }

        currentSessionId = sessionId

        println(
            "SmartAttend BLE: Starting teacher broadcast"
        )

        println(
            "SmartAttend BLE: Session ID = $sessionId"
        )

        advertiser.startAdvertising(sessionId, onResult)
    }

    /**
     * Stop Teacher BLE broadcasting.
     */
    fun stopTeacherBroadcast() {

        println(
            "SmartAttend BLE: Stopping teacher broadcast"
        )

        advertiser.stopAdvertising()

        currentSessionId = null
    }

    /**
     * ================================
     * STUDENT SCANNING
     * ================================
     *
     * Student searches for the teacher's
     * SmartAttend BLE session.
     *
     * Returns:
     * - Session ID
     * - RSSI
     */
    fun startStudentScanning(
        onSessionDetected: (String, Int) -> Unit,
        onStart: (Boolean, String?, String?) -> Unit,
        onError: (String, String) -> Unit
    ) {

        println(
            "SmartAttend BLE: Starting student scanning"
        )

        scanner.startScanning({ sessionId, rssi ->

            println(
                "SmartAttend BLE: " +
                        "Session detected = $sessionId"
            )

            println(
                "SmartAttend BLE: " +
                        "RSSI = $rssi dBm"
            )

            currentSessionId = sessionId

            onSessionDetected(
                sessionId,
                rssi
            )
        }, onStart, onError)
    }

    /**
 * ================================
 * TEACHER SCANNING
 * ================================
 *
 * Teacher searches for a student's
 * BLE cryptographic ID.
 *
 * Returns:
 * - Cryptographic ID
 * - RSSI
 */
fun startTeacherScanning(
    onStudentDetected: (String, Int) -> Unit
) {

    println(
        "SmartAttend BLE: Starting teacher scanning"
    )

    scanner.startScanning({ detectedId, rssi ->

        println(
            "SmartAttend BLE: " +
                    "Student detected = $detectedId"
        )

        println(
            "SmartAttend BLE: " +
                    "RSSI = $rssi dBm"
        )

        onStudentDetected(
            detectedId,
            rssi
        )
    }, { success, code, message ->
        println("SmartAttend BLE: Teacher scan ${if (success) "STARTED" else "FAILED: $code $message"}")
    }, { code, message ->
        println("SmartAttend BLE: Teacher scan FAILED: $code $message")
    })
}

/**
 * Stop Teacher BLE scanning.
 */
fun stopTeacherScanning() {

    println(
        "SmartAttend BLE: Stopping teacher scanning"
    )

    scanner.stopScanning()
}

    /**
     * Stop Student BLE scanning.
     */
    fun stopStudentScanning() {

        println(
            "SmartAttend BLE: Stopping student scanning"
        )

        scanner.stopScanning()

        currentSessionId = null
    }

    /**
     * ================================
     * STUDENT BROADCAST
     * ================================
     *
     * Student broadcasts only the
     * cryptographic ID.
     */
    fun startStudentBroadcast(
        cryptographicId: String
    ) {

        if (cryptographicId.isBlank()) {
            println(
                "SmartAttend BLE: Cryptographic ID is empty"
            )
            return
        }

        println(
            "SmartAttend BLE: Starting student broadcast"
        )

        println(
            "SmartAttend BLE: Cryptographic ID = $cryptographicId"
        )

        advertiser.startAdvertising(
            cryptographicId
        ) { success, code, message ->
            println(
                "SmartAttend BLE: Student broadcast ${
                    if (success) "STARTED" else "FAILED: $code ${message ?: "Unknown error"}"
                }"
            )
        }
    }

    /**
     * Stop Student BLE broadcasting.
     */
    fun stopStudentBroadcast() {

        println(
            "SmartAttend BLE: Stopping student broadcast"
        )

        advertiser.stopAdvertising()
    }

    /**
     * Get the currently detected/active
     * session ID.
     */
    fun getCurrentSessionId(): String? {
        return currentSessionId
    }

    /**
     * ================================
     * STOP EVERYTHING
     * ================================
     */
    fun stopAll() {

        advertiser.stopAdvertising()
        scanner.stopScanning()

        currentSessionId = null

        println(
            "SmartAttend BLE: All BLE operations stopped"
        )
    }
}
