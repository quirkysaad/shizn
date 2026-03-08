import React, { useState, useEffect, useCallback } from "react";
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
import { useTheme } from "../../utils/ThemeContext";
import { CallLogProps, CallSectionProps } from "../../types";
import CallLog from "../../components/CallLog";
import { groupCallsByDate } from "../../utils/general-utils";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refresh } = useContacts();
  const { colors, isDark } = useTheme();
  const [contact, setContact] = useState<Contacts.Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [callHistory, setCallHistory] = useState<CallLogProps[]>([]);

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
          const uniquePhones = new Set<string>();
          const contactPhones =
            result.phoneNumbers
              ?.map((p) => ({
                label: p.label || "mobile",
                number: p.number || "",
              }))
              .filter((p) => {
                const normalized = p.number.replace(/\D/g, "");
                if (!normalized || uniquePhones.has(normalized)) return false;
                uniquePhones.add(normalized);
                return true;
              }) || [];

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
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 17 }}>
          {"Contact not found"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4, minWidth: 60 }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            {editing ? "Edit Contact" : "Contact"}
          </Text>
          {editing ? (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ padding: 4, minWidth: 60 }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.primary,
                  textAlign: "right",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {"Save"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={{ padding: 4, minWidth: 60 }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: colors.primary,
                  textAlign: "right",
                }}
              >
                {"Edit"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar and name */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={{ alignItems: "center", paddingVertical: 24 }}
            >
              <Animated.View
                entering={ZoomIn.delay(200).duration(400)}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: colors.primaryLight,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <User size={40} color={colors.primary} />
              </Animated.View>
              {!editing ? (
                <>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginTop: 14,
                    }}
                  >
                    {contact.name || "No Name"}
                  </Text>
                </>
              ) : (
                <View style={{ width: "100%", marginTop: 16 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: colors.textPrimary,
                      marginBottom: 10,
                      backgroundColor: colors.card,
                    }}
                    placeholder="First name"
                    placeholderTextColor={colors.textSecondary}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: colors.textPrimary,
                      marginBottom: 10,
                      backgroundColor: colors.card,
                    }}
                    placeholder="Last name"
                    placeholderTextColor={colors.textSecondary}
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
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 24,
                  marginBottom: 24,
                }}
              >
                <TouchableOpacity
                  style={{
                    width: 80,
                    height: 70,
                    borderRadius: 16,
                    backgroundColor: colors.primaryLight,
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onPress={() => handleCall(phones[0]?.number)}
                >
                  <Phone size={20} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: "500",
                    }}
                  >
                    {"Call"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            {/* Phone numbers */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={{ marginBottom: 24 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {"Phone"}
                </Text>
                {editing ? (
                  <TouchableOpacity onPress={addPhone}>
                    <PlusCircle size={22} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {editing
                ? phones.map((phone, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          fontSize: 16,
                          color: colors.textPrimary,
                          marginBottom: 10,
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
                  ))
                : phones.map((phone, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleCall(phone.number)}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: colors.card,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                            textTransform: "capitalize",
                            marginBottom: 2,
                          }}
                        >
                          {phone.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 16,
                            color: colors.textPrimary,
                          }}
                        >
                          {phone.number}
                        </Text>
                      </View>
                      <Phone size={18} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
            </Animated.View>

            {/* Email */}
            {editing ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {"Email"}
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.textPrimary,
                    marginBottom: 10,
                    backgroundColor: colors.card,
                  }}
                  placeholder="Email address"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : email ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {"Email"}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.textPrimary }}>
                    {email}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Call History Section */}
            {!editing && callHistory.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(350).duration(400)}
                style={{ marginBottom: 24 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <History size={16} color={colors.textSecondary} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {"Call History"}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                    maxHeight: 400,
                  }}
                >
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {groupCallsByDate(callHistory).map(
                      (section: CallSectionProps, sIdx: number) => (
                        <View key={section.title + sIdx}>
                          <View
                            style={{
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.03)",
                              paddingHorizontal: 16,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: colors.textSecondary,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                              }}
                            >
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
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 16,
                  backgroundColor: colors.danger + "22",
                }}
                onPress={handleDelete}
              >
                <Trash size={18} color={colors.danger} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.danger,
                  }}
                >
                  {"Delete Contact"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
