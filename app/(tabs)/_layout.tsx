import { SafeAreaView } from "react-native-safe-area-context";
import { Grid, Clock, User } from "lucide-react-native";
import { Tabs } from "expo-router";
import theme from "../../utils/theme";

const TabLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 75,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          sceneStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShown: false,
          freezeOnBlur: true,
          animation: "none",
        }}
      >
        <Tabs.Screen
          name="keypad"
          options={{
            title: "Keypad",
            tabBarIcon: ({ color }) => <Grid size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Recents",
            tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default TabLayout;
