import { ShopStats } from '@/types/shops';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

/**
 * 店舗とユーザーの関係を切り替える
 */
export const toggleShopRelation = async (shopId: string, relationTypeId: number): Promise<any> => {
    try {
        const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/user-shop-relations/toggle/`,
            {
                method: 'POST',
                body: JSON.stringify({ shop_id: shopId, relation_type_id: relationTypeId }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('認証の有効期限が切れています。再度ログインしてください。');
            }
            throw new Error('リレーションの切り替えに失敗しました');
        }

        return response.json();
    } catch (error) {
        console.error('リレーション切り替えエラー:', error);
        throw error;
    }
};

/**
 * 店舗の統計情報を取得する
 */
export const fetchShopStats = async (shopId: string): Promise<ShopStats> => {
    try {
        const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/user-shop-relations/shop_stats/?shop_id=${shopId}`
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('認証が必要です。再度ログインしてください。');
            }
            throw new Error('店舗の統計情報の取得に失敗しました');
        }

        return response.json();
    } catch (error) {
        console.error('店舗統計情報取得エラー:', error);
        throw error;
    }
};

/**
 * タグの反応を切り替える
 */
export const toggleTagReaction = async (tagId: number): Promise<any> => {
    try {
        console.log(`toggleTagReaction called with tagId: ${tagId}`);
        const response = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_API_URL}/shop-tag-reactions/toggle/${tagId}/`,
            {
                method: 'POST',
            }
        );

        console.log(`toggleTagReaction response status: ${response.status}`);

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('認証の有効期限が切れています。再度ログインしてください。');
            }
            const errorText = await response.text();
            console.error(`toggleTagReaction error response: ${errorText}`);
            throw new Error('タグの反応切り替えに失敗しました');
        }

        const result = await response.json();
        console.log(`toggleTagReaction result:`, result);
        return result;
    } catch (error) {
        console.error('タグ反応切り替えエラー:', error);
        throw error;
    }
};
