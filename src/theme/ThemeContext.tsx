import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    isDarkMode: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    themeMode: 'system',
    setThemeMode: () => { },
    colors: lightColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('app_theme_mode');
                if (savedTheme) {
                    setThemeModeState(savedTheme as ThemeMode);
                }
            } catch (e) {
                console.log('Lỗi tải theme', e);
            }
        };
        loadTheme();
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem('app_theme_mode', mode);
        } catch (e) {
            console.log('Lỗi lưu theme', e);
        }
    };

    const isDarkMode = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);