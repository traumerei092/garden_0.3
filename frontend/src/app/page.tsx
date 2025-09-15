'use client'

import HeroText from '@/components/UI/HeroText';
import styles from './style.module.scss'
import React from 'react';
import { useRouter } from "next/navigation";
import ButtonGradient from "@/components/UI/ButtonGradient";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import Header from "@/components/Layout/Header";
import ShopSearchModal from "@/components/Shop/ShopSearchModal";
import { Card, CardBody, Input } from '@nextui-org/react';
import { SearchFilters } from '@/types/search';

export default function Home() {

    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
    const [isSearching, setIsSearching] = React.useState(false);

    const handleLocationClick = async () => {
        try {
            setIsLoading(true);
            // エラーの詳細を確認するためのコード
            if (!navigator.geolocation) {
                console.error('Geolocationがサポートされていません');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('位置情報取得成功:', position);
                    router.push('/shops');
                },
                (error) => {
                    console.error('位置情報取得エラー:', {
                        code: error.code,
                        message: error.message,
                        PERMISSION_DENIED: error.PERMISSION_DENIED,
                        POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                        TIMEOUT: error.TIMEOUT
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } catch (error) {
            console.error('位置情報の取得に失敗しました:', error);
            // 位置情報が取得できなかった場合でもショップ一覧に遷移
            router.push('/shops');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchClick = () => {
        setIsSearchModalOpen(true);
    };

    const handleSearchModalClose = () => {
        setIsSearchModalOpen(false);
    };

    const handleSearch = async (filters: SearchFilters) => {
        try {
            setIsSearching(true);
            console.log('Home page: Search filters received:', filters);

            // URLパラメータを構築
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        // 配列の場合は複数のパラメータとして追加
                        value.forEach(item => {
                            params.append(key, item.toString());
                        });
                    } else if (typeof value === 'object') {
                        params.set(key, JSON.stringify(value));
                    } else {
                        params.set(key, value.toString());
                    }
                }
            });

            const searchUrl = `/shops?${params.toString()}`;
            console.log('Home page: Navigating to:', searchUrl);

            // 検索条件をURLパラメータとして含めて店舗一覧ページに遷移
            router.push(searchUrl);
            setIsSearchModalOpen(false);
        } catch (error) {
            console.error('Search error:', error);
            // エラーハンドリング - 後で適切なエラー表示を実装
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.backgroundImage}/>
            <div className={styles.overlay}/>
            <div className={styles.content}>
                <Header/>
                <div className={styles.container}>
                    <div className={styles.firstView}>
                        <HeroText/>
                        <Card className={styles.searchCard} radius="lg">
                            <CardBody className={styles.searchCardBody}>
                                <ButtonGradient anotherStyle={styles.anotherStyle}>
                                    あなたにマッチするお店を探す（Coming soon）
                                </ButtonGradient>
                                <div className={styles.firstViewUnder}>
                                    <ButtonGradientWrapper
                                        anotherStyle={styles.buttonStyle}
                                        onClick={handleSearchClick}
                                    >
                                        こだわり条件で探す
                                    </ButtonGradientWrapper>
                                    <ButtonGradientWrapper
                                        anotherStyle={styles.buttonStyle}
                                        onClick={handleLocationClick}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? '位置情報を取得中...' : '現在地から探す'}
                                    </ButtonGradientWrapper>
                                </div>
                                <Input
                                    placeholder="キーワードで探す"
                                    className={styles.searchInput}
                                    classNames={{
                                        base: styles.searchInputBase,
                                        mainWrapper: styles.searchInputMainWrapper,
                                        input: styles.searchInputField,
                                        inputWrapper: styles.searchInputWrapper,
                                    }}
                                    variant="bordered"
                                    size="lg"
                                />
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
            
            {/* 検索モーダル */}
            <ShopSearchModal
                isOpen={isSearchModalOpen}
                onClose={handleSearchModalClose}
                onSearch={handleSearch}
                isLoading={isSearching}
            />
        </main>
    );
}
