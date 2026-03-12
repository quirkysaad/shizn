import React, { useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import CallLog from "../../components/CallLog";
import { Search, Clock, Settings } from "lucide-react-native";
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
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [hasMore, colors.primary]);

  return (
    <>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text
          className="text-[28px] font-bold tracking-[-0.5px]"
          style={{ color: colors.textPrimary }}
        >
          {"Recents"}
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={openDrawer}>
            <Settings size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sections.length > 0 ? (
          <SectionList
            className="px-4"
            style={{ backgroundColor: colors.background }}
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
                  className="text-[13px] font-semibold uppercase tracking-[0.5px]"
                  style={{ color: colors.textSecondary }}
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
          <View className="flex-1 items-center justify-center">
            <Clock size={48} color={colors.border} />
            <Text
              className="mt-4 text-[17px] font-medium"
              style={{ color: colors.textSecondary }}
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
