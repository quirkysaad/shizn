import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { useTheme } from "../utils/ThemeContext";

interface KeypadButtonProps {
  number: string;
  letters?: string;
  onPress: (value: string) => void;
  onLongPress?: (value: string) => void;
}

const KeypadButton = ({
  number,
  letters,
  onPress,
  onLongPress,
}: KeypadButtonProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => onPress(number)}
      onLongPress={() => onLongPress && onLongPress(number)}
      className="mx-3 h-20 w-20 items-center justify-center"
    >
      <Text
        className="text-[30px] font-normal"
        style={{ color: colors.textPrimary }}
      >
        {number}
      </Text>
      {letters ? (
        <Text
          className="mt-1 text-sm font-medium uppercase"
          style={{
            color: colors.textSecondary,
            letterSpacing: 1,
          }}
        >
          {letters}
        </Text>
      ) : (
        <View className="mt-1 h-[14px]" />
      )}
    </TouchableOpacity>
  );
};

export default KeypadButton;
