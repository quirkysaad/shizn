import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Contacts from "expo-contacts";
import { ArrowLeft, User, PlusCircle, MinusCircle } from "lucide-react-native";
import { useContacts } from "../../utils/AppProviders";
import { useTheme } from "../../utils/ThemeContext";

export default function CreateContact() {
  const router = useRouter();
  const { refresh } = useContacts();
  const { number } = useLocalSearchParams<{ number: string }>();
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phones, setPhones] = useState([
    { label: "mobile", number: number || "" },
  ]);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const addPhone = () => {
    setPhones((prev) => [...prev, { label: "mobile", number: "" }]);
  };

  const updatePhone = (index: number, value: string) => {
    setPhones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], number: value };
      return copy;
    });
  };

  const removePhone = (index: number) => {
    if (phones.length <= 1) return;
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = useCallback(async () => {
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    const validPhones = phones.filter((p) => p.number.trim() !== "");
    if (validPhones.length === 0) {
      Alert.alert("Error", "Please enter at least one phone number");
      return;
    }

    setSaving(true);
    try {
      const contact: Contacts.Contact = {
        contactType: Contacts.ContactTypes.Person,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phoneNumbers: validPhones.map((p) => ({
          label: p.label,
          number: p.number.trim(),
        })),
      } as Contacts.Contact;

      if (email.trim()) {
        contact.emails = [{ label: "home", email: email.trim() }];
      }

      await Contacts.addContactAsync(contact);
      refresh();
      router.back();
    } catch (e) {
      console.log("Error saving contact:", e);
      Alert.alert("Error", "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, phones, email, refresh, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        className="flex-row items-center justify-between border-b px-4 py-[14px]"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="min-w-[60px] p-1"
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          className="text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          {"New Contact"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="min-w-[60px] p-1"
        >
          <Text
            className="text-right text-base font-semibold"
            style={{
              color: colors.primary,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {"Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="items-center py-6"
          >
            <Animated.View
              entering={ZoomIn.delay(200).duration(400)}
              className="h-[90px] w-[90px] items-center justify-center rounded-[45px]"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <User size={40} color={colors.primary} />
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={{ marginBottom: 24 }}
          >
            <Text
              className="mb-2.5 text-sm font-semibold uppercase tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              {"Name"}
            </Text>
            <TextInput
              className="mb-2.5 rounded-xl border px-4 py-3.5 text-base"
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.card,
              }}
              placeholder="First name"
              placeholderTextColor={colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
            />
            <TextInput
              className="mb-2.5 rounded-xl border px-4 py-3.5 text-base"
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.card,
              }}
              placeholder="Last name"
              placeholderTextColor={colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={{ marginBottom: 24 }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="mb-2.5 text-sm font-semibold uppercase tracking-[0.5px]"
                style={{ color: colors.textSecondary }}
              >
                {"Phone"}
              </Text>
              <TouchableOpacity onPress={addPhone}>
                <PlusCircle size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {phones.map((phone, index) => (
              <View key={index} className="flex-row items-center">
                <TextInput
                  className="mb-2.5 flex-1 rounded-xl border px-4 py-3.5 text-base"
                  style={{
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    backgroundColor: colors.card,
                  }}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={phone.number}
                  onChangeText={(v) => updatePhone(index, v)}
                  keyboardType="phone-pad"
                />
                {phones.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => removePhone(index)}
                    style={{ padding: 8 }}
                  >
                    <MinusCircle size={20} color={colors.danger} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={{ marginBottom: 24 }}
          >
            <Text
              className="mb-2.5 text-sm font-semibold uppercase tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              {"Email"}
            </Text>
            <TextInput
              className="mb-2.5 rounded-xl border px-4 py-3.5 text-base"
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.card,
              }}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
