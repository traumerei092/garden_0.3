'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Shop } from "@/types/shops";
import { fetchShops } from "@/actions/shop/fetchShop";
import { fetchSortedShops, getDefaultSortKey } from "@/actions/shop/sort";
import { getCurrentPosition, calculateDistance, formatDistance } from '@/utils/location';
import { SearchFilters } from '@/types/search';
import { useShopActions } from '@/hooks/useShopActions';
import { fetchWelcomeData } from "@/actions/shop/welcome";
import styles from './style.module.scss';
import LinkDefault from "@/components/UI/LinkDefault";
import { useAuthSession } from "@/hooks/useAuthSession";
import ShopCard from "../ShopCard";
import ShopGridCard from "../ShopGridCard";
import ShopFeedbackModal from "../ShopFeedbackModal";
import { Button, Spinner } from "@nextui-org/react";

interface ShopListProps {
    viewMode?: string;
    searchFilters?: SearchFilters;
    sortKey?: string;
    onShopCountChange?: (count: number) => void;
}

const ShopList: React.FC<ShopListProps> = ({ viewMode = 'list', searchFilters, sortKey, onShopCountChange }) => {

    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [distances, setDistances] = useState<{ [key: number]: string | null }>({});
    const [welcomeCounts, setWelcomeCounts] = useState<{ [key: number]: number }>({});
    const [feedbackModalShopId, setFeedbackModalShopId] = useState<number | null>(null);
    const router = useRouter();
    const { user } = useAuthSession();
    const targetUrl = user ? '/shops/create' : '/login';

    // カスタムフックでShopActionButtonのロジックを統一（メモ化で無限ループ防止）
    const memoizedShops = useMemo(() => shops, [shops]);
    const {
        shopStats,
        handleRelationToggle,
        getUserRelations,
        refreshShopStats,
        relations
    } = useShopActions({
        shops: memoizedShops,
        onFeedbackModalOpen: setFeedbackModalShopId
    });


    // 検索条件に基づく店舗データ取得
    const fetchShopsWithFilters = async (filters?: SearchFilters, currentSortKey?: string) => {
        try {
            console.log('fetchShopsWithFilters called with filters:', filters, 'sortKey:', currentSortKey);

            // 常にソートAPIを使用（より安定した動作のため）
            const sortKey = currentSortKey || getDefaultSortKey();
            console.log('=== Using Sort API ===');
            console.log('Final sort key:', sortKey);

            const response = await fetchSortedShops(sortKey, (filters as Record<string, string | number | boolean | string[]>) || {});

            // 親コンポーネントに件数を通知
            if (onShopCountChange) {
                onShopCountChange(response.count || response.results.length);
            }

            console.log('ソート済み店舗データ:', response.results);
            return response.results;
        } catch (error) {
            console.error('店舗データ取得エラー:', error);
            return [];
        }
    };

    useEffect(() => {
        console.log('=== ShopList useEffect triggered ===');
        console.log('searchFilters changed:', searchFilters);
        console.log('sortKey changed:', sortKey);
        console.log('searchFilters type:', typeof searchFilters);
        console.log('searchFilters keys:', searchFilters ? Object.keys(searchFilters) : 'null');

        const loadShops = async () => {
            try {
                setIsLoading(true);
                const data = await fetchShopsWithFilters(searchFilters, sortKey);
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
    }, [searchFilters, sortKey]);

    // 店舗データが更新されたら距離とウェルカム数を取得する
    useEffect(() => {
        console.log('shops state更新:', shops);
        if (shops && shops.length > 0) {
            console.log('店舗データが存在するため、距離計算とウェルカム数取得を実行します');
            loadLocationData();
            loadWelcomeData();
        }
    }, [shops]); // shopsの変更を監視


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

    // ウェルカム数を取得
    const loadWelcomeData = async () => {
        console.log('loadWelcomeData開始');
        if (!shops.length) {
            console.log('店舗データが空のため、ウェルカム数取得をスキップします');
            return;
        }

        try {
            const newWelcomeCounts: { [key: number]: number } = {};

            for (const shop of shops) {
                console.log('店舗のウェルカム数を取得中:', {
                    shopId: shop.id,
                    shopName: shop.name
                });

                const welcomeData = await fetchWelcomeData(shop.id);
                if (welcomeData) {
                    newWelcomeCounts[shop.id] = welcomeData.welcome_count;
                    console.log('ウェルカム数取得結果:', {
                        shopName: shop.name,
                        welcomeCount: welcomeData.welcome_count
                    });
                } else {
                    newWelcomeCounts[shop.id] = 0;
                }
            }

            console.log('取得されたウェルカム数一覧:', newWelcomeCounts);
            setWelcomeCounts(newWelcomeCounts);
        } catch (error) {
            console.error('ウェルカム数の取得に失敗しました:', error);
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

    return (
        <div className={`${styles.container} ${viewMode === 'grid' ? styles.gridContainer : ''}`}>
            {shops.map((shop) => {
                const stats = shopStats[shop.id];
                const userRelations = getUserRelations(shop.id);

                if (viewMode === 'grid') {
                    return (
                        <ShopGridCard
                            key={shop.id}
                            id={shop.id}
                            name={shop.name}
                            area={`${shop.prefecture} ${shop.city}`}
                            imageUrl={shop.images && shop.images.length > 0 ? shop.images[0].image_url : null}
                            distance={distances[shop.id] || undefined}
                            welcomeCount={welcomeCounts[shop.id] || 0}
                            favoriteRelation={relations.favorite}
                            visitedRelation={relations.visited}
                            interestedRelation={relations.interested}
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
                            welcomeCount={welcomeCounts[shop.id] || 0}
                            shopStats={stats}
                            onRelationToggle={(relationTypeId) => handleRelationToggle(shop.id, relationTypeId)}
                        />
                    );
                }
            })}
            <LinkDefault href={targetUrl} styleName={"link"}>
                お店が見つからない場合はこちら
            </LinkDefault>

            {/* フィードバックモーダル */}
            {feedbackModalShopId && (
                <ShopFeedbackModal
                    isOpen={!!feedbackModalShopId}
                    onClose={() => setFeedbackModalShopId(null)}
                    shop={shops.find(s => s.id === feedbackModalShopId) as Shop}
                    onDataUpdate={() => feedbackModalShopId && refreshShopStats && refreshShopStats(feedbackModalShopId)}
                />
            )}
        </div>
    );
};

export default ShopList;
