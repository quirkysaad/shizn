import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as ContactsModule from "expo-contacts";
import { Plus, Search, XCircle, BookUser, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { CallLogsModule } from "../../modules/dialer-module";
import { useContacts } from "../../utils/AppProviders";
import { useTheme } from "../../utils/ThemeContext";
import { useThemeDrawer } from "../../utils/ThemeDrawerContext";
import ContactItem from "../../components/ContactItem";

function Contacts() {
  const { contacts, loading } = useContacts();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { colors } = useTheme();
  const { openDrawer } = useThemeDrawer();

  const sections = React.useMemo(() => {
    let filteredContacts = contacts;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.trim().toLowerCase();
      filteredContacts = contacts.filter((c) => {
        const matchName = c.name?.toLowerCase().includes(lowerQuery);
        const matchPhone = c.phoneNumbers?.some((p) =>
          p.number?.toLowerCase().includes(lowerQuery),
        );
        return matchName || matchPhone;
      });
    }

    const grouped = filteredContacts.reduce(
      (acc, contact) => {
        let initial = contact.name?.trim()?.[0]?.toUpperCase() || "#";
        if (!/[A-Z]/.test(initial)) {
          initial = "#";
        }
        if (!acc[initial]) {
          acc[initial] = [];
        }
        acc[initial].push(contact);
        return acc;
      },
      {} as Record<string, ContactsModule.Contact[]>,
    );

    return Object.keys(grouped)
      .sort((a, b) => {
        if (a === "#") return 1;
        if (b === "#") return -1;
        return a.localeCompare(b);
      })
      .map((key) => ({
        title: key,
        data: grouped[key].sort((c1, c2) =>
          (c1.name || "").localeCompare(c2.name || ""),
        ),
      }));
  }, [contacts, searchQuery]);

  const handleCallContact = useCallback((number: string) => {
    if (number) {
      CallLogsModule.makeCall(number);
    }
  }, []);

  const handleOpenContact = useCallback(
    (id: string) => {
      router.push(`/contact/${id}`);
    },
    [router],
  );

  const handleCreateContact = useCallback(() => {
    router.push("/contact/create");
  }, [router]);

  const keyExtractor = useCallback(
    (item: ContactsModule.Contact, index: number) =>
      item.id || `contact-${index}`,
    [],
  );

  return (
    <>
      <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: colors.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          {"Contacts"}
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={handleCreateContact}>
            <Plus size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openDrawer}>
            <Settings size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-3 pb-3">
        <View
          className="flex-row items-center rounded-xl border px-4 py-2"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 16,
              color: colors.textPrimary,
            }}
            placeholder="Search contacts..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={{ padding: 4 }}
            >
              <XCircle size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : contacts.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={({ section, item, index }) => (
              <ContactItem
                item={item}
                index={index}
                onPress={() => handleOpenContact(item.id!)}
                onCall={handleCallContact}
                isLastLogOfSection={index === section.data.length - 1}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View
                style={{
                  marginHorizontal: 24,
                  marginTop: 16,
                  marginBottom: 8,
                  backgroundColor: colors.background,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {section.title}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={5}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <BookUser size={48} color={colors.border} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 17,
                marginTop: 16,
                fontWeight: "500",
              }}
            >
              {"No contacts found"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

export default React.memo(Contacts);
