import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import Animated, {
  FadeInDown,
  SlideInDown,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Phone,
  BellOff,
  MicOff,
  Grid,
  Volume2,
} from "lucide-react-native";
import { CallLogsModule } from "../modules/dialer-module";
import { useCallState, useContacts } from "../utils/AppProviders";
import theme from "../utils/theme";

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const DTMF_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const CallScreen = () => {
  const { callState } = useCallState();
  const { contacts } = useContacts();
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [dtmfDigits, setDtmfDigits] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (callState?.state === 4 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    if (!callState) {
      setTimer(0);
      setIsMuted(false);
      setIsSpeaker(false);
      setShowKeypad(false);
      setDtmfDigits("");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (!callState && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState?.state]);

  const handleAnswer = useCallback(() => {
    try {
      CallLogsModule.answerCall?.();
    } catch (_e) {}
  }, []);
  const handleReject = useCallback(() => {
    try {
      CallLogsModule.rejectCall?.();
    } catch (_e) {}
  }, []);
  const handleEndCall = useCallback(() => {
    try {
      CallLogsModule.disconnectCall?.();
    } catch (_e) {}
  }, []);

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try {
      CallLogsModule.toggleMute?.(newMuted);
    } catch (_e) {}
  }, [isMuted]);

  const handleToggleSpeaker = useCallback(() => {
    const newSpeaker = !isSpeaker;
    setIsSpeaker(newSpeaker);
    try {
      CallLogsModule.toggleSpeaker?.(newSpeaker);
    } catch (_e) {}
  }, [isSpeaker]);

  const handleSendDtmf = useCallback((digit: string) => {
    setDtmfDigits((prev) => prev + digit);
    try {
      CallLogsModule.sendDtmf?.(digit);
    } catch (_e) {}
  }, []);

  const matchedContact = React.useMemo(() => {
    if (!callState?.number || callState.number === "Unknown") return null;
    const cleanNumber = callState.number.replace(/\D/g, "");
    if (!cleanNumber) return null;
    const matchTarget =
      cleanNumber.length > 7 ? cleanNumber.slice(-10) : cleanNumber;

    return contacts.find((c) =>
      c.phoneNumbers?.some((p) => {
        const pClean = p.number?.replace(/\D/g, "");
        if (!pClean) return false;
        const pTarget = pClean.length > 7 ? pClean.slice(-10) : pClean;
        return pTarget === matchTarget;
      }),
    );
  }, [contacts, callState?.number]);

  if (!callState) return null;

  const isRinging = callState.state === 2;
  const isDialing =
    callState.state === 3 || callState.state === 9 || callState.state === 1;
  const isActive = callState.state === 4;

  const statusText = isRinging
    ? "Incoming call"
    : isDialing
      ? "Calling..."
      : isActive
        ? formatTimer(timer)
        : "Connecting...";

  const displayName =
    callState.name || matchedContact?.name || callState.number;

  return (
    <Animated.View
      entering={SlideInDown.duration(400)}
      style={StyleSheet.absoluteFillObject}
      className="z-[9999] bg-background elevation-[999]"
    >
      <SafeAreaView className="flex-1 justify-between py-5">
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="items-center mt-10"
        >
          <Text className="text-textSecondary text-base font-medium tracking-[1px] mb-2">
            {statusText}
          </Text>
          <Text className="text-textPrimary text-[34px] font-light tracking-[-0.5px] mb-[6px]">
            {displayName}
          </Text>
          {showKeypad && dtmfDigits ? (
            <Text className="text-textPrimary text-xl font-normal tracking-[2px]">
              {dtmfDigits}
            </Text>
          ) : (
            <Text className="text-textSecondary text-sm">
              {matchedContact ? callState.number : "Mobile"}
            </Text>
          )}
        </Animated.View>

        {!showKeypad ? (
          <Animated.View
            entering={ZoomIn.delay(300).duration(400)}
            className="items-center my-5 flex-1 justify-center"
          >
            <View className="w-[120px] h-[120px] rounded-[60px] bg-primaryLight justify-center items-center">
              <User size={56} color={theme.colors.primary} />
            </View>
          </Animated.View>
        ) : (
          <View className="flex-1 justify-center px-[50px]">
            {DTMF_KEYS.map((row, rowIdx) => (
              <View key={rowIdx} className="flex-row justify-evenly mb-3">
                {row.map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    className="w-[72px] h-[72px] rounded-[36px] bg-card justify-center items-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                    onPress={() => handleSendDtmf(digit)}
                  >
                    <Text className="text-textPrimary text-[28px] font-light">
                      {digit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {!isRinging && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
            className="flex-row justify-evenly px-[30px] mb-5"
          >
            <ActionButton
              Icon={MicOff}
              label="Mute"
              active={isMuted}
              onPress={handleToggleMute}
            />
            <ActionButton
              Icon={Grid}
              label={showKeypad ? "Hide" : "Keypad"}
              active={showKeypad}
              onPress={() => setShowKeypad(!showKeypad)}
            />
            <ActionButton
              Icon={Volume2}
              label="Speaker"
              active={isSpeaker}
              onPress={handleToggleSpeaker}
            />
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          className="px-10 pb-5"
        >
          {isRinging ? (
            <View className="flex-row justify-between">
              <View className="items-center">
                <TouchableOpacity
                  className="w-[75px] h-[75px] rounded-[37.5px] bg-danger justify-center items-center"
                  style={{
                    shadowColor: theme.colors.danger,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleReject}
                >
                  <Phone
                    size={32}
                    color="white"
                    style={{ transform: [{ rotate: "135deg" }] }}
                  />
                </TouchableOpacity>
                <Text className="text-textSecondary text-[13px] mt-2 font-medium">
                  {"Decline"}
                </Text>
              </View>
              <View className="items-center">
                <TouchableOpacity
                  className="w-[60px] h-[60px] rounded-[30px] bg-primaryLight justify-center items-center"
                  onPress={() => {
                    try {
                      CallLogsModule.silenceRingtone?.();
                    } catch (_e) {}
                  }}
                >
                  <BellOff size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text className="text-textSecondary text-[13px] mt-2 font-medium">
                  {"Silence"}
                </Text>
              </View>
              <View className="items-center">
                <TouchableOpacity
                  className="w-[75px] h-[75px] rounded-[37.5px] bg-success justify-center items-center"
                  style={{
                    shadowColor: theme.colors.success,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleAnswer}
                >
                  <Phone size={32} color="white" />
                </TouchableOpacity>
                <Text className="text-textSecondary text-[13px] mt-2 font-medium">
                  {"Accept"}
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex-row justify-center">
              <TouchableOpacity
                className="w-[75px] h-[75px] rounded-[37.5px] bg-danger justify-center items-center"
                style={{
                  shadowColor: theme.colors.danger,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleEndCall}
              >
                <Phone
                  size={32}
                  color="white"
                  style={{ transform: [{ rotate: "135deg" }] }}
                />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const ActionButton = ({
  Icon,
  label,
  active,
  onPress,
}: {
  Icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`w-[72px] h-[72px] rounded-[36px] justify-center items-center ${active ? "bg-primary" : "bg-primaryLight"}`}
  >
    <Icon
      size={24}
      color={active ? theme.colors.white : theme.colors.primary}
    />
    <Text
      className={`text-[11px] mt-1 font-medium ${active ? "text-primaryLight" : "text-primary"}`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Styles that could not be easily translated to NativeWind without losing shadow cross-platform functionality
// or requiring absoluteFillObject spread.
// Removing unused styles as they are now Tailwind classes.

export default React.memo(CallScreen);
