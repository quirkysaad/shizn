import React, { useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import CallLog from "../../components/CallLog";
import { Search, MoreVertical, Clock } from "lucide-react-native";
import { useRecents } from "../../utils/AppProviders";
import theme from "../../utils/theme";

const Home = () => {
  const { sections, loading, loadMore, hasMore } = useRecents();

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [hasMore]);

  return (
    <>
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <Text className="text-[28px] font-bold text-textPrimary tracking-[-0.5px]">
          {"Recents"}
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity>
            <Search size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <MoreVertical size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 pt-2">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : sections.length > 0 ? (
          <SectionList
            className="bg-background px-2"
            sections={sections}
            keyExtractor={(item, index) => item.id || index.toString()}
            stickySectionHeadersEnabled={false}
            renderItem={({ section, item, index }) => (
              <CallLog
                logItem={item}
                logIndex={index}
                isLastLogOfSection={index === section.data.length - 1}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View className="mx-5 mt-6 mb-2">
                <Text className="text-textSecondary font-semibold text-[13px] uppercase tracking-[0.5px]">
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
            <Clock size={48} color={theme.colors.border} />
            <Text className="text-textSecondary text-[17px] mt-4 font-medium">
              {"No recent calls"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default React.memo(Home);
