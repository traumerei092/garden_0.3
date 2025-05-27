'use server'

import { Shop } from "@/types/shops";

export const fetchShops = async (): Promise<Shop[]> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/`, {
        cache: "no-store", // SSR時に毎回最新を取得（必要に応じて調整）
    });
    console.log("res:", res); // 一時追加

    if (!res.ok) {
        throw new Error("Failed to fetch shops");
    }

    const data = await res.json();
    console.log("data:", data); // 一時追加
    console.log("data:", data); // 登録されたショップ一覧が出力される

    return data;
};