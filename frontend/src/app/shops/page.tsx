'use client';

import React, { useState, useEffect } from 'react';
import styles from './style.module.scss';
import ShopList from "@/components/Shop/ShopList";
import Header from "@/components/Layout/Header";
import ShopListHeader from "@/components/Shop/ShopListHeader";
import ShopSearchModal from "@/components/Shop/ShopSearchModal";
import { SearchFilters } from '@/types/search';

const shops = () => {
    const [selectedTab, setSelectedTab] = useState<string>('list');
    const [isMobile, setIsMobile] = useState(false);
    const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
    const [shopCount, setShopCount] = useState<number>(0);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    // モバイル判定
    React.useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // URL検索パラメータから検索条件を読み取り
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const filters: SearchFilters = {};

            // URLパラメータが存在しない場合は空のオブジェクトを設定
            if (urlParams.toString() === '') {
                setSearchFilters({});
                return;
            }

            // URLパラメータを整理して配列とスカラー値を分ける
            const paramMap: { [key: string]: string[] } = {};
            urlParams.forEach((value, key) => {
                if (!paramMap[key]) {
                    paramMap[key] = [];
                }
                paramMap[key].push(value);
            });

            // パラメータを適切な形式に変換
            Object.entries(paramMap).forEach(([key, values]) => {
                try {
                    if (values.length === 1) {
                        const value = values[0];
                        // JSON形式の場合はオブジェクトとしてパース
                        if (value.startsWith('[') || value.startsWith('{')) {
                            filters[key as keyof SearchFilters] = JSON.parse(value);
                        } else {
                            // 数値に変換可能な場合は変換
                            const numValue = Number(value);
                            if (!isNaN(numValue) && value !== '') {
                                (filters as any)[key] = numValue;
                            } else {
                                (filters as any)[key] = value;
                            }
                        }
                    } else {
                        // 複数の値がある場合は配列として扱う
                        // 数値配列が期待されるフィールドは変換
                        if (['shop_types', 'shop_layouts', 'shop_options', 'area_ids', 'alcohol_categories', 'alcohol_brands', 'regular_interests', 'regular_mbti_types', 'regular_blood_types', 'regular_exercise_frequency', 'regular_dietary_preferences', 'regular_alcohol_preferences'].includes(key)) {
                            const numValues = values.map(v => parseInt(v)).filter(n => !isNaN(n));
                            (filters as any)[key] = numValues.length > 0 ? numValues : values;
                        } else {
                            (filters as any)[key] = values;
                        }
                    }
                } catch (error) {
                    // パースに失敗した場合は文字列として扱う
                    (filters as any)[key] = values.length === 1 ? values[0] : values;
                }
            });

            console.log('URLから読み取ったfilters:', filters);
            setSearchFilters(filters);
        }
    }, []);

    // 検索条件の数を計算
    const filterCount = searchFilters ? Object.keys(searchFilters).length : 0;

    // モバイルの場合は強制的にgridモードにする
    const effectiveViewMode = isMobile ? 'grid' : selectedTab;

    const handleSearch = () => {
        setIsSearchModalOpen(true);
    };

    const handleSearchModalClose = () => {
        setIsSearchModalOpen(false);
    };

    const handleSearchFiltersUpdate = (filters: SearchFilters) => {
        console.log('=== Shopsページでフィルター更新 ===');
        console.log('受信したfilters:', filters);
        console.log('現在のsearchFilters:', searchFilters);

        setSearchFilters(filters);

        // URLパラメータを更新
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

        console.log('構築されたURLパラメータ:', params.toString());

        // URLを更新（ページリロードなし）
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);

        console.log('更新されたURL:', newUrl);

        setIsSearchModalOpen(false);
    };

    return (
        <div className={styles.container}>
            <Header/>
            <ShopListHeader 
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
                shopCount={shopCount}
                filterCount={filterCount}
                onSearch={handleSearch}
            />
            {searchFilters !== null && (
                <ShopList
                    viewMode={effectiveViewMode}
                    searchFilters={searchFilters}
                    onShopCountChange={setShopCount}
                />
            )}
            <ShopSearchModal
                isOpen={isSearchModalOpen}
                onClose={handleSearchModalClose}
                onSearch={handleSearchFiltersUpdate}
                initialFilters={searchFilters || {}}
            />
        </div>
    );
};

export default shops;
