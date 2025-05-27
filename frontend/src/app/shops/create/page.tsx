import React from 'react';
import styles from './style.module.scss';
import Header from "@/components/Header/Header";
import ShopCreate from "@/components/shop/ShopCreate";

const shopCreate = () => {
    return (
        <div className={styles.container}>
            <Header/>
            <ShopCreate />
        </div>
    );
};

export default shopCreate;