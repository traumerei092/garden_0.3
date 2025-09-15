'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shop, ShopStats } from "@/types/shops";
import { fetchShops } from "@/actions/shop/fetchShop";
import { toggleShopRelation, fetchShopStats } from '@/actions/shop/relation';
import { getCurrentPosition, calculateDistance, formatDistance } from '@/utils/location';
import { SearchFilters } from '@/types/search';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import styles from './style.module.scss';
import LinkDefault from "@/components/UI/LinkDefault";
import { useAuthStore } from "@/store/useAuthStore";
import ShopCard from "../ShopCard";
import ShopGridCard from "../ShopGridCard";
import { Button, Spinner } from "@nextui-org/react";

interface ShopListProps {
    viewMode?: string;
    searchFilters?: SearchFilters;
    onShopCountChange?: (count: number) => void;
}

const ShopList: React.FC<ShopListProps> = ({ viewMode = 'list', searchFilters, onShopCountChange }) => {

    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [distances, setDistances] = useState<{ [key: number]: string | null }>({});
    const [shopStats, setShopStats] = useState<{ [key: number]: ShopStats }>({});
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const targetUrl = user ? '/shops/create' : '/login';

    // 検索条件に基づく店舗データ取得
    const fetchShopsWithFilters = async (filters?: SearchFilters) => {
        try {
            console.log('fetchShopsWithFilters called with filters:', filters);
            
            if (filters && Object.keys(filters).length > 0) {
                // 検索条件がある場合は検索APIを使用
                const queryParams = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        if (Array.isArray(value)) {
                            if (value.length > 0) {
                                value.forEach(item => {
                                    queryParams.append(key, item.toString());
                                });
                            }
                        } else if (typeof value === 'object') {
                            queryParams.append(key, JSON.stringify(value));
                        } else {
                            queryParams.append(key, value.toString());
                        }
                    }
                });
                
                console.log('=== ShopList API Call Debug ===');
                console.log('Raw filters object:', filters);
                console.log('Query params:', queryParams.toString());
                const apiUrl = `/shops/search/?${queryParams.toString()}`;
                console.log('API URL:', apiUrl);
                console.log('=== End Debug ===');

                const response = await fetchWithAuth(apiUrl, {
                    method: 'GET',
                    cache: 'no-store'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const shopData = data.results || data.shops || [];
                    console.log('フィルタリング後の店舗データ:', shopData);
                    
                    // 親コンポーネントに件数を通知
                    if (onShopCountChange) {
                        onShopCountChange(data.count || shopData.length);
                    }
                    
                    return shopData;
                } else {
                    console.error('検索APIエラー:', response.status);
                    return [];
                }
            } else {
                // 検索条件がない場合は全件取得
                const data = await fetchShops();
                if (onShopCountChange) {
                    onShopCountChange(data.length);
                }
                return data;
            }
        } catch (error) {
            console.error('店舗データ取得エラー:', error);
            return [];
        }
    };

    useEffect(() => {
        console.log('=== ShopList useEffect triggered ===');
        console.log('searchFilters changed:', searchFilters);
        console.log('searchFilters type:', typeof searchFilters);
        console.log('searchFilters keys:', searchFilters ? Object.keys(searchFilters) : 'null');

        const loadShops = async () => {
            try {
                setIsLoading(true);
                const data = await fetchShopsWithFilters(searchFilters);
                console.log('ShopList: API結果取得:', data ? data.length : 0, '件');
                setShops(data);
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : '不明なエラーが発生しました';
                console.error("店舗データの取得エラー:", {
                    error,
                    message: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined
                });
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadShops();
    }, [searchFilters]);

    // 店舗データが更新されたら距離を計算し、統計データを取得する
    useEffect(() => {
        console.log('shops state更新:', shops);
        if (shops && shops.length > 0) {
            console.log('店舗データが存在するため、距離計算と統計データ取得を実行します');
            loadLocationData();
            loadShopStats();
        }
    }, [shops]); // shopsの変更を監視

    // 各店舗の統計データを取得
    const loadShopStats = async () => {
        const newShopStats: { [key: number]: ShopStats } = {};
        
        for (const shop of shops) {
            try {
                const stats = await fetchShopStats(shop.id.toString());
                newShopStats[shop.id] = stats;
            } catch (error) {
                console.error(`店舗${shop.id}の統計データ取得に失敗:`, error);
                // デフォルトの統計データを設定
                newShopStats[shop.id] = {
                    counts: [
                        { id: 3, name: 'favorite', label: '行きつけ', count: 0, color: '#00ffff' },
                        { id: 1, name: 'visited', label: '行った', count: 0, color: '#ffc107' },
                        { id: 2, name: 'interested', label: '行きたい', count: 0, color: '#ef4444' }
                    ],
                    user_relations: []
                };
            }
        }
        
        setShopStats(newShopStats);
    };

    // リレーションの切り替え処理
    const handleRelationToggle = async (shopId: number, relationTypeId: number) => {
        try {
            await toggleShopRelation(shopId.toString(), relationTypeId);
            // 統計データを更新
            const updatedStats = await fetchShopStats(shopId.toString());
            setShopStats(prev => ({
                ...prev,
                [shopId]: updatedStats
            }));
        } catch (error) {
            console.error('リレーションの切り替えに失敗:', error);
        }
    };

    // 位置情報を取得して距離を計算
    const loadLocationData = async () => {
        console.log('loadLocationData開始');
        if (!shops.length) {
            console.log('店舗データが空のため、距離計算をスキップします');
            return;
        }
        
        try {
            setIsLocationLoading(true);
            const position = await getCurrentPosition();
            console.log('現在位置を取得しました:', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
            const newDistances: { [key: number]: string } = {};

            for (const shop of shops) {
                console.log('店舗の距離を計算中:', {
                    shopId: shop.id,
                    shopName: shop.name,
                    hasLatitude: !!shop.latitude,
                    hasLongitude: !!shop.longitude,
                    latitude: shop.latitude,
                    longitude: shop.longitude
                });
                if (shop.latitude && shop.longitude) {
                    const dist = calculateDistance(
                        position.coords.latitude,
                        position.coords.longitude,
                        shop.latitude,
                        shop.longitude
                    );
                    newDistances[shop.id] = formatDistance(dist);
                    
                    console.log('距離計算結果:', {
                        shopName: shop.name,
                        distance: dist,
                        formattedDistance: newDistances[shop.id]
                    });
                }
            }

            console.log('計算された距離一覧:', newDistances);
            setDistances(newDistances);
        } catch (error) {
            console.error('位置情報の取得に失敗しました:', error);
        } finally {
            setIsLocationLoading(false);
        }
    };

    if (isLoading) {
        return <div><Spinner className={styles.loading}/></div>;
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>エラーが発生しました：</p>
                <p>{error}</p>
                <Button onPress={() => window.location.reload()} color="danger">
                    再読み込み
                </Button>
            </div>
        );
    }

    if (!shops || shops.length === 0) {
        return <div>登録された店舗がありません</div>;
    }

    // デフォルトのリレーションタイプ
    const favoriteRelation = {
        id: 1,
        name: 'favorite',
        label: '行きつけ',
        count: 0,
        color: '#00ffff'
    };

    const visitedRelation = {
        id: 2,
        name: 'visited',
        label: '行った',
        count: 0,
        color: '#ffc107'
    };

    const interestedRelation = {
        id: 3,
        name: 'interested',
        label: '行きたい',
        count: 0,
        color: '#ef4444'
    };

    return (
        <div className={`${styles.container} ${viewMode === 'grid' ? styles.gridContainer : ''}`}>
            {shops.map((shop) => {
                const stats = shopStats[shop.id] || {
                    counts: [
                        { id: 3, name: 'favorite', label: '行きつけ', count: 0, color: '#00ffff' },
                        { id: 1, name: 'visited', label: '行った', count: 0, color: '#ffc107' },
                        { id: 2, name: 'interested', label: '行きたい', count: 0, color: '#ef4444' }
                    ],
                    user_relations: []
                };

                const userRelations: { [key: number]: boolean } = {};
                if (stats?.user_relations) {
                    stats.user_relations.forEach((relationTypeId: number) => {
                        userRelations[relationTypeId] = true;
                    });
                }

                if (viewMode === 'grid') {
                    return (
                        <ShopGridCard
                            key={shop.id}
                            id={shop.id}
                            name={shop.name}
                            area={`${shop.prefecture} ${shop.city}`}
                            imageUrl={shop.images && shop.images.length > 0 ? shop.images[0].image_url : null}
                            distance={distances[shop.id] || undefined}
                            matchRate={75}
                            favoriteRelation={favoriteRelation}
                            visitedRelation={visitedRelation}
                            interestedRelation={interestedRelation}
                            userRelations={userRelations}
                            onRelationToggle={(relationTypeId) => handleRelationToggle(shop.id, relationTypeId)}
                        />
                    );
                } else {
                    return (
                        <ShopCard
                            key={shop.id}
                            name={shop.name}
                            prefecture={shop.prefecture}
                            city={shop.city}
                            images={shop.images}
                            shop_types={shop.shop_types}
                            shop_layouts={shop.shop_layouts}
                            shop_options={shop.shop_options}
                            onPress={() => router.push(`/shops/${shop.id}`)}
                            shopDetail={`/shops/${shop.id}`}
                            distance={distances[shop.id]}
                            tags={shop.tags}
                            matchRate={75}
                            shopStats={stats}
                            onRelationToggle={(relationTypeId) => handleRelationToggle(shop.id, relationTypeId)}
                        />
                    );
                }
            })}
            <LinkDefault href={targetUrl} styleName={"link"}>
                お店が見つからない場合はこちら
            </LinkDefault>
        </div>
    );
};

export default ShopList;
