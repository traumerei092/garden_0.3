// Shopデータを取得する関数
import { Shop } from "@/types/shops";
import { fetchWithAuth } from "@/app/lib/fetchWithAuth";

// 店舗データの取得関数
export const fetchShops = async (): Promise<Shop[]> => {
    try {
        console.log('API呼び出し開始');
        // 正しいURLパスを使用
        const url = `${process.env.NEXT_PUBLIC_API_URL}/shops/`;
        console.log('リクエストURL:', url);
        
        // fetchWithAuthを使用して認証情報を含める
        const response = await fetchWithAuth(url, {
            method: "GET",
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
            zip_code: shop.zip_code || null,
            address: shop.address,
            prefecture: shop.prefecture,
            city: shop.city,
            area: shop.area,
            street: shop.street,
            building: shop.building,
            capacity: shop.capacity,
            images: shop.images || null,
            // shop_typesは既にオブジェクトの配列として返される
            shop_types: Array.isArray(shop.shop_types) ? shop.shop_types : [],
            // shop_layoutsは既にオブジェクトの配列として返される
            shop_layouts: Array.isArray(shop.shop_layouts) ? shop.shop_layouts : [],
            // shop_optionsは既にオブジェクトの配列として返される
            shop_options: Array.isArray(shop.shop_options) ? shop.shop_options : [],
            business_hours: shop.business_hours || [],
            latitude: shop.latitude,
            longitude: shop.longitude,
            tags: Array.isArray(shop.tags) ? shop.tags : [],
            phone_number: shop.phone_number || null,
            access: shop.access || null,
            // payment_methodsが既にオブジェクトの配列であることを確認
            payment_methods: Array.isArray(shop.payment_methods) ? shop.payment_methods : []
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
        
        // デバッグ用：リクエストURLを表示
        const url = `${process.env.NEXT_PUBLIC_API_URL}/shops/${id}/`;
        console.log('リクエストURL:', url);
        
        // fetchWithAuthを使用して認証情報を含める
        const res = await fetchWithAuth(url, {
            cache: "no-store",
        });

        // デバッグ用：レスポンスステータスを表示
        console.log('レスポンスステータス:', res.status);
        // ヘッダー情報をログに出力（TypeScriptエラーを回避）
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log('レスポンスヘッダー:', headers);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('店舗データ取得エラー:', res.status, errorText);
            throw new Error(`Failed to fetch shop data: ${res.status} ${errorText}`);
        }

        const shop = await res.json();
        console.log('取得した店舗データ:', shop);
        
        // タグデータのデバッグ
        if (Array.isArray(shop.tags)) {
            console.log('タグデータの詳細:');
            shop.tags.forEach((tag: any) => {
                console.log(`タグID: ${tag.id}, 値: ${tag.value}, user_has_reacted: ${tag.user_has_reacted}, is_creator: ${tag.is_creator}`);
            });
        }
        
        // APIレスポンスを適切な形式に変換
        const formattedShop = {
            id: shop.id,
            name: shop.name,
            zip_code: shop.zip_code || null,
            address: shop.address,
            prefecture: shop.prefecture,
            city: shop.city,
            area: shop.area,
            street: shop.street,
            building: shop.building,
            capacity: shop.capacity,
            images: shop.images || null,
            // shop_typesは既にオブジェクトの配列として返される
            shop_types: Array.isArray(shop.shop_types) ? shop.shop_types : [],
            // shop_layoutsは既にオブジェクトの配列として返される
            shop_layouts: Array.isArray(shop.shop_layouts) ? shop.shop_layouts : [],
            // shop_optionsは既にオブジェクトの配列として返される
            shop_options: Array.isArray(shop.shop_options) ? shop.shop_options : [],
            business_hours: shop.business_hours || [],
            latitude: shop.latitude,
            longitude: shop.longitude,
            tags: Array.isArray(shop.tags) ? shop.tags.map((tag: any) => {
                // 明示的にboolean型に変換して確実に正しい型になるようにする
                const userHasReacted = tag.user_has_reacted === true;
                const isCreator = tag.is_creator === true;
                
                console.log(`変換後のタグ ${tag.id} (${tag.value}): user_has_reacted=${userHasReacted}, is_creator=${isCreator}`);
                
                return {
                    ...tag,
                    user_has_reacted: userHasReacted,
                    is_creator: isCreator
                };
            }) : [],
            phone_number: shop.phone_number || null,
            access: shop.access || null,
            // payment_methodsが既にオブジェクトの配列であることを確認
            payment_methods: Array.isArray(shop.payment_methods) ? shop.payment_methods : [],
            // 予算関連のフィールドを追加
            budget_weekday_min: shop.budget_weekday_min || null,
            budget_weekday_max: shop.budget_weekday_max || null,
            budget_weekend_min: shop.budget_weekend_min || null,
            budget_weekend_max: shop.budget_weekend_max || null,
            budget_note: shop.budget_note || null
        };
        
        console.log('変換後の店舗データ:', formattedShop);
        return formattedShop;
    } catch (error) {
        console.error("詳細なエラー情報:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}
