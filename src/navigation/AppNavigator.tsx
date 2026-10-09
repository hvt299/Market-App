import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Droplet, Coins, Banknote, LayoutDashboard, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { FONTS } from '../theme/typography';

import DashboardScreen from '../screens/DashboardScreen';
import GasPriceScreen from '../screens/GasPriceScreen';
import GoldPriceScreen from '../screens/GoldPriceScreen';
import ExchangeRateScreen from '../screens/ExchangeRateScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GasDetailScreen from '../screens/GasDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
    const insets = useSafeAreaInsets();
    const paddingBottom = insets.bottom > 0 ? insets.bottom : 12;
    const { colors, isDarkMode } = useTheme();

    return (
        <Tab.Navigator
            id="MainTabs"
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    height: 60 + paddingBottom,
                    paddingBottom: paddingBottom,
                    paddingTop: 8,
                    elevation: 8,
                    zIndex: 100,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDarkMode ? 0 : 0.04,
                    shadowRadius: 6,
                },
                tabBarLabelStyle: {
                    fontFamily: FONTS.semiBold,
                    fontSize: 11,
                    marginBottom: 4,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Tổng quan',
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard size={size - 2} color={color} strokeWidth={2.2} />
                    ),
                }}
            />
            <Tab.Screen
                name="Gas"
                component={GasPriceScreen}
                options={{
                    tabBarLabel: 'Xăng dầu',
                    tabBarIcon: ({ color, size }) => (
                        <Droplet size={size - 2} color={color} strokeWidth={2.5} />
                    ),
                }}
            />
            <Tab.Screen
                name="Gold"
                component={GoldPriceScreen}
                options={{
                    tabBarLabel: 'Vàng bạc',
                    tabBarIcon: ({ color, size }) => (
                        <Coins size={size - 2} color={color} strokeWidth={2.2} />
                    ),
                }}
            />
            <Tab.Screen
                name="Exchange"
                component={ExchangeRateScreen}
                options={{
                    tabBarLabel: 'Tỷ giá',
                    tabBarIcon: ({ color, size }) => (
                        <Banknote size={size - 2} color={color} strokeWidth={2.2} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Cài đặt',
                    tabBarIcon: ({ color, size }) => (
                        <Settings size={size - 2} color={color} strokeWidth={2.2} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="GasDetail" component={GasDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}