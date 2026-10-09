export const formatCurrency = (value: any) => {
    if (!value) return "0";
    if (isNaN(Number(value))) return value;
    return Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatDate = (dateString: string, addDays: number = 0) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (addDays !== 0) {
            date.setDate(date.getDate() + addDays);
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};

export const getTrendColor = (type: 'up' | 'down' | 'neutral') => {
    switch (type) {
        case 'up': return '#27AE60';
        case 'down': return '#E74C3c';
        default: return '#7F8C8D';
    }
};

export type FuelCanonicalId =
    | 'RON_95_V'
    | 'RON_95_III'
    | 'RON_92_II'
    | 'DO_0001S_V'
    | 'DO_005S_II'
    | 'DAU_HOA'
    | 'GAS'
    | 'OTHER';

export const removeVietnameseAccents = (str: string): string => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

export const normalizeFuelText = (str: string): string => {
    if (!str) return '';
    return removeVietnameseAccents(str)
        .toUpperCase()
        .replace(/[,.]/g, '') // Đồng bộ dấu thập phân 0,05 và 0.05 -> 005
        .replace(/[-\s_]+/g, ' ')
        .trim();
};

/**
 * Nhận diện mã định danh chuẩn (canonical ID) cho loại nhiên liệu,
 * tương thích cả tên gọi mới (Mức 5, Mức 3, Mức 2) và cũ (-V, -III, -II),
 * cũng như các tên có hoặc không có tiền tố E10/E5, Dầu/DO, dấu chấm/phẩy.
 */
export const getFuelCanonicalId = (title: string, isGas?: boolean): FuelCanonicalId => {
    if (isGas) return 'GAS';
    if (!title) return 'OTHER';
    const norm = normalizeFuelText(title);

    if (norm.includes('GAS') || norm.includes('LPG') || norm.includes('BINH GAS')) {
        return 'GAS';
    }

    // Dầu hỏa: Dầu hỏa 2-K, Dầu KO, Dầu hỏa 2K, DauKO
    if (norm.includes('HOA') || norm.includes('KO') || norm.includes('2 K') || norm.includes('2K')) {
        if (!norm.includes('RON') && !norm.includes('DO 0')) {
            return 'DAU_HOA';
        }
    }

    // Diesel 0.001S (Mức 5 / V)
    if ((norm.includes('DO') || norm.includes('DIESEL')) && (norm.includes('0001') || norm.includes('0 001'))) {
        return 'DO_0001S_V';
    }

    // Diesel 0.05S (Mức 2 / II)
    if ((norm.includes('DO') || norm.includes('DIESEL')) && (norm.includes('005') || norm.includes('0 05'))) {
        return 'DO_005S_II';
    }

    // Xăng RON 95 Mức 5 (Grade V) vs RON 95 Mức 3 (Grade III)
    if (norm.includes('95')) {
        const hasLevel5 =
            norm.includes('MUC 5') ||
            norm.includes('MUC V') ||
            norm.includes('95 V') ||
            norm.includes('95V') ||
            /\bV\b/.test(norm) ||
            /\b5\b/.test(norm.replace('95', ''));

        const hasLevel3 =
            norm.includes('MUC 3') ||
            norm.includes('MUC III') ||
            norm.includes('95 III') ||
            norm.includes('95III') ||
            /\bIII\b/.test(norm) ||
            /\b3\b/.test(norm.replace('95', ''));

        if (hasLevel5 && !hasLevel3) return 'RON_95_V';
        if (hasLevel3) return 'RON_95_III';
        return 'RON_95_III';
    }

    // Xăng RON 92 Mức 2 (Grade II)
    if (norm.includes('92')) {
        return 'RON_92_II';
    }

    // Dự phòng cho DO không ghi rõ hàm lượng lưu huỳnh
    if (norm.includes('DO') || norm.includes('DIESEL')) {
        if (norm.includes('5') || norm.includes(' V')) return 'DO_0001S_V';
        return 'DO_005S_II';
    }

    return 'OTHER';
};

/**
 * So sánh 2 tên gọi xem có cùng chỉ một loại nhiên liệu không,
 * giải quyết sự chênh lệch tên giữa các ngày/nguồn (vd: Xăng E10 RON 95 Mức 5 vs Xăng RON 95 Mức 5 vs Xăng E10 RON 95-V).
 */
export const isFuelTitleMatch = (titleA: string, titleB: string): boolean => {
    if (!titleA || !titleB) return false;
    if (titleA === titleB) return true;

    const idA = getFuelCanonicalId(titleA);
    const idB = getFuelCanonicalId(titleB);

    if (idA !== 'OTHER' && idA !== 'GAS' && idA === idB) {
        return true;
    }

    if (idA === 'GAS' && idB === 'GAS') {
        const normA = normalizeFuelText(titleA);
        const normB = normalizeFuelText(titleB);
        const cities = ['HA NOI', 'HAI PHONG', 'DA NANG', 'HO CHI MINH', 'CAN THO'];
        for (const city of cities) {
            if (normA.includes(city) && normB.includes(city)) return true;
        }
        return normA === normB;
    }

    return normalizeFuelText(titleA) === normalizeFuelText(titleB);
};

/**
 * Thứ tự chuẩn để sắp xếp danh sách xăng dầu:
 * 1. RON 95 Mức 5 (hoặc -V)
 * 2. RON 95 Mức 3 (hoặc -III)
 * 3. RON 92 Mức 2 (hoặc -II)
 * 4. DO 0,001S Mức 5 (hoặc -V)
 * 5. DO 0,05S Mức 2 (hoặc -II)
 * 6. Dầu hỏa 2-K (hoặc KO)
 * Các loại khác và Gas theo sau
 */
export const getFuelSortIndex = (title: string, isGas?: boolean): number => {
    if (isGas) return 100;
    const id = getFuelCanonicalId(title);
    switch (id) {
        case 'RON_95_V': return 1;
        case 'RON_95_III': return 2;
        case 'RON_92_II': return 3;
        case 'DO_0001S_V': return 4;
        case 'DO_005S_II': return 5;
        case 'DAU_HOA': return 6;
        default: return 50;
    }
};

/**
 * Phân loại nhiên liệu phục vụ bộ lọc tab: 'xang' | 'dau' | 'gas' | 'other'
 */
export const getFuelCategory = (title: string, isGas?: boolean): 'xang' | 'dau' | 'gas' | 'other' => {
    if (isGas) return 'gas';
    const id = getFuelCanonicalId(title);
    if (id === 'GAS') return 'gas';
    if (id === 'RON_95_V' || id === 'RON_95_III' || id === 'RON_92_II') return 'xang';
    if (id === 'DO_0001S_V' || id === 'DO_005S_II' || id === 'DAU_HOA') return 'dau';

    const norm = normalizeFuelText(title);
    if (norm.includes('GAS') || norm.includes('LPG') || norm.includes('BINH')) return 'gas';
    if (norm.includes('XANG') || norm.includes('RON') || norm.includes('E10') || norm.includes('E5')) return 'xang';
    if (norm.includes('DAU') || norm.includes('DO') || norm.includes('DIESEL') || norm.includes('KO') || norm.includes('HOA') || norm.includes('MAZUT')) return 'dau';

    return 'other';
};

const getSearchKeywordsForTitle = (title: string, isGas?: boolean): string[] => {
    if (isGas) return ['GAS', 'PETROLIMEX GAS', 'BINH GAS', 'LPG'];
    const id = getFuelCanonicalId(title);
    switch (id) {
        case 'RON_95_V':
            return ['XANG', 'E10', 'RON 95', '95', 'MUC 5', 'MUC V', '95 V', '95-V', '95 5', 'RON 95 V', 'RON 95-V', 'RON 95 5', 'RON95V', 'V'];
        case 'RON_95_III':
            return ['XANG', 'E10', 'RON 95', '95', 'MUC 3', 'MUC III', '95 III', '95-III', '95 3', 'RON 95 III', 'RON 95-III', 'RON 95 3', 'RON95III', 'III'];
        case 'RON_92_II':
            return ['XANG', 'E5', 'RON 92', '92', 'MUC 2', 'MUC II', '92 II', '92-II', '92 2', 'RON 92 II', 'RON 92-II', 'RON 92 2', 'RON92II', 'II'];
        case 'DO_0001S_V':
            return ['DAU', 'DO', 'DIESEL', '0.001', '0,001', '0.001S', '0,001S', '0001', '0001S', 'MUC 5', 'MUC V', 'DO-V', 'DO V', 'DO0001SV', 'V'];
        case 'DO_005S_II':
            return ['DAU', 'DO', 'DIESEL', '0.05', '0,05', '0.05S', '0,05S', '005', '005S', 'MUC 2', 'MUC II', 'DO-II', 'DO II', 'DO005SII', 'II'];
        case 'DAU_HOA':
            return ['DAU', 'DAU HOA', 'HOA', 'KO', 'DAU KO', '2-K', '2K', 'DAUHOA', 'DAUKO', 'DAU HOA 2-K'];
        default:
            return [];
    }
};

/**
 * Tìm kiếm thông minh hỗ trợ cả tên cũ (La Mã, KO, ...) và tên mới (Mức 5, Mức 3, 2-K, ...),
 * hỗ trợ gõ không dấu, dấu chấm phẩy (0.05 vs 0,05).
 */
export const matchesFuelSearch = (itemTitle: string, query: string, isGas?: boolean): boolean => {
    if (!query || !query.trim()) return true;
    const qRaw = query.trim().toLowerCase();
    const tRaw = (itemTitle || '').toLowerCase();

    // 1. Khớp chuỗi trực tiếp
    if (tRaw.includes(qRaw)) return true;

    // 2. Khớp chuỗi chuẩn hóa (bỏ dấu)
    const qNorm = normalizeFuelText(query);
    const tNorm = normalizeFuelText(itemTitle);
    if (tNorm.includes(qNorm)) return true;

    // 3. Khớp các từ khóa đại diện của sản phẩm
    const keywords = getSearchKeywordsForTitle(itemTitle, isGas);
    for (const kw of keywords) {
        const kwNorm = normalizeFuelText(kw);
        if (kwNorm.includes(qNorm)) return true;
    }

    // 4. Khớp từng từ trong chuỗi tìm kiếm (tất cả các từ phải có trong tiêu đề hoặc từ khóa)
    const qTokens = qNorm.split(' ').filter(Boolean);
    const tTokens = tNorm.split(' ').filter(Boolean);

    return qTokens.every(tok => {
        if (tTokens.includes(tok)) return true;
        return keywords.some(kw => {
            const kwTokens = normalizeFuelText(kw).split(' ').filter(Boolean);
            return kwTokens.includes(tok);
        });
    });
};

/**
 * Tên hiển thị gọn gàng trên Card và Header, loại bỏ tiền tố thừa "Xăng ", "Dầu DO" -> "DO", "Gas Petrolimex - Hà Nội" -> "Gas • Hà Nội"
 */
export const getCleanFuelDisplayTitle = (title: string): string => {
    if (!title) return '';
    return title
        .replace(/^Xăng\s+/i, '')
        .replace(/^Dầu\s+(?=DO)/i, '')
        .replace(/^Gas\s+Petrolimex\s*-\s*/i, 'Gas • ')
        .replace(/^Gas\s*-\s*/i, 'Gas • ');
};

export const getFuelColor = (title: string, defaultColor: string) => {
    const id = getFuelCanonicalId(title);
    switch (id) {
        case 'RON_95_V': return '#e74c3c';
        case 'RON_95_III': return '#f39c12';
        case 'RON_92_II': return '#27AE60';
        case 'DO_0001S_V': return '#2980b9';
        case 'DO_005S_II': return '#3498db';
        case 'DAU_HOA': return '#16a085';
        case 'GAS': return '#9b59b6';
        default: {
            const norm = normalizeFuelText(title);
            if (norm.includes('DO') || norm.includes('DAU') || norm.includes('KO') || norm.includes('MAZUT')) return '#3498db';
            if (norm.includes('GAS') || norm.includes('BINH')) return '#9b59b6';
            return defaultColor;
        }
    }
};

export const getLogo = (code: string) => {
    const map: Record<string, string> = {
        'Petrolimex': 'https://files.petrolimex.com.vn/thumbnailwebps/9a04b7cf9aaf4656a407ff8652dcfdf7/0/0/0/626286bfb2794d9f9ff49efeaebf8955/0/2026/1944721000402/petrolimex-gioi-thieu-nhan-dien-thuong-hieu-moi-san-sang-cung-dat-nuoc-tien-vao-ky-nguyen-moi.webp',
        'Pvoil': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk0NxnE48QLQDzhgOLC7cyrzu6BazbProGNped_eYRHoIZhXFEKi-vYPSBnzs2EtDB4bw&usqp=CAU',
        'SJC': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6K0BZVvz93geE3_wiXyWzZV8JPRIP8iSwsA&s',
        'DOJI': 'https://ibrand.vn/wp-content/uploads/2024/09/16350118_LOGO-DOJI.png',
        'PNJ': 'https://cdn.pnj.io/images/logo/pnj.com.vn.png',
        'Bảo Tín Minh Châu': 'https://btmc.vn/favicon.ico',
        'Bảo Tín Mạnh Hải': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEhxpVShRWtLfiQkFfROar90kT0x_t5g_vAw&s',
        'Phú Quý': 'https://cdn1.vieclam24h.vn/upload/files_cua_nguoi_dung/logo/2020/02/06/1881626_vieclam24h_1580975398.png',
        'Mi Hồng': 'https://www.mihong.vn/assets/images/logos/logo-desktop.png',
        'Ngọc Thẩm': 'https://hvnclc.vn/wp-content/uploads/2021/06/Ng%E1%BB%8Dc-Th%E1%BA%A9m-Jewelry-Logo.jpg',
        'VCB': 'https://cdn.tgdd.vn/2020/04/GameApp/icon-200x200.jpg',
        'BIDV': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Logo_Bidv_m%E1%BB%9Bi.svg/3840px-Logo_Bidv_m%E1%BB%9Bi.svg.png',
        'AGRI': 'https://play-lh.googleusercontent.com/rNSXUqGnK-ljK6qUdUmy7h_sDrMOzZ1nPwAUAwshsmPaQuwNGn0Xwj-psgFrBSJOHg',
        'HDB': 'https://hdbank.com.vn/favicon.ico',
        'TPB': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Logo-TPB.png',
        'NHNN': 'https://sbv.gov.vn/documents/20117/32829/logo-nhnnvn-favicon.png/7c6d31ad-f40a-06ba-459e-030f95935ae5',
        'EUR': 'https://aimsvietnam.com/wp-content/uploads/eu-la-gi-aims-viet-nam-1.png',
    };
    return map[code] || null;
};

export const getPreviousDay = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const CARD_STYLES = {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F2F5'
};