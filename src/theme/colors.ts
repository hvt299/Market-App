export const lightColors = {
    // Brand Colors
    primary: '#2563EB',         // Royal Blue - Hiện đại, tin cậy, sắc sảo
    primaryMuted: '#2563EB15',
    secondary: '#F59E0B',       // Amber Gold - Kim loại quý, năng lượng
    secondaryMuted: '#F59E0B15',
    accent: '#8B5CF6',          // Modern Violet
    accentMuted: '#8B5CF615',

    // Surfaces & Backgrounds
    background: '#F8FAFC',      // Slate 50 - Siêu sạch, thoáng mắt
    surface: '#FFFFFF',         // Card nền trắng tinh
    surfaceSubtle: '#F1F5F9',   // Nền phụ, input, chip
    surfaceElevated: '#FFFFFF',

    // Borders
    border: '#E2E8F0',          // Slate 200 - Viền mảnh tinh tế
    borderFocus: '#CBD5E1',

    // Typography
    textPrimary: '#0F172A',     // Slate 900 - Độ tương phản cao
    textSecondary: '#64748B',   // Slate 500 - Phụ đề rõ nét
    textTertiary: '#94A3B8',    // Slate 400 - Mờ nhẹ

    // Market Trends
    upColor: '#10B981',         // Emerald Green - Chuẩn tài chính quốc tế
    upMuted: '#10B98118',
    downColor: '#EF4444',       // Rose Red - Giảm giá
    downMuted: '#EF444418',
    neutralColor: '#64748B',    // Đứng giá
    neutralMuted: '#64748B18',

    // Commodity Accents
    gold: '#D97706',
    goldMuted: '#D9770618',
    silver: '#64748B',
    silverMuted: '#64748B18',

    // Navigation
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
};

export const darkColors = {
    // Brand Colors
    primary: '#3B82F6',         // Electric Blue - Nổi bật trên nền tối
    primaryMuted: '#3B82F620',
    secondary: '#FBBF24',       // Vàng ánh kim
    secondaryMuted: '#FBBF2420',
    accent: '#A78BFA',
    accentMuted: '#A78BFA20',

    // Surfaces & Backgrounds
    background: '#0B0F19',      // Deep Obsidian - Nền đen huyền thoại kiểu Bloomberg / TradingView
    surface: '#131B2E',         // Deep Navy Slate - Phân tách thẻ cực sang
    surfaceSubtle: '#1E293B',   // Nền chip, badge
    surfaceElevated: '#1A243B',

    // Borders
    border: '#1E293B',          // Viền tối lịch lãm
    borderFocus: '#334155',

    // Typography
    textPrimary: '#F8FAFC',     // Sáng rõ ràng
    textSecondary: '#94A3B8',   // Bạc xám thanh lịch
    textTertiary: '#64748B',

    // Market Trends
    upColor: '#34D399',         // Mint Green - Tươi sáng trên dark mode
    upMuted: '#34D39922',
    downColor: '#F87171',       // Coral Red
    downMuted: '#F8717122',
    neutralColor: '#94A3B8',
    neutralMuted: '#94A3B820',

    // Commodity Accents
    gold: '#F59E0B',
    goldMuted: '#F59E0B25',
    silver: '#94A3B8',
    silverMuted: '#94A3B820',

    // Navigation
    tabBar: '#0F172A',
    tabBarBorder: '#1E293B',
};

export type ThemeColors = typeof lightColors;