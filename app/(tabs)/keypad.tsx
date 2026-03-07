import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Phone, Delete } from "lucide-react-native";
import KeypadButton from "../../components/KeypadButton";
import { CallLogsModule } from "../../modules/dialer-module";
import { useContacts } from "../../utils/AppProviders";
import { searchContactsT9 } from "../../utils/t9-search";
import theme from "../../utils/theme";
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const { contacts } = useContacts();

  const t9Results = useMemo(() => {
    if (phoneNumber.length === 0) return [];
    return searchContactsT9(phoneNumber, contacts).slice(0, 5); // Show top 5 fuzzy matches
  }, [phoneNumber, contacts]);

  const handlePress = useCallback((val: string) => {
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
      <View className="flex-1 w-full justify-between items-center pb-5">
        <View className="flex-1 w-full flex-col justify-end items-center">
          <ScrollView
            className="flex-1 flex-start grow w-full mb-2"
            showsVerticalScrollIndicator={false}
          >
            {t9Results.map((result, index) => (
              <ContactItem
                key={(result as any).id || index.toString()}
                item={result}
                index={index}
                isLastLogOfSection={index === t9Results.length - 1}
                onCall={(num) => CallLogsModule.makeCall(num)}
                className="w-full"
              />
            ))}

            {phoneNumber.length > 0 && (
              <TouchableOpacity className="py-3 px-8">
                <Text className="text-primary font-medium text-[17px]">
                  {"Create new contact"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View className="flex flex-row items-center justify-center pb-2">
            <Text
              className="grow text-[36px] font-normal text-textPrimary text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {phoneNumber || " "}
            </Text>
          </View>
        </View>

        <View className="w-full items-center">
          {padRows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-center w-full">
              {row.map((btn, btnIndex) => (
                <View key={btn.number}>
                  <KeypadButton
                    number={btn.number}
                    letters={btn.letters}
                    onPress={handlePress}
                    onLongPress={handleLongPress}
                    className="mx-3"
                  />
                </View>
              ))}
            </View>
          ))}

          <View className="flex-row justify-center items-center w-full mt-2">
            <View className="w-[70px]" />
            <TouchableOpacity
              activeOpacity={0.7}
              className="bg-success rounded-full w-[70px] h-[70px] justify-center items-center"
              style={{
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={dialNumber}
            >
              <Phone size={36} color={theme.colors.white} />
            </TouchableOpacity>

            {/* Delete Digit Icon */}
            {phoneNumber.length > 0 ? (
              <TouchableOpacity
                onPress={handleBackspace}
                onLongPress={handleLongBackspace}
                className="w-[70px] h-[70px] justify-center items-center"
              >
                <Delete size={26} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View className="w-[70px]" />
            )}
          </View>
        </View>
      </View>
    </>
  );
}

export default React.memo(KeypadScreen);
