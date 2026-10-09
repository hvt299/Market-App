import axios from 'axios';
import { parse } from 'node-html-parser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface MetalDashboardGroup {
    brandId: string;
    brand: string;
    region: string;
    item1: { title: string; buy: string; sell: string; unit: string };
    item2: { title: string; buy: string; sell: string; unit: string };
}

export interface MetalDetailItem {
    title: string;
    unit: string;
    buyPrice: string;
    sellPrice: string;
}

export interface MetalDetailGroup {
    region: string;
    items: MetalDetailItem[];
}

export const METAL_SOURCES = [
    { id: 'sjc', name: 'SJC', url: 'https://giavang.org/trong-nuoc/sjc/', type: 'gold' },
    { id: 'doji', name: 'DOJI', url: 'https://giavang.org/trong-nuoc/doji/', type: 'gold' },
    { id: 'pnj', name: 'PNJ', url: 'https://giavang.org/trong-nuoc/pnj/', type: 'gold' },
    { id: 'bao-tin-minh-chau', name: 'Bảo Tín Minh Châu', url: 'https://giavang.org/trong-nuoc/bao-tin-minh-chau/', type: 'gold' },
    { id: 'bao-tin-manh-hai', name: 'Bảo Tín Mạnh Hải', url: 'https://giavang.org/trong-nuoc/bao-tin-manh-hai/', type: 'gold' },
    { id: 'phu-quy', name: 'Phú Quý', url: 'https://giavang.org/trong-nuoc/phu-quy/', type: 'gold' },
    { id: 'mi-hong', name: 'Mi Hồng', url: 'https://giavang.org/trong-nuoc/mi-hong/', type: 'gold' },
    { id: 'ngoc-tham', name: 'Ngọc Thẩm', url: 'https://giavang.org/trong-nuoc/ngoc-tham/', type: 'gold' },
    { id: 'bac-phu-quy', name: 'Bạc Phú Quý', url: 'https://giabac.phuquygroup.vn/', type: 'silver' },
];

export const normalizeMetalName = (text: string) => {
    let t = text.replace(/\s+/g, ' ').trim().toLowerCase();
    t = t.replace(/phú quý/g, 'Phú Quý');
    t = t.replace(/1 lượng/g, '1L');
    t = t.replace(/10 lượng/g, '10L');
    t = t.replace(/5 lượng/g, '5L');
    t = t.replace(/1 kilo|1kg|1 kg/g, '1KG');
    return t.charAt(0).toUpperCase() + t.slice(1);
};

