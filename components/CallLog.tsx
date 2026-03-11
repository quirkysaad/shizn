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
import { useTheme } from "../utils/ThemeContext";
import { SwipeableRow } from "./SwipeableRow";

interface CallLogItemProps {
  logIndex: number;
  isLastLogOfSection: boolean;
  logItem: CallSectionProps["data"][number];
  swipeDisabled?: boolean;
  hideCallButton?: boolean;
  onPress?: () => void;
}

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
  const { colors } = useTheme();

  const IconMap: Record<
    Exclude<CallTypes, "UNKNOWN">,
    { IconComponent: any; color: string }
  > = {
    INCOMING: { IconComponent: PhoneIncoming, color: colors.success },
    OUTGOING: { IconComponent: PhoneOutgoing, color: colors.primary },
    MISSED: { IconComponent: PhoneMissed, color: colors.warning },
    REJECTED: { IconComponent: PhoneMissed, color: colors.danger },
  };

  const iconData = IconMap[logItem.type as keyof typeof IconMap] || {
    IconComponent: Phone,
    color: colors.textSecondary,
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
        className="flex-row items-center px-4 py-2.5"
        style={{
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          ...(logIndex === 0 && {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }),
          ...(isLastLogOfSection
            ? {
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              borderBottomWidth: 0,
            }
            : { borderBottomWidth: 1 }),
        }}
      >
        <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-full">
          <iconData.IconComponent color={iconData.color} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center gap-[6px]">
            <Text
              className="text-[17px] font-medium"
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
          </View>
          <View className="mt-[3px] flex-row items-center">
            <Text
              className="text-[13px]"
              style={{ color: colors.textSecondary }}
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
              style={{ color: colors.textSecondary }}
            >
              {" \u00B7 "}
              {timestamp}
            </Text>
            {duration ? (
              <Text
                className="text-[13px]"
                style={{ color: colors.textSecondary }}
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
            className="h-10 w-10 items-center justify-center rounded-full p-2"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Phone color={colors.primary} size={20} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </SwipeableRow>
  );
};

export default React.memo(CallLog);
