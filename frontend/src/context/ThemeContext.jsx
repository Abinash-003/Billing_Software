import React, { createContext, useContext, useCallback, useLayoutEffect, useState } from 'react';

const THEME_KEY = 'app-theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        return (localStorage.getItem(THEME_KEY) || 'dark');
    });

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (_) {}
    }, [theme]);

    const setTheme = useCallback((next) => {
        setThemeState((prev) => {
            const value = typeof next === 'function' ? next(prev) : next;
            return value === 'light' || value === 'dark' ? value : prev;
        });
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
