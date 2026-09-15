package com.smartattend.ble

import android.util.Log

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.ParcelUuid
import java.nio.charset.StandardCharsets

class AndroidBleAdvertiser(
    private val context: Context
) {

    private val TAG = "SmartAttendBLE"

    companion object {

        /**
         * SmartAttend fixed BLE Service UUID.
         */
        val SERVICE_UUID =
            java.util.UUID.fromString(
                "7b3c0001-8f2a-4c91-a8d2-123456789abc"
            )

        /**
         * Reserved manufacturer ID for POC/testing.
         *
         * 0xFFFF is reserved for testing.
         * Do NOT use this as a production manufacturer ID.
         */
        const val MANUFACTURER_ID = 0xFFFF

        /**
         * Maximum payload that can fit inside
         * 128-bit Service Data in a legacy BLE packet.
         */
        const val MAX_SERVICE_DATA_BYTES = 13

        /**
         * Maximum manufacturer data payload
         * that fits in a legacy BLE packet.
         */
        const val MAX_MANUFACTURER_DATA_BYTES = 27
    }

    private val bluetoothManager =
        context.getSystemService(
            Context.BLUETOOTH_SERVICE
        ) as BluetoothManager

    private val bluetoothAdapter: BluetoothAdapter?
        get() = bluetoothManager.adapter

    private val advertiser
        get() = bluetoothAdapter?.bluetoothLeAdvertiser

    private var currentSessionId: String? = null
    private var onResult: ((Boolean, String?, String?) -> Unit)? = null

    private val advertiseCallback =
        object : AdvertiseCallback() {

            
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
    onResult?.invoke(true, null, null)
    onResult = null
    Log.d(TAG, "Advertising STARTED")
    Log.d(TAG, "ID = $currentSessionId")
}

override fun onStartFailure(errorCode: Int) {
    val errorMessage = when (errorCode) {
        ADVERTISE_FAILED_ALREADY_STARTED -> "ALREADY_STARTED"
        ADVERTISE_FAILED_DATA_TOO_LARGE -> "DATA_TOO_LARGE"
        ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "FEATURE_UNSUPPORTED"
        ADVERTISE_FAILED_INTERNAL_ERROR -> "INTERNAL_ERROR"
        ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "TOO_MANY_ADVERTISERS"
        else -> "UNKNOWN_ERROR"
    }

    val message = "BLE advertising failed: $errorMessage (code $errorCode)"
    onResult?.invoke(false, "BLE_ADVERTISE_FAILED", message)
    onResult = null
    Log.e(TAG, message)
    Log.e(TAG, "Error code = $errorCode")
    Log.e(TAG, "Error = $errorMessage")
}

        }

    @SuppressLint("MissingPermission")
    fun startAdvertising(
        sessionId: String,
        result: (Boolean, String?, String?) -> Unit
    ) {
        onResult = result

        if (!hasAdvertisePermission()) {

            fail("BLUETOOTH_PERMISSION_DENIED", "BLUETOOTH_ADVERTISE permission is missing.")

            return
        }

        if (sessionId.isBlank()) {

            fail("BLE_INVALID_SESSION", "Attendance session ID is empty.")

            return
        }

        val adapter = bluetoothAdapter

        if (adapter == null) {

            fail("BLE_ADVERTISING_UNAVAILABLE", "Bluetooth adapter is unavailable.")

            return
        }

        if (!adapter.isEnabled) {

            fail("BLUETOOTH_DISABLED", "Bluetooth is disabled.")

            return
        }

        val bleAdvertiser = advertiser

        if (bleAdvertiser == null) {

            fail("BLE_ADVERTISING_UNAVAILABLE", "BLE advertising is not supported on this device.")

            return
        }

        stopAdvertising()

        currentSessionId = sessionId

        /*
         * MAIN ADVERTISEMENT
         *
         * Contains only the SmartAttend Service UUID.
         */
        val advertiseData =
            AdvertiseData.Builder()
                .addServiceUuid(
                    ParcelUuid(SERVICE_UUID)
                )
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)
                .build()

        /*
         * SCAN RESPONSE
         *
         * Short IDs:
         *     Service Data
         *
         * Long IDs:
         *     Manufacturer Data
         *
         * This is important because:
         *
         * TEST_STUDENT_PUBLIC_KEY_001
         *
         * is too large to fit as Service Data
         * with a 128-bit UUID.
         */

        val idData =
            sessionId.toByteArray(
                StandardCharsets.UTF_8
            )

        val scanResponseBuilder =
            AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .setIncludeTxPowerLevel(false)

        if (idData.size <= MAX_SERVICE_DATA_BYTES) {

            println(
                "SmartAttend BLE: " +
                        "Using Service Data"
            )

            scanResponseBuilder.addServiceData(
                ParcelUuid(SERVICE_UUID),
                idData
            )

        } else if (
            idData.size <= MAX_MANUFACTURER_DATA_BYTES
        ) {

            println(
                "SmartAttend BLE: " +
                        "Using Manufacturer Data"
            )

            scanResponseBuilder.addManufacturerData(
                MANUFACTURER_ID,
                idData
            )

        } else {

            fail("BLE_DATA_TOO_LARGE", "Attendance session ID is too large for BLE.")

            currentSessionId = null
            return
        }

        val scanResponse =
            scanResponseBuilder.build()

        val settings =
            AdvertiseSettings.Builder()
                .setAdvertiseMode(
                    AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY
                )
                .setTxPowerLevel(
                    AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM
                )
                .setConnectable(false)
                .build()

        println(
            "SmartAttend BLE: " +
                    "Starting advertising"
        )

        println(
            "SmartAttend BLE: " +
                    "ID = $sessionId"
        )

        println(
            "SmartAttend BLE: " +
                    "Payload bytes = ${idData.size}"
        )

        Log.d(TAG, "startAdvertising() called with ID = $sessionId")
        Log.d(TAG, "Calling BluetoothLeAdvertiser.startAdvertising()")
        bleAdvertiser.startAdvertising(
            settings,
            advertiseData,
            scanResponse,
            advertiseCallback
        )
    }

    private fun fail(code: String, message: String) {
        Log.e(TAG, "[BLE] $code: $message")
        onResult?.invoke(false, code, message)
        onResult = null
    }

    @SuppressLint("MissingPermission")
    fun stopAdvertising() {

        if (!hasAdvertisePermission()) {
            onResult = null
            return
        }

        try {

            advertiser?.stopAdvertising(
                advertiseCallback
            )

        } catch (e: SecurityException) {

            println(
                "SmartAttend BLE: " +
                        "Unable to stop advertising"
            )
        }

        currentSessionId = null

        println(
            "SmartAttend BLE: " +
                    "Advertising STOPPED"
        )
    }

    private fun hasAdvertisePermission(): Boolean {

        return if (
            android.os.Build.VERSION.SDK_INT >=
            android.os.Build.VERSION_CODES.S
        ) {

            context.checkSelfPermission(
                Manifest.permission.BLUETOOTH_ADVERTISE
            ) == PackageManager.PERMISSION_GRANTED

        } else {

            true
        }
    }
}
