import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';

interface PressableCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    activeScale?: number;
    disabled?: boolean;
}

export const PressableCard: React.FC<PressableCardProps> = ({
    children,
    onPress,
    style,
    disabled = false,
}) => {
    if (!onPress || disabled) {
        return <View style={style}>{children}</View>;
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.85}
            style={style}
        >
            {children}
        </TouchableOpacity>
    );
};
