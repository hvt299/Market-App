import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
                        height: 70 + insets.bottom,
                        paddingTop: 12,
                        paddingBottom: insets.bottom + 12,
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#f1f2f6',
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '600',
                        marginTop: 4,
                        marginBottom: 0,
                    }
                }}
            >
                <Tab.Screen
                    name="Gas"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Giá Xăng',
                        tabBarIcon: ({ color }) => (
                            <MaterialCommunityIcons name="gas-station" size={26} color={color} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Gold"
                    component={GoldPriceScreen}
                    options={{
                        tabBarLabel: 'Giá Vàng',
                        tabBarIcon: ({ color }) => (
                            <MaterialCommunityIcons name="gold" size={26} color={color} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Exchange"
                    component={ExchangeRateScreen}
                    options={{
                        tabBarLabel: 'Tỷ Giá',
                        tabBarIcon: ({ color }) => (
                            <MaterialCommunityIcons name="currency-usd" size={26} color={color} />
                        )
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}