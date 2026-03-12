import React, { useRef } from "react";
import { View, Text } from "react-native";
import { PhoneOutgoing, MessageCircle } from "lucide-react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { useTheme } from "../utils/ThemeContext";

interface SwipeableRowProps {
  children: React.ReactNode;
  onCall?: () => void;
  onMessage?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  containerStyle?: any;
  disabled?: boolean;
}

const ActionWrapper = ({
  direction,
  isFirst,
  isLast,
  progress,
}: {
  direction: "left" | "right";
  isFirst?: boolean;
  isLast?: boolean;
  progress: SharedValue<number>;
}) => {
  const { colors } = useTheme();

  const isLeft = direction === "left";
  // Left side (revealed by swiping right) -> Call (Success)
  // Right side (revealed by swiping left) -> Message (Warning/Message)
  const backgroundColor = isLeft ? colors.success : colors.message;

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 0.5],
      [0.6, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.5],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateX = interpolate(
      progress.value,
      [0, 0.5],
      [isLeft ? -20 : 20, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }, { translateX }],
      opacity,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.5],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const translateX = interpolate(
      progress.value,
      [0, 0.5],
      [isLeft ? -15 : 15, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <View className="w-full flex-row" style={{ backgroundColor }}>
      <View
        className={`flex-1 h-full flex-row items-center px-6 ${
          isLeft ? "justify-start" : "justify-end"
        }`}
      >
        {isLeft ? (
          <>
            <Reanimated.View style={iconStyle}>
              <PhoneOutgoing size={24} color={colors.white} />
            </Reanimated.View>
            <Reanimated.View className="ml-3" style={textStyle}>
              <Text
                className="text-lg font-bold"
                style={{ color: colors.white }}
              >
                Call
              </Text>
            </Reanimated.View>
          </>
        ) : (
          <>
            <Reanimated.View className="mr-3" style={textStyle}>
              <Text
                className="text-lg font-bold"
                style={{ color: colors.white }}
              >
                Message
              </Text>
            </Reanimated.View>
            <Reanimated.View style={iconStyle}>
              <MessageCircle size={24} color={colors.white} />
            </Reanimated.View>
          </>
        )}
      </View>
    </View>
  );
};

export const SwipeableRow = ({
  children,
  onCall,
  onMessage,
  isFirst,
  isLast,
  containerStyle,
  disabled = false,
}: SwipeableRowProps) => {
  const { colors } = useTheme();
  const swipeRef = useRef<SwipeableMethods>(null);

  if (disabled) {
    return <View style={containerStyle}>{children}</View>;
  }

  const handleOpen = (direction: "left" | "right") => {
    if (direction === "right") {
      onCall?.();
    } else {
      onMessage?.();
    }

    // Optional: Close after a delay to show the action was triggered
    setTimeout(() => {
      swipeRef.current?.close();
    }, 500);
  };

  return (
    <View
      style={[
        { overflow: "hidden" },
        isFirst && {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        isLast && {
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        },
        containerStyle,
      ]}
    >
      <ReanimatedSwipeable
        ref={swipeRef}
        friction={1.2}
        leftThreshold={60}
        rightThreshold={60}
        renderLeftActions={(progress) => (
          <ActionWrapper
            direction="left"
            isFirst={isFirst}
            isLast={isLast}
            progress={progress}
          />
        )}
        renderRightActions={(progress) => (
          <ActionWrapper
            direction="right"
            isFirst={isFirst}
            isLast={isLast}
            progress={progress}
          />
        )}
        onSwipeableOpen={handleOpen}
      >
        <View
          style={[
            { backgroundColor: colors.card, zIndex: 1 },
            isFirst && {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
            isLast && {
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            },
          ]}
        >
          {children}
        </View>
      </ReanimatedSwipeable>
    </View>
  );
};
