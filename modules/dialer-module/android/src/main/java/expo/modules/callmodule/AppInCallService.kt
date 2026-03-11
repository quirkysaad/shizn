package expo.modules.callmodule

import android.app.ActivityManager
import android.app.KeyguardManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.util.Log
import androidx.core.app.NotificationCompat

class AppInCallService : InCallService() {
    private var ringtone: Ringtone? = null
    private var vibrator: Vibrator? = null
    private var isRingtoneSilenced = false
    private var screenOffReceiver: BroadcastReceiver? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var proximityWakeLock: PowerManager.WakeLock? = null

    private fun updateProximitySensor() {
        Log.d(TAG, "updateProximitySensor")
        try {
            val call = CallManager.activeCall
            if (call == null) {
                releaseProximityWakeLock()
                return
            }

            val route = callAudioState?.route ?: CallAudioState.ROUTE_EARPIECE
            val isSpeaker = route == CallAudioState.ROUTE_SPEAKER
            
            // Turn off screen when on an active call and not using the speakerphone
            val shouldHoldProximityLock = !isSpeaker && (call.state == Call.STATE_ACTIVE || call.state == Call.STATE_DIALING)

            if (shouldHoldProximityLock) {
                if (proximityWakeLock == null) {
                    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        if (powerManager.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) {
                            proximityWakeLock = powerManager.newWakeLock(
                                PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK,
                                "callify:proximity"
                            )
                        }
                    }
                }
                
                if (proximityWakeLock?.isHeld == false) {
                    proximityWakeLock?.acquire()
                    Log.d(TAG, "Proximity wake lock acquired")
                }
            } else {
                releaseProximityWakeLock()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating proximity sensor", e)
        }
    }

