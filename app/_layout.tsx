import React, { useEffect } from "react";
import { View, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import CallScreen from "../components/CallScreen";
import DefaultDialerPrompt from "../components/DefaultDialerPrompt";
import { CallLogsModule } from "../modules/dialer-module";
import {
  ContactsProvider,
  RecentsProvider,
  CallStateProvider,
} from "../utils/AppProviders";
import theme from "../utils/theme";

const RootLayout = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ContactsProvider>
          <RecentsProvider>
            <CallStateProvider>
              <DefaultDialerPrompt>
                <View
                  style={{ flex: 1, backgroundColor: theme.colors.background }}
                >
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: {
                        flex: 1,
                        backgroundColor: theme.colors.background,
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
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default RootLayout;
