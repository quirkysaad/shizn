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
import { useTheme } from "../utils/ThemeContext";

import CustomModal from "./CustomModal";

const DefaultDialerPrompt = ({ children }: { children: React.ReactNode }) => {
  const [isDefault, setIsDefault] = useState<boolean | null>(null);
  const { colors } = useTheme();
  const [showHelp, setShowHelp] = useState(false);

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
      const result = await CallLogsModule.requestDefaultDialer();
      if (!result) {
        // If not immediately default, wait a bit and check
        setTimeout(async () => {
          const stillNotDefault = !(await CallLogsModule.isDefaultDialer());
          if (stillNotDefault) {
            // Likely restricted on Android 13+
            setShowHelp(true);
          }
        }, 1000);
      }
    } catch (e) {
      console.log("Error requesting default dialer", e);
      setShowHelp(true);
    }
  };

  if (isDefault === null) return null;

  return (
    <View className="flex-1">
      {children}
      <CustomModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        title="Restricted Settings"
        description="Android 13+ occasionally blocks apps from becoming default dialers. Follow these quick steps to fix it:"
        buttons={[
          {
            text: "1. Open App Info",
            onPress: () => CallLogsModule.openAppSettings?.(),
          },
          {
            text: "Got it",
            variant: "secondary",
            onPress: () => setShowHelp(false),
          },
        ]}
      >
        <View className="mb-6 gap-3">
          <View className="flex-row items-start">
            <View
              className="mr-3 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary + "1A" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.primary }}
              >
                1
              </Text>
            </View>
            <Text
              className="flex-1 text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Tap{" "}
              <Text className="font-bold" style={{ color: colors.textPrimary }}>
                Open App Info
              </Text>{" "}
              above.
            </Text>
          </View>
          <View className="flex-row items-start">
            <View
              className="mr-3 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary + "1A" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.primary }}
              >
                2
              </Text>
            </View>
            <Text
              className="flex-1 text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Tap the{" "}
              <Text className="font-bold" style={{ color: colors.textPrimary }}>
                ⋮ menu
              </Text>{" "}
              (top right corner).
            </Text>
          </View>
          <View className="flex-row items-start">
            <View
              className="mr-3 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary + "1A" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.primary }}
              >
                3
              </Text>
            </View>
            <Text
              className="flex-1 text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Select{" "}
              <Text className="font-bold" style={{ color: colors.textPrimary }}>
                Allow restricted settings
              </Text>
              .
            </Text>
          </View>
          <View className="flex-row items-start">
            <View
              className="mr-3 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary + "1A" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.primary }}
              >
                4
              </Text>
            </View>
            <Text
              className="flex-1 text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Return here and tap{" "}
              <Text className="font-bold" style={{ color: colors.textPrimary }}>
                Set as Default
              </Text>{" "}
              again.
            </Text>
          </View>
        </View>
      </CustomModal>

      {!isDefault && (
        <View
          className="absolute inset-0 z-[9999] flex-1 items-center justify-center p-8"
          style={{ backgroundColor: colors.background }}
        >
          <View
            className="mb-6 h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.success + "15" }}
          >
            <PhoneCall size={48} color={colors.success} />
          </View>
          <Text
            className="mb-4 text-center text-3xl font-extrabold tracking-tight"
            style={{ color: colors.textPrimary }}
          >
            Default Phone App
          </Text>
          <Text
            className="mb-10 text-center text-base leading-6 px-2.5"
            style={{ color: colors.textSecondary }}
          >
            To securely manage your calls and provide high-quality service,
            Shizn needs to be set as your primary dialer.
          </Text>

          <TouchableOpacity
            onPress={handleRequest}
            activeOpacity={0.8}
            className="w-full h-16 flex-row items-center justify-center rounded-2xl shadow-lg"
            style={{
              backgroundColor: colors.success,
              shadowColor: colors.success,
            }}
          >
            <Text className="text-lg font-bold" style={{ color: colors.white }}>
              Set as Default
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowHelp(true)}
            className="mt-6 py-2"
          >
            <Text
              className="font-semibold underline opacity-70"
              style={{ color: colors.textSecondary }}
            >
              Having trouble setting it?
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DefaultDialerPrompt;
