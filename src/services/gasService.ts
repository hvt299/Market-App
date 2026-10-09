import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getPreviousDay,
    getFuelCanonicalId,
    isFuelTitleMatch,
    getFuelSortIndex,
    getCleanFuelDisplayTitle,
    getFuelColor,
    formatCurrency,
    formatDate,
    FuelCanonicalId,
} from '../utils/helpers';

const PLX_REQ_FUEL = "eyJGaWx0ZXJCeSI6eyJBbmQiOlt7IlN5c3RlbUlEIjp7IkVxdWFscyI6IjY3ODNkYzEyNzFmZjQ0OWU5NWI3NGE5NTIwOTY0MTY5In19LHsiUmVwb3NpdG9yeUlEIjp7IkVxdWFscyI6ImE5NTQ1MWUyM2I0NzRmZTU4ODZiZmI3Y2Y4NDNmNTNjIn19LHsiUmVwb3NpdG9yeUVudGl0eUlEIjp7IkVxdWFscyI6IjM4MDEzNzhmZTFlMDQ1YjFhZmExMGRlN2M1Nzc2MTI0In19XX19";
const PLX_REQ_GAS = "eyJGaWx0ZXJCeSI6eyJBbmQiOlt7IlN5c3RlbUlEIjp7IkVxdWFscyI6IjcwOTAyNGYzN2UyZTRhZTg5MzgyMWQwNTY0ZjJmYjNlIn19LHsiUmVwb3NpdG9yeUlEIjp7IkVxdWFscyI6ImU4ZjcxMDJjNTY4MzQ3YzJiNWQyZjhjMGY4ZGFiMzhjIn19LHsiUmVwb3NpdG9yeUVudGl0eUlEIjp7IkVxdWFscyI6IjJjYTdmNGI1YzU0MTRlZTlhMzM4ZDY1NDZkNzYyNDNiIn19LHsiU3RhdHVzIjp7IkVxdWFscyI6IlB1Ymxpc2hlZCJ9fV19LCJTb3J0QnkiOnsiTGFzdE1vZGlmaWVkIjoiRGVzY2VuZGluZyJ9LCJQYWdpbmF0aW9uIjp7IlRvdGFsUmVjb3JkcyI6LTEsIlRvdGFsUGFnZXMiOjAsIlBhZ2VTaXplIjowLCJQYWdlTnVtYmVyIjowfX0";

export interface GasMarketItem {
    title: string;
    cleanTitle: string;
    canonicalId: FuelCanonicalId;
    zone1_price: number;
    zone2_price: number;
    change1: number;
    change2: number;
    isGas: boolean;
    date: string;
    price?: number;
}

export interface DashboardFuelItem {
    rawItem: any;
    title: string;
    price1: string;
    price2: string;
    trendValue1: number;
    trendValue2: number;
    color: string;
    isGas: boolean;
}

/**
 * Tải toàn bộ dữ liệu giá xăng dầu từ Petrolimex CMS và API giaxanghomnay
 */
