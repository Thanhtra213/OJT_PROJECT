import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    // ĐÂY LÀ ĐIỂM CỐT LÕI: Ép class dark mode vào thẻ <html> thay vì chỉ <body>
    const htmlElement = document.documentElement; 

    if (isDarkMode) {
      htmlElement.classList.add('global-dark-mode');
      document.body.classList.add('global-dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('global-dark-mode');
      document.body.classList.remove('global-dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);