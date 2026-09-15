package com.smartattend.ble

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class SmartAttendBleModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val bleManager = AndroidBleManager(reactContext)
    private var pendingPermissionPromise: Promise? = null

    companion object {
        private const val PERMISSION_REQUEST_CODE = 5001
    }

    override fun getName(): String {
        return "SmartAttendBLE"
    }

    @ReactMethod
fun addListener(eventName: String) {
    // Required by React Native NativeEventEmitter.
}

@ReactMethod
fun removeListeners(count: Int) {
    // Required by React Native NativeEventEmitter.
}

    private fun sendEvent(
        eventName: String,
        id: String,
        rssi: Int
    ) {
        val params = Arguments.createMap()

        params.putString("id", id)
        params.putInt("rssi", rssi)

        reactContext
            .getJSModule(
                DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
            .emit(eventName, params)
    }

    @ReactMethod
    fun requestPermissions(operation: String?, promise: Promise) {

        val permissions = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            if (operation?.lowercase() == "scan" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
            } else {
                emptyArray()
            }
        } else when (operation?.lowercase()) {
            "advertise" -> arrayOf(Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT)
            "scan" -> arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT)
            else -> arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_ADVERTISE)
        }

        if (permissions.isEmpty()) {
            promise.resolve(true)
            return
        }

        val missingPermissions = permissions.filter {
            ActivityCompat.checkSelfPermission(
                reactContext,
                it
            ) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isEmpty()) {
            promise.resolve(true)
            return
        }

        val activity = reactContext.currentActivity

        if (activity == null) {
            promise.reject(
                "NO_ACTIVITY",
                "Unable to request Bluetooth permissions because the activity is not available."
            )
            return
        }

        if (pendingPermissionPromise != null) {
            promise.reject("BLUETOOTH_PERMISSION_IN_PROGRESS", "A Bluetooth permission request is already in progress.")
            return
        }

        val permissionActivity = activity as? PermissionAwareActivity
        if (permissionActivity == null) {
            promise.reject("PERMISSION_UNAVAILABLE", "The current activity cannot handle runtime permissions.")
            return
        }
        pendingPermissionPromise = promise
        permissionActivity.requestPermissions(
            missingPermissions.toTypedArray(),
            PERMISSION_REQUEST_CODE,
            PermissionListener { requestCode, _, grantResults ->
                if (requestCode != PERMISSION_REQUEST_CODE) return@PermissionListener false
                val granted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                pendingPermissionPromise?.let {
                    if (granted) it.resolve(true)
                    else it.reject("BLUETOOTH_PERMISSION_DENIED", "Required Bluetooth permission was denied.")
                }
                pendingPermissionPromise = null
                true
            }
        )
    }

    @ReactMethod
    fun startTeacherBroadcast(sessionId: String, promise: Promise) {
        bleManager.startTeacherBroadcast(sessionId) { success, code, message ->
            if (success) promise.resolve(Arguments.createMap().apply { putBoolean("success", true) })
            else promise.resolve(Arguments.createMap().apply { putBoolean("success", false); putString("errorCode", code); putString("message", message) })
        }
    }

    @ReactMethod
    fun stopTeacherBroadcast() {
        bleManager.stopTeacherBroadcast()
    }

    @ReactMethod
    fun startStudentBroadcast(cryptographicId: String) {
        bleManager.startStudentBroadcast(cryptographicId)
    }

    @ReactMethod
    fun stopStudentBroadcast() {
        bleManager.stopStudentBroadcast()
    }

    @ReactMethod
    fun startStudentScanning(promise: Promise) {
        bleManager.startStudentScanning({ sessionId, rssi ->
            sendEvent(
                "SmartAttendSessionDetected",
                sessionId,
                rssi
            )
        }, { success, code, message ->
            if (success) promise.resolve(Arguments.createMap().apply { putBoolean("success", true) })
            else promise.resolve(Arguments.createMap().apply { putBoolean("success", false); putString("errorCode", code); putString("message", message) })
        }, { code, message ->
            val params = Arguments.createMap().apply { putString("errorCode", code); putString("message", message) }
            reactContext.getJSModule(RCTDeviceEventEmitter::class.java).emit("SmartAttendBLEError", params)
        })
    }

    @ReactMethod
    fun startTeacherScanning() {
        bleManager.startTeacherScanning { studentId, rssi ->
            sendEvent(
                "SmartAttendStudentDetected",
                studentId,
                rssi
            )
        }
    }

    @ReactMethod
    fun stopStudentScanning() {
        bleManager.stopStudentScanning()
    }

    @ReactMethod
    fun stopTeacherScanning() {
        bleManager.stopTeacherScanning()
    }

    @ReactMethod
    fun stopAll() {
        bleManager.stopAll()
    }

    override fun invalidate() {
        bleManager.stopAll()
        super.invalidate()
    }
}
