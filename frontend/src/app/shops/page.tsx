'use client';

import React, { useState } from 'react';
import styles from './style.module.scss';
import ShopList from "@/components/Shop/ShopList";
import Header from "@/components/Layout/Header";
import ShopListHeader from "@/components/Shop/ShopListHeader";

const shops = () => {
    const [selectedTab, setSelectedTab] = useState<string>('list');
    const [isMobile, setIsMobile] = useState(false);

    // モバイル判定
    React.useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // モバイルの場合は強制的にgridモードにする
    const effectiveViewMode = isMobile ? 'grid' : selectedTab;

    return (
        <div className={styles.container}>
            <Header/>
            <ShopListHeader 
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
            />
            <ShopList viewMode={effectiveViewMode} />
        </div>
    );
};

export default shops;
