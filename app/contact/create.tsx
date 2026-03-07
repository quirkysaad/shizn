import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import { ArrowLeft, User, PlusCircle, MinusCircle } from "lucide-react-native";
import { useContacts } from "../../utils/AppProviders";
import theme from "../../utils/theme";

export default function CreateContact() {
  const router = useRouter();
  const { refresh } = useContacts();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phones, setPhones] = useState([{ label: "mobile", number: "" }]);
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
    <View className="flex-1 bg-background pt-[StatusBar.currentHeight || 0]">
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b-[0.5px] border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 min-w-[60px]"
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-textPrimary">
          {"New Contact"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="p-1 min-w-[60px]"
        >
          <Text
            className="text-base font-semibold text-primary text-right"
            style={[saving && { opacity: 0.5 }]}
          >
            {"Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="items-center py-6"
          >
            <Animated.View
              entering={ZoomIn.delay(200).duration(400)}
              className="w-[90px] h-[90px] rounded-[45px] bg-primaryLight justify-center items-center"
            >
              <User size={40} color={theme.colors.primary} />
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="mb-6"
          >
            <Text className="text-sm font-semibold text-textSecondary mb-2.5 uppercase tracking-[0.5px]">
              {"Name"}
            </Text>
            <TextInput
              className="border border-border rounded-xl px-4 py-[14px] text-base text-textPrimary mb-2.5 bg-card"
              placeholder="First name"
              placeholderTextColor={theme.colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
            />
            <TextInput
              className="border border-border rounded-xl px-4 py-[14px] text-base text-textPrimary mb-2.5 bg-card"
              placeholder="Last name"
              placeholderTextColor={theme.colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            className="mb-6"
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-textSecondary mb-2.5 uppercase tracking-[0.5px]">
                {"Phone"}
              </Text>
              <TouchableOpacity onPress={addPhone}>
                <PlusCircle size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            {phones.map((phone, index) => (
              <View key={index} className="flex-row items-center">
                <TextInput
                  className="flex-1 border border-border rounded-xl px-4 py-[14px] text-base text-textPrimary mb-2.5 bg-card"
                  placeholder="Phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={phone.number}
                  onChangeText={(v) => updatePhone(index, v)}
                  keyboardType="phone-pad"
                />
                {phones.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => removePhone(index)}
                    className="p-2"
                  >
                    <MinusCircle size={20} color={theme.colors.danger} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            className="mb-6"
          >
            <Text className="text-sm font-semibold text-textSecondary mb-2.5 uppercase tracking-[0.5px]">
              {"Email"}
            </Text>
            <TextInput
              className="border border-border rounded-xl px-4 py-[14px] text-base text-textPrimary mb-2.5 bg-card"
              placeholder="Email address"
              placeholderTextColor={theme.colors.textSecondary}
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

// Removed StyleSheet constants as they are converted into Tailwind classes throughout the component.
