'use client';

import React, { useState } from 'react';
import styles from './style.module.scss';
import ShopList from "@/components/Shop/ShopList";
import Header from "@/components/Layout/Header";
import ShopListHeader from "@/components/Shop/ShopListHeader";

const shops = () => {
    const [selectedTab, setSelectedTab] = useState<string>('list');

    return (
        <div className={styles.container}>
            <Header/>
            <ShopListHeader 
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
            />
            <ShopList viewMode={selectedTab} />
        </div>
    );
};

export default shops;
