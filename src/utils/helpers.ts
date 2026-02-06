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

export const getLogo = (code: string) => {
    const map: Record<string, string> = {
        'Petrolimex': 'https://files.petrolimex.com.vn/thumbnailwebps/9a04b7cf9aaf4656a407ff8652dcfdf7/0/0/0/626286bfb2794d9f9ff49efeaebf8955/0/2026/1944721000402/petrolimex-gioi-thieu-nhan-dien-thuong-hieu-moi-san-sang-cung-dat-nuoc-tien-vao-ky-nguyen-moi.webp',
        'Pvoil': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk0NxnE48QLQDzhgOLC7cyrzu6BazbProGNped_eYRHoIZhXFEKi-vYPSBnzs2EtDB4bw&usqp=CAU',
        'SJC': 'https://sjc.com.vn/Data/Sites/1/media/img/logo.png',
        'DOJI': 'https://ibrand.vn/wp-content/uploads/2024/09/16350118_LOGO-DOJI.png',
        'PNJ': 'https://cdn.pnj.io/images/logo/pnj.com.vn.png',
        'VCB': 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Icon-Vietcombank.png',
        'BIDV': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Logo_BIDV.png',
        'AGRI': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Logo_Agribank.png',
        'HDB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/HDBank_logo.svg/2560px-HDBank_logo.svg.png',
        'TPB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Logo_TPBank.svg/2560px-Logo_TPBank.svg.png',
        'NHNN': 'https://upload.wikimedia.org/wikipedia/vi/a/a2/Logo_Ng%C3%A2n_h%C3%A0ng_Nh%C3%A0_n%C6%B0%E1%BB%9Bc_Vi%E1%BB%87t_Nam.png',
        'USD': 'https://flagsapi.com/US/flat/64.png',
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