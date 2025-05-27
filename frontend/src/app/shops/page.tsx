import React from 'react';
import styles from './style.module.scss';
import ShopList from "@/components/shop/ShopList";
import Header from "@/components/Header/Header";
import ShopListHeader from "@/components/shop/ShopListHeader";

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