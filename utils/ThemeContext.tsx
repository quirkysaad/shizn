import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors } from "./theme";

export type ThemeMode = "light" | "dark" | "system";

type ThemeColors = typeof lightColors;

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
};

const THEME_STORAGE_KEY = "@sleek_dialer_theme_mode";

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  setMode: () => {},
  colors: lightColors,
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          stored &&
          (stored === "light" || stored === "dark" || stored === "system")
        ) {
          setModeState(stored as ThemeMode);
        }
      } catch (e) {
        console.log("Error loading theme preference:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch((e) =>
      console.log("Error saving theme preference:", e),
    );
  }, []);

  const isDark = useMemo(() => {
    if (mode === "system") {
      return systemColorScheme === "dark";
    }
    return mode === "dark";
  }, [mode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const value = useMemo(
    () => ({ mode, setMode, colors, isDark }),
    [mode, setMode, colors, isDark],
  );

  // Don't render until we've loaded the saved preference to avoid flicker
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
