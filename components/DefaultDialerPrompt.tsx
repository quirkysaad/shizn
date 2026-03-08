import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  StyleSheet,
} from "react-native";
import { PhoneCall } from "lucide-react-native";
import { CallLogsModule } from "../modules/dialer-module";
import { useTheme } from "../utils/ThemeContext";

const DefaultDialerPrompt = ({ children }: { children: React.ReactNode }) => {
  const [isDefault, setIsDefault] = useState<boolean | null>(null);
  const { colors } = useTheme();

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
      setTimeout(checkDefault, 1000);
    } catch (e) {
      console.log("Error requesting default dialer", e);
    }
  };

  if (isDefault === null) return null;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!isDefault && (
        <View
          className="flex-1 items-center justify-center p-8"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.background,
            zIndex: 9999,
          }}
        >
          <View
            className="mb-8 h-24 w-24 items-center justify-center rounded-[48px]"
            style={{ backgroundColor: colors.successLight }}
          >
            <PhoneCall size={48} color={colors.success} />
          </View>
          <Text
            className="mb-4 text-center text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Default Phone App
          </Text>
          <Text
            className="mb-10 text-center text-base"
            style={{ color: colors.textSecondary }}
          >
            Shizn needs to be your default phone app to make and receive calls,
            and to show your call history.
          </Text>

          <TouchableOpacity
            onPress={handleRequest}
            className="w-full flex-row items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: colors.success }}
          >
            <Text className="text-lg font-bold" style={{ color: colors.white }}>
              Set as Default
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DefaultDialerPrompt;