export async function fetchMetalDetailData(source: typeof METAL_SOURCES[0]): Promise<{ data: MetalDetailGroup[]; time: string; isOffline: boolean }> {
    const netState = await NetInfo.fetch();
    const cacheKey = `cache_metal_${source.id}`;

    if (!netState.isConnected) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return { data: parsed.data || [], time: parsed.time || '', isOffline: true };
        }
        return { data: [], time: '', isOffline: true };
    }

    try {
        const response = await axios.get(source.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const root = parse(response.data);
        const groupedData: MetalDetailGroup[] = [];
        const rows = root.querySelectorAll('tr');
        let updatedTime = '';

        if (source.type === 'silver') {
            const timeNode = root.querySelector('.update-info-mobile');
            if (timeNode) {
                updatedTime = timeNode.text.replace(/Cập nhật lần cuối[:\s]*/i, '').replace(/\s+/g, ' ').trim();
            }

            let brandGroup: MetalDetailGroup = { region: 'Bạc thương hiệu Phú Quý', items: [] };
            let otherGroup: MetalDetailGroup = { region: 'Bạc thương hiệu khác', items: [] };

            rows.forEach(row => {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 4) {
                    let title = normalizeMetalName(tds[0].text);
                    let unit = tds[1].text.trim().toLowerCase() === 'vnđ/kg' ? 'đ/kg' : 'đ/lượng';
                    let buyPrice = tds[2].text.trim();
                    let sellPrice = tds[3].text.trim();

                    const item = { title, unit, buyPrice, sellPrice };

                    if (title.includes('Phú Quý')) {
                        brandGroup.items.push(item);
                    } else {
                        otherGroup.items.push(item);
                    }
                }
            });

            if (brandGroup.items.length) groupedData.push(brandGroup);
            if (otherGroup.items.length) groupedData.push(otherGroup);
        } else {
            let currentGroup: MetalDetailGroup = { region: 'Toàn quốc', items: [] };
            let isGroupAdded = false;

            rows.forEach(row => {
                const th = row.querySelector('th');
                const tds = row.querySelectorAll('td');

                if (tds.length === 1 && tds[0].getAttribute('colspan')) {
                    const timeText = tds[0].text.trim();
                    const timeMatch = timeText.match(/Cập nhật lúc\s+([0-9:]+\s+[0-9/]+)/i);
                    if (timeMatch) {
                        updatedTime = timeMatch[1];
                    }
                    return;
                }

                if (th && th.getAttribute('rowspan')) {
                    currentGroup = { region: th.text.trim(), items: [] };
                    groupedData.push(currentGroup);
                    isGroupAdded = true;
                    if (tds.length >= 3) {
                        currentGroup.items.push({
                            title: tds[0].text.trim(),
                            unit: 'k/lượng',
                            buyPrice: tds[1].text.trim(),
                            sellPrice: tds[2].text.trim()
                        });
                    }
                } else if (th && !th.getAttribute('rowspan') && tds.length >= 2) {
                    if (!isGroupAdded) {
                        groupedData.push(currentGroup);
                        isGroupAdded = true;
                    }
                    currentGroup.items.push({
                        title: th.text.trim(),
                        unit: 'k/lượng',
                        buyPrice: tds[0].text.trim(),
                        sellPrice: tds[1].text.trim()
                    });
                } else if (!th && tds.length >= 3) {
                    if (!isGroupAdded) {
                        groupedData.push(currentGroup);
                        isGroupAdded = true;
                    }
                    currentGroup.items.push({
                        title: tds[0].text.trim(),
                        unit: 'k/lượng',
                        buyPrice: tds[1].text.trim(),
                        sellPrice: tds[2].text.trim()
                    });
                }
            });
        }

        const finalData = groupedData.filter(g => g.items.length > 0);
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: finalData, time: updatedTime }));
        return { data: finalData, time: updatedTime, isOffline: false };
    } catch (error) {
        console.log('Lỗi fetch chi tiết kim loại quý:', error);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return { data: parsed.data || [], time: parsed.time || '', isOffline: false };
        }
        return { data: [], time: '', isOffline: false };
    }
}

