import { toast } from 'sonner';
import {CircleCheck,CircleAlert} from "lucide-react";

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