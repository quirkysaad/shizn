import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from "react-native";
import { PhoneCall } from "lucide-react-native";
import { CallLogsModule } from "../modules/dialer-module";
import theme from "../utils/theme";

const DefaultDialerPrompt = ({ children }: { children: React.ReactNode }) => {
  const [isDefault, setIsDefault] = useState<boolean | null>(null);

  const checkDefault = async () => {
    try {
      const result = await CallLogsModule.isDefaultDialer();
      setIsDefault(result ?? false);
    } catch (e) {
      console.log("Error checking default dialer", e);
      setIsDefault(false);
    }
  };

  useEffect(() => {
    checkDefault();

    // Check when app resumes from background (user might have changed it in settings)
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkDefault();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleRequest = async () => {
    try {
      await CallLogsModule.requestDefaultDialer();
      // On Android requestDefaultDialer starts an activity, so we wait for AppState change to check again.
      // But we can also check manually after a short delay or let AppState handle it.
      setTimeout(checkDefault, 1000);
    } catch (e) {
      console.log("Error requesting default dialer", e);
    }
  };

  if (isDefault === null) return null; // Loading state

  if (isDefault) {
    return <>{children}</>;
  }

  return (
    <View
      className="flex-1 items-center justify-center p-8"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View
        className="items-center justify-center w-24 h-24 rounded-full mb-8"
        style={{ backgroundColor: theme.colors.card }}
      >
        <PhoneCall size={48} color={theme.colors.primary} />
      </View>
      <Text className="text-2xl font-bold text-center mb-4 text-white">
        Default Phone App
      </Text>
      <Text className="text-base text-center mb-10 text-gray-400">
        Callify needs to be your default phone app to make and receive calls,
        and to show your call history.
      </Text>

      <TouchableOpacity
        onPress={handleRequest}
        className="w-full py-4 rounded-xl flex-row items-center justify-center"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <Text className="text-white font-bold text-lg">Set as Default</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DefaultDialerPrompt;