    private fun releaseProximityWakeLock() {
        try {
            if (proximityWakeLock?.isHeld == true) {
                proximityWakeLock?.release()
                Log.d(TAG, "Proximity wake lock released")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing proximity wake lock", e)
        }
    }

    companion object {
        private const val TAG = "AppInCallService"
        private const val CHANNEL_ID = "incoming_call_channel_v2"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        Log.d(TAG, "onCallAdded: state=${call.state}")
        CallManager.inCallService = this
        CallManager.updateCall(call)
        call.registerCallback(callCallback)

        if (call.state == Call.STATE_RINGING) {
            startRinging()
            registerScreenOffReceiver()
            showIncomingCallNotification(call)
            
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!powerManager.isInteractive) {
                wakeUpScreen()
            }
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.d(TAG, "onCallRemoved")
        stopRinging()
        unregisterScreenOffReceiver()
        cancelNotification()
        releaseWakeLock()
        releaseProximityWakeLock()
        CallManager.removeCall(call)
        call.unregisterCallback(callCallback)
    }

    override fun onCallAudioStateChanged(audioState: CallAudioState?) {
        super.onCallAudioStateChanged(audioState)
        Log.d(TAG, "onCallAudioStateChanged: route=${audioState?.route}, muted=${audioState?.isMuted}")
        updateProximitySensor()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRinging()
        unregisterScreenOffReceiver()
        cancelNotification()
        releaseWakeLock()
        releaseProximityWakeLock()
        CallManager.inCallService = null
    }

    private fun wakeUpScreen() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or
                    PowerManager.ACQUIRE_CAUSES_WAKEUP or
                    PowerManager.ON_AFTER_RELEASE,
                "callify:incoming_call"
            )
            wakeLock?.acquire(60 * 1000L) // 60 seconds
            Log.d(TAG, "Screen woken up")
        } catch (e: Exception) {
            Log.e(TAG, "Error waking screen", e)
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            wakeLock = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing wake lock", e)
        }
    }

    private fun isAppInForeground(): Boolean {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val appProcesses = activityManager.runningAppProcesses ?: return false
        val packageName = applicationContext.packageName
        for (appProcess in appProcesses) {
            if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess.processName == packageName) {
                return true
            }
        }
        return false
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // High priority channel for heads-up and lock screen
            val channelHigh = NotificationChannel(
                "incoming_call_channel_v4",
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for incoming phone calls"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setSound(null, null) // System silent, we play our own
                enableVibration(false)
            }
            notificationManager.createNotificationChannel(channelHigh)

            // Low priority channel for when app is already open
            val channelLow = NotificationChannel(
                "incoming_call_channel_silent",
                "Incoming Calls (Silent)",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Silent notifications for when app is open"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setSound(null, null) // System silent, we play our own
                enableVibration(false)
            }
            notificationManager.createNotificationChannel(channelLow)
        }
    }

    private fun showIncomingCallNotification(call: Call) {
        createNotificationChannels()

        val isInForeground = isAppInForeground()
        val channelId = if (isInForeground) "incoming_call_channel_silent" else "incoming_call_channel_v4"
        val number = call.details?.handle?.schemeSpecificPart ?: "Unknown"
        val packageName = applicationContext.packageName

        // Intent to launch the app
        val fullScreenIntent = Intent().apply {
            setClassName(packageName, "$packageName.MainActivity")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            putExtra("is_incoming_call", true)
            putExtra("phone_number", number)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, 0, fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val acceptIntent = Intent(this, CallActionReceiver::class.java).apply {
            action = CallActionReceiver.ACTION_ANSWER
        }
        val acceptPendingIntent = PendingIntent.getBroadcast(
            this, 1, acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val rejectIntent = Intent(this, CallActionReceiver::class.java).apply {
            action = CallActionReceiver.ACTION_REJECT
        }
        val rejectPendingIntent = PendingIntent.getBroadcast(
            this, 2, rejectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        val isLocked = (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).isKeyguardLocked

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Incoming Call")
            .setContentText(number)
            .setPriority(if (isInForeground) NotificationCompat.PRIORITY_LOW else NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(0, "Accept", acceptPendingIntent)
            .addAction(0, "Decline", rejectPendingIntent)

        // Only attach fullScreenIntent if the app is NOT in the foreground
        if (!isInForeground) {
            notificationBuilder.setFullScreenIntent(fullScreenPendingIntent, true)
        }

        val notification = notificationBuilder.build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
        Log.d(TAG, "Incoming call notification shown for $number. isInForeground=$isInForeground")
        
        // Safety net: if locked or screen off, try to manually launch the app just in case fullScreenIntent isn't enough
        if (isLocked || !powerManager.isInteractive) {
            CallManager.launchApp(applicationContext)
        }
    }


    private fun cancelNotification() {
        try {
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.cancel(NOTIFICATION_ID)
            Log.d(TAG, "Notification cancelled")
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling notification", e)
        }
    }

    private fun startRinging() {
        isRingtoneSilenced = false
        Log.d(TAG, "startRinging")
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val ringerMode = audioManager.ringerMode

            if (ringerMode == AudioManager.RINGER_MODE_NORMAL) {
                val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                ringtone = RingtoneManager.getRingtone(applicationContext, ringtoneUri)
                ringtone?.let {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        it.isLooping = true
                    }
                    it.play()
                    Log.d(TAG, "ringtone playing")
                }
            }

            if (ringerMode != AudioManager.RINGER_MODE_SILENT) {
                vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vibratorManager.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }

                val pattern = longArrayOf(0, 1000, 1000)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(pattern, 0)
                }
                Log.d(TAG, "vibration started")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting ringtone", e)
        }
    }

    fun stopRinging() {
        Log.d(TAG, "stopRinging")
        try {
            ringtone?.stop()
            ringtone = null
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping ringtone", e)
        }
    }

    fun silenceRingtone() {
        Log.d(TAG, "silenceRingtone called, was silenced=$isRingtoneSilenced")
        isRingtoneSilenced = true
        stopRinging()
    }

    fun isRingSilenced(): Boolean {
        return isRingtoneSilenced
    }

    private fun registerScreenOffReceiver() {
        if (screenOffReceiver != null) return
        Log.d(TAG, "registering screen off receiver")
        screenOffReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                Log.d(TAG, "screen off received, action=${intent?.action}")
                if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                    handlePowerButtonPress()
                }
            }
        }
        val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenOffReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(screenOffReceiver, filter)
        }
    }

    private fun unregisterScreenOffReceiver() {
        try {
            screenOffReceiver?.let {
                unregisterReceiver(it)
                Log.d(TAG, "screen off receiver unregistered")
            }
            screenOffReceiver = null
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering receiver", e)
        }
    }

    private fun handlePowerButtonPress() {
        Log.d(TAG, "handlePowerButtonPress: silenced=$isRingtoneSilenced, callState=${CallManager.activeCall?.state}")
        val call = CallManager.activeCall ?: return
        if (call.state == Call.STATE_RINGING) {
            if (isRingtoneSilenced) {
                Log.d(TAG, "Already silenced -> rejecting call")
                CallManager.reject()
            } else {
                Log.d(TAG, "First press -> silencing ringtone")
                silenceRingtone()
            }
        }
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            Log.d(TAG, "onStateChanged: state=$state")
            CallManager.updateCall(call)
            updateProximitySensor()

            if (state != Call.STATE_RINGING) {
                stopRinging()
                unregisterScreenOffReceiver()
                cancelNotification()
                releaseWakeLock()
            }
        }
    }
}
