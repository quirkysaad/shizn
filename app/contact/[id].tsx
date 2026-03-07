import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Contacts from "expo-contacts";
import {
  ArrowLeft,
  User,
  Phone,
  PlusCircle,
  MinusCircle,
  Trash,
  History,
} from "lucide-react-native";
import { CallLogsModule } from "../../modules/dialer-module";
import { useContacts, useRecents } from "../../utils/AppProviders";
import theme from "../../utils/theme";
import { CallLogProps, CallSectionProps } from "../../types";
import CallLog from "../../components/CallLog";
import { groupCallsByDate } from "../../utils/general-utils";

export default function ContactDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refresh } = useContacts();
  const [contact, setContact] = useState<Contacts.Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [callHistory, setCallHistory] = useState<CallLogProps[]>([]);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phones, setPhones] = useState<{ label: string; number: string }[]>([]);
  const [email, setEmail] = useState("");

  const loadCallHistory = useCallback(
    async (contactPhones: string[], contactName?: string) => {
      try {
        const result = await CallLogsModule.getCallLogs(500, 0);
        if (result && result.logs) {
          const normalizedNumbers = contactPhones.map((n) =>
            n.replace(/\D/g, "").slice(-10),
          );
          const filtered = (result.logs as CallLogProps[]).filter((log) => {
            const logNormalized = log.number.replace(/\D/g, "").slice(-10);
            const numberMatch =
              logNormalized && normalizedNumbers.includes(logNormalized);
            const nameMatch = contactName && log.name === contactName;
            return numberMatch || nameMatch;
          });
          setCallHistory(filtered.slice(0, 30));
        }
      } catch (e) {
        console.log("Error loading call history:", e);
      }
    },
    [],
  );

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const result = await Contacts.getContactByIdAsync(id, [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
        ]);
        if (result) {
          setContact(result);
          setFirstName(result.firstName || "");
          setLastName(result.lastName || "");
          const contactPhones =
            result.phoneNumbers?.map((p) => ({
              label: p.label || "mobile",
              number: p.number || "",
            })) || [];
          setPhones(
            contactPhones.length > 0
              ? contactPhones
              : [{ label: "mobile", number: "" }],
          );
          setEmail(result.emails?.[0]?.email || "");

          loadCallHistory(
            contactPhones.map((p) => p.number),
            result.name,
          );
        }
      } catch (e) {
        console.log("Error loading contact:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
    if (!contact || !id) return;
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    setSaving(true);
    try {
      const updatedContact: any = {
        id: id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumbers: phones
          .filter((p) => p.number.trim())
          .map((p) => ({ label: p.label, number: p.number.trim() })),
      };
      if (email.trim()) {
        updatedContact.emails = [{ label: "home", email: email.trim() }];
      }
      await Contacts.updateContactAsync(updatedContact);
      refresh();
      setEditing(false);
      // Reload contact
      const result = await Contacts.getContactByIdAsync(id, [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
      ]);
      if (result) setContact(result);
    } catch (e) {
      console.log("Error updating contact:", e);
      Alert.alert("Error", "Failed to update contact");
    } finally {
      setSaving(false);
    }
  }, [contact, id, firstName, lastName, phones, email, refresh]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Contacts.removeContactAsync(id);
              refresh();
              router.back();
            } catch (e) {
              console.log("Error deleting:", e);
              Alert.alert("Error", "Failed to delete contact");
            }
          },
        },
      ],
    );
  }, [id, refresh, router]);

  const handleCall = useCallback((number: string) => {
    if (number) CallLogsModule.makeCall(number);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center pt-[StatusBar.currentHeight || 0]">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View className="flex-1 bg-background justify-center items-center pt-[StatusBar.currentHeight || 0]">
        <Text className="text-textSecondary text-[17px]">
          {"Contact not found"}
        </Text>
      </View>
    );
  }

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
          {editing ? "Edit Contact" : "Contact"}
        </Text>
        {editing ? (
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
        ) : (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            className="p-1 min-w-[60px]"
          >
            <Text className="text-base font-medium text-primary text-right">
              {"Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          {/* Avatar and name */}
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
            {!editing ? (
              <>
                <Text className="text-2xl font-semibold text-textPrimary mt-3.5">
                  {contact.name || "No Name"}
                </Text>
              </>
            ) : (
              <View className="w-full mt-4">
                <TextInput
                  className="border border-border rounded-xl px-4 py-[14px] text-base text-textPrimary mb-2.5 bg-card"
                  placeholder="First name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  className="border border-border rounded-xl px-4 py-[14px] text-base text-textPrimary mb-2.5 bg-card"
                  placeholder="Last name"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            )}
          </Animated.View>

          {/* Quick actions (view mode) */}
          {!editing ? (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              className="flex-row justify-center gap-6 mb-6"
            >
              <TouchableOpacity
                className="w-[80px] h-[70px] rounded-2xl bg-primaryLight justify-center items-center gap-[6px]"
                onPress={() => handleCall(phones[0]?.number)}
              >
                <Phone size={20} color={theme.colors.primary} />
                <Text className="text-xs text-textSecondary font-medium">
                  {"Call"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Phone numbers */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            className="mb-6"
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-textSecondary mb-2.5 uppercase tracking-[0.5px]">
                {"Phone"}
              </Text>
              {editing ? (
                <TouchableOpacity onPress={addPhone}>
                  <PlusCircle size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
            {editing
              ? phones.map((phone, index) => (
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
                ))
              : phones.map((phone, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCall(phone.number)}
                    className="flex-row justify-between items-center bg-card rounded-xl px-4 py-[14px] mb-2 border border-border"
                  >
                    <View>
                      <Text className="text-xs text-textSecondary capitalize mb-0.5">
                        {phone.label}
                      </Text>
                      <Text className="text-base text-textPrimary">
                        {phone.number}
                      </Text>
                    </View>
                    <Phone size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
          </Animated.View>

          {/* Email */}
          {editing ? (
            <View className="mb-6">
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
            </View>
          ) : email ? (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-textSecondary mb-2.5 uppercase tracking-[0.5px]">
                {"Email"}
              </Text>
              <View className="flex-row justify-between items-center bg-card rounded-xl px-4 py-[14px] mb-2 border border-border">
                <Text className="text-base text-textPrimary">{email}</Text>
              </View>
            </View>
          ) : null}

          {/* Call History Section */}
          {!editing && callHistory.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(350).duration(400)}
              className="mb-6"
            >
              <View className="flex-row items-center gap-2 mb-3">
                <History size={16} color={theme.colors.textSecondary} />
                <Text className="text-sm font-semibold text-textSecondary uppercase tracking-[0.5px]">
                  {"Call History"}
                </Text>
              </View>

              <View
                className="bg-card rounded-2xl border border-border overflow-hidden"
                style={{ maxHeight: 400 }} // Make it a scrollable sub-section
              >
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {groupCallsByDate(callHistory).map(
                    (section: CallSectionProps, sIdx: number) => (
                      <View key={section.title + sIdx}>
                        <View className="bg-primaryLight/30 px-4 py-1.5">
                          <Text className="text-[11px] font-bold text-textSecondary uppercase tracking-[1px]">
                            {section.title}
                          </Text>
                        </View>
                        {section.data.map((log, index) => (
                          <CallLog
                            key={log.id || index.toString()}
                            logItem={log}
                            logIndex={index}
                            isLastLogOfSection={
                              index === section.data.length - 1
                            }
                            swipeDisabled={true}
                            hideCallButton={true}
                          />
                        ))}
                      </View>
                    ),
                  )}
                </ScrollView>
              </View>
            </Animated.View>
          )}

          {/* Delete button */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 py-[14px] rounded-xl mt-4"
              style={{ backgroundColor: theme.colors.danger + "22" }}
              onPress={handleDelete}
            >
              <Trash size={18} color={theme.colors.danger} />
              <Text className="text-base font-medium text-danger">
                {"Delete Contact"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Removed StyleSheet constants as they are converted into Tailwind classes throughout the component.
