import React, { useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import CallLog from "../../components/CallLog";
import { Search, MoreVertical, Clock, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useRecents, useContacts } from "../../utils/AppProviders";
import { useTheme } from "../../utils/ThemeContext";
import { useThemeDrawer } from "../../utils/ThemeDrawerContext";
import { CallLogProps } from "../../types";

const Home = () => {
  const router = useRouter();
  const { sections, loading, loadMore, hasMore } = useRecents();
  const { contacts } = useContacts();
  const { colors } = useTheme();
  const { openDrawer } = useThemeDrawer();

  const handlePress = useCallback(
    (item: CallLogProps) => {
      if (!item.number || item.number === "Unknown") return;

      const normalize = (num: string) => num.replace(/\D/g, "").slice(-10);
      const logNum = normalize(item.number);

      const contact = contacts.find((c) =>
        c.phoneNumbers?.some((p) => p.number && normalize(p.number) === logNum),
      ) as any;

      if (contact?.id) {
        router.push(`/contact/${contact.id}`);
      } else {
        router.push({
          pathname: "/contact/create",
          params: { number: item.number },
        });
      }
    },
    [contacts, router],
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [hasMore, colors.primary]);

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
          {"Recents"}
        </Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity>
            <Search size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openDrawer}>
            <Settings size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 8 }}>
        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sections.length > 0 ? (
          <SectionList
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: 8,
            }}
            sections={sections}
            keyExtractor={(item, index) => item.id || index.toString()}
            stickySectionHeadersEnabled={false}
            renderItem={({ section, item, index }) => (
              <CallLog
                logItem={item}
                logIndex={index}
                isLastLogOfSection={index === section.data.length - 1}
                onPress={() => handlePress(item)}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View className="mx-5 mt-6 mb-2">
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
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Clock size={48} color={colors.border} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 17,
                marginTop: 16,
                fontWeight: "500",
              }}
            >
              {"No recent calls"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default React.memo(Home);
