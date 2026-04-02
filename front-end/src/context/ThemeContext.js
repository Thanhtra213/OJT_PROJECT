import React, { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn("⚠️ CẢNH BÁO: Bạn chưa bọc <ThemeProvider> ở index.js!");
    return { isDarkMode: false, toggleDarkMode: () => {} };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('global-dark-mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('global-dark-mode');
      localStorage.setItem('global-dark-mode', 'true');
    } else {
      document.body.classList.remove('global-dark-mode');
      localStorage.setItem('global-dark-mode', 'false');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    console.log("👉 Trạng thái nút vừa bấm:", !isDarkMode ? "DARK MODE" : "LIGHT MODE");
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};