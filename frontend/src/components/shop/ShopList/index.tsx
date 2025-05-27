'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shop } from "@/types/shops";
import { fetchShops } from "@/actions/shop/fetchShop";
import { getCurrentPosition, calculateDistance, formatDistance } from '@/utils/location';
import styles from './style.module.scss';
import LinkDefault from "@/components/UI/LinkDefault";
import { useAuthStore } from "@/store/useAuthStore";
import ShopCard from "../ShopCard";
import { Button, Spinner } from "@nextui-org/react";

const ShopList = () => {

    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [distances, setDistances] = useState<{ [key: number]: string | null }>({});
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const targetUrl = user ? '/shops/create' : '/login';

    useEffect(() => {
        const loadShops = async () => {
            try {
                setIsLoading(true);
                const data = await fetchShops();
                console.log('取得した店舗データ:', data);
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
    }, []);

    // 店舗データが更新されたら距離を計算する
    useEffect(() => {
        console.log('shops state更新:', shops);
        if (shops && shops.length > 0) {
            console.log('店舗データが存在するため、距離計算を実行します');
            loadLocationData();
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
        <div className={styles.container}>
            {shops.map((shop) => (
                <ShopCard
                    key={shop.id}
                    name={shop.name}
                    prefecture={shop.prefecture}
                    city={shop.city}
                    images={shop.images}
                    shop_types={Array.isArray(shop.shop_types) ? shop.shop_types.map((type) => type.name) : []}
                    shop_layouts={Array.isArray(shop.shop_layouts) ? shop.shop_layouts.map((layout) => layout.name) : []}
                    shop_options={Array.isArray(shop.shop_options) ? shop.shop_options.map((option) => option.name) : []}
                    onPress={() => router.push(`/shops/${shop.id}`)}
                    shopDetail={`/shops/${shop.id}`}
                    distance={distances[shop.id]}
                    tags={shop.tags || []}
                />
            ))}
            <LinkDefault href={targetUrl} styleName={"link"}>
                お店が見つからない場合はこちら
            </LinkDefault>
        </div>
    );
};

export default ShopList;
