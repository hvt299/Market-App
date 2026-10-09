import axios from 'axios';
import { parse } from 'node-html-parser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface DashboardExchangeRate {
    code: string;
    name: string;
    buyCash: string;
    buyTransfer: string;
    sellCash: string;
    sellTransfer: string;
}

export interface BankExchangeRateItem {
    id: string;
    code: string;
    name: string;
    buyCash: string;
    buyTransfer: string;
    sellCash: string;
    sellTransfer: string;
}

export const EXCHANGE_SOURCES = [
    { id: 'vcb', name: 'Vietcombank', url: 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx' },
    { id: 'agri', name: 'Agribank', url: 'https://www.agribank.com.vn/vn/ty-gia' },
    { id: 'bidv', name: 'BIDV', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-bidv.epi' },
    { id: 'hdb', name: 'HDBank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-hdbank.epi' },
    { id: 'tpb', name: 'TPBank', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-tpbank.epi' },
    { id: 'nhnn', name: 'NHNN', url: 'https://baomoi.com/tien-ich-ty-gia-ngoai-te-nhnn.epi' },
];

export const CURRENCY_NAMES: Record<string, string> = {
    'USD': 'US DOLLAR', 'EUR': 'EURO', 'GBP': 'BRITISH POUND',
    'JPY': 'JAPANESE YEN', 'AUD': 'AUSTRALIAN DOLLAR', 'SGD': 'SINGAPORE DOLLAR',
    'THB': 'THAI BAHT', 'CAD': 'CANADIAN DOLLAR', 'NZD': 'NEW ZEALAND DOLLAR',
    'KRW': 'KOREAN WON', 'DKK': 'DANISH KRONE', 'NOK': 'NORWEGIAN KRONE',
    'SEK': 'SWEDISH KRONA', 'CHF': 'SWISS FRANC', 'HKD': 'HONGKONG DOLLAR',
    'RUB': 'RUSSIAN RUBLE', 'CNY': 'CHINESE YUAN', 'INR': 'INDIAN RUPEE',
    'KWD': 'KUWAITI DINAR', 'MYR': 'MALAYSIAN RINGGIT', 'SAR': 'SAUDI RIAL',
    'IDR': 'INDONESIAN RUPIAH', 'TWD': 'TAIWAN DOLLAR', 'MOP': 'MACANESE PATACA',
    'TRY': 'TURKISH LIRA', 'BRL': 'BRAZILIAN REAL', 'PLN': 'POLISH ZLOTY',
    'AED': 'UAE DIRHAM', 'ZAR': 'SOUTH AFRICAN RAND', 'CZK': 'CZECH KORUNA',
    'PHP': 'PHILIPPINE PESO', 'HUF': 'HUNGARIAN FORINT', 'LAK': 'LAO KIP'
};

export const formatVNRate = (value: string) => {
    if (!value || value === '-' || value === '0' || value === '') return '-';
    let valStr = value.toString().replace(/,/g, '');
    let parts = valStr.split('.');
    let intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    let decPart = parts.length > 1 ? parts[1] : '';
    return decPart ? `${intPart},${decPart} đ` : `${intPart} đ`;
};

export async function fetchBankExchangeRates(bank: typeof EXCHANGE_SOURCES[0]): Promise<{ rates: BankExchangeRateItem[]; time: string; isOffline: boolean }> {
    const netState = await NetInfo.fetch();
    const cacheKey = `cache_exchange_${bank.id}`;

    if (!netState.isConnected) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return { rates: parsed.rates || [], time: parsed.time || '', isOffline: true };
        }
        return { rates: [], time: '', isOffline: true };
    }

    try {
        const response = await axios.get(bank.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = response.data;
        const root = parse(data);
        const items: BankExchangeRateItem[] = [];
        let updatedTime = '';

        if (bank.id === 'vcb') {
            const timeNode = root.querySelector('datetime') || root.querySelector('DateTime');
            if (timeNode) {
                const rawTime = timeNode.text.trim();
                const match = rawTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(AM|PM)/i);
                if (match) {
                    let mo = match[1].padStart(2, '0');
                    let dd = match[2].padStart(2, '0');
                    let yy = match[3];
                    let hh = parseInt(match[4], 10);
                    let mm = match[5].padStart(2, '0');
                    let ss = match[6].padStart(2, '0');
                    let ampm = match[7].toUpperCase();

                    if (ampm === 'PM' && hh < 12) hh += 12;
                    if (ampm === 'AM' && hh === 12) hh = 0;

                    let hhs = String(hh).padStart(2, '0');
                    updatedTime = `${hhs}:${mm}:${ss} ${dd}/${mo}/${yy}`;
                } else {
                    updatedTime = rawTime;
                }
            }

            const exrates = root.querySelectorAll('exrate');
            exrates.forEach((node, index) => {
                const code = node.getAttribute('currencycode') || node.getAttribute('CurrencyCode');
                if (code) {
                    items.push({
                        id: index.toString(),
                        code: code,
                        name: (node.getAttribute('currencyname') || node.getAttribute('CurrencyName') || '').trim(),
                        buyCash: node.getAttribute('buy') || node.getAttribute('Buy') || '-',
                        buyTransfer: node.getAttribute('transfer') || node.getAttribute('Transfer') || '-',
                        sellCash: node.getAttribute('sell') || node.getAttribute('Sell') || '-',
                        sellTransfer: '-',
                    });
                }
            });
        } else if (bank.id === 'agri') {
            const timeNode = root.querySelector('.luu_ycc');
            if (timeNode) {
                const match = timeNode.text.match(/lúc\s+([0-9:]+)\s+ngày\s+([0-9\/]+)/i);
                if (match) {
                    let timeStr = match[1];
                    if (timeStr.length === 5) timeStr += ':00';
                    updatedTime = `${timeStr} ${match[2]}`;
                }
            }

            const rows = root.querySelectorAll('tr');
            rows.forEach((row, index) => {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 4) {
                    const code = tds[0].text.trim();
                    const buyCash = tds[1].text.replace(/&nbsp;/g, '').trim();
                    const buyTransfer = tds[2].text.replace(/&nbsp;/g, '').trim();
                    const sell = tds[3].text.replace(/&nbsp;/g, '').trim();

                    if (code && code.length === 3) {
                        items.push({
                            id: index.toString(),
                            code: code,
                            name: CURRENCY_NAMES[code] || '',
                            buyCash: buyCash || '-',
                            buyTransfer: buyTransfer || '-',
                            sellCash: sell || '-',
                            sellTransfer: '-',
                        });
                    }
                }
            });
        } else if (bank.url.includes('baomoi.com')) {
            const titleNode = root.querySelector('h2.ut-title');
            if (titleNode) {
                const timeMatch = titleNode.text.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})/);
                if (timeMatch) {
                    updatedTime = `${timeMatch[4]}:00 ${timeMatch[1]}/${timeMatch[2]}/${timeMatch[3]}`;
                }
            }

            const rows = root.querySelectorAll('.rc-table-tbody .rc-table-row');
            rows.forEach((row, index) => {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 6) {
                    const rawCode = tds[1].text.trim();
                    const codeMatch = rawCode.match(/^[A-Z]{3}/);

                    if (codeMatch) {
                        const code = codeMatch[0];
                        const buyCash = tds[2].text.trim() || '-';
                        const buyTransfer = tds[3].text.trim() || '-';
                        const sellCash = tds[4].text.trim() || '-';
                        const sellTransfer = tds[5].text.trim() || '-';

                        items.push({
                            id: index.toString(),
                            code: code,
                            name: CURRENCY_NAMES[code] || '',
                            buyCash: buyCash,
                            buyTransfer: buyTransfer,
                            sellCash: sellCash,
                            sellTransfer: sellTransfer,
                        });
                    }
                }
            });
        }

        const uniqueItems: BankExchangeRateItem[] = [];
        const map = new Map<string, boolean>();
        for (const item of items) {
            if (!map.has(item.code) && item.code !== '-') {
                map.set(item.code, true);
                uniqueItems.push(item);
            }
        }

        const finalTime = updatedTime || `00:00:00 ${new Date().toLocaleDateString('vi-VN')}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ rates: uniqueItems, time: finalTime }));
        return { rates: uniqueItems, time: finalTime, isOffline: false };
    } catch (error) {
        console.error('Lỗi lấy tỷ giá ngoại tệ:', error);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return { rates: parsed.rates || [], time: parsed.time || '', isOffline: false };
        }
        return { rates: [], time: '', isOffline: false };
    }
}

export async function fetchDashboardExchangeData(): Promise<DashboardExchangeRate[]> {
    try {
        const response = await axios.get('https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx', { timeout: 8000 });
        const root = parse(response.data);
        const exrates = root.querySelectorAll('exrate');

        const targetCodes = ['USD', 'EUR', 'GBP', 'JPY', 'KRW'];
        const results: DashboardExchangeRate[] = [];

        exrates.forEach(node => {
            const code = node.getAttribute('currencycode') || node.getAttribute('CurrencyCode');
            if (code && targetCodes.includes(code)) {
                results.push({
                    code: code,
                    name: (node.getAttribute('currencyname') || node.getAttribute('CurrencyName'))?.trim() || code,
                    buyCash: node.getAttribute('buy') || node.getAttribute('Buy') || '-',
                    buyTransfer: node.getAttribute('transfer') || node.getAttribute('Transfer') || '-',
                    sellCash: node.getAttribute('sell') || node.getAttribute('Sell') || '-',
                    sellTransfer: '-',
                });
            }
        });

        results.sort((a, b) => targetCodes.indexOf(a.code) - targetCodes.indexOf(b.code));
        await AsyncStorage.setItem('cache_dashboard_exchange', JSON.stringify(results));
        return results;
    } catch (error) {
        console.log('Lỗi fetch tỷ giá Dashboard:', error);
        return [];
    }
}
