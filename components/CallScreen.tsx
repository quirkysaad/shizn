import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
  X,
  Delete,
  Pause,
  Play,
  UserPlus,
  Users,
} from "lucide-react-native";
import { CallLogsModule } from "../modules/dialer-module";
import { useCallState, useContacts } from "../utils/AppProviders";
import { useTheme } from "../utils/ThemeContext";

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
  const { colors } = useTheme();
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [dtmfDigits, setDtmfDigits] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wasInCall = useRef(false);

  useEffect(() => {
    if (callState) {
      wasInCall.current = true;
    }

    if (callState?.state === 4 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    if (!callState) {
      wasInCall.current = false;
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
  }, [callState?.state]);

  useEffect(() => {
    if (callState) {
      if (callState.isMuted !== undefined) setIsMuted(callState.isMuted);
      if (callState.audioRoute !== undefined)
        setIsSpeaker(callState.audioRoute === 2);
    }
  }, [callState?.isMuted, callState?.audioRoute]);

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

  const handleToggleHold = useCallback(() => {
    const isOnHold = callState?.state === 3;
    try {
      CallLogsModule.toggleHold?.(!isOnHold);
    } catch (_e) {}
  }, [callState?.state]);

  const handleMerge = useCallback(() => {
    try {
      CallLogsModule.mergeCalls?.();
    } catch (_e) {}
  }, []);

  const [lastDigit, setLastDigit] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendDtmf = useCallback((digit: string) => {
    setDtmfDigits((prev) => prev + digit);
    setLastDigit(digit);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setLastDigit(null);
      flashTimer.current = null;
    }, 800);

    try {
      CallLogsModule.sendDtmf?.(digit);
    } catch (_e) {}
  }, []);

  const handleBackspace = useCallback(() => {
    setDtmfDigits((prev) => prev.slice(0, -1));
    setLastDigit(null);
  }, []);

  const handleLongBackspace = useCallback(() => {
    setDtmfDigits("");
    setLastDigit(null);
  }, []);

  const matchedContact = React.useMemo(() => {
    if (!callState?.number || callState.number === "Unknown") return null;

    const cleanNumber = callState.number.replace(/\D/g, "");
    if (!cleanNumber) return null;

    const matchTarget =
      cleanNumber.length >= 10 ? cleanNumber.slice(-10) : cleanNumber;

    return contacts.find((c) =>
      c.phoneNumbers?.some((p) => {
        const pClean = (p.number || "").replace(/\D/g, "");
        if (!pClean) return false;
        const pTarget = pClean.length >= 10 ? pClean.slice(-10) : pClean;
        return pTarget === matchTarget;
      }),
    );
  }, [contacts, callState?.number]);

  if (!callState) return null;

  const isRinging = callState.state === 2;
  const isHold = callState.state === 3;
  const isDialing = callState.state === 9 || callState.state === 1;
  const isActive = callState.state === 4;

  const statusText = isRinging
    ? "Incoming call"
    : isHold
      ? "On hold"
      : isDialing
        ? "Calling..."
        : isActive
          ? formatTimer(timer)
          : "Connecting...";

  const displayName =
    matchedContact?.name || callState.name || callState.number;

  const secondaryText = matchedContact ? callState.number : "Mobile";

  return (
    <Animated.View
      entering={SlideInDown.duration(400)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: colors.background,
        elevation: 999,
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{
            alignItems: "center",
            marginTop: 40,
            height: 120,
            justifyContent: "center",
          }}
        >
          {showKeypad && lastDigit ? (
            <Animated.Text
              key={dtmfDigits.length}
              entering={ZoomIn.duration(200)}
              style={{
                color: colors.primary,
                fontSize: 56,
                fontWeight: "300",
              }}
            >
              {lastDigit}
            </Animated.Text>
          ) : (
            <>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 16,
                  fontWeight: "500",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {statusText}
              </Text>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 28,
                  fontWeight: "300",
                  letterSpacing: -0.5,
                  marginBottom: 8,
                  textAlign: "center",
                  paddingHorizontal: 24,
                }}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {displayName}
              </Text>
              {showKeypad && dtmfDigits ? (
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 24,
                    fontWeight: "400",
                    letterSpacing: 2,
                    paddingHorizontal: 40,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {dtmfDigits}
                </Text>
              ) : (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                  }}
                >
                  {secondaryText}
                </Text>
              )}
            </>
          )}
        </Animated.View>

        {!showKeypad ? (
          <Animated.View
            entering={ZoomIn.delay(300).duration(400)}
            style={{
              alignItems: "center",
              marginVertical: 20,
              flex: 1,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.primaryLight,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <User size={56} color={colors.primary} />
            </View>
          </Animated.View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 50,
            }}
          >
            {DTMF_KEYS.map((row, rowIdx) => (
              <View
                key={rowIdx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  marginBottom: 12,
                }}
              >
                {row.map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    activeOpacity={0.6}
                    style={{
                      width: 72,
                      height: 72,
                      backgroundColor: colors.card,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => handleSendDtmf(digit)}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 28,
                        fontWeight: "300",
                      }}
                    >
                      {digit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {!isRinging && (
          <View>
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                paddingHorizontal: 30,
                marginBottom: 24,
              }}
            >
              <CallActionButton
                Icon={MicOff}
                label="Mute"
                active={isMuted}
                onPress={handleToggleMute}
                colors={colors}
              />
              <CallActionButton
                Icon={Grid}
                label={showKeypad ? "Hide" : "Keypad"}
                active={showKeypad}
                onPress={() => setShowKeypad(!showKeypad)}
                colors={colors}
              />
              <CallActionButton
                Icon={Volume2}
                label="Speaker"
                active={isSpeaker}
                onPress={handleToggleSpeaker}
                colors={colors}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(300)}
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                paddingHorizontal: 30,
                marginBottom: 32,
              }}
            >
              <CallActionButton
                Icon={UserPlus}
                label="Add call"
                onPress={() => {
                  try {
                    CallLogsModule.moveTaskToBack?.();
                  } catch (_e) {}
                }}
                colors={colors}
              />
              <CallActionButton
                Icon={isHold ? Play : Pause}
                label={isHold ? "Resume" : "Hold"}
                active={isHold}
                onPress={handleToggleHold}
                colors={colors}
              />
              <CallActionButton
                Icon={Users}
                label="Merge"
                disabled={!callState?.callCount || callState.callCount < 2}
                onPress={handleMerge}
                colors={colors}
              />
            </Animated.View>
          </View>
        )}

        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={{ paddingHorizontal: 40, paddingBottom: 96 }}
        >
          {isRinging ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: colors.danger,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: colors.danger,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleReject}
                >
                  <X size={32} color="white" />
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: 8,
                    fontWeight: "500",
                  }}
                >
                  {"Decline"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.primaryLight,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    try {
                      CallLogsModule.silenceRingtone?.();
                    } catch (_e) {}
                  }}
                >
                  <BellOff size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: 8,
                    fontWeight: "500",
                  }}
                >
                  {"Silence"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: colors.success,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: colors.success,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  onPress={handleAnswer}
                >
                  <Phone size={32} color="white" />
                </TouchableOpacity>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: 8,
                    fontWeight: "500",
                  }}
                >
                  {"Accept"}
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{
                position: "relative",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={{
                  width: 75,
                  height: 75,
                  borderRadius: 37.5,
                  backgroundColor: colors.danger,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: colors.danger,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleEndCall}
              >
                <Phone size={32} color="white" />
              </TouchableOpacity>

              {showKeypad && dtmfDigits.length > 0 && (
                <TouchableOpacity
                  onPress={handleBackspace}
                  onLongPress={handleLongBackspace}
                  style={{
                    position: "absolute",
                    right: 32,
                    width: 60,
                    height: 60,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Delete size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const CallActionButton = ({
  Icon,
  label,
  active,
  disabled,
  onPress,
  colors,
}: {
  Icon: any;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: active ? colors.primary : colors.primaryLight,
      opacity: disabled ? 0.3 : 1,
    }}
  >
    <Icon size={18} color={active ? colors.white : colors.primary} />
    <Text
      style={{
        fontSize: 11,
        marginTop: 4,
        fontWeight: "500",
        color: active ? colors.primaryLight : colors.primary,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default React.memo(CallScreen);
