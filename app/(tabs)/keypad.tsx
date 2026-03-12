import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import {
  Phone,
  Delete,
  UserPlus,
  MessageCircle,
  Settings,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import KeypadButton from "../../components/KeypadButton";
import ActionButton from "../../components/ActionButton";
import { CallLogsModule } from "../../modules/dialer-module";
import {
  useContacts,
  useCallState,
  useRecents,
} from "../../utils/AppProviders";
import { searchContactsT9 } from "../../utils/t9-search";
import { useTheme } from "../../utils/ThemeContext";
import { useThemeDrawer } from "../../utils/ThemeDrawerContext";
import ContactItem from "../../components/ContactItem";

const padRows = [
  [
    { number: "1", letters: " " },
    { number: "2", letters: "ABC" },
    { number: "3", letters: "DEF" },
  ],
  [
    { number: "4", letters: "GHI" },
    { number: "5", letters: "JKL" },
    { number: "6", letters: "MNO" },
  ],
  [
    { number: "7", letters: "PQRS" },
    { number: "8", letters: "TUV" },
    { number: "9", letters: "WXYZ" },
  ],
  [
    { number: "*", letters: "" },
    { number: "0", letters: "+" },
    { number: "#", letters: "" },
  ],
];

function KeypadScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const { contacts } = useContacts();
  const { colors } = useTheme();
  const { openDrawer } = useThemeDrawer();

  const { rawLogs } = useRecents();

  const t9Results = useMemo(() => {
    if (phoneNumber.length === 0) {
      // Show Frequently Contacted (Favorites)
      const counts: Record<string, number> = {};
      rawLogs.forEach((log) => {
        const key = log.name || log.number;
        counts[key] = (counts[key] || 0) + 1;
      });

      const sorted = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 3);

      return sorted.map((key) => {
        const contact = contacts.find(
          (c) =>
            c.name === key || c.phoneNumbers?.some((p) => p.number === key),
        );
        if (contact) return { ...contact, isFavorite: true };

        // If not in contacts, return a partial object
        return {
          name: key,
          phoneNumbers: [{ number: key }],
          isFavorite: true,
        } as any;
      });
    }
    return searchContactsT9(phoneNumber, contacts).slice(0, 5);
  }, [phoneNumber, contacts, rawLogs]);

  const handlePress = useCallback((val: string) => {
    CallLogsModule.playDtmfTone?.(val);
    setPhoneNumber((prev) => prev + val);
  }, []);

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleLongBackspace = useCallback(() => {
    setPhoneNumber("");
  }, []);

  const dialNumber = useCallback(async () => {
    if (!phoneNumber) return;
    try {
      await CallLogsModule.makeCall(phoneNumber);
    } catch (e) {
      console.log("Call failed", e);
    }
  }, [phoneNumber]);

  const { setCallState } = useCallState();

  const handleMockCall = useCallback(() => {
    setCallState({
      number: phoneNumber || "+1 234 567 8900",
      name: phoneNumber ? undefined : "Mock Contact Long Name Sample",
      state: 4, // RINGING
      callCount: 2,
    });
  }, [phoneNumber, setCallState]);

  const handleLongPress = useCallback(
    (val: string) => {
      if (val === "0") handlePress("+");
      else if (val === "1") console.log("Call Voicemail");
      else handlePress(val);
    },
    [handlePress],
  );

  return (
    <>
      <View className="flex-1 w-full items-center justify-between pb-5">
        <View className="flex-row items-center justify-between px-6 pb-2 pt-4 w-full">
          <Text
            className="text-[28px] font-bold tracking-[-0.5px]"
            style={{ color: colors.textPrimary }}
          >
            {"Phone"}
          </Text>
          <TouchableOpacity onPress={openDrawer}>
            <Settings size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View className="flex-1 w-full items-center justify-end flex-col">
          {phoneNumber.length === 0 && t9Results.length > 0 && (
            <View className="w-full px-6 mb-2">
              <Text
                className="text-xs uppercase font-bold opacity-40"
                style={{ color: colors.textPrimary }}
              >
                Frequently Contacted
              </Text>
            </View>
          )}
          <ScrollView
            className="flex-1 flex-grow mb-2 px-4 w-full"
            showsVerticalScrollIndicator={false}
          >
            {t9Results.map((result, index) => (
              <ContactItem
                key={(result as any).id || index.toString()}
                item={result}
                index={index}
                isLastLogOfSection={index === t9Results.length - 1}
                onCall={(num) => CallLogsModule.makeCall(num)}
                onPress={() => {
                  if ((result as any).id) {
                    router.push(`/contact/${(result as any).id}`);
                  }
                }}
              />
            ))}

            {phoneNumber.length > 0 && (
              <View className="flex-row gap-3 px-6 pb-2 pt-4 w-full">
                <ActionButton
                  icon={UserPlus}
                  label="Create new contact"
                  onPress={() => {
                    router.push({
                      pathname: "/contact/create",
                      params: { number: phoneNumber },
                    });
                  }}
                  className="flex-1"
                />
                <ActionButton
                  icon={MessageCircle}
                  label=""
                  onPress={() => {
                    const cleanNumber =
                      phoneNumber?.replace(/[\s\-()]/g, "") || "";
                    Linking.openURL(`sms:${cleanNumber}`);
                  }}
                />
              </View>
            )}
          </ScrollView>

          <View className="flex-row items-center justify-center px-6 pb-2">
            <Text
              className="flex-1 text-center text-4xl font-normal"
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {phoneNumber || " "}
            </Text>
          </View>
        </View>

        <View className="w-4/5 flex-row flex-wrap justify-between">
          {padRows.flat().map((btn) => (
            <View key={btn.number} className="w-1/3 items-center">
              <KeypadButton
                number={btn.number}
                letters={btn.letters}
                onPress={handlePress}
                onLongPress={handleLongPress}
              />
            </View>
          ))}

          {/* Action Row (Call & Delete) */}
          <View className="w-1/3" />
          <View className="w-1/3 items-center justify-center py-2">
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-[75px] w-[75px] items-center justify-center rounded-full bg-success"
              onPress={dialNumber}
              onLongPress={__DEV__ ? handleMockCall : undefined}
            >
              <Phone size={34} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View className="w-1/3 items-center justify-center">
            {phoneNumber.length > 0 && (
              <TouchableOpacity
                onPress={handleBackspace}
                onLongPress={handleLongBackspace}
                activeOpacity={0.6}
                className="h-20 w-20 items-center justify-center"
              >
                <Delete size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

export default React.memo(KeypadScreen);
