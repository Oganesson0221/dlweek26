import React, { createContext, useContext, useEffect } from "react";

interface ThemeContextValue {
  theme: "light";
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light" });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
};
