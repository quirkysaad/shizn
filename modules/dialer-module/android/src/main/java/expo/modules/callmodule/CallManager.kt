package expo.modules.callmodule

import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.VideoProfile

object CallManager {
    var calls = mutableListOf<Call>()
    var listener: ((Call?) -> Unit)? = null
    var inCallService: AppInCallService? = null

    val activeCall: Call?
        get() = calls.firstOrNull { it.state == Call.STATE_ACTIVE } 
            ?: calls.firstOrNull { it.state == Call.STATE_DIALING || it.state == Call.STATE_CONNECTING }
            ?: calls.firstOrNull { it.state == Call.STATE_RINGING }
            ?: calls.firstOrNull()

    fun updateCall(call: Call) {
        if (!calls.contains(call)) {
            calls.add(call)
        }
        listener?.invoke(activeCall)
    }

    fun removeCall(call: Call) {
        calls.remove(call)
        listener?.invoke(activeCall)
    }

    fun answer() {
        inCallService?.stopRinging()
        calls.firstOrNull { it.state == Call.STATE_RINGING }?.answer(VideoProfile.STATE_AUDIO_ONLY)
    }

    fun reject() {
        inCallService?.stopRinging()
        calls.firstOrNull { it.state == Call.STATE_RINGING }?.reject(false, null)
    }

    fun disconnect() {
        inCallService?.stopRinging()
        activeCall?.disconnect()
    }

    fun hold() {
        activeCall?.hold()
    }

    fun unhold() {
        calls.firstOrNull { it.state == Call.STATE_HOLDING }?.unhold()
    }

    fun merge() {
        if (calls.size >= 2) {
            val call1 = calls[0]
            val call2 = calls[1]
            call1.conference(call2)
        }
    }

    fun toggleMute(muted: Boolean) {
        val service = inCallService ?: return
        service.setMuted(muted)
    }

    fun toggleSpeaker(speaker: Boolean) {
        val service = inCallService ?: return
        if (speaker) {
            service.setAudioRoute(CallAudioState.ROUTE_SPEAKER)
        } else {
            service.setAudioRoute(CallAudioState.ROUTE_EARPIECE)
        }
    }

    fun isMuted(): Boolean {
        return inCallService?.callAudioState?.isMuted ?: false
    }

    fun getAudioRoute(): Int {
        return inCallService?.callAudioState?.route ?: CallAudioState.ROUTE_EARPIECE
    }

    fun sendDtmf(digit: Char) {
        activeCall?.playDtmfTone(digit)
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            activeCall?.stopDtmfTone()
        }, 200)
    }

    // Power button: first press silences, second press rejects
    fun handlePowerButton() {
        val service = inCallService ?: return
        val call = activeCall ?: return

        if (call.state == Call.STATE_RINGING) {
            if (service.isRingSilenced()) {
                // Already silenced -> reject the call
                reject()
            } else {
                // First press -> silence the ringtone
                service.silenceRingtone()
            }
        }
    }

    fun silenceRingtone() {
        inCallService?.silenceRingtone()
    }

    fun launchApp(context: android.content.Context) {
        try {
            val packageName = context.packageName
            val launchIntent = android.content.Intent().apply {
                setClassName(packageName, "$packageName.MainActivity")
                addFlags(
                    android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
                        android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        android.content.Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                )
            }
            context.startActivity(launchIntent)
        } catch (e: Exception) {
            // Log error
        }
    }
}
