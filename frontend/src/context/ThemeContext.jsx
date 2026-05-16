import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Define available themes
export const THEMES = {
  indigo: {
    name: 'Indigo Dream',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#22c55e',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1a1a3e 100%)',
    cards: 'rgba(99, 102, 241, 0.08)',
    borders: 'rgba(99, 102, 241, 0.3)',
  },
  violet: {
    name: 'Violet Night',
    primary: '#a855f7',
    secondary: '#ec4899',
    accent: '#06b6d4',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%)',
    cards: 'rgba(168, 85, 247, 0.08)',
    borders: 'rgba(168, 85, 247, 0.3)',
  },
  cyan: {
    name: 'Cyan Wave',
    primary: '#06b6d4',
    secondary: '#0891b2',
    accent: '#f59e0b',
    bg: 'linear-gradient(135deg, #0c2d3c 0%, #1a3f4a 100%)',
    cards: 'rgba(6, 182, 212, 0.08)',
    borders: 'rgba(6, 182, 212, 0.3)',
  },
  emerald: {
    name: 'Emerald Forest',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#8b5cf6',
    bg: 'linear-gradient(135deg, #064e3b 0%, #1a3a36 100%)',
    cards: 'rgba(16, 185, 129, 0.08)',
    borders: 'rgba(16, 185, 129, 0.3)',
  },
  rose: {
    name: 'Rose Gold',
    primary: '#f43f5e',
    secondary: '#fb7185',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg, #3f1f26 0%, #2d1f2f 100%)',
    cards: 'rgba(244, 63, 94, 0.08)',
    borders: 'rgba(244, 63, 94, 0.3)',
  },
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('indigo');
  const [loading, setLoading] = useState(true);

  // Load user's theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    setLoading(false);
  }, []);

  const changeTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('userTheme', themeName);
      toast.info(`🎨 Theme changed to ${THEMES[themeName].name}`, {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  const theme = THEMES[currentTheme];

  const value = {
    currentTheme,
    theme,
    changeTheme,
    allThemes: THEMES,
  };

  if (loading) return children;

  return (
    <ThemeContext.Provider value={value}>
      <div style={{ background: theme.bg, minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
