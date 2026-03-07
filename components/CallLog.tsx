import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from "lucide-react-native";
import { CallLogsModule } from "../modules/dialer-module";
import { CallSectionProps, CallTypes } from "../types";
import { Alert } from "react-native";
import { useRecents } from "../utils/AppProviders";
import theme from "../utils/theme";
import clsx from "clsx";
import { SwipeableRow } from "./SwipeableRow";

interface CallLogItemProps {
  logIndex: number;
  isLastLogOfSection: boolean;
  logItem: CallSectionProps["data"][number];
  swipeDisabled?: boolean;
  hideCallButton?: boolean;
  onPress?: () => void;
}

const IconMap: Record<
  Exclude<CallTypes, "UNKNOWN">,
  { IconComponent: any; color: string }
> = {
  INCOMING: { IconComponent: PhoneIncoming, color: theme.colors.success },
  OUTGOING: { IconComponent: PhoneOutgoing, color: theme.colors.primary },
  MISSED: { IconComponent: PhoneMissed, color: theme.colors.warning },
  REJECTED: { IconComponent: PhoneMissed, color: theme.colors.danger },
};

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const CallLog = ({
  logItem,
  logIndex,
  isLastLogOfSection,
  swipeDisabled = false,
  hideCallButton = false,
  onPress,
}: CallLogItemProps) => {
  const { refresh } = useRecents();

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
    <SwipeableRow
      onCall={handleCall}
      onMessage={handleMessage}
      isFirst={logIndex === 0}
      isLast={isLastLogOfSection}
      disabled={swipeDisabled}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
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
            <Text className="text-[17px] font-medium" numberOfLines={1}>
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
        {!hideCallButton && (
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
        )}
      </TouchableOpacity>
    </SwipeableRow>
  );
};

export default React.memo(CallLog);
