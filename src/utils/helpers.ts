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

export const getFuelColor = (title: string, defaultColor: string) => {
    const t = title.toUpperCase();
    if (t.includes('RON 95-V')) return '#e74c3c';
    if (t.includes('RON 95-III')) return '#e67e22';
    if (t.includes('E5 RON 92-II')) return '#27AE60';
    if (t.includes('E10 RON 95-III')) return '#f39c12';
    if (t.includes('DO') || t.includes('DẦU') || t.includes('KO')) return '#3498db';
    return defaultColor;
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