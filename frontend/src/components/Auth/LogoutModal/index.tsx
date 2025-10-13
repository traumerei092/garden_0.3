"use client";

import React from "react";
import {Modal, ModalBody, ModalContent, ModalFooter} from "@nextui-org/modal";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import ButtonGradient from "@/components/UI/ButtonGradient";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { showLogoutToast } from "@/utils/toasts";
import styles from './style.module.scss';

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
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent className={styles.modalContent}>
                    {() => (
                        <>
                            <ModalBody>
                                <p>ログアウトしますか？</p>
                            </ModalBody>
                            <ModalFooter>
                                <ButtonGradientWrapper anotherStyle={""} onClick={onClose}>CLOSE</ButtonGradientWrapper>
                                <ButtonGradient anotherStyle={""} onClick={handleLogout}>LOG OUT</ButtonGradient>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
};

export default LogoutModal;
