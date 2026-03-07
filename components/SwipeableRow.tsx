import React, { useRef } from "react";
import { View, Text, Linking } from "react-native";
import { PhoneOutgoing, MessageCircle } from "lucide-react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import theme from "../utils/theme";
import clsx from "clsx";

interface SwipeableRowProps {
  children: React.ReactNode;
  onCall?: () => void;
  onMessage?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  containerStyle?: any;
  disabled?: boolean;
}

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

const ActionWrapper = ({
  direction,
  isFirst,
  isLast,
}: {
  direction: "left" | "right";
  isFirst?: boolean;
  isLast?: boolean;
}) => {
  return (
    <Reanimated.View
      className={clsx("px-2 w-full overflow-hidden", {
        "rounded-t-2xl": isFirst,
        "rounded-b-2xl": isLast,
      })}
    >
      {direction === "right" ? (
        <RightAction isFirst={isFirst} isLast={isLast} />
      ) : (
        <LeftAction isFirst={isFirst} isLast={isLast} />
      )}
    </Reanimated.View>
  );
};

const RightAction = ({
  isFirst,
  isLast,
}: {
  isFirst?: boolean;
  isLast?: boolean;
}) => (
  <View
    className={clsx(
      "flex-row justify-end items-center gap-2 w-full h-full bg-message px-4",
      {
        "rounded-t-2xl": isFirst,
        "rounded-b-2xl": isLast,
      },
    )}
  >
    <Text className="text-lg font-semibold text-white">{"Message"}</Text>
    <MessageCircle size={22} color={theme.colors.white} />
  </View>
);

const LeftAction = ({
  isFirst,
  isLast,
}: {
  isFirst?: boolean;
  isLast?: boolean;
}) => (
  <View
    className={clsx(
      "flex-row items-center gap-2 w-full h-full bg-success px-4",
      {
        "rounded-t-2xl": isFirst,
        "rounded-b-2xl": isLast,
      },
    )}
  >
    <PhoneOutgoing size={22} color={theme.colors.white} />
    <Text className="text-lg font-semibold text-white">{"Call"}</Text>
  </View>
);

export const SwipeableRow = ({
  children,
  onCall,
  onMessage,
  isFirst,
  isLast,
  containerStyle,
  disabled = false,
}: SwipeableRowProps) => {
  const swipeRef = useRef<SwipeableMethods>(null);
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

  if (disabled) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      dragOffsetFromLeftEdge={30}
      leftThreshold={120}
      renderLeftActions={(prog, drag) => (
        <>
          <DragObserver drag={drag} dragX={dragX} />
          <ActionWrapper direction="left" isFirst={isFirst} isLast={isLast} />
        </>
      )}
      dragOffsetFromRightEdge={30}
      rightThreshold={120}
      renderRightActions={(prog, drag) => (
        <>
          <DragObserver drag={drag} dragX={dragX} />
          <ActionWrapper direction="right" isFirst={isFirst} isLast={isLast} />
        </>
      )}
      onSwipeableOpen={(direction) => {
        if (direction === "left") {
          onMessage?.();
        } else {
          onCall?.();
        }
        swipeRef.current?.close();
      }}
      containerStyle={[{ overflow: "hidden" }, containerStyle]}
    >
      <Reanimated.View style={rowAnimatedStyle}>{children}</Reanimated.View>
    </ReanimatedSwipeable>
  );
};
