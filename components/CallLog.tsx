import React, { useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  MessageSquare,
} from "lucide-react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { CallLogsModule } from "../modules/dialer-module";
import { CallSectionProps, CallTypes } from "../types";
import { Alert } from "react-native";
import { useRecents } from "../utils/AppProviders";
import theme from "../utils/theme";
import clsx from "clsx";

interface CallLogItemProps {
  logIndex: number;
  isLastLogOfSection: boolean;
  logItem: CallSectionProps["data"][number];
}

type ActionProps = {
  direction: "right" | "left";
} & Omit<CallLogItemProps, "logItem">;

const IconMap: Record<
  Exclude<CallTypes, "UNKNOWN">,
  { IconComponent: any; color: string }
> = {
  INCOMING: { IconComponent: PhoneIncoming, color: theme.colors.success },
  OUTGOING: { IconComponent: Phone, color: theme.colors.primary },
  MISSED: { IconComponent: PhoneMissed, color: theme.colors.danger },
  REJECTED: { IconComponent: PhoneMissed, color: theme.colors.danger },
};

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const DragObserver = ({
  drag,
  dragX,
}: {
  drag: SharedValue<number>;
  dragX: SharedValue<number>;
}) => {
  useAnimatedReaction(
    () => drag.value,
    (val) => {
      dragX.value = val;
    },
  );
  return null;
};

const CallLog = ({
  logItem,
  logIndex,
  isLastLogOfSection,
}: CallLogItemProps) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const { refresh } = useRecents();

  const dragX = useSharedValue(0);

  const rowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        Math.abs(dragX.value),
        [0, 200],
        [1, 0.1],
        Extrapolation.CLAMP,
      ),
    };
  });

  const iconData = IconMap[logItem.type as keyof typeof IconMap] || {
    IconComponent: Phone,
    color: theme.colors.textSecondary,
  };

  const handleCall = useCallback(() => {
    if (logItem.number && logItem.number !== "Unknown") {
      CallLogsModule.makeCall(logItem.number);
    }
  }, [logItem.number]);

  const handleMessage = useCallback(() => {
    if (logItem.number && logItem.number !== "Unknown") {
      Linking.openURL(`sms:${logItem.number}`);
    }
  }, [logItem.number]);

  const handleLongPress = useCallback(() => {
    if (!logItem.id) return;
    Alert.alert(
      "Delete Call Log",
      "Are you sure you want to delete this call log?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await CallLogsModule.deleteCallLog(logItem.id!);
            refresh();
          },
        },
      ],
    );
  }, [logItem.id, refresh]);

  const duration = formatDuration(logItem.duration);
  const timestamp = new Date(logItem.date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const displayName =
    logItem.name && logItem.name !== "Unknown" ? logItem.name : logItem.number;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      dragOffsetFromLeftEdge={30}
      leftThreshold={120}
      renderLeftActions={(prog, drag) => (
        <>
          <DragObserver drag={drag} dragX={dragX} />
          <ActionWrapper
            direction="left"
            logIndex={logIndex}
            isLastLogOfSection={isLastLogOfSection}
          />
        </>
      )}
      dragOffsetFromRightEdge={30}
      rightThreshold={120}
      renderRightActions={(prog, drag) => (
        <>
          <DragObserver drag={drag} dragX={dragX} />
          <ActionWrapper
            direction="right"
            logIndex={logIndex}
            isLastLogOfSection={isLastLogOfSection}
          />
        </>
      )}
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          handleMessage();
        } else {
          handleCall();
        }
        swipeRef.current?.close();
      }}
      containerStyle={{ overflow: "hidden" }}
    >
      <Reanimated.View style={rowAnimatedStyle}>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={handleLongPress}
          className={clsx(
            "flex-row items-center bg-card px-4 py-[14px] mx-2 border-b-border",
            logIndex === 0 && "rounded-t-2xl",
            isLastLogOfSection ? "rounded-b-2xl border-b-0" : "border-b",
          )}
        >
          <View className="w-11 h-11 rounded-full justify-center items-center mr-[14px]">
            <iconData.IconComponent color={iconData.color} size={22} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-[6px]">
              <Text
                className="text-[17px] font-medium"
                style={{
                  fontSize: 17,
                  fontWeight: "500",
                  color:
                    logItem.type === "MISSED"
                      ? theme.colors.danger
                      : theme.colors.textPrimary,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>
            <View className="flex-row items-center mt-[3px]">
              <Text
                className="text-[13px]"
                style={{ color: theme.colors.textSecondary }}
              >
                {logItem.type === "INCOMING"
                  ? "Incoming"
                  : logItem.type === "OUTGOING"
                    ? "Outgoing"
                    : logItem.type === "MISSED"
                      ? "Missed"
                      : "Rejected"}
              </Text>
              <Text
                className="text-[13px]"
                style={{ color: theme.colors.textSecondary }}
              >
                {" \u00B7 "}
                {timestamp}
              </Text>
              {duration ? (
                <Text
                  className="text-[13px]"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {" \u00B7 "}
                  {duration}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCall}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              padding: 8,
              backgroundColor: theme.colors.primaryLight,
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Phone color={theme.colors.primary} size={20} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Reanimated.View>
    </ReanimatedSwipeable>
  );
};

const ActionWrapper = ({
  direction,
  logIndex,
  isLastLogOfSection,
}: ActionProps) => {
  return (
    <Reanimated.View
      className={clsx("px-2 w-full overflow-hidden", {
        "rounded-t-2xl": logIndex === 0,
        "rounded-b-2xl": isLastLogOfSection,
      })}
    >
      {direction === "right" ? (
        <RightAction
          className={clsx({
            "rounded-t-2xl": logIndex === 0,
            "rounded-b-2xl": isLastLogOfSection,
          })}
        />
      ) : (
        <LeftAction
          className={clsx({
            "rounded-t-2xl": logIndex === 0,
            "rounded-b-2xl": isLastLogOfSection,
          })}
        />
      )}
    </Reanimated.View>
  );
};

const RightAction = ({ className }: { className: string }) => (
  <View
    className={clsx(
      className,
      "flex-row justify-end items-center gap-2 w-full h-full bg-primary px-4",
    )}
  >
    <Text className="text-lg font-semibold text-white">{"Message"}</Text>
    <MessageSquare size={22} color={theme.colors.white} />
  </View>
);

const LeftAction = ({ className }: { className: string }) => (
  <View
    className={clsx(
      className,
      "flex-row items-center gap-2 w-full h-full bg-success px-4",
    )}
  >
    <Phone size={22} color={theme.colors.white} />
    <Text className="text-lg font-semibold text-white">{"Call"}</Text>
  </View>
);

export default React.memo(CallLog);
