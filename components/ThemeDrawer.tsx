import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import {
  Sun,
  Moon,
  Smartphone,
  Check,
  X,
  RefreshCw,
} from "lucide-react-native";
import { useTheme, ThemeMode } from "../utils/ThemeContext";
import { CallLogsModule } from "../modules/dialer-module";
import { checkUpdate, openUpdateLink } from "../utils/updateChecker";
import Constants from "expo-constants";
import CustomModal from "./CustomModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface ThemeDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    mode: "light",
    label: "Light",
    icon: Sun,
    description: "Always use the light theme",
  },
  {
    mode: "dark",
    label: "Dark",
    icon: Moon,
    description: "Always use the dark theme",
  },
  {
    mode: "system",
    label: "System Default",
    icon: Smartphone,
    description: "Match your device settings",
  },
];

const ThemeDrawer = ({ visible, onClose }: ThemeDrawerProps) => {
  const { mode, setMode, colors, isDark } = useTheme();
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = React.useState(visible);
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    description: string;
    buttons: any[];
  }>({ visible: false, title: "", description: "", buttons: [] });
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.value = withSpring(0, {
        damping: 22,
        stiffness: 200,
        mass: 0.8,
      });
      overlayOpacity.value = withTiming(1, { duration: 300 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 250 });
      translateX.value = withTiming(
        -DRAWER_WIDTH,
        { duration: 250 },
        (finished) => {
          if (finished) {
            runOnJS(setShouldRender)(false);
          }
        },
      );
    }
  }, [visible]);

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleSelect = (selectedMode: ThemeMode) => {
    setMode(selectedMode);
  };

  const handleManualUpdateCheck = async () => {
    setIsCheckingUpdate(true);
    try {
      const update = await checkUpdate();
      if (update && update.isNewer) {
        setAlertConfig({
          visible: true,
          title: "Update Available",
          description: `Version ${update.version} is available. Would you like to update now?`,
          buttons: [
            {
              text: "Update Now",
              onPress: () => {
                openUpdateLink(update.url);
                setAlertConfig((p) => ({ ...p, visible: false }));
              },
            },
            {
              text: "Later",
              variant: "secondary",
              onPress: () => setAlertConfig((p) => ({ ...p, visible: false })),
            },
          ],
        });
      } else {
        setAlertConfig({
          visible: true,
          title: "Up to Date",
          description: `Shizn is already running the latest version (${appVersion}).`,
          buttons: [
            {
              text: "Awesome",
              onPress: () => setAlertConfig((p) => ({ ...p, visible: false })),
            },
          ],
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Check Failed",
        description:
          "Could not check for updates. Please check your internet connection.",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertConfig((p) => ({ ...p, visible: false })),
          },
        ],
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      className="absolute top-0 left-0 right-0 bottom-0"
      style={{ zIndex: 9998 }}
    >
      <CustomModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        description={alertConfig.description}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
      />
      {/* Overlay */}
      <Animated.View
        className="absolute top-0 left-0 right-0 bottom-0"
        style={[{ backgroundColor: "rgba(0,0,0,0.5)" }, overlayAnimatedStyle]}
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        className="absolute top-0 left-0 bottom-0 rounded-r-3xl shadow-2xl elevation-20"
        style={[
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.background,
          },
          drawerAnimatedStyle,
        ]}
      >
        {/* Header */}
        <View
          className="pt-[60] px-6 pb-6 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <View className="flex-row justify-between items-center">
            <Text
              className="text-2xl font-bold tracking-tighter"
              style={{ color: colors.textPrimary }}
            >
              Appearance
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full justify-center items-center"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text
            className="text-sm mt-1.5"
            style={{ color: colors.textSecondary }}
          >
            Choose how Shizn looks to you
          </Text>
        </View>

        <View className="px-4 pt-5">
          {THEME_OPTIONS.map((option) => {
            const isSelected = mode === option.mode;
            const IconComponent = option.icon;

            return (
              <TouchableOpacity
                key={option.mode}
                activeOpacity={0.7}
                onPress={() => handleSelect(option.mode)}
                className="flex-row items-center p-4 mb-2 rounded-2xl border"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.04)"
                    : "transparent",
                  borderColor: isSelected
                    ? isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.15)"
                    : colors.border,
                }}
              >
                <View
                  className="w-11 h-11 rounded-xl justify-center items-center mr-3.5"
                  style={{
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(0,0,0,0.06)"
                      : colors.primaryLight,
                  }}
                >
                  <IconComponent
                    size={22}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base ${isSelected ? "font-semibold" : "font-medium"}`}
                    style={{ color: colors.textPrimary }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    className="text-[13px] mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer Actions */}
        <View className="mt-auto pb-10">
          <TouchableOpacity
            onPress={() => CallLogsModule.openAppSettings?.()}
            className="mx-4 mt-4 p-3.5 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Smartphone
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text className="font-semibold" style={{ color: colors.primary }}>
              App Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleManualUpdateCheck}
            disabled={isCheckingUpdate}
            className="mx-4 mt-3 p-3.5 rounded-xl border flex-row items-center justify-center"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              borderColor: colors.border,
            }}
          >
            {isCheckingUpdate ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <View className="flex-row items-center justify-center">
                <RefreshCw
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Check for Updates
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text
            className="text-center mt-4 text-[12px] opacity-60"
            style={{ color: colors.textSecondary }}
          >
            Shizn v{appVersion}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default ThemeDrawer;