export async function fetchFullGasData(targetDateInput?: string) {
    let targetDate = targetDateInput || new Date().toISOString().substring(0, 10);
    const oldApiUrl = `https://giaxanghomnay.com/api/pvdate/${targetDate}`;
    let oldResponse: any;

    try {
        oldResponse = await axios.get(oldApiUrl, { timeout: 8000 });
        if (!Array.isArray(oldResponse.data) || oldResponse.data.length < 2) {
            targetDate = getPreviousDay(targetDate);
            oldResponse = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`, { timeout: 8000 });
        }
    } catch {
        targetDate = getPreviousDay(targetDate);
        oldResponse = await axios.get(`https://giaxanghomnay.com/api/pvdate/${targetDate}`, { timeout: 8000 });
    }

    const [newFuelRes, newGasRes] = await Promise.all([
        axios.get(`https://portals.petrolimex.com.vn/~apis/portals/cms.item/search?x-request=${PLX_REQ_FUEL}`, { timeout: 8000 }).catch(() => ({ data: { Objects: [] } })),
        axios.get(`https://portals.petrolimex.com.vn/~apis/portals/cms.item/search?x-request=${PLX_REQ_GAS}&language=vi-VN`, { timeout: 8000 }).catch(() => ({ data: { Objects: [] } }))
    ]);

    const rawDataObj = {
        oldApi: oldResponse.data,
        newFuel: newFuelRes.data?.Objects || [],
        newGas: newGasRes.data?.Objects || [],
        targetDate
    };

    await AsyncStorage.setItem('cache_gas_latest', JSON.stringify(rawDataObj));
    return rawDataObj;
}

/**
 * Xử lý dữ liệu hiển thị cho từng nhà cung cấp (Petrolimex hoặc PVOIL)
 */
export function processProviderGasData(dataObj: any, providerId: string): GasMarketItem[] {
    if (!dataObj || !dataObj.oldApi) return [];
    const { oldApi, newFuel, newGas, targetDate } = dataObj;

    if (providerId === 'Petrolimex') {
        const yesterdayData = oldApi[2] || [];

        const hasE10Ron95V = newFuel.some((item: any) => getFuelCanonicalId(item.Title) === 'RON_95_V' && /E10/i.test(item.Title));
        const hasE10Ron95III = newFuel.some((item: any) => getFuelCanonicalId(item.Title) === 'RON_95_III' && /E10/i.test(item.Title));

        const fuelItems: GasMarketItem[] = newFuel
            .filter((item: any) => {
                const cid = getFuelCanonicalId(item.Title);
                if (cid === 'RON_95_V' && hasE10Ron95V && !/E10/i.test(item.Title)) return false;
                if (cid === 'RON_95_III' && hasE10Ron95III && !/E10/i.test(item.Title)) return false;
                return true;
            })
            .map((item: any) => {
                const yItem = yesterdayData.find((y: any) => isFuelTitleMatch(y.title, item.Title));
                return {
                    title: item.Title,
                    cleanTitle: getCleanFuelDisplayTitle(item.Title),
                    canonicalId: getFuelCanonicalId(item.Title),
                    zone1_price: item.Zone1Price,
                    zone2_price: item.Zone2Price,
                    change1: yItem ? item.Zone1Price - yItem.zone1_price : 0,
                    change2: yItem ? item.Zone2Price - (yItem.zone2_price || 0) : 0,
                    isGas: false,
                    date: item.LastModified || targetDate
                };
            })
            .sort((a: any, b: any) => getFuelSortIndex(a.title) - getFuelSortIndex(b.title));

        const gasItems: GasMarketItem[] = newGas.map((item: any) => ({
            title: `Gas Petrolimex - ${item.Title}`,
            cleanTitle: `Gas ${item.Title}`,
            canonicalId: 'GAS' as FuelCanonicalId,
            zone1_price: item.TwelvePrice,
            zone2_price: item.FortyeightPrice,
            change1: 0,
            change2: 0,
            isGas: true,
            date: item.LastModified || targetDate
        })).sort((a: any, b: any) => {
            const order = [
                'Gas Petrolimex - Hà Nội',
                'Gas Petrolimex - Hải Phòng',
                'Gas Petrolimex - Đà Nẵng',
                'Gas Petrolimex - Hồ Chí Minh',
                'Gas Petrolimex - Cần Thơ'
            ];
            const idxA = order.indexOf(a.title);
            const idxB = order.indexOf(b.title);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
        });

        return [...fuelItems, ...gasItems];
    } else {
        const todayData = oldApi[1] || [];
        const yesterdayData = oldApi[3] || [];

        return todayData.map((item: any) => {
            const yItem = yesterdayData.find((y: any) => isFuelTitleMatch(y.title, item.title));
            return {
                ...item,
                cleanTitle: getCleanFuelDisplayTitle(item.title),
                canonicalId: getFuelCanonicalId(item.title),
                zone1_price: item.price,
                zone2_price: 0,
                change1: yItem ? item.price - yItem.price : 0,
                change2: 0,
                isGas: false,
                date: targetDate
            };
        }).sort((a: any, b: any) => getFuelSortIndex(a.title) - getFuelSortIndex(b.title));
    }
}

/**
 * Trích xuất các thẻ tóm tắt cho màn hình Dashboard
 */
export function extractDashboardFuels(dataObj: any, primaryColor: string): DashboardFuelItem[] {
    if (!dataObj || !dataObj.oldApi) return [];
    const { oldApi, newFuel, newGas, targetDate } = dataObj;
    const yesterdayData = oldApi[2] || [];

    const targetFuelKeys: FuelCanonicalId[] = ['RON_95_V', 'RON_95_III', 'RON_92_II'];

    const processedFuel: DashboardFuelItem[] = targetFuelKeys.map((key) => {
        const item = newFuel.find((i: any) => getFuelCanonicalId(i.Title) === key);
        if (!item) return null;
        const yItem = yesterdayData.find((y: any) => isFuelTitleMatch(y.title, item.Title));

        const rawItem = {
            title: item.Title,
            zone1_price: item.Zone1Price,
            zone2_price: item.Zone2Price,
            date: item.LastModified || targetDate
        };

        return {
            rawItem,
            title: getCleanFuelDisplayTitle(item.Title),
            price1: formatCurrency(item.Zone1Price),
            price2: formatCurrency(item.Zone2Price),
            trendValue1: yItem ? item.Zone1Price - yItem.zone1_price : 0,
            trendValue2: yItem ? item.Zone2Price - (yItem.zone2_price || 0) : 0,
            color: getFuelColor(item.Title, primaryColor),
            isGas: false
        };
    }).filter(Boolean) as DashboardFuelItem[];

    const targetGasRegions = ['Hà Nội', 'Hải Phòng', 'Đà Nẵng', 'Hồ Chí Minh', 'Cần Thơ'];
    const processedGas: DashboardFuelItem[] = targetGasRegions.map((region) => {
        const item = newGas.find((i: any) => i.Title.includes(region));
        if (!item) return null;

        const rawItem = {
            title: `Gas Petrolimex - ${item.Title}`,
            zone1_price: item.TwelvePrice,
            zone2_price: item.FortyeightPrice,
            date: item.LastModified || targetDate,
            isGas: true
        };
        return {
            rawItem,
            title: `Gas - ${item.Title}`,
            price1: formatCurrency(item.TwelvePrice),
            price2: formatCurrency(item.FortyeightPrice),
            trendValue1: 0,
            trendValue2: 0,
            color: getFuelColor('Gas', primaryColor),
            isGas: true
        };
    }).filter(Boolean) as DashboardFuelItem[];

    return [...processedFuel, ...processedGas];
}
