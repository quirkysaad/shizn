import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { useTheme } from "../utils/ThemeContext";

interface ActionButtonProps extends TouchableOpacityProps {
  icon: LucideIcon;
  label: string;
}

const ActionButton = ({
  icon: Icon,
  label,
  style,
  ...props
}: ActionButtonProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center rounded-full border px-6 py-[14px] gap-2"
      style={[
        {
          backgroundColor: colors.primaryLight,
          borderColor: colors.border,
        },
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      <Icon size={20} color={colors.primary} />
      {label ? (
        <Text
          className="text-base font-medium"
          style={{ color: colors.primary }}
        >
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default ActionButton;
