package expo.modules.callmodule

import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.VideoProfile

object CallManager {
    var activeCall: Call? = null
    var listener: ((Call?) -> Unit)? = null
    var inCallService: AppInCallService? = null

    fun updateCall(call: Call) {
        activeCall = call
        listener?.invoke(call)
    }

    fun removeCall() {
        activeCall = null
        listener?.invoke(null)
    }

    fun answer() {
        inCallService?.stopRinging()
        activeCall?.answer(VideoProfile.STATE_AUDIO_ONLY)
    }

    fun reject() {
        inCallService?.stopRinging()
        activeCall?.reject(false, null)
    }

    fun disconnect() {
        inCallService?.stopRinging()
        activeCall?.disconnect()
    }

    fun hold() {
        activeCall?.hold()
    }

    fun unhold() {
        activeCall?.unhold()
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
}
