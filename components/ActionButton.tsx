import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";
import { LucideIcon } from "lucide-react-native";
import theme from "../utils/theme";
import clsx from "clsx";

interface ActionButtonProps extends TouchableOpacityProps {
  icon: LucideIcon;
  label: string;
}

const ActionButton = ({
  icon: Icon,
  label,
  className,
  ...props
}: ActionButtonProps) => {
  return (
    <TouchableOpacity
      className={clsx(
        "flex-row items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-primaryLight border border-border",
        className,
      )}
      activeOpacity={0.7}
      {...props}
    >
      <Icon size={20} color={theme.colors.primary} />
      {label && (
        <Text className="font-medium text-[16px] text-primary">{label}</Text>
      )}
    </TouchableOpacity>
  );
};

export default ActionButton;
