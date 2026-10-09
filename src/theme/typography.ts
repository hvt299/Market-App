import { Platform } from 'react-native';

export const FONTS = {
    regular: 'BeVietnamPro_400Regular',
    medium: 'BeVietnamPro_500Medium',
    semiBold: 'BeVietnamPro_600SemiBold',
    bold: 'BeVietnamPro_700Bold',
    extraBold: 'BeVietnamPro_800ExtraBold',
    black: 'BeVietnamPro_900Black',
};

export const FONT_FALLBACK = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
});
