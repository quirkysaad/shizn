import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import * as ContactsModule from "expo-contacts";
import { User, Phone } from "lucide-react-native";
import { useTheme } from "../utils/ThemeContext";
import { SwipeableRow } from "./SwipeableRow";

interface ContactItemProps {
  item: ContactsModule.Contact;
  index: number;
  isLastLogOfSection?: boolean;
  onPress?: () => void;
  onCall?: (n: string) => void;
  className?: string;
  style?: any;
  swipeDisabled?: boolean;
}

const ContactItem = React.memo(
  ({
    item,
    index,
    isLastLogOfSection = false,
    onPress,
    onCall,
    style: containerStyle,
    swipeDisabled = false,
  }: ContactItemProps) => {
    const { colors } = useTheme();

    const handleCall = useCallback(() => {
      const number = item.phoneNumbers?.[0]?.number;
      if (number) {
        onCall?.(number);
      }
    }, [item.phoneNumbers, onCall]);

    const handleMessage = useCallback(() => {
      const number = item.phoneNumbers?.[0]?.number;
      if (number) {
        Linking.openURL(`sms:${number}`);
      }
    }, [item.phoneNumbers]);

    return (
      <SwipeableRow
        onCall={handleCall}
        onMessage={handleMessage}
        isFirst={index === 0}
        isLast={isLastLogOfSection}
        disabled={swipeDisabled}
        containerStyle={{ marginHorizontal: 8 }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          className="flex-row items-center border-b px-2 py-5"
          style={[
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.card,
            },
            index === 0 && {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
            isLastLogOfSection && {
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            },
            containerStyle,
          ]}
        >
          <View
            className="mr-4 h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <User size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center gap-[6px]">
              <Text
                className="text-base font-medium"
                style={{ color: colors.textPrimary }}
                numberOfLines={1}
              >
                {item.name || "No Name"}
              </Text>
            </View>
            {item.phoneNumbers && item.phoneNumbers.length > 0 ? (
              <Text
                className="mt-0.5 text-[13px]"
                style={{ color: colors.textSecondary }}
              >
                {item.phoneNumbers[0].number}
              </Text>
            ) : null}
          </View>
          {onCall && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                handleCall();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="h-10 w-10 items-center justify-center rounded-full p-2"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <Phone size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    );
  },
);

export default ContactItem;
