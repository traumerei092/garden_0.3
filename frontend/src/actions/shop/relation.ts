import { ShopStats } from '@/types/shops';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * 店舗とユーザーの関係を切り替える
 */
export const toggleShopRelation = async (shopId: string, relationTypeId: number): Promise<any> => {
    const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('access')
        : null;

    if (!accessToken) throw new Error('認証が必要です');

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user-shop-relations/toggle/`,
        {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${accessToken}`,
        },
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
};

/**
 * 店舗の統計情報を取得する
 */
export const fetchShopStats = async (shopId: string): Promise<ShopStats> => {
    const accessToken = typeof window !== 'undefined'
    ? localStorage.getItem('access')
        : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `JWT ${accessToken}`;
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user-shop-relations/shop_stats/?shop_id=${shopId}`,
        { headers }
    );

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('認証が必要です。再度ログインしてください。');
        }
        throw new Error('店舗の統計情報の取得に失敗しました');
    }

    return response.json();
};