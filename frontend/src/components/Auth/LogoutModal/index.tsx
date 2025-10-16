"use client";

import React from "react";
import CustomModal from "@/components/UI/Modal";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import ButtonGradient from "@/components/UI/ButtonGradient";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { showLogoutToast } from "@/utils/toasts";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const LogoutModal = ({ isOpen,　onClose }: Props) => {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // モーダルを先に閉じる
            onClose();

            // NextAuthセッションをクリア
            await signOut({
                redirect: false, // 自動リダイレクトを無効化
                callbackUrl: '/login' // ログアウト後のURL指定
            });

            // 古いトークンもクリア（互換性のため）
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
            }

            // ログアウトトースト表示
            showLogoutToast();

            // 少し待ってからログインページに遷移（セッションクリアを確実にするため）
            setTimeout(() => {
                router.push('/login');
            }, 100);
        } catch (error) {
            console.error('Logout error:', error);
            onClose();
            // エラーが発生してもログインページに遷移
            router.push('/login');
        }
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={onClose}
            title="ログアウト確認"
            footer={
                <>
                    <ButtonGradientWrapper anotherStyle={""} onClick={onClose}>CLOSE</ButtonGradientWrapper>
                    <ButtonGradient anotherStyle={""} onClick={handleLogout}>LOG OUT</ButtonGradient>
                </>
            }
        >
            <p>ログアウトしますか？</p>
        </CustomModal>
    );
};

export default LogoutModal;
