import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  checkUpdate,
  ReleaseInfo,
  openUpdateLink,
} from "../utils/updateChecker";
import { useTheme } from "../utils/ThemeContext";
import CustomModal from "./CustomModal";

const UpdatePrompt = () => {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const initCheck = async () => {
      const update = await checkUpdate();
      if (update && update.isNewer) {
        setRelease(update);
        setVisible(true);
      }
    };
    initCheck();
  }, []);

  if (!release || !visible) return null;

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="New Update Available"
      buttons={[
        {
          text: "Update Now",
          onPress: () => {
            openUpdateLink(release.url);
            setVisible(false);
          },
        },
      ]}
    >
      <Text
        className="text-[15px] font-semibold mb-4"
        style={{ color: colors.success }}
      >
        Version {release.version} is now available!
      </Text>

      {release.notes && (
        <View className="mb-6">
          <Text
            className="text-sm font-bold mb-1"
            style={{ color: colors.textPrimary }}
          >
            What's New:
          </Text>
          <Text
            className="text-sm leading-5"
            style={{ color: colors.textSecondary }}
            numberOfLines={6}
          >
            {release.notes}
          </Text>
        </View>
      )}
    </CustomModal>
  );
};

export default UpdatePrompt;
