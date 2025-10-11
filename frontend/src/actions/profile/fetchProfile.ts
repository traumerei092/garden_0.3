import { fetchWithSession } from "@/app/lib/fetchWithSession";
import { User } from "@/types/users";

// ユーザープロフィールを取得する関数
export const fetchUserProfile = async (): Promise<User> => {
    try {
        console.log('🚀 ユーザープロフィール取得開始');
        
        const url = `${process.env.NEXT_PUBLIC_API_URL}/accounts/users/me/`;
        console.log('🔗 リクエストURL:', url);
        
        const response = await fetchWithSession(url, {
            method: "GET",
        });

        console.log('📊 レスポンスステータス:', response.status);
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('❌ プロフィール取得エラー:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const userData = await response.json();
        console.log('✅ 取得したユーザーデータ:', userData);
        console.log('📈 興味データ:', userData.interests);
        console.log('🩸 血液型データ:', userData.blood_type);
        console.log('🧠 MBTIデータ:', userData.mbti);
        
        return userData;
    } catch (error) {
        console.error("ユーザープロフィール取得エラー:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}

// プロフィール選択肢データを取得する関数
export const fetchProfileOptions = async () => {
    try {
        console.log('プロフィールオプション取得開始');
        
        const url = `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile-data/`;
        console.log('リクエストURL:', url);
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('レスポンスステータス:', response.status);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('プロフィールオプション取得エラー:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        const profileOptions = await response.json();
        console.log('取得したプロフィールオプション:', profileOptions);
        
        return profileOptions;
    } catch (error) {
        console.error("プロフィールオプション取得エラー:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}
