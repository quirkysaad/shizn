package expo.modules.callmodule

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
        private const val CHANNEL_ID = "incoming_call_channel"
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
            wakeUpScreen()
        }
        launchApp()
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.d(TAG, "onCallRemoved")
        stopRinging()
        unregisterScreenOffReceiver()
        cancelNotification()
        releaseWakeLock()
        releaseProximityWakeLock()
        CallManager.removeCall()
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

    private fun launchApp() {
        try {
            val packageName = applicationContext.packageName
            val launchIntent = applicationContext.packageManager.getLaunchIntentForPackage(packageName)
            launchIntent?.let {
                it.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                )
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                applicationContext.startActivity(it)
                Log.d(TAG, "App launched")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error launching app", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for incoming phone calls"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setSound(null, null) // We handle ringtone ourselves
                enableVibration(false) // We handle vibration ourselves
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showIncomingCallNotification(call: Call) {
        createNotificationChannel()

        val number = call.details?.handle?.schemeSpecificPart ?: "Unknown"

        // Full-screen intent to launch the app
        val packageName = applicationContext.packageName
        val fullScreenIntent = applicationContext.packageManager.getLaunchIntentForPackage(packageName)
        fullScreenIntent?.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        )

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

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Incoming Call")
            .setContentText(number)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Reject", rejectPendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .build()

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
        Log.d(TAG, "Incoming call notification shown for $number")
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