export async function fetchDashboardMetalsData(): Promise<{ gold: MetalDashboardGroup[]; silver: MetalDashboardGroup[] }> {
    try {
        const [resSJC, resDOJI, resPNJ, resSilver] = await Promise.all([
            axios.get('https://giavang.org/trong-nuoc/sjc/', { timeout: 8000 }).catch(() => null),
            axios.get('https://giavang.org/trong-nuoc/doji/', { timeout: 8000 }).catch(() => null),
            axios.get('https://giavang.org/trong-nuoc/pnj/', { timeout: 8000 }).catch(() => null),
            axios.get('https://giabac.phuquygroup.vn/', { timeout: 8000 }).catch(() => null),
        ]);

        const extractGoldPrices = (html: string | null) => {
            const items: any[] = [];
            if (!html) return items;
            const root = parse(html);
            const mainBox = root.querySelector('.gold-price-box');

            if (mainBox) {
                const titles = mainBox.querySelectorAll('h2');
                titles.forEach((h2Node) => {
                    const title = h2Node.text.trim();
                    const row = h2Node.nextElementSibling;
                    if (row && row.classNames.includes('row')) {
                        let buy = row.querySelector('.box-cgre .gold-price')?.text.replace('x1000đ/lượng', '').trim() || '-';
                        let sell = row.querySelector('.box-cred .gold-price')?.text.replace('x1000đ/lượng', '').trim() || '-';
                        items.push({ title, buy, sell });
                    }
                });
            }
            return items;
        };

        const sjcList = extractGoldPrices(resSJC?.data);
        const dojiList = extractGoldPrices(resDOJI?.data);
        const pnjList = extractGoldPrices(resPNJ?.data);

        const formatGoldGroup = (brandId: string, brand: string, region: string, list: any[]): MetalDashboardGroup => {
            if (list.length === 0) {
                return {
                    brandId, brand, region,
                    item1: { title: 'Vàng miếng', buy: '-', sell: '-', unit: 'k/lượng' },
                    item2: { title: 'Vàng nhẫn', buy: '-', sell: '-', unit: 'k/lượng' }
                };
            }
            const nhan = list.find(item => item.title.toLowerCase().includes('nhẫn')) || { buy: '-', sell: '-' };
            const mieng = list.find(item => !item.title.toLowerCase().includes('nhẫn')) || list[0];
            return {
                brandId, brand, region,
                item1: { title: 'Vàng miếng', buy: mieng.buy, sell: mieng.sell, unit: 'k/lượng' },
                item2: { title: 'Vàng nhẫn', buy: nhan.buy, sell: nhan.sell, unit: 'k/lượng' }
            };
        };

        const gData: MetalDashboardGroup[] = [
            formatGoldGroup('sjc', 'SJC', 'TP. Hồ Chí Minh', sjcList),
            formatGoldGroup('doji', 'DOJI', 'Hà Nội', dojiList),
            formatGoldGroup('pnj', 'PNJ', 'Hà Nội', pnjList)
        ];

        let sData: MetalDashboardGroup[] = [
            { brandId: 'bac-phu-quy', brand: 'Bạc Phú Quý', region: 'Toàn quốc', item1: { title: 'Bạc miếng 1L', buy: '-', sell: '-', unit: 'đ/lượng' }, item2: { title: 'Bạc thỏi 10L', buy: '-', sell: '-', unit: 'đ/lượng' } }
        ];

        if (resSilver && resSilver.data) {
            const root = parse(resSilver.data);
            const silverProducts: any[] = [];
            const rows = root.querySelectorAll('tr');

            rows.forEach(row => {
                const tds = row.querySelectorAll('td');
                if (tds.length >= 4) {
                    let title = tds[0].text.replace(/\s+/g, ' ').trim();

                    if (title.toUpperCase().includes('BẠC MIẾNG')) title = 'Bạc miếng 1 Lượng';
                    else if (title.toUpperCase().includes('10 LƯỢNG')) title = 'Bạc thỏi 10 Lượng';
                    else if (title.toUpperCase().includes('ĐỒNG BẠC')) title = 'Đồng bạc mỹ nghệ';
                    else if (title.toUpperCase().includes('1KILO') || title.toUpperCase().includes('1 KILO')) title = 'Bạc thỏi 1 Kilo';
                    else if (title.toUpperCase().includes('999')) title = 'Bạc 999 khác';

                    let unit = tds[1].text.trim().toLowerCase().includes('kg') ? 'đ/kg' : 'đ/lượng';
                    let buy = tds[2].text.trim();
                    let sell = tds[3].text.trim();

                    if (buy && buy !== '-' && buy !== '_') {
                        silverProducts.push({ title, unit, buy, sell });
                    }
                }
            });

            if (silverProducts.length >= 2) {
                sData = [
                    {
                        brandId: 'bac-phu-quy',
                        brand: 'Bạc Phú Quý',
                        region: 'Bạc miếng & Thỏi 999',
                        item1: silverProducts[0],
                        item2: silverProducts[1],
                    },
                ];
                if (silverProducts.length >= 4) {
                    sData.push({
                        brandId: 'bac-phu-quy',
                        brand: 'Bạc Phú Quý',
                        region: 'Bạc Kilo & Mỹ nghệ',
                        item1: silverProducts[3] || silverProducts[2],
                        item2: silverProducts[2] || silverProducts[3],
                    });
                }
            }
        }

        await AsyncStorage.setItem('cache_dashboard_gold', JSON.stringify(gData));
        await AsyncStorage.setItem('cache_dashboard_silver', JSON.stringify(sData));

        return { gold: gData, silver: sData };
    } catch (error) {
        console.log('Lỗi fetch kim loại quý:', error);
        return { gold: [], silver: [] };
    }
}
