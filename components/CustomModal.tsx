import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { useTheme } from "../utils/ThemeContext";
import { X } from "lucide-react-native";

interface ModalButton {
  text: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  buttons?: ModalButton[];
  children?: React.ReactNode;
}

const CustomModal = ({
  visible,
  onClose,
  title,
  description,
  buttons,
  children,
}: CustomModalProps) => {
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-6">
        <Pressable className="absolute inset-0" onPress={onClose}>
          <View
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          />
        </Pressable>

        <View
          className="w-full max-w-[340px] rounded-[28px] p-6 shadow-xl elevation-10"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text
              className="text-xl font-extrabold tracking-[-0.5px]"
              style={{ color: colors.textPrimary }}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {description && (
            <Text
              className="text-[15px] leading-[22px] mb-5"
              style={{ color: colors.textSecondary }}
            >
              {description}
            </Text>
          )}

          {children}

          {buttons && buttons.length > 0 && (
            <View className="mt-2.5">
              {buttons.map((btn, index) => {
                const isPrimary = btn.variant === "primary" || !btn.variant;
                const isDanger = btn.variant === "danger";

                let bgColor = colors.primaryLight;
                let textColor = colors.primary;

                if (isPrimary) {
                  bgColor = colors.primary;
                  textColor = colors.background;
                } else if (isDanger) {
                  bgColor = colors.danger;
                  textColor = colors.white;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    className={`h-14 rounded-2xl justify-center items-center ${
                      index > 0 ? "mt-2.5" : ""
                    }`}
                    style={{ backgroundColor: bgColor }}
                    onPress={btn.onPress}
                  >
                    <Text
                      className="text-base font-bold"
                      style={{ color: textColor }}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
