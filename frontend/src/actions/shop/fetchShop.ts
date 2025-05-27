// Shopデータを取得する関数
import { Shop } from "@/types/shops";


// 店舗データの取得関数
export const fetchShops = async (): Promise<Shop[]> => {
    try {
        console.log('API呼び出し開始');
        const url = `${process.env.NEXT_PUBLIC_API_URL}/shops/`;
        console.log('リクエストURL:', url);
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            // クレデンシャルを含めない（認証不要のエンドポイント）
            credentials: 'omit',
        });

        console.log('レスポンスステータス:', response.status);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('エラーレスポンス本文:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();
        console.log('取得データ:', data);

        // APIレスポンスを適切な形式に変換
        const shops: Shop[] = data.map((shop: any) => ({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            prefecture: shop.prefecture,
            city: shop.city,
            area: shop.area,
            street: shop.street,
            building: shop.building,
            capacity: shop.capacity,
            images: shop.images || null,
            shop_types: Array.isArray(shop.shop_types) ? shop.shop_types.map((type: string) => ({ id: 0, name: type })) : [],
            shop_layouts: Array.isArray(shop.shop_layouts) ? shop.shop_layouts.map((layout: string) => ({ id: 0, name: layout })) : [],
            shop_options: Array.isArray(shop.shop_options) ? shop.shop_options.map((option: string) => ({ id: 0, name: option })) : [],
            business_hours: shop.business_hours || [],
            latitude: shop.latitude,
            longitude: shop.longitude,
            tags: Array.isArray(shop.tags) ? shop.tags : [] // タグ情報を追加
        }));

        console.log('変換後のデータ:', shops);
        return shops;
    } catch (error) {
        console.error("詳細なエラー情報:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}


// 単一の店舗データを取得する関数を追加
export async function fetchShopById(id: string): Promise<Shop> {
    try {
        console.log('店舗詳細データ取得開始:', id);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/${id}/`, {
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `JWT ${localStorage.getItem('access')}`
            },
            credentials: 'omit', // Cookieを送信しない
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('店舗データ取得エラー:', res.status, errorText);
            throw new Error(`Failed to fetch shop data: ${res.status} ${errorText}`);
        }

        const shop = await res.json();
        console.log('取得した店舗データ:', shop);
        
        // APIレスポンスを適切な形式に変換
        return {
            id: shop.id,
            name: shop.name,
            address: shop.address,
            prefecture: shop.prefecture,
            city: shop.city,
            area: shop.area,
            street: shop.street,
            building: shop.building,
            capacity: shop.capacity,
            images: shop.images || null,
            shop_types: Array.isArray(shop.shop_types) ? shop.shop_types.map((type: string) => ({ id: 0, name: type })) : [],
            shop_layouts: Array.isArray(shop.shop_layouts) ? shop.shop_layouts.map((layout: string) => ({ id: 0, name: layout })) : [],
            shop_options: Array.isArray(shop.shop_options) ? shop.shop_options.map((option: string) => ({ id: 0, name: option })) : [],
            business_hours: shop.business_hours || [],
            latitude: shop.latitude,
            longitude: shop.longitude,
            tags: Array.isArray(shop.tags) ? shop.tags : [] // タグ情報を追加（配列でない場合は空配列を設定）
        };
    } catch (error) {
        console.error("詳細なエラー情報:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}
