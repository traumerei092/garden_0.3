import { toast } from 'sonner';
import { CircleCheck, CircleAlert } from "lucide-react";

/** ✅ ログイン成功時のカスタムトースト */
export const showLoginToast = () => {
    toast.custom(
        () => (
            <div
                className="px-4 py-3 rounded-lg border min-w-32 min-h-24 overflow-hidden flex gap-2"
                style={{
                    borderColor: 'rgba(0, 178, 255, 1)',
                    backgroundColor: 'rgba(0, 178, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 1)',
                    fontSize: '12px',
                    minWidth: '150px',
                    minHeight: '24px',
                }}
            >
                <CircleCheck color="#ffffff" size={"18px"}/>
                おかえりなさい！
            </div>
        ),
        { duration: 3000 }
    );
};

/** ✅ プロフィール更新成功時のカスタムトースト */
export const showProfileUpdateToast = () => {
    toast.custom(
        () => (
            <div
                className="px-4 py-3 rounded-lg border min-w-32 min-h-24 overflow-hidden flex gap-2"
                style={{
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.3)',
                    color: 'rgba(255, 255, 255, 1)',
                    fontSize: '12px',
                    minWidth: '150px',
                    minHeight: '24px',
                }}
            >
                <CircleCheck color="#ffffff" size={"18px"}/>
                プロフィールを更新しました
            </div>
        ),
        { duration: 3000 }
    );
};

/** 🔒 パスワード変更成功時のカスタムトースト */
export const showPasswordChangeToast = () => {
    toast.custom(
        () => (
            <div
                className="px-4 py-3 rounded-lg border min-w-32 min-h-24 overflow-hidden flex gap-2"
                style={{
                    borderColor: 'rgba(168, 85, 247, 1)',
                    backgroundColor: 'rgba(168, 85, 247, 0.3)',
                    color: 'rgba(255, 255, 255, 1)',
                    fontSize: '12px',
                    minWidth: '150px',
                    minHeight: '24px',
                }}
            >
                <CircleCheck color="#ffffff" size={"18px"}/>
                パスワードを変更しました
            </div>
        ),
        { duration: 3000 }
    );
};

/** ❌ エラー時のカスタムトースト */
export const showErrorToast = (message: string) => {
    toast.custom(
        () => (
            <div
                className="px-4 py-3 rounded-lg border min-w-32 min-h-24 overflow-hidden flex gap-2"
                style={{
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    color: 'rgba(255, 255, 255, 1)',
                    fontSize: '12px',
                    minWidth: '150px',
                    minHeight: '24px',
                }}
            >
                <CircleAlert color="#ffffff" size={"18px"}/>
                {message}
            </div>
        ),
        { duration: 5000 }
    );
};

/** 🚪 ログアウト時のカスタムトースト */
export const showLogoutToast = () => {
    toast.custom(
        () => (
            <div
                className="px-4 py-3 rounded-lg border min-w-32 min-h-24 overflow-hidden flex gap-2"
                style={{
                    borderColor: 'rgba(0, 255, 255, 1)',
                    backgroundColor: 'rgba(0, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 1)',
                    fontSize: '12px',
                    minWidth: '150px',
                    minHeight: '24px',
                }}
            >
                <CircleAlert color="#ffffff" size={"18px"}/>
                またお待ちしてますね！
            </div>
        ),
        { duration: 3000 }
    );
};

/** 汎用トースト関数 */
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
        toast.custom(
            () => (
                <div
                    className="px-4 py-3 rounded-lg border min-w-32 min-h-24 overflow-hidden flex gap-2"
                    style={{
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.3)',
                        color: 'rgba(255, 255, 255, 1)',
                        fontSize: '12px',
                        minWidth: '150px',
                        minHeight: '24px',
                    }}
                >
                    <CircleCheck color="#ffffff" size={"18px"}/>
                    {message}
                </div>
            ),
            { duration: 3000 }
        );
    } else {
        showErrorToast(message);
    }
};
