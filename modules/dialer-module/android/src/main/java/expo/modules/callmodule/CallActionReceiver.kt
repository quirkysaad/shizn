package expo.modules.callmodule

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class CallActionReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_ANSWER = "expo.modules.callmodule.ACTION_ANSWER"
        const val ACTION_REJECT = "expo.modules.callmodule.ACTION_REJECT"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d("CallActionReceiver", "Received action: ${intent.action}")
        when (intent.action) {
            ACTION_ANSWER -> {
                CallManager.answer()
            }
            ACTION_REJECT -> {
                CallManager.reject()
            }
        }
    }
}
