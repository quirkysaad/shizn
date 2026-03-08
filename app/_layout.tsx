import React from "react";
import { View, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import CallScreen from "../components/CallScreen";
import DefaultDialerPrompt from "../components/DefaultDialerPrompt";
import ThemeDrawer from "../components/ThemeDrawer";
import {
  ContactsProvider,
  RecentsProvider,
  CallStateProvider,
} from "../utils/AppProviders";
import { ThemeProvider, useTheme } from "../utils/ThemeContext";
import {
  ThemeDrawerProvider,
  useThemeDrawer,
} from "../utils/ThemeDrawerContext";

const AppLayer = () => {
  const { colors, isDark } = useTheme();
  const { drawerVisible, closeDrawer } = useThemeDrawer();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <ContactsProvider>
        <RecentsProvider>
          <CallStateProvider>
            <DefaultDialerPrompt>
              <View style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      flex: 1,
                      backgroundColor: colors.background,
                    },
                    animation: "none",
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <CallScreen />
              </View>
            </DefaultDialerPrompt>
          </CallStateProvider>
        </RecentsProvider>
      </ContactsProvider>

      <ThemeDrawer visible={drawerVisible} onClose={closeDrawer} />
    </View>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ThemeDrawerProvider>
            <AppLayer />
          </ThemeDrawerProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
