'use client'

import HeroText from '@/components/UI/HeroText';
import styles from './style.module.scss'
import React from 'react';
import { useRouter } from "next/navigation";
import ButtonGradient from "@/components/UI/ButtonGradient";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import InputDefault from "@/components/UI/InputDefault";
import Header from "@/components/Layout/Header";
import { getCurrentPosition } from '@/utils/location';

export default function Home() {

    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);


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

    return (
        <main className={styles.main}>
            <div className={styles.backgroundImage}/>
            <div className={styles.overlay}/>
            <div className={styles.content}>
                <Header/>
                <div className={styles.container}>
                    <div className={styles.firstView}>
                        <HeroText/>
                        <ButtonGradient anotherStyle={styles.anotherStyle}>
                            あなたにマッチするお店を探す（Coming soon）
                        </ButtonGradient>
                        <div className={styles.firstViewUnder}>
                            <ButtonGradientWrapper
                                anotherStyle={styles.anotherStyle}

                            >
                                条件で探す
                            </ButtonGradientWrapper>
                            <ButtonGradientWrapper
                                anotherStyle={styles.anotherStyle}
                                onClick={handleLocationClick}
                                disabled={isLoading}
                            >
                                {isLoading ? '位置情報を取得中...' : '現在地から探す'}
                            </ButtonGradientWrapper>
                        </div>
                        <InputDefault
                            label="キーワードで探す"
                            type="text"
                            name={""}
                            value={""}
                            onChange={handleLocationClick}
                            anotherStyle={""}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
