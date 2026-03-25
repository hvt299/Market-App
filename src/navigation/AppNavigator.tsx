import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Droplet, Coins, Banknote, LayoutDashboard, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GasPriceScreen from '../screens/GasPriceScreen';
import GoldPriceScreen from '../screens/GoldPriceScreen';
import ExchangeRateScreen from '../screens/ExchangeRateScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';

export type MainTabParamList = {
    Dashboard: undefined;
    Gas: undefined;
    Gold: undefined;
    Exchange: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function AppNavigator() {
    const insets = useSafeAreaInsets();
    const paddingBottom = insets.bottom > 0 ? insets.bottom : 15;
    const { colors, isDarkMode } = useTheme();

    return (
        <NavigationContainer>
            <Tab.Navigator
                id="MainTab"
                initialRouteName="Dashboard"
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textSecondary,
                    tabBarStyle: {
                        backgroundColor: colors.tabBar,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        height: 65 + paddingBottom,
                        paddingBottom: paddingBottom,
                        paddingTop: 8,
                        elevation: isDarkMode ? 0 : 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: isDarkMode ? 0 : 0.05,
                        shadowRadius: 4,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginBottom: 4,
                    }
                }}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{
                        tabBarLabel: 'Tổng quan',
                        tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} strokeWidth={2} />
                    }}
                />
                <Tab.Screen
                    name="Gas"
                    component={GasPriceScreen}
                    options={{
                        tabBarLabel: 'Xăng dầu',
                        tabBarIcon: ({ color, size }) => <Droplet size={size} color={color} strokeWidth={2.5} />
                    }}
                />
                <Tab.Screen
                    name="Gold"
                    component={GoldPriceScreen}
                    options={{
                        tabBarLabel: 'Vàng bạc',
                        tabBarIcon: ({ color, size }) => <Coins size={size} color={color} strokeWidth={2} />
                    }}
                />
                <Tab.Screen
                    name="Exchange"
                    component={ExchangeRateScreen}
                    options={{
                        tabBarLabel: 'Tỷ giá',
                        tabBarIcon: ({ color, size }) => <Banknote size={size} color={color} strokeWidth={2} />
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'Cài đặt',
                        tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={2} />
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}