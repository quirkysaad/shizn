import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

type ThemeDrawerContextType = {
  drawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const ThemeDrawerContext = createContext<ThemeDrawerContextType>({
  drawerVisible: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export const useThemeDrawer = () => useContext(ThemeDrawerContext);

export const ThemeDrawerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  const value = useMemo(
    () => ({ drawerVisible, openDrawer, closeDrawer }),
    [drawerVisible, openDrawer, closeDrawer],
  );

  return (
    <ThemeDrawerContext.Provider value={value}>
      {children}
    </ThemeDrawerContext.Provider>
  );
};
