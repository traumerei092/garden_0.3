import React from 'react';
import styles from './style.module.scss';
import ShopList from "@/components/Shop/ShopList";
import Header from "@/components/Layout/Header";
import ShopListHeader from "@/components/Shop/ShopListHeader";

const shops = () => {
    return (
        <div className={styles.container}>
            <Header/>
            <ShopListHeader />
            <ShopList />
        </div>
    );
};

export default shops;