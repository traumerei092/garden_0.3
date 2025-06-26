import { PaymentMethod } from "@/types/shops";
import { fetchWithAuth } from "@/app/lib/fetchWithAuth";

// 支払方法の選択肢を取得する関数
export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
    try {
        console.log('支払方法データ取得開始');
        const url = `${process.env.NEXT_PUBLIC_API_URL}/payment-methods/`;
        console.log('リクエストURL:', url);
        
        // fetchWithAuthを使用して認証情報を含める
        const response = await fetchWithAuth(url, {
            method: "GET",
            cache: "no-store",
        });

        console.log('レスポンスステータス:', response.status);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('エラーレスポンス本文:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const data = await response.json();
        console.log('取得した支払方法データ:', data);
        
        return data;
    } catch (error) {
        console.error("支払方法データ取得エラー:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        // エラー時は空の配列を返す
        return [];
    }
};
