import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Fuel, Coins, Banknote } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import GoldPriceScreen from '../screens/GoldPriceScreen';
import ExchangeRateScreen from '../screens/ExchangeRateScreen';

export type MainTabParamList = {
    Gas: undefined;
    Gold: undefined;
    Exchange: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function AppNavigator() {
    const insets = useSafeAreaInsets();
    const paddingBottom = insets.bottom > 0 ? insets.bottom : 15;

    return (
        <NavigationContainer>
            <Tab.Navigator
                id="MainTab"
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: '#e67e22',
                    tabBarInactiveTintColor: '#95a5a6',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#f1f2f6',
                        height: 65 + paddingBottom,
                        paddingBottom: paddingBottom,
                        paddingTop: 8,
                        elevation: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                        marginBottom: 4,
                    }
                }}
            >
                <Tab.Screen
                    name="Gas"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Giá Xăng',
                        tabBarIcon: ({ color, size }) => (
                            <Fuel size={size} color={color} strokeWidth={2} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Gold"
                    component={GoldPriceScreen}
                    options={{
                        tabBarLabel: 'Giá Vàng',
                        tabBarIcon: ({ color, size }) => (
                            <Coins size={size} color={color} strokeWidth={2} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Exchange"
                    component={ExchangeRateScreen}
                    options={{
                        tabBarLabel: 'Tỷ Giá',
                        tabBarIcon: ({ color, size }) => (
                            <Banknote size={size} color={color} strokeWidth={2} />
                        )
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}