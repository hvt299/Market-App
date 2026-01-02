import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                        elevation: 10,
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