"use client";

import React from "react";
import {Modal, ModalBody, ModalContent, ModalFooter} from "@nextui-org/modal";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import ButtonGradient from "@/components/UI/ButtonGradient";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/actions/auth/logout";
import styles from './style.module.scss';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const LogoutModal = ({ isOpen,　onClose }: Props) => {
    const router = useRouter();

    const handleLogout = () => {
        logoutUser(); // 状態を初期化
        router.push('/login'); // ログインページへ遷移
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
