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
import { Plus, Search, XCircle, BookUser } from "lucide-react-native";
import { useRouter } from "expo-router";
import { CallLogsModule } from "../../modules/dialer-module";
import { useContacts } from "../../utils/AppProviders";
import theme from "../../utils/theme";
import ContactItem from "../../components/ContactItem";

function Contacts() {
  const { contacts, loading } = useContacts();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <Text className="text-[28px] font-bold text-textPrimary tracking-[-0.5px]">
          {"Contacts"}
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={handleCreateContact}>
            <Plus size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 pb-3">
        <View className="flex-row items-center bg-card rounded-xl px-4 py-2 border border-border">
          <Search size={16} color={theme.colors.textSecondary} />
          <TextInput
            className="flex-1 ml-2 text-base text-textPrimary"
            placeholder="Search contacts..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="p-1"
            >
              <XCircle size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
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
              <View className="mx-6 mt-4 mb-2 bg-background">
                <Text className="text-textSecondary font-semibold text-[13px] uppercase tracking-[0.5px]">
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
          <View className="flex-1 items-center justify-center">
            <BookUser size={48} color={theme.colors.border} />
            <Text className="text-textSecondary text-[17px] mt-4 font-medium">
              {"No contacts found"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

export default React.memo(Contacts);
