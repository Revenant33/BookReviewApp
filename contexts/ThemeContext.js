import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to system preference or light mode
        setIsDarkMode(false);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? darkColors : lightColors,
    styles: isDarkMode ? darkStyles : lightStyles,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Light theme colors
export const lightColors = {
  primary: '#6200ee',
  primaryLight: '#9d46ff',
  primaryDark: '#0a00b6',
  secondary: '#03dac6',
  secondaryLight: '#66fff9',
  secondaryDark: '#00a896',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#b00020',
  text: '#000000',
  textSecondary: '#666666',
  textDisabled: '#999999',
  border: '#e0e0e0',
  divider: '#f0f0f0',
  card: '#ffffff',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  favorite: '#ff4444',
  rating: '#FFD700',
};

// Dark theme colors
export const darkColors = {
  primary: '#bb86fc',
  primaryLight: '#e1bee7',
  primaryDark: '#3700b3',
  secondary: '#03dac6',
  secondaryLight: '#66fff9',
  secondaryDark: '#00a896',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#cf6679',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textDisabled: '#666666',
  border: '#333333',
  divider: '#2a2a2a',
  card: '#2d2d2d',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#2196f3',
  favorite: '#ff4444',
  rating: '#FFD700',
};

// Light theme styles
export const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: lightColors.background,
  },
  card: {
    backgroundColor: lightColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    color: lightColors.text,
  },
  textSecondary: {
    color: lightColors.textSecondary,
  },
  input: {
    backgroundColor: lightColors.surface,
    borderColor: lightColors.border,
    color: lightColors.text,
  },
});

// Dark theme styles
export const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.background,
  },
  card: {
    backgroundColor: darkColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  text: {
    color: darkColors.text,
  },
  textSecondary: {
    color: darkColors.textSecondary,
  },
  input: {
    backgroundColor: darkColors.surface,
    borderColor: darkColors.border,
    color: darkColors.text,
  },
});

import { StyleSheet } from 'react-native';