import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { FONTS } from '../../theme/typography';

interface SegmentedOption {
    label: string;
    icon?: React.ReactNode;
}

interface SegmentedSliderProps {
    options: SegmentedOption[];
    selectedIndex: number;
    onChange: (index: number) => void;
    activeColor?: string;
    style?: StyleProp<ViewStyle>;
    height?: number;
}

export const SegmentedSlider: React.FC<SegmentedSliderProps> = ({
    options,
    selectedIndex,
    onChange,
    activeColor,
    style,
    height = 36,
}) => {
    const { colors } = useTheme();
    const [trackWidth, setTrackWidth] = useState(0);
    const sliderAnim = useRef(new Animated.Value(selectedIndex)).current;

    useEffect(() => {
        Animated.spring(sliderAnim, {
            toValue: selectedIndex,
            friction: 8,
            tension: 50,
            useNativeDriver: false,
        }).start();
    }, [selectedIndex, sliderAnim]);

    const numTabs = Math.max(1, options.length);
    const padding = 3;
    const availableWidth = Math.max(0, trackWidth - padding * 2);
    const tabWidth = availableWidth / numTabs;

    const inputRange = options.map((_, i) => i);
    const outputRange = options.map((_, i) => padding + i * tabWidth);

    const translateX = sliderAnim.interpolate({
        inputRange: inputRange.length > 1 ? inputRange : [0, 1],
        outputRange: outputRange.length > 1 ? outputRange : [padding, padding],
    });

    const highlightColor = activeColor || colors.primary;

    return (
        <View
            style={[
                styles.track,
                {
                    height,
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                },
                style,
            ]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - trackWidth) > 5) {
                    setTrackWidth(w);
                }
            }}
        >
            {trackWidth > 0 && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.indicator,
                        {
                            width: tabWidth,
                            height: height - padding * 2,
                            top: padding,
                            backgroundColor: highlightColor,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            )}

            {options.map((opt, idx) => {
                const isActive = selectedIndex === idx;
                return (
                    <TouchableOpacity
                        key={idx}
                        onPress={() => onChange(idx)}
                        activeOpacity={0.75}
                        style={[styles.tabButton, { height }]}
                    >
                        {opt.icon && <View style={styles.iconBox}>{opt.icon}</View>}
                        <Text
                            style={[
                                styles.tabText,
                                {
                                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                                    fontFamily: isActive ? FONTS.bold : FONTS.medium,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    indicator: {
        position: 'absolute',
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        paddingHorizontal: 6,
        gap: 6,
    },
    iconBox: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 12,
        letterSpacing: -0.2,
    },
});
