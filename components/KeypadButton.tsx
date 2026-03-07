import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { cn } from "../utils/tailwind-utils";

interface KeypadButtonProps {
    number: string;
    letters?: string;
    onPress: (value: string) => void;
    onLongPress?: (value: string) => void;
    className?: string;
}

const KeypadButton = ({ number, letters, onPress, onLongPress, className }: KeypadButtonProps) => {
    return (
        <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onPress(number)}
            onLongPress={() => onLongPress && onLongPress(number)}
            className={cn(
                "w-[80px] h-[80px] justify-center items-center",
                className
            )}
        >
            <Text className="text-3xl font-normal text-textPrimary">{number}</Text>
            {letters ? (
                <Text className="text-sm text-textSecondary tracking-widest font-medium mt-1 uppercase">
                    {letters}
                </Text>
            ) : (
                <View className="h-[14px] mt-1" />
            )}
        </TouchableOpacity>
    );
};

export default KeypadButton;
