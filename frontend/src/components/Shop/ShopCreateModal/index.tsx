"use client";

import React, { useState } from "react";
import {Modal, ModalBody, ModalContent, ModalFooter} from "@nextui-org/modal";
import {Spinner} from "@nextui-org/react";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import ButtonGradient from "@/components/UI/ButtonGradient";
import styles from './style.module.scss';
import type { ShopFormValues } from "@/types/shops";
import { createShop } from "@/actions/shop/createShop";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    formValues: ShopFormValues;
    setCurrentStep: (step: number) => void;
    onShopCreated?: (shopId: number) => void;
};

const ShopCreateModal = ({ isOpen,　onClose, formValues, setCurrentStep, onShopCreated }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateShop = async () => {
        setIsLoading(true);
        setError(null);
        
        const accessToken = typeof window !== 'undefined'
            ? localStorage.getItem('access')
            : null;

        if (!accessToken) {
            setError("ログインが必要です");
            setIsLoading(false);
            return;
        }

        try {
            const result = await createShop(formValues, accessToken);

            if (result.success) {
                if (onShopCreated && (result.data?.id || result.data?.shop_id)) {
                    onShopCreated(result.data?.id || result.data?.shop_id);
                }
                setCurrentStep(2);
                onClose();
            } else {
                setError(`登録に失敗しました: ${result.error}`);
            }
        } catch (err) {
            console.error('店舗登録エラー:', err);
            setError('予期せぬエラーが発生しました。もう一度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={!isLoading ? onClose : undefined}>
                <ModalContent className={styles.modalContent}>
                    {() => (
                        <>
                            <ModalBody>
                                <p>この内容で登録しますか？</p>
                                {error && (
                                    <div className={styles.errorMessage}>
                                        {error}
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <ButtonGradientWrapper 
                                    anotherStyle={""} 
                                    onClick={isLoading ? undefined : onClose}
                                >
                                    CLOSE
                                </ButtonGradientWrapper>
                                <ButtonGradient 
                                    anotherStyle={""} 
                                    onClick={isLoading ? undefined : handleCreateShop}
                                >
                                    {isLoading ? <Spinner size="sm" color="white" /> : "CREATE"}
                                </ButtonGradient>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
};

export default ShopCreateModal;
