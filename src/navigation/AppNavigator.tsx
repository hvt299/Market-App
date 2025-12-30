import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import GoldPriceScreen from '../screens/GoldPriceScreen';

export type MainTabParamList = {
    Gas: undefined;
    Gold: undefined;
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
                        // FIX: Tăng chiều cao cơ bản lên 70 để thoải mái chứa Icon + Chữ
                        height: 70 + insets.bottom,

                        // Căn chỉnh lại padding để nội dung nằm giữa đẹp hơn
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
                        marginTop: 4, // Tăng khoảng cách giữa Icon và Chữ ra một chút cho thoáng
                        marginBottom: 0, // Đảm bảo không có margin thừa ở dưới
                    }
                }}
            >
                <Tab.Screen
                    name="Gas"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Giá Xăng',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="gas-station" size={26} color={color} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Gold"
                    component={GoldPriceScreen}
                    options={{
                        tabBarLabel: 'Giá Vàng',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="gold" size={26} color={color} />
                        )
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}