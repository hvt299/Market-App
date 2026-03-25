import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';

interface ThemeContextType {
    isDarkMode: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    colors: lightColors,
    toggleTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

    const colors = isDarkMode ? darkColors : lightColors;

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);