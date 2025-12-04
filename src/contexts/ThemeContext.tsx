import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('themePreference') as ThemePreference;
      return savedPreference || 'system';
    }
    return 'system';
  });

  const [theme, setTheme] = useState<Theme>('dark');

  const applyTheme = useCallback((preference: ThemePreference) => {
    if (preference === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    } else {
      setTheme(preference);
    }
  }, []);

  useEffect(() => {
    applyTheme(themePreference);
    localStorage.setItem('themePreference', themePreference);
  }, [themePreference, applyTheme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (themePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference, applyTheme]);

  const toggleTheme = () => {
    // Simple toggle between light and dark, and sets preference explicitly
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemePreference(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
